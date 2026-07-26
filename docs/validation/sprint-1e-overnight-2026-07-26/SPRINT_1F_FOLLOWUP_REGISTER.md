# Sprint 1F Follow-Up Register — carried forward from Sprint 1E

**Created:** 2026-07-26, at Sprint 1E closure.
**Source of authority:** Founder ratification of commit
`d922f3794a6c57f02039ab969e0b98477f4c4c29` — `RATIFIED WITH NON-BLOCKING FINDINGS`,
**0 unresolved blockers**.

**Sprint 1E is CLOSED.** Nothing in this register reopens it. No item here is a defect in
the ratified baseline; each is either deferred work the commit disclosed openly or a
pre-existing condition raised for triage.

---

## Required Sprint 1F deliverables (preserved)

These were disclosed in the Sprint 1E commit message and corroborated by both the final
review (CR3DAF-4) and the ratification (RAT-6). They remain **open obligations**.

### 1E-F4 — the X4 guard is defended only by a comment

The reclaim message branches on `execution.agentId` rather than status alone, so a
requeued-without-agent attempt no longer claims *"retrying as attempt N"* when nothing is
running. **No test pins that branch.** A future edit could restore the untruth and every
gate would stay green.

**Obligation:** add a regression test that fails if the message reverts to branching on
status alone.

### 1E-F5 — three emission sites are unpinned by any test

Of the six `execution.assignment_deferred` emission sites, three have no test asserting
they emit. The remediation demonstrated twice — MAJOR-1, then MAJOR-2 — that an
emission site with no discriminating test is an emission site that can be deleted
silently.

**Obligation:** pin the three unpinned sites with tests that fail on deletion, using the
negative-control standard established by the MAJOR-2 test.

### AR2-6 — `ExecutionRunner` is wired but inert

The port is implemented by `DevExecutionRunner` and now carries the widened
`Promise<Execution | null>` contract, but **has no production consumer**. ADR-0001 D7
designates it as the concurrency contract a future durable adapter must meet, so its
correctness is untested by use.

**Obligation, per AR-1E's ruling:** revise the port **once, coherently** — the
`claimExecution` return type, `heartbeat`'s missing `assignmentId`, and the three callback
handlers' optional `assignmentId` are **one workstream, not three**. Splitting contract
changes across packages is how contracts drift.

---

## Record-only items (no obligation created)

### RAT-5 — dedupe keys outlive the event ring

Raised by the ratification of `d922f379` as an **OBSERVATION**, recorded here for triage.

| Property | Detail |
|---|---|
| **Behaviour** | The event store caps retained events at **200** (`store.ts:224`) |
| **Gap** | `store.eventKeys` is **never trimmed** when events are evicted from the ring |
| **Consequence** | Once a deduplicated event is evicted, its key persists, so that event **can never be re-appended** — the timeline can lose an event that dedup then refuses to restore |
| **Status** | **Pre-existing.** `store.ts` is not among the 10 files modified by the Sprint 1E remediation and is untouched by it |
| **Scope** | **Out of Sprint 1E scope. Must not reopen Sprint 1E.** |
| **Action** | Record only — Sprint 1F triage decides whether to act |

**Independent corroboration:** the same unbounded-`eventKeys` property was identified
independently during the overnight validation by both reviewers — CR-1E as finding F10 and
AR-1E in its persistence-readiness section — without either seeing the other's work. RAT-5
adds the eviction consequence: it is not merely unbounded growth, it is a *correctness*
consequence for the timeline.

---

## Process items carried forward (record-only)

| ID | Item |
|---|---|
| **RAT-4** | Freeze records document gates by **result** rather than by literal **command string**, so commands must be reconstructed to reproduce them. Future freeze records should record the exact command. |
| **RAT-7** | The `3daf0790…` freeze mutated mid-review because concurrent sessions shared one working tree. **A freeze declared only in prose is not enforceable.** Future freezes should be pinned by a git tag, a dedicated worktree, or a stash-backed snapshot. |
| **Workflow** | Seven consecutive freshly-spawned in-session agents produced zero deliverables, across four agent types, three task shapes, and explicit output contracts. Root cause **UNKNOWN** — three hypotheses proposed and all three eliminated by test. Reviews commissioned from a **separate clean session** succeeded. Full record: `WORKFLOW_DIAGNOSIS.md`. |

---

## Register status

| Item | Type | Status |
|---|---|---|
| 1E-F4 | Required deliverable | **Open** |
| 1E-F5 | Required deliverable | **Open** |
| AR2-6 | Required deliverable | **Open** — one port revision, not three |
| RAT-5 | Record-only observation | Logged for triage |
| RAT-4 | Process | Logged |
| RAT-7 | Process | Logged |
| Workflow diagnosis | Process | Logged, root cause unknown |

**Sprint 1E: CLOSED.** Protected baselines — `sprint-1e-baseline` → `62f6291`
(pre-remediation), `sprint-1e-remediated` → `d922f379` (ratified).
