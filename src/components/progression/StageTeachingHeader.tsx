import { AutoTerms } from "@/components/vocabulary/AutoTerms";

type StageTeachingHeaderProps = {
  stageIndex: number;
  total: number;
  processLabel: string;
  teachingPoint: string;
  /** Optional id for the teaching-point heading (Study anchors). */
  titleId?: string;
  /** Visual variant — preserves existing Study vs Paint class trees. */
  variant: "study" | "paint";
};

/**
 * Stage index · process label · teaching point.
 * Class names stay mode-specific so CSS continues to match.
 */
export function StageTeachingHeader({
  stageIndex,
  total,
  processLabel,
  teachingPoint,
  titleId,
  variant,
}: StageTeachingHeaderProps) {
  if (variant === "paint") {
    return (
      <header className="atelier-head studio-workspace-head">
        <p className="studio-workspace-index">
          Stage {stageIndex}
          <span className="chapter-index-of"> of {total}</span>
          <span className="study-stage-meta-sep" aria-hidden="true">
            ·
          </span>
          <span className="study-stage-meta-label">{processLabel}</span>
        </p>
        <h2 className="study-stage-teaching-point studio-workspace-teaching">
          <AutoTerms text={teachingPoint} />
        </h2>
      </header>
    );
  }

  return (
    <header className="study-stage-head">
      <p className="study-stage-meta">
        Stage {stageIndex} of {total}
        <span className="study-stage-meta-sep" aria-hidden="true">
          ·
        </span>
        <span className="study-stage-meta-label">{processLabel}</span>
      </p>
      <h2 id={titleId} className="study-stage-teaching-point">
        <AutoTerms text={teachingPoint} />
      </h2>
    </header>
  );
}
