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
  PublicReview,
  Review,
  ReviewFinding,
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
  /**
   * The read-model projection, never the domain object: this state is served to
   * the browser, and a Review carries the callback capability that resolves it.
   */
  reviews: PublicReview[];
  reviewFindings: ReviewFinding[];
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
  /**
   * The first evidence row recorded for each logical uri. A keyed index rather
   * than a scan of `evidence`, so uri uniqueness is decided by one synchronous
   * lookup-and-insert instead of a read-then-write that two concurrent callers
   * can both pass.
   */
  evidenceUris: Map<string, Evidence>;
  escalations: Map<string, Escalation>;
  reviews: Map<string, Review>;
  /** Findings keyed by their deterministic id, so a replay cannot duplicate one. */
  reviewFindings: Map<string, ReviewFinding>;
  /**
   * Events already recorded under an idempotency key. Keyed lookup rather than a
   * scan of `events`, which is trimmed and would silently forget older keys.
   */
  eventKeys: Map<string, Event>;
}
