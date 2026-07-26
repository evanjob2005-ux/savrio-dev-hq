import type { SystemOverviewMetrics } from "@/data/placeholders/mission-control";
import type {
  Agent,
  AgentAssignment,
  Approval,
  Escalation,
  Event,
  Evidence,
  Execution,
  Project,
  Task,
  Workflow,
  WorkflowRunRecord,
} from "@/types/domain";

/** Aggregate HQ state returned to the Mission Control UI. */
export interface DevHqState {
  projects: Project[];
  tasks: Task[];
  approvals: Approval[];
  events: Event[];
  workflows: Workflow[];
  executions: Execution[];
  workflowRuns: WorkflowRunRecord[];
  agents: Agent[];
  evidence: Evidence[];
  escalations: Escalation[];
  overview: SystemOverviewMetrics;
}

export interface DevHqStoreData {
  projects: Map<string, Project>;
  tasks: Map<string, Task>;
  approvals: Map<string, Approval>;
  events: Event[];
  workflows: Map<string, Workflow>;
  executions: Map<string, Execution>;
  workflowRuns: Map<string, WorkflowRunRecord>;
  agents: Map<string, Agent>;
  agentAssignments: Map<string, AgentAssignment>;
  evidence: Map<string, Evidence>;
  escalations: Map<string, Escalation>;
  /**
   * Events already recorded under an idempotency key. Keyed lookup rather than a
   * scan of `events`, which is trimmed and would silently forget older keys.
   */
  eventKeys: Map<string, Event>;
}
