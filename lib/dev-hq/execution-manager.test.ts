import { beforeEach, describe, expect, it } from "vitest";

import {
  assignExecution,
  cancelExecution,
  claimExecution,
  ensureAssignment,
  ensureExecution,
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
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveAssignment,
  saveExecution,
  saveTask,
} from "@/lib/dev-hq/store";
import { MAX_EXECUTION_ATTEMPTS } from "@/lib/dev-hq/constants";
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

    const running = (await claimExecution(execution!.id, "agent-supervisor"))!;
    expect(running.status).toBe("running");
    expect(running.startedAt).toBeTruthy();
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");

    const assignment = getAssignment(running.assignmentId!);
    expect(assignment?.status).toBe("claimed");
    expect(assignment?.claimedAt).toBeTruthy();
    expect(assignment?.leaseExpiresAt).toBeTruthy();
  });

  it("refuses a second claim on the same agent (compare-and-set)", async () => {
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
    // Still exactly one winner; the loser now reports that by returning null
    // instead of throwing. The reservation itself is unchanged.
    expect(await claimExecution(b.execution!.id, "agent-supervisor")).toBeNull();
    expect((await getExecution(b.execution!.id))!.status).toBe("queued");
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");
    //
    // This is the capacity-1 claim race at the manager boundary, and it proves
    // only the precondition. That the losing *worker* can now reach its
    // stood_down branch is a property of the callback chain and is pinned in
    // agent-execution-service.test.ts, "recovers the loser of a pre-claim race
    // for a capacity-one agent".
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

    // A beat that lands after the attempt already finished is absorbed, not an
    // error — and it must be a *silent* no-op: no lease extended, no heartbeat
    // recorded, no status moved. Asserting only that it resolves would swap one
    // weak test for another, which is the X2 failure mode.
    await releaseExecution(execution!.id, makeResult("succeeded"));

    // Pin a recognisable stamp on the released assignment first. Comparing
    // `lastHeartbeatAt` against its previous value would not be sound on its own:
    // nowIso() is millisecond-resolution, so a wrongly-written stamp inside the
    // same millisecond would compare equal and pass vacuously. A sentinel makes
    // any write detectable regardless of clock resolution.
    const releasedAssignment = getAssignment(execution!.assignmentId!)!;
    saveAssignment({
      ...releasedAssignment,
      lastHeartbeatAt: "2026-07-24T20:00:00.000Z",
    });

    const late = await heartbeat(execution!.id);
    expect(late.status).toBe("succeeded");

    const afterLate = getAssignment(execution!.assignmentId!);
    // The two assertions a real write could not survive: heartbeat() sets status
    // to "running" and stamps a fresh lease.
    expect(afterLate?.status).toBe("released");
    expect(afterLate?.leaseExpiresAt).toBeNull();
    // And the field itself, unchanged.
    expect(afterLate?.lastHeartbeatAt).toBe("2026-07-24T20:00:00.000Z");
  });

  it("absorbs a heartbeat for an attempt reclaimed underneath it", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    const claimed = (await claimExecution(execution!.id, "agent-supervisor"))!;
    const assignmentId = claimed.assignmentId!;

    // Spend the retry budget so the reclaim is terminal rather than a requeue.
    // That is the shape that used to throw: the execution goes to `failed` while
    // KEEPING this assignment id, so the stale-worker guard does not catch the
    // beat and the terminal check used to raise.
    saveExecution({ ...claimed, attempt: MAX_EXECUTION_ATTEMPTS });
    await reclaimStale(FAR_FUTURE);

    const reclaimed = (await getExecution(execution!.id))!;
    expect(reclaimed.status).toBe("failed");
    expect(reclaimed.assignmentId).toBe(assignmentId);

    const late = await heartbeat(execution!.id, assignmentId);
    expect(late.status).toBe("failed");
    expect(getAssignment(assignmentId)?.status).toBe("released");
    expect(getAssignment(assignmentId)?.leaseExpiresAt).toBeNull();
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
    const running = (await runExecution(execution!.id))!;
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

  // --- caller-supplied-id creation primitives (Task 1E-5) ---
  describe("ensureExecution / ensureAssignment", () => {
    const CANONICAL = "exec-canonical-1";

    it("creates a queued execution at the supplied id, unassigned at attempt 1", async () => {
      const task = seedTask();
      const execution = await ensureExecution({
        executionId: CANONICAL,
        taskId: task.id,
      });

      expect(execution.id).toBe(CANONICAL);
      expect(execution.status).toBe("queued");
      expect(execution.attempt).toBe(1);
      expect(execution.agentId).toBeNull();
      expect(execution.assignmentId).toBeNull();
      expect(execution.workflowId).toBe(task.workflowId);
    });

    it("is a keyed get on replay: never a second execution", async () => {
      const task = seedTask();
      const first = await ensureExecution({
        executionId: CANONICAL,
        taskId: task.id,
      });
      // Assign it, then replay creation — the existing record must come back
      // untouched rather than being recreated or reset.
      await ensureAssignment(CANONICAL, { requiredCapabilities: ["validation"] });
      const replayed = await ensureExecution({
        executionId: CANONICAL,
        taskId: task.id,
      });

      expect(replayed.id).toBe(first.id);
      expect(replayed.assignmentId).toBeTruthy(); // not reset to the fresh shape
      expect(getDevHqStore().executions.size).toBe(1);
    });

    it("gives concurrent callers one execution", async () => {
      const task = seedTask();
      const results = await Promise.all(
        [1, 2, 3, 4].map(() =>
          ensureExecution({ executionId: CANONICAL, taskId: task.id }),
        ),
      );
      expect(new Set(results.map((e) => e.id)).size).toBe(1);
      expect(getDevHqStore().executions.size).toBe(1);
    });

    it("refuses to reuse an execution belonging to a different task", async () => {
      const task = seedTask();
      seedTask({ id: "task-other" });
      await ensureExecution({ executionId: CANONICAL, taskId: task.id });

      // Silently returning the other task's execution would go on to assign an
      // agent and dispatch it against the wrong task.
      await expect(
        ensureExecution({ executionId: CANONICAL, taskId: "task-other" }),
      ).rejects.toThrow(
        `Execution ${CANONICAL} belongs to task ${task.id}, not task-other`,
      );
      expect((await getExecution(CANONICAL))?.taskId).toBe(task.id); // untouched
      expect(getDevHqStore().executions.size).toBe(1);
    });

    it("throws creating at an id whose task is missing", async () => {
      await expect(
        ensureExecution({ executionId: CANONICAL, taskId: "task-missing" }),
      ).rejects.toThrow("Task not found: task-missing");
      expect(getDevHqStore().executions.size).toBe(0); // nothing partially created
    });

    it("assigns an agent once and reuses the assignment on replay", async () => {
      const task = seedTask();
      await ensureExecution({ executionId: CANONICAL, taskId: task.id });

      const first = await ensureAssignment(CANONICAL, {
        requiredCapabilities: ["validation"],
      });
      expect(first.created).toBe(true);
      expect(first.decision.assigned).toBe(true);
      expect(first.decision.agentId).toBe("agent-supervisor");
      expect(first.decision.execution?.assignmentId).toBe(
        first.decision.assignment?.id,
      );
      // Attempt 1 preserved: a revision gets a full retry budget.
      expect(first.decision.execution?.attempt).toBe(1);
      // Not reserved until claim, matching assignExecution.
      expect(getAgent("agent-supervisor")?.availability).toBe("available");

      const second = await ensureAssignment(CANONICAL, {
        requiredCapabilities: ["validation"],
      });
      expect(second.created).toBe(false);
      expect(second.decision.assignment?.id).toBe(first.decision.assignment?.id);
      expect(getDevHqStore().agentAssignments.size).toBe(1);
    });

    it("gives concurrent callers one assignment", async () => {
      const task = seedTask();
      await ensureExecution({ executionId: CANONICAL, taskId: task.id });
      const results = await Promise.all(
        [1, 2, 3, 4].map(() =>
          ensureAssignment(CANONICAL, { requiredCapabilities: ["validation"] }),
        ),
      );
      expect(results.filter((r) => r.created)).toHaveLength(1);
      expect(getDevHqStore().agentAssignments.size).toBe(1);
    });

    it("leaves the execution untouched when no agent is available", async () => {
      const task = seedTask();
      await ensureExecution({ executionId: CANONICAL, taskId: task.id });

      const result = await ensureAssignment(CANONICAL, {
        requiredCapabilities: ["qa"], // eligible agent exists but is only "waiting"
      });
      expect(result.created).toBe(false);
      expect(result.decision.assigned).toBe(false);
      expect(result.decision.reason).toBe("no_agent_available");

      // Nothing to unwind — a later call can still assign it.
      const execution = (await getExecution(CANONICAL))!;
      expect(execution.status).toBe("queued");
      expect(execution.agentId).toBeNull();
      expect(execution.assignmentId).toBeNull();
      expect(getDevHqStore().agentAssignments.size).toBe(0);
    });

    it("refuses to assign an execution that has left the queue", async () => {
      const task = seedTask();
      await ensureExecution({ executionId: CANONICAL, taskId: task.id });
      await ensureAssignment(CANONICAL, { requiredCapabilities: ["validation"] });
      await runExecution(CANONICAL); // now running

      const result = await ensureAssignment(CANONICAL);
      expect(result.created).toBe(false);
      expect(result.decision.assigned).toBe(false);
      expect(result.decision.reason).toBe("execution_not_queued");
      expect(getDevHqStore().agentAssignments.size).toBe(1);
    });

    it("replaces a released assignment on a still-queued execution", async () => {
      const task = seedTask();
      await ensureExecution({ executionId: CANONICAL, taskId: task.id });
      const first = await ensureAssignment(CANONICAL, {
        requiredCapabilities: ["validation"],
      });
      // Simulate the prior assignment being released while the execution stayed
      // queued (e.g. a reclaim); a fresh lease must be issued.
      saveAssignment({
        ...first.decision.assignment!,
        status: "released",
        releasedAt: TS,
        leaseExpiresAt: null,
      });

      const second = await ensureAssignment(CANONICAL, {
        requiredCapabilities: ["validation"],
      });
      expect(second.created).toBe(true);
      expect(second.decision.assignment?.id).not.toBe(
        first.decision.assignment?.id,
      );
      expect((await getExecution(CANONICAL))?.assignmentId).toBe(
        second.decision.assignment?.id,
      );
    });

    it("throws for a missing execution", async () => {
      await expect(ensureAssignment("exec-missing")).rejects.toThrow(
        "Execution not found: exec-missing",
      );
    });
  });

  // The routing policy an execution was assigned under is authoritative for every
  // later attempt, so a retry cannot drift onto a different provider.
  describe("routing policy", () => {
    /** A provider-backed agent and a simulated look-alike, both eligible. */
    function seedProviderAndDecoy(): void {
      saveAgent({
        id: "agent-vendor",
        name: "Vendor",
        role: "External reviewer",
        provider: "vendor-x",
        availability: "available",
        capabilities: ["review"],
        accentColor: "#111111",
        initials: "VD",
        lastActiveAt: TS,
      });
      saveAgent({
        id: "agent-sim",
        name: "Sim",
        role: "Simulated reviewer",
        provider: "internal",
        availability: "available",
        capabilities: ["review"],
        accentColor: "#222222",
        initials: "SM",
        // Most idle, so plain selection prefers it.
        lastActiveAt: "2020-01-01T00:00:00.000Z",
      });
    }

    it("records the routing policy and the routed provider on assignment", async () => {
      const task = seedTask();
      seedProviderAndDecoy();

      const decision = await assignExecution(task.id, {
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
      });

      expect(decision.agentId).toBe("agent-vendor");
      expect(decision.execution?.routing).toEqual({
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
        provider: "vendor-x",
      });
    });

    it("keeps a retry on the routed provider instead of a simulated substitute", async () => {
      const task = seedTask();
      seedProviderAndDecoy();
      const decision = await assignExecution(task.id, {
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
      });
      const executionId = decision.execution!.id;
      await claimExecution(executionId, "agent-vendor");

      const retried = await releaseExecution(executionId, makeResult("failed"));

      expect(retried.status).toBe("queued");
      expect(retried.attempt).toBe(2);
      expect(retried.agentId).toBe("agent-vendor");
      expect(retried.routing?.provider).toBe("vendor-x");
    });

    it("re-queues unassigned when no agent of the routed provider is eligible", async () => {
      const task = seedTask();
      seedProviderAndDecoy();
      const decision = await assignExecution(task.id, {
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
      });
      const executionId = decision.execution!.id;
      await claimExecution(executionId, "agent-vendor");
      getDevHqStore().agents.delete("agent-vendor");

      const retried = await releaseExecution(executionId, makeResult("failed"));

      expect(retried.status).toBe("queued");
      expect(retried.attempt).toBe(2);
      expect(retried.agentId).toBeNull();
      expect(retried.assignmentId).toBeNull();
      // The policy is preserved for a later attempt rather than discarded.
      expect(retried.routing?.provider).toBe("vendor-x");
    });

    it("does not let a later policy widen the persisted routing", async () => {
      const task = seedTask();
      seedProviderAndDecoy();
      const decision = await assignExecution(task.id, {
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
      });
      const executionId = decision.execution!.id;
      await claimExecution(executionId, "agent-vendor");
      getDevHqStore().agents.delete("agent-vendor");
      await releaseExecution(executionId, makeResult("failed"));

      // A caller asking for the simulated agent on a routed execution is refused.
      const result = await ensureAssignment(executionId, {
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-sim",
      });

      expect(result.decision.assigned).toBe(false);
      expect(result.decision.reason).toBe("no_agent_available");
      expect((await getExecution(executionId))?.agentId).toBeNull();
    });

    it("records an intended policy at creation without pinning a provider", async () => {
      const task = seedTask();
      const execution = await ensureExecution({
        executionId: "exec-intent-1",
        taskId: task.id,
        policy: { requiredCapabilities: ["validation"] },
      });

      // Present, so the execution is recognizable as agent-backed work awaiting
      // assignment, but unpinned: nothing has run yet.
      expect(execution.routing).toEqual({
        requiredCapabilities: ["validation"],
        preferredAgentId: null,
        provider: null,
      });
    });

    it("lets a caller refine the policy until the execution is routed", async () => {
      const task = seedTask();
      seedProviderAndDecoy();
      await ensureExecution({
        executionId: "exec-intent-2",
        taskId: task.id,
        policy: { requiredCapabilities: [] },
      });

      // Before routing, the caller's policy governs.
      const assigned = await ensureAssignment("exec-intent-2", {
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
      });
      expect(assigned.decision.agentId).toBe("agent-vendor");

      // After routing, it does not: the execution is pinned to what it ran on.
      const execution = (await getExecution("exec-intent-2"))!;
      expect(execution.routing).toEqual({
        requiredCapabilities: ["review"],
        preferredAgentId: "agent-vendor",
        provider: "vendor-x",
      });
    });

    it("leaves unrouted executions on the existing selection behaviour", async () => {
      const task = seedTask();
      const decision = await assignExecution(task.id, {
        requiredCapabilities: ["validation"],
      });

      expect(decision.execution?.routing).toEqual({
        requiredCapabilities: ["validation"],
        preferredAgentId: null,
        provider: "internal",
      });
    });
  });
});
