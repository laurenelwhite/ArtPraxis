import type { ReactNode } from "react";
import { Icon, type IconName } from "@/components/Icon";

export type LearningTone =
  | "goal"
  | "observe"
  | "technique"
  | "avoid"
  | "checkpoint"
  | "materials"
  | "time";

export type StageGlanceVariant =
  | "goal"
  | "observe"
  | "technique"
  | "avoid"
  | "materials"
  | "time";

interface GlanceCardStyle {
  icon: IconName;
}

/** Visual config for glance notes — content stays in LessonSummaryGrid. */
export const glanceCardStyles = {
  goal: { icon: "crop" },
  observe: { icon: "eye" },
  technique: { icon: "brush" },
  avoid: { icon: "ban" },
  materials: { icon: "palette" },
  time: { icon: "clock" },
} as const satisfies Record<StageGlanceVariant, GlanceCardStyle>;

const FALLBACK_STYLE: GlanceCardStyle = {
  icon: "sparkles",
};

function styleForTone(tone: LearningTone): GlanceCardStyle {
  if (tone in glanceCardStyles) {
    return glanceCardStyles[tone as StageGlanceVariant];
  }
  return FALLBACK_STYLE;
}

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
  const style = styleForTone(tone);

  return (
    <article
      className={[
        "learning-note",
        `learning-note--${tone}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <header className="learning-note-head">
        <Icon name={style.icon} size={15} className="learning-note-icon" />
        <h4 className="learning-note-label">{label}</h4>
      </header>
      <div className="learning-note-body">{children}</div>
    </article>
  );
}
