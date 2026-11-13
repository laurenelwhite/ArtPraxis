"use client";

import { useState } from "react";
import type { Tutorial } from "@/lib/tutorial-schema";
import { ComparisonFrame } from "@/components/progression/ComparisonFrame";
import { AppImage } from "@/components/ui/AppImage";

export type OverlayMode = "composition" | "values" | "temperature" | "none";

const regionColors: Record<string, string> = {
  "major-shape": "rgba(49,91,138,.22)",
  shadow: "rgba(23,23,23,.38)",
  midtone: "rgba(163,95,56,.22)",
  highlight: "rgba(255,246,214,.42)",
  warm: "rgba(163,95,56,.28)",
  cool: "rgba(49,91,138,.28)",
};

function showRegion(type: string, mode: OverlayMode) {
  if (mode === "composition") return type === "major-shape";
  if (mode === "values") return ["shadow", "midtone", "highlight"].includes(type);
  if (mode === "temperature") return ["warm", "cool"].includes(type);
  return false;
}

function shortLabel(label: string, max = 18): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1).replace(/\s+\S*$/, "").trim()}…`;
}

const ALL_MODES: [OverlayMode, string][] = [
  ["composition", "Shapes"],
  ["values", "Values"],
  ["temperature", "Warm / cool"],
  ["none", "Original"],
];

/**
 * Reference image with toggleable analytical overlays.
 * Overlay geometry is clipped to the displayed image bounds.
 * When `hideTabs`, overlays are still applied; controls live elsewhere (Study Tools).
 */
export function AnnotatedImage({
  tutorial,
  imageUrl,
  defaultMode = "composition",
  inComparison = false,
  hideTabs = false,
  mode: controlledMode,
  onModeChange,
}: {
  tutorial: Tutorial;
  imageUrl: string;
  defaultMode?: OverlayMode;
  inComparison?: boolean;
  hideTabs?: boolean;
  mode?: OverlayMode;
  onModeChange?: (mode: OverlayMode) => void;
}) {
  const [internalMode, setInternalMode] = useState<OverlayMode>(defaultMode);
  const overlayMode = controlledMode ?? internalMode;
  const setOverlayMode = onModeChange ?? setInternalMode;
  const { visualGuides } = tutorial;

  const overlayTabs =
    hideTabs ? null : (
      <div className="overlay-tabs" role="group" aria-label="Image overlays">
        {ALL_MODES.map(([value, label]) => (
          <button
            key={value}
            type="button"
            aria-pressed={overlayMode === value}
            className={overlayMode === value ? "overlay-tab active" : "overlay-tab"}
            onClick={() => setOverlayMode(value)}
          >
            {label}
          </button>
        ))}
      </div>
    );

  const imageBlock = (
    <div className="annotated-image annotated-image--museum">
      <div className="annotated-image-media">
        <AppImage
          src={imageUrl}
          alt="Reference"
          width={1600}
          height={1200}
          sizes="(max-width: 1100px) 100vw, 720px"
          className="annotated-image-photo cmp-frame-img--reference"
          style={{ width: "100%", height: "auto" }}
        />
        {overlayMode !== "none" && (
          <svg
            className="analysis-overlay"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            aria-hidden="true"
          >
            {visualGuides.regions
              .filter((r) => showRegion(r.type, overlayMode))
              .map((r, i) => (
                <g key={i}>
                  <rect
                    x={r.x}
                    y={r.y}
                    width={r.width}
                    height={r.height}
                    rx="1.2"
                    fill={regionColors[r.type]}
                    stroke="rgba(255,255,255,0.55)"
                    strokeWidth=".35"
                    vectorEffect="non-scaling-stroke"
                  />
                  <text
                    x={r.x + Math.min(r.width * 0.5, 1.8)}
                    y={r.y + Math.min(r.height * 0.45, 3.6)}
                    className="overlay-label"
                  >
                    {shortLabel(r.label)}
                  </text>
                </g>
              ))}
            {overlayMode === "composition" && (
              <>
                <circle
                  cx={visualGuides.focalPoint.x}
                  cy={visualGuides.focalPoint.y}
                  r="2.4"
                  fill="none"
                  stroke="rgba(255,255,255,0.85)"
                  strokeWidth=".6"
                  vectorEffect="non-scaling-stroke"
                />
                <text
                  x={Math.min(visualGuides.focalPoint.x + 3.2, 88)}
                  y={visualGuides.focalPoint.y + 0.8}
                  className="overlay-label"
                >
                  {shortLabel(visualGuides.focalPoint.label, 16)}
                </text>
              </>
            )}
          </svg>
        )}
      </div>
    </div>
  );

  if (inComparison) {
    return (
      <div className="annotated annotated-compare">
        <ComparisonFrame variant="reference">{imageBlock}</ComparisonFrame>
        {overlayTabs}
      </div>
    );
  }

  return (
    <div className="annotated">
      {overlayTabs}
      <ComparisonFrame variant="reference">{imageBlock}</ComparisonFrame>
    </div>
  );
}
