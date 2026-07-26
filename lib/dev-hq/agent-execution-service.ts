// Agent-execution dispatch and callback handlers (Task 1D-5). Bridges the durable
// Trigger.dev agent-execution task to the in-memory Execution Manager, reusing its
// lifecycle and 3-attempt retry budget. Deterministic simulated agents only — no
// real AI or code execution (ADR-0001 D4).

import { tasks } from "@trigger.dev/sdk";
import type { AssignmentDecision } from "@/types/contracts";
import type { AgentExecutionStatus, AgentResult, Execution } from "@/types/domain";
import {
  assignExecution,
  getExecution,
  heartbeat,
  reclaimStale,
  releaseExecution,
  runExecution,
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
  EXECUTION_EVENT_TYPE,
  MAX_EXECUTION_ATTEMPTS,
} from "@/lib/dev-hq/constants";
import { nowIso } from "@/lib/dev-hq/id";

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
 * outcome, deduped by a stable per-attempt uri so a reconciling retry does not
 * duplicate it.
 */
async function ensureOutcomeEvidence(
  execution: Execution,
  attempt: number,
  status: AgentExecutionStatus,
  agentId: string | null,
): Promise<void> {
  const { evidenceStore } = getDevHqAdapters();
  const ref = `execution:${execution.id}:attempt:${attempt}:outcome`;
  const existing = await evidenceStore.listForExecution(execution.id);
  if (existing.some((evidence) => evidence.uri === ref)) {
    return;
  }
  await evidenceStore.addEvidence({
    executionId: execution.id,
    taskId: execution.taskId,
    kind: "log",
    label: `Execution attempt ${attempt}: ${status}`,
    summary: `Agent execution ${execution.id} attempt ${attempt} reported "${status}".`,
    uri: ref,
    createdByAgentId: agentId,
  });
}

/**
 * Ensure exactly one terminal lifecycle event for an execution, deduped by type
 * (an execution terminates once). Safe to re-run during reconciliation.
 */
async function ensureTerminalEvent(
  execution: Execution,
  type: string,
  message: string,
  agentId: string | null,
): Promise<void> {
  const recent = await getDevHqAdapters().eventLogger.listRecent({
    entityType: "execution",
    entityId: execution.id,
    limit: 200,
  });
  if (recent.some((event) => event.type === type)) {
    return;
  }
  await logExecutionEvent(type, execution.id, agentId, message);
}

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
  const type =
    execution.status === "succeeded"
      ? EXECUTION_EVENT_TYPE.succeeded
      : execution.status === "cancelled"
        ? EXECUTION_EVENT_TYPE.cancelled
        : EXECUTION_EVENT_TYPE.exhausted;
  await ensureTerminalEvent(
    execution,
    type,
    `Execution ${execution.id} ${execution.status} after ${attempt} attempt${
      attempt === 1 ? "" : "s"
    }.`,
    agentId,
  );
  if (execution.status === "failed") {
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
    saveAssignment({ ...currentAssignment, triggerRunId: handle.id });
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
 * Queued-dispatch reconciliation (Task 1E-5): re-dispatch any queued agent
 * execution whose current assignment was never dispatched (e.g., a triggerRun that
 * failed after a requeue). Uses the assignment-keyed idempotent dispatch, so no new
 * assignment/attempt is created and no additional retry is consumed. Distinct from
 * lease reclaim (running executions) and escalation reconciliation (terminal
 * failures).
 */
async function reconcileQueuedDispatches(): Promise<void> {
  for (const execution of [...getDevHqStore().executions.values()]) {
    if (execution.status !== "queued") continue;
    if (!execution.agentId || !execution.assignmentId) continue;
    const attempt = execution.attempt ?? 0;
    // An authorized attempt is within the retry budget.
    if (attempt < 1 || attempt > MAX_EXECUTION_ATTEMPTS) continue;
    const assignment = getAssignment(execution.assignmentId);
    if (!assignment || assignment.status === "released") continue;
    if (assignment.triggerRunId) continue; // already dispatched
    await ensureDispatchForAssignment(
      execution.assignmentId,
      recoveryInstructions(execution),
    );
  }
}

export interface DispatchAgentExecutionInput {
  taskId: string;
  requiredCapabilities?: string[];
  instructions?: string;
}

export interface DispatchAgentExecutionResult {
  assigned: boolean;
  reason: AssignmentDecision["reason"];
  executionId: string | null;
  agentId: string | null;
  triggerRunId: string | null;
}

/**
 * Manual dispatch entry point (Simulation Lab). Selects an agent for the task and
 * triggers the durable run. Returns a non-assigned result (rather than throwing)
 * when no eligible agent is available.
 */
export async function dispatchAgentExecution(
  input: DispatchAgentExecutionInput,
): Promise<DispatchAgentExecutionResult> {
  const task = getDevHqStore().tasks.get(input.taskId);
  if (!task) {
    throw new Error(`Task not found: ${input.taskId}`);
  }

  const decision = await assignExecution(input.taskId, {
    requiredCapabilities: input.requiredCapabilities,
  });
  if (!decision.assigned || !decision.execution) {
    return {
      assigned: false,
      reason: decision.reason,
      executionId: null,
      agentId: null,
      triggerRunId: null,
    };
  }

  const instructions =
    (input.instructions ?? task.description ?? "").trim() ||
    "Execute the assigned task.";
  const triggerRunId = await ensureDispatchForAssignment(
    decision.execution.assignmentId!,
    instructions,
  );

  await logExecutionEvent(
    EXECUTION_EVENT_TYPE.assigned,
    decision.execution.id,
    decision.agentId,
    `Execution ${decision.execution.id} assigned to ${
      getAgent(decision.agentId ?? "")?.name ?? "an agent"
    } for task ${decision.execution.taskId}.`,
  );

  return {
    assigned: true,
    reason: "assigned",
    executionId: decision.execution.id,
    agentId: decision.agentId,
    triggerRunId,
  };
}

/**
 * Callback: the run has started — claim the assigned agent. Idempotent: a replayed
 * callback for an already-claimed attempt, or a stale callback naming an assignment
 * that a later attempt has superseded, is a safe no-op (no double-claim, no
 * duplicate event). Keyed on the attempt's `assignmentId` (ADR-0002 E3; Task 1E-2).
 */
export async function handleExecutionRunning(
  executionId: string,
  assignmentId?: string,
): Promise<Execution> {
  const existing = await getExecution(executionId);
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

  const execution = await runExecution(executionId);
  await logExecutionEvent(
    EXECUTION_EVENT_TYPE.claimed,
    execution.id,
    execution.agentId,
    `Execution ${execution.id} claimed and running.`,
  );
  return execution;
}

/** Callback: extend the lease for a still-running execution. */
export async function handleExecutionHeartbeat(
  executionId: string,
): Promise<Execution> {
  return heartbeat(executionId);
}

export interface CompleteExecutionInput {
  executionId: string;
  status: AgentExecutionStatus;
  instructions: string;
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

    await ensureOutcomeEvidence(execution, attempt, input.status, attemptAgentId);

    // A requeued execution (queued with an agent still assigned) is the next
    // retry attempt. Record the retry first, then dispatch: a failed dispatch
    // leaves the execution queued for queued-dispatch reconciliation to redispatch
    // the same assignment, without consuming another retry.
    if (execution.status === "queued" && execution.agentId) {
      await logExecutionEvent(
        EXECUTION_EVENT_TYPE.retried,
        execution.id,
        attemptAgentId,
        `Execution ${execution.id} attempt ${attempt} ${input.status}; retrying as attempt ${execution.attempt}.`,
      );
      await ensureDispatchForAssignment(
        execution.assignmentId!,
        input.instructions,
      );
      return { execution, retried: true };
    }

    await finalizeTerminalExecution(execution, attempt, attemptAgentId);
    return { execution, retried: false };
  }

  // Re-entry after the current attempt already terminated. A terminal FAILED
  // execution may have been finalized incompletely (a failure after the terminal
  // transition but before the escalation/side effects completed), so reconcile
  // idempotently rather than exiting merely because the execution is terminal —
  // this is the fix for the callback re-entry finding. Succeeded/cancelled have no
  // further reconcilable side effects and remain true no-ops.
  if (current.status === "failed") {
    const attempt = current.attempt ?? MAX_EXECUTION_ATTEMPTS;
    await ensureOutcomeEvidence(current, attempt, "failed", current.agentId);
    await finalizeTerminalExecution(current, attempt, current.agentId);
  }
  return { execution: current, retried: false };
}

export interface ReclaimResult {
  reclaimed: number;
}

/** Instructions for a lease-recovery re-dispatch: the task's own description. */
function recoveryInstructions(execution: Execution): string {
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
    await logExecutionEvent(
      EXECUTION_EVENT_TYPE.reclaimed,
      execution.id,
      execution.agentId,
      execution.status === "queued"
        ? `Execution ${execution.id} lease expired; reclaimed and retrying as attempt ${execution.attempt}.`
        : `Execution ${execution.id} lease expired; reclaimed and marked ${execution.status} (retry budget spent).`,
    );

    if (execution.status === "queued" && execution.agentId) {
      await ensureDispatchForAssignment(
        execution.assignmentId!,
        recoveryInstructions(execution),
      );
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

  // Distinct reconciliation responsibilities on the sweep cadence:
  //   running lease expiry           -> reclaimStale (above, Execution Manager)
  //   queued but undispatched        -> reconcileQueuedDispatches
  //   terminal failed w/o escalation -> reconcileUnescalatedFailures
  await reconcileQueuedDispatches();
  await reconcileUnescalatedFailures();

  return { reclaimed: reclaimed.length };
}
