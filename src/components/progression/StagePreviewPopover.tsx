"use client";

import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from "react";

export function StagePreviewPopover({
  open,
  title,
  imageUrl,
  fallbackLabel,
  loading,
  onClose,
  anchorRef,
  onPanelEnter,
  onPanelLeave,
}: {
  open: boolean;
  title: string;
  imageUrl: string | null;
  /** Shown when there is no image yet (e.g. Generating… / Target detail). */
  fallbackLabel?: string | null;
  loading?: boolean;
  onClose: () => void;
  anchorRef: RefObject<HTMLElement | null>;
  onPanelEnter?: () => void;
  onPanelLeave?: () => void;
}) {
  const panelId = useId();
  const panelRef = useRef<HTMLDivElement>(null);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setCoords(null);
      return;
    }
    const anchor = anchorRef.current;
    if (!anchor) return;

    function place() {
      const el = anchorRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = Math.min(180, window.innerWidth * 0.7);
      let left = rect.left + rect.width / 2;
      left = Math.max(width / 2 + 8, Math.min(left, window.innerWidth - width / 2 - 8));
      const top = Math.max(8, rect.top - 12);
      setCoords({ top, left });
    }

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }

    function onPointer(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (!target) return;
      if (panelRef.current?.contains(target)) return;
      if (anchorRef.current?.contains(target)) return;
      onClose();
    }

    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer, { passive: true });
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open, onClose, anchorRef]);

  if (!open || !coords) return null;

  return (
    <div
      ref={panelRef}
      id={panelId}
      className="stage-preview-popover"
      role="dialog"
      aria-label={`${title} preview`}
      style={{ top: coords.top, left: coords.left }}
      onMouseEnter={onPanelEnter}
      onMouseLeave={onPanelLeave}
    >
      <div className="stage-preview-popover-head">
        <p className="stage-preview-popover-title">{title}</p>
        <button
          type="button"
          className="stage-preview-popover-close"
          aria-label="Close preview"
          onClick={onClose}
        >
          ×
        </button>
      </div>

      <div className="stage-preview-popover-body">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={`${title} demonstration`}
            className="stage-preview-popover-img"
            decoding="async"
          />
        ) : loading ? (
          <div className="stage-preview-popover-fallback" role="status">
            <span className="spinner" aria-hidden="true" />
            <span>{fallbackLabel ?? "Generating…"}</span>
          </div>
        ) : (
          <div className="stage-preview-popover-fallback">
            <span>{fallbackLabel ?? "Preview unavailable"}</span>
          </div>
        )}
      </div>
    </div>
  );
}
