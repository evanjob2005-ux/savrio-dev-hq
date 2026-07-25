import { beforeEach, describe, expect, it } from "vitest";

import {
  assignExecution,
  cancelExecution,
  claimExecution,
  getExecution,
  heartbeat,
  queueExecution,
  reclaimStale,
  releaseExecution,
  runExecution,
} from "@/lib/dev-hq/execution-manager";
import {
  getAgent,
  getAssignment,
  resetDevHqStore,
  saveTask,
} from "@/lib/dev-hq/store";
import type { AgentExecutionStatus, AgentResult, Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";
const FAR_FUTURE = "2999-01-01T00:00:00.000Z";

function seedTask(overrides?: Partial<Task>): Task {
  return saveTask({
    id: "task-exec-1",
    projectId: "proj-x",
    workflowId: null,
    title: "Do the work",
    description: "A dispatchable task.",
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

function makeResult(status: AgentExecutionStatus): AgentResult {
  return {
    agentId: "",
    taskId: "",
    status,
    summary: null,
    output: null,
    filesChanged: [],
    commandsRun: [],
    evidenceIds: [],
    errors: [],
    usage: null,
    startedAt: TS,
    completedAt: TS,
  };
}

describe("execution manager", () => {
  beforeEach(() => {
    resetDevHqStore();
  });

  it("assigns a task to an eligible agent without reserving it", async () => {
    const task = seedTask();
    const decision = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });

    expect(decision.assigned).toBe(true);
    expect(decision.agentId).toBe("agent-supervisor");
    expect(decision.execution?.status).toBe("queued");
    expect(decision.execution?.attempt).toBe(1);
    expect(decision.execution?.assignmentId).toBe(decision.assignment?.id);
    expect(decision.assignment?.status).toBe("assigned");
    expect(decision.assignment?.requiredCapabilities).toEqual(["validation"]);
    // Not reserved until claim.
    expect(getAgent("agent-supervisor")?.availability).toBe("available");
  });

  it("reports no_agent_available when nothing eligible matches", async () => {
    const task = seedTask();
    const decision = await assignExecution(task.id, {
      requiredCapabilities: ["qa"], // gemini has qa but is only "waiting"
    });
    expect(decision.assigned).toBe(false);
    expect(decision.reason).toBe("no_agent_available");
    expect(decision.execution).toBeNull();
  });

  it("throws when the task does not exist", async () => {
    await expect(assignExecution("task-missing")).rejects.toThrow(
      "Task not found: task-missing",
    );
  });

  it("claims atomically, reserving the agent and starting the run", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });

    const running = await claimExecution(execution!.id, "agent-supervisor");
    expect(running.status).toBe("running");
    expect(running.startedAt).toBeTruthy();
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");

    const assignment = getAssignment(running.assignmentId!);
    expect(assignment?.status).toBe("claimed");
    expect(assignment?.claimedAt).toBeTruthy();
    expect(assignment?.leaseExpiresAt).toBeTruthy();
  });

  it("rejects a second claim on the same agent (compare-and-set)", async () => {
    seedTask({ id: "task-a" });
    seedTask({ id: "task-b" });
    const a = await assignExecution("task-a", {
      requiredCapabilities: ["validation"],
    });
    const b = await assignExecution("task-b", {
      requiredCapabilities: ["validation"],
    });
    // Both proposed the only available validation agent.
    expect(a.agentId).toBe("agent-supervisor");
    expect(b.agentId).toBe("agent-supervisor");

    await claimExecution(a.execution!.id, "agent-supervisor");
    await expect(
      claimExecution(b.execution!.id, "agent-supervisor"),
    ).rejects.toThrow(/not available to claim/);
  });

  it("validates claim preconditions", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });

    await expect(claimExecution("exec-missing", "agent-x")).rejects.toThrow(
      "Execution not found: exec-missing",
    );
    await expect(
      claimExecution(execution!.id, "agent-orchestrator"),
    ).rejects.toThrow(/assigned to agent-supervisor/);

    await claimExecution(execution!.id, "agent-supervisor");
    await expect(
      claimExecution(execution!.id, "agent-supervisor"),
    ).rejects.toThrow(/not claimable/);
  });

  it("heartbeats a running execution and keeps the lease", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    await claimExecution(execution!.id, "agent-supervisor");

    const beat = await heartbeat(execution!.id);
    expect(beat.status).toBe("running");
    const assignment = getAssignment(execution!.assignmentId!);
    expect(assignment?.status).toBe("running");
    expect(assignment?.lastHeartbeatAt).toBeTruthy();
    expect(assignment?.leaseExpiresAt).toBeTruthy();

    // Cannot heartbeat a non-running execution.
    await releaseExecution(execution!.id, makeResult("succeeded"));
    await expect(heartbeat(execution!.id)).rejects.toThrow(/not running/);
  });

  it("releases a succeeded execution and frees the agent", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    await claimExecution(execution!.id, "agent-supervisor");

    const done = await releaseExecution(execution!.id, makeResult("succeeded"));
    expect(done.status).toBe("succeeded");
    expect(done.completedAt).toBeTruthy();
    expect(getAgent("agent-supervisor")?.availability).toBe("available");
    expect(getAssignment(execution!.assignmentId!)?.status).toBe("released");
  });

  it("treats a partial result as success and a cancelled result as cancelled", async () => {
    seedTask({ id: "task-p" });
    seedTask({ id: "task-c" });

    const p = await assignExecution("task-p", {
      requiredCapabilities: ["validation"],
    });
    await claimExecution(p.execution!.id, "agent-supervisor");
    expect((await releaseExecution(p.execution!.id, makeResult("partial"))).status).toBe(
      "succeeded",
    );

    const c = await assignExecution("task-c", {
      requiredCapabilities: ["validation"],
    });
    await claimExecution(c.execution!.id, "agent-supervisor");
    expect(
      (await releaseExecution(c.execution!.id, makeResult("cancelled"))).status,
    ).toBe("cancelled");
  });

  it("rejects release of a non-running execution", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    await expect(
      releaseExecution(execution!.id, makeResult("succeeded")),
    ).rejects.toThrow(/not running/);
  });

  it("retries a failed execution up to the budget, then fails", async () => {
    const task = seedTask();
    let exec = (await assignExecution(task.id, { requiredCapabilities: [] }))
      .execution!;

    for (let attempt = 1; attempt <= 3; attempt += 1) {
      expect(exec.status).toBe("queued");
      expect(exec.attempt).toBe(attempt);
      await claimExecution(exec.id, exec.agentId!);
      exec = await releaseExecution(exec.id, makeResult("failed"));
    }

    expect(exec.status).toBe("failed");
    expect(exec.attempt).toBe(3);
    // Every agent has been returned to the pool on exhaustion.
    expect(getAgent(exec.agentId!)?.availability).toBe("available");
  });

  it("creates a new assignment per retry and leaves prior assignments intact", async () => {
    const task = seedTask();
    const first = (await assignExecution(task.id, { requiredCapabilities: [] }))
      .execution!;
    const firstAssignmentId = first.assignmentId!;
    const firstAgentId = first.agentId!;

    await claimExecution(first.id, firstAgentId);
    const retried = await releaseExecution(first.id, makeResult("failed"));

    // The retry is a brand-new assignment record, not the previous one reused.
    expect(retried.assignmentId).not.toBe(firstAssignmentId);
    expect(retried.attempt).toBe(2);

    // The prior assignment keeps its identity, agent, and attempt for auditability;
    // it is only finalized to "released", never overwritten with the retry's data.
    const prior = getAssignment(firstAssignmentId)!;
    expect(prior.id).toBe(firstAssignmentId);
    expect(prior.attempt).toBe(1);
    expect(prior.agentId).toBe(firstAgentId);
    expect(prior.status).toBe("released");
    expect(prior.releasedAt).toBeTruthy();

    const next = getAssignment(retried.assignmentId!)!;
    expect(next.attempt).toBe(2);
    expect(next.claimedAt).toBeNull();

    // Two distinct assignment records now exist for the one execution.
    expect(next.id).not.toBe(prior.id);
  });

  it("reclaims a stale execution as a timed-out retry", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    await claimExecution(execution!.id, "agent-supervisor");

    const reclaimed = await reclaimStale(FAR_FUTURE);
    expect(reclaimed).toHaveLength(1);
    expect(reclaimed[0].status).toBe("queued");
    expect(reclaimed[0].attempt).toBe(2);
    expect(getAgent("agent-supervisor")?.availability).toBe("available");
  });

  it("does not reclaim an execution whose lease is still valid", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    await claimExecution(execution!.id, "agent-supervisor");

    expect(await reclaimStale()).toHaveLength(0);
  });

  it("cancels running, queued, and terminal executions correctly", async () => {
    // Running -> frees the agent.
    const running = (
      await assignExecution(seedTask({ id: "task-run" }).id, {
        requiredCapabilities: ["validation"],
      })
    ).execution!;
    await claimExecution(running.id, "agent-supervisor");
    const cancelledRunning = await cancelExecution(running.id);
    expect(cancelledRunning.status).toBe("cancelled");
    expect(getAgent("agent-supervisor")?.availability).toBe("available");

    // Queued -> agent was never reserved, stays available; cancel is idempotent.
    const queued = (
      await assignExecution(seedTask({ id: "task-q" }).id, {
        requiredCapabilities: ["routing"],
      })
    ).execution!;
    expect(getAgent("agent-orchestrator")?.availability).toBe("available");
    const cancelledQueued = await cancelExecution(queued.id);
    expect(cancelledQueued.status).toBe("cancelled");
    expect(getAgent("agent-orchestrator")?.availability).toBe("available");
    expect(await cancelExecution(queued.id)).toEqual(cancelledQueued);
  });

  it("runs an assigned execution and rejects one without an agent", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    const running = await runExecution(execution!.id);
    expect(running.status).toBe("running");
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");

    const queued = await queueExecution(task.id, "wf-x");
    await expect(runExecution(queued.id)).rejects.toThrow(/no assigned agent/);
  });

  it("queues a bare execution with no agent", async () => {
    const task = seedTask();
    const queued = await queueExecution(task.id, "wf-x");
    expect(queued.status).toBe("queued");
    expect(queued.agentId).toBeNull();
    expect(queued.assignmentId).toBeNull();
    expect(queued.workflowId).toBe("wf-x");
  });

  it("returns null for a missing execution", async () => {
    expect(await getExecution("exec-missing")).toBeNull();
  });
});
