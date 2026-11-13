/**
 * Lightweight tonal distribution checks for instructional value studies.
 * Pure pixel math — usable from Node tests and (via sharp) the API route.
 */

export interface ValueStudyTonalMetrics {
  nearWhitePct: number;
  middlePct: number;
  darkPct: number;
  nearBlackPct: number;
  meanLuminance: number;
  passed: boolean;
  reasons: string[];
}

export interface ValueStudyTonalThresholds {
  /** Luminance >= this counts as near-white paper. */
  nearWhiteMin: number;
  /** Luminance below this counts as dark structure. */
  darkMax: number;
  /** Luminance below this counts as near-black (forbidden). */
  nearBlackMax: number;
  /** Minimum share of near-white pixels (0–1). */
  minNearWhite: number;
  /** Maximum share of dark pixels (0–1). */
  maxDark: number;
  /** Maximum share of near-black pixels (0–1). */
  maxNearBlack: number;
  /** Minimum acceptable mean luminance 0–255. */
  minMeanLuminance: number;
}

export const DEFAULT_VALUE_STUDY_TONAL: ValueStudyTonalThresholds = {
  nearWhiteMin: 230,
  darkMax: 110,
  nearBlackMax: 40,
  minNearWhite: 0.42,
  maxDark: 0.15,
  maxNearBlack: 0.02,
  minMeanLuminance: 195,
};

function luminance(r: number, g: number, b: number): number {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Analyze RGBA buffer (4 bytes per pixel). Sampled every `stride` pixels for speed.
 */
export function analyzeValueStudyTonal(
  rgba: Uint8Array | Uint8ClampedArray,
  opts: Partial<ValueStudyTonalThresholds> & { stride?: number } = {},
): ValueStudyTonalMetrics {
  const t = { ...DEFAULT_VALUE_STUDY_TONAL, ...opts };
  const stride = Math.max(1, opts.stride ?? 4);
  let n = 0;
  let nearWhite = 0;
  let middle = 0;
  let dark = 0;
  let nearBlack = 0;
  let sum = 0;

  for (let i = 0; i + 2 < rgba.length; i += 4 * stride) {
    const y = luminance(rgba[i], rgba[i + 1], rgba[i + 2]);
    sum += y;
    n++;
    if (y >= t.nearWhiteMin) nearWhite++;
    else if (y <= t.nearBlackMax) {
      nearBlack++;
      dark++;
    } else if (y <= t.darkMax) dark++;
    else middle++;
  }

  if (n === 0) {
    return {
      nearWhitePct: 0,
      middlePct: 0,
      darkPct: 0,
      nearBlackPct: 0,
      meanLuminance: 0,
      passed: false,
      reasons: ["Empty image buffer for tonal analysis."],
    };
  }

  const nearWhitePct = nearWhite / n;
  const middlePct = middle / n;
  const darkPct = dark / n;
  const nearBlackPct = nearBlack / n;
  const meanLuminance = sum / n;

  const reasons: string[] = [];
  if (nearWhitePct < t.minNearWhite) {
    reasons.push(
      `Near-white coverage ${(nearWhitePct * 100).toFixed(1)}% below ${(t.minNearWhite * 100).toFixed(0)}% floor.`,
    );
  }
  if (darkPct > t.maxDark) {
    reasons.push(
      `Dark coverage ${(darkPct * 100).toFixed(1)}% above ${(t.maxDark * 100).toFixed(0)}% ceiling.`,
    );
  }
  if (nearBlackPct > t.maxNearBlack) {
    reasons.push(
      `Near-black coverage ${(nearBlackPct * 100).toFixed(1)}% above ${(t.maxNearBlack * 100).toFixed(0)}% ceiling.`,
    );
  }
  if (meanLuminance < t.minMeanLuminance) {
    reasons.push(
      `Mean luminance ${meanLuminance.toFixed(0)} below ${t.minMeanLuminance} (too dark overall).`,
    );
  }

  return {
    nearWhitePct,
    middlePct,
    darkPct,
    nearBlackPct,
    meanLuminance,
    passed: reasons.length === 0,
    reasons,
  };
}
