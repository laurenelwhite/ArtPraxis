"use client";

import { useCallback, useState } from "react";
import type { ProgressionStage, StageId } from "@/lib/progression";
import { StageProgressIcon } from "@/components/progression/StageProgressIcon";

/**
 * Compact visual lesson stepper — shared by Study and Paint modes.
 * Reuses existing stage.visual.url + masterImageUrl; never generates images.
 */
export function StageProgressStepper({
  stages,
  active,
  visitedMax,
  onSelect,
  masterImageUrl,
  className,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  masterImageUrl?: string | null;
  className?: string;
}) {
  const [previewId, setPreviewId] = useState<StageId | null>(null);

  const closePreview = useCallback(() => setPreviewId(null), []);

  // visitedMax retained for API parity with prior nav (selection rules unchanged).
  void visitedMax;

  return (
    <nav className={className ?? "stage-progress-stepper"} aria-label="Lesson stages">
      <ol className="stage-progress-track">
        {stages.map((stage, index) => {
          const isActive = index === active;
          return (
            <li key={stage.id} className="stage-progress-li">
              <StageProgressIcon
                stage={stage}
                isActive={isActive}
                masterImageUrl={masterImageUrl}
                previewOpen={previewId === stage.id}
                onOpenPreview={() => setPreviewId(stage.id)}
                onClosePreview={closePreview}
                onSelect={() => onSelect(index)}
              />
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
