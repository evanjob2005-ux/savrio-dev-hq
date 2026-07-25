// In-memory Execution Manager (Task 1D-3). Owns the agent-backed execution
// lifecycle: assignment, atomic claim/release, lease + heartbeat, stale reclaim,
// and the Work-Management retry budget. Distinct from WorkflowEngine, which owns
// founder-request orchestration (ADR-0001 D2).
//
// Trigger.dev dispatch, API routes, and composition-root wiring are out of scope
// for this task; this module is exercised directly by tests and will be called by
// the adapter (dev-execution-runner) and, later, the agent-execution task (1D-5).

import type { AgentSelectionPolicy, AssignmentDecision } from "@/types/contracts";
import type {
  AgentAssignment,
  AgentResult,
  Execution,
  IsoTimestamp,
  Task,
} from "@/types/domain";
import {
  EXECUTION_LEASE_TTL_MS,
  MAX_EXECUTION_ATTEMPTS,
} from "@/lib/dev-hq/constants";
import { selectAgent } from "@/lib/dev-hq/agent-registry";
import { nextId, nowIso } from "@/lib/dev-hq/id";
import {
  getAgent,
  getAssignment,
  getDevHqStore,
  saveAgent,
  saveAssignment,
  saveExecution,
} from "@/lib/dev-hq/store";

// --- internal helpers -------------------------------------------------------

function requireExecution(executionId: string): Execution {
  const execution = getDevHqStore().executions.get(executionId);
  if (!execution) {
    throw new Error(`Execution not found: ${executionId}`);
  }
  return execution;
}

function requireAssignment(assignmentId: string): AgentAssignment {
  const assignment = getAssignment(assignmentId);
  if (!assignment) {
    throw new Error(`Assignment not found: ${assignmentId}`);
  }
  return assignment;
}

function leaseExpiryFrom(timestamp: IsoTimestamp): IsoTimestamp {
  return new Date(
    new Date(timestamp).getTime() + EXECUTION_LEASE_TTL_MS,
  ).toISOString();
}

/** Return an agent to the available pool. No-op when there is no held agent. */
function releaseAgent(agentId: string | null, timestamp: IsoTimestamp): void {
  if (!agentId) return;
  const agent = getAgent(agentId);
  if (agent) {
    saveAgent({ ...agent, availability: "available", lastActiveAt: timestamp });
  }
}

function createAssignment(input: {
  execution: Execution;
  agentId: string;
  attempt: number;
  requiredCapabilities: string[];
  timestamp: IsoTimestamp;
}): AgentAssignment {
  return saveAssignment({
    id: nextId("asgn"),
    executionId: input.execution.id,
    agentId: input.agentId,
    taskId: input.execution.taskId,
    status: "assigned",
    attempt: input.attempt,
    requiredCapabilities: [...input.requiredCapabilities],
    leaseExpiresAt: null,
    lastHeartbeatAt: null,
    claimedAt: null,
    releasedAt: null,
    createdAt: input.timestamp,
  });
}

/**
 * Consume one attempt of the retry budget after a failed or timed-out execution.
 * The caller has already freed the agent and released the current assignment.
 * With budget remaining, the execution is re-queued and (capacity permitting)
 * re-assigned to a freshly selected agent — naturally a different one, since the
 * just-freed agent is now the most-recently-active. When the budget is exhausted
 * the execution is marked failed. Escalation side effects (approval,
 * needs_revision) are deferred to Sprint 1E.
 */
function applyFailedAttempt(
  execution: Execution,
  assignment: AgentAssignment | null,
  timestamp: IsoTimestamp,
): Execution {
  const attempt = execution.attempt ?? 1;
  if (attempt >= MAX_EXECUTION_ATTEMPTS) {
    return saveExecution({
      ...execution,
      status: "failed",
      completedAt: timestamp,
    });
  }

  const nextAttempt = attempt + 1;
  const requiredCapabilities = assignment?.requiredCapabilities ?? [];
  const nextAgent = selectAgent({ requiredCapabilities });

  if (!nextAgent) {
    // No capacity for the retry right now: re-queue unassigned.
    return saveExecution({
      ...execution,
      status: "queued",
      agentId: null,
      assignmentId: null,
      attempt: nextAttempt,
      startedAt: null,
      completedAt: null,
    });
  }

  const requeued = saveExecution({
    ...execution,
    status: "queued",
    agentId: nextAgent.id,
    attempt: nextAttempt,
    startedAt: null,
    completedAt: null,
  });
  const nextAssignment = createAssignment({
    execution: requeued,
    agentId: nextAgent.id,
    attempt: nextAttempt,
    requiredCapabilities,
    timestamp,
  });
  return saveExecution({ ...requeued, assignmentId: nextAssignment.id });
}

// --- lifecycle API ----------------------------------------------------------

/** Tasks eligible to be dispatched to an agent: active and unassigned. */
export async function listReadyWork(): Promise<Task[]> {
  return [...getDevHqStore().tasks.values()].filter(
    (task) => task.status === "active" && task.assigneeAgentId === null,
  );
}

/**
 * Select an agent for a task and create the execution (queued) plus its
 * assignment (assigned). The agent is not reserved here — the atomic reservation
 * happens on claim, so this is a proposal that claim confirms.
 */
export async function assignExecution(
  taskId: string,
  policy?: AgentSelectionPolicy,
): Promise<AssignmentDecision> {
  const task = getDevHqStore().tasks.get(taskId);
  if (!task) {
    throw new Error(`Task not found: ${taskId}`);
  }

  const requiredCapabilities = policy?.requiredCapabilities ?? [];
  const agent = selectAgent(policy);
  if (!agent) {
    return {
      assigned: false,
      reason: "no_agent_available",
      execution: null,
      assignment: null,
      agentId: null,
      requiredCapabilities,
    };
  }

  const timestamp = nowIso();
  const created = saveExecution({
    id: nextId("exec"),
    taskId,
    workflowId: task.workflowId,
    agentId: agent.id,
    status: "queued",
    triggerRunId: null,
    startedAt: null,
    completedAt: null,
    createdAt: timestamp,
    assignmentId: null,
    attempt: 1,
  });
  const assignment = createAssignment({
    execution: created,
    agentId: agent.id,
    attempt: 1,
    requiredCapabilities,
    timestamp,
  });
  const execution = saveExecution({ ...created, assignmentId: assignment.id });

  return {
    assigned: true,
    reason: "assigned",
    execution,
    assignment,
    agentId: agent.id,
    requiredCapabilities,
  };
}

/**
 * Atomically take ownership of a queued execution for its assigned agent. This is
 * the compare-and-set on availability: it succeeds only while the agent is still
 * available, so two claims on the same agent cannot both win.
 */
export async function claimExecution(
  executionId: string,
  agentId: string,
): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (execution.status !== "queued") {
    throw new Error(
      `Execution is not claimable (status ${execution.status}): ${executionId}`,
    );
  }
  if (!execution.assignmentId) {
    throw new Error(`Execution has no assignment to claim: ${executionId}`);
  }
  if (execution.agentId !== agentId) {
    throw new Error(
      `Execution ${executionId} is assigned to ${
        execution.agentId ?? "no agent"
      }, not ${agentId}.`,
    );
  }

  const agent = getAgent(agentId);
  if (!agent) {
    throw new Error(`Agent not found: ${agentId}`);
  }
  if (agent.availability !== "available") {
    throw new Error(
      `Agent ${agentId} is not available to claim (status ${agent.availability}).`,
    );
  }

  const timestamp = nowIso();
  // Reserve: available -> busy. Read + write are synchronous in the single-process
  // store, so no other claim can interleave between the check above and this write.
  saveAgent({ ...agent, availability: "busy", lastActiveAt: timestamp });

  const assignment = requireAssignment(execution.assignmentId);
  saveAssignment({
    ...assignment,
    status: "claimed",
    claimedAt: timestamp,
    lastHeartbeatAt: timestamp,
    leaseExpiresAt: leaseExpiryFrom(timestamp),
  });

  return saveExecution({ ...execution, status: "running", startedAt: timestamp });
}

/** Extend the lease of a running execution and record the heartbeat. */
export async function heartbeat(executionId: string): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (execution.status !== "running") {
    throw new Error(
      `Execution is not running; cannot heartbeat: ${executionId}`,
    );
  }
  if (!execution.assignmentId) {
    throw new Error(`Execution has no assignment: ${executionId}`);
  }

  const assignment = requireAssignment(execution.assignmentId);
  if (assignment.status === "released") {
    throw new Error(`Assignment already released: ${assignment.id}`);
  }

  const timestamp = nowIso();
  saveAssignment({
    ...assignment,
    status: "running",
    lastHeartbeatAt: timestamp,
    leaseExpiresAt: leaseExpiryFrom(timestamp),
  });
  const agent = getAgent(assignment.agentId);
  if (agent) {
    saveAgent({ ...agent, lastActiveAt: timestamp });
  }

  return execution;
}

/**
 * Record a terminal agent result and free the agent. `succeeded`/`partial` mark
 * the execution succeeded; `cancelled` cancels it; `failed`/`timeout` consume a
 * retry-budget attempt (re-queue or, when exhausted, fail).
 */
export async function releaseExecution(
  executionId: string,
  result: AgentResult,
): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (execution.status !== "running") {
    throw new Error(`Execution is not running; cannot release: ${executionId}`);
  }

  const timestamp = nowIso();
  const assignment = execution.assignmentId
    ? requireAssignment(execution.assignmentId)
    : null;

  releaseAgent(execution.agentId, timestamp);
  if (assignment) {
    saveAssignment({
      ...assignment,
      status: "released",
      releasedAt: timestamp,
      leaseExpiresAt: null,
    });
  }

  if (result.status === "succeeded" || result.status === "partial") {
    return saveExecution({
      ...execution,
      status: "succeeded",
      completedAt: timestamp,
    });
  }
  if (result.status === "cancelled") {
    return saveExecution({
      ...execution,
      status: "cancelled",
      completedAt: timestamp,
    });
  }
  // failed | timeout
  return applyFailedAttempt(execution, assignment, timestamp);
}

/**
 * Reclaim running executions whose lease has expired, treating each as a
 * timed-out failed attempt (subject to the retry budget). `now` defaults to the
 * time of the call. Returns the executions that were reclaimed.
 */
export async function reclaimStale(now?: IsoTimestamp): Promise<Execution[]> {
  const at = now ?? nowIso();
  const atMs = new Date(at).getTime();
  const reclaimed: Execution[] = [];

  for (const execution of [...getDevHqStore().executions.values()]) {
    if (execution.status !== "running" || !execution.assignmentId) {
      continue;
    }
    const assignment = getAssignment(execution.assignmentId);
    if (!assignment || assignment.status === "released") {
      continue;
    }
    if (!assignment.leaseExpiresAt) {
      continue;
    }
    if (new Date(assignment.leaseExpiresAt).getTime() > atMs) {
      continue; // lease still valid
    }

    releaseAgent(execution.agentId, at);
    saveAssignment({
      ...assignment,
      status: "released",
      releasedAt: at,
      leaseExpiresAt: null,
    });
    reclaimed.push(applyFailedAttempt(execution, assignment, at));
  }

  return reclaimed;
}

/** Create a queued execution with no agent assigned (low-level primitive). */
export async function queueExecution(
  taskId: string,
  workflowId: string,
): Promise<Execution> {
  if (!getDevHqStore().tasks.get(taskId)) {
    throw new Error(`Task not found: ${taskId}`);
  }
  const timestamp = nowIso();
  return saveExecution({
    id: nextId("exec"),
    taskId,
    workflowId,
    agentId: null,
    status: "queued",
    triggerRunId: null,
    startedAt: null,
    completedAt: null,
    createdAt: timestamp,
    assignmentId: null,
    attempt: 0,
  });
}

/** Start an already-assigned execution by claiming it for its assigned agent. */
export async function runExecution(executionId: string): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (execution.status !== "queued") {
    throw new Error(`Execution is not queued; cannot run: ${executionId}`);
  }
  if (!execution.agentId || !execution.assignmentId) {
    throw new Error(`Execution has no assigned agent to run: ${executionId}`);
  }
  return claimExecution(executionId, execution.agentId);
}

/** Cancel an execution. Idempotent once terminal; frees the agent if held. */
export async function cancelExecution(executionId: string): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (
    execution.status === "succeeded" ||
    execution.status === "failed" ||
    execution.status === "cancelled"
  ) {
    return execution;
  }

  const timestamp = nowIso();
  if (execution.assignmentId) {
    const assignment = getAssignment(execution.assignmentId);
    if (assignment && assignment.status !== "released") {
      saveAssignment({
        ...assignment,
        status: "released",
        releasedAt: timestamp,
        leaseExpiresAt: null,
      });
    }
  }
  // Only a running execution holds the agent (a queued one never reserved it).
  if (execution.status === "running") {
    releaseAgent(execution.agentId, timestamp);
  }

  return saveExecution({
    ...execution,
    status: "cancelled",
    completedAt: timestamp,
  });
}

export async function getExecution(
  executionId: string,
): Promise<Execution | null> {
  return getDevHqStore().executions.get(executionId) ?? null;
}
