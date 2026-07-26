# Independent Code Review Report — Sprint 1E Baseline

**Template:** TMP-005 (`templates/CODE_REVIEW_REPORT.md`)

---

# Review Information

## Review ID

CR-001

---

## Feature or Change

Sprint 1E — Reliability, Evidence, Review Loops & Audit. The durable review
subsystem and the reliability work around the Sprint 1D execution spine:
lifecycle events and evidence, callback idempotency, the scheduled stale-lease
sweeper, agent health freshness, first-class escalations, the deterministic
review and revision loop with bounded reviewer liveness, the `PublicReview`
read-model projection, and URI-keyed atomic evidence creation.

---

## Reviewer

Independent Code Reviewer Agent (AGENT-008)

---

## Date

2026-07-26

---

## Baseline Under Review

**Branch:** `feature/sprint-1d-execution-manager`
**HEAD at review:** `d8b169d10bbada031e46a69b2d06104656e28ef9`
**Working tree:** clean; no reviewed source file uncommitted.

---

## Related Documents

- `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md`
- `docs/decisions/ADR-0002-review-escalation-and-work-management.md`
- `docs/plans/SPRINT_1E_REVIEW_AND_RELIABILITY.md` (TMP-002, technical plan)
- `standards/CODE_REVIEW_STANDARD.md`
- `docs/company/GOVERNANCE.md` (GOV-001)
- `AGENTS.md` (AGENT-001)

---

# Executive Summary

**Overall assessment.** The Sprint 1E baseline is sound. All three required
validations pass with reproduced output. Both blockers found in the prior review
round are fixed, and each fix was verified independently rather than accepted on
the strength of the previous report — including an empirical `tsc` proof that the
`PublicReview` compile-time guard rejects a raw `Review`, with a control case
proving a bare `Omit` would not have.

**Major findings.** No blockers. Four confirmed defects, all quality or
documentation-accuracy issues on paths that behave correctly; five plausible
risks, of which the most significant are latent rather than live. The
highest-priority item is follow-up #1: the review callback token is minted from a
non-cryptographic, predictable generator. It is not blocking because the token is
a second gate behind a guard that fails closed and returns 403 in production, but
it must be fixed before this subsystem runs anywhere other than a developer
machine.

**Recommendation.** Approved for commit as it stands.

---

# Scope of Review

## In scope

The Sprint 1E implementation baseline, principally commit `0e9b08a`
("feat(dev-hq): complete durable review reliability", 28 files, +4321/−32),
together with the Sprint 1E commits preceding it:

| Commit | Description |
| --- | --- |
| `94aad7a` | 1E-1 execution events and evidence |
| `854e354` | 1E-2 callback idempotency |
| `152e547` | 1E-3 scheduled lease sweeper |
| `e43383a` | 1E-4 agent health from heartbeat freshness |
| `395e778` | 1E-5 escalations |
| `a7fb068` | durable execution lifecycle deduplication |
| `0e9b08a` | 1E-6 durable review reliability |

Focus surface: `lib/dev-hq/**`, `app/api/dev-hq/**`, `types/**`, `trigger/**`.
Backend, API, and tests. No frontend surface exists in this work.

## Out of scope

`8310bbb`, `f6caf4c`, `2c76612`, `d8b169d` — agent registration and governance
documentation. Treated as context, not reviewed as implementation.

Sprint 1E tasks 1E-8, 1E-9, and 1E-10 (execution timeline read-model, Mission
Control data exposure, validation and completion notes) were not assessed.

## Founder scope decisions bounding this review

- The durable review service, callback route, review-liveness recovery,
  revision-chain tracking, and policy-neutral Execution Manager persistence are
  authorized as Sprint 1E-6 reliability completion.
- Sprint 1E-7 (operator-facing `reviewPolicy` override in the internal dispatch
  route and the server action / Simulation Lab) is deferred. Its absence is the
  approved state and is not a defect. This review verified only that it is
  genuinely absent rather than partially present.
- The `reviewer_unresponsive` mechanism is approved as an implementation of
  existing bounded-recovery requirements. It is not treated as a new escalation
  origin and requires no ADR amendment.

---

# Evidence Inspected

## Implementation, read in full

`lib/dev-hq/review-service.ts` (779 lines) · `lib/dev-hq/review-projection.ts` ·
`lib/dev-hq/adapters/dev-review-store.ts` ·
`lib/dev-hq/adapters/dev-evidence-store.ts` · `lib/dev-hq/store.ts` ·
`lib/dev-hq/types.ts` · `lib/dev-hq/constants.ts` ·
`lib/dev-hq/escalation-service.ts` · `lib/dev-hq/agent-execution-service.ts`
(1035 lines) · `lib/dev-hq/execution-manager.ts` (lines 200–400) ·
`lib/dev-hq/internal-guard.ts` · `lib/dev-hq/internal-headers.ts` ·
`lib/dev-hq/id.ts` · `lib/dev-hq/adapters/dev-state-reader.ts` ·
`lib/dev-hq/adapters/index.ts` · `lib/dev-hq/actions.ts` ·
`types/domain/review.ts` · `types/domain/execution.ts` ·
`types/contracts/review-store.ts` · `types/contracts/evidence-store.ts` ·
`app/api/dev-hq/internal/review/complete/route.ts` ·
`app/api/dev-hq/internal/execution/reclaim/route.ts` ·
`app/api/dev-hq/internal/execution/dispatch/route.ts` ·
`app/api/dev-hq/state/route.ts` · `trigger/agent-review.ts` ·
`trigger/execution-sweeper.ts`

## Tests, read in full

`lib/dev-hq/review-service.test.ts` (1559 lines) ·
`lib/dev-hq/review-scope.test.ts` ·
`lib/dev-hq/adapters/dev-review-store.test.ts` ·
`lib/dev-hq/adapters/dev-evidence-store.test.ts` ·
`app/api/dev-hq/state/route.test.ts` ·
`app/api/dev-hq/internal/review/complete/route.test.ts` · plus the `0e9b08a`
diff hunks in `escalation-service.test.ts` and `agent-execution-service.test.ts`

## Governance read before asserting any architectural claim

`AGENTS.md` · `agents/independent-code-reviewer/AGENT.md` ·
`standards/CODE_REVIEW_STANDARD.md` · `standards/SECURITY_STANDARD.md` ·
`standards/OBSERVABILITY_STANDARD.md` · `standards/GIT_STANDARD.md` ·
`docs/decisions/ADR-0001-execution-manager-and-agent-registry.md` ·
`docs/decisions/ADR-0002-review-escalation-and-work-management.md`

---

# Validation Performed

Real commands, real output. Nothing claimed that was not run.

## `npx vitest run` — exit 0

```
 RUN  v4.1.10 C:/Users/evanj/Documents/Projects/savrio-dev-hq

 Test Files  22 passed (22)
      Tests  317 passed (317)
   Start at  03:29:53
   Duration  1.35s (transform 3.37s, setup 0ms, import 8.18s, tests 620ms, environment 6ms)
```

## `npx tsc --noEmit` — exit 0

No diagnostics emitted.

## `npx eslint .` — exit 0

No diagnostics emitted.

## Independent verification of the compile-time projection guard

The claim that the `PublicReview` guard works was not accepted from the code
comment. The type construct was reproduced in an isolated file and compiled
against the project's own `tsc --strict`. Real output:

```
guard.ts(14,7): error TS2322: Type 'Review' is not assignable to type 'PublicReview'.
  Type 'Review' is not assignable to type '{ callbackToken?: undefined; }'.
guard.ts(17,7): error TS2322: Type 'Review[]' is not assignable to type 'PublicReview[]'.
guard.ts(20,7): error TS2322: Type '{ id: string; callbackToken: string | null; ... }' is not assignable to type 'PublicReview'.
```

The control case in the same file — a bare `Omit<Review, ReviewSecretField>`
with no `?: never` restatement — compiled cleanly. This confirms both halves of
the claim: the `?: never` restatement is genuinely load-bearing, and a raw
`Review`, a `Review[]`, and a `{ ...review }` spread are each a hard compile
error where `PublicReview` is required. A field newly added to `Review` and
omitted from `toPublicReview` is also a compile error, so the projection cannot
silently fall behind the domain type.

## Not run by this review

`next build` was **not** run by the Independent Code Reviewer. See "What Was Not
Verified" item 3. Recorded separately for the audit trail: a production build was
executed and passed during construction of the `0e9b08a` candidate, by the Lead
Software Engineer, before that commit was created. That is a separate attestation
and is not part of this reviewer's validation.

---

# Confirmed Defects

Findings whose failing path was traced. None is blocking.

## C-1 — Callback token minted from a predictable, non-cryptographic generator

**Severity:** High (non-blocking — see justification)
**Classification:** Confirmed defect
**Location:** `lib/dev-hq/review-service.ts:352-355` → `lib/dev-hq/id.ts:1-6`

```ts
const callbackToken = await reviewStore.reserveCallbackToken({
  reviewId: review.id,
  token: nextId("rvt"),
});
```

```ts
let sequence = 0;
export function nextId(prefix: string): string {
  sequence += 1;
  return `${prefix}-${Date.now()}-${sequence}`;
}
```

The token is `rvt-<epoch-millis>-<in-process-counter>`. The system documents the
security property this value is supposed to carry —
`types/domain/review.ts:110-116`: *"The capability a callback must present to
transition this review … so a callback from a prior iteration, another review, or
an unauthorized caller cannot advance the lifecycle"* — and
`app/api/dev-hq/internal/review/complete/route.ts:41-50`: *"a callback for
another review, a superseded iteration, or a **fabricated token** cannot advance
the lifecycle even from an otherwise authenticated worker."*

**Traced.** A millisecond timestamp plus a small monotonic counter is a search
space of a few thousand candidates for an actor who knows roughly when the review
was dispatched. The claim that a fabricated token cannot advance the lifecycle
does not hold. No additional entropy exists anywhere on the path:
`reserveCallbackToken` (`dev-review-store.ts:120-133`) stores the supplied value
verbatim.

**Why not blocking.** Refutation partly succeeds. Every internal route is gated
first by `rejectInternalDevRequest` (`lib/dev-hq/internal-guard.ts:10-40`), which
returns 403 unconditionally when `NODE_ENV === "production"`, 503 when
`DEV_HQ_INTERNAL_TOKEN` is unset, and 401 on mismatch. The callback token is
strictly a second gate behind a fail-closed first gate that is disabled in
production. ADR-0002's Security section names the required control for this
surface: *"New internal routes reuse the fail-closed guard (403 prod / 503 no
token / 401 mismatch)."* The per-review token is hardening beyond what the ADR
mandated. A weakened additive layer on a path that cannot run in production is not
a data-loss or exposure event.

**Remediation:** `token: crypto.randomUUID()` or
`randomBytes(32).toString("base64url")`. One line, one place, no behavioural
change — `reserveCallbackToken` already treats the value as opaque.

## C-2 — `assignExecution` gained a `reviewPolicy` parameter with no production caller

**Severity:** Low
**Classification:** Confirmed defect
**Location:** `lib/dev-hq/execution-manager.ts:223-227, 260`

```ts
export async function assignExecution(
  taskId: string,
  policy?: AgentSelectionPolicy,
  reviewPolicy?: ReviewPolicy,
): Promise<AssignmentDecision> {
```

**Traced.** The only production call site is
`lib/dev-hq/adapters/dev-execution-runner.ts:23` —
`return manager.assignExecution(taskId, policy);` — which passes two arguments.
Every other reference is a test, and none passes a third. All
review-policy-bearing executions are created through `ensureExecution` instead.
The parameter is dead on arrival: harmless, but new untested surface added in
`0e9b08a`.

**Remediation:** remove the parameter, or wire `dev-execution-runner.ts` through
it if the intent was to make the legacy assign path policy-aware.

## C-3 — Terminal-guard comment is inaccurate for the `reviewer_unresponsive` path

**Severity:** Low (documentation correctness)
**Classification:** Confirmed defect
**Location:** `lib/dev-hq/review-service.ts:459-462`

```ts
// Recovery is unaffected — findings are made durable before the
// transition, so no resolved review can be missing them, and consequences
// stranded by a crash after the transition are repaired by `reconcileReviews`,
// which needs no callback to run.
```

**Traced.** The reasoning holds for a review resolved *by a callback* (findings
written at line 485, before `resolveReview` at line 488). It does not hold for a
review resolved by `escalateUnresponsiveReview` (lines 766-778), where no callback
ever ran and no findings were ever made durable. When the abandoned run finally
reports, the guard at line 463 discards its findings entirely.
`lib/dev-hq/review-service.test.ts:408-450` asserts exactly this, so the
*behaviour* is deliberate and tested — but a review escalated to the founder as
"the reviewer never reported" can be missing findings the reviewer did produce,
and the comment says the opposite. The founder adjudicates this escalation; the
comment should not tell a maintainer that no information was lost.

**Remediation:** narrow the comment to the callback-resolved case and state
explicitly that a sweep-escalated review deliberately discards a late run's
findings, so the audit trail cannot acquire material dated after the outcome it
purports to justify.

## C-4 — `reconcileReviews` counters can over-report work that did not happen

**Severity:** Low
**Classification:** Confirmed defect
**Location:** `lib/dev-hq/review-service.ts:723-732` and `:743-754`

**Traced.** `dispatchReview` can return `null` — a joined in-flight promise, or
`performReviewDispatch` returning early at line 349 because the review is no
longer pending — yet `result.dispatched` increments regardless. Likewise
`ensureReviewRevision` returns `null` when the reviewed execution is absent (line
607), yet `result.revisions` still increments. These figures are returned by
`app/api/dev-hq/internal/execution/reclaim/route.ts:17` and thence to the
scheduled sweeper. Loop correctness is unaffected; only the reported numbers are.
They are the sweep's only operational signal, and OBSERVABILITY_STANDARD requires
telemetry to be actionable.

**Remediation:** count from return values
(`if (await dispatchReview(...)) result.dispatched += 1`) and re-check
`revisionMissing` against post-repair state.

---

# Plausible Risks

Concerns that are real but could not be fully verified. Each records what was not
verified and what would settle it.

## P-1 — `dispatchReview` single-flight map ignores `force`

**Location:** `lib/dev-hq/review-service.ts:329-330`

`options.force` is never consulted before joining an existing promise. A sweep
force-dispatch arriving while an ordinary dispatch is in flight would receive the
non-forced promise, which returns early at line 350 without triggering a new run.

**Not verified:** no reachable interleaving could be constructed. An ordinary
dispatch originates only from `ensureReviewForExecution` (line 300), requiring a
`succeeded` execution with no dispatched review; the force path requires a review
already dispatched and past deadline. The preconditions appear mutually exclusive
within one process, and the condition self-heals on the next sweep. Recorded as a
risk because unreachability could not be proven, only not disproven.

**Remediation:** key the in-flight map on `(reviewId, force)`, or refuse to join
when `force` is set.

## P-2 — A losing concurrent caller can attach a blocking finding to a review that resolves as `passed`

**Location:** `lib/dev-hq/review-service.ts:485-492`

`recordFindings` runs before the guarded `resolveReview`. Two callers that both
observe the review pending both write findings; only one wins the transition. If
caller A reports `passed` with no findings and caller B reports
`changes_requested` with a blocking finding, B's blocking finding is durably
recorded against a review whose persisted status becomes `passed`, and no
revision is authorized.

**Refutation largely succeeds.** Both reviewer runs for one review share the same
`instructions` and `policy` (`review-service.ts:361-366`), and `simulateReview`
(lines 116-150) is a pure function of exactly those two inputs. Under ADR-0001 D4
(*"Phase 1 ships a deterministic simulated agent that performs no real AI
inference"*) the two runs cannot disagree, so the divergent-findings precondition
is unreachable in Phase 1. The existing test at `review-service.test.ts:940-959`
races `passed` against `changes_requested` but passes **no findings**, so it does
not exercise this. The risk becomes live when ADR-0002's "real AI reviewers
(Phase 2)" work lands.

**Remediation (Phase 2 owner):** move `recordFindings` after a successful
`resolveReview` and let `reconcileReviews` restore findings from the winner's
persisted outcome, or key findings to the resolving attempt.

## P-3 — Callback token travels in the Trigger.dev run payload

**Location:** `lib/dev-hq/review-service.ts:358-369`

The `0e9b08a` commit message asserts: *"That channel never reaches a browser and
is not logged."* Verified: the token is not in any `metadata.set` call
(`trigger/agent-review.ts:54-71`), not in any `eventLogger.log` message, and not
echoed in the callback response (`complete/route.ts:81-87`, asserted by
`route.test.ts:172-186`).

**Not verified:** the retention and display semantics of Trigger.dev run payloads
cannot be determined from this repository. If run payloads are rendered in the
Trigger.dev web dashboard, the token does reach a browser — a different,
separately authenticated one — and "is not logged" overstates the position
against OBSERVABILITY_STANDARD's "Never log: … Tokens". The architectural
justification for the payload channel (`review-service.ts:56-67` — the worker has
no store access) is sound; only the exposure claim is unconfirmed.

**Remediation:** confirm Trigger.dev payload visibility. If dashboard-visible,
either soften the documentation claim or have the worker fetch the token through
the already-authenticated internal channel.

## P-4 — Non-constant-time comparison of both bearer secrets

**Location:** `lib/dev-hq/review-service.ts:445`; pre-existing at
`lib/dev-hq/internal-guard.ts:32`

Practical remote timing extraction across a Next.js route is generally not
considered feasible, and no demonstration was attempted. Recorded because it
compounds C-1: a predictable token and a comparison with no timing discipline are
the same defence.

## P-5 — `ensureReviewRevision` can loop forever if the reviewed execution vanishes

**Location:** `lib/dev-hq/review-service.ts:604-607`

A `changes_requested` review whose reviewed execution is missing never acquires a
`revisionExecutionId`, so `revisionMissing` at line 743 evaluates true on every
subsequent sweep and the repair silently no-ops each time.

**Not verified as reachable:** no path deletes an execution in the in-memory store
— `saveExecution` only ever sets. Currently unreachable; a latent hazard for the
deferred Supabase adapter (ADR-0002 E9), not a live defect.

---

# Blockers

**None.**

Both blockers from the prior review round are verified fixed. Each was verified
independently rather than accepted on the strength of the previous report.

## Blocker 1 — `callbackToken` published to the browser. Fixed; the fix holds.

- The capability cannot reach a browser-readable path. `DevHqState.reviews` is
  typed `PublicReview[]` (`lib/dev-hq/types.ts:35`); `buildDevHqState` is the sole
  producer and projects at `lib/dev-hq/store.ts:162-166`;
  `DevStateReader.getState()` delegates to `buildDevHqState`;
  `getDevHqStateSnapshot` (`founder-request-service.ts:549-551`) delegates to the
  reader; `GET /api/dev-hq/state` returns that snapshot. All 21 API routes were
  enumerated and every non-test reference to `.reviews` under `components/`,
  `hooks/`, and `app/` was grepped — no component consumes reviews at all yet, and
  no route other than `/api/dev-hq/state` returns a review shape.
- The compile-time guard genuinely works, proven empirically (see Validation).
- Internal callback authorization still holds: `handleReviewComplete` reads the
  full domain `Review` and validates against the persisted `callbackToken`
  (`review-service.ts:440-447`); `route.test.ts:126-138` confirms 403 for a forged
  token with the review left `pending`.
- Shared-token-across-redispatch still holds: `reserveCallbackToken` is
  reserve-once (`dev-review-store.ts:120-133`), asserted by
  `dev-review-store.test.ts:136-151`, by `review-service.test.ts:839-858`
  (`expect(after.callbackToken).toBe(before.callbackToken)` after a forced
  re-dispatch), and by `:1306-1360` (8 racing first dispatches yield one token,
  one idempotency key, one `review.started` event).
- The runtime projection is by explicit field enumeration, not key deletion or
  spread (`review-projection.ts:29-47`), so it is safe independent of the type.
  `state/route.test.ts:104-116` asserts on the serialized response body by
  substring, so it would catch the token leaking through events or evidence, not
  only through the reviews array. That is the right assertion.

## Blocker 2 — Duplicate evidence under concurrent callbacks. Fixed; the fix holds.

- **Atomicity:** `ensureEvidenceByUri` (`store.ts:295-302`) performs the keyed
  lookup and the insert with no `await` between them, and
  `DevEvidenceStore.ensureEvidence` (`dev-evidence-store.ts:32-38`) builds the row
  synchronously inside the callback. Microtask behaviour was traced: `await` on an
  already-resolved promise yields, but the check-insert pair never spans a yield
  point, so two callers cannot both pass the check. This is the same argument that
  makes `appendEvent`'s `dedupeKey` and the keyed `ReviewFinding` hold, and it is
  now consistent across all three.
- **Append-only preserved:** the existing row is returned unchanged — never
  re-labelled or re-stamped — asserted by `dev-evidence-store.test.ts:99-109`
  (`expect(replay.label).toBe("Outcome")` after a replay supplying a different
  label). `addEvidence` remains an unconditional append, asserted at `:130-137`.
  This preserves ADR-0002 E4's *"Evidence … append-only, immutable"*.
- **Stable identity on replay:** `review-service.test.ts:1480-1502` asserts
  `toEqual(before)` on the full evidence set after two replays — identity, not
  merely count. `:1446-1478` asserts every `ReviewFinding.evidenceId` resolves to
  a row that exists, which is exactly the orphan the old read-then-write produced.
- **All three call sites use it:** `ensureReviewEvidence`
  (`review-service.ts:210`), `ensureEscalationEvidence`
  (`escalation-service.ts:152`), `ensureOutcomeEvidence`
  (`agent-execution-service.ts:124`). `addEvidence` survives at exactly one place,
  `recordReclaimEvidence` (`agent-execution-service.ts:968`), which is genuinely
  per-occurrence — a lease reclaim is an event, not a fact — and that is correct.
- The contract documents the durable-adapter obligation rather than leaving
  single-process atomicity to be mistaken for the contract
  (`types/contracts/evidence-store.ts:52-55`).

## Sprint 1E-7 verified genuinely absent, not partially present

`POST /api/dev-hq/internal/execution/dispatch` parses `taskId`,
`requiredCapabilities`, `preferredAgentId`, `instructions`, `idempotencyKey` — and
no `reviewPolicy` field. `dispatchAgentExecutionAction`
(`lib/dev-hq/actions.ts:30-41`) accepts no `reviewPolicy` in its input type. The
service-level parameter exists (`agent-execution-service.ts:536-540`) and defaults
to `DEFAULT_REVIEW_POLICY` at line 671, so every Simulation Lab dispatch is
reviewed under `basic` — exactly ADR-0002 D-E2's *"new agent executions default to
basic"*. There is no half-wired operator surface.

---

# Non-Blocking Follow-Ups

All twelve are recorded here, as GOV-001 requires for a
`PASS WITH NON-BLOCKING FOLLOW-UPS` verdict to authorize commit.

| # | Item | Location | Priority |
| --- | --- | --- | --- |
| 1 | CSPRNG for the callback token | `review-service.ts:354`, `id.ts:3-6` | **Highest** |
| 2 | Remove or wire dead `reviewPolicy` parameter | `execution-manager.ts:226, 260` | Low |
| 3 | Correct terminal-guard comment | `review-service.ts:459-462` | Low |
| 4 | Count sweep results from actual outcomes | `review-service.ts:723-732, 743-754` | Low |
| 5 | Emit a lifecycle event on review re-dispatch | `review-service.ts:375-380` | Medium |
| 6 | Reject malformed findings instead of dropping | `complete/route.ts:15-39` | Medium |
| 7 | Reduce sweep `O(executions × reviews)` scan | `review-service.ts:692-699` | Low |
| 8 | Origin filter on `EscalationStore.findByExecution` | `dev-escalation-store.ts:39-45` | Low |
| 9 | Remove or use `ReviewStore.listPending()` | `review-store.ts:79` | Low |
| 10 | Key `dispatchesInFlight` on force | `review-service.ts:329-330` | Low |
| 11 | Order `recordFindings` after the transition | `review-service.ts:485-492` | Phase 2 gate |
| 12 | Branch name no longer describes contents | `feature/sprint-1d-execution-manager` | Low |

**1. Replace `nextId("rvt")` with a CSPRNG.** `lib/dev-hq/review-service.ts:354`
→ `lib/dev-hq/id.ts:3-6`. The token is documented as a bearer capability that must
defeat a fabricated callback from an otherwise-authenticated worker; a
timestamp-plus-counter cannot do that. Remediation: `token: crypto.randomUUID()`.
Must land before this subsystem runs outside a developer machine. (Ref. C-1.)

**2. Remove or wire the dead `reviewPolicy` parameter on `assignExecution`.**
`lib/dev-hq/execution-manager.ts:226, 260`. Untested, uncalled API surface added
in this commit invites a future caller to assume it is a supported path.
Remediation: delete it, or pass it from `adapters/dev-execution-runner.ts:23`.
(Ref. C-2.)

**3. Correct the terminal-guard comment for the `reviewer_unresponsive` case.**
`lib/dev-hq/review-service.ts:459-462`. It currently tells a maintainer that no
resolved review can be missing findings, which is false for the exact path the
founder is asked to adjudicate. (Ref. C-3.)

**4. Count `reconcileReviews` results from actual outcomes.**
`lib/dev-hq/review-service.ts:723-732, 743-754`. These numbers are the sweep's
only operational signal and are surfaced by
`app/api/dev-hq/internal/execution/reclaim/route.ts:17`; OBSERVABILITY_STANDARD
requires telemetry to be actionable. (Ref. C-4.)

**5. Emit a lifecycle event on review re-dispatch.**
`lib/dev-hq/review-service.ts:375-380` uses
`dedupeKey: \`${REVIEW_EVENT_TYPE.started}:${review.id}\``, so attempts 2 and 3 of
a stalled review leave no trace on the execution timeline. ADR-0002 E3 requires
*"One event per meaningful transition"*, and E5 makes the timeline *"the
foundation of audit history: reconstruct exactly what happened, when, by whom."* A
founder reading a `reviewer_unresponsive` escalation sees the dispatch count only
inside the escalation summary text (`escalation-service.ts:367-369`), never on the
timeline. Remediation: add a `review.redispatched` type keyed
`${type}:${review.id}:${attempt}`, mirroring the per-attempt `execution.retried`
key at `agent-execution-service.ts:222`.

**6. Reject malformed findings instead of silently dropping them.**
`app/api/dev-hq/internal/review/complete/route.ts:15-39` — `parseFindings` returns
`[]` for any entry with a bad `severity`, missing `ref`, or non-object shape, and
`route.test.ts:188-219` asserts this as intended. A reviewer reporting a blocking
finding with a typo'd severity gets `changes_requested` recorded with zero
findings and zero evidence, silently losing audit material in a path ADR-0002 E4
designates as the record of record. SECURITY_STANDARD's Input Validation section
says validate, not discard. Remediation: return 400 listing the rejected entries;
the caller is our own worker, so a malformed payload is a bug worth surfacing.

**7. Reduce the sweep's `O(executions × reviews)` scan.**
`lib/dev-hq/review-service.ts:692-699` calls
`await reviewStore.findByExecution(execution.id)` inside a loop over every
execution, and `findByExecution` (`dev-review-store.ts:30-36`) is itself a linear
scan. This runs every 60 seconds (`EXECUTION_SWEEP_CRON`, `constants.ts:82`) on
top of three existing full-execution scans in `handleExecutionReclaim`. Trivial at
current in-memory scale, but it is the shape that will be ported to the Supabase
adapter. Remediation: index reviews by `executionId`, or drive the loop from a
reviews-side query.

**8. Give `EscalationStore.findByExecution` an origin filter.**
`lib/dev-hq/adapters/dev-escalation-store.ts:39-45` ignores origin, while
`createEscalation` dedupes per `(execution, origin)`. The two callers that use it
as a gate — `review-service.ts:749` and `agent-execution-service.ts:953` — are
correct today only because a review exists solely for a `succeeded` execution and
a retry escalation solely for a `failed` one, so the origins can never collide on
one execution. That invariant is held by argument, not by the API. Remediation:
`findByExecution(executionId, origin?)`.

**9. Remove or use `ReviewStore.listPending()`.**
`types/contracts/review-store.ts:79`, implemented at `dev-review-store.ts:44-48`.
No production consumer — `reconcileReviews` iterates
`getDevHqStore().reviews.values()` directly (`review-service.ts:708`) rather than
going through the port. Dead contract surface on a port a durable adapter will
have to implement. Remediation: delete it, or route the sweep through it.

**10. Key `dispatchesInFlight` on force, or refuse to join a non-forced
dispatch.** `lib/dev-hq/review-service.ts:329-330`. Low likelihood and
self-healing, but the code comment claims the map is "an optimization, not the
boundary" and this is the one case where it can change the outcome. Remediation:
`dispatchesInFlight.get(\`${review.id}:${options?.force ? "f" : "n"}\`)`.
(Ref. P-1.)

**11. Order `recordFindings` after the guarded transition before Phase 2
reviewers land.** `lib/dev-hq/review-service.ts:485-492`. Unreachable under
ADR-0001 D4's deterministic simulated reviewer; reachable the moment a real
reviewer is introduced. Remediation: record findings from the persisted winner's
outcome via `ensureReviewLoopStep`, or add a regression test that races divergent
findings so the invariant is pinned before it can break. (Ref. P-2.)

**12. Branch name no longer describes its contents.**
`feature/sprint-1d-execution-manager` carries seven Sprint 1E commits plus four
governance commits. GIT_STANDARD's Branch Strategy: *"Branch names should be
descriptive and concise."* Traceability is the standard's first stated purpose.
Remediation: future Sprint 1E/1F work on `feature/sprint-1e-*`. Not a reason to
hold this commit.

---

# Positive Observations

- **Idempotency is structural, not conditional.** Canonical ids, keyed
  create-or-get, reserve-once fields, and guarded transitions make duplicate
  records unrepresentable rather than merely unlikely. The `ensureEvidence` fix
  brought evidence into line with the keyed-event and keyed-finding patterns that
  were already established.
- **The projection guard fails closed in both directions.** Adding a secret to
  `Review` or forgetting a new public field are both compile errors.
- **Ownership boundaries are enforced by an executable test**, not only by
  documentation: `lib/dev-hq/review-scope.test.ts:59-92` pins that the Execution
  Manager persists `reviewPolicy` and `revisionOfReviewId` verbatim and interprets
  neither.
- **Bounded loops terminate deterministically.** The revision chain caps at
  `MAX_REVIEW_ITERATIONS = 3` and escalates (ADR-0002 E6); the dispatch allowance
  caps at 3 and escalates as `reviewer_unresponsive`; a founder `revise`
  deliberately omits `revisionOfReviewId` so the chain restarts at 1, implementing
  ADR-0002 E2 exactly.
- **Test quality is high.** The concurrency tests genuinely interleave — microtask
  boundaries were traced and a read-then-write implementation would fail them.
  Assertions target content and identity, not merely counts. No test was found
  asserting a wrong invariant.
- **Contracts record obligations that outlive the current adapter**, notably the
  durable-adapter unique-constraint requirement in
  `types/contracts/evidence-store.ts:52-55`.

---

# Risks Summary

| ID | Risk | Live now? |
| --- | --- | --- |
| C-1 | Predictable callback token | Yes, but behind a fail-closed production guard |
| P-1 | Force-dispatch swallowed by in-flight join | No reachable interleaving found |
| P-2 | Blocking finding on a `passed` review | Unreachable in Phase 1; live in Phase 2 |
| P-3 | Token visible in Trigger.dev dashboard | Unconfirmed |
| P-4 | Non-constant-time secret comparison | Theoretical |
| P-5 | Sweep loops on a vanished execution | Unreachable in the in-memory store |

---

# Required Changes

**None.** No blocker was found. Nothing in this report requires a change before
commit.

---

# Optional Improvements

The twelve non-blocking follow-ups above. Suggested sequencing:

1. **Now, as a tracked engineering item:** #1 (CSPRNG). Must land before this
   subsystem runs anywhere other than a developer machine.
2. **Next Sprint 1E task cleanup:** #2, #3, #4 — small, self-contained.
3. **Before the ADR-0002 "real AI reviewers" work begins:** #11.
4. **Opportunistic:** #5, #6, #7, #8, #9, #10, #12.

---

# Decision

**Approved with Recommendations** (TMP-005 vocabulary).

**GOV-001 verdict: PASS WITH NON-BLOCKING FOLLOW-UPS.**

GOV-001's Verdict Vocabulary maps `PASS WITH NON-BLOCKING FOLLOW-UPS` onto the
Approval State *Approved with Limitations*. The TMP-005 decision vocabulary
predates the GOV-001 verdict vocabulary; both are recorded so the artifact
satisfies the template and the governance document without either being
paraphrased.

## Justification

All three required validations pass with real, reproduced output. Both previously
reported blockers are fixed, verified independently, including an empirical `tsc`
proof of the compile-time guard with a control case. The bounded loops are correct
on the paths traced. Ownership boundaries hold and are pinned by an executable
scope test. Test quality is high, and a specific search for vacuous or
wrongly-directed assertions found none.

No finding blocks. C-1 was the only candidate weighed seriously; it fails the bar
because the callback token is strictly a second gate behind a fail-closed guard
that returns 403 in production, and ADR-0002's Security section designates that
guard — not the per-review token — as the required control for this surface. C-2
through C-4 are quality and documentation-accuracy issues on paths that behave
correctly. Nothing here is data loss, corruption, a security exposure reachable
without already holding `DEV_HQ_INTERNAL_TOKEN`, or a broken core invariant.

---

# Recommendation for Commit

**Approved for commit as it stands.** The Sprint 1E baseline is committed and
validated; there is nothing to hold.

Conditions attached, in priority order:

1. Follow-up #1 (CSPRNG for the callback token) should be raised as a tracked
   engineering item now and **must** land before this subsystem runs anywhere
   other than a developer machine. It is a one-line change in one file and does
   not warrant reopening this commit.
2. Follow-ups #2, #3, #4 are small, self-contained corrections suitable for the
   next Sprint 1E task's cleanup.
3. Follow-up #11 must be resolved before the ADR-0002 "real AI reviewers" work
   begins, not before this commit.
4. The four untracked paths in the working tree (`.claude/agents/*.md`,
   `agents/claude-design/outputs/`) are outside the reviewed scope. They were not
   modified and no judgement is made on them beyond noting they are uncommitted;
   someone should decide whether they belong in version control.

---

# What Was Not Verified, and Why

1. **Runtime behaviour against a live Trigger.dev worker.** Every review-service
   test mocks `@trigger.dev/sdk` (`review-service.test.ts:3-7`). Idempotency-key
   *construction* (`${review.id}:${attempt}`) and the test's simulated
   key-collapsing behaviour were verified; that Trigger.dev's real idempotency
   semantics match that simulation, and that `ttl: "50s"` on the sweeper behaves
   as assumed, were not. Requires a live Trigger project.

2. **Trigger.dev run-payload retention and dashboard visibility** (P-3).
   Determinable only from Trigger.dev's documentation or a live dashboard, neither
   present in this repository. The risk and the uncertainty are stated rather than
   the exposure being asserted either way.

3. **Production build.** ADR-0002's Validation section requires *"Full suite green
   (tsc, lint, tests, production build)"*. The three instructed commands were run;
   `next build` was not, so the fourth is unconfirmed by this reviewer.
   `tsc --noEmit` clean makes a type-level build failure unlikely but does not
   exercise Next.js route collection or bundling. See the separate attestation
   under Validation Performed.

4. **Multi-process / durable-adapter concurrency.** Every atomicity argument in
   this review — `ensureEvidenceByUri`, `createReview`, `resolveReview`,
   `appendEvent`, `recordFinding` — rests on JavaScript single-threaded execution
   with no `await` between check and write. Sound for the in-memory store
   (ADR-0001 D7 keeps Phase 1 memory-only) and **not transferable** to a Supabase
   adapter. The contracts document this obligation; it was not and could not be
   tested here.

5. **The `handbooks/INDEPENDENT_CODE_REVIEWER.md` procedure.**
   `agents/independent-code-reviewer/AGENT.md:7` names it as the role handbook.
   The `handbooks/` directory exists and contains ten handbooks, but not that one.
   `standards/CODE_REVIEW_STANDARD.md` was used as the procedural standard
   instead, and nothing about the missing document was fabricated. Recorded as an
   observation: the Independent Code Reviewer, Lead Software Engineer, Associate
   Software Engineer, QA Engineer, Product Owner, Security Engineer, Reliability
   Engineer, Database Architect, and Research Analyst agent directories all exist
   without a corresponding handbook. Similarly, `AGENT.md:114-116` requires
   `NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, and `ERROR_HANDLING_STANDARD.md`,
   none of which exist in `standards/`. Their contents were not invented; naming,
   logging, and error handling were judged against the standards that do exist
   (TYPESCRIPT, OBSERVABILITY, API, SECURITY). This gap is material to review
   completeness and belongs with the Director of Operations.

6. **Accessibility, React, Next.js rendering, and Tailwind standards.** No
   component, page, or client-side file is in this diff — no review data reaches
   any UI yet (ADR-0002 E2/E5 place those surfaces in Sprint 1F). That absence was
   verified by grepping `components/` and `hooks/` for review consumers and
   finding none, rather than assumed.

7. **Sprint 1E tasks 1E-8, 1E-9, 1E-10** (execution timeline read-model, Mission
   Control data exposure, validation and completion notes), listed in ADR-0002's
   Implementation Plan. Outside the given scope; not assessed as complete,
   partial, or absent.

8. **Performance under load.** Algorithmic complexity was reasoned about from
   source (follow-up #7); no benchmark was run and no timing data collected.

---

# Approval

**Reviewer:** Independent Code Reviewer Agent (AGENT-008)

**Date:** 2026-07-26

**Version:** 1.0.0

**Verdict:** PASS WITH NON-BLOCKING FOLLOW-UPS

**Baseline:** `feature/sprint-1d-execution-manager` @ `d8b169d`

---

# Record Note

This report is produced *after* the commits it covers. GOV-001's Official Review
and Approval Order places Independent Code Reviewer review at step 4, before
commit at step 9. This artifact therefore documents a completed baseline
retroactively; it is a durable record of a review whose verdict was previously
delivered outside the repository, not a pre-commit gate applied in sequence.

The verdict is unchanged by that ordering — no blocker was found, so no commit
would have been held. Recorded explicitly so the audit trail does not imply a
sequencing that did not occur.
