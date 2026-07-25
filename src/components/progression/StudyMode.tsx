"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProjectStatus } from "@/lib/lessons";
import { STAGE_DOM_ID } from "@/lib/stage-icons";

import { StudyStageSection } from "@/components/progression/StudyStageSection";
import { StageScrollNav } from "@/components/progression/StageScrollNav";
import { StageCompletion } from "@/components/progression/StageCompletion";
import { AtelierRibbon } from "@/components/progression/AtelierRibbon";
import { useActiveStage } from "@/components/progression/useActiveStage";
import type { StageModeBaseProps } from "@/components/progression/stage-shell-props";

/**
 * Guided study as one continuous vertical atelier journey.
 * Stages stay mounted; the sticky indicator scrolls to anchors.
 */
export function StudyMode({
  stages,
  tutorial,
  medium,
  compare,
  onCompareChange,
  referenceUrl,
  masterImageUrl,
  onRetryStage,
  retryingStage,
  projectStatus,
  onProjectStatusChange,
  savingStatus = false,
  onOpenMaterials,
}: StageModeBaseProps & {
  projectStatus: ProjectStatus;
  onProjectStatusChange: (next: ProjectStatus) => void;
  savingStatus?: boolean;
}) {
  const domIds = useMemo(
    () => stages.map((stage) => STAGE_DOM_ID[stage.id]),
    [stages],
  );

  const { active, scrollTo, setRef } = useActiveStage(domIds);
  const [visitedMax, setVisitedMax] = useState(0);

  useEffect(() => {
    setVisitedMax((current) => Math.max(current, active));
  }, [active]);

  return (
    <div className="study-mode study-mode--continuous studio-mode studio-mode--atelier lesson-document">
      <StageScrollNav
        className="stage-scroll-nav--quiet"
        stages={stages}
        active={active}
        visitedMax={visitedMax}
        onSelect={scrollTo}
        medium={medium}
      />

      <div className="lesson-document-stages">
        {stages.map((stage, index) => (
          <StudyStageSection
            key={stage.id}
            sectionRef={setRef(index)}
            stage={stage}
            tutorial={tutorial}
            medium={medium}
            total={stages.length}
            nextStage={stages[index + 1]}
            onContinue={
              index < stages.length - 1 ? () => scrollTo(index + 1) : undefined
            }
            compare={compare}
            onCompareChange={onCompareChange}
            referenceUrl={referenceUrl}
            masterImageUrl={masterImageUrl}
            onRetry={onRetryStage}
            retrying={retryingStage === stage.id}
            onOpenMaterials={onOpenMaterials}
          />
        ))}

        <StageCompletion
          onReviewPrevious={() => scrollTo(0)}
          onCompareFinished={() => {
            const finishedIndex = stages.findIndex((s) => s.id === "finished");
            if (finishedIndex >= 0) scrollTo(finishedIndex);
            onCompareChange?.("target");
          }}
          progressSlot={
            <AtelierRibbon
              status={projectStatus}
              onStatusChange={onProjectStatusChange}
              saving={savingStatus}
            />
          }
        />
      </div>
    </div>
  );
}
