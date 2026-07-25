"use client";

import { useRef } from "react";
import { STUDIO_COMPARE_OPTIONS, type StudioCompareMode } from "./types";

/**
 * Segmented control for Studio Reference comparison modes.
 * Keyboard: arrows move between radios; Space/Enter selects.
 */
export function StudioCompareControls({
  value,
  onChange,
  idPrefix = "studio-compare",
}: {
  value: StudioCompareMode;
  onChange: (mode: StudioCompareMode) => void;
  idPrefix?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(
    0,
    STUDIO_COMPARE_OPTIONS.findIndex((o) => o.value === value),
  );

  function select(mode: StudioCompareMode) {
    onChange(mode);
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ?.focus();
    });
  }

  function move(delta: number) {
    const next =
      (currentIndex + delta + STUDIO_COMPARE_OPTIONS.length) %
      STUDIO_COMPARE_OPTIONS.length;
    select(STUDIO_COMPARE_OPTIONS[next].value);
  }

  return (
    <div
      ref={rootRef}
      className="studio-ref-compare"
      role="radiogroup"
      aria-label="Comparison view"
      id={idPrefix}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          select(STUDIO_COMPARE_OPTIONS[0].value);
        } else if (e.key === "End") {
          e.preventDefault();
          select(STUDIO_COMPARE_OPTIONS[STUDIO_COMPARE_OPTIONS.length - 1].value);
        }
      }}
    >
      {STUDIO_COMPARE_OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={
              selected
                ? "studio-ref-compare-btn is-active"
                : "studio-ref-compare-btn"
            }
            onClick={() => select(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
