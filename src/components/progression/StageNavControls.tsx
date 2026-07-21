import type { ProgressionStage } from "@/lib/progression";
import { StageCompletion } from "@/components/progression/StageCompletion";

export function StageNavControls({
  stage,
  total,
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
      <StageCompletion
        onReviewPrevious={onReviewPrevious}
        onCompareFinished={onCompareFinished}
      />
    );
  }

  const nextLabel = nextStage ? `Next: ${nextStage.title}` : "Next step";

  return (
    <nav className="stage-nav-controls" aria-label="Stage navigation">
      {!isFirst ? (
        <button type="button" className="secondary stage-nav-prev" onClick={onPrev}>
          Previous
        </button>
      ) : (
        <span className="stage-nav-spacer" aria-hidden="true" />
      )}
      <span className="stage-nav-progress">
        Stage {stage.index} of {total}
      </span>
      <button type="button" className="primary stage-nav-next" onClick={onNext}>
        {nextLabel}
      </button>
    </nav>
  );
}
