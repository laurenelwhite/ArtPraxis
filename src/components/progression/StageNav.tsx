"use client";

import type { ProgressionStage } from "@/lib/progression";
import { StageProgressStepper } from "@/components/progression/StageProgressStepper";

export function StageNav({
  stages,
  active,
  visitedMax,
  onSelect,
  masterImageUrl,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  masterImageUrl?: string | null;
}) {
  return (
    <StageProgressStepper
      className="desk-nav stage-progress-stepper"
      stages={stages}
      active={active}
      visitedMax={visitedMax}
      onSelect={onSelect}
      masterImageUrl={masterImageUrl}
    />
  );
}
