import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({ triggerMock: vi.fn() }));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import {
  AGENT_REVIEW_TASK_ID,
  UnauthorizedReviewCallbackError,
  ensureReviewForExecution,
  handleReviewComplete,
  reconcileReviews,
  reviewIdFor,
  revisionExecutionIdFor,
  simulateReview,
  type AgentReviewTaskPayload,
} from "@/lib/dev-hq/review-service";
import {
  dispatchAgentExecution,
  handleExecutionComplete,
  handleExecutionRunning,
} from "@/lib/dev-hq/agent-execution-service";
import { getExecution } from "@/lib/dev-hq/execution-manager";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  EXECUTION_EVENT_TYPE,
  MAX_REVIEW_DISPATCH_ATTEMPTS,
  MAX_REVIEW_ITERATIONS,
  REVIEW_EVENT_TYPE,
} from "@/lib/dev-hq/constants";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { ReviewPolicy, Task } from "@/types/domain";

const TS = "2026-07-25T21:00:00.000Z";

function seedTask(id = "task-rv-1"): Task {
  return saveTask({
    id,
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

/** Free every agent, so successive executions can be dispatched in one test. */
function freeAllAgents(): void {
  for (const agent of [...getDevHqStore().agents.values()]) {
    saveAgent({ ...agent, availability: "available" });
  }
}

/** Dispatch a task and drive its execution to success. */
async function succeedExecution(options?: {
  taskId?: string;
  instructions?: string;
  reviewPolicy?: ReviewPolicy;
  idempotencyKey?: string;
}): Promise<string> {
  freeAllAgents();
  const dispatched = await dispatchAgentExecution({
    taskId: options?.taskId ?? "task-rv-1",
    requiredCapabilities: ["validation"],
    instructions: options?.instructions ?? "do the work",
    reviewPolicy: options?.reviewPolicy,
    idempotencyKey: options?.idempotencyKey ?? "review-key-1",
  });
  const executionId = dispatched.executionId!;
  await handleExecutionRunning(executionId);
  await handleExecutionComplete({
    executionId,
    status: "succeeded",
    instructions: options?.instructions ?? "do the work",
  });
  return executionId;
}

function reviewPayloads(): AgentReviewTaskPayload[] {
  return triggerMock.mock.calls
    .filter((call) => call[0] === AGENT_REVIEW_TASK_ID)
    .map((call) => call[1] as AgentReviewTaskPayload);
}

async function executionEvents(executionId: string) {
  return getDevHqAdapters().eventLogger.listRecent({
    entityType: "execution",
    entityId: executionId,
    limit: 200,
  });
}

async function eventsOfType(executionId: string, type: string) {
  return (await executionEvents(executionId)).filter((e) => e.type === type);
}

describe("review service", () => {
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

  describe("simulateReview", () => {
    it("derives the outcome deterministically from the material", () => {
      expect(simulateReview("please BLOCK this", "basic").outcome).toBe(
        "changes_requested",
      );
      expect(simulateReview("please revise the wording", "basic").outcome).toBe(
        "passed",
      );
      expect(simulateReview("looks fine", "basic").outcome).toBe("passed");
      // Blocking takes precedence when both markers appear.
      expect(simulateReview("revise and block", "basic").outcome).toBe(
        "changes_requested",
      );
    });

    it("evaluates more lenses under the full policy, with the same outcome", () => {
      const basic = simulateReview("block this", "basic");
      const full = simulateReview("block this", "full");

      expect(basic.findings).toHaveLength(1);
      expect(full.findings).toHaveLength(3);
      expect(full.outcome).toBe(basic.outcome);
      expect(new Set(full.findings.map((f) => f.ref)).size).toBe(3);
    });

    it("records advisory notes without requesting changes", () => {
      const { outcome, findings } = simulateReview("revise the naming", "basic");
      expect(outcome).toBe("passed");
      expect(findings.every((f) => f.severity === "advisory")).toBe(true);
    });
  });

  describe("review request", () => {
    it("creates one canonical review and dispatches it once", async () => {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);

      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      expect(review).toMatchObject({
        id: reviewId,
        executionId,
        iteration: 1,
        policy: "basic",
        status: "pending",
      });
      expect(review.callbackToken).toBeTruthy();
      expect(review.triggerRunId).toBeTruthy();
      expect(reviewPayloads()).toHaveLength(1);
      expect(reviewPayloads()[0]).toMatchObject({
        reviewId,
        executionId,
        callbackToken: review.callbackToken,
      });
    });

    it("converges repeated and concurrent requests on one review and one run", async () => {
      seedTask();
      const executionId = await succeedExecution();
      const before = reviewPayloads().length;

      const results = await Promise.all(
        Array.from({ length: 6 }, () => ensureReviewForExecution(executionId)),
      );

      expect(new Set(results.map((r) => r.review?.id)).size).toBe(1);
      expect([...getDevHqStore().reviews.values()]).toHaveLength(1);
      // No further dispatch: the review already holds its run.
      expect(reviewPayloads()).toHaveLength(before);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.started),
      ).toHaveLength(1);
    });

    it("skips review entirely under the none policy", async () => {
      seedTask();
      const executionId = await succeedExecution({ reviewPolicy: "none" });

      expect(await ensureReviewForExecution(executionId)).toEqual({
        review: null,
        reason: "policy_none",
      });
      expect([...getDevHqStore().reviews.values()]).toHaveLength(0);
      expect(reviewPayloads()).toHaveLength(0);
    });

    it("refuses to review work that has not succeeded", async () => {
      seedTask();
      freeAllAgents();
      const dispatched = await dispatchAgentExecution({
        taskId: "task-rv-1",
        requiredCapabilities: ["validation"],
        idempotencyKey: "review-key-pending",
      });

      expect(await ensureReviewForExecution(dispatched.executionId!)).toEqual({
        review: null,
        reason: "execution_not_reviewable",
      });
      expect(await ensureReviewForExecution("exec-missing")).toEqual({
        review: null,
        reason: "execution_not_found",
      });
    });

    it("persists the review policy on the execution it was dispatched under", async () => {
      seedTask();
      const basic = await succeedExecution();
      expect((await getExecution(basic))!.reviewPolicy).toBe("basic");

      seedTask("task-rv-2");
      const full = await succeedExecution({
        taskId: "task-rv-2",
        reviewPolicy: "full",
        idempotencyKey: "review-key-full",
      });
      expect((await getExecution(full))!.reviewPolicy).toBe("full");
    });
  });

  describe("callback authorization", () => {
    async function pendingReview() {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);
      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      return { executionId, reviewId, token: review.callbackToken! };
    }

    it("accepts the reserved token", async () => {
      const { reviewId, token } = await pendingReview();

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "passed",
      });

      expect(result.applied).toBe(true);
      expect(result.review.status).toBe("passed");
    });

    it("rejects an incorrect token and leaves the review pending", async () => {
      const { reviewId } = await pendingReview();

      await expect(
        handleReviewComplete({
          reviewId,
          callbackToken: "not-the-token",
          outcome: "passed",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedReviewCallbackError);

      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      expect(review.status).toBe("pending");
      expect(review.resolvedAt).toBeNull();
    });

    it("rejects a token belonging to another review", async () => {
      const first = await pendingReview();
      seedTask("task-rv-2");
      const otherExecution = await succeedExecution({
        taskId: "task-rv-2",
        idempotencyKey: "review-key-other",
      });
      const other = (await getDevHqAdapters().reviewStore.getReview(
        reviewIdFor(otherExecution),
      ))!;

      await expect(
        handleReviewComplete({
          reviewId: first.reviewId,
          callbackToken: other.callbackToken!,
          outcome: "passed",
        }),
      ).rejects.toBeInstanceOf(UnauthorizedReviewCallbackError);
      expect(
        (await getDevHqAdapters().reviewStore.getReview(first.reviewId))!.status,
      ).toBe("pending");
    });

    it("rejects a callback for a review that does not exist", async () => {
      await expect(
        handleReviewComplete({
          reviewId: "rvw-missing",
          callbackToken: "anything",
          outcome: "passed",
        }),
      ).rejects.toThrow("Review not found: rvw-missing");
    });
  });

  describe("duplicate callbacks", () => {
    it("converges without a second transition, event, evidence, or finding", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore, evidenceStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const callback = {
        reviewId,
        callbackToken: token,
        outcome: "changes_requested" as const,
        findings: simulateReview("block this", "basic").findings,
      };

      const first = await handleReviewComplete(callback);
      const evidenceAfterFirst = await evidenceStore.listForExecution(executionId);
      const eventsAfterFirst = await executionEvents(executionId);
      const executionsAfterFirst = [...getDevHqStore().executions.values()].length;

      const replay = await handleReviewComplete(callback);
      const third = await handleReviewComplete(callback);

      expect(first.applied).toBe(true);
      expect(replay.applied).toBe(false);
      expect(third.applied).toBe(false);
      expect(replay.review.status).toBe("changes_requested");
      expect(replay.revisionExecutionId).toBe(first.revisionExecutionId);
      expect(await evidenceStore.listForExecution(executionId)).toHaveLength(
        evidenceAfterFirst.length,
      );
      expect(await executionEvents(executionId)).toHaveLength(
        eventsAfterFirst.length,
      );
      expect(await reviewStore.listFindings(reviewId)).toHaveLength(1);
      expect([...getDevHqStore().executions.values()]).toHaveLength(
        executionsAfterFirst,
      );
    });

    it("converges when duplicate callbacks race", async () => {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      const results = await Promise.all(
        Array.from({ length: 5 }, () =>
          handleReviewComplete({
            reviewId,
            callbackToken: token,
            outcome: "passed",
          }),
        ),
      );

      expect(results.filter((r) => r.applied)).toHaveLength(1);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.passed),
      ).toHaveLength(1);
    });
  });

  // R-1: a review's outcome is decided once. A callback that arrives after the
  // record is terminal is late, not owed work, and must leave no trace behind.
  describe("late callbacks after a terminal outcome", () => {
    /** Every durable trace a late callback must not add. */
    async function reviewTrace(executionId: string, reviewId: string) {
      const { reviewStore, evidenceStore } = getDevHqAdapters();
      const evidence = await evidenceStore.listForExecution(executionId);
      return {
        findings: await reviewStore.listFindings(reviewId),
        findingEvents: await eventsOfType(
          executionId,
          REVIEW_EVENT_TYPE.findingRecorded,
        ),
        findingEvidence: evidence.filter((e) =>
          e.uri?.startsWith(`review:${reviewId}:finding:`),
        ),
        events: (await executionEvents(executionId)).length,
        evidence: evidence.length,
        executions: [...getDevHqStore().executions.values()].length,
        escalations: [...getDevHqStore().escalations.values()].length,
      };
    }

    it("records nothing on a review escalated as reviewer_unresponsive", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      // Spend the dispatch allowance: the review escalates having never heard
      // from any of its runs.
      for (let sweep = 0; sweep < MAX_REVIEW_DISPATCH_ATTEMPTS; sweep += 1) {
        await reconcileReviews("2999-01-01T00:00:00.000Z");
      }
      const before = await reviewTrace(executionId, reviewId);
      expect(before.escalations).toBe(1);

      // An abandoned run finally reports, with blocking findings.
      const late = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      expect(late.applied).toBe(false);
      expect(late.revisionExecutionId).toBeNull();
      expect(late.exhausted).toBe(true);
      expect(late.review.status).toBe("escalated");
      expect(late.review.escalationReason).toBe("reviewer_unresponsive");

      const after = await reviewTrace(executionId, reviewId);
      expect(after.findings).toHaveLength(0);
      expect(after.findingEvents).toHaveLength(0);
      expect(after.findingEvidence).toHaveLength(0);
      expect(after.events).toBe(before.events);
      expect(after.evidence).toBe(before.evidence);
      // No revision authorized, and no second founder decision raised.
      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewId))!
          .revisionExecutionId,
      ).toBeNull();
      expect(await getExecution(revisionExecutionIdFor(reviewId))).toBeNull();
      expect(after.executions).toBe(before.executions);
      expect(after.escalations).toBe(1);
    });

    it("records nothing on a review that already passed", async () => {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      // The first run reports a clean pass; the review is terminal.
      await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "passed",
      });
      const before = await reviewTrace(executionId, reviewId);

      // A slower run reports blocking findings afterwards, sharing the token.
      const late = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      expect(late.applied).toBe(false);
      expect(late.revisionExecutionId).toBeNull();
      expect(late.exhausted).toBe(false);
      // The persisted outcome is the one that was actually decided.
      expect(late.review.status).toBe("passed");

      const after = await reviewTrace(executionId, reviewId);
      expect(after.findings).toHaveLength(0);
      expect(after.findingEvents).toHaveLength(0);
      expect(after.findingEvidence).toHaveLength(0);
      expect(after.events).toBe(before.events);
      expect(after.evidence).toBe(before.evidence);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.changesRequested),
      ).toHaveLength(0);
      expect(await getExecution(revisionExecutionIdFor(reviewId))).toBeNull();
      expect(after.executions).toBe(before.executions);
      expect(after.escalations).toBe(0);
    });
  });

  describe("outcomes", () => {
    it("terminates the loop on acceptance", async () => {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);
      const { reviewStore, evidenceStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "passed",
      });

      expect(result.review.status).toBe("passed");
      expect(result.revisionExecutionId).toBeNull();
      expect(result.exhausted).toBe(false);
      // No revision execution, and no further review.
      expect([...getDevHqStore().executions.values()]).toHaveLength(1);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.passed),
      ).toHaveLength(1);
      const evidence = await evidenceStore.listForExecution(executionId);
      expect(
        evidence.some((e) => e.uri === `review:${reviewId}:outcome`),
      ).toBe(true);
    });

    it("records advisory findings without continuing the loop", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "revise wording" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "passed",
        findings: simulateReview("revise wording", "basic").findings,
      });

      expect(result.review.status).toBe("passed");
      expect(result.revisionExecutionId).toBeNull();
      const findings = await reviewStore.listFindings(reviewId);
      expect(findings).toHaveLength(1);
      expect(findings[0].severity).toBe("advisory");
      expect(findings[0].evidenceId).toBeTruthy();
    });

    it("treats a blocking finding as changes requested whatever the reported outcome", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      // A reviewer reporting "passed" alongside a blocking finding is a
      // contradiction; the finding is authoritative.
      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "passed",
        findings: simulateReview("block this", "basic").findings,
      });

      expect(result.review.status).toBe("changes_requested");
      expect(result.revisionExecutionId).toBeTruthy();
    });

    it("authorizes exactly one revision execution and dispatches it", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const reviewed = (await getExecution(executionId))!;
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      expect(result.revisionExecutionId).toBe(revisionExecutionIdFor(reviewId));
      const revision = (await getExecution(result.revisionExecutionId!))!;
      // A fresh execution retry budget (E6), inheriting the authorized work.
      expect(revision.attempt).toBe(1);
      expect(revision.request).toEqual(reviewed.request);
      expect(revision.routing).toEqual(reviewed.routing);
      expect(revision.reviewPolicy).toBe(reviewed.reviewPolicy);
      expect(revision.agentId).toBeTruthy();
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.changesRequested),
      ).toHaveLength(1);
    });

    it("puts the authorized revision's capacity decline on the timeline", async () => {
      // 1E-F5 site B — review-service.ts:632-635, inside `ensureReviewRevision`.
      // A blocking review authorizes exactly one revision; when nothing can take
      // it the review loop stalls, and without this emission it stalls silently.
      //
      // The site is reached through `await import(...)`, which `tsc` resolves
      // statically but no test executed before this one — a path-alias or
      // module-boundary change would break it at runtime with a green suite.
      const task = seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      // Withdraw capacity after the reviewed execution has succeeded, so only the
      // revision is affected.
      for (const agent of [...getDevHqStore().agents.values()]) {
        saveAgent({ ...agent, availability: "busy" });
      }

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      const revisionId = revisionExecutionIdFor(reviewId);
      const revision = (await getExecution(revisionId))!;
      expect(result.revisionExecutionId).toBe(revisionId);
      expect(revision.status).toBe("queued");
      expect(revision.agentId).toBeNull();
      expect(revision.attempt).toBe(1);
      // The site-unique metadata. `revisionOfReviewId` is the review loop's
      // chain link and only `ensureReviewRevision` sets it — the escalation
      // revise path deliberately leaves it unset so a founder revise starts a
      // fresh iteration count. Together with the `exec-review-revision-<reviewId>`
      // namespace, which is built never to collide with the escalation revise
      // namespace, this execution can only have been created by this site.
      expect(revision.revisionOfReviewId).toBe(reviewId);

      const allEvents = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      const deferrals = allEvents.filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred,
      );
      // The whole deferral population by entity, then the message entire — not a
      // count, which a second path sharing the dedupe key could satisfy.
      expect(deferrals.map((e) => e.entityId)).toEqual([revisionId]);
      expect(deferrals[0]!.message).toBe(
        `Execution ${revisionId} could not be assigned an agent for task ${task.id}; it stays queued at attempt 1 for reconciliation to retry.`,
      );
      expect(deferrals[0]!.actorId).toBeNull();
      expect(deferrals[0]!.actorLabel).toBe("System");

      // No other site could have produced it. The reviewed execution succeeded
      // and never deferred; the revision was never assigned, so the dispatch
      // decline never ran; and no reclaim swept in this test.
      expect(deferrals.some((e) => e.entityId === executionId)).toBe(false);
      expect(
        allEvents.filter(
          (e) =>
            e.type === EXECUTION_EVENT_TYPE.assigned &&
            e.entityId === revisionId,
        ),
      ).toHaveLength(0);
      expect(
        allEvents.filter((e) => e.type === EXECUTION_EVENT_TYPE.reclaimed),
      ).toHaveLength(0);
    });
  });

  describe("bounded loop", () => {
    /** Drive one full iteration: succeed the execution, then block its review. */
    async function blockIteration(executionId: string): Promise<string> {
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });
      return result.revisionExecutionId!;
    }

    /** Run a revision execution to success so its own review is requested. */
    async function succeedRevision(executionId: string): Promise<void> {
      freeAllAgents();
      await handleExecutionRunning(executionId);
      await handleExecutionComplete({
        executionId,
        status: "succeeded",
        instructions: "block this",
      });
    }

    it("re-reviews a revision at the next iteration", async () => {
      seedTask();
      const first = await succeedExecution({ instructions: "block this" });
      const revisionId = await blockIteration(first);
      await succeedRevision(revisionId);

      const secondReview = (await getDevHqAdapters().reviewStore.getReview(
        reviewIdFor(revisionId),
      ))!;
      expect(secondReview.iteration).toBe(2);
      expect(secondReview.status).toBe("pending");
      expect(secondReview.callbackToken).not.toBe(
        (await getDevHqAdapters().reviewStore.getReview(reviewIdFor(first)))!
          .callbackToken,
      );
      expect(await getDevHqAdapters().reviewStore.listForTask("task-rv-1")).toHaveLength(2);
    });

    it("escalates exactly once when the iteration budget is spent", async () => {
      seedTask();
      let executionId = await succeedExecution({ instructions: "block this" });

      for (let iteration = 1; iteration < MAX_REVIEW_ITERATIONS; iteration += 1) {
        const revisionId = await blockIteration(executionId);
        await succeedRevision(revisionId);
        executionId = revisionId;
      }

      // The final iteration exhausts the loop rather than authorizing a revision.
      const finalReviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(finalReviewId))!
        .callbackToken!;
      const result = await handleReviewComplete({
        reviewId: finalReviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      expect(result.exhausted).toBe(true);
      expect(result.review.status).toBe("escalated");
      expect(result.review.iteration).toBe(MAX_REVIEW_ITERATIONS);
      expect(result.revisionExecutionId).toBeNull();

      const escalations = [...getDevHqStore().escalations.values()];
      expect(escalations).toHaveLength(1);
      expect(escalations[0]).toMatchObject({
        origin: "review_exhausted",
        executionId,
        reviewId: finalReviewId,
        status: "open",
      });
      expect(
        (await getDevHqAdapters().taskRepository.getTask("task-rv-1"))?.status,
      ).toBe("needs_revision");
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.escalated),
      ).toHaveLength(1);
      // The exhausted review authorized no further execution.
      expect(
        [...getDevHqStore().executions.values()].filter(
          (e) => e.id === revisionExecutionIdFor(finalReviewId),
        ),
      ).toHaveLength(0);
    });

    it("does not escalate before the bound is reached", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      await blockIteration(executionId);

      expect([...getDevHqStore().escalations.values()]).toHaveLength(0);
    });
  });

  describe("reconciliation", () => {
    it("requests a review that was never requested", async () => {
      seedTask();
      const executionId = await succeedExecution();
      // Simulate the completion callback dying before the review was requested.
      getDevHqStore().reviews.clear();
      triggerMock.mockClear();

      const result = await reconcileReviews();

      expect(result.requested).toBe(1);
      expect(
        await getDevHqAdapters().reviewStore.findByExecution(executionId),
      ).not.toBeNull();
      expect(reviewPayloads()).toHaveLength(1);
    });

    it("dispatches a review created but never dispatched", async () => {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);
      // Reinstate the review as created-but-undispatched.
      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      getDevHqStore().reviews.set(reviewId, { ...review, triggerRunId: null });
      triggerMock.mockClear();

      const result = await reconcileReviews();

      expect(result.dispatched).toBe(1);
      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewId))!.triggerRunId,
      ).toBeTruthy();
      // The same reserved token is reused rather than a second one issued.
      expect(reviewPayloads()[0].callbackToken).toBe(review.callbackToken);
    });

    it("re-dispatches a revision whose execution was never created", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      const { revisionExecutionId } = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });
      // Simulate a crash between reserving the revision and creating it.
      getDevHqStore().executions.delete(revisionExecutionId!);

      const result = await reconcileReviews();

      expect(result.revisions).toBe(1);
      const restored = await getExecution(revisionExecutionId!);
      expect(restored).not.toBeNull();
      // The same reserved id, so no second revision is authorized.
      expect(restored!.id).toBe(revisionExecutionIdFor(reviewId));
    });

    it("raises a missing escalation for an exhausted review", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      // An escalated review whose escalation never landed.
      getDevHqStore().reviews.set(reviewId, {
        ...review,
        status: "escalated",
        iteration: MAX_REVIEW_ITERATIONS,
        resolvedAt: TS,
      });

      const result = await reconcileReviews();

      expect(result.escalations).toBe(1);
      const escalations = [...getDevHqStore().escalations.values()];
      expect(escalations).toHaveLength(1);
      expect(escalations[0].origin).toBe("review_exhausted");
    });

    it("is a no-op across repeated sweeps and never advances the loop", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      const reviewsBefore = [...getDevHqStore().reviews.values()].length;
      const executionsBefore = [...getDevHqStore().executions.values()].length;
      const eventsBefore = (await executionEvents(executionId)).length;
      const evidenceBefore = (
        await getDevHqAdapters().evidenceStore.listForExecution(executionId)
      ).length;

      await reconcileReviews();
      await reconcileReviews();
      await reconcileReviews();

      expect([...getDevHqStore().reviews.values()]).toHaveLength(reviewsBefore);
      expect([...getDevHqStore().executions.values()]).toHaveLength(
        executionsBefore,
      );
      expect(await executionEvents(executionId)).toHaveLength(eventsBefore);
      expect(
        await getDevHqAdapters().evidenceStore.listForExecution(executionId),
      ).toHaveLength(evidenceBefore);
      // The iteration is untouched by sweeping.
      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewId))!.iteration,
      ).toBe(1);
      expect([...getDevHqStore().escalations.values()]).toHaveLength(0);
    });

    it("does not review executions dispatched under the none policy", async () => {
      seedTask();
      await succeedExecution({ reviewPolicy: "none" });

      const result = await reconcileReviews();

      expect(result.requested).toBe(0);
      expect([...getDevHqStore().reviews.values()]).toHaveLength(0);
    });
  });

  // B-1: a dispatched review holds no lease, so the response deadline is the only
  // thing standing between a dead reviewer run and a loop that waits forever.
  describe("review liveness", () => {
    const LATER = "2999-01-01T00:00:00.000Z";

    async function stalledReview() {
      seedTask();
      const executionId = await succeedExecution();
      const reviewId = reviewIdFor(executionId);
      triggerMock.mockClear();
      return { executionId, reviewId };
    }

    it("re-dispatches a review that never reported, under a fresh attempt key", async () => {
      const { reviewId } = await stalledReview();
      const before = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;

      const result = await reconcileReviews(LATER);

      expect(result.dispatched).toBe(1);
      const after = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      expect(after.status).toBe("pending");
      expect(after.dispatchAttempts).toBe(2);
      expect(after.triggerRunId).not.toBe(before.triggerRunId);
      // Same review, same capability — a re-dispatch is not a second review.
      expect(after.callbackToken).toBe(before.callbackToken);
      expect([...getDevHqStore().reviews.values()]).toHaveLength(1);
      // The new run is a distinct logical run, keyed by attempt.
      const keys = triggerMock.mock.calls.map(
        (call) => (call[2] as { idempotencyKey?: string } | undefined)?.idempotencyKey,
      );
      expect(keys).toEqual([`${reviewId}:2`]);
    });

    it("leaves a review inside its deadline alone", async () => {
      const { reviewId } = await stalledReview();

      const result = await reconcileReviews();

      expect(result.dispatched).toBe(0);
      expect(triggerMock).not.toHaveBeenCalled();
      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewId))!.dispatchAttempts,
      ).toBe(1);
    });

    it("escalates once the dispatch allowance is spent instead of waiting forever", async () => {
      const { executionId, reviewId } = await stalledReview();

      // Each sweep past the deadline spends one attempt; the last one stops.
      for (let sweep = 0; sweep < MAX_REVIEW_DISPATCH_ATTEMPTS; sweep += 1) {
        await reconcileReviews(LATER);
      }

      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;
      expect(review.status).toBe("escalated");
      expect(review.escalationReason).toBe("reviewer_unresponsive");
      expect(review.dispatchAttempts).toBe(MAX_REVIEW_DISPATCH_ATTEMPTS);

      const escalations = [...getDevHqStore().escalations.values()];
      expect(escalations).toHaveLength(1);
      expect(escalations[0]).toMatchObject({
        origin: "review_exhausted",
        executionId,
        reviewId,
        status: "open",
      });
      expect(escalations[0].summary).toContain("never reported");
      // Escalating at iteration 1 is legitimate for an unresponsive reviewer.
      expect(review.iteration).toBe(1);
      expect(
        (await getDevHqAdapters().taskRepository.getTask("task-rv-1"))?.status,
      ).toBe("needs_revision");
    });

    it("does not re-escalate or re-dispatch an already escalated review", async () => {
      await stalledReview();
      for (let sweep = 0; sweep < MAX_REVIEW_DISPATCH_ATTEMPTS; sweep += 1) {
        await reconcileReviews(LATER);
      }
      triggerMock.mockClear();

      await reconcileReviews(LATER);
      await reconcileReviews(LATER);

      expect([...getDevHqStore().escalations.values()]).toHaveLength(1);
      expect(triggerMock).not.toHaveBeenCalled();
    });

    it("stops chasing a review that reported after a re-dispatch", async () => {
      const { executionId, reviewId } = await stalledReview();
      await reconcileReviews(LATER);
      const review = (await getDevHqAdapters().reviewStore.getReview(reviewId))!;

      // The second run reports with the token every attempt shares.
      await handleReviewComplete({
        reviewId,
        callbackToken: review.callbackToken!,
        outcome: "passed",
      });
      triggerMock.mockClear();

      await reconcileReviews(LATER);

      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewId))!.status,
      ).toBe("passed");
      expect(triggerMock).not.toHaveBeenCalled();
      expect([...getDevHqStore().escalations.values()]).toHaveLength(0);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.passed),
      ).toHaveLength(1);
    });

    it("applies only one outcome however many runs exist", async () => {
      const { reviewId } = await stalledReview();
      await reconcileReviews(LATER);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      // Both the abandoned run and its replacement report; one outcome wins.
      const results = await Promise.all([
        handleReviewComplete({ reviewId, callbackToken: token, outcome: "passed" }),
        handleReviewComplete({
          reviewId,
          callbackToken: token,
          outcome: "changes_requested",
        }),
      ]);

      expect(results.filter((r) => r.applied)).toHaveLength(1);
      const statuses = new Set(results.map((r) => r.review.status));
      expect(statuses.size).toBe(1);
    });
  });

  // B-2: the bound follows the revision chain, not everything the task ever did.
  describe("revision-chain iteration", () => {
    it("counts independent executions on one task as separate first reviews", async () => {
      seedTask();
      const first = await succeedExecution({ idempotencyKey: "chain-a" });
      const second = await succeedExecution({ idempotencyKey: "chain-b" });
      const third = await succeedExecution({ idempotencyKey: "chain-c" });

      const { reviewStore } = getDevHqAdapters();
      for (const executionId of [first, second, third]) {
        expect((await reviewStore.getReview(reviewIdFor(executionId)))!.iteration).toBe(
          1,
        );
      }
      // Three reviews on the task, none of them a revision of another.
      expect(await reviewStore.listForTask("task-rv-1")).toHaveLength(3);
    });

    it("never falsely exhausts a task that accumulated unrelated reviews", async () => {
      seedTask();
      // Two unrelated executions are reviewed first; task-wide counting would
      // make the next blocking review look like iteration 3.
      await succeedExecution({ idempotencyKey: "noise-a" });
      await succeedExecution({ idempotencyKey: "noise-b" });

      const executionId = await succeedExecution({
        instructions: "block this",
        idempotencyKey: "chain-real",
      });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      // Iteration 1 of its own chain: a revision is authorized, not an escalation.
      expect(result.review.iteration).toBe(1);
      expect(result.exhausted).toBe(false);
      expect(result.revisionExecutionId).toBeTruthy();
      expect([...getDevHqStore().escalations.values()]).toHaveLength(0);
    });

    it("links each revision to the review that authorized it", async () => {
      seedTask();
      const first = await succeedExecution({ instructions: "block this" });
      const firstReviewId = reviewIdFor(first);
      const token = (await getDevHqAdapters().reviewStore.getReview(firstReviewId))!
        .callbackToken!;
      const { revisionExecutionId } = await handleReviewComplete({
        reviewId: firstReviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      const revision = (await getExecution(revisionExecutionId!))!;
      expect(revision.revisionOfReviewId).toBe(firstReviewId);

      freeAllAgents();
      await handleExecutionRunning(revision.id);
      await handleExecutionComplete({
        executionId: revision.id,
        status: "succeeded",
        instructions: "block this",
      });

      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewIdFor(revision.id)))!
          .iteration,
      ).toBe(2);
    });
  });

  // M-1: the reviewer runs in a worker with no store access.
  describe("review policy propagation", () => {
    it("carries the policy into the durable review payload", async () => {
      seedTask();
      await succeedExecution({ reviewPolicy: "full" });

      expect(reviewPayloads()[0].policy).toBe("full");
    });

    it("carries the inherited policy into a re-review of a revision", async () => {
      seedTask();
      const executionId = await succeedExecution({
        instructions: "block this",
        reviewPolicy: "full",
      });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      const { revisionExecutionId } = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "full").findings,
      });

      freeAllAgents();
      await handleExecutionRunning(revisionExecutionId!);
      await handleExecutionComplete({
        executionId: revisionExecutionId!,
        status: "succeeded",
        instructions: "block this",
      });

      const payloads = reviewPayloads();
      expect(payloads).toHaveLength(2);
      expect(payloads[1].policy).toBe("full");
      expect(
        (await getDevHqAdapters().reviewStore.getReview(
          reviewIdFor(revisionExecutionId!),
        ))!.policy,
      ).toBe("full");
    });

    it("keeps the same policy across a re-dispatch", async () => {
      seedTask();
      await succeedExecution({ reviewPolicy: "full" });
      await reconcileReviews("2999-01-01T00:00:00.000Z");

      const payloads = reviewPayloads();
      expect(payloads).toHaveLength(2);
      expect(payloads.every((p) => p.policy === "full")).toBe(true);
    });
  });

  // M-2: an interruption must not permanently lose the outcome's descriptive
  // records or the loop step it authorized. A replay recovers it while the review
  // is still pending — and therefore still owed an outcome; once the transition
  // has landed the review is terminal, so recovery belongs to the sweep (R-1).
  describe("interrupted resolution", () => {
    it("recovers a callback interrupted part-way through recording its findings", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore, evidenceStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const findings = simulateReview("block this", "basic").findings;

      // The first attempt wrote a finding's evidence and died before the finding
      // itself, and so before the transition: the review is still pending, and
      // nothing the outcome authorizes has been written yet.
      await evidenceStore.addEvidence({
        executionId,
        taskId: "task-rv-1",
        kind: "review",
        label: `Review finding (${findings[0].severity}): ${findings[0].category}`,
        summary: findings[0].summary,
        uri: `review:${reviewId}:finding:${findings[0].ref}`,
        createdByAgentId: null,
      });
      expect(await reviewStore.listFindings(reviewId)).toHaveLength(0);
      expect((await reviewStore.getReview(reviewId))!.status).toBe("pending");

      // The replay resolves the review and lands every consequence exactly once.
      const replay = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings,
      });

      expect(replay.applied).toBe(true);
      expect(replay.review.status).toBe("changes_requested");
      expect(replay.revisionExecutionId).toBeTruthy();
      expect(await getExecution(replay.revisionExecutionId!)).not.toBeNull();
      expect(await reviewStore.listFindings(reviewId)).toHaveLength(1);
      const evidence = await evidenceStore.listForExecution(executionId);
      // The already-durable finding evidence is reused, not duplicated.
      expect(
        evidence.filter(
          (e) => e.uri === `review:${reviewId}:finding:${findings[0].ref}`,
        ),
      ).toHaveLength(1);
      expect(evidence.some((e) => e.uri === `review:${reviewId}:outcome`)).toBe(
        true,
      );
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.changesRequested),
      ).toHaveLength(1);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.findingRecorded),
      ).toHaveLength(1);
    });

    it("restores them through the sweep when no callback returns", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore, evidenceStore } = getDevHqAdapters();

      await reviewStore.resolveReview({
        reviewId,
        status: "changes_requested",
      });

      const result = await reconcileReviews();

      expect(result.revisions).toBe(1);
      const review = (await reviewStore.getReview(reviewId))!;
      expect(review.revisionExecutionId).toBeTruthy();
      expect(await getExecution(review.revisionExecutionId!)).not.toBeNull();
      const evidence = await evidenceStore.listForExecution(executionId);
      expect(evidence.some((e) => e.uri === `review:${reviewId}:outcome`)).toBe(
        true,
      );
    });

    it("keeps findings when the process dies before the transition", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const findings = simulateReview("block this", "basic").findings;

      // Findings are durable before the guarded transition, so a crash between
      // them loses nothing and the replay still resolves.
      await reviewStore.recordFinding({
        reviewId,
        ref: findings[0].ref,
        severity: findings[0].severity,
        category: findings[0].category,
        summary: findings[0].summary,
      });

      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings,
      });

      expect(result.applied).toBe(true);
      expect(await reviewStore.listFindings(reviewId)).toHaveLength(1);
    });
  });

  // M-3: a founder revise after review exhaustion restarts the loop (ADR-0002 E2).
  describe("revise after review exhaustion", () => {
    async function exhaustReviewLoop() {
      seedTask();
      let executionId = await succeedExecution({ instructions: "block this" });
      for (let iteration = 1; iteration < MAX_REVIEW_ITERATIONS; iteration += 1) {
        const reviewId = reviewIdFor(executionId);
        const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
          .callbackToken!;
        const { revisionExecutionId } = await handleReviewComplete({
          reviewId,
          callbackToken: token,
          outcome: "changes_requested",
          findings: simulateReview("block this", "basic").findings,
        });
        freeAllAgents();
        await handleExecutionRunning(revisionExecutionId!);
        await handleExecutionComplete({
          executionId: revisionExecutionId!,
          status: "succeeded",
          instructions: "block this",
        });
        executionId = revisionExecutionId!;
      }
      const finalReviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(finalReviewId))!
        .callbackToken!;
      await handleReviewComplete({
        reviewId: finalReviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });
      const escalation = [...getDevHqStore().escalations.values()][0];
      return { executionId, finalReviewId, escalation };
    }

    it("restarts the review loop at iteration 1 on revise", async () => {
      const { escalation } = await exhaustReviewLoop();
      const { resolveEscalation, revisionExecutionIdFor } = await import(
        "@/lib/dev-hq/escalation-service"
      );
      freeAllAgents();

      await resolveEscalation(escalation.id, "revise");

      const revisionId = revisionExecutionIdFor(escalation.id);
      const revision = (await getExecution(revisionId))!;
      // The founder's decision resets the counter: the chain link is not carried
      // over, and the policy is, so the fresh execution is reviewed at iteration 1.
      expect(revision.revisionOfReviewId ?? null).toBeNull();
      expect(revision.reviewPolicy).toBe("basic");
      expect(revision.attempt).toBe(1);

      await handleExecutionRunning(revisionId);
      await handleExecutionComplete({
        executionId: revisionId,
        status: "succeeded",
        instructions: "do the work",
      });

      const freshReview = (await getDevHqAdapters().reviewStore.getReview(
        reviewIdFor(revisionId),
      ))!;
      expect(freshReview.iteration).toBe(1);
      expect(freshReview.status).toBe("pending");
    });

    it("allows the restarted loop its own full allowance", async () => {
      const { escalation } = await exhaustReviewLoop();
      const { resolveEscalation, revisionExecutionIdFor } = await import(
        "@/lib/dev-hq/escalation-service"
      );
      freeAllAgents();
      await resolveEscalation(escalation.id, "revise");
      const revisionId = revisionExecutionIdFor(escalation.id);
      await handleExecutionRunning(revisionId);
      await handleExecutionComplete({
        executionId: revisionId,
        status: "succeeded",
        instructions: "block this",
      });

      const reviewId = reviewIdFor(revisionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      const result = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      // A blocking finding in the restarted loop revises again rather than
      // immediately re-escalating.
      expect(result.exhausted).toBe(false);
      expect(result.revisionExecutionId).toBeTruthy();
    });
  });

  // First dispatch under concurrency: one review, one token, one logical run.
  describe("first-dispatch concurrency", () => {
    it("issues one token and one run when requests race", async () => {
      seedTask();
      freeAllAgents();
      const dispatched = await dispatchAgentExecution({
        taskId: "task-rv-1",
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        reviewPolicy: "none",
        idempotencyKey: "race-key",
      });
      const executionId = dispatched.executionId!;
      await handleExecutionRunning(executionId);
      await handleExecutionComplete({
        executionId,
        status: "succeeded",
        instructions: "do the work",
      });
      // Re-open the execution for review by giving it a policy after the fact,
      // so every request below is a genuine first dispatch racing the others.
      const execution = (await getExecution(executionId))!;
      getDevHqStore().executions.set(executionId, {
        ...execution,
        reviewPolicy: "basic",
      });
      triggerMock.mockClear();

      const results = await Promise.all(
        Array.from({ length: 8 }, () => ensureReviewForExecution(executionId)),
      );

      expect(new Set(results.map((r) => r.review?.id)).size).toBe(1);
      expect([...getDevHqStore().reviews.values()]).toHaveLength(1);
      const review = (await getDevHqAdapters().reviewStore.getReview(
        reviewIdFor(executionId),
      ))!;
      // One reserved capability, one dispatch attempt recorded, one logical run.
      expect(review.dispatchAttempts).toBe(1);
      const payloads = reviewPayloads();
      expect(new Set(payloads.map((p) => p.callbackToken))).toEqual(
        new Set([review.callbackToken]),
      );
      expect(
        new Set(
          triggerMock.mock.calls.map(
            (call) =>
              (call[2] as { idempotencyKey?: string } | undefined)?.idempotencyKey,
          ),
        ).size,
      ).toBe(1);
      expect(
        await eventsOfType(executionId, REVIEW_EVENT_TYPE.started),
      ).toHaveLength(1);
    });
  });

  describe("boundaries", () => {
    it("leaves execution state to the Execution Manager", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const before = (await getExecution(executionId))!;
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;

      await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      // The reviewed execution is never mutated by the review loop; the revision
      // is a separate canonical execution.
      expect(await getExecution(executionId)).toEqual(before);
    });

    it("keeps the review iteration off the execution retry budget", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const token = (await getDevHqAdapters().reviewStore.getReview(reviewId))!
        .callbackToken!;
      const { revisionExecutionId } = await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });

      // Two independent counters: review iteration 1, execution attempt 1.
      expect(
        (await getDevHqAdapters().reviewStore.getReview(reviewId))!.iteration,
      ).toBe(1);
      expect((await getExecution(revisionExecutionId!))!.attempt).toBe(1);
    });
  });

  // Evidence uniqueness is a property of the write, not of a preceding read. A
  // read-then-write check cannot hold it: two callbacks both observe no row and
  // both append one, leaving a duplicate that no later replay can collapse.
  describe("evidence uniqueness under concurrency", () => {
    /** Every evidence row this review wrote, in the review's uri namespace. */
    async function reviewEvidence(executionId: string, reviewId: string) {
      const all =
        await getDevHqAdapters().evidenceStore.listForExecution(executionId);
      return all.filter((e) => e.uri?.startsWith(`review:${reviewId}:`));
    }

    it("writes one finding and one evidence row under concurrent callbacks", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const findings = simulateReview("block this", "basic").findings;
      const findingUri = `review:${reviewId}:finding:${findings[0].ref}`;

      // Every caller observes the review as pending and records the same
      // blocking finding before the guarded transition.
      await Promise.all(
        Array.from({ length: 6 }, () =>
          handleReviewComplete({
            reviewId,
            callbackToken: token,
            outcome: "changes_requested",
            findings,
          }),
        ),
      );

      expect(await reviewStore.listFindings(reviewId)).toHaveLength(1);
      const evidence = await reviewEvidence(executionId, reviewId);
      expect(evidence.filter((e) => e.uri === findingUri)).toHaveLength(1);
      expect(
        evidence.filter((e) => e.uri === `review:${reviewId}:outcome`),
      ).toHaveLength(1);
    });

    it("leaves no orphaned duplicate evidence behind", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const findings = simulateReview("block this", "full").findings;

      await Promise.all(
        Array.from({ length: 4 }, () =>
          handleReviewComplete({
            reviewId,
            callbackToken: token,
            outcome: "changes_requested",
            findings,
          }),
        ),
      );

      const evidence = await reviewEvidence(executionId, reviewId);
      // One row per logical uri: no unreferenced twin of any of them.
      expect(new Set(evidence.map((e) => e.uri)).size).toBe(evidence.length);

      // And every finding still points at a row that exists.
      const recorded = await reviewStore.listFindings(reviewId);
      expect(recorded).toHaveLength(findings.length);
      for (const finding of recorded) {
        expect(finding.evidenceId).toBeTruthy();
        expect(
          evidence.some((e) => e.id === finding.evidenceId),
        ).toBe(true);
      }
    });

    it("adds no evidence when the same callback is replayed", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const findings = simulateReview("block this", "basic").findings;
      const callback = {
        reviewId,
        callbackToken: token,
        outcome: "changes_requested" as const,
        findings,
      };

      await handleReviewComplete(callback);
      const before = await reviewEvidence(executionId, reviewId);

      await handleReviewComplete(callback);
      await handleReviewComplete(callback);

      // Stable identity, not merely a stable count.
      expect(await reviewEvidence(executionId, reviewId)).toEqual(before);
    });

    it("keeps outcome evidence at exactly one across repeated sweeps", async () => {
      seedTask();
      const executionId = await succeedExecution({ instructions: "block this" });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;

      await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings: simulateReview("block this", "basic").findings,
      });
      await reconcileReviews();
      await reconcileReviews();

      const evidence = await reviewEvidence(executionId, reviewId);
      expect(
        evidence.filter((e) => e.uri === `review:${reviewId}:outcome`),
      ).toHaveLength(1);
    });

    it("still records distinct evidence for distinct finding uris", async () => {
      seedTask();
      const executionId = await succeedExecution({
        instructions: "block this",
        reviewPolicy: "full",
      });
      const reviewId = reviewIdFor(executionId);
      const { reviewStore } = getDevHqAdapters();
      const token = (await reviewStore.getReview(reviewId))!.callbackToken!;
      const findings = simulateReview("block this", "full").findings;
      expect(findings.length).toBeGreaterThan(1);

      await handleReviewComplete({
        reviewId,
        callbackToken: token,
        outcome: "changes_requested",
        findings,
      });

      const evidence = await reviewEvidence(executionId, reviewId);
      for (const finding of findings) {
        expect(
          evidence.filter(
            (e) => e.uri === `review:${reviewId}:finding:${finding.ref}`,
          ),
        ).toHaveLength(1);
      }
      // Deduping must not collapse genuinely different uris onto one row.
      expect(new Set(evidence.map((e) => e.id)).size).toBe(
        findings.length + 1, // each finding, plus the outcome
      );
    });
  });
});
