// Escalation service (Task 1E-5). Raises founder escalations from approved
// reliability conditions (retry exhaustion) and resolves them, entirely in the
// service layer — the Execution Manager stays pure. Escalations are a distinct
// concept from founder-request approvals (ADR-0002 E2).
//
// Robustness (verified 1E-5 review findings):
//   - Fix 1: creation is deduped per (execution, origin) in the store, so a
//     duplicate raise cannot occur after resolution or under concurrent requests.
//   - Fix 2: the retry-exhaustion precondition is validated here, not by callers.
//   - Fix 4: revise reserves a canonical execution id on the escalation before
//     creating that execution, so exactly one fresh execution exists per revise
//     under concurrency, creation failure, dispatch failure, and replay.
//   - Fix 3: each side effect (task status, evidence, event) is applied at most
//     once and re-applied only if missing, so a retry after a partial failure
//     reconciles instead of returning early.

import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import {
  cancelExecution,
  ensureAssignment,
  ensureExecution,
  getExecution,
} from "@/lib/dev-hq/execution-manager";
import {
  getDevHqStore,
  getEscalationResolutionOrder,
} from "@/lib/dev-hq/store";
import {
  ESCALATION_EVENT_TYPE,
  EXECUTION_QUEUE_STALL_DEADLINE_MS,
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  FOUNDER_USER_ID,
  MAX_EXECUTION_ATTEMPTS,
  MAX_REVIEW_ITERATIONS,
  TASK_STATUS_REFUSED_EVENT_TYPE,
} from "@/lib/dev-hq/constants";
import type {
  Escalation,
  EscalationResolution,
  Execution,
  Review,
  Task,
} from "@/types/domain";

/** Thrown when a resolution targets a missing escalation, so routes can 404 (Fix 5). */
export class EscalationNotFoundError extends Error {
  constructor(escalationId: string) {
    super(`Escalation not found: ${escalationId}`);
    this.name = "EscalationNotFoundError";
  }
}

/** Terminal execution states — a revision in one of these has run its course. */
function isTerminalExecution(status: Execution["status"]): boolean {
  return status === "succeeded" || status === "failed" || status === "cancelled";
}

function taskStatusForResolution(
  resolution: EscalationResolution,
): Task["status"] {
  if (resolution === "abandon") return "rejected";
  if (resolution === "accept") return "completed";
  // revise: reopen the task — but only while the canonical revision is still
  // live. resolveEscalation resolves the revision first and gates on that, so a
  // replay cannot reopen a task whose revision already terminated.
  // resolveEscalation then dispatches one fresh
  // Execution at attempt 1 (a full execution retry budget) via ensureReviseDispatch.
  // Resetting the *execution* retry counter is inherent to starting a new
  // Execution at attempt 1. The distinct *review-iteration* counter is owned by
  // the review loop (Task 1E-7, ADR-0002 E6) and is not implemented here.
  return "active";
}

/** Fix 2: the service validates the retry-exhaustion precondition itself. */
function assertRetryExhausted(execution: Execution): void {
  if (execution.status !== "failed") {
    throw new Error(
      `Cannot raise a retry-exhaustion escalation for execution ${execution.id}: status is "${execution.status}", not "failed".`,
    );
  }
  if ((execution.attempt ?? 0) < MAX_EXECUTION_ATTEMPTS) {
    throw new Error(
      `Cannot raise a retry-exhaustion escalation for execution ${execution.id}: ${
        execution.attempt ?? 0
      } attempt(s) used, retry budget not exhausted.`,
    );
  }
}

// --- reconciliation helpers (Fix 3): idempotent, re-applied only if missing ---

/**
 * Whether an unresolved founder escalation currently holds this task (ARCH-02).
 *
 * **The coordination predicate between the two orchestrators that write
 * `Task.status`.** An open escalation means a founder decision is outstanding on
 * the task, so no other flow may declare that task finished; the escalation
 * lifecycle owns its status until the founder resolves it. The founder-request
 * workflow consults this before writing its own outcome, which is the only
 * reason the two can no longer disagree.
 *
 * Read **synchronously**, with no await anywhere in it. That is a requirement,
 * not a style choice: it is evaluated inside `updateTaskStatusIf`'s
 * precondition, which the repository runs in the same synchronous step as the
 * write. An await here would reopen exactly the gap the transition exists to
 * close, and the check would once again be a decision made from a stale reading.
 *
 * A scan rather than an index, matching every other escalation lookup in the
 * store. Bounded by the escalation count, which is small; SVC-06 tracks the
 * store's scan costs as a whole and is deliberately not pre-empted here.
 */
export function hasOpenEscalationForTask(taskId: string): boolean {
  for (const escalation of getDevHqStore().escalations.values()) {
    if (escalation.taskId === taskId && escalation.status === "open") {
      return true;
    }
  }
  return false;
}

/**
 * Whether this escalation carries the **newest** founder decision on its task
 * (P0-3).
 *
 * `hasOpenEscalationForTask` establishes that no decision is *outstanding*. It
 * does not establish that this decision is the *current* one, and the two are
 * different facts. Both were missing until now, but only the first was checked:
 *
 *   1. E1 and E2 are both open on task T. E1 resolves `accept` — refused,
 *      correctly, because E2 is still open.
 *   2. E2 resolves `abandon`. Nothing is open, so T becomes `rejected`.
 *   3. E1's request is retried — a duplicate POST, a client retry, a
 *      reconciliation. `resolveEscalation` re-reads E1, finds the persisted
 *      `accept`, sees nothing open, and writes T `completed`.
 *
 * Step 3 passes every precondition the module had, because each one asks about
 * the present state and none asks *whose decision this is*. The founder's most
 * recent instruction was "abandon", and the task now reports completed.
 *
 * Read synchronously, with no await anywhere in it, for the same reason
 * `hasOpenEscalationForTask` is: it is evaluated inside `updateTaskStatusIf`'s
 * precondition, which the repository runs in the same synchronous step as the
 * write. An await here would reopen the gap and the recency check would once
 * again be a decision made from a stale reading.
 *
 * An unresolved escalation is not the newest decision — it is not a decision at
 * all — so a null position refuses. A scan, bounded by the escalation count,
 * matching every other escalation lookup in this module.
 */
function isNewestResolutionForTask(escalation: Escalation): boolean {
  const position = getEscalationResolutionOrder(escalation.id);
  if (position === null) {
    return false;
  }
  for (const other of getDevHqStore().escalations.values()) {
    if (other.id === escalation.id || other.taskId !== escalation.taskId) {
      continue;
    }
    const otherPosition = getEscalationResolutionOrder(other.id);
    if (otherPosition !== null && otherPosition > position) {
      return false; // a later founder decision on this task supersedes ours
    }
  }
  return true;
}

/**
 * Move the task to the status an escalation lifecycle transition implies,
 * committing the decision atomically against the escalation state that
 * authorizes it (ARCH-02).
 *
 * Previously a read, a check and an unguarded `updateTask`, with an await
 * between the read and the write. Two orchestrators write this field, so that
 * gap was not theoretical: whichever wrote second overwrote the other's decision
 * with a status chosen from a reading that had since gone stale — which is how
 * an escalation could sit open on a task the founder-request flow had already
 * marked `completed`. The precondition is supplied by the caller because the
 * authorizing fact differs by transition, and it is evaluated by the repository
 * in the same synchronous step as the write.
 */
async function ensureTaskStatus(
  taskId: string,
  status: Task["status"],
  precondition: (current: Task) => boolean,
  refusal: TaskStatusRefusal,
): Promise<void> {
  const { taskRepository } = getDevHqAdapters();
  const applied = await taskRepository.updateTaskStatusIf(
    taskId,
    status,
    precondition,
  );
  // Null is the precondition refusing (or the task being gone). A write that was
  // simply already at the target returns the task, so a no-op is not reported as
  // a divergence.
  if (!applied) {
    await recordTaskStatusRefusal(taskId, status, refusal);
  }
}

/**
 * What a refused `Task.status` write needs in order to be recorded honestly: the
 * escalation whose transition wanted it, a phrase naming that transition, and a
 * cause evaluated at the call site.
 *
 * The cause is a thunk supplied per site rather than derived here, because the
 * authorizing fact differs by transition and only the site knows which of its
 * conditions could have been the one that refused.
 */
interface TaskStatusRefusal {
  escalationId: string;
  transition: string;
  cause: () => string;
}

/**
 * Record that an escalation lifecycle transition's conditional `Task.status`
 * write was refused (NBF-2).
 *
 * **The other half of ARCH-02.** That fix made both `Task.status` orchestrators
 * write through `updateTaskStatusIf`, and gave the founder-request side a
 * `TASK_STATUS_REFUSED_EVENT_TYPE` entry when its precondition refused. This side
 * discarded the `Task | null` and recorded nothing — so an escalation could
 * resolve `accept` while the task stayed `rejected`, and the only trace was two
 * records that disagree and no entry saying why.
 *
 * The reasoning is already written down, in that constant's own doc comment, in
 * terms that never mentioned which flow it applied to: "an unrecorded divergence
 * is indistinguishable from one that never happened." It applies identically
 * here. The refusal itself remains the correct outcome; what was missing was the
 * record of it.
 *
 * Descriptive only — nothing reads it back. One entry per (escalation, intended
 * status): a replay of the same transition is the same refusal, not a second one.
 */
async function recordTaskStatusRefusal(
  taskId: string,
  intended: Task["status"],
  refusal: TaskStatusRefusal,
): Promise<void> {
  const { taskRepository, eventLogger } = getDevHqAdapters();
  const current = await taskRepository.getTask(taskId);
  await eventLogger.log({
    type: TASK_STATUS_REFUSED_EVENT_TYPE,
    entityType: "task",
    entityId: taskId,
    message:
      `Escalation ${refusal.escalationId} ${refusal.transition} but did not set task ` +
      `${taskId} to "${intended}": the task now reads "${current?.status ?? "missing"}" ` +
      `${refusal.cause()}. The other decision stands.`,
    actorId: null,
    actorLabel: "System",
    dedupeKey: `${TASK_STATUS_REFUSED_EVENT_TYPE}:${refusal.escalationId}:${intended}`,
  });
}

/**
 * Mark the task as needing revision for an escalation that has just been raised.
 *
 * The authorizing fact is the escalation itself: the raise wrote it as `open`
 * immediately before this call, so re-checking that an open escalation still
 * holds the task is a genuine condition rather than `() => true` — it refuses
 * when the founder resolved the escalation inside the gap, which would otherwise
 * strand the task in `needs_revision` with nothing outstanding.
 */
async function ensureEscalatedTaskStatus(
  escalation: Escalation,
): Promise<void> {
  const taskId = escalation.taskId;
  await ensureTaskStatus(
    taskId,
    "needs_revision",
    (current) =>
      current.status !== "completed" &&
      current.status !== "rejected" &&
      hasOpenEscalationForTask(taskId),
    {
      escalationId: escalation.id,
      transition: "was raised",
      cause: () => {
        const current = getDevHqStore().tasks.get(taskId);
        return current?.status === "completed" || current?.status === "rejected"
          ? "because a terminal task outcome already holds Founder authority"
          : "after its escalation stopped holding the task";
      },
    },
  );
}

/**
 * Apply a founder resolution's terminal task outcome (accept -> completed,
 * abandon -> rejected).
 *
 * Refuses while *another* escalation is still open on the task — the resolved
 * one is already `resolved` by the time this runs, so it never blocks itself.
 * Declaring the task finished under an outstanding founder decision is the same
 * untruth the founder-request flow is now stopped from telling; the rule is one
 * rule, applied wherever a flow wants to call a task done.
 *
 * Also refuses when a *later* founder decision has since been committed on the
 * task (P0-3). Both conditions are required and neither implies the other: the
 * first is about a decision that has not been made yet, the second about one
 * that has been made and won. A replay arriving after everything closed passes
 * the first and is caught only by the second.
 */
async function ensureResolvedTaskStatus(
  escalation: Escalation,
  status: Task["status"],
): Promise<void> {
  await ensureTaskStatus(
    escalation.taskId,
    status,
    () =>
      !hasOpenEscalationForTask(escalation.taskId) &&
      isNewestResolutionForTask(escalation),
    {
      escalationId: escalation.id,
      transition: `resolved ${escalation.resolution ?? "terminally"}`,
      // Re-evaluated for the message only. Both conditions are read again here
      // rather than captured at commit time, and the wording says "now" because
      // that is all a post-hoc reading can honestly claim.
      cause: () =>
        hasOpenEscalationForTask(escalation.taskId)
          ? "and an unresolved founder escalation now holds it"
          : !isNewestResolutionForTask(escalation)
            ? "after a later founder decision on this task superseded this one"
            : "after another transition landed first",
    },
  );
}

/**
 * Current persisted status of the canonical revision execution, read
 * synchronously. It is evaluated inside the task transition's precondition,
 * where an await would reopen the very gap the transition exists to close.
 */
function revisionStatusNow(executionId: string): Execution["status"] | null {
  return getDevHqStore().executions.get(executionId)?.status ?? null;
}

/**
 * Reopen the task for a live revision, committing the decision atomically.
 *
 * A point-in-time read followed by an unguarded write is not enough: between
 * observing the revision as queued/running and the status landing, the revision
 * can terminate and a newer escalation can move the task to needs_revision — the
 * unguarded write would then clobber that newer state. So the decision is made
 * *inside* the transition's precondition, which the repository evaluates
 * synchronously with the write:
 *   - the revision must still be non-terminal at commit time, and
 *   - the task must still hold the status it was observed with, so any other
 *     actor's transition refuses this write rather than being overwritten, and
 *   - this revise must still be the newest founder decision on the task (P0-3).
 *
 * The third is not covered by the other two. A superseded `revise` whose
 * revision execution is still queued is still non-terminal, and a task the
 * founder has since abandoned is stably `rejected` — so the replay observes it,
 * finds it unchanged at commit time, and reopens abandoned work as `active`.
 * "Still live" is a fact about the execution; it says nothing about whether the
 * decision that authorized it is still the operative one.
 */
async function activateTaskForLiveRevision(
  escalation: Escalation,
  executionId: string,
): Promise<void> {
  const { taskRepository } = getDevHqAdapters();
  const taskId = escalation.taskId;
  const target = taskStatusForResolution("revise");
  const observed = await taskRepository.getTask(taskId);
  if (!observed || observed.status === target) {
    return;
  }
  const applied = await taskRepository.updateTaskStatusIf(
    taskId,
    target,
    (current) => {
      if (current.status !== observed.status) {
        return false; // another actor moved the task since it was observed
      }
      if (!isNewestResolutionForTask(escalation)) {
        return false; // a later founder decision on this task supersedes ours
      }
      const status = revisionStatusNow(executionId);
      return status !== null && !isTerminalExecution(status);
    },
  );
  // The refusal is correct — but a revise that resolved while its task keeps a
  // different status is exactly the divergence ARCH-02 exists to record, and this
  // half recorded nothing (NBF-2). Three distinct conditions can refuse here, so
  // the cause is re-read for the message; the early return above is a genuine
  // no-op (the task already holds the target) and is deliberately not reported.
  if (!applied) {
    await recordTaskStatusRefusal(taskId, target, {
      escalationId: escalation.id,
      transition: "resolved revise",
      cause: () => {
        const status = revisionStatusNow(executionId);
        if (status === null || isTerminalExecution(status)) {
          return `because its revision execution ${executionId} is ${status ?? "missing"} rather than live`;
        }
        if (!isNewestResolutionForTask(escalation)) {
          return "after a later founder decision on this task superseded this one";
        }
        return "after another transition landed first";
      },
    });
  }
}

/**
 * Append-only escalation evidence, keyed on the escalation's own uri. Keyed in
 * the store rather than checked here: concurrent raises and reconciling replays
 * would all pass a read-then-write check before any of them wrote, leaving one
 * audit row per caller for a single escalation.
 */
async function ensureEscalationEvidence(input: {
  ref: string;
  taskId: string;
  executionId: string | null;
  label: string;
  summary: string;
  createdByAgentId: string | null;
}): Promise<void> {
  await getDevHqAdapters().evidenceStore.ensureEvidence({
    executionId: input.executionId,
    taskId: input.taskId,
    kind: "log",
    label: input.label,
    summary: input.summary,
    uri: input.ref,
    createdByAgentId: input.createdByAgentId,
  });
}

async function ensureEscalationEvent(input: {
  type: string;
  taskId: string;
  escalationId: string;
  message: string;
  actorId: string | null;
  actorLabel: string;
}): Promise<void> {
  await getDevHqAdapters().eventLogger.log({
    type: input.type,
    entityType: "task",
    entityId: input.taskId,
    message: input.message,
    actorId: input.actorId,
    actorLabel: input.actorLabel,
    // Keyed on the escalation itself. The previous message-substring search over
    // the bounded event buffer would re-emit a raise/resolve entry once the
    // original had been evicted by unrelated traffic.
    dedupeKey: `${input.type}:${input.escalationId}`,
  });
}

/**
 * The canonical Execution id a `revise` of this escalation authorizes.
 *
 * **This function is the only place in the system that knows this encoding.**
 * Every other component — stores, the Execution Manager, dispatch, routes, the
 * view-model, tests — treats the value as an opaque execution id, obtained from
 * `escalation.revisionExecutionId` or from this helper, and never by spelling
 * out or parsing the format. Swapping to a durable sequence or a UUID is
 * therefore a change to this function alone.
 *
 * Deterministic rather than allocated, so it is stable across every failure and
 * replay without needing an allocation step. Collision-free against organic
 * execution ids: `nextId` only ever produces `exec-<digits>-<digits>`.
 */
export function revisionExecutionIdFor(escalationId: string): string {
  return `exec-revision-${escalationId}`;
}

/**
 * Dispatch instructions for the revision: the authorized request being revised,
 * falling back to the task description for executions created before the request
 * envelope existed. Never the description when a request is on record — a
 * revision must run the work the founder authorized, not whatever the task says
 * now.
 */
function reviseInstructions(taskId: string, execution: Execution | null): string {
  const stored = (execution?.request?.instructions ?? "").trim();
  if (stored) return stored;
  const task = getDevHqStore().tasks.get(taskId);
  return (task?.description ?? "").trim() || "Execute the assigned task.";
}

/**
 * Authorize and dispatch the single fresh Execution a founder "revise" grants
 * (ADR-0002 E2; Sprint 1E-5): one new Execution at attempt 1 with a full
 * execution retry budget, assigned and dispatched through the existing flow.
 *
 * **Reserve-then-create.** The canonical execution id is reserved on the
 * escalation *before* the execution is created, and creation is a keyed
 * create-or-get at exactly that id. This — not evidence — is the idempotency
 * boundary, which makes the invariant structural: no path here can create an
 * execution at any other id, so an unlinked orphan is not representable, and a
 * failure at any step leaves the id permanently allocated for a replay to
 * resume from rather than a marker that blocks it forever.
 *
 * Recovery, all keyed lookups, no scans:
 *   - failed before reserving      -> nothing persisted; a replay reserves
 *   - failed before/during create  -> id reserved, execution missing; a replay
 *                                     recreates it at the same id
 *   - failed before/during assign  -> execution exists queued; a replay assigns
 *   - failed during dispatch       -> a replay redispatches the same assignment,
 *                                     as does `reconcileQueuedDispatches`
 * Evidence is written last and is purely descriptive (ADR-0002 E4).
 *
 * This resets only the *execution* retry counter (a brand-new Execution starts at
 * attempt 1). The distinct *review-iteration* counter is owned by the review loop
 * (Task 1E-7) and is intentionally untouched here.
 */
async function ensureReviseDispatch(
  escalation: Escalation,
): Promise<Execution | null> {
  const { escalationStore } = getDevHqAdapters();

  // 1. Reserve the canonical id, only if unset. Every concurrent caller and
  //    every replay receives the same id; the persisted value wins over the
  //    proposal, so only this call site ever depends on the derivation.
  const executionId = await escalationStore.reserveRevisionExecution({
    escalationId: escalation.id,
    executionId: revisionExecutionIdFor(escalation.id),
  });

  // 2. Create-or-get the execution at exactly that id. A replay after a failed
  //    creation notices the miss by keyed lookup and retries with the same id.
  //
  //    The revision inherits the routing policy and the immutable request of the
  //    execution being revised. A revision is a fresh attempt at *the same work*,
  //    so it must reproduce the restrictions that work was authorized under —
  //    otherwise revising a pinned or capability-restricted execution would
  //    silently produce unrestricted work under a different agent, and replays
  //    would converge on the execution id while diverging on what it runs.
  const revised = escalation.executionId
    ? getDevHqStore().executions.get(escalation.executionId)
    : null;
  const execution = await ensureExecution({
    executionId,
    taskId: escalation.taskId,
    routing: revised?.routing ?? undefined,
    request: revised?.request ?? undefined,
    // The policy carries forward, so the authorized retry is reviewed exactly as
    // the work it replaces was. The revision-chain link is deliberately *not*
    // set: a founder revise resets the review-iteration counter (ADR-0002 E2), so
    // the new execution starts a fresh loop at iteration 1 rather than inheriting
    // the exhausted chain.
    reviewPolicy: revised?.reviewPolicy ?? undefined,
  });

  // 3. Create or recover its assignment. A non-assigned outcome (no agent free,
  //    or the execution already left the queue) leaves state untouched for a
  //    later replay; there is nothing to unwind.
  const { decision, created } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // Not dispatchable right now (no agent free) or no longer dispatchable at
    // all (the revision already terminated). Either way, report the canonical
    // execution's authoritative state so the caller can decide about the task —
    // and record the decline, which is a lifecycle outcome (ADR-0001 O6).
    const { ensureAssignmentDeferredEvent } = await import(
      "@/lib/dev-hq/agent-execution-service"
    );
    await ensureAssignmentDeferredEvent(execution, decision.reason);
    return getExecution(executionId);
  }

  // 4. Record the assignment transition through the *same* canonical emitter every
  //    other path uses. Keyed on the assignment id, so a sweep that later inspects
  //    this revision finds the transition already recorded instead of appending a
  //    second one — the revise path emitting its own unkeyed event was exactly how
  //    a duplicate arose. `created` is deliberately not consulted: the key decides.
  //    The import is dynamic to avoid a static cycle with agent-execution-service
  //    (which imports raiseRetryExhaustionEscalation from this module).
  void created;
  const { ensureAssignmentEvent, ensureDispatchForAssignment } = await import(
    "@/lib/dev-hq/agent-execution-service"
  );
  await ensureAssignmentEvent(execution, decision.assignment.id, decision.agentId);

  // 5. Dispatch through the assignment-keyed idempotent path, so concurrent
  //    callers collapse onto one logical Trigger run and a replay is a no-op.
  await ensureDispatchForAssignment(
    decision.assignment.id,
    reviseInstructions(escalation.taskId, execution),
  );

  // 6. Record authoritative state after the fact — deduped by uri, never a gate.
  //    Unconditional, so a replay that recovers a failed dispatch still records
  //    the evidence the interrupted first attempt never reached.
  await ensureEscalationEvidence({
    ref: `escalation:${escalation.id}:revise-dispatch`,
    taskId: escalation.taskId,
    executionId: execution.id,
    label: "Escalation revise: fresh execution authorized",
    summary: `Revise of escalation ${escalation.id} authorized execution ${execution.id} (attempt 1) for task ${escalation.taskId}.`,
    createdByAgentId: null,
  });

  // 7. Re-read the canonical execution's authoritative state. Never report a
  //    pre-dispatch snapshot: the worker may deliver its running and terminal
  //    callbacks while tasks.trigger() is still in flight (see the same hazard
  //    documented in ensureDispatchForAssignment) or while the descriptive
  //    records above are being written. A snapshot taken before step 5 can
  //    claim "queued" for an execution that has already succeeded, failed, or
  //    been cancelled — which would wrongly reactivate the task.
  return getExecution(executionId);
}

/**
 * Raise the founder escalation for a review loop that has run out of iterations
 * (ADR-0002 E2/E6). The review service establishes exhaustion; this owns the
 * escalation itself, so escalation creation, deduplication, task transition,
 * evidence, and event all stay in one place.
 *
 * Idempotent: the store dedupes per (execution, origin), and each side effect is
 * re-applied only when missing — so repeated reconciliation converges on one
 * escalation rather than a second founder decision.
 */
export async function raiseReviewExhaustionEscalation(
  review: Review,
): Promise<Escalation> {
  if (review.status !== "escalated") {
    throw new Error(
      `Cannot raise a review-exhaustion escalation for review ${review.id}: status is "${review.status}", not "escalated".`,
    );
  }
  // The precondition is checked against the recorded cause, so each way the loop
  // can terminate is validated on its own terms rather than one standing in for
  // the other. An iterations-exhausted escalation must actually be at the bound;
  // an unresponsive reviewer legitimately escalates at any iteration.
  if (
    review.escalationReason === "iterations_exhausted" &&
    review.iteration < MAX_REVIEW_ITERATIONS
  ) {
    throw new Error(
      `Cannot raise a review-exhaustion escalation for review ${review.id}: iteration ${review.iteration} of ${MAX_REVIEW_ITERATIONS}, review budget not exhausted.`,
    );
  }

  const { escalationStore } = getDevHqAdapters();
  const summary =
    review.escalationReason === "reviewer_unresponsive"
      ? `Review of execution ${review.executionId} was dispatched ${review.dispatchAttempts} time` +
        `${review.dispatchAttempts === 1 ? "" : "s"} and never reported an outcome; the review loop cannot proceed without a founder decision.`
      : `Review of execution ${review.executionId} still requested changes after ${review.iteration} review iteration` +
        `${review.iteration === 1 ? "" : "s"}; the bounded revision loop is exhausted.`;

  const escalation = await escalationStore.createEscalation({
    origin: "review_exhausted",
    taskId: review.taskId,
    executionId: review.executionId,
    reviewId: review.id,
    summary,
    raisedByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });
  if (escalation.status === "resolved") {
    return escalation;
  }

  await ensureEscalatedTaskStatus(escalation);
  await ensureEscalationEvidence({
    ref: `escalation:${escalation.id}:raised`,
    taskId: escalation.taskId,
    executionId: escalation.executionId,
    label:
      review.escalationReason === "reviewer_unresponsive"
        ? "Escalation raised: reviewer never reported"
        : "Escalation raised: review iterations exhausted",
    summary: escalation.summary,
    createdByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });
  await ensureEscalationEvent({
    type: ESCALATION_EVENT_TYPE.raised,
    taskId: escalation.taskId,
    escalationId: escalation.id,
    message: `Escalation ${escalation.id} raised for task ${escalation.taskId}: ${escalation.summary}`,
    actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    actorLabel: "Executive Orchestrator",
  });

  return escalation;
}

/**
 * Raise a retry-exhaustion escalation. Validates the precondition (Fix 2), dedupes
 * the escalation record per execution (Fix 1), and reconciles the task/evidence/
 * event side effects idempotently (Fix 3). A resolved escalation is returned as-is
 * without re-opening the task.
 */
export async function raiseRetryExhaustionEscalation(
  execution: Execution,
): Promise<Escalation> {
  assertRetryExhausted(execution);
  const { escalationStore } = getDevHqAdapters();

  const attempts = execution.attempt ?? MAX_EXECUTION_ATTEMPTS;
  const summary = `Execution ${execution.id} exhausted its retry budget after ${attempts} attempt${
    attempts === 1 ? "" : "s"
  }.`;

  const escalation = await escalationStore.createEscalation({
    origin: "retry_exhausted",
    taskId: execution.taskId,
    executionId: execution.id,
    summary,
    raisedByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });

  // Do not reconcile a resolved escalation — the workflow has moved on.
  if (escalation.status === "resolved") {
    return escalation;
  }

  await ensureEscalatedTaskStatus(escalation);
  await ensureEscalationEvidence({
    ref: `escalation:${escalation.id}:raised`,
    taskId: escalation.taskId,
    executionId: escalation.executionId,
    label: "Escalation raised: retry budget exhausted",
    summary: escalation.summary,
    createdByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });
  await ensureEscalationEvent({
    type: ESCALATION_EVENT_TYPE.raised,
    taskId: escalation.taskId,
    escalationId: escalation.id,
    message: `Escalation ${escalation.id} raised for task ${escalation.taskId}: ${escalation.summary}`,
    actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    actorLabel: "Executive Orchestrator",
  });

  return escalation;
}

/**
 * Raise a founder escalation for an execution that has been queued past the
 * stall deadline with no agent (P0-5).
 *
 * Closes the residue commit 70c767e disclosed and deliberately did not assert:
 * dispatch a satisfiable capability, then remove the satisfying agent from the
 * roster, and the execution neither completes nor fails. Every existing recovery
 * misses it by construction — reclaim looks at `running` attempts, the claim
 * deadline looks at dispatched ones, and `reconcileQueuedDispatches` declines
 * identically on every sweep without consuming an attempt, so the retry budget
 * never exhausts and `raiseRetryExhaustionEscalation` is never reached.
 *
 * **Three lifecycle judgements, resolved by the Founder (delegated) 2026-07-29:**
 *
 *  1. *The bound* is `EXECUTION_QUEUE_STALL_DEADLINE_MS`, derived from
 *     `EXECUTION_CLAIM_DEADLINE_MS` rather than chosen. Amends ADR-0001 O6 —
 *     see that constant.
 *
 *  2. *Breaching it consumes no attempt.* Attempts count work an agent
 *     performed (ADR-0001 D1: the counter increments only when a full dispatch
 *     is exhausted). Nothing ran here, so charging an attempt would record work
 *     that never happened — the same fabrication `reconcileRecordsFor` refuses
 *     when it declines to invent a "failed" outcome for a requeued execution —
 *     and would delay the founder's decision by three deadlines.
 *
 *  3. *The origin is `queue_stalled`*, a third member of `EscalationOrigin`
 *     added under the same decision. **The first implementation of this function
 *     used `retry_exhausted`**, as the closest fit the existing union allowed,
 *     and disclosed the cost; the cost was then judged too high to ship. Two
 *     reasons, and the second is the load-bearing one:
 *       - It reads falsely. The founder's queue would carry "exhausted its retry
 *         budget after 1 attempt" about work that made zero attempts.
 *       - Escalations dedupe per (execution, origin). Sharing `retry_exhausted`
 *         means that if capacity returns and this execution later *genuinely*
 *         exhausts its retry budget, that second escalation collides with this
 *         one and is silently swallowed — the founder is never told about the
 *         real failure, because they were once told about the stall. A distinct
 *         origin is what makes the two independently raisable.
 *
 * The execution is deliberately left `queued` and is not transitioned. Marking
 * it `failed` at attempt 1 would make it terminal, unescalated and *invisible to
 * both backstops that exist for exactly that state*: `reconcileUnescalatedFailures`
 * skips it before anything else, because a stalled execution has neither an
 * `agentId` nor an `assignmentId`, and would skip it again on the attempt bound;
 * and `assertRetryExhausted` does not read the disagreement as exhaustion but
 * throws on it, since it requires `attempt >= MAX_EXECUTION_ATTEMPTS`. So the
 * outcome would not be a wrong escalation — it would be no escalation at all,
 * from a record that reads as a finished failure. That is worse than the stall it
 * replaces. Leaving it queued also means that if capacity returns before the
 * founder acts, the authorized work still runs — which is exactly the path the
 * dedupe argument above depends on being reachable.
 *
 * What ends this execution is the founder's own decision: `resolveEscalation`
 * cancels it (SVC-07), which is a terminal transition its attempt counter does
 * not contradict and which every backstop reads correctly.
 *
 * Idempotent by the same construction as every other raise here: the store
 * dedupes per (execution, origin) and each side effect is re-applied only when
 * missing, so a sweep every minute converges on one escalation.
 */
export async function raiseQueueStallEscalation(
  execution: Execution,
  queuedSince: string,
  now: string,
): Promise<Escalation> {
  if (execution.status !== "queued") {
    throw new Error(
      `Cannot raise a queue-stall escalation for execution ${execution.id}: status is "${execution.status}", not "queued".`,
    );
  }
  if (execution.agentId) {
    throw new Error(
      `Cannot raise a queue-stall escalation for execution ${execution.id}: it holds agent ${execution.agentId}, so it is not stalled without one.`,
    );
  }
  const stalledForMs =
    new Date(now).getTime() - new Date(queuedSince).getTime();
  if (stalledForMs <= EXECUTION_QUEUE_STALL_DEADLINE_MS) {
    throw new Error(
      `Cannot raise a queue-stall escalation for execution ${execution.id}: queued ${stalledForMs}ms, within the ${EXECUTION_QUEUE_STALL_DEADLINE_MS}ms stall deadline.`,
    );
  }

  const { escalationStore } = getDevHqAdapters();
  const required = execution.routing?.requiredCapabilities ?? [];
  const summary =
    `Execution ${execution.id} has been queued for ${Math.round(stalledForMs / 1000)}s ` +
    `at attempt ${execution.attempt ?? 1} with no agent` +
    `${required.length > 0 ? ` able to satisfy [${required.join(", ")}]` : ""}, ` +
    `past the ${Math.round(EXECUTION_QUEUE_STALL_DEADLINE_MS / 1000)}s stall deadline. ` +
    "No attempt was consumed, so it can neither complete nor fail on its own and needs a founder decision.";

  const escalation = await escalationStore.createEscalation({
    origin: "queue_stalled",
    taskId: execution.taskId,
    executionId: execution.id,
    summary,
    raisedByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });
  if (escalation.status === "resolved") {
    return escalation;
  }

  await ensureEscalatedTaskStatus(escalation);
  await ensureEscalationEvidence({
    ref: `escalation:${escalation.id}:raised`,
    taskId: escalation.taskId,
    executionId: escalation.executionId,
    label: "Escalation raised: queued past the stall deadline",
    summary: escalation.summary,
    createdByAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  });
  await ensureEscalationEvent({
    type: ESCALATION_EVENT_TYPE.raised,
    taskId: escalation.taskId,
    escalationId: escalation.id,
    message: `Escalation ${escalation.id} raised for task ${escalation.taskId}: ${escalation.summary}`,
    actorId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
    actorLabel: "Executive Orchestrator",
  });

  return escalation;
}

/**
 * End the execution an escalation is about, once the founder has decided its
 * fate and it is still live (SVC-07).
 *
 * **Why this exists at all.** `queue_stalled` is the first origin whose execution
 * is NOT terminal when the escalation is raised — deliberately so, per
 * `raiseQueueStallEscalation`'s third judgement, since leaving it queued is what
 * lets the authorized work still run if capacity returns before the founder
 * acts. `retry_exhausted` raises from a `failed` execution and `review_exhausted`
 * from a `succeeded` one, and both are terminal, so until this origin existed a
 * resolution never had anything live to clean up. Three consequences followed
 * from that gap, and all three are the same gap:
 *
 *   1. `reconcileQueuedDispatches` filters on status and attempt only, with no
 *      per-task condition. A stalled execution is `queued`, so once the founder
 *      abandoned or accepted the task, the very next sweep with capacity
 *      available assigned and dispatched agent work against a terminal outcome.
 *   2. That work could then fail three times and raise `retry_exhausted` — a
 *      *different* origin, so the per-(execution, origin) dedupe did not collapse
 *      it — whose `ensureEscalatedTaskStatus` moved the task `rejected` ->
 *      `needs_revision`. Neither `hasOpenEscalationForTask` nor
 *      `isNewestResolutionForTask` refuses it: both ask about escalation recency,
 *      and that escalation genuinely is the newest one. The founder's abandon was
 *      silently reversed.
 *   3. If capacity never returned, the execution stayed stalled forever *and*
 *      could never escalate again: `createEscalation` dedupes per (execution,
 *      origin) regardless of status, so every later sweep handed back the same
 *      resolved record. Permanently stranded and permanently unable to say so —
 *      the SVC-01 shape the stall deadline was built to close.
 *
 * Cancelling closes all three at once, because each of them needs the execution
 * to still be `queued`: the sweep skips a terminal execution, no `retry_exhausted`
 * can arise from one, and `isQueueStalled` requires `status === "queued"` so
 * nothing is left in the stalled-and-silent shape.
 *
 * Applied to every resolution verb, including `revise`. `revise` then authorizes
 * its fresh execution through `ensureReviseDispatch` at a *different* id, which
 * is what keeps the founder reachable: if that retry stalls too, it is a new
 * (execution, origin) pair and raises its own escalation. Reusing the stalled
 * execution as the revision would satisfy ADR-0002 E2's "fresh 3-attempt budget"
 * on the counter — it is an untouched attempt 1 — but it would reinstate
 * consequence 3 on exactly that path, since the retry would carry the resolved
 * escalation that already dedupes it.
 *
 * Idempotent, and safe to run against any execution state: `cancelExecution` is
 * itself a no-op once terminal, releases a held assignment, and frees the agent
 * when one was running. Evidence is keyed on the escalation's own uri like every
 * other record here. The `execution.cancelled` lifecycle event and the attempt
 * outcome evidence are not emitted here — `reconcileAttemptRecords` already
 * reconciles every non-running agent-backed execution through
 * `finalizeTerminalExecution`, whose durable per-(type, execution) key makes that
 * the one canonical emitter.
 */
async function ensureEscalatedExecutionEnded(
  escalation: Escalation,
): Promise<void> {
  const executionId = escalation.executionId;
  if (!executionId) return;
  const current = getDevHqStore().executions.get(executionId);
  if (!current || isTerminalExecution(current.status)) return;

  const observed = current.status;
  await cancelExecution(executionId);
  await ensureEscalationEvidence({
    ref: `escalation:${escalation.id}:execution-cancelled`,
    taskId: escalation.taskId,
    executionId,
    label: "Escalation resolved: live execution cancelled",
    summary:
      `Escalation ${escalation.id} resolved ${escalation.resolution ?? "terminally"}, so ` +
      `execution ${executionId} — still ${observed} at attempt ${current.attempt ?? 1} when the ` +
      `decision landed — was cancelled. Leaving it live would let a later sweep dispatch it ` +
      `against a task the founder has already decided.`,
    createdByAgentId: null,
  });
}

/**
 * Founder resolution of an escalation. Idempotent: the transition is applied once
 * and re-resolving is a no-op that re-returns the escalation. Side effects are
 * reconciled idempotently (Fix 3). Throws EscalationNotFoundError for a missing id
 * so the route can return 404 (Fix 5).
 */
export async function resolveEscalation(
  escalationId: string,
  resolution: EscalationResolution,
): Promise<Escalation> {
  const { escalationStore } = getDevHqAdapters();

  const existing = await escalationStore.getEscalation(escalationId);
  if (!existing) {
    throw new EscalationNotFoundError(escalationId);
  }

  // Transition once. If this returns null we lost the store transition (a
  // concurrent request already resolved it). We must NOT reconcile with the stale
  // pre-transition record or with this request's verb — re-fetch the canonical
  // persisted escalation and reconcile using only its persisted resolution.
  // Invariant: the persisted escalation resolution equals the applied task outcome.
  const resolved =
    (await escalationStore.resolveEscalation({ escalationId, resolution })) ??
    (await escalationStore.getEscalation(escalationId));
  if (!resolved || !resolved.resolution) {
    throw new Error(
      `Escalation ${escalationId} could not be resolved to a persisted resolution.`,
    );
  }
  const appliedResolution = resolved.resolution;

  // SVC-07: end the escalated execution before anything else acts on the
  // decision. First, so no window exists in which the task carries the founder's
  // outcome while the execution behind it is still dispatchable — and, for
  // `revise`, so the fresh execution below is never the second live execution on
  // this task (the one-live-execution-per-task invariant of 638e45c, which
  // `ensureReviseDispatch` reaches without passing through `dispatchAgentExecution`).
  // A no-op for the two terminal origins, which is every escalation except a
  // queue stall.
  await ensureEscalatedExecutionEnded(resolved);

  // Ordering (Task 1E-5): for revise, the canonical revision is resolved BEFORE
  // the task status is reconciled. A replay of an old revise must not reopen a
  // task whose revision already terminated — by then the workflow has moved on
  // (typically to a newer escalation that put the task in needs_revision), and
  // flipping it back to active would strand it as live work with nothing
  // running. Only a still-live revision reopens the task. accept/abandon are
  // terminal and unaffected.
  //
  // `revision` is the freshly re-read persisted execution, never a pre-dispatch
  // snapshot. A null (the execution could not be created or has vanished)
  // reactivates nothing. The authoritative live/terminal decision is not made
  // from this value either — activateTaskForLiveRevision re-evaluates it inside
  // the transition's precondition, synchronously with the write.
  const revision =
    appliedResolution === "revise" ? await ensureReviseDispatch(resolved) : null;

  if (appliedResolution !== "revise") {
    await ensureResolvedTaskStatus(
      resolved,
      taskStatusForResolution(appliedResolution),
    );
  } else if (revision) {
    await activateTaskForLiveRevision(resolved, revision.id);
  }

  await ensureEscalationEvidence({
    ref: `escalation:${resolved.id}:resolved`,
    taskId: resolved.taskId,
    executionId: resolved.executionId,
    label: `Escalation resolved: ${appliedResolution}`,
    summary: `Escalation ${resolved.id} resolved: ${appliedResolution}.`,
    createdByAgentId: null,
  });
  await ensureEscalationEvent({
    type: ESCALATION_EVENT_TYPE.resolved,
    taskId: resolved.taskId,
    escalationId: resolved.id,
    message: `Escalation ${resolved.id} resolved: ${appliedResolution}.`,
    actorId: FOUNDER_USER_ID,
    actorLabel: "Evan",
  });

  return resolved;
}
