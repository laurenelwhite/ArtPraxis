import type { StageId } from "@/lib/progression";

/** Short labels for the compact progress stepper. */
export const STAGE_STEPPER_LABEL: Record<StageId, string> = {
  "pencil-sketch": "Sketch",
  "value-study": "Values",
  "first-wash": "First wash",
  "second-wash": "Build",
  refinement: "Refine",
  finished: "Finish",
};

export type StageIconKind =
  | "pencil"
  | "values"
  | "droplet"
  | "brush"
  | "refine-placeholder"
  | "finish-placeholder";

export function iconKindForStage(stageId: StageId): StageIconKind {
  switch (stageId) {
    case "pencil-sketch":
      return "pencil";
    case "value-study":
      return "values";
    case "first-wash":
      return "droplet";
    case "second-wash":
      return "brush";
    case "refinement":
      return "refine-placeholder";
    case "finished":
      return "finish-placeholder";
  }
}

/** Stages whose circular icon uses a crop of the validated master. */
export function usesMasterThumbnail(stageId: StageId): boolean {
  return stageId === "refinement" || stageId === "finished";
}
