import {
  formatFullDate,
  formatLessonDate,
  projectStatusLabels,
  type LessonSummary,
  type ProjectStatus,
} from "@/lib/lessons";
import type { Tutorial } from "@/lib/tutorial-schema";
import { getMediumLanguage } from "@/lib/medium-language";
import { StatusPill } from "./StatusPill";
import { StudioReferencePair } from "@/components/studio-reference";

const STATUS_ORDER: ProjectStatus[] = ["not-started", "in-progress", "completed"];

export function ProjectOverview({
  summary,
  tutorial,
  status,
  onStatusChange,
  saving,
  onBeginStudy,
  onStartPractice,
  masterImageUrl = null,
}: {
  summary: LessonSummary;
  tutorial: Tutorial | null;
  status: ProjectStatus;
  onStatusChange: (next: ProjectStatus) => void;
  saving: boolean;
  onBeginStudy?: () => void;
  onStartPractice?: () => void;
  masterImageUrl?: string | null;
}) {
  const lang = getMediumLanguage(summary.medium);
  const materials = tutorial?.materials?.filter((m) => m.required !== false).slice(0, 5) ?? [];
  const skills = deriveSkills(tutorial);

  return (
    <div className="project-overview project-overview--dashboard">
      <StudioReferencePair
        referenceUrl={summary.imageUrl}
        finalPaintingUrl={masterImageUrl}
        title={summary.title}
        className="overview-ref-pair"
      />

      <div className="overview-dashboard">
        <div className="overview-entry">
          <div className="overview-entry-actions">
            <button
              type="button"
              className="btn-solid btn-lg btn-branded"
              onClick={onBeginStudy}
            >
              Begin Lesson
            </button>
            <button
              type="button"
              className="secondary btn-lg"
              onClick={onStartPractice}
            >
              {lang.primaryPracticeCta}
            </button>
          </div>
        </div>

        {tutorial?.overview ? (
          <div className="overview-block">
            <p className="eyebrow">Lesson summary</p>
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
            <p className="eyebrow">Materials</p>
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
            <p className="eyebrow">Skills learned</p>
            <ul className="overview-skills-list">
              {skills.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ) : null}

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
