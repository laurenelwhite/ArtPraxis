"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[route-error]", error);
  }, [error]);

  return (
    <main className="route-state" id="main-content">
      <ArtPraxisLogo variant="navigation" size="navigationDesktop" />
      <div className="ap-state ap-state--error card route-state-card" role="alert">
        <p className="ap-state-kicker">Something interrupted the lesson</p>
        <h1 className="ap-state-title">Your work is still worth returning to.</h1>
        <p className="ap-state-body">
          Try this page again. If the problem continues, return to the studio and reopen your lesson.
        </p>
        <div className="route-state-actions">
          <button className="btn-solid btn-branded" type="button" onClick={reset}>
            Try again
          </button>
          <Link className="btn-ghost" href="/studio">
            Return to studio
          </Link>
        </div>
      </div>
    </main>
  );
}
