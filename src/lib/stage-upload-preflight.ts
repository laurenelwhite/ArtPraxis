/**
 * Stage-upload guards that do not read a request body.
 * The allowed bucket is the app's configured Storage bucket. The active bucket
 * is the one on the initialized Firebase app, never a caller-supplied name.
 */

const CONFIGURED_BUCKET =
  /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)(?:\.(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?))+$/;

export type StageBucketRejection = "missing" | "invalid" | "mismatch";

export type StageBucketDecision =
  | { ok: true; bucket: string }
  | { ok: false; code: "ERR_STAGE_BUCKET_MISMATCH"; reason: StageBucketRejection };

export function decideStageUploadBucket(
  activeBucket: string | null | undefined,
  configuredBucket: string | null | undefined,
): StageBucketDecision {
  const configured = typeof configuredBucket === "string" ? configuredBucket.trim() : "";
  if (!configured) {
    return { ok: false, code: "ERR_STAGE_BUCKET_MISMATCH", reason: "missing" };
  }
  if (!isConfiguredStorageBucket(configured)) {
    return { ok: false, code: "ERR_STAGE_BUCKET_MISMATCH", reason: "invalid" };
  }
  const active = typeof activeBucket === "string" ? activeBucket.trim() : "";
  if (active !== configured) {
    return { ok: false, code: "ERR_STAGE_BUCKET_MISMATCH", reason: "mismatch" };
  }
  return { ok: true, bucket: configured };
}

export function stageUploadOwnerMatches(
  authenticatedUid: string | null | undefined,
  pathUid: string,
): boolean {
  return (
    typeof authenticatedUid === "string" &&
    authenticatedUid.length > 0 &&
    authenticatedUid === pathUid
  );
}

export function isConfiguredStorageBucket(value: string): boolean {
  if (value.length > 222 || value.includes("..")) return false;
  if (!value.endsWith(".firebasestorage.app") && !value.endsWith(".appspot.com")) return false;
  return CONFIGURED_BUCKET.test(value);
}
