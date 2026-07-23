"use client";

import type { ProgressionStage } from "@/lib/progression";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";
import { StageCompletion } from "@/components/progression/StageCompletion";

/**
 * Quiet end-of-section links — keyboard-friendly, never a prominent bar.
 */
export function StageNavControls({
  isFirst,
  isLast,
  nextStage,
  onPrev,
  onNext,
  onReviewPrevious,
  onCompareFinished,
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
  if (isLast) {
    return (
      <div className="lesson-stage-footer">
        <StageCompletion
          onReviewPrevious={onReviewPrevious}
          onCompareFinished={onCompareFinished}
        />
      </div>
    );
  }

  const nextLabel = nextStage ? STAGE_PROCESS_LABEL[nextStage.id] : null;

  return (
    <nav className="lesson-stage-footer" aria-label="Stage section navigation">
      {!isFirst ? (
        <button type="button" className="lesson-stage-link" onClick={onPrev}>
          Previous stage
        </button>
      ) : (
        <span />
      )}
      {nextStage && nextLabel ? (
        <button
          type="button"
          className="lesson-stage-link lesson-stage-link--next"
          onClick={onNext}
          aria-label={`Next stage: ${nextLabel}`}
        >
          Next: {nextLabel}
        </button>
      ) : null}
    </nav>
  );
}
