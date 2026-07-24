"use client";

import { useEffect, useRef, useState } from "react";
import type { ProgressionStage } from "@/lib/progression";
import { STAGE_DOM_ID, STAGE_PROCESS_LABEL } from "@/lib/stage-icons";
import { StageComparison } from "@/components/progression/StageComparison";
import { StageGuideColumn } from "@/components/progression/StageGuideColumn";
import { StageTeachingHeader } from "@/components/progression/StageTeachingHeader";
import { StageContinueNav } from "@/components/progression/StageContinueNav";
import { buildTeachingPoint } from "@/lib/stage-copy";
import type { StageShellBaseProps } from "@/components/progression/stage-shell-props";

/** Sticky workspace: fits viewport chrome (~ap-space-11 + sticky offset). */
const WORKSPACE_STICKY_OFFSET_PX = 120;
const WORKSPACE_STICKY_MIN_WIDTH_PX = 1100;

/**
 * One stage in the continuous Study journey.
 * Hierarchy: Teaching point → Image → Technique / Watch for → Continue.
 * Materials and technique notes stay collapsed; palette lives only in Materials.
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
  sectionRef?: (el: HTMLElement | null) => void;
}) {
  const processLabel = STAGE_PROCESS_LABEL[stage.id];
  const teachingPoint = buildTeachingPoint(stage, 120);
  const domId = STAGE_DOM_ID[stage.id];
  const nextLabel = nextStage ? STAGE_PROCESS_LABEL[nextStage.id] : null;
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceSticky, setWorkspaceSticky] = useState(false);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const fits = el.scrollHeight <= window.innerHeight - WORKSPACE_STICKY_OFFSET_PX;
      setWorkspaceSticky(
        fits && window.matchMedia(`(min-width: ${WORKSPACE_STICKY_MIN_WIDTH_PX}px)`).matches,
      );
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [stage.id, compare]);

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
          teachingPoint={teachingPoint}
          titleId={`${domId}-title`}
        />

        <div
          ref={workspaceRef}
          className={
            workspaceSticky
              ? "study-stage-workspace is-sticky"
              : "study-stage-workspace"
          }
        >
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

        <StageGuideColumn
          variant="study"
          stage={stage}
          tutorial={tutorial}
          medium={medium}
          onOpenMaterials={onOpenMaterials}
        />
      </div>

      {nextStage && onContinue && nextLabel ? (
        <StageContinueNav nextLabel={nextLabel} onContinue={onContinue} />
      ) : null}
    </section>
  );
}
