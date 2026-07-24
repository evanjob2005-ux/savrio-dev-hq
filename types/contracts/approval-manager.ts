import type { Approval } from "@/types/domain";

export interface ApprovalDecisionInput {
  approvalId: string;
  decidedByUserId: string;
  notes?: string;
}

export interface ApprovalManager {
  listPending(): Promise<Approval[]>;
  getApproval(id: string): Promise<Approval | null>;
  approve(input: ApprovalDecisionInput): Promise<Approval>;
  reject(input: ApprovalDecisionInput): Promise<Approval>;
  escalate(input: ApprovalDecisionInput): Promise<Approval>;
}
