"use client";

import { AppImage } from "@/components/ui/AppImage";
import { ArtworkFrame } from "@/components/progression/ArtworkFrame";
import { useStudioReferenceOptional } from "./StudioReferenceContext";

/**
 * Compact in-flow pair: Reference Photo | Final Painting.
 * Used at the top of Overview and as a stage companion strip.
 */
export function StudioReferencePair({
  referenceUrl,
  finalPaintingUrl,
  title,
  onExpand,
  className,
}: {
  referenceUrl?: string | null;
  finalPaintingUrl?: string | null;
  title: string;
  onExpand?: () => void;
  className?: string;
}) {
  const ctx = useStudioReferenceOptional();
  const open = onExpand ?? ctx?.openFullscreen;

  return (
    <div
      className={["studio-ref-pair", className].filter(Boolean).join(" ")}
    >
      <figure className="studio-ref-pair-figure">
        <figcaption className="studio-ref-pair-caption">
          Reference Photo
        </figcaption>
        {referenceUrl ? (
          <ArtworkFrame variant="reference">
            <button
              type="button"
              className="studio-ref-pair-hit"
              onClick={open}
              disabled={!open}
              aria-label="Open studio reference"
            >
              <AppImage
                src={referenceUrl}
                alt={`Reference for ${title}`}
                width={1200}
                height={900}
                sizes="(max-width: 820px) 100vw, 420px"
                className="studio-ref-img"
              />
            </button>
          </ArtworkFrame>
        ) : (
          <div className="studio-ref-empty">No reference image</div>
        )}
      </figure>

      <figure className="studio-ref-pair-figure">
        <figcaption className="studio-ref-pair-caption">
          Final Painting
        </figcaption>
        {finalPaintingUrl ? (
          <ArtworkFrame variant="painting">
            <button
              type="button"
              className="studio-ref-pair-hit"
              onClick={open}
              disabled={!open}
              aria-label="Open final painting comparison"
            >
              <AppImage
                src={finalPaintingUrl}
                alt={`Final painting for ${title}`}
                width={1200}
                height={900}
                sizes="(max-width: 820px) 100vw, 420px"
                className="studio-ref-img"
              />
            </button>
          </ArtworkFrame>
        ) : (
          <div className="studio-ref-empty">
            Final painting arrives after review
          </div>
        )}
      </figure>
    </div>
  );
}
