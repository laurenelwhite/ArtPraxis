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
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!panelOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      returnFocusRef.current?.focus();
    };
  }, [panelOpen]);

  function containFocus(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Tab") return;
    const focusable = Array.from(
      dialogRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? [],
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  if (!panelOpen) return null;

  return (
    <div className="studio-ref-panel-root" role="presentation">
      <div
        className="studio-ref-panel-backdrop"
        aria-hidden="true"
        onClick={closePanel}
      />
      <div
        ref={dialogRef}
        className="studio-ref-panel-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onKeyDown={containFocus}
      >
        <header className="studio-ref-panel-head">
          <div>
            <p className="studio-ref-kicker">Studio Reference</p>
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
