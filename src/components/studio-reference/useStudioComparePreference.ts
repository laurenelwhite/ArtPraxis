"use client";

import { useCallback, useEffect, useState } from "react";
import {
  STUDIO_COMPARE_STORAGE_KEY,
  type StudioCompareMode,
} from "./types";

const VALID: StudioCompareMode[] = [
  "both",
  "overlay",
  "reference",
  "final",
];

function readStored(): StudioCompareMode {
  if (typeof window === "undefined") return "both";
  try {
    const raw = window.localStorage.getItem(STUDIO_COMPARE_STORAGE_KEY);
    if (raw && VALID.includes(raw as StudioCompareMode)) {
      return raw as StudioCompareMode;
    }
  } catch {
    /* ignore */
  }
  return "both";
}

/** Persist last Studio Reference comparison mode across sessions. */
export function useStudioComparePreference(
  initial: StudioCompareMode = "both",
) {
  const [mode, setModeState] = useState<StudioCompareMode>(initial);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setModeState(readStored());
    setHydrated(true);
  }, []);

  const setMode = useCallback((next: StudioCompareMode) => {
    setModeState(next);
    try {
      window.localStorage.setItem(STUDIO_COMPARE_STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
  }, []);

  return { mode, setMode, hydrated } as const;
}
