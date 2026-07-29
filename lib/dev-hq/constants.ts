/** Dev HQ founder-request workflow identifier. */
export const FOUNDER_REQUEST_WORKFLOW_ID = "wf-founder-request";

export const EXECUTIVE_ORCHESTRATOR_AGENT_ID = "agent-executive-orchestrator";
export const FOUNDER_USER_ID = "user-evan";

export const DEV_HQ_ACTORS = {
  founderUserId: FOUNDER_USER_ID,
  executiveAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
} as const;

/**
 * Agents that exist so records join to a real identity, and which must never be
 * given work. **Membership here is the ineligibility**, not a consequence of
 * what the agent happens to hold.
 *
 * The executive orchestrator RAISES escalations (it is persisted as
 * `raisedByAgentId`, `createdByAgentId` and `actorId`); it does not perform
 * them. It was registered in commit e5aac96 with an empty capability set on the
 * reasoning that an empty set makes it unselectable. That reasoning is wrong:
 * `hasCapabilities` is `required.every(...)`, and `[].every(...)` is `true` for
 * every agent by definition, so a dispatch that names NO capabilities matches it
 * like any other. It was unselectable only for as long as every dispatch
 * happened to name its capabilities — an unenforced assumption about callers,
 * not a property of the registry. `dispatchAgentExecution` makes
 * `requiredCapabilities` optional, so the assumption is violable from the
 * shipped entry point, and once the roster's real workers are busy selection
 * reaches the orchestrator and hands it the job.
 *
 * A capability set is a statement about what an agent CAN do. Whether an actor
 * may be dispatched at all is a different question, and it is answered here so
 * that it cannot be re-opened by editing capabilities.
 */
export const SYSTEM_ACTOR_AGENT_IDS: readonly string[] = [
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
];

/**
 * Canonical Phase 1 agent capability vocabulary (ADR-0001 O3), frozen from the
 * existing roster so the UI and the selection engine share one set. A fuller
 * department-mapped taxonomy is deferred to Phase 2.
 */
export const AGENT_CAPABILITIES = [
  "routing",
  "sequencing",
  "escalation",
  "implementation",
  "review",
  "corrections",
  "qa",
  "accessibility",
  "gates",
  "validation",
] as const;

export type AgentCapability = (typeof AGENT_CAPABILITIES)[number];

/**
 * Work-Management retry budget: attempts per execution before it is exhausted and
 * marked failed (ADR-0001 O2). Escalation side effects (approval, needs_revision)
 * are formalized in Sprint 1E.
 */
export const MAX_EXECUTION_ATTEMPTS = 3;

/**
 * Lease duration granted when an execution is claimed and extended on each
 * heartbeat (ADR-0001 O5). An execution whose lease has expired is reclaimable.
 */
export const EXECUTION_LEASE_TTL_MS = 60_000;

/**
 * An agent whose last activity is older than this is reported "stale" by the
 * health check (Task 1E-4). Matched to the lease TTL: a healthy running agent
 * heartbeats well within this window, so a lapse beyond it means the agent is no
 * longer reporting. The boundary is inclusive (age == threshold is still fresh).
 */
export const AGENT_HEALTH_STALE_AFTER_MS = EXECUTION_LEASE_TTL_MS;

/**
 * How long a dispatched assignment may go unclaimed before recovery treats its
 * Trigger run as dead. Such an assignment holds no lease — it never became
 * running — so nothing else can see it: this is the only deadline that makes a
 * worker which lost a race for a capacity-one agent recoverable. Generous
 * relative to dispatch latency, and recovery costs no business attempt.
 */
export const EXECUTION_CLAIM_DEADLINE_MS = EXECUTION_LEASE_TTL_MS * 2;

/**
 * How long an execution may sit queued with no agent before the stall is
 * escalated to the founder (P0-5).
 *
 * **Lifecycle policy, landed under a Founder-delegated decision on 2026-07-29.**
 * It amends ADR-0001 O6, which resolved that "no available capability match
 * leaves the execution `queued` with a logged event". O6 makes queued a resting
 * state; this makes it a terminating one after a bound. The amendment was put to
 * the Founder as a decision precisely because it is not an engineering call.
 *
 * What O6 did not anticipate: dispatch a satisfiable capability, then let the
 * satisfying agent leave the roster, and the execution sits queued at attempt 1
 * with no agent forever. Nothing increments `attempt` for a queued execution —
 * the only increments are inside `applyFailedAttempt`, reachable only from a
 * `running` execution — so `MAX_EXECUTION_ATTEMPTS` is unreachable, the terminal
 * finalization never runs, and no escalation is ever raised. The deferred event
 * is keyed per (execution, attempt), and `attempt` is frozen, so even the
 * timeline entry stops after the first sweep. That is the SVC-01 shape (commit
 * e5aac96): work that neither completes nor fails.
 *
 * Derived, not invented. `REVIEW_RESPONSE_DEADLINE_MS` is set to the same value
 * for the same structural reason, stated there: a review holds no lease, so
 * nothing else would ever free it. A queued execution with no agent holds no
 * lease either — reclaim only sees `running` attempts, and the claim deadline
 * only sees dispatched ones — so this deadline is likewise the only thing that
 * can notice it. Three deadlines in this file share one value because they are
 * three instances of one condition.
 */
export const EXECUTION_QUEUE_STALL_DEADLINE_MS = EXECUTION_CLAIM_DEADLINE_MS;

/**
 * Typed execution lifecycle event names emitted from the service layer
 * (ADR-0002 E3). No event is emitted per heartbeat. `reclaimed` is emitted by the
 * Sprint 1E-3 lease sweeper when it recovers an expired-lease attempt.
 *
 * `assignmentDeferred` records that an execution could not be given an agent and
 * stays queued. The queued execution is the approved outcome (ADR-0001 O6); what
 * was missing was any record that it happened, which made a declined dispatch
 * indistinguishable from one that was never requested.
 *
 * `claimLost` records that a dispatched worker lost the compare-and-set for its
 * agent and stood down. Both are outcomes of the lifecycle, not errors in it.
 */
export const EXECUTION_EVENT_TYPE = {
  assigned: "execution.assigned",
  assignmentDeferred: "execution.assignment_deferred",
  claimed: "execution.claimed",
  claimLost: "execution.claim_lost",
  succeeded: "execution.succeeded",
  retried: "execution.retried",
  exhausted: "execution.exhausted",
  cancelled: "execution.cancelled",
  reclaimed: "execution.reclaimed",
} as const;

/**
 * Cron for the scheduled lease sweeper (Task 1E-3). Every minute — the finest
 * cron granularity — matched to the lease TTL so an expired lease is recovered
 * within roughly one TTL window.
 */
export const EXECUTION_SWEEP_CRON = "* * * * *";

/**
 * Review-iteration budget (ADR-0002 E6): blocking findings may drive up to this
 * many review iterations for a task before the loop is exhausted and escalated.
 * Independent of the execution retry budget — the two counters never conflate,
 * and a review-driven revision starts a new execution with a full retry budget.
 */
export const MAX_REVIEW_ITERATIONS = 3;

/**
 * How long a dispatched review may go without reporting before recovery treats
 * its run as dead and re-dispatches it. A review holds no lease — nothing else
 * would ever free it — so this deadline is the only thing that keeps a stalled
 * reviewer from stranding the loop. Matched to the execution claim deadline.
 */
export const REVIEW_RESPONSE_DEADLINE_MS = EXECUTION_CLAIM_DEADLINE_MS;

/**
 * How many times a single review may be dispatched before an unresponsive
 * reviewer is escalated instead of re-dispatched. Bounded for the same reason the
 * retry budget is: automated recovery that never gives up is a stall, not
 * recovery.
 */
export const MAX_REVIEW_DISPATCH_ATTEMPTS = 3;

/**
 * Review policy applied to a manually dispatched agent execution when the caller
 * does not specify one (ADR-0002 E1, D-E2).
 */
export const DEFAULT_REVIEW_POLICY = "basic";

/**
 * Review lifecycle event names, emitted from the review service (ADR-0002 E3).
 * One event per accepted transition; none are emitted for a no-op callback.
 */
export const REVIEW_EVENT_TYPE = {
  started: "review.started",
  findingRecorded: "review.finding_recorded",
  passed: "review.passed",
  changesRequested: "review.changes_requested",
  escalated: "review.escalated",
} as const;

/**
 * How many events the in-memory timeline retains. The feed cannot serve more
 * than this, which is why it is also the upper bound the events endpoint
 * accepts: a caller asking for more is asking for something the store can never
 * answer, and answering it anyway would under-deliver silently.
 */
export const EVENT_BUFFER_SIZE = 200;

/** Events returned by `GET /api/dev-hq/events` when the caller states no limit. */
export const EVENT_FEED_DEFAULT_LIMIT = 20;

/**
 * Escalation lifecycle event names, emitted from the service layer (ADR-0002 E2/E3).
 */
export const ESCALATION_EVENT_TYPE = {
  raised: "escalation.raised",
  resolved: "escalation.resolved",
} as const;

/**
 * Recorded when a flow's conditional `Task.status` write was refused by its
 * precondition (ARCH-02). The refusal is the correct outcome — another
 * orchestrator's decision stands — but a workflow that finalizes while the task
 * keeps a different status is a divergence, and an unrecorded divergence is
 * indistinguishable from one that never happened.
 */
export const TASK_STATUS_REFUSED_EVENT_TYPE = "task.status_write_refused";

/** Base URL for Trigger.dev worker callbacks into the Next.js dev store. */
export function getDevHqBaseUrl(): string {
  return process.env.DEV_HQ_BASE_URL ?? "http://127.0.0.1:3000";
}

export { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";
