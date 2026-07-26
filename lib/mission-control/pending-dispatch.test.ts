import { beforeEach, describe, expect, it } from "vitest";

import {
  PENDING_DISPATCH_STORAGE_KEY,
  clearPendingDispatch,
  dispatchKeyFor,
  pendingDispatchFor,
  readPendingDispatches,
  writePendingDispatch,
  type PendingDispatchStorage,
} from "@/lib/mission-control/pending-dispatch";

/** A store that survives a "reload" the same way the browser's does. */
function fakeStorage(initial?: Record<string, string>): PendingDispatchStorage & {
  data: Map<string, string>;
} {
  const data = new Map(Object.entries(initial ?? {}));
  return {
    data,
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => void data.set(key, value),
    removeItem: (key) => void data.delete(key),
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
    clearPendingDispatch("task-1", storage);

    expect(storage.data.has(PENDING_DISPATCH_STORAGE_KEY)).toBe(false);
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
    // Both tabs read the same storage; each writes its own task's identity from
    // its own (already stale) snapshot.
    const tabOneSnapshot = readPendingDispatches(storage);
    writePendingDispatch({ key: "req-a", taskId: "task-a" }, storage);

    expect(tabOneSnapshot).toHaveLength(0); // the second tab still believes this
    writePendingDispatch({ key: "req-b", taskId: "task-b" }, storage);

    expect(readPendingDispatches(storage)).toEqual([
      { key: "req-a", taskId: "task-a" },
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
