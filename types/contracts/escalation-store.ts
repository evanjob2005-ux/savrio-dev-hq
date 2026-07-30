import type { Escalation, EscalationResolution, IsoTimestamp } from "@/types/domain";

export interface CreateEscalationInput {
  origin: Escalation["origin"];
  taskId: string;
  executionId?: string | null;
  reviewId?: string | null;
  summary: string;
  raisedByAgentId?: string | null;
  /** Stamped as raisedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

export interface ResolveEscalationInput {
  escalationId: string;
  resolution: EscalationResolution;
  /** Stamped as resolvedAt. Defaults to the time of the call. */
  at?: IsoTimestamp;
}

export interface ReserveRevisionExecutionInput {
  escalationId: string;
  /** The canonical execution id to reserve. Opaque to the store. */
  executionId: string;
}

export interface EscalationStore {
  listOpen(): Promise<Escalation[]>;
  getEscalation(id: string): Promise<Escalation | null>;
  /** Newest open escalation for an execution, or null. Used for the queue. */
  findOpenByExecution(executionId: string): Promise<Escalation | null>;
  /**
   * The escalation for an execution **of a given origin**, regardless of status,
   * or null. Used by the self-healing sweeps to skip work that already escalated
   * (open or resolved).
   *
   * `origin` is required, not optional. `createEscalation` dedupes per
   * (execution, origin), so (execution, origin) — not execution alone — is the
   * identity of an escalation, and a lookup that omits it is asking a question no
   * writer answers. The origin-agnostic form was a live hazard the moment
   * `queue_stalled` was added: an execution can legitimately carry a
   * `queue_stalled` escalation and then, once capacity returns, genuinely exhaust
   * its retry budget. A backstop asking "has this execution escalated at all?"
   * finds the stall, skips the exhaustion, and the founder is never told about
   * the real failure. Making the parameter required means that question can no
   * longer be asked by omission.
   */
  findByExecution(
    executionId: string,
    origin: Escalation["origin"],
  ): Promise<Escalation | null>;
  createEscalation(input: CreateEscalationInput): Promise<Escalation>;
  /**
   * Resolves only if the escalation is still open, returning null when it is
   * missing or already resolved. The service uses this for idempotent resolution.
   */
  resolveEscalation(input: ResolveEscalationInput): Promise<Escalation | null>;
  /**
   * Atomically reserve the canonical revision execution id, only if it is unset.
   * Returns the reserved id: the supplied value when this call won the
   * reservation, the already-persisted value otherwise. Never overwrites, so
   * every concurrent caller receives the same id. The id is opaque to the store.
   * Throws when the escalation does not exist.
   */
  reserveRevisionExecution(
    input: ReserveRevisionExecutionInput,
  ): Promise<string>;
}
