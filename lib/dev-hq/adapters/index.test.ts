import { beforeEach, describe, expect, it } from "vitest";

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";

describe("dev HQ adapters composition root", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
  });

  it("exposes the agent, execution, evidence, and escalation ports", () => {
    const adapters = getDevHqAdapters();
    expect(adapters.agentProvider).toBeDefined();
    expect(adapters.executionRunner).toBeDefined();
    expect(adapters.evidenceStore).toBeDefined();
    expect(adapters.escalationStore).toBeDefined();
  });

  it("serves the seeded roster through the agent provider", async () => {
    const { agentProvider } = getDevHqAdapters();
    expect(await agentProvider.listAgents()).toHaveLength(5);
  });

  it("keeps the execution runner usable for ready-work queries", async () => {
    const { executionRunner } = getDevHqAdapters();
    expect(await executionRunner.listReadyWork()).toEqual([]);
  });

  it("serves an execution runner carrying the three-outcome claim contract", async () => {
    const { executionRunner } = getDevHqAdapters();
    saveTask({
      id: "task-root-1",
      projectId: "proj-x",
      workflowId: null,
      title: "Composition root task",
      description: "Claimed through the served port.",
      status: "active",
      priority: "High",
      assigneeAgentId: null,
      claimedAt: null,
      createdAt: "2026-07-24T21:00:00.000Z",
      updatedAt: "2026-07-24T21:00:00.000Z",
      dueAt: null,
    });

    const decision = await executionRunner.assignExecution("task-root-1", {
      requiredCapabilities: ["validation"],
    });
    const claimed = await executionRunner.claimExecution(
      decision.execution!.id,
      decision.agentId!,
    );
    // The runner the root serves is the three-outcome one, and the heartbeat it
    // serves carries the attempt's assignment. This is the object the
    // agent-execution callbacks resolve from here instead of importing the
    // Execution Manager themselves, so its contract is the one they get.
    expect(claimed.outcome).toBe("claimed");
    const beat = await executionRunner.heartbeat(
      decision.execution!.id,
      decision.assignment!.id,
    );
    expect(beat.status).toBe("running");
  });

  it("caches adapters and rebuilds them after reset", () => {
    const first = getDevHqAdapters();
    expect(getDevHqAdapters()).toBe(first);
    resetDevHqAdapters();
    expect(getDevHqAdapters()).not.toBe(first);
  });
});
