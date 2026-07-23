"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { ArtPraxisLoadingMark } from "@/components/brand/ArtPraxisLoadingMark";

/**
 * Authenticated visitors skip the marketing homepage without a flash.
 * Unauthenticated visitors see the landing content immediately after auth resolves.
 */
export function HomeGate({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/studio");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <div className="app-loading home-auth-wait">
        <ArtPraxisLoadingMark
          label={user ? "Opening your studio…" : "Checking your session…"}
        />
      </div>
    );
  }

  return children;
}
