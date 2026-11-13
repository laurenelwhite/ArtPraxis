"use client";

import { useMemo, useState } from "react";
import { STAGE_DOM_ID } from "@/lib/stage-icons";
import {
  sectionIdForStage,
  resolveDocumentSectionTitle,
  type LessonDocumentStep,
} from "@/lib/lesson-document";
import { StageScrollNav } from "@/components/progression/StageScrollNav";
import { DeskStage } from "@/components/progression/DeskStage";
import type { StageModeBaseProps } from "@/components/progression/stage-shell-props";

/**
 * Paint mode — one active stage at a time.
 * Retained for compatibility; continuous Study Mode is the live lesson path.
 */
export function PaintMode({
  stages,
  tutorial,
  medium,
  compare,
  onCompareChange,
  referenceUrl,
  masterImageUrl,
  onRetryStage,
  retryingStage,
  onOpenMaterials,
}: StageModeBaseProps) {
  const [active, setActive] = useState(0);
  const [visitedMax, setVisitedMax] = useState(0);

  const steps = useMemo<LessonDocumentStep[]>(
    () =>
      stages.map((stage, index) => {
        const sectionId = sectionIdForStage(stage.id);
        return {
          id: sectionId,
          number: index + 1,
          label: resolveDocumentSectionTitle(sectionId, medium),
          shortLabel: resolveDocumentSectionTitle(sectionId, medium),
          domId: STAGE_DOM_ID[stage.id],
          stageId: stage.id,
        };
      }),
    [stages, medium],
  );

  const safeActive = Math.max(0, Math.min(active, Math.max(stages.length - 1, 0)));
  const activeStage = stages[safeActive];
  const domId = activeStage ? STAGE_DOM_ID[activeStage.id] : null;

  const selectStage = (index: number) => {
    if (stages.length === 0) return;
    const next = Math.max(0, Math.min(index, stages.length - 1));
    setActive(next);
    setVisitedMax((current) => Math.max(current, next));
  };

  return (
    <div
      className="paint-mode desk studio-mode studio-mode--atelier lesson-document"
      role="region"
      aria-label="Paint lesson"
    >
      <StageScrollNav
        className="stage-scroll-nav--quiet"
        steps={steps}
        active={safeActive}
        visitedMax={visitedMax}
        onSelect={selectStage}
      />

      <div className="desk-stages studio-stage-host atelier-stage-host paint-stage-host">
        {activeStage && domId ? (
          <section
            key={activeStage.id}
            id={domId}
            className="paint-stage-section desk-stage studio-chapter-active"
            aria-labelledby={`${domId}-title`}
          >
            <DeskStage
              stage={activeStage}
              tutorial={tutorial}
              medium={medium}
              total={stages.length}
              isLast={safeActive === stages.length - 1}
              nextStage={stages[safeActive + 1]}
              titleId={`${domId}-title`}
              onNext={() => selectStage(Math.min(stages.length - 1, safeActive + 1))}
              onReviewPrevious={() => selectStage(Math.max(0, safeActive - 1))}
              onCompareFinished={() => {
                const finishedIndex = stages.findIndex((s) => s.id === "finished");
                if (finishedIndex >= 0) selectStage(finishedIndex);
                onCompareChange?.("target");
              }}
              compare={compare}
              onCompareChange={onCompareChange}
              referenceUrl={referenceUrl}
              masterImageUrl={masterImageUrl}
              onRetry={onRetryStage}
              retrying={retryingStage === activeStage.id}
              onOpenMaterials={onOpenMaterials}
            />
          </section>
        ) : null}
      </div>
    </div>
  );
}
