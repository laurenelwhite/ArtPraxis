"use client";

import { useEffect, useRef, useState } from "react";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

type BrandSplashProps = {
  active?: boolean;
  onDone?: () => void;
  label?: string;
};

/**
 * Branded entry splash — primary logo only.
 * Not for every client-side route change.
 */
export function BrandSplash({
  active = true,
  onDone,
  label = "ArtPraxis",
}: BrandSplashProps) {
  const [visible, setVisible] = useState(active);
  const [exiting, setExiting] = useState(false);
  const mountedAt = useRef(Date.now());
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (active) {
      setVisible(true);
      setExiting(false);
      return;
    }

    if (!visible) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minDwell = reduced ? 60 : 900;
    const wait = Math.max(0, minDwell - (Date.now() - mountedAt.current));
    const exitMs = reduced ? 40 : 250;

    const exitTimer = window.setTimeout(() => setExiting(true), wait);
    const doneTimer = window.setTimeout(() => {
      setVisible(false);
      setExiting(false);
      onDoneRef.current?.();
    }, wait + exitMs);

    return () => {
      window.clearTimeout(exitTimer);
      window.clearTimeout(doneTimer);
    };
  }, [active, visible]);

  if (!visible) return null;

  return (
    <div
      className={["brand-splash", exiting ? "is-exiting" : ""].join(" ")}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div className="brand-splash-inner">
        <ArtPraxisLogo variant="primary" size="splash" />
      </div>
    </div>
  );
}
