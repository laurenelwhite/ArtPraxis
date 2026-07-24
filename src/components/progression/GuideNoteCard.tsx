type GuideNoteTone = "technique" | "avoid";

/**
 * Single technique / watch-for card used by LessonSummaryGrid.
 * Replaces the unused LearningCard / learning-note pattern.
 */
export function GuideNoteCard({
  tone,
  label,
  body,
}: {
  tone: GuideNoteTone;
  label: string;
  body: string;
}) {
  return (
    <article className="studio-guide-card" data-tone={tone}>
      <h3 className="studio-guide-card-label">{label}</h3>
      <p className="studio-guide-card-body">{body}</p>
    </article>
  );
}
