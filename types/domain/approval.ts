import type { ApprovalStatus, EntityId, IsoTimestamp } from "./common";

export interface Approval {
  id: EntityId;
  taskId: EntityId;
  executionId: EntityId | null;
  title: string;
  summary: string;
  status: ApprovalStatus;
  requestedByAgentId: EntityId;
  decidedByUserId: EntityId | null;
  requestedAt: IsoTimestamp;
  decidedAt: IsoTimestamp | null;
}
