import type { ProgressionStage } from "@/lib/progression";
import { stageFocusPrimary, stageIgnoreLine } from "@/components/progression/stage-focus";

export function StageFocusPanel({ stage }: { stage: ProgressionStage }) {
  const primary = stageFocusPrimary(stage);
  const ignore = stageIgnoreLine(stage.id);

  return (
    <aside className="stage-focus" aria-labelledby={`focus-${stage.id}`}>
      <p className="stage-focus-label" id={`focus-${stage.id}`}>
        Right now
      </p>
      <p className="stage-focus-primary">{primary}</p>
      <p className="stage-focus-ignore">
        <span className="stage-focus-ignore-tag">Ignore for now</span>
        {ignore}
      </p>
    </aside>
  );
}
