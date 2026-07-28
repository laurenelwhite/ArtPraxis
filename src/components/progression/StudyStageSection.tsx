"use client";

import {
  STAGE_DOM_ID,
  resolveStageDisplayLabel,
} from "@/lib/stage-icons";
import { StageComparison } from "@/components/progression/StageComparison";
import { StageGuideColumn } from "@/components/progression/StageGuideColumn";
import { StageTeachingHeader } from "@/components/progression/StageTeachingHeader";
import { StageContinueNav } from "@/components/progression/StageContinueNav";
import { FinalPaintingEntry } from "@/components/progression/FinalPaintingEntry";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { buildStageGoal, buildTeachingPoint } from "@/lib/stage-copy";
import type { StageShellBaseProps } from "@/components/progression/stage-shell-props";
import type { ProgressionStage } from "@/lib/progression";

/**
 * One stage in the continuous Study journey.
 * Hierarchy: Header → Final Painting entry → This stage → Focus / Technique /
 * Watch for → Tips → Continue.
 */
export function StudyStageSection({
  stage,
  tutorial,
  medium,
  total,
  nextStage,
  onContinue,
  compare,
  onCompareChange,
  referenceUrl,
  onRetry,
  retrying = false,
  onOpenMaterials,
  sectionRef,
}: StageShellBaseProps & {
  total: number;
  nextStage?: ProgressionStage;
  onContinue?: () => void;
  masterImageUrl?: string | null;
  sectionRef?: (el: HTMLElement | null) => void;
}) {
  const processLabel = resolveStageDisplayLabel(stage.id, medium, stage.title);
  const goal = buildStageGoal(stage, 120);
  const todaysFocus = buildTeachingPoint(stage, 160, medium);
  const domId = STAGE_DOM_ID[stage.id];
  const nextLabel = nextStage
    ? resolveStageDisplayLabel(nextStage.id, medium, nextStage.title)
    : null;

  return (
    <section
      ref={sectionRef}
      id={domId}
      className="study-stage-section"
      data-stage={stage.id}
      aria-labelledby={`${domId}-title`}
    >
      <div className="study-stage-grid">
        <StageTeachingHeader
          variant="study"
          stageIndex={stage.index}
          total={total}
          processLabel={processLabel}
          goal={goal}
          titleId={`${domId}-title`}
        />

        <FinalPaintingEntry
          title={processLabel}
          className="study-stage-final-entry"
        />

        <aside className="study-stage-guide" aria-label="Stage guidance">
          {todaysFocus ? (
            <section className="study-stage-focus" aria-label="Today’s focus">
              <p className="study-stage-focus-kicker">Today’s focus</p>
              <p className="study-stage-focus-body">
                <AutoTerms text={todaysFocus} />
              </p>
            </section>
          ) : null}

          <StageGuideColumn
            variant="study"
            section="instructions"
            stage={stage}
            tutorial={tutorial}
            medium={medium}
            onOpenMaterials={onOpenMaterials}
          />

          <StageGuideColumn
            variant="study"
            section="extras"
            stage={stage}
            tutorial={tutorial}
            medium={medium}
            onOpenMaterials={onOpenMaterials}
          />
        </aside>

        <div className="study-stage-workspace">
          <h3 className="study-stage-canvas-label">This stage</h3>
          <div className="study-stage-canvas" id={`${stage.id}-compare`}>
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
      </div>

      {nextStage && onContinue && nextLabel ? (
        <StageContinueNav nextLabel={nextLabel} onContinue={onContinue} />
      ) : null}
    </section>
  );
}
