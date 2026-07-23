"use client";

import type { ProgressionStage } from "@/lib/progression";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";

/**
 * Compact horizontal stage navigator for one-stage-at-a-time lesson views.
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
  return (
    <nav className="stage-scroll-nav" aria-label="Lesson stages">
      <ol className="stage-scroll-nav-list">
        {stages.map((stage, index) => {
          const label = STAGE_PROCESS_LABEL[stage.id];
          const isActive = index === active;
          const visited = index <= visitedMax;
          return (
            <li key={stage.id} className="stage-scroll-nav-item">
              <button
                type="button"
                className={[
                  "stage-scroll-nav-btn",
                  isActive ? "is-active" : null,
                  visited && !isActive ? "is-visited" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isActive ? "location" : undefined}
                onClick={() => onSelect(index)}
              >
                <span className="stage-scroll-nav-index" aria-hidden="true">
                  {stage.index}
                </span>
                <span className="stage-scroll-nav-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
