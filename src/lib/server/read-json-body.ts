import { ApiError } from "./api-errors";

/** Wire size of a tutorial POST. A 10 MB image is about 13.4 MB once base64-encoded. */
export const TUTORIAL_REQUEST_MAX_BYTES = 14 * 1024 * 1024;

/** Stage generation sends a tutorial object and Storage URLs, not image bytes. */
export const STAGE_REQUEST_MAX_BYTES = 1 * 1024 * 1024;

const BODY_TOO_LARGE = "Request body is too large.";
const BODY_MUST_BE_JSON = "Request body must be JSON.";

/**
 * Decimal Content-Length when it is a safe integer.
 * "oversize" means the header itself cannot fit in the caller's cap.
 * null means the header is missing or not a decimal integer, so the streamed
 * byte count is the authority.
 */
function declaredContentLength(request: Request): number | "oversize" | null {
  const raw = request.headers.get("content-length");
  if (raw === null || !/^\d+$/.test(raw)) return null;
  const normalized = raw.replace(/^0+/, "") || "0";
  if (normalized.length > 15) return "oversize";
  const value = Number(normalized);
  return Number.isSafeInteger(value) ? value : "oversize";
}

export function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/**
 * Read a JSON body without buffering more than `maxBytes`.
 * An oversized Content-Length is rejected before the stream is pulled.
 * The stream is counted and cancelled even when the header is missing or too small.
 */
export async function readJsonWithByteLimit(request: Request, maxBytes: number): Promise<unknown> {
  const declared = declaredContentLength(request);
  if (declared === "oversize" || (typeof declared === "number" && declared > maxBytes)) {
    await request.body?.cancel()?.catch(() => undefined);
    throw new ApiError(413, "ERR_BODY_TOO_LARGE", BODY_TOO_LARGE);
  }

  if (!request.body) {
    throw new ApiError(400, "ERR_INVALID_REQUEST", BODY_MUST_BE_JSON);
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value || value.byteLength === 0) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        try {
          await reader.cancel();
        } catch {
          // The producer may already be closed. The byte cap still holds.
        }
        throw new ApiError(413, "ERR_BODY_TOO_LARGE", BODY_TOO_LARGE);
      }
      chunks.push(value);
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(400, "ERR_INVALID_REQUEST", BODY_MUST_BE_JSON);
  } finally {
    try {
      reader.releaseLock();
    } catch {
      // cancel() already released the reader.
    }
  }

  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new ApiError(400, "ERR_INVALID_REQUEST", BODY_MUST_BE_JSON);
  }
}
