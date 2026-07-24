import type { DependencyKind, EntityId, IsoTimestamp } from "./common";

export interface TaskDependency {
  id: EntityId;
  taskId: EntityId;
  dependsOnTaskId: EntityId;
  kind: DependencyKind;
  createdAt: IsoTimestamp;
}
