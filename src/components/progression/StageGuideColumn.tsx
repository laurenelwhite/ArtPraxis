"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { LessonSummaryGrid } from "@/components/progression/LessonSummaryGrid";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageMaterialsChips } from "@/components/progression/StageMaterialsChips";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { firstSentence } from "@/lib/stage-copy";

type StageGuideColumnProps = {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  onOpenMaterials?: (materialId?: string) => void;
  /** Visual variant — preserves existing Study vs Paint class trees. */
  variant: "study" | "paint";
};

/**
 * Shared guide column: glance cards + Materials collapse + Notes collapse.
 * Study and Paint keep distinct class names for CSS compatibility.
 */
export function StageGuideColumn({
  stage,
  tutorial,
  medium,
  onOpenMaterials,
  variant,
}: StageGuideColumnProps) {
  const hasStageColors = stage.paint.colors.some((c) => c.name.trim());
  const showValuePalette = stage.id === "value-study";
  const showToolPalette = stage.id === "pencil-sketch" && !hasStageColors;
  const noteExplanation =
    stage.id !== "value-study" && stage.explanation.trim()
      ? firstSentence(stage.explanation, 140)
      : "";

  const notesClass =
    variant === "paint" ? "stage-materials studio-collapse" : "study-stage-notes";
  const notesBodyClass =
    variant === "paint" ? "stage-materials-body" : "study-stage-notes-body";

  const materialsAndNotes = (
    <>
      <LessonSummaryGrid stage={stage} />

      <details className="stage-materials-collapse studio-collapse">
        <summary>Materials</summary>
        <div className="stage-materials-collapse-body">
          {showValuePalette || showToolPalette ? (
            <StagePalette stage={stage} tutorial={tutorial} medium={medium} />
          ) : (
            <StageMaterialsChips
              stage={stage}
              onOpenMaterial={(materialId) => onOpenMaterials?.(materialId)}
            />
          )}
          {onOpenMaterials ? (
            <button
              type="button"
              className="btn-ghost stage-open-materials"
              onClick={() => onOpenMaterials()}
            >
              Full list
            </button>
          ) : null}
        </div>
      </details>

      <details className={notesClass}>
        <summary>Notes</summary>
        <div className={notesBodyClass}>
          <StageSetupStrip stage={stage} medium={medium} />
          {noteExplanation ? (
            <p className="stage-explanation">
              <AutoTerms text={noteExplanation} />
            </p>
          ) : null}
          <StageCheckpoint stage={stage} />
          <StageInstructorNote stage={stage} />
        </div>
      </details>
    </>
  );

  if (variant === "paint") {
    return (
      <aside className="atelier-side studio-workspace-side">{materialsAndNotes}</aside>
    );
  }

  return <div className="study-stage-guide">{materialsAndNotes}</div>;
}
