"use client";

import { useRef } from "react";
import type { CompareMode } from "@/components/progression/StageComparison";

const OPTIONS: { value: CompareMode; label: string }[] = [
  { value: "both", label: "Side by side" },
  { value: "overlay", label: "Overlay" },
  { value: "target", label: "Target" },
  { value: "reference", label: "Reference" },
];

/**
 * Compact segmented control for comparison modes.
 * Keyboard: arrows move between radios; Space/Enter selects (native button).
 */
export function CompareMenu({
  value,
  onChange,
}: {
  value: CompareMode;
  onChange: (mode: CompareMode) => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const currentIndex = Math.max(0, OPTIONS.findIndex((o) => o.value === value));

  function select(mode: CompareMode) {
    onChange(mode);
    requestAnimationFrame(() => {
      rootRef.current
        ?.querySelector<HTMLButtonElement>('[aria-checked="true"]')
        ?.focus();
    });
  }

  function move(delta: number) {
    const next = (currentIndex + delta + OPTIONS.length) % OPTIONS.length;
    select(OPTIONS[next].value);
  }

  return (
    <div
      ref={rootRef}
      className="compare-segment"
      role="radiogroup"
      aria-label="Comparison view"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          move(1);
        } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          move(-1);
        } else if (e.key === "Home") {
          e.preventDefault();
          select(OPTIONS[0].value);
        } else if (e.key === "End") {
          e.preventDefault();
          select(OPTIONS[OPTIONS.length - 1].value);
        }
      }}
    >
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            tabIndex={selected ? 0 : -1}
            className={selected ? "compare-segment-btn is-active" : "compare-segment-btn"}
            onClick={() => select(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
