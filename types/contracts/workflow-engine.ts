import type { Execution, Workflow } from "@/types/domain";

export interface StartWorkflowInput {
  workflowId: string;
  taskId: string;
  payload?: Record<string, unknown>;
}

/** Abstract orchestration engine contract. Distinct from the mock UI hook in `lib/workflow/useWorkflowEngine.ts`. */
export interface WorkflowEngine {
  getWorkflow(id: string): Promise<Workflow | null>;
  startWorkflow(input: StartWorkflowInput): Promise<Execution>;
  pauseExecution(executionId: string): Promise<Execution>;
  resumeExecution(executionId: string): Promise<Execution>;
  getExecution(executionId: string): Promise<Execution | null>;
}
