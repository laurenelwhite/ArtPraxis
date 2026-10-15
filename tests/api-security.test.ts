/**
 * Security regression tests for API auth, image URL policy, and generation quota.
 * No network, Firebase, or OpenAI access: every dependency is faked.
 */
import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { ApiError } from "../src/lib/server/api-errors";
import { authenticateRequest, extractBearerToken } from "../src/lib/server/api-auth";
import {
  createMemoryQuotaStore,
  decideReservation,
  quotaConfigFromEnv,
  type QuotaConfig,
} from "../src/lib/server/generation-quota";
import { fetchStorageImage } from "../src/lib/server/safe-image-fetch";
import { resolveQuotaStoreKind, setSecurityDepsForTesting } from "../src/lib/server/security-deps";
import {
  allowedStorageBuckets,
  isBlockedNetworkHost,
  validateStorageImageUrl,
} from "../src/lib/server/storage-url";

const BUCKET = "test-bucket.firebasestorage.app";
const buckets = new Set([BUCKET]);
const FAKE_TOKEN = "header.payload.signature";

function storageUrl(objectPath: string, bucket = BUCKET) {
  return `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/${encodeURIComponent(objectPath)}?alt=media&token=abc`;
}

afterEach(() => setSecurityDepsForTesting(null));

describe("extractBearerToken", () => {
  it("accepts a well-formed bearer JWT", () => {
    assert.equal(extractBearerToken(`Bearer ${FAKE_TOKEN}`), FAKE_TOKEN);
  });

  it("rejects missing, malformed, and oversized headers", () => {
    assert.equal(extractBearerToken(null), null);
    assert.equal(extractBearerToken(""), null);
    assert.equal(extractBearerToken("Basic abc"), null);
    assert.equal(extractBearerToken("Bearer not-a-jwt"), null);
    assert.equal(extractBearerToken(`Bearer ${"a".repeat(5000)}.b.c`), null);
  });
});

describe("authenticateRequest", () => {
  const req = (auth?: string) =>
    new Request("http://localhost/api/x", { headers: auth ? { authorization: auth } : {} });

  it("returns 401 for an anonymous request", async () => {
    await assert.rejects(authenticateRequest(req()), (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 401);
      assert.equal(e.code, "ERR_UNAUTHENTICATED");
      return true;
    });
  });

  it("returns 401 for an invalid token", async () => {
    setSecurityDepsForTesting({
      verifyIdToken: async () => {
        throw Object.assign(new Error("bad"), { code: "auth/argument-error" });
      },
    });
    await assert.rejects(authenticateRequest(req(`Bearer ${FAKE_TOKEN}`)), (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 401);
      assert.equal(e.code, "ERR_INVALID_TOKEN");
      return true;
    });
  });

  it("returns 503 (not 401) when verification infrastructure is down", async () => {
    setSecurityDepsForTesting({
      verifyIdToken: async () => {
        throw Object.assign(new Error("down"), { code: "app/network-error" });
      },
    });
    await assert.rejects(authenticateRequest(req(`Bearer ${FAKE_TOKEN}`)), (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 503);
      return true;
    });
  });

  it("returns the uid from the verified token", async () => {
    setSecurityDepsForTesting({ verifyIdToken: async () => ({ uid: "user-a" }) });
    assert.deepEqual(await authenticateRequest(req(`Bearer ${FAKE_TOKEN}`)), { uid: "user-a" });
  });
});

describe("validateStorageImageUrl", () => {
  const ownPath = "users/user-a/projects/p1/reference.jpg";

  it("accepts the caller's own project object", () => {
    const check = validateStorageImageUrl(storageUrl(ownPath), { uid: "user-a", allowedBuckets: buckets });
    assert.equal(check.ok, true);
    if (check.ok) {
      assert.equal(check.projectId, "p1");
      assert.equal(check.objectPath, ownPath);
    }
  });

  it("accepts storage.googleapis.com path-style URLs", () => {
    const check = validateStorageImageUrl(
      `https://storage.googleapis.com/${BUCKET}/users/user-a/projects/p1/stages/s1.png`,
      { uid: "user-a", allowedBuckets: buckets },
    );
    assert.equal(check.ok, true);
  });

  it("rejects another user's object with 403", () => {
    const check = validateStorageImageUrl(storageUrl("users/user-b/projects/p1/reference.jpg"), {
      uid: "user-a",
      allowedBuckets: buckets,
    });
    assert.equal(check.ok, false);
    if (!check.ok) {
      assert.equal(check.status, 403);
      assert.equal(check.code, "ERR_FORBIDDEN_RESOURCE");
    }
  });

  const unsafe: Array<[string, string]> = [
    ["http scheme", storageUrl(ownPath).replace("https:", "http:")],
    ["file scheme", "file:///etc/passwd"],
    ["data scheme", "data:image/png;base64,AAAA"],
    ["javascript scheme", "javascript:alert(1)"],
    ["gopher scheme", "gopher://firebasestorage.googleapis.com/"],
    ["loopback IPv4", "https://127.0.0.1/v0/b/x/o/y"],
    ["localhost", "https://localhost/v0/b/x/o/y"],
    ["private IPv4", "https://10.0.0.5/v0/b/x/o/y"],
    ["link-local metadata IP", "https://169.254.169.254/computeMetadata/v1/"],
    ["metadata hostname", "https://metadata.google.internal/computeMetadata/v1/"],
    ["IPv6 loopback", "https://[::1]/v0/b/x/o/y"],
    ["IPv4-mapped IPv6", "https://[::ffff:169.254.169.254]/"],
    ["decimal IPv4 encoding", "https://2852039166/"],
    ["arbitrary external host", "https://evil.example.com/users/user-a/projects/p1/x.png"],
    ["lookalike host", "https://firebasestorage.googleapis.com.evil.com/v0/b/x/o/y"],
    ["credentials in URL", `https://user:pass@firebasestorage.googleapis.com/v0/b/${BUCKET}/o/x`],
    ["non-default port", `https://firebasestorage.googleapis.com:8443/v0/b/${BUCKET}/o/x`],
    ["other bucket", storageUrl(ownPath, "someone-else.appspot.com")],
    ["path traversal", storageUrl("users/user-a/projects/../../user-b/projects/p1/x.png")],
    ["outside project storage", storageUrl("users/user-a/avatar.png")],
    ["not a URL", "not a url"],
  ];
  for (const [label, url] of unsafe) {
    it(`rejects ${label} with 400`, () => {
      const check = validateStorageImageUrl(url, { uid: "user-a", allowedBuckets: buckets });
      assert.equal(check.ok, false, url);
      if (!check.ok) assert.equal(check.status, 400, `${label}: ${check.reason}`);
    });
  }

  it("fails closed when no bucket is configured", () => {
    const check = validateStorageImageUrl(storageUrl(ownPath), { uid: "user-a", allowedBuckets: new Set() });
    assert.equal(check.ok, false);
  });

  it("reads allowed buckets from env", () => {
    const set = allowedStorageBuckets({
      NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "A.appspot.com",
      ALLOWED_STORAGE_BUCKETS: " b.app , c.app",
    });
    assert.deepEqual([...set].sort(), ["a.appspot.com", "b.app", "c.app"]);
  });

  it("blocks internal hosts", () => {
    for (const host of ["0.0.0.0", "100.64.0.1", "172.16.0.1", "192.168.1.1", "[fe80::1]", "[fd00::1]", "metadata"]) {
      assert.equal(isBlockedNetworkHost(host), true, host);
    }
    assert.equal(isBlockedNetworkHost("firebasestorage.googleapis.com"), false);
  });
});

describe("fetchStorageImage", () => {
  const url = storageUrl("users/user-a/projects/p1/reference.jpg");

  it("rejects a redirect instead of following it", async () => {
    let calls = 0;
    let redirectMode: RequestRedirect | undefined;
    const fetchImpl = (async (_input: unknown, init?: RequestInit) => {
      calls += 1;
      redirectMode = init?.redirect;
      return new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/computeMetadata/v1/" },
      });
    }) as typeof fetch;
    await assert.rejects(fetchStorageImage(url, { fetchImpl }), (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 400);
      return true;
    });
    assert.equal(calls, 1);
    assert.equal(redirectMode, "manual");
  });

  it("rejects non-allow-listed hosts before any fetch", async () => {
    let calls = 0;
    const fetchImpl = (async () => {
      calls += 1;
      return new Response("x");
    }) as typeof fetch;
    await assert.rejects(fetchStorageImage("https://169.254.169.254/latest", { fetchImpl }));
    assert.equal(calls, 0);
  });

  it("rejects non-image and oversized responses", async () => {
    const html = (async () =>
      new Response("<html>", { headers: { "content-type": "text/html" } })) as typeof fetch;
    await assert.rejects(fetchStorageImage(url, { fetchImpl: html }), (e: unknown) =>
      e instanceof ApiError && e.status === 415,
    );
    const big = (async () =>
      new Response(new Uint8Array(20), { headers: { "content-type": "image/png" } })) as typeof fetch;
    await assert.rejects(fetchStorageImage(url, { fetchImpl: big, maxBytes: 10 }), (e: unknown) =>
      e instanceof ApiError && e.status === 413,
    );
  });

  it("returns image bytes for an allowed object", async () => {
    const ok = (async () =>
      new Response(new Uint8Array([1, 2, 3]), { headers: { "content-type": "image/png" } })) as typeof fetch;
    const result = await fetchStorageImage(url, { fetchImpl: ok });
    assert.equal(result.contentType, "image/png");
    assert.equal(result.buffer.length, 3);
  });
});

describe("generation quota", () => {
  const config: QuotaConfig = { tutorialPerDay: 2, imagePerDay: 3, maxConcurrent: 1, leaseMs: 60_000 };
  const t0 = Date.UTC(2026, 9, 14, 12, 0, 0);

  it("reads config from env with safe defaults", () => {
    assert.deepEqual(quotaConfigFromEnv({}), {
      tutorialPerDay: 10,
      imagePerDay: 30,
      maxConcurrent: 2,
      leaseMs: 360_000,
    });
    const custom = quotaConfigFromEnv({ GEN_QUOTA_TUTORIALS_PER_DAY: "1", GEN_QUOTA_MAX_CONCURRENT: "0" });
    assert.equal(custom.tutorialPerDay, 1);
    assert.equal(custom.maxConcurrent, 1);
  });

  it("returns 429 once the daily limit is reached", async () => {
    const store = createMemoryQuotaStore(() => t0);
    for (let i = 0; i < 2; i += 1) {
      const r = await store.reserve("user-a", "tutorial", config);
      await r.release();
    }
    await assert.rejects(store.reserve("user-a", "tutorial", config), (e: unknown) => {
      assert.ok(e instanceof ApiError);
      assert.equal(e.status, 429);
      assert.equal(e.code, "ERR_QUOTA_EXCEEDED");
      assert.ok(Number(e.headers["Retry-After"]) > 0);
      return true;
    });
    // Other users and other kinds are unaffected.
    await (await store.reserve("user-b", "tutorial", config)).release();
    await (await store.reserve("user-a", "image", config)).release();
  });

  it("rejects duplicate concurrent requests with 429", async () => {
    const store = createMemoryQuotaStore(() => t0);
    const results = await Promise.allSettled([
      store.reserve("user-a", "image", config),
      store.reserve("user-a", "image", config),
    ]);
    const rejected = results.filter((r) => r.status === "rejected");
    assert.equal(rejected.length, 1);
    const reason = (rejected[0] as PromiseRejectedResult).reason;
    assert.ok(reason instanceof ApiError);
    assert.equal(reason.status, 429);
    assert.equal(reason.code, "ERR_TOO_MANY_CONCURRENT");
  });

  it("frees the concurrency slot on release and on lease expiry", () => {
    const first = decideReservation(null, "image", config, t0, "r1");
    assert.equal(first.allowed, true);
    if (!first.allowed) return;
    assert.equal(decideReservation(first.next, "image", config, t0 + 1000, "r2").allowed, false);
    assert.equal(decideReservation(first.next, "image", config, t0 + 61_000, "r2").allowed, true);
  });

  it("never selects production Firestore for local runs by default", () => {
    assert.equal(resolveQuotaStoreKind({}), "memory");
    assert.equal(resolveQuotaStoreKind({ NODE_ENV: "production" }), "memory");
    assert.equal(resolveQuotaStoreKind({ K_SERVICE: "artpraxis" }), "firestore");
    assert.equal(resolveQuotaStoreKind({ GEN_QUOTA_STORE: "firestore" }), "firestore");
    assert.equal(resolveQuotaStoreKind({ K_SERVICE: "artpraxis", GEN_QUOTA_STORE: "memory" }), "memory");
  });

  it("resets daily counts on a new UTC day", () => {
    const state = { day: "2026-10-13", counts: { tutorial: 99, image: 99 }, inflight: {} };
    const decision = decideReservation(state, "tutorial", config, t0, "r1");
    assert.equal(decision.allowed, true);
    if (decision.allowed) assert.equal(decision.next.counts.tutorial, 1);
  });
});
