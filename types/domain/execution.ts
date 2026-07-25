import type { EntityId, ExecutionStatus, IsoTimestamp } from "./common";

export interface Execution {
  id: EntityId;
  taskId: EntityId;
  workflowId: EntityId;
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
}
