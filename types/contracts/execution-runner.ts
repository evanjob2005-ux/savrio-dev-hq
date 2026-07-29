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
 * The outcome of a claim attempt, as a discriminated union rather than
 * `Execution | null`.
 *
 * `null` conflated two materially different situations a caller must be able to
 * tell apart, and gave neither of them a name. The union states each outcome and
 * makes the exhaustive handling of them a type error to omit.
 *
 * The three members are exactly the outcomes a *correct* caller can encounter:
 *
 * - `claimed` — the compare-and-set won; the carried execution is running.
 * - `lost_to_concurrent_claim` — the agent was reserved by another attempt
 *   between selection and this call. The caller was right when it was dispatched
 *   and the world moved, so it stands down rather than failing.
 * - `agent_unavailable` — the assigned agent is not taking work at all (offline,
 *   or waiting). Also not the caller's doing: the registry moved underneath a
 *   dispatch that was valid when it was made.
 *
 * Everything else — a missing execution, an execution that is not queued, one
 * with no assignment, a mismatched agent, an agent that is not in the registry —
 * **throws**. Those are states no correct caller could have produced, and
 * absorbing them into an ordinary negative outcome would hide a defect behind a
 * value the caller is expected to ignore.
 */
export type ClaimExecutionResult =
  | { outcome: "claimed"; execution: Execution }
  | { outcome: "lost_to_concurrent_claim" }
  | { outcome: "agent_unavailable" };

/** The non-claiming outcomes, for callers that only branch on the failure side. */
export type ClaimDeclinedOutcome = Exclude<
  ClaimExecutionResult["outcome"],
  "claimed"
>;

/**
 * The Execution Manager: owner of the agent-backed execution lifecycle
 * (assignment, claim, heartbeat, release, retry, timeout). Distinct from
 * `WorkflowEngine`, which owns founder-request orchestration. See ADR-0001 (D2).
 *
 * Only the contract is defined here; the in-memory implementation lands in later
 * Sprint 1D tasks (1D-2/1D-3).
 */
export interface ExecutionRunner {
  /**
   * Legacy active-only work listing. This does not assert unassigned state,
   * dependency readiness, or dispatch eligibility; dispatch owns those checks.
   */
  listReadyWork(): Promise<Task[]>;
  /** Select an agent and create the execution + assignment lease for a task. */
  assignExecution(
    taskId: string,
    policy?: AgentSelectionPolicy,
  ): Promise<AssignmentDecision>;
  /**
   * Atomically take ownership of an execution for an available agent. Reports
   * which of the three anticipated outcomes occurred; every precondition
   * violation throws. See `ClaimExecutionResult`.
   */
  claimExecution(
    executionId: string,
    agentId: string,
  ): Promise<ClaimExecutionResult>;
  /**
   * Extend the lease of a running execution.
   *
   * **Assignment identity is required.** A heartbeat is only meaningful from the
   * worker holding the named attempt: without the identity the runner cannot tell
   * a live worker's beat from an abandoned one's, and an abandoned run would be
   * able to keep a successor attempt's lease alive and mask its failure. A beat
   * naming an assignment that is no longer the execution's current one is a
   * no-op, not an error.
   */
  heartbeat(executionId: string, assignmentId: string): Promise<Execution>;
  /** Record a terminal agent result and free the agent. */
  releaseExecution(executionId: string, result: AgentResult): Promise<Execution>;
  /** Reclaim executions whose lease has expired. Defaults `now` to call time. */
  reclaimStale(now?: IsoTimestamp): Promise<Execution[]>;

  // Retained from the original contract.
  queueExecution(taskId: string, workflowId: string): Promise<Execution>;
  runExecution(executionId: string): Promise<Execution | null>;
  cancelExecution(executionId: string): Promise<Execution>;
  getExecution(executionId: string): Promise<Execution | null>;
}
