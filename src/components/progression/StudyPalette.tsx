import type { Tutorial } from "@/lib/tutorial-schema";

export function StudyPalette({ tutorial }: { tutorial: Tutorial }) {
  const colors = tutorial.palette.slice(0, 7);

  if (colors.length === 0) {
    return null;
  }

  return (
    <section
      className="study-palette"
      aria-labelledby="study-palette-title"
    >
      <hr className="study-palette-rule" aria-hidden="true" />

      <p className="study-palette-caption" id="study-palette-title">
        Painting palette
      </p>

      <ul className="study-palette-swatches">
        {colors.map((color) => (
          <li key={color.name} className="study-palette-item">
            <span
              className="study-palette-swatch"
              style={{ background: color.hex }}
              role="img"
              aria-label={`${color.name} — ${color.role}`}
            />

            <span className="study-palette-body">
              <strong className="study-palette-name">{color.name}</strong>

              {(color.ratio || color.mixingNote) && (
                <span className="study-palette-mix">
                  {[color.ratio, color.mixingNote].filter(Boolean).join(" · ")}
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
