# Fresh Independent Code Review — Sprint 1E Remediation Candidate C1

**Reviewer:** Independent Code Reviewer (AGENT-008)
**Date:** 2026-07-26
**Authority:** AGENTS.md, ADR-0001, ADR-0002, `standards/CODE_REVIEW_STANDARD.md`
**Review type:** Fresh and independent. No prior review conclusion was accepted as proof.

---

## 1. Verdict

> ## PASS WITH NON-BLOCKING FINDINGS

**Unresolved BLOCKER count: 0.**

**Suitable to proceed to Architecture Review: YES.** Architecture Review is the correct
next owner, because MAJOR-1 below is a question of O6 emission-site *policy*, which AR
owns, resting on a factual premise this review has disproved by execution.

Nothing in this candidate blocks commit. The candidate is a strict improvement on the
baseline: every one of the five specified emission sites is correctly instrumented, and
no previously-working behaviour is regressed. The two MAJOR findings concern a decline
path the remediation deliberately excluded on an incorrect rationale, and evidence
artifacts that overstate resolution. Neither is a defect *introduced* by the candidate.

Findings: 0 BLOCKER, 2 MAJOR, 3 MINOR, 4 OBSERVATION.

---

## 2. Candidate identity

Verified at the **start** (15:11:03Z) and **again at the end** (15:19:18Z) of this review.
**Both verifications passed and are byte-identical.** The candidate did not mutate during
the review.

| Item | Value | Verified |
|---|---|---|
| HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` | yes - start + end |
| Protected tag `sprint-1e-baseline` | `62f629128e5092f593ff494cd729fe516694bbde` | yes |
| Branch | `validation/sprint-1e-overnight-2026-07-26` | yes |
| Candidate diff | 289 lines, sha256 `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe` | yes - start + end |
| Staged changes | none | yes |

Per-file SHA-256 (all five matched the freeze document exactly, at start and at end):

| SHA-256 | File |
|---|---|
| `7c10c0a73edf29d9bb65aeaa91e4ce558e026e27cc771cf1ab3cda28aaa741c9` | `lib/dev-hq/constants.ts` |
| `2fedb1a4b2e136ad0ccaf101436c830e869a93798799f1e24a3208d6471f0ffa` | `lib/dev-hq/agent-execution-service.ts` |
| `284b97d23ab331878c14ed6e0c883635a1ab099d50e7cb5806d354764d58cb1c` | `lib/dev-hq/review-service.ts` |
| `6231cbab6ede7e81b35f372e202f83b2a66a33474737e68151de7115b4918f7f` | `lib/dev-hq/escalation-service.ts` |
| `2784fb8e6f90d78795ac1a4c1c0b99fff7dfc770d102477db2d84da9e28477b4` | `lib/dev-hq/agent-execution-service.test.ts` |

**Identity verification: PASSED.**

---

## 3. Independently reproduced validation

Every command below was actually executed against the frozen candidate. Exit codes are real.

| Command | Exit code | Actual result | Freeze-doc claim | Match |
|---|---|---|---|---|
| `npx tsc --noEmit` | **0** | no diagnostics | exit 0, no diagnostics | yes |
| `npx eslint .` | **0** | no diagnostics | exit 0, no diagnostics | yes |
| `npx vitest run` | **0** | `Test Files 22 passed (22)`, `Tests 318 passed (318)`, duration 1.52s | 22 files / 318 tests | yes |

All three freeze-document validation claims are independently confirmed. No discrepancy.

### Additional executed evidence (this review own probe)

To avoid modifying the repository under review, a probe test was written to the session
scratchpad and executed with a scratchpad-local vitest config rooted at the repo. **No
repository file was created, modified, staged, or committed at any point.**

```
npx vitest run --config <scratchpad>/probe.vitest.config.mjs --reporter=verbose
-> Test Files 1 passed (1) / Tests 1 passed (1)
PROBE status     = queued
PROBE agentId    = null
PROBE assignment = null
PROBE attempt    = 1
PROBE deferred # = 0
PROBE event types= []
```

This is the evidence behind MAJOR-1.

---

## 4. Findings

### MAJOR-1 — A reachable capacity decline still emits no event; the timeline is completely empty. CONFIRMED BY EXECUTION.

**Location:** `lib/dev-hq/agent-execution-service.ts:540-543`

```ts
    if (!assignmentId || !agentId) {
      if (!execution.routing) continue;
      const { decision, created } = await ensureAssignment(execution.id);
      if (!decision.assigned || !decision.assignment) continue;   // no deferral emitted
```

`reconcileQueuedDispatches` is a sixth site at which `ensureAssignment` can return
`reason: "no_agent_available"` while leaving the execution `queued`. It emits nothing.

**ADR text being applied.** `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md:203-204`:

> "Folded into O2: no available capability match leaves the execution `queued` **with a
> logged event**; budget exhaustion escalates via approval."

The ADR requires the queued outcome *and* the event. This path produces the first and not
the second.

**Why the recorded exclusion rationale does not hold.** `ISSUE_MATRIX.md:94` excludes this
site explicitly:

> | - | `reconcileQueuedDispatches:499` | **NO** | sweep re-observing; key no-ops it |

The rationale is that reconcile only *re-observes* a decline some other site already
recorded, so the dedupe key would suppress it anyway. **That premise is false on the
claim-deadline-expiry path**, which the comment at `agent-execution-service.ts:515-517`
describes as a real recovery case ("its worker lost the race for a capacity-one agent (or
died before claiming)"):

1. `dispatchAgentExecution` **succeeds**, so Site 1 correctly emits no deferral.
2. The worker never claims; another execution takes the capacity-one agent.
3. Sweep: `reclaimStale` skips the execution (it is `queued`, never `running`), so the
   reclaim loop body, and its Site 6 emission, **never runs**.
4. `reconcileQueuedDispatches`: `isClaimDeadlineExpired` is true, so
   `releaseAssignmentForReassignment` (`execution-manager.ts`) sets `agentId: null` and
   `assignmentId: null`, **does not increment `attempt`**, and **emits no event**.
5. Line 542 `ensureAssignment` returns `no_agent_available` (all agents busy), and the
   `continue` at 543 records nothing.

The execution is now `{ status: "queued", agentId: null, attempt: 1 }` with **zero events
of any type**. There is no prior key for the dedupe to no-op against, because no site ever
observed a decline at this attempt. Every subsequent sweep re-enters at step 5 and stays
silent permanently.

Executed result: `PROBE deferred # = 0`, `PROBE event types= []`.

This is verbatim defect **X1** as `ISSUE_MATRIX.md:134` defines it (status queued, agentId
null, no signal) surviving in the candidate that records X1 as resolved.

**Why the new X3 test does not catch it.** `handleExecutionReclaim` calls
`reconcileQueuedDispatches` at `agent-execution-service.ts:1091`, so the new test at
`agent-execution-service.test.ts:1545` does exercise this code. But the reclaim branch at
`:1071` has already emitted the deferral for that attempt, so the assertion
`toHaveLength(1)` passes whether or not reconcile emits. The gap is invisible to it.

**Severity: MAJOR, not BLOCKER.** It is an architectural (ADR-0001 O6) violation on a
reachable path, which is the MAJOR definition. It is not data loss, corruption, or
security exposure: the execution self-heals when capacity returns, and no attempt is
consumed. Critically, it is **pre-existing and not a regression**. Rejecting C1 would
leave the tree with *no* deferral events anywhere, which is strictly worse. The correct
disposition is to let C1 proceed and have Architecture Review rule on the emission site
before AR2-1 and X1 are recorded closed.

**Recommendation (labelled as recommendation, not an approved decision):** either add
`await ensureAssignmentDeferredEvent(execution, decision.reason);` before the `continue`
at `:543`, or have AR rule the site out on a rationale that survives the claim-deadline
path. The AR-1E correction at `SPRINT_1E_REMEDIATION_PATCH_SPEC.md:1165-1172`, that the
policy "should have specified a *condition*" rather than a site list, points to the former.

---

### MAJOR-2 — Evidence artifacts overstate resolution and misstate working-tree state. CONFIRMED.

Four separate inaccuracies, all verified directly:

**(a) Resolution overstated.** `CANDIDATE_C1_FREEZE.md:52` records X1 as *"Subsumed - the
queued execution is the ADR-approved outcome; the missing event was the entire
violation."* Since the missing event demonstrably persists on the path in MAJOR-1, X1 is
not fully resolved, and AR2-1 closes five of six sites rather than all of them. Under
AGENTS.md ("Do not present speculation as confirmed fact"; "Report known limitations,
risks, and incomplete work honestly") this must be corrected before the defects are
recorded closed.

**(b) `CANDIDATE_C1_FREEZE.md:85` is false as observed.** It asserts *"Tracked
modifications: exactly the five files above."* At both my start and end checks, **seven**
tracked files were modified:

```
 M agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md
 M docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_C1_FREEZE.md   [not disclosed anywhere]
 M lib/dev-hq/agent-execution-service.test.ts
 M lib/dev-hq/agent-execution-service.ts
 M lib/dev-hq/constants.ts
 M lib/dev-hq/escalation-service.ts
 M lib/dev-hq/review-service.ts
```

The sixth file (the spec) is disclosed by the ADDENDUM at `:169-237`, but line 85 was never
amended to match, so the document contradicts itself. **The seventh file, the freeze
document itself, is disclosed nowhere.**

**(c) `CANDIDATE_C1_FREEZE.md:12` records a stale HEAD.** It states HEAD is
`6301c06b52789c533603f2c7bd1997c71e00e65f` and annotates it *"(unchanged throughout)"*.
Actual HEAD is `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39`, of which `6301c06` is the
parent. The document contradicts itself internally: line 192 refers to the spec as
*"committed at `fe7fab1`"*.

**(d) The ADDENDUM recorded spec hash was already stale when written.**
`CANDIDATE_C1_FREEZE.md:193` records the current working-tree SHA-256 of the spec as
`ce7e8c1e1330de08da14dfc968dab907fd894be8dae6afcf5af6e79728bd7fc9` at 11:08:27. The actual
value at 15:11:03Z, unchanged at 15:19:18Z, is
`0e33bf872c35cd69b2377db2ec8490a11fd7fd2835d906b16036627d3f4e0b53`. The specification
changed at least once more after the addendum recorded it.

**Ruling on evidence-integrity severity, as requested:**

- *The undisclosed sixth and seventh tracked modifications:* **MAJOR.** A freeze document
  whose central working-tree assertion is false undermines the one thing a freeze exists to
  establish. It is MAJOR rather than BLOCKER because the **candidate is provably
  unaffected**: all five per-file hashes and the diff hash reproduced identically at start
  and end.
- *Live mutation of the spec during a frozen review:* **MINOR, mitigated to no material
  effect.** I verified this independently rather than accepting the addendum claim. I
  extracted only the fenced code-block content from the `## COMMIT 1` region of the
  committed spec (`5e4732f9...`, lines 29-426) and of the live spec (`0e33bf87...`, lines
  41-445). Both are **309 lines and hash identically to
  `eaadb41e800046a13db9724187ca36460d3342593395792a8685c2bb801563ee`**, and `diff` is empty.
  The C1 specification content is byte-identical across all spec versions. **No finding in
  this review would have changed.** The spec was also stable throughout my review
  (`0e33bf87` at both 15:11:03Z and 15:19:18Z) and identical to the 11:09 snapshot.

---

### MINOR-1 — `claimLost` constant shipped in C1 with no consumer; its doc comment describes behaviour that does not exist

**Location:** `lib/dev-hq/constants.ts:72-73, 79`

```ts
 * `claimLost` records that a dispatched worker lost the compare-and-set for its
 * agent and stood down. Both are outcomes of the lifecycle, not errors in it.
...
  claimLost: "execution.claim_lost",
```

Repository-wide grep for `claimLost` and `claim_lost` returns **only these two lines**. The
sole consumer, `ensureClaimLostEvent`, is specified in **COMMIT 2**
(`SPRINT_1E_REMEDIATION_PATCH_SPEC.md:594`, inside the COMMIT 2 region beginning at line
446), which is not applied. C1 therefore ships an unused constant whose doc comment asserts
in the present tense that it "records" a stand-down that nothing currently emits.

This is spec-conformant, since the constant sits inside the C1 region at spec lines 75 and
82, so it is not a deviation. It is a **MINOR** scope and documentation-accuracy issue: if
C2 is deferred or dropped, a permanently dead constant remains with prose describing a
non-existent behaviour. Worth a "reserved for Commit 2" note at minimum.

---

### MINOR-2 — The helper doc comment is internally inconsistent and misdescribes how the guard is reached

**Location:** `lib/dev-hq/agent-execution-service.ts:215, 221-223`

```ts
 * weight to a later simplification pass. It is not: it is the condition the five
 * call sites share, held in one place so they cannot drift apart.
 */
export async function ensureAssignmentDeferredEvent(
...
  // Do not remove: see the X4 note above. Sites 1, 4 and 5 can reach here with
  // `execution_not_queued`; sites 2 and 6 cannot, being enclosed by a queued
  // check. The guard is what keeps all six uniform at the call site.
```

Two problems within nine lines:

1. **"five call sites" versus "sites 1, 4, 5 ... 2 and 6" versus "all six".** There are
   exactly five call sites (`:730`, `:872`, `:1071`, `escalation-service.ts:293`,
   `review-service.ts:635`). The numbering is inherited from two incompatible schemes in
   the source documents: the spec calls the reclaim loop "Site 3" at section 1.5 but
   "Site 6" in the AR-1E table at `:1163`, while `ISSUE_MATRIX.md:83` heads a table
   "Emitting sites - SIX, not five" that counts a non-emitting manager site. A reader
   tracing "site 6" in the code will not find a sixth call.
2. **"the condition the five call sites share" is not accurate.** Two of the five, `:872`
   and `:1071`, pass the string literal `"no_agent_available"`, so the guard is
   structurally incapable of filtering them. Only the three sites that forward
   `decision.reason` are actually gated.

The runtime behaviour is correct in both cases, and the literals are truthful at their
sites. This is a comment-accuracy finding on prose written specifically to stop a future
engineer deleting the guard, which makes its precision load-bearing.

---

### MINOR-3 — Three of the five emission sites have no test coverage

Grep for `assignmentDeferred` in tests returns exactly three assertion sites:
`agent-execution-service.test.ts:136`, `:153`, and `:1584`. These cover **Site 1** (dispatch
decline) and the **reclaim** site. Uncovered:

| Site | Location | Covered |
|---|---|---|
| retry with no capacity | `agent-execution-service.ts:872` | no |
| review revision decline | `review-service.ts:635` | no |
| escalation revise decline | `escalation-service.ts:293` | no |

`ISSUE_MATRIX.md:96` calls the escalation site **"Site 5 is worst"**: the founder has just
made an explicit `revise` decision and the task reads `active` with nothing running. The
highest-priority emission site is pinned by no test. Deleting any of these three lines would
keep the suite green, which is the precise "false assurance" failure mode the new test
comment at `agent-execution-service.test.ts:12-16` was written to eliminate.

MINOR rather than MAJOR: the behaviour is correct today and the shared helper is
well-tested. This is a regression-durability gap, not incorrect behaviour.

---

### OBSERVATION-1 — Unbounded `eventKeys` map

`lib/dev-hq/store.ts:218-228`: `store.events` is capped at 200 entries, but `store.eventKeys`
grows without bound and retains each event object. The candidate adds one key per
(execution, attempt) deferral. Pre-existing in kind, since `assigned` and `retried` behave
identically, and already disclosed as CR-1E F10 and spec risk 3
(`SPRINT_1E_REMEDIATION_PATCH_SPEC.md:1271`). No action required in this candidate.

### OBSERVATION-2 — Dedupe atomicity is adapter-specific

`appendEvent` (`store.ts:220-224`) performs a get-then-set with no `await` between, so it is
atomic under the single-threaded in-memory dev adapter and the "exactly one event" claim
holds. A future Supabase adapter will need a unique constraint on the dedupe key to preserve
it. Pre-existing pattern, recorded for the adapter work rather than against this candidate.

### OBSERVATION-3 — Missing handbook

`agents/independent-code-reviewer/AGENT.md` references
`handbooks/INDEPENDENT_CODE_REVIEWER.md`, which does not exist in this repository. This
review was conducted against `standards/CODE_REVIEW_STANDARD.md` instead. Reported per
instruction; it did not impede the review.

### OBSERVATION-4 — Standards named but absent

`standards/` contains no NAMING, LOGGING, or ERROR_HANDLING standard, though the role
definition names them. No content was invented to fill the gap; the event-naming and
message-content judgements here rest on the ADRs and on in-repo convention only.

---

## 5. Resolution completeness — every reproduced defect

| ID | Claim | Verdict | Evidence |
|---|---|---|---|
| **AR2-1** | Declined dispatch logged zero events (ADR-0001 O6) | **PARTIALLY RESOLVED** | Five of six decline sites instrumented and correct. Sixth (`:542-543`) still silent. See MAJOR-1. |
| **X1** | Execution stranded queued / agentId null with no signal | **NOT FULLY RESOLVED** | The "subsumed by AR2-1" reasoning is sound in principle: the queuing *is* the ADR-approved outcome per O6 and O2, and adding an escalation would be the wrong fix. But it inherits the AR2-1 gap. The probe reproduces the stranded record with an empty timeline. |
| **X2** | Test asserted only `assigned === false` | **RESOLVED** | `agent-execution-service.test.ts:110-157` rewritten. Builds its own no-capacity fixture (`:117-119`) instead of relying on `gemini` shipping as `waiting`; asserts the event exists, is bound to `result.executionId`, is not duplicated on replay, and that status stays `queued`. Non-vacuous. |
| **X3** | Reclaimed-but-unassigned attempt recorded nothing | **RESOLVED** | Third branch `requeuedWithoutAgent` at `:1064-1065`, emission at `:1070-1071`. Pinned by `:1583-1585`. |
| **X4** | Reclaim message asserted a retry with no agent running | **RESOLVED** | Message branches on `requeuedWithAgent` / `requeuedWithoutAgent` (`:1057-1062`), that is on `agentId` rather than status alone. Pinned positively **and** negatively at `:1591-1592`. |

### Fail-before reasoning (reasoned, not executed - see section 9)

- Both new tests reference `EXECUTION_EVENT_TYPE.assignmentDeferred`, which the diff shows
  is **added** by this candidate (`constants.ts:77`). Pre-candidate the member does not
  exist, so both tests fail to typecheck and cannot pass. Sound.
- X4 independently: the removed line in the diff produced "...reclaimed and retrying as
  attempt N." for *any* queued execution. The new assertion
  `expect(reclaimed[0]?.message).not.toContain("retrying as attempt")` would therefore fail
  against the pre-candidate message. Sound.
- X3 independently: pre-candidate, `if (execution.status === "queued" && execution.agentId)`
  was false and neither remaining branch matched, so no deferral existed and
  `toHaveLength(1)` would fail. Sound.

---

## 6. Assessment dimensions

**Correctness.** The helper is correct. Keying on (execution.id, attempt) matches the
transition it records: entering "awaiting capacity" happens once per attempt. The
`reason !== "no_agent_available"` guard is right and its justification holds. I confirmed at
`execution-manager.ts:438-440` that `execution_not_queued` is returned only when
`execution.status !== "queued"`, so emitting a message asserting "it stays queued" there
would indeed be an untruth of exactly the X4 class. The one correctness gap is MAJOR-1.

**Regression risk - low.** I checked every consumer of the changed symbols.
`EXECUTION_EVENT_TYPE` has **no UI or route consumer**: grep across `.ts` and `.tsx`,
excluding tests, returns only `agent-execution-service.ts` and `constants.ts`. The
status-to-event map at `agent-execution-service.ts:302-306` is keyed by
`Execution["status"]`, not by event type, so adding two members breaks no exhaustive map,
confirming the blast-radius claim at spec `:1253`. `DispatchAgentExecutionResult` is
unchanged, so `DispatchAgentPanel.tsx:51` and the dispatch route are unaffected. All changes
are additive and the 318-test suite passes.

**Lifecycle consistency.** The reclaim loop now covers three outcomes where it covered two,
and I confirmed the three predicates are exhaustive over the reachable post-reclaim states:
queued with agent, queued without agent, and terminal (`failed`, routed to
`finalizeTerminalExecution`). No reachable state falls through unhandled. This is the
structural improvement of the candidate and it is correct.

**Concurrency and replay.** Convergent. Repeated sweeps do not re-reclaim, because a
reclaimed attempt is no longer `running` and `reclaimStale` skips it. Replayed dispatch
converges on the canonical execution and the dedupe key suppresses a second event, pinned by
the new test at `:144-155`. Event ordering is sound: `recordReclaimEvidence`, then
`reclaimed`, then the deferral, so the timeline reads in causal order.

**Idempotency.** The new event cannot be emitted twice for one logical occurrence. The
dedupe key is `execution.assignment_deferred:<executionId>:<attempt>` and `appendEvent`
returns the existing entry on key collision. A genuinely new attempt correctly records its
own. This is documented in the helper doc comment. Correct and adequately explained.

**Evidence integrity.** See MAJOR-2. The candidate is provably unaffected; the artifacts
describing it contain four verified inaccuracies.

**Test adequacy.** The two new tests are genuine rather than vacuous: each asserts
post-state, not merely absence of a throw, and the X2 rewrite deliberately constructs its
own fixture. The gap is coverage breadth (MINOR-3), not assertion quality. One point in the
favour of the candidate: `expect(requeued.agentId).toBeNull()` at `:1573` guards the X3
fixture against becoming vacuous if provider pinning ever changes, which is a deliberate and
correct precaution.

**Scope adherence - good, with one exception.** No unrelated refactor, no dependency change,
no public-behaviour change, and no ADR modified (`docs/decisions/` is clean, verified). The
dynamic imports added at `review-service.ts:632` and `escalation-service.ts:290` follow the
**existing** convention in both files (`review-service.ts:642`, `:658`,
`escalation-service.ts:305`), so they introduce no new import edge or cycle risk, exactly as
`ISSUE_MATRIX.md:103-106` claims. The one exception is the `claimLost` constant (MINOR-1),
which belongs to Commit 2.

**Security.** No security-relevant surface is touched. No credential, secret, token, or
authorization boundary is involved. The new event message embeds only `execution.id` and
`execution.taskId`, internal identifiers already present throughout the timeline, with no
user-supplied content, so there is no injection or information-disclosure vector. `actorId`
is correctly `null` with `actorLabel: "System"`, accurately attributing a system-originated
event rather than impersonating an agent or the founder. **No security findings.**

**Performance.** Negligible and bounded. Each emission is one Map get plus at most one
`unshift` into a 200-entry array. The dedupe key makes repeated sweeps O(1) no-ops rather
than accumulating work; the attempt-scoped design at `ISSUE_MATRIX.md:79-81` correctly avoids
flooding the 200-entry buffer and evicting the timeline that E5 depends on. The only growth
term is the unbounded `eventKeys` map (OBSERVATION-1), pre-existing and disclosed. **No
performance findings.**

---

## 7. Standards compliance

| Standard | Result |
|---|---|
| `CODE_REVIEW_STANDARD.md` | Followed; findings cite file:line and quote the code. |
| TypeScript | `tsc --noEmit` exit 0. Parameter correctly typed `AssignmentDecision["reason"]` rather than widened to `string`. |
| Testing | New tests assert post-state and idempotency. Coverage gap at MINOR-3. |
| Security | No applicable surface touched. |
| Observability | The purpose of the change. Advanced materially; MAJOR-1 is the remaining gap. |
| Documentation | Comments are unusually thorough; MINOR-1 and MINOR-2 are accuracy defects within them. |
| Git | Nothing staged or committed. Working-tree only, as required. |
| API / Database / Next.js / React / Accessibility | Not applicable: no route, schema, component, or user-facing surface touched. |

---

## 8. Everything inspected

**Source read in full or in relevant part:** `lib/dev-hq/agent-execution-service.ts` (helper
`:193-235`, `reconcileQueuedDispatches` `:499-565`, dispatch `:724-731`,
`handleExecutionComplete` `:840-895`, `handleExecutionReclaim` `:1037-1095`),
`lib/dev-hq/constants.ts`, `lib/dev-hq/review-service.ts:620-660`,
`lib/dev-hq/escalation-service.ts:280-310`, `lib/dev-hq/agent-execution-service.test.ts`
(`:1-70`, `:107-157`, `:1542-1596`), `lib/dev-hq/execution-manager.ts` (`ensureAssignment`
`:402-470`, `releaseAssignmentForReassignment`, `assignExecution` `:220-270`, `routingFrom`
`:99-108`), `lib/dev-hq/store.ts:218-228`, `lib/dev-hq/adapters/dev-event-logger.ts`,
`types/domain/execution.ts`, `types/domain/agent-assignment.ts`,
`types/contracts/execution-runner.ts`, `components/dashboard/DispatchAgentPanel.tsx:51`,
`vitest.config.ts`.

**Evidence artifacts read:** `CANDIDATE_C1_FREEZE.md` (all 250 lines), `ISSUE_MATRIX.md`
(emission-site table `:78-114`, defect matrix `:116-195`, `:263-266`),
`SPRINT_1E_REMEDIATION_PATCH_SPEC.md` (sections 1.3 to 1.7 site definitions, AR-1E rulings
`:1148-1226`, apply-safety `:1229-1246`, blast radius `:1248-1265`, risks and deviations
`:1267-1294`, Amendment 4 `:1298+`), the frozen candidate diff `CANDIDATE_C1.diff`, and the
coordinator snapshot `SPEC_SNAPSHOT_1109.md`.

**Governance and decisions read:** `AGENTS.md`, ADR-0001 (O1-O6 `:160-204`, especially O6
`:201-204`), ADR-0002 (existence and E-numbering confirmed),
`standards/CODE_REVIEW_STANDARD.md`.

**Read but not relied upon for any finding:** `WORKFLOW_DIAGNOSIS.md`,
`VALIDATION_REPORT.md`, `RUN_LEDGER.md`, and the prior CR and AR reviews in
`agents/*/outputs/` were consulted as *claims*. No conclusion in this report rests on them.
Every technical assertion here was re-derived from source or executed.

---

## 9. Limitations and unverified claims - stated honestly

1. **Fail-before was reasoned, not executed.** Proving the new tests fail against the
   pre-candidate tree requires reverting the working tree, which the review-only constraint
   forbids. The reasoning in section 5 is sound and rests on the diff (the event-type member
   does not exist pre-candidate; the old reclaim message text is visible as a removed line),
   but **I did not observe a red test run.**
2. **The MAJOR-1 probe used a store-level fixture, not a live dispatch.** The first probe
   attempt exercised the real `dispatchAgentExecution`, but `vi.mock("@trigger.dev/sdk")`
   does not bind for a test file outside the vitest root, so the real SDK loaded and threw on
   a missing `TRIGGER_SECRET_KEY`. I therefore constructed the assigned-but-unclaimed state
   directly via `saveExecution` and `saveAssignment`, using a real seeded agent id, provider,
   and capabilities. The constructed state matches what `dispatchAgentExecution` produces,
   and the code under test (`handleExecutionReclaim` then `reconcileQueuedDispatches`) is
   entirely real and unmocked. I judge the reproduction sound, but the *route into* the state
   was synthesized rather than driven end to end.
3. **`npx next build` was not run.** The freeze document defers it to Commit 4. I did not run
   it and make no claim about it.
4. **No runtime, browser, accessibility, or database validation** was performed. None is
   applicable to this diff, which touches no route, component, or schema.
5. **Provenance of the parallel-workstream artifacts was not verified.** The seven untracked
   planning documents are outside this candidate and outside my scope. The attribution
   limitation the freeze document records at `:126-129` is unresolved and I did not
   independently address it.
6. **Named attribution of spec Amendment 4 is unverifiable from this session.** I verified
   its *effect* on C1 (none, since the code blocks are byte-identical) but not who authored
   it or under what authorization.
7. **The 200-entry event buffer could in principle mask events** in a long-running store. All
   observations here use `limit: 200` against a store reset per test, so this affects no
   result reported above, but it is a limit of the observation method.
8. **I did not audit ADR-0002 compliance in depth.** The emission pattern follows ADR-0002 E3
   emitter ownership as described at `ISSUE_MATRIX.md:100-112`, and I confirmed the structural
   claim (no manager emission, no new import edge), but I did not audit E1, E2, or E5 against
   the full review-escalation lifecycle.

---

## 10. Does anything block commit?

**No. Nothing in this candidate blocks commit.**

- 0 BLOCKER findings.
- 2 MAJOR, 3 MINOR, 4 OBSERVATION.
- MAJOR-1 is a pre-existing gap the candidate narrows but does not close. Blocking C1 would
  leave the system with no deferral events at all, which is strictly worse.
- MAJOR-2 concerns documents rather than code, and the candidate is provably unaffected by it.

**Two items should be resolved before AR2-1 and X1 are recorded as closed**, which is a
separate gate from commit:

1. Architecture Review rules on whether `reconcileQueuedDispatches:542-543` is an O6 emission
   site, in light of the disproved rationale at `ISSUE_MATRIX.md:94`.
2. `CANDIDATE_C1_FREEZE.md` is corrected at lines 12, 52, 85, and 193.

**Proceed to Architecture Review: YES.**

---

*Reviewed read-only. No repository file was created, modified, staged, or committed by this
review other than this report. Candidate hash `9d56ed51...` verified identical at 15:11:03Z
and 15:19:18Z.*

---

## Appendix A — Post-review integrity check (15:31:39Z)

A third identity check was taken after the report was written.

| Item | Value | Status |
|---|---|---|
| HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` | unchanged |
| Candidate diff sha256 | `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe` | **unchanged across all three checks** |

**The specification mutated a third time under this review.** Its SHA-256 moved from
`0e33bf872c35cd69b2377db2ec8490a11fd7fd2835d906b16036627d3f4e0b53` (stable at 15:11:03Z and
15:19:18Z, and identical to the 11:09 coordinator snapshot I reviewed against) to
`ba2cc6f2caf4f906e110a800d5c84de81606a3f5bc15528dce56dbc8cf337a4d` at 15:31:39Z. The COMMIT 4
heading moved from line 901 to line 916, so the edit landed in the COMMIT 3 or COMMIT 4
region.

**It changed no finding in this review.** I re-extracted the fenced code-block content of the
`## COMMIT 1` region from this newest version: still 309 lines, still hashing to
`eaadb41e800046a13db9724187ca36460d3342593395792a8685c2bb801563ee`, byte-identical to both
the committed and the 11:09 versions.

An **eighth** tracked file also became modified during the writing of this report:
`docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md`. It was not modified
at either the 15:11:03Z or 15:19:18Z check. This reinforces MAJOR-2(b): the working tree is
not frozen, and the freeze document assertion at line 85 was false at every point I measured
it. The candidate source and test files, by contrast, were stable at every check.

**Net effect on the verdict: none.** The candidate is byte-identical across all three
verifications, and every finding above was derived from a version of the specification whose
C1 content is provably identical to the committed one.

---

## Appendix B — Coordinator leads adjudicated, and a correction to the spec timeline

### B.0 Correction: the specification DID change again, after the coordinator monitoring window closed

The coordinator reported the spec settled at blob `5386bafe...` and that "the specification
did NOT change under you after your snapshot was taken." **That was true when written and is
no longer true.** I verified both halves:

- Both frozen snapshots are genuine and identical: `git hash-object` of
  `SPEC_SNAPSHOT_1109.md` and `SPEC_SNAPSHOT_1115.md` both return
  `5386bafefbcfbceaa834766848d38d235742bd24`, matching the reported settled hash exactly,
  and `diff` between them is empty. The coordinator observations were accurate.
- **A third mutation landed after their sampling stopped at 11:14:45.** At 15:31:39Z and
  again at 15:33:54Z the live spec is blob `88b5cfa61ff20a8113aefbfab22f53781eac9808`,
  sha256 `ba2cc6f2caf4f906e110a800d5c84de81606a3f5bc15528dce56dbc8cf337a4d`, and it differs
  from both snapshots.

**What changed, and why it does not affect this review.** The delta is a new **Amendment 5
(SPEC-AMEND MAJOR-A)** at spec `:845-870`, which supersedes Amendment 4 on a **COMMIT 3**
import instruction: Amendment 4 said *"after line 24"* while also directing `saveExecution`
between lines 22 and 23, which would have landed the `MAX_EXECUTION_ATTEMPTS` import inside
the import braces and failed `tsc`. That is a genuine C3 apply-safety fix and is entirely
outside COMMIT 1. I re-extracted the `## COMMIT 1` fenced code blocks from this newest
version: still 309 lines, still
`eaadb41e800046a13db9724187ca36460d3342593395792a8685c2bb801563ee`. **No finding changes.**

Full observed spec timeline (coordinator blob hashes, mine appended):

| Time | Hash | Note |
|---|---|---|
| ~11:07 | (64 added lines) | coordinator |
| 11:08:27 | `82b1f635...` (132 added lines) | coordinator |
| 11:09:14 | `363ee9dd...` | coordinator |
| ~11:09:2x - 11:14:45 | `5386bafe...` | coordinator, 6+ samples; equals both snapshots |
| 11:11:03 / 11:19:18 (my checks) | `5386bafe...` / sha256 `0e33bf87...` | stable; identical to snapshot |
| ~11:31 (detected 15:31:39Z) | `88b5cfa6...` / sha256 `ba2cc6f2...` | **third mutation - Amendment 5, COMMIT 3 region** |

### B.1 Severity rulings requested

**(a) `CANDIDATE_C1_FREEZE.md:85` - "Tracked modifications: exactly the five files above" is
factually false. Severity: MAJOR.** Already recorded as MAJOR-2(b). At every point I
measured, at least seven and later eight tracked files were modified. Mitigation is real but
partial: the candidate five never moved across four independent checks, so the assertion that
matters most - that the *code* is frozen - held. It is MAJOR rather than BLOCKER for exactly
that reason.

**(b) The spec was rewritten inside a window the freeze document declares frozen
(`:171`, "Fresh Independent Code Review - in progress"). Severity: MINOR.** Mitigation
accepted and independently confirmed: it settled before my substantive review began, my
snapshot captured the settled content, and the C1 code blocks are byte-identical across every
version that has ever existed. The third mutation (B.0) landed after my substantive findings
were fixed and touched only COMMIT 3. **However**, the mitigation is weaker than the
coordinator framing suggests, because the file did not in fact stop moving - it moved again.
The correct process conclusion is not "it settled" but "it kept moving and happened not to
touch C1." MINOR stands, because no finding was affected and the candidate never moved.

### B.2 LEAD 1 - `claimLost` shipped with no emitter: CONFIRMED, severity held at MINOR

Every element of the lead is verified:

- `lib/dev-hq/constants.ts:79` adds `claimLost`; grep across `lib/` and `app/` finds no
  emission site and no production reference beyond the declaration and its doc comment.
- `ISSUE_MATRIX.md:147` does assign `claim_lost` to **F1**, whose fix it locates at
  `execution-manager.ts:525-529`. I read those lines: they are the
  `Agent ... is not available to claim` throw. That file is **not** among the five candidate
  files.
- F1 emission is specified at `SPRINT_1E_REMEDIATION_PATCH_SPEC.md:601` and its regression
  test at `:743`; both sit inside the **COMMIT 2** region (which begins at `:446`), so
  neither is in this candidate.
- The freeze document defect table (`:49-55`) lists AR2-1, X1, X3, X4, X2 and does **not**
  mention F1 or `claim_lost`.
- Downstream references check out: `SPRINT_1F_MISSION_CONTROL_LITE.md:39,556,669` and
  `PHASE_2_PROGRAM_PLAN.md:197,3740` (and also `:3873`, `:3997`) do treat the two event types
  as a pair.

So Commit 1 does ship the public event vocabulary for a defect it neither fixes nor tests.

**Held at MINOR, not upgraded, for three reasons.** First, it *is* authorized: I verified the
constant sits inside the approved COMMIT 1 region of the patch specification (spec lines 75
and 82, region `:41-445`), so this is spec-conformant, not a deviation - and
`ISSUE_MATRIX.md:147` lists `constants.ts` among F1 files, which is how the two commits come
to share one file. Second, it has zero runtime effect: no emitter, no consumer, no exhaustive
map (`agent-execution-service.ts:302-306` is keyed by `Execution["status"]`, not event type),
so nothing can misbehave. Third, the downstream coupling argument is weaker than it looks -
those plan documents describe the *whole 1E remediation set* as awaiting Founder approval and
explicitly list `execution-manager.ts` among its targets, so they are coupled to the
remediation, not to Commit 1 specifically; and per `CANDIDATE_C1_FREEZE.md:107-109` they are
untracked planning artifacts that "authorize no implementation."

The residual issue is a **disclosure gap**, not a scope breach: the freeze document defect
table should note that C1 also lands F1 vocabulary, so a reader does not conclude
`claim_lost` is live. That is MINOR.

### B.3 LEAD 2 - the "Site 6" numeral: REFUTED in part. The proposed correction is wrong.

The coordinator reading is that the numeral is wrong and **"6" should be "3"**. I checked
this against the numbering actually in force and **it should not.** Making that change would
introduce a factual error where none exists.

`ISSUE_MATRIX.md:83-94` defines a **six-row** scheme, and it is internally coherent:

| # | Site | Emits? |
|---|---|---|
| 1 | `agent-execution-service.ts:682-690` | yes |
| 2 | `agent-execution-service.ts:823-825` | yes |
| **3** | **`execution-manager.ts:172-186`** | **NO - "inside the manager - purity"** |
| 4 | `review-service.ts:626-631` | yes |
| 5 | `escalation-service.ts:285-290` | yes |
| 6 | `agent-execution-service.ts:1005-1020` (reclaim loop) | yes |

Six rows, five of which emit. The shipped comment says *"Sites 1, 4 and 5 can reach here with
`execution_not_queued`; sites 2 and 6 cannot"* - which enumerates exactly the five emitting
sites under this scheme, with no gaps and no invented site. **Under `ISSUE_MATRIX`, "6" is
correct.** Renaming it "3" would point the reader at `execution-manager.ts:172-186`, which is
explicitly a **non-emitting** site and not a call site at all - the opposite of what the
sentence asserts.

I also verified the substance the numerals attach to, and it is correct in both directions:

- Site 2 (`agent-execution-service.ts:872`) is enclosed by `if (execution.status === "queued")`
  at `:865` **and** passes the literal `"no_agent_available"`. It cannot carry
  `execution_not_queued`. Matches.
- Site 6 (`:1071`) is enclosed by `requeuedWithoutAgent`, which requires
  `execution.status === "queued"` (`:1064-1065`), and also passes the literal. Matches.
- Sites 1, 4, 5 (`:730`, `review-service.ts:635`, `escalation-service.ts:293`) each forward
  `decision.reason`, so each genuinely can carry `execution_not_queued`. Matches.

**The real defect is narrower than either reading, and MINOR-2 stands as written.** The
numerals are right; the *counts* collide. Within nine lines the code says "the five call
sites" (`:215`) and "all six" (`:223`), because the first counts call sites and the second
counts `ISSUE_MATRIX` table rows. The spec compounds it by using a *second* scheme in which
the reclaim loop is "Site 3" (`§1.5`, spec `:182`) while its own AR-1E table calls the same
loop "Site 6" (`:1163`), and by saying "the six sites" at `:1284` and "five" at `:110` and
`:1288`.

**Confirmed count: five call sites, six `ISSUE_MATRIX` rows.** The right repair is to make the
comment name the scheme (for example "sites 2 and 6 of the ISSUE_MATRIX table") or to drop
the numerals and name the functions, not to renumber 6 to 3.

**MINOR, not MAJOR - and I agree the irony is worth recording.** A comment written at length
specifically to stop a future maintainer deleting a load-bearing guard does misdirect that
maintainer, which is a real cost. But it misdirects only on a cross-reference: the *substance*
of the sentence, which is the part that justifies the guard, is entirely correct, and the
guard itself is correct. No runtime behaviour is wrong and no reachable path misbehaves. That
is MINOR by the severity model. Upgrading a correct guard with an ambiguous footnote to MAJOR
would be inflation.

### B.4 Additional verifications requested

**Does `eventLogger` actually honour `dedupeKey`? YES - the replay assertion is meaningful.**
`lib/dev-hq/adapters/dev-event-logger.ts:19` is `return appendEvent(event, input.dedupeKey)`,
and `store.ts:220-224` returns the existing event when the key is present rather than
appending. `lib/dev-hq/adapters/index.ts` wires `createDevEventLogger` as the active
`eventLogger`, which is what the tests read through `getDevHqAdapters()`. I also confirmed the
replay in the first test genuinely *reaches* the emission site rather than short-circuiting
earlier: `dispatchAgentExecution` runs `ensureExecution` -> `assertRequestMatches` ->
`ensureAssignment`, and only then hits the decline at `:730`, with no early return in between
(`:705-730`). So a second event would be produced if dedupe were ignored, and the
`toHaveLength(1)` assertion does prove idempotency rather than passing vacuously.

**Is `execution.attempt` read pre- or post-increment? Post-increment where a requeue
happened, and there is no off-by-one at any of the five sites.** `applyFailedAttempt`
(`execution-manager.ts:167-206`) computes `nextAttempt = attempt + 1` and its no-capacity
branch (`:176-185`) returns the record already carrying `attempt: nextAttempt` with
`agentId: null` and `assignmentId: null`. Site 2 therefore receives the **post**-increment
record, so the deferral is keyed to the attempt that is actually waiting - which is the
correct semantics. The reclaim site is likewise post-increment (the new test asserts
`requeued.attempt` is 2 and exactly one deferral). Sites 1, 4 and 5 pass the current
execution, whose attempt has not moved. Notably the same function separately captures the
**pre**-increment value at `agent-execution-service.ts:843` (`const attempt = current.attempt ?? 1`)
for `ensureAttemptRecords`, so the two distinct meanings are handled distinctly and correctly.

**Does `provider: "provider-withdrawn"` typecheck against a union? There is no union.**
`types/domain/agent.ts:7` declares `provider: string`, unconstrained. The fixture therefore
typechecks trivially (consistent with `tsc` exit 0). Worth recording as a small caveat: because
provider values are not a closed set, nothing type-guards the pin, so the X3 fixture rests on a
runtime string convention. The test compensates with `expect(requeued.agentId).toBeNull()` at
`:1573`, which is why it cannot go vacuously green.

**Do the two dynamic `await import()` calls introduce a cycle or a hot-path cost? No - they
*prevent* a cycle, and the path is cold.** A genuine cycle exists:
`agent-execution-service.ts:34` **statically** imports `raiseRetryExhaustionEscalation` from
`escalation-service`, while `escalation-service.ts:290` imports back into
`agent-execution-service`. Deferring that second edge to call time is exactly what keeps
module initialization acyclic, and it is the pre-existing convention in both files
(`escalation-service.ts:305`, `review-service.ts:642`, `:658`, and `agent-execution-service.ts:923`
in the other direction). Cost is negligible: ESM resolves a dynamic import once and caches the
module namespace, and these two sites are on the capacity-decline path, not a hot path. **Not a
finding.**

### B.5 Effect on the verdict

None. No lead produced a BLOCKER, no severity moved, and the candidate hash is unchanged at a
fourth check (15:33:54Z, `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe`).
Final tally remains **0 BLOCKER, 2 MAJOR, 3 MINOR, 4 OBSERVATION**, verdict
**PASS WITH NON-BLOCKING FINDINGS**, and the candidate remains suitable to proceed to
Architecture Review.

---

# POST-REVIEW ADDENDUM — scope and validity of this verdict

**Appended by the coordinating session, 2026-07-26, on Founder instruction.**

## Recorded verdict

| Field | Value |
|---|---|
| Verdict | **PASS WITH NON-BLOCKING FINDINGS** |
| Blockers | **0** |
| Valid for | Candidate `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe` **only** |
| Suitability | Sufficient to proceed to Architecture Review **at the time reviewed** |
| Transferability | **NOT transferable to the current working tree** |

## The five required statements

1. **The reviewed candidate stayed frozen throughout the review window.** The
   candidate-only diff (`git diff -- lib/dev-hq/`) was verified against its freeze hash
   at multiple independent checkpoints across the review period, and matched
   `9d56ed51…` on every one. It did not drift by a byte while the review was open.

2. **Mutation began only after the review completed.** The first divergence of the
   candidate hash was observed *after* this review was produced. No change entered the
   reviewed files during the review window.

3. **The verdict applies only to candidate `9d56ed51…`.** It certifies that specific
   289-line, five-file change set and nothing else.

4. **The current working tree is NOT certified by this verdict.** The tree has since
   advanced well beyond the reviewed candidate: C2, C3 and C4 have all been applied by
   a session other than the coordinating session. The current source diff hashes
   `a234e5e8cb297e223cb344351e7479739a817b1f811a434f3404240752f9735f`
   (`lib/dev-hq/` scope) — a different artifact entirely. **This verdict must not be
   cited as review coverage for the current tree.**

5. **The exact reviewed candidate remains recoverable.** The frozen diff artifact is
   preserved at the coordinating session's scratchpad as `CANDIDATE_C1.diff`, 289 lines,
   whose content hashes exactly `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe`.
   The reviewed state is reconstructible from `sprint-1e-baseline` (`62f6291`) plus that
   diff. Per-file SHA-256 values for the reviewed candidate are recorded in
   `CANDIDATE_C1_FREEZE.md`.

## Coordinator note on what this does and does not establish

This addendum narrows the verdict; it does not diminish it. The review was genuinely
performed against a genuinely frozen artifact, and the monitoring record supports that.

What it cannot do is certify code it never saw. C2, C3 and C4 introduce changes of a
materially different character from C1 — in particular a **port change** widening
`claimExecution` and `runExecution` to `Promise<Execution | null>` in
`types/contracts/execution-runner.ts`, which ADR-0001 D7 designates as the concurrency
contract a future durable adapter must meet. That is precisely the kind of change that
warrants its own independent review rather than inheriting one.
