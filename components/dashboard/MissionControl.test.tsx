import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AGENTS, AGENT_ORDER } from "@/lib/workflow/config";
import { AgentStatusRail } from "@/components/dashboard/AgentStatusRail";

/**
 * P2-39, pinned at the call site rather than at the component.
 *
 * `AgentStatusRail.test.tsx` proves the component honours whichever provenance
 * it is handed. That leaves the handing over: `MissionControl` passes
 * `provenance="simulated"` on one line, and that single word is the only place
 * the defect can come back. Changing it to `"live"` restores exactly the
 * original bug — mock-engine statuses presented as real agent state, under a
 * header badged "LIVE STATE · DEV MODE" — and the component suite cannot see
 * it, because every one of its cases writes the provenance into the test
 * itself. The composed case wrote the literal `"simulated"` too, so it rendered
 * a composition MissionControl was no longer required to match.
 *
 * This renders `MissionControl` and reads the provenance back off the rail it
 * actually produces, so the assertion has no way to supply the answer it is
 * checking for.
 *
 * The Dev HQ feed is stubbed to its pre-snapshot state: `MissionControlOverview`
 * then renders its loading branch and neither fetches nor polls. Nothing in this
 * file is about that panel, and a live 3s loop would only add flake.
 */

vi.mock("@/lib/mission-control/useDevHqState", () => ({
  useDevHqState: () => ({
    state: null,
    status: "initial" as const,
    error: null,
    updatedAt: null,
    consecutiveFailures: 0,
    refresh: async () => {},
    applySnapshot: () => {},
  }),
}));

const { MissionControl } = await import("@/components/dashboard/MissionControl");

/** aria-label, or the text of what aria-labelledby points at. */
function accessibleName(el: HTMLElement): string {
  const label = el.getAttribute("aria-label");
  if (label && label.trim()) return label.trim();
  const ids = (el.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
  return ids
    .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
    .join(" ")
    .trim();
}

/**
 * The rail located by where it sits, not by what it says.
 *
 * Its heading and accessible name are both derived from the provenance under
 * test, so selecting on either would mean naming the expected answer in the
 * query. Position is independent of it: the rail is the section between the top
 * bar and the main content, which is the adjacency that makes an unmarked rail a
 * false claim in the first place.
 */
function agentRail(container: HTMLElement): HTMLElement {
  const main = container.querySelector("main");
  expect(main, "MissionControl rendered no <main> to locate the rail against").not.toBeNull();
  const rail = main!.previousElementSibling;
  expect(
    rail?.tagName,
    "the agent status rail is no longer the section sitting between the top bar " +
      "and the main content, so this test is reading something else",
  ).toBe("SECTION");
  return rail as HTMLElement;
}

type RailProvenance = "simulated" | "live" | "unmarked";

/**
 * Classify what a rendered rail claims about where its statuses came from,
 * reading it the way a Founder and a screen-reader user would: visible text plus
 * the accessible name of the tab stop.
 *
 * Fails closed. A rail carrying neither marker, or somehow both, is `unmarked`
 * rather than being resolved to a guess — an unreadable provenance is the defect,
 * not a detail.
 */
function railProvenance(rail: HTMLElement): RailProvenance {
  const read = `${accessibleName(rail)} ${rail.textContent ?? ""}`.toLowerCase();
  const saysSimulated = read.includes("simulated") && read.includes("no agent is running");
  const saysLive = read.includes("agent registry");
  if (saysSimulated && !saysLive) return "simulated";
  if (saysLive && !saysSimulated) return "live";
  return "unmarked";
}

const STATUSES_FOR_NULL_ARM = Object.fromEntries(
  AGENT_ORDER.map((id) => [id, { label: "Implementing", active: true, tone: "active" }]),
) as Parameters<typeof AgentStatusRail>[0]["statuses"];

describe("P2-39 · MissionControl declares its agent rail simulated", () => {
  it("marks the rail it composes as simulated, next to the LIVE STATE badge", () => {
    const { container } = render(<MissionControl />);
    const rail = agentRail(container);

    // The badge is a real claim about the Dev HQ state feed and stays. What must
    // not happen is the rail sitting directly beneath it with no claim of its own
    // — or, worse, with the badge's claim repeated over mock-engine output.
    expect(
      container.textContent ?? "",
      "the LIVE STATE badge is gone, so this is no longer the composition the " +
        "provenance marker exists to disambiguate",
    ).toContain("LIVE STATE");

    // Not passing by rendering an empty rail: the agent cards really are on
    // screen, which is the content whose provenance is in question.
    for (const id of AGENT_ORDER) {
      expect(rail.textContent ?? "", `no card rendered for ${id}`).toContain(
        AGENTS[id].name,
      );
    }

    expect(
      railProvenance(rail),
      "MissionControl feeds this rail from useWorkflowEngine, the mock engine, " +
        "and no agent is running — but the rail it renders does not say so",
    ).toBe("simulated");
  });

  it("NULL ARM: the same reading reports a live rail as live", () => {
    // Identical helper, identical statuses, only the declared provenance
    // differs. Without this, "the rail reads as simulated" would also be
    // satisfied by a reading that returns "simulated" for anything — and the
    // day the rail is wired to the agent registry it would keep passing while
    // reporting real agent state as mock output.
    const { container } = render(
      <AgentStatusRail statuses={STATUSES_FOR_NULL_ARM} provenance="live" />,
    );
    const rail = container.querySelector("section");
    expect(rail, "the rail rendered no section").not.toBeNull();

    expect(railProvenance(rail as HTMLElement)).toBe("live");
  });

  it("NULL ARM: a rail carrying no marker reads as unmarked, not as either claim", () => {
    // The pre-fix rail: statuses on screen, nothing saying where they came from.
    // This is what the reading must never resolve into a provenance, because
    // silently resolving it is how the original defect stayed invisible.
    const { container } = render(<section>Claude Implementing</section>);

    expect(railProvenance(container.querySelector("section") as HTMLElement)).toBe(
      "unmarked",
    );
  });
});
