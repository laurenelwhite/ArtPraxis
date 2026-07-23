/**
 * Pixel/structure similarity between consecutive stage images.
 * Independent of the master — measures whether the candidate still shares
 * the prior stage’s spatial structure.
 */

import "server-only";

import sharp from "sharp";

export interface StructureSimilarityResult {
  /** 0–1, higher = more similar structure (edge-map correlation). */
  score: number;
  /** Mean absolute luminance difference on a shared downscale (0–255). */
  mae: number;
  width: number;
  height: number;
}

const GRID = 64;

function correlation(a: Float32Array, b: Float32Array): number {
  let sumA = 0;
  let sumB = 0;
  const n = a.length;
  for (let i = 0; i < n; i++) {
    sumA += a[i];
    sumB += b[i];
  }
  const meanA = sumA / n;
  const meanB = sumB / n;
  let num = 0;
  let denA = 0;
  let denB = 0;
  for (let i = 0; i < n; i++) {
    const da = a[i] - meanA;
    const db = b[i] - meanB;
    num += da * db;
    denA += da * da;
    denB += db * db;
  }
  const den = Math.sqrt(denA * denB);
  if (den < 1e-6) return 0;
  return Math.max(0, Math.min(1, (num / den + 1) / 2)); // map [-1,1] → [0,1]
}

async function edgeField(dataUrl: string): Promise<{
  edges: Float32Array;
  luma: Float32Array;
  width: number;
  height: number;
}> {
  const m = /^data:image\/\w+;base64,(.+)$/.exec(dataUrl);
  if (!m) throw new Error("structureSimilarity expects a data URL");
  const buf = Buffer.from(m[1], "base64");
  const { data, info } = await sharp(buf)
    .rotate()
    .resize(GRID, GRID, { fit: "fill" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const luma = new Float32Array(w * h);
  for (let i = 0; i < luma.length; i++) luma[i] = data[i];

  const edges = new Float32Array(w * h);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const gx = luma[i + 1] - luma[i - 1];
      const gy = luma[i + w] - luma[i - w];
      edges[i] = Math.sqrt(gx * gx + gy * gy);
    }
  }
  return { edges, luma, width: w, height: h };
}

/** Compare prior-stage structure to a candidate. */
export async function structureSimilarity(
  priorDataUrl: string,
  candidateDataUrl: string,
): Promise<StructureSimilarityResult> {
  const a = await edgeField(priorDataUrl);
  const b = await edgeField(candidateDataUrl);
  const score = correlation(a.edges, b.edges);
  let mae = 0;
  for (let i = 0; i < a.luma.length; i++) {
    mae += Math.abs(a.luma[i] - b.luma[i]);
  }
  mae /= a.luma.length;
  return { score, mae, width: a.width, height: a.height };
}

/**
 * Minimum edge-structure correlation vs the prior stage.
 * Early stages must stay very close; later stages may diverge more as paint
 * accumulates, but still cannot reinvent the layout.
 */
export function minStructureScoreForStage(stageId: string): number {
  switch (stageId) {
    case "value-study":
      return 0.62;
    case "first-wash":
      return 0.55;
    case "second-wash":
      return 0.48;
    case "refinement":
      return 0.42;
    default:
      return 0.5;
  }
}

export function isStructureAcceptable(
  stageId: string,
  result: StructureSimilarityResult,
): boolean {
  return result.score >= minStructureScoreForStage(stageId);
}
