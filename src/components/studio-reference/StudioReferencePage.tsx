"use client";

import { StudioReferenceViewer } from "./StudioReferenceViewer";
import { useStudioComparePreference } from "./useStudioComparePreference";

/**
 * Full Studio Reference tab — image-led comparison surface.
 * Replaces the old documentation-style Reference page.
 */
export function StudioReferencePage({
  referenceUrl,
  finalPaintingUrl,
  title,
}: {
  referenceUrl?: string | null;
  finalPaintingUrl?: string | null;
  title: string;
}) {
  const { mode, setMode } = useStudioComparePreference("both");

  return (
    <div className="studio-ref-page">
      <header className="studio-ref-page-head">
        <p className="studio-ref-kicker">Studio Reference</p>
        <h2 className="studio-ref-page-title">Reference &amp; Final Painting</h2>
      </header>

      <StudioReferenceViewer
        referenceUrl={referenceUrl}
        finalPaintingUrl={finalPaintingUrl}
        title={title}
        mode={mode}
        onModeChange={setMode}
        size="page"
      />
    </div>
  );
}
