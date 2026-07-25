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
import { getDevHqStore, saveExecution } from "@/lib/dev-hq/store";
import { nowIso } from "@/lib/dev-hq/id";

export const AGENT_EXECUTION_TASK_ID = "agent-execution";

export interface AgentExecutionTaskPayload {
  executionId: string;
  agentId: string;
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

/** Trigger a durable agent-execution run for a queued, agent-assigned execution. */
async function triggerRun(
  execution: Execution,
  instructions: string,
): Promise<string> {
  if (!execution.agentId) {
    throw new Error(`Execution has no agent to dispatch: ${execution.id}`);
  }
  const handle = await tasks.trigger(AGENT_EXECUTION_TASK_ID, {
    executionId: execution.id,
    agentId: execution.agentId,
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

  return {
    assigned: true,
    reason: "assigned",
    executionId: decision.execution.id,
    agentId: decision.agentId,
    triggerRunId,
  };
}

/** Callback: the run has started — claim the assigned agent. */
export async function handleExecutionRunning(
  executionId: string,
): Promise<Execution> {
  return runExecution(executionId);
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

  const result = buildAgentResult(current, input.status, input.summary ?? null);
  const execution = await releaseExecution(input.executionId, result);

  // A requeued execution (queued with an agent still assigned) is the next
  // retry attempt; dispatch it. Exhaustion leaves the execution "failed".
  if (execution.status === "queued" && execution.agentId) {
    await triggerRun(execution, input.instructions);
    return { execution, retried: true };
  }

  return { execution, retried: false };
}
