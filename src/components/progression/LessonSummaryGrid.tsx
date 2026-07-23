import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage } from "@/lib/progression";
import { stageFocusPrimary } from "@/components/progression/stage-focus";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";
import { LearningCard } from "@/components/progression/LearningCard";
import { StageFocusPanel } from "@/components/progression/StageFocusPanel";
import { StageCheckpoint } from "@/components/progression/StageCheckpoint";
import { StageMistake } from "@/components/progression/StageMistake";
import { StageInstructorNote } from "@/components/progression/StageInstructorNote";
import { StagePalette } from "@/components/progression/StagePalette";
import { StageSetupStrip } from "@/components/progression/StageSetupStrip";

function excerpt(text: string, max = 128): string {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length <= max) return trimmed;
  const cut = trimmed.slice(0, max);
  const breakAt = Math.max(
    cut.lastIndexOf(". "),
    cut.lastIndexOf("; "),
    cut.lastIndexOf(" — "),
    cut.lastIndexOf(", "),
  );
  if (breakAt > 48) return cut.slice(0, breakAt + 1).trim();
  return `${cut.replace(/\s+\S*$/, "").trim()}…`;
}

function buildSummary(stage: ProgressionStage, medium: Medium) {
  const { paint, visual, goals, commonMistakes, proTips } = stage;
  const usePencil =
    stage.id === "pencil-sketch" ||
    medium === "pencil" ||
    medium === "charcoal";

  const goal =
    paint.goal.trim() ||
    goals.find((g) => g.trim())?.trim() ||
    stageFocusPrimary(stage);

  const observe = visual.intent.trim();

  const technique =
    paint.brushPurpose.trim() ||
    proTips.find((t) => t.trim())?.trim() ||
    paint.brushPressure.trim();

  const avoid =
    paint.watchOut.trim() ||
    commonMistakes.find((m) => m.trim())?.trim() ||
    "";

  const materialsParts = [
    paint.brush.trim(),
    usePencil ? "" : paint.water.trim(),
  ].filter(Boolean);
  const materials = materialsParts.join(" · ") || paint.brushPurpose.trim();

  const time = paint.estimatedMinutes > 0
    ? `~${paint.estimatedMinutes} min`
    : "";

  return { goal, observe, technique, avoid, materials, time };
}

export function LessonSummaryGrid({
  stage,
  tutorial,
  medium,
}: {
  stage: ProgressionStage;
  tutorial: Tutorial;
  medium: Medium;
}) {
  const summary = buildSummary(stage, medium);
  const extraGoals = stage.goals
    .map((g) => g.trim())
    .filter((g) => g && g !== summary.goal);
  const extraMistakes = stage.commonMistakes
    .map((m) => m.trim())
    .filter((m) => m && m !== summary.avoid);

  return (
    <section
      className="lesson-summary"
      aria-labelledby={`summary-${stage.id}`}
    >
      <h4 className="lesson-summary-title" id={`summary-${stage.id}`}>
        Stage at a glance
      </h4>

      <div className="lesson-summary-grid">
        {summary.goal && (
          <LearningCard tone="goal" label="Goal">
            <p>{excerpt(summary.goal)}</p>
          </LearningCard>
        )}
        {summary.observe && (
          <LearningCard tone="observe" label="Observe">
            <p>{excerpt(summary.observe)}</p>
          </LearningCard>
        )}
        {summary.technique && (
          <LearningCard tone="technique" label="Technique">
            <p>{excerpt(summary.technique)}</p>
          </LearningCard>
        )}
        {summary.avoid && (
          <LearningCard tone="avoid" label="Avoid">
            <p>{excerpt(summary.avoid)}</p>
          </LearningCard>
        )}
        {summary.materials && (
          <LearningCard tone="materials" label="Materials">
            <p>{excerpt(summary.materials, 100)}</p>
          </LearningCard>
        )}
        {summary.time && (
          <LearningCard tone="time" label="Time">
            <p>{summary.time}</p>
          </LearningCard>
        )}
      </div>

      <details className="lesson-summary-more">
        <summary>Full stage guidance</summary>
        <div className="lesson-summary-more-body">
          <StageFocusPanel stage={stage} />

          {stage.explanation.trim() && (
            <div className="lesson-summary-block">
              <h5 className="lesson-summary-block-label">Explanation</h5>
              <p className="stage-explanation">
                <AutoTerms text={stage.explanation} />
              </p>
            </div>
          )}

          {extraGoals.length > 0 && (
            <div className="lesson-summary-block">
              <h5 className="lesson-summary-block-label">All goals</h5>
              <ul className="lesson-summary-list">
                {stage.goals.filter((g) => g.trim()).map((g, i) => (
                  <li key={i}>
                    <AutoTerms text={g} />
                  </li>
                ))}
              </ul>
            </div>
          )}

          <StageSetupStrip stage={stage} medium={medium} />

          <StagePalette
            stage={stage}
            tutorial={tutorial}
            medium={medium}
          />

          <StageCheckpoint stage={stage} />

          <StageMistake stage={stage} />

          {extraMistakes.length > 0 && summary.avoid && (
            <div className="lesson-summary-block">
              <h5 className="lesson-summary-block-label">Also watch for</h5>
              <ul className="lesson-summary-list">
                {extraMistakes.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </div>
          )}

          <StageInstructorNote stage={stage} />
        </div>
      </details>
    </section>
  );
}
