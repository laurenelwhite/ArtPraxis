import type { GenerationStatus, StageId, StageImageRecord } from "@/lib/progression";
import { resolveStageDisplayLabel } from "@/lib/stage-icons";
import type { Medium } from "@/lib/tutorial-schema";

/**
 * Top-level lesson UI finite state.
 * Atelier chrome mounts in `"ready"` once the master is accepted —
 * stage images may still be arriving in the background.
 */
export type LessonUiState =
  | "creating"
  | "masterGenerating"
  | "ready"
  | "error";

export type LessonUiSnapshot = {
  state: LessonUiState;
  headline: string;
  detail: string;
  /** 0–1 when estimable; null when indeterminate */
  progress: number | null;
  /** Current stage being built (while stages generate in background) */
  activeStageId: StageId | null;
  activeStageLabel: string | null;
  stagesReadyCount: number;
  stagesTotal: number;
  /** True when master is accepted but some stage demos are still landing. */
  stagesGeneratingInBackground: boolean;
};

const STAGE_ORDER: StageId[] = [
  "pencil-sketch",
  "value-study",
  "first-wash",
  "second-wash",
  "refinement",
  "finished",
];

/** Provisional reference seeds must never appear as finished lesson art. */
export function isProvisionalStageTarget(stage: StageImageRecord): boolean {
  return stage.previewSource === "reference";
}

/**
 * A master counts as generated only with a real saved image in ready/review.
 * Reference-seeded stage previews never qualify.
 */
export function hasValidGeneratedMaster(input: {
  masterStatus: GenerationStatus;
  masterImageUrl: string | null | undefined;
}): boolean {
  if (!input.masterImageUrl) return false;
  if (input.masterStatus === "ready" || input.masterStatus === "needsReview") {
    return true;
  }
  // Recover stuck "generating" docs that already persisted a Storage master URL
  // (should not happen in the happy path, but must not trap the atelier closed).
  if (
    input.masterStatus === "generating" &&
    /^https?:\/\//i.test(input.masterImageUrl)
  ) {
    return true;
  }
  return false;
}

/** Whether LessonView should kick off master orchestration. */
export function shouldStartMasterGeneration(input: {
  hasTutorial: boolean;
  hasReferenceUrl: boolean;
  progressionHydrated: boolean;
  masterStatus: GenerationStatus;
  masterImageUrl: string | null | undefined;
  masterRequestInFlight: boolean;
  generationError?: string | null;
}): boolean {
  if (!input.hasTutorial || !input.hasReferenceUrl) return false;
  if (!input.progressionHydrated) return false;
  if (input.masterRequestInFlight) return false;
  if (input.generationError) return false;
  if (hasValidGeneratedMaster(input)) return false;
  // Terminal failure without an image — wait for explicit Retry.
  if (input.masterStatus === "failed" && !input.masterImageUrl) return false;
  return true;
}

/** Stages that still need deterministic or AI work after accept. */
export function stagesNeedGeneration(stages: StageImageRecord[]): boolean {
  if (stages.length < STAGE_ORDER.length) return true;
  return STAGE_ORDER.some((id) => {
    const stage = stages.find((s) => s.stageId === id);
    if (!stage) return true;
    if (isProvisionalStageTarget(stage)) return true;
    if (!stage.targetImageUrl) return true;
    return (
      stage.generationStatus === "pending" ||
      stage.generationStatus === "generating"
    );
  });
}

/**
 * Kick off (or resume) orchestration: master when missing, or stage work after
 * accept when the browser refreshed mid-pipeline.
 */
export function shouldContinueProgression(input: {
  hasTutorial: boolean;
  hasReferenceUrl: boolean;
  progressionHydrated: boolean;
  masterStatus: GenerationStatus;
  masterImageUrl: string | null | undefined;
  masterRequestInFlight: boolean;
  generationError?: string | null;
  stages: StageImageRecord[];
}): boolean {
  if (shouldStartMasterGeneration(input)) return true;
  if (!input.progressionHydrated) return false;
  if (input.masterRequestInFlight) return false;
  if (input.generationError) return false;
  if (input.masterStatus !== "ready" && input.masterStatus !== "needsReview") return false;
  if (!input.masterImageUrl) return false;
  return stagesNeedGeneration(input.stages);
}

/** A stage demonstration the atelier may safely show. */
export function isUsableStageTarget(stage: StageImageRecord | undefined): boolean {
  if (!stage?.targetImageUrl) return false;
  if (isProvisionalStageTarget(stage)) return false;
  if (stage.generationStatus === "pending") return false;
  return (
    stage.generationStatus === "ready" ||
    stage.generationStatus === "failed" ||
    (stage.generationStatus === "generating" && stage.previewSource === "master")
  );
}

/** Sketch must be a finished (non-provisional) target before counting as ready. */
export function isSketchReady(stages: StageImageRecord[]): boolean {
  const sketch = stages.find((s) => s.stageId === "pencil-sketch");
  if (!sketch?.targetImageUrl) return false;
  if (isProvisionalStageTarget(sketch)) return false;
  return sketch.generationStatus === "ready" || sketch.generationStatus === "failed";
}

export function countReadyStages(stages: StageImageRecord[]): number {
  return stages.filter((s) => {
    if (!s.targetImageUrl || isProvisionalStageTarget(s)) return false;
    return s.generationStatus === "ready" || s.generationStatus === "failed";
  }).length;
}

export function findGeneratingStage(stages: StageImageRecord[]): StageId | null {
  for (const id of STAGE_ORDER) {
    const stage = stages.find((s) => s.stageId === id);
    if (!stage) continue;
    if (
      stage.generationStatus === "generating" ||
      stage.generationStatus === "pending" ||
      !stage.targetImageUrl ||
      isProvisionalStageTarget(stage)
    ) {
      return id;
    }
  }
  return null;
}

export function resolveLessonUiState(input: {
  hasTutorial: boolean;
  progressionHydrated: boolean;
  masterStatus: GenerationStatus;
  masterImageUrl: string | null | undefined;
  masterError?: string | null;
  stages: StageImageRecord[];
  /** True while an explicit master/targets regen request is in flight. */
  regenerating?: boolean;
  /** True while LessonView's orchestration request is actively running. */
  masterRequestInFlight?: boolean;
  /** Local orchestration failure (retryable). */
  generationError?: string | null;
  /** Medium for display labels (optional; falls back to watercolor map). */
  medium?: Medium | string | null;
}): LessonUiSnapshot {
  const {
    hasTutorial,
    progressionHydrated,
    masterStatus,
    masterImageUrl,
    masterError,
    stages,
    regenerating = false,
    masterRequestInFlight = false,
    generationError = null,
    medium,
  } = input;

  const stagesTotal = Math.max(stages.length, STAGE_ORDER.length);
  const stagesReadyCount = countReadyStages(stages);
  const activeStageId = findGeneratingStage(stages);
  const activeStageLabel = activeStageId
    ? resolveStageDisplayLabel(activeStageId, medium)
    : null;
  const validMaster = hasValidGeneratedMaster({ masterStatus, masterImageUrl });
  const stagesGeneratingInBackground =
    validMaster && stagesNeedGeneration(stages);

  const base = {
    activeStageId,
    activeStageLabel,
    stagesReadyCount,
    stagesTotal,
    stagesGeneratingInBackground: false,
  };

  if (!hasTutorial || !progressionHydrated) {
    return {
      state: "creating",
      headline: "Creating your lesson",
      detail: hasTutorial
        ? "Preparing the painting workspace…"
        : "Analyzing your reference and building the lesson…",
      progress: hasTutorial ? 0.18 : 0.1,
      ...base,
    };
  }

  if (generationError || (masterStatus === "failed" && !masterImageUrl)) {
    return {
      state: "error",
      headline: "Couldn’t create the target painting",
      detail:
        generationError?.trim() ||
        masterError?.trim() ||
        "Try regenerating the target from your reference.",
      progress: null,
      ...base,
    };
  }

  // Keep the current view while a regen is in flight and we still have art to show.
  // Atelier regen keeps masterStatus "ready"; review regen uses generating/needsReview.
  if (regenerating && masterImageUrl) {
    if (masterStatus === "ready") {
      return {
        state: "ready",
        headline: "Generating an alternative…",
        detail: "Your current lesson stays available while a new target is prepared.",
        progress: stagesTotal ? stagesReadyCount / stagesTotal : null,
        ...base,
        stagesGeneratingInBackground,
      };
    }
    return {
      state: "ready",
      headline: "Generating an alternative…",
      detail: "Your current lesson stays available while a new target is prepared.",
      progress: stagesTotal ? stagesReadyCount / stagesTotal : null,
      ...base,
      stagesGeneratingInBackground,
    };
  }

  // Legacy review records open directly into the MVP lesson.
  if (masterStatus === "needsReview" && validMaster) {
    return {
      state: "ready",
      headline: "Your lesson is ready",
      detail: "Your target painting and guided stages are available.",
      progress: stagesTotal ? stagesReadyCount / stagesTotal : null,
      ...base,
      stagesGeneratingInBackground,
    };
  }

  // Master still needed — only show ~35% when a request is genuinely in flight.
  if (!validMaster && masterStatus !== "ready") {
    const active = masterRequestInFlight || masterStatus === "generating";
    return {
      state: "masterGenerating",
      headline: "Painting your finished inspiration",
      detail: active
        ? "Translating your reference into a finished painting — composition and placement stay locked."
        : "Starting master generation from your reference…",
      progress: masterRequestInFlight
        ? 0.35
        : masterStatus === "generating"
          ? 0.28
          : 0.18,
      ...base,
    };
  }

  // Accepted / recoverable master — open the atelier; stages arrive in the background.
  if (validMaster) {
    return {
      state: "ready",
      headline: stagesGeneratingInBackground ? "Lesson open" : "Lesson ready",
      detail: regenerating
        ? "Generating an alternative in the background…"
        : stagesGeneratingInBackground
          ? "Stage demonstrations are appearing as they’re ready."
          : "Your stage-by-stage lesson is ready.",
      progress: stagesTotal
        ? Math.min(1, Math.max(0.4, stagesReadyCount / stagesTotal))
        : stagesGeneratingInBackground
          ? 0.45
          : 1,
      ...base,
      stagesGeneratingInBackground,
    };
  }

  return {
    state: "masterGenerating",
    headline: "Preparing your lesson…",
    detail: "Setting up the painting target.",
    progress: masterRequestInFlight ? 0.35 : 0.18,
    ...base,
  };
}
