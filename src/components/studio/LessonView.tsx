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
  acceptRegeneratedCandidate,
  dismissRegeneratedCandidate,
  orchestrateProgression,
  releaseProgressionLease,
  PROGRESSION_LEASE_MS,
  regenerateAllTargets,
  regenerateMasterCandidate,
  retryStageTarget,
  subscribeProgression,
} from "@/lib/progression-images";
import type { GenerationStatus, StageId, StageImageRecord } from "@/lib/progression";
import {
  hasValidGeneratedMaster,
  resolveLessonUiState,
  shouldContinueProgression,
} from "@/lib/lesson-ui-state";
import {
  isRegenerationBusy,
  type FinalPaintingRegenerationState,
  type RegenerationChecklistPhase,
} from "@/lib/final-painting-regeneration";
import { LessonExperience } from "@/components/studio/LessonExperience";
import { LessonShell, LessonOverflowMenu } from "@/components/shell";
import { StatusPill } from "@/components/project/StatusPill";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { ProjectMaterials } from "@/components/project/ProjectMaterials";
import { ProgressUpload } from "@/components/progression/ProgressUpload";
import {
  StudioReferenceProvider,
  LessonReferenceDock,
  StudioReferencePanel,
  StudioReferenceFullscreen,
  StudioReferencePage,
} from "@/components/studio-reference";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lesson", label: "Lesson" },
  { id: "reference", label: "Studio Reference" },
  { id: "materials", label: "Materials" },
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
  const [regenerationState, setRegenerationState] =
    useState<FinalPaintingRegenerationState>("idle");
  const [regenerationStartedAt, setRegenerationStartedAt] = useState<number | null>(null);
  const [regenerationError, setRegenerationError] = useState<string | null>(null);
  const [regenerationPhase, setRegenerationPhase] =
    useState<RegenerationChecklistPhase | null>(null);
  const [candidateFinalPaintingUrl, setCandidateFinalPaintingUrl] = useState<string | null>(
    null,
  );
  const [acceptingMaster, setAcceptingMaster] = useState(false);
  const [acceptingCandidate, setAcceptingCandidate] = useState(false);
  /** Progression subscription has resolved at least once for this project. */
  const [progressionHydrated, setProgressionHydrated] = useState(false);
  const [masterRequestInFlight, setMasterRequestInFlight] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  /** Project-scoped in-flight key — never a permanent boolean across projects. */
  const startedProjectRef = useRef<string | null>(null);
  const leaseRetryRef = useRef(0);
  const leaseRetryStartedAtRef = useRef<number | null>(null);
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
    leaseRetryRef.current = 0;
    leaseRetryStartedAtRef.current = null;
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
    setRegenerationState("idle");
    setRegenerationStartedAt(null);
    setRegenerationError(null);
    setRegenerationPhase(null);
    setCandidateFinalPaintingUrl(null);
    setRegenerating(false);
    clearLessonBrand();
    revokePreview();
    return () => {
      clearLessonBrand();
    };
  }, [id]);

  // Release an in-flight lease on full document unload only. Do not release on
  // React unmount — Strict Mode remounts would drop a live lease and force a
  // soft retry (or briefly block a peer with the same CLIENT_ID race).
  useEffect(() => {
    if (!user) return;
    const projectId = id;
    const uid = user.uid;
    const release = () => {
      void releaseProgressionLease(uid, projectId);
    };
    window.addEventListener("pagehide", release);
    return () => {
      window.removeEventListener("pagehide", release);
    };
  }, [user, id]);

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
      const nextRegen = p?.regenerationState ?? "idle";
      setRegenerationState(nextRegen);
      setRegenerationStartedAt(p?.regenerationStartedAt ?? null);
      setRegenerationError(p?.regenerationError ?? null);
      setRegenerationPhase(p?.regenerationPhase ?? null);
      setCandidateFinalPaintingUrl(p?.candidateFinalPaintingUrl ?? null);
      // Restore in-flight UI from Firestore after reload — do not restart the job.
      if (isRegenerationBusy(nextRegen) || nextRegen === "candidateReady" || nextRegen === "error") {
        setRegenerating(true);
      } else if (!regenLockRef.current) {
        setRegenerating(false);
      }
      const hydratedValid = hasValidGeneratedMaster({
        masterStatus: p?.masterStatus ?? "pending",
        masterImageUrl: p?.masterImageUrl,
      });
      // Clear stale lease/orchestration errors once Firestore has a usable master.
      if (hydratedValid) {
        setGenerationError(null);
      }
      console.warn(JSON.stringify({
        scope: "LessonView",
        event: "progression_hydration_resolved",
        projectId: id,
        hasDoc: Boolean(p),
        masterStatus: p?.masterStatus ?? null,
        hasMasterImageUrl: Boolean(p?.masterImageUrl),
        regenerationState: nextRegen,
        hydratedValid,
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
      // Also release after a successful master-only run so post-accept stage work
      // can resume if the accept fire-and-forget is interrupted (refresh, etc.).
      startedProjectRef.current = null;
      if (outcome === "skipped_lease") {
        // Soft retry across the full lease window — a reload/unmount can orphan a
        // lease for up to PROGRESSION_LEASE_MS. Short retries hard-error too early.
        if (leaseRetryStartedAtRef.current == null) {
          leaseRetryStartedAtRef.current = Date.now();
        }
        const elapsed = Date.now() - leaseRetryStartedAtRef.current;
        const budgetMs = PROGRESSION_LEASE_MS + 30_000;
        if (elapsed < budgetMs) {
          const attempt = (leaseRetryRef.current += 1);
          window.setTimeout(() => {
            if (startedProjectRef.current) return;
            if (
              hasValidGeneratedMaster({
                masterStatus: masterStatus,
                masterImageUrl: masterUrlRef.current || masterImageUrl,
              })
            ) {
              return;
            }
            void startMasterGeneration();
          }, Math.min(2_000 * attempt, 10_000));
        } else {
          setGenerationError(
            "Another session is generating this lesson. Retry in a moment.",
          );
        }
      } else if (outcome === "ran" || outcome === "skipped_complete") {
        leaseRetryRef.current = 0;
        leaseRetryStartedAtRef.current = null;
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
    const shouldStart = shouldContinueProgression({
      hasTutorial: Boolean(tutorial),
      hasReferenceUrl: Boolean(imageUrl),
      progressionHydrated,
      masterStatus,
      masterImageUrl: masterUrlRef.current || masterImageUrl,
      masterRequestInFlight,
      generationError,
      stages: progression,
    });

    // Never auto-start while an explicit Final Painting regen job is active or
    // awaiting a candidate decision — remount must not bill a second job.
    if (
      isRegenerationBusy(regenerationState) ||
      regenerationState === "candidateReady" ||
      regenerating ||
      regenLockRef.current
    ) {
      return;
    }

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
    progression,
    startMasterGeneration,
    regenerationState,
    regenerating,
  ]);

  async function onRegenerate() {
    if (!user || !state || !state.tutorial) return;
    const allowRetryFromError = regenerationState === "error";
    if (
      regenLockRef.current ||
      acceptingMaster ||
      acceptingCandidate ||
      masterRequestInFlight ||
      isRegenerationBusy(regenerationState) ||
      regenerationState === "candidateReady" ||
      (regenerating && !allowRetryFromError)
    ) {
      console.warn(
        JSON.stringify({
          scope: "progression",
          event: "master_regeneration_duplicate_ignored",
          projectId: id,
          source: "regenerate_all",
          regenerationState,
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
      setRegenerationState("error");
      setRegenerationError(
        "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
      );
    } finally {
      regenLockRef.current = false;
      // Subscription clears regenerating when regenerationState returns to idle.
    }
  }

  async function onRegenerateMaster() {
    if (!user || !state || !state.tutorial) return;
    if (
      regenLockRef.current ||
      regenerating ||
      acceptingMaster ||
      acceptingCandidate ||
      masterRequestInFlight ||
      isRegenerationBusy(regenerationState)
    ) {
      console.warn(
        JSON.stringify({
          scope: "progression",
          event: "master_regeneration_duplicate_ignored",
          projectId: id,
          source: "regenerate_master",
          regenerationState,
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

  async function onAcceptCandidate() {
    if (!user || !state?.tutorial || acceptingCandidate || acceptingMaster) return;
    setAcceptingCandidate(true);
    try {
      await acceptRegeneratedCandidate({
        uid: user.uid,
        projectId: id,
        tutorial: state.tutorial,
        medium: state.summary.medium,
        referenceImageUrl: state.summary.imageUrl,
      });
    } catch {
      // Subscription reflects persisted state.
    } finally {
      setAcceptingCandidate(false);
      setRegenerating(false);
    }
  }

  async function onKeepCurrentPainting() {
    if (!user || acceptingCandidate) return;
    try {
      await dismissRegeneratedCandidate({ uid: user.uid, projectId: id });
    } catch {
      // Subscription reflects persisted state.
    } finally {
      setRegenerating(false);
    }
  }

  async function onTryAnotherCandidate() {
    if (!user || !state?.tutorial) return;
    await onKeepCurrentPainting();
    regenLockRef.current = false;
    setRegenerationState("idle");
    setCandidateFinalPaintingUrl(null);
    setRegenerationError(null);
    setRegenerating(false);
    // Call the pipeline directly — React state from this render still says candidateReady.
    regenLockRef.current = true;
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
    } catch (e) {
      setRegenerationState("error");
      setRegenerationError(
        "We couldn’t prepare another interpretation. Your current painting and lesson are unchanged.",
      );
      setGenerationError(
        e instanceof Error ? e.message : "Couldn’t regenerate the lesson.",
      );
    } finally {
      regenLockRef.current = false;
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
   * creation/loading — review or atelier both qualify.
   */
  const brandingEligible =
    Boolean(state?.summary) &&
    hasValidGeneratedMaster({ masterStatus, masterImageUrl }) &&
    lessonUi.state === "ready";

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
    // Keep the sticky tab bar still — only reset the shell scrollport.
    requestAnimationFrame(() => {
      const root = document.getElementById("app-main");
      if (root) root.scrollTo({ top: 0 });
    });
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
  if (error) {
    return (
      <section className="ap-state ap-state--error ap-state--page" role="alert">
        <h2 className="ap-state-title">Couldn&apos;t load this lesson</h2>
        <p className="ap-state-body">{error}</p>
      </section>
    );
  }
  if (!state) return (
    <div className="ap-state ap-state--empty empty-state">
      <span className="ap-state-icon empty-mark" aria-hidden="true">
        <Icon name="image" size={28} />
      </span>
      <h2 className="ap-state-title empty-title">Project not found</h2>
      <p className="ap-state-body empty-copy">
        This project may have been moved or removed.
      </p>
      <Link href="/studio" className="btn-solid btn-lg">
        <Icon name="arrow-left" size={18} />
        Back to dashboard
      </Link>
    </div>
  );

  const { summary, tutorial } = state;
  // Keep the accepted/prior Final Painting visible during regeneration.
  // Do not blank the dock when masterStatus briefly reads "generating".
  const showMaster = Boolean(
    masterImageUrl &&
      (masterStatus === "ready" ||
        masterStatus === "needsReview" ||
        masterStatus === "generating"),
  );
  const finalPaintingUrl = showMaster ? masterImageUrl : null;
  const regenBusy =
    isRegenerationBusy(regenerationState) ||
    regenerationState === "candidateReady" ||
    regenerationState === "error" ||
    regenerating;

  return (
    <div
      data-lesson-medium={summary.medium}
      className={tab !== "reference" ? "has-ref-dock" : undefined}
    >
      <StudioReferenceProvider
        referenceUrl={summary.imageUrl}
        finalPaintingUrl={finalPaintingUrl}
        title={summary.title}
        regenerationState={regenerationState}
        regenerationStartedAt={regenerationStartedAt}
        regenerationError={regenerationError}
        regenerationPhase={regenerationPhase}
        candidateFinalPaintingUrl={candidateFinalPaintingUrl}
        medium={summary.medium}
        onRetryRegeneration={onRegenerate}
      >
        <LessonShell
          title={summary.title}
          generating={tabsLocked}
          tabsLocked={tabsLocked}
          tabs={TABS}
          activeTab={tab}
          onTabChange={(id) => selectTab(id as TabId)}
          eyebrow={
            <>
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
            </>
          }
          actions={<LessonOverflowMenu pdfDisabled />}
        >
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
              masterImageUrl={finalPaintingUrl}
              onBeginStudy={() => {
                setLessonEntryMode("study");
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
                regenerating={regenBusy}
                regenerationState={regenerationState}
                regenerationStartedAt={regenerationStartedAt}
                regenerationError={regenerationError}
                regenerationPhase={regenerationPhase}
                candidateFinalPaintingUrl={candidateFinalPaintingUrl}
                onAcceptCandidate={onAcceptCandidate}
                onKeepCurrentPainting={onKeepCurrentPainting}
                onTryAnotherCandidate={onTryAnotherCandidate}
                acceptingCandidate={acceptingCandidate}
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
            <StudioReferencePage
              referenceUrl={summary.imageUrl}
              finalPaintingUrl={finalPaintingUrl}
              title={summary.title}
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
        </LessonShell>

        <LessonReferenceDock hidden={tab === "reference"} />
        <StudioReferencePanel />
        <StudioReferenceFullscreen />
      </StudioReferenceProvider>
    </div>
  );
}
