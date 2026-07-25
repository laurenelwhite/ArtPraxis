"use client";

import { useEffect, useState } from "react";
import {
  REGENERATION_CHECKLIST,
  checklistPhaseForState,
  formatRegenerationElapsed,
  regenerationStatusCopy,
  type FinalPaintingRegenerationState,
  type RegenerationChecklistPhase,
} from "@/lib/final-painting-regeneration";

type Props = {
  state: FinalPaintingRegenerationState;
  phase?: RegenerationChecklistPhase | null;
  startedAt?: number | null;
  error?: string | null;
  medium?: string | null;
  onRetry?: () => void;
  compact?: boolean;
  className?: string;
};

/**
 * Compact Final Painting regeneration status — attached to the artwork dock/frame.
 * Indeterminate checklist (no fake %), elapsed after ~15s, polite aria-live for phases only.
 */
export function FinalPaintingRegenStatus({
  state,
  phase = null,
  startedAt = null,
  error = null,
  medium = null,
  onRetry,
  compact = false,
  className,
}: Props) {
  const [now, setNow] = useState(() => Date.now());
  const active = checklistPhaseForState(state, phase);
  const copy = regenerationStatusCopy(state, medium);
  const elapsed = formatRegenerationElapsed(startedAt, now);
  const showChecklist =
    state === "queued" ||
    state === "generating" ||
    state === "validating" ||
    state === "applying";

  useEffect(() => {
    if (!startedAt || state === "idle" || state === "candidateReady") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [startedAt, state]);

  if (state === "idle") return null;

  const title =
    state === "error" && error?.trim()
      ? error.trim()
      : copy.title;

  return (
    <div
      className={[
        "fp-regen-status",
        compact ? "fp-regen-status--compact" : null,
        `fp-regen-status--${state}`,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="fp-regen-status-head">
        {showChecklist ? (
          <span className="fp-regen-status-pulse" aria-hidden="true" />
        ) : null}
        <div className="fp-regen-status-copy">
          <p className="fp-regen-status-title" aria-live="polite">
            {title}
          </p>
          {copy.reassurance ? (
            <p className="fp-regen-status-reassure">{copy.reassurance}</p>
          ) : null}
          {showChecklist ? (
            <p className="fp-regen-status-wait">This can take a few minutes.</p>
          ) : null}
          {elapsed ? (
            <p className="fp-regen-status-elapsed" aria-hidden="true">
              {elapsed}
            </p>
          ) : null}
        </div>
      </div>

      {showChecklist ? (
        <ol className="fp-regen-checklist" aria-label="Regeneration progress">
          {REGENERATION_CHECKLIST.map((step) => {
            const stepIndex = REGENERATION_CHECKLIST.findIndex((s) => s.id === step.id);
            const activeIndex = active
              ? REGENERATION_CHECKLIST.findIndex((s) => s.id === active)
              : -1;
            const done = activeIndex > stepIndex;
            const isActive = active === step.id;
            return (
              <li
                key={step.id}
                className={[
                  "fp-regen-checklist-item",
                  done ? "is-done" : null,
                  isActive ? "is-active" : null,
                ]
                  .filter(Boolean)
                  .join(" ")}
              >
                <span className="fp-regen-checklist-mark" aria-hidden="true" />
                <span>{step.label}</span>
              </li>
            );
          })}
        </ol>
      ) : null}

      {state === "error" && onRetry ? (
        <button type="button" className="secondary fp-regen-retry" onClick={onRetry}>
          Try again
        </button>
      ) : null}
    </div>
  );
}
