"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import type { ProgressionStage } from "@/lib/progression";
import {
  STAGE_STEPPER_LABEL,
  iconKindForStage,
  usesMasterThumbnail,
} from "@/lib/stage-icons";
import {
  RefineBrushOverlay,
  StageIconArtwork,
} from "@/components/progression/StageIconArtwork";
import { StagePreviewPopover } from "@/components/progression/StagePreviewPopover";

export function StageProgressIcon({
  stage,
  isActive,
  masterImageUrl,
  previewOpen,
  onOpenPreview,
  onClosePreview,
  onSelect,
}: {
  stage: ProgressionStage;
  isActive: boolean;
  masterImageUrl: string | null | undefined;
  previewOpen: boolean;
  onOpenPreview: () => void;
  onClosePreview: () => void;
  onSelect: () => void;
}) {
  const label = STAGE_STEPPER_LABEL[stage.id];
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [masterFailed, setMasterFailed] = useState(false);
  const [masterReady, setMasterReady] = useState(false);
  const [hoverPreview, setHoverPreview] = useState(false);
  const hoverCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHoverClose = useCallback(() => {
    if (hoverCloseTimer.current) {
      clearTimeout(hoverCloseTimer.current);
      hoverCloseTimer.current = null;
    }
  }, []);

  const scheduleHoverClose = useCallback(() => {
    clearHoverClose();
    hoverCloseTimer.current = setTimeout(() => setHoverPreview(false), 180);
  }, [clearHoverClose]);

  useEffect(() => () => clearHoverClose(), [clearHoverClose]);

  const masterUrl = masterImageUrl ?? null;
  const showMasterThumb =
    usesMasterThumbnail(stage.id) && Boolean(masterUrl) && !masterFailed;

  useEffect(() => {
    setMasterFailed(false);
    setMasterReady(false);
  }, [masterUrl]);

  const stageUrl = stage.visual.url;
  const generating =
    !stageUrl &&
    (stage.visual.generationStatus === "pending" ||
      stage.visual.generationStatus === "generating" ||
      stage.visual.preparingPainted ||
      stage.visual.preparingFinished ||
      stage.visual.refining);

  const previewImageUrl = (() => {
    if (stage.id === "finished") return masterUrl;
    if (stage.id === "refinement") {
      if (stageUrl) return stageUrl;
      return masterUrl;
    }
    return stageUrl;
  })();

  const previewFallbackLabel = (() => {
    if (stage.id === "finished" && !masterUrl) return "Preparing target…";
    if (stage.id === "refinement" && !stageUrl && masterUrl) return "Target detail";
    if (stage.id === "refinement" && !stageUrl && !masterUrl) return "Preparing…";
    if (generating) return "Generating…";
    return "Preview unavailable";
  })();

  const previewLoading =
    !previewImageUrl &&
    (generating ||
      (usesMasterThumbnail(stage.id) && !masterUrl) ||
      (stage.id === "refinement" && !stageUrl));

  const revealPreview = useCallback(() => {
    onSelect();
    onOpenPreview();
  }, [onSelect, onOpenPreview]);

  function onKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      revealPreview();
    }
  }

  // Desktop hover: lightweight popover without replacing click.
  const showPopover = previewOpen || hoverPreview;

  return (
    <div
      className="stage-progress-item"
      onMouseEnter={() => {
        if (window.matchMedia("(hover: hover)").matches) {
          clearHoverClose();
          setHoverPreview(true);
        }
      }}
      onMouseLeave={() => {
        if (window.matchMedia("(hover: hover)").matches) scheduleHoverClose();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className={[
          "stage-progress-icon",
          isActive ? "is-active" : "",
          showMasterThumb && masterReady ? "has-photo" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        aria-label={`Preview ${label}`}
        aria-current={isActive ? "step" : undefined}
        aria-expanded={previewOpen}
        onClick={revealPreview}
        onKeyDown={onKeyDown}
      >
        {showMasterThumb ? (
          <span className="stage-progress-photo-wrap">
            {!masterReady && (
              <StageIconArtwork
                kind={iconKindForStage(stage.id)}
                className="stage-progress-artwork stage-progress-artwork-under"
              />
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={masterUrl!}
              alt=""
              className={[
                "stage-progress-photo",
                masterReady ? "is-loaded" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              decoding="async"
              onLoad={() => setMasterReady(true)}
              onError={() => {
                setMasterFailed(true);
                setMasterReady(false);
              }}
            />
            {stage.id === "refinement" && masterReady && (
              <span className="stage-progress-refine-overlay" aria-hidden="true">
                <RefineBrushOverlay />
              </span>
            )}
          </span>
        ) : (
          <StageIconArtwork
            kind={iconKindForStage(stage.id)}
            className="stage-progress-artwork"
          />
        )}
      </button>

      <span className="stage-progress-caption" aria-hidden="true">
        {label}
      </span>

      <StagePreviewPopover
        open={showPopover}
        title={label}
        imageUrl={previewImageUrl}
        fallbackLabel={previewFallbackLabel}
        loading={previewLoading}
        onClose={() => {
          setHoverPreview(false);
          onClosePreview();
        }}
        anchorRef={buttonRef}
        onPanelEnter={() => {
          clearHoverClose();
          setHoverPreview(true);
        }}
        onPanelLeave={scheduleHoverClose}
      />
    </div>
  );
}
