import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildLessonShellFields,
  creatorGenerationTimingLog,
  creatorStepIndex,
  CREATOR_WAIT_PIPELINE,
  normalizedTutorialWithTitle,
  provisionalLessonTitle,
} from "../src/lib/lesson-creation";
import { withNormalizedMaterials, type Tutorial } from "../src/lib/tutorial-schema";

function sampleTutorial(overrides: Partial<Tutorial> = {}): Tutorial {
  return withNormalizedMaterials({
    title: "Quiet Bowl Study",
    overview: "A short overview.",
    difficulty: "beginner",
    estimatedMinutes: 45,
    composition: {
      focalPoint: "Center subject",
      majorShapes: ["bowl", "cloth"],
      valuePlan: "Light left, dark right",
      lightDirection: "From upper left",
    },
    visualGuides: {
      focalPoint: { x: 50, y: 40, label: "Focus" },
      lightArrow: {
        start: { x: 10, y: 10 },
        end: { x: 40, y: 40 },
        label: "Light",
      },
      regions: [
        { x: 10, y: 10, width: 20, height: 20, label: "Shape", type: "major-shape" },
        { x: 40, y: 40, width: 20, height: 20, label: "Shadow", type: "shadow" },
        { x: 60, y: 20, width: 15, height: 15, label: "Light", type: "highlight" },
      ],
      suggestedCrop: null,
    },
    valueMap: {
      lights: "Highlights on rim",
      midtones: "Cloth midtones",
      darks: "Cast shadow",
      squintTest: "Big light/dark masses hold",
    },
    materials: [
      {
        item: "Round brush, size 10",
        purpose: "Main washes",
        required: true,
        imageUrl: "/materials/round-brush.svg",
        specification: "size 10",
        quantity: "1",
        substitution: "Any soft round #8–12",
      },
    ],
    palette: [
      { name: "Ultramarine", hex: "#1F3A93", role: "Cool", mixingNote: "Thin wash", ratio: "1:4" },
    ],
    creativeChoices: ["Simplify background"],
    steps: Array.from({ length: 6 }, (_, i) => ({
      order: i + 1,
      title: `Step ${i + 1}`,
      objective: "Practice",
      instruction: "Paint carefully",
      technique: "Wash",
      checkpoint: "Check values",
      commonMistake: "Too dark too soon",
      estimatedMinutes: 5,
      focusBox: null,
      paletteNames: ["Ultramarine"],
      visualCue: "Soft edge",
    })),
    ...overrides,
  });
}

describe("lesson shell schema", () => {
  it("uses a stable provisional title and generating status", () => {
    assert.equal(provisionalLessonTitle("watercolor"), "New watercolor lesson");
    assert.equal(provisionalLessonTitle("charcoal"), "New charcoal lesson");

    const shell = buildLessonShellFields("user-1", {
      medium: "watercolor",
      skillLevel: "beginner",
    });

    assert.equal(shell.userId, "user-1");
    assert.equal(shell.title, "New watercolor lesson");
    assert.equal(shell.titleLower, "new watercolor lesson");
    assert.equal(shell.medium, "watercolor");
    assert.equal(shell.skillLevel, "beginner");
    assert.equal(shell.status, "generating");
    assert.equal(shell.projectStatus, "not-started");
    assert.equal(shell.thumbnailUrl, "");
    assert.equal(shell.imageUrl, "");
    assert.equal(shell.favorite, false);
    assert.deepEqual(shell.collectionIds, []);
    assert.deepEqual(shell.tags, ["watercolor", "beginner"]);
    assert.deepEqual(shell.progressionImages, []);
    assert.equal(shell.notes, "");
    assert.equal(shell.finishedImageUrl, null);
    assert.deepEqual(shell.aiCoachConversation, []);
    assert.equal(shell.completionPercentage, 0);
    assert.equal(shell.brandAccent, null);
    assert.equal(shell.brandTheme, null);
  });
});

describe("tutorial attachment patch", () => {
  it("normalizes materials and updates title fields from the generated tutorial", () => {
    const tutorial = {
      ...sampleTutorial(),
      title: "Harbor Light",
      materials: [{ name: "Paper towel", category: "setup" }],
    };
    const patch = normalizedTutorialWithTitle(tutorial);
    assert.equal(patch.title, "Harbor Light");
    assert.equal(patch.titleLower, "harbor light");
    assert.equal(patch.tutorial.materials[0].item, "Paper towel");
    assert.ok(patch.tutorial.materials[0].purpose);
  });
});

describe("creator wait copy", () => {
  it("maps concurrent statuses to checklist indices", () => {
    assert.equal(creatorStepIndex("Studying your reference…"), 0);
    assert.equal(creatorStepIndex("Preparing your studio…"), 1);
    assert.equal(creatorStepIndex("Building your lesson…"), 2);
    assert.equal(creatorStepIndex("Opening your studio…"), 3);
    assert.equal(CREATOR_WAIT_PIPELINE.length, 4);
  });
});

describe("creator timing log", () => {
  it("records timings without image payloads", () => {
    const payload = creatorGenerationTimingLog({
      projectId: "proj-1",
      medium: "oil",
      skillLevel: "advanced",
      fileBytes: 2048,
      selectedOutputImageSize: "1024x1536",
      failedBranches: [],
      timings: {
        shellCreationMs: 10,
        fileToDataUrlMs: 20,
        tutorialApiMs: 1000,
        referenceUploadMs: 400,
        tutorialPersistMs: 30,
        referenceAttachMs: 20,
        progressionInitMs: 50,
        totalCreatorMs: 1100,
      },
    });
    const json = JSON.stringify(payload);
    assert.equal(payload.event, "creator_generation_timing");
    assert.equal(payload.projectId, "proj-1");
    assert.equal(payload.fileBytes, 2048);
    assert.doesNotMatch(json, /data:image/);
    assert.doesNotMatch(json, /https:\/\//);
  });
});
