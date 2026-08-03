"use client";

import type { Tutorial } from "@/lib/tutorial-schema";
import { LESSON_SECTION_DOM_ID } from "@/lib/lesson-document";
import { AppImage } from "@/components/ui/AppImage";
import { ArtworkFrame } from "@/components/progression/ArtworkFrame";
import { useStudioReferenceOptional } from "@/components/studio-reference";
import { AutoTerms } from "@/components/vocabulary/AutoTerms";

type Observation = {
  label: string;
  body: string;
};

/**
 * Grounded observations from composition / valueMap / visualGuides only.
 * Omits fields that are empty — never invents analysis text.
 */
function buildObservations(tutorial: Tutorial): Observation[] {
  const { composition, valueMap, visualGuides, creativeChoices } = tutorial;
  const items: Observation[] = [];

  const focal = composition?.focalPoint?.trim();
  if (focal) {
    items.push({ label: "Focal subject", body: focal });
  }

  const shapes = composition?.majorShapes?.map((s) => s.trim()).filter(Boolean) ?? [];
  if (shapes.length) {
    items.push({
      label: "Dominant large shapes",
      body: shapes.join("; "),
    });
  }

  const light = composition?.lightDirection?.trim();
  if (light) {
    items.push({ label: "Light source", body: light });
  }

  const valuePlan = composition?.valuePlan?.trim();
  if (valuePlan) {
    items.push({ label: "Value pattern", body: valuePlan });
  }

  const warmCool = visualGuides?.regions
    ?.filter((r) => r.type === "warm" || r.type === "cool")
    .map((r) => r.label?.trim())
    .filter(Boolean);
  if (warmCool && warmCool.length > 0) {
    items.push({
      label: "Warm / cool relationship",
      body: warmCool.join("; "),
    });
  }

  const negatives = visualGuides?.regions
    ?.filter((r) => /negative/i.test(r.label ?? ""))
    .map((r) => r.label.trim())
    .filter(Boolean);
  if (negatives && negatives.length > 0) {
    items.push({
      label: "Important negative spaces",
      body: negatives.join("; "),
    });
  }

  const squint = valueMap?.squintTest?.trim();
  if (squint) {
    items.push({
      label: "What may be simplified",
      body: squint,
    });
  }

  const crop = visualGuides?.suggestedCrop?.label?.trim();
  if (crop) {
    items.push({
      label: "What may be omitted",
      body: crop,
    });
  }

  const personality = creativeChoices?.find((c) => c.trim())?.trim();
  if (personality) {
    items.push({
      label: "Characteristic that gives personality",
      body: personality,
    });
  }

  const movement = visualGuides?.lightArrow?.label?.trim();
  if (movement) {
    items.push({ label: "Directional movement", body: movement });
  }

  return items;
}

export function LessonObserveSection({
  tutorial,
  referenceUrl,
  title,
  sectionRef,
  nextLabel,
}: {
  tutorial: Tutorial;
  referenceUrl?: string | null;
  title?: string;
  sectionRef?: (el: HTMLElement | null) => void;
  nextLabel?: string;
}) {
  const observations = buildObservations(tutorial);
  const ctx = useStudioReferenceOptional();
  const domId = LESSON_SECTION_DOM_ID.observe;
  const imageTitle = title?.trim() || tutorial.title || "this lesson";

  return (
    <section
      ref={sectionRef}
      id={domId}
      className="lesson-doc-section lesson-observe-section"
      aria-labelledby={`${domId}-title`}
    >
      <header className="lesson-doc-head">
        <p className="lesson-doc-meta stage-eyebrow">2 · Observe</p>
        <h2 id={`${domId}-title`} className="lesson-doc-title">
          Observe
        </h2>
        <p className="lesson-doc-purpose">
          Read the subject before drawing. Notice structure, light, and what to leave out.
        </p>
      </header>

      <div className="lesson-observe-layout">
        {referenceUrl ? (
          <figure className="lesson-observe-figure">
            <ArtworkFrame variant="reference">
              <button
                type="button"
                className="lesson-observe-hit"
                onClick={() => ctx?.openFullscreen?.()}
                disabled={!ctx?.openFullscreen}
                aria-label="Open reference for observation"
              >
                <AppImage
                  src={referenceUrl}
                  alt={`Reference to observe for ${imageTitle}`}
                  width={1200}
                  height={900}
                  sizes="(max-width: 900px) 100vw, 560px"
                  className="lesson-observe-img"
                />
              </button>
            </ArtworkFrame>
            <figcaption className="lesson-observe-caption">Reference</figcaption>
          </figure>
        ) : null}

        {observations.length > 0 ? (
          <ol className="lesson-observe-list" start={1}>
            {observations.map((item, index) => (
              <li key={item.label} className="lesson-observe-item">
                <span className="lesson-observe-num" aria-hidden="true">
                  {index + 1}
                </span>
                <div className="lesson-observe-copy">
                  <p className="lesson-observe-label">{item.label}</p>
                  <p className="lesson-observe-body">
                    <AutoTerms text={item.body} />
                  </p>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <p className="lesson-doc-empty">
            Observation notes will appear when this lesson includes composition analysis.
          </p>
        )}
      </div>

      {nextLabel ? (
        <p className="lesson-doc-cue">Next: {nextLabel}</p>
      ) : null}
    </section>
  );
}
