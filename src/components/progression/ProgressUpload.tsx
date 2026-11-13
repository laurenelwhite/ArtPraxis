"use client";

import { StatusPill } from "@/components/project/StatusPill";
import { type ProjectStatus } from "@/lib/lessons";

const STATUS_ORDER: ProjectStatus[] = ["not-started", "in-progress", "completed"];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Finished",
};

/**
 * Progress tab — one honest control for the lesson status.
 */
export function ProgressUpload({
  status,
  onStatusChange,
  saving = false,
}: {
  status: ProjectStatus;
  onStatusChange: (next: ProjectStatus) => void;
  saving?: boolean;
}) {
  return (
    <div className="progress-workbench">
      <header className="progress-workbench-header">
        <div>
          <p className="progress-kicker">Progress</p>
          <h2 className="progress-workbench-title">Your studio progress</h2>
          <p className="progress-workbench-lead">
            Keep this lesson in step with your current practice.
          </p>
        </div>
        <div className="progress-status-summary">
          <p className="progress-status-summary-label">Current status</p>
          <StatusPill status={status} />
          {saving ? (
            <p className="progress-saving" role="status" aria-live="polite">
              Saving…
            </p>
          ) : null}
        </div>
      </header>

      <section className="progress-section" aria-labelledby="progress-status-heading">
        <h3 id="progress-status-heading" className="progress-section-title">
          Lesson status
        </h3>
        <p className="progress-section-lead">
          Choose the option that best matches where you are.
        </p>
        <div className="progress-status-controls" role="group" aria-label="Lesson status">
          {STATUS_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === status}
              className={
                option === status
                  ? "progress-status-option is-active"
                  : "progress-status-option"
              }
              disabled={saving}
              onClick={() => onStatusChange(option)}
            >
              {STATUS_LABEL[option]}
            </button>
          ))}
        </div>
      </section>

    </div>
  );
}
