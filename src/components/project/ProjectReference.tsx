import type { LessonSummary } from "@/lib/lessons";
import type { GenerationStatus } from "@/lib/progression";
import { AppImage } from "@/components/ui/AppImage";

/**
 * Reference tab: uploaded reference + accepted target when available.
 */
export function ProjectReference({
  summary,
  masterImageUrl = null,
  masterStatus = "pending",
}: {
  summary: LessonSummary;
  masterImageUrl?: string | null;
  masterStatus?: GenerationStatus;
}) {
  const showMaster =
    Boolean(masterImageUrl) &&
    (masterStatus === "ready" || masterStatus === "needsReview");

  return (
    <div className="project-reference project-reference--atelier">
      <header className="project-reference-header">
        <p className="eyebrow">Reference</p>
        <h2 className="project-reference-title">Source and target</h2>
        <p className="project-reference-lead">
          Your uploaded photo is the observation source. The target painting is
          the accepted atelier demonstration for this lesson — study it for
          structure, values, and color, not as a pixel-perfect copy.
        </p>
      </header>

      <div
        className={
          showMaster
            ? "project-reference-grid is-pair"
            : "project-reference-grid"
        }
      >
        {summary.imageUrl ? (
          <figure className="reference-figure">
            <AppImage
              src={summary.imageUrl}
              alt={`Reference for ${summary.title}`}
              width={1400}
              height={1050}
              sizes="(max-width: 900px) 100vw, 560px"
              className="reference-figure-img"
            />
            <figcaption className="reference-caption">
              <strong>Reference</strong>
              <span>Your original upload</span>
            </figcaption>
          </figure>
        ) : (
          <div className="card overview-reference-empty">
            No reference image was saved for this project.
          </div>
        )}

        {showMaster && masterImageUrl ? (
          <figure className="reference-figure">
            <AppImage
              src={masterImageUrl}
              alt={`Target painting for ${summary.title}`}
              width={1400}
              height={1050}
              sizes="(max-width: 900px) 100vw, 560px"
              className="reference-figure-img"
            />
            <figcaption className="reference-caption">
              <strong>Target</strong>
              <span>
                {masterStatus === "needsReview"
                  ? "Candidate painting (review)"
                  : "Accepted lesson target"}
              </span>
            </figcaption>
          </figure>
        ) : null}
      </div>
    </div>
  );
}
