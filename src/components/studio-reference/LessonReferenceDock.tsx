"use client";

import { AppImage } from "@/components/ui/AppImage";
import { FinalPaintingRegenStatus } from "@/components/studio/FinalPaintingRegenStatus";
import { isRegenerationBusy } from "@/lib/final-painting-regeneration";
import { useStudioReference } from "./StudioReferenceContext";

/**
 * Persistent Final Painting companion — LessonReferenceDock.
 *
 * Desktop: compact floating card pinned to the right of the content area.
 * Mobile: FAB that expands into the same card.
 * Never covers primary stage controls (positioned above bottom chrome).
 * Regeneration status attaches here so progress sits with the artwork.
 */
export function LessonReferenceDock({
  hidden = false,
}: {
  /** Hide when the Studio Reference tab already owns the view. */
  hidden?: boolean;
}) {
  const {
    available,
    finalPaintingUrl,
    referenceUrl,
    title,
    dockExpanded,
    setDockExpanded,
    openPanel,
    openFullscreen,
    regenerationState,
    regenerationStartedAt,
    regenerationError,
    regenerationPhase,
    medium,
    onRetryRegeneration,
  } = useStudioReference();

  if (!available || hidden) return null;

  const thumb = finalPaintingUrl || referenceUrl;
  const label = finalPaintingUrl ? "Final painting" : "Reference";
  const showRegen =
    regenerationState !== "idle" && regenerationState !== "candidateReady";
  const regenActive = isRegenerationBusy(regenerationState) || regenerationState === "error";

  return (
    <div
      className={[
        "lesson-ref-dock",
        dockExpanded ? "is-expanded" : null,
        regenActive ? "lesson-ref-dock--regen" : null,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <button
        type="button"
        className="lesson-ref-dock-fab"
        aria-expanded={dockExpanded}
        aria-controls="lesson-ref-dock-card"
        onClick={() => setDockExpanded(!dockExpanded)}
      >
        {thumb ? (
          <AppImage
            src={thumb}
            alt=""
            width={96}
            height={96}
            sizes="56px"
            className="lesson-ref-dock-fab-img"
          />
        ) : (
          <span className="lesson-ref-dock-fab-fallback" aria-hidden="true" />
        )}
        {regenActive ? (
          <span className="lesson-ref-dock-fab-pulse" aria-hidden="true" />
        ) : null}
        <span className="visually-hidden">
          {dockExpanded ? "Hide" : "Show"} {label}
          {regenActive ? " — preparing another interpretation" : ""}
        </span>
      </button>

      <aside
        id="lesson-ref-dock-card"
        className="lesson-ref-dock-card"
        aria-label={label}
      >
        <header className="lesson-ref-dock-head">
          <p className="lesson-ref-dock-eyebrow">{label}</p>
          <button
            type="button"
            className="lesson-ref-dock-close"
            onClick={() => setDockExpanded(false)}
            aria-label="Collapse reference dock"
          >
            ×
          </button>
        </header>

        <button
          type="button"
          className="lesson-ref-dock-thumb"
          onClick={openFullscreen}
          aria-label={`Open ${label} fullscreen`}
        >
          {thumb ? (
            <AppImage
              src={thumb}
              alt={`${label} for ${title}`}
              width={320}
              height={240}
              sizes="160px"
              className="lesson-ref-dock-thumb-img"
            />
          ) : (
            <span className="lesson-ref-dock-empty">No image</span>
          )}
        </button>

        {showRegen ? (
          <FinalPaintingRegenStatus
            state={regenerationState}
            phase={regenerationPhase}
            startedAt={regenerationStartedAt}
            error={regenerationError}
            medium={medium}
            onRetry={onRetryRegeneration}
            compact
            className="fp-regen-status--dock"
          />
        ) : null}

        <div className="lesson-ref-dock-actions">
          <button
            type="button"
            className="lesson-ref-dock-action"
            onClick={openFullscreen}
          >
            Expand ↗
          </button>
          <button
            type="button"
            className="lesson-ref-dock-action"
            onClick={openPanel}
          >
            Compare
          </button>
        </div>
      </aside>
    </div>
  );
}
