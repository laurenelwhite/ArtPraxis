/**
 * Unit tests for adaptive branding helpers.
 * Run: npx --yes tsx --test tests/branding.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  pickAccentFromImageData,
  BRAND_NAVY,
  rgbToHex,
} from "../src/lib/branding/accent-color";
import {
  buildBrandTheme,
  resolveBrushTexture,
  resolveSchemaMedium,
  FIXED_MEDIUM_ACCENTS,
} from "../src/lib/branding/brand-theme";

function solidImageData(r: number, g: number, b: number, size = 32): ImageData {
  const data = new Uint8ClampedArray(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    const o = i * 4;
    data[o] = r;
    data[o + 1] = g;
    data[o + 2] = b;
    data[o + 3] = 255;
  }
  // ImageData may be unavailable in some Node versions — construct a compatible shape.
  if (typeof ImageData !== "undefined") {
    return new ImageData(data, size, size);
  }
  return { data, width: size, height: size, colorSpace: "srgb" } as ImageData;
}

describe("pickAccentFromImageData", () => {
  it("falls back to navy for white/paper", () => {
    assert.equal(pickAccentFromImageData(solidImageData(250, 248, 240)), BRAND_NAVY);
  });

  it("falls back to navy for gray", () => {
    assert.equal(pickAccentFromImageData(solidImageData(140, 140, 140)), BRAND_NAVY);
  });

  it("picks a saturated midtone hue", () => {
    const accent = pickAccentFromImageData(solidImageData(180, 48, 52));
    assert.notEqual(accent, BRAND_NAVY);
    assert.ok(accent.startsWith("#"));
    // Should stay in the red family
    assert.ok(accent.slice(1, 3) > accent.slice(3, 5));
  });
});

describe("resolveBrushTexture / medium aliases", () => {
  it("maps graphite → pencil and ink → pen", () => {
    assert.equal(resolveBrushTexture("graphite"), "pencil");
    assert.equal(resolveBrushTexture("ink"), "pen");
  });

  it("maps gouache texture without inventing a schema medium", () => {
    assert.equal(resolveBrushTexture("gouache"), "gouache");
    assert.equal(resolveSchemaMedium("gouache"), "acrylic");
  });
});

describe("buildBrandTheme", () => {
  it("ignores extracted color for charcoal/pencil/pen", () => {
    const charcoal = buildBrandTheme({ medium: "charcoal", accentColor: "#FF0000" });
    assert.equal(charcoal.accentColor, FIXED_MEDIUM_ACCENTS.charcoal);

    const pencil = buildBrandTheme({ medium: "pencil", accentColor: "#00FF00" });
    assert.equal(pencil.accentColor, FIXED_MEDIUM_ACCENTS.pencil);

    const pen = buildBrandTheme({ medium: "pen", accentColor: "#0000FF" });
    assert.equal(pen.accentColor, FIXED_MEDIUM_ACCENTS.pen);
  });

  it("uses extracted accent for watercolor", () => {
    const theme = buildBrandTheme({
      medium: "watercolor",
      accentColor: "#C45A3A",
      sourceMasterUrl: "https://example.com/master.webp",
    });
    assert.equal(theme.accentColor, "#C45A3A");
    assert.equal(theme.brushTexture, "watercolor");
    assert.equal(theme.cssVariables["--ap-brush-accent"], "#C45A3A");
  });

  it("exports rgb helpers used by extraction", () => {
    assert.equal(rgbToHex({ r: 13, g: 27, b: 42 }), "#0D1B2A");
  });
});
