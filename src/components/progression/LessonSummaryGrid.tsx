import type { ProgressionStage } from "@/lib/progression";
import { stageIgnoreLine } from "@/components/progression/stage-focus";
import { GuideNoteCard } from "@/components/progression/GuideNoteCard";
import { excerpt } from "@/lib/stage-copy";

type GlanceNote = {
  tone: "technique" | "avoid";
  label: string;
  body: string;
};

/** Technique + Watch for only — Focus/goal lives in the teaching point above. */
function buildGlanceNotes(stage: ProgressionStage): GlanceNote[] {
  const { paint, commonMistakes, proTips } = stage;
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

  return notes;
}

export function LessonSummaryGrid({ stage }: { stage: ProgressionStage }) {
  const notes = buildGlanceNotes(stage);
  if (notes.length === 0) return null;

  return (
    <section
      className="lesson-summary lesson-summary--cards lesson-summary--glance"
      aria-label="Stage guidance"
    >
      <div className="studio-guide-cards">
        {notes.map((note) => (
          <GuideNoteCard
            key={`${note.tone}-${note.label}`}
            tone={note.tone}
            label={note.label}
            body={note.body}
          />
        ))}
      </div>
    </section>
  );
}
