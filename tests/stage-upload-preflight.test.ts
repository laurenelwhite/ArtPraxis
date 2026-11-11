/**
 * Stage-upload bucket and ownership guards.
 * No network, Firebase, or OpenAI access.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decideStageUploadBucket, stageUploadOwnerMatches } from "../src/lib/stage-upload-preflight";
import { validateStorageImageUrl } from "../src/lib/server/storage-url";

const STAGING_BUCKET = "artpraxis-staging-33840.firebasestorage.app";
const PRODUCTION_BUCKET = "artpraxis-33840.firebasestorage.app";

function storageUrl(objectPath: string, bucket: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=abc`;
}

describe("decideStageUploadBucket", () => {
  it("accepts the configured staging bucket", () => {
    const decision = decideStageUploadBucket(STAGING_BUCKET, STAGING_BUCKET);
    assert.deepEqual(decision, { ok: true, bucket: STAGING_BUCKET });
  });

  it("rejects the production bucket when staging is configured", () => {
    const decision = decideStageUploadBucket(PRODUCTION_BUCKET, STAGING_BUCKET);
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.reason, "mismatch");
  });

  it("rejects an arbitrary bucket when staging is configured", () => {
    const decision = decideStageUploadBucket("evil.firebasestorage.app", STAGING_BUCKET);
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.reason, "mismatch");
  });

  it("fails closed when the configured bucket is missing", () => {
    for (const configured of [undefined, null, "", "   "]) {
      const decision = decideStageUploadBucket(STAGING_BUCKET, configured);
      assert.equal(decision.ok, false);
      if (!decision.ok) assert.equal(decision.reason, "missing");
    }
  });

  it("fails closed when the configured bucket is invalid", () => {
    for (const configured of [
      "artpraxis-staging-33840",
      "https://artpraxis-staging-33840.firebasestorage.app",
      `${STAGING_BUCKET}/users/attacker`,
      `${STAGING_BUCKET},${PRODUCTION_BUCKET}`,
      "not a bucket",
      "EVIL.firebasestorage.app",
    ]) {
      const decision = decideStageUploadBucket(configured, configured);
      assert.equal(decision.ok, false, configured);
      if (!decision.ok) assert.equal(decision.reason, "invalid");
    }
  });

  it("fails closed when the active app bucket is missing", () => {
    const decision = decideStageUploadBucket(null, STAGING_BUCKET);
    assert.equal(decision.ok, false);
    if (!decision.ok) assert.equal(decision.reason, "mismatch");
  });
});

describe("stage upload ownership", () => {
  it("allows the signed-in user to upload on their own path", () => {
    assert.equal(stageUploadOwnerMatches("user-a", "user-a"), true);
  });

  it("rejects a path uid that is not the signed-in user", () => {
    assert.equal(stageUploadOwnerMatches("user-a", "user-b"), false);
    assert.equal(stageUploadOwnerMatches(null, "user-a"), false);
    assert.equal(stageUploadOwnerMatches("", "user-a"), false);
  });

  it("rejects another user's object in the staging bucket", () => {
    const check = validateStorageImageUrl(
      storageUrl("users/user-b/projects/p1/stages/second-wash.webp", STAGING_BUCKET),
      { uid: "user-a", allowedBuckets: new Set([STAGING_BUCKET]) },
    );
    assert.equal(check.ok, false);
    if (!check.ok) {
      assert.equal(check.status, 403);
      assert.equal(check.reason, "object_owned_by_another_user");
    }
  });

  it("accepts the owner's stage image in the staging bucket", () => {
    const check = validateStorageImageUrl(
      storageUrl("users/user-a/projects/p1/stages/second-wash.webp", STAGING_BUCKET),
      { uid: "user-a", allowedBuckets: new Set([STAGING_BUCKET]) },
    );
    assert.equal(check.ok, true);
    if (check.ok) assert.equal(check.bucket, STAGING_BUCKET);
  });

  it("rejects the production bucket for a staging allow-list", () => {
    const check = validateStorageImageUrl(
      storageUrl("users/user-a/projects/p1/stages/second-wash.webp", PRODUCTION_BUCKET),
      { uid: "user-a", allowedBuckets: new Set([STAGING_BUCKET]) },
    );
    assert.equal(check.ok, false);
    if (!check.ok) assert.equal(check.reason, "bucket_not_allowed");
  });
});
