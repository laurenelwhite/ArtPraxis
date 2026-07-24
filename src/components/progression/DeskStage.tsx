"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage, StageId } from "@/lib/progression";
import type { ReactNode } from "react";
import { StageComparison, type CompareMode } from "@/components/progression/StageComparison";
import { StageFocusPanel } from "@/components/progression/StageFocusPanel";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageMistake } from "@/components/progression/StageMistake";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { StageNavControls } from "@/components/progression/StageNavControls";
import { StageCompletion } from "@/components/progression/StageCompletion";
import { LessonSummaryGrid } from "@/components/progression/LessonSummaryGrid";
import { PaletteSuppliesPreview } from "@/components/progression/PaletteSuppliesPreview";
import { StageMaterialsChips } from "@/components/progression/StageMaterialsChips";
import { STAGE_CONCEPT, getTerm } from "@/lib/vocabulary";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";
import { stageFocusPrimary } from "@/components/progression/stage-focus";

function firstSentence(text: string, max = 90): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] ?? trimmed).trim();
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max).replace(/\s+\S*$/, "").trim()}…`;
}

function skillFocusLabel(stageId: StageId): string {
  const term = getTerm(STAGE_CONCEPT[stageId]);
  return term?.term ?? STAGE_CONCEPT[stageId];
}

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
  workspaceChrome,
  onOpenMaterials,
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
  workspaceChrome?: ReactNode;
  onOpenMaterials?: (materialId?: string) => void;
}) {
  const processLabel = STAGE_PROCESS_LABEL[stage.id];
  const instruction = firstSentence(
    stage.paint.goal.trim() ||
      stage.goals.find((g) => g.trim())?.trim() ||
      stageFocusPrimary(stage),
    110,
  );
  const focusBadge = skillFocusLabel(stage.id);

  return (
    <div
      className="desk-stage-inner atelier-layout"
      data-stage={stage.id}
    >
      <div className="atelier-guide">
        <header className="atelier-head studio-workspace-head">
          <p className="studio-workspace-index">
            Stage {stage.index}
            <span className="chapter-index-of"> of {total}</span>
          </p>
          <h2 className="studio-workspace-title">{processLabel}</h2>
          <p className="studio-focus-badge">
            <span className="studio-focus-badge-kicker">Teaching point</span>
            <span className="studio-focus-badge-label">{focusBadge}</span>
          </p>
          {instruction ? (
            <p className="studio-workspace-lede">{instruction}</p>
          ) : null}
          {stage.id === "value-study" ? (
            <p className="stage-image-note" role="note">
              Keep it pale and colorless—simpler than the final painting.
            </p>
          ) : null}
        </header>

        <aside className="atelier-side studio-workspace-side">
          <LessonSummaryGrid
            stage={stage}
            tutorial={tutorial}
            medium={medium}
            instruction={instruction}
          />

          <div className="stage-materials-inline">
            <p className="stage-materials-inline-label">Materials for this stage</p>
            <StageMaterialsChips
              stage={stage}
              onOpenMaterial={(materialId) => onOpenMaterials?.(materialId)}
            />
          </div>

          <details className="stage-materials studio-collapse">
            <summary>Technique notes</summary>
            <div className="stage-materials-body">
              <StagePalette stage={stage} tutorial={tutorial} medium={medium} />
              <StageSetupStrip stage={stage} medium={medium} />
              <StageFocusPanel stage={stage} />
              {stage.id !== "value-study" && stage.explanation.trim() ? (
                <p className="stage-explanation">
                  <AutoTerms text={firstSentence(stage.explanation, 160)} />
                </p>
              ) : null}
              <StageCheckpoint stage={stage} />
              <StageMistake stage={stage} />
              <StageInstructorNote stage={stage} />
              {onOpenMaterials ? (
                <button
                  type="button"
                  className="btn-ghost stage-open-materials"
                  onClick={() => onOpenMaterials()}
                >
                  View full materials
                </button>
              ) : (
                <PaletteSuppliesPreview tutorial={tutorial} />
              )}
            </div>
          </details>
        </aside>
      </div>

      <div className="atelier-workspace">
        {workspaceChrome}

        <div
          className="atelier-canvas studio-workspace-canvas"
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

        <div className="atelier-next">
          {isLast ? (
            <StageCompletion
              onReviewPrevious={onReviewPrevious}
              onCompareFinished={onCompareFinished}
            />
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
