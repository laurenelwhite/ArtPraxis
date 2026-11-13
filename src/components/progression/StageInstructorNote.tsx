import type { ProgressionStage } from "@/lib/progression";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

/** Single insight line — tips already surface in the Technique glance card. */
export function StageInstructorNote({ stage }: { stage: ProgressionStage }) {
  const insight = stage.paint.insight.trim();
  if (!insight) return null;

  return (
    <aside className="stage-instructor stage-instructor--compact" aria-labelledby={`instructor-${stage.id}`}>
      <h4 className="stage-instructor-heading" id={`instructor-${stage.id}`}>
        Insight
      </h4>
      <p className="stage-instructor-insight">
        <AutoTerms text={insight} />
      </p>
    </aside>
  );
}
