"use client";

import { useEffect, useMemo, useState } from "react";

import type { ProjectStatus } from "@/lib/lessons";
import {
  buildLessonDocumentSteps,
  sectionIdForStage,
  resolveDocumentSectionTitle,
} from "@/lib/lesson-document";

import { StudyStageSection } from "@/components/progression/StudyStageSection";
import { StageScrollNav } from "@/components/progression/StageScrollNav";
import { StageCompletion } from "@/components/progression/StageCompletion";
import { AtelierRibbon } from "@/components/progression/AtelierRibbon";
import { LessonPlanSection } from "@/components/progression/LessonPlanSection";
import { LessonObserveSection } from "@/components/progression/LessonObserveSection";
import { LessonColorSection } from "@/components/progression/LessonColorSection";
import { useActiveStage } from "@/components/progression/useActiveStage";
import type { StageModeBaseProps } from "@/components/progression/stage-shell-props";

/**
 * Continuous lesson document: Plan → Observe → Draw → Values → Color →
 * First layer → Build → Refine → Finish. All sections stay mounted.
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
  onOpenMaterials,
}: StageModeBaseProps & {
  projectStatus: ProjectStatus;
  onProjectStatusChange?: (next: ProjectStatus) => void;
  savingStatus?: boolean;
}) {
  const documentSteps = useMemo(
    () => buildLessonDocumentSteps(medium),
    [medium],
  );

  const domIds = useMemo(
    () => documentSteps.map((step) => step.domId),
    [documentSteps],
  );

  const { active, scrollTo, setRef } = useActiveStage(domIds);
  const [visitedMax, setVisitedMax] = useState(0);

  useEffect(() => {
    setVisitedMax((current) => Math.max(current, active));
  }, [active]);

  const stageById = useMemo(() => {
    const map = new Map(stages.map((stage) => [stage.id, stage]));
    return map;
  }, [stages]);

  const observeIndex = documentSteps.findIndex((s) => s.id === "observe");
  const drawLabel = resolveDocumentSectionTitle("draw", medium);
  const firstLayerLabel = resolveDocumentSectionTitle("first-layer", medium);
  const title = tutorial.title?.trim() || "Lesson";

  return (
    <div
      className="study-mode study-mode--continuous studio-mode studio-mode--atelier lesson-document"
      role="region"
      aria-label="Study lesson"
    >
      <StageScrollNav
        className="stage-scroll-nav--quiet lesson-step-map--quiet"
        steps={documentSteps}
        active={active}
        visitedMax={visitedMax}
        onSelect={scrollTo}
      />

      <div className="lesson-document-stages">
        <LessonPlanSection
          sectionRef={setRef(0)}
          tutorial={tutorial}
          medium={medium}
          referenceUrl={referenceUrl}
          masterImageUrl={masterImageUrl}
          title={title}
          documentSteps={documentSteps}
          onBegin={() => scrollTo(observeIndex >= 0 ? observeIndex : 1)}
        />

        <LessonObserveSection
          sectionRef={setRef(1)}
          tutorial={tutorial}
          referenceUrl={referenceUrl}
          title={title}
          nextLabel={drawLabel}
        />

        {documentSteps.map((step, index) => {
          // Plan and Observe are rendered above; skip re-mounting here.
          if (step.id === "plan" || step.id === "observe") return null;

          if (step.id === "color") {
            return (
              <LessonColorSection
                key={step.id}
                sectionRef={setRef(index)}
                tutorial={tutorial}
                medium={medium}
                nextLabel={firstLayerLabel}
              />
            );
          }

          if (!step.stageId) return null;
          const stage = stageById.get(step.stageId);
          if (!stage) return null;

          const nextStep = documentSteps
            .slice(index + 1)
            .find((candidate) => candidate.id !== "plan");
          const sectionLabel = resolveDocumentSectionTitle(
            sectionIdForStage(stage.id),
            medium,
          );

          return (
            <StudyStageSection
              key={stage.id}
              sectionRef={setRef(index)}
              stage={stage}
              tutorial={tutorial}
              medium={medium}
              sectionNumber={step.number}
              sectionTotal={documentSteps.length}
              processLabel={sectionLabel}
              nextLabel={
                step.id === "finish" ? undefined : nextStep?.label
              }
              compare={compare}
              onCompareChange={onCompareChange}
              referenceUrl={referenceUrl}
              masterImageUrl={masterImageUrl}
              onRetry={onRetryStage}
              retrying={retryingStage === stage.id}
              onOpenMaterials={onOpenMaterials}
              showFinalEntry={stage.id === "finished"}
            />
          );
        })}

        <StageCompletion
          onReviewPrevious={() => scrollTo(0)}
          onCompareFinished={() => {
            const finishIndex = documentSteps.findIndex((s) => s.id === "finish");
            if (finishIndex >= 0) scrollTo(finishIndex);
            onCompareChange?.("target");
          }}
          progressSlot={<AtelierRibbon status={projectStatus} />}
        />
      </div>
    </div>
  );
}
