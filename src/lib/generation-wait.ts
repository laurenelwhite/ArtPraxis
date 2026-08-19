/**
 * Presentation-only wait timing for generation UX.
 * Based on observed master generation averages (~40–62s). Does not mirror API state.
 */

export const MASTER_GEN_FAST_SEC = 40;
export const MASTER_GEN_AVG_SEC = 51;
export const MASTER_GEN_SLOW_SEC = 62;

/** Lesson creation (analyze + save + open) — typically under a minute. */
export const CREATE_GEN_AVG_SEC = 28;
export const CREATE_GEN_FAST_SEC = 12;
export const CREATE_GEN_SLOW_SEC = 45;

export type WaitTimingProfile = {
  fastSec: number;
  avgSec: number;
  slowSec: number;
};

export const MASTER_WAIT: WaitTimingProfile = {
  fastSec: MASTER_GEN_FAST_SEC,
  avgSec: MASTER_GEN_AVG_SEC,
  slowSec: MASTER_GEN_SLOW_SEC,
};

export const CREATE_WAIT: WaitTimingProfile = {
  fastSec: CREATE_GEN_FAST_SEC,
  avgSec: CREATE_GEN_AVG_SEC,
  slowSec: CREATE_GEN_SLOW_SEC,
};

export function formatWaitClock(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Soft remaining estimate — never claims exact completion. */
export function estimateRemainingSec(
  elapsedSec: number,
  profile: WaitTimingProfile,
): number {
  const remaining = profile.avgSec - elapsedSec;
  if (remaining > 0) return remaining;
  // Past average: ease toward the slow end, then a small floor.
  const past = elapsedSec - profile.avgSec;
  const tail = Math.max(8, profile.slowSec - profile.avgSec - past * 0.45);
  return Math.max(5, Math.round(tail));
}

/**
 * Expected-wait fill 0–1 for a duration track (not generation %).
 * Approaches ~0.92 at average, then creeps slowly.
 */
export function expectedWaitFill(
  elapsedSec: number,
  profile: WaitTimingProfile,
): number {
  if (elapsedSec <= 0) return 0.04;
  const t = elapsedSec / profile.avgSec;
  if (t < 1) {
    // Ease-out so early seconds feel productive.
    return Math.min(0.9, 0.04 + (1 - Math.pow(1 - t, 1.35)) * 0.86);
  }
  const over = (elapsedSec - profile.avgSec) / Math.max(1, profile.slowSec - profile.avgSec);
  return Math.min(0.97, 0.9 + over * 0.07);
}

export function formatRemainingCopy(
  elapsedSec: number,
  profile: WaitTimingProfile,
): string {
  if (elapsedSec < 3) {
    return `Usually ${profile.fastSec}–${profile.slowSec} seconds`;
  }
  if (elapsedSec < profile.avgSec) {
    const rem = estimateRemainingSec(elapsedSec, profile);
    if (rem >= 55) return `About a minute remaining`;
    if (rem >= 45) return `About ${Math.round(rem / 5) * 5}s remaining`;
    return `About ${rem}s remaining`;
  }
  if (elapsedSec < profile.slowSec) {
    return "Finishing up — almost ready";
  }
  return "Taking a little longer than usual";
}

export function formatRangeEstimate(profile: WaitTimingProfile): string {
  return `Usually ${profile.fastSec}–${profile.slowSec} seconds`;
}

/**
 * Master wait checklist buckets tuned to ~40–62s historical average.
 * Presentation only — does not mirror backend phases.
 */
export function masterPipelineIndex(elapsedSec: number): number {
  if (elapsedSec < 8) return 0;
  if (elapsedSec < 22) return 1;
  if (elapsedSec < 42) return 2;
  return 3;
}

/** Creating wait when no status-driven index is provided. */
export function creatingPipelineIndex(elapsedSec: number): number {
  if (elapsedSec < 6) return 0;
  if (elapsedSec < 14) return 1;
  if (elapsedSec < 24) return 2;
  return 3;
}

export function getMasterWaitPipeline(completedWorkNoun: string) {
  const noun =
    completedWorkNoun === "drawing" ? "drawing" : "painting";
  return [
    { id: "composition", label: "Preparing your studio" },
    { id: "master", label: `Creating your final ${noun}` },
    { id: "steps", label: "Checking composition" },
    { id: "studio", label: "Preparing your painting stages" },
  ];
}
