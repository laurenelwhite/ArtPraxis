"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { BrandTheme } from "@/lib/branding/brand-theme";

type LessonBrandContextValue = {
  /** Active adaptive theme for the lesson top bar; null = official navy lockup. */
  theme: BrandTheme | null;
  setTheme: (theme: BrandTheme | null) => void;
  clearTheme: () => void;
};

const LessonBrandContext = createContext<LessonBrandContextValue | null>(null);

export function LessonBrandProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<BrandTheme | null>(null);

  const setTheme = useCallback((next: BrandTheme | null) => {
    setThemeState(next);
  }, []);

  const clearTheme = useCallback(() => {
    setThemeState(null);
  }, []);

  const value = useMemo(
    () => ({ theme, setTheme, clearTheme }),
    [theme, setTheme, clearTheme],
  );

  return (
    <LessonBrandContext.Provider value={value}>
      {children}
    </LessonBrandContext.Provider>
  );
}

export function useLessonBrand(): LessonBrandContextValue {
  const ctx = useContext(LessonBrandContext);
  if (!ctx) {
    return {
      theme: null,
      setTheme: () => {},
      clearTheme: () => {},
    };
  }
  return ctx;
}
