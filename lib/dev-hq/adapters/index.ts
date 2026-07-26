import { createDevAgentProvider } from "@/lib/dev-hq/adapters/dev-agent-provider";
import { createDevApprovalManager } from "@/lib/dev-hq/adapters/dev-approval-manager";
import { createDevEscalationStore } from "@/lib/dev-hq/adapters/dev-escalation-store";
import { createDevEventLogger } from "@/lib/dev-hq/adapters/dev-event-logger";
import { createDevEvidenceStore } from "@/lib/dev-hq/adapters/dev-evidence-store";
import { createDevExecutionRunner } from "@/lib/dev-hq/adapters/dev-execution-runner";
import { createDevProjectRepository } from "@/lib/dev-hq/adapters/dev-project-repository";
import { createDevStateReader } from "@/lib/dev-hq/adapters/dev-state-reader";
import { createDevTaskRepository } from "@/lib/dev-hq/adapters/dev-task-repository";
import { createDevWorkflowEngine } from "@/lib/dev-hq/adapters/dev-workflow-engine";
import { createDevWorkflowRunRepository } from "@/lib/dev-hq/adapters/dev-workflow-run-repository";
import type {
  AgentProvider,
  ApprovalManager,
  EscalationStore,
  EventLogger,
  EvidenceStore,
  ExecutionRunner,
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
  agentProvider: AgentProvider;
  executionRunner: ExecutionRunner;
  evidenceStore: EvidenceStore;
  escalationStore: EscalationStore;
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
      agentProvider: createDevAgentProvider(),
      executionRunner: createDevExecutionRunner(),
      evidenceStore: createDevEvidenceStore(),
      escalationStore: createDevEscalationStore(),
    };
  }
  return cached;
}

/** Clears the adapter cache. Used by tests after resetting the store. */
export function resetDevHqAdapters(): void {
  cached = null;
}
