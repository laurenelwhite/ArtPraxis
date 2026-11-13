import type { ProgressionStage } from "@/lib/progression";

function buildChecks(stage: ProgressionStage): string[] {
  const main = stage.paint.checkpoint.trim();
  const extras = stage.goals
    .map((g) => g.trim())
    .filter((g) => g && g !== main)
    .slice(0, 2);
  return main ? [main, ...extras] : extras.slice(0, 3);
}

export function StageCheckpoint({ stage }: { stage: ProgressionStage }) {
  const checks = buildChecks(stage);
  if (checks.length === 0) return null;

  return (
    <section className="stage-checkpoint" aria-labelledby={`checkpoint-${stage.id}`}>
      <h4 className="stage-checkpoint-heading" id={`checkpoint-${stage.id}`}>
        Check before moving on
      </h4>
      <ul className="stage-checklist" role="list">
        {checks.map((item, i) => (
          <li key={i} className="stage-checklist-row">
            <span className="stage-checklist-mark" aria-hidden="true" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
