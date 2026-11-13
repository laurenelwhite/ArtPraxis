/**
 * Environment isolation for the configured Firebase project and Storage bucket.
 * No network, Firebase, or OpenAI access.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it } from "node:test";
import { checkConfiguredFirebaseProject } from "../src/lib/firebase-project";
import { allowedStorageBuckets, validateStorageImageUrl } from "../src/lib/server/storage-url";

const STAGING_PROJECT = "artpraxis-staging-33840";
const PRODUCTION_PROJECT = "artpraxis-33840";
const STAGING_BUCKET = "artpraxis-staging-33840.firebasestorage.app";
const PRODUCTION_BUCKET = "artpraxis-33840.firebasestorage.app";

function storageUrl(bucket: string, objectPath: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=abc`;
}

describe("checkConfiguredFirebaseProject", () => {
  it("accepts staging when that project is configured", () => {
    assert.deepEqual(checkConfiguredFirebaseProject(STAGING_PROJECT, STAGING_PROJECT), {
      ok: true,
      projectId: STAGING_PROJECT,
    });
  });

  it("rejects the production project when staging is configured", () => {
    const check = checkConfiguredFirebaseProject(PRODUCTION_PROJECT, STAGING_PROJECT);
    assert.equal(check.ok, false);
    if (!check.ok) assert.equal(check.reason, "mismatch");
  });

  it("fails closed when the configured project is missing or invalid", () => {
    for (const configured of [undefined, "", "   ", "HTTPS://evil", "Bad_Project"]) {
      const check = checkConfiguredFirebaseProject(STAGING_PROJECT, configured);
      assert.equal(check.ok, false, String(configured));
    }
  });
});

describe("staging storage fetch allow-list", () => {
  const stagingEnv = { NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: STAGING_BUCKET };
  const ownPath = "users/user-a/projects/p1/stages/second-wash.webp";

  it("accepts the owner's object in the configured staging bucket", () => {
    const check = validateStorageImageUrl(storageUrl(STAGING_BUCKET, ownPath), {
      uid: "user-a",
      allowedBuckets: allowedStorageBuckets(stagingEnv),
    });
    assert.equal(check.ok, true);
  });

  it("rejects the production bucket and an arbitrary bucket", () => {
    for (const bucket of [PRODUCTION_BUCKET, "evil.firebasestorage.app"]) {
      const check = validateStorageImageUrl(storageUrl(bucket, ownPath), {
        uid: "user-a",
        allowedBuckets: allowedStorageBuckets(stagingEnv),
      });
      assert.equal(check.ok, false, bucket);
      if (!check.ok) assert.equal(check.reason, "bucket_not_allowed");
    }
  });

  it("rejects another user's object in the staging bucket", () => {
    const check = validateStorageImageUrl(
      storageUrl(STAGING_BUCKET, "users/user-b/projects/p1/stages/second-wash.webp"),
      { uid: "user-a", allowedBuckets: allowedStorageBuckets(stagingEnv) },
    );
    assert.equal(check.ok, false);
    if (!check.ok) {
      assert.equal(check.status, 403);
      assert.equal(check.reason, "object_owned_by_another_user");
    }
  });

  it("keeps one staging bucket when server overrides only repeat it", () => {
    const buckets = allowedStorageBuckets({
      ...stagingEnv,
      FIREBASE_STORAGE_BUCKET: STAGING_BUCKET,
      ALLOWED_STORAGE_BUCKETS: ` ${STAGING_BUCKET} `,
    });
    assert.deepEqual([...buckets], [STAGING_BUCKET]);
  });

  it("fails closed when an override adds the production bucket", () => {
    for (const env of [
      { ...stagingEnv, FIREBASE_STORAGE_BUCKET: PRODUCTION_BUCKET },
      { ...stagingEnv, ALLOWED_STORAGE_BUCKETS: `${STAGING_BUCKET},${PRODUCTION_BUCKET}` },
      { FIREBASE_STORAGE_BUCKET: STAGING_BUCKET },
    ]) {
      const buckets = allowedStorageBuckets(env);
      assert.equal(buckets.size, 0);
      const check = validateStorageImageUrl(storageUrl(STAGING_BUCKET, ownPath), {
        uid: "user-a",
        allowedBuckets: buckets,
      });
      assert.equal(check.ok, false);
    }
  });

  it("still allows the owner's object when production is the only configured bucket", () => {
    const check = validateStorageImageUrl(storageUrl(PRODUCTION_BUCKET, "users/user-a/projects/p1/reference.jpg"), {
      uid: "user-a",
      allowedBuckets: allowedStorageBuckets({
        NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: PRODUCTION_BUCKET,
      }),
    });
    assert.equal(check.ok, true);
  });
});

describe("AuthProvider", () => {
  it("warns from the configured project and still subscribes to auth state", () => {
    const source = readFileSync(path.resolve("src/providers/AuthProvider.tsx"), "utf8");
    assert.equal(source.includes(PRODUCTION_PROJECT), false);
    assert.match(source, /checkConfiguredFirebaseProject/);
    assert.match(source, /onAuthStateChanged/);
    assert.doesNotMatch(source, /signInWith|signOut/);
  });
});
