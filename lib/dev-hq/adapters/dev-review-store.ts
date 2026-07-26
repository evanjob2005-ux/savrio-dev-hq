import type {
  CreateReviewInput,
  RecordReviewDispatchInput,
  RecordReviewFindingInput,
  ReserveReviewRevisionInput,
  ReserveReviewTokenInput,
  ResolveReviewInput,
  ReviewStore,
} from "@/types/contracts";
import type { Review, ReviewFinding } from "@/types/domain";
import {
  getDevHqStore,
  getReview,
  saveReview,
  saveReviewFinding,
} from "@/lib/dev-hq/store";
import { nowIso } from "@/lib/dev-hq/id";

/**
 * Development-only in-memory ReviewStore adapter (Task 1E-6), following the
 * EscalationStore conventions: keyed create-or-get, guarded transitions, and
 * reserve-once fields, each performed synchronously so concurrent callers cannot
 * interleave between a check and its write.
 */
export class DevReviewStore implements ReviewStore {
  async getReview(id: string): Promise<Review | null> {
    return getReview(id);
  }

  async findByExecution(executionId: string): Promise<Review | null> {
    return (
      [...getDevHqStore().reviews.values()].find(
        (review) => review.executionId === executionId,
      ) ?? null
    );
  }

  async listForTask(taskId: string): Promise<Review[]> {
    return [...getDevHqStore().reviews.values()]
      .filter((review) => review.taskId === taskId)
      .sort((a, b) => a.iteration - b.iteration);
  }

  async listPending(): Promise<Review[]> {
    return [...getDevHqStore().reviews.values()]
      .filter((review) => review.status === "pending")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async createReview(input: CreateReviewInput): Promise<Review> {
    const store = getDevHqStore();
    // Create-or-get at the caller's canonical id. The read and the write are
    // synchronous with no await between them, so a repeated request — from a
    // replay, a reconciliation sweep, or a concurrent caller — returns the
    // existing review rather than creating a second one for the same execution.
    const existing = store.reviews.get(input.reviewId);
    if (existing) {
      return existing;
    }
    return saveReview({
      id: input.reviewId,
      taskId: input.taskId,
      executionId: input.executionId,
      iteration: input.iteration,
      policy: input.policy,
      status: "pending",
      reviewerAgentId: input.reviewerAgentId ?? null,
      callbackToken: null,
      triggerRunId: null,
      dispatchedAt: null,
      dispatchAttempts: 0,
      escalationReason: null,
      revisionExecutionId: null,
      createdAt: input.at ?? nowIso(),
      resolvedAt: null,
    });
  }

  async resolveReview(input: ResolveReviewInput): Promise<Review | null> {
    const existing = getReview(input.reviewId);
    // Guarded transition: only a pending review resolves. A duplicate callback
    // therefore performs no second resolution, and the service can tell the
    // difference from the null return.
    if (!existing || existing.status !== "pending") {
      return null;
    }
    return saveReview({
      ...existing,
      status: input.status,
      escalationReason:
        input.status === "escalated" ? (input.escalationReason ?? null) : null,
      resolvedAt: input.at ?? nowIso(),
    });
  }

  async recordFinding(input: RecordReviewFindingInput): Promise<ReviewFinding> {
    const store = getDevHqStore();
    const id = findingIdFor(input.reviewId, input.ref);
    const existing = store.reviewFindings.get(id);
    if (existing) {
      return existing;
    }
    return saveReviewFinding({
      id,
      reviewId: input.reviewId,
      severity: input.severity,
      category: input.category,
      summary: input.summary,
      evidenceId: input.evidenceId ?? null,
      recordedAt: input.at ?? nowIso(),
    });
  }

  async listFindings(reviewId: string): Promise<ReviewFinding[]> {
    return [...getDevHqStore().reviewFindings.values()]
      .filter((finding) => finding.reviewId === reviewId)
      .sort((a, b) => a.id.localeCompare(b.id));
  }

  async reserveCallbackToken(input: ReserveReviewTokenInput): Promise<string> {
    const existing = getReview(input.reviewId);
    if (!existing) {
      throw new Error(`Review not found: ${input.reviewId}`);
    }
    // Reserve-once. The first caller writes; every later one reads the persisted
    // token and returns it unchanged, so all dispatches of this review hand out
    // one capability and the callback can be checked against durable state.
    if (existing.callbackToken) {
      return existing.callbackToken;
    }
    saveReview({ ...existing, callbackToken: input.token });
    return input.token;
  }

  async reserveRevisionExecution(
    input: ReserveReviewRevisionInput,
  ): Promise<string> {
    const existing = getReview(input.reviewId);
    if (!existing) {
      throw new Error(`Review not found: ${input.reviewId}`);
    }
    if (existing.revisionExecutionId) {
      return existing.revisionExecutionId;
    }
    saveReview({ ...existing, revisionExecutionId: input.executionId });
    return input.executionId;
  }

  async recordDispatch(
    input: RecordReviewDispatchInput,
  ): Promise<Review | null> {
    const existing = getReview(input.reviewId);
    if (!existing) {
      return null;
    }
    // A resolved review is finished; a late run confirmation must not restart its
    // deadline or spend another attempt against the allowance.
    if (existing.status !== "pending") {
      return existing;
    }
    // The run *is* the dispatch. Concurrent first dispatches all collapse onto one
    // logical run at Trigger and then all report it here; counting each report
    // would spend the whole allowance on a race rather than on an unresponsive
    // reviewer. Recording the same run twice is therefore a no-op.
    if (existing.triggerRunId === input.triggerRunId) {
      return existing;
    }
    return saveReview({
      ...existing,
      triggerRunId: input.triggerRunId,
      dispatchedAt: input.at ?? nowIso(),
      dispatchAttempts: existing.dispatchAttempts + 1,
    });
  }

  async listUnresponsive(deadline: string): Promise<Review[]> {
    const cutoff = new Date(deadline).getTime();
    return [...getDevHqStore().reviews.values()]
      .filter(
        (review) =>
          review.status === "pending" &&
          review.dispatchedAt !== null &&
          new Date(review.dispatchedAt).getTime() <= cutoff,
      )
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }
}

/** Deterministic finding identity, so a replayed callback cannot duplicate one. */
export function findingIdFor(reviewId: string, ref: string): string {
  return `rvf-${reviewId}-${ref}`;
}

export function createDevReviewStore(): DevReviewStore {
  return new DevReviewStore();
}
