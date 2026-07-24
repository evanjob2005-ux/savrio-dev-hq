import type { Execution } from "@/types/domain";

export interface ExecutionRunner {
  queueExecution(taskId: string, workflowId: string): Promise<Execution>;
  runExecution(executionId: string): Promise<Execution>;
  cancelExecution(executionId: string): Promise<Execution>;
  getExecution(executionId: string): Promise<Execution | null>;
}
