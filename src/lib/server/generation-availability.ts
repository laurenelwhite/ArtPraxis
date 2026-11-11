import { quotaConfigFromEnv } from "./generation-quota";

/**
 * Configuration-only check for whether a tutorial can be started.
 * Returns a boolean. Callers must not add a reason, env name, or secret status.
 * This does not call OpenAI, read usage, or reserve quota.
 */
export function tutorialModelConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  const key = env.OPENAI_API_KEY;
  return typeof key === "string" && key.trim() !== "";
}

export function tutorialGenerationAvailable(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (!tutorialModelConfigured(env)) return false;
  const quota = quotaConfigFromEnv(env);
  // A zero daily allowance or a zero concurrency cap rejects every reservation.
  // Image quota is separate and does not decide whether a tutorial can start.
  return quota.tutorialPerDay > 0 && quota.maxConcurrent > 0;
}
