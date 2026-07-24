"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { AdaptiveNavLogo } from "@/components/brand/AdaptiveNavLogo";
import type { BrandTheme } from "@/lib/branding/brand-theme";

/**
 * Approved ArtPraxis logo variants.
 * Always render from `/public/brand` assets — never invent inline approximations.
 *
 * Visual source of truth:
 * `docs/references/branding/logo/artpraxis-approved-logo-package.png.png`
 *
 * Production artwork must replace the temporary SVGs in `public/brand/`
 * without changing this component API.
 *
 * Adaptive branding (lesson top bar only): when `adaptiveTheme` is set on the
 * navigation variant, only the painted brush mark adapts. Wordmark stays navy.
 */
export type ArtPraxisLogoVariant =
  | "primary"
  | "navigation"
  | "sidebar"
  | "icon"
  | "inverse";

/**
 * Approved size presets only. Arbitrary width/height is not supported.
 * Sidebar uses its own SVG proportions (width-driven), not a scaled primary.
 */
export type ArtPraxisLogoSize =
  | "primary"
  | "navigationDesktop"
  | "navigationMobile"
  | "sidebar"
  | "splash"
  | "icon"
  | "favicon";

type ArtPraxisLogoProps = {
  variant?: ArtPraxisLogoVariant;
  /** Defaults from variant when omitted */
  size?: ArtPraxisLogoSize;
  className?: string;
  /** Decorative contexts may hide the accessible name on a wrapping link */
  decorative?: boolean;
  /** Eager-load hint for above-the-fold brand (sidebar / masthead) */
  priority?: boolean;
  /**
   * Lesson-adaptive brush mark theme. Only applied for `variant="navigation"`.
   * Omit / null → official navy lockup asset.
   */
  adaptiveTheme?: BrandTheme | null;
};

const ASSETS: Record<ArtPraxisLogoVariant, string> = {
  primary: "/brand/artpraxis-logo-full.svg",
  /** Horizontal nav lockup — lesson top bar (see public/brand/APPROVED_NAV_LOGO.md) */
  navigation: "/brand/artpraxis-logo-navigation.svg",
  /** Dedicated stacked lockup — do not substitute primary/compact */
  sidebar: "/brand/artpraxis-logo-sidebar.svg",
  icon: "/brand/artpraxis-mark.svg",
  inverse: "/brand/artpraxis-logo-inverse.svg",
};

/** Intrinsic SVG dimensions (width × height) for width/height attrs */
const INTRINSIC: Record<ArtPraxisLogoVariant, { w: number; h: number }> = {
  primary: { w: 320, h: 72 },
  navigation: { w: 248, h: 56 },
  sidebar: { w: 200, h: 74 },
  icon: { w: 48, h: 48 },
  inverse: { w: 320, h: 72 },
};

/** Visual height in px for height-driven variants (nav / primary / icon) */
const SIZE_HEIGHT: Record<ArtPraxisLogoSize, number> = {
  primary: 64,
  navigationDesktop: 48,
  navigationMobile: 36,
  /** Hint only — sidebar CSS is width-driven (min(100%, 198px), height:auto) */
  sidebar: 74,
  splash: 72,
  icon: 32,
  favicon: 28,
};

const DEFAULT_SIZE: Record<ArtPraxisLogoVariant, ArtPraxisLogoSize> = {
  primary: "primary",
  navigation: "navigationDesktop",
  sidebar: "sidebar",
  icon: "icon",
  inverse: "primary",
};

/** @deprecated Prefer variant="primary" | "navigation" | "sidebar" | "icon" */
const LEGACY_VARIANT: Record<string, ArtPraxisLogoVariant> = {
  full: "primary",
  compact: "navigation",
  mark: "icon",
  inverse: "inverse",
};

/** @deprecated Prefer size presets */
const LEGACY_SIZE: Record<string, ArtPraxisLogoSize> = {
  sm: "navigationDesktop",
  md: "primary",
  lg: "splash",
};

function resolveVariant(variant: string | undefined): ArtPraxisLogoVariant {
  if (!variant) return "primary";
  if (variant in ASSETS) return variant as ArtPraxisLogoVariant;
  return LEGACY_VARIANT[variant] ?? "primary";
}

function resolveSize(
  size: string | undefined,
  variant: ArtPraxisLogoVariant,
): ArtPraxisLogoSize {
  if (!size) return DEFAULT_SIZE[variant];
  if (size in SIZE_HEIGHT) return size as ArtPraxisLogoSize;
  return LEGACY_SIZE[size] ?? DEFAULT_SIZE[variant];
}

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/**
 * Single entry point for ArtPraxis logos.
 * Uses dedicated exported lockups — do not scale primary for navigation or sidebar.
 * Do not use the package screenshot as a live navbar image.
 */
export function ArtPraxisLogo({
  variant: variantProp = "primary",
  size: sizeProp,
  className,
  decorative = false,
  priority = false,
  adaptiveTheme = null,
}: ArtPraxisLogoProps) {
  const requested = resolveVariant(variantProp);
  const [activeVariant, setActiveVariant] = useState(requested);
  const [showWordmark, setShowWordmark] = useState(false);
  const size = resolveSize(sizeProp, requested);
  const src = ASSETS[activeVariant];
  const intrinsic = INTRINSIC[activeVariant];
  const isSidebar = requested === "sidebar" || activeVariant === "sidebar";
  const reducedMotion = usePrefersReducedMotion();

  const useAdaptive =
    requested === "navigation" && adaptiveTheme != null && !showWordmark;

  const adaptiveKey = useAdaptive
    ? `${adaptiveTheme.brushTexture}:${adaptiveTheme.accentColor}:${adaptiveTheme.sourceMasterUrl ?? ""}`
    : "navy";

  /** Height-driven presets; sidebar is width-driven via CSS (no --ap-logo-h clamp). */
  const style: CSSProperties | undefined = isSidebar && !showWordmark
    ? undefined
    : { ["--ap-logo-h" as string]: `${SIZE_HEIGHT[size]}px` };

  function handleError() {
    const chain = [requested, "navigation", "primary", "icon"].filter(
      (v, i, arr): v is ArtPraxisLogoVariant => arr.indexOf(v) === i,
    );
    const idx = chain.indexOf(activeVariant);
    const next = idx >= 0 ? chain[idx + 1] : chain[0];
    if (next && next !== activeVariant) {
      setActiveVariant(next);
      return;
    }
    setShowWordmark(true);
  }

  return (
    <span
      className={[
        "ap-logo",
        `ap-logo--${requested}`,
        `ap-logo--size-${size}`,
        useAdaptive ? "ap-logo--adaptive" : null,
        showWordmark ? "ap-logo--wordmark-fallback" : null,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={style}
      {...(decorative
        ? { "aria-hidden": true }
        : { role: "img", "aria-label": "ArtPraxis" })}
    >
      {showWordmark ? (
        <span className="ap-logo-wordmark">ArtPraxis</span>
      ) : useAdaptive && adaptiveTheme ? (
        <AdaptiveNavLogo
          key={adaptiveKey}
          theme={adaptiveTheme}
          instant={reducedMotion}
          height={SIZE_HEIGHT[size]}
        />
      ) : (
        /* eslint-disable-next-line @next/next/no-img-element -- brand SVG lockups must not be cropped/optimized away */
        <img
          key={src}
          src={src}
          alt={decorative ? "" : "ArtPraxis"}
          className="ap-logo-img"
          width={intrinsic.w}
          height={intrinsic.h}
          decoding="async"
          fetchPriority={priority ? "high" : "auto"}
          draggable={false}
          onError={handleError}
        />
      )}
    </span>
  );
}

