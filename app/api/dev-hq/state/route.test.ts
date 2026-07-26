import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { GET } from "@/app/api/dev-hq/state/route";
import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { reviewIdFor } from "@/lib/dev-hq/review-service";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { buildDevHqState, resetDevHqStore, saveTask } from "@/lib/dev-hq/store";
import type { Task } from "@/types/domain";

const TS = "2026-07-25T21:00:00.000Z";

function seedTask(): Task {
  return saveTask({
    id: "task-state-review",
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

/** Drive a task to a dispatched, pending review holding a reserved capability. */
async function pendingReview(): Promise<{
  executionId: string;
  reviewId: string;
  callbackToken: string;
}> {
  const task = seedTask();
  const dispatched = await dispatchAgentExecution({
    taskId: task.id,
    requiredCapabilities: ["validation"],
    instructions: "do the work",
    idempotencyKey: "state-read-model-key",
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

/**
 * The read model Mission Control renders reviews from. Every field here has a
 * consumer; the projection must not drop any of them while removing the
 * capability.
 */
const REQUIRED_REVIEW_FIELDS = [
  "id",
  "taskId",
  "executionId",
  "iteration",
  "policy",
  "status",
  "reviewerAgentId",
  "triggerRunId",
  "dispatchedAt",
  "dispatchAttempts",
  "escalationReason",
  "revisionExecutionId",
  "createdAt",
  "resolvedAt",
] as const;

describe("review read-model projection", () => {
  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockReset();
    triggerMock.mockResolvedValue({ id: "run-1" });
  });

  it("omits the callback capability from DevHqState reviews", async () => {
    const { callbackToken } = await pendingReview();

    const { reviews } = buildDevHqState();
    expect(reviews).toHaveLength(1);
    for (const review of reviews) {
      expect(Object.keys(review)).not.toContain("callbackToken");
      expect(Object.values(review)).not.toContain(callbackToken);
    }
  });

  it("does not serialize the callback capability through /api/dev-hq/state", async () => {
    const { callbackToken } = await pendingReview();

    const response = await GET();
    const body = await response.text();

    // Substring, not field-shape: the capability must not reach the browser
    // through the reviews, the events, the evidence, or anything else the
    // snapshot carries.
    expect(callbackToken.length).toBeGreaterThan(0);
    expect(body).not.toContain(callbackToken);
    expect(body).not.toContain("callbackToken");
  });

  it("keeps every review field Mission Control renders", async () => {
    const { reviewId, executionId } = await pendingReview();

    const response = await GET();
    const state = (await response.json()) as {
      reviews: Record<string, unknown>[];
    };
    const projected = state.reviews.find((review) => review.id === reviewId)!;

    expect(projected).toBeDefined();
    for (const field of REQUIRED_REVIEW_FIELDS) {
      expect(Object.keys(projected)).toContain(field);
    }
    expect(projected.executionId).toBe(executionId);
    expect(projected.status).toBe("pending");
    expect(projected.iteration).toBe(1);
    expect(projected.triggerRunId).toBe("run-1");
  });
});
