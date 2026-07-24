"use client";

import { useEffect, useMemo, useState } from "react";
import { AppImage } from "@/components/ui/AppImage";
import { ArtPraxisDotLoader } from "@/components/ui/ArtPraxisDotLoader";
import {
  formatMediumLevelEyebrow,
  getCreatorPipeline,
  getMediumLanguage,
  getMediumTips,
  parseSkill,
} from "@/lib/medium-language";

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
  /** Drives medium-aware copy, tips, and pipeline labels. */
  medium?: string | null;
  skillLevel?: string | null;
};

/** @deprecated Prefer getCreatorPipeline(medium) — kept for call-site compatibility. */
export const CREATOR_PIPELINE: PipelineStep[] = getCreatorPipeline("watercolor");

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
  medium,
  skillLevel,
}: Props) {
  const lang = useMemo(() => getMediumLanguage(medium), [medium]);
  const tips = useMemo(
    () => getMediumTips(medium, skillLevel),
    [medium, skillLevel],
  );
  const defaultPipeline = useMemo(
    () => getCreatorPipeline(medium),
    [medium],
  );

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
    setTipIndex(0);
  }, [medium, skillLevel]);

  useEffect(() => {
    if (tips.length === 0) return;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 9000);
    return () => window.clearInterval(id);
  }, [tips]);

  const steps = pipeline ?? defaultPipeline;
  const isMaster = mode === "masterGenerating";
  const isCreating = mode === "creating";
  const timedIndex = activePipelineIndex(elapsedSec, mode);
  const activeIndex =
    typeof activeStepIndex === "number"
      ? Math.max(0, Math.min(steps.length - 1, activeStepIndex))
      : timedIndex;
  const tip = tips[tipIndex] ?? tips[0];
  const level = parseSkill(skillLevel);

  const mediumEyebrow =
    medium != null && medium !== ""
      ? formatMediumLevelEyebrow(medium, skillLevel)
      : null;

  const eyebrow =
    eyebrowProp ??
    (isCreating ? "Beginning your lesson" : "Creating your lesson");
  const heading =
    headlineProp ??
    (isCreating
      ? lang.preparationHeading
      : `Preparing your ${lang.completedWorkNoun}`);
  const body =
    detailProp ??
    (isCreating
      ? lang.preparationDescription(level)
      : `We're translating your reference into a finished ${lang.completedWorkNoun} while preserving composition, perspective, and subject placement.`);
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
      data-lesson-medium={medium ?? undefined}
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
        {mediumEyebrow ? (
          <p className="atelier-wait-medium">{mediumEyebrow}</p>
        ) : null}
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

        {tip ? (
          <aside
            className="atelier-studio-tip"
            key={`${medium}-${skillLevel}-${tipIndex}`}
            aria-label="Studio tip"
          >
            <p className="atelier-studio-tip-kicker">Studio tip</p>
            <p className="atelier-studio-tip-title">{tip.title}</p>
            <p className="atelier-studio-tip-body">{tip.body}</p>
          </aside>
        ) : null}

        <p className="atelier-wait-reassure">
          You can safely keep this tab open while we prepare your lesson.
        </p>
      </div>
    </section>
  );
}
