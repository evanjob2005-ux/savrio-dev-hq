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
  waitTokenId: string | null;
  triggerRunId: string | null;
  reviewSummary: string | null;
  decision: WorkflowDecision | null;
  /** Set when decision is rejected; distinguishes validation vs founder rejection. */
  rejectionKind: WorkflowRejectionKind | null;
  updatedAt: string;
}
