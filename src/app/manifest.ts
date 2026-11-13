import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ArtPraxis",
    short_name: "ArtPraxis",
    description:
      "Personalized painting lessons built around deliberate practice.",
    start_url: "/",
    display: "standalone",
    background_color: "#F2ECE3",
    theme_color: "#F2ECE3",
    icons: [
      {
        src: "/brand/artpraxis-mark.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
