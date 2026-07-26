import type {
  Review,
  ReviewEscalationReason,
  ReviewFinding,
  ReviewFindingSeverity,
  ReviewPolicy,
  ReviewStatus,
  IsoTimestamp,
} from "@/types/domain";

export interface CreateReviewInput {
  /** Canonical, caller-derived review id. Opaque to the store. */
  reviewId: string;
  taskId: string;
  executionId: string;
  /** 1-based position in the task's review loop, decided by the caller. */
  iteration: number;
  policy: ReviewPolicy;
  reviewerAgentId?: string | null;
  /** Stamped as createdAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

export interface ResolveReviewInput {
  reviewId: string;
  status: Exclude<ReviewStatus, "pending">;
  /** Required when resolving as `escalated`; recorded for the audit trail. */
  escalationReason?: ReviewEscalationReason;
  /** Stamped as resolvedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

export interface RecordReviewFindingInput {
  reviewId: string;
  /**
   * Stable per-review reference for this finding. It is what makes the finding's
   * identity deterministic, so a replayed callback records the same finding
   * instead of appending a duplicate.
   */
  ref: string;
  severity: ReviewFindingSeverity;
  category: string;
  summary: string;
  evidenceId?: string | null;
  at?: IsoTimestamp;
}

export interface ReserveReviewTokenInput {
  reviewId: string;
  /** The token to reserve. Opaque to the store. */
  token: string;
}

export interface ReserveReviewRevisionInput {
  reviewId: string;
  /** The canonical execution id to reserve. Opaque to the store. */
  executionId: string;
}

export interface RecordReviewDispatchInput {
  reviewId: string;
  triggerRunId: string;
  /** Stamped as dispatchedAt, starting this attempt's response deadline. */
  at?: IsoTimestamp;
}

/**
 * Durable store for the review loop (ADR-0002 E1). Every mutation is either a
 * keyed create-or-get or a guarded transition, so the service can be replayed,
 * reconciled, and called concurrently without producing duplicate reviews,
 * findings, tokens, revisions, or dispatches.
 */
export interface ReviewStore {
  getReview(id: string): Promise<Review | null>;
  /** The review of a specific execution, or null. One review per execution. */
  findByExecution(executionId: string): Promise<Review | null>;
  /** Every review in a task's loop, oldest iteration first. */
  listForTask(taskId: string): Promise<Review[]>;
  /** Reviews still awaiting an outcome. */
  listPending(): Promise<Review[]>;

  /**
   * Create the review at the caller's canonical id, or return the existing one
   * unchanged. First caller wins; the check and the insert are synchronous with
   * no await between them, so concurrent callers cannot both insert and a second
   * review for the same execution is not representable.
   */
  createReview(input: CreateReviewInput): Promise<Review>;

  /**
   * Resolve only while the review is still pending, returning null when it is
   * missing or already resolved. This is the guarded transition the service uses
   * to make a duplicate callback a no-op rather than a second resolution.
   */
  resolveReview(input: ResolveReviewInput): Promise<Review | null>;

  /**
   * Append a finding, keyed by `(reviewId, ref)`. An already-recorded finding is
   * returned unchanged, so replays converge instead of duplicating.
   */
  recordFinding(input: RecordReviewFindingInput): Promise<ReviewFinding>;
  listFindings(reviewId: string): Promise<ReviewFinding[]>;

  /**
   * Reserve the callback capability, only if unset. Returns the reserved token:
   * the supplied value when this call won, the already-persisted value otherwise.
   * Never overwrites, so every concurrent caller and every replay hands out the
   * same token — which is what lets the callback be validated against durable
   * state rather than trusted. Throws when the review does not exist.
   */
  reserveCallbackToken(input: ReserveReviewTokenInput): Promise<string>;

  /**
   * Reserve the canonical revision execution id, only if unset, with the same
   * once-only semantics as the escalation revise boundary. Throws when the review
   * does not exist.
   */
  reserveRevisionExecution(
    input: ReserveReviewRevisionInput,
  ): Promise<string>;

  /**
   * Record a confirmed dispatch: the run, the moment its deadline starts, and one
   * more attempt against the allowance. Applies only while the review is pending,
   * so a run confirmed after an outcome landed cannot reopen the deadline or
   * inflate the count.
   */
  recordDispatch(input: RecordReviewDispatchInput): Promise<Review | null>;

  /**
   * Reviews that were dispatched but have not reported by `deadline`. This is the
   * liveness query: a review holds no lease, so without it a reviewer run that
   * dies silently would leave the loop pending forever.
   */
  listUnresponsive(deadline: IsoTimestamp): Promise<Review[]>;
}
