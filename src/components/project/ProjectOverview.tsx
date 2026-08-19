import {
  formatFullDate,
  formatLessonDate,
  type LessonSummary,
  type ProjectStatus,
} from "@/lib/lessons";
import type { Tutorial } from "@/lib/tutorial-schema";
import { getMediumLanguage } from "@/lib/medium-language";
import { StatusPill } from "./StatusPill";
import { StudioReferencePair } from "@/components/studio-reference";

export function ProjectOverview({
  summary,
  tutorial,
  status,
  onBeginStudy,
  masterImageUrl = null,
}: {
  summary: LessonSummary;
  tutorial: Tutorial | null;
  status: ProjectStatus;
  onBeginStudy?: () => void;
  masterImageUrl?: string | null;
}) {
  const lang = getMediumLanguage(summary.medium);
  const materials = tutorial?.materials?.filter((m) => m.required !== false).slice(0, 5) ?? [];
  const skills = deriveSkills(tutorial);
  const primaryLabel =
    status === "in-progress"
      ? "Resume lesson"
      : status === "completed"
        ? "Review lesson"
        : "Begin lesson";
  const headingId = "overview-orientation";

  return (
    <div className="project-overview project-overview--dashboard">
      <section
        className="overview-hero"
        aria-labelledby={headingId}
      >
        <header className="overview-orientation">
          <p id={headingId} className="overview-orientation-lead">
            Your reference and the finished painting this lesson will teach.
          </p>
        </header>

        <StudioReferencePair
          referenceUrl={summary.imageUrl}
          finalPaintingUrl={masterImageUrl}
          title={summary.title}
          className="overview-ref-pair"
        />
      </section>

      <div className="overview-dashboard">
        {tutorial?.overview ? (
          <div className="overview-block">
            <h2 className="overview-label">Lesson summary</h2>
            <p className="overview-summary">{tutorial.overview}</p>
          </div>
        ) : null}

        <dl className="overview-meta overview-meta--dash">
          <div>
            <dt>Estimated time</dt>
            <dd>{tutorial ? `About ${tutorial.estimatedMinutes} min` : "—"}</dd>
          </div>
          <div>
            <dt>Difficulty</dt>
            <dd className="capitalize">
              {tutorial?.difficulty ?? summary.skillLevel}
            </dd>
          </div>
          <div>
            <dt>Medium</dt>
            <dd className="capitalize">{lang.mediumLabel}</dd>
          </div>
        </dl>

        {materials.length > 0 ? (
          <div className="overview-block">
            <h2 className="overview-label">Materials</h2>
            <ul className="overview-materials-list">
              {materials.map((m) => (
                <li key={m.item}>{m.item}</li>
              ))}
              {(tutorial?.materials?.length ?? 0) > materials.length ? (
                <li className="overview-materials-more">
                  +{(tutorial?.materials?.length ?? 0) - materials.length} more
                </li>
              ) : null}
            </ul>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <div className="overview-block">
            <h2 className="overview-label">Skills practiced</h2>
            <ul className="overview-skills-list">
              {skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <p className="overview-liberty">
          Use this painting as your guide, then make the final choices your own.
        </p>

        <div className="overview-entry">
          <div className="overview-entry-actions">
            <button
              type="button"
              className="ap-button-primary btn-lg btn-branded overview-begin"
              onClick={onBeginStudy}
            >
              {primaryLabel}
            </button>
          </div>
        </div>

        <div className="overview-status">
          <div className="overview-status-head">
            <h2 className="overview-label">Project status</h2>
            <StatusPill status={status} />
          </div>
          <p className="overview-status-hint">
            Update status and upload stage photos from the Progress tab.
          </p>
        </div>

        <dl className="overview-meta overview-meta--secondary">
          <div>
            <dt>Experience</dt>
            <dd className="capitalize">{summary.skillLevel}</dd>
          </div>
          <div>
            <dt>Created</dt>
            <dd>{formatFullDate(summary.createdAt)}</dd>
          </div>
          <div>
            <dt>Last modified</dt>
            <dd>{formatLessonDate(summary.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
}

function deriveSkills(tutorial: Tutorial | null): string[] {
  if (!tutorial) return [];
  const fromChoices = tutorial.creativeChoices?.filter(Boolean).slice(0, 4) ?? [];
  if (fromChoices.length) return fromChoices;
  const fromSteps = tutorial.steps
    .map((s) => s.technique.trim())
    .filter(Boolean)
    .slice(0, 4);
  return Array.from(new Set(fromSteps));
}
