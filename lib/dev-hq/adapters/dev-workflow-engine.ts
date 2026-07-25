import type {
  MarkExecutionRunningInput,
  MarkExecutionTerminalInput,
  StartWorkflowInput,
  WorkflowEngine,
} from "@/types/contracts";
import type { Execution, Workflow } from "@/types/domain";
import { FOUNDER_REQUEST_WORKFLOW_ID } from "@/lib/dev-hq/constants";
import { getDevHqStore, saveExecution, upsertWorkflowRun } from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

/** Development-only in-memory WorkflowEngine adapter. */
export class DevWorkflowEngine implements WorkflowEngine {
  async getWorkflow(id: string): Promise<Workflow | null> {
    return getDevHqStore().workflows.get(id) ?? null;
  }

  async startWorkflow(input: StartWorkflowInput): Promise<Execution> {
    const workflow = await this.getWorkflow(input.workflowId);
    if (!workflow) {
      throw new Error(`Workflow not found: ${input.workflowId}`);
    }

    const task = getDevHqStore().tasks.get(input.taskId);
    if (!task) {
      throw new Error(`Task not found: ${input.taskId}`);
    }

    const timestamp = nowIso();
    const execution: Execution = {
      id: nextId("exec"),
      taskId: input.taskId,
      workflowId: input.workflowId,
      agentId: null,
      status: "queued",
      triggerRunId: null,
      startedAt: null,
      completedAt: null,
      createdAt: timestamp,
    };
    saveExecution(execution);

    upsertWorkflowRun({
      executionId: execution.id,
      taskId: task.id,
      projectId: task.projectId,
      workflowId: workflow.id,
      stage: "founder_request_received",
      waitTokenId: null,
      triggerRunId: null,
      reviewSummary: null,
      decision: null,
      rejectionKind: null,
      updatedAt: timestamp,
    });

    if (input.workflowId === FOUNDER_REQUEST_WORKFLOW_ID) {
      task.status = "active";
      task.workflowId = workflow.id;
      task.updatedAt = timestamp;
      getDevHqStore().tasks.set(task.id, task);
    }

    return execution;
  }

  async pauseExecution(executionId: string): Promise<Execution> {
    const execution = await this.requireExecution(executionId);
    return saveExecution({ ...execution, status: "queued" });
  }

  async resumeExecution(executionId: string): Promise<Execution> {
    const execution = await this.requireExecution(executionId);
    return saveExecution({
      ...execution,
      status: "running",
      startedAt: execution.startedAt ?? nowIso(),
    });
  }

  async getExecution(executionId: string): Promise<Execution | null> {
    return getDevHqStore().executions.get(executionId) ?? null;
  }

  async markExecutionRunning(
    executionId: string,
    input?: MarkExecutionRunningInput,
  ): Promise<Execution> {
    const execution = await this.requireExecution(executionId);
    return saveExecution({
      ...execution,
      status: "running",
      startedAt: input?.at ?? nowIso(),
      triggerRunId:
        input?.triggerRunId !== undefined
          ? input.triggerRunId
          : execution.triggerRunId,
    });
  }

  async markExecutionSucceeded(
    executionId: string,
    input?: MarkExecutionTerminalInput,
  ): Promise<Execution> {
    const execution = await this.requireExecution(executionId);
    return saveExecution({
      ...execution,
      status: "succeeded",
      completedAt: input?.at ?? nowIso(),
    });
  }

  async markExecutionFailed(
    executionId: string,
    input?: MarkExecutionTerminalInput,
  ): Promise<Execution> {
    const execution = await this.requireExecution(executionId);
    return saveExecution({
      ...execution,
      status: "failed",
      completedAt: input?.at ?? nowIso(),
    });
  }

  private async requireExecution(executionId: string): Promise<Execution> {
    const execution = await this.getExecution(executionId);
    if (!execution) {
      throw new Error(`Execution not found: ${executionId}`);
    }
    return execution;
  }
}

export function createDevWorkflowEngine(): DevWorkflowEngine {
  return new DevWorkflowEngine();
}
