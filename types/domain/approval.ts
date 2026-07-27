import type { ApprovalStatus, EntityId, IsoTimestamp } from "./common";
import type {
  ContinuationState,
  WorkflowDecision,
} from "./founder-request-workflow";

export interface Approval {
  id: EntityId;
  taskId: EntityId;
  executionId: EntityId | null;
  title: string;
  summary: string;
  /**
   * The rendered state of this approval. It becomes `approved` or `rejected`
   * only once the workflow has been observed to advance, so it never reports a
   * completed approval on the strength of a recorded decision alone.
   */
  status: ApprovalStatus;
  requestedByAgentId: EntityId;
  decidedByUserId: EntityId | null;
  requestedAt: IsoTimestamp;
  decidedAt: IsoTimestamp | null;
  /**
   * What the founder chose, recorded before the continuation is attempted. Held
   * separately from `status` because choosing is not the same event as the
   * workflow advancing, and separately from `continuation` because what was
   * decided and whether it took effect are orthogonal.
   */
  decision: WorkflowDecision | null;
  /** Whether the workflow advanced on that decision. */
  continuation: ContinuationState;
}
