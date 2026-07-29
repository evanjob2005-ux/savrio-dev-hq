import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { POST } from "@/app/api/dev-hq/internal/review/complete/route";
import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { reviewIdFor } from "@/lib/dev-hq/review-service";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-25T21:00:00.000Z";
const TOKEN = "test-internal-token";
const HEADER = "x-dev-hq-internal-token";

function seedTask(): Task {
  return saveTask({
    id: "task-review-route",
    projectId: "proj-x",
    workflowId: null,
    title: "Reviewable work",
    description: "Do the work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

function request(body: unknown, token?: string): Request {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers[HEADER] = token;
  return new Request("http://localhost/api/dev-hq/internal/review/complete", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("POST /api/dev-hq/internal/review/complete", () => {
  const originalToken = process.env.DEV_HQ_INTERNAL_TOKEN;

  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
  });

  afterEach(() => {
    if (originalToken === undefined) delete process.env.DEV_HQ_INTERNAL_TOKEN;
    else process.env.DEV_HQ_INTERNAL_TOKEN = originalToken;
  });

  /** Drive a task to a pending review and return its callback capability. */
  async function pendingReview() {
    const task = seedTask();
    const dispatched = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      instructions: "do the work",
      idempotencyKey: "review-route-key",
    });
    const executionId = dispatched.executionId!;
    await handleExecutionRunning(executionId);
    await handleExecutionComplete({
      executionId,
      status: "succeeded",
      instructions: "do the work",
    });
    const reviewId = reviewIdFor(executionId);
    const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
    return { executionId, reviewId, callbackToken: review.callbackToken! };
  }

  it("fails closed with 503 when the internal token is not configured", async () => {
    delete process.env.DEV_HQ_INTERNAL_TOKEN;
    const response = await POST(
      request({ reviewId: "rvw-1", callbackToken: "t", outcome: "passed" }),
    );
    expect(response.status).toBe(503);
  });

  it("rejects a wrong internal token with 401", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const response = await POST(
      request(
        { reviewId: "rvw-1", callbackToken: "t", outcome: "passed" },
        "wrong",
      ),
    );
    expect(response.status).toBe(401);
  });

  it("returns 400 without the identifying fields", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    expect(
      (await POST(request({ outcome: "passed" }, TOKEN))).status,
    ).toBe(400);
    expect(
      (await POST(request({ reviewId: "rvw-1", outcome: "passed" }, TOKEN)))
        .status,
    ).toBe(400);
  });

  it("returns 400 for an outcome outside the vocabulary", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const { reviewId, callbackToken } = await pendingReview();

    const response = await POST(
      request({ reviewId, callbackToken, outcome: "escalated" }, TOKEN),
    );
    expect(response.status).toBe(400);
  });

  it("returns 403 for a callback token that is not the reserved one", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const { reviewId } = await pendingReview();

    // Authenticated as a Dev HQ worker, but not authorized for this review.
    const response = await POST(
      request({ reviewId, callbackToken: "forged", outcome: "passed" }, TOKEN),
    );
    expect(response.status).toBe(403);
    expect(
      (await getDevHqAdapters().reviewStore.getReview(reviewId))!.status,
    ).toBe("pending");
  });

  it("returns 404 for a review that does not exist", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const response = await POST(
      request(
        { reviewId: "rvw-missing", callbackToken: "t", outcome: "passed" },
        TOKEN,
      ),
    );
    expect(response.status).toBe(404);
  });

  it("applies an authorized outcome and replays a duplicate callback", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const { reviewId, callbackToken } = await pendingReview();
    const body = { reviewId, callbackToken, outcome: "passed" };

    const first = await POST(request(body, TOKEN));
    expect(first.status).toBe(200);
    expect(await first.json()).toMatchObject({
      applied: true,
      exhausted: false,
      review: { status: "passed" },
    });

    const replay = await POST(request(body, TOKEN));
    expect(replay.status).toBe(200);
    expect(await replay.json()).toMatchObject({
      applied: false,
      review: { status: "passed" },
    });
  });

  it("does not echo the callback capability in its response", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const { reviewId, callbackToken } = await pendingReview();

    const response = await POST(
      request({ reviewId, callbackToken, outcome: "passed" }, TOKEN),
    );
    const body = await response.text();

    // The worker already holds the capability, so echoing it back buys nothing
    // and widens the surface that could be logged downstream.
    expect(response.status).toBe(200);
    expect(body).not.toContain(callbackToken);
    expect(body).not.toContain("callbackToken");
  });

  it("records well-formed findings", async () => {
    process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
    const { reviewId, callbackToken } = await pendingReview();

    const response = await POST(
      request(
        {
          reviewId,
          callbackToken,
          outcome: "changes_requested",
          findings: [
            {
              ref: "blocking-1",
              severity: "blocking",
              category: "correctness",
              summary: "real finding",
            },
          ],
        },
        TOKEN,
      ),
    );

    expect(response.status).toBe(200);
    const findings = await getDevHqAdapters().reviewStore.listFindings(reviewId);
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toContain("blocking-1");
    expect(findings[0].severity).toBe("blocking");
  });

  // --- P1-12: malformed findings must not be silently dropped ----------------
  //
  // The route used to `flatMap` malformed entries away and continue. The
  // malformation is not the defect; discarding evidence and answering 200 is.
  // Both arms below start from the same `pendingReview()` state and differ only
  // in whether the blocking finding is well formed (STD-CTRL-001 rule 2).
  describe("P1-12 malformed findings", () => {
    /** A blocking finding with no `summary`. Unambiguously blocking, unusable. */
    const MALFORMED_BLOCKING = {
      ref: "blocking-1",
      severity: "blocking",
      category: "correctness",
    };
    const WELL_FORMED_BLOCKING = {
      ...MALFORMED_BLOCKING,
      summary: "The change drops the authorization check.",
    };

    async function submit(findings: unknown[]) {
      const { reviewId, callbackToken } = await pendingReview();
      const response = await POST(
        request({ reviewId, callbackToken, outcome: "passed", findings }, TOKEN),
      );
      const { reviewStore } = getDevHqAdapters();
      return {
        status: response.status,
        body: await response.json(),
        reviewStatus: (await reviewStore.getReview(reviewId))!.status,
        durable: (await reviewStore.listFindings(reviewId)).map((f) => ({
          severity: f.severity,
        })),
      };
    }

    it("refuses the callback and keeps the review pending", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      const observed = await submit([MALFORMED_BLOCKING]);

      expect(
        {
          status: observed.status,
          reviewStatus: observed.reviewStatus,
          durable: observed.durable,
        },
        "P1-12: a malformed BLOCKING finding was silently dropped. The reviewer " +
          "reported that changes are required; the route discarded that evidence, " +
          "answered 200, and the review resolved as `passed` holding zero durable " +
          "findings. Observe `reviewStatus: passed` with `durable: []` below: the " +
          "blocking finding disappeared and the review turned green.",
      ).toEqual({ status: 400, reviewStatus: "pending", durable: [] });

      // The refusal names the field, so a reviewer can correct and resubmit.
      expect(observed.body.error).toContain("findings[0]");
      expect(observed.body.error).toContain("summary");
    });

    it("null arm: the same callback with the finding well formed still works", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      const observed = await submit([WELL_FORMED_BLOCKING]);

      // Same starting state, same `outcome: "passed"`, one field different: the
      // blocking finding is durable and it upgrades the outcome, as before.
      expect({
        status: observed.status,
        reviewStatus: observed.reviewStatus,
        durable: observed.durable,
      }).toEqual({
        status: 200,
        reviewStatus: "changes_requested",
        durable: [{ severity: "blocking" }],
      });
    });

    it("refuses every malformed shape rather than dropping it", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      for (const findings of [
        [{ severity: "advisory", category: "x", summary: "no ref" }],
        [{ ref: "  ", severity: "advisory", category: "x", summary: "blank ref" }],
        [{ ref: "r", severity: "catastrophic", category: "x", summary: "y" }],
        ["not an object"],
        [null],
        "not an array",
      ]) {
        const observed = await submit(findings as unknown[]);
        expect(observed.status, `expected 400 for ${JSON.stringify(findings)}`)
          .toBe(400);
        expect(observed.reviewStatus).toBe("pending");
      }
    });
  });

  // --- P1-13: duplicate references must not erase blocking evidence ----------
  //
  // `blocking` is derived from the submitted array; persistence keys findings on
  // (reviewId, ref) and keeps the first row written under each. Two disagreeing
  // findings under one reference therefore made those two derivations disagree.
  describe("P1-13 duplicate finding references", () => {
    const ADVISORY = {
      ref: "shared-ref",
      severity: "advisory",
      category: "maintainability",
      summary: "Naming nit; no revision required.",
    };
    const BLOCKING = {
      ref: "shared-ref",
      severity: "blocking",
      category: "correctness",
      summary: "The change drops the authorization check.",
    };

    async function submit(findings: unknown[]) {
      const { reviewId, callbackToken } = await pendingReview();
      const response = await POST(
        request({ reviewId, callbackToken, outcome: "passed", findings }, TOKEN),
      );
      const { reviewStore } = getDevHqAdapters();
      return {
        status: response.status,
        reviewStatus: (await reviewStore.getReview(reviewId))!.status,
        durableSeverities: (await reviewStore.listFindings(reviewId)).map(
          (f) => f.severity,
        ),
      };
    }

    it("refuses the callback and writes no partial evidence", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      const observed = await submit([ADVISORY, BLOCKING]);

      expect(
        observed,
        "P1-13: the durable evidence disagrees with the review outcome. The " +
          "blocking finding set the outcome to `changes_requested`, then lost the " +
          "keyed write to the advisory record sharing its reference. Observe " +
          "`reviewStatus: changes_requested` with `durableSeverities: [advisory]` " +
          "below: the review says changes are required and the stored evidence no " +
          "longer says why.",
      ).toEqual({
        status: 400,
        reviewStatus: "pending",
        durableSeverities: [],
      });
    });

    it("null arm: the same two findings under distinct references still work", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      const observed = await submit([ADVISORY, { ...BLOCKING, ref: "blocking-1" }]);

      // Identical starting state and identical finding content; only the shared
      // reference is gone. Both records survive and the outcome matches them.
      expect(observed).toEqual({
        status: 200,
        reviewStatus: "changes_requested",
        durableSeverities: ["blocking", "advisory"],
      });
    });

    it("null arm: an exact repeat of one reference is still accepted", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      const observed = await submit([BLOCKING, { ...BLOCKING }]);

      // Keying collapses identical repeats losslessly, so the outcome and the
      // evidence still agree and there is nothing to refuse.
      expect(observed).toEqual({
        status: 200,
        reviewStatus: "changes_requested",
        durableSeverities: ["blocking"],
      });
    });
  });

  // --- P2-33: consistent, non-leaking error mapping --------------------------
  describe("P2-33 error mapping", () => {
    it("answers 400 for a body that is not JSON, not 500", async () => {
      process.env.DEV_HQ_INTERNAL_TOKEN = TOKEN;
      const response = await POST(
        new Request("http://localhost/api/dev-hq/internal/review/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json", [HEADER]: TOKEN },
          body: "{ not json",
        }),
      );

      expect(
        response.status,
        "A malformed body is the caller's error. A 500 blames the server, is " +
          "retryable, and pages an operator for a request that can never succeed.",
      ).toBe(400);
      // And the parser's own text, which quotes the offending bytes, never
      // reaches the caller.
      expect(await response.text()).not.toContain("JSON.parse");
    });
  });
});
