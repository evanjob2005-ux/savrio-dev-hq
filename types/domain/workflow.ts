import type { EntityId, IsoTimestamp, LifecycleStatus } from "./common";

export interface WorkflowStage {
  id: EntityId;
  name: string;
  order: number;
  requiresApproval: boolean;
}

/** Orchestration workflow definition. Distinct from mock pipeline stages in `types/workflow.ts`. */
export interface Workflow {
  id: EntityId;
  projectId: EntityId;
  name: string;
  version: string;
  status: LifecycleStatus;
  stages: WorkflowStage[];
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
