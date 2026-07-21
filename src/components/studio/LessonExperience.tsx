"use client";

import { useMemo, useState } from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import {
  buildProgression,
  type GenerationStatus,
  type StageId,
  type StageImageRecord,
} from "@/lib/progression";
import { StudyMode } from "@/components/progression/StudyMode";
import { PaintMode } from "@/components/progression/PaintMode";
import { TermBudgetProvider } from "@/components/vocabulary/TermBudget";
import type { CompareMode } from "@/components/progression/StageComparison";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";

type Mode = "study" | "paint";

export function LessonExperience({
  tutorial,
  imageUrl,
  medium,
  progression,
  masterStatus = "pending",
  masterImageUrl = null,
  masterReviewReasons = [],
  onRetryStage,
  retryingStage,
  onRegenerate,
  regenerating,
  onAcceptMaster,
  acceptingMaster,
  onRegenerateMaster,
  masterReadyToAccept = false,
}: {
  tutorial: Tutorial;
  imageUrl: string;
  medium: Medium;
  progression: StageImageRecord[];
  masterStatus?: GenerationStatus;
  masterImageUrl?: string | null;
  masterReviewReasons?: string[];
  onRetryStage?: (stageId: StageId) => void;
  retryingStage?: StageId | null;
  onRegenerate?: () => void;
  regenerating?: boolean;
  onAcceptMaster?: () => void;
  acceptingMaster?: boolean;
  onRegenerateMaster?: () => void;
  masterReadyToAccept?: boolean;
}) {
  const stages = useMemo(
    () => buildProgression(tutorial, imageUrl, medium, progression),
    [tutorial, imageUrl, medium, progression],
  );

  const [mode, setMode] = useState<Mode>("study");
  const [compare, setCompare] = useState<CompareMode>("both");

  const total = progression.length || stages.length;

  // MVP counts any ready target, including deterministic master-derived targets.
  const ready = progression.filter(
    (stage) =>
      stage.generationStatus === "ready" &&
      Boolean(stage.targetImageUrl),
  ).length;

  const usable = progression.filter((stage) =>
    Boolean(stage.targetImageUrl),
  ).length;

  const needsReview = masterStatus === "needsReview";

  const stagesRefining =
    ENABLE_AI_STAGE_REFINEMENT &&
    progression.some(
      (stage) =>
        stage.generationStatus === "generating" &&
        stage.previewSource === "master",
    );

  const anyGenerating =
    masterStatus === "generating" ||
    progression.some(
      (stage) => stage.generationStatus === "generating",
    );

  const anyFailed =
    masterStatus === "failed" ||
    progression.some(
      (stage) => stage.generationStatus === "failed",
    );

  const masterMessage = (
    {
      pending: "Preparing painted targets…",
      generating: "Generating master painting…",
      ready: null,
      failed: "Couldn’t prepare the master painting",
      needsReview: "Master needs review.",
    } satisfies Record<GenerationStatus, string | null>
  )[masterStatus];

  // Show refinement messaging only when AI refinement is enabled
  // and master-derived stages are actively refining.
  const generationMessage =
    masterMessage ??
    (ENABLE_AI_STAGE_REFINEMENT && stagesRefining
      ? `Refining targets… ${ready} / ${total} refined`
      : null);

  const progressLabel =
    generationMessage ??
    (anyFailed
      ? "Some demonstrations need a retry"
      : "Demonstrations ready");

  const showProgress =
    !needsReview &&
    total > 0 &&
    (
      masterMessage !== null ||
      (ENABLE_AI_STAGE_REFINEMENT && stagesRefining) ||
      anyFailed ||
      (
        masterStatus !== "ready" &&
        (
          usable > 0 ||
          masterStatus === "pending" ||
          masterStatus === "generating"
        )
      )
    );

  // Single-stage retry stays available for internal/manual AI evaluation.
  // Automatic stage refinement remains controlled by the feature flag.
  const shared = {
    compare,
    onCompareChange: setCompare,
    referenceUrl: imageUrl,
    onRetryStage,
    retryingStage,
  } as const;

  // General lesson-level busy state.
  // This can include background stage refinement.
 const regenerateBusy = Boolean(
  regenerating ||
  acceptingMaster ||
  masterStatus === "generating" ||
  (masterStatus === "ready" && stagesRefining),
);

  // Master-review actions should not be blocked by background stage states.
  // Only an active accept or regenerate request should disable them.
  const masterReviewBusy = Boolean(
    regenerating ||
    acceptingMaster,
  );

  // After refresh, masterReadyToAccept may not be restored immediately.
  // A visible saved master in needsReview state is sufficient to enable review.
  const canAccept = Boolean(
    onAcceptMaster &&
    masterImageUrl &&
    (
      masterReadyToAccept ||
      masterStatus === "needsReview"
    ),
  );

  return (
    <div className={`lesson-experience mode-${mode}`}>
      <div className="lesson-controls">
        <div
          className="mode-switch"
          role="tablist"
          aria-label="Lesson view"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "study"}
            className={
              mode === "study"
                ? "mode-tab active"
                : "mode-tab"
            }
            onClick={() => setMode("study")}
          >
            Study
            <small>Read the lesson</small>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === "paint"}
            className={
              mode === "paint"
                ? "mode-tab active"
                : "mode-tab"
            }
            onClick={() => setMode("paint")}
          >
            Paint
            <small>Work stage by stage</small>
          </button>
        </div>

        {onRegenerate && !needsReview && (
          <button
            type="button"
            className="secondary regenerate-targets"
            onClick={onRegenerate}
          disabled={regenerateBusy}
          >
            {regenerating
              ? "Regenerating…"
              : "Regenerate all targets"}
          </button>
        )}
      </div>

      {needsReview && (
        <div
          className="master-review"
          role="region"
          aria-label="Review master painting"
        >
          <div className="master-review-copy">
            <p className="master-review-title">
              Review master
            </p>

            <p className="master-review-body">
              Composition checks flagged this master. Accept it to
              continue stage demonstrations from this candidate, or
              regenerate only the master.
            </p>

            {masterReviewReasons.length > 0 && (
              <ul className="master-review-reasons">
                {masterReviewReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
          </div>

          {masterImageUrl ? (
            <figure className="master-review-figure">
              <img
                src={masterImageUrl}
                alt="Proposed master painting for this lesson"
                className="master-review-img"
              />
            </figure>
          ) : (
            <div
              className="master-review-pending"
              role="status"
            >
              <span
                className="spinner"
                aria-hidden="true"
              />
              <p>Saving the master candidate…</p>
            </div>
          )}

          <div className="master-review-actions">
            {onAcceptMaster && (
              <button
                type="button"
                className="primary"
                onClick={onAcceptMaster}
                disabled={masterReviewBusy || !canAccept}
              >
                {acceptingMaster
                  ? "Accepting…"
                  : !canAccept
                    ? "Saving…"
                    : "Accept master"}
              </button>
            )}

            {(onRegenerateMaster || onRegenerate) && (
              <button
                type="button"
                className="secondary"
                onClick={
                  onRegenerateMaster ||
                  onRegenerate
                }
                disabled={masterReviewBusy}
              >
                {regenerating
                  ? "Regenerating…"
                  : "Regenerate"}
              </button>
            )}
          </div>
        </div>
      )}

      {showProgress && (
        <div
          className={`gen-progress${
            anyFailed && !anyGenerating
              ? " has-error"
              : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {anyGenerating && (
            <span
              className="spinner gen-progress-spinner"
              aria-hidden="true"
            />
          )}

          <span className="gen-progress-label">
            {progressLabel}
          </span>

          {ENABLE_AI_STAGE_REFINEMENT && (
            <span className="gen-progress-count">
              {ready} / {total} refined
            </span>
          )}

          <span
            className="gen-progress-track"
            aria-hidden="true"
          >
            <span
              className="gen-progress-fill"
              style={{
                width: `${
                  total
                    ? (ready / total) * 100
                    : 0
                }%`,
              }}
            />
          </span>
        </div>
      )}

      {mode === "study" ? (
        <TermBudgetProvider>
         <StudyMode
  stages={stages}
  tutorial={tutorial}
  imageUrl={imageUrl}
  masterImageUrl={masterImageUrl}
  masterStatus={masterStatus}
  medium={medium}
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
  );
}