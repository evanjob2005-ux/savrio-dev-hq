import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { dispatchAgentExecutionAction } from "@/lib/dev-hq/actions";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
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

  it("returns a validation error when no task is selected", async () => {
    const outcome = await dispatchAgentExecutionAction({ taskId: "" });
    expect(outcome).toEqual({
      ok: false,
      error: "Select a task before dispatching.",
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

  it("reports a non-assigned result as ok with assigned=false", async () => {
    const task = seedTask();
    const outcome = await dispatchAgentExecutionAction({
      taskId: task.id,
      requiredCapabilities: ["qa"], // no available agent has qa
    });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.result.assigned).toBe(false);
      expect(outcome.result.reason).toBe("no_agent_available");
    }
    expect(triggerMock).not.toHaveBeenCalled();
  });
});
