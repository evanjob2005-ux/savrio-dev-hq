// P0-3. An older escalation's replay could overwrite a newer founder decision.
//
// `resolveEscalation` is documented as idempotent — "the transition is applied
// once and re-resolving is a no-op that re-returns the escalation" — and the
// store transition genuinely is. The task-status write that follows it is not.
// It is re-issued on every replay, derived from the escalation's own persisted
// resolution, and guarded only by `hasOpenEscalationForTask`.
//
// That guard asks whether a decision is *outstanding*. It cannot answer whether
// this decision is the *current* one, so a replay arriving after every
// escalation on the task has closed passes it and writes an outcome the founder
// has already superseded:
//
//   E1 accept (refused, E2 open) -> E2 abandon (task rejected) -> E1 replays
//   -> task completed
//
// Falsifiable claim under test: the task outcome always reflects the founder
// decision that was committed LAST on that task, no matter how many times an
// earlier decision is replayed, and for every resolution verb.
//
// Null arm (STD-CTRL-001 rule 2): from an identical starting state, a replay of
// the decision that IS the newest must still apply its outcome. Without it,
// every assertion below is equally satisfied by a resolution path that simply
// stopped writing the field.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async () => ({ id: "run-recency-1" })),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  raiseRetryExhaustionEscalation,
  resolveEscalation,
} from "@/lib/dev-hq/escalation-service";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Escalation, Execution, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TASK_ID = "task-recency";

function seedTask(): Task {
  return saveTask({
    id: TASK_ID,
    projectId: "proj-x",
    workflowId: null,
    title: "Work under two escalations",
    description: "Do the work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

/**
 * A retry-exhausted execution record, handed to the raise rather than persisted
 * — the same helper shape `task-status-coordination.test.ts` uses, so an
 * escalation can be raised on a task without driving three agent attempts.
 */
function exhaustedExecution(id: string): Execution {
  return {
    id,
    taskId: TASK_ID,
    workflowId: null,
    agentId: "agent-supervisor",
    status: "failed",
    triggerRunId: null,
    startedAt: null,
    completedAt: TS,
    createdAt: TS,
    assignmentId: null,
    attempt: 3,
  };
}

function raiseOn(executionId: string): Promise<Escalation> {
  return raiseRetryExhaustionEscalation(exhaustedExecution(executionId));
}

async function statusOf(): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(TASK_ID))?.status;
}

describe("founder decision recency across escalation replays (P0-3)", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockClear();
    seedTask();
  });

  // --- null arm (rule 2) -----------------------------------------------------
  //
  // Identical starting state — the same task, the same escalations, the same
  // replayed call. Only which decision is the newest differs. These must pass.

  describe("null arm: a replay of the newest decision still applies its outcome", () => {
    it("keeps the task completed when the only escalation's accept is replayed", async () => {
      const only = await raiseOn("exec-only");
      await resolveEscalation(only.id, "accept");
      expect(await statusOf()).toBe("completed");

      await resolveEscalation(only.id, "accept");

      expect(
        await statusOf(),
        "a replay of the operative founder decision stopped applying its own " +
          "outcome — the recency check is refusing writes it must allow",
      ).toBe("completed");
    });

    it("applies and re-applies the LAST of two decisions", async () => {
      const first = await raiseOn("exec-a");
      const second = await raiseOn("exec-b");

      await resolveEscalation(first.id, "accept"); // refused: E2 still open
      expect(await statusOf()).toBe("needs_revision");

      await resolveEscalation(second.id, "abandon");
      expect(await statusOf()).toBe("rejected");

      // The newest decision replayed. Same call shape as the defect arm below;
      // the only difference is whose decision it is.
      await resolveEscalation(second.id, "abandon");

      expect(
        await statusOf(),
        "the newest founder decision could not re-apply its own outcome on " +
          "replay, so the guard is blocking the current decision as well as " +
          "the superseded one",
      ).toBe("rejected");
    });

    it("still reopens the task when the newest decision is a revise replay", async () => {
      const only = await raiseOn("exec-only");
      await resolveEscalation(only.id, "revise");
      expect(await statusOf()).toBe("active");

      await resolveEscalation(only.id, "revise");

      expect(
        await statusOf(),
        "a replayed revise that is still the newest decision failed to keep " +
          "the task open for its authorized revision",
      ).toBe("active");
    });

    it("lets a genuinely newer decision overwrite an older applied one", async () => {
      // Recency must not become "first decision wins". A later escalation
      // resolved later is exactly the case that SHOULD move the task.
      const first = await raiseOn("exec-a");
      await resolveEscalation(first.id, "accept");
      expect(await statusOf()).toBe("completed");

      const second = await raiseOn("exec-b");
      expect(await statusOf()).toBe("needs_revision");
      await resolveEscalation(second.id, "abandon");

      expect(
        await statusOf(),
        "a founder decision made AFTER an applied one was refused; recency " +
          "must order decisions, not freeze the first one",
      ).toBe("rejected");
    });
  });

  // --- the defect (rule 1) ---------------------------------------------------

  describe("a superseded decision replayed after every escalation has closed", () => {
    it("does not let an older accept overwrite a newer abandon", async () => {
      const first = await raiseOn("exec-a");
      const second = await raiseOn("exec-b");

      // 1. E1 resolves accept while E2 is still open. Correctly refused.
      await resolveEscalation(first.id, "accept");
      expect(await statusOf()).toBe("needs_revision");

      // 2. E2 resolves abandon. Nothing is outstanding, so it lands.
      await resolveEscalation(second.id, "abandon");
      expect(await statusOf()).toBe("rejected");

      // 3. E1's request is retried — a duplicate POST, a client retry, a
      //    reconciliation. Nothing is open for it to yield to any more.
      await resolveEscalation(first.id, "accept");

      expect(
        await statusOf(),
        "an escalation resolved BEFORE the founder's abandon replayed after " +
          "everything had closed and marked the task completed: the older " +
          "decision overwrote the newer one, because every precondition asked " +
          "about the present state and none asked whose decision this is (P0-3)",
      ).toBe("rejected");
    });

    it("does not let an older abandon overwrite a newer accept", async () => {
      // The mirror, so the assertion cannot be satisfied by a rule that simply
      // prefers `rejected` to `completed`.
      const first = await raiseOn("exec-a");
      const second = await raiseOn("exec-b");

      await resolveEscalation(first.id, "abandon");
      await resolveEscalation(second.id, "accept");
      expect(await statusOf()).toBe("completed");

      await resolveEscalation(first.id, "abandon");

      expect(
        await statusOf(),
        "an older abandon replayed over the founder's newer accept and " +
          "rejected work that had been approved (P0-3)",
      ).toBe("completed");
    });

    it("does not let an older revise reopen work the founder has since abandoned", async () => {
      const first = await raiseOn("exec-a");
      const second = await raiseOn("exec-b");

      // A revise reopens the task and authorizes one fresh execution.
      await resolveEscalation(first.id, "revise");
      expect(await statusOf()).toBe("active");

      await resolveEscalation(second.id, "abandon");
      expect(await statusOf()).toBe("rejected");

      // The revision execution is still queued, so it is still "live" — which
      // is the only thing the revise path checked. Being live says nothing
      // about whether the decision that authorized it still stands.
      await resolveEscalation(first.id, "revise");

      expect(
        await statusOf(),
        "a superseded revise replayed and reopened a task the founder had " +
          "abandoned: the task is active again, as live work, under a decision " +
          "that has been overruled (P0-3)",
      ).toBe("rejected");
    });

    it("records the founder's decisions in commit order, not wall-clock order", async () => {
      // The recency authority cannot be `resolvedAt`: it is millisecond
      // wall-clock, and two resolutions committed inside one millisecond
      // compare equal — under which "nothing newer exists" and "something
      // newer exists that I cannot distinguish from mine" are the same
      // reading, and the replay wins. This asserts the two decisions are
      // ordered even when they share a timestamp.
      const first = await raiseOn("exec-a");
      const second = await raiseOn("exec-b");
      const store = getDevHqAdapters().escalationStore;

      await resolveEscalation(first.id, "accept");
      await resolveEscalation(second.id, "abandon");

      const e1 = await store.getEscalation(first.id);
      const e2 = await store.getEscalation(second.id);
      const tied = e1?.resolvedAt === e2?.resolvedAt;

      await resolveEscalation(first.id, "accept");

      expect(
        await statusOf(),
        `the superseded decision won a same-millisecond tie (resolvedAt tied: ${tied}); ` +
          "the ordering must be a total order, not a wall-clock comparison (P0-3)",
      ).toBe("rejected");
    });
  });
});
