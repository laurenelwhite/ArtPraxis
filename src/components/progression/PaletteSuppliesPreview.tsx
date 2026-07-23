import type { Tutorial } from "@/lib/tutorial-schema";

type PaletteColor = Tutorial["palette"][number];
type Material = Tutorial["materials"][number];
type MaterialKind = "brush" | "surface" | "tool" | "setup";

function classifyMaterial(item: string): MaterialKind {
  const t = item.toLowerCase();

  if (
    /\b(brush|mop|filbert|rigger|liner)\b/.test(t) ||
    /\b(round|flat|bright|fan)\b[^,]{0,20}#?\s*\d/.test(t)
  ) {
    return "brush";
  }

  if (
    /\b(paper|canvas|panel|board|pad|block|support|cold[-\s]?press|hot[-\s]?press|watercolor paper|toned paper)\b/.test(
      t,
    )
  ) {
    return "surface";
  }

  if (
    /\b(pencil|eraser|kneaded|charcoal|knife|masking|tape|sponge|towel|palette\b|water (cup|jar|pot)|spray|blotting|pen\b|marker|clip|easel)\b/.test(
      t,
    )
  ) {
    return "tool";
  }

  return "setup";
}

/** Very short mix cue only — e.g. "Sap Green + Ochre". No paragraphs. */
function shortMixLabel(color: PaletteColor): string | null {
  const note = color.mixingNote?.trim() ?? "";
  if (!note) return null;
  if (note.length > 36) return null;
  if (/[.!?]/.test(note) && note.length > 24) return null;
  if (/\+/.test(note) || note.length <= 28) return note;
  return null;
}

function joinItems(items: string[], max = 4): string {
  return items.slice(0, max).join(" · ");
}

function groupMaterials(materials: Material[]) {
  const brushes: string[] = [];
  const surfaces: string[] = [];
  const tools: string[] = [];
  const setupItems: string[] = [];

  for (const m of materials) {
    const item = m.item.trim();
    if (!item) continue;
    const kind = classifyMaterial(item);
    if (kind === "brush") brushes.push(item);
    else if (kind === "surface") surfaces.push(item);
    else if (kind === "tool") tools.push(item);
    else setupItems.push(item);
  }

  // One concise setup note from existing purpose text when short enough.
  let setupNote: string | null = null;
  for (const m of materials) {
    const purpose = m.purpose?.trim() ?? "";
    if (!purpose || purpose.length > 72) continue;
    if (
      classifyMaterial(m.item) === "setup" ||
      /set\s*up|prepare|tape|stretch|wet the|pre-wet/i.test(purpose)
    ) {
      setupNote = purpose;
      break;
    }
  }

  if (!setupNote && setupItems.length > 0) {
    setupNote = joinItems(setupItems, 3);
  }

  return { brushes, surfaces, tools, setupNote };
}

export function PaletteSuppliesPreview({
  tutorial,
  maxColors = 7,
}: {
  tutorial: Tutorial;
  maxColors?: number;
}) {
  const colors = tutorial.palette.slice(0, Math.min(maxColors, 7));
  const materials = tutorial.materials;
  const groups = groupMaterials(materials);

  if (colors.length === 0 && materials.length === 0) {
    return null;
  }

  const brushLine = joinItems(groups.brushes);
  const surfaceLine = joinItems(groups.surfaces, 2);
  const toolLine = joinItems(groups.tools);
  const hasSupplyRows =
    Boolean(brushLine) ||
    Boolean(surfaceLine) ||
    Boolean(toolLine) ||
    Boolean(groups.setupNote);

  return (
    <section
      className="palette-supplies"
      aria-labelledby="palette-supplies-title"
    >
      <div className="palette-supplies-box">
        <h3 className="palette-supplies-title" id="palette-supplies-title">
          Palette &amp; supplies
        </h3>

        {colors.length > 0 && (
          <ul className="palette-supplies-swatches">
            {colors.map((color) => {
              const mix = shortMixLabel(color);
              return (
                <li key={color.name} className="palette-supplies-swatch-item">
                  <span
                    className="palette-supplies-swatch"
                    style={{ background: color.hex }}
                    role="img"
                    aria-label={color.name}
                  />
                  <span className="palette-supplies-swatch-text">
                    <span className="palette-supplies-color-name">
                      {color.name}
                    </span>
                    {mix && (
                      <span className="palette-supplies-mix-short">{mix}</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        )}

        {hasSupplyRows && (
          <dl className="palette-supplies-rows">
            {brushLine && (
              <div className="palette-supplies-row">
                <dt>Brushes</dt>
                <dd>{brushLine}</dd>
              </div>
            )}
            {surfaceLine && (
              <div className="palette-supplies-row">
                <dt>Surface</dt>
                <dd>{surfaceLine}</dd>
              </div>
            )}
            {toolLine && (
              <div className="palette-supplies-row">
                <dt>Tools</dt>
                <dd>{toolLine}</dd>
              </div>
            )}
            {groups.setupNote && (
              <div className="palette-supplies-row">
                <dt>Setup</dt>
                <dd>{groups.setupNote}</dd>
              </div>
            )}
          </dl>
        )}

        <details className="palette-supplies-more">
          <summary>View full materials</summary>
          <div className="palette-supplies-more-body">
            {tutorial.palette.length > 0 && (
              <div className="palette-supplies-block">
                <h4 className="palette-supplies-block-label">Palette</h4>
                <ul className="palette-supplies-full-colors">
                  {tutorial.palette.map((color) => (
                    <li key={color.name}>
                      <span
                        className="palette-supplies-swatch"
                        style={{ background: color.hex }}
                        role="img"
                        aria-label={color.name}
                      />
                      <span>
                        <strong>{color.name}</strong>
                        {color.role.trim() && (
                          <span className="palette-supplies-full-role">
                            {color.role}
                          </span>
                        )}
                        {(color.ratio.trim() || color.mixingNote.trim()) && (
                          <span className="palette-supplies-full-mix">
                            {[color.ratio, color.mixingNote]
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {materials.length > 0 && (
              <div className="palette-supplies-block">
                <h4 className="palette-supplies-block-label">Materials</h4>
                <ul className="palette-supplies-full-materials">
                  {materials.map((m) => (
                    <li key={m.item}>
                      <div className="palette-supplies-full-material-main">
                        <strong>{m.item}</strong>
                        {m.purpose.trim() && (
                          <span className="palette-supplies-full-purpose">
                            {m.purpose}
                          </span>
                        )}
                      </div>
                      <span
                        className={
                          m.required
                            ? "palette-supplies-tag is-required"
                            : "palette-supplies-tag"
                        }
                      >
                        {m.required ? "Required" : "Optional"}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      </div>
    </section>
  );
}

/** Compatibility alias — prefer PaletteSuppliesPreview. */
export const PaletteStrip = PaletteSuppliesPreview;
