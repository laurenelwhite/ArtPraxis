"use client";

import { useEffect, useMemo, useState } from "react";

import type {
  ProgressionStage,
  StageId,
} from "@/lib/progression";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProjectStatus } from "@/lib/lessons";
import type { CompareMode } from "@/components/progression/StageComparison";
import {
  LESSON_COMPLETE_DOM_ID,
  STAGE_DOM_ID,
} from "@/lib/stage-icons";

import { StudyStageSection } from "@/components/progression/StudyStageSection";
import { StageScrollNav } from "@/components/progression/StageScrollNav";
import { StageCompletion } from "@/components/progression/StageCompletion";
import { AtelierRibbon } from "@/components/progression/AtelierRibbon";
import { useActiveStage } from "@/components/progression/useActiveStage";

/**
 * Guided study as one continuous vertical lesson.
 * All stages stay mounted; navigation scrolls to section anchors.
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
  const domIds = useMemo(
    () => stages.map((stage) => STAGE_DOM_ID[stage.id]),
    [stages],
  );

  const { active, scrollTo, setRef } = useActiveStage(domIds);
  const [visitedMax, setVisitedMax] = useState(0);

  useEffect(() => {
    setVisitedMax((current) => Math.max(current, active));
  }, [active]);

  const scrollToComplete = () => {
    const el = document.getElementById(LESSON_COMPLETE_DOM_ID);
    if (!el) return;
    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  };

  return (
    <div className="study-mode study-mode--continuous studio-mode studio-mode--atelier lesson-document">
      <StageScrollNav
        stages={stages}
        active={active}
        visitedMax={visitedMax}
        onSelect={scrollTo}
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
            isFirst={index === 0}
            isLast={index === stages.length - 1}
            nextStage={stages[index + 1]}
            onContinue={() => scrollTo(index + 1)}
            onReviewPrevious={() => scrollTo(0)}
            onCompareFinished={() => {
              const finishedIndex = stages.findIndex((s) => s.id === "finished");
              if (finishedIndex >= 0) scrollTo(finishedIndex);
              onCompareChange?.("target");
              requestAnimationFrame(scrollToComplete);
            }}
            compare={compare}
            onCompareChange={onCompareChange}
            referenceUrl={referenceUrl}
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
