"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage, StageId } from "@/lib/progression";
import {
  STAGE_DOM_ID,
  STAGE_PROCESS_LABEL,
  STAGE_STUDY_FRAMING,
} from "@/lib/stage-icons";
import { STAGE_CONCEPT, getTerm } from "@/lib/vocabulary";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { stageFocusPrimary } from "@/components/progression/stage-focus";
import {
  StageComparison,
  type CompareMode,
} from "@/components/progression/StageComparison";
import { LessonSummaryGrid } from "@/components/progression/LessonSummaryGrid";
import { StageNavControls } from "@/components/progression/StageNavControls";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";
import { StageFocusPanel } from "@/components/progression/StageFocusPanel";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageMistake } from "@/components/progression/StageMistake";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { PaletteSuppliesPreview } from "@/components/progression/PaletteSuppliesPreview";
import { StageMaterialsChips } from "@/components/progression/StageMaterialsChips";

function firstSentence(text: string, max = 140): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const match = trimmed.match(/^(.+?[.!?])(?:\s|$)/);
  const sentence = (match?.[1] ?? trimmed).trim();
  if (sentence.length <= max) return sentence;
  return `${sentence.slice(0, max).replace(/\s+\S*$/, "").trim()}…`;
}

function skillFocusLabel(stageId: StageId): string {
  const term = getTerm(STAGE_CONCEPT[stageId]);
  return term?.term ?? STAGE_CONCEPT[stageId];
}

function buildObjective(stage: ProgressionStage): string {
  const framing = STAGE_STUDY_FRAMING[stage.id];
  if (framing) return framing;

  const raw =
    stage.paint.goal.trim() ||
    stage.goals.find((g) => g.trim())?.trim() ||
    stageFocusPrimary(stage);
  return firstSentence(raw, 140);
}

/**
 * One stage in the continuous Study document.
 * Explicit two-column shell on desktop — never `display: contents`.
 */
export function StudyStageSection({
  stage,
  tutorial,
  medium,
  total,
  isFirst,
  isLast,
  nextStage,
  onContinue,
  onReviewPrevious,
  onCompareFinished,
  compare,
  onCompareChange,
  referenceUrl,
  onRetry,
  retrying = false,
  onOpenMaterials,
  sectionRef,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  total: number;
  isFirst: boolean;
  isLast: boolean;
  nextStage?: ProgressionStage;
  onContinue: () => void;
  onReviewPrevious: () => void;
  onCompareFinished: () => void;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  onRetry?: (stageId: StageId) => void;
  retrying?: boolean;
  onOpenMaterials?: (materialId?: string) => void;
  sectionRef?: (el: HTMLElement | null) => void;
}) {
  const processLabel = STAGE_PROCESS_LABEL[stage.id];
  const objective = buildObjective(stage);
  const focusBadge = skillFocusLabel(stage.id);
  const domId = STAGE_DOM_ID[stage.id];
  const workspaceRef = useRef<HTMLDivElement>(null);
  const [workspaceSticky, setWorkspaceSticky] = useState(false);

  useEffect(() => {
    const el = workspaceRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const update = () => {
      const fits = el.scrollHeight <= window.innerHeight - 120;
      setWorkspaceSticky(fits && window.matchMedia("(min-width: 1100px)").matches);
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

  const setSectionRef = (el: HTMLElement | null) => {
    sectionRef?.(el);
  };

  let transition: ReactNode = null;
  if (!isLast && nextStage) {
    transition = (
      <StageNavControls
        stage={stage}
        total={total}
        isFirst={isFirst}
        isLast={false}
        nextStage={nextStage}
        onPrev={() => {}}
        onNext={onContinue}
        onReviewPrevious={onReviewPrevious}
        onCompareFinished={onCompareFinished}
      />
    );
  }

  return (
    <section
      ref={setSectionRef}
      id={domId}
      className="study-stage-section"
      data-stage={stage.id}
      aria-labelledby={`${domId}-title`}
    >
      <div className="study-stage-grid">
        <div className="study-stage-guide">
          <header className="study-stage-head">
            <p className="study-stage-meta">
              Stage {stage.index} of {total}
            </p>
            <h2 id={`${domId}-title`} className="study-stage-title">
              {processLabel}
            </h2>
            <p className="study-stage-teaching">
              <span className="study-stage-teaching-kicker">Teaching point</span>
              <span className="study-stage-teaching-value">{focusBadge}</span>
            </p>
            {objective ? (
              <p className="study-stage-objective">
                <AutoTerms text={objective} />
              </p>
            ) : null}
          </header>

          <LessonSummaryGrid
            stage={stage}
            tutorial={tutorial}
            medium={medium}
            instruction={objective}
          />

          <div className="stage-materials-inline">
            <p className="stage-materials-inline-label">Materials for this stage</p>
            <StageMaterialsChips
              stage={stage}
              onOpenMaterial={(materialId) => onOpenMaterials?.(materialId)}
            />
          </div>

          <details className="study-stage-notes">
            <summary>Technique notes</summary>
            <div className="study-stage-notes-body">
              <StagePalette stage={stage} tutorial={tutorial} medium={medium} />
              <StageSetupStrip stage={stage} medium={medium} />
              <StageFocusPanel stage={stage} />
              {stage.id !== "value-study" && stage.explanation.trim() ? (
                <p className="stage-explanation">
                  <AutoTerms text={firstSentence(stage.explanation, 160)} />
                </p>
              ) : null}
              <StageCheckpoint stage={stage} />
              <StageMistake stage={stage} />
              <StageInstructorNote stage={stage} />
              {onOpenMaterials ? (
                <button
                  type="button"
                  className="btn-ghost stage-open-materials"
                  onClick={() => onOpenMaterials()}
                >
                  View full materials
                </button>
              ) : (
                <PaletteSuppliesPreview tutorial={tutorial} />
              )}
            </div>
          </details>
        </div>

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
      </div>

      {transition}
    </section>
  );
}
