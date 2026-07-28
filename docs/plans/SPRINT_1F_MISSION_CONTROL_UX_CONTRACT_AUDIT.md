# Sprint 1F — Mission Control UX Contract Audit

**Document ID:** DESIGN-002

**Version:** 1.0.0

**Status:** READ-ONLY AUDIT — planning input. Not a design change, not an approval, not an authorization to implement.

**Date:** 2026-07-26

**Author role:** Claude Design Engineer (AGENT-004 / ROLE-014)

**Authority:** CONST-001, GOV-001, AGENT-001, ADR-0001, ADR-0002, STANDARD-011 (Accessibility), STANDARD-012 (Documentation)

**Governing design artifact under audit:** `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` (DESIGN-001 v1.2.0)

**Repository state inspected:** branch `validation/sprint-1e-overnight-2026-07-26` @ HEAD `9069c12`; ratified Sprint 1E baseline `sprint-1e-remediated` → `d922f379`

**Scope of this document.** It audits the Sprint 1F Mission Control UX contract against the roadmap, the ADRs, the engineering plans, and repository truth. It **creates no UX**, **changes no approved UX**, and **resolves no cross-authority conflict**. Where DESIGN-001 and another authority disagree, the disagreement is recorded with its sources, its governing authority, and its decision owner. Nothing here is a Founder decision, a Product Owner acceptance, or an implementation authorization.

**Reading convention.** Three labels are used and mean exactly what they say:

| Label | Meaning |
| --- | --- |
| **VERIFIED** | Confirmed by direct file inspection during this audit, at the tree named above. A path and, where useful, a line number is given. |
| **REPORTED** | Stated by another document and not independently re-derived here. The source is named. |
| **JUDGMENT** | A design opinion or inference of mine. Labelled so it is never mistaken for a finding. |

---

# 1. Sources inspected

## 1.1 Present and read

### Governance and role authority

| Path | What was read |
| --- | --- |
| `AGENTS.md` | In full (AGENT-001, universal handbook) |
| `agents/claude-design/AGENT.md` | In full |
| `handbooks/CLAUDE_DESIGN_ENGINEER.md` | In full (ROLE-014) |
| `standards/ACCESSIBILITY_STANDARD.md` | Header, compliance target, colour/contrast section (STANDARD-011) |
| `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md` | Structure in full; D4, D5, D6, D7, D8, D9, O1–O6 read directly |
| `docs/decisions/ADR-0002-review-escalation-and-work-management.md` | E3, E4, E5, E6, E7, E8, E9, and the resolved-decision table read directly |

### Design authority

| Path | What was read |
| --- | --- |
| `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` | **DESIGN-001 v1.2.0, read in full (4,708 lines)** — §0 through §16.9 and the record notes |

### Engineering and programme plans

| Path | What was read |
| --- | --- |
| `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | SPRINT-1F-PLAN v0.2.0 — §1–§21 read; §20.1–§20.4.J read in full |
| `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` | In full |
| `docs/plans/SPRINT_1E_COMPLETION_NOTES.md` | §6.1, §6.2 (PE-1/PE-2/PE-3), §7 (CR-1, NB-1…NB-4) read directly |
| `docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md` | In full |
| `docs/plans/GOVERNANCE_UPDATE_PLAN.md` | Targeted: G-8, O-1, X-14, §0.2 missing-input row, §3 ownership rows |
| `docs/plans/PHASE_2_PROGRAM_PLAN.md` | Targeted: authority line, §17.3 cross-workstream register references, roadmap citations |
| `docs/research/RESEARCH_BACKLOG.md` | Targeted: E-1a (roadmap absence) |
| `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` | Not read directly. Its Design-facing obligations are taken **REPORTED** from DESIGN-001 §15.16 and SPRINT-1F-PLAN §20.4.I |
| `agents/lead-software-engineer/outputs/CLM_COLLABORATION_HANDOFF.md` | Targeted: roadmap-absence corroboration |

### Repository implementation truth

| Path | What was verified |
| --- | --- |
| `app/page.tsx` | Single route; renders `MissionControl` |
| `app/layout.tsx` | **No viewport export, no `theme-color`, no manifest link** |
| `components/dashboard/MissionControl.tsx` | Simulation Lab shell; `MissionControlOverview` is nested inside it |
| `components/dashboard/MissionControlOverview.tsx` | Composition of the live Mission Control panels; inline approve/reject handler |
| `components/mission-control/ApprovalQueuePanel.tsx` | Inline `Approve`/`Reject` buttons, no confirmation step |
| `components/mission-control/*.tsx` (12 files) | Panel inventory |
| `lib/mission-control/view-model.ts` | `CommandCenterModel` (:131-148) — **no timeline field**; `actionable: Boolean(approval.waitTokenId)` (:486); `STAGE_INDEX.failed === -1` (:163); `percent: 0` when `currentIndex < 0` (:235-240) |
| `lib/mission-control/useDevHqState.ts` | 3,000 ms poll (:12); `DISCONNECTED_AFTER_FAILURES = 3` (:15); `FeedStatus` union (:17); `updatedAt` stamped from the **client** clock (:60, :92) |
| `lib/mission-control/status.ts` | `DataSource` four-value vocabulary (:26); tokens for lifecycle/execution/approval/stage/availability/connection **only** |
| `lib/dev-hq/types.ts` | `DevHqState` (:20-38) carries `evidence`, `escalations`, `reviews` (`PublicReview[]`), `reviewFindings`, `overview`; **`agentAssignments` is store-only** (:49) |
| `lib/dev-hq/constants.ts` | `MAX_EXECUTION_ATTEMPTS = 3` (:37); lease TTL 60 s (:43); `AGENT_HEALTH_STALE_AFTER_MS = 60 s` (:51); claim deadline 120 s (:60); **`execution.assignment_deferred` (:77) and `execution.claim_lost` (:79) now exist**; `MAX_REVIEW_ITERATIONS = 3` (:100); `REVIEW_RESPONSE_DEADLINE_MS = 120 s` (:108); `MAX_REVIEW_DISPATCH_ATTEMPTS = 3` (:116) |
| `lib/dev-hq/store.ts` | `store.events = store.events.slice(0, 200)` (:226) |
| `lib/dev-hq/agent-execution-service.ts` | `usage: null` (:81) |
| `lib/dev-hq/adapters/dev-task-repository.ts` | `listDependencies` returns `[]` unconditionally (:94-97) |
| `lib/theme.ts` | `COLORS` — **dark-surface palette only; no light-theme token set** |
| `app/api/dev-hq/**/route.ts` | 21 routes enumerated; public routes carry no identity check |
| `public/` | Five SVGs only |
| `package.json` | Dependencies exactly `@trigger.dev/sdk`, `next`, `react`, `react-dom`. `@playwright/test` in devDependencies |
| `vitest.config.ts` | `environment: "node"`, `include: ["**/*.test.ts"]` — **`.tsx` is not collected** |

## 1.2 Expected sources NOT found

Each was searched for by path glob and by repository-wide content search. **Absence is a finding, and the method of establishing it is stated so the claim is auditable.**

| Expected source | Search performed | Result |
| --- | --- | --- |
| **Savrio Dev HQ Master Roadmap v8.0** | Glob `**/*ROADMAP*`; content search `Master Roadmap`, `Roadmap v8`, `v8.0` | **NOT FOUND at any version.** The string "Master Roadmap" appears only *inside* planning documents, always citing **v7.1**, which is itself absent. Corroborated independently by `docs/research/RESEARCH_BACKLOG.md:2865-2884` (E-1a), `docs/plans/GOVERNANCE_UPDATE_PLAN.md:46`, DESIGN-001 §15.14 item 2, and `CLM_COLLABORATION_HANDOFF.md:412`. **No v8.0 is referenced by any document in the repository.** |
| **Sprint 1F Preparation Handoff** | Content search `Preparation Handoff`, `PREPARATION_HANDOFF`, `Sprint 1F Preparation`; glob `**/*HANDOFF*` | **NOT FOUND under that name.** The nearest artifact is `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` (READINESS PACKAGE, uncommitted), read in full and treated as the functional equivalent. `agents/lead-software-engineer/outputs/CLM_COLLABORATION_HANDOFF.md` is a different document. **I have not assumed the two are the same artifact.** |
| **ADR-0003** (deployment / persistence / transport / authentication) | Glob `docs/decisions/*` | **NOT AUTHORED.** Only ADR-0001 and ADR-0002 exist. Per the Founder decision of 2026-07-26 recorded at SPRINT-1F-PLAN §20.3 #16, the number is assigned centrally and no workstream may claim it. |
| **Permanent Operating Handbook**, **Current Progress Update** | Content search | **NOT FOUND.** Cited by `PHASE_2_PROGRAM_PLAN.md`; recorded absent by GOVERNANCE_UPDATE_PLAN §4.6. |
| `handbooks/INDEPENDENT_CODE_REVIEWER.md` | Glob `handbooks/*.md` | **NOT FOUND** — 10 handbooks exist; this is not among them. |
| `standards/NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, `ERROR_HANDLING_STANDARD.md` | Glob `standards/*.md` | **NOT FOUND** — 17 standards exist; these three are not among them. |
| `middleware.ts` (root, `app/`, or `src/`) | Glob | **NOT FOUND.** No authentication boundary exists. |
| Web app manifest, service worker | Glob `public/**` | **NOT FOUND.** |
| `playwright.config.*` | Glob | **NOT FOUND**, despite `@playwright/test` being a devDependency. |
| `lib/dev-hq/timeline.ts` or any timeline read-model | Glob `{app,components,lib,types}/**` | **NOT FOUND.** `CommandCenterModel` carries no timeline field. |
| Any UI surface rendering escalations, reviews, findings, or evidence | Content search across `components/` for `escalation`, `reviewFindings`, `.evidence`, `escalationReason` | **NOT FOUND.** The only hits are `DispatchAgentPanel.tsx:135` (evidence for one dispatched execution) and `AuditTrailPanel.tsx` (`run.reviewSummary`, a workflow-run string). **`DevHqState.escalations`, `.reviews`, and `.reviewFindings` are exposed by the server and consumed by no component.** |

---

# 2. Approved UX authority

## 2.1 Who owns Mission Control UX

**Design owns it, and the two counterpart workstreams have ceded in writing.**

| Question | Governing statement | Source |
| --- | --- | --- |
| Navigation shell, status vocabulary, truth model, decision flow, component inventory | *"DESIGN-001 owns all five. This plan's §5 and §6 are withdrawn as competing definitions."* | SPRINT-1F-PLAN §20.4 **R-A3** |
| Basis for that ownership | *"Design defines the approved user experience. Engineering decides how approved requirements are implemented."* | `AGENTS.md` § Department Boundaries |
| Truth model | *"Design is authoritative on UX per AGENT-001 § Department Boundaries."* | REPORTED — `PHASE_2_PROGRAM_PLAN.md` §17.3, via DESIGN-001 §15.1 |
| Sections DESIGN-001 asserts as authoritative | §2.1–§2.4, §2.6 + per-view prohibitions, §3, §4, §5 (all 20 views), §6, §7, §8, §9, §10, §11, §15.1–§15.6, §15.8–§15.13 | DESIGN-001 §16.7 |
| Sections DESIGN-001 marks advisory | §2.5 status columns where they characterise another workstream's scope, §12, §13, §14, §15.7, §15.14, §12.6/BC-9, BC-10, §15.13, §16.3 item 12, **all wireframes** | DESIGN-001 §16.8 |

## 2.2 The approval status of that authority — a material caveat

**VERIFIED.** DESIGN-001's own header reads *"Status: Reconciled specialist draft — **awaiting Founder review and Product Owner acceptance**"*, and its §16.9 verdict is, verbatim and as a level-1 heading:

> **NOT READY FOR INTEGRATION**

**VERIFIED.** `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` §7 lists the same file under the heading "Design authority references" with the authority column reading **"Approved Mission Control UX."**

**These two statements cannot both be true.** This is recorded as conflict **X-1** in §6 and is a Founder / Product Owner decision, not a Design one. Until it is settled:

- DESIGN-001 is the **only** UX authority for Sprint 1F, and no other document may define a competing shell, vocabulary, or decision flow (R-A3 settles that).
- DESIGN-001 is **not an approved artifact**, so no implementation item may cite it as approved requirements, and no reviewer may certify against it as an approved baseline.

**JUDGMENT.** The correct standing description is *"sole design authority, not yet approved."* Treating it as approved would repeat exactly the "was this authorized?" ambiguity that PE-1 created in Sprint 1E.

## 2.3 The authority stack this audit applied

Per the task framing and `AGENTS.md` § Governing Authority:

1. **Roadmap** — controls capability direction and sequence. **UNAVAILABLE. See §6 X-2.**
2. **ADRs** — control architecture and policy. ADR-0001 and ADR-0002 only.
3. **Approved Design artifacts** — control Mission Control structure, vocabulary, flows, and state presentation. DESIGN-001, subject to §2.2.
4. **Repository evidence** — controls current implementation truth.
5. **Engineering plans** — may report conflicts; may not silently override approved UX (they do not; R-A3 is an explicit cession).

---

# 3. Required Sprint 1F screens and states

## 3.1 The twenty views

Source: DESIGN-001 §4.1 and §4.1.1. The `1F ref` column is the mapping DESIGN-001 §4.1.1 established, which resolves the plan's C-4 screen-count divergence.

| # | View | Route (DESIGN-001 §3.4, authoritative) | 1F ref | Backing data status | Condition |
| --- | --- | --- | --- | --- | --- |
| 1 | Founder Home | `/` | S-1 | Derived from live arrays | — |
| 2 | Project Overview | `/projects`, `/projects/<id>` | S-5 | Live | — |
| 3 | Roadmap & Sprints | `/roadmap`, `/sprints/<slug>` | S-6, S-7 | **`preview`** — no entity | Gated on **E-7** (may plan documents be UI data sources?) |
| 4 | Live Work Queue | `/queue` | S-11 | Live + derived | — |
| 5 | Execution Timeline | `/executions/<id>` | S-9 | Read-model absent today | Provenance depends on 1F-1 |
| 6 | Agent & Human Queue | `/agents`, `/agents/<id>` | S-10 | Live | Scorecard slot copy gated on **Q-6** |
| 7 | Review Center | `/reviews`, `/reviews/<id>` | S-12 | Live | — |
| 8 | Evidence Viewer | `/evidence`, `/evidence/<id>` | **not in the 1F screen list** | Live | Gated on **OQ-14** (in or out of 1F) |
| 9 | Approval Center | `/approvals`, `/inbox/approvals/<id>` | S-3 | Live | — |
| 10 | Founder Decision Inbox | `/inbox` | S-2 | Derived | — |
| 11 | Blockers & Escalations | `/escalations`, `/inbox/escalations/<id>` | S-4 | Live | — |
| 12 | Context Health | `/context-health` | folded into S-9 | **dark** | Ships dark regardless; band policy gated on **OQ-16** |
| 13 | Budget & Cost | `/cost` | S-15 | **dark** | — |
| 14 | Notifications | `/notifications` | not a 1F screen | Derived, session-scoped | Copy gated on 1F-10 landing |
| 15 | Release View | `/releases` | S-13 | **`preview`** — no entity | Gated on **Q-3 / E-7**; the plan recommends cutting it from 1F |
| 16 | Mobile Quick Actions | mobile shell (cross-cutting) | cross-cuts S-2/S-3/S-4 | Derived | Family B gated on **NB-1** |
| 17 | Founder Conversation ("Ask") | `/ask` | S-14 | Net-new | Gated on **Q-2**; specified for the hybrid only |
| 18 | Task list + detail | `/tasks`, `/tasks/<id>` | S-8 | Live + derived | — |
| 19 | Settings | `/settings` | S-16 | Live + derived | Push rows gated on **R-14** |
| 20 | Simulation Lab | `/lab` | S-17 | Live | ADR-0001 D9 — permanent, relocate only, behaviour unchanged |

**Cross-cutting requirement (DESIGN-001 §6.4 / §15.2, adopted from SPRINT-1F-PLAN §6.4):** every entity surface renders the **six-field decision header** — *Status · Current owner · Status reason · Next gate · Blockers · Evidence* — in fixed order, **as a unit or not at all**, on Views 2, 5, 7, 9, 11, 18 and every row-detail sheet.

## 3.2 The six shared view states

Every view implements all six (DESIGN-001 §4.3):

| State | Binding rule |
| --- | --- |
| Loading (initial) | Dimension-matched skeletons. **No zeros, no empty-state copy.** An empty state during loading is a false claim of emptiness. |
| Loading (refresh) | Content stays fully rendered and interactive. **No skeletons over content, no layout shift, no focus loss.** |
| Populated | Normal. |
| Empty (true) | Genuinely zero records. Names what would appear and the one action that produces it. |
| Empty (dark) | Capability not instrumented. **Must never look like Empty (true).** |
| Failure | Per the §4.4 taxonomy. |

## 3.3 The view-level failure taxonomy

DESIGN-001 §4.4: feed failure · record-not-in-snapshot · malformed record · action failure · **action ambiguity** (refresh-only, never retry) · partial view failure.

**Gap.** This taxonomy contains **no permission-denied / unauthenticated / session-expired state**. See §5 M-2.

## 3.4 The decision-flow states

DESIGN-001 §11.4: `PRECONDITION UNKNOWN` (controls not rendered) → `NOT ACTIONABLE` (disabled + reason on the control) / `ACTIONABLE` → `CONFIRMING` → `SUBMITTING` → `CONFIRMED` / `FAILED` / `UNCONFIRMED` (controls disabled, **refresh only**).

---

# 4. Confirmed alignment

These are places where the roadmap-level intent, the ADRs, the engineering plan, the design specification, and repository evidence agree. They are recorded because agreement reached independently is evidence, and because they are the parts of the contract that should **not** be relaxed during implementation.

| # | Item | Agreeing sources |
| --- | --- | --- |
| A-1 | **Design owns the shell, vocabulary, truth model, decision flow, and component inventory.** | SPRINT-1F-PLAN §20.4 R-A3 (explicit cession, withdrawing its own §5/§6); PHASE_2 §17.3 (REPORTED); `AGENTS.md` § Department Boundaries |
| A-2 | **Honest absence over plausible placeholders.** Unknown renders as words, never `0`; Empty (dark) ≠ Empty (true). | DESIGN-001 D4/D5/D6, §2.6; SPRINT-1F-PLAN AC-19 and R-2 (*"Severe — destroys the trust the interface exists to create"*); §20.4.C adopts DESIGN-001's treatment **wholesale** |
| A-3 | **PE-3 — `escalationReason` renders beside `origin`, as four distinct presentations.** | DESIGN-001 §7.5, §11.3, Views 5/7/11; SPRINT-1F-PLAN S-4 and AC-11; `SPRINT_1E_COMPLETION_NOTES.md` PE-3 (Founder-routed to 1F design time); research R-14 (REPORTED) |
| A-4 | **No optimistic UI.** Results render only from the authoritative snapshot. | DESIGN-001 D13/§11.6 (VERIFIED: both endpoint families return `{ state }`; `applySnapshot` exists at `useDevHqState.ts:90`); SPRINT-1F-PLAN §9.1 |
| A-5 | **No retry after an unconfirmed decision — refresh only.** | DESIGN-001 §4.4, §11.4, §11.10 item 5; SPRINT-1F-PLAN F-8 gated on SEC-7/NB-1 |
| A-6 | **Deep links never redirect on a missing record.** | DESIGN-001 §3.4, §4.4; SPRINT-1F-PLAN F-9, F-6 |
| A-7 | **`PublicReview` is the only review shape crossing the boundary; new projections follow the `?: never` precedent.** | VERIFIED `lib/dev-hq/types.ts:31-35`; ADR-0002; SPRINT-1F-PLAN D-A/AC-7; DESIGN-001 §2.6 rule 8, I8 |
| A-8 | **No founder-facing retry, cancel, reassign, pause, or review pass/fail control.** | DESIGN-001 D10, §4.4, §6.4, §7.4; ADR-0001 D1/O2 (retry budget is Execution-Manager-owned); ADR-0002 E6 |
| A-9 | **Event retention is 200 and non-durable; history surfaces must disclose it.** | VERIFIED `store.ts:226`; DESIGN-001 §2.5, §5.3 RetentionMarker; SPRINT-1F-PLAN §7.4, AC-4, R-5 |
| A-10 | **Roadmap/sprint/release render from planning documents badged `preview`; no entity is created; no burndown, velocity, or projected date; no "Passed" gate value.** | DESIGN-001 D16/D17, Views 3 and 15; SPRINT-1F-PLAN Q-3 **withdrew its own three options in favour of this** |
| A-11 | **Context health ships dark in Phase 1; the UI originates no band, threshold, weight, or score.** | DESIGN-001 §12.6, §12.15; SPRINT-1F-PLAN Q-4 revised, §20.4.C; CLM-S5/S9/S10 (REPORTED); ADR-0001 D4 (simulated agents have no context window) |
| A-12 | **Cost ships dark; the UI will not hardcode prices; no budget entity in 1F.** | DESIGN-001 §13.6, RB-1; SPRINT-1F-PLAN §20.4.D (removes D-F to avoid colliding with Phase 2 `ProjectBudget`) |
| A-13 | **No decision bound to a gesture; no action buttons in a push payload; confirm control repositioned relative to its trigger.** | DESIGN-001 §9.4, §8.6.1, §11.5, §16.6; SPRINT-1F-PLAN §20.4.E adopts RB-5 |
| A-14 | **NB-1 must land before mobile escalation resolution ships.** | DESIGN-001 §11.7, §16.4 blocking gate; SPRINT-1F-PLAN SEC-7, R-10; `SPRINT_1E_COMPLETION_NOTES.md` §7 item 2 (confirmed defect); research R-14 (REPORTED) |
| A-15 | **Simulation Lab is permanent; relocate only, behaviour unchanged.** | ADR-0001 D9; DESIGN-001 View 20; SPRINT-1F-PLAN §3.3, AC-18, §19.4 |
| A-16 | **Task-dependency blocking is not instrumented; wait reason W6 is the honest terminus and no "blocked by X" may be claimed.** | VERIFIED `dev-task-repository.ts:94-97`; DESIGN-001 §7.6 W6, View 11 Lane 2; SPRINT-1F-PLAN §20.4.C (**withdraws D-K from 1F**) |
| A-17 | **The existing four-value provenance vocabulary is preserved and extended from panels to values.** | VERIFIED `lib/mission-control/status.ts:26`, `DataSourceBadge.tsx`; DESIGN-001 §2.1 D1 |
| A-18 | **The `actionable` precondition is already correct in code and must be preserved.** | VERIFIED `view-model.ts:486`, `ApprovalQueuePanel.tsx:85-120` renders the disabled reason; DESIGN-001 §11.3, §9.12 rule 1 |

**A-19 — one item DESIGN-001 records as blocked that is now unblocked.** DESIGN-001 §15.5 and §2.5 record (verified at `057e12c`) that a declined dispatch emits **zero events**, so *"queued, agent null"* has no recorded reason and `statusReason` *"must render 'Not recorded' — which is honest, and useless."* **VERIFIED at the ratified baseline:** `lib/dev-hq/constants.ts:77` defines `execution.assignment_deferred` and `:79` defines `execution.claim_lost`. The Sprint 1E remediation landed in `d922f37`. **Wait reason W4 and the status-reason derivation for a deferred assignment are now backed by a recorded event.** DESIGN-001's §2.5 register is anchored to the pre-remediation tree and needs the re-verification its own §16.8 and §16.9 already call for.

---

# 5. Missing or incomplete requirements

Ordered by consequence. Each names what is missing, the evidence for the absence, who owns the fix, and what it blocks. **Every absence below was established by an explicit search, and the search is stated.**

## 5.1 Missing required views and flows

### M-1 — There is no sign-in, unauthenticated, or re-authentication UX. **BLOCKING.**

**Evidence.** Content search of DESIGN-001 for `sign-in`, `sign in`, `unauthenticated`, `unauthorized`, `401`, `403`, `re-auth`, `expiry`, `expired` returns **nine hits, none of which is a sign-in flow**: §2.5.1 line 186 (a claim, see below), View 19 §19.3 (*"Session — signed-in principal, session age, sign-out"*), §19.5 (session states `active / expiring / expired`), §19.9 (server-backed controls disable on `disconnected`), BC-11, and five unrelated uses of "expiry" meaning *lease* expiry.

**The gap.** There is no sign-in view in the twenty-view inventory, no route for it in §3.4, no wireframe, no state matrix, no unauthenticated landing state, and no specification of what a founder sees when a session expires **mid-decision**. `SPRINT-1F-PLAN` **F-10** requires *"Re-authentication preserves the destination and, where safe, the unconfirmed intent. Never lands the Founder on Home with no explanation."* No surface in DESIGN-001 delivers that.

**A factual error in DESIGN-001 to correct.** §2.5.1 line 186 states *"New View 19 Settings covers session and sign-out; **sign-in/expiry UX specified**."* The body does not specify it. The claim is unsupported.

**Why it blocks.** 1F-6 (authentication) is on the plan's **critical path** (`1F-0 → 1F-6 → 1F-11 → 1F-12 → 1F-13`) and is called *non-negotiable* (§2.6). AC-8 requires every public route to reject unauthenticated requests. An engineer implementing 1F-6 has no approved UX for the first screen a founder will ever see.

**Owner: Design** (specify the surface), **with the Founder on Q-5** (mechanism, which changes the flow shape — passkey, single credential, and a hosted IdP produce three different screens).

### M-2 — Permission-denied / unauthenticated is not a view state anywhere. **BLOCKING.**

**Evidence.** DESIGN-001 §4.4's failure taxonomy has six rows and none of them is authorization. §4.3's six shared states contain none. The only "permission denied" in the document is `View 19 §19.5`, which is the **browser's push permission**, a different concept.

**The gap.** Once 1F-6 lands, every route can return 401 or 403. The task-level requirement that *"empty, unavailable, loading, error, stale, and permission-denied states must be meaningfully distinct"* is unsatisfiable: a 401 today would surface through `useDevHqState`'s generic catch as a feed failure (`useDevHqState.ts:64-69` maps any non-ok response to `Dev HQ state request failed (HTTP …)` and increments `consecutiveFailures`), so **an expired session would render as "Not connected to Dev HQ"** — a false statement about the network that also disables every decision control for the wrong reason.

**Owner: Design** (the state and its copy), **Engineering** (a distinguishable payload — see §7 P-9).

### M-3 — PWA cold-offline launch has no specified state.

**Evidence.** DESIGN-001 §9.3 requires a cached app shell so *"a cold launch on a poor connection shows structure rather than a blank screen"*, and §9.6 specifies offline behaviour **for a session that already has a snapshot** (*"the last snapshot renders with the red ribbon"*). §4.3's `Loading (initial)` state is defined as *"no snapshot yet"* → skeletons. **The case "shell served from cache, no snapshot, no network" is neither of these** and is undefined: skeletons that will never resolve read as a hung app, not as an offline one.

`SPRINT-1F-PLAN` **AC-10** requires *"cold offline launch shows the shell"* and **RES-10** requires that cached data never render without an explicit staleness label.

**Owner: Design.**

### M-4 — There is no recovery/reconnected state or announcement, and no wake-from-background behaviour.

**Evidence.** Content search for `reconnect`, `recovery announce`, `visibilitychange`, `backgrounded` in DESIGN-001 returns only §7.8's relabelling of `degraded` → **"Reconnecting"**. There is no `recovered` state, no announcement on recovery, and no specification of what happens when a phone wakes.

`SPRINT-1F-PLAN` **F-3** requires *"Announce recovery politely"* and **F-4** requires an immediate refresh on `visibilitychange` with long-backgrounded state *"treated as stale until confirmed"*. Neither has a UX definition. On a phone this is the single most common transition.

**Owner: Design.**

### M-5 — The connection-state vocabulary is defined only for polling.

**Evidence (VERIFIED).** DESIGN-001 §2.4 derives all four feed states from consecutive **poll** failures, matching `useDevHqState.ts:96-103` (1 failure → `degraded`, 3 → `disconnected`). DESIGN-001 §9.8 states *"The 3-second poll is unchanged on mobile"* and A7 assumes it persists.

**The conflict.** `SPRINT-1F-PLAN` §2.6 states a 3-second full-snapshot poll *"is the wrong transport for a phone"*, **RES-12** sets a performance budget it cannot meet, and **Q-7** recommends **SSE with polling fallback**. If Q-7 resolves to SSE, a stream has connection states (open, retrying, failed, fallen back to polling) that **do not map onto a consecutive-failure counter**, and DESIGN-001 defines no vocabulary for them. F-11 additionally requires the fallback be reported in Settings.

**Owner: Design** (the vocabulary), **contingent on the Founder/LSE answer to Q-7.**

### M-6 — The Context Spine's Sprint segment has no specified fallback.

**Evidence.** DESIGN-001 §3.3 makes the Sprint segment permanent and preview-marked, sourced from planning documents. View 3 §3.x specifies a fallback if plan documents may not be UI data sources (degrade to the recorded column only, per C6). **The Spine has no such fallback** — and it is persistent on *every* view, so an E-7 refusal breaks a global component, not one screen.

**Owner: Design**, contingent on **E-7** (Director of Operations + Founder).

## 5.2 Internal defects in the design authority

These are inconsistencies **within** DESIGN-001. They are Design's to fix and I have not fixed them, because this audit is read-only and because silently editing an authority under audit is exactly the failure mode the document itself warns about.

| # | Defect | Evidence | Consequence if built as written |
| --- | --- | --- | --- |
| **M-7** | **The §4.1 route column contradicts the §3.4 URL scheme.** §4.1 lists View 5 as `/timeline/<id>` (:363), View 13 as `/budget` (:371), View 15 as `/release` (:373). §3.4 changed all three to `/executions/<id>` (:311), `/cost` (:321), `/releases` (:323), each marked `[CHANGED]`. §4.1 was not updated. | DESIGN-001 :311, :321, :323 vs :363, :371, :373 | Three routes built twice, or built wrong. §3.4 is the reconciled scheme and should govern. |
| **M-8** | **View 6's scorecard copy contradicts its own v1.1.0 correction in three places.** §6.3 (:1334) requires the slot to *"assert neither"* outcome while Q-6 is open, with required wording quoted. But §6.6 (:1353) still reads *"approved-deferred (ADR-0002 D-E6)"*; §6.12 rule 7 (:1384) still reads *"it is approved-deferred"*; and the wireframe (:1420) still reads *"approved-deferred (ADR-0002 D-E6)."* | DESIGN-001 :1334 vs :1353, :1384, :1420 | The UI would state a Founder decision that has not been made — the precise failure the correction was written to prevent. |
| **M-9** | **View 14's delivery prohibitions contradict the §8.6 revision.** §8.6 (:3383-3395) replaces the absolute delivery prohibition with a three-part recordable-delivery rule, permitting "sent"/"delivered" once a `D-J` record exists. View 14 §14.3 (:2437-2443) still states as current fact that *"Nothing is delivered anywhere"*, and §14.14 rule 1 (:2495) still reads *"**Must not imply delivery.** No 'sent', 'delivered', 'notified' language **anywhere**"* — stated absolutely, with no post-1F-10 branch. | DESIGN-001 :2437, :2495 vs :3383-3395 | A correct 1F-10 implementation would violate a stated View 14 prohibition. |
| **M-10** | **The mobile tab bar is four tabs in two places and five in another.** §9.3 (:3461) revises to five tabs — `Home · Decide · Work · Ask · More`. View 16 §16.5 (:2728-2730) shows four — `Home Decide Queue Proof`. View 1 §1.14 (:731-732) shows the same four. | DESIGN-001 :3461 vs :2728, :731 | The primary navigation is ambiguous at the one breakpoint the sprint exists to serve. |
| **M-11** | **The §14.10 handoff summary is stale.** It describes *"a 16-view screen inventory"* and *"4 mobile tabs"* (:4136) after v1.1.0 added Views 17–20 and the fifth tab. | DESIGN-001 :4136 vs §3.2 (:269-274), §9.3 | A reader who consumes only the handoff summary — which is what it is for — gets the wrong inventory. |
| **M-12** | **§2.5's data-availability register is anchored to a superseded tree.** It states *"Verified against the working tree at `057e12c`"* (:146). The ratified baseline is `d922f379`. At least one row is now stale (§4 A-19: the two new event types exist). | DESIGN-001 :146 vs `constants.ts:77,79` | The honesty backbone of the design is keyed to a pre-remediation tree. §16.9's own recommended sequence already requires this re-verification before integration. |

## 5.3 Places where the UX assumes data the repository may not provide

| # | UX assumption | Repository truth | Disposition |
| --- | --- | --- | --- |
| M-13 | Views 4/5/6 render lease, heartbeat lapse, dispatch confirmation, claim deadline, wait reason W5 | **VERIFIED:** `AgentAssignment` is store-only (`lib/dev-hq/types.ts:49`); `DevHqState` carries no assignments array | Answered **yes** by SPRINT-1F-PLAN R-A1 (`PublicAgentAssignment` in 1F-1). DESIGN-001's `—` fallbacks stay specified as contingencies. **No design change needed.** |
| M-14 | View 5 renders a merged, ordered, append-only timeline | **VERIFIED absent:** no timeline module; `CommandCenterModel` has no timeline field | Answered **both** by R-A2 (read-model 1F-1, panel 1F-14). **But see §6 X-3 — where it is assembled is contested.** |
| M-15 | Every entity surface renders `currentOwner`, `statusReason`, `nextGate`, `blockers` | **VERIFIED absent** from `view-model.ts` | SPRINT-1F-PLAN D-C / 1F-3. Requires an explicit-absence contract (§7 P-3). |
| M-16 | Cost, budget, model attestation | **VERIFIED:** `usage: null` (`agent-execution-service.ts:81`); no cost field, no budget entity, no rate source; `Agent.provider` is free text on the *agent* | Dark surface. 1F-4 capture plumbing only. Correct as designed. |
| M-17 | Context health and checkpoints | **VERIFIED absent** from `types/domain/` | Dark surface. CLM-owned. Correct as designed. |
| M-18 | Notification delivery | **VERIFIED absent:** no notification record, no channel, no subscription store, no VAPID config, no service worker, no manifest | 1F-9/1F-10, gated on **R-14** and **E-3**. |
| M-19 | Roadmap / sprint / release | **VERIFIED absent:** no domain type, no store collection, no API | `preview` from documents. Gated on **E-7**. |
| M-20 | Every view shows an authoritative `as of` timestamp | **VERIFIED:** `useDevHqState.ts:60` and `:92` stamp `updatedAt` with `new Date().toISOString()` — **the client's clock at receipt, not the server's snapshot time** | **New requirement.** See §7 **P-11**. On an instrument panel whose central promise is freshness honesty, an age derived from a possibly-skewed client clock is a fabricated measurement. |
| M-21 | Status vocabulary for reviews, escalations, agent health, assignment status, wait reasons, HQ posture | **VERIFIED:** `lib/mission-control/status.ts` defines tokens for lifecycle, execution, approval, workflow stage, availability, and connection **only** | All of DESIGN-001 §7.3–§7.9 is net-new. Not a spec gap; a build gap to size. |

## 5.4 Places where implementation might invent, infer, or calculate authoritative truth in the browser

**JUDGMENT, flagged as implementation risk rather than as findings against any document.** Each names the exact repository seam where it could happen.

| # | Risk | Seam | Guard that already exists |
| --- | --- | --- | --- |
| M-22 | **Timeline assembled client-side** becomes the de facto audit history, losing append-only and stable-ordering guarantees, and silently truncating at 200 without disclosure | ADR-0002 E5 *places* the merge *"in the Mission Control view-model layer"* — see §6 X-3 | AC-3, AC-4; DESIGN-001 §5.12 rules 1, 6 |
| M-23 | **`currentOwner` falls back to `Task.assigneeAgentId`** — the single most likely wrong-owner bug | `view-model.ts:381-384` already treats `assigneeAgentId` and `execution.agentId` as interchangeable for `assignedAgentIds` | DESIGN-001 §18.3, §18.12 rule 1; SPRINT-1F-PLAN §7.3 |
| M-24 | **Health computed in the browser from a client clock.** `AgentHealth` is age-versus-threshold; computing `now - lastActiveAt` in the browser makes the verdict depend on the device clock and on snapshot age | No server-side health field on `DevHqState` | DESIGN-001 §6.9 (badge must carry `(as of …)` when stale); reinforced by **P-11** |
| M-25 | **Context-health band computed in the consumer** | None yet | DESIGN-001 §12.15 rule 8 (`PublicContextHealth` only) — explicitly prohibited |
| M-26 | **`escalationReason` inferred from `origin`** when the review is missing from the snapshot | Escalation and review are separate arrays on `DevHqState` | DESIGN-001 §11.8, §11.12 rule 2 — *"reason not recorded"* and *"review not in snapshot"* must not be collapsed |
| M-27 | **Wait reason inferred for a blocked task** | `listDependencies` returns `[]`, so nothing contradicts a guess | DESIGN-001 §4.12 rule 6, W6 |
| M-28 | **`DevHqState.overview` used as live counters** | **VERIFIED:** typed from `data/placeholders/mission-control.ts` (`lib/dev-hq/types.ts:1, :37`) | DESIGN-001 D22, §1.12 rule 1; SPRINT-1F-PLAN §20.4.G I5 |
| M-29 | **Progress percentage rendered beside a technical failure** | **VERIFIED:** `view-model.ts:235-240` emits `percent: 0` when `currentIndex < 0`, and `STAGE_INDEX.failed === -1` (:163) | DESIGN-001 D23, §2.12 rule 2 — render no bar and no percentage |

---

# 6. Conflicts by source and authority

Each conflict names **the sources involved**, **which authority governs**, and **who must decide**. None is resolved here.

## X-1 — Is DESIGN-001 approved?

| | |
| --- | --- |
| **Sources** | `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` §7 — *"Approved Mission Control UX"* · `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` header — *"awaiting Founder review and Product Owner acceptance"* and §16.9 — **"NOT READY FOR INTEGRATION"** |
| **Governing authority** | `AGENTS.md` § Governing Authority tier 5 (approved product requirements) and § Department Boundaries. A design artifact is approved when Product/the Founder approves it, not when another document describes it as approved. |
| **Decision owner** | **Founder / Product Owner** |
| **Consequence while open** | Engineering cannot cite DESIGN-001 as approved requirements; reviewers cannot certify against it as an approved baseline. G-1 (Design review, before implementation) has no approved input. |

## X-2 — The roadmap that governs capability direction is not in the repository

| | |
| --- | --- |
| **Sources** | Task framing (*"The roadmap controls capability direction and sequence"*) · `PHASE_2_PROGRAM_PLAN.md:6` cites **Master Roadmap v7.1** as authority · `RESEARCH_BACKLOG.md:2865-2884` (E-1a) · `GOVERNANCE_UPDATE_PLAN.md:46, 102, 764` (B-9) · DESIGN-001 §15.14 item 2 · `CLM_COLLABORATION_HANDOFF.md:412` |
| **Repository truth** | **VERIFIED: no roadmap document exists at any version. v8.0 is not referenced by any document in the repository; every citation is to v7.1, which is also absent.** |
| **Second problem** | `AGENTS.md` § Governing Authority lists **eight tiers and none of them is a roadmap tier**. Even if committed, its authority level is unestablished. |
| **Governing authority** | `GOV-001` (quote-the-text rule) and `AGENTS.md` § Governing Authority |
| **Decision owner** | **Founder**, with the Director of Operations |
| **Consequence** | **This audit could not check Sprint 1F's UX contract against the roadmap, because the roadmap does not exist in the repository.** Every statement in this document about roadmap conformance is therefore absent, not favourable. Five specialist artifacts now record the same absence. |

## X-3 — Where is the execution timeline assembled? **Highest technical consequence.**

| | |
| --- | --- |
| **Sources** | **ADR-0002 E5** (`ADR-0002…md:151-154`): the timeline is *"a derived read-model… **assembled in the Mission Control view-model layer**"* · **SPRINT-1F-PLAN §8.3**: `GET /api/dev-hq/timeline?executionId=…&cursor=` — a **server** endpoint, item 1F-1 · **DESIGN-001 §5.3**: the stream is badged `derived` and disclosed as *"merged in the browser"* until the read-model lands · **Standing constraint in this audit's framing**: *"Sensitive workflow truth must be projected safely from the server, not recomputed in the browser."* |
| **Governing authority** | **ADR-0002 governs**, and it currently locates the merge in the browser-side view-model layer. |
| **Status** | The ADR-0002 E5 amendment is a **recorded, unauthored obligation**: `SPRINT_1E_COMPLETION_NOTES.md` PE-2, `SPRINT_1F_ENTRY_PACKAGE.md` §5 **D-9**, SPRINT-1F-PLAN §16.3 and I-11, GOVERNANCE_UPDATE_PLAN §6.2. |
| **Decision owner** | **Founder**, via the ADR-0002 amendment, with the Architecture Reviewer |
| **Why it matters for UX** | The two readings produce **different provenance badges and different disclosures** on View 5 — `derived` + a client-merge disclosure versus `live`. DESIGN-001 specifies both, so no redesign follows either way. But an implementation cannot satisfy ADR-0002 E5 as written **and** the server-projection principle simultaneously, and building 1F-1 before the amendment lands would build against a superseded ADR. |

## X-4 — Scorecards: Phase 2 or Sprint 1F?

| | |
| --- | --- |
| **Sources** | **ADR-0001 D8** (`:146-149`): *"Scorecards: deferred to **Phase 2**… out of Phase 1 scope unless they become required for Phase 1 acceptance."* · **ADR-0002 D-E6 / E9** (`:215`, `:230`): *"Scorecards and analytics are deferred to **Sprint 1F**."* · Canonical 1F scope excludes executive analytics · DESIGN-001 §14.2 **A4** originally assumed the scorecard domain was inside 1F scope (**withdrawn** at §15.11) |
| **Governing authority** | **The ADRs govern, and they disagree with each other.** ADR-0002 is later and cites ADR-0001 as authority but never states that it supersedes D8, so precedence is genuinely ambiguous. |
| **Decision owner** | **Founder**, with an ADR-0002 amendment either way |
| **Concurrences (evidence, not authority)** | SPRINT-1F-PLAN E-1/Q-6, Phase 2 C-3/NEW-1, GOVERNANCE_UPDATE_PLAN §4.8/B-6 all independently place scorecards in 2D/2E |
| **UX consequence** | View 6's reserved-slot copy must assert **neither** outcome (DESIGN-001 §6.3). **M-8 records that three places in View 6 still assert "deferred."** |

## X-5 — Current implementation contradicts the approved-in-draft UX in ways that require Founder awareness

| | |
| --- | --- |
| **Sources** | **VERIFIED implementation:** `MissionControlOverview.tsx:58-92` posts approve/reject **immediately on click**, with no confirmation step and no feed-status gate; `ApprovalQueuePanel.tsx:85-106` renders `Approve` and `Reject` **adjacent, same size, both enabled**; `MissionControlOverview` is rendered **inside** `MissionControl.tsx`, the Simulation Lab page. · **DESIGN-001:** §1.12 rule 2 (*"Must not decide anything inline… at any breakpoint"*), §11.5 (mandatory confirmation dialog for every decision), §9.12 rule 5 (never adjacent, same-size, same-weight), §11.7 (disabled while `disconnected`), View 20 §20.2 (the Lab is relocated **under** Settings, not the container of Mission Control) |
| **Governing authority** | **Design governs the target UX (R-A3).** But `AGENTS.md` § Universal Responsibilities requires preserving approved working behaviour unless change is authorized — and inline approval is currently *shipped, working* behaviour. |
| **Decision owner** | **Founder**, to authorize the behaviour change; **Design** owns the target; **Engineering** implements in 1F-11/1F-13 |
| **Note** | The `actionable` precondition is already implemented correctly (`ApprovalQueuePanel.tsx:107-120` renders the disabled reason). That part must not regress. |

## X-6 — SPRINT-1F-PLAN's divergence register is keyed to a superseded design version

| | |
| --- | --- |
| **Sources** | SPRINT-1F-PLAN §20.4.H derives C-1…C-6 against **DESIGN-001 v1.0.0**. Its **C-1** (*"no conversation view"*, escalated as **Q-INT-2**), **C-5** (*"DESIGN-001's navigation map does not place the Simulation Lab"*, escalated as **Q-INT-3**), and **C-6** (resolved *"in Design's favour — Tasks are reached via the Context Spine"*) are all stale: v1.1.0 added **View 17** (Ask), **View 20** (Simulation Lab), and **View 18** (standalone Tasks). |
| **Governing authority** | Design owns the surfaces; the plan owns its own register. |
| **Decision owner** | **SPRINT-1F-PLAN owner** (Lead Software Engineer), to re-derive §20.4.H against v1.2.0 |
| **Consequence** | **Q-INT-2 and Q-INT-3 should be re-checked before the Founder is asked to rule on them.** Escalating a discharged conflict costs a Founder decision cycle for nothing. DESIGN-001 §15.18 routes the same notice. |

## X-7 — GOVERNANCE_UPDATE_PLAN X-14 has one party

| | |
| --- | --- |
| **Sources** | `GOVERNANCE_UPDATE_PLAN.md:497` — **X-14**, *"Mandate overlap between this UX spec and an absent Founder Interface UX workstream… High, unreconcilable here"*, sourced to DESIGN-001 §14.5 **C1**, which DESIGN-001 v1.2.0 **withdrew in full**. `:45` and `:690` carry the same premise. |
| **Governing authority** | Governance owns its own contradictions register. |
| **Decision owner** | **Director of Operations** |
| **Recommendation (labelled as one)** | **Close X-14 as void rather than adjudicate or escalate it.** Confirmed three ways independently: repository search (no such document), SPRINT-1F-PLAN §20.4 R-A3, and DESIGN-001 §15.1/§15.18. This audit's own repository search found no second UX design document. |

## X-8 — Light theme: a standards requirement with no owner and no design

| | |
| --- | --- |
| **Sources** | **STANDARD-011** (`standards/ACCESSIBILITY_STANDARD.md:129`): *"Maintain readability in **light and dark** themes."* · **VERIFIED:** `lib/theme.ts` defines a single dark-surface palette; the one contrast note (`:12`) claims AA *"on dark surfaces"* only. · DESIGN-001 §13.2 item 6 records the light theme as **unresolved**; §16.3 item 11 defers it to the Founder / Product Owner. · SPRINT-1F-PLAN **A11Y-14** marks dark/light contrast **unaudited**. |
| **Governing authority** | **STANDARD-011 governs.** Accessibility is not optional polish (`AGENTS.md` § Accessibility). |
| **Decision owner** | **Founder / Product Owner**, on scope; **Design**, on the theme itself |
| **Consequence** | Sprint 1F cannot claim STANDARD-011 conformance while the light theme is undesigned and contrast is unmeasured. Deferring it is a legitimate Founder choice; **deferring it silently is not.** |

## X-9 — Transport decision changes a Design-owned vocabulary

| | |
| --- | --- |
| **Sources** | DESIGN-001 §2.4, §7.8, §9.8, assumption A7 (polling) · SPRINT-1F-PLAN §2.6, RES-12, **Q-7** (SSE recommended), **F-11** (fallback reported in Settings) |
| **Governing authority** | **Engineering owns the transport** (Q-7, under the deployment ADR). **Design owns the founder-facing state vocabulary.** |
| **Decision owner** | **Lead Software Engineer** under the deployment ADR, with the Founder informed — and then **Design** must extend §2.4/§7.8 to the chosen transport |
| **Consequence** | Sequencing matters: if the shell is built before Q-7 resolves, the feed-status ladder is hard-coded to a polling model. See **M-5**. |

## X-10 — Decisions that belong to Design, Engineering, and the Founder

Recorded explicitly so no boundary is crossed by default.

| Belongs to **Design** (may be settled without escalation) | Belongs to **Engineering** | Requires the **Founder** |
| --- | --- | --- |
| The sign-in / unauthenticated / session-expiry surface (M-1) | Transport mechanism (Q-7) | X-1 approval status of DESIGN-001 |
| Permission-denied state and its copy (M-2) | Timeline read-model implementation, ordering and tie-break | X-2 roadmap authority and tier |
| PWA cold-offline state (M-3) | `PublicAgentAssignment` projection shape | X-3 ADR-0002 E5 amendment |
| Recovery/reconnect state and announcement (M-4) | `isProjection` field name, shape, granularity | X-4 scorecards, plus the ADR-0002 amendment |
| Route-table correction (M-7) | Auth mechanism (Q-5), session/cookie semantics | X-5 authorizing the inline-approval behaviour change |
| View 6 scorecard copy (M-8) | Event-stream separation (Q-8 → E-3) | X-8 light-theme scope |
| View 14 delivery copy (M-9) | Payload scoping and pagination | Q-1 deployment/persistence |
| Mobile tab set (M-10) | Idempotency of `accept`/`abandon` (NB-1) | Q-2 conversation architecture |
| Handoff summary refresh (M-11) | DOM/Playwright test infrastructure | Q-3 / E-7 plan documents as UI data sources |
| §2.5 re-verification against `d922f379` (M-12) | Cost/usage capture plumbing | Q-6 scorecards · Q-9 dependencies · OQ-14 Evidence Viewer · OQ-16 band policy |
| Context Spine fallback (M-6) | | R-14 acceptance of the push contingency |

---

# 7. Required server projection contracts from the UX perspective

Stated as **consumer requirements**. None is a backend design. Numbering is this document's; the DESIGN-001 `BC-n` equivalent is given where one exists.

| # | Contract | Serves | Status |
| --- | --- | --- | --- |
| **P-1** | `PublicAgentAssignment` projection — lease, heartbeat, dispatch, claim deadline — with secrets excluded **by construction** (`?: never`, the `PublicReview` precedent), not by `Omit` | Views 4/5/6; wait reason W5; timeline dispatch and claim entries | **Committed** — SPRINT-1F-PLAN D-A / R-A1 (BC-1) |
| **P-2** | Execution timeline projection: merged, chronologically ordered, **deterministic secondary sort** (record kind, then id), append-only, cursor-paged, and carrying an explicit **`truncated` / `atCap`** flag the UI can render | View 5; the retention marker; AC-3/AC-4 | **Committed** — D-B / 1F-1 (BC-2). **Placement contested — see X-3.** |
| **P-3** | Derived decision fields — `currentOwner`, `statusReason`, `nextGate`, `blockers` — each carrying an **explicit-absence discriminant**, not `null`. The UI must be able to distinguish, without inference: `recorded` · `not_recorded` · `not_instrumented` · `not_exposed` · `not_in_snapshot` · `permission_denied`. `currentOwner` **must not** fall back to `Task.assigneeAgentId` | The six-field decision header on every entity surface | **Committed as D-C / 1F-3** (BC-3). **The six-way discriminant is this audit's addition** — DESIGN-001 requires all six presentations but the plan's D-C specifies only "explicit-absence semantics" |
| **P-4** | `isProjection` (or equivalent) **marked on the payload**, so claim class derives from data rather than from a component author remembering | §2.2 enforcement product-wide | BC-5. Field name, shape, and granularity are Engineering's |
| **P-5** | Model/provider **attestation** per execution, structurally distinct from `ExecutionRouting.provider` (a routing constraint, not an attestation of what ran) | View 5, View 6, cost attribution | D-E (BC-6). Anchored to research R-01 |
| **P-6** | `PublicContextHealth` — band, raw figures, `sampledAt`, sampling interval, `bandPolicyVersion`, `provisional`, and **enforcing-vs-shadow mode**. **The projection is the only shape that crosses the boundary; no raw checkpoint, packet, snapshot, or ledger** | View 12 instrumented state | REPORTED answered by SPEC-CLM-001 (BC-9). Band **numbers** are Founder policy, not a backend contract |
| **P-7** | Cost: persisted per-execution usage (input/output tokens, model id, duration), a rate source, attribution to task/execution/attempt/review iteration, and a currency + precision convention. **The UI will not hardcode prices.** No budget entity in 1F | View 13 instrumented state | D-D under Q-4; rate source is E-5 / R-17 (BC-10) |
| **P-8** | Push subscription state and a delivery record that **distinguishes *dispatched* from *delivered***. Subscriptions are credentials and must never appear in a read model | §8.6, View 19 | D-I / D-J (BC-7); creation gated on **E-3** |
| **P-9** | **Session/principal state, and an authorization result the UI can render distinctly.** A 401 and a 403 must be **structurally distinguishable from a transport failure** in the response the client sees, with a machine-readable reason and a preserved destination, so an expired session never renders as "Not connected to Dev HQ" | The missing sign-in/permission-denied states (M-1, M-2); §11 disabled-while-unauthenticated; F-10 | BC-11 covers session state. **The 401/403 discriminant and the destination-preservation contract are this audit's addition** and follow directly from M-2 |
| **P-10** | Any history-bearing payload (timeline, activity, notifications) carries an **at-cap / truncated** indicator, so the retention marker is rendered from data rather than inferred from a count of 200 | View 5, View 14, View 2 activity | Implied by AC-4; **stated explicitly here** because inferring truncation from `length === 200` is a browser-side derivation of an authoritative fact |
| **P-11** | **A server-emitted snapshot timestamp on every read payload.** **VERIFIED:** `useDevHqState.ts:60` and `:92` stamp `updatedAt` from the browser clock at receipt. Every `as of HH:MM:SS (Ns)` in DESIGN-001 — and every staleness, health, deadline, and countdown derivation — is therefore computed against the **client's** clock | §2.4 freshness model, every view header, `HealthBadge`, `DeadlineCountdown`, `FreshnessStamp` | **New. Not carried by any existing plan item.** A device with a skewed clock produces a confidently wrong age on the one surface whose central promise is that it never states what it does not know |
| **P-12** | Notification and delivery records **must not** share the 200-cap audit `Event` stream | View 5 retention-marker frequency; View 14 catch-up window | BC-8 / Q-8, **folded into E-3** — Founder + Phase 2, not the LSE alone |
| **P-13** | Idempotent `accept` / `abandon` (NB-1) | §16.4 mobile Family B gate | BC-13. **Confirmed defect, blocking** |

---

# 8. Honest unavailable-state requirements

The design's governing sentence is DESIGN-001 §0.3: *"every pixel either reports something the system actually recorded, or it says out loud that it does not know."* The following states are **not interchangeable**, and each must be distinguishable **visually and non-visually** (STANDARD-011; DESIGN-001 §10.9).

| State | Meaning | Required treatment | Backing rule |
| --- | --- | --- | --- |
| **Empty (true)** | Snapshot loaded, genuinely zero records | Names what would appear and the one action that produces it | §4.3 |
| **Empty (dark)** | Capability not instrumented | Dashed container, `Not instrumented` heading prefix, the reason, the risk it creates, and a "what would light this up" contract. **Never the same visual as Empty (true)** | §4.3, D5, D6 |
| **Not recorded** | The record exists; this field has no value | **The words "Not recorded"** (or a more specific reason) as the primary content. `—` only as a leading marker, or alone in a dense cell whose column header and accessible name carry the words. **Never `0`** | §2.2 note, §2.3, D4 |
| **Not exposed to the browser** | Persisted server-side, absent from the read model | Grey group, `—` count, the reason stated. Distinct from "not recorded" | §2.5, §4.6 |
| **Record not in current snapshot** | Deep link to a record the snapshot does not contain | In-body panel naming the in-memory-store cause; `Back`, `Go to Home`, `Copy id`. **No redirect** | §4.4, F-6, F-9 |
| **Retention-truncated** | History is at the 200-event cap or provably incomplete | Terminal `RetentionMarker`, `role="note"`, in the reading order, not collapsible | §5.3, AC-4, P-10 |
| **Stale / degraded** | Snapshot age exceeds the threshold | Amber ribbon, running age counter, **all animation stops**, countdowns freeze and strike through | §2.4 |
| **Disconnected** | ≥3 consecutive failures | Red sticky ribbon, posture becomes `unknown`, content desaturates, **every mutating control disables with the reason on the control** | §2.4, §11.7, F-2 |
| **Permission denied / unauthenticated** | The server refused on identity grounds | **NOT SPECIFIED — M-2.** Must be distinct from a transport failure; must not disable controls with a network reason | Required by the task framing; requires **P-9** |
| **Offline, shell-only cold launch** | PWA shell served from cache, no snapshot, no network | **NOT SPECIFIED — M-3.** Must not present as an indefinite skeleton | AC-10, RES-10 |
| **Recovered / reconnected** | Feed returned after a failure | **NOT SPECIFIED — M-4.** Polite announcement required | F-3, F-4 |
| **Provisional band** | A Recorded measurement scored against an **unapproved** rule | Band label + *"(provisional threshold)"*, `bandPolicyVersion` beside it, hatched/outlined treatment — **not** the Projection dashed style — accessible name beginning `Provisional threshold:`, excluded from any headline verdict | §12.5.1, CLM-S10 (REPORTED) |
| **Shadow mode** | A band is measured but not enforcing | `Shadow mode — measured, not enforcing.` | §12.15 rule 10 |
| **Filtered to empty** | Filters exclude everything | Distinct from lane-empty; active filters listed; `Clear filters` | §4.6, §8.6 |
| **Partially measured** | Some sessions report, others do not | Shown as partial with the excluded items named. **Never averaged into a healthy verdict** | §12.15 rule 4, CLM-S7 (REPORTED) |

**Two absolute rules that apply to all of the above:**

1. **Absence is never success.** A task with no failures and no evidence is *"No evidence recorded"*, not *"Clean"*; an empty blocking-facts list on the Release view is followed immediately by *"This is not a release approval."* (§2.6 rule 10, §15.7).
2. **Forbidden vocabulary (§7.10) binds every founder-facing string:** "On track", "Healthy" (for a project), "Ready to ship", "Verified", "Clean", "All good", "ETA", "% complete", "Delayed", "At risk", "Notified"/"Sent"/"Delivered" (except from a delivery record), "Passed" (for a release gate), "Unlimited", "Optimizing"/"Thinking".

---

# 9. Mobile / PWA requirements

## 9.1 Position

The phone is a **triage and decision device** with exactly two jobs: know whether anything needs you, and clear what does (DESIGN-001 §9.1, §16.3). Analysis, forensics, reconciliation, and release readiness are desktop jobs — reachable on mobile, not optimized, and never hidden.

## 9.2 Layout and targets

| # | Requirement | Source |
| --- | --- | --- |
| MP-1 | **360 × 640 is the design and build floor.** Every screen complete and correct there before any wider layout is built | DESIGN-001 §9.2 (reconciled), RES-1, AC-1 |
| MP-2 | No horizontal page scroll at ≥ 320 px; wide content scrolls inside its own container | §10.8, RES-6 |
| MP-3 | Touch targets ≥ 48 × 48 px with ≥ 8 px separation; **decision buttons ≥ 56 px tall with a 24 px gap** (deliberately stricter than RES-5's 44 px floor, because these targets carry irreversible decisions) | §9.3, §16.9, RES-5, A11Y-10 |
| MP-4 | Safe-area insets honoured (`env(safe-area-inset-*)`), especially the bottom tab bar and any decision button above the home indicator | §9.3, RES-4 |
| MP-5 | Text scales to 200 % without clipping any decision control or its consequence text; if scaling pushes context below the buttons, the **quick action is withheld** | §16.9, RES-7 |
| MP-6 | Both orientations; confirm controls never off-screen | §16.9, RES-11 |
| MP-7 | Five tabs — `Home · Decide · Work · Ask · More`. If Q-2 defers the conversation surface, the fifth becomes `Proof`. **Only `Decide` is badged**, and its badge is exactly the Decision Inbox count | §9.3, §3.2. **Contradicted internally — M-10** |
| MP-8 | `More` contains every remaining view, grouped as the desktop rail. **No view is hidden on mobile** | §16.10 rule 8 |

## 9.3 Decisions on a phone

| # | Requirement | Source |
| --- | --- | --- |
| MP-9 | Only two decision shapes are quick-actionable: workflow approve/reject, and escalation resolve — each under strict preconditions | §16.4 |
| MP-10 | **Hard gate:** if the full decision context does not fit above the action buttons without scrolling, the quick action is **withheld** and the card offers `Open full decision` | §16.4 |
| MP-11 | **BLOCKING GATE:** escalation resolution (Family B) **must not ship on mobile until NB-1 is fixed.** The card shows full cause and consequences and replaces its action row with `Open full decision →`, stating why | §16.4, §11.7; SEC-7; R-14 (REPORTED) |
| MP-12 | Confirmation is a full-screen focus-trapped sheet, with the confirm control **in a different screen position** than the trigger | §16.6, §11.5 |
| MP-13 | **No decision is ever bound to a gesture.** Swipe is used for nothing; long-press copies an id and never decides | §9.4 |
| MP-14 | `Approve` and `Reject` never adjacent, same-size, same-weight; `Revise` and `Abandon` never adjacent | §9.10, §11.10 item 9 |
| MP-15 | No haptic or animation may imply a decision landed before the snapshot confirms it | §16.10 rule 9 |

## 9.4 PWA and push

| # | Requirement | Repository truth |
| --- | --- | --- |
| MP-16 | Web app manifest: name, short name, 192/512 maskable icons, `display: standalone`, start URL, scope, theme and background colours | **VERIFIED absent.** `public/` holds five SVGs |
| MP-17 | Correct viewport meta and `theme-color` | **VERIFIED absent.** `app/layout.tsx` exports `metadata` with title and description only |
| MP-18 | Service worker caching the **app shell** so a cold launch shows structure. **Cached data is never rendered without an explicit staleness label** | **VERIFIED absent** |
| MP-19 | Push reserved for **Founder-actionable transitions only** — a new open escalation, and a new *actionable* pending approval. A pending approval with no wait token **must not push** | Policy, DESIGN-001 §8.6.1 / R-11 |
| MP-20 | Payload carries: the **four-way escalation cause** (`origin` **and** `escalationReason`), the subject title (not an id alone), the record id, a deep link to the **decision surface** (never Home), and self-contained text meaningful without opening the app | §8.6.1, AC-11, A11Y-13 |
| MP-21 | **No action buttons in the payload.** A notification action bypasses the confirmation dialog and the freshness check | §8.6.1, RB-5, adopted by SPRINT-1F-PLAN §20.4.E |
| MP-22 | No secret, token, or internal identifier in a payload — notifications are readable on a locked screen | SEC-13 |
| MP-23 | Platform support is **reported from what the browser says**, never asserted. Four states: subscribed / not subscribed / blocked by the browser / not supported on this platform | §19.3, R-14 (REPORTED) |
| MP-24 | **The entire push channel is contingent on research R-14.** If Web Push proves unavailable on the Founder's device, AC-11, AC-12 and journey J-1 are withdrawn and J-1 degrades to notify-on-open | SPRINT-1F-PLAN R-14x, §20.4.E |

## 9.5 Reconnect and low-bandwidth

| # | Requirement | Status |
| --- | --- | --- |
| MP-25 | The `initial → live → degraded → disconnected` ladder, with values retained and the age counter running | Specified (§2.4). **VERIFIED as existing behaviour** in `useDevHqState.ts:96-103` |
| MP-26 | **No animation on stale or disconnected data**, at any breakpoint. Countdowns freeze and strike through | Specified (§2.4, §9.8) |
| MP-27 | Offline is **readable, not actionable.** No offline queue, no deferred submission | Specified (§9.6); F-12 |
| MP-28 | Recovery announcement and wake-from-background refresh | **NOT SPECIFIED — M-4** (F-3, F-4 require both) |
| MP-29 | Cold-offline shell state | **NOT SPECIFIED — M-3** (AC-10, RES-10) |
| MP-30 | Connection-state vocabulary for a non-polling transport, and the Settings report of a degraded transport | **NOT SPECIFIED — M-5** (F-11, Q-7) |
| MP-31 | The phone must not re-render the whole tree per update; visible content updates in place with **no layout shift and no focus loss**; skeletons only on initial load | Specified (§9.8, §1.7) |
| MP-32 | Performance budget on a mid-range phone over 4G: interactive < 3 s cold, < 1 s warm — **requires payload scoping; a full snapshot every 3 s does not meet it** | RES-12; conflicts with §9.8's *"poll unchanged"* — see **M-5 / X-9** |

---

# 10. Accessibility requirements

Target: **WCAG 2.2 Level AA** (STANDARD-011, VERIFIED at `standards/ACCESSIBILITY_STANDARD.md:46`). DESIGN-001 §10 is written to be checkable against a built screen and is adopted here in full. The following consolidates it with SPRINT-1F-PLAN A11Y-1…A11Y-14 and adds the gaps this audit found.

## 10.1 Structure, keyboard, and focus

- One `<h1>` per view; headings descend without skipping; landmarks present; lists are lists; tables have `<th>` and `scope`; ordered data (timeline, gates, inbox) uses `<ol>`; `<time>` for every timestamp; skip-to-main-content is the first focusable element.
- Every action reachable and operable by keyboard, in visual order, with no trap outside intentional modal traps. Visible focus indicator ≥ 3:1.
- **No decision has a keyboard accelerator** (§3.5) — deliberate: an irreversible founder decision must not be one keystroke from a list.
- Dialog focus starts on the **heading**, never the confirm button; focus restores to the invoker on close; **focus is never moved by a background poll**; **rows do not reorder while a descendant has focus**; route changes move focus to the new `<h1>`.

## 10.2 Non-colour encoding and screen-reader honesty

This is where accessibility and the truth model are the same requirement: a sighted user gets provenance from styling, so a screen-reader user must get it from the accessible name — otherwise §2's honesty guarantees apply only to some users (§10.9).

- Every status is dot/icon **plus** text. No state, severity, provenance, or claim class carried by colour alone.
- Accessible-name prefixes are **mandatory**: `Projection:` · `Recommendation:` · `Not recorded:` (with the reason) · `Not instrumented` (dark panels) · `Provisional threshold:`.
- Decision controls carry **subject-bearing** names (`Approve: Add retry telemetry to dispatch`), never bare "Approve". Disabled controls expose their reason via `aria-describedby`.
- Health badges include their **threshold** (`last activity 2m 14s ago, threshold 60s` — **VERIFIED**: `AGENT_HEALTH_STALE_AFTER_MS` is 60 s, `constants.ts:51`). Pip meters expose `N of M`, never a percentage.
- Escalation cause is available non-visually as **two separate fields** (`origin` and `escalationReason`), never one merged string.
- Dark states are distinguishable from true-empty states non-visually. Stale warnings and retention disclosures are in the reading order, not visual-only.

## 10.3 Live regions and motion

- Posture and results are `polite`. **`assertive` is reserved for exactly one case: a failed founder decision** — an unannounced failed decision is a silent data-loss event.
- Announcements rate-limited to **≤ 1 per 30 s per region**. A 3-second poll with assertive regions would interrupt a screen reader continuously.
- `prefers-reduced-motion` honoured for pulses, transitions, and sheets. No animation while degraded or disconnected. **No time limit on any decision**; countdowns are informational and nothing expires from the UI's clock.

## 10.4 Forms and decisions

Visible `<label>` on every input (placeholders are never the only label); required fields indicated in text; validation errors as text, adjacent and programmatically associated; the confirmation dialog states subject, effect, irreversibility, and snapshot age; the confirm control is repositioned; destructive options never adjacent to their opposite; error recovery never requires re-entering data.

## 10.5 Accessibility gaps this audit found

| # | Gap | Consequence |
| --- | --- | --- |
| **AX-1** | **No accessibility test can currently run.** **VERIFIED:** `vitest.config.ts` sets `environment: "node"` and `include: ["**/*.test.ts"]` — `.tsx` is not collected; `@playwright/test` is a devDependency with **no config**. | AC-15 (*"automated audit clean on every new screen"*) is unverifiable until 1F-19a/19b land. A UI sprint with no UI test capability cannot be validated. |
| **AX-2** | **Light theme undesigned, contrast unmeasured.** STANDARD-011:129 requires readability in both themes; `lib/theme.ts` is dark-only; DESIGN-001 §13.2 items 3 and 6 record both as unresolved; A11Y-14 marks it unaudited. | STANDARD-011 conformance cannot be claimed. See **X-8**. |
| **AX-3** | **No accessible treatment for permission-denied or session expiry** (M-1, M-2). A session that expires mid-decision must announce something true; today it would announce a network failure. | Screen-reader users receive a false explanation at the worst moment. |
| **AX-4** | **No accessible treatment for recovery** (M-4). F-3 requires a polite recovery announcement; none is specified. | The one transition a mobile user experiences most often is silent. |
| **AX-5** | **Announcement rate-limiting is specified but untested against a 3-second poll** (DESIGN-001 §13.2 item 7). | The mitigation for the product's most likely screen-reader hazard is unvalidated. |
| **AX-6** | **Manual passes are required, not optional.** A11Y-12 requires a mobile screen-reader pass on J-1 and J-2; automated audits catch roughly a third of real issues. | Recorded so it is not quietly dropped when the sprint compresses. |

---

# 11. Explicit Phase 2 deferrals

Nothing in this list may be started, scaffolded, or partially built during Sprint 1F. Sources: ADR-0001, ADR-0002, SPRINT-1F-PLAN §3, DESIGN-001 §16.3, `SPRINT_1F_ENTRY_PACKAGE.md` §3.

| # | Deferred | Authority | Note |
| --- | --- | --- | --- |
| D2-1 | Executive analytics of any kind: dashboards over time, trend lines, velocity, burn-down/burn-up, throughput, cycle time, forecasting, predictive alerts | Canonical 1F scope; SPRINT-1F-PLAN §3.1 | **Hard prohibition on View 3**, not a phase deferral: burndown, velocity, and projected dates have no inputs and would be invented (DESIGN-001 §3.12 rules 1–2) |
| D2-2 | Scorecards and aggregate agent performance | **CONTESTED — X-4.** ADR-0001 D8 says Phase 2; ADR-0002 D-E6 says Sprint 1F | View 6 reserves a dark slot whose copy must assert neither |
| D2-3 | Cross-project rollups, portfolio views, comparative agent ranking | SPRINT-1F-PLAN §3.1 | |
| D2-4 | Real AI agents and reviewers | ADR-0001 D4; ADR-0002 Future Considerations | This is *why* View 12 ships dark: simulated agents have no context window |
| D2-5 | Supabase persistence and the persistence abstraction | ADR-0002 E9 / D-E5; ADR-0001 D7 | Routed to its own workstream (Phase 2 P-1 / D-P1). **1F must not own it** |
| D2-6 | `WorkItem` promotion and the Project → WorkItem → Task rewiring | ADR-0002 E8 | 1F renders Project → Task → Execution → AgentAssignment and **must leave a structural seam** so the promotion is additive |
| D2-7 | Multi-user, roles, RBAC, SSO, teams, presence | SPRINT-1F-PLAN §3.2, §10.3 | 1F authenticates exactly one principal |
| D2-8 | **Budget entity** | SPRINT-1F-PLAN §20.4.D | Phase 2 §4.5 already defines `ProjectBudget`; a 1F budget entity would collide with it. 1F-4 is capture plumbing only |
| D2-9 | **Checkpoint entity (`ContextCheckpoint`)** | CLM-K7 (REPORTED); SPRINT-1F-PLAN §20.4.D | CLM-owned. 1F consumes a projection and creates nothing |
| D2-10 | Context-health aggregation and fleet verdicts | CLM-S9 (REPORTED) — Phase 2 stage 2E | 1F renders per-session measurements only |
| D2-11 | Durable notification records, the returning-founder **digest**, and durable event history | DESIGN-001 §8.7 — *"none of which exist. Not proposed as scope"* | |
| D2-12 | Email, SMS, Slack channels | SPRINT-1F-PLAN §3.3 | 1F is **Web Push only** |
| D2-13 | Offline **mutation** — queued approvals that sync later | SPRINT-1F-PLAN §3.3, F-12; DESIGN-001 §9.6 | 1F is offline-**readable**, not offline-actionable. A queued decision firing against changed state is a correctness hazard |
| D2-14 | Native iOS/Android applications | SPRINT-1F-PLAN §3.3 | 1F is a PWA |
| D2-15 | Task-dependency instrumentation (`D-K`) | SPRINT-1F-PLAN §20.4.C — **withdrawn from 1F** | W6 renders the honest residual; no "blocked by X" may be claimed |
| D2-16 | Candidate ADRs **#7** (scope key) and **#12** (canonical event/metric model) | Phase 2 §2.7 — both **Blocking** before Phase 2 implementation | 1F must not pre-empt either. Push-subscription and delivery records are the only 1F outputs exposed to them — **E-3** |
| D2-17 | Rewriting or removing the Simulation Lab | ADR-0001 D9; SPRINT-1F-PLAN §3.3 | Relocation in the IA is permitted; behaviour change is not |
| D2-18 | Changing the founder-request workflow, its stages, its wait-token invariant, or any existing public response shape | SPRINT-1F-PLAN §3.3, §8.1, AC-5/AC-6 | 1F is additive to the API, with **one approved exception**: authentication (Q-5) |
| D2-19 | Resolving Sprint 1E follow-ups 1F does not depend on | `SPRINT_1F_FOLLOWUP_REGISTER.md`; SPRINT-1F-PLAN §3.3 | **RAT-5 is record-only** per Founder direction; the Entry Package records a conflict with the plan's AC-4 (its Conflict 4, F-A2) |

**One item that must not drift into this list by default.** The **light theme** (X-8) is a **STANDARD-011 requirement**, not a Phase 2 feature. Deferring it is the Founder's call; deferring it silently is a standards violation.

---

# 12. Founder decisions

Consolidated from DESIGN-001 §16.6, SPRINT-1F-PLAN §20.3, `SPRINT_1F_ENTRY_PACKAGE.md` §16, and this audit. **Ordered by what they block.** Nothing here is decided by this document.

## 12.1 Blocking — Sprint 1F cannot start its UX work without these

| # | Decision | Raised by | Blocks |
| --- | --- | --- | --- |
| **FD-1** | **Approve or reject DESIGN-001 as the approved Mission Control UX** (Product Owner acceptance + Founder review). Resolve X-1: it is described as approved in one document and self-declares NOT READY FOR INTEGRATION in another | **This audit (X-1)**; DESIGN-001 header and §16.9 | G-1 design review; every Phase-D surface item; any reviewer certification |
| **FD-2** | **Declare the authority status and tier of the Master Roadmap**, or accept in writing that five specialist plans were produced without it | **This audit (X-2)**; research E-1a; governance B-9; DESIGN-001 §16.9 item 4 | Any claim of roadmap conformance, including this audit's |
| **FD-3** | **Amend ADR-0002 E5** to settle where the timeline is assembled — browser view-model (as written) or server projection | **This audit (X-3)**; PE-2; Entry Package D-9; SPRINT-1F-PLAN §16.3 | 1F-1, 1F-14, View 5's provenance badge |
| **FD-4** | **Q-1 — deployment target and persistence.** A hosted PWA on a non-durable single-process memory store is not simultaneously satisfiable | SPRINT-1F-PLAN Q-1; Entry Package D-2 | Phases B–E; the weight of every durability disclosure |
| **FD-5** | **Q-5 — authentication mechanism**, and approval of the additive-only deviation | SPRINT-1F-PLAN Q-5, SEC-1…SEC-14 | 1F-6 (critical path); **and the shape of the missing sign-in UX, M-1** |
| **FD-6** | **Q-9 — new dependencies** (auth, web-push, DOM test environment) | SPRINT-1F-PLAN Q-9; Entry Package D-6 | 1F-6, 1F-10, 1F-19a — and therefore all UI validation |
| **FD-7** | **NB-1 remediation disposition**, and accept or reject the mobile Family B gate until it lands | DESIGN-001 §16.4, §11.7; SEC-7 | **Changes what may ship.** Mobile escalation resolution |

## 12.2 Scope and shape decisions

| # | Decision | Raised by | Blocks |
| --- | --- | --- | --- |
| **FD-8** | **Q-6 — scorecards in 1F or Phase 2**, with an ADR-0002 amendment either way | X-4; SPRINT-1F-PLAN E-1; governance B-6 | View 6's slot copy; the 1F/2D boundary |
| **FD-9** | **Q-2 — conversation architecture** (structured palette / real AI / hybrid / deferred) | SPRINT-1F-PLAN Q-2; DESIGN-001 OQ-8 | View 17; the fifth mobile tab; §3.5's palette scope |
| **FD-10** | **Q-3 + E-7 — may `docs/plans/` prose and `RELEASE_PROCESS.md` be UI data sources?** And is the Release view cut from 1F? | SPRINT-1F-PLAN E-7; DESIGN-001 C6/C7, OQ-9 | Views 3 and 15; **and the Context Spine's Sprint segment, M-6** |
| **FD-11** | **OQ-14 — is the Evidence Viewer (View 8) in 1F?** It is not in the plan's screen list | DESIGN-001 §15.13 | View 8; otherwise §8's honesty constraints carry to the evidence *field* |
| **FD-12** | **Split the sprint into 1F-a / 1F-b?** DESIGN-001 §16.3 item 12 supplies the view-level cut if so | SPRINT-1F-PLAN R-1 | Everything; recommended by the plan |
| **FD-13** | **Accept that AC-11, AC-12 and journey J-1 are contingent on research R-14** — Web Push may be unavailable on the Founder's device | SPRINT-1F-PLAN R-14x | The sprint's headline journey |
| **FD-14** | **E-3 — may 1F create push-subscription and delivery records before candidate ADRs #7 and #12?** | SPRINT-1F-PLAN §20.4.D; supersedes Q-8 | 1F-10 |
| **FD-15** | **Light-theme scope** — in Sprint 1F, or explicitly deferred with the STANDARD-011 gap recorded | **This audit (X-8)**; DESIGN-001 §13.2 item 6; A11Y-14 | STANDARD-011 conformance claims; AC-15 |
| **FD-16** | **Authorize the behaviour change to the shipped inline-approval flow** (confirmation dialog, non-adjacent controls, disconnected gating, Simulation Lab relocation) | **This audit (X-5)** | 1F-11, 1F-13; `AGENTS.md` preserve-working-behaviour rule |

## 12.3 Policy and ownership decisions

| # | Decision | Raised by | Blocks |
| --- | --- | --- | --- |
| **FD-17** | **Assign an owner for cost instrumentation.** Four independent documents record it as unowned | DESIGN-001 OQ-18; CLM OQ-C7 (REPORTED); governance §3; SPRINT-1F-PLAN E-5 | View 13's instrumented state |
| **FD-18** | **Approve the context-health band policy** (weights, thresholds, floor values, sampling interval), or accept that View 12 ships provisional-only | DESIGN-001 OQ-16; CLM-S9/S10 (REPORTED); governance G-11/P-7 | Whether View 12 can ever show a governed verdict |
| **FD-19** | **OQ-3 — decisions permitted while `degraded`**, re-decided on the corrected NB-1 basis (the original justification rested on server-side idempotency, which NB-1 refutes for Family B) | DESIGN-001 §11.7, §12.1 | §11.7; the mobile split |
| **FD-20** | **OQ-5 — is the mobile quick-action split acceptable** (approvals resolvable, escalations read-only), and should it persist after NB-1 closes? | DESIGN-001 OQ-5; R-14 | §16.4 |
| **FD-21** | **Whether DESIGN-001 §2, §7.10, and §11 become governed standards** | Governance `O-1`; SPRINT-1F-PLAN E-6; DESIGN-001 GV-3 | Whether the honesty rules bind surfaces beyond these views. **Owner: Director of Operations** |
| **FD-22** | **Where approved design specs live and how they are versioned** | Governance `G-8`; DESIGN-001 OQ-4/GV-1/Q10 | This document's own home and ID. **Owner: Director of Operations** |
| **FD-23** | **Close GOVERNANCE_UPDATE_PLAN X-14 as void** rather than adjudicate it | **This audit (X-7)**; DESIGN-001 §15.18 | A Founder decision cycle spent on a conflict with one party. **Owner: Director of Operations** |
| **FD-24** | **Direct the SPRINT-1F-PLAN owner to re-derive §20.4.H against DESIGN-001 v1.2.0** before Q-INT-2 / Q-INT-3 reach the Founder | **This audit (X-6)** | Two escalations that appear to be already discharged |

---

# 13. Implementation guidance that preserves Design authority

**Read this section as the boundary rules for building Sprint 1F, not as design.** They are derived from `AGENTS.md` § Department Boundaries, SPRINT-1F-PLAN §20.4 R-A3, and DESIGN-001 §16.7/§16.8.

## 13.1 What is authoritative and what is not

- **Authoritative (Design-owned):** DESIGN-001 §2.1–§2.4, §2.6 and every per-view *prohibited misleading behavior* subsection, §3, §4, §5 (all twenty views), §6, §7, §8, §9, §10, §11. SPRINT-1F-PLAN's §5, §6, §11, §12 are **withdrawn as competing definitions by that plan's own terms** and must not be implemented in preference to DESIGN-001.
- **Advisory (not to be implemented as requirements):** DESIGN-001 §2.5's status columns where they characterise another workstream's scope, §12, §13, §14, §15.7, §15.14, §12.6/BC-9, BC-10, §15.13, §16.3 item 12, and **every wireframe**. Wireframes are structural: no colour value, type scale, spacing system, or iconography is specified and no contrast ratio has been measured.
- **Not yet approved:** all of it, pending **FD-1**.

## 13.2 Rules for engineering

1. **The per-view *prohibited misleading behavior* subsections are acceptance criteria, not commentary.** Each is a testable statement. AC-2 and AC-19 already require absence to be tested by feeding a record with no recorded reason and asserting the honest string.
2. **Absence strings are Design-owned copy.** An engineer may not substitute `—`, an empty cell, `N/A`, `0`, or a friendlier phrasing. If a specified string does not fit, that is a Design escalation, not a code decision.
3. **Never derive an authoritative fact in the browser.** Every value the founder acts on comes from a server projection with an explicit-absence discriminant (§7 P-3). The seams where this is most likely to slip are enumerated at **M-22…M-29**; treat that list as a review checklist.
4. **Follow the `PublicReview` precedent for every new browser-readable projection** — `?: never` restatement, not `Omit`. `PublicReview` is the only review shape that may cross the boundary (AC-7).
5. **Implement the six-field decision header as one component, rendered as a unit or skeletoned as a unit.** A partially populated decision header is worse than none, because a founder reads the first three fields and acts.
6. **Preserve what already behaves correctly.** The `actionable` precondition (`view-model.ts:486`), the disabled-reason rendering (`ApprovalQueuePanel.tsx:107-120`), the last-good-snapshot retention (`useDevHqState.ts:1-7`), the `actorName` raw-id fallback, `buildStageProgress` returning `null` on a missing workflow, and the post-decision focus move (`MissionControl.tsx:38-51`, `MissionControlOverview.tsx:86-88`) are all existing correct behaviour that the new surfaces must inherit rather than reinvent.
7. **G-1 (Design review) runs before implementation of the surfaces it governs.** Building twelve screens and then reviewing the design is a rework request, not a review (SPRINT-1F-PLAN §16.2, R-13).
8. **Where a Founder decision is open, build the specified fallback — do not pick a side.** Every conditional surface in §3.1 has a specified fallback. Choosing between them in code is an unauthorized interpretation under `AGENTS.md` § Governing Authority.
9. **Do not resolve a DESIGN-001 internal inconsistency in code.** M-7 through M-12 are Design's to fix. An engineer who picks one of two contradictory route tables has silently made a Design decision.
10. **Report, do not override.** If an approved UX requirement proves technically infeasible, the finding goes back to Design with the constraint stated. Engineering *"decides how approved requirements are implemented"* — not whether.

## 13.3 Sequencing consequences of this audit

**JUDGMENT, offered as recommendations to the Sprint 1F coordinator.**

1. **Do not start any surface item until FD-1 settles.** Building against an artifact that self-declares NOT READY FOR INTEGRATION reproduces the Sprint 1E PE-1 ambiguity.
2. **M-1 and M-2 should be closed by Design before 1F-6 starts**, not after. Authentication is on the critical path and currently has no approved first screen and no approved failure state.
3. **Resolve Q-7 before 1F-11 (the shell).** The feed-status vocabulary is baked into the shell; hard-coding a polling model and then adopting SSE means building the staleness system twice (M-5, X-9).
4. **Re-verify DESIGN-001 §2.5 against `d922f379` before Phase A.** DESIGN-001's own §16.9 recommends it; §4 A-19 shows at least one row has already changed.
5. **1F-19a (component test infrastructure) must precede the Phase-D surfaces**, or every accessibility and absence-state acceptance criterion ships unverifiable (AX-1).

---

# 14. Readiness verdict

# **UX BLOCKED**

**Four reasons. None is a defect in the UX design itself, and none is mine to resolve.**

1. **The governing design artifact is not approved and self-declares NOT READY FOR INTEGRATION.** DESIGN-001's header reads *"awaiting Founder review and Product Owner acceptance"* and its §16.9 verdict is `NOT READY FOR INTEGRATION`, while `SPRINT_1F_ENTRY_PACKAGE.md` §7 lists it as *"Approved Mission Control UX."* Sprint 1F has a sole design authority and no approved design. **(X-1 / FD-1.)**

2. **Two required surfaces on the critical path have no UX at all.** There is no sign-in, unauthenticated, or re-authentication flow (**M-1** — and DESIGN-001 §2.5.1 line 186 claims otherwise, which is a factual error in the authority), and permission-denied is absent from the failure taxonomy and from every view's state set (**M-2**). 1F-6 (authentication) is called *non-negotiable* and sits on the plan's critical path. With the current client, an expired session would render as *"Not connected to Dev HQ"* — a false statement that also disables every decision control for the wrong reason.

3. **ADR-0002 E5 places the execution timeline in the browser view-model layer, which contradicts the requirement that sensitive workflow truth be projected from the server — and its amendment is unauthored.** The amendment has been a recorded obligation since Sprint 1E (PE-2) and is carried by three separate documents. Building 1F-1 before it lands builds against a superseded ADR. **(X-3 / FD-3.)**

4. **The roadmap cited as controlling capability direction and sequence is absent from the repository at every version.** No v8.0 exists or is referenced anywhere; every citation is to v7.1, which is also absent; and `AGENTS.md`'s eight authority tiers contain no roadmap tier. **This audit could not perform the roadmap-conformance half of its own remit.** Five specialist artifacts now record the same absence. **(X-2 / FD-2.)**

**What would move this to UX READY WITH DECISIONS.** Reasons 1 and 2 are the shortest path: Product Owner acceptance of DESIGN-001 (with M-1 and M-2 specified, and the six internal defects M-7…M-12 corrected — all of which are Design's work and none of which requires a new decision), plus a Founder ruling on FD-3 and FD-2. Everything else in §12 has a specified fallback and can follow, because every conditional surface in §3.1 is designed both ways.

**What this verdict does not say.** It does not say the UX is wrong, incomplete in substance, or low quality. DESIGN-001 is unusually thorough: twenty views, six states each, a failure taxonomy, a forbidden-vocabulary list, and a per-view prohibition set, with four workstreams independently converging on honest absence over plausible placeholders. The block is about **authority and two missing surfaces**, not about design quality.

---

# 15. Confirmation that no implementation files were changed

**Confirmed.** This audit was read-only with a single, authorized exception.

- **Files created: exactly one** — this document, `docs/plans/SPRINT_1F_MISSION_CONTROL_UX_CONTRACT_AUDIT.md`, placed alongside its sibling Sprint 1F planning documents. No new directory tree was created.
- **Files modified: none.** No existing file — source, test, configuration, ADR, plan, standard, handbook, or another specialist's output — was edited.
- **No code was changed.** No file under `app/`, `components/`, `lib/`, `types/`, `data/`, `public/`, or `trigger/` was touched.
- **No ADR, roadmap, plan, or protected artifact was modified.** ADR-0001 and ADR-0002 were read only. The internal defects recorded at **M-7…M-12** are in another document's ownership and were **reported, not fixed**.
- **Nothing was committed, staged, tagged, or pushed.** No state-mutating git command was run.
- **No validation was executed.** No `tsc`, `eslint`, `vitest`, or `next build` was run during this audit, and no claim in this document rests on test output. Every VERIFIED claim rests on direct file inspection at the tree named in the header.
- **No Phase 2 work was started, planned, or scaffolded.** §11 lists what must be deferred and does nothing else with it.

---

# Handoff

**Task:** Sprint 1F Mission Control UX and roadmap consistency audit (read-only).

**Responsible role:** Claude Design Engineer (AGENT-004 / ROLE-014).

**Status:** Complete. Verdict **UX BLOCKED**.

**Intended next owner:** Sprint 1F coordinator, for routing; then the **Founder / Product Owner** for FD-1…FD-7.

**Objective:** Evaluate the Sprint 1F Mission Control UX contract against the roadmap, the ADRs, the approved design artifacts, the engineering plans, and repository truth; record every conflict with its governing authority and decision owner; produce no design and resolve no conflict.

**In scope:** All 26 evaluation areas named in the assignment, across DESIGN-001, SPRINT-1F-PLAN, the Entry Package, ADR-0001/0002, the Sprint 1E closure record, and the current implementation.

**Out of scope, and honoured:** no implementation, no modification of any existing file, no commit, no redesign of approved UX, no Phase 2 planning beyond listing deferrals, and no unilateral resolution of any cross-authority conflict.

**Work completed:** DESIGN-001 read in full (4,708 lines); SPRINT-1F-PLAN §1–§21 read; ADR-0001 and ADR-0002 read at the decision level; the Sprint 1E closure record, follow-up register, and Entry Package read; 20+ implementation files inspected and cited by line. Twelve absence claims were established by explicit search and the search method recorded. Twenty-nine missing-requirement and browser-derivation findings, ten cross-authority conflicts, thirteen server projection contracts, and twenty-four Founder decisions are recorded.

**Validation performed:** Documentary and static inspection only. Every claim marked **VERIFIED** was confirmed by opening the named file at the tree in the header. Claims marked **REPORTED** were not independently re-derived and name their source. Claims marked **JUDGMENT** are design opinion.

**Not validated:** No build, type-check, lint, or test was run. The Context Lifecycle Manager specification and the Phase 2 programme plan were read only in targeted sections; their Design-facing obligations are taken REPORTED from DESIGN-001 §15.16 and SPRINT-1F-PLAN §20.4.I. No usability, contrast, performance, or screen-reader validation was performed — none is possible in a read-only documentary audit, and none is claimed.

**Risks, limitations, and assumptions:**
- **Unquantifiable:** the Master Roadmap is absent at every version, so the roadmap-conformance half of this audit's remit could not be performed. Its absence is stated rather than glossed.
- **Assumption:** `SPRINT_1F_ENTRY_PACKAGE.md` is the artifact the assignment called the "Sprint 1F Preparation Handoff". No document of that name exists. If a different artifact was meant, §1.2 records the search that failed to find it.
- **Version drift:** DESIGN-001 v1.2.0 and SPRINT-1F-PLAN v0.2.0 are **untracked working-tree files** their owners continue to revise. Every finding is keyed to the versions named in §1.
- **Findings M-7…M-12 are defects in another document's text.** They were reported and not corrected, because correcting an authority under audit without its owner's involvement is the failure mode the audit exists to catch.

**Next action:** Route **FD-1** (approve or reject DESIGN-001) and **FD-2** (roadmap authority) to the Founder / Product Owner first — they gate everything else. In parallel, Design closes **M-1** (sign-in / session UX), **M-2** (permission-denied state), and the six internal defects **M-7…M-12**, none of which requires a new decision. Do not start any Sprint 1F surface implementation until FD-1 settles.
