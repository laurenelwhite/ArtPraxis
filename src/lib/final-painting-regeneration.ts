/**
 * Final Painting regeneration — explicit state machine (separate from initial
 * lesson generation). Accepted art stays authoritative until the user accepts
 * a validated candidate (atelier) or Accept Lesson (review gate).
 */

import { getMediumLanguage } from "@/lib/medium-language";

export type FinalPaintingRegenerationState =
  | "idle"
  | "queued"
  | "generating"
  | "validating"
  | "candidateReady"
  | "applying"
  | "error";

/** Coarse checklist phases shown in the compact status UI. */
export type RegenerationChecklistPhase =
  | "studying"
  | "creating"
  | "checking"
  | "preparing";

export const REGENERATION_CHECKLIST: Array<{
  id: RegenerationChecklistPhase;
  label: string;
}> = [
  { id: "studying", label: "Studying the reference" },
  { id: "creating", label: "Creating the painting" },
  { id: "checking", label: "Checking fidelity" },
  { id: "preparing", label: "Preparing the option" },
];

export const REGENERATION_ACTIVE_STATES: ReadonlySet<FinalPaintingRegenerationState> =
  new Set(["queued", "generating", "validating", "applying"]);

export function isRegenerationBusy(
  state: FinalPaintingRegenerationState | null | undefined,
): boolean {
  return Boolean(state && REGENERATION_ACTIVE_STATES.has(state));
}

export function isRegenerationInFlight(
  state: FinalPaintingRegenerationState | null | undefined,
): boolean {
  return (
    state === "queued" ||
    state === "generating" ||
    state === "validating" ||
    state === "candidateReady" ||
    state === "applying" ||
    state === "error"
  );
}

/** Map machine state → which checklist step is active (indeterminate, not %). */
export function checklistPhaseForState(
  state: FinalPaintingRegenerationState,
  explicit?: RegenerationChecklistPhase | null,
): RegenerationChecklistPhase | null {
  if (explicit) return explicit;
  switch (state) {
    case "queued":
      return "studying";
    case "generating":
      return "creating";
    case "validating":
      return "checking";
    case "applying":
    case "candidateReady":
      return "preparing";
    case "idle":
    case "error":
    default:
      return null;
  }
}

export function regenerationStatusCopy(
  state: FinalPaintingRegenerationState,
  medium?: string | null,
): { title: string; reassurance: string } {
  const lang = getMediumLanguage(medium);
  const mediumLabel = lang.mediumLabel.toLowerCase();

  switch (state) {
    case "queued":
      return {
        title: "Preparing a new interpretation",
        reassurance: "Your current lesson stays available.",
      };
    case "generating":
      return {
        title: `Repainting in ${mediumLabel}`,
        reassurance: "Your current lesson stays available.",
      };
    case "validating":
      return {
        title: "Checking composition and subject fidelity",
        reassurance: "Your current lesson stays available.",
      };
    case "candidateReady":
      return {
        title: "Another interpretation is ready",
        reassurance: "Your current lesson stays available until you choose.",
      };
    case "applying":
      return {
        title: "Updating your lesson reference",
        reassurance: "Your current lesson stays available.",
      };
    case "error":
      return {
        title:
          "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
        reassurance: "Your current lesson stays available.",
      };
    case "idle":
    default:
      return { title: "", reassurance: "" };
  }
}

/** Elapsed label; returns null until the ~15s threshold. */
export function formatRegenerationElapsed(
  startedAt: number | null | undefined,
  nowMs: number,
  thresholdMs = 15_000,
): string | null {
  if (!startedAt || !Number.isFinite(startedAt)) return null;
  const elapsed = Math.max(0, nowMs - startedAt);
  if (elapsed < thresholdMs) return null;
  const totalSec = Math.floor(elapsed / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m <= 0) return `Working for ${s}s`;
  return `Working for ${m}m ${String(s).padStart(2, "0")}s`;
}

export function normalizeRegenerationState(
  value: unknown,
): FinalPaintingRegenerationState {
  switch (value) {
    case "queued":
    case "generating":
    case "validating":
    case "candidateReady":
    case "applying":
    case "error":
      return value;
    default:
      return "idle";
  }
}

export function normalizeRegenerationPhase(
  value: unknown,
): RegenerationChecklistPhase | null {
  switch (value) {
    case "studying":
    case "creating":
    case "checking":
    case "preparing":
      return value;
    default:
      return null;
  }
}

/** Empty regeneration fields for new progression docs / clears. */
export function idleRegenerationFields(): {
  regenerationState: FinalPaintingRegenerationState;
  regenerationStartedAt: number | null;
  regenerationError: string | null;
  regenerationPhase: RegenerationChecklistPhase | null;
  candidateFinalPaintingUrl: string | null;
} {
  return {
    regenerationState: "idle",
    regenerationStartedAt: null,
    regenerationError: null,
    regenerationPhase: null,
    candidateFinalPaintingUrl: null,
  };
}
