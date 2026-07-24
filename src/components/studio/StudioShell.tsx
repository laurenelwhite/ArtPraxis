"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAuth } from "@/providers/AuthProvider";
import { LessonBrandProvider, useLessonBrand } from "@/providers/LessonBrandProvider";
import { AuthPanel } from "@/components/AuthPanel";
import { Icon, type IconName } from "@/components/Icon";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";
import { BrandSplash } from "@/components/brand/BrandSplash";

type NavItem = { href: string; label: string; icon: IconName };

/** Medium-neutral top-level action — never “Start a painting”. */
const navItems: NavItem[] = [
  { href: "/studio", label: "Studio", icon: "dashboard" },
  { href: "/studio/new", label: "Create a lesson", icon: "plus" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/studio") {
    return pathname === "/studio";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Lesson detail routes may apply adaptive brush theme on the nav lockup. */
function isLessonDetailPath(pathname: string) {
  return /^\/studio\/lessons\/[^/]+/.test(pathname);
}

/**
 * Canonical authenticated shell.
 * Document order is fixed: global header → page main. Never reverse with CSS order.
 */
function StudioShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const lessonRoute = isLessonDetailPath(pathname);
  const { theme: lessonBrand } = useLessonBrand();

  if (loading) {
    return (
      <main className="shell">
        <BrandSplash active={loading} label="Opening your studio" />
      </main>
    );
  }
  if (!user) return <main className="shell"><AuthPanel /></main>;

  const accountLabel = user.displayName || user.email || "Account";

  return (
    <div className="studio-layout studio-layout--topbar">
      <header className="studio-topbar" role="banner">
        <Link href="/studio" className="studio-topbar-brand" aria-label="ArtPraxis studio">
          <ArtPraxisLogo
            variant="navigation"
            size="navigationDesktop"
            priority
            className="studio-topbar-logo"
            decorative
            adaptiveTheme={lessonRoute ? lessonBrand : null}
          />
        </Link>

        <nav className="studio-topbar-nav" aria-label="Studio">
          {navItems.map((item) => {
            const active = isActivePath(pathname, item.href);
            const isCta = item.href === "/studio/new";
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={[
                  "studio-topbar-link",
                  isCta ? "studio-topbar-cta" : null,
                  active ? "is-active" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <Icon name={item.icon} size={16} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="studio-topbar-account">
          <span className="studio-topbar-user" title={accountLabel}>
            {accountLabel}
          </span>
          <button type="button" className="studio-topbar-signout" onClick={() => signOut(auth)}>
            <Icon name="logout" size={15} />
            Sign out
          </button>
        </div>
      </header>

      <div className={lessonRoute ? "studio-main studio-main--lesson" : "studio-main"}>
        {children}
      </div>
    </div>
  );
}

export function StudioShell({ children }: { children: React.ReactNode }) {
  return (
    <LessonBrandProvider>
      <StudioShellInner>{children}</StudioShellInner>
    </LessonBrandProvider>
  );
}
