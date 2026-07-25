# Technical Plan — Sprint 1E: Reliability, Evidence, Review Loops & Audit

**Template ID:** TMP-002
**Owner:** Lead Software Engineer (Claude Code)
**Authority:** ADR-0002
**Status:** Approved architecture; implementation not started
**Date:** 2026-07-25

---

# Overview

## Feature

Sprint 1E hardens and completes the Work Management Layer around the 1D execution spine:
lifecycle event emission, evidence records, callback idempotency, a scheduled stale-lease
sweeper, agent health freshness, a first-class escalation queue, a deterministic review
and revision loop, and an immutable execution timeline / audit history.

## Objective

Make execution trustworthy and auditable, quality-check completed work within hard
bounds, and escalate to the founder when automation is exhausted — all additively, with
the founder-request workflow and public API shapes preserved, memory as the only backend,
and simulated deterministic agents/reviewers only.

## Related Decisions

ADR-0002 (E1–E9, resolving D-E1…D-E7). See
`docs/decisions/ADR-0002-review-escalation-and-work-management.md`.

---

# Architecture

## Components

- Domain: `Review`, `ReviewFinding`, `ReviewStatus`, `ReviewPolicy`; `Escalation`.
- Contracts: `ReviewStore`, `EscalationStore` (plus the existing `EvidenceStore`,
  implemented this sprint).
- Adapters: `dev-evidence-store`, `dev-review-store`, `dev-escalation-store`; enhanced
  `dev-agent-provider` (health freshness).
- Services: `review-service`, `escalation-service`; event/evidence emission and
  idempotency in `agent-execution-service`.
- Store: `evidence`, `reviews`, `escalations` collections; matching `DevHqState` fields.
- Trigger.dev: `agent-review` (simulated reviewer), `execution-sweeper` (scheduled).
- Read-model: execution timeline / audit history in the Mission Control view-model.
- API: internal review + reclaim callbacks; public founder escalation-resolution routes.

## Data Flow

```
dispatch (reviewPolicy default "basic")
  -> Execution Manager: assign -> claim -> run -> succeeded
       (retry loop: up to 3 attempts on failed/timeout; each attempt a new AgentAssignment)
  -> if reviewPolicy != none: review-service starts a Review (iteration N)
       -> agent-review task (simulated): /block/i -> blocking, /revise/i -> advisory, else pass
       -> blocking finding -> revision = NEW Execution (fresh 3-attempt budget), iteration N+1
       -> review iterations capped at 3
  -> exhaustion (retry or review) -> escalation-service raises one Escalation,
       task -> needs_revision, event + evidence
  -> founder resolves Escalation: revise (reset review counter to 0 + new execution) |
       abandon (task rejected) | accept (task completed)
Every transition -> Event (service layer) + append-only Evidence; all merged into the
immutable execution timeline (derived read-model).
```

## External Services

- Trigger.dev (durable dispatch, review, and scheduled sweep). No other integrations.
- Supabase: **not used** (deferred to a later phase, ADR-0002 E9 / D-E5).

---

# Definition of Done

The following applies to **every** implementation task, 1E-1 through 1E-10. A task is not
done until all of these hold:

- TypeScript passes (`npx tsc --noEmit`).
- Lint passes (`npm run lint`).
- All tests pass (`npm test`).
- Production build succeeds when appropriate (`npm run build`).
- Founder-request behavior remains unchanged.
- No breaking public API changes; additive changes only.
- The implementation report includes `git diff --stat`.
- The implementation report includes `git status --short`.
- Implementation work is **not** committed until review approval.
- Stop for review after completing the task.

---

# Implementation Plan (approved task order)

Each task is independently reviewable and testable; the founder-request suite must stay
green after every task. Side effects (events, evidence, escalation) live in the service
layer; the Execution Manager core stays pure. Every task below is subject to the
**Definition of Done** above.

## Task 1E-1 — Events + Evidence
- Emit one typed `Event` per execution transition via `EventLogger` from the service
  layer (no per-heartbeat events).
- Implement `EvidenceStore` (`dev-evidence-store`), add the `evidence` store collection
  and `DevHqState.evidence`, wire the composition root, and emit ≥1 `Evidence(kind:"log")`
  per execution outcome.
- **Acceptance:** correct event per transition; `evidenceStore` wired and queryable by
  task/execution; `DevHqState.evidence` populated; founder-request events unchanged.
- **Depends on:** none.

## Task 1E-2 — Callback idempotency
- Make `running`/`complete` handlers replay-safe, keyed by `assignmentId`/attempt; thread
  `assignmentId` through the Trigger task and the running/complete payloads.
- **Acceptance:** replayed `running` on an already-claimed execution returns it (no throw,
  no double-claim); replayed `complete` on a terminal/superseded attempt no-ops; all 1D-5
  retry tests still green.
- **Depends on:** 1E-1.

## Task 1E-3 — Scheduled lease sweeper
- Add a Trigger scheduled `execution-sweeper` task and a token-guarded
  `/api/dev-hq/internal/execution/reclaim` route; the handler runs `reclaimStale()`, emits
  reclaim events, and re-dispatches reclaimed retries.
- **Acceptance:** expired-lease executions reclaimed and re-dispatched within budget; a
  late `complete` after reclaim is safe (relies on 1E-2); interval matched to lease TTL.
- **Depends on:** 1E-1, 1E-2.

## Task 1E-4 — Agent health freshness
- Enhance `healthCheck` to factor `lastActiveAt` / lease staleness into the health signal;
  add a freshness-threshold constant.
- **Acceptance:** a stale-heartbeat or expired-lease agent is reported degraded; fresh +
  available reports healthy; contract shape unchanged.
- **Depends on:** none.

## Task 1E-5 — Escalations
- New `Escalation` domain + `EscalationStore` contract + `dev-escalation-store` adapter;
  `escalations` store collection + `DevHqState.escalations`.
- `escalation-service`: raise on retry/review exhaustion (task -> `needs_revision`, event +
  evidence); founder resolution — **revise** (reset review-iteration counter to zero +
  authorize a new execution with a fresh 3-attempt budget), **abandon** (task rejected),
  **accept** (task completed). Public founder routes mirror the approval routes:
  `POST /api/dev-hq/escalations/[id]/{revise,abandon,accept}` and
  `GET /api/dev-hq/escalations`.
- **Acceptance:** exhaustion raises exactly one escalation with correct origin; resolution
  verbs produce correct task states; revise re-dispatches with reset counters; separate
  from the founder-request approval queue and its wait-token invariant.
- **Depends on:** 1E-1, 1E-2.

## Task 1E-6 — Review domain and store
- New `Review`, `ReviewFinding`, `ReviewStatus`, `ReviewPolicy` domain; `ReviewStore`
  contract + `dev-review-store` adapter; `reviews` store collection + `DevHqState.reviews`.
- Constants: `MAX_REVIEW_ITERATIONS = 3`; review keyword mapping.
- **Acceptance:** reviews/findings creatable and queryable by task/execution; policy
  modeled (`none`/`basic`/`full`); additive state shape.
- **Depends on:** 1E-1, 1E-2.

## Task 1E-7 — Review and revision loop
- `review-service` orchestration + a durable Trigger `agent-review` task (deterministic
  simulated reviewer) with token-guarded `/api/dev-hq/internal/review/*` callbacks.
- `agent-execution-service` hands successful executions to review per `reviewPolicy`
  (default `basic`; dispatch input + dispatch route + server action accept an override).
  Reviewer outcomes: `/block/i` -> blocking + revision, `/revise/i` -> advisory note,
  otherwise pass. `basic` runs one lens; `full` runs multiple lenses within one iteration.
  A blocking finding creates a **new Execution** (fresh 3-attempt budget) as the revision;
  review iterations cap at 3, then escalate via 1E-5.
- **Acceptance:** blocking finding drives a revision; iteration counter bounded at exactly
  3 then escalation (`review_exhausted`); `none` skips review; `basic`/`full` distinct lens
  counts; every step flows through the WML (no agent-to-agent contact).
- **Depends on:** 1E-5, 1E-6, 1E-1, 1E-2.

## Task 1E-8 — Execution timeline and audit history
- Derived read-model merging events, evidence, `AgentAssignment` transitions,
  reviews/findings, and escalations by timestamp per execution/task. Immutable and
  append-only — corrections/retries/reviews/revisions append new entries, never modify
  prior history.
- **Acceptance:** timeline merges all record types in stable chronological order; purely
  derived (no new store); append-only property holds.
- **Depends on:** 1E-1, 1E-5, 1E-7.

## Task 1E-9 — Mission Control data exposure
- Ensure `DevHqState` additively carries evidence, reviews, escalations, and the timeline
  read-model; extend the view-model where trivial. **No new UI panels** (the Evidence/Audit,
  Escalations queue, and review surfaces are Sprint 1F).
- **Acceptance:** `GET /api/dev-hq/state` additively exposes the new collections; existing
  view-model unaffected where not extended; production build green; 1F handoff documented.
- **Depends on:** 1E-4, 1E-8.

## Task 1E-10 — Validation and completion notes
- Full suite (tsc, lint, tests, production build), founder-request regression, no
  public-API regression check, and Sprint 1E completion notes (documentation-only commit).
- **Depends on:** all.

---

# Files Affected

New:

- `types/domain/review.ts`, `types/domain/escalation.ts`
- `types/contracts/review-store.ts`, `types/contracts/escalation-store.ts`
- `lib/dev-hq/adapters/dev-evidence-store.ts`, `dev-review-store.ts`, `dev-escalation-store.ts`
- `lib/dev-hq/review-service.ts`, `lib/dev-hq/escalation-service.ts`
- `lib/dev-hq/timeline.ts` (or a view-model addition)
- `trigger/agent-review.ts`, `trigger/execution-sweeper.ts`
- `app/api/dev-hq/internal/execution/reclaim/route.ts`
- `app/api/dev-hq/internal/review/*/route.ts`
- `app/api/dev-hq/escalations/route.ts`, `app/api/dev-hq/escalations/[id]/{revise,abandon,accept}/route.ts`
- matching `*.test.ts`

Modified:

- `lib/dev-hq/agent-execution-service.ts` (events, evidence, idempotency, escalation-on-exhaustion, review hand-off, `reviewPolicy`)
- `lib/dev-hq/store.ts`, `lib/dev-hq/types.ts` (new collections + `DevHqState` fields)
- `lib/dev-hq/adapters/index.ts` (wire `evidenceStore`, `reviewStore`, `escalationStore`)
- `lib/dev-hq/adapters/dev-agent-provider.ts` (health freshness)
- `lib/dev-hq/constants.ts` (`MAX_REVIEW_ITERATIONS`, review keywords, freshness threshold, event types)
- `types/domain/index.ts`, `types/contracts/index.ts` (exports); possibly `types/domain/event.ts`
- `app/api/dev-hq/internal/execution/{running,complete}/route.ts` (idempotency payload)
- `lib/dev-hq/actions.ts`, `app/api/dev-hq/internal/execution/dispatch/route.ts` (accept `reviewPolicy`)
- `lib/mission-control/view-model.ts` (timeline/data extensions)
- `trigger.config.ts` (only if a schedule declaration is required)

Explicitly unchanged: `lib/dev-hq/founder-request-service.ts`, `trigger/founder-request-workflow.ts`,
all pre-existing founder-request/approval/state/events routes, the `WorkflowEngine`
adapter, and the pure `execution-manager.ts` core.

---

# Database Impact

None. No schema, no migrations — persistence abstraction and Supabase are deferred to a
later phase (ADR-0002 E9 / D-E5). No dependencies installed.

---

# API Changes

New internal (token-guarded, fail-closed, prod-disabled):

- `POST /api/dev-hq/internal/execution/reclaim`
- `POST /api/dev-hq/internal/review/*` (review lifecycle callbacks)

New public (founder-facing, mirroring the approval routes):

- `GET /api/dev-hq/escalations`
- `POST /api/dev-hq/escalations/[id]/{revise,abandon,accept}`

Extended (additive only): the internal dispatch route and the dispatch server action
accept an optional `reviewPolicy`; `running`/`complete` callbacks accept `assignmentId`.
`/api/dev-hq/state` additively gains `evidence`, `reviews`, `escalations`.

Removed / changed existing shapes: none.

---

# Security Considerations

- New internal routes reuse `rejectInternalDevRequest` (403 prod / 503 no token / 401
  mismatch). Worker callbacks use `getDevHqInternalHeaders()`.
- Founder escalation-resolution routes are public, mirroring the existing approval routes;
  `revise` re-dispatch runs server-side (token never exposed to the browser).
- Simulated reviewer executes no untrusted code and makes no external calls.

---

# Performance Considerations

- In-memory maps; O(n) scans acceptable at dev scale. `DevHqState` grows with evidence/
  reviews/escalations — additive; consider pagination in Sprint 1F if the polled `/state`
  payload becomes large.
- The sweeper runs on a bounded interval matched to the lease TTL.

---

# Risks

- Idempotency ↔ sweeper double-processing — sequence 1E-2 before 1E-3.
- Unbounded review/revision if the 3-iteration cap is not strictly enforced.
- Escalation `revise` re-dispatch must reset the review counter and start a fresh retry
  budget explicitly and safely.
- `DevHqState` growth (additive but larger payload).

---

# Dependencies

- Internal: the 1D execution spine, registry, adapters, contracts (all present).
- External: `@trigger.dev/sdk` (already installed) — no new dependency.
- Infrastructure: Trigger.dev dev worker for the review and sweeper smoke tests.

---

# Testing Plan

- Unit: event/evidence emission; idempotent replays; sweeper reclaim + re-dispatch; health
  freshness; escalation raise/resolve; review outcomes and the bounded revision loop;
  timeline merge/append-only.
- Integration: Trigger `agent-review` + `execution-sweeper` via mocked SDK (mirroring the
  1D-5 hoisted-mock pattern).
- Regression: full founder-request suite unchanged; production build green.
- Failure scenarios: retry exhaustion -> escalation; review exhaustion -> escalation;
  reclaim of a stalled run; revise reset.

---

# Rollback Strategy

All work is additive and behind new ports/files/collections. Rollback = remove the new
adapters from `getDevHqAdapters()`, drop the new collections, and delete the new files;
the founder-request flow and the 1D execution spine are unaffected.

---

# Open Questions

None outstanding. The review-policy definitions (none/basic/full), the "Revise" reset
semantics, and the review-iteration-state location were resolved by the founder and are
recorded in ADR-0002. `WorkItem` is explicitly not implemented in Sprint 1E.

---

# Review Checklist

- Architecture follows ADR-0002 and the ports-and-adapters pattern
- Founder-request behavior and public API shapes preserved
- Security (internal-route guard) reviewed
- No migrations; memory default preserved; no dependencies added
- Documentation updated (this plan + ADR-0002)

---

# Approval

Lead Software Engineer: Claude Code
Date: 2026-07-25
Version: 1.0.0
