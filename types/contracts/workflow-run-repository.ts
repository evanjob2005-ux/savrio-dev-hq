import type {
  IsoTimestamp,
  RunLineageEntry,
  WorkflowRunRecord,
} from "@/types/domain";

/**
 * Fields of a workflow run that may be patched. The execution id is the identity
 * of the record, updatedAt is owned by the repository, and `runLineage` is
 * append-only history the repository maintains — patching it would be a rewrite
 * of the record of what happened, which is the one thing the lineage exists to
 * prevent.
 */
export type WorkflowRunPatch = Partial<
  Omit<WorkflowRunRecord, "executionId" | "updatedAt" | "runLineage">
>;

export interface WorkflowRunRepository {
  listRuns(): Promise<WorkflowRunRecord[]>;
  getRun(executionId: string): Promise<WorkflowRunRecord | null>;
  saveRun(run: WorkflowRunRecord): Promise<WorkflowRunRecord>;
  /**
   * Throws when the run does not exist.
   *
   * A patch carrying `triggerRunId` or `continuationRunId` also appends to the
   * lineage, so replacing a run id keeps the id it replaced. That write is still
   * permitted — the defect was that it was unrecoverable, not that it happened.
   */
  updateRun(
    executionId: string,
    patch: WorkflowRunPatch,
    options?: { at?: IsoTimestamp },
  ): Promise<WorkflowRunRecord>;
  /**
   * Records a run id written onto a record this repository does not own — today
   * that is `Execution.triggerRunId`, which the workflow engine writes. Both
   * records' run ids therefore land in one ordered history instead of two
   * single-valued fields that each forget independently.
   *
   * Throws when the run does not exist.
   */
  appendRunLineage(
    executionId: string,
    entry: Omit<RunLineageEntry, "recordedAt"> & { at?: IsoTimestamp },
  ): Promise<WorkflowRunRecord>;
}
