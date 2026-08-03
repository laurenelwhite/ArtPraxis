import type { StageId } from "@/lib/progression";
import type { Medium } from "@/lib/tutorial-schema";
import { STAGE_DOM_ID } from "@/lib/stage-icons";

/**
 * Pedagogical continuous-document sections.
 * Plan / Observe / Color are presentation sections composed from tutorial data.
 * Draw → Finish wrap the six stored progression stages without mutating schema.
 */
export type LessonDocumentSectionId =
  | "plan"
  | "observe"
  | "draw"
  | "values"
  | "color"
  | "first-layer"
  | "build"
  | "refine"
  | "finish";

export type LessonDocumentStep = {
  id: LessonDocumentSectionId;
  /** 1-based document section number (Plan = 1 … Finish = 9). */
  number: number;
  label: string;
  shortLabel: string;
  domId: string;
  /** Linked stored stage when this section wraps generated progression data. */
  stageId?: StageId;
};

/** Stable anchors for non-stage preface / palette sections. */
export const LESSON_SECTION_DOM_ID: Record<
  "plan" | "observe" | "color",
  string
> = {
  plan: "lesson-section-plan",
  observe: "lesson-section-observe",
  color: "lesson-section-color",
};

const STAGE_TO_SECTION: Record<StageId, LessonDocumentSectionId> = {
  "pencil-sketch": "draw",
  "value-study": "values",
  "first-wash": "first-layer",
  "second-wash": "build",
  refinement: "refine",
  finished: "finish",
};

/** Pedagogical map labels — presentation only; does not rename StageId. */
const PEDAGOGICAL_LABEL: Record<LessonDocumentSectionId, string> = {
  plan: "Plan",
  observe: "Observe",
  draw: "Draw",
  values: "Values",
  color: "Color",
  "first-layer": "First layer",
  build: "Build",
  refine: "Refine",
  finish: "Finish",
};

const PEDAGOGICAL_SHORT: Record<LessonDocumentSectionId, string> = {
  plan: "Plan",
  observe: "Observe",
  draw: "Draw",
  values: "Values",
  color: "Color",
  "first-layer": "Layer",
  build: "Build",
  refine: "Refine",
  finish: "Finish",
};

/** Medium-aware section title when the map label needs studio vocabulary. */
export function resolveDocumentSectionTitle(
  sectionId: LessonDocumentSectionId,
  medium?: Medium | string | null,
): string {
  const key = (medium ?? "watercolor").toLowerCase();
  if (sectionId === "first-layer") {
    if (key === "watercolor") return "First wash";
    if (key === "pastel" || key === "oil" || key === "acrylic") {
      return "First layer";
    }
    if (key === "charcoal" || key === "pencil" || key === "pen") {
      return "Structure pass";
    }
  }
  if (sectionId === "build") {
    if (key === "watercolor") return "Build";
    if (key === "pastel") return "Form and light";
    if (key === "oil" || key === "acrylic") return "Form development";
  }
  return PEDAGOGICAL_LABEL[sectionId];
}

export function sectionIdForStage(stageId: StageId): LessonDocumentSectionId {
  return STAGE_TO_SECTION[stageId];
}

export function buildLessonDocumentSteps(
  medium?: Medium | string | null,
): LessonDocumentStep[] {
  const steps: Array<{
    id: LessonDocumentSectionId;
    stageId?: StageId;
    domId: string;
  }> = [
    { id: "plan", domId: LESSON_SECTION_DOM_ID.plan },
    { id: "observe", domId: LESSON_SECTION_DOM_ID.observe },
    {
      id: "draw",
      stageId: "pencil-sketch",
      domId: STAGE_DOM_ID["pencil-sketch"],
    },
    {
      id: "values",
      stageId: "value-study",
      domId: STAGE_DOM_ID["value-study"],
    },
    { id: "color", domId: LESSON_SECTION_DOM_ID.color },
    {
      id: "first-layer",
      stageId: "first-wash",
      domId: STAGE_DOM_ID["first-wash"],
    },
    {
      id: "build",
      stageId: "second-wash",
      domId: STAGE_DOM_ID["second-wash"],
    },
    {
      id: "refine",
      stageId: "refinement",
      domId: STAGE_DOM_ID.refinement,
    },
    {
      id: "finish",
      stageId: "finished",
      domId: STAGE_DOM_ID.finished,
    },
  ];

  return steps.map((step, index) => ({
    id: step.id,
    number: index + 1,
    label: resolveDocumentSectionTitle(step.id, medium),
    shortLabel: PEDAGOGICAL_SHORT[step.id],
    domId: step.domId,
    stageId: step.stageId,
  }));
}

/** Derive skills list from tutorial creative choices or techniques (no invention). */
export function deriveLessonSkills(tutorial: {
  creativeChoices?: string[];
  steps?: Array<{ technique?: string }>;
} | null): string[] {
  if (!tutorial) return [];
  const fromChoices = tutorial.creativeChoices?.filter(Boolean).slice(0, 4) ?? [];
  if (fromChoices.length) return fromChoices;
  const fromSteps =
    tutorial.steps
      ?.map((s) => s.technique?.trim())
      .filter((t): t is string => Boolean(t))
      .slice(0, 4) ?? [];
  return Array.from(new Set(fromSteps));
}
