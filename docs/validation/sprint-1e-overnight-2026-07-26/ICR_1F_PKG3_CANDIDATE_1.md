# Independent Code Review — Sprint 1F, PKG-3, Candidate 1 (`candidate-1f-pkg3-1`)

**Reviewer:** AGENT-008 Independent Code Reviewer · fresh, independent session

> **Preservation header — written by the Main Coordinator, not by the reviewer.**
>
> - **Source:** recovered transcript from the dedicated ICR tab.
> - **Candidate:** `candidate-1f-pkg3-1` → commit `b7386f0521f296a5411e77e15d4dd385eb65691d`.
> - **Recovered after PKG-3 reconciliation and approval.** The reviewer's report was
>   unavailable when `sprint-1f-pkg3-approved` was created; reconciliation proceeded
>   on relayed findings, recorded in
>   [`ICR_1F_PKG3_CANDIDATE_1_RELAYED.md`](./ICR_1F_PKG3_CANDIDATE_1_RELAYED.md).
> - **No findings, severities, evidence, or conclusions were altered.** The body below
>   is the reviewer's text verbatim. The only mechanical accommodation: where the
>   reviewer used box-drawing tables, the content is preserved unaltered inside fenced
>   blocks so Markdown cannot mangle it. Nothing was reworded, reordered, summarized,
>   or omitted.
> - **This document is single-author reviewer material and is authoritative for the
>   reviewer's exact wording.** Coordinator reconciliation lives separately in
>   [`RECONCILIATION_1F_PKG3_CANDIDATE_1.md`](./RECONCILIATION_1F_PKG3_CANDIDATE_1.md);
>   the companion gate is [`AR_1F_PKG3_CANDIDATE_1.md`](./AR_1F_PKG3_CANDIDATE_1.md).
> - **PKG-3 approval is not reopened by this preservation.** The recovered report's
>   verdict, counts, identity values, remediation decision, and recommendation are
>   consistent with the approval already granted.

---

Independent Code Review — Sprint 1F PKG-3

Reviewer role: Fresh Independent Code Reviewer (AGENT-008), no prior involvement in PKG-3 planning, implementation, npm remediation, Linux validation, negative-control execution, or candidate freeze.
Review date: 2026-07-26
Review worktree: C:\Users\evanj\Documents\Projects\savrio-review-pkg3-icr (detached HEAD)

▎ Setup disclosure (material): The designated review worktree did not exist when this review began. ls returned No such file or directory, and git worktree list confirmed only seven worktrees, none at that path. I created it as a detached checkout at the candidate commit:
▎ git worktree add --detach "C:/Users/evanj/Documents/Projects/savrio-review-pkg3-icr" b7386f0521f296a5411e77e15d4dd385eb65691d
▎ No branch was created, no tag was touched, and nothing was committed. All review work occurred inside that worktree.

---
## 1. Candidate identity verification

```
┌──────────────────────┬──────────────────────────────────────────┬───────────────────────────────────────────────────┬────────┐
│         Item         │                 Expected                 │                     Observed                      │ Result │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Annotated tag object │ 30e0c057d2092719c4c91d8a2456cefbf676bbaf │ 30e0c057d2092719c4c91d8a2456cefbf676bbaf          │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Tag object type      │ annotated                                │ git cat-file -t → tag                             │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Peeled commit        │ b7386f0521f296a5411e77e15d4dd385eb65691d │ b7386f0521f296a5411e77e15d4dd385eb65691d          │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Parent               │ 5dd80ed64f847756e49065de1f151155808ac6a6 │ 5dd80ed64f847756e49065de1f151155808ac6a6          │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Tree                 │ ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5 │ ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5          │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Authorized baseline  │ 5c1fd6590160dd9bf41212868ed946bb9fb12123 │ exists; git cat-file -t → commit                  │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Approved predecessor │ sprint-1f-pkg2-approved                  │ peels to 5c1fd6590160dd9bf41212868ed946bb9fb12123 │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Review worktree HEAD │ candidate commit                         │ b7386f0521f296a5411e77e15d4dd385eb65691d          │ MATCH  │
├──────────────────────┼──────────────────────────────────────────┼───────────────────────────────────────────────────┼────────┤
│ Review worktree tree │ candidate tree                           │ ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5          │ MATCH  │
└──────────────────────┴──────────────────────────────────────────┴───────────────────────────────────────────────────┴────────┘
```

Ancestry independently confirmed: 5c1fd659 (baseline) → 5dd80ed6 (initial PKG-3, superseded, preserved unamended) → b7386f05 (candidate). The intermediate commit is the pre-correction workflow whose CI run failed at npm ci; it is retained as evidence rather than amended, which is the correct handling.

No identity mismatch. Review proceeds.

---
## 2. Exact changed paths and diffstat

```
$ git diff --name-status 5c1fd6590160dd9bf41212868ed946bb9fb12123 HEAD
A     .github/workflows/frontend-tests.yml

$ git diff --shortstat 5c1fd6590160dd9bf41212868ed946bb9fb12123 HEAD
 1 file changed, 299 insertions(+)
```

Exactly one added file, 299 insertions, zero deletions, zero modifications. Matches the authorized scope precisely. No package manifest, no lockfile, no PKG-2 test configuration, no production source, no other workflow, no documentation.

Workflow blob: dc76857d8db6e4d9e0ebd4dc9f8711b823d27746, identical to HEAD:.github/workflows/frontend-tests.yml.

---
## 3. Local validation results

Local environment: Windows 11, Node v24.18.0, npm 11.16.0. This is not the CI toolchain (Linux / Node 22). Local results establish repository-level correctness only; Linux and Node-22 behaviour rests entirely on the GitHub Actions evidence in section 4.

```
┌─────┬──────────────────────────────────────────────────────────┬────────────────────────────────────────┐
│  #  │                     Literal command                      │                 Result                 │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 1   │ git status --porcelain --untracked-files=all (initial)   │ empty — clean                          │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 2   │ git rev-parse candidate-1f-pkg3-1                        │ 30e0c057… ✔                            │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 3   │ git cat-file -t candidate-1f-pkg3-1                      │ tag ✔                                  │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 4   │ git rev-parse candidate-1f-pkg3-1^{commit}               │ b7386f05… ✔                            │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 5   │ git rev-parse candidate-1f-pkg3-1^{commit}^              │ 5dd80ed6… ✔                            │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 6   │ git rev-parse candidate-1f-pkg3-1^{tree}                 │ ca9cdc7e… ✔                            │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 7   │ git diff --name-status 5c1fd659… HEAD                    │ A .github/workflows/frontend-tests.yml │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 8   │ git diff --shortstat 5c1fd659… HEAD                      │ 1 file changed, 299 insertions(+)      │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 9   │ git diff --check 5c1fd659… HEAD                          │ no output, exit 0                      │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 10  │ actionlint .github/workflows/frontend-tests.yml (v1.7.7) │ no output, exit 0                      │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 11  │ npx tsc --noEmit                                         │ exit 0                                 │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 12  │ npx eslint .                                             │ exit 0                                 │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 13  │ npx vitest run --project node                            │ 22 files / 326 tests passed, exit 0    │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 14  │ npx vitest run --project dom                             │ 1 file / 3 tests passed, exit 0        │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 15  │ npm test                                                 │ 23 files / 329 tests passed, exit 0    │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 16  │ npx next build                                           │ exit 0 (18 static pages generated)     │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 17  │ npx playwright test                                      │ 1 passed (37.2s), exit 0               │
├─────┼──────────────────────────────────────────────────────────┼────────────────────────────────────────┤
│ 18  │ git status --porcelain --untracked-files=all (final)     │ empty — clean                          │
└─────┴──────────────────────────────────────────────────────────┴────────────────────────────────────────┘
```

Execution order note: I ran npx next build before npx playwright test (Playwright's webServer rebuilds regardless). Both passed.

actionlint provenance. actionlint was not installed on this machine. I downloaded the official release into the session scratchpad (outside every git tree) and verified it before use:

```
sha256 (published): 7f12f1801bca3d480d67aaf7774f4c2a6359a3ca8eebe382c95c10c9704aa731
sha256 (actual):    7f12f1801bca3d480d67aaf7774f4c2a6359a3ca8eebe382c95c10c9704aa731
actionlint 1.7.7 (go1.23.4, windows/amd64)
```

actionlint on the candidate file: exit 0. Across all seven workflows: exit 0. Limitation: shellcheck is not installed, so actionlint's shell-script integration was inactive. I compensated by extracting all six embedded run: | scripts and running bash -n on each — all six syntactically valid.

Additional local probes (all removed; see section 13). Counts reproduced CI exactly (326/22, 3/1, 329/23), which independently corroborates the implementer's figures.

---
## 4. GitHub Actions evidence assessment

gh auth status → authenticated as evanjob2005-ux, scopes repo, workflow, read:org, gist. All nine specified runs were accessible. Nothing is UNVALIDATED for reasons of access.

Repository facts established independently:
- git ls-remote --heads origin → main does not exist. Remote heads: feature/dev-hq-operating-system, feature/mission-control-ui, feature/sprint-1c-a-repository-abstraction, feature/sprint-1d-execution-manager.
- git ls-remote --symref origin HEAD → default branch is feature/dev-hq-operating-system.
- Repository is public, forking allowed.
- Validation vehicle: PR #2, draft, base feature/dev-hq-operating-system, head validation/1f-pkg3-ci-npm11, now CLOSED (not merged). Correct handling.

### 4.1 Run-by-run

```
┌─────────────┬──────────────────────────┬────────────┬───────────────────────────────────────────────────────────────────┬───────────┐
│     Run     │         Purpose          │ Conclusion │                        Failure attribution                        │ Artifacts │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30231210124 │ pre-correction (5dd80ed) │ failure    │ Install dependencies in both jobs                                 │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30231657108 │ clean                    │ success    │ —                                                                 │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30231820614 │ NC-1                     │ failure    │ unit → Vitest node project                                        │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30231973986 │ NC-2                     │ failure    │ unit → Vitest DOM project (node step success)                     │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30232109969 │ NC-3                     │ failure    │ e2e → Playwright smoke test                                       │ 1         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30232292354 │ NC-4                     │ failure    │ e2e → Playwright smoke test                                       │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30232498312 │ NC-5A/5B                 │ failure    │ unit → Build application; e2e → Playwright smoke test (webServer) │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30232646900 │ NC-6A                    │ failure    │ unit → Verify harness preconditions                               │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30232803068 │ NC-6B                    │ failure    │ e2e → Playwright smoke test                                       │ 0         │
├─────────────┼──────────────────────────┼────────────┼───────────────────────────────────────────────────────────────────┼───────────┤
│ 30232882905 │ final green              │ success    │ —                                                                 │ 0         │
└─────────────┴──────────────────────────┴────────────┴───────────────────────────────────────────────────────────────────┴───────────┘
```

Sixteen Frontend Tests runs exist in total, alternating failure/green-restoration exactly as reported.

### 4.2 Toolchain, install, and counts (run 30231657108, log inspected directly)

```
Unit and Static Validation  Record toolchain versions  node v22.23.1
Unit and Static Validation  Record toolchain versions  npm 11.16.0
End-to-End Smoke            Record toolchain versions  node v22.23.1
End-to-End Smoke            Record toolchain versions  npm 11.16.0
Unit and Static Validation  Install dependencies  added 734 packages, and audited 735 packages in 24s
End-to-End Smoke            Install dependencies  added 734 packages, and audited 735 packages in 24s
Vitest node project   Test Files 22 passed (22)   Tests 326 passed (326)
Vitest DOM project    Test Files  1 passed (1)    Tests   3 passed (3)
Vitest aggregate      Test Files 23 passed (23)   Tests 329 passed (329)
Build application     ✓ Compiled successfully in 5.6s ... ✓ Generating static pages (18/18)
Playwright smoke test 1 passed (16.4s)
```

Every reported figure confirmed verbatim. 326 + 3 = 329 exactly, so the aggregate entry point genuinely resolves both projects. grep -ci skipping over the entire clean log → 0. grep -cE "::warning|continue-on-error" → 0.

### 4.3 Merge-ref identity — independently verified, not accepted on report

This was the highest-risk claim, so I verified it from the API rather than the implementer's summary.

```
$ gh api .../commits/a216f1ea171108ca368b207b58eab5b28e11e565
  msg:     "Merge b7386f05… into d5e50e5e…"
  parents: ["d5e50e5e…", "b7386f05…"]
  tree:    ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5

candidate tree: ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5   ← IDENTICAL
base d5e50e5e tree: 50475a27266e972f6d159009e3a22ce707243b5d (differs, as expected)
$ git merge-base --is-ancestor d5e50e5e… b7386f05…  → YES
```

The clean run's checkout log confirms HEAD is now at a216f1e Merge b7386f05… into d5e50e5e…. The tree that Linux actually executed is byte-identical to the frozen candidate tree.

I extended this to every green restoration run. All seven head commits — 9d26de8b, 386c7c51, bb4b2fec, 164c918c, c817662e, 5f246440, 192673da — carry tree ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5. Every negative control was genuinely reverted to the candidate tree before the next one began. This evidence chain is unusually rigorous and it holds under independent audit.

### 4.4 The pre-existing lockfile defect — independently reproduced

Run 30231210124 (5dd80ed, no npm pin) failed at Install dependencies in both jobs:

```
npm error code EUSAGE
npm error `npm ci` can only install packages when your package.json and package-lock.json … are in sync.
npm error Missing: esbuild@0.28.1 from lock file
npm error Missing: @esbuild/aix-ppc64@0.28.1 from lock file   (+25 further platform packages)
```

I confirmed the stated mechanism statically from the lockfile itself:

```
node_modules/esbuild                  => 0.23.1        (the only esbuild in the lock)
node_modules/vitest/node_modules/vite => 8.1.5
   peerDependencies.esbuild           => ^0.27.0 || ^0.28.0     ← unsatisfiable from the lock
lockfileVersion: 3
```

The explanation is accurate and the condition is genuinely pre-existing. It is not a candidate defect.

### 4.5 Artifact behaviour

```
┌──────────────────────────────────┬───────────────────┬─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│               Run                │   Upload step     │                                              Artifacts                                              │
│                                  │    conclusion     │                                                                                                     │
├──────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 30231657108 (green)              │ skipped           │ 0                                                                                                   │
├──────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 30232882905 (green)              │ skipped           │ 0                                                                                                   │
├──────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 30231820614 / 30231973986 (unit  │ skipped           │ 0                                                                                                   │
│ red, e2e green)                  │                   │                                                                                                     │
├──────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 30232109969 (NC-3)               │ success           │ 1 — playwright-test-results-30232109969-1, 137,869 bytes, created 2026-07-27T02:26:11Z, expires     │
│                                  │                   │ 2026-08-03T02:26:10Z (7-day retention confirmed)                                                    │
├──────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 30232498312 (NC-5B)              │ success           │ 0                                                                                                   │
├──────────────────────────────────┼───────────────────┼─────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ 30232803068 (NC-6B)              │ success           │ 0                                                                                                   │
└──────────────────────────────────┴───────────────────┴─────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

Green runs upload nothing — confirmed. if: failure() is job-scoped, so NC-1/NC-2 (unit red, e2e green) correctly upload nothing. The two rows where a successful upload step produced zero artifacts are a real diagnosability defect; see MINOR-1.

### 4.6 Pre-existing pr.yml is not dormant, and it is red

Pull Request Validation (pr.yml) ran on all sixteen PR events and failed every time:

```
##[error]Unbalanced Markdown code fences (```).
##[error]Process completed with exit code 1.
```

Its on.pull_request block has types: but no branches: filter, so it triggers on pull requests to any branch, including the live default branch. This directly contradicts a factual claim in the candidate's own tag annotation. See MINOR-5 and answer Q.

### 4.7 Timeout headroom (measured)

```
┌────────────────────────────┬──────────┬────────┬──────────┐
│            Job             │ Observed │ Limit  │ Headroom │
├────────────────────────────┼──────────┼────────┼──────────┤
│ Unit and Static Validation │ 78 s     │ 15 min │ ~11.5×   │
├────────────────────────────┼──────────┼────────┼──────────┤
│ End-to-End Smoke           │ 83 s     │ 30 min │ ~21.7×   │
└────────────────────────────┴──────────┴────────┴──────────┘
```

Playwright's own webServer.timeout is 300 s against an observed ~40 s CI build. All generous and appropriate.

---
## 5. Negative-control assessment

```
Control: NC-1
Classification: PROVEN
Basis and weaknesses: Run 30231820614: unit fails precisely at step 10 Vitest node project; DOM/aggregate/build correctly skipped; e2e job independently green;
hygiene still ran and passed. Attribution is unambiguous.
────────────────────────────────────────
Control: NC-2
Classification: PROVEN
Basis and weaknesses: Run 30231973986: step 10 Vitest node project = success, step 11 Vitest DOM project = failure. This is the sharpest control in the set — it
proves the DOM project is separately enforced and not merely a duplicate of node.
────────────────────────────────────────
Control: NC-3
Classification: PROVEN
Basis and weaknesses: Run 30232109969: e2e fails at Playwright smoke test; unit green; exactly one artifact, 137,869 bytes, 7-day retention, verified via the
artifacts API rather than from the log. Diagnostics genuinely reach the reviewer.
────────────────────────────────────────
Control: NC-4
Classification: PROVEN
Basis and weaknesses: Run 30232292354. Strongest control by design: the decoy served exactly <h1>Savrio Dev HQ</h1>, i.e. content that would have satisfied the
assertion had reuse been permitted. Playwright refused: Error: http://127.0.0.1:3100 is already used, make sure that nothing is running on  the port/url or set
reuseExistingServer:true in config.webServer. This proves the run cannot pass against a foreign server — the exact false positive that failed
candidate-1f-pkg2-1. Design note: this control required inserting a temporary workflow step (step numbering shifts, Playwright smoke test moves from 9 to 10),
so it exercised a modified workflow. That is unavoidable for this property and does not weaken the conclusion.
────────────────────────────────────────
Control: NC-5A
Classification: PROVEN
Basis and weaknesses: Run 30232498312 unit job: steps 8–12 (Type check, Lint, all three Vitest steps) all success, failure isolated to step 13 Build application
with Error: NC-5 deliberate prerender failure. Proves the build is a real independent gate reached only after tests pass.
────────────────────────────────────────
Control: NC-5B
Classification: PROVEN
Basis and weaknesses: Same run, e2e job: [WebServer] Error: NC-5 deliberate prerender failure → Error: Process from config.webServer was not able to start. Exit
code: 1. Proves the Playwright lifecycle genuinely builds and cannot proceed past a broken build.
────────────────────────────────────────
Control: NC-6A
Classification: PROVEN
Basis and weaknesses: Run 30232646900: unit fails at step 7 Verify harness preconditions with ##[error]Required test harness file is missing.; steps 8–13 all
skipped; grep -ci skipping over the entire run log = 0. Fail-closed behaviour demonstrated, not asserted. The e2e job correctly stayed green  because its
precondition list does not cover vitest.config.ts — correct scoping, not a leak.
────────────────────────────────────────
Control: NC-6B
Classification: PROVEN
Basis and weaknesses: Run 30232803068: precondition passed (files present), then Playwright smoke test failed with Error: No tests found. This is the important
shape — the guard did not mask the condition; Playwright itself failed closed. Unit job fully green, so attribution is clean.
────────────────────────────────────────
Control: NC-7
Classification: PARTIALLY PROVEN
Basis and weaknesses: Hygiene passed on clean runs and on every forced-failure run — including NC-5B and NC-3, where Playwright had written trace output into
test-results/. That establishes the negative direction: expected generated output does not dirty the tree. It does not establish the positive direction — no
control ever demonstrated that the hygiene step fails when the tree really is dirty. Compounding this, every NC mutation was committed to the validation branch,
 so git status legitimately saw a clean tree in all of them; the check's discriminating power was never exercised by the candidate's own evidence. I closed this
 gap myself (section 6.14) — but the control as designed does not prove it.
```

Summary: 8 PROVEN, 1 PARTIALLY PROVEN, 0 NOT PROVEN, 0 UNVALIDATED. The negative-control suite is materially stronger than typical for this class of change; NC-2, NC-4, NC-5B and NC-6B in particular test properties that are easy to claim and hard to demonstrate.

---
## 6. Code-review assessment by inspection area

6.1 Candidate identity and scope. Clean. One file, additive only, 299 lines, no collateral change. Section 1–2.

6.2 Trigger correctness. workflow_dispatch present; push and pull_request both filtered to main and feature/dev-hq-operating-system. Syntactically and semantically correct.

6.3 Will it run on the active branches? Yes. feature/dev-hq-operating-system is the actual remote default branch, so both the push trigger and PR trigger are live. Empirically demonstrated: all 16 runs fired on pull_request with base feature/dev-hq-operating-system. The main entries are currently inert (that branch does not exist) but are forward-looking and harmless.

6.4 Job and step ordering. Correct and deliberate. Install → precondition assertion → static analysis → tests → build. Build last is load-bearing (6.13). The two jobs are intentionally independent, which is the right call: chaining would add latency without information, and NC-5 shows a broken build surfaces in both.

6.5 Node and npm toolchain pinning. node-version: "22" (quoted, correct — unquoted 22 is a YAML integer and a known foot-gun), plus an explicitly named npm install --global npm@11.16.0 step followed by a version-recording step. Runtime proof rather than inference: node v22.23.1, npm 11.16.0 appear in both jobs' logs before npm ci. This is the right structure.

6.6 Safety/maintainability of the npm install. Acceptable; see answers A–C. The pin is exact, isolated in its own named step, documented at length, and explicitly labelled a pin rather than a repair — including the honest admission that the workflow will therefore not detect that npm 10 cannot install this project. That disclosure is exactly what the handbook requires and it is stated in the file itself, not only in the commit message.

6.7 npm cache behaviour and invalidation. cache: npm only, keyed by actions/setup-node on the lockfile hash. npm ci re-validates every package against the lockfile's integrity hashes, so a stale or poisoned cache cannot survive into an install. No cache-dependency-path needed — package-lock.json is at the repo root. Correct.

6.8 Absence of unsafe caches. Confirmed: exactly one cache in the file. No .next cache, no node_modules cache, no Playwright browser cache. The browser is installed fresh every run so the binary always matches the locked Playwright version — this is the conservative and correct choice, and it costs only seconds against an 83 s job.

6.9 Vitest enforcement. All three invocations are unconditional and separately named. Node, DOM and aggregate are each independently attributable (NC-1, NC-2, NC-6A).

6.10 Can any test family be silently skipped? No. I tested the three plausible vectors rather than reasoning about them:
- Missing config: --project doesnotexist → exit 1 with a hard error, not a zero-test pass. So deleting or renaming the node or dom project fails closed.
- Stray .only: with a .only present and CI=true, Vitest → Error: [Vitest] Unexpected .only modifier and exit 1 (allowOnly defaults to !process.env.CI). Playwright is covered by forbidOnly: !!process.env.CI. Both protections depend on the CI variable, which GitHub Actions always sets.
- Zero collection: NC-6B proved Playwright errors with No tests found.

6.11 Playwright browser install and server lifecycle. npx playwright install --with-deps chromium — Chromium only, matching the single declared project. The committed webServer config is used unchanged, with reuseExistingServer: false and a production build && start. NC-4 proves the no-reuse property empirically. This is the property that closed the candidate-1f-pkg2-1 false positive and it is genuinely enforced.

6.12 Failure-only artifact behaviour. if: failure() is correct (always() would upload on green; if: failure() correctly does not fire on cancellation). Green runs upload nothing — verified. The if-no-files-found: ignore choice is the one weak spot; see MINOR-1.

6.13 Retention and generated-file hygiene. retention-days: 7 verified live via expires_at. Artifact names include run_id and run_attempt, so re-runs cannot collide. After a full local run (build + all tests + Playwright), git status --porcelain --untracked-files=all was empty despite .next, test-results, node_modules, next-env.d.ts and tsconfig.tsbuildinfo all existing on disk. git check-ignore -v confirms each is covered by a specific .gitignore rule. playwright-report/ is never created because the reporter is list. The build-last ordering rationale is legitimate: the node project sets exclude explicitly (node_modules, dist, e2e), which replaces Vitest's defaults, and .next/ is in neither — so the safety of test collection genuinely does depend on build running after Vitest (see NOTE-1).

6.14 Repository-hygiene checks — discriminating power probed. The candidate's NC-7 never tested the positive direction, so I did:

```
┌─────────────────────────────────────┬─────────────┬──────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                Probe                │ Expectation │                                               Observed                                               │
├─────────────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ untracked probe-unexpected-file.txt │ detected    │ ?? probe-unexpected-file.txt — detected                                                              │
├─────────────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ tracked modification to README.md   │ detected    │  M README.md — detected, then restored byte-identically (git diff --quiet HEAD -- README.md → clean) │
├─────────────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ probe-ci-output.log                 │ ignored     │ not detected — .gitignore:31:*.log                                                                   │
├─────────────────────────────────────┼─────────────┼──────────────────────────────────────────────────────────────────────────────────────────────────────┤
│ local/probe.txt                     │ ignored     │ not detected — .gitignore:183:local/                                                                 │
└─────────────────────────────────────┴─────────────┴──────────────────────────────────────────────────────────────────────────────────────────────────────┘
```

So the check does discriminate correctly in both directions. Its sensitivity is bounded by the pre-existing .gitignore breadth (*.log, local/, tmp/, temp/, coverage/, *.zip, .cache/) — a CI step writing to any of those would escape detection. Inherited, not introduced. All probes removed.

Under set -euo pipefail, dirty=$(git status …) fails the step if git itself fails, so the check is fail-closed rather than defaulting to "clean". Correct.

6.15 Concurrency and cancellation. group: frontend-tests-${{ github.workflow }}-${{ github.ref }}, cancel-in-progress: true. Isolation across PRs (refs/pull/N/merge) and branches (refs/heads/…) is correct. Two observations: the key does not distinguish event type, so a workflow_dispatch and a push on the same branch share a group (arguably desirable — same ref); and if: always() on the hygiene steps overrides cancellation (MINOR-2). The cancellation path was never exercised in any of the 16 runs (MINOR-4).

6.16 PR and push event behaviour. Uses pull_request, not pull_request_target — correct and important on a public repository: untrusted head code runs with a read-only token and no secrets. permissions: contents: read at workflow level, no job-level escalation, and no secrets.* reference anywhere. Push behaviour is straightforward. Fork PRs receive compute only, which is the standard accepted model.

6.17 Linux portability. No Windows-isms, no \, no %VAR%, no PowerShell. Uses [[ ]], -f, -x, $(…) — all POSIX-bash under the declared shell. Empirically green on ubuntu-latest across 16 runs. .gitattributes exists (2,196 bytes), and hygiene passed on both Linux CI and my Windows checkout, so line-ending normalisation is not a latent dirtying risk.

6.18 Shell correctness under bash. defaults.run.shell: bash on both jobs (GitHub then invokes bash --noprofile --norc -e -o pipefail), and every multi-line script additionally sets set -euo pipefail. All six extracted scripts pass bash -n. Quoting is correct throughout: "$file", "${binary}", "$missing", "$dirty", "$GITHUB_STEP_SUMMARY". The if ! git diff --check HEAD --; then form correctly suspends errexit for the condition. No unquoted expansions, no word-splitting hazards.

6.19 Permissions and least privilege. contents: read, workflow-level, nothing else. No actions:, packages:, id-token:, pull-requests:. Empirically sufficient: NC-3 uploaded a 137 KB artifact under contents: read, confirming upload-artifact@v7 does not need write scope. Exemplary.

6.20 Action pinning and supply-chain posture. I verified each SHA against its claimed tag via the API rather than trusting the comment:

```
┌─────────────────────────┬──────────────────────────────────────────┬─────────┬─────────────┐
│         Action          │                Pinned SHA                │ Claimed │  Verified   │
├─────────────────────────┼──────────────────────────────────────────┼─────────┼─────────────┤
│ actions/checkout        │ 3d3c42e5aac5ba805825da76410c181273ba90b1 │ v7.0.1  │ exact match │
├─────────────────────────┼──────────────────────────────────────────┼─────────┼─────────────┤
│ actions/setup-node      │ 820762786026740c76f36085b0efc47a31fe5020 │ v7.0.0  │ exact match │
├─────────────────────────┼──────────────────────────────────────────┼─────────┼─────────────┤
│ actions/upload-artifact │ 043fb46d1a93c77aae656e7c1c64a875d1fc6a0a │ v7.0.1  │ exact match │
└─────────────────────────┴──────────────────────────────────────────┴─────────┴─────────────┘
```

Full 40-character commit SHAs, version comments accurate, first-party actions/ org only, zero third-party actions. This is the strongest posture available short of vendoring.

6.21 Timeout suitability. Appropriate, with measured headroom (4.7).

6.22 Hidden coupling. Enumerated: branch names main (nonexistent, inert) and feature/dev-hq-operating-system (live); port 3100 via playwright.config.ts's E2E_PORT ?? 3100 default, which the workflow does not set — and which fails closed if occupied (NC-4); the literal path e2e/smoke.spec.ts in the e2e precondition; test/setup-dom.ts, vitest.config.ts, playwright.config.ts in the unit precondition; and the implicit CI variable that activates forbidOnly and allowOnly. All couplings fail closed. None can produce a false green.

6.23 Duplicate execution. Intentional, documented, and cheap at measured scale (78 s / 83 s). See answers M and N.

6.24 Safe as the CI foundation? Yes, as a file. Fail-closed everywhere tested, least privilege, strongly pinned, no injection surface, honest about its own limitation. The gap is not in the file but in the repository configuration that would make it binding (MAJOR-1).

6.25 Can it become the approved checkpoint? Yes — with findings recorded and MAJOR-1 tracked as a separate settings action.

---
## 7. Answers to specific questions A–S

A. Does installing npm 11.16.0 globally before npm ci create unacceptable nondeterminism or supply-chain risk?
No — not unacceptable. The version is exact, not a range, so resolution is deterministic in version terms. Registry availability is a new (small) runtime dependency, and the tarball is fetched without an integrity assertion, so determinism rests on npm registry immutability — the same trust assumption npm ci already makes for all 734 packages. Given that the alternative is a workflow that cannot install the project at all, this is a proportionate interim measure. Not a blocker.

B. Should npm be pinned by exact version only, or should additional integrity controls be required?
Exact version is the minimum and is met. I do not require more for this candidate, but I recommend the follow-up package strengthen it, in order of value: (1) add "packageManager": "npm@11.16.0" to package.json so the contract lives with the repository rather than only in CI (package.json currently has neither engines nor packageManager — verified); (2) then let Corepack or setup-node derive it, removing the manual global install entirely. Hash-pinning the npm tarball is possible but adds maintenance burden disproportionate to the residual risk.

C. Does setup-node with Node 22 plus a global npm 11 install create a clear and maintainable toolchain contract?
Clear, yes — deliberately so. The separate named step plus the version-recording step make the effective toolchain visible in every log rather than inferred. Maintainable, only partially: the contract exists in two CI job definitions and nowhere in the repository. A developer cloning this repo gets no signal that npm 11 is required, and will hit the same EUSAGE failure with no explanation. That is the real cost of the pin, and it is the strongest argument for closing the follow-up promptly. Recorded as NOTE-10.

D. Does the workflow's use of npx risk downloading packages not present in node_modules?
For the unit job: no. Every npx target (tsc, eslint, vitest, next) is asserted present and executable in node_modules/.bin before first use, and npx prefers the local binary. The guard is real and the intent is documented. For the e2e job: the guarantee is not uniformly applied — the precondition checks only playwright, yet the Playwright webServer command invokes npx next start. In practice this is unreachable, because the command is npm run build && npx next start …: npm run build resolves next through npm (which never falls back to the registry) and would fail first, and && prevents npx next start from running. So the exposure is closed by ordering rather than by the stated guard. Recorded as MINOR-3.

E. Are the precondition checks fail-closed, or do they create a false sense of enforcement?
Fail-closed, and demonstrated. They are written in the correct direction — asserting presence and exiting non-zero — never as if [ -f x ]; then run; fi. NC-6A confirms: precondition failure, all downstream steps skipped, and zero occurrences of "skipping" in the entire log. NC-6B confirms the more subtle case: the precondition passed and Playwright itself then failed closed on zero collection, so the guard did not mask the defect. The residual limitation is scope, not direction: they assert only the listed paths. Adding a file the workflow does not check would go unnoticed — but that cannot turn a red run green.

F. Does git status --porcelain --untracked-files=all correctly detect unexpected generated files while allowing intentionally ignored outputs?
Yes — probe-verified in both directions (6.14). It detected an unexpected untracked file and a tracked modification; it correctly stayed silent for .next/, test-results/, node_modules/, next-env.d.ts, tsconfig.tsbuildinfo after a full local build-and-test cycle. --untracked-files=all still honours .gitignore, which is exactly the intended semantics.

G. Are ignored artifacts such as .next, test-results, and node_modules sufficiently controlled?
Yes for those three specifically — each maps to a precise .gitignore rule (.gitignore:16, :150, :10), verified by git check-ignore -v. The broader ignore surface is looser than ideal: *.log, local/, tmp/, temp/, .cache/, coverage/, *.zip would each hide a CI-written file from the hygiene check. That is pre-existing .gitignore policy, not something PKG-3 introduced or should change under a one-file scope. Recorded as NOTE-3.

H. Does failure-only artifact upload work if Playwright fails before test-results exists?
It does not break the run — but it degrades badly, and I have two live examples rather than a hypothetical. In NC-5B (30232498312) and NC-6B (30232803068) the e2e job failed before any trace existed; Upload Playwright failure artifacts concluded success; and the run holds zero artifacts. Because if-no-files-found: ignore suppresses even the warning that the default warn would emit, the log offers no explanation. A person triaging a red run sees a green upload step and an empty artifacts tab. Recommend warn. Recorded as MINOR-1.

I. Are workflow permissions explicit and least privilege?
Yes, and empirically minimal. permissions: contents: read at workflow scope, no job-level grants, no secrets referenced. NC-3's successful 137 KB upload under contents: read proves nothing more is needed. Best-in-class for this workflow's job.

J. Are third-party actions pinned strongly enough for a production-quality CI foundation?
Yes. There are no third-party actions at all — three first-party actions/ steps, each pinned to a full 40-character commit SHA that I verified resolves to exactly the tag named in the adjacent comment (6.20). Two residual, inherent supply-chain surfaces remain and cannot be closed by pinning: the npm registry (answer A) and --with-deps, which installs unpinned Ubuntu OS packages each run (NOTE-8). Both are standard and accepted.

K. Is the workflow safe on both pull_request merge refs and direct push events?
Yes. It uses pull_request, never pull_request_target, so on this public repository untrusted head code executes with a read-only token and no secret access. There is no ${{ }} interpolation anywhere inside a run: block — the only two expressions in the file are in concurrency.group and the artifact name (6.16), and neither draws on attacker-controlled fields such as github.event.pull_request.title or github.head_ref. Script-injection surface is nil. Push behaviour is unremarkable. Merge-ref behaviour is not merely safe but verified equivalent: the executed tree was byte-identical to the candidate tree (4.3).

L. Is the concurrency key sufficiently isolated across branches, PRs, and workflow events?
Sufficiently, yes. github.ref distinguishes every PR (refs/pull/N/merge) and every branch (refs/heads/…), and github.workflow prevents collision with the six other workflows. Two caveats: event type is not part of the key, so a workflow_dispatch and a push on the same branch share a group and will cross-cancel (defensible — same ref, same commit); and the whole cancellation path is unexercised by the evidence, since all 16 runs completed sequentially with none cancelled (MINOR-4). Combined with MINOR-2, cancel-in-progress should be treated as designed-but-unproven.

M. Is duplicate execution of Node and DOM tests through npm test acceptable?
Acceptable. The cost is measured, not estimated: the entire unit job is 78 s, of which the three Vitest steps are ~3.1 s + ~1.2 s + ~3.7 s. The duplicate buys a real property — proof that the single documented entry point still resolves and still collects both projects (326 + 3 = 329 across 23 files). That is not inferable from the two project runs alone, and a broken test script is a realistic regression. Flake amplification is not a concern at this suite's determinism and size. I would revisit only if the suite grows past a few minutes.

N. Is running the Next.js build twice acceptable for integrity?
Yes, and it is the better choice. The builds serve different purposes: the unit job's npx next build is an explicit, separately attributable gate (NC-5A shows it failing on its own line after all tests pass), while the e2e job's build is part of the Playwright webServer lifecycle and proves the served application builds (NC-5B). Collapsing them would either lose per-job attribution or couple the jobs, which the file deliberately avoids. The builds run in parallel on separate runners at ~40 s each, so the wall-clock cost is zero and the compute cost is trivial.

O. Does the workflow depend on a nonexistent main branch in a way that creates misleading enforcement?
No. main genuinely does not exist (git ls-remote --heads origin confirms), but it appears only as an additional entry alongside the live default branch in both push and pull_request filters. Its presence cannot suppress or weaken the feature/dev-hq-operating-system triggers, and enforcement on the active branch is empirically demonstrated. This is forward-looking configuration, not misleading enforcement — and it is precisely the trap the six pre-existing workflows fell into, which this file avoids. Worth revisiting when the branch strategy is settled.

P. Does the workflow correctly enforce feature/dev-hq-operating-system, the current default branch?
Yes — this is the candidate's central achievement. git ls-remote --symref origin HEAD confirms it is the default branch, and all 16 runs fired on pull requests based against it. This workflow is the first in the repository to execute the Vitest harnesses, install a browser, or run Playwright on the branch where work actually happens. That said, "enforce" is currently aspirational in the blocking sense — see MAJOR-1.

Q. Should the six pre-existing dormant workflows affect PKG-3 approval?
Not for approval — but the premise needs correcting, and one item needs the Founder's attention. Five of the six (ci.yml, lint.yml, release.yml, security.yml, dependencies.yml) are genuinely dormant: main-only or dispatch-only. pr.yml is not dormant. Its on.pull_request has no branches: filter, so it fires on PRs to any branch; it ran on all 16 events of this validation PR and failed every one with Unbalanced Markdown code fences. Two consequences: the tag annotation's claim that all six trigger only on main is factually wrong (MINOR-5), and once PKG-3 merges, every PR will show a red Pull Request Validation alongside a green Frontend Tests — noise that erodes exactly the signal PKG-3 exists to create. Separately, npm ci reports 42 vulnerabilities (1 critical, 19 high) and the workflows that would surface them (security.yml, dependencies.yml) are main-only and have never run (NOTE-9). None of this is PKG-3's fault or scope, and none should block it. All three deserve their own package.

R. Does the public draft-PR evidence accurately prove Linux behaviour, despite execution against synthetic merge commits?
Yes — and this is the part of the evidence that survives scrutiny best. The merge-ref concern is the right one to raise, and it is fully answered: the clean run checked out a216f1e, whose tree is ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5 — byte-identical to the candidate tree. I confirmed this from the GitHub API, not from the implementer's summary. I then extended the check to all seven green restoration runs; every one carries the same tree. Because the candidate's baseline is an ancestor of the PR base, the synthetic merge introduced nothing. So the runs are valid Linux/Node-22 evidence for exactly the frozen tree. Scope of what they prove: ubuntu-latest, Node v22.23.1, npm 11.16.0, Chromium only. Non-Linux runners, other browsers, and other npm versions remain UNVALIDATED — which the candidate states plainly rather than glossing.

S. Is the candidate's one-file scope appropriate, or does the npm incompatibility require rejecting it until package-lock.json is repaired?
One-file scope is appropriate. Rejection would be the wrong call. Three reasons. First, the defect is genuinely pre-existing: I reproduced the mechanism statically from the lockfile (single esbuild@0.23.1 versus vitest's nested vite@8.1.5 requiring peer esbuild ^0.27.0 || ^0.28.0) and confirmed the EUSAGE failure in run 30231210124 — nothing in PKG-2 or PKG-3 caused it. Second, the workflow does not conceal it: npm install, --legacy-peer-deps, and lockfile mutation were all rejected in favour of an exact pin, and the file itself states that it will therefore not detect npm 10 incompatibility. That is disclosure, not suppression. Third, rejecting would leave the repository with zero executing test enforcement while the lockfile work proceeds — strictly worse for every property PKG-3 exists to protect. Repairing the lockfile inside this package would also require touching package-lock.json, which is outside the authorized scope and would have dirtied the CI tree that the hygiene step correctly guards. Approve the pin as an interim measure; close the lockfile package promptly.

---
## 8. Findings

### BLOCKER

None.

### MAJOR

MAJOR-1 — The workflow executes but cannot enforce: no required status checks exist.
The package's stated purpose is to enforce the PKG-2 foundation. The workflow runs correctly and fails closed, but nothing makes a red run consequential:

```
$ gh api repos/…/branches/feature%2Fdev-hq-operating-system/protection
{"message":"Branch not protected","status":"404"}
$ gh api repos/…/rulesets
[]
```

No branch protection, no rulesets, no required status checks on the active default branch. A failing Frontend Tests run blocks no merge and no push. Everything PKG-3 built is currently advisory.
Assessment: this is a genuine gap between the stated objective and the delivered effect, and the Founder should not read "CI enforces the frontend test foundation" as true until it is closed. It is not a defect in the candidate file — required-status-check configuration is a repository setting, unreachable from a workflow file and outside the authorized one-file scope. Remediation belongs to a separate settings/governance action, ideally immediately after merge (the check must exist on the default branch before it can be marked required). Does not require changing the candidate.

### MINOR

MINOR-2 — if: always() on both hygiene steps overrides cancellation, partially defeating cancel-in-progress: true.
always() evaluates true even when a job is cancelled, so a superseded run will still execute both hygiene steps instead of terminating promptly. The intent — "hold a failing run to the same cleanliness standard as a passing one" — is correctly served by !cancelled() (or success() || failure()), which runs on success and failure but respects cancellation. Impact: wasted runner seconds and slower cancellation; no correctness effect. Lines 163 and 275.

MINOR-1 — if-no-files-found: ignore produces a green upload step with zero artifacts and no explanation.
Observed twice in real runs (NC-5B 30232498312, NC-6B 30232803068): e2e failed before test-results/ existed, Upload Playwright failure artifacts concluded success, and the run holds 0 artifacts. ignore suppresses even the warning the default warn would emit, so the log gives a triager no signal. Recommend if-no-files-found: warn. Line 272.

MINOR-3 — The e2e precondition list omits next, which the Playwright webServer invokes via npx.
The unit job states the guarantee "require local resolution of every binary the following steps invoke" and upholds it for tsc, eslint, vitest, next. The e2e job checks only playwright, yet its webServer command runs npx next start. Not exploitable — npm run build precedes it under && and would fail first without reaching the registry — so the guarantee holds by ordering rather than by the guard. Recommend adding next to the e2e loop for consistency. Lines 233–243.

MINOR-4 — Concurrency cancellation is entirely unvalidated.
All 16 runs completed sequentially; none was cancelled. The "cancel superseded runs" property in the candidate's scope statement is therefore UNVALIDATED, and MINOR-2 gives concrete reason to expect it behaves imperfectly. Recommend one dispatch-and-supersede probe when the follow-up package next opens a validation PR.

MINOR-5 — Inaccurate factual claim in the candidate's tag annotation about the pre-existing workflows.
The annotation states: "Before this candidate no workflow in the repository had ever executed. All six existing workflows trigger only on main and pull requests to main." pr.yml has on.pull_request with types: but no branches: filter, so it triggers on PRs to any branch — and it in fact ran on all 16 events of this candidate's own validation PR, failing each time. The narrower claim in the workflow file's header comment ("no gate in this repository ran the Vitest harnesses, installed a browser, or executed Playwright") is accurate. The candidate file needs no change; the evidence record should be corrected during reconciliation so the governance record is not wrong.

### NOTE

NOTE-1 — Correct Vitest collection depends on step order (build after tests) rather than on config excludes. The node project sets exclude explicitly, replacing Vitest's defaults, and .next/ is in neither project's exclude list. The workflow documents this and mitigates it correctly without touching PKG-2 config, but it is a fragile implicit contract: reordering the steps could silently pull build output into collection. Durable fix (.next/** in both excludes) belongs to the follow-up.

NOTE-2 — git diff --check HEAD -- adds no enforcement beyond the porcelain check that follows it: on a clean tree the diff is empty and it trivially passes; on a dirty tree the porcelain check would catch it anyway. Harmless, mildly redundant, and it changes which error message appears first.

NOTE-3 — Hygiene sensitivity is bounded by the pre-existing .gitignore breadth (*.log, local/, tmp/, temp/, .cache/, coverage/, *.zip) — probe-verified. Inherited, correctly out of scope here.

NOTE-4 — Hidden coupling to port 3100 via playwright.config.ts's E2E_PORT ?? 3100; the workflow does not set E2E_PORT. Fails closed if occupied (NC-4).

NOTE-5 — The e2e precondition hardcodes e2e/smoke.spec.ts. Legitimately renaming or replacing that file while adding others would red the build. Fail-closed and cheap to fix, but brittle.

NOTE-6 — The unit precondition requires playwright.config.ts although the unit job never uses Playwright. Harmless; slightly overreaching.

NOTE-7 — npm 11.16.0 emits allow-scripts advisories for four packages (@depot/cli, esbuild@0.23.1, sharp@0.34.5, unrs-resolver@1.12.2) in both CI and locally. I checked whether this meant install scripts were skipped, since that would change what CI proves: ignore-scripts is false, and ./node_modules/.bin/esbuild --version → 0.23.1, require('sharp') → OK (vips 8.17.3), require('unrs-resolver') → OK. No functional impact — these packages resolve their native artifacts through optional platform dependencies. Log noise only.

NOTE-8 — playwright install --with-deps installs unpinned Ubuntu OS packages on every run — an inherent, unavoidable supply-chain surface in Playwright's supported approach.

NOTE-9 — npm ci reports 42 vulnerabilities (1 critical, 19 high, 21 moderate, 1 low) and a deprecated tar@6.2.1. This workflow correctly does not audit (out of scope), but security.yml and dependencies.yml are main-only and have never run, so the posture is currently unenforced. Founder-visible; separate package.

NOTE-10 — package.json has neither engines nor packageManager. The npm 11.16.0 requirement exists only inside two CI job definitions. A developer cloning the repo gets no signal and will hit EUSAGE unexplained. Strongest argument for closing the lockfile follow-up promptly.

NOTE-11 — Repository is public with forking allowed. pull_request (not pull_request_target), no secrets, contents: read — correct posture; fork PRs obtain compute only. Note that for pull_request, the workflow definition executed comes from the merge ref, so a fork PR runs its own modified workflow — still tokenless and secretless. Standard accepted model.

NOTE-12 — Measured duplicate-execution cost: unit 78 s, e2e 83 s, running in parallel. Negligible.

NOTE-13 — The concurrency key omits event type, so workflow_dispatch and push on the same branch share a group and cross-cancel. Defensible (same ref, same commit); worth knowing before someone dispatches a manual run during a push run.

---
## 9. Finding counts

```
┌──────────┬───────┐
│ Severity │ Count │
├──────────┼───────┤
│ BLOCKER  │ 0     │
├──────────┼───────┤
│ MAJOR    │ 1     │
├──────────┼───────┤
│ MINOR    │ 5     │
├──────────┼───────┤
│ NOTE     │ 13    │
├──────────┼───────┤
│ Total    │ 19    │
└──────────┴───────┘
```

---
## 10. Is remediation required?

No remediation of the candidate file is required, and I do not recommend re-cutting the candidate.

- MAJOR-1 cannot be fixed in this file. Required status checks are a repository setting; the check must exist on the default branch before it can be marked required, so the correct sequence is merge first, then configure. Blocking on it would delay the merge that makes the fix possible.
- All five MINOR findings are quality and disclosure improvements, not defects that produce a false green. MINOR-1, MINOR-2 and MINOR-3 are three small, safe edits (ignore→warn; always()→!cancelled(); add next to the e2e binary loop). Batching them into the already-planned lockfile-hygiene package is preferable to re-freezing a candidate whose 16-run Linux evidence chain has been independently verified against a byte-identical tree — that evidence has real value and re-cutting discards it.
- MINOR-5 requires no code change, only a correction to the evidence record during reconciliation, which is the Coordinator's function.

---
## 11. Final verdict

▎ APPROVE WITH FINDINGS

The candidate is identity-verified, correctly scoped to exactly one additive file, fail-closed at every point I tested, least-privilege, strongly supply-chain-pinned, free of injection surface, and honest about its own limitations. Its Linux evidence is not merely reported but independently reproducible: the tree that executed on ubuntu-latest is byte-identical to the frozen candidate tree, and so is the tree of every one of the seven green restoration runs. Eight of nine negative controls are PROVEN on independent inspection; the ninth is partially proven, and I closed its gap myself by probe.

The one MAJOR finding is a repository-configuration gap, not a defect in the reviewed file, and it cannot be closed from within a workflow file.

---
## 12. Recommendation to the Main Coordinator and Founder

### To the Coordinator

1. Approve candidate-1f-pkg3-1 as the PKG-3 checkpoint and tag it per convention. Preservation and reconciliation are yours; this report is returned inline and was not written into the repository.
2. Correct MINOR-5 in the reconciliation record. The claim that all six pre-existing workflows are main-only is wrong: pr.yml fires on PRs to any branch and failed all 16 times on this candidate's own validation PR. The workflow file's narrower header claim is accurate and needs no change. Do not let the incorrect statement enter the governance record unqualified.
3. Fold MINOR-1, MINOR-2 and MINOR-3 into the lockfile-hygiene package as three small, safe edits rather than re-cutting this candidate.
4. Raise three separate packages, none of which should gate PKG-3: lockfile hygiene (package-lock.json regeneration + engines/packageManager, per NOTE-10 and answer B); pr.yml repair, since it will otherwise show red on every PR beside the new green check; and dependency-vulnerability posture (NOTE-9).
5. Note for the record that the designated review worktree did not exist and I created it detached at the candidate commit. It ends clean at b7386f05. Say the word and I will remove it.

### To the Founder

PKG-3 delivers something real: for the first time, this repository's 329 tests, its type check, its lint, its build, and a genuine browser smoke test all execute automatically on the branch you actually work on. Every claim the implementer made about that, I checked independently, and every one held — including the subtle one that mattered most, that the code Linux ran was byte-for-byte the code being approved.

Two things you should know plainly.

First, "enforce" is not yet literally true. The checks run, and they fail correctly when something is broken — I confirmed that eight different ways. But the repository has no branch protection and no required status checks, so a red run currently blocks nothing. Someone can merge straight past a failing build. Closing this is a five-minute settings change, and it has to happen after this merges (the check must exist before it can be required). Until then, treat the workflow as a reliable alarm, not a locked door.

Second, the npm pin is a stopgap, and it should not become permanent by default. Your lockfile cannot be installed by the npm that Node 22 ships with. That is a pre-existing defect — I reproduced its exact mechanism, and it predates both PKG-2 and PKG-3. The workflow works around it by pinning npm 11.16.0, and it says so in its own text rather than hiding it. But that requirement is written down only inside the CI file: package.json records no engines and no packageManager, so anyone cloning this repo hits an unexplained failure. Please prioritise the lockfile package.

The one place the implementer's evidence fell short is worth naming, because it is instructive: every negative control proved the hygiene check stays quiet when it should, but none proved it speaks up when it should. I tested that myself — it does, in both directions. Good validation habits, one blind spot, and the blind spot is now closed.

---
## 13. Closing confirmation

The candidate remained unchanged.

```
HEAD                                     b7386f0521f296a5411e77e15d4dd385eb65691d
HEAD^{tree}                              ca9cdc7e5a65e9b7b5624355f8f30dca92e769e5
git hash-object …/frontend-tests.yml     dc76857d8db6e4d9e0ebd4dc9f8711b823d27746
git rev-parse HEAD:….../frontend-tests.yml  dc76857d8db6e4d9e0ebd4dc9f8711b823d27746
git diff b7386f05… --stat                (empty — no divergence from the candidate commit)
```

All tags remained unmoved. 10 tags before, 10 after; candidate-1f-pkg3-1 → 30e0c057d2092719c4c91d8a2456cefbf676bbaf, peeling to b7386f05… / tree ca9cdc7e…. No tag was created, moved, or deleted. No approval tag was created. No commit, no push, no branch, no PR change. PR #2 remains CLOSED and unmodified. No other worktree was touched. No destructive negative control was re-run. No deferred or out-of-scope package was started.

Temporary probes were removed.
Inside the worktree, created and removed: probe-unexpected-file.txt, probe-ci-output.log, local/probe.txt (and the local/ directory), probe-only.test.ts. README.md was appended to and restored — git diff --quiet HEAD -- README.md confirms byte-identical restoration. git ls-files --others --exclude-standard → empty.
Outside every git tree, in the session scratchpad only: the checksum-verified actionlint 1.7.7 binary, six extracted script_*.sh files, and five downloaded CI logs. These touch no worktree and no repository.

The review worktree ends clean.

```
$ git status --porcelain --untracked-files=all
(no output)
```

Ignored build products (node_modules/, .next/, test-results/, next-env.d.ts, tsconfig.tsbuildinfo) remain on disk from the required validation runs and are correctly excluded — which is itself part of the evidence in section 6.13.

Review complete. Verdict: APPROVE WITH FINDINGS.
