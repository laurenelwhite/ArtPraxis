"use client";

import { useState } from "react";
import { StageProcessRail } from "@/components/progression/StageProcessRail";
import { DeskStage } from "@/components/progression/DeskStage";
import type { StageModeBaseProps } from "@/components/progression/stage-shell-props";

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

  const safeActive = Math.max(0, Math.min(active, Math.max(stages.length - 1, 0)));
  const activeStage = stages[safeActive];

  const selectStage = (index: number) => {
    if (stages.length === 0) return;
    const next = Math.max(0, Math.min(index, stages.length - 1));
    setActive(next);
    setVisitedMax((current) => Math.max(current, next));
  };

  return (
    <div className="paint-mode desk studio-mode studio-mode--atelier">
      <StageProcessRail
        className="desk-nav stage-process--quiet"
        stages={stages}
        active={safeActive}
        visitedMax={visitedMax}
        onSelect={selectStage}
        medium={medium}
      />

      <div className="desk-stages studio-stage-host atelier-stage-host">
        {activeStage ? (
          <section
            key={activeStage.id}
            id={`stage-${activeStage.id}`}
            className="desk-stage studio-chapter-active"
            aria-label={`${activeStage.title} — stage ${activeStage.index} of ${stages.length}`}
          >
            <DeskStage
              stage={activeStage}
              tutorial={tutorial}
              medium={medium}
              total={stages.length}
              isLast={safeActive === stages.length - 1}
              nextStage={stages[safeActive + 1]}
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
