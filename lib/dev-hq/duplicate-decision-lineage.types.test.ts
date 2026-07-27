// P-1 D-5: type-level characterization of duplicate-decision handling and run
// lineage. No runtime behaviour is exercised; the assertions are discharged by
// `npx tsc --noEmit`, and the `it` bodies exist so the runner reports them.
//
// Every type declared here is local to this test file. None is exported into
// production, and none is a P-2 design proposal — each states what the current
// types CANNOT express, which is a finding, not a plan.

import { describe, expect, it } from "vitest";

import type {
  approveFounderRequest,
  rejectFounderRequest,
} from "@/lib/dev-hq/founder-request-service";
import type { DevHqState } from "@/lib/dev-hq/types";
import type {
  Approval,
  IsoTimestamp,
  WorkflowDecision,
  WorkflowRunRecord,
} from "@/types/domain";

/** Compile-time exact type equality. */
type Equals<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

/**
 * Fails to compile unless the argument type is exactly `true`. The runtime check
 * is redundant with the type constraint and exists only so the parameter is used.
 */
function expectType<T extends true>(assertion: T): void {
  if (assertion !== true) {
    throw new Error("type-level assertion did not hold");
  }
}

// ---------------------------------------------------------------------------
// Duplicate decisions
// ---------------------------------------------------------------------------

type ApproveResult = Awaited<ReturnType<typeof approveFounderRequest>>;
type RejectResult = Awaited<ReturnType<typeof rejectFounderRequest>>;

/**
 * What duplicate-decision handling WOULD require the decision surface to return.
 * Characterization only: a caller cannot currently distinguish any of these.
 */
type DecisionApplication =
  | { kind: "applied"; decision: WorkflowDecision }
  | { kind: "already_decided"; existing: WorkflowDecision }
  | { kind: "refused"; reason: "run_not_resumable" };

/**
 * What run lineage WOULD require: an ordered, non-empty history of attempts,
 * rather than one nullable id.
 */
interface RunAttempt {
  runId: string;
  startedAt: IsoTimestamp;
  outcome: "executing" | "suspended" | "cancelled" | "completed";
}

type RunLineage = readonly [RunAttempt, ...RunAttempt[]];

type LineageBearingRun = WorkflowRunRecord & { runLineage: RunLineage };

describe("duplicate-decision handling, at the type level", () => {
  it("returns the whole read model, so a first decision and a duplicate are indistinguishable", () => {
    // Both decision entry points return the Mission Control snapshot and nothing
    // about what the call actually did.
    expectType<Equals<ApproveResult, DevHqState>>(true);
    expectType<Equals<RejectResult, DevHqState>>(true);

    // Consequently the result type carries no outcome discriminant at all.
    expectType<Equals<Extract<ApproveResult, { kind: unknown }>, never>>(true);
    expectType<
      Equals<Extract<ApproveResult, DecisionApplication>, never>
    >(true);

    // Nor is DevHqState assignable to any of the outcomes a duplicate-safe
    // surface would have to report.
    expectType<
      Equals<DevHqState extends DecisionApplication ? true : false, false>
    >(true);

    expect(true).toBe(true);
  });

  it("carries no idempotency or already-decided marker on the Approval record", () => {
    // Approval records status, who decided, and when. It records nothing about
    // how many times a decision was applied, nor which run the decision was
    // applied to, so a replayed decision is not representable as distinct.
    expectType<Equals<Approval["decidedAt"], IsoTimestamp | null>>(true);
    expectType<Equals<Extract<keyof Approval, "decisionCount">, never>>(true);
    expectType<Equals<Extract<keyof Approval, "appliedToRunId">, never>>(true);
    expectType<Equals<Extract<keyof Approval, "idempotencyKey">, never>>(true);

    expect(true).toBe(true);
  });
});

describe("run lineage, at the type level", () => {
  it("cannot represent more than one run per workflow record", () => {
    expectType<Equals<WorkflowRunRecord["triggerRunId"], string | null>>(true);

    // The current field admits no array, tuple, or attempt record.
    expectType<
      Equals<
        Extract<WorkflowRunRecord["triggerRunId"], readonly unknown[]>,
        never
      >
    >(true);
    expectType<
      Equals<Extract<WorkflowRunRecord["triggerRunId"], RunAttempt>, never>
    >(true);

    // And there is no lineage-shaped field on the record today.
    expectType<
      Equals<Extract<keyof WorkflowRunRecord, "runLineage">, never>
    >(true);
    expectType<
      Equals<Extract<keyof WorkflowRunRecord, "runAttempts">, never>
    >(true);

    expect(true).toBe(true);
  });

  it("would require a strict widening of the record to carry a lineage", () => {
    // A lineage-bearing record still satisfies today's contract, so adding one is
    // additive; but today's record cannot satisfy a lineage-bearing contract.
    expectType<
      Equals<LineageBearingRun extends WorkflowRunRecord ? true : false, true>
    >(true);
    expectType<
      Equals<WorkflowRunRecord extends LineageBearingRun ? true : false, false>
    >(true);

    // The lineage must be non-empty by construction: an empty history is not a
    // valid state for a record that exists because a run was triggered.
    expectType<Equals<readonly [] extends RunLineage ? true : false, false>>(
      true,
    );
    expectType<
      Equals<readonly [RunAttempt] extends RunLineage ? true : false, true>
    >(true);

    expect(true).toBe(true);
  });
});
