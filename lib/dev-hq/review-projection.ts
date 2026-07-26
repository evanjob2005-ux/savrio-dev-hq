// Review read-model projection (Task 1E-6). The single boundary between the
// internal Review domain object and everything a browser can read.
//
// Why a projection rather than a narrower domain type: `callbackToken` is the
// capability the internal callback is *validated against*, so the field has to
// exist on the persisted record. What must not happen is its publication. The
// domain type therefore keeps it and the boundary removes it, which is also why
// nothing here weakens internal authorization — the store, the service, and the
// callback route all continue to read the full `Review`.
//
// Every read model goes through this function: `buildDevHqState` (and so the
// StateReader adapter, `/api/dev-hq/state`, and Mission Control polling) and the
// internal callback response. A `Review` reaching a response by any other route
// is the bug this module exists to make hard.

import type { PublicReview, Review } from "@/types/domain";

/**
 * Project a Review onto its public read model, omitting every internal
 * capability.
 *
 * Built by explicit enumeration rather than by deleting keys, so the omission
 * cannot be defeated by a spread that someone adds later. The annotation is what
 * enforces it: `PublicReview` is `Omit<Review, ReviewSecretField>`, so TypeScript
 * rejects this literal if it ever *includes* a secret field, and rejects it just
 * as loudly if a newly added public field is *missing*. Extending `Review` forces
 * an explicit decision here about which side of the boundary the new field is on.
 */
export function toPublicReview(review: Review): PublicReview {
  const projected: PublicReview = {
    id: review.id,
    taskId: review.taskId,
    executionId: review.executionId,
    iteration: review.iteration,
    policy: review.policy,
    status: review.status,
    reviewerAgentId: review.reviewerAgentId,
    triggerRunId: review.triggerRunId,
    dispatchedAt: review.dispatchedAt,
    dispatchAttempts: review.dispatchAttempts,
    escalationReason: review.escalationReason,
    revisionExecutionId: review.revisionExecutionId,
    createdAt: review.createdAt,
    resolvedAt: review.resolvedAt,
  };
  return projected;
}

/** The list form, for read models that carry every review. */
export function toPublicReviews(reviews: Review[]): PublicReview[] {
  return reviews.map(toPublicReview);
}
