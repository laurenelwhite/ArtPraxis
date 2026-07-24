"use client";

import type { ReactNode } from "react";

export type LessonTab = {
  id: string;
  label: string;
};

type LessonShellProps = {
  title: string;
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

/**
 * Unified lesson page chrome under the global AppShell.
 * Renders the page title strip + project tabs once — never a second app header.
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
  return (
    <div
      className={["lesson-shell", "lesson-view", generating ? "lesson-view--generating" : null]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="lesson-shell-head">
        <div className="lesson-shell-copy">
          {breadcrumb ? <div className="lesson-breadcrumb">{breadcrumb}</div> : null}
          {eyebrow ? <div className="eyebrow project-eyebrow">{eyebrow}</div> : null}
          <h1 className="lesson-shell-title lesson-title">{title}</h1>
        </div>
        {actions ? <div className="lesson-shell-actions">{actions}</div> : null}
      </div>

      <nav
        id="lesson-section-tabs"
        className="project-tabs lesson-shell-tabs"
        role="tablist"
        aria-label="Project sections"
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
