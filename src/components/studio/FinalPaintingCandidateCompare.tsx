"use client";

import { useEffect, useRef } from "react";
import { AppImage } from "@/components/ui/AppImage";

type Props = {
  currentUrl: string;
  candidateUrl: string;
  title?: string;
  applying?: boolean;
  onUseNew: () => void;
  onKeepCurrent: () => void;
  onTryAnother?: () => void;
  className?: string;
};

/**
 * Side-by-side Current vs New option when a regeneration candidate is ready.
 * Never destroys the current painting — Keep Current discards only the candidate.
 */
export function FinalPaintingCandidateCompare({
  currentUrl,
  candidateUrl,
  title = "Final Painting",
  applying = false,
  onUseNew,
  onKeepCurrent,
  onTryAnother,
  className,
}: Props) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [candidateUrl]);

  return (
    <section
      className={["fp-candidate-compare", className].filter(Boolean).join(" ")}
      aria-labelledby="fp-candidate-compare-heading"
    >
      <header className="fp-candidate-compare-head">
        <h2
          id="fp-candidate-compare-heading"
          ref={headingRef}
          tabIndex={-1}
          className="fp-candidate-compare-title"
        >
          Another interpretation is ready
        </h2>
        <p className="fp-candidate-compare-reassure">
          Your current lesson stays available until you choose.
        </p>
      </header>

      <div className="fp-candidate-compare-grid">
        <figure className="fp-candidate-plate">
          <figcaption className="fp-candidate-plate-label">Current</figcaption>
          <div className="fp-candidate-plate-frame">
            <AppImage
              src={currentUrl}
              alt={`Current ${title}`}
              width={1200}
              height={900}
              sizes="(max-width: 820px) 50vw, 320px"
              className="fp-candidate-plate-img"
            />
          </div>
        </figure>

        <figure className="fp-candidate-plate">
          <figcaption className="fp-candidate-plate-label">New option</figcaption>
          <div className="fp-candidate-plate-frame">
            <AppImage
              src={candidateUrl}
              alt={`New ${title} option`}
              width={1200}
              height={900}
              sizes="(max-width: 820px) 50vw, 320px"
              className="fp-candidate-plate-img"
            />
          </div>
        </figure>
      </div>

      <div className="fp-candidate-compare-actions">
        <button
          type="button"
          className="primary btn-branded"
          onClick={onUseNew}
          disabled={applying}
        >
          {applying ? "Updating…" : "Use new painting"}
        </button>
        <button
          type="button"
          className="secondary"
          onClick={onKeepCurrent}
          disabled={applying}
        >
          Keep current
        </button>
        {onTryAnother ? (
          <button
            type="button"
            className="secondary"
            onClick={onTryAnother}
            disabled={applying}
          >
            Try another
          </button>
        ) : null}
      </div>
    </section>
  );
}
