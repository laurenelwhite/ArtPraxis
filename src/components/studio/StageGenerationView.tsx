"use client";

import type { StageId, StageImageRecord } from "@/lib/progression";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";
import { isUsableStageTarget } from "@/lib/lesson-ui-state";
import { AppImage } from "@/components/ui/AppImage";

const ORDER: StageId[] = [
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
];

type Props = {
  masterImageUrl: string;
  stages: StageImageRecord[];
  headline: string;
  detail: string;
  progress: number | null;
  activeStageLabel: string | null;
};

/**
 * Studio note while stage plates are prepared —
 * checklist beside the accepted painting, not a brush animation.
 */
export function StageGenerationView({
  masterImageUrl,
  stages,
  activeStageLabel,
}: Props) {
  const readyCount = ORDER.filter((id) => {
    const record = stages.find((s) => s.stageId === id);
    return isUsableStageTarget(record) && record?.generationStatus === "ready";
  }).length;

  return (
    <section
      className="lesson-state-view stage-generation-view atelier-studio-note-view"
      aria-live="polite"
    >
      <figure className="atelier-studio-painting">
        <AppImage
          src={masterImageUrl}
          alt="Accepted target painting"
          className="atelier-studio-painting-img"
          width={1200}
          height={900}
          sizes="(max-width: 900px) 100vw, 520px"
          style={{ width: "100%", height: "auto" }}
        />
      </figure>

      <div className="atelier-studio-note" role="status">
        <p className="atelier-wait-eyebrow">Building your painting steps</p>
        <h2 className="atelier-wait-heading">
          {activeStageLabel
            ? `Preparing ${activeStageLabel}`
            : "Preparing your demonstrations"}
        </h2>
        <p className="atelier-wait-body">
          {readyCount} of {ORDER.length} plates ready. Your accepted painting stays visible while we build each stage.
        </p>
        <ol className="atelier-pipeline atelier-pipeline--stages" aria-label="Stage progress">
          {ORDER.map((id) => {
            const record = stages.find((s) => s.stageId === id);
            const ready =
              isUsableStageTarget(record) && record?.generationStatus === "ready";
            const active =
              !ready &&
              Boolean(
                record &&
                  (record.generationStatus === "generating" ||
                    record.generationStatus === "pending" ||
                    record.previewSource === "reference"),
              );
            const state = ready ? "complete" : active ? "active" : "pending";
            return (
              <li key={id} className={`atelier-pipeline-step is-${state}`}>
                <span className="atelier-pipeline-mark" aria-hidden="true">
                  {ready ? (
                    <svg viewBox="0 0 16 16" className="atelier-pipeline-check" focusable="false">
                      <path
                        d="M3.2 8.2 L6.4 11.2 L12.8 4.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="atelier-pipeline-dot" />
                  )}
                </span>
                <span className="atelier-pipeline-label">{STAGE_PROCESS_LABEL[id]}</span>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
