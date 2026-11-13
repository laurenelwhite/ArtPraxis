"use client";

type ArtPraxisLoadingMarkProps = {
  label?: string;
  /** @deprecated Wordmark is no longer shown on loading status */
  showWordmark?: boolean;
  className?: string;
  /** @deprecated Percent progress is not used — kept for call-site compatibility */
  progress?: number | null;
};

/**
 * Calm text status for non-pipeline waits (project open, regen overlay).
 * Generation waits use LessonLoadingView’s checklist — no brush GIF/SVG animation.
 */
export function ArtPraxisLoadingMark({
  label = "Preparing…",
  className,
}: ArtPraxisLoadingMarkProps) {
  const statusLabel = label.trim() || "Preparing…";

  return (
    <div
      className={["ap-loading-mark", className].filter(Boolean).join(" ")}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <span className="ap-loading-mark-pulse" aria-hidden="true" />
      {statusLabel ? <p className="ap-loading-mark-label">{statusLabel}</p> : null}
    </div>
  );
}
