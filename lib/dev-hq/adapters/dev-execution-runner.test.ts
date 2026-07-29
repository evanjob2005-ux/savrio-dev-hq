import { beforeEach, describe, expect, it } from "vitest";

import { createDevExecutionRunner } from "@/lib/dev-hq/adapters/dev-execution-runner";
import {
  getAgent,
  getAssignment,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { AgentResult, Task } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

function seedTask(): Task {
  return saveTask({
    id: "task-runner-1",
    projectId: "proj-x",
    workflowId: null,
    title: "Runner task",
    description: "Dispatched via the adapter.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

function succeeded(): AgentResult {
  return {
    agentId: "",
    taskId: "",
    status: "succeeded",
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

describe("DevExecutionRunner", () => {
  const runner = createDevExecutionRunner();

  beforeEach(() => {
    resetDevHqStore();
  });

  it("drives assign -> claim -> heartbeat -> release through the manager", async () => {
    const task = seedTask();
    const decision = await runner.assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    expect(decision.assigned).toBe(true);

    const executionId = decision.execution!.id;
    const assignmentId = decision.assignment!.id;
    const claimed = await runner.claimExecution(executionId, "agent-supervisor");
    expect(claimed.outcome).toBe("claimed");
    expect(
      claimed.outcome === "claimed" ? claimed.execution.status : null,
    ).toBe("running");

    await runner.heartbeat(executionId, assignmentId);
    const done = await runner.releaseExecution(executionId, succeeded());
    expect(done.status).toBe("succeeded");

    expect((await runner.getExecution(executionId))?.status).toBe("succeeded");
  });

  it("forwards the heartbeat's assignment identity to the manager", async () => {
    const task = seedTask();
    const decision = await runner.assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    const executionId = decision.execution!.id;
    const assignmentId = decision.assignment!.id;
    await runner.claimExecution(executionId, "agent-supervisor");

    // Pin a recognisable stamp so any write through the seam is detectable
    // regardless of clock resolution.
    const claimedAssignment = getAssignment(assignmentId)!;
    expect(claimedAssignment.status).toBe("claimed");

    // A beat naming an assignment that is not the current attempt's must be a
    // no-op. This is the whole point of carrying the identity: the adapter used
    // to accept no identity at all, so every beat that crossed it arrived
    // anonymous and the manager honoured it as the current worker's. An
    // abandoned run could then keep a successor attempt's lease alive.
    const ignored = await runner.heartbeat(executionId, "asgn-not-current");
    expect(ignored.status).toBe("running");
    const afterStale = getAssignment(assignmentId)!;
    expect(afterStale.status).toBe("claimed"); // never promoted to "running"
    expect(afterStale.lastHeartbeatAt).toBe(claimedAssignment.lastHeartbeatAt);
    expect(afterStale.leaseExpiresAt).toBe(claimedAssignment.leaseExpiresAt);

    // The current attempt's own beat is honoured, so the no-op above is the
    // identity check doing its job rather than the seam being inert.
    await runner.heartbeat(executionId, assignmentId);
    expect(getAssignment(assignmentId)!.status).toBe("running");
  });

  it("reports the three claim outcomes as a discriminated result", async () => {
    const task = seedTask();
    const decision = await runner.assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    const executionId = decision.execution!.id;

    const supervisor = getAgent("agent-supervisor")!;
    saveAgent({ ...supervisor, availability: "offline" });
    expect(await runner.claimExecution(executionId, "agent-supervisor")).toEqual(
      { outcome: "agent_unavailable" },
    );

    saveAgent({ ...supervisor, availability: "busy" });
    expect(await runner.claimExecution(executionId, "agent-supervisor")).toEqual(
      { outcome: "lost_to_concurrent_claim" },
    );

    saveAgent({ ...supervisor, availability: "available" });
    const claimed = await runner.claimExecution(executionId, "agent-supervisor");
    expect(claimed.outcome).toBe("claimed");

    // A precondition violation still throws through the adapter rather than
    // arriving as a fourth outcome.
    await expect(
      runner.claimExecution(executionId, "agent-supervisor"),
    ).rejects.toThrow(/not claimable/);
  });

  it("surfaces no_agent_available from the manager", async () => {
    const task = seedTask();
    const decision = await runner.assignExecution(task.id, {
      requiredCapabilities: ["no-such-capability"],
    });
    expect(decision.assigned).toBe(false);
    expect(decision.reason).toBe("no_agent_available");
  });

  it("lists ready work", async () => {
    seedTask();
    const ready = await runner.listReadyWork();
    expect(ready.map((t) => t.id)).toContain("task-runner-1");
  });
});
