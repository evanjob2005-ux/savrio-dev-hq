import { beforeEach, describe, expect, it } from "vitest";

import {
  evaluateAgentHealth,
  findEligibleAgents,
  getAgent,
  hasCapabilities,
  isAvailable,
  listAgents,
  selectAgent,
} from "@/lib/dev-hq/agent-registry";
import { resetDevHqStore, saveAgent } from "@/lib/dev-hq/store";
import type { Agent } from "@/types/domain";

function baseAgent(overrides: Partial<Agent> & Pick<Agent, "id">): Agent {
  return {
    name: overrides.id,
    role: "Test",
    provider: "internal",
    availability: "available",
    capabilities: [],
    accentColor: "#000000",
    initials: "TT",
    lastActiveAt: null,
    ...overrides,
  };
}

describe("agent registry", () => {
  beforeEach(() => {
    resetDevHqStore();
  });

  it("seeds the canonical roster from placeholders", () => {
    const agents = listAgents();
    expect(agents).toHaveLength(5);
    expect(agents.map((a) => a.id)).toContain("agent-orchestrator");
    expect(agents.map((a) => a.id)).toContain("agent-supervisor");
  });

  it("looks up agents by id", () => {
    expect(getAgent("agent-supervisor")?.role).toBe("Process Auditor");
    expect(getAgent("agent-missing")).toBeNull();
  });

  it("evaluates capability supersets", () => {
    const supervisor = getAgent("agent-supervisor")!;
    expect(hasCapabilities(supervisor, ["validation"])).toBe(true);
    expect(hasCapabilities(supervisor, ["gates", "validation"])).toBe(true);
    expect(hasCapabilities(supervisor, ["routing"])).toBe(false);
    expect(hasCapabilities(supervisor, [])).toBe(true);
  });

  it("treats only available agents as eligible", () => {
    // Seed availability: orchestrator+supervisor available; claude+codex busy;
    // gemini waiting.
    expect(isAvailable(getAgent("agent-orchestrator")!)).toBe(true);
    expect(isAvailable(getAgent("agent-claude")!)).toBe(false);

    const eligible = findEligibleAgents();
    expect(eligible.map((a) => a.id).sort()).toEqual([
      "agent-orchestrator",
      "agent-supervisor",
    ]);
  });

  it("filters eligible agents by required capabilities", () => {
    expect(findEligibleAgents({ requiredCapabilities: ["validation"] })).toHaveLength(1);
    expect(
      findEligibleAgents({ requiredCapabilities: ["validation"] })[0].id,
    ).toBe("agent-supervisor");
  });

  it("selects the capability-matching available agent", () => {
    expect(selectAgent({ requiredCapabilities: ["routing"] })?.id).toBe(
      "agent-orchestrator",
    );
    expect(selectAgent({ requiredCapabilities: ["validation"] })?.id).toBe(
      "agent-supervisor",
    );
  });

  it("returns null when no available agent matches", () => {
    // gemini has qa but is only "waiting", not available.
    expect(selectAgent({ requiredCapabilities: ["qa"] })).toBeNull();
    expect(selectAgent({ requiredCapabilities: ["nonexistent"] })).toBeNull();
  });

  it("picks the least-recently-active eligible agent by default", () => {
    // supervisor lastActiveAt 19:45 is older than orchestrator's 21:00.
    expect(selectAgent()?.id).toBe("agent-supervisor");
  });

  it("honors a preferred agent when it is eligible", () => {
    expect(selectAgent({ preferredAgentId: "agent-orchestrator" })?.id).toBe(
      "agent-orchestrator",
    );
  });

  it("ignores a preferred agent that is not eligible and falls back", () => {
    // claude is busy -> not eligible; fall back to least-recently-active available.
    expect(selectAgent({ preferredAgentId: "agent-claude" })?.id).toBe(
      "agent-supervisor",
    );
    // preferred is available but lacks the required capability.
    expect(
      selectAgent({
        preferredAgentId: "agent-orchestrator",
        requiredCapabilities: ["validation"],
      })?.id,
    ).toBe("agent-supervisor");
  });

  it("treats a required provider as a hard filter, applied before ordering", () => {
    const older = "2020-01-01T00:00:00.000Z";
    saveAgent(
      baseAgent({
        id: "agent-sim",
        provider: "internal",
        capabilities: ["review"],
        lastActiveAt: older, // most idle, so it wins unpinned selection
      }),
    );
    saveAgent(
      baseAgent({
        id: "agent-vendor",
        provider: "vendor-x",
        capabilities: ["review"],
        lastActiveAt: "2026-07-24T21:00:00.000Z",
      }),
    );

    expect(selectAgent({ requiredCapabilities: ["review"] })?.id).toBe("agent-sim");
    // Pinned: the same-provider agent is found even though it is not the most idle.
    expect(
      selectAgent({ requiredCapabilities: ["review"], requiredProvider: "vendor-x" })
        ?.id,
    ).toBe("agent-vendor");
    expect(
      findEligibleAgents({ requiredProvider: "vendor-x" }).map((a) => a.id),
    ).toEqual(["agent-vendor"]);
    // No substitution when the pinned provider has nothing eligible.
    expect(selectAgent({ requiredProvider: "vendor-absent" })).toBeNull();
  });

  it("breaks exact idle ties deterministically by id", () => {
    const activeAt = "2026-07-24T10:00:00.000Z";
    saveAgent(
      baseAgent({ id: "agent-zzz", capabilities: ["x"], lastActiveAt: activeAt }),
    );
    saveAgent(
      baseAgent({ id: "agent-aaa", capabilities: ["x"], lastActiveAt: activeAt }),
    );
    expect(selectAgent({ requiredCapabilities: ["x"] })?.id).toBe("agent-aaa");
  });
});

describe("evaluateAgentHealth", () => {
  const NOW = "2026-07-25T12:00:00.000Z";
  const nowMs = new Date(NOW).getTime();
  const THRESHOLD = 60_000;

  function activeAgo(ms: number, availability: Agent["availability"] = "available") {
    return baseAgent({
      id: "agent-h",
      availability,
      lastActiveAt: new Date(nowMs - ms).toISOString(),
    });
  }

  it("evaluates a fresh heartbeat as healthy", () => {
    expect(evaluateAgentHealth(activeAgo(1_000), NOW, THRESHOLD)).toBe("healthy");
  });

  it("evaluates a stale heartbeat as stale", () => {
    expect(evaluateAgentHealth(activeAgo(120_000), NOW, THRESHOLD)).toBe("stale");
  });

  it("evaluates a missing heartbeat as stale (fallback policy)", () => {
    expect(
      evaluateAgentHealth(baseAgent({ id: "agent-h", lastActiveAt: null }), NOW, THRESHOLD),
    ).toBe("stale");
  });

  it("treats an offline agent as unavailable regardless of freshness", () => {
    // Fresh heartbeat but offline availability.
    expect(evaluateAgentHealth(activeAgo(1_000, "offline"), NOW, THRESHOLD)).toBe(
      "unavailable",
    );
  });

  it("applies the threshold boundary deterministically (inclusive)", () => {
    expect(evaluateAgentHealth(activeAgo(THRESHOLD), NOW, THRESHOLD)).toBe("healthy");
    expect(evaluateAgentHealth(activeAgo(THRESHOLD + 1), NOW, THRESHOLD)).toBe("stale");
  });
});
