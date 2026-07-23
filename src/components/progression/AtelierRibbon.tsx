"use client";

import { type ProjectStatus } from "@/lib/lessons";

const STATUS_ORDER: ProjectStatus[] = ["not-started", "in-progress", "completed"];

function statusLabel(status: ProjectStatus): string {
  if (status === "not-started") return "Not started";
  if (status === "in-progress") return "In progress";
  return "Finished";
}

/**
 * Compact Atelier Ribbon — progress tucked away until needed.
 * Expands on demand; does not compete with the painting.
 */
export function AtelierRibbon({
  status,
  onStatusChange,
  saving = false,
}: {
  status: ProjectStatus;
  onStatusChange: (next: ProjectStatus) => void;
  saving?: boolean;
}) {
  return (
    <details className="atelier-ribbon">
      <summary className="atelier-ribbon-summary">
        <span className="atelier-ribbon-kicker">Progress</span>
        <span className="atelier-ribbon-status">{statusLabel(status)}</span>
      </summary>
      <div className="atelier-ribbon-body">
        <div className="atelier-ribbon-actions" role="group" aria-label="Project status">
          {STATUS_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === status}
              className={
                option === status
                  ? "atelier-ribbon-option is-active"
                  : "atelier-ribbon-option"
              }
              disabled={saving}
              onClick={() => onStatusChange(option)}
            >
              {statusLabel(option)}
            </button>
          ))}
        </div>
        <label className="atelier-ribbon-upload">
          <span>Save a photo of this stage</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={() => {}}
          />
        </label>
      </div>
    </details>
  );
}
