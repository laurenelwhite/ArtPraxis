"use client";
import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
} from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { authErrorMessage } from "@/lib/auth-errors";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

export function AuthPanel({ initialError = null }: { initialError?: string | null }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");
  const [googlePending, setGooglePending] = useState(false);

  const headingId = "auth-heading";
  const errorId = "auth-error";
  const isSignIn = mode === "signin";

  async function emailAuth() {
    try {
      setError("");
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(authErrorMessage(e));
    }
  }

  async function googleAuth() {
    try {
      setError("");
      setGooglePending(true);
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError(authErrorMessage(e));
    } finally {
      setGooglePending(false);
    }
  }

  function switchMode() {
    setMode(isSignIn ? "signup" : "signin");
  }

  return (
    <section
      className="ap-auth-panel ap-surface"
      aria-labelledby={headingId}
    >
      <div className="ap-auth-brand">
        <ArtPraxisLogo variant="primary" size="primary" />
      </div>

      <header className="ap-auth-header">
        <h2 id={headingId}>{isSignIn ? "Sign in" : "Create account"}</h2>
        <p className="ap-auth-lead">
          {isSignIn
            ? "Sign in to open your studio and continue your lessons."
            : "Create an account to save lessons and track your progress."}
        </p>
      </header>

      <form
        className="ap-auth-form"
        onSubmit={(e) => {
          e.preventDefault();
          emailAuth();
        }}
        aria-describedby={error ? errorId : undefined}
      >
        <div className="ap-auth-field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            name="email"
            autoComplete="email"
            inputMode="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="ap-auth-field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            name="password"
            autoComplete={isSignIn ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <div className="ap-auth-message" aria-live="polite">
          {error ? (
            <p id={errorId} className="ap-auth-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>

        <button className="ap-button-primary btn-branded ap-auth-submit" type="submit">
          {isSignIn ? "Sign in" : "Create account"}
        </button>

        <div className="ap-auth-divider" role="presentation">
          <span>or</span>
        </div>

        <button
          className="ap-button-secondary ap-auth-provider"
          type="button"
          onClick={googleAuth}
          disabled={googlePending}
        >
          {googlePending ? "Opening Google…" : "Continue with Google"}
        </button>

        <button
          className="ap-button-quiet ap-auth-mode-switch"
          type="button"
          onClick={switchMode}
        >
          {isSignIn ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </section>
  );
}
