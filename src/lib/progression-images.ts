"use client";

import { doc, getDoc, onSnapshot, runTransaction, serverTimestamp, setDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "@/lib/firebase";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { STAGE_ORDER, buildStageImagePrompt } from "@/lib/stage-image-prompts";
import { buildStageFallback, toDataUrl } from "@/lib/stage-fallback";
import { normalizeGenerationStatus, type GenerationStatus, type StageId, type StageImageRecord } from "@/lib/progression";
import {
  userFacingReasons,
  type CompositionValidation,
} from "@/lib/composition-validation";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";

// ============================================================================
// Composition-locked, RESUMABLE two-image stage model (client orchestration).
//
// Generation is split into independent, short requests so no single HTTP call
// stays open for the whole sequence:
//   1. Immediately seed provisional previews from the REFERENCE photo
//      (previewSource: "reference") so targets appear before the master exists.
//   2. One request generates + validates the MASTER painting. Pass and warning
//      both persist as ready and continue. Hard-fail after retries persists the
//      candidate as needsReview (Accept / Regenerate) — never a terminal 502
//      that discards progress. The client uploads and persists it. Stage
//      derivation still runs when a masterImageUrl exists (ready OR needsReview).
//   3. Replace reference previews with master-derived previews
//      (previewSource: "master"). Finished uses the master — never the photo.
//   4. Then one request PER stage derives that stage from the master (+ the
//      preceding stage). Each result is persisted immediately, so the Firestore
//      subscription updates the lesson UI as each stage lands.
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
// Storage: image bytes at users/{uid}/projects/{projectId}/stages/{name}.png
//   (name = stageId | "master"). The original reference is never overwritten.
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
    () => cb(null),
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

async function uploadDataUrl(uid: string, projectId: string, name: string, dataUrl: string): Promise<string> {
  const blob = dataUrlToBlob(dataUrl);
  const object = ref(storage, `users/${uid}/projects/${projectId}/stages/${name}.png`);
  await uploadBytes(object, blob, { contentType: blob.type || "image/png" });
  return getDownloadURL(object);
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
}

/** User-facing copy — never surface raw validation JSON or HTTP details. */
const ERR_MASTER_GENERATE = "Couldn’t prepare the master painting. Please try again.";
const ERR_MASTER_SAVE = "Couldn’t save the master painting. Please try again.";
const ERR_STAGE_GENERATE = "This demonstration couldn’t be generated. Please retry.";
const ERR_STAGE_SAVE = "Couldn’t save this demonstration. Please retry.";

/** Dedup concurrent orchestrateProgression calls for the same project. */
const orchestrationInflight = new Map<string, Promise<void>>();

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

async function callApi(body: {
  mode: "master" | "stage";
  medium: Medium;
  tutorial: Tutorial;
  size: ImageSize;
  referenceImageUrl?: string;
  stageId?: StageId;
  masterImageUrl?: string;
  precedingImageUrl?: string;
}): Promise<ApiResponse> {
  logProgression("generation_request_started", {
    mode: body.mode,
    stageId: body.stageId ?? null,
  });
  const res = await fetch("/api/generate-stage-images", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  let data: ApiResponse & { error?: string } = { generated: false, master: null, images: [] };
  try {
    data = await res.json();
  } catch {
    /* ignore parse errors */
  }
  if (!res.ok) {
    console.error("[progression] API error", { status: res.status, error: data?.error });
    throw new Error(body.mode === "master" ? ERR_MASTER_GENERATE : ERR_STAGE_GENERATE);
  }
  return data as ApiResponse;
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
    const reason = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
    console.error(`[progression] stage "${stageId}" failed`, e);
    logProgression("stage_refinement_failed", {
      projectId: ctx.projectId,
      stageId,
      reason,
      stack: e instanceof Error ? e.stack ?? null : null,
    });
    const uploadFail = e instanceof Error && /save|upload|storage/i.test(e.message);
    // Preserve provisional image so later stages can continue from it.
    if (existing.targetImageUrl) {
      return {
        ...existing,
        generationStatus: "ready",
        error: null,
        fallback: true,
        retryCount: existing.retryCount + 1,
      };
    }
    return {
      ...existing,
      generationStatus: "failed",
      error: uploadFail ? ERR_STAGE_SAVE : ERR_STAGE_GENERATE,
      retryCount: existing.retryCount + 1,
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
    console.error(`[progression] could not load ${source} for stage previews`, e);
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

    try {
      const precedingForFallback =
        s.stageId === "pencil-sketch" ? null : chainDataUrl;
      const fb = await buildStageFallback(
        sourceDataUrl,
        s.stageId,
        precedingForFallback,
      );
      const url = await uploadDataUrl(uid, projectId, s.stageId, fb);
      chainDataUrl = fb;
      stages[i] = {
        ...s,
        targetImageUrl: url,
        generationStatus: masterTargetsAreFinal ? "ready" : "generating",
        error: null,
        validated: false,
        fallback: true,
        previewSource: masterTargetsAreFinal ? null : source,
        createdAt: Date.now(),
      };
      await persist(uid, projectId, { stages: [...stages] }, true);
      derivedCount++;
    } catch (e) {
      console.error(`[progression] ${source} preview seed failed for "${s.stageId}"`, e);
      if (!s.targetImageUrl) stages[i] = { ...s, generationStatus: "pending", error: null };
    }
  }

  if (source === "master") {
    logProgression("master_preview_derivation_complete", {
      projectId,
      ok: true,
      derivedCount,
      masterTargetsAreFinal,
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
// Warnings and passes → ready (continue stages). Final hard_fail → needsReview
// (candidate is saved; user Accept / Regenerate). Never discards the candidate.
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
  logProgression("master_generation_started", { projectId, size: docData.size });
  await persist(uid, projectId, {
    masterStatus: "generating",
    masterError: null,
    masterValidation: null,
    masterReviewReasons: [],
  }, true);

  let response: ApiResponse;
  try {
    response = await callApi({ mode: "master", medium, tutorial, size: docData.size, referenceImageUrl });
  } catch (e) {
    console.error("[progression] master API failed", e);
    await persist(uid, projectId, { masterStatus: "failed", masterError: ERR_MASTER_GENERATE }, true);
    return { ...docData, masterStatus: "failed", masterError: ERR_MASTER_GENERATE };
  }

  if (!response.generated || !response.master?.dataUrl) {
    logProgression("master_response_received", {
      projectId,
      generated: false,
      reason: "missing_master_dataUrl",
    });
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
  const reasons = userFacingReasons(validation);
  // Canonical master statuses: pending | generating | ready | needsReview | failed
  // ready = continue stage chain; needsReview = candidate saved, review UI, still usable for stages
  const validationNeedsReview = Boolean(
    response.masterNeedsReview ||
    response.masterValidated === false,
  );

  const needsReview = forceReview || validationNeedsReview;

  const status: "ready" | "needsReview" =
    needsReview ? "needsReview" : "ready";

  if (response.masterValidation) {
    console.warn("[progression] master validation", JSON.stringify(response.masterValidation));
  }

  // Show the candidate immediately (object URL) while Storage upload runs.
  try {
    const previewUrl = URL.createObjectURL(dataUrlToBlob(response.master.dataUrl));
    onMasterCandidate?.({ previewUrl, status, reasons, validation });
  } catch (e) {
    console.error("[progression] could not create master preview", e);
  }

  // For needsReview, persist status + reasons immediately so Accept/Regenerate
  // appear at once; the image shows via previewUrl until Storage URL lands.
  if (needsReview) {
    await persist(
      uid,
      projectId,
      {
        masterStatus: "needsReview",
        masterError: null,
        masterPrompt: response.master.prompt ?? null,
        masterValidation: validation,
        masterReviewReasons: reasons,
      },
      true,
    );
  }

  let masterImageUrl: string;
  try {
    masterImageUrl = await uploadDataUrl(uid, projectId, "master", response.master.dataUrl);
  } catch (e) {
    console.error("[progression] master upload failed", e);
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

  return {
    ...docData,
    masterImageUrl,
    masterPrompt,
    masterStatus: status,
    masterError: null,
    masterValidation: validation,
    masterReviewReasons: reasons,
  };
}

/**
 * Resumable client runner:
 *  1. Start master generation immediately (API fetches the Firebase image URL).
 *  2. Seed provisional reference-derived previews in parallel (may use image-proxy;
 *     must not block the master POST).
 *  3. After master is ready OR needsReview (image saved), replace with master-derived previews.
 *  4. Optional AI refine per unfinished stage when the flag is on.
 *  5. Lease + in-flight map prevent duplicate jobs across reloads/tabs.
 *     In-flight wraps the FULL orchestration (master + stages), not master alone.
 */
export async function orchestrateProgression(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  size?: ImageSize;
  onMasterCandidate?: MasterCandidateHandler;
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl, onMasterCandidate } = params;
  const key = progressionKey(uid, projectId);

  logProgression("trigger_evaluated", {
    projectId,
    hasTutorial: Boolean(tutorial),
    hasMedium: Boolean(medium),
    hasReferenceUrl: Boolean(referenceImageUrl),
  });

  if (!tutorial || !medium || !referenceImageUrl) {
    logProgression("generation_skipped", {
      projectId,
      reason: "missing_tutorial_medium_or_referenceUrl",
    });
    return;
  }

  const existing = orchestrationInflight.get(key);
  if (existing) {
    logProgression("generation_skipped", { projectId, reason: "already_in_flight" });
    return existing;
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
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl, onMasterCandidate } = params;
  const base = await ensureProgression(
    uid,
    projectId,
    tutorial,
    medium,
    referenceImageUrl,
    params.size ?? "1024x1024",
  );

  if (base.masterStatus === "failed") {
    logProgression("generation_skipped", { projectId, reason: "master_status_failed" });
    return;
  }

  const needsDeterministic = stagesNeedDeterministicWork(base.stages);
  const needsAi = ENABLE_AI_STAGE_REFINEMENT && base.stages.some(needsAiRefine);
  const masterUsable = masterUsableForStages(base);

  // needsReview with a saved master still runs stage derivation when stages are incomplete.
  if (base.masterStatus === "needsReview" && masterUsable && !needsDeterministic && !needsAi) {
    logProgression("generation_skipped", {
      projectId,
      reason: "master_needs_review_stages_already_complete",
    });
    return;
  }
  if (base.masterStatus === "needsReview" && !base.masterImageUrl) {
    logProgression("generation_skipped", { projectId, reason: "master_needs_review_without_image" });
    return;
  }

  if (masterUsable && !needsDeterministic && !needsAi) {
    logProgression("generation_skipped", {
      projectId,
      reason: "master_and_stages_already_complete",
    });
    return;
  }

  if (!(await acquireLease(uid, projectId))) {
    logProgression("generation_skipped", { projectId, reason: "lease_held_by_another_client" });
    return;
  }

  try {
    let docData = (await getProgressionDoc(uid, projectId)) ?? base;
    // Do not re-run master when status is ready/needsReview and image exists.
    const needsMaster =
      !docData.masterImageUrl ||
      docData.masterStatus === "pending" ||
      docData.masterStatus === "generating";

    // Master first / in parallel: the API fetches the Firebase Storage URL itself.
    // Do NOT await reference seed (image-proxy + canvas) before POSTing master.
    const masterWork: Promise<ProgressionDoc> = needsMaster
      ? runMaster(uid, projectId, docData, tutorial, medium, referenceImageUrl, onMasterCandidate)
      : Promise.resolve(docData);

    const seedWork: Promise<StageImageRecord[]> = seedStagePreviews(
      uid,
      projectId,
      docData,
      referenceImageUrl,
      "reference",
    ).catch((e) => {
      console.error("[progression] reference seed failed (non-blocking for master)", e);
      return docData.stages;
    });

    docData = await masterWork;

    if (!masterUsableForStages(docData)) {
      logProgression("generation_skipped", {
        projectId,
        reason: `master_not_usable_after_run:${docData.masterStatus}`,
        hasMasterImageUrl: Boolean(docData.masterImageUrl),
      });
      // Still await seed so provisional reference previews can land.
      await seedWork;
      logProgression("orchestration_complete", {
        projectId,
        outcome: "stopped_after_master",
        masterStatus: docData.masterStatus,
      });
      return;
    }

    // Let reference seed finish (or no-op) before replacing with master-derived targets.
    await seedWork;

    const stages = await seedStagePreviews(uid, projectId, docData, docData.masterImageUrl!, "master");
    docData = { ...docData, stages };

    if (!ENABLE_AI_STAGE_REFINEMENT) {
      logProgression("orchestration_complete", {
        projectId,
        outcome: "master_derived_targets_final",
        masterStatus: docData.masterStatus,
        aiRefinement: false,
      });
      return;
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
        const reason = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
        logProgression("stage_refinement_failed", {
          projectId,
          stageId: s.stageId,
          reason,
          stack: e instanceof Error ? e.stack ?? null : null,
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
  } finally {
    await releaseLease(uid, projectId);
  }
}

/** Reset every target + the master, then re-run the resumable pipeline. */
export async function regenerateAllTargets(params: {
  uid: string;
  projectId: string;
  tutorial: Tutorial;
  medium: Medium;
  referenceImageUrl: string;
  size?: ImageSize;
  onMasterCandidate?: MasterCandidateHandler;
}): Promise<void> {
  const { uid, projectId, tutorial, medium, referenceImageUrl, onMasterCandidate } = params;
  const existing = await getProgressionDoc(uid, projectId);
  const size = params.size ?? existing?.size ?? "1024x1024";
  const baseDoc = existing ?? (await ensureProgression(uid, projectId, tutorial, medium, referenceImageUrl, size));
  const reset: StageImageRecord[] = baseDoc.stages.map((s) => ({
    ...s,
    targetImageUrl: null,
    generationStatus: "pending",
    error: null,
    validated: false,
    fallback: false,
    previewSource: null,
  }));
  await persist(
    uid,
    projectId,
    {
      masterImageUrl: null,
      masterPrompt: null,
      masterStatus: "pending",
      masterError: null,
      masterValidation: null,
      masterReviewReasons: [],
      lease: null,
      stages: reset,
    },
    false,
  );
  await orchestrateProgression({ uid, projectId, tutorial, medium, referenceImageUrl, size, onMasterCandidate });
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

  await persist(
    uid,
    projectId,
    {
      masterImageUrl: null,
      masterPrompt: null,
      masterStatus: "pending",
      masterError: null,
      masterValidation: null,
      masterReviewReasons: [],
      lease: null,
    },
    false,
  );

  if (!(await acquireLease(uid, projectId))) return;
  try {
    await runMaster(uid, projectId, { ...docData, masterStatus: "pending", masterImageUrl: null }, tutorial, medium, referenceImageUrl, onMasterCandidate, true);
  } finally {
    await releaseLease(uid, projectId);
  }
}

/**
 * User accepted a needsReview master. Reset stages and continue from the first
 * unfinished item without regenerating the master.
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
    },
    false,
  );

  await orchestrateProgression({
    uid,
    projectId,
    tutorial,
    medium,
    referenceImageUrl,
    size: docData.size,
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
