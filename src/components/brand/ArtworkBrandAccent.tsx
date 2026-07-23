type ArtworkBrandAccentProps = {
  /** Curated or manually supplied accent; falls back to deep navy */
  color?: string | null;
  className?: string;
};

const NAVY = "#0d1b2a";

/** Very light contrast guard — reject near-white accents. */
function isUsableAccent(color: string): boolean {
  const hex = color.trim();
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex);
  if (!m) return false;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Relative luminance (sRGB approx)
  const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return lum < 0.72;
}

/**
 * Controlled decorative accent for artwork-specific moments (hero stroke, covers).
 * Does not recolor the global UI. Defaults to deep navy.
 */
export function ArtworkBrandAccent({
  color,
  className,
}: ArtworkBrandAccentProps) {
  const resolved =
    color && isUsableAccent(color) ? color.trim() : NAVY;

  return (
    <span
      className={["artwork-brand-accent", className].filter(Boolean).join(" ")}
      style={{ ["--artwork-accent" as string]: resolved }}
      aria-hidden="true"
    />
  );
}

export function resolveArtworkAccent(color?: string | null): string {
  if (color && isUsableAccent(color)) return color.trim();
  return NAVY;
}
