// P-1 D-1, carried onto the split workflow by P-2.
//
// Setup for both tests: an approval whose run 1 ended at the approval gate and
// was then cancelled by the Development CLI exiting, with the Dev HQ approval
// record intact. That is the V-2 Step 1B condition — a dead run and a live
// approval — and it is reproduced here exactly, because what changed is not
// whether the run can die but what happens when the founder decides afterwards.
//
// The first test is P-1's negative control. It asserts the invariant P-2 had to
// establish and it now passes, so it is an ordinary test rather than an expected
// fail; see the conversion note in the P-2 report. Not one of its assertions was
// relaxed in the process.
//
// The second test replaces P-1's characterization of the defect. The behaviour it
// characterized — a decision reported as complete while the run stayed dead — no
// longer exists to characterize, so what stands in its place is the refutation:
// the same dead run, and the workflow advances correctly anyway.
//
// This file changes no production behaviour and imports no production source it
// does not already exercise through the public service functions.

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

import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  approveFounderRequest,
  createFounderRequest,
  finalizeWorkflowOutcome,
  getDevHqStateSnapshot,
  registerApprovalGate,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";
import {
  DEV_SESSION_ENDED,
  FakeTriggerPlatform,
} from "@/test/fixtures/trigger-platform";

const RUN_ID = "run_terminal_1f";
const CONTINUATION_TASK_ID = "founder-request-continuation";

let platform: FakeTriggerPlatform;

/**
 * Drives the real service path up to the approval gate, ends run 1 the way the
 * split intends, then kills it the way the Development CLI exiting kills it.
 */
async function seedApprovalOnCancelledRun() {
  const created = await createFounderRequest({
    title: "Terminal run approval",
    description:
      "Approval whose Trigger.dev run is cancelled before the founder decides.",
    priority: "High",
  });

  const review = await runExecutiveReview(created.execution.id);
  expect(review.passed).toBe(true);
  expect(review.approvalId).toBeTruthy();

  const approval = await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });

  // Run 1 registers the gate and ends. Nothing is suspended.
  platform.completeRun(RUN_ID);
  // Then the Development CLI goes away and the platform cancels it.
  platform.endDevSession(RUN_ID);

  return { created, approval };
}

describe("approve path against an already-terminal Trigger.dev run", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    platform = new FakeTriggerPlatform();
    hooks.trigger = async (id, payload, options) => {
      if (id === CONTINUATION_TASK_ID) {
        return platform.triggerContinuation(payload, options);
      }
      return platform.startRun(RUN_ID);
    };
  });

  it("P2_TARGET: renders no completed approval while the workflow has not advanced", async () => {
    const { created, approval } = await seedApprovalOnCancelledRun();

    // The continuation cannot be confirmed to have started.
    platform.continuationBehaviour = "no_run_id";

    // Preconditions: approval intact, run dead.
    expect(approval.status).toBe("pending");
    expect(platform.statusOf(RUN_ID)).toBe("cancelled");
    expect(platform.errorOf(RUN_ID)).toBe(DEV_SESSION_ENDED);

    // Design-neutral on purpose. P-2 may refuse by throwing or by returning a
    // non-success state; P-1 asserts the invariant, never the mechanism, so this
    // test does not presuppose R3's design.
    await approveFounderRequest(approval.id).catch(() => undefined);

    const state = await getDevHqStateSnapshot();
    const stored = state.approvals.find((a) => a.id === approval.id);
    const run = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );

    // Established first: the workflow did not advance. Nothing resumed.
    expect(platform.continuations).toHaveLength(0);
    expect(platform.statusOf(RUN_ID)).toBe("cancelled");

    // Therefore nothing may render as a completed approval.
    expect(stored?.status).not.toBe("approved");
    expect(stored?.decidedAt).toBeNull();
    expect(stored?.decidedByUserId).toBeNull();
    expect(
      state.events.some(
        (e) => e.type === "approval.approved" && e.entityId === approval.id,
      ),
    ).toBe(false);
    expect(run?.decision).not.toBe("approved");
    expect(run?.stage).not.toBe("completed");

    // And the state that replaced the false success is visible rather than
    // merely absent: the decision is recorded, the continuation is not confirmed,
    // and both are readable so the condition can be retried and reconciled.
    expect(stored?.decision).toBe("approved");
    expect(stored?.continuation).toBe("unconfirmed");
    expect(run?.continuation).toBe("unconfirmed");
    expect(run?.continuationDetail).toContain("no run id");
    expect(run?.continuationRunId).toBeNull();
  });

  it("advances correctly on the same dead run, which the split makes harmless", async () => {
    const { created, approval } = await seedApprovalOnCancelledRun();

    await approveFounderRequest(approval.id);

    // 1. A continuation run started. It is a new run, not a resumption of the
    //    dead one, which is why the dead one no longer matters.
    expect(platform.continuations).toHaveLength(1);
    expect(platform.continuations[0].payload).toMatchObject({
      executionId: created.execution.id,
      approvalId: approval.id,
      decision: "approved",
    });
    expect(platform.statusOf(RUN_ID)).toBe("cancelled");
    expect(platform.statusOf(platform.continuations[0].runId)).toBe("executing");

    // 2. The decision is recorded and the continuation is confirmed started, but
    //    the approval is not yet complete: starting is not finishing.
    const midflight = await getDevHqStateSnapshot();
    const inProgress = midflight.approvals.find((a) => a.id === approval.id);
    expect(inProgress?.decision).toBe("approved");
    expect(inProgress?.continuation).toBe("confirmed");
    expect(inProgress?.status).toBe("pending");
    expect(inProgress?.decidedAt).toBeNull();

    // 3. The continuation does what the continuation task does: it finalises.
    await finalizeWorkflowOutcome({
      executionId: created.execution.id,
      decision: "approved",
      approvalId: approval.id,
    });

    const state = await getDevHqStateSnapshot();
    const stored = state.approvals.find((a) => a.id === approval.id);
    const run = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );
    const execution = state.executions.find((e) => e.id === created.execution.id);

    // 4. Only now does anything read as a completed approval.
    expect(stored?.status).toBe("approved");
    expect(stored?.decidedAt).not.toBeNull();
    expect(stored?.decidedByUserId).not.toBeNull();
    expect(run?.stage).toBe("completed");
    expect(run?.decision).toBe("approved");
    expect(execution?.status).toBe("succeeded");
    expect(
      state.events.some(
        (e) => e.type === "approval.approved" && e.entityId === approval.id,
      ),
    ).toBe(true);
    expect(state.events.some((e) => e.type === "workflow.completed")).toBe(true);
  });
});
