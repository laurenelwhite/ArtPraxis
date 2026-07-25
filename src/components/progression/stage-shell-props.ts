import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage, StageId } from "@/lib/progression";
import type { CompareMode } from "@/components/progression/StageComparison";

/**
 * Shared prop bag for Study and Paint stage shells / comparison.
 * Mode-specific fields (sticky refs, completion slots) stay on each shell.
 */
export type StageShellBaseProps = {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  /** Accepted final painting — always available as teaching companion. */
  masterImageUrl?: string | null;
  onRetry?: (stageId: StageId) => void;
  retrying?: boolean;
  onOpenMaterials?: (materialId?: string) => void;
};

export type StageModeBaseProps = {
  stages: ProgressionStage[];
  tutorial: Tutorial;
  medium: Medium;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  masterImageUrl?: string | null;
  onRetryStage?: (stageId: StageId) => void;
  retryingStage?: StageId | null;
  onOpenMaterials?: (materialId?: string) => void;
};
