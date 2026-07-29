import { beforeEach, describe, expect, it } from "vitest";

import { createDevAgentProvider } from "@/lib/dev-hq/adapters/dev-agent-provider";
import { resetDevHqStore, saveAgent, saveTask } from "@/lib/dev-hq/store";
import { getAgent } from "@/lib/dev-hq/agent-registry";
import {
  assignExecution,
  claimExecution,
  releaseExecution,
} from "@/lib/dev-hq/execution-manager";
import { nowIso } from "@/lib/dev-hq/id";
import type { AgentResult } from "@/types/domain";

const TS = "2026-07-24T21:00:00.000Z";

function succeededResult(): AgentResult {
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

describe("DevAgentProvider", () => {
  const provider = createDevAgentProvider();

  beforeEach(() => {
    resetDevHqStore();
  });

  it("lists the seeded registry", async () => {
    const agents = await provider.listAgents();
    // Five roster agents plus agent-executive-orchestrator, which ADR-0001 D5
    // requires the seed to register so escalation records join to a real identity.
    expect(agents).toHaveLength(6);
  });

  it("gets an agent by id and returns null when missing", async () => {
    expect((await provider.getAgent("agent-orchestrator"))?.name).toBe(
      "Orchestrator",
    );
    expect(await provider.getAgent("agent-missing")).toBeNull();
  });

  it("reports healthy for an available agent with a fresh heartbeat", async () => {
    const orchestrator = getAgent("agent-orchestrator")!;
    saveAgent({ ...orchestrator, lastActiveAt: nowIso() });

    const result = await provider.healthCheck("agent-orchestrator");
    expect(result.agentId).toBe("agent-orchestrator");
    expect(result.health).toBe("healthy");
    expect(result.healthy).toBe(true);
    expect(result.availability).toBe("available");
    expect(result.message).toBeNull();
    expect(result.checkedAt).toBeTruthy();
  });

  it("reports stale for an available agent whose heartbeat lapsed", async () => {
    const orchestrator = getAgent("agent-orchestrator")!;
    saveAgent({ ...orchestrator, lastActiveAt: "2000-01-01T00:00:00.000Z" });

    const result = await provider.healthCheck("agent-orchestrator");
    expect(result.health).toBe("stale");
    expect(result.healthy).toBe(false);
    expect(result.availability).toBe("available");
    expect(result.message).toBe("Heartbeat is stale.");
  });

  it("reports stale for an available agent with no recorded heartbeat", async () => {
    const orchestrator = getAgent("agent-orchestrator")!;
    saveAgent({ ...orchestrator, lastActiveAt: null });

    const result = await provider.healthCheck("agent-orchestrator");
    expect(result.health).toBe("stale");
    expect(result.message).toBe("No heartbeat recorded.");
  });

  it("reports unavailable for a missing agent", async () => {
    const result = await provider.healthCheck("agent-missing");
    expect(result.health).toBe("unavailable");
    expect(result.healthy).toBe(false);
    expect(result.availability).toBe("offline");
    expect(result.message).toBe("Agent not found in registry.");
  });

  it("reports unavailable for an offline agent even with a fresh heartbeat", async () => {
    const orchestrator = getAgent("agent-orchestrator")!;
    saveAgent({ ...orchestrator, availability: "offline", lastActiveAt: nowIso() });

    const result = await provider.healthCheck("agent-orchestrator");
    expect(result.health).toBe("unavailable");
    expect(result.healthy).toBe(false);
    expect(result.availability).toBe("offline");
    expect(result.message).toBe("Agent is offline.");
  });

  it("leaves existing assignment behavior unchanged", async () => {
    saveTask({
      id: "task-health-1",
      projectId: "proj-x",
      workflowId: null,
      title: "Health task",
      description: "Do work.",
      status: "active",
      priority: "High",
      assigneeAgentId: null,
      claimedAt: null,
      createdAt: TS,
      updatedAt: TS,
      dueAt: null,
    });

    const decision = await assignExecution("task-health-1", {
      requiredCapabilities: ["validation"],
    });
    expect(decision.assigned).toBe(true);
    const executionId = decision.execution!.id;

    await claimExecution(executionId, "agent-supervisor");
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");
    // Health is read-only: a freshly-claimed busy agent is healthy, availability intact.
    const busy = await provider.healthCheck("agent-supervisor");
    expect(busy.availability).toBe("busy");
    expect(busy.health).toBe("healthy");

    await releaseExecution(executionId, succeededResult());
    expect(getAgent("agent-supervisor")?.availability).toBe("available");
  });

  it("does not implement execute yet", async () => {
    await expect(
      provider.execute({
        agentId: "agent-orchestrator",
        taskId: "task-1",
        projectId: "proj-1",
        instructions: "do work",
        context: { repository: "savrio/dev-hq" },
        allowedCapabilities: [],
      }),
    ).rejects.toThrow(/not available yet/);
  });
});
