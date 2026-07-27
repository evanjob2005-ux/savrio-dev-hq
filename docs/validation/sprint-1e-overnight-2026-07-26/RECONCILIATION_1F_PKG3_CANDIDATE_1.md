# PKG-3 Reconciliation — Sprint 1F, Candidate 1 (`candidate-1f-pkg3-1`)

**Author:** Main Coordinator. **Every word of this document is Coordinator-written.**
**Date:** 2026-07-27
**Candidate:** `candidate-1f-pkg3-1` → commit `b7386f0521f296a5411e77e15d4dd385eb65691d`
**Approval checkpoint:** `sprint-1f-pkg3-approved`

## Provenance

| Document | Author | Content |
|---|---|---|
| [`AR_1F_PKG3_CANDIDATE_1.md`](./AR_1F_PKG3_CANDIDATE_1.md) | Independent Architecture Reviewer | Complete review, verbatim, single-author |
| [`ICR_1F_PKG3_CANDIDATE_1_RELAYED.md`](./ICR_1F_PKG3_CANDIDATE_1_RELAYED.md) | **Main Coordinator** | **Relayed findings only** — what was available at reconciliation time |
| [`ICR_1F_PKG3_CANDIDATE_1.md`](./ICR_1F_PKG3_CANDIDATE_1.md) | AGENT-008 Independent Code Reviewer | **Recovered after approval** — complete transcript, verbatim, **authoritative for the reviewer's wording** |
| this file | Main Coordinator | Reconciliation, approval decision, obligations |

> **Post-approval addendum, 2026-07-27.** The ICR transcript was recovered from the
> dedicated ICR tab **after** this reconciliation and after `sprint-1f-pkg3-approved`
> was created. Comparison against the relayed record found **no material difference**
> in verdict, counts, candidate identity, severity, remediation decision, or
> recommendation. **The approval decision is unchanged and PKG-3 was not reopened.**
>
> Three statements below are superseded by the recovery and are corrected here rather
> than rewritten in place, so the record shows what was known when:
>
> 1. **R1 — "Independent Code Review … verdict NOT ON RECORD."** The recovered
>    transcript states **APPROVE WITH FINDINGS**. Both gates therefore recommend
>    approval on the record, which strengthens rather than alters the decision.
> 2. **R9 — the ICR's worktree state and probe state recorded as NOT ON RECORD.** Now
>    on record: detached at `b7386f05`, final `git status --porcelain -uall` empty,
>    all probes removed, `README.md` modified and restored byte-identically, tags
>    unmoved, no commit, no push. **The reviewer disclosed that the designated review
>    worktree did not exist and that it created one detached at the candidate commit**
>    — no branch, no tag touched, nothing committed.
> 3. **R6 / R12 — "the 13 relayed ICR NOTE texts are not on record."** All 13 are now
>    preserved verbatim.
>
> One divergence between the gates, non-blocking, recorded for completeness: the
> concurrency key omitting event type is **AR N-6 (MINOR, recommends a fix)** but
> **ICR NOTE-13 ("defensible — same ref, same commit")**. Both agree it cannot
> produce a false green. It is already carried in follow-up **package E**.
>
> Two places where the recovered ICR is **stronger** than this reconciliation
> recorded: it **closed the NC-7 gap itself by probe** (§6.14 — an untracked file and
> a tracked modification were both detected; `*.log` and `local/` correctly ignored),
> so the hygiene check is now demonstrated to discriminate in **both** directions,
> where the AR could only recommend a future positive control; and it **verified all
> seven** green-restoration run trees as `ca9cdc7e…`, extending the merge-ref proof
> beyond the three runs recorded here. It also **empirically refined AR N-1**: the
> npm 11 allow-scripts advisories did **not** leave the four packages unbuilt —
> `ignore-scripts` is false and `esbuild --version`, `require('sharp')` and
> `require('unrs-resolver')` all resolve — so the impact is log noise, not a broken
> install.

**The evidence set is asymmetric and that must not be smoothed over.** One complete
independent gate is on record. The second gate's report was never supplied and is
absent from disk; only its findings, as relayed, survive. The Architecture Reviewer
independently confirmed the same absence (§7) and assessed every relayed ICR finding
from primary evidence rather than deferring to it.

---

## R1. Verdicts

| Gate | Verdict | Remediation required |
|---|---|---|
| **Architecture Review** | **APPROVE WITH FINDINGS** — conditional on (a) the §13 repository-settings action being tracked as an obligation, and (b) the MINOR-5 tag-annotation correction being recorded here | **No** (§12) |
| **Independent Code Review** | **NOT ON RECORD.** No verdict line was ever supplied. Its MAJOR-1 was relayed as *not grounds for candidate re-freeze* | **No**, per the relayed disposition |

**No verdict has been inferred for the ICR.** Both of the Architecture Review's
approval conditions are satisfied by this document plus commit `b18c1a8`.

## R2. Counts

| Severity | Architecture Review (new) | ICR (relayed, per AR §11) |
|---|---|---|
| **BLOCKER** | **0** | **0** |
| **MAJOR** | **0** | **1** |
| **MINOR** | **6** | **5** |
| **NOTE** | **6** | **13** |

The single MAJOR is **governance state, not candidate code** — see R6. The
Architecture Review raised **no** MAJOR and **no** BLOCKER of its own, and
independently confirmed all six relayed ICR findings as factually valid, upgrading
MINOR-1 to empirically demonstrated and downgrading MINOR-3 to NOTE.

## R3. Candidate identity — reconciled three ways

| Property | Founder-stated | Architecture Review | Coordinator `rev-parse` | Result |
|---|---|---|---|---|
| Tag type | annotated | `tag` | `tag` | **match** |
| Tag object | `30e0c057d2092719c4c91d8a2456cefbf676bbaf` | same | same | **match** |
| Peeled commit | `b7386f0521f296a5411e77e15d4dd385eb65691d` | same | same | **match** |
| Parent | `5dd80ed64f847756e49065de1f151155808ac6a6` | same | same | **match** |
| Tree | `ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5` | same | same | **match** |
| Baseline | `5c1fd6590160dd9bf41212868ed946bb9fb12123` | resolves via `sprint-1f-pkg2-approved` | same | **match** |

**No identity mismatch.** Six of six values agree across three independent
derivations.

## R4. Changed path and diffstat — reconciled

```
A  .github/workflows/frontend-tests.yml
1 file changed, 299 insertions(+)
```

Addition-only, `+299/−0`, `git diff --check` clean. Independently reproduced by the
Architecture Reviewer (§2) and the Coordinator. Every excluded path was verified
byte-identical to the baseline at freeze time: `package.json`,
`package-lock.json`, `vitest.config.ts`, `playwright.config.ts`, `next.config.ts`,
`tsconfig.json`, `.gitignore`, `CODEOWNERS`, `e2e/`, `app/`, `lib/`, `adapters/`,
`components/`, `test/`, `standards/`, `handbooks/`, `agents/`, `docs/`, and all six
pre-existing workflows.

## R5. Local validation and Linux CI evidence — reconciled

**Local counts agree exactly across three independent executions** — implementation
(Windows/Node 24), Architecture Review (Windows/Node 24), and CI (Linux/Node 22):

| Check | Implementation | Architecture Review | CI clean run |
|---|---|---|---|
| `tsc --noEmit` | 0 | 0 | ✓ |
| `eslint .` | 0 | 0 | ✓ |
| Vitest node | **326 / 22** | **326 / 22** | **326 / 22** |
| Vitest DOM | **3 / 1** | **3 / 1** | **3 / 1** |
| `npm test` | **329 / 23** | **329 / 23** | **329 / 23** |
| `next build` | 0 | 0 | ✓ |
| Playwright | 1 passed | 1 passed (25.1s) | 1 passed (16.4s) |
| `actionlint` 1.7.7 | 0 | 0, plus all workflows | — |

**Linux CI, run [30231657108](https://github.com/evanjob2005-ux/savrio-dev-hq/actions/runs/30231657108), SUCCESS:** `node v22.23.1`, `npm 11.16.0`
printed before install, `npm ci` `added 734 packages`, Chromium 149.0.7827.55
(chromium v1228) downloaded fresh with no cache, both hygiene steps clean, **0
artifacts**.

**Merge-ref tree equality — independently verified by both parties.** Every run
executed against a synthetic merge ref, never the head commit. The Architecture
Reviewer confirmed `a216f1ea^{tree}` = `b7386f05^{tree}` = `192673da^{tree}` =
`ca9cdc7e…`, and that `d5e50e5e` is an ancestor of `b7386f05`. **The merge-ref
validation therefore exercised a tree byte-identical to the frozen candidate.** The
Architecture Reviewer calls this "the strongest single result in the evidence set"
and warns it will not hold for general future PRs — correct, and recorded.

## R6. Finding-by-finding reconciliation

### The one MAJOR — governance, not candidate code

**ICR MAJOR-1: no branch protection, no rulesets, no required status checks.**

Confirmed independently twice (`404 Branch not protected`; `rulesets → []`). Both
gates agree, and the reconciliation adopts it:

- **a real governance gap** — not dismissed, not minimized;
- **outside the one-file candidate scope** — branch protection is repository *state*,
  not repository *content*; no edit to any file can create a required status check;
- **not a candidate-code defect**;
- **not grounds for candidate re-freeze** — demanding candidate remediation would
  demand the impossible;
- **a mandatory post-integration action** — see R8.

The Architecture Reviewer adds the decisive ordering fact: **GitHub cannot mark a
check required until it has observed that check reporting.** Branch protection
therefore *necessarily* follows integration. Making it an acceptance criterion would
render PKG-3 unacceptable by construction.

### The MINOR findings — all eleven

| ID | Finding | Disposition |
|---|---|---|
| **ICR MINOR-1** | `if-no-files-found: ignore` → should be `warn` | **Confirmed and strengthened.** AR demonstrated it empirically three times (NC-4, NC-5B, NC-6B: E2E red, upload step fired, 0 artifacts, step green, no warning). Never converts red to green. → **package E** |
| **ICR MINOR-2** | hygiene `if: always()` → cancellation-aware | **Confirmed, very low impact.** Cannot produce a wrong verdict. `!cancelled()` strictly more correct → **package E** |
| **ICR MINOR-3** | add `next` to E2E binary precondition | **Confirmed as observation, severity downgraded to NOTE** (AR N-10). `npm run build` fails closed if `next` were absent, so the registry-fallback hazard is unreachable and no false green is possible. Diagnostic symmetry only → **package E** |
| **ICR MINOR-4** | concurrency cancellation unvalidated | **Confirmed. Recorded as NOT PROVEN**, not folded into the green result. Does not gate approval → **package E** |
| **ICR MINOR-5** | false tag-annotation claim | **Confirmed and materially worse than stated.** → **R7, mandatory** |
| **AR N-1** | npm 11 pin silently disables install scripts for `@depot/cli`, `esbuild@0.23.1`, `sharp@0.34.5`, `unrs-resolver@1.12.2` | Inert today (prebuilt platform binaries via `optionalDependencies`; build and E2E pass) but **unmanaged**. Trades total-failure drift for subtle behavioural drift → **package C** |
| **AR N-2** | pinned npm version echoed but never asserted | Real fail-open seam: a successful install resolving to an unexpected version proceeds into `npm ci` unchecked → **package C** |
| **AR N-3** | `e2e/smoke.spec.ts` precondition overfitted and redundant | NC-6B already proved Playwright fails closed on zero collection; the assertion adds no safety and guarantees a red build the day the spec is renamed → **package E** |
| **AR N-4** | hygiene gate's **detection path never exercised** | Drives NC-7 to PARTIALLY PROVEN. Combined with a broad `.gitignore`, its detection power is asserted more than demonstrated → **package E** |
| **AR N-5** | toolchain contract exists only inside the workflow — no `engines`, no `packageManager`, no `.nvmrc` | The "interim" pin has no mechanism to become permanent or be retired deliberately → **package C** |
| **AR N-6** | concurrency key collides `push` and `workflow_dispatch` on the same branch | Both yield `refs/heads/<branch>`; with `cancel-in-progress: true` a push can cancel a deliberate validation run — counter to the dispatch trigger's purpose → **package E** |

### The NOTEs

Architecture Review N-7 … N-12 are recorded in the preserved review. Three are
load-bearing for future work and are carried into the register: **N-11** (the
`.next`/Vitest exclusion risk is currently **inert**, verified empirically — 0
`*.test.ts(x)` in `.next`, 0 collected — so the build-after-tests ordering is
*precautionary*, not a live workaround, but it is an **undocumented ordering
constraint** a future editor could break); **N-9** (two `next build` executions and
both Vitest projects twice per run — justified at ~10 s, revisit if build time
grows); **N-12** (local `actionlint` had no ShellCheck, so embedded shell was not
statically linted locally — and `lint.yml`, which would cover it, has never run).

**The 13 relayed ICR NOTE texts are not on record** — only the count. They cannot be
reconciled individually and no attempt was made to reconstruct them.

**No contradiction exists between the gates.** Every difference is an
*independent strengthening* (MINOR-1), a *reasoned severity downgrade* (MINOR-3), or
an *addition* (N-1 … N-6). No fact asserted by either gate is denied by the other.

## R7. ICR MINOR-5 — the false annotation claim, explicitly corrected

**This passage in the `candidate-1f-pkg3-1` tag annotation is FALSE and is hereby
SUPERSEDED:**

> "All six prior workflows trigger only on main or pull requests to main."

**Accurate replacement, which is the record:**

- **`pr.yml` has a `pull_request` trigger with no `branches:` filter** — its `on:`
  block declares `types:` only;
- **it therefore ran during the PKG-3 validation campaign**, on
  `validation/1f-pkg3-ci-npm11`, a branch not targeting `main`;
- **it failed repeatedly — 17 times, every one a failure.** Root cause is
  pre-existing and unrelated to the candidate: `##[error]Unbalanced Markdown code
  fences` across a 118-file changed set. The candidate adds no Markdown, and its YAML
  parses cleanly under the same PyYAML check;
- **before PKG-3, no active workflow enforced the complete PKG-2 frontend-test
  foundation** by running the Node Vitest project, the DOM Vitest project, aggregate
  tests, Chromium installation, and the Playwright smoke test on the active
  development branch.

The narrower statement is true and load-bearing. The broad claim overstated it and
was demonstrably falsified during the very campaign the annotation describes.

**`candidate-1f-pkg3-1` is NOT moved, recreated, replaced, or re-frozen.** A tag
annotation is immutable evidence of what was believed at freeze time. Re-tagging to
correct it would churn the tag, invalidate both gates' identity anchors, and correct
nothing material — the Architecture Reviewer reached the same conclusion
independently (answer V). **This record and the follow-up register supersede that
passage of the annotation, and must be read alongside it.**

Everything in the annotation bearing on the candidate itself — commit, tree, parent,
one-file diff, counts, run IDs, negative-control outcomes — the Architecture Reviewer
verified as **accurate**.

## R8. Mandatory post-integration repository-settings obligation

**PKG-3 provides reliable CI detection, not merge enforcement.** The active default
branch has no branch protection, no ruleset, and no required status checks.
**Therefore failing frontend tests currently block nothing.**

**Wording correction adopted:** describe PKG-3 as **"detection now, enforcement upon
the §13 settings action"** — never as "CI enforced" — until required checks exist.
Sprint 1F PKG-3 must not be closed as "CI enforced."

Recorded as **PKG-3-OBLIGATION-A** in
[`SPRINT_1F_FOLLOWUP_REGISTER.md`](./SPRINT_1F_FOLLOWUP_REGISTER.md), with the eight
decisions the settings action must make and record: exact required check names,
protected branches, whether pull requests are required, whether branches must be
current, whether direct pushes are prohibited, whether administrators may bypass, how
emergency bypass is authorized **and audited**, and whether stale approvals are
dismissed.

The Architecture Review's §13 adds ordered execution detail and two constraints worth
carrying explicitly:

1. Integrate first, so both jobs register their check names.
2. Confirm the names as GitHub observes them: **`Unit and Static Validation`** and
   **`End-to-End Smoke`**.
3. Require exactly those two, with "require branches to be up to date" enabled.
4. **Do not add `Validate Pull Request` (`pr.yml`) to required checks** — it fails
   17/17 for a pre-existing Markdown-fence reason and would permanently block all
   merges.
5. Verify with a throwaway PR that merge is blocked while checks are pending or red.

**Not performed during this reconciliation.** Requires its own authorization.

## R9. Blocking-condition sweep

| Condition | Finding |
|---|---|
| BLOCKER in either gate | **None.** 0 and 0 |
| Candidate-code MAJOR requiring re-freeze | **None.** AR raised 0 MAJOR; the single relayed ICR MAJOR is repository state, unfixable inside any candidate, and both gates agree it is not grounds for re-freeze |
| Identity mismatch | **None.** Six of six values agree across three derivations |
| Candidate mutation | **None.** AR §16: no tracked file edited, no commit created, HEAD and tree byte-identical at exit |
| Tag movement | **None.** AR re-verified after review; Coordinator re-verified independently |
| Unremoved probes | **None** in the Architecture Review worktree: the only in-worktree artifact was `test-results/` (`.last-run.json`), deleted; all downloaded evidence lived in the session scratchpad. **The ICR's probe state is NOT ON RECORD** |
| Dirty review worktree | **AR worktree clean** — final `git status --porcelain -uall` empty, `git diff --check` clean, detached HEAD, no branch created. **The ICR's worktree state is NOT ON RECORD** |
| Contradiction invalidating approval | **None** |

## R10. Candidate-remediation decision

**Remediation is NOT required. No re-freeze. No second candidate.**

No finding from either gate can cause a failing condition to report green. The
candidate is additive-only, cannot alter application behaviour, is proven on Linux
against a byte-identical tree, and is proven to fail closed across eight distinct
individually-attributed negative controls. Every remaining finding is outside the
candidate's authority, a diagnostics refinement, or a tracked interim measure the
candidate itself explicitly discloses.

## R11. Approval checkpoint

**`candidate-1f-pkg3-1` is APPROVED** as the Sprint 1F PKG-3 foundation.

Both Architecture Review conditions are satisfied: §13 is tracked as
**PKG-3-OBLIGATION-A**, and the MINOR-5 correction is recorded in **R7** and in the
register.

| Property | Value |
|---|---|
| Approval tag | `sprint-1f-pkg3-approved` — annotated |
| Tag object | `77042f9e65b6ee23be366d258b1c53c6d4a0dc1f` |
| Peeled commit | `b7386f0521f296a5411e77e15d4dd385eb65691d` |
| Parent | `5dd80ed64f847756e49065de1f151155808ac6a6` |
| Tree | `ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5` |

`candidate-1f-pkg3-1` was **not moved**. Eleven tags total.

## R12. What remains UNVALIDATED

Carried forward verbatim in substance from the Architecture Review, because an
approval record that omits these would overstate what was proven:

- **`push` trigger execution** and **`workflow_dispatch` execution** — every run was
  `pull_request`;
- **concurrency cancellation** — **NOT PROVEN**; no run in the repository has
  conclusion `cancelled`;
- **hygiene detection path** — NC-7 **PARTIALLY PROVEN**; no control ever dirtied the
  tracked tree;
- **non-Linux runners**; **browsers other than Chromium**; **npm versions other than
  11.16.0** — and npm 10 provably **cannot** install this project;
- **`ci.yml`, `lint.yml`, `security.yml`, `dependencies.yml`, `release.yml`** — never
  executed, zero runs;
- **local ShellCheck coverage** of embedded shell;
- **the ICR's report text, verdict, NOTE texts, worktree state, and probe state.**
