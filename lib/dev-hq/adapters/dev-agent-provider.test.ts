import { beforeEach, describe, expect, it } from "vitest";

import { createDevAgentProvider } from "@/lib/dev-hq/adapters/dev-agent-provider";
import { resetDevHqStore, saveAgent } from "@/lib/dev-hq/store";
import { getAgent } from "@/lib/dev-hq/agent-registry";

describe("DevAgentProvider", () => {
  const provider = createDevAgentProvider();

  beforeEach(() => {
    resetDevHqStore();
  });

  it("lists the seeded registry", async () => {
    const agents = await provider.listAgents();
    expect(agents).toHaveLength(5);
  });

  it("gets an agent by id and returns null when missing", async () => {
    expect((await provider.getAgent("agent-orchestrator"))?.name).toBe(
      "Orchestrator",
    );
    expect(await provider.getAgent("agent-missing")).toBeNull();
  });

  it("reports a healthy result for an available agent", async () => {
    const result = await provider.healthCheck("agent-orchestrator");
    expect(result.agentId).toBe("agent-orchestrator");
    expect(result.healthy).toBe(true);
    expect(result.availability).toBe("available");
    expect(result.message).toBeNull();
    expect(result.checkedAt).toBeTruthy();
  });

  it("reports unhealthy for a missing agent", async () => {
    const result = await provider.healthCheck("agent-missing");
    expect(result.healthy).toBe(false);
    expect(result.availability).toBe("offline");
    expect(result.message).toBe("Agent not found in registry.");
  });

  it("reports unhealthy for an offline agent", async () => {
    const orchestrator = getAgent("agent-orchestrator")!;
    saveAgent({ ...orchestrator, availability: "offline" });
    const result = await provider.healthCheck("agent-orchestrator");
    expect(result.healthy).toBe(false);
    expect(result.availability).toBe("offline");
    expect(result.message).toBe("Agent is offline.");
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
