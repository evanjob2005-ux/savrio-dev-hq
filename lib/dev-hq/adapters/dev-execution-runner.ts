import type {
  AgentSelectionPolicy,
  AssignmentDecision,
  ExecutionRunner,
} from "@/types/contracts";
import type { AgentResult, Execution, IsoTimestamp, Task } from "@/types/domain";
import * as manager from "@/lib/dev-hq/execution-manager";

/**
 * Development-only ExecutionRunner adapter. A thin pass-through to the in-memory
 * Execution Manager so the same lifecycle logic is reused by the (future) Trigger
 * agent-execution callbacks. Not yet wired into the composition root (Task 1D-4).
 */
export class DevExecutionRunner implements ExecutionRunner {
  listReadyWork(): Promise<Task[]> {
    return manager.listReadyWork();
  }

  assignExecution(
    taskId: string,
    policy?: AgentSelectionPolicy,
  ): Promise<AssignmentDecision> {
    return manager.assignExecution(taskId, policy);
  }

  claimExecution(
    executionId: string,
    agentId: string,
  ): Promise<Execution | null> {
    return manager.claimExecution(executionId, agentId);
  }

  heartbeat(executionId: string): Promise<Execution> {
    return manager.heartbeat(executionId);
  }

  releaseExecution(executionId: string, result: AgentResult): Promise<Execution> {
    return manager.releaseExecution(executionId, result);
  }

  reclaimStale(now?: IsoTimestamp): Promise<Execution[]> {
    return manager.reclaimStale(now);
  }

  queueExecution(taskId: string, workflowId: string): Promise<Execution> {
    return manager.queueExecution(taskId, workflowId);
  }

  runExecution(executionId: string): Promise<Execution | null> {
    return manager.runExecution(executionId);
  }

  cancelExecution(executionId: string): Promise<Execution> {
    return manager.cancelExecution(executionId);
  }

  getExecution(executionId: string): Promise<Execution | null> {
    return manager.getExecution(executionId);
  }
}

export function createDevExecutionRunner(): DevExecutionRunner {
  return new DevExecutionRunner();
}
