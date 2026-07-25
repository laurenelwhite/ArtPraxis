import { mediumSchema, type Medium } from "@/lib/tutorial-schema";

// Canonical ordering used by the medium selector and welcome email.
export const MEDIA: Medium[] = [
  "watercolor",
  "acrylic",
  "oil",
  "pastel",
  "charcoal",
];

// Human-facing display names (American English). "pen" reads as "Pen & Ink".
export const MEDIUM_LABEL: Record<Medium, string> = {
  watercolor: "Watercolor",
  acrylic: "Acrylic",
  oil: "Oil",
  pastel: "Pastel",
  charcoal: "Charcoal",
  pencil: "Pencil",
  pen: "Pen",
};

// Medium-specific page heading shown when the user deep-links from the
// welcome email (e.g. "Start your charcoal study").
export const MEDIUM_HEADING: Record<Medium, string> = {
  watercolor: "Start your watercolor lesson",
  acrylic: "Start your acrylic study",
  oil: "Start your oil study",
  pastel: "Start your pastel study",
  charcoal: "Start your charcoal study",
  pencil: "Start your pencil study",
  pen: "Start your pen study",
};

// Short invitations reused as the email banner call-to-action text.
export const MEDIUM_INVITATION: Record<Medium, string> = {
  watercolor: "Explore watercolor",
  acrylic: "Begin an acrylic study",
  oil: "Begin an oil study",
  pastel: "Explore pastel",
  charcoal: "Start with charcoal",
  pencil: "Start with pencil",
  pen: "Draw with pen",
};

/**
 * Validate an arbitrary query value against the supported medium enum.
 * Returns the normalized Medium, or null for missing/invalid input so
 * callers can ignore bad values safely.
 */
export function parseMedium(value: string | null | undefined): Medium | null {
  if (!value) return null;
  const result = mediumSchema.safeParse(value.trim().toLowerCase());
  return result.success ? result.data : null;
}
