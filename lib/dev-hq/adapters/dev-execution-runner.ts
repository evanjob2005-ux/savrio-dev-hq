import type {
  AgentSelectionPolicy,
  AssignmentDecision,
  ExecutionRunner,
} from "@/types/contracts";
import type { ClaimExecutionResult } from "@/types/contracts/execution-runner";
import type { AgentResult, Execution, IsoTimestamp, Task } from "@/types/domain";
import * as manager from "@/lib/dev-hq/execution-manager";

/**
 * Development-only ExecutionRunner adapter. A thin pass-through to the in-memory
 * Execution Manager so the same lifecycle logic is reused by the Trigger
 * agent-execution callbacks, which reach it through the composition root rather
 * than importing the manager themselves.
 *
 * **Pass-through means every argument.** The adapter previously dropped the
 * heartbeat's assignment identity on the floor, which silently turned every beat
 * that crossed this seam into an anonymous one — the manager could then no longer
 * tell a live worker from an abandoned one. A parameter an adapter accepts and
 * does not forward is worse than one it never accepted.
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
  ): Promise<ClaimExecutionResult> {
    return manager.claimExecution(executionId, agentId);
  }

  heartbeat(executionId: string, assignmentId: string): Promise<Execution> {
    return manager.heartbeat(executionId, assignmentId);
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
