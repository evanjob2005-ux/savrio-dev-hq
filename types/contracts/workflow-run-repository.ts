import type { IsoTimestamp, WorkflowRunRecord } from "@/types/domain";

/**
 * Fields of a workflow run that may be patched. The execution id is the
 * identity of the record and updatedAt is owned by the repository.
 */
export type WorkflowRunPatch = Partial<
  Omit<WorkflowRunRecord, "executionId" | "updatedAt">
>;

export interface WorkflowRunRepository {
  listRuns(): Promise<WorkflowRunRecord[]>;
  getRun(executionId: string): Promise<WorkflowRunRecord | null>;
  saveRun(run: WorkflowRunRecord): Promise<WorkflowRunRecord>;
  /** Throws when the run does not exist. */
  updateRun(
    executionId: string,
    patch: WorkflowRunPatch,
    options?: { at?: IsoTimestamp },
  ): Promise<WorkflowRunRecord>;
}
