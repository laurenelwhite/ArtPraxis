"use client";

import { useState } from "react";
import { AppImage } from "@/components/ui/AppImage";
import { ArtworkFrame } from "@/components/progression/ArtworkFrame";
import { StudioCompareControls } from "./StudioCompareControls";
import { ReferenceColorSampler } from "./ReferenceColorSampler";
import type { StudioCompareMode, StudioReferenceSize } from "./types";

type StudioReferenceViewerProps = {
  referenceUrl: string | null | undefined;
  finalPaintingUrl: string | null | undefined;
  title?: string;
  mode: StudioCompareMode;
  onModeChange: (mode: StudioCompareMode) => void;
  size?: StudioReferenceSize;
  showControls?: boolean;
  className?: string;
};

/**
 * Canonical Reference Photo ↔ Final Painting viewer.
 * Used at dock preview, expanded panel, full page, and fullscreen.
 */
export function StudioReferenceViewer({
  referenceUrl,
  finalPaintingUrl,
  title = "Lesson",
  mode,
  onModeChange,
  size = "page",
  showControls = true,
  className,
}: StudioReferenceViewerProps) {
  const [opacity, setOpacity] = useState(0.55);
  const showOverlay = mode === "overlay";
  const showReference =
    mode === "both" || mode === "reference" || showOverlay;
  const showFinal = mode === "both" || mode === "final" || showOverlay;
  const canOverlay = Boolean(referenceUrl) && Boolean(finalPaintingUrl);

  return (
    <div
      className={[
        "studio-ref-viewer",
        `studio-ref-viewer--${size}`,
        `studio-ref-viewer--${mode}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {showControls ? (
        <div className="studio-ref-viewer-toolbar">
          <StudioCompareControls value={mode} onChange={onModeChange} />
          {showOverlay && canOverlay ? (
            <label className="studio-ref-opacity">
              <span className="studio-ref-opacity-label">Opacity</span>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={opacity}
                onChange={(e) => setOpacity(Number(e.target.value))}
                aria-label="Final painting opacity"
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className={`studio-ref-panels studio-ref-panels--${mode}`}>
        {showOverlay && canOverlay ? (
          <figure className="studio-ref-panel studio-ref-panel--overlay">
            <figcaption className="studio-ref-caption">
              Overlay · reference + final painting
            </figcaption>
            <ArtworkFrame variant="painting">
              <div className="studio-ref-overlay-stack">
                <AppImage
                  src={referenceUrl!}
                  alt={`Reference for ${title}`}
                  width={1600}
                  height={1200}
                  sizes={sizeSizes(size)}
                  className="studio-ref-img studio-ref-img--base"
                />
                <AppImage
                  src={finalPaintingUrl!}
                  alt={`Final painting for ${title}`}
                  width={1600}
                  height={1200}
                  sizes={sizeSizes(size)}
                  className="studio-ref-img studio-ref-img--top"
                  style={{ opacity }}
                />
              </div>
            </ArtworkFrame>
          </figure>
        ) : (
          <>
            {showReference ? (
              <figure className="studio-ref-panel">
                <figcaption className="studio-ref-caption">
                  Reference photo
                </figcaption>
                {referenceUrl ? (
                  <ArtworkFrame variant="reference">
                    <ReferenceColorSampler
                      src={referenceUrl}
                      alt={`Reference for ${title}`}
                      sizes={sizeSizes(size)}
                      className="studio-ref-img"
                    />
                  </ArtworkFrame>
                ) : (
                  <div className="studio-ref-empty">No reference image</div>
                )}
              </figure>
            ) : null}

            {showFinal ? (
              <figure className="studio-ref-panel">
                <figcaption className="studio-ref-caption">
                  Final painting
                </figcaption>
                {finalPaintingUrl ? (
                  <ArtworkFrame variant="painting">
                    <AppImage
                      src={finalPaintingUrl}
                      alt={`Final painting for ${title}`}
                      width={1600}
                      height={1200}
                      sizes={sizeSizes(size)}
                      className="studio-ref-img"
                    />
                  </ArtworkFrame>
                ) : (
                  <div className="studio-ref-empty">
                    Final painting not ready yet
                  </div>
                )}
              </figure>
            ) : null}
          </>
        )}
      </div>

    </div>
  );
}

function sizeSizes(size: StudioReferenceSize): string {
  switch (size) {
    case "dock":
      return "120px";
    case "panel":
      return "(max-width: 720px) 90vw, 360px";
    case "fullscreen":
      return "90vw";
    default:
      return "(max-width: 900px) 100vw, 640px";
  }
}
