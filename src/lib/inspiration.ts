import type { Medium } from "@/lib/tutorial-schema";

export interface InspirationItem {
  id: string;
  title: string;
  medium: Medium;
  prompt: string;
  imageUrl: string;
}

// Original ArtPraxis reference imagery, created for this curated study gallery.
// Keep these assets local so the landing page is stable and privacy-preserving.
export const inspirationGallery: InspirationItem[] = [
  { id: "still-life", title: "Morning still life", medium: "watercolor", prompt: "Practice soft edges and reflected light.", imageUrl: "/images/inspiration/morning-still-life.webp" },
  { id: "portrait", title: "Window-light portrait", medium: "pastel", prompt: "Study value structure across the face.", imageUrl: "/images/inspiration/window-light-portrait.webp" },
  { id: "landscape", title: "Coastal landscape", medium: "oil", prompt: "Simplify the scene into three big shapes.", imageUrl: "/images/inspiration/coastal-landscape.webp" },
  { id: "florals", title: "Loose florals", medium: "acrylic", prompt: "Work warm against cool for depth.", imageUrl: "/images/inspiration/loose-florals.webp" },
  { id: "street", title: "Rainy street scene", medium: "acrylic", prompt: "Use shape and contrast to lead the eye.", imageUrl: "/images/inspiration/rainy-street.webp" },
  { id: "figure", title: "Gesture figure", medium: "charcoal", prompt: "Capture movement before detail.", imageUrl: "/images/inspiration/gesture-figure.webp" },
];
