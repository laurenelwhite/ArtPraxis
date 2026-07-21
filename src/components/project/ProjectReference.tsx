import type { LessonSummary } from "@/lib/lessons";

export function ProjectReference({ summary }: { summary: LessonSummary }) {
  return (
    <div className="project-reference">
      {summary.imageUrl ? (
        <figure className="reference-figure">
          <img src={summary.imageUrl} alt={summary.title} />
          <figcaption className="meta">Your reference image for this project.</figcaption>
        </figure>
      ) : (
        <div className="card overview-reference-empty">No reference image was saved for this project.</div>
      )}
    </div>
  );
}
