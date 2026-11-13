"use client";

import { useAuth } from "@/providers/AuthProvider";
import { useRecentLessons } from "@/hooks/useRecentLessons";
import { DashboardHeader } from "./DashboardHeader";
import { LeadProject } from "./LeadProject";
import { RecentLessonsSection } from "./RecentLessonsSection";
import { InspirationGallery } from "./InspirationGallery";
import { EmptyState } from "./EmptyState";

export function StudioDashboard() {
  const { user } = useAuth();
  const { lessons, loading, error } = useRecentLessons(user?.uid);
  const displayName = user?.displayName?.split(" ")[0] || user?.email?.split("@")[0] || "artist";

  return (
    <div className="studio-home">
      <DashboardHeader displayName={displayName} />

      {loading ? (
        <>
          <p className="sr-only" role="status">Loading your lessons…</p>
          <section className="lead-project" aria-hidden="true">
            <div className="lead-project-body">
              <div className="lead-media skeleton-block" />
              <div className="lead-detail">
                <div className="skeleton-line short" />
                <div className="skeleton-line" />
                <div className="skeleton-line short" />
              </div>
            </div>
          </section>
        </>
      ) : error ? (
        <section className="status error" role="alert">
          <p>We couldn&apos;t load your lessons. Your saved work has not been changed.</p>
          <button type="button" className="secondary" onClick={() => window.location.reload()}>
            Try again
          </button>
        </section>
      ) : lessons.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <LeadProject lesson={lessons[0]} />
          <hr className="rule" />
          <RecentLessonsSection lessons={lessons.slice(1)} />
        </>
      )}

      <hr className="rule" />
      <InspirationGallery />
    </div>
  );
}
