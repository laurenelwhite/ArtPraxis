"use client";

import type { ReactNode } from "react";
import { LESSON_COMPLETE_DOM_ID } from "@/lib/stage-icons";

export function StageCompletion({
  onReviewPrevious,
  onCompareFinished,
  progressSlot,
}: {
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
  progressSlot?: ReactNode;
}) {
  return (
    <section
      id={LESSON_COMPLETE_DOM_ID}
      className="stage-completion study-completion ap-completion lesson-finish-coda"
      aria-labelledby="painting-complete-title"
    >
      <p className="ap-completion-kicker study-completion-kicker">Finish</p>
      <h2 id="painting-complete-title" className="study-completion-title">
        Review your work
      </h2>
      <p className="study-completion-lead">
        Compare your painting with the final target. Ask what still reads weakly,
        what you would simplify next time, and where creative liberty served the piece.
      </p>

      <ul className="lesson-finish-checklist">
        <li>Does the focal area read first?</li>
        <li>Are supporting passages quieter than the focus?</li>
        <li>Did you stop before overworking edges and texture?</li>
      </ul>

      <div className="stage-completion-actions study-completion-actions">
        <button type="button" className="primary btn-branded" onClick={onCompareFinished}>
          Compare finished work
        </button>
        <button type="button" className="study-completion-secondary" onClick={onReviewPrevious}>
          Return to Plan
        </button>
      </div>

      <div
        className="progress-final-placeholder study-completion-upload"
        aria-labelledby="progress-final-upload-label"
      >
        <p id="progress-final-upload-label" className="progress-final-upload-label study-completion-upload-label">
          Your finished work
        </p>
        <p className="progress-final-upload-hint study-completion-upload-hint">
          Photo upload will live here — for now, mark your progress below.
        </p>
      </div>

      {progressSlot ? (
        <div className="study-completion-progress">{progressSlot}</div>
      ) : null}
    </section>
  );
}
