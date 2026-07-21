import Link from "next/link";
import { formatLessonDate, type LessonSummary } from "@/lib/lessons";
import { StatusPill } from "@/components/project/StatusPill";
import { Icon } from "@/components/Icon";

// The most recent project, presented as the lead story of the studio.
export function LeadProject({ lesson }: { lesson: LessonSummary }) {
  return (
    <section className="lead-project" aria-label="Latest project">
      <p className="eyebrow">Latest project</p>
      <div className="lead-project-body">
        <Link href={`/studio/lessons/${lesson.id}`} className="lead-media">
          {lesson.imageUrl ? (
            <img src={lesson.imageUrl} alt={lesson.title} />
          ) : (
            <span className="lead-media-empty">{lesson.status === "generating" ? "Generating…" : lesson.medium}</span>
          )}
        </Link>
        <div className="lead-detail">
          <StatusPill status={lesson.projectStatus} />
          <h2 className="lead-title">{lesson.title}</h2>
          <p className="lead-meta">
            <span className="capitalize">{lesson.medium}</span> · <span className="capitalize">{lesson.skillLevel}</span> · Updated {formatLessonDate(lesson.updatedAt)}
          </p>
          <div className="lead-actions">
            <Link href={`/studio/lessons/${lesson.id}`} className="btn-solid"><Icon name="brush" size={17} />Open lesson</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
