import { beforeEach, describe, expect, it } from "vitest";

import { GET } from "@/app/api/dev-hq/agents/route";
import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import { resetDevHqStore } from "@/lib/dev-hq/store";

describe("GET /api/dev-hq/agents", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
  });

  it("returns the seeded live roster", async () => {
    const response = await GET();
    expect(response.status).toBe(200);

    const body = (await response.json()) as { agents: Array<{ id: string }> };
    // Five roster agents plus agent-executive-orchestrator, which ADR-0001 D5
    // requires the seed to register so escalation records join to a real identity.
    expect(body.agents).toHaveLength(6);
    expect(body.agents.map((agent) => agent.id)).toContain("agent-orchestrator");
  });
});
