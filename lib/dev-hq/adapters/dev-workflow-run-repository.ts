import type {
  WorkflowRunPatch,
  WorkflowRunRepository,
} from "@/types/contracts";
import type {
  IsoTimestamp,
  RunLineageEntry,
  WorkflowRunRecord,
} from "@/types/domain";
import {
  getDevHqStore,
  getWorkflowRun,
  upsertWorkflowRun,
} from "@/lib/dev-hq/store";
import { nowIso } from "@/lib/dev-hq/id";

/**
 * The run-id fields this repository owns, paired with the lineage role a write
 * to each represents. The role is derived from the field rather than passed in,
 * because the field *is* the role: `triggerRunId` holds the run that carried the
 * request to the approval gate, `continuationRunId` the run started by the
 * founder's decision.
 */
const LINEAGE_FIELDS = [
  { field: "triggerRunId", role: "initial" },
  { field: "continuationRunId", role: "continuation" },
] as const satisfies ReadonlyArray<{
  field: keyof WorkflowRunRecord;
  role: RunLineageEntry["role"];
}>;

/** Development-only in-memory WorkflowRunRepository adapter. */
export class DevWorkflowRunRepository implements WorkflowRunRepository {
  async listRuns(): Promise<WorkflowRunRecord[]> {
    return [...getDevHqStore().workflowRuns.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async getRun(executionId: string): Promise<WorkflowRunRecord | null> {
    return getWorkflowRun(executionId);
  }

  async saveRun(run: WorkflowRunRecord): Promise<WorkflowRunRecord> {
    return upsertWorkflowRun(run);
  }

  async updateRun(
    executionId: string,
    patch: WorkflowRunPatch,
    options?: { at?: IsoTimestamp },
  ): Promise<WorkflowRunRecord> {
    const current = await this.getRun(executionId);
    if (!current) {
      throw new Error(`Workflow run not found: ${executionId}`);
    }
    const at = options?.at ?? nowIso();

    // Every run id the record is asked to hold is appended to the lineage before
    // it lands on the single-valued field. An overwrite is still permitted and
    // still returns normally — what changes is that the id it displaced stays
    // recoverable instead of being gone.
    const appended: RunLineageEntry[] = [];
    for (const { field, role } of LINEAGE_FIELDS) {
      const incoming = patch[field];
      if (typeof incoming === "string" && incoming !== current[field]) {
        appended.push({
          runId: incoming,
          role,
          record: "workflow_run",
          recordedAt: at,
        });
      }
    }

    return upsertWorkflowRun({
      ...current,
      ...patch,
      executionId,
      runLineage: appended.length
        ? [...current.runLineage, ...appended]
        : current.runLineage,
      updatedAt: at,
    });
  }

  async appendRunLineage(
    executionId: string,
    entry: Omit<RunLineageEntry, "recordedAt"> & { at?: IsoTimestamp },
  ): Promise<WorkflowRunRecord> {
    const current = await this.getRun(executionId);
    if (!current) {
      throw new Error(`Workflow run not found: ${executionId}`);
    }
    const { at, ...rest } = entry;
    const recordedAt = at ?? nowIso();
    return upsertWorkflowRun({
      ...current,
      runLineage: [...current.runLineage, { ...rest, recordedAt }],
      updatedAt: recordedAt,
    });
  }
}

export function createDevWorkflowRunRepository(): DevWorkflowRunRepository {
  return new DevWorkflowRunRepository();
}
