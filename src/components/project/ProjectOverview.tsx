import { AppImage } from "@/components/ui/AppImage";
import {
  formatFullDate,
  formatLessonDate,
  projectStatusLabels,
  type LessonSummary,
  type ProjectStatus,
} from "@/lib/lessons";
import type { Tutorial } from "@/lib/tutorial-schema";
import { StatusPill } from "./StatusPill";

const STATUS_ORDER: ProjectStatus[] = ["not-started", "in-progress", "completed"];

export function ProjectOverview({
  summary,
  tutorial,
  status,
  onStatusChange,
  saving,
}: {
  summary: LessonSummary;
  tutorial: Tutorial | null;
  status: ProjectStatus;
  onStatusChange: (next: ProjectStatus) => void;
  saving: boolean;
}) {
  return (
    <div className="project-overview">
      <figure className="overview-reference">
        {summary.imageUrl ? (
          <AppImage
            src={summary.imageUrl}
            alt={summary.title}
            width={1200}
            height={900}
            sizes="(max-width: 900px) 100vw, 560px"
            style={{ width: "100%", height: "auto", maxHeight: "540px", objectFit: "cover" }}
          />
        ) : (
          <div className="overview-reference-empty">No reference image</div>
        )}
      </figure>

      <div className="overview-details">
        {tutorial?.overview && (
          <div>
            <p className="eyebrow">Lesson summary</p>
            <p className="overview-summary">{tutorial.overview}</p>
          </div>
        )}

        <div className="overview-status">
          <div className="overview-status-head">
            <p className="eyebrow">Project status</p>
            <StatusPill status={status} />
          </div>
          <div className="status-control" role="group" aria-label="Set project status">
            {STATUS_ORDER.map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={option === status}
                className={option === status ? "status-option active" : "status-option"}
                disabled={saving}
                onClick={() => onStatusChange(option)}
              >
                {projectStatusLabels[option]}
              </button>
            ))}
          </div>
        </div>

        <dl className="overview-meta">
          <div><dt>Estimated time</dt><dd>{tutorial ? `About ${tutorial.estimatedMinutes} min` : "—"}</dd></div>
          <div><dt>Difficulty</dt><dd className="capitalize">{tutorial?.difficulty ?? summary.skillLevel}</dd></div>
          <div><dt>Medium</dt><dd className="capitalize">{summary.medium}</dd></div>
          <div><dt>Experience</dt><dd className="capitalize">{summary.skillLevel}</dd></div>
          <div><dt>Created</dt><dd>{formatFullDate(summary.createdAt)}</dd></div>
          <div><dt>Last modified</dt><dd>{formatLessonDate(summary.updatedAt)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
