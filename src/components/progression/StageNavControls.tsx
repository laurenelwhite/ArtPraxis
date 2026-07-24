"use client";

import type { ProgressionStage } from "@/lib/progression";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";

/**
 * Compact end-of-stage transition — optional scroll cue, not pagination.
 * Does not render completion UI (StudyMode / DeskStage own that).
 */
export function StageNavControls({
  isLast,
  nextStage,
  onNext,
}: {
  stage: ProgressionStage;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  nextStage?: ProgressionStage;
  onPrev: () => void;
  onNext: () => void;
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
}) {
  if (isLast || !nextStage) return null;

  const nextLabel = STAGE_PROCESS_LABEL[nextStage.id];

  return (
    <nav className="study-stage-transition" aria-label="Continue to next stage">
      <button
        type="button"
        className="study-stage-transition-btn"
        onClick={onNext}
        aria-label={`Continue to ${nextLabel}`}
      >
        <span className="study-stage-transition-kicker">Next</span>
        <span className="study-stage-transition-name">{nextLabel}</span>
        <span className="study-stage-transition-arrow" aria-hidden="true">
          ↓
        </span>
      </button>
    </nav>
  );
}
