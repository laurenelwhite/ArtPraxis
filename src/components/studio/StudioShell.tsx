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

const navItems: NavItem[] = [
  { href: "/studio", label: "Studio", icon: "dashboard" },
  { href: "/studio/new", label: "Start a painting", icon: "plus" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/studio") {
    return pathname === "/studio";
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

/** Lesson detail routes use a compact top bar — never the permanent sidebar. */
function isLessonDetailPath(pathname: string) {
  return /^\/studio\/lessons\/[^/]+/.test(pathname);
}

function StudioShellInner({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const lessonTop = isLessonDetailPath(pathname);
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

  if (lessonTop) {
    return (
      <div className="studio-layout studio-layout--lesson-top">
        <header className="studio-topbar" role="banner">
          <Link href="/studio" className="studio-topbar-brand" aria-label="ArtPraxis studio">
            <ArtPraxisLogo
              variant="navigation"
              size="navigationDesktop"
              priority
              className="studio-topbar-logo"
              decorative
              adaptiveTheme={lessonBrand}
            />
          </Link>

          <nav className="studio-topbar-nav" aria-label="Studio">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "studio-topbar-link is-active" : "studio-topbar-link"}
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
        <div className="studio-main studio-main--lesson">{children}</div>
      </div>
    );
  }

  return (
    <div className="studio-layout">
      <aside className="studio-sidebar">
        <div className="studio-sidebar-top">
          <Link href="/studio" className="studio-brand" aria-label="ArtPraxis studio">
            <ArtPraxisLogo
              variant="sidebar"
              priority
              className="studio-brand-logo studio-brand-logo--expanded"
              decorative
            />
            <ArtPraxisLogo
              variant="icon"
              size="icon"
              className="studio-brand-logo studio-brand-logo--collapsed"
              decorative
            />
          </Link>

          <nav className="studio-nav" aria-label="Studio">
            {navItems.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={active ? "nav-item active" : "nav-item"}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="studio-account">
          <p className="account-email">{accountLabel}</p>
          <button type="button" onClick={() => signOut(auth)}>
            <Icon name="logout" size={16} />
            Sign out
          </button>
        </div>
      </aside>
      <div className="studio-main">{children}</div>
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
