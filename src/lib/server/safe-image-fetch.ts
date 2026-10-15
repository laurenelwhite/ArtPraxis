import { ApiError } from "./api-errors";
import { isAllowedStorageHost } from "./storage-url";

export const MAX_IMAGE_FETCH_BYTES = 25 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 30_000;

/**
 * Fetch an image that has already passed `validateStorageImageUrl`.
 * Redirects are never followed: a 3xx could point at an internal host that
 * the allow-list never saw.
 */
export async function fetchStorageImage(
  rawUrl: string,
  opts: { fetchImpl?: typeof fetch; maxBytes?: number; timeoutMs?: number } = {},
): Promise<{ buffer: Buffer; contentType: string }> {
  const url = new URL(rawUrl);
  if (!isAllowedStorageHost(url)) {
    throw new ApiError(400, "ERR_UNSAFE_IMAGE_URL", "Image URL is not permitted.");
  }
  const maxBytes = opts.maxBytes ?? MAX_IMAGE_FETCH_BYTES;
  const fetchImpl = opts.fetchImpl ?? globalThis.fetch;

  const response = await fetchImpl(url, {
    redirect: "manual",
    cache: "no-store",
    headers: { Accept: "image/*" },
    signal: AbortSignal.timeout(opts.timeoutMs ?? FETCH_TIMEOUT_MS),
  });

  if (response.type === "opaqueredirect" || (response.status >= 300 && response.status < 400)) {
    throw new ApiError(400, "ERR_UNSAFE_IMAGE_URL", "Image URL redirects are not permitted.");
  }
  if (!response.ok) {
    throw new Error(`Could not fetch input image: ${response.status}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().startsWith("image/")) {
    throw new ApiError(415, "ERR_NOT_AN_IMAGE", "The requested resource is not an image.");
  }
  const declared = Number(response.headers.get("content-length") ?? "0");
  if (declared > maxBytes) {
    throw new ApiError(413, "ERR_IMAGE_TOO_LARGE", "The image is too large.");
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxBytes) {
    throw new ApiError(413, "ERR_IMAGE_TOO_LARGE", "The image is too large.");
  }
  return { buffer, contentType };
}
