"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useStudioComparePreference } from "./useStudioComparePreference";
import type { StudioCompareMode } from "./types";
import type {
  FinalPaintingRegenerationState,
  RegenerationChecklistPhase,
} from "@/lib/final-painting-regeneration";
import type { Medium } from "@/lib/tutorial-schema";

type StudioReferenceContextValue = {
  referenceUrl: string | null;
  finalPaintingUrl: string | null;
  title: string;
  available: boolean;
  compareMode: StudioCompareMode;
  setCompareMode: (mode: StudioCompareMode) => void;
  /** Expanded peek panel open */
  panelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
  /** Fullscreen deep comparison */
  fullscreenOpen: boolean;
  openFullscreen: () => void;
  closeFullscreen: () => void;
  /** Mobile dock FAB expanded */
  dockExpanded: boolean;
  setDockExpanded: (open: boolean) => void;
  regenerationState: FinalPaintingRegenerationState;
  regenerationStartedAt: number | null;
  regenerationError: string | null;
  regenerationPhase: RegenerationChecklistPhase | null;
  candidateFinalPaintingUrl: string | null;
  medium: Medium | null;
  onRetryRegeneration?: () => void;
};

const StudioReferenceContext =
  createContext<StudioReferenceContextValue | null>(null);

export function StudioReferenceProvider({
  referenceUrl,
  finalPaintingUrl,
  title,
  children,
  regenerationState = "idle",
  regenerationStartedAt = null,
  regenerationError = null,
  regenerationPhase = null,
  candidateFinalPaintingUrl = null,
  medium = null,
  onRetryRegeneration,
}: {
  referenceUrl?: string | null;
  finalPaintingUrl?: string | null;
  title: string;
  children: ReactNode;
  regenerationState?: FinalPaintingRegenerationState;
  regenerationStartedAt?: number | null;
  regenerationError?: string | null;
  regenerationPhase?: RegenerationChecklistPhase | null;
  candidateFinalPaintingUrl?: string | null;
  medium?: Medium | null;
  onRetryRegeneration?: () => void;
}) {
  const { mode: compareMode, setMode: setCompareMode } =
    useStudioComparePreference("both");
  const [panelOpen, setPanelOpen] = useState(false);
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [dockExpanded, setDockExpanded] = useState(false);

  const available = Boolean(referenceUrl || finalPaintingUrl);

  const openPanel = useCallback(() => {
    setPanelOpen(true);
    setDockExpanded(false);
  }, []);
  const closePanel = useCallback(() => setPanelOpen(false), []);
  const togglePanel = useCallback(() => {
    setPanelOpen((v) => !v);
    setDockExpanded(false);
  }, []);
  const openFullscreen = useCallback(() => {
    setFullscreenOpen(true);
    setPanelOpen(false);
    setDockExpanded(false);
  }, []);
  const closeFullscreen = useCallback(() => setFullscreenOpen(false), []);

  // Escape closes panel / fullscreen / dock.
  useEffect(() => {
    if (!panelOpen && !fullscreenOpen && !dockExpanded) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (fullscreenOpen) {
        setFullscreenOpen(false);
        return;
      }
      if (panelOpen) {
        setPanelOpen(false);
        return;
      }
      setDockExpanded(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelOpen, fullscreenOpen, dockExpanded]);

  // Lock body scroll when fullscreen.
  useEffect(() => {
    if (!fullscreenOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [fullscreenOpen]);

  const value = useMemo<StudioReferenceContextValue>(
    () => ({
      referenceUrl: referenceUrl ?? null,
      finalPaintingUrl: finalPaintingUrl ?? null,
      title,
      available,
      compareMode,
      setCompareMode,
      panelOpen,
      openPanel,
      closePanel,
      togglePanel,
      fullscreenOpen,
      openFullscreen,
      closeFullscreen,
      dockExpanded,
      setDockExpanded,
      regenerationState,
      regenerationStartedAt,
      regenerationError,
      regenerationPhase,
      candidateFinalPaintingUrl,
      medium,
      onRetryRegeneration,
    }),
    [
      referenceUrl,
      finalPaintingUrl,
      title,
      available,
      compareMode,
      setCompareMode,
      panelOpen,
      openPanel,
      closePanel,
      togglePanel,
      fullscreenOpen,
      openFullscreen,
      closeFullscreen,
      dockExpanded,
      regenerationState,
      regenerationStartedAt,
      regenerationError,
      regenerationPhase,
      candidateFinalPaintingUrl,
      medium,
      onRetryRegeneration,
    ],
  );

  return (
    <StudioReferenceContext.Provider value={value}>
      {children}
    </StudioReferenceContext.Provider>
  );
}

export function useStudioReference() {
  const ctx = useContext(StudioReferenceContext);
  if (!ctx) {
    throw new Error(
      "useStudioReference must be used within StudioReferenceProvider",
    );
  }
  return ctx;
}

/** Safe optional hook when provider may be absent. */
export function useStudioReferenceOptional() {
  return useContext(StudioReferenceContext);
}
