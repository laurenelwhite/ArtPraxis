"use client";

import type { Tutorial } from "@/lib/tutorial-schema";
import type { Medium } from "@/lib/tutorial-schema";
import type { LessonDocumentStep } from "@/lib/lesson-document";
import {
  deriveLessonSkills,
  LESSON_SECTION_DOM_ID,
} from "@/lib/lesson-document";
import { getMediumLanguage } from "@/lib/medium-language";
import { StudioReferencePair } from "@/components/studio-reference";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

/**
 * Opening assignment: reference + final target dominate; title stays quiet.
 * Composed from existing tutorial/overview fields — no invented content.
 */
export function LessonPlanSection({
  tutorial,
  medium,
  referenceUrl,
  masterImageUrl,
  title,
  documentSteps,
  sectionRef,
  onBegin,
}: {
  tutorial: Tutorial;
  medium: Medium;
  referenceUrl: string;
  masterImageUrl?: string | null;
  title: string;
  documentSteps: LessonDocumentStep[];
  sectionRef?: (el: HTMLElement | null) => void;
  onBegin: () => void;
}) {
  const lang = getMediumLanguage(medium);
  const skills = deriveLessonSkills(tutorial);
  const challenge =
    tutorial.composition?.focalPoint?.trim() ||
    tutorial.steps?.[0]?.objective?.trim() ||
    "";
  const liberty =
    tutorial.creativeChoices?.find((c) => c.trim())?.trim() ||
    "Use this painting as your guide, then make the final choices your own.";
  const domId = LESSON_SECTION_DOM_ID.plan;

  return (
    <section
      ref={sectionRef}
      id={domId}
      className="lesson-doc-section lesson-plan-section"
      aria-labelledby={`${domId}-title`}
    >
      <header className="lesson-doc-head">
        <p className="lesson-doc-meta stage-eyebrow">1 · Plan</p>
        <h2 id={`${domId}-title`} className="lesson-doc-title">
          Assignment
        </h2>
      </header>

      <div className="lesson-plan-artwork">
        <StudioReferencePair
          referenceUrl={referenceUrl}
          finalPaintingUrl={masterImageUrl}
          title={title}
          className="lesson-plan-ref-pair"
        />
      </div>

      <div className="lesson-plan-brief">
        <p className="lesson-doc-purpose lesson-plan-intention">
          <AutoTerms
            text={
              tutorial.overview?.trim() ||
              "Study the finished painting, then work through each stage toward it."
            }
          />
        </p>
        <dl className="lesson-plan-meta">
          <div>
            <dt>Medium</dt>
            <dd className="capitalize">{lang.mediumLabel}</dd>
          </div>
          <div>
            <dt>Level</dt>
            <dd className="capitalize">{tutorial.difficulty}</dd>
          </div>
          <div>
            <dt>Time</dt>
            <dd>About {tutorial.estimatedMinutes} min</dd>
          </div>
        </dl>

        {challenge ? (
          <div className="lesson-plan-block">
            <h3 className="lesson-plan-label">Key challenge</h3>
            <p className="lesson-plan-copy">
              <AutoTerms text={challenge} />
            </p>
          </div>
        ) : null}

        {skills.length > 0 ? (
          <div className="lesson-plan-block">
            <h3 className="lesson-plan-label">Skills practised</h3>
            <ul className="lesson-plan-skills">
              {skills.map((skill) => (
                <li key={skill}>{skill}</li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="lesson-plan-block">
          <h3 className="lesson-plan-label">Lesson map</h3>
          <ol className="lesson-plan-map-list">
            {documentSteps.map((step) => (
              <li key={step.id}>
                <span className="lesson-plan-map-num" aria-hidden="true">
                  {step.number}
                </span>
                <span>{step.label}</span>
              </li>
            ))}
          </ol>
        </div>

        <p className="lesson-plan-liberty">
          <AutoTerms text={liberty} />
        </p>

        <button
          type="button"
          className="ap-button-primary btn-branded lesson-plan-begin"
          onClick={onBegin}
        >
          Begin lesson
        </button>
      </div>
    </section>
  );
}
