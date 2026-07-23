/**
 * Tests for tutorial material normalization + stage-generation schema parsing.
 * Run: npm run test:tutorial-materials
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { z } from "zod";
import {
  materialSchema,
  mediumSchema,
  normalizeMaterial,
  normalizeTutorial,
  normalizeTutorialInput,
  tutorialSchema,
  withNormalizedMaterials,
} from "../src/lib/tutorial-schema";

const stageBodySchema = z.object({
  medium: mediumSchema,
  tutorial: tutorialSchema,
  mode: z.enum(["master", "stage"]).optional(),
});

function baseTutorial(materials: unknown[]) {
  return {
    title: "Test lesson",
    overview: "A short overview.",
    difficulty: "beginner" as const,
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
        { x: 10, y: 10, width: 20, height: 20, label: "Shape", type: "major-shape" as const },
        { x: 40, y: 40, width: 20, height: 20, label: "Shadow", type: "shadow" as const },
        { x: 60, y: 20, width: 15, height: 15, label: "Light", type: "highlight" as const },
      ],
      suggestedCrop: null,
    },
    valueMap: {
      lights: "Highlights on rim",
      midtones: "Cloth midtones",
      darks: "Cast shadow",
      squintTest: "Big light/dark masses hold",
    },
    materials,
    palette: [
      { name: "Ultramarine", hex: "#1F3A93", role: "Cool", mixingNote: "Thin wash", ratio: "1:4" },
      { name: "Burnt Sienna", hex: "#A0522D", role: "Warm", mixingNote: "Earthy", ratio: "neat" },
      { name: "Yellow Ochre", hex: "#C7A84A", role: "Earth", mixingNote: "Mute", ratio: "touch" },
    ],
    creativeChoices: ["Simplify background", "Keep edges soft"],
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
  };
}

const completeMaterial = {
  item: "Round brush, size 10",
  purpose: "Main washes",
  required: true,
  imageUrl: "/materials/round-brush.svg",
  specification: "size 10",
  quantity: "1",
  substitution: "Any soft round #8–12",
};

describe("normalizeMaterial", () => {
  it("preserves a fully complete material", () => {
    const result = normalizeMaterial(completeMaterial, 0);
    assert.deepEqual(result, completeMaterial);
    assert.deepEqual(materialSchema.parse(result), completeMaterial);
  });

  it("fills defaults for a material with only name/category aliases", () => {
    const result = normalizeMaterial({ name: "Paper towel", category: "setup" }, 2);
    assert.equal(result.item, "Paper towel");
    assert.equal(result.purpose, "setup");
    assert.equal(result.imageUrl, "");
    assert.equal(result.specification, "Standard artist-grade Paper towel");
    assert.equal(result.quantity, "As needed");
    assert.equal(
      result.substitution,
      "Use a comparable artist-grade alternative",
    );
    assert.equal(result.required, true);
  });

  it("fills defaults for a material with only item/purpose", () => {
    const result = normalizeMaterial(
      { item: "Masking tape", purpose: "Hold paper", required: false },
      5,
    );
    assert.equal(result.item, "Masking tape");
    assert.equal(result.purpose, "Hold paper");
    assert.equal(result.required, false);
    assert.equal(result.imageUrl, "");
    assert.match(result.specification, /Masking tape/);
    assert.equal(result.quantity, "As needed");
  });
});

describe("six materials with incomplete last object", () => {
  it("normalizes materials[5] without changing complete earlier entries", () => {
    const materials = [
      completeMaterial,
      {
        item: "140 lb cold-press paper",
        purpose: "Surface",
        required: true,
        imageUrl: null,
        specification: "140 lb",
        quantity: "1 sheet",
        substitution: null,
      },
      {
        item: "Water container",
        purpose: "Rinse",
        required: true,
        imageUrl: "",
        specification: "",
        quantity: "1",
        substitution: "Any clean jar",
      },
      {
        item: "Palette",
        purpose: "Mixing",
        required: true,
        imageUrl: null,
        specification: null,
        quantity: null,
        substitution: null,
      },
      {
        item: "Pencil",
        purpose: "Sketch",
        required: true,
        imageUrl: null,
        specification: "HB",
        quantity: "1",
        substitution: null,
      },
      // Incomplete sixth material — the failure mode from production.
      { item: "Paper towel", purpose: "Lift excess water", required: true },
    ];

    const normalized = materials.map((m, i) => normalizeMaterial(m, i));
    assert.deepEqual(normalized[0], completeMaterial);
    assert.equal(normalized[5].item, "Paper towel");
    assert.equal(normalized[5].imageUrl, "");
    assert.ok(normalized[5].specification.length > 0);
    assert.equal(normalized[5].quantity, "As needed");
    assert.ok(normalized[5].substitution.length > 0);

    const tutorial = normalizeTutorial(baseTutorial(normalized));
    assert.equal(tutorial.materials.length, 6);
    assert.equal(tutorial.materials[5].item, "Paper towel");
  });
});

describe("older saved tutorials + stage-generation schema", () => {
  it("repairs an older saved tutorial with missing material fields", () => {
    const legacy = baseTutorial([
      { item: "Brush", purpose: "Paint", required: true },
      { name: "Rag", category: "Other" },
    ]);
    const repaired = withNormalizedMaterials(legacy);
    assert.equal(repaired.materials[0].quantity, "As needed");
    assert.equal(repaired.materials[1].item, "Rag");
    assert.equal(repaired.materials[1].purpose, "Other");

    const parsed = tutorialSchema.safeParse(repaired);
    assert.equal(parsed.success, true);
  });

  it("stage-generation request schema accepts normalized incomplete materials", () => {
    const raw = {
      medium: "watercolor",
      mode: "master",
      tutorial: baseTutorial([
        completeMaterial,
        completeMaterial,
        completeMaterial,
        completeMaterial,
        completeMaterial,
        { item: "Extra supply", purpose: "Cleanup", required: false },
      ]),
    };

    // Before normalize, Zod may fail on missing nullable keys depending on schema;
    // after normalizeTutorialInput, parse must succeed.
    const normalized = normalizeTutorialInput(raw);
    const parsed = stageBodySchema.safeParse(normalized);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.tutorial.materials[5].quantity, "As needed");
      assert.equal(parsed.data.tutorial.materials[5].imageUrl, "");
    }
  });

  it("materialSchema accepts null legacy fields via transform", () => {
    const parsed = materialSchema.parse({
      item: "Jar",
      purpose: "Water",
      required: true,
      imageUrl: null,
      specification: null,
      quantity: null,
      substitution: null,
    });
    assert.equal(parsed.imageUrl, "");
    assert.equal(parsed.specification, "");
    assert.equal(parsed.quantity, "As needed");
    assert.match(parsed.substitution, /comparable/i);
  });
});
