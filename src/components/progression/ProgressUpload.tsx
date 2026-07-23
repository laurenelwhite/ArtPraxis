"use client";

import {
  type ProjectStatus,
} from "@/lib/lessons";

const STATUS_ORDER: ProjectStatus[] = ["not-started", "in-progress", "completed"];

/**
 * Compact progress upload strip for the lesson flow (slot F).
 * Visually secondary to stage instruction.
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
    <section className="progress-upload progress-upload--compact" aria-labelledby="progress-upload-title">
      <div className="progress-upload-copy">
        <h3 id="progress-upload-title" className="progress-upload-title">
          Progress
        </h3>
        <p className="progress-upload-lede">
          Mark where you are, or save a photo of this stage.
        </p>
      </div>

      <div className="progress-upload-actions">
        <div className="progress-upload-status" role="group" aria-label="Project status">
          {STATUS_ORDER.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={option === status}
              className={
                option === status
                  ? "progress-upload-option active"
                  : "progress-upload-option"
              }
              disabled={saving}
              onClick={() => onStatusChange(option)}
            >
              {option === "not-started"
                ? "Not started"
                : option === "in-progress"
                  ? "In progress"
                  : "Finished"}
            </button>
          ))}
        </div>

        <label className="progress-upload-file">
          <span>Upload photo</span>
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            /* Wire storage later; UI only for this redesign pass */
            onChange={() => {}}
          />
        </label>
      </div>
    </section>
  );
}
