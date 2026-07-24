import type { EntityId, IsoTimestamp, LifecycleStatus } from "./common";

export interface Project {
  id: EntityId;
  name: string;
  slug: string;
  description: string;
  repository: string;
  defaultBranch: string;
  status: LifecycleStatus;
  ownerId: EntityId;
  createdAt: IsoTimestamp;
  updatedAt: IsoTimestamp;
}
