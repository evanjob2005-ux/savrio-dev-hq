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
| PKG-2 CI enforcement | Future package | **Open — requires its own authorization** |
| PKG-2 review-brief correction | Process | **Binding on future briefs** |
| RAT-5 | Record-only observation | Logged for triage |
| RAT-4 | Process | Logged |
| RAT-7 | Process | Logged |
| Workflow diagnosis | Process | Logged, root cause unknown |

**Sprint 1E: CLOSED.** Protected baselines — `sprint-1e-baseline` → `62f6291`
(pre-remediation), `sprint-1e-remediated` → `d922f379` (ratified).
