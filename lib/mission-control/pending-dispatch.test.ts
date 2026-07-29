import { beforeEach, describe, expect, it } from "vitest";

import {
  PENDING_DISPATCH_KEY_PREFIX,
  PENDING_DISPATCH_STORAGE_KEY,
  clearPendingDispatch,
  dispatchKeyFor,
  pendingDispatchFor,
  readPendingDispatches,
  writePendingDispatch,
  type PendingDispatchStorage,
} from "@/lib/mission-control/pending-dispatch";

/**
 * A store that survives a "reload" the same way the browser's does.
 *
 * `length` and `key()` are getters over the same Map, so enumeration reflects
 * writes made after the object was created — as `localStorage` does.
 */
function fakeStorage(initial?: Record<string, string>): PendingDispatchStorage & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial ?? {}));
  return {
    data,
    get length() {
      return data.size;
    },
    key: (index) => [...data.keys()][index] ?? null,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
  };
}

/**
 * The interleaving a second tab actually produces, made deterministic.
 *
 * `localStorage` is synchronous inside a tab but holds no lock across tabs, so
 * another tab's write can land at any point between this tab's first read and
 * its write. `arm()` schedules the other tab's write for the next `getItem`,
 * handing it the *underlying* store, so it commits before this call's write does
 * — which is exactly the window a read-modify-write has and cannot close.
 */
function racedStorage(): PendingDispatchStorage & {
  data: Map<string, string>;
  arm(otherTab: (storage: PendingDispatchStorage) => void): void;
} {
  const base = fakeStorage();
  let pending: ((storage: PendingDispatchStorage) => void) | null = null;
  return {
    data: base.data,
    arm(otherTab) {
      pending = otherTab;
    },
    get length() {
      return base.length;
    },
    key: (index) => base.key(index),
    getItem: (key) => {
      const value = base.getItem(key);
      if (pending) {
        const otherTab = pending;
        pending = null;
        otherTab(base);
      }
      return value;
    },
    setItem: (key, value) => base.setItem(key, value),
    removeItem: (key) => base.removeItem(key),
  };
}

describe("pending dispatch identities", () => {
  let storage: ReturnType<typeof fakeStorage>;

  beforeEach(() => {
    storage = fakeStorage();
  });

  it("round-trips an unresolved request", () => {
    writePendingDispatch({ key: "req-1", taskId: "task-1" }, storage);
    expect(readPendingDispatches(storage)).toEqual([
      { key: "req-1", taskId: "task-1" },
    ]);
    expect(pendingDispatchFor("task-1", storage)).toEqual({
      key: "req-1",
      taskId: "task-1",
    });
  });

  it("clears only the request that resolved", () => {
    writePendingDispatch({ key: "req-1", taskId: "task-1" }, storage);
    writePendingDispatch({ key: "req-2", taskId: "task-2" }, storage);

    clearPendingDispatch("task-1", storage);

    expect(pendingDispatchFor("task-1", storage)).toBeNull();
    expect(pendingDispatchFor("task-2", storage)).toEqual({
      key: "req-2",
      taskId: "task-2",
    });
  });

  it("removes the storage entry once nothing is unresolved", () => {
    writePendingDispatch({ key: "req-1", taskId: "task-1" }, storage);
    expect(storage.data.size, "the write recorded nothing").toBe(1);

    clearPendingDispatch("task-1", storage);

    // Asserted over every key this module owns, not just the legacy shared one:
    // with per-task keys, checking only the shared key would pass whether or not
    // anything was actually removed.
    expect(
      [...storage.data.keys()].filter(
        (k) =>
          k === PENDING_DISPATCH_STORAGE_KEY ||
          k.startsWith(PENDING_DISPATCH_KEY_PREFIX),
      ),
      "a resolved request left a key behind",
    ).toEqual([]);
  });

  it("leaves keys it does not own alone", () => {
    // The reader enumerates storage now, so it has to be selective about what it
    // treats as its own — and the writer must not tidy up anything else.
    const shared = fakeStorage({ "some.other.app": "value" });
    writePendingDispatch({ key: "req-1", taskId: "task-1" }, shared);
    clearPendingDispatch("task-1", shared);

    expect(shared.data.get("some.other.app")).toBe("value");
    expect(readPendingDispatches(shared)).toEqual([]);
  });

  it("migrates a legacy shared blob so a cleared request cannot resurrect", () => {
    // Two identities written by an earlier build. Resolving one must not leave
    // the other behind in the old format, and must not leave the resolved one
    // readable there either.
    const legacy = fakeStorage({
      [PENDING_DISPATCH_STORAGE_KEY]: JSON.stringify([
        { key: "req-1", taskId: "task-1" },
        { key: "req-2", taskId: "task-2" },
      ]),
    });

    clearPendingDispatch("task-1", legacy);

    expect(
      readPendingDispatches(legacy),
      "the resolved request was still readable from the legacy key, so it " +
        "reads back as pending after being cleared",
    ).toEqual([{ key: "req-2", taskId: "task-2" }]);
    expect(legacy.data.has(PENDING_DISPATCH_STORAGE_KEY)).toBe(false);
  });

  it("keeps a held identity when another task is dispatched", () => {
    // Task A's response was ambiguous; its identity must survive whatever the
    // founder does next.
    writePendingDispatch({ key: "req-a", taskId: "task-a" }, storage);
    writePendingDispatch({ key: "req-b", taskId: "task-b" }, storage);

    expect(pendingDispatchFor("task-a", storage)?.key).toBe("req-a");
    expect(readPendingDispatches(storage)).toHaveLength(2);

    // Retrying task A converges on its original execution, not a new one.
    const retry = dispatchKeyFor(
      "task-a",
      readPendingDispatches(storage),
      () => "req-new",
    );
    expect(retry.key).toBe("req-a");
  });

  it("does not let one tab clobber another tab's request", () => {
    // Sequential writes. This is the case the previous implementation already
    // handled, kept because it is the ordinary one.
    writePendingDispatch({ key: "req-a", taskId: "task-a" }, storage);
    writePendingDispatch({ key: "req-b", taskId: "task-b" }, storage);

    expect(readPendingDispatches(storage)).toEqual([
      { key: "req-a", taskId: "task-a" },
      { key: "req-b", taskId: "task-b" },
    ]);
  });

  it("keeps a request another tab commits mid-write", () => {
    // P2-38. The other tab's write lands *between* this tab's read and its
    // write — the window a read-modify-write has by construction, and the one
    // re-reading immediately beforehand narrows without closing. What is lost
    // when it closes badly is a dispatch key, and a lost dispatch key is a
    // second canonical execution and a second billable provider run for one
    // founder request.
    const raced = racedStorage();
    raced.arm((otherTab) => {
      writePendingDispatch({ key: "req-a", taskId: "task-a" }, otherTab);
    });

    writePendingDispatch({ key: "req-b", taskId: "task-b" }, raced);

    expect(
      readPendingDispatches(raced),
      "the other tab's dispatch key was erased by this tab's write, so " +
        "retrying that task will start a second execution",
    ).toEqual([
      { key: "req-a", taskId: "task-a" },
      { key: "req-b", taskId: "task-b" },
    ]);
  });

  it("NULL ARM: with no other tab writing, the same write records exactly one request", () => {
    // Identical call through the identical wrapper; only the interleaved write
    // is absent. Without this, the case above is also satisfied by a writer that
    // never removes anything — which would accumulate resolved requests forever
    // and defeat `clearPendingDispatch`.
    const raced = racedStorage();
    raced.arm(() => {});

    writePendingDispatch({ key: "req-b", taskId: "task-b" }, raced);

    expect(readPendingDispatches(raced)).toEqual([
      { key: "req-b", taskId: "task-b" },
    ]);
  });

  it("keeps a request another tab commits while this tab is clearing a different one", () => {
    // The same window on the other mutation. Resolving task A must not take
    // down a request task B recorded a moment ago.
    const raced = racedStorage();
    writePendingDispatch({ key: "req-a", taskId: "task-a" }, raced);

    raced.arm((otherTab) => {
      writePendingDispatch({ key: "req-b", taskId: "task-b" }, otherTab);
    });
    clearPendingDispatch("task-a", raced);

    expect(readPendingDispatches(raced)).toEqual([
      { key: "req-b", taskId: "task-b" },
    ]);
  });

  it("replaces a task's identity rather than accumulating duplicates", () => {
    writePendingDispatch({ key: "req-1", taskId: "task-1" }, storage);
    writePendingDispatch({ key: "req-2", taskId: "task-1" }, storage);

    expect(readPendingDispatches(storage)).toEqual([
      { key: "req-2", taskId: "task-1" },
    ]);
  });

  it("survives a reload so a resubmission converges instead of duplicating", () => {
    const first = dispatchKeyFor("task-1", [], () => "req-1");
    writePendingDispatch(first, storage);

    // The response never arrives and the page is reloaded: component state is
    // gone, the identity is not.
    const afterReload = readPendingDispatches(storage);
    const resubmitted = dispatchKeyFor("task-1", afterReload, () => "req-2");

    expect(resubmitted).toEqual(first);
  });

  it("starts a new identity for a task with nothing held", () => {
    const held = [{ key: "req-1", taskId: "task-1" }];
    expect(dispatchKeyFor("task-2", held, () => "req-2")).toEqual({
      key: "req-2",
      taskId: "task-2",
    });
  });

  it("starts a new identity once the founder discards the held one", () => {
    writePendingDispatch({ key: "req-1", taskId: "task-1" }, storage);
    clearPendingDispatch("task-1", storage);

    const next = dispatchKeyFor(
      "task-1",
      readPendingDispatches(storage),
      () => "req-2",
    );
    expect(next.key).toBe("req-2");
  });

  it("reads the single-object format written by earlier builds", () => {
    const legacy = fakeStorage({
      [PENDING_DISPATCH_STORAGE_KEY]: JSON.stringify({
        key: "req-legacy",
        taskId: "task-1",
      }),
    });

    expect(readPendingDispatches(legacy)).toEqual([
      { key: "req-legacy", taskId: "task-1" },
    ]);
  });

  it("drops malformed entries without discarding the rest", () => {
    const mixed = fakeStorage({
      [PENDING_DISPATCH_STORAGE_KEY]: JSON.stringify([
        { key: "req-1", taskId: "task-1" },
        { key: "" , taskId: "task-2" },
        { taskId: "task-3" },
        null,
        { key: "req-4", taskId: "task-4" },
      ]),
    });

    expect(readPendingDispatches(mixed)).toEqual([
      { key: "req-1", taskId: "task-1" },
      { key: "req-4", taskId: "task-4" },
    ]);
  });

  it("treats corrupt storage as nothing pending", () => {
    const corrupt = fakeStorage({
      [PENDING_DISPATCH_STORAGE_KEY]: "{not json",
    });
    expect(readPendingDispatches(corrupt)).toEqual([]);
  });

  it("degrades to no recovery when storage is unavailable", () => {
    expect(readPendingDispatches(null)).toEqual([]);
    expect(pendingDispatchFor("task-1", null)).toBeNull();
    expect(() =>
      writePendingDispatch({ key: "k", taskId: "t" }, null),
    ).not.toThrow();
    expect(() => clearPendingDispatch("t", null)).not.toThrow();
  });

  it("survives a storage implementation that throws", () => {
    const hostile: PendingDispatchStorage = {
      get length(): number {
        throw new Error("blocked");
      },
      key: () => {
        throw new Error("blocked");
      },
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
      removeItem: () => {
        throw new Error("blocked");
      },
    };

    expect(readPendingDispatches(hostile)).toEqual([]);
    expect(() =>
      writePendingDispatch({ key: "k", taskId: "t" }, hostile),
    ).not.toThrow();
  });
});
