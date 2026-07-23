"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { Icon } from "@/components/Icon";
import {
  getLesson,
  markLessonOpened,
  setProjectStatus,
  type LessonDetail,
  type ProjectStatus,
} from "@/lib/lessons";
import {
  acceptMaster,
  orchestrateProgression,
  regenerateAllTargets,
  regenerateMasterCandidate,
  retryStageTarget,
  subscribeProgression,
} from "@/lib/progression-images";
import type { GenerationStatus, StageId, StageImageRecord } from "@/lib/progression";
import { LessonExperience } from "@/components/studio/LessonExperience";
import { StatusPill } from "@/components/project/StatusPill";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { ProjectReference } from "@/components/project/ProjectReference";
import { ProjectMaterials } from "@/components/project/ProjectMaterials";
import { ProjectPlaceholder } from "@/components/project/ProjectPlaceholder";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lesson", label: "Lesson" },
  { id: "reference", label: "Reference" },
  { id: "materials", label: "Materials" },
  { id: "notes", label: "Notes" },
  { id: "progress", label: "Progress" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export function LessonView({ id }: { id: string }) {
  const { user, loading: authLoading } = useAuth();
  const [state, setState] = useState<LessonDetail | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [status, setStatus] = useState<ProjectStatus>("not-started");
  const [savingStatus, setSavingStatus] = useState(false);
  const [progression, setProgression] = useState<StageImageRecord[]>([]);
  const [masterStatus, setMasterStatus] = useState<GenerationStatus>("pending");
  const [masterImageUrl, setMasterImageUrl] = useState<string | null>(null);
  const [masterReviewReasons, setMasterReviewReasons] = useState<string[]>([]);
  const [masterReadyToAccept, setMasterReadyToAccept] = useState(false);
  const [retryingStage, setRetryingStage] = useState<StageId | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [acceptingMaster, setAcceptingMaster] = useState(false);
  const resumedRef = useRef(false);
  const previewUrlRef = useRef<string | null>(null);

  const revokePreview = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
  }, []);

  const onMasterCandidate = useCallback((info: {
    previewUrl: string;
    status: "ready" | "needsReview";
    reasons: string[];
  }) => {
    revokePreview();
    previewUrlRef.current = info.previewUrl;
    setMasterImageUrl(info.previewUrl);
    setMasterStatus(info.status);
    setMasterReviewReasons(info.reasons);
    setMasterReadyToAccept(false);
  }, [revokePreview]);

  useEffect(() => {
    if (authLoading || !user) return;
    let active = true;

    getLesson(user.uid, id)
      .then((result) => {
        if (!active) return;
        setState(result);
        if (result) {
          setStatus(result.summary.projectStatus);
          markLessonOpened(user.uid, id).catch(() => {});
        }
      })
      .catch((e) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : "Could not load this project.");
      });

    return () => { active = false; };
  }, [user, authLoading, id]);

  // Live progression: the lesson updates automatically as stage images land.
  useEffect(() => {
    if (authLoading || !user) return;
    const unsubscribe = subscribeProgression(user.uid, id, (p) => {
      setProgression(p?.stages ?? []);
      setMasterStatus(p?.masterStatus ?? "pending");
      setMasterReviewReasons(p?.masterReviewReasons ?? []);
      setMasterReadyToAccept(Boolean(p?.masterImageUrl && p.masterStatus === "needsReview"));
      // Prefer the persisted Storage URL; keep a local blob preview until it arrives.
      if (p?.masterImageUrl) {
        revokePreview();
        setMasterImageUrl(p.masterImageUrl);
      } else if (p?.masterStatus !== "needsReview" && p?.masterStatus !== "generating") {
        setMasterImageUrl(null);
      }
    });
    return () => {
      unsubscribe();
      revokePreview();
    };
  }, [user, authLoading, id, revokePreview]);

  // Resume generation as soon as tutorial + medium + reference URL exist.
  // Do not wait on UI image loads; the API fetches the Firebase URL itself.
  useEffect(() => {
    if (authLoading || !user || !state) {
      console.warn(JSON.stringify({
        scope: "LessonView",
        event: "trigger_evaluated",
        skipped: true,
        reason: authLoading ? "auth_loading" : !user ? "no_user" : "no_lesson_state",
      }));
      return;
    }
    if (!state.tutorial) {
      console.warn(JSON.stringify({
        scope: "LessonView",
        event: "generation_skipped",
        reason: "no_tutorial",
        projectId: id,
      }));
      return;
    }
    if (!state.summary.medium || !state.summary.imageUrl) {
      console.warn(JSON.stringify({
        scope: "LessonView",
        event: "generation_skipped",
        reason: "missing_medium_or_imageUrl",
        projectId: id,
      }));
      return;
    }
    if (resumedRef.current) {
      console.warn(JSON.stringify({
        scope: "LessonView",
        event: "generation_skipped",
        reason: "already_resumed_this_mount",
        projectId: id,
      }));
      return;
    }
    resumedRef.current = true;
    console.warn(JSON.stringify({
      scope: "LessonView",
      event: "generation_request_started",
      projectId: id,
    }));
    orchestrateProgression({
      uid: user.uid,
      projectId: id,
      tutorial: state.tutorial,
      medium: state.summary.medium,
      referenceImageUrl: state.summary.imageUrl,
      onMasterCandidate,
    }).catch((e) => {
      console.error("[LessonView] orchestrateProgression failed", e);
    });
  }, [user, authLoading, state, id, onMasterCandidate]);

  async function onRegenerate() {
    if (!user || !state || !state.tutorial || regenerating || acceptingMaster) return;
    setRegenerating(true);
    try {
      await regenerateAllTargets({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
        onMasterCandidate,
      });
    } catch {
      // The live subscription reflects whatever state was persisted.
    } finally {
      setRegenerating(false);
    }
  }

  async function onRegenerateMaster() {
    if (!user || !state || !state.tutorial || regenerating || acceptingMaster) return;
    setRegenerating(true);
    try {
      await regenerateMasterCandidate({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
        onMasterCandidate,
      });
    } catch {
      // The live subscription reflects whatever state was persisted.
    } finally {
      setRegenerating(false);
    }
  }

  async function onAcceptMaster() {
    if (!user || !state || !state.tutorial || acceptingMaster || regenerating) return;
    setAcceptingMaster(true);
    try {
      await acceptMaster({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
      });
    } catch {
      // The live subscription reflects whatever state was persisted.
    } finally {
      setAcceptingMaster(false);
    }
  }

  async function onRetryStage(stageId: StageId) {
    if (!user || !state || !state.tutorial) return;
    setRetryingStage(stageId);
    try {
      const stages = await retryStageTarget({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
        stageId,
      });
      setProgression(stages);
    } catch {
      // The live subscription reflects whatever state was persisted.
    } finally {
      setRetryingStage(null);
    }
  }

  async function changeStatus(next: ProjectStatus) {
    if (!user || next === status) return;
    const previous = status;
    setStatus(next);
    setSavingStatus(true);
    try {
      await setProjectStatus(user.uid, id, next);
    } catch {
      setStatus(previous);
    } finally {
      setSavingStatus(false);
    }
  }

  if (state === undefined && !error) return (
    <div className="app-loading">
      <span className="spinner" />
      <p>Loading your project…</p>
    </div>
  );
  if (error) return <p className="status error">{error}</p>;
  if (!state) return (
    <div className="empty-state">
      <span className="empty-mark" aria-hidden="true"><Icon name="image" size={28} /></span>
      <h2 className="empty-title">Project not found</h2>
      <p className="empty-copy">This project may have been moved or removed.</p>
      <Link href="/studio" className="btn-solid btn-lg"><Icon name="arrow-left" size={18} />Back to dashboard</Link>
    </div>
  );

  const { summary, tutorial } = state;

  return (
    <div className="lesson-view">
      <header className="dashboard-header">
        <div>
          <p className="eyebrow project-eyebrow">
            <span className="capitalize">{summary.medium}</span> · <span className="capitalize">{summary.skillLevel}</span>
            <StatusPill status={status} />
          </p>
          <h1 className="dashboard-title">{summary.title}</h1>
        </div>
        <Link href="/studio" className="secondary"><Icon name="arrow-left" size={17} />Back to dashboard</Link>
      </header>

      <nav className="project-tabs" role="tablist" aria-label="Project sections">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "project-tab active" : "project-tab"}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <div className="project-panel" key={tab} role="tabpanel" aria-label={`${tab} panel`}>
        {tab === "overview" && (
          <ProjectOverview
            summary={summary}
            tutorial={tutorial}
            status={status}
            onStatusChange={changeStatus}
            saving={savingStatus}
          />
        )}
        {tab === "lesson" && (
          tutorial
            ? <LessonExperience
                tutorial={tutorial}
                imageUrl={summary.imageUrl}
                medium={summary.medium}
                progression={progression}
                masterStatus={masterStatus}
                masterImageUrl={masterImageUrl}
                masterReviewReasons={masterReviewReasons}
                onRetryStage={onRetryStage}
                retryingStage={retryingStage}
                onRegenerate={onRegenerate}
                regenerating={regenerating}
                onAcceptMaster={onAcceptMaster}
                acceptingMaster={acceptingMaster}
                onRegenerateMaster={onRegenerateMaster}
                masterReadyToAccept={masterReadyToAccept}
              />
            : <p className="status error">This project has no lesson content.</p>
        )}
        {tab === "reference" && <ProjectReference summary={summary} />}
        {tab === "materials" && <ProjectMaterials tutorial={tutorial} />}
        {tab === "notes" && (
          <ProjectPlaceholder
            icon="message"
            title="Notes"
            description="Jot down observations, reminders, and what to try next on this project."
          />
        )}
        {tab === "progress" && (
          <ProjectPlaceholder
            icon="image"
            title="Progress"
            description="Upload your finished painting and track completion as you work."
          />
        )}
      </div>
    </div>
  );
}
