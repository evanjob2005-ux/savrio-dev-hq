import type { ApprovalDecisionInput, ApprovalManager } from "@/types/contracts";
import type { Approval } from "@/types/domain";
import { getDevHqStore, saveApproval } from "@/lib/dev-hq/store";
import { nowIso } from "@/lib/dev-hq/id";

/** Development-only in-memory ApprovalManager adapter. */
export class DevApprovalManager implements ApprovalManager {
  async listPending(): Promise<Approval[]> {
    return [...getDevHqStore().approvals.values()]
      .filter((a) => a.status === "pending")
      .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt));
  }

  async getApproval(id: string): Promise<Approval | null> {
    return getDevHqStore().approvals.get(id) ?? null;
  }

  async approve(input: ApprovalDecisionInput): Promise<Approval> {
    return this.decide(input, "approved");
  }

  async reject(input: ApprovalDecisionInput): Promise<Approval> {
    return this.decide(input, "rejected");
  }

  async escalate(input: ApprovalDecisionInput): Promise<Approval> {
    return this.decide(input, "escalated");
  }

  private async decide(
    input: ApprovalDecisionInput,
    status: Approval["status"],
  ): Promise<Approval> {
    const existing = await this.getApproval(input.approvalId);
    if (!existing) {
      throw new Error(`Approval not found: ${input.approvalId}`);
    }
    const updated: Approval = {
      ...existing,
      status,
      decidedByUserId: input.decidedByUserId,
      decidedAt: nowIso(),
    };
    return saveApproval(updated);
  }
}

export function createDevApprovalManager(): DevApprovalManager {
  return new DevApprovalManager();
}
