"use client";

import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import {
  ERR_IMAGE_SAFETY_REVIEW,
  MSG_IMAGE_SAFETY_REVIEW,
  createInflightGuard,
  shouldGenerateMaster,
} from "@/lib/master-pipeline";
import {
  buildApiErrorDetails,
  buildFailedStagePatch,
  classifyStorageRetryability,
  createProgressionThrownError,
  normalizeProgressionError,
  parseApiErrorBody,
  sanitizeProgressionLogObject,
} from "@/lib/progression-errors";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { STAGE_ORDER, buildStageImagePrompt } from "@/lib/stage-image-prompts";
import { buildStageFallback, toDataUrl } from "@/lib/stage-fallback";
import { normalizeGenerationStatus, type GenerationStatus, type StageId, type StageImageRecord } from "@/lib/progression";
import {
  userFacingReasons,
  type CompositionValidation,
} from "@/lib/composition-validation";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";
import {
  idleRegenerationFields,
  isRegenerationBusy,
  normalizeRegenerationPhase,
  normalizeRegenerationState,
  type FinalPaintingRegenerationState,
  type RegenerationChecklistPhase,
} from "@/lib/final-painting-regeneration";

// ============================================================================
// Composition-locked, RESUMABLE two-image stage model (client orchestration).
//
// Perceived-wait pipeline (master first, stages after accept):
//   1. Generate + validate the MASTER painting only. Every successful candidate
//      is validated before becoming ready — including pass and
//      warning. Hard-fail after retries still persists the best candidate for
//      review — never a terminal 502 that discards progress.
//   2. Do NOT seed or AI-refine stage images until the user accepts.
//   3. On accept → masterStatus ready, reset stages, open the atelier, and
//      derive stages in the background. Each stage is persisted immediately so
//      the Firestore subscription can fade targets in as they land.
//   4. Optional AI refine (feature flag) still runs one request per unfinished
//      stage after acceptance, chained from the preceding plate.
//
// Atelier Final Painting regeneration (non-blocking):
//   - Accepted masterImageUrl + stages stay visible and unchanged.
//   - A separate candidate is generated/validated/uploaded (master-candidate).
//   - Stages reset only after the user accepts the candidate.
//   - regenerationState tracks queued → generating → validating →
//     candidateReady | error (never blanks the lesson).
//
// Resumability & idempotency:
//   - Per-item status: pending | generating | ready | failed | needsReview.
//   - A document-level LEASE ({owner, expiresAt}) prevents two clients/tabs from
//     running duplicate jobs. It is acquired via a transaction, renewed on every
//     write, and released when done. An expired lease can be taken over after a
//     crash/timeout, and orchestration continues from the first unfinished item.
//   - Every completed item is persisted before the next starts, so a timeout or
//     closed browser never erases finished work.
//
// Storage: image bytes at users/{uid}/projects/{projectId}/stages/{name}.webp
//   (name = stageId | "master" | "master-candidate"). The original reference is
//   never overwritten.
// ============================================================================

export type ImageSize = "1024x1024" | "1024x1536" | "1536x1024";

const IMAGE_MODEL = "gpt-image-1";
const LEASE_MS = 120_000; // a running item must renew within this window

// One id per browser tab/session — identifies the lease owner.
const CLIENT_ID =
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `c_${Math.random().toString(36).slice(2)}`;

interface Lease {
  owner: string;
  expiresAt: number;
}

export interface ProgressionDoc {
  version: number;
  size: ImageSize;
  masterImageUrl: string | null;
  masterPrompt: string | null;
  masterStatus: GenerationStatus;
  masterError: string | null;
  /** Structured validator result for the current master candidate (internal + UI reasons). */
  masterValidation: CompositionValidation | null;
  /** Concise user-facing review reasons derived from masterValidation. */
  masterReviewReasons: string[];
  lease: Lease | null;
  stages: StageImageRecord[];
  /**
   * Atelier regeneration machine. Accepted master remains in masterImageUrl /
   * masterStatus until the user applies a candidate.
   */
  regenerationState: FinalPaintingRegenerationState;
  regenerationStartedAt: number | null;
  regenerationError: string | null;
  regenerationPhase: RegenerationChecklistPhase | null;
  /** Validated replacement Final Painting awaiting Use / Keep. */
  candidateFinalPaintingUrl: string | null;
}

/** Fired as soon as a master candidate exists (before/during Storage upload). */
export type MasterCandidateHandler = (info: {
  previewUrl: string;
  status: "ready" | "needsReview";
  reasons: string[];
  validation: CompositionValidation | null;
}) => void;

function progressionRef(uid: string, projectId: string) {
  return doc(db, "users", uid, "projects", projectId, "detail", "progression");
}

/** Choose one aspect ratio for every image from the reference's shape. */
export function pickSizeForRatio(ratio: number): ImageSize {
  if (!Number.isFinite(ratio) || ratio <= 0) return "1024x1024";
  if (ratio > 1.2) return "1536x1024"; // landscape
  if (ratio < 0.83) return "1024x1536"; // portrait
  return "1024x1024"; // square-ish
}

/** Read a reference File's aspect ratio (width / height) in the browser. */
export function ratioForFile(file: File): Promise<number> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const r = img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1;
      URL.revokeObjectURL(url);
      resolve(r);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(1);
    };
    img.src = url;
  });
}

function initialStages(tutorial: Tutorial, medium: Medium, referenceImageUrl: string): StageImageRecord[] {
  const total = STAGE_ORDER.length;
  return STAGE_ORDER.map((stageId, i) => ({
    stageId,
    index: i + 1,
    referenceImageUrl,
    targetImageUrl: null,
    prompt: buildStageImagePrompt({ tutorial, medium, stageId, index: i + 1, total }),
    model: IMAGE_MODEL,
    generationStatus: "pending",
    error: null,
    retryCount: 0,
    createdAt: null,
    validated: false,
    fallback: false,
    previewSource: null,
  }));
}

// Lessons created before the dedicated pencil-sketch stage stored the first
// stage as "observation". Remap it on read so old docs keep their record.
function migrateStage(stage: StageImageRecord): StageImageRecord {
  const legacyId = stage.stageId as string;
  const stageId = legacyId === "observation" ? "pencil-sketch" : stage.stageId;
  return {
    ...stage,
    stageId,
    generationStatus: normalizeGenerationStatus(stage.generationStatus),
  };
}

function toDoc(data: Record<string, unknown>): ProgressionDoc | null {
  if (!Array.isArray(data.stages)) return null;
  const masterImageUrl = (data.masterImageUrl as string | null) ?? null;
  return {
    version: (data.version as number) ?? 1,
    size: (data.size as ImageSize) ?? "1024x1024",
    masterImageUrl,
    masterPrompt: (data.masterPrompt as string | null) ?? null,
    masterStatus: normalizeGenerationStatus(
      (data.masterStatus as string | undefined) ?? (masterImageUrl ? "ready" : "pending"),
    ),
    masterError: (data.masterError as string | null) ?? null,
    masterValidation: (data.masterValidation as CompositionValidation | null) ?? null,
    masterReviewReasons: Array.isArray(data.masterReviewReasons)
      ? (data.masterReviewReasons as string[])
      : userFacingReasons((data.masterValidation as CompositionValidation | null) ?? null),
    lease: (data.lease as Lease | null) ?? null,
    stages: (data.stages as StageImageRecord[]).map(migrateStage),
    regenerationState: normalizeRegenerationState(data.regenerationState),
    regenerationStartedAt:
      typeof data.regenerationStartedAt === "number" ? data.regenerationStartedAt : null,
    regenerationError: (data.regenerationError as string | null) ?? null,
    regenerationPhase: normalizeRegenerationPhase(data.regenerationPhase),
    candidateFinalPaintingUrl: (data.candidateFinalPaintingUrl as string | null) ?? null,
  };
}

async function getProgressionDoc(uid: string, projectId: string): Promise<ProgressionDoc | null> {
  const snap = await getDoc(progressionRef(uid, projectId));
  if (!snap.exists()) return null;
  return toDoc(snap.data());
}

export async function getProgression(uid: string, projectId: string): Promise<ProgressionDoc | null> {
  return getProgressionDoc(uid, projectId);
}

/** Live subscription so the lesson UI updates automatically as images land. */
export function subscribeProgression(
  uid: string,
  projectId: string,
  cb: (doc: ProgressionDoc | null) => void,
): () => void {
  return onSnapshot(
    progressionRef(uid, projectId),
    (snap) => cb(snap.exists() ? toDoc(snap.data()) : null),
    (err) => {
      // Do not cb(null) on transport errors — that would look like "no master".
      console.error(
        "[progression] subscribeProgression error",
        sanitizeProgressionLogObject(
          normalizeProgressionError(err, { operation: "subscribe-progression" }),
        ),
      );
    },
  );
}

/** Create the progression doc if it does not yet exist. */
export async function ensureProgression(
  uid: string,
  projectId: string,
  tutorial: Tutorial,
  medium: Medium,
  referenceImageUrl: string,
  size: ImageSize,
): Promise<ProgressionDoc> {
  const existing = await getProgressionDoc(uid, projectId);
  if (existing) return existing;
  const created: ProgressionDoc = {
    version: 3,
    size,
    masterImageUrl: null,
    masterPrompt: null,
    masterStatus: "pending",
    masterError: null,
    masterValidation: null,
    masterReviewReasons: [],
    lease: null,
    stages: initialStages(tutorial, medium, referenceImageUrl),
    ...idleRegenerationFields(),
  };
  await setDoc(progressionRef(uid, projectId), { ...created, updatedAt: serverTimestamp() });
  return created;
}

/** Convert a data URL to a Blob without fetch() — large data URLs can fail fetch in browsers. */
function dataUrlToBlob(dataUrl: string): Blob {
  const comma = dataUrl.indexOf(",");
  if (comma < 0) throw new Error("Invalid image data.");
  const header = dataUrl.slice(0, comma);
  const b64 = dataUrl.slice(comma + 1);
  const mime = /data:([^;]+)/.exec(header)?.[1] || "image/png";
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type: mime });
}

const EXPECTED_STORAGE_BUCKET = "artpraxis-33840.firebasestorage.app";
const STAGE_UPLOAD_MAX_BYTES = 15 * 1024 * 1024;
const STAGE_UPLOAD_CONTENT_TYPE = "image/webp";
const STAGE_UPLOAD_EXT = "webp";

type NormalizedStageImage = {
  blob: Blob;
  originalBytes: number;
  normalizedBytes: number;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  contentType: string;
  quality: number;
  maxLongEdge: number;
};

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined" || typeof Image === "undefined") {
      reject(new Error("Canvas image normalization requires a browser environment."));
      return;
    }
    const objectUrl = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Could not decode stage image for upload normalization."));
    };
    img.src = objectUrl;
  });
}

function fitWithinLongEdge(
  width: number,
  height: number,
  maxLongEdge: number,
): { width: number; height: number } {
  const longEdge = Math.max(width, height);
  if (!Number.isFinite(longEdge) || longEdge <= 0) {
    throw new Error("Invalid image dimensions for stage upload normalization.");
  }
  // Never upscale — only shrink when the long edge exceeds the cap.
  if (longEdge <= maxLongEdge) {
    return { width: Math.round(width), height: Math.round(height) };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

function canvasToWebpBlob(
  canvas: HTMLCanvasElement,
  quality: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    try {
      canvas.toBlob(
        (result) => {
          if (!result || result.size <= 0) {
            reject(new Error("Canvas toBlob returned an empty WebP stage image."));
            return;
          }
          if (result.type && !/^image\/webp$/i.test(result.type)) {
            // Some browsers may omit type; accept empty type but reject non-webp.
            if (result.type.length > 0) {
              reject(
                new Error(
                  `Canvas normalization produced unsupported type "${result.type}" (expected image/webp).`,
                ),
              );
              return;
            }
          }
          resolve(
            result.type === "image/webp"
              ? result
              : new Blob([result], { type: STAGE_UPLOAD_CONTENT_TYPE }),
          );
        },
        STAGE_UPLOAD_CONTENT_TYPE,
        quality,
      );
    } catch (error) {
      reject(
        error instanceof Error
          ? error
          : new Error("Canvas toBlob failed during stage image normalization."),
      );
    }
  });
}

async function encodeStageAtSize(
  img: HTMLImageElement,
  maxLongEdge: number,
  qualities: number[],
  maxBytes: number,
): Promise<{ blob: Blob; width: number; height: number; quality: number } | null> {
  const { width, height } = fitWithinLongEdge(
    img.naturalWidth || img.width,
    img.naturalHeight || img.height,
    maxLongEdge,
  );

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not create a 2D canvas context for stage image normalization.");
  }
  ctx.drawImage(img, 0, 0, width, height);

  for (const quality of qualities) {
    const blob = await canvasToWebpBlob(canvas, quality);
    if (blob.size < maxBytes) {
      return { blob, width, height, quality };
    }
  }
  return null;
}

/**
 * Shrink + WebP-compress stage images so they stay under the Storage 15 MB rule.
 * Does not upscale. Browser-only (canvas).
 */
async function normalizeStageImageForUpload(source: Blob): Promise<NormalizedStageImage> {
  const originalBytes = source.size;
  const img = await loadImageFromBlob(source);
  const originalWidth = img.naturalWidth || img.width;
  const originalHeight = img.naturalHeight || img.height;

  if (!originalWidth || !originalHeight) {
    throw new Error("Stage image has invalid dimensions and cannot be normalized.");
  }

  // Pass 1: long edge ≤ 2048, quality ladder 0.88 → 0.82 → 0.74 → 0.65
  let encoded = await encodeStageAtSize(
    img,
    2048,
    [0.88, 0.82, 0.74, 0.65],
    STAGE_UPLOAD_MAX_BYTES,
  );

  // Pass 2: long edge ≤ 1600, quality 0.82 then 0.72
  if (!encoded) {
    encoded = await encodeStageAtSize(img, 1600, [0.82, 0.72], STAGE_UPLOAD_MAX_BYTES);
  }

  if (!encoded) {
    const failedBytes = originalBytes;
    throw createProgressionThrownError(
      `Firebase Storage upload blocked: image is still over 15 MB after normalization (${Number((failedBytes / 1024 / 1024).toFixed(2))} MB source).`,
      {
        name: "StageUploadError",
        code: "ERR_STAGE_IMAGE_TOO_LARGE",
        retryable: false,
        uploadDetails: sanitizeProgressionLogObject({
          operation: "upload-stage-image",
          originalBytes,
          originalWidth,
          originalHeight,
          contentType: STAGE_UPLOAD_CONTENT_TYPE,
        }),
      },
    );
  }

  const result: NormalizedStageImage = {
    blob: encoded.blob,
    originalBytes,
    normalizedBytes: encoded.blob.size,
    originalWidth,
    originalHeight,
    outputWidth: encoded.width,
    outputHeight: encoded.height,
    contentType: STAGE_UPLOAD_CONTENT_TYPE,
    quality: encoded.quality,
    maxLongEdge: Math.max(encoded.width, encoded.height),
  };

  console.info(
    "[upload-stage-image] normalized",
    sanitizeProgressionLogObject({
      originalBytes: result.originalBytes,
      normalizedBytes: result.normalizedBytes,
      originalWidth: result.originalWidth,
      originalHeight: result.originalHeight,
      outputWidth: result.outputWidth,
      outputHeight: result.outputHeight,
      contentType: result.contentType,
      quality: result.quality,
    }),
  );

  return result;
}

function throwStageUploadPreflightError(
  code: string,
  message: string,
  details: Record<string, unknown>,
): never {
  throw createProgressionThrownError(message, {
    name: "StageUploadError",
    code,
    retryable: false,
    uploadDetails: sanitizeProgressionLogObject({
      operation: "upload-stage-image",
      ...details,
    }),
  });
}

/**
 * Upload with at most one ID-token refresh retry on storage/unauthorized
 * or storage/unauthenticated. Does not retry size/MIME/bucket/UID preflight failures.
 */
async function uploadStageBlobWithAuthRefresh(params: {
  uid: string;
  projectId: string;
  name: string;
  storagePath: string;
  blob: Blob;
  object: ReturnType<typeof ref>;
  performUpload: () => Promise<string>;
}): Promise<string> {
  const { uid, projectId, name, storagePath, blob, performUpload } = params;

  try {
    return await performUpload();
  } catch (error) {
    const normalized = normalizeProgressionError(error, {
      operation: "upload-stage-image",
      projectId,
      stageId: name,
    });

    if (
      normalized.code !== "storage/unauthorized" &&
      normalized.code !== "storage/unauthenticated"
    ) {
      throw error;
    }

    const user = auth.currentUser;
    if (!user || user.uid !== uid) {
      throw error;
    }

    console.info(
      "[upload-stage-image] refreshing auth token",
      sanitizeProgressionLogObject({
        projectId,
        stageName: name,
        authenticatedUid: user.uid,
      }),
    );

    await user.getIdToken(true);

    try {
      return await performUpload();
    } catch (retryError) {
      const retryNormalized = normalizeProgressionError(retryError, {
        operation: "upload-stage-image",
        projectId,
        stageId: name,
      });

      console.error(
        "[upload-stage-image] failed after auth refresh",
        sanitizeProgressionLogObject({
          ...retryNormalized,
          storagePath,
          authenticatedUid: auth.currentUser?.uid ?? null,
          expectedUid: uid,
          blobSizeBytes: blob.size,
          blobType: blob.type,
          bucket: storage.app.options.storageBucket ?? null,
          retryAttempted: true,
        }),
      );

      throw retryError;
    }
  }
}

async function uploadDataUrl(uid: string, projectId: string, name: string, dataUrl: string): Promise<string> {
  await auth.authStateReady();
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throwStageUploadPreflightError(
      "ERR_STAGE_SAVE_AUTH",
      "Firebase Storage upload blocked: no authenticated user.",
      {
        projectId,
        stageName: name,
        expectedUid: uid,
        authenticatedUid: null,
      },
    );
  }

  // Stage object names must be a single path segment (no nested folders).
  if (!name || name.includes("/") || name.includes("\\") || name.includes("..")) {
    throwStageUploadPreflightError(
      "ERR_STAGE_INVALID_NAME",
      `Firebase Storage upload blocked: invalid stage name "${name}".`,
      { projectId, stageName: name, expectedUid: uid, authenticatedUid: currentUser.uid },
    );
  }

  if (currentUser.uid !== uid) {
    throwStageUploadPreflightError(
      "ERR_STAGE_AUTH_UID_MISMATCH",
      `Firebase Storage upload blocked: path uid "${uid}" does not match authenticated uid "${currentUser.uid}".`,
      {
        projectId,
        stageName: name,
        expectedUid: uid,
        authenticatedUid: currentUser.uid,
      },
    );
  }

  const sourceBlob = dataUrlToBlob(dataUrl);
  let normalized: NormalizedStageImage;
  try {
    normalized = await normalizeStageImageForUpload(sourceBlob);
  } catch (error) {
    const alreadyCoded =
      error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: unknown }).code === "ERR_STAGE_IMAGE_TOO_LARGE";
    if (alreadyCoded) throw error;
    throw createProgressionThrownError(
      error instanceof Error
        ? error.message
        : "Stage image normalization failed before upload.",
      {
        name: "StageUploadError",
        code: "ERR_STAGE_NORMALIZE_FAILED",
        retryable: false,
        cause: error,
        uploadDetails: sanitizeProgressionLogObject({
          operation: "upload-stage-image",
          projectId,
          stageName: name,
          originalBytes: sourceBlob.size,
          blobType: sourceBlob.type,
        }),
      },
    );
  }

  const uploadBlob = normalized.blob;
  const storagePath = `users/${uid}/projects/${projectId}/stages/${name}.${STAGE_UPLOAD_EXT}`;
  const object = ref(storage, storagePath);
  const bucket = storage.app.options.storageBucket ?? null;

  const preflight = {
    bucket,
    storagePath,
    authenticatedUid: currentUser.uid,
    expectedUid: uid,
    uidMatches: currentUser.uid === uid,
    blobSizeBytes: uploadBlob.size,
    blobSizeMB: Number((uploadBlob.size / 1024 / 1024).toFixed(2)),
    belowRuleLimit: uploadBlob.size < STAGE_UPLOAD_MAX_BYTES,
    blobType: uploadBlob.type || STAGE_UPLOAD_CONTENT_TYPE,
    contentTypeAllowed: /^image\/(webp|png|jpeg|jpg)$/i.test(
      uploadBlob.type || STAGE_UPLOAD_CONTENT_TYPE,
    ),
    stageName: name,
    projectId,
    originalBytes: normalized.originalBytes,
    quality: normalized.quality,
  };

  console.info(
    "[upload-stage-image] rule preflight",
    sanitizeProgressionLogObject(preflight),
  );

  if (bucket !== EXPECTED_STORAGE_BUCKET) {
    throwStageUploadPreflightError(
      "ERR_STAGE_BUCKET_MISMATCH",
      `Firebase Storage upload blocked: unexpected bucket "${bucket ?? "null"}" (expected ${EXPECTED_STORAGE_BUCKET}).`,
      { ...preflight },
    );
  }

  if (uploadBlob.size >= STAGE_UPLOAD_MAX_BYTES) {
    throwStageUploadPreflightError(
      "ERR_STAGE_IMAGE_TOO_LARGE",
      `Firebase Storage upload blocked: image is ${preflight.blobSizeMB} MB (limit 15 MB).`,
      { ...preflight },
    );
  }

  if (!/^image\//.test(uploadBlob.type || STAGE_UPLOAD_CONTENT_TYPE)) {
    throwStageUploadPreflightError(
      "ERR_STAGE_INVALID_CONTENT_TYPE",
      `Firebase Storage upload blocked: content type "${uploadBlob.type || "empty"}" is not image/*.`,
      { ...preflight },
    );
  }

  console.info(
    "[upload-stage-image] starting",
    sanitizeProgressionLogObject({
      projectId,
      stageName: name,
      storagePath,
      authenticatedUid: currentUser.uid,
      expectedUid: uid,
      blobSizeBytes: uploadBlob.size,
      blobType: uploadBlob.type || STAGE_UPLOAD_CONTENT_TYPE,
      dataUrlPrefix: dataUrl.slice(0, 30),
      bucket,
    }),
  );

  const performUpload = async () => {
    await uploadBytes(object, uploadBlob, { contentType: STAGE_UPLOAD_CONTENT_TYPE });
    return await getDownloadURL(object);
  };

  try {
    return await uploadStageBlobWithAuthRefresh({
      uid,
      projectId,
      name,
      storagePath,
      blob: uploadBlob,
      object,
      performUpload,
    });
  } catch (error) {
    const errNormalized = normalizeProgressionError(error, {
      operation: "upload-stage-image",
      projectId,
      stageId: name,
    });
    const retryable = classifyStorageRetryability(errNormalized.code, errNormalized.message);
    const details = sanitizeProgressionLogObject({
      ...errNormalized,
      retryable,
      storagePath,
      authenticatedUid: auth.currentUser?.uid ?? null,
      expectedUid: uid,
      blobSizeBytes: uploadBlob.size,
      blobType: uploadBlob.type || STAGE_UPLOAD_CONTENT_TYPE,
      dataUrlPrefix: dataUrl.slice(0, 30),
      bucket,
    });

    // Auth-refresh path already emitted "failed after auth refresh"; still emit
    // the boundary failure once with full serializable context.
    console.error("[upload-stage-image] failed", details);

    throw createProgressionThrownError(
      errNormalized.message || `Failed to upload stage image "${name}".`,
      {
        name: errNormalized.name ?? "StageUploadError",
        code: errNormalized.code ?? "ERR_STAGE_SAVE",
        retryable,
        cause: error,
        uploadDetails: details,
      },
    );
  }
}

// Merge-write a patch. `withLease` also renews the current client's lease so a
// long-running orchestration keeps ownership between writes.
async function persist(
  uid: string,
  projectId: string,
  patch: Record<string, unknown>,
  withLease: boolean,
): Promise<void> {
  const body = withLease
    ? { ...patch, lease: { owner: CLIENT_ID, expiresAt: Date.now() + LEASE_MS }, updatedAt: serverTimestamp() }
    : { ...patch, updatedAt: serverTimestamp() };
  await setDoc(progressionRef(uid, projectId), body, { merge: true });
}

// Acquire the lease atomically. Returns false when another live client holds it.
async function acquireLease(uid: string, projectId: string): Promise<boolean> {
  const r = progressionRef(uid, projectId);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(r);
      if (!snap.exists()) return false;
      const lease = (snap.data().lease as Lease | null | undefined) ?? null;
      const now = Date.now();
      if (lease && lease.owner !== CLIENT_ID && lease.expiresAt > now) return false;
      tx.update(r, { lease: { owner: CLIENT_ID, expiresAt: now + LEASE_MS }, updatedAt: serverTimestamp() });
      return true;
    });
  } catch {
    return false;
  }
}

async function releaseLease(uid: string, projectId: string): Promise<void> {
  const r = progressionRef(uid, projectId);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(r);
      if (!snap.exists()) return;
      const lease = (snap.data().lease as Lease | null | undefined) ?? null;
      if (!lease || lease.owner === CLIENT_ID) tx.update(r, { lease: null, updatedAt: serverTimestamp() });
    });
  } catch {
    /* best-effort */
  }
}

interface ApiImage {
  stageId: StageId;
  index: number;
  prompt: string;
  dataUrl: string | null;
  url: string | null;
  status: "generated" | "not_generated";
  validated: boolean;
  fallback: boolean;
}

interface ApiResponse {
  generated: boolean;
  master: { dataUrl: string | null; url: string | null; prompt: string } | null;
  masterValidated?: boolean;
  masterNeedsReview?: boolean;
  masterSeverity?: "pass" | "warning" | "hard_fail";
  masterValidation?: unknown;
  images: ApiImage[];
  error?: string;
  code?: string;
  retryable?: boolean;
  imageModel?: string;
  inputFidelity?: string;
  timing?: {
    referenceFetchMs?: number;
    editMs?: number;
    validationMs?: number;
    totalMs?: number;
    attempts?: number;
  };
}

/** User-facing copy — never surface raw validation JSON or HTTP details. */
const ERR_MASTER_GENERATE = "Couldn’t prepare the master painting. Please try again.";
const ERR_MASTER_SAVE = "Couldn’t save the master painting. Please try again.";
const ERR_STAGE_GENERATE = "This demonstration couldn’t be generated. Please retry.";
const ERR_STAGE_SAVE = "Couldn’t save this demonstration. Please retry.";

/** Dedup concurrent orchestrateProgression calls for the same project. */
const orchestrationInflight = new Map<
  string,
  Promise<"ran" | "skipped_complete" | "skipped_lease" | "skipped_review">
>;
/** Dedup concurrent master API generations (stricter than full orchestration). */
const masterInflight = createInflightGuard<ProgressionDoc>();

function progressionKey(uid: string, projectId: string): string {
  return `${uid}/${projectId}`;
}

function logProgression(event: string, detail: Record<string, unknown> = {}): void {
  console.warn(JSON.stringify({ scope: "progression", event, ...detail, t: Date.now() }));
}

/** Master is usable for stage derivation when an image is saved (ready or needsReview). */
function masterUsableForStages(doc: Pick<ProgressionDoc, "masterStatus" | "masterImageUrl">): boolean {
  return Boolean(
    doc.masterImageUrl &&
      (doc.masterStatus === "ready" || doc.masterStatus === "needsReview"),
  );
}

class ProgressionApiError extends Error {
  code?: string;
  retryable: boolean;
  status: number;
  apiDetails?: Record<string, unknown>;

  constructor(
    message: string,
    opts: {
      code?: string;
      retryable?: boolean;
      status?: number;
      apiDetails?: Record<string, unknown>;
    } = {},
  ) {
    super(message);
    this.name = "ProgressionApiError";
    this.code = opts.code;
    this.retryable = opts.retryable ?? true;
    this.status = opts.status ?? 500;
    this.apiDetails = opts.apiDetails;
    // Ensure enumerable own props so Next.js / JSON logs are not `{}`.
    Object.assign(this, {
      name: this.name,
      code: this.code,
      retryable: this.retryable,
      status: this.status,
      apiDetails: this.apiDetails,
      message: this.message,
    });
  }
}

async function callApi(body: {
  mode: "master" | "stage";
  medium: Medium;
  tutorial: Tutorial;
  size: ImageSize;
  referenceImageUrl?: string;
  stageId?: StageId;
  masterImageUrl?: string;
  precedingImageUrl?: string;
  projectId?: string;
}): Promise<ApiResponse> {
  const projectId = body.projectId ?? null;
  logProgression("generation_request_started", {
    mode: body.mode,
    stageId: body.stageId ?? null,
    projectId,
    hasMaster: Boolean(body.masterImageUrl),
  });

  let res: Response;
  try {
    res = await fetch("/api/generate-stage-images", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        mode: body.mode,
        medium: body.medium,
        tutorial: body.tutorial,
        size: body.size,
        referenceImageUrl: body.referenceImageUrl,
        stageId: body.stageId,
        masterImageUrl: body.masterImageUrl,
        precedingImageUrl: body.precedingImageUrl,
      }),
    });
  } catch (networkError) {
    const normalized = normalizeProgressionError(networkError, {
      operation: "generate-stage-images-api",
      stageId: body.stageId,
      projectId: projectId ?? undefined,
      source: body.mode,
      retryable: true,
    });
    const apiDetails = sanitizeProgressionLogObject({
      ...normalized,
      mode: body.mode,
      status: null,
      statusText: "network_error",
    });
    console.error("[progression] API error", apiDetails);
    throw createProgressionThrownError(normalized.message, {
      name: "ProgressionApiError",
      code: body.mode === "master" ? "ERR_MASTER_GENERATE" : "ERR_STAGE_GENERATE",
      status: 0,
      retryable: true,
      cause: networkError,
      apiDetails,
    });
  }

  const rawText = await res.text();
  if (!res.ok) {
    const fallbackMessage =
      body.mode === "master" ? ERR_MASTER_GENERATE : ERR_STAGE_GENERATE;
    const parsed = parseApiErrorBody(rawText, res.status, {
      mode: body.mode,
      fallbackMessage,
    });
    const responseMessage =
      parsed.code === ERR_IMAGE_SAFETY_REVIEW
        ? MSG_IMAGE_SAFETY_REVIEW
        : parsed.message || fallbackMessage;
    const apiDetails = buildApiErrorDetails({
      status: res.status,
      statusText: res.statusText,
      mode: body.mode,
      stageId: body.stageId ?? null,
      projectId,
      parsed: { ...parsed, message: responseMessage },
    });
    console.error("[progression] API error", apiDetails);
    throw new ProgressionApiError(responseMessage, {
      code:
        parsed.code ??
        (body.mode === "master" ? "ERR_MASTER_GENERATE" : "ERR_STAGE_GENERATE"),
      retryable: parsed.retryable,
      status: res.status,
      apiDetails,
    });
  }

  let data: ApiResponse = { generated: false, master: null, images: [] };
  if (rawText) {
    try {
      data = JSON.parse(rawText) as ApiResponse;
    } catch {
      /* keep empty */
    }
  }
  return data;
}

// `fallback` is internal-only metadata (no customer-facing caption). When true,
// `targetImageUrl` points at a deterministic, stage-appropriate transform of the
// master (see lib/stage-fallback.ts).
function applyImage(
  record: StageImageRecord,
  url: string,
  opts: {
    validated: boolean;
    fallback: boolean;
    previewSource?: "reference" | "master" | null;
  },
): StageImageRecord {
  return {
    ...record,
    targetImageUrl: url,
    generationStatus: opts.fallback ? "generating" : "ready",
    error: null,
    validated: opts.validated,
    fallback: opts.fallback,
    previewSource: opts.fallback ? (opts.previewSource ?? null) : null,
    createdAt: Date.now(),
  };
}

interface StageContext {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  masterImageUrl: string | null;
  precedingUrl: string | null;
  size: ImageSize;
}

// Generate + store ONE stage AI refinement. "finished" reuses the master.
// Deterministic previews are seeded separately; this only upgrades them.
// On AI failure, keep any existing preview URL so the lesson stays usable.
async function processStage(existing: StageImageRecord, ctx: StageContext): Promise<StageImageRecord> {
  const { stageId } = existing;

  if (stageId === "finished") {
    if (ctx.masterImageUrl) {
      return applyImage(existing, ctx.masterImageUrl, { validated: true, fallback: false, previewSource: null });
    }
    return {
      ...existing,
      generationStatus: "failed",
      error: ERR_STAGE_GENERATE,
      retryCount: existing.retryCount + 1,
    };
  }

  try {
    logProgression("stage_refinement_started", { projectId: ctx.projectId, stageId });
    const response = await callApi({
      mode: "stage",
      medium: ctx.medium,
      tutorial: ctx.tutorial,
      size: ctx.size,
      stageId,
      referenceImageUrl: ctx.referenceImageUrl,
      masterImageUrl: ctx.masterImageUrl ?? undefined,
      precedingImageUrl: ctx.precedingUrl ?? undefined,
      projectId: ctx.projectId,
    });

    if (!response.generated) {
      // Generation gated off — keep preview if present.
      const kept = existing.targetImageUrl
        ? { ...existing, generationStatus: "ready" as const, fallback: true, error: null }
        : { ...existing, generationStatus: "pending" as const, error: null };
      logProgression("stage_refinement_completed", {
        projectId: ctx.projectId,
        stageId,
        status: kept.generationStatus,
        gatedOff: true,
      });
      return kept;
    }

    const img = response.images.find((i) => i.stageId === stageId);
    let url: string | null = null;
    let opts: { validated: boolean; fallback: boolean; previewSource?: "reference" | "master" | null } = {
      validated: img?.validated ?? false,
      fallback: false,
      previewSource: null,
    };
    if (img?.dataUrl) {
      url = await uploadDataUrl(ctx.uid, ctx.projectId, stageId, img.dataUrl);
    } else if (img?.fallback && (response.master?.dataUrl || ctx.masterImageUrl)) {
      console.warn(`[progression] deterministic fallback for "${stageId}" (AI validation failed).`);
      const source = response.master?.dataUrl || ctx.masterImageUrl!;
      const fb = await buildStageFallback(source, stageId, ctx.precedingUrl);
      url = await uploadDataUrl(ctx.uid, ctx.projectId, stageId, fb);
      opts = { validated: false, fallback: true, previewSource: "master" };
    } else if (img?.url) {
      url = img.url;
    }

    if (url) {
      const applied = applyImage(existing, url, opts);
      logProgression("stage_refinement_completed", {
        projectId: ctx.projectId,
        stageId,
        status: applied.generationStatus,
        fallback: applied.fallback,
      });
      return applied;
    }

    // Keep the deterministic preview if AI returned nothing.
    if (existing.targetImageUrl) {
      logProgression("stage_refinement_failed", {
        projectId: ctx.projectId,
        stageId,
        reason: "no_image_in_response_kept_provisional",
      });
      return {
        ...existing,
        generationStatus: "ready",
        error: null,
        fallback: true,
        retryCount: existing.retryCount + 1,
      };
    }
    logProgression("stage_refinement_failed", {
      projectId: ctx.projectId,
      stageId,
      reason: "no_image_in_response",
    });
    return {
      ...existing,
      generationStatus: "failed",
      error: ERR_STAGE_GENERATE,
      retryCount: existing.retryCount + 1,
    };
  } catch (e) {
    const normalized = normalizeProgressionError(e, {
      operation: "process-stage",
      stageId,
      projectId: ctx.projectId,
    });
    console.error(
      `[progression] stage "${stageId}" failed`,
      sanitizeProgressionLogObject({ ...normalized }),
    );
    logProgression("stage_refinement_failed", {
      projectId: ctx.projectId,
      stageId,
      code: normalized.code,
      message: normalized.message,
      retryable: normalized.retryable,
    });
    const uploadFail =
      normalized.operation === "upload-stage-image" ||
      Boolean(normalized.code?.startsWith("storage/")) ||
      /save|upload|storage/i.test(normalized.message);
    // Preserve provisional image so later stages can continue from it.
    if (existing.targetImageUrl) {
      return {
        ...existing,
        generationStatus: "ready",
        error: null,
        fallback: true,
        retryCount: existing.retryCount + 1,
        errorCode: null,
        errorMessage: null,
        retryable: null,
        failedAt: null,
        failureSource: null,
      };
    }
    const patch = buildFailedStagePatch(normalized, {
      source: uploadFail ? "upload" : "api",
      userFacingError: uploadFail ? ERR_STAGE_SAVE : ERR_STAGE_GENERATE,
      retryCount: existing.retryCount + 1,
      preserveTargetUrl: null,
    });
    return {
      ...existing,
      generationStatus: patch.generationStatus,
      error: patch.error,
      errorCode: patch.errorCode,
      errorMessage: patch.errorMessage,
      retryable: patch.retryable,
      failedAt: patch.failedAt,
      failureSource: patch.failureSource,
      retryCount: patch.retryCount,
    };
  }
}

/**
 * Seed composition-locked deterministic previews.
 * - source "reference": provisional transforms from the photo, before master exists.
 * - source "master": replace reference previews with master-derived ones.
 *   When ENABLE_AI_STAGE_REFINEMENT is false, master-derived stages are marked
 *   ready immediately (MVP). Finished always uses the validated master.
 */
async function seedStagePreviews(
  uid: string,
  projectId: string,
  docData: ProgressionDoc,
  sourceImageUrl: string,
  source: "reference" | "master",
): Promise<StageImageRecord[]> {
  const stages = [...docData.stages];
  if (source === "master") {
    logProgression("master_preview_derivation_started", {
      projectId,
      stageCount: stages.length,
    });
  }
  let sourceDataUrl: string | null = null;
  try {
    sourceDataUrl = await toDataUrl(sourceImageUrl);
  } catch (e) {
    console.error(
      `[progression] could not load ${source} for stage previews`,
      sanitizeProgressionLogObject(
        normalizeProgressionError(e, {
          operation: "seed-stage-source-load",
          projectId,
          source,
        }),
      ),
    );
    if (source === "master") {
      logProgression("master_preview_derivation_complete", {
        projectId,
        ok: false,
        reason: "source_load_failed",
      });
    }
    return stages;
  }

  // MVP: master-derived transforms are the final targets (no AI refine loop).
  const masterTargetsAreFinal = source === "master" && !ENABLE_AI_STAGE_REFINEMENT;

  // Chain deterministic previews so each stage builds from the previous plate.
  let chainDataUrl: string | null = null;
  let derivedCount = 0;

  for (let i = 0; i < stages.length; i++) {
    const s = stages[i];

    // Final AI image — leave it, but keep chain for later stages.
    if (s.generationStatus === "ready" && s.targetImageUrl && !s.fallback) {
      if (s.stageId !== "finished") {
        try {
          chainDataUrl = await toDataUrl(s.targetImageUrl);
        } catch {
          /* keep prior chain */
        }
      }
      continue;
    }
    // Failed with a preview — leave for manual retry (don't overwrite).
    if (s.generationStatus === "failed") continue;

    if (source === "reference") {
      // Already has any preview (reference or master) — don't downgrade.
      if (s.targetImageUrl && (s.previewSource === "reference" || s.previewSource === "master")) {
        if (s.stageId !== "finished" && s.targetImageUrl) {
          try {
            chainDataUrl = await toDataUrl(s.targetImageUrl);
          } catch {
            /* keep prior chain */
          }
        }
        continue;
      }
      // Already ready with a deterministic master target — leave it.
      if (s.generationStatus === "ready" && s.targetImageUrl) continue;
    } else if (masterTargetsAreFinal) {
      // Already ready with a master-derived (or AI) target.
      if (s.generationStatus === "ready" && s.targetImageUrl) {
        if (s.stageId !== "finished") {
          try {
            chainDataUrl = await toDataUrl(s.targetImageUrl);
          } catch {
            /* keep prior chain */
          }
        }
        continue;
      }
    } else {
      // AI refinement on: skip if already on master-derived preview (still refining).
      if (s.previewSource === "master" && s.targetImageUrl && s.generationStatus === "generating") {
        try {
          chainDataUrl = await toDataUrl(s.targetImageUrl);
        } catch {
          /* keep prior chain */
        }
        continue;
      }
      if (s.generationStatus === "ready" && s.targetImageUrl && s.fallback) continue;
    }

    // Finished: never present the photo as a finished painting.
    if (s.stageId === "finished") {
      if (source === "reference") {
        stages[i] = {
          ...s,
          targetImageUrl: sourceImageUrl,
          generationStatus: "generating",
          error: null,
          validated: false,
          fallback: true,
          previewSource: "reference",
          createdAt: Date.now(),
        };
      } else {
        stages[i] = applyImage(s, sourceImageUrl, {
          validated: true,
          fallback: false,
          previewSource: null,
        });
        derivedCount++;
      }
      await persist(uid, projectId, { stages: [...stages] }, true);
      continue;
    }

    // Fast path: flip an existing master-derived preview to ready without re-upload.
    if (
      masterTargetsAreFinal &&
      s.targetImageUrl &&
      (s.previewSource === "master" || s.fallback) &&
      s.generationStatus === "generating"
    ) {
      stages[i] = {
        ...s,
        generationStatus: "ready",
        error: null,
        validated: false,
        fallback: true,
        previewSource: null,
      };
      await persist(uid, projectId, { stages: [...stages] }, true);
      derivedCount++;
      try {
        chainDataUrl = await toDataUrl(s.targetImageUrl);
      } catch {
        /* keep prior chain */
      }
      continue;
    }

    let generatedFallback: string | null = null;
    try {
      const intendedStorageName = s.stageId;
      console.info(
        "[progression] preview seed starting",
        sanitizeProgressionLogObject({
          projectId,
          stageId: s.stageId,
          source,
          hasDataUrl: Boolean(sourceDataUrl),
          dataUrlPrefix: sourceDataUrl ? sourceDataUrl.slice(0, 30) : null,
          intendedStorageName,
        }),
      );

      const precedingForFallback =
        s.stageId === "pencil-sketch" ? null : chainDataUrl;
      generatedFallback = await buildStageFallback(
        sourceDataUrl,
        s.stageId,
        precedingForFallback,
      );

      console.info(
        "[progression] preview seed generated",
        sanitizeProgressionLogObject({
          projectId,
          stageId: s.stageId,
          source,
          blobSizeEstimate: Math.max(0, Math.floor((generatedFallback.length * 3) / 4)),
          dataUrlPrefix: generatedFallback.slice(0, 30),
        }),
      );

      const url = await uploadDataUrl(uid, projectId, s.stageId, generatedFallback);
      chainDataUrl = generatedFallback;

      console.info(
        "[progression] preview seed persisted",
        sanitizeProgressionLogObject({
          projectId,
          stageId: s.stageId,
          source,
          storagePath: `users/${uid}/projects/${projectId}/stages/${s.stageId}.${STAGE_UPLOAD_EXT}`,
        }),
      );

      stages[i] = {
        ...s,
        targetImageUrl: url,
        generationStatus: masterTargetsAreFinal ? "ready" : "generating",
        error: null,
        errorCode: null,
        errorMessage: null,
        retryable: null,
        failedAt: null,
        failureSource: null,
        validated: false,
        fallback: true,
        previewSource: masterTargetsAreFinal ? null : source,
        createdAt: Date.now(),
      };
      await persist(uid, projectId, { stages: [...stages] }, true);
      derivedCount++;
    } catch (e) {
      const normalized = normalizeProgressionError(e, {
        operation: "seed-stage-preview",
        stageId: s.stageId,
        projectId,
        source,
      });
      const uploadDetails =
        e && typeof e === "object" && "uploadDetails" in e
          ? sanitizeProgressionLogObject(
              (e as { uploadDetails: Record<string, unknown> }).uploadDetails,
            )
          : null;

      console.error(
        `[progression] ${source} preview seed failed for "${s.stageId}"`,
        sanitizeProgressionLogObject({
          ...normalized,
          stageName: s.stageId,
          hadDeterministicPreview: Boolean(generatedFallback),
          uploadDetails,
        }),
      );

      // Keep deterministic plate in the in-memory chain for later stages even
      // when Storage upload failed (do not write data URLs to Firestore).
      if (generatedFallback) {
        chainDataUrl = generatedFallback;
      }

      const patch = buildFailedStagePatch(normalized, {
        source,
        userFacingError: ERR_STAGE_SAVE,
        retryCount: (s.retryCount ?? 0) + 1,
        preserveTargetUrl: s.targetImageUrl,
      });
      stages[i] = {
        ...s,
        generationStatus: patch.generationStatus,
        error: patch.error,
        errorCode: patch.errorCode,
        errorMessage: patch.errorMessage,
        retryable: patch.retryable,
        failedAt: patch.failedAt,
        failureSource: patch.failureSource,
        targetImageUrl: s.targetImageUrl,
        retryCount: patch.retryCount,
      };
      try {
        await persist(uid, projectId, { stages: [...stages] }, true);
      } catch (persistErr) {
        console.error(
          `[progression] could not persist failed status for "${s.stageId}"`,
          sanitizeProgressionLogObject(
            normalizeProgressionError(persistErr, {
              operation: "persist-failed-seed",
              stageId: s.stageId,
              projectId,
            }),
          ),
        );
      }
    }
  }

  if (source === "master") {
    logProgression("master_preview_derivation_complete", {
      projectId,
      ok: derivedCount > 0,
      derivedCount,
      masterTargetsAreFinal,
      failedWithoutUrl: stages.filter((st) => st.generationStatus === "failed" && !st.targetImageUrl).length,
    });
  }

  return stages;
}

function needsAiRefine(s: StageImageRecord): boolean {
  if (!ENABLE_AI_STAGE_REFINEMENT) return false;
  if (s.stageId === "finished") return false;
  if (s.generationStatus === "failed") return false;
  if (s.generationStatus === "ready" && s.targetImageUrl && !s.fallback) return false;
  // Still on a deterministic preview — needs AI when the flag is on.
  return true;
}

function stagesNeedDeterministicWork(stages: StageImageRecord[]): boolean {
  return stages.some((s) => {
    if (s.generationStatus === "failed") return false;
    if (!s.targetImageUrl) return true;
    if (s.generationStatus === "pending" || s.generationStatus === "generating") return true;
    if (s.previewSource === "reference") return true;
    return false;
  });
}

// Generate + validate + upload + persist the MASTER in its own request.
// Every successful candidate is validated before stages run.
// Never discards a prior valid master merely because a later attempt fails.
async function runMaster(
  uid: string,
  projectId: string,
  docData: ProgressionDoc,
  tutorial: Tutorial,
  medium: Medium,
  referenceImageUrl: string,
  onMasterCandidate?: MasterCandidateHandler,
  forceReview = false,
): Promise<ProgressionDoc> {
  const key = progressionKey(uid, projectId);
  const priorMasterUrl = docData.masterImageUrl;

  if (masterInflight.get(key)) {
    logProgression("master_generation_already_in_flight", { projectId });
    return masterInflight.get(key)!;
  }

  return masterInflight.run(key, async () => {
    const clientStartedAt = Date.now();
    logProgression("master_generation_started", { projectId, size: docData.size });
    // Keep any prior masterImageUrl while regenerating so failures can restore it.
    await persist(uid, projectId, {
      masterStatus: "generating",
      masterError: null,
      masterValidation: null,
      masterReviewReasons: [],
    }, true);

    let response: ApiResponse;
    let apiMs = 0;
    try {
      const apiStarted = Date.now();
      response = await callApi({
        mode: "master",
        medium,
        tutorial,
        size: docData.size,
        referenceImageUrl,
        projectId,
      });
      apiMs = Date.now() - apiStarted;
    } catch (e) {
      const normalized = normalizeProgressionError(e, {
        operation: "run-master",
        projectId,
        source: "master",
      });
      const safety = normalized.code === ERR_IMAGE_SAFETY_REVIEW;
      if (safety) {
        logProgression("master_generation_moderation_blocked", {
          projectId,
          retryable: false,
        });
      } else {
        // Avoid duplicate raw dumps — callApi already logged API details.
        if (!(e && typeof e === "object" && "apiDetails" in e)) {
          console.error(
            "[progression] master API failed",
            sanitizeProgressionLogObject({ ...normalized }),
          );
        }
        logProgression("master_generation_failed", {
          projectId,
          code: normalized.code,
          message: normalized.message,
          retryable: normalized.retryable,
        });
      }

      // Preserve a previously successful master — never clear it on failure.
      // forceReview (review-screen regen) restores to needsReview so Accept stays required.
      if (priorMasterUrl) {
        const restoreStatus: GenerationStatus = forceReview ? "needsReview" : "ready";
        await persist(
          uid,
          projectId,
          {
            masterImageUrl: priorMasterUrl,
            masterStatus: restoreStatus,
            masterError: null,
          },
          true,
        );
        return {
          ...docData,
          masterImageUrl: priorMasterUrl,
          masterStatus: restoreStatus,
          masterError: null,
        };
      }

      const masterError = safety ? MSG_IMAGE_SAFETY_REVIEW : ERR_MASTER_GENERATE;
      const masterStatus: GenerationStatus = "failed";
      await persist(
        uid,
        projectId,
        {
          masterStatus,
          masterError,
          // Machine-readable code stored in masterError prefix for UI branching.
          masterValidation: safety
            ? ({ code: ERR_IMAGE_SAFETY_REVIEW } as unknown as CompositionValidation)
            : null,
        },
        true,
      );
      return {
        ...docData,
        masterStatus,
        masterError,
      };
    }

    if (!response.generated || !response.master?.dataUrl) {
      logProgression("master_response_received", {
        projectId,
        generated: false,
        reason: "missing_master_dataUrl",
      });
      if (priorMasterUrl) {
        const restoreStatus: GenerationStatus = forceReview ? "needsReview" : "ready";
        await persist(
          uid,
          projectId,
          { masterImageUrl: priorMasterUrl, masterStatus: restoreStatus, masterError: null },
          true,
        );
        return { ...docData, masterImageUrl: priorMasterUrl, masterStatus: restoreStatus, masterError: null };
      }
      await persist(uid, projectId, { masterStatus: "pending" }, true);
      return { ...docData, masterStatus: "pending" };
    }

    logProgression("master_response_received", {
      projectId,
      generated: true,
      masterNeedsReview: Boolean(response.masterNeedsReview),
      masterValidated: response.masterValidated ?? null,
    });

    const validation = (response.masterValidation as CompositionValidation | null) ?? null;
    // Preserve composition diagnostics for logging and future quality controls.
    const reasons = userFacingReasons(validation);
    const status: "ready" | "needsReview" = "ready";

    if (response.masterValidation) {
      console.warn("[progression] master validation", JSON.stringify(response.masterValidation));
    }

    try {
      const previewUrl = URL.createObjectURL(dataUrlToBlob(response.master.dataUrl));
      onMasterCandidate?.({ previewUrl, status, reasons, validation });
    } catch (e) {
      console.error(
        "[progression] could not create master preview",
        sanitizeProgressionLogObject(
          normalizeProgressionError(e, {
            operation: "master-preview-blob",
            projectId,
          }),
        ),
      );
    }

    // Persist review state before upload so the UI can reveal the candidate early.
    await persist(
      uid,
      projectId,
      {
        masterStatus: "generating",
        masterError: null,
        masterPrompt: response.master.prompt ?? null,
        masterValidation: validation,
        masterReviewReasons: reasons,
      },
      true,
    );

    let masterImageUrl: string;
    let uploadMs = 0;
    try {
      const uploadStarted = Date.now();
      masterImageUrl = await uploadDataUrl(uid, projectId, "master", response.master.dataUrl);
      uploadMs = Date.now() - uploadStarted;
    } catch (e) {
      const normalized = normalizeProgressionError(e, {
        operation: "upload-master",
        projectId,
        stageId: "master",
      });
      // uploadDataUrl already logged the Storage failure details.
      if (!(e && typeof e === "object" && "uploadDetails" in e)) {
        console.error(
          "[progression] master upload failed",
          sanitizeProgressionLogObject({ ...normalized }),
        );
      }
      if (priorMasterUrl) {
        const restoreStatus: GenerationStatus = forceReview ? "needsReview" : "ready";
        await persist(
          uid,
          projectId,
          {
            masterImageUrl: priorMasterUrl,
            masterStatus: restoreStatus,
            masterError: null,
          },
          true,
        );
        return {
          ...docData,
          masterImageUrl: priorMasterUrl,
          masterStatus: restoreStatus,
          masterError: null,
        };
      }
      await persist(
        uid,
        projectId,
        {
          masterStatus: "failed",
          masterError: ERR_MASTER_SAVE,
          masterValidation: validation,
          masterReviewReasons: reasons,
        },
        true,
      );
      return {
        ...docData,
        masterStatus: "failed",
        masterError: ERR_MASTER_SAVE,
        masterValidation: validation,
        masterReviewReasons: reasons,
      };
    }

    const masterPrompt = response.master.prompt ?? null;
    await persist(
      uid,
      projectId,
      {
        masterImageUrl,
        masterPrompt,
        masterStatus: status,
        masterError: null,
        masterValidation: validation,
        masterReviewReasons: reasons,
      },
      true,
    );

    logProgression("master_persisted", {
      projectId,
      masterStatus: status,
      hasMasterImageUrl: true,
    });
    logProgression("master_generation_timing", {
      projectId,
      apiMs,
      uploadMs,
      totalMs: Date.now() - clientStartedAt,
      serverTiming: response.timing ?? null,
      model: response.imageModel ?? null,
      input_fidelity: response.inputFidelity ?? null,
      retry_count: Math.max(0, (response.timing?.attempts ?? 1) - 1),
      validation_result: response.masterSeverity ?? (response.masterValidated ? "pass" : null),
    });
    // Structured regeneration.* keys (safe — no URLs, prompts, or image bytes).
    logProgression("regeneration.timing_snapshot", {
      "regeneration.total_ms": Date.now() - clientStartedAt,
      "regeneration.master_generation_ms": response.timing?.editMs ?? apiMs,
      "regeneration.validation_ms": response.timing?.validationMs ?? null,
      "regeneration.storage_ms": uploadMs,
      "regeneration.reference_fetch_ms": response.timing?.referenceFetchMs ?? null,
      "regeneration.retry_count": Math.max(0, (response.timing?.attempts ?? 1) - 1),
      "regeneration.validation_result":
        response.masterSeverity ?? (response.masterValidated ? "pass" : null),
      "regeneration.model": response.imageModel ?? null,
      "regeneration.input_fidelity": response.inputFidelity ?? null,
      projectId,
      scope: forceReview ? "review_regenerate" : "initial_or_orchestrated",
    });

    return {
      ...docData,
      masterImageUrl,
      masterPrompt,
      masterStatus: status,
      masterError: null,
      masterValidation: validation,
      masterReviewReasons: reasons,
    };
  });
}

/**
 * Resumable client runner:
 *  1. Generate the master only (no stage images until Accept).
 *  2. Persist the validated master and continue into stage generation.
 *  3. After accept (masterStatus ready), seed master-derived stage previews
 *     and optionally AI-refine — each stage persisted as it finishes.
 *  4. Lease + in-flight map prevent duplicate jobs across reloads/tabs.
 */
export async function orchestrateProgression(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  size?: ImageSize;
  onMasterCandidate?: MasterCandidateHandler;
  /** Explicit user regeneration — allows replacing an existing master. */
  forceRegenerate?: boolean;
  /** In-memory master URL from UI (blob preview or prior snapshot). */
  inMemoryMasterUrl?: string | null;
}): Promise<"ran" | "skipped_inflight" | "skipped_prereq" | "skipped_complete" | "skipped_lease" | "skipped_review"> {
  const { uid, projectId, tutorial, medium, referenceImageUrl } = params;
  const key = progressionKey(uid, projectId);

  logProgression("trigger_evaluated", {
    projectId,
    hasTutorial: Boolean(tutorial),
    hasMedium: Boolean(medium),
    hasReferenceUrl: Boolean(referenceImageUrl),
    forceRegenerate: Boolean(params.forceRegenerate),
  });

  if (!tutorial || !medium || !referenceImageUrl) {
    logProgression("generation_skipped", {
      projectId,
      reason: "missing_tutorial_medium_or_referenceUrl",
    });
    return "skipped_prereq";
  }

  const existing = orchestrationInflight.get(key);
  if (existing) {
    logProgression("master_generation_already_in_flight", { projectId, scope: "orchestration" });
    await existing;
    return "skipped_inflight";
  }

  const run = orchestrateProgressionInner(params).finally(() => {
    if (orchestrationInflight.get(key) === run) orchestrationInflight.delete(key);
  });
  orchestrationInflight.set(key, run);
  return run;
}

async function orchestrateProgressionInner(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  size?: ImageSize;
  onMasterCandidate?: MasterCandidateHandler;
  forceRegenerate?: boolean;
  inMemoryMasterUrl?: string | null;
}): Promise<"ran" | "skipped_complete" | "skipped_lease" | "skipped_review"> {
  const { uid, projectId, tutorial, medium, referenceImageUrl, onMasterCandidate } = params;
  const forceRegenerate = Boolean(params.forceRegenerate);

  logProgression("progression_hydration_started", { projectId });
  const base = await ensureProgression(
    uid,
    projectId,
    tutorial,
    medium,
    referenceImageUrl,
    params.size ?? "1024x1024",
  );
  // Re-read after ensure so we never treat a racey create as "no master".
  const hydrated = (await getProgressionDoc(uid, projectId)) ?? base;
  logProgression("progression_hydration_resolved", {
    projectId,
    masterStatus: hydrated.masterStatus,
    hasMasterImageUrl: Boolean(hydrated.masterImageUrl),
  });

  // Failed master without an image: still allow deterministic fallbacks / retry path.
  // Failed master WITH an image should not block (treat as available).
  if (hydrated.masterStatus === "failed" && !hydrated.masterImageUrl && !forceRegenerate) {
    // Continue into fallback seeding below rather than hard-return, so the lesson stays usable.
    logProgression("master_generation_failed", {
      projectId,
      reason: "persisted_failed_without_master",
    });
  }

  const needsDeterministic = stagesNeedDeterministicWork(hydrated.stages);
  const needsAi = ENABLE_AI_STAGE_REFINEMENT && hydrated.stages.some(needsAiRefine);
  const masterUsable = masterUsableForStages(hydrated);

  // Upgrade legacy review-gated records before generating stages.
  if (hydrated.masterStatus === "needsReview" && masterUsable && !forceRegenerate) {
    await persist(uid, projectId, { masterStatus: "ready" }, true);
    hydrated.masterStatus = "ready";
  }
  if (hydrated.masterStatus === "needsReview" && !hydrated.masterImageUrl) {
    logProgression("generation_skipped", { projectId, reason: "master_needs_review_without_image" });
    return "skipped_review";
  }

  if (masterUsable && hydrated.masterStatus === "ready" && !needsDeterministic && !needsAi && !forceRegenerate) {
    logProgression("master_generation_skipped_existing", {
      projectId,
      reason: "master_and_stages_already_complete",
    });
    return "skipped_complete";
  }

  if (!(await acquireLease(uid, projectId))) {
    logProgression("generation_skipped", { projectId, reason: "lease_held_by_another_client" });
    return "skipped_lease";
  }

  try {
    let docData = (await getProgressionDoc(uid, projectId)) ?? hydrated;

    const needsMaster = shouldGenerateMaster(docData, {
      forceRegenerate,
      inMemoryMasterUrl: params.inMemoryMasterUrl ?? null,
    });

    if (!needsMaster) {
      logProgression("master_generation_skipped_existing", {
        projectId,
        hasMasterImageUrl: Boolean(docData.masterImageUrl),
        inMemoryMasterUrl: Boolean(params.inMemoryMasterUrl),
      });
    }

    if (needsMaster) {
      docData = await runMaster(
        uid,
        projectId,
        docData,
        tutorial,
        medium,
        referenceImageUrl,
        onMasterCandidate,
      );
    }

    if (!masterUsableForStages(docData) || docData.masterStatus !== "ready") {
      logProgression("orchestration_complete", {
        projectId,
        outcome: "stopped_after_master",
        masterStatus: docData.masterStatus,
      });
      return "ran";
    }

    const stages = await seedStagePreviews(uid, projectId, docData, docData.masterImageUrl!, "master");
    docData = { ...docData, stages };

    if (!ENABLE_AI_STAGE_REFINEMENT) {
      logProgression("orchestration_complete", {
        projectId,
        outcome: "master_derived_targets_final",
        masterStatus: docData.masterStatus,
        aiRefinement: false,
      });
      return "ran";
    }

    logProgression("refinement_chain_started", {
      projectId,
      masterStatus: docData.masterStatus,
      stageCount: stages.length,
    });

    let precedingUrl: string | null = null;
    for (let i = 0; i < stages.length; i++) {
      const s = stages[i];

      if (s.generationStatus === "ready" && s.targetImageUrl && !s.fallback) {
        if (s.stageId !== "finished") precedingUrl = s.targetImageUrl;
        continue;
      }
      if (s.stageId === "finished") continue;
      // Preserve provisional URL for the chain; do not abort later stages.
      if (s.generationStatus === "failed") {
        if (s.targetImageUrl) precedingUrl = s.targetImageUrl;
        continue;
      }

      if (!needsAiRefine(s)) {
        if (s.targetImageUrl) precedingUrl = s.targetImageUrl;
        continue;
      }

      try {
        stages[i] = { ...s, generationStatus: "generating", error: null };
        await persist(uid, projectId, { stages: [...stages] }, true);

        const updated = await processStage(stages[i], {
          uid,
          projectId,
          tutorial,
          medium,
          referenceImageUrl,
          masterImageUrl: docData.masterImageUrl,
          precedingUrl,
          size: docData.size,
        });
        stages[i] = updated;
        await persist(uid, projectId, { stages: [...stages] }, true);

        if (updated.targetImageUrl && updated.stageId !== "finished") {
          precedingUrl = updated.targetImageUrl;
        }
      } catch (e) {
        const normalized = normalizeProgressionError(e, {
          operation: "stage-refinement-loop",
          projectId,
          stageId: s.stageId,
        });
        logProgression("stage_refinement_failed", {
          projectId,
          stageId: s.stageId,
          code: normalized.code,
          message: normalized.message,
          retryable: normalized.retryable,
        });
        // Keep provisional; continue the chain.
        if (s.targetImageUrl) precedingUrl = s.targetImageUrl;
      }
    }

    logProgression("orchestration_complete", {
      projectId,
      outcome: "refinement_chain_finished",
      masterStatus: docData.masterStatus,
      aiRefinement: true,
    });
    return "ran";
  } catch (error) {
    const normalized = normalizeProgressionError(error, {
      operation: "orchestrate-progression",
      projectId,
    });
    console.error(
      "[progression] orchestration failed",
      sanitizeProgressionLogObject({ ...normalized }),
    );
    throw createProgressionThrownError(normalized.message, {
      name: normalized.name ?? "ProgressionOrchestrationError",
      code: normalized.code ?? "ERR_PROGRESSION",
      retryable: normalized.retryable,
      cause: error,
      progressionDetails: normalized,
    });
  } finally {
    await releaseLease(uid, projectId);
  }
}

/**
 * Atelier "Try another…" — generate a validated candidate Final Painting without
 * clearing stages or replacing the accepted master until the user applies it.
 */
export async function regenerateAllTargets(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  size?: ImageSize;
  onMasterCandidate?: MasterCandidateHandler;
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl } = params;
  const existing = await getProgressionDoc(uid, projectId);
  const size = params.size ?? existing?.size ?? "1024x1024";
  const baseDoc =
    existing ?? (await ensureProgression(uid, projectId, tutorial, medium, referenceImageUrl, size));

  // Active-job guard — remounts / double-clicks must not start a second bill.
  if (isRegenerationBusy(baseDoc.regenerationState)) {
    logProgression("regeneration.duplicate_ignored", {
      projectId,
      regenerationState: baseDoc.regenerationState,
      reason: "busy_regeneration_state",
    });
    return;
  }
  if (baseDoc.regenerationState === "candidateReady" && baseDoc.candidateFinalPaintingUrl) {
    logProgression("regeneration.duplicate_ignored", {
      projectId,
      regenerationState: baseDoc.regenerationState,
      reason: "candidate_awaiting_decision",
    });
    return;
  }

  const priorMasterUrl = baseDoc.masterImageUrl;
  if (!priorMasterUrl || baseDoc.masterStatus !== "ready") {
    // Fall back to review-style master replace when there is no accepted lesson.
    await regenerateMasterCandidate({
      uid,
      projectId,
      tutorial,
      medium,
      referenceImageUrl,
      onMasterCandidate: params.onMasterCandidate,
    });
    return;
  }

  const startedAt = Date.now();
  const firestoreStarted = Date.now();
  await persist(
    uid,
    projectId,
    {
      // Keep accepted master + stages authoritative and visible.
      masterImageUrl: priorMasterUrl,
      masterStatus: "ready",
      masterError: null,
      regenerationState: "queued",
      regenerationStartedAt: startedAt,
      regenerationError: null,
      regenerationPhase: "studying",
      candidateFinalPaintingUrl: null,
      lease: null,
    },
    false,
  );
  const firestoreMs = Date.now() - firestoreStarted;

  logProgression("regeneration.started", {
    projectId,
    source: "atelier_try_another",
    "regeneration.firestore_ms": firestoreMs,
    reuses_reference: true,
    clears_stages_before_accept: false,
  });

  if (!(await acquireLease(uid, projectId))) {
    await persist(
      uid,
      projectId,
      {
        regenerationState: "error",
        regenerationError:
          "Another session is preparing an interpretation. Try again in a moment.",
        regenerationPhase: null,
      },
      false,
    );
    logProgression("regeneration.lease_blocked", { projectId });
    return;
  }

  try {
    await persist(
      uid,
      projectId,
      {
        regenerationState: "generating",
        regenerationPhase: "creating",
      },
      true,
    );

    let response: ApiResponse;
    let apiMs = 0;
    try {
      const apiStarted = Date.now();
      response = await callApi({
        mode: "master",
        medium,
        tutorial,
        size,
        referenceImageUrl,
        projectId,
      });
      apiMs = Date.now() - apiStarted;
    } catch (e) {
      const normalized = normalizeProgressionError(e, {
        operation: "regenerate-final-painting",
        projectId,
        source: "master",
      });
      await persist(
        uid,
        projectId,
        {
          regenerationState: "error",
          regenerationError:
            normalized.code === ERR_IMAGE_SAFETY_REVIEW
              ? MSG_IMAGE_SAFETY_REVIEW
              : "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
          regenerationPhase: null,
          candidateFinalPaintingUrl: null,
        },
        true,
      );
      logProgression("regeneration.failed", {
        projectId,
        code: normalized.code,
        "regeneration.total_ms": Date.now() - startedAt,
        "regeneration.master_generation_ms": apiMs || null,
      });
      return;
    }

    if (!response.generated || !response.master?.dataUrl) {
      await persist(
        uid,
        projectId,
        {
          regenerationState: "error",
          regenerationError:
            "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
          regenerationPhase: null,
          candidateFinalPaintingUrl: null,
        },
        true,
      );
      logProgression("regeneration.failed", {
        projectId,
        reason: "missing_master_dataUrl",
        "regeneration.total_ms": Date.now() - startedAt,
      });
      return;
    }

    await persist(
      uid,
      projectId,
      {
        regenerationState: "validating",
        regenerationPhase: "checking",
      },
      true,
    );

    // Validation already ran on the server; surface the preparing phase for upload.
    await persist(
      uid,
      projectId,
      {
        regenerationState: "generating",
        regenerationPhase: "preparing",
      },
      true,
    );

    let candidateUrl: string;
    let uploadMs = 0;
    try {
      const uploadStarted = Date.now();
      candidateUrl = await uploadDataUrl(
        uid,
        projectId,
        "master-candidate",
        response.master.dataUrl,
      );
      uploadMs = Date.now() - uploadStarted;
    } catch (e) {
      const normalized = normalizeProgressionError(e, {
        operation: "upload-master-candidate",
        projectId,
        stageId: "master",
      });
      await persist(
        uid,
        projectId,
        {
          regenerationState: "error",
          regenerationError:
            "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
          regenerationPhase: null,
          candidateFinalPaintingUrl: null,
        },
        true,
      );
      logProgression("regeneration.failed", {
        projectId,
        code: normalized.code,
        reason: "candidate_upload_failed",
        "regeneration.total_ms": Date.now() - startedAt,
        "regeneration.storage_ms": uploadMs || null,
      });
      return;
    }

    const validation = (response.masterValidation as CompositionValidation | null) ?? null;
    const reasons = userFacingReasons(validation);
    const firestoreWriteStarted = Date.now();
    await persist(
      uid,
      projectId,
      {
        // Accepted master + stages untouched.
        masterImageUrl: priorMasterUrl,
        masterStatus: "ready",
        candidateFinalPaintingUrl: candidateUrl,
        regenerationState: "candidateReady",
        regenerationPhase: "preparing",
        regenerationError: null,
        masterValidation: validation,
        masterReviewReasons: reasons,
      },
      true,
    );

    logProgression("regeneration.candidate_ready", {
      projectId,
      "regeneration.total_ms": Date.now() - startedAt,
      "regeneration.master_generation_ms": response.timing?.editMs ?? apiMs,
      "regeneration.validation_ms": response.timing?.validationMs ?? null,
      "regeneration.storage_ms": uploadMs,
      "regeneration.firestore_ms": Date.now() - firestoreWriteStarted,
      "regeneration.stage_generation_ms": 0,
      "regeneration.retry_count": Math.max(0, (response.timing?.attempts ?? 1) - 1),
      "regeneration.validation_result":
        response.masterSeverity ?? (response.masterValidated ? "pass" : null),
      "regeneration.model": response.imageModel ?? null,
      "regeneration.input_fidelity": response.inputFidelity ?? null,
      stages_deferred_until_accept: true,
    });
  } finally {
    await releaseLease(uid, projectId);
  }
}

/**
 * Replace only the master candidate (used from Review master → Regenerate).
 * Does not clear existing stage images; stages stay idle until Accept.
 */
export async function regenerateMasterCandidate(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  onMasterCandidate?: MasterCandidateHandler;
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl, onMasterCandidate } = params;
  const existing = await getProgressionDoc(uid, projectId);
  if (!existing) {
    await ensureProgression(uid, projectId, tutorial, medium, referenceImageUrl, "1024x1024");
  }
  const docData = (await getProgressionDoc(uid, projectId))!;
  const priorMasterUrl = docData.masterImageUrl;

  if (isRegenerationBusy(docData.regenerationState) && docData.masterStatus === "ready") {
    logProgression("regeneration.duplicate_ignored", {
      projectId,
      source: "review_regenerate",
      reason: "atelier_regen_busy",
    });
    return;
  }

  const startedAt = Date.now();
  // Do not clear the prior master before attempting regeneration — a failed
  // attempt must leave the last successful master visible.
  await persist(
    uid,
    projectId,
    {
      masterStatus: "generating",
      masterError: null,
      masterValidation: null,
      masterReviewReasons: [],
      lease: null,
      regenerationState: "generating",
      regenerationStartedAt: startedAt,
      regenerationError: null,
      regenerationPhase: "creating",
      candidateFinalPaintingUrl: null,
    },
    false,
  );

  if (!(await acquireLease(uid, projectId))) return;
  try {
    await runMaster(
      uid,
      projectId,
      { ...docData, masterStatus: "pending", masterImageUrl: priorMasterUrl },
      tutorial,
      medium,
      referenceImageUrl,
      onMasterCandidate,
      true,
    );
    await persist(
      uid,
      projectId,
      {
        ...idleRegenerationFields(),
      },
      true,
    );
  } catch (e) {
    const normalized = normalizeProgressionError(e, {
      operation: "regenerate-master-candidate",
      projectId,
    });
    await persist(
      uid,
      projectId,
      {
        regenerationState: "error",
        regenerationError:
          "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
        regenerationPhase: null,
      },
      true,
    );
    logProgression("regeneration.failed", {
      projectId,
      source: "review_regenerate",
      code: normalized.code,
      "regeneration.total_ms": Date.now() - startedAt,
    });
  } finally {
    await releaseLease(uid, projectId);
  }
}

/**
 * Apply a validated atelier regeneration candidate as the new accepted master,
 * then reset and regenerate dependent stage images.
 */
export async function acceptRegeneratedCandidate(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl } = params;
  const docData = await getProgressionDoc(uid, projectId);
  if (!docData?.candidateFinalPaintingUrl) return;
  if (docData.regenerationState !== "candidateReady") return;

  const candidateUrl = docData.candidateFinalPaintingUrl;
  const applyStarted = Date.now();

  await persist(
    uid,
    projectId,
    {
      regenerationState: "applying",
      regenerationPhase: "preparing",
      regenerationError: null,
    },
    false,
  );

  const resetStages: StageImageRecord[] = docData.stages.map((s) => ({
    ...s,
    targetImageUrl: null,
    generationStatus: "pending",
    error: null,
    validated: false,
    fallback: false,
    previewSource: null,
    createdAt: null,
  }));

  const firestoreStarted = Date.now();
  await persist(
    uid,
    projectId,
    {
      masterImageUrl: candidateUrl,
      masterStatus: "ready",
      masterError: null,
      masterReviewReasons: [],
      stages: resetStages,
      lease: null,
      ...idleRegenerationFields(),
    },
    false,
  );

  logProgression("regeneration.applied", {
    projectId,
    "regeneration.firestore_ms": Date.now() - firestoreStarted,
    "regeneration.apply_ms": Date.now() - applyStarted,
    stages_reset: true,
  });

  const stageStarted = Date.now();
  void orchestrateProgression({
    uid,
    projectId,
    tutorial,
    medium,
    referenceImageUrl,
    size: docData.size,
  })
    .then(() => {
      logProgression("regeneration.stage_generation_settled", {
        projectId,
        "regeneration.stage_generation_ms": Date.now() - stageStarted,
      });
    })
    .catch((e) => {
      console.error(
        "[progression] post-regen stage orchestration failed",
        sanitizeProgressionLogObject(
          normalizeProgressionError(e, {
            operation: "post-regen-stages",
            projectId,
          }),
        ),
      );
    });
}

/** Discard the regeneration candidate and keep the accepted Final Painting. */
export async function dismissRegeneratedCandidate(params: {
  uid: string;
  projectId: string;
}): Promise<void> {
  const { uid, projectId } = params;
  const docData = await getProgressionDoc(uid, projectId);
  if (!docData) return;

  await persist(
    uid,
    projectId,
    {
      ...idleRegenerationFields(),
      // Preserve accepted master; clear any review reasons left from the candidate.
      masterReviewReasons:
        docData.masterStatus === "ready" ? [] : docData.masterReviewReasons,
    },
    false,
  );
  logProgression("regeneration.dismissed", { projectId, kept_current: true });
}

/**
 * User accepted the master. Mark ready, reset stages, and kick off background
 * stage generation without blocking the open lesson.
 */
export async function acceptMaster(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl } = params;
  const docData = await getProgressionDoc(uid, projectId);
  if (!docData?.masterImageUrl) return;
  if (docData.masterStatus !== "needsReview" && docData.masterStatus !== "ready") return;

  const resetStages: StageImageRecord[] = docData.stages.map((s) => ({
    ...s,
    targetImageUrl: null,
    generationStatus: "pending",
    error: null,
    validated: false,
    fallback: false,
    previewSource: null,
    createdAt: null,
  }));

  await persist(
    uid,
    projectId,
    {
      masterStatus: "ready",
      masterError: null,
      masterReviewReasons: [],
      stages: resetStages,
      lease: null,
      ...idleRegenerationFields(),
    },
    false,
  );

  // Background — atelier unlocks from the ready persist above; stages fade in live.
  void orchestrateProgression({
    uid,
    projectId,
    tutorial,
    medium,
    referenceImageUrl,
    size: docData.size,
  }).catch((e) => {
    console.error(
      "[progression] post-accept stage orchestration failed",
      sanitizeProgressionLogObject(
        normalizeProgressionError(e, {
          operation: "accept-master-orchestrate",
          projectId,
        }),
      ),
    );
  });
}

/**
 * Retry a single stage with AI (internal / manual test path). Available even
 * when ENABLE_AI_STAGE_REFINEMENT is false so stage refinement can be evaluated
 * one stage at a time without enabling the automatic loop.
 */
export async function retryStageTarget(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  stageId: StageId;
}): Promise<StageImageRecord[]> {
  const { uid, projectId, tutorial, medium, referenceImageUrl, stageId } = params;
  const docData = await ensureProgression(uid, projectId, tutorial, medium, referenceImageUrl, "1024x1024");
  const stages = [...docData.stages];
  const idx = stages.findIndex((s) => s.stageId === stageId);
  if (idx < 0) return stages;

  stages[idx] = { ...stages[idx], generationStatus: "generating", error: null };
  await persist(uid, projectId, { stages: [...stages] }, false);

  const precedingUrl = idx > 0 ? stages[idx - 1].targetImageUrl ?? null : null;
  const updated = await processStage(stages[idx], {
    uid,
    projectId,
    tutorial,
    medium,
    referenceImageUrl,
    masterImageUrl: docData.masterImageUrl,
    precedingUrl,
    size: docData.size,
  });
  stages[idx] = updated;
  await persist(uid, projectId, { stages: [...stages] }, false);
  return stages;
}
