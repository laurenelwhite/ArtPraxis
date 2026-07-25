import type { StageId } from "@/lib/progression";
import type { Medium } from "@/lib/tutorial-schema";

/** Canonical six-step instructional sequence (stable IDs — do not rename). */
export const STAGE_PROCESS_ORDER: StageId[] = [
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
];

/**
 * Default display labels (watercolor-leaning fallback).
 * Prefer `resolveStageDisplayLabel` / medium maps for UI.
 */
export const STAGE_PROCESS_LABEL: Record<StageId, string> = {
  "pencil-sketch": "Drawing",
  "value-study": "Value plan",
  "first-wash": "First wash",
  "second-wash": "Developing washes",
  refinement: "Refinement",
  finished: "Final accents",
};

/**
 * Stable DOM ids for continuous Study scrolling / deep links.
 * Prefer these over `stage-${id}` for document anchors.
 */
export const STAGE_DOM_ID: Record<StageId, string> = {
  "pencil-sketch": "lesson-stage-sketch",
  "value-study": "lesson-stage-value-study",
  "first-wash": "lesson-stage-first-wash",
  "second-wash": "lesson-stage-second-wash",
  refinement: "lesson-stage-refinement",
  finished: "lesson-stage-final-touches",
};

export const LESSON_COMPLETE_DOM_ID = "lesson-painting-complete";

/** Abbreviated labels for narrow stage rails (watercolor fallback). */
export const STAGE_PROCESS_SHORT: Record<StageId, string> = {
  "pencil-sketch": "Drawing",
  "value-study": "Values",
  "first-wash": "1st wash",
  "second-wash": "Develop",
  refinement: "Refine",
  finished: "Final",
};

/** Built-in progression titles — treat as non-custom when resolving display labels. */
export const STAGE_META_DEFAULT_TITLE: Record<StageId, string> = {
  "pencil-sketch": "Pencil sketch",
  "value-study": "Value Map — Plan the Light and Dark Shapes",
  "first-wash": "First wash",
  "second-wash": "Build Color",
  refinement: "Refinement",
  finished: "Finished painting",
};

type StageLabelMap = Record<StageId, string>;

const WATERCOLOR_LABELS: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Value plan",
  "first-wash": "First wash",
  "second-wash": "Developing washes",
  refinement: "Refinement",
  finished: "Final accents",
};

const PASTEL_LABELS: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Value map",
  "first-wash": "Color block-in",
  "second-wash": "Form and light",
  refinement: "Edge refinement",
  finished: "Final accents",
};

const OIL_ACRYLIC_LABELS: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Value block-in",
  "first-wash": "Color block-in",
  "second-wash": "Form development",
  refinement: "Refinement",
  finished: "Final accents",
};

const GOUACHE_LABELS: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Value plan",
  "first-wash": "Shape block-in",
  "second-wash": "Color and form",
  refinement: "Refinement",
  finished: "Final accents",
};

const DRAWING_LABELS: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Value map",
  "first-wash": "Structure pass",
  "second-wash": "Development",
  refinement: "Refinement",
  finished: "Final accents",
};

const WATERCOLOR_SHORT: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Values",
  "first-wash": "1st wash",
  "second-wash": "Develop",
  refinement: "Refine",
  finished: "Final",
};

const PASTEL_SHORT: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Values",
  "first-wash": "Block-in",
  "second-wash": "Form",
  refinement: "Edges",
  finished: "Final",
};

const OIL_ACRYLIC_SHORT: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Values",
  "first-wash": "Color",
  "second-wash": "Form",
  refinement: "Refine",
  finished: "Final",
};

const GOUACHE_SHORT: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Values",
  "first-wash": "Shapes",
  "second-wash": "Color",
  refinement: "Refine",
  finished: "Final",
};

const DRAWING_SHORT: StageLabelMap = {
  "pencil-sketch": "Drawing",
  "value-study": "Values",
  "first-wash": "Structure",
  "second-wash": "Develop",
  refinement: "Refine",
  finished: "Final",
};

function mediumLabelFamily(medium: string | null | undefined): {
  full: StageLabelMap;
  short: StageLabelMap;
} {
  const key = (medium ?? "watercolor").toLowerCase();
  switch (key) {
    case "pastel":
      return { full: PASTEL_LABELS, short: PASTEL_SHORT };
    case "oil":
    case "acrylic":
      return { full: OIL_ACRYLIC_LABELS, short: OIL_ACRYLIC_SHORT };
    case "gouache":
      return { full: GOUACHE_LABELS, short: GOUACHE_SHORT };
    case "charcoal":
    case "pencil":
    case "pen":
      return { full: DRAWING_LABELS, short: DRAWING_SHORT };
    case "watercolor":
    default:
      return { full: WATERCOLOR_LABELS, short: WATERCOLOR_SHORT };
  }
}

/** Whether a lesson-provided title is custom (not a built-in meta default). */
export function isCustomStageTitle(
  stageId: StageId,
  title: string | null | undefined,
): boolean {
  const trimmed = title?.trim();
  if (!trimmed) return false;
  const defaults = new Set(
    [
      STAGE_META_DEFAULT_TITLE[stageId],
      STAGE_PROCESS_LABEL[stageId],
      WATERCOLOR_LABELS[stageId],
      PASTEL_LABELS[stageId],
      OIL_ACRYLIC_LABELS[stageId],
      GOUACHE_LABELS[stageId],
      DRAWING_LABELS[stageId],
      // Legacy labels still present in older content
      "Sketch",
      "Value Study",
      "First Wash",
      "Second Wash",
      "Final Touches",
      "Pencil sketch",
      "Build Color",
      "Finished painting",
    ].map((s) => s.toLowerCase()),
  );
  return !defaults.has(trimmed.toLowerCase());
}

/**
 * Display label for UI: custom lesson title when valid, else medium map.
 * Does not change database identifiers.
 */
export function resolveStageDisplayLabel(
  stageId: StageId,
  medium: Medium | string | null | undefined,
  lessonTitle?: string | null,
): string {
  if (isCustomStageTitle(stageId, lessonTitle)) {
    return lessonTitle!.trim();
  }
  return mediumLabelFamily(medium).full[stageId];
}

/** Short rail label — keeps custom titles readable when long. */
export function resolveStageShortLabel(
  stageId: StageId,
  medium: Medium | string | null | undefined,
  lessonTitle?: string | null,
): string {
  if (isCustomStageTitle(stageId, lessonTitle)) {
    const custom = lessonTitle!.trim();
    if (custom.length <= 14) return custom;
    return `${custom.slice(0, 12).trim()}…`;
  }
  return mediumLabelFamily(medium).short[stageId];
}

/**
 * Concise Study framing — presentation only; does not alter lesson data.
 * Medium-neutral atelier instruction (wash-specific copy lives in watercolor focus).
 */
export const STAGE_STUDY_FRAMING: Partial<Record<StageId, string>> = {
  "pencil-sketch":
    "Transfer the main structure accurately. Keep the drawing light enough to disappear beneath later layers.",
  "value-study":
    "Establish the major value masses before introducing color. Keep large shapes simple.",
  "first-wash":
    "Lay the first broad color statement and protect reserved lights.",
  "second-wash":
    "Strengthen local color and form without closing the lights. Keep large forms as single shapes.",
  refinement:
    "Add selective edges and contrast only where the whole asks for them. Leave quiet passages alone.",
  finished:
    "Step back and compare to the Final Painting. Adjust only what still weakens the whole.",
};

const PASTEL_FOCUS: Partial<Record<StageId, string>> = {
  "pencil-sketch":
    "Place the large shapes lightly. Keep marks soft enough to adjust.",
  "value-study":
    "Map light and dark masses before committing to color temperature.",
  "first-wash":
    "Block in local color families. Keep edges soft until form is clear.",
  "second-wash":
    "Model form with temperature and value. Reserve sharp edges for the focus.",
  refinement:
    "Refine edges selectively. Soften secondary passages.",
  finished:
    "Place final accents sparingly. Stop when hierarchy is clear.",
};

const OIL_ACRYLIC_FOCUS: Partial<Record<StageId, string>> = {
  "pencil-sketch":
    "Lock placement and proportion with a light construction drawing.",
  "value-study":
    "Block in light and dark masses before local color.",
  "first-wash":
    "Establish local color relationships across the major planes.",
  "second-wash":
    "Develop form with value and temperature. Keep supporting planes quiet.",
  refinement:
    "Refine edges and contrast only at the focus.",
  finished:
    "Add final accents with restraint. Judge the painting as a whole.",
};

const DRAWING_FOCUS: Partial<Record<StageId, string>> = {
  "pencil-sketch":
    "Establish large shapes, placement, and perspective before adding value.",
  "value-study":
    "Map the light path in a few value families. Protect the brightest paper.",
  "first-wash":
    "Strengthen structure without chasing texture.",
  "second-wash":
    "Develop form with directed marks. Keep secondary areas quieter.",
  refinement:
    "Refine edges and accents only where they serve the focus.",
  finished:
    "Stop when the statement is clear. Extra marks often weaken it.",
};

/** Medium-aware “Today’s focus” line. */
export function resolveStageFocus(
  stageId: StageId,
  medium: Medium | string | null | undefined,
): string {
  const key = (medium ?? "watercolor").toLowerCase();
  if (key === "pastel") return PASTEL_FOCUS[stageId] ?? STAGE_STUDY_FRAMING[stageId] ?? "";
  if (key === "oil" || key === "acrylic" || key === "gouache") {
    return OIL_ACRYLIC_FOCUS[stageId] ?? STAGE_STUDY_FRAMING[stageId] ?? "";
  }
  if (key === "charcoal" || key === "pencil" || key === "pen") {
    return DRAWING_FOCUS[stageId] ?? STAGE_STUDY_FRAMING[stageId] ?? "";
  }
  return STAGE_STUDY_FRAMING[stageId] ?? "";
}

/** One-line purpose for process rail + stage transition panel. */
export const STAGE_PROCESS_PURPOSE: Record<StageId, string> = {
  "pencil-sketch": "Lock placement and proportion",
  "value-study": "Map light and dark shapes",
  "first-wash": "Lay the first broad color statement",
  "second-wash": "Strengthen main color relationships",
  refinement: "Add selective edges and contrast",
  finished: "Review the completed painting",
};

/** @deprecated Use STAGE_PROCESS_LABEL */
export const STAGE_STEPPER_LABEL = STAGE_PROCESS_LABEL;

export type StageIconKind =
  | "pencil"
  | "value-map"
  | "droplet"
  | "swatches"
  | "refine"
  | "finished";

export function iconKindForStage(stageId: StageId): StageIconKind {
  switch (stageId) {
    case "pencil-sketch":
      return "pencil";
    case "value-study":
      return "value-map";
    case "first-wash":
      return "droplet";
    case "second-wash":
      return "swatches";
    case "refinement":
      return "refine";
    case "finished":
      return "finished";
  }
}

/** Thumbnails are never the primary nav identifier. */
export function usesMasterThumbnail(): boolean {
  return false;
}
