import Link from "next/link";
import { formatLessonDate, type LessonSummary } from "@/lib/lessons";
import { StatusPill } from "@/components/project/StatusPill";
import { Icon } from "@/components/Icon";
import { AppImage } from "@/components/ui/AppImage";

function leadActionLabel(status: LessonSummary["projectStatus"]): string {
  if (status === "in-progress") return "Resume lesson";
  if (status === "completed") return "Review lesson";
  return "Continue lesson";
}

/** Most recent project — one composition, one primary path into the lesson. */
export function LeadProject({ lesson }: { lesson: LessonSummary }) {
  const href = `/studio/lessons/${lesson.id}`;
  const actionLabel = leadActionLabel(lesson.projectStatus);

  return (
    <section className="lead-project" aria-label="Latest project">
      <p className="eyebrow">Latest project</p>
      <div className="lead-project-body">
        <Link href={href} className="lead-media" aria-label={`${actionLabel}: ${lesson.title}`}>
          {lesson.imageUrl ? (
            <AppImage
              src={lesson.imageUrl}
              alt=""
              fill
              sizes="(max-width: 900px) 100vw, 560px"
              style={{ objectFit: "cover" }}
            />
          ) : (
            <span className="lead-media-empty">
              {lesson.status === "generating" ? "Painting…" : lesson.medium}
            </span>
          )}
        </Link>
        <div className="lead-detail">
          <StatusPill status={lesson.projectStatus} />
          <h2 className="lead-title">
            <Link href={href}>{lesson.title}</Link>
          </h2>
          <p className="lead-meta">
            <span className="capitalize">{lesson.medium}</span>
            {" · "}
            <span className="capitalize">{lesson.skillLevel}</span>
            {" · Updated "}
            {formatLessonDate(lesson.updatedAt)}
          </p>
          <div className="lead-actions">
            <Link href={href} className="btn-solid btn-branded">
              <Icon name="brush" size={17} />
              {actionLabel}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
