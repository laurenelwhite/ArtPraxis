// Persists which vocabulary terms a reader has already opened, per browser
// profile, so the subtle "new term" dot never returns once they've engaged.

const SEEN_KEY = "artpraxis.terms.seen";

export function readSeen(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(SEEN_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function markSeen(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const seen = readSeen();
    seen.add(id);
    window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* ignore storage failures */
  }
}
