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
    expect(body.agents).toHaveLength(5);
    expect(body.agents.map((agent) => agent.id)).toContain("agent-orchestrator");
  });
});
