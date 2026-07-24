"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useLessonBrand } from "@/providers/LessonBrandProvider";
import { ArtPraxisLoadingMark } from "@/components/brand/ArtPraxisLoadingMark";
import { Icon } from "@/components/Icon";
import {
  getLesson,
  markLessonOpened,
  setProjectStatus,
  type LessonDetail,
  type ProjectStatus,
} from "@/lib/lessons";
import { ensureLessonBrandTheme } from "@/lib/branding/ensure-lesson-brand";
import { brandThemeFromStored } from "@/lib/branding/brand-theme";
import {
  acceptMaster,
  orchestrateProgression,
  regenerateAllTargets,
  regenerateMasterCandidate,
  retryStageTarget,
  subscribeProgression,
} from "@/lib/progression-images";
import type { GenerationStatus, StageId, StageImageRecord } from "@/lib/progression";
import {
  hasValidGeneratedMaster,
  resolveLessonUiState,
  shouldStartMasterGeneration,
} from "@/lib/lesson-ui-state";
import { LessonExperience } from "@/components/studio/LessonExperience";
import { StatusPill } from "@/components/project/StatusPill";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { ProjectReference } from "@/components/project/ProjectReference";
import { ProjectMaterials } from "@/components/project/ProjectMaterials";
import { ProjectPlaceholder } from "@/components/project/ProjectPlaceholder";
import { ProgressUpload } from "@/components/progression/ProgressUpload";

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
  const { setTheme: setLessonBrand, clearTheme: clearLessonBrand } = useLessonBrand();
  const [state, setState] = useState<LessonDetail | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [tab, setTab] = useState<TabId>("overview");
  const [lessonEntryMode, setLessonEntryMode] = useState<"study" | "paint">("study");
  const [status, setStatus] = useState<ProjectStatus>("not-started");
  const [savingStatus, setSavingStatus] = useState(false);
  const [highlightMaterialId, setHighlightMaterialId] = useState<string | null>(null);
  const [progression, setProgression] = useState<StageImageRecord[]>([]);
  const [masterStatus, setMasterStatus] = useState<GenerationStatus>("pending");
  const [masterImageUrl, setMasterImageUrl] = useState<string | null>(null);
  const [masterError, setMasterError] = useState<string | null>(null);
  const [masterReviewReasons, setMasterReviewReasons] = useState<string[]>([]);
  const [masterReadyToAccept, setMasterReadyToAccept] = useState(false);
  const [retryingStage, setRetryingStage] = useState<StageId | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [acceptingMaster, setAcceptingMaster] = useState(false);
  /** Progression subscription has resolved at least once for this project. */
  const [progressionHydrated, setProgressionHydrated] = useState(false);
  const [masterRequestInFlight, setMasterRequestInFlight] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  /** Project-scoped in-flight key — never a permanent boolean across projects. */
  const startedProjectRef = useRef<string | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const masterUrlRef = useRef<string | null>(null);
  /** Sync lock — prevents double-click races before React state updates. */
  const regenLockRef = useRef(false);

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
    setGenerationError(null);
  }, [revokePreview]);

  // Reset per-project guards when navigating between lessons.
  useEffect(() => {
    startedProjectRef.current = null;
    masterUrlRef.current = null;
    setMasterRequestInFlight(false);
    setGenerationError(null);
    setProgression([]);
    setMasterStatus("pending");
    setMasterImageUrl(null);
    setMasterError(null);
    setMasterReviewReasons([]);
    setMasterReadyToAccept(false);
    setProgressionHydrated(false);
    clearLessonBrand();
    revokePreview();
    return () => {
      clearLessonBrand();
    };
  }, [id, revokePreview, clearLessonBrand]);

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
    setProgressionHydrated(false);
    console.warn(JSON.stringify({
      scope: "LessonView",
      event: "progression_hydration_started",
      projectId: id,
    }));
    const unsubscribe = subscribeProgression(user.uid, id, (p) => {
      setProgressionHydrated(true);
      setProgression(p?.stages ?? []);
      setMasterStatus(p?.masterStatus ?? "pending");
      setMasterError(p?.masterError ?? null);
      setMasterReviewReasons(p?.masterReviewReasons ?? []);
      setMasterReadyToAccept(Boolean(p?.masterImageUrl && p.masterStatus === "needsReview"));
      console.warn(JSON.stringify({
        scope: "LessonView",
        event: "progression_hydration_resolved",
        projectId: id,
        hasDoc: Boolean(p),
        masterStatus: p?.masterStatus ?? null,
        hasMasterImageUrl: Boolean(p?.masterImageUrl),
      }));
      // Prefer the persisted Storage URL; keep a local blob preview until it arrives.
      if (p?.masterImageUrl) {
        revokePreview();
        masterUrlRef.current = p.masterImageUrl;
        setMasterImageUrl(p.masterImageUrl);
      } else if (
        p &&
        p.masterStatus !== "needsReview" &&
        p.masterStatus !== "generating" &&
        !previewUrlRef.current
      ) {
        masterUrlRef.current = null;
        setMasterImageUrl(null);
      }
    });
    return () => {
      unsubscribe();
    };
  }, [user, authLoading, id, revokePreview]);

  const startMasterGeneration = useCallback(async () => {
    if (!user || !state?.tutorial || !state.summary.medium || !state.summary.imageUrl) {
      return;
    }

    const requestKey = `${id}:master`;
    if (startedProjectRef.current === requestKey) {
      return;
    }

    const validMaster = hasValidGeneratedMaster({
      masterStatus,
      masterImageUrl: masterUrlRef.current || masterImageUrl,
    });

    // Stale "generating" without a saved master must force a fresh API call.
    const staleGenerating = masterStatus === "generating" && !validMaster;

    startedProjectRef.current = requestKey;
    setMasterRequestInFlight(true);
    setGenerationError(null);

    console.info("[lesson-generation]", {
      projectId: id,
      event: "invoke_orchestrateProgression",
      masterStatus,
      hasValidGeneratedMaster: validMaster,
      staleGenerating,
      masterRequestInFlight: true,
    });
    console.warn(JSON.stringify({
      scope: "LessonView",
      event: "generation_request_started",
      projectId: id,
      staleGenerating,
      inMemoryMasterUrl: false,
    }));

    try {
      const outcome = await orchestrateProgression({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
        onMasterCandidate,
        // Never pass a stale in-memory URL for auto-start — that skips the master POST.
        inMemoryMasterUrl: null,
        forceRegenerate: staleGenerating,
      });

      console.info("[lesson-generation]", {
        projectId: id,
        event: "orchestrateProgression_settled",
        outcome,
      });

      // Lease / incomplete skips must release the guard so a later attempt can run.
      if (outcome === "skipped_lease") {
        startedProjectRef.current = null;
        setGenerationError(
          "Another session is generating this lesson. Retry in a moment.",
        );
      } else if (outcome === "ran" || outcome === "skipped_complete" || outcome === "skipped_review") {
        // Keep project key so Strict Mode / effect re-entry does not double-POST.
      } else {
        startedProjectRef.current = null;
      }
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Couldn’t start master generation.";
      console.error("[LessonView] orchestrateProgression failed", e);
      setGenerationError(message);
      // Release guard so Retry can run again.
      if (startedProjectRef.current === requestKey) {
        startedProjectRef.current = null;
      }
    } finally {
      setMasterRequestInFlight(false);
    }
  }, [user, state, id, masterStatus, masterImageUrl, onMasterCandidate]);

  // Pipeline trigger lives in LessonView — independent of ready-only atelier gating.
  useEffect(() => {
    if (authLoading || !user || !state) return;

    const imageUrl = state.summary.imageUrl;
    const tutorial = state.tutorial;
    const validMaster = hasValidGeneratedMaster({
      masterStatus,
      masterImageUrl: masterUrlRef.current || masterImageUrl,
    });
    const shouldStart = shouldStartMasterGeneration({
      hasTutorial: Boolean(tutorial),
      hasReferenceUrl: Boolean(imageUrl),
      progressionHydrated,
      masterStatus,
      masterImageUrl: masterUrlRef.current || masterImageUrl,
      masterRequestInFlight,
      generationError,
    });

    console.info("[lesson-generation]", {
      projectId: id,
      masterStatus,
      hasReference: Boolean(imageUrl),
      hasValidGeneratedMaster: validMaster,
      masterRequestInFlight,
      shouldStartMaster: shouldStart,
      progressionHydrated,
      generationError,
    });

    if (!shouldStart) return;

    void startMasterGeneration();
  }, [
    authLoading,
    user,
    state,
    id,
    progressionHydrated,
    masterStatus,
    masterImageUrl,
    masterRequestInFlight,
    generationError,
    startMasterGeneration,
  ]);

  async function onRegenerate() {
    if (!user || !state || !state.tutorial) return;
    if (regenLockRef.current || regenerating || acceptingMaster || masterRequestInFlight) {
      console.warn(
        JSON.stringify({
          scope: "progression",
          event: "master_regeneration_duplicate_ignored",
          projectId: id,
          source: "regenerate_all",
          t: Date.now(),
        }),
      );
      return;
    }
    regenLockRef.current = true;
    setRegenerating(true);
    setGenerationError(null);
    startedProjectRef.current = null;
    console.warn(
      JSON.stringify({
        scope: "progression",
        event: "master_regeneration_started",
        projectId: id,
        source: "regenerate_all",
        t: Date.now(),
      }),
    );
    try {
      await regenerateAllTargets({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
        onMasterCandidate,
      });
      console.warn(
        JSON.stringify({
          scope: "progression",
          event: "master_regeneration_completed",
          projectId: id,
          source: "regenerate_all",
          t: Date.now(),
        }),
      );
    } catch (e) {
      setGenerationError(
        e instanceof Error ? e.message : "Couldn’t regenerate the lesson.",
      );
    } finally {
      regenLockRef.current = false;
      setRegenerating(false);
    }
  }

  async function onRegenerateMaster() {
    if (!user || !state || !state.tutorial) return;
    if (regenLockRef.current || regenerating || acceptingMaster || masterRequestInFlight) {
      console.warn(
        JSON.stringify({
          scope: "progression",
          event: "master_regeneration_duplicate_ignored",
          projectId: id,
          source: "regenerate_master",
          t: Date.now(),
        }),
      );
      return;
    }
    regenLockRef.current = true;
    setRegenerating(true);
    setGenerationError(null);
    startedProjectRef.current = null;
    console.warn(
      JSON.stringify({
        scope: "progression",
        event: "master_regeneration_started",
        projectId: id,
        source: "regenerate_master",
        t: Date.now(),
      }),
    );
    try {
      await regenerateMasterCandidate({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
        onMasterCandidate,
      });
      console.warn(
        JSON.stringify({
          scope: "progression",
          event: "master_regeneration_completed",
          projectId: id,
          source: "regenerate_master",
          t: Date.now(),
        }),
      );
    } catch (e) {
      setGenerationError(
        e instanceof Error ? e.message : "Couldn’t regenerate the target.",
      );
    } finally {
      regenLockRef.current = false;
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

  function onRetryGeneration() {
    setGenerationError(null);
    startedProjectRef.current = null;
    void startMasterGeneration();
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

  const lessonUi = resolveLessonUiState({
    hasTutorial: Boolean(state?.tutorial),
    progressionHydrated,
    masterStatus,
    masterImageUrl,
    masterError,
    stages: progression,
    regenerating,
    masterRequestInFlight,
    generationError,
  });
  const lessonReady = lessonUi.state === "ready";
  /** Overview stays available; other sections wait until the atelier is ready. */
  const tabsLocked = Boolean(state) && !lessonReady;

  /**
   * Adaptive logo only after a usable master exists and the lesson has left
   * creation/loading — review, stage build, or atelier all qualify.
   */
  const brandingEligible =
    Boolean(state?.summary) &&
    hasValidGeneratedMaster({ masterStatus, masterImageUrl }) &&
    (lessonUi.state === "masterReview" ||
      lessonUi.state === "stageGenerating" ||
      lessonUi.state === "ready");

  useEffect(() => {
    if (!user || !state?.summary || !brandingEligible || !masterImageUrl) {
      if (!brandingEligible) clearLessonBrand();
      return;
    }

    const medium = state.summary.medium;
    const existing = {
      brandAccent: state.summary.brandAccent,
      brandTheme: state.summary.brandTheme,
    };

    // Instant paint from persisted theme when the master URL matches.
    const cached = brandThemeFromStored(existing.brandTheme, medium);
    if (
      cached &&
      existing.brandTheme?.sourceMasterUrl === masterImageUrl
    ) {
      setLessonBrand(cached);
      return;
    }

    let cancelled = false;
    void ensureLessonBrandTheme({
      uid: user.uid,
      projectId: id,
      medium,
      masterImageUrl,
      existing,
    }).then((theme) => {
      if (!cancelled) setLessonBrand(theme);
    });

    return () => {
      cancelled = true;
    };
  }, [
    user,
    state?.summary,
    brandingEligible,
    masterImageUrl,
    id,
    setLessonBrand,
    clearLessonBrand,
  ]);

  useEffect(() => {
    if (tabsLocked && tab !== "overview" && tab !== "lesson") {
      setTab("lesson");
    }
  }, [tabsLocked, tab]);

  function selectTab(next: TabId) {
    setTab(next);
    if (next === "overview") {
      requestAnimationFrame(() => {
        document.getElementById("lesson-overview-top")?.scrollIntoView({
          block: "start",
          behavior: "smooth",
        });
      });
    } else {
      requestAnimationFrame(() => {
        document.getElementById("lesson-section-tabs")?.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      });
    }
  }

  function openMaterials(materialId?: string) {
    if (materialId) setHighlightMaterialId(materialId);
    selectTab("materials");
  }

  if (state === undefined && !error) return (
    <div className="app-loading">
      <ArtPraxisLoadingMark label="Loading your project…" />
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
    <div
      className={[
        "lesson-view",
        tabsLocked ? "lesson-view--generating" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      data-lesson-medium={summary.medium}
    >
      <div id="lesson-overview-top" className="lesson-anchor" aria-hidden="true" />
      <div className="dashboard-header lesson-header">
        <div className="lesson-header-text">
          <p className="lesson-breadcrumb">
            <Link href="/studio">Studio</Link>
            <span aria-hidden="true"> / </span>
            <span>Lesson</span>
          </p>
          <p className="eyebrow project-eyebrow">
            <span className="capitalize">{summary.medium}</span>
            {tutorial ? (
              <>
                {" · "}
                <span className="capitalize">{tutorial.difficulty}</span>
                {" · "}
                <span>~{tutorial.estimatedMinutes} min</span>
              </>
            ) : (
              <>
                {" · "}
                <span className="capitalize">{summary.skillLevel}</span>
              </>
            )}
            <StatusPill status={status} />
          </p>
          <h1 className="dashboard-title lesson-title">{summary.title}</h1>
        </div>
        <div className="lesson-header-actions">
          <button
            type="button"
            className="secondary lesson-pdf"
            disabled
            aria-disabled="true"
            title="PDF export coming soon"
          >
            Download PDF
            <span className="visually-hidden"> (unavailable)</span>
          </button>
          <Link href="/studio" className="secondary">
            <Icon name="arrow-left" size={17} />
            Back to Studio
          </Link>
        </div>
      </div>

      <nav
        id="lesson-section-tabs"
        className="project-tabs"
        role="tablist"
        aria-label="Project sections"
      >
        {TABS.map((t) => {
          const locked = tabsLocked && t.id !== "overview" && t.id !== "lesson";
          const selected = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`lesson-tab-${t.id}`}
              aria-controls={`lesson-panel-${t.id}`}
              aria-selected={selected}
              aria-disabled={locked || undefined}
              disabled={locked}
              tabIndex={selected ? 0 : -1}
              className={[
                "project-tab",
                selected ? "active" : null,
                locked ? "is-locked" : null,
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => {
                if (locked) return;
                selectTab(t.id);
              }}
              title={
                locked
                  ? "Available when your lesson is ready"
                  : undefined
              }
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* Keep panels mounted (hidden) so tab changes do not remount LessonExperience. */}
      <div
        id="lesson-panel-overview"
        role="tabpanel"
        aria-labelledby="lesson-tab-overview"
        hidden={tab !== "overview"}
        className="project-panel"
      >
        <ProjectOverview
          summary={summary}
          tutorial={tutorial}
          status={status}
          onStatusChange={changeStatus}
          saving={savingStatus}
          onBeginStudy={() => {
            setLessonEntryMode("study");
            selectTab("lesson");
          }}
          onStartPractice={() => {
            setLessonEntryMode("paint");
            selectTab("lesson");
          }}
        />
      </div>

      <div
        id="lesson-panel-lesson"
        role="tabpanel"
        aria-labelledby="lesson-tab-lesson"
        hidden={tab !== "lesson"}
        className="project-panel"
      >
        {tutorial ? (
          <LessonExperience
            tutorial={tutorial}
            imageUrl={summary.imageUrl}
            medium={summary.medium}
            entryMode={lessonEntryMode}
            progression={progression}
            progressionHydrated={progressionHydrated}
            masterStatus={masterStatus}
            masterImageUrl={masterImageUrl}
            masterError={masterError}
            masterReviewReasons={masterReviewReasons}
            masterRequestInFlight={masterRequestInFlight}
            generationError={generationError}
            onRetryGeneration={onRetryGeneration}
            onRetryStage={onRetryStage}
            retryingStage={retryingStage}
            onRegenerate={onRegenerate}
            regenerating={regenerating}
            onAcceptMaster={onAcceptMaster}
            acceptingMaster={acceptingMaster}
            onRegenerateMaster={onRegenerateMaster}
            masterReadyToAccept={masterReadyToAccept}
            projectStatus={status}
            onProjectStatusChange={changeStatus}
            savingStatus={savingStatus}
            onOpenMaterials={openMaterials}
          />
        ) : (
          <p className="status error">This project has no lesson content.</p>
        )}
      </div>

      <div
        id="lesson-panel-reference"
        role="tabpanel"
        aria-labelledby="lesson-tab-reference"
        hidden={tab !== "reference"}
        className="project-panel"
      >
        <ProjectReference
          summary={summary}
          masterImageUrl={masterImageUrl}
          masterStatus={masterStatus}
        />
      </div>

      <div
        id="lesson-panel-materials"
        role="tabpanel"
        aria-labelledby="lesson-tab-materials"
        hidden={tab !== "materials"}
        className="project-panel"
      >
        <ProjectMaterials
          key={id}
          tutorial={tutorial}
          medium={summary.medium}
          lessonId={id}
          uid={user?.uid ?? null}
          highlightId={highlightMaterialId}
          onHighlightConsumed={() => setHighlightMaterialId(null)}
        />
      </div>

      <div
        id="lesson-panel-notes"
        role="tabpanel"
        aria-labelledby="lesson-tab-notes"
        hidden={tab !== "notes"}
        className="project-panel"
      >
        <ProjectPlaceholder
          icon="message"
          title="Notes"
          description="Jot down observations, reminders, and what to try next on this project."
        />
      </div>

      <div
        id="lesson-panel-progress"
        role="tabpanel"
        aria-labelledby="lesson-tab-progress"
        hidden={tab !== "progress"}
        className="project-panel"
      >
        <ProgressUpload
          status={status}
          onStatusChange={changeStatus}
          saving={savingStatus}
        />
      </div>
    </div>
  );
}
