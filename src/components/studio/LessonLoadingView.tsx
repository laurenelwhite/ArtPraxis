"use client";

import { useEffect, useMemo, useState } from "react";
import { AppImage } from "@/components/ui/AppImage";
import {
  formatMediumLevelEyebrow,
  getCreatorPipeline,
  getMediumLanguage,
  getMediumTips,
  parseSkill,
} from "@/lib/medium-language";
import {
  CREATE_WAIT,
  MASTER_WAIT,
  creatingPipelineIndex,
  expectedWaitFill,
  formatRangeEstimate,
  formatRemainingCopy,
  formatWaitClock,
  getMasterWaitPipeline,
  masterPipelineIndex,
  type WaitTimingProfile,
} from "@/lib/generation-wait";

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
  /**
   * When true, omit the large reference plate — use a chip so the previous
   * surface can stay visible above/beside this compact wait strip.
   */
  compact?: boolean;
};

type StepState = "pending" | "active" | "complete";

function stepState(index: number, activeIndex: number): StepState {
  if (index < activeIndex) return "complete";
  if (index === activeIndex) return "active";
  return "pending";
}

function waitProfile(mode: LoadingMode): WaitTimingProfile {
  if (mode === "creating") return CREATE_WAIT;
  return MASTER_WAIT;
}

/**
 * Compact atelier wait — reference chip + live ETA + progressive checklist + tip.
 * CSS motion only; no fake completion percentages.
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
  compact = true,
}: Props) {
  const lang = useMemo(() => getMediumLanguage(medium), [medium]);
  const tips = useMemo(
    () => getMediumTips(medium, skillLevel),
    [medium, skillLevel],
  );
  const defaultPipeline = useMemo(() => {
    if (mode === "masterGenerating" || mode === "generic") {
      return getMasterWaitPipeline(lang.completedWorkNoun);
    }
    return getCreatorPipeline(medium);
  }, [mode, medium, lang.completedWorkNoun]);

  const profile = waitProfile(mode);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [tipRevealed, setTipRevealed] = useState(false);

  useEffect(() => {
    const started = Date.now();
    const id = window.setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - started) / 1000));
    }, 250);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    setTipIndex(0);
    setTipRevealed(false);
  }, [medium, skillLevel]);

  // Progressive disclosure: tip appears after a short beat.
  useEffect(() => {
    if (tips.length === 0) return;
    const reveal = window.setTimeout(() => setTipRevealed(true), 2200);
    return () => window.clearTimeout(reveal);
  }, [tips]);

  useEffect(() => {
    if (!tipRevealed || tips.length === 0) return;
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % tips.length);
    }, 7500);
    return () => window.clearInterval(id);
  }, [tips, tipRevealed]);

  const steps = pipeline ?? defaultPipeline;
  const isMaster = mode === "masterGenerating";
  const isCreating = mode === "creating";
  const timedIndex = isCreating
    ? creatingPipelineIndex(elapsedSec)
    : masterPipelineIndex(elapsedSec);
  const activeIndex =
    typeof activeStepIndex === "number"
      ? Math.max(0, Math.min(steps.length - 1, activeStepIndex))
      : timedIndex;
  const activeStep = steps[activeIndex] ?? steps[0];
  const tip = tips[tipIndex] ?? tips[0];
  const level = parseSkill(skillLevel);
  const fill = expectedWaitFill(elapsedSec, profile);
  const remainingCopy = formatRemainingCopy(elapsedSec, profile);
  const rangeEstimate = estimateProp ?? formatRangeEstimate(profile);

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
      : `Translating your reference into a finished ${lang.completedWorkNoun} while preserving composition and placement.`);

  return (
    <section
      className={[
        "lesson-loading-view",
        "atelier-wait-view",
        "atelier-wait-view--compact",
        compact ? "atelier-wait-view--chip" : "atelier-wait-view--framed",
        isMaster ? "atelier-wait-view--master" : null,
        isCreating ? "atelier-wait-view--creating" : null,
      ]
        .filter(Boolean)
        .join(" ")}
      aria-live="polite"
      aria-labelledby="atelier-wait-heading"
      data-lesson-medium={medium ?? undefined}
      data-active-step={activeStep?.id}
    >
      {referenceUrl ? (
        <figure className="atelier-wait-frame atelier-wait-frame--chip">
          <AppImage
            src={referenceUrl}
            alt="Your uploaded reference"
            className="atelier-wait-frame-img"
            width={320}
            height={240}
            sizes="96px"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <figcaption className="atelier-wait-frame-label">Reference</figcaption>
        </figure>
      ) : null}

      <div className="atelier-wait-panel" role="status">
        <header className="atelier-wait-header">
          {mediumEyebrow ? (
            <p className="atelier-wait-medium">{mediumEyebrow}</p>
          ) : null}
          <p className="atelier-wait-eyebrow">{eyebrow}</p>
          <h2 className="atelier-wait-heading" id="atelier-wait-heading">
            {heading}
          </h2>
          <p className="atelier-wait-body">{body}</p>
        </header>

        <div className="atelier-wait-time" aria-label="Expected wait">
          <div className="atelier-wait-time-row">
            <p className="atelier-wait-estimate">{remainingCopy}</p>
            <p className="atelier-wait-elapsed" aria-label="Elapsed time">
              <span className="atelier-wait-elapsed-clock">
                {formatWaitClock(elapsedSec)}
              </span>
              <span className="atelier-wait-elapsed-label">elapsed</span>
            </p>
          </div>
          <div
            className="atelier-wait-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(fill * 100)}
            aria-valuetext={remainingCopy}
            aria-label="Expected wait progress"
          >
            <span
              className="atelier-wait-track-fill"
              style={{ width: `${Math.round(fill * 100)}%` }}
              aria-hidden="true"
            />
          </div>
          <p className="atelier-wait-range">{rangeEstimate}</p>
        </div>

        <div className="atelier-wait-now" aria-live="polite">
          <span className="atelier-wait-now-pulse" aria-hidden="true" />
          <p className="atelier-wait-now-label">
            Now: <strong>{activeStep?.label ?? "Working…"}</strong>
          </p>
        </div>

        <ol className="atelier-pipeline" aria-label="Lesson generation progress">
          {steps.map((step, index) => {
            const state = stepState(index, activeIndex);
            return (
              <li
                key={step.id}
                className={`atelier-pipeline-step is-${state}`}
                aria-current={state === "active" ? "step" : undefined}
              >
                <span className="atelier-pipeline-mark" aria-hidden="true">
                  {state === "complete" ? (
                    <svg
                      viewBox="0 0 16 16"
                      className="atelier-pipeline-check"
                      focusable="false"
                    >
                      <path
                        className="atelier-pipeline-check-path"
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

        {tip && tipRevealed ? (
          <aside
            className="atelier-studio-tip"
            key={`${medium}-${skillLevel}-${tipIndex}`}
            aria-label="Studio tip"
          >
            <div className="atelier-studio-tip-top">
              <p className="atelier-studio-tip-kicker">Studio tip</p>
              <p className="atelier-studio-tip-index" aria-hidden="true">
                {tipIndex + 1}/{tips.length}
              </p>
            </div>
            <p className="atelier-studio-tip-title">{tip.title}</p>
            <p className="atelier-studio-tip-body">{tip.body}</p>
          </aside>
        ) : tip ? (
          <div className="atelier-studio-tip atelier-studio-tip--slot" aria-hidden="true" />
        ) : null}

        <p className="atelier-wait-reassure">
          Keep this tab open — your reference stays safe while we prepare.
        </p>
      </div>
    </section>
  );
}
