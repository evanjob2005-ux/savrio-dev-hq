import { beforeEach, describe, expect, it } from "vitest";

import { AGENT_CAPABILITIES, EXECUTIVE_ORCHESTRATOR_AGENT_ID } from "@/lib/dev-hq/constants";
import { getAgent, selectAgent } from "@/lib/dev-hq/agent-registry";
import { getDevHqStore, resetDevHqStore } from "@/lib/dev-hq/store";

/**
 * Exercises the SHIPPED registry seed, with no saveAgent override.
 *
 * This suite exists because 389 passing tests could not see two defects in the
 * seed: three agents were seeded into a terminal non-available state, and the
 * executive orchestrator was written into escalation records without ever being
 * registered. Every existing test that touches agent selection first calls
 * `saveAgent({ ...agent, availability: "available" })`, so the suite asserted
 * around the state it was meant to verify.
 *
 * The rule this encodes: when a defect lives in seed data, a test that replaces
 * the seed cannot find it.
 */
describe("shipped agent registry seed", () => {
  beforeEach(() => {
    resetDevHqStore();
  });

  it("can dispatch every capability the system claims to support", () => {
    // ADR-0001 O3 freezes this vocabulary, and DispatchAgentPanel offers every
    // entry to the Founder. Any capability that cannot be satisfied is a
    // dispatch that strands: queued forever, no attempt consumed, so no
    // escalation ever raised.
    const unsatisfiable = AGENT_CAPABILITIES.filter(
      (capability) => selectAgent({ requiredCapabilities: [capability] }) === null,
    );

    expect(
      unsatisfiable,
      `capabilities no seeded agent can satisfy: ${unsatisfiable.join(", ")}`,
    ).toEqual([]);
  });

  it("seeds every agent with the concurrency primitive unlocked", () => {
    // availability is the compare-and-set primitive (ADR-0001 D6), not a display
    // field. An agent seeded "busy" holds a lock nothing can release, because
    // only releasing a claimed execution writes "available" back.
    const { agents } = getDevHqStore();
    const locked = [...agents.values()]
      .filter((agent) => agent.availability !== "available")
      .map((agent) => `${agent.id}=${agent.availability}`);

    expect(locked, `agents seeded into a terminal locked state: ${locked.join(", ")}`)
      .toEqual([]);
  });

  it("registers the executive orchestrator that escalation records reference", () => {
    // escalation-service and founder-request-service persist this id as
    // raisedByAgentId, createdByAgentId and actorId. ADR-0001 D5 requires the
    // seed to reuse ids already hard-referenced elsewhere and names this one.
    const agent = getAgent(EXECUTIVE_ORCHESTRATOR_AGENT_ID);

    expect(
      agent,
      `${EXECUTIVE_ORCHESTRATOR_AGENT_ID} is written into escalation records but is not in the registry`,
    ).not.toBeNull();
    expect(agent?.availability).toBe("available");
  });
});

