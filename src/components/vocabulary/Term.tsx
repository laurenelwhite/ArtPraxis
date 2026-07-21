"use client";

import { useEffect, useId, useRef, useState } from "react";
import { getTerm } from "@/lib/vocabulary";
import { markSeen, readSeen } from "@/components/vocabulary/seen";
import { useTermBudget } from "@/components/vocabulary/TermBudget";

// An inline, tappable art term. Reveals a concise definition, why it matters,
// and where it is practiced. A subtle dot marks a small number of terms the
// reader hasn't opened yet (see TermBudget), so new vocabulary announces itself
// without turning the page into a field of dots. Opening a term retires its dot
// permanently for that browser profile.
export function Term({ id, children }: { id: string; children?: React.ReactNode }) {
  const term = getTerm(id);
  const budget = useTermBudget();
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(true); // default true → no dot flash before hydration
  const [badge, setBadge] = useState(false);
  const wrapRef = useRef<HTMLSpanElement>(null);
  const popId = useId();

  useEffect(() => {
    if (!term) return;
    const already = readSeen().has(term.id);
    setSeen(already);
    if (!already) setBadge(budget ? budget.requestBadge(term.id) : true);
  }, [term, budget]);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!term) return <>{children}</>;

  const isNew = badge && !seen;

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        markSeen(term.id);
        setSeen(true);
        budget?.noteOpened(term.id);
      }
      return next;
    });
  };

  return (
    <span className="term-wrap" ref={wrapRef}>
      <button
        type="button"
        className={`term${isNew ? " term-new" : ""}${open ? " term-open" : ""}`}
        aria-expanded={open}
        aria-controls={popId}
        onClick={toggle}
      >
        {children ?? term.term}
      </button>
      {open && (
        <span className="term-pop" id={popId} role="dialog" aria-label={`${term.term} — definition`}>
          <span className="term-pop-head">{term.term}</span>
          <span className="term-pop-def">{term.short}</span>
          <span className="term-pop-row why">
            <span className="term-pop-label">Why it matters</span>
            {term.why}
          </span>
          <span className="term-pop-row where">
            <span className="term-pop-label">Where you practice it</span>
            {term.where}
          </span>
        </span>
      )}
    </span>
  );
}
