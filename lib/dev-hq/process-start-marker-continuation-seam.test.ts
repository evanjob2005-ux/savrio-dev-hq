// P-3 Control 3: the P-2/P-3 seam.
//
// P-3 gives the snapshot a process-start marker so a reader can tell "nothing is
// waiting on you" apart from "what you were looking at was destroyed". That
// separation only holds if the marker tracks the store lifetime and nothing
// else. P-2's split workflow is the busiest writer against that store — it
// dispatches a continuation, fails it, retries it, and finalizes it — so it is
// the most likely thing to perturb a lifetime identity that is supposed to be
// inert with respect to ordinary work.
//
// These tests pin that seam from the P-3 side. They assert only the marker
// contract; every P-2 behaviour they touch is stimulus, asserted only where it
// proves the stimulus really happened. Nothing here constrains how P-2 splits
// the workflow, and no P-2 production behaviour is modified to satisfy them.
//
// The lifecycle is driven through the real service, the real internal callback
// routes, and the real store — not a mock standing in for them — because a mock
// of the store would prove nothing about the store's own lifetime identity.

import { beforeEach, describe, expect, it, vi } from "vitest";

interface CapturedTask {
  run?: (payload: {
    executionId: string;
    approvalId: string;
    decision: "approved" | "rejected";
  }) => Promise<unknown>;
  onFailure?: (input: {
    payload: {
      executionId: string;
      approvalId: string;
      decision: "approved" | "rejected";
    };
    error: unknown;
  }) => Promise<void>;
}

const { taskDefinitions, triggerMock } = vi.hoisted(() => ({
  taskDefinitions: new Map<string, CapturedTask>(),
  triggerMock: vi.fn(),
}));

vi.mock("@trigger.dev/sdk", () => {
  const metadata = { set: vi.fn() };
  return {
    metadata,
    task: (definition: CapturedTask & { id: string }) => {
      taskDefinitions.set(definition.id, definition);
      return definition;
    },
    tasks: { trigger: triggerMock },
  };
});

vi.mock("@/lib/dev-hq/internal-guard", () => ({
  DEV_HQ_INTERNAL_TOKEN_HEADER: "x-dev-hq-internal-token",
  rejectInternalDevRequest: () => null,
}));

import { POST as failRoute } from "@/app/api/dev-hq/internal/fail/route";
import { POST as finalizeRoute } from "@/app/api/dev-hq/internal/finalize/route";
import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  approveFounderRequest,
  createFounderRequest,
  getDevHqStateSnapshot,
  registerApprovalGate,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { getDevHqStore, resetDevHqStore } from "@/lib/dev-hq/store";
import type { ProcessStartMarker } from "@/lib/dev-hq/types";
import "@/trigger/founder-request-continuation";

const INITIAL_RUN_ID = "run_seam_initial";
const FIRST_CONTINUATION_RUN_ID = "run_seam_continuation_first";
const RETRY_CONTINUATION_RUN_ID = "run_seam_continuation_retry";
const CONTINUATION_TASK_ID = "founder-request-continuation";

let continuationDispatches = 0;

function continuationCalls() {
  return triggerMock.mock.calls.filter(
    (call) => call[0] === CONTINUATION_TASK_ID,
  );
}

/** The marker as a reader receives it: off the snapshot the service builds. */
async function markerFromSnapshot(): Promise<ProcessStartMarker> {
  return (await getDevHqStateSnapshot()).processStart;
}

/**
 * Asserts the lifetime identity is untouched, from both sides at once: what a
 * reader is served, and what the store itself holds. Checking only the snapshot
 * would miss a mutation that rewrote the store but happened to re-serve the old
 * value; checking only the store would miss a corrupted projection.
 */
async function expectMarkerUnchanged(
  expected: ProcessStartMarker,
  step: string,
): Promise<void> {
  expect(await markerFromSnapshot(), `snapshot marker after ${step}`).toEqual(
    expected,
  );
  expect(getDevHqStore().processStart, `store marker after ${step}`).toEqual(
    expected,
  );
}

/** Drives the founder request to a registered approval gate, as P-2 does. */
async function seedApprovalAtGate() {
  const created = await createFounderRequest({
    title: "Seam control",
    description:
      "A continuation lifecycle run against a live process-start marker.",
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  const approval = await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });
  return { created, approval };
}

beforeEach(() => {
  resetDevHqStore();
  resetDevHqAdapters();
  continuationDispatches = 0;
  triggerMock.mockReset();
  triggerMock.mockImplementation(async (id: string) => {
    if (id !== CONTINUATION_TASK_ID) return { id: INITIAL_RUN_ID };
    continuationDispatches += 1;
    return {
      id:
        continuationDispatches === 1
          ? FIRST_CONTINUATION_RUN_ID
          : RETRY_CONTINUATION_RUN_ID,
    };
  });
  // The continuation runs on the worker and reaches Dev HQ only over the guarded
  // internal callbacks, so the callbacks are routed to the real handlers here.
  vi.spyOn(globalThis, "fetch").mockImplementation(async (input, init) => {
    const url = new URL(
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const route =
      url.pathname === "/api/dev-hq/internal/finalize"
        ? finalizeRoute
        : failRoute;
    return route(
      new Request(`http://dev-hq.test${url.pathname}`, {
        method: "POST",
        headers: init?.headers,
        body: init?.body,
      }),
    );
  });
});

describe("P-2/P-3 seam: continuation activity and the store lifetime", () => {
  it("holds the marker fixed across a full dispatch, failure, retry, and finalize cycle", async () => {
    const original = await markerFromSnapshot();
    expect(original.id).toBeTruthy();

    const { created, approval } = await seedApprovalAtGate();
    await expectMarkerUnchanged(original, "the approval gate opened");

    // Decision dispatches run 2. This is the P-2 split boundary.
    await approveFounderRequest(approval.id);
    expect(continuationCalls()).toHaveLength(1);
    await expectMarkerUnchanged(original, "the continuation was dispatched");

    const continuationTask = taskDefinitions.get(CONTINUATION_TASK_ID);
    expect(continuationTask?.onFailure).toBeTypeOf("function");
    expect(continuationTask?.run).toBeTypeOf("function");
    const firstPayload = continuationCalls()[0][1] as {
      executionId: string;
      approvalId: string;
      decision: "approved";
    };

    // The continuation exhausts its retries and reports failure back over the
    // internal callback, which writes to the store.
    await continuationTask!.onFailure!({
      payload: firstPayload,
      error: new Error("continuation exhausted its retry budget"),
    });
    await expectMarkerUnchanged(original, "the continuation failed terminally");

    // Same-decision retry opens a new continuation generation.
    await approveFounderRequest(approval.id);
    expect(continuationCalls()).toHaveLength(2);
    await expectMarkerUnchanged(original, "the retry was dispatched");

    // The retry finalizes, completing the approval.
    const retryPayload = continuationCalls()[1][1] as {
      executionId: string;
      approvalId: string;
      decision: "approved";
    };
    await continuationTask!.run!(retryPayload);
    await expectMarkerUnchanged(original, "the continuation finalized");

    // The stimulus has to have been real, or the assertions above are vacuous:
    // the workflow genuinely advanced to a completed approval on this store.
    const finalState = await getDevHqStateSnapshot();
    expect(
      finalState.approvals.find((item) => item.id === approval.id)?.status,
    ).toBe("approved");
    expect(
      finalState.workflowRuns.find(
        (item) => item.executionId === created.execution.id,
      )?.stage,
    ).toBe("completed");
    expect(
      finalState.events.filter((event) => event.type === "approval.approved"),
    ).toHaveLength(1);
  });

  it("rotates the marker only when the store lifetime is actually replaced", async () => {
    const original = await markerFromSnapshot();

    const { approval } = await seedApprovalAtGate();
    await approveFounderRequest(approval.id);
    const afterContinuation = await markerFromSnapshot();

    // Continuation work left the lifetime alone...
    expect(afterContinuation).toEqual(original);

    // ...and replacing the lifetime is what moves it. Without this half, a
    // marker that could never change at all would satisfy the test above.
    resetDevHqStore();
    const afterReplacement = await markerFromSnapshot();
    expect(afterReplacement.id).not.toBe(original.id);

    // And the replacement really did discard the continuation's state, so the
    // rotation reports a genuine loss rather than a cosmetic reshuffle.
    const clearedState = await getDevHqStateSnapshot();
    expect(clearedState.approvals).toHaveLength(0);
    expect(clearedState.workflowRuns).toHaveLength(0);
  });

  it("ignores a marker supplied on a continuation callback payload", async () => {
    const original = await markerFromSnapshot();
    const { created, approval } = await seedApprovalAtGate();
    await approveFounderRequest(approval.id);

    const forged: ProcessStartMarker = {
      id: "forged-by-continuation",
      startedAt: "1999-01-01T00:00:00.000Z",
    };

    // A worker that sent a marker of its own alongside a legitimate finalize
    // must not be able to author the lifetime identity. The callback is the only
    // channel the continuation has into Dev HQ state, so it is the only place
    // this could be attempted.
    const response = await finalizeRoute(
      new Request("http://dev-hq.test/api/dev-hq/internal/finalize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          executionId: created.execution.id,
          decision: "approved",
          rejectionKind: null,
          approvalId: approval.id,
          processStart: forged,
        }),
      }),
    );
    expect(response.status).toBe(200);

    // The finalize was honoured — so the forged field rode in on a request that
    // the system actually acted upon, not one it discarded wholesale.
    const state = await getDevHqStateSnapshot();
    expect(
      state.approvals.find((item) => item.id === approval.id)?.status,
    ).toBe("approved");

    // The lifetime identity is still the server's own.
    expect(state.processStart).toEqual(original);
    expect(getDevHqStore().processStart).toEqual(original);
    expect(state.processStart.id).not.toBe(forged.id);
  });
});
