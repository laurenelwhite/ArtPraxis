"use client";

import { AppImage } from "@/components/ui/AppImage";
import { FinalPaintingRegenStatus } from "@/components/studio/FinalPaintingRegenStatus";
import type {
  FinalPaintingRegenerationState,
  RegenerationChecklistPhase,
} from "@/lib/final-painting-regeneration";
import type { Medium } from "@/lib/tutorial-schema";

type Props = {
  referenceUrl: string;
  masterImageUrl: string | null;
  reasons?: string[];
  regenerating?: boolean;
  regenerationState?: FinalPaintingRegenerationState;
  regenerationStartedAt?: number | null;
  regenerationError?: string | null;
  regenerationPhase?: RegenerationChecklistPhase | null;
  medium?: Medium | null;
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
 * Prior candidate stays visible under a compact regen status (never blanked).
 */
export function MasterReviewView({
  referenceUrl,
  masterImageUrl,
  reasons = [],
  regenerating = false,
  regenerationState = "idle",
  regenerationStartedAt = null,
  regenerationError = null,
  regenerationPhase = null,
  medium = null,
  accepting = false,
  canAccept = true,
  onAccept,
  onRegenerate,
  headline = "Your atelier interpretation",
  detail = "Accept this painting as your lesson target, or regenerate a new one.",
}: Props) {
  const busy = regenerating || accepting;
  const showRegen =
    regenerating ||
    regenerationState === "queued" ||
    regenerationState === "generating" ||
    regenerationState === "validating" ||
    regenerationState === "error";

  return (
    <section
      className={[
        "lesson-state-view",
        "master-review-view",
        "master-review-view--reveal",
        showRegen ? "is-regenerating" : null,
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
              {showRegen ? (
                <div className="master-regen-overlay master-regen-overlay--compact">
                  <FinalPaintingRegenStatus
                    state={
                      regenerationState !== "idle"
                        ? regenerationState
                        : regenerating
                          ? "generating"
                          : "idle"
                    }
                    phase={regenerationPhase}
                    startedAt={regenerationStartedAt}
                    error={regenerationError}
                    medium={medium}
                    onRetry={onRegenerate}
                    compact
                  />
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
