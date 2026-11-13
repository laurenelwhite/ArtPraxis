/**
 * Structured composition-consistency validation for the stage-image pipeline.
 *
 * Distinguishes hard composition failures from acceptable artistic differences.
 * Watercolor style, color, texture, lighting interpretation, and loss of small
 * detail are NEVER hard-fails. Only crop/aspect, major subjects, perspective,
 * and embedded text can hard-fail the pipeline.
 *
 * Horizon is context-aware and advisory: it never hard-fails on its own (and
 * never triggers a costly master regeneration). Close-ups / macros / portraits /
 * still lifes / interiors without a visible horizon → not_applicable.
 */

export type CheckSeverity = "pass" | "warning" | "hard_fail";
export type ValidationSeverity = "pass" | "warning" | "hard_fail";
export type ValidationVerdict = "accept" | "needs_review";
/** Whether a clear environmental / architectural horizon was judged. */
export type HorizonApplicability = "evaluated" | "not_applicable" | "advisory_only";

export interface ValidationChecks {
  crop: CheckSeverity;
  aspectRatio: CheckSeverity;
  subjectCount: CheckSeverity;
  subjectPlacement: CheckSeverity;
  perspective: CheckSeverity;
  horizon: CheckSeverity;
  embeddedText: CheckSeverity;
}

export interface CompositionValidation {
  verdict: ValidationVerdict;
  severity: ValidationSeverity;
  reasons: string[];
  checks: ValidationChecks;
  /** How the horizon check was treated after context-aware normalization. */
  horizonApplicability: HorizonApplicability;
}

const CHECK_KEYS = [
  "crop",
  "aspectRatio",
  "subjectCount",
  "subjectPlacement",
  "perspective",
  "horizon",
  "embeddedText",
] as const;

type CheckKey = (typeof CHECK_KEYS)[number];

const PASS_CHECKS: ValidationChecks = {
  crop: "pass",
  aspectRatio: "pass",
  subjectCount: "pass",
  subjectPlacement: "pass",
  perspective: "pass",
  horizon: "pass",
  embeddedText: "pass",
};

const CHECK_REASON: Record<CheckKey, Record<"warning" | "hard_fail", string>> = {
  crop: {
    warning: "Crop / framing differs slightly from the anchor.",
    hard_fail: "Crop / framing materially changed from the anchor.",
  },
  aspectRatio: {
    warning: "Aspect ratio differs slightly from the anchor.",
    hard_fail: "Aspect ratio materially different from the anchor.",
  },
  subjectCount: {
    warning: "Minor uncertainty about major subject count.",
    hard_fail: "A major subject was added or removed.",
  },
  subjectPlacement: {
    warning: "Slight shift in major subject placement.",
    hard_fail: "A major subject was materially repositioned or resized.",
  },
  perspective: {
    warning: "Minor perspective ambiguity versus the anchor.",
    hard_fail: "Perspective / vanishing structure materially changed.",
  },
  horizon: {
    warning: "Horizon / eye level slightly ambiguous versus the anchor.",
    hard_fail: "Horizon line materially tilted or moved.",
  },
  embeddedText: {
    warning: "Possible text-like marks (uncertain).",
    hard_fail: "Embedded text, letters, numbers, or watermark detected.",
  },
};

function asSeverity(v: unknown): CheckSeverity | null {
  if (v === "pass" || v === "warning" || v === "hard_fail") return v;
  if (v === "not_applicable" || v === "n/a" || v === "na" || v === "N/A") return "pass";
  if (v === true || v === "ok" || v === "match") return "pass";
  if (v === false || v === "fail" || v === "mismatch") return "hard_fail";
  return null;
}

function isNotApplicableToken(v: unknown): boolean {
  return v === "not_applicable" || v === "n/a" || v === "na" || v === "N/A";
}

/**
 * Horizon never hard-fails the pipeline. Downgrade hard_fail → warning
 * (advisory_only). Explicit not_applicable → pass.
 */
function normalizeHorizonCheck(
  rawValue: unknown,
  parsed: CheckSeverity,
): { severity: CheckSeverity; applicability: HorizonApplicability } {
  if (isNotApplicableToken(rawValue)) {
    return { severity: "pass", applicability: "not_applicable" };
  }
  if (parsed === "hard_fail") {
    return { severity: "warning", applicability: "advisory_only" };
  }
  if (parsed === "warning") {
    return { severity: "warning", applicability: "evaluated" };
  }
  return { severity: "pass", applicability: "evaluated" };
}

function logHorizonApplicability(applicability: HorizonApplicability, before: CheckSeverity, after: CheckSeverity): void {
  console.warn(
    JSON.stringify({
      scope: "composition_validation",
      event: "horizon_check",
      horizon: applicability,
      evaluated: applicability === "evaluated",
      not_applicable: applicability === "not_applicable",
      advisory_only: applicability === "advisory_only",
      before,
      after,
    }),
  );
}

function worst(...severities: CheckSeverity[]): ValidationSeverity {
  if (severities.includes("hard_fail")) return "hard_fail";
  if (severities.includes("warning")) return "warning";
  return "pass";
}

/** Fill reasons from checks when the model omits them. */
export function synthesizeReasons(checks: ValidationChecks, existing: string[]): string[] {
  if (existing.length > 0) return existing;
  const out: string[] = [];
  for (const key of CHECK_KEYS) {
    const s = checks[key];
    if (s === "warning" || s === "hard_fail") out.push(CHECK_REASON[key][s]);
  }
  return out;
}

/** Prompt for the vision model. Returns structured JSON only. */
export const COMPOSITION_VALIDATOR_PROMPT = `You are a composition QA checker for an art-instruction image pipeline.

The FIRST image is the composition ANCHOR (reference or master).
The SECOND image is a CANDIDATE (master painting or derived stage demonstration).

Your job is to judge COMPOSITION LOCK only — not artistic quality.

IGNORE completely (never mark these as hard_fail; do not list them in reasons):
- watercolor / paint style and medium look
- color changes, color simplification, palette shifts
- texture, paper grain, brushwork, granulation
- lighting interpretation and value mood
- loss of small detail, facial detail, fine edges
- simplified forms that preserve major subject placement
- unfinished or stage-appropriate incompleteness

HARD-FAIL a check only when that specific issue is clearly true:
- crop: framing / scene edges materially changed
- aspectRatio: canvas proportion materially different
- subjectCount: a major subject was ADDED, DELETED, or DUPLICATED as a different object
- subjectPlacement: a major subject was materially repositioned or resized as a different layout
- perspective: vanishing-point structure materially changed
- embeddedText: any letters, numbers, words, watermarks, or captions appear

HORIZON (context-aware — never hard_fail):
- Set horizon to "not_applicable" when EITHER image lacks a clear environmental horizon or dominant architectural horizontal (close-ups, macro, portraits, still lifes, top-down views, interiors without a visible horizon, abstract compositions).
- Only evaluate horizon when a clear environmental horizon OR dominant architectural horizontal exists in BOTH the anchor and the candidate.
- When evaluated, material tilt/move → "warning" only (never "hard_fail"). Horizon alone must never force needs_review.

Minor differences → warning on the relevant check, not hard_fail.
If uncertain, prefer warning over hard_fail.
If the only differences are style/color/texture/detail/lighting, every check must be "pass" and severity must be "pass".

Reply ONLY with JSON in this exact shape (all fields required):
{
  "verdict": "accept" | "needs_review",
  "severity": "pass" | "warning" | "hard_fail",
  "reasons": ["short concrete composition reason", "..."],
  "checks": {
    "crop": "pass" | "warning" | "hard_fail",
    "aspectRatio": "pass" | "warning" | "hard_fail",
    "subjectCount": "pass" | "warning" | "hard_fail",
    "subjectPlacement": "pass" | "warning" | "hard_fail",
    "perspective": "pass" | "warning" | "hard_fail",
    "horizon": "pass" | "warning" | "not_applicable",
    "embeddedText": "pass" | "warning" | "hard_fail"
  }
}

Rules:
- reasons MUST name the composition issue when severity is warning or hard_fail (never empty in those cases).
- reasons must NEVER mention watercolor style, color, texture, lighting, or lost detail.
- Do NOT list horizon tilt in reasons when horizon is not_applicable.
- severity must equal the worst check (hard_fail > warning > pass). Horizon is never hard_fail.
- verdict is "accept" for pass/warning, "needs_review" only for hard_fail.`;

/**
 * Stage-aware composition prompt: pale/outlined subjects are allowed, but
 * genuinely missing, moved, duplicated, or resized subjects still hard-fail.
 * Does NOT globally downgrade subjectCount/subjectPlacement.
 */
export function compositionValidatorPromptForStage(
  stageId: "pencil-sketch" | "value-study" | "first-wash" | "second-wash" | "refinement" | "finished" | "master",
): string {
  if (stageId === "master" || stageId === "finished") {
    return COMPOSITION_VALIDATOR_PROMPT;
  }

  const paleRule =
    stageId === "pencil-sketch"
      ? "Hollow outlines / pale graphite contours where the anchor is filled paint are EXPECTED. That is not subject removal."
      : "Pale washes, missing interior fill, reduced opacity, and simplified masses vs a finished anchor are EXPECTED for this in-progress stage. That is not subject removal.";

  return `You are a composition QA checker for an art-instruction PROGRESSIVE STAGE image (${stageId}).

The FIRST image is the composition ANCHOR (prefer the prior stage when provided; otherwise the master).
The SECOND image is the CANDIDATE for this stage.

Judge COMPOSITION LOCK only.

STAGE-AWARE SUBJECT RULES:
- ${paleRule}
- ALLOW: outlined, pale, translucent, or unfinished versions of the SAME subjects in the SAME places.
- HARD-FAIL subjectCount when a major subject is genuinely MISSING, ADDED as a new object, or DUPLICATED.
- HARD-FAIL subjectPlacement when a major subject is MOVEd, RESIZED, or rearranged into a different layout.
- Do NOT hard-fail merely because paint is lighter, emptier, or less finished than the anchor.

Also hard-fail when clearly true:
- crop / aspectRatio / perspective materially changed
- embeddedText present

HORIZON (context-aware — never hard_fail):
- "not_applicable" when either image has no clear environmental horizon / dominant architectural horizontal (close-ups, macro, portraits, still lifes, top-down, interiors without horizon, abstract).
- Only evaluate when a clear horizon exists in BOTH images; material tilt → "warning" only.

IGNORE: style, color, texture, lighting, fine detail loss, stage incompleteness.

Reply ONLY with JSON:
{
  "verdict": "accept" | "needs_review",
  "severity": "pass" | "warning" | "hard_fail",
  "reasons": ["..."],
  "checks": {
    "crop": "pass" | "warning" | "hard_fail",
    "aspectRatio": "pass" | "warning" | "hard_fail",
    "subjectCount": "pass" | "warning" | "hard_fail",
    "subjectPlacement": "pass" | "warning" | "hard_fail",
    "perspective": "pass" | "warning" | "hard_fail",
    "horizon": "pass" | "warning" | "not_applicable",
    "embeddedText": "pass" | "warning" | "hard_fail"
  }
}

severity = worst check (horizon never hard_fail). verdict accept for pass/warning, needs_review for hard_fail.`;
}

/**
 * Normalize a raw model JSON payload into a CompositionValidation.
 * Re-derives severity from checks. Synthesizes reasons when the model omits them.
 * Horizon is context-aware and never contributes a pipeline hard_fail.
 */
export function normalizeValidation(raw: unknown): CompositionValidation {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const checksRaw = (obj.checks && typeof obj.checks === "object" ? obj.checks : {}) as Record<string, unknown>;

  const checks = { ...PASS_CHECKS };
  for (const key of CHECK_KEYS) {
    if (key === "horizon") continue;
    const s = asSeverity(checksRaw[key]);
    if (s) checks[key] = s;
  }

  const horizonParsed = asSeverity(checksRaw.horizon) ?? "pass";
  const horizonBefore: CheckSeverity =
    isNotApplicableToken(checksRaw.horizon)
      ? "pass"
      : horizonParsed === "hard_fail"
        ? "hard_fail"
        : horizonParsed;
  const { severity: horizonSeverity, applicability: horizonApplicability } = normalizeHorizonCheck(
    checksRaw.horizon,
    horizonParsed,
  );
  checks.horizon = horizonSeverity;
  logHorizonApplicability(horizonApplicability, horizonBefore, horizonSeverity);

  // Legacy boolean fields (old prompts) → map into checks WITH reasons later.
  if (obj.compositionMatches === false) {
    if (checks.crop === "pass") checks.crop = "hard_fail";
    if (checks.perspective === "pass") checks.perspective = "hard_fail";
  }
  if (obj.subjectsChanged === true) {
    if (checks.subjectCount === "pass") checks.subjectCount = "hard_fail";
    if (checks.subjectPlacement === "pass") checks.subjectPlacement = "hard_fail";
  }
  if (obj.hasText === true) {
    checks.embeddedText = "hard_fail";
  }

  // If the model only set top-level severity with no per-check detail, treat
  // claimed hard_fail without checks as warning (uncertain) — never invent a
  // silent composition hard-fail. Claimed warning stays warning.
  let severity = worst(...CHECK_KEYS.map((k) => checks[k]));
  const claimed = asSeverity(obj.severity);
  if (severity === "pass" && claimed === "warning") severity = "warning";
  if (severity === "pass" && claimed === "hard_fail") {
    // No check failed, but model claimed hard_fail → downgrade to warning and
    // leave a reason so logs are never empty.
    severity = "warning";
  }

  // Horizon-only hard_fail from the model (before normalization) must never
  // leave severity as hard_fail — already enforced by checks.horizon ≤ warning.
  // Extra guard: if claimed hard_fail and only horizon was at issue in reasons.
  const modelReasons = Array.isArray(obj.reasons)
    ? obj.reasons.filter((r): r is string => typeof r === "string" && r.trim().length > 0).map((r) => r.trim())
    : [];

  // Filter out artistic-difference reasons the model may still emit.
  const ARTISTIC = /\b(style|watercolor|colour|color|texture|lighting|detail|brushwork|palette|granulation|facial)\b/i;
  let filtered = modelReasons.filter((r) => !ARTISTIC.test(r));

  // Drop horizon tilt reasons when horizon is not applicable.
  if (horizonApplicability === "not_applicable") {
    filtered = filtered.filter((r) => !/\bhorizon\b/i.test(r));
  }

  // If the model hard-failed solely on horizon, strip hard-fail phrasing from
  // reasons when we downgraded to advisory (keep a softer advisory reason).
  if (horizonApplicability === "advisory_only") {
    const onlyHorizonHard =
      CHECK_KEYS.filter((k) => k !== "horizon").every((k) => checks[k] === "pass" || checks[k] === "warning") &&
      !CHECK_KEYS.filter((k) => k !== "horizon").some((k) => checks[k] === "hard_fail");
    if (onlyHorizonHard) {
      filtered = filtered
        .map((r) =>
          /\bhorizon\b/i.test(r)
            ? "Horizon / eye level differs slightly from the anchor (advisory; not a hard fail)."
            : r,
        )
        .filter((r, i, arr) => arr.indexOf(r) === i);
      if (severity === "hard_fail") severity = "warning";
    }
  }

  let reasons = synthesizeReasons(checks, filtered);
  if (severity !== "pass" && reasons.length === 0) {
    reasons =
      claimed === "hard_fail"
        ? ["Model claimed a composition hard-fail without naming a check; treated as warning."]
        : ["Minor composition uncertainty (model did not name a specific check)."];
  }

  // If we downgraded a claimed hard_fail with no failing checks, keep warning reasons.
  if (severity === "warning" && claimed === "hard_fail" && CHECK_KEYS.every((k) => checks[k] === "pass")) {
    reasons =
      filtered.length > 0
        ? filtered
        : ["Model claimed hard-fail without check evidence; continuing as warning."];
  }

  return {
    verdict: severity === "hard_fail" ? "needs_review" : "accept",
    severity,
    reasons,
    checks,
    horizonApplicability,
  };
}

/** Validator errors must not block the pipeline — treat as soft accept. */
export function validationOnError(err: unknown): CompositionValidation {
  const message = err instanceof Error ? err.message : "validator_error";
  return {
    verdict: "accept",
    severity: "warning",
    reasons: [`Validator unavailable (${message}); accepting candidate.`],
    checks: { ...PASS_CHECKS },
    horizonApplicability: "not_applicable",
  };
}

export function isHardFail(v: CompositionValidation): boolean {
  return v.severity === "hard_fail";
}

export function isAcceptable(v: CompositionValidation): boolean {
  return v.severity === "pass" || v.severity === "warning";
}

/** Higher is better — used to keep the best rejected candidate across retries. */
export function scoreValidation(v: CompositionValidation): number {
  let score = 0;
  for (const key of CHECK_KEYS) {
    const s = v.checks[key];
    if (s === "pass") score += 4;
    else if (s === "warning") score += 1;
    else score -= 6;
  }
  if (v.severity === "pass") score += 10;
  else if (v.severity === "warning") score += 3;
  return score;
}

const USER_CHECK_COPY: Record<CheckKey, Record<"warning" | "hard_fail", string>> = {
  crop: {
    warning: "The framing is slightly tighter or looser than the reference.",
    hard_fail: "The crop no longer matches the reference.",
  },
  aspectRatio: {
    warning: "The canvas shape is slightly different from the reference.",
    hard_fail: "The aspect ratio does not match the reference.",
  },
  subjectCount: {
    warning: "A few small elements may be hard to count against the reference.",
    hard_fail: "A major subject looks added or missing compared with the reference.",
  },
  subjectPlacement: {
    warning: "Some elements sit slightly differently than in the reference.",
    hard_fail: "Major elements were moved, resized, or rearranged.",
  },
  perspective: {
    warning: "Perspective reads a little differently than the reference.",
    hard_fail: "The perspective no longer matches the reference.",
  },
  horizon: {
    warning: "The horizon or eye level is slightly off.",
    hard_fail: "The horizon or eye level changed.",
  },
  embeddedText: {
    warning: "There may be marks that look like lettering.",
    hard_fail: "The image contains text or lettering.",
  },
};

/**
 * Concise, user-facing reasons for the Review master panel.
 * Prefers check-based copy; falls back to sanitized model reasons.
 */
export function userFacingReasons(v: CompositionValidation | null | undefined): string[] {
  if (!v) return [];
  const fromChecks: string[] = [];
  for (const key of CHECK_KEYS) {
    const s = v.checks[key];
    if (s === "warning" || s === "hard_fail") fromChecks.push(USER_CHECK_COPY[key][s]);
  }
  if (fromChecks.length > 0) return fromChecks.slice(0, 4);

  const ARTISTIC = /\b(style|watercolor|colour|color|texture|lighting|detail|brushwork|palette|granulation|facial)\b/i;
  return v.reasons.filter((r) => !ARTISTIC.test(r)).slice(0, 4);
}
