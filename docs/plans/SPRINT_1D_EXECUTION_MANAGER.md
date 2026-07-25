# Technical Plan — Sprint 1D: Execution Manager & Agent Registry

**Template ID:** TMP-002
**Owner:** Lead Software Engineer (Claude Code)
**Authority:** ADR-0001
**Status:** Approved architecture; implementation not started
**Date:** 2026-07-25

---

# Overview

## Feature

Execution Manager and Agent Registry for the Dev HQ Work Management Layer.

## Objective

Give the Work Management Layer the ability to select an agent for a ready task, claim
it under a lease, dispatch a unit of work durably through Trigger.dev, track its
lifecycle (heartbeat/timeout), and release it — recording executions, events, and
evidence stubs — using deterministic simulated agents. No real AI or code execution.

## Related Decisions

ADR-0001 (D1–D9). See `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md`.

---

# Architecture

## Components

- Domain types: new `AgentAssignment`; additive optional fields on `Execution`.
- Contracts: extended `ExecutionRunner`; existing `AgentProvider` implemented.
- Adapters: `dev-agent-provider`, `dev-execution-runner`.
- Services: `agent-registry`, `execution-manager` (use-case layer).
- Store: `agents` and `agentAssignments` maps; `agents` on `DevHqState`.
- Trigger.dev: `agent-execution` task.
- API routes: internal `execution/{running,heartbeat,complete}`; public `GET /agents`.
- UI (optional in 1D): roster reads live `state.agents`.

## Data Flow

```
Work Management Layer
  execution-manager.assign(taskId)
    → agent-registry.select(requiredCapabilities)   (capability ∩ availability)
    → create Execution (generic) + AgentAssignment (lease)   [D3]
    → claim: compare-and-set agent available→busy           [D6]
    → tasks.trigger("agent-execution", {executionId, ...})   [Trigger boundary]
        → simulated work + heartbeat POST /internal/execution/heartbeat
        → result POST /internal/execution/complete
    → release: agent busy→available; record Event + Evidence(log)
Retry budget owned by WML/task; incremented only on exhausted dispatch  [D1]
```

## External Services

- Trigger.dev (durable dispatch + heartbeat callbacks). No other integrations.
- Supabase: NOT used (memory default, D7). Schema is design-only.

---

# Implementation Plan (task ladder)

Tasks are ordered so each is independently reviewable and the risk-bearing core
(1D-2 … 1D-4) is fully testable without Trigger.dev. Founder-request behavior must
stay green after every task.

## Task 1D-1 — Domain + store foundation (zero behavior change) — RECOMMENDED FIRST

- Add `types/domain/agent-assignment.ts` (`AgentAssignment`).
- Add optional, nullable fields to `types/domain/execution.ts`: `assignmentId`,
  `attempt` (default reasoning lives on the assignment; execution keeps a pointer).
- Extend `types/contracts/execution-runner.ts` (types only — see "API/Contract
  Changes"). No implementation yet.
- Add capability constants to `lib/dev-hq/constants.ts`.
- Store: add `agents: Map`, `agentAssignments: Map` to `DevHqStoreData`
  (`lib/dev-hq/types.ts`); seed the registry from the roster identities; add
  `saveAgent` / `saveAssignment`; include `agents` in `DevHqState` and
  `buildDevHqState()` (`lib/dev-hq/store.ts`).
- Export new types from `types/domain/index.ts` and `types/contracts/index.ts`.
- **Out of scope:** selection logic, claim/heartbeat behavior, Trigger task, routes.
- **Acceptance:** `tsc` + `npm run lint` clean; `buildDevHqState()` returns seeded
  `agents`; the entire existing founder-request regression suite passes unchanged;
  no public route or founder-request behavior changes.
- **Depends on:** nothing. **Enables:** all subsequent 1D tasks + immediate live UI roster.

## Task 1D-2 — Agent Registry

- `lib/dev-hq/agent-registry.ts`: capability/availability queries, deterministic
  selection policy (available ∩ required capabilities; tie-break least-recently-active).
- `lib/dev-hq/adapters/dev-agent-provider.ts`: `AgentProvider` (`listAgents`,
  `getAgent`, `execute` → delegates to Execution Manager, `healthCheck`).
- **Acceptance:** selection unit tests (match, availability filter,
  no-agent-available, deterministic tie-break); health check reflects availability +
  heartbeat freshness.
- **Depends on:** 1D-1.

## Task 1D-3 — Execution Manager (in-memory, no Trigger yet)

- `lib/dev-hq/execution-manager.ts` + `lib/dev-hq/adapters/dev-execution-runner.ts`:
  `assignExecution`, `claimExecution` (compare-and-set availability), `heartbeat`,
  `releaseExecution`, `reclaimStale`, plus existing `queue/run/cancel/getExecution`.
- Emit an `Event` per transition and at least one `Evidence(kind:"log")` per
  execution (write path stubbed for Sprint 1E to extend).
- **Acceptance:** lifecycle tests (queue→assign→claim→running→succeeded; failure;
  cancel); claim exclusivity (busy agent not double-claimed; release restores
  availability); stale-lease detection; timeout marks execution `failed` without
  inventing a business decision.
- **Depends on:** 1D-1, 1D-2.

## Task 1D-4 — Wire composition root + public read

- `lib/dev-hq/adapters/index.ts`: add `agentProvider` and `executionRunner` to
  `DevHqAdapters` and `getDevHqAdapters()`.
- `app/api/dev-hq/agents/route.ts`: public `GET` returning the live roster.
- **Acceptance:** `getDevHqAdapters()` exposes both new ports; `GET /agents` returns
  seeded agents; `resetDevHqAdapters()` still works for tests.
- **Depends on:** 1D-2, 1D-3.

## Task 1D-5 — Trigger.dev boundary

- `trigger/agent-execution.ts`: durable task performing deterministic simulated work,
  heartbeating, and posting the result.
- `app/api/dev-hq/internal/execution/running/route.ts`,
  `.../heartbeat/route.ts`, `.../complete/route.ts`: token-guarded callbacks reusing
  `rejectInternalDevRequest` and `getDevHqInternalHeaders`.
- **Acceptance:** an execution runs end-to-end through Trigger and records running →
  heartbeat(s) → complete; replayed `running`/`complete` callbacks are idempotent
  (mirrors founder-request idempotency tests); WML attempt count independent of
  Trigger retries (D1).
- **Depends on:** 1D-3, 1D-4.

## Task 1D-6 — Optional UI touch (low-risk)

- Point `AgentRosterPanel.declaredRoster` (`components/dashboard/MissionControlOverview.tsx:195`)
  at live `state.agents`; flip its `DataSourceBadge` from placeholder to live.
- **Acceptance:** roster renders from live state; no console/type errors; a11y intact.
- **Depends on:** 1D-1 (state has `agents`). Independent of 1D-5.

## Task 1D-7 — Validation & handoff

- Run `npm test`, `npm run lint`, `tsc`; Trigger dev smoke test of both workflows.
- Write handoff notes per AGENTS.md Handoff Standards; update ADR-0001 status if needed.

---

# Files Affected

New:

- `types/domain/agent-assignment.ts`
- `lib/dev-hq/agent-registry.ts`
- `lib/dev-hq/execution-manager.ts`
- `lib/dev-hq/adapters/dev-agent-provider.ts`
- `lib/dev-hq/adapters/dev-execution-runner.ts`
- `trigger/agent-execution.ts`
- `app/api/dev-hq/agents/route.ts`
- `app/api/dev-hq/internal/execution/running/route.ts`
- `app/api/dev-hq/internal/execution/heartbeat/route.ts`
- `app/api/dev-hq/internal/execution/complete/route.ts`
- `lib/dev-hq/execution-manager.test.ts`, `lib/dev-hq/agent-registry.test.ts`,
  `lib/dev-hq/adapters/dev-execution-runner.test.ts`

Changed:

- `types/domain/execution.ts`, `types/domain/index.ts`
- `types/contracts/execution-runner.ts`, `types/contracts/index.ts`
- `lib/dev-hq/store.ts`, `lib/dev-hq/types.ts`, `lib/dev-hq/constants.ts`
- `lib/dev-hq/adapters/index.ts`
- `data/placeholders/mission-control.ts` (registry seed source of truth)
- `components/dashboard/MissionControlOverview.tsx` (optional, 1D-6)

Unchanged (must remain so): all founder-request routes and service, the
`internal/{executive-review,approval-gate,finalize,fail}` routes, `WorkflowEngine`
adapter behavior, and every existing public API response shape.

---

# Database Impact

None executed (D7). Design-only Supabase sketch for later phases:

- `agents` (id, name, role, provider, availability, capabilities, …)
- `agent_assignments` (id, execution_id, agent_id, task_id, status, lease_expires_at,
  last_heartbeat_at, attempt, claimed_at, released_at)
- `executions` additive columns mirroring the new optional domain fields
- Claim implemented as a conditional UPDATE (compare-and-set on availability)

No migration authored or applied.

---

# API Changes

New public:

- `GET /api/dev-hq/agents` → `{ agents: Agent[] }` (read-only)

New internal (token-guarded, fail-closed, prod-disabled):

- `POST /api/dev-hq/internal/execution/running` → `{ executionId, triggerRunId? }`
- `POST /api/dev-hq/internal/execution/heartbeat` → `{ executionId }`
- `POST /api/dev-hq/internal/execution/complete` → `{ executionId, result }`

Contract (type) change — extended `ExecutionRunner`:

```
listReadyWork(): Promise<Task[]>
assignExecution(taskId, policy?): Promise<AssignmentDecision>
claimExecution(executionId, agentId): Promise<Execution>
heartbeat(executionId): Promise<Execution>
releaseExecution(executionId, result): Promise<Execution>
reclaimStale(now): Promise<Execution[]>
// retained: queueExecution, runExecution, cancelExecution, getExecution
```

Removed endpoints: none. Changed request/response shapes on existing endpoints: none.

---

# Security Considerations

- New internal routes reuse `rejectInternalDevRequest` (403 prod / 503 no token /
  401 mismatch / allow only on exact `x-dev-hq-internal-token` match).
- Worker → Next.js callbacks use `getDevHqInternalHeaders()`.
- Public `GET /agents` exposes no secrets or sensitive data.
- Simulated agents execute no untrusted code and make no external calls (D4).

---

# Performance Considerations

- In-memory maps; O(n) scans acceptable at dev scale.
- Heartbeat interval and lease TTL are bounded constants (proposed defaults pending —
  see Open Questions).
- Trigger `maxDuration` (3600s) already configured; simulated work is short.

---

# Risks

- Retry double-counting across Trigger + WML (mitigated by D1 boundary + tests).
- Execution Manager vs WorkflowEngine conflation (mitigated by D2).
- Concurrency correctness only exercised in single-process memory; Supabase adapter
  must re-verify the compare-and-set claim.

---

# Dependencies

- Internal: existing store, adapters, contracts (all present).
- External: `@trigger.dev/sdk` (already installed — no new dependency).
- Infrastructure: Trigger.dev dev worker for 1D-5 smoke test.

---

# Testing Plan

- Unit: selection policy, lifecycle transitions, claim exclusivity, heartbeat/timeout,
  retry-budget accounting, state snapshot includes agents.
- Integration: Trigger `agent-execution` end-to-end with mocked SDK (mirroring
  `founder-request-service.test.ts` hoisted mocks).
- Idempotency: replayed running/complete callbacks are no-ops.
- Regression: full existing founder-request suite unchanged.
- Failure scenarios: no-agent-available, dispatch failure, timeout reclaim, cancel.

---

# Rollback Strategy

All work is additive and behind new ports/files. Rollback = remove the new adapters
from `getDevHqAdapters()` and delete new files; founder-request flow is unaffected
because it never depends on the new ports.

---

# Open Questions

All resolved — see ADR-0001 "Follow-up Implementation Decisions (O1–O6)". Approved
2026-07-25:

- O1: manual dispatch via a token-guarded `internal/execution/dispatch` endpoint + a
  "Dispatch to agent" control in the Simulation Lab. Adds these to Task 1D-5.
- O2: WML retry budget = 3 attempts; exhaustion → create Approval + event + task
  `needs_revision`. Adds retry-budget accounting to Task 1D-3 (policy engine formalized
  in Sprint 1E).
- O3: freeze roster capabilities as constants (Task 1D-1).
- O4: simulated outcome is deterministic from instructions (`/fail/i`, `/timeout/i`,
  else success) — Task 1D-5.
- O5 (engineering default): lease 60s, heartbeat 15s, timeout 5 min, tie-break
  least-recently-active.
- O6: folded into O2.

No open questions block Task 1D-1.

---

# Review Checklist

- Architecture follows ports-and-adapters and ADR-0001
- Founder-request behavior and public API shapes preserved
- Security (internal-route guard) reviewed
- No migration applied; memory default preserved
- Documentation updated (this plan + ADR-0001)

---

# Approval

Lead Software Engineer: Claude Code
Date: 2026-07-25
Version: 1.0.0
