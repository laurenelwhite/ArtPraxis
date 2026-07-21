import type { StageVisual } from "@/lib/progression";

// Single point of truth for rendering a stage image. Swapping placeholders for
// real AI images later is just a matter of `visual.url` being populated — no
// caller needs to change.
export function StageImageView({
  visual,
  alt,
  thumb = false,
}: {
  visual: StageVisual;
  alt: string;
  thumb?: boolean;
}) {
  if (visual.url) {
    return <img className="stage-img" src={visual.url} alt={alt} loading="lazy" />;
  }

  if (visual.referenceUrl) {
    return (
      <span className="stage-placeholder">
        <img
          className="stage-img"
          src={visual.referenceUrl}
          alt={alt}
          loading="lazy"
          style={{ filter: visual.filter }}
        />
        {!thumb && <span className="stage-placeholder-tag" aria-hidden="true">Placeholder · in development</span>}
      </span>
    );
  }

  return <span className="stage-placeholder empty" role="img" aria-label={alt} />;
}
