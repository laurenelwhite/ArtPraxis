/**
 * Unit checks for value-study tonal heuristics (plain Node, no runner).
 * Run: node scripts/test-value-study-tonal.mjs
 *
 * Mirrors src/lib/value-study-tonal.ts — keep thresholds in sync.
 */
import assert from "node:assert/strict";

const DEFAULT = {
  nearWhiteMin: 230,
  darkMax: 110,
  nearBlackMax: 40,
  minNearWhite: 0.42,
  maxDark: 0.15,
  maxNearBlack: 0.02,
  minMeanLuminance: 195,
};

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function analyze(rgba, opts = {}) {
  const t = { ...DEFAULT, ...opts };
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
  const nearWhitePct = nearWhite / n;
  const darkPct = dark / n;
  const nearBlackPct = nearBlack / n;
  const meanLuminance = sum / n;
  const reasons = [];
  if (nearWhitePct < t.minNearWhite) reasons.push("near-white");
  if (darkPct > t.maxDark) reasons.push("dark");
  if (nearBlackPct > t.maxNearBlack) reasons.push("near-black");
  if (meanLuminance < t.minMeanLuminance) reasons.push("mean");
  return {
    nearWhitePct,
    darkPct,
    nearBlackPct,
    meanLuminance,
    passed: reasons.length === 0,
    reasons,
  };
}

function mix(parts) {
  const total = parts.reduce((s, p) => s + p.count, 0);
  const out = new Uint8ClampedArray(total * 4);
  let i = 0;
  for (const p of parts) {
    for (let n = 0; n < p.count; n++) {
      out[i] = p.r;
      out[i + 1] = p.g;
      out[i + 2] = p.b;
      out[i + 3] = 255;
      i += 4;
    }
  }
  return out;
}

{
  const m = analyze(
    mix([
      { r: 250, g: 250, b: 250, count: 55 },
      { r: 210, g: 210, b: 210, count: 20 },
      { r: 170, g: 170, b: 170, count: 18 },
      { r: 95, g: 95, b: 95, count: 7 },
    ]),
    { stride: 1 },
  );
  assert.equal(m.passed, true, `light map should pass: ${m.reasons}`);
}

{
  const out = new Uint8ClampedArray(200 * 4);
  for (let i = 0; i < out.length; i += 4) {
    out[i] = out[i + 1] = out[i + 2] = 70;
    out[i + 3] = 255;
  }
  const m = analyze(out, { stride: 1 });
  assert.equal(m.passed, false, "dark solid should fail");
}

{
  const m = analyze(
    mix([
      { r: 245, g: 245, b: 245, count: 50 },
      { r: 20, g: 20, b: 20, count: 50 },
    ]),
    { stride: 1 },
  );
  assert.equal(m.passed, false, "near-black heavy should fail");
}

console.log("value-study-tonal: all assertions passed");
