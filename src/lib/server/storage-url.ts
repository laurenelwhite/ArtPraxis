/**
 * Allow-list policy for server-side image retrieval.
 *
 * Only Firebase Storage objects in an approved bucket, under the caller's own
 * `users/{uid}/projects/{projectId}/…` prefix, may be fetched by the server.
 */

export const STORAGE_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
]);

const MAX_URL_LENGTH = 4096;

export type StorageUrlCheck =
  | { ok: true; url: URL; bucket: string; objectPath: string; projectId: string }
  | {
      ok: false;
      status: 400 | 403;
      code: "ERR_UNSAFE_IMAGE_URL" | "ERR_FORBIDDEN_RESOURCE";
      reason: string;
    };

export function allowedStorageBuckets(
  env: Record<string, string | undefined> = process.env,
): Set<string> {
  const buckets = new Set<string>();
  const add = (value: string | undefined) => {
    for (const part of (value ?? "").split(",")) {
      const bucket = part.trim().toLowerCase();
      if (bucket) buckets.add(bucket);
    }
  };
  add(env.FIREBASE_STORAGE_BUCKET);
  add(env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
  add(env.ALLOWED_STORAGE_BUCKETS);
  return buckets;
}

function parseIPv4(host: string): number[] | null {
  const parts = host.split(".");
  if (parts.length !== 4) return null;
  const octets = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  return octets.every((n) => Number.isInteger(n) && n >= 0 && n <= 255) ? octets : null;
}

function isBlockedIPv4([a, b, c]: number[]): boolean {
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isBlockedIPv6(host: string): boolean {
  const h = host.toLowerCase();
  if (h === "::" || h === "::1") return true;
  if (/^f[cd][0-9a-f]{0,2}:/.test(h)) return true; // fc00::/7 unique-local
  if (/^fe[89ab][0-9a-f]?:/.test(h)) return true; // fe80::/10 link-local
  const mapped = /^::ffff:(.+)$/.exec(h);
  if (mapped) {
    const tail = mapped[1];
    const dotted = parseIPv4(tail);
    if (dotted) return isBlockedIPv4(dotted);
    const hex = /^([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(tail);
    if (hex) {
      const hi = parseInt(hex[1], 16);
      const lo = parseInt(hex[2], 16);
      return isBlockedIPv4([hi >> 8, hi & 255, lo >> 8, lo & 255]);
    }
    return true;
  }
  return false;
}

/**
 * True for loopback, private, link-local, metadata, and other internal
 * destinations. Expects a WHATWG-normalized `URL.hostname`.
 */
export function isBlockedNetworkHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
  if (!host) return true;
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata" ||
    host === "metadata.google.internal"
  ) {
    return true;
  }
  const v4 = parseIPv4(host);
  if (v4) return isBlockedIPv4(v4);
  if (host.includes(":")) return isBlockedIPv6(host);
  return false;
}

function parseStorageObject(url: URL): { bucket: string; objectPath: string } | null {
  try {
    if (url.hostname === "firebasestorage.googleapis.com") {
      const m = /^\/v0\/b\/([^/]+)\/o\/([^/]+)$/.exec(url.pathname);
      if (!m) return null;
      return { bucket: decodeURIComponent(m[1]), objectPath: decodeURIComponent(m[2]) };
    }
    if (url.hostname === "storage.googleapis.com") {
      const m = /^\/([^/]+)\/(.+)$/.exec(url.pathname);
      if (!m) return null;
      return { bucket: decodeURIComponent(m[1]), objectPath: decodeURIComponent(m[2]) };
    }
  } catch {
    return null;
  }
  return null;
}

function reject(
  status: 400 | 403,
  reason: string,
): Extract<StorageUrlCheck, { ok: false }> {
  return {
    ok: false,
    status,
    code: status === 403 ? "ERR_FORBIDDEN_RESOURCE" : "ERR_UNSAFE_IMAGE_URL",
    reason,
  };
}

export function isAllowedStorageHost(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    !url.username &&
    !url.password &&
    url.port === "" &&
    STORAGE_HOSTS.has(url.hostname) &&
    !isBlockedNetworkHost(url.hostname)
  );
}

export function validateStorageImageUrl(
  raw: unknown,
  opts: { uid: string; allowedBuckets: Set<string> },
): StorageUrlCheck {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > MAX_URL_LENGTH) {
    return reject(400, "missing_or_oversized_url");
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return reject(400, "invalid_url");
  }
  if (url.protocol !== "https:") return reject(400, "unsupported_scheme");
  if (url.username || url.password) return reject(400, "credentials_in_url");
  if (url.port !== "") return reject(400, "non_default_port");
  if (isBlockedNetworkHost(url.hostname)) return reject(400, "blocked_network_host");
  if (!STORAGE_HOSTS.has(url.hostname)) return reject(400, "host_not_allowed");

  const parsed = parseStorageObject(url);
  if (!parsed) return reject(400, "not_a_storage_object");
  const bucket = parsed.bucket.toLowerCase();
  if (!opts.allowedBuckets.has(bucket)) return reject(400, "bucket_not_allowed");

  const { objectPath } = parsed;
  if (
    objectPath.includes("\\") ||
    /[\u0000-\u001f]/.test(objectPath) ||
    objectPath.split("/").some((seg) => seg === "" || seg === "." || seg === "..")
  ) {
    return reject(400, "invalid_object_path");
  }

  const segments = objectPath.split("/");
  if (segments[0] !== "users" || segments.length < 5 || segments[2] !== "projects") {
    return reject(400, "object_outside_project_storage");
  }
  if (segments[1] !== opts.uid) return reject(403, "object_owned_by_another_user");

  return { ok: true, url, bucket, objectPath, projectId: segments[3] };
}
