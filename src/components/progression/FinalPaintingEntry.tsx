"use client";

import { AppImage } from "@/components/ui/AppImage";
import { useStudioReferenceOptional } from "@/components/studio-reference";

/**
 * Quiet Final Painting entry — opens the Studio Reference companion.
 * Does not duplicate a large reference pair above the stage image.
 */
export function FinalPaintingEntry({
  title,
  className,
}: {
  title: string;
  className?: string;
}) {
  const ctx = useStudioReferenceOptional();
  if (!ctx?.available) return null;

  const thumb = ctx.finalPaintingUrl || ctx.referenceUrl;
  const label = ctx.finalPaintingUrl ? "Final Painting" : "Reference Photo";
  const open = () => {
    ctx.openPanel();
  };

  return (
    <div
      className={["final-painting-entry", className].filter(Boolean).join(" ")}
    >
      <button
        type="button"
        className="final-painting-entry-btn"
        onClick={open}
        aria-label={`Compare with ${label}`}
      >
        {thumb ? (
          <AppImage
            src={thumb}
            alt=""
            width={64}
            height={64}
            sizes="40px"
            className="final-painting-entry-thumb"
          />
        ) : (
          <span className="final-painting-entry-fallback" aria-hidden="true" />
        )}
        <span className="final-painting-entry-copy">
          <span className="final-painting-entry-eyebrow">{label}</span>
          <span className="final-painting-entry-action">
            Compare while you work
          </span>
        </span>
      </button>
      {ctx.referenceUrl && ctx.finalPaintingUrl ? (
        <button
          type="button"
          className="final-painting-entry-ref"
          onClick={() => ctx.openFullscreen()}
        >
          Reference Photo
        </button>
      ) : null}
      <span className="visually-hidden">
        Destination for {title}. Open to compare with this stage.
      </span>
    </div>
  );
}
