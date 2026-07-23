import type { ReactNode } from "react";

export type LearningTone =
  | "goal"
  | "observe"
  | "technique"
  | "avoid"
  | "checkpoint"
  | "materials"
  | "time";

const MARKERS: Record<LearningTone, string> = {
  goal: "G",
  observe: "O",
  technique: "T",
  avoid: "A",
  checkpoint: "C",
  materials: "M",
  time: "~",
};

export function LearningCard({
  tone,
  label,
  children,
  className,
}: {
  tone: LearningTone;
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`learning-card learning-card--${tone}${className ? ` ${className}` : ""}`}
    >
      <header className="learning-card-head">
        <span className="learning-card-marker" aria-hidden="true">
          {MARKERS[tone]}
        </span>
        <h4 className="learning-card-label">{label}</h4>
      </header>
      <div className="learning-card-body">{children}</div>
    </article>
  );
}
