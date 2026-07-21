import type { ProgressionStage } from "@/lib/progression";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

export function StageInstructorNote({ stage }: { stage: ProgressionStage }) {
  const insight = stage.paint.insight.trim();
  const tips = stage.proTips.map((t) => t.trim()).filter(Boolean);

  if (!insight && tips.length === 0) return null;

  return (
    <aside className="stage-instructor" aria-labelledby={`instructor-${stage.id}`}>
      <h4 className="stage-instructor-heading" id={`instructor-${stage.id}`}>
        {insight ? "Practice insight" : "Pro tips"}
      </h4>
      {insight && <p className="stage-instructor-insight">{insight}</p>}
      {tips.length > 0 && (
        <ul className="stage-instructor-tips">
          {tips.map((tip, i) => (
            <li key={i}>
              <AutoTerms text={tip} />
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
