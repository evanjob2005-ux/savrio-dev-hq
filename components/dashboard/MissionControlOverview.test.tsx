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
