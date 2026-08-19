import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { withNormalizedMaterials } from "@/lib/tutorial-schema";
import { MEDIUM_LABEL } from "@/lib/media";

/** Checklist for new-lesson wait — concurrent study + studio prep, then persist + open. */
export const CREATOR_WAIT_PIPELINE = [
  { id: "study", label: "Studying your reference" },
  { id: "prepare", label: "Preparing your studio" },
  { id: "build", label: "Building your lesson" },
  { id: "open", label: "Opening your studio" },
] as const;

export function provisionalLessonTitle(medium: Medium): string {
  return `New ${MEDIUM_LABEL[medium].toLowerCase()} lesson`;
}

export function creatorStepIndex(status: string): number {
  const s = status.toLowerCase();
  if (s.includes("opening")) return 3;
  if (s.includes("building your lesson")) return 2;
  if (s.includes("preparing your studio")) return 1;
  return 0;
}

/** Firestore project fields for a generating lesson shell (timestamps added by caller). */
export function buildLessonShellFields(
  uid: string,
  input: { medium: Medium; skillLevel: string },
) {
  const title = provisionalLessonTitle(input.medium);
  return {
    userId: uid,
    title,
    titleLower: title.toLowerCase(),
    thumbnailUrl: "",
    imageUrl: "",
    medium: input.medium,
    skillLevel: input.skillLevel,
    status: "generating" as const,
    projectStatus: "not-started" as const,
    favorite: false,
    collectionIds: [] as string[],
    tags: [input.medium, input.skillLevel],
    progressionImages: [] as string[],
    notes: "",
    finishedImageUrl: null as string | null,
    aiCoachConversation: [] as unknown[],
    completionPercentage: 0,
    brandAccent: null as string | null,
    brandTheme: null,
  };
}

export function normalizedTutorialWithTitle(tutorial: Tutorial) {
  const normalized = withNormalizedMaterials(tutorial);
  return {
    tutorial: normalized,
    title: normalized.title,
    titleLower: normalized.title.toLowerCase(),
  };
}

export type CreatorGenerationTimings = {
  shellCreationMs: number;
  fileToDataUrlMs: number;
  tutorialApiMs: number;
  referenceUploadMs: number;
  tutorialPersistMs: number;
  referenceAttachMs: number;
  progressionInitMs: number;
  totalCreatorMs: number;
  analysisOriginalBytes?: number;
  analysisEncodedBytes?: number;
  analysisOutputWidth?: number;
  analysisOutputHeight?: number;
};

export function creatorGenerationTimingLog(input: {
  projectId: string | null;
  medium: string;
  skillLevel: string;
  fileBytes: number;
  selectedOutputImageSize: string | null;
  failedBranches?: string[];
  timings: CreatorGenerationTimings;
}): Record<string, unknown> {
  return {
    scope: "LessonCreator",
    event: "creator_generation_timing",
    projectId: input.projectId,
    medium: input.medium,
    skillLevel: input.skillLevel,
    fileBytes: input.fileBytes,
    selectedOutputImageSize: input.selectedOutputImageSize,
    failedBranches: input.failedBranches ?? [],
    ...input.timings,
    t: Date.now(),
  };
}
