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
        key={visual.url}
        className="stage-img stage-img--fade stage-img--museum"
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
      <span className="stage-placeholder stage-placeholder--awaiting">
        <AppImage
          className="stage-img stage-img--museum"
          src={visual.referenceUrl}
          alt={alt}
          width={thumb ? 240 : 1200}
          height={thumb ? 300 : 1500}
          sizes={thumb ? "80px" : "(max-width: 900px) 100vw, 640px"}
          style={{ filter: visual.filter }}
          loading="lazy"
        />
        {!thumb && (
          <span
            className="stage-placeholder-tag stage-placeholder-tag--live"
            aria-hidden="true"
          >
            <span className="stage-placeholder-tag-dot" />
            Preparing…
          </span>
        )}
      </span>
    );
  }

  return (
    <span
      className="stage-placeholder empty stage-placeholder--awaiting stage-placeholder--compact"
      role="img"
      aria-label={alt || "Demonstration arriving"}
    >
      {!thumb ? (
        <span
          className="stage-placeholder-tag stage-placeholder-tag--live"
          aria-hidden="true"
        >
          <span className="stage-placeholder-tag-dot" />
          Arriving…
        </span>
      ) : null}
    </span>
  );
}
