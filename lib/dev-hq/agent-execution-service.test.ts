import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionHeartbeat,
  handleExecutionRunning,
  simulateOutcome,
} from "@/lib/dev-hq/agent-execution-service";
import {
  getAgent,
  getAssignment,
  resetDevHqStore,
  saveTask,
} from "@/lib/dev-hq/store";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { EXECUTION_EVENT_TYPE } from "@/lib/dev-hq/constants";
import type { Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

function seedTask(overrides?: Partial<Task>): Task {
  return saveTask({
    id: "task-ax-1",
    projectId: "proj-x",
    workflowId: null,
    title: "Simulated dispatch",
    description: "Do the assigned work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
    ...overrides,
  });
}

describe("agent execution service", () => {
  beforeEach(() => {
    resetDevHqStore();
    let counter = 0;
    triggerMock.mockReset();
    triggerMock.mockImplementation(async () => ({ id: `run-${(counter += 1)}` }));
  });

  describe("simulateOutcome", () => {
    it("maps instructions deterministically", () => {
      expect(simulateOutcome("please FAIL this")).toBe("failed");
      expect(simulateOutcome("this will Timeout")).toBe("timeout");
      expect(simulateOutcome("do the work")).toBe("succeeded");
      // fail takes precedence over timeout when both appear.
      expect(simulateOutcome("fail and timeout")).toBe("failed");
    });
  });

  it("assigns and dispatches a durable run", async () => {
    const task = seedTask();
    const result = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "do the work",
    });

    expect(result.assigned).toBe(true);
    expect(result.agentId).toBe("agent-supervisor");
    expect(result.executionId).toBeTruthy();
    expect(result.triggerRunId).toBe("run-1");
    expect(triggerMock).toHaveBeenCalledTimes(1);
    expect(triggerMock).toHaveBeenCalledWith("agent-execution", {
      executionId: result.executionId,
      agentId: "agent-supervisor",
      instructions: "do the work",
    });
  });

  it("does not dispatch when no eligible agent is available", async () => {
    const task = seedTask();
    const result = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["qa"], // gemini has qa but is only "waiting"
    });
    expect(result.assigned).toBe(false);
    expect(result.reason).toBe("no_agent_available");
    expect(triggerMock).not.toHaveBeenCalled();
  });

  it("throws for a missing task", async () => {
    await expect(
      dispatchAgentExecution({ taskId: "task-missing" }),
    ).rejects.toThrow("Task not found: task-missing");
  });

  it("claims the agent on the running callback and heartbeats", async () => {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "do work",
    });

    const running = await handleExecutionRunning(dispatched.executionId!);
    expect(running.status).toBe("running");
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");

    const beat = await handleExecutionHeartbeat(dispatched.executionId!);
    expect(beat.status).toBe("running");
    expect(getAssignment(beat.assignmentId!)?.status).toBe("running");
  });

  it("completes a succeeded execution without re-dispatching", async () => {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "do work",
    });
    await handleExecutionRunning(dispatched.executionId!);

    const { execution, retried } = await handleExecutionComplete({
      executionId: dispatched.executionId!,
      status: "succeeded",
      instructions: "do work",
    });
    expect(execution.status).toBe("succeeded");
    expect(retried).toBe(false);
    expect(getAgent("agent-supervisor")?.availability).toBe("available");
    expect(triggerMock).toHaveBeenCalledTimes(1); // only the initial dispatch
  });

  it("re-dispatches a failed attempt under the retry budget", async () => {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "please fail",
    });
    await handleExecutionRunning(dispatched.executionId!);

    const { execution, retried } = await handleExecutionComplete({
      executionId: dispatched.executionId!,
      status: "failed",
      instructions: "please fail",
    });
    expect(retried).toBe(true);
    expect(execution.status).toBe("queued");
    expect(execution.attempt).toBe(2);
    expect(triggerMock).toHaveBeenCalledTimes(2); // initial + retry
  });

  it("treats a timeout result as a retryable attempt", async () => {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "will timeout",
    });
    await handleExecutionRunning(dispatched.executionId!);

    const { execution, retried } = await handleExecutionComplete({
      executionId: dispatched.executionId!,
      status: "timeout",
      instructions: "will timeout",
    });
    expect(retried).toBe(true);
    expect(execution.attempt).toBe(2);
  });

  it("exhausts the 3-attempt budget through Trigger, then fails", async () => {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "fail",
    });
    const executionId = dispatched.executionId!;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      await handleExecutionRunning(executionId);
      const { execution, retried } = await handleExecutionComplete({
        executionId,
        status: "failed",
        instructions: "fail",
      });
      if (attempt < 3) {
        expect(retried).toBe(true);
        expect(execution.status).toBe("queued");
        expect(execution.attempt).toBe(attempt + 1);
      } else {
        expect(retried).toBe(false);
        expect(execution.status).toBe("failed");
        expect(execution.attempt).toBe(3);
      }
    }
    // One dispatch per attempt (initial + 2 retries); no dispatch after exhaustion.
    expect(triggerMock).toHaveBeenCalledTimes(3);
  });

  it("throws when completing a missing execution", async () => {
    await expect(
      handleExecutionComplete({
        executionId: "exec-missing",
        status: "succeeded",
        instructions: "",
      }),
    ).rejects.toThrow("Execution not found: exec-missing");
  });

  describe("events and evidence", () => {
    async function executionEvents(executionId: string) {
      return getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 50,
      });
    }

    it("emits assigned, claimed, and succeeded events plus outcome evidence", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do work",
      });
      const executionId = dispatched.executionId!;

      await handleExecutionRunning(executionId);
      await handleExecutionComplete({
        executionId,
        status: "succeeded",
        instructions: "do work",
      });

      const types = (await executionEvents(executionId)).map((e) => e.type);
      expect(types).toContain(EXECUTION_EVENT_TYPE.assigned);
      expect(types).toContain(EXECUTION_EVENT_TYPE.claimed);
      expect(types).toContain(EXECUTION_EVENT_TYPE.succeeded);

      const evidence =
        await getDevHqAdapters().evidenceStore.listForExecution(executionId);
      expect(evidence.length).toBeGreaterThanOrEqual(1);
      expect(evidence[0].kind).toBe("log");
    });

    it("emits a retried event and one evidence per attempt", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "please fail",
      });
      const executionId = dispatched.executionId!;

      await handleExecutionRunning(executionId);
      await handleExecutionComplete({
        executionId,
        status: "failed",
        instructions: "please fail",
      });

      const types = (await executionEvents(executionId)).map((e) => e.type);
      expect(types).toContain(EXECUTION_EVENT_TYPE.retried);

      const evidence =
        await getDevHqAdapters().evidenceStore.listForExecution(executionId);
      expect(evidence).toHaveLength(1);
    });

    it("emits an exhausted event when the retry budget is spent", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
      });
      const executionId = dispatched.executionId!;

      for (let attempt = 1; attempt <= 3; attempt += 1) {
        await handleExecutionRunning(executionId);
        await handleExecutionComplete({
          executionId,
          status: "failed",
          instructions: "fail",
        });
      }

      const types = (await executionEvents(executionId)).map((e) => e.type);
      expect(types).toContain(EXECUTION_EVENT_TYPE.exhausted);

      const evidence =
        await getDevHqAdapters().evidenceStore.listForExecution(executionId);
      expect(evidence).toHaveLength(3); // one per attempt outcome
    });
  });
});
