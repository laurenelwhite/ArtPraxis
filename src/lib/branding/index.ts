/**
 * Adaptive branding for ArtPraxis — accent extraction + brush-mark theme.
 * Consumers: lesson top bar logo only. Do not couple to lesson stage UI.
 */

export {
  BRAND_NAVY,
  extractAccentFromImageUrl,
  isUsableAccentHex,
  parseHexColor,
  pickAccentFromImageData,
  relativeLuminance,
  rgbToHex,
  saturation,
} from "@/lib/branding/accent-color";

export {
  FIXED_MEDIUM_ACCENTS,
  brandThemeFromStored,
  brandThemeToStored,
  buildBrandTheme,
  defaultBrandTheme,
  resolveAccentForTexture,
  resolveBrushTexture,
  resolveSchemaMedium,
  usesExtractedAccent,
  type BrandTheme,
  type BrandThemeStored,
  type BrushTexture,
} from "@/lib/branding/brand-theme";

export { ensureLessonBrandTheme } from "@/lib/branding/ensure-lesson-brand";
