# Architecture Commit-Gate Review — Sprint 1E Baseline

**Review ID:** AR-001

**Reviewer:** Architecture Reviewer (AGENT-019 / ROLE-022)

**Date:** 2026-07-26

**Branch:** `feature/sprint-1d-execution-manager`

**HEAD at review:** `e67adda`

**Governing documents:** `agents/architecture-reviewer/AGENT.md`,
`handbooks/ARCHITECTURE_REVIEWER.md`, `docs/company/GOVERNANCE.md` (GOV-001),
`AGENTS.md` (AGENT-001)

---

# 1. Verdict

**PASS WITH NON-BLOCKING FOLLOW-UPS**

No blockers. Four architectural follow-ups are recorded — three confirmed
defects, one plausible risk — none of which prevents this baseline entering
permanent history. Four process escalations are raised separately; three concern
governance documents rather than code, and one concerns a scope determination
this reviewer is not authorized to make.

The Sprint 1E architecture is, in the areas traced end to end, unusually
disciplined: idempotency is structural (canonical ids, reserve-once fields, keyed
create-or-get, guarded transitions) rather than conditional; the Execution
Manager's mandated purity holds against the actual writes rather than against its
comments; and both bounded loops terminate. The follow-ups below are the places
where that discipline is applied unevenly.

---

# 2. Review Surface Actually Inspected

**Working tree.** `git diff` and `git diff --cached` both empty. The candidate is
committed history, not a working tree. Clean apart from four untracked paths, all
predating this sprint and excluded from the implementation surface:
`.claude/agents/claude-design.md`,
`.claude/agents/independent-code-reviewer.md`,
`.claude/agents/lead-software-engineer.md`,
`agents/claude-design/outputs/MISSION_CONTROL_UX_SPEC.md`.

**Commits under review:** `0e9b08a` (28 files, +4321/−32), `94aad7a`, `854e354`,
`152e547`, `e43383a`, `395e778`, `a7fb068`.

**Context only, not reviewed as implementation:** `8310bbb`, `f6caf4c`,
`2c76612`, `d8b169d`, `e67adda`.

**Governance read in full before any assertion:** `AGENTS.md`,
`agents/architecture-reviewer/AGENT.md`, `handbooks/ARCHITECTURE_REVIEWER.md`,
`docs/decisions/ADR-0001-execution-manager-and-agent-registry.md`,
`docs/decisions/ADR-0002-review-escalation-and-work-management.md`,
`docs/plans/SPRINT_1E_REVIEW_AND_RELIABILITY.md`.

**Implementation read as whole files:** `lib/dev-hq/review-service.ts`,
`escalation-service.ts`, `agent-execution-service.ts`, `execution-manager.ts`,
`store.ts`, `types.ts`, `constants.ts`, `review-projection.ts`,
`adapters/dev-review-store.ts`, `dev-escalation-store.ts`,
`dev-evidence-store.ts`, `dev-state-reader.ts`, `dev-task-repository.ts`,
`dev-agent-provider.ts`, `adapters/index.ts`.

**Contracts and domain:** `types/contracts/review-store.ts`,
`evidence-store.ts`, `event-logger.ts`, `types/domain/review.ts`,
`types/domain/execution.ts`.

**Routes and durable tasks:** `app/api/dev-hq/internal/review/complete/route.ts`,
`internal/execution/reclaim/route.ts`, `internal/execution/dispatch/route.ts`,
`app/api/dev-hq/state/route.ts`, `escalations/[id]/{revise,accept}/route.ts`,
`trigger/agent-review.ts`, `trigger/execution-sweeper.ts`, `trigger.config.ts`.

**Tests:** `review-service.test.ts` (1559 lines, read in full),
`review-scope.test.ts`, `escalation-service.test.ts`.

**Prior review, as context only:**
`agents/independent-code-reviewer/outputs/SPRINT_1E_CODE_REVIEW.md` (CR-001).
Read, and independently re-verified where relied upon.

**Validation actually run, output observed:**

| Command | Result |
| --- | --- |
| `npx tsc --noEmit` | exit 0, no output |
| `npx vitest run` | 22 files passed, 317 tests passed, 1.54s |
| `npx eslint .` | exit 0, no output |

`npx next build` was **not** run — see §9.

---

# 3. Blockers

**None.**

---

# 4. Non-Blocking Follow-Ups

## NB-1 — A replayed `accept`/`abandon` escalation resolution overwrites newer task state

**Severity:** NON-BLOCKING FOLLOW-UP · **Classification:** Confirmed defect
(traced; requires a duplicate client POST rather than an interleaving, which is
why it is not a blocker)

**What.** `lib/dev-hq/escalation-service.ts:505-515` reaches `ensureTaskStatus`
unconditionally on the non-`revise` path. `ensureTaskStatus`
(`escalation-service.ts:86-95`) is an unguarded read-then-write:

```ts
  const task = await taskRepository.getTask(taskId);
  if (task && task.status !== status) {
    await taskRepository.updateTask(taskId, { status });
  }
```

At `:483-484` a re-POST of an already-resolved escalation gets `null` from the
guarded store transition and falls back to the persisted record, so
`appliedResolution` is the *old* verb and the task write is re-applied with no
precondition. The `revise` branch was deliberately hardened against exactly this
hazard (`activateTaskForLiveRevision`, `:119-136`); `accept`/`abandon` were not.
The comment at `:497-498` — *"accept/abandon are terminal and unaffected"* —
reasons about the **escalation** being terminal, not the **task**.

**Traced failing path.**
1. Execution A on task T exhausts retries → escalation E1 raised; `:439` sets
   T → `needs_revision`.
2. Founder POSTs `/api/dev-hq/escalations/E1/accept` → E1 resolved(`accept`),
   T → `completed`.
3. New work dispatched on T (`dispatchAgentExecution`,
   `agent-execution-service.ts:638-641`, checks only that the task exists, never
   its status). Execution B exhausts → E2 raised, still **open**, T →
   `needs_revision`.
4. The `accept` POST for **E1** is replayed — an HTTP retry, a double submit.
   `appliedResolution` re-derives as `"accept"` and `ensureTaskStatus(T,
   "completed")` flips T back to `completed`.

**Why it matters concretely.** T is `completed` while E2 is `open` and awaiting a
founder decision. `buildDevHqState` (`store.ts:172-175`) drops T from
`overview.activeTasks`, so Mission Control reports the work finished while the
escalation collection still carries E2 as open. The founder's outstanding
decision is orphaned from a task claiming to be done. The audit trail is not
falsified — the event and evidence writes are keyed on the escalation id — which
is precisely why nothing in the timeline would reveal the flip.

**Exact constraint violated.** No ADR clause governs replay of a resolution
route, so this argues from the module's own stated invariant, quoted from
`escalation-service.ts:460-463`:

> *"Founder resolution of an escalation. **Idempotent: the transition is applied
> once and re-resolving is a no-op that re-returns the escalation.** Side effects
> are reconciled idempotently (Fix 3)."*

Re-resolving is not a no-op: it re-issues a task-status write derived from a
superseded decision. The doc comment describes behaviour the code does not have.

**Safest implementation direction.** Apply the pattern the `revise` branch
already establishes in this same file: route `accept`/`abandon` through
`taskRepository.updateTaskStatusIf` (`dev-task-repository.ts:66-80`) with a
precondition that the task still holds the observed status and that no other
escalation for this task is `open`. No new abstraction; reuses the existing
conditional-update port.

**Required verification.** A test that raises E1, accepts it (T → `completed`),
raises E2 on a second exhausted execution of T (T → `needs_revision`), then calls
`resolveEscalation(E1, "accept")` a second time and asserts T remains
`needs_revision` and E2 remains `open`. Fails before, passes after. The
escalation suite has the exact analogue for `revise` at
`escalation-service.test.ts:803` and `:994`; there is no `accept`/`abandon`
counterpart, which is itself the signal.

## NB-2 — `execution.claimed` and `execution.reclaimed` audit records are unkeyed and unreconciled

**Severity:** NON-BLOCKING FOLLOW-UP · **Classification:** Confirmed defect
(crash window traced; not reachable via a thrown error under the current
in-memory logger — see refutation)

**What.** Sprint 1E made every lifecycle record keyed and restorable. Two were
left out. `lib/dev-hq/agent-execution-service.ts:91-106` — `logExecutionEvent`
passes no `dedupeKey`, unlike `ensureAssignmentEvent` (`:189`),
`ensureRetryEvents` (`:222`), and `ensureTerminalEvent` (`:249`). Its two callers
are the claim transition (`:737-743`) and the reclaim sweep (`:996-1003`).
Reclaim evidence is likewise unkeyed — `:968` uses `addEvidence` rather than
`ensureEvidence`.

**Traced failing path.** *Claim:* `handleExecutionRunning` (`:720-745`)
transitions then logs. A crash between leaves the execution `running` with no
`execution.claimed` entry; the retry hits `existing.status !== "queued"` and
returns early, and `reconcileRecordsFor` (`:888-919`) never restores `claimed`.
Permanently absent. *Reclaim:* `handleExecutionReclaim` (`:991-1003`) commits the
transition then writes evidence and the event. A crash between loses both
permanently — the next sweep skips the execution because it is no longer
`running`, and no reconciler covers this record class.

**Refutation attempted.** `DevEventLogger.log` → `appendEvent`
(`store.ts:218-228`) is pure in-memory and cannot throw, so today only a process
death reaches the window. That is why this is a follow-up, not a blocker. It
becomes a live failure mode the moment the logger is backed by anything durable.

**Exact constraint violated.** ADR-0002 E3: *"Lifecycle events are the audit
backbone… **Granularity.** One event per meaningful transition"*, and E5: *"It is
the foundation of **audit history**: reconstruct exactly what happened, when, by
whom, and with what evidence."* A claim and a lease reclaim are both meaningful
transitions whose event can be permanently absent while the state they describe
is committed.

**Safest implementation direction.** Give `logExecutionEvent` a `dedupeKey`
parameter; key `claimed` on the attempt's assignment id and `reclaimed` on the
released assignment id, matching `ensureAssignmentEvent`. Switch
`recordReclaimEvidence` to `ensureEvidence` under a per-assignment uri. Add both
to `reconcileRecordsFor`.

**Required verification.** Drive an execution to `running`, delete the
`execution.claimed` event from the store to simulate the crash, run
`handleExecutionReclaim`, and assert exactly one `execution.claimed` event exists
afterwards — and that a second sweep still yields exactly one.

## NB-3 — New contracts record the single-process *mechanism*, not the atomicity obligation a durable adapter must meet

**Severity:** NON-BLOCKING FOLLOW-UP · **Classification:** Confirmed defect
(documentation / persistence-readiness; verified by exhaustive grep across
`types/contracts/*.ts`)

**What.** `types/contracts/evidence-store.ts:52-55` states the obligation
correctly and cites the ADR. No other contract does.
`types/contracts/review-store.ts:82-88` explains the *implementation technique*
instead: *"the check and the insert are synchronous with no await between them"*
— a property of the JavaScript event loop and of `DevReviewStore`, not a
requirement a Postgres adapter can read and satisfy. A grep for
`durable adapter|unique constraint|D7|conditional update|transaction` across
`types/contracts/*.ts` returns hits **only** in `evidence-store.ts`. The omission
applies to `EscalationStore.createEscalation` / `reserveRevisionExecution`,
`EventLogger.dedupeKey`, `ReviewStore.reserveCallbackToken` / `recordFinding` /
`resolveReview`, and `TaskRepository.updateTaskStatusIf`.

**Why it matters concretely.** An adapter author reading `review-store.ts:82-88`
and implementing `createReview` as `SELECT … ; if (!row) INSERT …` — the literal
reading of "check and insert" — reproduces exactly the two-caller-both-pass-the-
read defect the in-memory version avoids, producing two reviews for one
execution, two iterations, and a bound that no longer holds.

**Exact constraint violated.** ADR-0001 D7: *"All Sprint 1D–1F work runs on the
in-memory store… **The compare-and-set claim semantics are specified now so a
future Supabase adapter has a concurrency contract to meet.**"* ADR-0002 E9 defers
the adapter, not the contract that adapter must meet.

**Safest implementation direction.** Extend the `evidence-store.ts:52-55` clause,
verbatim in form, to each new mutation, naming the specific durable mechanism per
operation. Documentation-only; no code change.

**Required verification.** No runtime test can prove a doc comment. Extend
`lib/dev-hq/review-scope.test.ts` — which already enforces boundary properties by
reading source (`:59-81`) — with an assertion that each contract file declaring a
keyed or guarded mutation contains a `durable adapter must` clause.

## NB-4 — The reconciliation sweep has no per-item isolation

**Severity:** NON-BLOCKING FOLLOW-UP · **Classification:** Plausible risk

**What.** `app/api/dev-hq/internal/execution/reclaim/route.ts:15-16` composes
`handleExecutionReclaim()` and `reconcileReviews()`. Neither has any per-item
error boundary. A throw anywhere in the first loop
(`review-service.ts:692-699`) aborts the remaining items *and* the three
downstream reconcilers (`agent-execution-service.ts:1029-1031`), and the route
returns 500.

**Why it matters concretely.** The sweep is the **only** mechanism that repairs a
stranded lifecycle, and the only path by which `reconcileReviews` is ever
reached. One item that throws every pass would starve recovery for every other
stranded record indefinitely, and the founder would see only a red sweeper run.

**What could not be verified.** A *permanent* per-item throw could not be
constructed. Every throw site reachable from the sweep was traced and found
guarded: `requireExecution`/`requireAssignment` cannot fire because the loops
iterate live store values; `assertRetryExhausted` is guarded by its callers;
`raiseReviewExhaustionEscalation`'s precondition is scoped to
`iterations_exhausted`; the reserve functions throw only for a missing review
just created. The remaining candidate is a `tasks.trigger` failure, which is a
global outage that self-heals. The structural property is stated with confidence;
a reachable permanent instance is not demonstrated.

**Exact constraint violated.** No ADR clause governs sweep error handling. From
first principles plus ADR-0002's stated risk — *"Idempotency and sweeper
interaction must be correct to avoid double-processing"* — that names duplication
as the hazard; the composed sweep is correct on duplication and unaddressed on
starvation. A repair mechanism whose failure mode is "repair nothing else" makes
its own reliability the ceiling on every lifecycle's reliability.

**Safest implementation direction.** Wrap each loop body in a try/catch that
records the failure against the item and continues; give each of the four
reconcilers its own boundary in the route. Report per-item failures in the
counters `reclaim/route.ts:17` already returns.

**Required verification.** Seed two stranded reviews, stub the store or
`tasks.trigger` so the first throws and the second does not, run
`reconcileReviews`, and assert the second was dispatched and the result records
one failure.

---

# 5. Dimension Coverage

| Dimension | Result |
| --- | --- |
| **ADR compliance** | **Pass.** ADR-0002 E1 (policy `none`/`basic`/`full`, default `basic`) upheld — `constants.ts:112`, `agent-execution-service.ts:671`, lens counts `review-service.ts:120-123`. D-E4 outcome mapping verbatim at `:125-149`. E2 (separate `Escalation`, not `ApprovalManager`) upheld. E3 (events from the service layer, never the manager) upheld and enforced by `review-scope.test.ts:59-81`. E4 (evidence append-only, never control flow) upheld. E6 (independent counters) upheld. E7 (no agent-to-agent contact) upheld. E9/D-E5 (no Supabase, no persistence abstraction) upheld. ADR-0001 D2/D3/D4/D6/O2/O5 unchanged. |
| **Repository and service boundaries** | **Pass with one observation.** No boundary inversion; `types/*` imports nothing from `lib/`; the Execution Manager imports no adapter. Dynamic imports genuinely break cycles and are documented at each site. *Observation:* `review-service.ts` reads the store directly rather than through a port (`:266, 606, 692, 708`), leaving `ReviewStore.listPending()` unused. Pre-existing repo convention, not a regression; CR-001 #7/#9 record it. |
| **Orchestration ownership** | **Pass.** Each lifecycle has exactly one owner. Cross-lifecycle calls **request** rather than mutate. Recovery paths respect the same ownership as first-pass paths — `reconcileRecordsFor` writes only descriptive records, never a transition. |
| **Execution Manager purity** | **Pass — verified against writes, not comments.** No `getDevHqAdapters`, no `eventLogger`, no `tasks.trigger`, no evidence, no escalation. `reviewPolicy` and `revisionOfReviewId` are stored verbatim and never interpreted; the manager contains no `MAX_REVIEW_ITERATIONS`, no chain traversal, no policy branch. `review-scope.test.ts:59-81` fails the build if six review symbols reappear. |
| **Concurrency and race conditions** | **Pass under the documented single-process model; stated as such.** Every keyed write is atomic because the async body runs to completion before its first await. The dual-callback interleaving in `handleReviewComplete` converges to one revision, one assignment, one run — traced through all four steps. Sweep loops read stale snapshots, but every downstream write re-reads and is guarded. |
| **Retries and replay convergence** | **Pass.** Every replay identity is derived, never allocated; the three id namespaces were checked for collision. No replay consumes a bounded budget. Reconciliation repairs without advancing. |
| **Crash recovery** | **Pass with NB-2.** Reserve-then-create used consistently. Findings durable before the transition. `performDispatch` re-reads after the trigger await rather than writing back a pre-await snapshot. The two residues with no repair are NB-2. |
| **Idempotency** | **Pass — structural throughout.** Keyed create-or-get, reserve-once, guarded transition, canonical id used in place of conditionals everywhere examined. `ensureEvidence` returns the existing row unchanged rather than upserting. |
| **Stale reads and stale writes** | **One confirmed defect (NB-1); otherwise pass.** `activateTaskForLiveRevision` is a model of the correct pattern. NB-1 is the single place the discipline is not applied. |
| **Lifecycle consistency** | **Pass with one recorded gap.** Terminal states genuinely terminal. Both loops hard-bounded and terminating. Counters never conflate. *Recorded gap, not a defect:* nothing marks a task `completed` when its execution succeeds and its review passes; the only path is escalation `accept`. Neither ADR states a transition there — a gap the ADR never addressed. |
| **Persistence implications** | See §7 and NB-3. |
| **Architectural drift** | **Two instances**, both in NB-1 and NB-3. Otherwise ADR-0002's data-flow diagram matches the implementation step for step. |
| **Hidden coupling** | **Pass with two observations.** Each id encoding confined to one function, verified by grep. No invariant enforced in two places. `PublicReview`'s `?: never` is load-bearing — a bare `Omit` would be structurally satisfied by `Review`. *Observations:* `review-scope.test.ts` couples to source text (deliberate, appropriate, will need updating if files move); `trigger/agent-review.ts` imports `simulateReview` from the service module, pulling the WML into the worker bundle — the established 1D-5 pattern, harmless because the worker calls back over HTTP. |
| **Scope enforcement** | **Pass.** See §6. |
| **Future scalability** | See §7. Flagged, not blocked; no ADR sets a threshold this crosses. |

---

# 6. Scope Confirmation

**Included.** Lifecycle event emission and `EvidenceStore` (1E-1); callback
idempotency keyed on `assignmentId` (1E-2); scheduled lease sweeper and reclaim
route (1E-3); heartbeat-freshness health (1E-4); the `Escalation` domain, store,
raise/resolve logic and founder routes (1E-5); and the Founder-authorized 1E-6
reliability completion — durable `ReviewStore` and adapter, `review-service` with
the bounded revision loop, the `agent-review` durable task, the token-guarded
`/internal/review/complete` callback, review-liveness recovery, revision-chain
tracking, and policy-neutral persistence of `reviewPolicy` /
`revisionOfReviewId`.

**Deferred work confirmed genuinely absent, verified at the surface the deferral
named:**

- **Internal dispatch route** — the request body destructure enumerates
  `taskId`, `requiredCapabilities`, `preferredAgentId`, `instructions`,
  `idempotencyKey`. `reviewPolicy` appears nowhere; a client supplying it is
  silently ignored. **Absent.**
- **Server action** — `lib/dev-hq/actions.ts`: grep for `reviewPolicy` returns
  nothing. **Absent.**
- **Simulation Lab / UI** — repo-wide grep across `*.ts`/`*.tsx` excluding tests
  returns twelve hits, all in four `lib/dev-hq/*` service files and
  `types/domain/execution.ts`. No component, no route, no action. **Absent.**

The service-level `DispatchAgentExecutionInput.reviewPolicy` is dormant with no
production caller, which is the correct shape for a deferral. **The absence is
the approved state and is not reported as a defect.**

Other confirmed deferrals: no Supabase dependency, no migration, no `WorkItem`
entity, no scorecard domain or aggregation. All genuinely absent.

**Out-of-scope discovery, recorded not approved.** ADR-0002 E5's derived
execution-timeline read-model is not implemented. Not reported as a defect — see
PE-2, which explains why it cannot be classified and who must decide.

---

# 7. Persistence and Scalability Notes

**This design is correct under the documented single-process, in-memory model. It
is not yet demonstrably correct in general.**

The entire concurrency argument rests on one property — an `async` function body
executes synchronously up to its first `await`, so a check and its dependent
write commit indivisibly. That property is real, correctly reasoned, and
correctly exploited. It does not survive a second process or a network round-trip
to a database. Each of the following becomes a genuine race the moment the store
is durable:

| Operation | Required durable mechanism |
| --- | --- |
| `createReview`, `createEscalation`, `ensureExecution` | unique key + insert-on-conflict-do-nothing |
| `resolveReview`, `resolveEscalation`, `recordDispatch` | single-statement conditional `UPDATE … WHERE status = 'pending' \| 'open'` |
| `reserveCallbackToken`, `reserveRevisionExecution` | `UPDATE … WHERE field IS NULL` |
| `recordFinding`, `ensureEvidence`, `appendEvent(dedupeKey)` | unique constraint on the derived key |
| `updateTaskStatusIf` | conditional update evaluating the precondition in the same statement |
| `claimExecution` (available → busy) | compare-and-set, already specified by ADR-0001 D7 |

Only the `ensureEvidence` row is currently written down. NB-3 asks for the rest;
ADR-0001 D7 already requires it.

**Scalability — flagged, not blocked.** Every sixty seconds the sweep performs
four full scans of `executions` plus a full scan of `reviews`, and
`review-service.ts:696` calls `findByExecution` — itself a linear scan — inside a
loop over executions, giving O(executions × reviews) per pass. Two maps grow
without bound and are never trimmed: `store.eventKeys` and `store.evidenceUris`.
Note the deliberate asymmetry: `store.events` is capped at 200 while `eventKeys`
is not — correct for dedupe durability, but it means `DevHqState.events` will
lose entries the ADR-0002 E5 timeline is meant to merge. At current dev scale all
of this is free. What breaks first is the sweep, at roughly the point where a
single pass exceeds the 50-second sweeper TTL — order 10³–10⁴ executions — after
which recovery silently stops running. Comfortably beyond the current stage and
acceptable now.

---

# 8. Commit-Gate Recommendation

**Proceed to commit.** The Sprint 1E baseline is architecturally sound and may
enter permanent history in this form. Record NB-1 through NB-4 against Sprint 1F.

**Sequencing recommendation (advisory, not a gate condition).** NB-1 and CR-001's
follow-up #1 (CSPRNG for the callback token) should both land before this
subsystem runs anywhere other than a developer machine. NB-3 should land before
the persistence abstraction is designed, because that is the moment its absence
stops being documentation and starts being a defect in an adapter.

**Exact conditions that would change this verdict to FAIL:**

1. Evidence that NB-1's replayed-`accept` path can be reached **without a
   duplicate client POST** — a second internal caller of `resolveEscalation`, or
   a 1F UI that re-issues resolution on poll. That converts a client-triggered
   replay into a system-triggered stale write.
2. A traced permanent per-item throw in the reconciliation sweep (NB-4),
   converting starvation from a plausible risk into a confirmed recovery fault.
3. Any `reviewPolicy` override appearing on the internal dispatch route, the
   server action, or a Simulation Lab control — deferred scope partially present
   is a blocker by definition.
4. A durable or multi-process store introduced without first closing NB-3.

**Conditions that would raise the verdict to PASS:** all four follow-ups closed
with the verification described in each.

---

# 9. What Was Not Verified, and Why

1. **`npx next build` was not run.** ADR-0002's Validation section and the plan's
   Definition of Done both require a green production build. Typecheck, lint, and
   the full test suite were run and their output observed; the build was not,
   because its failure modes (bundling, route collection) are outside this
   architectural remit and belong to the engineer's Definition of Done. **The
   production build is unverified by this review.**
2. **No Trigger.dev worker was executed.** `agent-review`, `agent-execution`, and
   `execution-sweeper` were reviewed as source and through hoisted-mock tests
   only. Whether the real SDK honours `idempotencyKey` with the same semantics as
   the mock, whether `ttl: "50s"` behaves as the sweeper assumes, and whether a
   `tasks.trigger` failure surfaces as a rejected promise were not confirmed. The
   exactly-once argument for reviews depends on the first of those.
3. **CR-001's P-3 (callback token visibility in Trigger.dev run payloads) was not
   independently investigated.** It requires knowledge of Trigger.dev's dashboard
   retention and display semantics not established here.
4. **The `handleReviewComplete` divergent-findings interleaving was analysed but
   not disproved for Phase 2.** Confirmed unreachable today: both runs share one
   payload derived from immutable `execution.request.instructions`; additionally
   verified that no reviewable execution can lack a `request` and that no route
   mutates `task.description`. Becomes reachable when a non-deterministic Phase 2
   reviewer replaces the simulation. CR-001 records the same conclusion as its
   P-2/#11.
5. **No test written here was executed.** As a read-only reviewer no files may be
   added, so the verification steps in NB-1 through NB-4 are specified but not
   run. Each is described so it fails before the fix and passes after.
6. **Untracked pre-existing paths were not reviewed as implementation.** Only
   their tracking status was inspected, which produced PE-4.
7. **Founder-request regression was verified only by suite result.** All 317
   tests pass including the founder-request suites, and `founder-request-service.ts`
   and `trigger/founder-request-workflow.ts` were confirmed untouched by grep.
   The founder-request routes were not diffed byte-for-byte against the pre-1E
   baseline.

---

# Process Escalations

These require a decision owner other than the reviewer. They are not findings
against the code.

## PE-1 — The approved plan's task numbering conflicts with the Founder scope decision

**Blocker.** The commit gate cannot mechanically determine which approved
deliverables this baseline satisfies.

**Facts.** `docs/plans/SPRINT_1E_REVIEW_AND_RELIABILITY.md` defines **1E-6** =
"Review domain and store"; **1E-7** = "Review and revision loop"; **1E-8** =
"Execution timeline and audit history"; **1E-9** = "Mission Control data
exposure"; **1E-10** = "Validation and completion notes". ADR-0002 uses the same
ten-task numbering. The Founder scope decision routed to this review uses
different referents: "1E-6 reliability completion" (durable review service,
callback route, liveness recovery, revision-chain tracking, policy-neutral
persistence) and "Sprint 1E-7 is DEFERRED: the operator-facing `reviewPolicy`
override … and the server action / Simulation Lab". Under the plan's numbering,
1E-7 — the review and revision loop — is **fully implemented** in this baseline,
and the plan's own 1E-7 bullet explicitly includes *"dispatch route + server
action accept an override"* as part of it.

**Impact.** Two governing documents describe the same sprint with incompatible
task labels. A reviewer reading only the plan would conclude 1E-7 was delivered
but 1E-8/1E-9/1E-10 skipped; a reviewer reading only the Founder decision would
conclude 1E-7 was deferred. The commit-gate record will be ambiguous in permanent
history, and Sprint 1F planning inherits the ambiguity.

**Options.** (a) Amend the plan so its task list matches the delivered
decomposition, recording the operator override as a separately numbered deferred
item. (b) Issue a superseding scope note mapping the Founder's labels onto the
plan's, leaving the plan intact. (c) Leave both and rely on prose.

**Recommendation.** Option (b), then (a) at the start of 1F. A superseding scope
note is the smallest correction, preserves the approved plan as an artifact of
its time, and gives this review's verdict an unambiguous referent. Option (c) is
not viable: the ambiguity is already load-bearing in two review reports.

**Required decision owner.** Founder (scope authority), with the Lead Software
Engineer as plan owner and the Director of Operations for the governance record.

## PE-2 — ADR-0002 E5's execution-timeline read-model is not implemented, and its absence cannot be classified

**Blocker.** Sprint 1E cannot be certified complete against ADR-0002 — only that
the delivered surface is architecturally sound.

**Facts.** ADR-0002 E5 states: *"The **execution timeline** is a derived
read-model, not a new store… **(Data/read-model in 1E; the panel is Sprint
1F.)**"* The plan's 1E-8 and 1E-9 implement that read-model and its exposure.
Neither exists: there is no `lib/dev-hq/timeline.ts`, and no timeline
construction in `lib/mission-control/`. `DevHqState` does additively carry
`evidence`, `escalations`, `reviews` (projected), and `reviewFindings` — the
*records* the timeline would merge — but not the merged stream. The Founder scope
decision supplied to this review says nothing about E5.

**Impact.** ADR-0002 places the read-model in 1E. Its absence is either
(i) approved-deferred, in which case reporting it would violate the prohibition
on treating deferred work as a defect, or (ii) outstanding 1E work, in which case
a "Sprint 1E complete" record would be inaccurate. Choosing would be exactly the
unauthorized interpretation `AGENTS.md` requires escalation instead of.

**Options.** (a) Confirm 1E-8/1E-9/1E-10 deferred to Sprint 1F, consistent with
E5's own "the panel is Sprint 1F" and with 1E-9's "No new UI panels". (b) Treat
them as outstanding 1E work to be completed before the sprint is recorded closed.
(c) Amend ADR-0002 E5 to place the read-model in 1F alongside the panel.

**Recommendation.** Option (a), recorded explicitly in the Sprint 1E completion
notes, with (c) as a follow-up if the record and the ADR are to agree. The
delivered baseline produces every record the timeline merges, so deferring the
derivation costs nothing structurally — the read-model is purely derived and can
be added later without migration, which is E5's own stated point.

**Required decision owner.** Founder.

## PE-3 — Risk statement on the approved `reviewer_unresponsive` mechanism

**Stated once; proceeding under the Founder decision.**

**Facts.** The Founder approved `reviewer_unresponsive` as an implementation of
existing bounded-recovery requirements, directed that it not be reported as a new
escalation origin, and directed that no ADR amendment be required. This reviewer
proceeds on that basis and raises no finding. The mechanism is implemented at
`review-service.ts:766-778` and escalates through
`raiseReviewExhaustionEscalation` with `origin: "review_exhausted"` while
`review.iteration` may be 1; the distinguishing information lives on
`Review.escalationReason`, and the escalation precondition correctly branches on
it (`escalation-service.ts:356-363`).

**Risk, stated once as a recommendation.** ADR-0002 E2 defines `origin` as
`retry_exhausted | review_exhausted` and enumerates the two exhaustion conditions
as retry exhaustion and review-iteration exhaustion. An escalation recorded as
`review_exhausted` at iteration 1 is accurate only to a reader who also inspects
`Review.escalationReason` — a field on a different record. E2 also mandates a
*"separate queue and UI surface"* for escalations in Sprint 1F, and D-E6 defers
scorecards to 1F. Both consumers will naturally group by `origin`. A 1F queue or
scorecard doing so will conflate "the reviewer kept rejecting the work" with "the
reviewer never answered" — two operationally different causes demanding different
founder responses and different quality signals.

**Recommendation (not a requirement, and not a request to revisit the
decision).** When the 1F escalation surface is designed, render
`Review.escalationReason` alongside `origin`, or promote the distinction onto
`Escalation` at that point. The cost is near zero in 1F and grows once scorecards
are computed from `origin` alone.

**Required decision owner.** Founder, with the Lead Software Engineer at 1F
design time.

## PE-4 — Three Claude subagent definitions are untracked, including those of the two roles this gate depends on

**Blocker.** The integrity of the review gate itself is affected.

**Facts.** `.claude/agents/` contains four files. `git ls-files .claude/` returns
exactly one — `architecture-reviewer.md`, committed in `8310bbb`. The other three
are untracked:

- `.claude/agents/lead-software-engineer.md` — operationalizes AGENT-006, the
  role that **owns** the architecture under review
- `.claude/agents/independent-code-reviewer.md` — operationalizes AGENT-008,
  whose CR-001 report is a governance input to this commit gate
- `.claude/agents/claude-design.md`

`agents/architecture-reviewer/AGENT.md:33` lists
`.claude/agents/architecture-reviewer.md` among this role's governing documents,
establishing that these files are governance artifacts, not local configuration.

**Impact.** The operating definitions under which the reviewed work was produced,
and under which CR-001 was performed, are not reproducible from the repository.
If either file changes, the change leaves no trace, no diff, and no reviewer. A
future auditor asking "under what definition was Sprint 1E's code review
conducted?" cannot answer from the repository, which weakens every verdict citing
CR-001 as context — including this one.

**Options.** (a) Commit all three alongside `architecture-reviewer.md`, matching
the precedent that commit set. (b) Deliberately ignore `.claude/agents/` and
relocate the canonical definitions under `agents/*/`, treating `.claude/` as a
generated mirror. (c) Leave as is.

**Recommendation.** Option (a). Smallest correction, matches the precedent
`8310bbb` already established for this exact directory, and makes the governing
definitions of AGENT-006 and AGENT-008 auditable — the property the commit gate
borrows from when it treats CR-001 as context. Option (c) leaves the gate's own
inputs unversioned.

**Required decision owner.** Director of Operations (governance artifacts), with
the Founder for the authority record.

---

# Closing Statement on the Verdict

Every candidate finding was subjected to an attempt at refutation before being
reported, and several were discarded because they did not survive: a suspected
duplicate-escalation path through `findByExecution`'s missing origin filter
(refuted — a review exists only for a `succeeded` execution and a retry
escalation only for a `failed` one, so the origins cannot collide, though the
invariant is held by argument rather than by the API, which CR-001 #8 records); a
suspected second-revision path under concurrent callbacks (refuted — reserve-once
plus keyed create plus assignment reuse converge, traced through all four steps);
a suspected stale-snapshot re-dispatch corrupting a resolved review (refuted —
`recordDispatch` refuses a non-pending review, so the cost is one wasted run and
no state divergence); and a suspected unbounded review re-dispatch loop under a
persistently failing trigger (refuted as a duplication hazard — `dispatchAttempts`
is spent only on confirmed dispatches — and folded into NB-4's starvation
analysis instead).

The four follow-ups reported are what survived. Three are confirmed and traced;
one is honestly labelled a plausible risk with the specific unverified element
stated. No findings were manufactured and the count was not padded. **No blocking
architectural findings** is the accurate outcome, and the four process
escalations — not the code — are where the real decisions are owed.

---

# Approval

**Reviewer:** Architecture Reviewer (AGENT-019 / ROLE-022)

**Date:** 2026-07-26

**Version:** 1.0.0

**Verdict:** PASS WITH NON-BLOCKING FOLLOW-UPS

**Baseline:** `feature/sprint-1d-execution-manager` @ `e67adda`

---

# Record Note

This review was performed *after* the implementation commits it covers. GOV-001's
Official Review and Approval Order places Architecture Reviewer review at step 6,
before commit at step 9. This artifact documents a completed baseline
retroactively; it is not a pre-commit gate applied in sequence.

The verdict is unchanged by that ordering — no blocker was found, so no commit
would have been held. Recorded explicitly so the audit trail does not imply a
sequencing that did not occur.
