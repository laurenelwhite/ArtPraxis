"use client";

import { type ProjectStatus } from "@/lib/lessons";

function statusLabel(status: ProjectStatus): string {
  if (status === "not-started") return "Not started";
  if (status === "in-progress") return "In progress";
  return "Finished";
}

/**
 * Compact end-of-lesson progress hint.
 * Authoritative status + upload live on the Progress tab — no duplicate controls.
 */
export function AtelierRibbon({
  status,
}: {
  status: ProjectStatus;
  onStatusChange?: (next: ProjectStatus) => void;
  saving?: boolean;
}) {
  return (
    <aside className="atelier-ribbon atelier-ribbon--hint" aria-label="Progress">
      <p className="atelier-ribbon-summary">
        <span className="atelier-ribbon-kicker">Progress</span>
        <span className="atelier-ribbon-status">{statusLabel(status)}</span>
      </p>
      <p className="atelier-ribbon-hint">
        Use the Progress tab to mark this lesson finished or upload a photo of your work.
      </p>
    </aside>
  );
}
