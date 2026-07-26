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

  it("records well-formed findings and ignores malformed ones", async () => {
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
            { ref: "bad", severity: "catastrophic", category: "x", summary: "y" },
            { severity: "advisory", category: "x", summary: "no ref" },
            "not an object",
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
});
