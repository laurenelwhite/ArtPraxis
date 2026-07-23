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
  materials: z.array(z.object({
    item: z.string(),
    purpose: z.string(),
    required: z.boolean(),
    /** Lesson-provided image (local path or absolute URL), or null when none. */
    imageUrl: z.string().nullable(),
    /** Size/weight/etc. when not embedded in `item`, or null when none. */
    specification: z.string().nullable(),
    quantity: z.string().nullable(),
    substitution: z.string().nullable(),
  })),
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
