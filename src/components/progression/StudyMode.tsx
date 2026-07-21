"use client";

import { useState } from "react";

import type {
  GenerationStatus,
  ProgressionStage,
  StageId,
} from "@/lib/progression";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { CompareMode } from "@/components/progression/StageComparison";

import { StageChapter } from "@/components/progression/StageChapter";
import { StudyIndex } from "@/components/progression/StudyIndex";
import { StudyPalette } from "@/components/progression/StudyPalette";
import { TutorialView } from "@/components/TutorialView";

export function StudyMode({
  stages,
  tutorial,
  imageUrl,
  masterImageUrl,
  masterStatus,
  medium,
  compare,
  onCompareChange,
  referenceUrl,
  onRetryStage,
  retryingStage,
}: {
  stages: ProgressionStage[];
  tutorial: Tutorial;
  imageUrl: string;
  masterImageUrl?: string | null;
  masterStatus?: GenerationStatus;
  medium: Medium;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  onRetryStage?: (stageId: StageId) => void;
  retryingStage?: StageId | null;
}) {
  const [active, setActive] = useState(0);
  const [visitedMax, setVisitedMax] = useState(0);

  const finishedStage = stages.find((stage) => stage.id === "finished");

  // Prefer the validated master explicitly. Fall back to the finished-stage
  // target for older lessons whose master URL is already stored there.
  const finishedTargetUrl =
    masterImageUrl ??
    finishedStage?.visual.url ??
    null;

  const masterIsLoading =
    masterStatus === "pending" ||
    masterStatus === "generating";

  const selectStage = (index: number) => {
    if (stages.length === 0) {
      return;
    }

    const safeIndex = Math.max(
      0,
      Math.min(index, stages.length - 1),
    );

    setActive(safeIndex);
    setVisitedMax((current) => Math.max(current, safeIndex));

    const selectedStage = stages[safeIndex];

    requestAnimationFrame(() => {
      document
        .getElementById(`stage-${selectedStage.id}`)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    });
  };

  const reviewPreviousStage = (index: number) => {
    if (index > 0) {
      selectStage(index - 1);
    }
  };

const compareWithFinished = () => {
  onCompareChange?.("target");
};
  return (
    <div className="study-mode">
      <header className="atelier-cover">
        <p className="atelier-kicker">
          {tutorial.difficulty} · about {tutorial.estimatedMinutes} minutes ·{" "}
          {stages.length} stages
        </p>

        <h2 className="atelier-title">{tutorial.title}</h2>

        <p className="atelier-lead">{tutorial.overview}</p>
      </header>

      <section
        className="atelier-target"
        aria-labelledby="atelier-target-title"
      >
        <div className="atelier-target-heading">
          <p className="reference-eyebrow">Finished target</p>

          <h3 id="atelier-target-title">
            What you’re working toward
          </h3>

          <p className="atelier-target-description">
            Study the overall composition, value pattern, and focal point before
            beginning the first stage.
          </p>
        </div>

        {finishedTargetUrl ? (
          <figure className="atelier-target-figure">
            <div className="atelier-target-frame">
              <img
                src={finishedTargetUrl}
                alt={`Finished ${medium} painting target for ${tutorial.title}`}
                className="atelier-target-image"
                decoding="async"
              />
            </div>

            <figcaption className="atelier-target-caption">
              Your validated finished painting target
            </figcaption>
          </figure>
        ) : masterIsLoading ? (
          <div className="atelier-target-loading" role="status">
            <span className="spinner" aria-hidden="true" />
            <p>Preparing your finished painting target…</p>
          </div>
        ) : (
          <div className="atelier-target-loading" role="status">
            <p>The finished target is not available yet.</p>
          </div>
        )}
      </section>

      <StudyPalette tutorial={tutorial} />

      <StudyIndex
        stages={stages}
        active={active}
        visitedMax={visitedMax}
        onSelect={selectStage}
      />

      <div className="study-chapters">
        {stages.map((stage, index) => (
          <section
            key={stage.id}
            id={`stage-${stage.id}`}
            className="study-chapter"
          >
            <StageChapter
              stage={stage}
              tutorial={tutorial}
              medium={medium}
              referenceUrl={referenceUrl}
              compare={compare}
              onCompareChange={onCompareChange}
              onRetry={onRetryStage}
              retrying={retryingStage === stage.id}
              total={stages.length}
              isFirst={index === 0}
              isLast={index === stages.length - 1}
              nextStage={stages[index + 1]}
              onPrev={() => selectStage(index - 1)}
              onNext={() => selectStage(index + 1)}
              onReviewPrevious={() => reviewPreviousStage(index)}
              onCompareFinished={compareWithFinished}
            />
          </section>
        ))}
      </div>

      <hr className="atelier-rule" />

      <p className="reference-eyebrow">Reference &amp; analysis</p>

      <TutorialView
        tutorial={tutorial}
        imageUrl={imageUrl}
        medium={medium}
        showCover={false}
      />
    </div>
  );
}