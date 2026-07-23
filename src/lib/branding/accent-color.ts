/**
 * Extract a single artistically meaningful accent from a master painting.
 * Runs in the browser (canvas). Call once per master URL — never every render.
 */

export const BRAND_NAVY = "#0D1B2A";

const SAMPLE_SIZE = 72;
/** Skip near-white / paper / ivory. */
const MAX_LUM = 0.82;
/** Skip deep shadows / near-black. */
const MIN_LUM = 0.08;
/** Skip neutrals / gray paper (HSV saturation 0–1). */
const MIN_SAT = 0.18;
/** Prefer hues that stay readable on light atelier chrome. */
const MAX_LUM_FOR_HEADER = 0.68;

type Rgb = { r: number; g: number; b: number };

function clampByte(n: number): number {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function rgbToHex({ r, g, b }: Rgb): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => clampByte(c).toString(16).padStart(2, "0"))
      .join("")
      .toUpperCase()
  );
}

export function parseHexColor(hex: string): Rgb | null {
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

/** Relative luminance 0–1 (sRGB). */
export function relativeLuminance({ r, g, b }: Rgb): number {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

/** Cheap HSV saturation 0–1 from sRGB bytes. */
export function saturation({ r, g, b }: Rgb): number {
  const max = Math.max(r, g, b) / 255;
  const min = Math.min(r, g, b) / 255;
  if (max <= 0) return 0;
  return (max - min) / max;
}

/** Hue in degrees 0–360, or -1 for near-gray. */
export function hueDegrees({ r, g, b }: Rgb): number {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const d = max - min;
  if (d < 1e-6) return -1;
  let h = 0;
  if (max === rn) h = ((gn - bn) / d) % 6;
  else if (max === gn) h = (bn - rn) / d + 2;
  else h = (rn - gn) / d + 4;
  h *= 60;
  if (h < 0) h += 360;
  return h;
}

export function isUsableAccentHex(hex: string): boolean {
  const rgb = parseHexColor(hex);
  if (!rgb) return false;
  const lum = relativeLuminance(rgb);
  const sat = saturation(rgb);
  if (lum > MAX_LUM_FOR_HEADER) return false;
  if (lum < MIN_LUM) return false;
  // Near-navy neutrals are fine as fallback; extracted accents need some chroma
  // unless they are intentionally dark (ink-like).
  if (sat < 0.08 && lum > 0.35) return false;
  return true;
}

function scorePixel(rgb: Rgb): number | null {
  const lum = relativeLuminance(rgb);
  if (lum > MAX_LUM || lum < MIN_LUM) return null;
  const sat = saturation(rgb);
  if (sat < MIN_SAT) return null;
  // Prefer saturated midtones that read on ivory chrome.
  const mid = 1 - Math.abs(lum - 0.42) * 1.4;
  return sat * 2.2 + Math.max(0, mid) + (lum < MAX_LUM_FOR_HEADER ? 0.35 : -0.5);
}

type Bucket = { r: number; g: number; b: number; weight: number; count: number };

/**
 * Pick a dominant saturated accent from ImageData.
 * Pure / testable — no DOM.
 */
export function pickAccentFromImageData(data: ImageData): string {
  const { data: px, width, height } = data;
  const buckets = new Map<number, Bucket>();

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = px[i + 3];
      if (a < 140) continue;
      const rgb = { r: px[i], g: px[i + 1], b: px[i + 2] };
      const score = scorePixel(rgb);
      if (score == null) continue;
      const h = hueDegrees(rgb);
      if (h < 0) continue;
      const key = Math.round(h / 18); // 20 hue buckets
      const prev = buckets.get(key);
      if (prev) {
        prev.r += rgb.r * score;
        prev.g += rgb.g * score;
        prev.b += rgb.b * score;
        prev.weight += score;
        prev.count += 1;
      } else {
        buckets.set(key, {
          r: rgb.r * score,
          g: rgb.g * score,
          b: rgb.b * score,
          weight: score,
          count: 1,
        });
      }
    }
  }

  let best: Bucket | null = null;
  let bestScore = -1;
  for (const b of buckets.values()) {
    if (b.count < 3) continue;
    const score = b.weight;
    if (score > bestScore) {
      bestScore = score;
      best = b;
    }
  }

  if (!best || best.weight <= 0) return BRAND_NAVY;

  const accent = rgbToHex({
    r: best.r / best.weight,
    g: best.g / best.weight,
    b: best.b / best.weight,
  });

  return isUsableAccentHex(accent) ? accent : BRAND_NAVY;
}

async function fetchImageBlob(src: string): Promise<Blob> {
  const tryFetch = async (url: string) => {
    const res = await fetch(url, { mode: "cors", credentials: "omit" });
    if (!res.ok) throw new Error(`image fetch ${res.status}`);
    return res.blob();
  };

  if (src.startsWith("data:") || src.startsWith("blob:")) {
    const res = await fetch(src);
    if (!res.ok) throw new Error("local image fetch failed");
    return res.blob();
  }

  try {
    return await tryFetch(src);
  } catch {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
    return tryFetch(proxyUrl);
  }
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not decode master image for accent extraction."));
    };
    img.src = url;
  });
}

/**
 * Extract accent from a master/target painting URL.
 * Uses the image-proxy when Firebase Storage CORS blocks canvas reads.
 */
export async function extractAccentFromImageUrl(imageUrl: string): Promise<string> {
  if (typeof document === "undefined") return BRAND_NAVY;
  try {
    const blob = await fetchImageBlob(imageUrl);
    const img = await loadImageFromBlob(blob);
    const canvas = document.createElement("canvas");
    canvas.width = SAMPLE_SIZE;
    canvas.height = SAMPLE_SIZE;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return BRAND_NAVY;
    ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    const data = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE);
    return pickAccentFromImageData(data);
  } catch (err) {
    console.warn("[branding] Accent extraction failed; using navy.", err);
    return BRAND_NAVY;
  }
}
