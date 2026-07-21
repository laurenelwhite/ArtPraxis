import type { LessonSummary } from "@/lib/lessons";
import { LessonCard } from "./LessonCard";

// The recent grid excludes the lead project (rendered separately above).
export function RecentLessonsSection({ lessons }: { lessons: LessonSummary[] }) {
  if (lessons.length === 0) return null;

  return (
    <section className="recent-section" aria-label="Recent projects">
      <div className="section-heading">
        <p className="eyebrow">Recent projects</p>
      </div>
      <div className="lesson-grid">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
