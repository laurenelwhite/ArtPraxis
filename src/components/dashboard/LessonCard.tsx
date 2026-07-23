import Link from "next/link";
import { StatusPill } from "@/components/project/StatusPill";
import { formatLessonDate, type LessonSummary } from "@/lib/lessons";
import { AppImage } from "@/components/ui/AppImage";

export function LessonCard({ lesson }: { lesson: LessonSummary }) {
  return (
    <Link
      href={`/studio/lessons/${lesson.id}`}
      className="lesson-card"
      data-lesson-medium={lesson.medium}
    >
      <figure className="lesson-thumb">
        {lesson.thumbnailUrl ? (
          <AppImage
            src={lesson.thumbnailUrl}
            alt={lesson.title}
            fill
            sizes="(max-width: 700px) 50vw, 280px"
            style={{ objectFit: "cover" }}
            loading="lazy"
          />
        ) : (
          <span className="lesson-thumb-placeholder">{lesson.medium}</span>
        )}
        {lesson.status === "generating" && <span className="lesson-badge">Painting…</span>}
      </figure>
      <div className="lesson-body">
        <span className="lesson-medium-badge">{lesson.medium}</span>
        <h3 className="lesson-card-title">{lesson.title}</h3>
        <p className="lesson-modified">
          Updated {formatLessonDate(lesson.updatedAt)}
        </p>
        <StatusPill status={lesson.projectStatus} />
      </div>
    </Link>
  );
}
