import type { EntityId, IsoTimestamp, LifecycleStatus, Priority } from "./common";

/** Canonical work-management task. Distinct from the mock workflow `Task` in `types/workflow.ts`. */
export interface Task {
  id: EntityId;
  projectId: EntityId;
  workflowId: EntityId | null;
  title: string;
  description: string;
  status: LifecycleStatus;
  priority: Priority;
  assigneeAgentId: EntityId | null;
  claimedAt: IsoTimestamp | null;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
  dueAt: IsoTimestamp | null;
}
