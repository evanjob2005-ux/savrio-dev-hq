import type {
  ApprovalDecisionInput,
  ApprovalManager,
  CreateApprovalInput,
} from "@/types/contracts";
import type { Approval } from "@/types/domain";
import { getDevHqStore, saveApproval } from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

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

  async findPendingByExecution(executionId: string): Promise<Approval | null> {
    return (
      [...getDevHqStore().approvals.values()]
        .filter((a) => a.executionId === executionId && a.status === "pending")
        .sort((a, b) => b.requestedAt.localeCompare(a.requestedAt))[0] ?? null
    );
  }

  async createApproval(input: CreateApprovalInput): Promise<Approval> {
    const approval: Approval = {
      id: nextId("appr"),
      taskId: input.taskId,
      executionId: input.executionId,
      title: input.title,
      summary: input.summary,
      status: "pending",
      requestedByAgentId: input.requestedByAgentId,
      decidedByUserId: null,
      requestedAt: input.at ?? nowIso(),
      decidedAt: null,
      waitTokenId: null,
    };
    return saveApproval(approval);
  }

  async attachWaitToken(
    approvalId: string,
    waitTokenId: string,
  ): Promise<Approval> {
    const existing = await this.getApproval(approvalId);
    if (!existing) {
      throw new Error(`Approval not found: ${approvalId}`);
    }
    return saveApproval({ ...existing, waitTokenId });
  }

  async decidePendingApproval(
    input: ApprovalDecisionInput & { status: Approval["status"] },
  ): Promise<Approval | null> {
    const existing = await this.getApproval(input.approvalId);
    if (!existing || existing.status !== "pending") {
      return null;
    }
    return saveApproval({
      ...existing,
      status: input.status,
      decidedByUserId: input.decidedByUserId,
      decidedAt: input.at ?? nowIso(),
    });
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
    return saveApproval({
      ...existing,
      status,
      decidedByUserId: input.decidedByUserId,
      decidedAt: input.at ?? nowIso(),
    });
  }
}

export function createDevApprovalManager(): DevApprovalManager {
  return new DevApprovalManager();
}
