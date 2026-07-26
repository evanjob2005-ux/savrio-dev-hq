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
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
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
    // Models Trigger.dev's real idempotency-key semantics: triggers sharing a key
    // resolve to one logical run, so "one Trigger run" is observable in tests as
    // one distinct run id rather than merely one call.
    const runsByKey = new Map<string, string>();
    triggerMock.mockReset();
    triggerMock.mockImplementation(
      async (_taskId: string, _payload: unknown, options?: { idempotencyKey?: string }) => {
        const key = options?.idempotencyKey;
        if (key && runsByKey.has(key)) return { id: runsByKey.get(key)! };
        const id = `run-${(counter += 1)}`;
        if (key) runsByKey.set(key, id);
        return { id };
      },
    );
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

  it("records a deferral when no eligible agent is available", async () => {
    const task = seedTask();
    // The no-capacity condition is constructed here, not inherited from the seed
    // roster. The previous fixture relied on `gemini` shipping as "waiting"; a
    // later seeding change would have silently stopped exercising this path while
    // the test kept passing — the same false assurance this remediation exists to
    // remove.
    for (const agent of getDevHqStore().agents.values()) {
      saveAgent({ ...agent, availability: "busy" });
    }

    const result = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "deferral-key-1",
    });
    expect(result.assigned).toBe(false);
    expect(result.reason).toBe("no_agent_available");
    expect(triggerMock).not.toHaveBeenCalled();

    // ADR-0001 O6: the decline is a lifecycle outcome and must be on the timeline.
    const events = await getDevHqAdapters().eventLogger.listRecent({
      entityType: "execution",
      limit: 200,
    });
    const deferred = events.filter(
      (e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred,
    );
    expect(deferred).toHaveLength(1);
    expect(deferred[0]?.entityId).toBe(result.executionId);

    // Keyed per (execution, attempt), so a replay adds no second entry — and the
    // execution stays queued, which is the ADR-approved outcome and unchanged.
    await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "deferral-key-1",
    });
    const after = await getDevHqAdapters().eventLogger.listRecent({
      entityType: "execution",
      limit: 200,
    });
    expect(
      after.filter((e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred),
    ).toHaveLength(1);
    expect((await getExecution(result.executionId!))!.status).toBe("queued");
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
    // The execution itself is never re-dispatched. The second trigger is the
    // review of the completed work, which the default policy asks for.
    const dispatchedTasks = triggerMock.mock.calls.map((call) => call[0]);
    expect(dispatchedTasks).toEqual(["agent-execution", "agent-review"]);
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

      // Repeated reconciliation at the current time is a no-op: the assignment is
      // dispatched and well within its claim deadline.
      const callsAfter = triggerMock.mock.calls.length;
      await handleExecutionReclaim();
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
        dispatchedAt: null,
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
        dispatchedAt: null,
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

  // Provider-backed agents reuse the whole path above — assignment, dispatch
  // idempotency, callbacks, retry budget, evidence — with a real model provider
  // behind the worker instead of the deterministic simulation.
  // A duplicate manual dispatch is the *same* logical dispatch, however the two
  // calls interleave.
  describe("manual dispatch idempotency", () => {
    const KEY = "dispatch-key-1";

    function dispatchWithKey(taskId: string, key = KEY) {
      return dispatchAgentExecution({
        taskId,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: key,
      });
    }

    function storeCounts() {
      const store = getDevHqStore();
      return {
        executions: [...store.executions.values()].length,
        assignments: [...store.agentAssignments.values()].length,
      };
    }

    it("collapses concurrent duplicate dispatches onto one execution, assignment, and run", async () => {
      const task = seedTask();

      const [first, second] = await Promise.all([
        dispatchWithKey(task.id),
        dispatchWithKey(task.id),
      ]);

      expect(first.assigned).toBe(true);
      expect(second.assigned).toBe(true);
      expect(second.executionId).toBe(first.executionId);
      expect(second.agentId).toBe(first.agentId);
      expect(second.triggerRunId).toBe(first.triggerRunId);
      expect(storeCounts()).toEqual({ executions: 1, assignments: 1 });
      // Single-flight: the second caller awaited the first dispatch rather than
      // issuing its own trigger.
      expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("collapses a burst of concurrent duplicates", async () => {
      const task = seedTask();

      const results = await Promise.all(
        Array.from({ length: 8 }, () => dispatchWithKey(task.id)),
      );

      const executionIds = new Set(results.map((r) => r.executionId));
      const runIds = new Set(results.map((r) => r.triggerRunId));
      expect(executionIds.size).toBe(1);
      expect(runIds.size).toBe(1);
      expect(storeCounts()).toEqual({ executions: 1, assignments: 1 });
      expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("collapses a sequential duplicate dispatch", async () => {
      const task = seedTask();
      const first = await dispatchWithKey(task.id);
      const second = await dispatchWithKey(task.id);

      expect(second.executionId).toBe(first.executionId);
      expect(second.triggerRunId).toBe(first.triggerRunId);
      expect(storeCounts()).toEqual({ executions: 1, assignments: 1 });
      // The second call short-circuits on the recorded triggerRunId.
      expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("still treats distinct keys as distinct logical dispatches", async () => {
      const task = seedTask();
      const first = await dispatchWithKey(task.id, "dispatch-key-a");
      const second = await dispatchWithKey(task.id, "dispatch-key-b");

      expect(second.executionId).not.toBe(first.executionId);
      expect(second.triggerRunId).not.toBe(first.triggerRunId);
      expect(storeCounts()).toEqual({ executions: 2, assignments: 2 });
    });

    it("allocates a key when the caller omits one", async () => {
      const task = seedTask();
      const first = await dispatchAgentExecution({ taskId: task.id });
      const second = await dispatchAgentExecution({ taskId: task.id });

      expect(first.executionId).toBeTruthy();
      expect(second.executionId).not.toBe(first.executionId);
    });

    it("refuses to reuse another task's dispatch key", async () => {
      const task = seedTask();
      seedTask({ id: "task-ax-2" });
      await dispatchWithKey(task.id);

      await expect(dispatchWithKey("task-ax-2")).rejects.toThrow(
        /belongs to task/,
      );
      expect(storeCounts()).toEqual({ executions: 1, assignments: 1 });
    });

    it("rejects a malformed dispatch key before touching state", async () => {
      const task = seedTask();
      await expect(
        dispatchAgentExecution({ taskId: task.id, idempotencyKey: "bad key!" }),
      ).rejects.toThrow(/idempotencyKey/);
      expect(storeCounts()).toEqual({ executions: 0, assignments: 0 });
      expect(triggerMock).not.toHaveBeenCalled();
    });

    it("emits the assignment event once across duplicate dispatches", async () => {
      const task = seedTask();
      await dispatchWithKey(task.id);
      await dispatchWithKey(task.id);

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assigned),
      ).toHaveLength(1);
    });

    it("reports the canonical execution when its dispatch already terminated", async () => {
      const task = seedTask();
      const first = await dispatchWithKey(task.id);
      const executionId = first.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);
      await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do the work",
      });

      // A late replay must not resurrect or duplicate a finished dispatch.
      const replay = await dispatchWithKey(task.id);
      expect(replay.assigned).toBe(false);
      expect(replay.reason).toBe("execution_not_queued");
      expect(replay.executionId).toBe(executionId);
      expect(storeCounts()).toEqual({ executions: 1, assignments: 1 });
    });
  });

  describe("assignment event idempotency", () => {
    it("records one assignment event across a dispatch and later sweeps", async () => {
      const task = seedTask();
      await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "assign-event-1",
      });

      await handleExecutionReclaim();
      await handleExecutionReclaim();

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assigned),
      ).toHaveLength(1);
    });

    it("records one assignment event under concurrent dispatch and reconciliation", async () => {
      const task = seedTask();
      await Promise.all([
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation"],
          idempotencyKey: "assign-event-2",
        }),
        dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: ["validation"],
          idempotencyKey: "assign-event-2",
        }),
        handleExecutionReclaim(),
      ]);

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assigned),
      ).toHaveLength(1);
    });

    it("records one assignment event per attempt", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "assign-event-3",
      });
      const executionId = dispatched.executionId!;
      await handleExecutionRunning(
        executionId,
        (await getExecution(executionId))!.assignmentId!,
      );
      // A retry is a new assignment, and therefore a new transition to record.
      await handleExecutionComplete({
        executionId,
        assignmentId: (await getExecution(executionId))!.assignmentId!,
        status: "failed",
        instructions: "do the work",
      });
      await handleExecutionReclaim();

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 200,
      });
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assigned),
      ).toHaveLength(2);
    });
  });

  // The heartbeat names its attempt, so an abandoned worker cannot mask a
  // successor's failure by holding its lease open.
  describe("heartbeat identity", () => {
    it("ignores a heartbeat from a superseded attempt", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "heartbeat-key",
      });
      const executionId = dispatched.executionId!;
      const first = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, first);

      // The attempt is reclaimed and a successor takes over.
      await handleExecutionReclaim(FAR_FUTURE);
      const second = (await getExecution(executionId))!.assignmentId!;
      expect(second).not.toBe(first);
      await handleExecutionRunning(executionId, second);
      const leaseBefore = getAssignment(second)!.leaseExpiresAt;

      // The abandoned worker keeps beating; it must not hold the new lease open.
      await handleExecutionHeartbeat(executionId, first);

      expect(getAssignment(second)!.leaseExpiresAt).toBe(leaseBefore);
      expect(getAssignment(first)!.status).toBe("released");
    });

    it("still extends the lease for the current attempt", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "heartbeat-key-2",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);

      await handleExecutionHeartbeat(executionId, assignmentId);

      expect(getAssignment(assignmentId)!.status).toBe("running");
      expect(getAssignment(assignmentId)!.lastHeartbeatAt).toBeTruthy();
    });
  });

  // The event buffer is bounded and descriptive. Audit idempotency must therefore
  // rest on a durable marker, not on searching a buffer that silently forgets.
  describe("audit idempotency after event-ring eviction", () => {
    /** Push enough unrelated events to evict everything older. */
    async function floodEventRing(): Promise<void> {
      const { eventLogger } = getDevHqAdapters();
      for (let i = 0; i < 260; i += 1) {
        await eventLogger.log({
          type: "noise.event",
          entityType: "task",
          entityId: `task-noise-${i}`,
          message: `unrelated activity ${i}`,
          actorLabel: "System",
        });
      }
    }

    async function executionEvents(executionId: string) {
      return getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 500,
      });
    }

    it("does not recreate a terminal event evicted from the buffer", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: "ring-key-1",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);
      await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do the work",
      });
      expect(
        (await executionEvents(executionId)).filter(
          (e) => e.type === EXECUTION_EVENT_TYPE.succeeded,
        ),
      ).toHaveLength(1);

      // The original entries age out of the ring entirely.
      await floodEventRing();
      expect(await executionEvents(executionId)).toHaveLength(0);

      await handleExecutionReclaim();
      await handleExecutionReclaim();

      // Reconciliation must not resurrect a transition it can no longer see.
      expect(await executionEvents(executionId)).toHaveLength(0);
    });

    it("does not recreate retry events evicted from the buffer", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
        idempotencyKey: "ring-key-2",
      });
      const executionId = dispatched.executionId!;
      // Two failed attempts leave one retry event behind.
      for (let attempt = 1; attempt <= 2; attempt += 1) {
        await handleExecutionRunning(executionId);
        await handleExecutionComplete({
          executionId,
          status: "failed",
          instructions: "fail",
        });
      }
      expect((await getExecution(executionId))!.attempt).toBe(3);
      expect(
        (await executionEvents(executionId)).filter(
          (e) => e.type === EXECUTION_EVENT_TYPE.retried,
        ),
      ).toHaveLength(2);

      await floodEventRing();
      await handleExecutionReclaim();
      await handleExecutionReclaim();

      expect(await executionEvents(executionId)).toHaveLength(0);
    });

    it("still records each transition once when nothing has been evicted", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
        idempotencyKey: "ring-key-3",
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
      await handleExecutionReclaim();
      await handleExecutionReclaim();

      const events = await executionEvents(executionId);
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.retried),
      ).toHaveLength(2);
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.exhausted),
      ).toHaveLength(1);
    });
  });

  // A requeue is not a terminal state. Emitting a terminal event for one would
  // durably key `execution.exhausted` for work that is still queued, suppressing
  // the real event when the budget is genuinely spent.
  describe("terminality of requeued executions", () => {
    async function executionEvents(executionId: string) {
      return getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        entityId: executionId,
        limit: 200,
      });
    }

    async function exhaustedCount(executionId: string) {
      return (await executionEvents(executionId)).filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.exhausted,
      ).length;
    }

    /** Take away every agent that could serve the execution's routing. */
    function removeCapacity(): void {
      for (const agent of [...getDevHqStore().agents.values()]) {
        getDevHqStore().agents.delete(agent.id);
      }
    }

    function restoreCapacity(supervisor: ReturnType<typeof getAgent>): void {
      saveAgent({ ...supervisor!, availability: "available" });
    }

    it("emits no terminal event when a failed attempt cannot be re-assigned", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
        idempotencyKey: "terminality-key-1",
      });
      const executionId = dispatched.executionId!;
      await handleExecutionRunning(executionId);

      // Capacity disappears before the attempt reports.
      removeCapacity();
      const { execution, retried } = await handleExecutionComplete({
        executionId,
        status: "failed",
        instructions: "fail",
      });

      // Requeued and recoverable — not terminal, and not re-dispatched.
      expect(execution.status).toBe("queued");
      expect(execution.attempt).toBe(2);
      expect(execution.agentId).toBeNull();
      expect(retried).toBe(false);
      expect(await exhaustedCount(executionId)).toBe(0);
      // The retry it did take is still on the timeline.
      expect(
        (await executionEvents(executionId)).filter(
          (e) => e.type === EXECUTION_EVENT_TYPE.retried,
        ),
      ).toHaveLength(1);
    });

    it("emits exactly one terminal event once the budget is genuinely spent", async () => {
      const task = seedTask();
      const supervisor = getAgent("agent-supervisor");
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
        idempotencyKey: "terminality-key-2",
      });
      const executionId = dispatched.executionId!;

      // Attempt 1 fails while there is no capacity to take attempt 2.
      await handleExecutionRunning(executionId);
      removeCapacity();
      await handleExecutionComplete({
        executionId,
        status: "failed",
        instructions: "fail",
      });
      expect((await getExecution(executionId))!.status).toBe("queued");
      expect(await exhaustedCount(executionId)).toBe(0);

      // Capacity returns; the sweep assigns and dispatches the waiting attempt.
      restoreCapacity(supervisor);
      await handleExecutionReclaim();
      expect((await getExecution(executionId))!.agentId).toBe("agent-supervisor");

      // Attempts 2 and 3 fail, spending the budget for real.
      for (let attempt = 2; attempt <= 3; attempt += 1) {
        await handleExecutionRunning(executionId);
        await handleExecutionComplete({
          executionId,
          status: "failed",
          instructions: "fail",
        });
      }

      const execution = (await getExecution(executionId))!;
      expect(execution.status).toBe("failed");
      expect(execution.attempt).toBe(3);
      // Exactly one terminal event: the earlier requeue never poisoned the key.
      expect(await exhaustedCount(executionId)).toBe(1);

      // And repeated sweeps neither duplicate nor resurrect it.
      await handleExecutionReclaim();
      await handleExecutionReclaim();
      expect(await exhaustedCount(executionId)).toBe(1);
      expect(
        await getDevHqAdapters().escalationStore.findByExecution(executionId),
      ).not.toBeNull();
    });

    it("keeps the retry budget intact while waiting for capacity", async () => {
      const task = seedTask();
      const supervisor = getAgent("agent-supervisor");
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "fail",
        idempotencyKey: "terminality-key-3",
      });
      const executionId = dispatched.executionId!;
      await handleExecutionRunning(executionId);
      removeCapacity();
      await handleExecutionComplete({
        executionId,
        status: "failed",
        instructions: "fail",
      });

      // Sweeping while nothing is eligible must not consume attempts or
      // manufacture a terminal state.
      await handleExecutionReclaim();
      await handleExecutionReclaim();
      let execution = (await getExecution(executionId))!;
      expect(execution.status).toBe("queued");
      expect(execution.attempt).toBe(2);
      expect(await exhaustedCount(executionId)).toBe(0);

      restoreCapacity(supervisor);
      await handleExecutionReclaim();
      execution = (await getExecution(executionId))!;
      expect(execution.attempt).toBe(2); // waiting cost nothing
      expect(execution.agentId).toBe("agent-supervisor");
    });
  });

  // No execution may become permanently unrecoverable.
  describe("queued execution recovery", () => {
    beforeEach(() => {
      resetDevHqStore();
      triggerMock.mockClear();
    });

    /** Every agent busy: capacity contention, nothing eligible to assign. */
    function occupyEveryAgent(): void {
      for (const agent of getDevHqStore().agents.values()) {
        saveAgent({ ...agent, availability: "busy" });
      }
    }

    it("recovers an execution created under capacity contention", async () => {
      const task = seedTask();
      occupyEveryAgent();

      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "Review this.",
        idempotencyKey: "stranded-key-1",
      });

      // The canonical execution exists but nothing could be assigned to it.
      expect(dispatched.assigned).toBe(false);
      expect(dispatched.reason).toBe("no_agent_available");
      const executionId = dispatched.executionId!;
      const created = (await getExecution(executionId))!;
      expect(created.status).toBe("queued");
      expect(created.assignmentId).toBeNull();
      // Recognizable as agent-backed work awaiting assignment.
      expect(created.routing).toEqual({
        requiredCapabilities: ["validation"],
        preferredAgentId: null,
        provider: null,
      });

      // Capacity returns; the sweep finishes the job with no founder action.
      const supervisor = getAgent("agent-supervisor")!;
      saveAgent({ ...supervisor, availability: "available" });
      await handleExecutionReclaim();

      const recovered = (await getExecution(executionId))!;
      expect(recovered.agentId).toBe("agent-supervisor");
      expect(recovered.attempt).toBe(1); // recovery, not a retry
      expect(recovered.routing?.provider).toBe("internal");
      expect(triggerMock).toHaveBeenCalledTimes(1);
          });

    it("converges a resumed dispatch on the same stranded execution", async () => {
      const task = seedTask();
      occupyEveryAgent();
      const first = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "stranded-key-2",
      });

      const supervisor = getAgent("agent-supervisor")!;
      saveAgent({ ...supervisor, availability: "available" });

      // The founder resumes the held request rather than starting a new one.
      const resumed = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "stranded-key-2",
      });

      expect(resumed.executionId).toBe(first.executionId);
      expect(resumed.assigned).toBe(true);
      expect([...getDevHqStore().executions.values()]).toHaveLength(1);
      expect([...getDevHqStore().agentAssignments.values()]).toHaveLength(1);
    });

    it("recovers an assignment whose agent no longer satisfies the routing", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "Review this.",
        idempotencyKey: "stranded-key-3",
      });
      const executionId = dispatched.executionId!;
      const staleAssignmentId = (await getExecution(executionId))!.assignmentId!;

      // The assignment predates a registry change that makes its agent invalid
      // for this execution's provider, and it was never dispatched.
      const supervisor = getAgent("agent-supervisor")!;
      saveAgent({
        ...supervisor,
        id: "agent-supervisor-2",
        name: "Supervisor II",
        lastActiveAt: "2020-01-01T00:00:00.000Z",
      });
      saveAgent({ ...supervisor, provider: "vendor-x" });
      saveAssignment({
        ...getAssignment(staleAssignmentId)!,
        triggerRunId: null,
      });
      saveExecution({ ...(await getExecution(executionId))!, triggerRunId: null });
      triggerMock.mockClear();

      // Dispatch refuses it outright — it must not run on the wrong provider.
      expect(
        await ensureDispatchForAssignment(staleAssignmentId, "Review this."),
      ).toBeNull();
      expect(triggerMock).not.toHaveBeenCalled();

      // The sweep releases the dead-end assignment and routes it correctly.
      await handleExecutionReclaim();

      const recovered = (await getExecution(executionId))!;
      expect(recovered.assignmentId).not.toBe(staleAssignmentId);
      expect(recovered.agentId).toBe("agent-supervisor-2");
      expect(getAssignment(staleAssignmentId)!.status).toBe("released");
      expect(recovered.attempt).toBe(1); // no retry consumed by recovery
      expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("keeps sweeping a stranded execution until capacity exists", async () => {
      const task = seedTask();
      occupyEveryAgent();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "stranded-key-4",
      });
      const executionId = dispatched.executionId!;

      // Sweeps while nothing is free leave it queued and untouched.
      await handleExecutionReclaim();
      await handleExecutionReclaim();
      let execution = (await getExecution(executionId))!;
      expect(execution.status).toBe("queued");
      expect(execution.assignmentId).toBeNull();
      expect(execution.attempt).toBe(1);
      expect(triggerMock).not.toHaveBeenCalled();

      const supervisor = getAgent("agent-supervisor")!;
      saveAgent({ ...supervisor, availability: "available" });
      await handleExecutionReclaim();

      execution = (await getExecution(executionId))!;
      expect(execution.agentId).toBe("agent-supervisor");
      expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("recovers the loser of a pre-claim race for a capacity-one agent", async () => {
      const task = seedTask();
      // Two distinct logical dispatches both select the one available agent with
      // this capability: selection proposes, only the claim reserves (ADR-0001).
      const first = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "race-key-a",
      });
      const second = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "race-key-b",
      });
      expect(first.agentId).toBe("agent-supervisor");
      expect(second.agentId).toBe("agent-supervisor");
      const loserAssignment = (await getExecution(second.executionId!))!
        .assignmentId!;

      // The first worker wins the claim; the second cannot start.
      await handleExecutionRunning(
        first.executionId!,
        (await getExecution(first.executionId!))!.assignmentId!,
      );
      // The loser absorbs the lost compare-and-set and returns 200 with the
      // unchanged execution, so the worker's holdsClaim check reads a non-running
      // status and stands down. It must NOT throw: a throw becomes a 500, which
      // postJson raises before the worker can read the answer — and with
      // retries.enabledInDev false that kills the durable run outright.
      const lost = await handleExecutionRunning(
        second.executionId!,
        loserAssignment,
      );
      expect(lost.status).toBe("queued");
      expect(lost.assignmentId).toBe(loserAssignment);
      // The worker's own predicate, transcribed from trigger/agent-execution.ts
      // (`claimed.execution?.status === "running" && claimed.execution
      // ?.assignmentId === payload.assignmentId`) and evaluated against what this
      // callback actually returns — the route serialises exactly this object as
      // `{ execution }`.
      //
      // `false` here is the whole behavioural win of F1: the stood_down branch
      // guarded by this predicate was unreachable while the callback threw,
      // because postJson raised on the resulting 500 before the worker could
      // evaluate it. With retries.enabledInDev false the run then died outright.
      const holdsClaim =
        lost.status === "running" && lost.assignmentId === loserAssignment;
      expect(holdsClaim).toBe(false);
      const lostEvents = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      expect(
        lostEvents.filter((e) => e.type === EXECUTION_EVENT_TYPE.claimLost),
      ).toHaveLength(1);

      // The loser is now the stranding case: queued, dispatched, never claimed,
      // and holding no lease for reclaim to find.
      const stranded = (await getExecution(second.executionId!))!;
      expect(stranded.status).toBe("queued");
      expect(getAssignment(loserAssignment)!.triggerRunId).toBeTruthy();
      expect(getAssignment(loserAssignment)!.claimedAt).toBeNull();
      expect(getAssignment(loserAssignment)!.leaseExpiresAt).toBeNull();

      // Capacity returns when the winner finishes.
      await handleExecutionComplete({
        executionId: first.executionId!,
        assignmentId: (await getExecution(first.executionId!))!.assignmentId!,
        status: "succeeded",
        instructions: "Review this.",
      });
      triggerMock.mockClear();

      // Past the claim deadline the dead run is superseded and the work runs.
      await handleExecutionReclaim(FAR_FUTURE);

      const recovered = (await getExecution(second.executionId!))!;
      expect(recovered.agentId).toBe("agent-supervisor");
      expect(recovered.assignmentId).not.toBe(loserAssignment);
      expect(recovered.attempt).toBe(1); // recovery consumed no business attempt
      expect(getAssignment(loserAssignment)!.status).toBe("released");
      expect(triggerMock).toHaveBeenCalledTimes(1);
      // Still two distinct logical dispatches, never merged or duplicated.
      expect([...getDevHqStore().executions.values()]).toHaveLength(2);
    });

    it("records a reclaimed attempt that no agent could take", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: "reclaim-nocap-1",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);

      // Construct the no-capacity condition explicitly rather than leaning on the
      // roster. Reclaim frees the claimed agent, so occupying everyone is not
      // enough on its own: the freed agent must also stop satisfying the
      // execution's persisted provider pin, which models the agent leaving or
      // changing provider (the case releaseAssignmentForReassignment documents).
      for (const agent of getDevHqStore().agents.values()) {
        saveAgent({ ...agent, availability: "busy" });
      }
      const claimedAgent = getAgent("agent-supervisor")!;
      saveAgent({ ...claimedAgent, provider: "provider-withdrawn" });

      triggerMock.mockClear();
      await handleExecutionReclaim(FAR_FUTURE);

      const requeued = (await getExecution(executionId))!;
      expect(requeued.status).toBe("queued");
      expect(requeued.agentId).toBeNull();
      expect(requeued.attempt).toBe(2);
      expect(triggerMock).not.toHaveBeenCalled();

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      // X3: this attempt is neither dispatchable nor terminal, so both original
      // branches skipped it and it recorded nothing at all.
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred),
      ).toHaveLength(1);
      // X4: the reclaim event must not assert a retry that nothing is running.
      const reclaimed = events.filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.reclaimed,
      );
      expect(reclaimed).toHaveLength(1);
      expect(reclaimed[0]?.message).toContain("waiting for an available agent");
      expect(reclaimed[0]?.message).not.toContain("retrying as attempt");
    });

    it("emits the requeue deferral from the reclaim loop, before the sweep runs", async () => {
      // MAJOR-2. The test above asserts `toHaveLength(1)` after a sweep that runs
      // BOTH the reclaim loop and `reconcileQueuedDispatches`. Both emit for the
      // same (execution, attempt); the dedupe key collapses them to one event, so
      // the assertion is satisfied by EITHER source and deleting the reclaim loop's
      // emission leaves it green. It stopped detecting the defect it pins.
      //
      // The two sites cannot be separated by capacity — they decline for the same
      // reason in the same sweep. They CAN be separated by ORDER: the reclaim loop
      // processes every reclaimed execution, emitting as it goes, and only then
      // does `handleExecutionReclaim` call `reconcileQueuedDispatches`. So with two
      // stranded executions, the first one's deferral is emitted BEFORE the second
      // one's `reclaimed` event if and only if the reclaim loop emitted it. If that
      // call is deleted, both deferrals come from the sweep — after both `reclaimed`
      // events — and the ordering assertion below fails.
      // Two executions running at once, on different capabilities so each holds its
      // own agent — `agent-supervisor` is the only "validation" agent.
      const strand = async (
        taskId: string,
        capability: string,
        key: string,
      ) => {
        const task = seedTask({ id: taskId });
        const dispatched = await dispatchAgentExecution({
          taskId: task.id,
          requiredCapabilities: [capability],
          instructions: "do the work",
          idempotencyKey: key,
        });
        const executionId = dispatched.executionId!;
        const assignmentId = (await getExecution(executionId))!.assignmentId!;
        await handleExecutionRunning(executionId, assignmentId);
        return executionId;
      };

      await strand("task-strand-a", "validation", "reclaim-order-a");
      await strand("task-strand-b", "routing", "reclaim-order-b");

      // Remove all capacity and withdraw the provider both are pinned to, so each
      // reclaim requeues without an agent (the X3 shape) rather than retrying.
      for (const agent of getDevHqStore().agents.values()) {
        saveAgent({ ...agent, availability: "busy", provider: "withdrawn" });
      }

      triggerMock.mockClear();
      await handleExecutionReclaim(FAR_FUTURE);

      // `listRecent` is newest-first; reverse for true append order.
      const appended = (
        await getDevHqAdapters().eventLogger.listRecent({
          entityType: "execution",
          limit: 200,
        })
      )
        .slice()
        .reverse();

      const deferralIdx = appended
        .map((e, i) => (e.type === EXECUTION_EVENT_TYPE.assignmentDeferred ? i : -1))
        .filter((i) => i >= 0);
      const reclaimedIdx = appended
        .map((e, i) => (e.type === EXECUTION_EVENT_TYPE.reclaimed ? i : -1))
        .filter((i) => i >= 0);

      // Both were reclaimed, and both recorded a deferral.
      expect(reclaimedIdx).toHaveLength(2);
      expect(deferralIdx).toHaveLength(2);

      // The discriminator, and it does not depend on which execution the sweep
      // happens to process first. The reclaim loop emits each deferral immediately
      // after that execution's own `reclaimed` event, so the deferrals INTERLEAVE:
      // the first deferral precedes the last reclaim. If the reclaim loop's call is
      // deleted, both deferrals are written later by `reconcileQueuedDispatches` —
      // after every `reclaimed` event — and this inverts.
      expect(Math.min(...deferralIdx)).toBeLessThan(Math.max(...reclaimedIdx));
    });

    it("leaves a dispatched assignment alone inside its claim deadline", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        idempotencyKey: "race-key-c",
      });
      const assignmentId = (await getExecution(dispatched.executionId!))!
        .assignmentId!;
      triggerMock.mockClear();

      // A sweep at the current time must not disturb a run that has barely begun.
      await handleExecutionReclaim();

      expect((await getExecution(dispatched.executionId!))!.assignmentId).toBe(
        assignmentId,
      );
      expect(getAssignment(assignmentId)!.status).toBe("assigned");
      expect(triggerMock).not.toHaveBeenCalled();
    });

    it("records the deferral when a claim-deadline release finds no agent", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: "claim-deadline-deferral-1",
      });
      const executionId = dispatched.executionId!;
      const before = (await getExecution(executionId))!;
      const attemptBefore = before.attempt;

      // Dispatched but never claimed. Past the deadline the sweep releases the
      // assignment for re-assignment — which costs no business attempt — and
      // then finds nothing to re-assign it to, because every agent is occupied.
      for (const agent of getDevHqStore().agents.values()) {
        saveAgent({ ...agent, availability: "busy" });
      }

      triggerMock.mockClear();
      await handleExecutionReclaim(FAR_FUTURE);

      // The stranded state the old code produced silently: still queued, no
      // agent, attempt untouched.
      const stranded = (await getExecution(executionId))!;
      expect(stranded.status).toBe("queued");
      expect(stranded.agentId).toBeNull();
      expect(stranded.attempt).toBe(attemptBefore);
      expect(triggerMock).not.toHaveBeenCalled();

      // X1's surviving path: the timeline used to be empty here, so this was
      // indistinguishable from a dispatch that was never requested.
      const deferralsOf = async () =>
        (
          await getDevHqAdapters().eventLogger.listRecent({
            entityType: "execution",
            limit: 200,
          })
        ).filter(
          (e) =>
            e.type === EXECUTION_EVENT_TYPE.assignmentDeferred &&
            e.entityId === executionId,
        );

      expect(await deferralsOf()).toHaveLength(1);

      // Reconciliation re-observes a stranded execution on every sweep. The
      // per-(execution, attempt) dedupe key must make the repeat a no-op rather
      // than appending one entry per cycle.
      await handleExecutionReclaim(FAR_FUTURE);
      await handleExecutionReclaim(FAR_FUTURE);
      expect(await deferralsOf()).toHaveLength(1);
      expect((await getExecution(executionId))!.attempt).toBe(attemptBefore);
    });

    it("does not sweep founder-request executions", async () => {
      const task = seedTask({ id: "task-fr-1" });
      const execution = saveExecution({
        id: "exec-founder-1",
        taskId: task.id,
        workflowId: "wf-founder-request",
        agentId: null,
        status: "queued",
        triggerRunId: null,
        startedAt: null,
        completedAt: null,
        createdAt: TS,
        assignmentId: null,
        attempt: 1,
      });

      await handleExecutionReclaim();

      const after = (await getExecution(execution.id))!;
      expect(after.agentId).toBeNull();
      expect(after.assignmentId).toBeNull();
      expect(triggerMock).not.toHaveBeenCalled();
    });

    it("requests the review on a re-entered completion callback", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: "reentry-review-1",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);

      // Model a crash between the terminal transition and the review request:
      // the execution is succeeded, but no review was ever asked for.
      const running = (await getExecution(executionId))!;
      saveExecution({ ...running, status: "succeeded", completedAt: TS });
      expect(
        await getDevHqAdapters().reviewStore.findByExecution(executionId),
      ).toBeNull();

      // The re-entry path must close that on the next callback, without waiting
      // for the sweep.
      await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do the work",
      });

      const review =
        await getDevHqAdapters().reviewStore.findByExecution(executionId);
      expect(review).not.toBeNull();
      expect(review?.executionId).toBe(executionId);
    });
  });
});
