# Sprint 1E Overnight Autonomous Validation — Run Ledger

**Run ID:** sprint-1e-overnight-2026-07-26
**Started:** 2026-07-26
**Coordinator:** Claude Code session (Opus 5)
**Mode:** Self-paced `/loop` (dynamic pacing)

---

## Target under test

| Item | Value |
|---|---|
| Baseline tag | `sprint-1e-baseline` (annotated, object `cda7aa1b15e0009e17dfd7f194570b2f013f6bf7`) |
| Baseline commit | `62f629128e5092f593ff494cd729fe516694bbde` |
| Validation branch | `validation/sprint-1e-overnight-2026-07-26` |
| Branch created from | The tag, verified equal to baseline commit at creation |

**Immutability rule:** the tag and its commit are never an argument to any writing
command. No force-push, reset, clean, deploy, file deletion, or Sprint 1F work.
All commits land only on the validation branch.

---

## Locked operating decisions (Founder-approved)

| Decision | Setting |
|---|---|
| Autonomy | Self-paced `/loop`; state carried in this ledger between wake-ups |
| New tests | Regression tests permitted **only** to prove a confirmed defect and its fix |
| Patching | LSE specifies patch → coordinator applies verbatim → LSE verifies → CR + AR review |
| Fix acceptance | Requires **both** independent CR and AR approval |
| Retry cap | 3 attempts per issue |
| Max runtime | 8 hours |

**Known structural constraint:** the three specialist agents
(`lead-software-engineer`, `independent-code-reviewer`, `architecture-reviewer`)
are defined without `Write`/`Edit` tools. The coordinator applies patches as LSE's
hands. The coordinator never reviews its own patch application; CR and AR are
independent of it.

---

## Phase status

| Phase | Description | Status |
|---|---|---|
| 0 | Branch setup from tag | ✅ Complete |
| 1 | Deterministic gates | ✅ Complete — 4/4 green |
| 2 | Behavioral probing (10 embedded categories) | ⚠️ LSE-1E has NOT reported; CR-1E ✅ reported (12 findings) |
| 3 | Adversarial architecture review | ✅ AR-1E reported — PASS with non-blocking follow-ups, 0 blockers, 6 findings |
| 4 | Synthesis and recommendation | ⬜ Not started |

---

## Phase 1 — Deterministic gate results

Run against the validation branch at `62f6291` (identical tree to baseline).

| Gate | Command | Exit | Result |
|---|---|---|---|
| Tests | `npx vitest run` | 0 | **22 files, 317 tests passed** |
| TypeScript | `npx tsc --noEmit` | 0 | No diagnostics |
| ESLint | `npx eslint .` | 0 | No diagnostics |
| Production build | `npx next build` | 0 | Compiled successfully; 23 route entries (22 excluding `/_not-found`) |

**Comparison to baseline record:** `SPRINT_1E_COMPLETION_NOTES.md:99-102` documents
22 files / 317 tests, tsc clean, eslint clean, build exit 0. Phase 1 **reproduces the
documented baseline exactly.** No regression, no environment drift.

Working tree verified clean after the build; no build artifact entered the tracked
tree (`.next/` and `*.tsbuildinfo` are gitignored).

Raw logs: session scratchpad `logs/gate{1..4}-*.log`.

---

## Validation category coverage map

Only 4 of the 14 requested categories are runnable commands. The other 10 exist as
assertions embedded in the 22 unit test files, mapped below by grep across the tree.

| Category | Type | Owning files |
|---|---|---|
| Tests / TypeScript / ESLint / Build | Command | Phase 1 above |
| Replay | Embedded | `execution-manager`, `agent-execution-service`, `review-service`, `escalation-service`, `actions`, `dev-evidence-store`, `dev-review-store`, `review/complete` route |
| Retry | Embedded | `execution-manager`, `agent-execution-service`, `review-service`, `escalation-service`, `founder-request-service`, `dev-escalation-store`, `pending-dispatch` |
| Crash recovery | Embedded | `escalation-service`, `founder-request-service`, `review-service` |
| Reconciliation | Embedded | `agent-execution-service`, `escalation-service`, `review-service` |
| Concurrency | Embedded | `execution-manager`, `agent-execution-service`, `review-service`, `escalation-service`, all three `dev-*-store` adapters |
| Idempotency | Embedded | `execution-manager`, `agent-execution-service`, `review-service`, `escalation-service`, `founder-request-service`, `actions`, `state` route, `review/complete` route |
| Invariant validation | Embedded | `escalation-service`, `review-scope`, `dispatch-capabilities` |
| Review lifecycle | Embedded | `review-service`, `review-scope`, `review-projection`, `dev-review-store` |
| Evidence lifecycle | Embedded | `dev-evidence-store`, `agent-execution-service` |
| Escalation lifecycle | Embedded | `escalation-service`, `dev-escalation-store`, escalation routes |
| **Execution lineage** | **Deferred** | See scope note below |

### Scope note — execution lineage

`SPRINT_1E_COMPLETION_NOTES.md:52` records **1E-8 (execution timeline and audit
history) as deferred to Sprint 1F by Founder decision (PE-2)**, and 1E-9 as partial
with the timeline read-model deferred. Execution lineage is therefore validated as
*correctly absent*, not as behavior. Implementing it would constitute beginning
Sprint 1F, which is prohibited for this run.

---

## Issue register

Phase 1 produced zero failures. All entries below come from **static source tracing
by CR-1E — none has been reproduced.** The fix protocol requires reproduction before
any patch is applied, so every issue is `AWAITING_REPRO` pending LSE-1E.

Full report: `agents/independent-code-reviewer/outputs/SPRINT_1E_OVERNIGHT_CR_REVIEW.md`

| ID | Sev | Category | Status | Attempts | CR | AR |
|---|---|---|---|---|---|---|
| F1 | Major | Dead recovery path (claim-race loser hard-fails) | AWAITING_REPRO | 0 | raised | pending |
| F2 | Major | Lost reclaim audit records (unkeyed, unreconciled) | AWAITING_REPRO | 0 | raised | pending |
| F3 | Minor | Dev-only unauthenticated escalation routes | **CLOSED — refuted, accepted by CR-1E** | — | withdrawn | concurs |
| F4 | Major | Heartbeat throws where siblings no-op | AWAITING_REPRO | 0 | raised | pending |
| F5 | Minor | Lost update on task status | AWAITING_REPRO | 0 | raised | pending |
| F6 | Minor | Full read-model rebuild per event list | AWAITING_REPRO | 0 | raised | pending |
| F7 | Minor | `AssignmentDecision` permits invalid states | AWAITING_REPRO | 0 | raised | pending |
| F8 | Minor | Unsound non-null assertion (PLAUSIBLE) | AWAITING_REPRO | 0 | raised | pending |
| F9 | Obs. | Module-local id sequence vs global store | **DOWNGRADED by CR-1E to observation** | 0 | self-downgraded | corroborated (AR2-3) |
| F10 | Minor | `eventKeys` unbounded growth | AWAITING_REPRO | 0 | raised | pending |
| F11 | Minor | Unvalidated enum, `internal/finalize` (pre-1E) | AWAITING_REPRO | 0 | raised | pending |
| F12 | Minor | Unbounded recovery cycling (PLAUSIBLE) | AWAITING_REPRO | 0 | raised | pending |

### AR-1E architectural findings

Full report: `agents/architecture-reviewer/outputs/SPRINT_1E_OVERNIGHT_AR_REVIEW.md`
Verdict: **PASS WITH NON-BLOCKING FOLLOW-UPS — 0 blockers.**

| ID | Dimension | Status | Attempts | CR | AR |
|---|---|---|---|---|---|
| AR2-1 | ADR-0001 O6 violation — 5/10 capabilities unassignable, no decline event | AWAITING_REPRO | 0 | pending | raised |
| AR2-2 | Lifecycle violation — Task/Execution decoupled both directions | AWAITING_REPRO | 0 | pending | raised |
| AR2-3 | Id generation process-local vs `globalThis` store | AWAITING_REPRO | 0 | pending | raised |
| AR2-4 | Review handoff recovery path not the one the callback replays | AWAITING_REPRO | 0 | pending | raised |
| AR2-5 | Authorization depth asymmetry | **PARTIALLY resolved — registration question closed; two recommendations OPEN** | 0 | endorses | raised |
| AR2-6 | `ExecutionRunner` port omits `assignmentId` | AWAITING_REPRO | 0 | pending | raised |

### Independent convergence between reviewers

CR-1E and AR-1E worked without sight of each other and independently landed on the
same two properties. Convergence raises confidence materially:

- **Id generation** — CR-1E F9 and AR-1E AR2-3, same mechanism
  (`id.ts` module-local `sequence` vs `globalThis`-scoped store), reached separately.
- **Unbounded `eventKeys` growth** — CR-1E F10 and AR-1E's persistence §, same
  observation that `events` is capped at 200 while the key map is not.

Both reviewers also independently declined to treat the deferred 1E-8/1E-9 timeline
work as a defect, correctly reading it as approved scope.

### Coordinator verification — F3 partly refuted, and AR2-5 resolved

CR-1E claimed the founder escalation routes are "not disabled in production,"
having searched for `middleware.ts` and found none. **This conclusion is false.**
Next.js 16 uses `proxy.ts`, present at the repo root:

- `proxy.ts:20-22` — matcher `/api/dev-hq/:path*`
- `proxy.ts:11-17` — 403 for the whole Dev HQ surface when `NODE_ENV=production`
- Phase 1 build output confirms it active: `ƒ Proxy (Middleware)`

Surviving finding: in development those routes have no per-route auth — but
`proxy.ts:3-9` already documents that as a deliberate accepted posture, naming the
founder endpoints explicitly. **Reclassified Major → Minor / known-accepted.** Not a
new Sprint 1E authorization gap. Input to the Sprint 1F auth boundary.

Verified independently by the coordinator by reading `proxy.ts`, `internal-guard.ts`,
and the four escalation route files, and by grepping guard usage across `app/`.

**AR-1E independently challenged this refutation** (AR2-5), finding
`.next/server/middleware-manifest.json` empty (`middleware: {}`,
`sortedMiddleware: []`) and declining to conclude the proxy is active. It listed
"evidence that `proxy.ts` is inert" as a condition that would flip its verdict to FAIL.

**Coordinator resolution — registration confirmed, FAIL condition not met.** Next 16
registers the proxy in `.next/server/functions-config-manifest.json` under
`/_middleware` with `originalSource: "/api/dev-hq/:path*"`, mirrored in
`_clientMiddlewareManifest.js`. The legacy `middleware-manifest.json` is a stale
artifact. The registered regexp was executed against real paths and matches all three
escalation routes plus `/escalations` and the internal dispatch route, while correctly
rejecting `/api/other/thing`.

**Limit:** this confirms registration from build artifacts. No production server was
run, so runtime enforcement remains unexecuted.

**AR2-5 is NOT closed outright — correction applied at AR-1E's request.** The
resolution settled only the *registration* question. Two recommendations remain open,
and AR-1E rates the first **higher** now than when filed, not lower:

1. **No test anywhere exercises `proxy.ts`** (verified against the full 22-file
   inventory). Registration turned out to depend on a manifest whose canonical
   location **moved between Next major versions** — which is precisely the mechanism
   by which a future upgrade could silently un-register the only control on the most
   privileged founder surface, with nothing failing to signal it. The untested
   boundary is the finding; the resolution raised its priority.
2. **Add per-route production disabling** to the three escalation-resolution routes
   for defence in depth. **CR-1E independently endorses this**, noting the current
   posture makes the whole Dev HQ surface depend on a single root-level file whose
   comment predates and does not name the Sprint 1E routes it now protects.

---

## REPRODUCED BY EXECUTION — AR2-1 and X1

**First executed reproduction of the run.** Performed by the coordinator after
LSE-1E did not deliver (see coordinator error note below). A temporary diagnostic
harness was written at `lib/dev-hq/__diagnostic__/ar2-1-repro.test.ts`, run against
the validation branch, and **deleted immediately**. It was never committed. Assertions
were written to FAIL if the defect is real, so a failing run is a positive
reproduction.

Raw log: scratchpad `logs/repro-ar2-1.log`.

| Check | Assertion | Result |
|---|---|---|
| REPRO-A | Unassignable capabilities exist in the seeded roster | passed (arithmetic confirmed) |
| REPRO-B | A decline logs an event | **FAILED — `expected 0 to be greater than 0`** |
| REPRO-C | A declined dispatch leaves no stranded execution | **FAILED — 1 stranded execution** |

**REPRO-B — AR2-1 confirmed by execution.** Dispatching with
`requiredCapabilities: ["implementation"]` (held only by `agent-claude`, seeded
`busy`) returns `assigned: false, reason: "no_agent_available"` and logs **zero
events** — event count 0 before and 0 after. **ADR-0001 O6 requires a logged event on
no-match. It is violated, and the violation is now demonstrated rather than argued.**

**REPRO-C — X1 confirmed by execution.** The same decline leaves a stranded record:

```
{ id: 'exec-dispatch-dsp-1785057217829-2', status: 'queued', agentId: null }
```

The canonical execution is created *before* assignment is attempted, then stranded
`queued` with no agent, no terminal state, no escalation, and no founder-facing
signal. `reclaimStale` only touches `running`, so nothing reclaims it.

**Why the existing suite misses this.** `agent-execution-service.test.ts:110-119`
covers the same decline path and asserts only `assigned === false` and
`reason === "no_agent_available"`. It never asserts the event or the stranding, so it
passes green while both properties fail — the same "green test that pins the wrong
thing" pattern CR-1E identified in F1.

**Attribution.** AR2-1 raised by AR-1E. The stranded-execution consequence (X1) was
identified by CR-1E while cross-checking AR-1E, in CR-1E's own assigned dimension,
which it credited to AR-1E explicitly. Reproduced by the coordinator.

### Registered as X1

| ID | Sev | Category | Status | Attempts | CR | AR |
|---|---|---|---|---|---|---|
| X1 | Major | Declined dispatch strands an execution `queued` forever | **REPRODUCED** | 0 | raised | raised (as AR2-1 consequence) |

CR-1E recommends folding F12 (unbounded recovery cycling) under X1 — same family, but
X1 is reachable with the shipped roster whereas F12 is not.

---

## Coordinator error — LSE-1E assignment was structurally impossible

Recorded against the coordinator, not the specialist. LSE-1E was assigned to
*reproduce* defects, but its role grants `Read, Glob, Grep, Bash, WebFetch, Skill` —
no `Write`, no `Edit`. Reproduction requires authoring a harness, so the assignment
could not be executed as written. Four idle cycles followed.

Corrected by moving to the Founder-approved arrangement (LSE specifies, coordinator
acts as its hands) and, when that produced no reply either, by the coordinator
performing the reproduction directly. **Phase 2's behavioral probing was therefore
never performed by the Lead Software Engineer role.** The reproductions above are
coordinator work and are attributed as such; the ten embedded validation categories
remain **unverified by systematic probing**, not passed.

---

## CR-1E method audit and self-correction

CR-1E accepted the F3 refutation without contest, after **independently verifying the
refutation against source rather than deferring to the coordinator** (`proxy.ts`
present in the baseline tree via `git ls-tree 62f6291 -- proxy.ts`; `next@16.2.11`
confirms the rename applies). It then completed the check the coordinator had not:
Server Actions post to the page route and are **not** covered by the proxy matcher,
but the sole `"use server"` file (`lib/dev-hq/actions.ts:44-52`) carries its own
production rejection. The gap the matcher leaves is independently closed. This
strengthens the refutation.

CR-1E then audited its own search method and classified all 12 findings by the error
class that produced F3 — *asserting a framework fact from memory instead of checking
the version in use.*

| Class | Description | Items | Outcome |
|---|---|---|---|
| A | Absence established by name/pattern search | Cleared #9 ×2, Cleared #7, F2 | **All four re-verified — all hold** |
| B | Inference about framework behavior, unverified | **F9** | **Self-downgraded to observation** |
| C | Absence by exhaustive read within a boundary | F8, F10, F11, Cleared #1, #10 | Sound; escapes only a writer outside the boundary |
| D | Pure positive trace, no absence claim | **F1**, F4, F5, F6, F7, F12, Cleared #3/#5/#6/#11/#12 | Unaffected by the error class |

**Two outcomes matter more than the rest:**

1. **CR-1E found its own broken regex.** Its non-null-assertion scan required a `.`
   after the `!` and therefore missed `agent-execution-service.ts:1007`; it had caught
   that case only by luck from an earlier read. Corrected scan returns the same figure
   — exactly four in non-test source. *The number was right for the wrong reason,* and
   CR-1E reported that distinction rather than resting on the matching count. The
   highest-risk item in its report was a **cleared** item, not a finding; it noted
   correctly that a false clear is worse than a false finding.

2. **F2 is now stronger than filed.** `evidenceStore.addEvidence(` at
   `agent-execution-service.ts:968` is the **only unkeyed evidence write in the entire
   non-test tree**; every other site uses keyed `ensureEvidence` (`:124`,
   `escalation-service.ts:152`, `review-service.ts:210`). An outlier against a
   codebase-wide convention, not merely a missing key.

**Revised CR-1E gating recommendation:** F1, F2, F4 before Sprint 1F extends the
execution surface. F3 → Minor/known-accepted. **F9 → observation**, pending
verification of Next 16 module-instance behavior; explicitly deprioritised below
F1/F2/F4 for reproduction time.

**Minor doc note (not a finding):** `proxy.ts` was added in `6a9536a` and its comment
names only the founder approve/reject endpoints; the Sprint 1E escalation routes
arrived later in `395e778`. The matcher covers them correctly — only the comment is
under-inclusive. Documentation accuracy, no severity.

---

## Commits created on the validation branch

| SHA | Type | Description |
|---|---|---|
| _(pending)_ | evidence | Run ledger initialization |

---

## Preserved disagreements

None recorded yet. Reviewer disagreements are preserved verbatim rather than
reconciled.

---

## Next increment

Launch Phase 2 (LSE behavioral probing + CR coverage-adequacy review) and Phase 3
(AR adversarial architecture review) as three independent parallel specialists.
