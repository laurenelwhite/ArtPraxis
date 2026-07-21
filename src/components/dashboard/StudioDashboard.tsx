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
      ) : error ? (
        <p className="status error">{error}</p>
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
