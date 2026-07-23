"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { AnnotatedImage } from "@/components/progression/AnnotatedImage";
import { CompareMenu } from "@/components/progression/CompareMenu";
import { ComparisonFrame } from "@/components/progression/ComparisonFrame";
import { AppImage } from "@/components/ui/AppImage";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";

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
        <AppImage
          className="cmp-frame-img"
          src={visual.url}
          alt={alt}
          width={1600}
          height={1200}
          sizes="(max-width: 1100px) 100vw, 560px"
          style={{ width: "100%", height: "auto" }}
          loading="lazy"
        />
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
        <AppImage
          className="cmp-frame-img"
          src={referenceUrl}
          alt="Reference"
          width={1600}
          height={1200}
          sizes="(max-width: 1100px) 100vw, 560px"
          style={{ width: "100%", height: "auto" }}
          loading="lazy"
        />
      </ComparisonFrame>
    )
  ) : (
    <ComparisonFrame>
      <div className="cmp-empty">No reference image</div>
    </ComparisonFrame>
  );

  const targetLabel = STAGE_PROCESS_LABEL[stage.id] || (isSketch ? "Sketch" : "Stage");
  const showReference = compare === "both" || compare === "reference";
  const showTarget = compare === "both" || compare === "target";

  // Only offer the view-mode control when there is imagery to compare.
  const hasImagery = Boolean(referenceUrl) || Boolean(stage.visual.url);
  const showControls = hasImagery && Boolean(onCompareChange);

  return (
    <div className={`stage-compare studio-compare compare-${compare}`}>
      <div className="cmp-shell-toolbar" role="toolbar" aria-label="Comparison tools">
        <p className="cmp-shell-kicker">Compare</p>
        {showControls && onCompareChange ? (
          <CompareMenu value={compare} onChange={onCompareChange} />
        ) : null}
      </div>

      <div className={`cmp-panels cmp-panels--${compare}`}>
        {showReference ? (
          <figure className="cmp-panel cmp-reference">
            <figcaption className="cmp-caption">Reference</figcaption>
            <div className="cmp-viewport">{referenceMedia}</div>
          </figure>
        ) : null}

        {showTarget ? (
          <figure className="cmp-panel cmp-target">
            <figcaption className="cmp-caption">{targetLabel}</figcaption>
            <div className="cmp-viewport">
              <ComparisonFrame>
                <TargetPanel
                  stage={stage}
                  onRetry={onRetry ? () => onRetry(stage.id) : undefined}
                  retrying={retrying}
                />
              </ComparisonFrame>
            </div>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
