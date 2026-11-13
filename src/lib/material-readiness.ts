/**
 * Lesson-scoped material readiness (local only — never Firebase).
 *
 * Storage key: artpraxis:material-readiness:{uid}:{lessonId}
 * Value: { version: 1, items: Record<materialId, true> }
 *
 * Material IDs must be stable within a lesson (see ProjectMaterials buildItems).
 * Never key readiness by display name or array index alone at the storage layer.
 */

export const MATERIAL_READINESS_PREFIX = "artpraxis:material-readiness:";
const STORAGE_VERSION = 1 as const;

/** Legacy / malformed keys we may encounter and should ignore or clear. */
const LEGACY_KEY_PATTERNS = [
  /^artpraxis:materials?/i,
  /^artpraxis:atelier-ready/i,
  /^artpraxis:checklist/i,
  /^material-readiness$/i,
  /^materials-ready$/i,
];

type StoredPayloadV1 = {
  version: typeof STORAGE_VERSION;
  items: Record<string, true>;
};

export function materialReadinessStorageKey(
  uid: string | null | undefined,
  lessonId: string | null | undefined,
): string | null {
  const user = (uid ?? "").trim();
  const lesson = (lessonId ?? "").trim();
  if (!user || !lesson) return null;
  return `${MATERIAL_READINESS_PREFIX}${user}:${lesson}`;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Parse stored JSON into a Set of ready material IDs.
 * Ignores malformed, unversioned, array-index, or non-object payloads.
 */
export function parseMaterialReadiness(raw: string | null): Set<string> {
  const empty = new Set<string>();
  if (!raw) return empty;

  try {
    const parsed: unknown = JSON.parse(raw);

    // Legacy: bare string[] of ids
    if (Array.isArray(parsed)) {
      const ids = parsed.filter(
        (id): id is string => typeof id === "string" && id.length > 0 && !/^\d+$/.test(id),
      );
      return new Set(ids);
    }

    if (!isPlainObject(parsed)) return empty;

    // Current shape
    if (parsed.version === STORAGE_VERSION && isPlainObject(parsed.items)) {
      const ids = Object.entries(parsed.items)
        .filter(([, v]) => v === true)
        .map(([k]) => k)
        .filter((k) => typeof k === "string" && k.length > 0 && !/^\d+$/.test(k));
      return new Set(ids);
    }

    // Legacy: { [materialId]: boolean } without version
    if (!("version" in parsed) && !("items" in parsed)) {
      const ids = Object.entries(parsed)
        .filter(([, v]) => v === true)
        .map(([k]) => k)
        .filter((k) => typeof k === "string" && k.length > 0 && !/^\d+$/.test(k));
      return new Set(ids);
    }

    // Legacy: { readyIds: string[] }
    if (Array.isArray(parsed.readyIds)) {
      const ids = parsed.readyIds.filter(
        (id): id is string => typeof id === "string" && id.length > 0 && !/^\d+$/.test(id),
      );
      return new Set(ids);
    }

    return empty;
  } catch {
    return empty;
  }
}

export function serializeMaterialReadiness(readyIds: Set<string>): string {
  const items: Record<string, true> = {};
  for (const id of readyIds) {
    if (id && !/^\d+$/.test(id)) items[id] = true;
  }
  const payload: StoredPayloadV1 = { version: STORAGE_VERSION, items };
  return JSON.stringify(payload);
}

export function loadMaterialReadiness(
  uid: string | null | undefined,
  lessonId: string | null | undefined,
): Set<string> {
  if (typeof window === "undefined") return new Set();
  const key = materialReadinessStorageKey(uid, lessonId);
  if (!key) return new Set();
  try {
    return parseMaterialReadiness(window.localStorage.getItem(key));
  } catch {
    return new Set();
  }
}

export function saveMaterialReadiness(
  uid: string | null | undefined,
  lessonId: string | null | undefined,
  readyIds: Set<string>,
): void {
  if (typeof window === "undefined") return;
  const key = materialReadinessStorageKey(uid, lessonId);
  if (!key) return;
  try {
    if (readyIds.size === 0) {
      window.localStorage.removeItem(key);
      return;
    }
    window.localStorage.setItem(key, serializeMaterialReadiness(readyIds));
  } catch {
    // Quota / private mode — fail quietly; UI state still works in-memory.
  }
}

export function clearMaterialReadiness(
  uid: string | null | undefined,
  lessonId: string | null | undefined,
): void {
  if (typeof window === "undefined") return;
  const key = materialReadinessStorageKey(uid, lessonId);
  if (!key) return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/**
 * Remove known legacy global readiness keys that could leak across lessons.
 * Does not touch correctly scoped `artpraxis:material-readiness:{uid}:{lessonId}` keys.
 */
export function purgeLegacyMaterialReadinessKeys(): void {
  if (typeof window === "undefined") return;
  try {
    const toRemove: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key) continue;
      if (key.startsWith(MATERIAL_READINESS_PREFIX)) {
        // Scoped keys look like prefix + uid + ':' + lessonId (at least one colon after prefix)
        const rest = key.slice(MATERIAL_READINESS_PREFIX.length);
        if (!rest.includes(":")) {
          toRemove.push(key);
        }
        continue;
      }
      if (LEGACY_KEY_PATTERNS.some((re) => re.test(key))) {
        toRemove.push(key);
      }
    }
    for (const key of toRemove) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}
