// The dispatch panel mirrors ADR-0001 O3's frozen Phase 1 capability vocabulary
// as a literal, because importing `lib/dev-hq/constants` would pull `next/server`
// into the client bundle. A mirror can drift, so this test reads the literal out
// of the component source and holds it to the canonical set.
//
// The invariant it protects: the UI must never offer a capability value that no
// seeded agent can satisfy, which would produce dispatches that can never assign.

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { AGENT_CAPABILITIES } from "@/lib/dev-hq/constants";
import { listAgents } from "@/lib/dev-hq/agent-registry";

const PANEL = path.resolve(
  __dirname,
  "../../components/dashboard/DispatchAgentPanel.tsx",
);

/** The capability literal the datalist renders. */
function datalistCapabilities(): string[] {
  const source = fs.readFileSync(PANEL, "utf8");
  const marker = '<datalist id="dispatch-capabilities">';
  const start = source.indexOf(marker);
  expect(start, "dispatch-capabilities datalist not found").toBeGreaterThan(-1);
  const open = source.indexOf("[", start);
  const close = source.indexOf("]", open);
  return (JSON.parse(source.slice(open, close + 1)) as string[]).map(String);
}

describe("dispatch capability vocabulary", () => {
  it("offers exactly ADR-0001 O3's frozen capability set", () => {
    expect(datalistCapabilities()).toEqual([...AGENT_CAPABILITIES]);
  });

  it("offers ten capabilities and no review-lens vocabulary", () => {
    const offered = datalistCapabilities();
    expect(offered).toHaveLength(11);
    for (const unfrozen of [
      "architecture-review",
      "reliability-review",
      "final-cross-check",
      "code-review",
    ]) {
      expect(offered).not.toContain(unfrozen);
    }
  });

  it("offers only capabilities a seeded agent can satisfy", () => {
    const seeded = new Set(listAgents().flatMap((agent) => agent.capabilities));
    for (const capability of datalistCapabilities()) {
      expect(
        seeded.has(capability),
        `no seeded agent has capability "${capability}"`,
      ).toBe(true);
    }
  });
});
