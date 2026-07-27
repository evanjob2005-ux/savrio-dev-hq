// P-1 D-3, inverted by P-2.
//
// P-1 pinned the old ordering — token completion attempted BEFORE the decision
// was recorded — so that inverting it would be an explicit, visible change rather
// than a silent one. This is that inversion, pinned the same way: the decision is
// recorded first, then the continuation is attempted, then what the attempt
// established is recorded.
//
// It also pins what the ordering does and does not buy, which is the part P-1 was
// really testing. The old comment argued the ordering was safe because a failed
// completion left the approval pending; that premise held only when the provider
// call THREW, and the failure that mattered did not throw. Both branches are
// still recorded here, against the new ordering, so the boundary of the new
// argument is executable too — and the new argument is different in kind: safety
// comes from the continuation field being able to represent "decided but not
// advanced", not from the order of two writes.

import fs from "node:fs";
import path from "node:path";
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
  registerApprovalGate,
  runExecutiveReview,
} from "@/lib/dev-hq/founder-request-service";
import { resetDevHqStore } from "@/lib/dev-hq/store";

const ROOT = path.resolve(__dirname, "../..");
const SERVICE = "lib/dev-hq/founder-request-service.ts";
const CONTINUATION_TASK_ID = "founder-request-continuation";

async function seedPendingApproval() {
  const created = await createFounderRequest({
    title: "Ordering under test",
    description: "Pin the order of decision recording and continuation.",
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  const approval = await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
  });
  return { created, approval };
}

describe("decision-path ordering", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    hooks.trigger = async (id) =>
      id === CONTINUATION_TASK_ID
        ? { id: "run_continuation_ordering" }
        : { id: "run_ordering_1f" };
  });

  it("records the decision before attempting the continuation, and the outcome after", async () => {
    const { approval } = await seedPendingApproval();

    const order: string[] = [];
    hooks.trigger = async (id) => {
      if (id === CONTINUATION_TASK_ID) {
        order.push("tasks.trigger(continuation)");
        return { id: "run_continuation_ordering" };
      }
      return { id: "run_ordering_1f" };
    };

    const manager = getDevHqAdapters().approvalManager;
    const originalIntent = manager.recordDecisionIntent.bind(manager);
    vi.spyOn(manager, "recordDecisionIntent").mockImplementation(async (input) => {
      order.push("approvalManager.recordDecisionIntent");
      return originalIntent(input);
    });
    const originalContinuation = manager.recordContinuation.bind(manager);
    vi.spyOn(manager, "recordContinuation").mockImplementation(async (input) => {
      order.push("approvalManager.recordContinuation");
      return originalContinuation(input);
    });

    await approveFounderRequest(approval.id);

    expect(order).toEqual([
      "approvalManager.recordDecisionIntent",
      "tasks.trigger(continuation)",
      "approvalManager.recordContinuation",
    ]);
  });

  it("pins the ordering in source", () => {
    const source = fs.readFileSync(path.join(ROOT, SERVICE), "utf8");
    const region = source.slice(source.indexOf("async function decideFounderRequest"));
    expect(region).not.toBe("");

    expect(region).toContain("recordDecisionIntent");
    expect(region).toContain("attemptContinuation");
    expect(region).toContain("recordContinuation");
    expect(region.indexOf("recordDecisionIntent")).toBeLessThan(
      region.indexOf("attemptContinuation"),
    );
    expect(region.indexOf("attemptContinuation")).toBeLessThan(
      region.indexOf("recordContinuation"),
    );

    // The superseded ordering and the argument for it must not survive anywhere
    // in the file, or the source would carry two contradictory contracts.
    expect(source).not.toContain(
      "Complete the token before recording the decision.",
    );
  });

  it("records the decision and a failed continuation when the provider returns a typed failure", async () => {
    const { approval } = await seedPendingApproval();

    hooks.trigger = async (id) =>
      id === CONTINUATION_TASK_ID
        ? { ok: false, error: "No worker is available." }
        : { id: "run_ordering_1f" };

    await approveFounderRequest(approval.id);

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    // The decision is kept — the founder did decide, and discarding that would
    // lose the only record of it — but nothing claims the workflow advanced.
    expect(stored?.decision).toBe("approved");
    expect(stored?.continuation).toBe("failed");
    expect(stored?.status).toBe("pending");
    expect(stored?.decidedAt).toBeNull();
  });

  it("records the decision and an unconfirmed continuation when the attempt throws", async () => {
    const { approval } = await seedPendingApproval();

    hooks.trigger = async (id) => {
      if (id === CONTINUATION_TASK_ID) {
        throw new Error("continuation dispatch failed");
      }
      return { id: "run_ordering_1f" };
    };

    // The old ordering rejected here, which read as protection but only ever
    // engaged on a throw. The new path does not reject: it records what it knows,
    // which is that a decision exists and nothing about it is confirmed.
    await approveFounderRequest(approval.id);

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.decision).toBe("approved");
    expect(stored?.continuation).toBe("unconfirmed");
    expect(stored?.status).toBe("pending");
    expect(stored?.decidedAt).toBeNull();
  });

  it("does not record a completed approval when the attempt merely returns — the premise that used to fail", async () => {
    const { approval } = await seedPendingApproval();

    // The false-success case, translated. A provider call that returns without
    // throwing is exactly what defeated the old design; here it establishes
    // nothing on its own, because only a run id counts as a confirmed start and
    // only finalising counts as a completed approval.
    hooks.trigger = async (id) =>
      id === CONTINUATION_TASK_ID ? { success: true } : { id: "run_ordering_1f" };

    await approveFounderRequest(approval.id);

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.status).toBe("pending");
    expect(stored?.decidedAt).toBeNull();
    expect(stored?.continuation).toBe("unconfirmed");
  });
});
