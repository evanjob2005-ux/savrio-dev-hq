// F-5. `EscalationStore.findByExecution` is scoped to an origin.
//
// `reconcileUnescalatedFailures` short-circuits on
// `if (await escalationStore.findByExecution(execution.id)) continue;`. That
// lookup did not filter by origin, while `createEscalation` dedupes per
// (execution, origin) — so the reader and the writer disagreed about what
// identifies an escalation.
//
// The moment `queue_stalled` existed that became a live hazard: an execution can
// legitimately stall in the queue, be escalated for it, then get capacity and
// genuinely exhaust its retry budget. A backstop asking "has this execution
// escalated at all?" finds the stall, skips the exhaustion, and the founder is
// never told about the real failure.
//
// **What was and was not reachable, stated plainly.** The service-level
// consequence is masked today: `reconcileAttemptRecords` runs earlier in the
// same sweep and raises the retry-exhaustion escalation before the backstop is
// reached, so both escalations exist either way. That is an ordering accident,
// not a guarantee — nothing states it, and it is one reordering away from
// mattering. So the claim under test is about the query the backstop issues, not
// about an outcome the ordering currently rescues:
//
//   Falsifiable claim: the backstop asks the escalation store about the origin
//   it raises (`retry_exhausted`), never about "any escalation on this
//   execution" — and the store answers only about that origin.
//
// The store-level half of this (a `queue_stalled` escalation must not answer a
// `retry_exhausted` lookup) is in `adapters/dev-escalation-store.test.ts`.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock, findByExecutionCalls } = vi.hoisted(() => ({
  triggerMock: vi.fn(),
  findByExecutionCalls: [] as Array<[string, string | undefined]>,
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

/**
 * Records every `findByExecution` the services issue, leaving the real store
 * doing the work. The recorded arguments are the seam: the defect is a query
 * that asks a broader question than the caller needs, and the query is the only
 * place that is observable while the sweep ordering masks its consequence.
 */
vi.mock("@/lib/dev-hq/adapters", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/dev-hq/adapters")>();
  return {
    ...actual,
    getDevHqAdapters: () => {
      const real = actual.getDevHqAdapters();
      // A Proxy rather than a spread: the store is a class instance, so its
      // methods live on the prototype and a spread would produce an object with
      // none of them.
      return {
        ...real,
        escalationStore: new Proxy(real.escalationStore, {
          get(target, property, receiver) {
            if (property === "findByExecution") {
              return (executionId: string, origin?: string) => {
                findByExecutionCalls.push([executionId, origin]);
                return target.findByExecution(executionId, origin as never);
              };
            }
            const value = Reflect.get(target, property, receiver);
            return typeof value === "function" ? value.bind(target) : value;
          },
        }),
      };
    },
  };
});

import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionReclaim,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { getExecution } from "@/lib/dev-hq/execution-manager";
import { getDevHqStore, resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Escalation, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";

function seedTask(): Task {
  return saveTask({
    id: "task-origin-1",
    projectId: "proj-x",
    workflowId: null,
    title: "Stalled then exhausted",
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

/** Drive one dispatched execution through its whole retry budget to `failed`. */
async function exhaustRetryBudget(): Promise<string> {
  const task = seedTask();
  const dispatched = await dispatchAgentExecution({
    taskId: task.id,
    requiredCapabilities: ["validation"],
    instructions: "please fail",
    reviewPolicy: "none",
    idempotencyKey: "origin-scope",
  });
  const executionId = dispatched.executionId!;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const current = (await getExecution(executionId))!;
    await handleExecutionRunning(executionId, current.assignmentId!);
    await handleExecutionComplete({
      executionId,
      assignmentId: (await getExecution(executionId))!.assignmentId!,
      status: "failed",
    });
  }
  const execution = (await getExecution(executionId))!;
  expect(execution.status).toBe("failed");
  expect(execution.attempt).toBe(3);
  return executionId;
}

function escalationsFor(executionId: string): Escalation[] {
  return [...getDevHqStore().escalations.values()].filter(
    (escalation) => escalation.executionId === executionId,
  );
}

describe("escalation lookups are scoped to an origin (F-5)", () => {
  beforeEach(() => {
    resetDevHqStore();
    findByExecutionCalls.length = 0;
    let counter = 0;
    const runsByKey = new Map<string, string>();
    triggerMock.mockReset();
    triggerMock.mockImplementation(
      async (
        _taskId: string,
        _payload: unknown,
        options?: { idempotencyKey?: string },
      ) => {
        const key = options?.idempotencyKey;
        if (key && runsByKey.has(key)) return { id: runsByKey.get(key)! };
        const id = `run-${(counter += 1)}`;
        if (key) runsByKey.set(key, id);
        return { id };
      },
    );
  });

  it("asks the store about the origin the backstop raises, not about any escalation", async () => {
    const executionId = await exhaustRetryBudget();

    // A queue-stall escalation already on record for this execution. This is the
    // state the origin-agnostic lookup could not distinguish from "the
    // retry-exhaustion escalation has already been raised".
    await getDevHqAdapters().escalationStore.createEscalation({
      origin: "queue_stalled",
      taskId: "task-origin-1",
      executionId,
      summary: "Queued past the stall deadline.",
    });

    findByExecutionCalls.length = 0;
    await handleExecutionReclaim();

    const queries = findByExecutionCalls.filter(([id]) => id === executionId);
    expect(
      queries.length,
      "the unescalated-failure backstop never queried the escalation store, so this test is not observing it",
    ).toBeGreaterThan(0);
    expect(
      queries.map(([, origin]) => origin),
      `the backstop asked whether execution ${executionId} had escalated AT ALL. It carries a queue_stalled escalation, so the answer is yes — and the retry-exhaustion escalation the founder actually needs would be skipped. Only the ordering of reconcileAttemptRecords earlier in the same sweep hides that today (F-5)`,
    ).toEqual(queries.map(() => "retry_exhausted"));
  });

  /**
   * The composed outcome, pinned as a regression.
   *
   * **This test stays GREEN with the fix reverted**, and that is disclosed
   * rather than presented as evidence: `reconcileAttemptRecords` raises the
   * retry-exhaustion escalation earlier in the same sweep, so the backstop's
   * skip never gets to matter. It is kept because it states the invariant the
   * founder depends on — a stall and a genuine exhaustion are two separate
   * decisions — so a future reordering that removes the accidental rescue fails
   * here rather than silently.
   */
  it("keeps a stall escalation and a retry-exhaustion escalation as two separate decisions", async () => {
    const executionId = await exhaustRetryBudget();
    await getDevHqAdapters().escalationStore.createEscalation({
      origin: "queue_stalled",
      taskId: "task-origin-1",
      executionId,
      summary: "Queued past the stall deadline.",
    });

    await handleExecutionReclaim();

    expect(
      escalationsFor(executionId)
        .map((escalation) => escalation.origin)
        .sort(),
    ).toEqual(["queue_stalled", "retry_exhausted"]);
  });

  /**
   * NULL ARM. Identical starting state minus the foreign-origin escalation. The
   * backstop must still find its OWN escalation and skip — a scoped lookup that
   * matched nothing would raise a second escalation on every sweep, which is the
   * failure mode the skip exists to prevent.
   */
  it("null arm: an execution that already carries its own escalation is skipped", async () => {
    const executionId = await exhaustRetryBudget();

    await handleExecutionReclaim();
    await handleExecutionReclaim();
    await handleExecutionReclaim();

    expect(
      escalationsFor(executionId).map((escalation) => escalation.origin),
      "repeated sweeps raised more than one retry-exhaustion escalation; the scoped lookup no longer recognises the escalation it raised itself",
    ).toEqual(["retry_exhausted"]);
  });
});
