# Sprint 1E Remediation — Phase 1 Issue Matrix

**Status:** AWAITING FOUNDER APPROVAL. No source change applied.
**Branch:** `validation/sprint-1e-overnight-2026-07-26` @ `057e12c`
**Baseline (immutable):** `sprint-1e-baseline` / `62f629128e5092f593ff494cd729fe516694bbde`

---

## Part 1 — The shared policy decision

AR-1E's specification, which resolves the Founder's "do not encode three inconsistent
answers" constraint. **This is a recommendation; the Founder owns the decision.**

### The rule

> **Throw only when the caller could not have been right. Absorb when the caller was
> right and the world moved.**

| Category | Condition | Representation | HTTP |
|---|---|---|---|
| 1. Caller fault | nonexistent entity, incoherent request, broken invariant | **throw** | 4xx/5xx |
| 2. Anticipated concurrent outcome | lost race, superseded, already terminal, no capacity | **return current state + typed reason** | **200** |
| 3. Infrastructure fault | store or `tasks.trigger` failed | **throw**; sweep retries | 5xx |

**Not a new pattern.** It is the one the codebase already applies correctly in
`resolveReview` (returns null), `updateTaskStatusIf` (returns null), `recordDispatch`
(returns existing), and `handleExecutionRunning`/`handleExecutionComplete` (return
current state). The defective sites are where the house pattern was not applied.

### Critical precision — only ONE precondition moves

AR-1E's most important constraint. `claimExecution` (`execution-manager.ts:500-529`)
throws on five conditions. **Four keep throwing.**

| Precondition | Category | Disposition |
|---|---|---|
| `status !== "queued"` | 2 | already guarded by caller at `:733-735` — leave as-is |
| `!execution.assignmentId` | 1 | **keep throwing** |
| `execution.agentId !== agentId` | 1 | **keep throwing** |
| agent not found in registry | 1 | **keep throwing** |
| **`agent.availability !== "available"`** | **2** | **change → return `null`** |

Return `null`, not a catchable error type: encoding a negative outcome as an exception
and catching it is the anti-pattern the Founder's instruction targets. **Do not
pre-check availability in the service layer** — that reintroduces the check-then-act
window the compare-and-set exists to close. Atomicity stays inside the manager.

### Second clause — absorption does not always carry an event

ADR-0002 E3: *"One event per meaningful transition; no event per heartbeat."*

> **Emit when the absorbed outcome means work is not progressing and nothing else
> records why. Stay silent when the outcome is a redundant or late signal about state
> already recorded.**

| Condition | Event? |
|---|---|
| No capability match | **yes** |
| Lost claim race | **yes** |
| Late heartbeat (F4) | **no** — E3 forbids per-heartbeat events; no state changed |
| Stale/superseded callback | **no** — already correct |

### Event contract

`execution.unassigned` **withdrawn** by AR-1E — it implies a reversal; the execution
was never assigned. Two types, because these are two genuinely different transitions:

```ts
// lib/dev-hq/constants.ts — EXECUTION_EVENT_TYPE
assignmentDeferred: "execution.assignment_deferred",
claimLost:          "execution.claim_lost",
```

| Event | dedupeKey | Precedent |
|---|---|---|
| `assignment_deferred` | `` `${type}:${executionId}:${attempt}` `` | `ensureRetryEvents` `:222` |
| `claim_lost` | `` `${type}:${assignmentId}` `` | `ensureAssignmentEvent` `:189` |

Attempt-scoped is deliberate: the transition into "awaiting capacity" happens once per
attempt. A sweep-scoped or unkeyed event would flood the 200-entry buffer within hours
and evict the timeline E5 depends on.

### Emitting sites — SIX, not five

| # | Site | Emit | Note |
|---|---|---|---|
| 1 | `agent-execution-service.ts:682-690` | `assignment_deferred` | founder entry point; where X1 reproduces |
| 2 | `agent-execution-service.ts:823-825` | `assignment_deferred` | retry requeued, no capacity |
| 3 | `execution-manager.ts:172-186` | **NO** | inside the manager — purity; covered by 2 and 6 |
| 4 | `review-service.ts:626-631` | `assignment_deferred` | review loop stalls silently |
| 5 | `escalation-service.ts:285-290` | `assignment_deferred` | **highest priority** |
| 6 | `agent-execution-service.ts:1005-1020` | `assignment_deferred` | **newly found — see X3** |
| — | `handleExecutionRunning`, claim lost | `claim_lost` | the F1 absorption point |
| — | `reconcileQueuedDispatches:499` | **NO** | sweep re-observing; key no-ops it |

**Site 5 is worst:** the founder has just made an explicit `revise` decision.
`ensureReviseDispatch` returns the queued execution, so `activateTaskForLiveRevision`
fires and the task reads `active` — live work, nothing running, no explanation.

### Emitter location — purity preserved with zero breach

Export **`ensureAssignmentDeferredEvent`** from `agent-execution-service.ts` beside the
existing exported `ensureAssignmentEvent` (`:171`). Sites 4 and 5 reach it through the
dynamic import they already perform (`review-service.ts:636`,
`escalation-service.ts:300`). No new import edge, no cycle risk, E3 emitter ownership
preserved.

**No manager emission.** `applyFailedAttempt` is the manager's only decline site;
emitting there would import `getDevHqAdapters`/`eventLogger` and breach the purity
AR-1E verified structurally. Both its paths are observed from outside — via
`releaseExecution` (site 2) and `reclaimStale` (site 6). **Site 6 is what keeps purity
free rather than costly.**

---

## Part 2 — Issue matrix

### AR2-1 — declined dispatch records no event · **REPRODUCED**

| | |
|---|---|
| **Current** | `dispatchAgentExecution` returns `assigned:false` and logs zero events. Reproduced: count 0 before, 0 after. |
| **Invariant** | ADR-0001 O6 — no capability match leaves the execution `queued` **with a logged event**. |
| **Root cause** | Early return at `agent-execution-service.ts:682-690` precedes `ensureAssignmentEvent`; no decline-class event exists. |
| **Fix** | Add `assignmentDeferred` type; export `ensureAssignmentDeferredEvent`; emit at the five service-layer sites. **Return shape unchanged.** |
| **Files** | `constants.ts`, `agent-execution-service.ts`, `review-service.ts`, `escalation-service.ts` |
| **Regression test** | Assert exactly one event after a declined dispatch, and still exactly one after N sweeps. **Fixture must construct the no-capacity condition explicitly.** |
| **Architecture** | Closes the O6 violation. Additive; no signature change. Lowest-risk of the three. |

### X1 — stranded execution · **REPRODUCED**

| | |
|---|---|
| **Current** | `{ status:'queued', agentId:null }` with no terminal state and no founder signal. |
| **Invariant** | ADR-0001 O6 — **the queued execution is the approved outcome.** |
| **Root cause** | **Not the queuing.** The absence of the O6 event is the entire violation. |
| **Fix** | **Subsumed by AR2-1.** No separate patch. |
| **Architecture** | ⚠️ **Anyone who "fixes" the queuing behaviour or adds an escalation is fixing the wrong thing.** O2 confirms only budget exhaustion escalates; no attempt was consumed. Self-heals when capacity appears. |

### F1 — stand-down branch dead · **REPRODUCED**

| | |
|---|---|
| **Current** | `claimExecution` throws on unavailable agent → route 500 → `postJson` raises before `holdsClaim` → `stood_down` unreachable for the race its own comment names. |
| **Invariant** | An anticipated concurrent outcome returns current state; the worker stands down cleanly. |
| **Root cause** | Category-2 condition represented as a category-1 throw. |
| **Fix** | **One line.** `execution-manager.ts:525-529` returns `null` instead of throwing. `handleExecutionRunning` absorbs and returns current execution; emit `claim_lost`. |
| **Files** | `execution-manager.ts`, `agent-execution-service.ts`, `constants.ts` |
| **Regression test** | Loser returns a non-running execution without throwing; exactly one `claim_lost`; recovery-at-deadline still holds. |
| **Blast radius** | ⚠️ `agent-execution-service.test.ts:1450-1499` **asserts the throw** (`rejects.toThrow(/not available to claim/)`). That assertion must be rewritten — it currently pins the defect. |
| **Architecture** | Resurrects existing, already-written worker recovery logic rather than adding behaviour. |

### AR2-4 — review lost on callback re-entry · **REPRODUCED**

| | |
|---|---|
| **Current** | Fresh path calls `requestReviewIfSucceeded` (`:847`); re-entry calls only `reconcileRecordsFor`, which never requests a review. Reproduced: 1 → 0. |
| **Invariant** | ADR-0002 E1 — review is the mandated consequence of a completed execution under a non-`none` policy (default `basic`). |
| **Root cause** | The re-entry comment at `:851-855` claims everything after the transition is reconciled; the review request is exactly such a consequence and is omitted. |
| **Fix** | Call `requestReviewIfSucceeded(current)` on the re-entry path at `:856`, **alongside** `reconcileRecordsFor`. **Do not move it into `reconcileRecordsFor`** — that function is correctly documented as never advancing a lifecycle. `ensureReviewForExecution` is already idempotent. |
| **Files** | `agent-execution-service.ts` |
| **Regression test** | Drive to `succeeded`, delete the review, re-invoke the callback, assert a review exists **without running any sweep**. |
| **Severity** | ⚠️ **Preserved disagreement:** CR-1E rates Minor (sweeper recovers within one cron tick); AR-1E rated higher. Both agree on mechanism. |

### X3 — reclaimed-but-unassigned execution records nothing · **NEW, coordinator-verified**

| | |
|---|---|
| **Current** | `agent-execution-service.ts:1005` branches on `status === "queued" && execution.agentId`. A reclaimed execution requeued with **no agent** matches neither branch — nothing recorded, nothing dispatched. |
| **Root cause** | Same missing decline-class event, on the reclaim path. |
| **Fix** | Site 6 emission. Folded into the AR2-1 patch. |
| **Why it matters** | Found only because the policy was resolved centrally. **A three-patch approach would have missed it** — concrete vindication of the Founder's constraint. |

### X4 — reclaim event asserts an untruth · **NEW, coordinator-verified**

| | |
|---|---|
| **Current** | `:1000-1002` branches the message on status alone, emitting *"reclaimed and retrying as attempt N"* for a queued execution with `agentId === null`, where nothing is retrying. |
| **Invariant** | No record asserts an untruth. |
| **Fix** | Branch the message on `execution.agentId`, not status alone. Same patch as X3. |
| **Significance** | AR-1E previously certified that no record in this system asserts an untruth. **It found the counterexample itself, in its own lane, and reported it.** |

### X2 — false assurance, declined dispatch · **CONFIRMED**

| | |
|---|---|
| **Current** | `agent-execution-service.test.ts:110-119` asserts only `assigned === false`, `reason`, and no trigger call. Stays green while AR2-1 and X1 both fail. |
| **Fix** | Add event-count and stranded-state assertions — the two the diagnostic harness already proved fail. |
| **Why it ranks high** | AR-1E ranks this **above X1**: the stranded execution is one fix, but a test that certifies a broken invariant keeps doing so after the fix lands and through every future change. |

### X2b — false assurance, F1 · **CONFIRMED**

| | |
|---|---|
| **Current** | `agent-execution-service.test.ts:1450-1499` is otherwise thorough — it asserts stranding *and* recovery — but asserts `rejects.toThrow(/not available to claim/)`, **pinning the defect as correct**. |
| **Fix** | Rewrite that assertion to the post-policy behaviour. Not a coverage gap; a wrong-direction assertion. |

### Recommended hardening — `review-scope` guard

`review-scope.test.ts:66-73` guards the manager against six review symbols but not
`eventLogger` or `getDevHqAdapters`. This patch is precisely what would tempt someone
to add them. Two words turn purity-verified-by-reading into purity-enforced-by-build.

---

## Part 3 — Scope questions for the Founder

### Q1 — F4: in or out?

**Not in the approved scope** — F4 was traced, never reproduced. But it is the same
defect class as F1. Fixing F1 and leaving F4 throwing **re-creates the exact
inconsistency the shared policy exists to eliminate.**

AR-1E notes F4 is the clearest evidence for the rule: `heartbeat` is *internally
inconsistent within one function* — absorbing the stale-assignment case at `:561-563`
and throwing for the sibling already-terminal case at `:564-568`.

**Recommendation: include F4**, reproduce it first like the others, absorb the
already-terminal and `released` cases, keep `!execution.assignmentId` throwing, **emit
no event** (E3 forbids per-heartbeat events).

### Q2 — X3 and X4: in or out?

Both newly found, both coordinator-verified, both fixed by the patch already required
for AR2-1. **Recommendation: include** — excluding them means knowingly shipping a
record that asserts an untruth.

### Q3 — Seeding: confirmed deferrable

AR-1E: **not entangled.** The event fix stands alone, lands first, and survives any
later roster change. The dependency runs the other way — fixing seeding without the
event leaves O6 violated and makes the condition *harder* to notice.

**Recommendation: leave seeding open**, treat it as inherited Sprint 1D scope
(ADR-0001 D5 over Sprint 1A placeholder data).
