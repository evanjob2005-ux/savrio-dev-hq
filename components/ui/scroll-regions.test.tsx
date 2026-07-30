import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Agent, Evidence, Event, Execution, Task } from "@/types/domain";
import type { AgentId } from "@/types/workflow";
import type { ActivityEntry } from "@/types/workflow";
import type { AgentRuntimeStatus } from "@/lib/workflow/machine";
import type { AuditRecord } from "@/lib/mission-control/view-model";
import type { DevHqState } from "@/lib/dev-hq/types";
import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import { WORKFLOW_STAGE } from "@/lib/mission-control/status";

/**
 * UI-04 — WCAG 2.1 SC 2.1.1 (Keyboard, Level A) for the five regions that scroll
 * their own overflow.
 *
 * A container with `overflow-y-auto` is scrolled by the pointer, or by the
 * keyboard once it holds focus. These five held no focusable descendant and had
 * no `tabIndex` of their own, so there was no way to put focus inside them:
 * every audit record past 520px, every activity entry past 420px, and every
 * agent card past the right edge of the rail was unreachable without a mouse.
 *
 * The check is deliberately not "ScrollRegion is used here". It walks the
 * *rendered* DOM for anything that scrolls and holds each one to the property,
 * so a panel that grows a new hand-rolled `overflow-y-auto` div later is caught
 * by the same test rather than needing a new one.
 *
 * How this is measured, rather than asserted: `focus()` is called on the
 * container and `document.activeElement` is read back. jsdom only moves focus to
 * an element it considers a focusable area, so a container that is not in the
 * tab order genuinely fails to take focus here — the same reason a keyboard user
 * cannot reach it. The accessible name is read off the resolved
 * `aria-label`/`aria-labelledby`, not off the source.
 *
 * P2-37 — what counts as reachable. The audit originally exempted any container
 * holding at least one focusable descendant. That is the wrong test and it is
 * wrong in the direction that reports green: a container which is not itself a
 * tab stop scrolls only as a side effect of focus landing inside it, so it
 * scrolls exactly as far as its focusable descendants reach. One button at the
 * top satisfied "contains something focusable" while leaving every row below the
 * fold as unreachable as before. The exemption now requires the focusable
 * descendants to *cover* the content: every content item must hold one, or the
 * region is flagged.
 *
 * Rule 2 of STD-CTRL-001: the null arm is the last `describe`. It runs the same
 * audit over hand-built fixtures whose answers are known by inspection — a
 * violating one, a compliant one, a focusable-but-anonymous one, and the two
 * partially-focusable cases the previous exemption waved through. Without it, an
 * audit that returned "no violations" for everything would pass every case above.
 */

// ---- The audit ---------------------------------------------------------------

/** Tailwind's overflow utilities that produce a scroll container. */
const SCROLLS = /(?:^|\s)overflow-(?:x-|y-)?auto(?:\s|$)/;

const FOCUSABLE = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "summary",
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable="true"]',
].join(",");

function scrollContainers(root: ParentNode): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>("*")].filter(
    (el) => typeof el.className === "string" && SCROLLS.test(el.className),
  );
}

/**
 * The items the container scrolls past, with pure layout wrappers unwrapped
 * (P2-37).
 *
 * A container whose scrolling content is a single `<ul>` is not scrolled by
 * reaching the `<ul>` — it is scrolled by reaching the rows inside it. So the
 * unwrap descends through every element that has exactly one element child and
 * stops at the first branch, which is the level at which content repeats.
 *
 * A container that unwraps to a single leaf has no items: there is nothing past
 * the first screenful to be unreachable, and the reachability of the one thing
 * it holds is settled by the focusable check itself.
 */
function contentItems(el: HTMLElement): HTMLElement[] {
  let node: HTMLElement = el;
  while (
    node.childElementCount === 1 &&
    node.firstElementChild instanceof HTMLElement
  ) {
    node = node.firstElementChild;
  }
  return [...node.children].filter(
    (child): child is HTMLElement => child instanceof HTMLElement,
  );
}

function holdsNothingFocusable(el: HTMLElement): boolean {
  return !el.matches(FOCUSABLE) && el.querySelectorAll(FOCUSABLE).length === 0;
}

/** aria-label, or the text of the elements aria-labelledby points at. */
function accessibleName(el: HTMLElement): string {
  const label = el.getAttribute("aria-label");
  if (label && label.trim()) return label.trim();
  const ids = (el.getAttribute("aria-labelledby") ?? "").split(/\s+/).filter(Boolean);
  return ids
    .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? "")
    .join(" ")
    .trim();
}

function describeElement(el: HTMLElement): string {
  const cls = typeof el.className === "string" ? el.className : "";
  return `<${el.tagName.toLowerCase()} class="${cls.slice(0, 70)}">`;
}

/**
 * Every way a scroll container can be unusable by keyboard. Returns one string
 * per problem so the failure message names the real defect rather than a count.
 */
function keyboardAudit(root: ParentNode): string[] {
  const problems: string[] = [];

  for (const el of scrollContainers(root)) {
    const focusableInside = el.querySelectorAll(FOCUSABLE).length;
    const tabindex = el.getAttribute("tabindex");
    const claimsTabStop = tabindex !== null && Number(tabindex) >= 0;

    if (!claimsTabStop) {
      if (focusableInside === 0) {
        problems.push(
          `${describeElement(el)} scrolls its overflow but has no tabindex and ` +
            `contains no focusable descendant, so keyboard users cannot reach it ` +
            `and everything past its first screenful is unavailable (WCAG 2.1 SC 2.1.1)`,
        );
        continue;
      }

      // P2-37. This branch used to end here: one focusable descendant anywhere
      // inside was accepted as proof the region was keyboard-operable. It is
      // not. A container that is not itself a tab stop is scrolled only as a
      // side effect of focus moving to something inside it, so it scrolls
      // exactly as far as its focusable descendants reach. A single button at
      // the top leaves every row below the fold as unreachable as it was with
      // no focusable descendant at all -- and the control reported green on it,
      // which is the failure mode this whole file exists to reject.
      const items = contentItems(el);
      const unreachable = items.filter(holdsNothingFocusable);
      if (unreachable.length > 0) {
        problems.push(
          `${describeElement(el)} scrolls its overflow and is not a tab stop, ` +
            `and ${unreachable.length} of its ${items.length} content items ` +
            `hold nothing focusable (first: ${describeElement(unreachable[0])}), ` +
            `so tabbing cannot scroll them into view; one focusable descendant ` +
            `does not make the rest of the overflow reachable (WCAG 2.1 SC 2.1.1)`,
        );
      }
      continue;
    }

    // Measured, not asserted: does the browser actually put focus here?
    el.focus();
    if (el.ownerDocument.activeElement !== el) {
      problems.push(
        `${describeElement(el)} declares tabindex="${tabindex}" but does not ` +
          `take focus, so it is still not keyboard-scrollable`,
      );
    }

    if (!el.getAttribute("role")) {
      problems.push(
        `${describeElement(el)} is a tab stop with no role, so a screen reader ` +
          `announces an unexplained stop between the surrounding content`,
      );
    }

    if (!accessibleName(el)) {
      problems.push(
        `${describeElement(el)} is a tab stop with no accessible name, so a ` +
          `screen reader announces the stop without saying what it contains`,
      );
    }
  }

  return problems;
}

function expectKeyboardOperable(root: ParentNode, regionCount: number) {
  expect(
    scrollContainers(root).length,
    "no scroll container was rendered, so this case is auditing nothing",
  ).toBe(regionCount);
  const problems = keyboardAudit(root);
  expect(problems, problems.join("\n")).toEqual([]);
}

// ---- Fixtures ----------------------------------------------------------------

const AGENT_STATUSES: Record<AgentId, AgentRuntimeStatus> = {
  Evan: { label: "Reviewing", active: true, tone: "waiting" },
  ChatGPT: { label: "Available", active: false, tone: "idle" },
  Supervisor: { label: "Available", active: false, tone: "idle" },
  Claude: { label: "Implementing", active: true, tone: "active" },
  Codex: { label: "Available", active: false, tone: "idle" },
  Gemini: { label: "Available", active: false, tone: "idle" },
  Copilot: { label: "Done", active: false, tone: "done" },
};

const ACTIVITY: ActivityEntry[] = Array.from({ length: 12 }, (_, i) => ({
  id: `act-${i}`,
  timestamp: `2026-07-29T09:${String(i).padStart(2, "0")}:00.000Z`,
  actor: i % 2 === 0 ? "System" : "Claude",
  message: `Activity entry ${i}.`,
  kind: "system" as const,
}));

const EVENTS: Event[] = Array.from({ length: 12 }, (_, i) => ({
  id: `evt-${i}`,
  type: "execution.updated",
  entityType: "execution" as const,
  entityId: `exe-${i}`,
  message: `Event ${i}.`,
  actorId: "agent-executive-orchestrator",
  actorLabel: "Executive Orchestrator",
  timestamp: `2026-07-29T09:${String(i).padStart(2, "0")}:00.000Z`,
}));

const AUDIT_RECORDS: AuditRecord[] = Array.from({ length: 12 }, (_, i) => ({
  executionId: `exe-${i}`,
  taskId: `tsk-${i}`,
  taskTitle: `Task ${i}`,
  projectName: "Dev HQ",
  stage: "completed" as const,
  status: WORKFLOW_STAGE.completed,
  reviewSummary: "Validation passed.",
  decision: "approved" as const,
  continuation: "confirmed" as const,
  continuationDetail: null,
  rejectionKind: null,
  triggerRunId: `run_${i}`,
  continuationRunId: null,
  execution: null,
  approval: null,
  updatedAt: `2026-07-29T09:${String(i).padStart(2, "0")}:00.000Z`,
}));

// ---- The Simulation Lab dispatch panel ---------------------------------------
//
// Its scroll region only exists once a dispatch has produced evidence, so the
// state feed and the server action are both replaced and the form is submitted.

const DISPATCH_EXECUTION_ID = "exe-dispatch-1";

const DISPATCH_TASK: Task = {
  id: "tsk-dispatch",
  projectId: "prj-1",
  workflowId: "wf-1",
  title: "Ship the onboarding revision",
  description: "Fixture task.",
  status: "active",
  priority: "Medium",
  assigneeAgentId: null,
  claimedAt: null,
  createdAt: "2026-07-29T09:00:00.000Z",
  updatedAt: "2026-07-29T09:00:00.000Z",
  dueAt: null,
};

const DISPATCH_AGENT: Agent = {
  id: "agent-claude",
  name: "Claude",
  role: "Implementation",
  provider: "anthropic",
  availability: "available",
  capabilities: ["implementation"],
  accentColor: "#e8956b",
  initials: "CL",
  lastActiveAt: "2026-07-29T09:00:00.000Z",
};

const DISPATCH_EXECUTION: Execution = {
  id: DISPATCH_EXECUTION_ID,
  taskId: DISPATCH_TASK.id,
  workflowId: null,
  agentId: DISPATCH_AGENT.id,
  status: "succeeded",
  triggerRunId: "run_dispatch",
  startedAt: "2026-07-29T09:00:00.000Z",
  completedAt: "2026-07-29T09:01:00.000Z",
  createdAt: "2026-07-29T09:00:00.000Z",
  attempt: 1,
};

const DISPATCH_EVIDENCE: Evidence[] = Array.from({ length: 8 }, (_, i) => ({
  id: `evd-${i}`,
  executionId: DISPATCH_EXECUTION_ID,
  taskId: DISPATCH_TASK.id,
  kind: "log" as const,
  label: `Evidence ${i}`,
  summary: `Recorded output ${i}.`,
  uri: null,
  createdAt: "2026-07-29T09:01:00.000Z",
  createdByAgentId: DISPATCH_AGENT.id,
}));

const dispatchState = (): DevHqState => ({
  projects: [],
  tasks: [DISPATCH_TASK],
  approvals: [],
  events: [],
  workflows: [],
  executions: [DISPATCH_EXECUTION],
  workflowRuns: [],
  agents: [DISPATCH_AGENT],
  evidence: DISPATCH_EVIDENCE,
  escalations: [],
  reviews: [],
  reviewFindings: [],
  overview: MISSION_CONTROL_PLACEHOLDERS.overview,
  processStart: { id: "proc-fixture", startedAt: "2026-07-29T09:00:00.000Z" },
});

vi.mock("@/lib/mission-control/useDevHqState", () => ({
  useDevHqState: () => ({
    state: dispatchState(),
    status: "live" as const,
    error: null,
    updatedAt: "2026-07-29T09:00:00.000Z",
    consecutiveFailures: 0,
    refresh: async () => {},
    applySnapshot: () => {},
  }),
}));

vi.mock("@/lib/dev-hq/actions", () => ({
  dispatchAgentExecutionAction: async () => ({
    ok: true as const,
    resolved: true as const,
    result: {
      executionId: DISPATCH_EXECUTION_ID,
      assigned: true,
      agentId: DISPATCH_AGENT.id,
      triggerRunId: "run_dispatch",
    },
  }),
}));

const { AgentStatusRail } = await import("@/components/dashboard/AgentStatusRail");
const { AuditTrailPanel } = await import(
  "@/components/mission-control/AuditTrailPanel"
);
const { ActivityStreamPanel } = await import(
  "@/components/mission-control/ActivityStreamPanel"
);
const { ActivityFeed } = await import("@/components/workflow/ActivityFeed");
const { DispatchAgentPanel } = await import(
  "@/components/dashboard/DispatchAgentPanel"
);

beforeEach(() => {
  vi.stubGlobal("crypto", {
    ...globalThis.crypto,
    randomUUID: () => "11111111-2222-3333-4444-555555555555",
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.localStorage.clear();
});

// ---- The five regions --------------------------------------------------------

describe("UI-04 · every scrollable region is keyboard-operable", () => {
  it("Agent status rail", () => {
    const { container } = render(
      <AgentStatusRail statuses={AGENT_STATUSES} provenance="simulated" />,
    );
    expectKeyboardOperable(container, 1);
  });

  it("Evidence & Audit Trail", () => {
    const { container } = render(<AuditTrailPanel records={AUDIT_RECORDS} />);
    expectKeyboardOperable(container, 1);
  });

  it("System activity stream", () => {
    const { container } = render(<ActivityStreamPanel events={EVENTS} />);
    expectKeyboardOperable(container, 1);
  });

  it("Workflow activity feed", () => {
    const { container } = render(<ActivityFeed activity={ACTIVITY} />);
    expectKeyboardOperable(container, 1);
  });

  it("Dispatch panel evidence list", async () => {
    const { container } = render(<DispatchAgentPanel />);

    fireEvent.change(screen.getByRole("combobox", { name: /task/i }), {
      target: { value: DISPATCH_TASK.id },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Dispatch to Agent" }));
    });

    expectKeyboardOperable(container, 1);
  });

  it("names each region so the tab stop is not anonymous", () => {
    const { container } = render(<AuditTrailPanel records={AUDIT_RECORDS} />);
    const [region] = scrollContainers(container);

    // The count is in the name because it is the one thing a keyboard user
    // cannot otherwise discover: the region is a single stop, and how much is
    // inside it is invisible until they scroll.
    expect(accessibleName(region)).toBe("Workflow run audit records, 12 items");
    expect(region.getAttribute("role")).toBe("group");
  });

  it("keeps the list semantics the wrapper could have replaced", () => {
    const { container } = render(<AuditTrailPanel records={AUDIT_RECORDS} />);

    // Putting role/tabindex on the <ul> itself would have overwritten
    // role="list" and cost screen-reader users the item count.
    const list = container.querySelector("ul[role='list']");
    expect(list, "the list role was lost when the region was made focusable").not.toBeNull();
    expect(list?.children.length).toBe(AUDIT_RECORDS.length);
  });
});

// ---- Null arm ----------------------------------------------------------------

describe("NULL ARM: the audit reports the defects it claims to detect", () => {
  it("flags a scroll container that is neither focusable nor holds anything focusable", () => {
    const { container } = render(
      <div className="max-h-[420px] overflow-y-auto">
        <ul>
          <li>Unreachable past the fold</li>
        </ul>
      </div>,
    );

    const problems = keyboardAudit(container);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain(
      "has no tabindex and contains no focusable descendant",
    );
  });

  it("passes a scroll container whose contents are already focusable", () => {
    // The property is keyboard reachability, not the presence of tabIndex. A
    // region a user can tab into anyway needs nothing added, and an audit that
    // demanded tabIndex everywhere would be measuring the wrong thing.
    const { container } = render(
      <div className="max-h-[420px] overflow-y-auto">
        <button type="button">Reachable</button>
      </div>,
    );

    expect(keyboardAudit(container)).toEqual([]);
  });

  it("flags a scroll container with one focusable child whose overflow is still unreachable", () => {
    // P2-37, and the case the audit used to pass. Structurally this is the
    // fixture above with the content it exists to scroll put back: one button
    // at the top, then twenty rows nobody can tab to. Focus can enter the
    // region, so "contains something focusable" is satisfied, and the region is
    // no more scrollable by keyboard than one holding nothing focusable at all.
    const { container } = render(
      <div className="max-h-[420px] overflow-y-auto">
        <button type="button">Reachable</button>
        <ul>
          {Array.from({ length: 20 }, (_, i) => (
            <li key={i}>Row {i} — below the fold, no way to scroll here</li>
          ))}
        </ul>
      </div>,
    );

    const problems = keyboardAudit(container);
    expect(
      problems,
      "one focusable child was accepted as proof the whole overflow is " +
        "reachable, which is the defect this control exists to reject",
    ).toHaveLength(1);
    expect(problems[0]).toContain("1 of its 2 content items");
    expect(problems[0]).toContain(
      "one focusable descendant does not make the rest of the overflow reachable",
    );
  });

  it("flags the rows a partially-focusable list leaves stranded", () => {
    // The same defect at the level it actually occurs: the list rows above the
    // fold carry a control and the ones below it do not.
    const { container } = render(
      <div className="max-h-[420px] overflow-y-auto">
        <ul>
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i}>
              Row {i}
              {i < 3 ? <button type="button">Open {i}</button> : null}
            </li>
          ))}
        </ul>
      </div>,
    );

    const problems = keyboardAudit(container);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toContain("7 of its 10 content items");
  });

  it("NULL ARM: the same list passes once every row is reachable", () => {
    // Identical fixture, identical row count; the only change is that the rows
    // below the fold carry the control too. Without this, "flags stranded rows"
    // would also be satisfied by an audit that rejects every non-tab-stop
    // container, which would make the focusable-descendant path dead code and
    // the claim untestable.
    const { container } = render(
      <div className="max-h-[420px] overflow-y-auto">
        <ul>
          {Array.from({ length: 10 }, (_, i) => (
            <li key={i}>
              Row {i}
              <button type="button">Open {i}</button>
            </li>
          ))}
        </ul>
      </div>,
    );

    expect(keyboardAudit(container)).toEqual([]);
  });

  it("flags a focusable scroll container with no role and no name", () => {
    const { container } = render(
      <div tabIndex={0} className="max-h-[420px] overflow-y-auto">
        <p>Anonymous stop</p>
      </div>,
    );

    const problems = keyboardAudit(container);
    expect(problems).toHaveLength(2);
    expect(problems.join(" ")).toContain("no role");
    expect(problems.join(" ")).toContain("no accessible name");
  });

  it("confirms jsdom really withholds focus from a non-tabbable container", () => {
    // The whole audit rests on focus() being a no-op for an element that is not
    // a focusable area. If jsdom focused everything, the measurement above would
    // be decorative.
    const { container } = render(
      <>
        <div data-testid="bare" className="overflow-y-auto" />
        <div data-testid="tabbable" tabIndex={0} className="overflow-y-auto" />
      </>,
    );

    const bare = screen.getByTestId("bare");
    const tabbable = screen.getByTestId("tabbable");

    bare.focus();
    expect(container.ownerDocument.activeElement).not.toBe(bare);

    tabbable.focus();
    expect(container.ownerDocument.activeElement).toBe(tabbable);
  });
});
