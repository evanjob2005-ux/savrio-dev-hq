# Technical Plan — Sprint 1F: Mission Control Lite and Founder Interface

**Document ID:** SPRINT-1F-PLAN
**Template ID:** TMP-002
**Version:** 0.2.0
**Status:** SPECIALIST DRAFT — awaiting integration review. Planning only. Not approved, not final. No implementation authorized.
**Workstream:** Sprint 1F implementation planning (one of several parallel planning workstreams)
**Owner:** Lead Software Engineer (AGENT-006)
**Authority:** CONST-001, GOV-001, ADR-0001, ADR-0002. **One new ADR is required; this document proposes its *subject* and does not claim its number** — deployment target, persistence, transport, and authentication (see §20 Q-1). **ADR numbers are assigned centrally** (Founder decision, 2026-07-26): a drafting workstream may propose a subject but must not reserve or claim a number. Where the string `ADR-0003` appears below it is carried forward from earlier versions and names **that proposed subject**, not a reserved number.
**Date:** 2026-07-26
**Version note:** 0.2.0 supersedes 0.1.0. Reconciliation pass against the completed specialist documents; §20.4 fully re-derived (0.1.0 compared against a 641-line mid-write draft of the Phase 2 plan and a 367-line draft of the design specification — both since completed at ~3,700 lines).
**Version note (0.2.0 — correction pass, 2026-07-26).** Documentation-only correction, no scope or position changed: (1) the version header read `0.1.0` while the Approval block read `0.2.0`; the Approval block is authoritative and the header is corrected to match — the reconciliation pass *had* completed, and at least one peer document cited this plan as "v0.1.0" on the strength of the stale header; (2) the verification anchor is re-stated from HEAD `357f03b` to HEAD `6301c06`; (3) the DESIGN-001 reconciliation reference is re-keyed from v1.0.0 (3,701 lines) to v1.1.0; (4) a **COLLABORATION HANDOFF** section (§22) is added, derived entirely from positions this document already states; (5) four Founder decisions of 2026-07-26 are recorded where this document already discusses them — permanent review order (§16.1), Independent Code Review verdict vocabulary and the shared severity ladder (§16.2), and central assignment of ADR numbers (Authority line above, §20.3 #16, §20.4.A R-A4, §20.4.I). No Founder decision this document records as open has been resolved here.
**Planning baseline inspected:** branch `validation/sprint-1e-overnight-2026-07-26` @ `057e12c`
**Re-verified at HEAD `6301c06`** (2026-07-26; anchor re-stated during the correction pass, previously `357f03b`). The VERIFIED claims below were **re-confirmed, not re-derived** — the evidence is the commit range itself. `git log --oneline 357f03b..HEAD` returns exactly five commits — `6301c06`, `cf0fced`, `35d9c62`, `5fede77`, `d4a798e` — every one of them `docs(validation): …` and documentation-only. `git diff --stat 357f03b..HEAD` touches two files and adds 1,209 lines, all insertions: `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` and `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md`. Over the wider range `git diff --stat 057e12c..HEAD` the only third file is `docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md`. **No source, config, or ADR file changed in committed history since `057e12c`**, so every VERIFIED claim stated against `057e12c` — `usage: null` (`agent-execution-service.ts:81`), `slice(0, 200)` (`store.ts:226`), `listDependencies` returning `[]` (`dev-task-repository.ts:96`), `vitest.config.ts` `environment: "node"` / `include: ["**/*.test.ts"]`, no `middleware.ts`, no manifest — still holds at HEAD by the commit range, and ADR-0001 and ADR-0002 remain byte-unchanged with ADR-0002 E5's parenthetical still unamended (line 159). **Nothing was re-run to produce this restatement:** no test, type-check, lint, or build was executed during the correction pass, and no VERIFIED claim was re-derived by re-reading source.
**Working tree caveat (recorded at the correction pass).** HEAD is clean of source change, but the *working tree* is not. `git status` shows uncommitted modifications to five files — `lib/dev-hq/agent-execution-service.ts`, `lib/dev-hq/agent-execution-service.test.ts`, `lib/dev-hq/constants.ts`, `lib/dev-hq/escalation-service.ts`, `lib/dev-hq/review-service.ts` (+127/−7) — consistent with the Sprint 1E remediation patch specification having been applied locally and **not committed and not approved**. This does not change any VERIFIED claim's HEAD anchoring, and the single claim that cites one of those files was spot-checked and still holds in the working tree (`usage: null` remains at `agent-execution-service.ts:81`). It is recorded because §"Why so much is marked TO BE VERIFIED" tells the reader those patches are *proposed*; in this working tree they are *applied but unapproved*, and **D-1 remains open**.

---

## How to read this document

This is a **planning package**, not an approved plan. It defines scope, decomposition,
requirements, and risks so the Founder can approve, cut, or re-sequence before any code is
written.

Three labels are used throughout and mean exactly what they say:

| Label | Meaning |
| --- | --- |
| **VERIFIED** | Confirmed by direct inspection of the repository during this planning session, at the tree named above. A file and, where useful, a line reference is given. |
| **TO BE VERIFIED AFTER SPRINT 1E** | Not confirmed, or confirmed against a tree that Sprint 1E remediation is expected to change. Must be re-checked against the approved 1E baseline before the affected work item starts. |
| **ASSUMPTION A-n** | A planning assumption. Not a fact. If it is wrong, the work item that depends on it changes. |

**Why so much is marked TO BE VERIFIED.** Sprint 1E remediation is in flight and unapproved.
`docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` is `AWAITING FOUNDER
APPROVAL. No source change applied.` Its proposed patches (AR2-1, X1, F1, AR2-4, X3, X4,
plus optional F4) touch `lib/dev-hq/agent-execution-service.ts`,
`lib/dev-hq/execution-manager.ts`, `lib/dev-hq/constants.ts`, `lib/dev-hq/review-service.ts`,
and `lib/dev-hq/escalation-service.ts` — including adding two new event types
(`execution.assignment_deferred`, `execution.claim_lost`). Every 1F surface that renders
events, status reasons, or the timeline reads those exact files. Nothing here should be
built against the tree as it stands today.

---

## Cross-workstream boundaries — PENDING CROSS-WORKSTREAM REVIEW

This document is the **implementation-planning** workstream for Sprint 1F. Parallel
specialist workstreams own adjacent material. Their artifacts are **not authored by this
workstream** and are read for reconciliation only. Inventory re-stated at HEAD `6301c06`
(correction pass, 2026-07-26). **These peer artifacts are untracked working-tree files** — they
are not in HEAD at all, so a HEAD identifier dates *this* plan's baseline, not theirs; their
line counts are working-tree measurements and move as their owners revise them:

| Artifact | Owning workstream | Status at reconciliation |
| --- | --- | --- |
| `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` (**v1.1.0**, self-IDs as DESIGN-001) | Mission Control / Founder Interface design | **Complete.** Read in full for reconciliation — **at v1.0.0 (3,701 lines)**. **Re-keyed at the correction pass to v1.1.0** (~4,490 lines at the coordinator's source-inventory refresh; measured 4,609 lines in the working tree during this edit). **A correction to v1.2.0 is in flight**, so this reference is knowingly one revision behind and may go two behind. Recorded rather than silently updated: the reconciliation below was performed against v1.0.0 content and has **not** been re-derived against v1.1.0 or v1.2.0 |
| `docs/plans/PHASE_2_PROGRAM_PLAN.md` (**3,749 lines**) | Phase 2 implementation planning | **Complete.** Read for reconciliation |
| `docs/research/RESEARCH_BACKLOG.md` (**2,620 lines**) | Research backlog | **Complete.** Read for reconciliation. Anchors 8 research items directly to this plan's item IDs |

**Two further documents appeared mid-reconciliation and were read:**

| Artifact | Owning workstream | Status |
| --- | --- | --- |
| `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (**3,002 lines**, v1.1.0, self-IDs as CLM) | Context Lifecycle Manager | **Complete**, and explicitly reconciled against this plan. Read for reconciliation |
| `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (**671 lines**) | Governance and documentation planning | **Complete**, and explicitly reconciled against this plan. Read for reconciliation |

> **Recorded honestly:** an earlier stage of this same reconciliation pass reported both
> documents **absent**, having verified their absence at the time. They were authored
> concurrently and appeared before this pass completed. The absence finding is **withdrawn**;
> the consequences drawn from it (1F-5 blocked for want of a contract; governance
> carry-forwards without an owner) are **withdrawn with it** and replaced by §20.4.C, §20.4.I,
> and the revised Q-4. This is recorded rather than silently overwritten because a reader of
> an intermediate version would otherwise see a claim this document no longer makes.

**All six specialist documents named by the Integration Coordinator now exist and have been
read.** No named input is missing.

**Ownership rule applied.** AGENT-001 § Department Boundaries: *"Design defines the approved
user experience. Engineering decides how approved requirements are implemented."* Where this
plan and the design specification describe the same surface, **the design specification is
authoritative and this plan defers to it.** The sections below are stated so the engineering
decomposition is complete and reviewable, not to establish UX:

- **§4 (user journeys)**, **§5 (screens and views)**, **§6 (information architecture)**,
  **§11 (responsive)**, and **§12 (accessibility)** — **SUPERSEDED BY DESIGN-001 where they
  conflict.** Resolved in this pass (§20.4 R-A): DESIGN-001 §3 (navigation map), §3.4 (URL
  scheme), §4 (screen inventory), §6 (component inventory), §7 (status vocabulary), §2 (truth
  model), §9 (mobile), §10 (accessibility), and §11 (approval flow) are **authoritative**.
  This plan's §5 and §6 are **withdrawn as competing definitions** and retained only as
  engineering sizing input. Where this document and DESIGN-001 disagree on a user-facing
  surface, DESIGN-001 governs and this plan is wrong by construction.
- **§20 Q-1 (persistence/deployment)** interfaces with the persistence workstream and with
  Phase 2 precondition P-1. See §20.4.
- **§7–§9, §13–§19, §21** are this workstream's own scope and are not deferred.

Sections not marked above remain this workstream's draft position. Nothing here is final.

---

# 1. Sprint objective

Give the Founder a single, trustworthy, phone-first surface that answers — for any unit of
work, at any moment, from anywhere — *what is happening, who owns it, why it is in this
state, what gate is next, what is blocking it, what evidence backs it, and what it is
costing*; and let the Founder act on it in seconds.

Sprint 1F converts the Sprint 1D/1E execution and review spine from a set of correct
backend records into an operational Founder interface: a conversation and command surface,
the ten entity views, the live execution timeline (carrying forward the deferred 1E-8/1E-9
work), a responsive push-capable PWA, and fast approval flows — with model, cost, context
health, and checkpoint visibility surfaced honestly, including honestly reporting absence.

**Non-objective.** 1F does not add executive analytics, scorecards, trend reporting, or
forecasting. Those remain Phase 2. 1F makes the *current state* legible and actionable; it
does not interpret history.

---

# 2. Explicit scope

Scope is stated as the canonical Sprint 1F scope, decomposed into what each item actually
requires given the verified baseline.

## 2.1 Founder conversation and command surface

- A conversational surface where the Founder can ask about state and issue commands in
  natural language.
- A command surface where every command maps to an existing, authorized service-layer
  operation — the conversation never mutates state directly.
- Command confirmation, result rendering, and failure reporting.
- **Baseline note (VERIFIED):** no conversational surface exists. The only Founder input
  path today is `components/dashboard/FounderRequestForm.tsx` posting to
  `POST /api/dev-hq/founder-requests` (`app/api/dev-hq/founder-requests/route.ts`).
  This item is net-new and is the single largest unknown in the sprint — see §20 Q-2.

## 2.2 The ten views

Project · roadmap · sprint · task · execution · agent · queue · review · approval · release.

- Each view has a list surface and a detail surface.
- Each view is reachable from the app shell and from a deep link.
- Each view renders the seven decision fields (§2.3) where they apply.
- **Baseline note (VERIFIED):** four of the ten have backing domain entities —
  `Project` (`types/domain/project.ts`), `Task` (`types/domain/task.ts`), `Execution`
  (`types/domain/execution.ts`), `Agent` (`types/domain/agent.ts`). `Review`
  (`types/domain/review.ts`) and `Approval` (`types/domain/approval.ts`) exist and are
  exposed on state. **`roadmap`, `sprint`, and `release` have no domain entity, no store
  collection, no state field, and no API** — a repo-wide search of `types/`, `lib/`,
  `app/`, `components/`, and `data/` returns no such type. `queue` is derived, not stored.
  See §20 Q-3 — this is a blocking Founder decision.

## 2.3 The seven decision fields

Live execution timeline · current owner · status reason · next gate · blockers · evidence ·
(plus §2.4 operational visibility).

- **Live execution timeline** — the merged, chronologically ordered, append-only stream of
  events, evidence, assignment transitions, reviews, findings, and escalations per
  execution and per task. This is the carried-forward ADR-0002 E5 / plan 1E-8 read-model.
  **VERIFIED absent:** no `lib/dev-hq/timeline.ts`, no timeline field on
  `CommandCenterModel` (`lib/mission-control/view-model.ts:131-148`). Deferral is recorded
  and approved in `docs/plans/SPRINT_1E_COMPLETION_NOTES.md` §6.2 (PE-2).
- **Current owner** — the single accountable actor for the item right now (agent, Founder,
  reviewer, or "unowned").
- **Status reason** — a machine-derived, human-readable explanation of *why* the item is in
  its current status, derived from records, never invented.
- **Next gate** — the next decision or checkpoint the item must pass, and who owns it.
- **Blockers** — what prevents progress, with a link to the blocking record.
- **Evidence** — the `Evidence` records backing the item, browsable and linkable.

## 2.4 Operational visibility

- **Context health** — per-execution context-window utilization and the risk that a run
  degrades or fails because of it.
- **Checkpoints** — durable resume points in a long-running execution.
- **Model/provider visibility** — which model and provider actually served each execution
  and review.
- **Cost and budget visibility** — spend per execution/task/project, against a budget, with
  a threshold state.

**Baseline note (VERIFIED — all four have no backing data):**
`types/domain/agent-execution.ts:44-50` defines `AgentUsageMetadata { durationMs?,
inputTokens?, outputTokens?, model?, extra? }`, but the only production write is
`lib/dev-hq/agent-execution-service.ts:81` → `usage: null`. `Agent.provider` is a free-text
`string` (`types/domain/agent.ts`) with no version, no model id, and no per-execution
record. There is no cost field, no budget entity, no context-health field, and no
checkpoint entity anywhere in `types/domain/`. All four require net-new domain work in 1F
(1F-4, 1F-5) or must be scoped to "honest absence" rendering. See §20 Q-4.

## 2.5 Delivery surface

- **Phone-optimized responsive PWA** — installable, phone-first layout, correct viewport
  and safe-area handling, offline shell.
- **Push-capable notifications** — Web Push with a subscription store and a notification
  policy, so a Founder decision request reaches the phone without the app being open.
- **Fast Founder approval flows** — from notification to decision in the minimum number of
  interactions, with an explicit confirmation step for irreversible actions.
- **Baseline note (VERIFIED):** no `manifest.json`/`manifest.webmanifest`, no service
  worker, no push subscription code, no VAPID configuration. `public/` contains five SVGs
  only. `app/layout.tsx` declares no viewport, no theme-color, and no manifest link. All
  net-new.

## 2.6 Enabling work that 1F cannot avoid

These are not on the canonical scope list, but the canonical scope cannot be delivered
without them. They are stated explicitly so they are approved rather than smuggled in.

- **Authentication and authorization (1F-6).** **VERIFIED absent:** there is no
  `middleware.ts`, no auth dependency in `package.json`, and no session, cookie, or identity
  check on any public route. `POST /api/dev-hq/approvals/[id]/approve`
  (`app/api/dev-hq/approvals/[id]/approve/route.ts`) executes an approval for anyone who
  can reach the server. A phone-accessible PWA is by definition reachable beyond a
  developer machine. **Shipping 1F without authentication would publish the Founder's
  approval authority to the internet.** Non-negotiable prerequisite for any hosted
  deployment; see §10 and §20 Q-5.
- **State transport and payload scoping (1F-2, 1F-8).** **VERIFIED:**
  `lib/mission-control/useDevHqState.ts:12` polls `GET /api/dev-hq/state` every 3000 ms and
  `app/api/dev-hq/state/route.ts` returns the entire `DevHqState` snapshot with no
  pagination, no filtering, and no delta. Sprint 1E's own plan flagged this
  (`SPRINT_1E_REVIEW_AND_RELIABILITY.md` §Performance: *"consider pagination in Sprint 1F
  if the polled `/state` payload becomes large"*). A 3-second full-snapshot poll over a
  cellular connection is the wrong transport for a phone.
- **Frontend test infrastructure (1F-18).** **VERIFIED:** `vitest.config.ts` sets
  `environment: "node"` and `include: ["**/*.test.ts"]` — `.tsx` files are not collected, so
  **no component test can run today**. `@playwright/test` is in `devDependencies` but there
  is no Playwright config and no e2e directory anywhere in the repo. A UI sprint with no UI
  test capability cannot be validated.

---

# 3. Explicit out-of-scope

## 3.1 Out by Founder direction (Phase 2)

- Advanced executive analytics of any kind: dashboards over time, trend lines, velocity,
  burn-down/burn-up, throughput, cycle time, forecasting, or predictive alerts.
- **Scorecards and aggregation.** **CORRECTED at reconciliation.** Version 0.1.0 of this
  document stated that ADR-0001 D8 and ADR-0002 D-E6/E9 *both* defer scorecards to Sprint 1F.
  **That was wrong, and the error was caught by the governance workstream (§4.8 of
  `GOVERNANCE_UPDATE_PLAN.md`), which correctly assigned the correction here.** Verified at
  HEAD: ADR-0001 **D8** (`:146-148`) says *"Scorecards: deferred to **Phase 2**… out of Phase 1
  scope unless they become required for Phase 1 acceptance."* ADR-0002 **D-E6/E9** (`:215`,
  `:230`, `:343`) says *"deferred to **Sprint 1F**."* The two ADRs **disagree with each
  other** — they do not agree with one another against the canonical scope. The conclusion is
  unchanged (scorecards stay out of 1F) but its basis is now stated accurately. Escalated as
  **E-1**; a conclusion resting on a misquoted ADR could not be approved under GOV-001.
- Cross-project rollups, portfolio views, and comparative agent performance ranking.

## 3.2 Out by architecture (deferred elsewhere)

- **Real AI agents and reviewers.** ADR-0001 D4 and ADR-0002 Future Considerations put
  these in Phase 2. 1F renders what the deterministic simulated agents and reviewer produce.
- **Supabase persistence and the persistence abstraction.** ADR-0002 E9/D-E5 defers both,
  gated on explicit approval to install `@supabase/supabase-js` and apply migrations. 1F
  does not implement them. **But see §20 Q-1 — a hosted PWA may not function on the
  in-memory store at all, which makes this the sprint's central architectural question.**
- **`WorkItem` promotion.** ADR-0002 E8: `WorkItem` is a documented target only; promoting
  it and rewiring Project → WorkItem → Task is a Phase-2 additive follow-up.
- **Multi-user, roles, and teams.** 1F authenticates and authorizes exactly one principal,
  the Founder (plus the existing server-to-server internal token). Role-based access
  control is Phase 2.

## 3.3 Out by scope discipline

- Rewriting or removing the Simulation Lab. ADR-0001 D9 keeps it as a permanent surface;
  1F may relocate it in the IA but must not remove or alter its behavior.
- Changing the founder-request workflow, its stages, its wait-token invariant, or any
  pre-existing public API shape. 1F is additive to the API, as 1D and 1E were.
- Refactoring `lib/dev-hq/execution-manager.ts` or any service-layer logic for reasons
  other than a 1F requirement. The Execution Manager's verified purity
  (`lib/dev-hq/review-scope.test.ts` pins it) must not be breached by read-model work.
- Resolving the open Sprint 1E follow-ups that 1F does not depend on. CR-1…CR-12 and
  NB-1…NB-4 are recorded in `SPRINT_1E_COMPLETION_NOTES.md` §3, §4, §7. 1F depends on
  exactly two of them (§19 D-1); the rest stay where they are recorded.
- Native iOS/Android applications. 1F is a PWA.
- Email, SMS, or Slack notification channels. 1F is Web Push only.
- Offline *mutation* (queued approvals that sync later). 1F is offline-readable, not
  offline-actionable. See §13.

---

# 4. User journeys

Ten journeys. Each names the trigger, the path, the decision, and the evidence the Founder
must be able to reach without leaving the flow.

### J-1 — Overnight decision, from a notification (the primary journey)

Founder is away from the desk. An execution exhausts its retry budget and raises an
`Escalation`. A push notification arrives on the phone. Founder taps it, is authenticated
(or already is), and lands directly on the escalation detail: the summary, the failing
execution's timeline, the evidence, the model that ran it, the cost consumed, and the three
resolution actions (revise / abandon / accept). Founder chooses `revise`, confirms, and sees
the new execution queued. Total interactions after the tap: two.

*Backed by (VERIFIED):* `Escalation` domain, `escalationStore.listOpen()`,
`POST /api/dev-hq/escalations/[id]/{revise,abandon,accept}` — all exist.
*Net-new:* push, auth, deep link, timeline, cost/model display.

### J-2 — Founder approval of a founder-request gate

A founder-request run reaches `founder_approval_required`. The approval queue shows it as
actionable (`ApprovalItem.actionable` is true only when `waitTokenId` is attached —
`lib/mission-control/view-model.ts:486`). Founder reads the executive review summary, opens
the evidence, approves. The wait token resolves and the run advances.

*Backed by (VERIFIED):* the entire approval path exists and is wired.
*Net-new:* the phone surface, the fast flow, evidence linkage.

### J-3 — "What is happening right now?"

Founder opens the app cold. Within one screen and no scrolling on a phone: how many
executions are running, how many items await a Founder decision, whether anything failed,
what changed most recently, and whether the feed is live or stale.

*Net-new:* the phone-first overview. `ExecutiveSummary` (`view-model.ts:116-129`) already
computes most of the counts; the mobile surface and the staleness treatment are new.

### J-4 — Drilling from symptom to cause

Founder sees a task marked `blocked`. Taps it, sees the status reason ("execution exhausted
after 3 attempts"), the current owner (nobody — awaiting Founder), the next gate (escalation
resolution), and the blocker (the open escalation). Taps into the execution, reads the
timeline of all three attempts, opens the evidence from the last failure, and decides.

*Net-new:* status reason, current owner, next gate, blockers, timeline — the entire
derivation layer (1F-3).

### J-5 — Review outcome triage

A review returns `changes_requested`. Founder inspects the findings by severity, sees which
one is blocking, sees that a revision execution was authorized, and sees the iteration count
against the cap of 3 (`MAX_REVIEW_ITERATIONS`, `lib/dev-hq/constants.ts`). Founder decides
whether to let the loop run or intervene.

*Backed by (VERIFIED):* `PublicReview` and `ReviewFinding` are on `DevHqState`
(`lib/dev-hq/types.ts:35-36`). The `callbackToken` is structurally excluded from the read
model (`types/domain/review.ts` — the `?: never` projection, empirically verified in
`SPRINT_1E_COMPLETION_NOTES.md` §2).

### J-6 — Agent and queue health

Founder checks the agent roster: who is available, busy, offline, or stale; what each is
working on; what is queued and unassigned. Founder spots that a queued execution has no
agent and understands *why* from the status reason rather than guessing.

*Backed by (VERIFIED):* `AgentHealth` (`healthy | stale | unavailable`) exists
(`types/domain/agent-execution.ts:80`), derived from `AGENT_HEALTH_STALE_AFTER_MS`.
*Depends on:* the Sprint 1E remediation event `execution.assignment_deferred` — without it,
a declined dispatch records nothing and the queue view has no honest reason to display.
**This is exactly ISSUE_MATRIX AR2-1/X1/X3.** See §19 D-1.

### J-7 — Cost and budget check

Founder asks what the last run cost and whether the project is within budget. Sees spend per
execution and per project against the configured budget, with the threshold state.

*Net-new in full.* No cost data is captured today (§2.4). Requires 1F-4 or an approved
honest-absence fallback.

### J-8 — Context health and checkpoint awareness

A long execution approaches its context limit. Founder sees the context-health indicator
move to warning, sees the last checkpoint, and understands that a failure would resume from
there rather than from zero.

*Net-new in full.* No context or checkpoint data exists (§2.4). **Highest-risk journey** —
see §20 Q-4 and R-4: with deterministic simulated agents (ADR-0001 D4) there may be no real
context to measure, which would make this surface honest only once real agents land in
Phase 2.

### J-9 — Conversational query and command

Founder types "what's blocked?" and gets a grounded answer with links. Founder types
"approve the dev-hq escalation" and is shown a confirmation naming the exact record before
anything executes.

*Net-new in full.* See §20 Q-2 for the unresolved architecture.

### J-10 — Recovering from a bad connection

Founder is on a train. The connection drops mid-session. The app keeps showing the last
known state, clearly marked stale with its age; action buttons are disabled rather than
silently failing; when the connection returns, the app reconnects and refreshes without a
manual reload.

*Partially backed (VERIFIED):* `useDevHqState` already keeps the last good snapshot and
exposes `FeedStatus` = `initial | live | degraded | disconnected` after 3 consecutive
failures (`lib/mission-control/useDevHqState.ts:14-17, 96-103`). 1F must extend this to
action gating, staleness age, and the new transport. See §13.

---

# 5. Required screens and views

Twelve screens. Every one must work at 360 px wide before any wider layout is built (§11).

| # | Screen | Purpose | Primary records | Baseline |
| --- | --- | --- | --- | --- |
| S-1 | **Command Home** | J-3. Live status, attention count, decision inbox, recent activity, feed health. | `ExecutiveSummary`, escalations, approvals, events | Partly derivable from existing view-model |
| S-2 | **Decision Inbox** | Unified, ordered list of everything awaiting the Founder: approvals + escalations. The destination of every push notification. | `Approval`, `Escalation` | Records exist; unified surface is new |
| S-3 | **Approval detail** | J-2. One approval, its context, evidence, and the approve/reject actions. | `Approval`, `WorkflowRunRecord`, `Evidence` | Routes exist |
| S-4 | **Escalation detail** | J-1. One escalation with origin, reason, timeline, evidence, and revise/abandon/accept. | `Escalation`, `Review.escalationReason` | Routes exist. **Must render `escalationReason` beside `origin`** — carried-forward requirement PE-3, `SPRINT_1E_COMPLETION_NOTES.md` §4 |
| S-5 | **Project list + detail** | Project view. Rolls up its tasks, executions, gates, blockers, and cost. | `Project` | Entity exists |
| S-6 | **Roadmap view** | Canonical scope item. | — | **No backing entity. Blocked on §20 Q-3.** |
| S-7 | **Sprint view** | Canonical scope item. | — | **No backing entity. Blocked on §20 Q-3.** |
| S-8 | **Task list + detail** | J-4 entry. Status reason, owner, next gate, blockers, executions, reviews, evidence. | `Task` | Entity exists; `TaskDependency` is **a stub** — `dev-task-repository.ts:94-97` `listDependencies` returns `[]` unconditionally. Blockers have no dependency data source. |
| S-9 | **Execution detail + live timeline** | The centerpiece. Attempts, assignments, reviews, evidence, model, cost, context health, checkpoints — as one ordered stream. | `Execution`, `AgentAssignment`, `Event`, `Evidence`, `Review`, `Escalation` | Records exist; **timeline read-model does not** (1E-8 deferred) |
| S-10 | **Agent roster + detail** | J-6. Availability, health freshness, current work, provider/model, recent history. | `Agent`, `AgentHealthCheckResult` | Entity exists |
| S-11 | **Queue view** | J-6. Queued/unassigned executions, pending reviews, why each is waiting. | Derived from `Execution`, `Review` | Derived; **depends on the 1E `assignment_deferred` event for honest reasons** |
| S-12 | **Review detail** | J-5. Iteration vs cap, findings by severity, revision chain, outcome. | `PublicReview`, `ReviewFinding` | Exposed on state |
| S-13 | **Release view** | Canonical scope item. | — | **No backing entity. Blocked on §20 Q-3.** `RELEASE_PROCESS.md` and `VERSIONING_POLICY.md` exist as documents; neither is modeled in the domain. |
| S-14 | **Founder conversation** | J-9. Ask, command, confirm, result. | All | **Net-new. Blocked on §20 Q-2.** |
| S-15 | **Cost and budget** | J-7. Spend by execution/task/project against budget. | — | **No backing data. Blocked on §20 Q-4.** |
| S-16 | **Settings** | Notification preferences, push subscription management, session/sign-out, install prompt, data-source honesty toggle. | — | Net-new |
| S-17 | **Simulation Lab** | ADR-0001 D9. Preserved, relocated in the IA, behavior unchanged. | existing | Exists (`components/dashboard/DispatchAgentPanel.tsx`) |

Count note: the canonical scope names ten views; the screen list is longer because list and
detail are distinct surfaces on a phone and because the decision inbox, settings, and
conversation are required to make the ten usable.

---

# 6. Information architecture

## 6.1 Navigation model

Phone-first, single primary navigation, maximum two taps from Command Home to any decision.

```
Command Home (S-1)
├── Decision Inbox (S-2)          [badge = attention count]
│     ├── Approval detail (S-3)
│     └── Escalation detail (S-4)
├── Work
│     ├── Projects (S-5) → Roadmap (S-6) → Sprint (S-7) → Tasks (S-8)
│     └── Task detail (S-8) → Execution detail + timeline (S-9) → Review detail (S-12)
├── Operations
│     ├── Queue (S-11)
│     ├── Agents (S-10)
│     └── Releases (S-13)
├── Cost (S-15)
├── Ask (S-14)                    [conversation and command]
└── Settings (S-16) → Simulation Lab (S-17)
```

Primary bottom navigation on phone: **Home · Inbox · Work · Ask · More**. Operations, Cost,
Releases, Settings, and the Simulation Lab live under More. Rationale: the two things the
Founder does on a phone are *see status* and *decide*; everything else is navigable but not
privileged.

## 6.2 Entity hierarchy rendered

ADR-0002 E8 fixes the target hierarchy as `Project → WorkItem → Task → Execution →
AgentAssignment`, with `WorkItem` explicitly not implemented. 1F therefore renders
`Project → Task → Execution → AgentAssignment` and must leave a structural seam where
`WorkItem` will sit, so its Phase-2 introduction is additive rather than a rewrite.

**ASSUMPTION A-1.** Roadmap and sprint, if approved (§20 Q-3), sit between Project and Task
as grouping constructs and are the most natural future home for `WorkItem`. If the Founder
resolves Q-3 by introducing `Roadmap`/`Sprint` entities, ADR-0002 E8's hierarchy must be
amended, and that amendment is an ADR-level decision, not a plan-level one.

## 6.3 URL structure

Every detail surface is deep-linkable, because push notifications land on them.

```
/                          Command Home
/inbox                     Decision Inbox
/inbox/approvals/:id       Approval detail
/inbox/escalations/:id     Escalation detail
/projects                  /projects/:id
/roadmap                   /roadmap/:id          [Q-3]
/sprints                   /sprints/:id          [Q-3]
/tasks                     /tasks/:id
/executions/:id            (timeline is the default tab)
/agents                    /agents/:id
/queue
/reviews/:id
/releases                  /releases/:id         [Q-3]
/cost
/ask
/settings
/lab                       Simulation Lab
```

**ASSUMPTION A-2.** Next.js App Router file-based routing under `app/`, matching the
existing convention. The current app is a single route (`app/page.tsx` renders
`MissionControl`); 1F introduces the route tree above.

## 6.4 Cross-cutting presentation rule

Every entity surface renders the same six-field decision header, in the same order, in the
same place:

**Status · Current owner · Status reason · Next gate · Blockers · Evidence**

A field with no recorded value renders as an explicit absence ("Not recorded"), never as a
guess, an em-dash, or a plausible default. This is the existing house rule, stated in
`lib/mission-control/view-model.ts:1-7`: *"never invents values. Anything the backend does
not record is reported as absent so the UI can label it honestly."* 1F extends it, it does
not relax it.

---

# 7. Backend data requirements

## 7.1 What exists and is sufficient (VERIFIED)

`DevHqState` (`lib/dev-hq/types.ts:20-38`) already carries: `projects`, `tasks`,
`approvals`, `events`, `workflows`, `executions`, `workflowRuns`, `agents`, `evidence`,
`escalations`, `reviews` (as `PublicReview[]`), `reviewFindings`, `overview`.

`AgentAssignment` records exist in the store (`DevHqStoreData.agentAssignments`,
`lib/dev-hq/types.ts:49`) but are **not on `DevHqState`** — so the browser cannot see
attempt-level lease, heartbeat, claim, or release transitions. The timeline needs them.

## 7.2 Required additions

| # | Requirement | Kind | For | Notes |
| --- | --- | --- | --- | --- |
| D-A | Expose `AgentAssignment` on the read surface | Additive state exposure | S-9 timeline | Assignments are the attempt-level truth. Expose a projection, not the raw record, if any field proves internal — apply the `PublicReview` precedent. |
| D-B | Execution timeline read-model | Derived, no new store | S-9, S-8, J-4 | ADR-0002 E5. Merges events + evidence + assignment transitions + reviews/findings + escalations by timestamp. Immutable and append-only. |
| D-C | Derived decision fields: `currentOwner`, `statusReason`, `nextGate`, `blockers` | Derived | Every view | §7.3 |
| D-D | Cost/usage capture and persistence | **New domain fields** | S-15, J-7 | `AgentUsageMetadata` exists but is never populated (`agent-execution-service.ts:81` writes `usage: null`). Requires: populate it, persist it per assignment/execution, and add a cost derivation. **A cost figure requires a price table — see §20 Q-4.** |
| D-E | Model and provider per execution | **New domain fields** | S-9, S-10 | `Agent.provider` is a free-text string on the *agent*, not on the *execution*. A retry pins provider via `ExecutionRouting.provider` (`types/domain/execution.ts`) — that is a routing constraint, not an attestation of what actually ran. |
| D-F | Budget entity | **New domain entity** | S-15 | Scope, limit, period, threshold. See Q-4. |
| D-G | Context health per execution | **CORRECTED: rendering + projection wiring, not new domain fields** | S-9, J-8 | **Reclassified per CLM §14.2.** The CLM owns the signal set and emits a `PublicContextHealth` projection (`measured`, `band`, `bandPolicyVersion`, `bandProvisional`, `sampledAt`, `sampleIntervalMs`). 1F wires and renders it and **designs no context-health model.** Surface still renders dark — Phase-1 agents produce no context. |
| D-H | Checkpoint entity | **CORRECTED: CLM-owned; 1F consumes a projection** | S-9, J-8 | **Reclassified per CLM §14.2 / CLM-K7.** The entity is `ContextCheckpoint`, owned by the CLM. The CLM flagged this row as an **internal contradiction in v0.1.0** — §20.4 I-5 called 1F-5 a rendering item while this row called D-H a new entity. **Resolved in the CLM's favour: 1F creates no checkpoint entity.** |
| D-I | Push subscription store | **New domain entity** | Push | Endpoint, keys, created/last-used, device label. Must be treated as a credential (§10). |
| D-J | Notification delivery record | **New domain entity** | Push, evidence | What was sent, for what record, when, and whether it was delivered/acted on. Required for §17 evidence. |
| D-K | Task dependency data | **Implementation of an existing stub** | S-8 blockers | `TaskDependency` type exists; `dev-task-repository.ts:94-97` `listDependencies` returns `[]` unconditionally and is called by nothing. Blockers derived from dependencies are unavailable until this is implemented. |
| D-L | Roadmap / Sprint / Release entities | **New domain entities** | S-6, S-7, S-13 | **Blocked on Q-3.** |
| D-M | Session/principal record | **New** | Auth | §10. |

## 7.3 Derived field derivation rules

These must be derived from records only. Each rule states its source and its absence case.

**Current owner.**
1. Execution has a live `AgentAssignment` in `claimed`/`running` → that agent.
2. Execution `queued` with `agentId` set → that agent (dispatched, not yet claimed).
3. Open `Escalation` on the task → the Founder.
4. Pending `Approval` with `waitTokenId` → the Founder.
5. Pending `Review` → the `reviewerAgentId`, or "reviewer (unassigned)" when null.
6. Otherwise → "Unowned". Never inferred from `task.assigneeAgentId` alone, which records
   an assignment intent, not present ownership.

**Status reason.** Derived from the most recent *state-changing* event for the entity, mapped
to a fixed vocabulary. **This is precisely why §19 D-1 matters:** the ISSUE_MATRIX
establishes that a declined dispatch currently emits **zero** events (AR2-1, *reproduced*).
Without the remediation, "queued, agent null" has no recorded reason and the field must
render "Not recorded" — which is honest, and useless. **TO BE VERIFIED AFTER SPRINT 1E:** the
final event taxonomy, including whether `execution.assignment_deferred` and
`execution.claim_lost` land as specified in the ISSUE_MATRIX.

**Next gate.** From the entity's lifecycle position: queued → dispatch; running → completion
callback; succeeded + `reviewPolicy != none` → review; `changes_requested` → revision
execution; review iteration == `MAX_REVIEW_ITERATIONS` → escalation; open escalation →
Founder resolution; founder-request stage `founder_approval_required` → Founder approval.
Each gate names its owner. Absent when the entity is terminal.

**Blockers.** Union of: open escalations on the task; pending approvals gating its run;
`blocks`-kind task dependencies (**unavailable until D-K**); an unassignable execution
awaiting capacity (**depends on the 1E event**); an unresponsive reviewer
(`escalationReason: "reviewer_unresponsive"`).

## 7.4 Data-volume constraints (VERIFIED)

- `store.events` is trimmed to the most recent **200** entries (`lib/dev-hq/store.ts:226`).
  The timeline (D-B) merges events. **Therefore the timeline is lossy beyond 200 global
  events** and will silently lose history the timeline exists to preserve. This is recorded
  as `SPRINT_1E_COMPLETION_NOTES.md` §7 item 11. **1F must either raise/scope the cap,
  partition events per entity, or render the truncation explicitly.** It must not present a
  truncated timeline as complete — that would violate the append-only, reconstruct-exactly
  -what-happened property ADR-0002 E5 requires.
- `store.eventKeys` and `store.evidenceUris` are never trimmed (same source) — memory grows
  unbounded. Not a 1F deliverable, but it bounds how long a deployed instance can run.
- The in-memory store is explicitly *"Development-only … Single Next.js process,
  non-durable, not for production"* (`lib/dev-hq/store.ts:1-2`). See §20 Q-1.

---

# 8. API requirements

## 8.1 Preservation constraints (non-negotiable)

- No existing public response shape may change. Additive only — the same rule 1D and 1E held.
- The founder-request path, its wait-token invariant, and its routes are untouched.
- `PublicReview` remains the only review shape that crosses the boundary. Any new endpoint
  returning review data uses the projection, never `Review`.
- Internal routes keep `rejectInternalDevRequest` semantics (403 in production / 503 when no
  token is configured / 401 on mismatch), per `lib/dev-hq/internal-guard.ts`.

## 8.2 Existing public endpoints (VERIFIED)

| Method | Path | Notes |
| --- | --- | --- |
| GET | `/api/dev-hq/state` | Full snapshot. No pagination, no filter, no ETag. |
| GET | `/api/dev-hq/events?limit=n` | |
| GET | `/api/dev-hq/approvals` | Pending only. |
| POST | `/api/dev-hq/approvals/[id]/approve` | **Unauthenticated today.** |
| POST | `/api/dev-hq/approvals/[id]/reject` | **Unauthenticated today.** |
| GET | `/api/dev-hq/escalations` | Open only. |
| POST | `/api/dev-hq/escalations/[id]/revise` | **Unauthenticated today.** |
| POST | `/api/dev-hq/escalations/[id]/abandon` | **Unauthenticated today.** |
| POST | `/api/dev-hq/escalations/[id]/accept` | **Unauthenticated today.** |
| POST | `/api/dev-hq/founder-requests` | **Unauthenticated today.** |

## 8.3 New endpoints required

| Method | Path | Purpose | Item |
| --- | --- | --- | --- |
| GET | `/api/dev-hq/timeline?executionId= \| taskId=&cursor=` | Ordered timeline page. Cursor-paged; newest-first with an explicit `hasMore`. | 1F-1 |
| GET | `/api/dev-hq/view/:surface` | Scoped read models per screen, replacing whole-snapshot polling on phone. | 1F-2 |
| GET | `/api/dev-hq/stream` | Live updates (SSE — see Q-7). | 1F-8 |
| GET | `/api/dev-hq/inbox` | Unified decision inbox: approvals + escalations, ordered. | 1F-14 |
| GET | `/api/dev-hq/cost?scope=` | Cost/budget rollup. | 1F-4 |
| POST | `/api/dev-hq/push/subscribe` | Register a push subscription. | 1F-10 |
| DELETE | `/api/dev-hq/push/subscribe/:id` | Revoke. | 1F-10 |
| POST | `/api/dev-hq/auth/session` | Sign in. | 1F-6 |
| DELETE | `/api/dev-hq/auth/session` | Sign out. | 1F-6 |
| GET | `/api/dev-hq/auth/session` | Current principal. | 1F-6 |
| POST | `/api/dev-hq/ask` | Conversation/command turn. | 1F-15 |

## 8.4 Cross-cutting API requirements

- **Authentication on every public route**, including the existing ones. This *is* a change
  to existing routes — behavior, not shape. It is the one deviation from "additive only",
  and it is required rather than optional. Flagged for explicit Founder approval (§20 Q-5).
- **Idempotency on every mutating route.** The existing dispatch path already models this
  well (`lib/dev-hq/actions.ts` — `DispatchActionResult.resolved` distinguishes "definitively
  nothing was created" from "state may exist"). Approval and escalation resolution routes
  need the same discipline — **especially given NB-1** (a replayed `accept`/`abandon`
  overwrites newer task state, `SPRINT_1E_COMPLETION_NOTES.md` §7 item 2). A fast phone flow
  with a flaky connection will produce duplicate POSTs; this is not hypothetical.
- **Caching:** all read endpoints `no-store` for correctness (matching the existing
  `useDevHqState` fetch) except where an explicit ETag/`If-None-Match` is introduced for
  payload reduction.
- **Errors:** a single typed error envelope. Today the routes return `{ error: string }` with
  a 500 for everything, including caller faults. The ISSUE_MATRIX Part 1 policy — *"Throw
  only when the caller could not have been right. Absorb when the caller was right and the
  world moved"* — should govern new routes. **TO BE VERIFIED AFTER SPRINT 1E:** whether that
  policy is approved and how it is expressed in HTTP.

---

# 9. State and event requirements

## 9.1 Client state

| Concern | Requirement |
| --- | --- |
| Source of truth | Server records. The client derives and caches; it never authors state the server does not have. |
| Snapshot retention | Keep the last good snapshot across failures (existing behavior, `useDevHqState.ts:1-7`). Extend with an explicit `staleAgeMs`. |
| Optimistic updates | **Not permitted for approval, escalation resolution, or dispatch.** These are authority actions; showing a decision as applied before the server confirms it would misreport the Founder's own authority. Show pending, then confirmed. |
| Action gating | Every mutating control is disabled when the feed is `disconnected`, and labelled with why. |
| Deep-link cold start | A deep link must render its record without first loading a global snapshot. This is why §8.3 introduces scoped read endpoints. |
| Navigation state | Route-driven, so back/forward and notification taps behave identically. |

## 9.2 Event requirements

- **Existing taxonomy (VERIFIED, `lib/dev-hq/constants.ts`):**
  `EXECUTION_EVENT_TYPE` = `assigned, claimed, succeeded, retried, exhausted, cancelled,
  reclaimed`; `REVIEW_EVENT_TYPE` = `started, finding_recorded, passed, changes_requested,
  escalated`; `ESCALATION_EVENT_TYPE` = `raised, resolved`.
- **TO BE VERIFIED AFTER SPRINT 1E:** whether `execution.assignment_deferred` and
  `execution.claim_lost` are added. The ISSUE_MATRIX proposes both with specified dedupe
  keys. The queue view (S-11) and the status-reason field (§7.3) depend on the first one.
- **1F emits no execution-domain events.** The read-model layer is a reader. ADR-0002 E3
  places event emission in the service layer and explicitly not in the Execution Manager;
  1F's UI and view-model layers are below even that and must emit nothing.
- **New event classes 1F may need** (notification and session lifecycle, D-J): these are
  *interface* events, not execution-lifecycle events. **Q-8: do they belong in the same
  `Event` stream** (which is capped at 200 and feeds the audit timeline) **or a separate
  one?** Recommendation: separate. Polluting a capped audit stream with delivery receipts
  would evict execution history — the exact failure §7.4 already warns about.
- **Ordering.** The timeline orders by ISO timestamp string comparison, matching the existing
  `latestTimestamp` helper (`view-model.ts:278-282`). Ties must have a deterministic
  secondary sort (record kind, then id) so the same data always renders in the same order.
  Unstable timeline ordering would be indistinguishable from history changing.

---

# 10. Security and authentication requirements

**This section describes the largest gap between the current repository and the sprint's
requirements. It should be read before scope is approved.**

## 10.1 Verified current state

- No `middleware.ts`. No auth library in `package.json` (dependencies are exactly
  `@trigger.dev/sdk`, `next`, `react`, `react-dom`).
- No session, cookie, token, or identity check on any route under `app/api/dev-hq/` other
  than the `internal/*` routes.
- Consequence: `POST /api/dev-hq/approvals/[id]/approve`,
  `POST /api/dev-hq/escalations/[id]/{revise,abandon,accept}`, and
  `POST /api/dev-hq/founder-requests` execute for **any caller who can reach the server**.
- Mitigating today: nothing is deployed, and the internal routes are prod-disabled. That
  mitigation ends the moment a phone can reach the app.

## 10.2 Requirements

| # | Requirement |
| --- | --- |
| SEC-1 | Authenticate a single Founder principal. Every public `/api/dev-hq/*` route requires an authenticated session; unauthenticated requests get 401, never a redirect that could be followed by a fetch. |
| SEC-2 | Session cookie: `HttpOnly`, `Secure`, `SameSite=Lax` (`Strict` breaks notification deep links — verify against the chosen push flow), with an explicit absolute and idle expiry. |
| SEC-3 | CSRF protection on every mutating route. `SameSite` alone is insufficient for an installed PWA. |
| SEC-4 | Authorization check distinct from authentication: a decision route verifies the principal is the Founder, not merely that someone is signed in. Prepares for Phase-2 roles without building them. |
| SEC-5 | **The internal token boundary is preserved exactly.** `DEV_HQ_INTERNAL_TOKEN` never reaches the browser. The existing server-action pattern (`lib/dev-hq/actions.ts:1-7`) is the model and must not be weakened for convenience. |
| SEC-6 | **CR-1 must be resolved before deployment.** `lib/dev-hq/review-service.ts:354` mints the review callback capability via `nextId("rvt")` → `rvt-<epoch-millis>-<counter>` — a few thousand candidates. `SPRINT_1E_COMPLETION_NOTES.md` §7 item 1: *"must land before this subsystem runs anywhere other than a developer machine."* A phone-accessible deployment is that. Remediation is one line (`crypto.randomUUID()`). |
| SEC-7 | **NB-1 must be resolved before fast approval flows ship.** A replayed `accept`/`abandon` re-applies a superseded decision (`SPRINT_1E_COMPLETION_NOTES.md` §7 item 2). Fast flows plus mobile connectivity plus push deep links make duplicate POSTs likely, not rare. |
| SEC-8 | Push subscriptions are credentials. Encrypted or access-controlled at rest, scoped to the principal, revocable from Settings, and never returned in a read model. |
| SEC-9 | VAPID private key server-side only, injected by environment, never bundled. Add to the secret inventory. |
| SEC-10 | Rate-limit authentication attempts and mutating routes. |
| SEC-11 | Content Security Policy for the PWA, including the service-worker scope. No `unsafe-inline` for scripts. |
| SEC-12 | The conversation surface (S-14) must never execute a state change without an explicit Founder confirmation naming the exact record and action. **Prompt injection is a live threat here:** the conversation reads task descriptions, review findings, and evidence summaries — all attacker-influenced text in a real deployment. Commands must be structured and confirmed, never inferred and executed. |
| SEC-13 | No secret, token, or internal identifier in a push notification payload. Notifications are readable on a locked screen. |
| SEC-14 | Independent security review before deployment (§16). |

## 10.3 Explicitly deferred

Multi-user, RBAC, SSO, audit-log export, and secret rotation automation are Phase 2.

---

# 11. Responsive and mobile requirements

| # | Requirement |
| --- | --- |
| RES-1 | **Phone-first, not phone-tolerant.** Every screen is designed and built at 360 × 640 first; tablet and desktop are progressive enhancements. |
| RES-2 | Breakpoints follow the existing Tailwind convention already in use (`sm:`, `lg:` in `components/dashboard/MissionControl.tsx`). No new breakpoint system. |
| RES-3 | Correct viewport meta and `theme-color`. **VERIFIED absent** — `app/layout.tsx` exports `metadata` with title and description only. |
| RES-4 | Safe-area insets honored (`env(safe-area-inset-*)`) for notch and home-indicator devices, especially the bottom navigation. |
| RES-5 | Touch targets ≥ 44 × 44 CSS px with ≥ 8 px separation. Decision buttons (approve/reject/revise/abandon/accept) get the largest targets on the screen. |
| RES-6 | No horizontal page scroll at any width ≥ 320 px. Wide content (timelines, evidence tables, long ids) scrolls inside its own container. |
| RES-7 | Text remains legible and functional at 200 % browser zoom and at the OS's largest dynamic-type setting. |
| RES-8 | Tables become cards below `sm`. Timelines become a single vertical column. |
| RES-9 | Installable: web app manifest with name, short name, icons (192/512, maskable), `display: standalone`, start URL, scope, theme and background colors. |
| RES-10 | App shell cached by a service worker so a cold launch on a poor connection shows structure, not a blank screen. Data is never served stale from cache without an explicit staleness label. |
| RES-11 | Landscape phone and split-screen tablet do not break layout. |
| RES-12 | Performance budget on a mid-range phone over 4G: interactive under 3 s cold, under 1 s warm. Requires §2.6's payload scoping — a full `DevHqState` snapshot every 3 s does not meet this. |
| RES-13 | The Simulation Lab (S-17) is desktop-primary; it must remain reachable and non-broken on phone but need not be optimized for it. |

---

# 12. Accessibility requirements

The repository already treats accessibility as load-bearing rather than optional
(AGENT.md § Accessibility and User Experience; `MissionControl.tsx:38-44` moves focus after
an approval action so keyboard and screen-reader users are not dropped to the top of the
document; `MissionControl.tsx:70-72` announces workflow updates through a polite live
region). 1F extends that standard to every new surface.

| # | Requirement |
| --- | --- |
| A11Y-1 | WCAG 2.2 Level AA as the target for all new surfaces. |
| A11Y-2 | Every function reachable and operable by keyboard alone, in a logical order, with no traps. |
| A11Y-3 | Visible focus indicator on every interactive element, meeting the AA non-text contrast ratio. |
| A11Y-4 | Semantic structure: one `h1` per screen, correct heading order, landmarks, lists as lists, tables with headers. |
| A11Y-5 | Text contrast ≥ 4.5:1 (≥ 3:1 for large text); UI component and graphical-object contrast ≥ 3:1. **Status color must never be the sole carrier of meaning** — every status token pairs color with text. The existing `StatusToken { label, color }` shape (`lib/mission-control/status.ts`) already enforces this pairing; keep it. |
| A11Y-6 | Live regions for automatic updates: `polite` for status changes, `assertive` reserved for the Founder's own action results and genuine failures. The live-region pattern already in `MissionControl.tsx` is the precedent. |
| A11Y-7 | **Focus management after a decision.** When an approval or escalation action removes its controls from the DOM, focus moves to a meaningful heading and the outcome is announced. This is the existing `focusTitle` pattern; it must be applied to every new decision surface, not reinvented per screen. |
| A11Y-8 | Forms and the conversation input: programmatic labels, errors associated with their fields, errors announced, and never signalled by color alone. |
| A11Y-9 | `prefers-reduced-motion` honored — timeline animations, transitions, and live-update effects. |
| A11Y-10 | Touch targets per RES-5 (also WCAG 2.2 Target Size AA). |
| A11Y-11 | The timeline is a semantic ordered list with accessible timestamps, not a purely visual construct. |
| A11Y-12 | Screen-reader smoke test on at least one mobile screen reader (VoiceOver iOS or TalkBack) for J-1 and J-2, the two decision journeys. |
| A11Y-13 | Push notifications carry meaningful, self-contained text — a notification is often the only content a screen-reader user hears. |
| A11Y-14 | Dark and light both meet contrast requirements. **TO BE VERIFIED AFTER SPRINT 1E:** whether `lib/theme.ts` `COLORS` currently meet AA in both modes; not audited during this planning session. |

---

# 13. Reconnect and failure behavior

## 13.1 Existing behavior (VERIFIED)

`lib/mission-control/useDevHqState.ts`: polls every 3000 ms; retains the last good snapshot
on failure; exposes `FeedStatus` = `initial | live | degraded | disconnected`; degrades after
1 failure and disconnects after 3 consecutive failures
(`DISCONNECTED_AFTER_FAILURES = 3`); aborts in-flight requests on unmount. The module
comment states the principle explicitly: *"the founder keeps seeing the most recent known
state instead of an empty dashboard, with the staleness surfaced separately rather than
silently."* 1F preserves that principle and extends it.

## 13.2 Requirements

| # | Scenario | Required behavior |
| --- | --- | --- |
| F-1 | Transient network failure | Retain last snapshot. Show `degraded` with the age of the data. Keep read surfaces usable. |
| F-2 | Sustained failure | `disconnected` after the threshold. **All mutating controls disabled**, each labelled with the reason. Never let the Founder issue a decision into a void. |
| F-3 | Reconnect | Automatic, with exponential backoff and jitter. On recovery, refresh fully rather than resuming a delta from an unknown point. Announce recovery politely. |
| F-4 | Backgrounded app / phone sleep | On `visibilitychange` to visible, immediately refresh and re-establish the stream rather than waiting for the next interval. Long-backgrounded state must be treated as stale until confirmed. |
| F-5 | Stale data display | Every screen shows data age when it exceeds a threshold. **Never render stale data as live.** |
| F-6 | Server restart | The store is in-memory and non-durable (`store.ts:1-2`). A restart empties it. The UI must distinguish *"the server has no records"* from *"we cannot reach the server"* — these look identical to a naive client and mean opposite things. **This is a real operational case, not a hypothetical.** |
| F-7 | Action failure | Report the exact failure. Preserve the Founder's intent so it can be retried without re-deriving it. Never silently swallow. |
| F-8 | Duplicate action (double-tap, retry, two devices) | The route is idempotent (§8.4). The UI reports the *actual* current state, not the state the second request would have produced. **Gated on SEC-7 / NB-1.** |
| F-9 | Push received while offline | The notification deep-links; on open, the app shows the record if cached and an explicit "cannot load, offline" state otherwise. It never renders a decision surface it cannot back with current data. |
| F-10 | Session expiry mid-flow | Re-authentication preserves the destination and, where safe, the unconfirmed intent. Never lands the Founder on Home with no explanation. |
| F-11 | Stream unsupported/blocked | Fall back to polling automatically and report the degraded transport in Settings, not in the Founder's face. |
| F-12 | Offline mutation | **Explicitly not supported in 1F** (§3.3). Attempting an action offline is refused with a clear message. Queuing decisions for later sync is a correctness hazard — a queued approval could apply to a record that has since changed — and is deferred until it can be designed properly. |

---

# 14. Acceptance criteria

Written so that each is verifiable by execution or inspection, not by assertion.

## 14.1 Sprint-level

| # | Criterion |
| --- | --- |
| AC-1 | Every screen in §5 that is not blocked by a Founder decision is reachable, renders real data from the store, and works at 360 px. |
| AC-2 | Every entity surface renders the six-field decision header (§6.4), with absences rendered as explicit absences. Verified by a test that feeds a record with no recorded reason and asserts the absence string, not a fabricated one. |
| AC-3 | The execution timeline merges events, evidence, assignment transitions, reviews, findings, and escalations in stable chronological order; is purely derived (no new store); and is append-only — a retry, review, revision, or correction adds entries and modifies none. Proven by a test that snapshots the timeline, drives a revision, and asserts the earlier entries are byte-identical. |
| AC-4 | Timeline truncation caused by the 200-event cap (§7.4) is either eliminated or rendered explicitly. A silently truncated timeline fails this criterion. |
| AC-5 | No public API response shape is removed or changed (additive only), except the authentication requirement approved under Q-5. Verified by the existing route tests plus a shape-regression check. |
| AC-6 | The founder-request workflow behaves identically. Its full test suite passes unchanged. |
| AC-7 | `PublicReview` remains the only review shape crossing the boundary. The `?: never` compile-time guard still fails a raw `Review`. Verified by re-running the isolated compile check recorded in `SPRINT_1E_COMPLETION_NOTES.md` §2. |
| AC-8 | Every public `/api/dev-hq/*` route rejects an unauthenticated request with 401. Verified per route, not by sampling. |
| AC-9 | Every mutating route is idempotent under replay: a duplicated request produces one effect and returns the actual current state. |
| AC-10 | The app is installable: manifest validates, icons resolve, `display: standalone`, service worker registers, cold offline launch shows the shell. |
| AC-11 | A push notification for a new escalation reaches a subscribed device and deep-links to the escalation detail. **CONTINGENT on research R-14** (§20.4.E, risk R-14x): if Web Push proves unavailable on the Founder's device, this criterion is withdrawn and replaced by the notify-on-open fallback. The payload carries subject + record id and deep-links only — **no actionable notification buttons** (DESIGN-001 RB-5), because a notification action would bypass the §11.5 confirmation and the freshness check. It must also distinguish all four escalation-origin presentations, so PE-3 is satisfied in the notification, not only in the queue. |
| AC-12 | J-1 completes in **two interactions after the notification tap**, measured end to end. **CONTINGENT on R-14**, as AC-11. |
| AC-13 | Feed degradation, disconnection, and recovery behave per §13. Mutating controls are provably disabled while disconnected. |
| AC-14 | `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`, and `npx next build` all exit 0. |
| AC-15 | Accessibility: automated audit clean on every new screen; keyboard-only traversal of J-1 and J-2 complete; mobile screen-reader pass on both. |
| AC-16 | No secret, internal token, or callback capability appears in any browser-reachable payload. Verified by inspecting actual responses, not by reading the projection code. |
| AC-17 | CR-1 (CSPRNG callback token) and NB-1 (replayed resolution) are resolved before any deployment beyond a developer machine (SEC-6, SEC-7). |
| AC-18 | The Simulation Lab still works, unchanged in behavior. |
| AC-19 | Cost, context health, checkpoints, and model/provider each either render real recorded data or render an explicit, honest absence. **A plausible-looking placeholder fails this criterion.** **Extended at reconciliation to DESIGN-001's rules:** Unknown renders `—` with a mandatory reason and **never `0`** (D4); **Empty (dark)** and **Empty (true)** are distinct states (D6); and a projection may never be counted in a headline metric, coloured with a state colour, notified on, or used to gate an action (D3). **Also covers `DevHqState.overview`**, which is typed from placeholder data (§20.4.G I5) and must be replaced with live counters or explicitly marked. |
| AC-20 | The conversation surface executes no state change without an explicit confirmation naming the record and action (SEC-12). Verified by an adversarial test using injected instruction text in a task description. |

## 14.2 Per-item

Each work item in §18 carries the Sprint 1E Definition of Done verbatim, which the 1E plan
already established and which is not restated per item here: tsc clean, lint clean, tests
pass, build succeeds where appropriate, founder-request behavior unchanged, additive API
only, `git diff --stat` and `git status --short` in the report, **not committed until review
approval**, and stop for review after completing the item.

**Corrective action carried from Sprint 1E:** `SPRINT_1E_COMPLETION_NOTES.md` §8 records
that both review gates ran *after* the implementation commits, contrary to GOV-001 and the
plan's own Definition of Done, accepted as a one-time recorded exception with the explicit
instruction: *"Corrective action for Sprint 1F: run both gates before commit, in the GOV-001
order. No further exception should be needed."* **This plan adopts that as a hard rule.**

---

# 15. Testing strategy

## 15.1 Current capability (VERIFIED — this is the binding constraint)

- `vitest.config.ts`: `environment: "node"`, `include: ["**/*.test.ts"]`. **`.tsx` files are
  not collected.** No component test can run today.
- `@playwright/test` is in `devDependencies`, but there is **no Playwright config and no e2e
  test anywhere in the repository**.
- Sprint 1E baseline: 22 test files, 317 tests, all passing.

**Therefore 1F-18 (test infrastructure) is not optional and cannot be sequenced last.** A UI
sprint validated only by `tsc` and a production build would be validated by nothing that
tests behavior.

## 15.2 Layers

| Layer | Scope | Tool | Notes |
| --- | --- | --- | --- |
| Unit — derivation | Timeline merge/ordering/append-only; owner, reason, gate, blocker derivation; cost aggregation; inbox ordering | Vitest (node) | Pure functions. Highest value per test. Follows the existing `view-model.ts` pure-function pattern, which is already test-friendly by construction. |
| Unit — API | New routes: auth, authorization, idempotency, error shape, pagination | Vitest (node) | Mirrors the existing `app/api/dev-hq/**/route.test.ts` convention. |
| Component | New React surfaces: rendering, absence states, focus management, disabled-while-disconnected | **Vitest with a DOM environment — new project config required** | Requires adding a `jsdom`/browser environment and extending `include` to `.tsx`. New dependency; needs approval (§20 Q-9). |
| Integration | Escalation → notification → deep link → decision → state change | Vitest with mocked Trigger SDK | Follows the hoisted-mock pattern established in Sprint 1D-5 and reused in 1E. |
| End-to-end | J-1 and J-2 on a phone viewport; install; offline shell; reconnect | **Playwright — config required** | Already a devDependency; only configuration and specs are new. |
| Accessibility | Automated audit per screen; manual keyboard; manual mobile screen reader | Playwright + axe; manual | Automated audits catch roughly a third of real issues — the manual passes are required, not optional. |
| Security | Unauthenticated access to every route; CSRF; token non-exposure; injection resistance of the conversation surface | Vitest + manual | AC-8, AC-16, AC-20. |
| Regression | Full founder-request suite; public API shape check; Simulation Lab | Existing suite | Must stay green after every item. |
| Performance | Cold and warm load on a throttled mid-range phone profile | Playwright trace | RES-12. |

## 15.3 What must be tested specifically because it has failed before

The Sprint 1E validation cycle produced concrete lessons. They are carried forward as
required tests, not as advice:

- **Tests that assert current behavior rather than required behavior are worse than missing
  tests.** ISSUE_MATRIX X2 and X2b document two existing tests that pin defects as correct.
  Every 1F test must assert the *requirement*, and any test written against observed output
  must be justified in review.
- **Absence must be tested.** Feed a record with no recorded status reason and assert the
  honest-absence string. Without this, AC-2 and AC-19 are unverifiable and placeholder text
  can drift into looking authoritative.
- **Append-only must be tested by mutation, not by inspection.** Snapshot, drive a change,
  compare (AC-3).
- **Idempotency must be tested by replay**, including out-of-order replay, given NB-1.
- **The build must actually be run.** Both Sprint 1E reviews recorded that neither had run
  `next build`; the gap was closed afterwards. 1F runs it inside the validation item.

---

# 16. Review strategy

## 16.1 Required gates, in the permanent review order, **before commit**

**Permanent review order (Founder decision, 2026-07-26):**

> **Independent Code Review → Architecture Review → Founder Approval → Protected Baseline.**

**CORRECTED at the correction pass.** Version 0.2.0 as first written listed Architecture
review as G-2 and Independent code review as G-3, i.e. the reverse of the order now fixed by
the Founder. The governance workstream recorded this as its contradiction **X-2** ("gate order
inverted against GOV-001") and, being barred from editing another workstream's document, asked
the 1F owner to correct it (its **GQ-1**). It is corrected here, and **X-2 is discharged.** The
gate identifiers are re-lettered so that they read in execution order; the three cross-
references elsewhere in this document (§19.1 D-8, §20.2 R-12, §20.2 R-13) are updated to match.

| Gate | Owner | Scope |
| --- | --- | --- |
| G-1 Design review | Claude Design Engineer (AGENT-004 / ROLE-014) | User flows, IA, interaction behavior, absence-state design, accessibility specification. **Before implementation of any surface.** |
| G-2 Independent code review | Independent Code Reviewer (AGENT-008) | Line-level defects, TypeScript quality, maintainability, test quality (explicitly including wrong-direction assertions — see §15.3). **Runs first of the two commit gates.** |
| G-3 Architecture review | Architecture Reviewer (AGENT-019 / ROLE-022) | ADR compliance, read-model purity, Execution Manager purity preserved, service/repository boundaries, no hidden coupling, timeline append-only property, scope enforcement. Commit-gate verdict. **Runs after G-2.** |
| G-4 Security review | Security owner | §10 in full. **Blocking for any deployment beyond a developer machine.** |
| G-5 Accessibility review | Claude Design Engineer | §12, including the manual passes. |
| G-6 QA / release readiness | QA | Journeys, failure behavior, evidence completeness. |

The Founder-fixed order governs the **two commit gates and what follows them**: G-2, then G-3,
then **Founder Approval**, then the change enters the **Protected Baseline**. G-1 sits before
implementation and G-4…G-6 are scoped by §16.2; the Founder decision does not reorder them and
this plan does not reinterpret it as doing so.

## 16.2 Sequencing rules

- **Both G-2 and G-3 run before commit, G-2 before G-3.** Running both before commit is the
  explicit corrective action recorded in `SPRINT_1E_COMPLETION_NOTES.md` §8; their relative
  order is the Founder's permanent review order above. No exception is pre-authorized.
- **Nothing reaches the Protected Baseline without Founder Approval**, and Founder Approval is
  sought only after both G-2 and G-3 have returned a verdict.
- G-1 runs before implementation of the surfaces it governs. Building twelve screens and then
  reviewing the design is not a review; it is a rework request.
- G-4 runs against the complete authentication and push implementation, before any hosted
  deployment.
- Review reports are Records under GOV-001 and are committed with the work they gate, as
  Sprint 1E's were (`agents/*/outputs/`).
- **Independent Code Review verdict vocabulary (Founder decision, 2026-07-26) — exactly three
  strings:** `PASS` · `PASS WITH NON-BLOCKING FINDINGS` · `FAIL`. **CORRECTED:** version 0.2.0
  as first written used `PASS WITH NON-BLOCKING FOLLOW-UPS`, which is not the approved string.
  A `PASS WITH NON-BLOCKING FINDINGS` verdict authorizes commit only when every finding is
  recorded durably — the standard Sprint 1E applied.
- **Shared severity ladder (Founder decision, 2026-07-26) — exactly four levels:** `BLOCKER` ·
  `MAJOR` · `MINOR` · `OBSERVATION`. Every gate that reports findings reports them at these
  levels, and §17's evidence and the completion notes use the same ladder. Consequences for
  this plan: §4 J-5's *"findings by severity"* and §5 S-12's *"findings by severity"* render
  **these four levels and no others**, and §21's *"no unresolved blocker"* means no finding at
  `BLOCKER`.

## 16.3 Review inputs that must exist before G-2 and G-3

- The deployment/persistence/transport/authentication ADR (§20 Q-1), approved. **Its number is
  assigned centrally, not by this workstream** (Founder decision, 2026-07-26).
- The amended ADR-0002 E5 parenthetical — carried forward from Sprint 1E as an outstanding
  documentation item.
- The Sprint 1E plan amendment resolving the PE-1 numbering conflict, which
  `SPRINT_1E_COMPLETION_NOTES.md` §6.1 explicitly schedules for *"the start of Sprint 1F"*.
- **Missing role handbooks and standards.** `SPRINT_1E_COMPLETION_NOTES.md` §7 item 6 records
  as OPEN that `handbooks/INDEPENDENT_CODE_REVIEWER.md` does not exist despite being named
  by `agents/independent-code-reviewer/AGENT.md:7`, that eight other agent directories have
  no handbook, and that `NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, and
  `ERROR_HANDLING_STANDARD.md` are absent from `standards/`. Decision owner: Director of
  Operations. **A review gate whose own standard is missing cannot certify against it.**

---

# 17. Evidence requirements

## 17.1 Evidence the sprint must produce

| # | Evidence | Form |
| --- | --- | --- |
| E-1 | Validation output | Verbatim `tsc`, `eslint`, `vitest`, and `next build` output with exit codes, run against a named commit. |
| E-2 | Test inventory delta | File and test counts before and after, with new tests attributable to acceptance criteria. |
| E-3 | Screen evidence | Screenshot of every screen at 360 px and at desktop width, in both light and dark, including empty, loading, error, stale, and absence states. |
| E-4 | Journey evidence | Recorded traversal of J-1 and J-2 end to end on a phone viewport. |
| E-5 | Accessibility evidence | Automated audit output per screen; keyboard traversal notes; mobile screen-reader session notes for J-1 and J-2. |
| E-6 | Security evidence | Per-route unauthenticated-access results; CSRF verification; a captured `/api/dev-hq/state` response demonstrating no `callbackToken` and no internal token; conversation injection test result. |
| E-7 | Performance evidence | Cold and warm load traces on the throttled phone profile. |
| E-8 | PWA evidence | Manifest validation, service-worker registration, install capture, offline cold-launch capture. |
| E-9 | Push evidence | Subscription registration, delivery capture, deep-link landing, revocation. |
| E-10 | Timeline correctness evidence | The append-only snapshot comparison from AC-3, and the truncation behavior from AC-4. |
| E-11 | Review artifacts | G-1…G-6 reports committed under `agents/*/outputs/`. |
| E-12 | Completion notes | `docs/plans/SPRINT_1F_COMPLETION_NOTES.md`, following the Sprint 1E structure: delivered vs deferred, both review verdicts, all follow-ups, all escalations, and an explicit statement of anything unverified. |

## 17.2 Evidence discipline (carried forward from Sprint 1E)

- **Anything unverified is stated as unverified.** Sprint 1E's reviews recorded "production
  build not run" explicitly rather than omitting it, and that disclosure is why the gap was
  closed. Same standard applies.
- **Verify claims by execution, not by reading the code that makes them.** Sprint 1E's
  `PublicReview` guard was verified by compiling a control case, not by trusting a comment.
  AC-16 requires the same treatment for token non-exposure.
- **Record counts that were actually produced**, not counts that were expected. Sprint 1E's
  architecture review recorded a discrepancy between anticipated and actual finding counts
  rather than adjusting to meet expectation. Same standard.

## 17.3 In-product evidence surfacing

Distinct from sprint evidence: the `Evidence` records the system produces must be browsable
from every entity surface, filterable by kind (`validation | artifact | review | approval |
log`), linkable, and shown in the timeline at their recorded position. Evidence is
descriptive record-keeping and never drives control flow (ADR-0002 E4) — the UI must not
imply otherwise.

---

# 18. Proposed work-item sequence

Twenty-three items in five phases (1F-19 split into 19a/19b at reconciliation). Each is
independently reviewable and testable, and each carries
the Definition of Done (§14.2).

**Scope warning, stated plainly:** this is a large sprint — net-new authentication, a PWA, a
push pipeline, a conversation surface, four new domain areas, twelve screens, and the test
infrastructure to validate any of it. Comparable in size to 1D and 1E combined. §20 R-1
recommends splitting it; the full package is presented here so the Founder can make that cut
with the whole picture in view.

## Phase 0 — Governance and unblocking (must complete first)

| Item | Title | Depends on |
| --- | --- | --- |
| **1F-0** | **Decision and governance gate.** Resolve Q-1…Q-9 (§20) and the escalations E-1…E-7 (§20.4.B). Author and approve **two ADRs, neither numbered by this workstream** (Founder decision 2026-07-26 — numbers assigned centrally): the **deployment / persistence / transport / authentication ADR** (the subject this plan calls ADR-0003) and the **negative-outcome representation ADR** (governance §6.1 B). Amend ADR-0002 E5's parenthetical (carried forward from 1E). Amend the Sprint 1E plan for the PE-1 numbering conflict (scheduled for "the start of Sprint 1F"). Confirm Sprint 1E remediation disposition. **ADDED at reconciliation: 1F-0 cannot close until the five Rank-A research items report — R-08, R-03, R-01, R-02, R-14 — each of which the research backlog states is due "before 1F-0 closes" (§20.4.E), or until the Founder accepts proceeding without them.** **No implementation item starts until this closes.** | **R-08, R-03, R-01, R-02, R-14** |

## Phase A — Backend read-model and data (no UI)

| Item | Title | Depends on |
| --- | --- | --- |
| **1F-1** | **Execution timeline read-model.** Carries forward plan 1E-8. Derived only, no new store, append-only, stable ordering, explicit truncation handling (§7.4). Expose `AgentAssignment` (D-A) as a projection. | 1F-0 |
| **1F-2** | **Read surface completion and scoping.** Carries forward plan 1E-9. Scoped per-screen read endpoints, cursor pagination, and the timeline endpoint. Removes the whole-snapshot phone dependency. | 1F-1 |
| **1F-3** | **Decision-field derivation.** `currentOwner`, `statusReason`, `nextGate`, `blockers` per §7.3, with explicit absence for every unrecorded case. | 1F-1; **1E remediation (§19 D-1)** |
| **1F-4** | **Model, provider, and usage capture.** Populate the already-declared `AgentUsageMetadata` and record model/provider per execution. **REDUCED at reconciliation: no budget entity** — it would collide with Phase 2 §4.5 `ProjectBudget` (§20.4.D). Rate source and budget model are R-17 / E-5. | 1F-0; **R-01** |
| **1F-5** | **Context health and checkpoints — RENDERING ITEM.** **Reclassified at reconciliation (CLM §14.2):** 1F wires and renders the CLM's `PublicContextHealth` projection and `ContextCheckpoint` records and **designs no domain model, creates no entity, and chooses no thresholds.** The surface renders dark regardless, because Phase-1 agents produce no context — the CLM confirms this and warns against planning otherwise. | 1F-0; CLM projection availability |

## Phase B — Access and transport

| Item | Title | Depends on |
| --- | --- | --- |
| **1F-6** | **Authentication and authorization.** Session, middleware, per-route enforcement, sign-in surface, CSRF. SEC-1…SEC-5, SEC-10. | 1F-0 |
| **1F-7** | **Pre-deployment security remediation.** CR-1 (CSPRNG callback token) and NB-1 (replayed resolution). SEC-6, SEC-7. Both are named in `SPRINT_1E_COMPLETION_NOTES.md` §7 as required before non-developer use. | 1F-0 |
| **1F-8** | **Live transport and reconnect.** Stream or tuned polling per Q-7, backoff with jitter, visibility-change refresh, staleness age, action gating while disconnected. §13. | 1F-2 |

## Phase C — Delivery surface

| Item | Title | Depends on |
| --- | --- | --- |
| **1F-9** | **PWA shell.** Manifest, icons, viewport and theme-color metadata, service worker, offline app shell, install flow, safe-area handling. RES-3, RES-4, RES-9, RES-10. | 1F-6 |
| **1F-10** | **Push notifications.** VAPID, subscription store (D-I), delivery records (D-J), notification policy, deep-link payloads, revocation. SEC-8, SEC-9, SEC-13. | 1F-9, 1F-6 |

## Phase D — Interface

| Item | Title | Depends on |
| --- | --- | --- |
| **1F-11** | **App shell, navigation, IA, and responsive system.** Route tree (§6.3), bottom navigation, the six-field decision header component (§6.4), status/absence primitives, phone-first layout. | 1F-2, 1F-6 |
| **1F-12** | **Command Home and Decision Inbox** (S-1, S-2). | 1F-11, 1F-3 |
| **1F-13** | **Approval and escalation detail + fast decision flows** (S-3, S-4). Includes PE-3: render `Review.escalationReason` beside `Escalation.origin`. | 1F-12, 1F-7 |
| **1F-14** | **Execution detail and live timeline** (S-9). The centerpiece surface. | 1F-11, 1F-1, 1F-8 |
| **1F-15** | **Task, project, queue, agent, and review views** (S-5, S-8, S-10, S-11, S-12). | 1F-11, 1F-3 |
| **1F-16** | **Roadmap, sprint, and release views** (S-6, S-7, S-13). **Blocked on Q-3; may be cut entirely.** | 1F-0 (Q-3), 1F-11 |
| **1F-17** | **Cost, context health, and checkpoint surfaces** (S-15, and the operational panels on S-9). | 1F-4, 1F-5, 1F-14 |
| **1F-18** | **Founder conversation and command surface** (S-14). **Blocked on Q-2.** Structured commands with mandatory confirmation; SEC-12. | 1F-0 (Q-2), 1F-11 |

## Phase E — Validation

| Item | Title | Depends on |
| --- | --- | --- |
| **1F-19a** | **Component test infrastructure.** DOM environment for Vitest, `.tsx` collection, first component tests. **SPLIT and RE-SEQUENCED at reconciliation (§20.4.E): lands at the FRONT of Phase D, before 1F-12.** Without it every Phase-D item ships unverifiable. | 1F-11 |
| **1F-19b** | **Browser and accessibility suite.** Playwright configuration, e2e specs, axe integration. **Lands after the Phase-D surfaces stabilize**, per research R-22's warning against building a browser suite for a UI about to change. R-22's one-check cost probe against a *pre-existing* panel may run earlier. | Phase D surfaces stable |
| **1F-20** | **Accessibility conformance pass** (§12), including manual keyboard and mobile screen-reader passes. | all Phase D |
| **1F-21** | **Validation, evidence pack, and completion notes.** Full suite, all evidence in §17, review gates in GOV-001 order before commit, completion notes. | all |

Twenty-three items including 1F-0. The numbering intentionally exceeds the item count of prior
sprints because the scope does. **Reconciliation note:** the count rose by one only because
1F-19 was split; the *scope* fell — the budget entity, the checkpoint entity, the context-health
domain work, task-dependency instrumentation, and three new roadmap/sprint/release entities were
all removed (§20.4.C, §20.4.D).

---

# 19. Dependency map

## 19.1 External dependencies (outside this sprint's control)

| # | Dependency | Blocks | Owner |
| --- | --- | --- | --- |
| **D-1** | **Sprint 1E remediation disposition.** The ISSUE_MATRIX is `AWAITING FOUNDER APPROVAL`. Its `execution.assignment_deferred` event is the *only* record that would explain a queued-but-unassigned execution. Without it, S-11 (queue) and the status-reason field have nothing honest to render for the most common stall. | 1F-3, 1F-12, 1F-15 | **Founder** |
| **D-2** | ADR-0003 (deployment, persistence, transport, auth) — Q-1. | Everything in Phases B–E | **Founder** + Lead Software Engineer |
| **D-3** | Q-3 — roadmap/sprint/release entities. | 1F-16, and the §6.1 IA | **Founder** |
| **D-4** | Q-2 — conversation architecture. | 1F-18 | **Founder** + Lead Software Engineer |
| **D-5** | Q-4 — cost/context/checkpoint data availability. | 1F-4, 1F-5, 1F-17 | **Founder** |
| **D-6** | New dependencies: auth library, web-push library, `jsdom`. Sprints 1D and 1E added **zero** dependencies by design; 1F cannot. Explicit approval required. | 1F-6, 1F-10, 1F-19a/b | **Founder** |
| **D-7** | Hosting for a phone-reachable deployment, plus HTTPS (Web Push requires it). | 1F-9, 1F-10 | **Founder** |
| **D-8** | Missing handbooks and standards (§16.3). | **G-2** completeness (re-lettered at the correction pass; the Independent Code Review gate, whose own handbook is the one recorded as absent) | **Director of Operations** |
| **D-9** | ADR-0002 E5 amendment and the Sprint 1E plan PE-1 amendment, both carried forward from 1E. | 1F-0 closure | Lead Software Engineer + Director of Operations |

## 19.2 Internal dependency graph

```
1F-0  (decisions, ADR-0003, amendments)
 │
 ├─► 1F-1 timeline ──► 1F-2 read surface ──► 1F-8 transport ─┐
 │        │                   │                              │
 │        └──► 1F-3 decision fields ◄── [D-1: 1E remediation] │
 │                     │                                      │
 ├─► 1F-4 cost/model ──┤                                      │
 ├─► 1F-5 context/ckpt ┤                                      │
 │                     │                                      │
 ├─► 1F-6 auth ────────┼──► 1F-9 PWA shell ──► 1F-10 push ────┤
 ├─► 1F-7 CR-1 / NB-1 ─┤                                      │
 │                     ▼                                      ▼
 └────────────────► 1F-11 shell / IA / responsive system ◄────┘
                          │
                          ├──► 1F-12 home + inbox
                          │         └──► 1F-13 approval/escalation detail  [needs 1F-7]
                          ├──► 1F-14 execution + timeline                  [needs 1F-1, 1F-8]
                          ├──► 1F-15 task/project/queue/agent/review
                          ├──► 1F-16 roadmap/sprint/release                [D-3 — may be cut]
                          ├──► 1F-17 cost/context/checkpoint surfaces      [needs 1F-4, 1F-5]
                          ├──► 1F-18 conversation                          [D-4 — may be cut]
                          └──► 1F-19a component test infra  ← FIRST in Phase D
                                    │
                                    ▼
                        (Phase D surfaces stabilize)
                                    │
                                    ▼
                              1F-19b browser/a11y suite  [R-22: after stabilization]
                                    │
                                    ▼
                              1F-20 a11y ──► 1F-21 validation + evidence + notes
```

**Reconciliation amendments to this graph (§20.4):** `1F-19` is split into `1F-19a`
(front of Phase D) and `1F-19b` (after stabilization). `1F-0` additionally gates on the five
Rank-A research items. `1F-5` is blocked on an absent CLM contract and reduced to a dark
surface. `1F-16`'s blocker changes from "no entity" (Q-3) to "may plans be UI data sources?"
(E-7). `1F-11` now implements DESIGN-001's shell rather than this plan's §6.

## 19.3 Critical path

`1F-0 → 1F-6 → 1F-11 → 1F-12 → 1F-13`

The shortest path to the sprint's primary value (J-1: decide from the phone) runs through
decisions, authentication, the shell, the inbox, and the decision detail. **1F-1/1F-2/1F-8
run in parallel and join at 1F-14.** If the sprint must be cut, cut toward this path.

## 19.4 Preserved invariants (must hold at every item)

Founder-request workflow behavior · public API shapes (additive only) · Execution Manager
purity · no direct agent-to-agent communication (ADR-0002 E7) · `PublicReview` as the only
boundary-crossing review shape · internal token never reaching the browser · memory-store
default unless ADR-0003 changes it · Simulation Lab preserved (ADR-0001 D9).

---

# 20. Risks and Founder decisions

## 20.1 Unresolved architecture questions — **all require a Founder decision before 1F-0 closes**

### Q-1 — Where does this run, and on what persistence? *(highest priority)*

A phone-optimized PWA with push notifications is, by definition, reachable from outside a
developer machine. But:

- The store is `"Development-only … Single Next.js process, non-durable, not for
  production"` (`lib/dev-hq/store.ts:1-2`). A **serverless or multi-instance deployment
  breaks it outright** — each instance would hold a different store, and the Founder would
  see different state on each request.
- A server restart empties all state (§13 F-6).
- `lib/dev-hq/actions.ts:43` disables agent dispatch when `NODE_ENV === "production"`, and
  the internal routes return 403 in production. **A production deployment of the current
  code cannot dispatch or execute anything.**
- ADR-0002 E9/D-E5 defers persistence and the persistence abstraction to a later phase, gated
  on explicit approval to install `@supabase/supabase-js` and apply migrations.

**These cannot all be true at once for a shipped 1F.** Options: (a) 1F targets a single
long-lived process on a trusted network (VPN/tunnel) with memory persistence, accepting
restart data loss; (b) 1F consumes the **existing unmerged persistence work** (see below)
rather than building it; (c) 1F is built and validated locally, with deployment deferred.

**Correction — PENDING CROSS-WORKSTREAM REVIEW.** An earlier draft of this section treated
persistence as wholly unbuilt. That is wrong. **VERIFIED this session:** the branch
`feature/sprint-1c-b-supabase-persistence` exists locally and unmerged, tip `3d1665f`
*"feat: add opt-in Supabase persistence and auth infrastructure"*, 28 files changed against
`sprint-1e-baseline`, including `supabase/migrations/0001_dev_hq_schema.sql`,
`lib/supabase/{client,server,service,middleware,env,database.types}.ts`, and seven Supabase
adapters. `feature/sprint-1c-a-repository-abstraction` also exists unmerged.

**Critical limitation, VERIFIED by file inventory:** the Supabase adapters on that branch
cover `approval-manager`, `event-logger`, `project-repository`, `state-reader`,
`task-repository`, `workflow-engine`, and `workflow-run-repository` — **and nothing else.**
There is no Supabase adapter for `evidence-store`, `review-store`, `escalation-store`,
`execution-runner`, or `agent-provider`. Those are precisely the Sprint 1D/1E entities the
1F timeline, queue, review, and escalation surfaces read. The branch predates 1D and 1E.

**TO BE VERIFIED AFTER SPRINT 1E** (contents not read during this session — only the file
inventory, commit subject, and diffstat): what the migration schema covers, whether the
adapters still satisfy the current contracts, what `lib/supabase/middleware.ts` implements,
and what merge cost the branch carries after 1D and 1E.

**Revised recommendation:** (a) for 1F — single long-lived process, memory store, trusted
network — **and route the persistence decision to its own workstream**, not into 1F. Phase 2
program planning already registers this as precondition **P-1** and Founder decision
**D-P1** *("Approve the durable persistence backend and merge path for Sprint 1C-B")*.
**1F should not own that decision, and this plan does not claim it.** What 1F needs from that
workstream is stated as an interface in §20.4 I-1. ADR-0003 still required for 1F's own
deployment and transport choices. **Decision owner: Founder**, coordinated across workstreams.

### Q-2 — What is the founder conversation, architecturally?

"Founder conversation and command surface" admits at least three readings: a structured
command palette with natural-language-ish input and no model; a real AI conversation over
Dev HQ state (the repository has Trigger.dev `chat.agent` skills available, which suggests
this is feasible); or a hybrid — grounded read-only Q&A plus structured, confirmed commands.
The cost, risk, and dependency profile differ enormously. A real AI surface also collides
with ADR-0001 D4 (*deterministic simulated agents only in Phase 1*) and introduces the
prompt-injection exposure in SEC-12. **Recommendation: the hybrid, with commands strictly
structured and confirmed.** **Decision owner: Founder** + Lead Software Engineer.

### Q-3 — Roadmap, sprint, and release: what are they?

**VERIFIED:** none of the three has a domain entity, store collection, state field, or API.
`RELEASE_PROCESS.md` and `VERSIONING_POLICY.md` exist as documents; neither is modeled.

**REVISED at reconciliation — this workstream withdraws its three options.** DESIGN-001 D16
and D17 supply a better answer than any of them: render roadmap, sprint, and release from the
**planning and process documents**, badged `preview`, with a hard prohibition on burndown,
velocity, and projected dates, and a release-gate vocabulary containing **no "Passed"** value
(*"Evidence recorded"* is the strongest honest claim, because Dev HQ records no gate
satisfaction). **No `Roadmap`, `Sprint`, or `Release` entity is created in 1F.** This delivers
all three views without inventing an entity and without a schema that candidate ADR #7 would
later have to scope-key. Adopted in §20.4.C.

**What remains open is no longer "what are they?" but a narrower governance question:** may
`docs/plans/` prose and `RELEASE_PROCESS.md` serve as **UI data sources**? DESIGN-001 raises
this itself as its C6/C7 and notes the documentation workstream may decline. If declined, both
views degrade to recorded facts only — DESIGN-001 specifies that fallback, so refusal costs a
reduction, not a redesign. **Escalated as E-7. Decision owner: Director of Operations +
Founder.**

### Q-4 — Cost, context health, and checkpoints: where does the data come from?

**VERIFIED:** none of these is captured. `AgentUsageMetadata` exists but is always written as
`null`. Phase 1 agents are deterministic simulations (ADR-0001 D4) that consume no tokens,
have no context window, and produce no checkpoints. Therefore: **any cost, context-health, or
checkpoint value shown in 1F would be either zero or fabricated**, unless real providers land
first. Options: (a) build the capture plumbing now and render honest zero/absent until Phase
2 fills it — the surfaces exist and are correct but empty; (b) defer these four scope items
to Phase 2 alongside real agents; (c) seed a simulated cost model — **rejected outright: it
would fabricate evidence, which AGENT.md prohibits absolutely.** **Recommendation: (a)** —
it satisfies the canonical scope honestly, costs the plumbing rather than the fabrication,
and makes the surfaces real the moment providers land. **Decision owner: Founder.**

**REVISED at reconciliation — Q-4 splits, and the two halves now have different answers.**

**Cost/budget half — recommendation (a) stands, with scope reduced.** DESIGN-001 D5 ships
Budget & Cost as a first-class dark surface with a data contract, and RB-1 states the UI will
not hardcode prices. Reconciled: **1F-4 populates the already-declared `AgentUsageMetadata`
and records model/provider per execution — and creates no budget entity.** Phase 2 §4.5
already defines `ProjectBudget`; a 1F budget entity would collide with it (§20.4.D). The rate
source and budget model are research **R-17** and ownership escalation **E-5**.

**Context-health/checkpoint half — recommendation (a) is WITHDRAWN, and 1F-5 is RECLASSIFIED
(not blocked).** The CLM specification exists (v1.1.0) and answers this directly.

- **The band vocabulary now exists and is CLM-owned** (CLM §4.7, NORMATIVE CLM-S5): `safe`,
  `elevated`, `critical`, `uncertain`, `blocked`, `not_measured`, `stale`. DESIGN-001 CX-2
  refused to invent one; the CLM supplies it.
- **The numbers are neither the CLM's nor 1F's.** CLM §4.8 (NORMATIVE CLM-S9) splits ownership
  explicitly: the CLM owns the signal set, band names, semantics, and scoring function *shape*;
  **weights, numeric thresholds, floor values, and the sampling interval are Founder/Governance
  versioned policy**, because a threshold decides when work halts and that is a risk-posture
  decision; **1F and Design own rendering only.** Every constant ships `provisional: true` until
  Founder-approved, and every band derived from an unapproved policy carries the flag, so no
  consumer can present an unapproved threshold as a governed verdict.
- **1F-5 is a rendering item** wiring the `PublicContextHealth` projection and
  `ContextCheckpoint` records. **It designs no domain model and creates no entity.**

**The surface still renders dark, and the CLM landing does not change that.** The CLM states it
itself: Phase-1 deterministic agents (ADR-0001 D4) produce no context, so *"any claim that CLM
delivery lights up View 12 would be false, and 1F should not plan"* on it. **E-4 is narrowed,
not closed:** the vocabulary question is answered; **threshold-policy approval remains a live
Founder decision** (CLM-S10). **Decision owner: Founder**, on policy only.

### Q-5 — Authentication approach, and does it override "additive only"?

Adding authentication changes the behavior of existing public routes, which every prior
sprint's plan forbade. This is a deliberate, required deviation. Also to decide: mechanism
(single shared credential, passkey/WebAuthn, or a hosted identity provider).

**Correction — PENDING CROSS-WORKSTREAM REVIEW.** §10.1's finding that no authentication
exists is **accurate for the 1E baseline and for every merged branch**, and it stands. But
the same unmerged branch as Q-1 is titled *"...and auth infrastructure"* and adds
`lib/supabase/middleware.ts` and `lib/supabase/server.ts` — the conventional Supabase SSR
session shape. **TO BE VERIFIED AFTER SPRINT 1E:** what that middleware actually enforces,
whether it covers the `/api/dev-hq/*` routes, and whether it survived the 1D/1E route
additions (which were authored after it and are certainly not covered by it).

**Revised recommendation:** decide Q-5 **jointly with Q-1**, because adopting the 1C-B branch
would likely settle both at once, and adopting a different auth mechanism while later merging
Supabase auth would mean building authentication twice. If the branch is not adopted for 1F,
prefer a passkey or single strong credential with a proper session — a one-principal system
does not need an identity provider. **Either way, SEC-1…SEC-14 are the acceptance bar and do
not change. Decision owner: Founder**, coordinated with the persistence workstream.

### Q-6 — Scorecards: 1F or Phase 2?

**CORRECTED at reconciliation — see §3.1.** The two ADRs do not agree with each other:
ADR-0001 **D8** defers scorecards to **Phase 2**; ADR-0002 **D-E6/E9** defers them to
**Sprint 1F**. ADR-0002 is later and cites ADR-0001 as authority, but never states that it
supersedes D8 — so precedence is genuinely ambiguous. A third position exists in DESIGN-001
(its assumption A4 treats the scorecard domain as inside 1F's approved scope).

Three documents, two answers. This workstream's position — scorecards belong to **2D/2E** and
1F ships Stage-1 operational views only — is reached independently by the Phase 2 workstream
(its C-3/NEW-1) and endorsed by the governance workstream (its §4.8/B-6). **Three independent
concurrences are evidence, not authority.** Under AGENT-001 an employee *"must escalate rather
than choose an unauthorized interpretation"*, and no workstream may overrule an approved ADR.
**Escalated as E-1. Decision owner: Founder.** If resolved to Phase 2, ADR-0002 D-E6/E9
requires an amendment so permanent history does not carry the contradiction.

### Q-7 — Live transport: SSE, WebSocket, or tuned polling?

3-second full-snapshot polling is wrong for a phone (battery, data, latency). SSE is the
lightest fit for one-directional updates and works through most proxies; WebSocket is more
capable and more operationally involved; scoped polling with ETags is the smallest change.
Constrained by Q-1: a serverless deployment makes long-lived connections difficult.
**Recommendation: SSE with automatic polling fallback (F-11).** **Decision owner:** Lead
Software Engineer under ADR-0003, with the Founder informed.

### Q-8 — Do notification and session events share the audit `Event` stream?

The stream is capped at 200 entries and feeds the audit timeline. Adding delivery receipts
would evict execution history — precisely the loss §7.4 already flags. **Recommendation:
separate stream.**

**REVISED at reconciliation — this is no longer a Lead Software Engineer decision.** Phase 2
candidate ADR **#12 (canonical event and metric model)** is marked **Blocking** and owns
*"event vocabulary, schema evolution, idempotent ingestion, rollup strategy, retention,
traceability."* A 1F decision to mint a second event stream would pre-empt exactly that ADR.
Research **R-02** (Rank A) is the anchor. **Q-8 is folded into E-3 and escalated. Decision
owner: Founder + Phase 2**, informed by R-02. The recommendation stands as a recommendation;
this workstream no longer claims authority to take it.

### Q-9 — New dependencies.

1D and 1E added zero, deliberately. 1F needs at minimum an auth mechanism, a Web Push
implementation, and a DOM test environment. Each needs explicit approval, per AGENT.md's
escalation requirement for *"a new paid service or major dependency."* **Decision owner:
Founder.**

## 20.2 Risks

| # | Risk | Impact | Likelihood | Mitigation |
| --- | --- | --- | --- | --- |
| **R-1** | **Sprint size.** Twenty-three items spanning auth, PWA, push, conversation, four new domain areas, twelve screens, and net-new test infrastructure. Larger than 1D and 1E combined. | High — partial delivery, or delivery with thin validation | **High** | **Recommend splitting: 1F-a** = decisions + timeline + read surface + auth + shell + inbox + decision detail (the §19.3 critical path — J-1 and J-2 working end to end); **1F-b** = the remaining views, conversation, cost/context/checkpoints, PWA/push polish. Founder decision. |
| **R-2** | **Fabricated-looking placeholders.** Four scope items (cost, budget, context health, checkpoints) have no data. The pressure to show *something* rather than "Not recorded" is real and would violate the repository's core honesty rule. | **Severe** — destroys the trust the interface exists to create | Medium | AC-19 makes plausible placeholders a failure. §6.4 makes explicit absence the house style. Q-4 resolves the underlying gap. |
| **R-3** | **Deploying without auth.** A phone-accessible build with the current routes publishes the Founder's approval authority. | **Severe** | Low if planned, **high if the sprint is rushed** | 1F-6 and 1F-7 are Phase B, before any surface. G-4 is a blocking gate. AC-8 is per-route, not sampled. |
| **R-4** | **Simulated agents cannot produce the operational data the scope asks for.** ADR-0001 D4's deterministic agents have no context window and no cost. | Medium — J-7 and J-8 land empty | **High** | Q-4 option (a): build the plumbing, render honest absence. Set the expectation before implementation, not at review. |
| **R-5** | **Timeline truncation at 200 events** silently produces an incomplete audit history — the exact opposite of what ADR-0002 E5 requires. | High | **High at any real volume** | AC-4. Resolve in 1F-1 by scoping, partitioning, or explicit truncation rendering. |
| **R-6** | **Memory store cannot back a hosted PWA** (Q-1). Discovered late, this invalidates Phase C. | **Severe** | Medium | Q-1 resolved in 1F-0, before anything depends on it. |
| **R-7** | **Building on an unapproved 1E tree.** The remediation patches touch the exact files the read-model reads, and add the events the status-reason field needs. | Medium — rework | Medium | D-1. Re-verify against the approved baseline at the start of each Phase-A item. |
| **R-8** | **Untestable UI.** No component test can run and there is no Playwright config; a UI sprint could reach review with no behavioral evidence. | High | Medium | **1F-19a** at the front of Phase D; **1F-19b** after surfaces stabilize (§20.4.E reconciles this plan's "pull it early" with research R-22's "sequence it after stabilization" — they concern different layers). |
| **R-9** | **Prompt injection through the conversation surface.** Task descriptions, review findings, and evidence summaries are attacker-influenced text in a real deployment. | **Severe** if commands execute on inference | Medium | SEC-12, AC-20, and the structured-command recommendation in Q-2. |
| **R-10** | **NB-1 replay defect meets fast mobile flows.** Duplicate POSTs are likely, not rare, and the defect re-applies superseded decisions. | High — wrong task state after a Founder decision | **High** once fast flows ship | 1F-7 sequenced before 1F-13. SEC-7, AC-9. |
| **R-11** | **Push notification fatigue.** Notifying on everything trains the Founder to ignore the channel that J-1 depends on. | Medium — the primary journey silently stops working | Medium | Notification policy in 1F-10: notify only on Founder-actionable transitions (new escalation, new actionable approval). Everything else is in-app only. Founder-configurable in Settings. |
| **R-12** | **Scope creep from "Mission Control Lite."** "Lite" is in the sprint name; the canonical scope is not lite. | Medium | Medium | §3's explicit out-of-scope list, and **G-3**'s scope-enforcement mandate (the Architecture review; re-lettered at the correction pass). |
| **R-13** | **Reviewing twelve screens at the end** compresses G-1/**G-2**/G-5 into a rubber stamp (G-2 re-lettered at the correction pass; the Independent Code Review gate is meant). | Medium — quality gates in name only | Medium | Review per phase, not per sprint. G-1 before implementation. §16.2. |
| **R-14x** | **Web Push may be unavailable on the Founder's actual device.** Research R-14 names iOS Safari's Web Push support *"the decisive constraint"* and states its alternative 1 — installable PWA, notify **and** resolve — *"may be ruled out entirely; the item must be allowed to conclude that."* That alternative is journey **J-1**, this sprint's headline. | **High — invalidates the primary journey, AC-11, and AC-12** | **Unknown until R-14 reports** | R-14 is Rank A and gates 1F-0. AC-11/AC-12/J-1 are recorded as **contingent** (§20.4.E). Fallback: J-1 degrades to notify-on-open. **This plan does not assume Web Push works.** |
| **R-15x** | **1F creates records that candidate ADR #7 (scope key) and #12 (event model) will later have to retrofit.** Phase 2 names this its R-3/R-5 retrofit risk and says scope-keying *"must happen at 2B and not after… unscoped corpora"* exist. | Medium–High | Medium | §20.4.D removes the budget and checkpoint entities from 1F entirely; only the push-subscription and delivery records remain exposed, and their disposition is escalated as **E-3**. |
| **R-16x** | **Two named specialist documents do not exist** — the CLM specification and a governance planning document. 1F-5 has no upstream contract, and three governance carry-forwards in 1F-0 have no owner. | Medium — 1F-0 cannot fully close | **Confirmed, not speculative** | 1F-5 reduced to a dark surface (E-4). Governance carry-forwards recorded as I-11 awaiting an owner. |

## 20.3 Founder decisions required, consolidated

| # | Decision | Blocks | Recommendation |
| --- | --- | --- | --- |
| 1 | Approve or split the sprint scope (R-1) | Everything | **Split into 1F-a / 1F-b** |
| 2 | Q-1 deployment and persistence target | Phases B–E | Single long-lived process, memory, trusted network; persistence as its own sprint |
| 3 | Q-2 conversation architecture | 1F-18 | Hybrid: grounded Q&A + structured confirmed commands |
| 4 | Q-3 roadmap / sprint / release — **narrowed at reconciliation to E-7** | 1F-16 | Render all three from planning/process documents badged `preview` per DESIGN-001 D16/D17; **create no entity**. Open part is E-7 (may plans be UI data sources?) |
| 5 | Q-4 cost / context / checkpoints — **split at reconciliation** | 1F-4, 1F-5, 1F-17 | Cost: capture plumbing only, **no budget entity**. Context/checkpoints: **dark surface only**, domain work blocked on the absent CLM contract (E-4) |
| 6 | Q-5 authentication approach and the additive-only deviation | 1F-6 | Passkey or single strong credential + session |
| 7 | Q-6 scorecards in or out (governing-document conflict) | §3.1, ADR-0002 | Out of 1F; amend ADR-0002 |
| 8 | Q-9 new dependencies | 1F-6, 1F-10, 1F-19a | Approve the three named |
| 9 | D-1 Sprint 1E remediation disposition | 1F-3, 1F-12, 1F-15 | Approve; it is a prerequisite for honest status reasons |
| 10 | Confirm both review gates run **before** commit, per the 1E corrective action | §16.2 | Confirm; no pre-authorized exception. **Partly answered 2026-07-26:** the Founder fixed the permanent order — Independent Code Review → Architecture Review → Founder Approval → Protected Baseline (§16.1). The *before-commit* requirement itself is still the confirmation asked for here |
| **11** | **E-1 — scorecards: 1F or 2D/2E?** ADR-0001 D8 and ADR-0002 D-E6 disagree, verified at HEAD. Phase 2 raises the same as its NEW-1. **One decision settles both plans.** | The 1F/2D boundary | 2D/2E — the position this workstream and Phase 2 reached independently. Requires an ADR-0002 amendment either way |
| **12** | **E-3 — may 1F create the push-subscription and notification-delivery records before candidate ADRs #7 (scope key) and #12 (event model)?** | 1F-10 | Option (b): create with a recorded backfill obligation. Founder + Phase 2 decide |
| **13** | **E-7 — may `docs/plans/` prose and `RELEASE_PROCESS.md` be UI data sources?** | 1F-16 (roadmap, sprint, release views) | Yes, badged `preview`; fallback specified by DESIGN-001 if declined |
| **14** | **Accept that AC-11, AC-12, and journey J-1 are contingent on research R-14**, which may conclude Web Push is unavailable on the Founder's device | The sprint's headline journey | Accept the contingency; do not plan as though push is guaranteed |
| **15** | **Assign an owner for the CLM contract (E-4) and the governance carry-forwards (I-11)** — both named workstreams produced no document | 1F-5; 1F-0 closure | Assign, or accept 1F-5 as a dark surface and 1F-0 as closing with the carry-forwards open |
| **16** | ~~**Assign ADR numbers centrally.**~~ **DECIDED by the Founder, 2026-07-26 — no longer open.** **ADR numbers are assigned centrally. A specialist may propose an ADR *subject* but must not reserve or claim a number.** | Permanent history | **Recorded, not recommended.** This is the position all three workstreams had already reached (R-A4, §20.4.I), so nothing here is reversed by it. **Consequence for this document:** its ADR-0003 claim is withdrawn — see the Authority line. It now proposes the *subject* (deployment target, persistence, transport, authentication; §20 Q-1) and every remaining `ADR-0003` string names that subject pending central assignment. The negative-outcome-representation ADR (#17 below) was already proposed without a number and is unaffected |
| **17** | **Approve a second ADR before or during 1F: negative-outcome representation** (throw vs. absorb; the two new event types; the six emitting sites). Raised by the ISSUE_MATRIX Part 1 and by governance §6.1 — *"the rule spans four services and currently lives in an untracked file"* | **D-1**, and therefore 1F-3, 1F-12, 1F-15 | Approve. This is the same decision as D-1, and §7.3's status-reason derivation cannot be honest without it |
| **18** | **Approve the CLM threshold policy** (weights, numeric thresholds, floor values, sampling interval). CLM-S9 assigns these to Founder/Governance, not to the CLM or 1F; CLM-S10 marks every constant `provisional: true` until approved | 1F-5's rendering fidelity | Approve or defer knowingly — until then 1F must render bands flagged provisional |

## 20.4 Cross-workstream reconciliation — re-derived at HEAD `357f03b`, re-confirmed at HEAD `6301c06`

**Supersedes the 0.1.0 version of this section in full.** Version 0.1.0 compared this plan
against a **641-line mid-write draft** of the Phase 2 plan and a **367-line draft** of the
design specification. Both were complete when this section was written (3,749 and 3,701
lines). The Phase 2 plan raised this exact staleness as its conflict **C-5** and asked for the
re-derivation; this section is that answer. Nothing from the 0.1.0 divergence list is carried
forward unexamined.

> **Anchor discipline (correction pass, 2026-07-26).** The heading deliberately keeps **two**
> anchors. `357f03b` is where this section was **re-derived** and that fact does not change.
> `6301c06` is where it was **re-confirmed**: the five intervening commits are documentation-
> only and touched no source, config, or ADR (see the header block for the exact commit range
> and diffstat). **Re-confirmed is not re-derived.** In particular, this section was derived
> against **DESIGN-001 v1.0.0 (3,701 lines)** and the then-current Phase 2 plan (3,749 lines);
> DESIGN-001 has since reached **v1.1.0** with a **v1.2.0 correction in flight**, and the peer
> planning documents are untracked working-tree files that their owners continue to revise.
> Every R-A, E-, I- and C- item below therefore rests on the versions named where they are
> named, and a further re-derivation against the final peer versions is **owed and not done**
> — it is carried as **§22.6 item 1** and is the same ask governance recorded as **GQ-2 / X-11**.

### 20.4.A Resolved within Sprint 1F planning authority

These were open questions addressed to this workstream by name. Each is answered here because
it is an engineering-scope decision about 1F's own deliverables. **None expands 1F scope; all
four confirm work already in this plan's §7.2, §18, and §3.1.**

| # | Question, and who asked | **Resolution** | Basis |
| --- | --- | --- | --- |
| **R-A1** | DESIGN-001 **OQ-1 / SF-2 / Q2** and its §14.7 item 3: *"Will Sprint 1F expose an `AgentAssignment` projection?"* | **YES.** 1F exposes a `PublicAgentAssignment` projection following the `PublicReview` precedent — secrets excluded by construction via the `?: never` restatement, not a bare `Omit`. | Already this plan's **D-A** (§7.2) and inside **1F-1**. It is the 1E-9 *"Mission Control data exposure"* remainder, which PE-2 deferred to 1F as approved scope — so this is delivering deferred scope, not adding new scope. **Consequence for DESIGN-001:** the `—` / "not exposed to the browser" fallbacks in Views 4, 5, and 6 (~6 fields) are **not needed**; wait reason W5 and the timeline's dispatch/claim entries are backed. |
| **R-A2** | DESIGN-001 **OQ-2 / SF-1 / Q3** and its §14.7 item 4: *"Does 1F deliver the timeline read-model, or only the panel?"* | **BOTH.** The read-model is **1F-1**; the panel is **1F-14**. | PE-2 deferred *both* 1E-8 (read-model) and the 1E-9 remainder to 1F as approved scope. **Consequence for DESIGN-001:** View 5 badges **`live`**, not `derived`, and drops the client-merge disclosure. Its `derived` fallback is not exercised. **Consequence for Phase 2:** precondition **P-6** is discharged by 1F-1 + 1F-2. |
| **R-A3** | DESIGN-001 **C1 / FI-1…FI-6 / Q1**: *"Who owns the navigation shell, status vocabulary, truth model, decision flow, and component inventory?"* | **DESIGN-001 owns all five.** This plan's §5 and §6 are withdrawn as competing definitions. 1F-11 implements DESIGN-001 §3, §3.4, §6.3, and §7; 1F-13 implements §11; every view item implements its §5 view spec including the per-view prohibited-behavior subsections. | AGENT-001 § Department Boundaries: *"Design defines the approved user experience. Engineering decides how approved requirements are implemented."* Deciding otherwise would be this workstream overriding another department's authority, which AGENT-001 prohibits. **Note on C1's underlying fear:** DESIGN-001 worried that a *separate* "Founder Interface UX design" workstream might also define a shell. The Integration Coordinator's own workstream list names **one** combined *"Mission Control / Founder Interface design"* workstream, which suggests C1 is moot — but **this workstream cannot confirm that and does not decide it.** Escalated as Q-INT-1. |
| **R-A4** | Phase 2 **C-2**: ADR number collision — 1F claims ADR-0003; Phase 2 assumed numbering from ADR-0003. | **SUPERSEDED by Founder decision, 2026-07-26: ADR numbers are assigned centrally; a specialist may propose a subject but must not reserve or claim a number.** The collision is therefore resolved by removing both claims rather than by allocating between them. **1F withdraws its ADR-0003 claim** and proposes only the *subject* — deployment target, persistence, transport, authentication. What this workstream had resolved (1F retains ADR-0003, Phase 2 numbers from ADR-0004) is recorded as the prior position and is no longer this document's claim. | Phase 2 yielded explicitly, governance yielded explicitly, and **all three plans had independently recommended exactly the rule the Founder has now made**. This workstream never claimed numbering authority beyond releasing the conflict, and now claims no number at all. |

### 20.4.B Escalated — not decided by this workstream

| # | Item | Why this workstream will not decide it | Owner |
| --- | --- | --- | --- |
| **E-1** | **Scorecards: Sprint 1F or Phase 2 2D/2E?** | **Two approved ADRs disagree, VERIFIED at HEAD.** ADR-0001 **D8**: *"Scorecards: deferred to Phase 2… unless they become required for Phase 1 acceptance."* ADR-0002 line 215 (**D-E6**): *"Scorecards and analytics are deferred to **Sprint 1F**."* ADR-0002 line 343 repeats it. ADR-0002 is the later ADR and cites ADR-0001 as authority, but **does not state that it supersedes D8** — so precedence is genuinely ambiguous, not merely unread. Under AGENT-001, an employee *"must escalate rather than choose an unauthorized interpretation."* **Concurrence recorded:** this workstream (§3.1, Q-6) and the Phase 2 workstream (its C-3) independently reached the *same* position — scorecards belong to **2D/2E**, and 1F ships Stage-1 operational views only. Two independent agreements are evidence, **not authority**. Phase 2 states it *"will not overrule"* ADR-0002; neither will this plan. | **Founder** (= Phase 2 NEW-1, answering its Q-3 to this workstream) |
| **E-2** | Persistence and deployment target | Routed out of 1F in 0.1.0 and still routed out. It is Phase 2 **P-1 / D-P1** and research **R-08**. 1F states a consumer interface only (I-1). | **Founder** + persistence workstream |
| **E-3** | Canonical event vocabulary and the scope-key contract | See §20.4.D. Candidate ADRs **#12** and **#7**, both marked **Blocking** by Phase 2. 1F must not pre-empt either. | **Founder** + Phase 2 |
| **E-4** | **NARROWED.** Context-health band vocabulary — **resolved**; numeric thresholds — **open** | The CLM spec (v1.1.0 §4.7, CLM-S5) supplies the vocabulary DESIGN-001 CX-2 refused to invent. But CLM §4.8 (CLM-S9) assigns **weights, thresholds, floor values, and sampling interval to Founder/Governance as versioned policy**, because a threshold decides when work halts. All CLM constants ship `provisional: true` until approved (CLM-S10). 1F renders only. | **Founder** (threshold policy only) |
| **E-5** | Cost instrumentation ownership | DESIGN-001 **OQ-6 / RB-1**: *"Nothing in the repository owns it, and it is not in 1F scope."* Research **R-17** (Rank B) is the anchor. This plan's 1F-4 is scoped as *capture plumbing*, not as claiming ownership of the cost program. | **Founder** + Director of Operations |
| **E-6** | Whether DESIGN-001 §2 (truth model), §7.10 (forbidden vocabulary), and §11 (decision flow) become **governed standards** | Cross-cutting product-values decision. **The governance workstream document now exists** (`GOVERNANCE_UPDATE_PLAN.md`) and is the correct home for this routing. | **Director of Operations** |
| **E-7** | Whether planning documents (`docs/plans/`) and `RELEASE_PROCESS.md` may be **UI data sources** | DESIGN-001 **C6 / C7** — View 3 and View 15 read prose documents as content. This creates a coupling between document structure and rendered UI that the documentation workstream may reject. Affects 1F-16's feasibility directly. | **Director of Operations** + Founder |

### 20.4.C Required unavailable states — reconciled and adopted

The Integration Coordinator asked for explicit reconciliation of the roadmap, release,
notification, cost, and context-health unavailable states. **This plan adopts DESIGN-001's
treatment wholesale.** It is better than the options 0.1.0 offered, and this workstream
withdraws its competing recommendations.

DESIGN-001 **D5** ships Views 12 (Context Health) and 13 (Budget & Cost) as *first-class,
visibly **dark** surfaces* with an explicit reason and a "what would light this up" data
contract, rather than omitting them — *"An omitted question reads as unaskable; a dark one
reads as unanswered, which is the truth and is itself actionable."* **D6** makes **Empty
(dark)** and **Empty (true)** separate states with separate visual languages, because
*"nothing is failing"* and *"we don't measure failure"* are opposite messages. **D4** renders
Unknown as `—` with a mandatory reason and **never `0`**, because *"zero is a measurement."*

| Surface | Backing data (VERIFIED at HEAD) | Adopted state | Engineering obligation in 1F |
| --- | --- | --- | --- |
| **Roadmap / sprint** | No entity. No store collection. No API. | DESIGN-001 **D16**: three-column plan / gaps / recorded reconciliation, sourced from planning documents, badged `preview`, with a **hard prohibition on burndown, velocity, and projected dates**, and reconciliation **suppressed while `degraded`**. | 1F-16 renders it. **No `Sprint` or `Roadmap` entity is created.** Feasibility depends on E-7. |
| **Release** | No entity. `RELEASE_PROCESS.md` and `VERSIONING_POLICY.md` are prose. `sprint-1e-baseline` is a descriptive tag, not a release. | DESIGN-001 **D17**: three-value gate vocabulary with **no "Passed"** value — *"Evidence recorded"* is the strongest honest claim, because Dev HQ records no gate satisfaction. | 1F-16 renders it. **No `Release` entity is created.** Feasibility depends on E-7. |
| **Cost / budget** | `usage: null` unconditionally at `agent-execution-service.ts:81`. No cost field, no budget entity, no rate source. | Dark surface with the §13.6 data contract. **The UI will not hardcode prices** (RB-1). | 1F-4 builds *capture plumbing* only. Rate source, budget entity, and currency convention are **E-5**, gated on research **R-17**. |
| **Context health / checkpoints** | Nothing. Simulated agents (ADR-0001 D4) have no context window and produce no checkpoints. | Dark surface. **No bands, no thresholds, no health verdict** — CX-2. | **1F-5 is BLOCKED** pending a CLM contract that does not exist. See the revised Q-4. |
| **Notification delivery** | No record type. | DESIGN-001 **§8.6 delivery-honesty rule** and its forbidden-vocabulary list: a bell strongly implies delivery, so the absence of delivery records must be disclosed on the bell and the view. | 1F-10. **But the delivery-record entity is schema work — see §20.4.D.** |
| **Task dependencies / blockers** | `listDependencies` returns `[]` unconditionally (`dev-task-repository.ts:96`). | DESIGN-001 wait reason **W6** only; no "blocked by <task>" claim. | This plan's **D-K** is **withdrawn from 1F scope** — it was never requested by Design (SF-6: *"Not requested as 1F scope"*) and instrumenting dependencies is not a Mission Control deliverable. §7.3's blockers rule renders the honest residual only. |

**Binding consequence for §14 acceptance.** AC-19 already fails a plausible-looking
placeholder. It is extended by DESIGN-001 **D4** (`—` with a reason, never `0`) and **D3**
(a projection may never be counted in a headline metric, coloured with a state colour,
notified on, or used to gate an action). **AC-2 and AC-19 are tested against those rules.**

### 20.4.D Canonical event and scope-key contracts required before schema work

Reconciled per the Integration Coordinator's item 8. **This is a newly identified constraint
that 0.1.0 did not carry, and it changes 1F's sequencing.**

Phase 2 §2.7 marks two candidate ADRs **Blocking before Phase 2 implementation**:

- **#7 — Project isolation and the scoping key model.** Defines the canonical `ScopeKey`
  tuple (`organizationId`, `tenantId?`, `projectId`, `repositoryId?`, `environmentId?`).
  Phase 2 §4.5 states: *"every existing record type gains its `ScopeKey` fields"* at 2B, and
  that this *"must happen at 2B and not after 2C/2E/2F have created unscoped corpora"* (risk
  R-3).
- **#12 — Canonical event and metric model.** Defines *"event vocabulary, schema evolution,
  idempotent ingestion, rollup strategy, retention, traceability."* Phase 2: deferring #7 or
  #12 *"is what produces the R-3 and R-5 retrofits."*

**Assessment of 1F against these contracts:**

| 1F output | Creates records? | Scope-key / event exposure | Disposition |
| --- | --- | --- | --- |
| 1F-1 timeline read-model, 1F-2 read surface, 1F-3 derived fields | **No** — purely derived, ADR-0002 E5 *"owns no source of truth"* | None. A derived read-model carries no schema and needs no backfill. | **Safe. Proceed.** |
| 1F-11…1F-17 UI surfaces | **No** | None | **Safe. Proceed.** |
| 1F-6 session record (**D-M**) | Yes | Infrastructure, not a work-management record; arguably out of scope-key scope | **Proceed**, but state the assumption |
| **1F-10 push subscription (D-I) and notification delivery record (D-J)** | **Yes** | **Exposed.** A delivery record is an *event-shaped* record referencing work-management entities. Under #12 it would need to conform to the canonical vocabulary; under #7 it would need a `ScopeKey`. | **Constrained — see below** |
| **1F-4 budget entity (D-F)** | **Yes** | **Exposed.** Phase 2 §4.5 already defines `ProjectBudget` (`projectId`, `period`, `tokenCeiling`, `costCeiling`, `concurrencyCeiling`, `consumed`, `arbitrationPriority`). **A 1F budget entity would collide with it.** | **Constrained — see below** |
| **1F-5 checkpoint (D-H)** | **No — CLM-owned** | None for 1F | **Resolved:** `ContextCheckpoint` belongs to the CLM (CLM-K7); 1F consumes a projection and creates nothing |

**Position taken within 1F planning authority:** 1F does **not** create the budget entity
(D-F) or the checkpoint entity (D-H) in this sprint. 1F-4 reduces to *usage/model/provider
capture on records that already exist* (populating the already-declared `AgentUsageMetadata`,
which needs no new entity), and the budget surface renders dark per §20.4.C. This is a
**reduction** of 1F scope, not an expansion, and it removes a guaranteed collision with Phase
2 `ProjectBudget`.

**Escalated, not decided (E-3):** whether 1F-10's push-subscription and delivery records may
be created before ADR #7 and #12 are approved. Three options for the Founder: **(a)** defer
1F-10's persisted records until #7/#12 land — safest, but delays the headline J-1 journey;
**(b)** create them with an explicit, recorded backfill obligation; **(c)** approve a minimal
scope-key and event-shape contract early, scoped to these two record types. **This
workstream's recommendation is (b)** — the two record types are small, infrastructure-flavored,
and their backfill is deterministic while the store is seeded with one project — **but the
decision is the Founder's with Phase 2, because it is exactly the R-3 retrofit risk Phase 2
names.** This also supersedes this plan's **Q-8** (see below).

### 20.4.E Research backlog dependencies — newly incorporated

`docs/research/RESEARCH_BACKLOG.md` anchors **eight** research items to this plan by item ID.
**Five are Rank A and explicitly stated as due *before 1F-0 closes*.** 0.1.0 did not carry
these; they are now a hard input to 1F-0.

| Research item | Rank | Anchored to | Effect on this plan |
| --- | --- | --- | --- |
| **R-08** Deployment, persistence, transport, rollback | **A — "highest-priority item in the backlog"** | Q-1, ADR-0003, D-2, D-7 | Q-1 cannot be answered without it. R-08 explicitly absorbs assessing the `feature/sprint-1c-b-supabase-persistence` branch. |
| **R-03** Authentication boundary model | **A** | 1F-6, §10, Q-5, D-6 | Q-5 cannot be answered without it. On the critical path. |
| **R-01** Model-run attribution and provenance record shape | **A** | 1F-4, §2.4, Q-4, D-5 | Defines the record shape 1F-4 populates. |
| **R-02** Observability backbone and event vocabulary | **A** | **D-1** (`execution.assignment_deferred`) | Feeds candidate ADR #12. Bears directly on §7.3's status-reason derivation. |
| **R-14** Mobile PWA and Web Push notification path | **A** | 1F-9, 1F-10, §2.5, D-6, D-7 | **See the material finding below.** |
| **R-07** Secrets and credential brokering | B | 1F-10 (VAPID), 1F-6 (session secret) | SEC-9 mechanism. |
| **R-17** Cost and budget | B | 1F-4, 1F-17, Q-4 | Rate source and budget model (E-5). |
| **R-22** Browser automation and UI test capability | B — *"during Sprint 1F"* | 1F-19a/b, 1F-20 | **See the testing split below.** |

**Material finding — R-14 may invalidate the sprint's headline journey.** R-14 states:
*"iOS Safari's Web Push support and its installation requirements are the decisive constraint
and must be verified against current documentation, not recalled,"* and under Risks:
*"iOS Web Push constraints may rule out alternative 1 entirely; the item must be allowed to
conclude that."* Alternative 1 is *installable PWA with Web Push, notify and resolve* — which
is exactly journey **J-1**, this plan's primary journey, and acceptance criteria **AC-11** and
**AC-12**.

**Adopted:** **AC-11 and AC-12 are contingent on R-14's finding, and J-1 is contingent with
them.** If R-14 concludes that Web Push is unavailable on the Founder's actual device and OS
version, 1F-10 changes shape or is withdrawn, and J-1 degrades to *notify-on-open* rather than
*notify-when-away*. **This plan does not assume Web Push works.** Recorded as risk R-14x.

**Adopted from DESIGN-001 RB-5 — no actionable push buttons.** Push payloads carry subject +
record id and **deep-link only**; a notification action button would bypass the §11.5
confirmation dialog and the freshness check. Compatible with AC-12's two-interactions target,
which counts interactions *after* the tap. Also adopted: R-14's requirement that the payload
distinguish all four escalation-origin presentations, so PE-3 is satisfied *in the
notification*, not only in the queue — R-14: *"A notification that conflates them is worse
than the queue doing so."*

**Testing infrastructure — reconciled tension.** This plan's §15.1 and risk R-8 argue the test
infrastructure must land **early**, because no `.tsx` test can run at all. R-22 argues the opposite for the
browser layer: *"Building a browser suite for a UI that Sprint 1F is about to change
substantially — sequence after 1F's surfaces stabilize, or target only stable panels."*
**Both are correct about different layers.** Resolved within 1F authority by splitting the
item:

- **1F-19a — component test infrastructure.** DOM environment for Vitest, `.tsx` collection,
  first component tests. **Lands at the front of Phase D**, before 1F-12. Without it every
  Phase-D item ships unverifiable.
- **1F-19b — browser and accessibility suite.** Playwright configuration, e2e specs, axe
  integration. **Lands after the Phase-D surfaces stabilize**, per R-22. R-22's recommended
  first step — *"configure Playwright and write one accessibility check against one existing
  Mission Control panel"* — may be run early against a **pre-existing** panel as a cost probe
  without waiting for 1F surfaces.

This preserves §15.1's constraint and R-22's sequencing warning without either overriding the
other. **§18's item list and §19.2's graph are updated accordingly.**

### 20.4.F Interfaces this workstream provides

| # | Provided | To | Contract |
| --- | --- | --- | --- |
| **I-7** | Execution timeline read-model (1F-1) + read surface (1F-2) | Phase 2 (**P-6**), DESIGN-001 (SF-1) | **Discharges P-6.** Derived, no new store, append-only, stable ordering. |
| **I-8** | Mission Control Stage-1 surface | Phase 2 **2D** (*"2D extends 1F's Mission Control"*) | Phase 2 §17.3 states: *"We defer to 1F on all Stage 1 Mission Control scope. 2D adds Stages 2–3 and must not restate or rebuild Stage 1."* **Accepted.** The shell, route tree, and decision-header component must be extensible without rewrite. Phase 2's **Q-4** asks DESIGN-001 whether the IA extends to Stage 2/3 — that is Design's to answer, not this workstream's. |
| **I-9** | `PublicAgentAssignment` projection (R-A1) | DESIGN-001 Views 4/5/6 | Follows the `PublicReview` `?: never` precedent. Removes ~6 `—` fallbacks. |
| **I-10** | Decision-field derivation (1F-3) | DESIGN-001, Phase 2 | `currentOwner`, `statusReason`, `nextGate`, `blockers`, with explicit-absence semantics per D4. |
| **I-11** | Governance carry-forward register | **Governance workstream** (`GOVERNANCE_UPDATE_PLAN.md`, now present) | Three items: ADR-0002 E5 amendment (its §6.2 carries it); the PE-1 Sprint 1E plan amendment scheduled *"at the start of Sprint 1F"*; and the missing handbooks/standards (1E notes §7 item 6, still OPEN). DESIGN-001 **I11**/**C8** raise the same gap independently. **Now owned; 1F-0 tracks rather than owns them.** |

### 20.4.G Findings adopted from other workstreams

DESIGN-001 §14.6 offers twelve verified findings. This workstream had independently verified
I1, I2, I3, I4, and I8. **Three were not in this plan and are adopted:**

- **I5 — `DevHqState.overview` is typed from `data/placeholders/mission-control.ts`.** A
  live-looking field carrying placeholder data. DESIGN-001 **D22** does not use it. **Adopted:
  1F-2 must either replace `overview` with live counters or mark it explicitly.** A
  placeholder-backed field on a state surface is precisely the hazard AC-19 exists to prevent.
- **I6 — `STAGE_INDEX.failed === -1`, so a technical failure records no stage**, and
  `percent: 0` is emitted beside failures, which reads as "not started". **Adopted into §7.3's
  status-reason rules and DESIGN-001 D23's no-progress-bar treatment.**
- **I7 — two independent bounded review counters exist** (iterations, 3; dispatch attempts,
  3). **Adopted: merging them anywhere destroys the exact distinction PE-3 preserves.**

### 20.4.H Divergence list — status after re-derivation

The 0.1.0 conflicts C-1…C-6 were derived against the 367-line design draft. Re-derived:

| 0.1.0 conflict | Status now |
| --- | --- |
| **C-1 conversation surface** | **STANDS, and is the most material open divergence.** DESIGN-001's completed 16-view inventory contains **no conversation view**; its only command affordance is the `⌘K` palette (§3.5), scoped to *"jump to any view or record by name or id"* — navigation, not commands. The canonical 1F scope names *"Founder conversation and command surface"* as its **first** item. **Escalated as Q-INT-2**; this plan's 1F-18 and Q-2 remain open pending it. |
| **C-2 URL scheme** | **RESOLVED** by R-A3. DESIGN-001 §3.4 governs. This plan's §6.3 is withdrawn. |
| **C-3 navigation model** | **RESOLVED** by R-A3. DESIGN-001 §3.1/§3.2 governs. |
| **C-4 screen count** | **RESOLVED** by R-A3. DESIGN-001's 16-view inventory governs. |
| **C-5 Simulation Lab** | **STANDS, narrowed.** ADR-0001 **D9** keeps the Simulation Lab permanent; DESIGN-001's navigation map does not place it. This is a genuine gap between an approved ADR and the design, not a preference. **Escalated as Q-INT-3.** 1F must not remove it (§3.3). |
| **C-6 standalone Tasks view** | **RESOLVED** by R-A3, in Design's favour. Tasks are reached via the Context Spine. |

### 20.4.I Late-arriving documents — CLM and governance

Both appeared during this reconciliation pass, after an earlier stage of it had verified them
absent. Read in full and reconciled here.

**Context Lifecycle Manager specification (v1.1.0, 3,002 lines).** Explicitly reconciled
against this plan. Its findings are **accepted in full**:

| CLM finding | This plan's disposition |
| --- | --- |
| **1F contains an internal contradiction about who designs context health** — §20.4 I-5 called 1F-5 a rendering item while §7.2 **D-H** called the checkpoint entity *"New domain entity"*. *"If both stand, 1F designs a context-health model and the CLM designs another — two sources of truth."* | **Accepted, corrected.** D-G reclassified to rendering + projection wiring; D-H reclassified to CLM-owned `ContextCheckpoint`; 1F-5 reclassified to a rendering item. §7.2 and §18 amended. |
| Band vocabulary is CLM-owned (CLM-S5) and now exists | Adopted; DESIGN-001 CX-2 is discharged |
| **Thresholds are Founder/Governance policy, not CLM's and not 1F's** (CLM-S9) | Adopted; E-4 narrowed to a threshold-policy decision |
| All constants ship `provisional: true` until Founder-approved (CLM-S10) | Adopted; 1F must render the provisional flag, never present an unapproved threshold as a governed verdict |
| Even with the CLM landed, **View 12 stays dark** — Phase-1 agents produce no context | Already this plan's position; now independently confirmed by the subsystem owner |

**Governance and documentation update plan (671 lines).** Its findings are **accepted in
full**:

| Governance finding | This plan's disposition |
| --- | --- |
| **Factual error:** this plan's §3.1/Q-6 claimed ADR-0001 D8 and ADR-0002 D-E6/E9 *both* place scorecards in 1F. **ADR-0001 D8 does the opposite.** *"A conclusion resting on a misquoted ADR cannot be approved as-is under GOV-001. Correction belongs to the 1F owner."* | **Accepted and corrected** in §3.1 and Q-6. The conclusion is unchanged; its basis is now accurate. This is the single substantive error found in this plan by any workstream. |
| Governance **yields ADR-0003** to 1F; recommends the Founder assign numbers centrally at authorization, never by a drafting workstream | Accepted; consistent with R-A4. Phase 2 also yielded. **All three workstreams now agree** — and **the Founder adopted the rule on 2026-07-26.** Governance's recommendation is now policy, so the yield is moot: 1F does not take the number it was yielded. See §20.3 #16 and R-A4. |
| A second ADR is needed before or during 1F: **negative-outcome representation** (throw/absorb, the two event types, six emitting sites) — *"the rule spans four services and currently lives in an untracked file"* | **Accepted and added.** This is the ISSUE_MATRIX Part 1 policy that **D-1** depends on. §7.3's status-reason derivation and S-11 read exactly those services. **Number not claimed** — which is now the required treatment for *every* ADR this plan proposes, per the Founder's 2026-07-26 central-assignment decision. |
| Scorecard conflict is a Founder decision (its B-6) | Concurs with E-1; now a **three-way concurrence** with Phase 2 |

### 20.4.J Convergences — independent agreement across workstreams

Recorded because independent agreement is evidence:

- **Honest absence over placeholders** — DESIGN-001 D4/D5/D6, this plan's AC-19/Q-4, and the
  research backlog's framing all reached it separately.
- **Scorecards belong to 2D/2E** — this plan and Phase 2 independently (E-1).
- **NB-1 must land before mobile decisions** — this plan (SEC-7, 1F-7), DESIGN-001 (§11.6
  refresh-only), and R-14 (*"must not proceed before NB-1 is fixed"*) independently.
- **No optimistic UI** — DESIGN-001 D13 verified both endpoint families already return
  `{ state }`; this plan's §9.1 forbade optimistic updates on authority actions independently.
- **Deep links must not redirect on a missing record** — DESIGN-001 §3.4, this plan's F-9.
- **PE-3 (`escalationReason` beside `origin`)** — discharged by DESIGN-001 D11, required by
  this plan's 1F-13, and reinforced by R-14 for the notification payload.

---

# 21. Definition of complete

Sprint 1F is complete when **all** of the following hold. Any item that does not hold is
recorded as deferred with an explicit Founder decision, in the manner Sprint 1E established
— *"deferred work is approved-absent, not missing"* — and never as silently incomplete.

## Scope

1. Every §2 scope item is delivered, or is explicitly deferred by a recorded Founder
   decision naming the reason and the destination sprint.
2. Nothing from §3 was built.
3. Every ASSUMPTION (A-1, A-2) is either confirmed or corrected in the completion notes.
4. Every question Q-1…Q-9 is resolved and recorded, with ADR-0003 approved and committed.

## Function

5. All twelve non-blocked screens (§5) render real data at 360 px and above.
6. All ten journeys (§4) are traversable, or their blockers are recorded.
7. J-1 completes in two interactions after the notification tap (AC-12).
8. The six-field decision header appears on every entity surface, with honest absences
   (AC-2).
9. The execution timeline is complete, ordered, derived, append-only, and truthful about any
   truncation (AC-3, AC-4).

## Correctness

10. AC-1…AC-20 all pass, each with the evidence §17 requires.
11. `npx tsc --noEmit`, `npx eslint .`, `npx vitest run`, `npx next build` — all exit 0, run
    against the final commit, with output recorded verbatim.
12. The founder-request suite passes unchanged; no public API shape regressed; the
    Simulation Lab behaves identically.
13. No secret, internal token, or callback capability appears in any browser-reachable
    payload, **verified by inspecting actual responses**.

## Security

14. Every public route requires authentication (AC-8), verified per route.
15. Every mutating route is idempotent under replay (AC-9).
16. CR-1 and NB-1 are resolved (AC-17).
17. G-4 security review passed with no unresolved blocker.

## Quality gates

18. G-1…G-6 all completed **before commit**, in the permanent review order recorded at §16.1
    — Independent Code Review → Architecture Review → Founder Approval → Protected Baseline —
    with reports committed under `agents/*/outputs/`. **The Sprint 1E sequencing exception is
    not repeated.**
19. Every non-blocking follow-up from every gate is recorded durably in the completion notes.
20. Accessibility: automated audits clean, keyboard traversal complete for J-1 and J-2,
    mobile screen-reader passes done and recorded.

## Record

21. `docs/plans/SPRINT_1F_COMPLETION_NOTES.md` exists and records: delivered vs deferred,
    both review verdicts, all follow-ups, all escalations, all evidence, **and an explicit
    section naming everything that was not verified.**
22. The Sprint 1E carry-forwards are closed: ADR-0002 E5 parenthetical amended, Sprint 1E
    plan amended for PE-1, PE-3 satisfied (`escalationReason` rendered beside `origin`).
23. The repository is in a maintainable state for the next owner, with no uncommitted
    implementation work and no undocumented assumption.

**What "complete" does not mean.** It does not mean every screen is beautiful, every
analytic exists, or every deferred capability landed. It means the Founder can see the truth
about the system from a phone, act on it in seconds, and trust that what is shown is what
was recorded — and that everything not delivered is written down.

---

# 22. COLLABORATION HANDOFF

**Status: specialist draft. Sprint 1F implementation-planning workstream. Planning only —
nothing here is approved, no implementation is authorized, and no code has been written.**

**Added at the correction pass (2026-07-26).** Every other specialist workstream carried a
handoff section and this one did not, which made its positions harder to consume than they
needed to be. **This section states nothing new.** Each entry is a restatement of a position
already recorded in §1–§21 with a pointer to where it is argued; where an entry looks like a
new decision, it is not — follow the pointer. Structure follows
`docs/plans/PHASE_2_PROGRAM_PLAN.md` §17 and `docs/plans/GOVERNANCE_UPDATE_PLAN.md` §10 so the
five handoffs can be read side by side.

## 22.1 Decisions made within this workstream's authority

| # | Decision | Where it is argued |
|---|---|---|
| **H-1** | **`AgentAssignment` is exposed as a `PublicAgentAssignment` projection**, secrets excluded by construction via the `?: never` restatement rather than a bare `Omit`, following the `PublicReview` precedent. | §7.2 **D-A**, §20.4.A **R-A1**, interface **I-9**. Delivering 1E-9's deferred remainder, not new scope |
| **H-2** | **1F delivers both the execution timeline read-model (1F-1) and the timeline panel (1F-14)**, not one or the other. | §20.4.A **R-A2**, interface **I-7**. PE-2 deferred both 1E-8 and the 1E-9 remainder to 1F |
| **H-3** | **DESIGN-001 owns the navigation shell, status vocabulary, truth model, decision flow, and component inventory.** This plan's §5 and §6 are **withdrawn as competing definitions** and retained only as engineering sizing input. | §"Cross-workstream boundaries", §20.4.A **R-A3**. Basis is AGENT-001 § Department Boundaries; deciding otherwise would override another department |
| **H-4** | **The ADR number collision is released.** **Superseded at the correction pass:** R-A4's allocation (1F keeps ADR-0003, Phase 2 numbers from ADR-0004) is replaced by the Founder's 2026-07-26 rule — **numbers are assigned centrally and this workstream claims none**, proposing only the subject. | Authority line, §20.3 #16, §20.4.A **R-A4**, §20.4.I |
| **H-5** | **Scope was reduced, never expanded, at reconciliation:** no budget entity, no checkpoint entity or context fields, task-dependency instrumentation withdrawn, no `Roadmap`/`Sprint`/`Release`/`WorkItem` entities created. | §7.2, §3, Approval block |
| **H-6** | **1F-5 (context health) is a rendering item only.** The `ContextCheckpoint` entity is **CLM-owned** and 1F consumes a projection. This corrected an internal contradiction the CLM caught between §20.4 I-5 and §7.2 D-H, **resolved in the CLM's favour**. | §7.2 **D-G/D-H**, §20.4.I |
| **H-7** | **Honest absence over placeholders.** A field with no recorded value renders "Not recorded" — never an em-dash, a guess, or a plausible default; and a surface with no data stays dark rather than simulating one. | §6.4, **AC-19**, §20.4.C |
| **H-8** | **No optimistic UI on authority actions.** Both endpoint families already return `{ state }`, so the surface renders what was recorded. | §9.1; independently reached by DESIGN-001 **D13** (§20.4.J) |
| **H-9** | **The two bounded review counters stay separate** — review iterations (cap 3) and dispatch attempts (cap 3). Merging them anywhere destroys the distinction PE-3 exists to preserve. | §20.4.G **I7** |
| **H-10** | **1F-0 is a hard gate: no implementation item starts until it closes**, and it cannot close until Q-1…Q-9, escalations E-1…E-7, and the five Rank-A research items (R-08, R-03, R-01, R-02, R-14) report — or the Founder accepts proceeding without them. | §18 Phase 0, §19.3 |
| **H-11** | **Both commit gates run before commit, and G-2 (Independent Code Review) runs before G-3 (Architecture Review).** The before-commit rule is Sprint 1E's §8 corrective action; the order is the Founder's 2026-07-26 permanent order. **Corrected at the correction pass** — 0.2.0 as first written had them reversed, which governance recorded as **X-2**. | §16.1, §16.2 |
| **H-12** | **1F does not interpret history.** No executive analytics, scorecards, trend reporting, or forecasting — 1F makes current state legible and actionable. | §1 Non-objective, §3.1 |

## 22.2 Assumptions

| # | Assumption | If wrong |
|---|---|---|
| **A-1** | Roadmap and sprint, if approved under Q-3, sit between Project and Task as grouping constructs and are the most natural future home for `WorkItem`. | ADR-0002 E8's hierarchy needs amending, which is an ADR-level decision and not this plan's to make (§6.2) |
| **A-2** | Next.js App Router file-based routing under `app/`, matching the existing convention; 1F introduces the §6.3 route tree over today's single `app/page.tsx`. | The route tree in §6.3 is re-planned; note §6.3 is in any case **withdrawn in favour of DESIGN-001 §3.4** per H-3 |
**A-1 and A-2 are this plan's only numbered assumptions; no new ones are introduced here.** Two
further standing conditions are restated because a handoff reader needs them, and they are
deliberately left unnumbered so they cannot be mistaken for new assumption IDs:

- **The whole TO BE VERIFIED AFTER SPRINT 1E class.** Sprint 1E remediation is in flight,
  unapproved, and touches the exact files every 1F status, event, and timeline surface reads.
  Every such item must be re-checked against the approved 1E baseline before the work item that
  depends on it starts. See also the **working-tree caveat** in the header block: in this
  working tree the remediation patches are *applied but uncommitted and unapproved*.
- **A-1 and A-2 must be confirmed or corrected in the completion notes**, never left implicit —
  §21 item 3.

## 22.3 Interfaces with other workstreams

| Workstream | This workstream provides | This workstream needs |
|---|---|---|
| **Mission Control / Founder Interface design (DESIGN-001)** | **I-9** `PublicAgentAssignment` projection (removes ~6 `—` fallbacks in Views 4/5/6 and backs wait reason W5); **I-7** timeline read-model (View 5 badges `live`, not `derived`); **I-10** decision-field derivation with explicit-absence semantics | Nothing blocking. **Design is authoritative on every user-facing surface** (H-3). Outstanding: whether DESIGN-001's inventory admits a conversation surface (**Q-INT-2**) and where the Simulation Lab sits (**Q-INT-3**) |
| **Phase 2 program planning** | **I-7 discharges precondition P-6**; **I-8** the Stage-1 Mission Control surface, whose shell, route tree, and decision-header component must extend without rewrite | A Founder ruling on **E-1** (scorecards: 1F or 2D/2E), which is Phase 2's **NEW-1** — one decision settles both plans. Candidate ADRs **#7** (scope key) and **#12** (event model), both Phase 2 **Blocking**, before any schema work (**E-3**) |
| **Persistence / deployment** | A consumer interface only — 1F states what it needs and does not choose the target | The **E-2** decision. It is Phase 2 **P-1 / D-P1** and research **R-08**, the highest-priority backlog item |
| **Context Lifecycle Manager (CLM)** | Rendering only, including the `provisional: true` flag surfaced honestly | The **threshold policy** (weights, numeric thresholds, floor values, sampling interval), which **CLM-S9 assigns to Founder/Governance — not to the CLM and not to 1F** (**E-4**). Band vocabulary is supplied and adopted |
| **Governance and documentation** | **I-11** the governance carry-forward register — ADR-0002 E5 amendment, the PE-1 Sprint 1E plan amendment, and the missing handbooks/standards. **1F-0 tracks these; it does not own them** | Closure of the missing handbooks and standards (**D-8**): `handbooks/INDEPENDENT_CODE_REVIEWER.md`, eight further agent handbooks, and `NAMING_STANDARD.md` / `LOGGING_STANDARD.md` / `ERROR_HANDLING_STANDARD.md`. **A review gate whose own standard is missing cannot certify against it** (§16.3). Also the routing of **E-6** |
| **Research backlog** | The work-item IDs the backlog anchors eight research items to | **The five Rank-A items due before 1F-0 closes** — R-08, R-03, R-01, R-02, R-14 — and **R-17** as the anchor for cost-instrumentation ownership (**E-5**) |

## 22.4 Questions for other specialists

**Q-INT-1, Q-INT-2, and Q-INT-3 are the escalations already raised in §20.4.A and §20.4.H and
are reproduced verbatim in substance. Q-INT-4…Q-INT-7 are new *labels* on questions this
document already asks elsewhere** — they extend the existing `Q-INT-n` sequence so every
cross-workstream question has one address. **No new question is introduced.**

| # | To | Question |
|---|---|---|
| **Q-INT-1** | Integration Coordinator | Is there **one** combined "Mission Control / Founder Interface design" workstream, or two? DESIGN-001's **C1** fears a second workstream also defining a shell. The coordinator's own list names one, which suggests C1 is moot — **but this workstream cannot confirm it and does not decide it** |
| **Q-INT-2** | DESIGN-001 owner + Founder | **The most material open divergence.** The canonical 1F scope names "Founder conversation and command surface" **first**; DESIGN-001's 16-view inventory contains **no conversation view**, and `⌘K` is scoped to navigation, not commands. Which governs? 1F-18 and Q-2 are open pending the answer |
| **Q-INT-3** | DESIGN-001 owner + Founder | ADR-0001 **D9** makes the Simulation Lab permanent; DESIGN-001's navigation map does not place it. This is a gap between an approved ADR and the design, not a preference. 1F must not remove it (§3.3) — where does it live? |
| **Q-INT-4** | Phase 2 owner | Confirm **I-8**'s extensibility contract is sufficient: that 2D can add Stages 2–3 without restating or rebuilding Stage 1, given the shell and decision header as scoped here |
| **Q-INT-5** | CLM owner + Founder | Until the threshold policy is approved, 1F renders bands **flagged provisional**. Is that the intended interim, or should the surface stay dark? |
| **Q-INT-6** | Governance owner | **X-2 is discharged** — §16.1's gate order is corrected to the Founder's permanent order (§16.1). Does that close **GQ-1**'s second half, given **X-1b** was already corrected in §3.1 and Q-6 at the reconciliation pass? |
| **Q-INT-7** | Governance owner + Founder | **E-7:** may `docs/plans/` prose and `RELEASE_PROCESS.md` be **UI data sources**? This couples document structure to rendered UI and decides 1F-16's feasibility |

## 22.5 Potential conflicts this workstream may create

| # | Conflict | Nature |
|---|---|---|
| **PC-1** | **Withdrawing §5 and §6 as definitions** while retaining their text could be read as this plan still defining screens and URLs. | It does not. §"Cross-workstream boundaries" states that where this plan and DESIGN-001 disagree on a user-facing surface, **this plan is wrong by construction**. The text is retained as sizing input only |
| **PC-2** | **Exposing `PublicAgentAssignment` (H-1)** removes fallbacks DESIGN-001 designed for, so a design revision is implied. | Recorded as a *consequence for DESIGN-001*, routed to Design, not decided here. Design may keep the fallbacks |
| **PC-3** | **Adopting DESIGN-001's unavailable-state treatment wholesale** means this plan discarded its own options mid-pass. | Deliberate and stated: the adopted treatment is better than what 0.1.0 offered. Anyone reading an intermediate version sees options this plan no longer proposes |
| **PC-4** | **Re-lettering the review gates** (G-2 ↔ G-3) breaks any external citation of "1F §16.1 G-2" written against 0.2.0 as first published. | Unavoidable if the Founder's permanent order is to read in order. The re-lettering is stated immediately above the §16.1 table, and the three internal cross-references (§19.1 D-8, §20.2 R-12, §20.2 R-13) were updated with the change flagged in place rather than silently |
| **PC-5** | **1F-0's gating on five Rank-A research items** could read as this workstream scheduling the research backlog. | It does not. The backlog itself states those items are due *"before 1F-0 closes"*; §18 carries that constraint, it does not impose one |
| **PC-6** | **§20.4 was derived against DESIGN-001 v1.0.0** and against untracked peer drafts that keep moving. | Disclosed at §20.4's anchor note rather than papered over. A further re-derivation is owed — §22.6 item 1 |

## 22.6 Items deliberately left unresolved

1. **Re-derivation of §20.4 against the final peer versions.** It was derived against DESIGN-001
   **v1.0.0**; DESIGN-001 is now **v1.1.0** with a **v1.2.0 correction in flight**, and the peer
   planning documents are untracked and still moving. Governance asks for exactly this as
   **GQ-2 / X-11**. **Owed and not done.**
2. **Every open Founder decision in §20.3.** Seventeen of the eighteen rows remain open; only
   row 16 (central ADR numbering) is decided. **Nothing in the correction pass resolved any
   other row**, and this workstream does not resolve them.
3. **All seven escalations E-1…E-7** (§20.4.B) — scorecards, persistence/deployment, the
   canonical event and scope-key contracts, the context-health threshold policy, cost
   instrumentation ownership, promotion of the truth model to a governed standard, and planning
   documents as UI data sources.
4. **The conversation-surface divergence C-1** (Q-INT-2) and **the Simulation Lab gap C-5**
   (Q-INT-3). Both **STAND**; neither is decided here.
5. **Q-INT-1's workstream-count question.** Raised, not answered, because it is the
   coordinator's to answer.
6. **The ADR-0002 E5 parenthetical, the PE-1 Sprint 1E plan amendment, and the missing
   handbooks and standards.** Owned by governance and the Director of Operations; 1F-0 tracks
   them (**I-11**, **D-8**).
7. **Sprint 1E remediation disposition (D-1).** Awaiting Founder approval, and it blocks 1F-3.
   The header's working-tree caveat records that the patches are applied locally but
   **uncommitted and unapproved** — that changes nothing about D-1's status.
8. **Whether AC-11, AC-12, and journey J-1 survive research R-14**, which may conclude Web Push
   is unavailable on the Founder's device. The contingency is stated, not resolved.

## 22.7 Recommended changes if another specialist disagrees

| If … | Then |
|---|---|
| …**DESIGN-001 keeps the `—` / "not exposed" fallbacks in Views 4/5/6** | Nothing in this plan breaks. **I-9** simply makes them unreachable. Design's call, not this workstream's |
| …**the Founder places the conversation surface outside 1F** (Q-INT-2) | 1F-18 and Q-2 close as out-of-scope and the sprint's first canonical scope item is formally cut. This plan does **not** assume that outcome |
| …**the Founder places scorecards in 1F** (E-1) | §3.1's exclusion reverses and **ADR-0001 D8** needs the amendment instead of ADR-0002. Governance reached the same conditional independently |
| …**the persistence workstream chooses a target that is not a single long-lived process** | Q-1's recommendation falls, and Phases B–E re-plan around it. 1F states a consumer interface only and does not defend the recommendation |
| …**a reviewer prefers the old gate order** (Architecture before Independent Code Review) | It cannot simply stand. Governance's **X-2** records that the old order was inverted against GOV-001, and the Founder has now fixed the permanent order. Changing it back requires a Founder decision, not a plan edit |
| …**the CLM threshold policy is deferred rather than approved** | 1F renders bands **flagged provisional** and never presents an unapproved threshold as a governed verdict (**CLM-S10**). That is already this plan's position |
| …**a reviewer judges 1F too large** | §20.3 #1 already recommends **splitting into 1F-a / 1F-b**. The split is the recommended path, not a concession |
| …**the ADR subject proposed here is judged to belong in more than one ADR** | Split it. This workstream proposes a subject, not a number and not a document count (Founder decision, 2026-07-26) |

## 22.8 Handoff summary

> **SPRINT-1F-PLAN v0.2.0 — Sprint 1F implementation planning, reconciled against five peer
> specialist documents, then corrected. Planning only; nothing approved; no code written; not
> committed.**
>
> **Four things were resolved inside this workstream's authority** (§20.4.A): the
> `AgentAssignment` projection is exposed, 1F delivers both the timeline read-model and the
> panel, **DESIGN-001 owns every user-facing surface**, and the ADR number collision is
> released — now by claiming **no number at all**, per the Founder's central-assignment rule.
>
> **Seven things were escalated rather than decided** (§20.4.B), and **seventeen of eighteen
> §20.3 Founder decisions remain open.** The most material single divergence is **C-1**: the
> canonical 1F scope names a Founder conversation and command surface first; DESIGN-001's
> completed view inventory contains none.
>
> **Two peer workstreams found errors in this plan and both are corrected:** governance caught
> **ADR-0001 D8 misquoted** (X-1b), and the CLM caught an **internal contradiction over who
> designs context health**, resolved in the CLM's favour. The correction pass adds a third:
> **governance's X-2, the inverted gate order, is now discharged.**
>
> **Scope only ever moved down.** Budget entity, checkpoint entity, context fields,
> task-dependency instrumentation, and roadmap/sprint/release entities were all removed at
> reconciliation. Nothing was added.
>
> **What is owed and not done:** §20.4 has not been re-derived against DESIGN-001 v1.1.0/v1.2.0
> or the current peer drafts (**GQ-2 / X-11**), and **nothing marked TO BE VERIFIED AFTER
> SPRINT 1E has been re-checked** — Sprint 1E remediation is applied in this working tree but
> **uncommitted and unapproved**, and **D-1 is still open**.
>
> **Next owner:** the Founder, for §20.3 and E-1…E-7; the Integration Coordinator, for
> Q-INT-1…Q-INT-7. **No implementation item may start until 1F-0 closes.**

---

# Appendix A — Verified baseline inventory

Confirmed by direct inspection at `validation/sprint-1e-overnight-2026-07-26` @ `057e12c`.
**Re-verify against the approved Sprint 1E baseline before implementation
(TO BE VERIFIED AFTER SPRINT 1E).**

## Present

**Stack:** Next.js 16.2.11 · React 19.2.4 · TypeScript 5 · Tailwind 4 · Vitest 4 ·
`@trigger.dev/sdk` 4.5.7. Four runtime dependencies total.

**Domain** (`types/domain/`): `Project`, `Task`, `TaskDependency`, `Workflow`, `Agent`,
`Execution` (+`ExecutionRouting`, `ExecutionRequest`), `AgentAssignment`, `Evidence`,
`Review`/`PublicReview`/`ReviewFinding`, `Approval`, `Escalation`, `Event`,
`ConnectedService`, `WorkflowRunRecord`, `AgentResult`/`AgentUsageMetadata`/`AgentHealth`.

**Contracts** (`types/contracts/`): agent-provider, approval-manager, escalation-store,
event-logger, evidence-store, execution-runner, project-repository, review-store,
state-reader, task-repository, workflow-engine, workflow-run-repository.

**Services** (`lib/dev-hq/`): `agent-execution-service`, `execution-manager` (pure,
purity pinned by `review-scope.test.ts`), `review-service`, `escalation-service`,
`founder-request-service`, `agent-registry`, `actions` (server actions),
`internal-guard`/`internal-headers`, `store` (in-memory), `review-projection`.

**Trigger tasks** (`trigger/`): `agent-execution`, `agent-review`, `execution-sweeper`,
`founder-request-workflow`, `hello-world`.

**UI** (`components/`): `dashboard/` (MissionControl, MissionControlOverview, TopBar,
AgentStatusRail, DispatchAgentPanel, FounderRequestForm) · `mission-control/` (12 panels) ·
`workflow/` (8 simulation components) · `ui/primitives`.

**View layer** (`lib/mission-control/`): `view-model.ts` (`CommandCenterModel`),
`useDevHqState.ts` (3 s poll, 4 feed states), `status.ts`, `pending-dispatch.ts`.

**Constants** (`lib/dev-hq/constants.ts`): `MAX_EXECUTION_ATTEMPTS` 3 ·
`EXECUTION_LEASE_TTL_MS` 60 000 · `AGENT_HEALTH_STALE_AFTER_MS` 60 000 ·
`EXECUTION_CLAIM_DEADLINE_MS` 120 000 · `MAX_REVIEW_ITERATIONS` 3 ·
`REVIEW_RESPONSE_DEADLINE_MS` 120 000 · `MAX_REVIEW_DISPATCH_ATTEMPTS` 3 ·
`DEFAULT_REVIEW_POLICY` `"basic"` · `EXECUTION_SWEEP_CRON` `"* * * * *"` ·
10 execution/review/escalation event types.

**Validation baseline:** 22 test files, 317 tests passing; `tsc`, `eslint`, `next build`
(22 routes) all green at the Sprint 1E baseline.

## Absent (net-new for 1F)

Authentication · authorization · session · middleware · CSRF · rate limiting ·
web app manifest · service worker · push · VAPID · viewport/theme-color metadata ·
execution timeline read-model · `AgentAssignment` on `DevHqState` · derived owner/reason/
gate/blockers · persisted usage, cost, budget, model, provider · context health ·
checkpoints · `Roadmap`/`Sprint`/`Release`/`WorkItem` entities · conversation or command
surface · SSE/WebSocket transport · state pagination or filtering ·
functional `listDependencies` (stub returns `[]`) · DOM test environment ·
Playwright configuration · any e2e test.

---

# Appendix B — Carried forward from Sprint 1E

Sourced from `docs/plans/SPRINT_1E_COMPLETION_NOTES.md` and
`docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md`.

| Source | Item | 1F disposition |
| --- | --- | --- |
| 1E-8 (deferred, PE-2) | Execution timeline and audit history | **1F-1** |
| 1E-9 (partial, PE-2) | Mission Control data exposure | **1F-2** |
| PE-2 follow-up | Amend ADR-0002 E5 parenthetical | **1F-0** |
| PE-1 follow-up | Amend the Sprint 1E plan for the numbering conflict, *"at the start of Sprint 1F"* | **1F-0** |
| PE-3 | Render `Review.escalationReason` beside `Escalation.origin` at 1F design time | **1F-13** |
| §7 item 1 / CR-1 | CSPRNG callback token — required before non-developer use | **1F-7** |
| §7 item 2 / NB-1 | Replayed escalation resolution overwrites newer task state — required before non-developer use | **1F-7** |
| §7 item 6 | Missing handbooks and standards — OPEN, Director of Operations | **D-8** |
| §7 item 10 | Sweep cost vs the 50 s sweeper TTL; silent failure mode | Monitor; not a 1F deliverable |
| §7 item 11 | Unbounded `eventKeys`/`evidenceUris` vs the 200-event cap | **§7.4 / AC-4** |
| §7 item 12 / CR-11 | `recordFindings` ordering — Phase 2 gate | Phase 2 |
| §8 corrective action | Both review gates before commit | **§16.2 — hard rule.** Order fixed by Founder decision 2026-07-26: Independent Code Review → Architecture Review → Founder Approval → Protected Baseline (§16.1) |
| Deferred 1E-7 bullet | Operator-facing `reviewPolicy` override | Not in 1F unless the Founder adds it |
| ISSUE_MATRIX AR2-1/X1/X3/X4, F1, X2/X2b, optional F4 | Sprint 1E remediation, awaiting approval | **D-1 — blocks 1F-3** |
| ADR-0001 D8 / ADR-0002 D-E6 | Scorecards nominally in 1F | **Q-6 — recommended out; conflicts with the canonical scope** |

## Appendix B.1 — Sprint 1E remediation follow-ups (Founder decision, 2026-07-26)

**RECORD ONLY.** Added to the follow-up register by explicit Founder decision; **none is
implemented, authorized for implementation, or scoped into 1F by this entry.** Each arose
from the two independent code reviews of the Sprint 1E remediation candidate and was ruled
non-blocking there.

| # | Item | Source | Why it was deferred rather than fixed |
| --- | --- | --- | --- |
| **1E-F1** | Author `ERROR_HANDLING_STANDARD.md` | CR-FULL-1E OBSERVATION-2, CR-FINAL-1E OBSERVATION-1 | The negative-outcome policy — *"Throw only when the caller could not have been right. Absorb when the caller was right and the world moved."* — now governs every throw-versus-absorb decision in the execution layer, four commits, two reviewers' verdicts and a Phase 2 constraint. It lives **only in a review artifact**. `standards/` has no `ERROR_HANDLING`, `NAMING` or `LOGGING` standard. Both reviewers independently recommended promoting it. |
| **1E-F2** | Improve the `claimLost` event message wording | CR-FULL-1E MINOR-1, CR-FINAL-1E MINOR-6 | `ensureAssignmentDeferredEvent`'s sibling `ensureClaimLostEvent` asserts *"another attempt held the agent"*, but its guard is `availability !== "available"`, which admits `offline` and `waiting`. **Demonstrated false by probe** with an offline agent and no second attempt in existence. Not reachable in production today — but protected only by an invariant held two modules away (`agent-registry.ts:26-28`, `execution-manager.ts:520`) that no comment at the emission site references, and a `waiting` agent **is already seeded** (`data/placeholders/mission-control.ts:242`). Recommended fix: state the observed fact, not the inferred cause. |
| **1E-F3** | AR2-6 `ExecutionRunner` port revision | AR-1E ruling, carried by both reviewers | `claimExecution`'s return type, `heartbeat`'s missing parameter, and required `assignmentId` on the three callback handlers — as **one** revision. AR-1E ruled the current shape *"SHIP AS SPECIFIED"* and deferred the contract fix. |
| **1E-F4** | MAJOR-1 test-coverage gap — the X4 guard | CR-FINAL-1E MAJOR-1 | Replacing `if (reason !== "no_agent_available") return;` with `void reason;` leaves **all tests, `tsc` and `eslint` green** (mutation M2). The specification spends 24 lines of Amendment 1 arguing this guard must never be deleted, explicitly anticipating that it *"reads like dead weight to a later simplification pass"* — and **the comment is its entire defence**. Recommended: one ~5-line test asserting `ensureAssignmentDeferredEvent(execution, "execution_not_queued")` emits nothing. |
| **1E-F5** | MAJOR-3 test-coverage gap — unpinned emission sites | CR-FINAL-1E MAJOR-3, CR-FULL-1E MINOR-3 | Three of six deferral emission sites can be **deleted outright with all four gates green** (mutations M11/M13/M14): `agent-execution-service.ts:926`, `review-service.ts:635`, `escalation-service.ts:293`. The latter two are reached by `await import(...)`, which `tsc` resolves statically but no test executes — so a path-alias or module-boundary change breaks them at runtime with a green suite. `ISSUE_MATRIX.md:89` marks the escalation-revise site **"highest priority"** as the founder-facing path. **Reviewers disagreed on severity** (MAJOR vs MINOR); recorded unresolved for Architecture Review. |

**MAJOR-2 is not in this register — it was fixed before Architecture Review** by Founder
decision, and is recorded here only so a reader does not look for it: the X3 regression test
had stopped detecting X3 because the X1 follow-up's emission shared its dedupe key within a
single sweep. A new order-based test now pins the reclaim loop's emission specifically, and
its negative control is recorded with the candidate.

---

# Approval

**Prepared by:** Lead Software Engineer (AGENT-006), Sprint 1F implementation-planning workstream
**Date:** 2026-07-26
**Version:** 0.2.0 — reconciliation pass complete; documentation correction pass applied 2026-07-26 (see the header **Version note (0.2.0 — correction pass)**). No scope, position, or open Founder decision changed by that pass.
**Status:** SPECIALIST DRAFT — reconciled, awaiting Founder decisions and integration approval. Not final, not approved. No implementation authorized.

**Reconciliation record.** Re-verified at HEAD `357f03b` and **re-confirmed at HEAD `6301c06`**
(correction pass, 2026-07-26); no source, config, or ADR changed in committed history since the
`057e12c` baseline — the five commits in `357f03b..6301c06` are documentation-only, evidenced by
the commit range and diffstat recorded in the header block, and **nothing was re-run to reach
that conclusion**. Reconciled in full against all five peer documents **at the versions named
here**: DESIGN-001 **v1.0.0** (3,701 lines; the reference is re-keyed to **v1.1.0** with a
**v1.2.0 correction in flight** — see §"Cross-workstream boundaries"), `PHASE_2_PROGRAM_PLAN.md`
(3,749), `RESEARCH_BACKLOG.md` (2,620), `CONTEXT_LIFECYCLE_MANAGER_SPEC.md` **v1.1.0** (3,002 —
current, no change needed), and `GOVERNANCE_UPDATE_PLAN.md` (671). The last two appeared mid-pass
after an earlier stage had verified them absent; that absence finding is recorded and
**withdrawn** rather than silently overwritten. §20.4 was re-derived in full, discharging
Phase 2's conflict **C-5** — **and is owed one further re-derivation** against the final peer
versions (§22.6 item 1).

**One substantive error was found in this plan by a peer workstream and is corrected here:**
governance §4.8 caught that v0.1.0 claimed ADR-0001 D8 and ADR-0002 D-E6/E9 *both* place
scorecards in Sprint 1F. **ADR-0001 D8 says the opposite.** Corrected in §3.1 and Q-6; the
conclusion is unchanged, its basis is now accurate. The CLM additionally caught an **internal
contradiction** between §20.4 I-5 and §7.2 D-H over who designs context health — corrected in
the CLM's favour (§20.4.I).

**Resolved within this workstream's authority (§20.4.A):** `AgentAssignment` projection = yes ·
timeline read-model + panel = both · DESIGN-001 owns shell, vocabulary, truth model, decision
flow, and component inventory · the ADR number collision released. **Superseded in part at the
correction pass:** R-A4 had 1F retain ADR-0003 with Phase 2 numbering from ADR-0004; the
Founder's 2026-07-26 central-assignment decision replaces that allocation — **1F claims no
number** and proposes only the subject (deployment, persistence, transport, authentication).

**Escalated, not decided (§20.4.B):** E-1 scorecards · E-2 persistence/deployment · E-3
canonical event and scope-key contracts · E-4 context-health vocabulary · E-5 cost ownership ·
E-6 promotion of the truth model to a governed standard · E-7 planning documents as UI data
sources.

**Scope reduced at reconciliation, never expanded:** budget entity removed (Phase 2 collision) ·
checkpoint entity and context fields removed (absent CLM contract) · task-dependency
instrumentation withdrawn · roadmap/sprint/release entities not created.
**Required before implementation:** Founder decisions §20.3 — **17 of the 18 rows remain open**
(row 16, central ADR numbering, was decided on 2026-07-26; the "10 items" stated here before the
correction pass predated rows 11–18 and was already stale) · the deployment/persistence/
transport/authentication ADR approved, **number assigned centrally** · Sprint 1E remediation
disposition (D-1) · work item 1F-0 closed.
