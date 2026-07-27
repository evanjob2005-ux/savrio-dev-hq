// Test-only fixture. Introduced by P-1 for the characterization and
// negative-control tests, and carried forward by P-2 onto the split workflow.
//
// It represents the Trigger.dev platform behaviour that Dev HQ's decision path
// depends on, so the conditions that defeated the old design stay expressible at
// the service boundary without a real Development execution.
//
// EMPIRICALLY ESTABLISHED (V-2 Step 1B, Development environment only):
//
//   1. Abrupt loss of the Development CLI cancels a run within about one second,
//      with the platform error "Dev session ended (CLI exited)".
//   2. wait.completeToken against an already-cancelled run returned
//      { success: true } and produced NO continuation. It did not throw.
//
// Fact 2 is why the wait-token design was removed: it made "the provider call
// returned" indistinguishable from "the workflow advanced". Production source no
// longer calls any wait.* primitive, so this fixture no longer models one — the
// fact is recorded here because it is the reason the design changed, not because
// anything still exercises it.
//
// Fact 1 is still modelled, and still matters: under the split workflow a run can
// still die, and the tests assert that a dead run 1 is now harmless.
//
// The continuation failure modes below are MODELLED, not empirical. No claim is
// made that Trigger.dev behaves any particular way when a continuation cannot be
// dispatched; they exist so the service's own classification of a non-confirming
// attempt is testable. Nothing here is production code, and nothing here is
// imported by production source.

/** Platform error recorded when the Development CLI goes away. */
export const DEV_SESSION_ENDED = "Dev session ended (CLI exited)";

export type FakeRunStatus =
  | "executing"
  | "suspended"
  | "cancelled"
  | "completed";

/** A continuation run that actually started. Absent when nothing was dispatched. */
export interface FakeContinuation {
  runId: string;
  payload: unknown;
  idempotencyKey: string | null;
}

/** Every continuation dispatch attempt, with what the caller was told. */
export interface FakeContinuationCall {
  payload: unknown;
  idempotencyKey: string | null;
  outcome: "started" | "reused" | "no_run_id" | "typed_failure" | "threw";
}

/**
 * How the next continuation dispatch behaves.
 *
 * - `start`         — a run is created and returned.
 * - `no_run_id`     — the call returns, carrying nothing that identifies a run.
 * - `typed_failure` — the call returns an explicit failure result.
 * - `throw`         — the call does not come back at all.
 */
export type FakeContinuationBehaviour =
  | "start"
  | "no_run_id"
  | "typed_failure"
  | "throw";

export class FakeTriggerPlatform {
  private readonly runs = new Map<string, FakeRunStatus>();
  private readonly runErrors = new Map<string, string>();
  /** Continuation runs already created for an idempotency key. */
  private readonly keyedRuns = new Map<string, string>();
  private continuationSeq = 0;

  /** How the next continuation dispatch behaves. */
  continuationBehaviour: FakeContinuationBehaviour = "start";

  /** Every continuation that actually started. */
  readonly continuations: FakeContinuation[] = [];
  /** Every continuation dispatch attempt, started or not. */
  readonly continuationCalls: FakeContinuationCall[] = [];

  /** The workflow run is triggered and begins executing. */
  startRun(runId: string): { id: string } {
    this.runs.set(runId, "executing");
    return { id: runId };
  }

  /** Run 1 reaches the approval gate and ends normally. This is the split. */
  completeRun(runId: string): void {
    this.runs.set(runId, "completed");
  }

  /** Fact 1: the Development CLI exits and the run is cancelled. */
  endDevSession(runId: string): void {
    this.runs.set(runId, "cancelled");
    this.runErrors.set(runId, DEV_SESSION_ENDED);
  }

  statusOf(runId: string): FakeRunStatus | null {
    return this.runs.get(runId) ?? null;
  }

  errorOf(runId: string): string | null {
    return this.runErrors.get(runId) ?? null;
  }

  /**
   * Models tasks.trigger for the continuation task.
   *
   * An idempotency key that has already produced a run resolves to that same run
   * and creates no second one, which is how "exactly one continuation" is
   * observable here rather than merely asserted.
   */
  async triggerContinuation(
    payload: unknown,
    options?: { idempotencyKey?: string },
  ): Promise<{ id: string } | { ok: false; error: string }> {
    const idempotencyKey = options?.idempotencyKey ?? null;

    if (idempotencyKey) {
      const existing = this.keyedRuns.get(idempotencyKey);
      if (existing) {
        this.continuationCalls.push({
          payload,
          idempotencyKey,
          outcome: "reused",
        });
        return { id: existing };
      }
    }

    if (this.continuationBehaviour === "throw") {
      this.continuationCalls.push({ payload, idempotencyKey, outcome: "threw" });
      throw new Error(DEV_SESSION_ENDED);
    }

    if (this.continuationBehaviour === "typed_failure") {
      this.continuationCalls.push({
        payload,
        idempotencyKey,
        outcome: "typed_failure",
      });
      return { ok: false, error: "No worker is available to run the continuation." };
    }

    if (this.continuationBehaviour === "no_run_id") {
      this.continuationCalls.push({
        payload,
        idempotencyKey,
        outcome: "no_run_id",
      });
      return { id: "" };
    }

    this.continuationSeq += 1;
    const runId = `run_continuation_${this.continuationSeq}`;
    this.runs.set(runId, "executing");
    if (idempotencyKey) this.keyedRuns.set(idempotencyKey, runId);
    this.continuations.push({ runId, payload, idempotencyKey });
    this.continuationCalls.push({ payload, idempotencyKey, outcome: "started" });
    return { id: runId };
  }
}
