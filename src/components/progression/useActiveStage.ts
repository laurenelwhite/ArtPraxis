"use client";

import { useCallback, useEffect, useRef, useState } from "react";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scroll-linked chapter navigation for the six lesson stages.
 *
 * - `domIds` are the stable element ids of each stage section (e.g.
 *   "lesson-stage-sketch"). They double as URL hashes for deep-linking.
 * - The active stage is whichever section is crossing the vertical centre of
 *   the viewport (IntersectionObserver — no scroll hijacking, no snap).
 * - `scrollTo` scrolls the window to a stage. Offset beneath the sticky project
 *   tabs + stage nav is handled by each section's CSS `scroll-margin-top`, so
 *   headings are never hidden. Clicking pushes a history entry (so browser
 *   back/forward step through visited stages); scrolling only updates the
 *   highlight.
 * - On mount, an incoming `#stage-…` hash deep-links to that stage; `popstate`
 *   keeps back/forward in sync.
 */
export function useActiveStage(domIds: string[]) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLElement | null)[]>([]);
  const setters = useRef<Array<(el: HTMLElement | null) => void>>([]);
  const idsKey = domIds.join("|");

  // Return a stable callback per index so refs don't churn on re-render.
  const setRef = useCallback((i: number) => {
    if (!setters.current[i]) {
      setters.current[i] = (el: HTMLElement | null) => {
        refs.current[i] = el;
      };
    }
    return setters.current[i];
  }, []);

  // Resolve a stage element from a registered ref, or fall back to its stable
  // DOM id (Study Mode renders its sections outside this hook's component).
  const elementAt = useCallback(
    (i: number): HTMLElement | null =>
      refs.current[i] ?? (typeof document !== "undefined" ? document.getElementById(domIds[i]) : null),
    [domIds],
  );

  // Scroll to a stage. `scrollIntoView` honours the section's CSS
  // `scroll-margin-top`, so the heading clears the sticky controls.
  const scrollToIndex = useCallback(
    (i: number, opts: { smooth?: boolean; updateHash?: boolean } = {}) => {
      const el = elementAt(i);
      if (!el) return;
      const { smooth = true, updateHash = true } = opts;
      el.scrollIntoView({ behavior: smooth && !prefersReducedMotion() ? "smooth" : "auto", block: "start" });
      if (updateHash && typeof history !== "undefined" && domIds[i]) {
        const next = `#${domIds[i]}`;
        if (window.location.hash !== next) history.pushState(null, "", next);
      }
      setActive(i);
    },
    [domIds, elementAt],
  );

  const scrollTo = useCallback((i: number) => scrollToIndex(i), [scrollToIndex]);

  // Deep-link from an incoming hash on first mount, and keep browser
  // back/forward in sync via popstate. Also accept legacy `stage-*` hashes.
  useEffect(() => {
    const resolveHashIndex = (hash: string) => {
      if (!hash) return -1;
      const direct = domIds.indexOf(hash);
      if (direct >= 0) return direct;
      // Legacy hashes: stage-pencil-sketch → match by stage id suffix
      if (hash.startsWith("stage-")) {
        const legacyId = hash.slice("stage-".length);
        return domIds.findIndex((id) => id.endsWith(legacyId) || id.includes(legacyId));
      }
      return -1;
    };

    const goToHash = (smooth: boolean) => {
      const hash = window.location.hash.replace(/^#/, "");
      const idx = resolveHashIndex(hash);
      if (idx < 0) return;
      setActive(idx);
      // Wait a frame so layout is ready before measuring the scroll target.
      requestAnimationFrame(() => scrollToIndex(idx, { smooth, updateHash: false }));
    };

    goToHash(false);
    const onPopState = () => goToHash(false);
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  // Track the centred stage as the user scrolls (highlight only — no history).
  useEffect(() => {
    let observer: IntersectionObserver | null = null;
    let cancelled = false;

    const attach = () => {
      if (cancelled) return;
      const els = domIds
        .map((_, i) => elementAt(i))
        .filter((el): el is HTMLElement => Boolean(el));
      if (els.length === 0) {
        requestAnimationFrame(attach);
        return;
      }
      observer = new IntersectionObserver(
        (entries) => {
          const top = entries
            .filter((e) => e.isIntersecting)
            .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
          if (!top) return;
          const idx = domIds.indexOf((top.target as HTMLElement).id);
          if (idx >= 0) setActive(idx);
        },
        // Bias toward the upper workspace beneath sticky chrome
        { rootMargin: "-30% 0px -55% 0px", threshold: [0, 0.15, 0.35, 0.6, 1] },
      );
      els.forEach((el) => observer!.observe(el));
    };

    attach();
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey]);

  return { active, scrollTo, setRef };
}
