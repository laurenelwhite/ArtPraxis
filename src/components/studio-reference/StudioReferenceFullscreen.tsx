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
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!fullscreenOpen) return;
    returnFocusRef.current = document.activeElement as HTMLElement | null;
    const frame = requestAnimationFrame(() => closeRef.current?.focus());
    return () => {
      cancelAnimationFrame(frame);
      returnFocusRef.current?.focus();
    };
  }, [fullscreenOpen]);

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

  if (!fullscreenOpen) return null;

  return (
    <div
      ref={dialogRef}
      className="studio-ref-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onKeyDown={containFocus}
    >
      <header className="studio-ref-fullscreen-head">
        <div>
          <p className="studio-ref-kicker">Studio Reference</p>
          <h2 id={titleId} className="studio-ref-fullscreen-title">
            {title}
          </h2>
        </div>
        <button
          ref={closeRef}
          type="button"
          className="studio-ref-fullscreen-close"
          onClick={closeFullscreen}
          aria-label="Close fullscreen comparison"
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
