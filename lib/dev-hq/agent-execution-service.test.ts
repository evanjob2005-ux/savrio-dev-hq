import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import {
  dispatchAgentExecution,
  ensureDispatchForAssignment,
  handleExecutionComplete,
  handleExecutionHeartbeat,
  handleExecutionReclaim,
  handleExecutionRunning,
  simulateOutcome,
} from "@/lib/dev-hq/agent-execution-service";
import {
  getAgent,
  getAssignment,
  resetDevHqStore,
  saveAssignment,
  saveExecution,
  saveTask,
} from "@/lib/dev-hq/store";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { EXECUTION_EVENT_TYPE } from "@/lib/dev-hq/constants";
import { getExecution } from "@/lib/dev-hq/execution-manager";
import type { Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";
const FAR_FUTURE = "2999-01-01T00:00:00.000Z";

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
    expect(triggerMock).toHaveBeenCalledWith(
      "agent-execution",
      {
        executionId: result.executionId,
        agentId: "agent-supervisor",
        assignmentId: expect.any(String),
        instructions: "do the work",
      },
      { idempotencyKey: expect.any(String) },
    );
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
      const outcomeEvidence = evidence.filter((e) =>
        e.label.startsWith("Execution attempt"),
      );
      expect(outcomeEvidence).toHaveLength(3); // one per attempt outcome
    });
  });

  describe("callback idempotency", () => {
    async function executionEvents(executionId: string) {
      return getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 50,
      });
    }

    it("ignores a replayed running callback (no double claim or event)", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do work",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;

      const first = await handleExecutionRunning(executionId, assignmentId);
      expect(first.status).toBe("running");
      const claimedBefore = (await executionEvents(executionId)).filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.claimed,
      ).length;

      const replay = await handleExecutionRunning(executionId, assignmentId);
      expect(replay.status).toBe("running");
      const claimedAfter = (await executionEvents(executionId)).filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.claimed,
      ).length;
      expect(claimedAfter).toBe(claimedBefore);
      expect(getAgent("agent-supervisor")?.availability).toBe("busy");
    });

    it("ignores a replayed complete callback (no new evidence, event, or re-dispatch)", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do work",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;

      await handleExecutionRunning(executionId, assignmentId);
      await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do work",
      });

      const evidenceBefore = (
        await getDevHqAdapters().evidenceStore.listForExecution(executionId)
      ).length;
      const triggerCallsBefore = triggerMock.mock.calls.length;

      const replay = await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do work",
      });
      expect(replay.retried).toBe(false);
      expect(replay.execution.status).toBe("succeeded");
      expect(
        (await getDevHqAdapters().evidenceStore.listForExecution(executionId))
          .length,
      ).toBe(evidenceBefore);
      expect(triggerMock.mock.calls.length).toBe(triggerCallsBefore);
    });

    it("ignores a stale complete from a superseded attempt during a live retry", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "please fail",
      });
      const executionId = dispatched.executionId!;
      const asgn1 = (await getExecution(executionId))!.assignmentId!;

      await handleExecutionRunning(executionId, asgn1);
      const { retried } = await handleExecutionComplete({
        executionId,
        assignmentId: asgn1,
        status: "failed",
        instructions: "please fail",
      });
      expect(retried).toBe(true);

      const attempt2 = (await getExecution(executionId))!;
      const asgn2 = attempt2.assignmentId!;
      expect(asgn2).not.toBe(asgn1);

      // A stale running for attempt 1 must not claim the queued attempt 2.
      const staleRun = await handleExecutionRunning(executionId, asgn1);
      expect(staleRun.status).toBe("queued");
      expect(getAgent(attempt2.agentId!)?.availability).toBe("available");

      // Claim attempt 2, then replay attempt 1's complete — must be a no-op.
      await handleExecutionRunning(executionId, asgn2);
      expect((await getExecution(executionId))!.status).toBe("running");
      const evidenceBefore = (
        await getDevHqAdapters().evidenceStore.listForExecution(executionId)
      ).length;

      const stale = await handleExecutionComplete({
        executionId,
        assignmentId: asgn1,
        status: "failed",
        instructions: "please fail",
      });
      expect(stale.retried).toBe(false);
      const after = (await getExecution(executionId))!;
      expect(after.status).toBe("running");
      expect(after.assignmentId).toBe(asgn2);
      expect(
        (await getDevHqAdapters().evidenceStore.listForExecution(executionId))
          .length,
      ).toBe(evidenceBefore);
    });
  });

  describe("lease sweeper", () => {
    async function executionEvents(executionId: string) {
      return getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 50,
      });
    }

    async function seedRunning(instructions = "do work") {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions,
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);
      return { executionId, assignmentId };
    }

    it("reclaims an expired running execution as a new attempt", async () => {
      const { executionId, assignmentId } = await seedRunning();

      const result = await handleExecutionReclaim(FAR_FUTURE);
      expect(result.reclaimed).toBe(1);

      const after = (await getExecution(executionId))!;
      expect(after.status).toBe("queued");
      expect(after.attempt).toBe(2);
      expect(after.assignmentId).not.toBe(assignmentId);

      // The reclaim records exactly one append-only log evidence entry.
      const evidence =
        await getDevHqAdapters().evidenceStore.listForExecution(executionId);
      expect(evidence).toHaveLength(1);
      expect(evidence[0].kind).toBe("log");
      expect(evidence[0].label).toBe("Execution reclaimed: lease expired");
    });

    it("does not reclaim an execution whose lease is still valid", async () => {
      await seedRunning();
      expect((await handleExecutionReclaim()).reclaimed).toBe(0);
    });

    it("does not reclaim a terminal execution", async () => {
      const { executionId, assignmentId } = await seedRunning();
      await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do work",
      });
      expect((await handleExecutionReclaim(FAR_FUTURE)).reclaimed).toBe(0);
    });

    it("does not reclaim the same attempt twice across repeated sweeps", async () => {
      const { executionId } = await seedRunning();

      expect((await handleExecutionReclaim(FAR_FUTURE)).reclaimed).toBe(1);
      expect((await handleExecutionReclaim(FAR_FUTURE)).reclaimed).toBe(0);

      const reclaimedEvents = (await executionEvents(executionId)).filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.reclaimed,
      );
      expect(reclaimedEvents).toHaveLength(1);
    });

    it("keeps a stale pre-reclaim callback a safe no-op", async () => {
      const { executionId, assignmentId: asgn1 } = await seedRunning();
      await handleExecutionReclaim(FAR_FUTURE);

      const asgn2 = (await getExecution(executionId))!.assignmentId!;
      expect(asgn2).not.toBe(asgn1);

      const stale = await handleExecutionComplete({
        executionId,
        assignmentId: asgn1,
        status: "succeeded",
        instructions: "do work",
      });
      expect(stale.retried).toBe(false);

      const after = (await getExecution(executionId))!;
      expect(after.status).toBe("queued");
      expect(after.assignmentId).toBe(asgn2);
    });

    it("emits exactly one execution.reclaimed event per reclaim", async () => {
      const { executionId } = await seedRunning();
      await handleExecutionReclaim(FAR_FUTURE);

      const reclaimedEvents = (await executionEvents(executionId)).filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.reclaimed,
      );
      expect(reclaimedEvents).toHaveLength(1);
    });
  });

  describe("dispatch race safety", () => {
    it("does not roll back a run the worker started before tasks.trigger() returned", async () => {
      const task = seedTask();

      // Model the race: the worker delivers its running callback (claim + lease)
      // while tasks.trigger() is still in flight, before the dispatch path records
      // the run id. The dispatch must stamp only triggerRunId onto the current
      // records, never write back its stale pre-await snapshots.
      let runningApplied = false;
      triggerMock.mockReset();
      triggerMock.mockImplementationOnce(async (_taskId, payload) => {
        const p = payload as { executionId: string; assignmentId: string };
        await handleExecutionRunning(p.executionId, p.assignmentId);
        runningApplied = true;
        return { id: "run-race-1" };
      });

      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do work",
      });
      const executionId = dispatched.executionId!;
      expect(runningApplied).toBe(true);

      const execution = (await getExecution(executionId))!;
      const assignment = getAssignment(execution.assignmentId!)!;

      // Never rolled back to queued/assigned by the post-await writeback.
      expect(execution.status).toBe("running");
      expect(assignment.status).toBe("claimed");
      // Claim and lease information from the running callback are preserved.
      expect(execution.startedAt).toBeTruthy();
      expect(assignment.claimedAt).toBeTruthy();
      expect(assignment.leaseExpiresAt).toBeTruthy();
      expect(getAgent("agent-supervisor")?.availability).toBe("busy");
      // triggerRunId is still recorded correctly on both records.
      expect(execution.triggerRunId).toBe("run-race-1");
      expect(assignment.triggerRunId).toBe("run-race-1");
    });
  });

  describe("queued-dispatch reconciliation", () => {
    it("redispatches a queued execution whose dispatch failed, reusing the assignment", async () => {
      const task = seedTask();
      // Initial dispatch succeeds (call 1); the retry dispatch (call 2) fails; any
      // later dispatch (reconciliation) succeeds again.
      let n = 0;
      triggerMock.mockReset();
      triggerMock.mockImplementation(async () => {
        n += 1;
        if (n === 2) throw new Error("injected trigger failure");
        return { id: `run-${n}` };
      });

      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
      });
      const executionId = dispatched.executionId!;
      const asgn1 = (await getExecution(executionId))!.assignmentId!;
      expect(getAssignment(asgn1)?.triggerRunId).toBe("run-1"); // dispatched

      // Attempt 1 fails and re-queues attempt 2; the attempt-2 dispatch throws.
      await handleExecutionRunning(executionId, asgn1);
      await expect(
        handleExecutionComplete({
          executionId,
          assignmentId: asgn1,
          status: "failed",
          instructions: "fail",
        }),
      ).rejects.toThrow("injected trigger failure");

      // The execution is queued on attempt 2 with a current, undispatched assignment.
      const queued = (await getExecution(executionId))!;
      const asgn2 = queued.assignmentId!;
      expect(queued.status).toBe("queued");
      expect(queued.attempt).toBe(2);
      expect(asgn2).not.toBe(asgn1);
      expect(getAssignment(asgn2)?.triggerRunId).toBeNull(); // dispatch was lost
      // The execution's Trigger run reference was cleared on requeue — it must not
      // point at the prior attempt's run while undispatched.
      expect(queued.triggerRunId).toBeNull();
      // The retry was recorded before the failed dispatch.
      const retriedBefore = (
        await getDevHqAdapters().eventLogger.listRecent({
          entityType: "execution",
          entityId: executionId,
          limit: 100,
        })
      ).filter((e) => e.type === EXECUTION_EVENT_TYPE.retried);
      expect(retriedBefore).toHaveLength(1);

      const triggerCallsBefore = triggerMock.mock.calls.length;

      // A reconciliation sweep redispatches the same assignment.
      await handleExecutionReclaim(FAR_FUTURE);

      const afterReconcile = (await getExecution(executionId))!;
      expect(afterReconcile.attempt).toBe(2); // no additional attempt consumed
      expect(afterReconcile.assignmentId).toBe(asgn2); // same assignment
      expect(getAssignment(asgn2)?.triggerRunId).toBeTruthy(); // now dispatched
      expect(afterReconcile.triggerRunId).toBeTruthy(); // execution ref set on dispatch
      expect(triggerMock.mock.calls.length).toBe(triggerCallsBefore + 1); // one logical dispatch
      // The retry event was not duplicated by reconciliation.
      expect(
        (
          await getDevHqAdapters().eventLogger.listRecent({
            entityType: "execution",
            entityId: executionId,
            limit: 100,
          })
        ).filter((e) => e.type === EXECUTION_EVENT_TYPE.retried),
      ).toHaveLength(1);

      // Repeated reconciliation after a successful dispatch is a no-op.
      const callsAfter = triggerMock.mock.calls.length;
      await handleExecutionReclaim(FAR_FUTURE);
      expect(triggerMock.mock.calls.length).toBe(callsAfter);
    });

    it("never dispatches a stale or replaced assignment", async () => {
      seedTask({ id: "task-stale" });
      // Execution's current assignment is asgn-current; asgn-stale is a released,
      // superseded assignment for the same execution.
      saveExecution({
        id: "exec-stale",
        taskId: "task-stale",
        workflowId: null,
        agentId: "agent-supervisor",
        status: "queued",
        triggerRunId: null,
        startedAt: null,
        completedAt: null,
        createdAt: TS,
        assignmentId: "asgn-current",
        attempt: 2,
      });
      saveAssignment({
        id: "asgn-stale",
        executionId: "exec-stale",
        agentId: "agent-supervisor",
        taskId: "task-stale",
        status: "released",
        attempt: 1,
        requiredCapabilities: [],
        triggerRunId: null,
        leaseExpiresAt: null,
        lastHeartbeatAt: null,
        claimedAt: null,
        releasedAt: TS,
        createdAt: TS,
      });
      triggerMock.mockClear();

      expect(await ensureDispatchForAssignment("asgn-stale", "x")).toBeNull();
      expect(triggerMock).not.toHaveBeenCalled();
      expect(getAssignment("asgn-stale")?.triggerRunId).toBeNull();
    });

    it("never redispatches a terminal execution", async () => {
      seedTask({ id: "task-terminal" });
      saveExecution({
        id: "exec-terminal",
        taskId: "task-terminal",
        workflowId: null,
        agentId: "agent-supervisor",
        status: "failed",
        triggerRunId: null,
        startedAt: null,
        completedAt: TS,
        createdAt: TS,
        assignmentId: "asgn-terminal",
        attempt: 3,
      });
      saveAssignment({
        id: "asgn-terminal",
        executionId: "exec-terminal",
        agentId: "agent-supervisor",
        taskId: "task-terminal",
        status: "released",
        attempt: 3,
        requiredCapabilities: [],
        triggerRunId: null,
        leaseExpiresAt: null,
        lastHeartbeatAt: null,
        claimedAt: null,
        releasedAt: TS,
        createdAt: TS,
      });
      triggerMock.mockClear();

      expect(await ensureDispatchForAssignment("asgn-terminal", "x")).toBeNull();
      expect(triggerMock).not.toHaveBeenCalled();
    });
  });
});
