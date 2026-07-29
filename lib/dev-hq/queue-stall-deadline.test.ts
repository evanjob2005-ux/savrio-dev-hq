// P0-5 residue. Queued work could strand forever.
//
// Commit 70c767e shut the dispatch-time hole — a capability set no registered
// agent can satisfy is now refused — and disclosed, without asserting, that the
// limbo remained reachable through roster change: dispatch legitimately with a
// satisfiable capability, then remove the satisfying agent, and the execution
// sits `queued` at attempt 1 with no agent, re-observed silently by every sweep,
// forever.
//
// It is invisible to every recovery that exists. `reclaimStale` looks at
// `running` attempts, which hold a lease. The claim deadline looks at dispatched
// assignments, which hold a `dispatchedAt`. This execution holds neither, so
// `reconcileQueuedDispatches` declines identically on every cycle without
// consuming an attempt, the retry budget never exhausts, and
// `raiseRetryExhaustionEscalation` is never reached. This is the SVC-01 shape
// (commit e5aac96): work that neither completes nor fails.
//
// The deadline amends ADR-0001 O6 and landed under a Founder-delegated decision
// on 2026-07-29, together with a third `EscalationOrigin` member,
// `queue_stalled`.
//
// Falsifiable claim under test: an execution that has been queued with no agent
// for longer than EXECUTION_QUEUE_STALL_DEADLINE_MS raises exactly one founder
// escalation with origin `queue_stalled` and moves its task to
// `needs_revision`, consuming no attempt — and that escalation does not
// suppress a later, genuine retry-exhaustion escalation on the same execution.
//
// Null arm (STD-CTRL-001 rule 2): work that is legitimately queued — within the
// deadline, or still satisfiable when the sweep runs — must NOT be escalated.
// Without it, the deadline could satisfy every assertion above by escalating
// everything queued, replacing silent stranding with spurious escalation.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async () => ({ id: "run-stall-1" })),
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
import { getExecution } from "@/lib/dev-hq/execution-manager";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Agent, Escalation, Execution, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TASK_ID = "task-stall";

/** `validation` is held by exactly one seeded agent, so removing it strands. */
const SATISFYING_AGENT = "agent-supervisor";

function seedTask(): Task {
  return saveTask({
    id: TASK_ID,
    projectId: "proj-x",
    workflowId: null,
    title: "Work that can strand",
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

/** An instant `offsetMs` after now, for driving the sweep past a deadline. */
function laterBy(offsetMs: number): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

const PAST_DEADLINE = () => laterBy(EXECUTION_QUEUE_STALL_DEADLINE_MS + 5_000);
const WITHIN_DEADLINE = () => laterBy(EXECUTION_QUEUE_STALL_DEADLINE_MS - 5_000);

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
    idempotencyKey: "stall",
  });
  expect(dispatched.assigned).toBe(true);
  expect(dispatched.agentId).toBe(SATISFYING_AGENT);

  // The agent leaves the roster — decommissioned, or permanently offline.
  getDevHqStore().agents.delete(SATISFYING_AGENT);
  return { executionId: dispatched.executionId!, agent };
}

async function escalations(): Promise<Escalation[]> {
  return [...getDevHqStore().escalations.values()].filter(
    (escalation) => escalation.taskId === TASK_ID,
  );
}

async function statusOf(): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(TASK_ID))?.status;
}

function describeExecution(execution: Execution | null): string {
  if (!execution) return "<missing>";
  return `status=${execution.status} attempt=${execution.attempt} agent=${
    execution.agentId ?? "none"
  } assignment=${execution.assignmentId ?? "none"}`;
}

function describeEscalations(list: Escalation[]): string {
  if (list.length === 0) return "<none>";
  return list.map((e) => `${e.id}:${e.origin}`).join(", ");
}

describe("stall deadline on queued executions (P0-5)", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockClear();
    seedTask();
  });

  // --- null arm (rule 2) -----------------------------------------------------
  //
  // The required control. If legitimately queued work escalates, the deadline
  // has traded a silent failure for a noisy one.

  describe("null arm: legitimately queued work is not escalated", () => {
    it("does not escalate work that is still satisfiable when the sweep runs", async () => {
      // Queued with no agent only because the satisfying agent was busy at
      // dispatch time. The agent is free again by the time the sweep runs, so
      // the execution is placeable — and the sweep must place it, not escalate
      // it, however long it has been waiting.
      const supervisor = getDevHqStore().agents.get(SATISFYING_AGENT)!;
      saveAgent({ ...supervisor, availability: "busy" });

      const dispatched = await dispatchAgentExecution({
        taskId: TASK_ID,
        requiredCapabilities: ["validation"],
        idempotencyKey: "satisfiable",
      });
      expect(dispatched.assigned).toBe(false);
      expect(dispatched.reason).toBe("no_agent_available");

      saveAgent({ ...supervisor, availability: "available" });
      await handleExecutionReclaim(PAST_DEADLINE());

      const execution = await getExecution(dispatched.executionId!);
      expect(
        await escalations(),
        "work that was still satisfiable when the sweep ran was escalated to " +
          "the founder; the deadline must not fire on work capacity can serve " +
          `(execution: ${describeExecution(execution)})`,
      ).toHaveLength(0);
      expect(
        execution?.agentId,
        "the sweep escalated instead of placing placeable work",
      ).toBe(SATISFYING_AGENT);
      expect(await statusOf()).toBe("active");
    });

    it("does not escalate stranded work that is still inside the deadline", async () => {
      await strandByRosterChange();

      await handleExecutionReclaim(WITHIN_DEADLINE());

      expect(
        await escalations(),
        "work queued for less than the stall deadline was escalated; waiting " +
          "for capacity is the approved outcome (ADR-0001 O6) until the bound " +
          "is actually breached",
      ).toHaveLength(0);
      expect(await statusOf()).toBe("active");
    });

    it("does not escalate a founder-request execution that carries no routing", async () => {
      // Founder-request executions are never assigned an agent by design
      // (ADR-0001 D2), so an unrouted execution must be outside this deadline
      // entirely or every one of them looks permanently stalled.
      const { queueExecution } = await import("@/lib/dev-hq/execution-manager");
      const queued = await queueExecution(TASK_ID, null as unknown as string);

      await handleExecutionReclaim(PAST_DEADLINE());

      expect(
        await escalations(),
        `a workflow-engine execution with no routing was escalated as a ` +
          `stalled agent dispatch (${describeExecution(await getExecution(queued.id))})`,
      ).toHaveLength(0);
    });
  });

  // --- the defect (rule 1) ---------------------------------------------------

  describe("work stranded by roster change reaches the founder", () => {
    it("escalates an execution queued past the stall deadline", async () => {
      const { executionId } = await strandByRosterChange();

      await handleExecutionReclaim(PAST_DEADLINE());

      const raised = await escalations();
      const execution = await getExecution(executionId);
      expect(
        raised,
        "the satisfying agent left the roster and the execution stranded: it " +
          "sits queued with no agent, re-observed by every sweep, no attempt " +
          "consumed so the retry budget never exhausts, and NO ESCALATION is " +
          "ever raised — work that neither completes nor fails " +
          `(${describeExecution(execution)}) (P0-5)`,
      ).toHaveLength(1);
      expect(raised[0].executionId).toBe(executionId);
      expect(raised[0].status).toBe("open");
      expect(
        raised[0].origin,
        "a stall must be reported as a stall. `retry_exhausted` would put " +
          "'exhausted its retry budget after 1 attempt' in the founder's queue " +
          "for work that made zero attempts",
      ).toBe("queue_stalled");
      expect(raised[0].summary).toContain("queued");
    });

    it("puts the task in front of the founder", async () => {
      await strandByRosterChange();

      await handleExecutionReclaim(PAST_DEADLINE());

      expect(
        await statusOf(),
        "the stall escalation was raised but the task stayed active, so the " +
          "board still reports live work that nothing is running (P0-5)",
      ).toBe("needs_revision");
    });

    it("escalates without consuming an attempt, leaving the execution queued", async () => {
      // The declared policy, asserted so a later change to it is visible:
      // nothing ran, so no attempt is charged, and the execution stays queued
      // in case capacity returns before the founder acts.
      //
      // Stated as a conjunction with the escalation on purpose. "Attempt is
      // still 1 and status is still queued" is equally true of an execution
      // nothing looked at, so on its own it is satisfied by the defect it is
      // meant to describe. Pairing it with the raise is what makes it an
      // assertion about the new behaviour rather than about inaction.
      const { executionId } = await strandByRosterChange();

      await handleExecutionReclaim(PAST_DEADLINE());

      const execution = await getExecution(executionId);
      expect(await escalations()).toHaveLength(1);
      expect(
        execution?.attempt,
        "the stall deadline charged a retry attempt for work no agent ever " +
          "ran; attempts record work an agent performed (ADR-0001 D1)",
      ).toBe(1);
      expect(execution?.status).toBe("queued");
    });

    it("raises exactly one escalation however many times the sweep runs", async () => {
      await strandByRosterChange();

      await handleExecutionReclaim(PAST_DEADLINE());
      await handleExecutionReclaim(PAST_DEADLINE());
      await handleExecutionReclaim(PAST_DEADLINE());

      expect(
        await escalations(),
        "the minute-cadence sweep raised a founder escalation per cycle; the " +
          "raise must dedupe per (execution, origin) like every other raise",
      ).toHaveLength(1);
    });

    it("escalates a retry that was requeued and then stranded", async () => {
      // The other way in. The execution ran, failed, and was requeued without
      // an agent — so its retry budget is not spent and nothing will spend it.
      const dispatched = await dispatchAgentExecution({
        taskId: TASK_ID,
        requiredCapabilities: ["validation"],
        instructions: "fail",
        idempotencyKey: "requeued",
      });
      const executionId = dispatched.executionId!;
      await handleExecutionRunning(executionId);
      // Take the agent off the roster while the attempt is in flight, so the
      // failure has nowhere to go.
      getDevHqStore().agents.delete(SATISFYING_AGENT);
      await handleExecutionComplete({ executionId, status: "failed" });

      const requeued = await getExecution(executionId);
      expect(requeued?.status).toBe("queued");
      expect(requeued?.agentId ?? null).toBeNull();
      expect(requeued?.attempt).toBe(2);

      await handleExecutionReclaim(PAST_DEADLINE());

      expect(
        await escalations(),
        "a requeued retry with no agent to run it stranded at attempt 2 of 3: " +
          "the remaining budget can never be spent, so the exhaustion " +
          `escalation can never fire (${describeExecution(await getExecution(executionId))}) (P0-5)`,
      ).toHaveLength(1);
    });
  });

  // --- the origin is load-bearing, not cosmetic ------------------------------
  //
  // The reason `queue_stalled` exists rather than reusing `retry_exhausted`.
  // Escalations dedupe per (execution, origin), so a shared origin would make
  // the stall escalation SWALLOW a later genuine retry exhaustion on the same
  // execution — the founder told once about the wait, never about the failure.

  describe("a stall escalation does not suppress a later genuine exhaustion", () => {
    it("raises a second, distinct retry_exhausted escalation when capacity returns and the work then fails", async () => {
      // 1. Strand it and let the deadline escalate the stall.
      const { executionId, agent } = await strandByRosterChange("fail");
      await handleExecutionReclaim(PAST_DEADLINE());

      // Deliberately no origin assertion here. This step is setup, and pinning
      // the origin at this point would abort the test before it reaches the
      // collision below — which is the behaviour actually under test. The
      // origins are asserted at step 4, after the count.
      expect(await escalations()).toHaveLength(1);

      // 2. Capacity returns before the founder acts — the execution is still
      //    queued precisely so this can happen.
      saveAgent({ ...agent, availability: "available" });
      await handleExecutionReclaim(PAST_DEADLINE());

      const placed = await getExecution(executionId);
      expect(
        placed?.agentId,
        "the stalled execution was not picked up when its agent returned, so " +
          "the genuine-exhaustion path below is unreachable and this test " +
          `would prove nothing (${describeExecution(placed)})`,
      ).toBe(SATISFYING_AGENT);

      // 3. It now runs and genuinely exhausts its retry budget.
      for (let attempt = 1; attempt <= MAX_EXECUTION_ATTEMPTS; attempt += 1) {
        await handleExecutionRunning(executionId);
        await handleExecutionComplete({ executionId, status: "failed" });
      }
      const exhausted = await getExecution(executionId);
      expect(exhausted?.status).toBe("failed");
      expect(exhausted?.attempt).toBe(MAX_EXECUTION_ATTEMPTS);

      // 4. Both facts must reach the founder as separate decisions.
      const finalEscalations = await escalations();
      expect(
        finalEscalations,
        "the genuine retry exhaustion was SWALLOWED by the earlier stall " +
          "escalation. Escalations dedupe per (execution, origin), so sharing " +
          "`retry_exhausted` between the two means the founder is told once " +
          "that the work was waiting and NEVER told that it then failed three " +
          `times. Raised: ${describeEscalations(finalEscalations)}`,
      ).toHaveLength(2);
      expect(
        finalEscalations.map((e) => e.origin).sort(),
        `both escalations must name the same execution but different origins ` +
          `(${describeEscalations(finalEscalations)})`,
      ).toEqual(["queue_stalled", "retry_exhausted"]);
      for (const escalation of finalEscalations) {
        expect(escalation.executionId).toBe(executionId);
      }
      expect(
        finalEscalations.find((e) => e.origin === "retry_exhausted")?.summary,
        "the exhaustion escalation must describe the real failure",
      ).toContain("exhausted its retry budget");
    });
  });
});
