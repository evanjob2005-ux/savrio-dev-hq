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
  releaseExecution,
  runExecution,
} from "@/lib/dev-hq/execution-manager";
import { getAgent, getDevHqStore, saveExecution } from "@/lib/dev-hq/store";
import { getDevHqAdapters } from "@/lib/dev-hq/adapters";
import { EXECUTION_EVENT_TYPE } from "@/lib/dev-hq/constants";
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

/** Record one append-only log evidence entry for an execution attempt outcome. */
async function recordOutcomeEvidence(
  execution: Execution,
  attempt: number,
  status: AgentExecutionStatus,
  agentId: string | null,
): Promise<void> {
  await getDevHqAdapters().evidenceStore.addEvidence({
    executionId: execution.id,
    taskId: execution.taskId,
    kind: "log",
    label: `Execution attempt ${attempt}: ${status}`,
    summary: `Agent execution ${execution.id} attempt ${attempt} reported "${status}".`,
    createdByAgentId: agentId,
  });
}

/** Trigger a durable agent-execution run for a queued, agent-assigned execution. */
async function triggerRun(
  execution: Execution,
  instructions: string,
): Promise<string> {
  if (!execution.agentId) {
    throw new Error(`Execution has no agent to dispatch: ${execution.id}`);
  }
  if (!execution.assignmentId) {
    throw new Error(`Execution has no assignment to dispatch: ${execution.id}`);
  }
  const handle = await tasks.trigger(AGENT_EXECUTION_TASK_ID, {
    executionId: execution.id,
    agentId: execution.agentId,
    assignmentId: execution.assignmentId,
    instructions,
  } satisfies AgentExecutionTaskPayload);
  saveExecution({ ...execution, triggerRunId: handle.id });
  return handle.id;
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
  const triggerRunId = await triggerRun(decision.execution, instructions);

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

  // Idempotency (Task 1E-2): ignore a replayed or stale callback without
  // re-recording evidence, re-emitting events, or re-dispatching. A callback is
  // stale when it names an assignment a later attempt has superseded; a replay
  // lands when the current attempt is no longer running.
  if (
    (input.assignmentId && current.assignmentId !== input.assignmentId) ||
    current.status !== "running"
  ) {
    return { execution: current, retried: false };
  }

  // The agent and attempt that actually ran this outcome, captured before release
  // (which may re-queue the execution onto a freshly selected agent).
  const attemptAgentId = current.agentId;
  const attempt = current.attempt ?? 1;

  const result = buildAgentResult(current, input.status, input.summary ?? null);
  const execution = await releaseExecution(input.executionId, result);

  // One append-only log evidence entry per execution outcome (ADR-0002 E4).
  await recordOutcomeEvidence(execution, attempt, input.status, attemptAgentId);

  // A requeued execution (queued with an agent still assigned) is the next
  // retry attempt; dispatch it. Exhaustion leaves the execution "failed".
  if (execution.status === "queued" && execution.agentId) {
    await triggerRun(execution, input.instructions);
    await logExecutionEvent(
      EXECUTION_EVENT_TYPE.retried,
      execution.id,
      attemptAgentId,
      `Execution ${execution.id} attempt ${attempt} ${input.status}; retrying as attempt ${execution.attempt}.`,
    );
    return { execution, retried: true };
  }

  const terminalType =
    execution.status === "succeeded"
      ? EXECUTION_EVENT_TYPE.succeeded
      : execution.status === "cancelled"
        ? EXECUTION_EVENT_TYPE.cancelled
        : EXECUTION_EVENT_TYPE.exhausted;
  await logExecutionEvent(
    terminalType,
    execution.id,
    attemptAgentId,
    `Execution ${execution.id} ${execution.status} after ${attempt} attempt${
      attempt === 1 ? "" : "s"
    }.`,
  );

  return { execution, retried: false };
}
