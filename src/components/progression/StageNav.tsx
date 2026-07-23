"use client";

import type { ProgressionStage } from "@/lib/progression";
import { StageProcessRail } from "@/components/progression/StageProcessRail";

export function StageNav({
  stages,
  active,
  visitedMax,
  onSelect,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  masterImageUrl?: string | null;
}) {
  return (
    <StageProcessRail
      className="desk-nav"
      stages={stages}
      active={active}
      visitedMax={visitedMax}
      onSelect={onSelect}
    />
  );
}
