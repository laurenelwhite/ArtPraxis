import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type {
  ProgressionStage,
  StageId,
} from "@/lib/progression";

import { STAGE_CONCEPT } from "@/lib/vocabulary";
import { Term } from "@/components/vocabulary/Term";

import {
  StageComparison,
  type CompareMode,
} from "@/components/progression/StageComparison";

import { LessonSummaryGrid } from "@/components/progression/LessonSummaryGrid";
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

      <LessonSummaryGrid
        stage={stage}
        tutorial={tutorial}
        medium={medium}
      />

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
