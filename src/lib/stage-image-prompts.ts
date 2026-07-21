import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { StageId } from "@/lib/progression";

// ============================================================================
// Stage-image generation architecture.
//
// The six lesson stages must each look like a genuinely different watercolor
// instructional demonstration plate — not the same photo under a filter. This
// module owns the *prompt contract* used to produce those plates: one distinct,
// pedagogically-specific prompt per stage, sharing composition/subject across
// the set so they read as one authored progression.
//
// The API route (/api/generate-stage-images) turns these prompts into image
// URLs and the result is persisted on the project doc as `progressionImages`
// (index 0..5 maps 1:1 to the stages below). Until real images exist, the UI
// renders clearly-labelled development placeholders.
// ============================================================================

export interface StageImageSpec {
  /** Human stage name used in the prompt and UI. */
  label: string;
  /** One-line pedagogical intent — what this plate uniquely shows (shown in UI). */
  intent: string;
  /** Detailed art direction for the image model, specific to this stage. */
  directive: string;
}

// Canonical stage order — shared with progression.ts (which maps index → stage).
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
      "A very light graphite contour drawing — major shapes and construction lines only, with correct proportions and composition, ready for a beginner to transfer.",
    // Note: the pencil sketch uses its own base prompt (buildSketchPrompt),
    // not the generic demonstration-plate framing; this directive is retained
    // for type completeness / fallback only.
    directive:
      "Show only a very light, sparse pencil construction drawing: major contours, primary architectural forms, figure silhouettes, and broad foliage masses. Almost no shading, no crosshatching, no grayscale rendering, and no photo-filter appearance.",
  },
  "value-study": {
    label: "Value study",
    intent:
      "Monochrome/neutral wash — 3–5 large value masses, simplified dark/light design. No local color, no small detail.",
    directive:
      "Show a monochrome or neutral wash: 3–5 large value masses forming a simplified dark/light design. No local color and no small detail — communicate the value structure only.",
  },
  "first-wash": {
    label: "First wash",
    intent:
      "Pale transparent watercolor over large connected washes with visible pencil drawing and lots of untouched white paper.",
    directive:
      "Show only an early transparent wash and light construction drawing. Preserve abundant white paper. Establish atmosphere and large color masses, but omit final detail, strongest shadows, hard accents, and finished edges. Keep edges soft; the visible pencil drawing may still show. The painting should look ready for the next layer, not complete.",
  },
  "second-wash": {
    label: "Second wash",
    intent:
      "Local color and midtones introduced; large forms readable, first shadow structure, darkest values reserved.",
    directive:
      "Introduce local color and midtones so large forms become readable. Add some negative painting and the first meaningful shadow structure. The painting is still clearly incomplete and the darkest values are reserved for later.",
  },
  refinement: {
    label: "Refinement",
    intent:
      "Selective edge control and focal-area development with secondary forms, restrained texture, and lost-and-found edges.",
    directive:
      "Add selective edge control and develop the focal area with secondary forms and restrained texture. Use lost-and-found edges and place detail only where it is useful; keep the rest quiet.",
  },
  finished: {
    label: "Finished painting",
    intent:
      "Resolved interpretation — preserved whites, final dark accents, confident brushwork, coherent focal hierarchy.",
    directive:
      "A resolved interpretation: preserved whites, final dark accents, confident brushwork, and selective detail that supports a coherent focal hierarchy.",
  },
};

export function stageIntent(stageId: StageId): string {
  return STAGE_IMAGE_SPECS[stageId].intent;
}

// Applied to every prompt in the composition-locked pipeline.
const NO_TEXT =
  "Do not include any text, letters, numbers, labels, watermarks, captions, or signatures anywhere in the image.";

const NO_SUBJECT_CHANGE =
  "Do not add, remove, reposition, or invent any subject or element; keep the identical composition, crop, perspective, and the exact placement and size of every subject.";

const MASTER_FIDELITY =
  "The ONLY permitted change is medium and paint style. Preserve every flower, petal cluster, leaf, stem, bud, edge, silhouette, position, scale, overlap, negative space, background shape, crop, and perspective exactly as in the reference. Do not simplify, consolidate, merge, remove, add, resize, crop differently, or rearrange any botanical or structural element. Count every major flower and foliage mass and keep each one. Keep the same overlaps and the same empty spaces between forms.";

/**
 * Prompt for the single finished MASTER painting, generated by editing the
 * uploaded reference. Everything else in the lesson is derived from this master
 * so the whole sequence shares one locked composition.
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

// Medium-specific material language so plates read in the correct medium.
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

// Graphite-handling note per medium. Stage 1 is a sparse construction drawing,
// not a detailed transfer or shaded rendering.
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
 * Dedicated pencil-sketch prompt.
 *
 * This is an IMAGE EDIT instruction (the route passes the uploaded reference to
 * images.edit). The sketch is a transfer drawing, NOT an artistic
 * reinterpretation: it must reproduce the upload's geometry exactly so a student
 * could trace it onto watercolor paper and paint the original reference.
 */
export function buildSketchPrompt(medium: Medium): string {
  const surface = medium === "watercolor" ? "cold-press watercolor paper" : "bright white paper";
  return [
    "Convert the provided reference image into a beginner-friendly pencil construction drawing for a traditional watercolor instruction book.",
    "This is a light transfer drawing for tracing — not a finished illustration, not a photo edge filter, and not a shaded grayscale rendering.",
    "Preserve the exact composition, crop, perspective, and major proportions of the source: same placement of architecture, figures, primary bushes, broad foliage masses, and focal structure.",
    "Draw only with very light graphite contour lines on " + surface + ". Use clean, sparse construction lines for major shapes only.",
    "Include primary architectural forms, figure silhouettes, large bush and tree masses, and broad foliage shapes. Omit fine texture, interior detail, facial micro-features, crosshatching, dense shading, and photorealistic edge-detection effects.",
    "Keep almost no shading — at most one whisper-light indication of a major shadow mass. No hatching, no midtone filling, and no dense mark-making.",
    "The drawing should look like a master instructor's preparatory sketch: airy, readable, and easy for a beginner to transfer onto watercolor paper before painting.",
    "Do not stylize, redesign, or invent new subject matter. Do not produce a dark or heavily rendered sketch.",
    NO_TEXT,
    sketchMediumGuidance(medium),
  ].join(" ");
}

function simplificationFor(skill: Tutorial["difficulty"]): string {
  switch (skill) {
    case "beginner":
      return "Simplify aggressively for a beginner: fewer, larger shapes and a very clear, readable stage.";
    case "intermediate":
      return "Moderate complexity suitable for an intermediate painter.";
    case "advanced":
      return "Fuller complexity suitable for an advanced painter, while still reading clearly as this stage.";
  }
}

/**
 * Build the image-generation prompt for one stage. Uses the shared textbook
 * framing requested by the product spec and injects the lesson's own subject,
 * composition, medium, and skill level so all six plates stay consistent.
 */
export function buildStageImagePrompt(params: {
  tutorial: Tutorial;
  medium: Medium;
  stageId: StageId;
  index: number; // 1-based
  total: number;
}): string {
  const { tutorial, medium, stageId, index, total } = params;

  // The pencil sketch is a construction drawing, not a painted plate — it has
  // its own base prompt so it never reads as a filtered/finished image.
  if (stageId === "pencil-sketch") return buildSketchPrompt(medium);

  const spec = STAGE_IMAGE_SPECS[stageId];

  return [
    // Composition-locked derivation: the finished master painting is provided as
    // the primary input image, with the previous stage for continuity.
    `You are given the finished master ${medium} painting as the primary reference image, along with the previous stage image.`,
    `Repaint the SAME scene at the earlier "${spec.label}" stage of the ${medium} process — intentionally less complete than the master and pedagogically distinct from the other stages (plate ${index} of ${total}).`,
    NO_SUBJECT_CHANGE,
    NO_TEXT,
    `Material language: ${mediumLanguage(medium)}.`,
    // Stage-specific constraints.
    spec.directive,
    simplificationFor(tutorial.difficulty),
    "Present one clean demonstration image — not a photograph of a desk, not a collage, and no text or labels.",
  ].join(" ");
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
