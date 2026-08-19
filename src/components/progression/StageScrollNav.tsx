"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import type { LessonDocumentStep } from "@/lib/lesson-document";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Quiet horizontal lesson map for the continuous document.
 * Semantic nav with scroll-to-section buttons — not an ARIA tab widget.
 */
export function StageScrollNav({
  steps,
  active,
  visitedMax,
  onSelect,
  className,
}: {
  steps: LessonDocumentStep[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  className?: string;
  /** @deprecated Unused — retained for call-site compatibility during migration. */
  stages?: unknown;
  medium?: unknown;
}) {
  const railRef = useRef<HTMLOListElement>(null);
  const safeActive = Math.max(0, Math.min(active, Math.max(steps.length - 1, 0)));

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLElement>(`[data-step-index="${safeActive}"]`);
    if (!btn) return;
    if (rail.scrollWidth <= rail.clientWidth + 2) return;
    btn.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [safeActive]);

  if (steps.length === 0) return null;

  function onKeyDown(e: KeyboardEvent<HTMLOListElement>) {
    if (steps.length === 0) return;
    let next = safeActive;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      next = Math.min(steps.length - 1, safeActive + 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      next = Math.max(0, safeActive - 1);
    } else if (e.key === "Home") {
      next = 0;
    } else if (e.key === "End") {
      next = steps.length - 1;
    } else {
      return;
    }
    e.preventDefault();
    onSelect(next);
    const btn = railRef.current?.querySelector<HTMLButtonElement>(
      `[data-step-index="${next}"]`,
    );
    btn?.focus();
  }

  return (
    <nav
      className={["stage-scroll-nav", "lesson-step-map", className]
        .filter(Boolean)
        .join(" ")}
      aria-label="Lesson steps"
    >
      <ol
        ref={railRef}
        className="stage-scroll-nav-list lesson-step-map-list"
        onKeyDown={onKeyDown}
      >
        {steps.map((step, index) => {
          const isActive = index === safeActive;
          const visited = index <= visitedMax;
          return (
            <li key={step.id} className="stage-scroll-nav-item lesson-step-map-item">
              {index > 0 ? (
                <span className="lesson-step-map-sep" aria-hidden="true">
                  ·
                </span>
              ) : null}
              <button
                type="button"
                data-step-index={index}
                data-stage-index={index}
                className={[
                  "stage-scroll-nav-btn",
                  "lesson-step-map-btn",
                  isActive ? "is-active" : null,
                  visited && !isActive ? "is-visited" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "step" : undefined}
                aria-label={`Step ${step.number}: ${step.label}`}
                title={step.label}
                onClick={() => onSelect(index)}
              >
                <span className="stage-scroll-nav-label stage-scroll-nav-label--full" aria-hidden="true">
                  {step.label}
                </span>
                <span className="stage-scroll-nav-label stage-scroll-nav-label--short" aria-hidden="true">
                  {step.shortLabel}
                </span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
