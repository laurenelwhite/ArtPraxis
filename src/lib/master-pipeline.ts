/**
 * Pure helpers for the master-image pipeline (testable without Firebase/OpenAI).
 */

export const ERR_IMAGE_SAFETY_REVIEW = "ERR_IMAGE_SAFETY_REVIEW";

/** User-facing copy — never mention moderation categories or “sexual”. */
export const MSG_IMAGE_SAFETY_REVIEW =
  "We couldn’t create the painted version of this reference. Your original image and lesson are safe. Try again, or continue with composition-preserving previews.";

export type MasterHydrationState =
  | "loading"
  | "missing_doc"
  | "master_pending"
  | "master_available"
  | "master_failed"
  | "master_generating"
  | "master_needs_review";

export function resolveMasterHydration(doc: {
  masterImageUrl?: string | null;
  masterStatus?: string | null;
} | null | undefined): MasterHydrationState {
  if (doc === undefined) return "loading";
  if (doc === null) return "missing_doc";
  if (doc.masterImageUrl) {
    if (doc.masterStatus === "needsReview") return "master_needs_review";
    if (doc.masterStatus === "failed") return "master_available"; // keep usable image
    return "master_available";
  }
  if (doc.masterStatus === "generating") return "master_generating";
  if (doc.masterStatus === "failed") return "master_failed";
  return "master_pending";
}

/**
 * Whether a master API call should run.
 * Existing masterImageUrl always wins unless the user explicitly regenerates.
 */
export function shouldGenerateMaster(
  doc: { masterImageUrl?: string | null; masterStatus?: string | null } | null,
  opts: { forceRegenerate?: boolean; inMemoryMasterUrl?: string | null } = {},
): boolean {
  if (opts.forceRegenerate) return true;
  if (opts.inMemoryMasterUrl) return false;
  if (doc?.masterImageUrl) return false;
  // A prior non-retryable failure must not auto-loop expensive master calls.
  if (doc?.masterStatus === "failed") return false;
  return true;
}

type LooseError = {
  code?: unknown;
  type?: unknown;
  status?: unknown;
  message?: unknown;
  error?: { code?: unknown; type?: unknown; message?: unknown };
  safety_violations?: unknown;
  safetyViolations?: unknown;
};

function asRecord(value: unknown): LooseError | null {
  if (!value || typeof value !== "object") return null;
  return value as LooseError;
}

function collectSafetyViolations(err: LooseError): string[] {
  const raw = err.safety_violations ?? err.safetyViolations;
  if (Array.isArray(raw)) return raw.map(String);
  return [];
}

/** Detect OpenAI image moderation / safety blocks — never retry these. */
export function isModerationBlockedError(error: unknown): boolean {
  const err = asRecord(error);
  if (!err) {
    const msg = error instanceof Error ? error.message : String(error ?? "");
    return /moderation_blocked|safety.?violat|image_generation_user_error/i.test(msg);
  }

  const code = String(err.code ?? err.error?.code ?? "");
  const type = String(err.type ?? err.error?.type ?? "");
  const message = String(err.message ?? err.error?.message ?? "");
  const violations = collectSafetyViolations(err);

  if (code === "moderation_blocked") return true;
  if (type === "image_generation_user_error" && violations.length > 0) return true;
  if (type === "image_generation_user_error" && /moderation|safety/i.test(message)) return true;
  if (/moderation_blocked/i.test(message)) return true;
  return false;
}

/** Transient failures that may still retry within the configured limit. */
export function isTransientImageError(error: unknown): boolean {
  if (isModerationBlockedError(error)) return false;
  const err = asRecord(error);
  const status = Number(err?.status ?? 0);
  const message = String(
    err?.message ?? err?.error?.message ?? (error instanceof Error ? error.message : error ?? ""),
  );
  const code = String(err?.code ?? err?.error?.code ?? "");

  if (status === 408 || status === 429) return true;
  if (status >= 500 && status <= 599) return true;
  if (/rate.?limit|timeout|ECONNRESET|ETIMEDOUT|socket|temporar|unavailable|503|502|500/i.test(message)) {
    return true;
  }
  if (/rate_limit|timeout|server_error/i.test(code)) return true;
  return false;
}

/** Whether another master attempt should run after this failure. */
export function shouldRetryMasterAttempt(
  error: unknown,
  attempt: number,
  maxRetries: number,
): boolean {
  if (attempt >= maxRetries) return false;
  if (isModerationBlockedError(error)) return false;
  return isTransientImageError(error);
}

const SCULPTURE_HINT =
  /\b(statue|sculpture|sculpted|mannequin|figurine|carved|bust|garden\s+figure|stone\s+figure|weathered\s+figure)\b/i;

export function subjectLooksLikeSculpture(text: string): boolean {
  return SCULPTURE_HINT.test(text);
}

/** Prefer concrete neutral subject language in generation prompts. */
export function neutralizeSubjectTitle(title: string): string {
  const t = title.trim();
  if (!t) return t;
  if (/weathered\s+figure/i.test(t)) return "weathered garden sculpture";
  if (/^figure$/i.test(t)) return "garden sculpture";
  if (/\bfigure\b/i.test(t) && subjectLooksLikeSculpture(t)) {
    return t.replace(/\bfigure\b/gi, "sculpture");
  }
  return t;
}

export function sculptureContextSentence(): string {
  return (
    "The reference may contain an ordinary non-living garden statue or sculpture. " +
    "Preserve it as an inanimate artwork. Do not sexualize, alter clothing, anatomy, pose, or age. " +
    "Make only the requested medium transformation."
  );
}

/**
 * In-flight promise map helper — only one master job per project key.
 */
export function createInflightGuard<T>() {
  const map = new Map<string, Promise<T>>();
  return {
    get(key: string): Promise<T> | undefined {
      return map.get(key);
    },
    run(key: string, factory: () => Promise<T>): Promise<T> {
      const existing = map.get(key);
      if (existing) return existing;
      const run = factory().finally(() => {
        if (map.get(key) === run) map.delete(key);
      });
      map.set(key, run);
      return run;
    },
    clear(key?: string) {
      if (key) map.delete(key);
      else map.clear();
    },
    size(): number {
      return map.size;
    },
  };
}
