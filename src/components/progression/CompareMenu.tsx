"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react";
import type { CompareMode } from "@/components/progression/StageComparison";

// View-mode options. Structured as data so "Overlay" (and future modes) can be
// added by appending one entry — no markup changes required.
const OPTIONS: { value: CompareMode; label: string }[] = [
  { value: "both", label: "Side by side" },
  { value: "target", label: "Target only" },
  { value: "reference", label: "Reference only" },
  // { value: "overlay", label: "Overlay" }, // ← future
];

// A compact, accessible dropdown that lives with the target-image area and
// controls which image(s) are shown. Closes on selection, outside click, and
// Escape; supports full keyboard navigation.
export function CompareMenu({
  value,
  onChange,
}: {
  value: CompareMode;
  onChange: (mode: CompareMode) => void;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const menuId = useId();

  const current = OPTIONS.find((o) => o.value === value) ?? OPTIONS[0];

  function focusItem(i: number) {
    const items = menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitemradio']");
    items?.[i]?.focus();
  }

  // Close on outside click / Escape while open.
  useEffect(() => {
    if (!open) return;
    function onPointer(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // On open, move focus to the currently-selected option.
  useEffect(() => {
    if (!open) return;
    const idx = Math.max(0, OPTIONS.findIndex((o) => o.value === value));
    setActiveIndex(idx);
    const raf = requestAnimationFrame(() => focusItem(idx));
    return () => cancelAnimationFrame(raf);
  }, [open, value]);

  function choose(mode: CompareMode) {
    onChange(mode);
    setOpen(false);
    triggerRef.current?.focus();
  }

  function onTriggerKeyDown(e: ReactKeyboardEvent) {
    if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setOpen(true);
    }
  }

  function onMenuKeyDown(e: ReactKeyboardEvent) {
    switch (e.key) {
      case "ArrowDown": {
        e.preventDefault();
        const next = (activeIndex + 1) % OPTIONS.length;
        setActiveIndex(next);
        focusItem(next);
        break;
      }
      case "ArrowUp": {
        e.preventDefault();
        const next = (activeIndex - 1 + OPTIONS.length) % OPTIONS.length;
        setActiveIndex(next);
        focusItem(next);
        break;
      }
      case "Home": {
        e.preventDefault();
        setActiveIndex(0);
        focusItem(0);
        break;
      }
      case "End": {
        e.preventDefault();
        const last = OPTIONS.length - 1;
        setActiveIndex(last);
        focusItem(last);
        break;
      }
      case "Enter":
      case " ": {
        e.preventDefault();
        choose(OPTIONS[activeIndex].value);
        break;
      }
      case "Tab":
        setOpen(false);
        break;
    }
  }

  return (
    <div className="compare-menu" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="compare-menu-trigger"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        aria-label={`Comparison view: ${current.label}`}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={onTriggerKeyDown}
      >
        <span className="compare-menu-value">{current.label}</span>
        <svg className="compare-menu-caret" width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
          <path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <ul
          ref={menuRef}
          id={menuId}
          role="menu"
          className="compare-menu-list"
          aria-label="Image comparison mode"
          onKeyDown={onMenuKeyDown}
        >
          {OPTIONS.map((o) => (
            <li key={o.value} role="none">
              <button
                type="button"
                role="menuitemradio"
                aria-checked={o.value === value}
                tabIndex={-1}
                className={`compare-menu-item${o.value === value ? " active" : ""}`}
                onClick={() => choose(o.value)}
              >
                {o.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
