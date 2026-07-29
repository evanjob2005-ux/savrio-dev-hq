// Review service (Task 1E-6). Owns the review-iteration loop described by
// ADR-0002 E1/E6: it quality-checks completed agent executions, records findings
// as durable state and evidence, authorizes one revision execution per blocking
// outcome, and terminates in a single founder escalation when the bounded loop is
// spent.
//
// Ownership boundaries this module respects:
//   - The Execution Manager owns execution state transitions and the *execution*
//     retry budget. This service never mutates an execution; it asks the manager
//     for a canonical revision execution and asks the dispatch service to run it.
//   - The escalation service owns escalations. This service establishes that the
//     loop is exhausted and asks for the escalation; it does not create one.
//   - The review-iteration counter lives on the review records and nowhere else,
//     so the two loops never conflate (E6).
//
// Determinism rules that make replay safe:
//   - a review's identity is derived from the execution it judges, so repeated
//     requests converge instead of creating a second review;
//   - the iteration is fixed at creation, so waiting, sweeps, and duplicate
//     callbacks cannot consume the bound;
//   - the callback token is reserved once, before dispatch, and validated against
//     durable state;
//   - only a pending review accepts an outcome, so a callback that arrives after
//     the review is terminal records nothing at all;
//   - resolution is a guarded transition, so two callers that both observed the
//     review as pending still produce one outcome, with no second event, evidence
//     record, revision, or escalation.

import { tasks } from "@trigger.dev/sdk";
import type {
  Execution,
  Review,
  ReviewFinding,
  ReviewFindingSeverity,
  ReviewOutcome,
  ReviewPolicy,
} from "@/types/domain";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { ensureAssignment, ensureExecution } from "@/lib/dev-hq/execution-manager";
import { getDevHqStore } from "@/lib/dev-hq/store";
import { hasCapabilities, listAgents } from "@/lib/dev-hq/agent-registry";
import {
  MAX_REVIEW_DISPATCH_ATTEMPTS,
  MAX_REVIEW_ITERATIONS,
  REVIEW_EVENT_TYPE,
  REVIEW_RESPONSE_DEADLINE_MS,
} from "@/lib/dev-hq/constants";
import { nextCapabilityToken, nowIso } from "@/lib/dev-hq/id";

export const AGENT_REVIEW_TASK_ID = "agent-review";

export interface AgentReviewTaskPayload {
  reviewId: string;
  executionId: string;
  taskId: string;
  /** The capability this run must present to report an outcome. */
  callbackToken: string;
  /**
   * The policy the reviewed execution was dispatched under. Carried in the
   * payload because the reviewer runs in a worker with no access to the store:
   * without it every review would silently fall back to a single lens, and a
   * `full` policy would mean nothing.
   */
  policy: ReviewPolicy;
  /** The material under review; the simulated reviewer derives its outcome from it. */
  instructions: string;
}

/**
 * The canonical Review id for an execution.
 *
 * **This function is the only place in the system that knows this encoding.**
 * Everything else treats the value as an opaque review id. Deterministic rather
 * than allocated, so it is stable across every failure and replay without an
 * allocation step, and one execution can never accumulate two reviews.
 */
export function reviewIdFor(executionId: string): string {
  return `rvw-${executionId}`;
}

/**
 * The canonical Execution id a `changes_requested` review authorizes.
 *
 * **Only this function knows this encoding.** Deliberately distinct from the
 * escalation revise namespace (`exec-revision-<escalationId>`): the two loops
 * authorize revisions independently and must never collide on an id.
 */
export function revisionExecutionIdFor(reviewId: string): string {
  return `exec-review-revision-${reviewId}`;
}

// --- deterministic simulated reviewer ----------------------------------------

export interface SimulatedReviewFinding {
  ref: string;
  severity: ReviewFindingSeverity;
  category: string;
  summary: string;
}

export interface SimulatedReview {
  outcome: ReviewOutcome;
  findings: SimulatedReviewFinding[];
}

/**
 * Deterministic review outcome from the material under review (ADR-0002 E1,
 * D-E4). No AI and no code execution: `/block/i` produces a blocking finding and
 * requires revision, `/revise/i` produces an advisory note that does not by
 * itself continue the loop, and anything else passes.
 *
 * A `full` policy evaluates several lenses in the same iteration; `basic`
 * evaluates one. Both are subject to the same loop, so the policy changes how
 * much is recorded, never how the loop terminates.
 */
export function simulateReview(
  instructions: string,
  policy: ReviewPolicy,
): SimulatedReview {
  const lenses =
    policy === "full"
      ? ["correctness", "reliability", "maintainability"]
      : ["correctness"];

  if (/block/i.test(instructions)) {
    return {
      outcome: "changes_requested",
      findings: lenses.map((category, index) => ({
        ref: `blocking-${index + 1}`,
        severity: "blocking" as const,
        category,
        summary: `Blocking ${category} finding: the material under review requests changes.`,
      })),
    };
  }

  if (/revise/i.test(instructions)) {
    return {
      outcome: "passed",
      findings: lenses.map((category, index) => ({
        ref: `advisory-${index + 1}`,
        severity: "advisory" as const,
        category,
        summary: `Advisory ${category} note: recorded, no revision required.`,
      })),
    };
  }

  return { outcome: "passed", findings: [] };
}

// --- internal helpers ---------------------------------------------------------

/**
 * The agent credited with a review. Attribution only, and deliberately not a
 * capacity claim: Phase 1 capacity (ADR-0001) is one *execution* per agent, and
 * making a simulated review compete for that capacity would let review work
 * starve the executions it exists to check. Selection is therefore by capability
 * and stable id order, independent of availability.
 */
function selectReviewer(): string | null {
  return (
    listAgents()
      .filter((agent) => hasCapabilities(agent, ["review"]))
      .sort((a, b) => a.id.localeCompare(b.id))[0]?.id ?? null
  );
}

async function logReviewEvent(input: {
  type: string;
  review: Review;
  message: string;
  dedupeKey: string;
}): Promise<void> {
  const { eventLogger } = getDevHqAdapters();
  const actorId = input.review.reviewerAgentId;
  const agent = actorId
    ? (getDevHqStore().agents.get(actorId) ?? null)
    : null;
  await eventLogger.log({
    type: input.type,
    // Reviews are recorded against the execution they judge, which is what the
    // execution timeline (E5) merges on.
    entityType: "execution",
    entityId: input.review.executionId,
    message: input.message,
    actorId,
    actorLabel: agent?.name ?? "Review service",
    dedupeKey: input.dedupeKey,
  });
}

/**
 * Append-only evidence for a review, keyed on a stable per-review uri.
 *
 * The uniqueness is the store's, not this function's: two callbacks that both
 * observe a pending review both reach here, and a read-then-write check would
 * let both pass the read before either wrote. `ensureEvidence` decides the uri
 * and the insert in one indivisible step instead, so the loser is handed the
 * winner's row — which is also what keeps `ReviewFinding.evidenceId` pointing at
 * a row that exists, on the first pass and on every replay.
 */
async function ensureReviewEvidence(input: {
  review: Review;
  ref: string;
  label: string;
  summary: string;
}): Promise<string | null> {
  const { evidenceStore } = getDevHqAdapters();
  const evidence = await evidenceStore.ensureEvidence({
    executionId: input.review.executionId,
    taskId: input.review.taskId,
    kind: "review",
    label: input.label,
    summary: input.summary,
    uri: `review:${input.review.id}:${input.ref}`,
    createdByAgentId: input.review.reviewerAgentId,
  });
  return evidence.id;
}

/** Instructions the reviewer judges: the execution's authorized request. */
function reviewInstructions(execution: Execution): string {
  const stored = (execution.request?.instructions ?? "").trim();
  if (stored) return stored;
  const task = getDevHqStore().tasks.get(execution.taskId);
  return (task?.description ?? "").trim() || "Review the completed work.";
}

/**
 * This execution's position in its revision chain: one more than the review that
 * authorized it, or 1 when nothing did. A broken link (the authorizing review is
 * gone) restarts at 1 rather than guessing, which fails open — toward reviewing —
 * instead of toward false exhaustion.
 */
async function chainIteration(execution: Execution): Promise<number> {
  const parentId = execution.revisionOfReviewId ?? null;
  if (!parentId) return 1;
  const parent = await getDevHqAdapters().reviewStore.getReview(parentId);
  return parent ? parent.iteration + 1 : 1;
}

// --- review creation and dispatch ---------------------------------------------

export interface EnsureReviewResult {
  review: Review | null;
  /** Why no review exists, when one was not created. */
  reason:
    | "reviewed"
    | "policy_none"
    | "execution_not_reviewable"
    | "execution_not_found";
}

/**
 * Ensure the review of a succeeded execution exists and is dispatched.
 *
 * Idempotent in every direction: the canonical id makes a repeated request return
 * the same review, the token is reserved once, and the dispatch is keyed on the
 * review so concurrent callers and replays collapse onto one logical run. Safe to
 * call from the completion callback and from reconciliation.
 */
export async function ensureReviewForExecution(
  executionId: string,
): Promise<EnsureReviewResult> {
  const execution = getDevHqStore().executions.get(executionId) ?? null;
  if (!execution) {
    return { review: null, reason: "execution_not_found" };
  }
  // Only completed work is reviewable, and only under a policy that asks for it.
  if (execution.status !== "succeeded") {
    return { review: null, reason: "execution_not_reviewable" };
  }
  const policy = execution.reviewPolicy ?? null;
  if (!policy || policy === "none") {
    return { review: null, reason: "policy_none" };
  }

  const { reviewStore } = getDevHqAdapters();
  const reviewId = reviewIdFor(execution.id);

  // The iteration is decided once, at creation, from *this execution's revision
  // chain* — the review that authorized it, if any — never from the task's review
  // count. A task can carry several unrelated executions (two manual dispatches,
  // a founder revise), and counting those would exhaust a loop that had not
  // revised anything. Because creation is a keyed create-or-get, a replay never
  // recomputes it, so sweeps and duplicate requests cannot advance the bound.
  const existing = await reviewStore.getReview(reviewId);
  const iteration = existing?.iteration ?? (await chainIteration(execution));

  const review = await reviewStore.createReview({
    reviewId,
    taskId: execution.taskId,
    executionId: execution.id,
    iteration,
    policy,
    reviewerAgentId: selectReviewer(),
  });

  await dispatchReview(review, reviewInstructions(execution));
  return { review: await reviewStore.getReview(reviewId), reason: "reviewed" };
}

/**
 * Dispatch the durable reviewer run for a pending review.
 *
 * The token is reserved *before* the run is triggered, so the capability exists
 * durably before it is handed out and a crash between the two leaves a review a
 * later sweep can dispatch with the same token.
 *
 * **Exactly-once is not the dispatch's job.** A reviewer run can die without ever
 * reporting, and a review holds no lease, so recovery has to be able to dispatch
 * again — `force` is how the liveness sweep does that. What keeps the outcome
 * exactly-once regardless of how many runs exist: every attempt shares the one
 * reserved token, and resolution is a guarded transition, so the first outcome to
 * arrive is the only one applied. Within an attempt, Trigger's idempotency key —
 * the review id plus the attempt number — collapses concurrent triggers to a
 * single logical run.
 */
async function dispatchReview(
  review: Review,
  instructions: string,
  options?: { force?: boolean },
): Promise<string | null> {
  // Single-flight per review: concurrent callers await one dispatch rather than
  // racing between the triggerRunId check and the record. An optimization, not
  // the boundary — Trigger's per-attempt idempotency key and the store's
  // run-identity check remain authoritative across processes.
  const inFlight = dispatchesInFlight.get(review.id);
  if (inFlight) return inFlight;

  const dispatch = performReviewDispatch(review, instructions, options).finally(
    () => {
      dispatchesInFlight.delete(review.id);
    },
  );
  dispatchesInFlight.set(review.id, dispatch);
  return dispatch;
}

const dispatchesInFlight = new Map<string, Promise<string | null>>();

async function performReviewDispatch(
  review: Review,
  instructions: string,
  options?: { force?: boolean },
): Promise<string | null> {
  const { reviewStore } = getDevHqAdapters();
  if (review.status !== "pending") return null;
  if (review.triggerRunId && !options?.force) return review.triggerRunId;

  const callbackToken = await reviewStore.reserveCallbackToken({
    reviewId: review.id,
    token: nextCapabilityToken("rvt"),
  });

  const attempt = review.dispatchAttempts + 1;
  const handle = await tasks.trigger(
    AGENT_REVIEW_TASK_ID,
    {
      reviewId: review.id,
      executionId: review.executionId,
      taskId: review.taskId,
      callbackToken,
      policy: review.policy,
      instructions,
    } satisfies AgentReviewTaskPayload,
    { idempotencyKey: `${review.id}:${attempt}` },
  );

  await reviewStore.recordDispatch({
    reviewId: review.id,
    triggerRunId: handle.id,
  });
  await logReviewEvent({
    type: REVIEW_EVENT_TYPE.started,
    review,
    message: `Review ${review.id} started for execution ${review.executionId} (iteration ${review.iteration} of ${MAX_REVIEW_ITERATIONS}).`,
    dedupeKey: `${REVIEW_EVENT_TYPE.started}:${review.id}`,
  });
  return handle.id;
}

// --- callback ------------------------------------------------------------------

/** Thrown when a callback cannot prove it is the authorized review attempt. */
export class UnauthorizedReviewCallbackError extends Error {
  constructor(reviewId: string) {
    super(`Review callback is not authorized for review ${reviewId}.`);
    this.name = "UnauthorizedReviewCallbackError";
  }
}

/** Thrown when a callback names a review that does not exist. */
export class ReviewNotFoundError extends Error {
  constructor(reviewId: string) {
    super(`Review not found: ${reviewId}`);
    this.name = "ReviewNotFoundError";
  }
}

export interface CompleteReviewInput {
  reviewId: string;
  /** Must match the token reserved for this review. */
  callbackToken: string;
  outcome: ReviewOutcome;
  findings?: SimulatedReviewFinding[];
}

export interface CompleteReviewResult {
  review: Review;
  /** True when this call performed the resolution rather than replaying one. */
  applied: boolean;
  /** The revision execution authorized by a blocking outcome, when there is one. */
  revisionExecutionId: string | null;
  /** True when this outcome exhausted the bounded loop. */
  exhausted: boolean;
}

/**
 * Record a reviewer's outcome.
 *
 * Authorization is checked against durable state before anything else: the review
 * must exist and the presented token must equal the one reserved for it, so a
 * callback from a prior iteration, another review, or an unauthenticated caller
 * cannot advance the lifecycle.
 *
 * A callback must then find the review still *pending*. A terminal review has
 * already had its outcome decided — by another run, or by the liveness sweep that
 * stopped waiting for this one — so a later callback is not owed anything and
 * records nothing: no finding, no finding evidence, no event, no revision, no
 * second escalation. Two callers can still both observe a pending review, so
 * resolution remains a guarded transition and the one that loses it converges on
 * the winner's outcome rather than producing a second of anything.
 */
export async function handleReviewComplete(
  input: CompleteReviewInput,
): Promise<CompleteReviewResult> {
  const { reviewStore } = getDevHqAdapters();
  const review = await reviewStore.getReview(input.reviewId);
  if (!review) {
    throw new ReviewNotFoundError(input.reviewId);
  }
  // Validated against the reserved capability, not merely required to be present.
  if (!review.callbackToken || review.callbackToken !== input.callbackToken) {
    throw new UnauthorizedReviewCallbackError(input.reviewId);
  }

  // Only a pending review is still owed an outcome. Once the record is terminal
  // this callback is *late* rather than duplicated work, and it must leave no
  // trace: recording its findings would attach blocking material to a review that
  // already passed, or to one the sweep escalated as `reviewer_unresponsive` —
  // and the finding evidence and `review.finding_recorded` events would enter an
  // append-only timeline (ADR-0002 E5) *after* the outcome they claim to justify.
  //
  // The guard belongs here, at the lifecycle boundary, rather than in each
  // downstream write: this call could not have applied the transition anyway (it
  // is guarded in the store), so nothing below it is a consequence this caller
  // established. Recovery is unaffected — findings are made durable before the
  // transition, so no resolved review can be missing them, and consequences
  // stranded by a crash after the transition are repaired by `reconcileReviews`,
  // which needs no callback to run.
  if (review.status !== "pending") {
    return {
      review,
      applied: false,
      revisionExecutionId: review.revisionExecutionId,
      exhausted: review.status === "escalated",
    };
  }

  const blocking = (input.findings ?? []).some(
    (finding) => finding.severity === "blocking",
  );
  const outcome: ReviewOutcome = blocking ? "changes_requested" : input.outcome;
  const exhausted =
    outcome === "changes_requested" && review.iteration >= MAX_REVIEW_ITERATIONS;
  const status = exhausted ? "escalated" : outcome;

  // Findings are recorded *before* the transition, and keyed, so a crash between
  // the two loses nothing: the review is still pending, so a replay records them
  // again as a no-op and then resolves. This ordering is also what makes the
  // terminal guard above free: a resolved review can never be missing the findings
  // its own outcome was derived from, so refusing a late callback loses nothing.
  await recordFindings(review, input.findings ?? []);

  // The guarded transition. Only one caller moves the review out of pending.
  const resolved = await reviewStore.resolveReview({
    reviewId: review.id,
    status,
    escalationReason: exhausted ? "iterations_exhausted" : undefined,
  });

  // This call observed a pending review, so it owes the outcome's consequences
  // even when a concurrent caller won the transition. Everything below is
  // idempotent and derived from durable state rather than from this caller's
  // claim, so the loser reconciles onto the persisted outcome instead of
  // returning early. Consequences stranded by a process that died *after* the
  // transition are `reconcileReviews`'s job, not a later callback's — once the
  // review is terminal no callback is entitled to act on it.
  const current = resolved ?? (await reviewStore.getReview(review.id))!;
  const { revisionExecutionId } = await ensureReviewLoopStep(current);

  return {
    review: (await reviewStore.getReview(current.id))!,
    applied: resolved !== null,
    revisionExecutionId,
    exhausted: current.status === "escalated",
  };
}

/**
 * Everything a resolved review must leave behind, derived from its persisted
 * status rather than from any caller's claim: its outcome evidence and event, and
 * the loop step the outcome authorizes.
 *
 * Every write underneath is keyed or reserve-once, so this is safe to run from
 * the callback that resolved the review, a concurrent caller that lost the
 * transition, and the reconciliation sweep alike.
 */
async function ensureReviewLoopStep(
  review: Review,
): Promise<{ revisionExecutionId: string | null }> {
  if (review.status === "pending") {
    return { revisionExecutionId: null };
  }

  await ensureReviewOutcomeRecords(review);

  if (review.status === "escalated") {
    await ensureReviewExhaustionEscalation(review);
    return { revisionExecutionId: null };
  }
  if (review.status === "changes_requested") {
    return { revisionExecutionId: await ensureReviewRevision(review) };
  }
  return { revisionExecutionId: null };
}

async function recordFindings(
  review: Review,
  findings: SimulatedReviewFinding[],
): Promise<void> {
  const { reviewStore } = getDevHqAdapters();
  for (const finding of findings) {
    const evidenceId = await ensureReviewEvidence({
      review,
      ref: `finding:${finding.ref}`,
      label: `Review finding (${finding.severity}): ${finding.category}`,
      summary: finding.summary,
    });
    const recorded: ReviewFinding = await reviewStore.recordFinding({
      reviewId: review.id,
      ref: finding.ref,
      severity: finding.severity,
      category: finding.category,
      summary: finding.summary,
      evidenceId,
    });
    await logReviewEvent({
      type: REVIEW_EVENT_TYPE.findingRecorded,
      review,
      message: `Review ${review.id} recorded a ${recorded.severity} ${recorded.category} finding.`,
      dedupeKey: `${REVIEW_EVENT_TYPE.findingRecorded}:${recorded.id}`,
    });
  }
}

/** The outcome's event and evidence, both keyed so a replay cannot duplicate them. */
async function ensureReviewOutcomeRecords(review: Review): Promise<void> {
  const type =
    review.status === "passed"
      ? REVIEW_EVENT_TYPE.passed
      : review.status === "changes_requested"
        ? REVIEW_EVENT_TYPE.changesRequested
        : REVIEW_EVENT_TYPE.escalated;

  await ensureReviewEvidence({
    review,
    ref: "outcome",
    label: `Review iteration ${review.iteration}: ${review.status}`,
    summary: `Review ${review.id} of execution ${review.executionId} resolved as "${review.status}" at iteration ${review.iteration} of ${MAX_REVIEW_ITERATIONS}.`,
  });
  await logReviewEvent({
    type,
    review,
    message: `Review ${review.id} of execution ${review.executionId} ${review.status} at iteration ${review.iteration}.`,
    dedupeKey: `${type}:${review.id}`,
  });
}

// --- bounded revision ----------------------------------------------------------

/**
 * Authorize and dispatch the single revision execution a blocking review grants.
 *
 * Reserve-then-create, mirroring the escalation revise boundary: the canonical id
 * is reserved on the review *before* the execution is created, so a failure at any
 * step leaves the id permanently allocated for a replay to resume from rather than
 * a marker that blocks it. The revision inherits the reviewed execution's routing,
 * request, and review policy, so the re-review judges the same authorized work
 * under the same restrictions — and starts with a full execution retry budget (E6).
 */
async function ensureReviewRevision(review: Review): Promise<string | null> {
  const { reviewStore } = getDevHqAdapters();
  const reviewed = getDevHqStore().executions.get(review.executionId) ?? null;
  if (!reviewed) return null;

  const executionId = await reviewStore.reserveRevisionExecution({
    reviewId: review.id,
    executionId: revisionExecutionIdFor(review.id),
  });

  const execution = await ensureExecution({
    executionId,
    taskId: review.taskId,
    routing: reviewed.routing ?? undefined,
    request: reviewed.request ?? undefined,
    reviewPolicy: reviewed.reviewPolicy ?? undefined,
    // The chain link: the review of *this* execution counts one past the review
    // that authorized it, so the bound follows real revisions.
    revisionOfReviewId: review.id,
  });

  const { decision } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // No capacity right now, or the revision already left the queue. The
    // execution keeps its routing and is picked up by queued-dispatch
    // reconciliation; nothing here needs unwinding — but a capacity decline is a
    // lifecycle outcome and must reach the timeline (ADR-0001 O6). Imported
    // dynamically for the same reason as the dispatch helpers below.
    const { ensureAssignmentDeferredEvent } = await import(
      "@/lib/dev-hq/agent-execution-service"
    );
    await ensureAssignmentDeferredEvent(execution, decision.reason);
    return executionId;
  }

  // Dispatch through the assignment-keyed idempotent path. Imported dynamically
  // to avoid a static cycle with the agent-execution service, which reaches this
  // module the same way when an execution succeeds.
  const { ensureAssignmentEvent, ensureDispatchForAssignment } = await import(
    "@/lib/dev-hq/agent-execution-service"
  );
  await ensureAssignmentEvent(execution, decision.assignment.id, decision.agentId);
  await ensureDispatchForAssignment(
    decision.assignment.id,
    reviewInstructions(execution),
  );
  return executionId;
}

/**
 * Establish the exhausted loop as a founder escalation. The escalation service
 * owns creation and deduplication; this only supplies the established fact.
 */
async function ensureReviewExhaustionEscalation(review: Review): Promise<void> {
  const { raiseReviewExhaustionEscalation } = await import(
    "@/lib/dev-hq/escalation-service"
  );
  await raiseReviewExhaustionEscalation(review);
}

// --- reconciliation ------------------------------------------------------------

export interface ReviewReconcileResult {
  requested: number;
  dispatched: number;
  revisions: number;
  escalations: number;
}

/**
 * Sweep step for the review loop, composed alongside execution reconciliation by
 * the reclaim handler. Each branch repairs one class of interruption and none of
 * them advances the loop:
 *
 *   succeeded, policy set, never reviewed -> request the review
 *   pending but never dispatched          -> dispatch it
 *   changes_requested without a revision  -> authorize/dispatch the revision
 *   escalated without an escalation       -> raise it
 *
 * Every branch is keyed or guarded, so repeated sweeps converge and none of them
 * consumes an iteration.
 */
export async function reconcileReviews(
  now?: string,
): Promise<ReviewReconcileResult> {
  const at = now ?? nowIso();
  const { reviewStore, escalationStore } = getDevHqAdapters();
  const result: ReviewReconcileResult = {
    requested: 0,
    dispatched: 0,
    revisions: 0,
    escalations: 0,
  };

  for (const execution of [...getDevHqStore().executions.values()]) {
    if (execution.status !== "succeeded") continue;
    const policy = execution.reviewPolicy ?? null;
    if (!policy || policy === "none") continue;
    if (await reviewStore.findByExecution(execution.id)) continue;
    const outcome = await ensureReviewForExecution(execution.id);
    if (outcome.review) result.requested += 1;
  }

  const unresponsiveCutoff = new Date(
    new Date(at).getTime() - REVIEW_RESPONSE_DEADLINE_MS,
  ).toISOString();
  const unresponsive = new Set(
    (await reviewStore.listUnresponsive(unresponsiveCutoff)).map((r) => r.id),
  );

  for (const review of [...getDevHqStore().reviews.values()]) {
    if (review.status === "pending") {
      const execution = getDevHqStore().executions.get(review.executionId);
      if (!execution) continue;

      // Never dispatched: a crash between creating the review and triggering it.
      if (!review.triggerRunId) {
        await dispatchReview(review, reviewInstructions(execution));
        result.dispatched += 1;
        continue;
      }

      // Dispatched but silent past the deadline. Its run is gone and nothing else
      // can free it, so either dispatch again or, once the allowance is spent,
      // stop waiting and let the founder decide.
      if (unresponsive.has(review.id)) {
        if (review.dispatchAttempts >= MAX_REVIEW_DISPATCH_ATTEMPTS) {
          await escalateUnresponsiveReview(review, at);
          result.escalations += 1;
        } else {
          await dispatchReview(review, reviewInstructions(execution), {
            force: true,
          });
          result.dispatched += 1;
        }
      }
      continue;
    }

    // Resolved: re-run the idempotent consequences. An interruption after the
    // transition but before the evidence, event, revision, or escalation landed
    // is repaired here rather than lost, and a complete review is untouched.
    //
    // What was missing has to be measured *before* the repair — asking afterwards
    // would always find it present and report nothing was done.
    const revisionMissing =
      review.status === "changes_requested" &&
      (!review.revisionExecutionId ||
        !getDevHqStore().executions.get(review.revisionExecutionId));
    const escalationMissing =
      review.status === "escalated" &&
      !(await escalationStore.findByExecution(review.executionId));

    await ensureReviewLoopStep(review);

    if (revisionMissing) result.revisions += 1;
    if (escalationMissing) result.escalations += 1;
  }

  return result;
}

/**
 * Stop waiting on a reviewer that never reported, and hand the loop to the
 * founder. Deliberately not another dispatch: the allowance exists so an
 * unresponsive reviewer terminates deterministically instead of being retried
 * forever, exactly as the retry budget does for executions.
 */
async function escalateUnresponsiveReview(
  review: Review,
  at: string,
): Promise<void> {
  const { reviewStore } = getDevHqAdapters();
  const resolved = await reviewStore.resolveReview({
    reviewId: review.id,
    status: "escalated",
    escalationReason: "reviewer_unresponsive",
    at,
  });
  await ensureReviewLoopStep(resolved ?? (await reviewStore.getReview(review.id))!);
}
