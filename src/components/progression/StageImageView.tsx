import type { StageVisual } from "@/lib/progression";
import { AppImage } from "@/components/ui/AppImage";

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
  // Prefer intrinsic width/height + existing absolute CSS in stage thumbs/figures
  // (do not use fill — parents apply position:absolute; inset:0 to .stage-img).
  if (visual.url) {
    return (
      <AppImage
        className="stage-img"
        src={visual.url}
        alt={alt}
        width={thumb ? 240 : 1200}
        height={thumb ? 300 : 1500}
        sizes={thumb ? "80px" : "(max-width: 900px) 100vw, 640px"}
        loading="lazy"
      />
    );
  }

  if (visual.referenceUrl) {
    return (
      <span className="stage-placeholder">
        <AppImage
          className="stage-img"
          src={visual.referenceUrl}
          alt={alt}
          width={thumb ? 240 : 1200}
          height={thumb ? 300 : 1500}
          sizes={thumb ? "80px" : "(max-width: 900px) 100vw, 640px"}
          style={{ filter: visual.filter }}
          loading="lazy"
        />
        {!thumb && <span className="stage-placeholder-tag" aria-hidden="true">Placeholder · in development</span>}
      </span>
    );
  }

  return <span className="stage-placeholder empty" role="img" aria-label={alt} />;
}
