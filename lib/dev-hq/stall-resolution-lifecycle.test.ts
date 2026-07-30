// A founder decision on a queue-stall escalation must actually end the work.
//
// `queue_stalled` (commit 3471658) is the first escalation origin whose execution
// is NOT terminal when the escalation is raised. `retry_exhausted` raises from a
// `failed` execution and `review_exhausted` from a `succeeded` one; both are
// terminal, so `reconcileQueuedDispatches` — which filters on
// `status !== "queued"` — can never touch them. A stalled execution IS `queued`,
// so it can, and commit 638e45c disclosed the first consequence without asserting
// it. Three follow from the same root:
//
//   (a) `abandon`/`accept` leave a live execution behind a terminal task outcome.
//       `resolveEscalation` writes the task `rejected`/`completed` and never
//       touches the stalled execution, which stays `queued` at attempt 1 with its
//       routing intact. `reconcileQueuedDispatches` filters on status and attempt
//       only — there is no per-task condition — so when capacity returns it
//       assigns and dispatches it. Agent work runs against abandoned work.
//
//   (b) that path then silently REVERSES the founder's terminal decision. The
//       resurrected execution fails three times, `raiseRetryExhaustionEscalation`
//       fires, and because `retry_exhausted != queue_stalled` the per-(execution,
//       origin) dedupe does not collapse it: a genuinely new escalation opens,
//       `ensureEscalatedTaskStatus` finds `hasOpenEscalationForTask` true, and
//       `updateTaskStatusIf` has no terminal guard. `rejected` becomes
//       `needs_revision`. Neither `hasOpenEscalationForTask` nor
//       `isNewestResolutionForTask` catches it — both ask about escalation
//       recency, and this escalation genuinely is the newest.
//
//   (c) a stalled execution can only ever escalate ONCE. `createEscalation`
//       dedupes per (execution, origin) regardless of status — correct for the
//       two terminal origins — and `raiseQueueStallEscalation` returns early on a
//       resolved hit. So after any resolution, an execution that is still stalled
//       keeps satisfying `isQueueStalled` while the raise keeps handing back the
//       resolved escalation. Permanently stranded and permanently unable to say
//       so: the SVC-01 shape the stall deadline exists to close.
//
// Falsifiable claim under test: resolving an escalation whose execution is still
// non-terminal drives that execution to `cancelled`, so (a) the sweep can never
// place it, (b) no later `retry_exhausted` can arise from it to reopen the
// founder's terminal outcome, and (c) nothing is left in the queued-and-stalled
// shape holding only a resolved escalation.
//
// Null arms (STD-CTRL-001 rule 2): every case pairs with `revise` from an
// identical starting state. Cancelling on resolution must not stop the founder's
// authorized retry from being placed, dispatched, escalated on genuine failure,
// or re-escalated when it stalls again — otherwise the fix would satisfy every
// assertion above by simply killing all work.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async () => ({ id: "run-stall-res-1" })),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionReclaim,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import {
  EXECUTION_QUEUE_STALL_DEADLINE_MS,
  MAX_EXECUTION_ATTEMPTS,
} from "@/lib/dev-hq/constants";
import { resolveEscalation } from "@/lib/dev-hq/escalation-service";
import { getExecution } from "@/lib/dev-hq/execution-manager";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Agent, Escalation, Execution, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TASK_ID = "task-stall-resolution";

/** `validation` is held by exactly one seeded agent, so removing it strands. */
const SATISFYING_AGENT = "agent-supervisor";

function seedTask(): Task {
  return saveTask({
    id: TASK_ID,
    projectId: "proj-x",
    workflowId: null,
    title: "Work the founder can abandon",
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

const PAST_DEADLINE = () =>
  new Date(Date.now() + EXECUTION_QUEUE_STALL_DEADLINE_MS + 5_000).toISOString();

function taskExecutions(): Execution[] {
  return [...getDevHqStore().executions.values()].filter(
    (execution) => execution.taskId === TASK_ID,
  );
}

function taskEscalations(): Escalation[] {
  return [...getDevHqStore().escalations.values()].filter(
    (escalation) => escalation.taskId === TASK_ID,
  );
}

async function statusOf(): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(TASK_ID))?.status;
}

function describeExecution(execution: Execution | null | undefined): string {
  if (!execution) return "<missing>";
  return `${execution.id} status=${execution.status} attempt=${execution.attempt} agent=${
    execution.agentId ?? "none"
  } assignment=${execution.assignmentId ?? "none"}`;
}

function describeExecutions(): string {
  const all = taskExecutions();
  return all.length === 0 ? "<none>" : all.map(describeExecution).join(" | ");
}

function describeEscalations(): string {
  const all = taskEscalations();
  if (all.length === 0) return "<none>";
  return all
    .map((e) => `${e.id}:${e.origin}:${e.status}:${e.resolution ?? "-"}`)
    .join(", ");
}

/**
 * The shape the stall deadline exists to detect, restated here rather than
 * imported because `isQueueStalled` is module-private: queued, agent-backed, no
 * agent and no assignment, inside the retry budget. Deliberately independent of
 * the production predicate so this test measures the state, not the predicate.
 */
function isStalledShape(execution: Execution): boolean {
  return (
    execution.status === "queued" &&
    !execution.agentId &&
    !execution.assignmentId &&
    Boolean(execution.routing) &&
    (execution.attempt ?? 0) >= 1 &&
    (execution.attempt ?? 0) <= MAX_EXECUTION_ATTEMPTS
  );
}

/**
 * Executions that are stalled AND carry no escalation that could still reach the
 * founder — every escalation naming them is already resolved. This is (c) stated
 * as a property of the store rather than of one code path: work nothing is
 * running, nothing will run, and nothing can report.
 */
function strandedAndSilent(): Execution[] {
  return taskExecutions().filter((execution) => {
    if (!isStalledShape(execution)) return false;
    const own = taskEscalations().filter(
      (escalation) => escalation.executionId === execution.id,
    );
    return own.length > 0 && own.every((e) => e.status === "resolved");
  });
}

/** Dispatch work only `agent-supervisor` can do, then take it off the roster. */
async function strandByRosterChange(instructions?: string): Promise<{
  executionId: string;
  agent: Agent;
}> {
  const agent = getDevHqStore().agents.get(SATISFYING_AGENT)!;
  const dispatched = await dispatchAgentExecution({
    taskId: TASK_ID,
    requiredCapabilities: ["validation"],
    instructions,
    idempotencyKey: "stall-resolution",
  });
  expect(dispatched.assigned).toBe(true);
  expect(dispatched.agentId).toBe(SATISFYING_AGENT);
  getDevHqStore().agents.delete(SATISFYING_AGENT);
  return { executionId: dispatched.executionId!, agent };
}

/**
 * The identical starting state every case below branches from: one execution
 * stranded by roster change, escalated as `queue_stalled`, task in front of the
 * founder. Only the resolution verb differs between an arm and its null arm.
 */
async function stalledAndEscalated(instructions?: string): Promise<{
  executionId: string;
  agent: Agent;
  escalation: Escalation;
}> {
  const { executionId, agent } = await strandByRosterChange(instructions);
  await handleExecutionReclaim(PAST_DEADLINE());

  const raised = taskEscalations();
  expect(
    raised,
    `setup did not reach the stall escalation (${describeExecutions()})`,
  ).toHaveLength(1);
  expect(raised[0].origin).toBe("queue_stalled");
  expect(await statusOf()).toBe("needs_revision");

  return { executionId, agent, escalation: raised[0] };
}

/** Capacity returns before the founder's decision has been acted on. */
function restoreCapacity(agent: Agent): void {
  saveAgent({ ...agent, availability: "available" });
}

describe("founder resolution of a queue-stall escalation ends the stalled work", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockClear();
    seedTask();
  });

  // --- (a) an abandoned task must not keep running -----------------------------

  describe("(a) a terminal resolution leaves nothing dispatchable behind", () => {
    it("does not place the stalled execution when capacity returns after abandon", async () => {
      const { executionId, agent, escalation } = await stalledAndEscalated();

      await resolveEscalation(escalation.id, "abandon");
      expect(await statusOf()).toBe("rejected");

      const dispatchesBefore = triggerMock.mock.calls.length;
      restoreCapacity(agent);
      await handleExecutionReclaim(PAST_DEADLINE());

      const execution = await getExecution(executionId);
      expect(
        execution?.status,
        "the founder abandoned this task and the execution it was waiting on " +
          "was left `queued` with its routing intact. `reconcileQueuedDispatches` " +
          "filters on status and attempt only — it has no per-task condition — " +
          "so the moment capacity returned it assigned and dispatched work " +
          "against a task the founder had already rejected " +
          `(${describeExecution(execution)})`,
      ).toBe("cancelled");
      expect(
        execution?.agentId ?? null,
        "the abandoned execution was handed an agent",
      ).toBeNull();
      expect(
        triggerMock.mock.calls.length,
        "an agent run was triggered for work the founder abandoned",
      ).toBe(dispatchesBefore);
      expect(await statusOf()).toBe("rejected");
    });

    it("does not place the stalled execution when capacity returns after accept", async () => {
      const { executionId, agent, escalation } = await stalledAndEscalated();

      await resolveEscalation(escalation.id, "accept");
      expect(await statusOf()).toBe("completed");

      const dispatchesBefore = triggerMock.mock.calls.length;
      restoreCapacity(agent);
      await handleExecutionReclaim(PAST_DEADLINE());

      const execution = await getExecution(executionId);
      expect(
        execution?.status,
        "the founder accepted the task as complete and the execution it was " +
          "waiting on was left `queued`; capacity returned and the sweep " +
          `dispatched it against completed work (${describeExecution(execution)})`,
      ).toBe("cancelled");
      expect(
        triggerMock.mock.calls.length,
        "an agent run was triggered for work the founder had already accepted",
      ).toBe(dispatchesBefore);
      expect(await statusOf()).toBe("completed");
    });

    it("NULL ARM: revise still places and dispatches the authorized retry", async () => {
      // Identical starting state, identical returning capacity — only the verb
      // differs. Without this, cancelling on resolution would satisfy every
      // assertion above by making the founder's "try again" run nothing.
      const { executionId, agent, escalation } = await stalledAndEscalated();

      restoreCapacity(agent);
      const dispatchesBefore = triggerMock.mock.calls.length;
      await resolveEscalation(escalation.id, "revise");

      const authorized = taskExecutions().filter(
        (execution) => execution.id !== executionId,
      );
      expect(
        authorized,
        `revise authorized no execution at all (${describeExecutions()})`,
      ).toHaveLength(1);
      expect(
        authorized[0].agentId,
        "the founder authorized a retry and capacity was available, but no " +
          `agent was assigned to it (${describeExecution(authorized[0])})`,
      ).toBe(SATISFYING_AGENT);
      expect(
        triggerMock.mock.calls.length,
        "the authorized revision was never dispatched to an agent",
      ).toBeGreaterThan(dispatchesBefore);
      expect(await statusOf()).toBe("active");
    });
  });

  describe("a resolution ends an execution that started running after the stall", () => {
    it.each(["accept", "abandon", "revise"] as const)(
      "%s cancels the linked running execution before applying the decision",
      async (resolution) => {
        const { executionId, agent, escalation } = await stalledAndEscalated();
        restoreCapacity(agent);
        await handleExecutionReclaim(PAST_DEADLINE());
        await handleExecutionRunning(executionId);
        expect((await getExecution(executionId))?.status).toBe("running");

        await resolveEscalation(escalation.id, resolution);

        expect((await getExecution(executionId))?.status).toBe("cancelled");
        // Assignment does not claim the agent; only the running callback moves
        // availability to busy. Cancellation must release the old running hold.
        expect(getDevHqStore().agents.get(SATISFYING_AGENT)?.availability).toBe(
          "available",
        );
        expect(await statusOf()).toBe(
          resolution === "accept"
            ? "completed"
            : resolution === "abandon"
              ? "rejected"
              : "active",
        );
        if (resolution === "revise") {
          const revisions = taskExecutions().filter(
            (execution) => execution.id !== executionId,
          );
          expect(revisions).toHaveLength(1);
          expect(["queued", "running"]).toContain(revisions[0].status);
        }
      },
    );
  });

  // --- (b) a terminal founder decision must not be reversed --------------------

  describe("(b) an abandoned task is not resurrected by a later escalation", () => {
    it("keeps the task rejected when the stalled execution's own work would have failed", async () => {
      const { executionId, agent, escalation } = await stalledAndEscalated("fail");

      await resolveEscalation(escalation.id, "abandon");
      expect(await statusOf()).toBe("rejected");

      // Capacity returns. Without the fix the sweep places the abandoned
      // execution, it runs, and it exhausts its retry budget.
      restoreCapacity(agent);
      await handleExecutionReclaim(PAST_DEADLINE());
      for (let attempt = 1; attempt <= MAX_EXECUTION_ATTEMPTS; attempt += 1) {
        const current = await getExecution(executionId);
        if (current?.status !== "queued" || !current.agentId) break;
        await handleExecutionRunning(executionId);
        await handleExecutionComplete({ executionId, status: "failed" });
      }
      await handleExecutionReclaim(PAST_DEADLINE());

      expect(
        await statusOf(),
        "the founder ABANDONED this task. The execution left behind was placed " +
          "when capacity returned, failed three times, and raised a " +
          "`retry_exhausted` escalation — a different origin, so the " +
          "per-(execution, origin) dedupe did not collapse it. " +
          "`ensureEscalatedTaskStatus` then saw an open escalation, and " +
          "`updateTaskStatusIf` has no terminal guard, so the task went " +
          "rejected -> needs_revision. Abandoned work is live again and no " +
          "refusal event was recorded. " +
          `Executions: ${describeExecutions()}. Escalations: ${describeEscalations()}`,
      ).toBe("rejected");
      expect(
        taskEscalations().filter((e) => e.origin === "retry_exhausted"),
        "a retry-exhaustion escalation was raised from an execution the " +
          "founder's abandon should have ended",
      ).toHaveLength(0);
    });

    it("NULL ARM: revise still reaches needs_revision when the authorized retry genuinely exhausts", async () => {
      // Identical starting state and identical failing instructions. The task
      // must still be reopened by a genuine exhaustion, or the case above is
      // satisfied by a task that can no longer change status at all.
      const { agent, escalation } = await stalledAndEscalated("fail");

      restoreCapacity(agent);
      await resolveEscalation(escalation.id, "revise");
      expect(await statusOf()).toBe("active");

      const revision = getDevHqStore().escalations.get(escalation.id)!
        .revisionExecutionId!;
      for (let attempt = 1; attempt <= MAX_EXECUTION_ATTEMPTS; attempt += 1) {
        await handleExecutionRunning(revision);
        await handleExecutionComplete({ executionId: revision, status: "failed" });
      }

      expect(
        (await getExecution(revision))?.status,
        `the authorized revision never ran to exhaustion (${describeExecutions()})`,
      ).toBe("failed");
      expect(
        taskEscalations().filter((e) => e.origin === "retry_exhausted"),
        "the authorized revision exhausted its retry budget and the founder " +
          "was never told",
      ).toHaveLength(1);
      expect(
        await statusOf(),
        "a genuine retry exhaustion no longer reopens the task, so the " +
          "escalation path has been silenced rather than scoped",
      ).toBe("needs_revision");
    });
  });

  // --- (c) nothing is left stranded and unable to report -----------------------

  describe("(c) a resolution leaves nothing stalled that can never escalate again", () => {
    it("leaves no execution queued-and-stalled behind a resolved escalation", async () => {
      const { executionId, escalation } = await stalledAndEscalated();

      await resolveEscalation(escalation.id, "abandon");

      // Capacity never returns. The sweep runs repeatedly, as it does every
      // minute in production.
      await handleExecutionReclaim(PAST_DEADLINE());
      await handleExecutionReclaim(PAST_DEADLINE());
      await handleExecutionReclaim(PAST_DEADLINE());

      expect(
        strandedAndSilent().map(describeExecution),
        "this execution is still `queued`, still past the stall deadline, and " +
          "the only escalation naming it is RESOLVED. `createEscalation` dedupes " +
          "per (execution, origin) regardless of status and " +
          "`raiseQueueStallEscalation` returns early on a resolved hit, so every " +
          "future sweep hands back the same resolved record. It is permanently " +
          "stranded and permanently unable to say so — work that neither " +
          "completes nor fails, which is the exact SVC-01 shape the stall " +
          `deadline was built to close. Escalations: ${describeEscalations()}`,
      ).toEqual([]);
      expect(
        (await getExecution(executionId))?.status,
        "the resolved escalation's execution is not terminal",
      ).toBe("cancelled");
    });

    it("NULL ARM: revise can still raise a second stall escalation when the retry also stalls", async () => {
      // Identical starting state; capacity deliberately does NOT return. The
      // founder said "try again", the retry stalls too, and they must be told a
      // second time. This is the half of (c) that proves the fix scoped the
      // escalation path rather than closing it.
      const { escalation } = await stalledAndEscalated();

      await resolveEscalation(escalation.id, "revise");
      await handleExecutionReclaim(PAST_DEADLINE());

      const raised = taskEscalations();
      expect(
        raised,
        "the authorized retry stalled exactly as the original did and the " +
          `founder was never told a second time (${describeEscalations()})`,
      ).toHaveLength(2);
      expect(raised.map((e) => e.origin)).toEqual([
        "queue_stalled",
        "queue_stalled",
      ]);
      expect(
        raised.filter((e) => e.status === "open"),
        "no open escalation is in front of the founder for the stalled retry",
      ).toHaveLength(1);
      expect(await statusOf()).toBe("needs_revision");
    });
  });
});
