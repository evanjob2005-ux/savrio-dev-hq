// P-1 D-3: pins the approve path's ordering — token completion is attempted
// BEFORE the decision is recorded — at founder-request-service.ts:486-496.
//
// P-2 will invert this ordering. The test exists so that inversion is an explicit,
// visible change rather than a silent one.
//
// It also pins what the ordering does and does not buy. The comment at :486-489
// argues the ordering is safe because a failed completion leaves the approval
// pending. That premise holds only when wait.completeToken THROWS. Both branches
// are recorded here so the boundary of the argument is executable.

import fs from "node:fs";
import path from "node:path";
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
const TOKEN_ID = "wait_token_ordering";

async function seedPendingApproval() {
  const created = await createFounderRequest({
    title: "Ordering under test",
    description: "Pin the order of token completion and decision recording.",
    priority: "High",
  });
  const review = await runExecutiveReview(created.execution.id);
  const approval = await registerApprovalGate({
    executionId: created.execution.id,
    approvalId: review.approvalId!,
    waitTokenId: TOKEN_ID,
  });
  return { created, approval };
}

describe("approve-path ordering", () => {
  beforeEach(() => {
    resetDevHqStore();
    resetDevHqAdapters();
    hooks.trigger = async () => ({ id: "run_ordering_1f" });
    hooks.completeToken = async () => ({ success: true });
  });

  it("attempts token completion before recording the decision", async () => {
    const { approval } = await seedPendingApproval();

    const order: string[] = [];
    hooks.completeToken = async () => {
      order.push("wait.completeToken");
      return { success: true };
    };

    const manager = getDevHqAdapters().approvalManager;
    const originalApprove = manager.approve.bind(manager);
    vi.spyOn(manager, "approve").mockImplementation(async (input) => {
      order.push("approvalManager.approve");
      return originalApprove(input);
    });

    await approveFounderRequest(approval.id);

    expect(order).toEqual(["wait.completeToken", "approvalManager.approve"]);
  });

  it("pins the ordering in source at founder-request-service.ts:486-496", () => {
    const lines = fs
      .readFileSync(path.join(ROOT, SERVICE), "utf8")
      .split(/\r?\n/);
    // Lines 486 through 496 inclusive.
    const region = lines.slice(485, 496).join("\n");

    expect(region).toContain(
      "Complete the token before recording the decision.",
    );
    expect(region).toContain("wait.completeToken");
    expect(region).toContain("approvalManager.approve");
    expect(region.indexOf("wait.completeToken")).toBeLessThan(
      region.indexOf("approvalManager.approve"),
    );
  });

  it("leaves the approval pending when completeToken throws — the premise that holds", async () => {
    const { approval } = await seedPendingApproval();

    hooks.completeToken = async () => {
      throw new Error("token completion failed");
    };

    await expect(approveFounderRequest(approval.id)).rejects.toThrow(
      "token completion failed",
    );

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.status).toBe("pending");
    expect(stored?.decidedAt).toBeNull();
  });

  it("records the decision anyway when completeToken returns success — the premise that fails", async () => {
    const { approval } = await seedPendingApproval();

    // The false-success case. Same ordering, no throw, so the protection above
    // never engages and the decision is recorded regardless of whether the run
    // could actually resume.
    hooks.completeToken = async () => ({ success: true });

    await approveFounderRequest(approval.id);

    const stored = await getDevHqAdapters().approvalManager.getApproval(
      approval.id,
    );
    expect(stored?.status).toBe("approved");
    expect(stored?.decidedAt).not.toBeNull();
  });
});
