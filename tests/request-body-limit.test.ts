/**
 * Unit tests for the shared request-body cap. Route tests cover the two
 * generation endpoints and assert that rejected bodies never call OpenAI.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ApiError } from "../src/lib/server/api-errors";
import { readJsonWithByteLimit } from "../src/lib/server/read-json-body";

const MAX_BYTES = 32;

function jsonOfByteLength(targetBytes: number): string {
  const skeleton = JSON.stringify({ ok: true, pad: "" });
  const room = targetBytes - Buffer.byteLength(skeleton, "utf8");
  if (room < 0) throw new Error(`skeleton exceeds ${targetBytes}`);
  const json = JSON.stringify({ ok: true, pad: "a".repeat(room) });
  assert.equal(Buffer.byteLength(json, "utf8"), targetBytes);
  return json;
}

function streamedRequest(opts: {
  chunks: Uint8Array[];
  contentLength?: string;
  onPull?: () => void;
  onCancel?: () => void;
}) {
  const pending = opts.chunks.slice();
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      opts.onPull?.();
      const next = pending.shift();
      if (!next) controller.close();
      else controller.enqueue(next);
    },
    cancel() {
      opts.onCancel?.();
    },
  });
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.contentLength !== undefined) headers.set("content-length", opts.contentLength);
  return new Request("http://localhost/body", {
    method: "POST",
    headers,
    body: stream,
    duplex: "half",
  } as RequestInit);
}

describe("readJsonWithByteLimit", () => {
  it("rejects an oversized Content-Length before parsing and cancels the stream", async () => {
    let pulls = 0;
    let cancelled = false;
    const request = streamedRequest({
      chunks: [new TextEncoder().encode("{\"ok\":true}")],
      contentLength: String(MAX_BYTES + 1),
      onPull: () => {
        pulls += 1;
      },
      onCancel: () => {
        cancelled = true;
      },
    });
    await assert.rejects(
      () => readJsonWithByteLimit(request, MAX_BYTES),
      (error: unknown) => error instanceof ApiError && error.status === 413 && error.code === "ERR_BODY_TOO_LARGE",
    );
    assert.equal(cancelled, true);
    assert.ok(pulls <= 1);
  });

  it("rejects a chunked body over the cap and cancels the stream", async () => {
    let cancelled = false;
    const request = streamedRequest({
      chunks: [new Uint8Array(MAX_BYTES + 1).fill(0x78)],
      onCancel: () => {
        cancelled = true;
      },
    });
    await assert.rejects(
      () => readJsonWithByteLimit(request, MAX_BYTES),
      (error: unknown) => error instanceof ApiError && error.status === 413 && error.code === "ERR_BODY_TOO_LARGE",
    );
    assert.equal(cancelled, true);
  });

  it("counts streamed bytes when Content-Length underreports the body", async () => {
    let cancelled = false;
    const request = streamedRequest({
      chunks: [new TextEncoder().encode("{\"ok\":"), new Uint8Array(MAX_BYTES).fill(0x78)],
      contentLength: "4",
      onCancel: () => {
        cancelled = true;
      },
    });
    await assert.rejects(
      () => readJsonWithByteLimit(request, MAX_BYTES),
      (error: unknown) => error instanceof ApiError && error.status === 413 && error.code === "ERR_BODY_TOO_LARGE",
    );
    assert.equal(cancelled, true);
  });

  it("parses a JSON body when Content-Length is absent", async () => {
    const request = streamedRequest({
      chunks: [new TextEncoder().encode('{"ok":true}')],
    });
    const parsed = await readJsonWithByteLimit(request, MAX_BYTES);
    assert.deepEqual(parsed, { ok: true });
  });

  it("parses a JSON body at exactly the cap", async () => {
    const json = jsonOfByteLength(MAX_BYTES);
    const request = new Request("http://localhost/body", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: json,
    });
    const parsed = await readJsonWithByteLimit(request, MAX_BYTES);
    assert.deepEqual(Object.keys(parsed as object).sort(), ["ok", "pad"]);
  });

  it("rejects one byte past the cap without parsing it as JSON", async () => {
    const request = new Request("http://localhost/body", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: jsonOfByteLength(MAX_BYTES + 1),
    });
    await assert.rejects(
      () => readJsonWithByteLimit(request, MAX_BYTES),
      (error: unknown) => error instanceof ApiError && error.status === 413 && error.code === "ERR_BODY_TOO_LARGE",
    );
  });

  it("returns 400 for malformed JSON inside the cap", async () => {
    const request = new Request("http://localhost/body", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "{",
    });
    await assert.rejects(
      () => readJsonWithByteLimit(request, MAX_BYTES),
      (error: unknown) =>
        error instanceof ApiError && error.status === 400 && error.code === "ERR_INVALID_REQUEST",
    );
  });
});
