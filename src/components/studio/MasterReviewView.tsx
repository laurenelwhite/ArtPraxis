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
 * Full-viewport master reveal — Accept Lesson or Regenerate.
 * Stage images are never generated until the user accepts.
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
  headline = "Your atelier interpretation",
  detail = "Accept this painting as your lesson target, or regenerate a new one.",
}: Props) {
  const busy = regenerating || accepting;

  return (
    <section
      className={[
        "lesson-state-view",
        "master-review-view",
        "master-review-view--reveal",
        regenerating ? "is-regenerating" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label="Review atelier interpretation"
    >
      <div className="master-review-hero artwork-frame artwork-frame--painting">
        <div className="artwork-frame-mat">
          <div className="artwork-frame-fillet">
            <div className="artwork-frame-stage master-review-hero-stage">
              {masterImageUrl ? (
                <AppImage
                  key={masterImageUrl}
                  src={masterImageUrl}
                  alt="Your atelier interpretation"
                  className="master-review-hero-img master-reveal-img cmp-frame-img--painting"
                  width={1600}
                  height={1200}
                  sizes="100vw"
                  style={{ width: "100%", height: "auto" }}
                  priority
                />
              ) : (
                <div className="master-review-view-pending" role="status">
                  <p>Saving the painting…</p>
                </div>
              )}
              {regenerating ? (
                <div className="master-regen-overlay" role="status" aria-live="polite">
                  <span className="master-regen-overlay-pulse" aria-hidden="true" />
                  <div className="master-regen-overlay-copy">
                    <p className="master-regen-overlay-title">Painting another option…</p>
                    <p className="master-regen-overlay-keep">
                      Your current candidate stays visible until the next one is ready.
                    </p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      <div className="master-review-reveal-panel">
        <p className="atelier-wait-eyebrow">Target painting</p>
        <h2 className="atelier-wait-heading master-review-reveal-heading">{headline}</h2>
        <p className="atelier-wait-body">{detail}</p>

        {referenceUrl ? (
          <figure className="master-review-ref-chip">
            <AppImage
              src={referenceUrl}
              alt=""
              className="master-review-ref-chip-img"
              width={120}
              height={90}
              sizes="72px"
            />
            <figcaption>From your reference</figcaption>
          </figure>
        ) : null}

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
              {accepting ? "Opening lesson…" : "Accept Lesson"}
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
              {regenerating ? "Painting…" : "Regenerate"}
            </button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
