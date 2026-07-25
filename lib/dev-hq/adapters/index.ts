import { createDevApprovalManager } from "@/lib/dev-hq/adapters/dev-approval-manager";
import { createDevEventLogger } from "@/lib/dev-hq/adapters/dev-event-logger";
import { createDevProjectRepository } from "@/lib/dev-hq/adapters/dev-project-repository";
import { createDevStateReader } from "@/lib/dev-hq/adapters/dev-state-reader";
import { createDevTaskRepository } from "@/lib/dev-hq/adapters/dev-task-repository";
import { createDevWorkflowEngine } from "@/lib/dev-hq/adapters/dev-workflow-engine";
import { createDevWorkflowRunRepository } from "@/lib/dev-hq/adapters/dev-workflow-run-repository";
import type {
  ApprovalManager,
  EventLogger,
  ProjectRepository,
  StateReader,
  TaskRepository,
  WorkflowEngine,
  WorkflowRunRepository,
} from "@/types/contracts";

export interface DevHqAdapters {
  workflowEngine: WorkflowEngine;
  taskRepository: TaskRepository;
  projectRepository: ProjectRepository;
  workflowRunRepository: WorkflowRunRepository;
  approvalManager: ApprovalManager;
  eventLogger: EventLogger;
  stateReader: StateReader;
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
      projectRepository: createDevProjectRepository(),
      workflowRunRepository: createDevWorkflowRunRepository(),
      approvalManager: createDevApprovalManager(),
      eventLogger: createDevEventLogger(),
      stateReader: createDevStateReader(),
    };
  }
  return cached;
}

/** Clears the adapter cache. Used by tests after resetting the store. */
export function resetDevHqAdapters(): void {
  cached = null;
}
