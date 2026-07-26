import type { EntityId, IsoTimestamp } from "./common";

export type EvidenceKind =
  | "validation"
  | "artifact"
  | "review"
  | "approval"
  | "log";

export interface Evidence {
  id: EntityId;
  /** The execution this evidence records, or null when it is not tied to one. */
  executionId: EntityId | null;
  taskId: EntityId;
  kind: EvidenceKind;
  label: string;
  summary: string;
  uri: string | null;
  createdAt: IsoTimestamp;
  createdByAgentId: EntityId | null;
}
