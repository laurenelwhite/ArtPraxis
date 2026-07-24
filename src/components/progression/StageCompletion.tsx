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
      className="stage-completion study-completion"
      aria-labelledby="painting-complete-title"
    >
      <p className="study-completion-kicker">Lesson complete</p>
      <h2 id="painting-complete-title" className="study-completion-title">
        Painting complete
      </h2>
      <p className="study-completion-lead">
        Step back. Compare your finished work with the reference and target, then
        note what you would try differently next time.
      </p>

      <div className="stage-completion-actions study-completion-actions">
        <button type="button" className="primary btn-branded" onClick={onCompareFinished}>
          Compare finished work
        </button>
        <button type="button" className="study-completion-secondary" onClick={onReviewPrevious}>
          Review previous stages
        </button>
      </div>

      <div className="study-completion-upload" aria-label="Finished work upload">
        <p className="study-completion-upload-label">Your finished work</p>
        <p className="study-completion-upload-hint">
          Photo upload will live here — for now, mark your progress below.
        </p>
      </div>

      {progressSlot ? (
        <div className="study-completion-progress">{progressSlot}</div>
      ) : null}
    </section>
  );
}
