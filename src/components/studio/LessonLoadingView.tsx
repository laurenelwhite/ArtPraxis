"use client";

import { useEffect, useState } from "react";
import { AppImage } from "@/components/ui/AppImage";
import { ArtPraxisDotLoader } from "@/components/ui/ArtPraxisDotLoader";

type LoadingMode = "creating" | "masterGenerating" | "generic";

type PipelineStep = {
  id: string;
  label: string;
};

type Props = {
  headline?: string;
  detail?: string;
  referenceUrl?: string | null;
  mode?: LoadingMode;
  /** Optional checklist override (e.g. /studio/new creating flow). */
  pipeline?: PipelineStep[];
  /** When set, drives the checklist instead of elapsed-time heuristics. */
  activeStepIndex?: number;
  eyebrow?: string;
  estimate?: string;
};

const PIPELINE: PipelineStep[] = [
  { id: "composition", label: "Studying composition" },
  { id: "master", label: "Creating master painting" },
  { id: "stages", label: "Building your painting steps" },
  { id: "studio", label: "Preparing your studio" },
];

export const CREATOR_PIPELINE: PipelineStep[] = [
  { id: "composition", label: "Studying composition" },
  { id: "planning", label: "Planning lesson" },
  { id: "demos", label: "Preparing demonstrations" },
  { id: "studio", label: "Building your studio" },
];

const STUDIO_TIPS = [
  {
    title: "Preserve your whites",
    body: "Leave the brightest lights as untouched paper — once covered, that sparkle is hard to reclaim.",
  },
  {
    title: "Work light to dark",
    body: "Lay pale washes first, then deepen values gradually. Watercolor rewards patience more than force.",
  },
  {
    title: "Control your water",
    body: "The ratio of pigment to water decides whether a wash blooms softly or sits with crisp edges.",
  },
  {
    title: "Let washes dry",
    body: "Layering over damp paint invites mud. Give each wash time to settle before the next pass.",
  },
  {
    title: "Keep edges intentional",
    body: "Soft edges recede; hard edges advance. Decide which before the brush touches the paper.",
  },
  {
    title: "Plan the light path",
    body: "Squint at your reference. The largest light and dark shapes matter more than early detail.",
  },
] as const;

const TIP_INTERVAL_MS = 9000;

/**
 * Presentation-only pipeline index from elapsed time.
 * Does not mirror backend state — keeps the wait feeling purposeful.
 */
function activePipelineIndex(elapsedSec: number, mode: LoadingMode): number {
  if (mode === "creating") {
    if (elapsedSec < 8) return 0;
    if (elapsedSec < 20) return 1;
    return 1;
  }
  // masterGenerating / generic — linger on master for the long wait
  if (elapsedSec < 12) return 0;
  return 1;
}

type StepState = "pending" | "active" | "complete";

function stepState(index: number, activeIndex: number): StepState {
  if (index < activeIndex) return "complete";
  if (index === activeIndex) return "active";
  return "pending";
}

/**
 * Professional atelier wait — reference plate + pipeline checklist + rotating studio tip.
 * CSS motion only; no brush GIFs, percentages, or spinners.
 */
export function LessonLoadingView({
  referenceUrl,
  mode = "generic",
  pipeline,
  activeStepIndex,
  headline: headlineProp,
  detail: detailProp,
  eyebrow: eyebrowProp,
  estimate: estimateProp,
}: Props) {
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % STUDIO_TIPS.length);
    }, TIP_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  const steps = pipeline ?? PIPELINE;
  const isMaster = mode === "masterGenerating";
  const isCreating = mode === "creating";
  const timedIndex = activePipelineIndex(elapsedSec, mode);
  const activeIndex =
    typeof activeStepIndex === "number"
      ? Math.max(0, Math.min(steps.length - 1, activeStepIndex))
      : timedIndex;
  const tip = STUDIO_TIPS[tipIndex] ?? STUDIO_TIPS[0];

  const eyebrow = eyebrowProp ?? "Creating your lesson";
  const heading =
    headlineProp ??
    (isCreating ? "Building your painting lesson" : "Painting your finished inspiration");
  const body =
    detailProp ??
    (isCreating
      ? "We're analyzing your reference and preparing a stage-by-stage painting lesson."
      : "We're translating your reference into a finished painting while preserving composition, perspective and subject placement.");
  const estimate =
    estimateProp ??
    (isMaster
      ? "Usually takes about 1–2 minutes."
      : isCreating
        ? "Usually takes under a minute."
        : "Usually takes about 1–2 minutes.");

  return (
    <section
      className={[
        "lesson-loading-view",
        "atelier-wait-view",
        isMaster ? "atelier-wait-view--master" : null,
        isCreating ? "atelier-wait-view--creating" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
      aria-labelledby="atelier-wait-heading"
    >
      {referenceUrl ? (
        <figure className="atelier-wait-frame">
          <AppImage
            src={referenceUrl}
            alt="Your uploaded reference"
            className="atelier-wait-frame-img"
            width={1200}
            height={900}
            sizes="(max-width: 900px) 100vw, 480px"
            style={{ width: "100%", height: "auto" }}
          />
          <figcaption className="atelier-wait-frame-label">Your reference</figcaption>
        </figure>
      ) : null}

      <div className="atelier-wait-panel" role="status">
        <p className="atelier-wait-eyebrow">{eyebrow}</p>
        <h2 className="atelier-wait-heading" id="atelier-wait-heading">
          {heading}
        </h2>
        <p className="atelier-wait-body">{body}</p>
        <p className="atelier-wait-estimate">{estimate}</p>

        <div className="atelier-wait-loader">
          <ArtPraxisDotLoader size="small" />
        </div>

        <ol className="atelier-pipeline" aria-label="Lesson generation progress">
          {steps.map((step, index) => {
            const state = stepState(index, activeIndex);
            return (
              <li
                key={step.id}
                className={`atelier-pipeline-step is-${state}`}
              >
                <span className="atelier-pipeline-mark" aria-hidden="true">
                  {state === "complete" ? (
                    <svg viewBox="0 0 16 16" className="atelier-pipeline-check" focusable="false">
                      <path
                        d="M3.2 8.2 L6.4 11.2 L12.8 4.6"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  ) : (
                    <span className="atelier-pipeline-dot" />
                  )}
                </span>
                <span className="atelier-pipeline-label">{step.label}</span>
              </li>
            );
          })}
        </ol>

        <aside
          className="atelier-studio-tip"
          key={tipIndex}
          aria-label="Studio tip"
        >
          <p className="atelier-studio-tip-kicker">Studio tip</p>
          <p className="atelier-studio-tip-title">{tip.title}</p>
          <p className="atelier-studio-tip-body">{tip.body}</p>
        </aside>

        <p className="atelier-wait-reassure">
          You can safely keep this tab open while we prepare your lesson.
        </p>
      </div>
    </section>
  );
}
