# Phase 1 Mission Control Lite — Founder Experience UX Specification

**Document ID:** DESIGN-001

**Version:** 1.2.0 — source-inventory correction applied (see §15.18 and the v1.2.0 record note)

**Status:** Reconciled specialist draft — awaiting Founder review and Product Owner acceptance

**Date:** 2026-07-26 (v1.0.0 authored and v1.1.0 reconciled the same day)

**Author role:** Claude Design Engineer (AGENT-004 / ROLE-014)

**Authority:** CONST-001, GOV-001, AGENT-001, ADR-0001, ADR-0002, STANDARD-011 (Accessibility), STANDARD-012 (Documentation)

**Applies to:** Savrio Dev HQ Mission Control, Phase 1 ("Mission Control Lite"), Founder as sole user

---

# 0. How To Read This Document

## 0.1 What this is

A complete UX and product design specification for the Phase 1 Founder experience: navigation, screens, states, interaction behavior, vocabulary, notification rules, mobile behavior, accessibility requirements, and the Founder approval flow.

## 0.2 What this is not, by instruction

- **Not code.** No implementation, no commits, no file changes outside this document.
- **Not a library selection.** No component library, charting library, state library, or styling decision is made here. Where a behavior needs a technical mechanism, this document states the *behavior* and leaves the mechanism to the Lead Software Engineer.
- **Not a scope expansion.** Sprint 1F's approved scope is recorded in `docs/plans/SPRINT_1E_COMPLETION_NOTES.md` §6.2 and the Founder decisions at PE-2/PE-3. This document designs the Founder experience; §2.5 marks precisely which parts of that experience are backed by instrumented data today and which are designed-but-dark. **Nothing in §2.5 marked "Not instrumented" is proposed as Sprint 1F work.** Each is a designed surface that renders an honest unavailable state until the Founder authorizes its instrumentation in a later sprint.
- **Not validated by users.** There is one user and no usability testing has been performed. Every claim in this document about what the Founder will find clear is a design judgment, not a research finding. See §13.
- **Not the final integrated plan.** This is one specialist's draft within a coordinated planning effort. **v1.1.0 has performed the cross-document reconciliation that v1.0.0 deferred** — see **§15 Cross-Document Reconciliation Register** and **§16 FINAL INTEGRATION HANDOFF**. §14 COLLABORATION HANDOFF is preserved as the v1.0.0 record; where §14 and §15 disagree, **§15 is authoritative**. **Amended at v1.2.0:** §14 is preserved *except* for the phantom-workstream items struck in place under its correction banner. Nothing in §14 was rewritten, re-argued, or improved with hindsight — items whose counterparty does not exist are marked void and left legible. The reason for the exception is recorded at §14's banner and §15.18.
- **Reconciled against all five named documents:** `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` (**SPRINT-1F-PLAN v0.2.0** — re-keyed at v1.2.0, see §15.18), `docs/plans/PHASE_2_PROGRAM_PLAN.md` (PLAN-P2-001), `docs/research/RESEARCH_BACKLOG.md`, `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0) with `CLM_COLLABORATION_HANDOFF.md`, and `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (GOV-PLAN-001 v0.3.0).
- **Sequencing note, recorded because it affects what the register says.** The CLM specification and the governance plan **appeared in the working tree mid-pass**, after §15.0 had recorded them as absent. Both were then read and reconciled: the CLM findings are at **§15.16** and the governance findings at **§15.17**, and §15.7 is superseded by §15.16. The CLM spec had itself already read and reconciled against v1.0.0 of this document, so several of its sections answer this document's §12.6 / CX-1…CX-6 directly.
- **v1.2.0 is a factual correction, not a redesign.** No view, state, vocabulary, prohibition, or accessibility requirement changed. It (a) **withdraws the phantom-workstream conflict** — there is no separate "Founder Interface UX design" workstream, and §14's fear of one propagated into another document's contradiction register; (b) **routes this document's two governance questions to the vehicles that carry them** (GOV-PLAN-001 **G-8** and **O-1**), correcting two statements in §15.17 and §12.1 that said no such vehicle existed; (c) **re-keys the Sprint 1F reconciliation to v0.2.0**; and (d) **re-states the §16.9 verdict on corrected premises**. See **§15.18**.

## 0.3 The single governing principle

> Mission Control is an instrument panel, not a narrative. A founder acts on it. Therefore every pixel either reports something the system actually recorded, or it says out loud that it does not know.

Everything in §2 exists to enforce that sentence, and every view's "prohibited misleading behavior" subsection is that sentence applied locally.

## 0.4 Terminology note

"Sprint" in this document means the Founder's planning unit shown in the Roadmap view. **Dev HQ has no `Sprint` domain entity** (verified: `types/domain/` contains no sprint type). Sprint is a documentation-level concept in `docs/plans/`. §2.5 and View 3 handle this honestly rather than inventing one.

---

# 1. The Thirteen Questions — Traceability

The Founder's thirteen questions are the acceptance criteria for this design. Each must be answerable **without navigation** from Founder Home, and answerable **in depth** from a dedicated view.

| # | Question | Answered on Home by | Depth view | Backing data status (§2.5) |
| --- | --- | --- | --- | --- |
| 1 | What is Dev HQ doing now? | Posture Banner + Now Strip | 4 Live Work Queue | **Instrumented** |
| 2 | Which project, sprint, task, execution are active? | Context Spine + Now cards | 2 Project Overview, 3 Roadmap, 5 Execution Timeline | **Partial** — project/task/execution instrumented; sprint is not |
| 3 | Who owns each item? | Owner chip on every Now card | 6 Agent & Human Queue | **Partial** — agent ownership instrumented; human ownership is founder-only |
| 4 | What is waiting and why? | Waiting Board (grouped by reason) | 4 Live Work Queue | **Partial** — five of six wait reasons instrumented; dependency blocking is not |
| 5 | What failed? | Failure Strip | 5 Execution Timeline, 11 Blockers & Escalations | **Instrumented** |
| 6 | What is retrying? | Retry counters on Failure Strip | 5 Execution Timeline | **Partial** — attempt counter instrumented; assignment lease not yet exposed to the browser |
| 7 | What needs Founder attention? | Decision Inbox Preview (top of page) | 10 Founder Decision Inbox | **Instrumented** |
| 8 | What evidence proves progress? | Latest Evidence rail | 8 Evidence Viewer | **Instrumented** |
| 9 | What reviews are pending? | Review counter in Now Strip | 7 Review Center | **Instrumented** |
| 10 | What decisions are reserved for the Founder? | Reserved Decisions card | 10 Founder Decision Inbox §11 | **Instrumented** (approvals, escalations) |
| 11 | What is the current cost and budget state? | Budget tile | 13 Budget & Cost | **Not instrumented** — renders unavailable state |
| 12 | Is context health safe? | Context tile | 12 Context Health | **Not instrumented** — renders unavailable state |
| 13 | What is the next gate? | Next Gate card | 15 Release View, 3 Roadmap | **Partial** — approval gates instrumented; release gates are not |

**Design rule derived from this table:** questions 11 and 12 get a *permanent, first-class, visibly empty* home on Founder Home. They are not hidden until instrumented. A missing tile teaches the Founder that the question is unaskable; an explicitly unavailable tile teaches them that the question is unanswered — which is the truth, and is itself actionable.

---

# 2. Truth Model

This is the most load-bearing section. Every view depends on it.

## 2.1 Provenance ladder (existing vocabulary — preserved)

The codebase already defines a four-value provenance vocabulary (`DataSource` in `lib/mission-control/status.ts`, rendered by `DataSourceBadge`). This design **adopts it unchanged** and extends its application from panels to individual values.

| Token | Label | Meaning | Visual |
| --- | --- | --- | --- |
| `live` | **Live** | Read directly from the Dev HQ state API. | Green dot + label |
| `derived` | **Derived** | Computed in the browser from live state by a deterministic rule. | Blue dot + label |
| `preview` | **Preview** | Static placeholder. Not operational data. | Amber dot + label |
| `unavailable` | **Not instrumented** | No backend capability records this yet. | Grey dot + label |

**Rules.**

- Every panel carries a provenance badge in its header. Non-negotiable; this is existing product behavior and must not regress.
- Where a panel mixes provenance, the badge shows the **weakest** value present and the panel must additionally badge the individual weaker values inline. A panel is never allowed to launder a `preview` value under a `live` header.
- `preview` must not appear anywhere in the Phase 1 Founder experience except a clearly labelled design-preview mode. `data/placeholders/mission-control.ts` supplies `overview` today; §2.5 records that dependency and View 1 states how Home computes its counters instead.

## 2.2 Claim classes (new — required by the prediction/forecast instruction)

Provenance says *where a number came from*. It does not say *what kind of claim the number makes*. A forecast computed deterministically from live state is still `derived`, yet it is categorically different from a recorded fact. Phase 1 therefore adds a second, orthogonal axis.

| Class | Symbol | Definition | May it be counted in a headline metric? | May it trigger a notification? | May it gate an action? |
| --- | --- | --- | --- | --- | --- |
| **Recorded** | none | A value read from a persisted record. `Execution.status`, `Review.status`, `Escalation.origin`. | Yes | Yes | Yes |
| **Derived** | none | A deterministic function of recorded values, with no assumption about the future or about unrecorded state. Counts, groupings, elapsed time. | Yes | Yes | Yes |
| **Projection** | `≈` | A statement about the future or about unobserved state. ETAs, "likely to exhaust retries", burn-rate extrapolation, "expected completion". | **No** | **No** | **No** |
| **Recommendation** | `▸` | A suggested course of action authored by the system or an agent. "Recommend abandon." | **No** | Only as an attachment to a Recorded item's notification, never on its own | **No** — may pre-focus a control, never pre-select one |
| **Unknown** | `—` | The system does not record this. Distinct from zero. | **No** — rendered as **"Not recorded"**, never as `0` | No | No, and must disable dependent actions with a stated reason |

**Reconciliation note (v1.1.0).** SPRINT-1F-PLAN §6.4 requires that an absent value render as an explicit absence — *"never as a guess, an em-dash, or a plausible default."* v1.0.0 specified the glyph `—` plus a mandatory reason. The two intents agree (a bare glyph is prohibited by both) but the presentations conflict. **Resolved in favour of the stricter reading:** the words **"Not recorded"** — or a more specific reason — are the primary rendered content of every Unknown. The `—` glyph may appear **only** as a leading marker beside those words, or alone inside a dense tabular cell where the column header carries "Not recorded" and the cell's accessible name begins `Not recorded:`. A cell that shows `—` with no such carrier is a defect. This supersedes v1.0.0's D4 wording; the rule it protects is unchanged.

### 2.3 Visual encoding of claim classes

| Class | Border | Type treatment | Prefix | Required adjacent text |
| --- | --- | --- | --- | --- |
| Recorded / Derived | solid `--border` | regular, tabular numerals | none | none |
| Projection | **dashed** 1px | *italic* | `≈` | `Projection — not a commitment.` in the container, once |
| Recommendation | dashed 1px, left accent bar | regular | `▸` | `Recommendation — your decision.` plus the recommending actor's name |
| Unknown | solid, muted fill | muted | `—` **plus the words "Not recorded"** | one sentence saying what is not recorded and what would record it |

Additional hard rules:

1. **Never colour a projection with a state colour.** Projections render in `--text-dim` only. Green/amber/red are reserved for recorded state, so a red badge always means something actually went wrong.
2. **Never place a projection and a recorded value in the same visual slot.** A metric tile shows a recorded value; a projection appears in the tile's *hint* line, beneath, prefixed and italic.
3. **Screen readers must hear the class, not infer it from style.** Every projection has a visually hidden prefix "Projection:"; every recommendation "Recommendation:"; every unknown "Not recorded:". Italic and dashed borders convey nothing to a screen reader or to a Founder with reduced vision, so the class is always in the accessible name.
4. **A projection may never be the only content of a card.** It must sit beside the recorded facts it was computed from, so the Founder can dismiss it on sight.
5. **Phase 1 ships almost no projections.** The design permits them so the rules exist before they are needed. The only projections specified in Phase 1 are the deadline countdowns in §7.6 (claim deadline, lease expiry, review response deadline), which are projections because they extrapolate a configured TTL against a recorded timestamp and the process may already be dead. Everything else is Recorded, Derived, or Unknown.

## 2.4 Freshness and staleness model

Founder Home polls the state API every 3 seconds (`POLL_INTERVAL_MS`, existing) and retains the last good snapshot on failure, with `FeedStatus` of `initial | live | degraded | disconnected`. This design formalizes what the Founder sees for each.

| Feed status | Trigger (existing behavior) | Global treatment | Are actions enabled? |
| --- | --- | --- | --- |
| `initial` | no snapshot yet | Skeletons. No counters, no zeros. | No |
| `live` | last poll succeeded | Normal. `as of HH:MM:SS` in the command bar, updating. | Yes |
| `degraded` | 1–2 consecutive failures | **Amber Stale Ribbon** below the command bar: `Showing state as of 14:32:07 — last refresh failed 8s ago. Retrying.` Values keep rendering; the age counter runs. | Yes, with a warning in the confirm step (§11.7) |
| `disconnected` | ≥3 consecutive failures | **Red Stale Ribbon**, sticky, dismissible only for the session: `Not connected to Dev HQ. Everything below is a snapshot from 14:32:07 and may be wrong.` Posture becomes `unknown`. Content desaturates to 70% opacity. | **No — every mutating action disables**, with the reason stated on the control |

**Staleness rules that apply to every view:**

- Every view displays a single authoritative `as of` timestamp for its data, in the same place (top-right of the view header), as absolute local time plus relative age.
- Relative age is Derived, not a projection, and must degrade gracefully: `just now`, `12s ago`, `4m ago`, then absolute time beyond 1 hour.
- **A stale snapshot must never animate as if live.** All pulse animations (`StatusDot pulse`) stop on `degraded` and `disconnected`. A pulsing "Running" dot on a disconnected feed is a lie about the present tense.
- **Per-record staleness is separate from feed staleness.** A record can be fresh in the snapshot but describe a stalled process — a `running` execution whose `lastHeartbeatAt` is older than `AGENT_HEALTH_STALE_AFTER_MS`. That is not a stale-data problem; it is a recorded health problem and renders as **"Running · not reporting"** (§7.4), never as a feed warning.

## 2.5 Data availability register

**This table is the honesty backbone of the design.** It records, per Founder question, exactly what the delivered Sprint 1E baseline provides. Every "Not instrumented" row produces a designed-but-dark surface, not a fabricated one.

Verified against the working tree at `057e12c`.

| Capability the UX wants | Backing record | Status | Consequence for the design |
| --- | --- | --- | --- |
| Projects, tasks, executions, approvals, events, workflows, workflow runs, agents | `DevHqState` | **Available (live)** | Render normally |
| Evidence records | `DevHqState.evidence` | **Available (live)** | View 8 is fully functional |
| Escalations, incl. `origin` and `resolution` | `DevHqState.escalations` | **Available (live)** | View 11 is fully functional |
| Reviews and findings | `DevHqState.reviews` (`PublicReview`), `.reviewFindings` | **Available (live)** | View 7 is fully functional |
| `Review.escalationReason` (distinguishes "reviewer kept rejecting" from "reviewer never answered") | `PublicReview.escalationReason` | **Available (live)** | **Mandatory display** beside `Escalation.origin`, per Founder routing of PE-3 to 1F design time. Specified in View 11 §11.x and §7.5 |
| Retry attempt number and budget | `Execution.attempt`, `MAX_EXECUTION_ATTEMPTS = 3` | **Available (live/derived)** | "Attempt 2 of 3" renders as Recorded + Derived |
| Lease health, heartbeat freshness, claim deadline, dispatch confirmation | `AgentAssignment` (`leaseExpiresAt`, `lastHeartbeatAt`, `dispatchedAt`, `triggerRunId`) | **Persisted but NOT exposed to the browser** — `DevHqStoreData.agentAssignments` exists; `DevHqState` carries no assignments array | Views 4, 5, 6 specify the assignment-derived states and **must render them Unknown (`—`) until a read-model projection exists.** Adding that projection is an engineering decision for the Lead Software Engineer within 1E-9's "Mission Control data exposure"; this document does not authorize it, it declares the dependency (§12, OQ-1) |
| Merged execution timeline / audit stream | none — 1E-8 read-model does not exist | **Approved-deferred to Sprint 1F** (Founder decision, PE-2) | View 5 is the design for that panel. Until the read-model lands, View 5 renders from `events` + `executions` + `reviews` + `evidence` + `escalations` client-side and **must label the stream `derived` and disclose incompleteness** (next row) |
| Complete event history | `store.events` is capped at **200 records** (`lib/dev-hq/store.ts:226`) and the store is in-memory only | **Available but lossy and non-durable** | **Mandatory:** the timeline must render a terminal `Earlier activity not retained` marker whenever the event list is at cap, and every history view must state that history does not survive a Dev HQ restart. Silently showing 200 events as "the history" is prohibited (§5 View 5) |
| Task dependency blocking ("blocked by X") | `TaskDependency` type exists; `DevTaskRepository.listDependencies()` **returns `[]` unconditionally** (`lib/dev-hq/adapters/dev-task-repository.ts:94`) and `DevHqState` carries no dependencies | **Not instrumented** | "Blocked by dependency" is **not** a selectable wait reason in View 4. A `blocked` task with no other recorded reason renders **"Blocked · reason not recorded"** |
| Sprint / roadmap entity | none — no `Sprint` domain type | **Not instrumented** | View 3 renders the roadmap from documentation-declared sprints, badged `preview`, with an explicit statement that Dev HQ does not track sprint membership and cannot verify task-to-sprint mapping |
| Token/cost usage | `AgentUsageMetadata` exists on the `AgentResult` contract, but `agent-execution-service.ts:81` sets `usage: null` unconditionally, and no store field persists it | **Not instrumented** | View 13 renders the full unavailable state and names the three fields required to light it up |
| Context window health, compaction, OOM risk | none | **Not instrumented** | View 12 renders the full unavailable state |
| Release / version state | none — no release entity; `VERSIONING_POLICY.md` and `RELEASE_PROCESS.md` are process documents | **Not instrumented** | View 15 renders process-declared gates badged `preview` plus recorded evidence, and never claims a release status |
| Notifications | none — no notification record, no delivery channel | **Not instrumented** | View 14 is an in-session derived feed only. It must not claim any message was delivered anywhere (§8.6) |
| Human work queue | no human assignee field; `Task.assigneeAgentId` is agent-only. `FOUNDER_USER_ID` appears as project owner and approval decider | **Structurally agent-only** | View 6 shows an Agent lane (live) and a Founder lane containing exactly the items awaiting the Founder (derived from approvals + escalations). It must not imply other humans exist |
| Scorecards / aggregate agent performance | none — D-E6 deferred to Sprint 1F | **Approved-deferred** | Not designed here beyond a placeholder slot in View 6, so the later panel has a home |
| Overview counters | `DevHqState.overview` is typed from `data/placeholders/mission-control.ts` | **Preview** | Home **must not** use `overview`. Home counters are Derived from the live arrays (as `buildCommandCenterModel` already does). Specified in View 1 |

### 2.5.1 Reconciliation delta (v1.1.0) — status changes against the Sprint 1F plan

The table above records what the *baseline* provides and stands unchanged as a statement of verified repository truth. This delta records what the **Sprint 1F plan proposes to add**, which changes several rows from "open dependency" to "planned, pending a Founder decision". Nothing here is authorized; every row names its gate.

| Capability | v1.0.0 position | 1F plan position | Reconciled UX position |
| --- | --- | --- | --- |
| `AgentAssignment` exposure | Open dependency (OQ-1 / SF-2), designed with an Unknown fallback | **D-A: required addition** — *"Expose a projection, not the raw record… apply the `PublicReview` precedent"*, for S-9 | **Resolved.** OQ-1 is answered: the 1F plan already carries it and independently chose the `PublicReview` precedent I asked for. Views 4/5/6 keep the Unknown fallback as a **contingency**, not the expected state. Wait reason W5 becomes renderable |
| Execution timeline read-model | Approved-deferred; View 5 client-derived, badged `derived` | **D-B / 1F-1**, and Phase 2 precondition **P-6** is satisfied by it (1F plan I-7) | **Resolved.** View 5 badges `live` when 1F-1 lands, `derived` until then. Both states already specified; no redesign |
| Event retention (200 cap) | Mandatory truncation disclosure | **§7.4 + R-5 + AC-4:** 1F must *"raise/scope the cap, partition events per entity, or render the truncation explicitly"* | **Converged.** My `RetentionMarker` is the third option and satisfies AC-4 regardless of which is chosen. The disclosure stays mandatory until the cap is provably removed |
| Task dependency blocking | Not instrumented; wait reason W6 is the honest terminus | **D-K:** stub confirmed; blockers from dependencies *"unavailable until D-K"* | **Unchanged.** W6 stands. If D-K lands, W6 splits (§15.5) |
| Sprint / roadmap | `preview`, sourced from planning documents | **Q-3 blocking.** The plan **withdrew its own recommendation in favour of this approach** as *"a fourth option for Q-3… better than any of this plan's three, because it delivers the view without inventing an entity"* | **Converged, pending Founder Q-3.** View 3 is unchanged and is now the plan's recommendation too |
| Release | `preview` + recorded facts; three-value gate vocabulary, no "Passed" | **Q-3 recommends deferring release entirely** (cut S-13 from 1F) | **Deferred to the Founder.** View 15 is specified either way: if S-13 is cut, the view is not built and its honesty constraints carry forward to 1G (§15.6) |
| Cost / budget | Not instrumented; dark surface with a data contract | **Q-4 recommendation (a):** build the capture plumbing, render honest absence. `D-D` usage capture, `D-F` budget entity. Research **R-17** rank B: *"visibility half during 1F"* | **Converged.** My dark state is the correct Phase-1 rendering; my two partial light-up states (usage-without-rates, rates-without-budget) are exactly what (a) produces. **I do not define the cost calculation, the rate source, or the budget record shape** |
| Context health | Not instrumented; dark surface, thresholds explicitly refused | **Q-4** same treatment; `D-G` needs *"the executing agent to report context utilization"*; **R-4:** simulated agents *"have no context window"*. CLM is placed in **1G/1H**, not 1F | **Unchanged and reinforced.** Dark state is correct for 1F. Threshold and band definition remain **out of UX scope** and now have no owning document in the tree (§15.7) |
| Checkpoints | **Not covered by v1.0.0** | `D-H` new entity; canonical 1F scope §2.4; **R-4** says simulations produce none | **Added (§15.8).** Checkpoints render inside View 5's timeline and View 12, both as Unknown in Phase 1. No checkpoint semantics defined here |
| Model / provider per execution | **Not covered by v1.0.0** | `D-E` new fields. `Agent.provider` is *"a routing constraint, not an attestation of what actually ran"* | **Added (§15.8).** Renders as an attribution field on View 5 and View 6, Unknown until `D-E` lands. The routing-vs-attestation distinction is a *claim-class* problem and is handled as one |
| Notification delivery | "Not instrumented"; delivery-honesty prohibition | **In 1F scope:** 1F-9 PWA shell, 1F-10 Web Push, `D-I` subscription store, `D-J` delivery record. Research **R-14 rank A** | **Materially changed (§15.9).** §8 is rewritten: push is a Phase-1 channel, delivery becomes *recordable*, and the honesty rule shifts from "never claim delivery" to "state delivery only from a delivery record" |
| Authentication / session | **Not covered by v1.0.0** | **1F-6, non-negotiable.** Verified: *"no `middleware.ts`, no auth dependency… approval routes execute for anyone who can reach the server"* | **Added (§15.10).** New View 19 Settings covers session and sign-out; sign-in/expiry UX specified. Mechanism (Q-5) is not chosen here |
| Founder conversation / command surface | **Not covered by v1.0.0** — only a `⌘K` navigation palette | **Canonical scope item #1**, S-14 `/ask`, 1F-18, **Q-2 unresolved** | **Added (§15.4).** New **View 17 Ask** specified for the plan's recommended hybrid, explicitly conditional on Q-2 |
| Simulation Lab | **Omitted by v1.0.0 — a genuine defect** | S-17; **ADR-0001 D9 keeps it permanent**; 1F may relocate but not remove | **Corrected (§15.3).** New **View 20** places it under Settings with behavior unchanged |
| Standalone Task surface | Reached only via the Context Spine | **S-8 first-class list + detail**, the J-4 entry point | **Corrected (§15.3).** New **View 18 Task** added |
| Six-field decision header | Not specified as a standard component | **§6.4 cross-cutting rule:** Status · Current owner · Status reason · Next gate · Blockers · Evidence, same order, same place, on every entity surface | **Adopted (§15.2).** This is a better IA rule than anything in v1.0.0 and becomes a required component |
| Scorecards | "Approved-deferred (D-E6)" | **Q-6: an open conflict.** ADR-0001 D8 and ADR-0002 D-E6 place scorecards in 1F; the canonical 1F scope excludes analytics. Plan resolves *out of 1F*, pending Founder confirmation and an ADR amendment | **Corrected (§15.11).** View 6's slot must not assert "deferred" — it now states that two governing documents conflict and the Founder has not ruled |
| Replay safety of escalation resolution | v1.0.0 asserted transitions are *"guarded server-side"* | **NB-1, confirmed defect:** *"A replayed `accept`/`abandon` escalation resolution overwrites newer task state."* R-14: *"Mobile networks produce exactly the duplicate-submission conditions NB-1 describes; this item must not proceed before NB-1 is fixed"* | **Corrected — this is the most consequential UX change in v1.1.0 (§15.12).** The claim was wrong for Family B. §11.7's rationale is amended and NB-1 becomes a hard blocking precondition for mobile escalation resolution |

## 2.6 Global prohibited misleading behavior

These apply to every view in this document. Per-view sections add specifics; none may relax these.

1. **Never render `0` for an unknown.** Zero is a measurement. Unknown is `—`.
2. **Never render a projection as state.** No ETA, forecast, confidence score, or "likely" claim in a status position, in a colour, or in a count.
3. **Never imply an action occurred until the authoritative snapshot confirms it.** No optimistic success. Controls go to a pending state and resolve from the returned snapshot (§11.6).
4. **Never enable a Founder decision control that cannot succeed.** A pending approval without an attached wait token is not actionable (`ApprovalItem.actionable`, existing). The control is disabled with the reason on it, not hidden and not hopefully enabled.
5. **Never animate on stale or disconnected data** (§2.4).
6. **Never present a count as complete when its source is capped or lossy** (event cap, §2.5).
7. **Never merge distinct causes into one label.** Specifically: `retry_exhausted` and `review_exhausted` are different escalations, and within `review_exhausted`, `iterations_exhausted` and `reviewer_unresponsive` are different founder problems and must be visually distinct (PE-3).
8. **Never show a secret.** `Review.callbackToken` is excluded from the read model by construction (`PublicReview`). No view may add a field that reintroduces a capability into a browser-readable surface, and no view displays raw internal auth headers or tokens. Trigger run ids and wait token ids **are** displayable audit identifiers and are not secrets, but wait token ids are shown as presence/absence plus a truncated id, never as copyable full capability text (§11.3).
9. **Never claim validation, review, or approval happened without the record that proves it.** A "passed" badge requires a `Review` with `status: "passed"`. Green is earned.
10. **Never present the absence of a record as success.** A task with no failures and no evidence is "No evidence recorded", not "Clean".
11. **Never use colour as the sole carrier of state** (STANDARD-011). Every status is dot + text label, per existing `StatusPill`.
12. **Never hide a failure behind a summary.** If any child record failed, the parent shows the failure, even when the parent's own status is benign.

---

# 3. Navigation Map

## 3.1 Structure

Mission Control Lite is a **single application shell with three persistent regions and one flat view set.** Depth is achieved by drilling into a record, not by nesting menus. The Founder is one person operating a live system; every view is at most two clicks from Home.

```
┌─ COMMAND BAR (persistent, all viewports) ───────────────────────────────────┐
│  Savrio Dev HQ    [Posture pill]   as of 14:32:07 (4s)  ⟳    ⌘K   🔔 3   EJ │
└──────────────────────────────────────────────────────────────────────────────┘
┌─ STALE RIBBON (conditional, §2.4) ──────────────────────────────────────────┐
└──────────────────────────────────────────────────────────────────────────────┘
┌─ CONTEXT SPINE (persistent when a record is selected, §3.3) ────────────────┐
│  Savrio Platform ▸ Sprint 1F ⚠ ▸ Task TSK-104 ▸ Execution EX-88 ▸ Attempt 2 │
└──────────────────────────────────────────────────────────────────────────────┘
┌ NAV RAIL ┐┌─ VIEW BODY ──────────────────────────────────┐┌ ATTENTION DOCK ┐
│          ││                                              ││ (Home + all    │
│  5 groups││                                              ││  work views)   │
│          ││                                              ││                │
└──────────┘└──────────────────────────────────────────────┘└────────────────┘
```

## 3.2 Navigation groups (desktop rail; mobile tab bar + sheet)

Five groups. The grouping principle: **the Founder's mode of engagement**, not the system's entity model.

```
◆ NOW                                  ← "what is happening"
  ├─ Home ...................... View 1
  ├─ Live Work Queue ........... View 4
  └─ Execution Timeline ........ View 5

◆ DECIDE                       [badge: total founder-blocking items]
  ├─ Decision Inbox ........... View 10   ← the single front door
  ├─ Approval Center .......... View 9
  ├─ Blockers & Escalations ... View 11
  └─ Review Center ............ View 7

◆ WORK
  ├─ Projects ................. View 2
  ├─ Roadmap & Sprints ........ View 3
  ├─ Tasks .................... View 18   ← added v1.1.0 (1F S-8 / C-6)
  └─ Agent & Human Queue ...... View 6

◆ PROOF
  ├─ Evidence Viewer .......... View 8
  └─ Release .................. View 15   [Q-3: may be cut from 1F]

◆ HEALTH
  ├─ Context Health ........... View 12   [dark]
  ├─ Budget & Cost ............ View 13   [dark]
  └─ Notifications ............ View 14

◆ ASK                                     ← added v1.1.0 (1F S-14 / C-1)
  └─ Founder Conversation ..... View 17   [Q-2: architecture unresolved]

◆ SYSTEM                                  ← added v1.1.0 (1F S-16, S-17 / C-5)
  ├─ Settings ................. View 19
  └─ Simulation Lab ........... View 20   [ADR-0001 D9: permanent]
```

**Reconciliation note (v1.1.0).** v1.0.0 had five groups and sixteen views. Four surfaces were missing and are added above: **Tasks** (1F C-6), **Ask** (1F C-1, a named canonical scope item), **Settings** (1F S-16, required by push subscription and session management), and the **Simulation Lab** (1F C-5 — **its omission from v1.0.0 was a defect against ADR-0001 D9, which keeps it a permanent surface**). Seven groups, twenty views. `ASK` and `SYSTEM` are unbadged.

**Badge rules.** Only `DECIDE` carries a numeric badge, and it counts exactly the items in the Decision Inbox (§10). No other group is badged, so a badge always means "you, personally, are the blocker". Views 12 and 13 carry a static `dark` marker in the rail — a small dashed outline with the accessible name "Not instrumented" — so the Founder is never surprised by an empty page.

**Anti-double-count rule.** Approval Center, Blockers & Escalations, and Review Center are *type-specific work surfaces* over the same records the Decision Inbox aggregates. The Inbox badge is the only count of founder-blocking work. Sub-view headers state their relationship explicitly: `4 of the 6 items in your Decision Inbox are approvals.`

## 3.3 The Context Spine

The Context Spine answers Question 2 continuously and is the design's answer to "which project, sprint, task, and execution are active".

- Appears whenever a record is selected, on every view, at the same y-position.
- Segments: **Project ▸ Sprint ▸ Task ▸ Execution ▸ Attempt**, each a link to its own view, each carrying its own status dot.
- **The Sprint segment always renders with a provenance marker** (`⚠ preview`) because sprint membership is not instrumented (§2.5). Hovering or focusing it reads: `Sprint shown from planning documents. Dev HQ does not record sprint membership.`
- The Attempt segment shows `Attempt 2 of 3` when `Execution.attempt` is recorded, and `Attempt not recorded` when the execution predates attempt tracking or carries none.
- On mobile the Spine collapses to `⌂ Savrio Platform ▸ … ▸ EX-88` with a tap target that expands the full chain in a sheet.
- Truncation is always from the middle, never from the end. The Founder needs the leaf.

## 3.4 URL scheme (deep linking and shareability)

Every view and every record is addressable. This matters because the Founder moves between phone and desktop mid-decision (§9.5).

**Reconciled scheme (v1.1.0).** SPRINT-1F-PLAN §6.3 proposed a different scheme (1F conflict C-2). Design owns the answer, and the reconciliation **adopts the 1F plan's entity-noun structure** wherever the two disagree, because it is the more conventional Next.js App Router shape, it matches the file-based routing the implementation will use, and consistency matters more here than my original naming. My distinct surfaces are preserved as their own routes. Changes from v1.0.0 are marked.

```
/                                     Founder Home
/inbox                                Founder Decision Inbox
/inbox/approvals/<id>                 Approval detail        [CHANGED ← /approvals/<id>]
/inbox/escalations/<id>               Escalation detail      [CHANGED ← /escalations/<id>]
/approvals                            Approval Center (list surface)
/escalations                          Blockers & Escalations (list surface)
/queue?wait=<reason>&project=<id>     Live Work Queue, filtered
/projects                             Project list
/projects/<id>                        Project Overview
/roadmap                              Roadmap
/sprints/<slug>                       One sprint (preview-backed)   [CHANGED ← /roadmap/<slug>]
/tasks                                Task list                     [NEW — View 18]
/tasks/<id>                           Task detail                   [NEW — View 18]
/executions/<id>                      Execution detail; timeline is the default tab
                                                                    [CHANGED ← /timeline/<id>]
/executions?task=<id>                 All attempts for a task       [CHANGED ← /timeline?task=]
/agents                               Agent & Human Queue
/agents/<id>                          One agent
/reviews                              Review Center
/reviews/<id>                         One review, with findings
/evidence?task=<id>&kind=<kind>       Evidence Viewer, filtered
/evidence/<id>                        One evidence record
/context-health                       Context Health (dark)
/cost                                 Budget & Cost (dark)          [CHANGED ← /budget]
/notifications                        Notifications
/releases                             Release View          [CHANGED ← /release; may be cut, Q-3]
/ask                                  Founder Conversation          [NEW — View 17]
/settings                             Settings                      [NEW — View 19]
/lab                                  Simulation Lab                [NEW — View 20]
```

**Retained from v1.0.0, unchanged by the reconciliation:** URL state is the source of truth for filters, so a filtered queue is shareable and survives reload. **A deep link to a record that no longer exists in the snapshot renders the "record not in current snapshot" failure state (§4.4), never a redirect to Home.** The 1F plan reached the same conclusion independently (its §13 F-9), and its §7.4/F-6 adds the reason: on an in-memory store a restart and an unreachable server look identical to a naive client and mean opposite things. §4.4 already distinguishes them; **that distinction is now a named 1F acceptance requirement and must not be softened.**

Silently relocating the Founder loses the decision they were making, which is why no redirect is permitted.

## 3.5 Global keyboard model

| Key | Action |
| --- | --- |
| `⌘K` / `Ctrl+K` | Command palette: jump to any view or record by name or id |
| `g` then `h` | Home |
| `g` then `d` | Decision Inbox |
| `g` then `q` | Live Work Queue |
| `g` then `t` | Execution Timeline (current spine context) |
| `g` then `e` | Evidence Viewer |
| `r` | Refresh now (same as ⟳) |
| `j` / `k` | Next / previous item in the focused list |
| `Enter` | Open focused item |
| `?` | Keyboard shortcut reference sheet |
| `Esc` | Close sheet/dialog, return focus to invoker |

No shortcut performs a decision. Approve, reject, revise, abandon, and accept have **no keyboard accelerator**, deliberately: an irreversible founder decision must not be one keystroke from a list. They are reachable by Tab like any other control, and they pass through the confirmation step in §11.5.

---

# 4. Screen Inventory

## 4.1 Primary views

| # | View | Route | Provenance | Primary founder question |
| --- | --- | --- | --- | --- |
| 1 | Founder Home | `/` | derived (live source) | What is Dev HQ doing, and what needs me? |
| 2 | Project Overview | `/projects/<id>` | live + derived | Is this project healthy and where is it stuck? |
| 3 | Roadmap & Sprints | `/roadmap` | **preview** + live | What is the plan and what does the system actually show against it? |
| 4 | Live Work Queue | `/queue` | live + derived | What is in flight, waiting, or stuck right now? |
| 5 | Execution Timeline | `/timeline/<id>` | derived (until 1E-8) | What exactly happened to this piece of work? |
| 6 | Agent & Human Queue | `/agents` | live + derived | Who is doing what, and is anyone stalled? |
| 7 | Review Center | `/reviews` | live | What is being quality-checked and what did reviewers find? |
| 8 | Evidence Viewer | `/evidence` | live | What proves this work happened and passed? |
| 9 | Approval Center | `/approvals` | live | What workflow gates are waiting on my approval? |
| 10 | Founder Decision Inbox | `/inbox` | derived | What decisions are mine, ordered by urgency? |
| 11 | Blockers & Escalations | `/escalations` | live | What has automation given up on? |
| 12 | Context Health | `/context-health` | **unavailable** | Is context health safe? (currently: unknown) |
| 13 | Budget & Cost | `/budget` | **unavailable** | What are we spending? (currently: unknown) |
| 14 | Notifications | `/notifications` | derived | What changed while I was away? |
| 15 | Release View | `/release` | **preview** + live | What is the next gate to shipping? |
| 16 | Mobile Quick Actions | mobile shell | derived | Can I unblock Dev HQ from my phone in under 30 seconds? |
| **17** | **Founder Conversation ("Ask")** | `/ask` | derived + live | Can I ask about state and issue a command in my own words? *(added v1.1.0; conditional on Q-2)* |
| **18** | **Task list + detail** | `/tasks`, `/tasks/<id>` | live + derived | What is the state of this task, who owns it, and what is blocking it? *(added v1.1.0)* |
| **19** | **Settings** | `/settings` | live + derived | How do I control notifications, this device, and my session? *(added v1.1.0)* |
| **20** | **Simulation Lab** | `/lab` | live | *(preserved per ADR-0001 D9; behavior unchanged, relocated only)* |

### 4.1.1 Mapping to the Sprint 1F screen list (resolves 1F conflict C-4)

The counts differed because the two documents cut the same surface set differently: the 1F plan splits list and detail into separate screens; v1.0.0 treated a list and its detail drawer as one view with two states. Neither is wrong. **The mapping is the reconciliation; no surface is dropped by either side.**

| 1F screen | This specification | Note |
| --- | --- | --- |
| S-1 Command Home | View 1 Founder Home | Same surface |
| S-2 Decision Inbox | View 10 Decision Inbox | Same. Membership rule §10.3 governs |
| S-3 Approval detail | View 9 Approval Center (detail state) | Route moved to `/inbox/approvals/<id>` |
| S-4 Escalation detail | View 11 Blockers & Escalations (detail state) | **`escalationReason` beside `origin` is required by both** |
| S-5 Project list + detail | View 2 Project Overview + `/projects` list | |
| S-6 Roadmap | View 3, roadmap level | `preview`; Q-3 |
| S-7 Sprint | View 3, sprint level (`/sprints/<slug>`) | `preview`; Q-3 |
| S-8 Task list + detail | **View 18** | Added; was a v1.0.0 gap |
| S-9 Execution detail + live timeline | View 5 Execution Timeline | Timeline is the default tab of `/executions/<id>` |
| S-10 Agent roster + detail | View 6 Agent & Human Queue | View 6 additionally carries the Founder lane |
| S-11 Queue | View 4 Live Work Queue | View 4 is reason-grouped, which is what S-11's *"why each is waiting"* asks for |
| S-12 Review detail | View 7 Review Center | |
| S-13 Release | View 15 Release | May be cut from 1F per Q-3 |
| S-14 Founder conversation | **View 17** | Added; was a v1.0.0 gap |
| S-15 Cost and budget | View 13 Budget & Cost | Dark in Phase 1 |
| S-16 Settings | **View 19** | Added |
| S-17 Simulation Lab | **View 20** | Added; ADR-0001 D9 |
| — | View 8 Evidence Viewer | **Not in the 1F screen list.** Evidence appears there as a field on other screens. A dedicated browsable surface is a design position (§15.13) |
| — | View 12 Context Health | Not a separate 1F screen; folded into S-9. Kept separate here so Question 12 has a home (§1) |
| — | View 14 Notifications | Not a separate 1F screen. Required as the in-app counterpart to push (§8) |
| — | View 16 Mobile Quick Actions | Not a screen — a cross-cutting interaction spec over S-2/S-3/S-4 |

## 4.2 Secondary surfaces (sheets, dialogs, drawers)

| Surface | Trigger | Type | Notes |
| --- | --- | --- | --- |
| Record Detail Sheet | click any row | right drawer (desktop) / bottom sheet (mobile) | Non-blocking; the list stays visible and keeps updating |
| Decision Confirmation Dialog | any founder decision | modal | Focus-trapped, irreversibility stated, §11.5 |
| Evidence Preview | evidence row | drawer within Evidence Viewer | §8 |
| Finding Detail | review finding row | inline expansion | Severity always visible when collapsed |
| Command Palette | `⌘K` | overlay | Search across projects, tasks, executions, reviews, evidence by id or title |
| Keyboard Reference | `?` | modal | |
| Stale Ribbon | feed degradation | inline banner | Not a dialog; never blocks |
| Provenance Explainer | click any provenance badge | popover | Explains the badge and names the backing record |
| Filter Sheet | mobile filter button | bottom sheet | Desktop uses inline filter chips |
| Founder Request Composer | "New request" | modal | Existing `FounderRequestForm` behavior; not redesigned here beyond §11.8 |

## 4.3 Shared view states (every view implements all six)

| State | Definition | Rule |
| --- | --- | --- |
| **Loading (initial)** | no snapshot yet | Skeletons matching final layout dimensions. **No zeros, no "0 items", no empty-state copy.** An empty state during loading is a false claim of emptiness |
| **Loading (refresh)** | snapshot exists, poll in flight | Content stays fully rendered and interactive. Only the `as of` timestamp shows a subtle in-progress indicator. **No skeletons, no spinners over content, no layout shift** |
| **Populated** | data present | Normal |
| **Empty (true)** | snapshot loaded, genuinely zero records | Explicit empty state naming what would appear here and the one action that would produce it |
| **Empty (dark)** | capability not instrumented | Explicit unavailable state naming the missing record, per §2.5 — never the same visual as Empty (true) |
| **Failure** | request failed, record missing, or malformed | §4.4 |

**Empty (true) and Empty (dark) must never look alike.** This is one of the highest-value distinctions in the whole design: "nothing is failing" and "we don't measure failure" are opposite messages, and conflating them is the single most dangerous thing this dashboard could do.

## 4.4 Failure taxonomy (view-level)

| Failure | Cause | Presentation | Recovery offered |
| --- | --- | --- | --- |
| **Feed failure** | state API unreachable | Stale Ribbon (§2.4) + retained snapshot | `Retry now`; automatic retry continues |
| **Record not in snapshot** | deep link to deleted/restarted-store record | In-body panel: `EX-88 is not in the current snapshot. Dev HQ state is held in memory and does not survive a restart.` | `Back`, `Go to Home`, `Copy id`. **No redirect** |
| **Malformed record** | field missing or unexpected shape | Row renders with `—` for the bad field and a `Record incomplete` marker; the rest of the row still renders | `View raw record` |
| **Action failure** | mutating request failed | Inline error at the control, verbatim server message, control returns to enabled | `Try again`; state reflects the last authoritative snapshot only |
| **Action ambiguity** | request sent, response lost | `We could not confirm this decision. Refresh before deciding again.` Control stays **disabled** until a fresh snapshot resolves it | `Refresh` — never `Retry`, because a blind retry on an unconfirmed decision is exactly what must not happen |
| **Partial view failure** | one panel's derivation throws | That panel alone shows its failure; sibling panels keep working | `Reload panel` |

`Action ambiguity` deserves emphasis: approvals and escalation resolutions are guarded transitions server-side, so a duplicate is rejected rather than double-applied. But the *Founder* does not know that from the UI, so the UI must not invite a blind retry. It sends them to the truth instead.

---
# 5. View Specifications

Each view is specified against the twelve required dimensions. Wireframes are text; dimensions assume a 1440×900 desktop reference and a 390×844 phone reference.

---

## View 1 — Founder Home

### 1.1 Purpose

The single screen that makes navigation optional. Home answers all thirteen questions at a glance, states which of them it cannot answer, and puts the Founder's own decisions above every other piece of content on the page.

### 1.2 Primary user question

> *What is Dev HQ doing, and what does it need from me right now?*

### 1.3 Information shown

**Zone A — Posture Banner** (derived)

A single composite HQ posture, computed by strict precedence so it is deterministic and never ambiguous:

| Precedence | Posture | Condition | Label | Colour |
| --- | --- | --- | --- | --- |
| 1 | `unknown` | feed `disconnected` | **State unknown — not connected to Dev HQ** | `err` |
| 2 | `attention_required` | any founder-blocking item (§10.3) | **Needs you — N decisions waiting** | `wait` |
| 3 | `failing` | any execution `failed`, or any workflow run at stage `failed` | **Failure recorded — N items** | `err` |
| 4 | `blocked` | any task `blocked`, or any pending approval that is not actionable | **Blocked — N items cannot proceed** | `err` |
| 5 | `working` | any execution `running` or `queued`, or any review `pending` | **Working — N executions, N reviews** | `run` |
| 6 | `idle` | records exist, nothing in flight | **Idle — all work settled** | `ok` |
| 7 | `empty` | no records at all | **No work recorded yet** | `idle` |

Posture is Derived, and its condition is stated in the banner's own subtext so the Founder can audit the claim: `Because: 2 pending approvals, 1 open escalation.`

**Zone B — Decision Inbox Preview** (derived) — the top three founder-blocking items with one-line context and a direct decision link. Never more than three; the count links to View 10. This is deliberately the highest-priority content on the page, above "what's running", because a founder's scarcest resource is their own decisions.

**Zone C — Now Strip** (derived from live) — four Recorded/Derived counters, each linking to a filtered queue:
`Running N` · `Queued N` · `In review N` · `Waiting on you N`.
Counters are computed from `state.executions`, `state.reviews`, `state.approvals`, `state.escalations`. **`DevHqState.overview` is not used** — it is `preview` data (§2.5).

**Zone D — Now Cards** (live) — one card per running or queued execution, in start-time order, each carrying the full ownership chain that answers Questions 2 and 3 simultaneously:
project · sprint (preview-marked) · task title · execution id · attempt N of 3 · owning agent (name, role, provider) · status · elapsed · heartbeat health.

**Zone E — Waiting Board** (derived) — waiting work grouped by *reason*, which is the only grouping that answers Question 4. Reasons per §7.6. Each group shows a count, the oldest item's age, and expands to the items.

**Zone F — Failure & Retry Strip** (live + derived) — failed executions, exhausted retries, and in-flight retries. Retry rendering: `Attempt 2 of 3` with the previous attempts' outcomes as small chips, so "what is retrying" reads as a trajectory rather than a status word.

**Zone G — Health Strip** (mixed provenance, one tile each):
`Feed` (live) · `Agents` (live) · `Reviews` (live) · `Context health` (**dark**) · `Budget` (**dark**) · `Next gate` (derived or unknown).

**Zone H — Latest Evidence** (live) — five most recent evidence records with kind, label, task, actor, time.

**Zone I — Reserved Decisions** (derived, static list + live counts) — the standing list of decision types reserved for the Founder (§11.2) with current counts. This answers Question 10 even when all counts are zero, because the *list itself* is the answer.

### 1.4 Actions available

| Action | Location | Notes |
| --- | --- | --- |
| Refresh now | command bar | Always available, even disconnected |
| Open decision | Zone B, Zone I | Navigates to the decision surface; **never decides inline** — Home is a status surface and a mis-click on Home must not approve anything |
| Filter queue by counter | Zone C | Deep link with URL state |
| Open execution timeline | Zone D card | |
| Expand wait group | Zone E | Inline, no navigation |
| Open evidence record | Zone H | Drawer |
| New founder request | command bar | Existing composer |
| Explain a provenance badge | any badge | Popover |

### 1.5 States

- **Posture states:** the seven above.
- **Zone B:** 1–3 items / zero items / feed unknown.
- **Zone D:** populated / no executions in flight / feed unknown.
- **Zone G tiles:** live-ok / live-degraded / dark / unknown.
- **Whole-page:** initial load, refreshing, populated, empty, disconnected.

### 1.6 Empty states

| Zone | Empty (true) copy | Empty (dark) copy |
| --- | --- | --- |
| B | **Nothing needs you.** No approvals, escalations, or founder-reserved decisions are open. | n/a |
| D | **Nothing is executing.** No execution is running or queued. Dispatch work from a project or submit a founder request. | n/a |
| E | **Nothing is waiting.** | n/a |
| F | **No failures recorded.** This means no execution has reported a failure — not that all work is verified. Verification lives in Review Center. | n/a |
| G/context | n/a | **Context health is not measured.** Dev HQ records no context-window usage, compaction, or memory-pressure signal. → What would light this up |
| G/budget | n/a | **Cost is not measured.** Agent executions record `usage: null`; no token or spend figure exists. → What would light this up |
| H | **No evidence recorded yet.** Evidence appears when an execution or review writes a validation, artifact, review, approval, or log record. | n/a |
| Whole page | **Dev HQ has no records yet.** Submit your first request to begin. | n/a |

Note the copy for F: it explicitly refuses to convert "no failures" into "everything is fine". That is §2.6 rule 10 applied.

### 1.7 Loading states

- **Initial:** Posture Banner is a skeleton bar with the accessible live-region text `Loading Dev HQ state`. Zones B–I are dimension-matched skeletons. **No counters render as 0.** No empty-state copy renders.
- **Refresh:** nothing changes except the `as of` field, which shows a 1px indeterminate progress line. Counters update in place. **Rows must not reorder during a refresh while a row has focus** — if the focused row's sort position changes, its new position is applied on blur, and a polite live-region message says `List order updated`. Yanking a row out from under a founder mid-decision is a defect, not a refresh.

### 1.8 Failure states

- Feed failure → Stale Ribbon; all zones keep their last values with the age counter running.
- Disconnected → posture `unknown`; **Zone B decision links remain navigable but their target's decision controls are disabled** (§11.7); pulses stop; content desaturates.
- A single zone's derivation throwing → that zone shows `This panel could not be computed from the current snapshot.` with `Reload panel`; every other zone continues.

### 1.9 Stale-data warning

Command bar shows `as of 14:32:07 (4s)`. At `degraded`, the age turns amber and the ribbon appears. At `disconnected`, the age turns red, the ribbon is sticky, and the Posture Banner is replaced — not merely recoloured — by the `unknown` posture, because a stale posture is worse than no posture.

### 1.10 Mobile behavior

Single column, in this order — the order is the design:

1. Posture Banner (full width, tall, unmissable)
2. Decision Inbox Preview with a prominent `Review N decisions` button
3. Now Strip as a 2×2 counter grid
4. Now Cards, horizontally scrollable, snap-aligned, one card ≈ 88% viewport width
5. Waiting Board — collapsed accordion, groups only, counts visible
6. Failure & Retry Strip — collapsed unless non-empty, auto-expanded when non-empty
7. Health Strip — 2-column tile grid; dark tiles visibly dashed
8. Latest Evidence — three items, `See all`
9. Reserved Decisions — collapsed accordion

Zones E, G, I collapse; B, C, D, F never collapse. Nothing that answers "what needs you" or "what failed" is ever behind a tap.

### 1.11 Accessibility considerations

- `<main>` with `<h1>Founder Home</h1>`; each zone is a `<section>` with an `<h2>` and `aria-labelledby`.
- Posture Banner is `role="status"` `aria-live="polite"`, and announces the composite sentence including the "Because:" clause. It must **not** be `aria-live="assertive"` — a 3-second poll with an assertive region would interrupt the screen reader continuously.
- Counter changes are not individually announced. A single polite summary announces at most once per 30 seconds: `2 decisions waiting, 3 executions running.` Rate-limiting announcements is an accessibility requirement here, not a nicety.
- Every status is `StatusDot` + text label (existing pattern). No colour-only state.
- Now Cards are `<article>` with an accessible name of `Execution EX-88, task Add retry telemetry, agent Claude Implementer, running, attempt 2 of 3, heartbeat healthy`.
- Dark tiles are focusable, and their accessible name begins `Not instrumented:` so the class is heard, not inferred (§2.3 rule 3).
- Horizontal card scrolling on mobile is keyboard and screen-reader traversable as a list; scroll-snap must not trap focus.
- Reduced motion: pulses and the progress line respect `prefers-reduced-motion` and become static.
- Focus order follows visual order top-to-bottom; the nav rail is skippable via a `Skip to main content` link as the first focusable element.

### 1.12 Prohibited misleading behavior

1. **Must not use `DevHqState.overview`** for any counter. It is placeholder data.
2. **Must not decide anything inline.** No approve/reject/revise control appears on Home, at any breakpoint.
3. **Must not show an ETA, forecast, or completion percentage** for in-flight work. `Execution` records no progress fraction, so any percentage would be invented.
4. **Must not derive project health from task counts alone** and present it as a health score. Home shows recorded statuses; it does not grade.
5. **Must not merge the dark tiles into the healthy ones.** A `Context health: —` tile must never render green, and must never be omitted to make the strip look complete.
6. **Must not keep pulsing** when the feed is degraded or disconnected.
7. **Must not display "0 failures" during initial load.**
8. **Must not summarize the Waiting Board as a single "N waiting" number without reasons available.** The reason is the answer; the count alone is a non-answer.

### 1.13 Text wireframe — desktop (1440)

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│ ⬢ SAVRIO DEV HQ   ● Needs you — 2 decisions   as of 14:32:07 (4s) ⟳   ⌘K   🔔 3   [EJ] │
├──────────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─ NOW ─────┐ ┌────────────────────────────────────────────────────┐ ┌─ ATTENTION ─────┐│
│ │ ▸ Home    │ │ ╔══════════════════════════════════════════════╗   │ │ DERIVED         ││
│ │   Queue   │ │ ║ ● NEEDS YOU — 2 DECISIONS WAITING            ║   │ │                 ││
│ │   Timeline│ │ ║ Because: 1 pending approval, 1 open escalation║   │ │ ⚑ Approve       ││
│ │           │ │ ║ Oldest has waited 41m                        ║   │ │   "Add retry    ││
│ │ ◆ DECIDE 2│ │ ╚══════════════════════════════════════════════╝   │ │   telemetry"    ││
│ │   Inbox  2│ │                                                    │ │   41m · TSK-104 ││
│ │   Approval│ │ ┌ DECISIONS WAITING ON YOU ────────── DERIVED ─┐   │ │   → Decide      ││
│ │   Blockers│ │ │ ⚑ APPROVAL · 41m · Savrio Platform          │   │ │ ─────────────── ││
│ │   Reviews │ │ │   Add retry telemetry to dispatch           │   │ │ ⚠ Escalation    ││
│ │           │ │ │   Gate: Founder approval required           │   │ │   Retries       ││
│ │ ◆ WORK    │ │ │   [ Decide → ]                              │   │ │   exhausted     ││
│ │   Projects│ │ │ ─────────────────────────────────────────── │   │ │   TSK-097       ││
│ │   Roadmap │ │ │ ⚠ ESCALATION · 12m · Savrio Platform        │   │ │   → Decide      ││
│ │   Agents  │ │ │   Retries exhausted after 3 attempts        │   │ │ ─────────────── ││
│ │           │ │ │   TSK-097 · Normalize evidence uris         │   │ │ NEXT GATE       ││
│ │ ◆ PROOF   │ │ │   [ Decide → ]                              │   │ │ Founder approval││
│ │   Evidence│ │ └─────────────────────────────────────────────┘   │ │ on TSK-104      ││
│ │   Release │ │                                                    │ │ DERIVED         ││
│ │           │ │ ┌ RIGHT NOW ────────────────────────── DERIVED ┐   │ └─────────────────┘│
│ │ ◆ HEALTH  │ │ │  RUNNING    QUEUED   IN REVIEW  WAITING ON  │   │                    │
│ │   Context⌗│ │ │     3         1          2        YOU  2    │   │                    │
│ │   Budget ⌗│ │ └─────────────────────────────────────────────┘   │                    │
│ │   Notifs  │ │                                                    │                    │
│ └───────────┘ │ ┌ EXECUTING NOW ───────────────────────── LIVE ┐   │                    │
│               │ │ ┌─────────────────────────────────────────┐ │   │                    │
│               │ │ │ ● Running · 4m 12s   EX-88  Attempt 2/3 │ │   │                    │
│               │ │ │ Savrio Platform ▸ Sprint 1F⚠ ▸ TSK-104  │ │   │                    │
│               │ │ │ Add retry telemetry to dispatch         │ │   │                    │
│               │ │ │ 👤 Claude Implementer · implementation  │ │   │                    │
│               │ │ │    provider: claude-code                │ │   │                    │
│               │ │ │ ♥ Heartbeat healthy · 6s ago            │ │   │                    │
│               │ │ │ Lease —  (assignment not exposed)       │ │   │                    │
│               │ │ │ [ Timeline ]  [ Evidence 3 ]            │ │   │                    │
│               │ │ └─────────────────────────────────────────┘ │   │                    │
│               │ │ ┌─────────────────────────────────────────┐ │   │                    │
│               │ │ │ ● Running · 1m 02s   EX-91  Attempt 1/3 │ │   │                    │
│               │ │ │ … ▸ TSK-110 Document review vocabulary  │ │   │                    │
│               │ │ │ 👤 Claude Reviewer · review             │ │   │                    │
│               │ │ │ ♥ Not reporting · last beat 2m 14s ago  │ │   │                    │
│               │ │ └─────────────────────────────────────────┘ │   │                    │
│               │ └─────────────────────────────────────────────┘   │                    │
│               │                                                    │                    │
│               │ ┌ WAITING — AND WHY ────────── DERIVED ┐ ┌ FAILED & RETRYING ── LIVE ┐│
│               │ │ ▸ Waiting on founder approval    1   │ │ ✕ EX-84 failed            ││
│               │ │   oldest 41m                         │ │   TSK-097 · attempt 3 of 3││
│               │ │ ▸ Awaiting reviewer callback     2   │ │   Retries exhausted       ││
│               │ │   oldest 6m · deadline ≈ 2m left     │ │   → Escalation ESC-12     ││
│               │ │ ▸ Waiting for agent capacity     1   │ │ ───────────────────────── ││
│               │ │   oldest 3m                          │ │ ↻ EX-88 retrying          ││
│               │ │ ▸ Dispatched, not yet claimed    —   │ │   attempt 1 ✕ → attempt 2 ●││
│               │ │   not exposed to browser             │ │ ───────────────────────── ││
│               │ │ ▸ Blocked · reason not recorded  1   │ │ No other failures recorded││
│               │ └──────────────────────────────────────┘ └───────────────────────────┘│
│               │                                                    │                    │
│               │ ┌ HEALTH ───────────────────────────────────────┐  │                    │
│               │ │ FEED     AGENTS    REVIEWS   CONTEXT   BUDGET │  │                    │
│               │ │ ● Live   3 of 4    2 pending ┌╌╌╌╌╌┐  ┌╌╌╌╌╌┐│  │                    │
│               │ │ 4s ago   1 stale   0 escal.  │  —  │  │  —  ││  │                    │
│               │ │ LIVE     LIVE      LIVE      │NOT  │  │NOT  ││  │                    │
│               │ │                              │INSTR│  │INSTR││  │                    │
│               │ │                              └╌╌╌╌╌┘  └╌╌╌╌╌┘│  │                    │
│               │ └───────────────────────────────────────────────┘  │                    │
│               │                                                    │                    │
│               │ ┌ LATEST EVIDENCE ──────── LIVE ┐ ┌ RESERVED FOR YOU ───── DERIVED ┐│
│               │ │ ✓ validation  tsc clean  2m    │ │ Approve founder-request gate  1 ││
│               │ │ 📄 artifact   diff EX-88 4m    │ │ Resolve escalation            1 ││
│               │ │ ⚖ review      finding    9m    │ │ Accept work over reviewer      0 ││
│               │ │ ✓ approval    ESC-11     22m   │ │ Abandon a task                 0 ││
│               │ │ 📋 log        dispatch   25m   │ │ Approve a release             — ││
│               │ │ [ See all evidence → ]         │ │   (release state not recorded) ││
│               │ └────────────────────────────────┘ └────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────────────────┘
```

### 1.14 Text wireframe — mobile (390)

```
┌────────────────────────────────┐
│ ⬢ DEV HQ    14:32:07(4s) ⟳ 🔔3│
├────────────────────────────────┤
│ ╔════════════════════════════╗ │
│ ║ ●                          ║ │
│ ║ NEEDS YOU                  ║ │
│ ║ 2 decisions waiting        ║ │
│ ║ Because: 1 approval,       ║ │
│ ║ 1 escalation               ║ │
│ ║ Oldest waited 41m          ║ │
│ ╚════════════════════════════╝ │
│                                │
│ ┌────────────────────────────┐ │
│ │ ⚑ Approve · 41m            │ │
│ │ Add retry telemetry        │ │
│ │ TSK-104 · Savrio Platform  │ │
│ ├────────────────────────────┤ │
│ │ ⚠ Escalation · 12m         │ │
│ │ Retries exhausted TSK-097  │ │
│ └────────────────────────────┘ │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃  REVIEW 2 DECISIONS  →     ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                │
│ ┌ RIGHT NOW ───────── DERIVED ┐│
│ │ RUNNING 3  │ QUEUED    1   ││
│ │ REVIEW  2  │ ON YOU    2   ││
│ └────────────────────────────┘ │
│                                │
│ EXECUTING NOW            LIVE  │
│ ┌──────────────────┐┌─────────>│
│ │● Running 4m12s   ││● Running │
│ │EX-88  Attempt 2/3││EX-91  1/3│
│ │TSK-104 Add retry ││TSK-110 …│
│ │telemetry         ││          │
│ │👤 Claude Impl.   ││👤 Claude │
│ │♥ healthy 6s      ││♥ NOT     │
│ │[Timeline][Ev 3]  ││  REPORTING│
│ └──────────────────┘└─────────>│
│                                │
│ ✕ FAILED & RETRYING       LIVE │
│ ┌────────────────────────────┐ │
│ │ EX-84 failed · TSK-097     │ │
│ │ attempt 3 of 3 · exhausted │ │
│ │ → ESC-12                   │ │
│ │ ↻ EX-88 retrying 2 of 3    │ │
│ └────────────────────────────┘ │
│                                │
│ ▸ WAITING — AND WHY      5  ⌄ │
│ ▸ HEALTH                    ⌄ │
│ ▸ LATEST EVIDENCE           ⌄ │
│ ▸ RESERVED FOR YOU          ⌄ │
├────────────────────────────────┤
│  ⌂      ◆2      ≡      ⚑      │
│ Home  Decide  Queue  Proof     │
└────────────────────────────────┘
```

---

## View 2 — Project Overview

### 2.1 Purpose

The per-project command surface: everything Dev HQ has recorded about one project's work, ownership, blockage, evidence, and pending decisions, in one place.

### 2.2 Primary user question

> *Is this project healthy, and if not, where exactly is it stuck and who holds it?*

### 2.3 Information shown

- **Project header:** name, slug, repository, default branch, `LifecycleStatus`, owner, created/updated. Repository and branch are shown as text, not links, unless a source-control connection is recorded — an unverified link is a claim.
- **Recorded status summary:** task counts by `LifecycleStatus`, execution counts by `ExecutionStatus`, review counts by `ReviewStatus`, open escalations, pending approvals. All Derived from live arrays.
- **Stage track** (existing `WorkflowStageTrack` behavior): the project's primary workflow run mapped onto the workflow's declared stages. When the workflow definition is absent, **the track is omitted entirely** rather than fabricated — this is existing, correct behavior (`buildStageProgress` returns null) and must be preserved.
- **Failure disclosure:** if the primary run is at stage `failed`, the header states `Technical failure — the stage at which it failed is not recorded.` This is a direct consequence of `STAGE_INDEX.failed === -1` and must be stated, not hidden.
- **Active work:** the project's running/queued executions with owner and attempt.
- **Blocked and waiting:** the project's slice of the Waiting Board.
- **Decisions in this project:** approvals and escalations scoped here, linking to their decision surfaces.
- **Reviews in this project:** with `status`, `iteration N of 3`, and for escalated reviews the mandatory `escalationReason`.
- **Evidence in this project:** most recent 10, filterable by kind.
- **Activity:** recent events for this project's records, with the retention caveat (§2.5).
- **Sprint context:** preview-badged, per §3.3.

### 2.4 Actions available

Open task · open execution timeline · open review · open evidence · open decision surface · filter evidence by kind · filter tasks by status · copy project id · dispatch an agent execution (existing `DispatchAgentPanel` capability — surfaced here, unchanged in behavior).

**No inline decisions.** Approvals and escalations link out to their decision surfaces (§11).

### 2.5 States

Project `LifecycleStatus` drives the header: `draft`, `active`, `paused`, `blocked`, `needs_revision`, `rejected`, `completed`, `archived` — labels per existing `LIFECYCLE_STATUS`. Sub-states: has-workflow / no-workflow; has-run / no-run; failed-run; attention / clear.

### 2.6 Empty states

- No tasks: **No tasks recorded in this project.** Create a task or submit a founder request.
- No executions: **No execution has run in this project.**
- No workflow: **No workflow definition is recorded for this project, so no stage track can be shown.** (Not "0% complete".)
- No evidence: **No evidence recorded for this project.**
- No reviews: **No review has been dispatched in this project.**

### 2.7 Loading states

Header skeleton preserves height so the stage track does not jump into place. Panels load independently; each shows its own skeleton. Counts never render before data.

### 2.8 Failure states

- Project id not in snapshot → §4.4 "record not in snapshot" panel with `Copy id` and `Back`.
- Workflow referenced by the run but missing from `state.workflows` → stage track omitted with the explicit note above; the rest of the page renders.
- A task referencing a missing agent id → owner renders as the raw id with a `Agent not in registry` marker. Existing `actorName` already falls back to the raw id rather than hiding it; that behavior is correct and required.

### 2.9 Stale-data warning

View header carries the shared `as of` control. On `disconnected`, the dispatch control and all decision links' targets disable.

### 2.10 Mobile behavior

Header collapses to name + status + owner. A segmented control replaces the panel grid: `Work | Waiting | Decisions | Reviews | Evidence | Activity`. Stage track becomes a horizontally scrolling stepper with the current stage auto-scrolled into view and announced. Dispatch is available but behind a `More` menu, since it is not a triage action.

### 2.11 Accessibility considerations

`<h1>` is the project name; each panel `<h2>`. Stage track is an ordered list with each step's state in its accessible name (`Step 3 of 5, Founder approval required, current`) — never conveyed by fill colour alone. Counts-by-status render as a definition list, not a bare grid of numbers. Segmented control on mobile is a proper tablist with arrow-key navigation and `aria-selected`.

### 2.12 Prohibited misleading behavior

1. **Must not synthesize a stage track** when the workflow definition is missing.
2. **Must not display a completion percentage** other than the one `buildStageProgress` derives from declared stages, and must not show it at all when `currentIndex < 0` (technical failure) — existing logic returns `percent: 0` there, and a `0%` bar next to a failure reads as "not started", which is false. **Design decision: when `currentIndex < 0`, render no progress bar and no percentage; render `Stage at failure not recorded`.**
3. **Must not present repository/branch as verified links** without a recorded connected-service status.
4. **Must not roll failures up into a green project header.** If any child failed, the header carries the failure.
5. **Must not show sprint membership as fact** (§3.3).

### 2.13 Text wireframe — desktop

```
┌ CONTEXT SPINE ───────────────────────────────────────────────────────────────┐
│ Savrio Platform ▸ Sprint 1F ⚠preview                    as of 14:32:07 (4s) │
├──────────────────────────────────────────────────────────────────────────────┤
│ SAVRIO PLATFORM                                    ● In progress  ⚑ 2 for you│
│ savrio/platform · main · owner Evan · Founder · updated 2m ago          LIVE  │
│ ⚠ Technical failure recorded on the primary run. The stage at which it       │
│   failed is not recorded.                                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ WORKFLOW: Founder Request v1.0.0                                     DERIVED │
│ ①Received ──── ②Exec review ──── ③Founder approval ──── ④Decision ── ⑤Done  │
│  ✓complete      ✓complete        ●current ⚑gate         pending     pending  │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌ RECORDED STATUS ──────── DERIVED ┐ ┌ DECISIONS IN THIS PROJECT ──── LIVE ┐│
│ │ TASKS      12                    │ │ ⚑ Approval · Founder approval on    ││
│ │  active 3 · blocked 1 · draft 2  │ │   TSK-104 · waiting 41m             ││
│ │  needs_revision 1 · completed 5  │ │   Wait token attached · actionable  ││
│ │ EXECUTIONS 18                    │ │   [ Decide → ]                      ││
│ │  running 2 · queued 1 · failed 1 │ │ ⚠ Escalation ESC-12 · retry_exhausted││
│ │  succeeded 14                    │ │   TSK-097 · open 12m                ││
│ │ REVIEWS     6                    │ │   [ Decide → ]                      ││
│ │  pending 2 · passed 3 ·          │ └──────────────────────────────────────┘│
│ │  changes_requested 1 · escal. 0  │ ┌ ACTIVE WORK ───────────────── LIVE ─┐│
│ │ ESCALATIONS open 1               │ │ ● EX-88 TSK-104 Attempt 2/3         ││
│ │ APPROVALS  pending 1             │ │   Claude Implementer · ♥ 6s         ││
│ └──────────────────────────────────┘ │ ○ EX-92 TSK-111 Queued 3m           ││
│                                      │   agent not yet assigned            ││
│ ┌ WAITING IN THIS PROJECT ─ DERIVED ┐└──────────────────────────────────────┘│
│ │ Waiting on founder approval   1   │┌ REVIEWS ─────────────────────── LIVE ┐│
│ │ Awaiting reviewer callback    1   ││ ⧗ RV-31 EX-88  iteration 1 of 3      ││
│ │ Blocked · reason not recorded 1   ││   pending · dispatched 6m ago        ││
│ │ Dispatched, not yet claimed   —   ││   response deadline ≈ 2m remaining   ││
│ │  (assignment data not exposed)    ││ ✎ RV-28 EX-84  iteration 2 of 3      ││
│ └───────────────────────────────────┘│   changes_requested · 1 blocking     ││
│                                      └──────────────────────────────────────┘│
│ ┌ EVIDENCE (10 latest) ─── LIVE ────────────────────────────────────────────┐│
│ │ kind        label                     task     actor            when      ││
│ │ validation  vitest 317 passed         TSK-104  Claude Impl.     2m        ││
│ │ artifact    diff for EX-88            TSK-104  Claude Impl.     4m        ││
│ │ review      blocking: missing test    TSK-097  Claude Reviewer  9m        ││
│ │ [ Open Evidence Viewer for this project → ]                               ││
│ └───────────────────────────────────────────────────────────────────────────┘│
│ ┌ ACTIVITY ─────────── LIVE (retention-limited) ────────────────────────────┐│
│ │ 14:30:02  execution.retried    EX-88 attempt 2 started   System           ││
│ │ 14:28:44  review.changes_requested RV-28                 Claude Reviewer  ││
│ │ ⓘ Dev HQ retains the 200 most recent events and does not retain history   ││
│ │   across a restart. Older activity for this project is not available.     ││
│ └───────────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 3 — Roadmap & Sprint View

### 3.1 Purpose

Show the Founder the plan and, beside it, exactly what Dev HQ has recorded against that plan — while being unambiguous that Dev HQ does not track sprints.

This view is the most honesty-critical in the set, because a roadmap is the surface where fabrication is most tempting and most damaging.

### 3.2 Primary user question

> *What is the plan, what does the system actually show, and where do the two disagree?*

### 3.3 Information shown

Two visually distinct columns, permanently side by side:

**Left — PLAN (`preview`)**: sprints as declared in `docs/plans/` (1D, 1E, 1F …), each with objective, declared task list, and recorded completion notes status. Every element carries the `preview` badge and the column has one standing disclosure:

> **Plan data comes from planning documents, not from Dev HQ.** Dev HQ records no sprint entity and cannot confirm that any task below belongs to this sprint.

**Right — RECORDED (`live`)**: for the selected sprint, only what can be *proven* — tasks whose ids appear in the plan document AND exist in `state.tasks`, with their recorded status, executions, reviews, evidence, and escalations.

**Between them — RECONCILIATION (`derived`)**: the three honest categories:

| Category | Meaning | Why it matters |
| --- | --- | --- |
| **Matched** | Plan names it, Dev HQ has it | Real progress |
| **Planned, not recorded** | Plan names it, no such task in Dev HQ | Either not started or not tracked — the view does **not** guess which |
| **Recorded, not planned** | Task exists, no plan mentions it | Unplanned work, which a founder needs to see |

**Deferred & carried items**: rendered from the completion notes' own deferral records (e.g. 1E-8/1E-9 deferred to 1F, ADR-0002 E5 amendment carried forward), each labelled **Approved-deferred** rather than incomplete — because per the Founder decision at PE-2, their absence *is* the approved state and presenting them as gaps would itself be misleading.

### 3.4 Actions available

Select sprint · open a matched task · open the plan document path (shown as a repo path, copyable, not a fabricated link) · filter reconciliation by category · copy a reconciliation summary.

**No actions that write anything.** There is no sprint entity to write to, so there is no "move to sprint", no "mark done", no drag-and-drop. Offering a control that cannot persist would be the worst possible behavior here.

### 3.5 States

Sprint selected / no sprint selected · plan document found / not found · reconciliation clean / has planned-not-recorded / has recorded-not-planned · sprint declared complete / active / not started.

### 3.6 Empty states

- No plan documents: **No planning documents are available to this view.** Roadmap content comes from `docs/plans/`.
- Sprint has no matched tasks: **No task in Dev HQ matches this sprint's declared items.** This does not mean the work did not happen; it means Dev HQ has no task record for it.
- Reconciliation empty (nothing to compare): **Nothing to reconcile.**

### 3.7 Loading states

Plan column is effectively static and renders immediately. Recorded column skeletons until the snapshot arrives. **The reconciliation panel must not render until both sides are present** — a half-loaded reconciliation would show false "planned, not recorded" rows, which is a fabricated gap. Until then: `Comparing plan to recorded state…`

### 3.8 Failure states

- Plan document unreadable → left column shows `Plan document could not be read: <path>` and the reconciliation is suppressed with `Cannot reconcile without the plan.`
- Snapshot unavailable → right column stale/disconnected; reconciliation suppressed with `Cannot reconcile against a stale snapshot.` **Suppression, not stale reconciliation.** A reconciliation is a comparison, and a comparison against unknown data is worthless and dangerous.

### 3.9 Stale-data warning

Reconciliation is the only element in the entire design that **hard-suppresses on `degraded`**, not just `disconnected`. Rationale: every other view shows stale values whose age the Founder can judge; a reconciliation produces new *conclusions* from stale inputs, and a stale conclusion is indistinguishable from a fresh one.

### 3.10 Mobile behavior

Columns stack with a tab switch: `Plan | Recorded | Gaps`. The `Gaps` tab is the default, because the difference is the information. The standing plan disclosure is pinned above the tabs on all three, never scrolled away.

### 3.11 Accessibility considerations

Two `<section>`s with headings `Plan (from planning documents)` and `Recorded in Dev HQ` — the provenance is in the heading text, so it is heard. Reconciliation is a `<table>` with a caption stating the comparison basis and a `scope="row"` category column. Each preview-badged item's accessible name begins `From planning document:`. The suppression notice is `role="status"`.

### 3.12 Prohibited misleading behavior

1. **Must not render a burndown chart, velocity figure, or projected completion date.** No sprint entity exists; every input would be invented. This is a hard prohibition, not a phase-1 deferral.
2. **Must not render a sprint progress percentage.** Same reason.
3. **Must not present "planned, not recorded" as "not done"** or as "behind schedule". The only honest statement is that Dev HQ has no record.
4. **Must not present approved-deferred items as incomplete work or as risk.** Founder decision PE-2 made their absence the approved state.
5. **Must not merge the two columns into one list.** The visual separation *is* the provenance signal.
6. **Must not offer any write action.**
7. **Must not reconcile against a `degraded` or `disconnected` snapshot** (§3.9).

### 3.13 Text wireframe — desktop

```
┌ ROADMAP & SPRINTS                                       as of 14:32:07 (4s) ┐
│ Sprint: [ 1D ] [ 1E ] [▸1F ] [ 1G ]                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│ ⚠ PLAN DATA COMES FROM PLANNING DOCUMENTS, NOT FROM DEV HQ.                 │
│   Dev HQ records no sprint entity and cannot confirm sprint membership       │
│   for any task shown here.                                                   │
├──────────────────────────┬──────────────────┬───────────────────────────────┤
│ PLAN            PREVIEW  │ GAPS     DERIVED │ RECORDED IN DEV HQ       LIVE │
│ Sprint 1F                │                  │                               │
│ source: docs/plans/      │ MATCHED       2  │ TSK-104 Add retry telemetry   │
│  (document path shown,   │ ─────────────── │  ● active · EX-88 attempt 2/3 │
│   not linked)            │ TSK-104 ✓        │  RV-31 pending · 3 evidence   │
│                          │ TSK-110 ✓        │                               │
│ Objective (quoted):      │                  │ TSK-110 Document review vocab │
│ "Mission Control         │ PLANNED, NOT     │  ● active · EX-91 attempt 1/3 │
│  timeline, audit         │ RECORDED      2  │  no review dispatched         │
│  history, evidence and   │ ─────────────── │                               │
│  escalation surfaces."   │ 1F-3 timeline    │ ─────────────────────────────│
│                          │  read-model      │ RECORDED, NOT PLANNED      1  │
│ Declared items           │ 1F-4 evidence    │ TSK-097 Normalize evidence    │
│  1F-1 ADR-0002 E5 amend  │  panel           │  uris · needs_revision        │
│  1F-2 scorecard domain   │ ⓘ No Dev HQ task │  ⚠ ESC-12 retries exhausted   │
│  1F-3 timeline read-model│  record exists.  │  unplanned in this sprint     │
│  1F-4 evidence panel     │  This does not   │                               │
│                          │  mean the work   │                               │
│ APPROVED-DEFERRED        │  is late.        │                               │
│  1E-8 timeline (PE-2)    │                  │                               │
│  1E-9 remainder (PE-2)   │ RECORDED, NOT    │                               │
│  reviewPolicy override   │ PLANNED       1  │                               │
│  ⓘ Absence is the        │ ─────────────── │                               │
│    approved state, not   │ TSK-097          │                               │
│    a gap.                │                  │                               │
└──────────────────────────┴──────────────────┴───────────────────────────────┘
   NO BURNDOWN. NO VELOCITY. NO PROJECTED DATE. None of these are recorded.
```

---

## View 4 — Live Work Queue

### 4.1 Purpose

The operational triage surface: every unit of work Dev HQ is holding, grouped by *why it is in that state*, so the Founder can act on causes rather than scan a list.

### 4.2 Primary user question

> *What is in flight, what is waiting and why, and what is stuck?*

### 4.3 Information shown

Four lanes, in fixed order. Order is by *how much founder attention it deserves*, not by lifecycle:

**Lane 1 — Needs you** — items where the Founder is the blocker. Duplicates the Decision Inbox by design, and says so: `These N items also appear in your Decision Inbox.`

**Lane 2 — Stuck** — recorded-bad states: `failed` executions, `blocked` tasks, `needs_revision` tasks, open escalations, escalated reviews, and running executions whose heartbeat is stale.

**Lane 3 — Waiting** — grouped by reason (§7.6). Each group header: reason label, count, oldest age, and where instrumented, the relevant deadline as an explicit **projection** (`≈ 2m remaining`, dashed, italic, prefixed).

**Lane 4 — Running** — in-flight executions with owner, attempt, elapsed, heartbeat.

Every row carries: id · title · project · sprint (preview) · owner · status · age · attempt · a one-line "why". The **why is a first-class column**, never a tooltip.

Filters (URL-persisted): project, status, owner, wait reason, age threshold, `only items that need me`.

### 4.4 Actions available

Open record · open timeline · open decision surface · filter · sort (age, priority, project) · copy id · `Refresh now`.

**Deliberately absent:** no bulk actions, no "retry all", no "cancel", no reassignment. Retry is owned by the Execution Manager under a bounded budget (`MAX_EXECUTION_ATTEMPTS`); a founder-triggered retry button would let a human bypass the retry budget and the escalation path that ADR-0001/0002 exist to guarantee. The correct founder action on exhausted work is the escalation resolution (`revise` / `abandon` / `accept`), which View 11 provides. This view links there and explains why: `Automated retry is exhausted. Your options are on the escalation.`

### 4.5 States

Per lane: populated / empty / partially-unknown (wait reasons that depend on unexposed assignment data). Per row: any `LifecycleStatus`, `ExecutionStatus`, `ReviewStatus`, plus derived heartbeat health. Filter state: default / filtered / filtered-to-empty (distinct from empty).

### 4.6 Empty states

- Lane 1 empty: **Nothing is waiting on you.**
- Lane 2 empty: **Nothing is stuck.** No failed execution, blocked task, or open escalation is recorded.
- Lane 3 empty: **Nothing is waiting.**
- Lane 4 empty: **Nothing is running.**
- Filtered to empty: **No work matches these filters.** `[Clear filters]` — with the active filters listed, so the Founder never mistakes a filter for reality. This is a distinct state from lane-empty and must be visually distinct.
- Wait reasons requiring assignment data: **Dispatched-not-yet-claimed and lease-expiry states are not exposed to the browser.** Grey group, `—` count, never `0`.

### 4.7 Loading states

Lane headers render with skeleton counters (not zeros). Rows are skeleton rows at correct height. On refresh, rows update in place; **re-sorting is deferred while any row in the list has focus** (§1.7).

### 4.8 Failure states

Feed failure → Stale Ribbon; queue keeps rendering the retained snapshot with a per-lane age note. Malformed row → renders with `—` fields and `Record incomplete`. Derivation failure in one lane → that lane only shows `Could not compute this lane.`

### 4.9 Stale-data warning

Per-lane `as of` inherited from the view header. **All deadline countdowns freeze and are struck through on `degraded`/`disconnected`**, with `Countdown paused — state may be stale`. A running countdown on stale data is an actively false claim about the present.

### 4.10 Mobile behavior

Lanes become a vertical accordion in the same fixed order. Lanes 1 and 2 are expanded by default and cannot be collapsed to zero height — a collapsed "Stuck" lane on a phone is how a founder misses a failure. Lanes 3 and 4 collapse. Filters move to a bottom sheet; active filter count shows on the filter button. Rows show a two-line summary; tapping opens the bottom-sheet detail. Swipe gestures are **not** used for decisions (§9.4).

### 4.11 Accessibility considerations

Each lane is a `<section>` with `<h2>` including its count (`Stuck, 3 items`). Rows are a `<table>` with real headers including a `Why` column, so screen-reader users get the reason in the row, not in a hover. Sort controls expose `aria-sort`. Filter changes announce politely: `Filtered to 4 items in Savrio Platform.` Live row updates use a polite region, rate-limited (§1.11). Age and deadline cells include the absolute timestamp in their accessible name, since "2m ago" is not verifiable by ear.

### 4.12 Prohibited misleading behavior

1. **Must not offer retry, cancel, or reassign** (§4.4).
2. **Must not show `0` for wait reasons whose data is not exposed** — `—` only.
3. **Must not run a countdown on stale data.**
4. **Must not present a filtered-empty lane as an empty lane.**
5. **Must not group by status when the Founder asked "why"** — status is the *what*; the reason column is mandatory.
6. **Must not infer a wait reason.** If a task is `blocked` with no recorded cause, the reason is literally `Blocked · reason not recorded`. Guessing "probably waiting on dependency" is prohibited, and is specifically prohibited because dependency data returns `[]` unconditionally (§2.5).
7. **Must not hide the duplication** between Lane 1 and the Decision Inbox.

### 4.13 Text wireframe — desktop

```
┌ LIVE WORK QUEUE                                          as of 14:32:07 (4s) │
│ Filters: [Project: all ▾] [Owner: all ▾] [Reason: all ▾] [☐ Only needs me]   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ ① NEEDS YOU · 2                                                    DERIVED │
│   ⓘ These 2 items also appear in your Decision Inbox.                        │
│   ID       TITLE                    PROJECT   OWNER    STATE          WHY    │
│   TSK-104  Add retry telemetry      Savrio    You      Awaiting       Founder│
│                                                        founder        approval│
│                                                        approval 41m   gate   │
│                                                        [ Decide → ]          │
│   ESC-12   Normalize evidence uris  Savrio    You      Escalation     Retries│
│                                                        open 12m       exhaust│
│                                                        [ Decide → ]   ed 3/3 │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ ② STUCK · 3                                                           LIVE │
│   EX-84    Normalize evidence uris  Savrio    Claude   ✕ Failed       Attempt│
│                                               Impl.    attempt 3/3    budget │
│                                                                       spent  │
│   TSK-093  Wire release checklist   Savrio    —        ⛔ Blocked      Reason │
│                                                                       not    │
│                                                                       recorded│
│   EX-91    Document review vocab    Savrio    Claude   ● Running ·    No     │
│                                               Reviewer not reporting  heart- │
│                                                        2m 14s         beat   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ ③ WAITING · 4 (+1 not measurable)                                  DERIVED │
│   ▸ Waiting on founder approval ........ 1   oldest 41m                      │
│   ▸ Awaiting reviewer callback .......... 2   oldest 6m  ≈2m remaining        │
│       ┌ Projection — not a commitment. Derived from the configured response  │
│       │ deadline and the recorded dispatch time. The reviewer may already be │
│       └ dead.                                                                │
│   ▸ Waiting for agent capacity .......... 1   oldest 3m                      │
│   ▸ Dispatched, not yet claimed ......... —   assignment data not exposed     │
│   ▸ Blocked · reason not recorded ....... 1   oldest 1h 12m                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ ④ RUNNING · 2                                                         LIVE │
│   EX-88    Add retry telemetry     Savrio  Claude Impl.  ● Running 4m12s     │
│            Attempt 2 of 3 · ♥ healthy 6s ago · review policy: basic          │
│   EX-91    Document review vocab   Savrio  Claude Rev.   ● Running 1m02s     │
│            Attempt 1 of 3 · ♥ NOT REPORTING 2m14s                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 4.14 Text wireframe — mobile

```
┌────────────────────────────────┐
│ ← QUEUE      ⚙2  14:32:07 ⟳   │
├────────────────────────────────┤
│ ▼ ① NEEDS YOU              2  │
│ ┌────────────────────────────┐ │
│ │ ⚑ TSK-104 Add retry telem. │ │
│ │ Founder approval gate · 41m│ │
│ │ [ Decide → ]               │ │
│ ├────────────────────────────┤ │
│ │ ⚠ ESC-12 Normalize ev uris │ │
│ │ Retries exhausted · 12m    │ │
│ │ [ Decide → ]               │ │
│ └────────────────────────────┘ │
│ ▼ ② STUCK                  3  │
│ ┌────────────────────────────┐ │
│ │ ✕ EX-84 attempt 3/3        │ │
│ │   Attempt budget spent     │ │
│ ├────────────────────────────┤ │
│ │ ⛔ TSK-093                  │ │
│ │   Blocked · reason not     │ │
│ │   recorded · 1h 12m        │ │
│ ├────────────────────────────┤ │
│ │ ● EX-91 not reporting 2m14s│ │
│ └────────────────────────────┘ │
│ ▸ ③ WAITING          4 (+1 —) │
│ ▸ ④ RUNNING                2  │
└────────────────────────────────┘
   Lanes ① and ② cannot be collapsed.
```

---

## View 5 — Execution Timeline

### 5.1 Purpose

The forensic record of one piece of work: every attempt, dispatch, claim, heartbeat lapse, reclaim, failure, retry, review iteration, finding, revision, evidence write, escalation, and founder decision, in order, with the causal links between them.

This is the design for the panel deferred to Sprint 1F as 1E-8 (Founder decision, PE-2).

### 5.2 Primary user question

> *What exactly happened to this work, in what order, and why is it where it is?*

### 5.3 Information shown

**Header:** task title, execution id, current status, attempt N of 3, review policy, owning agent, revision provenance (`Revision authorized by review RV-28` or `Revision authorized by your escalation decision on ESC-11`), and the revision chain position.

**Two synchronized representations:**

*(a) Attempt lanes* — a horizontal band per attempt, so retries read as parallel history rather than a flat list:

```
Attempt 1  ├─dispatch─claim─run──────✕fail─┤
Attempt 2  │                    ├─dispatch─claim─run──●
```

*(b) Chronological stream* — a reverse-chronological list of typed entries. Entry types, all drawn from records that exist today:

| Entry | Source record | Notes |
| --- | --- | --- |
| Execution created | `Execution.createdAt` | carries the immutable `ExecutionRequest` |
| Assigned | `execution.assigned` event | |
| Dispatched | `AgentAssignment.dispatchedAt` / `triggerRunId` | **`—` until assignments are exposed** (§2.5) |
| Claimed | `execution.claimed` event | |
| Heartbeat lapse | derived from `lastHeartbeatAt` vs `AGENT_HEALTH_STALE_AFTER_MS` | **`—` until exposed** |
| Reclaimed | `execution.reclaimed` event | lease sweeper recovered it |
| Succeeded / Failed | `execution.succeeded` / `Execution.status` | |
| Retried | `execution.retried` event | shows attempt N → N+1 |
| Exhausted | `execution.exhausted` event | terminal for automated recovery |
| Cancelled | `execution.cancelled` event | |
| Review started | `review.started` | with `iteration N of 3` and dispatch attempt count |
| Finding recorded | `review.finding_recorded` + `ReviewFinding` | severity always shown |
| Review passed | `review.passed` | |
| Changes requested | `review.changes_requested` | links to the authorized revision execution |
| Review escalated | `review.escalated` | **must show `escalationReason`** (PE-3) |
| Escalation raised | `escalation.raised` | with `origin` |
| Escalation resolved | `escalation.resolved` | with `resolution` and the deciding user |
| Evidence recorded | `Evidence` | kind, label, link to record |
| Workflow stage change | `WorkflowRunRecord.stage` | founder-request path |
| Founder decision | `Approval.decidedAt` / `decidedByUserId` | |

**Causal links:** each entry that authorized another shows the link explicitly — `changes_requested → EX-88`, `revise → EX-93`. This is what makes the revision chain legible instead of a pile of executions on one task.

**Retention disclosure (mandatory):** a terminal marker at the oldest end of the stream:

> **Earlier activity is not available.** Dev HQ retains the 200 most recent events and does not retain any history across a restart. This timeline may be incomplete.

Rendered whenever the event list is at cap **or** whenever the oldest stream entry is newer than the execution's `createdAt` — the second condition is what catches silent truncation.

**Provenance:** the whole stream is badged `derived` until the 1E-8 read-model exists, with the explanation `Merged in the browser from events, executions, reviews, findings, evidence and escalations. No server-side timeline record exists.`

### 5.4 Actions available

Switch scope (this execution / all attempts of this task / whole revision chain) · filter by entry type · jump to an entry's source record · copy execution id, trigger run id, or a plain-text timeline excerpt for an audit record · open the linked review, evidence, or escalation · `Refresh now`.

No mutating actions. The timeline is a record; decisions happen on decision surfaces.

### 5.5 States

Execution `queued` / `running` / `succeeded` / `failed` / `cancelled`. Timeline complete / retention-truncated / partially-unknown (assignment entries). Single attempt / multi-attempt. In a revision chain / not. Review attached / none (policy `none` or absent).

### 5.6 Empty states

- Execution exists, no events: **No lifecycle events are recorded for this execution.** They may have been trimmed by retention, or the execution may predate event emission. *(Both possibilities stated; neither asserted.)*
- No review: **No review was dispatched.** Either the execution carries no review policy, or its policy is `none`. — and the actual recorded policy is shown beside it, so the Founder does not have to guess which.
- No evidence: **No evidence was recorded for this execution.**

### 5.7 Loading states

Header skeleton, then attempt lanes, then stream. Stream renders progressively in chronological batches but **must not render the retention marker until the full stream is assembled** — a premature "earlier activity unavailable" during load is a false claim of truncation.

### 5.8 Failure states

- Execution not in snapshot → §4.4 panel, with the in-memory-store explanation, since a restart is the likeliest cause and telling the Founder that is more useful than "not found".
- Referenced review/evidence/escalation missing from the snapshot → the entry renders with the id and `Referenced record not in current snapshot`, keeping the link visible so the id remains auditable.
- Merge derivation failure → `Timeline could not be assembled from this snapshot.` plus a raw-records fallback list, because a forensic view failing to a blank page is worse than failing to raw data.

### 5.9 Stale-data warning

Elapsed timers on the current attempt freeze on `degraded`/`disconnected` with `Paused — snapshot may be stale`. The header status pill gains a `snapshot` qualifier: `● Running (as of 14:32:07)`.

### 5.10 Mobile behavior

Attempt lanes become a vertical attempt selector (`Attempt 1 ✕ · Attempt 2 ●`) with the selected attempt's stream below. The stream is a single-column vertical timeline with a left rail of typed icons. Entry detail expands inline; ids are truncated with a copy affordance. Filter and scope move to a bottom sheet. The retention marker is pinned at the end of the list, not collapsible.

### 5.11 Accessibility considerations

- Stream is an ordered list `<ol>`; each entry is an `<li>` whose accessible name is `<time absolute> — <entry type> — <detail>`. Type is never conveyed only by icon; every icon has adjacent text.
- Attempt lanes are a tablist (`Attempt 1 of 3, failed`) with arrow-key navigation; selecting an attempt moves focus to the stream heading and announces the change.
- Causal links use descriptive link text (`Revision execution EX-88 authorized by this review`), never "here".
- Chronology is stated in the list heading (`Newest first`) so ordering is not inferred from layout.
- The retention marker is `role="note"` and is part of the reading order, not a visual footnote.
- Long ids use `<code>` with an accessible name that spells the id in groups, since character-by-character ids are hostile to screen readers.

### 5.12 Prohibited misleading behavior

1. **Must not present the stream as complete** without evaluating the retention condition (§5.3).
2. **Must not fabricate a stage for a `failed` workflow run.** `STAGE_INDEX.failed === -1`; the entry reads `Technical failure — stage not recorded`.
3. **Must not infer dispatch, claim, lease, or heartbeat entries** from other records while assignment data is unexposed. Absent entries are `—`, not omitted silently and not reconstructed.
4. **Must not collapse distinct attempts into one row.** The retry story is the point.
5. **Must not present a review escalation without its `escalationReason`** (PE-3). `review_exhausted` alone conflates "the reviewer kept rejecting the work" with "the reviewer never answered", which demand different founder responses.
6. **Must not interleave entries whose ordering is not recorded.** Entries with equal timestamps render as a tie group with `same timestamp — order not recorded`, rather than an invented sequence.
7. **Must not show a progress bar or ETA for the running attempt.**
8. **Must not imply the timeline is durable.** The in-memory-store caveat is mandatory on this view.

### 5.13 Text wireframe — desktop

```
┌ Savrio Platform ▸ Sprint 1F⚠ ▸ TSK-104 ▸ EX-88 ▸ Attempt 2   as of 14:32:07 │
├──────────────────────────────────────────────────────────────────────────────┤
│ EXECUTION TIMELINE — EX-88                                    ● Running 4m12s│
│ Add retry telemetry to dispatch · Attempt 2 of 3 · policy: basic             │
│ Owner: Claude Implementer (implementation, claude-code)                       │
│ Revision authorized by review RV-28 (changes_requested) · chain position 2   │
│ ⓘ DERIVED — merged in the browser from events, executions, reviews, findings,│
│   evidence and escalations. No server-side timeline record exists.            │
├──────────────────────────────────────────────────────────────────────────────┤
│ Scope: [▸this execution] [all attempts of TSK-104] [revision chain]          │
│ Types: [all ▾]                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ ATTEMPTS                                                                     │
│ 1 ✕ ├─created─assigned──?dispatch──claimed─running───────✕ failed 14:22:10─┤ │
│ 2 ● │                                     ├─created─assigned─claimed─●running│
│ 3   │  not started (budget: 3)                                               │
│      ⓘ dispatch and lease markers show "?" — assignment data is not exposed  │
│        to the browser, so these moments cannot be placed.                    │
├──────────────────────────────────────────────────────────────────────────────┤
│ STREAM · newest first                                                        │
│ 14:32:01  ♥  Heartbeat                    —  not exposed                     │
│ 14:30:02  ↻  Execution retried            attempt 1 → attempt 2   System     │
│               └─ authorized EX-88 attempt 2                                  │
│ 14:29:58  ✕  Execution failed             attempt 1 · timeout      System     │
│ 14:29:40  📄 Evidence recorded            artifact · "diff for EX-88 a1"     │
│                                           Claude Implementer  → open         │
│ 14:28:44  ✎  Changes requested            RV-28 · iteration 2 of 3           │
│               1 blocking, 1 advisory      Claude Reviewer                    │
│               └─ authorized revision execution EX-88   → open review         │
│ 14:28:44  ⚖  Finding recorded             BLOCKING · testing ·               │
│                                           "retry path has no test"  → open   │
│ 14:26:10  ⧗  Review started               RV-28 · dispatch attempt 1 of 3    │
│ 14:25:02  ✓  Execution succeeded          EX-84 (reviewed execution)         │
│ 14:24:58  ✓  Evidence recorded            validation · "vitest 317 passed"   │
│ 14:20:11  ▶  Execution claimed            Claude Implementer                 │
│ 14:20:09  ⇢  Execution dispatched         — not exposed                      │
│ 14:20:08  ⊕  Execution assigned           Claude Implementer                 │
│                                           required: implementation           │
│ 14:20:07  ⊙  Execution created            request (immutable):               │
│                                           "Add retry telemetry to dispatch"  │
│                                           preferred agent: none              │
│ ──────────────────────────────────────────────────────────────────────────── │
│ ⓘ EARLIER ACTIVITY IS NOT AVAILABLE. Dev HQ retains the 200 most recent      │
│   events and does not retain history across a restart. This timeline may be  │
│   incomplete.                                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---
## View 6 — Agent and Human Queue

### 6.1 Purpose

Answer "who owns each item" from the *owner's* side rather than the work's side: one row per actor, what they hold, whether they are healthy, and what they have finished.

### 6.2 Primary user question

> *Who is doing what right now, is anyone stalled, and what is waiting on me personally?*

### 6.3 Information shown

**Two lanes, structurally different because the system is structurally asymmetric.**

**Agent lane (live).** One row per `Agent` in the registry:
name · role · provider · `AgentAvailability` · derived `AgentHealth` (`healthy` / `stale` → "Not reporting" / `unavailable`) · `lastActiveAt` · capabilities · currently held executions with attempt and elapsed · reviews credited to them · completed count in the retained window.

Health derivation is Recorded-adjacent and must state its basis: `Not reporting — last activity 4m 12s ago, threshold 60s.` A health verdict without its threshold is unauditable.

**Founder lane (derived).** Exactly the items awaiting the Founder: pending approvals and open escalations, with age and the decision required. Labelled **You (Founder)** with the note:

> Dev HQ records no human assignees other than you. Tasks carry an agent assignee only.

**Capacity note.** Agents are capacity-limited (the constants describe a capacity-one race for an agent), but capacity is not exposed to the browser. The lane therefore shows *held work* as a fact and renders **`Capacity —`** with `not exposed`, rather than computing a utilization bar.

**Reserved slot:** a placeholder region for the agent scorecard panel, rendered as an Empty (dark) state so a later panel has a home.

> **Corrected in v1.1.0.** v1.0.0 called scorecards "approved-deferred (D-E6)". That is no longer accurate: **two governing documents conflict and the Founder has not ruled.** ADR-0001 D8 and ADR-0002 D-E6/E9 place scorecards *in* Sprint 1F; the canonical 1F scope excludes executive analytics, and the Sprint 1F plan resolves them *out* of 1F pending Founder confirmation and an ADR-0002 amendment (its Q-6). **The slot's copy must therefore assert neither.** Required wording: *"Agent performance scorecards are not implemented. Whether they belong to Sprint 1F is an open conflict between ADR-0001 D8 / ADR-0002 D-E6 and the approved 1F scope; the Founder has not ruled."* Rendering "deferred" would state a decision that has not been made — the same class of error this document exists to prevent.

### 6.4 Actions available

Open agent detail · open an agent's current execution timeline · filter to unhealthy only · open a founder-lane decision · copy agent id · `Refresh now`.

**Deliberately absent:** no pause/resume agent, no reassign, no manual capability edit. Agent selection is owned by the Execution Manager's routing policy, which is persisted per execution precisely so retries reproduce it; a founder-side reassignment control would break that guarantee. If the Founder needs different routing, the honest path is an escalation `revise`, which resets the loop by design.

### 6.5 States

Per agent: `available` / `busy` / `offline` / `waiting` × health `healthy` / `stale` / `unavailable`. Note that these are two independent axes and the row must show both — an agent can be `busy` and `stale`, which is precisely the dangerous combination and must be visually louder than either alone.

Founder lane: has items / empty. Whole view: populated / no agents registered / disconnected.

### 6.6 Empty states

- No agents: **No agents are registered.** Dev HQ cannot dispatch work without a registered agent.
- Agent holds nothing: **Holding no work.**
- Founder lane empty: **Nothing is waiting on you.**
- Scorecard slot: **Agent performance scorecards are not implemented.** Aggregate reliability, review pass rate, and retry rate are approved-deferred (ADR-0002 D-E6).

### 6.7 Loading states

Rows skeleton at full height. Health badges do not render until `lastActiveAt` is known — an unknown health must not momentarily render as healthy, which is the most consequential loading-flicker in the design.

### 6.8 Failure states

- Agent referenced by an execution but absent from the registry → a row rendered from the id alone, labelled `Not in registry`, with the executions it holds. Hiding it would hide running work.
- Health cannot be derived (`lastActiveAt` null) → `Health unknown — no activity recorded`, never `healthy`.

### 6.9 Stale-data warning

Health is time-relative, so on `degraded`/`disconnected` **every health badge is suffixed with `(as of 14:32:07)`** and staleness ages are frozen. A health verdict computed from a stale clock is worse than none, so the view additionally shows: `Health verdicts are computed from a snapshot taken 3m ago and may be out of date.`

### 6.10 Mobile behavior

Founder lane first, always, because it is the actionable one. Agent lane below as cards: name + role on line 1, availability + health on line 2, held work on line 3. Unhealthy agents sort to the top of the agent lane and carry a left accent bar. Filter to unhealthy is a single toggle chip.

### 6.11 Accessibility considerations

Two `<section>`s with headings naming the lane and its count. Agent rows are `<tr>` with `Availability` and `Health` as separate columns and separate accessible values — never a single merged badge, since they are independent facts. Health thresholds are in the cell's accessible name. `aria-sort` on sortable columns. The unhealthy-only filter announces its result count.

### 6.12 Prohibited misleading behavior

1. **Must not merge availability and health into one status.** They answer different questions and disagree meaningfully.
2. **Must not render a utilization or capacity bar** while capacity is unexposed.
3. **Must not render `healthy` for an agent with no recorded activity.**
4. **Must not imply human teammates exist.** The Founder lane is explicitly the Founder, with the structural note in §6.3.
5. **Must not offer pause/reassign controls** (§6.4).
6. **Must not omit an off-registry agent that holds running work.**
7. **Must not present the scorecard slot as an error or as a gap** — it is approved-deferred.

### 6.13 Text wireframe — desktop

```
┌ AGENT AND HUMAN QUEUE                                    as of 14:32:07 (4s) │
│ [☐ Show only unhealthy]                                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ YOU (FOUNDER) · 2 items                                              DERIVED │
│ ⓘ Dev HQ records no human assignees other than you. Tasks carry an agent     │
│   assignee only.                                                             │
│  ⚑ Approve founder-request gate   TSK-104   waiting 41m   [ Decide → ]       │
│  ⚠ Resolve escalation ESC-12      TSK-097   open 12m      [ Decide → ]       │
├──────────────────────────────────────────────────────────────────────────────┤
│ AGENTS · 4 registered                                                   LIVE │
│ AGENT              ROLE            AVAILABILITY  HEALTH        HOLDING       │
│ ─────────────────────────────────────────────────────────────────────────────│
│ Claude Implementer implementation  ● Busy        ● Healthy     EX-88         │
│  claude-code                                     6s ago        attempt 2/3   │
│  caps: implementation, corrections                             4m 12s        │
│  Capacity —  not exposed                                                     │
│ ─────────────────────────────────────────────────────────────────────────────│
│ ▌Claude Reviewer   review          ● Busy        ⚠ NOT         EX-91         │
│ ▌ claude-code                                      REPORTING   attempt 1/3   │
│ ▌ caps: review, qa                                 last 2m14s  1m 02s        │
│ ▌ ⚠ Busy AND not reporting. Last activity 2m 14s ago, threshold 60s.         │
│ ─────────────────────────────────────────────────────────────────────────────│
│ Executive          routing         ● Available    ● Healthy     —            │
│ Orchestrator                                      31s ago                    │
│  caps: routing, sequencing, escalation                                       │
│ ─────────────────────────────────────────────────────────────────────────────│
│ Claude Validator   validation      ○ Offline      ⊘ Unavailable —            │
│  caps: validation, gates                          last 2h 04m                │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌╌ AGENT SCORECARDS ╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ NOT IMPLEMENTED ╌╌╌╌╌╌╌┐│
│ ╎ Aggregate reliability, review pass rate, and retry rate per agent are    ╎│
│ ╎ approved-deferred (ADR-0002 D-E6). Nothing is measured here yet.         ╎│
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘│
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 7 — Review Center

### 7.1 Purpose

Show every quality check: what is under review, at what iteration, what reviewers found, what is spent, and what escalated — with the two escalation causes never conflated.

### 7.2 Primary user question

> *What is being quality-checked, what did reviewers find, and is any review loop about to run out?*

### 7.3 Information shown

**Lanes by `ReviewStatus`**, in this order: `escalated` → `changes_requested` → `pending` → `passed`.

Per review row:
review id · reviewed execution · task · project · `iteration N of 3` · recorded `policy` (`none` / `basic` / `full`) · reviewer agent (attribution only) · `dispatchAttempts N of 3` · `dispatchedAt` · response deadline as an explicit **projection** · findings summary (`2 blocking, 1 advisory`) · authorized revision execution link · `escalationReason` when escalated.

**Iteration budget** rendered as a discrete pip meter, not a percentage: `● ● ○  iteration 2 of 3`. Two separate bounded counters exist and must never be shown as one: **review iterations** (`MAX_REVIEW_ITERATIONS = 3`) and **dispatch attempts** (`MAX_REVIEW_DISPATCH_ATTEMPTS = 3`). They mean completely different things — "the reviewer keeps rejecting" versus "the reviewer keeps not answering" — and merging them would destroy exactly the distinction PE-3 asked to preserve.

**Findings** grouped by severity, `blocking` first, with category and summary, each linking to its evidence record when one exists (`ReviewFinding.evidenceId`) and stating `no evidence record` when it does not.

**Revision chain** for a selected review: the chain of executions linked by the reviews that authorized them, so the Founder can see that iteration counting follows *this* chain and not every review the task ever had.

**Reviewer attribution note:** `Reviewer is attribution only — reviews hold no lease and consume no execution capacity.` Without this, an operator reasonably assumes a stuck review is holding an agent hostage.

### 7.4 Actions available

Open review detail · open reviewed execution's timeline · open authorized revision execution · open finding evidence · filter by status, policy, project, severity · sort by iteration or age · copy review id.

**No review actions.** Reviews resolve through the token-guarded internal callback; there is no founder-facing pass/fail control, and offering one would let a UI bypass the callback capability that the entire review lifecycle is guarded by. When a review escalates, the founder's action is the escalation resolution in View 11 — and the row links there.

Also deliberately absent: any `reviewPolicy` override control. That override is a **deferred item, verified genuinely absent** in the 1E record; a UI control for it would imply a capability that does not exist.

### 7.5 States

`pending` (dispatched, awaiting callback) · `pending` + past response deadline (recovery may re-dispatch) · `passed` · `changes_requested` (with/without an authorized revision execution recorded) · `escalated` with reason `iterations_exhausted` · `escalated` with reason `reviewer_unresponsive`. The last two are separate states with separate labels, icons, and copy — never one "Escalated" state.

| State | Label | Founder meaning |
| --- | --- | --- |
| `escalated` + `iterations_exhausted` | **Escalated — revision limit reached** | The reviewer kept finding blocking problems. The work may be wrong. |
| `escalated` + `reviewer_unresponsive` | **Escalated — reviewer never reported** | The reviewer stalled. The work may be fine and simply unjudged. |

### 7.6 Empty states

- No reviews: **No review has been dispatched.** Reviews run after a successful agent execution whose policy is `basic` or `full`.
- Lane empty: per-lane, e.g. **No review has escalated.**
- Review with no findings: **No findings were recorded.** For a `passed` review this is expected; for `changes_requested` it is a record inconsistency and is flagged as `Record inconsistent — changes requested with no recorded finding.` (Rather than silently rendering an empty list, which would look like a clean pass.)

### 7.7 Loading states

Lane skeletons with skeleton counters. Pip meters render only when `iteration` is known — a pip meter defaulting to `1 of 3` during load would misstate the budget.

### 7.8 Failure states

- Review references an execution absent from the snapshot → row renders with the id and `Reviewed execution not in current snapshot`.
- Finding references missing evidence → `Evidence record not in current snapshot`, id retained.
- Escalated review with `escalationReason: null` → **`Escalation reason not recorded`**, explicitly, never defaulted to either cause. This is the single most important failure state in this view.

### 7.9 Stale-data warning

Response-deadline projections freeze and strike through on `degraded`/`disconnected`. Pending reviews gain `(as of …)`. The view states: `A review may have resolved since this snapshot.`

### 7.10 Mobile behavior

Lanes as an accordion; `escalated` and `changes_requested` expanded by default and non-collapsible. Rows are two-line cards; the pip meter and severity chips stay visible when collapsed because they are the triage signal. Findings expand inline. Revision chain becomes a vertical stepper.

### 7.11 Accessibility considerations

Pip meters are `role="img"` with an accessible name `Iteration 2 of 3` — never bare decorative dots. Severity is a text chip, not a colour. Findings are a description list with severity as the term. The two escalation states have distinct accessible names, distinct icons, and distinct text; a screen-reader user must be able to distinguish them without colour or position. Lane headings carry counts. Deadline cells include absolute timestamps.

### 7.12 Prohibited misleading behavior

1. **Must not show one "Escalated" state.** The reason is mandatory (PE-3) and its absence is stated, never defaulted.
2. **Must not merge iteration count with dispatch-attempt count.**
3. **Must not offer a pass/fail control or a policy override** (§7.4).
4. **Must not render `changes_requested` with no findings as an empty pass.**
5. **Must not present a `pending` review past its deadline as healthy.** It reads `Pending · response deadline passed · recovery may re-dispatch`, which is what the system actually does.
6. **Must not count reviews of unrelated executions on the same task toward an iteration budget.** Iteration follows the revision chain; the view must display the chain when showing the count.
7. **Must not display `callbackToken`** or any field outside `PublicReview`.
8. **Must not imply a reviewer holds capacity.**

### 7.13 Text wireframe — desktop

```
┌ REVIEW CENTER                                            as of 14:32:07 (4s) │
│ ⓘ 0 of the 2 items in your Decision Inbox are reviews. Reviews escalate to    │
│   an escalation, which is where you decide.                                  │
│ Filters: [Status all ▾][Policy all ▾][Project all ▾][Severity all ▾]         │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ ESCALATED · 1                                                         LIVE │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ RV-19  EX-71  TSK-088 Harden dispatch idempotency         Savrio Platform│ │
│ │ ⚠ ESCALATED — REVIEWER NEVER REPORTED                                    │ │
│ │   reason: reviewer_unresponsive                                          │ │
│ │   The reviewer stalled. The work may be fine and simply unjudged.        │ │
│ │ iteration ● ○ ○  1 of 3      dispatch attempts ● ● ●  3 of 3             │ │
│ │ policy: basic · reviewer: Claude Reviewer (attribution only)             │ │
│ │ → Escalation ESC-09 (origin: review_exhausted)   [ Decide on ESC-09 → ]  │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ CHANGES REQUESTED · 1                                                 LIVE │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ RV-28  EX-84  TSK-104 Add retry telemetry                                │ │
│ │ ✎ CHANGES REQUESTED · resolved 14:28:44                                  │ │
│ │ iteration ● ● ○  2 of 3      dispatch attempts ● ○ ○  1 of 3             │ │
│ │ FINDINGS  1 blocking · 1 advisory                                        │ │
│ │  ▪ BLOCKING  testing  "retry path has no test"        → evidence EV-77   │ │
│ │  ▪ ADVISORY  naming   "prefer attemptCount"           no evidence record │ │
│ │ Authorized revision → EX-88 (attempt 2, running)                         │ │
│ │ REVISION CHAIN: EX-71 →(RV-19) EX-84 →(RV-28) EX-88 ← you are here       │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ PENDING · 2                                                           LIVE │
│ RV-31  EX-88  TSK-104  ⧗ Pending · dispatched 6m ago                         │
│        iteration ● ○ ○ 1 of 3 · dispatch ● ○ ○ 1 of 3                        │
│        ≈ 2m remaining before the response deadline                           │
│        ┌ Projection — not a commitment. Derived from the configured deadline.│
│        └ The reviewer may already be dead.                                   │
│ RV-32  EX-90  TSK-110  ⧗ Pending · RESPONSE DEADLINE PASSED                  │
│        recovery may re-dispatch · dispatch ● ● ○ 2 of 3                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▶ PASSED · 3                                                            LIVE │
├──────────────────────────────────────────────────────────────────────────────┤
│ ⓘ Reviewer is attribution only — reviews hold no lease and consume no        │
│   execution capacity.                                                        │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 8 — Evidence Viewer

### 8.1 Purpose

The proof surface. Every record that substantiates a claim of progress, browsable and filterable, with its provenance and author intact.

### 8.2 Primary user question

> *What actually proves this work happened, and who produced the proof?*

### 8.3 Information shown

**List (live).** Per `Evidence` record: `kind` (`validation` / `artifact` / `review` / `approval` / `log`) · label · summary · task · execution (or `not tied to an execution`) · `createdByAgentId` (humanized, falling back to the raw id) · `createdAt` · `uri` presence.

**Grouping options:** by kind (default), by task, by execution, by time. Filters: kind, project, task, execution, actor, time range. All URL-persisted.

**Detail drawer.** Full label and summary, the `uri` shown as literal text with a copy control, the owning task and execution with links, the creating actor, the creation time, and the evidence id.

**The `uri` rule.** `Evidence.uri` is a string that may or may not be dereferenceable, and Dev HQ does not verify it. The drawer therefore renders it as **literal, copyable text with an explicit note** — `Location as recorded. Dev HQ does not verify that this location exists or that its contents are unchanged.` It becomes an actual hyperlink only for schemes the product has verified it can resolve; until such verification exists, it is text. A blue underlined string that 404s is a broken promise about proof.

**Uniqueness note.** Evidence creation is uri-keyed and atomic (`ensureEvidence`), so one logical uri maps to one record. Where a filter shows a single record for a uri, the view may state `one record per location`; it must not present record count as a measure of work volume.

**Counts by kind** as a small summary row, Derived.

### 8.4 Actions available

Filter · group · open detail drawer · copy uri · copy evidence id · open owning task / execution / review · export the current filtered list as plain text for an audit record · `Refresh now`.

No create, edit, or delete. Evidence is written by executions and reviews; a founder-authored evidence record would be indistinguishable from machine-recorded proof, which would poison the one surface whose entire value is trustworthiness.

### 8.5 States

Populated / empty / filtered-empty / disconnected. Per record: has uri / no uri; tied to execution / standalone; actor known / actor is a raw id / actor null.

### 8.6 Empty states

- **No evidence recorded yet.** Evidence appears when an execution or review writes a validation, artifact, review, approval, or log record.
- Filtered-empty: **No evidence matches these filters** with the active filters listed and `Clear filters`.
- Task-scoped empty: **No evidence recorded for this task.** *(Not "unverified", not "failing" — the view reports absence, not judgment.)*

### 8.7 Loading states

Skeleton rows; the counts-by-kind row renders skeleton chips rather than zeros. The detail drawer opens with a skeleton and does not close on refresh.

### 8.8 Failure states

- Evidence id not in snapshot → §4.4 panel.
- Record with null `uri` → `No location recorded` (not an empty cell).
- Actor id not in the registry → raw id shown with `Actor not in registry`.
- Referenced task/execution missing → id shown with `Referenced record not in current snapshot`; the link is disabled with that reason.

### 8.9 Stale-data warning

Shared `as of`. Additional note when `degraded`/`disconnected`: `Newer evidence may exist that is not in this snapshot.` This matters more here than elsewhere: the Founder may be about to conclude "no proof exists".

### 8.10 Mobile behavior

Single-column cards: kind chip + label on line 1, task + actor + age on line 2. Group selector is a segmented control; filters in a bottom sheet. The detail drawer is a full-height bottom sheet with the uri in a monospace block and a large `Copy` button, since copying a path is the main mobile job here. Export is desktop-only (it produces a text blob a phone cannot usefully receive).

### 8.11 Accessibility considerations

The list is a `<table>` with `Kind`, `Label`, `Task`, `Actor`, `Recorded` columns; kind is text plus icon. The drawer is a labelled non-modal complementary region with focus moved to its heading on open and restored to the invoking row on close. The uri block has an accessible name that includes `Location as recorded, not verified`. Copy controls announce success politely (`Location copied`). Group and filter changes announce result counts.

### 8.12 Prohibited misleading behavior

1. **Must not render `uri` as a verified link** (§8.3).
2. **Must not present evidence count as a progress or quality measure.** Five log records are not more proof than one validation.
3. **Must not label a task with no evidence as unverified or failing.** Absence is absence.
4. **Must not allow founder-authored evidence.**
5. **Must not present `kind: "log"` alongside `kind: "validation"` as equivalent proof.** The kind chip is always visible and never abbreviated away.
6. **Must not imply evidence is durable.** The store is in-memory; the retention/durability note applies here as it does to the timeline.
7. **Must not summarize a `summary` field.** Truncation in the list is fine; the drawer shows it in full, verbatim.

### 8.13 Text wireframe — desktop

```
┌ EVIDENCE VIEWER                                          as of 14:32:07 (4s) │
│ Group: [▸Kind][Task][Execution][Time]   Filters: [Kind all▾][Project all▾]    │
│ validation 4 · artifact 3 · review 2 · approval 2 · log 5      (12 records)   │
├───────────────────────────────────────────────────┬──────────────────────────┤
│ KIND       LABEL                TASK    ACTOR  AGE│ EV-77                    │
│ ── VALIDATION ────────────────────────────────────│ review                   │
│ ✓ valid.   vitest 317 passed    TSK-104 CI     2m │ ────────────────────────│
│ ✓ valid.   tsc clean            TSK-104 CI     2m │ BLOCKING FINDING:        │
│ ✓ valid.   eslint clean         TSK-104 CI     3m │ retry path has no test   │
│ ✓ valid.   next build exit 0    TSK-104 CI     3m │                          │
│ ── ARTIFACT ──────────────────────────────────────│ SUMMARY                  │
│ 📄 artifact diff for EX-88 a1   TSK-104 C.Impl 4m │ The retry branch added   │
│ 📄 artifact diff for EX-84      TSK-104 C.Impl 9m │ in attempt 1 has no      │
│ 📄 artifact dispatch payload    TSK-097 C.Impl 22m│ covering test. Blocking  │
│ ── REVIEW ────────────────────────────────────────│ per review policy basic. │
│ ⚖ review   BLOCKING: retry path TSK-104 C.Rev  9m │                          │
│            has no test                     ▸     │ TASK      TSK-104 →       │
│ ⚖ review   ADVISORY: naming     TSK-104 C.Rev  9m │ EXECUTION EX-84 →        │
│ ── APPROVAL ──────────────────────────────────────│ REVIEW    RV-28 →        │
│ ✓ approval ESC-11 resolved      TSK-088 Evan  22m │ ACTOR     Claude Reviewer│
│            (revise)                               │ RECORDED  14:23:41       │
│ ✓ approval founder approved     TSK-081 Evan  1h  │                          │
│ ── LOG ───────────────────────────────────────────│ LOCATION AS RECORDED     │
│ 📋 log     execution.dispatched TSK-104 System 5m │ ┌──────────────────────┐ │
│ 📋 log     lease reclaimed      TSK-097 System 31m│ │ evidence://rv-28/f1  │ │
│ … 3 more                                          │ └──────────────────────┘ │
│                                                   │ [ Copy location ]        │
│ [ Export filtered list as text ]                  │ ⓘ Dev HQ does not verify │
│                                                   │   that this location     │
│ ⓘ Evidence is held in memory and does not survive │   exists or that its     │
│   a Dev HQ restart.                               │   contents are unchanged.│
└───────────────────────────────────────────────────┴──────────────────────────┘
```

---

## View 9 — Approval Center

### 9.1 Purpose

The workflow-gate decision surface: every `Approval` record awaiting the Founder, with enough context to decide and an unambiguous statement of whether the decision can currently be executed.

### 9.2 Primary user question

> *What workflow gates are waiting on my approval, and what am I actually approving?*

### 9.3 Information shown

Per pending approval:
title · summary (verbatim, in full — never truncated on the decision surface) · task · project · requesting agent · `requestedAt` and age · the workflow run's current stage · the reviewed content the approval is about (`WorkflowRunRecord.reviewSummary`, verbatim) · **actionability** and its reason.

**Actionability is the load-bearing field.** A pending approval can only be actioned once its wait token is attached (existing `ApprovalItem.actionable = Boolean(approval.waitTokenId)`). The view renders:

| Condition | Rendering | Control |
| --- | --- | --- |
| `waitTokenId` present | `Actionable — decision gate is attached` + truncated token id | Enabled |
| `waitTokenId` null | **`Cannot be actioned yet — the workflow has not attached a decision gate to this approval.`** | **Disabled, with that reason on the control** |

Decided approvals are shown in a separate, collapsed history lane with `status`, `decidedByUserId`, `decidedAt` — because a founder frequently needs to check what they already decided, and because it makes the audit trail visible.

**Consequence preview.** Before deciding, the view states what each outcome does, drawn from recorded workflow behavior rather than invention: approving advances the run; rejecting records a founder rejection distinct from a validation rejection (`WorkflowRejectionKind`). If the consequence cannot be stated from records, it says `The downstream effect is not recorded.` rather than guessing.

### 9.4 Actions available

Open decision dialog (`Approve` / `Reject`) — via §11 · open the task, execution, timeline, and evidence · copy approval id · view decided history · `Refresh now`.

`Approve` and `Reject` are the only mutating actions, are never one-click, and always pass through the confirmation dialog (§11.5).

### 9.5 States

Pending-actionable · pending-not-actionable · decision in flight (submitting) · decision confirmed by snapshot · decision failed · decision unconfirmed (§4.4 ambiguity) · approved · rejected · escalated.

Note `ApprovalStatus` includes `escalated`; when an approval is `escalated`, this view shows it and links to the escalation, so the Founder is never left looking for a decision that moved.

### 9.6 Empty states

- **No approvals are waiting on you.** Approvals appear when a workflow reaches a stage that requires your decision.
- History empty: **No approval has been decided yet.**

### 9.7 Loading states

Skeleton cards. **Decision controls do not render at all until actionability is known** — rendering an enabled button before the wait token is read would let the Founder click into a guaranteed failure. This is a deliberate exception to "render structure early".

### 9.8 Failure states

- Approval id not in snapshot → §4.4 panel.
- Task or run referenced but missing → context section shows `Referenced record not in current snapshot`; **decision controls disable**, because deciding without visible context is not an informed decision.
- Decision request fails → inline verbatim error, control re-enables, `Try again`.
- Decision unconfirmed → control **stays disabled**, `We could not confirm this decision. Refresh before deciding again.` with a `Refresh` control only.

### 9.9 Stale-data warning

On `degraded`, the confirmation dialog gains an amber line: `This decision will be sent against state from 14:32:07 (2m ago).` On `disconnected`, **all decision controls disable** with `Not connected to Dev HQ — decisions are disabled.` A decision is a write; writing from a snapshot you cannot trust is the one thing this dashboard must never facilitate.

### 9.10 Mobile behavior

Full-screen cards, one approval at a time, with `Approve` and `Reject` as full-width buttons at the bottom **separated by a 24px gap and with different weights** (`Reject` is secondary/outline) so a thumb cannot confuse them. The summary is fully expanded by default — never behind "read more" on the decision surface. Confirmation is a full-screen sheet requiring a deliberate second tap on a differently-positioned button (§11.5, §9.4 of the mobile plan).

### 9.11 Accessibility considerations

Each approval is an `<article>` with an `<h2>` of its title. The summary is regular prose in the reading order, not a tooltip. Decision buttons have accessible names including the subject: `Approve: Add retry telemetry to dispatch` — never bare "Approve", which is meaningless out of context in a screen-reader control list. Disabled controls use `disabled` plus `aria-describedby` pointing at the reason text, so the reason is announced with the control. The confirmation dialog is `role="dialog"` `aria-modal="true"`, focus-trapped, focus starts on the dialog heading (not on the confirm button), `Esc` cancels, and focus returns to the invoking control. Result is announced in a polite live region: `Approved. Add retry telemetry to dispatch.`

### 9.12 Prohibited misleading behavior

1. **Must not enable a decision control when `waitTokenId` is null.**
2. **Must not truncate the summary** on the decision surface.
3. **Must not show optimistic success.** Status changes only when the returned snapshot says so.
4. **Must not offer a retry after an unconfirmed decision** — only a refresh.
5. **Must not place `Approve` and `Reject` adjacent, same-size, same-weight**, at any breakpoint.
6. **Must not conflate a founder rejection with a validation rejection.** They are distinct (`WorkflowRejectionKind`) and are labelled distinctly everywhere.
7. **Must not allow a decision while disconnected.**
8. **Must not present the wait token id as a copyable capability.** Truncated, non-copyable, presence-only (§11.3).
9. **Must not hide an `escalated` approval.**

### 9.13 Text wireframe — desktop

```
┌ APPROVAL CENTER                                          as of 14:32:07 (4s) │
│ ⓘ 1 of the 2 items in your Decision Inbox is an approval.                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ WAITING ON YOU · 1                                                      LIVE │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ FOUNDER APPROVAL REQUIRED                              waiting 41m       │ │
│ │ Add retry telemetry to dispatch                                          │ │
│ │ Savrio Platform ▸ TSK-104 ▸ EX-84 · requested by Executive Orchestrator  │ │
│ │ Workflow stage: ③ Founder approval required (gate)                        │ │
│ │                                                                          │ │
│ │ WHAT YOU ARE APPROVING (verbatim)                                        │ │
│ │ ┌──────────────────────────────────────────────────────────────────────┐ │ │
│ │ │ Executive review summary:                                            │ │ │
│ │ │ "Request is in scope for Sprint 1F, touches dispatch instrumentation │ │ │
│ │ │  only, and carries no schema change. Recommend approval."            │ │ │
│ │ └──────────────────────────────────────────────────────────────────────┘ │ │
│ │ ▸ RECOMMENDATION — your decision. From: Executive Orchestrator.          │ │
│ │                                                                          │ │
│ │ CONSEQUENCES AS RECORDED                                                 │ │
│ │  Approve → the workflow run advances past this gate.                     │ │
│ │  Reject  → recorded as a FOUNDER rejection (distinct from a validation   │ │
│ │            rejection). The run terminates at this stage.                 │ │
│ │                                                                          │ │
│ │ ● Actionable — decision gate attached (token …a91f)                      │ │
│ │ CONTEXT  [ Task ] [ Execution ] [ Timeline ] [ Evidence 4 ]              │ │
│ │                                                                          │ │
│ │ ┏━━━━━━━━━━━━━━━━━┓            ┌─────────────────┐                       │ │
│ │ ┃    APPROVE      ┃            │     Reject      │                       │ │
│ │ ┗━━━━━━━━━━━━━━━━━┛            └─────────────────┘                       │ │
│ │  This decision is final and recorded. You will confirm it next.          │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ FOUNDER APPROVAL REQUIRED                              waiting 3m        │ │
│ │ Wire release checklist                                                   │ │
│ │ ⊘ CANNOT BE ACTIONED YET — the workflow has not attached a decision gate │ │
│ │   to this approval. Nothing you do here can take effect.                 │ │
│ │ ┌─────────────────┐  ┌─────────────────┐                                 │ │
│ │ │  Approve  (off) │  │  Reject   (off) │  ← disabled, reason above       │ │
│ │ └─────────────────┘  └─────────────────┘                                 │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▶ DECIDED · 4                                                           LIVE │
│   ✓ approved  TSK-081 Add evidence uri index   Evan · Founder  1h 04m ago    │
│   ✕ rejected  TSK-076 Add vendor SDK           Evan · Founder  2h 11m ago    │
│      recorded as: FOUNDER rejection                                          │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 10 — Founder Decision Inbox

### 10.1 Purpose

The single front door for founder-reserved work. One ordered list of everything where the Founder is the blocker, regardless of record type, so nothing waits because it lived in a view the Founder didn't open.

### 10.2 Primary user question

> *What decisions are mine, in what order should I take them, and what happens if I don't?*

### 10.3 Membership rule (must be stated in the view)

An item enters the Inbox if and only if it satisfies one of these **recorded** conditions:

1. `Approval.status === "pending"` — a workflow gate.
2. `Escalation.status === "open"` — automation is exhausted.

Nothing else. No inferred items, no "you might want to look at this", no items derived from age or heuristics. The Inbox count is the `DECIDE` badge, and the badge must mean exactly one thing.

The view states the rule verbatim, so the Founder can trust the count:

> This inbox contains every pending approval and every open escalation. Nothing else. If it is empty, no recorded decision is waiting on you.

### 10.4 Information shown

Per item: decision type · subject title · project · task · age (and `oldest first` default sort) · why it reached you · the specific decision required with its options named · actionability · a one-line consequence-of-inaction statement drawn from records.

**Consequence of inaction** must be recorded-based, not predicted:
- Pending approval: `The workflow run stays paused at this gate until you decide.` (Recorded behavior.)
- Open escalation: `Automated recovery is exhausted. No further attempt will be made until you decide.` (Recorded behavior.)

It must **not** say "the sprint will slip" or "this will delay release" — those are projections.

**Ordering.** Default: oldest first. Alternate sorts: by type, by project. **No urgency score, no priority ranking, no "recommended order".** A computed urgency ranking would be a projection driving the Founder's attention, which §2.2 forbids for exactly this reason. `Task.priority` is a recorded field and may be shown as a chip and used as an explicit, user-selected sort — but it is never blended into a synthetic score.

### 10.5 Actions available

Open the type-specific decision surface (View 9 for approvals, View 11 for escalations) · open full context (task, execution, timeline, evidence, review) · sort · filter by type or project · copy a decision summary · `Refresh now`.

**Decisions are not taken in the Inbox.** The Inbox routes; the decision surface decides. Rationale: each decision type has different options, different preconditions, and different irreversibility, and a single unified "decide" control over heterogeneous decisions is how a founder approves the wrong thing. The Inbox's job is that nothing is missed, not that everything is fast.

**Exception, mobile:** §16 defines a constrained quick-action path with full confirmation, for the two decision shapes that are safe to take from a phone. That exception is specified there and nowhere else.

### 10.6 States

Empty · populated · all-items-not-actionable (a distinct and important state: the Founder is the blocker but cannot act, which is itself an escalation-worthy condition) · disconnected (badge and list both marked unknown).

**All-items-not-actionable** renders a banner: `N items are waiting on you but none can currently be actioned. The workflow has not attached a decision gate.` This is the state where a founder would otherwise sit and stare at disabled buttons with no explanation.

### 10.7 Empty states

- **Nothing is waiting on you.** No approval is pending and no escalation is open. — plus the membership rule restated, so an empty inbox is trustworthy rather than suspicious.

### 10.8 Loading states

Skeleton rows; **the badge shows no number until the snapshot loads** (not `0`). A badge that reads `0` during load teaches the Founder to trust an unloaded badge.

### 10.9 Failure states

- Item references a missing task/project → renders with ids and `Context incomplete`; the decision link remains available but the target view will disable decisions per §9.8.
- Derivation failure → `The inbox could not be computed from this snapshot.` with a raw list of pending approvals and open escalations as a fallback, because this is the one list that must never be empty-by-failure.

### 10.10 Stale-data warning

`as of` plus, on `degraded`/`disconnected`, `An item may already have been decided.` The badge itself becomes `⚠` rather than a number when disconnected — a stale count on the primary attention badge is the single most misleading element the product could have.

### 10.11 Mobile behavior

The default landing target from any notification. Full-width cards, oldest first, decision type as a prominent chip. Each card has one primary button routing to the decision surface. The membership rule is shown once at the top, collapsible after first read (persisted per device). See §16 for quick actions.

### 10.12 Accessibility considerations

`<h1>Decision Inbox</h1>` with the count in the heading (`Decision Inbox, 2 items`). Items are an ordered list; each `<li>` is an `<article>` with an accessible name of `<type>: <subject>, waiting <age>, <actionable|not actionable>`. Sort control exposes `aria-sort`-equivalent state and announces the new order. The membership rule is regular prose in the reading order. The `all-items-not-actionable` banner is `role="status"`. Badge changes announce politely at most once per 30s.

### 10.13 Prohibited misleading behavior

1. **Must not include inferred or heuristic items.** Membership is exactly §10.3.
2. **Must not compute an urgency score or recommended order.**
3. **Must not state a projected consequence of inaction.**
4. **Must not allow a decision inline on desktop** (§10.5).
5. **Must not show `0` before load.**
6. **Must not show a numeric badge on a disconnected feed.**
7. **Must not silently drop an item whose context is incomplete.** Degraded context is shown; omission is prohibited.
8. **Must not double-count.** An escalation that arose from a review is one item, not one-per-record, and shows its full provenance chain.

### 10.14 Text wireframe — desktop

```
┌ DECISION INBOX · 2 ITEMS                                 as of 14:32:07 (4s) │
│ ⓘ This inbox contains every pending approval and every open escalation.      │
│   Nothing else. If it is empty, no recorded decision is waiting on you.      │
│ Sort: [▸Oldest first][By type][By project]   Filter: [Type all▾][Project all▾]│
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚑ APPROVAL · workflow gate                            waiting 41m       │ │
│ │ Add retry telemetry to dispatch                    priority: High       │ │
│ │ Savrio Platform ▸ TSK-104                                                │ │
│ │ WHY YOU  The founder-request workflow reached a stage that requires your  │ │
│ │          approval.                                                       │ │
│ │ DECISION Approve or Reject.                                              │ │
│ │ IF YOU DO NOTHING  The workflow run stays paused at this gate.            │ │
│ │ ● Actionable — decision gate attached                                     │ │
│ │ [ Go to approval → ]   [ Task ] [ Timeline ] [ Evidence 4 ]               │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠ ESCALATION · automation exhausted                   open 12m          │ │
│ │ Normalize evidence uris                            priority: Critical   │ │
│ │ Savrio Platform ▸ TSK-097 ▸ EX-84                                        │ │
│ │ WHY YOU  origin: retry_exhausted — 3 of 3 attempts failed.               │ │
│ │ DECISION Revise, Abandon, or Accept.                                     │ │
│ │ IF YOU DO NOTHING  Automated recovery is exhausted. No further attempt    │ │
│ │          will be made until you decide.                                  │ │
│ │ ● Actionable                                                             │ │
│ │ [ Go to escalation → ]  [ Timeline ] [ Evidence 2 ]                      │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│ NOT SHOWN HERE: reviews (they escalate into escalations), running work,      │
│ blocked tasks with no recorded decision. Those live in the Live Work Queue.  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 11 — Blockers and Escalations

### 11.1 Purpose

The surface for work automation has given up on, and for blocked work that has no decision attached — with the founder's three resolution options and the exact cause of each escalation.

### 11.2 Primary user question

> *What has automation given up on, exactly why, and which of my three options fits?*

### 11.3 Information shown

**Lane 1 — Open escalations (live), each with its full causal chain.**

Per escalation: id · `origin` · **`Review.escalationReason` when origin is `review_exhausted`** (mandatory, PE-3) · summary · task · execution · review · `raisedByAgentId` · `raisedAt` and age · `status` · the three resolution options with their recorded consequences · whether a revision has already been authorized (`revisionExecutionId`).

**Cause rendering — the PE-3 requirement, specified concretely:**

| `origin` | `Review.escalationReason` | Headline | Sub-line | What it means for the founder |
| --- | --- | --- | --- | --- |
| `retry_exhausted` | n/a | **Retries exhausted** | `3 of 3 execution attempts failed.` | The work could not be executed. |
| `review_exhausted` | `iterations_exhausted` | **Review exhausted — revision limit reached** | `3 of 3 review iterations ended in blocking findings.` | The work was executed but repeatedly judged wrong. |
| `review_exhausted` | `reviewer_unresponsive` | **Review exhausted — reviewer never reported** | `3 of 3 review dispatches went unanswered.` | The work may be fine and is simply unjudged. |
| `review_exhausted` | `null` | **Review exhausted — reason not recorded** | `The review's escalation reason is not recorded.` | Cause unknown; inspect the timeline. |

These are four visually distinct presentations, not one badge with a tooltip. The whole point of PE-3 is that grouping by `origin` alone conflates operationally different causes.

**Resolution options with recorded consequences:**

| Option | Recorded consequence | Notes shown to the Founder |
| --- | --- | --- |
| **Revise** | Authorizes exactly one new execution, and resets the review loop (the new execution deliberately carries no authorizing review). | `One new execution will be authorized. It starts with a full retry budget and a fresh review loop.` |
| **Abandon** | The escalation is resolved without further work. | `No further work will be attempted on this. This does not delete anything.` |
| **Accept** | The work is accepted as-is despite the exhausted loop. | `You are accepting work that automation did not clear. This is recorded against your user id.` |

**Idempotency disclosure.** A revise reserves its single canonical execution before creating it, so a duplicate revise cannot produce a second execution. When `revisionExecutionId` is already set, the Revise control is **disabled** with `A revision has already been authorized: EX-93.` and links to it. This is the difference between a UI that respects the invariant and one that lets the Founder try to break it.

**Lane 2 — Blocked without a decision (derived).** Tasks with `status: "blocked"` and no open escalation. These have **no founder action** because nothing recorded says what to do, and the view says so plainly: `Blocked · reason not recorded. Dev HQ records no cause and no decision for this task.` It also names why the reason is unavailable: dependency tracking is not instrumented (§2.5).

**Lane 3 — Resolved history (live, collapsed).** With `resolution`, `resolvedAt`, and the deciding user.

### 11.4 Actions available

Resolve an escalation (`Revise` / `Abandon` / `Accept`) via §11 flow · open the escalation's task, execution, review, timeline, evidence · filter by origin, reason, project · copy escalation id · view resolved history · `Refresh now`.

### 11.5 States

Open-actionable · open with revision already authorized (Revise disabled) · resolution in flight · resolution confirmed · resolution failed · resolution unconfirmed · resolved (`revise` / `abandon` / `accept`). Plus the four cause presentations above, and blocked-without-decision.

### 11.6 Empty states

- Lane 1 empty: **No escalation is open.** Automation has not exhausted its recovery on any work.
- Lane 2 empty: **No task is blocked.**
- Lane 3 empty: **No escalation has been resolved yet.**

### 11.7 Loading states

Skeletons. **Resolution controls do not render until `revisionExecutionId` is known**, for the same reason approvals wait for the wait token: rendering an enabled Revise that is guaranteed to be rejected is a broken promise.

### 11.8 Failure states

- Escalation references a review absent from the snapshot → `escalationReason` unavailable → renders the `reason not recorded` presentation with an added `Referenced review not in current snapshot`, so the Founder knows the difference between "not recorded" and "not loaded". **These two must not be collapsed.**
- Resolution request fails → inline verbatim error; control re-enables.
- Resolution unconfirmed → controls disable; `Refresh` only (§4.4).
- Origin present but summary empty → `No summary recorded.`

### 11.9 Stale-data warning

On `degraded`, the confirmation dialog states the snapshot age. On `disconnected`, all resolution controls disable. Additionally: `An escalation may already have been resolved.`

### 11.10 Mobile behavior

One escalation per full-screen card. The cause headline is the largest text on screen. The three options are stacked full-width buttons in fixed order `Revise` / `Accept` / `Abandon`, with `Abandon` visually last and secondary-destructive — never adjacent to `Revise`, because those two are the most consequential confusion pair. Each requires the confirmation sheet. Lane 2 and Lane 3 are separate tabs.

### 11.11 Accessibility considerations

Each escalation is an `<article>` with `<h2>` = the cause headline, so a screen-reader user hears the cause first. `origin` and `escalationReason` are separate labelled fields, not one string. Resolution buttons have subject-bearing accessible names (`Revise: Normalize evidence uris`) and `aria-describedby` pointing at their consequence text, so the consequence is announced with the control. The disabled Revise announces its reason. Confirmation dialog behavior matches §9.11. Resolution result announced politely with the resolution word.

### 11.12 Prohibited misleading behavior

1. **Must not show `origin` without `escalationReason` for `review_exhausted`** (PE-3). Four distinct presentations, per §11.3.
2. **Must not collapse "reason not recorded" and "review not in snapshot"** into one state (§11.8).
3. **Must not enable Revise when a revision is already authorized.**
4. **Must not describe Abandon as deletion**, or Accept as approval of quality. Accept is explicitly framed as accepting uncleared work, recorded against the Founder's id.
5. **Must not offer a founder action on a `blocked` task with no recorded cause.** An action with no recorded semantics is worse than no action.
6. **Must not present Lane 2's missing reason as a system defect.** Dependency tracking is not instrumented; the view names that.
7. **Must not place Revise and Abandon adjacent** at any breakpoint.
8. **Must not show optimistic resolution.**
9. **Must not allow resolution while disconnected.**

### 11.13 Text wireframe — desktop

```
┌ BLOCKERS AND ESCALATIONS                                 as of 14:32:07 (4s) │
│ Filters: [Origin all▾][Reason all▾][Project all▾]                            │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ OPEN ESCALATIONS · 2                                                  LIVE │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠ RETRIES EXHAUSTED                                    ESC-12 · open 12m │ │
│ │   3 of 3 execution attempts failed.                                      │ │
│ │   origin: retry_exhausted                                                │ │
│ │                                                                          │ │
│ │ Normalize evidence uris                                                  │ │
│ │ Savrio Platform ▸ TSK-097 ▸ EX-84 · raised by Execution Manager 14:20:11 │ │
│ │ SUMMARY  "Execution failed on all three attempts with provider timeout."  │ │
│ │ ATTEMPTS ✕ 1 timeout · ✕ 2 timeout · ✕ 3 timeout                          │ │
│ │                                                                          │ │
│ │ YOUR OPTIONS                                                             │ │
│ │ ┏━━━━━━━━━━━━━━┓  One new execution will be authorized. It starts with a │ │
│ │ ┃    REVISE    ┃  full retry budget and a fresh review loop.             │ │
│ │ ┗━━━━━━━━━━━━━━┛                                                          │ │
│ │ ┌──────────────┐  You are accepting work automation did not clear.       │ │
│ │ │    Accept    │  Recorded against your user id.                         │ │
│ │ └──────────────┘                                                          │ │
│ │                                                                          │ │
│ │ ┌──────────────┐  No further work will be attempted. This does not       │ │
│ │ │   Abandon    │  delete anything.                                       │ │
│ │ └──────────────┘                                                          │ │
│ │  Each option is final and recorded. You will confirm your choice next.   │ │
│ │ CONTEXT [ Timeline ] [ Evidence 2 ] [ Task ]                             │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ⚠ REVIEW EXHAUSTED — REVIEWER NEVER REPORTED           ESC-09 · open 34m │ │
│ │   3 of 3 review dispatches went unanswered.                              │ │
│ │   origin: review_exhausted   ·   reason: reviewer_unresponsive            │ │
│ │   ⓘ The work may be fine and is simply unjudged. This is NOT the same as  │ │
│ │     a reviewer repeatedly rejecting the work.                            │ │
│ │ Harden dispatch idempotency · TSK-088 ▸ EX-71 ▸ RV-19                    │ │
│ │ ⊘ REVISE UNAVAILABLE — a revision has already been authorized: EX-93 →   │ │
│ │ ┌──────────────┐  ┌──────────────┐                                       │ │
│ │ │    Accept    │  │   Abandon    │                                       │ │
│ │ └──────────────┘  └──────────────┘                                       │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▼ BLOCKED WITHOUT A DECISION · 1                                     DERIVED │
│ ┌──────────────────────────────────────────────────────────────────────────┐ │
│ │ ⛔ TSK-093 Wire release checklist          blocked 1h 12m · Savrio Platform│ │
│ │ Blocked · reason not recorded. Dev HQ records no cause and no decision   │ │
│ │ for this task. Task dependency tracking is not instrumented, so no       │ │
│ │ "blocked by" relationship can be shown.                                  │ │
│ │ No founder action is available on this item.                             │ │
│ │ [ Timeline ] [ Task ]                                                    │ │
│ └──────────────────────────────────────────────────────────────────────────┘ │
├──────────────────────────────────────────────────────────────────────────────┤
│ ▶ RESOLVED · 3                                                          LIVE │
│   ESC-11 revise   TSK-088  Evan · Founder  22m ago  → EX-93                  │
│   ESC-07 abandon  TSK-062  Evan · Founder  3h ago                            │
└──────────────────────────────────────────────────────────────────────────────┘
```

---
## View 12 — Context-Health View

> **RECONCILED IN v1.1.0 — the Context Lifecycle Manager specification now exists and answers this view's data contract.** `SPEC-CLM-001` v1.1.0 supplies the band vocabulary (its §4.7, `CLM-S5`), the sampling-interval discipline (`CLM-S8`), the no-aggregate-verdict rule (`CLM-S7`), and a `PublicContextHealth` projection. **Every item this view requested in §12.6 / CX-1…CX-6 is answered.** Three obligations flow back to this view and are applied below: the **seven-band** vocabulary replaces the three-band sketch (§12.5), bands from an unapproved policy must render **`provisional`** (§12.5.1), and Mission Control may render **only the projection** (§12.15). The subsection headings below are otherwise unchanged; what was a request is now a contract.
>
> **What did not change: the Phase-1 dark state.** The CLM owner states it directly — *"The CLM does not light up View 12. It makes the dark state data-driven… View 12's dark state is correct and should ship as designed."* Nothing in the delivered Sprint 1E baseline emits a context signal, and ADR-0001 D4's deterministic simulated agents have no context window to measure.
>
> **Still not defined here, and now for a stronger reason:** the CLM's §4.8 (`CLM-S9`) **declines** the numeric thresholds this document had offered it, and reassigns them to the **Founder as versioned policy** — because a threshold decides when work halts, which is a risk-posture decision. This document neither defines them nor accepts them. See §15.16.

### 12.1 Purpose

Tell the Founder whether the system's working memory is in a safe state — and, in Phase 1, tell them honestly that it is not measured.

### 12.2 Primary user question

> *Is context health safe, or is work at risk of degrading or dying from context pressure?*

### 12.3 Current status: not instrumented

Verified: Dev HQ records no context-window usage, no compaction event, no memory-pressure signal, and no per-run context budget. `AgentUsageMetadata` carries optional `inputTokens` / `outputTokens`, but `agent-execution-service.ts` sets `usage: null` unconditionally, and nothing persists it. There is therefore **no honest way to render a context-health value in Phase 1.**

The view exists anyway, and is reachable from the nav rail and from a first-class Home tile, because §1 established that an unanswered question must be visibly unanswered rather than absent.

### 12.4 Information shown — Phase 1 (dark state)

1. A plain statement: **Context health is not measured.**
2. What that means operationally: `Dev HQ cannot currently tell you whether an execution is near its context limit, whether a run has been compacted, or whether a run failed for context reasons rather than task reasons.`
3. The specific risk this creates, stated as a risk and not a prediction: `A failure recorded as "timeout" or "failed" may in fact have been a context exhaustion. The timeline cannot distinguish them.`
4. **What would light this up** — the requested data contract, explicitly labelled as a request pending cross-workstream review (§12.6).
5. The nearest available proxies, each labelled for exactly what it is and what it is not:
   - Execution duration (Recorded) — `long-running executions are visible, but duration is not context pressure`.
   - Attempt count and failure code (Recorded) — `repeated failures with the same code may or may not be context-related; Dev HQ does not record which`.
   - **No proxy is presented as a context-health measure.** They are presented as "the only related facts we have", grouped under a heading that says so.

### 12.5 Information shown — designed instrumented state

Specified now so the surface is ready, and so the Context Lifecycle Manager owner can see exactly what the Founder-facing consumer needs.

- **Per-session context state:** used vs available window, as a discrete band, plus the raw numbers. Recorded, not projected. **The band vocabulary is the CLM's seven values (`CLM-S5`), not this document's earlier three-value sketch:**

| Band | Founder-facing label | Meaning (CLM-owned) |
| --- | --- | --- |
| `safe` | **Safe** | Work may continue; no lifecycle action pending |
| `elevated` | **Elevated** | A lifecycle action is due or in progress; work is still sound |
| `critical` | **Critical** | Capacity or durability requires rollover or block |
| `uncertain` | **Integrity uncertain** | Context integrity is in question; mutable work is suspended |
| `blocked` | **Blocked** | Work is halted pending authority or recovery |
| `not_measured` | **Not measured** | No probe available for this execution |
| `stale` | **Stale — last sampled \<band\>** | The last sample is older than the sampling interval |

`uncertain` and `blocked` are bands, not merely lifecycle states (`CLM-S6`): *a session that is coherent-but-halted must never render as `safe`.* This is the same reasoning as §6.12 rule 1 — availability and health are independent axes — arrived at independently by the CLM owner, and it is why the vocabulary is seven values rather than three.
- **Compaction history:** each compaction event with timestamp, what triggered it, and what was retained — as timeline entries (View 5) as well as here.
- **Recovery/boot events:** where a run was resumed from a recovered context.
- **Context-attributed failures:** failures the system can attribute to context exhaustion rather than task failure — the single highest-value signal for a founder, because it separates "the work is hard" from "the harness ran out of room".
- **Fleet view:** one row per running execution with its band, so the question "is context health safe" has a single-glance answer.
- **Headroom** is Recorded (used vs limit). **Time-to-exhaustion is a projection** and must follow §2.3 in full: dashed, italic, `≈`, and never coloured by band.

### 12.5.1 Provisional bands — a new rendering requirement (added v1.1.0)

`SPEC-CLM-001` `CLM-S10`: every numeric constant is a **provisional default** until Founder-approved; an unapproved policy record is marked `provisional: true`, and **every band derived from it is emitted `provisional: true`** so that *"no consumer can present an unapproved threshold as a governed verdict."* The governance plan carries the approval vehicle as **G-11 / P-7**.

**This is a UX obligation, and it is a new claim-class case.** A provisional band is not a Projection — it is a Recorded measurement scored against an *unapproved* rule. It therefore gets its own encoding rather than being forced into one of the five existing classes:

| Aspect | Requirement |
| --- | --- |
| Label | The band label plus the suffix **"(provisional threshold)"** — never the bare band |
| Policy identity | `bandPolicyVersion` rendered beside the band, so the Founder can see which rule produced it |
| Visual | The band's own shape and label, with a hatched or outlined treatment distinguishing it from a governed band. **Not the Projection dashed style** — conflating "unapproved rule" with "statement about the future" would misinform in a new way |
| Accessible name | Begins `Provisional threshold:` |
| Counting | A provisional band **may** be counted in a per-session list; it **must not** be counted into any headline verdict, because the verdict would inherit an unapproved rule |
| Explanation | One sentence, once per view: `Band thresholds are proposed defaults awaiting Founder approval.` |

**Consequence to state plainly:** until P-7 lands, **every** band is provisional by construction, so View 12's instrumented state can show measurements and no governed verdict. That is a correct outcome, not a degraded one.

### 12.6 Data contract — ANSWERED by SPEC-CLM-001 (was: requested)

The UI needs, per execution, at minimum. **The right-hand column now records the answer rather than the request** — every row is discharged by `SPEC-CLM-001`, and the counterparty column is retained so a reader can see what was asked and what came back.

| UI need | Why the UI needs it | Obligation, and how it was discharged |
| --- | --- | --- |
| A bounded usage figure and its limit | To render a band without inventing a denominator | Provide used + limit, or an explicit "limit unknown". **DISCHARGED — CX-1**, CLM capacity signals (its §3.3) with an explicit limit |
| A discrete safety band, defined by the subsystem | So the UI does not invent thresholds — a UI-chosen threshold would be a fabricated health verdict | Define the band vocabulary and its thresholds. **DISCHARGED AND SPLIT — CX-2.** The **vocabulary** is supplied by the CLM (`CLM-S5`, seven values, §12.5). The **thresholds are declined by the CLM on governance grounds** (`CLM-S9`) and reassigned to the **Founder as versioned policy**, carried by GOV-PLAN-001 **G-11 / P-7**. The UI renders and cites both, and originates neither |
| Compaction events with timestamps | To place them on the timeline | Emit as lifecycle events, in the existing event vocabulary if possible. **DISCHARGED — CX-3**, emitted by the CLM decision ladder (its §5.4) |
| A context-attributed failure flag on failures | To stop mislabelling context exhaustion as task failure | Provide a distinguishable failure code or flag. **DISCHARGED — CX-4**, via the CLM floor conditions and session states |
| Staleness semantics | Health from a stale sample is worse than none (§6.9 precedent) | State the sampling interval so the UI can age the value. **DISCHARGED — CX-5**, and stricter than asked: `CLM-S8` puts `sampledAt` and the interval in force on **every** emitted band, and *"a consumer that cannot age a band must render no verdict."* **CX-6** (partial measurement) is discharged by `CLM-S7`, which matches §12.15 rule 4 reached independently |

The UI **will not** define the thresholds itself. If no band vocabulary is provided, this view renders raw numbers with **no verdict** — because a threshold chosen by a designer would be exactly the kind of invented authority §2 forbids.

**This refusal is not relaxed by the contract being answered — it is vindicated by it.** The CLM supplied the vocabulary precisely *because* this view declined to invent one, and then declined the numbers itself for the same class of reason one layer up. Both refusals stand. There is no state of the world in which this view originates a band, a threshold, a weight, a score, or a cost figure.

### 12.7 Actions available

Phase 1: open the "what would light this up" detail · copy the data-contract summary for the Context Lifecycle Manager owner · navigate to the proxy records (long-running executions, repeated failures).

Instrumented: filter by band · open an execution's timeline at its compaction events · filter the timeline to context events.

No actions ever mutate context state from this view.

### 12.8 States

Phase 1: `not instrumented` (the only state). Instrumented: `all safe` · `elevated present` · `critical present` · `partially measured` (some executions report, others do not — must be shown as partial, never averaged into a single healthy verdict) · `measurement stale` · `unknown`.

### 12.9 Empty states

- Dark state is the Phase 1 default (§12.4) and is **Empty (dark)**, never Empty (true).
- Instrumented with no running executions: **No execution is running, so there is no live context state to report.**

### 12.10 Loading states

Phase 1: the dark state is static and renders immediately — no skeleton, because there is nothing to wait for. This matters: a permanent skeleton would read as a broken feature rather than an unmeasured one.

### 12.11 Failure states

Instrumented: sampling failure → `Context state could not be sampled for N executions` with those executions listed, never silently excluded from a "all safe" verdict.

### 12.12 Stale-data warning

Instrumented: bands carry `(sampled 14:31:02)` and go to `Measurement stale` past the stated sampling interval. A stale `safe` band renders as `Stale — last sampled safe`, never as `safe`.

### 12.13 Mobile behavior

Phase 1: a single full-width dark card with the statement, the operational meaning, the risk, and a collapsible data-contract section. Instrumented: band summary tile at top (`2 safe · 1 elevated · 0 critical`), then a list of running executions with their bands; `critical` rows pinned to the top and non-collapsible.

### 12.14 Accessibility considerations

The dark card is a `<section>` with heading `Context health — not instrumented`, and its accessible name begins `Not instrumented:` (§2.3 rule 3). Bands, when instrumented, are text labels plus a shape/pattern, never colour alone, and their thresholds are in the accessible name (`Elevated: 74 percent of a 200,000 token window`). The `partially measured` state is announced explicitly, since a partial measurement read as complete is the failure mode with the worst consequences.

### 12.15 Prohibited misleading behavior

1. **Must not render a context-health value, score, gauge, or colour in Phase 1.**
2. **Must not use duration, attempt count, or token-less usage as a stand-in** for context health, in any visual form. They appear only under a heading stating they are not context measures.
3. **Must not invent thresholds or a band vocabulary** (§12.6). *Reinforced in v1.1.0: the vocabulary is now supplied by `CLM-S5` and the numbers are Founder policy per `CLM-S9`. There is no remaining case in which this view may originate either.*
4. **Must not average a partial measurement into a single healthy verdict.** *Now also a CLM normative rule (`CLM-S7`): sessions reporting `not_measured` are excluded from any count and reported as excluded.*
5. **Must not present a projected time-to-exhaustion as state.**
6. **Must not attribute a failure to context** without a recorded attribution.
7. **Must not render the dark state identically to a true-empty state.**
8. **Must not compute a band in the consumer.** *(Added v1.1.0.)* The CLM handoff's **B-3** limits Mission Control to a **`PublicContextHealth` projection only** — never a raw checkpoint, packet, snapshot, span set, or removal ledger — and its forbidden list names **consumer-computed bands** and **fleet verdicts averaging unmeasured sessions** explicitly. A band the UI derives itself is a fabricated verdict wearing a governed vocabulary. This follows the `PublicReview` precedent and is enforced the same way: the projection is the only shape that crosses the boundary.
9. **Must not render a provisional band as a governed verdict** (§12.5.1), and must not omit `bandPolicyVersion`.
10. **Must not render a shadow-mode band as an enforcing one.** *(Added v1.1.0.)* The CLM handoff's **B-4** records a hard floor — durable, append-only, no capacity eviction, read-after-write, linearizable CAS — and that *"the CLM cannot ship in enforcing mode on the memory store. Shadow mode can."* If a band is emitted in shadow mode, the view says so: `Shadow mode — measured, not enforcing.` A Founder who believes a halt threshold is active when it is only observed would draw exactly the wrong conclusion from a `critical` band.

### 12.16 Text wireframe — Phase 1 dark state (desktop)

```
┌ CONTEXT HEALTH                                           as of 14:32:07 (4s) │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ NOT INSTRUMENTED ╌╌╌╌╌╌╌╌╌┐│
│ ╎                                                                          ╎│
│ ╎   CONTEXT HEALTH IS NOT MEASURED.                                        ╎│
│ ╎                                                                          ╎│
│ ╎   Dev HQ cannot currently tell you whether an execution is near its      ╎│
│ ╎   context limit, whether a run has been compacted, or whether a run      ╎│
│ ╎   failed for context reasons rather than task reasons.                   ╎│
│ ╎                                                                          ╎│
│ ╎   RISK THIS CREATES                                                      ╎│
│ ╎   A failure recorded as "timeout" or "failed" may in fact have been a    ╎│
│ ╎   context exhaustion. The execution timeline cannot distinguish them.    ╎│
│ ╎                                                                          ╎│
│ ╎   ▾ WHAT WOULD LIGHT THIS UP    (pending cross-workstream review)        ╎│
│ ╎     · a bounded usage figure and its limit, per execution                ╎│
│ ╎     · a safety band vocabulary defined by the Context Lifecycle Manager  ╎│
│ ╎     · compaction events with timestamps                                  ╎│
│ ╎     · a context-attributed failure flag                                  ╎│
│ ╎     · a stated sampling interval                                         ╎│
│ ╎     [ Copy data-contract summary ]                                       ╎│
│ ╎                                                                          ╎│
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘│
├──────────────────────────────────────────────────────────────────────────────┤
│ THE ONLY RELATED FACTS DEV HQ DOES RECORD                            DERIVED │
│ ⓘ These are NOT context-health measures. They are shown because they are the │
│   nearest recorded facts, and because a founder asking about context health   │
│   deserves the real answer rather than a substitute metric.                   │
│                                                                              │
│ LONG-RUNNING EXECUTIONS (duration is not context pressure)                   │
│   EX-88  4m 12s  running   attempt 2 of 3                                    │
│   EX-91  1m 02s  running   attempt 1 of 3 · not reporting                    │
│                                                                              │
│ REPEATED FAILURES WITH THE SAME CODE (cause is not recorded)                 │
│   TSK-097  3 failures, all "timeout"  → could be context, could be the task; │
│                                          Dev HQ does not record which        │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 12.17 Text wireframe — designed instrumented state (for later)

```
┌ CONTEXT HEALTH                          as of 14:32:07 · sampled 14:31:02 (65s)│
│ BANDS (defined by Context Lifecycle Manager)   ▢ safe 2  ▨ elevated 1  ▩ crit 0│
│ ⚠ PARTIALLY MEASURED — 1 of 4 running executions did not report.               │
├───────────────────────────────────────────────────────────────────────────────┤
│ EXEC   TASK      BAND        USED / LIMIT       COMPACTIONS  ATTRIBUTED FAILS  │
│ EX-88  TSK-104   ▨ elevated  148k / 200k (74%)  1 (14:26:10) 0                 │
│        ≈ headroom exhausted in ~12m at the current rate                        │
│        ┌ Projection — not a commitment. Not a band. Not coloured.              │
│        └                                                                       │
│ EX-91  TSK-110   ▢ safe       22k / 200k (11%)  0            0                 │
│ EX-93  TSK-088   ▢ safe       61k / 200k (31%)  0            1 (14:02, recovered)│
│ EX-95  TSK-112   — not reported                 —            —                 │
│        ⓘ excluded from the band summary above; not counted as safe             │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## View 13 — Budget and Cost View

> **PENDING CROSS-WORKSTREAM REVIEW** — Cost instrumentation is not in the approved Sprint 1F scope and is not proposed here as scope. The data contract in §13.6 is a **request** to whichever workstream owns spend instrumentation (likely **future research backlog** and/or **Sprint 1F implementation planning** to confirm ownership). See §14.3 (BC-1 … BC-4).

### 13.1 Purpose

Tell the Founder what Dev HQ is spending and whether it is within budget — and, in Phase 1, tell them honestly that nothing is measured.

### 13.2 Primary user question

> *What are we spending, on what, and are we within budget?*

### 13.3 Current status: not instrumented

Verified:
- `AgentUsageMetadata` exists on the `AgentResult` contract with optional `durationMs`, `inputTokens`, `outputTokens`, `model`.
- `lib/dev-hq/agent-execution-service.ts:81` sets `usage: null` **unconditionally**.
- No store field, no `DevHqState` field, and no persisted record carries usage or cost.
- There is no budget entity, no rate card, and no spend record anywhere in the repository.

So Phase 1 has neither a numerator nor a denominator. **Any cost figure this view displayed would be fabricated in full.**

### 13.4 Information shown — Phase 1 (dark state)

1. **Cost is not measured.**
2. Why, precisely — the three facts above, stated plainly, because "not measured" without a reason invites the Founder to assume it is a bug.
3. The risk: `Dev HQ cannot tell you whether a retry loop, a review loop, or a long-running agent is expensive. Bounded retries and bounded review iterations limit how often work repeats, but they do not limit spend.`
4. **What would light this up** (§13.6).
5. The only recorded proxies, each explicitly not a cost:
   - Execution count and attempt count (Recorded) — `work volume, not spend`.
   - Review iterations and dispatch attempts (Recorded) — `repetition, not spend`.
   - Execution durations (Recorded) — `elapsed time, not spend`.
   - Model identity — **not recorded** (`usage.model` is never populated), so not even a rate could be applied.

### 13.5 Information shown — designed instrumented state

- **Spend to date** by period, project, task, agent, and model. Recorded.
- **Budget state**: spent vs authorized, as a discrete meter with the raw figures. Requires a budget entity, which does not exist.
- **Unit economics**: cost per completed task, per execution, per review iteration. Derived.
- **Cost of repetition** — the founder-relevant cut: how much was spent on attempts and review iterations that were later superseded. This is the number that makes a retry budget a business decision instead of a technical constant.
- **Burn rate and projected period spend** — **projections**, rendered per §2.3 (dashed, italic, `≈`), never coloured, never in the headline tile, never used to trigger a notification.
- **Per-decision cost context** on escalations: what has already been spent on this task, shown on the Revise/Accept/Abandon surface, because "revise" authorizes new spend and a founder should see the sunk figure.

### 13.6 Requested data contract — PENDING CROSS-WORKSTREAM REVIEW

| UI need | Obligation on the owning workstream |
| --- | --- |
| Persisted per-execution usage: input tokens, output tokens, model id, duration | Populate and persist `AgentUsageMetadata` rather than `null`; expose it in the read model |
| A rate source | Provide a rate card or a provider-reported cost; the UI will **not** hardcode prices, because a stale hardcoded price is a fabricated cost |
| A budget entity with an authorized amount and period | Without it, this view can show spend but **must not** show a budget state, a percentage, or an over/under verdict |
| Attribution to task, execution, attempt, and review iteration | Required for the "cost of repetition" cut |
| A currency and precision convention | So the UI does not round misleadingly |

If usage lands without a rate source, the view shows **token and duration figures only, with no currency anywhere.** If a rate source lands without a budget entity, the view shows **spend with no budget verdict.** Both partial states are specified so the surface can light up incrementally without ever implying more than it knows.

### 13.7 Actions available

Phase 1: expand the data contract · copy the contract summary · navigate to the proxy records.
Instrumented: change period · group by project/task/agent/model · filter · export a spend summary · open a task's cost detail.

No budget-setting control until a budget entity exists.

### 13.8 States

Phase 1: `not instrumented`. Instrumented: `within budget` · `over budget` · `no budget set` (spend-only) · `usage without rates` (tokens-only) · `partially attributed` · `stale`.

### 13.9 Empty states

- Dark state (Phase 1) — Empty (dark).
- Instrumented, no spend in period: **No spend recorded in this period.**
- Instrumented, no budget entity: **No budget is set, so no budget state can be shown.** Spend is shown below. *(Not "unlimited", not "0% used".)*

### 13.10 Loading states

Phase 1 static, no skeleton (§12.10 rationale). Instrumented: figures skeleton; **no `$0.00` placeholder ever renders**, since a zero currency figure is the most believable false number in the product.

### 13.11 Failure states

Instrumented: rate lookup failure → `Rates unavailable — showing tokens and duration only`, with currency removed entirely rather than shown as zero. Partial attribution → the unattributed portion shown as its own line labelled `Unattributed`, never distributed across projects.

### 13.12 Stale-data warning

Instrumented: `Spend as of <timestamp>` separate from the snapshot age, because spend aggregation may lag the state feed. If the spend timestamp is older than a stated tolerance, the figure is prefixed `Stale —` and the projection is suppressed entirely.

### 13.13 Mobile behavior

Phase 1: single dark card, collapsible contract section. Instrumented: period selector at top, one headline spend figure (Recorded), budget meter below if a budget exists, then a grouped list. Projections are collapsed by default on mobile and require an explicit expand, since a small screen makes an italic dashed distinction harder to hold.

### 13.14 Accessibility considerations

Dark card as in §12.14. Instrumented: currency figures include the currency in the accessible name, never symbol-only. Meters are `role="meter"` with `aria-valuenow`/`min`/`max` and a text equivalent. Projection figures' accessible names begin `Projection:`. Tables have real headers, and totals rows are marked as totals. No cost information is conveyed by colour alone (over-budget is a text label plus an icon, not a red number).

### 13.15 Prohibited misleading behavior

1. **Must not display any currency figure in Phase 1.**
2. **Must not hardcode a rate card.**
3. **Must not show a budget percentage without a budget entity.**
4. **Must not render `$0.00` as a loading or empty placeholder.**
5. **Must not present execution count, duration, or attempt count as cost.**
6. **Must not colour or badge a projection**, and must not notify on one.
7. **Must not distribute unattributed spend** across projects to make totals reconcile.
8. **Must not imply that bounded retries bound spend.** The dark state says the opposite explicitly.

### 13.16 Text wireframe — Phase 1 dark state (desktop)

```
┌ BUDGET AND COST                                          as of 14:32:07 (4s) │
├──────────────────────────────────────────────────────────────────────────────┤
│ ┌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌ NOT INSTRUMENTED ╌╌╌╌╌╌╌╌╌┐│
│ ╎   COST IS NOT MEASURED.                                                  ╎│
│ ╎                                                                          ╎│
│ ╎   WHY                                                                    ╎│
│ ╎   · Agent executions record usage as null. Nothing is captured.          ╎│
│ ╎   · No store field, read model, or record carries usage or cost.         ╎│
│ ╎   · No budget entity and no rate source exist in this system.            ╎│
│ ╎   There is neither a numerator nor a denominator, so any figure shown    ╎│
│ ╎   here would be invented in full.                                        ╎│
│ ╎                                                                          ╎│
│ ╎   RISK THIS CREATES                                                      ╎│
│ ╎   Dev HQ cannot tell you whether a retry loop, a review loop, or a       ╎│
│ ╎   long-running agent is expensive. Bounded retries (3) and bounded       ╎│
│ ╎   review iterations (3) limit how often work REPEATS. They do not        ╎│
│ ╎   limit SPEND.                                                           ╎│
│ ╎                                                                          ╎│
│ ╎   ▾ WHAT WOULD LIGHT THIS UP    (pending cross-workstream review)        ╎│
│ ╎     · persisted per-execution usage (tokens, model, duration)            ╎│
│ ╎     · a rate source — the UI will not hardcode prices                    ╎│
│ ╎     · a budget entity with an authorized amount and period               ╎│
│ ╎     · attribution to task, execution, attempt, review iteration          ╎│
│ ╎     · a currency and precision convention                                ╎│
│ ╎     [ Copy data-contract summary ]                                       ╎│
│ ╎                                                                          ╎│
│ ╎   PARTIAL LIGHT-UP IS SUPPORTED                                          ╎│
│ ╎   usage without rates  → tokens and duration only, NO currency shown     ╎│
│ ╎   rates without budget → spend only, NO budget verdict shown             ╎│
│ └╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌╌┘│
├──────────────────────────────────────────────────────────────────────────────┤
│ THE ONLY RELATED FACTS DEV HQ DOES RECORD — NONE OF THESE ARE COST   DERIVED │
│  Executions recorded ............ 18   (work volume, not spend)              │
│  Total attempts across them ..... 24   (repetition, not spend)               │
│  Superseded attempts ............  6   (repeated work, cost unknown)         │
│  Review iterations recorded .....  9   (repetition, not spend)               │
│  Longest execution duration ..... 11m 42s  (elapsed time, not spend)         │
│  Model identity ................. — not recorded, so no rate could apply     │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 14 — Notifications

### 14.1 Purpose

The record of what changed, so a Founder returning after time away can catch up without reconstructing state from scratch — and can see plainly what the system did and did not tell them.

### 14.2 Primary user question

> *What changed while I was away, and does any of it need me?*

### 14.3 Current status: derived, in-session only

Verified: there is no notification record, no delivery channel, no read/unread persistence, and no subscription model in the repository. Phase 1 notifications are therefore **derived in the browser from the event stream and the record set, and exist only for the life of the session.**

This has three consequences the view must state:

1. **Nothing is delivered anywhere.** No email, no push, no Slack. The bell is an in-app catch-up list, not a delivery guarantee.
2. **Read state does not persist across a reload** unless stored client-side; §14.5 specifies client-local read state and labels it as device-local.
3. **The catch-up window is bounded by event retention** (200 events, no durability across restart), so the list may be incomplete and must say so.

### 14.4 Information shown

- A grouped, reverse-chronological list of notification items derived per the taxonomy in §8 of this document (see **§8 Notification Taxonomy** below for classes, triggers, and rules).
- Per item: class · severity · subject · project/task · timestamp · what changed · a link to the record · read/unread (device-local).
- **Class filter** and **`Only things needing me`** toggle.
- A standing disclosure: `Notifications are derived in this browser session. Dev HQ does not send notifications anywhere.`
- The retention marker at the end of the list, identical in wording to the timeline's (§5.3).

### 14.5 Read state

Device-local only, stored client-side, and labelled: `Read state is stored on this device only.` A founder who reads on their phone and opens their laptop will see unread items again — that is stated, not hidden, because the alternative (implying synced read state) would cause a founder to believe they had already seen something they had not.

### 14.6 Actions available

Mark item read / unread · mark all read · filter by class · toggle `Only things needing me` · open the source record · `Refresh now`.

No subscription controls, no channel configuration, no snooze — none of these have a backing mechanism, and a preference control that silently does nothing is worse than no control.

### 14.7 States

Populated · empty · filtered-empty · all-read · has-unread-requiring-action · retention-truncated · disconnected (list frozen with `New activity may not be shown`).

### 14.8 Empty states

- **No activity to report.** Notifications are derived from recorded events; none are available.
- Filtered-empty: with filters listed and `Clear filters`.
- All read: **You are caught up** — with the device-local caveat repeated, because "caught up" is the exact claim that caveat qualifies.

### 14.9 Loading states

Skeleton list. **The bell badge shows no count until loaded** (§10.8 rationale).

### 14.10 Failure states

Feed failure → the list freezes with `New activity may not be shown while disconnected.` Derivation failure → `Notifications could not be derived from this snapshot`, with a link to the raw activity list on Project Overview, since the underlying events are still readable.

### 14.11 Stale-data warning

Shared `as of`, plus the frozen-list notice above. The bell badge becomes `⚠` on `disconnected` rather than showing a stale number (same rule as the Decision Inbox badge, §10.10).

### 14.12 Mobile behavior

Full-screen list from the bell. Class chips scroll horizontally. Items are two-line cards. `Only things needing me` is a prominent toggle at the top, on by default on mobile — the phone context is triage, and the desktop context is review. Tapping an item routes to the record; tapping a `P0` item routes to its decision surface.

### 14.13 Accessibility considerations

`<h1>Notifications</h1>` with unread count in the heading. List is `<ol>`; each item's accessible name is `<class>, <severity>, <subject>, <relative time>, unread`. Unread is conveyed by text and an icon, never by weight or colour alone. `Mark all read` announces `12 notifications marked read`. New items arriving are announced politely and rate-limited (§1.11) — never assertively. Class chips are a proper toggle group with `aria-pressed`.

### 14.14 Prohibited misleading behavior

1. **Must not imply delivery.** No "sent", "delivered", "notified" language anywhere.
2. **Must not imply synced read state.**
3. **Must not present the list as complete** when retention-truncated.
4. **Must not offer non-functional preference or channel controls.**
5. **Must not notify on a projection or a recommendation** as its own item (§8.4).
6. **Must not show a stale numeric badge.**
7. **Must not generate an item for something not recorded.** Every notification traces to a record, and the item links to it.

### 14.15 Text wireframe — desktop

```
┌ NOTIFICATIONS · 5 unread                                 as of 14:32:07 (4s) │
│ ⓘ Notifications are derived in this browser session. Dev HQ does not send     │
│   notifications anywhere. Read state is stored on this device only.          │
│ [All] [Decision] [Failure] [Escalation] [Review] [Progress] [Health]         │
│ [☐ Only things needing me]                              [ Mark all read ]    │
├──────────────────────────────────────────────────────────────────────────────┤
│ ● P0 DECISION REQUIRED                                     41m ago  unread   │
│   Approval pending: Add retry telemetry to dispatch                          │
│   Savrio Platform ▸ TSK-104 · a workflow gate is waiting on you              │
│   [ Go to approval → ]                                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│ ● P1 ESCALATION RAISED                                     12m ago  unread   │
│   ESC-12 retries exhausted · Normalize evidence uris                         │
│   origin: retry_exhausted · 3 of 3 attempts failed                           │
│   [ Go to escalation → ]                                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│ ● P1 EXECUTION FAILED                                      14:29:58  unread  │
│   EX-84 attempt 1 of 3 failed · timeout                                      │
│   [ Timeline → ]                                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ ● P2 CHANGES REQUESTED                                     14:28:44  unread  │
│   RV-28 iteration 2 of 3 · 1 blocking, 1 advisory                            │
│   Authorized revision EX-88                                                  │
│   [ Review → ]                                                               │
├──────────────────────────────────────────────────────────────────────────────┤
│ ○ P3 EVIDENCE RECORDED                                     14:24:58  read    │
│   validation "vitest 317 passed" · TSK-104                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ ⓘ EARLIER ACTIVITY IS NOT AVAILABLE. Dev HQ retains the 200 most recent      │
│   events and does not retain history across a restart.                       │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 15 — Release View

> **PENDING CROSS-WORKSTREAM REVIEW** — Release state is process-documented but not system-recorded. This view's structure intersects the **governance and documentation planning** workstream, which owns `RELEASE_PROCESS.md` and `VERSIONING_POLICY.md`. This document does not redefine the release process; it designs a Founder-facing read of it and names the contract that would make it authoritative. See §14.3 (RL-1 … RL-3).

### 15.1 Purpose

Answer "what is the next gate?" for shipping: which process gates exist, which have recorded evidence behind them, and which are unverified.

### 15.2 Primary user question

> *What stands between the current work and a release, and which gates are actually satisfied?*

### 15.3 Current status: process-declared, not system-recorded

Verified: no release entity, no version record, no gate record, no deployment record. `RELEASE_PROCESS.md` and `VERSIONING_POLICY.md` are process documents. Sprint 1E's baseline was marked with a **descriptive tag** (`sprint-1e-baseline`), explicitly *not* a version release tag — which is itself the clearest illustration that release state lives in process and git, not in Dev HQ.

The view therefore has two halves and must never blend them.

### 15.4 Information shown

**Left — GATES (`preview`)**: the gates declared by the release process, in order, each labelled as a process declaration. The standing disclosure:

> **Gates come from the release process document, not from Dev HQ.** Dev HQ records no release, no version, and no gate status. Nothing below is a system-verified release state.

**Right — RECORDED EVIDENCE (`live`)**: for each gate, the recorded artifacts that bear on it — evidence records of kind `validation`, passed reviews, resolved escalations, decided approvals — with **explicit statements of what they do and do not prove.**

**Gate status vocabulary — three values only, and the third is the honest default:**

| Value | Meaning | Requirement |
| --- | --- | --- |
| **Evidence recorded** | At least one recorded artifact maps to this gate | Artifacts listed, each linked |
| **No evidence recorded** | No recorded artifact maps to this gate | Never rendered as "failed" |
| **Not verifiable here** | The gate is a human or process judgment Dev HQ cannot record | e.g. "Founder approves the release" |

There is deliberately **no "Passed" value.** Dev HQ does not record gate satisfaction, so it cannot assert it. "Evidence recorded" is the strongest honest claim, and the difference between those two labels is the difference between a dashboard and a rubber stamp.

**Next gate** — the nearest gate with no recorded evidence, presented as Derived with its basis stated: `Next gate: independent code review. Basis: no passed review record maps to this gate.` When the mapping is ambiguous, it renders `Next gate cannot be determined from records.`

**Blocking conditions** — recorded facts incompatible with a release: open escalations, failed executions, escalated reviews, pending approvals. Listed as facts, not as a verdict.

### 15.5 Actions available

Open an evidence record · open a review, escalation, or approval · copy a release-readiness summary (a plain-text digest of gates, evidence, and blocking facts, useful for the release record) · filter to gates with no evidence.

**No release actions.** No "cut release", no "mark gate passed", no version bump. There is nothing to write to, and a control that appears to advance a release without doing so is the most dangerous possible affordance in this product.

### 15.6 States

Gates loaded / process doc unavailable · evidence mapped / unmappable · has blocking facts / none · next gate determinable / not determinable.

### 15.7 Empty states

- No gates available: **No release process document is available to this view.**
- No evidence for any gate: **No recorded evidence maps to any release gate.** *(Not "not ready", not "0% ready".)*
- No blocking facts: **No open escalation, failed execution, escalated review, or pending approval is recorded.** — followed immediately by `This is not a release approval.` Because that list going quiet is exactly the moment a founder is tempted to read it as a green light.

### 15.8 Loading states

Gate list (static) renders immediately; evidence mapping skeletons. **Gate statuses do not render until evidence loads** — a momentary "No evidence recorded" across all gates would be a false negative, which on this view could stall a release.

### 15.9 Failure states

- Process doc unreadable → gates omitted, evidence half still renders under `Recorded facts relevant to a release`, since the facts are useful without the gate frame.
- Evidence mapping fails → per-gate `Evidence could not be mapped`, never defaulted to "no evidence".

### 15.10 Stale-data warning

Because a release decision is high-consequence, this view carries a stronger notice than others: on `degraded` or `disconnected`, a banner reads `Do not make a release decision from this snapshot. State is from 14:32:07 (3m ago).` and the `Copy release-readiness summary` action **disables** — an exported stale summary could outlive the session and be mistaken for a record.

### 15.11 Mobile behavior

Tabs: `Gates | Evidence | Blocking`. `Blocking` is the default when any blocking fact exists, otherwise `Gates`. Each gate is a card with its status label and evidence count; tapping expands the mapped artifacts. The standing disclosure is pinned above the tabs on all three.

### 15.12 Accessibility considerations

Gates are an ordered list with each item's status in its accessible name (`Gate 4 of 7, independent code review, no evidence recorded`). The preview provenance is in the section heading text. The three status values are text labels with distinct icons, never colour alone — particularly important here, since a green/grey distinction would be read as pass/fail. Blocking facts are a labelled list, and the `This is not a release approval` sentence is in the reading order, not a visual footnote.

### 15.13 Prohibited misleading behavior

1. **Must not render a "Passed" or "Ready" gate status**, or a release-readiness percentage or score.
2. **Must not present "no blocking facts" as approval to release.**
3. **Must not offer any release action.**
4. **Must not render "no evidence recorded" as "failed".**
5. **Must not blend the process-declared and recorded halves.**
6. **Must not present a descriptive git tag as a version release.**
7. **Must not allow a readiness summary export from a stale snapshot.**
8. **Must not infer gate satisfaction from evidence count.** Four validation records do not satisfy a review gate.

### 15.14 Text wireframe — desktop

```
┌ RELEASE                                                  as of 14:32:07 (4s) │
│ ⚠ GATES COME FROM THE RELEASE PROCESS DOCUMENT, NOT FROM DEV HQ. Dev HQ      │
│   records no release, no version, and no gate status. Nothing below is a     │
│   system-verified release state.                                             │
├──────────────────────────────────────────────────────────────────────────────┤
│ NEXT GATE                                                            DERIVED │
│ Independent code review                                                      │
│ Basis: no passed review record maps to this gate.                            │
├─────────────────────────────────────────┬────────────────────────────────────┤
│ GATES                          PREVIEW  │ RECORDED EVIDENCE            LIVE  │
│ ① Full validation suite green            │ ● Evidence recorded · 4 artifacts  │
│                                          │   ✓ vitest 317 passed  TSK-104     │
│                                          │   ✓ tsc clean          TSK-104     │
│                                          │   ✓ eslint clean       TSK-104     │
│                                          │   ✓ next build exit 0  TSK-104     │
│                                          │   ⓘ Proves these commands were     │
│                                          │     recorded as passing. Does not  │
│                                          │     prove the gate is satisfied.   │
│ ─────────────────────────────────────────┼────────────────────────────────────│
│ ② Independent code review                │ ○ No evidence recorded             │
│                                          │   No passed review maps here.      │
│                                          │   Not the same as "failed".        │
│ ─────────────────────────────────────────┼────────────────────────────────────│
│ ③ Architecture commit-gate review        │ ● Evidence recorded · 1 review     │
│                                          │   ⚖ RV-22 passed  TSK-088          │
│ ─────────────────────────────────────────┼────────────────────────────────────│
│ ④ Founder approves the release           │ ◌ Not verifiable here              │
│                                          │   Dev HQ records no release        │
│                                          │   approval type.                   │
│ ─────────────────────────────────────────┼────────────────────────────────────│
│ ⑤ Version tag per VERSIONING_POLICY      │ ◌ Not verifiable here              │
│                                          │   Dev HQ records no version.       │
│                                          │   ⓘ sprint-1e-baseline is a        │
│                                          │     descriptive tag, not a release.│
├─────────────────────────────────────────┴────────────────────────────────────┤
│ RECORDED FACTS INCOMPATIBLE WITH A RELEASE                              LIVE │
│  ⚠ 2 open escalations   ESC-12, ESC-09                                       │
│  ✕ 1 failed execution   EX-84                                                │
│  ⚑ 1 pending approval   TSK-104                                              │
│  ⓘ These are recorded facts, not a verdict. An empty list here would NOT be   │
│    a release approval.                                                       │
│                                                                              │
│ [ Copy release-readiness summary ]   (disabled when the snapshot is stale)    │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## View 16 — Mobile Quick-Action Experience

### 16.1 Purpose

Let the Founder unblock Dev HQ from a phone, in under 30 seconds, without ever making an under-informed decision.

### 16.2 Primary user question

> *Can I safely clear what's waiting on me right now, from here?*

### 16.3 Design position

Mobile is **not** a shrunken desktop. It is a *triage device*. The mobile experience optimizes for two jobs and deliberately deprioritizes everything else:

1. **See whether anything needs me** (and how badly).
2. **Clear the two decision shapes that are safe to take from a phone.**

Analysis, forensics, reconciliation, evidence auditing, and release readiness are desktop jobs. They remain *reachable* on mobile — nothing is hidden — but they are not optimized, and the mobile shell says so where it matters (§16.8).

### 16.4 The quick-action set

Only two decision shapes are quick-actionable, and only under the preconditions below:

| Quick action | Precondition | Why it is phone-safe |
| --- | --- | --- |
| **Approve / Reject a workflow gate** | `waitTokenId` present, full summary visible on screen without scrolling past the buttons, snapshot `live` | The decision is binary and its full context is short (the executive review summary) |
| **Resolve an escalation** (`Revise` / `Accept` / `Abandon`) | Escalation `open`, cause and consequence text fully visible, `revisionExecutionId` null for Revise, snapshot `live`, **and NB-1 fixed — see the blocking gate below** | The three options and their recorded consequences fit on one screen |

> **BLOCKING GATE — added v1.1.0. Escalation resolution must not ship on mobile until NB-1 is fixed.**
>
> NB-1 is a confirmed defect in which a replayed `accept`/`abandon` overwrites newer task state (§11.7). Mobile networks are the environment that produces duplicate submissions. Research item R-14 names this as a prerequisite in its own words: *"Enabling one-tap irreversible decisions before NB-1 is fixed"* is a listed risk, and *"this item must not proceed before NB-1 is fixed."*
>
> **Until then:** the escalation card on mobile shows its full cause, consequences, and context — everything needed to *understand* the decision — and its action row is replaced by `Open full decision →`, routing to the desktop-parity surface with the same confirmation flow. The card states why: `Resolving from a phone is disabled until a known replay defect is fixed.` The Founder is informed of the reason, not merely blocked.
>
> **Family A (approve / reject) is unaffected** and remains quick-actionable. R-14 frames the open question as *"notify only, or notify and resolve"* — this gate answers it as **notify and resolve for approvals; notify and read for escalations** until NB-1 closes. Whether that split is acceptable is a Founder product decision (§12 OQ-5, revised).

**Nothing else is quick-actionable.** Not review outcomes (no founder control exists), not retries (owned by the Execution Manager), not release actions (nothing to write to), not agent management.

**Hard gate:** if the full decision context does not fit above the action buttons without scrolling, **the quick action is withheld** and the card shows `Open full decision` instead. A decision taken without its context visible is exactly the failure mode a phone invites, and the design refuses it rather than mitigating it.

### 16.5 Mobile shell

```
┌────────────────────────────────┐
│ ⬢ DEV HQ        14:32:07 ⟳ 🔔3│  ← command bar: posture colour on left edge
├────────────────────────────────┤
│         [ view body ]          │
├────────────────────────────────┤
│  ⌂       ◆2      ≡      ⚑     │  ← tab bar, 4 tabs, 48px min targets
│ Home   Decide  Queue  Proof    │
└────────────────────────────────┘
                            [ ⋯ ]  ← "More" opens the full view list in a sheet
```

Four tabs, chosen because they map to the four things a founder does on a phone: check, decide, triage, verify. Everything else (Projects, Roadmap, Agents, Reviews, Context, Budget, Notifications, Release) is in the `More` sheet, grouped exactly as the desktop rail is, so the mental model transfers.

`Decide` is the only badged tab, and its badge is the Decision Inbox count (§10.3).

### 16.6 The quick-decision flow

```
STEP 1 — CARD (Decide tab or notification tap)
┌────────────────────────────────┐
│ ⚑ APPROVAL · waiting 41m       │
│                                │
│ Add retry telemetry to         │
│ dispatch                       │
│ Savrio Platform ▸ TSK-104      │
│                                │
│ WHAT YOU ARE APPROVING         │
│ ┌────────────────────────────┐ │
│ │ "Request is in scope for   │ │
│ │  Sprint 1F, touches        │ │
│ │  dispatch instrumentation  │ │
│ │  only, and carries no      │ │
│ │  schema change. Recommend  │ │
│ │  approval."                │ │
│ └────────────────────────────┘ │
│ ▸ Recommendation — your        │
│   decision. From: Executive    │
│   Orchestrator.                │
│                                │
│ IF YOU DO NOTHING              │
│ The run stays paused here.     │
│                                │
│ ● Actionable · gate attached   │
│ ● Connected · state 4s old     │
│                                │
│ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓ │
│ ┃        APPROVE             ┃ │
│ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛ │
│                                │  ← 24px gap, different weight
│ ┌────────────────────────────┐ │
│ │          Reject            │ │
│ └────────────────────────────┘ │
│                                │
│ [ Open full decision → ]       │
└────────────────────────────────┘

STEP 2 — CONFIRMATION SHEET (full-screen, focus-trapped)
┌────────────────────────────────┐
│ ✕                              │
│ CONFIRM: APPROVE               │
│                                │
│ Add retry telemetry to         │
│ dispatch                       │
│ TSK-104 · Savrio Platform      │
│                                │
│ THIS WILL                      │
│ Advance the workflow run past  │
│ the founder approval gate.      │
│                                │
│ THIS IS FINAL                  │
│ Recorded against your user id.  │
│ There is no undo.              │
│                                │
│ Deciding against state from    │
│ 14:32:07 (4s ago).             │
│                                │
│                                │
│         ┌──────────────┐       │
│         │    Cancel    │       │
│         └──────────────┘       │
│  ┏━━━━━━━━━━━━━━━━━━━━━━━━━━┓  │  ← confirm is in a DIFFERENT position
│  ┃      YES, APPROVE        ┃  │    than step 1's primary button
│  ┗━━━━━━━━━━━━━━━━━━━━━━━━━━┛  │
└────────────────────────────────┘

STEP 3 — RESULT (only after the authoritative snapshot confirms)
┌────────────────────────────────┐
│ ✓ APPROVED                     │
│ Add retry telemetry to dispatch│
│ Recorded 14:32:19 · you        │
│                                │
│ Workflow stage now: ④ Decision │
│                                │
│ [ Next decision (1) → ]        │
│ [ Back to Decide ]             │
└────────────────────────────────┘
```

**The button-position shift between step 1 and step 2 is deliberate.** If the confirm button sat where the trigger button was, a double-tap would sail straight through the confirmation, which would make it decorative.

### 16.7 States

Card: actionable / not-actionable (buttons disabled with reason) / context-too-long (quick action withheld) / snapshot degraded (warning inline, still permitted) / disconnected (buttons disabled).
Sheet: idle / submitting / confirmed / failed / unconfirmed.
Result: confirmed / failed / unconfirmed.

### 16.8 Empty, loading, failure, stale

- **Empty:** `Nothing is waiting on you.` plus the Inbox membership rule (§10.3), so an empty phone screen is trustworthy.
- **Loading:** skeleton card; **action buttons do not render until actionability and feed status are both known.**
- **Failure:** submit failure → inline verbatim error on the sheet, sheet stays open, button re-enables. Unconfirmed → sheet shows `We could not confirm this decision` with **only** a `Refresh and check` action; the sheet cannot be re-submitted.
- **Stale:** `degraded` → the card and the sheet both state the snapshot age; the decision is permitted. `disconnected` → buttons disabled with `Not connected to Dev HQ`, and the card shows the last known state with its age.
- **Desktop-preferred views** on mobile show a one-line note where genuinely warranted — Roadmap reconciliation, Evidence export, Release readiness: `This view is easier to read on a larger screen.` It is a note, never a block.

### 16.9 Accessibility considerations

- All touch targets ≥ 48×48 px with ≥ 8 px separation; decision buttons ≥ 56 px tall with a 24 px gap.
- The confirmation sheet is a modal dialog: focus trapped, focus starts on the heading, `Esc`/back gesture cancels, focus returns to the invoking button.
- Decision buttons carry subject-bearing accessible names (`Approve: Add retry telemetry to dispatch`).
- The result is announced in a polite live region; failure is announced in an assertive region — this is the one place assertive is correct, because an unannounced failed decision is a silent data-loss event.
- Text scales to 200% without clipping the decision buttons or hiding the consequence text. If scaling pushes context below the buttons, the **context-too-long rule (§16.4) triggers** and the quick action is withheld — accessibility scaling must not silently create an uninformed decision.
- No decision is reachable by gesture alone; every one has a visible, labelled button.
- Reduced motion honored on sheet transitions.
- Portrait and landscape both supported; landscape must not place the confirm button off-screen.

### 16.10 Prohibited misleading behavior

1. **Must not put any decision behind a swipe.** Swipe-to-approve on an irreversible, recorded founder decision is unacceptable regardless of convention.
2. **Must not skip the confirmation step**, ever, including on repeat decisions and including for a "confident" founder.
3. **Must not place confirm where the trigger was** (§16.6).
4. **Must not truncate the decision context** on a decision card. Withhold the quick action instead.
5. **Must not show success before the snapshot confirms.**
6. **Must not offer a retry on an unconfirmed decision.**
7. **Must not permit a decision while disconnected.**
8. **Must not hide any view on mobile.** `More` contains everything.
9. **Must not use haptics or animation to imply a decision landed** before confirmation.

---
## View 17 — Founder Conversation ("Ask")

> **PENDING CROSS-WORKSTREAM REVIEW — conditional on Founder decision Q-2.** SPRINT-1F-PLAN §2.1 makes a "founder conversation and command surface" **canonical scope item #1**, and its Q-2 records that the surface admits at least three architectures (structured command palette with no model; a real AI conversation over Dev HQ state; or a hybrid of grounded read-only Q&A plus structured confirmed commands). The plan recommends the hybrid. **This view is specified for the hybrid and only for the hybrid.** If the Founder chooses a different reading of Q-2, §17.13 states what changes. This view **does not** define the conversation's architecture, model, grounding mechanism, or prompt design — those are the Lead Software Engineer's under Q-2, and a real-model surface additionally collides with ADR-0001 D4 and the prompt-injection exposure the plan records as R-9/SEC-12.

### 17.1 Purpose

Let the Founder ask about recorded state and issue authorized commands in their own words, without learning the navigation — while keeping every mutation on the same confirmation and provenance rails as the rest of the product.

### 17.2 Primary user question

> *Can I just ask, and can I act on the answer without leaving it?*

### 17.3 Information shown

- **Transcript** of turns. Each answer turn carries the same provenance and claim-class encoding as every other surface: a `derived` badge, the records it read named and **linked**, and `as of` for the snapshot it answered from.
- **Answer grounding block** — mandatory, not optional, and not collapsible on first render: the specific record ids the answer was derived from. An answer with no grounding block renders as `Could not ground this answer in recorded state.` and is **not** presented as an answer.
- **Command proposals** — when the Founder's input maps to an authorized operation, the surface renders a **structured command card**, not prose: the operation, the target record, the parameters, and the consequence text drawn from §9.3/§11.3. The Founder confirms the card; the card is the command.
- **Unsupported-intent state** — when the input maps to no authorized operation: `I cannot do that from here.` plus what Dev HQ *can* do about that subject, with links. Never an apology-shaped non-answer, and never an attempt.
- **Claim-class discipline.** Any answer sentence that is not a Recorded or Derived reading of state is a **Projection** or **Recommendation** and carries the §2.3 encoding inline — italic, prefixed, and with the visually-hidden class prefix. In practice this means a conversational surface may not render an unmarked opinion about the future.

### 17.4 Actions available

Ask · confirm or cancel a proposed command · open any grounded record · copy a turn (question, answer, grounding ids) for an audit record · clear the session transcript.

**Every command routes through the standard confirmation dialog (§11.5).** There is no conversational shortcut, no "just do it", and no natural-language confirmation — the Founder confirms on the structured card, not by typing "yes". Typed confirmation is prohibited because it is unauditable and because it is the exact affordance a prompt injection would target.

**The conversation never mutates state directly** (the plan's own constraint in §2.1): a command maps to an existing authorized service-layer operation or it does not exist.

### 17.5 States

Idle (empty transcript) · composing · answering · answered-with-grounding · answered-without-grounding (refused) · command proposed · command confirming · command submitted · command confirmed · command failed · command unconfirmed · unsupported intent · disconnected.

### 17.6 Empty states

- **Ask about anything Dev HQ has recorded.** Followed by three example questions drawn from the Founder's actual current state (e.g. `Why is TSK-097 blocked?`), so the empty state teaches capability rather than advertising it. If there is no state to draw from: **Dev HQ has no records to ask about yet.**

### 17.7 Loading states

The answer turn streams or appears whole — either is acceptable — but **the grounding block must appear with or before the answer text, never after.** An answer that renders ungrounded and then acquires citations trains the Founder to trust ungrounded text.

### 17.8 Failure states

- Cannot ground → refusal state (§17.3), which is a success of the design, not a failure to hide.
- Referenced record missing from the snapshot → the citation renders with `Referenced record not in current snapshot` and the answer is downgraded to `Partially grounded`.
- Command submission failure / ambiguity → identical to §11 (verbatim error; refresh-only on unconfirmed).
- Surface unavailable → `The conversation surface is unavailable. Everything it can do is reachable from the navigation.` with links. The conversation must never be the only path to any capability.

### 17.9 Stale-data warning

Every answer is stamped with the snapshot it read. On `degraded`, the answer carries the amber age. On `disconnected`, **the surface accepts no input at all** and states why — an answer derived from a snapshot the client cannot trust is worse than silence, because conversational output reads as authoritative regardless of provenance.

### 17.10 Mobile behavior

Its own bottom tab (`Ask`, §9.3 as reconciled). Full-screen transcript, input pinned above the safe-area inset. Command cards are full-width with the §16.6 two-step confirmation. The grounding block is collapsed to a citation count on mobile **but the count is always visible**, and expanding it is one tap.

### 17.11 Accessibility considerations

Transcript is a `<ol>` of turns in a `role="log"` with `aria-live="polite"` — never assertive. The input is a labelled `<textarea>` with a visible label, not a placeholder-only field. Streaming text must not re-announce on every token: announce once on completion. Command cards are `<article>` with the operation in the heading, and their buttons carry subject-bearing accessible names (§9.11). Citations are real links with descriptive text (`Task TSK-097, blocked`). The grounding block is in the reading order before the answer. `Esc` cancels a proposed command and returns focus to the input.

### 17.12 Prohibited misleading behavior

1. **Must not answer without a grounding block.** Refuse instead.
2. **Must not execute a command from typed natural language** — only from a confirmed structured card.
3. **Must not accept typed confirmation** in place of the confirmation dialog.
4. **Must not present a projection, recommendation, or inference as a recorded answer.** The claim-class encoding applies inside prose.
5. **Must not be the sole path** to any capability.
6. **Must not answer while disconnected.**
7. **Must not render untrusted record text as instructions.** Task descriptions, review findings, and evidence summaries are attacker-influenced text in any real deployment (the plan's R-9); this surface displays them as quoted data, never as directives, and never lets them originate a command card.
8. **Must not claim to have done something the snapshot does not show** (§11.6 applies verbatim).

### 17.13 If Q-2 resolves differently

| Q-2 outcome | Change to this view |
| --- | --- |
| **Hybrid** (plan's recommendation) | As specified above |
| **Structured command palette only, no model** | Delete §17.3's transcript and grounding block; the surface becomes the `⌘K` palette (§3.5) extended with authorized commands. The command-card, confirmation, and prohibition rules (§17.4, §17.12 items 2–3, 5–8) **all still apply** |
| **Real AI conversation** | Everything above still applies, and §17.12 item 7 becomes a security acceptance criterion rather than a design rule. Additionally requires the Founder's ADR-0001 D4 exception |
| **Deferred out of 1F** | This view is not built. The `⌘K` palette remains navigation-only, as in v1.0.0 |

---

## View 18 — Task List and Detail

### 18.1 Purpose

The first-class task surface: the entry point for "something is wrong with this piece of work" and the natural bridge between a project and its executions. *(Added in v1.1.0; its absence from v1.0.0 was 1F conflict C-6.)*

### 18.2 Primary user question

> *What is the state of this task, who owns it right now, why is it in that state, and what is blocking it?*

### 18.3 Information shown

**List** (`/tasks`): id · title · project · sprint (preview) · `LifecycleStatus` · `Priority` · current owner · status reason · age · `dueAt` when recorded. Filters: project, status, priority, owner, has-open-escalation, has-pending-review. URL-persisted.

**Detail** (`/tasks/<id>`): the **six-field decision header** (§6.4 as adopted — Status · Current owner · Status reason · Next gate · Blockers · Evidence), then the task's full record, its executions with attempts, its reviews with iteration counts, its evidence, its escalations and approvals, and its activity.

**Ownership honesty.** `Task.assigneeAgentId` records an assignment *intent*, not present ownership. The header's **Current owner** field is derived per the rules in §7.3 of the 1F plan and **must not fall back to `assigneeAgentId` alone** — that is the single most likely wrong-owner bug on this surface. When no rule matches: `Unowned`.

**Blockers honesty.** Blockers are the union of open escalations, pending approvals gating the run, an unassignable execution awaiting capacity, and an unresponsive reviewer. **`blocks`-kind dependencies are not available** (`listDependencies` returns `[]`), so a task with none of the above renders `Blocked · reason not recorded` per wait reason W6, never an invented dependency.

### 18.4 Actions available

Filter · sort · open project, execution, review, evidence, escalation, approval · copy task id · dispatch an agent execution (existing capability, surfaced not redesigned).

No status editing, no reassignment, no priority editing. Lifecycle transitions are service-owned; a founder-side status write would let the UI contradict the Execution Manager.

### 18.5 States

Any `LifecycleStatus` × owner present/absent/unowned × has-blockers/clear × has-executions/none × in-a-revision-chain/not. Plus the recorded lifecycle gap: **nothing currently marks a task `completed` when its execution succeeds and its review passes** (recorded in the 1E notes) — so a task may sit `active` with a passed review, and the detail surface states that plainly rather than implying stalled work.

### 18.6 Empty states

- List: **No tasks recorded.** · filtered-empty with filters listed.
- No executions: **No execution has run for this task.**
- No evidence: **No evidence recorded for this task.** *(Not "unverified".)*
- No reviews: **No review has been dispatched for this task.**

### 18.7 Loading states

List: skeleton rows, no zero counts. Detail: the six-field header skeletons **as a unit** — a partially populated decision header is worse than none, because a Founder reads the first three fields and acts.

### 18.8 Failure states

Task not in snapshot → §4.4 panel with the in-memory-store explanation. Missing referenced project/agent → id shown with `Not in registry` / `Referenced record not in current snapshot`. Status reason underivable → `Not recorded` with the reason, which per the 1F plan's own §7.3 is currently the honest output for a declined dispatch until the 1E remediation lands.

### 18.9 Stale-data warning

Shared `as of`. Dispatch control disables while `disconnected`.

### 18.10 Mobile behavior

List becomes cards (two-line: title + status/owner; third line for blockers when present). Detail leads with the six-field header, always fully expanded, followed by a segmented control: `Executions | Reviews | Evidence | Activity`.

### 18.11 Accessibility considerations

The six-field header is a `<dl>` so each field is a labelled term/value pair, not a visual grid. List is a `<table>` with a `Status reason` column and `aria-sort` on sortable headers. `Priority` is text, never colour alone. The lifecycle-gap note is prose in the reading order.

### 18.12 Prohibited misleading behavior

1. **Must not derive Current owner from `assigneeAgentId` alone.**
2. **Must not invent a blocker** or imply dependency data exists.
3. **Must not render a partially populated decision header.**
4. **Must not offer status, priority, or assignee editing.**
5. **Must not present a task with a passed review as stalled** — the recorded lifecycle gap is stated instead.
6. **Must not label an evidence-free task unverified.**

---

## View 19 — Settings

### 19.1 Purpose

The one place the Founder controls their own device, session, and notification delivery — and the only place where a preference control is permitted to exist, because it is the only place one can be honestly backed. *(Added in v1.1.0; 1F S-16.)*

### 19.2 Primary user question

> *How do I control what reaches me, on this device, and how do I sign out?*

### 19.3 Information shown

**Notifications** — per-class delivery preference over the §8 taxonomy, and the standing policy statement: only Founder-actionable transitions push; everything else is in-app only (the 1F plan's R-11 mitigation). Each toggle states what it controls in records, not in vibes.

**This device** — push subscription state (`Subscribed` / `Not subscribed` / `Blocked by the browser` / `Not supported on this platform`), device label, when it was created, when it last received something. Install state and an install prompt when installable.

**Platform-support honesty.** Web Push support and its installation requirements differ by platform, and research item R-14 records that the constraint *"must be verified against current documentation, not recalled."* This surface therefore reports **what the browser actually tells it** — permission state and subscription state — and never asserts a general platform capability. When push is unavailable it says which of the four states applies and what the Founder can do, if anything.

**Session** — signed-in principal, session age, sign-out. *(Mechanism is Q-5 and is not chosen here.)*

**Transport** — current transport and whether it fell back to polling. The 1F plan's F-11 requires a degraded transport be reported *"in Settings, not in the Founder's face"* — that is the right call and this is where it lands.

**Data-source honesty toggle** — the plan's S-16 names one. Reconciled position: **provenance badges are never hideable.** The toggle controls *verbosity of the explanatory prose* (standing disclosures collapsed to a single line), never the badges themselves. A switch that hides provenance would let the Founder disable the product's honesty.

### 19.4 Actions available

Toggle a notification class · subscribe/unsubscribe this device · install · sign out · copy diagnostic summary (feed status, transport, snapshot age, subscription state) · set disclosure verbosity.

### 19.5 States

Push: subscribed / not subscribed / permission denied / unsupported / subscription stale (endpoint rejected). Session: active / expiring / expired. Install: installed / installable / not installable. Transport: primary / fallback.

### 19.6 Empty states

- No push subscription: **This device will not receive notifications.** With the one action that changes it, and the consequence: `Decisions will still appear in the app and in your Decision Inbox.`
- No preferences persisted yet: defaults shown, labelled `Default`.

### 19.7 Loading states

Toggles render **disabled** until their current value is known. A toggle that renders in a default position and then flips is a false statement about what the Founder has configured.

### 19.8 Failure states

Subscribe fails → verbatim browser reason and which of the four states resulted. Unsubscribe fails → state unchanged, error shown; **never optimistically shown as unsubscribed**, because a Founder who believes they unsubscribed and still gets paged loses trust in the whole channel. Preference write fails → toggle reverts with the error. Sign-out fails → session state unchanged, error shown.

### 19.9 Stale-data warning

Subscription and session state are read from the browser and the server respectively; each is stamped separately. On `disconnected`, server-backed controls (preferences, sign-out) disable; browser-backed state (permission, install) still renders because it is locally true.

### 19.10 Mobile behavior

Primary home for push and install, reached from `More`. Grouped list rows with generous targets. The install prompt appears here and, at most once, as a dismissible Home banner — never as an interstitial.

### 19.11 Accessibility considerations

Every toggle is a real `<input type="checkbox">`/switch with a visible label and `aria-describedby` on its explanation. State changes announce politely (`Failure notifications on`). Grouped as `<fieldset>` with `<legend>`. Disabled controls state why. The diagnostic summary is selectable text, not an image.

### 19.12 Prohibited misleading behavior

1. **Must not allow provenance badges to be hidden** (§19.3).
2. **Must not show a preference control that does not take effect** — if a channel is not implemented, the row states that instead of offering a toggle.
3. **Must not optimistically report subscribe/unsubscribe.**
4. **Must not assert platform push support** beyond what the browser reports.
5. **Must not render toggles in a default position before their value is known.**
6. **Must not imply notification delivery is guaranteed.** §8.6 as reconciled governs the wording.

---

## View 20 — Simulation Lab (preserved)

### 20.1 Purpose

Preserve the existing Simulation Lab as a permanent surface, per **ADR-0001 D9**. *(Its omission from v1.0.0 was a defect — 1F conflict C-5.)*

### 20.2 Design position

**This view is not redesigned.** ADR-0001 D9 keeps it permanent; the 1F plan's §3.3 permits relocation in the information architecture but explicitly forbids removing or altering its behavior. This specification therefore:

- **Relocates only.** It lives at `/lab`, under `SYSTEM` on desktop and under `More` on mobile.
- **Changes no behavior, no controls, no copy** of the existing dispatch surface.
- **Adds one thing:** a provenance and purpose header — `Simulation Lab · dispatches real executions against the deterministic simulated agent roster.` Rationale: it is the one surface where a Founder action creates work rather than reporting it, and it must not be mistakable for a status view.
- Is **desktop-primary** (the 1F plan's RES-13): reachable and non-broken on a phone, not optimized for one.
- Is **absent from the Decision Inbox, the Attention Dock, and every notification class** — nothing here is a founder-blocking decision.

### 20.3 The twelve dimensions

Purpose, primary question, information, actions, and states are **as currently implemented** and are not restated here, because restating them would create a second source of truth for a surface this document does not own. The cross-cutting rules that **do** apply to it, as to every surface: §2 provenance and claim classes; §4.3's six view states; §4.4's failure taxonomy; §2.4's stale-data behavior (**its dispatch control disables while `disconnected`**, like every other mutating control); and §10's accessibility checklist.

### 20.4 Prohibited misleading behavior

1. **Must not be removed or behaviorally altered** (ADR-0001 D9).
2. **Must not appear as a status or decision surface.**
3. **Must not dispatch while `disconnected`.**
4. **Must not be promoted into primary navigation** — it is a tool, not a founder job.

---

# 6. Component Inventory

Behavior contracts only. No library is named and no implementation is prescribed. Components marked **existing** are already in the codebase and are documented here as-is — this design extends them rather than replacing them, and any regression in their honesty behavior is a defect.

## 6.1 Provenance and truth components

| Component | Status | Behavior contract | States | Accessibility |
| --- | --- | --- | --- | --- |
| `DataSourceBadge` | **existing** | Renders provenance for a panel or value. Shows the weakest provenance present. | `live`, `derived`, `preview`, `unavailable` | Accessible name includes the provenance word and its help text; not colour-only |
| `NotImplementedNote` | **existing** | Prose explanation of why a section has no data | single | Regular prose in reading order |
| `ProvenanceExplainer` | new | Popover naming the backing record for a value, opened from any badge | closed, open | Dialog-less popover; `Esc` closes; focus returns |
| `ClaimClassWrapper` | new | Applies the §2.3 visual + accessible encoding for Projection / Recommendation / Unknown | `projection`, `recommendation`, `unknown` | Visually hidden class prefix in accessible name (mandatory) |
| `UnknownValue` | new | Renders the words **"Not recorded"** (or a specific reason) as primary content; `—` only as a leading marker, or alone in a dense cell whose column header and accessible name carry the words | with-reason (only valid state) | Accessible name: `Not recorded: <reason>` |
| `DecisionHeader` | **new — adopted from SPRINT-1F-PLAN §6.4** | The six decision fields in fixed order on every entity surface: **Status · Current owner · Status reason · Next gate · Blockers · Evidence.** Renders as a unit or not at all | populated, partially-derivable (absent fields explicit), skeleton-as-a-unit | `<dl>` with labelled term/value pairs; never a bare visual grid |
| `RetentionMarker` | new | Terminal marker disclosing event-cap/durability limits | at-cap, possibly-truncated | `role="note"`, in reading order |

## 6.2 Status and state components

| Component | Status | Behavior contract | States | Accessibility |
| --- | --- | --- | --- | --- |
| `StatusPill` | **existing** | Dot + text label from a `StatusToken`. Pulse optional. | any status token; pulse on/off | Text label always present; never colour-only |
| `StatusDot` | **existing** | Coloured dot, optional pulse | idle, pulsing | `aria-hidden`; meaning carried by adjacent text |
| `PostureBanner` | new | HQ posture with mandatory "Because:" basis line | 7 postures (§1.3) | `role="status"`, `aria-live="polite"`, rate-limited |
| `StaleRibbon` | new | Feed-degradation banner | hidden, degraded, disconnected | `role="status"`; not a dialog; never blocks |
| `FreshnessStamp` | new | `as of <absolute> (<relative>)`; freezes on degraded | live, degraded, disconnected, initial | Absolute time in accessible name |
| `HealthBadge` | new | Agent health with its threshold in the label | healthy, not-reporting, unavailable, unknown | Threshold in accessible name; separate from availability |
| `PipMeter` | new | Discrete bounded counter (`● ● ○`) | n of m | `role="img"`, name `Iteration 2 of 3`; never a percentage |
| `DeadlineCountdown` | new | Projection-classed countdown; freezes + strikes through when stale | running, frozen, passed | `Projection:` prefix; absolute deadline in name |
| `AttemptTrail` | new | Attempt chips with per-attempt outcomes | 1..MAX; each succeeded/failed/running/not-started | Each chip labelled `Attempt 2 of 3, failed` |

## 6.3 Layout and navigation components

| Component | Status | Behavior contract | States | Accessibility |
| --- | --- | --- | --- | --- |
| `CommandBar` | extends `TopBar` (**existing**) | Brand, posture, freshness, refresh, palette, notifications, identity | live, degraded, disconnected | `<header>` landmark; skip-link is first focusable |
| `NavRail` | extends `HierarchyRail` (**existing**) | Five groups; single badge on `DECIDE`; `dark` markers | collapsed, expanded, mobile-sheet | `<nav>`; `aria-current="page"`; group headings |
| `ContextSpine` | new | Project ▸ Sprint ▸ Task ▸ Execution ▸ Attempt, each linked and status-dotted; sprint always preview-marked | full, truncated, absent | `<nav aria-label="Context">` as an ordered list |
| `MobileTabBar` | new | 4 tabs; badge on `Decide` only | per-tab active | `<nav>`; ≥48px targets; `aria-current` |
| `MoreSheet` | new | Full view list, grouped as the rail | closed, open | Modal sheet; focus trap; `Esc` closes |
| `CommandPalette` | new | Search views and records by name or id | closed, searching, results, no-results | Combobox pattern; results announced |
| `AttentionDock` | new | Right-hand founder-blocking summary + Next Gate | populated, empty, unknown | `<aside>` complementary landmark |
| `PanelShell` | extends existing panel pattern | Header with title, provenance badge, count, freshness; body slot; standard six states | loading-initial, loading-refresh, populated, empty-true, empty-dark, failure | `<section>` + `<h2>`; state changes announced politely |

## 6.4 Data-display components

| Component | Status | Behavior contract | States | Accessibility |
| --- | --- | --- | --- | --- |
| `MetricStat` | **existing** | Label, value, colour, hint, emphasis | normal, emphasis | Definition-list semantics preferred over bare grid |
| `MetaRow` | **existing** | Monospace key/value for ids and audit fields | truncated, wrapped | `<dt>`/`<dd>` |
| `EmptyState` | **existing** | Title + detail; never a blank box | single | Prose in reading order |
| `DarkState` | new | Visually distinct from `EmptyState`; dashed container; statement + meaning + risk + contract | collapsed-contract, expanded-contract | Heading begins `Not instrumented` |
| `WorkRow` | new | Id, title, project, sprint, owner, status, age, attempt, **why** column | any status; incomplete-record | `<tr>` with real headers; `Why` is a column, never a tooltip |
| `LaneSection` | new | Titled lane with count, fixed order, collapsible per policy | expanded, collapsed, non-collapsible | `<h2>` includes count; collapse state in `aria-expanded` |
| `FilterChips` | new | URL-persisted filters; distinct filtered-empty state | none, active, filtered-empty | Toggle group with `aria-pressed`; result counts announced |
| `TimelineStream` | new | Typed, ordered entries; tie-groups for equal timestamps; causal links | populated, truncated, partial-unknown, failure | `<ol>`; `<time>`; icon + text; ordering stated in heading |
| `AttemptLanes` | new | One band per attempt; unexposed moments render `?` with explanation | 1..MAX attempts | Tablist; per-attempt state in name |
| `FindingList` | new | Severity-grouped, blocking first; evidence link or explicit absence | populated, empty, inconsistent | Description list; severity as text term |
| `EvidenceRow` | new | Kind chip, label, task, actor, time | any kind; missing-uri; missing-actor | Kind is text + icon |
| `UriBlock` | new | Literal, copyable, unverified location text | present, absent | Name includes `Location as recorded, not verified` |
| `ReconciliationTable` | new | Matched / planned-not-recorded / recorded-not-planned; suppresses on degraded | ready, suppressed, unavailable | `<table>` with caption stating the comparison basis |
| `GateList` | new | Three-value gate status; never "passed" | evidence-recorded, no-evidence, not-verifiable | Ordered list; status in name; icon + text |

## 6.5 Decision components

| Component | Status | Behavior contract | States | Accessibility |
| --- | --- | --- | --- | --- |
| `DecisionCard` | new | Subject, verbatim context, consequences-as-recorded, actionability, controls | actionable, not-actionable, context-too-long (mobile), submitting, confirmed, failed, unconfirmed | `<article>` + `<h2>`; subject-bearing control names |
| `DecisionButtonGroup` | new | Enforces separation, differing weight, fixed order; never adjacent destructive pairs | enabled, disabled-with-reason, submitting | `aria-describedby` → reason/consequence; ≥56px on mobile |
| `ConfirmationDialog` | new | Restates subject, effect, irreversibility, snapshot age; confirm in a shifted position | idle, submitting, failed | `role="dialog" aria-modal="true"`; focus on heading; `Esc` cancels; focus restored |
| `ActionabilityNotice` | new | States why a control is disabled | wait-token-missing, revision-already-authorized, disconnected, context-incomplete | Linked to the control via `aria-describedby` |
| `DecisionResult` | new | Renders only after the authoritative snapshot confirms | confirmed, failed, unconfirmed | Polite for success, assertive for failure |
| `NotificationItem` | new | Class, severity, subject, time, read state, record link | unread, read | Unread as text + icon, never weight alone |

## 6.6 Component-level prohibitions

1. No component may render a value without a provenance path to a record.
2. No component may default an unknown to a plausible value (`healthy`, `0`, `1 of 3`, `$0.00`).
3. No component may carry state in colour alone.
4. No component may animate while the feed is degraded or disconnected.
5. No decision component may enable itself before its preconditions are known.
6. No component may truncate verbatim decision context.
7. `ClaimClassWrapper` may not be bypassed for any projection or recommendation.

---

# 7. Status Vocabulary

## 7.1 Principles

1. **One label per state, everywhere.** A state has exactly one Founder-facing string across all views, all breakpoints, and all notifications.
2. **Labels are Founder-facing, not developer-facing.** `needs_revision` → "Needs revision".
3. **Existing tokens are preserved verbatim.** `lib/mission-control/status.ts` is the source of truth for the tokens it defines; changing them would break continuity for the one user.
4. **Every label pairs with a dot and a shape/icon.** Never colour alone.
5. **New tokens follow the same shape** (`{ label, color }`).

## 7.2 Existing tokens (preserved unchanged)

**`LifecycleStatus`** — Draft · In progress · Paused · Blocked · Needs revision · Rejected · Completed · Archived

**`ExecutionStatus`** — Queued · Running · Succeeded · Failed · Cancelled

**`ApprovalStatus`** — Awaiting founder · Approved · Rejected · Escalated

**`FounderRequestWorkflowStage`** — Request received · Executive review · Awaiting founder approval · Validation rejected · Approved · Founder rejected · Completed · Technical failure

**`AgentAvailability`** — Available · Busy · Offline · Waiting

**`ConnectionStatus`** — Connected · Degraded · Disconnected · Not configured

**`RunOutcome`** (view-model) — Running · Awaiting founder approval · Approved and completed · Rejected by founder · Validation rejected · needs revision · Technical failure

Note the deliberate distinction already present and to be preserved: **"Validation rejected" ≠ "Founder rejected"** (`WorkflowRejectionKind`).

## 7.3 New token: assignment status

Renders only when assignment data is exposed (§2.5); until then `—`.

| Value | Label | Founder meaning |
| --- | --- | --- |
| `assigned` | **Assigned** | An agent was chosen. Work has not started. |
| `claimed` | **Claimed** | The agent took ownership. A lease is active. |
| `running` | **Running** | Work is in progress and heartbeating. |
| `released` | **Released** | The agent is freed. Terminal for this hold. |

## 7.4 New token: agent health

Two independent axes — availability (§7.2) and health — always shown separately (§6.12).

| Value | Label | Sub-line |
| --- | --- | --- |
| `healthy` | **Healthy** | `last activity <age> ago` |
| `stale` | **Not reporting** | `last activity <age> ago, threshold 60s` |
| `unavailable` | **Unavailable** | `offline or not in registry` |
| (no `lastActiveAt`) | **Health unknown** | `no activity recorded` |

"Not reporting" is preferred over "Stale" for the Founder-facing label: "stale" describes data, and this describes an agent.

## 7.5 New tokens: review and escalation

**`ReviewPolicy`** — None (no review) · Basic (one lens) · Full (multiple lenses) · **Not recorded** (absent policy — treated as no review, never as a default)

**`ReviewStatus`** — In review · Passed · Changes requested · Escalated *(never shown bare — see below)*

**`ReviewEscalationReason`** — the mandatory qualifier (PE-3):

| `status` + `escalationReason` | Label | Sub-line |
| --- | --- | --- |
| `escalated` + `iterations_exhausted` | **Escalated — revision limit reached** | `3 of 3 review iterations ended in blocking findings` |
| `escalated` + `reviewer_unresponsive` | **Escalated — reviewer never reported** | `3 of 3 review dispatches went unanswered` |
| `escalated` + `null` | **Escalated — reason not recorded** | `inspect the timeline` |

**`ReviewFindingSeverity`** — Blocking (requires a revision) · Advisory (recorded, does not itself continue the loop)

**`EscalationOrigin`** — Retries exhausted · Review exhausted *(never shown bare when `review_exhausted`; always paired with the reason above)*

**`EscalationStatus`** — Open · Resolved

**`EscalationResolution`** — Revise · Abandon · Accept

**`EvidenceKind`** — Validation · Artifact · Review · Approval · Log

## 7.6 New vocabulary: wait reasons

The answer to Question 4. Exactly six values; no others may be invented, and none may be inferred.

| Reason | Label | Derived from | Phase 1 availability |
| --- | --- | --- | --- |
| W1 | **Waiting on founder approval** | `Approval.status === "pending"` | **Available** |
| W2 | **Waiting on founder escalation decision** | `Escalation.status === "open"` | **Available** |
| W3 | **Awaiting reviewer callback** | `Review.status === "pending"` | **Available** |
| W4 | **Waiting for agent capacity** | execution `queued` with no agent assigned | **Available** |
| W5 | **Dispatched, not yet claimed** | `AgentAssignment.dispatchedAt` set, not claimed | **`—` — assignment data not exposed** |
| W6 | **Blocked · reason not recorded** | task `blocked` with no W1–W5 match | **Available** (as an explicit unknown) |

W6 is the honest terminus. Dependency-based blocking is **not** a wait reason in Phase 1 because dependency data is not instrumented (§2.5), and inventing "blocked by X" would be fabrication.

## 7.7 New vocabulary: HQ posture

Per §1.3, precedence-ordered: **State unknown** → **Needs you** → **Failure recorded** → **Blocked** → **Working** → **Idle** → **No work recorded yet**. Always accompanied by its `Because:` basis.

## 7.8 Feed status labels

`initial` → **Loading** · `live` → **Live** · `degraded` → **Reconnecting** · `disconnected` → **Not connected**

"Reconnecting" rather than "Degraded" for the Founder-facing label: it says what is happening rather than grading it.

## 7.9 Claim-class markers

`≈` Projection · `▸` Recommendation · `—` Not recorded. Each with its mandatory visually-hidden prefix (§2.3).

## 7.10 Forbidden vocabulary

These words must not appear in any Founder-facing string, because none of them is backed by a record:

| Forbidden | Why | Say instead |
| --- | --- | --- |
| "On track", "Healthy" (for a project) | No health model exists | The recorded status |
| "Ready to ship", "Release ready" | No release record exists | "Evidence recorded" per gate |
| "Verified", "Clean", "All good" | Absence of failure is not verification | "No failures recorded" |
| "ETA", "Expected by", "Will finish" | No progress model exists | Nothing, or a labelled projection |
| "% complete" (outside declared workflow stages) | No progress fraction exists | Stage position, or nothing |
| "Delayed", "Behind schedule", "At risk" | No schedule entity exists | Recorded age |
| "Notified", "Sent", "Delivered" | No delivery channel exists | "Shown here" |
| "Passed" (for a release gate) | Gate satisfaction is not recorded | "Evidence recorded" |
| "Unlimited" (for budget) | No budget entity exists | "No budget is set" |
| "Optimizing", "Thinking", "Working on it" (as a status) | Not a recorded state | The recorded execution status |

---

# 8. Notification Taxonomy

## 8.1 Principles

1. **Every notification traces to a record**, and links to it. No notification is generated from inference.
2. **Priority is a function of who is blocked**, not of how interesting the event is.
3. **Projections and recommendations never generate notifications** (§2.2).
4. **Phase 1 delivers nothing anywhere** (§14.3); the taxonomy is defined now so the classes are stable when delivery exists.

## 8.2 Classes and priority

| Priority | Class | Definition | Founder is blocked? |
| --- | --- | --- | --- |
| **P0** | **Decision required** | A recorded decision is reserved for the Founder | **Yes** |
| **P1** | **Escalation raised** | Automation exhausted; a decision is now required | **Yes** |
| **P1** | **Failure** | An execution or workflow run failed | Not yet |
| **P1** | **Retry exhausted** | The attempt budget is spent | Becomes P0 via escalation |
| **P2** | **Review outcome** | A review passed, requested changes, or escalated | Only if escalated |
| **P2** | **Agent health** | An agent stopped reporting or went unavailable | No |
| **P2** | **Recovery** | A lease was reclaimed, or a review re-dispatched | No |
| **P3** | **Progress** | Execution started, succeeded, retried; stage advanced | No |
| **P3** | **Evidence** | An evidence record was written | No |
| **—** | **Health/instrumentation** | Feed degraded or disconnected | No, but it invalidates the surface |

## 8.3 Trigger table

Every trigger is a recorded transition. No trigger is time-based, threshold-guessed, or derived from a projection.

| Class | Trigger record / event | Notification text pattern |
| --- | --- | --- |
| P0 Decision required | `Approval.status → pending` | `Approval pending: <title>` |
| P0 Decision required | `Escalation.status → open` | `<cause headline>: <task title>` |
| P1 Escalation raised | `escalation.raised` | `<origin + reason>: <summary>` |
| P1 Failure | `Execution.status → failed` | `<execId> attempt N of M failed · <code>` |
| P1 Failure | run stage → `failed` | `Technical failure on <task> · stage not recorded` |
| P1 Retry exhausted | `execution.exhausted` | `Attempt budget spent on <task>` |
| P2 Review outcome | `review.passed` | `Review passed: <task>` |
| P2 Review outcome | `review.changes_requested` | `Changes requested · N blocking · iteration N of M` |
| P2 Review outcome | `review.escalated` | `<escalationReason label>: <task>` |
| P2 Agent health | derived health → `stale` / `unavailable` | `<agent> not reporting · last activity <age>` |
| P2 Recovery | `execution.reclaimed` | `Lease reclaimed on <execId>` |
| P3 Progress | `execution.assigned` / `.claimed` / `.succeeded` / `.retried` | `<execId> <transition>` |
| P3 Evidence | new `Evidence` record | `<kind> recorded: <label>` |
| — Health | `FeedStatus → degraded` / `disconnected` | `Not connected to Dev HQ` |

## 8.4 Rules

- **Dedup key** per item: `(class, recordId, transition)`. A replayed callback or a re-derivation must not produce a second notification. This matters concretely: execution callbacks are idempotent server-side, and the notification layer must not undo that guarantee in the UI.
- **Rate limiting:** at most one screen-reader announcement per 30 seconds; at most one visual toast per 10 seconds, with overflow collapsing into `N more updates`.
- **No aggregation across classes.** `3 failures` and `3 evidence records` never merge into `6 updates`.
- **No projection-triggered notifications.** A deadline approaching is not a notification; a deadline having passed *and being recorded as such* is.
- **P0 items are never auto-dismissed** and never expire. They clear only when the underlying record leaves its pending/open state.
- **Never notify on a state the Founder caused** in the same session (their own approval does not notify them), but always record it in the list.
- **Health notifications are suppressed while disconnected** beyond the first — otherwise a network outage generates a notification storm about itself.

## 8.5 Channels

| Channel | Phase 1 status | Behavior |
| --- | --- | --- |
| In-app bell + list | **Available** (derived, session-scoped) | View 14 |
| `DECIDE` badge | **Available** (derived) | Inbox count only |
| Posture banner | **Available** (derived) | Composite state |
| Toast | **Available** (derived) | P0/P1 only; rate-limited; never auto-dismissed for P0 |
| **Web Push (mobile)** | **In Sprint 1F scope** *(revised v1.1.0)* | 1F-9 PWA shell + 1F-10 Web Push; `D-I` subscription store, `D-J` delivery record. Policy and payload in §8.6.1. Subject to Founder decision Q-9 (dependency approval) and research **R-14** |
| Email / SMS / Slack | **Out of scope** | 1F §3.3: *"Web Push only."* Not designed |
| Digest | **Not instrumented** | Designed in §8.7; requires durable notification records |

## 8.6 Delivery-honesty rule — revised in v1.1.0

**v1.0.0 rule:** never state or imply that a notification was delivered, because no channel existed. **What changed:** the Sprint 1F plan puts Web Push in scope *and* adds a notification delivery record (`D-J`: *"What was sent, for what record, when, and whether it was delivered/acted on"*). Delivery therefore becomes a **recordable fact**, so an absolute prohibition would now be wrong in the other direction — it would force the product to hide something it knows.

**Revised rule, in three parts:**

1. **State delivery only from a delivery record.** "Sent", "delivered", and "opened" are permitted **if and only if** a `D-J` record says so, and each renders the record's own timestamp. Absent a record, the state is `Not recorded`, never "sent".
2. **Never infer delivery from the attempt.** Handing a payload to a push service is not delivery. If the record distinguishes *dispatched* from *delivered*, the UI must too; if it does not, the UI says `Dispatched — delivery not recorded` and nothing stronger.
3. **Never imply delivery on a channel that is not subscribed.** If this device has no subscription (View 19), notification copy must not suggest anything reached a phone.

**Until 1F-10 lands**, the v1.0.0 wording stands verbatim and the bell tooltip reads: `Activity derived in this browser session. Nothing is sent anywhere.` **After it lands**, the tooltip reads: `Notifications shown here. Delivery to this device is recorded separately — see Settings.`

Still prohibited in every case: any UI implying a preference took effect when no mechanism backs it (§19.12 item 2), and any claim of guaranteed delivery.

## 8.6.1 Push notification policy and payload — added v1.1.0

**Policy (adopted from the 1F plan's R-11 mitigation, which is a UX judgment this design agrees with).** Push is reserved for **Founder-actionable transitions only**: a new open escalation, and a new *actionable* pending approval. Everything else — failures, retries, review outcomes, agent health, progress, evidence — is in-app only. Rationale, stated because it is the whole point: J-1, "overnight decision from a notification", is the primary journey, and a channel that fires on progress trains the Founder to ignore the channel the primary journey depends on.

**Actionability gate.** A pending approval with no attached wait token is **not** actionable and **must not push**. Pushing a decision the Founder cannot execute is the worst possible use of the channel.

**Payload requirements.** Research item R-14 requires that each payload be *decidable from the notification alone*, and names the four escalation causes explicitly. Every payload therefore carries:

| Field | Requirement |
| --- | --- |
| Cause headline | For escalations, the **four-way cause presentation of §11.3** — `origin` **and** `Review.escalationReason`. R-14 states it plainly: *"A notification that conflates them is worse than the queue doing so."* This discharges PE-3 into the notification layer, not just the UI |
| Subject | The task or approval title, not an id alone |
| Record id | For the deep link |
| Deep link | To the **decision surface** (`/inbox/escalations/<id>` or `/inbox/approvals/<id>`), never to Home |
| Self-contained text | Meaningful without opening the app — it is often the only content a screen-reader user hears (1F A11Y-13) |

**Prohibited in the payload:**

1. **No action buttons.** No "Approve" or "Revise" in the notification itself. A notification action bypasses the confirmation dialog (§11.5) and the snapshot-freshness check (§11.7), which are the two guards that make an irreversible decision safe. This was v1.0.0's §9.6 position and it is unchanged and reinforced.
2. **No decision content that could be acted on without loading current state.**
3. **No projections or recommendations** (§8.4).
4. **No record text rendered as instruction** — the payload quotes recorded fields, and a task title is data.

**Event-stream separation.** The audit `Event` stream is capped at 200 records. Notification and delivery records **must not** consume it — adding delivery receipts would evict the execution history the timeline exists to preserve. The 1F plan reaches the same conclusion in its Q-8 (*"Recommendation: separate stream"*). **UX consequence:** if that decision goes the other way, View 5's retention marker will fire far sooner and far more often, and View 14's catch-up window shortens correspondingly. This design assumes separation and flags the dependency (§15.9).

## 8.7 Digest design (for when durable notifications exist)

A returning-founder digest, ordered by priority then age: P0 items in full, P1 items summarized with counts, P2/P3 as counts only with a link. It must state its window (`since your last visit at <time>`) and must state incompleteness when the window exceeds event retention. Requires: durable notification records, a per-user last-seen timestamp, and durable event history — **none of which exist**. Not proposed as scope.

## 8.8 Prohibited

1. No notification without a record.
2. No projection or recommendation as a standalone notification.
3. No cross-class aggregation.
4. No auto-dismissed P0.
5. No implied delivery.
6. No assertive screen-reader announcements except a failed founder decision (§16.9).
7. No badge number on a disconnected feed.
8. No notification for a founder's own action in-session.

---

# 9. Mobile Interaction Plan

## 9.1 Position

The phone is a **triage and decision device**. Its two jobs are: know whether anything needs you, and clear what does. Every other capability is present and reachable but not optimized. This is a deliberate product decision, and it is what keeps the phone experience honest — a phone that tries to be a forensic console produces under-informed decisions.

## 9.2 Breakpoints

**Design floor revised in v1.1.0.** SPRINT-1F-PLAN RES-1 requires *"phone-first, not phone-tolerant — every screen designed and built at 360 × 640 first."* v1.0.0 used a 390 × 844 reference. **Reconciled: 360 × 640 is the design and build floor**; 390 × 844 remains the wireframe reference; the 320 px no-horizontal-scroll requirement (§10.8) is unchanged and stricter than both.

| Range | Layout |
| --- | --- |
| < 480 px | Single column; tab bar; sheets for filters and detail; quick-decision cards. **Must be complete and correct at 360 × 640 before any wider layout is built** |
| 480–767 px | Single column, wider cards; two-up metric tiles |
| 768–1023 px | Two columns; nav rail collapses to icons; detail as a right drawer |
| 1024–1439 px | Full rail + body + attention dock (dock may collapse) |
| ≥ 1440 px | Reference desktop layout |

Layout is content-driven, not device-sniffed. A 768px window on a desktop gets the tablet layout, which is correct.

## 9.3 Navigation and targets

- **Five tabs (revised v1.1.0):** `Home` · `Decide` (badged) · `Work` · `Ask` · `More`. `More` contains Queue, Evidence, Agents, Roadmap, Release, Context, Cost, Notifications, Settings, and the Simulation Lab, grouped as the desktop rail.
  - **Why this changed.** v1.0.0 used `Home · Decide · Queue · Proof`. `Ask` is a named canonical Sprint 1F scope item and needs a tab if it exists at all; `Work` is the better container for Tasks, Projects, and the Queue than a bare `Queue` tab. This adopts the 1F plan's tab set (its C-3) while keeping this document's five desktop groups. **If Q-2 defers the conversation surface, the fifth tab becomes `Proof` as in v1.0.0** — not an empty `Ask`.
- Minimum target 48×48 px, ≥8 px separation; decision buttons ≥56 px tall with a 24 px gap. *(Exceeds the 1F plan's RES-5 floor of 44×44 and WCAG 2.2 AA Target Size; the stricter value is kept deliberately, because these targets carry irreversible decisions.)*
- **Safe-area insets honored** (`env(safe-area-inset-*)`), especially for the bottom tab bar and for any decision button pinned above the home indicator. A confirm button under a home indicator is an accidental-dismissal hazard. *(Adopted from 1F RES-4.)*
- **Installable app shell.** The shell is cached so a cold launch on a poor connection shows structure rather than a blank screen — **and cached data is never rendered without an explicit staleness label** (§2.4 governs; adopted from 1F RES-10, which independently states the same constraint).
- Bottom-sheet detail; the underlying list stays mounted and keeps polling.
- Back gesture and hardware back close the topmost sheet, never navigate away mid-decision.

## 9.4 Gestures

| Gesture | Used for | Never used for |
| --- | --- | --- |
| Vertical scroll | Content | — |
| Horizontal swipe on card rails | Browsing Now cards | — |
| Pull-to-refresh | Forcing a poll | — |
| Tap | All actions | — |
| Long-press | Copy id | Any decision |
| **Swipe on a row** | **Nothing** | **Approve, reject, revise, abandon, accept, dismiss a P0** |

**No decision is ever bound to a gesture.** Swipe-to-act is a well-established mobile pattern and it is explicitly rejected here: these decisions are irreversible, recorded against the Founder's identity, and sometimes authorize new spend. Every one requires a labelled button plus a confirmation with a repositioned confirm control (§16.6).

## 9.5 Continuity across devices

Every view and record is URL-addressable (§3.4), so a decision started on a phone can be finished on a desktop by opening the same link. Filter state lives in the URL. **Read state does not sync** and says so (§14.5). No cross-device draft state exists, and none is implied.

## 9.6 Poor network and offline

- Polling failures produce the same `degraded` → `disconnected` ladder as desktop.
- **Offline:** the last snapshot renders with the red ribbon, all decision controls disabled, and the age counter running. No offline queue, no deferred submission — a queued founder decision that fires later against changed state is unacceptable.
- **Push notifications:** designed but not instrumented. When they exist, only P0 and P1 may push; the payload must carry the subject and the record id and must deep-link to the decision surface; the payload must never contain the decision itself (no actionable push buttons), because a notification action bypasses the confirmation step and the state-freshness check.

## 9.7 Per-view mobile behavior matrix

| View | Mobile pattern | Collapsed by default | Never collapsible |
| --- | --- | --- | --- |
| 1 Home | Stacked zones; Now cards as a snap rail | Waiting, Health, Evidence, Reserved | Posture, Inbox preview, Now Strip, Failures |
| 2 Project | Segmented tabs | — | Header status |
| 3 Roadmap | Tabs `Plan / Recorded / Gaps`, Gaps default | — | Plan disclosure |
| 4 Queue | Lane accordion | Waiting, Running | Needs-you, Stuck |
| 5 Timeline | Attempt selector + vertical stream | Entry detail | Retention marker |
| 6 Agents | Founder lane first; unhealthy pinned | Healthy agents | Founder lane |
| 7 Reviews | Lane accordion | Passed | Escalated, Changes requested |
| 8 Evidence | Cards + bottom-sheet detail | — | Kind chip |
| 9 Approvals | One full-screen card at a time | — | Full summary, actionability |
| 10 Inbox | Full-width cards, oldest first | Membership rule (after first read) | Items |
| 11 Escalations | One per screen; stacked options | Resolved history | Cause headline, consequences |
| 12 Context | Single dark card | Data contract | Statement + risk |
| 13 Budget | Single dark card | Data contract, projections | Statement + risk |
| 14 Notifications | Full-screen list; needs-me on by default | Read items | Disclosure |
| 15 Release | Tabs `Gates / Evidence / Blocking` | — | Disclosure |
| 16 Quick actions | §16 | — | Everything in the flow |

## 9.8 Performance and data discipline

- The 3-second poll is unchanged on mobile, but the phone must not re-render the whole tree per poll; visible content updates in place (no layout shift, no focus loss).
- Skeletons only on initial load, never on refresh (§4.3).
- Text must scale to 200% without clipping any decision control or consequence text; if it cannot, the quick action is withheld (§16.9).
- No animation on stale data, at any breakpoint.

---

# 10. Accessibility Checklist

Target: **WCAG 2.2 Level AA** (STANDARD-011). This checklist is written to be verifiable — each line is something a reviewer can check against a built screen.

## 10.1 Structure and semantics

- [ ] One `<h1>` per view, naming the view; heading levels descend without skipping
- [ ] Landmarks present: `<header>`, `<nav>`, `<main>`, `<aside>`, `<footer>` where applicable
- [ ] Every panel is a `<section>` with an accessible name from its heading
- [ ] Lists are real lists; tables are real tables with `<th>` and `scope`
- [ ] Ordered data (timeline, gates, inbox) uses `<ol>`
- [ ] `<time>` used for all timestamps
- [ ] Skip-to-main-content link is the first focusable element
- [ ] ARIA used only where semantic HTML is insufficient

## 10.2 Keyboard

- [ ] Every action reachable and operable by keyboard
- [ ] Visible focus indicator on every focusable element, ≥3:1 against its background
- [ ] Logical tab order matching visual order
- [ ] No keyboard trap outside intentional modal focus traps
- [ ] `Esc` closes any sheet/dialog and restores focus to the invoker
- [ ] `j`/`k`/`Enter` list navigation does not conflict with assistive-technology keys
- [ ] **No decision has a keyboard accelerator** (§3.5)
- [ ] Shortcut reference available via `?` and discoverable without it

## 10.3 Focus management

- [ ] Dialog focus starts on the dialog heading, not on the confirm button
- [ ] Focus restored to the invoking control on close
- [ ] Focus never moved by a background poll
- [ ] **Rows do not reorder while a descendant has focus** (§1.7)
- [ ] Route changes move focus to the new view's `<h1>`

## 10.4 Colour, contrast, and non-colour encoding

- [ ] Body text ≥4.5:1; large text ≥3:1; UI component boundaries ≥3:1
- [ ] Every status is dot/icon **plus** text label
- [ ] No state, severity, provenance, or claim class is conveyed by colour alone
- [ ] Projection/recommendation/unknown distinguishable without colour or italics (prefix symbol + accessible-name prefix)
- [ ] Gate statuses distinguishable without a green/grey reading
- [ ] Verified against a monochrome rendering and a deuteranopia simulation

## 10.5 Screen-reader behavior

- [ ] Every projection's accessible name begins `Projection:`
- [ ] Every recommendation's begins `Recommendation:`
- [ ] Every unknown's begins `Not recorded:` and includes the reason
- [ ] Every dark panel's heading begins `Not instrumented`
- [ ] Decision controls carry subject-bearing names (`Approve: <subject>`)
- [ ] Disabled controls expose their reason via `aria-describedby`
- [ ] Health badges include their threshold
- [ ] Pip meters expose `N of M`, never a percentage
- [ ] Ids are readable (grouped, not character-spelled runs)
- [ ] Live regions: posture and results are `polite`; only a **failed founder decision** is `assertive`
- [ ] Announcements rate-limited to ≤1 per 30s per region
- [ ] `aria-current="page"` on the active nav item
- [ ] `aria-expanded` on every collapsible

## 10.6 Forms and decisions

- [ ] Every input has a visible `<label>`; placeholders are never the only label
- [ ] Required fields indicated in text, not by colour or asterisk alone
- [ ] Validation errors are text, adjacent to the field, and programmatically associated
- [ ] Confirmation dialog states subject, effect, irreversibility, and snapshot age
- [ ] Confirm control is repositioned relative to the trigger (§16.6)
- [ ] Destructive/irreversible options never adjacent to their opposite
- [ ] Error recovery does not require re-entering data

## 10.7 Motion and timing

- [ ] `prefers-reduced-motion` honored for pulses, transitions, and sheets
- [ ] No animation while the feed is degraded or disconnected
- [ ] No content auto-advances or auto-dismisses a P0
- [ ] No time limit on any decision
- [ ] Countdowns are informational only; nothing expires from the UI's clock

## 10.8 Responsive and zoom

- [ ] Usable at 320 px width with no horizontal scroll of the page body
- [ ] Text scales to 200% without loss of content or function
- [ ] 400% zoom / reflow supported for text content
- [ ] Wide tables scroll within their own container, never the page
- [ ] Touch targets ≥48×48 px with ≥8 px separation; decision buttons ≥56 px
- [ ] Both orientations supported; confirm controls never off-screen

## 10.9 Honesty checks (accessibility of truth)

These are accessibility requirements because a sighted user gets the provenance from styling and a screen-reader user must get it from the accessible name — otherwise the honesty guarantees of §2 apply only to some users.

- [ ] Provenance available non-visually for every panel and weak-provenance value
- [ ] Claim class available non-visually for every projection, recommendation, and unknown
- [ ] Dark states distinguishable from true-empty states non-visually
- [ ] Stale-data warnings in the reading order, not visual-only
- [ ] Retention/durability disclosures in the reading order
- [ ] Escalation cause (origin **and** reason) available non-visually as separate fields

---
# 11. Founder Approval-Flow Specification

## 11.1 Scope and the two decision families

Dev HQ has **two structurally different founder decision families**, and conflating them is the most likely design error in this area. They are kept separate everywhere: separate views, separate vocabulary, separate preconditions, separate consequence text.

| | **Family A — Workflow approval** | **Family B — Escalation resolution** |
| --- | --- | --- |
| Record | `Approval` | `Escalation` |
| Options | Approve · Reject | Revise · Abandon · Accept |
| Precondition | A decision gate must be attached (`waitTokenId`) | Escalation `open`; for Revise, no revision yet authorized |
| Mechanism | The workflow is paused at a gate and resumes on decision | Automated recovery is exhausted; the decision authorizes what happens next |
| Authorizes new work? | Advances an existing run | **Revise authorizes exactly one new execution** |
| Surface | View 9 Approval Center | View 11 Blockers & Escalations |
| Aggregated in | View 10 Decision Inbox | View 10 Decision Inbox |

They are first-class and distinct by architectural intent — escalations exist as their own concept precisely so the approval queue's gate invariant stays clean. The UI must preserve that separation rather than presenting a single "decide" abstraction over both.

## 11.2 Decisions reserved for the Founder

The canonical list, rendered on Home (Zone I) and in View 10. Each entry states whether Dev HQ can currently record it.

| Decision | Family | Recorded in Phase 1? |
| --- | --- | --- |
| Approve or reject a founder-request workflow gate | A | **Yes** |
| Resolve an escalation by **revise** | B | **Yes** |
| Resolve an escalation by **abandon** | B | **Yes** |
| Resolve an escalation by **accept** (accept work automation did not clear) | B | **Yes** |
| Approve a release | — | **No — no release record exists** (View 15) |
| Set or change a budget | — | **No — no budget entity exists** (View 13) |
| Override a review policy | — | **No — deferred, verified absent** (View 7) |
| Change retry or review iteration budgets | — | **No — configured constants, not founder-editable at runtime** |
| Reassign or pause an agent | — | **No — and deliberately not offered** (View 6) |

The last five are shown with `—` and their reason. This is the honest answer to Question 10: the Founder's reserved authority is broader than what the system can currently execute, and the surface says which is which rather than implying the list is the whole of their authority.

## 11.3 Preconditions and capability display

**Family A.** A pending approval is actionable **if and only if** `waitTokenId` is present (existing `ApprovalItem.actionable`). When absent:

> **Cannot be actioned yet — the workflow has not attached a decision gate to this approval. Nothing you do here can take effect.**

Controls are **disabled**, not hidden, so the Founder can see that the item exists and understand why they cannot act.

**Wait token display rule.** The token id is shown **truncated and non-copyable** (`token …a91f`) as an actionability indicator only. Rationale: it is an audit-visible identifier rather than a secret, but a full copyable capability string in a browser surface invites out-of-band use, and the Founder has no legitimate need for the full value. Review callback tokens are excluded from every browser-readable surface by construction (`PublicReview`) and must never be surfaced.

**Family B.** An open escalation is resolvable. **Revise** additionally requires `revisionExecutionId === null`. When it is already set:

> **Revise unavailable — a revision has already been authorized: EX-93.**

This mirrors the server-side invariant, where the revision execution is reserved atomically before creation so a replay cannot produce a second one. The UI disabling the control is not a substitute for that guarantee; it is the UI declining to invite a rejected request.

## 11.4 Flow states

```
        ┌──────────────┐
        │  PRECONDITION │   actionability + feed status not yet known
        │    UNKNOWN    │   → controls NOT RENDERED
        └───────┬───────┘
                ▼
   ┌────────────────────────┐        ┌─────────────────────────┐
   │      NOT ACTIONABLE    │        │       ACTIONABLE        │
   │ controls disabled +    │        │ controls enabled        │
   │ reason on the control  │        └───────────┬─────────────┘
   └────────────────────────┘                    │ founder activates
                                                 ▼
                                    ┌─────────────────────────┐
                                    │      CONFIRMING         │
                                    │ modal; subject, effect, │
                                    │ irreversibility,        │
                                    │ snapshot age            │
                                    └───┬─────────────────┬───┘
                                 cancel │                 │ confirm
                                        ▼                 ▼
                              ┌──────────────┐   ┌─────────────────┐
                              │  ACTIONABLE  │   │   SUBMITTING    │
                              │  (unchanged) │   │ controls locked │
                              └──────────────┘   └────┬───────┬────┘
                                                      │       │
                              response with snapshot  │       │  error
                                                      ▼       ▼
                                      ┌───────────────────┐ ┌──────────────┐
                                      │     CONFIRMED     │ │    FAILED    │
                                      │ snapshot applied; │ │ verbatim msg;│
                                      │ result announced  │ │ re-enabled;  │
                                      └───────────────────┘ │ "Try again"  │
                                                            └──────────────┘
                                              no response / lost
                                                      │
                                                      ▼
                                            ┌────────────────────┐
                                            │    UNCONFIRMED     │
                                            │ controls DISABLED; │
                                            │ "Refresh before    │
                                            │  deciding again"   │
                                            │ ONLY action:refresh│
                                            └────────────────────┘
```

## 11.5 Confirmation dialog specification

Every founder decision, in both families, at every breakpoint, passes through this dialog. There is no "don't ask again", no bulk decide, and no keyboard accelerator.

**Required content, in this order:**

1. **Heading:** `Confirm: <Option>` (e.g. `Confirm: Revise`)
2. **Subject:** the task/approval title plus its ids and project
3. **THIS WILL:** the recorded consequence, verbatim from the option's consequence text (§9.3, §11.3). If the consequence is not recordable, `The downstream effect is not recorded.`
4. **THIS IS FINAL:** `Recorded against your user id. There is no undo.`
5. **Snapshot age:** `Deciding against state from 14:32:07 (4s ago).` — amber when `degraded`
6. **For Revise only:** `This authorizes one new execution with a full retry budget and a fresh review loop.`
7. **For Accept only:** `You are accepting work that automation did not clear.`
8. **Controls:** `Cancel` and `Yes, <Option>` — with the confirm control **in a different screen position** than the control that opened the dialog

**Behavior:**
- Focus starts on the dialog **heading**, never on the confirm button.
- Focus trapped; `Esc` and `Cancel` both dismiss without side effects; focus returns to the invoker.
- Confirm locks both controls and shows a submitting state; the dialog does not close until the outcome is known.
- The dialog is never dismissible by backdrop click while submitting.

## 11.6 Authoritative resolution — no optimistic UI

Both families' endpoints return the full authoritative state snapshot alongside the decision result (verified: the approve/reject and revise/accept/abandon routes each respond with `{ state }`). The UI therefore has no reason to guess, and must not.

**Required sequence:**

1. Submit.
2. On success, **replace the local snapshot with the returned one** (the existing `applySnapshot` path, which also resets the error and stamps a new `updatedAt`).
3. Render the result **only from the new snapshot** — the approval's `status`, `decidedByUserId`, `decidedAt`; the escalation's `resolution`, `resolvedAt`, and any `revisionExecutionId`.
4. Announce the result politely, naming the subject.
5. Offer `Next decision (N)` if the Inbox still has items, so a founder clearing a queue is not sent back to a list.

**Prohibited:** flipping a status locally before the response; showing a success toast on request-send; assuming a resolution from an HTTP 200 without reading the returned state.

## 11.7 Stale and disconnected rules

| Feed status | Decisions | Confirmation dialog |
| --- | --- | --- |
| `live` | Enabled | Standard snapshot-age line |
| `degraded` | **Enabled** | Age line in amber: `Deciding against state from 14:32:07 (2m ago).` |
| `disconnected` | **Disabled** | Not reachable; controls read `Not connected to Dev HQ — decisions are disabled.` |
| `initial` | Not rendered | n/a |

Rationale for permitting decisions while `degraded`: one or two failed polls is a common transient, and blocking a founder from unblocking their own system on a flaky network would cause more harm than a slightly stale read. `disconnected` is different — three consecutive failures means the UI has no basis for believing anything on screen, including whether the decision is still needed.

> **CORRECTION — v1.1.0. This is the most consequential change in the reconciliation.**
>
> v1.0.0's rationale above also asserted that *"the underlying transitions are guarded server-side."* **That claim was wrong for Family B.** The Sprint 1E completion notes record **NB-1 as a confirmed defect**: *"A replayed `accept`/`abandon` escalation resolution overwrites newer task state"* (`escalation-service.ts:505-515, 86-95`), listed as needing to land before non-developer use. Research item **R-14** draws the operational consequence explicitly: *"Mobile networks produce exactly the duplicate-submission conditions NB-1 describes; this item must not proceed before NB-1 is fixed."*
>
> **What this changes, and what it does not.**
>
> - **Does not change** the flow: §11.4's `UNCONFIRMED` state and §4.4's refresh-only rule were already the correct behavior, and they are now *load-bearing rather than merely careful*. A UI that offered "Try again" after an unconfirmed `accept` would actively trigger NB-1.
> - **Does change** the justification: permitting decisions while `degraded` can no longer be defended by server-side idempotency for `accept`/`abandon`. It is defended only by the single-submit lock, the confirmation step, and the refusal to retry. That is a thinner margin, and the Founder should decide it knowing so (§12 OQ-3, revised).
> - **Adds a hard precondition.** Until NB-1 is fixed:
>   1. **Mobile quick-action escalation resolution (§16.4 Family B) must not ship.** Family A remains permitted. This is a blocking gate, not a caution.
>   2. Desktop escalation resolution locks its controls on submit and does not re-enable them on an ambiguous response, under any circumstance.
>   3. The confirmation dialog for `accept` and `abandon` carries one added line: `If this request does not confirm, refresh before deciding again. Do not resubmit.`
> - **Does not extend to Family A.** The approve/reject path is not implicated by NB-1. The distinction is preserved rather than flattened, because flattening it would disable a safe path for an unsafe path's defect.

## 11.8 The other write path — founder request submission

Submitting a new founder request is a write but **not a decision**: it creates work rather than resolving a gate. It therefore does not use the confirmation dialog. Its requirements:

- Labelled fields (title, description, priority) with visible labels and text-based required indicators.
- Validation errors as text, adjacent and programmatically associated.
- On success, the returned snapshot is applied and the new task/run is named with a link to it — never a bare "submitted".
- Disabled while `disconnected`.
- Double-submit protected; the control locks until the response resolves.
- The composer states what happens next, from recorded workflow behavior: `This will enter executive review. If it passes, it will come back to you as an approval.`

## 11.9 Audit and post-decision behavior

- Every decision is visible afterward in: the record's own view (with `decidedByUserId` / `resolvedAt`), the Execution Timeline as a typed entry, the Notifications list, and the decided/resolved history lanes.
- The Founder's own decisions do not notify them in-session (§8.4) but always appear in the list.
- **No undo, anywhere.** The dialog states this before the fact. The remedy for a wrong decision is a new recorded action (e.g. a new founder request), not a reversal — and the UI never implies otherwise.
- Decision history lanes are collapsed by default but never hidden, because "what did I already decide" is a real and frequent founder question.

## 11.10 Prohibited behavior in the approval flow

1. No enabled control without its precondition satisfied and known.
2. No decision without the confirmation dialog.
3. No confirm control in the same position as its trigger.
4. No optimistic status change or premature success indication.
5. No retry after an unconfirmed submission — refresh only.
6. No bulk decisions, no "approve all", no "don't ask again".
7. No keyboard accelerator for a decision.
8. No gesture-bound decision.
9. No adjacent placement of opposing or most-confusable options (`Approve`/`Reject`, `Revise`/`Abandon`).
10. No truncated decision context.
11. No decision while disconnected.
12. No full copyable capability token; no review callback token, ever.
13. No implication that a decision is reversible.
14. No conflation of a validation rejection with a founder rejection.

---

# 12. Open Decisions Requiring an Owner

Recorded as escalations rather than resolved unilaterally, per AGENT-001's escalation standards. None is resolved by this document.

| # | Item | Why it is open | Recommended | Decision owner |
| --- | --- | --- | --- | --- |
| **OQ-1** | Exposing an `AgentAssignment` read-model projection to the browser | Lease health, dispatch confirmation, claim deadline, and heartbeat lapse are persisted but not browser-readable. Without them, Views 4/5/6 render `—` for several of the most operationally useful signals. Whether this falls inside 1E-9's "Mission Control data exposure" remainder is an engineering-scope judgment, not a design one | Expose a `PublicAgentAssignment`-style projection following the `PublicReview` precedent (secrets excluded by construction) | **Lead Software Engineer**, with the Founder for scope authority |
| **OQ-2** | Whether Sprint 1F includes the timeline read-model or only the panel | 1E-8 and the 1E-9 remainder are both approved-deferred to 1F. View 5 is designed to work either way (client-derived now, server-backed later), but the provenance badge and the incompleteness disclosure differ | Confirm both in 1F so the timeline can be badged `live` rather than `derived` | **Founder**, with the Lead Software Engineer as plan owner |
| **OQ-3** | Whether the Founder wants decisions permitted while `degraded` | §11.7 permits it with a warning. This is a risk-tolerance call, not a design call | Permit with the warning | **Founder** |
| **OQ-4** | Where design outputs live and how they are versioned | This document is at `agents/claude-design/outputs/`, matching the agent-outputs precedent, but `docs/` may be the governed home for approved specifications | Route through the documentation-governance workstream. **v1.2.0: routed — GOV-PLAN-001 `G-8`** | **Director of Operations** |
| **OQ-5** | Whether the mobile quick-action set (§16.4) is acceptable to the Founder | It permits both decision families from a phone under strict preconditions. A more conservative Founder may want escalation resolution to be desktop-only | Keep both, given the confirmation and freshness gates | **Founder** |
| **OQ-6** | Ownership of cost/spend instrumentation | Nothing in the repository owns it, and it is not in 1F scope | Route to the research-backlog workstream for sequencing | **Founder**, with the Director of Operations |
| **OQ-7** | Context-health signal vocabulary and thresholds | This design explicitly refuses to invent bands (§12.6) | Context Lifecycle Manager workstream defines them; this UI renders and cites them. **v1.2.0: this row's single owner is superseded — see §12.1. The vocabulary is CLM-owned and delivered; the thresholds are Founder policy** | ~~CLM owner~~ → **CLM owner** (vocabulary, delivered) + **Founder / Governance** (numbers, open as OQ-16) |

## 12.1 Reconciled status of the open questions (v1.1.0)

| # | v1.1.0 status |
| --- | --- |
| **OQ-1** `AgentAssignment` exposure | **RESOLVED — no longer open.** SPRINT-1F-PLAN `D-A` carries it, and independently chose the `PublicReview` projection precedent this document asked for. Views 4/5/6 keep the Unknown fallback as a contingency only |
| **OQ-2** Timeline read-model in 1F | **RESOLVED — no longer open.** 1F-1 (`D-B`) delivers it; the plan also records it as satisfying Phase 2 precondition P-6. View 5 badges `live` on delivery, `derived` until then |
| **OQ-3** Decisions while `degraded` | **STILL OPEN, and now materially different.** The original rationale rested on server-side idempotency, which NB-1 refutes for `accept`/`abandon` (§11.7). The Founder should re-decide with the corrected basis. **Recommendation unchanged (permit, with the age shown) for Family A; for Family B the recommendation now depends on NB-1** |
| **OQ-4** Design-document home and ID | **CORRECTED AT v1.2.0 — ROUTED, still open on the answer.** ~~"No governance plan exists in the tree to route it to."~~ **That statement was false when written.** `GOVERNANCE_UPDATE_PLAN.md` (GOV-PLAN-001 v0.3.0) exists and carries this exact question as **G-8 — "Governed document home and versioning"**, consolidating it by name with this document's *"UX OQ-4 / Q10 / GV-1"* and noting *"UX asks where approved design specs live. Same question as governance-doc versioning. **One answer.**"* **The question now has an owner and a vehicle; what remains open is the Founder/Operations answer, not the routing.** `DESIGN-001` at `agents/claude-design/outputs/` follows the agent-outputs precedent and remains the working position until G-8 is decided. See §15.18 |
| **OQ-5** Mobile quick-action set | **STILL OPEN, and now narrower.** The NB-1 gate (§16.4) answers it provisionally as *approvals resolvable, escalations read-only* on mobile. R-14 confirms the Founder owns this as a Product Decision. **What remains open is whether that split is acceptable, and whether it should persist after NB-1 closes** |
| **OQ-6** Cost instrumentation ownership | **PARTIALLY RESOLVED.** It now has a home: 1F `D-D`/`D-F` under Q-4, and research **R-17** (rank B) owns the enforcement design. **Still open:** the Founder's Q-4 choice, and the rate source. No cost calculation is defined here |
| **OQ-7** Context-health vocabulary and thresholds | **SPLIT AND LARGELY RESOLVED (§15.16).** The **vocabulary is supplied** by `SPEC-CLM-001` §4.7 (`CLM-S5`, seven bands) — CX-1…CX-6 are all answered. The **thresholds were declined by the CLM on governance grounds** and reassigned to the **Founder as versioned policy** (`CLM-S9`), which this document accepts as a better boundary than it proposed. **What remains open is the Founder's approval of the policy record** (governance **P-7 / G-11**), not an ownership dispute. Until then every band renders `provisional` (§12.5.1). **View 12's Phase-1 dark state is unchanged and is confirmed correct by the CLM owner** |

### 12.2 Open questions added by the reconciliation

| # | Question | Owner | Blocks |
| --- | --- | --- | --- |
| **OQ-8** | **Q-2 — what is the conversation surface?** View 17 is specified for the hybrid only; three other readings change or delete it | **Founder** + Lead Software Engineer | View 17, the fifth mobile tab, §3.5's palette scope |
| **OQ-9** | **Q-3 — roadmap, sprint, release.** The 1F plan withdrew its recommendation in favour of this document's `preview` approach for roadmap and sprint, and recommends **cutting release from 1F** | **Founder** | View 3 (confirmation only), View 15 (build or defer) |
| **OQ-10** | **Q-6 — scorecards in or out of 1F**, where ADR-0001 D8 / ADR-0002 D-E6 conflict with the approved scope | **Founder** | View 6's reserved-slot copy (§15.11) |
| **OQ-11** | **NB-1 disposition and sequencing** | **Founder** (remediation approval) + Lead Software Engineer | §16.4 Family B, and the honest basis for OQ-3 |
| **OQ-12** | **Q-8 — do notification and delivery records share the audit `Event` stream?** | Lead Software Engineer under ADR-0003 | View 5's retention-marker frequency and View 14's catch-up window (§15.9) |
| **OQ-13** | **Q-1 — deployment and persistence target.** A restart empties the store, and the UI must distinguish *"no records"* from *"cannot reach the server"* | **Founder**, coordinated across workstreams | The weight and wording of every durability disclosure; §4.4's record-not-in-snapshot copy |
| **OQ-14** | **Is a dedicated Evidence Viewer (View 8) in 1F?** It is not in the 1F screen list; evidence appears there as a field on other screens | **Founder** / Product Owner | View 8 (§15.13) |
| **OQ-15** | **Web Push platform support on the Founder's actual device.** R-14: *"iOS Safari's Web Push support and its installation requirements are the decisive constraint and must be verified against current documentation, not recalled"* | Research workstream, then Founder | Whether §8.6.1's push channel exists at all on the Founder's device |
| **OQ-16** | **Approval of the context-health band policy record** (thresholds, weights, floor values, sampling interval), carried by governance **P-7 / G-11 / F-19**. Also: whether the CLM runs **enforcing or shadow** mode, which follows from Q-1's persistence answer (handoff B-4) | **Founder / Director of Operations** | Whether View 12 can ever render a governed, non-`provisional` verdict, and whether a `critical` band means "halting" or "observing" |
| **OQ-17** | **One Founder-facing label for the `QUARANTINED` / "uncertain" state** (CLM **OQ-C3**, which cites this document's FI-3: *"Two names for one state is the defect UX FI-3 warns about"*) | Lead Engineer + Architecture Reviewer; **§7 then carries the single label** | §7.5 vocabulary and View 12's band labels |
| **OQ-18** | **Cost-instrumentation ownership — now confirmed unowned by three independent documents** (this document's OQ-6, the CLM handoff's OQ-C7/F-7, governance §3). Not a claim by any workstream | **Founder / Director of Operations** | View 13's instrumented state; the CLM's cost metrics; 1F Q-4's cost half |

---

# 13. Validation and Limitations of This Design

Stated plainly, per AGENT-001's validation and honesty requirements.

## 13.1 What was verified

| Check | Method | Result |
| --- | --- | --- |
| Domain entities, statuses, and field semantics | Read every file in `types/domain/` | Confirmed; §7 vocabulary maps 1:1 to recorded types |
| Existing status labels and provenance vocabulary | Read `lib/mission-control/status.ts`, `components/mission-control/DataSourceBadge.tsx` | Confirmed; preserved unchanged |
| Existing view-model derivations | Read `lib/mission-control/view-model.ts` | Confirmed; §5 builds on `buildCommandCenterModel`, `buildStageProgress`, and the existing `actionable` rule |
| Feed/polling and staleness behavior | Read `lib/mission-control/useDevHqState.ts` | Confirmed: 3s poll, 3-failure disconnect threshold, last-good retention, `applySnapshot` |
| Bounds and constants | Read `lib/dev-hq/constants.ts` | Confirmed: 3 attempts, 3 review iterations, 3 dispatch attempts, 60s lease/health, 120s claim & review deadlines |
| Decision endpoints return an authoritative snapshot | Read the approve and revise routes | Confirmed: both respond with `{ state }` |
| Cost is not instrumented | Read `agent-execution-service.ts` | Confirmed: `usage: null` unconditionally |
| Dependencies are not instrumented | Read `dev-task-repository.ts` | Confirmed: `listDependencies` returns `[]` unconditionally |
| Event retention | Read `lib/dev-hq/store.ts` | Confirmed: `slice(0, 200)` |
| Sprint 1F approved scope and deferrals | Read `docs/plans/SPRINT_1E_COMPLETION_NOTES.md` incl. PE-2, PE-3, §6.1, §6.2 | Confirmed; §2.5 and PE-3 handling follow the recorded Founder decisions |
| Accessibility requirements | Read `standards/ACCESSIBILITY_STANDARD.md` | §10 targets WCAG 2.2 AA per the standard |

## 13.2 What was not verified, and cannot be by this document

1. **No usability validation.** There is one user and no testing was performed. Every claim about clarity is design judgment.
2. **No visual design.** No colour values beyond the existing `COLORS` tokens, no typography scale, no spacing system, no iconography set. Wireframes are structural.
3. **No contrast measurements.** §10.4 states the requirements; the ratios must be measured against the real implementation. The existing token set documents `textFaint` as AA-compliant on dark surfaces, but this design's new combinations are unmeasured.
4. **No performance validation.** The 3s poll against these denser views is untested.
5. **No prototype.** Nothing here has been rendered.
6. **No verification that the light-mode requirement is satisfiable.** The existing palette is dark-first; STANDARD-011 requires readability in both themes and this design does not resolve the light theme.
7. **Screen-reader behavior is specified, not tested.** Announcement rate-limiting in particular needs real testing against a 3-second poll.

## 13.3 Known risks in this design

| Risk | Why it exists | Mitigation in the design |
| --- | --- | --- |
| Density on Home | Thirteen questions on one screen | Fixed zone order; only decisions above the fold; collapsible secondary zones |
| Honesty disclosures could become noise | Many provenance badges and caveats | Panel-level badges; per-value badges only for weaker provenance; standing disclosures appear once per view |
| Dark tiles could read as broken | Two prominent unavailable surfaces | Distinct dark visual language, an explicit reason, and a "what would light this up" contract |
| Two decision families could confuse | Different options and preconditions | Kept separate everywhere; Inbox routes rather than decides |
| Timeline provenance shifts | `derived` now, `live` after 1E-8 | Both states designed; badge and disclosure differ |
| Notification honesty | A bell strongly implies delivery | Explicit disclosure on the bell and the view; forbidden vocabulary list |

---
# 14. COLLABORATION HANDOFF

**Status of this document: specialist draft, not the final integrated plan.**

> **v1.2.0 CORRECTION — one of the workstreams named below does not exist.** The list that follows was written from the v1.0.0 assignment brief, before any other output could be read. **There is no separate "Founder Interface UX design" workstream.** That name and *"Phase 1 Mission Control Lite UX specification"* refer to **this document**. Verified three ways, independently: tree inspection (§15.1); GOV-PLAN-001 §0.2, which records *"No such document in the tree"*; and SPRINT-1F-PLAN v0.2.0 **§20.4 R-A3**, which resolves the ownership question outright — *"**DESIGN-001 owns all five**"* (shell, status vocabulary, truth model, decision flow, component inventory).
>
> **Everything in §14 that is predicated on that counterparty is withdrawn at v1.2.0** — §14.3 FI-1…FI-6, §14.4 Q1, §14.5 C1, §14.7 item 1, §14.8's first row, §14.9 item 13, and the "highest risk" line in §14.10. Each is struck in place with its reason, **not deleted**, because §14 is the v1.0.0 record and because the fear it recorded propagated outward: GOV-PLAN-001 carries it as contradiction **X-14** *("Mandate overlap … **High, unreconcilable here**")*, sourced to §14.5 C1. A withdrawal that cannot be traced from the citing document back to the withdrawn claim is not a withdrawal.
>
> **This is a departure from §0.2's rule that "§14 is preserved unchanged as the v1.0.0 record," and it is recorded as one.** The rule was written to stop §14 being quietly retrofitted with hindsight. It was not written to license leaving a false premise in place while another workstream reasons from it. Every other line of §14 is untouched; §15 remains authoritative wherever the two disagree.

This is one specialist's output within a coordinated Savrio planning effort. Other specialists are independently working on **Sprint 1F implementation planning**, ~~**Founder Interface UX design**~~ *(withdrawn — no such workstream; see the correction above)*, **Context Lifecycle Manager specification**, **governance and documentation planning**, and a **future research backlog**. I have no access to those sessions or their outputs, cannot communicate with them, and have not resolved anything inside their scope. Where this design intersects another workstream, the intersection is stated as a **required contract or obligation** and labelled **PENDING CROSS-WORKSTREAM REVIEW**.

## 14.1 Decisions I made

Design decisions taken within my own authority (UX and product design for the Phase 1 Founder experience). Each is reversible on cross-review; §14.8 states what changes if it is reversed.

| # | Decision | Basis |
| --- | --- | --- |
| D1 | Adopted the existing four-value provenance vocabulary (`live`/`derived`/`preview`/`unavailable`) unchanged, and extended its application from panels to individual values | It already ships and is correct; changing it would regress continuity for the one user |
| D2 | Added a **second, orthogonal claim-class axis** (Recorded / Derived / Projection / Recommendation / Unknown) with mandatory visual **and** accessible-name encoding | The Founder's instruction requires predictions and recommendations to be visibly distinguished; provenance alone cannot express it, since a deterministic forecast is still `derived` |
| D3 | Projections may never be counted in a headline metric, coloured with a state colour, notified on, or used to gate an action | Prevents a forecast from acquiring the authority of state |
| D4 | Unknown renders `—` with a mandatory reason; **never `0`** | Zero is a measurement |
| D5 | Views 12 (Context Health) and 13 (Budget & Cost) ship as **first-class, visibly dark surfaces** with a "what would light this up" data contract, rather than being omitted | An omitted question reads as unaskable; a dark one reads as unanswered, which is the truth and is itself actionable |
| D6 | **Empty (dark)** and **Empty (true)** are separate states with separate visual languages | "Nothing is failing" and "we don't measure failure" are opposite messages |
| D7 | The Decision Inbox is the single front door, its membership rule is exactly `pending approvals + open escalations`, and it is the only badged nav group | Makes the badge mean exactly one thing: you are the blocker |
| D8 | The Inbox **routes**; type-specific surfaces **decide** (desktop) | The two decision families have different options, preconditions, and irreversibility; a unified "decide" control is how a founder approves the wrong thing |
| D9 | **No urgency score or recommended ordering** in the Inbox; sorting is oldest-first with explicit user-selected alternatives | A computed urgency ranking is a projection steering founder attention |
| D10 | **No founder-facing retry, cancel, reassign, pause, or review pass/fail control** anywhere | Retry is Execution-Manager-owned under a bounded budget; review resolves through a token-guarded callback. Founder-side equivalents would bypass the guarantees those bounds exist to provide |
| D11 | Escalation cause renders as **four distinct presentations** (`retry_exhausted`; `review_exhausted` × `iterations_exhausted` / `reviewer_unresponsive` / `null`) | Directly implements PE-3, routed by the Founder to 1F design time |
| D12 | Every founder decision passes a confirmation dialog with a **repositioned confirm control**; no accelerators, no gestures, no bulk, no "don't ask again" | These decisions are irreversible and recorded against the Founder's identity; one of them authorizes new work |
| D13 | **No optimistic UI.** Results render only from the authoritative snapshot the endpoints already return | Verified both endpoint families respond with `{ state }` |
| D14 | Unconfirmed submissions offer **refresh only**, never retry | A blind retry on an unconfirmed irreversible decision is the failure mode to prevent |
| D15 | Decisions are **permitted while `degraded`** (with the snapshot age shown) and **disabled while `disconnected`** | Balances transient network flakiness against having no basis for belief |
| D16 | Roadmap is a **three-column plan / gaps / recorded reconciliation** with a hard prohibition on burndown, velocity, and projected dates; reconciliation **suppresses on `degraded`** | No sprint entity exists; a reconciliation produces new conclusions, and a stale conclusion is indistinguishable from a fresh one |
| D17 | Release gates use a three-value vocabulary with **no "Passed"** value | Dev HQ records no gate satisfaction; "Evidence recorded" is the strongest honest claim |
| D18 | Mandatory retention/durability disclosure on every history surface | Verified 200-event cap and in-memory-only storage |
| D19 | `Evidence.uri` renders as literal copyable text, not a hyperlink, until link resolution is verified | Dev HQ does not verify the location |
| D20 | Mobile is a **triage and decision device**; quick actions limited to the two decision families under strict preconditions, withheld entirely when context does not fit above the buttons | A phone that tries to be a forensic console produces under-informed decisions |
| D21 | A **forbidden-vocabulary list** (§7.10) binding all Founder-facing strings | Cheapest enforceable guard against unbacked claims |
| D22 | Home computes its counters from live arrays and **does not use `DevHqState.overview`** | `overview` is typed from placeholder data |
| D23 | When `buildStageProgress` yields `currentIndex < 0` (technical failure), render **no progress bar and no percentage** | The existing `percent: 0` beside a failure reads as "not started", which is false |
| D24 | Screen-reader announcements are **rate-limited to ≤1 per 30s per region**, and only a failed founder decision is `assertive` | A 3-second poll with assertive regions would interrupt continuously |

## 14.2 Assumptions I used

Each is stated so another specialist can invalidate it cheaply.

| # | Assumption | If wrong |
| --- | --- | --- |
| A1 | "Phase 1 Mission Control Lite" is the Founder-facing surface over the delivered Sprint 1E baseline, extended by the panels approved-deferred to 1F | Scope framing in §2.5 needs rebasing |
| A2 | The Founder is the only user; no multi-user roles, permissions, or presence are needed | Ownership, notification, and read-state models all need rework |
| A3 | The delivered 1E baseline is the accurate picture of what data exists (verified at `057e12c`) | §2.5 must be re-verified |
| A4 | Sprint 1F's approved scope is what the completion notes record (1E-8, the 1E-9 remainder, the Evidence/Audit + Escalations + review surfaces, the scorecard domain, the ADR-0002 E5 amendment) and nothing here expands it | §12 OQ-1/OQ-2 must be re-scoped |
| A5 | Memory-only storage and the 200-event cap persist through Phase 1 | Retention disclosures could be relaxed |
| A6 | Existing components and their honesty behavior (`DataSourceBadge`, `StatusPill`, `NotImplementedNote`, the `actionable` rule, `PublicReview`) remain | §6 needs revision |
| A7 | The 3s poll and 3-failure disconnect threshold remain | §2.4 thresholds need retuning |
| A8 | Dark theme remains primary; a light theme is required by standard but unresolved here | §10.4 and §13.2 item 6 |
| A9 | Desktop reference is 1440×900 and phone reference 390×844 | Wireframes need re-cutting |
| A10 | Cost, context health, release, notification delivery, sprint entities, and human assignees remain uninstrumented in Phase 1 | The corresponding dark states become live states, per the contracts already specified |
| A11 | The Founder wants honesty prioritized over visual completeness where they conflict | The whole of §2 is the wrong trade-off, and much of the design changes |

## 14.3 Interfaces and dependencies involving another workstream

All **PENDING CROSS-WORKSTREAM REVIEW**. Each states what my design needs and what obligation that creates — the other workstream's owner decides whether to accept it.

### Sprint 1F implementation planning

> **v1.0.0 observation — now superseded by §15.** At v1.0.0, `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md`, `docs/plans/PHASE_2_PROGRAM_PLAN.md`, and `docs/research/` had appeared untracked in the working tree and **I deliberately did not read them**, per the instruction not to assume access to other specialists' outputs. That prediction held: **SF-1, SF-2, and SF-4 were already resolved by the 1F plan** (as `D-B`/1F-1, `D-A`, and its Q-6 respectively), so this table's "open dependency" framing was stale rather than wrong. **Read §15.0 and §2.5.1 instead of this table.** SF-5 (PE-3) is the one row that stands unchanged and was independently required by both other documents (§15.10).

| Ref | Interface | Obligation / contract | Consequence if declined |
| --- | --- | --- | --- |
| **SF-1** | Execution timeline read-model (1E-8) | If delivered, View 5 badges `live` and drops the client-merge disclosure. If not, View 5 works client-derived and **must** stay badged `derived` | View 5 ships either way; only provenance and one disclosure differ |
| **SF-2** | `AgentAssignment` read-model projection (§12 OQ-1) | Needed for: dispatch confirmation, claim deadline, lease expiry, heartbeat lapse, wait reason W5, and timeline dispatch/claim entries. Must follow the `PublicReview` precedent — secrets excluded by construction | Views 4/5/6 render `—` with "not exposed to the browser" in ~6 places. Functional, materially less useful |
| **SF-3** | Whether `DevHqState.overview` will be replaced by live counters | Home does not use it either way (D22); if it stays placeholder-typed, that should be recorded | None to this design |
| **SF-4** | Scorecard domain (D-E6) | View 6 reserves a slot rendering Empty (dark). Whatever shape lands, it needs per-agent aggregates and a stated measurement window | Slot stays dark; no redesign needed |
| **SF-5** | PE-3 rendering obligation | View 5, View 7, and View 11 **must** render `Review.escalationReason` alongside `Escalation.origin`, as four distinct presentations. This is the Founder-routed requirement, not a design preference | Non-negotiable; a 1F implementation that renders `origin` alone does not satisfy the Founder decision |
| **SF-6** | Task dependency instrumentation | Not requested as 1F scope. If it lands, wait reason W6 splits into "Blocked by <task>" plus a residual unknown | Currently designed as W6 only |

### ~~Founder Interface UX design — **HIGHEST CONFLICT RISK**~~ — **WITHDRAWN IN FULL (v1.2.0)**

> **FI-1 … FI-6 are withdrawn. Their counterparty does not exist.** Each was an interface addressed to a workstream this document was told about and never found. Struck in place rather than deleted, per §14's correction banner.
>
> **What replaced them.** The question all six asked — *who owns the shell, the vocabulary, the truth model, the decision flow, and the component inventory?* — is **answered, in this document's favour, by the counterparties themselves**: SPRINT-1F-PLAN v0.2.0 §20.4 **R-A3** (*"DESIGN-001 owns all five. This plan's §5 and §6 are withdrawn as competing definitions"*), Phase 2 §17.3 (*"Design is authoritative on UX"*), and 1F interface **I-2**. See **§15.1**, which is the live record; this table is not.
>
> **One rule inside the withdrawn table survives, and is re-homed rather than struck**, because another specialist's document cites it by name. **FI-3's rule** — *"§7 must be the single Founder-facing vocabulary across every founder surface; two vocabularies for one state set is a defect regardless of which is better"* — is **retained as a live requirement of this document**, now binding across the surfaces this document owns rather than across a boundary with an absent party. It is cited by `SPEC-CLM-001` **OQ-C3** (*"Two names for one state is the defect UX FI-3 warns about"*) and carried here as **OQ-17**. **A citation must still resolve after a withdrawal; withdrawing the premise does not withdraw the principle.**

| ~~Ref~~ | ~~Interface~~ | Disposition at v1.2.0 |
| --- | --- | --- |
| ~~**FI-1**~~ Scope boundary undefined | ~~"Founder Interface UX design" and "Phase 1 Mission Control Lite Founder experience" may be the same surface, adjacent surfaces, or a superset/subset~~ | **WITHDRAWN — the premise is false.** They are the same document. No boundary exists to be undefined |
| ~~**FI-2**~~ Navigation shell | ~~If both workstreams define a shell, exactly one must win~~ | **WITHDRAWN.** Design owns it (1F R-A3). §3 stands unchanged; nothing was removed or demoted |
| ~~**FI-4**~~ Provenance and claim-class model | ~~If the other workstream defines a different truth model, they conflict directly~~ | **WITHDRAWN.** No competing truth model exists. §2 stands unchanged; its promotion question is GV-3, routed at §15.18 |
| ~~**FI-5**~~ Decision flow | ~~§11 should govern every founder decision anywhere in the product~~ | **WITHDRAWN as a conflict; retained as a recommendation.** §11's reach beyond these views is part of the GV-3 promotion question, not a boundary dispute |
| ~~**FI-6**~~ Component inventory | ~~§6 must merge with theirs, or one must be designated the base~~ | **WITHDRAWN.** There is no "theirs" to merge with. §6 is the base (1F R-A3) |
| **FI-3** Status vocabulary | **RETAINED, re-homed.** §7 carries exactly one Founder-facing label per state across every surface this document specifies | **LIVE.** Cited by CLM **OQ-C3**; carried as **OQ-17** |

### Context Lifecycle Manager specification

| Ref | Interface | Obligation / contract |
| --- | --- | --- |
| **CX-1** | Per-execution context usage and its limit | Provide used + limit, or an explicit "limit unknown". Without a denominator the UI shows no band |
| **CX-2** | **Safety band vocabulary and thresholds** | **The Context Lifecycle Manager owner must define these. This UI will not.** A designer-chosen threshold is a fabricated health verdict. Absent a vocabulary, View 12 renders raw numbers with no verdict |
| **CX-3** | Compaction events with timestamps and what was retained | Emit as lifecycle events, ideally in the existing event vocabulary, so View 5 can place them on the timeline |
| **CX-4** | A context-attributed failure flag or distinguishable failure code | Highest-value signal: it separates "the work is hard" from "the harness ran out of room". Today a context exhaustion is indistinguishable from a task timeout |
| **CX-5** | Sampling interval | Required so the UI can age a band and render `Measurement stale` rather than a stale `safe` |
| **CX-6** | Partial-measurement semantics | The UI will never average a partial measurement into a healthy verdict; unreported executions are excluded from band counts and shown as excluded |

### Governance and documentation planning

| Ref | Interface | Obligation / contract |
| --- | --- | --- |
| **GV-1** | Home for this document and its document ID | Provisionally `DESIGN-001` at `agents/claude-design/outputs/`. If governance defines a design-document series or a `docs/` home, this moves and re-IDs (§12 OQ-4). **ROUTED at v1.2.0 → GOV-PLAN-001 `G-8`**, which consolidates GV-1 / OQ-4 / Q10 with the governance-document versioning question and states *"One answer."* Awaiting the Founder/Operations decision, not a routing decision |
| **GV-2** | ADR-0002 E5 amendment (carried to 1F) | Views 5 and 8 assume the read-model and the panel land together. The amendment's final wording should agree. **Now owned:** 1F **I-11** hands it to the governance workstream, which carries it |
| **GV-3** | Whether §2 (truth model), §7.10 (forbidden vocabulary), and §11 (decision flow) become **governed standards** rather than one design document's rules | My recommendation: yes. They are cross-cutting honesty constraints, and a design document is a weak place to enforce a constitutional-grade rule. Owner: Director of Operations. **ROUTED at v1.2.0 → GOV-PLAN-001 governance backlog `O-1`**, *"Promote UX §2 / §7.10 / §11 to governed standards"*, ranked **Optional** with the note that *"declining is coherent: the rules then bind only those views, which the UX spec states and accepts."* **The plan's characterisation is accurate — that is exactly §14.5 C5.** SPRINT-1F-PLAN v0.2.0 **E-6** routes the same question to the same place. **The recommendation stands; the rank is Operations' to set, not mine** |
| **GV-4** | Release process authority | View 15 reads `RELEASE_PROCESS.md` and `VERSIONING_POLICY.md` as the gate source. If the process changes, the gate list changes. I did not modify either |
| **GV-5** | Approval record for this document | §14.9 lists the sections needing Founder sign-off |

### Future research backlog

| Ref | Interface | Obligation / contract |
| --- | --- | --- |
| **RB-1** | **Cost/spend instrumentation ownership is unassigned** (§12 OQ-6) | View 13's contract (§13.6) is the consumer-side requirement: persisted usage, a rate source, a budget entity, attribution, currency convention. The UI will not hardcode prices |
| **RB-2** | Durable event history and notification records | Required for the digest (§8.7) and for a non-truncating timeline. Not proposed as scope |
| **RB-3** | Light theme | Required by STANDARD-011, unresolved here (§13.2 item 6) |
| **RB-4** | Usability validation with the Founder | The only way to test §1's premise that thirteen questions can be answered from one screen |
| **RB-5** | Push notification delivery | Designed in §9.6 with a hard constraint: payloads carry subject + record id and deep-link only; **no actionable push buttons**, because a notification action bypasses confirmation and the freshness check |

## 14.4 Questions another specialist must answer

| # | Question | Owner | Blocks |
| --- | --- | --- | --- |
| ~~**Q1**~~ | ~~Is "Founder Interface UX design" the same surface as this, a superset, or adjacent? Who owns the shell, vocabulary, and truth model?~~ **WITHDRAWN (v1.2.0) — the question has no second party.** The first half is void: there is no such document. The second half is **answered** — SPRINT-1F-PLAN v0.2.0 §20.4 **R-A3** assigns the shell, status vocabulary, truth model, decision flow, and component inventory to **DESIGN-001**, on AGENT-001 § Department Boundaries grounds, and withdraws its own §5/§6 as competing definitions. Phase 2 §17.3 concurs. **What remains is a signature, not a question** — GOV-PLAN-001 §3 lists the formal ownership sign-off as Founder or Director of Operations | ~~Founder / Director of Operations~~ **Withdrawn** | ~~Integration of this entire document~~ **Nothing. It blocked nothing, and never did** |
| **Q2** | Will Sprint 1F expose an `AgentAssignment` projection? | Lead Software Engineer + Founder | ~6 fields across Views 4/5/6 |
| **Q3** | Will 1F deliver the timeline read-model, or only the panel? | Founder + Lead Software Engineer | View 5's provenance badge and disclosure |
| **Q4** | What are the context-health signals, band vocabulary, and thresholds? | Context Lifecycle Manager owner | View 12's instrumented state |
| **Q5** | Who owns cost instrumentation, and in which phase? | Founder / Director of Operations | View 13's instrumented state |
| **Q6** | Should §2/§7.10/§11 be promoted to governed standards? | Director of Operations | Whether these rules bind other surfaces |
| **Q7** | Is the Founder comfortable deciding while the feed is `degraded`? | Founder | §11.7 |
| **Q8** | Is the mobile quick-action set acceptable, or should escalation resolution be desktop-only? | Founder | §16.4 |
| **Q9** | Is the light theme in Phase 1 scope? | Founder / Product Owner | §10.4 completeness |
| **Q10** | Where do approved design documents live and how are they versioned? | Director of Operations | §14.3 GV-1 |
| **Q11** | Does the Founder accept "Evidence recorded" instead of "Passed" on release gates? | Founder | View 15's vocabulary |
| **Q12** | Will the release process gain system-recorded gates, or stay process-only? | Governance workstream | Whether View 15 stays `preview` |

## 14.5 Potential conflicts with another workstream

| # | Conflict | Severity | Nature |
| --- | --- | --- | --- |
| ~~**C1**~~ | ~~**Overlapping mandate with Founder Interface UX design**~~ | ~~High~~ → **WITHDRAWN (v1.2.0)** | **There is no second design. The conflict had one party.** ~~"Two independently produced founder-facing designs may define different navigation shells, status vocabularies, truth models, and decision flows for the same user."~~ No such second design exists, and none ever did — confirmed independently by tree inspection (§15.1), GOV-PLAN-001 §0.2, and SPRINT-1F-PLAN v0.2.0 §20.4 R-A3. The ownership question the conflict wrapped is **resolved in this document's favour by the other workstreams, on governance grounds** (§15.1). **Downstream correction owed:** GOV-PLAN-001 carries this conflict as **X-14**, rated *"High, unreconcilable here"*, sourced to this row. **X-14's second party does not exist, so X-14 should be closed, not adjudicated.** That is the governance workstream's record to correct — this document has no authority over it and does not edit it; it is flagged here and in §15.18 |
| **C2** | **View 12 could be read as specifying the Context Lifecycle Manager** | **Medium** | It does not, and says so. But its data contract (§12.6) names fields, which could be mistaken for a subsystem spec. **The Context Lifecycle Manager owner has authority over signals, names, and thresholds; §12.6 is a consumer request, and this UI explicitly declines to define bands.** |
| **C3** | **§14.3 SF-2 could read as expanding Sprint 1F scope** | **Medium** | I was instructed not to broaden 1F. SF-2 is filed as a **declared dependency with a designed fallback**, not a scope request. If declined, the design ships with `—` placeholders and no redesign. The scope decision is the Founder's, via the Lead Software Engineer |
| **C4** | **Views 12/13/15 imply future instrumentation** | **Medium** | Their existence could be read as committing to cost, context-health, and release instrumentation. It does not. They are dark surfaces that make an unanswered question visible. Sequencing belongs to the research-backlog and governance workstreams |
| **C5** | **§2/§7.10/§11 assert product-wide rules from a design document** | **Medium** | If governance declines to promote them, they bind only these views, and another founder surface could legitimately contradict them — which would defeat their purpose |
| **C6** | **View 3 renders planning documents as UI content** | **Low–Medium** | This creates a coupling between `docs/plans/` prose structure and a rendered view. The documentation workstream may not want plan documents to be a UI data source. **Fallback: View 3 degrades to the recorded column only**, losing reconciliation but staying honest |
| **C7** | **View 15 reads the release process as a gate list** | **Low–Medium** | Same coupling concern for `RELEASE_PROCESS.md`. Same fallback: recorded facts only |
| **C8** | **Notification classes may need to align with a logging/observability taxonomy** | **Low** | §8 is derived from lifecycle event names in `constants.ts`. If observability defines its own severity taxonomy, they should reconcile — and there is a recorded open item that `LOGGING_STANDARD.md` and `ERROR_HANDLING_STANDARD.md` do not exist |
| **C9** | **Founder-facing labels vs. developer-facing status strings** | **Low** | §7 mandates one Founder-facing label per state. An implementation plan that surfaces raw enum values (`needs_revision`) would violate it |

## 14.6 Information another specialist should incorporate

Findings from my repository verification that other workstreams likely need, independent of whether they accept any of my design:

| # | Finding | Who needs it | Why |
| --- | --- | --- | --- |
| **I1** | **`store.events` is capped at 200 (`store.ts:226`) and storage is memory-only** | 1F planning, governance, research backlog | Any audit, timeline, digest, or history feature is lossy and non-durable today. An audit-history requirement cannot be met without durable storage |
| **I2** | **`usage` is set to `null` unconditionally (`agent-execution-service.ts:81`)** | Research backlog, 1F planning | Cost, token accounting, and model attribution are all blocked at the same single point. Also relevant to the Context Lifecycle Manager: token counts would come from the same place |
| **I3** | **`listDependencies()` returns `[]` unconditionally (`dev-task-repository.ts:94`)** | 1F planning, governance | `TaskDependency` is declared but inert. Any "blocked by" or dependency-ordering feature starts from zero, and no UI can honestly render blocking today |
| **I4** | **`AgentAssignment` is persisted but absent from `DevHqState`** | 1F planning | Lease, heartbeat, dispatch confirmation, and claim deadline are invisible to any browser surface. Affects observability and reliability work, not just UI |
| **I5** | **`DevHqState.overview` is typed from `data/placeholders/mission-control.ts`** | 1F planning, governance | A live-looking field carrying placeholder data is a standing misleading-data hazard for any consumer, not only Home |
| **I6** | **`STAGE_INDEX.failed === -1`, so a technical failure records no stage** | 1F planning, observability | No surface can say where a run failed. Also means `percent: 0` is emitted beside failures, which reads as "not started" |
| **I7** | **Two independent bounded counters exist for reviews** — iterations (3) and dispatch attempts (3) | 1F planning, governance | Merging them anywhere destroys the exact distinction PE-3 asked to preserve |
| **I8** | **`PublicReview`'s `?: never` construction is load-bearing** | 1F planning, security review | Any new browser-readable projection (e.g. an assignment projection) should follow this precedent rather than a bare `Omit` |
| **I9** | **Both decision endpoint families already return `{ state }`** | 1F planning | No optimistic UI is needed anywhere; the authoritative-snapshot pattern is already available |
| **I10** | **`sprint-1e-baseline` is a descriptive tag, not a version release** | Governance, release planning | Release state genuinely lives in process and git, not in Dev HQ. Any release dashboard needs a new record type |
| **I11** | **`handbooks/INDEPENDENT_CODE_REVIEWER.md`, `NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, and `ERROR_HANDLING_STANDARD.md` are recorded as missing** (1E notes §7 item 6, still OPEN) | Governance | Pre-existing open item; my §8 notification taxonomy would otherwise want a logging/severity standard to align with |
| **I12** | **The Founder decision at PE-3 routed the `escalationReason` display requirement explicitly to 1F design time** | 1F planning | §5 View 5, View 7, View 11 discharge it. An implementation that renders `origin` alone leaves the Founder decision unsatisfied |

## 14.7 Items that must remain unresolved until cross-review

I have deliberately **not** decided these, and no downstream reader should treat them as settled:

1. ~~**Whether this design or the Founder Interface UX design owns the shell, vocabulary, and truth model** (C1, Q1). Everything about integration depends on it.~~ **WITHDRAWN (v1.2.0)** with C1 and Q1. It was never unresolved — it was unresolvable as posed, because it named a party that does not exist. Design owns all five (§15.1; 1F R-A3). **Nothing about integration depended on it.**
2. **The context-health signal set, band vocabulary, and thresholds** (CX-1…CX-6). View 12's instrumented state is a shape, not a specification.
3. **Whether the assignment read-model is in Sprint 1F** (SF-2, Q2). Both outcomes are designed; neither is chosen.
4. **Whether the timeline read-model lands with the panel** (SF-1, Q3).
5. **Cost instrumentation ownership, sequencing, and the rate-source decision** (RB-1, Q5).
6. **Whether §2, §7.10, and §11 become governed standards** (GV-3, Q6).
7. **This document's home, ID, and versioning** (GV-1, Q10).
8. **Whether planning and release documents may be UI data sources** (C6, C7, Q12).
9. **Light theme scope** (RB-3, Q9).
10. **Whether the Founder accepts the risk trade-offs in §11.7 (deciding while degraded) and §16.4 (mobile quick actions)** (Q7, Q8).

## 14.8 Recommended changes if another specialist disagrees

Stated as concrete fallbacks so disagreement costs a revision, not a rewrite.

| If … | Then change |
| --- | --- |
| ~~**Founder Interface UX design owns the shell**~~ **WITHDRAWN (v1.2.0)** | ~~Drop §3 (navigation map) and §6.3 (layout components); keep §2, §5 view specs, §7, §8, §10, §11 as content that plugs into their shell. Re-anchor §3.4 URLs to their routing scheme.~~ **This fallback is void — its trigger cannot occur.** §3 and §6.3 stand. Recorded because it was the fallback §14.10 pointed at, and a reader following that pointer must find the withdrawal rather than the plan |
| **A different truth model is adopted** | §2 is the load-bearing dependency for every view's "prohibited misleading behavior" subsection. Those subsections must be re-derived from the adopted model — **do not keep them while changing §2**, or the views will enforce rules the model no longer states |
| **The claim-class axis is rejected as too heavy** | Minimum viable fallback: keep the **`—` rule (D4)** and the **prohibition on projections in headline metrics, colours, and notifications (D3)**. Those two carry most of the protection. Drop the `≈`/`▸` symbols and the dashed styling if they are judged noisy |
| **Dark views 12/13 are rejected as clutter** | Do **not** delete them. Collapse each to a single Home tile plus a short explainer popover, keeping the reason text. Deleting them re-hides two of the Founder's own thirteen questions |
| **The Inbox-routes-only rule is rejected** | Permit inline decisions **only** with the full §11.5 confirmation dialog and the full verbatim context on the card, and apply §16.4's context-too-long withholding rule at every breakpoint |
| **Confirmation is judged too slow** | Keep the dialog for Family B (escalations, which authorize new work) and for `Reject`. The lightest defensible reduction is a single-step `Approve` on an actionable, `live`, fully-visible approval card. I do not recommend it, and it should be a recorded Founder decision |
| **The retention disclosure is judged alarming** | Reduce from a persistent marker to a once-per-session notice **plus** a permanent short footnote on history views. It must not be removed entirely while storage is memory-only |
| **Roadmap's three-column reconciliation is rejected** | Fall back to the recorded column only (C6). Keep the prohibition on burndown, velocity, and projected dates regardless — that prohibition is independent of the layout |
| **Release gate vocabulary is rejected** | If "Passed" is required, it must be backed by a recorded gate-satisfaction entity. Until that exists, the fallback is to remove gate statuses entirely and show only recorded facts — **not** to relabel "Evidence recorded" as "Passed" |
| **`AgentAssignment` exposure is declined** | No redesign needed. The `—` placeholders and their "not exposed to the browser" reasons are already specified in Views 4, 5, and 6 |
| **Mobile quick actions are judged too risky** | Restrict quick actions to Family A only, and route Family B to `Open full decision`. §16 already specifies that fallback path |
| **The 30s announcement rate limit is judged too slow for accessibility** | Retune the interval, but keep the **polite-except-failed-decision** rule (D24). Assertive regions on a 3-second poll are the actual hazard |

## 14.9 Sections requiring Founder approval

Ordered by consequence. Items 1–4 are foundational: approving the rest without them leaves the design without a basis.

| # | Section | What is being approved | Why it needs the Founder |
| --- | --- | --- | --- |
| **1** | **§2.1–§2.3 Truth model and claim classes** | That provenance and claim class are mandatory, and that projections may never be counted, coloured, notified on, or used to gate an action | Constrains every future surface. It is a product-values decision, not a UI one |
| **2** | **§2.5 Data availability register** | That this is the accurate picture of what Dev HQ records, and that the "Not instrumented" rows are the approved state rather than defects | Directly extends the Founder's own PE-2 reasoning; everything else is built on it |
| **3** | **§2.6 + per-view prohibited-behavior subsections** | The complete prohibition set | These are binding constraints on implementation |
| **4** | **§1 + §12 Views 12/13 as first-class dark surfaces** | That two of the thirteen questions ship visibly unanswered rather than hidden | The Founder asked all thirteen; this is the honest answer to two of them and they should agree to it |
| **5** | **§11 Founder approval-flow specification** | Two decision families, mandatory confirmation, no optimistic UI, refresh-only on unconfirmed, no undo, degraded-permitted / disconnected-disabled | Governs the Founder's own irreversible actions (Q7) |
| **6** | **§11.2 Decisions reserved for the Founder** | The canonical list, including the five the system cannot currently record | A statement about the Founder's authority |
| **7** | **§10.3 Decision Inbox membership rule** | Exactly pending approvals + open escalations, and the badge means only that | Determines what the Founder can trust the badge to mean |
| **8** | **§7 Status vocabulary incl. §7.10 forbidden words** | One Founder-facing label per state; the forbidden list | Founder-facing language; also GV-3 |
| **9** | **View 3 §3.12 and View 15 §15.13 prohibitions** | No burndown / velocity / projected dates; no "Passed" gate status; no release actions | The Founder may want a conventional roadmap and release dashboard; this design argues those would be fabrications, and the Founder should decide knowingly (Q11) |
| **10** | **§16.4 mobile quick-action set** | Which decisions are phone-safe, and the context-too-long withholding rule | Risk tolerance (Q8) |
| **11** | **§4.4 + §11.6 failure and ambiguity handling** | Refresh-only after an unconfirmed decision | Chooses correctness over convenience at the worst moment |
| **12** | **§12 OQ-1…OQ-7** | Routing of each open question to its owner | Several are the Founder's own |
| ~~**13**~~ | ~~**§14.5 C1**~~ **WITHDRAWN (v1.2.0)** | ~~That the mandate overlap with Founder Interface UX design is resolved by designating one owner before integration.~~ **No overlap exists to resolve.** What is left is a formality: GOV-PLAN-001 §3 records the ownership sign-off as awaiting *"Founder or Director of Operations"*, and both counterparty workstreams have already ceded in writing (1F R-A3, Phase 2 §17.3). **Reduced from an approval item to a signature** | ~~Only the Founder or the Director of Operations can settle it~~ — still theirs to sign, but nothing is contested |

## 14.10 Handoff summary for another agent

> **DESIGN-001 — Phase 1 Mission Control Lite Founder Experience. Specialist draft. UX/product design only: no code, no library choices, no commits, no Sprint 1F scope expansion.**
>
> **What it contains.** A navigation map (command bar + 5-group rail + persistent Project▸Sprint▸Task▸Execution▸Attempt context spine + attention dock + 4 mobile tabs), a 16-view screen inventory with full text wireframes, and per-view specifications covering purpose, primary question, information, actions, states, empty/loading/failure states, stale-data warnings, mobile behavior, accessibility, and prohibited misleading behavior. Plus a component inventory (~40 behavior contracts), a status vocabulary mapped 1:1 to recorded domain types, a notification taxonomy (P0–P3, record-triggered only), a mobile interaction plan, a WCAG 2.2 AA checklist, and a Founder approval-flow specification.
>
> **The organizing idea.** Two orthogonal axes govern every value on screen: **provenance** (`live` / `derived` / `preview` / `unavailable` — the existing shipped vocabulary, preserved) and **claim class** (Recorded / Derived / **Projection** / **Recommendation** / **Unknown**). Projections and recommendations are visually and non-visually distinguished, and may never be counted in a headline metric, coloured with a state colour, notified on, or used to gate an action. Unknown renders `—` with a reason, never `0`.
>
> **Verified data reality (§2.5).** Instrumented: projects, tasks, executions, approvals, workflow runs, events, agents, evidence, escalations, reviews, findings, attempt counts. Persisted but not browser-exposed: `AgentAssignment` (lease, heartbeat, dispatch, claim deadline). Approved-deferred to 1F: timeline read-model, scorecards. **Not instrumented at all: cost/tokens (`usage: null` unconditionally), context health, sprint entities, release/version records, notification delivery, task dependencies (`listDependencies` returns `[]`), human assignees.** Event history is capped at 200 and memory-only. `DevHqState.overview` is placeholder-typed and is not used.
>
> **How that reality is handled.** Every unanswered Founder question keeps a first-class, visibly *dark* surface with an explicit reason and a "what would light this up" data contract — never a hidden or fabricated one. **Empty (dark) and Empty (true) are separate states with separate visual languages**, because "nothing is failing" and "we don't measure failure" are opposite messages.
>
> **Decisions.** Two structurally distinct founder decision families — workflow approvals (Approve/Reject, gated on an attached wait token) and escalation resolutions (Revise/Abandon/Accept, with Revise disabled once a revision is authorized). The Decision Inbox aggregates exactly pending approvals + open escalations and is the only badged nav group; it **routes**, type-specific surfaces **decide**. Every decision passes a confirmation dialog with a repositioned confirm control. No optimistic UI — results render only from the authoritative snapshot both endpoint families already return. An unconfirmed submission offers refresh only, never retry. Decisions are permitted while degraded (with the snapshot age shown) and disabled while disconnected. No founder-facing retry, cancel, reassign, pause, or review pass/fail control anywhere.
>
> **Discharges the Founder's PE-3 routing:** `Review.escalationReason` renders alongside `Escalation.origin` as four visually distinct presentations, so "the reviewer kept rejecting the work" is never conflated with "the reviewer never answered".
>
> **Cross-workstream status.** ~~**Highest risk: an undefined mandate boundary with the parallel Founder Interface UX design workstream** (§14.5 C1) — if both define a shell, vocabulary, or truth model, one owner must be designated before either is authoritative; §14.8 gives the exact fallback (drop §3 and §6.3, keep the rest as pluggable content).~~ **WITHDRAWN AT v1.2.0. There is no such workstream, so there was no boundary and no risk.** Design owns the shell, status vocabulary, truth model, decision flow, and component inventory — ceded in writing by both counterparties (SPRINT-1F-PLAN v0.2.0 §20.4 **R-A3**; Phase 2 §17.3) and confirmed absent by GOV-PLAN-001 §0.2. **The highest cross-workstream risk in this document is not this and never was; §16.9 states the four that are real.** View 12 is a **consumer surface** for the Context Lifecycle Manager, which owns the signals and names — **and which declined the thresholds, reassigning them to the Founder as versioned policy (`CLM-S9`); this UI refuses to invent either, and that refusal is unchanged.** View 13's cost contract has **no assigned owner** (now confirmed unowned by three independent documents — OQ-18). `AgentAssignment` exposure (§14.3 SF-2) is a **declared dependency with a designed `—` fallback, not a scope request** — and 1F **R-A1** has since answered it **yes**, so the fallback is not exercised.
>
> **Not decided (§14.7):** ~~shell/vocabulary ownership~~ *(withdrawn v1.2.0 — Design owns it)*; ~~context-health signals~~ *(supplied by `CLM-S5`)* and **thresholds** *(still open — Founder policy, OQ-16)*; ~~assignment and timeline read-model scope~~ *(both answered yes by 1F R-A1/R-A2)*; cost ownership; whether §2/§7.10/§11 become governed standards *(routed to GOV-PLAN-001 `O-1`)*; this document's home and ID *(routed to `G-8`)*; whether planning and release documents may be UI data sources; light-theme scope; the Founder's risk tolerance on degraded decisions and mobile quick actions.
>
> **Founder approval needed on 13 items (§14.9)**, foundationally: the truth model (§2.1–2.3), the data availability register (§2.5), the prohibition set (§2.6), and shipping two of the thirteen questions as visibly unanswered.
>
> **Not validated:** no usability testing (one user, none performed), no visual design, no measured contrast ratios, no prototype, no light theme, screen-reader behavior specified but untested (§13.2).

---

# 15. Cross-Document Reconciliation Register (v1.1.0)

**Purpose.** §14 was written without access to the other workstreams' outputs. This section performs the reconciliation §14 deferred. **Where §14 and §15 disagree, §15 is authoritative.** §14 is preserved unchanged as the record of what was and was not known at v1.0.0.

## 15.0 What was reconciled, and what could not be

| Named document | Present? | Read | Reconciled |
| --- | --- | --- | --- |
| Sprint 1F Mission Control Lite plan | **Yes** — `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` (**SPRINT-1F-PLAN v0.2.0**, ~1,793 lines, untracked specialist draft). **Re-keyed at v1.2.0 from v0.1.0 / 1,466 lines** — see §15.18 for what changed and what was re-read | §§1–13, 20 in full; 14–19, 21, appendices scanned. **v1.2.0 additionally re-read §20.3 and §20.4 in full at v0.2.0** | **Yes — fully at v0.1.0; §20.4 re-read and reconciled at v0.2.0 (§15.18). Body sections §1–§13 were not re-read at v0.2.0 — disclosed, not assumed** |
| Phase 2 program plan | **Yes** — `docs/plans/PHASE_2_PROGRAM_PLAN.md` (PLAN-P2-001, 3749 lines, untracked) | §0–§2.1, §1.1–1.4, Stage 2D (§6), §17.3 cross-workstream register | **Yes — for the parts that bind Phase 1 UX** |
| Research backlog | **Yes** — `docs/research/RESEARCH_BACKLOG.md` (2620 lines, untracked) | Index, R-13, R-14, R-17, E-1a, E-4 | **Yes — for the UX-anchored items** |
| **Context Lifecycle Manager specification** | **Yes — appeared mid-pass** — `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0, 3013 lines) + `CLM_COLLABORATION_HANDOFF.md` (426 lines) | §0, §4.7, §4.8 in full; §1–§5 structure; handoff read for Design-facing obligations | **Yes — see §15.16.** Supersedes §15.7 |
| **Governance plan** | **Yes — appeared mid-pass** — `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (v0.3.0, 784 lines) | §0, §3, §4.6, §4.8 in full; §2, §7 scanned | **Yes — see §15.17.** Partially supersedes §15.14 |

**Sequencing, recorded honestly.** The first pass of this register found only three of the five documents and said so. **The CLM specification and the governance plan then appeared in the working tree while this reconciliation was in progress**, and were read and reconciled in a second pass (§15.16, §15.17). The rows above reflect the second pass. §15.7 and §15.14 are retained but are **superseded where §15.16 and §15.17 disagree with them** — in particular, §15.7's central claim that no CLM document exists is now false, and §15.16 replaces it. This is not a cosmetic correction: §15.7's reasoning was sound and its conclusion about View 12's dark state survives, but its premise did not.

**Still true:** three of the five documents record that the **Master Roadmap v7.1 is cited as governing authority and is absent from the repository** (§15.14 item 2, §15.17). Nothing in this document depends on a document I could not open.

## 15.1 Navigation-shell and truth-model ownership — RESOLVED

This was §14.5 C1, flagged as the highest integration risk. **It is resolved, and it resolved in this document's favour — by the other workstreams, independently, on governance grounds rather than merit.**

| Question | Resolution | Source |
| --- | --- | --- |
| **Who owns the navigation shell?** | **Design.** SPRINT-1F-PLAN's "Cross-workstream boundaries" applies AGENT-001 §Department Boundaries — *"Design defines the approved user experience"* — and states: *"Where this plan and the design specification describe the same surface, the design specification is authoritative and this plan defers to it."* Its §4, §5, §6, §11, §12 are explicitly marked **PENDING CROSS-WORKSTREAM REVIEW** and *"an engineering-side sizing input."* Its interface **I-2** requests from Design *"the authoritative navigation map, screen inventory, URL scheme, view-state set, and absence/provenance vocabulary… §5/§6 here are superseded by it on contact."* | 1F plan, "Cross-workstream boundaries" and §20.4 I-2 |
| **Who owns the truth model?** | **Design.** Phase 2 §17.3 records: *"Design is authoritative on UX per AGENT-001 §Department Boundaries. 2D §6.6/§6.12 name `claude-design` as a blocking reviewer; our dashboard descriptions are engineering sizing inputs, not UX decisions."* | Phase 2 plan §17.3 |
| **Was there a second Founder Interface UX design workstream?** | **No such document exists in the tree.** The Sprint 1F plan's title includes *"and Founder Interface"*, which is very likely what §14 was told about. **The overlap §14.5 C1 feared was between this document and the Sprint 1F plan — and that plan has already ceded the UX half.** | Tree inspection |

**Consequence, per instruction 7 of the reconciliation request:** Sprint 1F does **not** own the shell, so **no shell definition is removed or demoted from this document.** §3 remains authoritative. What *is* demoted is the 1F plan's §5/§6 — by its own terms, not by this document's assertion. This document's obligation is the converse one: **to absorb what those sections got right**, which §15.2–§15.4 do.

**However — a governing contract now constrains the truth model, and it corroborates rather than conflicts:**

> Phase 2 Stage 2D §6.7, citing Master Roadmap §3: Mission Control *"displays authoritative state and labels predictions clearly."* And: *"Every forecast, scenario, and projection is visually and structurally distinguished from measured state, including `isProjection` on the snapshot itself."* And: *"Recommendations never mutate state — the Recommendation Service has no write path… a recommendation becomes action only through a decision by a role with the required authority."* And: *"Confidence never replaces evidence."*

Per instruction 4, the provenance vocabulary and the five claim classes are **preserved unchanged** — no governing contract proves a conflict, and this one is an independent restatement of the same discipline at roadmap level. Two additions follow from it:

1. **The Projection class is now roadmap-mandated, not merely a design preference.** §2.2's prohibitions (never counted, never coloured, never notified on, never gating an action) implement a roadmap requirement. This raises §2's status from design convention to standards candidate (§15.14).
2. **`isProjection` is a structural, not only visual, requirement.** 2D expects the distinction to exist *on the snapshot*. **UX consequence, stated as a required contract, not a design of one:** any read model carrying a projected value must mark it as projected in the payload, so the UI's claim-class encoding derives from data rather than from a component author remembering. **PENDING CROSS-WORKSTREAM REVIEW** — the field's name, shape, and granularity are the Lead Software Engineer's.
3. **The Recommendation class is corroborated exactly.** §2.2's rule that a recommendation "may pre-focus a control, never pre-select one" is the UI expression of *"no write path."*

## 15.2 The six-field decision header — ADOPTED

SPRINT-1F-PLAN §6.4 defines a cross-cutting rule v1.0.0 did not have: every entity surface renders **Status · Current owner · Status reason · Next gate · Blockers · Evidence**, in the same order, in the same place.

**This is a better information-architecture rule than anything in v1.0.0 and is adopted wholesale.** Rationale: v1.0.0 answered the thirteen questions well *per view* but let each view choose its own field order, which makes a Founder re-learn the layout on every surface. A fixed header means the first three fields always answer "what, who, why" in the same physical position.

Adopted as:

- A required component, `DecisionHeader` (§6.4), rendered as a unit or skeletoned as a unit — **never partially populated**, because a Founder reads the first three fields and acts.
- Rendered on Views 2, 5, 7, 9, 11, 18, and on every row-detail sheet.
- Absent fields render per the reconciled Unknown rule (§2.2 note): the words **"Not recorded"**, not a bare glyph.
- `Current owner` is derived by the 1F plan's §7.3 rules and **must not fall back to `Task.assigneeAgentId` alone** — that field records intent, not present ownership (§18.3).
- `Status reason` is a new vocabulary slot (§15.5).

## 15.3 Surfaces this document had missed — ADDED

Three of the 1F plan's six identified divergences were **defects in v1.0.0**, not disagreements. All three are corrected.

| 1F ref | Gap | Correction |
| --- | --- | --- |
| **C-5** | The **Simulation Lab** was absent from v1.0.0's navigation map. **ADR-0001 D9 makes it a permanent surface** — omitting it was a defect against an approved ADR | **View 20** added. Relocated to `/lab` under `SYSTEM` / `More`; **behavior, controls, and copy unchanged**; one provenance header added because it is the only surface where a Founder action creates work |
| **C-6** | No standalone **Task** surface; tasks were reachable only via the Context Spine | **View 18** added (`/tasks`, `/tasks/<id>`), carrying the six-field header. It is the J-4 entry point ("drilling from symptom to cause") and a spine segment is not a substitute for a list |
| **S-16** | No **Settings** surface. v1.0.0 could not host push-subscription management, session control, install, or transport reporting — and §14 had marked preference controls prohibited *because* nothing backed them | **View 19** added. It is now the one place a preference control is legitimate, with the constraint that **provenance badges are never hideable** (§19.3) |

## 15.4 The Founder conversation surface — ADDED, conditionally

1F conflict **C-1** is the largest substantive divergence: a conversation and command surface is **canonical Sprint 1F scope item #1**, and v1.0.0 had no such view — only a `⌘K` navigation palette.

**Resolved by adding View 17**, specified for the plan's recommended hybrid (grounded read-only Q&A plus structured, confirmed commands) and explicitly conditional on Founder decision **Q-2**, with a stated fallback for each of the other three readings (§17.13).

**What View 17 deliberately does not do**, per instruction 3: it defines no conversation architecture, no model, no grounding mechanism, no prompt design, and no orchestration policy. It defines the interaction contract — mandatory grounding, structured command cards, no typed confirmation, no conversational bypass of §11.5, and untrusted record text rendered as quoted data rather than as instruction.

**Why the grounding block is mandatory rather than encouraged:** a conversational answer reads as authoritative regardless of its provenance, which makes it the single easiest place in the product to violate §2. Refusing to answer ungrounded is the only rule that holds.

## 15.5 Status-reason vocabulary and the wait-reason split

The 1F plan's `statusReason` field (its `D-C`/§7.3) and this document's **wait reasons** (§7.6) are the same concept approached from opposite ends: theirs derives from the most recent state-changing event, mine from why the item is waiting. **Reconciled:** §7.6's six wait reasons are the Founder-facing vocabulary for the *waiting* subset of `statusReason`; the field additionally covers non-waiting states (running, failed, succeeded), which §7.2's existing tokens already name.

Two consequences:

1. **W5 becomes renderable** once `D-A` exposes assignments (§2.5.1).
2. **A new gap is disclosed by the plan and inherited here.** The 1F plan's §7.3 records that a declined dispatch currently emits **zero events** (ISSUE_MATRIX AR2-1, *reproduced*), so *"queued, agent null"* has **no recorded reason** and the field *"must render 'Not recorded' — which is honest, and useless."* The proposed remediation adds `execution.assignment_deferred` and `execution.claim_lost`, both **awaiting Founder approval**. **UX position: render "Not recorded" and say what is missing.** Views 4 and 18 must not fabricate "waiting for capacity" for an execution whose decline was never recorded — that inference is exactly what W6 exists to prevent. **PENDING CROSS-WORKSTREAM REVIEW** — the event taxonomy is not UX-owned.

## 15.6 Roadmap and release honesty constraints — CONVERGED, and one deferral

**Roadmap and sprint.** The 1F plan withdrew its own Q-3 recommendation in favour of this document's approach, in its own words: *"Design renders it `⚠ preview` sourced from planning documents. That is a fourth option for Q-3 — better than any of this plan's three, because it delivers the view without inventing an entity. This workstream withdraws its Q-3 recommendation in favour of Design's approach."* **View 3 is unchanged.** Its hard prohibitions — no burndown, no velocity, no projected date, no sprint percentage, no write actions, reconciliation suppressed on `degraded` — stand, and are now the plan's position too.

**Release.** The plan recommends **cutting S-13 from 1F** because *"release is a process the repository documents but does not yet execute, so modeling it now would model an aspiration."* That is the same reasoning View 15 uses to refuse a "Passed" gate status, taken one step further. **Reconciled position: View 15 is specified and ready, and this document does not object to its deferral.** If it is cut:

- Its honesty constraints **carry forward** to whichever sprint builds it: three-value gate vocabulary, **no "Passed"**, no readiness score, no release actions, no treating "no blocking facts" as approval, and no presenting a descriptive git tag as a version release.
- Question 13 ("what is the next gate?") is still answered — by the **approval gates** in the six-field header and the Attention Dock, which are recorded. Only the *release* gate half goes dark, and Home's Next Gate tile states which half it is.

## 15.7 Context health — first pass (SUPERSEDED BY §15.16)

> **This subsection is retained as the record of the first pass, when no Context Lifecycle Manager specification existed in the tree. It is superseded by §15.16.** Its conclusion — that View 12's dark state is the correct Phase-1 rendering — survives and is independently confirmed by the CLM owner. Its premise, that no CLM document exists, is now false. Read §15.16 for the reconciled position.

**No Context Lifecycle Manager specification exists in the working tree.** What the tree does say:

- Phase 2 precondition **P-5** names the Context Lifecycle Manager as a **Phase 1 deliverable placed in Sprint 1G/1H**, not 1F.
- Research **R-13** (context caching, rank **C**) anchors to *"Sprint 1H Context Router + Context Lifecycle Manager (P-5)."*
- 1F's `D-G` requires *"the executing agent to report context utilization"*, and its **R-4** records that ADR-0001 D4's deterministic simulated agents *"have no context window."*
- 1F's **I-5** asks the CLM workstream for a contract and states: *"1F… should not design context health independently."*

**Three conclusions, and none of them is a design choice:**

1. **View 12's dark state is not a placeholder — it is the correct and only honest Phase-1 rendering.** Not because instrumentation is late, but because the subsystem that would produce the signal is scheduled two sprints later and the agents that would emit it do not have the property being measured.
2. **§12.6's refusal to define bands or thresholds is preserved and reinforced**, per instruction 3. There is now *no document in the tree* that could be cited as the authority for a threshold, which makes inventing one strictly worse than it was at v1.0.0.
3. **§12.6's requested contract stands unchanged as an obligation on the CLM workstream**, and remains **PENDING CROSS-WORKSTREAM REVIEW**. It is a consumer's field list, not a specification.

**One clarification the reconciliation permits.** View 12's dark-state copy may now name *when* the answer is expected — `Context measurement is planned with the Context Lifecycle Manager (Sprint 1G/1H).` That is a citation of a planning document, badged `preview`, not a promise.

## 15.8 Checkpoints and model/provider attribution — ADDED as Unknown surfaces

Two canonical 1F scope items v1.0.0 did not cover at all.

**Checkpoints** (`D-H`, a new entity; 1F §2.4; journey J-8). Durable resume points in a long-running execution. Nothing in the current spine emits or consumes one, and **R-4** records that simulated agents produce none. **UX position:** checkpoints are timeline entries (View 5) and a View 12 field, rendered `Not recorded` in Phase 1. This document defines **no checkpoint semantics, no resume behavior, and no retention policy** — all are backend and orchestration decisions (instruction 3).

**Model and provider per execution** (`D-E`, new fields). The 1F plan makes a distinction that is genuinely a claim-class problem and is handled as one:

> *"`Agent.provider` is a free-text `string` on the agent, not on the execution. A retry pins provider via `ExecutionRouting.provider` — that is a routing constraint, not an attestation of what actually ran."*

**UX position.** Two different fields with two different claim classes, never merged into one "Model" label:

| Field | Claim class | Rendering |
| --- | --- | --- |
| `ExecutionRouting.provider` | **Recorded** — but a record of a *constraint* | `Routed to: claude-code` with the qualifier `routing constraint, not an attestation of what ran` |
| What actually served the execution | **Unknown** until `D-E` lands | `Model not recorded` — **never** back-filled from the routing field |

Rendering the routing pin as the model would be a fabricated attestation. This matters beyond tidiness: cost attribution (§13) and model-performance questions both key on what actually ran, and a routing constraint silently promoted to an attestation would corrupt both.

## 15.9 Notifications and PWA — MATERIALLY CHANGED

The largest revision in v1.1.0 after NB-1. v1.0.0 treated notification delivery as not instrumented and prohibited any delivery claim. The 1F plan puts **1F-9 (PWA shell)** and **1F-10 (Web Push)** in scope with `D-I` (subscription store) and `D-J` (delivery record), and research **R-14 is rank A** — *"notification is not an add-on to 1F, it is 1F's headline journey."*

Changes made: §8.5 channels revised; §8.6 delivery-honesty rule replaced with the three-part recordable-delivery rule; **§8.6.1 added** with the push policy and payload contract; §9.3 mobile shell revised for five tabs, safe-area insets, and the cached app shell; View 19 added for subscription and preference management.

Three constraints inherited from other workstreams, each preserved verbatim in intent:

1. **Notify only on Founder-actionable transitions** (1F R-11). A channel that fires on progress trains the Founder to ignore the channel J-1 depends on.
2. **The payload must carry `origin` *and* `escalationReason`** (R-14: *"A notification that conflates them is worse than the queue doing so."*) — see §15.10.
3. **Platform support must be verified, not recalled** (R-14, on iOS Safari). §19.3 therefore reports only what the browser tells it and never asserts a general platform capability. **OQ-15** carries the verification.

And one this document contributes, unchanged from v1.0.0 and now stated against a real channel: **no action buttons in the payload.** A notification action bypasses the confirmation dialog and the freshness check — the two guards that make an irreversible decision safe.

**Dependency:** if Q-8 puts notification and delivery records in the shared 200-cap audit `Event` stream, View 5's retention marker fires far sooner and View 14's catch-up window shortens. This design assumes separation (the plan's own recommendation) and flags it as **OQ-12**.

## 15.10 PE-3 escalation-origin presentation — TRIPLE-CONFIRMED, and extended

All three documents independently require it, which makes this the most corroborated single requirement in the set:

| Source | Statement |
| --- | --- |
| This document (v1.0.0) | Four visually distinct cause presentations across Views 5, 7, 11 (§11.3, §7.5) |
| SPRINT-1F-PLAN | S-4: *"**Must render `escalationReason` beside `origin`** — carried-forward requirement PE-3"* |
| RESEARCH_BACKLOG R-14 | *"the queue would otherwise conflate 'the reviewer kept rejecting the work' with 'the reviewer never answered.' A notification that conflates them is worse than the queue doing so."* |

**Reconciled position — unchanged in substance, extended in reach.** The four-way presentation (§11.3) is authoritative and now applies to **four surfaces, not three**: Views 5, 7, 11, **and the push payload** (§8.6.1). R-14's experiment brief asks for *"the exact payload for each of the four escalation origins… and check each is decidable from the notification alone"* — §8.6.1's payload table is that specification's UX half.

The **`escalationReason: null` case remains a distinct fifth rendering** (`Escalated — reason not recorded`), and §11.8's rule that it must never be collapsed with *"review not in snapshot"* is unchanged. Neither other document addresses the null case; this document owns it.

## 15.11 Scorecards — a live governing-document conflict, not a deferral

v1.0.0's View 6 called scorecards "approved-deferred (D-E6)". **That was wrong**, and the correction is in the body (View 6, §6.3).

**The actual state — and a correction to the second pass of this register.** My first pass wrote that *"ADR-0001 D8 and ADR-0002 D-E6/E9 place scorecards in Sprint 1F."* **That repeated a misquote in the Sprint 1F plan's Q-6, and the governance plan caught it.** Verified directly in both ADRs:

| Source | Verbatim | Placement |
| --- | --- | --- |
| ADR-0001 **D8** | *"Scorecards: deferred to Phase 2 … out of Phase 1 scope unless they become required for Phase 1 acceptance"* | **Phase 2** |
| ADR-0002 **D-E6** | *"Scorecards and analytics are deferred to **Sprint 1F**"* | **Sprint 1F** |

So the conflict is real but its shape is the opposite of what the 1F plan states: **the two ADRs disagree with each other**, not jointly with the scope. `GOVERNANCE_UPDATE_PLAN.md` §4.8 records this and notes that *"a conclusion resting on a misquoted ADR cannot be approved as-is under GOV-001:369-371"* — the 1F plan's *conclusion* (scorecards out of 1F) is right, its basis is not, and the correction belongs to the 1F owner.

**It also flags a third position — mine.** §14.2 **A4** assumed 1F's approved scope includes *"the scorecard domain"*, taken from the 1E completion notes' deferral list. **A4 is withdrawn on this point.** The honest statement is that three documents hold two positions over a misquote, and only the Founder can settle it (governance **B-6**; 1F **Q-6**; §12.2 **OQ-10**).

Phase 2 §17.5 records the conflict from its side and §1.2 P-9 assigns D8 to 2D/2E *"but see §17.5 conflict."*

**UX-owned consequence, and the only part of this that is mine:** View 6's reserved-slot copy must assert **neither** outcome. Required wording is in the body. Rendering "deferred" would state a Founder decision that has not been made — precisely the failure mode this document exists to prevent, committed by this document at v1.0.0.

## 15.12 NB-1 — the correction that changes behavior

Fully specified at §11.7 and §16.4. Recorded here because it is the one reconciliation finding that **changes what may ship**, rather than what is labelled.

v1.0.0 justified permitting decisions on a `degraded` feed partly by asserting that transitions are *"guarded server-side."* The Sprint 1E completion notes record **NB-1 as a confirmed defect** — a replayed `accept`/`abandon` overwrites newer task state — and R-14 states that mobile networks produce exactly those conditions and that the work *"must not proceed before NB-1 is fixed."*

The flow v1.0.0 designed was already correct (refresh-only after an unconfirmed submission, never retry). What was wrong was the *reason given*, and a wrong reason is dangerous because a later reviewer may relax a rule whose justification does not hold. The gate at §16.4 and the amended rationale at §11.7 fix both.

**Note on independent convergence:** this document forbade retry-after-ambiguity on general principle, before knowing NB-1 existed. That the defect turned out to be real is the strongest available argument for §2's general posture — but it is not a reason to keep the wrong justification.

## 15.13 The Evidence Viewer — a design position, flagged

**View 8 (Evidence Viewer) is not in the 1F screen list.** Evidence appears there as a *field* on other screens (`D-C`, §6.4) and as an evidence-surfacing requirement (§17.3), but not as a browsable surface.

**Position, offered as a recommendation rather than a resolution:** keep it. Question 8 ("what evidence proves progress?") is one of the Founder's thirteen, and a field on another screen answers "what evidence backs *this item*" — not "what has been proven lately", which is the question a Founder asks when deciding whether to trust the system at all. It is also the cheapest view in the set: `DevHqState.evidence` is fully exposed and needs no new backend work.

**Routed as OQ-14.** If the Founder cuts it, the evidence *field* on the six-field header carries the load, and §8's honesty constraints (uri not a verified link, count is not a quality measure, absence is not "unverified") **carry forward to that field**.

## 15.14 Governance — first pass (SUPERSEDED BY §15.17, and its premise corrected at v1.2.0)

> **This subsection is retained as the record of the first pass, when no governance plan had been found in the tree. It is superseded by §15.17.** Its four items survive in substance; **its premise did not.** Banner added at v1.2.0 for symmetry with §15.7, which carried one from the start — the asymmetry was itself a defect, because a reader arriving at §15.14 directly had no signal that its opening sentence was withdrawn.

~~**No governance plan document exists.**~~ **FALSE — corrected at v1.2.0.** `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (GOV-PLAN-001 v0.3.0, ~784 lines) **exists, and was on disk before this file was last written.** It is read and reconciled at §15.17. The first pass reconciled instead against `docs/company/GOVERNANCE.md`, the ADRs, and the governance findings embedded in the two plans. Four items, retained:

1. **§14.3 GV-3 is strengthened.** The recommendation to promote §2 (truth model), §7.10 (forbidden vocabulary), and §11 (decision flow) to **governed standards** now has external support: Phase 2 2D §6.7 cites Master Roadmap §3 as already requiring that Mission Control *"labels predictions clearly"*, and expects `isProjection` structurally. A roadmap-level requirement implemented only inside one design document is under-governed. **Owner: Director of Operations.** Still open (OQ-4).
2. **The Master Roadmap v7.1 is cited as governing authority by Phase 2 and is not in the repository** (its own §17, research **E-1a**, 1F **I-6**). **This document was written without it and may conflict with it in ways I cannot see.** Stated as a limitation, not a request — and it is the single largest unquantifiable risk to this reconciliation.
3. **Review sequencing.** The 1E corrective action requires both gates to run **before** commit (GOV-001 order). This document is a pre-implementation design artifact and is an input to those gates, not a subject of them; Phase 2 2D §6.12 names `claude-design` a **blocking reviewer** for downstream Founder-interface work, which is the obligation this document creates.
4. **Document identity remains unresolved** (OQ-4). `DESIGN-001` at `agents/claude-design/outputs/` is the working position, matching the agent-outputs precedent. ~~No governance document exists to route it to.~~ **Corrected at v1.2.0: GOV-PLAN-001 `G-8` carries it by name.** The identity is still undecided; the *routing* never was.

## 15.15 What this reconciliation deliberately did not touch

Per instructions 3, 8, 9, and 10:

- **No file was modified except this one.** No code, no ADR, no roadmap document, no plan, and no other specialist's file. Verified by `git status`.
- **No commit was made.**
- **No context-health threshold, safety band, or operational score is defined here** (§15.7).
- **No cost calculation, rate source, currency convention, or budget record shape is defined here** (§2.5.1, View 13).
- **No persistence, transport, event-taxonomy, or orchestration decision is made here** — Q-1, Q-7, Q-8, and the ISSUE_MATRIX event additions are all recorded as dependencies (OQ-12, OQ-13, §15.5).
- **No Sprint 1F scope was expanded.** Every surface added in v1.1.0 (Views 17–20) already exists in the 1F plan's own scope as S-8, S-14, S-16, S-17. Adding them **narrows** the gap between the two documents rather than widening scope; View 20 in particular restores compliance with ADR-0001 D9. The one item this document argues *for* keeping (View 8) is routed to the Founder as OQ-14, not asserted.
- **The provenance vocabulary and the five claim classes are preserved unchanged**, per instruction 4. No governing contract proved a conflict; the one that came closest (2D §6.7) corroborates them.
- **The true-empty / unavailable distinction is preserved unchanged**, per instruction 5, and is now corroborated by the 1F plan's **R-2** (*"fabricated-looking placeholders… Severe — destroys the trust the interface exists to create"*) and **AC-19**, which makes plausible placeholders a sprint failure.

## 15.16 Context Lifecycle Manager — RECONCILED (supersedes §15.7)

`SPEC-CLM-001` v1.1.0 had already read and reconciled against v1.0.0 of this document, so this is a second exchange rather than a first contact. **Every item requested in §12.6 / CX-1…CX-6 is answered.**

| This document asked for | CLM answer | Status |
| --- | --- | --- |
| **CX-1** bounded usage figure and its limit | Capacity signals (its §3.3) with an explicit limit | ✅ Answered |
| **CX-2** a band vocabulary defined by the subsystem, thresholds included | **Amended, not rejected.** Vocabulary supplied (`CLM-S5`, seven bands). **Thresholds declined and reassigned to the Founder as versioned policy** (`CLM-S9`) | ✅ Answered, with a counter-obligation on this view |
| **CX-3** compaction events with timestamps | The decision ladder emits them (its §5.4) | ✅ Answered |
| **CX-4** a context-attributed failure flag | Provided via the floor conditions and session states | ✅ Answered |
| **CX-5** a stated sampling interval | `CLM-S8`: every band carries `sampledAt` and the interval in force; *"a consumer that cannot age a band must render no verdict"* | ✅ Answered — and stricter than this document asked |
| **CX-6** partial-measurement semantics | `CLM-S7`: no fleet verdict; unmeasured sessions excluded from any count and reported as excluded | ✅ Answered — identical to §12.15 rule 4, reached independently |
| §14.5 **C2** *"View 12 could be read as specifying the CLM"* | *"It does not, and the CLM owner confirms it. §12.6 is correctly a consumer request"* | ✅ **Conflict closed** |

**Three obligations flowed back to this view, and all three are applied:**

1. **Seven bands, not three** (§12.5). `uncertain` and `blocked` must be bands, because a coherent-but-halted session must never render `safe`.
2. **Provisional rendering** (§12.5.1) — a new claim-class case: a Recorded measurement scored against an *unapproved* rule. Deliberately **not** styled as a Projection, because "unapproved rule" and "statement about the future" are different errors and conflating them would create a third.
3. **Projection-only rendering** (§12.15 rules 8–10) — `PublicContextHealth` and nothing else; no consumer-computed band; no shadow-mode band shown as enforcing.

**Where CX-2's amendment lands, and why this document accepts it.** The CLM declined the thresholds on governance grounds: *"A threshold decides when work is stopped… a numeric threshold on context health is an organizational risk posture — how much degradation Dev HQ tolerates before halting an employee — and AGENT-001 places that class of decision with the Founder."* **That is correct and this document accepts it.** v1.0.0 offered the thresholds to engineering because it was certain they were not Design's to invent; it did not consider that they might not be engineering's either. The four-way ownership split in `CLM-S9` — signal set and vocabulary to CLM, numbers to Founder/governance, **rendering to Mission Control**, aggregation to Phase 2 stage 2E — is a cleaner boundary than anything either document proposed alone.

**Independent convergence worth recording**, because it is evidence rather than agreement: the governance workstream reached the identical split as **G-11** without coordination, calling it *"the cleanest cross-workstream convergence in the set"*, and created precondition **P-7** to carry it.

**What the CLM changes about Phase 1: nothing.** Stated by its owner: *"The CLM does not light up View 12. It makes the dark state data-driven."* The dark state ships as designed. §15.7's conclusion stands; only its premise was wrong.

**Two items the CLM raises that this document must carry:**

- **OQ-C3 — is CLM `QUARANTINED` the same state as 1E/2A "uncertain"?** Routed to Lead Engineer + Architecture Reviewer, and it cites this document's FI-3 as the reason: *"One vocabulary. Two names for one state is the defect UX FI-3 warns about."* **UX position: §7 must carry exactly one Founder-facing label for that state, whichever internal name wins.** Carried as **OQ-17**.
- **OQ-C7 / F-7 — cost instrumentation is unowned.** The CLM handoff lists it in its ownership table as *"**Unowned**… This gap has no owner and needs one"*, and the governance plan's §3 lists it as *"Unassigned — UX OQ-6, View 13 has no owner."* **Triple-confirmed across three documents.** This is now the clearest unowned gap in the programme; §16.6 raises it.

## 15.17 Governance — RECONCILED (partially supersedes §15.14)

`GOVERNANCE_UPDATE_PLAN.md` v0.3.0 exists and had read §12 and §14 of this document.

| Item | Governance position | Effect here |
| --- | --- | --- |
| **Context-health thresholds** | Reassigned from the CLM owner to **Founder / Operations**, carried as **G-11 / P-7 / F-19**. *"Until approved, every band renders `provisional` and View 12 cannot show a governed verdict"* | Corroborates §12.5.1 exactly, including the consequence |
| **Scorecards** | §4.8: three documents, two answers, **one misquote** — and it caught mine as *"a third position"* | §15.11 corrected; §14.2 **A4** withdrawn on this point. Founder decision **B-6** |
| **Roadmap authority** | §4.6: two problems, not one — the roadmap is unverifiable *and* `AGENTS.md`'s eight authority tiers contain no roadmap tier. *"Every roadmap-derived claim in the Phase 2 plan is an **unverifiable premise**"* | Sharpens §15.14 item 2. Founder decision **B-9** |
| **Shell / vocabulary / truth-model ownership** | §3 lists it as owned by *"Founder or Director of Operations"*, noting *"the counterpart workstream is absent"* | **Independently corroborates §15.1**: there is no competing UX workstream, and the ownership question is a formality awaiting a signature |
| **Cost instrumentation ownership** | §3: *"Unassigned — UX OQ-6, View 13 has no owner"* | Third confirmation (§15.16) |

**~~What the governance plan does *not* address, so these remain open and unowned~~ — CORRECTED IN FULL AT v1.2.0. The governance plan addresses both. Both are routed and owned; neither is unowned.**

> **This was the most consequential error in v1.1.0's reconciliation, and it is the same error the reconciliation was written to catch: a claim about another document's contents, asserted without reading the part that contradicts it.** §15.17 read GOV-PLAN-001's §0, §3, §4.6 and §4.8 in full and *scanned* §2 and §7 — and the two items below live in §1 and §2.4, which the scan did not resolve. Both were on disk, in that document, before this file was last written. Corrected below rather than quietly re-worded.

1. **Promotion of §2 (truth model), §7.10 (forbidden vocabulary), and §11 (decision flow) to governed standards** — §15.14 item 1, §14.3 **GV-3**, §12 **OQ-4**'s sibling question. ~~"The plan's backlog does not carry it."~~ **False. It carries it as `O-1`** — *"Promote UX §2 / §7.10 / §11 to governed standards (UX Q6, C5, GV-3)"* — ranked in the plan's **Optional** tier, with the note: *"Genuine value, but declining is coherent: the rules then bind only those views, which the UX spec states and accepts."* **That characterisation is accurate and this document does not contest it** — it is a fair restatement of §14.5 **C5**, which is this document's own admission. SPRINT-1F-PLAN v0.2.0 **E-6** routes the same question to the same place and names the same owner. **What actually remains open is the Founder/Operations answer and the *rank*, not the routing and not the ownership.** The supporting case is unchanged and unweakened: Phase 2 2D §6.7 shows the requirement already exists at roadmap level, and the CLM independently built `provisional: true` propagation on the same principle. **Recommendation, clearly labelled as one and not as an approved decision:** the rank understates it — a constraint that three workstreams independently implemented is behaving like a standard already, and `O-1`'s "Optional" tier reflects governance's cost judgment rather than the constraint's reach. **Rank is Operations' call, not Design's.** **Owner: Director of Operations.**
2. **This document's home, ID, and versioning** — **OQ-4 / GV-1 / Q10**. ~~"Remains the working position by agent-outputs precedent"~~ *(true)* ~~with nowhere to route it~~ **— false.** **GOV-PLAN-001 `G-8` carries it by name**: *"Governed document home and versioning — CC-40 · **UX OQ-4 / Q10 / GV-1** — UX asks where approved design specs live. Same question as governance-doc versioning. **One answer.**"* The question is consolidated, owned, and awaiting a Founder/Operations decision. `DESIGN-001` at `agents/claude-design/outputs/` remains the working position **until G-8 is decided**, which is a materially different status from "unowned."

**Net effect of the correction on this document's posture:** two items that §16.9 counted toward "confirmed unowned or ungoverned" are **owned and routed**. Neither is *answered*, so neither is closed — but "waiting on a decision that has a named owner and a vehicle" is not the same finding as "nobody holds this," and §16.9 item 3(c) is re-stated accordingly.

**One governance obligation this document creates, recorded so it is not lost:** Phase 2 2D §6.12 names `claude-design` a **blocking reviewer** for downstream Founder-interface work. That is a standing review commitment, not a one-time handoff.

## 15.18 Source-inventory correction (v1.2.0)

**Origin.** A source-inventory refresh by the Planning Integration Coordinator flagged that this document's reconciliation record asserted two specialist documents did not exist, when both were on disk before this file was last written. **Verified first, before any edit**, by opening each:

| Document | Path | Verified state |
| --- | --- | --- |
| Context Lifecycle Manager spec | `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` | **Exists.** SPEC-CLM-001 v1.1.0, ~3,013 lines. §4.7 (`CLM-S5`…`S8`) and §4.8 (`CLM-S9`/`S10`) read directly at v1.2.0 |
| Governance update plan | `docs/plans/GOVERNANCE_UPDATE_PLAN.md` | **Exists.** GOV-PLAN-001 v0.3.0, ~784 lines. §0, §1, §2 (all four tiers), §3, §4.11, §5 read directly at v1.2.0 |
| Sprint 1F plan | `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | **v0.2.0**, ~1,793 lines. §20.3 and §20.4 (A–J) read in full at v1.2.0 |

**A version-header defect in the 1F plan, recorded because this document now keys to it.** `SPRINT_1F_MISSION_CONTROL_LITE.md` line 5 reads `**Version:** 0.1.0` while line 11 reads *"0.2.0 supersedes 0.1.0."* Its content is unambiguously the reconciled 0.2.0 pass (its §20.4 is re-derived against completed peer documents and states so). **Treated as v0.2.0 on the approval-block reading**, per the coordinator, and noted as a defect belonging to the 1F owner. **Not corrected here — it is another specialist's document.**

### What v1.2.0 changed

| # | Change | Where | Kind |
| --- | --- | --- | --- |
| **1** | **The phantom-workstream conflict is WITHDRAWN in full.** There is no separate "Founder Interface UX design" workstream; that name and *"Phase 1 Mission Control Lite UX specification"* denote this document | §14 preamble, §14.3 FI-1…FI-6, §14.4 Q1, §14.5 C1, §14.7 item 1, §14.8 row 1, §14.9 item 13, §14.10 | **Withdrawal of a false premise** |
| **2** | **FI-3's rule retained and re-homed** while the table around it is struck, because `SPEC-CLM-001` **OQ-C3** cites it by name | §14.3 | Citation integrity |
| **3** | **GV-1 / OQ-4 / Q10 routed to GOV-PLAN-001 `G-8`**; §12.1's *"No governance plan exists in the tree to route it to"* corrected as false | §12, §12.1, §14.3, §15.14 item 4, §15.17 | **Factual correction** |
| **4** | **GV-3 / Q6 / C5 routed to GOV-PLAN-001 `O-1`** (Optional tier); §15.17's *"the plan's backlog does not carry it"* corrected as false | §14.3, §15.17, §16.2, §16.6 | **Factual correction** |
| **5** | **CX-1…CX-6 recorded as discharged in the contract table itself**, not only in the register; **OQ-7 re-owned** as vocabulary (CLM, delivered) + numbers (Founder, open) | §12, §12.1, §12.6 | Status |
| **6** | **Sprint 1F reconciliation re-keyed v0.1.0 → v0.2.0**, with the delta stated below | §0.2, §15.0, §15.18 | Re-key |
| **7** | **§15.14 given a superseded banner** matching §15.7's, and its false opening sentence struck | §15.14 | Record fidelity |
| **8** | **§16.9 verdict re-stated on corrected premises** | §16.9 | **Verdict** |

**What v1.2.0 did NOT change, deliberately:** no view, wireframe, state, empty/loading/failure/stale specification, vocabulary token, prohibition, notification rule, mobile behavior, or accessibility requirement. **No band, threshold, weight, score, cost calculation, or rate source is defined here — that refusal is unchanged and is now vindicated rather than relaxed** (§12.6). The four-value provenance vocabulary and the Recorded / Derived / Projection / Recommendation / Unknown claim classes are preserved unchanged. No other document, no code, no ADR, and no roadmap was touched. No commit and no staging was performed.

### The Sprint 1F v0.2.0 delta, and what it means here

**Read in full at v1.2.0: §20.3 and §20.4.A–J.** Four findings bear on this document:

1. **§20.4 R-A3 resolves the ownership question outright, by name, in this document's favour.** *"DESIGN-001 owns all five"* — navigation shell, status vocabulary, truth model, decision flow, component inventory — *"This plan's §5 and §6 are withdrawn as competing definitions,"* on AGENT-001 § Department Boundaries grounds. It also reaches this document's own conclusion about the phantom independently: C1 *"is moot — but this workstream cannot confirm that and does not decide it,"* escalated as its **Q-INT-1**. **This document can now confirm it, and does: §15.1 and §15.18 close Q-INT-1's factual half.** The remaining half is a signature.
2. **R-A1 and R-A2 answer OQ-1 and OQ-2 affirmatively** — `PublicAgentAssignment` is delivered by 1F-1, and the timeline read-model **and** panel both land (1F-1 + 1F-14). §12.1 already records both as resolved. Consequence restated by the plan: View 5 badges **`live`**, and Views 4/5/6's `—` fallbacks are not exercised. **No design change follows; the fallbacks stay specified as contingencies.**
3. **1F v0.2.0's §20.4.H is keyed to this document's v1.0.0 (the "3,701-line" read), not v1.1.0.** Three of its divergence statuses are therefore stale in this document's favour, and are recorded here **as a notice to the 1F owner, not as a change to this document**: its **C-1** (*"no conversation view"*) is discharged by **View 17**; its **C-5** (*"DESIGN-001's navigation map does not place the Simulation Lab"* — escalated as **Q-INT-3**) is discharged by **View 20**, added in v1.1.0 precisely because omitting it was a defect against ADR-0001 D9; its **C-6** is recorded as resolved *"in Design's favour — Tasks are reached via the Context Spine,"* whereas v1.1.0 added **View 18** as a standalone Task surface, which is the outcome 1F's own C-6 originally asked for. **Q-INT-2 and Q-INT-3 should be re-checked against v1.1.0+ before the Founder is asked to rule on them.** Routed as a notice; this document does not edit theirs.
4. **1F scope reductions that touch stated dependencies here.** Its `D-K` (task-dependency instrumentation) is **withdrawn from 1F**, and the checkpoint entity and context fields are reclassified to the CLM. **Consequence for this document: none to the design, and one to a status label.** §16.4 **BC-12** was already marked *"not resolved"* — it is now **declined, with the fallback already specified** (View 4's wait reason **W6** renders the honest residual and names no blocking record). §15.8's checkpoint treatment is unchanged: it was always *"`Not recorded` in Phase 1,"* and the CLM owning `ContextCheckpoint` is the correct home.

**Disclosed limit on this re-key.** §§1–13 of the 1F plan were **not** re-read at v0.2.0. The reconciliation of those sections (§15.2–§15.6, §15.8–§15.10) remains keyed to v0.1.0 content. The plan's own version note describes v0.2.0 as a reconciliation pass with **§20.4 fully re-derived**, which is what was re-read; but *"nothing else changed"* is **the plan's characterisation, not this document's verified finding.** Stated as a limitation rather than an assurance.

### One item this correction cannot fix, flagged to its owner

GOV-PLAN-001's contradictions register carries **X-14** — *"Mandate overlap between this UX spec and an absent Founder Interface UX workstream … **High, unreconcilable here**"* — sourced to §14.5 C1, now withdrawn. **X-14 has one party and should be closed as void rather than adjudicated or escalated to the Founder.** That register belongs to the governance workstream. **It was not edited by this document**, per the constraint that only this file may change. **Routed to the Director of Operations via the Planning Integration Coordinator.** The same applies to GOV-PLAN-001 §0.2's "Founder Interface UX design" missing-input row and §3's *"Shell / vocabulary / truth-model ownership — the counterpart workstream is absent"* row: both are correct that the counterpart is absent, and both would read more cleanly as *"no counterpart exists"* than as *"a counterpart is missing."*

---

# 16. FINAL INTEGRATION HANDOFF

## 16.1 UX changes made

| # | Change | Section | Kind |
| --- | --- | --- | --- |
| 1 | **NB-1 correction.** Removed the false "guarded server-side" justification; added a blocking gate barring mobile escalation resolution until NB-1 is fixed; added a resubmit warning to `accept`/`abandon` confirmations | §11.7, §16.4 | **Behavioral — changes what may ship** |
| 2 | **Unknown rendering rule.** "Not recorded" in words is now the primary content; the bare `—` glyph is permitted only with an explicit carrier | §2.2 note, §2.3, §6.1 | Corrects a direct conflict with 1F §6.4 |
| 3 | **Six-field decision header adopted** as a required component on every entity surface | §6.4, §15.2 | Additive IA standard |
| 4 | **View 20 Simulation Lab added** — its omission was a defect against ADR-0001 D9 | §5 View 20, §3.2 | Defect fix |
| 5 | **View 18 Task list + detail added** | §5 View 18 | Defect fix (1F C-6) |
| 6 | **View 19 Settings added** — hosts push, session, install, transport, disclosure verbosity | §5 View 19 | Gap fix (1F S-16) |
| 7 | **View 17 Ask added**, conditional on Q-2, with fallbacks for all four readings | §5 View 17, §15.4 | Gap fix (1F C-1) |
| 8 | **Notifications rewritten for a real channel.** Push is a Phase-1 channel; delivery-honesty rule replaced with a three-part recordable-delivery rule; policy and payload contract added, incl. PE-3 in the payload and no action buttons | §8.5, §8.6, §8.6.1 | Material revision |
| 9 | **URL scheme reconciled** to the 1F plan's entity-noun structure | §3.4 | Alignment |
| 10 | **Mobile shell revised** — five tabs, 360×640 floor, safe-area insets, cached app shell | §9.2, §9.3 | Alignment |
| 11 | **View 6 scorecard slot corrected** — must assert neither "deferred" nor "in scope" while Q-6 is open | View 6 §6.3, §15.11 | Defect fix |
| 12 | **Checkpoints and model/provider attribution added** as Unknown surfaces, with routing-constraint vs attestation kept as separate claim classes | §15.8 | Gap fix |
| 13 | **§2.5.1 reconciliation delta** added: OQ-1 and OQ-2 resolved, nine rows re-statused | §2.5.1 | Status |
| 14 | **§12.1/§12.2** — seven open questions re-statused, eight new ones opened | §12.1, §12.2 | Status |
| 15 | **§15 register** added; §14 preserved unchanged as the v1.0.0 record | §15 | Structural |
| 16 | **Context-health band vocabulary replaced** — the CLM's seven bands supersede v1.0.0's three-value sketch, incl. `uncertain` and `blocked` as bands rather than states | View 12 §12.5, §15.16 | Adopted from `CLM-S5`/S6 |
| 17 | **Provisional-band rendering added** — a new claim-class case: a Recorded measurement scored against an unapproved rule. Requires the "(provisional threshold)" suffix, `bandPolicyVersion`, a distinct treatment that is **not** the Projection style, and exclusion from any headline verdict | View 12 §12.5.1 | New requirement from `CLM-S10` / governance P-7 |
| 18 | **Projection-only rendering enforced** — `PublicContextHealth` and nothing else; **no consumer-computed band**; no shadow-mode band shown as enforcing | View 12 §12.15 rules 8–10 | Adopted from CLM handoff B-3/B-4 |
| 19 | **Scorecard ADR citation corrected** — v1.1.0's first pass repeated the Sprint 1F plan's misquote; **ADR-0001 D8 places scorecards in Phase 2**, ADR-0002 D-E6 in Sprint 1F. §14.2 A4 withdrawn on this point | §15.11 | **Second factual correction** |
| 20 | **CX-2 amendment accepted** — threshold numbers reassigned to the Founder as versioned policy, which this document accepts as a better boundary than the one it proposed | §15.16 | Ownership |

## 16.2 Conflicts resolved

| 1F ref | Conflict | Resolution | Resolved by |
| --- | --- | --- | --- |
| §14.5 **C1** | Navigation-shell and truth-model ownership | **WITHDRAWN AT v1.2.0, not merely resolved.** The conflict had one party. Design owns all five contested artifacts — shell, status vocabulary, truth model, decision flow, component inventory — stated by name in SPRINT-1F-PLAN v0.2.0 §20.4 **R-A3**, which withdraws its own §5/§6 as competing definitions; Phase 2 §17.3 concurs; GOV-PLAN-001 §0.2 confirms no counterpart document exists. No shell definition removed or demoted | **Three workstreams, independently.** Withdrawal recorded at §14 and §15.18 |
| **C-1** | Conversation surface absent from the design | View 17 added, conditional on Q-2 | This document |
| **C-2** | URL scheme divergence | Adopted the 1F plan's entity-noun structure; extra surfaces kept | This document (Design owns it) |
| **C-3** | Navigation model divergence | Merged: five desktop groups (+ASK, +SYSTEM) with the 1F plan's five-tab mobile bar | This document |
| **C-4** | Screen count and naming | Mapping table §4.1.1; no surface dropped by either side | This document |
| **C-5** | Simulation Lab omitted | View 20 added, behavior unchanged | This document |
| **C-6** | No standalone Task view | View 18 added | This document |
| §14 **C6/C7** | Planning and release documents as UI data sources | Roadmap converged (the 1F plan withdrew its recommendation in favour of this approach); release may be cut, with honesty constraints carried forward | Both documents |
| — | Em-dash vs "Not recorded" | Stricter reading adopted | This document |
| — | Scorecards "deferred" | Corrected to an open conflict | This document |
| §14 **C2** | View 12 mistakable for a CLM spec | **Closed by the CLM owner:** *"It does not, and the CLM owner confirms it. §12.6 is correctly a consumer request"* | The CLM spec |
| §14 **C3** | SF-2 mistakable for scope expansion | Moot — the 1F plan already carries it as `D-A` | The 1F plan |
| **CX-1…CX-6** | View 12's entire requested data contract | **All six answered** by `SPEC-CLM-001` (§15.16). CX-2 amended: vocabulary supplied, numbers reassigned to Founder policy — accepted | The CLM spec + this document |
| §14 **GV-3** | Should §2 / §7.10 / §11 be governed standards? | **ROUTED at v1.2.0, still open on the answer.** ~~"The governance plan does not carry it"~~ — **false; corrected.** GOV-PLAN-001 carries it as **`O-1`** in its Optional tier, and SPRINT-1F-PLAN v0.2.0 **E-6** routes it to the same owner. The supporting case is unchanged and external: Phase 2 2D §6.7 shows the requirement exists at roadmap level, and the CLM built `provisional` propagation on the same principle | **Director of Operations**, via `O-1` — §15.17 item 1, §16.6 item 13 |
| — | Scorecard ADR misquote | Corrected against the ADR text directly | The governance plan caught it; verified here |

## 16.3 Conflicts deferred

| # | Item | Why deferred | Owner |
| --- | --- | --- | --- |
| 1 | **Q-2 conversation architecture** | Not a UX decision. View 17 is specified for one reading with fallbacks for the rest | Founder + LSE |
| 2 | **Q-3 roadmap/sprint/release** | Founder confirmation needed; View 3 converged, View 15 build-or-defer | Founder |
| 3 | **Q-6 scorecards** | Two governing documents conflict; needs an ADR amendment | Founder |
| 4 | **Q-1 deployment/persistence** | Sets the weight of every durability disclosure. Not UX-owned | Founder, cross-workstream |
| 5 | **Q-8 event-stream separation** | Determines retention-marker frequency and the catch-up window | LSE under ADR-0003 |
| 6 | **Context-health band *numbers*** | Vocabulary is **resolved** (`CLM-S5`); the numeric thresholds are **Founder policy**, carried by governance **P-7 / G-11 / F-19**. Until approved, every band is `provisional` by construction and View 12 shows measurements with no governed verdict | **Founder**, via governance |
| 6a | **CLM enforcing vs shadow mode** | The CLM *"cannot ship in enforcing mode on the memory store"* (handoff B-4). Determines whether View 12's band is advisory or active, which is a materially different Founder reading | Founder (via Q-1) + CLM owner |
| 6b | **OQ-17 / CLM OQ-C3 — one label for `QUARANTINED` / "uncertain"** | Two internal names for one state is the defect §14.3 FI-3 warns about. §7 will carry exactly one Founder-facing label once the internal name is settled | Lead Engineer + Architecture Reviewer |
| 7 | **Cost calculation, rate source, budget shape** | Explicitly outside UX scope; R-17 owns the design | Founder + research |
| 8 | **`isProjection` field name, shape, granularity** | A required contract, not a UX design | LSE |
| 9 | **1E remediation event taxonomy** | Determines whether `statusReason` is useful or merely honest | Founder |
| 10 | **Master Roadmap v7.1 conformance** | **The roadmap is not in the repository.** Unquantifiable | Founder / governance |
| 11 | **Light theme** | Required by STANDARD-011; unresolved. 1F A11Y-14 also marks dark/light contrast unaudited | Founder / Product Owner |
| 12 | **Sprint split (1F-a / 1F-b)** | The 1F plan's R-1 recommends splitting. **UX consequence: if split, Views 1, 5, 9, 10, 11, 19 are 1F-a; Views 2, 3, 6, 7, 8, 12, 13, 14, 15, 17, 18, 20 are 1F-b.** Stated as an input, not a decision | Founder |

## 16.4 Backend contracts required

Stated as consumer requirements. Every one is **PENDING CROSS-WORKSTREAM REVIEW**; none is a backend design.

| # | Contract | For | Status |
| --- | --- | --- | --- |
| **BC-1** | `AgentAssignment` read-model projection, secrets excluded by construction (`PublicReview` precedent) | Views 4, 5, 6; wait reason W5; timeline dispatch/claim entries | **In the 1F plan as `D-A`** |
| **BC-2** | Execution timeline read-model: merged, ordered, append-only, stable ordering | View 5; badges `live` on delivery | **In the plan as `D-B`/1F-1** |
| **BC-3** | Derived decision fields — `currentOwner`, `statusReason`, `nextGate`, `blockers` — with explicit-absence semantics, and `currentOwner` **not** derived from `assigneeAgentId` alone | Six-field header on every entity surface | **In the plan as `D-C`** |
| **BC-4** | Event-cap resolution: raise, partition per entity, or expose truncation explicitly enough for the UI to render it | View 5 retention marker; View 14 window | **In the plan as §7.4 / AC-4** |
| **BC-5** | **`isProjection` (or equivalent) marked on the payload**, so claim class derives from data rather than component authorship | §2.2 enforcement product-wide | **New — from Phase 2 2D §6.7** |
| **BC-6** | Model/provider **attestation** per execution, distinct from `ExecutionRouting.provider` | View 5, View 6, cost attribution | **In the plan as `D-E`** |
| **BC-7** | Push subscription state and a delivery record distinguishing *dispatched* from *delivered* | §8.6, View 19 | **In the plan as `D-I`/`D-J`** |
| **BC-8** | Notification records **not** sharing the 200-cap audit `Event` stream | View 5, View 14 | **Q-8, recommended** |
| **BC-9** | Context-health: `PublicContextHealth` projection carrying band, raw figures, `sampledAt`, sampling interval, `bandPolicyVersion`, `provisional`, and enforcing-vs-shadow mode | View 12 instrumented state | **ANSWERED by SPEC-CLM-001** (`CLM-S5`/S7/S8/S10, handoff B-3). Band **numbers** are Founder policy via governance **P-7**, not a backend contract |
| **BC-10** | Cost: persisted usage, a rate source, a budget entity, attribution to task/execution/attempt/review iteration, currency convention | View 13 instrumented state | **`D-D`/`D-F` under Q-4; R-17** |
| **BC-11** | Session/principal state readable by the UI, with expiry semantics that preserve the destination | View 19; §11 disabled-while-unauthenticated | **In the plan as `D-M`/1F-6** |
| **BC-12** | Task dependency data, if blockers are to name a blocking record | View 4 W6 split; View 18 blockers | **`D-K`; not resolved** |
| **BC-13** | Idempotent `accept`/`abandon` (NB-1) | §16.4 mobile Family B gate | **Confirmed defect; blocking** |

## 16.5 Dependencies

**Blocking this document's integration:** OQ-8 (Q-2) for View 17; OQ-9 (Q-3) for View 15; OQ-10 (Q-6) for View 6's slot copy; OQ-14 for View 8.

**Blocking implementation of what this document specifies:** BC-13/NB-1 (mobile Family B); 1F-6 auth (any hosted surface); Q-1 (durability disclosure weight); Q-9 (push, auth, and DOM-test dependencies); the 1E remediation (useful `statusReason`); OQ-15 (whether push exists on the Founder's device at all).

**Depending on this document:** 1F-11 and every 1F interface surface (its I-2); Phase 2 Stage 2D, which *"extends 1F's Mission Control"* (P-5) and names `claude-design` a blocking reviewer — so the shell, route tree, and `DecisionHeader` must be extensible without rewrite (its I-8); research **R-14**, whose notification-payload design exercise is discharged by §8.6.1.

**Unquantifiable:** Master Roadmap v7.1 is absent from the repository (§15.14 item 2).

## 16.6 Founder decisions

Ordered by consequence. Items 1–4 gate integration; 5–8 gate implementation; 9–13 gate scope.

| # | Decision | Section | Note |
| --- | --- | --- | --- |
| 1 | **Approve the truth model and claim classes** (§2.1–2.3), now corroborated by Master Roadmap §3 via Phase 2 2D §6.7 | §2 | Constrains every future surface |
| 2 | **Approve the data availability register and its delta** (§2.5, §2.5.1) as the accurate picture | §2.5 | Everything else builds on it |
| 3 | **Approve the prohibition set** (§2.6 + every per-view subsection) | §2.6 | Binding on implementation |
| 4 | **Approve Views 12/13 shipping visibly dark** — stronger than at v1.0.0, and now confirmed by the subsystem owner rather than inferred: *"The CLM does not light up View 12. It makes the dark state data-driven."* Simulated agents have no context window to measure (ADR-0001 D4) | §1, **§15.16** (supersedes §15.7) | Two of thirteen questions ship unanswered |
| 5 | **NB-1 disposition** — approve the remediation, and accept or reject the mobile Family B gate until it lands | §11.7, §16.4, OQ-11 | **Changes what may ship** |
| 6 | **Q-2 conversation architecture** | OQ-8 | Determines View 17 and the fifth mobile tab |
| 7 | **Q-3 roadmap/sprint/release** — confirm the `preview` approach (now both workstreams' recommendation) and decide whether release is cut | OQ-9 | |
| 8 | **Q-6 scorecards**, with an ADR-0002 amendment if confirmed | OQ-10 | Resolves a governing-document contradiction |
| 9 | **Approve the decision-flow specification** (§11): two families, mandatory confirmation, no optimistic UI, refresh-only on unconfirmed, no undo, degraded-permitted / disconnected-disabled — **re-decided on the corrected NB-1 basis** | §11, OQ-3 | |
| 10 | **Approve the notification policy**: actionable transitions only, no payload action buttons, PE-3 in the payload | §8.6.1 | |
| 11 | **Q-1 deployment and persistence target** | OQ-13 | Sets durability-disclosure weight |
| 12 | **Whether View 8 Evidence Viewer is in 1F** | OQ-14 | Question 8's dedicated home |
| 13 | **Whether §2, §7.10, and §11 become governed standards** — **routed to GOV-PLAN-001 `O-1`** (Optional tier) and to SPRINT-1F-PLAN **E-6**; owner **Director of Operations** | §15.17 item 1, §15.18 | Roadmap-supported, and now carried by a governance vehicle rather than only recommended here |

## 16.7 Sections that should be authoritative

Design-owned, and cited as authoritative by the other workstreams (1F I-2; Phase 2 §17.3):

- **§2.1–§2.4** — provenance ladder, claim classes, visual and accessible encoding, freshness model. *(§2.5/§2.5.1 are authoritative as **verified findings**, not as scope decisions.)*
- **§2.6** and every per-view **prohibited misleading behavior** subsection.
- **§3** — navigation map, context spine, URL scheme, keyboard model. *(Supersedes 1F §6 on contact, by that plan's own terms.)*
- **§4** — screen inventory, the §4.1.1 mapping, shared view states, failure taxonomy.
- **§5** — all twenty view specifications, **except** View 17 (conditional on Q-2), View 15 (conditional on Q-3), and View 20 (behavior is owned by the existing implementation and ADR-0001 D9; only its placement and provenance header are specified here).
- **§6** — component inventory and behavior contracts, including `DecisionHeader`.
- **§7** — status vocabulary, wait reasons, HQ posture, and the §7.10 forbidden-vocabulary list.
- **§8** — notification taxonomy, classes, triggers, policy, and payload requirements.
- **§9**, **§10** — mobile interaction plan and accessibility checklist. *(Supersedes 1F §11/§12 on contact, by that plan's own terms.)*
- **§11** — the Founder approval-flow specification, including the §11.7 correction.
- **§15.1–§15.6, §15.8–§15.13** — the reconciliation resolutions.

## 16.8 Sections that should be treated as advisory

- **§2.5 / §2.5.1 status columns** — authoritative as verified repository findings; **advisory** where they characterize another workstream's scope. Re-verify against the approved 1E baseline and the final 1F plan.
- **§12, §12.1, §12.2** — routing recommendations. Only the named owners can settle them.
- **§13** — self-assessment of limitations.
- **§14** — **superseded by §15 where they disagree.** Retained as the v1.0.0 record, **with the v1.2.0 withdrawals struck in place** (§14 preamble banner). The struck items are not advisory; they are void.
- **§15.7** (superseded by §15.16) and **§15.14** (superseded by §15.17) — retained first-pass records. **Read the superseding subsection, not these.**
- **§12.6 and §16.4 BC-9** — a consumer's field list for context health, **now discharged** by `SPEC-CLM-001`. **Advisory to the CLM workstream and to nobody else.** No band, threshold, weight, or score is defined here, at any version.
- **§16.4 BC-10** — the same, for cost. No calculation or rate source is defined.
- **§15.13** — the recommendation to keep the Evidence Viewer.
- **§15.14 item 1** — the recommendation to promote §2/§7.10/§11 to governed standards.
- **§16.3 item 12** — the 1F-a / 1F-b view split, offered as a planning input.
- **View 12's instrumented-state wireframe (§12.17)** and **View 13's instrumented-state design (§13.5)** — illustrative shapes only; they are not specifications of the subsystems that would fill them.
- **All wireframes** — structural, not visual design. No colour, type scale, spacing system, or iconography is specified, and no contrast ratio has been measured.

## 16.9 Recommendation

# **NOT READY FOR INTEGRATION**

**The UX specification itself is ready, and all five named documents have now been reconciled.** Every UX-owned inconsistency they surfaced is resolved in the body: shell and truth-model ownership settled, four missing surfaces added, the URL scheme and mobile shell aligned, the Unknown-rendering conflict resolved, the six-field decision header adopted, notifications rewritten for a real channel, the context-health band vocabulary and provisional-rendering rules adopted from the CLM, and **factual errors in this document corrected** — at v1.1.0, the scorecard deferral status, the scorecard ADR citation, and, most seriously, the claim that escalation transitions are guarded server-side; **at v1.2.0, three further errors of the reconciliation's own** (§15.18).

### 16.9.1 Withdrawn verdict items, and why (v1.2.0)

> **Withdrawn item 3 of the first pass — *"Two of the five named specialist documents do not exist."*** **WITHDRAWN. The premise was false.** Both the Context Lifecycle Manager specification and the governance plan **existed on disk before this file was last written.** The first pass recorded them absent, then found them mid-pass and reconciled them at §15.16 and §15.17 — but the verdict item was written from the earlier state and the honest reading is not "they arrived late" but **"this document asserted a non-existence it had not re-verified at the moment it published the verdict."** That is the same class of error §16.9's closing paragraph already confesses twice: an unverified claim inherited rather than checked. **Third instance, and the only one where the unverified claim was about the state of the repository itself.**
>
> Withdrawn rather than deleted, per this document's convention for every prior correction (§15.7, §15.11, §14.2 A4, §14.5 C1). **All six of View 12's requested contracts are answered (CX-1…CX-6, §12.6), and §14.5 C2 is closed by the CLM owner.**
>
> **Withdrawn: the phantom-workstream conflict.** §14.5 **C1** and §14.3 **FI-1…FI-6** are withdrawn in full (§15.18). They never contributed a numbered reason to this verdict, but the §14.10 handoff called the boundary this document's *"highest risk"*, and readers downstream — including GOV-PLAN-001's **X-14** — took that at face value. **It was not a risk. It was not the highest risk. There was no second party.**

### 16.9.2 The verdict, re-stated on corrected premises

**Item 3 of the first pass is withdrawn as false. Item 3 of the present list is narrowed by the governance routing (§15.17). Four reasons remain, and the verdict is unchanged — but it now rests only on premises this document has verified.** None of the four is mine to fix:

1. **Four surfaces are conditional on unmade Founder decisions.** View 17 depends on Q-2, View 15 on Q-3, View 6's slot copy on Q-6 (now resting on a corrected ADR reading), View 8 on OQ-14. Integrating now would freeze guesses on all four.
2. **NB-1 is an open confirmed defect that gates a specified capability.** §16.4's mobile escalation path cannot ship until it is fixed, and the Founder has not ruled on the remediation. Integrating a specification whose mobile decision path is conditionally barred, without recording the bar as approved, would set up exactly the "was this authorized?" ambiguity PE-1 created in Sprint 1E.
3. **~~Three items are confirmed unowned or ungoverned~~ — NARROWED AT v1.2.0 to one unowned item and one unapproved one.** (a) **Cost instrumentation has no owner.** **Stands, and is the only genuinely unowned item in the set** — this document (OQ-6/RB-1), the CLM handoff (OQ-C7/F-7), the governance plan (§3, *"Unassigned"*), and SPRINT-1F-PLAN v0.2.0 (**E-5**) each independently found it unassigned. **Four documents, no claimant.** View 13 is designed against a gap nobody holds. Carried as **OQ-18**. (b) **Context-health band numbers are unapproved policy.** **Stands** — every band renders `provisional` by construction (`CLM-S10`) and View 12 can show measurements with no governed verdict until **G-11 / P-7** is approved. **This is an unapproved item, not an unowned one:** the owner is named (Founder / Operations) and the vehicle exists. (c) ~~"The governance backlog does not carry their promotion."~~ **WITHDRAWN — false.** GOV-PLAN-001 carries it as **`O-1`** and SPRINT-1F-PLAN as **E-6**, both to the Director of Operations (§15.17 item 1). **What survives of (c) is weaker and worth stating precisely:** the truth model, forbidden vocabulary, and decision flow are cross-cutting honesty constraints that currently bind only by living in this document, and their promotion is ranked **Optional**. The governance plan's reasoning for that rank is sound and quotes this document's own §14.5 C5 back at it. **(c) is therefore no longer a reason this document is not ready — it is a recommendation about rank, recorded at §15.17 and owned elsewhere.** It is retained in this list for traceability and **counts for nothing in the verdict.**
4. **The Master Roadmap v7.1 is cited as governing authority and is absent from the repository.** Four documents now flag it, and the governance plan sharpens it into two problems: it is unverifiable under GOV-001's quote-the-text rule, *and* `AGENTS.md`'s eight authority tiers contain no roadmap tier at all. **Every one of us has been planning against an authority none of us can read, at an authority level nobody has established.**

**Verdict restated in one sentence, on the corrected basis:** the specification is complete and internally consistent, every UX-owned question in it is answered, and **it is still NOT READY FOR INTEGRATION — because four decisions it does not own are unmade, not because anything in it is missing or wrong.** That was the verdict before the correction and it is the verdict after. What changed is that one of the reasons offered for it was false, one was overstated, and the document that offered them is the one that has to say so.

**What would make it ready.** Items 1 and 2 are Founder decisions, listed in order at §16.6. Item 3(a) needs an owner assigned — **it is the single clearest unowned gap in the programme, found independently by four workstreams**. Item 3(b) needs the **G-11 / P-7** policy record approved, or an explicit acceptance that View 12 ships provisional-only. **Item 3(c) no longer gates anything** — it is routed to `O-1` and its rank is Operations'. Item 4 needs the roadmap committed and tier-assigned, or a written acceptance that four specialist plans were produced without it.

**Recommended sequence:** resolve §16.6 items 1–5 → assign cost-instrumentation ownership (OQ-18) → re-verify §2.5 against the approved 1E baseline → then integrate. Items 6–13 can follow integration, because every one has a specified fallback here and none invalidates the truth model, the shell, or the decision flow.

**Two items routed out with this revision, neither of which this document may fix itself:** GOV-PLAN-001 **X-14** should be **closed as void** rather than escalated (its second party does not exist), and SPRINT-1F-PLAN's **Q-INT-2 / Q-INT-3** should be re-checked against v1.1.0+ before the Founder rules on them (both are keyed to this document's v1.0.0 and are discharged by Views 17 and 20). See §15.18.

**Two judgments worth recording.**

*On the design.* The strongest evidence in its favour is not in it. Four workstreams, unable to communicate, independently converged on honest absence over plausible placeholders: this document's provenance ladder and dark states; the 1F plan's Q-4 recommendation (a), its AC-19, and its R-2 rating fabricated placeholders **Severe**; the research backlog's insistence that a notification conflating two escalation causes is worse than a queue doing so; and the CLM's `CLM-S7` refusal to emit a fleet verdict that averages unmeasured sessions. **That convergence is the part of this work I would least want relaxed during integration.**

*On the reconciliation.* It found errors in my own document and one in another's, and every one was a case of an unverified claim inherited rather than checked — I repeated the 1F plan's ADR misquote, and I asserted server-side replay safety that NB-1 refutes. The CLM's counter-move on CX-2 was the most useful outcome of the whole exchange: I had been confident the thresholds were not Design's to invent, and had not considered they might not be engineering's either. **A reconciliation that only confirmed agreements would have been worth much less than one that caught this.**

*Added at v1.2.0, and it is the uncomfortable one.* **The reconciliation missed three errors of its own, and all three were the identical failure mode it had just diagnosed in itself.** It asserted two documents did not exist without re-checking the tree at the moment it published the verdict; it asserted a governance backlog did not carry two items after scanning rather than reading the sections that carry them; and it inherited from its own v1.0.0 brief the existence of a workstream it had already proven absent at §15.1, leaving the phantom alive in §14 where another document then picked it up as a **High** contradiction. **Two of the three are claims about what is *not* there — and a negative claim is exactly the kind that feels verified because nothing contradicted it.** §2 of this document forbids presenting an absence as a finding without saying how the absence was established; **§15.0, §15.14, and §16.9 did precisely that, three times, in the section whose whole purpose was to stop it.** The rule was right and its author was not exempt from it. **Recorded here rather than in a footnote, because a document that grades other people's evidence has to publish its own failures at the same volume.**

---

# Record Notes

- **Authored by:** Claude Design Engineer (AGENT-004 / ROLE-014), acting within design authority only.
- **Verified against:** working tree at `057e12c`, branch `validation/sprint-1e-overnight-2026-07-26`.
- **Files read for verification:** all of `types/domain/`, `types/contracts/state-reader.ts`, `lib/mission-control/{status,view-model,useDevHqState}.ts`, `lib/dev-hq/{types,constants,store,agent-execution-service}.ts`, `lib/dev-hq/adapters/dev-task-repository.ts`, `components/mission-control/{DataSourceBadge,primitives}.tsx`, `app/api/dev-hq/approvals/[id]/approve/route.ts`, `app/api/dev-hq/escalations/[id]/revise/route.ts`, `data/placeholders/mission-control.ts`, `docs/plans/SPRINT_1E_COMPLETION_NOTES.md`, `standards/ACCESSIBILITY_STANDARD.md`, `agents/claude-design/AGENT.md`, `handbooks/CLAUDE_DESIGN_ENGINEER.md`, `AGENTS.md`.
- **No code was changed.** No commit was made. No library was selected. No Sprint 1F scope was expanded; §2.5 and §14.3 declare dependencies with designed fallbacks instead.
- **This is a specialist draft pending cross-workstream review and Founder approval**, not the final integrated plan.

## v1.1.0 — reconciliation record (2026-07-26)

- **Reconciled against all five named documents:** `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` (SPRINT-1F-PLAN v0.1.0), `docs/plans/PHASE_2_PROGRAM_PLAN.md` (PLAN-P2-001), `docs/research/RESEARCH_BACKLOG.md`, `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0) with `CLM_COLLABORATION_HANDOFF.md`, and `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (v0.3.0) — plus `docs/validation/sprint-1e-overnight-2026-07-26/`, `docs/company/GOVERNANCE.md`, and ADR-0001/0002 read directly.
- **Two documents arrived mid-pass.** The CLM specification and the governance plan were absent when §15.0 was first written and appeared during the reconciliation; both were then read and reconciled (§15.16, §15.17). §15.0 records the sequence rather than hiding it, and §15.7 is retained-but-superseded rather than deleted.
- **Absent and still unresolved:** the **Master Roadmap v7.1**, cited as governing authority by the Phase 2 plan and flagged independently by four documents. No conclusion here depends on it, and none could be checked against it.
- **Files modified by the reconciliation: this file only.** No code, no ADR, no roadmap document, no plan, and no other specialist's file was touched. **No commit was made.** Verified by `git status`.
- **Scope discipline:** no Sprint 1F scope expanded. Views 17–20 are surfaces the 1F plan already carries as S-8, S-14, S-16, S-17; adding them narrows the divergence between the two documents, and View 20 restores compliance with ADR-0001 D9.
- **Preserved per instruction:** the four-value provenance vocabulary; the Recorded / Derived / Projection / Recommendation / Unknown claim classes; the true-empty vs unavailable distinction. No governing contract proved a conflict, and Phase 2 2D §6.7 corroborates all three.
- **Not defined here, deliberately:** context-health thresholds or safety bands; operational scoring; cost calculations or rate sources; persistence design; orchestration policy; the conversation surface's architecture; the event taxonomy.
- **Two v1.0.0 errors corrected:** the scorecard status (an open governing-document conflict, not an approved deferral) and the claim that escalation transitions are guarded server-side (**refuted by NB-1**, a confirmed defect). The second changes what may ship (§16.4).
- **Verdict: NOT READY FOR INTEGRATION**, for four reasons stated in §16.9, none of which is a defect in this specification. *(Superseded by the v1.2.0 record below: the verdict is unchanged, but one of the four reasons was false and one was overstated.)*

## v1.2.0 — source-inventory correction (2026-07-26)

**Nature of this revision: factual correction only. No redesign, no scope change.** No view, wireframe, state, vocabulary token, prohibition, notification rule, mobile behavior, or accessibility requirement was altered. Full change record at **§15.18**.

- **Three false claims withdrawn**, each struck in place with its reason rather than deleted:
  1. **§16.9 first-pass verdict item 3** — *"Two of the five named specialist documents do not exist."* **Both existed on disk before this file was last written.** Verified at v1.2.0 by opening each: `CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0, ~3,013 lines) and `GOVERNANCE_UPDATE_PLAN.md` (GOV-PLAN-001 v0.3.0, ~784 lines).
  2. **§15.17's *"the plan's backlog does not carry it"*** and **§12.1 / §15.14's *"no governance plan exists to route it to."*** **Both false.** GOV-PLAN-001 carries this document's governance questions as **`G-8`** (document home, ID, versioning — consolidating GV-1 / OQ-4 / Q10 by name) and **`O-1`** (promotion of §2 / §7.10 / §11 — GV-3 / Q6 / C5, Optional tier). SPRINT-1F-PLAN v0.2.0 **E-6** routes the same promotion question to the same owner.
  3. **The phantom-workstream conflict** — §14.3 **FI-1…FI-6**, §14.4 **Q1**, §14.5 **C1**, §14.7 item 1, §14.8 row 1, §14.9 item 13, and §14.10's *"highest risk"* line. **There is no separate "Founder Interface UX design" workstream.** Confirmed three ways independently: tree inspection (§15.1), GOV-PLAN-001 §0.2, and SPRINT-1F-PLAN v0.2.0 §20.4 **R-A3** — *"DESIGN-001 owns all five"* (shell, status vocabulary, truth model, decision flow, component inventory), which withdraws that plan's own §5/§6 as competing definitions.
- **One rule preserved through a withdrawal:** **FI-3** is retained and re-homed while the table around it is struck, because `SPEC-CLM-001` **OQ-C3** cites it by name. A citation must still resolve after a withdrawal.
- **Deviation from §0.2, recorded as one:** §14 was declared *"preserved unchanged as the v1.0.0 record."* v1.2.0 strikes items within it. **Reason:** the rule exists to prevent retrofitting §14 with hindsight, not to license leaving a false premise in place while another workstream reasons from it — GOV-PLAN-001 carries §14.5 C1 as contradiction **X-14**, rated *"High, unreconcilable here."* Every other line of §14 is untouched, every strike is visible, and §15 remains authoritative on disagreement.
- **Sprint 1F reconciliation re-keyed from v0.1.0 (1,466 lines) to v0.2.0 (~1,793 lines).** §20.3 and §20.4.A–J re-read in full at v1.2.0. **§§1–13 were not re-read** — the reconciliation of those sections remains keyed to v0.1.0 content, disclosed at §15.18 rather than assumed away. **Noted defect in that document, not corrected here:** its header says `0.1.0` while its version note says `0.2.0 supersedes 0.1.0`; treated as v0.2.0 on the approval-block reading, and left to the 1F owner.
- **CX-1…CX-6 recorded as discharged in §12.6 itself**, and **OQ-7 re-owned**: vocabulary to the CLM (delivered, `CLM-S5`), numbers to Founder/Governance (open, **OQ-16**, via **G-11 / P-7**).
- **The refusal to invent bands, thresholds, weights, scores, cost calculations, or rate sources is unchanged, and is reinforced rather than relaxed** (§12.6). The CLM supplied the vocabulary *because* this view declined to invent one, then declined the numbers itself on the same class of reasoning one layer up. **Both refusals stand.**
- **Preserved per instruction and re-verified:** the four-value provenance vocabulary (`live` / `derived` / `preview` / `unavailable`) and the Recorded / Derived / Projection / Recommendation / Unknown claim classes.
- **Files modified: this one only.** No other specialist's document, no code, no ADR, no roadmap, no plan. **Nothing was committed and nothing was staged.**
- **Routed out, not fixed here** (both belong to other owners): GOV-PLAN-001 **X-14** should be **closed as void** rather than adjudicated — its second party does not exist; and SPRINT-1F-PLAN **Q-INT-2 / Q-INT-3** are keyed to this document's v1.0.0 and are discharged by **View 17** and **View 20**, so they should be re-checked before the Founder is asked to rule on them.
- **Verdict: NOT READY FOR INTEGRATION — unchanged, and now resting only on verified premises.** Four reasons (§16.9): four surfaces conditional on unmade Founder decisions; NB-1 open and gating the mobile decision path; cost instrumentation unowned by four independent documents and context-health band numbers unapproved; and the Master Roadmap v7.1 cited as governing authority while absent from the repository. **Reason 3 is narrower than v1.1.0 claimed** — one genuinely unowned item, one unapproved-but-owned item, and one item withdrawn as routed.






