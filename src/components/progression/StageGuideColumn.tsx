"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { LessonSummaryGrid } from "@/components/progression/LessonSummaryGrid";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageMaterialsChips } from "@/components/progression/StageMaterialsChips";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { firstSentence } from "@/lib/stage-copy";

type StageGuideColumnProps = {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  onOpenMaterials?: (materialId?: string) => void;
  /** Visual variant — preserves existing Study vs Paint class trees. */
  variant: "study" | "paint";
  /** Which guidance block to render — supports staged lesson hierarchy. */
  section?: "instructions" | "extras" | "all";
};

/**
 * Shared guide column: concise instructions, materials, and practical tips.
 * Study and Paint keep distinct class names for CSS compatibility.
 */
export function StageGuideColumn({
  stage,
  tutorial,
  medium,
  onOpenMaterials,
  variant,
  section = "all",
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

  const instructions = <LessonSummaryGrid stage={stage} />;

  const extras = (
    <>
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
        <summary>Practical tips</summary>
        <div className={notesBodyClass}>
          <StageSetupStrip stage={stage} medium={medium} />
          {noteExplanation ? (
            <p className="stage-explanation">
              <AutoTerms text={noteExplanation} />
            </p>
          ) : null}
          <StageCheckpoint stage={stage} />
        </div>
      </details>
    </>
  );

  const body = (
    <>
      {section === "instructions" || section === "all" ? instructions : null}
      {section === "extras" || section === "all" ? extras : null}
    </>
  );

  if (variant === "paint") {
    return (
      <aside className="atelier-side studio-workspace-side">{body}</aside>
    );
  }

  return <div className="study-stage-guide-block">{body}</div>;
}
