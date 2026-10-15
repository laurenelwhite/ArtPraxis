"use client";

import { auth } from "@/lib/firebase";

async function idToken(forceRefresh: boolean): Promise<string> {
  await auth.authStateReady();
  const user = auth.currentUser;
  if (!user) throw new Error("Sign in again to continue.");
  return user.getIdToken(forceRefresh);
}

/**
 * fetch() for ArtPraxis API routes, authenticated with the signed-in user's
 * Firebase ID token. Retries once with a refreshed token on 401.
 */
export async function authorizedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const send = async (forceRefresh: boolean) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${await idToken(forceRefresh)}`);
    return fetch(input, { ...init, headers });
  };
  const first = await send(false);
  if (first.status !== 401) return first;
  return send(true);
}
