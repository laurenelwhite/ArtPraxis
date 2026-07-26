import type { User } from "firebase/auth";

/** Max time the UI may show an auth-checking splash before recovering. */
export const AUTH_READY_TIMEOUT_MS = 8_000;

export type AuthUiState = {
  user: User | null;
  loading: boolean;
  error: string | null;
};

/**
 * Pure reducer for auth loading transitions — keeps the splash from hanging forever
 * when Firebase Auth persistence (often IndexedDB) never settles.
 */
export function reduceAuthLoadingEvent(
  prev: AuthUiState,
  event:
    | { type: "resolved"; user: User | null }
    | { type: "listener_error"; message: string }
    | { type: "timeout"; currentUser: User | null },
): AuthUiState {
  switch (event.type) {
    case "resolved":
      return { user: event.user, loading: false, error: null };
    case "listener_error":
      return { user: null, loading: false, error: event.message };
    case "timeout":
      if (!prev.loading) return prev;
      return {
        user: event.currentUser,
        loading: false,
        error: event.currentUser
          ? null
          : "Checking your session took too long. You can sign in below.",
      };
    default:
      return prev;
  }
}

export function initialAuthUiState(): AuthUiState {
  return { user: null, loading: true, error: null };
}
