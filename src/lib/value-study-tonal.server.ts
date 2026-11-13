import "server-only";

import sharp from "sharp";
import {
  analyzeValueStudyTonal,
  type ValueStudyTonalMetrics,
} from "@/lib/value-study-tonal";

function parseDataUrl(dataUrl: string): Buffer {
  const m = /^data:([^;]+);base64,(.+)$/i.exec(dataUrl);
  if (!m) throw new Error("Expected a base64 data URL");
  return Buffer.from(m[2], "base64");
}

/** Server-side tonal QA for value-study candidates (sharp → RGBA → metrics). */
export async function measureValueStudyTonal(
  imageDataUrl: string,
): Promise<ValueStudyTonalMetrics> {
  const input = parseDataUrl(imageDataUrl);
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const rgba = new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  // denser sample for smaller images
  const stride = info.width * info.height > 400_000 ? 8 : 4;
  return analyzeValueStudyTonal(rgba, { stride });
}
