"use client";

import type { ReactNode } from "react";
import type { ProgressionStage } from "@/lib/progression";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";
import { StageComparison } from "@/components/progression/StageComparison";
import { StageCompletion } from "@/components/progression/StageCompletion";
import { StageGuideColumn } from "@/components/progression/StageGuideColumn";
import { StageTeachingHeader } from "@/components/progression/StageTeachingHeader";
import { StageContinueNav } from "@/components/progression/StageContinueNav";
import { buildTeachingPoint } from "@/lib/stage-copy";
import type { StageShellBaseProps } from "@/components/progression/stage-shell-props";

/**
 * Paint-mode stage shell.
 * Hierarchy: Teaching point → Image → Technique / Watch for → Continue.
 * Materials and notes stay collapsed; no duplicated palette or controls.
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
  workspaceChrome,
  onOpenMaterials,
}: StageShellBaseProps & {
  total: number;
  isLast: boolean;
  nextStage?: ProgressionStage;
  onNext?: () => void;
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
  workspaceChrome?: ReactNode;
}) {
  const processLabel = STAGE_PROCESS_LABEL[stage.id];
  const teachingPoint = buildTeachingPoint(stage, 110);
  const nextLabel = nextStage ? STAGE_PROCESS_LABEL[nextStage.id] : null;

  return (
    <div
      className="desk-stage-inner atelier-layout atelier-layout--simplified"
      data-stage={stage.id}
    >
      <div className="atelier-guide">
        <StageTeachingHeader
          variant="paint"
          stageIndex={stage.index}
          total={total}
          processLabel={processLabel}
          teachingPoint={teachingPoint}
        />

        <StageGuideColumn
          variant="paint"
          stage={stage}
          tutorial={tutorial}
          medium={medium}
          onOpenMaterials={onOpenMaterials}
        />
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
          ) : nextStage && onNext && nextLabel ? (
            <StageContinueNav nextLabel={nextLabel} onContinue={onNext} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
