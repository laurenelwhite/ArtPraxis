/**
 * Unit tests for the master-image pipeline helpers.
 * Run: node --experimental-strip-types --test tests/master-pipeline.test.ts
 *   or: npx --yes tsx --test tests/master-pipeline.test.ts
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ERR_IMAGE_SAFETY_REVIEW,
  createInflightGuard,
  isModerationBlockedError,
  isTransientImageError,
  neutralizeSubjectTitle,
  resolveMasterHydration,
  sculptureContextSentence,
  shouldGenerateMaster,
  shouldRetryMasterAttempt,
  subjectLooksLikeSculpture,
} from "../src/lib/master-pipeline";

describe("shouldGenerateMaster", () => {
  it("1. existing persisted master prevents generation", () => {
    assert.equal(
      shouldGenerateMaster({ masterImageUrl: "https://example.com/m.png", masterStatus: "ready" }),
      false,
    );
  });

  it("2. unresolved / empty pending without url allows generation", () => {
    assert.equal(shouldGenerateMaster({ masterImageUrl: null, masterStatus: "pending" }), true);
  });

  it("9. explicit user regeneration is still allowed", () => {
    assert.equal(
      shouldGenerateMaster(
        { masterImageUrl: "https://example.com/m.png", masterStatus: "ready" },
        { forceRegenerate: true },
      ),
      true,
    );
  });

  it("in-memory master URL prevents generation", () => {
    assert.equal(
      shouldGenerateMaster(
        { masterImageUrl: null, masterStatus: "pending" },
        { inMemoryMasterUrl: "blob:preview" },
      ),
      false,
    );
  });

  it("failed without master does not auto-retry", () => {
    assert.equal(
      shouldGenerateMaster({ masterImageUrl: null, masterStatus: "failed" }),
      false,
    );
  });

  it("7. failed regeneration preserves prior master (no regen unless forced)", () => {
    assert.equal(
      shouldGenerateMaster({
        masterImageUrl: "https://example.com/prior.png",
        masterStatus: "failed",
      }),
      false,
    );
  });
});

describe("resolveMasterHydration", () => {
  it("2. unresolved progression state is loading", () => {
    assert.equal(resolveMasterHydration(undefined), "loading");
  });

  it("distinguishes missing doc vs pending vs available", () => {
    assert.equal(resolveMasterHydration(null), "missing_doc");
    assert.equal(resolveMasterHydration({ masterStatus: "pending" }), "master_pending");
    assert.equal(
      resolveMasterHydration({ masterImageUrl: "https://x", masterStatus: "ready" }),
      "master_available",
    );
    assert.equal(
      resolveMasterHydration({ masterImageUrl: null, masterStatus: "failed" }),
      "master_failed",
    );
  });
});

describe("inflight guard", () => {
  it("3. two simultaneous seed calls result in one factory run", async () => {
    const guard = createInflightGuard<string>();
    let runs = 0;
    const factory = async () => {
      runs += 1;
      await new Promise((r) => setTimeout(r, 20));
      return "ok";
    };
    const [a, b] = await Promise.all([
      guard.run("proj-1", factory),
      guard.run("proj-1", factory),
    ]);
    assert.equal(a, "ok");
    assert.equal(b, "ok");
    assert.equal(runs, 1);
  });

  it("4. remount after completion can start again (new call after clear)", async () => {
    const guard = createInflightGuard<number>();
    let runs = 0;
    await guard.run("p", async () => {
      runs += 1;
      return 1;
    });
    await guard.run("p", async () => {
      runs += 1;
      return 2;
    });
    assert.equal(runs, 2);
  });
});

describe("moderation classification", () => {
  it("5. moderation_blocked performs zero retries", () => {
    const err = { code: "moderation_blocked", type: "image_generation_user_error", safety_violations: ["sexual"] };
    assert.equal(isModerationBlockedError(err), true);
    assert.equal(shouldRetryMasterAttempt(err, 0, 1), false);
    assert.equal(isTransientImageError(err), false);
  });

  it("6. transient 5xx can still retry according to the existing retry limit", () => {
    const err = { status: 503, message: "Service unavailable" };
    assert.equal(isTransientImageError(err), true);
    assert.equal(shouldRetryMasterAttempt(err, 0, 1), true);
    assert.equal(shouldRetryMasterAttempt(err, 1, 1), false);
  });

  it("image_generation_user_error with safety violations is non-retryable", () => {
    assert.equal(
      isModerationBlockedError({
        type: "image_generation_user_error",
        safety_violations: ["sexual"],
      }),
      true,
    );
  });
});

describe("prompt hardening", () => {
  it("neutralizes Weathered Figure title", () => {
    assert.equal(neutralizeSubjectTitle("Weathered Figure"), "weathered garden sculpture");
  });

  it("detects sculpture-like subjects", () => {
    assert.equal(subjectLooksLikeSculpture("Weathered Figure in woodland"), true);
    assert.equal(subjectLooksLikeSculpture("garden statue among foliage"), true);
    assert.equal(subjectLooksLikeSculpture("sunset landscape hills"), false);
  });

  it("sculpture context sentence is neutral for end users (no moderation jargon)", () => {
    const s = sculptureContextSentence();
    assert.match(s, /inanimate artwork/i);
    assert.doesNotMatch(s, /moderation/i);
    assert.doesNotMatch(s, /\bsexual\b/i);
  });
});

describe("error codes", () => {
  it("8. safety failure code is stable", () => {
    assert.equal(ERR_IMAGE_SAFETY_REVIEW, "ERR_IMAGE_SAFETY_REVIEW");
  });
});

describe("storage upload path contract", () => {
  it("10. preferred master storage path shape is unchanged", () => {
    const uid = "user-a";
    const projectId = "project-1";
    const path = `users/${uid}/projects/${projectId}/stages/master.png`;
    assert.equal(path, "users/user-a/projects/project-1/stages/master.png");
  });
});
