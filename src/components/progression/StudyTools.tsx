"use client";

import type { ReactNode } from "react";
import { CompareMenu } from "@/components/progression/CompareMenu";
import type { CompareMode } from "@/components/progression/StageComparison";
import type { OverlayMode } from "@/components/progression/AnnotatedImage";

const OVERLAY_OPTIONS: { value: OverlayMode; label: string }[] = [
  { value: "composition", label: "Shapes" },
  { value: "values", label: "Values" },
  { value: "temperature", label: "Warm / cool" },
  { value: "none", label: "Original" },
];

/**
 * Compact progressive disclosure for compare, opacity, zoom, and overlays.
 * Collapsed by default — dense control rows, no duplicate section labels.
 */
export function StudyTools({
  compare,
  onCompareChange,
  showCompare,
  overlayMode,
  onOverlayModeChange,
  showOverlays,
  blendOpacity,
  onBlendOpacityChange,
  showBlendOpacity,
  zoom,
  onZoomChange,
  onZoomReset,
  showZoom,
  extra,
}: {
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  showCompare?: boolean;
  overlayMode?: OverlayMode;
  onOverlayModeChange?: (mode: OverlayMode) => void;
  showOverlays?: boolean;
  blendOpacity?: number;
  onBlendOpacityChange?: (value: number) => void;
  showBlendOpacity?: boolean;
  zoom?: number;
  onZoomChange?: (value: number) => void;
  onZoomReset?: () => void;
  showZoom?: boolean;
  extra?: ReactNode;
}) {
  const hasCompare = Boolean(showCompare && onCompareChange);
  const hasOverlays = Boolean(
    showOverlays && overlayMode !== undefined && onOverlayModeChange,
  );
  const hasBlend = Boolean(
    showBlendOpacity &&
      blendOpacity !== undefined &&
      onBlendOpacityChange,
  );
  const hasZoom = Boolean(showZoom && zoom !== undefined && onZoomChange);

  if (!hasCompare && !hasOverlays && !hasBlend && !hasZoom && !extra) {
    return null;
  }

  return (
    <details className="study-tools">
      <summary className="study-tools-summary">Tools</summary>
      <div className="study-tools-body">
        {hasCompare && onCompareChange ? (
          <CompareMenu value={compare} onChange={onCompareChange} />
        ) : null}

        {(hasBlend || hasZoom) && (
          <div className="study-tools-sliders">
            {hasBlend && blendOpacity !== undefined && onBlendOpacityChange ? (
              <label className="study-tools-slider">
                <span className="study-tools-slider-meta">
                  <span className="study-tools-slider-name">Opacity</span>
                  <span className="study-tools-slider-value" aria-hidden="true">
                    {Math.round(blendOpacity * 100)}%
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={Math.round(blendOpacity * 100)}
                  onChange={(e) =>
                    onBlendOpacityChange(Number(e.target.value) / 100)
                  }
                  aria-label="Target opacity"
                />
              </label>
            ) : null}

            {hasZoom && zoom !== undefined && onZoomChange ? (
              <div className="study-tools-zoom-row">
                <label className="study-tools-slider">
                  <span className="study-tools-slider-meta">
                    <span className="study-tools-slider-name">Zoom</span>
                    <span className="study-tools-slider-value" aria-hidden="true">
                      {Math.round(zoom * 100)}%
                    </span>
                  </span>
                  <input
                    type="range"
                    min={100}
                    max={300}
                    step={5}
                    value={Math.round(zoom * 100)}
                    onChange={(e) => onZoomChange(Number(e.target.value) / 100)}
                    aria-label="Zoom"
                  />
                </label>
                {onZoomReset && zoom !== 1 ? (
                  <button
                    type="button"
                    className="study-tools-zoom-reset"
                    onClick={onZoomReset}
                  >
                    Reset
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>
        )}

        {hasOverlays && overlayMode !== undefined && onOverlayModeChange ? (
          <div className="overlay-tabs" role="group" aria-label="Image overlays">
            {OVERLAY_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                aria-pressed={overlayMode === value}
                className={
                  overlayMode === value ? "overlay-tab active" : "overlay-tab"
                }
                onClick={() => onOverlayModeChange(value)}
              >
                {label}
              </button>
            ))}
          </div>
        ) : null}

        {extra}
      </div>
    </details>
  );
}
