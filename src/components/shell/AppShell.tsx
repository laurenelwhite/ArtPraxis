"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { LessonBrandProvider } from "@/providers/LessonBrandProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { BrandSplash } from "@/components/brand/BrandSplash";
import { AppHeader } from "./AppHeader";

function isLessonDetailPath(pathname: string) {
  return /^\/studio\/lessons\/[^/]+/.test(pathname);
}

/**
 * Global authenticated application shell.
 * Header stays fixed; only `.app-main` scrolls (Figma / Linear / Notion pattern).
 */
function AppShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading, error } = useAuth();
  const pathname = usePathname();
  const lessonRoute = isLessonDetailPath(pathname);

  if (loading) {
    return (
      <main className="shell">
        <BrandSplash active={loading} label="Opening your studio" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="shell">
        <AuthPanel initialError={error} />
      </main>
    );
  }

  const accountLabel = user.displayName || user.email || "Account";

  return (
    <div className="app-shell">
      <AppHeader accountLabel={accountLabel} />
      <div
        className={lessonRoute ? "app-main app-main--lesson" : "app-main"}
        id="app-main"
        data-scroll-root="app"
      >
        {children}
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <LessonBrandProvider>
      <AppShellInner>{children}</AppShellInner>
    </LessonBrandProvider>
  );
}
