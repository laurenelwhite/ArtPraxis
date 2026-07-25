import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { StageImageRecord } from "../src/lib/progression";
import {
  hasValidGeneratedMaster,
  isSketchReady,
  isUsableStageTarget,
  resolveLessonUiState,
  shouldContinueProgression,
  shouldStartMasterGeneration,
  stagesNeedGeneration,
} from "../src/lib/lesson-ui-state";

function stage(
  partial: Partial<StageImageRecord> & Pick<StageImageRecord, "stageId" | "index">,
): StageImageRecord {
  return {
    referenceImageUrl: "ref.jpg",
    targetImageUrl: null,
    prompt: "",
    model: "test",
    generationStatus: "pending",
    error: null,
    retryCount: 0,
    createdAt: null,
    ...partial,
  };
}

describe("resolveLessonUiState", () => {
  it("stays in creating until hydrated", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: false,
      masterStatus: "pending",
      masterImageUrl: null,
      stages: [],
    });
    assert.equal(snap.state, "creating");
    assert.ok((snap.progress ?? 0) < 0.35);
  });

  it("shows masterGenerating before a master exists", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "pending",
      masterImageUrl: null,
      stages: [],
      masterRequestInFlight: false,
    });
    assert.equal(snap.state, "masterGenerating");
    assert.equal(snap.progress, 0.18);
  });

  it("uses 35% only when a master request is in flight", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "generating",
      masterImageUrl: null,
      stages: [],
      masterRequestInFlight: true,
    });
    assert.equal(snap.state, "masterGenerating");
    assert.equal(snap.progress, 0.35);
  });

  it("shows masterReview when needsReview", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "needsReview",
      masterImageUrl: "master.jpg",
      stages: [
        stage({
          stageId: "pencil-sketch",
          index: 1,
          targetImageUrl: "noise.jpg",
          previewSource: "reference",
          generationStatus: "generating",
        }),
      ],
    });
    assert.equal(snap.state, "masterReview");
    assert.equal(snap.headline, "Your atelier interpretation");
  });

  it("does not treat reference previews as usable stage art", () => {
    const provisional = stage({
      stageId: "pencil-sketch",
      index: 1,
      targetImageUrl: "noise.jpg",
      previewSource: "reference",
      generationStatus: "generating",
    });
    assert.equal(isUsableStageTarget(provisional), false);
    assert.equal(isSketchReady([provisional]), false);
  });

  it("opens atelier immediately after accept even when stages are pending", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "ready",
      masterImageUrl: "master.jpg",
      stages: [
        stage({
          stageId: "pencil-sketch",
          index: 1,
          targetImageUrl: null,
          generationStatus: "pending",
        }),
      ],
    });
    assert.equal(snap.state, "ready");
    assert.equal(snap.stagesGeneratingInBackground, true);
  });

  it("keeps atelier ready while regenerating an accepted master", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "ready",
      masterImageUrl: "master.jpg",
      regenerating: true,
      stages: [
        stage({
          stageId: "pencil-sketch",
          index: 1,
          targetImageUrl: "s1.jpg",
          generationStatus: "ready",
          previewSource: null,
        }),
      ],
    });
    assert.equal(snap.state, "ready");
  });

  it("keeps review visible while regenerating a review candidate", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "generating",
      masterImageUrl: "master.jpg",
      regenerating: true,
      stages: [],
    });
    assert.equal(snap.state, "masterReview");
  });

  it("reaches ready with background flag cleared when all stages are usable", () => {
    const stages: StageImageRecord[] = [
      stage({ stageId: "pencil-sketch", index: 1, targetImageUrl: "s1.jpg", generationStatus: "ready", previewSource: null }),
      stage({ stageId: "value-study", index: 2, targetImageUrl: "s2.jpg", generationStatus: "ready", previewSource: null }),
      stage({ stageId: "first-wash", index: 3, targetImageUrl: "s3.jpg", generationStatus: "ready", previewSource: null }),
      stage({ stageId: "second-wash", index: 4, targetImageUrl: "s4.jpg", generationStatus: "ready", previewSource: null }),
      stage({ stageId: "refinement", index: 5, targetImageUrl: "s5.jpg", generationStatus: "ready", previewSource: null }),
      stage({ stageId: "finished", index: 6, targetImageUrl: "s6.jpg", generationStatus: "ready", previewSource: null }),
    ];
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "ready",
      masterImageUrl: "master.jpg",
      stages,
    });
    assert.equal(snap.state, "ready");
    assert.equal(snap.progress, 1);
    assert.equal(snap.stagesGeneratingInBackground, false);
  });

  it("gates atelier until ready even when master is generating", () => {
    const snap = resolveLessonUiState({
      hasTutorial: true,
      progressionHydrated: true,
      masterStatus: "generating",
      masterImageUrl: null,
      stages: [],
      masterRequestInFlight: true,
    });
    assert.notEqual(snap.state, "ready");
  });
});

describe("shouldStartMasterGeneration", () => {
  it("starts when reference is available and no master exists", () => {
    assert.equal(
      shouldStartMasterGeneration({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "pending",
        masterImageUrl: null,
        masterRequestInFlight: false,
      }),
      true,
    );
  });

  it("does not treat missing master image as valid", () => {
    assert.equal(
      hasValidGeneratedMaster({
        masterStatus: "generating",
        masterImageUrl: null,
      }),
      false,
    );
  });

  it("skips while a request is already in flight", () => {
    assert.equal(
      shouldStartMasterGeneration({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "generating",
        masterImageUrl: null,
        masterRequestInFlight: true,
      }),
      false,
    );
  });

  it("skips when a generated master already exists", () => {
    assert.equal(
      shouldStartMasterGeneration({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "ready",
        masterImageUrl: "master.jpg",
        masterRequestInFlight: false,
      }),
      false,
    );
  });

  it("skips on terminal failed status until retry clears the error", () => {
    assert.equal(
      shouldStartMasterGeneration({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "failed",
        masterImageUrl: null,
        masterRequestInFlight: false,
      }),
      false,
    );
    assert.equal(
      shouldStartMasterGeneration({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "pending",
        masterImageUrl: null,
        masterRequestInFlight: false,
        generationError: "boom",
      }),
      false,
    );
  });
});

describe("shouldContinueProgression", () => {
  it("resumes stage work after accept when stages are still pending", () => {
    assert.equal(
      shouldContinueProgression({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "ready",
        masterImageUrl: "master.jpg",
        masterRequestInFlight: false,
        stages: [
          stage({ stageId: "pencil-sketch", index: 1, generationStatus: "pending" }),
        ],
      }),
      true,
    );
  });

  it("does not resume stages while awaiting Accept Lesson", () => {
    assert.equal(
      shouldContinueProgression({
        hasTutorial: true,
        hasReferenceUrl: true,
        progressionHydrated: true,
        masterStatus: "needsReview",
        masterImageUrl: "master.jpg",
        masterRequestInFlight: false,
        stages: [
          stage({ stageId: "pencil-sketch", index: 1, generationStatus: "pending" }),
        ],
      }),
      false,
    );
  });

  it("detects unfinished stage sets", () => {
    assert.equal(
      stagesNeedGeneration([
        stage({ stageId: "pencil-sketch", index: 1, targetImageUrl: "s1.jpg", generationStatus: "ready" }),
      ]),
      true,
    );
  });
});
