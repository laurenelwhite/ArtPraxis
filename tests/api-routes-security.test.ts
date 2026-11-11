/**
 * Route-level security regression tests. Token verification, quota storage,
 * the OpenAI client, and upstream fetch are all faked — no paid or network calls.
 */
import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import path from "node:path";
import { after, afterEach, before, beforeEach, describe, it } from "node:test";
import { pathToFileURL } from "node:url";
import { NextRequest } from "next/server";
import type OpenAI from "openai";
import { createMemoryQuotaStore } from "../src/lib/server/generation-quota";
import {
  STAGE_REQUEST_MAX_BYTES,
  TUTORIAL_REQUEST_MAX_BYTES,
} from "../src/lib/server/read-json-body";
import { setSecurityDepsForTesting } from "../src/lib/server/security-deps";

// `server-only` throws outside the React Server bundle; Next resolves it to empty.js there.
const serverOnlyStub = pathToFileURL(path.resolve("node_modules/server-only/empty.js")).href;
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "server-only") return { url: serverOnlyStub, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});

const BUCKET = "test-bucket.firebasestorage.app";
const TOKEN_A = "user-a.payload.signature";
const TOKEN_B = "user-b.payload.signature";

const savedEnv = { ...process.env };
process.env.FIREBASE_STORAGE_BUCKET = BUCKET;
process.env.OPENAI_API_KEY = "test-key-not-used";
process.env.ENABLE_STAGE_IMAGE_GEN = "false";

type Routes = {
  tutorial: typeof import("../src/app/api/generate-tutorial/route");
  stages: typeof import("../src/app/api/generate-stage-images/route");
  proxy: typeof import("../src/app/api/image-proxy/route");
};
let routes: Routes;

before(async () => {
  routes = {
    tutorial: await import("../src/app/api/generate-tutorial/route"),
    stages: await import("../src/app/api/generate-stage-images/route"),
    proxy: await import("../src/app/api/image-proxy/route"),
  };
});

after(() => {
  process.env = savedEnv;
});

let quotaStore: ReturnType<typeof createMemoryQuotaStore>;
let openaiCalls: number;
let tutorialOutput: unknown;
const realFetch = globalThis.fetch;

beforeEach(() => {
  process.env.GEN_QUOTA_TUTORIALS_PER_DAY = "10";
  process.env.GEN_QUOTA_IMAGES_PER_DAY = "30";
  process.env.GEN_QUOTA_MAX_CONCURRENT = "2";
  quotaStore = createMemoryQuotaStore();
  openaiCalls = 0;
  tutorialOutput = null;
  setSecurityDepsForTesting({
    verifyIdToken: async (token) => {
      if (token === TOKEN_A) return { uid: "user-a" };
      if (token === TOKEN_B) return { uid: "user-b" };
      throw Object.assign(new Error("invalid"), { code: "auth/argument-error" });
    },
    quotaStore,
    openai: () =>
      ({
        responses: {
          parse: async () => {
            openaiCalls += 1;
            return { output_parsed: tutorialOutput };
          },
        },
        images: {
          edit: async () => {
            openaiCalls += 1;
            throw new Error("paid image generation must not run in tests");
          },
        },
      }) as unknown as OpenAI,
  });
});

afterEach(() => {
  setSecurityDepsForTesting(null);
  globalThis.fetch = realFetch;
  delete process.env.GEN_QUOTA_TUTORIALS_PER_DAY;
  delete process.env.GEN_QUOTA_IMAGES_PER_DAY;
  delete process.env.GEN_QUOTA_MAX_CONCURRENT;
});

function storageUrl(objectPath: string) {
  return `https://firebasestorage.googleapis.com/v0/b/${BUCKET}/o/${encodeURIComponent(objectPath)}?alt=media&token=t`;
}

function post(url: string, body: unknown, token?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

function postRaw(url: string, json: string, token?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (token) headers.authorization = `Bearer ${token}`;
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers,
    body: json,
  });
}

function jsonOfByteLength(fields: Record<string, unknown>, targetBytes: number) {
  const skeleton = JSON.stringify({ ...fields, pad: "" });
  const room = targetBytes - Buffer.byteLength(skeleton, "utf8");
  if (room < 0) throw new Error(`payload skeleton exceeds ${targetBytes} bytes`);
  const json = JSON.stringify({ ...fields, pad: "a".repeat(room) });
  if (Buffer.byteLength(json, "utf8") !== targetBytes) {
    throw new Error(`expected ${targetBytes} bytes, got ${Buffer.byteLength(json, "utf8")}`);
  }
  return json;
}

function streamPost(
  url: string,
  opts: {
    token?: string;
    chunks: Uint8Array[];
    contentLength?: string;
    onPull?: () => void;
    onCancel?: () => void;
    /** When set, further pulls repeat this chunk instead of closing the stream. */
    repeat?: Uint8Array;
    maxPulls?: number;
  },
) {
  const pending = opts.chunks.slice();
  let pulls = 0;
  const stream = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulls += 1;
      opts.onPull?.();
      if (pulls > (opts.maxPulls ?? 8)) {
        controller.error(new Error("stream was not cancelled"));
        return;
      }
      const next = pending.shift() ?? opts.repeat;
      if (next) controller.enqueue(next);
      else controller.close();
    },
    cancel() {
      opts.onCancel?.();
    },
  });
  const headers = new Headers({ "content-type": "application/json" });
  if (opts.token) headers.set("authorization", `Bearer ${opts.token}`);
  if (opts.contentLength !== undefined) headers.set("content-length", opts.contentLength);
  return new NextRequest(`http://localhost${url}`, {
    method: "POST",
    headers,
    body: stream,
  });
}

function get(url: string, token?: string) {
  return new NextRequest(`http://localhost${url}`, {
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

function validTutorial() {
  return {
    title: "Test lesson",
    overview: "A short overview.",
    difficulty: "beginner",
    estimatedMinutes: 45,
    composition: {
      focalPoint: "Center subject",
      majorShapes: ["bowl", "cloth"],
      valuePlan: "Light left, dark right",
      lightDirection: "From upper left",
    },
    visualGuides: {
      focalPoint: { x: 50, y: 40, label: "Focus" },
      lightArrow: { start: { x: 10, y: 10 }, end: { x: 40, y: 40 }, label: "Light" },
      regions: [
        { x: 10, y: 10, width: 20, height: 20, label: "Shape", type: "major-shape" },
        { x: 40, y: 40, width: 20, height: 20, label: "Shadow", type: "shadow" },
        { x: 60, y: 20, width: 15, height: 15, label: "Light", type: "highlight" },
      ],
      suggestedCrop: null,
    },
    valueMap: {
      lights: "Highlights on rim",
      midtones: "Cloth midtones",
      darks: "Cast shadow",
      squintTest: "Big light/dark masses hold",
    },
    materials: [{ item: "Round brush", purpose: "Washes", required: true }],
    palette: [
      { name: "Ultramarine", hex: "#1F3A93", role: "Cool", mixingNote: "Thin", ratio: "1:4" },
      { name: "Burnt Sienna", hex: "#A0522D", role: "Warm", mixingNote: "Earthy", ratio: "neat" },
      { name: "Yellow Ochre", hex: "#C7A84A", role: "Earth", mixingNote: "Mute", ratio: "touch" },
    ],
    creativeChoices: ["Simplify background", "Keep edges soft"],
    steps: Array.from({ length: 6 }, (_, i) => ({
      order: i + 1,
      title: `Step ${i + 1}`,
      objective: "Practice",
      instruction: "Paint carefully",
      technique: "Wash",
      checkpoint: "Check values",
      commonMistake: "Too dark too soon",
      estimatedMinutes: 5,
      focusBox: null,
      paletteNames: ["Ultramarine"],
      visualCue: "Soft edge",
    })),
  };
}

const tutorialBody = {
  imageDataUrl: "data:image/png;base64,iVBORw0KGgo=",
  medium: "watercolor",
  skillLevel: "beginner",
};

describe("POST /api/generate-tutorial", () => {
  it("returns 401 for an anonymous request without calling OpenAI", async () => {
    const res = await routes.tutorial.POST(post("/api/generate-tutorial", tutorialBody));
    assert.equal(res.status, 401);
    assert.equal((await res.json()).code, "ERR_UNAUTHENTICATED");
    assert.equal(openaiCalls, 0);
  });

  it("returns 401 for an invalid token", async () => {
    const res = await routes.tutorial.POST(
      post("/api/generate-tutorial", tutorialBody, "forged.token.value"),
    );
    assert.equal(res.status, 401);
    assert.equal((await res.json()).code, "ERR_INVALID_TOKEN");
    assert.equal(openaiCalls, 0);
  });

  it("returns 429 when the user's daily quota is exhausted", async () => {
    process.env.GEN_QUOTA_TUTORIALS_PER_DAY = "0";
    const res = await routes.tutorial.POST(post("/api/generate-tutorial", tutorialBody, TOKEN_A));
    assert.equal(res.status, 429);
    assert.equal((await res.json()).code, "ERR_QUOTA_EXCEEDED");
    assert.ok(res.headers.get("retry-after"));
    assert.equal(openaiCalls, 0);
  });

  it("returns 429 when paid quotas are missing", async () => {
    delete process.env.GEN_QUOTA_TUTORIALS_PER_DAY;
    delete process.env.GEN_QUOTA_IMAGES_PER_DAY;
    delete process.env.GEN_QUOTA_MAX_CONCURRENT;
    const res = await routes.tutorial.POST(post("/api/generate-tutorial", tutorialBody, TOKEN_A));
    assert.equal(res.status, 429);
    assert.equal((await res.json()).code, "ERR_QUOTA_EXCEEDED");
    assert.equal(openaiCalls, 0);
  });

  it("returns 413 for a reference over 10 MB without calling OpenAI", async () => {
    const decoded = 10 * 1024 * 1024 + 3;
    const payload = "A".repeat(Math.ceil((decoded * 4) / 3));
    const res = await routes.tutorial.POST(
      post(
        "/api/generate-tutorial",
        { ...tutorialBody, imageDataUrl: `data:image/png;base64,${payload}` },
        TOKEN_A,
      ),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_IMAGE_TOO_LARGE");
    assert.equal(openaiCalls, 0);
    assert.equal(quotaStore.state.get("user-a"), undefined);
  });

  it("rejects an oversized Content-Length before parsing and cancels the stream", async () => {
    let pulls = 0;
    let cancelled = false;
    const res = await routes.tutorial.POST(
      streamPost("/api/generate-tutorial", {
        token: TOKEN_A,
        chunks: [new TextEncoder().encode(JSON.stringify(tutorialBody))],
        contentLength: String(TUTORIAL_REQUEST_MAX_BYTES + 1),
        repeat: new Uint8Array(1024),
        onPull: () => {
          pulls += 1;
        },
        onCancel: () => {
          cancelled = true;
        },
      }),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_BODY_TOO_LARGE");
    assert.equal(cancelled, true);
    assert.ok(pulls <= 2);
    assert.equal(openaiCalls, 0);
    assert.equal(quotaStore.state.get("user-a"), undefined);
  });

  it("rejects a chunked body over 14 MiB and cancels it", async () => {
    let cancelled = false;
    const res = await routes.tutorial.POST(
      streamPost("/api/generate-tutorial", {
        token: TOKEN_A,
        chunks: [new Uint8Array(TUTORIAL_REQUEST_MAX_BYTES + 1).fill(0x78)],
        repeat: new Uint8Array(1024),
        onCancel: () => {
          cancelled = true;
        },
      }),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_BODY_TOO_LARGE");
    assert.equal(cancelled, true);
    assert.equal(openaiCalls, 0);
  });

  it("counts bytes when Content-Length underreports a tutorial body", async () => {
    let cancelled = false;
    const res = await routes.tutorial.POST(
      streamPost("/api/generate-tutorial", {
        token: TOKEN_A,
        chunks: [new Uint8Array(TUTORIAL_REQUEST_MAX_BYTES + 1).fill(0x78)],
        contentLength: "8",
        repeat: new Uint8Array(1024),
        onCancel: () => {
          cancelled = true;
        },
      }),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_BODY_TOO_LARGE");
    assert.equal(cancelled, true);
    assert.equal(openaiCalls, 0);
  });

  it("accepts a valid tutorial body at exactly 14 MiB", async () => {
    tutorialOutput = validTutorial();
    const res = await routes.tutorial.POST(
      postRaw(
        "/api/generate-tutorial",
        jsonOfByteLength(tutorialBody, TUTORIAL_REQUEST_MAX_BYTES),
        TOKEN_A,
      ),
    );
    assert.equal(res.status, 200);
    assert.equal(openaiCalls, 1);
  });

  it("returns 400 for malformed tutorial JSON without calling OpenAI", async () => {
    const res = await routes.tutorial.POST(postRaw("/api/generate-tutorial", "{", TOKEN_A));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, "ERR_INVALID_REQUEST");
    assert.equal(openaiCalls, 0);
  });

  it("lets an authorized request reach the handler and releases its slot", async () => {
    tutorialOutput = validTutorial();
    const res = await routes.tutorial.POST(post("/api/generate-tutorial", tutorialBody, TOKEN_A));
    assert.equal(res.status, 200);
    const json = await res.json();
    assert.equal(json.tutorial.title, "Test lesson");
    assert.equal(openaiCalls, 1);
    const usage = quotaStore.state.get("user-a");
    assert.equal(usage?.counts.tutorial, 1);
    assert.deepEqual(usage?.inflight, {});
  });
});

describe("POST /api/generate-stage-images", () => {
  const ownRef = storageUrl("users/user-a/projects/p1/reference.jpg");

  it("returns 401 for an anonymous request", async () => {
    const res = await routes.stages.POST(
      post("/api/generate-stage-images", { medium: "watercolor", tutorial: validTutorial(), referenceImageUrl: ownRef }),
    );
    assert.equal(res.status, 401);
  });

  it("returns 401 for an invalid token", async () => {
    const res = await routes.stages.POST(
      post(
        "/api/generate-stage-images",
        { medium: "watercolor", tutorial: validTutorial(), referenceImageUrl: ownRef },
        "forged.token.value",
      ),
    );
    assert.equal(res.status, 401);
  });

  it("returns 403 when referencing another user's image", async () => {
    const res = await routes.stages.POST(
      post(
        "/api/generate-stage-images",
        { medium: "watercolor", tutorial: validTutorial(), referenceImageUrl: ownRef },
        TOKEN_B,
      ),
    );
    assert.equal(res.status, 403);
    assert.equal((await res.json()).code, "ERR_FORBIDDEN_RESOURCE");
  });

  for (const [label, field, url] of [
    ["metadata endpoint", "referenceImageUrl", "http://169.254.169.254/computeMetadata/v1/"],
    ["internal host", "masterImageUrl", "https://metadata.google.internal/x"],
    ["external host", "precedingImageUrl", "https://evil.example.com/users/user-a/projects/p1/x.png"],
  ] as const) {
    it(`returns 400 for an unsafe ${label} URL`, async () => {
      let fetched = false;
      globalThis.fetch = (async () => {
        fetched = true;
        return new Response(null);
      }) as typeof fetch;
      const res = await routes.stages.POST(
        post(
          "/api/generate-stage-images",
          { medium: "watercolor", tutorial: validTutorial(), [field]: url },
          TOKEN_A,
        ),
      );
      assert.equal(res.status, 400);
      assert.equal((await res.json()).code, "ERR_UNSAFE_IMAGE_URL");
      assert.equal(fetched, false);
    });
  }

  it("rejects an oversized Content-Length before parsing a stage body", async () => {
    let pulls = 0;
    let cancelled = false;
    const res = await routes.stages.POST(
      streamPost("/api/generate-stage-images", {
        token: TOKEN_A,
        chunks: [new TextEncoder().encode(JSON.stringify({ medium: "watercolor", tutorial: validTutorial() }))],
        contentLength: String(STAGE_REQUEST_MAX_BYTES + 1),
        repeat: new Uint8Array(1024),
        onPull: () => {
          pulls += 1;
        },
        onCancel: () => {
          cancelled = true;
        },
      }),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_BODY_TOO_LARGE");
    assert.equal(cancelled, true);
    assert.ok(pulls <= 2);
    assert.equal(openaiCalls, 0);
  });

  it("rejects a chunked stage body over 1 MiB and cancels it", async () => {
    let cancelled = false;
    const res = await routes.stages.POST(
      streamPost("/api/generate-stage-images", {
        token: TOKEN_A,
        chunks: [new Uint8Array(STAGE_REQUEST_MAX_BYTES + 1).fill(0x78)],
        repeat: new Uint8Array(1024),
        onCancel: () => {
          cancelled = true;
        },
      }),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_BODY_TOO_LARGE");
    assert.equal(cancelled, true);
    assert.equal(openaiCalls, 0);
  });

  it("rejects a chunked stage body over 1 MiB when Content-Length underreports it", async () => {
    let cancelled = false;
    const res = await routes.stages.POST(
      streamPost("/api/generate-stage-images", {
        token: TOKEN_A,
        chunks: [new Uint8Array(STAGE_REQUEST_MAX_BYTES + 1).fill(0x78)],
        contentLength: "8",
        repeat: new Uint8Array(1024),
        onCancel: () => {
          cancelled = true;
        },
      }),
    );
    assert.equal(res.status, 413);
    assert.equal((await res.json()).code, "ERR_BODY_TOO_LARGE");
    assert.equal(cancelled, true);
    assert.equal(openaiCalls, 0);
  });

  it("accepts a valid stage body at exactly 1 MiB", async () => {
    const res = await routes.stages.POST(
      postRaw(
        "/api/generate-stage-images",
        jsonOfByteLength(
          { medium: "watercolor", tutorial: validTutorial(), mode: "master", referenceImageUrl: ownRef },
          STAGE_REQUEST_MAX_BYTES,
        ),
        TOKEN_A,
      ),
    );
    assert.equal(res.status, 200);
    assert.equal((await res.json()).generated, false);
    assert.equal(openaiCalls, 0);
  });

  it("returns 400 for malformed stage JSON without calling OpenAI", async () => {
    const res = await routes.stages.POST(postRaw("/api/generate-stage-images", "{", TOKEN_A));
    assert.equal(res.status, 400);
    assert.equal((await res.json()).code, "ERR_INVALID_REQUEST");
    assert.equal(openaiCalls, 0);
  });

  it("lets an authorized request reach the handler without paid generation", async () => {
    const res = await routes.stages.POST(
      post(
        "/api/generate-stage-images",
        { medium: "watercolor", tutorial: validTutorial(), mode: "master", referenceImageUrl: ownRef },
        TOKEN_A,
      ),
    );
    assert.equal(res.status, 200);
    assert.equal((await res.json()).generated, false);
    assert.equal(openaiCalls, 0);
    assert.equal(quotaStore.state.get("user-a"), undefined);
  });
});

describe("GET /api/image-proxy", () => {
  const own = storageUrl("users/user-a/projects/p1/stages/s1.png");
  const proxied = (url: string) => `/api/image-proxy?url=${encodeURIComponent(url)}`;

  it("returns 401 for an anonymous request", async () => {
    const res = await routes.proxy.GET(get(proxied(own)));
    assert.equal(res.status, 401);
  });

  it("returns 401 for an invalid token", async () => {
    const res = await routes.proxy.GET(get(proxied(own), "forged.token.value"));
    assert.equal(res.status, 401);
  });

  it("returns 403 for another user's image", async () => {
    const res = await routes.proxy.GET(get(proxied(own), TOKEN_B));
    assert.equal(res.status, 403);
  });

  it("returns 400 for arbitrary or internal URLs without fetching", async () => {
    let fetched = false;
    globalThis.fetch = (async () => {
      fetched = true;
      return new Response(null);
    }) as typeof fetch;
    for (const url of [
      "http://169.254.169.254/computeMetadata/v1/",
      "https://127.0.0.1/",
      "https://example.com/image.png",
      "file:///etc/passwd",
    ]) {
      const res = await routes.proxy.GET(get(proxied(url), TOKEN_A));
      assert.equal(res.status, 400, url);
    }
    assert.equal(fetched, false);
  });

  it("rejects an upstream redirect instead of following it", async () => {
    globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
      assert.equal(init?.redirect, "manual");
      return new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/computeMetadata/v1/" },
      });
    }) as typeof fetch;
    const res = await routes.proxy.GET(get(proxied(own), TOKEN_A));
    assert.equal(res.status, 400);
  });

  it("serves the owner's image with private, nosniff headers", async () => {
    globalThis.fetch = (async () =>
      new Response(new Uint8Array([137, 80, 78, 71]), {
        headers: { "content-type": "image/png" },
      })) as typeof fetch;
    const res = await routes.proxy.GET(get(proxied(own), TOKEN_A));
    assert.equal(res.status, 200);
    assert.equal(res.headers.get("cache-control"), "private, no-store");
    assert.equal(res.headers.get("x-content-type-options"), "nosniff");
    assert.equal((await res.arrayBuffer()).byteLength, 4);
  });
});
