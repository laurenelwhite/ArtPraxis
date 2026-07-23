"use client";

import { PaintbrushMark } from "@/components/brand/PaintbrushMark";

export type ArtPraxisDotLoaderProps = {
  label?: string;
  size?: "small" | "medium";
  className?: string;
};

const DOT_COUNT = 5;

/**
 * Painterly five-dot loader with the approved ArtPraxis brush asset.
 * CSS-only motion; decorative brush + dots are aria-hidden.
 */
export function ArtPraxisDotLoader({
  label = "Loading…",
  size = "small",
  className,
}: ArtPraxisDotLoaderProps) {
  const statusLabel = label.trim() || "Loading…";
  const brushW = size === "medium" ? 56 : 44;
  const brushH = size === "medium" ? 22 : 17;

  return (
    <div
      className={[
        "ap-dot-loader",
        `ap-dot-loader--${size}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <div className="ap-dot-loader-row" aria-hidden="true">
        <span className="ap-dot-loader-dots">
          {Array.from({ length: DOT_COUNT }, (_, i) => (
            <span
              key={i}
              className="ap-dot-loader-dot"
              style={{ ["--dot-i" as string]: String(i) }}
            />
          ))}
        </span>
        <span className="ap-dot-loader-brush">
          <PaintbrushMark
            className="ap-dot-loader-brush-img"
            width={brushW}
            height={brushH}
          />
        </span>
      </div>
      <p className="ap-dot-loader-label">{statusLabel}</p>
    </div>
  );
}
