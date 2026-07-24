import type { EntityId, IsoTimestamp } from "./common";

export type EventEntityType =
  | "project"
  | "task"
  | "workflow"
  | "execution"
  | "approval"
  | "agent"
  | "service";

export interface Event {
  id: EntityId;
  type: string;
  entityType: EventEntityType;
  entityId: EntityId;
  message: string;
  actorId: EntityId | null;
  actorLabel: string;
  timestamp: IsoTimestamp;
}
