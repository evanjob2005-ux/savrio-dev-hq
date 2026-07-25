import type {
  WorkflowRunPatch,
  WorkflowRunRepository,
} from "@/types/contracts";
import type { IsoTimestamp, WorkflowRunRecord } from "@/types/domain";
import {
  getDevHqStore,
  getWorkflowRun,
  upsertWorkflowRun,
} from "@/lib/dev-hq/store";
import { nowIso } from "@/lib/dev-hq/id";

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
    return upsertWorkflowRun({
      ...current,
      ...patch,
      executionId,
      updatedAt: options?.at ?? nowIso(),
    });
  }
}

export function createDevWorkflowRunRepository(): DevWorkflowRunRepository {
  return new DevWorkflowRunRepository();
}
