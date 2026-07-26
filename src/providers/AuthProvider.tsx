"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth, getFirebaseClientProjectId } from "@/lib/firebase";
import {
  AUTH_READY_TIMEOUT_MS,
  initialAuthUiState,
  reduceAuthLoadingEvent,
  type AuthUiState,
} from "@/lib/auth-loading";

const AuthContext = createContext<AuthUiState>(initialAuthUiState());

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthUiState>(initialAuthUiState);

  useEffect(() => {
    let cancelled = false;
    let timeoutId = 0;

    const projectId = getFirebaseClientProjectId();
    if (projectId && projectId !== "artpraxis-33840") {
      console.warn("[auth] Unexpected Firebase projectId:", projectId);
    }

    // Absolute wall-clock recovery — do not depend on Firebase promises settling.
    timeoutId = window.setTimeout(() => {
      if (cancelled) return;
      console.warn("[auth] session check wall-clock timeout — recovering UI");
      setState((prev) =>
        reduceAuthLoadingEvent(prev, {
          type: "timeout",
          currentUser: auth.currentUser,
        }),
      );
    }, AUTH_READY_TIMEOUT_MS);

    const unsub = onAuthStateChanged(
      auth,
      (user) => {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        setState((prev) => reduceAuthLoadingEvent(prev, { type: "resolved", user }));
      },
      (err) => {
        if (cancelled) return;
        window.clearTimeout(timeoutId);
        console.error("[auth] onAuthStateChanged error", err);
        setState((prev) =>
          reduceAuthLoadingEvent(prev, {
            type: "listener_error",
            message: err.message || "Could not check your session.",
          }),
        );
      },
    );

    void auth.authStateReady().then(
      () => {
        if (cancelled) return;
        // Listener usually wins; this covers cases where currentUser is already known.
        setState((prev) => {
          if (!prev.loading) return prev;
          return reduceAuthLoadingEvent(prev, {
            type: "resolved",
            user: auth.currentUser,
          });
        });
      },
      (err) => {
        console.error("[auth] authStateReady rejected", err);
      },
    );

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      unsub();
    };
  }, []);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
