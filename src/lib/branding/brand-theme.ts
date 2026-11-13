/**
 * Lesson-adaptive brand theme for the painted brush mark only.
 * Wordmark, proportions, and placement stay official ArtPraxis navy.
 *
 * Gouache: not in tutorial-schema `mediumSchema` today. If a string alias
 * "gouache" appears in metadata, we map brush texture to matte gouache styling
 * without inventing a generation medium. Closest schema medium remains acrylic.
 */

import type { Medium } from "@/lib/tutorial-schema";
import { MEDIA } from "@/lib/media";
import {
  BRAND_NAVY,
  isUsableAccentHex,
} from "@/lib/branding/accent-color";

/** Visual treatment applied to the painted brush mark. */
export type BrushTexture =
  | "watercolor"
  | "acrylic"
  | "oil"
  | "gouache"
  | "pastel"
  | "charcoal"
  | "pencil"
  | "pen";

export type BrandTheme = {
  accentColor: string;
  medium: Medium;
  brushTexture: BrushTexture;
  /** Mark opacity 0–1 (watercolor slightly translucent). */
  opacity: number;
  /** CSS custom properties for the adaptive logo layer. */
  cssVariables: Record<string, string>;
  /** Master URL this accent was derived from (persistence / stale checks). */
  sourceMasterUrl: string | null;
};

/** Firestore-safe subset (no functions). */
export type BrandThemeStored = {
  accentColor: string;
  medium: Medium;
  brushTexture: BrushTexture;
  opacity: number;
  sourceMasterUrl: string | null;
};

/** Fixed accents for dry / monochrome media — ignore painting colors. */
export const FIXED_MEDIUM_ACCENTS: Partial<Record<BrushTexture, string>> = {
  charcoal: "#3D3D3D",
  pencil: "#5C5C5C",
  pen: "#141414",
};

const TEXTURE_OPACITY: Record<BrushTexture, number> = {
  watercolor: 0.82,
  acrylic: 1,
  oil: 1,
  gouache: 0.96,
  pastel: 0.9,
  charcoal: 0.92,
  pencil: 0.88,
  pen: 1,
};

const SCHEMA_MEDIA = new Set<string>(MEDIA);

/**
 * Normalize product / alias media strings to a brush texture.
 * - graphite → pencil
 * - ink → pen
 * - gouache → gouache texture (not a schema Medium)
 */
export function resolveBrushTexture(mediumRaw: string | null | undefined): BrushTexture {
  const m = (mediumRaw ?? "watercolor").trim().toLowerCase();
  if (m === "graphite") return "pencil";
  if (m === "ink" || m === "pen & ink" || m === "pen-and-ink") return "pen";
  if (m === "gouache") return "gouache";
  if (m === "watercolor") return "watercolor";
  if (m === "acrylic") return "acrylic";
  if (m === "oil") return "oil";
  if (m === "pastel") return "pastel";
  if (m === "charcoal") return "charcoal";
  if (m === "pencil") return "pencil";
  if (m === "pen") return "pen";
  return "watercolor";
}

/** Map to a schema Medium for persistence (gouache → acrylic). */
export function resolveSchemaMedium(mediumRaw: string | null | undefined): Medium {
  const m = (mediumRaw ?? "watercolor").trim().toLowerCase();
  if (m === "graphite") return "pencil";
  if (m === "ink" || m === "pen & ink" || m === "pen-and-ink") return "pen";
  if (m === "gouache") return "acrylic";
  if (SCHEMA_MEDIA.has(m)) return m as Medium;
  return "watercolor";
}

export function usesExtractedAccent(texture: BrushTexture): boolean {
  return !(texture in FIXED_MEDIUM_ACCENTS);
}

export function resolveAccentForTexture(
  texture: BrushTexture,
  extractedOrStored: string | null | undefined,
): string {
  const fixed = FIXED_MEDIUM_ACCENTS[texture];
  if (fixed) return fixed;
  if (extractedOrStored && isUsableAccentHex(extractedOrStored)) {
    return extractedOrStored.trim().toUpperCase();
  }
  return BRAND_NAVY;
}

function buildCssVariables(
  accent: string,
  texture: BrushTexture,
  opacity: number,
): Record<string, string> {
  return {
    "--ap-brush-accent": accent,
    "--ap-brush-opacity": String(opacity),
    "--ap-brush-texture": texture,
  };
}

export function buildBrandTheme(input: {
  medium: string;
  accentColor?: string | null;
  sourceMasterUrl?: string | null;
}): BrandTheme {
  const medium = resolveSchemaMedium(input.medium);
  const brushTexture = resolveBrushTexture(input.medium);
  const opacity = TEXTURE_OPACITY[brushTexture];
  const accentColor = resolveAccentForTexture(brushTexture, input.accentColor);
  return {
    accentColor,
    medium,
    brushTexture,
    opacity,
    cssVariables: buildCssVariables(accentColor, brushTexture, opacity),
    sourceMasterUrl: input.sourceMasterUrl ?? null,
  };
}

export function brandThemeToStored(theme: BrandTheme): BrandThemeStored {
  return {
    accentColor: theme.accentColor,
    medium: theme.medium,
    brushTexture: theme.brushTexture,
    opacity: theme.opacity,
    sourceMasterUrl: theme.sourceMasterUrl,
  };
}

export function brandThemeFromStored(
  stored: BrandThemeStored | null | undefined,
  fallbackMedium: string,
): BrandTheme | null {
  if (!stored?.accentColor || !stored.brushTexture) return null;
  return buildBrandTheme({
    medium: stored.medium || fallbackMedium,
    accentColor: stored.accentColor,
    sourceMasterUrl: stored.sourceMasterUrl,
  });
}

/** Official navy theme (pre-lesson / non-adaptive surfaces). */
export function defaultBrandTheme(medium: string = "watercolor"): BrandTheme {
  return buildBrandTheme({
    medium,
    accentColor: BRAND_NAVY,
    sourceMasterUrl: null,
  });
}
