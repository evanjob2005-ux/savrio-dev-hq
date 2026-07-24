import { createDevApprovalManager } from "@/lib/dev-hq/adapters/dev-approval-manager";
import { createDevEventLogger } from "@/lib/dev-hq/adapters/dev-event-logger";
import { createDevTaskRepository } from "@/lib/dev-hq/adapters/dev-task-repository";
import { createDevWorkflowEngine } from "@/lib/dev-hq/adapters/dev-workflow-engine";
import type {
  ApprovalManager,
  EventLogger,
  TaskRepository,
  WorkflowEngine,
} from "@/types/contracts";

export interface DevHqAdapters {
  workflowEngine: WorkflowEngine;
  taskRepository: TaskRepository;
  approvalManager: ApprovalManager;
  eventLogger: EventLogger;
}

let cached: DevHqAdapters | null = null;

/**
 * Singleton development-only adapters backed by the in-memory store.
 * Not for production. Single-process and non-durable.
 */
export function getDevHqAdapters(): DevHqAdapters {
  if (!cached) {
    cached = {
      workflowEngine: createDevWorkflowEngine(),
      taskRepository: createDevTaskRepository(),
      approvalManager: createDevApprovalManager(),
      eventLogger: createDevEventLogger(),
    };
  }
  return cached;
}
