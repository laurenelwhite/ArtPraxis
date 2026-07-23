"use client";

import { useId } from "react";

type PaintedCheckmarkProps = {
  className?: string;
  label?: string;
};

/** Painted circular checkmark / brush-ring for completion states. */
export function PaintedCheckmark({
  className,
  label = "Complete",
}: PaintedCheckmarkProps) {
  const uid = useId().replace(/:/g, "");

  return (
    <span
      className={["painted-check", className].filter(Boolean).join(" ")}
      role="img"
      aria-label={label}
    >
      <svg viewBox="0 0 64 64" fill="none" aria-hidden="true" focusable="false">
        <defs>
          <linearGradient id={`${uid}-ring`} x1="8" y1="8" x2="56" y2="56">
            <stop offset="0%" stopColor="#0d1b2a" />
            <stop offset="100%" stopColor="#172b3f" />
          </linearGradient>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="26"
          stroke={`url(#${uid}-ring)`}
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray="148 20"
          strokeDashoffset="8"
          className="painted-check-ring"
        />
        <path
          d="M20 33.5 L28.5 41.5 L45 23"
          stroke="#0d1b2a"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="painted-check-mark"
        />
      </svg>
    </span>
  );
}
