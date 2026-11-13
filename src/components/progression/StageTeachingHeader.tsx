import { AutoTerms } from "@/components/vocabulary/AutoTerms";

type StageTeachingHeaderProps = {
  stageIndex: number;
  total: number;
  processLabel: string;
  /** Concise stage outcome (one sentence). */
  goal: string;
  /** Optional id for the process-name heading (Study anchors). */
  titleId?: string;
  /** Visual variant — preserves existing Study vs Paint class trees. */
  variant: "study" | "paint";
};

/**
 * Stage visual anchor:
 * N · Title
 * Purpose
 */
export function StageTeachingHeader({
  stageIndex,
  total,
  processLabel,
  goal,
  titleId,
  variant,
}: StageTeachingHeaderProps) {
  const indexClass =
    variant === "paint" ? "studio-workspace-index" : "study-stage-meta";
  const titleClass =
    variant === "paint"
      ? "study-stage-title studio-workspace-title"
      : "study-stage-title";
  const goalClass =
    variant === "paint"
      ? "study-stage-goal studio-workspace-goal"
      : "study-stage-goal";
  const headClass =
    variant === "paint"
      ? "atelier-head studio-workspace-head stage-teaching-header"
      : "study-stage-head stage-teaching-header";

  return (
    <header className={headClass}>
      <p className={`${indexClass} stage-eyebrow`}>
        {stageIndex} of {total}
      </p>
      <h2 id={titleId} className={titleClass}>
        {processLabel}
      </h2>
      {goal ? (
        <p className={goalClass}>
          <AutoTerms text={goal} />
        </p>
      ) : null}
    </header>
  );
}
