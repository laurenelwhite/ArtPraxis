"use client";

import type { StageId } from "@/lib/progression";

// ============================================================================
// Deterministic, composition-safe stage fallbacks.
//
// When AI generation cannot be validated, derive a stage-appropriate image via
// canvas transforms. Stages after Sketch prefer building from the PRECEDING
// stage (visible construction history) while borrowing pale color/value from
// the master — never a photographic edge filter or a mere lighten of the finish.
// ============================================================================

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

/**
 * Contour-oriented sketch fallback — NOT a dense Sobel edge photo filter.
 * Keeps only strong structural edges as thin pale graphite on white paper.
 */
function pencilLines(d: Uint8ClampedArray, w: number, h: number): void {
  const gray = new Float32Array(w * h);
  for (let i = 0, p = 0; i < d.length; i += 4, p++) gray[p] = lum(d[i], d[i + 1], d[i + 2]);
  const at = (x: number, y: number) => gray[Math.max(0, Math.min(h - 1, y)) * w + Math.max(0, Math.min(w - 1, x))];

  // Box-blur gray to suppress bark/leaf/micro texture before edges.
  const blur = new Float32Array(w * h);
  const r = 1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let sum = 0;
      let n = 0;
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          sum += at(x + dx, y + dy);
          n++;
        }
      }
      blur[y * w + x] = sum / n;
    }
  }
  const bAt = (x: number, y: number) => blur[y * w + x];

  const magMap = new Float32Array(w * h);
  let magMax = 1;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const gx =
        -bAt(x - 1, y - 1) - 2 * bAt(x - 1, y) - bAt(x - 1, y + 1) +
        bAt(x + 1, y - 1) + 2 * bAt(x + 1, y) + bAt(x + 1, y + 1);
      const gy =
        -bAt(x - 1, y - 1) - 2 * bAt(x, y - 1) - bAt(x + 1, y - 1) +
        bAt(x - 1, y + 1) + 2 * bAt(x, y + 1) + bAt(x + 1, y + 1);
      const mag = Math.sqrt(gx * gx + gy * gy);
      magMap[y * w + x] = mag;
      if (mag > magMax) magMax = mag;
    }
  }

  // Keep only the strongest structural edges.
  const edgeThreshold = magMax * 0.38;
  // Legible graphite on paper — dark enough to read, not near-white.
  const maxLineDarkness = 95;
  const paper = 248; // lightly warm off-white (R=G=B here; warm tint applied below)
  const out = new Uint8ClampedArray(d.length);

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      let val = paper;
      const mag = magMap[y * w + x];
      if (mag > edgeThreshold) {
        // Thin: require local maximum along gradient-ish neighborhood.
        const nMag = magMap[y * w + Math.min(w - 1, x + 1)];
        const sMag = magMap[Math.min(h - 1, y + 1) * w + x];
        if (mag >= nMag * 0.92 && mag >= sMag * 0.92) {
          const strength = Math.min(1, (mag - edgeThreshold) / (magMax * 0.35));
          val = paper - strength * maxLineDarkness;
        }
      }
      // Slightly warm paper; cool-gray graphite lines.
      out[i] = Math.min(255, val + (val >= paper - 2 ? 4 : 0));
      out[i + 1] = Math.min(255, val + (val >= paper - 2 ? 2 : 0));
      out[i + 2] = val >= paper - 2 ? val - 2 : val;
      out[i + 3] = 255;
    }
  }
  d.set(out);
}

/** Posterize to a few light-neutral value masses (value study). */
function posterizeGrayLight(d: Uint8ClampedArray, levels: number): void {
  const step = 255 / (levels - 1);
  for (let i = 0; i < d.length; i += 4) {
    const g = lum(d[i], d[i + 1], d[i + 2]);
    // Bias toward lighter paper — never go darker than ~mid gray.
    const lifted = g + (255 - g) * 0.35;
    const q = Math.round(lifted / step) * step;
    const soft = Math.max(q, 160);
    d[i] = d[i + 1] = d[i + 2] = soft;
  }
}

/**
 * Overlay pale transparent color groups from the master onto a sketch/value
 * foundation, retaining dark-enough construction lines and white paper.
 */
function paleWashOverFoundation(
  foundation: Uint8ClampedArray,
  master: Uint8ClampedArray,
  washStrength: number,
): void {
  for (let i = 0; i < foundation.length; i += 4) {
    const fr = foundation[i];
    const fg = foundation[i + 1];
    const fb = foundation[i + 2];
    const line = lum(fr, fg, fb);

    // Preserve graphite-ish dark lines from the foundation.
    if (line < 210) {
      foundation[i] = fr;
      foundation[i + 1] = fg;
      foundation[i + 2] = fb;
      continue;
    }

    const mr = master[i];
    const mg = master[i + 1];
    const mb = master[i + 2];
    // Dilute master color toward white (transparent wash).
    const washR = mr + (255 - mr) * (1 - washStrength);
    const washG = mg + (255 - mg) * (1 - washStrength);
    const washB = mb + (255 - mb) * (1 - washStrength);

    // Only tint paper-ish pixels; leave pure whites mostly alone.
    const paper = line > 245 ? 0.35 : 1;
    const t = washStrength * paper;
    foundation[i] = fr + (washR - fr) * t;
    foundation[i + 1] = fg + (washG - fg) * t;
    foundation[i + 2] = fb + (washB - fb) * t;
  }
}

function blendTowardMaster(
  foundation: Uint8ClampedArray,
  master: Uint8ClampedArray,
  amount: number,
): void {
  for (let i = 0; i < foundation.length; i += 4) {
    for (let c = 0; c < 3; c++) {
      foundation[i + c] = foundation[i + c] + (master[i + c] - foundation[i + c]) * amount;
    }
  }
}

async function imageDataFromUrl(src: string): Promise<{
  data: ImageData;
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}> {
  const dataUrl = await toDataUrl(src);
  const img = await loadImage(dataUrl);
  const w = img.naturalWidth || img.width;
  const h = img.naturalHeight || img.height;
  const { canvas, ctx } = makeContext(w, h);
  ctx.drawImage(img, 0, 0, w, h);
  return { data: ctx.getImageData(0, 0, w, h), canvas, ctx, w, h };
}

/**
 * Render a deterministic, stage-appropriate fallback.
 * `precedingDataUrl` (when provided) is the prior stage in the chain.
 */
export async function buildStageFallback(
  masterDataUrl: string,
  stageId: StageId,
  precedingDataUrl?: string | null,
): Promise<string> {
  const master = await imageDataFromUrl(masterDataUrl);
  const { canvas, ctx, w, h } = master;
  const d = master.data.data;

  if (stageId === "finished") {
    ctx.putImageData(master.data, 0, 0);
    return canvas.toDataURL("image/png");
  }

  if (stageId === "pencil-sketch") {
    pencilLines(d, w, h);
    ctx.putImageData(master.data, 0, 0);
    return canvas.toDataURL("image/png");
  }

  // Prefer building from the preceding stage when available.
  let foundation = master.data;
  if (precedingDataUrl) {
    const prev = await imageDataFromUrl(precedingDataUrl);
    // Match dimensions to master canvas.
    if (prev.w === w && prev.h === h) {
      foundation = prev.data;
    } else {
      const { ctx: x2 } = makeContext(w, h);
      const img = await loadImage(await toDataUrl(precedingDataUrl));
      x2.drawImage(img, 0, 0, w, h);
      foundation = x2.getImageData(0, 0, w, h);
    }
  }

  const fd = foundation.data;
  const md = new Uint8ClampedArray(d); // master pixels snapshot

  switch (stageId) {
    case "value-study": {
      // Start from sketch-like foundation when present; else from master.
      if (!precedingDataUrl) {
        pencilLines(fd, w, h);
      }
      // Soft value masses from master luminances, kept light.
      const tmp = new Uint8ClampedArray(md);
      posterizeGrayLight(tmp, 4);
      for (let i = 0; i < fd.length; i += 4) {
        const line = lum(fd[i], fd[i + 1], fd[i + 2]);
        if (line < 210) continue; // keep sketch lines
        const g = tmp[i];
        fd[i] = fd[i + 1] = fd[i + 2] = Math.max(line * 0.15 + g * 0.85, 170);
      }
      break;
    }
    case "first-wash": {
      if (!precedingDataUrl) {
        pencilLines(fd, w, h);
      }
      paleWashOverFoundation(fd, md, 0.28);
      break;
    }
    case "second-wash": {
      if (precedingDataUrl) {
        paleWashOverFoundation(fd, md, 0.22);
        blendTowardMaster(fd, md, 0.22);
      } else {
        desaturateLighten(fd, 0.65, 0.25);
      }
      break;
    }
    case "refinement": {
      if (precedingDataUrl) {
        blendTowardMaster(fd, md, 0.45);
      } else {
        desaturateLighten(fd, 0.88, 0.08);
      }
      break;
    }
    default:
      break;
  }

  ctx.putImageData(foundation, 0, 0);
  return canvas.toDataURL("image/png");
}
