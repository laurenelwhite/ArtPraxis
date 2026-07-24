/**
 * Shared “Next stage” control used by Study and Paint shells.
 */
export function StageContinueNav({
  nextLabel,
  onContinue,
}: {
  nextLabel: string;
  onContinue: () => void;
}) {
  return (
    <nav className="study-stage-transition" aria-label="Continue to next stage">
      <button
        type="button"
        className="study-stage-transition-btn"
        onClick={onContinue}
        aria-label={`Continue to ${nextLabel}`}
      >
        <span className="study-stage-transition-rule" aria-hidden="true" />
        <span className="study-stage-transition-copy">
          <span className="study-stage-transition-kicker">Next</span>
          <span className="study-stage-transition-name">{nextLabel}</span>
        </span>
        <span className="study-stage-transition-arrow" aria-hidden="true">
          →
        </span>
      </button>
    </nav>
  );
}
