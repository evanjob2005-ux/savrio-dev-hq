# Architecture Decision Record (ADR)

**Template ID:** TMP-003
**Document ID:** ADR-0001
**Authority:** CONST-001, AGENT-001, ORG-001

---

# Decision Information

## ADR Number

ADR-0001

## Title

Execution Manager and Agent Registry for the Dev HQ Work Management Layer

## Status

Approved

## Decision Date

2026-07-25

## Stakeholders

- Founder and CEO (Evan) — approving authority
- Lead Software Engineer (Claude Code) — author
- Director of Operations — process/governance

---

# Context

Phase 1 of Savrio Dev HQ has delivered a clean, ports-and-adapters foundation:

- Vendor-neutral contracts in `types/contracts/*` (WorkflowEngine, TaskRepository,
  ProjectRepository, WorkflowRunRepository, ApprovalManager, EventLogger,
  StateReader) — all implemented by in-memory dev adapters in
  `lib/dev-hq/adapters/*`, backed by a single global store (`lib/dev-hq/store.ts`).
- A hardened, deterministic founder-request workflow (`trigger/founder-request-workflow.ts`)
  that runs on Trigger.dev and calls back through token-guarded internal routes
  (`app/api/dev-hq/internal/*`).
- A Mission Control UI built to be honest about what is live vs. placeholder
  (`components/mission-control/*`, `lib/mission-control/*`).

Three contracts are defined but have **no implementation and are not wired into the
composition root** (`getDevHqAdapters()`): `AgentProvider`, `ExecutionRunner`,
`EvidenceStore`. The `Agent` and `Evidence` domain types exist but agents live only
as static UI placeholders (`data/placeholders/mission-control.ts`); the live state
object (`DevHqState`) has no `agents` or `evidence` collection. Tasks already carry
`assigneeAgentId` and `claimedAt`, and `Execution` carries `agentId`, but no code
path ever assigns an agent to work.

This ADR records the approved architecture for closing that gap: the **Execution
Manager** and **Agent Registry** that give the Work Management Layer the ability to
select an agent for a ready task, run a unit of work durably, and track its
lifecycle — without breaking any existing founder-request behavior or public API.

---

# Problem Statement

The Work Management Layer must own task-to-agent assignment and the agent execution
lifecycle (claim, run, heartbeat, timeout, release, retry) while preserving these
non-negotiable architectural rules:

- The Founder communicates with the Executive Orchestrator.
- The Executive Orchestrator coordinates Project Orchestrators.
- Agents do not primarily communicate directly with each other.
- All work flows through the centralized Work Management Layer, which owns task
  queues, state, dependencies, priorities, evidence, logs, retries, approvals, and
  scorecards.
- Trigger.dev is the durable workflow engine, not the entire Dev HQ product.
- Memory persistence remains the default unless Supabase is explicitly enabled.
- Existing founder-request behavior and public API shapes must not break.

The design must also make several ownership boundaries explicit so that Sprint 1E
(evidence, retries, approvals, ops controls, failure handling) is wiring rather than
redesign.

---

# Decision

Introduce the Execution Manager and Agent Registry as additive ports implemented by
in-memory dev adapters, wired into the same composition root, backed by the same
store, and dispatched through a new Trigger.dev task. The following nine decisions
are approved (D1–D9).

## D1 — Retry ownership: the retry budget belongs to the Work Management Layer / task

Trigger.dev owns transient **infra retries within a single dispatch** (network blips,
worker crashes) via its existing `maxAttempts: 3` config. The Work Management Layer
owns the **business retry budget**: attempt counting across dispatches, backoff, and
the decision to escalate when the budget is exhausted. The budget is a property of
the task/execution, never of an individual agent. The WML attempt counter increments
only when a full dispatch is exhausted (the `onFailure` / internal-fail path), never
per Trigger-internal retry, so the two retry layers never double-count.

## D2 — Workflow ownership: WorkflowEngine owns founder orchestration; Execution Manager owns agent execution

`WorkflowEngine` remains the founder-request orchestration facade and continues to
stamp `Execution` status for that flow (`agentId` stays `null` there). The new
Execution Manager (`ExecutionRunner` implementation) owns the agent-backed execution
lifecycle. The two do not overlap; a founder-request execution is never assigned an
agent, and an agent execution is never driven by the founder-request state machine.

## D3 — Execution model: keep `Execution` generic; introduce a separate `AgentAssignment`

`Execution` stays the generic unit-of-work record. Lease, heartbeat, ownership, and
attempt bookkeeping live on a new `AgentAssignment` record joined to the execution.
This avoids overloading `Execution` with agent-specific concurrency fields and keeps
founder-request executions untouched.

## D4 — Phase 1 agents: deterministic simulated agents only

Phase 1 ships a deterministic **simulated** agent that performs no real AI inference
and no code execution — mirroring the deliberately deterministic founder-request
workflow. It produces predictable results and evidence so the full lifecycle,
retry, timeout, and failure paths are testable. Real AI agents begin in Phase 2.

## D5 — Agent registry: a single canonical registry shared by UI and execution

There is one Agent Registry, backed by the store and seeded from the existing roster
identities. Both the execution engine and Mission Control read the same records, so
the UI roster and the assignment engine can never diverge. The seed reuses the ids
already hard-referenced elsewhere (e.g. `agent-executive-orchestrator`, and the
`status.ts` / placeholder ids) so derived participants reconcile to one identity.

## D6 — Capacity: one execution per agent in Phase 1

An agent has capacity 1. Availability (`available` → `busy`) is the concurrency
primitive; claiming is a compare-and-set on availability. Per-agent
`maxConcurrency > 1` is deferred.

## D7 — Persistence: memory remains the default; Supabase is strictly opt-in

All Sprint 1D–1F work runs on the in-memory store. A Supabase schema is designed as a
documentation artifact only; no migration is authored or applied in Phase 1. The
compare-and-set claim semantics are specified now so a future Supabase adapter has a
concurrency contract to meet.

## D8 — Scorecards: deferred to Phase 2

Scorecards remain a Work Management Layer responsibility but are out of Phase 1 scope
unless they become required for Phase 1 acceptance.

## D9 — Workflow simulation: kept as a permanent "Simulation Lab"

The existing mock `useWorkflowEngine` simulation is retained as a permanent, clearly
labeled "Simulation Lab" surface inside Dev HQ rather than removed. It stays visually
and structurally separate from the live command center so it cannot be mistaken for
real execution data.

---

# Follow-up Implementation Decisions (O1–O6)

These refine D1–D9 at the implementation level. O1, O2, O4 were approved by the
Founder on 2026-07-25; O3 likewise. O5 is an engineering default; O6 folds into O2.

## O1 — Execution entry point: manual dispatch via the Simulation Lab (Approved)

Phase 1 gains a token-guarded internal dispatch endpoint
(`POST /api/dev-hq/internal/execution/dispatch { taskId, requiredCapabilities }`) and
a "Dispatch to agent" control in the retained Simulation Lab (D9). The Execution
Manager selects an agent, claims, and runs. The hardened founder-request flow is
untouched and never auto-assigns agents.

## O2 — Retry budget: 3 attempts, then escalate via approval (Approved)

The Work-Management retry budget is 3 attempts per execution (each attempt may use
Trigger.dev's internal retries within its single dispatch, per D1). On exhaustion the
Execution Manager creates an ops/founder `Approval`, logs an event, and sets the task
to `needs_revision`. This subsumes the earlier "no-agent-available / escalation
target" question (O6): escalation always produces an approval + event.

## O3 — Capability vocabulary: adopt the current roster capabilities (Approved)

The Phase 1 canonical capability set is frozen as constants from the existing
placeholder roster: `routing`, `sequencing`, `escalation`, `implementation`,
`review`, `corrections`, `qa`, `accessibility`, `gates`, `validation`. This prevents
divergence between the UI roster and the selection engine. A fuller
department-mapped taxonomy is deferred to Phase 2.

## O4 — Simulated agent outcome: deterministic pass/fail from input (Approved)

The simulated agent derives its outcome from the request instructions so all paths
are exercised deterministically, with no randomness:
`instructions ~ /fail/i → failed`; `instructions ~ /timeout/i → timeout` (withholds
heartbeat to exercise reclaim); otherwise `succeeded`.

## O5 — Operational defaults (Engineering default, not founder-gated)

Lease TTL 60s; heartbeat every 15s; simulated-execution timeout 5 min; selection
tie-break = least-recently-active. Revisit when a Supabase adapter or real agents land.

## O6 — No-agent-available / escalation target

Folded into O2: no available capability match leaves the execution `queued` with a
logged event; budget exhaustion escalates via approval. No separate decision needed.

---

# Alternatives Considered

## Alternative A — Extend `Execution` with lease/heartbeat/attempt fields (no `AgentAssignment`)

### Advantages
- Fewer types; one record per unit of work.

### Disadvantages
- Overloads the generic execution record with agent-concurrency concerns.
- Blurs the D2 boundary; founder-request executions would carry meaningless lease
  fields. Rejected in favor of D3.

## Alternative B — Let Trigger.dev own the entire retry budget

### Advantages
- No WML retry code; simplest.

### Disadvantages
- Violates the rule that the Work Management Layer owns retries; makes escalation,
  reassignment, and attempt policy invisible to Dev HQ. Rejected in favor of D1.

## Alternative C — Real AI agents in Phase 1

### Advantages
- Demonstrates end-to-end product value sooner.

### Disadvantages
- Non-deterministic, hard to test, introduces provider dependencies, cost, and
  security surface before the execution spine is proven. Rejected in favor of D4.

## Alternative D — Remove the mock workflow simulation

### Advantages
- One fewer parallel system on the page.

### Disadvantages
- Loses a useful demo/teaching surface. Founder chose to keep it as a labeled
  Simulation Lab (D9).

---

# Decision Drivers

- Maintainability and clear ownership boundaries
- Reliability (deterministic, testable execution spine)
- Simplicity (smallest complete solution; additive, non-breaking)
- Developer experience (memory-first, no infra to run tests)
- Preservation of approved founder-request behavior and public API shapes

---

# Expected Consequences

## Positive

- The Work Management Layer gains a real execution engine with explicit ownership of
  assignment, lifecycle, and retries.
- Mission Control lights up with live agent and execution data via a small prop
  change, because the UI seams were pre-cut.
- Sprint 1E becomes wiring (evidence kinds, retry policy, ops controls) on top of a
  proven lifecycle rather than a redesign.

## Negative

- Two retry layers (Trigger + WML) require a disciplined, documented boundary to
  avoid double-counting.
- Concurrency correctness is trivial in memory but must be re-verified when a Supabase
  adapter is introduced.

## Risks

- Conflating Execution Manager with WorkflowEngine (mitigated by D2).
- Retry storms if D1's boundary is not enforced in code and tests.
- Simulated agents masking gaps that only real agents will expose in Phase 2
  (accepted; explicitly disclosed).

---

# Impact Assessment

## Product

No change to founder-facing behavior in Phase 1. New execution board and live roster
surface in Sprint 1F. Simulation Lab preserved (D9).

## Engineering

New ports (`AgentProvider`, extended `ExecutionRunner`), new adapters, a new domain
type (`AgentAssignment`), store additions (`agents`, `agentAssignments`), and a new
Trigger task with internal callbacks. All additive; founder-request flow untouched.

## Database

None executed. A Supabase schema sketch (`agents`, `agent_assignments`, evidence,
extended executions) is produced as design-only documentation (D7).

## Infrastructure

One new Trigger.dev task (`agent-execution`) and, in Sprint 1E, a scheduled sweeper
for stale-lease reclamation. Reuses existing internal-callback auth.

## Security

New internal routes reuse `rejectInternalDevRequest` (fail-closed: 403 in prod, 503
without token, 401 on mismatch). No new secrets. Public agent/execution reads expose
no sensitive data.

## Operations

Ops controls (pause/resume/cancel/reprioritize/reassign) land in Sprint 1E and build
on the D2/D3 lifecycle.

---

# Implementation Plan

See `docs/plans/SPRINT_1D_EXECUTION_MANAGER.md` for the full Sprint 1D task breakdown.
Summary sequence:

1. Domain + contract extensions (`AgentAssignment`, extended `ExecutionRunner`) — types only.
2. Store + state additions (`agents`, `agentAssignments`, seed registry, `agents` on `DevHqState`).
3. Agent Registry (`AgentProvider` adapter + selection/availability helpers).
4. Execution Manager (`ExecutionRunner` adapter + assign/claim/heartbeat/release/timeout).
5. Wire composition root + public `GET /api/dev-hq/agents`.
6. Trigger.dev boundary (`agent-execution` task + `internal/execution/*` callbacks).
7. Optional UI touch (roster reads live `state.agents`).
8. Validate (tests, lint, tsc, founder-request regression green).

---

# Validation

- `getDevHqAdapters()` returns working `agentProvider` and `executionRunner`.
- A task is assigned to a capability-matching available agent; agent flips
  `available → busy` on claim and back on release.
- An execution runs end-to-end through the `agent-execution` Trigger task and records
  Execution transitions, an Event per transition, and at least one Evidence(log).
- WML attempt counting is independent of Trigger's internal retries (D1).
- Entire existing founder-request regression suite passes unchanged.
- `npm test`, `npm run lint`, and `tsc` are clean.

---

# Future Considerations

- Phase 2: real AI agents (provider adapters behind `AgentProvider`), scorecards,
  optional Supabase persistence, per-agent `maxConcurrency`, project-orchestrator
  assignment.
- Sprint 1E: `EvidenceStore` implementation, WML retry-policy engine, execution-level
  approvals, ops controls, stale-lease sweeper.

---

# Related Documents

- `docs/plans/SPRINT_1D_EXECUTION_MANAGER.md` (Technical Plan / task breakdown)
- `AGENTS.md`, `docs/company/ORGANIZATION.md` (authority and hierarchy)
- `types/contracts/*`, `types/domain/*` (existing ports and models)

---

# Approval

Decision: Approved

Approvers:

- Founder and CEO (Evan) — approved the D1–D9 defaults on 2026-07-25
- Lead Software Engineer (Claude Code)
- Director of Operations

Date: 2026-07-25

Version: 1.0.0
