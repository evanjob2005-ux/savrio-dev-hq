// SVC-04. Reading the event feed used to call `buildDevHqState()`, which
// projects and sorts every collection in the store, and then discarded all of it
// but the events. Mission Control polls this every 3 seconds, so the discarded
// work scaled with total accumulated history rather than with the feed.
//
// Falsifiable claim under test: `DevEventLogger.listRecent` never builds the
// Dev HQ state projection, and returns exactly the events the projection would
// have returned — same set, same order.

import { beforeEach, describe, expect, it, vi } from "vitest";

// Counts calls to the whole-state projection. Every other store export passes
// through untouched, so the adapter runs against the real store.
const { stateBuilds } = vi.hoisted(() => ({ stateBuilds: { count: 0 } }));

vi.mock("@/lib/dev-hq/store", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dev-hq/store")>();
  return {
    ...actual,
    buildDevHqState: (
      ...args: Parameters<typeof actual.buildDevHqState>
    ) => {
      stateBuilds.count += 1;
      return actual.buildDevHqState(...args);
    },
  };
});

import { createDevEventLogger } from "@/lib/dev-hq/adapters/dev-event-logger";
import {
  appendEvent,
  buildDevHqState,
  resetDevHqStore,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Event, EventEntityType } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

/**
 * Seed events oldest-first on distinct ascending timestamps, alternating entity
 * types so the filters have something to discriminate. Every third event shares
 * its timestamp with the one before it, which is what makes the ordering
 * comparison below sensitive to sort stability rather than only to the
 * comparator.
 */
function seedEvents(count: number): Event[] {
  const seeded: Event[] = [];
  for (let index = 0; index < count; index += 1) {
    const second = index - (index % 3 === 2 ? 1 : 0);
    seeded.push(
      appendEvent({
        id: `evt-${index}`,
        type: "test.event",
        entityType: (index % 2 === 0 ? "task" : "execution") as EventEntityType,
        entityId: index % 2 === 0 ? "task-1" : "exec-1",
        message: `event ${index}`,
        actorId: null,
        actorLabel: "System",
        timestamp: new Date(Date.UTC(2026, 6, 24, 21, 0, second)).toISOString(),
      }),
    );
  }
  return seeded;
}

/** Non-event state, so a whole-state rebuild has something to rebuild. */
function seedUnrelatedState(): void {
  for (let index = 0; index < 25; index += 1) {
    saveTask({
      id: `task-${index}`,
      projectId: "proj-x",
      workflowId: null,
      title: `Task ${index}`,
      description: "Unrelated to the event feed.",
      status: "active",
      priority: "High",
      assigneeAgentId: null,
      claimedAt: null,
      createdAt: TS,
      updatedAt: TS,
      dueAt: null,
    });
  }
}

describe("DevEventLogger.listRecent (SVC-04)", () => {
  const logger = createDevEventLogger();

  beforeEach(() => {
    resetDevHqStore();
    stateBuilds.count = 0;
  });

  // --- null arm (rule 2). Without this, "listRecent never builds the state"
  // would also hold for a counter that can never increment, and the assertion
  // below would be measuring nothing.
  it("null arm: the counter observes a real whole-state build", () => {
    seedEvents(5);
    seedUnrelatedState();

    expect(stateBuilds.count).toBe(0);
    buildDevHqState();
    expect(
      stateBuilds.count,
      "the buildDevHqState spy never fired, so the assertion that listRecent " +
        "avoids it proves nothing",
    ).toBe(1);
  });

  it("does not rebuild the whole Dev HQ state to read the feed", async () => {
    seedEvents(60);
    seedUnrelatedState();

    await logger.listRecent({ limit: 20 });

    expect(
      stateBuilds.count,
      "listRecent built the entire Dev HQ state projection — every project, " +
        "task, approval, workflow, execution, workflow run, agent, evidence " +
        "row, escalation, review and finding, sorted — to return at most 20 " +
        "events, on a 3-second poll (SVC-04)",
    ).toBe(0);
  });

  it("does not rebuild the state for a filtered or unlimited read either", async () => {
    seedEvents(30);
    seedUnrelatedState();

    await logger.listRecent();
    await logger.listRecent({ entityType: "task" });
    await logger.listRecent({ entityId: "exec-1", limit: 5 });

    expect(stateBuilds.count).toBe(0);
  });

  // --- the ordering semantics must be identical, not merely "sorted" ---
  describe("returns exactly what the state projection would have returned", () => {
    /** The old implementation, expressed against the same starting state. */
    function viaWholeState(query?: {
      entityType?: EventEntityType;
      entityId?: string;
      limit?: number;
    }): Event[] {
      let events = buildDevHqState().events;
      if (query?.entityType) {
        events = events.filter((e) => e.entityType === query.entityType);
      }
      if (query?.entityId) {
        events = events.filter((e) => e.entityId === query.entityId);
      }
      return events.slice(0, query?.limit ?? 50);
    }

    it.each([
      { name: "default", query: undefined },
      { name: "limit 20", query: { limit: 20 } },
      { name: "limit 1", query: { limit: 1 } },
      { name: "entityType", query: { entityType: "task" as EventEntityType } },
      { name: "entityId", query: { entityId: "exec-1" } },
      {
        name: "both filters and a limit",
        query: {
          entityType: "execution" as EventEntityType,
          entityId: "exec-1",
          limit: 4,
        },
      },
    ])("$name", async ({ query }) => {
      seedEvents(60);
      seedUnrelatedState();

      const expected = viaWholeState(query);
      const actual = await logger.listRecent(query);

      expect(actual.map((event) => event.id)).toEqual(
        expected.map((event) => event.id),
      );
      expect(actual).toEqual(expected);
    });
  });
});
