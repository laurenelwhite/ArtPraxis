import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type {
  ProgressionStage,
  StageId,
} from "@/lib/progression";

import { STAGE_CONCEPT } from "@/lib/vocabulary";
import { Term } from "@/components/vocabulary/Term";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

import {
  StageComparison,
  type CompareMode,
} from "@/components/progression/StageComparison";

import { StageFocusPanel } from "@/components/progression/StageFocusPanel";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageMistake } from "@/components/progression/StageMistake";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { StageNavControls } from "@/components/progression/StageNavControls";

export function StageChapter({
  stage,
  tutorial,
  medium,
  referenceUrl,
  compare,
  onCompareChange,
  onRetry,
  retrying = false,
  total = 1,
  isFirst = true,
  isLast = true,
  nextStage,
  onPrev,
  onNext,
  onReviewPrevious,
  onCompareFinished,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  referenceUrl: string;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  onRetry?: (stageId: StageId) => void;
  retrying?: boolean;
  total?: number;
  isFirst?: boolean;
  isLast?: boolean;
  nextStage?: ProgressionStage;
  onPrev?: () => void;
  onNext?: () => void;
  onReviewPrevious?: () => void;
  onCompareFinished?: () => void;
}) {
  const handlePrev = onPrev ?? (() => {});
  const handleNext = onNext ?? (() => {});
  const handleReviewPrevious = onReviewPrevious ?? (() => {});
  const handleCompareFinished = onCompareFinished ?? (() => {});

  const primaryGoal =
    stage.goals.find((goal) => goal.trim()) ??
    stage.explanation;

  return (
    <article className="stage-chapter stage-guided stage-guided-v2">
      <header className="stage-guided-head stage-guided-head-v2">
        <div>
          <p className="chapter-index">{stage.kicker}</p>
          <h3 className="stage-title">{stage.title}</h3>
        </div>

        <p className="stage-concept">
          <span className="term-inline-label">Key concept</span>
          <Term id={STAGE_CONCEPT[stage.id]} />
        </p>
      </header>

      <section className="stage-goal">
        <p className="stage-goal-label">Your goal</p>

        <p className="stage-goal-text">
          <AutoTerms text={primaryGoal} />
        </p>
      </section>

      <div
        className="stage-guided-compare stage-guided-compare-v2"
        id={`${stage.id}-compare`}
      >
        <StageComparison
          stage={stage}
          tutorial={tutorial}
          medium={medium}
          referenceUrl={referenceUrl}
          compare={compare}
          onCompareChange={onCompareChange}
          onRetry={onRetry}
          retrying={retrying}
        />
      </div>

      <div className="stage-essentials-grid">
        <StageSetupStrip
          stage={stage}
          medium={medium}
        />

        <StagePalette
          stage={stage}
          tutorial={tutorial}
          medium={medium}
        />
      </div>

      <div className="stage-guidance-grid">
        <StageCheckpoint stage={stage} />
        <StageMistake stage={stage} />
      </div>

      <StageInstructorNote stage={stage} />

      <details className="stage-technique-notes">
        <summary>Technique notes</summary>

        <div className="stage-technique-notes-body">
          <StageFocusPanel stage={stage} />

          <p className="stage-explanation">
            <AutoTerms text={stage.explanation} />
          </p>
        </div>
      </details>

      <StageNavControls
        stage={stage}
        total={total}
        isFirst={isFirst}
        isLast={isLast}
        nextStage={nextStage}
        onPrev={handlePrev}
        onNext={handleNext}
        onReviewPrevious={handleReviewPrevious}
        onCompareFinished={handleCompareFinished}
      />
    </article>
  );
}