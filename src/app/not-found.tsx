import Link from "next/link";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

export default function NotFound() {
  return (
    <main className="route-state" id="main-content">
      <ArtPraxisLogo variant="navigation" size="navigationDesktop" />
      <div className="ap-state card route-state-card">
        <p className="ap-state-kicker">Page not found</p>
        <h1 className="ap-state-title">This page is outside the studio.</h1>
        <p className="ap-state-body">
          The link may be old or the page may have moved. Return to ArtPraxis and continue your practice.
        </p>
        <div className="route-state-actions">
          <Link className="btn-solid btn-branded" href="/">
            Return home
          </Link>
          <Link className="btn-ghost" href="/studio">
            Open the studio
          </Link>
        </div>
      </div>
    </main>
  );
}
