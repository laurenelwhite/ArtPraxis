"use client";

import { useState } from "react";
import type { Tutorial } from "@/lib/tutorial-schema";
import { ComparisonFrame } from "@/components/progression/ComparisonFrame";

export type OverlayMode = "composition" | "values" | "temperature" | "none";

const regionColors: Record<string, string> = {
  "major-shape": "rgba(49,91,138,.24)", shadow: "rgba(23,23,23,.42)",
  midtone: "rgba(163,95,56,.24)", highlight: "rgba(255,246,214,.5)",
  warm: "rgba(163,95,56,.3)", cool: "rgba(49,91,138,.3)",
};

function showRegion(type: string, mode: OverlayMode) {
  if (mode === "composition") return type === "major-shape";
  if (mode === "values") return ["shadow", "midtone", "highlight"].includes(type);
  if (mode === "temperature") return ["warm", "cool"].includes(type);
  return false;
}

const ALL_MODES: [OverlayMode, string][] = [
  ["composition", "Shapes"],
  ["values", "Values"],
  ["temperature", "Warm / cool"],
  ["none", "Original"],
];

// Reference image with toggleable analytical overlays. Shared by the Paint Mode
// workbench and available (independently) inside the Study Mode atelier.
export function AnnotatedImage({
  tutorial,
  imageUrl,
  defaultMode = "composition",
  inComparison = false,
}: {
  tutorial: Tutorial;
  imageUrl: string;
  defaultMode?: OverlayMode;
  inComparison?: boolean;
}) {
  const [overlayMode, setOverlayMode] = useState<OverlayMode>(defaultMode);
  const { visualGuides } = tutorial;

  const overlayTabs = (
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
    <div className="annotated-image">
      <img src={imageUrl} alt="Reference" />
      {overlayMode !== "none" && (
        <svg className="analysis-overlay" viewBox="0 0 100 100" preserveAspectRatio="none">
          {visualGuides.regions.filter((r) => showRegion(r.type, overlayMode)).map((r, i) => (
            <g key={i}>
              <rect x={r.x} y={r.y} width={r.width} height={r.height} rx="1.5" fill={regionColors[r.type]} stroke="white" strokeWidth=".45" vectorEffect="non-scaling-stroke" />
              <text x={r.x + 1.5} y={r.y + 4} className="overlay-label">{r.label}</text>
            </g>
          ))}
          {overlayMode === "composition" && (
            <>
              <circle cx={visualGuides.focalPoint.x} cy={visualGuides.focalPoint.y} r="3.2" fill="none" stroke="white" strokeWidth=".75" vectorEffect="non-scaling-stroke" />
              <text x={visualGuides.focalPoint.x + 4} y={visualGuides.focalPoint.y} className="overlay-label">{visualGuides.focalPoint.label}</text>
            </>
          )}
        </svg>
      )}
    </div>
  );

  if (inComparison) {
    return (
      <div className="annotated annotated-compare">
        {overlayTabs}
        <ComparisonFrame>{imageBlock}</ComparisonFrame>
      </div>
    );
  }

  return (
    <div className="annotated">
      {overlayTabs}
      {imageBlock}
    </div>
  );
}
