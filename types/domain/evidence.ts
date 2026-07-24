import type { EntityId, IsoTimestamp } from "./common";

export type EvidenceKind =
  | "validation"
  | "artifact"
  | "review"
  | "approval"
  | "log";

export interface Evidence {
  id: EntityId;
  executionId: EntityId;
  taskId: EntityId;
  kind: EvidenceKind;
  label: string;
  summary: string;
  uri: string | null;
  createdAt: IsoTimestamp;
  createdByAgentId: EntityId | null;
}
