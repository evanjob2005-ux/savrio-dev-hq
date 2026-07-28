# Sprint 1F - Repository Implementation and Dependency Audit

**Document ID:** SPRINT-1F-REPO-AUDIT
**Version:** 1.0.0
**Status:** READ-ONLY AUDIT. Planning only. **No implementation authorized. No source or test file was modified.**
**Owner:** Lead Software Engineer (AGENT-006)
**Authority:** CONST-001, GOV-001, AGENT-001, ADR-0001, ADR-0002
**Date:** 2026-07-26

**Evidence standard applied.** Every repository claim below cites a concrete `path:line` or
file path, verified by direct inspection during this session. Claims are labelled:

| Label | Meaning |
|---|---|
| **CONFIRMED** | Verified by reading the cited file at the stated line in this working tree. |
| **INFERENCE** | Follows from confirmed evidence by reasoning, but was not executed or observed. |
| **NOT FOUND** | Searched for and not present. The search performed is stated. |

**No test, type-check, lint, or build was executed during this audit.** Every gate result
quoted below is quoted from a prior artifact and labelled as such. Nothing here claims
validation this session performed.

---

## 1. Repository identity and clean/dirty state

**CONFIRMED** (`git rev-parse`, `git status --porcelain`, `git tag --list`, `git rev-list -n 1`):

| Property | Value |
|---|---|
| Branch | `validation/sprint-1e-overnight-2026-07-26` |
| HEAD | `9069c12e8e7f61e823cbcbf728561f6207693f19` |
| HEAD subject | `docs(dev-hq): mark CANDIDATE_3DAF_FREEZE superseded by the ratified commit` |
| Tag `sprint-1e-remediated` | resolves to `d922f3794a6c57f02039ab969e0b98477f4c4c29` - **matches the protected commit exactly** |
| Tag `sprint-1e-baseline` | present in `git tag --list` (pre-remediation baseline) |
| Modified tracked files | **0** |
| Staged files | **0** |

**The working tree is CLEAN of tracked-file modification.** All dirt is untracked (`??`)
planning and specialist-output material:

```
?? agents/claude-design/outputs/
?? agents/lead-software-engineer/outputs/
?? docs/plans/GOVERNANCE_UPDATE_PLAN.md
?? docs/plans/PHASE_2_PROGRAM_PLAN.md
?? docs/plans/SPRINT_1F_ENTRY_PACKAGE.md
?? docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md
?? docs/research/
?? docs/validation/sprint-1e-overnight-2026-07-26/FRESH_CR_1E_3DAF_FINAL_REVIEW.md
?? docs/validation/sprint-1e-overnight-2026-07-26/RATIFICATION_1E_D922F379.md
```

**Significance (CONFIRMED).** The Sprint 1E remediation is committed and tagged. The
`SPRINT_1F_MISSION_CONTROL_LITE.md` "Working tree caveat" section recorded five *modified*
source files as an uncommitted, unapproved patch. **That condition no longer holds** - those
modifications are now the ratified commit `d922f379`. Any 1F reasoning that still treats the
remediation as "applied but unapproved" is stale.

**Commits since the ratified commit (CONFIRMED, `git log --oneline`):** `4619210` and
`9069c12`, both `docs(...)`. This audit did not diff them file by file; their subjects plus
the zero modified-tracked-file status are the evidence that the source baseline at HEAD equals
the source baseline at `d922f379`. Labelled **INFERENCE**, not confirmed by diff.

**Concurrency observation (CONFIRMED).** `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` changed mtime
during this audit. Another session is writing to this shared working tree. This is the exact
condition finding RAT-7 identifies as the Sprint 1E freeze failure - see section 18.

### 1.1 Architecture-reviewer governance artifact - REQUIREMENT ALREADY SATISFIED

**CONFIRMED.** The artifact exists and was committed separately, as required.

| Artifact | Tracked | Added in |
|---|---|---|
| `.claude/agents/architecture-reviewer.md` | yes (`git ls-files`) | `8310bbb` - *feat(dev-hq): register architecture reviewer* |
| `agents/architecture-reviewer/AGENT.md` | yes | `8310bbb` (same commit) |
| `handbooks/ARCHITECTURE_REVIEWER.md` | yes | `f6caf4c` - *docs(dev-hq): add architecture reviewer handbook* |

`git show --stat 8310bbb` reports **exactly two files, 329 insertions** - the two
architecture-reviewer files and nothing else. The commit is therefore dedicated, not bundled
with implementation. **Workstream A requires verification only; no work.**

---

## 2. Sources inspected

Read in full, or in the cited part, during this session:

| Source | Use |
|---|---|
| `AGENTS.md` (loaded as project instruction) | Universal employee rules; scope, escalation, validation, honesty standards |
| `CLAUDE.md` | Project instruction chain |
| `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md` (`:44-58`, `:139-158`, `:201-204`) | D7, D8, D9, O6, composition-root context |
| `docs/decisions/ADR-0002-review-escalation-and-work-management.md` (`:123-135`, `:149-161`) | E3 event architecture, E5 execution timeline |
| `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` (`:1-628` of 2038) | Track B scope, baseline notes, data requirements |
| `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` (`:1-470` of 577) | Track A scope, conflicts, freeze procedure |
| `docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md` (full) | Committed Track A obligations |
| `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_FINAL_FREEZE.md` (`:1-90`) | Freeze precedent |
| `docs/validation/sprint-1e-overnight-2026-07-26/FRESH_CR_1E_3DAF_FINAL_REVIEW.md` (targeted grep) | CR3DAF-4 deferral record |
| `docs/validation/sprint-1e-overnight-2026-07-26/RATIFICATION_1E_D922F379.md` (targeted grep) | RAT-4, RAT-7 process findings |
| Source: `lib/dev-hq/*.ts`, `lib/dev-hq/adapters/*.ts`, `lib/mission-control/*.ts`, `types/contracts/execution-runner.ts`, `lib/dev-hq/types.ts`, `app/api/dev-hq/state/route.ts`, `app/page.tsx` | The implementation map below |
| Tests: `lib/dev-hq/agent-execution-service.test.ts` (`:1070-1099`, `:1573-1775`), plus a test-name index of the whole file | F4 / F5 coverage attribution |

**Sources named by other planning documents but NOT FOUND in this repository** (searched with
`git ls-files` and repository-wide grep): `handbooks/LEAD_SOFTWARE_ENGINEER.md`,
`handbooks/INDEPENDENT_CODE_REVIEWER.md`, Permanent Operating Handbook, Current Progress
Update, Master Roadmap (any version), Sprint 1F Preparation Handoff. This independently
corroborates ADDENDUM A.1 of the Entry Package. **No content was inferred for any of them.**

---

## 3. Existing implementation map

**CONFIRMED** via `git ls-files lib types app components trigger data`.

### 3.1 Service layer - `lib/dev-hq/`

| File | Lines | Role |
|---|---|---|
| `agent-execution-service.ts` | 1178 | Dispatch, callback handlers, reconciliation sweeps. **The event emitter.** |
| `execution-manager.ts` | 822 | Pure state machine: assign / claim / heartbeat / release / reclaim. **Emits no events** (ADR-0002 E3). |
| `escalation-service.ts` | 540 | Escalation raise and resolve; the Founder revise dispatch. |
| `review-service.ts` | 784 | Review lifecycle, iteration loop, revision dispatch. |
| `founder-request-service.ts` | 551 | Founder-request workflow; owns `getDevHqStateSnapshot()`. |
| `store.ts` | 329 | In-memory store. Declared "Development-only ... non-durable, not for production" (`store.ts:1-2`). |
| `types.ts` | 67 | `DevHqState` (read surface) and `DevHqStoreData` (store shape). |
| `constants.ts` | 149 | `EXECUTION_EVENT_TYPE`, budgets, lease and health windows. |
| `adapters/index.ts` | 72 | **Composition root** - `getDevHqAdapters()`. |
| `review-projection.ts` | 52 | `Review` to `PublicReview` boundary projection. |

### 3.2 Ports - `types/contracts/`

Twelve contracts, including `execution-runner.ts` (77 lines). All twelve are declared in
`lib/dev-hq/adapters/index.ts:28-41` and instantiated at `:51-64`.

### 3.3 API surface - `app/api/dev-hq/`

Public: `state`, `events`, `approvals` (plus `[id]/approve`, `[id]/reject`), `escalations`
(plus `[id]/revise`, `[id]/abandon`, `[id]/accept`), `founder-requests`, `agents`.

Internal, token-guarded via `lib/dev-hq/internal-guard.ts`: `internal/execution/{dispatch,
running, heartbeat, complete, reclaim}`, `internal/{approval-gate, executive-review, fail,
finalize}`, `internal/review/complete`.

### 3.4 Durable tasks - `trigger/`

`agent-execution.ts`, `agent-review.ts`, `execution-sweeper.ts`,
`founder-request-workflow.ts`, `hello-world.ts`.

---

## 4. F4 file and test map

### 4.1 The code in question

**CONFIRMED.** `lib/dev-hq/agent-execution-service.ts:1121-1135`, inside
`handleExecutionReclaim` (declared `:1109`). The two predicates are, verbatim:

```
const requeuedWithAgent =
  execution.status === "queued" && Boolean(execution.agentId);
const requeuedWithoutAgent =
  execution.status === "queued" && !execution.agentId;
```

They select between three `execution.reclaimed` messages at `:1130-1134`: the
"retrying as attempt N" message, the "waiting for an available agent" message, and the
"retry budget spent" message.

### 4.2 MATERIAL FINDING - the behaviour the obligation describes is ALREADY PINNED

**CONFIRMED.** `lib/dev-hq/agent-execution-service.test.ts:1619-1620`, inside the test
`"records a reclaimed attempt that no agent could take"` (declared `:1573`):

```
expect(reclaimed[0]?.message).toContain("waiting for an available agent");
expect(reclaimed[0]?.message).not.toContain("retrying as attempt");
```

**CONFIRMED** by `git show d922f37:lib/dev-hq/agent-execution-service.test.ts` - both lines
are present at the ratified commit, at the same line numbers. **CONFIRMED** by `git log -S` -
they entered the tree in `d922f37` and in no other commit.

**INFERENCE (not executed).** Reverting `requeuedWithAgent` to status-only branching
(`execution.status === "queued"`) makes that predicate true for this test's execution, so the
emitted message becomes the "retrying as attempt 2" form - failing both `:1619` and `:1620`.
A second, independent failure mode follows: `requeuedWithoutAgent` becomes unreachable, so
control reaches `ensureDispatchForAssignment(execution.assignmentId!, ...)` at `:1138-1141`
with a null `assignmentId`.

**Therefore the claim at `SPRINT_1F_FOLLOWUP_REGISTER.md:19-27` - "No test pins that branch" -
is factually incorrect against the ratified baseline.** That register is committed and is the
source of authority for the obligation, so this is escalated rather than silently corrected.
`SPRINT_1F_ENTRY_PACKAGE.md` Conflict 1 reached the same conclusion independently; this audit
confirms it by direct inspection and by `git show` against `d922f37`.

### 4.3 The guard that IS unpinned

**CONFIRMED.** `lib/dev-hq/agent-execution-service.ts:229`:

```
if (reason !== "no_agent_available") return;
```

It is defended by a 24-line comment (`:203-215`) that states its own fragility: "a guard that
makes a helper do nothing for some inputs reads like dead weight to a later simplification
pass."

**CONFIRMED (search).** Repository-wide grep for `ensureAssignmentDeferredEvent` across
`lib/`, `types/`, `app/`, and `trigger/` returns one declaration and eight call sites, **none
of them in a test file**. No test invokes the helper directly.

**INFERENCE (not executed).** Mutating the guard to `void reason;` would let the helper emit
for `execution_not_queued` as well. Because the dedupe key at `:238` is keyed on
(type, executionId, attempt), an extra emission for the same execution and attempt collapses
into the existing entry, so every `toHaveLength(1)` assertion in the suite remains satisfied.
This is consistent with mutation **M2** as recorded in `SPRINT_1F_MISSION_CONTROL_LITE.md`
Appendix B.1, which this audit did not re-execute.

### 4.4 F4 file and test map

| Purpose | Path |
|---|---|
| Production code (message branch) | `lib/dev-hq/agent-execution-service.ts:1121-1135` |
| Production code (deferral guard) | `lib/dev-hq/agent-execution-service.ts:229` |
| Existing coverage of the message branch | `lib/dev-hq/agent-execution-service.test.ts:1619-1620` |
| Where a new F4 test belongs | `lib/dev-hq/agent-execution-service.test.ts`, inside `describe("queued execution recovery")` (`:1339`) |

**RECOMMENDATION.** Adopt the deferral-helper guard (`:229`) as the F4 target and *retain* the
existing message assertions, adding a recorded mutation run for them. This closes both readings
of the obligation. **Founder decision F-A1 governs; this is a recommendation only.**

---

## 5. F5 emission-site and test map

**CONFIRMED.** All six `execution.assignment_deferred` emissions route through a single
helper, `ensureAssignmentDeferredEvent` (`lib/dev-hq/agent-execution-service.ts:217-240`). The
event type string is defined at `lib/dev-hq/constants.ts:77`. The six call sites were located
by repository-wide grep and each was read in context:

| # | Call site | Enclosing function | Reached when | Test coverage |
|---|---|---|---|---|
| S1 | `agent-execution-service.ts:585` | `reconcileQueuedDispatches` (`:531`) | Sweep re-assigns a stranded queued execution and is declined | **COVERED** - `agent-execution-service.test.ts:1721-1774` |
| S2 | `agent-execution-service.ts:774` | `dispatchAgentExecution` (`:723`) | Manual or founder dispatch declined at `ensureAssignment` | **COVERED** - `agent-execution-service.test.ts:110-157` |
| S3 | `agent-execution-service.ts:931` | `handleExecutionComplete` (`:887`) | Failed attempt requeued with no capacity | **UNCOVERED** |
| S4 | `agent-execution-service.ts:1153` | `handleExecutionReclaim` (`:1109`) | Reclaim requeues without an agent | **COVERED** - `agent-execution-service.test.ts:1623-1698` (ordering discriminator) |
| S5 | `escalation-service.ts:293` | `ensureReviseDispatch` (`:243`) | **Founder revise decision cannot be dispatched** | **UNCOVERED** |
| S6 | `review-service.ts:635` | `ensureReviewRevision` (`:604`) | Review-loop revision cannot be dispatched | **UNCOVERED** |

**Line-number drift (CONFIRMED).** `ISSUE_MATRIX.md:87-92` and `CANDIDATE_FINAL_FREEZE.md` cite
pre-remediation line numbers (`:580`, `:769`, `:926`, `:1132`). `SPRINT_1F_ENTRY_PACKAGE.md`
cites `agent-execution-service.ts:926`. **The correct line at HEAD is `:931`.** Implementers
must use the line numbers in the table above.

### 5.1 The Founder-facing escalation and revise path - S5

**CONFIRMED.** `lib/dev-hq/escalation-service.ts:285-295`:

```
const { decision, created } = await ensureAssignment(execution.id);
if (!decision.assigned || !decision.assignment) {
  const { ensureAssignmentDeferredEvent } = await import(
    "@/lib/dev-hq/agent-execution-service"
  );
  await ensureAssignmentDeferredEvent(execution, decision.reason);
  return getExecution(executionId);
}
```

`ensureReviseDispatch` is the dispatch arm of `resolveEscalation`
(`escalation-service.ts:471`), which backs `POST /api/dev-hq/escalations/[id]/revise`
(`app/api/dev-hq/escalations/[id]/revise/route.ts`). This is **the highest-priority site**:
the Founder has just made an explicit decision, and without the event the task reads active
with nothing running and no recorded reason.

### 5.2 Dynamic-import risk - CONFIRMED and material

**CONFIRMED.** S5 (`escalation-service.ts:290-292`) and S6 (`review-service.ts:632-634`) reach
the helper through `await import("@/lib/dev-hq/agent-execution-service")`, used to break a
static import cycle (documented at `escalation-service.ts:302-303` and
`review-service.ts:630-631`). `tsc` resolves the specifier statically, but **no test executes
either dynamic import**, so a path-alias or module-boundary change would break both at runtime
with a fully green suite. This raises the value of the S5 and S6 tests above the S3 test.

### 5.3 Where F5 tests belong

| Site | Test file | Existing structure to extend |
|---|---|---|
| S3 | `lib/dev-hq/agent-execution-service.test.ts` (1835 lines) | `describe("terminality of requeued executions")` (`:1192`) |
| S5 | `lib/dev-hq/escalation-service.test.ts` (1384 lines) | **No `assignmentDeferred` assertion exists in this file** (grep confirmed) |
| S6 | `lib/dev-hq/review-service.test.ts` (1559 lines) | **No `assignmentDeferred` assertion exists in this file** (grep confirmed) |

---

## 6. AR2-6 port, adapter, composition-root, and production-path map

### 6.1 The port

**CONFIRMED.** `types/contracts/execution-runner.ts:49-77`. Twelve methods.

### 6.2 Element-by-element status - one element of the obligation is already discharged

| Element | Port | Manager | Adapter | Status |
|---|---|---|---|---|
| `claimExecution` return | `Promise<Execution or null>` - `execution-runner.ts:61-64` | `Promise<Execution or null>` - `execution-manager.ts:506-509` | pass-through - `dev-execution-runner.ts:26-31` | **ALIGNED ALREADY (CONFIRMED)** |
| `heartbeat` signature | `heartbeat(executionId: string)` - `execution-runner.ts:66` | `heartbeat(executionId, assignmentId?)` - `execution-manager.ts:571-574` | drops the second argument - `dev-execution-runner.ts:33-35` | **GAP (CONFIRMED)** |

**CONFIRMED consequence of the heartbeat gap.** `execution-manager.ts:576-578` is the
stale-worker guard:

```
if (assignmentId && execution.assignmentId !== assignmentId) {
  return execution; // stale worker; the current attempt is someone else's
}
```

Routing a heartbeat through `ExecutionRunner.heartbeat` cannot supply `assignmentId`, so the
guard is unconditionally skipped and an abandoned worker's beat would extend a **successor
attempt's** lease, masking its failure. **This is not a cosmetic signature mismatch. It is a
latent correctness defect that activates the moment the port becomes the production path.** It
is unreachable today because the port has no consumer (section 6.4), so it is a **plausible
risk now and a confirmed defect on the day AR2-6 lands the seam.**

### 6.3 The three callback handlers

**CONFIRMED**, all in `lib/dev-hq/agent-execution-service.ts`:

| Handler | Signature | Line |
|---|---|---|
| `handleExecutionRunning` | `(executionId: string, assignmentId?: string)` | `:812-815` |
| `handleExecutionHeartbeat` | `(executionId: string, assignmentId?: string)` | `:859-862` |
| `handleExecutionComplete` | `CompleteExecutionInput.assignmentId?: string` | `:866-873` |

Each guards on the optional value: `:821-823`, `:863` (delegating to the manager guard), and
`:897-899`.

**INFERENCE.** Making `assignmentId` required is a public-signature change on the three
internal callback routes (`app/api/dev-hq/internal/execution/{running,heartbeat,complete}/route.ts`)
and interacts with `AgentExecutionTaskPayload` (`agent-execution-service.ts:45-51`), where
`assignmentId` is **already required**. The three route handlers were **not read** in this
audit; their request parsing must be inspected before the change is specified.

### 6.4 Production path and the bypass - CONFIRMED

Repository-wide grep for `executionRunner` across `lib/`, `app/`, `trigger/`, `components/`,
and `types/` returns **five hits, and not one is a production consumer**:

```
lib/dev-hq/adapters/index.ts:37    executionRunner: ExecutionRunner;             (interface field)
lib/dev-hq/adapters/index.ts:60    executionRunner: createDevExecutionRunner(),  (instantiation)
lib/dev-hq/adapters/index.test.ts:15, :26, :27                                   (test only)
```

The production path bypasses the port by importing the manager module directly:

| Bypass | Line | Imports |
|---|---|---|
| `lib/dev-hq/agent-execution-service.ts` | `:16-25` | `ensureAssignment`, `ensureExecution`, `getExecution`, `heartbeat`, `reclaimStale`, `releaseAssignmentForReassignment`, `releaseExecution`, `runExecution` |
| `lib/dev-hq/escalation-service.ts` | `:22` | from `@/lib/dev-hq/execution-manager` |
| `lib/dev-hq/review-service.ts` | `:39` | `ensureAssignment`, `ensureExecution` |

`handleExecutionRunning` calls `runExecution(executionId)` at `:829` - the manager function
(`execution-manager.ts:770-781`), which internally calls `claimExecution`. **So the production
path used by `handleExecutionRunning` is `runExecution`, not `claimExecution`.** A stub
`ExecutionRunner` must therefore implement `runExecution` for the acceptance test to observe
it. `ExecutionRunner.runExecution` exists on the port at `execution-runner.ts:74`.

`DevExecutionRunner`'s own doc comment still reads "Not yet wired into the composition root
(Task 1D-4)" (`dev-execution-runner.ts:12`). **That is stale** - it *is* wired at
`adapters/index.ts:60`. The accurate statement is *wired but not consumed*.

### 6.5 BLOCKING FINDING - the composition root has no substitution seam

**CONFIRMED.** `lib/dev-hq/adapters/index.ts:43-72`:

```
let cached: DevHqAdapters | null = null;

export function getDevHqAdapters(): DevHqAdapters {
  if (!cached) { cached = { /* twelve concrete adapters */ }; }
  return cached;
}

export function resetDevHqAdapters(): void { cached = null; }
```

`resetDevHqAdapters()` only clears the cache; the next call reconstructs the same twelve
concrete adapters. **There is no exported way to inject or override an adapter.**

The Founder-specified AR2-6 acceptance criterion requires substituting a stub `ExecutionRunner`
**through the composition root**. That is **not possible against the current API** and requires
a new seam in `lib/dev-hq/adapters/index.ts`. That file is already on the Entry Package's
Track A change list, so it is in scope - but the seam itself is undesigned, and its design is
load-bearing: a mutable global override is a production hazard if it is not test-only by
construction.

### 6.6 Scope risk - "do not introduce a second orchestration owner"

**CONFIRMED.** `ensureExecution` (`execution-manager.ts:302`) and `ensureAssignment`
(`execution-manager.ts:402`) are consumed by all three services but are **not on the
`ExecutionRunner` port**. Making the port the sole path to the manager therefore forces a
choice:

- **(a)** Widen the port with `ensureExecution` and `ensureAssignment`. This increases the
  surface a future durable adapter must implement, contrary to ADR-0001 D7's intent that the
  port be a minimal concurrency contract.
- **(b)** Consume the port only where the port already covers the operation (`runExecution`,
  `heartbeat`, `releaseExecution`, `reclaimStale`), leaving `ensureExecution` and
  `ensureAssignment` as direct manager calls. This is a **partial seam** - honest but
  incomplete.

**RECOMMENDATION: (b), explicitly documented as partial.** It satisfies the stated acceptance
criterion (`handleExecutionRunning` reaching `runExecution` through the port), preserves the
port's minimality, and adds no second orchestration owner. **This is an architecture decision,
not a plan decision - route it to the Architecture Reviewer.**

### 6.7 Concurrency semantics that must be preserved

**CONFIRMED.** `execution-manager.ts:531-543` contains the compare-and-set, with an explicit
instruction: "Do NOT hoist this check into a caller: it and the reservation below must stay
adjacent and synchronous or the race it closes reopens."

**INFERENCE.** Interposing the port is safe with respect to that instruction: the port wraps
`runExecution`, which calls `claimExecution`, and the check-and-reserve pair stays inside
`claimExecution`. The adapter adds an `await` boundary *before* the pair, not between its
halves. This argument holds **under the documented single-process, synchronous-store model**
(`store.ts:1-2`). It is not a general-concurrency claim, and it should be re-derived if that
model changes.

---

## 7. Mission Control frontend and backend map

### 7.1 Frontend (CONFIRMED)

| Layer | Files |
|---|---|
| Route tree | **One route.** `app/page.tsx` renders `MissionControl`; `app/layout.tsx`. No other page route exists. |
| Shell | `components/dashboard/`: `MissionControl.tsx`, `MissionControlOverview.tsx`, `TopBar.tsx`, `AgentStatusRail.tsx`, `DispatchAgentPanel.tsx` (Simulation Lab), `FounderRequestForm.tsx` |
| Panels | `components/mission-control/`: `ActivityStreamPanel`, `AgentRosterPanel`, `ApprovalQueuePanel`, `AuditTrailPanel`, `DataSourceBadge`, `ExecutiveOrchestratorPanel`, `HierarchyRail`, `MissionControlStatusBar`, `ProjectHierarchyPanel`, `ProjectOrchestratorCard`, `SystemHealthPanel`, `WorkBoardPanel`, `WorkflowStageTrack`, `primitives` |
| Workflow simulation | `components/workflow/` (8 files); `lib/workflow/{config,machine,useWorkflowEngine}.ts` |
| Data access | `lib/mission-control/useDevHqState.ts` - polls `GET /api/dev-hq/state` every **3000 ms** (`:12`); `FeedStatus` is `initial / live / degraded / disconnected` (`:18`); disconnected after **3** consecutive failures (`:15`) |
| Derivation | `lib/mission-control/view-model.ts` (560 lines) - `buildCommandCenterModel` (`:284`), `CommandCenterModel` (`:131-148`), `ExecutiveSummary` (`:116-129`) |
| Supporting | `lib/mission-control/status.ts`, `lib/mission-control/pending-dispatch.ts` |

### 7.2 Backend read surface (CONFIRMED)

`app/api/dev-hq/state/route.ts` is four lines of logic: `GET` returns
`await getDevHqStateSnapshot()` as JSON with `dynamic = "force-dynamic"`. **No pagination, no
filtering, no cursor, no ETag, no delta.**

`DevHqState` (`lib/dev-hq/types.ts:20-38`) carries `projects`, `tasks`, `approvals`, `events`,
`workflows`, `executions`, `workflowRuns`, `agents`, `evidence`, `escalations`,
`reviews: PublicReview[]`, `reviewFindings`, and `overview`.

### 7.3 Server actions and projections

**NOT FOUND.** No Next.js Server Actions were found (searched `git ls-files` for action files
under `app/`). `lib/dev-hq/actions.ts` is a service module; it was **not read in full**, so
whether it carries a `"use server"` directive is **unverified**. All mutation observed goes
through route handlers. The only boundary projection is `lib/dev-hq/review-projection.ts`
(`Review` to `PublicReview`).

### 7.4 Frontend test infrastructure - ABSENT (CONFIRMED)

`vitest.config.ts` sets `environment: "node"` and `include: ["**/*.test.ts"]`. **No `.tsx` file
is collected**, so no component test can run. `@playwright/test` is in `devDependencies`
(`package.json`) but a `git ls-files` grep for playwright or e2e returns **nothing** - no
config, no e2e directory. A `git ls-files` grep for middleware returns **nothing**. `public/`
contains no manifest and no service worker.

---

## 8. Current data availability matrix

Column meanings: **EXISTS** = persisted and on the read surface. **IN-MEMORY ONLY** = present
in `DevHqStoreData` but not on `DevHqState`. **MISSING** = no domain representation.

| Required Mission Control datum | Status | Evidence |
|---|---|---|
| Projects | **EXISTS** | `DevHqState.projects`; `types/domain/project.ts` |
| Tasks | **EXISTS** | `DevHqState.tasks` |
| Executions | **EXISTS** | `DevHqState.executions` |
| Agents | **EXISTS** | `DevHqState.agents` |
| Events | **EXISTS, capped at 200 globally** | `store.ts:226` |
| Evidence | **EXISTS** | `DevHqState.evidence` |
| Escalations | **EXISTS** | `DevHqState.escalations` |
| Reviews | **EXISTS as `PublicReview` only** | `lib/dev-hq/types.ts:33-35`; `review-projection.ts` |
| Review findings | **EXISTS** | `DevHqState.reviewFindings` |
| Approvals | **EXISTS** | `DevHqState.approvals` |
| Queues | **DERIVED, not stored** | `view-model.ts` `WorkBucket` (`:73`) |
| **`AgentAssignment` (attempt-level truth)** | **IN-MEMORY ONLY** | `DevHqStoreData.agentAssignments` (`lib/dev-hq/types.ts:49`) - **absent from `DevHqState`** |
| Live execution timeline | **MISSING** | No `lib/dev-hq/timeline.ts`; no timeline field on `CommandCenterModel` (`view-model.ts:131-148`) |
| Current owner | **MISSING (derivable)** | Not a field anywhere; derivation rules drafted in the 1F plan section 7.3 |
| Status reason / waiting reason | **MISSING (derivable)** | As above |
| Next gate | **MISSING (derivable)** | As above |
| Blockers | **MISSING - partly underivable** | `dev-task-repository.ts:94-97` - `listDependencies` is `void taskId; return [];` |
| Provider / model per execution | **MISSING** | `Agent.provider` is free text on the *agent*; no per-execution attestation |
| Cost and budget | **MISSING** | No cost field and no budget entity anywhere in `types/domain/` |
| Token usage | **MISSING IN PRACTICE** | `AgentUsageMetadata` type exists, but the only production write is `agent-execution-service.ts:81` with `usage: null` |
| Context health | **MISSING** | No field in `types/domain/` |
| Checkpoints | **MISSING** | No entity in `types/domain/` |
| Roadmap / Sprint / Release | **MISSING** | No such type under `types/domain/` (directory listing confirms) |
| Push subscription, notification record | **MISSING** | No entity; no VAPID config; no service worker |
| Session / principal | **MISSING** | No `middleware.ts`; no auth dependency in `package.json` |

### 8.1 Values UNSAFE to derive in the browser

**CONFIRMED as an architectural constraint** from `lib/mission-control/view-model.ts:1-7`: the
view model "never invents values. Anything the backend does not record is reported as absent
so the UI can label it honestly."

| Value | Why browser derivation is unsafe |
|---|---|
| **Status reason, next gate, blockers, current owner** | These are authority statements about lifecycle position. Derived client-side they become a second, drifting implementation of the state machine that `execution-manager.ts` owns. Must be server-derived from records. |
| **Anything requiring `Review`** | `Review` carries `callbackToken`, the capability that resolves a review. Only `PublicReview` may cross the boundary (`review-projection.ts`; `lib/dev-hq/types.ts:33-35`). Any new surface must use the projection. |
| **Cost** | Requires a price table. A client-side price table is unversioned and unauditable. |
| **Timeline ordering and completeness** | ADR-0002 E5 requires "reconstruct exactly what happened". Client-side merging over a truncated 200-event snapshot silently presents a lossy stream as complete. |
| **Approval actionability** | `ApprovalItem.actionable` depends on `waitTokenId` (`view-model.ts:486`). Authority to act is a server decision, especially once authentication lands. |

### 8.2 States that MUST initially render as UNAVAILABLE

Cost and budget; context health; checkpoints; provider and model per execution; token usage;
roadmap; sprint; release; task-dependency blockers.

**CONFIRMED**: each has no backing record, and `view-model.ts:1-7` forbids inventing one.

---

## 9. Persistence and event-projection dependencies

### 9.1 Persistence

**CONFIRMED.** `lib/dev-hq/store.ts:1-2` declares the store "Development-only ... Single
Next.js process, non-durable, not for production."

**CONFIRMED**, ADR-0001 D7 (`:139-144`):

> "All Sprint 1D-1F work runs on the in-memory store. A Supabase schema is designed as a
> documentation artifact only; no migration is authored or applied in Phase 1. The
> compare-and-set claim semantics are specified now so a future Supabase adapter has a
> concurrency contract to meet."

**INFERENCE.** ADR-0001 D7 authorizes 1F to run on memory. It does **not** address a hosted,
phone-reachable deployment, where a non-durable single-process store loses all state on every
cold start. That gap is the substance of the 1F plan's Q-1 and remains a **Founder decision**.

**Note on a common paraphrase.** Several planning documents describe D7 as designating
`ExecutionRunner` as "the concurrency contract a future durable adapter must meet." The ADR
text quoted above says that of *the compare-and-set claim semantics*, not of the port by name.
The paraphrase is defensible but loose, and it should not be quoted as ADR text.

### 9.2 Event projection

**CONFIRMED.** ADR-0002 E3 (`:123-135`): events are emitted "from the service layer, never
from the pure Execution Manager"; "One event per meaningful transition; no event per
heartbeat"; "Append-only; never mutated."

**CONFIRMED.** ADR-0002 E5 (`:149-161`): the execution timeline is "a derived read-model, not
a new store", merging "events, evidence, AgentAssignment transitions, reviews/findings, and
escalations", "assembled in the Mission Control view-model layer", and "immutable and
append-only".

**Two CONFIRMED dependencies follow:**

1. **The timeline requires `AgentAssignment` on the read surface.** E5 names assignment
   transitions as an input; `AgentAssignment` is store-only (`lib/dev-hq/types.ts:49`). A
   projection must be added to `DevHqState`, applying the `PublicReview` precedent if any field
   proves internal.
2. **The 200-event cap bounds the timeline.** `store.ts:226` performs
   `store.events.slice(0, 200)`. A timeline over a truncated ring cannot satisfy "reconstruct
   exactly what happened". Sprint 1F must raise the cap, partition per entity, or **render the
   truncation explicitly**. It must not present a truncated timeline as complete.

### 9.3 Candidate identity and provenance dependencies

**CONFIRMED.** Deterministic ids are the provenance backbone: `revisionExecutionIdFor`
(`escalation-service.ts:199`, `review-service.ts:88`), `reviewIdFor` (`review-service.ts:77`),
`dispatchExecutionIdFor` (`agent-execution-service.ts:659`), plus the reservation helpers
`escalationStore.reserveRevisionExecution` and `reviewStore.reserveRevisionExecution`. Event
identity is the `dedupeKey` on `appendEvent` (`store.ts:218-228`).

**CONFIRMED, and worth recording.** A `revisionOfReviewId` field is set on the execution created
by the review path (`review-service.ts:622`). The escalation path deliberately does **not** set
it (`escalation-service.ts:273-278`), because a Founder revise resets the review-iteration
counter per ADR-0002 E2. **Consequence: escalation-authored revisions carry no stored back-link
to the escalation that authorized them**; the link is reconstructible only by re-deriving the
id. Any Mission Control surface that answers "why does this execution exist" for the Founder
revise path depends on that derivation remaining stable. Recorded as an out-of-scope discovery,
not a 1F obligation.

---

## 10. Recommended workstream order

The proposed order A-J is **sound in dependency terms**. Four corrections, each with a reason.

| # | Workstream | Change from proposal | Reason |
|---|---|---|---|
| **A** | Confirm architecture-reviewer governance | **Downgrade to verification; no work** | Already satisfied - `.claude/agents/architecture-reviewer.md` and `agents/architecture-reviewer/AGENT.md` were committed together and alone in `8310bbb`; the handbook in `f6caf4c` (section 1.1) |
| **A2** | **NEW: settle F-A1 (the F4 target)** | **Insert before B** | B cannot start without it. The behaviour the register names is already pinned at `agent-execution-service.test.ts:1619-1620` (section 4.2). Implementing the literal wording produces a duplicate test and leaves the real gap open |
| **B** | 1E-F4 | position unchanged | Smallest item; test-only; exercises the freeze and review machinery cheaply |
| **C** | 1E-F5 | position unchanged; **reorder within**: S5 (`escalation-service.ts:293`), then S6 (`review-service.ts:635`), then S3 (`agent-execution-service.ts:931`) | Founder-facing first per direction; S5 and S6 additionally carry the untested-dynamic-import risk (section 5.2) |
| **D** | AR2-6 | position unchanged; **add a design gate first** | The composition root has no substitution seam (6.5) and the port/manager split forces the (a)-versus-(b) decision (6.6). Both must be settled **before** code |
| **E** | Server-side projections and read models | **Now BLOCKED, not merely sequenced** | Depends on the persistence, transport, and auth ADR (1F plan Q-1). Cannot start against an undecided deployment target |
| **F** | Mission Control shell | blocked behind E | - |
| **G** | Core operational views | blocked behind E and F | - |
| **G2** | **NEW: frontend test infrastructure** | **Insert before F** | `vitest.config.ts` collects only `**/*.test.ts` with `environment: "node"`; no Playwright config exists. **A UI workstream with no UI test capability cannot be validated**, and AGENTS.md Validation Standards forbids handing off unvalidated work |
| **H** | Mobile/PWA, reconnect, accessibility, notification foundations | unchanged | - |
| **I** | RAT-5 | **Recommend: do not enter 1F at all** (section 20) | Triage only per Founder direction, and the proposed fix is actively counter-indicated by existing tests |
| **J** | Validation, freeze, review, approval, commit | unchanged | - |

**Net order:** A (verify), A2 (decide), B, C, D (design gate then code), **E blocked on the
ADR**, G2, F, G, H, J - with I as a document-only triage that may run at any time.

---

## 11. Files likely to change by workstream

**Track A. File identities are CONFIRMED; the changes themselves are proposals.**

| Workstream | File | Change |
|---|---|---|
| B (F4) | `lib/dev-hq/agent-execution-service.test.ts` | Add guard test. **No production change.** |
| C (F5-S5) | `lib/dev-hq/escalation-service.test.ts` | New test for `escalation-service.ts:293` |
| C (F5-S6) | `lib/dev-hq/review-service.test.ts` | New test for `review-service.ts:635` |
| C (F5-S3) | `lib/dev-hq/agent-execution-service.test.ts` | New test for `agent-execution-service.ts:931` |
| D (AR2-6) | `types/contracts/execution-runner.ts` | `heartbeat` gains `assignmentId?`. `claimExecution` **needs no change** (section 6.2) |
| D | `lib/dev-hq/adapters/dev-execution-runner.ts` | Forward `assignmentId`; correct the stale comment at `:12` |
| D | `lib/dev-hq/adapters/index.ts` | **New test-only substitution seam** (section 6.5) |
| D | `lib/dev-hq/agent-execution-service.ts` | `handleExecutionRunning` consumes the port |
| D | `lib/dev-hq/execution-manager.test.ts`, `lib/dev-hq/adapters/dev-execution-runner.test.ts`, `lib/dev-hq/adapters/index.test.ts` | Port-conformance and stub-observation tests |
| D (conditional) | `app/api/dev-hq/internal/execution/{running,heartbeat,complete}/route.ts` | Only if `assignmentId` becomes required |

**Not changing in Track A:** `lib/dev-hq/store.ts`; `lib/dev-hq/constants.ts`;
`docs/decisions/*`; either protected tag.

**Track B** - deferred. The file set depends on the unauthored ADR.

---

## 12. Workstreams that may safely run in parallel

| Set | Justification |
|---|---|
| **B and C** | Both test-only. **CONFIRMED** they touch largely disjoint files: B touches `agent-execution-service.test.ts`; C touches `escalation-service.test.ts` and `review-service.test.ts`. **Caveat:** C's S3 test also lands in `agent-execution-service.test.ts` - run S3 **after** B, or accept a merge conflict in one file |
| **I (RAT-5 triage)** | Document-only; touches no code |
| **G2 (frontend test infrastructure)** | Touches `vitest.config.ts` and new config only; independent of Track A |
| **ADR authoring (E's precondition)** | Documentation; may proceed while Track A runs |

**Hard constraint from the Sprint 1E precedent (RAT-7).** Parallelism is safe **only in
separate git worktrees**. `RATIFICATION_1E_D922F379.md:174` records that the `3daf0790` freeze
"mutated mid-review because concurrent sessions shared one working tree." Two concurrent
sessions in one tree is the failure mode that cost Sprint 1E time - and section 1 records that
it is **happening right now** in this repository.

---

## 13. Workstreams that must remain sequential

| Constraint | Reason |
|---|---|
| **A2 before B** | The F4 target is undecided (section 4.2). Building first risks duplicate coverage |
| **B and C before D** | AGENTS.md risk discipline: B and C are test-only and cannot corrupt the baseline; D is the only production change in Track A. Ordering it last isolates a defect there and keeps it revertible |
| **D's design gate before D's code** | Sections 6.5 and 6.6 are undesigned. Writing the seam before deciding its shape invites a mutable global adapter override reachable from production |
| **The ADR (Q-1) before E** | Persistence and transport determine the read-model shape |
| **E before F and G** | Views over unauthoritative data would violate `view-model.ts:1-7` |
| **G2 before F** | No UI test capability means no validatable UI work |
| **Freeze before every review; review before Founder approval; approval before commit** | The Founder-fixed permanent order |
| **G-2 (code review) before G-3 (architecture review)** | Founder-fixed permanent order |

---

## 14. Acceptance criteria

Track A criteria are adopted from `SPRINT_1F_ENTRY_PACKAGE.md` (AC-1 through AC-9), which this
audit reviewed and **endorses with two amendments and two additions**.

| ID | Criterion | Audit note |
|---|---|---|
| AC-1 | F4 test fails under the guard-removal mutation and passes on the current implementation | **AMENDED:** must state *which* guard (F-A1). If the deferral guard at `:229` is chosen, the mutation is `void reason;` |
| AC-2 | All three F5 tests fail under deletion of their specific site; **no count-only assertions** | Endorsed. Section 5 gives the exact three sites at HEAD line numbers |
| AC-3 | Stub `ExecutionRunner` substituted via the composition root; `handleExecutionRunning` provably observes it; the test fails before the seam is consumed | **AMENDED:** the stub must implement **`runExecution`**, not `claimExecution` - that is the method `handleExecutionRunning` actually calls (`agent-execution-service.ts:829`) |
| AC-4 | All five gates green | Endorsed |
| AC-5 | Test count increases by exactly the number added; no existing test weakened | Endorsed, and directly relevant to section 4.2, where an existing assertion must not be removed as a duplicate |
| AC-6 | Zero change to `store.ts`, the ADRs, or either protected tag | Endorsed |
| AC-7 | RAT-5 triage recorded with severity, ownership, sprint, and acceptance criteria | Endorsed; see section 20 |
| AC-8 | Candidate freeze enforced by mechanism, not prose | Endorsed; see section 18 |
| AC-9 | G-2 then G-3, separate clean sessions, terminal verdicts, written artifacts | Endorsed |
| **AC-10 (NEW)** | **The AR2-6 substitution seam is unreachable from production code paths** - test-only by construction, not by convention | Follows from section 6.5 |
| **AC-11 (NEW)** | **`heartbeat`'s `assignmentId` is threaded end to end** - port, adapter, and the stale-worker guard at `execution-manager.ts:576-578` is reachable through the port | Follows from section 6.2 |

---

## 15. Required regression tests

| # | Test | Target | Home |
|---|---|---|---|
| 1 | F4 guard | `agent-execution-service.ts:229` (recommended) and/or `:1121-1135` | `lib/dev-hq/agent-execution-service.test.ts` |
| 2 | F5 - Founder revise deferral | `escalation-service.ts:293` | `lib/dev-hq/escalation-service.test.ts` |
| 3 | F5 - review revision deferral | `review-service.ts:635` | `lib/dev-hq/review-service.test.ts` |
| 4 | F5 - retry-requeue deferral | `agent-execution-service.ts:931` | `lib/dev-hq/agent-execution-service.test.ts` |
| 5 | AR2-6 - stub observed through the composition root | `handleExecutionRunning` reaching port `runExecution` | `lib/dev-hq/agent-execution-service.test.ts`, or a new case in `lib/dev-hq/adapters/index.test.ts` |
| 6 | AR2-6 - heartbeat `assignmentId` reaches the stale-worker guard **through the port** | `execution-manager.ts:576-578` | `lib/dev-hq/adapters/dev-execution-runner.test.ts` |

**Attribution requirement for tests 2 through 4 (from section 5).** The deduplication key at
`agent-execution-service.ts:238` is per execution and attempt. A count assertion is therefore
satisfiable by *any* site reaching the same execution and attempt. Each test must isolate its
site by **reachability** - construct a scenario only that site can reach - or by **ordering**,
the technique the existing MAJOR-2 test uses at `agent-execution-service.test.ts:1691-1697`.

**Existing tests that already meet the standard, for use as templates (CONFIRMED):**

- **Ordering discriminator:** `agent-execution-service.test.ts:1623-1698`. It asserts that the
  minimum deferral index is less than the maximum reclaimed index (`:1697`), which inverts if
  the reclaim loop's emission is deleted.
- **Reachability isolation:** `agent-execution-service.test.ts:1721-1774`. It filters by
  `e.entityId === executionId` (`:1762`) on an execution that was dispatched but never claimed,
  so the reclaim-loop site cannot reach it.

---

## 16. Negative controls

**Every one must be demonstrated by execution and the result recorded.** This is the MAJOR-2
standard: a `toHaveLength(1)` assertion was satisfied by either of two paths sharing a dedupe
key, so a test that appeared to pin a defect had silently stopped doing so.

| # | Mutation | Expected |
|---|---|---|
| 1 | F4: replace `if (reason !== "no_agent_available") return;` (`:229`) with `void reason;` | Test **fails** |
| 1b | F4 (message reading): revert `requeuedWithAgent` (`:1121-1122`) to `execution.status === "queued"` | Test **fails**; expected also to fail the existing `:1619-1620` |
| 2 | Delete the `ensureAssignmentDeferredEvent` call at `escalation-service.ts:293` | Test **fails** |
| 3 | Delete the same call at `review-service.ts:635` | Test **fails** |
| 4 | Delete the same call at `agent-execution-service.ts:931` | Test **fails** |
| 5 | AR2-6: revert `handleExecutionRunning` to call `runExecution` directly | Stub-observation test **fails** |
| 6 | AR2-6: drop `assignmentId` in `DevExecutionRunner.heartbeat` | Stale-worker test **fails** |

**Recording standard (from RAT-4).** Record the **literal command string** for each control, not
the result alone. `RATIFICATION_1E_D922F379.md:171` records that the 1E freeze documented gates
by result - "3 files, 97 tests" - so the command had to be reconstructed to reproduce them.

---

## 17. Validation commands

**CONFIRMED** from `package.json` scripts: `dev`, `build`, `start`, `lint` (`eslint`),
`trigger:dev`, `test` (`vitest run`).

Literal command strings, per RAT-4:

```
npx tsc --noEmit
npx eslint .
npx vitest run lib/dev-hq/agent-execution-service.test.ts lib/dev-hq/escalation-service.test.ts lib/dev-hq/review-service.test.ts lib/dev-hq/execution-manager.test.ts lib/dev-hq/adapters/dev-execution-runner.test.ts lib/dev-hq/adapters/index.test.ts
npx vitest run
npx next build
```

**CORRECTION.** The Entry Package's targeted-gate command omits `escalation-service.test.ts` and
`review-service.test.ts`. Two of the three F5 deliverables land in exactly those files (section
5.3). **The targeted gate as written would not execute them.** The command above adds them.

**Baseline gate results are quoted from `SPRINT_1F_ENTRY_PACKAGE.md`** - tsc 0, eslint 0,
targeted 97, full 322, build 0. **This audit did not run any of these commands and does not
attest to those numbers.** Note also that the targeted count of 97 was measured against the
narrower command; the corrected command above will report a different, larger number.

---

## 18. Candidate-freeze commands

Grounded in the Sprint 1E precedent, not invented. Two findings drive the design:

- **RAT-7** (`RATIFICATION_1E_D922F379.md:174`): "The 3daf0790 freeze mutated mid-review
  because concurrent sessions shared one working tree; a freeze declared only in prose is not
  enforceable."
- **`CANDIDATE_FINAL_FREEZE.md`** records the 1E candidate as "Status: FROZEN FOR REVIEW.
  UNCOMMITTED. Working-tree only." - precisely the unenforceable form.

**RECOMMENDED: commit-and-tag, plus a dedicated review worktree.** The Entry Package chose
tag-only. This audit recommends **adding the worktree**, because the tag makes the candidate
*identifiable* while the worktree is what stops a concurrent session from writing into the tree
a reviewer is reading. Section 1 documents that concurrent writes are happening in this
repository today, so the worktree is not a hypothetical safeguard.

```sh
# 1. Implementation worktree (implementer only; never shared)
git worktree add ../savrio-1f-impl -b freeze/1f-ITEM-N sprint-1e-remediated

# 2. Immutable candidate commit (run inside the implementation worktree)
git add -A
git commit -m "candidate(1f-ITEM-N): SUMMARY"

# 3. Annotated candidate tag - THIS IS THE FREEZE
git tag -a candidate-1f-ITEM-N -m "Sprint 1F candidate ITEM N; gates: tsc/eslint/targeted/full/build"

# 4. Record identity (paste all four outputs into the freeze artifact)
git rev-parse candidate-1f-ITEM-N^{commit}
git rev-parse candidate-1f-ITEM-N^{tree}
git diff --stat sprint-1e-remediated..candidate-1f-ITEM-N
git diff sprint-1e-remediated..candidate-1f-ITEM-N | sha256sum

# 5. Clean review worktree - detached at the TAG, never at the branch
git worktree add --detach ../savrio-1f-review candidate-1f-ITEM-N

# 6. Reviewer proof-of-identity - run in the review worktree BEFORE and AFTER the review
git -C ../savrio-1f-review rev-parse HEAD          # must equal step 4 commit sha
git -C ../savrio-1f-review status --porcelain      # must be EMPTY
git rev-parse candidate-1f-ITEM-N^{commit}         # the tag must not have moved

# 7. Invalidation and refreeze after ANY change
git tag -d candidate-1f-ITEM-N                     # the old candidate is void
#   ... recommit, then repeat steps 3-6 with N+1. NO VERDICT TRANSFERS ACROSS A REFREEZE.

# 8. Teardown, only after Founder approval
git worktree remove ../savrio-1f-review
git worktree remove ../savrio-1f-impl
```

**Ownership rules:**

1. **One writer per worktree.** The implementer owns `../savrio-1f-impl`. Nobody else writes there.
2. **The review worktree is detached by construction and read-only by rule.** Step 6's
   `status --porcelain` must be empty at entry and at exit; a non-empty result **voids the review**.
3. **Reviewers inspect `git show TAG` or the detached review worktree - never the shared tree.**
4. **No writes of any kind to the shared working tree while a review is active**, including
   documentation and evidence. This is the exact Sprint 1E failure.
5. **The tag is the freeze.** A prose freeze record is evidence *about* the freeze, not the freeze.
6. **Stop conditions:** the tag moves; the commit sha differs between entry and exit; the review
   worktree is dirty; any recorded hash differs. Any one of these means halt, refreeze at N+1,
   and re-review.
7. **A verdict is bound to a tag.** It does not transfer to a refrozen candidate - the Sprint 1E
   precedent.
8. **`sprint-1e-remediated` and `sprint-1e-baseline` are never moved or deleted.**
9. **Reviews run from separate clean sessions.** `WORKFLOW_DIAGNOSIS.md` records seven
   consecutive in-session spawns producing zero deliverables, root cause **UNKNOWN**.

**NOT EXECUTED.** No command in this section was run. No branch, commit, tag, or worktree was
created by this audit.

---

## 19. Rollback plan

| Scenario | Recovery | Basis |
|---|---|---|
| A Track A change fails review | Delete the freeze tag and branch. `sprint-1e-remediated` is untouched | **INFERENCE** - follows from the candidate never being merged |
| The candidate mutates mid-review | Section 18 step 6 detects it. Refreeze at N+1 and re-review. **No verdict transfers** | Grounded in the Sprint 1E precedent (RAT-7) |
| AR2-6 destabilises the execution path | AR2-6 is sequenced last and is the only Track A production change. Revert its commit; B and C are test-only and unaffected | **INFERENCE** |
| Baseline restoration | `git checkout sprint-1e-remediated` - ratified, 0 unresolved blockers | Tag-to-commit mapping **CONFIRMED** in section 1 |
| Reviewer unobtainable | **Halt and escalate. Do not relabel a weaker review.** The Sprint 1E standard - commit `fe7fab1` records "fresh-review gate unobtainable" as a recorded blocker rather than a waived one | **CONFIRMED** from `git log` |

**Rollback risk specific to F4 (section 4.2).** If the F4 work removes the existing assertions at
`agent-execution-service.test.ts:1619-1620` as superseded, the rollback surface widens from
"revert one added test" to "restore deleted coverage". **AC-5 forbids weakening an existing
test; this is the concrete case it protects.**

---

## 20. RAT-5 recommendation

### 20.1 Exact location - CONFIRMED

`lib/dev-hq/store.ts:218-228`:

```
export function appendEvent(event: Event, dedupeKey?: string): Event {
  const store = getDevHqStore();
  if (dedupeKey) {
    const existing = store.eventKeys.get(dedupeKey);
    if (existing) return existing;
    store.eventKeys.set(dedupeKey, event);
  }
  store.events.unshift(event);
  store.events = store.events.slice(0, 200);
  return event;
}
```

**Line-number correction.** The register (`SPRINT_1F_FOLLOWUP_REGISTER.md:61`) and the Entry
Package both cite `store.ts:224`. **The cap is at `:226` at HEAD.**

**CONFIRMED - the condition still exists.** Repository-wide grep for `eventKeys` across `lib/`
returns exactly four hits: initialization (`store.ts:103`), read (`:221`), write (`:223`), and
the type declaration (`lib/dev-hq/types.ts:66`). **There is no delete, no clear, and no trim.**
The same holds for `evidenceUris` (`store.ts:99`, `:276-277`, `:299`).

### 20.2 MATERIAL FINDING - the unbounded key map is deliberate, and the proposed fix is counter-indicated

**CONFIRMED.** `lib/dev-hq/types.ts:61-65` documents the design intent:

> "Events already recorded under an idempotency key. Keyed lookup rather than a scan of
> `events`, which is trimmed and would silently forget older keys."

**CONFIRMED.** Two existing tests pin exactly the behaviour that trimming `eventKeys` would
break - `lib/dev-hq/agent-execution-service.test.ts`, inside
`describe("audit idempotency after event-ring eviction")` (`:1070`):

- `"does not recreate a terminal event evicted from the buffer"` (`:1093`)
- `"does not recreate retry events evicted from the buffer"` (`:1127`)

Both flood the ring with 260 unrelated events (`floodEventRing`, `:1072-1083`) and then assert
that reconciliation does **not** re-append the evicted lifecycle events.

**Therefore the acceptance criterion proposed in `SPRINT_1F_ENTRY_PACKAGE.md` - "Trim
`eventKeys` in lockstep with ring eviction; a test proving an evicted-then-re-emitted event
re-appends" - would require deleting or inverting two existing tests.** Under AC-5 (no existing
test weakened) that is not a bug fix; it is a **reversal of an approved design decision**, and
it belongs in an ADR amendment, not a sprint task.

The tests' existence and content are **CONFIRMED**; the conflict itself is **INFERENCE**,
reasoned rather than executed.

### 20.3 Triage

| Field | Assessment |
|---|---|
| **Does the issue still exist?** | **Yes - CONFIRMED.** `eventKeys` is never trimmed |
| **Severity** | **MINOR, and arguably not a defect.** The trade-off is documented at `lib/dev-hq/types.ts:61-65` and pinned by two tests. The honest framing is "an approved trade-off with an unrecorded memory cost", not "a correctness bug" |
| **Memory-growth implications** | Unbounded in key count. Bounded in practice by process lifetime: the store is single-process and non-durable (`store.ts:1-2`), so every restart clears it. **Not reachable at current volume** - no measurement was taken this session |
| **Replay and re-emission implications** | An evicted event's key survives, so reconciliation's re-emission is a no-op. **That is the intended behaviour**, per the tests at `:1093` and `:1127`. The consequence RAT-5 identifies is real: the ring can lose an event that dedup then refuses to restore |
| **Does Mission Control depend on the affected behaviour?** | **No - CONFIRMED by absence.** No timeline read-model exists (section 8). What Mission Control *does* depend on is the **200-event cap itself** (`store.ts:226`), which bounds timeline completeness against ADR-0002 E5. **That is a distinct issue from RAT-5**, separately recorded as `SPRINT_1E_COMPLETION_NOTES.md` section 7 item 11 |
| **Sprint 1F or remain deferred?** | **DEFER. Do not enter Sprint 1F.** Founder direction is record-only; `store.ts` is explicitly out of Track A scope; and 20.2 shows the proposed fix conflicts with committed tests. **Founder decision F-A2 governs; this is a recommendation** |
| **Recommended acceptance criteria if ever approved** | (1) An ADR amendment first, deciding whether re-append after eviction is desired at all - it currently is not. (2) If yes, the tests at `:1093` and `:1127` are amended **by the same authorized change**, never silently. (3) A bounded-key design that does not reintroduce duplicate lifecycle events - a tombstone or monotonic watermark, not a naive lockstep trim. (4) A memory-growth measurement establishing the real bound. (5) Kept separate from, and not conflated with, raising or partitioning the 200-event cap |

---

## 21. Technical blockers

| # | Blocker | Type | Blocks | Evidence |
|---|---|---|---|---|
| **TB-1** | The composition root has **no adapter substitution seam** | **Technical, CONFIRMED** | AR2-6 acceptance criterion AC-3 | `lib/dev-hq/adapters/index.ts:43-72` - `resetDevHqAdapters()` only nulls the cache |
| **TB-2** | Port/manager surface mismatch: `ensureExecution` and `ensureAssignment` are not on `ExecutionRunner` | **Technical and architectural, CONFIRMED** | AR2-6 design | `execution-manager.ts:302`, `:402` versus `types/contracts/execution-runner.ts:49-77` |
| **TB-3** | **No frontend test capability** | **Technical, CONFIRMED** | All Track B UI validation | `vitest.config.ts` - `environment: "node"`, `include: ["**/*.test.ts"]`; no Playwright config found |
| **TB-4** | `AgentAssignment` absent from the read surface | **Technical, CONFIRMED** | Execution timeline (ADR-0002 E5) | `lib/dev-hq/types.ts:49` versus `:20-38` |
| **TB-5** | The 200-event global cap bounds timeline completeness | **Technical, CONFIRMED** | Timeline fidelity against ADR-0002 E5 | `store.ts:226` |
| **TB-6** | `listDependencies` is a stub returning an empty array | **Technical, CONFIRMED** | Dependency-derived blockers | `lib/dev-hq/adapters/dev-task-repository.ts:94-97` |
| **TB-7** | No authentication anywhere | **Technical and security, CONFIRMED** | Any hosted deployment | No `middleware.ts`; no auth dependency in `package.json`; `POST /api/dev-hq/approvals/[id]/approve` is unguarded |
| **TB-8** | In-memory, single-process, non-durable store | **Architectural, CONFIRMED** | Hosted PWA | `store.ts:1-2`; ADR-0001 D7 `:139-144` |

**Track A has ZERO blockers of type TB-3 through TB-8.** TB-1 and TB-2 are internal to AR2-6 and
are resolvable by design work inside the sprint. **Track A is technically unblocked.**

**Security note (TB-7), routed rather than resolved.** Five unauthenticated POST routes execute
Founder authority: `approvals/[id]/approve`, `approvals/[id]/reject`, and the three
`escalations/[id]/*` actions. This is acceptable on a developer machine and **not** acceptable on
a phone-reachable deployment. Per AGENTS.md Security, this is escalated to the Founder and the
Security Engineer. It is **not** a Track A finding and this audit does not treat it as one.

---

## 22. Founder decisions

**Blocking Track A:**

| # | Decision | Consequence | Recommendation |
|---|---|---|---|
| **F-A1** | **1E-F4 target** - the X4 message branch, or the deferral guard at `agent-execution-service.ts:229`? | The message branch is **already pinned** (`agent-execution-service.test.ts:1619-1620`, CONFIRMED in section 4.2). Choosing it produces duplicate coverage and leaves the real gap open | **The deferral guard**, retaining the existing message assertions and adding a recorded mutation run for them. Closes both readings |
| **F-A2** | **RAT-5 disposition** | The Entry Package's proposed fix conflicts with two committed tests (section 20.2) | **Record-only. Defer out of 1F.** If ever approved, it needs an ADR amendment first |
| **F-A3** | **1E-F1 and 1E-F2 scope** - the 1F plan's register carries five items; the committed register carries three plus RAT-5 | Scope completeness | **1E-F1 (author the negative-outcome standard) carries the higher value** - that policy governs four commits and two reviewers' verdicts yet lives only in a review artifact. Founder's call |
| **F-A4** | **Absent controlling authorities** - Permanent Operating Handbook, Current Progress Update, Master Roadmap, Sprint 1F Preparation Handoff are all **NOT FOUND** | Any claim of the form "per the Master Roadmap" is unverifiable | Independently corroborated by this audit. Governance escalation |

**Blocking Track B (pre-existing, restated for completeness):** the deployment, persistence,
transport, and auth ADR (Q-1 / D-2); new dependencies (D-6); hosting (D-7); absent handbooks and
standards (D-8); ADR-0002 E5 and PE-1 amendments (D-9); roadmap, sprint, and release entities
(Q-3); cost, context, and checkpoint data (Q-4).

**New decision raised by this audit:**

| # | Decision | Owner |
|---|---|---|
| **F-A5** | **AR2-6 seam shape (section 6.5) and port scope (section 6.6, option (a) versus (b)).** Widening the port with `ensureExecution` and `ensureAssignment`, versus accepting an explicitly partial seam | **Architecture Reviewer**, with Founder ratification. Recommendation: **(b), documented as partial** |

---

## 23. Readiness verdict

# ENGINEERING READY WITH DECISIONS

**Track A is technically unblocked and well specified.** The ratified baseline is intact
(section 1), the architecture-reviewer governance requirement is already satisfied (section
1.1), all six F5 emission sites are located at exact HEAD line numbers (section 5), and the
AR2-6 gap is precisely characterized (section 6). **Zero technical blockers stand between
Track A and implementation.**

**What is required first are decisions, not work:** F-A1 (which guard F4 pins - material,
because the stated target is already covered), F-A2 (RAT-5), F-A3 (scope), and F-A5 (the AR2-6
seam design). F-A1 and F-A5 must be answered before their workstreams start.

**Track B is NOT ready** and this verdict does not cover it. It is blocked on the unauthored
persistence, transport, and auth ADR (TB-8), on absent frontend test infrastructure (TB-3), and
- for any hosted deployment - on the absence of authentication (TB-7).

**Explicitly NOT verified by this audit:**

- No test, type-check, lint, or build was executed. No mutation was applied or observed.
- The baseline gate numbers quoted in section 17 are quoted from another artifact and are not
  attested here.
- The three internal callback route handlers under `app/api/dev-hq/internal/execution/` were not
  read.
- `lib/dev-hq/actions.ts` was not read in full, so the Server Actions finding in section 7.3 is
  a search result, not an exhaustive proof.
- `SPRINT_1F_MISSION_CONTROL_LITE.md` was read to line 628 of 2038;
  `SPRINT_1F_ENTRY_PACKAGE.md` to line 470 of 577.
- The component files under `components/` were inventoried but not read.
- The claim that HEAD's source equals `d922f379`'s source is an inference from commit subjects
  and a clean tracked-file status, not from a file-by-file diff.

---

## 24. Confirmation - no implementation source or test files were modified

**CONFIRMED.** This audit was read-only with respect to all source and test code.

- **No file under `lib/`, `types/`, `app/`, `components/`, `trigger/`, or `data/` was created,
  modified, or deleted.**
- **No test file was created, modified, or deleted.**
- **No configuration file** (`package.json`, `vitest.config.ts`, `tsconfig.json`,
  `next.config.ts`, `eslint.config.mjs`, `trigger.config.ts`) was modified.
- **No ADR** under `docs/decisions/` was modified.
- **No state-mutating git command was run.** Only `git rev-parse`, `git status`, `git log`,
  `git show`, `git tag --list`, `git rev-list`, `git ls-files`, and `git diff --stat` were used.
  No commit, add, tag, checkout, switch, stash, or worktree command was executed.
- **No package install, build, or test run was performed.**
- **No Phase 2 work was begun.**
- **The single file written by this audit is this document:**
  `docs/plans/SPRINT_1F_REPOSITORY_IMPLEMENTATION_AUDIT.md`.

**Sprint 1E remains closed. `sprint-1e-remediated` resolves to
`d922f3794a6c57f02039ab969e0b98477f4c4c29` and is unmoved.**

---

# ADDENDUM A - End-of-audit re-check (2026-07-26, same session)

**Recorded because the working tree changed underneath this audit while it was being written.**
`git status --porcelain` was re-run at completion. The differences from section 1 are stated
rather than silently folded in, so a reader can see what this audit's body was derived against.

## A.1 A TEST FILE WAS MODIFIED BY ANOTHER SESSION - NOT BY THIS AUDIT

**CONFIRMED.** `git diff --stat` at completion reports:

```
 lib/dev-hq/agent-execution-service.test.ts | 118 +++++++++++++++++++++++++++++
 1 file changed, 118 insertions(+)
```

**This audit did not make that change.** Every write performed by this session went to
`docs/plans/SPRINT_1F_REPOSITORY_IMPLEMENTATION_AUDIT.md` and to no other path. At the start of
this audit (section 1) the tracked-file modification count was **0**.

**What the change is (CONFIRMED by `git diff`, read-only).** A new test inserted after
`:1620`, named *"tells a requeued attempt with no agent apart from one that is actually
retrying"*, self-identifying in its own comment as **1E-F4**. It reclaims two executions in one
sweep - one down each requeue arm - and asserts each execution's own reclaim event, selected by
`entityId`, against its exact whole message.

**Governance status: this is Sprint 1F implementation, and Sprint 1F implementation is not
authorized.** It is also being written **before F-A1 is settled** (section 22). Escalated to the
Founder and the Coordinator. This audit takes no position on the test's quality beyond A.2 and
**did not revert, stage, or otherwise touch it**.

## A.2 Fair recording of a counter-argument to section 4.2

The new test's own comment argues the existing assertions at `:1619-1620` are **positional**
(`reclaimed[0]` over a single-execution fixture) and **substring-based**, so they cannot
distinguish "the without-agent arm produced this message" from "the only reclaim in the store
happened to read this way", and would survive the branch being replaced by a constant.

**That argument is sound, and it does not overturn section 4.2.** The two claims address
different mutations:

- **Section 4.2 (CONFIRMED, unchanged):** against the mutation the committed register actually
  names - reverting to status-only branching - the existing test **does** fail. So
  `SPRINT_1F_FOLLOWUP_REGISTER.md:19-27`'s "No test pins that branch" remains factually
  incorrect for that mutation.
- **The new test's point (accepted):** against a broader mutation class - replacing the arm with
  a constant - the existing assertions are weak, because they are positional rather than
  attributed by `entityId`.

**Consequence for F-A1.** The decision is now better framed as three options, not two:
(i) the deferral guard at `:229`; (ii) strengthening the message-branch coverage to be
attributed rather than positional, which is what the concurrent session has drafted; or
(iii) both. This audit's recommendation is unchanged in substance - **the deferral guard at
`:229` is still the only genuinely unpinned guard of the two** - but option (iii) is now cheap,
because (ii) already exists in draft.

## A.3 Four "absent controlling authorities" have since been authored

Section 2 and F-A4 record four named sources as **NOT FOUND**. That was true when searched. At
completion, four now exist as untracked working-tree files:

| Source | Path now present |
|---|---|
| Permanent Operating Handbook | `docs/governance/PERMANENT_OPERATING_HANDBOOK.md` |
| Current Progress Update | `docs/governance/CURRENT_PROGRESS_UPDATE.md` |
| Master Roadmap | `docs/roadmap/MASTER_ROADMAP.md` |
| Sprint 1F Preparation Handoff | `docs/plans/SPRINT_1F_PREPARATION_HANDOFF_INTAKE.md` |

Also new: `docs/governance/AUTHORITY_AND_CONTRADICTION_REGISTER.md`,
`docs/plans/SPRINT_1F_MISSION_CONTROL_UX_CONTRACT_AUDIT.md`.

**None of them was read, and nothing in this audit's body is reconciled against them.** The
NOT FOUND findings in section 2 are **withdrawn as to present existence** and retained as an
accurate record of the state this audit was performed against. **F-A4 is narrowed**: the
question is no longer "do these exist" but "are these now the authorities, and does anything in
the planning corpus contradict them" - which is the register in
`docs/governance/AUTHORITY_AND_CONTRADICTION_REGISTER.md`, not this audit's scope.

## A.4 Working-tree state at completion

```
 M lib/dev-hq/agent-execution-service.test.ts     <- NOT this audit
?? agents/claude-design/outputs/
?? agents/lead-software-engineer/outputs/
?? docs/governance/
?? docs/plans/GOVERNANCE_UPDATE_PLAN.md
?? docs/plans/PHASE_2_PROGRAM_PLAN.md
?? docs/plans/SPRINT_1F_ENTRY_PACKAGE.md
?? docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md
?? docs/plans/SPRINT_1F_MISSION_CONTROL_UX_CONTRACT_AUDIT.md
?? docs/plans/SPRINT_1F_PREPARATION_HANDOFF_INTAKE.md
?? docs/plans/SPRINT_1F_REPOSITORY_IMPLEMENTATION_AUDIT.md   <- this audit
?? docs/research/
?? docs/roadmap/
?? docs/validation/sprint-1e-overnight-2026-07-26/FRESH_CR_1E_3DAF_FINAL_REVIEW.md
?? docs/validation/sprint-1e-overnight-2026-07-26/RATIFICATION_1E_D922F379.md
```

**Re-verified at completion:** HEAD `9069c12e8e7f61e823cbcbf728561f6207693f19`; branch
`validation/sprint-1e-overnight-2026-07-26`; `sprint-1e-remediated` resolves to
`d922f3794a6c57f02039ab969e0b98477f4c4c29`. **All three unchanged. The protected tag did not
move.**

## A.5 This is the RAT-7 hazard, live

Sections 1, 12, and 18 warn that concurrent sessions sharing one working tree is the failure
mode that cost Sprint 1E time. **Between the start and the end of this single audit, one tracked
test file was modified and eight untracked artifacts appeared or changed.** A candidate frozen
in this tree today would be unenforceable for exactly the reason RAT-7 records. **Section 18's
worktree recommendation should be treated as required, not optional.**
