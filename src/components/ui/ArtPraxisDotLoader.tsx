"use client";

import { PaintbrushMark } from "@/components/brand/PaintbrushMark";

export type ArtPraxisDotLoaderProps = {
  label?: string;
  size?: "small" | "medium";
  className?: string;
  /** When false, omit status semantics if adjacent copy already announces progress. */
  announce?: boolean;
};

const DOT_COUNT = 5;

/**
 * Painterly five-dot loader with the approved ArtPraxis brush asset.
 * CSS-only motion; decorative brush + dots are aria-hidden.
 * Currently unused by live loading views (pigment loader is primary), retained for reuse.
 */
export function ArtPraxisDotLoader({
  label = "Loading…",
  size = "small",
  className,
  announce = true,
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
      role={announce ? "status" : undefined}
      aria-live={announce ? "polite" : undefined}
      aria-label={announce ? statusLabel : undefined}
      aria-hidden={announce ? undefined : true}
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
      {announce ? <p className="ap-dot-loader-label">{statusLabel}</p> : null}
    </div>
  );
}
