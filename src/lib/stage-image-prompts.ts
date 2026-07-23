import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { StageId } from "@/lib/progression";

// ============================================================================
// Stage-image generation architecture.
//
// The six lesson stages form one coherent painting progression: each target
// after Sketch is the prior stage plus one realistic layer of work. The
// validated master locks composition and guides final appearance, but must not
// erase the visible construction history.
//
// This module is browser-safe: no sharp, no server-only validation imports.
// ============================================================================

/** Approximate visual completion each stage should communicate (prompt + UI). */
export const STAGE_COMPLETION_TARGET: Record<StageId, string> = {
  "pencil-sketch": "~5% — light transfer contour only",
  "value-study": "~15% — light drawing plus 3–5 broad value masses",
  "first-wash": "~25–30% — pale transparent color washes over the foundation",
  "second-wash": "~50–60% — midtones and clearer forms; still unfinished",
  refinement: "~75–85% — selective focal detail; secondary areas stay loose",
  finished: "100% — validated finished master painting",
};

export interface StageImageSpec {
  /** Human stage name used in the prompt and UI. */
  label: string;
  /** One-line pedagogical intent — what this plate uniquely shows (shown in UI). */
  intent: string;
  /** Detailed art direction for the image model, specific to this stage. */
  directive: string;
}

export const STAGE_ORDER: StageId[] = [
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
];

export const STAGE_IMAGE_SPECS: Record<StageId, StageImageSpec> = {
  "pencil-sketch": {
    label: "Pencil sketch",
    intent:
      "Very light graphite contour drawing (~5%) — major shapes and proportions only on white paper.",
    directive:
      "Very light graphite contours only: clean sparse construction lines for major shapes. No tonal shading, no crosshatching, no dense edge detection, no grayscale photo rendering, no filled dark masses. Paper remains dominant.",
  },
  "value-study": {
    label: "Value study",
    intent:
      "Sketch plus 3–5 broad light-neutral value groups (~15%). Most paper still visible.",
    directive:
      "MINIMAL EDIT of Image 1 only: add 3–5 broad pale neutral-gray value masses under/around the existing sketch lines. Do not redraw. Do not invent new shapes. Do not darken the whole image.",
  },
  "first-wash": {
    label: "First wash",
    intent:
      "Pale transparent color washes over the foundation (~25–30%). Sketch faintly visible; lots of white paper.",
    directive:
      "MINIMAL EDIT of Image 1 only: lay transparent, watery color washes over existing marks for large masses (sky/ground/foliage groups/major subjects). Keep prior lines faintly visible. Preserve white paper. No opaque coverage.",
  },
  "second-wash": {
    label: "Build",
    intent:
      "Second layer (~50–60%) — deepen selected values and midtones while preserving first-wash lights.",
    directive:
      "MINIMAL EDIT of Image 1 only: deepen SELECTED existing areas (shadow families / midtones). Leave lighter first-wash passages untouched. Do not repaint the whole surface. Avoid finished edges and fine texture.",
  },
  refinement: {
    label: "Refine",
    intent:
      "Selective accents and focal detail (~75–85%). Secondary areas stay loose.",
    directive:
      "MINIMAL EDIT of Image 1 only: adjust focal details and selective darker accents. Keep secondary areas loose. Do not re-render the entire painting from Image 2.",
  },
  finished: {
    label: "Finished painting",
    intent:
      "Validated master — full value range and final focal detail with painterly character.",
    directive:
      "Use the validated master painting. Full value range and final focal detail. Preserve painterly character. Exact composition, crop, subject placement, and perspective.",
  },
};

export function stageIntent(stageId: StageId): string {
  return STAGE_IMAGE_SPECS[stageId].intent;
}

const NO_TEXT =
  "Do not include any text, letters, numbers, labels, watermarks, captions, or signatures anywhere in the image.";

const NO_SUBJECT_CHANGE =
  "Do not add, remove, reposition, or invent any subject or element; keep the identical composition, crop, perspective, and the exact placement and size of every subject.";

const MASTER_FIDELITY =
  "The ONLY permitted change is medium and paint style. Preserve every flower, petal cluster, leaf, stem, bud, edge, silhouette, position, scale, overlap, negative space, background shape, crop, and perspective exactly as in the reference. Do not simplify, consolidate, merge, remove, add, resize, crop differently, or rearrange any botanical or structural element. Count every major flower and foliage mass and keep each one. Keep the same overlaps and the same empty spaces between forms.";

/** Shared progressive-painting constraints for every stage after the sketch. */
const PROGRESSION_RULES = [
  "This is an in-progress painting, not a finished artwork.",
  "Preserve all existing marks from the prior stage unless naturally softened by the new layer.",
  "Add only the work appropriate to this stage.",
  "Do not render details belonging to later stages.",
  "Do not apply a photographic filter or posterization effect.",
  "A later stage must never look less complete than the prior stage and must never reset to a new interpretation.",
].join(" ");

/**
 * Prompt for the single finished MASTER painting, generated by editing the
 * uploaded reference. Unchanged contract for master generation.
 */
export function buildMasterPrompt(tutorial: Tutorial, medium: Medium): string {
  const surface = medium === "watercolor" ? "cold-press watercolor paper" : "the appropriate surface";
  return [
    `Edit the provided reference photograph into one finished, fully resolved master ${medium} painting on ${surface}.`,
    `Lesson subject: ${tutorial.title}.`,
    "This is an image-to-image transfer of the SAME scene — not a reinterpretation, not a redesign, and not a simplified study.",
    MASTER_FIDELITY,
    NO_SUBJECT_CHANGE,
    NO_TEXT,
    `Material language: ${mediumLanguage(medium)}.`,
    "Render it as a professional, gallery-quality painting — this is the finished target the whole lesson builds toward.",
    "Match the reference’s geometry as if tracing it under translucent paper, then painting within those exact contours.",
  ].join(" ");
}

function mediumLanguage(medium: Medium): string {
  switch (medium) {
    case "watercolor":
      return "transparent watercolor on cold-press paper — luminous washes, granulation, and preserved paper whites";
    case "acrylic":
      return "acrylic on paper — from thin transparent washes to opaque layers";
    case "oil":
      return "oil on primed panel — from thin underpainting to thicker, opaque passages";
    case "pastel":
      return "soft pastel on toned paper — layered, broken strokes";
    case "charcoal":
      return "charcoal on paper — tonal, no color";
    case "pencil":
      return "graphite pencil on paper — tonal, no color";
    case "pen":
      return "pen and ink — line work with tonal hatching";
    default:
      return `${medium} on paper`;
  }
}

function sketchMediumGuidance(medium: Medium): string {
  switch (medium) {
    case "watercolor":
      return "Keep graphite extremely pale so lines disappear under transparent washes. Use fewer, longer contour strokes — never dense hatching or midtone shading.";
    case "charcoal":
      return "Marks may be slightly broader, but stay light, sparse, and preparatory — major shapes only, with almost no tonal filling.";
    default:
      return "Keep graphite light, airy, and sparse while preserving the major proportions and composition from the reference.";
  }
}

/**
 * Dedicated pencil-sketch prompt (~5% completion).
 * Input: reference or master (composition anchor). Output: light transfer drawing.
 */
export function buildSketchPrompt(medium: Medium): string {
  const surface = medium === "watercolor" ? "cold-press watercolor paper" : "bright white paper";
  return [
    "Convert the provided reference image into a beginner-friendly pencil construction drawing for a traditional watercolor instruction book.",
    "This is an in-progress painting stage at about 5% completion — a light transfer drawing for tracing, not a finished artwork.",
    "This is NOT a photo edge filter, Sobel/threshold effect, shaded grayscale rendering, or tonal study.",
    "Preserve the exact composition, crop, perspective, and major proportions of the source.",
    `Draw only with very light graphite contour lines on ${surface}. Use clean, sparse construction lines for major shapes only.`,
    "Include primary architectural forms, figure silhouettes, large bush and tree masses, and broad foliage shapes.",
    "Omit fine texture, interior detail, facial micro-features, crosshatching, dense shading, filled black or dark-gray masses, and photorealistic edge-detection effects.",
    "White or natural paper must remain dominant. Almost no shading.",
    "Add only the work appropriate to this stage. Do not render details belonging to later stages.",
    "Do not apply a photographic filter or posterization effect.",
    "Do not stylize, redesign, or invent new subject matter.",
    NO_TEXT,
    sketchMediumGuidance(medium),
  ].join(" ");
}

function simplificationFor(skill: Tutorial["difficulty"]): string {
  switch (skill) {
    case "beginner":
      return "Keep shapes large and readable for a beginner; avoid crowding the stage with secondary marks.";
    case "intermediate":
      return "Moderate complexity suitable for an intermediate painter, still clearly incomplete for this stage.";
    case "advanced":
      return "Allow fuller complexity for an advanced painter while remaining clearly at this stage’s completion level.";
  }
}

/**
 * Build the image-generation prompt for one stage.
 *
 * After Sketch, the PRIOR STAGE image is the primary edit input (the painting
 * being advanced). The master is a secondary appearance/composition guide only.
 */
export function buildStageImagePrompt(params: {
  tutorial: Tutorial;
  medium: Medium;
  stageId: StageId;
  index: number;
  total: number;
}): string {
  const { tutorial, medium, stageId, index, total } = params;

  if (stageId === "pencil-sketch") return buildSketchPrompt(medium);
  if (stageId === "finished") {
    return [
      "Return the finished master painting unchanged as the final stage target.",
      NO_TEXT,
      NO_SUBJECT_CHANGE,
    ].join(" ");
  }

  const spec = STAGE_IMAGE_SPECS[stageId];
  const completion = STAGE_COMPLETION_TARGET[stageId];

  return [
    "INPUT IMAGE ROLES (strict):",
    "IMAGE 1 = the current in-progress painting. This is the editable canvas. You MUST preserve its visible marks, subject placement, proportions, and construction history.",
    "IMAGE 2 = the finished master painting used ONLY as secondary visual guidance for color temperature, paint quality, and intended final direction. Do NOT copy Image 2’s finish level. Do NOT regenerate the scene from Image 2.",
    `Advance IMAGE 1 into the "${spec.label}" stage (plate ${index} of ${total}) for a ${medium} lesson.`,
    `Target visual completion: ${completion}.`,
    "Perform a MINIMAL edit: add only one thin layer of work on top of IMAGE 1. Most pixels of IMAGE 1 should remain recognizable.",
    "If IMAGE 1 and IMAGE 2 conflict, IMAGE 1 wins for structure; IMAGE 2 may only hint color/value direction.",
    PROGRESSION_RULES,
    NO_SUBJECT_CHANGE,
    NO_TEXT,
    `Material language: ${mediumLanguage(medium)}.`,
    spec.directive,
    stageExtraGuard(stageId),
    simplificationFor(tutorial.difficulty),
    "Present one clean demonstration image — not a photograph of a desk, not a collage, and no text or labels.",
  ].join(" ");
}

function stageExtraGuard(stageId: StageId): string {
  switch (stageId) {
    case "value-study":
      return "SCOPE LIMIT: add broad pale value masses ONLY. Keep nearly all of IMAGE 1’s line work unchanged. No noisy grayscale photo, no stipple field, no full tonal rendering.";
    case "first-wash":
      return "SCOPE LIMIT: add transparent color OVER existing marks ONLY. Do not erase or replace the foundation. Sketch/value marks must remain faintly readable.";
    case "second-wash":
      return "SCOPE LIMIT: deepen SELECTED existing areas ONLY. Do not globally repaint. Preserve lighter passages from IMAGE 1.";
    case "refinement":
      return "SCOPE LIMIT: adjust focal details ONLY. Leave secondary areas as they appear in IMAGE 1.";
    default:
      return "";
  }
}

export interface StageImagePrompt {
  stageId: StageId;
  index: number;
  prompt: string;
}

/** Build all six stage prompts in canonical order. */
export function buildStageImagePrompts(tutorial: Tutorial, medium: Medium): StageImagePrompt[] {
  const total = STAGE_ORDER.length;
  return STAGE_ORDER.map((stageId, i) => ({
    stageId,
    index: i + 1,
    prompt: buildStageImagePrompt({ tutorial, medium, stageId, index: i + 1, total }),
  }));
}
