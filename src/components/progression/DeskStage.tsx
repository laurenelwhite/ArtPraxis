"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage, StageId } from "@/lib/progression";
import { StageComparison, type CompareMode } from "@/components/progression/StageComparison";
import { StageFocusPanel } from "@/components/progression/StageFocusPanel";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageMistake } from "@/components/progression/StageMistake";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { StageNavControls } from "@/components/progression/StageNavControls";
import { STAGE_CONCEPT } from "@/lib/vocabulary";
import { Term } from "@/components/vocabulary/Term";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

export function DeskStage({
  stage,
  tutorial,
  medium,
  total,
  isFirst,
  isLast,
  nextStage,
  onPrev,
  onNext,
  onReviewPrevious,
  onCompareFinished,
  compare,
  onCompareChange,
  referenceUrl,
  onRetry,
  retrying,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  nextStage?: ProgressionStage;
  onPrev: () => void;
  onNext: () => void;
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  onRetry?: (stageId: StageId) => void;
  retrying?: boolean;
}) {
  return (
    <div className="desk-stage-inner stage-guided" data-stage={stage.id}>
      <header className="stage-guided-head">
        <p className="desk-kicker">{stage.kicker}</p>
        <h2 className="desk-title">{stage.title}</h2>
        <p className="desk-concept">
          Key concept: <Term id={STAGE_CONCEPT[stage.id]} />
        </p>
      </header>

      <StageFocusPanel stage={stage} />

      <div className="stage-guided-compare" id={`${stage.id}-compare`}>
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

      <StageSetupStrip stage={stage} medium={medium} />
      <StagePalette stage={stage} tutorial={tutorial} medium={medium} />

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
        onPrev={onPrev}
        onNext={onNext}
        onReviewPrevious={onReviewPrevious}
        onCompareFinished={onCompareFinished}
      />
    </div>
  );
}
