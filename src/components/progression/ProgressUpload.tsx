"use client";

import { StatusPill } from "@/components/project/StatusPill";
import { type ProjectStatus } from "@/lib/lessons";

const STATUS_ORDER: ProjectStatus[] = ["not-started", "in-progress", "completed"];

const STATUS_LABEL: Record<ProjectStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Finished",
};

const PHOTO_INPUT_ID = "progress-photo-upload";

/**
 * Progress tab — lesson status and photo upload (storage wiring is UI-only for now).
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
          <h2 className="progress-workbench-title">Your painting journey</h2>
          <p className="progress-workbench-lead">
            Mark where you are, or save a photo of your work.
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

      <section
        className="progress-section progress-photo-section"
        aria-labelledby="progress-photo-heading"
      >
        <h3 id="progress-photo-heading" className="progress-section-title">
          Your painting
        </h3>
        <p className="progress-section-lead">
          Save a photo when you are ready.
        </p>
        <div className="progress-upload-zone">
          <label htmlFor={PHOTO_INPUT_ID} className="progress-upload-trigger">
            <span>Upload photo</span>
            <input
              id={PHOTO_INPUT_ID}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="progress-upload-input"
              /* Wire storage later; UI only for this redesign pass */
              onChange={() => {}}
            />
          </label>
        </div>
      </section>
    </div>
  );
}
