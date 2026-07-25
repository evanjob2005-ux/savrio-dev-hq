import type { Execution, IsoTimestamp, Workflow } from "@/types/domain";

export interface StartWorkflowInput {
  workflowId: string;
  taskId: string;
  payload?: Record<string, unknown>;
}

export interface MarkExecutionRunningInput {
  /** Stamped as startedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
  /** Recorded when supplied; left unchanged when omitted. */
  triggerRunId?: string;
}

export interface MarkExecutionTerminalInput {
  /** Stamped as completedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

/** Abstract orchestration engine contract. Distinct from the mock UI hook in `lib/workflow/useWorkflowEngine.ts`. */
export interface WorkflowEngine {
  getWorkflow(id: string): Promise<Workflow | null>;
  startWorkflow(input: StartWorkflowInput): Promise<Execution>;
  pauseExecution(executionId: string): Promise<Execution>;
  resumeExecution(executionId: string): Promise<Execution>;
  getExecution(executionId: string): Promise<Execution | null>;
  /** The lifecycle transitions below all throw when the execution is missing. */
  markExecutionRunning(
    executionId: string,
    input?: MarkExecutionRunningInput,
  ): Promise<Execution>;
  markExecutionSucceeded(
    executionId: string,
    input?: MarkExecutionTerminalInput,
  ): Promise<Execution>;
  markExecutionFailed(
    executionId: string,
    input?: MarkExecutionTerminalInput,
  ): Promise<Execution>;
}
