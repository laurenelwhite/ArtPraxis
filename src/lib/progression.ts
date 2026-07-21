import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { buildStageImagePrompt, stageIntent } from "@/lib/stage-image-prompts";
import { ENABLE_AI_STAGE_REFINEMENT } from "@/lib/feature-flags";

// The fixed six-stage watercolor-textbook workflow. This order is intentional
// and shared across the whole feature so v2 image generation can map 1:1 to it.
// Stage 1 is the dedicated pencil-sketch construction drawing shown (alongside
// the untouched reference) before any paint — see stage-image-prompts.ts for
// its sketch-specific generation prompt.
export type StageId =
  | "pencil-sketch"
  | "value-study"
  | "first-wash"
  | "second-wash"
  | "refinement"
  | "finished";

// The image abstraction that makes Visual Progression future-proof.
//
// v1 ships `status: "placeholder"` with `url: null`; the UI renders the lesson
// reference image under a stage-appropriate CSS filter. When a later version
// generates real per-stage images it only needs to set `url` (persisted on the
// project doc as `progressionImages[i]`) — no component or layout changes.
// Generation lifecycle of a stage's target demonstration image.
// pending → generating (may already show a deterministic preview) → ready
// failed is retryable without regenerating completed stages.
// Master may also be "needsReview" when composition validation hard-failed.
export type GenerationStatus = "pending" | "generating" | "ready" | "failed" | "needsReview";

/** Normalize legacy Firestore values (idle/error) to the current status enum. */
export function normalizeGenerationStatus(raw: unknown): GenerationStatus {
  if (raw === "idle") return "pending";
  if (raw === "error") return "failed";
  if (raw === "pending" || raw === "generating" || raw === "ready" || raw === "failed" || raw === "needsReview") {
    return raw;
  }
  return "pending";
}

// Persisted per-stage target-image record (Firestore:
// users/{uid}/projects/{id}/detail/progression → stages[]). The original
// reference is never overwritten; targets are stored separately from the
// project summary. See src/lib/progression-images.ts for the read/write layer.
export interface StageImageRecord {
  stageId: StageId;
  index: number;
  referenceImageUrl: string;
  targetImageUrl: string | null;
  prompt: string;
  model: string;
  generationStatus: GenerationStatus;
  error: string | null;
  retryCount: number;
  createdAt: number | null;
  /** Passed automated composition-consistency validation. */
  validated?: boolean;
  /** Deterministic preview still in use (not the final AI target). */
  fallback?: boolean;
  /** Where the current deterministic preview was derived from. */
  previewSource?: "reference" | "master" | null;
}

export interface StageVisual {
  /** Convenience flag: a real target image is present. */
  status: "ready" | "placeholder";
  /** Lifecycle of the generated target image. */
  generationStatus: GenerationStatus;
  /** The AI-generated target demonstration for this stage (null until ready). */
  url: string | null;
  /** The original reference image (never a filter/duplicate of the target). */
  referenceUrl: string | null;
  /** Legacy per-stage CSS filter — retained for thumbnails only, never shown as
   *  finished target art. */
  filter: string;
  /** One-line description of what the target plate for this stage shows. */
  intent: string;
  /** Text-to-image prompt the stage-image model uses for this stage. */
  prompt: string;
  /** Last generation error, if any. */
  error: string | null;
  /** True while an AI refinement is still running over a master-derived preview. */
  refining: boolean;
  /** True while waiting on the master; provisional reference-derived preview. */
  preparingPainted: boolean;
  /** Finished stage still waiting for the master (must not look like a finished painting). */
  preparingFinished: boolean;
  /** Where the current deterministic preview was derived from. */
  previewSource: "reference" | "master" | null;
  /** Internal metadata mirror of the record's fallback flag (not rendered as a caption). */
  fallback: boolean;
}

// Wetness scale for the watercolor water zone. Ordered dry → very wet.
export type WetLevel = "dry" | "damp" | "moist" | "wet" | "very-wet";

// A pigment as shown on the desk palette: swatch + mixing instruction kept
// beside the colour it describes (never separated).
export interface PaintColor {
  name: string;
  hex: string;
  ratio: string; // e.g. "70% water · 30% pigment"
  mixingNote: string;
}

// Concise, scannable fields for the Paint Mode instructor rail / desk zones.
// Values are kept short (labels + values, not paragraphs) to satisfy the
// three-second rule.
export interface StagePaint {
  goal: string;
  brush: string; // type + size, e.g. "Round #10–#12"
  brushPressure: string; // e.g. "Light — let it flow"
  brushPurpose: string; // stroke purpose, e.g. "First large, light washes"
  water: string; // water / medium handling (one concise instruction)
  wetness: WetLevel; // visual wetness scale (watercolor)
  colors: PaintColor[];
  estimatedMinutes: number;
  watchOut: string; // single biggest thing to avoid
  checkpoint: string; // "you're on track when…"
  insight: string; // short practice-philosophy note
}

export interface ProgressionStage {
  id: StageId;
  index: number; // 1..6
  title: string;
  kicker: string; // e.g. "Stage 01 of 06"
  explanation: string;
  goals: string[];
  commonMistakes: string[];
  proTips: string[];
  visual: StageVisual;
  paint: StagePaint;
}

type StageMeta = {
  id: StageId;
  title: string;
  filter: string;
};

// Development-placeholder treatments. These are NOT the finished feature: each
// filter (adding opacity/blur/posterizing contrast over white paper) pushes the
// shared reference toward that stage's look so the six previews read as visibly
// different artistic decisions — construction → value masses → pale washes →
// local color → refinement → finished. Real per-stage plates replace them via
// `progressionImages` (see stage-image-prompts.ts + /api/generate-stage-images).
const STAGE_META: StageMeta[] = [
  { id: "pencil-sketch", title: "Pencil sketch", filter: "grayscale(1) contrast(1.5) brightness(1.4) opacity(.5)" },
  { id: "value-study", title: "Value study", filter: "grayscale(1) contrast(1.95) brightness(1.04)" },
  { id: "first-wash", title: "First wash", filter: "saturate(.34) brightness(1.16) contrast(.82) blur(1.4px)" },
  { id: "second-wash", title: "Second wash", filter: "saturate(.72) brightness(1.04) contrast(.96) blur(.5px)" },
  { id: "refinement", title: "Refinement", filter: "saturate(.92) contrast(1.07)" },
  { id: "finished", title: "Finished painting", filter: "none" },
];

function clean(items: (string | undefined | null)[], max = 4): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of items) {
    const value = (raw ?? "").trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    out.push(value);
    if (out.length >= max) break;
  }
  return out;
}

type Step = Tutorial["steps"][number];

// Split the AI-authored steps into three roughly equal painting phases that map
// onto First wash / Second wash / Refinement.
function phaseSteps(steps: Step[]): [Step[], Step[], Step[]] {
  const size = Math.max(1, Math.ceil(steps.length / 3));
  return [steps.slice(0, size), steps.slice(size, size * 2), steps.slice(size * 2)];
}

interface StageContent {
  explanation: string;
  goals: string[];
  commonMistakes: string[];
  proTips: string[];
}

function fromPhase(intro: string, group: Step[], fallbackMistake: string): StageContent {
  const lead = group[0]?.objective ?? "";
  return {
    explanation: [intro, lead].filter(Boolean).join(" "),
    goals: clean(group.map((s) => s.objective)),
    commonMistakes: clean([...group.map((s) => s.commonMistake), fallbackMistake]),
    proTips: clean([...group.map((s) => s.technique), ...group.map((s) => s.visualCue)]),
  };
}

function stageContent(id: StageId, tutorial: Tutorial, phases: [Step[], Step[], Step[]]): StageContent {
  const { composition, valueMap, creativeChoices, overview, steps } = tutorial;
  switch (id) {
    case "pencil-sketch":
      return {
        explanation: `Before any paint, transfer the composition as a light pencil construction. Reduce the scene to essential contours, the major shapes, and correct proportions — placing the focal point (${composition.focalPoint}) without over-drawing. This is the amount of drawing you need before you begin painting.`,
        goals: clean([
          "Transfer the composition accurately without over-drawing",
          `Place the focal point: ${composition.focalPoint}`,
          "Establish correct proportions and major shape boundaries",
          ...composition.majorShapes.slice(0, 2).map((s) => `Locate the ${s}`),
        ]),
        commonMistakes: clean([
          "Drawing heavier and more detailed than you think — keep it lighter and simpler.",
          "Outlining every object instead of placing major shapes and negative spaces.",
          steps[0]?.commonMistake,
        ]),
        proTips: clean([
          "Keep graphite light enough to disappear under paint.",
          `Squint to simplify what you see: ${valueMap.squintTest}`,
          "Check angles, proportions, and negative spaces — not fussy outlines.",
        ]),
      };
    case "value-study":
      return {
        explanation: `Resolve the value structure before any color. Mass the scene into three values so the painting reads from across the room. ${valueMap.squintTest}`,
        goals: clean([
          `Lights: ${valueMap.lights}`,
          `Midtones: ${valueMap.midtones}`,
          `Darks: ${valueMap.darks}`,
          `Commit to the plan: ${composition.valuePlan}`,
        ]),
        commonMistakes: clean([
          "Making midtones too dark, leaving no room for true darks.",
          "Losing the lightest lights by covering them too early.",
        ]),
        proTips: clean([
          "Reserve your whites now — they are hard to recover later.",
          `Keep the darkest dark near the focal point: ${composition.focalPoint}`,
        ]),
      };
    case "first-wash":
      return fromPhase(
        "Lay in the lightest, largest washes first, keeping edges soft and the color clean and transparent.",
        phases[0],
        "Going too dark or too opaque in the first pass.",
      );
    case "second-wash":
      return fromPhase(
        "Build the midtones with a second, more deliberate layer and start shaping form and local color.",
        phases[1],
        "Muddying color by overworking a layer before it dries.",
      );
    case "refinement":
      return fromPhase(
        "Deepen the darks, sharpen the focal point, and add only the details that earn their place.",
        phases[2],
        "Adding detail everywhere and flattening the focal point.",
      );
    case "finished":
      return {
        explanation: overview,
        goals: clean([
          "Unify the painting and confirm the focal point reads first",
          `Verify the value plan holds: ${composition.valuePlan}`,
          "Step back and judge the piece as a whole",
        ]),
        commonMistakes: clean([
          "Overworking — knowing when to stop keeps the painting fresh.",
          steps[steps.length - 1]?.commonMistake,
        ]),
        proTips: clean([
          ...creativeChoices,
          steps[steps.length - 1]?.technique,
        ]),
      };
    default:
      return { explanation: "", goals: [], commonMistakes: [], proTips: [] };
  }
}

// ---- Paint Mode instructor-rail derivation -------------------------------
//
// The stored tutorial has no per-step "brush" or "water" fields, so these are
// derived from the medium and the stage's phase. They are honest, general
// technique guidance and can be replaced by generated values later without any
// UI change (the rail reads whatever `paint` contains).

type PhaseKey = "draw" | "value" | "wash" | "refine" | "final";

const STAGE_PHASE: Record<StageId, PhaseKey> = {
  "pencil-sketch": "draw",
  "value-study": "value",
  "first-wash": "wash",
  "second-wash": "wash",
  refinement: "refine",
  finished: "final",
};

// Short stroke-purpose shown beside the brush on the desk (medium-agnostic).
const BRUSH_PURPOSE: Record<StageId, string> = {
  "pencil-sketch": "Transfer the construction drawing",
  "value-study": "Mass the three values",
  "first-wash": "First large, light washes",
  "second-wash": "Build midtones & local colour",
  refinement: "Darks, edges & focal detail",
  finished: "Final accents & unifying touches",
};

const PRESSURE: Record<PhaseKey, string> = {
  draw: "Light pressure",
  value: "Even, gentle",
  wash: "Light — let it flow",
  refine: "Firm for accents",
  final: "Controlled, minimal",
};

// Watercolor wetness by stage (dry → very wet). Non-watercolor media show the
// `water` text instead of this scale.
const WETNESS: Record<StageId, WetLevel> = {
  "pencil-sketch": "dry",
  "value-study": "moist",
  "first-wash": "very-wet",
  "second-wash": "wet",
  refinement: "moist",
  finished: "damp",
};

// Practice-philosophy notes — used sparingly, one per stage, never competing
// with the instruction itself.
const INSIGHT: Record<StageId, string> = {
  "pencil-sketch": "A light, accurate drawing is the foundation of a confident painting.",
  "value-study": "Values do the work; colour gets the credit.",
  "first-wash": "This stage is practice, not proof.",
  "second-wash": "Progress is built one wash at a time.",
  refinement: "Every study moves you forward.",
  finished: "Leave room to learn from the next painting.",
};

function brushFor(medium: Medium, phase: PhaseKey): string {
  const table: Record<Medium, Record<PhaseKey, string>> = {
    watercolor: { draw: "HB pencil", value: "Round #10–#12", wash: "Round #10–#12", refine: "Round #4–#6", final: "Round #2–#4" },
    acrylic: { draw: "HB pencil", value: 'Flat 1"', wash: 'Flat 1"', refine: "Round #4", final: "Round #2" },
    oil: { draw: "Charcoal", value: "Filbert #8", wash: "Filbert #8", refine: "Round #4", final: "Round #2" },
    pastel: { draw: "Hard pastel", value: "Pastel, on side", wash: "Soft pastel", refine: "Pastel edge", final: "Hard pastel" },
    charcoal: { draw: "Vine charcoal", value: "Compressed", wash: "Compressed", refine: "Charcoal pencil", final: "Charcoal pencil" },
    pencil: { draw: "2B", value: "4B–6B", wash: "2B–4B", refine: "HB–2H", final: "HB" },
    pen: { draw: "Pencil (light)", value: "Fine liner", wash: "Broad nib", refine: "Fine liner", final: "Fine liner" },
  };
  return table[medium][phase];
}

function waterFor(medium: Medium, phase: PhaseKey): string {
  const wet: Record<PhaseKey, string> =
    medium === "watercolor"
      ? { draw: "Dry — pencil only", value: "Diluted grays", wash: "Wet-on-wet, generous", refine: "Damp, controlled", final: "Minimal, crisp edges" }
      : medium === "oil"
        ? { draw: "Dry — sketch only", value: "Thin with medium", wash: "Thin with medium", refine: "Less medium, thicker", final: "Thick, direct" }
        : { draw: "Dry — sketch only", value: "Thin with water", wash: "Thin with water", refine: "Less water, thicker", final: "Thick, direct" };
  const dry: Record<PhaseKey, string> = { draw: "Light pressure", value: "Build tone gently", wash: "Layer, mid pressure", refine: "Firm for accents", final: "Blend & fix" };
  const isWet = medium === "watercolor" || medium === "acrylic" || medium === "oil";
  return isWet ? wet[phase] : dry[phase];
}

function firstSentence(text: string): string {
  const match = text.match(/^[^.!?]*[.!?]/);
  return (match ? match[0] : text).trim();
}

/**
 * Build the six-stage progression for a lesson.
 *
 * @param targets Optional per-stage target-image records (matched by stageId).
 *   A record with a `targetImageUrl` flips that stage's visual to `ready`;
 *   otherwise the stage carries its `generationStatus` (pending/generating/failed)
 *   while a deterministic preview may already be visible (and optionally under
 *   “Refining target…” when ENABLE_AI_STAGE_REFINEMENT is on).
 *   so the UI can show generating/retry states instead of a filtered fake.
 */
export function buildProgression(
  tutorial: Tutorial,
  referenceUrl: string,
  medium: Medium,
  targets: StageImageRecord[] = [],
): ProgressionStage[] {
  const phases = phaseSteps(tutorial.steps);
  const total = STAGE_META.length;
  const totalMinutes = tutorial.estimatedMinutes;
  const toColor = (c: Tutorial["palette"][number]): PaintColor => ({
    name: c.name,
    hex: c.hex,
    ratio: c.ratio,
    mixingNote: c.mixingNote,
  });
  const paletteByName = new Map<string, PaintColor>(
    tutorial.palette.map((c) => [c.name, toColor(c)] as [string, PaintColor]),
  );
  const fullPalette: PaintColor[] = tutorial.palette.map(toColor);

  const phaseColors = (group: Step[]): PaintColor[] => {
    const names = new Set<string>();
    group.forEach((s) => s.paletteNames.forEach((n) => names.add(n)));
    const out: PaintColor[] = [];
    names.forEach((n) => {
      const c = paletteByName.get(n);
      if (c) out.push(c);
    });
    return out.slice(0, 6);
  };
  const phaseMinutes = (group: Step[]) => group.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0);

  function checkpointFor(id: StageId): string {
    switch (id) {
      case "pencil-sketch":
        return "The major shapes and negative spaces should read correctly before adding paint.";
      case "value-study":
        return firstSentence(tutorial.valueMap.squintTest) || "Three values read clearly when you squint.";
      case "first-wash":
        return phases[0][0]?.checkpoint || "Washes stay light, clean, and transparent.";
      case "second-wash":
        return phases[1][0]?.checkpoint || "Midtones shape the forms without going muddy.";
      case "refinement":
        return phases[2][0]?.checkpoint || "Darks and focal detail placed with restraint.";
      case "finished":
        return "The focal point reads first and the value plan holds.";
      default:
        return "";
    }
  }

  function paintFor(id: StageId, content: StageContent): StagePaint {
    const phase = STAGE_PHASE[id];
    let colors: PaintColor[] = [];
    let minutes = 0;
    if (id === "first-wash") { colors = phaseColors(phases[0]); minutes = phaseMinutes(phases[0]); }
    else if (id === "second-wash") { colors = phaseColors(phases[1]); minutes = phaseMinutes(phases[1]); }
    else if (id === "refinement") { colors = phaseColors(phases[2]); minutes = phaseMinutes(phases[2]); }
    else if (id === "finished") { colors = fullPalette.slice(0, 6); minutes = Math.round(totalMinutes * 0.1); }
    else if (id === "pencil-sketch") { minutes = Math.round(totalMinutes * 0.15); }
    else { minutes = Math.round(totalMinutes * 0.12); } // value-study
    return {
      goal: firstSentence(content.goals[0] ?? content.explanation),
      brush: brushFor(medium, phase),
      brushPressure: PRESSURE[phase],
      brushPurpose: BRUSH_PURPOSE[id],
      water: waterFor(medium, phase),
      wetness: WETNESS[id],
      colors,
      estimatedMinutes: Math.max(3, minutes),
      watchOut: content.commonMistakes[0] ?? "Don't rush — let each stage settle before the next.",
      checkpoint: checkpointFor(id),
      insight: INSIGHT[id],
    };
  }

  return STAGE_META.map((meta, i) => {
    const content = stageContent(meta.id, tutorial, phases);
    const record = targets.find((t) => t.stageId === meta.id);
    const url = record?.targetImageUrl || null;
    // Preserve generating/failed even when a deterministic preview URL is present.
    const generationStatus: GenerationStatus =
      record?.generationStatus ?? (url ? "ready" : "pending");
    const previewSource = record?.previewSource ?? null;
    const refining =
      ENABLE_AI_STAGE_REFINEMENT &&
      Boolean(url) &&
      generationStatus === "generating" &&
      previewSource === "master";
    const preparingPainted = Boolean(url) && generationStatus === "generating" && previewSource === "reference" && meta.id !== "finished";
    const preparingFinished =
      meta.id === "finished" &&
      (generationStatus === "generating" || generationStatus === "pending") &&
      (previewSource === "reference" || !url || Boolean(record?.fallback));
    return {
      id: meta.id,
      index: i + 1,
      title: meta.title,
      kicker: `Stage ${String(i + 1).padStart(2, "0")} of ${String(total).padStart(2, "0")}`,
      ...content,
      visual: {
        status: url ? "ready" : "placeholder",
        generationStatus,
        url,
        referenceUrl: referenceUrl || null,
        filter: meta.filter,
        intent: stageIntent(meta.id),
        prompt: buildStageImagePrompt({ tutorial, medium, stageId: meta.id, index: i + 1, total }),
        error: record?.error ?? null,
        refining,
        preparingPainted,
        preparingFinished,
        previewSource,
        fallback: record?.fallback ?? false,
      },
      paint: paintFor(meta.id, content),
    };
  });
}
