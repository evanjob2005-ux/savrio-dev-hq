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

## Sprint 1F PKG-2 (frontend test infrastructure) — follow-ups

**Source of authority:** Founder approval of `candidate-1f-pkg2-2`, commit
`5c1fd6590160dd9bf41212868ed946bb9fb12123`, protected checkpoint
`sprint-1f-pkg2-approved`. Both independent gates returned
**APPROVE WITH FINDINGS** with **0 BLOCKER and 0 MAJOR**; **remediation was not
required** and none was performed.

**Nothing in this section is a defect in the approved candidate that blocked its
approval.** Each item is a quality, consistency, or operability improvement
deferred under the F-A7 freeze policy
(`docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:554`) rather than used to force a third
candidate. Evidence, by author: `AR_1F_PKG2_CANDIDATE_2.md` (AGENT-019 Architecture
Reviewer), `ICR_1F_PKG2_CANDIDATE_2.md` (AGENT-008 Independent Code Reviewer),
`RECONCILIATION_1F_PKG2_CANDIDATE_2.md` (Main Coordinator — reconciliation and
approval decision).

### Deferred MINOR findings — one small follow-up package

Priority order as recommended by the Architecture Review. M-3's fix closes M-2 as
a side effect, so the whole set is roughly four lines across two files.

| ID | Item | Origin |
|---|---|---|
| **M-1** | **Widen Playwright's spec-only `testMatch`** at `playwright.config.ts:12` so future supported E2E extensions — `.spec.tsx`, `.spec.mts`, and equivalent spec forms — are collected, **without** permitting `.test.*` files. Verified proposed pattern: `**/*.spec.?(c\|m)[jt]s?(x)`. Today `e2e/foo.spec.tsx` is executed by nothing and both gates still report green. | AR only — **not** reported by the ICR |
| **M-2** | **Give the `dom` project the `e2e/**` exclusion** (`vitest.config.ts:31-41`). `e2e/*.test.tsx` is currently collected as `[dom]`, so the "e2e/ belongs to Playwright" invariant is enforced in one of the two places it must hold. | AR M-2 = ICR MINOR-2 |
| **M-3** | **Restore or compose Vitest's installed-version default exclusions, including `**/.git/**`, rather than replacing them incompletely** (`vitest.config.ts:26`). **Compose from `configDefaults` in both the Node and DOM projects and explicitly prevent `e2e/**` collection by both**, which closes the DOM E2E-routing gap (M-2) and the related exclusion drift together: `exclude: [...configDefaults.exclude, "**/dist/**", "**/.next/**", "e2e/**"]`. | AR M-3 extends ICR MINOR-1 |
| **M-4** | **Validate `E2E_PORT` before using it** (`playwright.config.ts:3`). `Number(process.env.E2E_PORT ?? 3100)` yields `0` for `""` and `NaN` for `"abc"` (both executed). Swapping `??` for `\|\|` is a **partial** fix — it leaves `"abc"` → `NaN`. Validate and throw. With `reuseExistingServer: false`, port 3100 is an exclusive resource and `E2E_PORT` is the only mechanism allowing concurrent worktrees to run E2E. | AR M-4 = ICR MINOR-3, corrected fix |

**Verdict-flipping conditions, tested at approval and NOT met.** The Architecture
Review named three conditions that would convert its verdict to
REJECT — REMEDIATION REQUIRED. All three were checked by the Coordinator and none
holds: no `.spec.tsx`/`.spec.mts` E2E file is planned anywhere in `docs/plans/`;
`output: "standalone"` is not set in `next.config.ts` and is not planned this
sprint; and neither gate demonstrated a path by which any MINOR produces a green
run that should be red. **If any of these becomes true before the M-1/M-3 fixes
land, the deferral must be revisited.**

### Separately authorized future package — CI enforcement

**Add CI enforcement for the new frontend-test harnesses.** Current workflows do
not run the Vitest harnesses, do not run Playwright, and do not install browsers:
`grep -rn "playwright|npm test|vitest|test:e2e" .github/workflows/` returns no
matches across all six workflow files, and `ci.yml:335-363` runs lint,
`tsc --noEmit`, and `npm run build` only.

**CI work was outside PKG-2's authorization envelope and must be handled as its
own package.** `.github/workflows/*` is not an authorized PKG-2 path, so declining
to fix it inside PKG-2 was correct scope discipline, not a gap in the work. Both
gates rank this the highest-value follow-up: until it lands, every finding in both
reviews — and M-1's silent omission in particular — depends on a human remembering
to run commands locally. **Discovery is not approval; this needs its own
authorization.** (AR N-1 = ICR NOTE-3.)

### Review-process correction — binding on future briefs

**A review brief must not simultaneously prohibit report-file writing and instruct
the reviewer to write a report file.** Both PKG-2 reviewers are provisioned
without `Write` and carry a standing instruction not to write report `.md` files;
the Coordinator's brief nevertheless instructed each to write one. Both reviewers
correctly took the inline fallback, and both were right to do so — but the pattern
cost a transcript-recovery-and-transcription step twice.

**Rule going forward: reviewer tabs return their reports inline, and the Main
Coordinator preserves them.** Preservation is the Coordinator's duty, not the
reviewer's. This is a defect in the brief template, not in either agent.

### Record-only, routed for decision

| ID | Item |
|---|---|
| **AR N-7** | `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:143` lists dependency **D-6** (*"new dependencies (auth, web-push, jsdom)"*) as ❌ OPEN. The approved tree now contains `jsdom@^29.1.1`. D-6's *Blocks* column names 1F-6, 1F-10, 1F-19 — **not** 1F-18 — so the entry package did not gate PKG-2 on D-6 and **no governance breach is reported**. Recommend recording D-6's jsdom leg as discharged by PKG-2's authorization. Founder decision. |
| **AR N-8 / ICR NOTE-6** | `handbooks/INDEPENDENT_CODE_REVIEWER.md` is absent, though `agents/independent-code-reviewer/AGENT.md:7` references it. Already tracked as dependency **D-8** at `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:144`. **Record against D-8; do not open a new item.** |
| **AR N-2** | The E2E assertion is coupled to a DOM nesting decision in `components/dashboard/TopBar.tsx:37-42`, a file the spec never names. Moving the `Mission Control` span inside the `h1` breaks the smoke test — fail-closed and the intended trade. Recorded so no future maintainer "repairs" it by deleting `exact: true`, **which would reinstate the candidate-1 defect.** Treat `e2e/smoke.spec.ts:11-14` as load-bearing documentation. |
| **AR N-3** | `// @vitest-environment jsdom` in a `.test.ts` works but bypasses `setupFiles`, so such a test gets no `cleanup()` — precisely what `test/setup-dom.ts:7-9` exists to prevent. One line of documentation if the hatch is ever used. |
| **AR N-5** | `fullyParallel: true` with `workers: 1` is a no-op today but a latent constraint: raising `workers` runs specs concurrently against one hardcoded port and one shared `.next` build directory. Flagged for whoever raises `workers`. |
| **ICR security attribution** | The ICR intersected the 47 added lockfile packages against the advisory set and reported **0 of 47** carry an advisory, with all 42 pre-existing vulnerabilities (1 critical, 19 high) tracing to baseline packages. The AR **did not adopt or verify** this — it did not run `npm audit`. The claim stands as ICR-only evidence. Both gates independently confirmed the sufficient narrower fact: all 47 additions are `dev: true`, **zero production runtime surface**. The pre-existing vulnerability backlog warrants its own scoped remediation. |

---

## Sprint 1F PKG-3 (CI enforcement) — obligations and follow-ups

**Candidate:** `candidate-1f-pkg3-1` → tag object `30e0c057d2092719c4c91d8a2456cefbf676bbaf`
→ commit `b7386f0521f296a5411e77e15d4dd385eb65691d`, tree
`ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5`, parent
`5dd80ed64f847756e49065de1f151155808ac6a6`. Baseline
`5c1fd6590160dd9bf41212868ed946bb9fb12123` (`sprint-1f-pkg2-approved`).

**STATUS: NOT YET APPROVED.** `sprint-1f-pkg3-approved` does not exist. The
Architecture Review returned **APPROVE WITH FINDINGS**, but the approval
checkpoint is withheld pending preservation and reconciliation of the complete
text of both independent gates. See "Blocked" below.

Everything in this section was directed by the Founder and does **not** depend on
the outstanding review texts, so it is recorded now rather than held.

### PKG-3-OBLIGATION-A — MANDATORY post-integration repository settings

**This is an obligation, not a suggestion.** PKG-3 delivers **reliable CI
detection, not merge enforcement.**

The active default branch (`feature/dev-hq-operating-system`) currently has **no
branch protection, no ruleset, and no required status checks** — independently
confirmed: `gh api …/branches/feature%2Fdev-hq-operating-system/protection`
returns `404 Branch not protected`. **Therefore failing frontend tests currently
block nothing.** The workflow is a dependable alarm; it is not yet a gate.

Once the workflow exists on the active default branch and its check names are
available, repository governance must be configured. The settings action must
decide and record, at minimum:

| Decision | |
|---|---|
| Exact required check names | as they appear once the workflow has run on the default branch |
| Protected branch or branches | which branches require the Frontend Tests check |
| Pull requests required before merging | yes / no |
| Branch must be current before merging | yes / no |
| Direct pushes prohibited | yes / no |
| Administrators may bypass | yes / no |
| Emergency bypass | how it is authorized **and audited** |
| Stale approvals dismissed | yes / no |

**Not authorized during reconciliation.** Requires its own authorization, and
must follow integration — the check name cannot be required before it exists.

### PKG-3 follow-up packages — to be handled separately, never silently combined

| ID | Package | Contents |
|---|---|---|
| **B** | **`pr.yml` repair** | `pr.yml` has a `pull_request` trigger with **no branch filter**, so it fires on every pull request. It ran throughout the PKG-3 validation campaign and **failed every time**. Left unrepaired it reddens every PR and will erode trust in the new signal. Recommended as the next package after integration and settings |
| **C** | **Lockfile hygiene and toolchain contract** | Regenerate and validate `package-lock.json`; add `packageManager`; add `engines`; then **decide whether the npm 11.16.0 CI pin remains or is removed**. Root cause: the lockfile was generated by npm 11.16.0, and npm 10.9.4 (bundled with Node 22) rejects it because the `vite` nested in `vitest` declares a peer `esbuild ^0.27.0 \|\| ^0.28.0` the lock does not satisfy. **Pre-existing at `6eefff7f`** and reproducible on Windows, so caused by neither PKG-2 nor PKG-3 nor Linux |
| **D** | **Dependency-vulnerability enforcement** | Enforcement plus handling of the existing backlog (42 advisories at PKG-2 review time: 1 critical, 19 high, 21 moderate, 1 low; all traced to baseline packages, 0 of the 47 PKG-2 additions) |
| **E** | **Small PKG-3 workflow follow-up** | `if-no-files-found: ignore` → `warn`; cancellation-aware hygiene behaviour instead of `if: always()`; add `next` to the **e2e** job's binary precondition list; and **direct validation of concurrency cancellation, which remains UNVALIDATED** |
| **F** | **Deferred PKG-2 test-configuration follow-up** | The four PKG-2 MINOR findings M-1…M-4, unchanged and still open. **PKG-3 required none of them** and included none |

### PKG-3-CORRECTION-1 — a false claim in the candidate tag annotation

**This passage in the `candidate-1f-pkg3-1` tag annotation is FALSE and is hereby
SUPERSEDED:**

> "All six prior workflows trigger only on main or pull requests to main."

**Accurate replacement:**

- `pr.yml` has a `pull_request` trigger **without** a branch filter;
- it therefore **ran during the PKG-3 validation campaign**;
- it **failed repeatedly**;
- **before PKG-3, no active workflow enforced the complete PKG-2 frontend-test
  foundation** by running the Node Vitest project, the DOM Vitest project,
  aggregate tests, Chromium installation, and the Playwright smoke test on the
  active development branch.

The narrower statement is the one that is true and load-bearing. The broad claim
overstated it.

**`candidate-1f-pkg3-1` must NOT be moved, recreated, replaced, or re-frozen to
alter its annotation.** A tag annotation is immutable evidence of what was
believed at freeze time; correcting it by re-tagging would destroy the audit
trail and is expressly prohibited. **The correction lives here and in the
reconciliation record, and those supersede the annotation.** Anyone reading the
tag must read this correction alongside it.

### Blocked — why PKG-3 is not yet approved

The approval checkpoint is withheld because two required inputs have not reached
the Main Coordinator:

1. **The complete Architecture Review.** Only §15 and §16 were received, and both
   arrived corrupted by dropped characters. **§13 — the section the approval is
   conditional upon — was not received at all**, nor were the AR severity counts.
2. **The Independent Code Review.** Never received in any form. Verified absent
   from disk: no `*pkg3*` artifact exists anywhere in the repository, and
   `agents/independent-code-reviewer/outputs/` holds no PKG-3 file. Its verdict,
   counts, MAJOR finding, and MINOR-1…MINOR-5 texts are unavailable.

Counts, a finding-by-finding reconciliation, and §13's contents **will not be
reconstructed, inferred, or approximated.** Approval resumes when both complete
texts are supplied.

---

## Register status

| Item | Type | Status |
|---|---|---|
| 1E-F4 | Required deliverable | **Closed** — Sprint 1F Track A, `sprint-1f-tracka-approved` |
| 1E-F5 | Required deliverable | **Closed** — Sprint 1F Track A, `sprint-1f-tracka-approved` |
| AR2-6 | Required deliverable | **Closed** — `sprint-1f-ar2-6-approved`; GATE-1 and GATE-2 condition future authorizations |
| PKG-2 M-1 | Deferred MINOR | **Open** — highest priority of the four |
| PKG-2 M-2 | Deferred MINOR | **Open** — closed as a side effect of M-3 |
| PKG-2 M-3 | Deferred MINOR | **Open** |
| PKG-2 M-4 | Deferred MINOR | **Open** |
| PKG-2 CI enforcement | Future package | **Delivered as PKG-3**, `candidate-1f-pkg3-1` — frozen, **not yet approved** |
| PKG-2 review-brief correction | Process | **Binding on future briefs** |
| PKG-3 candidate approval | Gate | **Blocked** — awaiting complete ICR and Architecture Review texts |
| PKG-3-OBLIGATION-A repository settings | **Mandatory** post-integration | **Open — requires its own authorization** |
| PKG-3 package B `pr.yml` repair | Future package | **Open** — recommended first after integration and settings |
| PKG-3 package C lockfile and toolchain | Future package | **Open** — also decides the fate of the npm 11.16.0 pin |
| PKG-3 package D vulnerability enforcement | Future package | **Open** |
| PKG-3 package E workflow follow-up | Future package | **Open** — includes UNVALIDATED concurrency cancellation |
| PKG-3 package F deferred PKG-2 test config | Future package | **Open** — M-1…M-4 unchanged |
| PKG-3-CORRECTION-1 tag annotation | Governance correction | **Recorded; supersedes the annotation. Tag must not be re-frozen** |
| Package C Track B plan preservation | Documentation custody | **Closed** — `candidate-1f-pkgc-1`, both gates approved. Four planning documents preserved byte-for-byte |
| PKGC-OBLIGATION-A custody note | **Mandatory** custody clarification | **Discharged** — `docs/plans/SPRINT_1F_TRACK_B_CUSTODY_NOTE.md`, additive and forward-only |
| PKGC-ICR-002 stale custody statements | Coordinator correction | **Recorded** — freeze report disclosed 2 of 6; corrected in the custody note §3 |
| PKGC-ICR-003 heading-level skip | Deferred NOTE | **Open by decision** — `SPRINT_1F_MISSION_CONTROL_LITE.md:287`; not fixed, to preserve byte-for-byte custody |
| PKGC-CORRECTION-1 evidence transmission | Process | **Binding on future briefs** — full-width hashes go in a fenced block, one per line, with the derivation command; never in a wrapping table cell |
| Package D FD-5 route audit | Evidence prerequisite | **Closed** — independently verified; `PACKAGE_D_CLOSURE_RECORD.md`. No implementation commit |
| FD5-01 approve/reject unauthenticated, hardcoded Founder | **CRITICAL** | **Open** — blocks Track B, deployment, phone actions. Fix sequenced through ADR-0003 |
| FD5-02 escalation accept/revise/abandon unauthenticated | **CRITICAL** | **Open** — same; `revise` dispatches a durable execution. Compounded by NB-1 |
| FD5-03 finalize attributes a client decision to the Founder | **HIGH** | **Open** — provenance integrity; needs the ADR-0003 actor model |
| FD5-04 founder-requests unauthenticated, no idempotency | **HIGH** | **Open** — auth half needs ADR-0003; idempotency half is Group 3 |
| FD5-05 non-uniform duplicated production boundary | **MEDIUM** | **Open** — corrected down from HIGH by Codex; five qualifications binding |
| FD5-06 no general authorization layer, 16 of 17 units | **HIGH** | **Open** — architecture gap, decided in ADR-0003, not fixed |
| FD-5 medium set: CSRF, internal-token scope, optional idempotencyKey, approval-gate binding | **MEDIUM** | **Open** — CSRF and token scope to ADR-0003; idempotency and approval-gate binding are Group 3 |
| FD-5 low set: unauthenticated read routes, client text in timeline, single-process guarantees | **LOW / INFO** | **Open** — later hardening; single-process becomes CRITICAL if hosting goes multi-instance |
| Production barriers `proxy.ts` / `internal-guard.ts` / `actions.ts` | **Standing control** | **Must not be weakened, removed, bypassed, or consolidated** until approved replacement authentication and authorization exist |
| PKGD-CORRECTION-1 read-only audits leave no artifact | Process | **Binding** — a read-only audit writes nothing, so verification must be by independent reproduction from the authorized commit, or a transcript must be returned for preservation |
| Package E architecture brief | Advisory input | **Preserved** — `PACKAGE_E_ARCHITECTURE_RECORD.md`. Advisory only; ratifies nothing |
| E-3 persistence posture P-A | Founder decision | **APPROVED** 2026-07-27 — non-durable, process-start marker mandatory, not a system of record |
| E-4 Sprint 1C-B disposition | Founder decision | **APPROVED** 2026-07-27 — do not adopt; verified not a shortcut on eight grounds |
| E-5 `@supabase/supabase-js` gate | Founder decision | **APPROVED** 2026-07-27 — not required under P-A; durable persistence deferred to its own workstream |
| E-11 / A-P4 implementation authority | Governance | **RESOLVED** 2026-07-27 — granted to the Lead Software Engineer, package-scoped under the Main Coordinator. Does not permit self-selected or expanded scope |
| E-1 / E-2 hosting target and Web Push scope | Founder decision | **HELD OPEN** — H-AQ is the provisional direction, not ratified; pending V-2 |
| E-12 `NODE_ENV=production` internal-route barrier | Founder decision | **HELD OPEN — newly surfaced.** H-AQ requires non-production mode; the guard must not be weakened or conditioned while open |
| V-2 Trigger.dev Development-worker viability | **HIGH** | **ANSWERED — `PATH B FAILED`.** `V2_VERIFICATION_RECORD.md` §10. Abrupt CLI loss cancels a suspended Development waitpoint in ~1s |
| **H-AQ disposition** | **CRITICAL** | **HELD FOR REDESIGN** — not ratified, not rejected. Architecture Review complete; replacement direction selected. `V2_VERIFICATION_RECORD.md` §11 |
| **Decision A1 — R3 replacement direction** | Founder decision | **RATIFIED** 2026-07-27 — split the Founder-request workflow at the approval boundary; eliminate the long-lived token suspension. Direction only; authorizes no implementation |
| **Decision B1 — E-3 continuation-authority amendment** | Founder decision | **RATIFIED** 2026-07-27 — **AMENDMENT**, not a clarification or supersession. No workflow may place sole continuation authority in P-A state, or leave durable work suspended when only P-A state can resolve it |
| **Decision C1 — Sprint 1F sequencing** | Founder decision | **RATIFIED** 2026-07-27 — continue around the approval redesign; Coordinator enforces the §11.5 boundary before dispatching any package |
| **Decision D1 — P-1 authorization** | Founder decision | **RATIFIED** 2026-07-27 — P-1 test-only characterization authorized. P-2 through P-5 remain unauthorized |
| Two-field decision/continuation contract | Architecture | **Ratified in direction** — `decision` and `continuation` are separate fields; continuation values `not_attempted`, `confirmed`, `unconfirmed`, `failed`. Only decided + confirmed may render complete |
| R2 durable persistence | Sequencing | **Expected later destination** — blocked. Adopting now would reverse E-3 and E-5 |
| R1 deployed worker + callback plane | Sequencing | **Later hosting option** — after E-1, E-6, and E-12 |
| R4 / R5 | Rejected | R4 disproportionate and not reached; R5 rejected — graceful-only is not acceptable for Founder approvals |
| P-1 characterization package | **COMPLETE** | `V2_VERIFICATION_RECORD.md` §12. Six test-only additions; 19 tests; `npm test` exits 0 with 357 passed and 1 expected fail. No production change. No Codex review required |
| P-1 false-success behaviour | **Executed evidence** | First execution of the code trace: `completeToken` returns `{success:true}` against a cancelled run, no continuation, approval reads `approved`, timeline asserts `Evan approved …`, no finalization |
| P2_TARGET invariant | **Marked `it.fails`** | Asserts the future-correct invariant; fails today for the right reason. **An unexpected pass turns the suite RED**, forcing the `it.fails` → `it` conversion in P-2 to be deliberate |
| Failing-test representation T3 | Decision | `it.fails` selected over T1 (red CI), T2 (does not execute), T4 (needs production config). Verified against Vitest 4.1.10 by direct probe |
| `triggerRunId` two-record wording | **Corrected** | Written onto **two separate single-valued fields on two records** — `Execution.triggerRunId` and `WorkflowRunRecord.triggerRunId` — not twice onto one field. Lineage must address both |
| P-1 test-local characterization types | Clarification | `DecisionApplication`, `RunAttempt`, `RunLineage`, `LineageBearingRun` are characterization only. **Not an approved P-2 design** |
| `rejectFounderRequest` false-success | **ABSORB INTO P-2** | Structurally identical to the approve path; same ordering, same comment, same exposure |
| `replayDecisionToken` false-success | **ABSORB INTO P-2** | Third `completeToken` site; returns the read model unconditionally |
| Discarded `completeToken` return values | **ABSORB INTO P-2** | All three sites discard `success`; even a truthful signal would be dropped |
| Inverse convergence | **P-2 inverts, P-4 executes** | Existing convergence handles *token completed, decision not recorded*; the defect is the mirror case and that path never runs |
| `registerApprovalGate` first-token retention | **ABSORB INTO P-2** | `:292-294` silently retains the first token; premise disappears with `attachWaitToken` |
| D-2 line-location snapshot | **P-2 obligation** | Must be updated when P-2 edits either file, **without weakening the count invariants** |
| P-1 accidental external write | Procedural | Disclosed unprompted, deleted, confirmed absent. Outside the repository; no repository effect |
| P-1 worktree clarification | Process | Engineer identified the correct worktree by matching content anchors, not by name. **Future prompts must state the worktree path explicitly** |
| P-2 split-run redesign | **BLOCKED** | One package, do not split. Must include the `unconfirmed` state, its visibility, and the timeline-truthfulness fix |
| P-3 process-start marker | **BLOCKED** | **May run parallel to P-2.** Correctness-critical under R3. Belongs to the Dev HQ state contract. Discharges the V2-F8 obligation |
| P-4 continuation reconciliation | **BLOCKED** | Depends on P-2 only. The state ships in P-2; P-4 adds the sweep |
| P-5a timeline truthfulness | **MOVED INTO P-2** | The `Evan approved …` string asserts a completed effect; P-2 must change what it asserts. Not deferred behind E-6 |
| P-5b identity remediation | **BLOCKED on E-6** | Hardcoded `decidedByUserId`, `actorId`, `actorLabel`. "Who acted" needs an authenticated principal |
| Group 3 approve/reject/escalation idempotency | **Crosses the boundary** | Must fold into P-2 or defer. `approval-gate` binding and dispatch `idempotencyKey` items do not cross |
| DESIGN-001 DA-4 / DA-7 | **Crosses the boundary** | Approval-outcome rendering would be rewritten by P-2 |
| `attachWaitToken` dead surface | Contract | **Open** — Coordinator addition; becomes dead under R3 and belongs in P-2's scope |
| `decidePendingApproval` direction | Contract | **Open** — Coordinator addition; converges the wrong way for R3; semantics must be re-derived, not carried forward |
| Architecture Review transmission defects | Process | **Recorded** — sixth occurrence; duplicated sections, prompt bleed, nine truncated spans. No conclusion affected |
| V2S1B-F1 abrupt CLI loss cancels the suspended run | **CRITICAL** | **Confirmed, Development-only.** Status `canceled`, error `Dev session ended (CLI exited)`. Must not be generalized to staging or production |
| V2S1B-F2 completeToken returns success against a cancelled run | **CRITICAL** | **Confirmed as a Trigger.dev primitive.** False-success semantic. `founder-request-service.ts:486-489`'s correctness comment depends on it throwing. **Blocks approval-UX implementation on the current workflow.** Real-route consequence is code-derived, not executed |
| V2S1B-F3 client cancellation mechanism | **HIGH** | **Fully confirmed at source and runtime.** Supersedes the V2S1-F2 "must not be called a defect" qualification, for Development only |
| V2S1B-F4 suspended runs report `executing`, not `WAITING` | **LOW** | **Implementation note.** No Savrio code filters on Trigger.dev `WAITING`; the `"waiting"` hits are `AgentAvailability`, a different concept. No remediation required |
| V2S1B-F5 alternate-config isolation | **Favourable** | **Verified testing technique.** A prior version's declarative schedule did not fire once a newer version omitted it. Not evidence of H-AQ viability |
| V2S1B-F6 `.trigger` residue | **INFO** | Gitignored; no repository or reproducibility impact |
| V-2 Step 1B disposable runs | Evidence | `run_06fqb1d5pj0kidda7902lo7501` (canceled), `run_06fqb236vqq04csntd3lftrn01` (completed), waitpoint `waitpoint_cms3r3ijz17nd0jok8p36mzxm` |
| Residual Development worker `20260727.2` | **INFO** | Contains only disposable probe tasks; no worker connected so nothing can execute. Superseded by the next real `npm run trigger:dev` |
| Step 0 favourable inference | Superseded | Step 0 correctly returned `DOCUMENTATION DOES NOT SETTLE H-AQ`; its provisional favourable inference is **withdrawn** — empirical evidence supersedes it |
| Deployed-environment durability | **OPEN** | Untested. Step 1B evidence is Development-only and must not be extended. Requires a separately scoped probe if a production answer is needed |
| Unexecuted Path B tests | Deferred | Graceful shutdown, version lock, TTL-on-resume, and four negative controls — preserved for whichever replacement design still uses Trigger.dev tokens |
| V2S1-F1 normal CLI startup runs the real sweeper | **HIGH for testing** | **Open** — `trigger.config.ts:5` `dirs: ["./trigger"]`; no task-filter flag exists in the 4.5.7 CLI. Blocks Step 1 and Path A unisolated. Not an H-AQ defect |
| V2S1-F2 suspended runs in the watchdog disconnect payload | **HIGH** | **Open — confirmed at the 4.5.7 client layer, server behaviour UNKNOWN.** Not a confirmed cancellation defect. **Blocks H-AQ ratification.** Highest-value unknown in V-2 |
| V2S1-F3 graceful vs abrupt CLI exit differ | **MEDIUM** | **Open — confirmed at source.** Abrupt exit lets the watchdog fire disconnect; graceful exit kills it first. May make enforced graceful shutdown load-bearing for H-AQ |
| V2S1-F4 24-hour watchdog lifetime | **LOW** | **Open** — bounds the detached watchdog, not the CLI session. H-AQ must not be designed to depend on it |
| V2S1-F5 `enabledInDev: false` for application failures | **LOW** | **Open, confirmatory** — first attempt terminal. Says nothing about infrastructure recovery; the V2-F5 unknown is untouched |
| V2S1-F6 npm wrapper vs CLI vs watchdog processes | **INFO** | **Open** — any H-AQ runbook must target the actual CLI and stop the detached watchdog; stopping the wrapper is insufficient |
| V-2 Step 1 incidental sweeper runs | Evidence | **Recorded** — `run_06fqap9djhp1c3glmnib4mp001`, `run_06fqapfldjul56am8evlskdh01`, `run_06fqapl8prd27d5remgimp8n01`. No Dev HQ state mutated; Next.js was never started |
| V2-CORRECTION-2 report section completeness | Process | **Binding** — no required numbered section may be omitted or left empty; state `NOT EXECUTED` where no result exists |
| Step 1B isolation method | Gate | **Authorized — Option E only.** Untracked alternate config plus isolated probe directory, 150-second isolation gate. Options A, B, C, D not authorized, including as fallbacks |
| V2-F1 anchor not provisioned to run | High for V-2 only | **Closed by authorization** — exact worktree and `npm ci` granted 2026-07-27. Not a product defect |
| V2-F2 credentials unavailable to V-2 | High for V-2 only | **Closed by authorization** — Development credential granted for Path B; `DEV_HQ_INTERNAL_TOKEN` not needed for Path B |
| V2-F3 wait-inventory correction | **MEDIUM** | **Recorded** — one `wait.forToken` at `:83`, preceded by `wait.createToken` at `:69-74`. The prior two-wait wording was a Main Coordinator error, preserved openly |
| V2-F4 suspend/resume at second-scale only | **MEDIUM** | **Recorded** — 6.7s and 41.7s, single CLI session, no interruption. Must not be cited as restart evidence. Cloud-side, not re-derived by the Coordinator |
| V2-F5 retries disabled in the Development environment | **HIGH** | **Open** — `trigger.config.ts:8` `enabledInDev: false` confirmed. Whether infrastructure recovery is separate from task retry policy is UNKNOWN. Blocks H-AQ ratification |
| V2-F6 P-A restart strands in-flight runs | **HIGH** | **Open — code-derived inference, never observed.** Material input to E-1; needs empirical confirmation and an explicit Founder acceptance condition |
| V2-F7 npx resolves off the pinned CLI version | **LOW** | **Open** — H-AQ runbook must use `npm run trigger:dev`, never network-resolving `npx` |
| V2-F8 E-3 process-start marker absent | **MEDIUM — unassigned obligation** | **Open** — confirmed absent; no package owns it. Assign to whichever package first implements Mission Control read models or the persistence-disclosure surface |
| V2-F9 sweeper has never executed | **LOW / MEDIUM** | **Open — cloud-side, not re-derived.** Leaves V2-5 unanswered; needs an uninterrupted baseline first |
| V2-CORRECTION-1 long-report transmission | Process | **Binding** — deliver long reports in numbered, independently parseable sections so duplication or truncation is detectable. Fourth transmission failure in this project |
| Path A real end-to-end V-2 | Gate | **BLOCKED** — not authorized until Path B is complete and reconciled. A synthetic probe must not substitute for it |
| Multi-day V-2 observation | Gate | **BLOCKED** — not authorized; only warranted if Step 0, Path B, and Path A all pass |
| PKGE-HAZARD-1 worker-bundle second store | **MEDIUM** architectural constraint | **Open** — helpers pure at anchor; worker imports must be limited to pure functions, types, and safe utilities |
| SEC-1…SEC-14 reconciliation obligation | **Mandatory** for ADR-0003 | **Open** — readable at `SPRINT_1F_MISSION_CONTROL_LITE.md` §10.2:707-720. Package E wrongly recorded them unreadable |
| SEC-6 / CR-1 predictable capability minting | **HIGH** — pre-deployment blocker | **Open** — `review-service.ts:354` uses `nextId("rvt")`; CSPRNG required before generalizing the capability pattern |
| SEC-12 conversation-surface prompt injection | **HIGH** | **Open** — no Package E topic covers it; structured confirmed commands only |
| PKGE-CORRECTION-1 transmission format | Process | **Binding** — no load-bearing content preserved only inside wide Markdown tables |
| Eight FD / ACR-001 X-8 decisions | Founder decision | **Open** — tracked entry package governs; no durable Founder decision record exists |
| Timeline tie-break and assembly location | Architecture | **Open** — corpus self-contradicts; ADR-0002 §E5 unamended. AA-1 owed |
| Entry package "frontend test infrastructure absent" | Tracked-document staleness | **Open** — pre-existing defect in `SPRINT_1F_ENTRY_PACKAGE.md`; outside Package C scope |
| RAT-5 | Record-only observation | Logged for triage |
| RAT-4 | Process | Logged |
| RAT-7 | Process | Logged |
| Workflow diagnosis | Process | Logged, root cause unknown |

**Sprint 1E: CLOSED.** Protected baselines — `sprint-1e-baseline` → `62f6291`
(pre-remediation), `sprint-1e-remediated` → `d922f379` (ratified).
