// Agent-execution dispatch and callback handlers (Task 1D-5). Bridges the durable
// Trigger.dev agent-execution task to the in-memory Execution Manager, reusing its
// lifecycle and 3-attempt retry budget. Deterministic simulated agents only — no
// real AI or code execution (ADR-0001 D4).

import { tasks } from "@trigger.dev/sdk";
import type { AssignmentDecision } from "@/types/contracts";
import type { ClaimDeclinedOutcome } from "@/types/contracts/execution-runner";
import type {
  AgentAssignment,
  AgentExecutionStatus,
  AgentResult,
  Execution,
  ExecutionRequest,
  ReviewPolicy,
} from "@/types/domain";
import {
  ensureAssignment,
  ensureExecution,
  getExecution,
  reclaimStale,
  releaseAssignmentForReassignment,
  releaseExecution,
} from "@/lib/dev-hq/execution-manager";
import {
  getAgent,
  getAssignment,
  getDevHqStore,
  saveAssignment,
  saveExecution,
} from "@/lib/dev-hq/store";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { raiseRetryExhaustionEscalation } from "@/lib/dev-hq/escalation-service";
import {
  DEFAULT_REVIEW_POLICY,
  EXECUTION_CLAIM_DEADLINE_MS,
  EXECUTION_EVENT_TYPE,
  MAX_EXECUTION_ATTEMPTS,
} from "@/lib/dev-hq/constants";
import { nextId, nowIso } from "@/lib/dev-hq/id";

export const AGENT_EXECUTION_TASK_ID = "agent-execution";

export interface AgentExecutionTaskPayload {
  executionId: string;
  agentId: string;
  /** The attempt's assignment id — the idempotency key for the callbacks. */
  assignmentId: string;
  instructions: string;
}

/** Deterministic simulated outcome from the instructions text (ADR-0001 O4). */
export type SimulatedOutcome = Extract<
  AgentExecutionStatus,
  "failed" | "timeout" | "succeeded"
>;

export function simulateOutcome(instructions: string): SimulatedOutcome {
  if (/fail/i.test(instructions)) return "failed";
  if (/timeout/i.test(instructions)) return "timeout";
  return "succeeded";
}

function buildAgentResult(
  execution: Execution,
  status: AgentExecutionStatus,
  summary: string | null,
): AgentResult {
  const at = nowIso();
  return {
    agentId: execution.agentId ?? "",
    taskId: execution.taskId,
    status,
    summary,
    output: null,
    filesChanged: [],
    commandsRun: [],
    evidenceIds: [],
    errors: [],
    usage: null,
    startedAt: execution.startedAt ?? at,
    completedAt: at,
  };
}

/**
 * Emit a typed execution lifecycle event from the service layer (ADR-0002 E3).
 * The Execution Manager stays pure — it never logs events itself.
 */
async function logExecutionEvent(
  type: string,
  executionId: string,
  agentId: string | null,
  message: string,
): Promise<void> {
  const agent = agentId ? getAgent(agentId) : null;
  await getDevHqAdapters().eventLogger.log({
    type,
    entityType: "execution",
    entityId: executionId,
    message,
    actorId: agentId,
    actorLabel: agent?.name ?? "System",
  });
}

/**
 * Ensure exactly one append-only log evidence entry for an execution attempt
 * outcome, keyed on a stable per-attempt uri so neither a reconciling retry nor
 * a concurrent callback duplicates it. Keyed in the store, not checked here: a
 * read-then-write check lets two callers both observe no row and both append.
 */
async function ensureOutcomeEvidence(
  execution: Execution,
  attempt: number,
  status: AgentExecutionStatus,
  agentId: string | null,
  detail?: string | null,
): Promise<void> {
  const { evidenceStore } = getDevHqAdapters();
  const ref = `execution:${execution.id}:attempt:${attempt}:outcome`;
  const base = `Agent execution ${execution.id} attempt ${attempt} reported "${status}".`;
  await evidenceStore.ensureEvidence({
    executionId: execution.id,
    taskId: execution.taskId,
    kind: "log",
    label: `Execution attempt ${attempt}: ${status}`,
    // The reported summary carries the provider's normalized failure reason
    // (code + message, credential-free) so a failed attempt is auditable.
    summary: detail ? `${base} ${detail}` : base,
    uri: ref,
    createdByAgentId: agentId,
  });
}

/**
 * The descriptive record one attempt outcome must leave behind: its outcome log.
 *
 * **Single source of this logic.** The first-pass callback and every
 * reconciliation path call exactly this function, so a record that reconciliation
 * restores is byte-for-byte the record the first pass would have written, and the
 * two can never drift. Every write is deduped by a stable per-attempt uri, so
 * calling it any number of times is a no-op after the first.
 */
async function ensureAttemptRecords(input: {
  execution: Execution;
  attempt: number;
  status: AgentExecutionStatus;
  agentId: string | null;
  summary?: string | null;
}): Promise<void> {
  await ensureOutcomeEvidence(
    input.execution,
    input.attempt,
    input.status,
    input.agentId,
    input.summary ?? null,
  );
}

/**
 * Ensure the audit timeline carries the assignment transition for this
 * assignment, exactly once (ADR-0002 E3).
 *
 * Deduped on the assignment id carried in the message, so it is safe to call for
 * a reused assignment and during reconciliation — which is what keeps the event
 * from being lost when assignment persistence succeeds but event logging fails.
 * Descriptive only: nothing reads it back to decide behaviour.
 */
export async function ensureAssignmentEvent(
  execution: Execution,
  assignmentId: string,
  agentId: string | null,
): Promise<void> {
  const agent = agentId ? getAgent(agentId) : null;
  await getDevHqAdapters().eventLogger.log({
    type: EXECUTION_EVENT_TYPE.assigned,
    entityType: "execution",
    entityId: execution.id,
    message: `Execution ${execution.id} assigned to ${
      agent?.name ?? "an agent"
    } for task ${execution.taskId} (assignment ${assignmentId}).`,
    actorId: agentId,
    actorLabel: agent?.name ?? "System",
    // The assignment *is* the transition identity. Keyed dedupe is atomic in the
    // store, so a first pass and any number of concurrent reconciliations produce
    // exactly one entry — no message matching, no read-then-write window.
    dedupeKey: `${EXECUTION_EVENT_TYPE.assigned}:${assignmentId}`,
  });
}

/**
 * Ensure the timeline records that an execution could not be given an agent and
 * remains queued (ADR-0001 O6). This changes no outcome — the queued execution is
 * the approved behaviour — it supplies the record that was missing, which is what
 * made a declined dispatch indistinguishable from one never requested.
 *
 * Keyed per (execution, attempt): reconciliation retries a stranded execution on
 * every sweep, and one deferral per attempt is the honest count. A genuinely new
 * attempt still records its own.
 *
 * **Only a capacity decline is a deferral, and the guard below is load-bearing.**
 * `execution_not_queued` means the execution is running, succeeded, failed or
 * cancelled — states the timeline already carries via `execution.claimed`,
 * `execution.succeeded` and `execution.exhausted`. Emitting here would be a late,
 * redundant signal about state already recorded, and its message would assert
 * "stays queued" about an execution that had left the queue: an untruth on an
 * append-only timeline, which is the exact defect class X4 removes from the
 * reclaim message.
 *
 * **Deleting the guard therefore reintroduces X4.** It is stated at this length
 * because a guard that makes a helper do nothing for some inputs reads like dead
 * weight to a later simplification pass. It is not: it is the condition the six
 * call sites share, held in one place so they cannot drift apart.
 */
export async function ensureAssignmentDeferredEvent(
  execution: Execution,
  reason: AssignmentDecision["reason"],
): Promise<void> {
  // Do not remove: see the X4 note above. Sites 1, 4 and 5 can reach here with
  // `execution_not_queued`; sites 2, 3 and 6 cannot, being enclosed by a queued
  // check. The guard is what keeps all six uniform at the call site.
  //
  // Site 3 is `reconcileQueuedDispatches`' decline path. Its loop opens with
  // `if (execution.status !== "queued") continue;`, so it is enclosed exactly as
  // sites 2 and 6 are. It occupies the gap AR-1E's ruling table left between
  // sites 2 and 4.
  if (reason !== "no_agent_available") return;
  const attempt = execution.attempt ?? 1;
  await getDevHqAdapters().eventLogger.log({
    type: EXECUTION_EVENT_TYPE.assignmentDeferred,
    entityType: "execution",
    entityId: execution.id,
    message: `Execution ${execution.id} could not be assigned an agent for task ${execution.taskId}; it stays queued at attempt ${attempt} for reconciliation to retry.`,
    actorId: null,
    actorLabel: "System",
    dedupeKey: `${EXECUTION_EVENT_TYPE.assignmentDeferred}:${execution.id}:${attempt}`,
  });
}

/**
 * Ensure the timeline records that a dispatched worker did not get its agent and
 * stood down. Keyed on the assignment: an assignment can decline the claim once,
 * and that run is over.
 *
 * The two declined outcomes share this event type and this key — the lifecycle
 * fact is the same ("this run stood down without claiming") — but not the same
 * message. Reporting "another attempt held the agent" for an agent that had gone
 * offline would put an untruth on an append-only timeline, which is the defect
 * class the reclaim message was corrected for.
 *
 * Deliberately not exported. Only this module absorbs a declined claim; the review
 * and escalation services never claim, so widening the surface would suggest
 * otherwise.
 */
async function ensureClaimLostEvent(
  execution: Execution,
  assignmentId: string,
  agentId: string | null,
  outcome: ClaimDeclinedOutcome,
): Promise<void> {
  const agent = agentId ? getAgent(agentId) : null;
  const agentLabel = agent?.name ?? "its assigned agent";
  const cause =
    outcome === "lost_to_concurrent_claim"
      ? "another attempt held the agent"
      : "the agent was no longer taking work";
  await getDevHqAdapters().eventLogger.log({
    type: EXECUTION_EVENT_TYPE.claimLost,
    entityType: "execution",
    entityId: execution.id,
    message: `Execution ${execution.id} could not claim ${agentLabel} for assignment ${assignmentId}; ${cause}, so this run stood down.`,
    actorId: agentId,
    actorLabel: agent?.name ?? "System",
    dedupeKey: `${EXECUTION_EVENT_TYPE.claimLost}:${assignmentId}`,
  });
}

/**
 * Ensure the execution has one `execution.retried` event per retry it has already
 * taken. An execution on attempt N has retried N-1 times; a crash between the
 * requeue transition and the event would otherwise lose that entry permanently.
 *
 * Keyed per attempt rather than counted from the timeline, so the reconstruction
 * is correct even after the bounded event buffer has evicted the originals. Events
 * stay out of the business of being a second state machine: the execution's
 * `attempt` remains authoritative and the entries are rebuilt to match it.
 */
async function ensureRetryEvents(
  execution: Execution,
  agentId: string | null,
): Promise<void> {
  const expected = Math.max((execution.attempt ?? 1) - 1, 0);
  const agent = agentId ? getAgent(agentId) : null;
  for (let attempt = 1; attempt <= expected; attempt += 1) {
    await getDevHqAdapters().eventLogger.log({
      type: EXECUTION_EVENT_TYPE.retried,
      entityType: "execution",
      entityId: execution.id,
      message: `Execution ${execution.id} attempt ${attempt} did not succeed; retrying as attempt ${
        attempt + 1
      }.`,
      actorId: agentId,
      actorLabel: agent?.name ?? "System",
      // Keyed per attempt: the retry that produced attempt N+1 happened once, and
      // the marker outlives the bounded event buffer, so a sweep long after the
      // entry was evicted cannot recreate it.
      dedupeKey: `${EXECUTION_EVENT_TYPE.retried}:${execution.id}:${attempt}`,
    });
  }
}

/**
 * Ensure exactly one terminal lifecycle event for an execution, deduped by type
 * (an execution terminates once) through a durable key rather than a search of
 * the trimmed event buffer. Safe to re-run during reconciliation.
 */
async function ensureTerminalEvent(
  execution: Execution,
  type: string,
  message: string,
  agentId: string | null,
): Promise<void> {
  const agent = agentId ? getAgent(agentId) : null;
  await getDevHqAdapters().eventLogger.log({
    type,
    entityType: "execution",
    entityId: execution.id,
    message,
    actorId: agentId,
    actorLabel: agent?.name ?? "System",
    // An execution terminates once per type, and the keyed marker is durable —
    // unlike a search of the bounded event buffer, which silently forgets and
    // would let a later sweep re-emit a long-evicted terminal event.
    dedupeKey: `${type}:${execution.id}`,
  });
}

/**
 * The lifecycle event a terminal execution status produces. Non-terminal statuses
 * are absent on purpose: they have no terminal event, and the lookup is what
 * makes that unrepresentable rather than a matter of getting a conditional right.
 */
const TERMINAL_EVENT_TYPE: Partial<Record<Execution["status"], string>> = {
  succeeded: EXECUTION_EVENT_TYPE.succeeded,
  cancelled: EXECUTION_EVENT_TYPE.cancelled,
  failed: EXECUTION_EVENT_TYPE.exhausted,
};

/**
 * Idempotent terminal finalization for a completed execution: emit the terminal
 * event once, and — for a retry-exhausted (failed) execution — raise/reconcile the
 * founder escalation. Re-running this reconciles a finalization that was
 * interrupted after the terminal transition (agent/assignment release already
 * happened atomically inside releaseExecution before the terminal status was set).
 */
async function finalizeTerminalExecution(
  execution: Execution,
  attempt: number,
  agentId: string | null,
): Promise<void> {
  // Terminality is a precondition, not a fallback. Deriving the event type by
  // treating "anything not succeeded or cancelled" as exhausted would emit — and
  // durably key — a terminal event for an execution that is merely queued between
  // attempts, permanently suppressing the real one when it genuinely exhausts.
  const type = TERMINAL_EVENT_TYPE[execution.status];
  if (!type) {
    return;
  }
  await ensureTerminalEvent(
    execution,
    type,
    `Execution ${execution.id} ${execution.status} after ${attempt} attempt${
      attempt === 1 ? "" : "s"
    }.`,
    agentId,
  );
  // Escalate only a genuinely exhausted execution. The escalation service treats
  // its precondition as an error, and reconciliation runs over executions it did
  // not itself transition, so the check belongs here too rather than relying on
  // every caller having produced this state the expected way.
  if (
    execution.status === "failed" &&
    (execution.attempt ?? 0) >= MAX_EXECUTION_ATTEMPTS
  ) {
    await raiseRetryExhaustionEscalation(execution);
  }
}

/**
 * Idempotently dispatch the durable agent-execution run for a specific assignment
 * (Task 1E-5). The **assignment is the dispatch idempotency boundary**: a confirmed
 * dispatch is recorded once on `assignment.triggerRunId`, and Trigger.dev's
 * idempotency key (the assignment id) collapses concurrent triggers to a single
 * logical run. Before dispatching it re-reads authoritative state and refuses a
 * stale, replaced, released, non-current, or non-queued assignment. A failed
 * dispatch leaves `triggerRunId` unset so a later reconciliation retries the *same*
 * assignment — never creating a new assignment, attempt, or logical run. Returns
 * the run id (existing or new), or null when the assignment is not dispatchable.
 */
export async function ensureDispatchForAssignment(
  assignmentId: string,
  instructions: string,
): Promise<string | null> {
  // In-process single-flight: concurrent callers for the same assignment await
  // one dispatch instead of racing between the triggerRunId check and the write.
  // This is an optimization, not the boundary — `assignment.triggerRunId` plus
  // Trigger's idempotency key remain authoritative across processes and restarts.
  const inFlight = dispatchesInFlight.get(assignmentId);
  if (inFlight) return inFlight;

  const dispatch = performDispatch(assignmentId, instructions).finally(() => {
    dispatchesInFlight.delete(assignmentId);
  });
  dispatchesInFlight.set(assignmentId, dispatch);
  return dispatch;
}

const dispatchesInFlight = new Map<string, Promise<string | null>>();

async function performDispatch(
  assignmentId: string,
  instructions: string,
): Promise<string | null> {
  const assignment = getAssignment(assignmentId);
  if (!assignment) return null;
  // Already dispatched for this assignment — idempotent no-op.
  if (assignment.triggerRunId) return assignment.triggerRunId;

  // Re-read authoritative execution state and verify the assignment is current.
  const execution =
    getDevHqStore().executions.get(assignment.executionId) ?? null;
  if (!execution) return null;
  if (execution.status !== "queued") return null; // non-terminal, still queued
  if (execution.assignmentId !== assignmentId) return null; // current, not replaced
  if (assignment.status === "released") return null; // not released
  if (!execution.agentId || execution.agentId !== assignment.agentId) {
    return null; // assignment belongs to this execution's current agent
  }

  // Verify the assigned agent against the execution's persisted routing before
  // dispatching. A missing agent, or one that no longer satisfies the routing,
  // must not run this attempt: refusing leaves the assignment undispatched for
  // `reconcileQueuedDispatches` to repair.
  const agent = getAgent(assignment.agentId);
  if (!agent) return null;
  const routedProvider = execution.routing?.provider ?? null;
  if (routedProvider && agent.provider !== routedProvider) return null;

  const handle = await tasks.trigger(
    AGENT_EXECUTION_TASK_ID,
    {
      executionId: execution.id,
      agentId: assignment.agentId,
      assignmentId,
      instructions,
    } satisfies AgentExecutionTaskPayload,
    { idempotencyKey: assignmentId },
  );

  // Record the dispatch (the idempotency boundary) on the *current* records, not
  // the pre-await snapshots. While tasks.trigger() was in flight the worker may
  // have already delivered its running callback and transitioned the assignment
  // to claimed and the execution to running (with a claim + lease). Re-read both
  // and stamp only triggerRunId, so a fast worker's newer lifecycle state is
  // never rolled back to assigned/queued and its claim/lease is never cleared.
  const currentAssignment = getAssignment(assignmentId);
  if (currentAssignment) {
    saveAssignment({
      ...currentAssignment,
      triggerRunId: handle.id,
      // Starts the claim deadline: a dispatched assignment that never claims has
      // no lease to expire, so this stamp is what makes it recoverable.
      dispatchedAt: currentAssignment.dispatchedAt ?? nowIso(),
    });
  }
  const currentExecution =
    getDevHqStore().executions.get(assignment.executionId) ?? null;
  // Only stamp the execution while this assignment is still its current attempt;
  // if it has since been superseded (reclaim/retry created a new assignment), the
  // run id belongs to the old attempt's assignment record only.
  if (currentExecution && currentExecution.assignmentId === assignmentId) {
    saveExecution({ ...currentExecution, triggerRunId: handle.id });
  }
  return handle.id;
}

/**
 * Records reconciliation: restore the descriptive records of any attempt that has
 * a recorded provider outcome but whose execution has already moved on — the
 * crash-after-transition case, where there is no callback left to deliver them.
 *
 * Driven by execution state, not by evidence: evidence is only ever read here to
 * deduplicate its own writes, never to decide what the lifecycle should do.
 * Repeats are free.
 */
async function reconcileAttemptRecords(): Promise<void> {
  // Execution-driven: every agent-backed execution that has left `running` should
  // already carry the records its own state implies (retry events, terminal event,
  // escalation, and the outcome when state knows it). This catches interruptions
  // that left no checkpoint at all, including simulated agents.
  for (const execution of [...getDevHqStore().executions.values()]) {
    if (execution.status === "running") continue;
    // Agent-backed work only: founder-request executions are the workflow
    // engine's, and reconstructing agent records for them would be meaningless.
    if (!execution.routing && !execution.assignmentId) continue;
    await reconcileRecordsFor(execution);
  }

}

/**
 * Whether an agent still satisfies the execution's persisted routing. An
 * execution with no routed provider (never assigned, or a legacy record) imposes
 * no provider constraint.
 */
function satisfiesRouting(execution: Execution, agentId: string): boolean {
  const routedProvider = execution.routing?.provider ?? null;
  if (!routedProvider) return true;
  return getAgent(agentId)?.provider === routedProvider;
}

/**
 * True when a dispatched assignment has gone unclaimed past the deadline. Such an
 * assignment never became running, so it has no lease and is invisible to reclaim;
 * this is the only signal that its worker is never coming.
 */
function isClaimDeadlineExpired(
  assignment: AgentAssignment,
  now: string,
): boolean {
  if (!assignment.triggerRunId || assignment.claimedAt) return false;
  if (assignment.status !== "assigned") return false;
  const dispatchedAt = assignment.dispatchedAt ?? assignment.createdAt;
  return (
    new Date(now).getTime() - new Date(dispatchedAt).getTime() >
    EXECUTION_CLAIM_DEADLINE_MS
  );
}

async function reconcileQueuedDispatches(now?: string): Promise<void> {
  const at = now ?? nowIso();
  for (const execution of [...getDevHqStore().executions.values()]) {
    if (execution.status !== "queued") continue;
    const attempt = execution.attempt ?? 0;
    // An authorized attempt is within the retry budget.
    if (attempt < 1 || attempt > MAX_EXECUTION_ATTEMPTS) continue;

    let assignmentId = execution.assignmentId ?? null;
    let agentId = execution.agentId ?? null;

    // Two dead ends produce a queued assignment nothing can ever run, and neither
    // holds a lease, so lease reclaim cannot see them:
    //
    //   1. its agent can no longer satisfy the execution's routing — dispatch
    //      correctly refuses it rather than running on the wrong provider;
    //   2. it was dispatched but never claimed past the deadline — its worker
    //      lost the race for a capacity-one agent (or died before claiming), so
    //      its Trigger run is dead.
    //
    // Both are released and re-assigned under the same policy, costing no
    // business attempt. The old run, if it somehow wakes, finds itself no longer
    // current and its callbacks are already no-ops.
    if (assignmentId && agentId) {
      const assignment = getAssignment(assignmentId);
      const unusable =
        !satisfiesRouting(execution, agentId) ||
        (assignment ? isClaimDeadlineExpired(assignment, at) : false);
      if (unusable) {
        const released = await releaseAssignmentForReassignment(execution.id);
        assignmentId = released.assignmentId ?? null;
        agentId = released.agentId ?? null;
      }
    }

    // Re-assign a routed execution that is queued with no agent. A retry lands
    // here when no agent satisfying its persisted routing was free at the time —
    // notably a provider-backed execution whose provider was busy. Re-assigning
    // under the persisted policy is what keeps it from being stranded without
    // ever letting it drift onto a different provider. Founder-request
    // executions carry no routing and are never touched here.
    if (!assignmentId || !agentId) {
      if (!execution.routing) continue;
      const { decision, created } = await ensureAssignment(execution.id);
      if (!decision.assigned || !decision.assignment) {
        // X1's surviving path. Without this the sweep re-observes a stranded
        // execution every cycle and records nothing, leaving it queued with a
        // null agent, an unchanged attempt, and an empty timeline — the exact
        // state that made a declined dispatch indistinguishable from one never
        // requested. Outcome is unchanged: it still stays queued and this still
        // continues. Only the missing record is supplied.
        //
        // Idempotency is the emitter's existing per-(execution, attempt) dedupe
        // key, so repeat sweeps no-op rather than appending one entry per cycle.
        await ensureAssignmentDeferredEvent(execution, decision.reason);
        continue;
      }
      assignmentId = decision.assignment.id;
      agentId = decision.agentId;
      void created;
    }

    // Recorded before the dispatch checks below, and for already-dispatched
    // assignments too: this is the recovery path for an assignment that persisted
    // while its event did not. The durable key makes it a no-op whenever the
    // transition is already on the timeline, so it can never add a second one.
    if (assignmentId) {
      await ensureAssignmentEvent(execution, assignmentId, agentId);
    }

    const assignment = getAssignment(assignmentId);
    if (!assignment || assignment.status === "released") continue;
    if (assignment.triggerRunId) continue; // already dispatched
    await ensureDispatchForAssignment(
      assignmentId,
      recoveryInstructions(execution),
    );
  }
}

export interface DispatchAgentExecutionInput {
  taskId: string;
  requiredCapabilities?: string[];
  /**
   * Route this work to a specific agent when it is eligible (available and
   * capability-matching). Used to route work to a specific agent deterministically
   * instead of relying on least-recently-active rotation.
   * Falls back to normal selection when the preferred agent is not eligible.
   * Once assigned it is persisted as the execution's routing policy, so every
   * retry reproduces it.
   */
  preferredAgentId?: string;
  instructions?: string;
  /**
   * How thoroughly the completed work is reviewed (ADR-0002 E1). Defaults to
   * `basic`; pass `none` to dispatch work that is final when it succeeds.
   */
  reviewPolicy?: ReviewPolicy;
  /**
   * Caller-supplied dispatch idempotency key. Two dispatches carrying the same
   * key for the same task are the *same* logical dispatch: they converge on one
   * canonical execution, one assignment, and one Trigger run, no matter how they
   * interleave. Omitting it means "this is a new logical dispatch" and the
   * service allocates a fresh key.
   */
  idempotencyKey?: string;
}

export interface DispatchAgentExecutionResult {
  assigned: boolean;
  reason: AssignmentDecision["reason"];
  executionId: string | null;
  agentId: string | null;
  triggerRunId: string | null;
}

/** Keys are embedded in canonical execution ids, so the shape is constrained. */
const DISPATCH_KEY_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

/**
 * The canonical Execution id a manual dispatch key authorizes.
 *
 * **This function is the only place in the system that knows this encoding.**
 * Everything else treats the value as an opaque execution id. Deterministic
 * rather than allocated, so it is stable across every failure and replay without
 * an allocation step, and collision-free against organic ids (`nextId` only ever
 * produces `exec-<digits>-<digits>`) and against revision ids (`exec-revision-*`).
 */
export function dispatchExecutionIdFor(idempotencyKey: string): string {
  return `exec-dispatch-${idempotencyKey}`;
}

/** Thrown when a dispatch key is replayed with a different request. */
export class ConflictingDispatchRequestError extends Error {
  constructor(executionId: string, field: string) {
    super(
      `Dispatch key already used for execution ${executionId} with a different ${field}. ` +
        "Discard the held request to start a new one.",
    );
    this.name = "ConflictingDispatchRequestError";
  }
}

/**
 * Compare a replayed dispatch against the stored request. Only values the caller
 * actually supplied are compared: a recovery that has lost its form state (after
 * a reload, say) supplies nothing and legitimately runs the stored request.
 */
function assertRequestMatches(
  execution: Execution,
  input: DispatchAgentExecutionInput,
  incoming: ExecutionRequest,
): void {
  const stored = execution.request;
  if (!stored) return;

  if (input.instructions !== undefined && stored.instructions !== incoming.instructions) {
    throw new ConflictingDispatchRequestError(execution.id, "instructions");
  }
  if (
    input.requiredCapabilities !== undefined &&
    stored.requiredCapabilities.join(",") !== incoming.requiredCapabilities.join(",")
  ) {
    throw new ConflictingDispatchRequestError(execution.id, "capability set");
  }
  if (
    input.preferredAgentId !== undefined &&
    stored.preferredAgentId !== incoming.preferredAgentId
  ) {
    throw new ConflictingDispatchRequestError(execution.id, "preferred agent");
  }
}

/**
 * Manual dispatch entry point (Simulation Lab).
 *
 * **Idempotent by construction**, mirroring the escalation-revise path: the
 * caller's key derives a canonical execution id, the execution is a keyed
 * create-or-get at exactly that id, the assignment is create-or-reuse on that
 * execution, and dispatch is keyed on the assignment. Every step is a keyed
 * lookup with no scan, so duplicate and concurrent dispatches converge instead of
 * creating parallel executions:
 *
 *   - concurrent duplicates  -> one execution, one assignment, one logical run
 *   - failed before create   -> a replay creates it at the same id
 *   - failed before assign   -> a replay assigns the existing execution
 *   - failed during dispatch -> a replay redispatches the same assignment, as
 *                               does `reconcileQueuedDispatches`
 *
 * Returns a non-assigned result (rather than throwing) when no eligible agent is
 * available or the keyed execution has already left the queue.
 */
export async function dispatchAgentExecution(
  input: DispatchAgentExecutionInput,
): Promise<DispatchAgentExecutionResult> {
  const task = getDevHqStore().tasks.get(input.taskId);
  if (!task) {
    throw new Error(`Task not found: ${input.taskId}`);
  }
  const idempotencyKey = input.idempotencyKey ?? nextId("dsp");
  if (!DISPATCH_KEY_PATTERN.test(idempotencyKey)) {
    throw new Error(
      "Dispatch idempotencyKey must be 1-64 characters of [A-Za-z0-9_-].",
    );
  }

  const policy = {
    requiredCapabilities: input.requiredCapabilities,
    preferredAgentId: input.preferredAgentId,
  };
  const request: ExecutionRequest = {
    instructions:
      (input.instructions ?? task.description ?? "").trim() ||
      "Execute the assigned task.",
    requiredCapabilities: [...(input.requiredCapabilities ?? [])],
    preferredAgentId: input.preferredAgentId ?? null,
  };

  // 1. Create-or-get the canonical execution, carrying the intended routing
  //    policy from the moment it exists. A second dispatch under the same key
  //    finds this one rather than creating a parallel canonical execution; a key
  //    already used by another task is rejected by ensureExecution. If step 2
  //    then fails, the persisted policy is what lets the sweep finish the job.
  const execution = await ensureExecution({
    executionId: dispatchExecutionIdFor(idempotencyKey),
    taskId: input.taskId,
    policy,
    request,
    reviewPolicy: input.reviewPolicy ?? DEFAULT_REVIEW_POLICY,
  });

  // One key, one request. A replay that supplies materially different parameters
  // is a different logical dispatch wearing the same identity, and silently
  // running either version would make the key meaningless.
  assertRequestMatches(execution, input, request);

  // 2. Create or recover its assignment. Not-assigned outcomes leave state
  //    untouched, so a later call can retry with nothing to unwind.
  const { decision, created } = await ensureAssignment(execution.id, policy);
  if (!decision.assigned || !decision.assignment) {
    // ADR-0001 O6: a declined dispatch is a lifecycle outcome and must reach the
    // timeline. The execution stays queued — that is the approved behaviour — but
    // it is no longer silent.
    await ensureAssignmentDeferredEvent(execution, decision.reason);
    return {
      assigned: false,
      reason: decision.reason,
      executionId: execution.id,
      agentId: null,
      triggerRunId: null,
    };
  }

  // 3. Record the assignment transition through the one keyed helper every path
  //    uses, so a dispatch followed by any number of sweeps leaves exactly one
  //    entry — whether this call created the assignment or reused it.
  void created;
  await ensureAssignmentEvent(execution, decision.assignment.id, decision.agentId);

  // 4. Dispatch through the assignment-keyed idempotent path, running the stored
  //    request so every replay dispatches identical work.
  const triggerRunId = await ensureDispatchForAssignment(
    decision.assignment.id,
    execution.request?.instructions ?? request.instructions ?? "Execute the assigned task.",
  );

  return {
    assigned: true,
    reason: "assigned",
    executionId: execution.id,
    agentId: decision.agentId,
    triggerRunId,
  };
}

/**
 * Callback: the run has started — claim the assigned agent. Idempotent: a replayed
 * callback for an already-claimed attempt, or a stale callback naming an assignment
 * that a later attempt has superseded, is a safe no-op (no double-claim, no
 * duplicate event). Keyed on the attempt's `assignmentId` (ADR-0002 E3; Task 1E-2).
 *
 * **The claim is taken through the `ExecutionRunner` port**, resolved from the
 * composition root, rather than by importing the Execution Manager directly. That
 * is what makes the port a substitutable seam instead of a declaration: swapping
 * the registered runner changes what this handler observes.
 */
export async function handleExecutionRunning(
  executionId: string,
  assignmentId?: string,
): Promise<Execution> {
  const { executionRunner } = getDevHqAdapters();
  const existing = await executionRunner.getExecution(executionId);
  if (!existing) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  // Stale callback: names an assignment that is no longer current.
  if (assignmentId && existing.assignmentId !== assignmentId) {
    return existing;
  }
  // Already claimed for this attempt (replay), or not in a claimable state.
  if (existing.status !== "queued") {
    return existing;
  }
  // A queued execution with no agent or no assignment is not a state this
  // callback's own dispatch could have produced, so it stays loud rather than
  // being folded into a declined claim.
  if (!existing.agentId || !existing.assignmentId) {
    throw new Error(`Execution has no assigned agent to run: ${executionId}`);
  }

  const result = await executionRunner.claimExecution(
    executionId,
    existing.agentId,
  );
  if (result.outcome !== "claimed") {
    // The claim was declined: another attempt holds the agent, or the agent is no
    // longer taking work. Either way this is a 200 with the unchanged execution,
    // so the worker reads a non-running status and stands down cleanly; the claim
    // deadline then recovers this assignment. A throw here would become a 500,
    // which the worker's postJson raises before it can read the answer.
    await ensureClaimLostEvent(
      existing,
      existing.assignmentId,
      existing.agentId,
      result.outcome,
    );
    return existing;
  }
  const execution = result.execution;
  await logExecutionEvent(
    EXECUTION_EVENT_TYPE.claimed,
    execution.id,
    execution.agentId,
    `Execution ${execution.id} claimed and running.`,
  );
  return execution;
}

/**
 * Callback: extend the lease for a still-running execution, through the
 * `ExecutionRunner` port. The attempt's assignment identifies the caller, so a
 * stale worker's beat cannot keep a successor attempt's lease alive.
 *
 * The port requires that identity. This handler still accepts it optionally
 * because it is the HTTP edge: the internal callback route parses it out of a
 * request body, where it can legitimately be absent (an older worker, a
 * hand-issued beat). An omitted identity means "whatever attempt is current", so
 * it is resolved to the execution's own current assignment **here**, at the edge,
 * rather than letting an anonymous beat cross the seam and become
 * indistinguishable from a stale worker's inside the runner.
 */
export async function handleExecutionHeartbeat(
  executionId: string,
  assignmentId?: string,
): Promise<Execution> {
  const { executionRunner } = getDevHqAdapters();
  const current = await executionRunner.getExecution(executionId);
  if (!current) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  const attemptId = assignmentId ?? current.assignmentId;
  if (!attemptId) {
    // The execution holds no assignment, so there is no lease to extend and
    // nothing for the runner to compare against. Absorbed, like every other beat
    // whose attempt has already ended.
    return current;
  }
  return executionRunner.heartbeat(executionId, attemptId);
}

export interface CompleteExecutionInput {
  executionId: string;
  status: AgentExecutionStatus;
  /**
   * What the reporting worker believes it ran. Descriptive only — **nothing
   * re-dispatches from it**. A retry runs `recoveryInstructions(execution)`, the
   * execution's own immutable persisted request, exactly as every other
   * re-dispatch path does. Optional because a caller that omits it changes
   * nothing: the HTTP edge used to substitute `""` here, and that empty string
   * became the work the retry ran.
   */
  instructions?: string;
  /** The completing attempt's assignment id — the idempotency key. */
  assignmentId?: string;
  summary?: string | null;
}

export interface CompleteExecutionResult {
  execution: Execution;
  /** True when a failed/timed-out attempt was re-dispatched under the retry budget. */
  retried: boolean;
}

/**
 * Callback: record the terminal result via the Execution Manager. A failed or
 * timed-out attempt with retry budget remaining is re-dispatched as the next
 * attempt (preserving the 3-attempt WML budget through Trigger); an exhausted or
 * successful execution is terminal.
 */
export async function handleExecutionComplete(
  input: CompleteExecutionInput,
): Promise<CompleteExecutionResult> {
  const current = await getExecution(input.executionId);
  if (!current) {
    throw new Error(`Execution not found: ${input.executionId}`);
  }

  // Stale callback (Task 1E-2): names an assignment a later attempt superseded.
  // No-op — the old attempt's callback must not affect the current one.
  if (input.assignmentId && current.assignmentId !== input.assignmentId) {
    return { execution: current, retried: false };
  }

  // Fresh callback for the current attempt: perform the first finalization.
  if (current.status === "running") {
    const attemptAgentId = current.agentId;
    const attempt = current.attempt ?? 1;
    const result = buildAgentResult(current, input.status, input.summary ?? null);
    const execution = await releaseExecution(input.executionId, result);

    // Everything after the transition is descriptive and idempotent. If the
    // process dies part-way through, `reconcileAttemptRecords` re-runs exactly
    // this sequence from Work-Management state without repeating the transition.
    await ensureAttemptRecords({
      execution,
      attempt,
      status: input.status,
      agentId: attemptAgentId,
      summary: input.summary,
    });

    // A requeued execution is the next retry attempt, whether or not an agent
    // was free to take it. Either way it is *not* terminal: emitting a terminal
    // event here would durably key `execution.exhausted` for work that is still
    // queued and recoverable, and suppress the real event when the budget is
    // genuinely spent later.
    if (execution.status === "queued") {
      await ensureRetryEvents(execution, attemptAgentId);

      // No eligible capacity for this attempt yet. The execution keeps its
      // routing and awaits `reconcileQueuedDispatches`, which assigns and
      // dispatches it when capacity returns — no attempt is consumed by waiting.
      if (!execution.agentId || !execution.assignmentId) {
        await ensureAssignmentDeferredEvent(execution, "no_agent_available");
        return { execution, retried: false };
      }

      // The retry created a new assignment, which is a transition of its own.
      // Recording it here rather than leaving it to the sweep keeps the timeline
      // in step with state; the keyed helper makes the sweep's later call a no-op.
      // Record the retry first, then dispatch: a failed dispatch leaves the
      // execution queued for queued-dispatch reconciliation to redispatch the
      // same assignment, without consuming another retry.
      await ensureAssignmentEvent(
        execution,
        execution.assignmentId,
        execution.agentId,
      );
      // The execution's own persisted request, never the callback's payload.
      // A retry is another attempt at *the same authorized work*, so it must run
      // what the founder asked for — the same rule the reclaim and queued-sweep
      // re-dispatches already follow through this one helper. Taking the
      // caller's `instructions` made the work a function of whatever the last
      // worker happened to report: the internal complete route substitutes `""`
      // when the field is absent, so an omitted field re-ran the task with empty
      // instructions, and a worker reporting different text silently replaced
      // the request on every retry.
      await ensureDispatchForAssignment(
        execution.assignmentId,
        recoveryInstructions(execution),
      );
      return { execution, retried: true };
    }

    await ensureRetryEvents(execution, attemptAgentId);
    await finalizeTerminalExecution(execution, attempt, attemptAgentId);
    await requestReviewIfSucceeded(execution);
    return { execution, retried: false };
  }

  // Re-entry after the current attempt already left `running`. The transition has
  // happened and must never be repeated, but everything after it is descriptive
  // and may have been lost to a crash — including, for a succeeded execution, the
  // provider's own output. So reconcile the records for every post-`running`
  // state rather than exiting merely because the execution is terminal.
  await reconcileRecordsFor(current);
  // The review request stays out of reconcileRecordsFor because that function
  // *reconstructs records a completed transition should already have left*, while
  // a review request *initiates new work*. Escalation qualifies under the first —
  // which is why finalizeTerminalExecution may raise one from inside the
  // reconciliation path — and a review request does not. (The discriminator is
  // that distinction, not "reaches another subsystem": reconcileRecordsFor does
  // reach one, via finalizeTerminalExecution -> raiseRetryExhaustionEscalation.)
  //
  // But a crash between the terminal transition and the fresh path's request
  // leaves the review unrequested, and only the sweep would ever notice. Asking
  // here closes the gap on the very next callback. Idempotent: the canonical
  // review id makes a repeat a no-op.
  await requestReviewIfSucceeded(current);
  return { execution: current, retried: false };
}

/**
 * Hand a succeeded execution to the review loop.
 *
 * Imported dynamically so this service carries no static dependency on the review
 * subsystem: review policy and the revision loop belong to the review service,
 * which reaches back here the same way to dispatch a revision. Failures are not
 * swallowed silently — but the review is also reconciled by the sweep, so a lost
 * request is recovered rather than dropped.
 */
async function requestReviewIfSucceeded(execution: Execution): Promise<void> {
  if (execution.status !== "succeeded") return;
  const policy = execution.reviewPolicy ?? null;
  if (!policy || policy === "none") return;
  const { ensureReviewForExecution } = await import(
    "@/lib/dev-hq/review-service"
  );
  await ensureReviewForExecution(execution.id);
}

/**
 * Restore the descriptive records an execution should already have, from
 * Work-Management state alone: the attempt outcome its terminal status implies,
 * the retry events its attempt count implies, and — once terminal — the terminal
 * event and escalation.
 *
 * Never transitions anything and never invokes a provider. Safe to run any number
 * of times; every write underneath is deduped.
 */
async function reconcileRecordsFor(execution: Execution): Promise<void> {
  const attempt = execution.attempt ?? 1;

  // The outcome is only ever taken from state that actually knows it: the
  // execution's own terminal status. A requeued execution is deliberately left
  // without outcome evidence — inventing "failed" would be a fabricated record,
  // and evidence must describe what happened, not guess at it.
  const terminalStatus: AgentExecutionStatus | null =
    execution.status === "succeeded"
      ? "succeeded"
      : execution.status === "failed"
        ? "failed"
        : execution.status === "cancelled"
          ? "cancelled"
          : null;
  if (terminalStatus) {
    await ensureAttemptRecords({
      execution,
      attempt,
      status: terminalStatus,
      agentId: execution.agentId,
    });
  }

  // Retry events are derivable from the execution's own attempt counter, which
  // is authoritative whether or not any provider was involved.
  await ensureRetryEvents(execution, execution.agentId);

  if (terminalStatus) {
    await finalizeTerminalExecution(execution, attempt, execution.agentId);
  }
}

export interface ReclaimResult {
  reclaimed: number;
}

/**
 * Instructions for a recovery re-dispatch. The execution's own immutable request
 * is authoritative: recovering with the task description instead would silently
 * run different work than the founder asked for. The description remains the
 * fallback for executions created before the request envelope existed.
 */
function recoveryInstructions(execution: Execution): string {
  const stored = (execution.request?.instructions ?? "").trim();
  if (stored) return stored;
  const task = getDevHqStore().tasks.get(execution.taskId);
  return (task?.description ?? "").trim() || "Execute the assigned task.";
}

/**
 * Self-healing sweep step (Task 1E-5): escalate any terminal-failed agent
 * execution whose escalation was never created — e.g., a reclaim or completion
 * interrupted after the terminal transition but before escalation. Idempotent:
 * executions that already escalated (open or resolved) are skipped, and the raise
 * itself is idempotent. This gives the reclaim path the same terminal-failure
 * reconciliation the completion callback gained via re-entry.
 */
async function reconcileUnescalatedFailures(): Promise<void> {
  const { escalationStore } = getDevHqAdapters();
  for (const execution of [...getDevHqStore().executions.values()]) {
    if (execution.status !== "failed") continue;
    // Agent executions only (founder-request executions have no agent/assignment).
    if (!execution.agentId || !execution.assignmentId) continue;
    if ((execution.attempt ?? 0) < MAX_EXECUTION_ATTEMPTS) continue;
    if (await escalationStore.findByExecution(execution.id)) continue;
    await raiseRetryExhaustionEscalation(execution);
  }
}

/**
 * Append-only log evidence for a lease-expiry reclaim (Task 1E-3, consistency
 * with the Task 1E-1 evidence pattern). Attributed to the reclaimed execution and
 * recorded as a system action; purely descriptive — it never drives control flow.
 */
async function recordReclaimEvidence(execution: Execution): Promise<void> {
  const summary =
    execution.status === "queued"
      ? `Execution ${execution.id} lease expired and was reclaimed; recovery created a new attempt ${execution.attempt}.`
      : `Execution ${execution.id} lease expired and was reclaimed; retry budget spent, no new attempt created.`;
  await getDevHqAdapters().evidenceStore.addEvidence({
    executionId: execution.id,
    taskId: execution.taskId,
    kind: "log",
    label: "Execution reclaimed: lease expired",
    summary,
    createdByAgentId: null,
  });
}

/**
 * Scheduled recovery of expired execution leases (Task 1E-3). Delegates the pure
 * state transition to the Execution Manager's `reclaimStale`, which moves each
 * timed-out attempt to a new assignment identity (so pre-reclaim callbacks are
 * safely ignored by the assignmentId idempotency guard). For each reclaimed
 * execution this emits exactly one `execution.reclaimed` event and, when a retry
 * remains, re-dispatches the new attempt. Repeated sweeps do not reclaim the same
 * attempt twice: a reclaimed attempt is no longer `running`, so `reclaimStale`
 * skips it. `now` defaults to the time of the call.
 */
export async function handleExecutionReclaim(
  now?: string,
): Promise<ReclaimResult> {
  const reclaimed = await reclaimStale(now);

  for (const execution of reclaimed) {
    // One append-only log evidence entry per reclaim (audit only, no control flow).
    await recordReclaimEvidence(execution);
    // Three outcomes, not two. A reclaim can requeue an attempt that no agent was
    // free to take: it is neither dispatchable nor terminal, so the original
    // two-branch shape skipped it entirely (X3) while the message still announced
    // a retry that nothing was running (X4).
    const requeuedWithAgent =
      execution.status === "queued" && Boolean(execution.agentId);
    const requeuedWithoutAgent =
      execution.status === "queued" && !execution.agentId;

    await logExecutionEvent(
      EXECUTION_EVENT_TYPE.reclaimed,
      execution.id,
      execution.agentId,
      requeuedWithAgent
        ? `Execution ${execution.id} lease expired; reclaimed and retrying as attempt ${execution.attempt}.`
        : requeuedWithoutAgent
          ? `Execution ${execution.id} lease expired; reclaimed as attempt ${execution.attempt}, which is waiting for an available agent.`
          : `Execution ${execution.id} lease expired; reclaimed and marked ${execution.status} (retry budget spent).`,
    );

    if (requeuedWithAgent) {
      await ensureDispatchForAssignment(
        execution.assignmentId!,
        recoveryInstructions(execution),
      );
    } else if (requeuedWithoutAgent) {
      // Deliberately redundant with site 3 (`reconcileQueuedDispatches`), which
      // runs later in this same sweep and would emit for the same
      // (execution, attempt). Both are kept, and the dedupe key collapses them to
      // one entry. The reason to keep this one is timeline fidelity (ADR-0002 E5):
      // emitting here places the deferral *adjacent to this execution's own
      // `reclaimed` event*, so the audit history reads in true causal order rather
      // than batching every deferral after every reclaim. That adjacency is the
      // contract pinned by "emits the requeue deferral from the reclaim loop,
      // before the sweep runs" — deleting this call inverts the ordering and fails
      // that test. Do not remove it as a duplicate.
      await ensureAssignmentDeferredEvent(execution, "no_agent_available");
    } else if (execution.status === "failed") {
      // A reclaim that spent the last of the retry budget runs the shared terminal
      // finalization: it emits the deduped execution.exhausted lifecycle event and
      // reconciles the escalation. reconcileUnescalatedFailures below is the
      // self-healing backstop if that escalation step is interrupted.
      await finalizeTerminalExecution(
        execution,
        execution.attempt ?? MAX_EXECUTION_ATTEMPTS,
        execution.agentId,
      );
    }
  }

  // Distinct reconciliation responsibilities on the sweep cadence. Each one owns
  // exactly one class of interruption, and none of them repeats a transition:
  //   running lease expiry           -> reclaimStale (above, Execution Manager)
  //   queued, unassigned/undispatched-> reconcileQueuedDispatches
  //   records lost after transition  -> reconcileAttemptRecords
  //   terminal failed w/o escalation -> reconcileUnescalatedFailures
  await reconcileQueuedDispatches(now);
  await reconcileAttemptRecords();
  await reconcileUnescalatedFailures();

  return { reclaimed: reclaimed.length };
}
