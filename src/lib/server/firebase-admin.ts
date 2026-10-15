import { randomUUID } from "node:crypto";
import type { App } from "firebase-admin/app";
import type { DocumentReference, Firestore } from "firebase-admin/firestore";
import { ApiError } from "./api-errors";
import {
  decideReservation,
  parseUsageState,
  quotaExceededError,
  releaseReservation,
  type QuotaStore,
  type ReservationDecision,
} from "./generation-quota";
import type { IdTokenVerifier } from "./api-auth";

const ADMIN_APP_NAME = "artpraxis-server";
const USAGE_COLLECTION = "apiUsage";

function adminProjectId(): string | undefined {
  return (
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    process.env.GOOGLE_CLOUD_PROJECT ||
    undefined
  );
}

let appPromise: Promise<App> | null = null;

/** Lazily initialize firebase-admin with Application Default Credentials. */
function getAdminApp(): Promise<App> {
  appPromise ??= (async () => {
    const { getApps, initializeApp } = await import("firebase-admin/app");
    const existing = getApps().find((a) => a.name === ADMIN_APP_NAME);
    if (existing) return existing;
    const projectId = adminProjectId();
    return initializeApp(projectId ? { projectId } : {}, ADMIN_APP_NAME);
  })();
  return appPromise;
}

export const firebaseAdminVerifier: IdTokenVerifier = async (token) => {
  const app = await getAdminApp();
  const { getAuth } = await import("firebase-admin/auth");
  const decoded = await getAuth(app).verifyIdToken(token);
  return { uid: decoded.uid };
};

/**
 * Durable per-user quota in Firestore (`apiUsage/{uid}`), enforced in a
 * transaction so concurrent requests cannot both take the last slot.
 * Client SDK access to `apiUsage` is denied by the default-deny rules.
 * Fails closed: if Firestore is unreachable, paid work does not start.
 */
export const firestoreQuotaStore: QuotaStore = {
  async reserve(uid, kind, config) {
    const reservationId = randomUUID();
    let ref: DocumentReference;
    let db: Firestore;
    let decision: ReservationDecision;
    try {
      const app = await getAdminApp();
      const { getFirestore } = await import("firebase-admin/firestore");
      db = getFirestore(app);
      ref = db.collection(USAGE_COLLECTION).doc(uid);
      decision = await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref);
        const result = decideReservation(
          parseUsageState(snap.data()),
          kind,
          config,
          Date.now(),
          reservationId,
        );
        if (result.allowed) tx.set(ref, { ...result.next, updatedAt: Date.now() });
        return result;
      });
    } catch (error) {
      console.error("[quota] reservation failed", {
        message: error instanceof Error ? error.message : String(error),
      });
      throw new ApiError(
        503,
        "ERR_QUOTA_UNAVAILABLE",
        "Generation is temporarily unavailable. Please try again shortly.",
        { retryable: true },
      );
    }
    if (!decision.allowed) throw quotaExceededError(decision);

    return {
      async release() {
        try {
          await db.runTransaction(async (tx) => {
            const snap = await tx.get(ref);
            const state = parseUsageState(snap.data());
            if (!state) return;
            tx.set(ref, { ...releaseReservation(state, reservationId), updatedAt: Date.now() });
          });
        } catch (error) {
          // The lease expires on its own; never fail the user's request here.
          console.warn("[quota] release failed", {
            message: error instanceof Error ? error.message : String(error),
          });
        }
      },
    };
  },
};
