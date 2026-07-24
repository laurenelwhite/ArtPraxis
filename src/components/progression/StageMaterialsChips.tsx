"use client";

import type { ProgressionStage } from "@/lib/progression";

/**
 * Compact stage-only material chips — not the full lesson materials list.
 */
export function StageMaterialsChips({
  stage,
  onOpenMaterial,
}: {
  stage: ProgressionStage;
  onOpenMaterial?: (materialId: string) => void;
}) {
  const colors = stage.paint.colors.filter((c) => c.name.trim());
  if (colors.length === 0) {
    return (
      <p className="stage-materials-empty meta">
        No special palette for this stage — use your core setup.
      </p>
    );
  }

  return (
    <ul className="stage-material-chips" aria-label="Materials for this stage">
      {colors.map((color) => {
        const id = `paint:${color.name.trim().toLowerCase()}`;
        return (
          <li key={id}>
            <button
              type="button"
              className="stage-material-chip"
              onClick={() => onOpenMaterial?.(id)}
              title={color.mixingNote || color.ratio || color.name}
            >
              <span
                className="stage-material-chip-swatch"
                style={{ background: color.hex }}
                aria-hidden="true"
              />
              <span className="stage-material-chip-label">{color.name}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
