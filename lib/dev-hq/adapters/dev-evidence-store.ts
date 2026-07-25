import type { CreateEvidenceInput, EvidenceStore } from "@/types/contracts";
import type { Evidence } from "@/types/domain";
import { getDevHqStore, getEvidence, saveEvidence } from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

/**
 * Development-only in-memory EvidenceStore adapter (Task 1E-1). Evidence is
 * append-only record-keeping; it never drives control flow (ADR-0002 E4).
 */
export class DevEvidenceStore implements EvidenceStore {
  async listForTask(taskId: string): Promise<Evidence[]> {
    return this.sorted((e) => e.taskId === taskId);
  }

  async listForExecution(executionId: string): Promise<Evidence[]> {
    return this.sorted((e) => e.executionId === executionId);
  }

  async addEvidence(input: CreateEvidenceInput): Promise<Evidence> {
    const evidence: Evidence = {
      id: nextId("evd"),
      executionId: input.executionId,
      taskId: input.taskId,
      kind: input.kind,
      label: input.label,
      summary: input.summary,
      uri: input.uri ?? null,
      createdAt: nowIso(),
      createdByAgentId: input.createdByAgentId ?? null,
    };
    return saveEvidence(evidence);
  }

  async getEvidence(id: string): Promise<Evidence | null> {
    return getEvidence(id);
  }

  private sorted(predicate: (evidence: Evidence) => boolean): Evidence[] {
    return [...getDevHqStore().evidence.values()]
      .filter(predicate)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

export function createDevEvidenceStore(): DevEvidenceStore {
  return new DevEvidenceStore();
}
