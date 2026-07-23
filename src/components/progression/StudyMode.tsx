"use client";

import { useState } from "react";

import type {
  ProgressionStage,
  StageId,
} from "@/lib/progression";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProjectStatus } from "@/lib/lessons";
import type { CompareMode } from "@/components/progression/StageComparison";

import { DeskStage } from "@/components/progression/DeskStage";
import { StageScrollNav } from "@/components/progression/StageScrollNav";
import { AtelierRibbon } from "@/components/progression/AtelierRibbon";

/**
 * Guided study: one active stage at a time with a compact stage rail.
 * Does not stack every stage into a single continuous document.
 */
export function StudyMode({
  stages,
  tutorial,
  medium,
  compare,
  onCompareChange,
  referenceUrl,
  onRetryStage,
  retryingStage,
  projectStatus,
  onProjectStatusChange,
  savingStatus = false,
  onOpenMaterials,
}: {
  stages: ProgressionStage[];
  tutorial: Tutorial;
  imageUrl: string;
  medium: Medium;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  onRetryStage?: (stageId: StageId) => void;
  retryingStage?: StageId | null;
  projectStatus: ProjectStatus;
  onProjectStatusChange: (next: ProjectStatus) => void;
  savingStatus?: boolean;
  onOpenMaterials?: (materialId?: string) => void;
}) {
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

  const workspaceChrome = (
    <div className="atelier-chrome atelier-workspace-chrome">
      <StageScrollNav
        stages={stages}
        active={safeActive}
        visitedMax={visitedMax}
        onSelect={selectStage}
      />
    </div>
  );

  return (
    <div className="study-mode study-mode--single studio-mode studio-mode--atelier">
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
              isFirst={safeActive === 0}
              isLast={safeActive === stages.length - 1}
              nextStage={stages[safeActive + 1]}
              onPrev={() => selectStage(safeActive - 1)}
              onNext={() => selectStage(safeActive + 1)}
              onReviewPrevious={() => selectStage(Math.max(0, safeActive - 1))}
              onCompareFinished={() => {
                const finishedIndex = stages.findIndex((s) => s.id === "finished");
                if (finishedIndex >= 0) selectStage(finishedIndex);
                onCompareChange?.("target");
              }}
              compare={compare}
              onCompareChange={onCompareChange}
              referenceUrl={referenceUrl}
              onRetry={onRetryStage}
              retrying={retryingStage === activeStage.id}
              workspaceChrome={workspaceChrome}
              onOpenMaterials={onOpenMaterials}
            />
          </section>
        ) : null}
      </div>

      <AtelierRibbon
        status={projectStatus}
        onStatusChange={onProjectStatusChange}
        saving={savingStatus}
      />
    </div>
  );
}
