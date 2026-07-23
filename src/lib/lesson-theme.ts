import type { Medium } from "@/lib/tutorial-schema";

/**
 * Lesson accent theme — explicit pigment presets (not image-sampled).
 * Components should prefer CSS vars (`--lesson-accent`) set via
 * `data-lesson-medium` on a lesson shell; this helper is for TS consumers.
 */

export type LessonThemeAccentFamily =
  | "ultramarine"
  | "yellow-ochre"
  | "burnt-sienna"
  | "burnt-umber"
  | "venetian-red"
  | "terre-verte"
  | "paynes-gray"
  | "bone-black";

export type LessonTheme = {
  medium: Medium | "unknown";
  family: LessonThemeAccentFamily;
  /** CSS variable reference for the accent */
  accent: string;
  accentSoft: string;
  accentContrast: string;
  /** Attribute value for `data-lesson-medium` */
  dataAttribute: string;
};

const FALLBACK: LessonTheme = {
  medium: "unknown",
  family: "ultramarine",
  accent: "var(--color-ultramarine)",
  accentSoft: "var(--color-ultramarine-soft)",
  accentContrast: "var(--color-paper-white)",
  dataAttribute: "watercolor",
};

const BY_MEDIUM: Record<Medium, Omit<LessonTheme, "medium">> = {
  watercolor: {
    family: "ultramarine",
    accent: "var(--color-ultramarine)",
    accentSoft: "var(--color-ultramarine-soft)",
    accentContrast: "var(--color-paper-white)",
    dataAttribute: "watercolor",
  },
  oil: {
    family: "burnt-umber",
    accent: "var(--color-burnt-umber)",
    accentSoft: "var(--color-burnt-umber-soft)",
    accentContrast: "var(--color-paper-white)",
    dataAttribute: "oil",
  },
  acrylic: {
    family: "burnt-sienna",
    accent: "var(--color-burnt-sienna)",
    accentSoft: "var(--color-burnt-sienna-soft)",
    accentContrast: "var(--color-paper-white)",
    dataAttribute: "acrylic",
  },
  pastel: {
    family: "yellow-ochre",
    accent: "var(--color-yellow-ochre)",
    accentSoft: "var(--color-yellow-ochre-soft)",
    accentContrast: "var(--color-bone-black)",
    dataAttribute: "pastel",
  },
  charcoal: {
    family: "bone-black",
    accent: "var(--color-bone-black)",
    accentSoft: "var(--color-soft-gray)",
    accentContrast: "var(--color-paper-white)",
    dataAttribute: "charcoal",
  },
  pencil: {
    family: "paynes-gray",
    accent: "var(--color-paynes-gray)",
    accentSoft: "var(--color-canvas-deep)",
    accentContrast: "var(--color-paper-white)",
    dataAttribute: "pencil",
  },
  pen: {
    family: "bone-black",
    accent: "var(--color-bone-black)",
    accentSoft: "var(--color-canvas-deep)",
    accentContrast: "var(--color-paper-white)",
    dataAttribute: "pen",
  },
};

/** Aliases for naming used in design docs (gouache/drawing/ink). */
const ALIASES: Record<string, Medium> = {
  gouache: "pastel",
  drawing: "pencil",
  graphite: "pencil",
  ink: "pen",
};

/**
 * Resolve a lesson medium string to accent CSS variable references.
 * Unknown values fall back to ultramarine.
 */
export function getLessonTheme(medium?: string | null): LessonTheme {
  if (!medium) return FALLBACK;
  const key = medium.trim().toLowerCase();
  const resolved = (ALIASES[key] ?? key) as Medium;
  const entry = BY_MEDIUM[resolved];
  if (!entry) return FALLBACK;
  return { medium: resolved, ...entry };
}
