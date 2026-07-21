import type { StageId } from "@/lib/progression";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";

// A living artistic vocabulary. Terms are surfaced *in context* (in lessons,
// stage names, instructor feedback, and marketing) rather than as an isolated
// glossary. Each term carries a concise definition, why it matters, and where
// it is practiced — so repeated, in-context exposure builds fluency over time.
//
// UI copy is American English ("color", not "colour"). Alias lists may include
// British spellings purely to help auto-linking match generated prose; they are
// never shown to the reader.
export interface ArtTerm {
  id: string;
  term: string;
  /** Extra spellings/plurals used when auto-linking prose (never displayed). */
  aliases?: string[];
  /** Media this concept is relevant to. Omit for universal concepts. Used to
   *  avoid surfacing e.g. oil-specific techniques in a watercolor lesson. */
  media?: Medium[];
  short: string;
  why: string;
  where: string;
}

// Convenient media groupings for relevance tagging.
const PAINT: Medium[] = ["watercolor", "acrylic", "oil", "pastel"];
const BRUSH_PAINT: Medium[] = ["watercolor", "acrylic", "oil"];
const OIL_ACRYLIC: Medium[] = ["oil", "acrylic"];

export const ART_TERMS: ArtTerm[] = [
  // ---- Foundations & color theory ----------------------------------------
  {
    id: "value",
    term: "Value",
    aliases: ["values", "tonal value", "tonal values"],
    short: "The relative lightness or darkness of an area, independent of its color.",
    why: "Values create form, depth, and light. A painting reads by its values long before its color.",
    where: "Practiced directly in the Value study stage and in the value overlay on your reference.",
  },
  {
    id: "hue",
    term: "Hue",
    aliases: ["hues"],
    media: PAINT,
    short: "The name of a color — red, blue, yellow-green, and so on.",
    why: "Naming hue precisely helps you mix intentionally instead of by accident.",
    where: "Chosen when you build your palette.",
  },
  {
    id: "saturation",
    term: "Saturation",
    aliases: ["chroma", "saturated", "intensity", "desaturated"],
    media: PAINT,
    short: "How intense or pure a color is, from vivid to muted gray. Also called chroma.",
    why: "Reserving your most saturated color for the focal point pulls the eye straight to it.",
    where: "Managed as you mix and layer in the wash and Refinement stages.",
  },
  {
    id: "color-temperature",
    term: "Color temperature",
    aliases: ["temperature", "colour temperature", "warm", "cool", "warm/cool", "warms", "cools", "warmth", "coolness"],
    media: PAINT,
    short: "How warm (toward red/yellow) or cool (toward blue) a color reads.",
    why: "Warm-cool contrast makes forms turn and pushes some areas forward, others back.",
    where: "Explored in the temperature overlay and throughout the wash stages.",
  },
  {
    id: "contrast",
    term: "Contrast",
    aliases: ["value contrast", "tonal contrast", "contrasts"],
    short: "The difference between areas — in value, color, temperature, or edge.",
    why: "The strongest contrast in the picture is where the eye goes first, so spend it wisely.",
    where: "Planned in the Value study and sharpened at the focal point during Refinement.",
  },

  // ---- Technique & application -------------------------------------------
  {
    id: "underpainting",
    term: "Underpainting",
    aliases: ["under-painting", "under painting"],
    media: OIL_ACRYLIC,
    short: "A first, simplified layer that maps values or color before the real painting.",
    why: "It settles composition and value early so later layers can focus on color and detail.",
    where: "Comparable to the first wash — establishing the plan before committing.",
  },
  {
    id: "glazing",
    term: "Glazing",
    aliases: ["glaze", "glazes", "glazed"],
    media: BRUSH_PAINT,
    short: "Laying a transparent layer over dry paint to shift its color or value.",
    why: "It lets you adjust and deepen passages without disturbing the layer beneath.",
    where: "A refinement technique in the Second wash and Refinement stages.",
  },
  {
    id: "impasto",
    term: "Impasto",
    media: OIL_ACRYLIC,
    short: "Thick, textured paint applied so brush or knife marks stand off the surface.",
    why: "It catches real light and adds physical energy — used for accents and highlights.",
    where: "An oil and acrylic technique; noted here only for comparison in other media.",
  },
  {
    id: "dry-brushing",
    term: "Dry brushing",
    aliases: ["dry brush", "drybrush", "dry-brush", "dry-brushed", "dry brushed"],
    media: BRUSH_PAINT,
    short: "Dragging a nearly dry brush so paint catches only the raised tooth of the paper.",
    why: "It creates broken, sparkling texture for sparkle on water, grass, or rough surfaces.",
    where: "Used for texture during the Refinement stage.",
  },
  {
    id: "alla-prima",
    term: "Alla prima",
    aliases: ["alla-prima", "wet-on-wet painting", "direct painting"],
    media: OIL_ACRYLIC,
    short: "Completing a painting in one sitting while the paint stays wet.",
    why: "It keeps color fresh and marks confident, rather than overworked.",
    where: "An oil and acrylic approach; referenced comparatively in other media.",
  },
  {
    id: "scumbling",
    term: "Scumbling",
    aliases: ["scumble", "scumbled"],
    media: ["oil", "acrylic", "pastel"],
    short: "Scrubbing a thin, broken layer of opaque, lighter paint over a dry darker one.",
    why: "It softens transitions and creates atmospheric, hazy effects.",
    where: "A refinement technique in opaque media.",
  },
  {
    id: "brushwork",
    term: "Brushwork",
    aliases: ["brush work", "mark-making", "mark making"],
    media: BRUSH_PAINT,
    short: "The character of your marks — their direction, size, pressure, and confidence.",
    why: "Descriptive brushwork can suggest form and texture in a single decisive stroke.",
    where: "Present in every painting stage; deliberate at Refinement.",
  },
  {
    id: "edges",
    term: "Edge control",
    aliases: ["edges", "edge", "hard edge", "soft edge", "lost edge", "hard edges", "soft edges", "lost edges"],
    short: "How two shapes meet — crisp (hard), gradual (soft), or dissolved (lost).",
    why: "Varying edges guides the eye and separates the focal point from quiet areas.",
    where: "The main craft of the Refinement stage.",
  },

  // ---- Studio habits & practice -----------------------------------------
  {
    id: "study",
    term: "Study",
    aliases: ["studies"],
    short: "A short, focused practice piece made to learn one thing, not to be a finished work.",
    why: "Studies are where skill is actually built — low stakes, high learning.",
    where: "The mindset behind every lesson: practice, not proof.",
  },
  {
    id: "blocking-in",
    term: "Blocking in",
    aliases: ["block in", "block-in", "blocked in", "blocking-in"],
    short: "Laying down the big shapes and values first, before any detail.",
    why: "It locks in proportion and composition while they are still easy to change.",
    where: "The heart of the Observation stage.",
  },
  {
    id: "visual-vocabulary",
    term: "Visual vocabulary",
    aliases: ["visual language"],
    short: "The growing set of shapes, marks, and solutions an artist can call on from memory.",
    why: "The more you practice, the more you can paint fluently instead of guessing.",
    where: "Built a little more with every study you complete.",
  },
  {
    id: "plein-air",
    term: "Plein air",
    aliases: ["plein-air", "plein air painting"],
    short: "Painting outdoors, directly from the subject and changing light.",
    why: "Working from life sharpens observation faster than working from photos alone.",
    where: "A practice habit to grow into once the stages feel familiar.",
  },
  {
    id: "thumbnail-sketch",
    term: "Thumbnail sketch",
    aliases: ["thumbnail", "thumbnails", "thumbnail sketches", "thumbnail studies"],
    short: "A small, quick sketch used to test composition and value before committing.",
    why: "A few thumbnails in minutes can save an hour spent on a weak composition.",
    where: "A planning habit that supports the Observation and Value study stages.",
  },

  // ---- Preserved core concepts ------------------------------------------
  {
    id: "notan",
    term: "Notan",
    short: "Massing a scene into a few flat values — a light-and-dark design.",
    why: "It tests whether your composition works as pure shapes before detail or color.",
    where: "Underlies the Value study stage.",
  },
  {
    id: "wash",
    term: "Wash",
    aliases: ["washes"],
    media: BRUSH_PAINT,
    short: "A thin, transparent layer of diluted paint spread over an area.",
    why: "Layered washes build luminous color while keeping the paper's light shining through.",
    where: "The core of the First wash and Second wash stages.",
  },
  {
    id: "wet-on-wet",
    term: "Wet-on-wet",
    aliases: ["wet-in-wet", "wet on wet", "wet in wet"],
    media: BRUSH_PAINT,
    short: "Applying paint into an already-wet area so colors bleed and blend softly.",
    why: "It creates soft transitions and atmospheric effects that are hard to fake later.",
    where: "Used heavily in the First wash stage.",
  },
  {
    id: "granulation",
    term: "Granulation",
    aliases: ["granulate", "granulating", "granulated"],
    media: ["watercolor"],
    short: "Pigment settling into the paper's texture for a speckled, grainy finish.",
    why: "It adds natural texture to skies, stone, and water when you let it happen.",
    where: "Preserved by handling washes gently in the wash stages.",
  },
  {
    id: "focal-point",
    term: "Focal point",
    aliases: ["focal points", "center of interest", "centre of interest"],
    short: "The place in the picture where the eye is meant to land first.",
    why: "Every choice of contrast, detail, and color should serve the focal point.",
    where: "Located in the Observation stage and sharpened at Refinement.",
  },
  {
    id: "composition",
    term: "Composition",
    aliases: ["compositions"],
    short: "How shapes, values, and space are arranged within the frame.",
    why: "Strong composition is what makes an image feel resolved and intentional.",
    where: "Set in the Observation stage and reviewed at the Finish.",
  },
  {
    id: "negative-space",
    term: "Negative space",
    aliases: ["negative shapes", "negative shape"],
    short: "The shapes formed around and between your subjects.",
    why: "Seeing negative shapes improves accuracy and balance more than drawing outlines.",
    where: "Used while blocking in during the Observation stage.",
  },
  {
    id: "proportion",
    term: "Proportion",
    aliases: ["proportions"],
    short: "The size and placement relationships between the parts of a subject.",
    why: "Getting proportion right first means you never fight a drawing that is 'off'.",
    where: "Established while blocking in during the Observation stage.",
  },
  {
    id: "gesture",
    term: "Gesture",
    short: "The overall movement or line of action running through a subject.",
    why: "Capturing gesture first keeps a painting alive rather than stiff.",
    where: "Felt out in the Observation stage.",
  },
  {
    id: "atmospheric-perspective",
    term: "Atmospheric perspective",
    aliases: ["aerial perspective"],
    short: "Distant things appear lighter, cooler, and less detailed than near things.",
    why: "It's the simplest, most reliable way to create depth in a landscape.",
    where: "Applied through the wash stages when depth matters.",
  },
  {
    id: "reserve-whites",
    term: "Reserving the whites",
    aliases: ["reserve the whites", "reserve whites", "reserving whites", "reserved whites", "save the whites"],
    media: ["watercolor"],
    short: "Leaving the paper unpainted for the very lightest lights.",
    why: "In transparent media the paper is your only true white — lost, it can't return.",
    where: "Planned in the Value study and protected through every wash.",
  },
  {
    id: "value-plan",
    term: "Value plan",
    aliases: ["value plans"],
    short: "A deliberate arrangement of lights, midtones, and darks before you paint.",
    why: "Deciding the value structure early keeps the finished piece unified and legible.",
    where: "Set during the Value study stage and checked again at the Finish.",
  },
  {
    id: "local-color",
    term: "Local color",
    aliases: ["local colour", "local colors", "local colours"],
    media: PAINT,
    short: "An object's actual color seen under neutral light, before light and shadow.",
    why: "Separating local color from the light on it keeps your color mixing clear-headed.",
    where: "Established during the Second wash stage.",
  },
  {
    id: "complementary",
    term: "Complementary colors",
    aliases: ["complementary", "complementary color", "complementary colour", "complementary colours", "complement", "complements"],
    media: PAINT,
    short: "Colors opposite each other on the wheel that neutralize when mixed.",
    why: "They mix rich neutrals and, placed side by side, make each other look brighter.",
    where: "Used when mixing grays and choosing accents in the wash stages.",
  },
  {
    id: "highlight",
    term: "Highlight",
    aliases: ["highlights"],
    short: "The lightest spot where light strikes a surface most directly.",
    why: "Well-placed highlights describe the form and the light source in one stroke.",
    where: "Reserved early and protected through every wash.",
  },
  {
    id: "midtone",
    term: "Midtone",
    aliases: ["midtones", "mid-tone", "mid-tones", "mid tone"],
    short: "The middle values that sit between the lights and the darks.",
    why: "Midtones do most of the describing; they carry the bulk of the form.",
    where: "Built deliberately in the Second wash stage.",
  },
  {
    id: "shadow",
    term: "Shadow",
    aliases: ["shadows", "core shadow", "cast shadow"],
    short: "Areas turned away from or blocked from the light source.",
    why: "Grouping shadows into clean shapes keeps the light reading convincingly.",
    where: "Massed in the Value study and deepened at Refinement.",
  },
  {
    id: "palette",
    term: "Palette",
    aliases: ["palettes", "limited palette"],
    media: PAINT,
    short: "The limited set of colors chosen for a painting.",
    why: "A limited palette almost guarantees color harmony across the whole piece.",
    where: "Chosen up front and shown beside each stage's mixing notes.",
  },
];

const byId = new Map<string, ArtTerm>(ART_TERMS.map((t) => [t.id, t]));
const orderIndex = new Map<string, number>(ART_TERMS.map((t, i) => [t.id, i]));

export function getTerm(id: string): ArtTerm | undefined {
  return byId.get(id);
}

// Each stage foregrounds one key concept, reinforced beneath its title.
export const STAGE_CONCEPT: Record<StageId, string> = {
  "pencil-sketch": "proportion",
  "value-study": "value",
  "first-wash": "wash",
  "second-wash": "local-color",
  refinement: "edges",
  finished: "composition",
};

// ---- Auto-linking prose -------------------------------------------------

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Longest aliases first so multi-word phrases win over their substrings.
const aliasEntries = ART_TERMS.flatMap((t) =>
  [t.term, ...(t.aliases ?? [])].map((alias) => ({ alias: alias.toLowerCase(), id: t.id })),
).sort((a, b) => b.alias.length - a.alias.length);

const aliasToId = new Map<string, string>(aliasEntries.map((e) => [e.alias, e.id]));
const matcher = new RegExp(`\\b(${aliasEntries.map((e) => escapeRegex(e.alias)).join("|")})\\b`, "gi");

export type Segment = { text: string; termId?: string };

/**
 * Split prose into segments, tagging the FIRST occurrence of each known term so
 * it can be made tappable. First-occurrence-only keeps prose readable rather
 * than turning every sentence into links.
 */
export function matchTerms(text: string, max = Infinity): Segment[] {
  if (!text) return [{ text: text ?? "" }];
  const segments: Segment[] = [];
  const seen = new Set<string>();
  let last = 0;
  let count = 0;
  matcher.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = matcher.exec(text)) !== null) {
    const id = aliasToId.get(m[0].toLowerCase());
    if (!id || seen.has(id) || count >= max) continue;
    if (m.index > last) segments.push({ text: text.slice(last, m.index) });
    segments.push({ text: m[0], termId: id });
    seen.add(id);
    count += 1;
    last = m.index + m[0].length;
  }
  if (last < text.length) segments.push({ text: text.slice(last) });
  return segments.length ? segments : [{ text }];
}

// ---- Lesson-aware concept selection ------------------------------------

// Count every occurrence of each known term across a body of text (used to
// judge which concepts a generated lesson actually emphasizes).
function countTerms(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  if (!text) return counts;
  matcher.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = matcher.exec(text)) !== null) {
    const id = aliasToId.get(m[0].toLowerCase());
    if (!id) continue;
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

function buildCorpus(t: Tutorial): string {
  return [
    t.title,
    t.overview,
    t.composition.focalPoint,
    t.composition.valuePlan,
    t.composition.lightDirection,
    ...t.composition.majorShapes,
    t.valueMap.lights,
    t.valueMap.midtones,
    t.valueMap.darks,
    t.valueMap.squintTest,
    ...t.palette.map((p) => `${p.role} ${p.mixingNote}`),
    ...t.creativeChoices,
    ...t.steps.flatMap((s) => [
      s.title,
      s.objective,
      s.instruction,
      s.technique,
      s.checkpoint,
      s.commonMistake,
      s.visualCue,
    ]),
    ...t.materials.map((mat) => `${mat.item} ${mat.purpose}`),
  ].join("  ");
}

// Foundational concepts used to pad the list if a lesson emphasizes very few.
const FALLBACK_CONCEPTS = ["value", "composition", "color-temperature", "edges", "proportion"];

function isRelevant(term: ArtTerm, medium: Medium): boolean {
  return !term.media || term.media.includes(medium);
}

/**
 * Choose 3–5 concepts that the generated lesson actually emphasizes, restricted
 * to the lesson's medium (so, e.g., impasto/alla prima never headline a
 * watercolor study). Ranked by how often each concept appears in the lesson.
 */
export function conceptsForLesson(
  tutorial: Tutorial,
  medium: Medium,
  opts?: { min?: number; max?: number },
): ArtTerm[] {
  const min = opts?.min ?? 3;
  const max = opts?.max ?? 5;
  const counts = countTerms(buildCorpus(tutorial));

  const chosen = ART_TERMS.filter((t) => isRelevant(t, medium))
    .map((t) => ({ t, n: counts.get(t.id) ?? 0 }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n || (orderIndex.get(a.t.id) ?? 0) - (orderIndex.get(b.t.id) ?? 0))
    .slice(0, max)
    .map((x) => x.t);

  if (chosen.length < min) {
    for (const id of FALLBACK_CONCEPTS) {
      if (chosen.length >= min) break;
      const t = byId.get(id);
      if (t && isRelevant(t, medium) && !chosen.some((c) => c.id === t.id)) chosen.push(t);
    }
  }

  return chosen.slice(0, max);
}
