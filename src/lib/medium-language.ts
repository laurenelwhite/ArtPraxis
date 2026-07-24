import type { Medium } from "@/lib/tutorial-schema";
import { MEDIUM_LABEL } from "@/lib/media";

export type SkillLevel = "beginner" | "intermediate" | "advanced";

export type MediumLanguage = {
  mediumLabel: string;
  practitionerAction: string;
  actionVerb: string;
  completedWorkNoun: string;
  surfaceLabel: string;
  toolLabel: string;
  preparationHeading: string;
  preparationDescription: (level: SkillLevel) => string;
  primaryPracticeCta: string;
  secondaryPracticeCta: string;
  completionHeading: string;
  completionBody: (level: SkillLevel) => string;
  stageTerminology: {
    sketch: string;
    value: string;
    firstPass: string;
    secondPass: string;
    refinement: string;
    final: string;
  };
  progressSteps: {
    composition: string;
    planning: string;
    demos: string;
    studio: string;
  };
  tipsByLevel: Record<SkillLevel, Array<{ title: string; body: string }>>;
  supportsColorPalette: boolean;
  supportsLineSamples: boolean;
  supportsDryingGuidance: boolean;
  supportsWaterGuidance: boolean;
  supportsSolventGuidance: boolean;
  materialsPaletteHeading: string;
  materialsPaletteLead: string;
};

function parseSkill(skill: string | undefined | null): SkillLevel {
  if (skill === "intermediate" || skill === "advanced") return skill;
  return "beginner";
}

const PEN_TIPS: MediumLanguage["tipsByLevel"] = {
  beginner: [
    {
      title: "Begin light",
      body: "Lay lighter structural lines before committing to dark accents you cannot erase.",
    },
    {
      title: "Reserve deepest black",
      body: "Save your darkest marks for the focal area so the drawing keeps hierarchy.",
    },
    {
      title: "Test on scrap",
      body: "Check line weight and hatching spacing on scrap paper before committing.",
    },
    {
      title: "Rotate the page",
      body: "Turn the sheet instead of forcing an uncomfortable hand angle for long strokes.",
    },
    {
      title: "Guard against smudge",
      body: "Keep a clean sheet under your drawing hand to reduce graphite and ink transfer.",
    },
    {
      title: "Value families first",
      body: "Build large light, mid, and dark families before chasing small details.",
    },
  ],
  intermediate: [
    {
      title: "Directional hatching",
      body: "Angle hatch strokes to reinforce form rather than filling space evenly.",
    },
    {
      title: "Line weight for depth",
      body: "Thicken nearer or shadowed contours; lighten receding edges.",
    },
    {
      title: "Negative space",
      body: "Let untouched paper carry light — over-hatching flattens the subject.",
    },
    {
      title: "Uneven detail",
      body: "Avoid equal detail density across the page; concentrate finish at the focus.",
    },
    {
      title: "Chromatic accents",
      body: "If using color, reserve accents for hierarchy — not every contour.",
    },
    {
      title: "Rhythm over texture",
      body: "Vary hatch spacing deliberately so marks read as form, not wallpaper.",
    },
  ],
  advanced: [
    {
      title: "Directional hatching",
      body: "Use hatch direction to reinforce form and the path of light across planes.",
    },
    {
      title: "Line weight hierarchy",
      body: "Vary pressure and nib weight to control depth without overworking midtones.",
    },
    {
      title: "Negative space as light",
      body: "Allow untouched paper to carry the brightest lights — protect them early.",
    },
    {
      title: "Selective density",
      body: "Avoid equal detail density; let quieter regions support the focal climax.",
    },
    {
      title: "Chromatic restraint",
      body: "Reserve colored accents for hierarchy and temperature, not decoration.",
    },
    {
      title: "Atmospheric economy",
      body: "Simplify distant marks; let near forms carry the heaviest ink.",
    },
  ],
};

const WATERCOLOR_TIPS: MediumLanguage["tipsByLevel"] = {
  beginner: [
    {
      title: "Preserve your whites",
      body: "Leave the brightest lights as untouched paper — once covered, that sparkle is hard to reclaim.",
    },
    {
      title: "Work light to dark",
      body: "Lay pale washes first, then deepen values gradually. Watercolor rewards patience more than force.",
    },
    {
      title: "Control your water",
      body: "The ratio of pigment to water decides whether a wash blooms softly or sits with crisp edges.",
    },
    {
      title: "Let washes dry",
      body: "Layering over damp paint invites mud. Give each wash time to settle before the next pass.",
    },
    {
      title: "Keep edges intentional",
      body: "Soft edges recede; hard edges advance. Decide which before the brush touches the paper.",
    },
    {
      title: "Plan the light path",
      body: "Squint at your reference. The largest light and dark shapes matter more than early detail.",
    },
  ],
  intermediate: [
    {
      title: "Glaze with restraint",
      body: "Thin transparent layers build color depth without burying earlier structure.",
    },
    {
      title: "Lost-and-found edges",
      body: "Soften secondary edges so the eye settles on the focal hard edge.",
    },
    {
      title: "Temperature shifts",
      body: "Cool a shadow or warm a light slightly to suggest form without heavy value jumps.",
    },
    {
      title: "Protect the light path",
      body: "Re-check reserved whites before each wash so midtones do not creep into them.",
    },
    {
      title: "Charge and lift",
      body: "Drop richer pigment into a damp wash, then lift selectively while the paper still yields.",
    },
    {
      title: "One decision per wash",
      body: "Enter each pass with a clear job — value, color, or edge — not all three at once.",
    },
  ],
  advanced: [
    {
      title: "Complex wet passages",
      body: "Stage moisture so blooms stay intentional and secondary forms stay quiet.",
    },
    {
      title: "Refined focal edges",
      body: "Save the sharpest contrast for the climax; everywhere else should support it.",
    },
    {
      title: "Atmospheric depth",
      body: "Cool and lighten distant passages; reserve warm chroma for nearer planes.",
    },
    {
      title: "Optical layering",
      body: "Let earlier washes show through — opacity is the exception, not the default.",
    },
    {
      title: "Selective finish",
      body: "Stop when hierarchy is clear. Extra detail often weakens the painting.",
    },
    {
      title: "Edge timing",
      body: "Know when the sheen leaves the paper — that window decides soft versus hard.",
    },
  ],
};

const OPAQUE_PAINT_TIPS: MediumLanguage["tipsByLevel"] = {
  beginner: [
    {
      title: "Block in masses",
      body: "Establish large light and dark shapes before refining edges or texture.",
    },
    {
      title: "Mix on the palette",
      body: "Decide value and temperature on the palette so the surface stays controlled.",
    },
    {
      title: "Keep brushes purposeful",
      body: "Change brushes when the job changes — mass, edge, or detail.",
    },
    {
      title: "Step back often",
      body: "Read the whole painting from a distance before chasing small accents.",
    },
    {
      title: "Protect your lights",
      body: "Save the brightest notes; they set the range for every midtone.",
    },
    {
      title: "One plane at a time",
      body: "Finish a major plane’s value relationship before decorating it.",
    },
  ],
  intermediate: [
    {
      title: "Underpainting first",
      body: "A quiet value map makes later color decisions faster and cleaner.",
    },
    {
      title: "Hard and soft edges",
      body: "Place hard edges at the focus; soften transitions that should recede.",
    },
    {
      title: "Scumble and glaze",
      body: "Use thin veils to adjust temperature without rebuilding the whole mass.",
    },
    {
      title: "Limit the chroma",
      body: "Reserve saturated notes for hierarchy; mute supporting planes.",
    },
    {
      title: "Brush economy",
      body: "Fewer decisive strokes beat many hesitant ones.",
    },
    {
      title: "Check temperature pairs",
      body: "Warm lights against cooler shadows — or the reverse — clarify form.",
    },
  ],
  advanced: [
    {
      title: "Optical mixing",
      body: "Let adjacent notes vibrate rather than over-blending every transition.",
    },
    {
      title: "Surface variety",
      body: "Vary opacity and texture so the finish feels tactile, not uniform.",
    },
    {
      title: "Controlled finish",
      body: "Decide what remains suggestive; full rendering everywhere flattens interest.",
    },
    {
      title: "Fat over lean (oil)",
      body: "Respect layer flexibility so later passages do not crack or sink.",
    },
    {
      title: "Selective detail",
      body: "Spend finish where the eye should rest; simplify the periphery.",
    },
    {
      title: "Quiet supporting planes",
      body: "Secondary forms should support light and color without competing.",
    },
  ],
};

const DRAWING_TIPS: MediumLanguage["tipsByLevel"] = {
  beginner: [
    {
      title: "Measure first",
      body: "Check proportions lightly before committing to dark accents.",
    },
    {
      title: "Value blocks",
      body: "Map large lights and darks before refining texture.",
    },
    {
      title: "Light construction",
      body: "Keep early lines erasable so structure can adjust.",
    },
    {
      title: "Protect highlights",
      body: "Reserve the brightest paper; lift carefully rather than digging in.",
    },
    {
      title: "Step back",
      body: "Read the whole drawing from a distance before adding detail.",
    },
    {
      title: "One family at a time",
      body: "Finish a value family across the subject before chasing local texture.",
    },
  ],
  intermediate: [
    {
      title: "Edge hierarchy",
      body: "Hard edges advance; soft edges recede — place them deliberately.",
    },
    {
      title: "Atmosphere",
      body: "Lighten and simplify distant forms so near forms carry weight.",
    },
    {
      title: "Focal contrast",
      body: "Save the strongest value jump for the area you want noticed first.",
    },
    {
      title: "Mark direction",
      body: "Let stroke direction follow form rather than fill space evenly.",
    },
    {
      title: "Selective finish",
      body: "Leave supporting regions quieter so the focus stays clear.",
    },
    {
      title: "Midtone restraint",
      body: "Avoid middle-gray everywhere — push lights and darks for structure.",
    },
  ],
  advanced: [
    {
      title: "Refined modeling",
      body: "Model form with subtle value shifts; reserve pure dark for climax.",
    },
    {
      title: "Selective rendering",
      body: "Fully resolve only what serves hierarchy and narrative.",
    },
    {
      title: "Atmospheric depth",
      body: "Cool, lighten, and simplify depth planes without losing structure.",
    },
    {
      title: "Surface rhythm",
      body: "Vary mark pressure and spacing so texture supports form.",
    },
    {
      title: "Dramatic light path",
      body: "Trace the light’s journey across major planes before accents.",
    },
    {
      title: "Economy of means",
      body: "Stop when the statement is clear — extra marks often weaken it.",
    },
  ],
};

function paintLike(
  medium: Medium,
  overrides: Partial<MediumLanguage> &
    Pick<
      MediumLanguage,
      | "mediumLabel"
      | "surfaceLabel"
      | "toolLabel"
      | "supportsSolventGuidance"
      | "supportsWaterGuidance"
      | "supportsDryingGuidance"
    >,
): MediumLanguage {
  return {
    practitionerAction: "painting",
    actionVerb: "paint",
    completedWorkNoun: "painting",
    preparationHeading: "Preparing your atelier",
    preparationDescription: (level) =>
      `We're studying your reference and building an ${level} ${overrides.mediumLabel.toLowerCase()} lesson — stage by stage from observation to finish.`,
    primaryPracticeCta: "Start Painting",
    secondaryPracticeCta: "Begin Study",
    completionHeading: "Painting complete",
    completionBody: (level) =>
      `You completed your ${level} ${overrides.mediumLabel.toLowerCase()} study.`,
    stageTerminology: {
      sketch: "Sketch",
      value: "Value Study",
      firstPass: "First Wash",
      secondPass: "Second Wash",
      refinement: "Refinement",
      final: "Final Touches",
    },
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning value and wash structure",
      demos: "Preparing painting demonstrations",
      studio: "Building your lesson",
    },
    tipsByLevel: medium === "watercolor" ? WATERCOLOR_TIPS : OPAQUE_PAINT_TIPS,
    supportsColorPalette: true,
    supportsLineSamples: false,
    materialsPaletteHeading: "Color palette",
    materialsPaletteLead:
      "Pigment chips for this lesson. Select a swatch for mixing notes.",
    ...overrides,
  };
}

function drawingLike(
  overrides: Partial<MediumLanguage> &
    Pick<
      MediumLanguage,
      | "mediumLabel"
      | "surfaceLabel"
      | "toolLabel"
      | "primaryPracticeCta"
      | "supportsColorPalette"
      | "supportsLineSamples"
      | "materialsPaletteHeading"
      | "materialsPaletteLead"
      | "progressSteps"
      | "tipsByLevel"
    >,
): MediumLanguage {
  return {
    practitionerAction: "drawing",
    actionVerb: "draw",
    completedWorkNoun: "drawing",
    preparationHeading: "Preparing your atelier",
    preparationDescription: (level) =>
      `We're studying your reference and building an ${level} ${overrides.mediumLabel.toLowerCase()} lesson focused on line, value, and controlled accents.`,
    secondaryPracticeCta: "Begin Study",
    completionHeading: "Drawing complete",
    completionBody: (level) =>
      `You completed your ${level} ${overrides.mediumLabel.toLowerCase()} study.`,
    stageTerminology: {
      sketch: "Sketch",
      value: "Value Study",
      firstPass: "First Pass",
      secondPass: "Development",
      refinement: "Refinement",
      final: "Final Touches",
    },
    supportsDryingGuidance: false,
    supportsWaterGuidance: false,
    supportsSolventGuidance: false,
    ...overrides,
  };
}

const MEDIUM_LANGUAGE: Record<Medium, MediumLanguage> = {
  watercolor: paintLike("watercolor", {
    mediumLabel: MEDIUM_LABEL.watercolor,
    surfaceLabel: "watercolor paper",
    toolLabel: "brush",
    supportsWaterGuidance: true,
    supportsDryingGuidance: true,
    supportsSolventGuidance: false,
    stageTerminology: {
      sketch: "Sketch",
      value: "Value Study",
      firstPass: "First Wash",
      secondPass: "Second Wash",
      refinement: "Refinement",
      final: "Final Touches",
    },
  }),
  acrylic: paintLike("acrylic", {
    mediumLabel: MEDIUM_LABEL.acrylic,
    surfaceLabel: "panel or canvas",
    toolLabel: "brush",
    supportsWaterGuidance: true,
    supportsDryingGuidance: true,
    supportsSolventGuidance: false,
    stageTerminology: {
      sketch: "Sketch",
      value: "Value Study",
      firstPass: "First Pass",
      secondPass: "Development",
      refinement: "Refinement",
      final: "Final Touches",
    },
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning value and color structure",
      demos: "Preparing painting demonstrations",
      studio: "Building your lesson",
    },
  }),
  oil: paintLike("oil", {
    mediumLabel: MEDIUM_LABEL.oil,
    surfaceLabel: "prepared panel or canvas",
    toolLabel: "brush or knife",
    supportsWaterGuidance: false,
    supportsDryingGuidance: true,
    supportsSolventGuidance: true,
    stageTerminology: {
      sketch: "Sketch",
      value: "Value Study",
      firstPass: "First Pass",
      secondPass: "Development",
      refinement: "Refinement",
      final: "Final Touches",
    },
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning value and color structure",
      demos: "Preparing painting demonstrations",
      studio: "Building your lesson",
    },
  }),
  pastel: drawingLike({
    mediumLabel: MEDIUM_LABEL.pastel,
    surfaceLabel: "pastel paper",
    toolLabel: "pastel",
    primaryPracticeCta: "Start Drawing",
    supportsColorPalette: true,
    supportsLineSamples: false,
    materialsPaletteHeading: "Color set",
    materialsPaletteLead: "Pastel sticks for this lesson. Select a swatch for role notes.",
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning value and color structure",
      demos: "Preparing drawing demonstrations",
      studio: "Building your lesson",
    },
    tipsByLevel: DRAWING_TIPS,
    preparationDescription: (level) =>
      `We're studying your reference and building an ${level} pastel lesson focused on value masses, edge, and color temperature.`,
  }),
  charcoal: drawingLike({
    mediumLabel: MEDIUM_LABEL.charcoal,
    surfaceLabel: "paper",
    toolLabel: "charcoal",
    primaryPracticeCta: "Start Drawing",
    supportsColorPalette: false,
    supportsLineSamples: true,
    materialsPaletteHeading: "Value key",
    materialsPaletteLead: "Value samples for this lesson — lights, midtones, and deep darks.",
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning line and value structure",
      demos: "Preparing drawing demonstrations",
      studio: "Building your lesson",
    },
    tipsByLevel: DRAWING_TIPS,
    preparationDescription: (level) =>
      `We're studying your reference and building an ${level} charcoal lesson focused on mass, edge, and light path.`,
  }),
  pencil: drawingLike({
    mediumLabel: MEDIUM_LABEL.pencil,
    surfaceLabel: "paper",
    toolLabel: "pencil",
    primaryPracticeCta: "Start Drawing",
    supportsColorPalette: false,
    supportsLineSamples: true,
    materialsPaletteHeading: "Value key",
    materialsPaletteLead: "Graphite value samples for this lesson.",
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning line and value structure",
      demos: "Preparing drawing demonstrations",
      studio: "Building your lesson",
    },
    tipsByLevel: DRAWING_TIPS,
    preparationDescription: (level) =>
      `We're studying your reference and building an ${level} pencil lesson focused on contour, hatching, and value.`,
  }),
  pen: drawingLike({
    mediumLabel: "Pen",
    surfaceLabel: "paper",
    toolLabel: "pen",
    primaryPracticeCta: "Start Drawing",
    supportsColorPalette: true,
    supportsLineSamples: true,
    materialsPaletteHeading: "Ink & color set",
    materialsPaletteLead:
      "Inks and colored accents for this lesson. Small samples show role — not giant paint chips.",
    progressSteps: {
      composition: "Studying composition",
      planning: "Planning line and value structure",
      demos: "Preparing drawing demonstrations",
      studio: "Building your lesson",
    },
    tipsByLevel: PEN_TIPS,
    preparationDescription: (level) =>
      `We're studying your reference and building an ${level} pen lesson focused on line, value, and controlled color accents.`,
  }),
};

/** Canonical medium-language config — use instead of scattered painting copy. */
export function getMediumLanguage(medium: string | null | undefined): MediumLanguage {
  const key = (medium ?? "watercolor").toLowerCase() as Medium;
  return MEDIUM_LANGUAGE[key] ?? MEDIUM_LANGUAGE.watercolor;
}

export function getMediumTips(
  medium: string | null | undefined,
  skill: string | null | undefined,
) {
  const lang = getMediumLanguage(medium);
  return lang.tipsByLevel[parseSkill(skill)];
}

export function getCreatorPipeline(medium: string | null | undefined) {
  const steps = getMediumLanguage(medium).progressSteps;
  return [
    { id: "composition", label: steps.composition },
    { id: "planning", label: steps.planning },
    { id: "demos", label: steps.demos },
    { id: "studio", label: steps.studio },
  ];
}

export function formatMediumLevelEyebrow(
  medium: string | null | undefined,
  skill: string | null | undefined,
) {
  const lang = getMediumLanguage(medium);
  const level = parseSkill(skill);
  return `${lang.mediumLabel.toUpperCase()} · ${level.toUpperCase()}`;
}

export { parseSkill };
