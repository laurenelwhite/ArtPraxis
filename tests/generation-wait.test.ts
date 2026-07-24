import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CREATE_WAIT,
  MASTER_WAIT,
  creatingPipelineIndex,
  estimateRemainingSec,
  expectedWaitFill,
  formatRangeEstimate,
  formatRemainingCopy,
  formatWaitClock,
  getMasterWaitPipeline,
  masterPipelineIndex,
} from "../src/lib/generation-wait";

describe("generation-wait", () => {
  it("formats clocks and range copy", () => {
    assert.equal(formatWaitClock(0), "0:00");
    assert.equal(formatWaitClock(65), "1:05");
    assert.equal(formatRangeEstimate(MASTER_WAIT), "Usually 40–62 seconds");
  });

  it("advances master pipeline across the historical window", () => {
    assert.equal(masterPipelineIndex(0), 0);
    assert.equal(masterPipelineIndex(10), 1);
    assert.equal(masterPipelineIndex(30), 2);
    assert.equal(masterPipelineIndex(50), 3);
  });

  it("advances creating pipeline", () => {
    assert.equal(creatingPipelineIndex(0), 0);
    assert.equal(creatingPipelineIndex(10), 1);
    assert.equal(creatingPipelineIndex(20), 2);
    assert.equal(creatingPipelineIndex(30), 3);
  });

  it("estimates remaining time without claiming exact completion", () => {
    const mid = estimateRemainingSec(20, MASTER_WAIT);
    assert.ok(mid > 20 && mid < 40);
    assert.match(formatRemainingCopy(20, MASTER_WAIT), /remaining/i);
    assert.match(formatRemainingCopy(55, MASTER_WAIT), /Finishing|longer/i);
  });

  it("keeps expected-wait fill below 100%", () => {
    assert.ok(expectedWaitFill(0, MASTER_WAIT) < 0.1);
    assert.ok(expectedWaitFill(MASTER_WAIT.avgSec, MASTER_WAIT) < 0.95);
    assert.ok(expectedWaitFill(120, CREATE_WAIT) < 1);
  });

  it("builds medium-aware master pipeline labels", () => {
    const paint = getMasterWaitPipeline("painting");
    assert.equal(paint[1]?.label, "Creating master painting");
    const draw = getMasterWaitPipeline("drawing");
    assert.equal(draw[1]?.label, "Creating master drawing");
    assert.match(draw[2]?.label ?? "", /drawing steps/);
  });
});
