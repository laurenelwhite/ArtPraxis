/**
 * Dev-only visual preview for ArtPraxisDotLoader.
 * Not imported by any production route — open in isolation or Storybook later.
 */
import { ArtPraxisDotLoader } from "@/components/ui/ArtPraxisDotLoader";

export function ArtPraxisDotLoaderDemo() {
  return (
    <div
      className="ap-dot-loader-demo"
      style={{
        display: "grid",
        gap: 32,
        padding: 40,
        background: "#F7F5F2",
        justifyItems: "center",
      }}
    >
      <ArtPraxisDotLoader size="small" />
      <ArtPraxisDotLoader size="medium" />
    </div>
  );
}
