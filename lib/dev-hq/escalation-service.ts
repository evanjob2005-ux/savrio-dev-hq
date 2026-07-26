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
  ensureAssignment,
  ensureExecution,
  getExecution,
} from "@/lib/dev-hq/execution-manager";
import { getAgent, getDevHqStore } from "@/lib/dev-hq/store";
import {
  ESCALATION_EVENT_TYPE,
  EXECUTION_EVENT_TYPE,
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  FOUNDER_USER_ID,
  MAX_EXECUTION_ATTEMPTS,
} from "@/lib/dev-hq/constants";
import type {
  Escalation,
  EscalationResolution,
  Execution,
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

async function ensureTaskStatus(
  taskId: string,
  status: Task["status"],
): Promise<void> {
  const { taskRepository } = getDevHqAdapters();
  const task = await taskRepository.getTask(taskId);
  if (task && task.status !== status) {
    await taskRepository.updateTask(taskId, { status });
  }
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
 *     actor's transition refuses this write rather than being overwritten.
 */
async function activateTaskForLiveRevision(
  taskId: string,
  executionId: string,
): Promise<void> {
  const { taskRepository } = getDevHqAdapters();
  const target = taskStatusForResolution("revise");
  const observed = await taskRepository.getTask(taskId);
  if (!observed || observed.status === target) {
    return;
  }
  await taskRepository.updateTaskStatusIf(taskId, target, (current) => {
    if (current.status !== observed.status) {
      return false; // another actor moved the task since it was observed
    }
    const status = revisionStatusNow(executionId);
    return status !== null && !isTerminalExecution(status);
  });
}

async function ensureEscalationEvidence(input: {
  ref: string;
  taskId: string;
  executionId: string | null;
  label: string;
  summary: string;
  createdByAgentId: string | null;
}): Promise<void> {
  const { evidenceStore } = getDevHqAdapters();
  const existing = await evidenceStore.listForTask(input.taskId);
  if (existing.some((evidence) => evidence.uri === input.ref)) {
    return;
  }
  await evidenceStore.addEvidence({
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
  const { eventLogger } = getDevHqAdapters();
  const recent = await eventLogger.listRecent({
    entityType: "task",
    entityId: input.taskId,
    limit: 200,
  });
  const already = recent.some(
    (event) =>
      event.type === input.type && event.message.includes(input.escalationId),
  );
  if (already) {
    return;
  }
  await eventLogger.log({
    type: input.type,
    entityType: "task",
    entityId: input.taskId,
    message: input.message,
    actorId: input.actorId,
    actorLabel: input.actorLabel,
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

/** Dispatch instructions for the revision: the task's own description. */
function reviseInstructions(taskId: string): string {
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
  const execution = await ensureExecution({
    executionId,
    taskId: escalation.taskId,
  });

  // 3. Create or recover its assignment. A non-assigned outcome (no agent free,
  //    or the execution already left the queue) leaves state untouched for a
  //    later replay; there is nothing to unwind.
  const { decision, created } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // Not dispatchable right now (no agent free) or no longer dispatchable at
    // all (the revision already terminated). Either way, report the canonical
    // execution's authoritative state so the caller can decide about the task.
    return getExecution(executionId);
  }

  // 4. Emit the assignment lifecycle event exactly once, when this call is the
  //    one that created the assignment (the pre-existing dispatch path emits the
  //    same event; a replay reusing the assignment must not duplicate it).
  if (created) {
    const agent = decision.agentId ? getAgent(decision.agentId) : null;
    await getDevHqAdapters().eventLogger.log({
      type: EXECUTION_EVENT_TYPE.assigned,
      entityType: "execution",
      entityId: execution.id,
      message: `Execution ${execution.id} assigned to ${
        agent?.name ?? "an agent"
      } for task ${escalation.taskId}.`,
      actorId: decision.agentId,
      actorLabel: agent?.name ?? "System",
    });
  }

  // 5. Dispatch through the assignment-keyed idempotent path, so concurrent
  //    callers collapse onto one logical Trigger run and a replay is a no-op.
  //    The import is dynamic to avoid a static cycle with agent-execution-service
  //    (which imports raiseRetryExhaustionEscalation from this module).
  const { ensureDispatchForAssignment } = await import(
    "@/lib/dev-hq/agent-execution-service"
  );
  await ensureDispatchForAssignment(
    decision.assignment.id,
    reviseInstructions(escalation.taskId),
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

  await ensureTaskStatus(escalation.taskId, "needs_revision");
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
    await ensureTaskStatus(
      resolved.taskId,
      taskStatusForResolution(appliedResolution),
    );
  } else if (revision) {
    await activateTaskForLiveRevision(resolved.taskId, revision.id);
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
