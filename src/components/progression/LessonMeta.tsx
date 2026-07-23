import type { Tutorial } from "@/lib/tutorial-schema";

export function LessonMeta({
  difficulty,
  estimatedMinutes,
  stageCount,
}: {
  difficulty: Tutorial["difficulty"];
  estimatedMinutes: number;
  stageCount: number;
}) {
  return (
    <ul className="lesson-meta" aria-label="Lesson details">
      <li>
        <span className="lesson-meta-label">Difficulty</span>
        <span className="lesson-meta-value capitalize">{difficulty}</span>
      </li>
      <li aria-hidden="true" className="lesson-meta-sep" />
      <li>
        <span className="lesson-meta-label">Time</span>
        <span className="lesson-meta-value">
          about {estimatedMinutes} min
        </span>
      </li>
      <li aria-hidden="true" className="lesson-meta-sep" />
      <li>
        <span className="lesson-meta-label">Stages</span>
        <span className="lesson-meta-value">{stageCount}</span>
      </li>
    </ul>
  );
}
