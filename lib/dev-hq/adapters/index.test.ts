import { beforeEach, describe, expect, it } from "vitest";

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { resetDevHqStore } from "@/lib/dev-hq/store";

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

  it("caches adapters and rebuilds them after reset", () => {
    const first = getDevHqAdapters();
    expect(getDevHqAdapters()).toBe(first);
    resetDevHqAdapters();
    expect(getDevHqAdapters()).not.toBe(first);
  });
});
