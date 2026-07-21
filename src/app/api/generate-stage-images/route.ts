import OpenAI, { toFile } from "openai";
import { NextRequest, NextResponse } from "next/server";
import { Buffer } from "node:buffer";
import sharp from "sharp";
import { z } from "zod";
import { mediumSchema, tutorialSchema } from "@/lib/tutorial-schema";
import { STAGE_ORDER, buildStageImagePrompt, buildMasterPrompt } from "@/lib/stage-image-prompts";
import type { StageId } from "@/lib/progression";
import {
  COMPOSITION_VALIDATOR_PROMPT,
  isAcceptable,
  normalizeValidation,
  scoreValidation,
  validationOnError,
  type CompositionValidation,
} from "@/lib/composition-validation";

export const runtime = "nodejs";
export const maxDuration = 300;

// ============================================================================
// Composition-locked stage-image pipeline.
//
// 1. Generate ONE finished master painting by editing the uploaded reference,
//    preserving exact composition and subject placement.
// 2. Derive every stage from that master (plus the preceding stage for
//    continuity) via image-to-image edits, so the whole sequence shares one
//    locked composition and identical crop/dimensions.
// 3. Validate with structured severity (pass / warning / hard_fail). Retry only
//    on hard_fail. Warnings persist and continue. Final master hard_fail saves
//    the candidate as needsReview (no terminal 502 that discards progress).
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
// to 0 for MVP testing — override with STAGE_GEN_MAX_RETRIES if needed.
const MASTER_MAX_RETRIES = Math.max(0, Number(process.env.MASTER_GEN_MAX_RETRIES ?? 1));
const STAGE_MAX_RETRIES = Math.max(0, Number(process.env.STAGE_GEN_MAX_RETRIES ?? 0));

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
}

async function urlToParts(
  url: string,
  name: string,
): Promise<{
  file: FileLike;
  dataUrl: string;
}> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Could not fetch input image "${name}": ${response.status}`,
    );
  }

  const originalBuffer = Buffer.from(
    await response.arrayBuffer(),
  );

  /*
   * Normalize every uploaded image before sending it to OpenAI.
   *
   * Phone photos can contain CMYK color, unusual JPEG modes,
   * orientation metadata, or encodings that browsers display but
   * the image-edit endpoint rejects.
   */
  const normalizedBuffer = await sharp(originalBuffer)
    .rotate()
    .toColourspace("srgb")
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  const contentType = "image/png";
  const filename = `${name}.png`;

  return {
    file: await toFile(normalizedBuffer, filename, {
      type: contentType,
    }),

    dataUrl: `data:${contentType};base64,${normalizedBuffer.toString(
      "base64",
    )}`,
  };
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

async function edit(client: OpenAI, model: string, images: FileLike[], prompt: string, size: Size): Promise<string | null> {
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
  if (supportsInputFidelity(model)) {
    params.input_fidelity = "high";
  }
  // Cast: older openai typings may omit input_fidelity; runtime API accepts it on gpt-image-1 / 1.5.
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
): Promise<CompositionValidation> {
  let validation: CompositionValidation;
  let rawModelResponse: unknown = null;
  try {
    const res = await client.chat.completions.create({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: COMPOSITION_VALIDATOR_PROMPT },
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
 * Generate → validate → retry only on hard_fail.
 * Warnings and passes accept the candidate.
 * Final hard_fail (stages): return fallback flag so the client can apply a
 * deterministic transform. Master mode handles needsReview separately.
 */
async function generateValidated(
  client: OpenAI,
  imageModel: string,
  visionModel: string,
  inputs: FileLike[],
  prompt: string,
  size: Size,
  anchorDataUrl: string,
  label: string,
): Promise<{ dataUrl: string | null; validated: boolean; fallback: boolean; validation: CompositionValidation | null }> {
  let lastValidation: CompositionValidation | null = null;

  for (let attempt = 0; attempt <= STAGE_MAX_RETRIES; attempt++) {
    let candidate: string | null = null;
    try {
      candidate = await edit(client, imageModel, inputs, prompt, size);
    } catch (err) {
      console.error(`Stage edit failed for "${label}" (attempt ${attempt})`, err);
      continue;
    }
    if (!candidate) continue;

    const validation = await validateComposition(client, visionModel, anchorDataUrl, candidate, label, attempt);
    lastValidation = validation;

    if (isAcceptable(validation)) {
      return {
        dataUrl: candidate,
        validated: validation.severity === "pass",
        fallback: false,
        validation,
      };
    }
    // hard_fail → retry (if attempts remain)
  }

  console.warn(
    JSON.stringify({
      event: "composition_validation_exhausted",
      label,
      attempts: STAGE_MAX_RETRIES + 1,
      lastSeverity: lastValidation?.severity ?? null,
      lastReasons: lastValidation?.reasons ?? [],
    }),
  );

  // Stage path: do not return a hard-failed AI image; client uses deterministic fallback.
  return {
    dataUrl: null,
    validated: false,
    fallback: true,
    validation: lastValidation,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = bodySchema.parse(await request.json());
    const { medium, tutorial, size, referenceImageUrl, stageId, masterImageUrl, precedingImageUrl } = body;
    const mode = body.mode ?? (stageId ? "stage" : "master");
    const imageSize: Size = size ?? "1024x1024";
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
      if (!stageId) return NextResponse.json({ error: "stageId is required for stage mode." }, { status: 400 });
      const anchorUrl = masterImageUrl || referenceImageUrl;
      if (!anchorUrl) return NextResponse.json({ error: "A master or reference image is required." }, { status: 400 });

      const anchor = await urlToParts(anchorUrl, "anchor");
      const index = STAGE_ORDER.indexOf(stageId) + 1;
      const prompt = promptFor(stageId);

      let result: { dataUrl: string | null; validated: boolean; fallback: boolean; validation: CompositionValidation | null };
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
          },
        };
      } else if (stageId === "pencil-sketch") {
        result = await generateValidated(client, imageModel, visionModel, [anchor.file], prompt, imageSize, anchor.dataUrl, stageId);
      } else {
        const preceding = precedingImageUrl ? await urlToParts(precedingImageUrl, "preceding") : null;
        const inputs = preceding ? [anchor.file, preceding.file] : [anchor.file];
        result = await generateValidated(client, imageModel, visionModel, inputs, prompt, imageSize, anchor.dataUrl, stageId);
      }

      // Prefer returning the last candidate on warning/pass; on hard_fail dataUrl is null.
      const images: StageImageResult[] = [{
        stageId,
        index,
        prompt,
        dataUrl: result.dataUrl,
        url: null,
        status: result.dataUrl ? "generated" : "not_generated",
        validated: result.validated,
        fallback: result.fallback,
        validation: result.validation ?? undefined,
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
      return NextResponse.json({ error: "referenceImageUrl is required for master mode." }, { status: 400 });
    }
    const reference = await urlToParts(referenceImageUrl, "reference");
    const masterPrompt = buildMasterPrompt(tutorial, medium);

    let bestCandidate: string | null = null;
    let bestValidation: CompositionValidation | null = null;
    let bestScore = -Infinity;
    let acceptedValidation: CompositionValidation | null = null;
    let acceptedCandidate: string | null = null;

    for (let attempt = 0; attempt <= MASTER_MAX_RETRIES; attempt++) {
      let candidate: string | null = null;
      try {
        candidate = await edit(client, imageModel, [reference.file], masterPrompt, imageSize);
      } catch (err) {
        console.error(`Master edit failed (attempt ${attempt})`, err);
        continue;
      }
      if (!candidate) continue;

      const validation = await validateComposition(
        client,
        visionModel,
        reference.dataUrl,
        candidate,
        "master",
        attempt,
      );

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

    if (!bestCandidate && !acceptedCandidate) {
      return NextResponse.json(
        { error: "Could not generate the master painting." },
        { status: 502 },
      );
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
    });
  } catch (error) {
    console.error("Stage image generation failed", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "The stage-image request was invalid." }, { status: 400 });
    }
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: "The image service could not complete this request." },
        { status: error.status || 500 },
      );
    }
    return NextResponse.json({ error: "Could not generate stage images." }, { status: 500 });
  }
}
