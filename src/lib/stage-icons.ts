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
