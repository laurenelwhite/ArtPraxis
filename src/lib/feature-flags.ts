/**
 * Feature flags shared by client and server.
 *
 * Next.js only inlines NEXT_PUBLIC_* into the browser bundle. We read that
 * public name first so the browser and API agree; ENABLE_AI_STAGE_REFINEMENT
 * is accepted as a server-side alias.
 *
 * Default: false (MVP uses deterministic master-derived stage targets).
 */
function envFlagTrue(...keys: string[]): boolean {
  return keys.some((key) => process.env[key] === "true");
}

/** When false, skip automatic per-stage AI edits; use deterministic transforms. */
export const ENABLE_AI_STAGE_REFINEMENT = envFlagTrue(
  "NEXT_PUBLIC_ENABLE_AI_STAGE_REFINEMENT",
  "ENABLE_AI_STAGE_REFINEMENT",
);
