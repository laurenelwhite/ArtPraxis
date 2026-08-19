"use client";

import { useEffect, useId, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useLessonBrand } from "@/providers/LessonBrandProvider";
import { Icon, type IconName } from "@/components/Icon";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

type NavItem = { href: string; label: string; icon: IconName };

/** Medium-neutral top-level actions — never “Start a painting”. */
const NAV_ITEMS: NavItem[] = [
  { href: "/studio", label: "Studio", icon: "dashboard" },
  { href: "/studio/new", label: "Create a lesson", icon: "plus" },
];

function isActivePath(pathname: string, href: string) {
  if (href === "/studio") return pathname === "/studio";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function isLessonDetailPath(pathname: string) {
  return /^\/studio\/lessons\/[^/]+/.test(pathname);
}

/**
 * Single persistent application header.
 * Logo, Studio / Create a lesson, and Sign out live only here.
 */
export function AppHeader({ accountLabel }: { accountLabel: string }) {
  const pathname = usePathname();
  const lessonRoute = isLessonDetailPath(pathname);
  const { theme: lessonBrand } = useLessonBrand();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > 760) setMenuOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <>
      <header className={["app-header", menuOpen ? "is-menu-open" : null].filter(Boolean).join(" ")} role="banner">
        <Link href="/studio" className="app-header-brand" aria-label="ArtPraxis studio">
          <ArtPraxisLogo
            variant="navigation"
            size="navigationDesktop"
            priority
            className="app-header-logo"
            decorative
            adaptiveTheme={lessonRoute ? lessonBrand : null}
          />
        </Link>

        <button
          type="button"
          className="app-header-menu-toggle"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close studio menu" : "Open studio menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Icon name={menuOpen ? "close" : "menu"} size={18} />
          <span className="app-header-menu-label">{menuOpen ? "Close" : "Menu"}</span>
        </button>

        <div id={menuId} className="app-header-menu">
          <nav className="app-header-nav" aria-label="Primary">
            {NAV_ITEMS.map((item) => {
              const active = isActivePath(pathname, item.href);
              const isCta = item.href === "/studio/new";
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={[
                    "app-header-link",
                    isCta ? "app-header-cta" : null,
                    active ? "is-active" : null,
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  onClick={() => setMenuOpen(false)}
                >
                  <Icon name={item.icon} size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="app-header-account">
            <span className="app-header-user" title={accountLabel}>
              {accountLabel}
            </span>
            <button
              type="button"
              className="app-header-signout"
              onClick={() => {
                setMenuOpen(false);
                void signOut(auth);
              }}
            >
              <Icon name="logout" size={15} />
              Sign out
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <button
          type="button"
          className="app-header-overlay"
          aria-label="Close studio menu"
          onClick={() => setMenuOpen(false)}
        />
      ) : null}
    </>
  );
}
