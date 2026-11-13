"use client";

// Lightweight, provider-agnostic analytics layer. Events are pushed to a
// GA/GTM-style dataLayer and forwarded to gtag when present. No personal data
// is collected here — callers pass only non-identifying campaign properties.

type AnalyticsValue = string | number | boolean | undefined;
export type AnalyticsProps = Record<string, AnalyticsValue>;

type AnalyticsWindow = Window & {
  dataLayer?: Record<string, unknown>[];
  gtag?: (...args: unknown[]) => void;
};

export function track(event: string, props: AnalyticsProps = {}): void {
  if (typeof window === "undefined") return;

  const w = window as AnalyticsWindow;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, ...props });

  if (typeof w.gtag === "function") {
    w.gtag("event", event, props);
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[analytics]", event, props);
  }
}
