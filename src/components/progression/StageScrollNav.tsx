"use client";

import { useEffect, useRef } from "react";
import type { ProgressionStage } from "@/lib/progression";
import {
  STAGE_PROCESS_LABEL,
  STAGE_PROCESS_SHORT,
} from "@/lib/stage-icons";

/**
 * Compact sticky stage navigator for continuous Study scrolling.
 * Desktop: abbreviated rail of all stages.
 * Narrow viewports: Stage N of M · Name with prev/next chevrons.
 */
export function StageScrollNav({
  stages,
  active,
  visitedMax,
  onSelect,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
}) {
  const railRef = useRef<HTMLOListElement>(null);
  const safeActive = Math.max(0, Math.min(active, Math.max(stages.length - 1, 0)));
  const current = stages[safeActive];

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;
    const btn = rail.querySelector<HTMLElement>(`[data-stage-index="${safeActive}"]`);
    btn?.scrollIntoView({
      behavior: "smooth",
      inline: "nearest",
      block: "nearest",
    });
  }, [safeActive]);

  if (stages.length === 0) return null;

  const label = current ? STAGE_PROCESS_LABEL[current.id] : "";

  return (
    <nav className="stage-scroll-nav" aria-label="Lesson stages">
      <ol ref={railRef} className="stage-scroll-nav-list stage-scroll-nav-list--rail">
        {stages.map((stage, index) => {
          const full = STAGE_PROCESS_LABEL[stage.id];
          const short = STAGE_PROCESS_SHORT[stage.id];
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
                aria-current={isActive ? "location" : undefined}
                aria-label={`Stage ${stage.index}: ${full}`}
                onClick={() => onSelect(index)}
              >
                <span className="stage-scroll-nav-index" aria-hidden="true">
                  {stage.index}
                </span>
                <span className="stage-scroll-nav-label stage-scroll-nav-label--full">
                  {full}
                </span>
                <span className="stage-scroll-nav-label stage-scroll-nav-label--short">
                  {short}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      <div className="stage-scroll-nav-compact">
        <button
          type="button"
          className="stage-scroll-nav-chevron"
          aria-label="Previous stage"
          disabled={safeActive <= 0}
          onClick={() => onSelect(safeActive - 1)}
        >
          <span aria-hidden="true">‹</span>
        </button>
        <p className="stage-scroll-nav-compact-label">
          <span className="stage-scroll-nav-compact-meta">
            Stage {current?.index ?? safeActive + 1} of {stages.length}
          </span>
          <span className="stage-scroll-nav-compact-name">{label}</span>
        </p>
        <button
          type="button"
          className="stage-scroll-nav-chevron"
          aria-label="Next stage"
          disabled={safeActive >= stages.length - 1}
          onClick={() => onSelect(safeActive + 1)}
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </nav>
  );
}
