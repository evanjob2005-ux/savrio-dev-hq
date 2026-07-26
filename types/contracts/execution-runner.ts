import type {
  AgentAssignment,
  AgentResult,
  Execution,
  IsoTimestamp,
  Task,
} from "@/types/domain";

/** Criteria the Execution Manager uses to select an agent for a task. */
export interface AgentSelectionPolicy {
  /** All must be present in the agent's capabilities. */
  requiredCapabilities?: string[];
  /** When set and eligible, prefer this agent over the default policy. */
  preferredAgentId?: string;
  /**
   * When set, only agents with this registry `provider` are eligible. Unlike
   * `preferredAgentId` this is a hard constraint, not a preference: it is how a
   * retry of a provider-backed execution is prevented from being answered by an
   * agent of a different provider (a simulated one, say). No eligible agent means
   * no assignment, never a substitution.
   */
  requiredProvider?: string;
}

/**
 * Outcome of an assignment attempt. `assigned` is false with
 * reason `"no_agent_available"` when no eligible agent could be selected; the
 * execution then remains queued. `"execution_not_queued"` is reachable only from
 * `ensureAssignment`, which is asked to assign an already-existing execution that
 * has since left the queued state; `assignExecution` never returns it.
 */
export interface AssignmentDecision {
  assigned: boolean;
  reason: "assigned" | "no_agent_available" | "execution_not_queued";
  execution: Execution | null;
  assignment: AgentAssignment | null;
  agentId: string | null;
  requiredCapabilities: string[];
}

/**
 * The Execution Manager: owner of the agent-backed execution lifecycle
 * (assignment, claim, heartbeat, release, retry, timeout). Distinct from
 * `WorkflowEngine`, which owns founder-request orchestration. See ADR-0001 (D2).
 *
 * Only the contract is defined here; the in-memory implementation lands in later
 * Sprint 1D tasks (1D-2/1D-3).
 */
export interface ExecutionRunner {
  /** Tasks eligible to be dispatched to an agent (active, unassigned, deps met). */
  listReadyWork(): Promise<Task[]>;
  /** Select an agent and create the execution + assignment lease for a task. */
  assignExecution(
    taskId: string,
    policy?: AgentSelectionPolicy,
  ): Promise<AssignmentDecision>;
  /** Atomically take ownership of an execution for an available agent. */
  claimExecution(executionId: string, agentId: string): Promise<Execution>;
  /** Extend the lease of a running execution. */
  heartbeat(executionId: string): Promise<Execution>;
  /** Record a terminal agent result and free the agent. */
  releaseExecution(executionId: string, result: AgentResult): Promise<Execution>;
  /** Reclaim executions whose lease has expired. Defaults `now` to call time. */
  reclaimStale(now?: IsoTimestamp): Promise<Execution[]>;

  // Retained from the original contract.
  queueExecution(taskId: string, workflowId: string): Promise<Execution>;
  runExecution(executionId: string): Promise<Execution>;
  cancelExecution(executionId: string): Promise<Execution>;
  getExecution(executionId: string): Promise<Execution | null>;
}
