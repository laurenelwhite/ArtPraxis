/**
 * Ensure a project has a persisted brand theme derived from the master painting.
 * Extracts once (when missing or master URL changes); never every render.
 */

import {
  brandThemeFromStored,
  buildBrandTheme,
  usesExtractedAccent,
  type BrandTheme,
} from "@/lib/branding/brand-theme";
import { extractAccentFromImageUrl } from "@/lib/branding/accent-color";
import {
  getLessonBrand,
  persistLessonBrand,
  type LessonBrandFields,
} from "@/lib/lessons";

const inflight = new Map<string, Promise<BrandTheme>>();

function cacheKey(uid: string, projectId: string, masterUrl: string): string {
  return `${uid}:${projectId}:${masterUrl}`;
}

function isPersistableMasterUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

/**
 * Resolve adaptive branding for a lesson with a usable master image.
 * Returns a theme suitable for the navigation brush mark.
 * Persists to the project only for stable http(s) master URLs (not blob previews).
 */
export async function ensureLessonBrandTheme(params: {
  uid: string;
  projectId: string;
  medium: string;
  masterImageUrl: string;
  /** Existing fields from an already-loaded lesson summary (avoids an extra read). */
  existing?: LessonBrandFields | null;
}): Promise<BrandTheme> {
  const { uid, projectId, medium, masterImageUrl } = params;
  const key = cacheKey(uid, projectId, masterImageUrl);

  const existing =
    params.existing ??
    (await getLessonBrand(uid, projectId).catch(() => null));

  const storedTheme = brandThemeFromStored(existing?.brandTheme, medium);
  if (
    storedTheme &&
    existing?.brandAccent &&
    existing.brandTheme?.sourceMasterUrl === masterImageUrl
  ) {
    return storedTheme;
  }

  const running = inflight.get(key);
  if (running) return running;

  const work = (async () => {
    const probe = buildBrandTheme({ medium, sourceMasterUrl: masterImageUrl });
    let accent = probe.accentColor;

    if (usesExtractedAccent(probe.brushTexture)) {
      accent = await extractAccentFromImageUrl(masterImageUrl);
    }

    const persistable = isPersistableMasterUrl(masterImageUrl);
    const theme = buildBrandTheme({
      medium,
      accentColor: accent,
      sourceMasterUrl: persistable ? masterImageUrl : null,
    });

    if (persistable) {
      await persistLessonBrand(uid, projectId, {
        brandAccent: theme.accentColor,
        brandTheme: {
          accentColor: theme.accentColor,
          medium: theme.medium,
          brushTexture: theme.brushTexture,
          opacity: theme.opacity,
          sourceMasterUrl: masterImageUrl,
        },
      });
    }

    return theme;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, work);
  return work;
}
