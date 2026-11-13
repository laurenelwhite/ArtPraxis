"use client";

import { STAGE_DOM_ID } from "@/lib/stage-icons";
import { StageComparison } from "@/components/progression/StageComparison";
import { StageGuideColumn } from "@/components/progression/StageGuideColumn";
import { StageTeachingHeader } from "@/components/progression/StageTeachingHeader";
import { FinalPaintingEntry } from "@/components/progression/FinalPaintingEntry";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { buildStageGoal, buildTeachingPoint } from "@/lib/stage-copy";
import type { StageShellBaseProps } from "@/components/progression/stage-shell-props";

/**
 * One generated stage in the continuous lesson document.
 * Hierarchy: number/title → purpose → artwork → guidance → quiet cue.
 */
export function StudyStageSection({
  stage,
  tutorial,
  medium,
  sectionNumber,
  sectionTotal,
  processLabel,
  nextLabel,
  compare,
  onCompareChange,
  referenceUrl,
  onRetry,
  retrying = false,
  onOpenMaterials,
  sectionRef,
  showFinalEntry = false,
}: StageShellBaseProps & {
  sectionNumber: number;
  sectionTotal: number;
  processLabel: string;
  nextLabel?: string;
  masterImageUrl?: string | null;
  sectionRef?: (el: HTMLElement | null) => void;
  showFinalEntry?: boolean;
}) {
  const goal = buildStageGoal(stage, 120);
  const todaysFocus = buildTeachingPoint(stage, 160, medium);
  const domId = STAGE_DOM_ID[stage.id];

  return (
    <section
      ref={sectionRef}
      id={domId}
      className="study-stage-section lesson-doc-section"
      data-stage={stage.id}
      aria-labelledby={`${domId}-title`}
    >
      <div className="study-stage-grid">
        <StageTeachingHeader
          variant="study"
          stageIndex={sectionNumber}
          total={sectionTotal}
          processLabel={processLabel}
          goal={goal}
          titleId={`${domId}-title`}
        />

        {showFinalEntry ? (
          <FinalPaintingEntry
            title={processLabel}
            className="study-stage-final-entry"
          />
        ) : null}

        <div className="study-stage-workspace">
          <h3 className="study-stage-canvas-label">Target for this stage</h3>
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

        <aside className="study-stage-guide" aria-label="Stage guidance">
          {todaysFocus ? (
            <section className="study-stage-focus" aria-label="What changes now">
              <p className="study-stage-focus-kicker">What changes now</p>
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
      </div>

      {nextLabel ? (
        <p className="lesson-doc-cue study-stage-cue">Next: {nextLabel}</p>
      ) : null}
    </section>
  );
}
