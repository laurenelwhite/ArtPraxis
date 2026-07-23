/**
 * Serializable progression / Storage / API error normalization.
 * Keeps browser + Next.js logs from collapsing to `{}` when Error properties
 * are non-enumerable (FirebaseError, OpenAI, custom throws).
 */

export type NormalizedProgressionError = {
  name: string | null;
  code: string | null;
  message: string;
  status: number | null;
  retryable: boolean | null;
  operation: string | null;
  stageId: string | null;
  projectId: string | null;
  source: string | null;
  serverResponse: string | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
};

export type ProgressionErrorContext = {
  operation?: string;
  stageId?: string;
  projectId?: string;
  source?: string;
  status?: number;
  retryable?: boolean;
};

const UNKNOWN_MESSAGE = "Unknown progression error";

const STORAGE_NON_RETRYABLE = new Set([
  "storage/unauthorized",
  "storage/unauthenticated",
  "storage/invalid-argument",
  "storage/invalid-format",
  "storage/invalid-url",
  "storage/invalid-checksum",
  "storage/quota-exceeded",
  "storage/project-not-found",
  "storage/bucket-not-found",
  "storage/object-not-found",
  "storage/canceled",
  "ERR_STAGE_SAVE_BLOB_TOO_LARGE",
  "ERR_STAGE_SAVE_INVALID_MIME",
  "ERR_STAGE_SAVE_INVALID_NAME",
  "ERR_STAGE_SAVE_AUTH",
  "ERR_STAGE_AUTH_UID_MISMATCH",
  "ERR_STAGE_IMAGE_TOO_LARGE",
  "ERR_STAGE_INVALID_CONTENT_TYPE",
  "ERR_STAGE_BUCKET_MISMATCH",
  "ERR_STAGE_INVALID_NAME",
  "ERR_STAGE_NORMALIZE_FAILED",
]);

const API_NON_RETRYABLE_CODES = new Set([
  "ERR_IMAGE_SAFETY_REVIEW",
  "moderation_blocked",
  "invalid_request",
  "invalid_request_error",
  "unsupported_media",
  "malformed_image",
]);

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return null;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() && Number.isFinite(Number(value))) {
    return Number(value);
  }
  return null;
}

function readBoolean(value: unknown): boolean | null {
  return typeof value === "boolean" ? value : null;
}

/** Strip secrets / oversized payloads from anything we might log. */
export function sanitizeProgressionLogValue(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[truncated]";
  if (value == null) return value;
  if (typeof value === "string") {
    if (/^data:/i.test(value)) return `${value.slice(0, 30)}…[data-url omitted]`;
    if (/token=/i.test(value) || /GoogleAccessId=/i.test(value) || /X-Goog-Signature=/i.test(value)) {
      try {
        const u = new URL(value);
        u.search = "";
        return `${u.toString()}?[signed-params omitted]`;
      } catch {
        return "[signed-url omitted]";
      }
    }
    if (/authorization|bearer\s+/i.test(value)) return "[redacted]";
    if (value.length > 500) return `${value.slice(0, 500)}…`;
    return value;
  }
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) {
    return value.slice(0, 20).map((item) => sanitizeProgressionLogValue(item, depth + 1));
  }
  const out: Record<string, unknown> = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (/authorization|cookie|set-cookie|password|api[_-]?key/i.test(key)) {
      out[key] = "[redacted]";
      continue;
    }
    out[key] = sanitizeProgressionLogValue(raw, depth + 1);
  }
  return out;
}

export function sanitizeProgressionLogObject(
  obj: Record<string, unknown>,
): Record<string, unknown> {
  return sanitizeProgressionLogValue(obj) as Record<string, unknown>;
}

function hasNetworkEvidence(message: string, code: string | null): boolean {
  const hay = `${code ?? ""} ${message}`.toLowerCase();
  return /network|offline|timeout|etimedout|econnreset|econnrefused|fetch failed|failed to fetch|socket|connection reset|aborterror|networkerror/.test(
    hay,
  );
}

/**
 * Storage retry policy. Do not treat bare storage/unknown as retryable
 * without network evidence.
 */
export function classifyStorageRetryability(code: string | null, message = ""): boolean {
  if (!code) {
    return hasNetworkEvidence(message, null);
  }
  const normalized = code.trim();
  if (STORAGE_NON_RETRYABLE.has(normalized)) return false;
  if (/invalid.?stage.?name|invalid.?mime|blob.?too.?large|no authenticated user|does not match authenticated/i.test(message)) {
    return false;
  }
  if (normalized === "storage/retry-limit-exceeded") return true;
  if (normalized === "storage/server-file-wrong-size") return true;
  if (normalized === "storage/unknown") {
    return hasNetworkEvidence(message, normalized);
  }
  if (normalized.startsWith("storage/")) {
    return hasNetworkEvidence(message, normalized);
  }
  return hasNetworkEvidence(message, normalized);
}

/**
 * HTTP / API retry policy. Honor an explicit server `retryable` when present
 * (handled by callers); this classifies from status + code alone.
 */
export function classifyApiRetryability(
  status: number | null,
  code: string | null,
): boolean {
  if (code && API_NON_RETRYABLE_CODES.has(code)) return false;
  if (code === "ERR_IMAGE_SAFETY_REVIEW") return false;
  if (status == null) return true;
  if (status === 401 || status === 403 || status === 404 || status === 413 || status === 422) {
    return false;
  }
  if (status === 400) {
    // 400 is non-retryable unless the code is an explicitly transient provider signal.
    if (code && /rate_limit|timeout|server_error|temporarily/i.test(code)) return true;
    return false;
  }
  if (status === 408 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  return false;
}

function pickMessage(...candidates: Array<string | null | undefined>): string {
  for (const c of candidates) {
    if (typeof c === "string") {
      const trimmed = c.trim();
      if (!trimmed) continue;
      if (trimmed === "[object Object]" || trimmed === "{}") continue;
      return trimmed;
    }
  }
  return UNKNOWN_MESSAGE;
}

function extractFromUnknown(error: unknown): {
  name: string | null;
  code: string | null;
  message: string;
  status: number | null;
  retryable: boolean | null;
  serverResponse: string | null;
  requestId: string | null;
  details: Record<string, unknown> | null;
  cause: unknown;
} {
  if (error == null) {
    return {
      name: null,
      code: null,
      message: UNKNOWN_MESSAGE,
      status: null,
      retryable: null,
      serverResponse: null,
      requestId: null,
      details: null,
      cause: null,
    };
  }

  if (typeof error === "string") {
    return {
      name: null,
      code: null,
      message: pickMessage(error),
      status: null,
      retryable: null,
      serverResponse: null,
      requestId: null,
      details: null,
      cause: null,
    };
  }

  const rec = asRecord(error);
  if (!rec) {
    return {
      name: null,
      code: null,
      message: UNKNOWN_MESSAGE,
      status: null,
      retryable: null,
      serverResponse: null,
      requestId: null,
      details: null,
      cause: null,
    };
  }

  const nestedError = asRecord(rec.error);
  const cause = "cause" in rec ? rec.cause : null;
  const causeRec = asRecord(cause);
  const uploadDetails = asRecord(rec.uploadDetails);
  const apiDetails = asRecord(rec.apiDetails);
  const progressionDetails = asRecord(rec.progressionDetails);

  const name =
    readString(rec.name) ??
    (error instanceof Error ? error.name : null);

  const code =
    readString(rec.code) ??
    readString(nestedError?.code) ??
    readString(causeRec?.code) ??
    readString(uploadDetails?.code) ??
    readString(apiDetails?.code) ??
    readString(progressionDetails?.code);

  const status =
    readNumber(rec.status) ??
    readNumber(rec.statusCode) ??
    readNumber(nestedError?.status) ??
    readNumber(causeRec?.status) ??
    readNumber(apiDetails?.status);

  const retryable =
    readBoolean(rec.retryable) ??
    readBoolean(apiDetails?.retryable) ??
    readBoolean(uploadDetails?.retryable) ??
    readBoolean(progressionDetails?.retryable);

  const serverResponse = pickMessage(
    readString(rec.serverResponse),
    readString(apiDetails?.serverResponse),
    null,
  );
  const serverResponseSafe =
    serverResponse === UNKNOWN_MESSAGE ? null : serverResponse.slice(0, 500);

  const requestId =
    readString(rec.requestId) ??
    readString(rec.requestID) ??
    readString(rec.request_id) ??
    readString(apiDetails?.requestId) ??
    readString(nestedError?.requestId) ??
    readString(nestedError?.requestID);

  const message = pickMessage(
    error instanceof Error ? error.message : null,
    readString(rec.message),
    readString(nestedError?.message),
    readString(causeRec?.message),
    cause instanceof Error ? cause.message : null,
    readString(uploadDetails?.message),
    readString(apiDetails?.message),
    readString(progressionDetails?.message),
    typeof rec.error === "string" ? rec.error : null,
    serverResponseSafe,
  );

  const detailsBag: Record<string, unknown> = {};
  if (uploadDetails) detailsBag.uploadDetails = sanitizeProgressionLogObject(uploadDetails);
  if (apiDetails) detailsBag.apiDetails = sanitizeProgressionLogObject(apiDetails);
  if (progressionDetails) {
    detailsBag.progressionDetails = sanitizeProgressionLogObject(progressionDetails);
  }
  if (readString(rec.type)) detailsBag.type = readString(rec.type);
  if (causeRec) {
    detailsBag.cause = sanitizeProgressionLogObject({
      name: cause instanceof Error ? cause.name : readString(causeRec.name),
      code: readString(causeRec.code),
      message: cause instanceof Error ? cause.message : readString(causeRec.message),
    });
  }

  return {
    name,
    code,
    message,
    status,
    retryable,
    serverResponse: serverResponseSafe,
    requestId,
    details: Object.keys(detailsBag).length > 0 ? detailsBag : null,
    cause,
  };
}

export function normalizeProgressionError(
  error: unknown,
  context: ProgressionErrorContext = {},
): NormalizedProgressionError {
  const extracted = extractFromUnknown(error);
  const message = pickMessage(extracted.message);

  let retryable = context.retryable ?? extracted.retryable;
  if (retryable == null) {
    if (extracted.code?.startsWith("storage/")) {
      retryable = classifyStorageRetryability(extracted.code, message);
    } else if (extracted.status != null || extracted.code) {
      retryable = classifyApiRetryability(extracted.status, extracted.code);
    } else {
      retryable = hasNetworkEvidence(message, extracted.code);
    }
  }

  return {
    name: extracted.name,
    code: extracted.code,
    message,
    status: context.status ?? extracted.status,
    retryable,
    operation: context.operation ?? null,
    stageId: context.stageId ?? null,
    projectId: context.projectId ?? null,
    source: context.source ?? null,
    serverResponse: extracted.serverResponse,
    requestId: extracted.requestId,
    details: extracted.details,
  };
}

export type ParsedApiErrorBody = {
  body: Record<string, unknown> | null;
  rawText: string;
  code: string | null;
  message: string;
  retryable: boolean;
  requestId: string | null;
  safeDetails: Record<string, unknown> | null;
};

/** Parse a generate-stage-images error response body (JSON preferred, text fallback). */
export function parseApiErrorBody(
  rawText: string,
  status: number,
  opts: { mode?: "master" | "stage"; fallbackMessage?: string } = {},
): ParsedApiErrorBody {
  let body: Record<string, unknown> | null = null;
  if (rawText) {
    try {
      const parsed = JSON.parse(rawText) as unknown;
      if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
        body = parsed as Record<string, unknown>;
      }
    } catch {
      body = null;
    }
  }

  const code = readString(body?.code);
  const message = pickMessage(
    readString(body?.error),
    readString(body?.message),
    rawText ? rawText.slice(0, 500) : null,
    opts.fallbackMessage,
    `Request failed with ${status}`,
  );

  const explicitRetryable = readBoolean(body?.retryable);
  const retryable =
    explicitRetryable != null
      ? explicitRetryable
      : classifyApiRetryability(status, code);

  const requestId =
    readString(body?.requestId) ??
    readString(body?.requestID) ??
    null;

  let safeDetails: Record<string, unknown> | null = null;
  if (body?.details && typeof body.details === "object" && body.details !== null) {
    safeDetails = sanitizeProgressionLogObject(body.details as Record<string, unknown>);
  }

  return {
    body,
    rawText,
    code,
    message,
    retryable,
    requestId,
    safeDetails,
  };
}

export function buildApiErrorDetails(input: {
  status: number;
  statusText: string;
  mode: "master" | "stage";
  stageId?: string | null;
  projectId?: string | null;
  parsed: ParsedApiErrorBody;
}): Record<string, unknown> {
  return sanitizeProgressionLogObject({
    operation: "generate-stage-images-api",
    status: input.status,
    statusText: input.statusText,
    code: input.parsed.code,
    message: input.parsed.message,
    retryable: input.parsed.retryable,
    mode: input.mode,
    stageId: input.stageId ?? null,
    projectId: input.projectId ?? null,
    requestId: input.parsed.requestId,
    details: input.parsed.safeDetails,
  });
}

/** Build a thrown Error with enumerable diagnostic fields (survives rethrow + logs). */
export function createProgressionThrownError(
  message: string,
  fields: Record<string, unknown>,
): Error {
  const err = new Error(message || UNKNOWN_MESSAGE);
  return Object.assign(err, fields);
}

export function buildFailedStagePatch(
  normalized: NormalizedProgressionError,
  extras: {
    source?: string | null;
    preserveTargetUrl?: string | null;
    userFacingError?: string;
    retryCount?: number;
  } = {},
): {
  generationStatus: "failed";
  error: string;
  errorCode: string | null;
  errorMessage: string;
  retryable: boolean;
  failedAt: number;
  failureSource: string | null;
  targetImageUrl: string | null | undefined;
  retryCount: number;
} {
  return {
    generationStatus: "failed",
    error: extras.userFacingError ?? normalized.message,
    errorCode: normalized.code,
    errorMessage: normalized.message,
    retryable: normalized.retryable ?? false,
    failedAt: Date.now(),
    failureSource: extras.source ?? normalized.source ?? normalized.operation,
    targetImageUrl: extras.preserveTargetUrl,
    retryCount: extras.retryCount ?? 0,
  };
}
