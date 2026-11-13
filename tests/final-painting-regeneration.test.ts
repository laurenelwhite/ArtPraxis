import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  checklistPhaseForState,
  formatRegenerationElapsed,
  idleRegenerationFields,
  isRegenerationBusy,
  normalizeRegenerationState,
  regenerationStatusCopy,
} from "../src/lib/final-painting-regeneration";

describe("final-painting-regeneration", () => {
  it("treats queued/generating/validating/applying as busy", () => {
    assert.equal(isRegenerationBusy("queued"), true);
    assert.equal(isRegenerationBusy("generating"), true);
    assert.equal(isRegenerationBusy("validating"), true);
    assert.equal(isRegenerationBusy("applying"), true);
    assert.equal(isRegenerationBusy("candidateReady"), false);
    assert.equal(isRegenerationBusy("idle"), false);
    assert.equal(isRegenerationBusy("error"), false);
  });

  it("maps states to checklist phases without inventing percentages", () => {
    assert.equal(checklistPhaseForState("queued"), "studying");
    assert.equal(checklistPhaseForState("generating"), "creating");
    assert.equal(checklistPhaseForState("validating"), "checking");
    assert.equal(checklistPhaseForState("applying"), "preparing");
    assert.equal(checklistPhaseForState("generating", "checking"), "checking");
  });

  it("uses medium-aware generating copy", () => {
    const pastel = regenerationStatusCopy("generating", "pastel");
    assert.match(pastel.title, /pastel/i);
    assert.match(pastel.reassurance, /current lesson stays available/i);

    const error = regenerationStatusCopy("error");
    assert.match(error.title, /unchanged/i);
  });

  it("hides elapsed until the 15s threshold", () => {
    const started = 1_000_000;
    assert.equal(formatRegenerationElapsed(started, started + 14_000), null);
    assert.equal(formatRegenerationElapsed(started, started + 15_000), "Working for 15s");
    assert.equal(formatRegenerationElapsed(started, started + 72_000), "Working for 1m 12s");
  });

  it("normalizes unknown regeneration state to idle", () => {
    assert.equal(normalizeRegenerationState("nope"), "idle");
    assert.equal(normalizeRegenerationState("candidateReady"), "candidateReady");
    assert.equal(idleRegenerationFields().regenerationState, "idle");
    assert.equal(idleRegenerationFields().candidateFinalPaintingUrl, null);
  });
});
