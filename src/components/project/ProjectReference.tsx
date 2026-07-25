import type { LessonSummary } from "@/lib/lessons";
import type { GenerationStatus } from "@/lib/progression";
import { StudioReferencePage } from "@/components/studio-reference";

/**
 * @deprecated Prefer StudioReferencePage. Compatibility wrapper for the old Reference tab API.
 */
export function ProjectReference({
  summary,
  masterImageUrl = null,
  masterStatus = "pending",
}: {
  summary: LessonSummary;
  masterImageUrl?: string | null;
  masterStatus?: GenerationStatus;
}) {
  const showMaster =
    Boolean(masterImageUrl) &&
    (masterStatus === "ready" || masterStatus === "needsReview");

  return (
    <StudioReferencePage
      referenceUrl={summary.imageUrl}
      finalPaintingUrl={showMaster ? masterImageUrl : null}
      title={summary.title}
    />
  );
}
