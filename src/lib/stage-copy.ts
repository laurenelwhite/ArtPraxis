import type { ProgressionStage } from "@/lib/progression";
import type { Medium } from "@/lib/tutorial-schema";
import { resolveStageFocus } from "@/lib/stage-icons";
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

/**
 * Stage goal — one concise outcome sentence (not the full focus paragraph).
 */
export function buildStageGoal(stage: ProgressionStage, max = 120): string {
  return firstSentence(
    stage.paint.goal.trim() ||
      stage.goals.find((g) => g.trim())?.trim() ||
      stageFocusPrimary(stage),
    max,
  );
}

/**
 * Today’s focus — medium-aware framing, else goal / focus excerpt.
 */
export function buildTeachingPoint(
  stage: ProgressionStage,
  max = 160,
  medium?: Medium | string | null,
): string {
  const framing = resolveStageFocus(stage.id, medium);
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
