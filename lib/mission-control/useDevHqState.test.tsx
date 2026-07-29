import { useEffect } from "react";
import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { DevHqState } from "@/lib/dev-hq/types";
import type { Approval } from "@/types/domain";
import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import { useDevHqState, type DevHqStateFeed } from "@/lib/mission-control/useDevHqState";

/**
 * UI-06 and UI-07, which are the same bug seen from two sides: the feed had no
 * single owner, so nothing decided which snapshot won.
 *
 * UI-06 — `useDevHqState()` is called by two sibling components. Each instance
 * ran its own 3s interval, so the page issued two requests per tick and the top
 * and bottom halves could render different snapshots of the same system.
 *
 * UI-07 — a poll that started before the founder pressed Approve could resolve
 * after it and overwrite the fresher post-decision snapshot, putting the
 * approval back in the queue as pending. That is the fixture used below: the
 * stale snapshot carries a pending approval, the fresh one carries none.
 *
 * Rule 2 of STD-CTRL-001 is why each claim here has a paired case from the same
 * starting state. "Stale results are dropped" is satisfied by a store that drops
 * *everything*, and "one request per tick" is satisfied by a loop that has
 * stopped; the null arms are the tests that tell those apart.
 */

const PENDING_APPROVAL: Approval = {
  id: "apr-stale-1",
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
};

function snapshot(label: string, approvals: Approval[]): DevHqState {
  return {
    projects: [],
    tasks: [],
    approvals,
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
    processStart: { id: label, startedAt: "2026-07-29T09:00:00.000Z" },
  };
}

/** What the founder sees before deciding: the approval is still pending. */
const BEFORE_DECISION = snapshot("before-decision", [PENDING_APPROVAL]);
/** What the decision endpoint returns: the approval is gone from the queue. */
const AFTER_DECISION = snapshot("after-decision", []);

/** A second ordinary poll result, for the out-of-order case. */
const LATER_POLL = snapshot("later-poll", []);

// ---- A fetch whose every response is settled by hand ------------------------

interface InFlight {
  /** Resolves this request with the given snapshot. */
  settle: (state: DevHqState) => Promise<void>;
}

let inFlight: InFlight[] = [];
let fetchMock: ReturnType<typeof vi.fn>;

function mockFetch() {
  return vi.fn(
    () =>
      new Promise((resolve) => {
        inFlight.push({
          settle: async (state) => {
            await act(async () => {
              resolve({ ok: true, status: 200, json: async () => state });
              // Let fetchState's two awaits and the resulting render flush.
              await Promise.resolve();
              await Promise.resolve();
            });
          },
        });
      }),
  );
}

// ---- A probe that exposes one consumer's view of the feed -------------------

// Module scope rather than a prop or a ref: React's lint rules forbid mutating
// either during render, and the point of the probe is to capture what a consumer
// saw on the render that just happened.
let seen: (DevHqStateFeed | null)[] = [];

function Probe({ slot }: { slot: number }) {
  const feed = useDevHqState();
  // Recorded in an effect, not during render, because React's lint rules forbid
  // writing to anything outside the component while rendering. Every assertion
  // below runs after an `act()` boundary, which flushes effects, so what is
  // recorded here is always the latest committed render.
  useEffect(() => {
    seen[slot] = feed;
  });
  return null;
}

/** The feed as the consumer in `slot` last saw it. */
const feedAt = (slot: number): DevHqStateFeed => {
  const feed = seen[slot];
  expect(feed, `no consumer rendered in slot ${slot}`).not.toBeNull();
  return feed!;
};

const approvalIds = (slot: number) =>
  (feedAt(slot).state?.approvals ?? []).map((a) => a.id);

beforeEach(() => {
  inFlight = [];
  seen = [];
  fetchMock = mockFetch();
  vi.stubGlobal("fetch", fetchMock);
  vi.useFakeTimers();
});

afterEach(() => {
  // Every consumer is unmounted by the DOM setup's cleanup(), which drops the
  // last subscriber and tears the shared loop down. Rule 3: each case below
  // therefore starts from the same state the store has on a cold page load.
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("UI-06 · one polling loop is shared by every consumer", () => {
  it("issues one request per interval no matter how many components read the feed", async () => {
    render(
      <>
        <Probe slot={0} />
        <Probe slot={1} />
      </>,
    );

    expect(
      fetchMock.mock.calls.length,
      "two consumers mounted and each started its own request; the feed is not shared",
    ).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(9000);
    });

    // Nine seconds is the window the review measured at six requests. One
    // immediate poll plus three ticks is four; per-instance loops give eight.
    expect(
      fetchMock.mock.calls.length,
      `two consumers produced ${fetchMock.mock.calls.length} requests in 9s; ` +
        `one shared 3s loop produces 4 (the immediate poll plus three ticks)`,
    ).toBe(4);
  });

  it("NULL ARM: one consumer over the same window produces the same four requests", async () => {
    // Without this, the case above is also satisfied by a loop that never
    // starts, or by an interval that stopped after the first tick. This fixes
    // the expected count to something checkable by hand.
    render(<Probe slot={0} />);

    expect(fetchMock.mock.calls.length).toBe(1);

    await act(async () => {
      vi.advanceTimersByTime(9000);
    });

    expect(
      fetchMock.mock.calls.length,
      "the shared loop is not polling on its interval at all",
    ).toBe(4);
  });

  it("hands both consumers the identical snapshot object", async () => {
    render(
      <>
        <Probe slot={0} />
        <Probe slot={1} />
      </>,
    );

    await inFlight[0].settle(BEFORE_DECISION);

    expect(feedAt(0).state).not.toBeNull();
    // Reference equality, not deep equality: two loops holding two structurally
    // equal snapshots would pass a deep comparison while still being able to
    // drift apart on the very next tick.
    expect(
      feedAt(0).state,
      "the two consumers are reading from different stores, so the two halves " +
        "of the page can display different snapshots of the same system",
    ).toBe(feedAt(1).state);
  });
});

describe("UI-07 · a stale poll cannot overwrite a fresher snapshot", () => {
  it("keeps the post-decision snapshot when the in-flight poll resolves after it", async () => {
    render(<Probe slot={0} />);

    // The founder's page has loaded, and the approval is pending.
    await inFlight[0].settle(BEFORE_DECISION);
    expect(approvalIds(0)).toEqual([PENDING_APPROVAL.id]);

    // A routine poll leaves. It will carry the pre-decision state.
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(inFlight).toHaveLength(2);

    // While it is in flight the founder approves, and the decision endpoint
    // returns the authoritative post-decision snapshot.
    act(() => {
      feedAt(0).applySnapshot(AFTER_DECISION);
    });
    expect(approvalIds(0)).toEqual([]);

    // Now the older poll comes back.
    await inFlight[1].settle(BEFORE_DECISION);

    expect(
      approvalIds(0),
      "the in-flight poll overwrote the post-decision snapshot, so the " +
        "approval the founder just decided is displayed as pending again",
    ).toEqual([]);
    expect(feedAt(0).state?.processStart.id).toBe("after-decision");
  });

  it("NULL ARM: with no decision in between, that same poll is applied", async () => {
    // Identical starting state and identical poll. The only difference is the
    // absent applySnapshot. If this case also dropped the result, the case
    // above would be measuring a store that ignores its own polls rather than a
    // working freshness guard.
    render(<Probe slot={0} />);

    await inFlight[0].settle(AFTER_DECISION);
    expect(approvalIds(0)).toEqual([]);

    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    expect(inFlight).toHaveLength(2);

    await inFlight[1].settle(BEFORE_DECISION);

    expect(
      approvalIds(0),
      "an ordinary poll result was discarded; the feed has stopped updating",
    ).toEqual([PENDING_APPROVAL.id]);
    expect(feedAt(0).state?.processStart.id).toBe("before-decision");
  });

  it("keeps the newer of two polls that resolve out of order", async () => {
    render(<Probe slot={0} />);

    await inFlight[0].settle(BEFORE_DECISION);

    // Two requests now in flight: the interval tick, then an explicit refresh.
    await act(async () => {
      vi.advanceTimersByTime(3000);
    });
    act(() => {
      void feedAt(0).refresh();
    });
    expect(inFlight).toHaveLength(3);

    // The later request answers first, then the earlier one.
    await inFlight[2].settle(LATER_POLL);
    await inFlight[1].settle(BEFORE_DECISION);

    expect(
      feedAt(0).state?.processStart.id,
      "the earlier request's result was applied after the later one's, so the " +
        "feed went backwards in time",
    ).toBe("later-poll");
  });
});
