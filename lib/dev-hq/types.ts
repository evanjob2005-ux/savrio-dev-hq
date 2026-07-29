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
  /**
   * Identity of the server store lifetime that produced this snapshot. Present
   * so an empty snapshot can be read honestly: see {@link ProcessStartMarker}.
   */
  processStart: ProcessStartMarker;
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
  /**
   * The order in which founder escalation resolutions were committed, keyed by
   * escalation id. **The recency authority for founder decisions** (P0-3): the
   * task outcome belongs to the escalation with the highest position here, and
   * an escalation that is not the highest is replaying a superseded decision.
   *
   * A counter rather than `Escalation.resolvedAt`, which is the obvious
   * candidate and is not sufficient. `resolvedAt` is millisecond-resolution
   * wall-clock, so two resolutions committed in the same millisecond compare
   * equal, and "no later decision exists" and "a later decision exists that I
   * cannot distinguish from mine" become the same reading — under which the
   * replay wins. A total order has no ties, so the comparison is decidable for
   * every pair.
   *
   * Assigned in the same synchronous step as the resolution write, by the only
   * code that performs one, for the same reason `eventKeys` and `evidenceUris`
   * are keyed in the store: a service-level read-then-write cannot order two
   * callers that both pass the read before either writes.
   *
   * Append-only and never removed, so `size` is a monotonic sequence.
   */
  escalationResolutionOrder: Map<string, number>;
  reviews: Map<string, Review>;
  /** Findings keyed by their deterministic id, so a replay cannot duplicate one. */
  reviewFindings: Map<string, ReviewFinding>;
  /**
   * Events already recorded under an idempotency key. Keyed lookup rather than a
   * scan of `events`, which is trimmed and would silently forget older keys.
   */
  eventKeys: Map<string, Event>;
  /** Identity of this store instance, fixed when the instance is created. */
  processStart: ProcessStartMarker;
}

/**
 * Server-supplied identity of one Dev HQ store lifetime.
 *
 * The store is created lazily per server process and is discarded whenever that
 * process restarts. Every snapshot carries the identity of the lifetime that
 * produced it, so a reader that compares this value against the one it last saw
 * can tell "nothing has happened yet" apart from "what you were looking at was
 * destroyed by a restart". Without it an empty approval queue is ambiguous, and
 * a reader has no way to know which of the two it is looking at.
 *
 * This marker DISCLOSES non-durability; it does not reduce it. It is not a
 * persistence mechanism, a durability guarantee, or a recovery affordance: when
 * `id` changes, everything the previous lifetime held is gone and cannot be
 * retrieved. The marker only makes that loss observable.
 */
export interface ProcessStartMarker {
  /**
   * Opaque identity of the store lifetime. Stable for as long as that lifetime
   * lasts; a different value means a different lifetime, and therefore that no
   * state observed under the previous value still exists.
   */
  id: string;
  /** ISO-8601 instant, read from the server clock, when this lifetime began. */
  startedAt: string;
}
