export type TutorialImageDetail = "high" | "auto" | "low";

/** Decoded reference size accepted by lesson creation. Matches the client picker. */
export const MAX_TUTORIAL_UPLOAD_BYTES = 10 * 1024 * 1024;

const DEFAULT_TUTORIAL_MODEL = "gpt-5-mini";
const DEFAULT_IMAGE_DETAIL: TutorialImageDetail = "high";

export function parseTutorialImageDetail(
  value: string | undefined | null,
): TutorialImageDetail {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (normalized === "high" || normalized === "auto" || normalized === "low") {
    return normalized;
  }
  return DEFAULT_IMAGE_DETAIL;
}

export function resolveTutorialModel(env?: {
  OPENAI_TUTORIAL_MODEL?: string;
  OPENAI_MODEL?: string;
}): string {
  const source = env ?? process.env;
  const tutorial = source.OPENAI_TUTORIAL_MODEL?.trim();
  if (tutorial) return tutorial;
  const shared = source.OPENAI_MODEL?.trim();
  if (shared) return shared;
  return DEFAULT_TUTORIAL_MODEL;
}

export function approximateIncomingImageBytes(imageDataUrl: string): {
  incomingImageDataUrlChars: number;
  approximateIncomingImageBytes: number;
} {
  const comma = imageDataUrl.indexOf(",");
  const payload = comma >= 0 ? imageDataUrl.slice(comma + 1) : "";
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return {
    incomingImageDataUrlChars: imageDataUrl.length,
    approximateIncomingImageBytes: Math.max(0, Math.floor((payload.length * 3) / 4) - padding),
  };
}

export function tutorialUploadExceedsLimit(imageDataUrl: string): boolean {
  return approximateIncomingImageBytes(imageDataUrl).approximateIncomingImageBytes > MAX_TUTORIAL_UPLOAD_BYTES;
}
