/**
 * Compare the initialized client project with the project named by configuration.
 * This check does not sign the user in or out.
 */

const PROJECT_ID = /^[a-z][a-z0-9-]{4,28}[a-z0-9]$/;

export type FirebaseProjectCheck =
  | { ok: true; projectId: string }
  | { ok: false; reason: "missing" | "invalid" | "mismatch" };

export function checkConfiguredFirebaseProject(
  activeProjectId: string | null | undefined,
  configuredProjectId: string | null | undefined,
): FirebaseProjectCheck {
  const configured = typeof configuredProjectId === "string" ? configuredProjectId.trim() : "";
  if (!configured) return { ok: false, reason: "missing" };
  if (!PROJECT_ID.test(configured)) return { ok: false, reason: "invalid" };
  const active = typeof activeProjectId === "string" ? activeProjectId.trim() : "";
  if (active !== configured) return { ok: false, reason: "mismatch" };
  return { ok: true, projectId: configured };
}
