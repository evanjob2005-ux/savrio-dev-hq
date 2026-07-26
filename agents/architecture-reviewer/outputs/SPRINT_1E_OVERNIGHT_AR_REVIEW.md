# AR-1E Architecture Review — Sprint 1E Overnight Validation

**Run:** sprint-1e-overnight-2026-07-26
**Reviewer:** AR-1E (Architecture Reviewer), read-only
**Target:** `sprint-1e-baseline` / `62f629128e5092f593ff494cd729fe516694bbde`
**Verdict:** **PASS WITH NON-BLOCKING FOLLOW-UPS** — 0 blockers, 6 findings
**Independence:** reached without input from CR-1E or LSE-1E.

> **Coordinator note.** AR-1E executed nothing and re-ran no gate. Every finding is a
> source trace. Reproduction is required before any fix, so all findings are
> `AWAITING_REPRO` pending LSE-1E.

---

## Per-dimension verdicts

| Dimension | Verdict |
|---|---|
| ADR-0001 compliance | **VIOLATION (O6)**, otherwise compliant |
| ADR-0002 compliance | COMPLIANT |
| Orchestration purity (Execution Manager) | COMPLIANT — verified structurally against imports and writes, not comments |
| Repository / service boundaries | AT_RISK — `review-service.ts` bypasses its own `ReviewStore` port |
| `store.ts` shared-mutable seam | COMPLIANT with caveat (`id.ts` not `globalThis`-scoped) |
| Replay convergence | COMPLIANT |
| Concurrency | COMPLIANT under the documented single-process model |
| Idempotency | COMPLIANT — structural, not conditional |
| Crash recovery | AT_RISK |
| Lifecycle consistency | **VIOLATION** |
| Persistence implications | AT_RISK |
| Hidden coupling / drift | AT_RISK |
| Scope | COMPLIANT — deferred 1E-8/1E-9 confirmed absent as approved scope |

---

## Findings

| ID | Dimension | Confidence | Summary |
|---|---|---|---|
| AR2-1 | ADR-0001 O3/O6, lifecycle | Confirmed | Five of ten frozen capabilities permanently unassignable; no event records the refusal |
| AR2-2 | Lifecycle consistency | Confirmed | Task and Execution lifecycles decoupled in both directions |
| AR2-3 | Persistence, concurrency | Confirmed asymmetry / plausible collision today | Id generation process-local while the store it keys is `globalThis`-scoped |
| AR2-4 | Crash recovery, replay | Confirmed | Execution→review handoff recovery path is not the one the callback replays |
| AR2-5 | Boundaries | **Resolved by coordinator — see below** | Authorization depth asymmetric across two surfaces |
| AR2-6 | Hidden coupling | Confirmed (contract-level) | `ExecutionRunner` port exposes the unsafe heartbeat variant |

### AR2-1 — Capability half of the registry is inert
Of five seeded agents only two are `available`; `agent-claude`, `agent-codex` are
`busy`, `agent-gemini` `waiting`, and **no code path can flip them back** —
`releaseAgent` (`execution-manager.ts:61-67`) is reachable only via an agent already
selected. Therefore `implementation`, `review`, `corrections`, `qa`, `accessibility`
are permanently unassignable. ADR-0001 O6 requires a logged event on no-match; five
decline sites emit none (`agent-execution-service.ts:682-690, 823-825`,
`execution-manager.ts:172-186`, `review-service.ts:626-631`,
`escalation-service.ts:285-290`). Execution stalls `queued` forever, silently.
`dispatch-capabilities.test.ts:37,50-51` passes because it asserts capability *lists*
and never availability.

### AR2-2 — Task lifecycle decoupled from Execution lifecycle
Nothing marks a task `completed` when its execution succeeds and review passes — the
only path to a terminal task status is escalation `accept`/`abandon`. Conversely
nothing ever writes `task.assigneeAgentId`, yet `listReadyWork`
(`execution-manager.ts:212-216`) filters on it being null, so it returns every active
task forever including running and finished ones. `overview.activeTasks` only rises.
The happy path has no terminal state; the failure path does.

### AR2-3 — Id generation weaker than the store it keys
`store.ts:25,108-116` deliberately scopes the store to
`globalThis[Symbol.for(...)]`; `id.ts:1-6` uses a module-local `let sequence`.
Colliding ids silently overwrite (`map.set(id, record)`). Confirmed asymmetry;
collision today is plausible not confirmed. **Not conditional under persistence** —
`Date.now()` plus per-process counter collides trivially across processes, and
AR-001's NB-3 table has no row for id generation. Fix is one line
(`crypto.randomUUID()`), which also closes CR-001 CR-1 (predictable callback token).

### AR2-4 — Review handoff has one recovery path, and the callback replays the other
`handleExecutionComplete` fresh path calls `requestReviewIfSucceeded`
(`agent-execution-service.ts:847`); its **re-entry** path (`:856`) calls
`reconcileRecordsFor`, which never requests a review. The only code creating a
missing review is `reconcileReviews` (`review-service.ts:692-699`), reachable only
from the sweeper. If the process dies before `:847`, the review is never requested by
the callback on that or any later attempt — a succeeded execution is silently never
quality-checked unless the sweep runs. The module's own doc comment at `:801-803`
states the invariant the code lacks. Fix is one call at one line.

### AR2-6 — Port understates the heartbeat invariant
`ExecutionRunner.heartbeat(executionId)` (`execution-runner.ts:60`) omits the
`assignmentId` the correctness argument depends on; `DevExecutionRunner` drops it.
No live defect (the production route goes through the service and does pass it), but
a future adapter written faithfully to the contract implements the version that lets
a stale worker extend a successor's lease.

---

## AR2-5 — Coordinator resolution (registration confirmed)

**AR-1E's concern.** `proxy.ts` may be inert: `.next/server/middleware-manifest.json`
contains `middleware: {}` and `sortedMiddleware: []`. AR-1E could not determine
whether Turbopack registers the proxy by another mechanism and labelled AR2-5
*plausible*, listing "evidence that `proxy.ts` is inert in this build" as a condition
that would flip its verdict to FAIL.

**Coordinator investigation — the proxy IS registered.** Next 16 registers it in
`.next/server/functions-config-manifest.json`, not the legacy manifest:

```json
{"version":1,"functions":{"/_middleware":{"runtime":"nodejs",
  "matchers":[{"originalSource":"/api/dev-hq/:path*","regexp":"…"}]}}}
```

The same matcher appears in `.next/static/…/_clientMiddlewareManifest.js`. The empty
`middleware-manifest.json` is a stale legacy artifact in Next 16, **not** evidence of
non-registration.

**Matcher tested directly** against the registered regexp:

| Path | Result |
|---|---|
| `/api/dev-hq/escalations/esc-1/revise` | MATCH |
| `/api/dev-hq/escalations/esc-1/accept` | MATCH |
| `/api/dev-hq/escalations/esc-1/abandon` | MATCH |
| `/api/dev-hq/escalations` | MATCH |
| `/api/dev-hq/internal/execution/dispatch` | MATCH |
| `/api/other/thing` | no match |

**Conclusion.** The FAIL-flip condition is **not** met. The production boundary is
registered and covers every founder escalation route. This also independently
confirms the coordinator's earlier refutation of CR-1E's F3.

**What survives from AR2-5, and it is worth acting on:** no test anywhere exercises
`proxy.ts` (verified against the full 22-file inventory), and it is the *single*
control for the most privileged founder-decision surface. AR-1E's recommendations
stand — add production-disabling to the three escalation routes for defence in depth,
and add one test asserting `proxy()` returns 403 under `NODE_ENV=production` with the
matcher covering `/api/dev-hq/escalations/x/revise`.

**Limit of this resolution:** it confirms *registration*, from build artifacts. No
production server was run, so runtime enforcement remains unexecuted.

---

## Blockers

**None.** Amended by AR-1E after the coordinator reproduced AR2-1/X1 — its original
"work silently stalls" understated the property:

> "Every finding degrades to a stall or a missing record rather than corrupted state
> — **though AR2-1's stall is the deterministic outcome of a normal dispatch, not an
> edge case, and produces no founder-facing signal at all.**"

> **Amended by AR-1E after reading CR-1E's F2** (applied at AR-1E's own request; the
> amendment weakens its original phrasing):
>
> "No finding produces a duplicate execution, a double-spent budget, a second founder
> decision, or **a record that asserts an untruth**. F2 shows the timeline cannot
> distinguish a lease-expiry reclaim from a reported failure — the absence of the
> unkeyed `reclaimed` record **is not neutral**."
>
> AR-1E's reason: CR-1E's F2 made the original phrasing sound stronger than the
> property actually established, and leaving the stronger claim in the permanent
> record would overstate the verdict *in the baseline's favour*.

**AR2-1 reclassified after reproduction.** AR-1E moved it out of "constrains Sprint
1F" on the strength of X1 being reachable with no crash and no race:

> **Must land before this subsystem is used by anyone other than the developer who
> wrote it.** Not because it is unsafe, but because a founder-facing surface that
> fails half its advertised vocabulary with no explanation is not usable by a second
> person. Non-blocking for the commit gate; gating for first non-developer use.

**Why X1 is nonetheless not a blocker** (AR-1E, and this distinction is load-bearing):
ADR-0001 O6 says a capability-unmatched execution is *left `queued` with a logged
event*. **The queued execution is the approved outcome; the missing event is the whole
violation.** Anyone reading X1 as "executions leak" will fix the wrong thing. The
condition self-heals the moment an eligible agent exists, costs no business attempt,
and the record is internally truthful. AR-1E's stated threshold: *committing does not
make it harder to fix* — the remediation is purely additive.

**Scope note, which cuts in the baseline's favour.** The seeded-availability half of
AR2-1 traces to ADR-0001 **D5 in Sprint 1D**, over Sprint 1A placeholder data. This is
a **Sprint 1E** gate; failing it for a property fixed by an approved 1D decision would
apply the gate at the wrong sprint. The missing-event half spans 1D-5 and 1E-5 and is
fairly in scope.

Prioritisation from AR-1E:
- **Must land before non-developer use:** AR2-1 (reclassified), AR2-3, CR-1
- **Constrains Sprint 1F materially:** AR2-2
- **Before running anywhere but a developer machine:** AR2-3, AR2-5, plus carried NB-1, CR-1
- **Before the persistence abstraction is designed:** AR2-3's NB-3 row, AR2-6, NB-3
- **Cheap and high value now:** AR2-4 (one call), AR2-3 (one line)

---

## AR-1E architectural read on CR-1E's F1, F2, F4

Filed after cross-brief. **Verdict unchanged: PASS, none of the three is a blocker.**

### Synthesis — AR2-1, F1 and F4 are one pattern

AR-1E's most actionable output for Sprint 1F. The Work Management Layer has **no
consistent representation for "this is a normal negative outcome."** Three designed-for
conditions are represented three different ways, and a fourth shows the correct shape:

| Condition | Representation | Site |
|---|---|---|
| No capability-matching agent free | silent early return, **no event at all** | `agent-execution-service.ts:682-690`, `execution-manager.ts:461-464` |
| Lost a capacity-1 claim race | **thrown Error → HTTP 500** | `execution-manager.ts:525-529` → `running/route.ts` |
| Beat arrives after the attempt ended | **thrown Error → HTTP 500** | `execution-manager.ts:564-568` |
| Stale/superseded callback | **absorbed, returns current state** ← correct shape | `agent-execution-service.ts:729-735, 790-791` |

The module demonstrably knows the right answer — the fourth row absorbs "already moved
on" deliberately and documents why. **Treat AR2-1 + F1 + F4 as one Sprint 1F
workstream, not three tickets:** define what a normal negative outcome is at this
boundary, give it one representation (a returned decision plus a keyed event, never a
throw), and apply it at all three sites.

### F1 — confirmed, with a severity correction *downward*

`ensureAssignment` explicitly does not reserve the agent (`execution-manager.ts:220-222`),
so two executions can hold assignments naming the same capacity-1 agent. Worker B's
`postJson` raises on `!response.ok` before the `holdsClaim` check at
`trigger/agent-execution.ts:66-72` is evaluated, so **the stand-down branch is dead code
for the race its own comment names** (`:55-59`).

**Correction to CR-1E's framing.** "Permanently fails its durable run" is accurate in
dev (`trigger.config.ts:8`, `enabledInDev: false`) but only partial in a deployed
environment, where `maxAttempts: 3` retries the whole run. Either way the **execution**
recovers: assignment B has `triggerRunId` set and `claimedAt` null, so
`isClaimDeadlineExpired` fires at 120s and `reconcileQueuedDispatches` releases and
re-assigns it, costing no business attempt. **The lost run is real; the lost work is
not.** That is why F1 is not a blocker.

### F4 — confirmed, same class

Reachable today via a Trigger-retried heartbeat landing after `/complete` committed the
terminal transition: `releaseExecution` leaves `assignmentId` intact
(`execution-manager.ts:622-637`), so the beat passes the stale-worker guard and hits the
throw. The reclaim and retry paths do **not** produce this — `applyFailedAttempt`
replaces the assignment id and `releaseAssignmentForReassignment` clears it. The
aliasing is specific to terminal release. No retry-budget attempt is consumed.

### F2 — confirmed, and it sharpens AR-1E's own claim

F2 is AR-001's NB-2 composed with NB-4; both verified still present. The sharpened
property: `ensureRetryEvents` still reconstructs `execution.retried` from the attempt
counter, and `reconcileRecordsFor` deliberately writes no outcome evidence for a
requeued execution. So the timeline renders "attempt 1 did not succeed; retrying as
attempt 2" **with no cause recorded** — a lease-expiry reclaim and a worker-reported
failure become **indistinguishable to any reader of the timeline.** Two operationally
different causes, one appearance.

Not a blocker (state remains authoritative and repairable; the founder is not shown
something false), but **the sharpest argument yet for keying `reclaimed`** — it is the
only lifecycle transition whose entire signal lives in an unkeyed record. AR-1E moves
NB-2 up the Sprint 1F ordering on this basis.

---

## Persistence readiness — three additions to AR-001 §7

1. **Id generation (AR2-3)** — not covered by NB-3's per-operation table; a fully
   correct adapter still collides.
2. **Availability CAS has no recovery leg (AR2-1)** — an agent whose durable row is
   written `busy` by a crashed process is permanently stranded. Needs lease-expiry
   availability reclaim, not just CAS.
3. **`ExecutionRunner.heartbeat` (AR2-6)** must carry the assignment id.

**Enforced only by process locality:** every check-then-write in `store.ts`,
`dev-review-store.ts`, `dev-escalation-store.ts`, `dev-task-repository.ts` depends on
the async body reaching its first `await`. **Scalability:** the sweep is
O(executions × reviews) per pass and `reconcileReviews` re-runs over every
historically resolved review every pass; the 50s sweeper TTL breaks first, after
which recovery silently stops. `eventKeys`/`evidenceUris` grow unbounded while
`events` is capped at 200 — corroborates CR-1E's F10 independently.

---

## Refuted before reporting (examined, not missed)

Duplicate escalation via missing origin filter · stale-snapshot force re-dispatch of a
resolved review · sweep re-writing task status over a live revision · unbounded review
re-dispatch · review-iteration bound escapable via the escalation-revise path. Each
refuted with a traced argument.

## AR-1E declared limitations

1. No deterministic gate re-run — relies on coordinator's Phase 1 results.
2. No Trigger.dev worker executed; whether the real SDK honours `idempotencyKey` as
   the mock does is unconfirmed, and the exactly-once argument for reviews depends
   on it.
3. `proxy.ts` runtime registration — **now resolved by the coordinator above.**
4. Next.js module-layer duplication (AR2-3 collision path) inferred, not demonstrated.
5. No test written here was executed.
6. Founder-request regression verified structurally only.
7. Settled findings NB-1..NB-4 and CR-1..CR-12 re-checked for presence (all still
   present) but not re-argued.
8. UI layer examined only for domain-logic leakage; rendering, accessibility and
   React correctness **not examined**.
