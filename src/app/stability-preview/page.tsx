import { notFound } from "next/navigation";
import StabilityPreviewClient from "./StabilityPreviewClient";

export default function StabilityPreviewPage() {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }
  return <StabilityPreviewClient />;
}
