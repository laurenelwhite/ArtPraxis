"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { ArtPraxisLogo } from "@/components/brand/ArtPraxisLogo";

export function AuthPanel({ initialError = null }: { initialError?: string | null }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError ?? "");

  async function emailAuth() {
    try {
      setError("");
      if (mode === "signup") await createUserWithEmailAndPassword(auth, email, password);
      else await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    }
  }

  return (
    <section className="card auth">
      <div className="auth-brand">
        <ArtPraxisLogo variant="primary" size="primary" />
      </div>
      <p className="eyebrow">Your studio</p>
      <h2>{mode === "signin" ? "Sign in" : "Create account"}</h2>
      <form className="form" onSubmit={(e) => { e.preventDefault(); emailAuth(); }}>
        <label>Email
          <input type="email" name="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        </label>
        <label>Password
          <input
            type="password"
            name="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        {error && <p className="status error" role="alert">{error}</p>}
        <button className="primary btn-branded" type="submit">{mode === "signin" ? "Sign in" : "Create account"}</button>
        <button className="secondary" type="button" onClick={() => signInWithPopup(auth, googleProvider)}>Continue with Google</button>
        <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
          {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </section>
  );
}
