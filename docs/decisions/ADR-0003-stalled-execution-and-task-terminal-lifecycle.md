# Architecture Decision Record

**Template ID:** TMP-003  
**Document ID:** ADR-0003  
**Authority:** CONST-001, AGENT-001, ADR-0001, ADR-0002

---

# Decision Information

## ADR Number

ADR-0003

## Title

Stalled Execution Resolution and Authoritative Task Terminal States

## Status

Approved. Supersedes ADR-0001 O6 and extends ADR-0002 E2 where this record
explicitly says so. ADR-0001 and ADR-0002 remain immutable historical records.

The authorization basis is the Founder's 2026-07-29 instruction to resolve the
eight decisions recorded in `docs/plans/OPEN_AT_HANDOFF.md` section 3: **“do
these, all of them.”** This ADR records only the Batch 1 lifecycle decisions
among those eight; it does not claim approval for unrelated architecture.

## Decision Date

2026-07-29

## Stakeholders

- Founder and CEO (Evan) — approving authority
- Engineering — implementation owner
- Director of Operations — process and governance

---

# Context

ADR-0001 O6 made “no agent available” a resting state: the execution remains
`queued`, a deferral event is recorded, and no business attempt is consumed.
That remains correct while capacity is expected to return, but it supplied no
terminal path when the only capable agent left the roster. Such work could
neither run nor spend its retry budget, so it could never complete, fail, or
reach ADR-0002’s Founder escalation.

The provisional implementation introduced a queue-stall deadline, the
`queue_stalled` escalation origin, and cancellation of a linked live execution
when its escalation is resolved. This ADR records the governing decision and
also resolves the ARCH-02 conflict between a later machine escalation and an
already terminal Founder outcome.

---

# Decision

## D1 — Queued capacity waits become terminating after a bounded interval

An unassigned agent-backed execution remains `queued` without consuming an
attempt while capacity may return. Once it has remained in that state for
`EXECUTION_QUEUE_STALL_DEADLINE_MS`, the Work Management Layer raises a Founder
escalation.

The deadline is the O5-class claim deadline:

```text
EXECUTION_QUEUE_STALL_DEADLINE_MS
  = EXECUTION_CLAIM_DEADLINE_MS
  = 2 × EXECUTION_LEASE_TTL_MS
  = 120 seconds
```

This supersedes ADR-0001 O6 only to the extent that a queued capacity wait is no
longer unbounded. Before the deadline, O6’s queued-with-event behavior remains.

## D2 — Queue stalls have their own escalation origin

`EscalationOrigin` includes `queue_stalled` in addition to
`retry_exhausted` and `review_exhausted`.

A queue stall is not retry exhaustion: no attempt was consumed. It is not review
exhaustion: no review occurred. The separate origin preserves an honest audit
record and the per-execution/per-origin deduplication boundary.

## D3 — Every Founder resolution first ends the linked live execution

When an escalation is resolved as `accept`, `abandon`, or `revise`, any linked
execution still in a non-terminal state (`queued` or `running`) is first moved
to `cancelled`. Cancellation releases its assignment and agent, if held.

Then the resolution applies:

- `accept` marks the task `completed`;
- `abandon` marks the task `rejected`;
- `revise` creates exactly one fresh execution at attempt 1, preserving the
  authorized request, routing, and review policy, and reopens the task only
  while that canonical revision remains live.

Resolution and recovery are replay-safe. Replaying one resolution converges on
the same execution and task state; a superseded older resolution cannot
overwrite the newer Founder decision.

## D4 — Terminal task status outranks later machine escalation

A machine-raised escalation is retained as an open escalation with its evidence
and timeline records, but it does not change a task already in `completed` or
`rejected` to `needs_revision`.

The current task model records terminal status but not the actor or decision
provenance that produced it. The implementation therefore protects terminal
status generically rather than falsely classifying every `completed` or
`rejected` task as Founder-produced. The refused status transition is itself
recorded. The escalation remains visible and actionable without silently
reversing the terminal state. Founder resolution retains the recency and
open-escalation coordination rules established by the Work Management Layer.

## D5 — Successful agent work completes its task at the applicable gate

- `reviewPolicy: none`: a successful execution completes its task immediately.
- `reviewPolicy: basic | full`: success requests review; the task completes only
  after the review reaches `passed`.
- `changes_requested` and `escalated` do not complete the task.

The completion write is conditional and coordinated with current Work
Management state. It cannot overwrite an open escalation, a terminal rejection,
or any newer agent execution whose existence means the older result is no
longer authoritative, including a newer success awaiting review. Callback and
reconciliation replays converge without creating a second transition.

## D6 — Remove the unused task-claim operation

`claimTask` is removed from `TaskRepository` and the development adapter. It has
no callers, writes task ownership through an uncoordinated read-then-write, and
can bypass the status preconditions used by the live lifecycle writers. If task
claiming is needed later, it requires a new governed contract whose write is
atomic with the same task and escalation preconditions.

---

# Consequences

## Positive

- Queued work has a bounded path to a human decision.
- Audit records distinguish waiting, retry exhaustion, review exhaustion, and
  Founder resolution honestly.
- Founder-terminal outcomes cannot be silently reversed by automation.
- Successful agent work reaches a truthful terminal task state.
- Resolution and completion remain idempotent under callback or sweep replay.

## Negative

- A still-useful queued or running execution is cancelled when its escalation is
  resolved; `revise` must create a fresh execution rather than reuse it.
- A machine escalation may remain open beside a terminal task, so the UI and
  operators must treat the escalation record and task status as distinct facts.

## Persistence note

The current implementation uses the existing synchronous
`TaskRepository.updateTaskStatusIf` boundary and in-memory adapter. A future
durable adapter must preserve the same atomic precondition-and-write semantics;
this ADR does not approve or design a persistence migration.

---

# Implementation References

- `lib/dev-hq/constants.ts` — queue-stall deadline
- `types/domain/escalation.ts` — `queue_stalled`
- `lib/dev-hq/escalation-service.ts` — raise, resolution, recency, cancellation
- `lib/dev-hq/task-completion-service.ts` — conditional successful completion
- `types/contracts/task-repository.ts` — task repository without `claimTask`
- `lib/dev-hq/stall-resolution-lifecycle.test.ts` — queued/running and all verbs
- `lib/dev-hq/escalation-decision-recency.test.ts` — replay ordering
- `lib/dev-hq/task-status-coordination.test.ts` — terminal-status authority

---

# Validation Requirements

- All three resolution verbs cancel linked queued and running executions.
- `revise` creates one fresh execution and preserves a full retry budget.
- Same-resolution replay converges; an older resolution cannot overwrite a
  newer one.
- Machine escalation records remain present while completed/rejected task status
  remains unchanged.
- No-review success completes immediately; reviewed success completes only on
  pass; changes-requested and escalated outcomes do not complete.
- Focused lifecycle tests, TypeScript, lint, and the full affected regression
  surface pass before handoff.

---

# Related Decisions

- ADR-0001 — execution manager, retries, O5 defaults, and O6 capacity decline
- ADR-0002 — reviews, escalations, revisions, events, and evidence

---

# Approval

Decision: Approved.

Approver:

- Founder and CEO (Evan) — authorized the lifecycle package on 2026-07-29

Date: 2026-07-29  
Version: 1.0.0
