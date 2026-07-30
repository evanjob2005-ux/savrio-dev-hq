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
  /** Resolves this request with a non-OK response, which `fetchState` throws on. */
  fail: (status?: number) => Promise<void>;
}

let inFlight: InFlight[] = [];
let fetchMock: ReturnType<typeof vi.fn>;

function mockFetch() {
  return vi.fn(
    () =>
      new Promise((resolve) => {
        const deliver = async (response: unknown) => {
          await act(async () => {
            resolve(response);
            // Let fetchState's two awaits and the resulting render flush.
            await Promise.resolve();
            await Promise.resolve();
          });
        };
        inFlight.push({
          settle: (state) =>
            deliver({ ok: true, status: 200, json: async () => state }),
          fail: (status = 503) =>
            deliver({ ok: false, status, json: async () => ({}) }),
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

describe("P1-23 · a stale failure cannot downgrade a newer successful state", () => {
  /**
   * Puts `count` requests in flight from a cold store, so every case below
   * starts from the identical state (rule 3) and the arms differ only in which
   * sequence carries the success and which carries the failure.
   */
  async function inFlightRequests(count: number) {
    render(<Probe slot={0} />);
    for (let i = 1; i < count; i += 1) {
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
    }
    expect(
      inFlight,
      `expected ${count} requests in flight; the shared loop is not polling`,
    ).toHaveLength(count);
  }

  it("keeps the feed live when a request older than the last success fails", async () => {
    await inFlightRequests(3);

    // The newest request answers first, and the feed is current.
    await inFlight[2].settle(LATER_POLL);
    expect(feedAt(0).status).toBe("live");

    // The oldest one now fails. It left before the snapshot on screen was even
    // requested, so it is not evidence about the connection as it stands.
    await inFlight[0].fail();

    expect(
      feedAt(0).status,
      "a failure from a request that predates the displayed snapshot flipped " +
        "the feed to degraded, so current data is labelled untrustworthy",
    ).toBe("live");
    expect(feedAt(0).consecutiveFailures).toBe(0);
    expect(feedAt(0).error).toBeNull();
    expect(feedAt(0).state?.processStart.id).toBe("later-poll");
  });

  it("NULL ARM: the same failure, when it is the newest report, does degrade", async () => {
    // Identical starting state — three requests in flight — and the same one
    // success and one failure. Only the order is swapped. Without this arm, a
    // store that ignored every failure would pass the case above.
    await inFlightRequests(3);

    await inFlight[0].settle(LATER_POLL);
    expect(feedAt(0).status).toBe("live");

    await inFlight[2].fail();

    expect(
      feedAt(0).status,
      "a failure newer than every success was ignored, so the feed no longer " +
        "reports staleness at all",
    ).toBe("degraded");
    expect(feedAt(0).consecutiveFailures).toBe(1);
    expect(feedAt(0).error).toContain("503");
  });

  it("does not report disconnected on three failures that all predate the snapshot", async () => {
    await inFlightRequests(4);

    await inFlight[3].settle(LATER_POLL);

    await inFlight[0].fail();
    await inFlight[1].fail();
    await inFlight[2].fail();

    expect(
      feedAt(0).status,
      "three superseded failures reported the feed as disconnected while it " +
        "was displaying a snapshot that arrived after all three of them left",
    ).toBe("live");
    expect(feedAt(0).consecutiveFailures).toBe(0);
  });

  it("NULL ARM: three failures that do supersede the snapshot still reach disconnected", async () => {
    // Same four requests, same three failures, same single success. The
    // disconnected threshold must still be reachable, or the case above is
    // satisfied by a feed that can never report a lost connection.
    await inFlightRequests(4);

    await inFlight[0].settle(LATER_POLL);

    await inFlight[1].fail();
    await inFlight[2].fail();
    await inFlight[3].fail();

    expect(
      feedAt(0).status,
      "the feed can no longer report a genuinely lost connection",
    ).toBe("disconnected");
    expect(feedAt(0).consecutiveFailures).toBe(3);
  });

  it("still applies a late success that is older than a failure, without clearing the failure", async () => {
    // Why failure accounting has its own high-water mark rather than reusing
    // the snapshot one: a failure must not make a late success get discarded.
    // That success carries data older than the failed request but newer than
    // anything on screen, and dropping it would lose the only state we have.
    await inFlightRequests(3);

    await inFlight[0].settle(BEFORE_DECISION);
    await inFlight[2].fail();
    expect(feedAt(0).status).toBe("degraded");

    await inFlight[1].settle(AFTER_DECISION);

    expect(
      feedAt(0).state?.processStart.id,
      "a success newer than the displayed snapshot was thrown away because an " +
        "unrelated request had failed, so the feed stopped updating",
    ).toBe("after-decision");
    expect(
      feedAt(0).status,
      "a superseded success cleared a failure that is still the most recent " +
        "thing this feed knows, so staleness was hidden",
    ).toBe("degraded");
    expect(feedAt(0).consecutiveFailures).toBe(1);
  });

  it("NULL ARM: with no failure outstanding, that same late success reports live", async () => {
    await inFlightRequests(3);

    await inFlight[0].settle(BEFORE_DECISION);
    await inFlight[1].settle(AFTER_DECISION);

    expect(feedAt(0).state?.processStart.id).toBe("after-decision");
    expect(
      feedAt(0).status,
      "the feed is stuck reporting degraded with nothing failing",
    ).toBe("live");
    expect(feedAt(0).consecutiveFailures).toBe(0);
  });

  it("does not degrade the founder's own post-decision snapshot with an older poll failure", async () => {
    await inFlightRequests(2);

    await inFlight[0].settle(BEFORE_DECISION);

    // The founder approves; the decision endpoint returns the authoritative
    // snapshot over the same connection.
    act(() => {
      feedAt(0).applySnapshot(AFTER_DECISION);
    });
    expect(feedAt(0).status).toBe("live");

    // The poll that was already in flight now fails.
    await inFlight[1].fail();

    expect(
      feedAt(0).status,
      "a poll that predates the founder's decision failed and degraded the " +
        "snapshot that decision returned",
    ).toBe("live");
    expect(feedAt(0).consecutiveFailures).toBe(0);
  });

  it("NULL ARM: without the decision in between, that same poll failure degrades", async () => {
    await inFlightRequests(2);

    await inFlight[0].settle(BEFORE_DECISION);

    await inFlight[1].fail();

    expect(
      feedAt(0).status,
      "applySnapshot is suppressing every subsequent failure, not just the " +
        "ones it supersedes",
    ).toBe("degraded");
    expect(feedAt(0).consecutiveFailures).toBe(1);
  });

  // F-6. The same rule, one call site along.
  //
  // P1-23 stopped a superseded *failure* from degrading a newer snapshot, but
  // `applyMutationSnapshot` still carried an already-accumulated failure count
  // forward, on the ground that it was "earned by evidence that is still the
  // most recent this feed has". It is not: the mutation snapshot came back over
  // the same connection and is strictly newer than every failure that preceded
  // it — which is exactly what the line above it records by advancing
  // `lastResultSequence`. So the founder pressed Approve, the authoritative
  // snapshot came straight back, and it was labelled `degraded` beside data that
  // had just arrived.

  describe("F-6 · a mutation snapshot clears failures it supersedes", () => {
    it("reports live when the founder's own snapshot arrives after a failure", async () => {
      await inFlightRequests(1);

      await inFlight[0].fail();
      expect(
        feedAt(0).status,
        "setup did not reach the degraded state this case starts from",
      ).toBe("degraded");
      expect(feedAt(0).consecutiveFailures).toBe(1);

      // The founder approves. The decision endpoint answers over the same
      // connection the poll just failed on, which is what proves the connection
      // works now.
      act(() => {
        feedAt(0).applySnapshot(AFTER_DECISION);
      });

      expect(
        feedAt(0).state?.processStart.id,
        "the founder's own post-decision snapshot was not applied",
      ).toBe("after-decision");
      expect(
        feedAt(0).status,
        "the snapshot the founder's decision returned is labelled `degraded` " +
          "on the strength of a poll that failed BEFORE it. That failure was " +
          "superseded by this very response — the line that advances " +
          "`lastResultSequence` says so — and the label tells the founder their " +
          "current data cannot be trusted",
      ).toBe("live");
      expect(feedAt(0).consecutiveFailures).toBe(0);
      expect(feedAt(0).error).toBeNull();
    });

    it("reports live rather than disconnected after three failures the snapshot supersedes", async () => {
      await inFlightRequests(3);

      await inFlight[0].fail();
      await inFlight[1].fail();
      await inFlight[2].fail();
      expect(feedAt(0).status).toBe("disconnected");

      act(() => {
        feedAt(0).applySnapshot(AFTER_DECISION);
      });

      expect(
        feedAt(0).status,
        "the feed claims the connection is LOST while displaying a snapshot " +
          "that arrived over it moments ago",
      ).toBe("live");
      expect(feedAt(0).consecutiveFailures).toBe(0);
    });

    it("NULL ARM: a failure newer than the mutation snapshot still degrades it", async () => {
      // Identical starting state — one request in flight, one failure — and the
      // same applySnapshot. Only the order is swapped, so the failure is the
      // newer report. Without this, clearing the count unconditionally would
      // satisfy both cases above by making applySnapshot a permanent mute.
      await inFlightRequests(1);

      await inFlight[0].fail();
      act(() => {
        feedAt(0).applySnapshot(AFTER_DECISION);
      });

      // A poll that departs after the snapshot, and fails.
      await act(async () => {
        vi.advanceTimersByTime(3000);
      });
      await inFlight[1].fail();

      // Deliberately asserts the verdict and not the count. The count is what
      // the paired case above changes, so pinning it here would make this arm
      // fail for the same reason that one does, and it would stop being a
      // control. What must hold either way is that a genuinely newer failure
      // still reaches the founder.
      expect(
        feedAt(0).status,
        "a failure that is genuinely newer than the founder's snapshot was " +
          "swallowed, so the feed no longer reports staleness at all after any " +
          "mutation",
      ).toBe("degraded");
      expect(feedAt(0).consecutiveFailures).toBeGreaterThanOrEqual(1);
      expect(feedAt(0).error).toContain("503");
    });

    it("NULL ARM: a late poll success older than a failure still leaves it standing", async () => {
      // The other control, and the one that pins *why* applySnapshot may clear
      // and an ordinary success may not. A poll that departed before the failure
      // carries no evidence that the connection recovered, so its late success
      // must not clear the count — only a report that supersedes the failure
      // may. Same store, same single failure.
      await inFlightRequests(3);

      await inFlight[0].settle(BEFORE_DECISION);
      await inFlight[2].fail();
      expect(feedAt(0).status).toBe("degraded");

      await inFlight[1].settle(AFTER_DECISION);

      expect(
        feedAt(0).status,
        "clearing failures has leaked from applySnapshot into the ordinary " +
          "poll path, where a superseded success now hides real staleness",
      ).toBe("degraded");
      expect(feedAt(0).consecutiveFailures).toBe(1);
    });
  });
});
