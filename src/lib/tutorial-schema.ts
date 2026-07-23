import { z } from "zod";

export const mediumSchema = z.enum([
  "watercolor", "acrylic", "oil", "pastel", "charcoal", "pencil", "pen"
]);

const pointSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100)
});

const boxSchema = z.object({
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  label: z.string()
});

/** Canonical Material — single source of truth for tutorials + stage generation. */
export const materialSchema = z.object({
  item: z.string().min(1),
  purpose: z.string().min(1),
  required: z.boolean().default(true),
  /** Lesson-provided image (local path or absolute URL), or empty when none. */
  imageUrl: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => v ?? ""),
  /** Size/weight/etc. when not embedded in `item`, or empty when none. */
  specification: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => v ?? ""),
  quantity: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) => (typeof v === "string" && v.trim() ? v : "As needed")),
  substitution: z
    .union([z.string(), z.null()])
    .optional()
    .transform((v) =>
      typeof v === "string" && v.trim()
        ? v
        : "Use a comparable artist-grade alternative",
    ),
});

export type Material = z.infer<typeof materialSchema>;

export const tutorialSchema = z.object({
  title: z.string(),
  overview: z.string(),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  estimatedMinutes: z.number().int().positive(),
  composition: z.object({
    focalPoint: z.string(),
    majorShapes: z.array(z.string()).min(2).max(8),
    valuePlan: z.string(),
    lightDirection: z.string()
  }),
  visualGuides: z.object({
    focalPoint: pointSchema.extend({ label: z.string() }),
    lightArrow: z.object({ start: pointSchema, end: pointSchema, label: z.string() }),
    regions: z.array(boxSchema.extend({
      type: z.enum(["major-shape", "shadow", "midtone", "highlight", "warm", "cool"])
    })).min(3).max(10),
    suggestedCrop: boxSchema.nullable()
  }),
  valueMap: z.object({
    lights: z.string(),
    midtones: z.string(),
    darks: z.string(),
    squintTest: z.string()
  }),
  materials: z.array(materialSchema),
  palette: z.array(z.object({
    name: z.string(),
    hex: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
    role: z.string(),
    mixingNote: z.string(),
    ratio: z.string()
  })).min(3).max(8),
  creativeChoices: z.array(z.string()).min(2).max(6),
  steps: z.array(z.object({
    order: z.number().int().positive(),
    title: z.string(),
    objective: z.string(),
    instruction: z.string(),
    technique: z.string(),
    checkpoint: z.string(),
    commonMistake: z.string(),
    estimatedMinutes: z.number().int().positive(),
    focusBox: boxSchema.nullable(),
    paletteNames: z.array(z.string()).max(5),
    visualCue: z.string()
  })).min(6).max(10)
});

export type Medium = z.infer<typeof mediumSchema>;
export type Tutorial = z.infer<typeof tutorialSchema>;

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function readBoolean(value: unknown, fallback: boolean): boolean {
  return typeof value === "boolean" ? value : fallback;
}

const MATERIAL_KEYS = [
  "item",
  "purpose",
  "required",
  "imageUrl",
  "specification",
  "quantity",
  "substitution",
] as const;

function pickStringField(
  raw: Record<string, unknown>,
  key: string,
  whenMissing: string,
  whenNull: string = whenMissing,
): string {
  if (!(key in raw) || raw[key] === undefined) return whenMissing;
  if (raw[key] === null) return whenNull;
  if (typeof raw[key] === "string") return raw[key];
  return whenMissing;
}

/**
 * Ensure every material matches the canonical Material schema.
 * Accepts legacy aliases (`name` → item, `category` → purpose hint).
 */
export function normalizeMaterial(material: unknown, index: number): Material {
  const raw = asRecord(material) ?? {};
  const missingFields: string[] = [];

  for (const key of MATERIAL_KEYS) {
    if (!(key in raw) || raw[key] === undefined) {
      if (key === "item" && readTrimmedString(raw.name)) continue;
      if (key === "purpose" && readTrimmedString(raw.category)) continue;
      missingFields.push(key);
    }
  }

  const item =
    readTrimmedString(raw.item) ??
    readTrimmedString(raw.name) ??
    `Material ${index + 1}`;

  const purpose =
    readTrimmedString(raw.purpose) ??
    readTrimmedString(raw.category) ??
    "Other";

  const imageUrl = pickStringField(raw, "imageUrl", "", "");
  const specification = pickStringField(
    raw,
    "specification",
    `Standard artist-grade ${item}`,
    "",
  );
  const quantity = pickStringField(raw, "quantity", "As needed", "As needed");
  const substitution = pickStringField(
    raw,
    "substitution",
    "Use a comparable artist-grade alternative",
    "Use a comparable artist-grade alternative",
  );
  const required = readBoolean(raw.required, true);

  if (missingFields.length > 0) {
    console.warn("[tutorial-materials] normalized incomplete material", {
      index,
      name: item,
      missingFields,
    });
  }

  return {
    item,
    purpose,
    required,
    imageUrl,
    specification,
    quantity,
    substitution,
  };
}

/** Normalize materials on a tutorial without re-validating the full document. */
export function withNormalizedMaterials<T extends { materials?: unknown }>(tutorial: T): T & { materials: Material[] } {
  const materialsRaw = Array.isArray(tutorial.materials) ? tutorial.materials : [];
  return {
    ...tutorial,
    materials: materialsRaw.map((m, i) => normalizeMaterial(m, i)),
  };
}

/** Normalize every material, then validate the full tutorial against the schema. */
export function normalizeTutorial(tutorial: unknown): Tutorial {
  const raw = asRecord(tutorial);
  if (!raw) {
    throw new Error("Tutorial payload is missing or invalid.");
  }
  return tutorialSchema.parse(withNormalizedMaterials(raw as { materials?: unknown }));
}

/**
 * Defensive normalize for API request bodies that embed a `tutorial` field.
 * Leaves non-tutorial keys untouched; only repairs materials (and coerces tutorial).
 */
export function normalizeTutorialInput<T extends Record<string, unknown>>(input: T): T {
  if (!("tutorial" in input) || input.tutorial == null) {
    return input;
  }

  const tutorialRaw = asRecord(input.tutorial);
  if (!tutorialRaw) {
    return input;
  }

  const materialsRaw = Array.isArray(tutorialRaw.materials) ? tutorialRaw.materials : [];
  const materials = materialsRaw.map((m, i) => normalizeMaterial(m, i));

  return {
    ...input,
    tutorial: {
      ...tutorialRaw,
      materials,
    },
  };
}
