"use client";

type BrushProgressProps = {
  /** 0–100 when known; omit or null for indeterminate */
  progress?: number | null;
  label?: string;
  className?: string;
  /** Show percentage text only when real progress is known */
  showValue?: boolean;
};

/**
 * Secondary determinate progress bar (non-brand).
 * Prefer ArtPraxisLoadingMark for loading / generation brand moments.
 */
export function BrushProgress({
  progress = null,
  label,
  className,
  showValue = false,
}: BrushProgressProps) {
  const known =
    typeof progress === "number" &&
    Number.isFinite(progress) &&
    progress >= 0;
  const clamped = known ? Math.min(100, Math.max(0, progress as number)) : null;
  const indeterminate = !known;

  return (
    <div
      className={["brush-progress", indeterminate ? "is-indeterminate" : "", className]
        .filter(Boolean)
        .join(" ")}
      role="progressbar"
      aria-label={label || "Progress"}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={clamped ?? undefined}
      aria-valuetext={
        indeterminate
          ? "In progress"
          : `${Math.round(clamped as number)} percent`
      }
    >
      {label && <p className="brush-progress-label">{label}</p>}
      <div className="brush-progress-track">
        <span
          className="brush-progress-fill"
          style={
            clamped != null
              ? { width: `${clamped}%` }
              : undefined
          }
          aria-hidden="true"
        />
      </div>
      {showValue && clamped != null && (
        <span className="brush-progress-value">{Math.round(clamped)}%</span>
      )}
    </div>
  );
}
