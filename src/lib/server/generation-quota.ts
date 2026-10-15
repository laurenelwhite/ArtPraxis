import { randomUUID } from "node:crypto";
import { ApiError } from "./api-errors";

export type QuotaKind = "tutorial" | "image";

export interface QuotaConfig {
  /** Tutorial analyses per user per UTC day. */
  tutorialPerDay: number;
  /** Master/stage image requests per user per UTC day. */
  imagePerDay: number;
  /** Paid requests a single user may have in flight at once. */
  maxConcurrent: number;
  /** In-flight slots expire after this long so a crashed request cannot lock a user out. */
  leaseMs: number;
}

export interface UsageState {
  day: string;
  counts: Record<QuotaKind, number>;
  /** reservationId → lease expiry (epoch ms). */
  inflight: Record<string, number>;
}

export type ReservationDecision =
  | { allowed: true; next: UsageState }
  | { allowed: false; reason: "daily_limit" | "concurrency"; retryAfterSeconds: number };

export interface Reservation {
  release(): Promise<void>;
}

export interface QuotaStore {
  reserve(uid: string, kind: QuotaKind, config: QuotaConfig): Promise<Reservation>;
}

function readInt(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : fallback;
}

export function quotaConfigFromEnv(
  env: Record<string, string | undefined> = process.env,
): QuotaConfig {
  return {
    tutorialPerDay: readInt(env.GEN_QUOTA_TUTORIALS_PER_DAY, 10),
    imagePerDay: readInt(env.GEN_QUOTA_IMAGES_PER_DAY, 30),
    maxConcurrent: Math.max(1, readInt(env.GEN_QUOTA_MAX_CONCURRENT, 2)),
    leaseMs: Math.max(60, readInt(env.GEN_QUOTA_LEASE_SECONDS, 360)) * 1000,
  };
}

export function utcDayKey(nowMs: number): string {
  return new Date(nowMs).toISOString().slice(0, 10);
}

function secondsUntilNextUtcDay(nowMs: number): number {
  const d = new Date(nowMs);
  const next = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
  return Math.max(1, Math.ceil((next - nowMs) / 1000));
}

export function parseUsageState(raw: unknown): UsageState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const counts = (r.counts ?? {}) as Record<string, unknown>;
  const inflightRaw = (r.inflight ?? {}) as Record<string, unknown>;
  const inflight: Record<string, number> = {};
  for (const [id, exp] of Object.entries(inflightRaw)) {
    if (typeof exp === "number") inflight[id] = exp;
  }
  return {
    day: typeof r.day === "string" ? r.day : "",
    counts: {
      tutorial: typeof counts.tutorial === "number" ? counts.tutorial : 0,
      image: typeof counts.image === "number" ? counts.image : 0,
    },
    inflight,
  };
}

/** Pure quota decision — the store runs this inside a transaction. */
export function decideReservation(
  state: UsageState | null,
  kind: QuotaKind,
  config: QuotaConfig,
  nowMs: number,
  reservationId: string,
): ReservationDecision {
  const day = utcDayKey(nowMs);
  const counts =
    state && state.day === day ? { ...state.counts } : { tutorial: 0, image: 0 };
  const inflight: Record<string, number> = {};
  for (const [id, exp] of Object.entries(state?.inflight ?? {})) {
    if (exp > nowMs) inflight[id] = exp;
  }

  const limit = kind === "tutorial" ? config.tutorialPerDay : config.imagePerDay;
  if (counts[kind] >= limit) {
    return { allowed: false, reason: "daily_limit", retryAfterSeconds: secondsUntilNextUtcDay(nowMs) };
  }
  const active = Object.values(inflight);
  if (active.length >= config.maxConcurrent) {
    const soonest = Math.min(...active);
    return {
      allowed: false,
      reason: "concurrency",
      retryAfterSeconds: Math.max(1, Math.min(60, Math.ceil((soonest - nowMs) / 1000))),
    };
  }

  counts[kind] += 1;
  inflight[reservationId] = nowMs + config.leaseMs;
  return { allowed: true, next: { day, counts, inflight } };
}

export function releaseReservation(state: UsageState, reservationId: string): UsageState {
  const inflight = { ...state.inflight };
  delete inflight[reservationId];
  return { ...state, inflight };
}

export function quotaExceededError(
  decision: Extract<ReservationDecision, { allowed: false }>,
): ApiError {
  const headers = { "Retry-After": String(decision.retryAfterSeconds) };
  if (decision.reason === "daily_limit") {
    return new ApiError(
      429,
      "ERR_QUOTA_EXCEEDED",
      "You've reached today's generation limit. Please try again tomorrow.",
      { retryable: false, headers },
    );
  }
  return new ApiError(
    429,
    "ERR_TOO_MANY_CONCURRENT",
    "Another generation is already running for your account. Please wait for it to finish.",
    { retryable: true, headers },
  );
}

/** Process-local store for tests and local tooling only — not durable. */
export function createMemoryQuotaStore(now: () => number = Date.now): QuotaStore & {
  state: Map<string, UsageState>;
} {
  const state = new Map<string, UsageState>();
  return {
    state,
    async reserve(uid, kind, config) {
      const id = randomUUID();
      const decision = decideReservation(state.get(uid) ?? null, kind, config, now(), id);
      if (!decision.allowed) throw quotaExceededError(decision);
      state.set(uid, decision.next);
      return {
        async release() {
          const current = state.get(uid);
          if (current) state.set(uid, releaseReservation(current, id));
        },
      };
    },
  };
}
