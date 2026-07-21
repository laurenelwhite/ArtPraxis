"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { AnnotatedImage } from "@/components/progression/AnnotatedImage";
import { CompareMenu } from "@/components/progression/CompareMenu";
import { ComparisonFrame } from "@/components/progression/ComparisonFrame";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";

// Which panels are visible in the two-image comparison. Add "overlay" here (and
// one entry in CompareMenu) to introduce an overlay view later.
export type CompareMode = "both" | "target" | "reference";

function TargetPanel({
  stage,
  onRetry,
  retrying,
}: {
  stage: ProgressionStage;
  onRetry?: () => void;
  retrying?: boolean;
}) {
  const { visual } = stage;
  const isSketch = stage.id === "pencil-sketch";
  const isFinished = stage.id === "finished";
  const noun = isSketch ? "Pencil sketch" : "Target image";
  const preparingFinished = visual.preparingFinished || (isFinished && (retrying || visual.previewSource === "reference"));
  const preparingPainted = visual.preparingPainted || (!isFinished && visual.previewSource === "reference" && visual.generationStatus === "generating");
  // "Refining…" for auto refine (flag on) or an in-flight manual single-stage retry.
  const refining =
    Boolean(visual.url) &&
    !preparingFinished &&
    !preparingPainted &&
    (retrying ||
      (ENABLE_AI_STAGE_REFINEMENT &&
        (visual.refining || (visual.generationStatus === "generating" && visual.previewSource === "master"))));
  const isFailed = visual.generationStatus === "failed";
  const statusLabel = preparingFinished
    ? "Preparing finished painting…"
    : preparingPainted
      ? "Preparing painted targets…"
      : refining
        ? "Refining target…"
        : null;

  if (visual.url) {
    const alt = preparingFinished
      ? `${stage.title} — reference while the finished painting is prepared`
      : isSketch
        ? `${stage.title} — pencil sketch target for this lesson`
        : `${stage.title} — target for this stage`;
    return (
      <div className={`cmp-target-live${statusLabel ? " is-refining" : ""}${preparingFinished ? " is-preparing-finished" : ""}`}>
        <img className="cmp-frame-img" src={visual.url} alt={alt} loading="lazy" />
        {statusLabel && (
          <div className="cmp-refining" role="status" aria-live="polite">
            <span className="spinner cmp-refining-spinner" aria-hidden="true" />
            <span>{statusLabel}</span>
          </div>
        )}
        {isFailed && !statusLabel && (
          <div className="cmp-refining cmp-refining-failed" role="status">
            <span>Couldn’t refine this target.</span>
            {onRetry && (
              <button type="button" className="secondary cmp-retry" onClick={onRetry}>
                Retry
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  const generating = retrying || visual.generationStatus === "generating" || visual.generationStatus === "pending";

  return (
    <div className={`cmp-pending${isFailed ? " error" : ""}`} role="status" aria-live="polite">
      {generating ? (
        <>
          <span className="spinner cmp-spinner" aria-hidden="true" />
          <p className="cmp-pending-title">
            {isFinished ? "Preparing finished painting…" : "Preparing painted targets…"}
          </p>
        </>
      ) : isFailed ? (
        <>
          <p className="cmp-pending-title">{noun} didn’t generate</p>
          <p className="cmp-pending-msg">This demonstration couldn’t be generated. Please retry.</p>
        </>
      ) : (
        <p className="cmp-pending-title">{isSketch ? "Pencil sketch not generated yet" : "Target demonstration not generated yet"}</p>
      )}
      <p className="cmp-pending-intent">{visual.intent}</p>
      {onRetry && !generating && (
        <button type="button" className="secondary cmp-retry" onClick={onRetry}>
          Retry generation
        </button>
      )}
    </div>
  );
}

// The core two-image comparison for a stage: the original reference beside a
// separate AI-generated target demonstration. Reused by Study and Paint modes.
export function StageComparison({
  stage,
  tutorial,
  referenceUrl,
  compare,
  onCompareChange,
  onRetry,
  retrying,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  referenceUrl: string;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  onRetry?: (stageId: ProgressionStage["id"]) => void;
  retrying?: boolean;
}) {
  // The pencil-sketch & value stages keep the analytical overlays on the
  // reference — the sketch stage is where the student reads composition to
  // transfer it, the value stage where they read the value masses.
  const isSketch = stage.id === "pencil-sketch";
  const analytic = isSketch || stage.id === "value-study";

  const referenceMedia = referenceUrl ? (
    analytic ? (
      <AnnotatedImage
        tutorial={tutorial}
        imageUrl={referenceUrl}
        defaultMode={isSketch ? "composition" : "values"}
        inComparison
      />
    ) : (
      <ComparisonFrame>
        <img
          className="cmp-frame-img"
          src={referenceUrl}
          alt="Reference"
          loading="lazy"
        />
      </ComparisonFrame>
    )
  ) : (
    <ComparisonFrame>
      <div className="cmp-empty">No reference image</div>
    </ComparisonFrame>
  );

  const targetTag = isSketch ? "Pencil sketch target" : "Target for this stage";
  const targetSub = isSketch
    ? "The drawing you need before you paint"
    : "What your painting may look like now";
  const referenceSub = isSketch ? "What you’re transferring" : "What you’re observing";

  // Only offer the view-mode control when there is imagery to compare.
  const hasImagery = Boolean(referenceUrl) || Boolean(stage.visual.url);

  return (
    <div className={`stage-compare compare-${compare}`}>
      {hasImagery && onCompareChange && (
        <div className="cmp-controls">
          <CompareMenu value={compare} onChange={onCompareChange} />
        </div>
      )}

      <figure className="cmp-panel cmp-reference">
        <figcaption className="cmp-label">
          <span className="cmp-tag observe">Reference</span>
          <span className="cmp-sub">{referenceSub}</span>
        </figcaption>
        {referenceMedia}
      </figure>

      <figure className="cmp-panel cmp-target">
        <figcaption className="cmp-label">
          <span className="cmp-tag action">{targetTag}</span>
          <span className="cmp-sub">{targetSub}</span>
        </figcaption>
        {analytic && compare === "both" && (
          <div className="cmp-overlay-tools-spacer" aria-hidden="true" />
        )}
        <ComparisonFrame>
          <TargetPanel
            stage={stage}
            onRetry={onRetry ? () => onRetry(stage.id) : undefined}
            retrying={retrying}
          />
        </ComparisonFrame>
      </figure>
    </div>
  );
}
