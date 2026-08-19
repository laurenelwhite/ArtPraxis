/** Comparison display modes for Studio Reference (Reference Photo ↔ Final Painting). */
export type StudioCompareMode =
  | "both"
  | "overlay"
  | "reference"
  | "final";

export type StudioReferenceSize = "dock" | "panel" | "page" | "fullscreen";

export const STUDIO_COMPARE_OPTIONS: {
  value: StudioCompareMode;
  label: string;
}[] = [
  { value: "both", label: "Side by side" },
  { value: "overlay", label: "Overlay" },
  { value: "reference", label: "Reference only" },
  { value: "final", label: "Final painting only" },
];

export const STUDIO_COMPARE_STORAGE_KEY = "artpraxis.studioReference.compareMode";
