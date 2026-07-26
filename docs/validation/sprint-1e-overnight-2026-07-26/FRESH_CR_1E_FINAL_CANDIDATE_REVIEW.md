> ## ⚠️ SUPERSEDED — PROCEDURAL FAIL, NO UNRESOLVED CODE BLOCKER
>
> **Appended 2026-07-26 on Founder direction. The original review below is unmodified and
> retained verbatim.**
>
> **This review's `FAIL` verdict was PROCEDURAL, not substantive.** It failed on *candidate
> identity*: the candidate mutated while the review was in flight and was committed during
> it, so no verdict could be bound to a stable artifact. The reviewer states this plainly in
> its own opening — *"This is not a defect in the remediation logic."*
>
> **It found no unresolved code blocker.**
>
> The work it reviewed was subsequently committed as
> **`d922f3794a6c57f02039ab969e0b98477f4c4c29`** and independently **ratified**.
>
> | | |
> |---|---|
> | **Authoritative post-commit result** | **`docs/validation/sprint-1e-overnight-2026-07-26/RATIFICATION_1E_D922F379.md`** |
> | **Ratification verdict** | **`RATIFIED WITH NON-BLOCKING FINDINGS`** |
> | **Unresolved blockers** | **0** |
> | Suitable as the protected Sprint 1E baseline | **YES** |
>
> The ratification re-ran all five gates against the committed tree: TypeScript pass, ESLint
> pass, targeted remediation tests 97 passed, full suite 322 passed, production build pass.
>
> **Cite this document only as the historical record of a freeze-integrity failure.** For the
> verdict governing the committed Sprint 1E state, cite `RATIFICATION_1E_D922F379.md`.
>
> *Recorded in response to finding RAT-3, which observed that a reader opening this file alone
> would see an unqualified FAIL with no supersession marker.*

---

# Fresh Independent Code Review — Sprint 1E FINAL Candidate (C1–C4 + MAJOR-1)

**Reviewer:** Independent Code Reviewer (AGENT-008), fresh session
**Date:** 2026-07-26
**Scope given:** `git diff -- lib/ types/` at HEAD `fe7fab1…`, claimed frozen at `ffc805f6…`
**Mode:** READ-ONLY. No source, test, or documentation file under review was modified. No git state was mutated.

---

# ⛔ FINAL VERDICT: **FAIL**

**Reason: the candidate mutated during this review. It is not frozen.**

This is not a defect in the remediation logic. Every code change I inspected before the mutation
was correct, and all five validation gates passed against the original tree. The FAIL is because
**the artifact under review changed underneath the review**, which voids the review's evidentiary
value and the freeze document's central claim.

**Unresolved BLOCKER count: 1** (BLOCK-1, candidate instability).

---

# 1. Candidate identity

| Item | Value |
|---|---|
| HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` |
| Protected baseline tag | `sprint-1e-baseline` → `62f629128e5092f593ff494cd729fe516694bbde` |
| Branch | `validation/sprint-1e-overnight-2026-07-26` |
| Declared candidate hash | `ffc805f60c404d8f8daafa9afb47cada263623e5e82b3d3dd378af4b6d4549b5` |
| Declared size | 10 files, 804 diff lines, +475 / −35 |
| Staged | 0 files |
| Diff scope | `git diff -- lib/ types/` |

---

# 2. Identity verification — PASSED at review start

Every check below was re-derived independently and matched the orchestrator's baseline.

| # | Check | Observed | Result |
|---|---|---|---|
| 1 | `git rev-parse HEAD` | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` | PASS |
| 2 | `git rev-parse sprint-1e-baseline^{commit}` | `62f629128e5092f593ff494cd729fe516694bbde` | PASS |
| 3 | `git diff --cached --stat` | empty (0 lines) | PASS |
| 4 | `git status --porcelain` | 13 modified, 7 untracked; the 10 candidate files present | PASS |
| 5 | `git diff --numstat -- lib/ types/` | +475 / −35 across 10 files | PASS |
| 6 | `git diff -- lib/ types/ \| wc -l` | `804` | PASS |
| 7 | `git diff -- lib/ types/ \| sha256sum` | `ffc805f6…4549b5` | PASS |
| 8–17 | per-file diff sha256 (all 10) | all 10 matched exactly | PASS |

Per-file diff hashes observed at review start (all matching the supplied baseline):

```
bde1a85e65652a2f233be6e5923d4a1d38448319a5d3dd84c835c40ece6d6e67  lib/dev-hq/adapters/dev-execution-runner.test.ts
0b922c7ac6c885a1d55534eb6aaf9f48046eaef8687e8bb675fb401ec573cb74  lib/dev-hq/adapters/dev-execution-runner.ts
99122b3b0016d0a947b57972ab9eb04b645f36b2a9c2b39e78770ca4935763a8  lib/dev-hq/agent-execution-service.test.ts
32235f563609cdf4b14c7c0edf24f418fc050eef94024ce4c04875d22b49797f  lib/dev-hq/agent-execution-service.ts
620ca8da348410b37e4c2e78e0fcfb7aa1f3b2f462bc972cd0b8cab376133050  lib/dev-hq/constants.ts
c7589420ef62a53b846979b231121060c957a847e8eca186968b704c8815af3a  lib/dev-hq/escalation-service.ts
00320b6319c24a4e83bdbd6b37b3dbc4fa42ee7271c2dbdd9a409c1ea1da370c  lib/dev-hq/execution-manager.test.ts
e9395cf89886db9b4f8dd039eb6744f2f8931203c71094eea14e41da0d460807  lib/dev-hq/execution-manager.ts
2a0f4428b66f305b4ca22dc4913b9af834ec72637931f0e2eb9625f2db964c4e  lib/dev-hq/review-service.ts
c75ca5927cbdffab258bbd57ccabc8ba2031c7f1319a2e80c7f3af3e1fe3612b  types/contracts/execution-runner.ts
```

**Identity verification result: PASS (17/17).** The tree I began reviewing was the declared candidate.

---

# 3. Candidate stability re-check — FAILED

Re-running the identical commands at the end of the review:

| Item | At review start | At review end | Result |
|---|---|---|---|
| Full candidate hash | `ffc805f6…4549b5` | **`3daf07906d685c91458668c3956354097ba03f6cc8c6c6c73287c0f78236c3f4`** | **CHANGED** |
| Diff line count | `804` | **`886`** | **CHANGED** |
| Insertions / deletions | `+475 / −35` | **`+512 / −35`** | **CHANGED** |
| `lib/dev-hq/agent-execution-service.ts` diff sha | `32235f56…` | **`61df835fa04f839eeac9e3b9d33d7af7d75d50ad9d9178946a41c1299e70a301`** | **CHANGED** |
| `lib/dev-hq/agent-execution-service.test.ts` diff sha | `99122b3b…` | **`d0be919aa7480b0be4b2f52d2ea2cd0f679e967afbff0979f5ea7ba407f8bcd9`** | **CHANGED** |
| Other 8 per-file diff shas | — | unchanged | stable |
| HEAD | `fe7fab1…` | `fe7fab1…` | stable |
| Baseline tag | `62f6291…` | `62f6291…` | stable (unmoved) |
| Staged | 0 | 0 | stable |

**Filesystem corroboration** (`ls --time-style=full-iso`, wall clock `12:27:56 EDT`):

```
2026-07-26 12:24:59.619036200 -0400  lib/dev-hq/agent-execution-service.test.ts
2026-07-26 12:25:47.855278600 -0400  lib/dev-hq/agent-execution-service.ts
2026-07-26 11:43:48.090113500 -0400  lib/dev-hq/execution-manager.ts   (untouched)
```

My identity verification and all five validation gates ran between roughly **12:18 and 12:22**.
Both mutations landed at **12:24:59** and **12:25:47** — after every gate had completed.

---

# 4. What changed during the review

Determined by diffing the frozen candidate diff against the current one.

### 4a. `lib/dev-hq/agent-execution-service.ts` — comment-only (+5 lines)

The JSDoc on `ensureAssignmentDeferredEvent` was corrected:

- `"it is the condition the five call sites share"` → `"…the six call sites share"`
- `"sites 2 and 6 cannot"` → `"sites 2, 3 and 6 cannot"`
- Five new comment lines added explaining that site 3 is `reconcileQueuedDispatches`' decline path.

No executable statement changed. Hunk header shifted `@@ -190,6 +190,77 @@` → `@@ -190,6 +190,82 @@`.

**This edit repairs exactly the documentation inconsistency I had independently identified**
(recorded below as MINOR-1) while I was still writing it up.

### 4b. `lib/dev-hq/agent-execution-service.test.ts` — a new test (+77 lines)

A test that does not exist in the frozen candidate now appears:

```
lib/dev-hq/agent-execution-service.test.ts:1623
  it("emits the requeue deferral from the reclaim loop, before the sweep runs", …)
```

It uses a new `strand()` helper to create two executions, withdraws all capacity and the pinned
provider, runs one reclaim sweep, and asserts append-ordering of `assignment_deferred` versus
`reclaimed` events. Existing tests shifted downward by ~77 lines (e.g. the claim-deadline
deferral test moved from `:1644` to `:1721`).

**I have not reviewed this test and have never executed it.**

---

# 5. Findings

## BLOCK-1 — The candidate is not frozen; it mutated mid-review · **BLOCKER** · CONFIRMED

**Evidence:** §3 and §4 above. The identical command (`git diff -- lib/ types/ | sha256sum`) run
against the same HEAD at the start and end of this review returned `ffc805f6…` then
`3daf0790…`. Two of ten per-file diff hashes changed; the diff grew 804 → 886 lines. mtimes place
both writes after all validation gates completed.

**Why this blocks, concretely:**

1. **The five validation gates are stale.** `tsc`, `eslint`, the targeted suite, the full suite,
   and `next build` all ran against `ffc805f6…`. Their exit codes are true statements about a
   tree that no longer exists. In particular `npx vitest run` reported **321 passed**; the tree
   now contains a 322nd test that has never been run in this review. **No validation evidence in
   this report applies to the current tree.**
2. **`CANDIDATE_FINAL_FREEZE.md` is now false.** It declares `Status: FROZEN FOR REVIEW` and pins
   `Full-candidate diff hash: ffc805f6…`. The tree no longer hashes to that value, so the document
   does not describe the tree it claims to certify.
3. **The required sequence is broken.** `CANDIDATE_FINAL_FREEZE.md:188-195` places "Fresh
   Independent Code Review of the entire final candidate" at step 2, gating Architecture Review
   and Founder Approval. A review of a moving target cannot discharge that gate — the same class
   of problem as the C1 candidate's post-review mutation already recorded in
   `CANDIDATE_C1_FREEZE.md`, recurring.

**Aggravating:** this is a *repeat*. The evidence package already documents one post-review
mutation of the C1 candidate. A second occurrence during the very review meant to certify the
final candidate indicates the freeze is not enforced by any mechanism.

**Mitigating:** the observed edits are low-risk in kind — a comment correction and an added test.
Nothing in the executable production logic changed. I found no evidence of an attempt to alter
behaviour under review.

**Recommendation:**
1. Stop all writes to `lib/` and `types/` on this branch.
2. Re-freeze: recompute the full-candidate and per-file diff hashes, and **regenerate**
   `CANDIDATE_FINAL_FREEZE.md`'s identity and per-file hash tables from the new tree.
3. Re-run all five validation gates against the re-frozen tree and record the new counts.
4. Re-run a fresh Independent Code Review against the re-frozen hash, including the new test at
   `:1623`, which no reviewer has yet examined.
5. Enforce the freeze mechanically (e.g. a pre-review hash assertion the reviewer re-checks on
   entry and exit — which is what caught this).

---

## MAJOR-1 — `CANDIDATE_FINAL_FREEZE.md` per-file content-hash table does not match the tree · CONFIRMED (cause partly unverified)

**Evidence:** `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_FINAL_FREEZE.md:115-128`
publishes a per-file SHA-256 table. Measured against the working tree, **8 of 10 match exactly;
2 do not**:

| File | Documented | Observed (this review) |
|---|---|---|
| `lib/dev-hq/agent-execution-service.ts` | `51ebbc2e0f9eaa96…` | `8ae02cdae14d3372…` |
| `lib/dev-hq/agent-execution-service.test.ts` | `0dca1f03d5e91660…` | `d6f46d302e0bf94d…` then `89d5dd7b7c9288b7…` |

These are the same two files that mutated in §4, so part of the mismatch is explained by BLOCK-1.
**However, `51ebbc2e…` is independently traceable to a different origin**:
`CANDIDATE_C1_FREEZE.md:77-80` describes it as the hash of a *backup taken during the fail-before
demonstration*, restored afterwards — a mid-follow-up snapshot, not a final state. The final
freeze appears to have carried that value forward into its certification table.

**Failure scenario:** a downstream reviewer or the Founder verifies file identity using this table,
finds 2 of 10 mismatched, and cannot tell whether they are looking at tampering, a stale document,
or an in-flight edit. That ambiguity is precisely what the table exists to remove.

**Unverified:** I could **not** confirm whether `51ebbc2e…` / `0dca1f03…` were correct for the
frozen `ffc805f6…` state. I attempted to reconstruct it (`git show HEAD:<path>` plus `git apply` of
the frozen diff into the scratchpad); the patches applied cleanly, but `core.autocrlf=true`
produced CRLF output where the working tree is LF, so the reconstructed hashes (`31eb3f98…`,
`39a947cc…`) are not byte-faithful and settle nothing. I report the mismatch as measured and the
cause as partly undetermined.

**Recommendation:** regenerate the table mechanically from the re-frozen tree; never transcribe a
hash from an intermediate snapshot into a certification record.

---

## MINOR-1 — `ensureAssignmentDeferredEvent` JSDoc undercounted its call sites · CONFIRMED (repaired mid-review)

**Evidence (frozen candidate):** `lib/dev-hq/agent-execution-service.ts:214-223`

```
 * weight to a later simplification pass. It is not: it is the condition the five
 * call sites share, held in one place so they cannot drift apart.
 */
export async function ensureAssignmentDeferredEvent(
  execution: Execution,
  reason: AssignmentDecision["reason"],
): Promise<void> {
  // Do not remove: see the X4 note above. Sites 1, 4 and 5 can reach here with
  // `execution_not_queued`; sites 2 and 6 cannot, being enclosed by a queued
  // check. The guard is what keeps all six uniform at the call site.
```

Three inconsistencies in one comment: "five call sites" versus "all six" nine lines later; and the
enumeration `1, 4, 5 / 2, 6` covers only five of the six actual sites. The omitted one is
`reconcileQueuedDispatches` (`:585`) — the MAJOR-1 follow-up site, which `ISSUE_MATRIX.md:94` had
originally ruled **NO** and which was added later without renumbering.

The comment is explicitly load-bearing ("Do not remove", "Deleting the guard therefore reintroduces
X4"), so an incorrect site census in it is a real maintenance hazard.

**Status:** repaired by the §4a mid-review edit ("six", "sites 2, 3 and 6", plus an explanatory
note). **I verified the wording of the repair but have not re-reviewed the file as a whole in its
mutated state.**

---

## MINOR-2 — Two `claimExecution` preconditions that must keep throwing are not pinned by any test · CONFIRMED

**Evidence:** `ISSUE_MATRIX.md:35-41` specifies five preconditions, four of which **must keep
throwing**. `lib/dev-hq/execution-manager.test.ts:148-165` ("validates claim preconditions") pins
only three throwing paths:

- `claimExecution("exec-missing", …)` → `Execution not found`
- agent mismatch → `/assigned to agent-supervisor/`
- `status !== "queued"` → `/not claimable/`

Not pinned:
- `!execution.assignmentId` → `Execution has no assignment to claim` (`execution-manager.ts:516-518`)
- agent not found in registry → `Agent not found: ${agentId}` (`execution-manager.ts:527-530`)

**Failure scenario:** the entire remediation rests on "exactly one of five preconditions moves from
throw to `null`". A future change that softens either unpinned precondition to `return null` would
compile, pass all 321 tests, and silently widen the absorb surface — reintroducing the
inconsistency the shared policy exists to eliminate.

**Pre-existing, not introduced here** — but this candidate is what makes it load-bearing.

**Recommendation:** add two assertions to the existing test. Low cost, directly protects the
candidate's central invariant.

---

## OBSERVATION-1 — Deferral dedupe key hides repeat strandings within one attempt

`agent-execution-service.ts:233` keys on `assignment_deferred:{executionId}:{attempt}`. The
claim-deadline release path (`execution-manager.ts:711` `releaseAssignmentForReassignment`)
deliberately does **not** consume an attempt. So: strand at attempt 1 → deferral recorded; capacity
returns → assigned → dispatched → claim deadline expires again → no capacity → **second deferral
suppressed by the key**.

This is the documented intent (`:199-201`: "one deferral per attempt is the honest count") and the
intervening assignment/dispatch events keep the timeline non-empty, so I am **not** raising it as a
defect. Recording it because it is a real limit on what the O6 timeline shows, and Architecture
Review may wish to rule on whether attempt-scoping is the right granularity for a path that
intentionally does not advance the attempt counter.

## OBSERVATION-2 — `store.eventKeys` grows without bound

`lib/dev-hq/store.ts:218-228`: `store.events` is trimmed to 200, but `store.eventKeys` never is.
This is what correctly makes dedupe survive buffer eviction — a good property the candidate depends
on. It is also an unbounded map. Pre-existing and shared with `ensureRetryEvents` /
`ensureAssignmentEvent`; the candidate adds two more key families of modest cardinality (per
execution-attempt, per assignment). Not a defect at Phase 1 in-memory scale.

## OBSERVATION-3 — Inconsistent non-null-assertion discipline

`agent-execution-service.ts:836` deliberately avoids a non-null assertion with an explicit
`if (existing.assignmentId)` guard, documenting the choice. The same file's reclaim loop at `:1133`
retains `execution.assignmentId!` under a guard that only proves `agentId` is non-null.
Pre-existing (the candidate only renamed the enclosing condition), and `TYPESCRIPT_STANDARD`'s
"No unnecessary assertions" is arguably in tension with it. Non-blocking.

## OBSERVATION-4 — `handbooks/INDEPENDENT_CODE_REVIEWER.md` does not exist

`agents/independent-code-reviewer/AGENT.md` references it. `handbooks/` contains 10 files, none for
this role. I used `standards/CODE_REVIEW_STANDARD.md` as the procedural standard instead, as
instructed. Reported because it is a governance gap, not because it changed any conclusion.

## OBSERVATION-5 — `ISSUE_MATRIX.md` header is stale

`ISSUE_MATRIX.md:3-4` records `Status: AWAITING FOUNDER APPROVAL. No source change applied.` and
`Branch … @ 057e12c`. Source changes have since been applied and HEAD is `fe7fab1…`. The document
is a specification, not a certification, so this is cosmetic — but it reads as a current status.

---

# 6. Section-by-section verdicts on the seven special-attention areas

All verdicts below describe the **frozen `ffc805f6…` candidate**, the only state I inspected in
full. They do **not** carry over to the mutated tree.

### 6.1 ExecutionRunner port change and ADR-0001 D7 — COMPLIANT

D7 verbatim (`docs/decisions/ADR-0001-execution-manager-and-agent-registry.md:139-144`):

> **D7 — Persistence: memory remains the default; Supabase is strictly opt-in**
> All Sprint 1D–1F work runs on the in-memory store. A Supabase schema is designed as a
> documentation artifact only; no migration is authored or applied in Phase 1. The compare-and-set
> claim semantics are specified now so a future Supabase adapter has a concurrency contract to meet.

D7 **mandates that a CAS concurrency contract exist**; it does not freeze that contract's shape.
Widening `claimExecution`/`runExecution` to `Promise<Execution | null>`
(`types/contracts/execution-runner.ts:57-62, 74`) leaves the CAS semantics intact and makes the
losing outcome expressible in the type rather than implicit in an exception. For a SQL adapter,
`UPDATE … WHERE availability='available'` affecting 0 rows maps naturally to `null` and awkwardly
to a thrown error, so the amended contract is **more** implementable, not less. D6 (`:133-137`,
capacity 1, availability as the concurrency primitive) is preserved: `execution-manager.ts:536-543`
keeps the check and the reservation adjacent and synchronous.

Blast radius verified: `DevExecutionRunner` (`lib/dev-hq/adapters/dev-execution-runner.ts:14`) is
the **only** implementer of the port, and it was updated. `tsc --noEmit` exit 0 confirms no
unhandled `null` at any consumer.

**This remains an architectural surface change and is correctly disclosed** at
`ISSUE_MATRIX.md:206-243` and `CANDIDATE_FINAL_FREEZE.md:158-166`. Ratifying it is Architecture
Review's call, not mine. I found no D7 violation in the ADR's actual text.

### 6.2 `claimExecution` one-of-five precondition — CORRECT AND EXHAUSTIVE

`lib/dev-hq/execution-manager.ts:506-554`. All five preconditions are real and present:

| # | Precondition | Line | Behaviour | Spec (`ISSUE_MATRIX:35-41`) |
|---|---|---|---|---|
| 1 | `status !== "queued"` | `:511-515` | throw | keep throwing — matches |
| 2 | `!execution.assignmentId` | `:516-518` | throw | keep throwing — matches |
| 3 | `execution.agentId !== agentId` | `:519-525` | throw | keep throwing — matches |
| 4 | agent not in registry | `:527-530` | throw | keep throwing — matches |
| 5 | `agent.availability !== "available"` | `:536-538` | **`return null`** | **change to null — matches** |

**Exactly one moved.** Exhaustiveness confirmed by grep across `lib/`: the only production writes
of `availability: "busy"` and execution `status: "running"` are `execution-manager.ts:543` and
`:554`, both inside `claimExecution` past all five checks. The only production caller is
`runExecution` (`:780`), which adds its own guards. `dev-workflow-engine.ts:76,92` writes
`status: "running"` on the D9 Simulation Lab workflow, not on executions. **No path can claim an
execution that fails a precondition.**

### 6.3 Duplicated `status !== "running"` guards — BOTH CORRECT, BOTH PINNED

| Path | Source | Behaviour | Test pinning it |
|---|---|---|---|
| heartbeat | `execution-manager.ts:580-582` | `return execution` (absorb) | `execution-manager.test.ts:182-196` and `:198-217` |
| `releaseExecution` | `execution-manager.ts:621-623` | **`throw`** | `execution-manager.test.ts:270-278` |

The heartbeat test is notably non-vacuous: it writes a sentinel `lastHeartbeatAt` of
`"2026-07-24T20:00:00.000Z"` before the late beat and asserts it is **unchanged**, plus
`status === "released"` and `leaseExpiresAt === null`. Its own comment explains why comparing
against the previous timestamp would be unsound (millisecond clock resolution). This is the
opposite of a written-to-pass test. `heartbeat` also correctly keeps the *broken-invariant* case
loud (`:585-587`, running with no assignment → throw) while absorbing the two benign races.

### 6.4 The six deferral emission sites — EXACTLY SIX, ALL CORRECT

Enumerated by grep across `lib/`, `app/`, `trigger/`, `components/`:

| # | Site | Reason argument | Guarded by |
|---|---|---|---|
| 1 | `agent-execution-service.ts:585` (`reconcileQueuedDispatches`) | `decision.reason` | loop-level `status !== "queued" → continue` |
| 2 | `agent-execution-service.ts:769` (`dispatchAgentExecution`) | `decision.reason` | helper guard |
| 3 | `agent-execution-service.ts:931` (`handleExecutionComplete`) | literal `"no_agent_available"` | `if (execution.status === "queued")` `:924` |
| 4 | `agent-execution-service.ts:1137` (`handleExecutionReclaim`) | literal `"no_agent_available"` | `requeuedWithoutAgent` |
| 5 | `escalation-service.ts:293` | `decision.reason` | helper guard |
| 6 | `review-service.ts:635` | `decision.reason` | helper guard |

Count is exactly six. Sites 5 and 6 reach the exported emitter through the dynamic import they
already performed, so no new static import edge and no cycle — matching `ISSUE_MATRIX.md:100-106`.
The `reason !== "no_agent_available"` guard (`:224`) is genuinely load-bearing for the four sites
passing `decision.reason`, which can carry `execution_not_queued` from
`execution-manager.ts:439-441`. Manager purity is preserved: no emission inside
`execution-manager.ts`, per `ISSUE_MATRIX.md:108-112`.

Site 1 is a **documented, justified deviation** from `ISSUE_MATRIX.md:94`, which had ruled
`reconcileQueuedDispatches` **NO**. The implementation is right and the spec was wrong: in the
claim-deadline-release scenario no other site can fire (see 6.5). The deviation is disclosed in
`CANDIDATE_FINAL_FREEZE.md:38-72` and `CANDIDATE_C1_FREEZE.md:54-83`. The only residue was the
stale site census in the JSDoc (MINOR-1).

### 6.5 The MAJOR-1 follow-up — ALL THREE PROPERTIES HOLD

**Exact-once emission.** `store.ts:218-228` `appendEvent` performs a synchronous check-and-set on
`store.eventKeys` — atomic in the single-threaded store, no read-then-write window. Crucially
`eventKeys` is **not** trimmed with the 200-entry buffer, so the key outlives eviction and a late
sweep cannot recreate an evicted event.

**Replay / reconciliation dedupe.** Within one `handleExecutionReclaim`, site 4 (`:1137`) and then
site 1 (`:585`, via `reconcileQueuedDispatches` at `:1157`) can both fire for the same execution;
both compute `assignment_deferred:{id}:{attempt}` from the same attempt value, so the second is a
no-op. Pinned by `agent-execution-service.test.ts:1721` running **three** consecutive sweeps and
asserting `toHaveLength(1)` throughout.

**Attempt counter and queued state unchanged.** The follow-up adds only an
`ensureAssignmentDeferredEvent` call before an existing `continue`; it performs no `saveExecution`.
The test asserts `status === "queued"`, `agentId === null`, and `attempt === attemptBefore` after
all three sweeps.

**I specifically checked whether the new test is masked the way C1's X3 test was** (per
`CANDIDATE_FINAL_FREEZE.md:88-91`). It is not. Traced: the execution is `queued`, so `reclaimStale`
skips it (`execution-manager.ts:669`) and `reclaimed` is empty — site 4 is unreachable. Sites 2, 3,
5, 6 are on paths the test never invokes. **`:585` is the only possible emitter**, so
`toHaveLength(1)` genuinely fails without the fix. This is a well-constructed regression test.

**AR2-4 idempotency** (the sibling re-entry fix at `:971`): `requestReviewIfSucceeded` returns early
unless `status === "succeeded"` (`:985`), so it cannot touch a queued or failed execution.
`ensureReviewForExecution` (`review-service.ts:263-302`) uses the canonical `reviewIdFor(id)` with
create-or-get, and `performReviewDispatch` (`:349-350`) returns early when the review is not pending
or already has a `triggerRunId`. Repeat callbacks are true no-ops.

### 6.6 Concurrency, replay, idempotency, stale-run protection, evidence integrity — SOUND

The F1 causal chain is **verified end to end against real source**, not taken on the patch spec's
word:
- `postJson` throws on any non-2xx: `trigger/agent-execution.ts:16-19`.
- The running route returns 500 on a thrown callback and serialises `{ execution }` on success:
  `app/api/dev-hq/internal/execution/running/route.ts:18-25`.
- The worker's predicate is
  `claimed.execution?.status === "running" && claimed.execution?.assignmentId === payload.assignmentId`:
  `trigger/agent-execution.ts:66-68`.

So the pre-fix throw did make `stood_down` (`:69-72`) unreachable, and the test comment at
`agent-execution-service.test.ts:1522-1526` transcribes the predicate **accurately**. I verified the
transcription rather than trusting it.

Stale-run protection is layered and intact: `assignmentId` mismatch short-circuits
`handleExecutionRunning` (`:821`), `handleExecutionComplete` (`:897`), and `heartbeat`
(`execution-manager.ts:576`) — the stale check precedes the newly-absorbing status check in every
case, so absorption never weakens supersession. `claim_lost` is keyed on `assignmentId`, and a
replayed `/running` callback re-derives the same key, so it stays exactly-once.

Evidence integrity: `reconcileRecordsFor` (`:1003-1034`) still refuses to invent an outcome for a
requeued execution, and the X4 message repair (`:1124-1128`) removes the false "retrying as attempt
N". I checked `recordReclaimEvidence` (`:1078-1082`) for the same defect class — its queued wording
is "recovery created a new attempt N", which is true (reclaim does increment the attempt) and does
not assert that anything is running. No untruth found.

### 6.7 Anything still incorrectly recorded as RESOLVED — NONE FOUND

Each claimed-resolved defect cross-checked against source:

| ID | Claim | Verified at | Verdict |
|---|---|---|---|
| AR2-1 | deferral event at all decline sites | six sites, §6.4 | genuinely resolved |
| X1 | surviving decline path instrumented | `:585` | genuinely resolved |
| X2 | test constructs its own no-capacity fixture | test `:110-155` | genuinely resolved |
| X2b | throw-assertion rewritten | test `:1510-1541` | genuinely resolved |
| X3 | third `requeuedWithoutAgent` branch | `:1117-1118, 1136-1137` | genuinely resolved |
| X4 | message branched on `agentId` | `:1115-1128` | genuinely resolved |
| F1 | CAS returns `null`; absorbed; `claim_lost` | mgr `:536-538`, svc `:830-844` | genuinely resolved |
| F4 | heartbeat absorbs terminal and released | mgr `:580-582, 592-593` | genuinely resolved |
| AR2-4 | review requested on re-entry | `:971` | genuinely resolved |
| MAJOR-1 | sixth site | `:585` | genuinely resolved |

**No defect is recorded as resolved that is not actually fixed.** The freeze records' *behavioural*
claims are accurate. The correction at `CANDIDATE_C1_FREEZE.md:54-83` and
`CANDIDATE_FINAL_FREEZE.md:76-91` — retracting the earlier overstated "X1 subsumed" claim — is
honest and matches what I found in source.

---

# 7. Validation reproduction

Every command below was actually executed from the repo root. Exit codes are real, captured via
`echo "EXIT=$?"`. **All five ran against `ffc805f6…` and are void for the current tree (BLOCK-1).**

| # | Command | Real exit code | Observed output |
|---|---|---|---|
| 1 | `npx tsc --noEmit` | **0** | no diagnostics |
| 2 | `npx eslint .` | **0** | no diagnostics |
| 3 | `npx vitest run lib/dev-hq/agent-execution-service.test.ts lib/dev-hq/execution-manager.test.ts lib/dev-hq/adapters/dev-execution-runner.test.ts` | **0** | `Test Files 3 passed (3)` · `Tests 96 passed (96)` |
| 4 | `npx vitest run` | **0** | `Test Files 22 passed (22)` · `Tests 321 passed (321)` |
| 5 | `npx next build` | **0** | compiled successfully |

Test count 321 corroborates `CANDIDATE_FINAL_FREEZE.md:142`. The current tree would produce 322.

---

# 8. Standards compliance

| Standard | Assessment |
|---|---|
| `TYPESCRIPT_STANDARD.md` | "Proper null handling" satisfied — the widened return is handled at every consumer; `tsc` clean. No `any`, no suppressions. Minor tension with "No unnecessary assertions" at `:1133` (OBSERVATION-3). |
| `TESTING_STANDARD.md` | Tests assert behaviour, not implementation. The heartbeat sentinel test and the isolated MAJOR-1 test are notably resistant to vacuous passing. Gap at MINOR-2. |
| `CODE_REVIEW_STANDARD.md` | Followed as the procedural standard (`handbooks/INDEPENDENT_CODE_REVIEWER.md` absent — OBSERVATION-4). |
| `OBSERVABILITY_STANDARD.md` | Two new typed lifecycle events with durable dedupe keys; ADR-0002 E3 respected (no per-heartbeat event on any path). |
| `SECURITY_STANDARD.md` | See §9. No findings. |
| `API_STANDARD.md` | Callback routes unchanged; the semantic shift is 500 → 200 for a lost race, which is the correct code for an anticipated outcome. |
| `DOCUMENTATION_STANDARD.md` | MINOR-1 and MAJOR-1 are documentation-accuracy defects. |
| `GIT_STANDARD.md` | Nothing staged or committed, per the required sequence — correct. But BLOCK-1 shows the working tree is not under change control. |
| ADR-0001 D6/D7/O2/O6, ADR-0002 E1/E3 | Verified against verbatim text (§6.1). O6 (`:201-204`) explicitly requires "a logged event", which is exactly what the candidate supplies. |

Standards named in `AGENT.md` but absent from `standards/` — NAMING, LOGGING, ERROR_HANDLING — were
not invented or applied. Recording the gap, as instructed.

---

# 9. Security observations

No security defects found.

- **No new external surface.** No route, handler, or public export reachable from outside the
  internal token-guarded callbacks was added. `rejectInternalDevRequest` is untouched.
- **No secret or PII exposure.** New event messages carry execution ids, task ids, assignment ids
  and agent display names only.
- **Dynamic imports are safe.** `escalation-service.ts:290` and `review-service.ts:632` import from
  a hardcoded string literal — no user-controlled specifier.
- **The 500 → 200 change does not weaken authorization.** It changes only the status code for a lost
  CAS on an already-authenticated internal callback. Nothing new is disclosed to the caller: the
  worker already received the execution object on the success path.
- **Availability is not spoofable across the boundary.** The CAS stays inside the manager
  (`execution-manager.ts:536-543`); the service layer never pre-checks availability, so no
  check-then-act window is opened for a caller to exploit.
- **DoS surface:** OBSERVATION-2's unbounded `eventKeys` map is the only unbounded growth, at Phase 1
  in-memory scale, behind an internal-only guard.

---

# 10. Performance observations

No performance regressions found.

- The added work on each deferral path is one `Map` lookup plus at most one insert
  (`store.ts:220-224`) — O(1).
- `reconcileQueuedDispatches` iterates all executions per sweep; that is pre-existing O(n) and
  unchanged. The candidate adds no new loop and no new sweep pass.
- New dedupe-key cardinality is bounded: executions times `MAX_EXECUTION_ATTEMPTS` for deferrals,
  one per assignment for `claim_lost`.
- Dynamic imports at sites 5 and 6 resolve from the module cache after first call — negligible.
- The `dispatchesInFlight` single-flight map (`review-service.ts:329-341`) means the AR2-4 re-entry
  fix cannot produce a dispatch storm under repeated callbacks.

---

# 11. Recommended improvements

1. **(from BLOCK-1)** Enforce the freeze mechanically, then re-freeze, re-validate, and re-review.
2. **(from MAJOR-1)** Regenerate `CANDIDATE_FINAL_FREEZE.md`'s per-file hash table from the tree
   rather than transcribing from intermediate snapshots.
3. **(from MINOR-2)** Add two assertions pinning the `!assignmentId` and agent-not-found throws.
4. **(from OBSERVATION-5)** Refresh the `ISSUE_MATRIX.md` status header, or mark it explicitly
   historical.
5. **(from OBSERVATION-4)** Author `handbooks/INDEPENDENT_CODE_REVIEWER.md`, or amend `AGENT.md` to
   stop referencing it.
6. **Out of scope — recorded, not requested, not authorized:** the `review-scope` guard hardening at
   `ISSUE_MATRIX.md:198-202` (adding `eventLogger` / `getDevHqAdapters` to the manager purity test)
   would convert purity-verified-by-reading into purity-enforced-by-build. Given this candidate
   exports an emitter that six call sites now reach, the temptation it guards against is now
   concrete. **Impact:** medium; **Priority:** next sprint. Requires authorization before entering
   scope — discovery is not approval.

---

# 12. Does anything block commit?

**Yes. BLOCK-1 blocks commit.**

To be precise about what is and is not blocked:

- **The remediation logic does not block.** In the frozen `ffc805f6…` state I found **zero
  BLOCKER-severity defects in the code**. C1–C4 and the MAJOR-1 follow-up are correct, well-tested,
  ADR-compliant, and honestly documented as to behaviour.
- **The candidate's integrity blocks.** The tree is not frozen, so there is no stable artifact to
  commit, and no valid validation evidence for the tree as it now stands.

**Is the full candidate suitable to proceed to Architecture Review?** **No — not in its current
state.** Architecture Review would face the same moving target. It becomes suitable once the tree is
re-frozen, the five gates are re-run and recorded, the freeze document's hash tables are
regenerated, and the new test at `:1623` has been reviewed. **On the substance, I expect it to
pass**: the architectural questions AR must rule on — the port amendment (§6.1) and the site-1
deviation from `ISSUE_MATRIX.md:94` (§6.4) — are both properly disclosed and, in my assessment,
correctly decided.

---

# 13. What I did NOT verify, and why

1. **The current (mutated) tree.** I did not review the new test at
   `agent-execution-service.test.ts:1623` and did not re-run any gate against `3daf0790…`. Reviewing
   a target that changed mid-review would compound the problem, and any result would carry the same
   defect. **This is the single largest gap in this report.**
2. **Whether the freeze document's hashes were correct for the frozen state** (MAJOR-1). My
   reconstruction was defeated by `core.autocrlf=true` producing CRLF against an LF working tree.
   Reported as measured; cause undetermined.
3. **Fail-before demonstrations.** I did not revert any fix to confirm the new tests fail without it
   — that requires mutating the tree, which my instructions forbid. Instead I traced reachability to
   establish non-vacuity by construction (§6.5), which is weaker evidence than execution. The
   fail-before claims at `CANDIDATE_C1_FREEZE.md:77-80` are **reported by others, not confirmed by
   me.**
4. **Runtime behaviour under real concurrency.** All reasoning about the CAS assumes the
   single-threaded in-memory store (ADR-0001 D7). I did not exercise a multi-process scenario, and
   the conclusions in §6.2 would need re-derivation against a future Supabase adapter.
5. **Trigger.dev runtime behaviour.** I verified the worker's source logic and the route
   serialisation but did not execute a durable run. The claim that `retries.enabledInDev false`
   kills the run outright is from the code comments; I confirmed `postJson` throws on non-2xx
   (`trigger/agent-execution.ts:16-19`) but did not verify the Trigger-side consequence.
6. **`WORKFLOW_DIAGNOSIS.md`, `RUN_LEDGER.md`, `VALIDATION_REPORT.md` contents.** Read for context
   only. Their claims about spawn failures and prior runs are outside this review's scope and are
   not certified here.
7. **The prior C1 review's verdict.** Read for context and deliberately **not** inherited. Every
   conclusion above was re-derived from source. Where I reached the same conclusion as the prior
   review (e.g. the JSDoc site-count inconsistency), I reached it independently before consulting it.
8. **The eight unchanged files' content hashes** were confirmed against `CANDIDATE_FINAL_FREEZE.md`;
   I did not re-audit their full contents beyond the diff and surrounding call sites.

---

# 14. Final verdict

## **FAIL**

**Unresolved BLOCKER count: 1**

| Severity | Count | IDs |
|---|---|---|
| BLOCKER | **1** | BLOCK-1 |
| MAJOR | 1 | MAJOR-1 |
| MINOR | 2 | MINOR-1 (repaired mid-review), MINOR-2 |
| OBSERVATION | 5 | OBSERVATION-1 … OBSERVATION-5 |

**Justification.** I want to be unambiguous about *why* this is a FAIL, because it would be easy to
misread as a judgement on the engineering.

The Sprint 1E remediation code is good. I tried hard to break it — I traced every claimed-resolved
defect to source, re-derived the ADR compliance from verbatim ADR text rather than the patch spec's
characterisation of it, verified the worker/route causal chain the F1 fix depends on instead of
accepting the test's comment, checked whether the new MAJOR-1 test was masked the way C1's X3 test
had been, and confirmed no code path can bypass the five claim preconditions. It held up. There are
**no BLOCKER-severity code defects**, and on the merits alone I would have returned PASS WITH
NON-BLOCKING FINDINGS.

But a code review certifies a specific artifact, and this artifact did not hold still. The same
command returned `ffc805f6…` when I started and `3daf0790…` when I finished, with two files
rewritten after every validation gate had already run. That means the exit codes in §7 describe a
tree that no longer exists, `CANDIDATE_FINAL_FREEZE.md`'s "FROZEN FOR REVIEW" claim is false as
written, and a test that no reviewer has examined is now part of the candidate. My instructions are
explicit that a stability mismatch forces FAIL, and independent of those instructions it is the
correct call: I cannot certify bytes I did not read.

There is also a pattern worth naming. This evidence package already documents one post-review
mutation of the C1 candidate. This is the second occurrence, during the review meant to close the
gate the first one opened. The remediation exists to eliminate false assurance; approving a review
of a tree that changed underneath it would be exactly that.

**The right next step is narrow and cheap:** stop writes, re-freeze, re-run the five gates,
regenerate the hash tables, and re-review — with particular attention to the one test I never saw.
I expect that review to pass.

---

*Prepared by the Independent Code Reviewer (AGENT-008) under `AGENTS.md` and
`standards/CODE_REVIEW_STANDARD.md`. Read-only: no source, test, or documentation file under review
was modified, and no git state was mutated. This document is the sole artifact written.*

---

# 15. Orchestrator verification addendum

**Added by:** orchestrating session, after independent re-derivation of the reviewer's claims.
**Scope:** corrections to this report only. No reviewed source, test, or evidence file was modified.

The orchestrating session measured the candidate independently **before** the reviewer started and
**after** it finished. Three of the reviewer's statements are corrected below.

## 15.1 BLOCK-1 stands — but the mutation was authorized and documented

The mutation is real and independently confirmed:

| Measurement | Orchestrator, before review | Orchestrator, after review |
|---|---|---|
| `git diff -- lib/ types/ \| sha256sum` | `ffc805f6…4549b5` | `3daf0790…36c3f4` |
| `git diff -- lib/ types/ \| wc -l` | `804` | `886` |
| `git diff --shortstat -- lib/ types/` | `+475 / −35` | `+557 / −35` |
| `lib/dev-hq/agent-execution-service.ts` (content) | `51ebbc2e…` | `8ae02cda…` |
| `lib/dev-hq/agent-execution-service.test.ts` (content) | `0dca1f03…` | `89d5dd7b…` |
| HEAD | `fe7fab1…` | `fe7fab1…` (unchanged) |
| Staged | 0 | 0 |

**However**, `CANDIDATE_FINAL_FREEZE.md` now carries a *SUPERSEDING FINAL FREEZE* section
(`:200-254`, "Frozen at 2026-07-26T16:34:33Z") that explicitly retires `ffc805f6…`, attributes the
change to three Founder-authorized items (source-comment corrections 9–10; the MAJOR-2 test;
Amendment 6 — docs only), and publishes an authoritative table. The orchestrator verified that
table against the tree: **`3daf0790…`, `8ae02cda…` and `89d5dd7b…` all match exactly.**

This does **not** clear BLOCK-1 — a review cannot certify a tree that moved under it, and the
gates in §7 remain void for the current tree. But the reviewer's characterization of the event as
an unenforced-freeze failure of unknown origin is incomplete: the changes were authorized,
attributed, timestamped, and re-certified in the freeze record. The correct reading is a
**process-sequencing failure** (authorized edits landed while a certifying review was in flight),
not silent tampering. The reviewer's own mitigating note — comment-only source change plus one
added test, no executable production logic altered — is consistent with this.

## 15.2 MAJOR-1 is **withdrawn** — the original per-file table was accurate

MAJOR-1 claims `CANDIDATE_FINAL_FREEZE.md:115-128` published per-file hashes that never described
the frozen tree, and traces `51ebbc2e…` to a mid-follow-up backup recorded in
`CANDIDATE_C1_FREEZE.md:77-80`.

**This is not supported.** The orchestrator measured all ten worktree content hashes at the
`ffc805f6…` state, before the reviewer began:

```
d9418f68…  lib/dev-hq/adapters/dev-execution-runner.test.ts
bc7eab76…  lib/dev-hq/adapters/dev-execution-runner.ts
0dca1f03…  lib/dev-hq/agent-execution-service.test.ts
51ebbc2e…  lib/dev-hq/agent-execution-service.ts
7c10c0a7…  lib/dev-hq/constants.ts
6231cbab…  lib/dev-hq/escalation-service.ts
77cac31b…  lib/dev-hq/execution-manager.test.ts
f5857d41…  lib/dev-hq/execution-manager.ts
284b97d2…  lib/dev-hq/review-service.ts
765a7ea1…  types/contracts/execution-runner.ts
```

**All ten match `CANDIDATE_FINAL_FREEZE.md:119-128` exactly, including the two the finding
disputes.** The table was correct for `ffc805f6…`. The 2-of-10 mismatch the reviewer observed was
caused entirely by the BLOCK-1 mutation occurring before its measurement — not by a stale value
carried forward from a C1 backup. The reviewer measured content hashes after the tree moved while
reporting them as the frozen state.

MAJOR-1 is withdrawn. It is already accounted for by BLOCK-1. The reviewer flagged its own causal
theory as "partly unverified"; the unverified part is now resolved against it.

**Revised finding counts: 1 BLOCKER, 0 MAJOR, 2 MINOR, 5 OBSERVATION.**

## 15.3 §3 diffstat correction

§3 records the post-mutation state as `+512 / −35`. The measured value is **`+557 / −35`**
(`git diff --shortstat -- lib/ types/`; per-file numstat sums to 557). `557` also matches the
superseding freeze record. `512` corresponds to no state of the tree and appears to be an
arithmetic slip. The 804 → 886 line-count figures in §3 are correct.

## 15.4 Effect on the verdict

**The verdict is unchanged: FAIL, on 1 unresolved BLOCKER (BLOCK-1, candidate instability.)**

Withdrawing MAJOR-1 does not change it, because only a BLOCKER forces FAIL and BLOCK-1 is
independently confirmed. What changes is the remediation path: there is no defective freeze table
to regenerate. The required actions are to re-run the five gates against `3daf0790…`, and to review
the one test at `agent-execution-service.test.ts:1623` that no reviewer has yet examined.

Nothing in this addendum disturbs §6.1–6.7, which found the seven special-attention areas sound at
`ffc805f6…`, or §7, whose five exit-0 results were genuinely obtained at that state.
