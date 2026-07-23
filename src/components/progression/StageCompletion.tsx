"use client";

export function StageCompletion({
  onReviewPrevious,
  onCompareFinished,
}: {
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
}) {
  return (
    <div className="stage-completion atelier-next-note" role="region" aria-label="Lesson complete">
      <p className="atelier-next-note-text stage-completion-label">Painting complete.</p>
      <p className="atelier-studio-note-aside stage-completion-lead">
        Step back and compare your finished work with the reference and target.
      </p>
      <div className="stage-completion-actions atelier-plate-actions">
        <button type="button" className="atelier-next-note-action" onClick={onReviewPrevious}>
          Review previous stages
        </button>
        <button type="button" className="primary btn-branded" onClick={onCompareFinished}>
          Compare finished work
        </button>
      </div>
    </div>
  );
}
