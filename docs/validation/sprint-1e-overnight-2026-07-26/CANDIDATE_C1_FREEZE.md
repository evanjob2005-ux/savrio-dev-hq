# Sprint 1E Remediation — Commit 1 Candidate Freeze

**Status:** FROZEN FOR REVIEW. **UNCOMMITTED.** Working-tree only.
**Frozen:** 2026-07-26

---

## Identity

| Item | Value |
|---|---|
| HEAD (unchanged throughout) | `6301c06b52789c533603f2c7bd1997c71e00e65f` |
| Protected baseline tag | `sprint-1e-baseline` → `62f629128e5092f593ff494cd729fe516694bbde` |
| Branch | `validation/sprint-1e-overnight-2026-07-26` |
| Patch-spec version | CR-1E `COMPLETE SPECIFICATION` + three post-ruling amendments |
| Spec artifact | `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` |
| Candidate diff | 289 lines · sha256 `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe` |

**⚠️ DISCLOSURE: the remediation is currently UNCOMMITTED.** It exists only as
working-tree modifications. No remediation commit has been created. Per the required
sequence it cannot be committed until Fresh Independent Code Review → Architecture
Review → Founder Approval have all completed.

---

## Exact files modified (5, and only these)

```
 lib/dev-hq/agent-execution-service.test.ts | 91 +++++++++++++++++++++++++++++-
 lib/dev-hq/agent-execution-service.ts      | 68 +++++++++++++++++++++-
 lib/dev-hq/constants.ts                    | 10 ++++
 lib/dev-hq/escalation-service.ts           |  7 ++-
 lib/dev-hq/review-service.ts               |  8 ++-
 5 files changed, 177 insertions(+), 7 deletions(-)
```

| SHA-256 of candidate working copy | File |
|---|---|
| `7c10c0a73edf29d9bb65aeaa91e4ce558e026e27cc771cf1ab3cda28aaa741c9` | `lib/dev-hq/constants.ts` |
| `2fedb1a4b2e136ad0ccaf101436c830e869a93798799f1e24a3208d6471f0ffa` | `lib/dev-hq/agent-execution-service.ts` |
| `284b97d23ab331878c14ed6e0c883635a1ab099d50e7cb5806d354764d58cb1c` | `lib/dev-hq/review-service.ts` |
| `6231cbab6ede7e81b35f372e202f83b2a66a33474737e68151de7115b4918f7f` | `lib/dev-hq/escalation-service.ts` |
| `2784fb8e6f90d78795ac1a4c1c0b99fff7dfc770d102477db2d84da9e28477b4` | `lib/dev-hq/agent-execution-service.test.ts` |

---

## Defects addressed by this candidate

| ID | Defect | Mechanism |
|---|---|---|
| **AR2-1** | Declined dispatch logged zero events — ADR-0001 O6 violation | New `execution.assignment_deferred`, emitted at five service-layer sites. **See the X1 correction below: a sixth site was missing.** |
| **X1** | Execution stranded `queued`/`agentId: null` with no signal | ~~**Subsumed** — the queued execution is the ADR-approved outcome; the missing event was the entire violation~~ **CORRECTED — see below. This claim was overstated at C1 and X1 was NOT fully resolved by this candidate.** |

> **⟶ CORRECTION (Founder decision, 2026-07-26) — X1 was not fully resolved at C1.**
>
> The row above recorded X1 as *"Subsumed"* by AR2-1. **The reasoning was sound but the
> coverage was not.** The principle is correct — the queued execution *is* the ADR-approved
> outcome per O6/O2, and adding an escalation would have been the wrong fix — but X1
> **inherited AR2-1's gap**: the deferral event was emitted at five sites and a **sixth
> decline path survived without one**.
>
> `reconcileQueuedDispatches` declined at `!decision.assigned || !decision.assignment` with a
> bare `continue`, leaving the execution `status: "queued"`, `agentId: null`, attempt
> unchanged, and its **event timeline empty** — the precise state that makes a declined
> dispatch indistinguishable from one never requested, which is the whole of X1.
>
> **This was not caught by the C1 gates and could not have been.** The existing assertion
> `toHaveLength(1)` passes whether or not the sweep emits, so the gap was invisible to the
> test that appeared to cover it.
>
> **Resolved by an authorized narrow follow-up** (Founder decision, 2026-07-26): the canonical
> `execution.assignment_deferred` event is now emitted at that sixth site, reusing the existing
> per-`(execution, attempt)` dedupe key so repeat sweeps no-op rather than appending one entry
> per cycle. Outcome behaviour is unchanged — the execution still stays queued and the loop
> still continues; only the missing record is supplied.
>
> **Fail-before demonstrated by execution, not by reasoning:** with the fix reverted, the new
> regression test fails with `expected [] to have a length of 1 but got +0` — the timeline was
> genuinely empty. The file was restored from a hash-verified backup afterwards
> (`51ebbc2e…`).
>
> **Neither AR2-1 nor X1 may be recorded as closed on the strength of the C1 candidate
> alone.** Both close only with the follow-up included.
| **X3** | Reclaimed-but-unassigned attempt matched neither branch, recorded nothing | Third branch `requeuedWithoutAgent` |
| **X4** | Reclaim message asserted "retrying as attempt N" with no agent running | Message branched on `agentId`, not status alone |
| **X2** | `agent-execution-service.test.ts:110-119` asserted only `assigned === false` | Rewritten; constructs its own no-capacity fixture |

---

## Test commands and results

Run against the frozen candidate:

| Command | Result |
|---|---|
| `npx tsc --noEmit` | **exit 0**, no diagnostics |
| `npx eslint .` | **exit 0**, no diagnostics |
| `npx vitest run` | **22 files, 318 tests passed** (baseline 317 + 1 new) |

`npx next build` is deferred to the end of Commit 4 per the specification's verification
plan.

**Fail-before evidence.** AR2-1/X1 were reproduced by execution during the overnight run
(event count `0` before and `0` after a declined dispatch; stranded record
`{ status:'queued', agentId:null }`). X3/X4's new regression could not have passed
before this candidate: `EXECUTION_EVENT_TYPE.assignmentDeferred` did not exist, so the
test would not compile.

**Resolved uncertainty.** CR-1E flagged `getAgent` scoping in test 1.9 as uncertain and
asked that `tsc` settle it. It did — exit 0, no shadowing.

---

## Working-tree status at freeze

Tracked modifications: exactly the five files above. No ADR modified
(`docs/decisions/` clean). No configuration modified. Nothing staged.

Seven Founder-authorized parallel-workstream artifacts remain untracked and are
**excluded from the candidate**; none is staged or committed.

---

## Scoped-cleanliness exception (Founder-authorized)

Seven exact paths excluded from clean-tree checks. Never widened to directories.

| # | Path |
|---|---|
| 1 | `docs/plans/PHASE_2_PROGRAM_PLAN.md` |
| 2 | `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` |
| 3 | `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` |
| 4 | `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` |
| 5 | `docs/research/RESEARCH_BACKLOG.md` |
| 6 | `docs/plans/GOVERNANCE_UPDATE_PLAN.md` |
| 7 | `agents/lead-software-engineer/outputs/CLM_COLLABORATION_HANDOFF.md` |

**Reason:** produced by authorized parallel planning workstreams. Planning and design
artifacts only; they authorize no implementation and are not part of Sprint 1E
remediation scope. All are untracked, so they cannot affect tracked state.

### Re-baseline event (Founder-authorized)

Two artifacts changed after their initial recorded baselines:

| Path | Old SHA-256 | New SHA-256 | Modified |
|---|---|---|---|
| `docs/plans/PHASE_2_PROGRAM_PLAN.md` | `e71751961e3ef38345c00ecb641f8175cc032da5ab18da31c9a74c80a9392f33` | `353c8c041165f8897677e97d39cee90a7c12394ed5af982c2494c36b7d362865` | 10:38:17 |
| `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | `35f724b7e776c5b804418e25bbcb5debf5cb93bbf75c93d54222acb859a7bcdc` | `bcf359df523dd88cc40aad7bafe010fb719ba60539256a246e5063031118426e` | 10:38:05 |

**Scope verification — PASSED.** Independently confirmed: no ADR changed, no source file
changed beyond the five remediation targets, no other artifact changed, and all seven
remain untracked. Both documents self-describe as correction passes
(PLAN-P2-001 v1.1.0: *"a correction pass only — no stage was redesigned"*;
SPRINT-1F-PLAN v0.2.0: *"Documentation-only correction, no scope or position changed"*).

**Attribution limit, recorded honestly.** The strings `FIX-PHASE2-PLAN` and
`FIX-1F-PLAN` do **not** appear in either document, and the coordinator has no
visibility into other sessions' agents. Scope is verified; **named attribution is not
independently verifiable from this session** and was referred to the Founder.

---

## Scoped-cleanliness check defects (coordinator's own, recorded per instruction)

The verification script shipped with two defects. Both found and fixed before the
candidate was frozen. **Neither is a candidate defect** — they are tooling defects, and
the earlier false stop they produced is not recorded as a finding against the
remediation.

| # | Defect | Effect | Fix |
|---|---|---|---|
| 1 | `while read -r line` without `IFS=` | `read` stripped the leading porcelain status space, shifting the fixed-offset path slice by one character (`lib/…` → `ib/…`), so every modified path failed the exclusion match | `while IFS= read -r line` — preserves porcelain spacing |
| 2 | No notion of authorized patch targets | Treated every tracked modification as unexpected, so legitimate remediation edits produced a false STOP | Accepts expected-modified paths as arguments and reports them `OK … (approved patch target)`, distinct from `STOP … UNEXPECTED` |

**Why this is recorded rather than quietly fixed:** a safety check that produces false
alarms trains its reader to ignore it, which is worse than having no check. The fixed
script then caught a genuine condition (two artifacts changed after baseline) cleanly on
its next run.

---

## Evidence manifest

| Artifact | Path |
|---|---|
| Patch specification + amendments + rulings | `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` |
| Issue matrix, shared policy, port disclosure | `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` |
| Workflow diagnosis | `docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md` |
| Overnight validation report | `docs/validation/sprint-1e-overnight-2026-07-26/VALIDATION_REPORT.md` |
| Run ledger | `docs/validation/sprint-1e-overnight-2026-07-26/RUN_LEDGER.md` |
| Overnight CR review | `agents/independent-code-reviewer/outputs/SPRINT_1E_OVERNIGHT_CR_REVIEW.md` |
| Overnight AR review | `agents/architecture-reviewer/outputs/SPRINT_1E_OVERNIGHT_AR_REVIEW.md` |
| Frozen candidate diff | session scratchpad `CANDIDATE_C1.diff` |
| Foreign-artifact hash baselines | session scratchpad `foreign-hashes.txt` |
| Scoped-cleanliness check | session scratchpad `scoped-clean.sh` |

---

## ADDENDUM — patch specification amended AFTER the freeze (Founder-authorized)

Recorded per Founder instruction. **This is not a mutation of the frozen C1 candidate.**

### The five facts

1. **The frozen C1 candidate remains byte-identical.** Candidate-only diff
   (`git diff -- lib/dev-hq/`) hashes `9d56ed51acd566048fab9de54b0e1ec9cde39cd3dda85d80ebeebe0c2b652abe`,
   matching the freeze. All five per-file hashes match. 177 insertions / 7 deletions,
   unchanged.
2. **The patch specification changed after the freeze.**
3. **That amendment applies only to the unapplied C2/C3/C4 instructions.**
4. **The external reviewer must review C1 against the specification version actually
   used for C1** — the committed version, SHA-256 `5e4732f9…` — and treat Amendment 4
   as **future remediation guidance only**.
5. **No C2, C3 or C4 patch may be applied** until the amended anchors receive
   independent verification.

### Change record

| Field | Value |
|---|---|
| File | `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` (**tracked**) |
| Previous SHA-256 (committed at `fe7fab1`) | `5e4732f9c413c037b376f6d9a3a22d6b56d54bb059d50dacf22e19bcfd4117b5` |
| Current SHA-256 (working tree) | `ce7e8c1e1330de08da14dfc968dab907fd894be8dae6afcf5af6e79728bd7fc9` |
| Modification time | 2026-07-26 11:08:27 |
| Identifier | **Amendment 4 / SPEC-AMEND-1E**, Founder decision D-2 |
| Authorized scope | Correcting stale or unsafe C2/C3/C4 anchors identified by MAJOR-1, MAJOR-2, MINOR-1 |
| Diff size | +41 / −5 lines |

### Sections changed

| Section | Nature of change |
|---|---|
| Header (line 3) | Status updated: C1 applied to working tree (uncommitted); C2/C3/C4 not applied |
| New banner (after line 10) | Amendment 4 notice: all line numbers derived at `6301c06`, before C1 shifted `agent-execution-service.ts` by +48/+49 and `agent-execution-service.test.ts` by +37 |
| **§1.9** | **Annotation only** — CR-1E's "marked UNCERTAIN" note on `getAgent` scoping replaced by "RESOLVED, not a defect". Matches the independent `tsc` result. **No patch code touched.** |
| §2.5 / §2.6 | Anchor corrected — `737-744` was true at `6301c06`, now shifted |
| §2.8 | Anchor corrected — `1474-1476` was true at `6301c06`, now shifted |
| §3.2 / §3.3 | Import anchors verified; one anchor corrected that was **stale within its own commit** |
| §4.1 | Anchor corrected — `856-857` was true at `6301c06`, now shifted |
| **§4.2** | **"ANCHOR WAS UNSAFE. DO NOT APPLY THE STRUCK LINE."** §1.9 consumed the same anchor when C1 was applied |

### Confirmation: C1 implementation sections were NOT altered

Verified by extracting **only fenced code-block content** from the `## COMMIT 1` region
of both versions and comparing:

| Version | C1 code-block SHA-256 | Lines |
|---|---|---|
| Committed (`5e4732f9…`) | `eaadb41e800046a13db9724187ca36460d3342593395792a8685c2bb801563ee` | 309 |
| Current (`ce7e8c1e…`) | `eaadb41e800046a13db9724187ca36460d3342593395792a8685c2bb801563ee` | 309 |

`diff` of the two extractions is **empty**. Every C1 FIND/REPLACE block is byte-identical.
The only C1-region change is the §1.9 annotation described above.

### Coordinator note on the substance

Amendment 4 closes a real hazard. Applying C2 with `6301c06`-era anchors after C1 shifted
those files is exactly how a verbatim patch lands in the wrong place — the same class of
hazard recorded earlier for the duplicated `if (execution.status !== "running")` guard,
where `heartbeat` (`:564`) must absorb while `releaseExecution` (`:603`) must keep
throwing. The §4.2 finding is the sharpest instance: its anchor was **consumed by §1.9**
during C1, so applying it verbatim would have targeted text that no longer sits where the
specification expects.

**Not adjudicated here.** Under the current hold the coordinator has not applied,
verified, or acted on Amendment 4. Point 5 above stands: independent verification of the
amended anchors is required before any C2/C3/C4 application.

---

## Required sequence — current position

1. **Fresh Independent Code Review** ← *in progress*
2. Architecture Review
3. Founder Approval
4. Remediation commit / protected baseline

The two authorized planning-document corrections are **not** part of this candidate and
must not be staged or included in the remediation commit.
