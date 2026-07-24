"use client";

import { useEffect, useRef } from "react";
import type { ProgressionStage } from "@/lib/progression";
import {
  STAGE_PROCESS_LABEL,
  STAGE_PROCESS_SHORT,
} from "@/lib/stage-icons";

/**
 * Sticky stage indicator for the continuous Study journey.
 * Progress track + quiet marks — tap scrolls to a stage.
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
  const progress =
    stages.length > 1 ? safeActive / (stages.length - 1) : stages.length === 1 ? 1 : 0;

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

  return (
    <nav className="stage-scroll-nav" aria-label="Lesson stages">
      <div
        className="stage-scroll-nav-track"
        aria-hidden="true"
        style={{ ["--stage-progress" as string]: String(progress) }}
      >
        <span className="stage-scroll-nav-track-fill" />
      </div>
      <ol ref={railRef} className="stage-scroll-nav-list">
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
                <span className="stage-scroll-nav-mark" aria-hidden="true" />
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
    </nav>
  );
}
