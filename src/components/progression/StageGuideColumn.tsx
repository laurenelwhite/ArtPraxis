"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageMaterialsChips } from "@/components/progression/StageMaterialsChips";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { firstSentence, excerpt } from "@/lib/stage-copy";

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
 * Shared guide column: ordered actions, technique notes, checkpoint, mistake.
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
  const actions = stage.goals.map((g) => g.trim()).filter(Boolean).slice(0, 5);
  const mistake =
    stage.paint.watchOut.trim() ||
    stage.commonMistakes.find((m) => m.trim())?.trim() ||
    "";
  const liberty =
    stage.paint.insight.trim() ||
    tutorial.creativeChoices?.find((c) => c.trim())?.trim() ||
    "";
  const technique =
    stage.paint.brushPurpose.trim() ||
    stage.proTips.find((t) => t.trim())?.trim() ||
    stage.paint.brushPressure.trim() ||
    "";
  const unfinished =
    stage.id === "first-wash"
      ? "Leave secondary edges soft and keep reserved lights untouched."
      : stage.id === "second-wash"
        ? "Keep quiet passages unfinished; deepen only where form needs it."
        : stage.id === "refinement"
          ? "Stop before every edge is equally sharp."
          : stage.id === "pencil-sketch"
            ? "Keep graphite light enough to disappear under paint."
            : stage.id === "value-study"
              ? "Most of the paper should remain light — this is a map, not a finished painting."
              : "";

  const notesClass =
    variant === "paint" ? "stage-materials studio-collapse" : "study-stage-notes";
  const notesBodyClass =
    variant === "paint" ? "stage-materials-body" : "study-stage-notes-body";

  const valueLegend =
    stage.id === "value-study" ? (
      <section className="lesson-value-legend" aria-label="Value families">
        <h3 className="lesson-plan-label">Value families</h3>
        <ul className="lesson-value-legend-list">
          <li>
            <span className="lesson-value-swatch lesson-value-swatch--light" aria-hidden="true" />
            <span>
              <strong>Lights</strong>
              {tutorial.valueMap?.lights ? ` — ${tutorial.valueMap.lights}` : ""}
            </span>
          </li>
          <li>
            <span className="lesson-value-swatch lesson-value-swatch--mid" aria-hidden="true" />
            <span>
              <strong>Midtones</strong>
              {tutorial.valueMap?.midtones ? ` — ${tutorial.valueMap.midtones}` : ""}
            </span>
          </li>
          <li>
            <span className="lesson-value-swatch lesson-value-swatch--dark" aria-hidden="true" />
            <span>
              <strong>Darks</strong>
              {tutorial.valueMap?.darks ? ` — ${tutorial.valueMap.darks}` : ""}
            </span>
          </li>
        </ul>
      </section>
    ) : null;

  const instructions = (
    <div className="lesson-stage-anatomy">
      {actions.length > 0 ? (
        <section className="lesson-stage-actions" aria-label="Ordered actions">
          <h3 className="lesson-plan-label">Ordered actions</h3>
          <ol className="lesson-stage-action-list">
            {actions.map((action) => (
              <li key={action}>
                <AutoTerms text={action} />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {valueLegend}

      {technique ? (
        <section className="lesson-stage-technique" aria-label="Technique notes">
          <h3 className="lesson-plan-label">Technique</h3>
          <p>
            <AutoTerms text={excerpt(technique, 160)} />
          </p>
        </section>
      ) : null}

      {mistake ? (
        <section className="lesson-stage-mistake" aria-label="Common mistake">
          <h3 className="lesson-plan-label">Common mistake</h3>
          <p>
            <AutoTerms text={excerpt(mistake, 140)} />
          </p>
        </section>
      ) : null}

      {unfinished ? (
        <section className="lesson-stage-unfinished" aria-label="What remains unfinished">
          <h3 className="lesson-plan-label">What remains unfinished</h3>
          <p>
            <AutoTerms text={unfinished} />
          </p>
        </section>
      ) : null}
    </div>
  );

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

      <details className={notesClass} open>
        <summary>Checkpoint &amp; liberty</summary>
        <div className={notesBodyClass}>
          <StageSetupStrip stage={stage} medium={medium} />
          {noteExplanation ? (
            <p className="stage-explanation">
              <AutoTerms text={noteExplanation} />
            </p>
          ) : null}
          <StageCheckpoint stage={stage} />
          {liberty ? (
            <p className="lesson-stage-liberty">
              <AutoTerms text={firstSentence(liberty, 140)} />
            </p>
          ) : null}
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
