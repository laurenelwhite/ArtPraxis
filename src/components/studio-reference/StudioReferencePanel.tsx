"use client";

import { useEffect, useId, useRef } from "react";
import { StudioReferenceViewer } from "./StudioReferenceViewer";
import { useStudioReference } from "./StudioReferenceContext";

/**
 * Expanded peek panel — quick comparison without leaving the current lesson tab.
 */
export function StudioReferencePanel() {
  const {
    panelOpen,
    closePanel,
    openFullscreen,
    referenceUrl,
    finalPaintingUrl,
    title,
    compareMode,
    setCompareMode,
  } = useStudioReference();
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!panelOpen) return;
    closeRef.current?.focus();
  }, [panelOpen]);

  if (!panelOpen) return null;

  return (
    <div className="studio-ref-panel-root" role="presentation">
      <button
        type="button"
        className="studio-ref-panel-backdrop"
        aria-label="Close comparison panel"
        onClick={closePanel}
      />
      <div
        className="studio-ref-panel-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="studio-ref-panel-head">
          <div>
            <p className="eyebrow">Studio Reference</p>
            <h2 id={titleId} className="studio-ref-panel-title">
              Compare
            </h2>
          </div>
          <div className="studio-ref-panel-head-actions">
            <button
              type="button"
              className="btn-ghost"
              onClick={openFullscreen}
            >
              Full screen
            </button>
            <button
              ref={closeRef}
              type="button"
              className="studio-ref-panel-close"
              onClick={closePanel}
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </header>

        <StudioReferenceViewer
          referenceUrl={referenceUrl}
          finalPaintingUrl={finalPaintingUrl}
          title={title}
          mode={compareMode}
          onModeChange={setCompareMode}
          size="panel"
        />
      </div>
    </div>
  );
}
