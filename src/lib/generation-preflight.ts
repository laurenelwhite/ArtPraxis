export const GENERATION_UNAVAILABLE_MESSAGE =
  "Lesson writing is turned off in this studio. Your photo is still only on this device.";

export const LESSON_SAVED_RETRY_MESSAGE =
  "The lesson could not be written. It is saved in your studio so you can try again.";

const ENV_LEAK = /OPENAI_API_KEY|GEN_QUOTA_[A-Z0-9_]+/;
const LOCAL_PHOTO_CLAIM = "still only on this device";

export function persistentLessonWritesAllowed(
  body: { available?: unknown } | null | undefined,
): boolean {
  return body?.available === true;
}

function isSafePublicError(value: string): boolean {
  const text = value.trim();
  return text.length > 0 && !ENV_LEAK.test(text) && !text.includes(LOCAL_PHOTO_CLAIM);
}

/** Message for the preflight response. Persistent writes have not started. */
export function preflightUserMessage(
  httpOk: boolean,
  body: { available?: unknown; error?: unknown } | null,
): string {
  if (httpOk && body?.available === false) return GENERATION_UNAVAILABLE_MESSAGE;
  if (typeof body?.error === "string" && isSafePublicError(body.error)) return body.error.trim();
  return "Lesson writing could not be checked. Your photo is still only on this device.";
}

/**
 * Message after a real generation attempt.
 * The local-photo sentence is allowed only when nothing was uploaded and no lesson exists.
 */
export function creatorFailureMessage(input: {
  uploadStarted: boolean;
  lessonCreated: boolean;
  error: unknown;
}): string {
  const raw = input.error instanceof Error && input.error.message.trim()
    ? input.error.message.trim()
    : "Something went wrong";
  const claimsLocal = raw.includes(LOCAL_PHOTO_CLAIM);
  const leaked = ENV_LEAK.test(raw);
  const persisted = input.uploadStarted || input.lessonCreated;

  if (
    persisted &&
    (claimsLocal || leaked || raw === "Lesson writing is unavailable right now.")
  ) {
    return LESSON_SAVED_RETRY_MESSAGE;
  }
  if (!persisted && (claimsLocal || leaked)) return GENERATION_UNAVAILABLE_MESSAGE;
  return raw;
}
