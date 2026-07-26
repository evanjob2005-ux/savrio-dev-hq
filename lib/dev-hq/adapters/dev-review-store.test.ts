import { beforeEach, describe, expect, it } from "vitest";

import { createDevReviewStore } from "@/lib/dev-hq/adapters/dev-review-store";
import { resetDevHqStore } from "@/lib/dev-hq/store";

const TS = "2026-07-25T21:00:00.000Z";

function baseInput(overrides?: Partial<Parameters<
  ReturnType<typeof createDevReviewStore>["createReview"]
>[0]>) {
  return {
    reviewId: "rvw-exec-1",
    taskId: "task-1",
    executionId: "exec-1",
    iteration: 1,
    policy: "basic" as const,
    reviewerAgentId: "agent-codex",
    ...overrides,
  };
}

describe("DevReviewStore", () => {
  const store = createDevReviewStore();

  beforeEach(() => {
    resetDevHqStore();
  });

  describe("identity", () => {
    it("creates a review at the caller's canonical id", async () => {
      const review = await store.createReview(baseInput({ at: TS }));

      expect(review).toMatchObject({
        id: "rvw-exec-1",
        taskId: "task-1",
        executionId: "exec-1",
        iteration: 1,
        policy: "basic",
        status: "pending",
        reviewerAgentId: "agent-codex",
        callbackToken: null,
        triggerRunId: null,
        revisionExecutionId: null,
        createdAt: TS,
        resolvedAt: null,
      });
    });

    it("returns the existing review rather than creating a second one", async () => {
      const first = await store.createReview(baseInput());
      // A replay arrives with a different iteration; the persisted review wins.
      const second = await store.createReview(baseInput({ iteration: 9 }));

      expect(second).toBe(first);
      expect(second.iteration).toBe(1);
      expect(await store.listForTask("task-1")).toHaveLength(1);
    });

    it("converges under concurrent creation", async () => {
      const results = await Promise.all(
        Array.from({ length: 8 }, () => store.createReview(baseInput())),
      );

      expect(new Set(results.map((r) => r.id)).size).toBe(1);
      expect(await store.listForTask("task-1")).toHaveLength(1);
    });

    it("finds a review by the execution it judges", async () => {
      await store.createReview(baseInput());
      expect((await store.findByExecution("exec-1"))?.id).toBe("rvw-exec-1");
      expect(await store.findByExecution("exec-missing")).toBeNull();
    });

    it("orders a task's reviews by iteration", async () => {
      await store.createReview(baseInput({ reviewId: "rvw-b", executionId: "exec-b", iteration: 2 }));
      await store.createReview(baseInput({ reviewId: "rvw-a", executionId: "exec-a", iteration: 1 }));

      expect((await store.listForTask("task-1")).map((r) => r.iteration)).toEqual([
        1, 2,
      ]);
    });
  });

  describe("guarded resolution", () => {
    it("resolves a pending review once", async () => {
      await store.createReview(baseInput());

      const resolved = await store.resolveReview({
        reviewId: "rvw-exec-1",
        status: "passed",
        at: TS,
      });
      expect(resolved?.status).toBe("passed");
      expect(resolved?.resolvedAt).toBe(TS);

      // A second resolution is refused rather than overwriting the first.
      expect(
        await store.resolveReview({
          reviewId: "rvw-exec-1",
          status: "changes_requested",
        }),
      ).toBeNull();
      expect((await store.getReview("rvw-exec-1"))?.status).toBe("passed");
    });

    it("refuses to resolve a review that does not exist", async () => {
      expect(
        await store.resolveReview({ reviewId: "rvw-missing", status: "passed" }),
      ).toBeNull();
    });

    it("lets exactly one concurrent caller resolve", async () => {
      await store.createReview(baseInput());

      const results = await Promise.all([
        store.resolveReview({ reviewId: "rvw-exec-1", status: "passed" }),
        store.resolveReview({ reviewId: "rvw-exec-1", status: "changes_requested" }),
        store.resolveReview({ reviewId: "rvw-exec-1", status: "escalated" }),
      ]);

      expect(results.filter(Boolean)).toHaveLength(1);
    });

    it("lists only pending reviews", async () => {
      await store.createReview(baseInput());
      await store.createReview(
        baseInput({ reviewId: "rvw-2", executionId: "exec-2", iteration: 2 }),
      );
      await store.resolveReview({ reviewId: "rvw-2", status: "passed" });

      expect((await store.listPending()).map((r) => r.id)).toEqual(["rvw-exec-1"]);
    });
  });

  describe("reserve-once fields", () => {
    it("hands every caller the same callback token", async () => {
      await store.createReview(baseInput());

      const first = await store.reserveCallbackToken({
        reviewId: "rvw-exec-1",
        token: "token-a",
      });
      const second = await store.reserveCallbackToken({
        reviewId: "rvw-exec-1",
        token: "token-b",
      });

      expect(first).toBe("token-a");
      expect(second).toBe("token-a");
      expect((await store.getReview("rvw-exec-1"))?.callbackToken).toBe("token-a");
    });

    it("hands every caller the same revision execution id", async () => {
      await store.createReview(baseInput());

      const first = await store.reserveRevisionExecution({
        reviewId: "rvw-exec-1",
        executionId: "exec-revision-a",
      });
      const second = await store.reserveRevisionExecution({
        reviewId: "rvw-exec-1",
        executionId: "exec-revision-b",
      });

      expect(first).toBe("exec-revision-a");
      expect(second).toBe("exec-revision-a");
    });

    it("throws when reserving against a review that does not exist", async () => {
      await expect(
        store.reserveCallbackToken({ reviewId: "rvw-missing", token: "t" }),
      ).rejects.toThrow("Review not found: rvw-missing");
      await expect(
        store.reserveRevisionExecution({
          reviewId: "rvw-missing",
          executionId: "exec-x",
        }),
      ).rejects.toThrow("Review not found: rvw-missing");
    });

    it("records each dispatch attempt while the review is pending", async () => {
      await store.createReview(baseInput());

      const first = await store.recordDispatch({
        reviewId: "rvw-exec-1",
        triggerRunId: "run-1",
        at: TS,
      });
      expect(first).toMatchObject({
        triggerRunId: "run-1",
        dispatchedAt: TS,
        dispatchAttempts: 1,
      });

      // A stalled review is dispatched again: the new run replaces the dead one
      // and the attempt is counted against the allowance.
      const second = await store.recordDispatch({
        reviewId: "rvw-exec-1",
        triggerRunId: "run-2",
      });
      expect(second).toMatchObject({ triggerRunId: "run-2", dispatchAttempts: 2 });
    });

    it("freezes dispatch bookkeeping once the review is resolved", async () => {
      await store.createReview(baseInput());
      await store.recordDispatch({ reviewId: "rvw-exec-1", triggerRunId: "run-1" });
      await store.resolveReview({ reviewId: "rvw-exec-1", status: "passed" });

      // A run confirmed after the outcome landed must not restart the deadline
      // or spend another attempt.
      const late = await store.recordDispatch({
        reviewId: "rvw-exec-1",
        triggerRunId: "run-late",
      });
      expect(late).toMatchObject({ triggerRunId: "run-1", dispatchAttempts: 1 });
      expect(
        await store.recordDispatch({ reviewId: "rvw-missing", triggerRunId: "r" }),
      ).toBeNull();
    });

    it("lists only reviews that went silent past the deadline", async () => {
      await store.createReview(baseInput());
      await store.createReview(
        baseInput({ reviewId: "rvw-2", executionId: "exec-2", iteration: 2 }),
      );
      await store.recordDispatch({
        reviewId: "rvw-exec-1",
        triggerRunId: "run-1",
        at: "2026-07-25T20:00:00.000Z",
      });
      await store.recordDispatch({
        reviewId: "rvw-2",
        triggerRunId: "run-2",
        at: "2026-07-25T23:00:00.000Z",
      });

      const stale = await store.listUnresponsive("2026-07-25T21:00:00.000Z");
      expect(stale.map((r) => r.id)).toEqual(["rvw-exec-1"]);

      // A resolved review is never unresponsive, however long ago it dispatched.
      await store.resolveReview({ reviewId: "rvw-exec-1", status: "passed" });
      expect(
        await store.listUnresponsive("2026-07-25T21:00:00.000Z"),
      ).toHaveLength(0);
    });

    it("records the escalation cause only when escalating", async () => {
      await store.createReview(baseInput());
      const escalated = await store.resolveReview({
        reviewId: "rvw-exec-1",
        status: "escalated",
        escalationReason: "reviewer_unresponsive",
      });
      expect(escalated?.escalationReason).toBe("reviewer_unresponsive");

      await store.createReview(
        baseInput({ reviewId: "rvw-2", executionId: "exec-2" }),
      );
      const passed = await store.resolveReview({
        reviewId: "rvw-2",
        status: "passed",
      });
      expect(passed?.escalationReason).toBeNull();
    });
  });

  describe("findings", () => {
    it("records a finding once per (review, ref)", async () => {
      await store.createReview(baseInput());

      const first = await store.recordFinding({
        reviewId: "rvw-exec-1",
        ref: "blocking-1",
        severity: "blocking",
        category: "correctness",
        summary: "first",
        evidenceId: "evd-1",
      });
      const replay = await store.recordFinding({
        reviewId: "rvw-exec-1",
        ref: "blocking-1",
        severity: "advisory",
        category: "correctness",
        summary: "second",
      });

      expect(replay).toBe(first);
      expect(replay.summary).toBe("first");
      expect(replay.severity).toBe("blocking");
      expect(await store.listFindings("rvw-exec-1")).toHaveLength(1);
    });

    it("keeps findings of different refs and different reviews apart", async () => {
      await store.createReview(baseInput());
      await store.createReview(
        baseInput({ reviewId: "rvw-2", executionId: "exec-2", iteration: 2 }),
      );

      await store.recordFinding({
        reviewId: "rvw-exec-1",
        ref: "a",
        severity: "blocking",
        category: "correctness",
        summary: "one",
      });
      await store.recordFinding({
        reviewId: "rvw-exec-1",
        ref: "b",
        severity: "advisory",
        category: "reliability",
        summary: "two",
      });
      await store.recordFinding({
        reviewId: "rvw-2",
        ref: "a",
        severity: "blocking",
        category: "correctness",
        summary: "other review",
      });

      expect(await store.listFindings("rvw-exec-1")).toHaveLength(2);
      expect(await store.listFindings("rvw-2")).toHaveLength(1);
    });
  });
});
