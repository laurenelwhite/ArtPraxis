import type { LessonSummary } from "@/lib/lessons";
import { LessonCard } from "./LessonCard";

// The recent grid excludes the lead project (rendered separately above).
export function RecentLessonsSection({ lessons }: { lessons: LessonSummary[] }) {
  if (lessons.length === 0) return null;

  return (
    <section className="recent-section" aria-labelledby="recent-projects-title">
      <div className="section-heading">
        <h2 id="recent-projects-title" className="eyebrow">Recent projects</h2>
      </div>
      <div className="lesson-grid">
        {lessons.map((lesson) => (
          <LessonCard key={lesson.id} lesson={lesson} />
        ))}
      </div>
    </section>
  );
}
