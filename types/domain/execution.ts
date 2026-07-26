import type { EntityId, ExecutionStatus, IsoTimestamp } from "./common";
import type { ReviewPolicy } from "./review";

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
  /**
   * Agent-backed executions only. How thoroughly this execution is reviewed once
   * it succeeds (ADR-0002 E1). Additive and optional: founder-request executions
   * carry none, and an absent policy is treated as no review rather than a
   * default, so nothing is reviewed that was not dispatched under a policy.
   */
  reviewPolicy?: ReviewPolicy | null;
  /**
   * Agent-backed executions only. The review that authorized this execution as a
   * revision, or null/absent for an execution nobody revised into existence.
   *
   * This is the revision chain: it is what lets the review loop count its own
   * iterations instead of counting every review the task ever had, so unrelated
   * work on the same task cannot exhaust the bound. An escalation `revise`
   * deliberately leaves it unset — that is how the founder's decision resets the
   * loop (ADR-0002 E2).
   */
  revisionOfReviewId?: EntityId | null;
}
