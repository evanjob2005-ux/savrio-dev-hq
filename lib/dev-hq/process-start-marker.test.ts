// The process-start marker (Founder Decision B1, ratified with E-3).
//
// The Dev HQ store is non-durable by ratified design: a restart clears it, and
// for pending approvals that loss is the correct and total failure mode. What is
// not acceptable is a reader who cannot tell that it happened. An empty approval
// queue means either "nothing is waiting on you" or "the queue you were looking
// at no longer exists", and those demand opposite responses from the founder.
//
// These tests pin the marker that separates them. They assert the disclosure,
// never durability — the marker exists precisely because the state is not
// durable, and it must never be read as a claim that it is.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { GET } from "@/app/api/dev-hq/state/route";
import {
  buildDevHqState,
  getDevHqStore,
  resetDevHqStore,
  saveTask,
} from "@/lib/dev-hq/store";
import type { DevHqState } from "@/lib/dev-hq/types";
import type { Task } from "@/types/domain";

const TS = "2026-07-27T09:00:00.000Z";

function seedTask(id: string): Task {
  return saveTask({
    id,
    projectId: "proj-marker",
    workflowId: null,
    title: "Work that a restart would destroy",
    description: "Content that exists only in memory.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

/** Reads the snapshot the way the browser does: over the route, as JSON. */
async function readSnapshotOverHttp(): Promise<DevHqState> {
  const response = await GET();
  return (await response.json()) as DevHqState;
}

/**
 * A reader holding nothing but the snapshots it has been served. It keeps the
 * last marker it saw — no clock, no store access, no side channel — which is all
 * Mission Control will have.
 */
function classifyEmptyQueue(
  previous: DevHqState,
  current: DevHqState,
): "empty" | "cleared" {
  return current.processStart.id === previous.processStart.id
    ? "empty"
    : "cleared";
}

describe("process-start marker", () => {
  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
  });

  it("is present on the snapshot and is supplied by the server", async () => {
    const marker = buildDevHqState().processStart;

    expect(typeof marker.id).toBe("string");
    expect(marker.id.length).toBeGreaterThan(0);
    expect(typeof marker.startedAt).toBe("string");
    expect(Number.isNaN(Date.parse(marker.startedAt))).toBe(false);

    // Server-supplied, not client-supplied: the value the browser receives is
    // the one the server store already held. GET accepts no request input, so
    // there is no argument by which a caller could have authored it.
    const overHttp = await readSnapshotOverHttp();
    expect(overHttp.processStart).toEqual(getDevHqStore().processStart);

    // And a reader cannot write it back — the snapshot carries a copy, so
    // editing what was served leaves the server's own record untouched.
    overHttp.processStart.id = "client-supplied";
    expect(getDevHqStore().processStart.id).not.toBe("client-supplied");
    expect(buildDevHqState().processStart.id).toBe(marker.id);
  });

  it("is stable across reads within one lifetime", async () => {
    const first = buildDevHqState().processStart;
    seedTask("task-marker-stable");
    const second = buildDevHqState().processStart;
    const third = await readSnapshotOverHttp();

    // Unchanged by an intervening write, and identical over the wire.
    expect(second).toEqual(first);
    expect(third.processStart).toEqual(first);
  });

  it("changes when the store lifetime ends, so a restart is distinguishable", () => {
    const before = buildDevHqState().processStart;

    // resetDevHqStore replaces the store instance, which is what a process
    // restart does to it. The marker is what makes the replacement observable.
    resetDevHqStore();
    const after = buildDevHqState().processStart;

    expect(after.id).not.toBe(before.id);
  });

  it("lets a reader tell an empty queue from a cleared one", async () => {
    // Genuinely empty: nothing has been recorded, and nothing was lost.
    const firstRead = await readSnapshotOverHttp();
    const secondRead = await readSnapshotOverHttp();
    expect(firstRead.approvals).toHaveLength(0);
    expect(secondRead.approvals).toHaveLength(0);
    expect(classifyEmptyQueue(firstRead, secondRead)).toBe("empty");

    // Now the store holds something a restart would destroy.
    seedTask("task-marker-cleared");
    const populated = await readSnapshotOverHttp();
    expect(populated.tasks).toHaveLength(1);

    resetDevHqStore();
    const afterRestart = await readSnapshotOverHttp();

    // The queue reads empty exactly as it did before — the emptiness alone is
    // ambiguous. The marker is the only thing separating the two cases.
    expect(afterRestart.approvals).toHaveLength(0);
    expect(afterRestart.tasks).toHaveLength(0);
    expect(afterRestart.approvals).toEqual(secondRead.approvals);
    expect(classifyEmptyQueue(populated, afterRestart)).toBe("cleared");
  });

  it("asserts nothing about durability", async () => {
    seedTask("task-marker-durability");
    const before = await readSnapshotOverHttp();
    expect(before.tasks).toHaveLength(1);

    resetDevHqStore();
    const after = await readSnapshotOverHttp();

    // The marker carries an identity and a start instant. Nothing else — no
    // recovery handle, no persistence claim, no "restored" flag that would
    // suggest the previous lifetime can be reached.
    expect(Object.keys(after.processStart).sort()).toEqual(["id", "startedAt"]);

    // The marker changing is a report of loss, not a repair of it: what the
    // previous lifetime held is gone, and the new lifetime starts empty.
    expect(after.tasks).toHaveLength(0);
    expect(after.processStart.id).not.toBe(before.processStart.id);

    // The new lifetime's start instant describes the new lifetime only; it
    // makes no claim of continuity with the one that ended.
    expect(Date.parse(after.processStart.startedAt)).toBeGreaterThanOrEqual(
      Date.parse(before.processStart.startedAt),
    );
  });
});
