import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { stageFocusPrimary, stageIgnoreLine } from "@/components/progression/stage-focus";

function excerpt(text: string, max = 72): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const breakAt = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("; "),
    cut.lastIndexOf(" — "),
    cut.lastIndexOf(", "),
  );
  if (breakAt > 24) return cut.slice(0, breakAt + 1).trim();
  return `${cut.replace(/\s+\S*$/, "").trim()}…`;
}

function normalizeForCompare(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

type GlanceNote = {
  tone: "goal" | "observe" | "technique" | "avoid";
  label: string;
  body: string;
};

/** Instructional blocks — Technique / Watch For / Goal (omit Goal if it duplicates instruction). */
function buildGlanceNotes(
  stage: ProgressionStage,
  medium: Medium,
  instruction?: string,
): GlanceNote[] {
  const { paint, visual, goals, commonMistakes, proTips } = stage;
  void medium;

  const notes: GlanceNote[] = [];

  const technique =
    paint.brushPurpose.trim() ||
    proTips.find((t) => t.trim())?.trim() ||
    paint.brushPressure.trim() ||
    null;
  if (technique) {
    notes.push({
      tone: "technique",
      label: "Technique",
      body: excerpt(technique),
    });
  }

  const avoid =
    paint.watchOut.trim() ||
    commonMistakes.find((m) => m.trim())?.trim() ||
    stageIgnoreLine(stage.id);
  if (avoid) {
    notes.push({
      tone: "avoid",
      label: "Watch for",
      body: excerpt(avoid),
    });
  }

  const goalCandidate =
    paint.goal.trim() ||
    goals.find((g) => g.trim() && normalizeForCompare(g) !== normalizeForCompare(technique ?? ""))?.trim() ||
    visual.intent.trim() ||
    stageFocusPrimary(stage);

  if (goalCandidate) {
    const goalNorm = normalizeForCompare(goalCandidate);
    const instructionNorm = instruction ? normalizeForCompare(instruction) : "";
    const techniqueNorm = technique ? normalizeForCompare(technique) : "";
    const duplicatesInstruction =
      instructionNorm.length > 0 &&
      (goalNorm === instructionNorm ||
        instructionNorm.includes(goalNorm) ||
        goalNorm.includes(instructionNorm));
    const duplicatesTechnique =
      techniqueNorm.length > 0 &&
      (goalNorm === techniqueNorm || goalNorm.includes(techniqueNorm));

    if (!duplicatesInstruction && !duplicatesTechnique) {
      notes.push({
        tone: "goal",
        label: "Focus",
        body: excerpt(goalCandidate),
      });
    }
  }

  return notes.slice(0, 3);
}

export function LessonSummaryGrid({
  stage,
  medium,
  instruction,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
  instruction?: string;
}) {
  const notes = buildGlanceNotes(stage, medium, instruction);
  if (notes.length === 0) return null;

  return (
    <section
      className="lesson-summary lesson-summary--cards"
      aria-label="Stage guidance"
    >
      <div className="studio-guide-cards">
        {notes.map((note) => (
          <article
            key={`${note.tone}-${note.label}`}
            className="studio-guide-card"
            data-tone={note.tone}
          >
            <h3 className="studio-guide-card-label">{note.label}</h3>
            <p className="studio-guide-card-body">{note.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
