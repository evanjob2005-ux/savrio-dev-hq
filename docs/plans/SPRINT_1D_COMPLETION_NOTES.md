# Sprint 1D — Completion Notes

**Authority:** ADR-0001
**Plan:** `docs/plans/SPRINT_1D_EXECUTION_MANAGER.md`
**Status:** Validated and complete (Task 1D-7)
**Date:** 2026-07-25
**Branch tip at completion:** `7a6a15c` (Task 1D-6)

---

## Summary

Sprint 1D delivered the Work Management Layer's execution spine — Agent Registry,
Execution Manager (assign, atomic claim/release, lease, heartbeat, stale reclaim,
3-attempt retry budget), the Trigger.dev `agent-execution` task with token-guarded
callbacks, the manual Simulation Lab dispatch (via a server-only path), and the live
Mission Control roster.

Validation (Task 1D-7) passed the full suite with no production-code changes:

- `npx tsc --noEmit` — clean
- `npm run lint` — clean
- `npm test` — 70/70 across 10 files (incl. the 9 unchanged founder-request tests)
- `npm run build` — production build succeeds; all routes compile
- Founder-request service, workflow, and all pre-existing routes are byte-identical
  to the Sprint 1C tip (`d5e50e5`); no public API regressions (the only shape changes
  are additive: `DevHqState.agents` and a nullable `Execution.workflowId`).

The items below were surfaced or confirmed during validation. They are **intentional
follow-up work, not incomplete implementation** — the delivered functionality is
complete and tested without them.

---

## Validated deferrals to Sprint 1E

### Reliability — callback idempotency

`handleExecutionRunning` (claim) and `handleExecutionComplete` (release) require the
execution to be in a specific state and throw on replay. A Trigger.dev infra-retry
that replays `run()` on an already-claimed or already-completed execution would
therefore error rather than no-op.

- **Impact:** low today — retries are disabled in dev (`trigger.config.ts`
  `enabledInDev: false`) and the localhost simulated callbacks do not fail.
- **Follow-up:** make the `running`/`complete` callbacks idempotent (replay-safe),
  mirroring the founder-request workflow's idempotency guarantees. Belongs with
  Sprint 1E **reliability / failure handling**.
- **Rationale for deferral:** infra-retry hardening is Sprint 1E's failure-handling
  scope; the 3-attempt Work-Management retry budget itself is delivered and tested.

### Observability — heartbeat freshness in health checks

`DevAgentProvider.healthCheck` reports health from `availability` only; it does not
yet factor `lastActiveAt` / lease staleness into a freshness signal.

- **Impact:** none on execution correctness; health is currently a coarse
  available/offline signal.
- **Follow-up:** incorporate heartbeat/lease freshness into the health result.
  Belongs with Sprint 1E **observability**.
- **Rationale for deferral:** freshness-based health is an observability concern that
  pairs naturally with the 1E lease sweeper and event/evidence work.

---

## Previously agreed deferrals (approved during the sprint)

These were deferred by explicit decision during Tasks 1D-3 / 1D-5 and are recorded
here for completeness:

- **Event emission** per execution lifecycle transition → Sprint 1E.
- **Evidence emission** (≥1 `Evidence(kind:"log")` per execution) → Sprint 1E
  (requires the 1E `EvidenceStore`).
- **Retry escalation side effects** — on budget exhaustion, create an Approval and set
  the task to `needs_revision` (ADR-0001 O2). Sprint 1D implements budget *accounting*
  only → Sprint 1E.
- **Scheduled stale-lease sweeper** — `reclaimStale()` exists and is tested; the
  scheduled Trigger task that auto-invokes it (and thus genuine abandoned-run recovery
  via lease expiry) → Sprint 1E.

## Deferred to Sprint 1F (not 1E)

- Connected-services panel still reads `MISSION_CONTROL_PLACEHOLDERS.connectedServices`;
  live wiring is Sprint 1F.

---

## Validation limitation on record

Live end-to-end execution through a running Trigger.dev worker (`trigger dev` +
`next dev` + credentials) and browser interaction were **not** exercised in the
automated 1D-7 validation. The dispatch → callback → retry logic is fully unit-tested,
the `agent-execution` task compiles and is registered under `trigger.config.ts`, and
the production build succeeds — but an actual cloud run was not performed. Recommended
as a manual smoke test when convenient; it does not block Sprint 1D closure.
