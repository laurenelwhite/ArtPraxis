import type { StageId } from "@/lib/progression";

/** Canonical six-step instructional sequence. */
export const STAGE_PROCESS_ORDER: StageId[] = [
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
];

/** Short process labels for the stage navigator (not image thumbnails). */
export const STAGE_PROCESS_LABEL: Record<StageId, string> = {
  "pencil-sketch": "Sketch",
  "value-study": "Value Study",
  "first-wash": "First Wash",
  "second-wash": "Second Wash",
  refinement: "Refinement",
  finished: "Final Touches",
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

/** Abbreviated labels for narrow stage rails. */
export const STAGE_PROCESS_SHORT: Record<StageId, string> = {
  "pencil-sketch": "Sketch",
  "value-study": "Values",
  "first-wash": "1st Wash",
  "second-wash": "2nd Wash",
  refinement: "Refine",
  finished: "Final",
};

/**
 * Concise Study framing — presentation only; does not alter lesson data.
 * Merged into the stage objective block (never a disconnected second paragraph).
 */
export const STAGE_STUDY_FRAMING: Partial<Record<StageId, string>> = {
  "value-study":
    "A pale map of major value groups—not a finished grayscale painting. Most of the paper stays light.",
  "first-wash":
    "Lay the first transparent color and protect reserved lights; keep edges soft.",
  "second-wash":
    "Strengthen local color and midtone separation without closing the lights.",
};

/** One-line purpose for process rail + stage transition panel. */
export const STAGE_PROCESS_PURPOSE: Record<StageId, string> = {
  "pencil-sketch": "Lock placement and proportion",
  "value-study": "Map light and dark shapes",
  "first-wash": "Lay the lightest transparent color",
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
