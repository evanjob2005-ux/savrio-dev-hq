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
// The collection is stored as one `localStorage` key per task rather than one
// key holding them all, so recording a request is a single write that touches
// nothing another tab owns. See `PENDING_DISPATCH_KEY_PREFIX` for why a shared
// key could not be made safe by re-reading before writing.
//
// Client-side only, and deliberately free of secrets: a key is an opaque request
// identity, never a credential.

export interface PendingDispatch {
  key: string;
  taskId: string;
}

/**
 * The single key earlier builds wrote the whole collection under. Still read —
 * an open tab's held identities must survive the upgrade — but never written.
 * See `PENDING_DISPATCH_KEY_PREFIX`.
 */
export const PENDING_DISPATCH_STORAGE_KEY = "savrio.dev-hq.pending-dispatch";

/**
 * One storage key per task (P2-38).
 *
 * The collection used to live in one key as a JSON array, so recording a request
 * meant read the array, add to it, write the array back. Across tabs that is a
 * lost update waiting to happen: `localStorage` is synchronous *within* a tab
 * but holds no lock *across* them, so tab A can read, tab B can read, A can
 * write, and B's write — built from a snapshot taken before A's — then erases
 * A's entry. What is erased is a dispatch key, and losing a dispatch key is
 * precisely what turns one founder request into two canonical executions and two
 * billable provider runs. Re-reading immediately before writing narrowed that
 * window; it did not close it, because the window is between the read and the
 * write and there is always one.
 *
 * Giving each task its own key removes the shared mutable document instead of
 * racing for it: two tabs recording two different tasks write two different
 * keys and cannot interact at all. Two tabs recording the *same* task still
 * resolve last-write-wins, which is the designed semantics — that slot holds one
 * identity per task by definition — not a lost update.
 */
export const PENDING_DISPATCH_KEY_PREFIX = "savrio.dev-hq.pending-dispatch:";

/**
 * Minimal surface of `localStorage`, so this is testable without a DOM.
 *
 * `length` and `key()` are part of it because per-task keys have to be
 * enumerated to be read back. Both are on the `Storage` interface every browser
 * implements, so `localStorage` satisfies this unchanged.
 */
export interface PendingDispatchStorage {
  readonly length: number;
  key(index: number): string | null;
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

/** Every key this module owns, per-task keys and the legacy shared one. */
function ownedKeys(storage: PendingDispatchStorage): string[] {
  const keys: string[] = [];
  for (let i = 0; i < storage.length; i += 1) {
    const key = storage.key(i);
    if (key === null) continue;
    if (key === PENDING_DISPATCH_STORAGE_KEY || key.startsWith(PENDING_DISPATCH_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
}

/** The entries held under one key, in whichever format that key carries. */
function entriesAt(storage: PendingDispatchStorage, key: string): PendingDispatch[] {
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed.filter(isPending);
    return isPending(parsed) ? [parsed] : [];
  } catch {
    return [];
  }
}

/**
 * Every unresolved request, ordered by task id.
 *
 * The order is by task id rather than by recency because per-task keys carry no
 * global write order and `Storage.key()` enumeration order is implementation
 * defined; a stable order that does not depend on the browser is worth more here
 * than a recency the callers never use — all three of them look entries up by
 * task.
 *
 * Recovery is best-effort by design: unavailable or corrupt storage degrades to
 * "nothing pending" rather than throwing, and individual malformed entries are
 * dropped without discarding the rest. Both formats earlier builds wrote — the
 * single object and the shared array — are still read, so an open tab's held
 * identities survive the upgrade. A per-task key wins over the legacy blob for
 * the same task, since it is the only one this build writes.
 */
export function readPendingDispatches(
  storage: PendingDispatchStorage | null = defaultStorage(),
): PendingDispatch[] {
  if (!storage) return [];
  let keys: string[];
  try {
    keys = ownedKeys(storage);
  } catch {
    return [];
  }

  const byTask = new Map<string, PendingDispatch>();
  // Legacy first, so a per-task key overwrites it rather than the other way
  // round.
  for (const key of keys.filter((k) => k === PENDING_DISPATCH_STORAGE_KEY)) {
    for (const entry of entriesAt(storage, key)) byTask.set(entry.taskId, entry);
  }
  for (const key of keys.filter((k) => k !== PENDING_DISPATCH_STORAGE_KEY)) {
    for (const entry of entriesAt(storage, key)) byTask.set(entry.taskId, entry);
  }

  return [...byTask.values()].sort((a, b) => a.taskId.localeCompare(b.taskId));
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

function keyFor(taskId: string): string {
  return `${PENDING_DISPATCH_KEY_PREFIX}${taskId}`;
}

/**
 * Moves anything still held in the legacy shared key onto per-task keys and
 * drops the shared key.
 *
 * Run before every mutation rather than on read, so reading stays free of side
 * effects. It has to happen before a mutation and not merely at read time: with
 * the shared key left in place, clearing a task would remove its per-task key
 * and the legacy copy would read back as pending again — a resolved dispatch
 * resurrecting itself.
 *
 * An entry that already has a per-task key is not overwritten: that key is the
 * only one this build writes, so it is the newer of the two.
 */
function migrateLegacy(storage: PendingDispatchStorage): void {
  try {
    const legacy = entriesAt(storage, PENDING_DISPATCH_STORAGE_KEY);
    if (legacy.length === 0) {
      if (storage.getItem(PENDING_DISPATCH_STORAGE_KEY) !== null) {
        storage.removeItem(PENDING_DISPATCH_STORAGE_KEY);
      }
      return;
    }
    for (const entry of legacy) {
      if (storage.getItem(keyFor(entry.taskId)) === null) {
        storage.setItem(keyFor(entry.taskId), JSON.stringify(entry));
      }
    }
    storage.removeItem(PENDING_DISPATCH_STORAGE_KEY);
  } catch {
    // Non-fatal: the legacy key is still read, so nothing is lost by not
    // migrating it.
  }
}

/**
 * Record an unresolved request under its own key.
 *
 * No other task's key is read or written, so there is no snapshot to go stale
 * and nothing another tab can clobber (P2-38).
 */
export function writePendingDispatch(
  pending: PendingDispatch,
  storage: PendingDispatchStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  migrateLegacy(storage);
  try {
    storage.setItem(keyFor(pending.taskId), JSON.stringify(pending));
  } catch {
    // Non-fatal: without storage the identity lives only for this page view.
  }
}

/** Remove a task's request once it is resolved or explicitly discarded. */
export function clearPendingDispatch(
  taskId: string,
  storage: PendingDispatchStorage | null = defaultStorage(),
): void {
  if (!storage) return;
  migrateLegacy(storage);
  try {
    storage.removeItem(keyFor(taskId));
  } catch {
    // Non-fatal: the identity outlives this page view but is only ever reused
    // for the same task, so it cannot cause a duplicate execution.
  }
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
