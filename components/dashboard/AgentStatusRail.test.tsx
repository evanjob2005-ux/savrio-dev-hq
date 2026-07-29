import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { AgentId } from "@/types/workflow";
import type { AgentRuntimeStatus } from "@/lib/workflow/machine";
import { AgentStatusRail } from "@/components/dashboard/AgentStatusRail";
import { TopBar } from "@/components/dashboard/TopBar";

/**
 * P2-39 — the agent status rail must say where its statuses came from.
 *
 * `MissionControl` renders `<TopBar>` and then `<AgentStatusRail>`, and the
 * statuses it passes come from `useWorkflowEngine`, the mock engine. The top bar
 * carries a badge reading "LIVE STATE · DEV MODE". The rail carried nothing, so
 * the nearest provenance statement to "Claude · Implementing" was a badge
 * asserting the opposite of the truth: a Founder had no way to tell a simulated
 * agent from a working one, and neither did a screen-reader user, for whom the
 * rail is a single tab stop whose name said only "Agent status".
 *
 * Measured on rendered output, not on source: the assertions resolve the section
 * subtree and its accessible name the way a browser and an assistive technology
 * would, so a marker that is rendered outside the rail, or is present in the
 * source but never reaches the DOM, does not satisfy them.
 */

const STATUSES: Record<AgentId, AgentRuntimeStatus> = {
  Evan: { label: "Reviewing", active: true, tone: "waiting" },
  ChatGPT: { label: "Available", active: false, tone: "idle" },
  Supervisor: { label: "Available", active: false, tone: "idle" },
  Claude: { label: "Implementing", active: true, tone: "active" },
  Codex: { label: "Available", active: false, tone: "idle" },
  Gemini: { label: "Available", active: false, tone: "idle" },
  Copilot: { label: "Done", active: false, tone: "done" },
};

/** The rail's own subtree — everything a Founder reading agent status can see. */
function railSection(container: HTMLElement): HTMLElement {
  const section = container.querySelector("section");
  expect(section, "the rail rendered no section").not.toBeNull();
  return section!;
}

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

describe("P2-39 · the agent status rail declares its provenance", () => {
  it("marks simulated statuses as simulated, in the same section as the statuses", () => {
    const { container } = render(
      <AgentStatusRail statuses={STATUSES} provenance="simulated" />,
    );
    const section = railSection(container);
    const text = section.textContent ?? "";

    // The statuses really are on screen, so this is not passing by rendering
    // nothing.
    expect(text, "no agent status was rendered at all").toContain("Implementing");

    expect(
      text.toLowerCase(),
      "the rail renders mock-engine statuses with no marker saying so, under a " +
        "header badged LIVE STATE",
    ).toContain("simulated");
    expect(
      text,
      "nothing tells the Founder these statuses are not a running agent",
    ).toContain("No agent is running");
    expect(
      text,
      'the rail claims its own contents are "Live"',
    ).not.toContain("Live");
  });

  it("carries the provenance in the accessible name of the tab stop", () => {
    // The rail is a single tab stop. A screen-reader user hears its name and
    // nothing else before the cards, so a marker that is only visual leaves them
    // with the same false impression the badge above gives.
    const { container } = render(
      <AgentStatusRail statuses={STATUSES} provenance="simulated" />,
    );

    expect(accessibleName(railSection(container)).toLowerCase()).toContain(
      "simulated",
    );
    const region = container.querySelector<HTMLElement>('[role="group"]');
    expect(region, "the scroll region is gone").not.toBeNull();
    expect(accessibleName(region!).toLowerCase()).toContain("simulated");
  });

  it("NULL ARM: a rail fed real statuses is marked live, not simulated", () => {
    // Identical component and identical statuses; only the declared provenance
    // differs. Without this, "says simulated" is satisfied by a component that
    // prints the word unconditionally, which would be just as wrong the day the
    // rail is wired to the agent registry — and would train the Founder to
    // ignore the marker.
    const { container } = render(
      <AgentStatusRail statuses={STATUSES} provenance="live" />,
    );
    const text = railSection(container).textContent ?? "";

    expect(text).toContain("Implementing");
    expect(text).toContain("Live");
    expect(
      text.toLowerCase(),
      "the rail reports real agent state as simulated",
    ).not.toContain("simulated");
  });

  it("does not leave the LIVE STATE badge as the nearest claim about the rail", () => {
    // Composed the way MissionControl composes them. The badge is a real claim
    // about the Dev HQ state feed and stays; what must not happen is the rail
    // sitting under it with no claim of its own.
    const { container } = render(
      <>
        <TopBar runningId={null} paused={false} runningTitle={null} />
        <AgentStatusRail statuses={STATUSES} provenance="simulated" />
      </>,
    );

    expect(container.textContent ?? "").toContain("LIVE STATE");
    expect(
      (railSection(container).textContent ?? "").toLowerCase(),
      "the rail sits under a LIVE STATE badge carrying no provenance of its own",
    ).toContain("simulated");
  });
});
