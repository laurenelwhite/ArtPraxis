"use client";

import { useId } from "react";
import type { BrandTheme } from "@/lib/branding/brand-theme";

type AdaptiveNavLogoProps = {
  theme: BrandTheme;
  /** When true, skip the enter fade (reduced motion or already shown). */
  instant?: boolean;
  className?: string;
  height?: number;
};

/**
 * Approved navigation lockup: Fraunces wordmark, indigo stroke, and brush.
 * The mark stays fixed to Brand Kit 1.0 rather than changing by lesson medium.
 */
export function AdaptiveNavLogo({
  theme,
  instant = false,
  className,
  height = 44,
}: AdaptiveNavLogoProps) {
  const uid = useId().replace(/:/g, "");
  const bristle = `ap-nav-bristle-${uid}`;
  const ferrule = `ap-nav-ferrule-${uid}`;
  const paintGrad = `ap-nav-paint-${uid}`;

  return (
    <span
      className={[
        "ap-logo-adaptive",
        "ap-logo-adaptive--approved",
        instant ? "ap-logo-adaptive--instant" : "ap-logo-adaptive--enter",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        ...theme.cssVariables,
        ["--ap-brush-accent" as string]: "#2C3E56",
        ["--ap-logo-h" as string]: `${height}px`,
      }}
    >
      <svg
        className="ap-logo-adaptive-svg"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 248 56"
        fill="none"
        width={248}
        height={56}
        aria-hidden="true"
        focusable="false"
      >
        {/* Wordmark — NEVER recolored */}
        <text
          x="4"
          y="28"
          fontFamily="var(--font-fraunces), Fraunces, Georgia, serif"
          fontSize="24"
          fontWeight="600"
          fill="#2C3E56"
          letterSpacing="-0.4"
        >
          ArtPraxis
        </text>

        <defs>
          <linearGradient id={bristle} x1="20" y1="2" x2="52" y2="13" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b5e3c" />
            <stop offset="55%" stopColor="#6e4a2f" />
            <stop offset="78%" stopColor="#3a3842" />
            <stop offset="100%" stopColor="#0d1b2a" />
          </linearGradient>
          <linearGradient id={ferrule} x1="12" y1="3" x2="24" y2="12" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#c4c8cc" />
            <stop offset="45%" stopColor="#9aa0a6" />
            <stop offset="100%" stopColor="#6f757b" />
          </linearGradient>
          <linearGradient id={paintGrad} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--ap-brush-accent)" stopOpacity="0.72" />
            <stop offset="42%" stopColor="var(--ap-brush-accent)" stopOpacity="1" />
            <stop offset="78%" stopColor="var(--ap-brush-accent)" stopOpacity="0.88" />
            <stop offset="100%" stopColor="var(--ap-brush-accent)" stopOpacity="0.55" />
          </linearGradient>
        </defs>

        {/* Painted underline — adaptive color + medium texture via CSS */}
        <g className="ap-logo-adaptive-mark" opacity="var(--ap-brush-opacity)">
          <path
            className="ap-logo-adaptive-stroke"
            d="M6 38.4 C40 34.8 84 33.6 128 35 C158 36 178 37.8 190.5 38.6 L191.2 43.2 C178 42.2 158 40.4 128 39.4 C84 37.8 40 38.8 6 41.8 Z"
            fill={`url(#${paintGrad})`}
          />
          <path
            className="ap-logo-adaptive-stroke-edge"
            d="M12 41 C48 38.6 96 37.8 140 39 C165 39.8 180 40.8 190.8 41.4"
            stroke="var(--ap-brush-accent)"
            strokeWidth="1.35"
            strokeLinecap="round"
            opacity="0.28"
            fill="none"
          />
          {/* Medium texture overlays (CSS-driven; decorative only) */}
          <path
            className="ap-logo-adaptive-texture"
            d="M10 39.2 C50 36.2 100 35.6 148 37.2 C170 38 184 39.2 192 40"
            stroke="var(--ap-brush-accent)"
            strokeWidth="0.9"
            strokeLinecap="round"
            fill="none"
            opacity="0"
          />
        </g>

        {/* Brush hardware — official colors; only the paint tip adapts */}
        <g transform="translate(184,30) rotate(-15)">
          <path d="M0 7.6 L15 4.8 L16.6 11.6 L1.6 14.2 Z" fill="#1c1c1c" />
          <path d="M14.4 4.4 L24 2.6 L25.8 11.8 L16.2 13.4 Z" fill={`url(#${ferrule})`} />
          <path d="M16 5.8 L23.8 4.2" stroke="#c4c8cc" strokeWidth="0.5" opacity="0.85" />
          <path d="M16.6 10.2 L24.2 8.8" stroke="#6f757b" strokeWidth="0.45" opacity="0.7" />
          <path
            d="M24 2.2 C33.2 0.2 44 -0.2 53.2 3.2 C58.2 5 62 8 63.6 10.4 C61.2 12.2 55.2 13.4 48.2 13 C40.2 12.6 32.2 11.4 26.2 10.4 Z"
            fill={`url(#${bristle})`}
          />
          <path
            d="M26 3.6 C34.5 1.6 44.5 1.4 53.5 4.2"
            stroke="#6e4a2f"
            strokeWidth="0.45"
            opacity="0.4"
          />
          <path
            className="ap-logo-adaptive-tip"
            d="M49.2 4.6 C54.8 5.8 59.2 8.2 62.4 10.4 C60 11.8 55.4 12.6 51 12 C47.8 11.5 46.4 8.8 47.6 6.8 C48 5.8 48.6 5 49.2 4.6 Z"
            fill="var(--ap-brush-accent)"
            opacity="0.95"
          />
        </g>
      </svg>
    </span>
  );
}
