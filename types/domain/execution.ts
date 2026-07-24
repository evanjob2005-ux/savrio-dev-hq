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
}
