import type { GenerationStatus, StageId, StageImageRecord } from "@/lib/progression";
import { STAGE_PROCESS_LABEL } from "@/lib/stage-icons";

/**
 * Top-level lesson UI finite state.
 * Drives which view mounts — atelier chrome only in `"ready"`.
 */
export type LessonUiState =
  | "creating"
  | "masterGenerating"
  | "masterReview"
  | "stageGenerating"
  | "ready"
  | "error";

export type LessonUiSnapshot = {
  state: LessonUiState;
  headline: string;
  detail: string;
  /** 0–1 when estimable; null when indeterminate */
  progress: number | null;
  /** Current stage being built (stageGenerating) */
  activeStageId: StageId | null;
  activeStageLabel: string | null;
  stagesReadyCount: number;
  stagesTotal: number;
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
  return Boolean(
    input.masterImageUrl &&
      (input.masterStatus === "ready" || input.masterStatus === "needsReview"),
  );
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

/** Sketch must be a finished (non-provisional) target before the atelier mounts. */
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
  } = input;

  const stagesTotal = Math.max(stages.length, STAGE_ORDER.length);
  const stagesReadyCount = countReadyStages(stages);
  const sketchReady = isSketchReady(stages);
  const activeStageId = findGeneratingStage(stages);
  const activeStageLabel = activeStageId
    ? STAGE_PROCESS_LABEL[activeStageId]
    : null;
  const validMaster = hasValidGeneratedMaster({ masterStatus, masterImageUrl });

  const base = {
    activeStageId,
    activeStageLabel,
    stagesReadyCount,
    stagesTotal,
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
  if (regenerating && masterImageUrl) {
    if (masterStatus === "needsReview") {
      return {
        state: "masterReview",
        headline: "Generating an alternative…",
        detail: "Your current candidate stays visible until you accept a new version.",
        progress: null,
        ...base,
      };
    }
    if (sketchReady) {
      return {
        state: "ready",
        headline: "Generating an alternative…",
        detail: "Your current lesson stays available while a new target is prepared.",
        progress: stagesTotal ? stagesReadyCount / stagesTotal : null,
        ...base,
      };
    }
  }

  // Review gate — never mount the atelier while the master needs a decision.
  if (masterStatus === "needsReview" && validMaster) {
    return {
      state: "masterReview",
      headline: "Ready for review",
      detail: "Accept this painting as your lesson target, or regenerate a new one.",
      progress: null,
      ...base,
    };
  }

  // Master still needed — only show ~35% when a request is genuinely in flight.
  if (!validMaster && masterStatus !== "ready") {
    const active = masterRequestInFlight || masterStatus === "generating";
    return {
      state: "masterGenerating",
      headline: "Painting your finished inspiration",
      detail: active
        ? "We're translating your reference into a finished watercolor painting while preserving composition, perspective and subject placement."
        : "Starting master generation from your reference…",
      progress: masterRequestInFlight
        ? 0.35
        : masterStatus === "generating"
          ? 0.28
          : 0.18,
      ...base,
    };
  }

  // Master accepted/ready — wait until stage demonstrations are real (not provisional).
  if (masterStatus === "ready" && !sketchReady) {
    const label = activeStageLabel ?? "Sketch";
    return {
      state: "stageGenerating",
      headline: `Generating ${label}…`,
      detail: "Building each stage from your approved painting. The atelier opens when Sketch is ready.",
      progress: stagesTotal ? Math.min(0.95, Math.max(0.4, stagesReadyCount / stagesTotal)) : 0.4,
      ...base,
    };
  }

  const allStagesPresent =
    stages.length >= STAGE_ORDER.length &&
    STAGE_ORDER.every((id) => {
      const stage = stages.find((s) => s.stageId === id);
      return isUsableStageTarget(stage);
    });

  if (masterStatus === "ready" && sketchReady && !allStagesPresent) {
    const label = activeStageLabel ?? "next stage";
    return {
      state: "stageGenerating",
      headline: `Generating ${label}…`,
      detail: "Finishing the remaining stage demonstrations…",
      progress: stagesTotal ? Math.max(0.45, stagesReadyCount / stagesTotal) : 0.5,
      ...base,
    };
  }

  if (masterStatus === "ready" && sketchReady && allStagesPresent) {
    return {
      state: "ready",
      headline: "Lesson ready",
      detail: regenerating
        ? "Generating an alternative in the background…"
        : "Your stage-by-stage lesson is ready.",
      progress: 1,
      ...base,
    };
  }

  return {
    state: "masterGenerating",
    headline: "Preparing your lesson…",
    detail: "Setting up the painting target and stage demonstrations.",
    progress: masterRequestInFlight ? 0.35 : 0.18,
    ...base,
  };
}
