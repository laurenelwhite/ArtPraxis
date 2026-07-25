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
import {
  isRegenerationBusy,
  type FinalPaintingRegenerationState,
  type RegenerationChecklistPhase,
} from "@/lib/final-painting-regeneration";
import { StudyMode } from "@/components/progression/StudyMode";
import { PaintMode } from "@/components/progression/PaintMode";
import { TermBudgetProvider } from "@/components/vocabulary/TermBudget";
import type { CompareMode } from "@/components/progression/StageComparison";
import { LessonLoadingView } from "@/components/studio/LessonLoadingView";
import { FinalPaintingRegenStatus } from "@/components/studio/FinalPaintingRegenStatus";
import { FinalPaintingCandidateCompare } from "@/components/studio/FinalPaintingCandidateCompare";
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
  masterRequestInFlight = false,
  generationError = null,
  onRetryGeneration,
  onRetryStage,
  retryingStage,
  onRegenerate,
  regenerating,
  regenerationState = "idle",
  regenerationStartedAt = null,
  regenerationError = null,
  regenerationPhase = null,
  candidateFinalPaintingUrl = null,
  onAcceptCandidate,
  onKeepCurrentPainting,
  onTryAnotherCandidate,
  acceptingCandidate = false,
  acceptingMaster,
  onRegenerateMaster,
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
  regenerationState?: FinalPaintingRegenerationState;
  regenerationStartedAt?: number | null;
  regenerationError?: string | null;
  regenerationPhase?: RegenerationChecklistPhase | null;
  candidateFinalPaintingUrl?: string | null;
  onAcceptCandidate?: () => void;
  onKeepCurrentPainting?: () => void;
  onTryAnotherCandidate?: () => void;
  acceptingCandidate?: boolean;
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
  /** Product naming: Study / Paint (not medium-specific Draw). */
  const practiceLabel = "Paint";

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
        medium,
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
      medium,
    ],
  );

  const shared = {
    compare,
    onCompareChange: setCompare,
    referenceUrl: imageUrl,
    masterImageUrl,
    onRetryStage,
    retryingStage,
    onOpenMaterials,
  } as const;

  const regenerateBusy = Boolean(
    acceptingMaster ||
      acceptingCandidate ||
      isRegenerationBusy(regenerationState) ||
      regenerationState === "candidateReady" ||
      (regenerating && regenerationState !== "error"),
  );
  const lessonMedium = getLessonTheme(medium).dataAttribute;
  const showAtelierRegenChrome =
    masterStatus === "ready" &&
    regenerationState !== "idle" &&
    Boolean(masterImageUrl);

  // —— Finite views: atelier mounts after Accept; stages may still be landing ——
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
          medium={medium}
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

  // —— Lesson open: atelier (stages may still generate in the background) ——
  return (
    <div
      className={`lesson-experience mode-${mode} lesson-experience--atelier`}
      data-lesson-medium={lessonMedium}
    >
      <div className="lesson-controls atelier-lesson-toolbar">
        <div
          className="mode-switch mode-switch--compact"
          role="tablist"
          aria-label="Lesson view"
        >
          <button
            type="button"
            role="tab"
            id="lesson-mode-study"
            aria-controls="lesson-mode-panel"
            aria-selected={mode === "study"}
            tabIndex={mode === "study" ? 0 : -1}
            className={mode === "study" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("study")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                setMode("paint");
              }
            }}
          >
            Study
          </button>

          <button
            type="button"
            role="tab"
            id="lesson-mode-paint"
            aria-controls="lesson-mode-panel"
            aria-selected={mode === "paint"}
            tabIndex={mode === "paint" ? 0 : -1}
            className={mode === "paint" ? "mode-tab active" : "mode-tab"}
            onClick={() => setMode("paint")}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
                e.preventDefault();
                setMode("study");
              }
            }}
          >
            {practiceLabel}
          </button>
        </div>

        {onRegenerate ? (
          <details className="atelier-regen-disclosure">
            <summary className="atelier-regen-summary">More options</summary>
            <button
              type="button"
              className="secondary regenerate-targets atelier-regen-action"
              onClick={onRegenerate}
              disabled={regenerateBusy}
            >
              {isRegenerationBusy(regenerationState)
                ? "Preparing a new interpretation…"
                : regenerationState === "candidateReady"
                  ? "New option ready"
                  : `Try another ${lang.completedWorkNoun}`}
            </button>
          </details>
        ) : null}
      </div>

      <div
        id="lesson-mode-panel"
        role="tabpanel"
        aria-label={mode === "study" ? "Study" : "Paint"}
      >

      {showAtelierRegenChrome &&
      regenerationState !== "candidateReady" &&
      !(regenerationState === "applying" && candidateFinalPaintingUrl) &&
      masterImageUrl ? (
        <FinalPaintingRegenStatus
          state={regenerationState}
          phase={regenerationPhase}
          startedAt={regenerationStartedAt}
          error={regenerationError}
          medium={medium}
          onRetry={onRegenerate}
          className="fp-regen-status--atelier"
        />
      ) : null}

      {showAtelierRegenChrome &&
      (regenerationState === "candidateReady" ||
        regenerationState === "applying") &&
      masterImageUrl &&
      candidateFinalPaintingUrl &&
      onAcceptCandidate &&
      onKeepCurrentPainting ? (
        <FinalPaintingCandidateCompare
          currentUrl={masterImageUrl}
          candidateUrl={candidateFinalPaintingUrl}
          title={lang.completedWorkNoun}
          applying={
            regenerationState === "applying" || Boolean(acceptingCandidate)
          }
          onUseNew={onAcceptCandidate}
          onKeepCurrent={onKeepCurrentPainting}
          onTryAnother={onTryAnotherCandidate}
        />
      ) : null}

      {ui.stagesGeneratingInBackground && !isRegenerationBusy(regenerationState) ? (
        <div className="atelier-stages-live-banner" role="status" aria-live="polite">
          <span className="atelier-stages-live-pulse" aria-hidden="true" />
          <div className="atelier-stages-live-copy">
            <p className="atelier-stages-live-now">
              {ui.activeStageLabel
                ? <>Preparing <strong>{ui.activeStageLabel}</strong></>
                : "Preparing stage demonstrations"}
            </p>
            <p className="atelier-stages-live-meta">
              <span className="atelier-stages-live-count">
                {ui.stagesReadyCount} of {ui.stagesTotal} ready
              </span>
              <span className="atelier-stages-live-keep">
                Your lesson stays open while plates arrive.
              </span>
            </p>
            <div
              className="atelier-stages-live-track"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={ui.stagesTotal}
              aria-valuenow={ui.stagesReadyCount}
              aria-label="Stage demonstrations ready"
            >
              <span
                className="atelier-stages-live-track-fill"
                style={{
                  width: `${Math.round(
                    (ui.stagesReadyCount / Math.max(1, ui.stagesTotal)) * 100,
                  )}%`,
                }}
                aria-hidden="true"
              />
            </div>
          </div>
        </div>
      ) : null}

      {mode === "study" ? (
        <TermBudgetProvider>
          <StudyMode
            stages={stages}
            tutorial={tutorial}
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
            {...shared}
          />
        </TermBudgetProvider>
      )}
      </div>
    </div>
  );
}
