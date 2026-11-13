import Link from "next/link";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

type LegalPageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: React.ReactNode;
};

export function LegalPageShell({ eyebrow, title, intro, children }: LegalPageShellProps) {
  return (
    <div className="site legal-site">
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <header className="legal-masthead">
        <Link href="/" aria-label="ArtPraxis home" className="masthead-brand">
          <ArtPraxisLogo
            variant="navigation"
            size="navigationDesktop"
            className="ap-logo--responsive-nav"
            decorative
          />
        </Link>
        <nav className="legal-masthead-nav" aria-label="Public pages">
          <Link href="/">Home</Link>
          <Link href="/studio">Sign in</Link>
        </nav>
      </header>

      <main id="main-content" className="legal-main">
        <header className="legal-page-header">
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="legal-intro">{intro}</p>
          <p className="legal-updated">Effective November 12, 2026</p>
        </header>
        <div className="legal-content">{children}</div>
      </main>

      <footer className="legal-footer">
        <p>ArtPraxis is operated by Lauren White in California, USA.</p>
        <nav aria-label="Legal and support">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/support">Support</Link>
        </nav>
      </footer>
    </div>
  );
}
