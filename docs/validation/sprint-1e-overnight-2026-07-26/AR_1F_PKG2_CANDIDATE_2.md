# Architecture Review — Sprint 1F, PKG-2, Candidate 2 (`candidate-1f-pkg2-2`)

**Reviewer:** AGENT-019 Architecture Reviewer · fresh, independent session
**Worktree:** `C:\Users\evanj\Documents\Projects\savrio-review-pkg2r` (detached, read-only)
**Date:** 2026-07-26

> **Preservation note — written by the Main Coordinator, not by the reviewer.**
>
> Everything below this note is the **complete inline response as returned by the
> Architecture Reviewer**, preserved verbatim. The reviewer has no `Write` tool and
> wrote no file to disk; preservation is the Main Coordinator's duty, not the
> reviewer's. Custody before preservation was the reviewer transcript only.
>
> **This document is single-author reviewer material.** Coordinator reconciliation
> was briefly appended here beneath a `# Coordinator Reconciliation` heading and has
> since been moved, unaltered, to its own document —
> [`RECONCILIATION_1F_PKG2_CANDIDATE_2.md`](./RECONCILIATION_1F_PKG2_CANDIDATE_2.md) —
> so that no Coordinator-written material is presented as reviewer-authored. The
> reviewer's report was left byte-identical minus that appended block: it occupied
> lines 1–507 of the combined file and all 507 are retained here. No reviewer
> finding, count, command output, or clean-state proof was altered, summarized away,
> or overwritten.
>
> The companion gate report is
> [`ICR_1F_PKG2_CANDIDATE_2.md`](./ICR_1F_PKG2_CANDIDATE_2.md).

---

## 1. Candidate identity verification — PASS

| Check | Expected | Observed | Result |
|---|---|---|---|
| `git cat-file -t candidate-1f-pkg2-2` | annotated tag | `tag` | PASS |
| `git rev-parse candidate-1f-pkg2-2` | `aec584e310b094de93458b380b3e45eee0eb6600` | `aec584e310b094de93458b380b3e45eee0eb6600` | PASS |
| `git rev-parse candidate-1f-pkg2-2^{commit}` | `5c1fd6590160dd9bf41212868ed946bb9fb12123` | `5c1fd6590160dd9bf41212868ed946bb9fb12123` | PASS |
| `git rev-parse candidate-1f-pkg2-2^{tree}` | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` | PASS |
| `git rev-list -n 1 --parents …^{commit}` | parent `a3d8d194effd08e74394f38e2ee4388348e0b482` | `5c1fd659… a3d8d194effd08e74394f38e2ee4388348e0b482` | PASS |
| `git rev-parse HEAD` | candidate commit | `5c1fd6590160dd9bf41212868ed946bb9fb12123` | PASS |
| `git symbolic-ref -q HEAD` | non-zero (detached) | exit 1 → detached | PASS |
| `git status --porcelain -uall` (start) | empty | empty (0 entries) | PASS |

All four required values match. Worktree clean and detached at the candidate. `candidate-1f-pkg2-1` peels to `a3d8d194…` (tag object `3efca4b5…`), confirming the remediation baseline.

---

## 2. Changed paths and diffstat

### 2a. Cumulative — `6eefff7f60535ac602f8d62754bc8a560c87c838` → `5c1fd659…`

```
A	components/ui/primitives.test.tsx
A	e2e/smoke.spec.ts
M	package-lock.json
M	package.json
A	playwright.config.ts
A	test/setup-dom.ts
M	vitest.config.ts

 components/ui/primitives.test.tsx |  47 +++
 e2e/smoke.spec.ts                 |  22 ++
 package-lock.json                 | 660 ++++++++++++++++++++++++++++++++++++++
 package.json                      |   7 +-
 playwright.config.ts              |  36 +++
 test/setup-dom.ts                 |   9 +
 vitest.config.ts                  |  46 ++-
 7 files changed, 817 insertions(+), 10 deletions(-)
```

Seven paths. No production source, no ADR, no `standards/`, no `.github/`, no agent definitions.

### 2b. Remediation-only — `candidate-1f-pkg2-1` (`a3d8d194…`) → `candidate-1f-pkg2-2`

```
M	e2e/smoke.spec.ts
M	playwright.config.ts
M	vitest.config.ts

 e2e/smoke.spec.ts    | 10 +++++++++-
 playwright.config.ts | 16 ++++++++++++----
 vitest.config.ts     |  4 ++++
 3 files changed, 25 insertions(+), 5 deletions(-)
```

Five substantive changes: `exact: true` on the heading locator; `testMatch: "**/*.spec.ts"`; `trace: on-first-retry` → `retain-on-failure`; `reuseExistingServer: !process.env.CI` → `false`; explicit `exclude` on the Vitest node project.

### 2c. Lockfile, verified structurally (script executed, not eyeballed)

Comparing the `packages` maps of both revisions:

```
added: 47
removed: 0
version-changed: 0
changed (other than root ""): 0
added NOT marked dev: 0
```

All 47 additions carry `dev: true`. **Zero production runtime surface added.** No existing package changed version.

---

## 3. Validation results — literal commands and observed output

Environment re-established independently: `npm ci` → `NPM_CI_EXIT=0` (worktree still clean afterward). `npx vitest --version` → `vitest/4.1.10 win32-x64 node-v24.18.0`. Node v24.18.0, npm 11.16.0, Windows 11.

| # | Command | Observed | Exit |
|---|---|---|---|
| 1 | `npx vitest run --project node` | `Test Files 22 passed (22)` / `Tests 326 passed (326)` | 0 |
| 2 | `npx vitest run --project dom` | `Test Files 1 passed (1)` / `Tests 3 passed (3)` | 0 |
| 3 | `npx vitest run` | `Test Files 23 passed (23)` / `Tests 329 passed (329)` | 0 |
| 4 | `npx playwright test` | `1 passed (24.7s)` | 0 |
| 5 | `npx next build` | route table emitted, `○ /` static | 0 |
| 6 | `npx tsc --noEmit` | no output | 0 |
| 7 | `npx eslint .` | no output | 0 |
| 8 | `npm run lint` (`eslint`, no args) | no output | 0 |
| 9 | `git diff --check 6eefff7f… 5c1fd659…` | no output | 0 |
| 10 | `npx vitest list --filesOnly` | 23 files, one project label each | 0 |
| 11 | `npx playwright test --list` | `Total: 1 test in 1 file` | 0 |
| 12 | Final `npx vitest run` (restored tree) | `23 passed / 329 passed` | 0 |
| 13 | Final `npx playwright test` (restored tree) | `1 passed (24.6s)` | 0 |
| 14 | Final `git status --porcelain -uall` | empty | — |

**Count isolation and additivity: 22 + 1 = 23 files; 326 + 3 = 329 tests.** Exact. The pre-existing node baseline (326/22) is preserved unchanged.

### Pre-Playwright preconditions (checked, not assumed)

- `netstat -ano | findstr :3100` before the authoritative run → **no match, no listener**.
- `playwright.config.ts:27-35` read directly: `command: "npm run build && npx next start --hostname 127.0.0.1 --port 3100"`, `url: http://127.0.0.1:3100`, `reuseExistingServer: false`, `timeout: 300_000`.
- Behavioral proof of a genuine build-and-start, not inferred from duration:

```
BUILD_ID before: NojSyZbgIpDBrxxVwcJ3L   (mtime 2026-07-26 19:28:55)
BUILD_ID after:  BqZaMvY06E_rRg77Nntsd   (mtime 2026-07-26 20:39:30)
```

The build ID changed across the run. The suite rebuilt and served the app it tested.

### Negative controls (all executed by the reviewer)

**NC-1 — decoy on port 3100 serving an h1 that would satisfy even `exact: true`.**
Decoy served `<h1>Savrio Dev HQ</h1>`; `curl -i` returned `HTTP/1.1 200 OK` with that exact body; `netstat` showed `127.0.0.1:3100 LISTENING PID 38464`.

```
Error: http://127.0.0.1:3100 is already used, make sure that nothing is running
on the port/url or set reuseExistingServer:true in config.webServer.
NCA_EXIT=1
BUILD_ID before NC-1: HI4XMvCb3YH0IUGSrZ2D4
BUILD_ID after  NC-1: HI4XMvCb3YH0IUGSrZ2D4   (unchanged — no build, no test ran)
```

**FIRED.** Not defeatable by making the decoy look like the real app. Decoy killed; port verified free.

**NC-1b — squatter that 404s on `/` (evades Playwright's readiness probe).**

```
[WebServer] Error: listen EADDRINUSE: address already in use 127.0.0.1:3100
Error: Process from config.webServer was not able to start. Exit code: 1
NCB_EXIT=1
```

**FIRED — fail-closed.** The one route that could plausibly fail open does not. Squatter killed; port verified free.

**NC-2 — heading exactness, five constructed cases, run entirely outside the worktree** (`-c <scratchpad>/pwprobe.config.ts`, `page.setContent`, no webServer):

| Case | Page `h1` | Assertion | Required | Observed |
|---|---|---|---|---|
| 1 | `Savrio Dev HQ Dashboard` | candidate's, `exact: true` | FAIL | ✘ **FAILED** |
| 2 | `Savrio Dev HQ Dashboard` | candidate-1's, no `exact` | PASS | ✓ **PASSED** — reproduces the original false positive |
| 3 | `Savrio Dev HQ` | candidate's, `exact: true` | PASS | ✓ PASSED |
| 4 | `SAVRIO DEV HQ` | candidate's, `exact: true` | FAIL | ✘ **FAILED** (case sensitivity restored) |
| 5 | `   Savrio Dev HQ   ` | candidate's, `exact: true` | PASS | ✓ PASSED (whitespace still normalized) |

`3 passed / 2 failed`, exit 1 — exactly the required distribution. Case 1 vs case 2 on identical content is the side-by-side reproduction: the old locator passes where the new one fails. **The specific question — would `"Savrio Dev HQ Dashboard"` satisfy the assertion — is answered NO, proven by execution.**

**NC-3 — routing / single-collection proof.** Temporary probes created inside the worktree, then deleted:

| Probe file | Collected by |
|---|---|
| `e2e/zzprobe.test.ts` | **neither** (intended) |
| `e2e/zzprobe.test.tsx` | **`[dom]`** — boundary leak |
| `e2e/zzprobe.spec.tsx` | **neither** — silent drop |
| `lib/e2e/zznested.test.ts` | `[node]` — `e2e/**` is root-anchored |
| `.next/zzprobe.test.ts` | **`[node]`** |
| `.next/zzprobe.test.tsx` | **`[dom]`** |

On the clean tree, `npx vitest list --filesOnly` returns 23 lines, each with exactly one project label — **no file is collected twice**. With `e2e/zzprobe.test.ts` and `e2e/zzprobe.spec.tsx` present and executed by nothing, `npx vitest run` reported `26 passed / 332 passed`, exit 0, and `npx playwright test --list` reported `Total: 1 test in 1 file`. **Both gates went green while two test files existed and never ran.**

**NC-4 — did the remediation narrow Playwright's collection?** Same `e2e/` contents, two configs:

```
A) candidate-2 (testMatch: "**/*.spec.ts")     → Total: 1 test in 1 file
B) no testMatch (Playwright default = cand-1)  → Total: 3 tests in 3 files
     smoke.spec.ts · zzprobe.spec.tsx · zzprobe2.spec.mts
```

Confirmed: `testMatch` is a narrowing; `.spec.tsx` / `.spec.mts` under `e2e/` were collected before the remediation and are not now.

**NC-5 — Vitest default-exclude replacement.** Runtime constant read directly, not from JSDoc:

```
node_modules/vitest/dist/chunks/defaults.9aQKnqFk.js:6
const defaultExclude = ["**/node_modules/**", "**/.git/**"];
```

Isolated scratch project with `.git/probe.test.ts` + `src/real.test.ts`:

```
baseline (vitest defaults)      → [baseline] src/real.test.ts
candidate exclude array         → [candidate] .git/probe.test.ts
                                  [candidate] src/real.test.ts
```

**FIRED.** The narrowing is live, not theoretical.

**NC-6 — per-file environment docblock escape hatch.** A `.test.ts` carrying `// @vitest-environment jsdom` under a config with `environment: "node"` asserted `typeof document === "object"` and passed (2 files / 2 tests, `environment 2.65s` confirming jsdom loaded). The hatch exists — and bypasses `setupFiles`.

**NC-7 — `E2E_PORT` coercion, executed:**

```
undefined → Number(v ?? 3100) = 3100   Number(v || 3100) = 3100
""        → Number(v ?? 3100) = 0      Number(v || 3100) = 3100
"abc"     → Number(v ?? 3100) = NaN    Number(v || 3100) = NaN
"3200"    → 3200                        3200
```

---

## 4. Architectural assessment by inspection area

**1. Vitest project structure and ownership.** Sound. `vitest.config.ts:16-42` expresses one config with two named projects, each owning exactly one environment. `test.projects` is the correct Vitest 4 mechanism (`vitest.workspace.ts` was removed), and the comment at lines 8-12 states that accurately. The node project reproduces the baseline verbatim (`environment: "node"`, `include: ["**/*.test.ts"]`, `clearMocks`, `restoreMocks`) — verified by the preserved 326/22 count. Ownership is single and unambiguous per project.

**2. Node and DOM project isolation.** Verified isolated and additive. `npx vitest list --filesOnly` returns 23 lines, one project label each; no file appears twice. Double collection within Vitest is structurally impossible: `**/*.test.ts` and `**/*.test.tsx` are disjoint by suffix. `setupFiles: ["./test/setup-dom.ts"]` is scoped to the dom project only, so the node project's 326 tests cannot be perturbed by jsdom setup. Counts are exactly additive.

**3. Playwright lifecycle and server ownership.** Sound and materially improved. `reuseExistingServer: false` (`playwright.config.ts:33`) makes Playwright the sole owner of the server lifecycle — it always builds, always starts, never attaches. Both the recognised (NC-1) and unrecognised (NC-1b) forms of a pre-held port fail closed. `webServer.command` uses `&&`, so a failed build short-circuits and no server starts. Binding is `127.0.0.1`, not `0.0.0.0` — correct least-exposure default. The cost is that port 3100 is now an exclusive resource (see M-4).

**4. Exact heading assertion behavior.** Correct and load-bearing, proven by NC-2. `exact: true` at `e2e/smoke.spec.ts:19` converts the accessible-name match from case-insensitive substring to case-sensitive full-string (whitespace still normalized). The real heading — `components/dashboard/TopBar.tsx:37-39` — has text exactly `Savrio Dev HQ`, with the sibling `Mission Control` span deliberately *outside* it (lines 40-42), so the accessible name is exactly the asserted string. The assertion holds against the real DOM and rejects the superstring.

**5. Test-file collection and routing boundaries.** **The weakest dimension.** The routing contract is filename-keyed — `.test.ts` → node, `.test.tsx` → dom, `.spec.ts` under `e2e/` → Playwright — enforced in three separate places (`vitest.config.ts:22`, `:26`, `:36`, `playwright.config.ts:11-12`) with no single authority and no guard that any file was orphaned. Empirically the contract has two holes: `e2e/*.test.tsx` routes to the wrong runner (M-2), and `e2e/*.spec.tsx` / `*.spec.mts` route to none (M-1). The design goal stated at `vitest.config.ts:23-25` — "collected by neither runner instead of by both" — is the architectural root: *neither* is not a safe resting state, because nothing reports it. The safe rule is "exactly one, and anything else is an error."

**6. Package and lockfile scope.** Clean. `package.json` adds two devDependencies (`@testing-library/react ^16.3.2`, `jsdom ^29.1.1`) and three scripts (`test:node`, `test:dom`, `test:e2e`), preserving `test: "vitest run"` so ADR-0001's `npm test` contract still resolves to the full Vitest suite. Lockfile is 47 pure additions, all `dev: true`, zero version changes, zero removals. `@playwright/test` was already present at baseline.

**7. Configuration inheritance and duplication.** Acceptable. `resolve: { alias }` appears three times (`vitest.config.ts:14, 18, 32`); the author correctly hoisted it to a shared `const alias` at lines 4-6, so the duplication is by-reference, not by-value, and cannot drift. Project configs genuinely do not inherit root `resolve` in Vitest 4, so lines 18 and 32 are required. Line 14's root-level copy appears redundant once `projects` is set — the reviewer did **not** verify it is dead, and it is harmless either way. `clearMocks`/`restoreMocks` are duplicated by value across the two projects; a two-line drift surface, tolerable at this size.

**8. Windows and CI portability.** Verified on Windows only. `webServer.command` uses `&&`, valid in both `cmd.exe` and POSIX shells. Config paths are POSIX-style and relative; `path.resolve(__dirname, ".")` handles the alias portably. **The material gap is that nothing in `.github/workflows/` installs Playwright browsers or runs any test** — `grep -rn "playwright|npm test|vitest|test:e2e" .github/workflows/` returns no matches across all six workflow files. As delivered, the E2E suite is not CI-runnable without an added `npx playwright install --with-deps chromium` step. See N-1.

**9. Artifact and generated-file hygiene.** Clean. `.gitignore` covers `node_modules/`, `.next/`, `test-results/`, `playwright-report/`, `coverage/`, `*.tsbuildinfo`, `next-env.d.ts`. `reporter: "list"` produces no HTML report directory. `git status --porcelain --ignored=matching` after all runs shows only `.next/`, `next-env.d.ts`, `node_modules/`, `tsconfig.tsbuildinfo` — all ignored. `trace: retain-on-failure` writes into the ignored `test-results/`. No generated artifact appeared as untracked at any point.

**10. Future frontend-test extensibility.** Adequate for the immediate need (`docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:146` — "no `.tsx` collected, no Playwright config"), with known edges. The dom project has no Vite React plugin; fine for these tests, and JSX works because esbuild reads `tsconfig.json`'s `"jsx": "react-jsx"`. Testing a component that imports `next/font`, `next/image`, or `server-only` will need further configuration this package does not provide and did not need to. Adding a second browser project or a second E2E spec is a one-line change; adding a second *port* is not (M-4).

**11. Hidden coupling or architectural drift.** Three genuine instances, all minor. (a) The runner boundary is a string-keyed filename contract with no enforcement point (area 5). (b) The E2E assertion is coupled to the DOM *nesting* decision in `components/dashboard/TopBar.tsx` — a file the spec never names — so moving the `Mission Control` span inside the `h1` breaks it (N-2; fail-closed, correct direction). (c) The two Vitest projects now carry *different* exclusion semantics: node drops `**/.git/**`, dom inherits it. Drift inside a single 44-line file (M-3).

**12. Is the repaired false-positive E2E path genuinely closed?** **Yes — both halves, proven by execution, not by reading config.**
- *Can a run pass without building and starting the app?* No. Positive proof: `BUILD_ID` changed across a clean run. Negative proof: NC-1 refused a decoy engineered to satisfy even the exact assertion (exit 1, no build, no test). NC-1b closed the readiness-probe-evading variant (EADDRINUSE, exit 1).
- *Can the assertion pass against a heading that merely contains the words?* No. NC-2 case 1 fails where case 2 — the candidate-1 locator on identical content — passes.
- *Other routes searched:* zero-collection (Playwright errors `No tests found` and fails closed — the existing single spec cannot silently vanish); stale build (`&&` short-circuit + BUILD_ID evidence); retry masking (`retries: 0`); trace settings (inert with respect to pass/fail).
- *Residual:* the one remaining green-when-it-should-not-be path is M-1 — an *added* `.spec.tsx` never running. It cannot make a failing test pass; it can only make a new test not exist. Narrower than the defect that sank candidate 1, but the same family.

**13. Safe to become the approved frontend-test foundation?** **Yes.** It closes the defect it was created to close, preserves the 326-test baseline exactly, adds no production surface, and is honest in its comments — every load-bearing comment claim in the diff was tested and none overstates the code. Four MINOR findings should be scheduled; none blocks.

---

## 5. Independent assessment of the prior ICR

The ICR report is at `C:\Users\evanj\Documents\Projects\savrio-dev-hq\docs\validation\sprint-1e-overnight-2026-07-26\ICR_1F_PKG2_CANDIDATE_2.md`. **It is not present in the review worktree** — the path in the brief resolves only in the primary checkout, because the file was written after the candidate was frozen. The reviewer read it there, and formed every conclusion above from its own execution before reconciling.

**Overall: the ICR is accurate and unusually well-evidenced. All three MINOR findings were reproduced independently and confirmed. No severity disagreement. One finding extended, one added.**

### (a) DOM routing gap — ICR MINOR-2

**Agree: real, confirmed, acceptable follow-up. Not remediation-required.** Verified empirically (`[dom] e2e/zzprobe.test.tsx`), so this is a confirmed defect, not a hypothetical. Disposition rationale: a file under `e2e/` importing `@playwright/test` throws when `test()` is called outside the Playwright runner, so the failure is loud; one that imports Vitest is simply a misplaced unit test. It cannot produce a false green, and does not warrant a third candidate. The ICR's framing is sharpened from "breaks the stated symmetry" to: **the ownership boundary for `e2e/` has two enforcement points and only one is implemented.**

### (b) Dropped `**/.git/**` default exclusion — ICR MINOR-1

**Agree on severity and on the ICR's correction of the coordinator's framing; the finding is extended.** The runtime constant was read directly (`defaults.9aQKnqFk.js:6`) rather than the JSDoc, and the collection difference reproduced in an isolated project. Exactly one pattern is dropped: `**/.git/**`.

Answering the specific questions:
- *Can a test file exist under `.git` in practice?* Not in normal operation. The primary checkout's `.git/` holds 345 files; `find .git -name "*.test.ts*"` returns nothing. Git never writes working-tree source into `.git/`; rebase/merge state directories hold patches and messages, not `.ts` files.
- *Does Vitest's crawler follow `.git`?* **Yes** — `globFiles()` passes `dot: true`, so dot-directories are traversed and only the ignore list keeps `.git` out. Proven by the scratch probe.
- *Does it matter for CI or git internals?* No correctness consequence today. The cost is a directory walk over `.git` on every `vitest run`, negligible at 345 files and growing with history. In the review worktree it is inert entirely — `.git` there is a *file* (linked worktree), verified.

**Required disposition: acceptable follow-up, not remediation.** A **different fix than the ICR's** is recommended. The ICR recommends adding the single token `"**/.git/**"`. That closes today's gap and leaves the underlying fault open: a hand-maintained copy of an upstream default drifts silently on the next Vitest upgrade. The structural fix is to compose rather than replace — `[...configDefaults.exclude, "**/dist/**", "**/.next/**", "e2e/**"]` — applied to **both** projects. Same edit size, cannot drift.

### (c) The third MINOR — `E2E_PORT` coercion, ICR MINOR-3

**Agree it is real and MINOR; rationale raised and recommendation corrected.** The coercion was executed: `Number("" ?? 3100)` → `0`, `Number("abc" ?? 3100)` → `NaN`. The ICR's suggested `||` fixes the empty-string case but **not** the non-numeric case, which still yields `NaN` — both verified, so `||` is a partial fix and validation-and-throw is the complete one. The architectural weight is also higher than the ICR gave it: with `reuseExistingServer: false`, port 3100 is now an *exclusive* resource, and `E2E_PORT` is the only mechanism that lets this repository's own multi-worktree workflow run E2E concurrently. It is the one input to the harness with no validation.

### The eight NOTEs — brief pass

NOTE-1 (comment accuracy) — independently confirmed the `vitest.config.ts:23-25` and `playwright.config.ts:6-9` claims via NC-3; no comment overstates the code; **agree**. NOTE-2 (smoke test exercises prerendered HTML, not hydration) — confirmed independently: `npx next build` output marks `/` as `○ (Static)`; **agree**, and agree it is not a defect since the spec claims only to prove the harness works. NOTE-3 (nothing in CI runs any test) — confirmed; **elevated**, see N-1. NOTE-4 (`forbidOnly` inert) — **agree**. NOTE-5 (`fullyParallel` + `workers: 1`) — agree factually but **extended**: not inert with respect to the future, see N-5. NOTE-6 (missing `handbooks/INDEPENDENT_CODE_REVIEWER.md`) — confirmed absent, but **already tracked** as dependency **D-8** at `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:144`, so record against D-8 rather than as a new item. NOTE-7 (trace artifacts contained) — confirmed; the NC-2 run generated `test-results/` and `git status -uall` stayed clean. NOTE-8 (`e2e/**` root-anchored) — confirmed by probe (`lib/e2e/zznested.test.ts` → `[node]`); **agree** it is almost certainly intended.

**What the ICR missed:** the Playwright `testMatch` narrowing (M-1) — the one new finding here, and the one most closely related to the defect the candidate exists to fix. MINOR-1 is also extended with the misaimed-exclude half (M-3).

**What was not adopted from the ICR:** its security attribution (0 of 47 added packages carry an advisory). `npm audit` was not run and that claim was not verified.

---

## 6. Findings

### BLOCKER — none.

No finding meets the handbook's BLOCKER bar (`handbooks/ARCHITECTURE_REVIEWER.md:368-374`): no data loss or exposed secret, no broken core invariant, no illegal state transition, no ADR violation on a reachable path, no traced concurrency/replay/recovery fault, no partially-present deferred scope.

### MAJOR — none.

### MINOR

**M-1 — `playwright.config.ts:12` narrows Playwright's collection and creates a silent-omission class that did not exist in candidate 1. CONFIRMED. (Not reported by the ICR.)**

```ts
  testDir: "./e2e",
  testMatch: "**/*.spec.ts",
```

*Why it matters.* Playwright's default `testMatch` covers `spec` and `test` with `.ts/.tsx/.js/.jsx/.mts/.cts`. Replacing it with `**/*.spec.ts` means a future `e2e/foo.spec.tsx` — the natural filename for any spec containing JSX, and the Playwright convention for component tests — is collected by Playwright (no), the Vitest node project (no, `e2e/**` excluded), or the dom project (no, `.tsx` but not `.test.tsx`). It is executed by nothing. Proven: with `e2e/zzprobe.spec.tsx` present, `npx playwright test --list` reported `Total: 1 test in 1 file` and `npx vitest run` reported `26 passed`, exit 0. **Two gates reported success while a test file sat in the repository and never ran, and nothing said so.** The narrowing is also a regression: under the candidate-1 config shape (no `testMatch`), the same directory yields `Total: 3 tests in 3 files`. It cannot turn a red test green; it can only make an added test silently not exist.

*Constraint.* No ADR or standard governs test-file routing — `docs/decisions/` contains only ADR-0001 and ADR-0002, on the execution manager and review/escalation. **No ADR violation is asserted.** The constraint is the config's own stated invariant at `playwright.config.ts:6-9`: *"a file placed here with a `.test.ts` suffix is collected by neither runner rather than by both."* From first principles: "collected by neither" is safe only when something detects it. Nothing here does.

*Safest direction.* `testMatch: "**/*.spec.?(c|m)[jt]s?(x)"` — preserves the anti-double-collection intent, since the Vitest node project's `e2e/**` exclusion is what actually prevents double collection, not the suffix. Stronger form: a node-project unit test asserting every file under `e2e/` matches `*.spec.*` and no `*.test.*` exists there.

*Required verification.* Create `e2e/probe.spec.tsx`; `npx playwright test --list` must report 2 tests in 2 files (it reports 1 today). Delete the probe and confirm `Total: 1`.

*Disposition:* follow-up register, highest priority of the four.

---

**M-2 — `vitest.config.ts:31-41`: the `dom` project has no `e2e/**` exclusion, so the `e2e/` ownership boundary is enforced in only one of the two places it must hold. CONFIRMED. (= ICR MINOR-2; agree.)**

```ts
      {
        resolve: { alias },
        test: {
          name: "dom",
          environment: "jsdom",
          include: ["**/*.test.tsx"],
          setupFiles: ["./test/setup-dom.ts"],
```

*Why it matters.* `e2e/probe.test.tsx` is collected as `[dom] e2e/zzprobe.test.tsx` — verified. A file the config declares as Playwright's is executed by Vitest. If it imports `@playwright/test`, `test()` throws outside the Playwright runner, so it fails loudly; if it imports Vitest, it is a misplaced unit test that runs successfully in the wrong directory. Neither produces a false green — hence MINOR.

*Constraint.* The config's own stated invariant at `vitest.config.ts:23-25`: *"e2e/ belongs to Playwright. Excluded explicitly rather than relying on the `.spec.ts` suffix alone."* Written once, applied once, in the node project only.

*Safest direction.* Give the dom project the same exclusion, composed rather than replaced (see M-3), so both projects share one exclusion policy.

*Required verification.* Create `e2e/probe.test.tsx`; `npx vitest list --filesOnly` must not list it under any project. Today it lists `[dom] e2e/probe.test.tsx`.

*Disposition:* follow-up register; closed as a side effect of M-3's fix.

---

**M-3 — `vitest.config.ts:26`: the node project's exclude list replaces Vitest's defaults, drops `**/.git/**`, adds `**/dist/**` for a directory this project never produces, and omits `**/.next/**`, which it does. CONFIRMED. (Extends ICR MINOR-1.)**

```ts
          exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
```

*Why it matters.* Four verified consequences:
1. Vitest's `exclude` replaces rather than extends. The runtime default in the pinned 4.1.10 is `["**/node_modules/**", "**/.git/**"]` (`node_modules/vitest/dist/chunks/defaults.9aQKnqFk.js:6`, read directly). Exactly one pattern is dropped: `**/.git/**`. The crawler globs with `dot: true`, so the narrowing is live — the isolated probe collected `.git/probe.test.ts` under the candidate array and not under the defaults. Present-day exposure is nil (primary `.git/` holds 345 files, none matching `*.test.ts*`; in the linked review worktree `.git` is a file), so today's cost is a directory walk that grows with history.
2. `**/dist/**` excludes nothing. There is no `dist/` directory and Next builds to `.next/`. Dead configuration that reads as if build output is covered.
3. `.next/` is excluded by neither project. Verified both collect from it: `[node] .next/zzprobe.test.ts` and `[dom] .next/zzprobe.test.tsx`, with `npx vitest run` counting them green. This is **pre-existing** — the baseline config did not exclude `.next` either — so it is **not** reported as introduced. It becomes active if `output: "standalone"` is ever set in `next.config.ts` (currently empty), because `.next/standalone/` contains a copy of the app tree including colocated tests; every node test would then be collected twice from two roots.
4. The two projects now carry **different** exclusion semantics — node drops `**/.git/**`, dom keeps it. Drift inside one 44-line file.

*Constraint.* No written standard governs Vitest exclusions. From first principles: a hand-copied duplicate of an upstream default is a drift surface that fails silently on upgrade, and an exclude list should name the directories the project actually produces.

*Safest direction.* Compose instead of replace, in **both** projects:

```ts
import { configDefaults } from "vitest/config";
exclude: [...configDefaults.exclude, "**/dist/**", "**/.next/**", "e2e/**"],
```

Same edit size as adding `"**/.git/**"`, closes all gaps, restores symmetry, cannot drift on upgrade. Recommended over the ICR's single-token fix for that reason.

*Required verification.* In a scratch project, create `.git/probe.test.ts` and `.next/probe.test.ts`; `vitest list --filesOnly` must collect neither (today it collects both). Re-run `npx vitest run --project node` and confirm the count is still exactly 326/22.

*Disposition:* follow-up register.

---

**M-4 — `playwright.config.ts:3`: `E2E_PORT` is unvalidated, and it is now the only escape from an exclusive port. CONFIRMED (arithmetic); downstream failure mode PLAUSIBLE, not executed. (= ICR MINOR-3; agree on severity, different rationale, corrected fix.)**

```ts
const PORT = Number(process.env.E2E_PORT ?? 3100);
```

*Why it matters.* `??` catches `null`/`undefined` but not `""`. Executed: `Number("" ?? 3100)` → `0`; `Number("abc" ?? 3100)` → `NaN`. The resulting `baseURL` is `http://127.0.0.1:0` or `…:NaN`. Playwright was **not** run with either value, so the downstream outcome is **plausible, not confirmed**; both should fail closed at connection or bind time. The architectural weight is the second half: `reuseExistingServer: false` makes port 3100 exclusive, and NC-1b shows a collision is a hard `EADDRINUSE` failure. This repository is worked in several concurrent worktrees (`savrio-impl-pkg2`, `savrio-review-pkg2`, `savrio-review-pkg2r`, `savrio-impl-ar2-6` all exist side by side), so `E2E_PORT` is the only mechanism that lets two of them run E2E at once — and it is the one harness input with no validation.

*Constraint.* No written standard applies. From first principles: a configuration input that is the sole escape hatch from an exclusive resource should fail with a clear message on bad input, not coerce to `0`/`NaN`.

*Safest direction.* Validate rather than swap the operator — `||` fixes `""` but leaves `"abc"` → `NaN`:

```ts
const raw = process.env.E2E_PORT;
const PORT = raw === undefined || raw === "" ? 3100 : Number(raw);
if (!Number.isInteger(PORT) || PORT < 1 || PORT > 65535) {
  throw new Error(`E2E_PORT must be an integer 1-65535, received ${JSON.stringify(raw)}`);
}
```

*Required verification.* `E2E_PORT="" npx playwright test --list` and `E2E_PORT=abc npx playwright test --list` must fail with the explicit message; `E2E_PORT=3200 npx playwright test` must pass and bind 3200.

*Disposition:* follow-up register.

### NOTE

**N-1 — No CI gate runs any test, and nothing installs Playwright browsers. Pre-existing in part; out of PKG-2's authorized scope; recorded as out-of-scope discovery.** `grep -rn "playwright|npm test|vitest|test:e2e" .github/workflows/` returns **no matches** across all six workflow files. `ci.yml:335-363` runs lint, `tsc --noEmit`, and `npm run build` only. The 326 pre-existing node tests, the 3 new dom tests, and the E2E suite are enforced by no automated gate — which is also what makes M-1's silent omission undetectable outside a human running commands locally. The `npm test`-unwired half is pre-existing (`test: "vitest run"` existed at `6eefff7f`) and `.github/workflows/*` is outside PKG-2's authorized paths, so declining to fix it here is **correct scope discipline**, not a gap in the work. The browser-install half is newly relevant because PKG-2 introduces the Playwright config. No ADR violation is asserted: ADR-0002:330 — *"Full suite green (tsc, lint, tests, production build) after each task"* — is a per-task discipline, not a CI requirement. `standards/TESTING_STANDARD.md` expects "Tests pass" in CI. **Needs its own authorization; discovery is not approval.**

**N-2 — The E2E assertion is coupled to a DOM nesting decision in a file the spec never names.** The `h1` at `components/dashboard/TopBar.tsx:37-39` reads exactly `Savrio Dev HQ` only because the `Mission Control` span at lines 40-42 sits *outside* it. Moving that span inside the heading — a plausible markup refactor with no user-visible change — makes the accessible name `Savrio Dev HQ Mission Control` and breaks the smoke test. Fail-closed and the intended trade. Recorded so no future maintainer "repairs" it by deleting `exact: true`, which would reinstate the candidate-1 defect. The comment at `e2e/smoke.spec.ts:11-14` should be treated as load-bearing documentation.

**N-3 — Environment selection is keyed on file extension; the per-file escape hatch bypasses the DOM setup file.** `.test.ts` → node, `.test.tsx` → jsdom is a filename contract, not an intent contract. An escape hatch exists and works — verified that `// @vitest-environment jsdom` in a `.test.ts` under an `environment: "node"` config runs with a real `document`. But `setupFiles` are per-project, so a `.test.ts` using that hatch with Testing Library gets **no** `cleanup()` between tests — precisely the failure `test/setup-dom.ts:7-9` exists to prevent. Worth one line of documentation if the hatch is ever used.

**N-4 — `e2e/**` at `vitest.config.ts:26` is root-anchored, unlike its `**/`-prefixed neighbours.** Verified: `lib/e2e/zznested.test.ts` → `[node]`. Almost certainly intended; recorded for maintainer awareness. (= ICR NOTE-8.)

**N-5 — `fullyParallel: true` with `workers: 1` is a no-op today but a latent constraint, not inert.** `playwright.config.ts:13,16`. The moment `workers` is raised, `fullyParallel` makes specs run concurrently against a **single** hardcoded port and a **single** shared `.next` build directory. Those are the two things that break first at scale, and they break together. Not premature work today at one spec; flagged so whoever raises `workers` knows what else must change. (Extends ICR NOTE-5.)

**N-6 — `forbidOnly: !!process.env.CI` is currently unreachable** because Playwright never runs in CI (N-1). A stray `test.only` would silently narrow the suite locally. Harmless at one test. (= ICR NOTE-4.)

**N-7 — Dependency-ledger traceability for `jsdom`.** `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:143` records **D-6** — *"new dependencies (auth, web-push, jsdom)"* — as ❌ OPEN. The candidate adds `jsdom@^29.1.1`. D-6's own *Blocks* column lists 1F-6, 1F-10, 1F-19 — **not** 1F-18 (frontend test infrastructure) — so the entry package does not gate this work on D-6, and no governance breach is reported. But the committed tree will contain a dependency the ledger still lists as an open decision. Recommend recording D-6's jsdom leg as discharged by PKG-2's authorization. Routed to the Coordinator/Founder as a recommendation.

**N-8 — Missing role documentation is already tracked.** `handbooks/INDEPENDENT_CODE_REVIEWER.md` is absent (confirmed), as the ICR noted. This falls under existing dependency **D-8** — *"missing handbooks and standards, ❌ OPEN"* — at `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:144`. Record against D-8 rather than opening a new item. The reviewer's own governing documents (`agents/architecture-reviewer/AGENT.md`, `handbooks/ARCHITECTURE_REVIEWER.md`) both exist and were read.

**N-9 — Artifact hygiene verified clean, with evidence.** Every generated artifact produced during this review (`node_modules/`, `.next/`, `test-results/`, `tsconfig.tsbuildinfo`, `next-env.d.ts`) is gitignored; `git status --porcelain -uall` returned zero entries at every checkpoint. `reporter: "list"` never produces `playwright-report/`. No artifact leaked into the candidate.

---

## 7. Finding counts

| Severity | Count |
|---|---|
| **BLOCKER** | **0** |
| **MAJOR** | **0** |
| **MINOR** | **4** (M-1 new · M-2 = ICR MINOR-2 · M-3 extends ICR MINOR-1 · M-4 = ICR MINOR-3) |
| **NOTE** | **9** |

---

## 8. Is remediation required?

**No.** No blocker, no major. All four MINOR findings are quality, consistency, and operability issues. None lies on the false-positive path this candidate exists to close; none can alter production runtime behavior (all 47 added packages are dev-only); none can turn a failing test green. M-1 is the closest to consequential, and its worst case is that a *newly added* spec with an unused filename extension does not run — it cannot suppress an existing failure, and the existing spec cannot silently vanish because Playwright fails closed on zero collection.

Forcing a third candidate for these would trade a proven-good foundation for four one-to-three-line edits, each carrying its own regression risk against a baseline that is currently exactly 326/22 + 3/1. Under the F-A7 freeze policy (`docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:554`), these belong in a follow-up package.

**Recommended for the follow-up register, in priority order:** M-1 (widen `testMatch`), M-3 (compose exclusions from `configDefaults` in both projects — this also closes M-2), M-2 (if not folded into M-3), M-4 (validate `E2E_PORT`), then N-1 as a separately authorized CI package.

---

## 9. Final verdict

# APPROVE WITH FINDINGS

*(Architecture Reviewer handbook equivalent, `handbooks/ARCHITECTURE_REVIEWER.md:420`: **PASS WITH NON-BLOCKING FOLLOW-UPS**.)*

**BLOCKER 0 · MAJOR 0 · MINOR 4 · NOTE 9.** Nothing prevents commit.

**Exact conditions that would change this to REJECT — REMEDIATION REQUIRED:** evidence that a `.spec.tsx`/`.spec.mts` E2E file is already planned for Sprint 1F Track B (making M-1's silent omission active rather than latent); a demonstrated path by which any MINOR finding produces a green run that should be red; or a decision to enable `output: "standalone"` in `next.config.ts` this sprint (making M-3's duplicate-collection hazard active). None is true today.

---

## 10. Recommendation to the Main Coordinator and Founder

**Approve `candidate-1f-pkg2-2` as the frontend-test foundation and commit it.**

It does what it was authorized to do. `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md:146` records the gap as *"`vitest.config.ts` is `environment: "node"`, `include: ["**/*.test.ts"]`; no `.tsx` collected, no Playwright config."* The candidate collects `.tsx` in an isolated jsdom project, adds a Playwright config, and preserves the node baseline at exactly 326/22 — measured, not asserted. Line 475 of the same document makes this a prerequisite for Track B step 10; that prerequisite is now met.

The remediation's central claim is true and was proven independently rather than accepted: the E2E suite cannot pass without building and starting the app (BUILD_ID evidence plus two decoy controls that both fail closed), and the heading assertion genuinely discriminates against a superstring (the candidate-1 locator passes on content where the candidate-2 locator fails).

Three items for the Founder, none blocking this commit:

1. **Authorize a CI package (N-1).** Highest-value follow-up by a wide margin. PKG-2 has built test capability that no gate enforces — no workflow runs `npm test`, none runs Playwright, none installs a browser. Until that is wired, every finding in this review and the ICR's depends on a human remembering to run commands. `.github/workflows/*` is outside PKG-2's envelope and needs its own authorization.
2. **Schedule the four MINOR findings as one small follow-up package.** M-3's composed-exclusion fix closes M-2 as a side effect, so the whole set is roughly four lines across two files.
3. **Record D-6's jsdom leg as discharged (N-7)**, so the dependency ledger stops listing as OPEN a dependency the committed tree now contains.

One process observation, as a recommendation and not a re-litigation: the ICR for this candidate was delivered inline because the reviewer's configuration prohibits writing report files while the coordinator's brief instructed it to write one. That has now cost a recovery-and-transcription step, and the same brief pattern was issued to this reviewer. Worth fixing in the brief template rather than in the agents.

---

## 11. Candidate and tag integrity — unchanged

No edit was performed to any tracked file, and no `add`, `commit`, `stash`, `reset`, `checkout <branch>`, `tag`, or any other mutating git command was run. Every git command run was `status`, `diff`, `log`, `show`, `rev-parse`, `rev-list`, `cat-file`, `ls-files`, or `tag -l`.

**Probes created inside the worktree and deleted:** `e2e/zzprobe.test.ts`, `e2e/zzprobe.test.tsx`, `e2e/zzprobe.spec.tsx`, `e2e/zzprobe2.spec.mts`, `lib/zznested-e2e-dir-probe.test.ts`, `lib/e2e/` (directory), `.next/zzprobe.test.ts`, `.next/zzprobe.test.tsx`, `zznotestmatch.config.ts`, `test-results/`. All removed. Everything else — decoy server, 404 squatter, heading-exactness probe config and spec, `.git` exclusion scratch project, lockfile comparison — lived under the session scratchpad. A temporary directory junction was created from the scratchpad to the worktree's `node_modules` so the heading probe could resolve `@playwright/test` without living in the worktree; it was removed with `DirectoryInfo.Delete()` (link-only removal, `LinkType=Junction`, `ExistsAfter=False`), target intact at 538 entries.

**Final evidence:**

```
$ git status --porcelain -uall
(no output — 0 entries)

$ git rev-parse HEAD
5c1fd6590160dd9bf41212868ed946bb9fb12123

$ git rev-parse HEAD^{tree}
2804e06ec495f976aa6cf86e45ea83ae9bbab904

$ git rev-parse candidate-1f-pkg2-2          → aec584e310b094de93458b380b3e45eee0eb6600
$ git rev-parse candidate-1f-pkg2-2^{commit} → 5c1fd6590160dd9bf41212868ed946bb9fb12123
$ git rev-parse candidate-1f-pkg2-2^{tree}   → 2804e06ec495f976aa6cf86e45ea83ae9bbab904
$ git rev-parse candidate-1f-pkg2-1          → 3efca4b50c9a1b7a2d2e5bbed90ae0b594f66ec8
$ git rev-parse candidate-1f-pkg2-1^{commit} → a3d8d194effd08e74394f38e2ee4388348e0b482
$ git cat-file -t candidate-1f-pkg2-1        → tag
$ git cat-file -t candidate-1f-pkg2-2        → tag
$ git tag -l
candidate-1f-ar2-6-1  candidate-1f-pkg2-1  candidate-1f-pkg2-2  candidate-1f-tracka-1
sprint-1e-baseline  sprint-1e-remediated  sprint-1f-ar2-6-approved  sprint-1f-tracka-approved

$ git diff --check      → exit 0
$ ls e2e/               → smoke.spec.ts
$ netstat :3100 LISTENING → no listener (all decoys terminated)
```

Both tags unmoved and still annotated; HEAD and tree byte-identical to the start of review. Remaining on disk: the gitignored `node_modules/`, `.next/`, `next-env.d.ts`, `tsconfig.tsbuildinfo`. No other worktree or the primary repo was modified; `ICR_1F_PKG2_CANDIDATE_2.md` was read from the primary checkout read-only. No report file was written to disk by the reviewer.

---

## What the reviewer did NOT verify — explicitly UNVALIDATED

- **CI execution — NOT PERFORMED.** No GitHub Actions workflow was run. N-1 rests on reading all six files in `.github/workflows/` and on a grep returning no matches, not on an observed run.
- **Non-Windows platforms — NOT PERFORMED.** Everything ran on Windows 11 / Node v24.18.0. `webServer.command`, `next start` binding, and the "already used" refusal are Windows-verified only. `ci.yml:298` names `ubuntu-latest` with Node 22; unverified.
- **Browsers other than Chromium — NOT PERFORMED.** One project declared; Chromium only.
- **Security posture / `npm audit` — NOT RUN.** `npm ci` reported `42 vulnerabilities (1 low, 21 moderate, 19 high, 1 critical)`; these were not attributed to baseline versus added packages, and the ICR's attribution was not verified. Verified only that all 47 added lockfile entries carry `dev: true`, so none enters the production bundle.
- **`E2E_PORT` end-to-end (M-4) — NOT PERFORMED.** Coercion arithmetic executed in isolation only; Playwright was not run with `E2E_PORT=""` or `E2E_PORT=abc`. Downstream failure mode is labeled plausible, not confirmed.
- **Flake rate — NOT ESTABLISHED.** Two full clean E2E runs (24.7s, 24.6s) plus control invocations. Candidate 1 also passed repeatedly, which is why the conclusions rest on negative controls rather than repetition.
- **Whether the root-level `resolve: { alias }` at `vitest.config.ts:14` is dead — NOT TESTED.** Harmless either way.
- **The 660-line lockfile diff line by line — NOT READ.** The two revisions were compared structurally with a purpose-written script, which is stronger for the questions asked but would not catch a hand-edited integrity hash.
- **One measurement anomaly, disclosed.** The first probe of `.next/` collection appeared to show the files were *not* collected. Two subsequent runs, including one listing the probe files by name, showed `[node] .next/zzprobe.test.ts` and `[dom] .next/zzprobe.test.tsx`. The first observation could not be explained (likely a stale directory read or Vite cache) and was not chased. M-3 reports the reproduced result; treat the single contrary observation as unexplained rather than as evidence either way.

Every command result reported above came from a command the reviewer actually executed in its session. Nothing is inferred or fabricated.
