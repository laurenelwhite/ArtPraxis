import type { ProgressionStage } from "@/lib/progression";

export function StageMistake({ stage }: { stage: ProgressionStage }) {
  const primary = stage.paint.watchOut.trim();
  const supporting = stage.commonMistakes
    .map((m) => m.trim())
    .find((m) => m && m !== primary);

  if (!primary && !supporting) return null;

  return (
    <section className="stage-mistake" aria-labelledby={`mistake-${stage.id}`}>
      <h4 className="stage-mistake-heading" id={`mistake-${stage.id}`}>
        Common mistake
      </h4>
      {primary && <p className="stage-mistake-primary">{primary}</p>}
      {supporting && <p className="stage-mistake-support">{supporting}</p>}
    </section>
  );
}
