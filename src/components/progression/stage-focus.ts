import type { ProgressionStage, StageId } from "@/lib/progression";

/** Deterministic “ignore for now” copy — reduces cognitive load per stage. */
export const IGNORE_FOR_STAGE: Record<StageId, string> = {
  "pencil-sketch": "Ignore color, texture, shading, and tiny details.",
  "value-study": "Ignore local color and surface detail.",
  "first-wash": "Ignore dark accents and fine edges.",
  "second-wash": "Ignore final highlights and tiny details.",
  refinement: "Ignore unimportant background detail.",
  finished: "Stop adding detail everywhere; assess the whole painting.",
};

/** Primary focus line from existing stage data — no generated copy. */
export function stageFocusPrimary(stage: ProgressionStage): string {
  const { paint, visual, goals, explanation } = stage;
  if (paint.goal.trim()) return paint.goal.trim();
  if (visual.intent.trim()) return visual.intent.trim();
  if (goals[0]?.trim()) return goals[0].trim();
  const sentence = explanation.split(/(?<=[.!?])\s+/)[0]?.trim();
  return sentence || explanation.trim();
}

export function stageIgnoreLine(stageId: StageId): string {
  return IGNORE_FOR_STAGE[stageId];
}
