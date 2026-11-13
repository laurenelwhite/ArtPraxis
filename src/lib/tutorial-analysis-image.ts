/** Long-edge cap for the vision-analysis image sent to /api/generate-tutorial. */
export const TUTORIAL_ANALYSIS_MAX_LONG_EDGE = 1536;
/** WebP/JPEG quality for analysis only — original File is never recompressed. */
export const TUTORIAL_ANALYSIS_QUALITY = 0.86;

export type TutorialAnalysisFit = {
  width: number;
  height: number;
  scale: number;
  upscaled: boolean;
};

export type TutorialAnalysisImage = {
  dataUrl: string;
  mimeType: string;
  originalWidth: number;
  originalHeight: number;
  outputWidth: number;
  outputHeight: number;
  originalBytes: number;
  encodedBytes: number;
};

/**
 * Fit within maxLongEdge without cropping, distorting, or upscaling.
 * Aspect ratio is preserved.
 */
export function fitTutorialAnalysisSize(
  width: number,
  height: number,
  maxLongEdge: number = TUTORIAL_ANALYSIS_MAX_LONG_EDGE,
): TutorialAnalysisFit {
  const w = Math.max(1, Math.round(width));
  const h = Math.max(1, Math.round(height));
  const longEdge = Math.max(w, h);
  if (!Number.isFinite(longEdge) || longEdge <= 0) {
    return { width: 1, height: 1, scale: 1, upscaled: false };
  }
  if (longEdge <= maxLongEdge) {
    return { width: w, height: h, scale: 1, upscaled: false };
  }
  const scale = maxLongEdge / longEdge;
  return {
    width: Math.max(1, Math.round(w * scale)),
    height: Math.max(1, Math.round(h * scale)),
    scale,
    upscaled: false,
  };
}

export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  const payload = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error("Could not read analysis image."));
    reader.readAsDataURL(blob);
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number,
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

async function decodeForAnalysis(file: File): Promise<{ width: number; height: number; source: CanvasImageSource }> {
  if (typeof createImageBitmap === "function") {
    try {
      const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
      return { width: bitmap.width, height: bitmap.height, source: bitmap };
    } catch {
      /* fall through to HTMLImageElement */
    }
  }

  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Could not decode the reference for tutorial analysis."));
      image.src = url;
    });
    return {
      width: img.naturalWidth || img.width,
      height: img.naturalHeight || img.height,
      source: img,
    };
  } finally {
    URL.revokeObjectURL(url);
  }
}

/**
 * Browser-only: build a downscaled analysis data URL. Does not mutate `file`.
 * Transparent pixels are flattened onto white so WebP/JPEG do not go black.
 */
export async function prepareTutorialAnalysisImage(file: File): Promise<TutorialAnalysisImage> {
  if (typeof document === "undefined") {
    throw new Error("Tutorial analysis images can only be prepared in the browser.");
  }

  const decoded = await decodeForAnalysis(file);
  const fit = fitTutorialAnalysisSize(decoded.width, decoded.height);
  const canvas = document.createElement("canvas");
  canvas.width = fit.width;
  canvas.height = fit.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Could not prepare the tutorial analysis image.");
  }
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, fit.width, fit.height);
  ctx.drawImage(decoded.source, 0, 0, fit.width, fit.height);
  if (typeof ImageBitmap !== "undefined" && decoded.source instanceof ImageBitmap) {
    decoded.source.close();
  }

  let mimeType = "image/webp";
  let blob = await canvasToBlob(canvas, mimeType, TUTORIAL_ANALYSIS_QUALITY);
  if (!blob || blob.size <= 0) {
    mimeType = "image/jpeg";
    blob = await canvasToBlob(canvas, mimeType, TUTORIAL_ANALYSIS_QUALITY);
  }
  if (!blob || blob.size <= 0) {
    throw new Error("Could not encode the tutorial analysis image.");
  }

  const dataUrl = await blobToDataUrl(blob);
  return {
    dataUrl,
    mimeType: blob.type || mimeType,
    originalWidth: decoded.width,
    originalHeight: decoded.height,
    outputWidth: fit.width,
    outputHeight: fit.height,
    originalBytes: file.size,
    encodedBytes: blob.size,
  };
}
