import type { Approval, IsoTimestamp } from "@/types/domain";

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

export interface ApprovalManager {
  listPending(): Promise<Approval[]>;
  getApproval(id: string): Promise<Approval | null>;
  /** Newest pending approval for an execution, or null when there is none. */
  findPendingByExecution(executionId: string): Promise<Approval | null>;
  createApproval(input: CreateApprovalInput): Promise<Approval>;
  /** Throws when the approval does not exist. */
  attachWaitToken(approvalId: string, waitTokenId: string): Promise<Approval>;
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
