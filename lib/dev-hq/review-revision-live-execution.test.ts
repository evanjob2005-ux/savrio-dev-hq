// MAJOR-1. The third path to "two live agent executions on one task".
//
// 638e45c closed the manual-dispatch path (`dispatchAgentExecution`) and 7979950
// closed the escalation-revise path. This is the third: a review that resolves
// `changes_requested` authorizes a revision execution through `ensureExecution`
// directly, and never asks whether the task already holds live agent work.
//
// It is reachable without anything unusual happening, because a late reviewer
// callback is a DESIGNED-FOR condition — `REVIEW_RESPONSE_DEADLINE_MS` and
// `MAX_REVIEW_DISPATCH_ATTEMPTS` exist precisely because reviewers go silent:
//
//   1. E1 runs under a review policy and SUCCEEDS. R1 opens, pending. E1 is now
//      terminal, so the task holds no live execution.
//   2. The task is therefore legitimately dispatchable again — that is exactly
//      what null arm 3 of `one-live-execution-per-task.test.ts` asserts must be
//      allowed — and E2 goes live. `Task.status` is never moved by execution
//      success, so the task is still `active` and nothing here is unusual.
//   3. R1 reports LATE with a blocking finding. The revision is created onto a
//      task that already holds E2.
//
// The red arm asserts the state, not a predicate: TWO live agent-backed
// executions on ONE task, with both ids printed.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import {
  handleReviewComplete,
  reconcileReviews,
  reviewIdFor,
  revisionExecutionIdFor,
} from "@/lib/dev-hq/review-service";
import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { REVIEW_EVENT_TYPE } from "@/lib/dev-hq/constants";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { Execution, Review, Task } from "@/types/domain";

const TS = "2026-07-29T11:00:00.000Z";
const TASK_ID = "task-icr-1";

function seedTask(id = TASK_ID): Task {
  return saveTask({
    id,
    projectId: "proj-x",
    workflowId: null,
    title: "Reviewed work",
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

function freeAllAgents(): void {
  for (const agent of [...getDevHqStore().agents.values()]) {
    saveAgent({ ...agent, availability: "available" });
  }
}

/** Every agent-backed execution on a task that still owns the task's outcome. */
function liveExecutionsFor(taskId: string): Execution[] {
  return [...getDevHqStore().executions.values()].filter(
    (execution) =>
      execution.taskId === taskId &&
      Boolean(execution.routing) &&
      (execution.status === "queued" || execution.status === "running"),
  );
}

function liveLabels(taskId: string): string[] {
  return liveExecutionsFor(taskId).map((e) => `${e.id}:${e.status}`);
}

/**
 * Step 1 of the sequence: an execution that runs under a review policy and
 * succeeds, leaving a pending review and a task with nothing live on it.
 */
async function succeedUnderReview(key = "icr-k1"): Promise<string> {
  freeAllAgents();
  const dispatched = await dispatchAgentExecution({
    taskId: TASK_ID,
    requiredCapabilities: ["validation"],
    instructions: "block this",
    reviewPolicy: "basic",
    idempotencyKey: key,
  });
  const executionId = dispatched.executionId!;
  await handleExecutionRunning(executionId);
  await handleExecutionComplete({
    executionId,
    status: "succeeded",
    instructions: "block this",
  });
  return executionId;
}

/** Step 2: a second dispatch, legitimate because nothing is live on the task. */
async function dispatchSecond(key = "icr-k2"): Promise<string> {
  freeAllAgents();
  const second = await dispatchAgentExecution({
    taskId: TASK_ID,
    requiredCapabilities: ["validation"],
    instructions: "do the follow-up work",
    // `none` so this execution never opens a review of its own; the subject here
    // is the FIRST review's revision, and a second review loop would only add
    // noise to the same assertion.
    reviewPolicy: "none",
    idempotencyKey: key,
  });
  expect(
    second.assigned,
    "the second dispatch was refused; step 2 of the sequence is the legitimate re-dispatch asserted by null arm 3 of one-live-execution-per-task.test.ts and must be allowed",
  ).toBe(true);
  return second.executionId!;
}

/** Step 3: the late reviewer callback, reporting a blocking finding. */
async function reportBlocking(reviewId: string) {
  const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
  return handleReviewComplete({
    reviewId,
    callbackToken: review.callbackToken!,
    outcome: "changes_requested",
    findings: [
      {
        ref: "blocking-1",
        severity: "blocking",
        category: "correctness",
        summary: "Blocking correctness finding: the material requests changes.",
      },
    ],
  });
}

async function reviewOf(reviewId: string): Promise<Review> {
  return (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
}

async function deferralEvents(executionId: string) {
  const events = await getDevHqAdapters().eventLogger.listRecent({
    entityType: "execution",
    entityId: executionId,
    limit: 200,
  });
  return events.filter((e) => e.type === REVIEW_EVENT_TYPE.revisionDeferred);
}

describe("review revision vs live agent work on one task (MAJOR-1)", () => {
  beforeEach(() => {
    resetDevHqStore();
    let counter = 0;
    const runsByKey = new Map<string, string>();
    triggerMock.mockReset();
    triggerMock.mockImplementation(
      async (
        _taskId: string,
        _payload: unknown,
        options?: { idempotencyKey?: string },
      ) => {
        const key = options?.idempotencyKey;
        if (key && runsByKey.has(key)) return { id: runsByKey.get(key)! };
        const id = `run-${(counter += 1)}`;
        if (key) runsByKey.set(key, id);
        return { id };
      },
    );
  });

  /**
   * THE DEFECT. With the guard reverted this reports both live execution ids:
   * the second dispatch and the review revision, on one task — two independent
   * retry budgets, two review loops and two escalation paths racing on a single
   * `Task.status`.
   */
  it("does not create a review revision onto a task that already holds live agent work", async () => {
    seedTask();
    const firstId = await succeedUnderReview();
    const reviewId = reviewIdFor(firstId);
    const secondId = await dispatchSecond();

    const result = await reportBlocking(reviewId);

    expect(
      liveLabels(TASK_ID),
      `task ${TASK_ID} holds ${liveExecutionsFor(TASK_ID).length} live agent executions; a review revision was created onto a task that already holds live agent work, giving one task two retry budgets, two review loops and two escalation paths on one Task.status (MAJOR-1)`,
    ).toEqual([`${secondId}:queued`]);
    expect(
      getDevHqStore().executions.get(revisionExecutionIdFor(reviewId)) ?? null,
      "the revision execution exists despite the task already holding live agent work",
    ).toBeNull();
    expect(result.revisionExecutionId).toBeNull();
  });

  /**
   * NULL ARM. Identical starting state and identical callback — the only
   * difference is that no second dispatch happened, so the task holds nothing
   * live. The revision a blocking review authorizes must still be created and
   * dispatched, or the red arm above would be satisfied by a revision path that
   * had simply stopped creating revisions.
   */
  it("null arm: the revision is still created when the task holds no other live execution", async () => {
    seedTask();
    const firstId = await succeedUnderReview();
    const reviewId = reviewIdFor(firstId);

    const result = await reportBlocking(reviewId);

    expect(
      result.revisionExecutionId,
      "a blocking review on a task with nothing else live did not authorize its revision; the guard is refusing on the revision itself rather than on competing live work",
    ).toBe(revisionExecutionIdFor(reviewId));
    expect(liveLabels(TASK_ID)).toEqual([
      `${revisionExecutionIdFor(reviewId)}:queued`,
    ]);
    expect((await reviewOf(reviewId)).status).toBe("changes_requested");
  });

  /**
   * The refusal must not strand the loop. A refused revision reaches a RECORDED
   * outcome (one deferral event on the timeline), that record does NOT repeat on
   * every sweep, and the revision is created the moment the competing work is
   * terminal — so the loop makes progress rather than sitting in the "neither
   * completes nor fails" shape a hard throw would produce.
   */
  it("records the deferral once, does not repeat it, and creates the revision once the task is free", async () => {
    seedTask();
    const firstId = await succeedUnderReview();
    const reviewId = reviewIdFor(firstId);
    const secondId = await dispatchSecond();

    await reportBlocking(reviewId);
    expect(
      await deferralEvents(firstId),
      "the refused revision left no record; a refusal nothing records is indistinguishable from a revision that was never owed",
    ).toHaveLength(1);

    // Two sweeps with the competing execution still live: no revision, no second
    // deferral entry, and no progress claimed.
    const sweepA = await reconcileReviews();
    const sweepB = await reconcileReviews();
    expect(liveLabels(TASK_ID)).toEqual([`${secondId}:queued`]);
    expect(
      await deferralEvents(firstId),
      "the sweep appended a deferral entry per pass; an append-only timeline would fill with one entry per minute for as long as the competing execution runs",
    ).toHaveLength(1);
    expect(
      [sweepA.revisions, sweepB.revisions],
      "the sweep reported repairing a revision it did not create; a sweep that reports progress it did not make is the 'neither completes nor fails' shape wearing a green count",
    ).toEqual([0, 0]);

    // The competing execution finishes. The revision is now owed and creatable.
    await handleExecutionRunning(secondId);
    await handleExecutionComplete({ executionId: secondId, status: "succeeded" });
    freeAllAgents();
    const sweepC = await reconcileReviews();

    expect(
      liveLabels(TASK_ID),
      "the deferred revision was never created once the task was free; the review loop is stranded",
    ).toEqual([`${revisionExecutionIdFor(reviewId)}:queued`]);
    expect(sweepC.revisions).toBe(1);
    expect((await reviewOf(reviewId)).revisionExecutionId).toBe(
      revisionExecutionIdFor(reviewId),
    );
  });

  /**
   * The replay case the reviewer's literal recommendation would break. Once the
   * revision exists it is ITSELF the task's live agent execution, and
   * `reconcileReviews` re-runs `ensureReviewLoopStep` for every resolved review
   * on every sweep. A guard evaluated unconditionally would therefore refuse the
   * revision it had just created, on every pass, forever.
   */
  it("null arm: sweeps after a revision was created leave it alone rather than refusing it", async () => {
    seedTask();
    const firstId = await succeedUnderReview();
    const reviewId = reviewIdFor(firstId);
    const revisionId = revisionExecutionIdFor(reviewId);

    await reportBlocking(reviewId);
    expect(liveLabels(TASK_ID)).toEqual([`${revisionId}:queued`]);

    const sweep = await reconcileReviews();

    expect(
      liveLabels(TASK_ID),
      "a sweep disturbed an already-created revision; the guard is evaluating on replays and every recovery now refuses itself",
    ).toEqual([`${revisionId}:queued`]);
    expect(sweep.revisions).toBe(0);
    expect(
      await deferralEvents(firstId),
      "the sweep recorded a deferral for a revision that already exists",
    ).toHaveLength(0);
    expect((await reviewOf(reviewId)).revisionExecutionId).toBe(revisionId);
  });
});
