"use client";

import { resolveStageDisplayLabel } from "@/lib/stage-icons";
import { StageComparison } from "@/components/progression/StageComparison";
import { StageCompletion } from "@/components/progression/StageCompletion";
import { StageGuideColumn } from "@/components/progression/StageGuideColumn";
import { StageTeachingHeader } from "@/components/progression/StageTeachingHeader";
import { StageContinueNav } from "@/components/progression/StageContinueNav";
import { FinalPaintingEntry } from "@/components/progression/FinalPaintingEntry";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { buildStageGoal, buildTeachingPoint } from "@/lib/stage-copy";
import type { StageShellBaseProps } from "@/components/progression/stage-shell-props";
import type { ProgressionStage } from "@/lib/progression";

/**
 * Paint-mode stage shell.
 * Hierarchy: Header → Final Painting entry → This stage → Focus / Technique /
 * Watch for → Tips → Continue.
 */
export function DeskStage({
  stage,
  tutorial,
  medium,
  total,
  isLast,
  nextStage,
  onNext,
  onReviewPrevious,
  onCompareFinished,
  compare,
  onCompareChange,
  referenceUrl,
  onRetry,
  retrying,
  onOpenMaterials,
}: StageShellBaseProps & {
  total: number;
  isLast: boolean;
  nextStage?: ProgressionStage;
  onNext?: () => void;
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
}) {
  const processLabel = resolveStageDisplayLabel(stage.id, medium, stage.title);
  const goal = buildStageGoal(stage, 120);
  const todaysFocus = buildTeachingPoint(stage, 160, medium);
  const nextLabel = nextStage
    ? resolveStageDisplayLabel(nextStage.id, medium, nextStage.title)
    : null;

  return (
    <div
      className="desk-stage-inner atelier-layout atelier-layout--simplified atelier-layout--teaching"
      data-stage={stage.id}
    >
      <StageTeachingHeader
        variant="paint"
        stageIndex={stage.index}
        total={total}
        processLabel={processLabel}
        goal={goal}
      />

      <FinalPaintingEntry
        title={processLabel}
        className="desk-stage-final-entry"
      />

      <div className="atelier-workspace">
        <p className="study-stage-canvas-label eyebrow">This stage</p>
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
      </div>

      <div className="atelier-guide">
        {todaysFocus ? (
          <section className="study-stage-focus" aria-label="Today’s focus">
            <p className="study-stage-focus-kicker">Today’s focus</p>
            <p className="study-stage-focus-body">
              <AutoTerms text={todaysFocus} />
            </p>
          </section>
        ) : null}

        <StageGuideColumn
          variant="paint"
          section="instructions"
          stage={stage}
          tutorial={tutorial}
          medium={medium}
          onOpenMaterials={onOpenMaterials}
        />
      </div>

      <div className="atelier-guide atelier-guide--tips">
        <StageGuideColumn
          variant="paint"
          section="extras"
          stage={stage}
          tutorial={tutorial}
          medium={medium}
          onOpenMaterials={onOpenMaterials}
        />
      </div>

      <div className="atelier-next">
        {isLast ? (
          <StageCompletion
            onReviewPrevious={onReviewPrevious}
            onCompareFinished={onCompareFinished}
          />
        ) : nextStage && onNext && nextLabel ? (
          <StageContinueNav nextLabel={nextLabel} onContinue={onNext} />
        ) : null}
      </div>
    </div>
  );
}
