import type { ReactNode } from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type {
  ProgressionStage,
  StageId,
} from "@/lib/progression";

import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";
import { STAGE_CONCEPT, getTerm } from "@/lib/vocabulary";
import { stageFocusPrimary } from "@/components/progression/stage-focus";

import {
  StageComparison,
  type CompareMode,
} from "@/components/progression/StageComparison";

import { LessonSummaryGrid } from "@/components/progression/LessonSummaryGrid";
import { StageNavControls } from "@/components/progression/StageNavControls";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StageFocusPanel } from "@/components/progression/StageFocusPanel";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageMistake } from "@/components/progression/StageMistake";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { PaletteSuppliesPreview } from "@/components/progression/PaletteSuppliesPreview";

function whatToDo(stage: ProgressionStage): string {
  const fromGoal = stage.goals.find((g) => g.trim())?.trim();
  if (fromGoal) return fromGoal;
  if (stage.paint.brushPurpose.trim()) return stage.paint.brushPurpose.trim();
  if (stage.paint.goal.trim()) return stage.paint.goal.trim();
  return stageFocusPrimary(stage);
}

function firstSentence(text: string, max = 100): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] ?? trimmed).trim();
  if (sentence.length <= max) return sentence;
  const cut = sentence.slice(0, max);
  return `${cut.replace(/\s+\S*$/, "").trim()}…`;
}

function skillFocusLabel(stageId: StageId): string {
  const term = getTerm(STAGE_CONCEPT[stageId]);
  return term?.term ?? STAGE_CONCEPT[stageId];
}

/**
 * One stage section in the continuous lesson document.
 * Image comparison is dominant; teaching content follows beneath.
 */
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
  /** @deprecated Continuous document no longer nests process rail chrome. */
  workspaceChrome?: ReactNode;
}) {
  const handlePrev = onPrev ?? (() => {});
  const handleNext = onNext ?? (() => {});
  const handleReviewPrevious = onReviewPrevious ?? (() => {});
  const handleCompareFinished = onCompareFinished ?? (() => {});
  const processLabel = STAGE_PROCESS_LABEL[stage.id];
  const instruction = firstSentence(whatToDo(stage), 140);
  const focusBadge = skillFocusLabel(stage.id);

  return (
    <article
      id={`stage-${stage.id}`}
      className="lesson-stage"
      data-stage={stage.id}
    >
      <header className="lesson-stage-head">
        <p className="lesson-stage-meta">
          Stage {stage.index} of {total}
        </p>
        <h2 className="lesson-stage-title">{processLabel}</h2>
        {instruction ? (
          <p className="lesson-stage-objective">{instruction}</p>
        ) : null}
        <p className="lesson-stage-focus-meta">
          <span className="lesson-stage-focus-kicker">Focus</span>
          <span className="lesson-stage-focus-value">{focusBadge}</span>
        </p>
      </header>

      <div className="lesson-stage-visual" id={`${stage.id}-compare`}>
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
        instruction={instruction}
      />

      <details className="lesson-stage-disclosure">
        <summary>Materials &amp; notes</summary>
        <div className="lesson-stage-disclosure-body">
          <StagePalette stage={stage} tutorial={tutorial} medium={medium} />
          <StageSetupStrip stage={stage} medium={medium} />
          <StageFocusPanel stage={stage} />
          {stage.explanation.trim() ? (
            <div className="lesson-summary-block">
              <h4 className="lesson-summary-block-label">Why</h4>
              <p className="stage-explanation">
                <AutoTerms text={firstSentence(stage.explanation, 160)} />
              </p>
            </div>
          ) : null}
          <PaletteSuppliesPreview tutorial={tutorial} />
          <StageCheckpoint stage={stage} />
          <StageMistake stage={stage} />
          <StageInstructorNote stage={stage} />
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
