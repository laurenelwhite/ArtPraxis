import OpenAI from "openai";
import type { IdTokenVerifier } from "./api-auth";
import { createMemoryQuotaStore, type QuotaStore } from "./generation-quota";
import { firebaseAdminVerifier, firestoreQuotaStore } from "./firebase-admin";

export interface SecurityDeps {
  verifyIdToken: IdTokenVerifier;
  quotaStore: QuotaStore;
  openai: () => OpenAI;
}

export type QuotaStoreKind = "firestore" | "memory";

/**
 * Durable Firestore quota on App Hosting / Cloud Run (`K_SERVICE` is set there)
 * or when explicitly requested. Everywhere else — local `next dev` / `next start`
 * — defaults to a process-local store so local runs never write to production
 * Firestore. `FIRESTORE_EMULATOR_HOST` routes an explicit Firestore store to the emulator.
 */
export function resolveQuotaStoreKind(
  env: Record<string, string | undefined> = process.env,
): QuotaStoreKind {
  const explicit = env.GEN_QUOTA_STORE?.trim().toLowerCase();
  if (explicit === "firestore" || explicit === "memory") return explicit;
  return env.K_SERVICE ? "firestore" : "memory";
}

let openaiClient: OpenAI | null = null;
let memoryQuotaStore: QuotaStore | null = null;

function defaultQuotaStore(): QuotaStore {
  if (resolveQuotaStoreKind() === "firestore") return firestoreQuotaStore;
  if (!memoryQuotaStore) {
    console.warn("[quota] using process-local quota store (not durable); set GEN_QUOTA_STORE=firestore to persist");
    memoryQuotaStore = createMemoryQuotaStore();
  }
  return memoryQuotaStore;
}

const defaults: SecurityDeps = {
  verifyIdToken: firebaseAdminVerifier,
  get quotaStore() {
    return defaultQuotaStore();
  },
  openai: () => (openaiClient ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY })),
};

let overrides: Partial<SecurityDeps> | null = null;

export function getSecurityDeps(): SecurityDeps {
  if (!overrides) return defaults;
  return {
    verifyIdToken: overrides.verifyIdToken ?? defaults.verifyIdToken,
    quotaStore: overrides.quotaStore ?? defaults.quotaStore,
    openai: overrides.openai ?? defaults.openai,
  };
}

/** Test seam: swap token verification, quota storage, or the OpenAI client. */
export function setSecurityDepsForTesting(next: Partial<SecurityDeps> | null): void {
  overrides = next;
}
