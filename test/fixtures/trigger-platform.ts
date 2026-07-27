// Test-only fixture added by P-1 (characterization and negative-control tests).
//
// It represents the Trigger.dev platform behaviour that Dev HQ's approve path
// depends on, so the terminal-run condition is expressible at the service
// boundary without a real Development execution.
//
// It models exactly two empirically established facts (V-2 Step 1B, Development
// environment only) and invents nothing else:
//
//   1. Abrupt loss of the Development CLI cancels a run suspended at
//      wait.forToken within about one second, with the platform error
//      "Dev session ended (CLI exited)".
//   2. wait.completeToken against an already-cancelled run returns
//      { success: true } and produces NO continuation. It does not throw.
//
// Fact 2 is the false-success semantic the approve path's correctness argument
// depends on being absent. Nothing here is production code, and nothing here is
// imported by production source.

/** Platform error recorded when the Development CLI goes away. */
export const DEV_SESSION_ENDED = "Dev session ended (CLI exited)";

export type FakeRunStatus =
  | "executing"
  | "suspended"
  | "cancelled"
  | "completed";

/** A run actually resuming from its waitpoint. Absent when the run is dead. */
export interface FakeContinuation {
  tokenId: string;
  runId: string;
  payload: unknown;
}

export interface FakeCompleteTokenCall {
  tokenId: string;
  payload: unknown;
  /** Status of the target run at the moment the call was made. */
  runStatusAtCall: FakeRunStatus | null;
  /** What the caller was told. */
  result: { success: boolean };
}

export class FakeTriggerPlatform {
  private readonly runs = new Map<string, FakeRunStatus>();
  private readonly runErrors = new Map<string, string>();
  private readonly tokenRuns = new Map<string, string>();

  /** Every resume that actually happened. */
  readonly continuations: FakeContinuation[] = [];
  /** Every completion attempt, with the run status it really met. */
  readonly completeTokenCalls: FakeCompleteTokenCall[] = [];

  /** The workflow run is triggered and begins executing. */
  startRun(runId: string): { id: string } {
    this.runs.set(runId, "executing");
    return { id: runId };
  }

  /** The run reaches wait.forToken and suspends on `tokenId`. */
  suspendAtToken(runId: string, tokenId: string): void {
    this.runs.set(runId, "suspended");
    this.tokenRuns.set(tokenId, runId);
  }

  /** Fact 1: the Development CLI exits and the suspended run is cancelled. */
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
   * Fact 2. Reports success regardless of whether anything resumed.
   *
   * A suspended run resumes and records a continuation. A cancelled run resumes
   * nothing, records no continuation, and the caller is still told success. That
   * asymmetry — success without continuation — is what P-1 characterizes.
   */
  async completeToken(
    tokenId: string,
    payload: unknown,
  ): Promise<{ success: boolean }> {
    const runId = this.tokenRuns.get(tokenId) ?? null;
    const runStatusAtCall = runId ? this.statusOf(runId) : null;
    const result = { success: true };

    if (runId && runStatusAtCall === "suspended") {
      this.runs.set(runId, "executing");
      this.continuations.push({ tokenId, runId, payload });
    }

    this.completeTokenCalls.push({
      tokenId,
      payload,
      runStatusAtCall,
      result,
    });
    return result;
  }
}
