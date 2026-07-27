// P-1 D-5, carried onto P-2's types. No runtime behaviour is exercised; the
// assertions are discharged by `npx tsc --noEmit`, and the `it` bodies exist so
// the runner reports them.
//
// P-1 stated what the types could NOT express. Each of those statements is kept
// here and either still holds — because P-2 did not widen that surface — or is
// replaced by the positive statement of what now can be expressed. Nothing was
// dropped to make the file pass.

import { describe, expect, it } from "vitest";

import type {
  approveFounderRequest,
  rejectFounderRequest,
} from "@/lib/dev-hq/founder-request-service";
import type { DevHqState } from "@/lib/dev-hq/types";
import type { WorkflowRunPatch } from "@/types/contracts";
import type {
  Approval,
  ContinuationState,
  IsoTimestamp,
  RunLineageEntry,
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
 * What P-1 said duplicate-decision handling WOULD require the decision surface to
 * return. Kept verbatim: it is still not what the entry points return, and the
 * assertions below still say so. P-2 answered the requirement on the records
 * rather than in the return type, so the caller still gets the read model — and
 * the read model now carries the distinction the return type does not.
 */
type DecisionApplication =
  | { kind: "applied"; decision: WorkflowDecision }
  | { kind: "already_decided"; existing: WorkflowDecision }
  | { kind: "refused"; reason: "run_not_resumable" };

describe("duplicate-decision handling, at the type level", () => {
  it("still returns the whole read model, so the call itself reports no outcome", () => {
    expectType<Equals<ApproveResult, DevHqState>>(true);
    expectType<Equals<RejectResult, DevHqState>>(true);

    // The result type still carries no outcome discriminant at all.
    expectType<Equals<Extract<ApproveResult, { kind: unknown }>, never>>(true);
    expectType<
      Equals<Extract<ApproveResult, DecisionApplication>, never>
    >(true);
    expectType<
      Equals<DevHqState extends DecisionApplication ? true : false, false>
    >(true);

    expect(true).toBe(true);
  });

  it("distinguishes a decision from its effect on the Approval record", () => {
    // P-1's finding was that Approval recorded status, who decided, and when, and
    // nothing about whether the decision had taken effect — so a decision that
    // advanced nothing was not representable as distinct from one that did.
    // These two fields are what make it representable, and they are separate
    // fields on purpose: what was decided and whether it took effect are
    // orthogonal, and collapsing them into one enum is what produced the defect.
    expectType<Equals<Approval["decision"], WorkflowDecision | null>>(true);
    expectType<Equals<Approval["continuation"], ContinuationState>>(true);
    expectType<
      Equals<
        ContinuationState,
        "not_attempted" | "confirmed" | "unconfirmed" | "failed"
      >
    >(true);

    // Neither field is assignable to the other, so no code can drift into
    // treating a recorded decision as a confirmed continuation.
    expectType<
      Equals<ContinuationState extends WorkflowDecision ? true : false, false>
    >(true);
    expectType<
      Equals<WorkflowDecision extends ContinuationState ? true : false, false>
    >(true);

    expect(true).toBe(true);
  });

  it("still carries no idempotency or per-application counter on the Approval record", () => {
    // Unchanged from P-1, and deliberately so: exactly one continuation exists
    // per execution, enforced at the point of dispatch, so there is nothing for a
    // counter on the record to count.
    expectType<Equals<Approval["decidedAt"], IsoTimestamp | null>>(true);
    expectType<Equals<Extract<keyof Approval, "decisionCount">, never>>(true);
    expectType<Equals<Extract<keyof Approval, "appliedToRunId">, never>>(true);
    expectType<Equals<Extract<keyof Approval, "idempotencyKey">, never>>(true);

    expect(true).toBe(true);
  });
});

describe("run lineage, at the type level", () => {
  it("keeps each run-id field single-valued and adds a lineage beside them", () => {
    // P-1's assertions about the field itself are unchanged: it is still one
    // nullable string, and it still admits no array or attempt record. The
    // lineage is a separate field, not a widening of this one.
    expectType<Equals<WorkflowRunRecord["triggerRunId"], string | null>>(true);
    expectType<Equals<WorkflowRunRecord["continuationRunId"], string | null>>(
      true,
    );
    expectType<
      Equals<
        Extract<WorkflowRunRecord["triggerRunId"], readonly unknown[]>,
        never
      >
    >(true);
    expectType<
      Equals<Extract<WorkflowRunRecord["triggerRunId"], RunLineageEntry>, never>
    >(true);

    // P-1 recorded that no lineage-shaped field existed. One does now.
    expectType<Equals<Extract<keyof WorkflowRunRecord, "runLineage">, "runLineage">>(
      true,
    );
    expectType<Equals<WorkflowRunRecord["runLineage"], RunLineageEntry[]>>(true);
    expectType<Equals<Extract<keyof WorkflowRunRecord, "runAttempts">, never>>(
      true,
    );

    expect(true).toBe(true);
  });

  it("names the record each run id was written to, because two records hold one", () => {
    // The limitation P-1 recorded was specifically that two DIFFERENT records
    // each hold a single-valued triggerRunId. An entry that did not say which
    // record it came from would not address that.
    expectType<
      Equals<RunLineageEntry["record"], "execution" | "workflow_run">
    >(true);
    expectType<Equals<RunLineageEntry["role"], "initial" | "continuation">>(
      true,
    );
    expectType<Equals<RunLineageEntry["runId"], string>>(true);
    expectType<Equals<RunLineageEntry["recordedAt"], IsoTimestamp>>(true);

    expect(true).toBe(true);
  });

  it("does not let the lineage be patched, so history cannot be rewritten", () => {
    expectType<Equals<Extract<keyof WorkflowRunPatch, "runLineage">, never>>(
      true,
    );
    // The run-id fields themselves stay patchable. An overwrite was never the
    // defect; losing what it displaced was, and the lineage is where that is kept.
    expectType<Equals<Extract<keyof WorkflowRunPatch, "triggerRunId">, "triggerRunId">>(
      true,
    );

    expect(true).toBe(true);
  });
});
