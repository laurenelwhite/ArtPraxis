"use client";

import { useEffect, useRef, type ReactNode } from "react";

export type LessonTab = {
  id: string;
  label: string;
};

type LessonShellProps = {
  title: string;
  /** @deprecated Prefer keeping breadcrumb out of the hero; still accepted for back-compat. */
  breadcrumb?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
  tabs: readonly LessonTab[];
  activeTab: string;
  onTabChange: (id: string) => void;
  /** When true, locks non-overview / non-lesson tabs. */
  tabsLocked?: boolean;
  generating?: boolean;
  children: ReactNode;
};

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Unified lesson page chrome under the global AppShell.
 * Hero: Title → Metadata/Status → Tabs. Secondary actions live in overflow.
 */
export function LessonShell({
  title,
  breadcrumb,
  eyebrow,
  actions,
  tabs,
  activeTab,
  onTabChange,
  tabsLocked = false,
  generating = false,
  children,
}: LessonShellProps) {
  const tablistRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const tablist = tablistRef.current;
    if (!tablist) return;
    const activeButton = tablist.querySelector<HTMLElement>(
      `[data-lesson-tab="${activeTab}"]`,
    );
    if (!activeButton) return;
    if (tablist.scrollWidth <= tablist.clientWidth + 2) return;
    activeButton.scrollIntoView({
      behavior: prefersReducedMotion() ? "auto" : "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  return (
    <div
      className={["lesson-shell", "lesson-view", generating ? "lesson-view--generating" : null]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="lesson-shell-head">
        <div className="lesson-shell-copy">
          {breadcrumb ? (
            <div className="lesson-breadcrumb lesson-breadcrumb--secondary">
              {breadcrumb}
            </div>
          ) : null}
          <h1 className="lesson-shell-title lesson-title">{title}</h1>
          {eyebrow ? <div className="eyebrow project-eyebrow">{eyebrow}</div> : null}
        </div>
        {actions ? <div className="lesson-shell-actions">{actions}</div> : null}
      </div>

      <nav
        ref={tablistRef}
        id="lesson-section-tabs"
        className="project-tabs lesson-shell-tabs"
        role="tablist"
        aria-label="Lesson sections"
      >
        {tabs.map((t) => {
          const locked =
            tabsLocked && t.id !== "overview" && t.id !== "lesson";
          const selected = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`lesson-tab-${t.id}`}
              data-lesson-tab={t.id}
              aria-controls={`lesson-panel-${t.id}`}
              aria-selected={selected}
              aria-disabled={locked || undefined}
              disabled={locked}
              tabIndex={selected ? 0 : -1}
              className={[
                "project-tab",
                selected ? "active" : null,
                locked ? "is-locked" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (locked) return;
                onTabChange(t.id);
              }}
              title={locked ? "Available when your lesson is ready" : undefined}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <div className="lesson-shell-body">{children}</div>
    </div>
  );
}
