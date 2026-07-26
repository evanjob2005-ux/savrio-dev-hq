import type { Evidence } from "@/types/domain";

export interface CreateEvidenceInput {
  /** Optional: omit or pass null for evidence not tied to a specific execution. */
  executionId?: string | null;
  taskId: string;
  kind: Evidence["kind"];
  label: string;
  summary: string;
  uri?: string | null;
  createdByAgentId?: string | null;
}

export interface EvidenceStore {
  listForTask(taskId: string): Promise<Evidence[]>;
  listForExecution(executionId: string): Promise<Evidence[]>;
  addEvidence(input: CreateEvidenceInput): Promise<Evidence>;
  getEvidence(id: string): Promise<Evidence | null>;
}
