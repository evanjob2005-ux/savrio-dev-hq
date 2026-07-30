import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DevHqState } from "@/lib/dev-hq/types";
import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";

/**
 * The second half of UI-01.
 *
 * `ApprovalQueuePanel.test.tsx` proves the buttons reach the right callbacks.
 * That still leaves the callbacks themselves: `onApprove` is wired to the
 * string `"approve"` and `onReject` to `"reject"`, and those two strings become
 * the URL that is POSTed. Exchange them and the panel is blameless while the
 * Founder's approval is delivered to the reject endpoint.
 *
 * So this asserts the property that actually matters -- which endpoint receives
 * the request -- rather than which function was called.
 */

const APPROVAL_ID = "apr-endpoint-1";

const stateWithPendingApproval = (): DevHqState => ({
  projects: [
    {
      id: "prj-1",
      name: "Dev HQ",
      slug: "dev-hq",
      description: "Fixture project.",
      repository: "savrio-dev-hq",
      defaultBranch: "main",
      status: "active",
      ownerId: "usr-founder",
      createdAt: "2026-07-29T09:00:00.000Z",
      updatedAt: "2026-07-29T09:00:00.000Z",
    },
  ],
  tasks: [
    {
      id: "tsk-1",
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
    },
  ],
  approvals: [
    {
      id: APPROVAL_ID,
      taskId: "tsk-1",
      executionId: "exe-1",
      title: "Ship the onboarding revision",
      summary: "Validation passed; awaiting the Founder decision.",
      status: "pending",
      requestedByAgentId: "agent-executive-orchestrator",
      decidedByUserId: null,
      requestedAt: "2026-07-29T09:00:00.000Z",
      decidedAt: null,
      decision: null,
      continuation: "not_attempted",
    },
  ],
  events: [],
  workflows: [],
  executions: [],
  workflowRuns: [
    {
      executionId: "exe-1",
      taskId: "tsk-1",
      projectId: "prj-1",
      workflowId: "wf-1",
      stage: "founder_approval_required",
      triggerRunId: null,
      continuationRunId: null,
      runLineage: [],
      reviewSummary: null,
      decision: null,
      continuation: "not_attempted",
      continuationDetail: null,
      rejectionKind: null,
      updatedAt: "2026-07-29T09:00:00.000Z",
    },
  ],
  agents: [],
  evidence: [],
  escalations: [],
  reviews: [],
  reviewFindings: [],
  overview: MISSION_CONTROL_PLACEHOLDERS.overview,
  processStart: {
    id: "proc-fixture",
    startedAt: "2026-07-29T09:00:00.000Z",
  },
});

// The feed is replaced wholesale: this suite is about what the decision
// handlers do, and a live 3s polling loop would only add flake.
const applySnapshot = vi.fn();
const refresh = vi.fn(async () => {});

vi.mock("@/lib/mission-control/useDevHqState", () => ({
  useDevHqState: () => ({
    state: stateWithPendingApproval(),
    status: "live" as const,
    error: null,
    updatedAt: "2026-07-29T09:00:00.000Z",
    consecutiveFailures: 0,
    refresh,
    applySnapshot,
  }),
}));

const { MissionControlOverview } = await import(
  "@/components/dashboard/MissionControlOverview"
);

let fetchMock: ReturnType<typeof vi.fn>;

beforeEach(() => {
  fetchMock = vi.fn(async () => ({
    ok: true,
    status: 200,
    json: async () => ({ state: stateWithPendingApproval() }),
  }));
  vi.stubGlobal("fetch", fetchMock);
  // MissionControlOverview moves focus in a rAF callback after each decision.
  vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
    cb(0);
    return 0;
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

const postedPaths = () =>
  fetchMock.mock.calls
    .filter(([, init]) => (init as RequestInit | undefined)?.method === "POST")
    .map(([url]) => String(url));

describe("MissionControlOverview decision endpoints", () => {
  it("POSTs Approve to the approve endpoint", async () => {
    render(<MissionControlOverview />);

    fireEvent.click(screen.getByRole("button", { name: "Approve" }));

    await waitFor(() => expect(postedPaths()).toHaveLength(1));
    expect(postedPaths()[0]).toBe(
      `/api/dev-hq/approvals/${APPROVAL_ID}/approve`,
    );
    // Named explicitly: the failure this test exists to prevent is the request
    // arriving at the opposite endpoint, not merely at an unexpected one.
    expect(postedPaths()[0]).not.toContain("/reject");
  });

  it("POSTs Reject to the reject endpoint", async () => {
    render(<MissionControlOverview />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    await waitFor(() => expect(postedPaths()).toHaveLength(1));
    expect(postedPaths()[0]).toBe(
      `/api/dev-hq/approvals/${APPROVAL_ID}/reject`,
    );
    expect(postedPaths()[0]).not.toContain("/approve");
  });

  it("announces the decision it actually sent", async () => {
    const { container } = render(<MissionControlOverview />);

    fireEvent.click(screen.getByRole("button", { name: "Reject" }));

    // The screen-reader announcement is derived from the same `action` value as
    // the URL, so a swap would tell the Founder their rejection was an
    // approval. Asserted so the confirmation cannot drift from the request.
    const liveRegion = container.querySelector(
      '[aria-live="polite"][aria-atomic="true"]',
    );
    await waitFor(() =>
      expect(liveRegion?.textContent ?? "").toContain("rejected"),
    );
    expect(liveRegion?.textContent ?? "").not.toContain("approved");
  });
});

/**
 * P2-35 — WCAG 2.4.3 (Focus Order) for the failure path.
 *
 * The decision handler moved focus to the approvals wrapper in a `finally`, so
 * it ran whether or not anything was decided. On success that is right: the
 * buttons are gone and focus has nowhere to be. On failure nothing was decided,
 * the button is still there and still the only thing the founder can do, and
 * they were moved off it onto a `tabIndex={-1}` container — from which
 * retrying means tabbing forward through the whole panel to reach a control
 * that never moved.
 *
 * Measured rather than asserted: the button is focused first (which is the state
 * a keyboard user is necessarily in when they activate it), and
 * `document.activeElement` is read back after the request settles.
 *
 * THE JSDOM GAP, AND WHY THE FIXTURE DRIVES THE BLUR ITSELF
 *
 * The defect is only reachable because focus is LOST first. Pressing Approve
 * puts the button into its busy state; a disabled button is not a focusable
 * area, and HTML's focus fixup rule requires a user agent whose focused area
 * stops being focusable to move focus off it — in practice to the body.
 * The fix in `MissionControlOverview` exists to put the founder back, and its
 * own comment says as much: without it "the user would be left wherever the
 * blur dropped them".
 *
 * That rule is an external fact about browsers, not something this file can
 * prove; what it can do is stop pretending the property is being observed when
 * it is not. Only an e2e in a real engine verifies the drop itself.
 *
 * jsdom does not implement that step. Focus therefore never leaves the button,
 * `document.activeElement` reads back as the button whatever the component
 * does, and an activeElement assertion on its own is satisfied by a component
 * with no focus handling at all. That was measured, not assumed: deleting the
 * restore line and running this file left all five tests green.
 *
 * So the fixture performs the unfocus explicitly, at the exact moment the
 * browser would — after the press, once the button is confirmed disabled. The
 * assertions then measure the property a founder actually experiences (where
 * focus ends up) rather than a proxy for it (that some function was called),
 * and both preconditions are asserted so the simulation cannot silently stop
 * reproducing the browser and quietly hollow the test out again.
 */
/**
 * Reproduce the step of the focusing model jsdom does not implement: a browser
 * unfocuses an element at the moment it becomes disabled.
 *
 * jsdom omits the same step twice over. It never drops focus on disable, and
 * `HTMLElement.blur()` returns early unless the element is still a focusable
 * area — which a disabled button is not — so once React has committed the
 * `disabled` attribute there is no public API left that can move focus off it.
 * The attribute is therefore lifted for the duration of the single `blur()`
 * call and put straight back, with no commit in between, so the DOM React owns
 * is byte-identical before and after and only the focus position changes.
 */
function dropFocusAsBrowserWouldOnDisable(el: HTMLElement): void {
  el.removeAttribute("disabled");
  el.blur();
  el.setAttribute("disabled", "");
}

describe("P2-35 · a failed decision leaves focus on the control that can retry", () => {
  const failingFetch = () =>
    vi.fn(async () => ({
      ok: false,
      status: 503,
      json: async () => ({ error: "Approval service is unavailable." }),
    }));

  /**
   * Renders, puts focus on Approve, presses it, and reproduces the browser's
   * unfocus-on-disable. Identical in both arms.
   *
   * Also counts every time the approvals wrapper takes focus, because "focus
   * ends on the button" is satisfied by a handler that moves focus to the
   * wrapper and then back — which the founder's screen reader announces as a
   * group they never asked for before returning them to where they already
   * were.
   */
  const pressApproveWithFocus = () => {
    const { container } = render(<MissionControlOverview />);
    const region = container.querySelector<HTMLElement>(
      '[aria-label="Founder approval gates"]',
    );
    expect(region, "the approvals wrapper is not in the tree").not.toBeNull();
    let regionFocusCount = 0;
    region!.addEventListener("focus", () => {
      regionFocusCount += 1;
    });

    const approve = screen.getByRole("button", { name: "Approve" });
    approve.focus();
    expect(document.activeElement, "the fixture never had focus on the button").toBe(
      approve,
    );
    fireEvent.click(approve);

    // The browser's unfocus-on-disable, which jsdom omits. The precondition is
    // asserted rather than assumed: if the press ever stops disabling the
    // button, or the request has already settled by this point, the drop would
    // be simulated at the wrong moment and every assertion downstream would be
    // measuring nothing. That must fail loudly here instead.
    expect(
      approve.hasAttribute("disabled"),
      "the pressed button is not disabled at this point, so the fixture is no " +
        "longer reproducing the browser's focus drop at the moment it happens",
    ).toBe(true);
    dropFocusAsBrowserWouldOnDisable(approve);
    expect(
      document.activeElement,
      "the simulated focus drop did not take, so focus never left the button " +
        "and the assertions below cannot observe whether it is restored",
    ).not.toBe(approve);
    expect(
      approve.hasAttribute("disabled"),
      "the fixture left the button in a state React did not put it in",
    ).toBe(true);

    return { approve, regionFocuses: () => regionFocusCount };
  };

  it("keeps focus on Approve when the request fails", async () => {
    vi.stubGlobal("fetch", failingFetch());

    const { approve, regionFocuses } = pressApproveWithFocus();

    // The failure has been handled once the button is out of its busy state.
    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: "Approve" }).getAttribute("aria-busy"),
      ).toBe("false"),
    );
    expect(
      approve.hasAttribute("disabled"),
      "the button is still disabled, so this is measuring focus mid-request",
    ).toBe(false);

    expect(
      document.activeElement,
      `focus ended on <${(document.activeElement as HTMLElement | null)?.tagName.toLowerCase()} ` +
        `aria-label="${document.activeElement?.getAttribute("aria-label") ?? ""}">, ` +
        "not on the still-actionable Approve button the founder needs to retry. " +
        "Pressing the button disabled it, which drops focus in every browser; " +
        "nothing decided, so the button is still there and still the only thing " +
        "the founder can do, and they have been left wherever the drop put them",
    ).toBe(approve);
    expect(
      regionFocuses(),
      "focus was pushed onto the approvals wrapper and pulled back, so the " +
        "founder is announced into a group they never left",
    ).toBe(0);
  });

  it("NULL ARM: on success, focus does move to the approvals region", async () => {
    // Identical starting state, identical keystroke and identical simulated
    // focus drop; only the response differs. Without this, "focus is back on the
    // button" would also be satisfied by restoring it unconditionally — which
    // after a decision that landed would put the founder on a button that is
    // about to be removed, or on a stale "Retry approval" for work already done.
    const { approve, regionFocuses } = pressApproveWithFocus();

    await waitFor(() =>
      expect(document.activeElement?.getAttribute("aria-label")).toBe(
        "Founder approval gates",
      ),
    );
    expect(
      document.activeElement,
      "focus was returned to the pressed button after a decision that landed",
    ).not.toBe(approve);
    expect(regionFocuses()).toBe(1);
  });
});
