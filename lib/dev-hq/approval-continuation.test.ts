// P-2: the decision path's own behaviour, beyond what the P-1 characterization
// files pin.
//
// Covers the split boundary, duplicate and conflicting decisions, the visible
// unconfirmed state, the replay of an unconfirmed continuation, the inverse
// convergence, and store loss. The conflicting-decision case inherits the value
// of the conflicting-completion control that Path B never executed, and is the
// highest-consequence test here: a workflow that acts on two contradictory
// decisions is worse than one that acts on none.

import { beforeEach, describe, expect, it, vi } from "vitest";

interface SdkHooks {
  trigger: (
    id: string,
    payload: unknown,
    options?: { idempotencyKey?: string },
  ) => Promise<unknown>;
}

const { hooks } = vi.hoisted(() => ({ hooks: {} as SdkHooks }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: (
      id: string,
      payload: unknown,
      options?: { idempotencyKey?: string },
    ) => hooks.trigger(id, payload, options),
  },
}));

import { getDevHqAdapters, resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  approveFounderRequest,
  createFounderRequest,
  finalizeWorkflowOutcome,
  getDevHqStateSnapshot,
  registerApprovalGate,
  rejectFounderRequest,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import { FakeTriggerPlatform } from "@/test/fixtures/trigger-platform";

const RUN_ID = "run_split_1f";
const CONTINUATION_TASK_ID = "founder-request-continuation";

let platform: FakeTriggerPlatform;

async function seedAtGate() {
  const created = await createFounderRequest({
    title: "Split workflow request",
    description: "Exercise the approval boundary and the continuation run.",
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  const approval = await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });
  // Run 1 ends here. This is the split.
  platform.completeRun(RUN_ID);
  return { created, approval };
}

/** What the continuation task does when it runs. */
async function runContinuation(payload: unknown) {
  const { executionId, approvalId, decision } = payload as {
    executionId: string;
    approvalId: string;
    decision: "approved" | "rejected";
  };
  return finalizeWorkflowOutcome({
    executionId,
    decision,
    rejectionKind: decision === "rejected" ? "founder" : null,
    approvalId,
  });
}

beforeEach(() => {
  resetDevHqStore();
  resetDevHqAdapters();
  platform = new FakeTriggerPlatform();
  hooks.trigger = async (id, payload, options) =>
    id === CONTINUATION_TASK_ID
      ? platform.triggerContinuation(payload, options)
      : platform.startRun(RUN_ID);
});

describe("the split at the approval boundary", () => {
  it("ends run 1 normally at the gate, with nothing suspended", async () => {
    const { created, approval } = await seedAtGate();

    const run = await getDevHqAdapters().workflowRunRepository.getRun(
      created.execution.id,
    );
    expect(run?.stage).toBe("founder_approval_required");
    expect(approval.status).toBe("pending");

    // Run 1 is terminal and successful. It was not abandoned mid-flight and it
    // holds nothing the founder's decision has to reach.
    expect(platform.statusOf(RUN_ID)).toBe("completed");
    expect(platform.continuations).toHaveLength(0);

    // Nothing about the decision has been asserted yet.
    expect(run?.decision).toBeNull();
    expect(run?.continuation).toBe("not_attempted");
    expect(run?.continuationRunId).toBeNull();
  });

  it("starts the continuation on decision and finalises through it", async () => {
    const { created, approval } = await seedAtGate();

    await approveFounderRequest(approval.id);

    expect(platform.continuations).toHaveLength(1);
    const continuation = platform.continuations[0];
    expect(continuation.idempotencyKey).toBe(
      `founder-continuation-${created.execution.id}`,
    );

    const finalized = await runContinuation(continuation.payload);
    expect(finalized.stage).toBe("completed");
    expect(finalized.decision).toBe("approved");
    expect(finalized.continuation).toBe("confirmed");

    const state = await getDevHqStateSnapshot();
    expect(
      state.approvals.find((a) => a.id === approval.id)?.status,
    ).toBe("approved");
    expect(
      state.executions.find((e) => e.id === created.execution.id)?.status,
    ).toBe("succeeded");
  });

  it("keeps the early-return convergence on an already-completed run", async () => {
    const { created, approval } = await seedAtGate();
    await approveFounderRequest(approval.id);

    const first = await runContinuation(platform.continuations[0].payload);
    expect(first.stage).toBe("completed");

    // A re-delivered finalize callback returns the existing record untouched
    // rather than re-running the outcome.
    const again = await finalizeWorkflowOutcome({
      executionId: created.execution.id,
      decision: "approved",
      approvalId: approval.id,
    });
    expect(again).toEqual(first);

    const state = await getDevHqStateSnapshot();
    expect(
      state.events.filter((e) => e.type === "workflow.completed"),
    ).toHaveLength(1);
    expect(
      state.events.filter((e) => e.type === "approval.approved"),
    ).toHaveLength(1);
  });
});

describe("duplicate and conflicting decisions", () => {
  it("produces exactly one continuation for a duplicate decision", async () => {
    const { approval } = await seedAtGate();

    await approveFounderRequest(approval.id);
    await approveFounderRequest(approval.id);
    await approveFounderRequest(approval.id);

    expect(platform.continuations).toHaveLength(1);
    // Two of the three never reached the provider at all: "exactly one" is a
    // property of the decision path, not something delegated to the platform.
    expect(platform.continuationCalls).toHaveLength(1);

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.decision).toBe("approved");
    expect(stored?.continuation).toBe("confirmed");
  });

  it("produces no second continuation and no decided-both state on a conflict", async () => {
    const { created, approval } = await seedAtGate();

    await approveFounderRequest(approval.id);
    expect(platform.continuations).toHaveLength(1);

    // The contradictory decision.
    await rejectFounderRequest(approval.id);

    // Nothing further was dispatched, and the one continuation that exists still
    // carries the decision it was started for.
    expect(platform.continuations).toHaveLength(1);
    expect(platform.continuationCalls).toHaveLength(1);
    expect(platform.continuations[0].payload).toMatchObject({
      decision: "approved",
    });

    // The record holds one decision, not both.
    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.decision).toBe("approved");
    expect(stored?.status).toBe("pending");

    const state = await getDevHqStateSnapshot();
    const conflict = state.events.find(
      (e) => e.type === "approval.decision_conflicted",
    );
    expect(conflict?.message).toContain("no second continuation");

    // And the conflict is not silently absorbed into the outcome: finalising the
    // continuation that actually ran still produces the approved outcome only.
    await runContinuation(platform.continuations[0].payload);
    const settled = await getDevHqStateSnapshot();
    const settledApproval = settled.approvals.find((a) => a.id === approval.id);
    expect(settledApproval?.status).toBe("approved");
    expect(settledApproval?.decision).toBe("approved");
    expect(
      settled.workflowRuns.find((r) => r.executionId === created.execution.id)
        ?.decision,
    ).toBe("approved");
    expect(
      settled.events.some((e) => e.type === "approval.rejected"),
    ).toBe(false);
  });

  it("refuses a conflicting decision even before any continuation is confirmed", async () => {
    const { approval } = await seedAtGate();

    platform.continuationBehaviour = "throw";
    await approveFounderRequest(approval.id);

    const afterFirst = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(afterFirst?.decision).toBe("approved");
    expect(afterFirst?.continuation).toBe("unconfirmed");

    // An unconfirmed continuation is retryable, but not reversible: a retry of
    // the *other* decision must not be mistaken for a retry.
    await rejectFounderRequest(approval.id);

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.decision).toBe("approved");
    expect(platform.continuationCalls).toHaveLength(1);
  });
});

describe("the unconfirmed continuation state", () => {
  it("is visible when the continuation trigger fails", async () => {
    const { created, approval } = await seedAtGate();

    platform.continuationBehaviour = "throw";
    await approveFounderRequest(approval.id);

    const state = await getDevHqStateSnapshot();
    const stored = state.approvals.find((a) => a.id === approval.id);
    const run = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );

    expect(stored?.decision).toBe("approved");
    expect(stored?.continuation).toBe("unconfirmed");
    expect(run?.continuation).toBe("unconfirmed");
    expect(run?.continuationRunId).toBeNull();

    // Visible on the timeline as an attempt, never as an effect.
    const event = state.events.find(
      (e) => e.type === "approval.decision_recorded",
    );
    expect(event?.message).toContain("unconfirmed");
    expect(event?.message).toContain("not known to have advanced");

    // And it must not read as a completed approval by any route.
    expect(stored?.status).toBe("pending");
    expect(stored?.decidedAt).toBeNull();
    expect(run?.stage).toBe("founder_approval_required");
    expect(state.events.some((e) => e.type === "approval.approved")).toBe(false);
    expect(state.events.some((e) => e.type === "workflow.completed")).toBe(
      false,
    );
  });

  it("is retryable, and the retry still yields exactly one continuation", async () => {
    const { approval } = await seedAtGate();

    platform.continuationBehaviour = "throw";
    await approveFounderRequest(approval.id);
    expect(platform.continuations).toHaveLength(0);

    // This is the case the removed replayDecisionToken existed for: a decision is
    // recorded and the continuation never started. Deciding again retries it.
    platform.continuationBehaviour = "start";
    await approveFounderRequest(approval.id);

    expect(platform.continuations).toHaveLength(1);
    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.continuation).toBe("confirmed");

    // A third call adds nothing.
    await approveFounderRequest(approval.id);
    expect(platform.continuations).toHaveLength(1);
  });

  it("records a typed failure as failed rather than as not knowing", async () => {
    const { created, approval } = await seedAtGate();

    platform.continuationBehaviour = "typed_failure";
    await approveFounderRequest(approval.id);

    const state = await getDevHqStateSnapshot();
    const run = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );
    expect(
      state.approvals.find((a) => a.id === approval.id)?.continuation,
    ).toBe("failed");
    expect(run?.continuation).toBe("failed");
    expect(run?.continuationDetail).toContain("No worker is available");
    expect(
      state.events.find((e) => e.type === "approval.decision_recorded")?.message,
    ).toContain("did not start");
  });
});

describe("inverse convergence", () => {
  it("converges an unconfirmed continuation once the workflow is observed to advance", async () => {
    const { created, approval } = await seedAtGate();

    // The decision is recorded but the trigger tells us nothing. In reality the
    // run may have started anyway — that is exactly what "unconfirmed" means.
    platform.continuationBehaviour = "throw";
    await approveFounderRequest(approval.id);
    expect(
      (await getDevHqAdapters().approvalManager.getApproval(approval.id))
        ?.continuation,
    ).toBe("unconfirmed");

    // It had started. Finalising is the observation that settles it.
    const finalized = await runContinuation({
      executionId: created.execution.id,
      approvalId: approval.id,
      decision: "approved",
    });

    expect(finalized.continuation).toBe("confirmed");
    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.continuation).toBe("confirmed");
    expect(stored?.status).toBe("approved");
  });

  it("converges a decision the approval never recorded, in the other direction", async () => {
    const { created, approval } = await seedAtGate();

    // The workflow advanced without any decision reaching the approval record —
    // the pre-existing forward convergence, restated for the decision field.
    const finalized = await finalizeWorkflowOutcome({
      executionId: created.execution.id,
      decision: "rejected",
      rejectionKind: "founder",
      approvalId: approval.id,
    });
    expect(finalized.decision).toBe("rejected");

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.decision).toBe("rejected");
    expect(stored?.continuation).toBe("confirmed");
    expect(stored?.status).toBe("rejected");
    expect(stored?.decidedAt).not.toBeNull();
  });

  it("leaves a validation rejection's convergence untouched", async () => {
    const created = await createFounderRequest({
      title: "No",
      description: "Too short.",
      priority: "Low",
    });
    const review = await runExecutiveReview(created.execution.id);
    expect(review.passed).toBe(false);
    expect(review.approvalId).toBeNull();

    const state = await getDevHqStateSnapshot();
    const run = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );
    expect(run?.stage).toBe("completed");
    expect(run?.rejectionKind).toBe("validation");
    // No approval exists, so neither convergence had anything to converge, and
    // the continuation dimension is untouched by a path that never had one.
    expect(state.approvals).toHaveLength(0);
    expect(state.events.some((e) => e.type === "approval.rejected")).toBe(false);
  });
});

describe("store loss", () => {
  it("is loud: a decision against a lost approval throws rather than inventing one", async () => {
    const { approval } = await seedAtGate();

    // The store is process-lifetime state. Losing it loses the approval.
    resetDevHqStore();
    resetDevHqAdapters();

    await expect(approveFounderRequest(approval.id)).rejects.toThrow(
      `Approval not found: ${approval.id}`,
    );
    await expect(rejectFounderRequest(approval.id)).rejects.toThrow(
      `Approval not found: ${approval.id}`,
    );

    // And nothing was dispatched on the way to failing.
    expect(platform.continuationCalls).toHaveLength(0);
  });

  it("leaves nothing suspended for a lost store to strand", async () => {
    await seedAtGate();

    // Run 1 is terminal before the store is lost, so there is no suspended run
    // whose only way forward was state that no longer exists. That is the whole
    // point of the split: what is lost is a decision that can be made again, not
    // a run that can never resume.
    expect(platform.statusOf(RUN_ID)).toBe("completed");
    expect(platform.continuations).toHaveLength(0);

    resetDevHqStore();
    resetDevHqAdapters();

    const state = await getDevHqStateSnapshot();
    expect(state.approvals).toHaveLength(0);
    expect(state.workflowRuns).toHaveLength(0);
  });
});
