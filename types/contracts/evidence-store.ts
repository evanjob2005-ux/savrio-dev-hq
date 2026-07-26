import type { Evidence } from "@/types/domain";

export interface CreateEvidenceInput {
  /** Optional: omit or pass null for evidence not tied to a specific execution. */
  executionId?: string | null;
  taskId: string;
  kind: Evidence["kind"];
  label: string;
  summary: string;
  uri?: string | null;
  createdByAgentId?: string | null;
}

export interface EnsureEvidenceInput extends CreateEvidenceInput {
  /**
   * The logical identity of this evidence. Required, unlike on
   * `CreateEvidenceInput`: it is the key the create-or-get is performed under,
   * so there is nothing to converge on without it.
   */
  uri: string;
}

export interface EvidenceStore {
  listForTask(taskId: string): Promise<Evidence[]>;
  listForExecution(executionId: string): Promise<Evidence[]>;

  /**
   * Append an evidence row unconditionally. The append-only audit write: two
   * calls produce two rows, which is correct for records that are genuinely
   * per-occurrence (a lease reclaim, say) rather than per-fact.
   */
  addEvidence(input: CreateEvidenceInput): Promise<Evidence>;

  /**
   * Create the evidence for `uri`, or return the row already recorded there.
   *
   * The keyed create-or-get, matching the keyed event (`dedupeKey`) and keyed
   * `ReviewFinding` (`(reviewId, ref)`) patterns: the check and the insert are
   * one indivisible step, so concurrent callers converge on a single row instead
   * of both passing a read and both appending. Use this — never a read-then-write
   * check in a service — wherever one evidence row per logical fact is the
   * invariant.
   *
   * Idempotent and stable: replays, reconciliation sweeps, and the loser of a
   * race all receive the same row, so anything that stored its id (a
   * `ReviewFinding.evidenceId`, for one) still resolves.
   *
   * Append-only is part of the contract: an existing row is returned *unchanged*
   * — never re-labelled, re-summarized, or re-stamped — so the audit trail an
   * outcome was derived from cannot be rewritten by a later caller (ADR-0002 E4).
   *
   * A durable adapter must implement this as a unique constraint on the uri with
   * an insert-on-conflict-do-nothing, not a read-then-write: single-process
   * atomicity is what the in-memory adapter can offer, not what the contract
   * means (ADR-0001 D7).
   */
  ensureEvidence(input: EnsureEvidenceInput): Promise<Evidence>;

  getEvidence(id: string): Promise<Evidence | null>;
}
