// P-1 D-1: the negative control, plus the current-behaviour characterization.
//
// Setup for both: an approval with a wait token attached, whose Trigger.dev run
// is already terminal (cancelled by the Development CLI exiting), with the Dev HQ
// approval record intact. Then the approve path is exercised.
//
// The first test asserts the CORRECT future behaviour and therefore FAILS at this
// commit. It is prefixed P2_TARGET so it is unmistakably a target, not a
// regression. The second test records what the system does today, so the defect
// is documented as executable fact rather than as a code-trace argument.
//
// This file changes no production behaviour and imports no production source it
// does not already exercise through the public service functions.

import { beforeEach, describe, expect, it, vi } from "vitest";

interface SdkHooks {
  trigger: (id: string, payload: unknown) => Promise<{ id: string }>;
  completeToken: (
    tokenId: string,
    payload: unknown,
  ) => Promise<{ success: boolean }>;
}

const { hooks } = vi.hoisted(() => ({ hooks: {} as SdkHooks }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: {
    trigger: (id: string, payload: unknown) => hooks.trigger(id, payload),
  },
  wait: {
    completeToken: (tokenId: string, payload: unknown) =>
      hooks.completeToken(tokenId, payload),
  },
}));

import { resetDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  approveFounderRequest,
  createFounderRequest,
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
const TOKEN_ID = "wait_token_terminal_1f";

let platform: FakeTriggerPlatform;

/**
 * Drives the real service path up to the approval gate, then kills the run the
 * way the Development CLI exiting kills it.
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
    waitTokenId: TOKEN_ID,
  });

  // The run reaches wait.forToken and suspends there.
  platform.suspendAtToken(RUN_ID, TOKEN_ID);
  // Then the Development CLI goes away and the platform cancels it.
  platform.endDevSession(RUN_ID);

  return { created, approval };
}

describe("approve path against an already-terminal Trigger.dev run", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    platform = new FakeTriggerPlatform();
    hooks.trigger = async () => platform.startRun(RUN_ID);
    hooks.completeToken = (tokenId, payload) =>
      platform.completeToken(tokenId, payload);
  });

  // Marked `.fails` deliberately. This asserts the invariant P-2 must establish,
  // and it does not hold at this commit — so the expected outcome today is
  // failure, and Vitest reports it as an expected fail rather than a red suite.
  // If P-2 lands correctly this test will PASS, which makes `.fails` throw
  // "Expect test to fail" and turns the suite red. That is intended: it forces
  // the conversion from `it.fails` to `it` to be a deliberate, reviewed step
  // rather than something that can be forgotten.
  it.fails("P2_TARGET: renders no completed approval while the workflow has not advanced", async () => {
    const { created, approval } = await seedApprovalOnCancelledRun();

    // Preconditions: token attached, approval intact, run dead.
    expect(approval.waitTokenId).toBe(TOKEN_ID);
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
  });

  it("characterizes current behaviour: reports a decision while the run stays dead", async () => {
    const { created, approval } = await seedApprovalOnCancelledRun();

    const state = await approveFounderRequest(approval.id);

    // 1. The token was completed against the dead run, and returned success.
    expect(platform.completeTokenCalls).toHaveLength(1);
    expect(platform.completeTokenCalls[0]).toMatchObject({
      tokenId: TOKEN_ID,
      payload: { approved: true },
      runStatusAtCall: "cancelled",
      result: { success: true },
    });

    // 2. No continuation. The run never resumed, so the workflow never advanced.
    expect(platform.continuations).toHaveLength(0);
    expect(platform.statusOf(RUN_ID)).toBe("cancelled");

    // 3. The approval nonetheless reads approved.
    const stored = state.approvals.find((a) => a.id === approval.id);
    expect(stored?.status).toBe("approved");
    expect(stored?.decidedAt).not.toBeNull();
    expect(stored?.decidedByUserId).not.toBeNull();

    // 4. A timeline event asserts a completed approval to the founder.
    const event = state.events.find(
      (e) => e.type === "approval.approved" && e.entityId === approval.id,
    );
    expect(event?.message).toBe(`Evan approved ${approval.title}.`);
    expect(event?.actorLabel).toBe("Evan");

    // 5. No finalization occurred. The run is still parked at the approval gate,
    //    the execution never completed, and no workflow.completed event exists.
    const run = state.workflowRuns.find(
      (r) => r.executionId === created.execution.id,
    );
    expect(run?.stage).toBe("founder_approval_required");
    expect(run?.decision).toBeNull();

    const execution = state.executions.find(
      (e) => e.id === created.execution.id,
    );
    expect(execution?.status).toBe("running");
    expect(execution?.completedAt).toBeNull();

    expect(state.events.some((e) => e.type === "workflow.completed")).toBe(
      false,
    );
    expect(
      state.events.some((e) => e.type === "founder_request.approved"),
    ).toBe(false);
  });
});
