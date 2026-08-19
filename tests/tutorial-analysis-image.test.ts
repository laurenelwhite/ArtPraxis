import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TUTORIAL_ANALYSIS_MAX_LONG_EDGE,
  estimateDataUrlBytes,
  fitTutorialAnalysisSize,
} from "../src/lib/tutorial-analysis-image";
import {
  parseTutorialImageDetail,
  resolveTutorialModel,
} from "../src/lib/tutorial-generation-config";

describe("fitTutorialAnalysisSize", () => {
  it("keeps landscape orientation and aspect ratio", () => {
    const fit = fitTutorialAnalysisSize(4000, 2000);
    assert.ok(fit.width > fit.height);
    assert.equal(Math.max(fit.width, fit.height), TUTORIAL_ANALYSIS_MAX_LONG_EDGE);
    assert.equal(fit.width / fit.height, 4000 / 2000);
    assert.equal(fit.upscaled, false);
  });

  it("keeps portrait orientation and aspect ratio", () => {
    const fit = fitTutorialAnalysisSize(1200, 2400);
    assert.ok(fit.height > fit.width);
    assert.equal(Math.max(fit.width, fit.height), TUTORIAL_ANALYSIS_MAX_LONG_EDGE);
    assert.equal(fit.width / fit.height, 1200 / 2400);
  });

  it("keeps square images square", () => {
    const fit = fitTutorialAnalysisSize(3000, 3000);
    assert.equal(fit.width, fit.height);
    assert.equal(fit.width, TUTORIAL_ANALYSIS_MAX_LONG_EDGE);
  });

  it("does not upscale images already within the long-edge cap", () => {
    const fit = fitTutorialAnalysisSize(800, 600);
    assert.equal(fit.width, 800);
    assert.equal(fit.height, 600);
    assert.equal(fit.scale, 1);
    assert.equal(fit.upscaled, false);
  });

  it("never exceeds the max long edge", () => {
    const landscape = fitTutorialAnalysisSize(5000, 1000);
    const portrait = fitTutorialAnalysisSize(900, 4000);
    assert.ok(Math.max(landscape.width, landscape.height) <= TUTORIAL_ANALYSIS_MAX_LONG_EDGE);
    assert.ok(Math.max(portrait.width, portrait.height) <= TUTORIAL_ANALYSIS_MAX_LONG_EDGE);
  });
});

describe("estimateDataUrlBytes", () => {
  it("estimates decoded payload size without logging contents", () => {
    const dataUrl = `data:image/webp;base64,${"A".repeat(16)}`;
    assert.equal(estimateDataUrlBytes(dataUrl), 12);
  });
});

describe("tutorial generation config", () => {
  it("defaults image detail to high and rejects unknown values", () => {
    assert.equal(parseTutorialImageDetail(undefined), "high");
    assert.equal(parseTutorialImageDetail("auto"), "auto");
    assert.equal(parseTutorialImageDetail("LOW"), "low");
    assert.equal(parseTutorialImageDetail("medium"), "high");
  });

  it("resolves OPENAI_TUTORIAL_MODEL before OPENAI_MODEL", () => {
    assert.equal(
      resolveTutorialModel({ OPENAI_TUTORIAL_MODEL: "gpt-tutorial", OPENAI_MODEL: "gpt-shared" }),
      "gpt-tutorial",
    );
    assert.equal(resolveTutorialModel({ OPENAI_MODEL: "gpt-shared" }), "gpt-shared");
    assert.equal(resolveTutorialModel({}), "gpt-5-mini");
  });
});
