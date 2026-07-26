import type { EntityId, IsoTimestamp } from "./common";

/** Why an escalation was raised (ADR-0002 E2). Review exhaustion arrives in 1E-7. */
export type EscalationOrigin = "retry_exhausted" | "review_exhausted";

export type EscalationStatus = "open" | "resolved";

/** Founder resolution actions (ADR-0002 D-E1). */
export type EscalationResolution = "revise" | "abandon" | "accept";

/**
 * A founder escalation raised when automated recovery is exhausted. A first-class
 * concept, distinct from founder-request approvals, so the approval queue and its
 * wait-token invariant stay clean (ADR-0002 E2/D-E7).
 */
export interface Escalation {
  id: EntityId;
  origin: EscalationOrigin;
  taskId: EntityId;
  executionId: EntityId | null;
  reviewId: EntityId | null;
  summary: string;
  status: EscalationStatus;
  resolution: EscalationResolution | null;
  raisedByAgentId: EntityId | null;
  raisedAt: IsoTimestamp;
  resolvedAt: IsoTimestamp | null;
  /**
   * The single canonical Execution a `revise` resolution authorized, or null
   * before/without a revise. Reserved atomically *before* that execution is
   * created, so a creation failure can neither strand an unlinked execution nor
   * permit a second one on replay. This field — not evidence — is the revise
   * idempotency boundary (Task 1E-5). Treat the value as an opaque execution id.
   */
  revisionExecutionId: EntityId | null;
}
