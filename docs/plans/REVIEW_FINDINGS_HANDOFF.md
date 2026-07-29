# Full-Repository Review — Findings Handoff

**Document ID:** HANDOFF-001
**Created:** 2026-07-29
**Status:** Active — work in progress, paused for Founder direction
**Reviewers:** 6 independent agents (5 code review + 1 architecture), run in parallel against `chore/close-open-obligations` @ `c8c4c38`

---

## How to read this

Every finding below was produced by an independent reviewer that **executed** rather than read: brute-forcing tokens, running Semgrep in Docker, mutating workflows, measuring contrast ratios in a browser, and attacking the production boundary with seven encodings. Where a reviewer could not execute something, it is labelled.

Findings are grouped by **what you'd do about them**, not by which reviewer found them.

**Current state of the branch:** 400 tests pass, lint clean, `tsc --noEmit` clean, build succeeds. Nothing is broken. Two fixes are committed; one is uncommitted and working.

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

## 2. Uncommitted but working (in the tree right now)

| ID | Problem | Location |
|---|---|---|
| **SEC-01 / ARCH-09** | Review callback token minted by `nextId()` = `rvt-<epoch-ms>-<counter>`. Reviewer **brute-forced a live token in ~250,005 guesses**, narrowed further because `/api/dev-hq/events` is unauthenticated in dev and leaks both the clock and the shared counter. The route comment claims "a fabricated token cannot advance the lifecycle" — false. | `lib/dev-hq/id.ts` (new `nextCapabilityToken`), `lib/dev-hq/review-service.ts:354` |

Tests in `lib/dev-hq/capability-token.test.ts` (untracked). Each carries a null arm asserting the **old** generator fails the same bar — including reproducing the reviewer's actual attack: increment the trailing counter and you hold the neighbouring token.

**To finish:** `git add -A && git commit`.

---

## 3. BLOCKING — fix before this branch merges

### ARCH-01 · CRITICAL · The two security boundaries have no tests
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

### CI-03 · HIGH · Workflow verifier misses 5 change classes
`scripts/verify-workflow-structure.py:61-67`. Reviewer wrote independent mutations: **author harness 16/16, independent set 6 deviations.**

The one that matters: **job-level `continue-on-error: true`** — lint, typecheck and build can all fail while the workflow reports success. Step count 21→21, guard count 8→8, verdict `ok`. Same defect shape as the deleted `if:` guard, worse impact.

Missing from `JOB_FIELDS`: `continue-on-error`, `env`, `uses`, `outputs`. Missing from `WORKFLOW_FIELDS`: `name`.

Also **CI-10**: parse failure exits 1, not 2 — violates `CONTROL_VERIFICATION_STANDARD` rule 5 (`verify-workflow-structure.py:129,147`).

### CI-05 · HIGH · Actions-hardening auditor misses job-level `permissions: write-all`
`.github/workflows/security.yml:346-350` reads only workflow-level `permissions`, only for the literal `write-all`. Proven with mutations + null arm + two passing positive controls.

**The un-wired tripwire catches this case; the control that actually runs in CI doesn't.**

### CI-06 · HIGH · Script-injection detector has major gaps
`.github/workflows/security.yml:292-294,312-321`. Misses `github.event.head_commit.message` (the classic `push` vector — 5 of 7 workflows trigger on push), `pull_request.head.ref`, `head.repo.description`, and **does not scan `with:` inputs at all**.

No live exposure — current workflows correctly route untrusted input through `env:`. This is a preventive control that doesn't prevent.

### SEC-02 · MAJOR · Semgrep guard rule blind to 3 realistic shapes
`.semgrep/dev-hq-boundaries.yml:36-40`. Verified with real Semgrep 1.145.0 in Docker, with a null arm:

- **`NextRequest`** handlers — the idiomatic Next.js type
- **Two-parameter dynamic routes** — a shape this repo **already uses** at `app/api/dev-hq/approvals/[id]/approve/route.ts:4`
- **Guard placed after a write** — the rule's message asserts "first statement"; the `pattern-not` opens with `...`, so it doesn't enforce it

Also **the Semgrep positive control has no null arm** (`security.yml:450-459`) — a rule mutated to fire on everything would pass it. That's rule 2 of the standard, violated by the control itself.

### SEC-03 · MAJOR · `SECURITY.md` overstates scanner coverage
`SECURITY.md:69-71` says the rule flags "a name **containing** secret/token/password/passwd/api_key". The regex requires the keyword to **end** the name.

Controlled experiment, identical values committed twice — only the identifier changed:

```
keyword mid-name  (SECRET_KEY, STRIPE_SECRET_KEY, ...)  -> EXIT 0, clean
keyword at end    (same values)                          -> EXIT 1, flagged
```

`SUPABASE_SERVICE_ROLE_KEY` and `STRIPE_SECRET_KEY` — the two examples `SECURITY.md` itself names — pass undetected. There is no Stripe rule either, so `sk_live_...` is undetected end to end.

**Fix both the prose and the regex.** Widening will produce new hits on the existing tree; run it before merging.

### UI-01 · MAJOR · Approve/Reject being wired backwards is undetectable
`components/mission-control/ApprovalQueuePanel.tsx:135,151`. The only test rendering this component uses `renderToStaticMarkup`, whose output **contains no handler information at all** (reviewer rendered it and inspected).

Swap `onApprove`/`onReject`, or swap `"approve"`/`"reject"` at `components/dashboard/MissionControlOverview.tsx:167-168` — byte-identical HTML, 400/400 green, no e2e coverage. **The Founder presses Approve and the request is rejected.**

This is the one irreversible control in the product and the least verified line in it. Fix is one `.test.tsx` using the already-configured `dom` project and `@testing-library/react`.

### DOC-02 · MAJOR · OBL-12 will silently delete two amendments
`docs/plans/OPEN_OBLIGATIONS.md:64` says the `.docx` differs by **"A-1..A-5 / six deltas."** `docs/roadmap/MASTER_ROADMAP.md:96-100` says **A-1 through A-7 / eight deltas.** The roadmap is right — A-6 and A-7 were added after OBL-12 was written.

**If you re-save the `.docx` against OBL-12's stated scope, A-6 and A-7 fall outside the governing document while the register reads closed.** Those two are the amendments requiring that a proof be demonstrated capable of failing and that controls be independently re-derived.

**One-line fix, and it must land before anyone touches the `.docx`.**

---

## 4. Should fix — real defects, not blocking

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

## 5. Record corrections

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

**No redesign was proposed for any of these, per your constraint.**

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

---

## 9. Suggested order

1. **DOC-02** — one line, and it's a live hazard the moment you touch the `.docx`
2. Commit the uncommitted token fix (§2)
3. **ARCH-01 / UI-02** — boundary tests. Highest value in the document
4. **UI-01** — Approve/Reject test
5. **CI-03, CI-05, CI-06, SEC-02, SEC-04** — the control gaps, as one batch
6. **SEC-03** — regex *and* prose
7. **UI-05, UI-04** — accessibility, both small
8. Record corrections (§5) as one documentation pass
9. **§6 to you.** ARCH-10 first — it governs whether any of this ends in a Phase 1 exit
