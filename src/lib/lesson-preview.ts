import type { Medium } from "@/lib/tutorial-schema";
import { MEDIUM_LABEL } from "@/lib/media";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type LessonPreviewModel = {
  techniques: string[];
  duration: string;
  difficulty: string;
  summary: string;
};

const TECHNIQUES: Record<Medium, Record<SkillLevel, string[]>> = {
  watercolor: {
    beginner: ["Washes & wet-into-wet", "Value shapes", "Edge control"],
    intermediate: ["Glazing layers", "Lost-and-found edges", "Color temperature"],
    advanced: ["Complex wet passages", "Refined focal edges", "Atmospheric depth"],
  },
  acrylic: {
    beginner: ["Blocking in masses", "Opaque layering", "Brush economy"],
    intermediate: ["Underpainting", "Scumbling & glaze", "Hard/soft edges"],
    advanced: ["Optical mixing", "Surface variety", "Controlled finish"],
  },
  oil: {
    beginner: ["Fat-over-lean basics", "Mass drawing in paint", "Simple planes"],
    intermediate: ["Alla prima passages", "Color mixing restraint", "Soft transitions"],
    advanced: ["Layered finish", "Nuanced temperature", "Selective detail"],
  },
  pastel: {
    beginner: ["Large value masses", "Layered stroke direction", "Paper tooth"],
    intermediate: ["Optical blending", "Edge hierarchy", "Accent lights"],
    advanced: ["Atmospheric veil", "Selective finish", "Surface rhythm"],
  },
  charcoal: {
    beginner: ["Gesture & proportion", "Value blocks", "Kneaded eraser lights"],
    intermediate: ["Edge hierarchy", "Atmosphere", "Focal contrast"],
    advanced: ["Refined modeling", "Selective finish", "Dramatic light path"],
  },
  pencil: {
    beginner: ["Contour & construction", "Hatching values", "Proportion checks"],
    intermediate: ["Form modeling", "Edge variety", "Measured detail"],
    advanced: ["Subtle transitions", "Selective rendering", "Atmospheric depth"],
  },
  pen: {
    beginner: ["Confident contour", "Hatching families", "Pattern for value"],
    intermediate: ["Cross-hatching depth", "Edge economy", "Focal density"],
    advanced: ["Atmospheric line weight", "Selective finish", "Rhythmic mark-making"],
  },
};

const DURATION: Record<SkillLevel, string> = {
  beginner: "45–75 minutes",
  intermediate: "60–90 minutes",
  advanced: "75–120 minutes",
};

const DIFFICULTY: Record<SkillLevel, string> = {
  beginner: "Guided · foundational",
  intermediate: "Steady challenge",
  advanced: "Refined · independent",
};

/**
 * Tasteful pre-generation preview copy. Not AI analysis —
 * medium + experience placeholders so the page never feels empty.
 */
export function getLessonPreview(
  medium: Medium,
  skill: string,
): LessonPreviewModel {
  const level: SkillLevel =
    skill === "intermediate" || skill === "advanced" ? skill : "beginner";
  const label = MEDIUM_LABEL[medium];
  return {
    techniques: TECHNIQUES[medium][level],
    duration: DURATION[level],
    difficulty: DIFFICULTY[level],
    summary: `A stage-by-stage ${label.toLowerCase()} lesson built from your reference — observation through a finished demonstration.`,
  };
}
