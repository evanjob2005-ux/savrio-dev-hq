// In-memory Execution Manager (Task 1D-3). Owns the agent-backed execution
// lifecycle: assignment, atomic claim/release, lease + heartbeat, stale reclaim,
// and the Work-Management retry budget. Distinct from WorkflowEngine, which owns
// founder-request orchestration (ADR-0001 D2).
//
// Trigger.dev dispatch, API routes, and composition-root wiring are out of scope
// for this task; this module is exercised directly by tests and will be called by
// the adapter (dev-execution-runner) and, later, the agent-execution task (1D-5).

import type { AgentSelectionPolicy, AssignmentDecision } from "@/types/contracts";
import type { ClaimExecutionResult } from "@/types/contracts/execution-runner";
import type {
  AgentAssignment,
  AgentResult,
  Execution,
  ExecutionRequest,
  ExecutionRouting,
  IsoTimestamp,
  ReviewPolicy,
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
    triggerRunId: null,
    dispatchedAt: null,
    leaseExpiresAt: null,
    lastHeartbeatAt: null,
    claimedAt: null,
    releasedAt: null,
    createdAt: input.timestamp,
  });
}

/**
 * The routing record to persist for an execution. `provider` is null until an
 * agent has actually been selected — an unrouted policy constrains capabilities
 * and preference only, and pins no provider.
 */
function routingFrom(
  policy: AgentSelectionPolicy | undefined,
  provider: string | null,
): ExecutionRouting {
  return {
    requiredCapabilities: [...(policy?.requiredCapabilities ?? [])],
    preferredAgentId: policy?.preferredAgentId ?? null,
    provider,
  };
}

/**
 * The routing policy an execution must keep reproducing across attempts. Falls
 * back to the assignment's carried capabilities for records written before
 * routing was persisted (no provider pin, i.e. the pre-existing behaviour).
 */
function routingFor(
  execution: Execution,
  assignment: AgentAssignment | null,
): ExecutionRouting {
  return (
    execution.routing ?? {
      requiredCapabilities: assignment?.requiredCapabilities ?? [],
      preferredAgentId: null,
      provider: null,
    }
  );
}

/**
 * Select an agent that satisfies a persisted routing policy, or null.
 *
 * The provider pin is the hard part of the policy: once an execution has been
 * routed to a provider, no later attempt may be answered by an agent of a
 * different provider. Without it a retry could silently move work to an agent of
 * a different class and report its result as the original's. When no agent
 * satisfies the pin the caller re-queues instead of substituting one.
 */
function selectRoutedAgent(routing: ExecutionRouting) {
  return selectAgent({
    requiredCapabilities: routing.requiredCapabilities,
    preferredAgentId: routing.preferredAgentId ?? undefined,
    requiredProvider: routing.provider ?? undefined,
  });
}

/**
 * Consume one attempt of the retry budget after a failed or timed-out execution.
 * The caller has already freed the agent and released the current assignment.
 * With budget remaining, the execution is re-queued and (capacity permitting)
 * re-assigned under its persisted routing policy — never across providers. When
 * the budget is exhausted the execution is marked failed. Escalation side effects
 * are owned by the service layer.
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
  const routing = routingFor(execution, assignment);
  const requiredCapabilities = routing.requiredCapabilities;
  const nextAgent = selectRoutedAgent(routing);

  if (!nextAgent) {
    // No capacity for the retry right now: re-queue unassigned. Clear the prior
    // attempt's Trigger run reference so the requeued execution does not point at a
    // stale run until the next assignment is dispatched.
    return saveExecution({
      ...execution,
      status: "queued",
      agentId: null,
      assignmentId: null,
      attempt: nextAttempt,
      triggerRunId: null,
      startedAt: null,
      completedAt: null,
    });
  }

  // Clear the prior attempt's Trigger run reference; the new assignment starts
  // undispatched (assignment.triggerRunId null) until it is dispatched.
  const requeued = saveExecution({
    ...execution,
    status: "queued",
    agentId: nextAgent.id,
    attempt: nextAttempt,
    triggerRunId: null,
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
  reviewPolicy?: ReviewPolicy,
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
    routing: routingFrom(policy, agent.provider),
    reviewPolicy: reviewPolicy ?? null,
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
 * Create-or-get a queued execution at a caller-supplied canonical id (attempt 1,
 * no agent, no assignment). The id is **opaque** here — the caller owns its
 * meaning and its uniqueness; the Execution Manager only guarantees the keyed
 * create-or-get.
 *
 * Idempotent: an existing execution at that id is returned unchanged, and since
 * the id is the store key a second record at that id is not representable. The
 * lookup and the insert are synchronous with no await between them, so
 * concurrent callers cannot both insert.
 *
 * **Ownership is verified before reuse.** An existing execution is only returned
 * when it belongs to the requested task; an id collision across tasks throws
 * rather than silently handing back another task's execution (which would go on
 * to be assigned an agent and dispatched against the wrong task). Callers own
 * the id namespace, so a mismatch is a programming error and fails loudly.
 *
 * Pairs with `ensureAssignment`: creation and assignment are deliberately
 * separate steps so a caller that reserved the id up front can recover a
 * partially-created execution on replay without generating a new id.
 */
export async function ensureExecution(input: {
  executionId: string;
  taskId: string;
  /**
   * The policy this execution is intended to be assigned under. Persisted at
   * creation — before any agent exists — so an execution that is created and then
   * fails to be assigned is still recognizable as agent-backed work and can be
   * recovered by the sweep. `provider` stays null until an agent is actually
   * selected, so it pins nothing until there is something to pin to.
   */
  policy?: AgentSelectionPolicy;
  /**
   * An already-decided routing policy to inherit verbatim, including its provider
   * pin. Takes precedence over `policy`, which can only express an *intent* (it
   * has no provider until an agent is selected). This is how a revision inherits
   * the restrictions of the work it revises: without it, revising a pinned
   * execution would silently authorize an unpinned one.
   */
  routing?: ExecutionRouting;
  /**
   * The founder's request, captured once. Stored verbatim so replays and
   * recoveries run the request the execution was created for rather than a later
   * caller's payload or the task description as it stands today.
   */
  request?: ExecutionRequest;
  /**
   * The review policy the execution is dispatched under (ADR-0002 E1). Persisted
   * verbatim: the Execution Manager stores it so the record is complete, but the
   * policy's meaning and the loop it drives belong to the review service.
   */
  reviewPolicy?: ReviewPolicy;
  /**
   * The review that authorized this execution as a revision, when one did.
   * Persisted verbatim: the manager stores the link so the record is complete,
   * while the chain it forms is read and interpreted only by the review service.
   */
  revisionOfReviewId?: string;
}): Promise<Execution> {
  const store = getDevHqStore();
  const existing = store.executions.get(input.executionId);
  if (existing) {
    if (existing.taskId !== input.taskId) {
      throw new Error(
        `Execution ${input.executionId} belongs to task ${existing.taskId}, not ${input.taskId}; refusing to reuse it.`,
      );
    }
    return existing;
  }

  const task = store.tasks.get(input.taskId);
  if (!task) {
    throw new Error(`Task not found: ${input.taskId}`);
  }
  return saveExecution({
    id: input.executionId,
    taskId: input.taskId,
    workflowId: task.workflowId,
    agentId: null,
    status: "queued",
    triggerRunId: null,
    startedAt: null,
    completedAt: null,
    createdAt: nowIso(),
    assignmentId: null,
    attempt: 1,
    // Present even when unrouted (provider null): it marks the execution as
    // agent-backed work awaiting assignment, which is what makes an assignment
    // failure recoverable instead of stranding it. An inherited routing keeps its
    // provider pin from the moment the execution exists.
    routing: input.routing
      ? { ...input.routing, requiredCapabilities: [...input.routing.requiredCapabilities] }
      : routingFrom(input.policy, null),
    request: input.request ?? null,
    reviewPolicy: input.reviewPolicy ?? null,
    revisionOfReviewId: input.revisionOfReviewId ?? null,
  });
}

export interface EnsureAssignmentResult {
  decision: AssignmentDecision;
  /** True when this call created the assignment; false when one was reused. */
  created: boolean;
}

/**
 * Ensure a queued execution has a current, unreleased assignment, selecting an
 * agent when it has none. Idempotent: an existing unreleased assignment is
 * reused and reported with `created: false`, so no second assignment and no
 * extra retry attempt can be produced by a replay.
 *
 * Returns a non-assigned decision and leaves the execution untouched when it is
 * no longer queued (`execution_not_queued`) or no eligible agent is available
 * (`no_agent_available`) — either way a later call can retry with no side
 * effects to unwind. Check and write are synchronous with no await between them.
 *
 * **Persisted routing wins.** Once an execution has been routed (its first
 * assignment recorded a provider), that policy governs every later assignment and
 * a caller-supplied policy cannot widen it. A reconciling re-assignment therefore
 * cannot move a provider-backed execution onto a different provider.
 */
export async function ensureAssignment(
  executionId: string,
  policy?: AgentSelectionPolicy,
): Promise<EnsureAssignmentResult> {
  const execution = requireExecution(executionId);
  // Only a *routed* execution — one that has already run on a provider — has an
  // authoritative policy. Routing recorded at creation is an intent, not yet a
  // pin, so a caller may still refine it before the first agent is chosen.
  const routing = execution.routing ?? null;
  const pinned = routing?.provider ? routing : null;
  const effectivePolicy: AgentSelectionPolicy = pinned
    ? {
        requiredCapabilities: pinned.requiredCapabilities,
        preferredAgentId: pinned.preferredAgentId ?? undefined,
        requiredProvider: pinned.provider ?? undefined,
      }
    : {
        requiredCapabilities:
          policy?.requiredCapabilities ?? routing?.requiredCapabilities ?? [],
        preferredAgentId:
          policy?.preferredAgentId ?? routing?.preferredAgentId ?? undefined,
      };
  const requiredCapabilities = effectivePolicy.requiredCapabilities ?? [];
  const notAssigned = (
    reason: "no_agent_available" | "execution_not_queued",
  ): EnsureAssignmentResult => ({
    decision: {
      assigned: false,
      reason,
      execution,
      assignment: null,
      agentId: null,
      requiredCapabilities,
    },
    created: false,
  });

  if (execution.status !== "queued") {
    return notAssigned("execution_not_queued");
  }

  // Reuse the execution's current assignment when it still holds the lease.
  if (execution.assignmentId) {
    const current = getAssignment(execution.assignmentId);
    if (current && current.status !== "released") {
      return {
        decision: {
          assigned: true,
          reason: "assigned",
          execution,
          assignment: current,
          agentId: current.agentId,
          requiredCapabilities,
        },
        created: false,
      };
    }
  }

  const agent = selectAgent(effectivePolicy);
  if (!agent) {
    return notAssigned("no_agent_available");
  }

  const timestamp = nowIso();
  const assignment = createAssignment({
    execution,
    agentId: agent.id,
    attempt: execution.attempt ?? 1,
    requiredCapabilities,
    timestamp,
  });
  return {
    decision: {
      assigned: true,
      reason: "assigned",
      execution: saveExecution({
        ...execution,
        agentId: agent.id,
        assignmentId: assignment.id,
        // Selecting an agent is what routes the execution: the effective policy
        // gains the provider it was actually routed to, and every later attempt
        // is pinned to that.
        routing: pinned ?? routingFrom(effectivePolicy, agent.provider),
      }),
      assignment,
      agentId: agent.id,
      requiredCapabilities,
    },
    created: true,
  };
}

/**
 * Atomically take ownership of a queued execution for its assigned agent. This is
 * the compare-and-set on availability: it succeeds only while the agent is still
 * available, so two claims on the same agent cannot both win.
 *
 * Reports one of three outcomes (`ClaimExecutionResult`). `lost_to_concurrent_claim`
 * is the compare-and-set losing — the agent was reserved by another attempt
 * between selection and this call. `agent_unavailable` is the assigned agent no
 * longer taking work at all. Neither is a caller error: this caller was right
 * when it was dispatched and the world moved. Every other precondition still
 * throws, because no correct caller could have produced it.
 */
export async function claimExecution(
  executionId: string,
  agentId: string,
): Promise<ClaimExecutionResult> {
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
  // The claim did not get the agent. Absorbed rather than thrown: a throw becomes
  // a 500 at the callback route, which the worker's postJson turns into an
  // exception before it can read the answer — so the stand-down path it documents
  // could never run. Do NOT hoist this check into a caller: it and the
  // reservation below must stay adjacent and synchronous or the race it closes
  // reopens.
  //
  // The two reasons are reported separately because they are different facts
  // about the world, and a caller that only ever saw `null` could not tell them
  // apart: "busy" means another attempt holds the agent and capacity will return
  // when it finishes, while "offline"/"waiting" means the agent is not taking
  // work at all and waiting for this one is pointless.
  if (agent.availability !== "available") {
    return agent.availability === "busy"
      ? { outcome: "lost_to_concurrent_claim" }
      : { outcome: "agent_unavailable" };
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

  return {
    outcome: "claimed",
    execution: saveExecution({
      ...execution,
      status: "running",
      startedAt: timestamp,
    }),
  };
}

/**
 * Extend the lease of a running execution and record the heartbeat.
 *
 * A heartbeat is only meaningful from the worker that holds the current attempt,
 * so **the attempt's assignment id is required**, not optional. An anonymous beat
 * is indistinguishable from a stale worker's once it is inside this function, and
 * an omitted argument is the easiest way to produce one by accident; requiring it
 * makes the caller state which attempt it believes it is beating for.
 *
 * When the caller names an assignment that is no longer the execution's current
 * one, the beat is a stale worker's and is a **no-op**: honouring it would let an
 * abandoned run keep a successor attempt's lease alive and mask its failure. An
 * execution that holds no assignment at all is covered by the same comparison —
 * nothing can be the current attempt of an execution that has none.
 *
 * A beat that arrives after its own attempt already ended — reclaimed, completed,
 * or cancelled underneath it — is absorbed for the same reason: the caller was the
 * right worker and the world moved. There is no lease left to extend, so absorbing
 * costs nothing, and throwing would fail an otherwise healthy durable run over a
 * benign race. No event is emitted on any heartbeat path (ADR-0002 E3).
 */
export async function heartbeat(
  executionId: string,
  assignmentId: string,
): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (execution.assignmentId !== assignmentId) {
    return execution; // stale worker; the current attempt is someone else's
  }
  // The attempt already ended while this beat was in flight.
  if (execution.status !== "running") {
    return execution;
  }

  // The execution names this assignment, so a missing record is a broken
  // invariant rather than anything a caller could have caused: it stays loud.
  const assignment = requireAssignment(assignmentId);
  // Same reasoning as the terminal case: released underneath a beat that was
  // legitimate when it was sent.
  if (assignment.status === "released") {
    return execution;
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

/**
 * Release a queued execution's current assignment so it can be assigned again,
 * without consuming a retry attempt.
 *
 * This exists for one recovery case: a queued, undispatched assignment whose
 * agent can no longer satisfy the execution's routing (the agent left the
 * registry, or its provider changed). Dispatch refuses such an assignment — it
 * must not silently run on the wrong provider — which would leave the execution
 * queued forever behind an assignment nothing can use. Releasing it hands the
 * execution back to assignment under its unchanged routing policy.
 *
 * Refuses anything that is not queued, so a running attempt's lease can never be
 * dropped this way; that path belongs to reclaim. The attempt counter and routing
 * are preserved, so this is recovery, not a retry.
 */
export async function releaseAssignmentForReassignment(
  executionId: string,
): Promise<Execution> {
  const execution = requireExecution(executionId);
  if (execution.status !== "queued") {
    throw new Error(
      `Execution is not queued; cannot release its assignment: ${executionId}`,
    );
  }
  if (!execution.assignmentId) {
    return execution;
  }

  const timestamp = nowIso();
  const assignment = getAssignment(execution.assignmentId);
  if (assignment && assignment.status !== "released") {
    saveAssignment({
      ...assignment,
      status: "released",
      releasedAt: timestamp,
      leaseExpiresAt: null,
    });
  }
  return saveExecution({
    ...execution,
    agentId: null,
    assignmentId: null,
    triggerRunId: null,
  });
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

/**
 * Start an already-assigned execution by claiming it for its assigned agent.
 *
 * Collapses `claimExecution`'s three outcomes back to `Execution | null`: this is
 * the low-level convenience entry point, and its callers only ask "did it start?".
 * A caller that must act on *why* a claim did not happen calls `claimExecution`
 * directly — which is what the agent-execution callback path does, through the
 * `ExecutionRunner` port.
 */
export async function runExecution(
  executionId: string,
): Promise<Execution | null> {
  const execution = requireExecution(executionId);
  if (execution.status !== "queued") {
    throw new Error(`Execution is not queued; cannot run: ${executionId}`);
  }
  if (!execution.agentId || !execution.assignmentId) {
    throw new Error(`Execution has no assigned agent to run: ${executionId}`);
  }
  const result = await claimExecution(executionId, execution.agentId);
  return result.outcome === "claimed" ? result.execution : null;
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
