import Link from "next/link";
import { StatusPill } from "@/components/project/StatusPill";
import { formatLessonDate, type LessonSummary } from "@/lib/lessons";

export function LessonCard({ lesson }: { lesson: LessonSummary }) {
  return (
    <Link href={`/studio/lessons/${lesson.id}`} className="lesson-card">
      <figure className="lesson-thumb">
        {lesson.thumbnailUrl ? (
          <img src={lesson.thumbnailUrl} alt={lesson.title} loading="lazy" />
        ) : (
          <span className="lesson-thumb-placeholder">{lesson.medium}</span>
        )}
        {lesson.status === "generating" && <span className="lesson-badge">Generating…</span>}
      </figure>
      <div className="lesson-body">
        <h3 className="lesson-card-title">{lesson.title}</h3>
        <p className="lesson-modified">
          <span className="capitalize">{lesson.medium}</span> · Updated {formatLessonDate(lesson.updatedAt)}
        </p>
        <StatusPill status={lesson.projectStatus} />
      </div>
    </Link>
  );
}
