"use client";

import { useEffect, useId, useRef, useState } from "react";

type LessonOverflowMenuProps = {
  onDownloadPdf?: () => void;
  pdfDisabled?: boolean;
  onDuplicate?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
};

/**
 * Overflow menu for secondary lesson actions (Download PDF, Duplicate, Share, Delete).
 */
export function LessonOverflowMenu({
  onDownloadPdf,
  pdfDisabled = true,
  onDuplicate,
  onShare,
  onDelete,
}: LessonOverflowMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="lesson-overflow" ref={rootRef}>
      <button
        type="button"
        className="lesson-overflow-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        title="More actions"
      >
        <span aria-hidden="true">⋯</span>
        <span className="visually-hidden">More lesson actions</span>
      </button>

      {open ? (
        <ul
          id={menuId}
          className="lesson-overflow-menu"
          role="menu"
          aria-label="Lesson actions"
        >
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="lesson-overflow-item"
              disabled={pdfDisabled}
              title={pdfDisabled ? "PDF export coming soon" : undefined}
              onClick={() => {
                onDownloadPdf?.();
                setOpen(false);
              }}
            >
              Download PDF
              {pdfDisabled ? (
                <span className="lesson-overflow-soon">Soon</span>
              ) : null}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="lesson-overflow-item"
              disabled={!onDuplicate}
              onClick={() => {
                onDuplicate?.();
                setOpen(false);
              }}
            >
              Duplicate Lesson
              {!onDuplicate ? (
                <span className="lesson-overflow-soon">Soon</span>
              ) : null}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="lesson-overflow-item"
              disabled={!onShare}
              onClick={() => {
                onShare?.();
                setOpen(false);
              }}
            >
              Share
              {!onShare ? (
                <span className="lesson-overflow-soon">Soon</span>
              ) : null}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="lesson-overflow-item is-danger"
              disabled={!onDelete}
              onClick={() => {
                onDelete?.();
                setOpen(false);
              }}
            >
              Delete Lesson
              {!onDelete ? (
                <span className="lesson-overflow-soon">Soon</span>
              ) : null}
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
