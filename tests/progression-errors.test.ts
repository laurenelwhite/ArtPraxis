/**
 * Tests for progression error normalization + retry classification.
 * Run: npm run test:progression-errors
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildApiErrorDetails,
  buildFailedStagePatch,
  classifyApiRetryability,
  classifyStorageRetryability,
  createProgressionThrownError,
  normalizeProgressionError,
  parseApiErrorBody,
  sanitizeProgressionLogObject,
} from "../src/lib/progression-errors";

describe("normalizeProgressionError", () => {
  it("1. serializes FirebaseError-like non-enumerable properties", () => {
    const err = new Error("User does not have permission");
    Object.defineProperty(err, "code", {
      value: "storage/unauthorized",
      enumerable: false,
    });
    Object.defineProperty(err, "name", {
      value: "FirebaseError",
      enumerable: false,
      writable: true,
    });

    const json = JSON.stringify(err);
    assert.equal(json, "{}");

    const normalized = normalizeProgressionError(err, {
      operation: "upload-stage-image",
      stageId: "second-wash",
      projectId: "proj-1",
    });
    assert.equal(normalized.code, "storage/unauthorized");
    assert.match(normalized.message, /permission/i);
    assert.equal(normalized.retryable, false);
    assert.equal(normalized.operation, "upload-stage-image");
    assert.equal(normalized.stageId, "second-wash");
    assert.notEqual(JSON.stringify(normalized), "{}");
  });

  it("2. normalizes a plain Error", () => {
    const normalized = normalizeProgressionError(new Error("boom"), {
      operation: "seed-stage-preview",
    });
    assert.equal(normalized.message, "boom");
    assert.equal(normalized.name, "Error");
    assert.equal(normalized.operation, "seed-stage-preview");
  });

  it("3. unknown object does not become {} or [object Object]", () => {
    const normalized = normalizeProgressionError({});
    assert.equal(normalized.message, "Unknown progression error");
    assert.notEqual(normalized.message, "[object Object]");
    assert.notEqual(normalized.message, "{}");
  });

  it("4. nested cause code/message is preserved", () => {
    const cause = Object.assign(new Error("inner storage failure"), {
      code: "storage/unauthorized",
    });
    const outer = Object.assign(new Error("Failed to upload"), { cause });
    const normalized = normalizeProgressionError(outer, {
      operation: "seed-stage-preview",
      stageId: "refinement",
    });
    assert.equal(normalized.code, "storage/unauthorized");
    assert.match(normalized.message, /Failed to upload|inner storage/i);
    assert.equal(normalized.details?.cause?.code, "storage/unauthorized");
  });
});

describe("classifyStorageRetryability", () => {
  it("6. storage/unauthorized is non-retryable", () => {
    assert.equal(classifyStorageRetryability("storage/unauthorized"), false);
  });

  it("7. storage/unknown without network evidence is non-retryable", () => {
    assert.equal(classifyStorageRetryability("storage/unknown", "something went wrong"), false);
  });

  it("8. network timeout is retryable", () => {
    assert.equal(
      classifyStorageRetryability("storage/unknown", "network timeout ETIMEDOUT"),
      true,
    );
    assert.equal(classifyStorageRetryability(null, "Failed to fetch"), true);
  });
});

describe("upload / seed failure patches", () => {
  it("5. upload failure details include storage path, UID, blob size, MIME", () => {
    const firebaseLike = Object.assign(new Error("Permission denied."), {
      code: "storage/unauthorized",
      name: "FirebaseError",
    });
    const normalized = normalizeProgressionError(firebaseLike, {
      operation: "upload-stage-image",
      projectId: "p1",
      stageId: "second-wash",
    });
    const details = sanitizeProgressionLogObject({
      ...normalized,
      storagePath: "users/uid-a/projects/p1/stages/second-wash.png",
      authenticatedUid: "uid-a",
      expectedUid: "uid-a",
      blobSizeBytes: 12345,
      blobType: "image/png",
      dataUrlPrefix: "data:image/png;base64,AAAA",
    });
    assert.equal(details.storagePath, "users/uid-a/projects/p1/stages/second-wash.png");
    assert.equal(details.authenticatedUid, "uid-a");
    assert.equal(details.blobSizeBytes, 12345);
    assert.equal(details.blobType, "image/png");
    assert.equal(details.code, "storage/unauthorized");
  });

  it("9. seed failure for second-wash persists readable code and message", () => {
    const err = createProgressionThrownError("User does not have permission to access this object.", {
      name: "StageUploadError",
      code: "storage/unauthorized",
      retryable: false,
      uploadDetails: {
        storagePath: "users/u/projects/p/stages/second-wash.png",
        blobSizeBytes: 10,
      },
    });
    const normalized = normalizeProgressionError(err, {
      operation: "seed-stage-preview",
      stageId: "second-wash",
      projectId: "p",
      source: "reference",
    });
    const patch = buildFailedStagePatch(normalized, {
      source: "reference",
      userFacingError: "Couldn’t save this demonstration. Please retry.",
      retryCount: 1,
      preserveTargetUrl: null,
    });
    assert.equal(patch.generationStatus, "failed");
    assert.equal(patch.errorCode, "storage/unauthorized");
    assert.match(patch.errorMessage, /permission/i);
    assert.equal(patch.retryable, false);
    assert.equal(patch.failureSource, "reference");
  });

  it("10. seed failure for refinement exits working state", () => {
    const normalized = normalizeProgressionError(
      Object.assign(new Error("upload failed"), { code: "storage/unauthorized" }),
      { operation: "seed-stage-preview", stageId: "refinement", source: "reference" },
    );
    const patch = buildFailedStagePatch(normalized, {
      source: "reference",
      retryCount: 1,
    });
    assert.equal(patch.generationStatus, "failed");
    assert.notEqual(patch.generationStatus, "generating");
    assert.notEqual(patch.generationStatus, "pending");
    assert.ok(typeof patch.failedAt === "number");
  });

  it("11. deterministic preview URL is preserved after upload failure", () => {
    const normalized = normalizeProgressionError(
      Object.assign(new Error("upload failed"), { code: "storage/unauthorized" }),
      { operation: "seed-stage-preview", stageId: "second-wash" },
    );
    const prior = "https://example.com/prior-preview.png";
    const patch = buildFailedStagePatch(normalized, {
      preserveTargetUrl: prior,
      source: "reference",
    });
    assert.equal(patch.targetImageUrl, prior);
    assert.equal(patch.generationStatus, "failed");
  });
});

describe("callApi / API body parsing", () => {
  it("12. parses JSON error body", () => {
    const parsed = parseApiErrorBody(
      JSON.stringify({
        error: "We couldn’t create the painted version of this reference.",
        code: "ERR_IMAGE_SAFETY_REVIEW",
        retryable: false,
        requestId: "req_123",
      }),
      422,
    );
    assert.equal(parsed.code, "ERR_IMAGE_SAFETY_REVIEW");
    assert.equal(parsed.retryable, false);
    assert.equal(parsed.requestId, "req_123");
    assert.match(parsed.message, /couldn’t create/i);
  });

  it("13. safely handles non-JSON error body", () => {
    const parsed = parseApiErrorBody("<html>Bad Gateway</html>", 502);
    assert.equal(parsed.body, null);
    assert.match(parsed.message, /Bad Gateway|502/i);
    assert.equal(parsed.retryable, true);
  });

  it("14. API 422 safety review is non-retryable", () => {
    assert.equal(classifyApiRetryability(422, "ERR_IMAGE_SAFETY_REVIEW"), false);
    const parsed = parseApiErrorBody(
      JSON.stringify({ error: "blocked", code: "ERR_IMAGE_SAFETY_REVIEW" }),
      422,
    );
    assert.equal(parsed.retryable, false);
  });

  it("15. API 502 is retryable", () => {
    assert.equal(classifyApiRetryability(502, "ERR_STAGE_GENERATE"), true);
    const parsed = parseApiErrorBody(
      JSON.stringify({
        error: "Image generation temporarily failed.",
        code: "ERR_STAGE_GENERATE",
        retryable: true,
      }),
      502,
    );
    assert.equal(parsed.retryable, true);
  });

  it("16. detailed API error survives orchestration rethrow", () => {
    const parsed = parseApiErrorBody(
      JSON.stringify({
        error: "Image generation temporarily failed.",
        code: "ERR_MASTER_GENERATE",
        retryable: true,
        requestId: "abc",
      }),
      502,
    );
    const apiDetails = buildApiErrorDetails({
      status: 502,
      statusText: "Bad Gateway",
      mode: "master",
      stageId: null,
      projectId: "p1",
      parsed,
    });
    const thrown = createProgressionThrownError(parsed.message, {
      name: "ProgressionApiError",
      code: parsed.code,
      status: 502,
      retryable: parsed.retryable,
      apiDetails,
    });
    const afterRethrow = normalizeProgressionError(thrown, {
      operation: "orchestrate-progression",
      projectId: "p1",
    });
    assert.equal(afterRethrow.code, "ERR_MASTER_GENERATE");
    assert.equal(afterRethrow.retryable, true);
    assert.equal(afterRethrow.status, 502);
    assert.match(afterRethrow.message, /temporarily failed/i);
  });
});

describe("sanitizeProgressionLogObject", () => {
  it("17. does not log full data URL or signed download token", () => {
    const longPayload = "A".repeat(200);
    const sanitized = sanitizeProgressionLogObject({
      dataUrl: "data:image/png;base64," + longPayload,
      url: "https://firebasestorage.googleapis.com/v0/b/x/o/y?alt=media&token=secret-token-value",
      Authorization: "Bearer abc",
    });
    const dataUrl = String(sanitized.dataUrl);
    assert.match(dataUrl, /omitted/i);
    assert.ok(dataUrl.length < 80);
    assert.doesNotMatch(dataUrl, new RegExp(longPayload));
    assert.match(String(sanitized.url), /omitted|signed/i);
    assert.doesNotMatch(String(sanitized.url), /secret-token/);
    assert.equal(sanitized.Authorization, "[redacted]");
  });

  it("18. duplicate permanent failures stay non-retryable (no auto-loop signal)", () => {
    const first = normalizeProgressionError(
      Object.assign(new Error("denied"), { code: "storage/unauthorized" }),
      { operation: "upload-stage-image", stageId: "second-wash" },
    );
    const second = normalizeProgressionError(
      Object.assign(new Error("denied"), { code: "storage/unauthorized" }),
      { operation: "seed-stage-preview", stageId: "refinement" },
    );
    assert.equal(first.retryable, false);
    assert.equal(second.retryable, false);
    // Same root code — shared cause classification for second-wash + refinement.
    assert.equal(first.code, second.code);
  });
});
