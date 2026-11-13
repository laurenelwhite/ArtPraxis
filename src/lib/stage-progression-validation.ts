/**
 * Independent categorical validation for progressive stage images.
 *
 * Categories (scored separately, then combined):
 * 1. Structural Fidelity — composition, crop, perspective, placement, shapes
 * 2. Stage Progress — expected additions for THIS stage only
 * 3. Premature Detail — information that belongs to later stages
 * 4. Prior Mark Retention — previous stage remains visible
 *
 * Early stages are judged by whether they correctly extend the PRIOR stage,
 * never by similarity to the finished master. Intentional incompleteness is
 * compatible with PASS on every category.
 */

import "server-only";

import type { StageId } from "@/lib/progression";
import { STAGE_COMPLETION_TARGET } from "@/lib/stage-image-prompts";
import type {
  CheckSeverity,
  CompositionValidation,
  ValidationSeverity,
} from "@/lib/composition-validation";
import type { StructureSimilarityResult } from "@/lib/stage-structure-similarity";
import { isStructureAcceptable } from "@/lib/stage-structure-similarity";

/** Re-export for server callers that previously imported from this module. */
export { STAGE_COMPLETION_TARGET };

export type CategoryId =
  | "structuralFidelity"
  | "stageProgress"
  | "prematureDetail"
  | "priorMarkRetention";

export interface CategoryScore {
  id: CategoryId;
  severity: ValidationSeverity;
  reasons: string[];
}

/** Legacy check bag kept for API compatibility with older clients/logs. */
export type StageProgressCheck =
  | "stageCompletion"
  | "prematureDetail"
  | "priorMarksRetained"
  | "monotonicProgress"
  | "sketchLightness"
  | "washTransparency"
  | "structuralFidelity";

export interface StageProgressValidation {
  severity: ValidationSeverity;
  reasons: string[];
  checks: Record<StageProgressCheck, CheckSeverity>;
  /** Independent category scores — source of truth for accept/reject. */
  categories: Record<CategoryId, CategoryScore>;
  /** True when overall decision accepts the candidate. */
  acceptable: boolean;
}

function asSeverity(v: unknown): CheckSeverity | null {
  if (v === "pass" || v === "warning" || v === "hard_fail") return v;
  return null;
}

function worst(...severities: CheckSeverity[]): ValidationSeverity {
  if (severities.includes("hard_fail")) return "hard_fail";
  if (severities.includes("warning")) return "warning";
  return "pass";
}

function expectedAddition(stageId: StageId): string {
  switch (stageId) {
    case "pencil-sketch":
      return "very light graphite contours of major shapes only";
    case "value-study":
      return "3–5 broad pale neutral value masses under/around existing sketch lines";
    case "first-wash":
      return "pale transparent color washes over existing marks for large masses only";
    case "second-wash":
      return "selected deepening of existing midtones/shadows while preserving lights";
    case "refinement":
      return "selective focal accents and limited edge control; secondary areas stay loose";
    default:
      return "stage-appropriate paint work";
  }
}

/**
 * Vision prompt: four INDEPENDENT category scores.
 * Categories must not borrow severity from each other.
 */
export function stageCategoryValidatorPrompt(stageId: StageId): string {
  const target = STAGE_COMPLETION_TARGET[stageId];
  const addition = expectedAddition(stageId);

  if (stageId === "pencil-sketch") {
    return `You score FOUR INDEPENDENT categories for a pencil transfer sketch.

Images:
1) COMPOSITION ANCHOR (master or reference) — for structural placement only
2) CANDIDATE sketch

CRITICAL RULES:
- Score each category independently. A PASS in one category must never force FAIL in another.
- Intentional incompleteness (~5% contour only) is EXPECTED and can PASS every category.
- Do NOT judge the sketch by how finished the master looks.

Categories:
1) structuralFidelity — crop, perspective, subject placement, dominant shape silhouettes match the anchor. Hollow outlines where the anchor is filled paint = PASS (not subject removal).
2) stageProgress — candidate shows the expected addition for this stage: ${addition}. Very incomplete is PASS if it is a light construction drawing.
3) prematureDetail — FAIL only if tonal shading, dense edges, gray fill masses, or photo-filter look appear. Sparse pale contours = PASS.
4) priorMarkRetention — N/A for sketch (always pass).

Reply ONLY JSON:
{
  "categories": {
    "structuralFidelity": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] },
    "stageProgress": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] },
    "prematureDetail": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] },
    "priorMarkRetention": { "severity": "pass", "reasons": [] }
  }
}`;
  }

  return `You score FOUR INDEPENDENT categories for progressive stage "${stageId}".

Images in order:
1) PRIOR STAGE — the in-progress painting being extended (PRIMARY reference for all judgments)
2) CANDIDATE — the proposed next stage

Optional context (ignore for finish-level judgments): a finished master may be described in text only; do NOT compare finish level to a finished painting.

Target: ${target}
Expected addition this stage: ${addition}

CRITICAL RULES:
- Score each category independently. Never let one category's FAIL contaminate another.
- Intentional incompleteness is compatible with PASS on structuralFidelity, stageProgress, prematureDetail, and priorMarkRetention.
- Judge ONLY whether the candidate correctly EXTENDS the PRIOR stage.
- Do NOT require resemblance to a finished painting.

1) structuralFidelity
   PASS when crop, perspective, subject placement, and dominant shapes match the PRIOR.
   Pale/outlined/unfinished versions of the same subjects in the same places = PASS.
   HARD-FAIL only when subjects are genuinely missing, added, duplicated, moved, or resized, or crop/perspective materially changes.

2) stageProgress
   PASS when the candidate shows the expected addition for THIS stage only (see above), even if still very incomplete.
   WARNING if the addition is weak/unclear but directionally correct.
   HARD-FAIL only if the candidate resets to a new interpretation OR looks LESS complete than the prior with no new layer of work.
   Looking more complete than the prior is never a hard_fail by itself.

3) prematureDetail
   HARD-FAIL only when information belonging to LATER stages dominates (final accents, opaque finish, full texture, equal detail everywhere).
   PASS when the image stays appropriately incomplete for ${stageId}.

4) priorMarkRetention
   PASS when prior-stage marks remain visible or softly integrated under the new layer.
   HARD-FAIL only when the prior foundation is fully discarded / replaced by a new painting.

Reply ONLY JSON:
{
  "categories": {
    "structuralFidelity": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] },
    "stageProgress": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] },
    "prematureDetail": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] },
    "priorMarkRetention": { "severity": "pass"|"warning"|"hard_fail", "reasons": ["..."] }
  }
}`;
}

/** @deprecated Use stageCategoryValidatorPrompt — kept for any external imports. */
export function stageProgressionValidatorPrompt(stageId: StageId): string {
  return stageCategoryValidatorPrompt(stageId);
}

function emptyCategory(id: CategoryId, severity: ValidationSeverity = "pass"): CategoryScore {
  return { id, severity, reasons: [] };
}

function normalizeCategory(
  id: CategoryId,
  raw: unknown,
): CategoryScore {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const severity = asSeverity(obj.severity) ?? "pass";
  const reasons = Array.isArray(obj.reasons)
    ? obj.reasons.filter((r): r is string => typeof r === "string" && r.trim().length > 0).map((r) => r.trim())
    : [];
  return { id, severity, reasons };
}

/**
 * Merge measured edge-structure similarity into structuralFidelity /
 * priorMarkRetention without globally weakening other categories.
 */
export function applyMeasuredStructure(
  categories: Record<CategoryId, CategoryScore>,
  stageId: StageId,
  measured: StructureSimilarityResult | null,
): Record<CategoryId, CategoryScore> {
  if (!measured || stageId === "pencil-sketch" || stageId === "finished") {
    return categories;
  }

  const next = { ...categories };
  const ok = isStructureAcceptable(stageId, measured);

  if (!ok) {
    // Measured layout break reinforces structural hard_fail (does not soften others).
    if (next.structuralFidelity.severity !== "hard_fail") {
      next.structuralFidelity = {
        id: "structuralFidelity",
        severity: "hard_fail",
        reasons: [
          ...next.structuralFidelity.reasons,
          `Measured structure vs prior too low (score ${measured.score.toFixed(3)}).`,
        ],
      };
    }
    if (next.priorMarkRetention.severity === "pass") {
      next.priorMarkRetention = {
        id: "priorMarkRetention",
        severity: "warning",
        reasons: [
          ...next.priorMarkRetention.reasons,
          `Low structure correlation vs prior (${measured.score.toFixed(3)}).`,
        ],
      };
    }
    return next;
  }

  // Strong measured retention: if vision alone hard-failed prior marks while
  // edges still match, keep priorMarkRetention as warning (evidence conflict),
  // do NOT touch prematureDetail or stageProgress.
  if (next.priorMarkRetention.severity === "hard_fail") {
    next.priorMarkRetention = {
      id: "priorMarkRetention",
      severity: "warning",
      reasons: [
        ...next.priorMarkRetention.reasons.filter((r) => !/discard/i.test(r)),
        `Vision prior-mark fail reconciled with measured structure score ${measured.score.toFixed(3)} (warning).`,
      ],
    };
  }

  // Strong structure supports structural PASS/WARNING — never upgrade a genuine
  // subject-move hard_fail from vision; only fill empty structural score.
  if (next.structuralFidelity.severity === "pass" || next.structuralFidelity.severity === "warning") {
    next.structuralFidelity = {
      ...next.structuralFidelity,
      reasons: [
        ...next.structuralFidelity.reasons,
        `Measured structure vs prior: ${measured.score.toFixed(3)}.`,
      ],
    };
  }

  return next;
}

/**
 * Combine independent category scores.
 * A stage is acceptable when no category is hard_fail.
 * Intentional incompleteness can yield all PASS.
 */
export function combineCategoryDecision(
  categories: Record<CategoryId, CategoryScore>,
): { acceptable: boolean; severity: ValidationSeverity; reasons: string[] } {
  const order: CategoryId[] = [
    "structuralFidelity",
    "stageProgress",
    "prematureDetail",
    "priorMarkRetention",
  ];
  const severities = order.map((id) => categories[id].severity);
  const severity = worst(...severities);
  const reasons = order.flatMap((id) =>
    categories[id].reasons.map((r) => `[${id}] ${r}`),
  );
  return {
    acceptable: severity === "pass" || severity === "warning",
    severity,
    reasons,
  };
}

function categoriesToLegacyChecks(
  categories: Record<CategoryId, CategoryScore>,
): Record<StageProgressCheck, CheckSeverity> {
  return {
    structuralFidelity: categories.structuralFidelity.severity,
    stageCompletion: categories.stageProgress.severity,
    monotonicProgress: categories.stageProgress.severity,
    prematureDetail: categories.prematureDetail.severity,
    priorMarksRetained: categories.priorMarkRetention.severity,
    sketchLightness: "pass",
    washTransparency: "pass",
  };
}

/** Normalize vision JSON (new categories shape or legacy checks) into StageProgressValidation. */
export function normalizeStageProgressValidation(raw: unknown): StageProgressValidation {
  const obj = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const catsRaw =
    obj.categories && typeof obj.categories === "object"
      ? (obj.categories as Record<string, unknown>)
      : null;

  let categories: Record<CategoryId, CategoryScore>;

  if (catsRaw) {
    categories = {
      structuralFidelity: normalizeCategory("structuralFidelity", catsRaw.structuralFidelity),
      stageProgress: normalizeCategory("stageProgress", catsRaw.stageProgress),
      prematureDetail: normalizeCategory("prematureDetail", catsRaw.prematureDetail),
      priorMarkRetention: normalizeCategory("priorMarkRetention", catsRaw.priorMarkRetention),
    };
  } else {
    // Legacy flat checks → map into categories without cross-contaminating.
    const checksRaw =
      obj.checks && typeof obj.checks === "object"
        ? (obj.checks as Record<string, unknown>)
        : {};
    categories = {
      structuralFidelity: emptyCategory("structuralFidelity", "pass"),
      stageProgress: {
        id: "stageProgress",
        severity: asSeverity(checksRaw.stageCompletion) ?? asSeverity(checksRaw.monotonicProgress) ?? "pass",
        reasons: [],
      },
      prematureDetail: {
        id: "prematureDetail",
        severity: asSeverity(checksRaw.prematureDetail) ?? "pass",
        reasons: [],
      },
      priorMarkRetention: {
        id: "priorMarkRetention",
        severity: asSeverity(checksRaw.priorMarksRetained) ?? "pass",
        reasons: [],
      },
    };
  }

  const decision = combineCategoryDecision(categories);
  const modelReasons = Array.isArray(obj.reasons)
    ? obj.reasons.filter((r): r is string => typeof r === "string" && r.trim().length > 0)
    : [];

  return {
    severity: decision.severity,
    reasons: [...decision.reasons, ...modelReasons],
    checks: categoriesToLegacyChecks(categories),
    categories,
    acceptable: decision.acceptable,
  };
}

export function stageProgressOnError(err: unknown): StageProgressValidation {
  const message = err instanceof Error ? err.message : "validator_error";
  const categories: Record<CategoryId, CategoryScore> = {
    structuralFidelity: emptyCategory("structuralFidelity", "warning"),
    stageProgress: emptyCategory("stageProgress", "warning"),
    prematureDetail: emptyCategory("prematureDetail", "warning"),
    priorMarkRetention: emptyCategory("priorMarkRetention", "warning"),
  };
  return {
    severity: "warning",
    reasons: [`Stage category validator unavailable (${message}); accepting with warning.`],
    checks: categoriesToLegacyChecks(categories),
    categories,
    acceptable: true,
  };
}

export function isStageProgressAcceptable(v: StageProgressValidation): boolean {
  return v.acceptable ?? (v.severity === "pass" || v.severity === "warning");
}

/**
 * Fold composition (structural) vision into the structuralFidelity category.
 * Other categories stay untouched.
 */
export function mergeCompositionIntoCategories(
  progress: StageProgressValidation,
  composition: CompositionValidation | null,
): StageProgressValidation {
  if (!composition) return progress;
  const categories = { ...progress.categories };
  // Composition is structural only — map its severity into structuralFidelity
  // using the worse of the two structural signals.
  const combined = worst(categories.structuralFidelity.severity, composition.severity);
  categories.structuralFidelity = {
    id: "structuralFidelity",
    severity: combined,
    reasons: [
      ...categories.structuralFidelity.reasons,
      ...composition.reasons.map((r) => `composition: ${r}`),
    ],
  };
  const decision = combineCategoryDecision(categories);
  return {
    severity: decision.severity,
    reasons: decision.reasons,
    checks: categoriesToLegacyChecks(categories),
    categories,
    acceptable: decision.acceptable,
  };
}

/** Merge composition + categorical progress (structural uses composition). */
export function mergeValidations(
  composition: CompositionValidation,
  progress: StageProgressValidation | null,
): { acceptable: boolean; severity: ValidationSeverity; reasons: string[] } {
  if (!progress) {
    return {
      acceptable: composition.severity === "pass" || composition.severity === "warning",
      severity: composition.severity,
      reasons: composition.reasons,
    };
  }
  const merged = mergeCompositionIntoCategories(progress, composition);
  return {
    acceptable: merged.acceptable,
    severity: merged.severity,
    reasons: merged.reasons,
  };
}
