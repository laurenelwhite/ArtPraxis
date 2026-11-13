"use client";

import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import { LESSON_SECTION_DOM_ID } from "@/lib/lesson-document";
import { getMediumLanguage } from "@/lib/medium-language";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

/**
 * Working-notes palette section from tutorial.palette — not an ecommerce grid.
 * No generated stage image; sits between Values and First layer in the document.
 */
export function LessonColorSection({
  tutorial,
  medium,
  sectionRef,
  nextLabel,
}: {
  tutorial: Tutorial;
  medium: Medium;
  sectionRef?: (el: HTMLElement | null) => void;
  nextLabel?: string;
}) {
  const lang = getMediumLanguage(medium);
  const palette = tutorial.palette ?? [];
  const materials = (tutorial.materials ?? [])
    .filter((m) => m.required !== false)
    .slice(0, 4);
  const domId = LESSON_SECTION_DOM_ID.color;
  const testHint =
    medium === "watercolor"
      ? "Test each mixture on scrap paper before committing to the painting."
      : medium === "oil" || medium === "acrylic"
        ? "Lay a small test patch of each mixture before blocking large areas."
        : medium === "pastel"
          ? "Swipe a short test stroke of each color family on scrap before building form."
          : "Confirm value relationships with a short test mark before committing.";

  return (
    <section
      ref={sectionRef}
      id={domId}
      className="lesson-doc-section lesson-color-section"
      aria-labelledby={`${domId}-title`}
    >
      <header className="lesson-doc-head">
        <p className="lesson-doc-meta stage-eyebrow">5 · Color</p>
        <h2 id={`${domId}-title`} className="lesson-doc-title">
          Color
        </h2>
        <p className="lesson-doc-purpose">
          Prepare mixtures for this {lang.mediumLabel.toLowerCase()} lesson before the first layer.
        </p>
      </header>

      {palette.length > 0 ? (
        <ul className="lesson-color-notes" role="list">
          {palette.map((swatch) => (
            <li key={swatch.name} className="lesson-color-note">
              <span
                className="lesson-color-swatch"
                style={{ background: swatch.hex }}
                aria-hidden="true"
              />
              <div className="lesson-color-copy">
                <h3 className="lesson-color-name">{swatch.name}</h3>
                {swatch.role?.trim() ? (
                  <p className="lesson-color-role">
                    <AutoTerms text={swatch.role} />
                  </p>
                ) : null}
                {swatch.mixingNote?.trim() ? (
                  <p className="lesson-color-recipe">
                    <AutoTerms text={swatch.mixingNote} />
                  </p>
                ) : null}
                {swatch.ratio?.trim() ? (
                  <p className="lesson-color-strength">{swatch.ratio}</p>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="lesson-doc-empty">
          Palette notes will appear when this lesson includes colour mixtures.
        </p>
      )}

      {materials.length > 0 ? (
        <div className="lesson-color-subs">
          <h3 className="lesson-plan-label">Substitutions</h3>
          <ul>
            {materials
              .filter((m) => m.substitution?.trim())
              .slice(0, 3)
              .map((m) => (
                <li key={m.item}>
                  <strong>{m.item}</strong>
                  {m.substitution ? ` — ${m.substitution}` : null}
                </li>
              ))}
          </ul>
        </div>
      ) : null}

      <p className="lesson-color-test">
        <AutoTerms text={testHint} />
      </p>

      {nextLabel ? (
        <p className="lesson-doc-cue">Next: {nextLabel}</p>
      ) : null}
    </section>
  );
}
