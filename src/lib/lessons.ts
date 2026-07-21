"use client";

import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";

// Generation/image lifecycle of the reference asset.
export type LessonStatus = "generating" | "ready" | "error";

// The creative workflow status the artist moves a project through.
export type ProjectStatus = "not-started" | "in-progress" | "completed";

export const projectStatusLabels: Record<ProjectStatus, string> = {
  "not-started": "Not started",
  "in-progress": "In progress",
  completed: "Completed",
};

// Lightweight card model the dashboard lists. The heavy `tutorial` object is
// stored separately at `users/{uid}/projects/{id}/detail/tutorial` so listing
// never has to download it (the web SDK cannot field-mask reads).
export interface LessonSummary {
  id: string;
  userId: string;
  title: string;
  thumbnailUrl: string;
  imageUrl: string;
  medium: Medium;
  skillLevel: string;
  status: LessonStatus;
  projectStatus: ProjectStatus;
  favorite: boolean;
  collectionIds: string[];
  tags: string[];
  titleLower: string;
  createdAt: number | null;
  updatedAt: number | null;
  lastOpenedAt: number | null;
  // Visual Progression: per-stage AI images, indexed 0..5 to match the six
  // fixed stages. Empty in v1 (placeholders render); a later milestone writes
  // generated URLs here and the UI swaps automatically.
  progressionImages: string[];
  // --- Reserved for future milestones (persisted now, not yet surfaced in UI) ---
  notes: string;
  finishedImageUrl: string | null;
  aiCoachConversation: unknown[];
  completionPercentage: number;
}

export interface LessonDetail {
  summary: LessonSummary;
  tutorial: Tutorial | null;
}

function projectsCol(uid: string) {
  return collection(db, "users", uid, "projects");
}

function summaryRef(uid: string, id: string) {
  return doc(db, "users", uid, "projects", id);
}

function tutorialRef(uid: string, id: string) {
  return doc(db, "users", uid, "projects", id, "detail", "tutorial");
}

function toMillis(value: unknown): number | null {
  if (value && typeof (value as { toMillis?: () => number }).toMillis === "function") {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
}

// Tolerant of legacy documents that stored the tutorial inline and lacked the
// denormalized card fields.
function toSummary(snap: QueryDocumentSnapshot<DocumentData> | { id: string; data: () => DocumentData }): LessonSummary {
  const data = snap.data();
  const inlineTutorial = data.tutorial as Tutorial | undefined;
  return {
    id: snap.id,
    userId: data.userId ?? "",
    title: data.title ?? inlineTutorial?.title ?? "Untitled lesson",
    thumbnailUrl: data.thumbnailUrl ?? data.imageUrl ?? "",
    imageUrl: data.imageUrl ?? "",
    medium: (data.medium ?? "watercolor") as Medium,
    skillLevel: data.skillLevel ?? "beginner",
    status: (data.status ?? data.imageStatus ?? "ready") as LessonStatus,
    projectStatus: (data.projectStatus ?? "not-started") as ProjectStatus,
    favorite: Boolean(data.favorite),
    collectionIds: data.collectionIds ?? [],
    tags: data.tags ?? [],
    titleLower: data.titleLower ?? "",
    createdAt: toMillis(data.createdAt),
    updatedAt: toMillis(data.updatedAt),
    lastOpenedAt: toMillis(data.lastOpenedAt),
    progressionImages: Array.isArray(data.progressionImages) ? data.progressionImages : [],
    notes: data.notes ?? "",
    finishedImageUrl: data.finishedImageUrl ?? null,
    aiCoachConversation: data.aiCoachConversation ?? [],
    completionPercentage: data.completionPercentage ?? 0,
  };
}

export async function getRecentLessons(uid: string, max = 12): Promise<LessonSummary[]> {
  // The `userId` equality filter is required, not optional: the security rule
  // gates reads on `resource.data.userId == request.auth.uid`, and Firestore
  // rejects any list query that isn't provably constrained to match that rule.
  const snap = await getDocs(
    query(projectsCol(uid), where("userId", "==", uid), orderBy("updatedAt", "desc"), limit(max))
  );
  return snap.docs.map(toSummary);
}

export async function getLesson(uid: string, id: string): Promise<LessonDetail | null> {
  const summarySnap = await getDoc(summaryRef(uid, id));
  if (!summarySnap.exists()) return null;

  const data = summarySnap.data();
  let tutorial = (data.tutorial as Tutorial | undefined) ?? null;
  if (!tutorial) {
    const detailSnap = await getDoc(tutorialRef(uid, id));
    tutorial = detailSnap.exists() ? ((detailSnap.data().tutorial as Tutorial) ?? null) : null;
  }

  return { summary: toSummary(summarySnap), tutorial };
}

export async function createLesson(
  uid: string,
  input: { medium: Medium; skillLevel: string; tutorial: Tutorial }
): Promise<string> {
  const { medium, skillLevel, tutorial } = input;
  const created = await addDoc(projectsCol(uid), {
    userId: uid,
    title: tutorial.title,
    titleLower: tutorial.title.toLowerCase(),
    thumbnailUrl: "",
    imageUrl: "",
    medium,
    skillLevel,
    status: "generating" as LessonStatus,
    projectStatus: "not-started" as ProjectStatus,
    favorite: false,
    collectionIds: [],
    tags: [medium, skillLevel],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    lastOpenedAt: serverTimestamp(),
    // Reserved schema for upcoming milestones; kept consistent on every doc.
    progressionImages: [],
    notes: "",
    finishedImageUrl: null,
    aiCoachConversation: [],
    completionPercentage: 0,
  });

  await setDoc(tutorialRef(uid, created.id), { tutorial });
  return created.id;
}

export async function attachLessonImage(uid: string, id: string, imageUrl: string): Promise<void> {
  await updateDoc(summaryRef(uid, id), {
    imageUrl,
    thumbnailUrl: imageUrl,
    status: "ready" as LessonStatus,
    updatedAt: serverTimestamp(),
  });
}

export async function markLessonOpened(uid: string, id: string): Promise<void> {
  await updateDoc(summaryRef(uid, id), { lastOpenedAt: serverTimestamp() });
}

export async function setProjectStatus(uid: string, id: string, projectStatus: ProjectStatus): Promise<void> {
  await updateDoc(summaryRef(uid, id), { projectStatus, updatedAt: serverTimestamp() });
}

// Reserved for the upcoming Favorites feature.
export async function toggleFavorite(uid: string, id: string, favorite: boolean): Promise<void> {
  await updateDoc(summaryRef(uid, id), { favorite, updatedAt: serverTimestamp() });
}

export function formatLessonDate(ms: number | null): string {
  if (!ms) return "Just now";
  const diff = Date.now() - ms;
  const day = 86_400_000;
  if (diff < day) return "Today";
  if (diff < 2 * day) return "Yesterday";
  if (diff < 7 * day) return `${Math.floor(diff / day)} days ago`;
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function formatFullDate(ms: number | null): string {
  if (!ms) return "—";
  return new Date(ms).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" });
}
