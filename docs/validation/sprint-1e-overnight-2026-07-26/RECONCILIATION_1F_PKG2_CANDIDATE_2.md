# PKG-2 Reconciliation — Sprint 1F, Candidate 2 (`candidate-1f-pkg2-2`)

**Author:** Main Coordinator. **Every word of this document is Coordinator-written.**
**Date:** 2026-07-26
**Candidate:** `candidate-1f-pkg2-2` → commit `5c1fd6590160dd9bf41212868ed946bb9fb12123`
**Approval checkpoint:** `sprint-1f-pkg2-approved`

## Provenance and scope of this document

This document reconciles the two independent gate reports for Sprint 1F PKG-2
candidate 2. It is **not** a review, and **no part of it is attributable to either
reviewer.** The reviewers' own words live in their own documents:

| Document | Author | Content |
|---|---|---|
| `AR_1F_PKG2_CANDIDATE_2.md` | AGENT-019 Architecture Reviewer | The Architecture Review, verbatim, single-author |
| `ICR_1F_PKG2_CANDIDATE_2.md` | AGENT-008 Independent Code Reviewer | The Independent Code Review, verbatim, single-author |
| this file | Main Coordinator | Reconciliation, approval decision, follow-up disposition |

Sections **R1–R8** were written during the first reconciliation pass and verify the
Architecture Review's factual claims against the frozen candidate. Sections
**R9–R10** were written during the final pass and reconcile the two gates against
each other, then record the approval.

**Why this document exists separately.** Sections R1–R10 were initially appended to
`AR_1F_PKG2_CANDIDATE_2.md` beneath a `# Coordinator Reconciliation` heading. That
mixed two authors in one file, which departs from the repository's convention —
`AR_1F_TRACKA_CANDIDATE_1_REVIEW.md` and `CR_1F_TRACKA_CANDIDATE_1_REVIEW.md` are
single-author reviewer documents, and `RATIFICATION_1E_D922F379.md` keeps
coordinator-level judgment in its own file. The Coordinator material was moved here
**without alteration**, and the reviewer's report was left byte-identical minus the
appended block. Neither body of evidence was discarded. The split is recorded in the
commit that performed it.

**Reviewer-report integrity at the moment of the split.** In the combined file the
Architecture Reviewer's report occupied lines 1–507, ending at *"Every command result
reported above came from a command the reviewer actually executed in its session.
Nothing is inferred or fabricated."* The Coordinator block began at line 511. The
split cut at that boundary: 507 reviewer lines retained, 220 Coordinator lines moved,
and only the intervening `---` separator and the `# Coordinator Reconciliation`
heading were consumed. **No reviewer sentence, finding, count, table row, command
output, or clean-state proof was altered, summarized, reordered, or overwritten.**

---

Performed by the Main Coordinator against the frozen candidate in `C:\Users\evanj\Documents\Projects\savrio-review-pkg2r`, independently of the reviewer, using read-only commands.

## R1. Candidate identity — RECONCILED, all values match

```
git cat-file -t candidate-1f-pkg2-2          → tag
git rev-parse candidate-1f-pkg2-2            → aec584e310b094de93458b380b3e45eee0eb6600
git rev-parse candidate-1f-pkg2-2^{commit}   → 5c1fd6590160dd9bf41212868ed946bb9fb12123
git rev-parse candidate-1f-pkg2-2^{tree}     → 2804e06ec495f976aa6cf86e45ea83ae9bbab904
git rev-list -n 1 --parents …^{commit}       → 5c1fd659… a3d8d194effd08e74394f38e2ee4388348e0b482
git rev-parse HEAD                           → 5c1fd6590160dd9bf41212868ed946bb9fb12123
git symbolic-ref -q HEAD                     → exit 1 (detached)
git status --porcelain -uall                 → empty
```

All four expected values confirmed. Worktree clean and detached.

## R2. Changed paths and diffstat — RECONCILED, byte-identical to the reviewer's report

Cumulative (`6eefff7f…` → `5c1fd659…`) and remediation-only (`candidate-1f-pkg2-1` → `candidate-1f-pkg2-2`) `--name-status` and `--stat` output reproduced exactly as reported. `git diff --check` exit 0.

## R3. Cited line references — RECONCILED against the frozen blobs

Read via `git show 5c1fd659…:<path>`. Every load-bearing citation is accurate:

| Citation | Frozen content | Verdict |
|---|---|---|
| `playwright.config.ts:3` | `const PORT = Number(process.env.E2E_PORT ?? 3100);` | confirmed (M-4) |
| `playwright.config.ts:6-9` | the "collected by neither runner" invariant comment | confirmed |
| `playwright.config.ts:11-12` | `testDir: "./e2e"`, `testMatch: "**/*.spec.ts"` | confirmed (M-1) |
| `playwright.config.ts:13,16` | `fullyParallel: true`, `workers: 1` | confirmed (N-5) |
| `playwright.config.ts:14` | `forbidOnly: !!process.env.CI` | confirmed (N-6) |
| `playwright.config.ts:22` | `trace: "retain-on-failure"` | confirmed |
| `playwright.config.ts:27-35` | `npm run build && npx next start --hostname 127.0.0.1 --port ${PORT}`, `reuseExistingServer: false`, `timeout: 300_000` | confirmed |
| `vitest.config.ts:23-25` | the "e2e/ belongs to Playwright" invariant comment | confirmed |
| `vitest.config.ts:26` | `exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"]` — no `**/.git/**`, no `**/.next/**`, `**/dist/**` present | confirmed (M-3) |
| `vitest.config.ts:31-41` | dom project — no `exclude` key at all | confirmed (M-2) |
| `e2e/smoke.spec.ts:19` | `exact: true,` | confirmed |

No citation in the report was found to misstate the frozen candidate.

## R4. Package scope — RECONCILED

`git diff … -- package.json` confirms: `test: "vitest run"` preserved; three scripts added (`test:node`, `test:dom`, `test:e2e`); two devDependencies added (`@testing-library/react ^16.3.2`, `jsdom ^29.1.1`). **Zero additions to `dependencies`.** `@playwright/test` already present at baseline.

## R5. Headline count claim — INDEPENDENTLY REPRODUCED

```
npx vitest run --project node  → Test Files 22 passed (22) / Tests 326 passed (326)   exit 0
npx vitest run --project dom   → Test Files  1 passed  (1) / Tests   3 passed   (3)   exit 0
npx vitest run                 → Test Files 23 passed (23) / Tests 329 passed (329)   exit 0
```

22 + 1 = 23 and 326 + 3 = 329. Isolation and additivity confirmed; the pre-existing node baseline is preserved exactly.

## R6. Tag integrity — RECONCILED, unchanged

```
git tag -l → candidate-1f-ar2-6-1, candidate-1f-pkg2-1, candidate-1f-pkg2-2,
             candidate-1f-tracka-1, sprint-1e-baseline, sprint-1e-remediated,
             sprint-1f-ar2-6-approved, sprint-1f-tracka-approved
candidate-1f-pkg2-1 → tag 3efca4b50c9a1b7a2d2e5bbed90ae0b594f66ec8 → commit a3d8d194…
candidate-1f-pkg2-2 → tag aec584e310b094de93458b380b3e45eee0eb6600 → commit 5c1fd659…
```

Eight tags, both PKG-2 tags annotated and unmoved. No tag created, moved, or deleted.

## R7. Final worktree state — CLEAN

```
git status --porcelain -uall → (empty)
git rev-parse HEAD           → 5c1fd6590160dd9bf41212868ed946bb9fb12123
git rev-parse HEAD^{tree}    → 2804e06ec495f976aa6cf86e45ea83ae9bbab904
```

Byte-identical to the start of review, after both the reviewer's session and the coordinator's reconciliation runs.

## R8. Reconciliation not performed

The coordinator did **not** independently re-execute: `npx playwright test`, the four negative controls (NC-1, NC-1b, NC-2 through NC-7), `npx next build`, `npx tsc --noEmit`, `npx eslint .`, or the lockfile structural comparison. Those results stand on the reviewer's reported execution and on the reviewer's disclosed UNVALIDATED list above. Reconciliation covered identity, changed paths, diffstat, every cited line reference, package scope, the Vitest count claim, tag integrity, and final tree state.

## R9. Final reconciliation — Independent Code Review against Architecture Review

Performed by the Main Coordinator on Founder direction after the Architecture Review
completed. No additional reviewer was launched and the validation battery was not
repeated, because reconciliation revealed no concrete contradiction requiring it.

### R9.1 Gate results side by side

| | Independent Code Review (AGENT-008) | Architecture Review (AGENT-019) |
|---|---|---|
| Candidate | `candidate-1f-pkg2-2` | `candidate-1f-pkg2-2` |
| Tag object | `aec584e310b094de93458b380b3e45eee0eb6600` | `aec584e310b094de93458b380b3e45eee0eb6600` |
| Peeled commit | `5c1fd6590160dd9bf41212868ed946bb9fb12123` | `5c1fd6590160dd9bf41212868ed946bb9fb12123` |
| Tree | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` |
| Parent | `a3d8d194effd08e74394f38e2ee4388348e0b482` | `a3d8d194effd08e74394f38e2ee4388348e0b482` |
| Verdict | **APPROVE WITH FINDINGS** | **APPROVE WITH FINDINGS** |
| BLOCKER / MAJOR | **0 / 0** | **0 / 0** |
| MINOR / NOTE | 3 / 8 | 4 / 9 |
| Remediation required | **No** | **No** |
| Candidate left unchanged | **Yes**, verified | **Yes**, verified |

Both gates were run in the same detached worktree at different times, each after its
own `npm ci`, each verifying identity before reviewing and tree state after.

### R9.2 Validation results — no contradiction

| Validation | ICR | AR | Reconciled |
|---|---|---|---|
| `tsc --noEmit` | exit 0 | exit 0 | agree |
| `eslint` | exit 0 | exit 0 (also `npm run lint` 0) | agree |
| Vitest node | **326 / 22** | **326 / 22** | agree — baseline preserved exactly |
| Vitest dom | **3 / 1** | **3 / 1** | agree |
| Vitest aggregate | **329 / 23** | **329 / 23** | agree — additive, 326+3 and 22+1 |
| Playwright | 1 passed (16.8s, then 22.6s) | 1 passed (24.7s, then 24.6s) | agree on result; wall-clock differs across sessions, which is not a contradiction |
| Production build | `npm run build` 0 | `npx next build` 0 | agree |
| `git diff --check` | exit 0 | exit 0 | agree |
| Lockfile | 47 added, 0 version-changed, 0 removed | same, plus **47 of 47 `dev: true`** | agree; AR strictly stronger |

The single headline claim — that the pre-existing node baseline is preserved at
exactly 326 tests across 22 files — was reproduced by three independent parties:
the ICR, the AR, and the Coordinator (R5). **No validation result contradicts
another.**

### R9.3 Negative controls — no contradiction

| Control | ICR | AR | Reconciled |
|---|---|---|---|
| Decoy holding port 3100 with a satisfying `h1` | **FIRED**, exit 1, no test ran | **FIRED**, exit 1, BUILD_ID unchanged | agree |
| 404-serving squatter (evades readiness probe) | **FIRED**, `EADDRINUSE` | **FIRED**, `EADDRINUSE` | agree |
| `exact: true` discrimination | **FIRED** — 4 cases, 2 failed / 2 passed | **FIRED** — 5 cases, 2 failed / 3 passed | agree; AR added a whitespace-normalization case. Different case counts are a difference in test design, **not** a difference in outcome |
| Candidate-1 false positive reproduced side by side | Case B passes where case A fails | Case 2 passes where case 1 fails | agree |
| `e2e/*.test.ts` collected by neither runner | **FIRED**; exposed the `.test.tsx` gap | **FIRED**; exposed `.test.tsx`, plus `.spec.tsx`, `.next/`, root-anchoring | agree; AR is a strict superset |
| Vitest runtime `defaultExclude` | `["**/node_modules/**", "**/.git/**"]` read from `defaults.9aQKnqFk.js:6` | identical constant, identical file and line | agree |
| Zero-collection fails closed | NC-5a / NC-5b **FIRED** | confirmed by inspection, not re-executed | no conflict |
| dom-in-node, no-setup, trace behaviour | NC-4 / NC-6 / NC-7 / NC-8 **FIRED** | not re-run | no conflict — complementary coverage |
| Per-file `@vitest-environment` hatch; `E2E_PORT` coercion | not run | **FIRED** | no conflict — AR-only |

**Both gates independently answered the central question the same way:** the E2E
false-positive path that failed candidate 1 is closed on both halves — the run
cannot pass without building and starting the app (BUILD_ID evidence plus two
fail-closed decoys), and the heading assertion genuinely rejects a superstring.
Each proved it by construction rather than by reading configuration.

**One disclosed measurement anomaly, internal to the AR and not a cross-gate
conflict.** The AR's first `.next/` collection probe appeared to show the files
were not collected; two later runs, one naming the files, showed they were. The AR
disclosed this openly, reported the reproduced result, and labelled the single
contrary observation unexplained. It bears only on M-3's `.next/` leg, which the AR
explicitly classifies as **pre-existing** and therefore **not** introduced by this
candidate. It does not affect the approval decision.

### R9.4 Finding-by-finding reconciliation

| ICR | AR | Severity | Disposition |
|---|---|---|---|
| MINOR-1 — `vitest.config.ts:26` drops `**/.git/**` | **M-3**, extended | MINOR ↔ MINOR — **agree** | Real, confirmed by both, each proving it in an isolated scratch project. **Fix recommendation differs and the AR's is adopted**: the ICR proposes adding the single token `"**/.git/**"`; the AR proposes composing from `configDefaults` in **both** projects, which also covers `.next/`, removes the dead `**/dist/**`, restores node/dom symmetry, and cannot drift on a Vitest upgrade. Same edit size, strictly larger closure. **A refinement of the fix, not a disagreement about the finding.** |
| MINOR-2 — dom project has no `e2e/**` exclude | **M-2** | MINOR ↔ MINOR — **agree** | Real, reproduced independently by both (`[dom] e2e/*.test.tsx`). Both agree it cannot produce a false green: such a file importing `@playwright/test` throws loudly outside the Playwright runner. AR sharpens the framing to "the `e2e/` ownership boundary has two enforcement points and only one is implemented." |
| MINOR-3 — `E2E_PORT` coercion | **M-4** | MINOR ↔ MINOR — **agree** | Arithmetic confirmed by both (`""` → `0`, `"abc"` → `NaN`); both label the downstream Playwright behaviour **plausible, not executed**. **The AR corrects the fix**: the ICR's `\|\|` closes `""` but leaves `"abc"` → `NaN`, so it is partial; validate-and-throw is complete. The AR also raises the rationale — with `reuseExistingServer: false`, port 3100 is exclusive and `E2E_PORT` is the only concurrent-worktree escape. **Severity unchanged.** |
| *not reported* | **M-1 — Playwright `testMatch` narrowing** | MINOR | **New in the AR; the one substantive gap in the ICR.** `testMatch: "**/*.spec.ts"` means `e2e/foo.spec.tsx` is collected by nothing while both gates report green — proven by execution. Not a contradiction of anything the ICR said: the ICR's only `testMatch` remark (that it correctly ignores `e2e/*.test.tsx`) is true and compatible. |
| NOTE-1 comment accuracy | confirmed in AR §5 | NOTE | Agree — every load-bearing comment in the diff was tested by both; none overstates the code |
| NOTE-2 prerendered HTML, not hydration | confirmed in AR §5 | NOTE | Agree — `/` is `○ (Static)`; not a defect, the spec claims only that the harness works |
| NOTE-3 nothing in CI runs any test | **N-1**, elevated | NOTE | Agree, and both rule it **outside PKG-2's authorized envelope**. Routed to its own package |
| NOTE-4 `forbidOnly` inert | **N-6** | NOTE | Agree |
| NOTE-5 `fullyParallel` + `workers: 1` | **N-5**, extended | NOTE | Agree factually; AR adds that it is a latent constraint rather than inert |
| NOTE-6 missing ICR handbook | **N-8**, re-routed | NOTE | Agree it is absent; AR routes it to existing dependency **D-8** rather than opening a new item |
| NOTE-7 trace artifacts contained | **N-9** | NOTE | Agree |
| NOTE-8 `e2e/**` root-anchored | **N-4** | NOTE | Agree; both call it almost certainly intended |
| *not reported* | **N-2** — E2E assertion coupled to the DOM nesting decision in `components/dashboard/TopBar.tsx:37-42`, a file the spec never names | NOTE | New in the AR; additive. Fail-closed and the intended trade. Recorded so no maintainer "repairs" it by deleting `exact: true`, which would reinstate the candidate-1 defect |
| *not reported* | **N-3** — `// @vitest-environment jsdom` in a `.test.ts` works but bypasses `setupFiles`, so such a test gets no `cleanup()` | NOTE | New in the AR; additive. Executed by the reviewer, not merely reasoned |
| *not reported* | **N-7** — dependency-ledger traceability: D-6 lists jsdom as ❌ OPEN while the approved tree now contains it | NOTE | New in the AR; additive. AR explicitly reports **no governance breach**: D-6's *Blocks* column names 1F-6, 1F-10, 1F-19, not 1F-18. Routed to the Founder as a recommendation |
| Security attribution — 0 of 47 added packages carry an advisory | **explicitly not adopted** | — | **A scope declination, not a contradiction.** The AR did not run `npm audit` and declined to endorse a claim it had not verified — correct conduct. Both gates independently verified the narrower sufficient fact: all 47 additions are `dev: true`, so **zero production runtime surface**. The ICR's attribution stands as ICR-only evidence and is recorded as such |

**Count reconciliation.** MINOR 3 → 4: the ICR's three findings map one-to-one onto
AR M-2, M-3, M-4, and M-1 is genuinely new. NOTE 8 → 9: six ICR notes are carried as
numbered AR notes (N-1, N-4, N-5, N-6, N-8, N-9), two (NOTE-1, NOTE-2) are confirmed
in the AR's §5 pass without renumbering, and three are new (N-2, N-3, N-7).
**No ICR finding was dropped, downgraded, or left without a disposition. There is no
severity disagreement on any finding either gate raised.** Every one of the 3 ICR
MINOR findings, 4 AR MINOR findings, 8 ICR NOTEs, and 9 AR NOTEs appears in the table
above with an explicit disposition.

### R9.4b The six questions, asked of every finding

Each question was asked of all 24 findings across both gates.

| Question | Answer | Basis |
|---|---|---|
| **Does any finding create a false-green path?** | **No — with one bounded qualification, disclosed.** | Both gates searched for false-green routes explicitly and found none among the MINORs. M-1 is the only finding in the family: a *newly added* `e2e/*.spec.tsx` would be executed by nothing while both gates report green. It **cannot suppress an existing failure** and **cannot make a failing test pass** — it can only make an added test not exist. The existing `smoke.spec.ts` cannot silently vanish, because Playwright fails closed on zero collection (ICR NC-5a/NC-5b). M-3's `.next/` duplicate-collection hazard is dormant and is **pre-existing**, not introduced. No other finding touches the pass/fail path |
| **Does any finding require remediation before approval?** | **No** | Both gates answered No independently and gave the same reason: 0 BLOCKER, 0 MAJOR; every MINOR is quality, consistency, or operability; none lies on the false-positive path this candidate exists to close; none can alter production runtime behaviour, since all 47 added packages are dev-only |
| **Does any finding conflict with the other gate?** | **No** | Three differences exist and all three resolve. Two are refinements of a *fix* (M-3, M-4) that leave the *finding* and its severity untouched. One is a declared non-adoption on scope grounds (security attribution). No fact asserted by either gate is denied by the other |
| **Does any finding change the candidate identity?** | **No** | Tag object, peeled commit, tree, and parent are identical across the ICR, the AR, the Founder's direction, and the Coordinator's own `rev-parse`. No finding bears on identity |
| **Does any finding indicate candidate or tag mutation?** | **No** | Both reviewers created probes inside the worktree and deleted every one, then verified HEAD, tree, and both tags afterward. The Coordinator re-verified tree `2804e06e…` and both candidate tag objects independently |
| **Does any finding invalidate the clean-worktree proof?** | **No** | `git status --porcelain -uall` returned zero entries at every checkpoint in both reviewer sessions and in the Coordinator's. Trace artifacts land in the gitignored `test-results/` (ICR NOTE-7 / AR N-9, confirmed by both after a run that genuinely produced a `trace.zip`) |

### R9.5 Verdict-flipping conditions — tested, none holds

The AR named three conditions that would convert its verdict to
**REJECT — REMEDIATION REQUIRED**. The Coordinator tested all three:

| Condition | Test | Result |
|---|---|---|
| A `.spec.tsx`/`.spec.mts` E2E file already planned for Track B, making M-1 active rather than latent | `grep -rn "spec\.tsx\|spec\.mts\|\.spec\." docs/plans/` | **Zero matches.** Condition not met |
| `output: "standalone"` enabled in `next.config.ts` this sprint, making M-3's duplicate-collection hazard active | Read `next.config.ts` in the working tree and at `5c1fd659` | Byte-identical, empty config object, **no `output` key**. The `standalone` occurrences in `docs/plans/` are the PWA manifest's `display: standalone` and a "standalone Tasks view" — unrelated to Next's `output` option. Condition not met |
| A demonstrated path by which any MINOR produces a green run that should be red | Both gates searched explicitly and reported none; M-1's worst case is that a *newly added* spec does not run, which cannot suppress an existing failure, and Playwright fails closed on zero collection | **None demonstrated.** Condition not met |

**These conditions are recorded in the follow-up register.** If any becomes true
before M-1 and M-3 land, the deferral must be revisited.

### R9.6 Blocking-condition sweep

| Condition | Finding |
|---|---|
| BLOCKER in either review | **None.** 0 and 0 |
| MAJOR in either review | **None.** 0 and 0 |
| Unresolved contradiction between the gates | **None.** Every difference is an addition (M-1, three new NOTEs), a refinement of a fix (M-3, M-4), or a declared non-adoption (security attribution). No fact asserted by one gate is denied by the other |
| Identity mismatch | **None.** Tag object, peeled commit, tree, and parent are identical across the ICR, the AR, the Founder's direction, and the Coordinator's own `rev-parse` |
| Candidate mutation | **None.** Both reviewers created probes and deleted them; both verified HEAD, tree, and tag afterward. Coordinator re-verified tree `2804e06e…` |
| Tag movement | **None.** Eight tags before reconciliation; both PKG-2 tags annotated and at their originally reported objects |
| Dirty-worktree condition | **None in the review worktree** — `git status --porcelain -uall` empty at every checkpoint in both sessions |
| Evidence that changes the approval decision | **None found** |

### R9.7 Final remediation decision

**Remediation is NOT required. No third candidate.** Both independent gates support
approval, and the reconciliation surfaced no blocking condition. All four MINOR
findings are deferred to a follow-up package under the F-A7 freeze policy and are
recorded in `SPRINT_1F_FOLLOWUP_REGISTER.md`.

## R10. Approval checkpoint — created and verified

**`candidate-1f-pkg2-2` is APPROVED** as the Sprint 1F frontend-test foundation.

All eight approval preconditions were confirmed before the tag was written:
BLOCKER 0 · MAJOR 0 · no unresolved gate conflict · no identity mismatch · no
candidate mutation · no tag movement · no dirty review worktree · remediation not
required.

The protected checkpoint was created as an **annotated** tag following the
convention of `sprint-1f-tracka-approved` and `sprint-1f-ar2-6-approved`, and
verified by `rev-parse` **after** creation:

| Property | Value | Expected | Result |
|---|---|---|---|
| Tag name | `sprint-1f-pkg2-approved` | canonical `sprint-1f-<package>-approved` | PASS |
| `cat-file -t` | `tag` | annotated | PASS |
| Tag object | `d672fbf4965974ab9cdc57b469730ac96bdc68a0` | — | created |
| Peeled commit | `5c1fd6590160dd9bf41212868ed946bb9fb12123` | `5c1fd659…` | PASS |
| Parent | `a3d8d194effd08e74394f38e2ee4388348e0b482` | `a3d8d194…` | PASS |
| Tree | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` | `2804e06e…` | PASS |

**Candidate-tag integrity after approval — neither tag moved:**

| Tag | Type | Tag object | Peeled commit |
|---|---|---|---|
| `candidate-1f-pkg2-1` | annotated | `3efca4b50c9a1b7a2d2e5bbed90ae0b594f66ec8` | `a3d8d194effd08e74394f38e2ee4388348e0b482` |
| `candidate-1f-pkg2-2` | annotated | `aec584e310b094de93458b380b3e45eee0eb6600` | `5c1fd6590160dd9bf41212868ed946bb9fb12123` |

Both are byte-identical to the values both gates reported at the start of their
reviews. Nine tags total; `git fsck` clean.

## R11. Document custody

| Commit | Action |
|---|---|
| `7aaf7046ec9edc28632550e07086e9d72f6327f0` | Preserved both gate reports and the follow-up register. The Coordinator reconciliation was appended to the Architecture Review file in this commit |
| *this commit* | Split the two authors into separate documents. Reviewer report verified byte-identical (SHA-256 `f0596573…` before and after); Coordinator block verified moved unaltered (SHA-256 `0ac8e283…` before and after) |

The approval tag's message names `AR_1F_PKG2_CANDIDATE_2.md`,
`ICR_1F_PKG2_CANDIDATE_2.md`, and `SPRINT_1F_FOLLOWUP_REGISTER.md` at commit
`7aaf704`. That reference remains accurate — those files exist at that commit with
that content. **This document is an additional record, not a replacement, and the
approval tag was not and will not be moved to point at it.**
