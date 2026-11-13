"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";
import { Icon } from "@/components/Icon";

/**
 * Public landing header. Routes stay on the marketing page and /studio.
 * Below 640px, section links move into a menu so they remain reachable.
 */
export function LandingMasthead() {
  const [open, setOpen] = useState(false);
  const linksId = useId();
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && open) {
        setOpen(false);
        menuButtonRef.current?.focus();
      }
    }

    function onResize() {
      if (window.innerWidth > 640) setOpen(false);
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <>
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className={["masthead", open ? "is-menu-open" : null].filter(Boolean).join(" ")}>
      <Link href="/" aria-label="ArtPraxis home" className="masthead-brand">
        <ArtPraxisLogo
          variant="navigation"
          size="navigationDesktop"
          className="ap-logo--responsive-nav"
          decorative
        />
      </Link>
      <button
        ref={menuButtonRef}
        type="button"
        className="masthead-menu-toggle"
        aria-expanded={open}
        aria-controls={linksId}
        onClick={() => setOpen((value) => !value)}
      >
        <Icon name={open ? "close" : "menu"} size={18} />
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      <nav className="masthead-nav" aria-label="Primary">
        <div id={linksId} className="masthead-nav-links">
          <a href="#how" onClick={() => setOpen(false)}>How it works</a>
          <a href="#what-you-get" onClick={() => setOpen(false)}>What you get</a>
          <a href="#media" onClick={() => setOpen(false)}>Mediums</a>
        </div>
        <Link href="/studio" className="masthead-signin">Sign in</Link>
        <Link href="/studio/new" className="btn-solid btn-branded">Create a lesson</Link>
      </nav>
    </header>
    </>
  );
}
