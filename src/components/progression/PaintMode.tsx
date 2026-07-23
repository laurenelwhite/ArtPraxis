"use client";

import { useEffect, useState } from "react";
import type { Medium, Tutorial } from "@/lib/tutorial-schema";
import type { ProgressionStage, StageId } from "@/lib/progression";
import { useActiveStage } from "@/components/progression/useActiveStage";
import { StageNav } from "@/components/progression/StageNav";
import { DeskStage } from "@/components/progression/DeskStage";
import type { CompareMode } from "@/components/progression/StageComparison";

export function PaintMode({
  stages,
  tutorial,
  medium,
  compare,
  onCompareChange,
  referenceUrl,
  masterImageUrl,
  onRetryStage,
  retryingStage,
}: {
  stages: ProgressionStage[];
  tutorial: Tutorial;
  medium: Medium;
  compare: CompareMode;
  onCompareChange?: (mode: CompareMode) => void;
  referenceUrl: string;
  masterImageUrl?: string | null;
  onRetryStage?: (stageId: StageId) => void;
  retryingStage?: StageId | null;
}) {
  const domIds = stages.map((s) => `stage-${s.id}`);
  const { active, scrollTo, setRef } = useActiveStage(domIds);
  const [visitedMax, setVisitedMax] = useState(0);

  useEffect(() => {
    setVisitedMax((m) => Math.max(m, active));
  }, [active]);

  function scrollToCompare(stageId: StageId) {
    const el = document.getElementById(`${stageId}-compare`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  return (
    <div className="paint-mode desk">
      <StageNav
        stages={stages}
        active={active}
        visitedMax={visitedMax}
        onSelect={scrollTo}
        masterImageUrl={masterImageUrl}
      />

      <div className="desk-stages">
        {stages.map((stage, i) => (
          <section
            key={stage.id}
            id={domIds[i]}
            ref={setRef(i)}
            className="desk-stage"
            aria-label={`${stage.title} — stage ${stage.index} of ${stages.length}`}
          >
            <DeskStage
              stage={stage}
              tutorial={tutorial}
              medium={medium}
              total={stages.length}
              isFirst={i === 0}
              isLast={i === stages.length - 1}
              nextStage={stages[i + 1]}
              onPrev={() => scrollTo(i - 1)}
              onNext={() => scrollTo(i + 1)}
              onReviewPrevious={() => scrollTo(Math.max(0, i - 1))}
              onCompareFinished={() => scrollToCompare("finished")}
              compare={compare}
              onCompareChange={onCompareChange}
              referenceUrl={referenceUrl}
              onRetry={onRetryStage}
              retrying={retryingStage === stage.id}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
