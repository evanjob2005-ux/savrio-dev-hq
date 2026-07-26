# Sprint 1E Remediation — FINAL Candidate Freeze (C1–C4 + MAJOR-1 follow-up)

**Status:** FROZEN FOR REVIEW. **UNCOMMITTED.** Working-tree only.
**Supersedes:** `CANDIDATE_C1_FREEZE.md` for sequencing purposes. That artifact and its
post-review mutation addendum remain in the evidence package as **historical evidence for
candidate `9d56ed51…` only** — it is **not** certification of this tree.

---

## Identity

| Item | Value |
|---|---|
| HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` |
| Protected baseline tag | `sprint-1e-baseline` → `62f629128e5092f593ff494cd729fe516694bbde` (**unmoved**) |
| Branch | `validation/sprint-1e-overnight-2026-07-26` |
| **Full-candidate diff hash** | **`ffc805f60c404d8f8daafa9afb47cada263623e5e82b3d3dd378af4b6d4549b5`** |
| Diff scope | `git diff -- lib/ types/` · 804 lines |
| Frozen artifact | session scratchpad `CANDIDATE_FINAL.diff` (content hash identical) |
| Staged | **0 files** |

**⚠️ UNCOMMITTED.** No remediation commit exists. Per the required sequence this cannot be
staged or committed until Fresh Independent Code Review → Architecture Review → Founder
Approval have all completed.

---

## Contents — C1, C2, C3, C4, plus the MAJOR-1 follow-up

| Unit | Defects | Status |
|---|---|---|
| C1 | AR2-1, X1 (partial), X3, X4, X2 | Applied |
| C2 | F1, X2b, D1 | Applied |
| C3 | F4, D2 | Applied |
| C4 | AR2-4 | Applied |
| **Follow-up** | **MAJOR-1 — the surviving X1 decline path** | **Applied** |

### The MAJOR-1 follow-up (Founder-authorized, narrow)

The fresh Independent Code Review of candidate `9d56ed51…` confirmed **by execution** that
a **sixth** decline site survived: `reconcileQueuedDispatches` declined at
`!decision.assigned || !decision.assignment` with a bare `continue`, leaving
`{status:"queued", agentId:null, attempt:unchanged}` and an **empty timeline** — verbatim
X1, in the candidate that recorded X1 resolved.

**Fix applied**, `lib/dev-hq/agent-execution-service.ts` (sixth emission site):

```ts
if (!decision.assigned || !decision.assignment) {
  // X1's surviving path … Outcome is unchanged: it still stays queued and this
  // still continues. Only the missing record is supplied.
  //
  // Idempotency is the emitter's existing per-(execution, attempt) dedupe key,
  // so repeat sweeps no-op rather than appending one entry per cycle.
  await ensureAssignmentDeferredEvent(execution, decision.reason);
  continue;
}
```

**Conformance to the authorized scope:**

| Requirement | Verified |
|---|---|
| Fix the `reconcileQueuedDispatches` decline path | ✅ emission added before the existing `continue` |
| Preserve idempotency / dedup semantics | ✅ reuses the emitter's per-`(execution, attempt)` key; no new key introduced |
| Regression test for claim-deadline expiry | ✅ `agent-execution-service.test.ts:1644` |
| Event emitted exactly once | ✅ test asserts `toHaveLength(1)` |
| Replay/reconciliation does not duplicate | ✅ test runs two further sweeps, still `toHaveLength(1)`, `attempt` untouched |
| No unrelated behaviour altered | ✅ outcome unchanged — still queued, still `continue`; `decision.reason` passed so the helper's guard still filters `execution_not_queued` |

**Deferral emission sites: now six** — `agent-execution-service.ts` `:580` (new), `:769`,
`:926`, `:1132`; `escalation-service.ts:293`; `review-service.ts:635`.

---

## Correction to the evidence package — X1 was NOT fully resolved before this follow-up

Recorded per Founder instruction. `CANDIDATE_C1_FREEZE.md` originally recorded X1 as
*"Subsumed"* by AR2-1. **That claim was overstated.** The principle was sound — the queued
execution *is* the ADR-approved outcome per O6/O2, and adding an escalation would have been
the wrong fix — but X1 **inherited AR2-1's coverage gap**: five sites instrumented, a sixth
left silent.

**Neither AR2-1 nor X1 may be recorded as closed on the strength of C1 alone.** Both close
only with this follow-up included. The correction is recorded in `CANDIDATE_C1_FREEZE.md`
and repeated here so the final package does not carry the overstatement.

**Why C1's gates could not have caught it:** the X3 test's `toHaveLength(1)` assertion
passes whether or not the sweep emits, because the reclaim branch had already emitted for
that attempt. The gap was invisible to the test that appeared to cover it — the same
false-assurance pattern this remediation exists to eliminate, found inside the remediation.

---

## Modified files — 10, all in scope

```
 lib/dev-hq/adapters/dev-execution-runner.test.ts |   2 +-
 lib/dev-hq/adapters/dev-execution-runner.ts      |   7 +-
 lib/dev-hq/agent-execution-service.test.ts       | 215 ++++++++++++++++++++++-
 lib/dev-hq/agent-execution-service.ts            | 131 +++++++++++++-
 lib/dev-hq/constants.ts                          |  10 ++
 lib/dev-hq/escalation-service.ts                 |   7 +-
 lib/dev-hq/execution-manager.test.ts             |  75 +++++++-
 lib/dev-hq/execution-manager.ts                  |  43 +++--
 lib/dev-hq/review-service.ts                     |   8 +-
 types/contracts/execution-runner.ts              |  12 +-
 10 files changed, 475 insertions(+), 35 deletions(-)
```

**Out-of-scope audit: PASSED** — every modified source/test file is within the
specification's named set. No ADR modified. No configuration modified. No build artifact
leaked (`.next/`, `*.tsbuildinfo` gitignored, 0 leaked).

### Per-file SHA-256

| SHA-256 | File |
|---|---|
| `7c10c0a73edf29d9bb65aeaa91e4ce558e026e27cc771cf1ab3cda28aaa741c9` | `lib/dev-hq/constants.ts` |
| `51ebbc2e0f9eaa9674825de894703791d82626035f806e12e5243c0586bf4af7` | `lib/dev-hq/agent-execution-service.ts` |
| `0dca1f03d5e91660f1efc97d87da43397554b20973d052627684e9e545fa1b5c` | `lib/dev-hq/agent-execution-service.test.ts` |
| `f5857d412fdcc31800bf8c4e7c55692aba95a8a8b666e7793a1d0788c2c80907` | `lib/dev-hq/execution-manager.ts` |
| `77cac31bdcadcb38daa5c097876de7795a69e3b992a77421cfbd4a19f2900645` | `lib/dev-hq/execution-manager.test.ts` |
| `284b97d23ab331878c14ed6e0c883635a1ab099d50e7cb5806d354764d58cb1c` | `lib/dev-hq/review-service.ts` |
| `6231cbab6ede7e81b35f372e202f83b2a66a33474737e68151de7115b4918f7f` | `lib/dev-hq/escalation-service.ts` |
| `765a7ea15fa2605bc0fdf487cc636d11729426470a7d5e44c8e9364e8feb101f` | `types/contracts/execution-runner.ts` |
| `bc7eab76ab37c48f4df8d1567d3a91a4a95ca78d03b0dde3f4243e868a3d2ea7` | `lib/dev-hq/adapters/dev-execution-runner.ts` |
| `d9418f68892f941f89e94819b5568e4e14e5efa45af51cac12c31c22563a5477` | `lib/dev-hq/adapters/dev-execution-runner.test.ts` |

---

## Test results — all gates pass

| # | Gate | Result |
|---|---|---|
| 1 | `npx tsc --noEmit` | **exit 0**, no diagnostics |
| 2 | `npx eslint .` | **exit 0**, no diagnostics |
| 3 | Targeted remediation tests | **3 files, 96 tests passed** |
| 4 | `npx vitest run` | **22 files, 321 tests passed** |
| 5 | `npx next build` | **exit 0**, compiled successfully, 18/18 static pages, all routes built |

**Test count trajectory:** baseline 317 → C1 318 → C1–C4 320 → **+MAJOR-1 follow-up 321.**

---

## Audit findings from the pre-freeze inspection

| Question | Answer |
|---|---|
| C1/C2/C3/C4 each fully applied? | **Yes**, all four |
| Partial, duplicated, conflicting, out-of-order application? | **None.** Each new symbol appears exactly once; no conflict markers |
| Matches the amended specification? | **Yes**, including Amendment 4's post-C1 re-anchoring |
| Surviving X1 decline path fixed? | **Yes**, by this follow-up |
| Any change outside approved scope? | **No** |

---

## Port change — carried disclosure

C2 widens `claimExecution` and `runExecution` to `Promise<Execution | null>` in
**`types/contracts/execution-runner.ts`**. ADR-0001 D7 designates those compare-and-set
semantics as *"a concurrency contract to meet"* for a future durable adapter, so this is a
**port change, not an internal refactor**. Both reviewers supported it: a contract promising
an `Execution` from an operation that can legitimately lose a race is one no future adapter
could truthfully implement. **Deliberately deferred to AR2-6:** making `assignmentId`
required on the three callback handlers belongs with this as one coherent port revision.

---

## Evidence manifest

| Artifact | Path |
|---|---|
| **This freeze (final)** | `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_FINAL_FREEZE.md` |
| C1-only freeze + mutation addendum | `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_C1_FREEZE.md` |
| Fresh CR of C1 + post-review addendum | `docs/validation/sprint-1e-overnight-2026-07-26/FRESH_CR_1E_REVIEW.md` |
| Patch specification + amendments + rulings | `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` |
| Issue matrix, shared policy, port disclosure | `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` |
| Workflow diagnosis | `docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md` |
| Overnight validation report | `docs/validation/sprint-1e-overnight-2026-07-26/VALIDATION_REPORT.md` |
| Run ledger | `docs/validation/sprint-1e-overnight-2026-07-26/RUN_LEDGER.md` |
| Overnight CR / AR reviews | `agents/*/outputs/SPRINT_1E_OVERNIGHT_*.md` |
| Frozen final diff | session scratchpad `CANDIDATE_FINAL.diff` |
| Frozen C1 diff (historical) | session scratchpad `CANDIDATE_C1.diff` (`9d56ed51…`) |

---

## Required sequence — current position

1. ~~Freeze the complete final candidate~~ ✅ **this document**
2. **Fresh Independent Code Review of the entire final candidate** ← next
3. Architecture Review
4. Founder Approval
5. Staging / commit / protected baseline

**The prior C1 review is not certification of this tree.** It is retained as historical
evidence for candidate `9d56ed51…` with its post-review mutation addendum.

---

# SUPERSEDING FINAL FREEZE — post Amendment 6, source-comment corrections, and MAJOR-2

**Authority:** Founder decisions, 2026-07-26 (Amendment 6 approved; source-comment items 9–10
approved; MAJOR-2 fix-before-Architecture-Review). **Appended, not rewritten** — everything
above is preserved as the record of candidate `ffc805f6…`.

> **The identity block above is SUPERSEDED.** Its diff hash `ffc805f6…` and its
> `agent-execution-service.*` per-file hashes describe the candidate **before** three
> authorized changes landed. Do not certify against it. The authoritative values are below.

## Why the earlier hashes moved

Three authorized changes landed after `ffc805f6…` was taken, in this order:

1. **Source-comment corrections (items 9–10, Founder-approved).** `agent-execution-service.ts:214`
   *"the five call sites"* → *"the six call sites"*, and the guard enumeration at `:221-228`
   now reads *"sites 2, **3** and 6 cannot"* with a four-line paragraph classifying Site 3 as
   `reconcileQueuedDispatches`' decline path. **Documentation-only within source:** no control
   flow, no branch, no event semantics, no dedupe change. This shifted every subsequent line in
   that file by **+5**.
2. **MAJOR-2 fix (Founder-directed, before Architecture Review).** One test added to
   `agent-execution-service.test.ts`. **No production behaviour changed** — the test exposed no
   code defect; the branch was correct and merely unpinned.
3. **Amendment 6** — specification and amendment report only; no source.

## Authoritative identity

| Item | Value |
|---|---|
| **Frozen at** | **2026-07-26T16:34:33Z** |
| HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` — **unchanged throughout** |
| Protected baseline tag | `sprint-1e-baseline` — **unmoved**. Annotated tag: object `cda7aa1b15e0009e17dfd7f194570b2f013f6bf7`, commit `62f629128e5092f593ff494cd729fe516694bbde`. Both values appear in prior records and refer to different objects of the same unmoved tag; neither is an error. |
| Branch | `validation/sprint-1e-overnight-2026-07-26` |
| **Full-candidate diff hash** | **`3daf07906d685c91458668c3956354097ba03f6cc8c6c6c73287c0f78236c3f4`** |
| Diff scope | `git diff -- lib types app components` · **886 lines** |
| Diffstat | **10 files changed, 557 insertions(+), 35 deletions(-)** |
| Staged | **0** |
| Tags at HEAD | **0** — no protected baseline created |
| Committed | **Nothing.** The entire candidate is uncommitted working-tree state. |

## Per-file SHA-256 (authoritative)

```
d9418f68892f941f89e94819b5568e4e14e5efa45af51cac12c31c22563a5477  lib/dev-hq/adapters/dev-execution-runner.test.ts
bc7eab76ab37c48f4df8d1567d3a91a4a95ca78d03b0dde3f4243e868a3d2ea7  lib/dev-hq/adapters/dev-execution-runner.ts
89d5dd7b7c9288b76954290069aa8fadcbdcaeae74b08b7ec6bc9a24dc817f64  lib/dev-hq/agent-execution-service.test.ts
8ae02cdae14d337237198ec8dfcb314c0ac467e99da832b08bf4f0ea9f99aa3a  lib/dev-hq/agent-execution-service.ts
7c10c0a73edf29d9bb65aeaa91e4ce558e026e27cc771cf1ab3cda28aaa741c9  lib/dev-hq/constants.ts
6231cbab6ede7e81b35f372e202f83b2a66a33474737e68151de7115b4918f7f  lib/dev-hq/escalation-service.ts
77cac31bdcadcb38daa5c097876de7795a69e3b992a77421cfbd4a19f2900645  lib/dev-hq/execution-manager.test.ts
f5857d412fdcc31800bf8c4e7c55692aba95a8a8b666e7793a1d0788c2c80907  lib/dev-hq/execution-manager.ts
284b97d23ab331878c14ed6e0c883635a1ab099d50e7cb5806d354764d58cb1c  lib/dev-hq/review-service.ts
765a7ea15fa2605bc0fdf487cc636d11729426470a7d5e44c8e9364e8feb101f  types/contracts/execution-runner.ts
```

**Eight of ten are byte-identical to the `ffc805f6…` freeze.** Only `agent-execution-service.ts`
(`c9daedce…` → `51ebbc2e…` → `8ae02cda…`) and `agent-execution-service.test.ts`
(`39dfcf73…` → `0dca1f03…` → `89d5dd7b…`) moved. That is the cheapest available proof that the
three authorized changes touched nothing else.

## Governing documents at freeze

| Artifact | SHA-256 | Lines |
|---|---|---|
| `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` (through Amendment 6) | `aedc733d24345dec04c673b6136f54584f564549fd4ae866a502a20f1786f035` | 1,828 |
| `SPRINT_1E_SPEC_AMENDMENT_REPORT.md` | `1d28dc0af2e76df560030b32b750558978eb284452c0d49046bf1b28e7f0a90d` | — |

Neither is part of the remediation source set. The amendment report is Founder-authorized as
the amendment-record artifact and is **not** to be included in the remediation commit unless
separately approved.

## Gates at freeze — all four green, re-run on the settled tree

```
node node_modules/typescript/bin/tsc --noEmit     exit 0
node node_modules/eslint/bin/eslint.js .          exit 0
npx vitest run                                    22 files, 322 tests passed
npx next build                                    exit 0
```

**322 is the correct end state**, and Amendment 6 records the derivation: 317 at `6301c06`
plus five additions — §1.9, §3.3, §4.2, and both follow-up tests. X2 and D1 are rewrites, not
additions. Any record still stating 320 or 321 predates this freeze.

## Test-count reconciliation, so no reviewer re-derives it

| Stage | Tests |
|---|---|
| `6301c06` baseline | 317 |
| + C1 §1.9 | 318 |
| + C3 §3.3 | 319 |
| + C4 §4.2 | 320 |
| + X1 follow-up (§5(b)) | 321 |
| + MAJOR-2 attribution test (§5(a)) | **322** |

## Concurrency disclosure

This candidate was assembled while **more than one session held the working tree**. The tree
moved during two independent reviews and once during Amendment 6 authoring. Every such move is
recorded, and each freeze hash in this file is correct for the moment it was taken. **None was
fabricated and none is silently superseded** — `ffc805f6…` and `3daf0790…` both name real
trees, and this section names which is current.

Verified stable at two independent readings six minutes apart (16:27:25Z and 16:33:22Z, both
`3daf0790…`) before this record was written.

## Prior review status carried forward

- **Independent Code Review: `PASS WITH NON-BLOCKING FINDINGS`, 0 unresolved blockers**
  (CR-FINAL-1E), accepted by the Founder and **not to be repeated** unless the authorized
  changes alter production behaviour beyond the comment correction or expose a new code defect.
  Neither occurred: the comment change is documentation-only within source, and the MAJOR-2 fix
  is test-only.
- CR-FULL-1E: zero applied-vs-specified divergences across all 26 sites on the pre-follow-up
  candidate; all five amendments verified applied.
- **Open, carried to Sprint 1F** as `1E-F1`…`1E-F5` in `SPRINT_1F_MISSION_CONTROL_LITE.md`
  Appendix B.1: `ERROR_HANDLING_STANDARD.md`, `claimLost` message wording, AR2-6 port revision,
  MAJOR-1 guard coverage, MAJOR-3 emission-site coverage.

## Next gate

**Architecture Review, against this exact frozen candidate.** Then Founder Approval. Only after
approval: commit and create the protected baseline. **No Phase 2 implementation.**

---

# COMMIT-TIME FREEZE — `d3a692d6…` (Founder-approved, this is what was committed)

**Authority:** Founder Approval, 2026-07-26 — *"APPROVED FOR COMMIT AND PROTECTED BASELINE"*,
plus authorization of three comment/documentation corrections.

> **This supersedes every hash above.** `3daf0790…` was the hash the Founder approved; the three
> authorized corrections landed after that approval and changed it to `d3a692d6…`. The Founder's
> instruction covered exactly this: *"After these corrections, re-check the candidate hash if any
> source file comment changed. If the hash changes, record the new final hash and perform a narrow
> verification that executable output is byte-identical before commit."*

## Identity at commit

| Item | Value |
|---|---|
| **Full-candidate diff hash** | **`d3a692d6795b0e649f2dbe188c93ac28b498a6f1f4a9f15c8390daf71be60427`** |
| Approved-at hash | `3daf07906d685c91458668c3956354097ba03f6cc8c6c6c73287c0f78236c3f4` |
| Diffstat | 10 files, **573 insertions(+), 35 deletions(-)** (was 557/35 — **+16 comment lines**) |
| Scope | `git diff -- lib types app components` |
| Parent HEAD | `fe7fab1252df8a20fcfd1e1852cf70e5d85ecf39` |
| Prior baseline tag | `sprint-1e-baseline` → commit `62f629128e5092f593ff494cd729fe516694bbde` |

## The three authorized corrections

| Ref | Change | Kind |
|---|---|---|
| **MINOR-B** | `agent-execution-service.ts` — the comment claiming `reconcileRecordsFor` *"must remain free of anything reaching another subsystem"* replaced with AR-FINAL-1E's correct discriminator: it **reconstructs records a completed transition should already have left**, whereas a review request **initiates new work**. The old claim was false — `reconcileRecordsFor → finalizeTerminalExecution → raiseRetryExhaustionEscalation`. Followed literally it would have required deleting a real recovery mechanism. | source comment |
| **MINOR-D** | `agent-execution-service.ts` — site 6's redundancy documented as **deliberate**, with the actual justification: chronological adjacency to that execution's own `reclaimed` event (ADR-0002 E5 timeline fidelity), which is the contract the ordering test pins. | source comment |
| **ISSUE_MATRIX.md:94** | The `NO` ruling for `reconcileQueuedDispatches` marked **SUPERSEDED**, with the reason its rationale failed: *"key no-ops it"* holds only when site 1 already fired, and on the claim-deadline path it never did. Numbering trap called out. | documentation |
| **Amendment 1 marker** | In-place **PARTIALLY SUPERSEDED** marker added to the spec, because Amendment 1 still carried the pre-correction *"five call sites"* payload with no pointer to items 9–10. An applier working the amendments in order would have written `five` and diverged. | documentation |

## Narrow verification — executable output byte-identical

Required by the Founder before commit. Performed by compiling pre- and post-correction sources
with comments stripped and comparing emitted JavaScript:

```
cb339b456998352752fcbfac56ddb2879be0837066e4ebbd09b24f89d1cec9b1   PRE
cb339b456998352752fcbfac56ddb2879be0837066e4ebbd09b24f89d1cec9b1   POST
*** EXECUTABLE CONTENT BYTE-IDENTICAL ***
```

Not inspection — the compiler's own output. **No production behaviour, control flow, event
semantics, deduplication, contract, test, or scope changed.** This is the same emit hash
CR-FINAL-1E independently derived for the reviewed tree, so executable content is unchanged from
the state all three gates certified.

Per the Founder: the full code-review and architecture-review gates are **not** reopened, because
executable behaviour did not change.

## Gates at commit

```
node node_modules/typescript/bin/tsc --noEmit     exit 0
node node_modules/eslint/bin/eslint.js .          exit 0
npx vitest run                                    22 files, 322 tests passed
npx next build                                    exit 0
```

## Accepted gate results

| Gate | Reviewer | Verdict |
|---|---|---|
| Independent Code Review | CR-FINAL-1E (fresh) | **PASS WITH NON-BLOCKING FINDINGS** · 0 unresolved blockers |
| Amendment 6 acceptance test | CR-FINAL-1E | **MET** — zero applied-vs-specified divergences |
| Architecture Review | AR-FINAL-1E (fresh) | **APPROVE WITH FINDINGS** · 0 unresolved blockers |

## A FAIL verdict in this evidence package, and what it is not

`FRESH_CR_1E_FINAL_CANDIDATE_REVIEW.md` records **FAIL**. It must not be read as a code defect.
Its stated reason is *"the candidate mutated during this review. It is not frozen"* — it was
reviewing `ffc805f6…` when the authorized X1 follow-up landed. `CR-FULL-1E` hit the identical
condition and withdrew its blocker once told the change was Founder-authorized.

**No reviewer at any point found a blocking code defect in this candidate.** Every FAIL and every
BLOCKER raised in this package was about candidate identity or record integrity, and each was
resolved by disclosure, authorization, or re-freezing — never by changing the code to satisfy a
reviewer.

## Excluded from this commit, deliberately

- `agents/lead-software-engineer/outputs/SPRINT_1E_SPEC_AMENDMENT_REPORT.md` — Founder-authorized
  as the amendment-record artifact but explicitly **not** for the remediation commit *"unless
  explicitly approved later."* Not approved; excluded. sha256
  `1d28dc0af2e76df560030b32b750558978eb284452c0d49046bf1b28e7f0a90d`.
- All parallel-workstream planning artifacts: Phase 1 UX spec, Context Lifecycle Manager spec and
  its handoff, governance update plan, Phase 2 program plan, Sprint 1F plan, research backlog.
  Untracked, unrelated to Sprint 1E remediation, excluded per the Founder's staging instruction.

**Consequence worth recording:** the Sprint 1F follow-up register (`1E-F1`…`1E-F5`) lives in
`docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md`, which is an excluded planning artifact. **The
required deliverables 1E-F4 and 1E-F5 are therefore not in committed history after this commit.**
They are recorded in this evidence package and in the completion handoff instead.
