"use client";

import type { StageId } from "@/lib/progression";

// ============================================================================
// Deterministic, composition-safe stage fallbacks.
//
// When a stage's AI generation cannot be validated, we do NOT reuse another
// image (no duplicate of the preceding stage, and a failed pencil sketch never
// shows the finished master). Instead we derive a stage-appropriate image from
// the already-validated master via canvas pixel operations — no extra AI call.
// Because these are pure pixel transforms of the master, the composition, crop
// and subject placement are preserved exactly; only the amount of value, color,
// completeness and mark-making changes to match the lesson stage.
// ============================================================================

/**
 * Load any http(s) or data URL into a PNG/JPEG data URL suitable for canvas
 * transforms. Prefer fetch→FileReader so Firebase Storage URLs work without
 * tainting the canvas when CORS is configured.
 */
export async function toDataUrl(src: string): Promise<string> {
  if (src.startsWith("data:")) return src;

  async function fetchImage(url: string): Promise<Blob> {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(
        `Could not load an image for a stage preview (${response.status}).`,
      );
    }

    const blob = await response.blob();

    if (!blob.type.startsWith("image/")) {
      throw new Error("Stage preview source did not return an image.");
    }

    return blob;
  }

  let blob: Blob;

  try {
    blob = await fetchImage(src);
  } catch (directError) {
    const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;

    try {
      blob = await fetchImage(proxyUrl);
    } catch (proxyError) {
      console.error("[stage-fallback] Image conversion failed", {
        src,
        directError,
        proxyError,
      });

      throw new Error("Could not load an image for a stage preview.");
    }
  }

  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("Could not convert the stage preview image."));
      }
    };

    reader.onerror = () => {
      reject(new Error("Could not read the stage preview image."));
    };

    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load the master image for a fallback."));
    // Data URLs are same-origin; http(s) needs CORS for canvas readback.
    if (!src.startsWith("data:")) img.crossOrigin = "anonymous";
    img.src = src;
  });
}

function makeContext(w: number, h: number): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D is unavailable for fallback rendering.");
  return { canvas, ctx };
}

const lum = (r: number, g: number, b: number): number => 0.299 * r + 0.587 * g + 0.114 * b;

// Pull each pixel toward gray (satKeep < 1) then toward white (lighten > 0).
function desaturateLighten(d: Uint8ClampedArray, satKeep: number, lighten: number): void {
  for (let i = 0; i < d.length; i += 4) {
    const g = lum(d[i], d[i + 1], d[i + 2]);
    for (let c = 0; c < 3; c++) {
      let v = g + (d[i + c] - g) * satKeep;
      v = v + (255 - v) * lighten;
      d[i + c] = v;
    }
  }
}

// Grayscale + posterize to a small number of value masses (value study).
function posterizeGray(d: Uint8ClampedArray, levels: number): void {
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    const g = lum(d[i], d[i + 1], d[i + 2]);
    const q = Math.round(g / step) * step;
    d[i] = d[i + 1] = d[i + 2] = q;
  }
}

// Sobel edge extraction → sparse, pale graphite contours on white paper.
function pencilLines(d: Uint8ClampedArray, w: number, h: number): void {
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = lum(d[i], d[i + 1], d[i + 2]);
  const at = (x: number, y: number) => gray[y * w + x];
  const out = new Uint8ClampedArray(d.length);
  const edgeThreshold = 52;
  const maxLineDarkness = 28;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let val = 255;
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1) {
        const gx =
          -at(x - 1, y - 1) - 2 * at(x - 1, y) - at(x - 1, y + 1) +
          at(x + 1, y - 1) + 2 * at(x + 1, y) + at(x + 1, y + 1);
        const gy =
          -at(x - 1, y - 1) - 2 * at(x, y - 1) - at(x + 1, y - 1) +
          at(x - 1, y + 1) + 2 * at(x, y + 1) + at(x + 1, y + 1);
        const mag = Math.sqrt(gx * gx + gy * gy);
        if (mag > edgeThreshold) {
          const strength = Math.min(1, (mag - edgeThreshold) / 110);
          val = 255 - strength * maxLineDarkness;
        }
      }
      out[i] = out[i + 1] = out[i + 2] = val;
      out[i + 3] = 255;
    }
  }
  d.set(out);
}

/**
 * Render a deterministic, stage-appropriate fallback from the master data URL.
 * Returns a PNG data URL the caller uploads to Storage. `finished` never falls
 * back (it is the master itself), so it is returned unchanged.
 */
export async function buildStageFallback(masterDataUrl: string, stageId: StageId): Promise<string> {
  const dataUrl = await toDataUrl(masterDataUrl);
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const { canvas, ctx } = makeContext(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  const image = ctx.getImageData(0, 0, w, h);
  const d = image.data;

  switch (stageId) {
    case "pencil-sketch":
      pencilLines(d, w, h);
      break;
    case "value-study":
      posterizeGray(d, 4);
      break;
    case "first-wash":
      desaturateLighten(d, 0.3, 0.55); // pale, mostly-white transparent wash
      break;
    case "second-wash":
      desaturateLighten(d, 0.65, 0.25); // midtones, local color emerging
      break;
    case "refinement":
      desaturateLighten(d, 0.88, 0.08); // close to master, slightly restrained
      break;
    case "finished":
    default:
      break; // finished is the master; no transform
  }

  ctx.putImageData(image, 0, 0);
  return canvas.toDataURL("image/png");
}
