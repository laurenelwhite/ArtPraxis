import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { PencilIcon } from "@/components/progression/supplies";

function shortNote(text: string | undefined, max = 48): string | null {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return null;
  if (trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  return `${cut.replace(/\s+\S*$/, "").trim()}…`;
}

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
      <section className="paint-chips" aria-labelledby={`palette-${stage.id}`}>
        <header className="paint-chips-head">
          <h4 className="paint-chips-heading" id={`palette-${stage.id}`}>
            Value chips
          </h4>
          <p className="paint-chips-lede">Keep the map pale and simple.</p>
        </header>
        <ul className="paint-chip-row">
          <li className="paint-chip">
            <span className="paint-chip-swatch paint-chip-swatch--light" aria-hidden="true" />
            <span className="paint-chip-meta">
              <strong className="paint-chip-name">Lights</strong>
              <span className="paint-chip-desc">{shortNote(tutorial.valueMap.lights, 56)}</span>
            </span>
          </li>
          <li className="paint-chip">
            <span className="paint-chip-swatch paint-chip-swatch--mid" aria-hidden="true" />
            <span className="paint-chip-meta">
              <strong className="paint-chip-name">Mids</strong>
              <span className="paint-chip-desc">{shortNote(tutorial.valueMap.midtones, 56)}</span>
            </span>
          </li>
          <li className="paint-chip">
            <span className="paint-chip-swatch paint-chip-swatch--dark" aria-hidden="true" />
            <span className="paint-chip-meta">
              <strong className="paint-chip-name">Darks</strong>
              <span className="paint-chip-desc">{shortNote(tutorial.valueMap.darks, 56)}</span>
            </span>
          </li>
        </ul>
      </section>
    );
  }

  if (paint.colors.length > 0) {
    return (
      <section className="paint-chips" aria-labelledby={`palette-${stage.id}`}>
        <header className="paint-chips-head">
          <h4 className="paint-chips-heading" id={`palette-${stage.id}`}>
            Palette
          </h4>
          <p className="paint-chips-lede">Mix these for this stage.</p>
        </header>
        <ul className="paint-chip-row">
          {paint.colors.map((c) => {
            const desc = shortNote(c.ratio || c.mixingNote, 42);
            return (
              <li key={c.name} className="paint-chip">
                <span
                  className="paint-chip-swatch"
                  style={{ background: c.hex }}
                  aria-hidden="true"
                />
                <span className="paint-chip-meta">
                  <strong className="paint-chip-name">{c.name}</strong>
                  {desc ? <span className="paint-chip-desc">{desc}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    );
  }

  if (usePencil && stage.id === "pencil-sketch") {
    return (
      <section className="paint-chips paint-chips--tool" aria-labelledby={`palette-${stage.id}`}>
        <header className="paint-chips-head">
          <h4 className="paint-chips-heading" id={`palette-${stage.id}`}>
            Drawing tool
          </h4>
        </header>
        <div className="paint-chip paint-chip--tool">
          <span className="paint-chip-tool-icon" aria-hidden="true">
            <PencilIcon size={22} />
          </span>
          <span className="paint-chip-meta">
            <strong className="paint-chip-name">{paint.brush}</strong>
            {paint.brushPurpose ? (
              <span className="paint-chip-desc">{shortNote(paint.brushPurpose, 64)}</span>
            ) : null}
          </span>
        </div>
      </section>
    );
  }

  return null;
}
