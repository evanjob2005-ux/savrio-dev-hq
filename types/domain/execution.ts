import type { EntityId, ExecutionStatus, IsoTimestamp } from "./common";

/**
 * The routing decision that authorized an execution's agent selection, persisted
 * on the execution so every retry reproduces it instead of re-deriving it from
 * whatever happens to be free at the time.
 *
 * `provider` is the pin that matters operationally: a retry of a provider-backed
 * execution must go to an agent of the same provider, never silently to a
 * simulated one. It is recorded from the registry when the first agent is
 * assigned, so it is authoritative rather than caller-supplied.
 */
export interface ExecutionRouting {
  requiredCapabilities: string[];
  preferredAgentId: EntityId | null;
  provider: string | null;
}

/**
 * The founder's request, captured once when the canonical execution is created
 * and never rewritten. Replays and recoveries run *this* request rather than
 * whatever the caller happens to send later or whatever the task description says
 * now, so one dispatch key can only ever produce one body of work.
 */
export interface ExecutionRequest {
  instructions: string | null;
  requiredCapabilities: string[];
  preferredAgentId: EntityId | null;
}

export interface Execution {
  id: EntityId;
  taskId: EntityId;
  /**
   * The founder-request orchestration workflow, or null for agent executions
   * dispatched from a task that has no workflow. Nullable is additive: the
   * founder-request path always sets a workflow id.
   */
  workflowId: EntityId | null;
  agentId: EntityId | null;
  status: ExecutionStatus;
  triggerRunId: string | null;
  startedAt: IsoTimestamp | null;
  completedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  /**
   * Agent-backed executions only. Points at the current AgentAssignment lease and
   * records the Work-Management retry attempt (1-based). Both are additive and
   * optional so founder-request executions (which never assign an agent) are
   * unaffected. Populated by the Execution Manager in later Sprint 1D tasks.
   */
  assignmentId?: EntityId | null;
  attempt?: number;
  /**
   * Agent-backed executions only. The routing policy this execution was assigned
   * under, carried across attempts. Additive and optional: founder-request
   * executions never route to an agent, and pre-existing records without it fall
   * back to the assignment's `requiredCapabilities`.
   */
  routing?: ExecutionRouting | null;
  /**
   * Agent-backed executions only. The immutable request this execution was
   * created for. Additive and optional: founder-request executions carry none.
   */
  request?: ExecutionRequest | null;
}
