"use client";

import { useEffect, useId, useRef } from "react";
import { StudioReferenceViewer } from "./StudioReferenceViewer";
import { useStudioReference } from "./StudioReferenceContext";

/**
 * Full-screen deep comparison: Reference Photo ↔ Final Painting
 * with side-by-side, overlay, and single-image modes.
 */
export function StudioReferenceFullscreen() {
  const {
    fullscreenOpen,
    closeFullscreen,
    referenceUrl,
    finalPaintingUrl,
    title,
    compareMode,
    setCompareMode,
  } = useStudioReference();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!fullscreenOpen) return;
    closeRef.current?.focus();
  }, [fullscreenOpen]);

  if (!fullscreenOpen) return null;

  return (
    <div
      className="studio-ref-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <header className="studio-ref-fullscreen-head">
        <div>
          <p className="eyebrow">Studio Reference</p>
          <h2 id={titleId} className="studio-ref-fullscreen-title">
            {title}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="studio-ref-fullscreen-close"
          onClick={closeFullscreen}
        >
          Close
        </button>
      </header>

      <div className="studio-ref-fullscreen-body">
        <StudioReferenceViewer
          referenceUrl={referenceUrl}
          finalPaintingUrl={finalPaintingUrl}
          title={title}
          mode={compareMode}
          onModeChange={setCompareMode}
          size="fullscreen"
        />
      </div>
    </div>
  );
}
