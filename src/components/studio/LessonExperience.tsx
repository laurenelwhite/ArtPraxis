"use client";

import { useEffect, useMemo, useState } from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProjectStatus } from "@/lib/lessons";
import {
  buildProgression,
  type GenerationStatus,
  type StageId,
  type StageImageRecord,
} from "@/lib/progression";
import { resolveLessonUiState } from "@/lib/lesson-ui-state";
import { StudyMode } from "@/components/progression/StudyMode";
import { PaintMode } from "@/components/progression/PaintMode";
import { TermBudgetProvider } from "@/components/vocabulary/TermBudget";
import type { CompareMode } from "@/components/progression/StageComparison";
import { LessonLoadingView } from "@/components/studio/LessonLoadingView";
import { MasterReviewView } from "@/components/studio/MasterReviewView";
import { StageGenerationView } from "@/components/studio/StageGenerationView";
import { AppImage } from "@/components/ui/AppImage";
import { getLessonTheme } from "@/lib/lesson-theme";
import { getMediumLanguage } from "@/lib/medium-language";

type Mode = "study" | "paint";

export function LessonExperience({
  tutorial,
  imageUrl,
  medium,
  entryMode = "study",
  progression,
  progressionHydrated = true,
  masterStatus = "pending",
  masterImageUrl = null,
  masterError = null,
  masterReviewReasons = [],
  masterRequestInFlight = false,
  generationError = null,
  onRetryGeneration,
  onRetryStage,
  retryingStage,
  onRegenerate,
  regenerating,
  onAcceptMaster,
  acceptingMaster,
  onRegenerateMaster,
  masterReadyToAccept = false,
  projectStatus,
  onProjectStatusChange,
  savingStatus = false,
  onOpenMaterials,
}: {
  tutorial: Tutorial;
  imageUrl: string;
  medium: Medium;
  /** Prefer study (continuous) or paint (one-stage) when entering from Overview. */
  entryMode?: Mode;
  progression: StageImageRecord[];
  progressionHydrated?: boolean;
  masterStatus?: GenerationStatus;
  masterImageUrl?: string | null;
  masterError?: string | null;
  masterReviewReasons?: string[];
  masterRequestInFlight?: boolean;
  generationError?: string | null;
  onRetryGeneration?: () => void;
  onRetryStage?: (stageId: StageId) => void;
  retryingStage?: StageId | null;
  onRegenerate?: () => void;
  regenerating?: boolean;
  onAcceptMaster?: () => void;
  acceptingMaster?: boolean;
  onRegenerateMaster?: () => void;
  masterReadyToAccept?: boolean;
  projectStatus: ProjectStatus;
  onProjectStatusChange: (next: ProjectStatus) => void;
  savingStatus?: boolean;
  onOpenMaterials?: (materialId?: string) => void;
}) {
  const stages = useMemo(
    () => buildProgression(tutorial, imageUrl, medium, progression),
    [tutorial, imageUrl, medium, progression],
  );

  const [mode, setMode] = useState<Mode>(entryMode);
  const [compare, setCompare] = useState<CompareMode>("both");
  const lang = useMemo(() => getMediumLanguage(medium), [medium]);
  const practiceLabel =
    lang.actionVerb === "draw" ? "Draw" : lang.actionVerb === "paint" ? "Paint" : "Practice";

  // Sync when Overview CTAs request a mode change.
  useEffect(() => {
    setMode(entryMode);
  }, [entryMode]);

  const ui = useMemo(
    () =>
      resolveLessonUiState({
        hasTutorial: Boolean(tutorial),
        progressionHydrated,
        masterStatus,
        masterImageUrl,
        masterError,
        stages: progression,
        regenerating: Boolean(regenerating),
        masterRequestInFlight,
        generationError,
      }),
    [
      tutorial,
      progressionHydrated,
      masterStatus,
      masterImageUrl,
      masterError,
      progression,
      regenerating,
      masterRequestInFlight,
      generationError,
    ],
  );

  const canAccept = Boolean(
    onAcceptMaster &&
      masterImageUrl &&
      (masterReadyToAccept || masterStatus === "needsReview"),
  );

  const shared = {
    compare,
    onCompareChange: setCompare,
    referenceUrl: imageUrl,
    onRetryStage,
    retryingStage,
    onOpenMaterials,
  } as const;

  const regenerateBusy = Boolean(regenerating || acceptingMaster);
  const lessonMedium = getLessonTheme(medium).dataAttribute;

  // —— Finite views: never mount atelier until ready ——
  if (ui.state === "creating" || ui.state === "masterGenerating") {
    return (
      <div
        className="lesson-experience lesson-experience--atelier lesson-experience--state lesson-experience--generating"
        data-lesson-medium={lessonMedium}
      >
        <LessonLoadingView
          headline={ui.headline}
          detail={ui.detail}
          referenceUrl={imageUrl}
          mode={ui.state === "creating" ? "creating" : "masterGenerating"}
        />
      </div>
    );
  }

  if (ui.state === "error") {
    return (
      <div
        className="lesson-experience lesson-experience--atelier lesson-experience--state"
        data-lesson-medium={lessonMedium}
      >
        <section className="lesson-state-view lesson-error-view" role="alert">
          <div className="lesson-state-card">
            <p className="lesson-state-kicker">Something went wrong</p>
            <h2 className="lesson-state-title">{ui.headline}</h2>
            <p className="lesson-state-detail">{ui.detail}</p>
            {imageUrl ? (
              <figure className="lesson-state-figure">
                <AppImage
                  src={imageUrl}
                  alt="Your uploaded reference"
                  className="lesson-state-img"
                  width={1200}
                  height={900}
                  sizes="(max-width: 700px) 100vw, 480px"
                  style={{ width: "100%", height: "auto" }}
                />
                <figcaption className="lesson-state-caption">Your reference is safe</figcaption>
              </figure>
            ) : null}
            <div className="master-review-view-actions">
              {onRetryGeneration && (
                <button
                  type="button"
                  className="primary btn-branded"
                  onClick={onRetryGeneration}
                  disabled={regenerateBusy || masterRequestInFlight}
                >
                  {masterRequestInFlight ? "Retrying…" : "Retry"}
                </button>
              )}
              {(onRegenerateMaster || onRegenerate) && (
                <button
                  type="button"
                  className="secondary"
                  onClick={onRegenerateMaster || onRegenerate}
                  disabled={regenerateBusy}
                >
                  {regenerating ? "Retrying…" : "Try again"}
                </button>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (ui.state === "masterReview") {
    return (
      <div
        className="lesson-experience lesson-experience--atelier lesson-experience--state"
        data-lesson-medium={lessonMedium}
      >
        <MasterReviewView
          referenceUrl={imageUrl}
          masterImageUrl={masterImageUrl}
          reasons={masterReviewReasons}
          regenerating={Boolean(regenerating)}
          accepting={Boolean(acceptingMaster)}
          canAccept={canAccept}
          onAccept={onAcceptMaster}
          onRegenerate={onRegenerateMaster || onRegenerate}
          headline={ui.headline}
          detail={ui.detail}
        />
      </div>
    );
  }

  if (ui.state === "stageGenerating") {
    return (
      <div
        className="lesson-experience lesson-experience--atelier lesson-experience--state"
        data-lesson-medium={lessonMedium}
      >
        <StageGenerationView
          masterImageUrl={masterImageUrl || imageUrl}
          stages={progression}
          headline={ui.headline}
          detail={ui.detail}
          progress={ui.progress}
          activeStageLabel={ui.activeStageLabel}
        />
      </div>
    );
  }

  // —— Lesson ready: atelier ——
  return (
    <div
      className={`lesson-experience mode-${mode} lesson-experience--atelier`}
      data-lesson-medium={lessonMedium}
    >
      <div className="lesson-controls atelier-lesson-toolbar">
        <div
          className="mode-switch"
          role="tablist"
          aria-label="Lesson view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "study"}
            className={mode === "study" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("study")}
          >
            Study
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "paint"}
            className={mode === "paint" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("paint")}
          >
            {practiceLabel}
          </button>
        </div>

        {onRegenerate ? (
          <button
            type="button"
            className="secondary regenerate-targets atelier-regen-action"
            onClick={onRegenerate}
            disabled={regenerateBusy}
          >
            {regenerating
              ? `Preparing another option…`
              : `Try another ${lang.completedWorkNoun}`}
          </button>
        ) : null}
      </div>

      {regenerating ? (
        <div className="atelier-regen-banner" role="status">
          <p className="atelier-regen-whisper">
            Preparing another option… Your current lesson stays visible.
          </p>
        </div>
      ) : null}

      {mode === "study" ? (
        <TermBudgetProvider>
          <StudyMode
            stages={stages}
            tutorial={tutorial}
            imageUrl={imageUrl}
            medium={medium}
            projectStatus={projectStatus}
            onProjectStatusChange={onProjectStatusChange}
            savingStatus={savingStatus}
            {...shared}
          />
        </TermBudgetProvider>
      ) : (
        <TermBudgetProvider>
          <PaintMode
            stages={stages}
            tutorial={tutorial}
            medium={medium}
            masterImageUrl={masterImageUrl}
            {...shared}
          />
        </TermBudgetProvider>
      )}
    </div>
  );
}
