# Full-Repository Review — Findings Handoff

**Document ID:** HANDOFF-001
**Created:** 2026-07-29
**Status:** Active — **§3, §4 and §5 are closed as of 2026-07-29 at HEAD `638e45c`; §6 is open and awaits Founder direction**
**Reviewers:** 6 independent agents (5 code review + 1 architecture), run in parallel against `chore/close-open-obligations` @ `c8c4c38`

---

## How to read this

Every finding below was produced by an independent reviewer that **executed** rather than read: brute-forcing tokens, running Semgrep in Docker, mutating workflows, measuring contrast ratios in a browser, and attacking the production boundary with seven encodings. Where a reviewer could not execute something, it is labelled.

Findings are grouped by **what you'd do about them**, not by which reviewer found them.

~~**Current state of the branch:** 417 tests pass, e2e 6/6, lint clean, `tsc --noEmit` clean, build succeeds.~~ — superseded, see below.

**Update — second batch (commits `a788b75`, `aea4d6b`, `ab52a38`):** DOC-02, ARCH-01 and UI-01 are closed. Sections 2 and 3 are annotated below rather than rewritten, so the original finding stays readable next to what was done about it.

**Update — third batch, 2026-07-29 (sixteen commits, `8468d17` … `638e45c`).** **Every remaining finding in §3, §4 and §5 is closed.** §6 is untouched and is still yours. The annotations below follow the same rule as the second batch: the original finding stays, and what was done about it is added next to it.

**Current state of the branch, re-measured at HEAD `638e45c`:**

| Check | Command | Result |
|---|---|---|
| Unit tests | `npm test` | **760 passed** across **62 files**, 0 failed (was 417) |
| Types | `npx tsc --noEmit` | clean, exit 0 |
| Lint | `npm run lint` | clean, no output |
| Build | `npm run build` | succeeds |
| E2E | `npx playwright test` | **8 passed** across `chromium` and `mobile-chromium` (was 6) |
| Workflow-verifier harness | `python scripts/test-verify-workflow-structure.py` | **50 passed, 0 failed** — up from the 10 mutations `OBL-28` cites |
| Release-controls harness | `python scripts/test-release-controls.py` | **81/81 expectations met**; the live `gh` CLI contract probe prints as **NOT EVALUATED** rather than being silently absent (opt in with `--gh-probe`) |
| Credential-scanner positive control | inline in `.github/workflows/security.yml` (`b7b6d4b`) | **not run here** — it is a CI job, not a script, and this pass did not execute the workflow |

The third harness is the one the credential scanner never had: `b7b6d4b` added a positive control that lifts the scanner out of `security.yml` with PyYAML so there is no second copy to drift, plants fixtures in throwaway git repos with **no** fixture-directory exclusion, asserts the exact path→label mapping rather than a count, and reads the real `lib/dev-hq/internal-guard.ts` for its null arm. **Its acceptance evidence is in that commit message, not re-derived here.**

New obligations opened by this batch are recorded in `docs/plans/OPEN_OBLIGATIONS.md` as **OBL-34** through **OBL-40**. The ADR amendment the stall deadline requires — delegated by the Founder on 2026-07-29 and **not yet written into either ADR** — is **X-29** in `docs/governance/AUTHORITY_AND_CONTRADICTION_REGISTER.md`.

---

## 1. Fixed and committed

| ID | Problem | Location | Evidence |
|---|---|---|---|
| **CI-01** | Unused `import html` broke the Python lint gate. Branch was red the moment it met `main`; unseen because `lint.yml` only triggers on `main` / `feature/dev-hq-operating-system`. | `scripts/roadmap-conversion/docx2md.py:11` | `ruff==0.14.0` reproduced F401; now exits 0, script still reproduces the registered roadmap hash |
| **SVC-01** | Registry seeded from UI placeholder data **including `availability`**, locking 3 of 5 agents terminally. `implementation`, `review`, `corrections`, `qa`, `accessibility` could never be dispatched — work sat queued forever, no attempt consumed, so **no escalation ever raised**. | `lib/dev-hq/store.ts` `createSeedAgents()` | New `lib/dev-hq/registry-seed.test.ts`; reverting the fix turns all 3 red naming the exact 5 capabilities |
| **SVC-02** | `agent-executive-orchestrator` written to escalation records as `raisedByAgentId` / `actorId` but never seeded — `getAgent()` returned null at every site. ADR-0001 D5 names this id explicitly. | `lib/dev-hq/store.ts`, `lib/dev-hq/constants.ts:4` | Same test file |

**Note on SVC-02:** seeded with **no capabilities** deliberately. It is a system actor, not a worker. My first attempt gave it `routing`/`sequencing`/`escalation` and it stole a routing job from `agent-orchestrator`.

**Seven existing tests asserted the defect** and were corrected, not deleted. One carried the comment *"gemini has qa but is only 'waiting', not available"* — encoding "qa can never be dispatched" as expected behaviour.

---

## 2. ~~Uncommitted but working~~ — CLOSED, committed in `7079779`

| ID | Problem | Location |
|---|---|---|
| **SEC-01 / ARCH-09** | Review callback token minted by `nextId()` = `rvt-<epoch-ms>-<counter>`. Reviewer **brute-forced a live token in ~250,005 guesses**, narrowed further because `/api/dev-hq/events` is unauthenticated in dev and leaks both the clock and the shared counter. The route comment claims "a fabricated token cannot advance the lifecycle" — false. | `lib/dev-hq/id.ts` (new `nextCapabilityToken`), `lib/dev-hq/review-service.ts:354` |

Tests in `lib/dev-hq/capability-token.test.ts` (untracked). Each carries a null arm asserting the **old** generator fails the same bar — including reproducing the reviewer's actual attack: increment the trailing counter and you hold the neighbouring token.

**Status:** committed in `7079779`. The unused `nextId` import it left behind in `review-service.ts` was removed in `ab52a38`.

---

## 3. BLOCKING — fix before this branch merges

### ARCH-01 · CRITICAL · ~~The two security boundaries have no tests~~ — CLOSED in `aea4d6b`

> **Closed.** `proxy.test.ts` and `lib/dev-hq/internal-guard.test.ts` cover all four guard arms plus the production block and the matcher's reach; the e2e now requires at least one refused Dev HQ request.
>
> Proved capable of failing across four mutations, each restored: `proxy.ts` returning `next()` unconditionally turned the unit test red **and the e2e red** — the scenario that previously passed; disabling the guard's production check, disabling its unconfigured-token check, and relaxing its equality to `startsWith` each turned exactly the corresponding arm red.
>
> The two suites that stub the guard were left stubbed. They are testing other things, and now that the guard has direct coverage the stub is no longer the only word on it.

**`proxy.ts`** and **`lib/dev-hq/internal-guard.ts`** stand between an unauthenticated caller and every mutating Dev HQ endpoint. Neither has a test.

- The only two tests touching the inner guard **stub it to always allow**: `rejectInternalDevRequest: () => null` at `lib/dev-hq/continuation-terminal-failure.test.ts:42` and `lib/dev-hq/process-start-marker-continuation-seam.test.ts:57`
- The e2e at `e2e/mission-control-viewport.spec.ts:84-90` **tolerates** the 403 but never requires it

**UI-02 proved this empirically — both arms run:**

| Arm | 403s seen | Verdict |
|---|---|---|
| `proxy.ts` active | 4 | PASS |
| API not blocked | 0 | **PASS** |

Every test in the repo would stay green while the entire Dev HQ API was open.

**Fix:** unit test `rejectInternalDevRequest` across all four arms (403 prod / 503 no token / 401 mismatch / null on match); add one line to the e2e requiring at least one `403 /api/dev-hq/`.

### CI-03 · HIGH · ~~Workflow verifier misses 5 change classes~~ — CLOSED in `8468d17` (with CI-10)

> **Closed.** `JOB_FIELDS` gained `continue-on-error`, `env`, `uses` and `outputs`; `WORKFLOW_FIELDS` gained `name` (`scripts/verify-workflow-structure.py:105-114`). `continue-on-error` is detected entirely by the field comparison — the step count reads 21→21 and the guard count 8→8 both before and after, exactly as the finding said.
>
> **CI-10 with it:** every could-not-evaluate path now exits 2 and says what it could not do, audited past the two reported lines to the PyYAML import, the git invocation, the YAML parse, an unreadable-but-present file, and the working-tree glob. A parse failure previously produced a traceback and exit 1, indistinguishable from a detected violation.
>
> The harness gained a **null audit** that re-runs every case with its mutation skipped — injecting one pre-existing deviation into the scratch setup reproduces the historical failure exactly, the matrix reading 22/23 healthy while the null audit names all 23 as measuring the starting state. It now reports **50 passed, 0 failed** (re-run at HEAD).
>
> **Residual, disclosed by that commit and confirmed by reading the lists:** the fields are still an allowlist. Job-level `name:` — the identity a required status check matches on — plus job `with:` and workflow `run-name` are absent from it and pass undetected. Tracked in the amended `OBL-30`.

`scripts/verify-workflow-structure.py:61-67`. Reviewer wrote independent mutations: **author harness 16/16, independent set 6 deviations.**

The one that matters: **job-level `continue-on-error: true`** — lint, typecheck and build can all fail while the workflow reports success. Step count 21→21, guard count 8→8, verdict `ok`. Same defect shape as the deleted `if:` guard, worse impact.

Missing from `JOB_FIELDS`: `continue-on-error`, `env`, `uses`, `outputs`. Missing from `WORKFLOW_FIELDS`: `name`.

Also **CI-10**: parse failure exits 1, not 2 — violates `CONTROL_VERIFICATION_STANDARD` rule 5 (`verify-workflow-structure.py:129,147`).

### CI-05 · HIGH · ~~Actions-hardening auditor misses job-level `permissions: write-all`~~ — CLOSED in `647701f`, hardened in `508609c`

> **Closed twice, and the second time is the interesting one.** `647701f` made the auditor read job-level `permissions` as well as workflow-level. Its pre-fix baseline is recorded: the auditor returned **exit 0 both with and without** a job-level write-all.
>
> `508609c` then found, by independent audit of the control landed minutes earlier, that only **scalar** write-all was rejected — **mapping-form grants passed** (P2-25). The rule now judges *breadth*, so `release.yml`'s legitimate job-level `contents: write` stays green while genuinely broad escalation fires, demonstrated by putting that exact shape inside the red tree and showing it stays quiet.

`.github/workflows/security.yml:346-350` reads only workflow-level `permissions`, only for the literal `write-all`. Proven with mutations + null arm + two passing positive controls.

**The un-wired tripwire catches this case; the control that actually runs in CI doesn't.**

### CI-06 · HIGH · ~~Script-injection detector has major gaps~~ — CLOSED in `647701f`, extended in `508609c`

> **Closed.** `647701f` added `head_commit.message`, `commits[].message`, `pull_request.head.ref|label`, `head.repo.description|homepage`, `discussion`, `review_comment`, `workflow_run`, `event.inputs` — **and `with:` inputs**, which were not scanned at all. Step `env:` is deliberately excluded: it is the safe sink the control steers people towards. Pre-fix baseline recorded: the detector returned exit 0 with **all four** known-bad shapes present.
>
> `508609c` extended it again on independent audit — `inputs.*` was outside the regex's model entirely (P2-26; `release.yml` alone takes eight), along with `github.ref` and `github.ref_name`.

`.github/workflows/security.yml:292-294,312-321`. Misses `github.event.head_commit.message` (the classic `push` vector — 5 of 7 workflows trigger on push), `pull_request.head.ref`, `head.repo.description`, and **does not scan `with:` inputs at all**.

No live exposure — current workflows correctly route untrusted input through `env:`. This is a preventive control that doesn't prevent.

### SEC-02 · MAJOR · ~~Semgrep guard rule blind to 3 realistic shapes~~ — CLOSED in `647701f`; the control around it took two more rounds

> **Closed.** `647701f` made the rule match `NextRequest` and two-parameter dynamic routes, and removed the leading `...` from the `pattern-not` blocks so a guard placed after a write no longer satisfies a rule whose message claims *"first statement"*. **The Semgrep positive control also gained the null arm this finding named:** mutating the guard rule to fire on everything left all nine known-bad fixtures still detected, and only the new compliant fixtures caught it.
>
> **Two further rounds against the same control, both by independent audit:**
> - `508609c` — untyped handlers escaped entirely (P1-19); the `pattern-not` still allowed a write *between* binding the guard's result and acting on it, because calling the guard is not enforcing it (P1-18). Fixtures up to 12 known-bad and 3 compliant, from 9 and 2.
> - `b7b6d4b` — **MAJOR-1, the one worth reading.** Every fixture sat exactly one directory below `internal/`, but **six of the ten real routes sit two below**. Narrowing the rule's path filter from `**` to `*` — one character — removed `execution/complete`, `dispatch`, `heartbeat`, `reclaim`, `running` and `review/complete` from the blocking gate **while the control still reported all 12 known-bad detected and exit 0**. The rule was correct; the control could not see the difference. One nested fixture and its compliant half now make that mutation fail.
>
> **`OBL-05` (RR-05) appears to be closed by this work and is not yet moved.** Its stated proof of completion is *"a fifth fixture with pre-guard work, detected by the rule."* `.semgrep/fixtures/route-guard-after-write.ts` is exactly that fixture, the `pattern-not` blocks no longer open with `...` (`.semgrep/dev-hq-boundaries.yml:96-101` says so in terms), and `security.yml:1274` carries `internal/guardafter/route.ts` in the positive control's known-bad set against the guard rule. **Verified by reading, not by running Semgrep**, and the register row is left open pending that closure being taken deliberately rather than as a side effect of this annotation pass.

`.semgrep/dev-hq-boundaries.yml:36-40`. Verified with real Semgrep 1.145.0 in Docker, with a null arm:

- **`NextRequest`** handlers — the idiomatic Next.js type
- **Two-parameter dynamic routes** — a shape this repo **already uses** at `app/api/dev-hq/approvals/[id]/approve/route.ts:4`
- **Guard placed after a write** — the rule's message asserts "first statement"; the `pattern-not` opens with `...`, so it doesn't enforce it

Also **the Semgrep positive control has no null arm** (`security.yml:450-459`) — a rule mutated to fire on everything would pass it. That's rule 2 of the standard, violated by the control itself.

### SEC-03 · MAJOR · ~~`SECURITY.md` overstates scanner coverage~~ — CLOSED in `647701f`; **three further bypass rounds followed**, `508609c`, `b7b6d4b`

> **Closed, and then the same function was bypassed three more times.** This is the single most-revisited finding in the document and the annotation is long because the sequence is the evidence.
>
> **`647701f` — the fix as filed.** The name is now split into words on separators and camelCase boundaries, so `SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` are detected, and a Stripe rule was added. Run against the real tree the widened rule produced **16 unsuppressed matches and zero true positives** — all innocent uses of "key" (`idempotencyKey`, a React `key` prop, `DEV_HQ_INTERNAL_TOKEN_HEADER`). Rather than mute them, "key" now counts only when qualified. `SECURITY.md`'s prose was corrected to describe what the rule does.
>
> **`508609c` — P1-17, the serious one, found by independent audit of the fix above.** In `has_sensitive_name` the header exemption returned `False` **before** `ALWAYS_SENSITIVE` was consulted, so **any identifier containing the word `header` was exempt unconditionally**. `SECRET_HEADER`, `API_KEY_HEADER` and `AUTH_HEADER_PASSWORD` all passed clean — the entire secret scanner could be bypassed by suffixing a variable name. The exemption now applies **last**, and only when the value is genuinely header-shaped. Both directions proved, against the real `lib/dev-hq/internal-guard.ts` rather than a copy, with a third arm giving the same values names *without* the header word to isolate `_HEADER` as the thing switching the rule off. Also P2-27 (backtick literals, whitespace-bearing and unquoted values, long identifiers where the unanchored pattern matched further along and dropped the leading sensitive word) and P2-28 (a bare `scanner:allow-secret` pragma is now reported wherever it appears, so one cannot be planted in advance to disarm a future finding — honest limit: it demands three words, not a good reason).
>
> **`b7b6d4b` — MAJOR-2, two more, both confirmed against the extracted auditor before fixing.** `APIToken`, `JWTSecret` and `DBPassword` all missed, because the camelCase splitter only broke at lowercase→uppercase and an acronym run swallowed the following word. A third the review had not listed: `AWSAccessKeyId` lost `access`, the very qualifier that makes a `key` a credential. And a quoted property name put a `"` between the identifier and the colon, so `{"password": "..."}` produced **zero** matches — every JSON file and every quoted object literal in the repository was outside the rule entirely.
>
> **The durable fix is the control, not the regexes.** The credential auditor had **no positive control at all** — its only steps were checkout and the scanner. It had been bypassed in every prior round and had never once been shown going red on a known-bad input in CI. `b7b6d4b` added one, and verified it against **all four historical bypasses**, not just the current ones — each re-introduced into the scanner, each turning the control red. And against three more unprompted, one of which is the decisive result: **widening the rule to fire on everything is caught only by the null arm.** The known-bad set alone would have passed it. That is precisely the shape §8 of this document is about.
>
> **Disclosed limits, carried in `SECURITY.md` rather than left to be discovered:** the header exemption is now strict enough to flag a short property name that does not spell its header out, and a value composed entirely of words from its own identifier still passes it. `SECURITY.md` also gained a *"How this scanner is known to work"* section carrying the standing obligation — when you change the scanner, add the input that would have caught the defect you are fixing.

`SECURITY.md:69-71` says the rule flags "a name **containing** secret/token/password/passwd/api_key". The regex requires the keyword to **end** the name.

Controlled experiment, identical values committed twice — only the identifier changed:

```
keyword mid-name  (SECRET_KEY, STRIPE_SECRET_KEY, ...)  -> EXIT 0, clean
keyword at end    (same values)                          -> EXIT 1, flagged
```

`SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` — the two examples `SECURITY.md` itself names — pass undetected. There is no Stripe rule either, so `sk_live_...` is undetected end to end.

**Fix both the prose and the regex.** Widening will produce new hits on the existing tree; run it before merging.

### UI-01 · MAJOR · ~~Approve/Reject being wired backwards is undetectable~~ — CLOSED in `ab52a38`

> **Closed, in two halves.** The finding named two independent swaps, and one test file cannot catch both: `ApprovalQueuePanel.test.tsx` presses the buttons and asserts each reaches its own callback and not the other; `MissionControlOverview.test.tsx` asserts Approve POSTs to `/approve`, Reject to `/reject`, and that the announcement matches the request actually sent.
>
> Each mutation turns exactly one file red and leaves the other green — which is the evidence that the two halves are genuinely separate rather than duplicated.
>
> The panel suite carries an explicit null arm proving `renderToStaticMarkup` output is byte-identical for a correct and a swapped panel. It stays green under the swap; that is the point of it.

`components/mission-control/ApprovalQueuePanel.tsx:135,151`. The only test rendering this component uses `renderToStaticMarkup`, whose output **contains no handler information at all** (reviewer rendered it and inspected).

Swap `onApprove`/`onReject`, or swap `"approve"`/`"reject"` at `components/dashboard/MissionControlOverview.tsx:167-168` — byte-identical HTML, 400/400 green, no e2e coverage. **The Founder presses Approve and the request is rejected.**

This is the one irreversible control in the product and the least verified line in it. Fix is one `.test.tsx` using the already-configured `dom` project and `@testing-library/react`.

### DOC-02 · MAJOR · ~~OBL-12 will silently delete two amendments~~ — CLOSED in `a788b75`

> **Closed.** OBL-12 now reads eight deltas, A-1 through A-7, and defers the count to the roadmap rather than restating it — so the two records cannot drift apart again. The `.docx` is safe to re-save.

`docs/plans/OPEN_OBLIGATIONS.md:64` says the `.docx` differs by **"A-1..A-5 / six deltas."** `docs/roadmap/MASTER_ROADMAP.md:96-100` says **A-1 through A-7 / eight deltas.** The roadmap is right — A-6 and A-7 were added after OBL-12 was written.

**If you re-save the `.docx` against OBL-12's stated scope, A-6 and A-7 fall outside the governing document while the register reads closed.** Those two are the amendments requiring that a proof be demonstrated capable of failing and that controls be independently re-derived.

**One-line fix, and it must land before anyone touches the `.docx`.**

---

## 4. ~~Should fix — real defects, not blocking~~ — ALL CLOSED, third batch

> **All thirteen are closed.** Where a commit did more than the finding asked, or reversed a judgement made in an earlier one, that is noted — those are the ones a later reader needs.
>
> | ID | Closed in | Note |
> |---|---|---|
> | **CI-02 + CI-07** | `e318491` | One fix. Naming an explicit `REQUIRED_CHECKS` set makes the job's name true and dissolves the self-counting deadlock for free — the release workflow's own in-progress runs are simply not in the allowlist. Takes the latest run per name, so a historical failure no longer blocks a commit forever, and rejects `skipped`, which the old code accepted. All 16 required names were mechanically cross-checked against real job definitions; a typo there would make releases permanently impossible. **Opened `OBL-29`** — two lists that can now disagree. |
> | **SVC-03** | `804d56e` | All three re-dispatch paths use `recoveryInstructions(execution)`. Reverting turns three tests red, one asserting a callback cannot make the retry run *"Delete the production database."* Discloses that `CompleteExecutionInput.instructions` is now optional and descriptive-only. |
> | **UI-06 + UI-07** | `d7e9c97`, **judgement reversed in `e27043c`** | One bug from two sides, fixed in one place: a module-scope store consumed via `useSyncExternalStore`, reference counted, each request taking a monotonic sequence before it leaves. Measured 4 requests per 9s across two consumers where per-instance loops give 8. **`e27043c` (P1-23) then reversed the part `d7e9c97` got wrong** — that commit deliberately left failure accounting ungated, reasoning that a failed request is evidence about the connection regardless of ordering. True of connections, false of this variable: three superseded failures reported `disconnected` while the page displayed a snapshot that arrived after all three departed. **Two high-water marks, not one** — the obvious fix breaks the other direction by discarding a late success older than a failed request but newer than what is displayed, and a test pins that distinction and goes red against the naive variant. |
> | **UI-05** | `d7e9c97` | `#8a92a0`, recomputed from the SC 1.4.3 definition rather than trusting the suggested value. **The reviewer's stated floor of 5.66 is wrong** — the true floor is 5.474 on `--surface-3`. A second arm catches the pointwise-fix trap this repo already fell into twice. |
> | **UI-04** | `d7e9c97` | Established by walking the rendered DOM, not by reading source. Each region is now a labelled tab stop carrying a live item count. A second arm proves the naive `tabIndex={0}`-only fix still fails. |
> | **UI-03** | `d7e9c97` | 38 tests, ordered by consequence. |
> | **ARCH-02** | `804d56e` | Both sites write through `updateTaskStatusIf` with the authorizing fact as a precondition, evaluated in the same synchronous step as the write; a refused write is recorded on the timeline. Two independent mutations redden opposite halves, which is the evidence they are not duplicate coverage. **`638e45c` (F-3) then closed half of it that this commit left open:** the escalation side *discarded* the refusal result where the founder-request side recorded it. Both now record, keyed so a replay does not duplicate, and `updateTaskStatusIf` returns the task when it is already at the target so a no-op is not recorded as a divergence. **`claimTask` is the fourth status writer and was deliberately left alone** — now `OBL-37`. |
> | **SVC-04** | `804d56e` | Six equivalence cases assert deep-equality with the old whole-state path, and a null arm asserts the spy fires when the projection genuinely is called — so *"never builds the state"* cannot be satisfied by a dead counter. |
> | **SEC-04** | `647701f` | Destructure-with-rename and aliased `process.env`. |
> | **SEC-07 / SVC-10** | `804d56e` | Shape-matched before coercion, then range-checked. |
> | **UI-08** | `d7e9c97` | The replacement resolves the datalist the way a browser does; the source-scraping file is **deleted** rather than kept alongside. The same class was found again in `42b586d` (P2-43) in a different file and fixed the same way. |

| ID | Problem | Location |
|---|---|---|
| **CI-02** | `release.yml` counts its own in-progress check run, so the release path cannot complete. Zero `v*` tags exist. Also accumulates check runs per workflow run, so a historical failure blocks a commit forever. | `.github/workflows/release.yml:290-311` |
| **CI-07** | The job named "Verify Required Checks" verifies no *required* check — a single passing check of any kind satisfies it. | `release.yml:268-337` |
| **SVC-03** | Retry re-dispatch runs **caller-supplied** instructions instead of the execution's immutable persisted request. Every other path uses `recoveryInstructions()`. A completion callback omitting `instructions` re-runs the work with `""`. | `lib/dev-hq/agent-execution-service.ts:991-994` |
| **UI-07** | An in-flight poll can overwrite a fresh post-decision snapshot — an approval reappears as pending after the Founder approves it. No request-generation guard. | `lib/mission-control/useDevHqState.ts:55-70` |
| **UI-05** | `COLORS.idle` (`#6b7280`) fails WCAG AA as text in ~20 places (3.55–3.99:1). **The codebase already fixed this twice pointwise** — `app/globals.css:17-19` and `components/workflow/ActivityFeed.tsx:18-20` — but not the shared constant. Suggested `#8a92a0` (5.66–6.43:1). | `lib/theme.ts:19` |
| **UI-04** | Five scrollable regions have no `tabIndex` and contain zero focusable descendants — keyboard users cannot scroll them. WCAG 2.2 Level A. The Evidence & Audit Trail is mouse-only past 520px. | `AgentStatusRail.tsx:24`, `AuditTrailPanel.tsx:61`, `ActivityStreamPanel.tsx:39`, `ActivityFeed.tsx:40`, `DispatchAgentPanel.tsx:385` |
| **UI-03** | `lib/mission-control/view-model.ts` — 575 lines deriving the entire UI, no direct test. Pure, synchronous, dependency-free: the cheapest thing in the codebase to test and the widest blast radius on screen. | new `view-model.test.ts` |
| **ARCH-02** | Two orchestrators write `Task.status` with no coordination. `updateTaskStatusIf` exists and is used at **1 of 4** sites. An escalation can be open on a task the founder-request flow has marked `completed`. | `founder-request-service.ts:398`, `escalation-service.ts:86-95`, `dev-task-repository.ts:64` |
| **SVC-04** | Reading the event feed rebuilds and sorts the **entire** Dev HQ state, then discards all but 20 events. Polled every 3s. | `lib/dev-hq/adapters/dev-event-logger.ts:27` |
| **UI-06** | `useDevHqState()` called twice in sibling components — two independent 3s polling loops. Measured 6 requests per 9s. The two halves of the page can display different snapshots. | `MissionControlOverview.tsx:29`, `DispatchAgentPanel.tsx:66` |
| **SEC-04** | Token rule misses destructure-with-rename and aliased `process.env`. | `.semgrep/dev-hq-boundaries.yml:108-113` |
| **SEC-07 / SVC-10** | `/api/dev-hq/events` doesn't validate `limit`. `?limit=abc` → 200 with 0 events; `?limit=-5` silently drops the oldest. | `app/api/dev-hq/events/route.ts:6` |
| **UI-08** | Dispatch-capability control scrapes the component's **source text**; misses rendered-value drift and an orphaned `list=` attribute. | `components/dashboard/dispatch-capabilities.test.ts:22-30` |

---

## 5. ~~Record corrections~~ — ALL CLOSED, and **four of the filed findings were themselves wrong**

> **All eleven are closed.** `e318491` carried most of them, and the part worth reading is that it declined to apply four of the findings as filed, recording why instead.
>
> | ID | Closed in | Note |
> |---|---|---|
> | **DOC-01 / CI-04 / CI-11** | `e318491` | OBL-28's closure **retracted**, reopened as `OBL-30` **without** wiring the verifier into CI — adding an enforcement gate is a Founder decision, and the recommendation is recorded as a recommendation. |
> | **DOC-07** | `e318491` | An **11th** false path (`BOOTSTRAP.md`) was found that the finding had not named, and README named three handbooks that do not exist. |
> | **DOC-03** | `e318491` | **The finding understated it.** Roadmap v8.0 does not merely exist at no path — the file was *born* as v10.4, so the cited 1,923 lines match no version that ever existed, and GBR-PACKET-001's stated baseline commit contains none of the five artifacts it claims to review. |
> | **DOC-04** | `e318491` | **The finding's diagnosis was wrong** and is recorded as such rather than applied. `OBL-15`/`OBL-16` correctly track the obligation to *record a decision*; the real gap was that the underlying contradictions were never entered at all, and Q4 was tracked nowhere. Now `X-26`/`X-27`/`X-28` in the authority register. |
> | **DOC-05** | `647701f` | See `OBL-33(a)` in the obligations register, now closed. |
> | **DOC-06** | `e318491` | `GIT_STANDARD.md` §Branch Strategy corrected to the two branches that exist. **No decision was taken and the protected set was not widened** — `X-19` is still open. |
> | **DOC-08** | `e318491` | OBL-24's self-contradicting row corrected. |
> | **DOC-09** | `e318491` | Entered as `OBL-31`. Authoring the three standards was explicitly out of scope; the disposition is a Founder decision. |
> | **DOC-12** | `8468d17` (untrack + ignore rule), recorded as `OBL-32` in `e318491` | `OBL-32` is now in the Closed table with its evidence. |
> | **SEC-06** | `e318491` | **The finding was wrong**: `@opentelemetry/core` was not the only override without a rationale key — `socket.io` had none either. Both now have one. |
> | **UI-09** | `d7e9c97` | **The finding's documentation side was already correct**; the overstatement lived only in the e2e comment. **Provenance note:** `e318491`'s message says the comment *"is corrected here"*. It was not — `git log -S "See OBL-11" -- e2e/mission-control-viewport.spec.ts` names `d7e9c97`, the commit immediately before it. |

| ID | Problem | Location |
|---|---|---|
| **DOC-01 / CI-04 / CI-11** | **Found independently by three reviewers.** OBL-28 is in the `## Closed` table; the verifier runs in **no workflow**. "Wired to its test harness" ≠ enforcement. The gap it closes is still open. | `docs/plans/OPEN_OBLIGATIONS.md:94` |
| **DOC-07** | `README.md` and `ONBOARDING_GUIDE.md` publish a tree where **10 of 16 directories don't exist** — including `constitution/`. `AGENTS.md` mandates "Read the Company Constitution" as step 2 and gives no path. Actual: `docs/company/COMPANY_CONSTITUTION.md`. CI enforces those files *exist*, not that they're true. | `README.md:51-76`, `ONBOARDING_GUIDE.md:41-63` |
| **DOC-03** | Four governance documents cite **Master Roadmap v8.0** as live authority. v8.0 exists at no path. `GBR-PACKET-001:90` states 1,923 lines; actual is 2,361. | `AUTHORITY_AND_CONTRADICTION_REGISTER.md:9,65,73`, `CURRENT_PROGRESS_UPDATE.md:10,187,195,264`, `PERMANENT_OPERATING_HANDBOOK.md:9,79,87`, `GOVERNANCE_BASELINE_REVIEW_PACKET.md:90,114` |
| **DOC-04** | The roadmap routed 4 governance questions to the authority register. Three landed in the obligations register instead. The fourth — **v8.0 → v10.4 supersession** — is tracked **nowhere**. | `MASTER_ROADMAP.md:165-192` |
| **DOC-05** | `eslint.config.mjs:28-30` says OBL-08 "remains open"; the register closed it and `tsconfig.json:33` proves the closure. | both files |
| **DOC-06** | `GIT_STANDARD.md` protects `main` and `develop`. `develop` **does not exist**; the actual default branch `feature/dev-hq-operating-system` is named nowhere in the standard. | `standards/GIT_STANDARD.md:42-47` |
| **DOC-08** | OBL-24 contradicts itself inside one table row ("not in dependencies.yml" / "dependencies.yml now pins"). | `OPEN_OBLIGATIONS.md:52` |
| **DOC-09** | `NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, `ERROR_HANDLING_STANDARD.md` are required by **14 of 19** `AGENT.md` files and don't exist. Not in any obligation row. | `standards/` |
| **DOC-12** | A `__pycache__/*.pyc` is tracked; `.gitignore` has no rule for it. Committed in `c8c4c38`. | `scripts/__pycache__/` |
| **SEC-06** | `//overrides.scoping` claims all overrides are parent-scoped. `@opentelemetry/core` is **global** and is the only entry with no rationale key. | `package.json` |
| **UI-09** | The e2e no-horizontal-scroll assertion is described as distinguishing "renders on mobile" from "usable on mobile" — but under the e2e build **0 of 10** Mission Control panels render. | `e2e/mission-control-viewport.spec.ts:108-110` |

---

## 6. DEFERRED — architectural, needs your decision

**No redesign was proposed for any of these, per your constraint.** **Nothing in this section was touched by the third batch either** — every item below is open exactly as filed. Two annotations only, both about what is now *possible* rather than what was done:

### ARCH-10 · The approved persistence deferral and the approved exit gates are mutually unsatisfiable
> ADR-0002 E9: persistence is **deferred** out of Phase 1.
> Roadmap §9: four of six gates require proving properties **"from stored records."**

**Engineering can close every finding in this document and Phase 1 still will not exit.** Options stated neutrally: lift the deferral, re-scope the gates, or split into Phase 1 / Phase 1.5 tiers. Belongs in the authority register.

### The highest-leverage structural item
`proxy.ts:11` keys on `NODE_ENV === "production"`, conflating **"optimized build"** with **"internet-reachable host"**. That single conflation:
- blocks the Mission Control gate (OBL-11) — the only gate blocked by something other than unbuilt product
- makes ADR-0001 D1's two-layer retry boundary unexercisable
- means the entire durable execution spine has **never been exercised end to end in a build anyone would ship**

Replacing it with an explicit default-deny capability is a handful of lines and changes no architecture — **but it must land together with ARCH-01's tests, never before them.** Loosening a boundary nothing tests is how a fix becomes an incident.

**I did not touch this.** It changes a security boundary's behaviour and is yours.

> **Annotated 2026-07-29.** The stated precondition is now met: **ARCH-01's tests exist** (`aea4d6b`), `proxy.test.ts` and `lib/dev-hq/internal-guard.test.ts` cover all four guard arms plus the production block and the matcher's reach, the e2e requires at least one refused Dev HQ request, and all of it was proved capable of failing across four restored mutations. `508609c` and `b7b6d4b` then hardened the Semgrep guard rule around the same boundary and verified both directions against the **real** `lib/dev-hq/internal-guard.ts` rather than a copy. **This changes nothing about whose decision it is** — the boundary's behaviour is still yours to change or leave — but *"never before them"* no longer blocks it.

> **`ARCH-03` sharpened, not closed.** `3471658` added a stall deadline that ends silent stranding for queued executions, so one class of work that neither completes nor fails now escalates. **The circularity ARCH-03 names is untouched:** the deadline is evaluated inside the same recovery sweep whose only automatic trigger is Trigger.dev. `3471658` also disclosed a related gap it traced and deliberately did not change — `findByExecution` did not filter by origin, so `reconcileUnescalatedFailures` would skip its backstop once a stall escalation existed. Not reachable at the time, because `reconcileAttemptRecords` runs earlier in the same sweep, but *"covered by a different reconciler that happens to run first"* is exactly the load-bearing accident this codebase keeps getting bitten by. **`638e45c` (F-5) closed it**: `types/contracts/escalation-store.ts:48-51` makes `origin` a **required** parameter, so the origin-agnostic query cannot be asked by omission, and `agent-execution-service.ts:1332` now asks specifically about `"retry_exhausted"`. The review-service call site was under-reporting for the same reason and was corrected with it. **Nothing here touches ARCH-03's circularity.**

### Others deferred
| ID | Problem |
|---|---|
| **ARCH-03** | The recovery sweep's only automatic trigger is Trigger.dev — the subsystem whose failure it exists to repair. Circular. |
| **ARCH-06** | A `next dev` restart destroys all authoritative state and leaves orphaned Trigger runs with no record. Every recovery mechanism protects against partial failure *within* one process lifetime. |
| **ARCH-07** | The audit backbone is a 200-entry ring buffer. ADR-0002 E5 requires an immutable append-only timeline; the Quality-and-governance gate requires an "unbroken chain". |
| **SVC-05** | Founder-facing mutation routes (approve/reject/escalation-resolve) have no authentication and no production guard. ADR-compliant; standard-noncompliant. A real fix needs an auth system. |
| **SVC-06** | Unbounded store growth plus five full-store scans per minute, with a nested linear scan. Superlinear in accumulated history. |

---

## 7. What the reviewers found genuinely clean

Worth recording, because "no finding" is evidence:

- **`proxy.ts` held under attack.** Seven bypasses constructed — URL encoding, double slash, traversal, trailing slash, case — all returned 403 against a real production server.
- **The internal guard fails closed**, verified live: 503 when the token is unconfigured.
- **The `PublicReview` secret boundary** is type-enforced and correct; no third path returns a raw `Review`.
- **No secrets logged anywhere.** Zero `console.*` in `app/`, `lib/`, `components/`, `trigger/`. Zero `dangerouslySetInnerHTML`.
- **The Execution Manager's concurrency is sound** — every check-then-act runs with no `await` between read and write. Idempotency is structural, not conditional.
- **Supply chain**: every action SHA-pinned, `actionlint` checksum-verified before use, no `pull_request_target` anywhere.
- **Type safety**: zero `any`, zero `@ts-ignore`, one non-null assertion in the whole service layer.
- **No test-ordering dependence**: `--sequence.shuffle` passes.

**Three reviewers caught themselves mid-error and said so** — one nearly filed a fabricated CRITICAL from a stale build manifest, one had a `| head -5` swallow an exit code, one reported a locale-decoding bug in its own harness.

---

## 8. The pattern underneath

Nine separate instances, found independently by all six reviewers: **controls that report green on the input they exist to reject.**

The audit exception list keyed on package instead of advisory. The first workflow verifier comparing one field of five. The mutation harness whose cases passed for free. The Semgrep positive control with no null arm. The e2e that can't detect the boundary vanishing. The permissions auditor blind to job-level escalation. The approve/reject test that can't see handlers.

`standards/CONTROL_VERIFICATION_STANDARD.md` and roadmap amendments A-6/A-7 were written in response. **Both were then violated by controls written after them** — which is the strongest argument for its rule 4: *the author does not write the control's only negative controls.*

**Update, 2026-07-29 — the third batch is more evidence for the same pattern, not less.** Nine became considerably more, and every new instance was found by rule 4 doing its job:

- `508609c` found **six** bypasses in controls `647701f` had landed *minutes earlier*, including one (P1-17) that switched the entire secret scanner off for any identifier containing the word `header`.
- `b7b6d4b` found that the credential auditor had **no positive control at all** — it had been bypassed in every prior round and had never once been shown going red on a known-bad input in CI. Its MAJOR-1 is the cleanest specimen in this document: a **one-character** path-glob narrowing removed six of ten real routes from the blocking gate **while the control reported all 12 known-bad detected and exit 0**.
- `65bdf2a` found that `e318491`'s claimed nine-fixture harness **was never committed** — evidence discarded to a scratch directory, which under rule 1 cannot be re-derived by any reviewer. `scripts/test-release-controls.py` now carries what that claim asserted.
- `7972df4` found a rule-1 green **inside the harness that exists to prove controls are not hollow**: PATH interception works for bash, but the validate step calls `subprocess.run(["gh", ...])` from Python, and Windows `CreateProcess` appends only `.exe`, so it resolved past the extensionless stub to the real installed `gh`. The known-bad case then **passed anyway**, on real `gh`'s unrelated *"none of the git remotes point to a known GitHub host"* error. Each case now asserts the stub actually served the call. Windows-specific; it would never have surfaced on a Linux runner.
- Five separate tests were found **encoding a defect as the intended contract** and were rewritten rather than deleted (`638e45c` names the fifth). `42b586d` removed one that pinned an ordering by `indexOf` over sliced source text — satisfied by a *mention* rather than a call, and demonstrated green against exactly the inversion it existed to catch.

**`65bdf2a` also records rule 4 not holding for itself:** its author wrote both the controls and their negative controls, and says so. The resume relaxation of the duplicate-tag guard and the `release not found` string match both still want a second party re-deriving them.

---

## 9. Suggested order

1. ~~**DOC-02**~~ — done, `a788b75`
2. ~~Commit the token fix (§2)~~ — done, `7079779`
3. ~~**ARCH-01 / UI-02**~~ — done, `aea4d6b`
4. ~~**UI-01**~~ — done, `ab52a38`
5. ~~**CI-03, CI-05, CI-06, SEC-02, SEC-04** — the control gaps, as one batch~~ — done, `8468d17` + `647701f`, hardened again in `508609c` and `b7b6d4b`
6. ~~**SEC-03** — regex *and* prose~~ — done, `647701f`; three further bypass rounds followed
7. ~~**UI-05, UI-04** — accessibility, both small~~ — done, `d7e9c97`
8. ~~Record corrections (§5) as one documentation pass~~ — done, `e318491`
9. **§6 to you.** ARCH-10 first — it governs whether any of this ends in a Phase 1 exit ← **the only item left in this document**

**Ahead of §6, two things now block on you that did not exist when this list was written:**

- **`OBL-34`** — the `production-release` environment does not exist (`gh api repos/:owner/:repo/environments` → `total_count: 0`), so `release.yml`'s approval gate has no required reviewer and no self-review prevention, and the P0-11 revalidation built for it is inert. A repository setting; nothing in a workflow can create it.
- **`OBL-36`** — what a founder `revise` means for an escalation whose execution is still `queued`. Three dispositions, recorded neutrally, none recommended. It is reachable today and produces two live agent-backed executions on one task.

Both are in `docs/plans/OPEN_OBLIGATIONS.md` with their evidence, alongside `OBL-35`, `OBL-37`, `OBL-38`, `OBL-39` and `OBL-40`. The ADR amendment the stall deadline carries — delegated on 2026-07-29, **and not yet written** — is `X-29` in the authority register.
