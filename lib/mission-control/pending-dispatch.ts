// Durable identities of dispatch requests the browser has issued but not seen
// resolved.
//
// A dispatch is idempotent on the server as long as the same key comes back, so
// the only thing that can turn one founder request into two executions is the
// browser forgetting the key. Local storage — not component state, and not
// session storage — is what carries it across the failures that make duplicates
// likely: an ambiguous response, a reload mid-request, a closed tab, or a second
// tab opened to retry.
//
// Unresolved requests are held as a **collection keyed by task**, not a single
// slot. One founder can leave a request for task A unresolved and legitimately
// start one for task B — in this tab or another — and a single slot would silently
// discard A's identity, so retrying A later would create a second canonical
// execution and a second billable provider run. Each entry is removed only when
// the server resolves that request or the founder discards it.
//
// Client-side only, and deliberately free of secrets: a key is an opaque request
// identity, never a credential.

export interface PendingDispatch {
  key: string;
  taskId: string;
}

export const PENDING_DISPATCH_STORAGE_KEY = "savrio.dev-hq.pending-dispatch";

/** Minimal surface of `localStorage`, so this is testable without a DOM. */
export interface PendingDispatchStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function defaultStorage(): PendingDispatchStorage | null {
  try {
    return typeof localStorage === "undefined" ? null : localStorage;
  } catch {
    return null; // storage blocked by the browser
  }
}

function isPending(value: unknown): value is PendingDispatch {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<PendingDispatch>;
  return (
    typeof candidate.key === "string" &&
    typeof candidate.taskId === "string" &&
    candidate.key.length > 0 &&
    candidate.taskId.length > 0
  );
}

/**
 * Every unresolved request, newest last. Recovery is best-effort by design:
 * unavailable or corrupt storage degrades to "nothing pending" rather than
 * throwing, and individual malformed entries are dropped without discarding the
 * rest. Also reads the single-object format written by earlier builds, so an open
 * tab's held identity survives the upgrade.
 */
export function readPendingDispatches(
  storage: PendingDispatchStorage | null = defaultStorage(),
): PendingDispatch[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(PENDING_DISPATCH_STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter(isPending);
    }
    return isPending(parsed) ? [parsed] : [];
  } catch {
    return [];
  }
}

/** The unresolved request for a task, or null. */
export function pendingDispatchFor(
  taskId: string,
  storage: PendingDispatchStorage | null = defaultStorage(),
): PendingDispatch | null {
  return (
    readPendingDispatches(storage).find((entry) => entry.taskId === taskId) ??
    null
  );
}

function persist(
  entries: PendingDispatch[],
  storage: PendingDispatchStorage | null,
): void {
  if (!storage) return;
  try {
    if (entries.length === 0) {
      storage.removeItem(PENDING_DISPATCH_STORAGE_KEY);
    } else {
      storage.setItem(PENDING_DISPATCH_STORAGE_KEY, JSON.stringify(entries));
    }
  } catch {
    // Non-fatal: without storage the identity lives only for this page view.
  }
}

/**
 * Record an unresolved request. Replaces only that task's entry — every other
 * task's identity survives, which is the whole point of the collection.
 *
 * Re-reads storage before writing so a request another tab recorded in the
 * meantime is not clobbered by this tab's stale snapshot.
 */
export function writePendingDispatch(
  pending: PendingDispatch,
  storage: PendingDispatchStorage | null = defaultStorage(),
): void {
  const entries = readPendingDispatches(storage).filter(
    (entry) => entry.taskId !== pending.taskId,
  );
  persist([...entries, pending], storage);
}

/** Remove a task's request once it is resolved or explicitly discarded. */
export function clearPendingDispatch(
  taskId: string,
  storage: PendingDispatchStorage | null = defaultStorage(),
): void {
  const entries = readPendingDispatches(storage);
  persist(
    entries.filter((entry) => entry.taskId !== taskId),
    storage,
  );
}

/**
 * The request identity to send for a submission against `taskId`: that task's
 * unresolved one, or a fresh identity. This is what makes a resubmission after an
 * ambiguous failure converge instead of duplicate — including after a reload, and
 * including when other tasks have their own requests in flight.
 */
export function dispatchKeyFor(
  taskId: string,
  pending: PendingDispatch[] | PendingDispatch | null,
  newKey: () => string,
): PendingDispatch {
  const entries = Array.isArray(pending) ? pending : pending ? [pending] : [];
  const held = entries.find((entry) => entry.taskId === taskId);
  return held ?? { key: newKey(), taskId };
}
