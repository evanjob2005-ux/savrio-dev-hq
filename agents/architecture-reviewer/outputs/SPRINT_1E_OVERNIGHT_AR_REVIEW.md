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

**None.** AR-1E: every finding degrades to "work silently stalls" or "a record is
missing", never to corrupted or contradictory state. No finding produces a duplicate
execution, a double-spent budget, a second founder decision, or a falsified audit
record.

Prioritisation from AR-1E:
- **Constrains Sprint 1F materially:** AR2-1, AR2-2
- **Before running anywhere but a developer machine:** AR2-3, AR2-5, plus carried NB-1, CR-1
- **Before the persistence abstraction is designed:** AR2-3's NB-3 row, AR2-6, NB-3
- **Cheap and high value now:** AR2-4 (one call), AR2-3 (one line)

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
