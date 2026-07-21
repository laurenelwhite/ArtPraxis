import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { PencilIcon } from "@/components/progression/supplies";

export function StagePalette({
  stage,
  tutorial,
  medium,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
}) {
  const { paint } = stage;
  const usePencil =
    stage.id === "pencil-sketch" || medium === "pencil" || medium === "charcoal";

  if (stage.id === "value-study") {
    return (
      <section className="stage-palette" aria-labelledby={`palette-${stage.id}`}>
        <h4 className="stage-palette-heading" id={`palette-${stage.id}`}>
          Value scale
        </h4>
        <ul className="stage-value-cards">
          <li className="stage-value-card">
            <span className="stage-value-swatch stage-value-swatch-light" aria-hidden="true" />
            <span className="stage-value-body">
              <strong>Lights</strong>
              <span>{tutorial.valueMap.lights}</span>
            </span>
          </li>
          <li className="stage-value-card">
            <span className="stage-value-swatch stage-value-swatch-mid" aria-hidden="true" />
            <span className="stage-value-body">
              <strong>Midtones</strong>
              <span>{tutorial.valueMap.midtones}</span>
            </span>
          </li>
          <li className="stage-value-card">
            <span className="stage-value-swatch stage-value-swatch-dark" aria-hidden="true" />
            <span className="stage-value-body">
              <strong>Darks</strong>
              <span>{tutorial.valueMap.darks}</span>
            </span>
          </li>
        </ul>
      </section>
    );
  }

  if (paint.colors.length > 0) {
    return (
      <section className="stage-palette" aria-labelledby={`palette-${stage.id}`}>
        <h4 className="stage-palette-heading" id={`palette-${stage.id}`}>
          Colors for this stage
        </h4>
        <ul className="stage-color-cards">
          {paint.colors.map((c) => (
            <li key={c.name} className="stage-color-card">
              <span
                className="stage-color-swatch"
                style={{ background: c.hex }}
                aria-hidden="true"
              />
              <span className="stage-color-body">
                <strong>{c.name}</strong>
                {c.ratio && <span className="stage-color-ratio">{c.ratio}</span>}
                {c.mixingNote && <span className="stage-color-note">{c.mixingNote}</span>}
              </span>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  if (usePencil && stage.id === "pencil-sketch") {
    return (
      <section className="stage-palette" aria-labelledby={`palette-${stage.id}`}>
        <h4 className="stage-palette-heading" id={`palette-${stage.id}`}>
          Drawing setup
        </h4>
        <div className="stage-tool-card">
          <span className="stage-tool-icon" aria-hidden="true">
            <PencilIcon size={24} />
          </span>
          <div className="stage-tool-body">
            <strong>{paint.brush}</strong>
            <span>{paint.brushPurpose}</span>
          </div>
        </div>
      </section>
    );
  }

  return null;
}
