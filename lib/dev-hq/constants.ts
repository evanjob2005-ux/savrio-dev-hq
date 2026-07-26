/** Dev HQ founder-request workflow identifier. */
export const FOUNDER_REQUEST_WORKFLOW_ID = "wf-founder-request";

export const EXECUTIVE_ORCHESTRATOR_AGENT_ID = "agent-executive-orchestrator";
export const FOUNDER_USER_ID = "user-evan";

export const DEV_HQ_ACTORS = {
  founderUserId: FOUNDER_USER_ID,
  executiveAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
} as const;

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
 * Typed execution lifecycle event names emitted from the service layer
 * (ADR-0002 E3). No event is emitted per heartbeat. `reclaimed` is emitted by the
 * Sprint 1E-3 lease sweeper when it recovers an expired-lease attempt.
 */
export const EXECUTION_EVENT_TYPE = {
  assigned: "execution.assigned",
  claimed: "execution.claimed",
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
 * Escalation lifecycle event names, emitted from the service layer (ADR-0002 E2/E3).
 */
export const ESCALATION_EVENT_TYPE = {
  raised: "escalation.raised",
  resolved: "escalation.resolved",
} as const;

/** Base URL for Trigger.dev worker callbacks into the Next.js dev store. */
export function getDevHqBaseUrl(): string {
  return process.env.DEV_HQ_BASE_URL ?? "http://127.0.0.1:3000";
}

export { DEV_HQ_INTERNAL_TOKEN_HEADER } from "@/lib/dev-hq/internal-guard";
