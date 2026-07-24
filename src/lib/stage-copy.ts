import type { ProgressionStage } from "@/lib/progression";
import { STAGE_STUDY_FRAMING } from "@/lib/stage-icons";
import { stageFocusPrimary } from "@/components/progression/stage-focus";

/** First sentence of text, truncated to `max` characters. */
export function firstSentence(text: string, max = 120): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] ?? trimmed).trim();
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max).replace(/\s+\S*$/, "").trim()}…`;
}

/** Stage teaching point: framing override, else goal / focus excerpt. */
export function buildTeachingPoint(stage: ProgressionStage, max = 120): string {
  const framing = STAGE_STUDY_FRAMING[stage.id];
  if (framing) return framing;

  return firstSentence(
    stage.paint.goal.trim() ||
      stage.goals.find((g) => g.trim())?.trim() ||
      stageFocusPrimary(stage),
    max,
  );
}

/** Short note excerpt for guide cards and collapsed notes. */
export function excerpt(text: string, max = 90): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const breakAt = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("; "),
    cut.lastIndexOf(" — "),
    cut.lastIndexOf(", "),
  );
  if (breakAt > 24) return cut.slice(0, breakAt + 1).trim();
  return `${cut.replace(/\s+\S*$/, "").trim()}…`;
}
