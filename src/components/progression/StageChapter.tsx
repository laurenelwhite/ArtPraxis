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

  return (
    <article className="stage-chapter stage-guided">
      <header className="stage-guided-head">
        <p className="chapter-index">{stage.kicker}</p>

        <h3 className="stage-title">{stage.title}</h3>

        <p className="stage-concept">
          Key concept: <Term id={STAGE_CONCEPT[stage.id]} />
        </p>
      </header>

      <StageFocusPanel stage={stage} />

      <div
        className="stage-guided-compare"
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

      <StageSetupStrip
        stage={stage}
        medium={medium}
      />

      <StagePalette
        stage={stage}
        tutorial={tutorial}
        medium={medium}
      />

      <div className="stage-guided-body">
        <p className="stage-explanation">
          <AutoTerms text={stage.explanation} />
        </p>
      </div>

      <StageCheckpoint stage={stage} />

      <StageMistake stage={stage} />

      <StageInstructorNote stage={stage} />

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
