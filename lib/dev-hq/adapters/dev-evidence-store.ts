import type {
  CreateEvidenceInput,
  EnsureEvidenceInput,
  EvidenceStore,
} from "@/types/contracts";
import type { Evidence } from "@/types/domain";
import {
  ensureEvidenceByUri,
  getDevHqStore,
  getEvidence,
  saveEvidence,
} from "@/lib/dev-hq/store";
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
    return saveEvidence(buildEvidence(input));
  }

  async ensureEvidence(input: EnsureEvidenceInput): Promise<Evidence> {
    // No await between the lookup and the insert — `ensureEvidenceByUri` is
    // synchronous and so is building the row — so concurrent callers cannot
    // interleave and both create. The async signature is the contract's, not a
    // suspension point.
    return ensureEvidenceByUri(input.uri, () => buildEvidence(input));
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

function buildEvidence(input: CreateEvidenceInput): Evidence {
  return {
    id: nextId("evd"),
    executionId: input.executionId ?? null,
    taskId: input.taskId,
    kind: input.kind,
    label: input.label,
    summary: input.summary,
    uri: input.uri ?? null,
    createdAt: nowIso(),
    createdByAgentId: input.createdByAgentId ?? null,
  };
}

export function createDevEvidenceStore(): DevEvidenceStore {
  return new DevEvidenceStore();
}
