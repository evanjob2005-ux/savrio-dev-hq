import type {
  Approval,
  ContinuationState,
  IsoTimestamp,
  WorkflowDecision,
} from "@/types/domain";

export interface ApprovalDecisionInput {
  approvalId: string;
  decidedByUserId: string;
  notes?: string;
  /** Stamped as decidedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

export interface CreateApprovalInput {
  taskId: string;
  executionId: string | null;
  title: string;
  summary: string;
  requestedByAgentId: string;
  /** Stamped as requestedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

/**
 * Records what the founder chose, without asserting that the workflow advanced.
 *
 * Deliberately does not touch `status`, `decidedAt`, or `decidedByUserId`: those
 * describe a completed approval, and at this point nothing has been observed to
 * complete.
 */
export interface RecordDecisionIntentInput {
  approvalId: string;
  decision: WorkflowDecision;
}

/** Records what the continuation attempt actually established. */
export interface RecordContinuationInput {
  approvalId: string;
  continuation: ContinuationState;
}

export interface ApprovalManager {
  listPending(): Promise<Approval[]>;
  getApproval(id: string): Promise<Approval | null>;
  /** Newest pending approval for an execution, or null when there is none. */
  findPendingByExecution(executionId: string): Promise<Approval | null>;
  createApproval(input: CreateApprovalInput): Promise<Approval>;
  /**
   * Writes the founder's decision only if none is recorded yet, returning null
   * when the approval is missing or already carries one. Refusing the second
   * write is what makes a conflicting decision unrepresentable: the record holds
   * one decision or none, never both.
   */
  recordDecisionIntent(input: RecordDecisionIntentInput): Promise<Approval | null>;
  /** Throws when the approval does not exist. */
  recordContinuation(input: RecordContinuationInput): Promise<Approval>;
  /**
   * Records a decision only if the approval is still pending, returning null
   * when it is missing or already decided. Used to converge an approval whose
   * workflow advanced without the decision being written.
   */
  decidePendingApproval(
    input: ApprovalDecisionInput & { status: Approval["status"] },
  ): Promise<Approval | null>;
  approve(input: ApprovalDecisionInput): Promise<Approval>;
  reject(input: ApprovalDecisionInput): Promise<Approval>;
  escalate(input: ApprovalDecisionInput): Promise<Approval>;
}
