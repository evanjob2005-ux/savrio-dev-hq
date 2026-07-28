import type { IsoTimestamp } from "./common";

/** Stages for the Sprint 1B founder-request workflow. */
export type FounderRequestWorkflowStage =
  | "founder_request_received"
  | "executive_review"
  | "founder_approval_required"
  | "validation_rejected"
  | "approved"
  | "rejected"
  | "completed"
  | "failed";

/** Distinguishes why a workflow was rejected. */
export type WorkflowRejectionKind = "validation" | "founder";

export type WorkflowDecision = "approved" | "rejected";

/**
 * Whether the workflow actually advanced past the founder's decision.
 *
 * Orthogonal to the decision itself: a decision is what the founder chose, a
 * continuation is what the durable side did about it. Collapsing the two into a
 * single enum is what let a recorded decision read as a completed workflow, so
 * they are carried as separate fields and never merged.
 *
 * - `not_attempted` — no decision is recorded, so nothing has been started.
 * - `confirmed`     — a continuation run was confirmed started.
 * - `unconfirmed`   — a decision is recorded and the continuation was not
 *                     confirmed. We do not know whether anything started. The
 *                     state is visible, retryable, and reconcilable, and it must
 *                     never render as a completed approval.
 * - `failed`        — the attempt returned a typed failure, so the continuation
 *                     is known not to have started. We know, rather than not
 *                     knowing.
 */
export type ContinuationState =
  | "not_attempted"
  | "confirmed"
  | "unconfirmed"
  | "failed";

/** Which run in the split workflow an id belongs to. */
export type RunLineageRole = "initial" | "continuation";

/**
 * Which record's single-valued `triggerRunId` field a write landed on.
 *
 * Two different records carry a run id per founder request — `Execution` via the
 * workflow engine and `WorkflowRunRecord` via the run repository — and each field
 * holds exactly one value. The lineage names the record so a write to either one
 * is recoverable rather than silently replacing what was there.
 */
export type RunLineageRecordName = "execution" | "workflow_run";

/** One recorded write of a Trigger.dev run id onto one record. */
export interface RunLineageEntry {
  runId: string;
  role: RunLineageRole;
  record: RunLineageRecordName;
  recordedAt: IsoTimestamp;
}

export interface FounderRequestInput {
  title: string;
  description: string;
  priority: import("./common").Priority;
}

export interface WorkflowRunRecord {
  executionId: string;
  taskId: string;
  projectId: string;
  workflowId: string;
  stage: FounderRequestWorkflowStage;
  /** The run that carried the request up to the approval gate. */
  triggerRunId: string | null;
  /** The run started by the founder's decision, once one is confirmed started. */
  continuationRunId: string | null;
  /**
   * Append-only history of every run id written onto either record, in order.
   * Owned by the repository: it is not patchable, so history cannot be rewritten.
   */
  runLineage: RunLineageEntry[];
  reviewSummary: string | null;
  /** The outcome the workflow reached. Written when the workflow finalises. */
  decision: WorkflowDecision | null;
  /** Whether the workflow advanced past the founder's decision. */
  continuation: ContinuationState;
  /** Continuation uncertainty, failure, or recovery detail. Null when there is nothing to explain. */
  continuationDetail: string | null;
  /** Set when decision is rejected; distinguishes validation vs founder rejection. */
  rejectionKind: WorkflowRejectionKind | null;
  updatedAt: string;
}
