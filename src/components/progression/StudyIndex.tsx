"use client";

import type { ProgressionStage } from "@/lib/progression";
import { StageProcessRail } from "@/components/progression/StageProcessRail";

export function StudyIndex({
  stages,
  active,
  visitedMax,
  onSelect,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  /** Kept for callers; process rail does not use photo thumbnails. */
  masterImageUrl?: string | null;
}) {
  return (
    <StageProcessRail
      className="study-index desk-nav"
      stages={stages}
      active={active}
      visitedMax={visitedMax}
      onSelect={onSelect}
    />
  );
}
