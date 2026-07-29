import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AGENT_CAPABILITIES } from "@/lib/dev-hq/constants";
import { listAgents } from "@/lib/dev-hq/agent-registry";
import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import type { DevHqState } from "@/lib/dev-hq/types";

/**
 * UI-08 — the dispatch panel mirrors ADR-0001 O3's frozen Phase 1 capability
 * vocabulary as a literal, because importing `lib/dev-hq/constants` would pull
 * `next/server` into the client bundle. The invariant it protects: the UI must
 * never offer a capability value that no seeded agent can satisfy, which would
 * produce dispatches that can never assign.
 *
 * The previous version of this file read that literal out of the component's
 * *source text* with `indexOf('<datalist id="dispatch-capabilities">')` and
 * `JSON.parse`. Source text is not what the founder's browser gets, and two
 * classes of defect passed straight through it:
 *
 *  - rendered-value drift — the array is the input to a `.map()`, and anything
 *    between the literal and the `value=` attribute (a `.filter()`, a `.slice()`,
 *    a transform on `capability`) changes what is offered while the literal it
 *    scraped stays correct;
 *  - an orphaned `list=` — the `<input list="...">` and the `<datalist id="...">`
 *    are bound by a string that appears in two places. Change one and the
 *    suggestions silently stop appearing, with the datalist still in the source
 *    for the scraper to find and still passing.
 *
 * So this renders the panel and reads the DOM: the option values as painted, and
 * the binding as the browser would resolve it.
 *
 * Rule 2 of STD-CTRL-001: the null arm at the bottom runs the same two helpers
 * over hand-built markup whose answers are known by inspection — one drifted
 * list, one orphaned binding — because "the helper found no problem" is also
 * what a helper that inspects nothing reports.
 */

const emptyState = (): DevHqState => ({
  projects: [],
  tasks: [],
  approvals: [],
  events: [],
  workflows: [],
  executions: [],
  workflowRuns: [],
  agents: [],
  evidence: [],
  escalations: [],
  reviews: [],
  reviewFindings: [],
  overview: MISSION_CONTROL_PLACEHOLDERS.overview,
  processStart: { id: "proc-fixture", startedAt: "2026-07-29T09:00:00.000Z" },
});

vi.mock("@/lib/mission-control/useDevHqState", () => ({
  useDevHqState: () => ({
    state: emptyState(),
    status: "live" as const,
    error: null,
    updatedAt: "2026-07-29T09:00:00.000Z",
    consecutiveFailures: 0,
    refresh: async () => {},
    applySnapshot: () => {},
  }),
}));

vi.mock("@/lib/dev-hq/actions", () => ({
  dispatchAgentExecutionAction: async () => {
    throw new Error("not dispatched in this suite");
  },
}));

const { DispatchAgentPanel } = await import(
  "@/components/dashboard/DispatchAgentPanel"
);

// ---- Reading the DOM the browser would build --------------------------------

/**
 * The capability values actually offered by the control the founder types into,
 * reached the way the browser reaches them: from the input's `list`, not from
 * whichever datalist happens to be nearby.
 */
function offeredCapabilities(input: HTMLInputElement): string[] {
  const listId = input.getAttribute("list");
  expect(listId, "the capabilities input declares no list, so it offers nothing").not.toBeNull();

  const target = input.ownerDocument.getElementById(listId!);
  expect(
    target,
    `the capabilities input points at list="${listId}" but no element with that ` +
      `id is rendered, so no suggestions appear at all`,
  ).not.toBeNull();
  expect(
    target!.tagName.toLowerCase(),
    `list="${listId}" resolves to a <${target!.tagName.toLowerCase()}>, which a ` +
      `browser will not use for suggestions`,
  ).toBe("datalist");

  return [...target!.querySelectorAll("option")].map((option) => option.value);
}

// By label rather than by role: `<input list>` maps to role `combobox`, which is
// also what the two `<select>` elements on this form map to. The label is what
// the founder reads, and it is the stable handle.
const capabilitiesInput = () =>
  screen.getByLabelText(/^Required capabilities/) as HTMLInputElement;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dispatch capability vocabulary, as rendered", () => {
  it("offers exactly ADR-0001 O3's frozen capability set", () => {
    render(<DispatchAgentPanel />);

    expect(offeredCapabilities(capabilitiesInput())).toEqual([...AGENT_CAPABILITIES]);
  });

  it("offers ten capabilities and no review-lens vocabulary", () => {
    render(<DispatchAgentPanel />);
    const offered = offeredCapabilities(capabilitiesInput());

    expect(offered).toHaveLength(10);
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
    render(<DispatchAgentPanel />);
    const seeded = new Set(listAgents().flatMap((agent) => agent.capabilities));

    for (const capability of offeredCapabilities(capabilitiesInput())) {
      expect(
        seeded.has(capability),
        `the panel offers "${capability}" but no seeded agent has it, so a ` +
          `dispatch requiring it can never assign`,
      ).toBe(true);
    }
  });

  it("binds the input to a datalist that is actually in the document", () => {
    const { container } = render(<DispatchAgentPanel />);
    const input = capabilitiesInput();
    const listId = input.getAttribute("list");

    // Stated separately from the cases above because this is the half the
    // source scraper could not see: the datalist can be present and correct
    // while nothing points at it.
    expect(listId).toBeTruthy();
    expect(container.ownerDocument.getElementById(listId!)).not.toBeNull();
    expect(container.querySelector(`datalist#${listId}`)).not.toBeNull();
  });

  it("renders one option element per capability, with no empty values", () => {
    render(<DispatchAgentPanel />);
    const listId = capabilitiesInput().getAttribute("list")!;
    const options = [
      ...document.querySelectorAll<HTMLOptionElement>(`datalist#${listId} option`),
    ];

    expect(options).toHaveLength(AGENT_CAPABILITIES.length);
    expect(options.every((o) => o.value.trim().length > 0)).toBe(true);
  });
});

// ---- Null arm ----------------------------------------------------------------

describe("NULL ARM: the reader reports the two defects the scraper could not", () => {
  it("sees a rendered list that drifted from the frozen set", () => {
    // The literal is intact; a transform between it and the DOM is not. This is
    // exactly what `JSON.parse` on the source array would still call correct.
    const { container } = render(
      <>
        <input aria-label="Required capabilities" list="drifted" />
        <datalist id="drifted">
          {[...AGENT_CAPABILITIES].slice(0, 4).map((c) => (
            <option key={c} value={`${c}-review`} />
          ))}
        </datalist>
      </>,
    );

    const input = container.querySelector("input")!;
    const offered = offeredCapabilities(input);

    expect(offered).not.toEqual([...AGENT_CAPABILITIES]);
    expect(offered).toHaveLength(4);
    expect(offered[0]).toBe("routing-review");
  });

  it("sees an orphaned list attribute even though a correct datalist is present", () => {
    const { container } = render(
      <>
        <input aria-label="Required capabilities" list="dispatch-capabilties" />
        <datalist id="dispatch-capabilities">
          {[...AGENT_CAPABILITIES].map((c) => (
            <option key={c} value={c} />
          ))}
        </datalist>
      </>,
    );

    const input = container.querySelector("input")!;

    // The datalist a source scraper would find is right there and correct. The
    // binding is off by one transposed letter, and the control offers nothing.
    expect(
      container.ownerDocument.getElementById("dispatch-capabilities"),
    ).not.toBeNull();
    expect(() => offeredCapabilities(input)).toThrowError(
      /points at list="dispatch-capabilties" but no element with that id is rendered/,
    );
  });
});
