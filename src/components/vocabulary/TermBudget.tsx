"use client";

import { createContext, useContext, useMemo, useRef } from "react";
import { readSeen } from "@/components/vocabulary/seen";

// The "new term" dot is a gentle invitation, not a checklist. We cap it to a
// few unseen terms per lesson view so it stays special. Each view (Study or
// Paint) mounts its own provider, giving it a fresh budget.
const MAX_NEW_PER_VIEW = 3;

type Budget = {
  /** Grants a "new" dot to the first few unseen terms; idempotent per term. */
  requestBadge: (id: string) => boolean;
  /** Marks a term opened so its slot is treated as spent going forward. */
  noteOpened: (id: string) => void;
};

const TermBudgetContext = createContext<Budget | null>(null);

export function useTermBudget(): Budget | null {
  return useContext(TermBudgetContext);
}

export function TermBudgetProvider({ children }: { children: React.ReactNode }) {
  const seenRef = useRef<Set<string> | null>(null);
  const handed = useRef<Set<string>>(new Set());

  const value = useMemo<Budget>(
    () => ({
      requestBadge: (id: string) => {
        if (!seenRef.current) seenRef.current = readSeen();
        if (seenRef.current.has(id)) return false; // already engaged before
        if (handed.current.has(id)) return false; // one dot per term
        if (handed.current.size >= MAX_NEW_PER_VIEW) return false; // budget spent
        handed.current.add(id);
        return true;
      },
      noteOpened: (id: string) => {
        if (!seenRef.current) seenRef.current = readSeen();
        seenRef.current.add(id);
      },
    }),
    [],
  );

  return <TermBudgetContext.Provider value={value}>{children}</TermBudgetContext.Provider>;
}
