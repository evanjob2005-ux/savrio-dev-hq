import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { dispatchAgentExecutionAction } from "@/lib/dev-hq/actions";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

function seedTask(): Task {
  return saveTask({
    id: "task-action-1",
    projectId: "proj-x",
    workflowId: null,
    title: "Action task",
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

describe("dispatchAgentExecutionAction", () => {
  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
  });

  it("dispatches and returns a success result", async () => {
    const task = seedTask();
    const outcome = await dispatchAgentExecutionAction({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "do work",
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.assigned).toBe(true);
      expect(outcome.result.agentId).toBe("agent-supervisor");
      expect(outcome.result.triggerRunId).toBe("run-1");
    }
  });

  it("returns a resolved validation error when no task is selected", async () => {
    const outcome = await dispatchAgentExecutionAction({ taskId: "" });
    expect(outcome).toEqual({
      ok: false,
      // Definitively nothing was created, so the browser may retire the identity.
      resolved: true,
      error: "Select a task before dispatching.",
      executionId: null,
    });
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("surfaces a missing-task error without throwing", async () => {
    const outcome = await dispatchAgentExecutionAction({ taskId: "task-missing" });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      expect(outcome.error).toContain("Task not found");
    }
  });

  it("keeps the request identity recoverable when the service fails mid-dispatch", async () => {
    const task = seedTask();
    triggerMock.mockRejectedValueOnce(new Error("trigger unreachable"));

    const outcome = await dispatchAgentExecutionAction({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "action-key-1",
    });

    expect(outcome.ok).toBe(false);
    if (!outcome.ok) {
      // Ambiguous: the canonical execution exists even though the call failed, so
      // the browser must resume this identity rather than start a second dispatch.
      expect(outcome.resolved).toBe(false);
      expect(outcome.executionId).toBe("exec-dispatch-action-key-1");
    }

    // Resuming under the same identity converges on the execution already created.
    triggerMock.mockResolvedValue({ id: "run-2" });
    const resumed = await dispatchAgentExecutionAction({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "action-key-1",
    });
    expect(resumed.ok).toBe(true);
    if (resumed.ok) {
      expect(resumed.resolved).toBe(true);
      expect(resumed.result.executionId).toBe("exec-dispatch-action-key-1");
    }
    expect(getDevHqStore().executions.size).toBe(1);
    expect(getDevHqStore().agentAssignments.size).toBe(1);
  });

  it("resolves a conflicting replay instead of holding the identity forever", async () => {
    const task = seedTask();
    await dispatchAgentExecutionAction({
      taskId: task.id,
      instructions: "review the sweeper",
      idempotencyKey: "action-key-2",
    });

    const conflicting = await dispatchAgentExecutionAction({
      taskId: task.id,
      instructions: "review something else entirely",
      idempotencyKey: "action-key-2",
    });

    expect(conflicting.ok).toBe(false);
    if (!conflicting.ok) {
      // A different request under the same key can never succeed, so holding the
      // identity would strand the founder; it resolves and they start anew.
      expect(conflicting.resolved).toBe(true);
      expect(conflicting.error).toContain("different instructions");
    }
    expect(getDevHqStore().executions.size).toBe(1);
  });

  it("reports a non-assigned result as ok with assigned=false", async () => {
    const task = seedTask();
    // Arrange the unavailability itself, rather than requesting a capability
    // nothing has.
    //
    // This test is about how the action REPORTS a capacity decline, and a
    // capacity decline is the one that legitimately stays queued (ADR-0001 O6):
    // the agent comes back and reconciliation dispatches it. An unsatisfiable
    // capability is a different outcome wearing the same shape — nothing can
    // ever take that work, so the execution neither completes nor fails — and
    // dispatch now refuses it up front. Borrowing it as the vehicle here made
    // the assertion depend on that acceptance being the behaviour.
    for (const agent of getDevHqStore().agents.values()) {
      saveAgent({ ...agent, availability: "busy" });
    }
    const outcome = await dispatchAgentExecutionAction({
      taskId: task.id,
      requiredCapabilities: ["validation"],
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.assigned).toBe(false);
      expect(outcome.result.reason).toBe("no_agent_available");
    }
    expect(triggerMock).not.toHaveBeenCalled();
  });
});
