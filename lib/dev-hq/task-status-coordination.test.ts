// ARCH-02. Two orchestrators write `Task.status` — the founder-request workflow
// and the escalation lifecycle — and a conditional writer,
// `TaskRepository.updateTaskStatusIf`, existed but was used at only one of them.
//
// Falsifiable claim under test: a task never ends up in a terminal status
// (`completed` / `rejected`) while an unresolved founder escalation holds it,
// **whichever order the two flows run in**, including when one lands inside the
// other's read-to-write gap.
//
// The named consequence: an escalation open on a task the founder-request flow
// has already marked `completed` — a founder decision outstanding on work the
// board reports finished.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async (...args: [string, unknown, unknown?]) => ({
    id:
      args[0] === "founder-request-continuation"
        ? "run-continuation-1"
        : "run-test-1",
  })),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { TASK_STATUS_REFUSED_EVENT_TYPE } from "@/lib/dev-hq/constants";
import {
  hasOpenEscalationForTask,
  raiseRetryExhaustionEscalation,
  resolveEscalation,
} from "@/lib/dev-hq/escalation-service";
import {
  createFounderRequest,
  finalizeWorkflowOutcome,
  registerApprovalGate,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import type { Escalation, Execution, Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

/** A founder request driven to its approval gate. */
async function pendingFounderRequest(): Promise<{
  executionId: string;
  taskId: string;
  approvalId: string;
}> {
  const created = await createFounderRequest({
    title: "Ship the coordinated thing",
    description: "Deliver the founder request workflow with durable state.",
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });
  return {
    executionId: created.execution.id,
    taskId: created.task.id,
    approvalId: review.approvalId!,
  };
}

/**
 * A retry-exhausted execution for `taskId`. Not persisted: the raise validates
 * and reads the record it is handed, which is what lets an escalation be raised
 * on a task without also driving three agent attempts.
 */
function exhaustedExecution(taskId: string, id: string): Execution {
  return {
    id,
    taskId,
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

function raiseOn(taskId: string, executionId: string): Promise<Escalation> {
  return raiseRetryExhaustionEscalation(exhaustedExecution(taskId, executionId));
}

async function statusOf(taskId: string): Promise<Task["status"] | undefined> {
  return (await getDevHqAdapters().taskRepository.getTask(taskId))?.status;
}

async function refusalEvents(taskId: string) {
  const events = await getDevHqAdapters().eventLogger.listRecent({ limit: 200 });
  return events.filter(
    (event) =>
      event.type === TASK_STATUS_REFUSED_EVENT_TYPE && event.entityId === taskId,
  );
}

describe("Task.status coordination between the two orchestrators (ARCH-02)", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    triggerMock.mockClear();
  });

  // --- null arm (rule 2). Identical starting state, no escalation present. The
  // guarded write must still do its job, or every assertion below is satisfied
  // by a flow that simply stopped writing the field.
  describe("null arm: with no escalation, the founder-request flow still writes the outcome", () => {
    it("marks an approved request's task completed", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      expect(hasOpenEscalationForTask(taskId)).toBe(false);

      await finalizeWorkflowOutcome({
        executionId,
        decision: "approved",
        approvalId,
      });

      expect(
        await statusOf(taskId),
        "with nothing to coordinate with, the approved outcome must still land",
      ).toBe("completed");
      expect(await refusalEvents(taskId)).toHaveLength(0);
    });

    it("marks a founder-rejected request's task rejected", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();

      await finalizeWorkflowOutcome({
        executionId,
        decision: "rejected",
        rejectionKind: "founder",
        approvalId,
      });

      expect(await statusOf(taskId)).toBe("rejected");
      expect(await refusalEvents(taskId)).toHaveLength(0);
    });
  });

  describe("the founder-request flow yields to an open escalation", () => {
    it("does not mark the task completed while an escalation is open", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      await raiseOn(taskId, "exec-exhausted-1");
      expect(await statusOf(taskId)).toBe("needs_revision");

      const run = await finalizeWorkflowOutcome({
        executionId,
        decision: "approved",
        approvalId,
      });

      // The workflow itself did complete — that is not in dispute.
      expect(run.stage).toBe("completed");
      expect(
        await statusOf(taskId),
        "the founder-request flow marked the task completed while an " +
          "unresolved founder escalation was still open on it: a decision is " +
          "outstanding on work the board now reports finished (ARCH-02)",
      ).toBe("needs_revision");
      expect(hasOpenEscalationForTask(taskId)).toBe(true);
    });

    it("records the divergence instead of leaving two records quietly disagreeing", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      await raiseOn(taskId, "exec-exhausted-1");

      await finalizeWorkflowOutcome({
        executionId,
        decision: "approved",
        approvalId,
      });

      const refusals = await refusalEvents(taskId);
      expect(refusals).toHaveLength(1);
      expect(refusals[0].message).toContain("unresolved founder escalation");
      expect(refusals[0].message).toContain(taskId);
    });

    it("does not mark the task rejected while an escalation is open", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      await raiseOn(taskId, "exec-exhausted-1");

      await finalizeWorkflowOutcome({
        executionId,
        decision: "rejected",
        rejectionKind: "founder",
        approvalId,
      });

      expect(await statusOf(taskId)).toBe("needs_revision");
    });

    it("completes the task once the escalation is resolved", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      const escalation = await raiseOn(taskId, "exec-exhausted-1");
      await resolveEscalation(escalation.id, "accept");
      expect(hasOpenEscalationForTask(taskId)).toBe(false);

      await finalizeWorkflowOutcome({
        executionId,
        decision: "approved",
        approvalId,
      });

      // Nothing is permanently blocked: the guard is about an *outstanding*
      // decision, and once it is given the flow writes normally.
      expect(await statusOf(taskId)).toBe("completed");
    });
  });

  describe("the escalation lands inside the founder-request flow's read-to-write gap", () => {
    it("still refuses the terminal write when the escalation is raised mid-finalization", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      const adapters = getDevHqAdapters();

      // `finalizeWorkflowOutcome` reads the task, then awaits three approval
      // writes, then writes the status. Hooking the last of those approval
      // writes places the escalation squarely in that gap — the interval in
      // which the old unguarded write's reading went stale.
      const original =
        adapters.approvalManager.decidePendingApproval.bind(
          adapters.approvalManager,
        );
      let raisedInGap = false;
      vi.spyOn(
        adapters.approvalManager,
        "decidePendingApproval",
      ).mockImplementation(async (input) => {
        const result = await original(input);
        if (!raisedInGap) {
          raisedInGap = true;
          await raiseOn(taskId, "exec-exhausted-in-gap");
        }
        return result;
      });

      await finalizeWorkflowOutcome({
        executionId,
        decision: "approved",
        approvalId,
      });

      expect(raisedInGap).toBe(true);
      expect(
        await statusOf(taskId),
        "an escalation raised after the task was read but before the status " +
          "was written was overwritten by a decision made from the stale " +
          "reading — the precondition must be evaluated in the same " +
          "synchronous step as the write (ARCH-02)",
      ).toBe("needs_revision");
    });
  });

  describe("the escalation lifecycle converges when it runs second", () => {
    it("moves an already-completed task to needs_revision when an escalation is raised", async () => {
      const { executionId, taskId, approvalId } = await pendingFounderRequest();
      await finalizeWorkflowOutcome({
        executionId,
        decision: "approved",
        approvalId,
      });
      expect(await statusOf(taskId)).toBe("completed");

      await raiseOn(taskId, "exec-exhausted-1");

      // The opposite interleaving of the same pair. Whichever runs second must
      // observe the other and produce the consistent state, so the outcome does
      // not depend on who happened to write last.
      expect(
        await statusOf(taskId),
        "an escalation was raised on a completed task and the task kept " +
          "reporting completed (ARCH-02)",
      ).toBe("needs_revision");
    });

    it("refuses a resolution's terminal outcome while another escalation is still open", async () => {
      const { taskId } = await pendingFounderRequest();
      const first = await raiseOn(taskId, "exec-exhausted-1");
      await raiseOn(taskId, "exec-exhausted-2");

      await resolveEscalation(first.id, "accept");

      expect(hasOpenEscalationForTask(taskId)).toBe(true);
      expect(
        await statusOf(taskId),
        "accepting one escalation marked the task completed while a second " +
          "escalation was still open on it — the same untruth, from the other " +
          "orchestrator (ARCH-02)",
      ).toBe("needs_revision");
    });

    it("applies the resolution once it is the last escalation standing", async () => {
      const { taskId } = await pendingFounderRequest();
      const first = await raiseOn(taskId, "exec-exhausted-1");
      const second = await raiseOn(taskId, "exec-exhausted-2");

      await resolveEscalation(first.id, "accept");
      await resolveEscalation(second.id, "accept");

      expect(hasOpenEscalationForTask(taskId)).toBe(false);
      expect(await statusOf(taskId)).toBe("completed");
    });
  });
});
