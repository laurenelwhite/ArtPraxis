"use client";

import { AppImage } from "@/components/ui/AppImage";

type Props = {
  referenceUrl: string;
  masterImageUrl: string | null;
  reasons?: string[];
  regenerating?: boolean;
  accepting?: boolean;
  canAccept?: boolean;
  onAccept?: () => void;
  onRegenerate?: () => void;
  headline?: string;
  detail?: string;
};

/**
 * Two plates on the table — accept or try again.
 * Regeneration keeps the current candidate visible under a calm overlay.
 */
export function MasterReviewView({
  referenceUrl,
  masterImageUrl,
  reasons = [],
  regenerating = false,
  accepting = false,
  canAccept = true,
  onAccept,
  onRegenerate,
  headline = "Ready for review",
  detail = "Accept this painting as your lesson target, or ask for another.",
}: Props) {
  const busy = regenerating || accepting;

  return (
    <section
      className="lesson-state-view master-review-view atelier-studio-note-view"
      aria-label="Review master painting"
    >
      <p className="atelier-wait-eyebrow">Target painting</p>
      <h2 className="atelier-wait-heading">{headline}</h2>
      <p className="atelier-wait-body">{detail}</p>

      <div className="master-review-view-compare atelier-plates">
        <figure className="atelier-studio-painting atelier-wait-frame">
          <AppImage
            src={referenceUrl}
            alt="Uploaded reference"
            className="atelier-studio-painting-img atelier-wait-frame-img"
            width={1200}
            height={900}
            sizes="(max-width: 900px) 45vw, 420px"
            style={{ width: "100%", height: "auto" }}
          />
          <figcaption className="atelier-wait-frame-label">Your reference</figcaption>
        </figure>

        <figure
          className={[
            "atelier-studio-painting",
            "atelier-wait-frame",
            "master-review-candidate",
            regenerating ? "is-regenerating" : null,
          ]
            .filter(Boolean)
            .join(" ")}
        >
          {masterImageUrl ? (
            <AppImage
              src={masterImageUrl}
              alt="Proposed target painting"
              className="atelier-studio-painting-img atelier-wait-frame-img"
              width={1200}
              height={900}
              sizes="(max-width: 900px) 45vw, 420px"
              style={{ width: "100%", height: "auto" }}
            />
          ) : (
            <div className="master-review-view-pending" role="status">
              <p>Saving the painting…</p>
            </div>
          )}
          <figcaption className="atelier-wait-frame-label">Inspiration</figcaption>
          {regenerating ? (
            <div className="master-regen-overlay" role="status" aria-live="polite">
              <p className="master-regen-overlay-copy">Painting another option…</p>
            </div>
          ) : null}
        </figure>
      </div>

      {reasons.length > 0 ? (
        <ul className="master-review-view-reasons">
          {reasons.map((reason) => (
            <li key={reason}>{reason}</li>
          ))}
        </ul>
      ) : null}

      <div className="master-review-view-actions atelier-plate-actions">
        {onAccept ? (
          <button
            type="button"
            className="primary btn-branded"
            onClick={onAccept}
            disabled={busy || !canAccept || !masterImageUrl}
          >
            {accepting ? "Accepting…" : "Accept Target"}
          </button>
        ) : null}
        {onRegenerate ? (
          <button
            type="button"
            className="secondary"
            onClick={onRegenerate}
            disabled={busy}
            aria-disabled={busy}
          >
            {regenerating ? "Painting…" : "Try another"}
          </button>
        ) : null}
      </div>
    </section>
  );
}
