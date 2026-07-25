import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { z } from "zod";
import { mediumSchema, tutorialSchema, normalizeTutorialInput } from "@/lib/tutorial-schema";
import { STAGE_ORDER, buildStageImagePrompt, buildMasterPrompt } from "@/lib/stage-image-prompts";
import type { StageId } from "@/lib/progression";
import {
  ERR_IMAGE_SAFETY_REVIEW,
  MSG_IMAGE_SAFETY_REVIEW,
  isModerationBlockedError,
  shouldRetryMasterAttempt,
} from "@/lib/master-pipeline";
import {
  COMPOSITION_VALIDATOR_PROMPT,
  compositionValidatorPromptForStage,
  isAcceptable,
  normalizeValidation,
  scoreValidation,
  validationOnError,
  type CompositionValidation,
} from "@/lib/composition-validation";
import {
  applyMeasuredStructure,
  combineCategoryDecision,
  mergeCompositionIntoCategories,
  normalizeStageProgressValidation,
  stageCategoryValidatorPrompt,
  stageProgressOnError,
  type StageProgressValidation,
} from "@/lib/stage-progression-validation";
import {
  isStructureAcceptable,
  structureSimilarity,
  type StructureSimilarityResult,
} from "@/lib/stage-structure-similarity";
import { measureValueStudyTonal } from "@/lib/value-study-tonal.server";

/** Consistent non-2xx JSON shape for the progression client. */
function apiErrorResponse(
  status: number,
  opts: {
    error: string;
    code: string;
    retryable: boolean;
    requestId?: string;
    details?: Record<string, unknown>;
  },
) {
  const body: Record<string, unknown> = {
    error: opts.error,
    code: opts.code,
    retryable: opts.retryable,
  };
  if (opts.requestId) body.requestId = opts.requestId;
  if (opts.details) body.details = opts.details;
  return NextResponse.json(body, { status });
}

export const runtime = "nodejs";
export const maxDuration = 300;

// ============================================================================
// Composition-locked stage-image pipeline.
//
// 1. Generate ONE finished master painting by editing the uploaded reference,
//    preserving exact composition and subject placement.
// 2. Derive Sketch from the master/reference. Every later stage edits the
//    PRIOR STAGE as the primary input, with the master only guiding appearance.
// 3. Validate with FOUR independent categories (structural fidelity, stage
//    progress, premature detail, prior-mark retention), combined without
//    global softening. Early stages are judged vs the prior stage — never by
//    finish-level similarity to the master.
// ============================================================================

const sizeSchema = z.enum(["1024x1024", "1024x1536", "1536x1024"]);
const stageIdSchema = z.enum([
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
]);

const bodySchema = z.object({
  medium: mediumSchema,
  tutorial: tutorialSchema,
  size: sizeSchema.optional(),
  referenceImageUrl: z.string().url().optional(),
  mode: z.enum(["master", "stage"]).optional(),
  stageId: stageIdSchema.optional(),
  masterImageUrl: z.string().url().optional(),
  precedingImageUrl: z.string().url().optional(),
});

type Size = z.infer<typeof sizeSchema>;
type FileLike = Awaited<ReturnType<typeof toFile>>;

const GEN_ENABLED = process.env.ENABLE_STAGE_IMAGE_GEN === "true";
// Master retries unchanged (validation still retries). Stage AI retries default
// to 1 so progression / sketch failures can recover once.
const MASTER_MAX_RETRIES = Math.max(0, Number(process.env.MASTER_GEN_MAX_RETRIES ?? 1));
const STAGE_MAX_RETRIES = Math.max(0, Number(process.env.STAGE_GEN_MAX_RETRIES ?? 2));

export interface StageImageResult {
  stageId: StageId;
  index: number;
  prompt: string;
  dataUrl: string | null;
  url: string | null;
  status: "generated" | "not_generated";
  validated: boolean;
  fallback: boolean;
  validation?: CompositionValidation;
  stageProgress?: StageProgressValidation;
  structureSimilarity?: StructureSimilarityResult | null;
  degraded?: boolean;
}

interface PreparedImage {
  file: FileLike;
  dataUrl: string;
  meta: {
    role: string;
    filename: string;
    mime: string;
    width: number;
    height: number;
    bytes: number;
  };
}

async function bufferToPrepared(
  buffer: Buffer,
  role: string,
  filename: string,
): Promise<PreparedImage> {
  const normalizedBuffer = await sharp(buffer)
    .rotate()
    .toColourspace("srgb")
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();
  const metaInfo = await sharp(normalizedBuffer).metadata();
  const contentType = "image/png";
  return {
    file: await toFile(normalizedBuffer, filename, { type: contentType }),
    dataUrl: `data:${contentType};base64,${normalizedBuffer.toString("base64")}`,
    meta: {
      role,
      filename,
      mime: contentType,
      width: metaInfo.width ?? 0,
      height: metaInfo.height ?? 0,
      bytes: normalizedBuffer.length,
    },
  };
}

async function urlToParts(url: string, name: string): Promise<PreparedImage> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Could not fetch input image "${name}": ${response.status}`);
  }
  const originalBuffer = Buffer.from(await response.arrayBuffer());
  return bufferToPrepared(originalBuffer, name, `${name}.png`);
}

/** Request-scoped buffer cache — reuse identical URLs within one POST. */
function createRequestImageCache() {
  const cache = new Map<string, Promise<PreparedImage>>();
  return {
    urlToParts(url: string, name: string): Promise<PreparedImage> {
      const hit = cache.get(url);
      if (hit) {
        console.warn(
          JSON.stringify({
            event: "reference_fetch_cache_hit",
            name,
            t: Date.now(),
          }),
        );
        return hit;
      }
      const pending = urlToParts(url, name);
      cache.set(url, pending);
      return pending;
    },
  };
}

/**
 * Shrink + weaken the master so IMAGE 2 can guide color without dominating
 * the multi-image edit (full-size finished masters overwhelm pale priors).
 */
async function masterAsSecondaryGuide(masterDataUrl: string): Promise<PreparedImage> {
  const m = /^data:image\/\w+;base64,(.+)$/.exec(masterDataUrl);
  if (!m) throw new Error("masterAsSecondaryGuide expects a data URL");
  const weakened = await sharp(Buffer.from(m[1], "base64"))
    .resize(384, 384, { fit: "inside" })
    .modulate({ brightness: 1.25, saturation: 0.4 })
    .blur(2.5)
    .linear(0.4, 110)
    .png()
    .toBuffer();
  return bufferToPrepared(
    weakened,
    "secondary_master_guide_only",
    "02-master-guide-only-do-not-copy-finish.png",
  );
}

/**
 * gpt-image-1 / gpt-image-1.5 need input_fidelity:"high" for geometry lock.
 * gpt-image-2 already applies high-fidelity input handling — passing the
 * parameter returns 400. gpt-image-1-mini does not support the parameter.
 */
function supportsInputFidelity(model: string): boolean {
  const m = model.toLowerCase().trim();
  if (m.includes("gpt-image-2")) return false;
  if (m.includes("mini")) return false;
  if (m.includes("gpt-image-1.5") || m.includes("gpt-image-1")) return true;
  return false;
}

async function edit(
  client: OpenAI,
  model: string,
  images: FileLike[],
  prompt: string,
  size: Size,
  inputLog?: PreparedImage["meta"][],
  fidelityMode: "auto" | "high" | "low" | "omit" = "auto",
): Promise<string | null> {
  // Multi-image progressive edits: omit high fidelity so the finished master
  // guide cannot become the locked geometry source. Single-image master/sketch
  // edits keep high fidelity for composition lock.
  let fidelity: "high" | "low" | undefined;
  if (fidelityMode === "omit") {
    fidelity = undefined;
  } else if (fidelityMode === "low") {
    fidelity = "low";
  } else if (fidelityMode === "high") {
    fidelity = supportsInputFidelity(model) ? "high" : undefined;
  } else if (images.length > 1) {
    fidelity = undefined;
  } else {
    fidelity = supportsInputFidelity(model) ? "high" : undefined;
  }

  console.warn(
    JSON.stringify({
      event: "stage_edit_request",
      inputCount: images.length,
      inputOrder: inputLog ?? images.map((_, i) => ({ index: i + 1 })),
      input_fidelity: fidelity ?? "omitted",
      fidelityMode,
      size,
      promptAssignedTo: "shared across all image inputs (OpenAI images.edit)",
      promptHead: prompt.slice(0, 500),
      promptLen: prompt.length,
    }),
  );
  const params: {
    model: string;
    image: FileLike | FileLike[];
    prompt: string;
    size: Size;
    n: number;
    input_fidelity?: "high" | "low";
  } = {
    model,
    image: images.length === 1 ? images[0] : images,
    prompt,
    size,
    n: 1,
  };
  if (fidelity) params.input_fidelity = fidelity;
  const result = await client.images.edit(params as Parameters<OpenAI["images"]["edit"]>[0]);
  if (!("data" in result)) {
    throw new Error("Unexpected streaming response from images.edit");
  }
  const first = result.data?.[0];
  if (first?.b64_json) return `data:image/png;base64,${first.b64_json}`;
  return first?.url ?? null;
}

function logValidation(
  label: string,
  attempt: number,
  validation: CompositionValidation,
  rawModelResponse?: unknown,
): void {
  // Use console.warn so Next.js / hosting log drains always surface the payload
  // (console.info is often filtered). Full structured result every attempt.
  const payload = {
    event: "composition_validation",
    label,
    attempt,
    verdict: validation.verdict,
    severity: validation.severity,
    reasons: validation.reasons,
    checks: validation.checks,
    horizon: validation.horizonApplicability,
    horizon_evaluated: validation.horizonApplicability === "evaluated",
    horizon_not_applicable: validation.horizonApplicability === "not_applicable",
    horizon_advisory_only: validation.horizonApplicability === "advisory_only",
    rawModelResponse: rawModelResponse ?? null,
  };
  console.warn("[composition_validation]", JSON.stringify(payload));
}

/**
 * Vision-based composition check. Returns structured severity.
 * If the validator itself errors, accept with a warning (never block the pipeline).
 */
async function validateComposition(
  client: OpenAI,
  model: string,
  anchorDataUrl: string,
  candidateDataUrl: string,
  label: string,
  attempt: number,
  stageId: StageId | "master" = "master",
): Promise<CompositionValidation> {
  let validation: CompositionValidation;
  let rawModelResponse: unknown = null;
  const promptText =
    stageId === "master"
      ? COMPOSITION_VALIDATOR_PROMPT
      : compositionValidatorPromptForStage(stageId);
  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            { type: "image_url", image_url: { url: anchorDataUrl } },
            { type: "image_url", image_url: { url: candidateDataUrl } },
          ],
        },
      ],
    });
    const txt = res.choices[0]?.message?.content ?? "{}";
    try {
      rawModelResponse = JSON.parse(txt);
    } catch {
      rawModelResponse = { parseError: true, text: txt.slice(0, 500) };
    }
    validation = normalizeValidation(rawModelResponse);
  } catch (err) {
    validation = validationOnError(err);
    rawModelResponse = { validatorException: err instanceof Error ? err.message : "unknown" };
  }
  logValidation(label, attempt, validation, rawModelResponse);
  return validation;
}

/**
 * Independent category validation (structure / progress / premature / prior marks).
 * Progressive stages compare against the PRIOR image, not the finished master.
 */
async function validateStageCategories(
  client: OpenAI,
  model: string,
  stageId: StageId,
  candidateDataUrl: string,
  precedingDataUrl: string | null,
  attempt: number,
  compositionAnchorDataUrl?: string | null,
): Promise<StageProgressValidation> {
  if (stageId === "finished") {
    const pass = normalizeStageProgressValidation({
      categories: {
        structuralFidelity: { severity: "pass", reasons: [] },
        stageProgress: { severity: "pass", reasons: [] },
        prematureDetail: { severity: "pass", reasons: [] },
        priorMarkRetention: { severity: "pass", reasons: [] },
      },
    });
    return pass;
  }

  const content: Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  > = [{ type: "text", text: stageCategoryValidatorPrompt(stageId) }];

  if (stageId === "pencil-sketch") {
    if (compositionAnchorDataUrl) {
      content.push({ type: "image_url", image_url: { url: compositionAnchorDataUrl } });
    }
    content.push({ type: "image_url", image_url: { url: candidateDataUrl } });
  } else if (precedingDataUrl) {
    content.push({ type: "image_url", image_url: { url: precedingDataUrl } });
    content.push({ type: "image_url", image_url: { url: candidateDataUrl } });
  } else {
    content.push({ type: "image_url", image_url: { url: candidateDataUrl } });
  }

  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [{ role: "user", content }],
    });
    const txt = res.choices[0]?.message?.content ?? "{}";
    let raw: unknown = {};
    try {
      raw = JSON.parse(txt);
    } catch {
      raw = { parseError: true, text: txt.slice(0, 500) };
    }
    const progress = normalizeStageProgressValidation(raw);
    console.warn(
      JSON.stringify({
        event: "stage_category_validation",
        stageId,
        attempt,
        severity: progress.severity,
        acceptable: progress.acceptable,
        categories: Object.fromEntries(
          Object.entries(progress.categories).map(([k, v]) => [k, v.severity]),
        ),
        reasons: progress.reasons,
      }),
    );
    return progress;
  } catch (err) {
    return stageProgressOnError(err);
  }
}

/**
 * Generate → independent category validation → retry on hard_fail.
 *
 * Categories: structural fidelity, stage progress, premature detail,
 * prior-mark retention. Combined without global softening.
 */
async function generateValidated(
  client: OpenAI,
  imageModel: string,
  visionModel: string,
  inputs: FileLike[],
  prompt: string,
  size: Size,
  compositionAnchorDataUrl: string,
  _masterDataUrl: string,
  label: string,
  stageId: StageId,
  precedingDataUrl: string | null = null,
  inputMeta: PreparedImage["meta"][] = [],
  fidelityMode: "auto" | "high" | "low" | "omit" = "auto",
): Promise<{
  dataUrl: string | null;
  validated: boolean;
  fallback: boolean;
  validation: CompositionValidation | null;
  stageProgress: StageProgressValidation | null;
  structureSimilarity: StructureSimilarityResult | null;
}> {
  let lastValidation: CompositionValidation | null = null;
  let lastProgress: StageProgressValidation | null = null;
  let lastSimilarity: StructureSimilarityResult | null = null;

  for (let attempt = 0; attempt <= STAGE_MAX_RETRIES; attempt++) {
    let candidate: string | null = null;
    try {
      candidate = await edit(
        client,
        imageModel,
        inputs,
        prompt,
        size,
        inputMeta,
        fidelityMode,
      );
    } catch (err) {
      console.error(`Stage edit failed for "${label}" (attempt ${attempt})`, err);
      continue;
    }
    if (!candidate) continue;

    const validation = await validateComposition(
      client,
      visionModel,
      compositionAnchorDataUrl,
      candidate,
      label,
      attempt,
      stageId,
    );
    lastValidation = validation;

    if (precedingDataUrl && stageId !== "pencil-sketch") {
      try {
        lastSimilarity = await structureSimilarity(precedingDataUrl, candidate);
        console.warn(
          JSON.stringify({
            event: "stage_structure_similarity",
            stageId,
            attempt,
            score: lastSimilarity.score,
            mae: lastSimilarity.mae,
            acceptable: isStructureAcceptable(stageId, lastSimilarity),
          }),
        );
      } catch (err) {
        console.warn("[stage_structure_similarity] failed", err);
      }
    }

    let progress = await validateStageCategories(
      client,
      visionModel,
      stageId,
      candidate,
      precedingDataUrl,
      attempt,
      compositionAnchorDataUrl,
    );

    progress = mergeCompositionIntoCategories(progress, validation);
    progress = {
      ...progress,
      categories: applyMeasuredStructure(progress.categories, stageId, lastSimilarity),
    };
    const decision = combineCategoryDecision(progress.categories);
    progress = {
      ...progress,
      severity: decision.severity,
      reasons: decision.reasons,
      acceptable: decision.acceptable,
      checks: {
        ...progress.checks,
        structuralFidelity: progress.categories.structuralFidelity.severity,
        stageCompletion: progress.categories.stageProgress.severity,
        monotonicProgress: progress.categories.stageProgress.severity,
        prematureDetail: progress.categories.prematureDetail.severity,
        priorMarksRetained: progress.categories.priorMarkRetention.severity,
      },
    };
    lastProgress = progress;

    console.warn(
      JSON.stringify({
        event: "stage_category_decision",
        stageId,
        attempt,
        acceptable: progress.acceptable,
        severity: progress.severity,
        categories: {
          structuralFidelity: progress.categories.structuralFidelity.severity,
          stageProgress: progress.categories.stageProgress.severity,
          prematureDetail: progress.categories.prematureDetail.severity,
          priorMarkRetention: progress.categories.priorMarkRetention.severity,
        },
      }),
    );

    if (progress.acceptable) {
      if (stageId === "value-study") {
        try {
          const tonal = await measureValueStudyTonal(candidate);
          console.warn(
            JSON.stringify({
              event: "value_study_tonal",
              stageId,
              attempt,
              nearWhitePct: Number((tonal.nearWhitePct * 100).toFixed(1)),
              middlePct: Number((tonal.middlePct * 100).toFixed(1)),
              darkPct: Number((tonal.darkPct * 100).toFixed(1)),
              nearBlackPct: Number((tonal.nearBlackPct * 100).toFixed(1)),
              meanLuminance: Number(tonal.meanLuminance.toFixed(1)),
              passed: tonal.passed,
              reasons: tonal.reasons,
            }),
          );
          if (!tonal.passed) {
            // One targeted regeneration, then deterministic light fallback.
            if (attempt < 1) continue;
            return {
              dataUrl: null,
              validated: false,
              fallback: true,
              validation,
              stageProgress: progress,
              structureSimilarity: lastSimilarity,
            };
          }
        } catch (err) {
          console.warn("[value_study_tonal] measure failed — accepting with warning", err);
        }
      }
      return {
        dataUrl: candidate,
        validated: progress.severity === "pass",
        fallback: false,
        validation,
        stageProgress: progress,
        structureSimilarity: lastSimilarity,
      };
    }
  }

  console.warn(
    JSON.stringify({
      event: "stage_validation_exhausted",
      label,
      attempts: STAGE_MAX_RETRIES + 1,
      lastSeverity: lastProgress?.severity ?? lastValidation?.severity ?? null,
      lastCategories: lastProgress
        ? Object.fromEntries(
            Object.entries(lastProgress.categories).map(([k, v]) => [k, v.severity]),
          )
        : null,
      lastStructureScore: lastSimilarity?.score ?? null,
      lastReasons: lastProgress?.reasons ?? lastValidation?.reasons ?? [],
      degraded: true,
    }),
  );

  return {
    dataUrl: null,
    validated: false,
    fallback: true,
    validation: lastValidation,
    stageProgress: lastProgress,
    structureSimilarity: lastSimilarity,
  };
}

export async function POST(request: NextRequest) {
  try {
    const rawInput = (await request.json()) as Record<string, unknown>;
    const normalizedInput = normalizeTutorialInput(rawInput);
    const parsed = bodySchema.safeParse(normalizedInput);
    if (!parsed.success) {
      console.error(
        "[generate-stage-images] invalid request",
        parsed.error.flatten(),
      );
      return apiErrorResponse(400, {
        error: "The stage-image request was invalid.",
        code: "ERR_INVALID_REQUEST",
        retryable: false,
        details: { formErrors: parsed.error.flatten().formErrors },
      });
    }
    const body = parsed.data;
    const { medium, tutorial, size, referenceImageUrl, stageId, masterImageUrl, precedingImageUrl } = body;
    const mode = body.mode ?? (stageId ? "stage" : "master");
    const imageSize: Size = size ?? "1024x1024";
    const requestStartedAt = Date.now();
    const imageCache = createRequestImageCache();
    console.warn(
      JSON.stringify({
        scope: "generate-stage-images",
        event: "api_route_received",
        mode,
        stageId: stageId ?? null,
        hasReference: Boolean(referenceImageUrl),
        hasMaster: Boolean(masterImageUrl),
        hasPreceding: Boolean(precedingImageUrl),
        genEnabled: GEN_ENABLED,
        t: requestStartedAt,
      }),
    );
    const total = STAGE_ORDER.length;
    const promptFor = (sid: StageId) =>
      buildStageImagePrompt({ tutorial, medium, stageId: sid, index: STAGE_ORDER.indexOf(sid) + 1, total });

    if (!GEN_ENABLED || !process.env.OPENAI_API_KEY) {
      if (mode === "master") {
        return NextResponse.json({
          generated: false,
          master: null,
          masterValidated: false,
          masterNeedsReview: false,
          masterValidation: null,
          images: [],
        });
      }
      const order: StageId[] = stageId ? [stageId] : STAGE_ORDER;
      const images: StageImageResult[] = order.map((sid) => ({
        stageId: sid,
        index: STAGE_ORDER.indexOf(sid) + 1,
        prompt: promptFor(sid),
        dataUrl: null,
        url: null,
        status: "not_generated",
        validated: false,
        fallback: false,
      }));
      return NextResponse.json({
        generated: false,
        master: null,
        masterValidated: false,
        masterNeedsReview: false,
        masterValidation: null,
        images,
      });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const imageModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-1";
    const visionModel = process.env.OPENAI_VISION_MODEL || "gpt-4o-mini";
    console.warn(
      JSON.stringify({
        event: "stage_image_models",
        imageModel,
        visionModel,
        inputFidelity: supportsInputFidelity(imageModel) ? "high" : "omitted",
      }),
    );

    // ---- Single-stage regeneration ----------------------------------------
    if (mode === "stage") {
      if (!stageId) {
        return apiErrorResponse(400, {
          error: "stageId is required for stage mode.",
          code: "ERR_INVALID_REQUEST",
          retryable: false,
        });
      }
      const anchorUrl = masterImageUrl || referenceImageUrl;
      if (!anchorUrl) {
        return apiErrorResponse(400, {
          error: "A master or reference image is required.",
          code: "ERR_INVALID_REQUEST",
          retryable: false,
        });
      }
      const anchor = await imageCache.urlToParts(anchorUrl, "anchor");
      const index = STAGE_ORDER.indexOf(stageId) + 1;
      const prompt = promptFor(stageId);

      let result: {
        dataUrl: string | null;
        validated: boolean;
        fallback: boolean;
        validation: CompositionValidation | null;
        stageProgress: StageProgressValidation | null;
        structureSimilarity: StructureSimilarityResult | null;
      };

      if (stageId === "finished" && masterImageUrl) {
        result = {
          dataUrl: anchor.dataUrl,
          validated: true,
          fallback: false,
          validation: {
            verdict: "accept",
            severity: "pass",
            reasons: [],
            checks: {
              crop: "pass",
              aspectRatio: "pass",
              subjectCount: "pass",
              subjectPlacement: "pass",
              perspective: "pass",
              horizon: "pass",
              embeddedText: "pass",
            },
            horizonApplicability: "not_applicable",
          },
          stageProgress: null,
          structureSimilarity: null,
        };
      } else if (stageId === "pencil-sketch") {
        const sketchInput = await bufferToPrepared(
          Buffer.from(anchor.dataUrl.split(",")[1]!, "base64"),
          "primary_editable_anchor",
          "01-composition-anchor.png",
        );
        result = await generateValidated(
          client,
          imageModel,
          visionModel,
          [sketchInput.file],
          prompt,
          imageSize,
          anchor.dataUrl,
          anchor.dataUrl,
          stageId,
          stageId,
          null,
          [sketchInput.meta],
          "high",
        );
      } else {
        // IMAGE 1 = full prior (editable, high fidelity). IMAGE 2 = tiny weakened master guide.
        if (!precedingImageUrl) {
          return apiErrorResponse(400, {
            error: "precedingImageUrl is required for stages after the pencil sketch.",
            code: "ERR_INVALID_REQUEST",
            retryable: false,
          });
        }
        const preceding = await imageCache.urlToParts(precedingImageUrl, "primary_prior_in_progress");
        const prior = await bufferToPrepared(
          Buffer.from(preceding.dataUrl.split(",")[1]!, "base64"),
          "primary_editable_prior",
          "01-prior-in-progress.png",
        );

        // Early wash stages: edit PRIOR ONLY with high fidelity. A second finished
        // master file still tends to move/resize subjects. Build/Refine may include
        // a tiny weakened master guide for color temperature.
        // IMAGE 1 = full prior (high fidelity). IMAGE 2 = tiny weakened master
        // guide for color only (cannot dominate pixel geometry).
        const useMasterGuide = true;
        let inputs: FileLike[] = [prior.file];
        let inputMeta: PreparedImage["meta"][] = [prior.meta];
        if (useMasterGuide) {
          const guide = await masterAsSecondaryGuide(anchor.dataUrl);
          inputs = [prior.file, guide.file];
          inputMeta = [prior.meta, guide.meta];
        }

        console.warn(
          JSON.stringify({
            event: "stage_edit_inputs_prepared",
            stageId,
            inputs: inputMeta,
            compositionAnchor: "prior_stage",
            masterGuideAttached: useMasterGuide,
            note: useMasterGuide
              ? "Prior is full-size editable canvas; master is a small weakened guide only."
              : "Prior-only edit (high fidelity) — master guide omitted to prevent subject drift.",
          }),
        );

        const stagePrompt = useMasterGuide
          ? prompt
          : [
              prompt,
              "NOTE: Only IMAGE 1 (the in-progress painting) is attached to this edit request.",
              "There is no finished master file in the request. Do not invent a finished painting.",
              "Advance the attached in-progress image with a minimal layer only.",
            ].join(" ");

        result = await generateValidated(
          client,
          imageModel,
          visionModel,
          inputs,
          stagePrompt,
          imageSize,
          prior.dataUrl,
          anchor.dataUrl,
          stageId,
          stageId,
          prior.dataUrl,
          inputMeta,
          "high",
        );
      }

      const images: StageImageResult[] = [{
        stageId,
        index,
        prompt,
        dataUrl: result.dataUrl,
        url: null,
        status: result.dataUrl ? "generated" : "not_generated",
        validated: result.validated,
        fallback: result.fallback,
        degraded: result.fallback,
        validation: result.validation ?? undefined,
        stageProgress: result.stageProgress ?? undefined,
        structureSimilarity: result.structureSimilarity ?? undefined,
      }];
      return NextResponse.json({
        generated: true,
        master: { dataUrl: anchor.dataUrl, url: null, prompt: "" },
        masterValidated: true,
        masterNeedsReview: false,
        masterValidation: null,
        images,
      });
    }

    // ---- Master painting --------------------------------------------------
    if (!referenceImageUrl) {
      return apiErrorResponse(400, {
        error: "referenceImageUrl is required for master mode.",
        code: "ERR_INVALID_REQUEST",
        retryable: false,
      });
    }
    let referenceFetchMs = 0;
    let editMs = 0;
    let validationMs = 0;
    const fetchStarted = Date.now();
    const reference = await imageCache.urlToParts(referenceImageUrl, "reference");
    referenceFetchMs = Date.now() - fetchStarted;
    const masterPrompt = buildMasterPrompt(tutorial, medium);

    let bestCandidate: string | null = null;
    let bestValidation: CompositionValidation | null = null;
    let bestScore = -Infinity;
    let acceptedValidation: CompositionValidation | null = null;
    let acceptedCandidate: string | null = null;
    let attemptCount = 0;

    for (let attempt = 0; attempt <= MASTER_MAX_RETRIES; attempt++) {
      attemptCount = attempt + 1;
      let candidate: string | null = null;
      try {
        // Reuse the already-fetched reference file for every attempt in this request.
        const editStarted = Date.now();
        candidate = await edit(client, imageModel, [reference.file], masterPrompt, imageSize);
        editMs += Date.now() - editStarted;
      } catch (err) {
        const requestID =
          err && typeof err === "object" && "requestID" in err
            ? String((err as { requestID: unknown }).requestID)
            : err && typeof err === "object" && "request_id" in err
              ? String((err as { request_id: unknown }).request_id)
              : undefined;
        const safetyViolations =
          err && typeof err === "object" && "safety_violations" in err && Array.isArray((err as { safety_violations: unknown }).safety_violations)
            ? ((err as { safety_violations: unknown[] }).safety_violations).map(String)
            : [];

        if (isModerationBlockedError(err)) {
          console.warn(
            JSON.stringify({
              event: "master_generation_moderation_blocked",
              projectId: null,
              attempt,
              requestID: requestID ?? null,
              safetyViolations,
              retryable: false,
            }),
          );
          return apiErrorResponse(422, {
            error: MSG_IMAGE_SAFETY_REVIEW,
            code: ERR_IMAGE_SAFETY_REVIEW,
            retryable: false,
            requestId: requestID,
            details: safetyViolations.length > 0 ? { safetyViolations } : undefined,
          });
        }

        console.error(`Master edit failed (attempt ${attempt})`, {
          message: err instanceof Error ? err.message : String(err),
          requestID: requestID ?? null,
        });

        if (!shouldRetryMasterAttempt(err, attempt, MASTER_MAX_RETRIES)) {
          break;
        }
        continue;
      }
      if (!candidate) {
        if (attempt >= MASTER_MAX_RETRIES) break;
        continue;
      }

      const validationStarted = Date.now();
      const validation = await validateComposition(
        client,
        visionModel,
        reference.dataUrl,
        candidate,
        "master",
        attempt,
      );
      validationMs += Date.now() - validationStarted;

      const score = scoreValidation(validation);
      if (score >= bestScore) {
        bestScore = score;
        bestCandidate = candidate;
        bestValidation = validation;
      }

      if (isAcceptable(validation)) {
        acceptedValidation = validation;
        acceptedCandidate = candidate;
        if (validation.severity === "warning") {
          console.warn(
            "[composition_validation] master accepted with warning — continuing stage generation",
            JSON.stringify(validation),
          );
        }
        break;
      }
      console.warn(
        "[composition_validation] master hard_fail — retrying if attempts remain",
        JSON.stringify({ attempt, score, reasons: validation.reasons, checks: validation.checks }),
      );
    }

    const totalMs = Date.now() - requestStartedAt;
    console.warn(
      JSON.stringify({
        event: "master_generation_timing",
        referenceFetchMs,
        editMs,
        validationMs,
        uploadMs: null,
        totalMs,
        attempts: attemptCount,
        accepted: Boolean(acceptedCandidate),
        "regeneration.reference_fetch_ms": referenceFetchMs,
        "regeneration.master_generation_ms": editMs,
        "regeneration.validation_ms": validationMs,
        "regeneration.total_ms": totalMs,
        "regeneration.retry_count": Math.max(0, attemptCount - 1),
        "regeneration.model": imageModel,
        "regeneration.input_fidelity": supportsInputFidelity(imageModel) ? "high" : "omitted",
        t: Date.now(),
      }),
    );

    if (!bestCandidate && !acceptedCandidate) {
      return apiErrorResponse(502, {
        error: "Image generation temporarily failed.",
        code: "ERR_MASTER_GENERATE",
        retryable: true,
      });
    }

    if (acceptedCandidate && acceptedValidation) {
      return NextResponse.json({
        generated: true,
        master: { dataUrl: acceptedCandidate, url: null, prompt: masterPrompt },
        masterValidated: true,
        masterNeedsReview: false,
        masterSeverity: acceptedValidation.severity,
        masterValidation: acceptedValidation,
        imageModel,
        inputFidelity: supportsInputFidelity(imageModel) ? "high" : "omitted",
        images: [],
        timing: {
          referenceFetchMs,
          editMs,
          validationMs,
          totalMs,
          attempts: attemptCount,
        },
      });
    }

    // Both (or all) attempts hard-failed: return the BEST rejected candidate
    // for needsReview. Never discard progress with a terminal validation 502.
    console.warn(
      JSON.stringify({
        event: "master_needs_review",
        attempts: MASTER_MAX_RETRIES + 1,
        bestScore,
        validation: bestValidation,
        imageModel,
        inputFidelity: supportsInputFidelity(imageModel) ? "high" : "omitted",
      }),
    );

    return NextResponse.json({
      generated: true,
      master: { dataUrl: bestCandidate, url: null, prompt: masterPrompt },
      masterValidated: false,
      masterNeedsReview: true,
      masterSeverity: bestValidation?.severity ?? "hard_fail",
      masterValidation: bestValidation,
      imageModel,
      inputFidelity: supportsInputFidelity(imageModel) ? "high" : "omitted",
      images: [],
      timing: {
        referenceFetchMs,
        editMs,
        validationMs,
        totalMs,
        attempts: attemptCount,
      },
    });
  } catch (error) {
    console.error(
      "Stage image generation failed",
      error instanceof Error
        ? { name: error.name, message: error.message }
        : { message: "Unknown progression error" },
    );
    if (error instanceof z.ZodError) {
      return apiErrorResponse(400, {
        error: "The stage-image request was invalid.",
        code: "ERR_INVALID_REQUEST",
        retryable: false,
      });
    }
    if (error instanceof OpenAI.APIError) {
      const status = error.status || 500;
      const retryable = status === 408 || status === 429 || (status >= 500 && status <= 599);
      return apiErrorResponse(status, {
        error: retryable
          ? "Image generation temporarily failed."
          : "The image service could not complete this request.",
        code: status === 422 ? ERR_IMAGE_SAFETY_REVIEW : "ERR_STAGE_GENERATE",
        retryable,
        requestId: typeof error.requestID === "string" ? error.requestID : undefined,
      });
    }
    return apiErrorResponse(500, {
      error: "Image generation temporarily failed.",
      code: "ERR_STAGE_GENERATE",
      retryable: true,
    });
  }
}
