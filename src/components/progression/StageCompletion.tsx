"use client";

export function StageCompletion({
  onReviewPrevious,
  onCompareFinished,
}: {
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
}) {
  return (
    <div className="stage-completion" role="region" aria-label="Lesson complete">
      <p className="stage-completion-label">Painting complete</p>
      <p className="stage-completion-lead">
        Step back and compare your finished work with the reference and target.
      </p>
      <div className="stage-completion-actions">
        <button type="button" className="secondary" onClick={onReviewPrevious}>
          Review previous stages
        </button>
        <button type="button" className="primary" onClick={onCompareFinished}>
          Compare finished work
        </button>
      </div>
    </div>
  );
}
