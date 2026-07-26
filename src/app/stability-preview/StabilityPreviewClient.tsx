"use client";

import { useMemo, useState } from "react";
import { LessonShell } from "@/components/shell/LessonShell";
import { StudyMode } from "@/components/progression/StudyMode";
import { ProjectOverview } from "@/components/project/ProjectOverview";
import { ProgressUpload } from "@/components/progression/ProgressUpload";
import { TermBudgetProvider } from "@/components/vocabulary/TermBudget";
import { buildProgression } from "@/lib/progression";
import { normalizeTutorial, type Tutorial } from "@/lib/tutorial-schema";
import type { LessonSummary } from "@/lib/lessons";
import type { CompareMode } from "@/components/progression/StageComparison";

const TABS = [
  { id: "overview", label: "Overview" },
  { id: "lesson", label: "Lesson" },
  { id: "reference", label: "Studio Reference" },
  { id: "materials", label: "Materials" },
  { id: "progress", label: "Progress" },
] as const;

/** Deterministic SVG placeholder — keeps layout stable without network images. */
const PLACEHOLDER =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
      <rect width="800" height="600" fill="#F2ECE3"/>
      <rect x="80" y="60" width="640" height="480" fill="#E6DDD0" stroke="#2C3E56" stroke-width="2"/>
      <text x="400" y="310" text-anchor="middle" fill="#2C3E56" font-family="Georgia, serif" font-size="28">Reference</text>
    </svg>`,
  );

function fixtureTutorial(): Tutorial {
  return normalizeTutorial({
    title: "Stability preview still life",
    overview:
      "A compact watercolor study used to verify lesson chrome, stage navigation, and responsive layout.",
    difficulty: "beginner",
    estimatedMinutes: 45,
    composition: {
      focalPoint: "Ceramic bowl",
      majorShapes: ["bowl", "cloth", "fruit"],
      valuePlan: "Light from the left, deep shadow under the bowl",
      lightDirection: "From upper left",
    },
    visualGuides: {
      focalPoint: { x: 50, y: 42, label: "Focus" },
      lightArrow: { start: { x: 12, y: 12 }, end: { x: 38, y: 36 }, label: "Light" },
      regions: [
        { x: 18, y: 20, width: 28, height: 30, label: "Bowl", type: "major-shape" },
        { x: 48, y: 48, width: 24, height: 18, label: "Shadow", type: "shadow" },
        { x: 62, y: 22, width: 16, height: 14, label: "Highlight", type: "highlight" },
      ],
      suggestedCrop: null,
    },
    valueMap: {
      lights: "Rim highlights",
      midtones: "Cloth folds",
      darks: "Cast shadow",
      squintTest: "Masses hold",
    },
    materials: [
      {
        item: "Round brush, size 10",
        purpose: "Washes",
        required: true,
        imageUrl: "",
        specification: "Synthetic",
        quantity: "1",
        substitution: "Any mid-size round",
      },
      {
        item: "Ultramarine",
        purpose: "Cool passages",
        required: true,
        imageUrl: "",
        specification: "",
        quantity: "As needed",
        substitution: "Cobalt blue",
      },
    ],
    palette: [
      { name: "Ultramarine", hex: "#1F3A93", role: "Cool", mixingNote: "Thin wash", ratio: "1:4" },
      { name: "Burnt Sienna", hex: "#A0522D", role: "Warm", mixingNote: "Earth", ratio: "neat" },
      { name: "Yellow Ochre", hex: "#C7A84A", role: "Earth", mixingNote: "Mute", ratio: "touch" },
    ],
    creativeChoices: ["Simplify background", "Keep edges soft", "Reserve lights"],
    steps: Array.from({ length: 6 }, (_, i) => ({
      order: i + 1,
      title: `Stage ${i + 1}`,
      objective: "Build the study with clear values and restrained color.",
      instruction:
        "Work from large shapes to smaller accents. Keep washes transparent and check the reference often.",
      technique: "Wash",
      checkpoint: "Values still read when you squint.",
      commonMistake: "Going dark too early.",
      estimatedMinutes: 8,
      focusBox: null,
      paletteNames: ["Ultramarine", "Burnt Sienna"],
      visualCue: "Soft edges on the shadow side",
    })),
  });
}

const summary: LessonSummary = {
  id: "stability-preview",
  userId: "stability",
  title: "Stability preview still life",
  medium: "watercolor",
  skillLevel: "beginner",
  status: "ready",
  projectStatus: "in-progress",
  imageUrl: PLACEHOLDER,
  thumbnailUrl: PLACEHOLDER,
  favorite: false,
  collectionIds: [],
  tags: [],
  titleLower: "stability preview still life",
  createdAt: Date.now() - 86_400_000,
  updatedAt: Date.now(),
  lastOpenedAt: Date.now(),
  progressionImages: [],
  notes: "",
  finishedImageUrl: null,
  aiCoachConversation: [],
  completionPercentage: 40,
  brandAccent: null,
  brandTheme: null,
};

/** Auth-free layout harness for stability screenshots (dev only). */
export default function StabilityPreviewClient() {
  const tutorial = useMemo(() => fixtureTutorial(), []);
  const stages = useMemo(
    () => buildProgression(tutorial, PLACEHOLDER, "watercolor", []),
    [tutorial],
  );
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("overview");
  const [compare, setCompare] = useState<CompareMode>("both");
  const [status, setStatus] = useState(summary.projectStatus);

  return (
    <div className="app-shell">
      <header className="app-header" aria-label="Preview header">
        <div className="app-header-brand">
          <span className="app-header-user">ArtPraxis stability preview</span>
        </div>
      </header>
      <div className="app-main app-main--lesson" id="app-main" data-scroll-root="app">
        <LessonShell
          title={summary.title}
          eyebrow={
            <>
              <span className="capitalize">{summary.medium}</span>
              {" · "}
              <span className="capitalize">{summary.skillLevel}</span>
              {" · About 45 min"}
            </>
          }
          tabs={TABS}
          activeTab={tab}
          onTabChange={(id) => setTab(id as (typeof TABS)[number]["id"])}
        >
          <div hidden={tab !== "overview"} className="project-panel">
            <ProjectOverview
              summary={{ ...summary, projectStatus: status }}
              tutorial={tutorial}
              status={status}
              masterImageUrl={PLACEHOLDER}
              onBeginStudy={() => setTab("lesson")}
            />
          </div>

          <div hidden={tab !== "lesson"} className="project-panel">
            <TermBudgetProvider>
              <StudyMode
                stages={stages}
                tutorial={tutorial}
                medium="watercolor"
                compare={compare}
                onCompareChange={setCompare}
                referenceUrl={PLACEHOLDER}
                masterImageUrl={PLACEHOLDER}
                projectStatus={status}
              />
            </TermBudgetProvider>
          </div>

          <div hidden={tab !== "reference"} className="project-panel">
            <p className="overview-status-hint">
              Studio Reference tab placeholder for layout verification.
            </p>
          </div>

          <div hidden={tab !== "materials"} className="project-panel">
            <ul className="overview-materials-list">
              {tutorial.materials.map((m) => (
                <li key={m.item}>{m.item}</li>
              ))}
            </ul>
          </div>

          <div hidden={tab !== "progress"} className="project-panel">
            <ProgressUpload status={status} onStatusChange={setStatus} />
          </div>
        </LessonShell>
      </div>
    </div>
  );
}
