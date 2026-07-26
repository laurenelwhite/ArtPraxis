"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import {
  AnnotatedImage,
  type OverlayMode,
} from "@/components/progression/AnnotatedImage";
import { ComparisonFrame } from "@/components/progression/ComparisonFrame";
import { StudyTools } from "@/components/progression/StudyTools";
import { AppImage } from "@/components/ui/AppImage";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";
import { resolveStageDisplayLabel } from "@/lib/stage-icons";
import { ReferenceColorSampler } from "@/components/progression/ReferenceColorSampler";

/** Visible panels / blend modes for the two-image comparison. */
export type CompareMode = "both" | "target" | "reference" | "overlay";

type SyncViewport = {
  scale: number;
  x: number;
  y: number;
};

const ZOOM_MIN = 1;
const ZOOM_MAX = 3;

function clampZoom(value: number) {
  return Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, value));
}

function SyncViewportShell({
  viewport,
  onViewportChange,
  children,
  className,
}: {
  viewport: SyncViewport;
  onViewportChange: (next: SyncViewport) => void;
  children: ReactNode;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;

    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.08 : 0.08;
      onViewportChange({
        ...viewport,
        scale: clampZoom(viewport.scale + delta),
      });
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [onViewportChange, viewport]);

  function onPointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (viewport.scale <= 1) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: viewport.x,
      originY: viewport.y,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    onViewportChange({
      ...viewport,
      x: drag.originX + (event.clientX - drag.startX),
      y: drag.originY + (event.clientY - drag.startY),
    });
  }

  function endDrag(event: ReactPointerEvent<HTMLDivElement>) {
    if (dragRef.current?.pointerId === event.pointerId) {
      dragRef.current = null;
    }
  }

  return (
    <div
      ref={rootRef}
      className={["cmp-sync-viewport", className].filter(Boolean).join(" ")}
      data-zoomed={viewport.scale > 1 ? "true" : "false"}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <div
        className="cmp-sync-stage"
        style={{
          transform: `translate(${viewport.x}px, ${viewport.y}px) scale(${viewport.scale})`,
        }}
      >
        {children}
      </div>
    </div>
  );
}

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
  const preparingFinished =
    visual.preparingFinished ||
    (isFinished && (retrying || visual.previewSource === "reference"));
  const preparingPainted =
    visual.preparingPainted ||
    (!isFinished &&
      visual.previewSource === "reference" &&
      visual.generationStatus === "generating");
  const refining =
    Boolean(visual.url) &&
    !preparingFinished &&
    !preparingPainted &&
    (retrying ||
      (ENABLE_AI_STAGE_REFINEMENT &&
        (visual.refining ||
          (visual.generationStatus === "generating" &&
            visual.previewSource === "master"))));
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
      <div
        key={visual.url}
        className={[
          "cmp-target-live",
          "cmp-target-fade",
          isSketch ? "cmp-target-live--sketch" : null,
          isFinished ? "cmp-target-live--painting" : null,
          statusLabel ? "is-refining" : null,
          preparingFinished ? "is-preparing-finished" : null,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        <AppImage
          className={
            isSketch
              ? "cmp-frame-img cmp-frame-img--sketch"
              : isFinished
                ? "cmp-frame-img cmp-frame-img--painting"
                : "cmp-frame-img"
          }
          src={visual.url}
          alt={alt}
          width={1600}
          height={1200}
          sizes="(max-width: 1100px) 100vw, 720px"
          style={{ width: "100%", height: "auto" }}
          loading="lazy"
        />
        {statusLabel && (
          <div className="cmp-refining" role="status" aria-live="polite">
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

  const generating =
    retrying ||
    visual.generationStatus === "generating" ||
    visual.generationStatus === "pending";

  return (
    <div
      className={[
        "cmp-pending",
        "cmp-stage-awaiting",
        "cmp-stage-awaiting--compact",
        isFailed ? "error" : null,
        generating ? "is-preparing" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
    >
      <div className="cmp-stage-awaiting-plate" aria-hidden="true" />
      {generating ? (
        <>
          <span className="cmp-stage-awaiting-pulse" aria-hidden="true" />
          <p className="cmp-pending-title">
            {isFinished
              ? "Arriving…"
              : isSketch
                ? "Sketch arriving…"
                : "Arriving…"}
          </p>
        </>
      ) : isFailed ? (
        <>
          <p className="cmp-pending-title">{noun} didn’t generate</p>
          <p className="cmp-pending-msg">Couldn’t generate this demonstration.</p>
        </>
      ) : (
        <p className="cmp-pending-title">
          {isSketch ? "Sketch pending" : "Demonstration pending"}
        </p>
      )}
      {!generating && visual.intent ? (
        <p className="cmp-pending-intent">{visual.intent}</p>
      ) : null}
      {onRetry && !generating && (
        <button type="button" className="secondary cmp-retry" onClick={onRetry}>
          Retry
        </button>
      )}
    </div>
  );
}

function targetVariant(stage: ProgressionStage) {
  if (stage.id === "pencil-sketch") return "sketch" as const;
  if (stage.id === "finished") return "painting" as const;
  return "default" as const;
}

// The core two-image comparison for a stage: the original reference beside a
// separate AI-generated target demonstration. Reused by Study and Paint modes.
export function StageComparison({
  stage,
  tutorial,
  medium,
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
  const isSketch = stage.id === "pencil-sketch";
  const analytic = isSketch || stage.id === "value-study";
  const defaultOverlay: OverlayMode = isSketch ? "composition" : "values";
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(defaultOverlay);
  const [blendOpacity, setBlendOpacity] = useState(0.55);
  const [viewport, setViewport] = useState<SyncViewport>({
    scale: 1,
    x: 0,
    y: 0,
  });

  const resetZoom = useCallback(() => {
    setViewport({ scale: 1, x: 0, y: 0 });
  }, []);

  const setZoom = useCallback((scale: number) => {
    setViewport((current) => ({
      ...current,
      scale: clampZoom(scale),
      ...(scale <= 1 ? { x: 0, y: 0 } : null),
    }));
  }, []);

  useEffect(() => {
    resetZoom();
    setBlendOpacity(0.55);
    setOverlayMode(defaultOverlay);
  }, [stage.id, defaultOverlay, resetZoom]);

  const referenceMedia = referenceUrl ? (
    <ReferenceColorSampler imageUrl={referenceUrl}>
      {analytic ? (
      <AnnotatedImage
        tutorial={tutorial}
        imageUrl={referenceUrl}
        defaultMode={defaultOverlay}
        mode={overlayMode}
        onModeChange={setOverlayMode}
        hideTabs
        inComparison
      />
      ) : (
      <ComparisonFrame variant="reference">
        <AppImage
          className="cmp-frame-img cmp-frame-img--reference"
          src={referenceUrl}
          alt="Reference"
          width={1600}
          height={1200}
          sizes="(max-width: 1100px) 100vw, 720px"
          style={{ width: "100%", height: "auto" }}
          loading="lazy"
        />
      </ComparisonFrame>
      )}
    </ReferenceColorSampler>
  ) : (
    <ComparisonFrame variant="reference">
      <div className="cmp-empty">No reference image</div>
    </ComparisonFrame>
  );

  const targetLabel =
    resolveStageDisplayLabel(stage.id, medium, stage.title) ||
    (isSketch ? "Drawing" : "Stage");
  const variant = targetVariant(stage);
  const showOverlay = compare === "overlay";
  const showReference =
    compare === "both" || compare === "reference" || showOverlay;
  const showTarget = compare === "both" || compare === "target" || showOverlay;
  const hasImagery = Boolean(referenceUrl) || Boolean(stage.visual.url);
  const showControls = hasImagery && Boolean(onCompareChange);
  const canOverlay =
    Boolean(referenceUrl) && Boolean(stage.visual.url) && showOverlay;

  const targetInner = (
    <TargetPanel
      stage={stage}
      onRetry={onRetry ? () => onRetry(stage.id) : undefined}
      retrying={retrying}
    />
  );

  return (
    <div className={`stage-compare studio-compare compare-${compare}`}>
      <div className={`cmp-panels cmp-panels--${compare}`}>
        {showOverlay ? (
          <figure className="cmp-panel cmp-overlay-panel">
            <figcaption className="cmp-caption">
              Overlay · Reference + {targetLabel}
            </figcaption>
            <div className="cmp-viewport cmp-viewport--overlay">
              <ComparisonFrame variant={variant}>
                {canOverlay ? (
                  <SyncViewportShell
                    viewport={viewport}
                    onViewportChange={setViewport}
                    className="cmp-overlay-stack"
                  >
                    <ReferenceColorSampler imageUrl={referenceUrl}>
                      <AppImage
                        className="cmp-frame-img cmp-frame-img--reference cmp-overlay-base"
                        src={referenceUrl}
                        alt="Reference"
                        width={1600}
                        height={1200}
                        sizes="(max-width: 1100px) 100vw, 900px"
                        style={{ width: "100%", height: "auto" }}
                        loading="lazy"
                      />
                    </ReferenceColorSampler>
                    <AppImage
                      className={[
                        "cmp-frame-img",
                        "cmp-overlay-top",
                        isSketch ? "cmp-frame-img--sketch" : null,
                        stage.id === "finished" ? "cmp-frame-img--painting" : null,
                      ]
                        .filter(Boolean)
                        .join(" ")}
                      src={stage.visual.url!}
                      alt={targetLabel}
                      width={1600}
                      height={1200}
                      sizes="(max-width: 1100px) 100vw, 900px"
                      style={{
                        width: "100%",
                        height: "auto",
                        opacity: blendOpacity,
                      }}
                      loading="lazy"
                    />
                  </SyncViewportShell>
                ) : (
                  targetInner
                )}
              </ComparisonFrame>
            </div>
          </figure>
        ) : (
          <>
            {showReference ? (
              <figure className="cmp-panel cmp-reference">
                <figcaption className="cmp-caption">Reference</figcaption>
                <div className="cmp-viewport">
                  <SyncViewportShell
                    viewport={viewport}
                    onViewportChange={setViewport}
                  >
                    {referenceMedia}
                  </SyncViewportShell>
                </div>
              </figure>
            ) : null}

            {showTarget ? (
              <figure className="cmp-panel cmp-target">
                <figcaption className="cmp-caption">{targetLabel}</figcaption>
                <div className="cmp-viewport">
                  <SyncViewportShell
                    viewport={viewport}
                    onViewportChange={setViewport}
                  >
                    <ComparisonFrame variant={variant}>
                      {targetInner}
                    </ComparisonFrame>
                  </SyncViewportShell>
                </div>
              </figure>
            ) : null}
          </>
        )}
      </div>

      <StudyTools
        compare={compare}
        onCompareChange={onCompareChange}
        showCompare={showControls}
        overlayMode={overlayMode}
        onOverlayModeChange={setOverlayMode}
        showOverlays={analytic && Boolean(referenceUrl) && !showOverlay}
        blendOpacity={blendOpacity}
        onBlendOpacityChange={setBlendOpacity}
        showBlendOpacity={showOverlay && canOverlay}
        zoom={viewport.scale}
        onZoomChange={setZoom}
        onZoomReset={resetZoom}
        showZoom={hasImagery}
      />
    </div>
  );
}
