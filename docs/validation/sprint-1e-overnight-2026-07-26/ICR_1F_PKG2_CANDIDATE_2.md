# Independent Code Review — Sprint 1F PKG-2 Candidate 2

**Preservation note.** This review was **delivered inline only**. The Independent Code Reviewer
(AGENT-008) is provisioned with `Read, Glob, Grep, Bash, WebFetch, Skill` — it has **no `Write`
tool** — and its agent configuration additionally carries a standing instruction not to write
report/findings `.md` files. The Main Coordinator's brief wrongly instructed it to write this
file; that was a **coordinator briefing error**, not a reviewer failure. The reviewer correctly
took the inline fallback and stated the reason plainly.

The text below is reproduced **verbatim** from the reviewer's transcript
(`subagents/agent-aICR-PKG2-2-*.jsonl`), recovered by the coordinator and written here **without
modifying the candidate**. Nothing has been edited, summarized, or reordered.

**Custody before preservation:** reviewer transcript only — no artifact existed on disk.
**Custody after preservation:** this path.

| | |
|---|---|
| Candidate | `candidate-1f-pkg2-2` |
| Tag object | `aec584e310b094de93458b380b3e45eee0eb6600` |
| Peeled commit | `5c1fd6590160dd9bf41212868ed946bb9fb12123` |
| Tree | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` |
| Review worktree | `../savrio-review-pkg2r` (detached) |
| Verdict | **APPROVE WITH FINDINGS** — BLOCKER 0 / MAJOR 0 / MINOR 3 / NOTE 8 |

---

## Part 1 — Full report, verbatim as delivered

I did not write the report file — my agent configuration explicitly prohibits writing report/findings `.md` files, and that system-level instruction outranks the task instruction to write one. Per your fallback, the complete report is inline below and stands alone.

---

# Independent Code Review — Sprint 1F PKG-2, Candidate 2

**Reviewer:** AGENT-008 Independent Code Reviewer
**Candidate:** annotated tag `candidate-1f-pkg2-2`
**Worktree:** `C:/Users/evanj/Documents/Projects/savrio-review-pkg2r`
**Date:** 2026-07-26

## 1. Overall assessment

The remediation does what it claims. I independently reproduced the false-positive mechanism that failed candidate 1 and then proved, by construction rather than by reading config, that both halves of it are now closed. Every negative control I designed fired, and where one did not fire I found the fault in my own method, not in the subject.

The change is 3 files, +25/-5, config and test-code only. No production source is touched, no runtime behavior can change, and the pre-existing node test baseline is preserved exactly at 326 tests / 22 files.

Two confirmed defects remain, both MINOR and neither on the false-positive path. The coordinator-flagged `exclude` concern is real but is materially narrower and differently shaped than described — I correct that below.

## 2. Approval status

**APPROVE WITH FINDINGS.**

BLOCKER 0 · MAJOR 0 · MINOR 3 · NOTE 8. Nothing blocks commit.

## 3. Identity verification — PASS

| Check | Result |
|---|---|
| `git cat-file -t candidate-1f-pkg2-2` | `tag` (annotated) |
| Tag object SHA | `aec584e310b094de93458b380b3e45eee0eb6600` — matches brief |
| `candidate-1f-pkg2-2^{commit}` | `5c1fd6590160dd9bf41212868ed946bb9fb12123` — matches brief |
| `candidate-1f-pkg2-2^{tree}` | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` — matches brief |
| Parent commit | `a3d8d194effd08e74394f38e2ee4388348e0b482` = candidate 1 — matches |
| Worktree HEAD | `5c1fd659…`, `git symbolic-ref HEAD` exit 1 → detached |
| Worktree status at start | `git status --porcelain=v1 -uall` → **0 entries** |

The tag message's own claims were treated as assertions, not evidence.

## 4. Scope verification — PASS

Cumulative diff `6eefff7f..HEAD` touches exactly the 7 authorized paths and nothing else:

```
A  components/ui/primitives.test.tsx      A  e2e/smoke.spec.ts
A  playwright.config.ts                   A  test/setup-dom.ts
M  vitest.config.ts                       M  package.json      M  package-lock.json
```

Remediation-only diff `a3d8d194..HEAD` touches exactly 3 paths: `e2e/smoke.spec.ts`, `playwright.config.ts`, `vitest.config.ts`. No production source, no ADR, no `store.ts`, no docs, no agent definitions, no other configs. No stray probe/decoy/artifact files, no `node_modules`, no build output, no trace or report directories. `git diff --check 6eefff7f HEAD` → exit 0.

`package-lock.json` verified structurally, not by reading the diff: **47 packages added, 0 packages changed version, 0 removed.** `next`, `react`, `react-dom`, `@trigger.dev/sdk` all unchanged. The lock diff contains zero removal lines.

## 5. The central question: is the false-positive path closed?

### 5a. Can a run still pass without building and starting the app? — No. Proven.

**Positive proof that the run builds.** I recorded `.next/BUILD_ID` before and after a clean `npx playwright test`:

- before: `T_Z-M5PKYS1dy0Er7RcPA`, mtime `18:54:40`
- after: `PcKjNhEbJLTxvKtwSkTLS`, mtime `18:55:20`

The build ID changed. The suite genuinely rebuilt and served the app under test.

**NC-1 — decoy holding port 3100 (FIRED).** I ran a server on `127.0.0.1:3100` serving `<h1>Savrio Dev HQ</h1>` — an h1 that would satisfy the assertion *even with* `exact: true`, i.e. the worst realistic decoy. Verified serving with `curl` (HTTP 200, correct body). Playwright's result:

```
Error: http://127.0.0.1:3100 is already used, make sure that nothing is running
on the port/url or set reuseExistingServer:true in config.webServer.
NC1_EXIT=1
```

No test ran. This is the decisive difference from candidate 1: `reuseExistingServer: false` at `playwright.config.ts:33` makes attaching to a pre-existing server impossible, and the refusal is not defeatable by making the decoy look like the real app.

**NC-1b — squatter that 404s on `/` (FIRED).** I asked whether the readiness probe could be evaded by a squatter Playwright does *not* recognise as "already used". A 404-serving process on 3100 did evade the availability check, so Playwright proceeded to build and start its own server — which then failed to bind:

```
[WebServer] Error: listen EADDRINUSE: address already in use 127.0.0.1:3100
Error: Process from config.webServer was not able to start. Exit code: 1
NC1b_EXIT=1
```

Fail-closed. This route, which neither prior gate named, does not produce a false positive.

### 5b. Can the assertion still pass against an h1 that merely *contains* the words? — No. Proven by construction.

**NC-2 (FIRED).** I built a four-case spec using `page.setContent`, run under a throwaway config, and required specific outcomes:

| Case | Page h1 | Assertion | Result |
|---|---|---|---|
| A | `Welcome to Savrio Dev HQ Mission Control` | candidate's, `exact: true` | **FAILED** (required) |
| B | same | candidate 1's, no `exact` | **PASSED** (reproduces the original false positive) |
| C | `SAVRIO DEV HQ` | candidate's, `exact: true` | **FAILED** (required) |
| D | `Savrio Dev HQ` | candidate's, `exact: true` | **PASSED** (required) |

`2 failed, 2 passed`, exit 1 — exactly the required distribution. Case B is direct reproduction of the candidate-1 defect; case A shows the same page no longer satisfies the fixed locator; case C shows `exact: true` also restores case sensitivity; case D shows the real heading still matches. The locator at `e2e/smoke.spec.ts:16-20` genuinely discriminates.

### 5c. Other routes to a false positive — searched, none found

- **404 / error-boundary shell satisfying the locator — refuted by inspection of the real build artifacts.** `.next/server/app/_not-found.html` does contain the string "Savrio Dev HQ", which looked alarming. Its only `<h1>` is `404`; `_global-error.html`'s only `<h1>` is `This page couldn't load`. The string appears solely in `<title>` and the description meta, neither of which contributes a heading accessible name. Neither shell satisfies the locator with *or* without `exact`.
- **Zero tests collected passing silently — refuted, NC-5a and NC-5b both FIRED.** Under the real config with nothing selected (`--grep-invert`), and under a root-level config clone whose `testDir` pointed at an empty directory (simulating `smoke.spec.ts` being renamed away), both produced `Error: No tests found`, exit 1. In NC-5b the webServer was never even started. Playwright fails closed on zero collection.
- **Stale build served** — excluded by the `BUILD_ID` evidence in 5a; `npm run build && npx next start` rebuilds every run and `&&` short-circuits on build failure.
- **Retry/trace masking a failure** — `retries: 0`; NC-7/NC-8 below show trace settings are inert with respect to pass/fail.
- **`webServer.url` readiness satisfied by something that is not the app** — the only way to hold the URL is to hold the port, and NC-1/NC-1b close both the recognised and unrecognised variants.

My first attempt at NC-1 hung for 10 minutes and returned no output. That was a defect in my own driver script (nested `shell: true` spawn), not behavior of the subject; re-run as a detached server plus a foreground invocation, it returned in seconds.

## 6. Independently re-run validation

All run by me in the review worktree after `npm ci` (exit 0). I inherited no numbers.

| Validation | Command | Observed |
|---|---|---|
| Type check | `npx tsc --noEmit` | exit **0** |
| Lint | `npx eslint` | exit **0** |
| Vitest node project | `npx vitest run --project node` | **22 files / 326 tests passed**, exit 0 |
| Vitest dom project | `npx vitest run --project dom` | **1 file / 3 tests passed**, exit 0 |
| Vitest aggregate | `npx vitest run` | **23 files / 329 tests passed**, exit 0 |
| Playwright | `npx playwright test` | **1 passed** (16.8s), exit 0 |
| Production build | `npm run build` | exit **0** |
| Whitespace | `git diff --check 6eefff7f HEAD` | exit **0** |

**Node baseline preserved exactly: 326 / 22.** I additionally re-ran the node project *after* `npm run build` populated `.next/`, to test whether build output could leak into collection: still 326 / 22, and `find .next -name "*.test.ts*"` returned nothing. `npx vitest list --project node --filesOnly` enumerated 22 files, none from `e2e/`, none `.tsx`.

Everything was re-run a second time on the restored tree after probe cleanup and reproduced identically, including a second independent Playwright run (`1 passed`, 22.6s).

## 7. Negative controls

| ID | Control | Fired? |
|---|---|---|
| NC-1 | Decoy on 3100 serving an h1 that would satisfy even `exact: true` | **YES** — Playwright refused, exit 1, no test ran |
| NC-1b | 404-serving squatter on 3100 (evades readiness probe) | **YES** — EADDRINUSE, exit 1 |
| NC-2 | `exact: true` discrimination, 4 constructed cases | **YES** — 2 failed / 2 passed, exactly as required |
| NC-3 | `e2e/probe.test.ts` collected by neither runner | **YES** for `.test.ts`; **exposed a gap** for `.test.tsx` (MINOR-2) |
| NC-4 | dom proving test forced into node environment | **YES (on retry)** — `ReferenceError: document is not defined`, 3/3 failed, exit 1 |
| NC-5a | Zero tests selected under the real config | **YES** — `Error: No tests found`, exit 1 |
| NC-5b | Zero files collected, root-level config clone | **YES** — `Error: No tests found`, exit 1, webServer never started |
| NC-6 | dom suite without `test/setup-dom.ts` | **YES** — `TestingLibraryElementError: Found multiple elements…`, exit 1 |
| NC-7 | Does `trace: retain-on-failure` actually produce a trace? | **YES** — `test-results/…/trace.zip` written |
| NC-8 | Does `on-first-retry` at `retries: 0` produce nothing? | **YES** — no `trace.zip`, confirming the config comment |

**Two controls initially did not fire, and in both cases the fault was mine.**

- NC-4 first run: `npx vitest run --project dom --environment node` passed 3/3. The CLI flag does not override a project-level `environment`; the telltale was `environment 3.33s` in the timing line (jsdom), versus `2ms` for the genuine node project. Re-run with a probe config that actually sets `environment: "node"`, it failed 3/3 as expected.
- NC-7 first attempt found no trace, but my NC-2 probe config had omitted `use.trace` entirely. Re-run with the real config's `use` block cloned verbatim, the trace appeared.

I report these because the failure mode that sank candidate 1 was accepting a result without proving it could have been different.

## 8. Findings

### MINOR-1 — `vitest.config.ts:26` silently drops Vitest's default `**/.git/**` exclusion *(CONFIRMED)*

```ts
exclude: ["**/node_modules/**", "**/dist/**", "e2e/**"],
```

Vitest's `exclude` **replaces** the default rather than extending it. The coordinator flagged this; it is real, but its shape must be corrected.

**Correction to the coordinator's framing.** The concern was described as losing coverage of `.idea`, `.git`, `.cache`, `.output`, `.temp`. That list comes from the JSDoc in `node_modules/vitest/dist/chunks/reporters.d.DtoKVV2s.d.ts:2541`, which is stale upstream documentation. The actual runtime constant in the pinned version (vitest **4.1.10**) is:

```js
// node_modules/vitest/dist/chunks/defaults.9aQKnqFk.js:6
const defaultExclude = ["**/node_modules/**", "**/.git/**"];
```

So the change keeps `**/node_modules/**`, adds `**/dist/**` and `e2e/**`, and drops exactly one pattern: **`**/.git/**`**. This matters — anyone fixing it against the JSDoc list would restore five patterns that were never in force and still be relying on a doc that lies.

**This is a real narrowing, not a theoretical one.** Vitest globs test files with `dot: true`, so dot-directories *are* traversed and only the exclude list keeps `.git` out:

```js
// cli-api.BK8pd4xc.js, globFiles()
return (await glob(include, { dot: true, cwd, ignore: exclude, expandDirectories: false }))
```

I proved the consequence in an isolated scratch project containing `.git/probe.test.ts` and `src/real.test.ts`, running the two exclude arrays against each other:

- baseline (defaults, i.e. the config at `6eefff7f`) → collects `src/real.test.ts` only
- candidate (explicit array) → collects **`.git/probe.test.ts`** *and* `src/real.test.ts`

**Practical exposure today is nil**, which is why this is MINOR and not MAJOR. In the main checkout `.git/` holds 345 files and `find .git -name "*.test.ts"` returns nothing; in every linked worktree `.git` is a *file*, not a directory, so the pattern is inert there regardless. Traversal cost is currently negligible but scales with repository history.

**Recommendation:** add `"**/.git/**"` to the array. One token, restores parity, no behavior change. **Does not block.**

### MINOR-2 — the `dom` project does not exclude `e2e/`, breaking the stated symmetry *(CONFIRMED)*

`vitest.config.ts:31-41` gives the `dom` project `include: ["**/*.test.tsx"]` and no `exclude`, so it inherits the defaults and never excludes `e2e/`. NC-3 confirmed both halves:

- `e2e/probe.test.ts` → collected by **neither** runner (the documented intent holds)
- `e2e/probe.test.tsx` → **collected by the `dom` project** (`[dom] e2e/probe.test.tsx`), while Playwright's `testMatch` correctly ignores it

The design intent stated at `vitest.config.ts:23` is "e2e/ belongs to Playwright." That intent is only half-enforced. This is **not** a false-positive route: such a file importing `@playwright/test` throws when `test()` is called outside the Playwright runner, so it fails loudly. It is a consistency and maintainability issue. **Recommendation:** give the `dom` project the same `e2e/**` exclusion. **Does not block.**

### MINOR-3 — `playwright.config.ts:3` port coercion is not empty-string safe *(arithmetic CONFIRMED, downstream behavior PLAUSIBLE)*

```ts
const PORT = Number(process.env.E2E_PORT ?? 3100);
```

`??` catches `null`/`undefined` but not `""`. Verified in node: `Number(undefined ?? 3100)` → `3100`; `Number("" ?? 3100)` → **`0`**; `Number("abc" ?? 3100)` → **`NaN`**. An empty or non-numeric `E2E_PORT` therefore yields a `baseURL` of `http://127.0.0.1:0` or `…:NaN`. I did not execute either case, so I label the downstream outcome plausible rather than confirmed; both should fail closed at connection time. Low priority. **Recommendation:** `Number(process.env.E2E_PORT || 3100)`, or validate and throw. **Does not block.**

## 9. Standards compliance

- **TESTING_STANDARD** — satisfied for this package. The testing pyramid is respected: E2E is limited to a single smoke test of a primary journey, exactly as "Only critical workflows require E2E coverage" prescribes. Tests are deterministic (production build, no dev-server timing), isolated, and free of network and production data. See NOTE-3 on the CI clause.
- **TYPESCRIPT_STANDARD** — `npx tsc --noEmit` exit 0 under `strict: true`. `tsconfig.json` `include` covers `**/*.ts`/`**/*.tsx`, so `e2e/`, `test/` and both configs are genuinely type-checked, not silently skipped. No `any`, no assertions beyond the narrow, justified `fill as HTMLElement` in `components/ui/primitives.test.tsx:29`.
- **CODE_REVIEW_STANDARD** — small, single-purpose, focused change; all automated checks verified passing by the reviewer rather than asserted by the author.
- **ACCESSIBILITY_STANDARD** — incidentally strengthened. Both proving tests query through the accessibility tree (`getByRole` with accessible names), so they lock in `role`, `aria-label`, `aria-valuenow/min/max/text`. I verified these against `components/ui/primitives.tsx:104-118`: `clamped = Math.max(0, Math.min(100, value))`, `aria-valuenow={Math.round(clamped)}`, `aria-valuetext={`${Math.round(clamped)}%`}`, `style={{ width: `${clamped}%` }}`. The tests assert the *correct* invariants — 42→"42%", 150→100, -25→0 — not merely whatever the code happens to do.
- **ARCHITECTURE** — no ADR governs test infrastructure. `docs/decisions/` contains only ADR-0001 and ADR-0002, on the execution manager and review/escalation. Neither constrains this change, so **I assert no ADR violation and claim no ADR endorsement.** The nearest applicable text is ADR-0001:347, "`npm test`, `npm run lint`, and `tsc` are clean," and ADR-0002:330, "Full suite green (tsc, lint, tests, production build) after each task" — both of which I verified green in section 6.
- **Standards with no file** — `NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, `ERROR_HANDLING_STANDARD.md` are required by `agents/independent-code-reviewer/AGENT.md:114-116` but do not exist in `standards/`. I did not invent their contents and made no findings against them.

## 10. Security observations

- **No production attack surface.** Zero production source files changed. `@testing-library/react` and `jsdom` are in `devDependencies`; nothing enters the runtime bundle.
- **No new advisories introduced — verified by attribution, not assumption.** `npm audit` reports 42 vulnerabilities (1 critical, 19 high, 21 moderate, 1 low); 22 remain under `--omit=dev`. I intersected the 47 packages PKG-2 adds to the lockfile against the advisory set: **0 of 47 carry an advisory.** Every finding traces to pre-existing packages (`next`, `eslint`, `eslint-config-next`, `trigger.dev`/`@trigger.dev/core`, `socket.io`/`engine.io`, `tar`, `sharp`, `postcss`, `ws`, …) already present at the `6eefff7f` baseline. The critical (`tar`) and all 19 highs are pre-existing. This is a genuine pre-existing security backlog and warrants its own scoped remediation — recorded here as out-of-scope discovery, **not** as a finding against this candidate.
- **No secrets, credentials, or production data** in any changed file. The E2E test performs no auth and makes no network call beyond the local server.
- **`webServer` binds `127.0.0.1`, not `0.0.0.0`**, so the test server is not exposed beyond the loopback interface. Good default.

## 11. Performance observations

- Node project: 326 tests in ~1.6s. dom project: 3 tests in ~2.2s (jsdom environment setup ~1.6s of it). Aggregate ~2.9s. The DOM project's cost is dominated by one-time jsdom setup and is proportionate.
- Full E2E run 16.8s / 22.6s across two runs, dominated by `next build`. `reuseExistingServer: false` deliberately trades speed for integrity — the correct trade for a correctness gate, and the reason candidate 1 failed.
- MINOR-1's loss of `**/.git/**` adds a directory walk over `.git` on every Vitest run. Negligible at 345 files; grows with history.
- `webServer.timeout: 300_000` is generous but appropriate given it covers a full production build.

## 12. Recommended improvements

1. **(MINOR-1)** Add `"**/.git/**"` to `vitest.config.ts:26`. Use the runtime constant, not the stale JSDoc, as the reference.
2. **(MINOR-2)** Add `exclude: ["**/node_modules/**", "e2e/**"]` to the `dom` project for symmetry with the stated intent.
3. **(MINOR-3)** Use `||` or explicit validation for `E2E_PORT` at `playwright.config.ts:3`.
4. **(NOTE-3, out of scope)** Wire `npm test` — and a decision on `npm run test:e2e` — into `.github/workflows/ci.yml`. Requires separate authorization; see below.

## 13. Notes and observations

- **NOTE-1 — comment accuracy verified, not assumed.** Every load-bearing comment in the diff makes a factual claim, and I tested each. `playwright.config.ts:20-21` ("with retries at 0 there is never a first retry") — confirmed by NC-8: `on-first-retry` produced no `trace.zip`, `retain-on-failure` did (NC-7). `test/setup-dom.ts:4-6` (cleanup is needed because globals are off) — confirmed by NC-6. `vitest.config.ts:23-25` and `playwright.config.ts:6-9` (a `.test.ts` in `e2e/` is collected by neither runner) — confirmed by NC-3. No comment overstates what the code does.
- **NOTE-2 — the smoke test exercises prerendered HTML, not hydration.** The build marks `/` as `○ (Static)`, and the h1 is present in `.next/server/app/index.html` as `<h1 class="…">Savrio Dev HQ</h1>`. The assertion would therefore pass even if client-side JS were broken. This is not a defect: the spec's own comment at `e2e/smoke.spec.ts:3-5` claims only that it proves "the browser harness works end to end," which is exactly what it proves. Recorded so no future reader over-reads it as an app-health check.
- **NOTE-3 — nothing in CI runs any test.** `.github/workflows/ci.yml` `application-validation` runs `npm run lint`, `tsc --noEmit`, and `npm run build` — there is no `npm test` step. Neither the 326 pre-existing node tests, nor the new dom tests, nor the E2E suite are enforced by any automated gate. TESTING_STANDARD's "Continuous Integration" section states every pull request should verify "Tests pass." **This gap is pre-existing** (`npm test` existed at `6eefff7f` and was already unwired) and `.github/workflows/*` is outside PKG-2's authorized envelope, so declining to fix it here is correct scope discipline. Recorded as out-of-scope discovery with real impact: PKG-2 builds test capability that no gate currently enforces. Discovery is not approval; this needs its own authorization.
- **NOTE-4 — `forbidOnly: !!process.env.CI` (`playwright.config.ts:14`) is currently inert**, since Playwright never runs in CI (NOTE-3). A stray `test.only` would silently narrow the suite locally. Harmless at one test; becomes real as the suite grows.
- **NOTE-5 — `fullyParallel: true` with `workers: 1`** (`playwright.config.ts:13,16`) is a no-op combination today. Not wrong, just non-obvious.
- **NOTE-6 — `handbooks/INDEPENDENT_CODE_REVIEWER.md`, referenced by `agents/independent-code-reviewer/AGENT.md:7`, does not exist.** `handbooks/` contains ten other role handbooks. I did not fabricate its contents and used `standards/CODE_REVIEW_STANDARD.md` as my procedural standard. Material to the extent that this gate has no role-specific procedure of record.
- **NOTE-7 — trace artifacts are contained.** `retain-on-failure` writes to `test-results/`, which `.gitignore` covers along with `playwright-report/`. Confirmed: after NC-7 produced a `trace.zip`, `git status --porcelain -uall` still reported 0 entries. No working-tree pollution from a failed run.
- **NOTE-8 — the `e2e/**` exclude pattern is root-anchored** (matched relative to the Vitest root), unlike its `**/`-prefixed neighbours. Only a top-level `e2e/` is excluded; a nested `lib/e2e/foo.test.ts` would still be collected. This is almost certainly the desired behavior, but the asymmetry is worth a maintainer's awareness.

## 14. Does anything block commit?

**No.** There are no BLOCKER and no MAJOR findings. The three MINOR findings are quality and consistency issues; none of them lies on the false-positive path, none can alter production behavior, and none can cause a green run that should have been red. The remediation's stated purpose — closing the E2E false positive that failed candidate 1 — is achieved and independently proven.

I recommend MINOR-1 and MINOR-2 be fixed, but under the F-A7 freeze they are appropriately deferred to a follow-up package rather than used to force another candidate.

## 15. What I did not verify, and why

- **CI execution.** I did not run the GitHub Actions workflows; I read `ci.yml` and report its steps as written. My NOTE-3 conclusion rests on the absence of a test step in that file, not on an observed CI run.
- **Cross-platform behavior.** All validation ran on Windows 11 with Node's local toolchain. The `webServer.command` string, `next start` port binding, and the "already used" refusal were verified on Windows only. Behavior on the ubuntu-latest runners named in `ci.yml` is unverified.
- **Browsers other than Chromium.** The config declares one project; I ran only Chromium.
- **Baseline audit comparison.** I did not install `node_modules` at `6eefff7f` to diff `npm audit` output directly. My "no new advisories" claim rests on a package-level intersection: 0 of the 47 added packages appear in the advisory set, and 0 existing packages changed version. That is strong but is attribution, not a before/after audit run.
- **`E2E_PORT` edge cases end-to-end (MINOR-3).** I verified the JavaScript coercion in isolation; I did not run Playwright with `E2E_PORT=""` or a non-numeric value, so the downstream failure mode is labeled plausible.
- **Long-run flake behavior.** I ran the E2E suite twice end to end (plus the negative-control invocations). Two passes do not establish flake rates — and candidate 1 passed twice too, which is precisely why I relied on negative controls rather than repetition.
- **The `handbooks/INDEPENDENT_CODE_REVIEWER.md` procedure**, which does not exist (NOTE-6).

## 16. Candidate integrity statement

**The candidate was left unchanged.**

I created probe files inside the worktree to run negative controls: `nc-probe/` (config + 4-case spec + empty dir), `nc-empty/`, `nc-trace/`, `nc-zero.config.ts`, `nc-domnode.config.ts`, `nc-nosetup.config.ts`, `nc-trace.config.ts`, `nc-trace-old.config.ts`, `e2e/probe.test.ts`, `e2e/probe.test.tsx`, and `test-results/`. **All were deleted.** After cleanup I verified:

- `git status --porcelain=v1 --untracked-files=all` → **0 entries**
- `ls e2e/` → `smoke.spec.ts` only
- `git rev-parse HEAD` → `5c1fd6590160dd9bf41212868ed946bb9fb12123`
- `git rev-parse candidate-1f-pkg2-2` → `aec584e310b094de93458b380b3e45eee0eb6600` (tag unmoved)
- `git rev-parse HEAD^{tree}` → `2804e06ec495f976aa6cf86e45ea83ae9bbab904` (tree matches)

I performed no edit, stage, commit, or tag operation on tracked content. Generated `node_modules/` and `.next/` remain and are gitignored. All decoy servers were terminated; port 3100 verified free. All scratch files live under `C:/Users/evanj/AppData/Local/Temp/claude/…/scratchpad/`.

---

## Handoff block

- **Verdict:** `APPROVE WITH FINDINGS`
- **Counts:** BLOCKER 0 · MAJOR 0 · MINOR 3 · NOTE 8
- **Identity:** PASS — annotated tag, peels to `5c1fd659…`, tree `2804e06e…`, parent `a3d8d194…`, worktree detached and clean
- **Scope:** PASS — cumulative diff = exactly the 7 authorized paths; remediation diff = exactly 3 paths; no forbidden path, no stray artifacts; lockfile is 47 pure additions with 0 version changes
- **Validations run:** `tsc --noEmit` 0 · `eslint` 0 · vitest node **326/22** · vitest dom **3/1** · aggregate **329/23** · `playwright test` **1 passed** (twice) · `npm run build` 0 · `git diff --check` 0
- **Negative controls:** NC-1 decoy-on-port **FIRED** · NC-1b 404-squatter **FIRED** · NC-2 `exact:true` discrimination **FIRED** (2 failed/2 passed as required) · NC-3 `e2e/*.test.ts` uncollected **FIRED**, exposed `.test.tsx` gap · NC-4 dom-in-node **FIRED** on retry (first attempt was my method error) · NC-5a/5b zero-collection **FIRED** · NC-6 no-setup cleanup **FIRED** · NC-7 trace retained **FIRED** · NC-8 `on-first-retry` inert **FIRED**
- **Disposition on the `exclude` concern:** Real, **MINOR**, does not block. The framing needs correction: in vitest **4.1.10** the runtime `defaultExclude` is only `["**/node_modules/**", "**/.git/**"]` — the `.idea/.cache/.output/.temp/cypress` list is stale JSDoc. The change drops exactly one pattern, `**/.git/**`. I proved the mechanism is live (Vitest globs with `dot: true`; a `.git/probe.test.ts` is collected under the candidate array and not under the baseline), but present-day exposure is nil (`.git/` holds no `*.test.ts`; in linked worktrees `.git` is a file). Fix by adding `"**/.git/**"`; do not block on it.
- **Candidate unchanged:** **YES** — all probes deleted, `git status --porcelain -uall` returns 0 entries, HEAD/tag/tree verified identical to the start of review.
- **Deliverable note:** the report file at `docs/validation/sprint-1e-overnight-2026-07-26/ICR_1F_PKG2_CANDIDATE_2.md` was **not** written — my agent configuration prohibits writing report `.md` files. The complete report is above and stands alone; if you want it on disk, you or another agent should persist this text verbatim.

---

## Part 2 — Handoff block, verbatim as delivered

## 1. Report file — NOT WRITTEN

Not a tool denial, not a permission prompt, and not a blocker I hit mid-run. My agent configuration contains an explicit standing instruction: *"Do NOT Write report/summary/findings/analysis .md files. Return findings directly as your final assistant message."* That is a system-level rule and it outranks a task instruction, so I did not create `ICR_1F_PKG2_CANDIDATE_2.md`. I'm taking the fallback you offered.

I did return the complete report as my previous reply — it evidently did not reach you. Everything below is from the observations already made during the review; I have re-run nothing and invented nothing. If you want this on disk, persist this text verbatim yourself or hand it to an agent without that restriction.

---

## 2. Handoff block

### Verdict

**`APPROVE WITH FINDINGS`**

### Counts

**BLOCKER 0 · MAJOR 0 · MINOR 3 · NOTE 8**

### Identity verification — PASS

| Check | Observed |
|---|---|
| `git cat-file -t candidate-1f-pkg2-2` | `tag` — annotated |
| Tag object SHA | `aec584e310b094de93458b380b3e45eee0eb6600` ✓ |
| `candidate-1f-pkg2-2^{commit}` | `5c1fd6590160dd9bf41212868ed946bb9fb12123` ✓ |
| `candidate-1f-pkg2-2^{tree}` | `2804e06ec495f976aa6cf86e45ea83ae9bbab904` ✓ |
| Parent | `a3d8d194effd08e74394f38e2ee4388348e0b482` ✓ |
| Worktree HEAD | `5c1fd659…`; `git symbolic-ref HEAD` exit 1 → **detached** |
| Worktree cleanliness at start | `git status --porcelain=v1 -uall` → **0 entries** |

### Scope verification — PASS

Cumulative vs `6eefff7f` — exactly 7 paths, no forbidden path:
`A components/ui/primitives.test.tsx`, `A e2e/smoke.spec.ts`, `A playwright.config.ts`, `A test/setup-dom.ts`, `M vitest.config.ts`, `M package.json`, `M package-lock.json`. Stat: 7 files, +817 / −10.

Remediation vs `a3d8d194` — exactly 3 paths: `e2e/smoke.spec.ts`, `playwright.config.ts`, `vitest.config.ts`. Stat: +25 / −5, matching the brief.

No production source, no ADR, no `store.ts`, no docs, no agent definitions, no other configs. No stray probe/decoy/artifact files, no `node_modules`, no build output, no trace or report directories committed.

Lockfile checked structurally rather than by reading the diff: **47 packages added, 0 changed version, 0 removed**; `next`/`react`/`react-dom`/`@trigger.dev/sdk` all unchanged. Zero removal lines in the diff.

### Validations run — all executed by me after `npm ci` (exit 0)

| Validation | Observed |
|---|---|
| `npx tsc --noEmit` | exit **0** |
| `npx eslint` | exit **0** |
| `npx vitest run --project node` | **22 files / 326 tests passed**, exit 0 |
| `npx vitest run --project dom` | **1 file / 3 tests passed**, exit 0 |
| `npx vitest run` (aggregate) | **23 files / 329 tests passed**, exit 0 |
| `npx playwright test` | **1 passed** (16.8s), exit 0 — and again **1 passed** (22.6s) on the restored tree |
| `npm run build` | exit **0** |
| `git diff --check 6eefff7f HEAD` | exit **0** |
| `npx vitest list --project node --filesOnly` | 22 files enumerated, none from `e2e/`, none `.tsx` |
| node project re-run **after** `.next/` existed | still **326 / 22**; `find .next -name "*.test.ts*"` → nothing |
| `npm audit` | 42 vulns (1 critical / 19 high / 21 moderate / 1 low), exit 1 |
| `npm audit --omit=dev` | 22 vulns |

**Node baseline preserved exactly: 326 tests / 22 files.**

### Negative controls

| ID | Control | Fired? |
|---|---|---|
| NC-1 | Decoy on 127.0.0.1:3100 serving `<h1>Savrio Dev HQ</h1>` (would satisfy even `exact:true`) | **FIRED** — `Error: http://127.0.0.1:3100 is already used…`, exit 1, no test ran |
| NC-1b | Squatter 404-ing on `/` (evades the readiness probe) | **FIRED** — `EADDRINUSE`, `Process from config.webServer was not able to start`, exit 1 |
| NC-2 | `exact: true` discrimination, 4 constructed cases | **FIRED** — 2 failed / 2 passed, exactly the required distribution |
| NC-3 | `e2e/*.test.ts` collected by neither runner | **FIRED** for `.test.ts`; **exposed a gap** — `e2e/probe.test.tsx` *was* collected as `[dom] e2e/probe.test.tsx` |
| NC-4 | dom proving test forced into node environment | **FIRED on retry** — `ReferenceError: document is not defined`, 3/3 failed, exit 1. First attempt did **not** fire; cause was my method (`--environment` does not override project config), not the subject |
| NC-5a | Zero tests selected under the real config (`--grep-invert`) | **FIRED** — `Error: No tests found`, exit 1 |
| NC-5b | Zero files collected, root-level config clone, empty `testDir` | **FIRED** — `Error: No tests found`, exit 1, webServer never started |
| NC-6 | dom suite without `test/setup-dom.ts` | **FIRED** — `TestingLibraryElementError: Found multiple elements…`, exit 1 |
| NC-7 | Does `trace: retain-on-failure` produce a trace? | **FIRED** — `test-results/…/trace.zip` written. First attempt did not fire; my probe config had omitted `use.trace` |
| NC-8 | Does `on-first-retry` at `retries: 0` produce nothing? | **FIRED** — no `trace.zip`, confirming the config comment |

NC-2 detail, since it is the load-bearing one:

| Case | Page h1 | Assertion | Result |
|---|---|---|---|
| A | `Welcome to Savrio Dev HQ Mission Control` | candidate's, `exact: true` | **FAILED** (required) |
| B | same | candidate 1's, no `exact` | **PASSED** — reproduces the original false positive |
| C | `SAVRIO DEV HQ` | candidate's, `exact: true` | **FAILED** (required) |
| D | `Savrio Dev HQ` | candidate's, `exact: true` | **PASSED** (required) |

One control aborted and was re-run: my first NC-1 driver hung for 10 minutes and returned no output. That was a defect in my script (nested `shell: true` spawn), not subject behavior; restructured as a detached server plus a foreground invocation, it returned in seconds.

### Central question — does the remediation close the false-positive path?

**Yes, on both halves, proven by construction rather than by reading config.**

*Can a run still pass without building and starting the app?* No. Positive proof: `.next/BUILD_ID` changed across a clean `npx playwright test` — `T_Z-M5PKYS1dy0Er7RcPA` (mtime 18:54:40) → `PcKjNhEbJLTxvKtwSkTLS` (mtime 18:55:20). The suite genuinely rebuilt and served the app. Negative proof: NC-1 shows `reuseExistingServer: false` (`playwright.config.ts:33`) refuses to attach even to a decoy engineered to satisfy the assertion.

*Can the assertion pass against a page whose h1 merely contains the words?* No — NC-2 case A fails where case B (the old locator, same page) passes. `exact: true` at `e2e/smoke.spec.ts:19` is genuinely load-bearing and also restores case sensitivity (case C).

**Other routes to a false positive — searched, none found:**

- **404 / error-boundary shell satisfying the locator — refuted against the real build artifacts.** `.next/server/app/_not-found.html` does contain the string "Savrio Dev HQ", which looked alarming on first grep. Its only `<h1>` is `404`; `_global-error.html`'s only `<h1>` is `This page couldn't load`. The string appears solely in `<title>` and the description meta — neither contributes a heading accessible name. Neither shell satisfies the locator with *or* without `exact`.
- **Suite passing with zero tests collected — refuted**, NC-5a and NC-5b.
- **Server that starts but serves a stale build — refuted** by the `BUILD_ID` evidence; `npm run build && npx next start` rebuilds each run and `&&` short-circuits on build failure.
- **`webServer.url` readiness satisfied by something that is not the app — refuted.** The only way to hold the URL is to hold the port; NC-1 covers the variant Playwright recognises, NC-1b the variant it does not. Both fail closed.
- **Retry/trace settings masking a failure — refuted.** `retries: 0`; NC-7/NC-8 show trace config is inert with respect to pass/fail.

### Disposition on the Vitest `exclude`-replaces-defaults concern

**Real, MINOR, does not block — but your framing needs a correction that changes the fix.**

The concern as stated (defaults also cover `.idea`, `.cache`, `.output`, `.temp`, `cypress`, config files) comes from the JSDoc at `node_modules/vitest/dist/chunks/reporters.d.DtoKVV2s.d.ts:2541`, which is **stale upstream documentation**. The actual runtime constant in the pinned vitest **4.1.10** is:

```js
// node_modules/vitest/dist/chunks/defaults.9aQKnqFk.js:6
const defaultExclude = ["**/node_modules/**", "**/.git/**"];
```

So the change keeps `**/node_modules/**`, adds `**/dist/**` and `e2e/**`, and drops **exactly one** pattern: `**/.git/**`. Anyone fixing this against the JSDoc list would restore five patterns that were never in force and still be trusting a doc that lies.

The narrowing is live, not theoretical — Vitest globs with `dot: true`, so only the exclude list keeps `.git` out:

```js
// cli-api.BK8pd4xc.js, globFiles()
return (await glob(include, { dot: true, cwd, ignore: exclude, expandDirectories: false }))
```

I did not defer to your measurement. I re-measured (326/22, reproduced twice) **and** built an isolated scratch project containing `.git/probe.test.ts` + `src/real.test.ts` and ran the two exclude arrays head to head:

- baseline (defaults, i.e. the config at `6eefff7f`) → `src/real.test.ts` only
- candidate (explicit array) → **`.git/probe.test.ts`** *and* `src/real.test.ts`

Present-day exposure is nil, which is why it is MINOR and not MAJOR: the main checkout's `.git/` holds 345 files and `find .git -name "*.test.ts"` returns nothing, and in every linked worktree `.git` is a *file*, so the pattern is inert there anyway. Fix is one token — add `"**/.git/**"`. **Do not block on it.**

### Candidate left unchanged — YES

I created probe files inside the worktree for the negative controls: `nc-probe/`, `nc-empty/`, `nc-trace/`, `nc-zero.config.ts`, `nc-domnode.config.ts`, `nc-nosetup.config.ts`, `nc-trace.config.ts`, `nc-trace-old.config.ts`, `e2e/probe.test.ts`, `e2e/probe.test.tsx`, `test-results/`. **All deleted.** Verified afterward:

- `git status --porcelain=v1 --untracked-files=all` → **0 entries**
- `ls e2e/` → `smoke.spec.ts` only
- `git rev-parse HEAD` → `5c1fd6590160dd9bf41212868ed946bb9fb12123`
- `git rev-parse candidate-1f-pkg2-2` → `aec584e310b094de93458b380b3e45eee0eb6600` (tag unmoved)
- `git rev-parse HEAD^{tree}` → `2804e06ec495f976aa6cf86e45ea83ae9bbab904`

No edit, stage, commit, or tag operation on tracked content. Generated `node_modules/` and `.next/` remain and are gitignored. All decoy servers terminated; port 3100 verified free. Scratch files live under `C:/Users/evanj/AppData/Local/Temp/claude/.../scratchpad/`.

---

## 3. Findings

**MINOR-1 — `vitest.config.ts:26` drops the default `**/.git/**` exclusion *(CONFIRMED)*.** Mechanism proven above; no present-day impact. Add `"**/.git/**"`.

**MINOR-2 — `vitest.config.ts:31-41`, the `dom` project has no `e2e/**` exclude *(CONFIRMED, NC-3)*.** `e2e/*.test.tsx` is collected by `dom`. The stated intent at `vitest.config.ts:23` ("e2e/ belongs to Playwright") is only half-enforced. **Not** a false-positive route — such a file importing `@playwright/test` throws when `test()` runs outside the Playwright runner, so it fails loudly. Consistency issue.

**MINOR-3 — `playwright.config.ts:3` port coercion is not empty-string safe *(arithmetic CONFIRMED, downstream PLAUSIBLE)*.** `Number(process.env.E2E_PORT ?? 3100)`: `??` does not catch `""`. Verified in node — `Number("" ?? 3100)` → `0`, `Number("abc" ?? 3100)` → `NaN`. I did **not** execute Playwright with those values, so the downstream failure is labeled plausible; both should fail closed. Use `||` or validate.

**NOTE-1 — every load-bearing comment verified factually true**, not assumed: `playwright.config.ts:20-21` by NC-8, `test/setup-dom.ts:4-6` by NC-6, `vitest.config.ts:23-25` and `playwright.config.ts:6-9` by NC-3. No comment overstates the code.

**NOTE-2 — the smoke test exercises prerendered HTML, not hydration.** Build marks `/` as `○ (Static)`; the h1 is in `.next/server/app/index.html`. It would pass with client JS broken. Not a defect — the spec comment claims only that it proves the harness works, which is what it proves.

**NOTE-3 — nothing in CI runs any test.** `.github/workflows/ci.yml` `application-validation` runs lint, `tsc --noEmit`, and `npm run build`; there is no `npm test` step. Neither the 326 node tests, nor the new dom tests, nor the E2E suite are enforced by any gate. TESTING_STANDARD's CI section expects "Tests pass." **Pre-existing** (`npm test` was already unwired at `6eefff7f`) and `.github/workflows/*` is outside PKG-2's envelope, so declining to fix it here is correct scope discipline. Recorded as out-of-scope discovery needing its own authorization — discovery is not approval.

**NOTE-4 — `forbidOnly: !!process.env.CI` is currently inert** because Playwright never runs in CI. A stray `test.only` would silently narrow the suite locally.

**NOTE-5 — `fullyParallel: true` with `workers: 1`** is a no-op combination today.

**NOTE-6 — `handbooks/INDEPENDENT_CODE_REVIEWER.md` does not exist**, though `agents/independent-code-reviewer/AGENT.md:7` references it. I did not fabricate its contents and used `standards/CODE_REVIEW_STANDARD.md` instead. Likewise `NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, `ERROR_HANDLING_STANDARD.md` (AGENT.md:114-116) have no file — no findings were made against them.

**NOTE-7 — trace artifacts are contained.** `.gitignore` covers `test-results/` and `playwright-report/`; after NC-7 produced a `trace.zip`, `git status -uall` still reported 0 entries.

**NOTE-8 — `e2e/**` is root-anchored**, unlike its `**/`-prefixed neighbours. A nested `lib/e2e/foo.test.ts` would still be collected. Almost certainly intended; worth maintainer awareness.

**Security attribution (not a finding against this candidate).** All 42 audit vulnerabilities are pre-existing. I intersected the 47 packages PKG-2 adds against the advisory set: **0 of 47 carry an advisory.** Critical (`tar`) and all 19 highs trace to `next`, `eslint`, `eslint-config-next`, `trigger.dev`/`@trigger.dev/core`, `socket.io`/`engine.io`, `sharp`, `postcss`, `ws` — all present at baseline. This is a real pre-existing backlog warranting its own scoped remediation.

## 4. Standards and architecture

TESTING_STANDARD satisfied (pyramid respected — one E2E smoke test, deterministic, no network/production data). TYPESCRIPT_STANDARD satisfied — `strict: true`, exit 0, and `tsconfig.json` `include` genuinely covers `e2e/`, `test/`, and both configs rather than silently skipping them. ACCESSIBILITY incidentally strengthened: both proving tests query through the accessibility tree, and I verified they assert the *correct* invariants against `components/ui/primitives.tsx:104-118` (42→"42%", 150→100, −25→0) rather than merely mirroring the implementation.

**No ADR governs test infrastructure.** `docs/decisions/` holds only ADR-0001 and ADR-0002 (execution manager; review/escalation). **I assert no ADR violation and claim no ADR endorsement.** The nearest applicable text — ADR-0001:347 "`npm test`, `npm run lint`, and `tsc` are clean" and ADR-0002:330 "Full suite green (tsc, lint, tests, production build)" — I verified green.

## 5. Does anything block commit?

**No.** Zero BLOCKER, zero MAJOR. The three MINOR findings are quality/consistency issues; none lies on the false-positive path, none can alter production runtime behavior, and none can produce a green run that should have been red. The remediation's stated purpose is achieved and independently proven. I recommend MINOR-1 and MINOR-2 be fixed, but under F-A7 they belong in a follow-up package rather than forcing another candidate.

## 6. What I did not verify, and why

- **CI execution — NOT PERFORMED.** I read `ci.yml`; I did not run the workflows. NOTE-3 rests on the absence of a test step in that file.
- **Cross-platform behavior — NOT PERFORMED.** All validation ran on Windows 11. The `webServer.command`, port binding, and "already used" refusal are Windows-verified only; `ubuntu-latest` behavior is unverified.
- **Browsers other than Chromium — NOT PERFORMED.** One project declared, Chromium only.
- **Before/after audit comparison — NOT PERFORMED.** I did not install `node_modules` at `6eefff7f`. The "no new advisories" claim is a package-level intersection (0 of 47 added packages in the advisory set; 0 existing packages changed version) — strong attribution, not a baseline audit run.
- **`E2E_PORT` edge cases end to end — NOT PERFORMED** (MINOR-3). Coercion verified in isolation only.
- **Flake behavior — NOT PERFORMED.** Two full E2E passes plus the control invocations do not establish a flake rate. Candidate 1 also passed twice, which is exactly why I relied on negative controls rather than repetition.
- **`handbooks/INDEPENDENT_CODE_REVIEWER.md` procedure** — cannot be followed; file does not exist (NOTE-6).
