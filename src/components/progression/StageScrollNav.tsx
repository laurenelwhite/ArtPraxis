"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { ProgressionStage } from "@/lib/progression";
import type { Medium } from "@/lib/tutorial-schema";
import {
  resolveStageDisplayLabel,
  resolveStageShortLabel,
} from "@/lib/stage-icons";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Sticky stage indicator for the continuous Study journey.
 * Desktop: six compact equal markers within page width.
 * Mobile: horizontally scrollable rail with active centering.
 */
export function StageScrollNav({
  stages,
  active,
  visitedMax,
  onSelect,
  medium,
  className,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  medium: Medium;
  className?: string;
}) {
  const railRef = useRef<HTMLOListElement>(null);
  const safeActive = Math.max(0, Math.min(active, Math.max(stages.length - 1, 0)));

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLElement>(`[data-stage-index="${safeActive}"]`);
    if (!btn) return;
    const reduced = prefersReducedMotion();
    // Center active item on narrow rails; desktop grid needs no scroll.
    if (rail.scrollWidth <= rail.clientWidth + 2) return;
    btn.scrollIntoView({
      behavior: reduced ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [safeActive]);

  if (stages.length === 0) return null;

  function onKeyDown(e: KeyboardEvent<HTMLOListElement>) {
    if (stages.length === 0) return;
    let next = safeActive;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = Math.min(stages.length - 1, safeActive + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = Math.max(0, safeActive - 1);
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = stages.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onSelect(next);
    const btn = railRef.current?.querySelector<HTMLButtonElement>(
      `[data-stage-index="${next}"]`,
    );
    btn?.focus();
  }

  return (
    <nav
      className={["stage-scroll-nav", className].filter(Boolean).join(" ")}
      aria-label="Lesson stages"
    >
      <ol
        ref={railRef}
        className="stage-scroll-nav-list"
        onKeyDown={onKeyDown}
      >
        {stages.map((stage, index) => {
          const full = resolveStageDisplayLabel(stage.id, medium, stage.title);
          const short = resolveStageShortLabel(stage.id, medium, stage.title);
          const isActive = index === safeActive;
          const visited = index <= visitedMax;
          return (
            <li key={stage.id} className="stage-scroll-nav-item">
              <button
                type="button"
                data-stage-index={index}
                className={[
                  "stage-scroll-nav-btn",
                  isActive ? "is-active" : null,
                  visited && !isActive ? "is-visited" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "true" : undefined}
                aria-label={`Stage ${stage.index}: ${full}`}
                title={full}
                onClick={() => onSelect(index)}
              >
                <span className="stage-scroll-nav-index" aria-hidden="true">
                  {stage.index}
                </span>
                <span className="stage-scroll-nav-label stage-scroll-nav-label--full">
                  {short}
                </span>
                <span className="stage-scroll-nav-label stage-scroll-nav-label--short">
                  {short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
