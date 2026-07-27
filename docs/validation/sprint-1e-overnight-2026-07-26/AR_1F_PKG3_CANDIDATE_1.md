# Architecture Review — Sprint 1F, PKG-3, Candidate 1 (`candidate-1f-pkg3-1`)

**Reviewer:** Independent Architecture Reviewer · fresh session, no involvement in
PKG-3 planning, implementation, npm remediation, Linux validation, negative
controls, freeze, or ICR
**Worktree:** `C:\Users\evanj\Documents\Projects\savrio-review-pkg3-ar` (detached checkout; no branch created)
**Date:** 2026-07-27

> **Preservation note — written by the Main Coordinator, not by the reviewer.**
>
> Everything below this note is the **complete Architecture Review as returned by
> the reviewer**, preserved verbatim. The reviewer wrote no file to disk;
> preservation is the Main Coordinator's duty. Custody before preservation was the
> reviewer transcript only.
>
> **This document is single-author reviewer material.** Coordinator reconciliation
> lives separately in
> [`RECONCILIATION_1F_PKG3_CANDIDATE_1.md`](./RECONCILIATION_1F_PKG3_CANDIDATE_1.md).
>
> **Two transmission facts, disclosed rather than hidden.** The review reached the
> Coordinator in three transmissions. The first two carried only §15 and §16 and
> were corrupted by dropped characters; the third carried the complete text and is
> what appears below. Where the reviewer's original used box-drawing tables, the
> content is preserved unaltered inside fenced blocks so Markdown cannot mangle it.
> No wording was changed, reordered, summarized, or omitted.
>
> **The companion gate is not preserved as reviewer-authored text.** The PKG-3
> Independent Code Review was never supplied to the Main Coordinator in any form
> and exists nowhere on disk. The reviewer below discloses the same fact in §7 and
> states plainly that it did not defer to the ICR's severities. What is on record
> of the ICR is relayed findings only, preserved in
> [`ICR_1F_PKG3_CANDIDATE_1_RELAYED.md`](./ICR_1F_PKG3_CANDIDATE_1_RELAYED.md).

---

ARCHITECTURE REVIEW — SPRINT 1F PKG-3

Reviewer: Independent Architecture Reviewer (fresh; no involvement in PKG-3 planning, implementation, npm remediation, Linux validation, negative controls, freeze, or ICR)
Candidate: candidate-1f-pkg3-1
Worktree: C:\Users\evanj\Documents\Projects\savrio-review-pkg3-ar (created as detached checkout; no branch created)
Date: 2026-07-27

---
## 1. Candidate Identity Verification

```
┌──────────────────────┬──────────────────────────────────────────┬───────────────────────────────────────────────┬────────┐
│       Property       │                 Required                 │                   Observed                    │ Result │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────┼────────┤
│ Annotated tag object │ 30e0c057d2092719c4c91d8a2456cefbf676bbaf │ 30e0c057d2092719c4c91d8a2456cefbf676bbaf      │ ✅     │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────┼────────┤
│ Tag type             │ annotated tag                            │ tag                                           │ ✅     │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────┼────────┤
│ Peeled commit        │ b7386f0521f296a5411e77e15d4dd385eb65691d │ b7386f0521f296a5411e77e15d4dd385eb65691d      │ ✅     │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────┼────────┤
│ Parent               │ 5dd80ed64f847756e49065de1f151155808ac6a6 │ 5dd80ed64f847756e49065de1f151155808ac6a6      │ ✅     │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────┼────────┤
│ Tree                 │ ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5 │ ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5      │ ✅     │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────┼────────┤
│ Baseline             │ 5c1fd6590160dd9bf41212868ed946bb9fb12123 │ resolves; sprint-1f-pkg2-approved → 5c1fd659… │ ✅     │
└──────────────────────┴──────────────────────────────────────────┴───────────────────────────────────────────────┴────────┘
```

Commands and output:

```
$ git rev-parse candidate-1f-pkg3-1              -> 30e0c057d2092719c4c91d8a2456cefbf676bbaf
$ git cat-file -t candidate-1f-pkg3-1            -> tag
$ git rev-parse candidate-1f-pkg3-1^{commit}     -> b7386f0521f296a5411e77e15d4dd385eb65691d
$ git rev-parse candidate-1f-pkg3-1^{commit}^    -> 5dd80ed64f847756e49065de1f151155808ac6a6
$ git rev-parse candidate-1f-pkg3-1^{tree}       -> ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5
$ git rev-parse sprint-1f-pkg2-approved^{commit} -> 5c1fd6590160dd9bf41212868ed946bb9fb12123
```

All six identity values match. No mismatch. Review proceeds.

---
## 2. Exact Changed Paths and Diffstat

```
$ git diff --name-status 5c1fd6590160dd9bf41212868ed946bb9fb12123 HEAD
A       .github/workflows/frontend-tests.yml

$ git diff --stat 5c1fd6590160dd9bf41212868ed946bb9fb12123 HEAD
 .github/workflows/frontend-tests.yml | 299 +++++++++++++++++++++++++++++++++++
 1 file changed, 299 insertions(+)

$ git diff --check 5c1fd659... HEAD    -> (no output; clean)
```

Exactly one file, addition-only, +299/−0. Matches the authorized scope precisely. No source, test, dependency, configuration, lockfile, manifest, or documentation file is touched. Scope discipline is exact.

---
## 3. Local Validation Results

Executed in the detached review worktree at b7386f0.

```
┌────────────────────────────────────────────────┬─────────┬────────────────────────────────────────────────────────────────────────────────────────────────┐
│                    Command                     │ Result  │                                            Observed                                            │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ git status --porcelain --untracked-files=all   │ ✅      │ empty                                                                                          │
│ (initial)                                      │         │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npm ci                                         │ ✅ exit │ added 734 packages, and audited 735 packages; 42 vulnerabilities (1 low, 21 moderate, 19 high, │
│                                                │  0      │  1 critical); 4 install scripts not run (see Finding N-1)                                      │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npx tsc --noEmit                               │ ✅ exit │ no output                                                                                      │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npx eslint .                                   │ ✅ exit │ no output                                                                                      │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npx vitest run --project node                  │ ✅ exit │ 22 files, 326 tests passed                                                                     │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npx vitest run --project dom                   │ ✅ exit │ 1 file, 3 tests passed                                                                         │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npm test                                       │ ✅ exit │ 23 files, 329 tests passed                                                                     │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npx next build                                 │ ✅ exit │ Compiled successfully                                                                          │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ npx playwright test (CI=true)                  │ ✅ exit │ 1 passed (25.1s), genuine build+start lifecycle                                                │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ actionlint                                     │ ✅ exit │ no findings (actionlint 1.7.7, the exact version lint.yml pins)                                │
│ .github/workflows/frontend-tests.yml           │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ actionlint (all workflows)                     │ ✅ exit │ no findings                                                                                    │
│                                                │  0      │                                                                                                │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ git diff --check                               │ ✅      │ clean                                                                                          │
├────────────────────────────────────────────────┼─────────┼────────────────────────────────────────────────────────────────────────────────────────────────┤
│ git status --porcelain --untracked-files=all   │ ✅      │ empty                                                                                          │
│ (final)                                        │         │                                                                                                │
└────────────────────────────────────────────────┴─────────┴────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Counts reproduce the CI-recorded counts exactly (326/22, 3/1, 329/23), independently corroborating the freeze record.

Two disclosed limitations of my local run:
- Local Node was v24.18.0, not the CI-pinned Node 22. My local pass therefore validates the harness, not the Node 22 contract; Node 22 behavior is established by the GitHub evidence instead (verified below).
- shellcheck is not on PATH locally, so actionlint did not statically lint the embedded shell scripts. On ubuntu-latest it would. That sub-check is UNVALIDATED locally.

---
## 4. GitHub Actions Evidence Assessment

gh 2.96.0 authenticated as evanjob2005-ux. All required evidence was accessible. Repository: evanjob2005-ux/savrio-dev-hq, visibility PUBLIC, default branch feature/dev-hq-operating-system (not main).

```
┌─────────────┬────────────────┬──────────────┬───────────────────────────────┬────────────┬─────────────────────────────────────────────────────────┐
│     Run     │    Purpose     │    Event     │           Head SHA            │ Conclusion │                   Failure attribution                   │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30231210124 │ Pre-correction │ pull_request │ 5dd80ed6 (= candidate parent) │ failure    │ both jobs at Install dependencies (no pin step present) │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30231657108 │ Clean          │ pull_request │ b7386f05 (= candidate)        │ success    │ —                                                       │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30231820614 │ NC-1           │ pull_request │ a08bccba                      │ failure    │ unit step 10 Vitest node project                        │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30231973986 │ NC-2           │ pull_request │ 06b2daa2                      │ failure    │ unit step 11 Vitest DOM project (step 10 node green)    │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30232109969 │ NC-3           │ pull_request │ e83b0dd2                      │ failure    │ e2e step 9 Playwright smoke test                        │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30232292354 │ NC-4           │ pull_request │ 8aa36761                      │ failure    │ e2e step 10 Playwright smoke test                       │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30232498312 │ NC-5           │ pull_request │ 83729d6b                      │ failure    │ unit step 13 Build application and e2e step 9           │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30232646900 │ NC-6A          │ pull_request │ 79f1d5df                      │ failure    │ unit step 7 Verify harness preconditions                │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30232803068 │ NC-6B          │ pull_request │ 7d900957                      │ failure    │ e2e step 9 Playwright smoke test                        │
├─────────────┼────────────────┼──────────────┼───────────────────────────────┼────────────┼─────────────────────────────────────────────────────────┤
│ 30232882905 │ Final green    │ pull_request │ 192673da                      │ success    │ —                                                       │
└─────────────┴────────────────┴──────────────┴───────────────────────────────┴────────────┴─────────────────────────────────────────────────────────┘
```

Confirmed items:

- Event type: every run is pull_request (draft PR #2). No push or workflow_dispatch run of this workflow exists. → the push and dispatch trigger paths are UNVALIDATED by execution.
- Merge-ref semantics: clean run checked out refs/remotes/pull/2/merge = a216f1e, logged as Merge b7386f05… into d5e50e5e….
- Tree equality — independently verified:

```
git rev-parse a216f1ea…^{tree} -> ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5   (merge ref)
git rev-parse b7386f05…^{tree} -> ca9cdc7e…   git rev-parse 192673da…^{tree} -> ca9cdc7e…
git merge-base --is-ancestor d5e50e5e… b7386f05…  -> YES
```

- Because the integration tip is an ancestor of the candidate, the merge ref's tree is byte-identical to the frozen candidate tree. The merge-ref validation genuinely exercised the candidate. This is the strongest single result in the evidence set.
- Node/npm: node v22.23.1, npm 11.16.0 (clean run log).
- npm ci: added 734 packages, and audited 735 packages in 24s.
- Test counts: 22, 1, 23 files — matching my local reproduction.
- Build: ✓ Compiled successfully in 5.6s.
- Chromium: Chrome for Testing 149.0.7827.55 (playwright chromium v1228) downloaded fresh, plus FFmpeg and headless shell. No cache.
- Playwright: Running 1 test using 1 worker → 1 passed (16.4s).
- Artifacts: clean run 0; final green 0; NC-3 1 (playwright-test-results-30232109969-1, 137,869 bytes, expires 2026-08-03 = exactly 7 days). Downloaded and inspected: contains error-context.md and trace.zip.
- Step-level unconditionality: in the clean run all enforcement steps report success; only Upload Playwright failure artifacts is skipped (correct under if: failure()).
- Green restoration: the workflow has 16 runs (8 success / 8 failure), consistent with a green restoration run after each control.

Material findings from the evidence sweep:

- No branch protection, no rulesets — verified directly:

```
gh api …/branches/feature%2Fdev-hq-operating-system/protection -> 404 "Branch not protected"
gh api …/rulesets                                              -> []
```

- pr.yml ran 17 times, every one a failure, on branch validation/1f-pkg3-ci-npm11 — i.e. on PRs not targeting main. Root cause: step Validate changed structured and Markdown files → ##[error]Unbalanced Markdown code fences (```). across a 118-file changed set. This is pre-existing and not caused by the candidate: the check parses YAML with PyYAML (the candidate file parses cleanly, verified locally) and only fence-checks Markdown; the candidate adds no Markdown.
- No run in the repository has conclusion cancelled → concurrency cancellation was never exercised.

UNVALIDATED (explicitly): push trigger execution; workflow_dispatch execution; concurrency cancellation; non-Linux runners; browsers other than Chromium; npm versions other than 11.16.0; whether ci.yml, lint.yml, security.yml, dependencies.yml, release.yml pass (never executed — zero runs).

---
## 5. Negative-Control Assessment

```
┌────────────────────────┬────────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│        Control         │ Classification │                                                      Basis                                                       │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-1 Node failure      │ PROVEN         │ Unit red at step 10 Vitest node project; downstream steps skipped; e2e unaffected.                               │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-2 DOM failure       │ PROVEN         │ Unit red at step 11 Vitest DOM project with step 10 node green — proves project isolation, not just "a test      │
│                        │                │ failed".                                                                                                         │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-3 Playwright        │ PROVEN         │ E2E red at step 9; artifact 137,869 B containing error-context.md + trace.zip; 7-day retention confirmed by      │
│ assertion + artifact   │                │ expires_at. Artifact downloaded and contents verified by me.                                                     │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-4 decoy-server      │                │ Decoy verified serving exactly <h1>Savrio Dev HQ</h1> on 127.0.0.1:3100; Playwright emitted Error:               │
│ rejection              │ PROVEN         │ http://127.0.0.1:3100 is already used, make sure that nothing is running on the port/url or set                  │
│                        │                │ reuseExistingServer:true. This is the precise closure of the candidate-1 false positive.                         │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-5A unit-build       │ PROVEN         │ Unit red at step 13 Build application after steps 8–12 (tsc, eslint, all three Vitest steps) passed — proves the │
│ failure                │                │  build is a distinct, reachable gate.                                                                            │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-5B Playwright       │                │ [WebServer] Error: NC-5 deliberate prerender failure → Export encountered an error on /page: /, exiting the      │
│ webServer-build        │ PROVEN         │ build → Error: Process from config.webServer was not able to start. Exit code: 1. Proves the genuine             │
│ failure                │                │ build-and-start lifecycle, not a reused server.                                                                  │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-6A missing Vitest   │ PROVEN         │ Unit red at step 7 Verify harness preconditions; ##[error]Required test harness file is missing.; grep -c -i     │
│ config                 │                │ skipping = 0 across the entire job log — the fail-closed claim is literally verified.                            │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-6B zero Playwright  │ PROVEN         │ Preconditions passed, then Error: No tests found — Playwright itself failed closed.                              │
│ collection             │                │                                                                                                                  │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ NC-7 repository        │ PARTIALLY      │ The pass path is proven on green runs and on red runs that wrote traces. The detection path was never exercised: │
│ hygiene                │ PROVEN         │  no control ever dirtied the tracked tree or produced an unexpected untracked file. In NC-6A the config deletion │
│                        │                │  was committed, so the tree was clean. The hygiene gate's ability to actually fail is therefore untested.        │
├────────────────────────┼────────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ Concurrency            │ NOT PROVEN     │ No run in the repository has conclusion cancelled.                                                               │
│ cancellation           │                │                                                                                                                  │
└────────────────────────┴────────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

The negative-control programme is, with those two exceptions, unusually rigorous — every control names the exact step it reddened, and each was reverted with a verified green restoration.

---
## 6. Architecture Assessment by Inspection Area

1. CI architecture / long-term ownership — Sound. Two independent jobs, no cross-job chaining, clear ownership boundary. Rationale is documented inline at an unusually high standard.
2. Separate frontend-tests.yml boundary — correct. Decisive evidence: ci.yml's application-validation job is built entirely from skip guards (if: steps.detect.outputs.node == 'true', if npm run | grep -qE '^  lint$' … else echo "Skipping"). Folding frontend enforcement into that job would inherit exactly the "green because it skipped" failure mode PKG-3 exists to eliminate. A separate file is the right boundary.
3. Duplication with existing CI — acceptable. ci.yml never runs (gated on a non-existent remote main) and would fail at npm ci anyway (no npm pin). The duplication is nominal, not actual.
4. Coverage of the active integration branch — yes, and better than assumed. feature/dev-hq-operating-system is the repository's default branch, and the workflow triggers on push and PR to it. Note main does not exist on the remote, so the main triggers are currently inert.
5. Trigger design — Correct and complete for its purpose. workflow_dispatch is properly justified for Linux validation of scratch branches.
6. Merge-ref vs direct-push semantics — Correctly handled and, uniquely here, provably equivalent: the merge tree equalled the candidate tree because the base was an ancestor. That will not hold in general; future PRs will validate a merge result that differs from the head. This is the correct semantic (it tests what will land) but should be understood, not assumed away.
7. Branch-protection / required-check governance — Absent. See §7.
8. "CI enforcement" as a description — Currently overstated. See answer B.
9. Node/npm toolchain contract — Node 22 + npm 11.16.0 in CI; nothing declares either in the repository. See Finding N-5.
10. npm 11.16.0 placement — CI-only today; must eventually be declared in package.json. See answers D/E.
11. Install determinism — npm ci against the committed lockfile under the npm major that produced it. Correct. Weakened by Findings N-1 and N-2.
12. npm cache safety — Safe. Keyed on the lockfile by setup-node, and npm ci re-validates against that lockfile, so a stale cache cannot survive into an install. The inline comment states this accurately.
13. No .next / browser caches — Deliberate and correct for a foundation gate. Fresh Chromium per run means the browser always matches the locked Playwright version. Costs ~20s; buys determinism. Justified.
14. Vitest project enforcement — Both projects run explicitly and independently; NC-2 proves isolation.
15. Aggregate test duplication — Justified; see answer I.
16. Next.js build duplication — Two builds per run (unit job + e2e webServer). Justified today; see answer J.
17. Playwright lifecycle ownership — Correctly owned by the committed playwright.config.ts, invoked unchanged. reuseExistingServer: false is the load-bearing property, proven by NC-4.
18. Port ownership / collision — Port 3100 via E2E_PORT; collisions fail closed rather than silently reuse (NC-4). Correct behavior. On a hosted runner collisions are near-impossible; the guarantee matters for local/self-hosted use.
19. Failure artifact strategy — Right principle (diagnostics are for red runs). Two refinements in MINOR-1 disposition.
20. Hygiene strategy — Right idea, but its authority rests on an untested failure path (NC-7) and a very broad .gitignore (*.zip, *.log, *.key, *.pem, tmp/, temp/, .cache/, local/, docs/generated/). See Finding N-4 and answer U.
21. Permissions / public-repo safety — contents: read only, no secrets, pull_request (never pull_request_target). Correct least-privilege. See answer R.
22. Action pinning — Excellent. I independently verified all three SHAs resolve to their claimed tags via the GitHub API: checkout 3d3c42e5…=v7.0.1, setup-node 82076278…=v7.0.0, upload-artifact 043fb46d…=v7.0.1. No drift, no lie in the comments.
23. Shell portability — defaults.run.shell: bash at both jobs; set -euo pipefail in every multi-line script; [[ ]] used consistently with bash declared. Consistent and correct.
24. Linux portability — ubuntu-latest only, with --with-deps handling OS packages. Appropriate.
25. Timeout design — 15 min unit / 30 min e2e against observed ~1 min / ~1 min. Generous headroom without being unbounded. Sound.
26. Concurrency / cancellation — Per-ref grouping is correct for PRs and pushes; one collision case (Finding N-6) and no execution proof (NC).
27. Hidden coupling — Coupled to: branch names main and feature/dev-hq-operating-system; files vitest.config.ts, playwright.config.ts, test/setup-dom.ts, e2e/smoke.spec.ts; binaries tsc, eslint, vitest, next, playwright; port 3100 (indirectly, via config); NEXT_TELEMETRY_DISABLED. The e2e/smoke.spec.ts coupling is the brittle one (Finding N-3).
28. Maintainability as tests are added — Good. No hardcoded counts anywhere (verified), so new tests never turn a correct merge red. This is the single most important maintainability decision in the file and it was made correctly.
29. Future authenticated / multi-page E2E — Not blocked, but not prepared: no secrets plumbing, no storage-state step, no per-project matrix. Additive when needed.
30. Compatibility with Mission Control / Track B — Compatible. The workflow enforces the harness generically; Track B work will be covered automatically as tests land, without workflow edits.
31. One-file scope — architecturally correct. See answer Y.
32. Safe as the approved PKG-3 foundation — Yes, with the governance action in §13.

---
## 7. Explicit Disposition of the ICR MAJOR

▎ Procedural disclosure: The complete PKG-3 ICR report was not supplied inline and is not preserved in the repository (docs/validation/ contains PKG-2 artifacts only; no PKG-3 ICR file exists on any branch I can see). I therefore assessed the ICR findings solely from the summaries relayed in my instructions, independently and from primary evidence. The ICR report text itself is UNVALIDATED. I did not defer to its severities.

MAJOR-1 — no branch protection, no rulesets, no required status checks; a failing run blocks nothing.

Independently confirmed (404 Branch not protected; rulesets -> []).

Disposition: an architecture and governance defect outside the candidate. NOT a candidate defect. NOT blocking. NOT remediation-required. Acceptable only with a mandatory post-integration repository-settings action.

Reasoning:

1. It is not fixable inside the candidate. Branch protection is repository state, not repository content. No change to frontend-tests.yml — or to any file — can create a required status check. Demanding candidate remediation would demand the impossible.
2. The ordering is forced by GitHub. A status check can only be marked required once GitHub has observed a check run of that name. The check must therefore exist and report before it can be required. Branch protection necessarily follows integration.
3. The finding is nonetheless real and must not be absorbed silently. Until required checks exist, this workflow is detection, not enforcement. Approving it while describing it as enforcement would let the organization believe it has a gate it does not have — precisely the "manufactured confidence" the workflow's own header comment argues against.
4. Favorable fact discovered during review: the repository's default branch is already feature/dev-hq-operating-system. The check will surface on the default branch on the very first post-integration run, so the settings action is available immediately, not blocked on creating main.

I concur with the ICR that this does not require candidate remediation — but I attach a mandatory, tracked post-approval governance action (§13), which I treat as a condition of approval rather than a suggestion.

---
## 8. Explicit Disposition of Every ICR MINOR

MINOR-1 — if-no-files-found: ignore can yield a green upload step with no artifact and no warning.
Valid, and I upgraded it from theoretical to empirically demonstrated. I checked artifact counts across every control: NC-4 (30232292354), NC-5B (30232498312) and NC-6B (30232803068) all failed the E2E job — so if: failure() fired the upload step — and all three produced 0 artifacts with the upload step reporting success and no warning. Three real occurrences, not a hypothesis.
Disposition: acceptable follow-up; not blocking, not remediation-required. The step's silence never converts a red run to green — the job was already red and correctly attributed. It is a diagnostics-quality defect. warn is the better setting (see answer N).

MINOR-2 — if: always() on hygiene means cancelled runs continue through hygiene.
Valid but very low impact. always() is true on cancellation, so a cancelled run still executes a ~1-second git check. It cannot produce a wrong verdict; it slightly delays cancellation and mildly contradicts the intent of cancel-in-progress: true.
Disposition: acceptable follow-up. !cancelled() is strictly more correct (answer O).

MINOR-3 — E2E preconditions check playwright but not next, though webServer invokes Next.js.
Valid as an observation; I assess the risk lower than "MINOR" implies. The webServer command is npm run build && npx next start. If next were absent, npm run build fails closed (non-zero → webServer fails → job red, as NC-5B's shape demonstrates). The npx next start registry-fallback hazard is unreachable, because it only runs after a build that already required next. So this cannot produce a false green; it degrades failure diagnosis only.
Disposition: architecturally insignificant as a correctness matter; acceptable follow-up for diagnostic symmetry. Downgraded to NOTE in my register.

MINOR-4 — concurrency cancellation not directly exercised.
Valid and confirmed (no cancelled conclusion exists in the repository).
Disposition: acceptable follow-up; not blocking. Cancellation is GitHub-platform behavior driven by a four-line declarative block that actionlint validates; the risk of it being wrong is low, and the failure mode (a superseded run keeps running) wastes minutes rather than corrupting a verdict. It should not gate approval, but the evidence record must not claim it was proven — it was not (see answer Q).

MINOR-5 — the tag annotation claims all six prior workflows trigger only on main/PRs to main, but pr.yml triggers on PRs to any branch and ran during validation.
Valid, and materially worse than stated. I confirmed both halves: pr.yml's on: pull_request: block declares types: with no branches: filter, and pr.yml actually ran 17 times during this validation campaign, failing every time.
Disposition: documentation correction only — mandatory, and it must be recorded. It does not require re-freeze or tag replacement (see answer V). But under AGENTS.md this is an inaccurate factual claim inside a frozen governance artifact, and the reconciliation record must carry an explicit correction rather than let the annotation stand as the record.

---
## 9. Answers to Questions A–Z

A. Is branch protection part of PKG-3's acceptance, or must it follow integration?
It must follow integration. A status check cannot be marked required until GitHub has observed it reporting. Making it an acceptance criterion would make PKG-3 unacceptable by construction. It belongs in acceptance as a mandatory immediate successor action, which is how I have dispositioned it.

B. Can the candidate honestly be called CI enforcement before required checks exist?
No. Today it is automated detection with authoritative, correctly-attributed failure signal — genuinely valuable and rigorously proven — but it blocks nothing. "Enforcement" becomes accurate only once both jobs are required checks. The workflow's own header uses "CI enforcement"; I recommend the reconciliation record describe it as "detection now, enforcement upon the §13 settings action." This is a wording correction, not a defect.

C. Should the lack of required checks change the verdict, or create a mandatory post-approval action?
Mandatory post-approval governance action. Remediation-required would be incoherent: there is nothing in the candidate to remediate, and rejecting it would leave the repository with neither detection nor enforcement — strictly worse. Approve the detection layer; bind the enforcement layer as a tracked obligation.

D. Is the exact npm pin a sound interim architecture?
Yes, as an interim measure, and it is honestly labelled. Running npm ci under the npm major that generated the lockfile is correct practice, and the inline comment explicitly states it is a pin and not a repair, and that the workflow will therefore not detect that npm 10 cannot install the project. That disclosure is exactly right. Two qualifications: the pinned version is never asserted (Finding N-2), and the pin silently changes install-script behavior (Finding N-1).

E. Should package.json eventually declare packageManager and engines?
Yes — and this should be a named deliverable of the lockfile-hygiene package. Today the toolchain contract exists only inside a CI file. engines: { node: ">=22" } plus packageManager: "npm@11.16.0" (with Corepack) would make the contract a repository property that developers and every future workflow inherit, instead of knowledge that lives in one YAML file.

F. Does installing npm globally create unacceptable drift from developer environments?
It creates real drift, but it reduces net drift, and I found a concrete second-order effect. Before the pin, CI (npm 10.9.4) could not install the project at all while developers on npm 11 could — maximal drift. The pin aligns them. However, my evidence shows npm 11.16.0 activates the new install-script consent gate: npm ci did not run the install scripts for esbuild@0.23.1, sharp@0.34.5, unrs-resolver@1.12.2, @depot/cli — identically in CI and locally. A developer still on npm 10 would run them. So the pin trades a total-failure drift for a subtle behavioral drift. Currently harmless (those packages ship prebuilt platform binaries via optionalDependencies; the full build and E2E pass), but it is unmanaged. Answer: acceptable, conditional on Findings N-1/N-5 being tracked.

G. Does the workflow fail closed if npm installation fails?
Partially. If npm install --global npm@11.16.0 exits non-zero, the step fails and the job stops — fail-closed, correct. If it succeeds but yields an unexpected version, nothing catches it: Record toolchain versions merely echos the version, it does not assert it. The workflow would proceed under the wrong npm and could then fail confusingly at npm ci, or pass under an untested toolchain. Finding N-2; recommended fix is a three-line assertion.

H. Are the preconditions an appropriate boundary, or overfitted to current file names?
Mostly appropriate; one element is overfitted. Asserting harness configs (vitest.config.ts, playwright.config.ts, test/setup-dom.ts) and local binary resolution is the right boundary — the npx registry-fallback rationale is genuinely insightful and correctly prevents CI passing against software that is not in the lockfile. But asserting e2e/smoke.spec.ts, a single concrete test filename, is overfitted and redundant: NC-6B proved Playwright already fails closed on zero collection with Error: No tests found. The precondition adds no safety and guarantees a red build the day the smoke spec is renamed or split. Finding N-3.

I. Is duplicating Node and DOM tests through npm test justified?
Yes. It costs ~4 seconds and buys proof that the single documented entry point still resolves and still collects both projects. Without it, npm test could silently degrade to collecting one project while the two explicit steps stayed green — a realistic regression given Vitest 4's removal of vitest.workspace.ts. The cost/benefit is strongly favorable at this scale.

J. Is duplicate Next.js build execution justified?
Yes, currently. The unit-job build and the e2e webServer build test different things: the former is a standalone build gate with clean attribution (NC-5A: red at Build application after all tests passed), the latter is the real serving lifecycle (NC-5B). NC-5 proves they fail independently and distinguishably — that is the justification, and it is empirical rather than asserted. At observed cost (~6s each) this is cheap. Revisit if build time grows materially.

K. Is build-after-tests ordering too coupled to the Vitest exclusion weakness?
The coupling is real but currently inert, and I verified this rather than assuming it. Neither Vitest project excludes .next/ (node excludes only node_modules, dist, e2e; dom declares no exclude and Vitest's defaults don't cover .next). After a real build I ran:

```
find .next -name "*.test.ts" -o -name "*.test.tsx"  -> 0 files
npx vitest list --project node | grep -c "\.next"    -> 0
```

So today nothing is collected from .next. The step ordering is a defensive precaution against a latent risk, not a workaround for an active bug. It is fragile in one specific way: it is an undocumented ordering constraint that a future editor could break by inserting a Vitest step after the build. Acceptable now; fix the exclusion rather than rely on ordering.

L. Should the deferred Vitest exclusion fixes become prerequisites before future CI expansion?
Yes — before expansion, not before this integration. The moment additional Vitest invocations, a coverage step, or job reordering enters this workflow, the implicit ordering contract becomes a live hazard. Adding .next/** (and coverage/**, playwright-report/**, test-results/**) to both projects' excludes is small, additive, and removes the constraint entirely. Recommend it be a stated prerequisite in the PKG-2 follow-up register for any subsequent CI package.

M. Is failure-only artifact handling sufficient for failures before test-results exists?
Sufficient for verdict correctness; insufficient for diagnosis. Proven three times (NC-4, NC-5B, NC-6B): the E2E job went red, was correctly attributed at the step level, and produced no artifact. Nothing was lost that mattered, because the job log carried the full failure (is already used, webServer was not able to start, No tests found). The artifact is a supplement, not the primary record. Sufficient.

N. Should if-no-files-found be warn rather than ignore?
Yes — warn. With if: failure() the step only ever runs on a genuine E2E failure, so "no files" is always informative: either the failure preceded test execution (expected) or Playwright failed to write diagnostics it should have (unexpected, and currently invisible). warn surfaces the distinction at zero cost and cannot fail the build. Recommend as a follow-up, not remediation.

O. Should hygiene use !cancelled() instead of always()?
Yes. always() includes the cancelled state, which is the one state where continuing is pointless — the run is being abandoned, and cleanliness of an abandoned run carries no information. !cancelled() preserves the valuable property (hygiene runs after failure) while honoring cancellation promptly. Trivial impact; correct change.

P. Is the concurrency key correct for PRs, pushes, and manual dispatch?
Correct for PRs and pushes; one collision case for dispatch. github.ref is refs/pull/N/merge per PR and refs/heads/<branch> per push — both correctly isolated. But a workflow_dispatch on branch X and a push to branch X share refs/heads/X, hence the same group, and with cancel-in-progress: true each will cancel the other. Since dispatch exists specifically to validate scratch branches, an unlucky push could kill a deliberate validation run. Adding ${{ github.event_name }} to the key separates them. Finding N-6. Separately, ${{ github.workflow }} is redundant beside the literal frontend-tests- prefix (cosmetic).

Q. Does the lack of a direct cancellation negative control matter for approval?
No. It is four lines of declarative platform configuration validated by actionlint, and its worst failure mode wastes runner minutes rather than producing a wrong verdict. It should not gate approval. It does matter for the honesty of the evidence record: cancellation must be recorded as NOT PROVEN, not folded into the green result.

R. Is public pull_request execution safe with contents: read and no secrets?
Yes. I confirmed the repository is PUBLIC, making this a real question rather than a theoretical one. The design is correct on every axis that matters: pull_request (never pull_request_target), so fork PRs run with a read-only token, no repository secrets, and no write access to the base repo; top-level permissions: contents: read; no github.event.* interpolation into shell (no script-injection surface — github.run_id/run_attempt are the only expressions in a run-adjacent field, and they are numeric and in a with:, not a shell body). Fork code does execute on the runner (build, tests, browser) — inherent to any PR-building CI, and mitigated by GitHub's default first-time-contributor approval gate. The npm 11 install-script gate incidentally reduces this surface further. Safe.

S. Are full-SHA action pins sufficient?
Yes, and they are honest — I verified them rather than trusting the comments. All three resolve to their claimed tags (checkout 3d3c42e5…=v7.0.1, setup-node 82076278…=v7.0.0, upload-artifact 043fb46d…=v7.0.1). Full-SHA pinning is the strongest practical posture short of vendoring; it defeats tag-move attacks. Residual risk (transitive actions, runner image contents) is unavoidable. Sufficient. Dependabot on github-actions would keep pins fresh — a repository-level suggestion, not a candidate matter.

T. Does playwright install --with-deps introduce acceptable OS-package nondeterminism?
Yes, acceptable. --with-deps runs apt-get install against Ubuntu archives, so the OS-library set is not pinned and can drift (the NC-4 log shows the apt transaction, mostly already the newest version on the hosted image). The browser itself is deterministic — bound to the locked Playwright version (Chrome for Testing 149.0.7827.55, chromium v1228). The alternative — pinning apt packages — is high-maintenance and brittle for negligible gain, since ubuntu-latest already drifts underneath. Correct trade.

U. Does the hygiene check provide enough protection given broad ignored paths?
Adequate for its stated purpose, but weaker than it appears, and its authority is partly untested. git status --untracked-files=all honors .gitignore, and this .gitignore is broad: *.zip, *.log, *.key, *.pem, *.tmp, *.bak, tmp/, temp/, .cache/, local/, docs/generated/. A stray trace.zip written outside test-results/, or any generated .log, would be invisible to the gate. Combined with NC-7 being only PARTIALLY PROVEN (the failure path was never exercised), the hygiene step's real detection power is asserted more than demonstrated. It still delivers its core value — proving generated output is correctly ignored — which is what PKG-3 needed. Finding N-4; recommend a future positive control that deliberately dirties the tree.

V. Does the inaccurate tag-annotation claim require re-freeze, tag replacement, reconciliation correction, or only a note?
Reconciliation correction — mandatory. Not re-freeze, not tag replacement. The inaccuracy concerns context about other workflows, not the candidate's identity, tree, scope, or validated behavior. Every substantive claim in the annotation that bears on the candidate — commit, tree, parent, one-file diff, counts, run IDs, negative-control outcomes — I verified as accurate. Re-freezing would churn the tag, invalidate the ICR's and this review's identity anchors, and correct nothing material. Replacing an annotated tag is also worse governance than leaving an immutable record and correcting it in the reconciliation. However, a bare "note" is insufficient: the claim is factually false and was demonstrably falsified during the very campaign the annotation describes (17 pr.yml runs). The reconciliation record must state the correction explicitly and mark that portion of the annotation superseded.

W. Should the failing pre-existing pr.yml workflow be addressed before PKG-3 integration?
No — but it must be addressed before required checks are configured, and that makes it urgent. It is out of PKG-3's authorized scope, pre-existing, and unrelated to the candidate (it fails on Unbalanced Markdown code fences in a 118-file Markdown set; the candidate adds no Markdown and its YAML parses cleanly under the same PyYAML check). Blocking integration on it would violate scope discipline. But the §13 settings action will require status checks on the default branch, and pr.yml currently runs on every PR and fails every time (17/17). If it were made required — or if a reviewer reads a red PR page as normal — the value of PKG-3's signal is diluted by permanent unrelated red. Sequencing recommendation: configure required checks to name only the two Frontend Tests jobs, and open pr.yml repair as a separate high-priority package before broadening required checks.

X. Should the dependency-vulnerability backlog affect approval?
No. npm ci reports 42 vulnerabilities (1 low, 21 moderate, 19 high, 1 critical) — identical in CI and locally, and entirely pre-existing at the baseline; the candidate changes no dependency, manifest, or lockfile byte. Gating a CI-workflow package on an unrelated dependency backlog would conflate two independent concerns and violate scope discipline. It is genuinely important and belongs to security.yml/dependencies.yml and the lockfile-hygiene package — both of which, note, have never executed, which is itself an argument for landing PKG-3. Route to the follow-up register; do not attach to this verdict.

Y. Is the one-file package architecture correct despite the npm compatibility defect?
Yes — and the discipline shown is exemplary. The implementer discovered a genuine pre-existing lockfile defect mid-package and chose the narrowest honest response: pin the toolchain in CI, document the defect precisely, explicitly disclose that the pin does not repair it and that the workflow will not detect npm 10 incompatibility, and route the repair to its own package. That is textbook AGENTS.md scope discipline ("Discovery does not equal approval") and the opposite of the common failure — silently regenerating a lockfile inside an unrelated package and calling it a fix. Repairing the lockfile here would have made the diff unreviewable and coupled a CI package to a dependency-resolution change. One file was correct.

Z. Is the candidate safe to approve as the CI foundation?
Yes. It is additive-only, cannot alter application behavior, executes nothing on any protected path today, is proven on Linux against a tree byte-identical to the frozen candidate, and — critically — its failure behavior is proven by eight distinct, individually-attributed negative controls rather than assumed. Every finding I raised is either outside the candidate (branch protection, pr.yml, vulnerabilities), a diagnostics-quality refinement (artifacts, hygiene condition), or a tracked interim measure the candidate itself already discloses (npm pin). None can convert a red run to green. The main risk of not approving is leaving the repository with zero executing quality gates, which is strictly worse.

---
## 10. New Findings

### BLOCKER

None.

### MAJOR

None.

### MINOR

N-1 — The npm 11.16.0 pin silently disables install scripts, and nothing surfaces it.
npm ci under the pin does not execute install scripts for @depot/cli, esbuild@0.23.1, sharp@0.34.5, unrs-resolver@1.12.2; it emits only npm warn allow-scripts (identical in CI log 02:14:06 and my local run). A developer on npm 10 would run them, so the pin swaps one form of toolchain drift for another. Inert today (these ship prebuilt platform binaries via optionalDependencies; the full build and E2E pass), but unmanaged: a future dependency that genuinely needs its postinstall would be installed unbuilt, failing far from its cause. Recommend: decide allowScripts policy explicitly in the lockfile-hygiene package.

N-2 — The pinned npm version is echoed but never asserted.
npm install --global npm@11.16.0 fails closed only if it exits non-zero. Record toolchain versions runs echo "npm $(npm --version)" — informational, not an assertion. A successful install resolving to an unexpected version proceeds into npm ci unchecked. Recommend: [[ "$(npm --version)" == "11.16.0" ]] || exit 1. (Answer G.)

N-3 — The e2e/smoke.spec.ts precondition is overfitted and redundant.
Asserting one concrete test filename adds no safety — NC-6B proved Playwright already fails closed on zero collection (Error: No tests found) — while guaranteeing a red build the day the spec is renamed or split. Recommend: drop the filename assertion and rely on the proven zero-collection failure; keep the config and binary assertions. (Answer H.)

N-4 — The hygiene gate's detection path was never exercised.
No control dirtied the tracked tree or created an unexpected untracked file (NC-6A's deletion was committed, so the tree was clean). Combined with a very broad .gitignore (*.zip, *.log, *.key, *.pem, tmp/, .cache/, local/, …), the step's real detection power is asserted more than demonstrated. Drives NC-7 to PARTIALLY PROVEN. Recommend: one positive control that dirties the tree. (Answer U.)

N-5 — The Node/npm toolchain contract exists only inside the workflow.
package.json declares no engines, no packageManager; there is no .nvmrc. Node 22 and npm 11.16.0 are asserted only in CI, so nothing constrains developers or future workflows, and the "interim" pin has no mechanism to become permanent or to be retired deliberately. Recommend: engines + packageManager in the lockfile-hygiene package. (Answer E.)

N-6 — The concurrency key collides push and workflow_dispatch on the same branch.
Both yield github.ref == refs/heads/<branch>, so with cancel-in-progress: true a push cancels an in-flight manual validation run and vice versa — directly counter to the dispatch trigger's stated purpose of validating scratch branches. Recommend: add ${{ github.event_name }} to the group. (Answer P.)

### NOTE

N-7 — Repository is PUBLIC and the default branch is already feature/dev-hq-operating-system, so required status checks can be configured immediately after integration. The push/pull_request triggers on main are currently inert (no origin/main).
N-8 — ${{ github.workflow }} in the concurrency group is redundant beside the literal frontend-tests- prefix. Cosmetic.
N-9 — Each run performs two full next build executions and runs both Vitest projects twice. Justified today (~10s total); revisit if build time grows.
N-10 — ICR MINOR-3 downgraded: the missing next precondition cannot produce a false green, since npm run build fails closed. Diagnostic quality only.
N-11 — The .next/Vitest exclusion risk is currently inert, verified empirically (0 *.test.ts(x) in .next; 0 collected). The step ordering is precautionary, not a live workaround.
N-12 — My local actionlint run had no shellcheck on PATH, so embedded shell scripts were not statically linted locally. lint.yml would cover this on Linux but has never executed. Local shell-lint coverage: UNVALIDATED.

---
## 11. Finding Counts

```
┌──────────┬───────────────────┬───────────────┐
│ Severity │ New (this review) │ ICR (relayed) │
├──────────┼───────────────────┼───────────────┤
│ BLOCKER  │ 0                 │ 0             │
├──────────┼───────────────────┼───────────────┤
│ MAJOR    │ 0                 │ 1             │
├──────────┼───────────────────┼───────────────┤
│ MINOR    │ 6                 │ 5             │
├──────────┼───────────────────┼───────────────┤
│ NOTE     │ 6                 │ 13            │
└──────────┴───────────────────┴───────────────┘
```

All 6 relayed ICR findings (1 MAJOR + 5 MINOR) were independently assessed; all were confirmed as factually valid, with MINOR-1 upgraded to empirically demonstrated and MINOR-3 downgraded in severity.

---
## 12. Is Candidate Remediation Required?

No.

No finding — mine or the ICR's — can cause a failing condition to report green. The candidate is additive-only, correctly scoped to one file, proven on Linux against a byte-identical tree, and proven to fail closed across eight distinct negative controls. Every remaining finding is either outside the candidate's authority (branch protection, pr.yml, vulnerabilities), a diagnostics refinement (warn, !cancelled()), or a tracked interim measure the candidate itself explicitly discloses (the npm pin).

Findings N-1 through N-6 should be entered in the Sprint 1F follow-up register and folded into the lockfile-hygiene package (N-1, N-2, N-5) and a small CI-hardening follow-up (N-3, N-4, N-6, plus ICR MINOR-1/MINOR-2).

---
## 13. Is a Mandatory Post-Approval Repository-Settings Action Required?

Yes. I treat this as a condition of approval, not a suggestion.

Until it is done, this workflow detects but does not enforce, and describing it otherwise would overstate the repository's actual protection.

Required action, in order, immediately after integration:

1. Merge/integrate the candidate onto feature/dev-hq-operating-system (the default branch) so both jobs execute and register their check names.
2. Confirm the check names as GitHub observes them: Unit and Static Validation and End-to-End Smoke.
3. Create a ruleset (or branch protection) on feature/dev-hq-operating-system requiring exactly those two checks, with "require branches to be up to date" enabled.
4. Do not add Validate Pull Request (pr.yml) to required checks — it fails 17/17 for a pre-existing Markdown-fence reason and would permanently block all merges.
5. Verify by opening a throwaway PR and confirming merge is blocked while checks are pending/red.
6. Open the follow-up packages: pr.yml repair (high priority — it currently reds every PR); lockfile hygiene (absorbing N-1, N-2, N-5); CI hardening (N-3, N-4, N-6, ICR MINOR-1/2); dependency-vulnerability backlog.

---
## 14. Final Verdict

**APPROVE WITH FINDINGS**

Conditional on the mandatory post-approval repository-settings action in §13 being tracked as an obligation, and on the ICR MINOR-5 tag-annotation correction being recorded in the reconciliation.

---
## 15. Recommendation to the Main Coordinator and Founder

Approve candidate-1f-pkg3-1 as the Sprint 1F PKG-3 foundation and integrate it.

This is the strongest-evidenced candidate I have reviewed in this program. Three things distinguish it:

- Its failure behavior is proven, not assumed. Eight negative controls, each reddening a named step, each reverted with a verified green restoration. NC-4 and NC-5B in particular close the exact false-positive class that failed candidate-1f-pkg2-1 — a decoy server on the right port was refused, and a broken build failed the webServer lifecycle rather than silently serving something else.
- Its Linux validation genuinely tested the frozen artifact. I verified independently that the PR merge ref's tree (ca9cdc7e…) is byte-identical to the candidate tree, because the integration tip is an ancestor of the candidate. Merge-ref evidence is often hand-waved; here it is exact.
- It refuses to manufacture confidence. Every enforcement step is unconditional, preconditions fail closed (NC-6A: zero occurrences of "Skipping" in the entire job log), no test counts are hardcoded, and the one compromise it makes — the npm pin — is disclosed in the file itself as a pin that does not repair the underlying defect. Contrast ci.yml's existing application-validation job, which is built almost entirely from skip guards and has never run.

Two things must be recorded honestly alongside the approval:

1. This is detection today, not enforcement. Nothing is blocked until §13 is executed. Please do not close Sprint 1F PKG-3 as "CI enforced" until required checks exist; the gap is small in effort and large in meaning.
2. The tag annotation contains one false claim. It states all six prior workflows trigger only on main/PRs to main; pr.yml has no branches: filter and ran 17 times — failing every time — during this very campaign. Do not re-freeze or replace the tag; do correct it explicitly in the reconciliation record and mark that passage superseded.

Sequencing I recommend: integrate → configure required checks naming only the two Frontend Tests jobs → repair pr.yml as the next package (it currently reds every PR and will otherwise erode trust in the new signal) → then lockfile hygiene, which should also decide the fate of the npm pin and add engines/packageManager.

The largest risk in this decision is not approving. The repository currently has seven workflows and, before this one, zero that have ever executed against the application. PKG-3 changes that with a single reviewable file.

---
## 16. Non-Destructive Constraints — Confirmation

- Candidate unchanged. Final git rev-parse HEAD = b7386f0521f296a5411e77e15d4dd385eb65691d; tree = ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5. No tracked file was edited at any point; no commit was created.
- Tags unmoved. Re-verified after review: candidate-1f-pkg3-1 → 30e0c057… → commit b7386f05…; sprint-1f-pkg2-approved → d672fbf4… → commit 5c1fd659…. No tag was created, moved, deleted, or replaced. No approval tag was created.
- Probes removed. The only artifact written inside the worktree was test-results/ (containing .last-run.json) from the required Playwright run; it was deleted. All downloaded evidence (actionlint binary, run logs, the NC-3 artifact) was written outside the repository, in the session scratchpad. node_modules/ and .next/ remain as the ordinary, git-ignored products of the required validation commands.
- Worktree ends clean. Final git status --porcelain --untracked-files=all → empty. git diff --check → clean. Detached HEAD; no branch was created.
- Nothing out of scope was begun. No branch-protection changes, no lockfile work, no pr.yml repair, no vulnerability remediation, no PKG-2 follow-up, no Track B, no Mission Control implementation. No push, no PR created or modified, no destructive control rerun, no other worktree touched. All GitHub interaction was strictly read-only (gh run view, gh api GETs).
