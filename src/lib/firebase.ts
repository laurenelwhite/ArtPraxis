"use client";

import { getApps, initializeApp, type FirebaseApp, type FirebaseOptions } from "firebase/app";
import {
  getAuth,
  initializeAuth,
  browserLocalPersistence,
  GoogleAuthProvider,
  type Auth,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const config: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

function missingClientConfigKeys(options: FirebaseOptions): string[] {
  const required: (keyof FirebaseOptions)[] = [
    "apiKey",
    "authDomain",
    "projectId",
    "storageBucket",
    "messagingSenderId",
    "appId",
  ];
  return required.filter((key) => !options[key]);
}

const missing = missingClientConfigKeys(config);
if (missing.length > 0 && typeof window !== "undefined") {
  console.error("[firebase] Missing NEXT_PUBLIC config keys:", missing.join(", "));
}

const app: FirebaseApp = getApps().length ? getApps()[0]! : initializeApp(config);

/**
 * localStorage-only persistence. Default IndexedDB persistence (and IDB fallbacks)
 * can hang forever in some Chromium/automation profiles: empty firebaseLocalStorage,
 * onAuthStateChanged never fires, and identitytoolkit is never contacted.
 */
function createAuth(firebaseApp: FirebaseApp): Auth {
  if (typeof window === "undefined") {
    // SSR / RSC evaluation — no browser storage APIs.
    return getAuth(firebaseApp);
  }
  try {
    return initializeAuth(firebaseApp, {
      persistence: browserLocalPersistence,
    });
  } catch {
    // Hot reload — Auth already initialized for this app.
    return getAuth(firebaseApp);
  }
}

export const auth = createAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

export function getFirebaseClientProjectId(): string | null {
  return typeof config.projectId === "string" ? config.projectId : null;
}
