import type { Medium } from "@/lib/tutorial-schema";

export interface InspirationItem {
  id: string;
  title: string;
  medium: Medium;
  prompt: string;
  imageUrl: string;
}

// Placeholder imagery sourced from picsum.photos so the gallery renders without
// external configuration. Replace with licensed, curated reference art before launch.
export const inspirationGallery: InspirationItem[] = [
  { id: "still-life", title: "Morning still life", medium: "watercolor", prompt: "Practice soft edges and reflected light.", imageUrl: "https://picsum.photos/seed/artpraxis-stilllife/640/480" },
  { id: "portrait", title: "Window-light portrait", medium: "pencil", prompt: "Study value structure across the face.", imageUrl: "https://picsum.photos/seed/artpraxis-portrait/640/480" },
  { id: "landscape", title: "Coastal landscape", medium: "oil", prompt: "Simplify the scene into three big shapes.", imageUrl: "https://picsum.photos/seed/artpraxis-landscape/640/480" },
  { id: "florals", title: "Loose florals", medium: "acrylic", prompt: "Work warm against cool for depth.", imageUrl: "https://picsum.photos/seed/artpraxis-florals/640/480" },
  { id: "street", title: "Rainy street scene", medium: "pen", prompt: "Use line weight to lead the eye.", imageUrl: "https://picsum.photos/seed/artpraxis-street/640/480" },
  { id: "figure", title: "Gesture figure", medium: "charcoal", prompt: "Capture movement before detail.", imageUrl: "https://picsum.photos/seed/artpraxis-figure/640/480" },
];
