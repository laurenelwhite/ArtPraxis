/**
 * Centralized material imagery + category helpers for the Materials tab.
 * Prefer curated local illustrations over remote product photos.
 */

export type MaterialImageKind =
  | "round-brush"
  | "flat-brush"
  | "mop-brush"
  | "detail-brush"
  | "watercolor-paper"
  | "canvas"
  | "watercolor-tube"
  | "mixing-palette"
  | "pencil"
  | "eraser"
  | "water-container"
  | "paper-towel"
  | "masking-tape"
  | "generic-supply";

export type MaterialCategoryId =
  | "paints"
  | "brushes"
  | "surface"
  | "drawing-setup"
  | "optional";

export const MATERIAL_CATEGORY_LABELS: Record<MaterialCategoryId, string> = {
  paints: "Paints and colors",
  brushes: "Brushes",
  surface: "Surface",
  "drawing-setup": "Drawing and setup tools",
  optional: "Optional supplies",
};

export const MATERIAL_CATEGORY_ORDER: MaterialCategoryId[] = [
  "paints",
  "brushes",
  "surface",
  "drawing-setup",
  "optional",
];

const ASSET: Record<MaterialImageKind, string> = {
  "round-brush": "/materials/round-brush.svg",
  "flat-brush": "/materials/flat-brush.svg",
  "mop-brush": "/materials/mop-brush.svg",
  "detail-brush": "/materials/detail-brush.svg",
  "watercolor-paper": "/materials/watercolor-paper.svg",
  canvas: "/materials/canvas.svg",
  "watercolor-tube": "/materials/watercolor-tube.svg",
  "mixing-palette": "/materials/mixing-palette.svg",
  pencil: "/materials/pencil.svg",
  eraser: "/materials/eraser.svg",
  "water-container": "/materials/water-container.svg",
  "paper-towel": "/materials/paper-towel.svg",
  "masking-tape": "/materials/masking-tape.svg",
  "generic-supply": "/materials/generic-supply.svg",
};

const CATEGORY_FALLBACK: Record<MaterialCategoryId, MaterialImageKind> = {
  paints: "watercolor-tube",
  brushes: "round-brush",
  surface: "watercolor-paper",
  "drawing-setup": "pencil",
  optional: "generic-supply",
};

export type ResolvableMaterial = {
  item: string;
  purpose?: string;
  required?: boolean;
  imageUrl?: string | null;
  /** When set, used for category-level fallback (e.g. paints). */
  categoryHint?: MaterialCategoryId;
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();
}

/** Map a freeform material name to a curated illustration kind. */
export function resolveMaterialKind(item: string): MaterialImageKind | null {
  const t = normalize(item);

  if (/\bmop\b/.test(t)) return "mop-brush";
  if (/\b(flat|bright|wash brush)\b/.test(t)) return "flat-brush";
  if (/\b(rigger|liner|detail|script|spotter|#?\s*[1-4]\b.*brush|brush.*#?\s*[1-4]\b)\b/.test(t)) {
    return "detail-brush";
  }
  if (/\b(round|filbert)\b/.test(t) || /\bbrush\b/.test(t)) return "round-brush";

  if (/\b(canvas|linen|panel board|gesso board)\b/.test(t)) return "canvas";
  if (/\b(paper|cold[-\s]?press|hot[-\s]?press|pad|block|watercolor block)\b/.test(t)) {
    return "watercolor-paper";
  }

  if (/\b(tube|paint|pigment|gouache|watercolor|acrylic|oil color|cadmium|ultramarine|ochre|sienna|sap green|lemon yellow)\b/.test(t)) {
    return "watercolor-tube";
  }

  if (/\b(mixing palette|palette\b|well palette|butcher tray)\b/.test(t) && !/\bpaint\b/.test(t)) {
    return "mixing-palette";
  }

  if (/\b(kneaded|eraser|putty rubber)\b/.test(t)) return "eraser";
  if (/\b(pencil|graphite|hb|2b|4b|charcoal stick)\b/.test(t)) return "pencil";

  if (/\b(water (cup|jar|pot|container|bucket)|rinse|container)\b/.test(t)) {
    return "water-container";
  }
  if (/\b(paper towel|kitchen towel|rag|cloth)\b/.test(t)) return "paper-towel";
  if (/\b(masking tape|artist.?s tape|washi|painter.?s tape)\b/.test(t)) {
    return "masking-tape";
  }

  return null;
}

export function classifyMaterialCategory(
  item: string,
  required = true,
  hint?: MaterialCategoryId,
): MaterialCategoryId {
  if (!required) return "optional";
  if (hint === "paints") return "paints";

  const t = normalize(item);
  const kind = resolveMaterialKind(item);

  if (
    kind === "round-brush" ||
    kind === "flat-brush" ||
    kind === "mop-brush" ||
    kind === "detail-brush"
  ) {
    return "brushes";
  }
  if (kind === "watercolor-paper" || kind === "canvas") return "surface";
  if (kind === "watercolor-tube" || /\bpaint|pigment|tube\b/.test(t)) return "paints";
  return "drawing-setup";
}

/**
 * Image priority:
 * 1) material.imageUrl
 * 2) curated local map by name/type
 * 3) category illustration fallback
 * 4) generic-supply
 */
export function resolveMaterialImage(material: ResolvableMaterial): {
  src: string;
  kind: MaterialImageKind;
  source: "provided" | "curated" | "category" | "generic";
} {
  const provided = material.imageUrl?.trim();
  if (provided) {
    return {
      src: provided,
      kind: resolveMaterialKind(material.item) ?? "generic-supply",
      source: "provided",
    };
  }

  const curated = resolveMaterialKind(material.item);
  if (curated) {
    return { src: ASSET[curated], kind: curated, source: "curated" };
  }

  const category = classifyMaterialCategory(
    material.item,
    material.required !== false,
    material.categoryHint,
  );
  const fallback = CATEGORY_FALLBACK[category];
  if (fallback && fallback !== "generic-supply") {
    return { src: ASSET[fallback], kind: fallback, source: "category" };
  }

  return {
    src: ASSET["generic-supply"],
    kind: "generic-supply",
    source: "generic",
  };
}

/** Split a freeform item into display name + short specification when possible. */
export function parseMaterialLabel(
  item: string,
  specification?: string | null,
): {
  name: string;
  specification?: string;
} {
  const explicit = specification?.trim();
  if (explicit) {
    return { name: item.trim(), specification: explicit };
  }

  const raw = item.trim();
  const comma = raw.match(/^(.+?),\s*(.+)$/);
  if (comma) {
    return { name: comma[1].trim(), specification: comma[2].trim() };
  }

  const sizeHash = raw.match(/^(.+?)\s+(#\s*\d[\d–\-]*|\bsize\s*\d+)\s*$/i);
  if (sizeHash) {
    return { name: sizeHash[1].trim(), specification: sizeHash[2].replace(/\s+/g, " ") };
  }

  const lb = raw.match(/^(.+?)\s+(\d+\s*lb\b.*)$/i);
  if (lb) {
    return { name: lb[1].trim(), specification: lb[2].trim() };
  }

  return { name: raw };
}
