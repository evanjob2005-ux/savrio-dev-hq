import type { EntityId, IsoTimestamp } from "./common";

/**
 * How thoroughly a completed agent execution is quality-checked (ADR-0002 E1,
 * resolving D-E2).
 *
 *   - `none`  — skip review; a successful execution is final.
 *   - `basic` — one deterministic review lens, subject to the revision loop (E6).
 *   - `full`  — multiple deterministic lenses evaluated within a single review
 *               iteration, subject to the same loop.
 *
 * New agent executions default to `basic`. The founder-request path never
 * dispatches agent executions, so it carries no policy at all.
 */
export type ReviewPolicy = "none" | "basic" | "full";

/**
 * Lifecycle of one review iteration.
 *
 *   pending            -> dispatched, awaiting the reviewer's callback
 *   passed             -> accepted; the review loop ends here
 *   changes_requested  -> a blocking finding; one revision execution is authorized
 *   escalated          -> the bounded loop is spent; the founder decides
 *
 * `passed`, `changes_requested`, and `escalated` are terminal for the review
 * record itself; only `changes_requested` continues the loop.
 */
export type ReviewStatus =
  | "pending"
  | "passed"
  | "changes_requested"
  | "escalated";

/**
 * Why a review ended in escalation rather than an outcome.
 *
 *   - `iterations_exhausted`   — the bounded revision loop is spent (E6).
 *   - `reviewer_unresponsive`  — the reviewer never reported, through enough
 *                                re-dispatches that waiting longer is not
 *                                recovery, it is a stall.
 *
 * Both terminate the loop in the same founder escalation; the reason is what
 * makes the audit record and the escalation precondition honest about which
 * happened.
 */
export type ReviewEscalationReason =
  | "iterations_exhausted"
  | "reviewer_unresponsive";

/** What the reviewer may report. `escalated` is never reported — it is decided. */
export type ReviewOutcome = Extract<
  ReviewStatus,
  "passed" | "changes_requested"
>;

/**
 * `blocking` requires a revision; `advisory` is recorded but does not by itself
 * continue the loop (ADR-0002 E1, D-E4).
 */
export type ReviewFindingSeverity = "blocking" | "advisory";

export interface ReviewFinding {
  /**
   * Deterministic: derived from the review and the finding's stable reference, so
   * a replayed callback records the same finding rather than a duplicate.
   */
  id: EntityId;
  reviewId: EntityId;
  severity: ReviewFindingSeverity;
  category: string;
  summary: string;
  /** The evidence record carrying the finding, when one was written. */
  evidenceId: EntityId | null;
  recordedAt: IsoTimestamp;
}

/**
 * One iteration of the review loop over a completed execution (ADR-0002 E1/E6).
 *
 * Identity is deterministic and derived from the execution under review, so every
 * request, retry, reconciliation sweep, and duplicate callback converges on the
 * same logical review instead of creating a second one.
 *
 * `iteration` counts position in *this revision chain* — the chain of executions
 * linked by the reviews that authorized them — not reviews of the task at large.
 * A task may carry several unrelated executions, and counting those would exhaust
 * a loop that never actually revised anything. It is assigned once at creation
 * and never recomputed, so waiting, replays, and sweeps cannot consume the bound.
 */
export interface Review {
  id: EntityId;
  taskId: EntityId;
  /** The completed execution this review judges. One review per execution. */
  executionId: EntityId;
  /**
   * 1-based position in this revision chain: 1 for the first review of an
   * execution nobody revised into existence, otherwise the authorizing review's
   * iteration plus one. Fixed at creation.
   */
  iteration: number;
  /** The policy the reviewed execution carried, copied so the record is complete. */
  policy: ReviewPolicy;
  status: ReviewStatus;
  /**
   * The registry agent credited with the review. Attribution only: reviews do not
   * claim execution capacity, so this is not an `AgentAssignment` and confers no
   * lease (see the review-service note on why the reviewer does not claim).
   */
  reviewerAgentId: EntityId | null;
  /**
   * The capability a callback must present to transition this review. Reserved
   * once, before dispatch, and validated against this field — so a callback from
   * a prior iteration, another review, or an unauthorized caller cannot advance
   * the lifecycle.
   */
  callbackToken: string | null;
  /**
   * The most recent dispatched Trigger run, or null while undispatched.
   *
   * A review may be dispatched more than once — a reviewer run can die without
   * ever reporting, and nothing else would free it — so this is the *current*
   * run, not a once-only boundary. Exactly-once is preserved elsewhere and does
   * not depend on this field: each attempt triggers under its own idempotency
   * key, every attempt shares one callback token, and resolution is a guarded
   * transition, so however many runs exist at most one outcome is ever applied.
   */
  triggerRunId: string | null;
  /** When the current dispatch happened. The response deadline runs from here. */
  dispatchedAt: IsoTimestamp | null;
  /**
   * How many times this review has been dispatched. Bounded: once the allowance
   * is spent the review escalates as `reviewer_unresponsive` rather than being
   * re-dispatched forever.
   */
  dispatchAttempts: number;
  /** Why the review escalated, when it did. Null otherwise. */
  escalationReason: ReviewEscalationReason | null;
  /**
   * The single canonical Execution a `changes_requested` outcome authorized, or
   * null. Reserved atomically *before* that execution is created, so a creation
   * failure can neither strand an unlinked execution nor permit a second one on
   * replay. Treat the value as an opaque execution id.
   */
  revisionExecutionId: EntityId | null;
  createdAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
}

/**
 * Fields on `Review` that are internal capabilities rather than facts about the
 * review, and must never leave the server.
 *
 * A capability is not a display field: anything holding `callbackToken` can
 * resolve the review, so publishing it through a read model would let any reader
 * of that model decide an outcome. It stays on the domain type — internal
 * authorization is validated against it — and is removed at the boundary
 * instead.
 *
 * Adding a secret to `Review` means adding it here, which is what makes the
 * omission structural rather than a habit: `PublicReview` and `toPublicReview`
 * are both derived from this union, so a new secret is excluded by construction.
 */
export type ReviewSecretField = "callbackToken";

/**
 * The read-model projection of a `Review`: everything Mission Control renders,
 * with no internal callback capability.
 *
 * This is the only review shape that belongs in `DevHqState`, in an API
 * response, or in anything else a browser can read. Derived from `Review` rather
 * than declared independently, so a new *public* field reaches the read model
 * automatically while a new *secret* one cannot.
 *
 * **The `?: never` half is load-bearing — do not simplify it away.** A bare
 * `Omit<Review, ReviewSecretField>` enforces nothing: `Review` is structurally
 * assignable to it, so `reviews: [...store.reviews.values()]` would compile and
 * leak exactly as before. Restating each secret as optional-`never` is what makes
 * a raw `Review` a type error, and so what makes the projection the only way
 * through.
 */
export type PublicReview = Omit<Review, ReviewSecretField> & {
  [K in ReviewSecretField]?: never;
};
