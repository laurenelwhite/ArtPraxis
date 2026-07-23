"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import type { ProgressionStage } from "@/lib/progression";
import {
  STAGE_PROCESS_LABEL,
  STAGE_PROCESS_PURPOSE,
} from "@/lib/stage-icons";
import { AppImage } from "@/components/ui/AppImage";

type StepState = "current" | "completed" | "future";

function stepState(index: number, active: number, visitedMax: number): StepState {
  if (index === active) return "current";
  if (index <= visitedMax) return "completed";
  return "future";
}

/**
 * Process-led six-step stage navigator.
 * Desktop: horizontal process rail (number + icon + label; current expands with purpose).
 * Mobile: compact “‹ n of 6 · Label ›” controller + stage picker sheet.
 * Thumbnails are never the primary identifier.
 */
export function StageProcessRail({
  stages,
  active,
  visitedMax,
  onSelect,
  className,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  /** Optional; retained for API compatibility — not used as primary nav art. */
  masterImageUrl?: string | null;
  className?: string;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const closeSheet = useCallback(() => setSheetOpen(false), []);

  const total = stages.length;
  const safeActive = Math.max(0, Math.min(active, total - 1));
  const current = stages[safeActive];
  const currentLabel = current ? STAGE_PROCESS_LABEL[current.id] : "";

  function go(index: number) {
    if (index < 0 || index >= total) return;
    onSelect(index);
    setSheetOpen(false);
  }

  return (
    <nav
      className={["stage-process", "stage-journey", className].filter(Boolean).join(" ")}
      aria-label="Painting journey"
    >
      {/* Desktop / tablet process rail */}
      <ol className="stage-process-rail">
        {stages.map((stage, index) => {
          const state = stepState(index, safeActive, visitedMax);
          const label = STAGE_PROCESS_LABEL[stage.id];
          const purpose = STAGE_PROCESS_PURPOSE[stage.id];
          const isCurrent = state === "current";
          const isFinishedStep = stage.id === "finished";

          return (
            <li
              key={stage.id}
              className={[
                "stage-process-rail-item",
                isFinishedStep ? "is-finish-step" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              data-state={state}
            >
              {index > 0 && (
                <span
                  className={[
                    "stage-process-connector",
                    index <= Math.max(safeActive, visitedMax) ? "is-progressed" : "",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                  aria-hidden="true"
                />
              )}
              <button
                type="button"
                className={[
                  "stage-process-step",
                  `is-${state}`,
                  isFinishedStep ? "is-finish" : "",
                ]
                  .filter(Boolean)
                  .join(" ")}
                aria-current={isCurrent ? "step" : undefined}
                aria-label={`Stage ${stage.index}: ${label}. ${purpose}`}
                onClick={() => go(index)}
              >
                <span className="stage-process-step-mark" aria-hidden="true">
                  {state === "completed" ? (
                    <span className="stage-process-check">✓</span>
                  ) : isFinishedStep ? (
                    <span className="stage-process-finish-mark" />
                  ) : (
                    <span className="stage-process-step-num">{stage.index}</span>
                  )}
                </span>
                <span className="stage-process-step-label">{label}</span>
              </button>
            </li>
          );
        })}
      </ol>

      {/* Mobile compact controller */}
      <div className="stage-process-mobile">
        <div className="stage-process-mobile-bar">
          <button
            type="button"
            className="stage-process-mobile-nav"
            aria-label="Previous stage"
            disabled={safeActive <= 0}
            onClick={() => go(safeActive - 1)}
          >
            ‹
          </button>
          <button
            type="button"
            className="stage-process-mobile-current"
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
          >
            <span className="stage-process-mobile-count">
              {safeActive + 1} of {total}
            </span>
            <span className="stage-process-mobile-sep" aria-hidden="true">
              ·
            </span>
            <span className="stage-process-mobile-label">{currentLabel}</span>
          </button>
          <button
            type="button"
            className="stage-process-mobile-nav"
            aria-label="Next stage"
            disabled={safeActive >= total - 1}
            onClick={() => go(safeActive + 1)}
          >
            ›
          </button>
        </div>

        <button
          type="button"
          className="stage-process-segments"
          aria-label="Open stage list"
          onClick={() => setSheetOpen(true)}
        >
          {stages.map((stage, index) => {
            const state = stepState(index, safeActive, visitedMax);
            return (
              <span
                key={stage.id}
                className={`stage-process-segment is-${state}`}
                aria-hidden="true"
              />
            );
          })}
        </button>
      </div>

      {sheetOpen && (
        <StagePickerSheet
          stages={stages}
          active={safeActive}
          visitedMax={visitedMax}
          onSelect={go}
          onClose={closeSheet}
        />
      )}
    </nav>
  );
}

function StagePickerSheet({
  stages,
  active,
  visitedMax,
  onSelect,
  onClose,
}: {
  stages: ProgressionStage[];
  active: number;
  visitedMax: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}) {
  const titleId = useId();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("button")?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <div className="stage-picker-root" role="presentation">
      <button
        type="button"
        className="stage-picker-backdrop"
        aria-label="Close stage list"
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className="stage-picker-sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <div className="stage-picker-head">
          <h2 id={titleId} className="stage-picker-title">
            Lesson stages
          </h2>
          <button
            type="button"
            className="stage-picker-close"
            aria-label="Close"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <ol className="stage-picker-list">
          {stages.map((stage, index) => {
            const state = stepState(index, active, visitedMax);
            const label = STAGE_PROCESS_LABEL[stage.id];
            const purpose = STAGE_PROCESS_PURPOSE[stage.id];
            const thumb = stage.visual.url;
            return (
              <li key={stage.id}>
                <button
                  type="button"
                  className={`stage-picker-item is-${state}`}
                  aria-current={state === "current" ? "step" : undefined}
                  onClick={() => onSelect(index)}
                >
                  <span className="stage-picker-index" aria-hidden="true">
                    {state === "completed" ? "✓" : stage.index}
                  </span>
                  <span className="stage-picker-copy">
                    <span className="stage-picker-label">{label}</span>
                    <span className="stage-picker-purpose">{purpose}</span>
                  </span>
                  {thumb ? (
                    // Secondary only — labels/icons remain primary.
                    <AppImage
                      src={thumb}
                      alt=""
                      className="stage-picker-thumb"
                      width={40}
                      height={40}
                      sizes="40px"
                    />
                  ) : (
                    <span className="stage-picker-thumb is-empty" aria-hidden="true" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}