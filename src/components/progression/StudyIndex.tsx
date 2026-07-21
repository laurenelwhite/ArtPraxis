"use client";

import type { ProgressionStage, StageId } from "@/lib/progression";

const SHORT_LABEL: Record<StageId, string> = {
  "pencil-sketch": "Sketch",
  "value-study": "Values",
  "first-wash": "First wash",
  "second-wash": "Build",
  refinement: "Refine",
  finished: "Finish",
};

export function StudyIndex({
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
    <nav className="study-index desk-nav" aria-label="Lesson stages">
      <ol className="desk-nav-track">
        {stages.map((s, i) => {
          const isActive = i === active;
          const isVisited = i <= visitedMax && !isActive;
          const className = [
            "desk-chapter",
            isActive ? "active" : "",
            isVisited ? "visited" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <li key={s.id}>
              <button
                type="button"
                className={className}
                aria-current={isActive ? "step" : undefined}
                aria-selected={isActive}
                onClick={() => onSelect(i)}
              >
                <span className="desk-chapter-num">{String(s.index).padStart(2, "0")}</span>
                <span className="desk-chapter-name">{SHORT_LABEL[s.id]}</span>
                {isVisited && (
                  <span className="desk-chapter-visited" aria-hidden="true">
                    ✓
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
