# Architecture Decision Record (ADR)

**Template ID:** TMP-003
**Document ID:** ADR-0002
**Authority:** CONST-001, AGENT-001, ADR-0001

---

# Decision Information

## ADR Number

ADR-0002

## Title

Review Loops, Escalation, Events, Evidence, and Work-Management Architecture for Sprint 1E

## Status

Accepted. Incorporates founder-resolved decisions D-E1…D-E7 plus the approved
review-policy definitions, the "Revise" reset semantics, and timeline immutability.

## Decision Date

2026-07-25

## Stakeholders

- Founder and CEO (Evan) — approving authority; resolved D-E1…D-E7
- Lead Software Engineer (Claude Code) — author
- Director of Operations — process/governance

---

# Context

Sprint 1D delivered the Work Management Layer's execution spine (ADR-0001): Agent
Registry, Execution Manager (assign, atomic claim/release, lease, heartbeat, stale
reclaim, a 3-attempt retry budget), the durable Trigger.dev `agent-execution` task with
token-guarded callbacks, manual Simulation Lab dispatch via a server-only path, and a
live roster. Simulated deterministic agents only; memory persistence by default.

Sprint 1D deferred several capabilities to Sprint 1E (recorded in
`docs/plans/SPRINT_1D_COMPLETION_NOTES.md`) and added new scope: lifecycle event
emission, evidence records, retry-exhaustion escalation, a scheduled stale-lease sweeper,
callback idempotency, health freshness, a review/revision loop, and an execution timeline
/ audit history. This ADR fixes the architecture for those. It is not implementation.

Scorecards/analytics and any Supabase persistence work are explicitly out of Sprint 1E
(see E9).

---

# Problem Statement

Without breaking existing behavior, the Work Management Layer must: produce a trustworthy
chronological audit record; independently quality-check completed work and drive bounded
revision; escalate to the founder when automated recovery or revision is exhausted
without polluting the founder-request approval queue; recover abandoned runs idempotently;
and keep a stable target hierarchy for future work grouping.

Preserved invariants: the founder-request workflow, current public API behavior, the
centralized Work Management Layer, **no direct agent-to-agent communication**, and
Trigger.dev as durable infrastructure rather than the product layer.

---

# Decision

Nine architectural decisions (E1–E9), resolving founder decisions D-E1…D-E7.

## E1 — Review architecture (resolves D-E2, D-E4)

A review subsystem quality-checks completed executions and produces findings.

- **Review policy (D-E2).** Each agent execution carries a `reviewPolicy`:
  - `none` — skip review; a successful execution is final.
  - `basic` — one deterministic review lens, subject to the revision loop (E6).
  - `full` — multiple deterministic review lenses evaluated during a single review
    iteration, subject to the same loop.

  New agent executions **default to `basic`** unless explicitly overridden at dispatch.
  The founder-request path never dispatches agent executions, so it is unaffected.
- **Domain.** `Review` (id, taskId, executionId, iteration, status, createdAt,
  resolvedAt), `ReviewFinding` (id, reviewId, severity `blocking | advisory`, category,
  summary, evidenceId?), `ReviewStatus` (`pending | passed | changes_requested |
  escalated`), and the `ReviewPolicy` union.
- **Port + adapter.** A `ReviewStore` contract with an in-memory dev adapter, backed by a
  new `reviews` store collection and surfaced additively on `DevHqState`.
- **Reviewer.** A deterministic **simulated** reviewer (no real AI), implemented as a
  durable Trigger.dev `agent-review` task with token-guarded internal callbacks, mirroring
  `agent-execution`. Outcome derives from the instructions (D-E4):
  - `/block/i` → a **blocking** finding; revision required.
  - `/revise/i` → a **non-blocking** revision note (advisory).
  - otherwise → **pass**.
- **Orchestration.** A `review-service` in the WML records reviews/findings/evidence and
  drives the revision loop. Reviews never contact agents directly; all flow through the WML.

## E2 — Escalation architecture (resolves D-E1, D-E7)

Retry exhaustion (execution) and review exhaustion (revision loop) both terminate in a
founder **Escalation** — a first-class, **separate domain object**, not an `ApprovalManager`
reuse (D-E1). This keeps the founder-request approval queue and its `waitTokenId`
"actionable" invariant clean.

- **Domain.** `Escalation` (id, origin `retry_exhausted | review_exhausted`, taskId,
  executionId?, reviewId?, summary, status `open | resolved`, resolution?, raisedAt,
  resolvedAt, raisedByAgentId). Resolution actions (D-E1): **revise | abandon | accept**.
- **Port + adapter.** An `EscalationStore` contract with an in-memory adapter, a new
  `escalations` store collection, additive exposure on `DevHqState`.
- **Behavior.** On exhaustion the WML raises exactly one `Escalation`, sets the task to
  `needs_revision`, and records an event + evidence. The founder resolves it through WML
  endpoints (not a Trigger wait token — the run has ended): **revise** resets the
  review-iteration counter to zero and authorizes a new execution with a fresh 3-attempt
  execution retry budget, **abandon** marks the task rejected, **accept** marks it
  completed.
- **Separate queue and UI surface (D-E7).** Escalations are presented in their own queue,
  distinct from the founder approval queue. In Sprint 1E only the domain, store,
  raise/resolve logic, and data exposure are built; the dedicated UI surface is Sprint 1F.
- `ApprovalManager` and the founder-request approval flow are untouched.

## E3 — Event architecture

Lifecycle events are the audit backbone, emitted through the existing `EventLogger`
contract **from the service layer**, never from the pure Execution Manager — keeping the
manager a side-effect-free state machine and avoiding an adapter↔manager import cycle.

- **Emitters.** `agent-execution-service` (execution transitions), `review-service`
  (review transitions), the escalation path, and the sweeper handler.
- **Taxonomy (representative).** `execution.assigned | claimed | succeeded | retried |
  exhausted | reclaimed`, `review.started | finding_recorded | passed |
  changes_requested | escalated`, `escalation.raised | resolved`.
- **Granularity.** One event per meaningful transition; **no event per heartbeat**.
- Append-only; never mutated.

## E4 — Evidence architecture

Implement the existing `EvidenceStore` contract (defined but unimplemented since 1D).

- **Records.** `Evidence` (kinds `validation | artifact | review | approval | log`),
  append-only, immutable, joined to an execution and task, optionally to a review.
- **Emission.** ≥1 `Evidence(kind:"log")` per execution outcome; review findings as
  `Evidence(kind:"review")`; escalations reference the evidence that justified them.
- **Storage.** A new `evidence` store collection, an in-memory adapter, wired into the
  composition root, surfaced additively on `DevHqState`.
- Evidence is descriptive record-keeping only — it never drives control flow.

## E5 — Execution timeline

The **execution timeline** is a derived read-model, not a new store. It merges — by
timestamp, per execution/task — events, evidence, `AgentAssignment` transitions,
reviews/findings, and escalations into one ordered stream (timestamp, kind, actor,
summary, refs), assembled in the Mission Control view-model layer.

- It is the foundation of **audit history**: reconstruct exactly what happened, when, by
  whom, and with what evidence.
- Purely derived — owns no source of truth, so it cannot drift from the underlying
  records. (Data/read-model in 1E; the panel is Sprint 1F.)
- The execution timeline is immutable and append-only. Corrections, retries, reviews, and
  revisions always append new timeline entries rather than modifying prior history.

## E6 — Separation of execution retries from review iterations (resolves D-E3)

Two **independent, hard-bounded** loops with distinct ownership and counters:

- **Execution retry loop.** Owned by the Execution Manager (1D). Up to **3 attempts** per
  execution on `failed`/`timeout`; each attempt is a new `AgentAssignment` and a separate
  durable Trigger run. Exhaustion → escalation (`retry_exhausted`).
- **Review iteration loop.** Owned by the `review-service`. Up to **3 review iterations**
  on blocking findings. **Each revision creates a new `Execution` with a fresh 3-attempt
  execution retry budget** (D-E3). Exhaustion → escalation (`review_exhausted`).

The loops **compose**: a review-driven revision dispatches an execution that may itself
retry up to three times. Counters are tracked separately and never conflate. Both loops
are hard-capped and terminate in **founder escalation after exhaustion** rather than
looping indefinitely — the same discipline as the 1D retry budget.

## E7 — No direct agent-to-agent communication

Reaffirmed and extended to the review subsystem. Agents (including the simulated reviewer)
never communicate directly with one another. All coordination — dispatch, review,
revision, escalation — flows through the centralized Work Management Layer via its ports,
services, and token-guarded callbacks. The reviewer evaluates recorded outputs; it does
not message the executing agent.

## E8 — Future WorkItem hierarchy

The target hierarchy is:

```
Project → WorkItem → Task → Execution → AgentAssignment
```

- A **WorkItem** sits between Project and Task: it groups the Tasks that pursue one unit
  of delivered work. A **Task** decomposes into **Executions**; each Execution has
  **AgentAssignments** (one per attempt). Reviews and Escalations attach at the Task/
  Execution level.
- Sprint 1E operates at the **Task → Execution** layer (the layer that exists today).
  Per founder decision, **review-iteration state remains on the review records and the
  `review-service` during Sprint 1E, and `WorkItem` is not implemented in 1E.** The
  **WorkItem** is a documented target only; promoting it to a first-class persisted entity
  (with the Project → WorkItem → Task rewiring) is a Phase-2 additive follow-up.
- Fixing the hierarchy now gives iteration state, the timeline, and future scorecards a
  stable anchor.

## E9 — Deferrals (resolves D-E5, D-E6)

- **Persistence (D-E5).** Sprint 1E does **not** implement Supabase persistence and does
  **not** introduce the persistence abstraction / repository-port refactor. All 1E work
  stays on the in-memory store (default and only backend). The persistence abstraction and
  Supabase adapters are deferred to a **later phase**, gated on explicit approval to
  install `@supabase/supabase-js` and apply migrations. No dependencies installed, no
  migrations applied in 1E.
- **Scorecards (D-E6).** Scorecards and analytics are deferred to **Sprint 1F**. Sprint 1E
  produces the underlying records (events, evidence, reviews, escalations) from which 1F
  scorecards will be computed, but builds no scorecard domain, aggregation, or UI.

---

# Resolved Founder Decisions

| # | Decision | Resolution |
|---|---|---|
| D-E1 | Escalation model | Separate `Escalation` domain object; actions revise / abandon / accept (revise resets the review-iteration counter to zero and grants a fresh execution retry budget); **do not** reuse `ApprovalManager` |
| D-E2 | Review policy | `reviewPolicy` = none (skip) / basic (one lens) / full (multiple lenses in one iteration); new agent executions default to **basic** |
| D-E3 | Retry ↔ review | Each revision creates a new `Execution` with a fresh 3-attempt retry budget; review loop capped separately at 3 iterations |
| D-E4 | Simulated review outcomes | `/block/i` → blocking + revision; `/revise/i` → non-blocking note; otherwise pass |
| D-E5 | Supabase persistence | Not in 1E; persistence abstraction + Supabase adapters deferred to a later phase |
| D-E6 | Scorecards | Deferred to Sprint 1F |
| D-E7 | Escalation surface | Separate queue and UI surface from approvals |

---

# Alternatives Considered

## A — Overload `ApprovalManager` for escalations
Rejected (D-E1): pollutes the founder-request queue, breaks the wait-token-actionable
invariant, and conflates two decision types. Use a distinct `Escalation` (E2).

## B — Emit events inside the Execution Manager
Rejected: creates an adapter↔manager import cycle and makes the manager impure. Emit from
the service layer (E3).

## C — Persist the execution timeline as its own store
Rejected: duplicates source records and can drift. Use a derived read-model (E5).

## D — One combined retry/review loop
Rejected (D-E3): conflates infrastructure failure with quality rejection and obscures
ownership. Two independent bounded loops (E6).

## E — Introduce the persistence abstraction now
Rejected (D-E5): premature before the domain is stable, and requires prohibited
dependencies/migrations. Keep memory-only; defer the abstraction (E9).

---

# Decision Drivers

- Auditability and trustworthy record-keeping
- Clear ownership boundaries; a side-effect-free core state machine
- Bounded, terminating loops (no runaway automation)
- Preservation of approved founder-request behavior and public API shapes
- Additive, reversible change; memory-first; no premature infrastructure

---

# Expected Consequences

## Positive
- Every execution and review yields a chronological, evidence-backed audit trail.
- Completed work is independently checked and revised within hard bounds, then escalated.
- The founder-request queue and its invariant stay clean; escalations are first-class.
- A stable target hierarchy (Project → WorkItem → Task → Execution) anchors future work.

## Negative
- `DevHqState` grows (evidence, reviews, escalations) — additive but larger.
- Two loops plus an escalation path add moving parts that must each be bounded and tested.

## Risks
- Idempotency and sweeper interaction must be correct to avoid double-processing.
- Unbounded review/revision work if the 3-iteration cap is not strictly enforced.
- Escalation resolution (`revise`) re-dispatch must reset counters explicitly and safely.

---

# Impact Assessment

## Product
No 1E founder-facing behavior change; review/escalation/evidence data surfaces in
Mission Control in Sprint 1F.

## Engineering
New domain types (review, escalation), new ports/adapters (evidence, review, escalation),
new services (review, escalation), event/evidence emission in the execution service, a
scheduled sweeper, callback idempotency, and health freshness. All additive;
founder-request flow untouched. No persistence abstraction, no scorecards in 1E.

## Database
None. No schema, no migrations (persistence deferred, E9/D-E5).

## Infrastructure
New Trigger.dev tasks (`agent-review`, `execution-sweeper`) reusing the existing internal
callback auth. Trigger remains durable infrastructure, not the product layer.

## Security
New internal routes reuse the fail-closed guard (403 prod / 503 no token / 401 mismatch).
Founder-facing escalation-resolution routes mirror the existing approval routes. No new
secrets.

## Operations
Escalations introduce a founder decision surface (revise/abandon/accept) in a separate
queue; the sweeper introduces a scheduled recovery process.

---

# Implementation Plan

Sprint 1E is implemented in ten tasks (see the Sprint 1E task list accompanying this ADR):
1E-1 Events + Evidence · 1E-2 Callback idempotency · 1E-3 Scheduled lease sweeper ·
1E-4 Agent health freshness · 1E-5 Escalations · 1E-6 Review domain and store ·
1E-7 Review and revision loop · 1E-8 Execution timeline and audit history ·
1E-9 Mission Control data exposure · 1E-10 Validation and completion notes. This ADR fixes
the architecture those tasks implement.

---

# Validation

- Full suite green (tsc, lint, tests, production build) after each task.
- Founder-request regression: service, workflow, and pre-existing routes byte-identical.
- No public API regressions (new state fields additive only).
- Each bounded loop proven to cap at 3 and then escalate.
- Idempotent replays proven safe; sweeper reclaim proven safe against late callbacks.
- Memory-default behavior unchanged.

---

# Future Considerations

- Promote WorkItem to a first-class persisted entity and rewire Project → WorkItem → Task
  (Phase 2).
- Scorecards and analytics (Sprint 1F).
- Persistence abstraction + Supabase adapters + migrations (later phase, gated).
- Real AI agents and reviewers (Phase 2), replacing the deterministic simulations.

---

# Related Documents

- ADR-0001 (Execution Manager and Agent Registry)
- `docs/plans/SPRINT_1D_EXECUTION_MANAGER.md`, `docs/plans/SPRINT_1D_COMPLETION_NOTES.md`
- Sprint 1E task list (accompanying)
- `types/contracts/*`, `types/domain/*` (existing ports and models)

---

# Approval

Decision: Accepted. Founder decisions D-E1…D-E7 and the review-policy definitions,
"Revise" reset semantics, and timeline immutability are resolved and incorporated above.

Approvers:

- Founder and CEO (Evan) — approved 2026-07-25
- Lead Software Engineer (Claude Code)
- Director of Operations

Date: 2026-07-25

Version: 1.0.0 (Accepted)
