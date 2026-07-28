# Phase 2 Program Plan — Use Dev HQ to Build Dev HQ

**Document ID:** PLAN-P2-001
**Template basis:** TMP-002 (Technical Plan), extended for multi-stage program scope
**Owner:** Lead Software Engineer (role, not model)
**Authority:** CONST-001, AGENT-001, ORG-001, Master Roadmap **v8.0** §10 / §11 / §12 / §12A / §13 / §13A (`docs/roadmap/MASTER_ROADMAP.md`), ADR-0001, ADR-0002
**Version:** 1.1.0 (supersedes the unversioned 1.0.0 draft)
**Status:** Draft for Founder review — **planning only, no implementation authorized**
**Date:** 2026-07-26

> **v1.1.0 revision note.** v1.0.0 was written before two of the five documents it
> reconciles against existed, and before three Founder decisions were recorded. This
> revision is a **correction pass only** — no stage was redesigned, no acceptance criterion
> changed, the approved 2A→2K order is untouched, and no reserved decision was resolved.
> Six changes: (1) the **Context Lifecycle Manager ownership contradiction** between §1.2
> P-5 and §3.3 is made consistent and carried to the Founder as an open decision (§14
> D-P7), not resolved here; (2) §17/§18 re-keyed against the artifacts that appeared after
> v1.0.0 — `SPEC-CLM-001` v1.1.0 and `GOV-PLAN-001` v0.3.0 — and against the UX
> specification's true size (**4,707 lines**, **v1.2.0**, not the 3,701 recorded in §18);
> (3) **C-2 (ADR numbering) is resolved** by Founder decision and §2.7 converted from
> claimed numbers to proposed subjects; (4) three Founder decisions on review order,
> verdict vocabulary, and severity are recorded in a new **§0.6**; (5) **C-6 / NEW-5 / Q-8**
> corrected — the "no actor can produce an implementation specification" claim is falsified
> by demonstration, but the problem moved rather than resolved; (6) this note.
> Superseded text is corrected in place where it was factually wrong and marked
> *(corrected v1.1.0)*; where it is a preserved historical record (§17), it is left standing
> and superseded by §18/§19 as that section already provides for.

> **External citation correction — governance documentation pass, 2026-07-26.**
> **Not authored by this document's owner.** Made under Founder direction to repair stale
> roadmap references after the Master Roadmap was registered at
> `docs/roadmap/MASTER_ROADMAP.md`.
>
> **Six citations changed, all `v7.1` → `v8.0`:** the Authority line, §0.1, §1.3's four-part
> communication citation, CP-5, and NEW-9. CP-5 and NEW-9 are marked **DISCHARGED** with
> their original text preserved inline rather than deleted.
>
> **Every re-pointed section was confirmed to exist in v8.0 by direct reading** before the
> citation was changed: §10 (with the 2A Communication Broker and 2G Advanced Collaboration
> blocks), §11, §12, §12A, §13, §13A (including its *"Communication and Decision
> Discipline"* subsection), §4A (including *"Controlled Agent Communication"*), and all
> eleven Appendices A–K. **No conclusion, position, acceptance criterion, stage, gate, or
> reserved decision was changed**, and no claim was carried forward merely because v8.0
> states it preserves v7.1.
>
> **Two things this correction does not do.** (1) It does not verify that the *content* of
> those sections is what this plan assumed when it was built from v7.1 — that is ACR-001
> **X-17**, an open Founder decision. (2) It does not touch §0.4's citation of *"roadmap §4,
> §Non-Negotiable Principles"*, which in v8.0 sits under **§1**, not §4; the quoted
> provider-portability text is present and correct, only the section number differs, and
> re-numbering another workstream's citation without knowing v7.1's structure would be a
> guess. Recorded here instead.
>
> Full record: `docs/governance/GOVERNANCE_BASELINE_REVIEW_PACKET.md` §5.

---

# 0. How to read this document

## 0.1 What this document is

This is the implementation-ready expansion of **Phase 2 of the Savrio Dev HQ Master
Roadmap v8.0**. It converts eleven roadmap capability blocks (2A–2K) into stage plans
with entry criteria, systems, data models, interfaces, authority boundaries,
observability, failure behavior, acceptance criteria, evidence requirements, reviewers,
Founder decisions, work-item sequences, out-of-scope statements, completion gates, and
downstream acceleration effects — plus program-level dependency, sprint, critical-path,
ADR, and risk analysis.

## 0.2 What this document is not

- It is **not** a change to the canonical roadmap. The roadmap is a permanent governance
  artifact under Appendix G change control. This plan is subordinate to it and cites it.
  Where this plan identifies a tension in the roadmap, it records the tension and names
  the Founder decision required — it does not resolve it unilaterally.
- It is **not** authorization to implement. Every stage requires its own approved
  technical plan, ADRs, and Founder gate before work starts.
- It is **not** evidence of implementation. Nothing in Phase 2 exists yet. Per roadmap
  §Document Authority: "A capability appearing here is planned or approved direction; it
  is not proof that the capability has been implemented."
- It does **not** move any Phase 2 capability into Phase 1. Where a Phase 2 stage needs
  something Phase 1 already promised (durable persistence, Context Router, Smart Work
  Packets, the Autonomous Engineering Loop), that item is listed as a **Phase 1
  precondition**, not as new Phase 1 scope and not as relocated Phase 2 scope.

## 0.3 Authority ordering used throughout

Repository and verified tool output control implementation truth. Approved ADRs control
architecture and policy. The Permanent Operating Handbook controls operating behavior.
The latest verified Current Progress Update controls live state. The Master Roadmap
controls long-term capability direction. This plan sits below all of those.

## 0.4 Model neutrality rule (binding on every stage)

Per roadmap §4, §Non-Negotiable Principles ("Provider portability"), and §22 (prohibited
shortcut: *"Hardcoding provider, project, tenant, or quality behavior into generic
orchestration"*):

> **No role in this plan is bound to a model.** Every stage plan names *roles*
> (Executive Orchestrator, lead-software-engineer, architecture-reviewer,
> independent-code-reviewer, Knowledge Curator, research agent, specialist reviewers).
> A role is an organizational contract — responsibility, authority, boundaries, inputs,
> outputs, handoffs, escalation. The model executing a role is an assignment, not an
> identity.

Concretely, this plan requires that:

1. **No model name appears in orchestration, routing, or policy code.** Model selection
   resolves at runtime through a `RoutingPolicy` record (stage 2H).
2. **Every role↔model binding is a first-class, versioned, expiring, revocable record**
   (`RoutingPolicyBinding`, stage 2H) with an approving authority and a rollback target.
   No binding is permanent. This applies to Hermes and to every other model, current or
   future, without exception.
3. **Binding changes are governed transitions**, not edits: they carry policy version,
   inputs, decision, explanation, and override authority (roadmap §17).
4. **Every model-assisted execution and decision records exact model identity and
   configuration** (roadmap §13) so that a binding change is measurable and reversible.
5. **Before 2H exists, bindings still must not be hardcoded.** Stages 2A–2G resolve
   models through a thin registry indirection (see §1.4, Precondition P-4) that 2H later
   replaces behind the same port. A stage that ships a hardcoded model reference fails
   its architecture gate.
6. **Historical model performance is never authority.** Per roadmap §22, weakening a
   mandatory review because a model performed well historically is prohibited. 2F
   memory and 2H benchmarks inform selection; they never replace candidate-specific
   review, tests, policy, or evidence.

## 0.5 Conventions

- **Stage** = a roadmap capability block (2A…2K). **Work item** = a plan-level unit sized
  for one Smart Work Packet or a small packet graph. **Sprint** = a grouping of work
  items with one entry gate and one exit gate.
- Data models follow existing repository conventions (`types/domain/*`): `EntityId`,
  `IsoTimestamp`, discriminated unions for status, no vendor types in domain.
- Interfaces follow existing ports-and-adapters conventions (`types/contracts/*`
  contract + `lib/dev-hq/adapters/*` adapter + composition in `getDevHqAdapters()`).
- Sizing is **relative (S / M / L / XL)**, never calendar dates. This program has no
  measured Phase 2 velocity, so any date would be fabricated. Dates become derivable
  after 2E ships forecasting with confidence intervals.
- **L0–L5** authority levels are as defined in roadmap §2.

## 0.6 Recorded Founder decisions on review process *(added v1.1.0)*

Three decisions were recorded by the Founder on **2026-07-26** and are binding on every
stage in this plan. They are recorded here rather than argued: this plan has no authority
over review process and does not propose alternatives to any of them.

**1. Permanent review order.** Every candidate passes through, in this sequence:

```
Independent Code Review → Architecture Review → Founder Approval → Protected Baseline
```

Nothing enters the protected baseline that has not cleared all three preceding steps in
that order. Where this document lists reviewers (§3.12, §4.12, §5.12, §6.12, §7.12, §8.12,
§9.12, §10.12, §11.12, §12.12, §13.12), those lists are **lens inventories — who must look
and at what — not sequences.** The sequence is the one above. Two consequences the stage
sections previously left implicit are now explicit:

- Where a stage names `architecture-reviewer` first (§3.12, §5.12, §9.12, §12.12) it does
  so because architecture is that stage's dominant risk, **not** because architecture
  review precedes code review. It does not.
- Specialist blocking lenses (`security-engineer`, `reliability-engineer`,
  `database-architect`, `devops-engineer`, `qa-engineer`, `claude-design`,
  `Knowledge Curator`) report **into** the two review steps; they are not additional gates
  in the sequence, and none of them substitutes for either.

**2. Independent Code Review verdict vocabulary.** Exactly three verdicts:

```
PASS · PASS WITH NON-BLOCKING FINDINGS · FAIL
```

This supersedes the `APPROVE / APPROVE WITH NON-BLOCKING FINDINGS` wording used in §3.16
of the v1.0.0 draft (corrected below) and any other approve/reject phrasing in this
document. Where a stage completion gate says "blocking reviewers approve," read it as
"blocking reviewers return **PASS** or **PASS WITH NON-BLOCKING FINDINGS**."

**3. Shared severity ladder.** One ladder across every review, gate, finding, and issue
matrix in the program:

```
BLOCKER · MAJOR · MINOR · OBSERVATION
```

**BLOCKER** prevents the verdict from being anything but FAIL. **MAJOR** and **MINOR** are
compatible with PASS WITH NON-BLOCKING FINDINGS and carry a named owner and a due point.
**OBSERVATION** carries neither and creates no obligation. Stage 2K's
`QualityGateDefinition.severityMapping` (§13.5) and stage 2E's `Anomaly.severity` and
`EscapedDefect.severity` (§7.5) **bind to this ladder** rather than defining their own —
a constraint added to their ADRs at this revision, not a redesign of either record.

> **Scope note.** These three decisions govern process, not this plan's content. No
> acceptance criterion, gate, or stage design changed as a result of recording them.

---

# 1. Program preconditions

Phase 2 is defined by roadmap §9 as beginning only after **every Phase 1 exit gate is
verified** and the Founder authorizes Phase 2 execution. That is the governing
precondition. The items below are the specific, verifiable states Phase 2 stages depend
on. All are existing Phase 1 scope; none is new work created by this plan.

## 1.1 Verified current state (repository truth)

**Re-verified at HEAD `88b0d65`, branch `validation/sprint-1e-overnight-2026-07-26`,
2026-07-26.** HEAD advanced from `057e12c` to `88b0d65` during authoring; the three
intervening commits (`feace4d`, `ff280af`, `88b0d65`) are **documentation-only** — no
source file changed — so every code-derived claim below was confirmed unchanged. Rows
marked **(corrected)** changed as a result of this re-check; see §17.11.

| Fact | Evidence |
|---|---|
| Ports-and-adapters foundation exists | `types/contracts/*` (12 contracts), `lib/dev-hq/adapters/*` |
| Execution Manager + Agent Registry exist | `lib/dev-hq/execution-manager.ts`, `lib/dev-hq/agent-registry.ts`, ADR-0001 |
| Review / escalation / evidence / event subsystems exist | `lib/dev-hq/review-service.ts`, `escalation-service.ts`, adapters, ADR-0002 |
| Durable workflow engine is Trigger.dev with token-guarded callbacks | `trigger/*`, `app/api/dev-hq/internal/*` |
| **Persistence is in-memory only** | `lib/dev-hq/store.ts` header: *"Development-only centralized in-memory store… non-durable, not for production"*; no Supabase code on this branch |
| Sprint 1E baseline passes deterministic gates | **Re-run at `88b0d65`: `npx vitest run` → 22 files, 317 tests passed.** Matches validation report §2 exactly. `tsc`/`eslint`/`next build` not re-run this pass — unchanged source implies unchanged result, but that is inference, not fresh evidence |
| Sprint 1E behavioral categories are **unverified**, not passed | Validation report §2: replay, retry, crash recovery, reconciliation, concurrency, idempotency, invariants, review/evidence/escalation lifecycle |
| **(corrected)** Sprint 1F **planning has started**; 1F–1I **implementation** has not | `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` exists (untracked, "SPECIALIST DRAFT — awaiting integration review"); `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` exists (untracked); no 1F–1I source exists in `lib/dev-hq/` |
| **(corrected)** Phase 1 agents are **deterministic simulations only; real AI agents are Phase 2 scope** | ADR-0001 D4: *"Phase 1 ships a deterministic **simulated** agent that performs no real AI inference and no code execution… Real AI agents begin in Phase 2."* ADR-0002 Future Considerations: *"Real AI agents and reviewers (Phase 2), replacing the deterministic simulations."* |
| **(corrected)** Six items are already **recorded as deferred to Phase 2** in approved ADRs and completion notes | ADR-0001 D4 (real agents), D6 (per-agent `maxConcurrency > 1`), D8 (scorecards), O3 (department-mapped capability taxonomy); ADR-0002 E8 (`WorkItem` promotion, rewiring Project → WorkItem → Task); `SPRINT_1E_COMPLETION_NOTES.md` §7 item 12 (CR-11 / P-2 `recordFindings` ordering, `review-service.ts:485-492`, explicitly labeled *"Phase 2 gate"*) |
| **(corrected)** A named 1E remediation set awaits Founder approval and will change the event vocabulary | `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` (committed at `feace4d`): *"AWAITING FOUNDER APPROVAL. No source change applied."* Proposed patches touch `agent-execution-service.ts`, `execution-manager.ts`, `constants.ts`, `review-service.ts`, `escalation-service.ts` and **add two event types** (`execution.assignment_deferred`, `execution.claim_lost`) |
| **(corrected)** **Implementation-specification delivery is currently failing across agent types, and this is an open structural blocker for Phase 2** | `WORKFLOW_DIAGNOSIS.md` §4c (at `357f03b`): **four consecutive freshly-spawned agents across two types** (`lead-software-engineer` ×3, `general-purpose` ×1), each given an explicit deliverable contract and each asked to produce **exact patch text**, produced **zero** deliverables — while two long-lived, repeatedly-resumed reviewer agents (`independent-code-reviewer`, `architecture-reviewer`) produced **nine**. The earlier "specific to this agent type" conclusion is **withdrawn**. Root cause **UNKNOWN**; four candidate explanations, none established. The document escalates the consequence: *"Phase 2 has a real structural blocker… With no independent engineering agent producing a deliverable, that separation cannot currently be satisfied as specified."* |

## 1.2 Precondition register

| ID | Precondition | Why Phase 2 cannot proceed without it | Owner |
|---|---|---|---|
| **P-0** *(added v1.1.0)* | **The Context Lifecycle Manager's sprint assignment is decided (D-P7).** Not a new requirement — a **disclosure of an unresolved one**. This plan states CLM ownership two ways: P-5 below lists it as a **distinct Phase 1 deliverable** coordinate with 1F/1G/1H/1I, while §3.3's 2A dependency table previously attributed it to *"(1G/1H)"*. `SPEC-CLM-001` §14.1 identified the contradiction, declined to resolve it because sprint assignment is roadmap authority, and **recommended** (explicitly labeled a recommendation, not a decision) that the CLM stay a distinct deliverable **sequenced between 1G and 1H**. **This plan does not resolve it either** — doing so would require roadmap authority it does not have. §3.3 has been rewritten to state the same thing §1.2 does, so the two are consistent; the substantive question is carried to the Founder unresolved. | It determines CLM sequencing, which architecture gate reviews it, and whether 1H's Rank-C research (R-13) blocks CLM start. **It does not change any Phase 2 stage design** — 2A, 2E, 2I, and 2J depend on the *capability*, not on its sprint label — so this is a disclosure requirement, not a blocker on Phase 2 content. | **Founder (reserved — roadmap authority)** |
| **P-1** | **Durable persistence for all Work Management records.** **Verified independently at this pass:** branch `feature/sprint-1c-b-supabase-persistence` exists unmerged, tip `3d1665f`, carrying `supabase/migrations/0001_dev_hq_schema.sql`, `lib/supabase/*`, and **seven** Supabase adapters — `approval-manager`, `event-logger`, `project-repository`, `state-reader`, `task-repository`, `workflow-engine`, `workflow-run-repository`. **It has no adapter for `evidence-store`, `review-store`, `escalation-store`, `execution-runner`, or `agent-provider`** — the branch predates Sprints 1D and 1E. `git diff --stat sprint-1e-baseline feature/sprint-1c-b-supabase-persistence` reports **118 files changed, 3,227 insertions, 18,687 deletions**, i.e. the branch is far behind the baseline and cannot be fast-forwarded. (The 1F plan §20.1 Q-1 states "28 files changed"; my measurement differs and I cannot reconcile the two — flagged in §18.4, not silently overridden.) | Every Phase 2 stage writes records intended to outlive sessions. **The five missing adapters are precisely the Phase 2-critical ones**: evidence, review, escalation, and execution records are what 2E measures, 2F remembers, and 2K gates on. So P-1 is **not** satisfiable by merging 1C-B — it requires forward-porting the branch past 1D/1E *and* writing five new adapters. On a non-durable store, 2C/2E/2F/2H produce nothing durable and their acceptance gates are unprovable by construction. | Persistence workstream + **Founder (D-P1)** — explicitly **not** owned by 1F (their Q-1 revised recommendation routes it out) |
| **P-2** | **Phase 1 exit gates verified** (roadmap §9): engineering execution, agent/model efficiency, context continuity, quality and governance, Mission Control, demonstration. | Roadmap §22 prohibits *"Starting autonomous self-improvement before Phase 1 continuity, restoration, review, and recovery gates pass."* | Founder |
| **P-3** | **Sprint 1E behavioral validation closed.** The ten unverified categories get a runnable harness and pass, or their residual risk is Founder-accepted in writing. | 2A multiplies concurrency, retry, and reconciliation surface area by forming teams. Building parallelism on unverified single-owner reliability inverts roadmap §Reliability-before-authority. | Reliability + Founder |
| **P-4** | **Model resolution indirection in place** (thin `ModelResolver` port, registry-backed, no hardcoded model names in orchestration). | Enforces §0.4 before 2H exists; prevents a 2A–2G-wide refactor when 2H lands. | Engineering |
| **P-5** | **Phase 1 deliverables that Phase 2 consumes are complete:** 1F Mission Control Lite, 1G Smart Work Packets, 1H Repository Intelligence + Context Router (incl. "foundation hooks for later Company Knowledge Platform retrieval"), 1I Autonomous Engineering Loop with bounded static decomposition, Context Lifecycle Manager. **Reconciled at this pass:** 1F now has a specialist plan (`SPRINT_1F_MISSION_CONTROL_LITE.md`, 21 work items 1F-0…1F-21) and an authoritative UX specification (`PHASE_1_MISSION_CONTROL_LITE_UX.md`, 16 views). **Corrected v1.1.0:** a **Context Lifecycle Manager specification now exists** — `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0, 3,013 lines). It answers the interface both other artifacts named but declined to define (UX §14.3 CX-1…CX-6; 1F §20.4 I-5), including the context safety bands the UX spec refused to invent (*"A designer-chosen threshold is a fabricated health verdict."*). **A specification is not an implementation:** P-5 remains unmet until the CLM ships. **The CLM is listed here as a distinct Phase 1 deliverable; its sprint assignment is an open Founder decision (D-P7) — see §3.3 and §14.** **Also verified inert today:** `listDependencies()` returns `[]` unconditionally (`dev-task-repository.ts:94`) and `usage` is written `null` unconditionally (`agent-execution-service.ts:81`). | 2A generalizes 1I's static decomposition; 2C attaches to 1H's Context Router hooks; 2D extends 1F's Mission Control; all stages assume Smart Work Packets. **Two new specifics:** 2A-2's decomposition planner needs a working dependency primitive, and `TaskDependency` is declared but inert — so either 1H/1G instruments it or 2A-2 must. And 2E's context-quality and cost metrics have no source until CLM defines the signals (CX-1…CX-6) and `usage` stops being null. | Engineering; **CLM contract unowned — see §18.3** |
| **P-6** | **Deferred 1E-8 / 1E-9 timeline and read-model resolved** (execution timeline + Mission Control data exposure, deferred to 1F per validation report §6). **Owner confirmed at this pass:** the 1F plan claims it — *"Phase 2's P-6 names 1E-8/1E-9 resolution as a Phase 2 precondition; **1F-1 and 1F-2 are that resolution**"* (their I-7). | 2E's canonical event model and 2A's organization views both build on the timeline read-model. **Constraint inherited:** `store.events` is capped at 200 (`store.ts:226`), so the timeline is lossy until P-1 lands — 2E-1 must not be designed against a 200-event window. | 1F workstream (accepted) |
| **P-7** | **ADR-0001 / ADR-0002 invariant amendment decided** — see §1.3. | Blocks 2A-6 and all of 2G. | **Founder (reserved)** |
| **P-8** *(added on HEAD re-check)* | **The simulated → real AI agent transition is planned, ADR'd, and sequenced.** ADR-0001 D4 places real AI agents in Phase 2 (*"provider adapters behind `AgentProvider`"*, Future Considerations). This is **Phase 2 scope, not new scope** — but it belongs to no single stage 2A–2K, so it needs an explicit home. Includes resolving **CR-11 / P-2** (`review-service.ts:485-492` `recordFindings` ordering), which the 1E completion notes label a *"Phase 2 gate… must be resolved before the ADR-0002 'real AI reviewers' work begins."* | Every stage's acceptance criteria presume non-deterministic agents. Specifically: 2A's A11/A12 (*teams outperform single-owner*) is **not evaluable** against ADR-0001 O4's simulated agent, whose outcome is derived deterministically from its input instructions. 2F experience records, 2H benchmarks, 2G collaboration value, and 2I research all measure behavior a simulation does not have. ADR-0001 §Risks already discloses this: *"Simulated agents masking gaps that only real agents will expose in Phase 2."* | Engineering + **Founder (reserved: provider approval, spend)** |
| **P-9** *(added on HEAD re-check)* | **The ADR-recorded "deferred to Phase 2" clauses are assigned to stages.** Inventory: ADR-0001 **D4** real agents → P-8; **D6** per-agent `maxConcurrency > 1` → 2A-3 concurrency governor; **D8** scorecards → 2D/2E (**but see §17.5 conflict**); **O3** department-mapped capability taxonomy → 2A staffing + 2F task classes; ADR-0002 **E8** `WorkItem` promotion and Project → WorkItem → Task rewiring → **2A-1 / 2B-1 (unassigned in this draft — see §17.4)**. | These are approved commitments already in the architecture baseline. A Phase 2 plan that does not account for them will collide with them at the architecture gate. `WorkItem` in particular changes where organization and packet records attach. | Engineering + Founder |

## 1.3 Governance conflict requiring a Founder decision before 2A-6 and 2G

**This is the most consequential finding in this plan.**

ADR-0001 and ADR-0002 both record, as a preserved non-negotiable invariant:

> *"Agents do not primarily communicate directly with each other."* (ADR-0001, Problem
> Statement)
> *"**no direct agent-to-agent communication**"* (ADR-0002, Problem Statement, emphasis
> in original)

Master Roadmap v8.0 §4A ("Controlled Agent Communication"), §10 (2A Communication
Broker), §10 (2G Advanced Collaboration), and §13A ("Communication and Decision
Discipline") require exactly the opposite capability: agents *may* communicate, under
scope, attribution, logging, budget, and mandatory write-back.

These are reconcilable — the roadmap's version is *governed, brokered, non-authoritative*
communication routed through the Work Management Layer, which is arguably not "direct" —
but **the reconciliation is a material deviation from an approved ADR baseline, which
roadmap §2 reserves to the Founder.** An implementation agent must not decide this.

Required: a superseding ADR (or amendment to ADR-0001/0002) that states the boundary
precisely — for example: *agents may exchange structured messages only through the
Communication Broker; broker traffic is durable, attributable, budgeted, and
non-authoritative; no message may change scope, interface, candidate identity, authority,
or approval status; every material outcome becomes a decision record, evidence record, or
knowledge proposal.* Until that ADR is approved, 2A-6 and 2G are **blocked**, and 2A
ships with communication disabled (see 2A §16).

## 1.4 Precondition sequencing

```
P-1 durable persistence ──┐
P-4 model indirection ────┼─> P-5 (1F,1G,1H,CLM,1I) ─> P-2 Phase 1 exit ─> PHASE 2 START
P-3 1E behavioral close ──┤                                                      │
P-6 timeline read-model ──┤                                                      ▼
P-9 ADR-deferral triage ──┘                                        P-8 real-agent transition
                                                                   (ADR-0001 D4 + CR-11/P-2)
                                                                              │
P-7 communication ADR ────────────────────────────────> blocks 2A-6 / 2G       ▼
                                                                   must precede Gate 2A (A11/A12)
```

## 1.5 Precondition severity classification

Requested at integration review. **Hard blocker** = no Phase 2 work of consequence proceeds.
**Mitigatable** = a stated workaround preserves the stage set at some cost. **Reduced-scope**
= Phase 2 can execute a named subset without it.

| ID | Class | Basis | If unmet |
|---|---|---|---|
| **P-0** CLM sprint assignment *(added v1.1.0)* | **DISCLOSURE — not a blocker** | It is a roadmap-authority question about *when* the CLM is built, not *whether*. No Phase 2 stage design depends on the answer | Phase 2 proceeds; §1.2 P-5 and §3.3 stay aligned on "distinct deliverable, sprint assignment open," and the plan continues to depend on the capability rather than the label. **Do not let this plan's internal consistency be read as the decision having been made.** |
| **P-1** persistence | **HARD BLOCKER** *(for 2C/2E/2F/2H)* / **reduced-scope for the rest** | Durability is a property, not a feature; it cannot be added to records that were never written | Run **2A + 2B + 2D only** and remove 2C/2E/2F/2H from the Phase 2 exit package until it lands (RC-1). Do **not** run them on memory and call the gates passed. |
| **P-2** Phase 1 exit | **HARD BLOCKER** | Roadmap §22 prohibits starting before it; this is a governance boundary, not an engineering one | Nothing proceeds. Founder-only. |
| **P-3** 1E behavioral closure | **MITIGATABLE** | A named remediation set now exists as a complete patch specification (`SPRINT_1E_REMEDIATION_PATCH_SPEC.md`, 4 commits, expected end state 22 files / 320 tests) | Founder accepts residual risk in writing, and 2A-9 builds the concurrency/replay harness that 1E lacked. Cost: 2A carries reliability debt it did not create. |
| **P-4** model indirection | **MITIGATABLE (cheap now, expensive later)** | A thin port; no external dependency | Skip and pay a 2A–2G-wide refactor at 2H. Not recommended; the cost ratio is roughly 1:20. |
| **P-5** 1F/1G/1H/CLM/1I | **HARD BLOCKER for 2A, 2C, 2D** / **reduced-scope elsewhere** | 2A generalizes 1I; 2C attaches to 1H; 2D extends 1F | Per missing piece: no 1H → 2C-3 retrieval has no host and 2A-2 has no repository model; no CLM → 2E context metrics stay dark (honest, per Design D5) and 2A long-running organizations have no rollover. **Corrected v1.1.0:** the CLM now has a specification (SPEC-CLM-001 v1.1.0), so the *contract* gap is closed and CR-2 is satisfied; the *implementation* gap is not, and it is the implementation P-5 requires. |
| **P-6** timeline read-model | **MITIGATABLE** | Now owned by 1F-1/1F-2 | 2E-1 derives its own timeline; cost is duplicate derivation and a second source of ordering truth. |
| **P-7** communication ADR | **REDUCED-SCOPE** | Scoped precisely to 2A-6 and 2G | 2A ships with communication disabled and 2G is deferred. Nine of eleven stages are unaffected. Already the plan's default. |
| **P-8** real-agent transition | **HARD BLOCKER for Gate 2A** / mitigatable for 2A-1…2A-8 | ADR-0001 O4's simulated agent derives its outcome deterministically from its input, so A11/A12 measures nothing. Reinforced by `actions.ts:43`, which disables dispatch entirely when `NODE_ENV === "production"`, and by `usage` being written `null` | Build 2A-1…2A-8 against simulations, then **stop at the gate**. Do not sign Gate 2A on simulated evidence. |
| **P-9** ADR-deferral triage | **MITIGATABLE except E8** | D6/D8/O3 are assignable at any point; **E8 (`WorkItem`) determines where 2A's records attach** | E8 unresolved → 2A-1 attaches to `Task` with a documented re-parenting migration (RC-5). Cost: one additive migration. |

**Two hard blockers admit no mitigation at all: P-2 and, for its gate, P-8.** Everything else
has a stated, costed path.

**Why P-8 sits inside Phase 2 rather than before it.** ADR-0001 D4 assigns real agents to
Phase 2, so moving them earlier would relocate Phase 2 scope into Phase 1 — prohibited by
this engagement's constraints and by roadmap Appendix G. P-8 is therefore the first work
inside Phase 2, executed in sprint P2-00 alongside P-1, and it must complete before Gate 2A
because Gate 2A's efficiency comparison cannot be evaluated on deterministic simulations.

---

# 2. Program-level analysis

## 2.1 Phase 2 dependency graph

The approved dependency order is **2A → 2B → 2C → 2D → 2E → 2F → 2G → 2H → 2I → 2J → 2K**
and is preserved throughout this plan. The graph below shows *why* each edge exists —
what the later stage consumes from the earlier one. Solid edges are hard (the later
stage cannot function without the artifact). Dotted edges are soft (the later stage is
materially degraded but can ship a reduced MVP).

```
                    PHASE 1 EXIT (P-1 … P-6)
                              │
                              ▼
                ┌──────────────────────────┐
                │ 2A Adaptive Organization │  packet graph · temporary orgs · review
                │           Engine         │  packets · reconciliation · integration
                └────────────┬─────────────┘  · concurrency governor · budgets
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2B Multi-Project Scaling │  project scoping keys · policy resolution
                └────────────┬─────────────┘  · portfolio · multi-repo change sets
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2C Company Knowledge     │  KnowledgeRecord · retrieval · curator
                │        Platform          │  · proposal pipeline · vault sync
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2D Executive Intelligence│  MetricQuery port (contract) · dashboards
                │   + Founder Interface    │  · recommendations w/ provenance
                └────────────┬─────────────┘
                             │  (2D defines the metric read contract;
                             │   2E implements it — see §2.6 R-2)
                             ▼
                ┌──────────────────────────┐
                │ 2E Engineering           │  canonical event/metric model · health
                │   Intelligence Platform  │  scores · review learning · arch mgmt
                └────────────┬─────────────┘  · statistical validation
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2F Agent Memory &        │  experience records · team memory
                │   Organizational Learning│  · promotion gate · routing advisor
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2G Advanced Collaboration│  sessions · threads · human actors
                └────────────┬─────────────┘  · write-back enforcer
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2H Model Management      │  model registry · benchmarks · versioned
                │        Platform          │  routing · A/B · promotion · rollback
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2I Autonomous Research   │  research plans · citations · experiments
                │   & Architecture Discovery│ · ADR proposals
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2J Interactive AI Pair   │  pair sessions · scratch candidates
                │       Engineering        │  · promotion to governed work
                └────────────┬─────────────┘
                             │
                             ▼
                ┌──────────────────────────┐
                │ 2K Enterprise Production │  gate packs · deployment readiness
                │        Platform          │  · migration/rollback · capability packs
                └────────────┬─────────────┘
                             │
                             ▼
                     PHASE 2 EXIT GATE
```

### 2.1.1 Non-adjacent edges (the real graph is not a chain)

The linear order above is the **gate sign-off order**. The actual consumption graph has
non-adjacent edges, and these are what make wrong-order implementation expensive:

| From | To | Type | What is consumed |
|---|---|---|---|
| 2A | 2E | hard | Organization/packet events are first-class inputs to parallelization and coordination metrics (§21 KPI block 6) |
| 2A | 2F | hard | Team memory records pairings and temporary-organization structures — no orgs, no team memory |
| 2A | 2G | hard | 2G's channels, notices, and decision requests extend the 2A Communication Broker rather than duplicating it |
| 2A | 2K | soft | Gate packs run as review/verification packets inside temporary organizations |
| 2B | 2C | hard | Project scoping keys — knowledge records are project- and repository-scoped from day one |
| 2B | 2E | hard | Metric series are keyed by project; unkeyed series cannot be re-attributed later |
| 2B | 2F | hard | Memory isolation boundaries are project/repository/tenant scoped (§12A "Privacy, boundaries, and deletion") |
| 2B | 2K | hard | Per-project gate bindings and coordinated multi-repo release |
| 2C | 2F | hard | Institutional-knowledge promotion path; Knowledge Curator validates organization-wide lessons (§12A "Learning and promotion rules") |
| 2C | 2I | hard | Research output is retained, superseded, and retrieved as knowledge; without 2C research is write-only |
| 2D | 2E | contract | 2D defines the metric read contract; 2E implements it (see R-2) |
| 2E | 2F | hard | Engineering Intelligence validates statistical claims and routing impact before memory promotion (§12A) |
| 2E | 2H | hard | Benchmark and routing-outcome measurement; safe promotion needs measured baselines |
| 2E | 2K | hard | Gate effectiveness, escaped-defect attribution, release-confidence score inputs |
| 2F | 2H | soft | Per-model, per-provider experience by task class informs routing policy |
| 2G | 2J | hard | Pair sessions are a specialization of collaboration sessions (lead, box, transcript, write-back) |
| 2H | 2I | soft | Research agents select models deliberately; data-policy enforcement matters for external sources |
| 2H | 2J | soft | Interactive sessions bind to an explicitly recorded model version |

## 2.2 Critical path

**Critical path (longest hard-dependency chain to the Phase 2 exit gate):**

```
P-1 durable persistence
  → P-5 (1G Smart Work Packets · 1H Context Router · CLM · 1I Autonomous Loop)
  → P-2 Phase 1 exit gate
  → 2A-1 organization & packet records
  → 2A-2 decomposition planner
  → 2A-3 organization builder + workforce controller + concurrency governor
  → 2A-4 review packet generator + lead reconciliation
  → 2A-5 integration manager
  → 2A-9 adaptive-organization acceptance demonstration (Appendix J)
  → 2B-1 project scoping keys + isolation enforcement
  → 2B-2 project policy resolution + project-aware routing
  → 2C-1 knowledge service + record schema + versioning
  → 2C-3 retrieval integration with Context Router
  → 2C-4 proposal pipeline + Knowledge Curator
  → 2E-1 canonical event/metric model + ingestion
  → 2E-2 health scores / trends / anomalies / forecasts
  → 2E-5 learning proposal + statistical validation
  → 2F-2 agent/role experience records + freshness/decay
  → 2F-4 promotion gate + challenge/correction
  → 2F-5 memory-informed routing + exploration + kill switch
  → 2H-1 model/provider/binding registry
  → 2H-3 versioned routing policy + A/B + shadow evaluation
  → 2H-4 canary promotion + rollback + deprecation
  → 2K-1 gate pack framework + policy floor
  → 2K-3 deployment readiness + migration safety + rollback
  → 2K-6 Phase 2 exit demonstration
```

**Critical-path observations:**

1. **P-1 is the true program bottleneck.** Persistence is a Phase 1 item that gates
   every durable Phase 2 record. It should be resolved first and is the highest-value
   thing to start on today.
2. **2A-1 through 2A-5 are irreducibly sequential.** The packet record must exist before
   the planner can emit packets; packets must exist before review packets can bind to
   them; review packets must exist before reconciliation has inputs; reconciliation must
   exist before integration can gate on a reconciled verdict. No amount of staffing
   compresses this chain.
3. **2E-1 is the second bottleneck.** Once the canonical event model lands, 2E-2…2E-5,
   2F, 2H, and 2K all unblock in quick succession. Every sprint that runs before 2E-1
   while emitting non-canonical events adds migration cost.
4. **2D, 2G, 2I, 2J are off the critical path** for their implementation bulk (2D-2…2D-5,
   2G-1…2G-4, 2I-1…2I-5, 2J-1…2J-4). 2D-1 (the metric read contract) *is* on the path
   because 2E-2 implements it.
5. **The path length is dominated by acceptance demonstrations, not code.** Six stages
   carry an explicit demonstration gate (2A, 2B, 2C, 2E, 2F, 2H) plus the Phase 2 exit.
   These need real workloads, which means they cannot be faked or shortened, and they
   should be scheduled as first-class sprints rather than tacked onto the end of a
   feature sprint.

## 2.3 Recommended sprint breakdown

**Overlap rule (preserves the approved dependency order).** Default execution is
sequential by stage. Implementation of a later stage may overlap an earlier stage
**only** when both hold: (a) the later stage consumes nothing from the earlier stage's
undelivered scope, and (b) **completion gates are still signed in strict 2A→2K order**.
Any overlap that would invert a §2.1.1 hard edge requires explicit Founder overlap
authorization. Sprints marked *Parallel-safe* satisfy (a) as written.

| Sprint | Stage | Work items | Size | Parallel-safe? | Exit |
|---|---|---|---|---|---|
| **P2-00** | Precondition | P-1, P-4, P-6, **P-8, P-9** | XL | No | Durable store live; model indirection in place; timeline read-model exists; **real-agent provider adapters behind `AgentProvider` with CR-11/P-2 resolved; ADR-deferral inventory (D6, D8, O3, E8) assigned to stages** |
| **P2-01** | 2A | 2A-1, 2A-2 | L | No | Organization + packet records, state machines, decomposition planner |
| **P2-02** | 2A | 2A-3 | L | No | Builder, workforce controller, concurrency governor, budgets |
| **P2-03** | 2A | 2A-4 | M | No | Review packet generator + lead reconciliation |
| **P2-04** | 2A | 2A-5, 2A-7 | L | No | Integration manager; parallelization optimizer + org metrics |
| **P2-05** | 2A | 2A-8 | M | Yes (UI) | Mission Control organization views |
| **P2-06** | 2A | 2A-6 | M | Gated on P-7 | Communication broker (blocked until ADR approved) |
| **P2-07** | 2A | 2A-9 | M | No | **Gate 2A** — Appendix J acceptance demonstration |
| **P2-08** | 2B | 2B-1, 2B-2 | L | No | Scoping keys, isolation enforcement, project-aware routing |
| **P2-09** | 2B | 2B-3, 2B-4 | L | No | Cross-project dependencies, portfolio, multi-repo change sets, coordinated release |
| **P2-10** | 2B | 2B-5 | S | No | **Gate 2B** |
| **P2-11** | 2C | 2C-1, 2C-2 | L | No | Knowledge service + versioning; vault sync + conflict model |
| **P2-12** | 2C | 2C-3, 2C-5 | M | No | Retrieval via Context Router; automatic documentation after approved completion |
| **P2-13** | 2C | 2C-4 | L | No | Proposal pipeline, Knowledge Curator, curation engines |
| **P2-14** | 2C | 2C-6 | S | No | **Gate 2C** |
| **P2-15** | 2D | 2D-1 | M | No | Metric read contract + Founder Dashboard (Stage 2) |
| **P2-16** | 2D | 2D-2, 2D-3 | L | Yes (after 2D-1) | Planning/capacity/forecast/scenarios; Executive Dashboard (Stage 3) |
| **P2-17** | 2D | 2D-4, 2D-5 | M | No | Risk-aware delegated acceptance; **Gate 2D** |
| **P2-18** | 2E | 2E-1 | L | No | Canonical event/metric model + ingestion + rollups |
| **P2-19** | 2E | 2E-2 | L | No | Health scores, trends, anomalies, root cause, forecasts (implements 2D-1 port) |
| **P2-20** | 2E | 2E-3, 2E-4 | L | Yes (parallel to each other) | Review Learning Engine; Continuous Architecture Management |
| **P2-21** | 2E | 2E-5, 2E-6 | M | No | Learning proposals + statistical validation; **Gate 2E** |
| **P2-22** | 2F | 2F-1, 2F-2 | L | No | Memory classes, execution memory, experience records, freshness/decay |
| **P2-23** | 2F | 2F-3, 2F-4 | M | No | Team memory; promotion gate; challenge/correction |
| **P2-24** | 2F | 2F-5, 2F-6 | L | No | Memory-informed routing + exploration + kill switch; privacy/retention/deletion |
| **P2-25** | 2F | 2F-7 | M | No | **Gate 2F** |
| **P2-26** | 2G | 2G-1, 2G-2 | L | No | Channels/notices/broadcasts; session manager + write-back enforcer |
| **P2-27** | 2G | 2G-3, 2G-4 | M | No | Human participation + independence guard; **Gate 2G** |
| **P2-28** | 2H | 2H-1, 2H-2 | L | No | Model/provider/binding registry, model cards; benchmark + eval harness |
| **P2-29** | 2H | 2H-3, 2H-4 | L | No | Versioned routing, A/B, shadow eval; canary promotion, rollback, deprecation |
| **P2-30** | 2H | 2H-5 | M | No | **Gate 2H** |
| **P2-31** | 2I | 2I-1, 2I-2 | M | Yes | Research question/plan, citation integrity, alternatives/tradeoffs |
| **P2-32** | 2I | 2I-3, 2I-4, 2I-5 | L | No | Sandboxed experiments; ADR proposal generator; **Gate 2I** |
| **P2-33** | 2J | 2J-1, 2J-2 | L | Yes | Pair session runtime, scratch candidates, explain/trace/compare |
| **P2-34** | 2J | 2J-3, 2J-4 | M | No | Promotion to governed work; **Gate 2J** |
| **P2-35** | 2K | 2K-1, 2K-2 | XL | No | Gate pack framework + policy floor; gate implementations |
| **P2-36** | 2K | 2K-3, 2K-4 | L | No | Deployment readiness, migration safety, rollback; observability packs, release readiness |
| **P2-37** | 2K | 2K-5 | M | No | Capability pack registry + per-project bindings |
| **P2-38** | 2K | 2K-6 | L | No | **Phase 2 exit demonstration** (Appendix B) |

**Self-hosting note.** From Gate 2A onward, Phase 2 should build itself using the
capability it just shipped — 2B onward is decomposed and reviewed by temporary
organizations; 2E onward is measured by Engineering Intelligence; 2K gate packs run on
Phase 2's own candidates. This is the roadmap's §22 acceleration strategy ("Adopt each
stable HQ capability as soon as it can safely accelerate the next capability") and it is
also the honest test of each stage. It is *not* a licence to skip gates on the theory
that the tooling is new.

## 2.4 Parallelizable planning work

Planning artifacts have far weaker dependencies than implementations. The following can
be produced concurrently, before or during early Phase 2, **without** violating the
dependency order — because a plan is not a state transition.

| Parallel planning track | Artifacts | Depends only on | Owner role |
|---|---|---|---|
| **Schema design** | Domain model drafts for all 11 stages; field-level review; migration strategy | Roadmap appendices C/D/H/I; existing `types/domain/*` | database-architect, data-engineer |
| **ADR drafting** | The ~21 ADR candidates in §2.5, as drafts with options and tradeoffs | Roadmap; ADR-0001/0002 | architecture-reviewer (review), lead-software-engineer (author) |
| **Interface/contract design** | `types/contracts/*` signatures for all stages | Existing contract conventions | lead-software-engineer |
| **Security & authority model** | Authority matrix across all Phase 2 record types; credential scoping; isolation proof obligations | Roadmap §17, §2 | security-engineer |
| **Observability specification** | Canonical event vocabulary, metric definitions, health-score formulas (spec only — implementation is 2E-1) | Roadmap §21; `OBSERVABILITY_STANDARD.md` | observability-engineer |
| **Acceptance test design** | Test plans for all 11 stage gates, incl. Appendix J tests | Roadmap Appendix J/B | qa-engineer, reliability-engineer |
| **Research (2I content, not 2I system)** | Prior-art research for vault sync, metric stores, decay models, eval harnesses | Nothing | research-analyst |
| **UX specification** | Founder Dashboard (Stage 2), Executive Dashboard (Stage 3), organization views, knowledge browsing, pair surface | 1F Mission Control Lite | claude-design |
| **Founder decision packets** | The ~40 decisions in §3–§13, packaged with options, recommendations, and impact | This plan | Director of Operations |
| **Knowledge vault structure** | Vault directory scaffold per roadmap §11 canonical structure, empty | Roadmap §11 | Knowledge Curator role |

**Recommended immediate action:** run the ADR drafting track and the schema design track
in parallel with the P-1 persistence work. They have no dependency on it and they are the
long-lead items that otherwise stall 2A-1.

## 2.5 Non-parallelizable implementation work

These must be serialized. Attempting to parallelize them produces rework, not speed.

| # | Serialized chain | Why it cannot be parallelized |
|---|---|---|
| 1 | **P-1 persistence → any Phase 2 record** | Every stage's tables and adapters are written against the chosen backend's transaction and constraint semantics. Writing them twice is the cost of getting this wrong. |
| 2 | **2A-1 record model → 2A-2 planner → 2A-3 builder → 2A-4 review packets → 2A-5 integration** | Each consumes the previous stage's identity model. A planner cannot emit packets whose identity contract does not exist; reconciliation cannot bind to review packets that do not exist. |
| 3 | **2A concurrency governor → any multi-worker execution** | Concurrency, cancellation, backpressure, fairness, and starvation prevention are a single coherent mechanism. Shipping workers before the governor means shipping an unbounded fan-out. |
| 4 | **2B-1 scoping keys → 2C, 2E, 2F record creation** | A record created without a project/tenant scope key cannot be safely re-scoped later — you cannot retroactively determine which project a knowledge note or metric sample belonged to. This is the single most expensive retrofit in Phase 2. |
| 5 | **2E-1 canonical event model → 2E-2…2E-5, 2F, 2H, 2K analytics** | Metrics must trace to authoritative events (roadmap §12). Two event vocabularies means two ingestion paths and irreconcilable history. |
| 6 | **2E-5 statistical validation → 2F-4 promotion gate** | §12A requires Engineering Intelligence to validate statistical claims before memory becomes an expertise claim. Reversing this ships unvalidated reputation. |
| 7 | **2C-4 Knowledge Curator → 2F institutional promotion** | §12A assigns organization-wide lesson validation to the Curator. Without it, 2F would promote doctrine unreviewed — explicitly prohibited (§22). |
| 8 | **2F-5 routing advisor → any memory-influenced routing** | The kill switch and exploration controller must exist *in the same change* as the advisor, or the first bad memory is unrollbackable in practice. |
| 9 | **2H-1 binding registry → 2H-3 routing policy → 2H-4 promotion/rollback** | You cannot A/B a binding that has no versioned identity, and you cannot roll back a promotion with no recorded prior state. |
| 10 | **2K-1 gate pack framework + policy floor → 2K-2 individual gates** | Gates written before the framework encode their own enable/disable semantics, which is how a policy floor gets bypassed. |
| 11 | **All stage acceptance demonstrations** | A demonstration proves the integrated system on real work. It is inherently last within its stage. |

## 2.6 Risks of implementing capabilities in the wrong order

Ordered by severity. Each risk names the inversion, the concrete failure, and the cost of
recovery.

| ID | Inversion | Concrete failure | Recovery cost |
|---|---|---|---|
| **R-1** | **Any Phase 2 stage before P-1 durable persistence** | Organizations, knowledge, metrics, memory, and model bindings vanish on process restart. Acceptance gates that require *"quality-adjusted outcomes on repeated task classes"* (2F) or *"trends, anomalies, forecasts"* (2E) are unprovable — you cannot measure history you did not keep. | **Catastrophic.** Every stage's persistence layer rewritten; all accumulated evidence lost. This is the reason P-1 is precondition #1. |
| **R-2** | **2D before 2E (as the approved order specifies)** | 2D promises *"traceable recommendations"*, forecasting, bottleneck detection, and budget optimization — all of which need a metric platform that 2E has not built yet. Naively implemented, 2D grows its own ad-hoc metric computation, which 2E then duplicates or contradicts, producing two sources of numeric truth in the Founder's own dashboard. | **Moderate, and avoidable by design.** **Mitigation (recommended, no order change):** 2D-1 ships a `MetricQuery` / `MetricSnapshot` *read port* plus a deliberately thin projection over Phase-1 authoritative events and 2A/2B records. 2E-2 replaces the implementation behind the identical port. 2D never computes a metric it owns. Record this in an ADR so the constraint is enforceable at the architecture gate. |
| **R-3** | **2C, 2E, or 2F record creation before 2B-1 scoping keys** | Knowledge notes, metric samples, and experience records are written without project/tenant scope. Later, cross-project leakage is possible and un-auditable: the Context Router can retrieve another project's knowledge, and agent reputation earned in one repository silently routes work in another. §12A explicitly requires isolation "by organization, tenant, project, repository, and authority scope." | **High.** Backfill is impossible for records whose provenance no longer identifies a project. The honest remedy is deleting the unscoped corpus — losing exactly the accumulated history these stages exist to build. |
| **R-4** | **2F before 2E** | Memory promotes claims that no one validated statistically. A single success or a reviewer's opinion becomes a durable expertise claim — the precise outcome §12A prohibits. Routing then self-reinforces: the agent chosen because of a lucky sample accumulates more samples. | **High and insidious.** Unwinding requires invalidating the experience corpus and every routing decision that cited it. Detection is hard because the system reports improving confidence while calibration degrades. |
| **R-5** | **2F before 2C** | Recurring patterns become organization-wide doctrine with no Knowledge Curator to validate, generalize, or supersede them. Violates §22 (*"Publishing unvalidated chat summaries as institutional knowledge"*) and §12A promotion rules. | **High.** Doctrine, once retrieved into work packets, changes engineering behavior; retracting it requires auditing every packet that cited it. |
| **R-6** | **2G or 2A-6 before the P-7 communication ADR** | Agents communicate under an invariant that two approved ADRs forbid. Any resulting scope, interface, or authority change is unrecorded — §22's *"Allowing direct agent communication to create unrecorded scope, architecture, authority, or candidate changes."* | **High + governance breach.** Work performed under it is of uncertain authority and may need to be re-reviewed or discarded. |
| **R-7** | **2B before 2A** | Multi-project scale with no organization engine means ad-hoc agent spawning across repositories with no global budget, concurrency governor, or integration ownership. Roadmap §10 states 2A comes first precisely *"so later multi-project, knowledge, intelligence, collaboration, model, research, and production systems can scale through deliberate temporary teams rather than ad-hoc swarms."* | **High.** Twenty active initiatives exhaust provider capacity simultaneously (§13A Economic Control). Retrofitting a governor onto live uncontrolled fan-out is an incident, not a refactor. |
| **R-8** | **2H before 2E/2F** | Model choices are made without measured baselines. Promotion cannot be canaried against a known-good comparison, rollback has no evidence of regression, and the platform drifts toward whichever model was bound first. This is the exact mechanism by which a model becomes permanently bound to a role in practice while remaining nominally replaceable. | **Moderate–high.** Directly threatens the §0.4 model-neutrality requirement. |
| **R-9** | **2K before 2E** | Gates ship with no effectiveness measurement: no escaped-defect attribution, no false-positive rate, no review ROI. Gates then get tuned by anecdote, and the usual outcome is that a noisy gate is disabled rather than fixed. | **Moderate.** Wasted gate work plus a weakened policy floor. |
| **R-10** | **2I before 2C** | Research output has no governed home. The same question is researched repeatedly; contradictory findings coexist with no supersession; citations rot. | **Moderate.** Duplicate cost, low retention. |
| **R-11** | **2J before 2G** | Interactive edits have no session, transcript, budget box, or mandatory write-back — so exploration produces ungoverned repository changes. Violates §22 (*"Allowing restored sessions to modify code before verification"* in spirit, and write-back discipline directly). | **Moderate–high.** Ungoverned changes in a repository that the whole system treats as implementation truth. |
| **R-12** | **2A hierarchical mode before 2A parallel-team mode is measured** | Roadmap §4A stages this deliberately: late Phase 1 static decomposition → early Phase 2 dynamic formation → mid Phase 2 communication → **late Phase 2** hierarchical teams. Building hierarchy first means coordination overhead is unmeasured, and §13A's *"optimizes quality-adjusted completion—not maximum concurrency"* cannot be honored. | **Moderate.** Wasted complexity; likely rebuild after optimizer data arrives. |
| **R-13** | **Any acceptance demonstration deferred to the end of Phase 2** | Eleven unproven stages integrate at once. Failure attribution becomes impossible and the Phase 2 exit gate (Appendix B) cannot be assembled from evidence. | **High.** Effectively restarts validation. Mitigation: gate every stage, as §2.3 does. |

## 2.7 Major architectural decisions likely to require ADRs

This is a list of **proposed ADR subjects**, in dependency order. It reserves no numbers.

> **C-2 RESOLVED — Founder decision, 2026-07-26 *(recorded v1.1.0)*.**
> **ADR numbers are assigned centrally. Specialists may propose ADR subjects but must NOT
> reserve or claim numbers independently.** This applies to every workstream without
> exception, including this one.
>
> **What this corrects in the v1.0.0 draft.** That draft observed the Sprint 1F workstream's
> ADR-0003 claim and yielded to it by declaring *"Phase 2 ADRs number from ADR-0004."*
> Yielding was the right instinct — deferring rather than colliding — but the conclusion was
> still a numbering claim, and under this decision **no workstream makes one.** The
> ADR-0004 claim is **withdrawn**, along with the derived statements in §17.5 C-2, §17.11
> item 3, §18.1 item 3, §18.5, and §18.8 item 9, each corrected in place. Sprint 1F is
> being corrected the same way for its ADR-0003 claim; that is their workstream's
> correction to make, not this plan's, and this plan no longer relies on it either way.
>
> **What survives unchanged.** The **subjects**, the **dependency ordering** between them,
> the **Blocking / High / Medium** priorities, and the **which-must-be-approved-first**
> analysis below. None of that ever depended on a number. The `P2-A01…P2-A23` keys in the
> first column are **plan-local cross-reference handles only** — they exist so §3–§18 can
> point at a row, they are not ADR identifiers, they carry no ordering claim against any
> other workstream's ADRs, and they are replaced by the centrally assigned number on
> approval. Where this document elsewhere writes "ADR #7" or "ADR #12," read the
> corresponding `P2-A07` / `P2-A12` handle.
>
> **Three subjects the original list did not carry** are added below: **persistence /
> durable backend** (P-1, owner unassigned — X-3), **real AI agent provider adapters and
> the simulated→real transition** (P-8), and **`WorkItem` promotion** (ADR-0002 E8, P-9).
> The persistence subject is not this plan's to propose beyond stating the requirement; it
> belongs to the persistence workstream.

Each candidate is listed with the specific question it must settle.

| Handle | Proposed ADR subject | Core question | Stage | Priority |
|---|---|---|---|---|
| **P2-A00** | **Persistence and the durable backend** *(added; not this plan's to own)* | Backend choice, migration path, forward-port of 1C-B past 1D/1E, the five missing adapters, CAS semantics, scoping enforcement point | P-1 / P2-00 | **Blocking — owner unassigned (X-3)** |
| **P2-A01** | **Governed agent communication and the ADR-0001/0002 invariant amendment** | What exactly may agents exchange, through what broker, and what may never change as a result? | P-7 / 2A-6 / 2G | **Blocking** |
| **P2-A02** | **Temporary organization and work-packet model** | Identity, lifecycle states, permitted transitions, packet graph representation, interface declarations, dissolution semantics | 2A-1 | **Blocking** |
| **P2-A03** | **Packet concurrency, leasing, backpressure, and emergency serialization** | How concurrency limits, fairness, starvation prevention, cancellation, and forced serialization compose with the existing 1D/1E lease model | 2A-3 | **Blocking** |
| **P2-A04** | **Review packet authority and lead reconciliation** | Why packet approval is not candidate approval; how a lead's single recommendation is produced and what invalidates it | 2A-4 | **Blocking** |
| **P2-A05** | **Integration ownership and candidate convergence** | Deterministic merge order, interface verification, conflict policy, candidate-freeze rules, rollback of failed parallel work | 2A-5 | High |
| **P2-A06** | **Parallelization economics** | What "quality-adjusted value" means numerically; when HQ must refuse to parallelize | 2A-7 | Medium |
| **P2-A07** | **Project isolation and the scoping key model** | The canonical scope tuple (organization/tenant/project/repository/environment); deny-by-default enforcement point; explicit cross-project grants | 2B-1 | **Blocking** |
| **P2-A08** | **Cross-project dependencies and coordinated release** | Dependency semantics across repositories; partial-failure and abort behavior; deadlock detection | 2B-3/4 | High |
| **P2-A09** | **Knowledge service authority vs. Obsidian vault** | Which fields are service-owned vs. human-editable; bidirectional sync conflict resolution; why the vault is an interface and not the brain | 2C-1/2 | **Blocking** |
| **P2-A10** | **Knowledge proposal, promotion, supersession, and retention governance** | Who may propose/validate/approve/publish/supersede/archive/delete; what may never be auto-promoted | 2C-4 | High |
| **P2-A11** | **Metric read contract and recommendation provenance** | The 2D↔2E seam (R-2); the rule that recommendations never mutate state; how predictions are labeled | 2D-1 | **Blocking** |
| **P2-A12** | **Canonical event and metric model** | Event vocabulary, schema evolution, idempotent ingestion, rollup strategy, retention, traceability to candidate identity | 2E-1 | **Blocking** |
| **P2-A13** | **Architecture graph, drift detection, and scorecards** | How the graph is derived and invalidated; what constitutes a boundary violation; who may accept architecture debt | 2E-4 | High |
| **P2-A14** | **Agent memory classes, decay, and authority boundaries** | The four memory classes; decay/freshness math; the hard rule that memory is advisory only; prohibition on hidden reputation | 2F-1/2 | **Blocking** |
| **P2-A15** | **Memory-informed routing: exploration, reversibility, and kill switch** | Exploration policy against lock-in; independence preservation in reviewer assignment; rollback mechanism and trigger conditions | 2F-5 | **Blocking** |
| **P2-A16** | **Memory privacy, retention, correction, export, and deletion** | Isolation enforcement, challenge/correction lineage, deletion semantics vs. audit requirements | 2F-6 | High |
| **P2-A17** | **Collaboration session authority and the independence guard** | Session authority as the intersection of participants' grants; what a session may never change; when a required reviewer may not participate | 2G-2/3 | High |
| **P2-A18** | **Model registry, versioned routing policy, and binding revocability** | The §0.4 enforcement mechanism: binding records, expiry, approval, revocation, and the ban on hardcoded model references | 2H-1/3 | **Blocking** |
| **P2-A19** | **Model promotion, rollback, deprecation, and data-policy enforcement** | Canary criteria, promotion authority (L4/L5), rollback triggers, per-model data policy and where it is enforced | 2H-4 | High |
| **P2-A20** | **Research sandbox, network egress, and citation integrity** | Outbound egress policy, secret-leakage prevention in queries, source licensing, experiment isolation, citation freshness | 2I-1/3 | High |
| **P2-A21** | **Pair-session scratch candidates and promotion to governed work** | Where interactive edits live, why they are not commits, and what promotion requires | 2J-1/3 | High |
| **P2-A22** | **Quality gate pack versioning and the policy floor** | Gate definition versioning, per-project binding, the minimum floor no project may drop below, break-glass with audit | 2K-1 | **Blocking** |
| **P2-A23** | **Migration and rollback safety** | Forward/backward compatibility requirements, rehearsal obligation, roll-forward vs. rollback decision authority | 2K-3 | High |

**Subjects that must have an approved ADR before Phase 2 implementation starts:** governed
agent communication (**P2-A01**), the temporary organization and work-packet model
(**P2-A02**), packet concurrency (**P2-A03**), project isolation and the scoping key
(**P2-A07**), the canonical event and metric model (**P2-A12**), and agent memory classes
(**P2-A14**) — because P2-A02/P2-A03 define 2A's identity model, P2-A07 defines the scope
key every later record needs, P2-A12 defines the event vocabulary every later stage emits,
P2-A14 defines the memory authority boundary, and P2-A01 unblocks communication. Deferring
the scoping key or the event model is what produces the R-3 and R-5 retrofits. **P2-A00
(persistence) sits ahead of all six** and is not this plan's to write. **Numbers for all
seven are assigned centrally on approval; this list proposes subjects and their order, and
nothing more.**

## 2.8 Minimum viable version vs. mature version — all stages

Read this table as the scope-cutting instrument for the program. The MVP column is what
must exist to sign the stage gate and unblock the next stage. The mature column is the
roadmap's full promise, reached by deepening without violating architecture (§22:
*"Deliver minimum complete capabilities first and deepen them without violating
architecture"*).

| Stage | Minimum viable version (gate-sufficient) | Mature version (roadmap-complete) |
|---|---|---|
| **2A** Adaptive Organization Engine | Single-owner, small-team, and parallel-team modes. Static-to-dynamic decomposition on a declared subsystem taxonomy. Conservative fixed concurrency caps. Review packets by subsystem with one lead reconciler. One integration owner, deterministic merge order. Communication **disabled** (pending P-7). Speedup/cost measured, not yet optimized. | Hierarchical mode (chief lead + subsystem leads + specialists). Adversarial review mode. Learned decomposition from repository topology and change coupling. Predictive parallelization optimizer with regret minimization. Provider-aware adaptive concurrency, fairness, and starvation prevention. Full organization template library (implementation, review, research, incident, migration, cross-repository). Governed communication broker. |
| **2B** Multi-Project Scaling | Two projects, hard scope isolation enforced at the persistence and API boundary, per-project budgets and quality-gate bindings, project-aware routing. Cross-project dependencies as declarative blocking records. | Portfolio planning across many repositories and products, multi-repository atomic change sets, coordinated multi-repo releases with per-repo rollback, per-project roadmaps and health scores, capacity arbitration across the portfolio. |
| **2C** Company Knowledge Platform | Canonical knowledge service with the Appendix D record schema, versioning, provenance, and supersession. One-way service→vault publication plus manual vault→service proposal intake. Retrieval wired into the 1H Context Router with freshness and scope filtering. Curator validates proposals; contradiction detection against ADRs. | Full bidirectional vault sync with conflict resolution. Automatic documentation after every approved completion (feature docs, architecture, APIs, schemas, runbooks, diagrams, changelog, onboarding). Semantic retrieval with measured precision. Effectiveness measurement closing the loop on whether retrieved knowledge improved outcomes. Automated staleness, dead-link, low-value, and missing-ownership curation sweeps. |
| **2D** Executive Intelligence + Founder Interface | `MetricQuery` read port with a thin projection (R-2 mitigation). Founder Dashboard (Stage 2): quality, velocity, risk, cost, architecture, context, autonomous readiness — all labeled with source and freshness. Prioritization and capacity recommendations with explicit provenance. | Executive Dashboard (Stage 3): forecasts with confidence intervals, scenario simulation, staffing and routing recommendations, budget optimization, bottleneck root-cause. Risk-aware delegated acceptance rules the Founder tunes directly. Authority-expansion recommendations backed by autonomous-readiness evidence. |
| **2E** Engineering Intelligence Platform | Canonical event model with idempotent ingestion. Core KPI set from §21 blocks 1–3. Six health scores computed deterministically with recorded inputs. Review Learning tracking finding validity, remediation cost, re-review outcome, and escaped defects. Architecture graph with cycle, layer-violation, and coupling detection. Learning proposals that require validation and cannot auto-apply. | Anomaly detection, root-cause hypotheses, forecasting with confidence and stated assumptions, full §21 KPI coverage including parallelization, memory, knowledge, and cost-per-outcome. Architecture scorecards with evidence-backed remediation proposals. Continuous recalibration of predictions against outcomes. |
| **2F** Agent Memory & Organizational Learning | The four memory classes as distinct records. Execution memory recorded automatically. Agent/role experience records with sample size, confidence, freshness, and decay. Evidence-backed promotion gate. Challenge and correction workflow with lineage. Routing advisory that is **off by default**, explainable per decision, and killable in one action. | Team memory with pairing value and coordination-overhead attribution. Calibrated confidence by task class. Contradiction and supersession automation. Exploration controller that provably prevents lock-in. Memory-informed team formation, packet guidance, mentoring, and escalation. Harmful-memory detection with automatic quarantine. Full retention/export/deletion governance. |
| **2G** Advanced Collaboration | Structured messages in four kinds (question, dependency notice, evidence broadcast, decision request), durable and attributable. Time- and budget-boxed sessions with a named lead, transcript, and enforced write-back. Independence guard blocking policy-prohibited participation. | Human actors as first-class participants sharing work items, evidence, permissions, decisions, and audit model. Threads, mentions, shared workspaces, notifications. Mixed human-agent temporary organizations. Conflict escalation with evidence-based resolution. Measured collaboration value feeding 2E and 2F. |
| **2H** Model Management Platform | Provider/model/version registry with model cards and data-policy fields. **Binding registry with expiry and revocation** (the §0.4 enforcement point). Benchmark harness over planning, coding, review, architecture, research, restoration, and tool use. Versioned routing policy resolved at runtime. | Controlled A/B tests, shadow evaluation, canary promotion with automatic rollback triggers, deprecation lifecycle with migration windows, cost/latency/reliability telemetry per binding, per-project and per-task-class routing policies, structured-output quality scoring. |
| **2I** Autonomous Research & Architecture Discovery | Research question and plan records. Primary-source acquisition with captured citations, freshness, and access limitations. Alternatives and tradeoffs with explicit uncertainty and contradictions. ADR proposal generation. Research review gate before any implementation depends on it. | Reproducible sandboxed experiments with variance reporting. Repository-constraint extraction from 2E's architecture graph. Prior-art and standards sweeps with coverage claims. Automatic supersession of stale research. Proof plans that become the acceptance criteria of the implementing work item. |
| **2J** Interactive AI Pair Engineering | Session runtime with open, explain, and trace. Edits accumulate in a checkpointed scratch candidate that is never a commit. Promotion path that creates a normal governed work item with normal gates. | Refactor, test-authoring, and approach-comparison surfaces. Trace explorer over 2E events and the execution timeline. Multi-participant pair sessions. Promotion that carries the exploration transcript as evidence. |
| **2K** Enterprise Production Platform | Versioned gate-pack framework with a policy floor no project may drop below. Blocking gates for secret scanning, dependency scanning, security, and accessibility. Deployment readiness checklist with artifact identity. Migration rehearsal and rollback plan required for schema change. | Full gate set incl. privacy, performance, SEO. Rollback orchestration with proven execution. Observability packs bound per project. Release Confidence score feeding the Founder Dashboard. Reusable environment, CI/CD, infrastructure, and operational capability packs with install records and version pinning. |

---

# 3. Stage 2A — Adaptive Organization Engine

*Roadmap authority: §10 (2A), §4A, §13A, Appendix H, Appendix I, Appendix J.*

## 3.1 Purpose

Convert adaptive orchestration from a workflow-selection heuristic into a governed
**organization-forming capability**: decompose large work into a dependency-aware packet
graph, staff a temporary organization sized to the work, coordinate it under budget and
concurrency control, reconcile distributed review into one recommendation, converge
parallel implementation into one verified candidate, and retire the organization with
recorded outcomes.

2A exists first because it is the mechanism by which the remaining ten stages get built
at all. Roadmap §10: *"The sequence first creates an Adaptive Organization Engine so
later multi-project, knowledge, intelligence, collaboration, model, research, and
production systems can scale through deliberate temporary teams rather than ad-hoc
swarms."*

## 3.2 Entry criteria

- P-1 (durable persistence), P-2 (Phase 1 exit gates), P-3 (1E behavioral closure),
  P-4 (model indirection), P-5 (1G/1H/CLM/1I), P-6 (timeline read-model) all satisfied.
- 1I's **bounded static decomposition** is operational and exercised: subsystem packets,
  explicit interfaces, one integration owner, conservative concurrency limits, and
  single-lead reconciliation for parallel review. 2A generalizes this; it does not invent
  it from nothing.
- ADRs §2.7 #2 (organization/packet model) and #3 (concurrency/leasing) approved.
- Founder decisions D-2A-1 (concurrency ceilings), D-2A-2 (authorized organization
  types), D-2A-4 (independence rules for leads and integration owners) recorded.
- The existing lease/heartbeat/reclaim mechanism (ADR-0001 O5, `EXECUTION_LEASE_TTL_MS`,
  `EXECUTION_CLAIM_DEADLINE_MS`) has documented semantics that the concurrency governor
  can compose with rather than replace.

## 3.3 Dependencies

| Depends on | For |
|---|---|
| Work Management Layer (1A) | Durable state authority; organizations and packets are Work Management records, not orchestrator state |
| Execution Manager + Agent Registry (1D, ADR-0001) | Assignment, atomic claim/release, lease, heartbeat, stale reclaim, retry budget |
| Review / escalation / evidence / event subsystems (1E, ADR-0002) | Review packets extend `Review`; reconciliation consumes `ReviewFinding`; org failures escalate |
| Smart Work Packets (1G) | The packet *content* generator; 2A owns the packet *graph*, not the packet body |
| Repository Intelligence (1H) | Subsystem clustering, change coupling, dependency graph, hotspots — the inputs to decomposition |
| Context Router (1H) | Per-packet minimum-complete context with least privilege |
| **Context Lifecycle Manager** — *a distinct Phase 1 deliverable; sprint assignment is an open Founder decision (P-0 / D-P7)* | Per-worker checkpointing and rollover; a long organization outlives sessions. **Contradiction resolved as an escalation, not as an answer *(v1.1.0)*.** The v1.0.0 draft wrote this row as *"Context Lifecycle Manager **(1G/1H)**"*, which attributed the CLM to a sprint and therefore contradicted §1.2 P-5, where it is listed as a **distinct deliverable** coordinate with 1F/1G/1H/1I. `SPEC-CLM-001` §14.1 identified that contradiction, **declined to resolve it** — sprint assignment is roadmap authority and the roadmap must not be modified — and **recommended** (labeled a recommendation, not a decision) keeping the CLM a distinct deliverable **sequenced between 1G and 1H**. **This plan takes the same position and for the same reason: it does not have the authority to assign a sprint, so it does not assign one.** The `(1G/1H)` attribution is **withdrawn** and this row now says exactly what §1.2 P-5 says. The two statements are consistent; the underlying question is **open and carried to the Founder** at §1.2 P-0, §14 D-P7, and §18.6. Roadmap §6's wording — the CLM is *"introduced across the 1G/1H boundary and completed before 1I is approved for long-running autonomous operation"* — is quoted here as the roadmap's own framing, **not** as this plan's resolution of the question; it constrains the answer without supplying it. **2A's dependency is on the capability, not on its sprint label**, so no 2A design element changes whichever way the Founder decides. |
| Model resolution indirection (P-4) | Per-packet model selection without hardcoded model names (§0.4) |

## 3.4 Required systems

| System | Responsibility |
|---|---|
| **Work Decomposition Planner** | Dependency graphing, subsystem clustering, interface extraction, critical-path detection, packet sizing, and explicit identification of non-parallelizable work. Consumes 1H Repository Intelligence. Groups by subsystem/responsibility/interface/review lens/evidence domain — **file count is an input, never the rule** (§4A). |
| **Temporary Organization Builder** | Selects single-owner / small-team / parallel-team (MVP) or hierarchy (mature) from risk, complexity, capability, cost, latency, and deadline. Emits the Appendix H Team Formation Contract. |
| **Dynamic Workforce Controller** | Create, queue, pause, resume, rebalance, retire assignments within per-packet, per-project, and global budgets. Workers are temporary capacity; role definitions stay stable (§4A). |
| **Concurrency Governor** | Conservative default limits, provider-aware concurrency, cancellation, backpressure, fairness, starvation prevention, emergency serialization. Composes with the existing lease model rather than duplicating it. |
| **Review Packet Generator** | Subsystem- or lens-scoped review packets bound to **one stable candidate**, with explicit reviewed and unreviewed scope (Appendix I). |
| **Lead Reconciliation Engine** | Merge findings, deduplicate, resolve conflicts, detect cross-packet risks, validate coverage, produce the single consolidated recommendation and the re-review impact map (Appendix I). |
| **Integration Manager** | Shared interface registry, deterministic merge order, candidate convergence, conflict resolution, end-to-end proof, rollback of failed parallel work. |
| **Parallelization Optimizer** | Predicts and measures speedup, token cost, coordination overhead, duplicated work, risk, diminishing returns, and parallelization regret. |
| **Communication Broker** | Structured questions, dependency notices, evidence sharing, decision requests, bounded direct sessions with complete write-back. **Disabled in MVP pending P-7.** |
| **Organization Template Registry** | Versioned templates for implementation, review, research, incident, migration, and cross-repository programs. |
| **Organization Lifecycle Service** | State machine, stop conditions, dissolution criteria, outcome recording, closeout. |

## 3.5 Required data models

Following `types/domain/*` conventions. Appendix H and I are the authoritative field
lists; this is the structural decomposition.

| Model | Key fields |
|---|---|
| `TemporaryOrganization` | `id`, `type`, `objective`, `parentGoalId`, `projectId`, `repositoryIds[]`, `candidateId?`, `leadActorId`, `integrationOwnerId`, `createdByActorId`, `policyVersion`, `state`, `stopConditions`, `dissolutionCriteria`, `createdAt`, `dissolvedAt?` |
| `OrganizationState` | `forming | staffed | executing | integrating | reviewing | reconciling | converged | failed | cancelled | dissolved` |
| `OrganizationTemplate` | `id`, `version`, `type`, `defaultStructure`, `defaultReviewPlan`, `defaultBudgets`, `defaultConcurrency`, `status` |
| `WorkPacket` | `id`, `organizationId`, `title`, `subsystem`, `responsibility`, `scopeIncluded`, `scopeExcluded`, `smartWorkPacketId` (1G body), `upstreamAssumptions[]`, `downstreamConsumers[]`, `integrationOrder`, `budget`, `deadline`, `state`, `assignmentId?`, `attemptCount` |
| `PacketState` | `planned | queued | assigned | executing | blocked | returned | verified | failed | cancelled | superseded` |
| `PacketDependency` | `id`, `fromPacketId`, `toPacketId`, `kind: blocks | interface | data | ordering`, `rationale` |
| `PacketInterface` | `id`, `organizationId`, `name`, `ownerPacketId`, `consumerPacketIds[]`, `contractRef`, `version`, `frozenAt?` |
| `ConcurrencyGroup` | `id`, `organizationId`, `name`, `maxConcurrent`, `mutationTargets[]`, `serializedAt?`, `serializationReason?` |
| `OrganizationBudget` | `id`, `scope: packet | organization | project | global`, `tokenCeiling`, `costCeiling`, `wallClockCeiling`, `consumed`, `reservationState` |
| `ReviewPacket` | `id`, `organizationId`, `candidateId`, `lens`, `subsystem?`, `scopeIncluded`, `scopeExcluded`, `filesInScope[]`, `interfaceIds[]`, `adrRefs[]`, `policyRefs[]`, `requiredEvidence[]`, `verdictOptions[]`, `returnSchemaVersion`, `budget`, `deadline`, `state`, `verdict?` |
| `ReconciliationRecord` | `id`, `organizationId`, `candidateId`, `leadReviewerActorId`, `coverageMap`, `packetVerdicts[]`, `unresolvedScope[]`, `duplicateFindingGroups[]`, `conflictingFindingGroups[]`, `crossPacketInteractions[]`, `systemicPatterns[]`, `integrationEvidenceIds[]`, `finalFindings[]`, `finalVerdict`, `residualRisk`, `confidence`, `reReviewImpactMap`, `nextGate` |
| `IntegrationPlan` | `id`, `organizationId`, `mergeOrder[]`, `conflictPolicy`, `candidateFreezeRules`, `endToEndTestRefs[]`, `rollbackPlanRef`, `state` |
| `IntegrationAttempt` | `id`, `integrationPlanId`, `packetId`, `attempt`, `result`, `conflictRecords[]`, `resultingCandidateId?`, `evidenceIds[]` |
| `StructuredMessage` *(2A-6, blocked)* | `id`, `organizationId`, `fromActorId`, `toActorIds[]`, `kind: question | dependency | evidence | decision_request`, `body`, `impact`, `urgency`, `requiredResponse`, `budgetConsumed`, `writeBackRecordId?`, `createdAt` |
| `ParallelizationMeasurement` | `id`, `organizationId`, `predictedSpeedup`, `actualSpeedup`, `tokenCost`, `coordinationOverhead`, `duplicatedWork`, `mergeConflictCount`, `packetFailureCount`, `reconciliationLatency`, `integrationRework`, `qualityAdjustedValue`, `regret` |
| `OrganizationOutcome` | `id`, `organizationId`, `wallClockDuration`, `totalCost`, `failures[]`, `reassignments[]`, `defects[]`, `residualRisk`, `lessonProposalIds[]` |

**Extensions to existing models (additive only, per ADR-0002 precedent):** `Task` and
`Execution` gain optional `organizationId` / `packetId`; `Review` gains optional
`reviewPacketId`; `Evidence` gains optional `packetId`; `Event` gains organization and
packet correlation fields.

## 3.6 Required interfaces

**Ports (`types/contracts/*`):**

- `OrganizationRepository` — create/read/transition organizations; enforce permitted
  state transitions; reserve canonical identity (1E idempotency pattern).
- `PacketRepository` — packet CRUD, graph queries, dependency resolution, ready-set
  computation, atomic packet claim.
- `DecompositionPlanner` — `plan(goal, repositoryModel, constraints) → PacketGraphProposal`.
- `WorkforceController` — `staff(organizationId, plan) → assignments`; pause/resume/
  rebalance/retire.
- `ConcurrencyGovernor` — `acquire(group, actor) → lease | backpressure`; `serialize(group,
  reason)`; fairness accounting.
- `ReviewPacketGenerator` — `generate(candidateId, coveragePlan) → ReviewPacket[]`.
- `ReconciliationEngine` — `reconcile(candidateId, packetVerdicts) → ReconciliationRecord`.
- `IntegrationManager` — `plan`, `attempt`, `verify`, `rollback`.
- `ParallelizationOptimizer` — `predict(plan) → forecast`; `record(outcome)`.
- `CommunicationBroker` *(2A-6)* — `send`, `subscribe`, `requireWriteBack`.
- `OrganizationTemplateRegistry` — versioned template resolution.

**HTTP surface (`app/api/dev-hq/*`, following existing public/internal split):**

- Public read: `GET /organizations`, `/organizations/[id]`, `/organizations/[id]/packets`,
  `/organizations/[id]/reconciliation`.
- Founder actions: `POST /organizations/[id]/cancel`, `/serialize`, `/dissolve`.
- Internal (token-guarded, following `app/api/dev-hq/internal/*`): packet claim, packet
  return, interface freeze, integration attempt, reconciliation submit, broker send.

**Durable workflow surface (`trigger/*`):** `organization-runner` (staffing and packet
dispatch loop), `packet-execution` (extends `agent-execution`), `integration-runner`,
`organization-sweeper` (stalled packets, expired budgets, orphaned organizations).

**UI surface:** Mission Control organization views — org list, packet graph visualization,
critical path, concurrency state, budget consumption, reconciliation viewer, integration
timeline.

## 3.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Authority derivation** | An organization's authority is **derived from and never wider than** the parent work item's grant. A packet's authority is never wider than its organization's. No actor may expand its own authority (§17). |
| **Credential scope** | Packet-scoped, short-lived credentials from the broker (§17). A packet touching one subsystem does not hold repository-wide write authority. |
| **Independence** | A lead reviewer may not reconcile a candidate the lead implemented (§19). An integration owner may not provide the independent approval of work it integrated. D-2A-4 settles the boundary cases. |
| **Packet approval ≠ candidate approval** | Enforced structurally: candidate advancement requires a `ReconciliationRecord` with a final verdict, not a set of packet verdicts (§4A). |
| **Communication non-authority** | No `StructuredMessage` may change scope, interface, candidate identity, authority, or approval status. Material outcomes must become decision records, evidence, or knowledge proposals (§13A). Enforced by the broker having no write path to those fields. |
| **Budget enforcement** | Reservation before dispatch, not accounting after. Global and per-project ceilings prevent capacity exhaustion (§13A Economic Control). |
| **Model neutrality** | Packet model selection resolves through the P-4 indirection. No model name in planner, builder, controller, or governor code (§0.4). |
| **Provenance** | Every packet, message, verdict, and integration attempt records creator, model/provider/version, prompt, tools, context package, candidate, policy version, and authority grant (§17). |

## 3.8 Observability

**Events** (canonical vocabulary, pre-2E, emitted through the existing 1E event logger):
`organization.formed|staffed|paused|resumed|cancelled|failed|dissolved`,
`packet.planned|assigned|claimed|returned|verified|failed|superseded`,
`interface.declared|frozen|violated`,
`concurrency.backpressure|serialized|starvation_detected`,
`budget.reserved|exceeded|ceiling_hit`,
`reviewpacket.generated|returned`, `reconciliation.started|completed|conflict_unresolved`,
`integration.attempted|conflicted|converged|rolled_back`,
`broker.message_sent|writeback_recorded|writeback_missing`.

**Metrics** (§21 parallelization block): wall-clock speedup, total token/compute cost,
coordination overhead, duplicated work, merge-conflict rate, packet-failure rate,
reconciliation latency, integration rework, quality-adjusted team value, parallelization
regret, starvation incidents, emergency-serialization frequency.

**Read models:** organization timeline (extends the P-6 execution timeline), packet graph
with live state, critical-path highlighting, budget burn-down, concurrency heatmap.

## 3.9 Failure and recovery behavior

Per §13A Failure Handling, when a packet fails, stalls, exceeds budget, loses context, or
returns unverifiable output, HQ selects from an **ordered, recorded** policy:

1. **Retry** — bounded, deterministic, within the existing attempt budget.
2. **Reassign** — different worker, same packet identity, same scope.
3. **Shrink scope** — split the packet; new identity; original superseded with lineage.
4. **Serialize dependencies** — collapse a concurrency group to sequential.
5. **Replace the worker** — different agent or model binding, recorded as a routing change.
6. **Fail the organization** — escalate through the 1E escalation queue.

**Additional required behaviors:**

- **Sibling validity:** completed sibling packets remain reusable **only when candidate
  identity and impact analysis prove they are still valid** (§13A). Default is
  invalidation, not reuse — reuse requires a recorded justification.
- **Candidate mutation invalidates approvals:** material edits after packet review
  invalidate affected packet approvals (§4A). The reconciliation record's re-review impact
  map is the authoritative statement of what must be re-reviewed.
- **Cancellation safety:** cancellation is idempotent, releases leases and budget
  reservations, and leaves no packet in an ambiguous claimed state.
- **Emergency serialization:** any actor with the D-2A-3 grant can collapse all
  concurrency groups to sequential; in-flight packets finish, no new parallel dispatch.
- **Crash and interruption recovery:** the organization sweeper reconciles orphaned
  organizations, expired packet leases, and unclaimed dispatches using 1E's reclaim
  semantics. Restoration verification (CLM) must pass before a resumed packet mutates.
- **Deadlock detection:** a packet graph whose ready set is empty while packets remain
  planned raises a blocked-organization escalation rather than hanging.
- **Uncertain outcome:** a packet that cannot be classified as success or failure enters
  the 1E uncertain state and blocks integration.

## 3.10 Acceptance criteria

The roadmap sets the bar (§10, 2A): *"demonstrate that adaptive teams outperform
single-owner execution on selected large tasks without reducing quality, auditability,
deterministic convergence, or review independence."* Appendix J gives the test families.

| # | Criterion | Pass condition |
|---|---|---|
| A1 | Deterministic packet identity | Same plan re-executed yields the same packet identities; no duplicates under retry or replay |
| A2 | No duplicate active ownership | Concurrent claim attempts on one packet: exactly one succeeds; property-tested |
| A3 | Safe cancellation | Cancellation at every lifecycle state leaves consistent records, released leases, released budget |
| A4 | Bounded retry | Retry never exceeds the recorded budget; exhaustion escalates, never loops |
| A5 | Candidate convergence | Parallel packets converge to one candidate with deterministic merge order; end-to-end proof attached |
| A6 | Stale-result rejection | A packet result produced against a superseded candidate is rejected with a recorded reason |
| A7 | Restoration after interruption | Kill mid-organization; restart; verify no duplicate ownership, no lost packets, no mutation before restoration verification |
| A8 | Packet approval cannot bypass reconciliation | Attempting to advance a candidate on packet verdicts alone fails |
| A9 | Cross-packet defect detection | An injected defect spanning two packets is caught by reconciliation, not by either packet reviewer alone |
| A10 | Approval invalidation | Mutating the candidate after packet review invalidates the affected approvals and the impact map names them |
| A11 | Efficiency comparison | Representative large work executed both single-owner and team; wall-clock, cost, quality, rework, coordination overhead, and diminishing returns recorded |
| A12 | Quality non-regression | Team execution's defect yield and first-pass approval rate are no worse than single-owner on the same work class |
| A13 | Authority isolation | A packet cannot read or write outside its declared scope; attempted expansion is denied and logged |
| A14 | Budget enforcement | Ceilings hold under concurrency; a ceiling hit halts dispatch rather than overrunning |
| A15 | Provider limits and backpressure | Rate-limit pressure produces backpressure and fairness, not failure cascades or starvation |
| A16 | Complete provenance | Every packet, verdict, and integration attempt resolves to actor, model identity, context, policy, and authority |
| A17 | Founder escalation | Organization failure and unresolved reviewer disagreement reach the Founder Decision Inbox with the §Escalation-Standards content |
| A18 | Communication write-back *(if 2A-6 ships)* | No message changes scope/interface/candidate/authority/approval; every material outcome has a write-back record; missing write-back blocks organization dissolution |

## 3.11 Required evidence

- Full deterministic gate suite green (vitest, `tsc --noEmit`, eslint, `next build`),
  matching the Sprint 1E validation pattern.
- **Invariant/property test suite** for A1–A7 with recorded seeds and runnable commands.
- **Concurrency and replay harness output** — this is the harness whose absence the Sprint
  1E validation flagged; 2A must ship it, not inherit its absence.
- **A/B execution report** for A11/A12: same work class, both modes, with raw measurements
  and the quality-adjusted comparison.
- **Provenance dump** for one complete organization: every record chained from goal to
  dissolved organization.
- **Chaos/interruption transcript** for A7 (kill, restart, verify).
- Independent code review report (TMP: `CODE_REVIEW_REPORT.md`) — 0 blockers.
- Architecture review report — explicit gate verdict on ADR-0001/0002 compliance,
  Execution Manager purity, and the concurrency composition.
- Security review of authority derivation, credential scoping, and broker non-authority.
- Reconciliation record for 2A's own candidate, produced by 2A itself (self-hosting proof).

## 3.12 Reviewers

| Role | Lens | Blocking? |
|---|---|---|
| `architecture-reviewer` | ADR compliance, boundaries, orchestration ownership, concurrency and replay convergence, crash recovery, idempotency, lifecycle consistency | **Yes — architecture gate** |
| `independent-code-reviewer` | Correctness, regressions, maintainability, tests, edge cases, scope | **Yes** |
| `reliability-engineer` | Retry, replay, recovery, backpressure, starvation, cancellation, deadlock | **Yes** |
| `security-engineer` | Authority derivation, credential scope, isolation, broker non-authority | **Yes** |
| `qa-engineer` | Acceptance test coverage, A/B methodology validity | Yes |
| `database-architect` | Packet/organization schema, transaction semantics, constraint enforcement | Yes |
| `observability-engineer` | Event vocabulary forward-compatibility with 2E-1 | Advisory |
| `claude-design` | Organization and packet-graph views | Advisory |
| **Founder** | Authority model, concurrency ceilings, independence rules, acceptance of A11/A12 results | **Yes — reserved** |

## 3.13 Founder decisions

D-2A-1 (concurrency and organization-size ceilings), D-2A-2 (authorized organization
types; whether adversarial review is permitted), D-2A-3 (emergency serialization
triggers and authority), D-2A-4 (lead/integration-owner independence boundaries),
D-2A-5 (refuse-to-parallelize threshold), D-P4 (communication ADR — gates 2A-6).

## 3.14 Likely work-item sequence

| ID | Work item | Size | Notes |
|---|---|---|---|
| 2A-1 | Organization + packet + interface + dependency records, state machines, identity reservation, additive extensions to `Task`/`Execution`/`Review`/`Evidence`/`Event` | L | Sequential head; nothing else can start |
| 2A-2 | Work Decomposition Planner over 1H Repository Intelligence; critical-path detection; non-parallelizable work identification | L | |
| 2A-3 | Temporary Organization Builder, Dynamic Workforce Controller, Concurrency Governor, budget reservation, organization templates | L | Must ship as one change (§2.5 #3) |
| 2A-4 | Review Packet Generator + Lead Reconciliation Engine + re-review impact map | M | |
| 2A-5 | Integration Manager: interface registry, merge order, convergence, conflict handling, rollback | L | |
| 2A-6 | Communication Broker + write-back enforcement | M | **Blocked on D-P4** |
| 2A-7 | Parallelization Optimizer + organization metrics + measurement records | M | |
| 2A-8 | Mission Control organization views (list, packet graph, critical path, budgets, reconciliation viewer) | M | Parallel-safe |
| 2A-9 | Appendix J acceptance demonstration + A/B comparison + evidence package | M | Gate |

## 3.15 Explicit out-of-scope

- **Hierarchical mode** (chief lead + subsystem leads + specialists) — roadmap §4A places
  it in *late* Phase 2; enabled after the optimizer has data (R-12). Mature version.
- **Adversarial review mode** — mature version, pending D-2A-2.
- **Cross-project and multi-repository organizations** — 2B.
- **Memory-informed team composition and pairing preference** — 2F. 2A forms teams from
  the Agent Capability Registry only.
- **Human participants in temporary organizations** — 2G.
- **Model-aware staffing beyond registry capability lookup** — 2H.
- **Learned decomposition** (models trained on past outcomes) — mature version after 2E/2F.
- **Gate packs as packets** — 2K.
- **Enterprise tenancy, marketplace organization templates** — Phase 4.

## 3.16 Completion gate

**Gate 2A signed when:** A1–A17 pass (A18 if 2A-6 shipped); the full evidence package
(§3.11) exists; all blocking reviewers return **PASS** or **PASS WITH NON-BLOCKING
FINDINGS** on one stable candidate *(corrected v1.1.0 to the recorded verdict vocabulary,
§0.6)*; the A11/A12 comparison demonstrates that adaptive teams
outperform single-owner execution on the selected large tasks **without** reducing
quality, auditability, deterministic convergence, or review independence; and the Founder
accepts. If A11 shows teams do *not* outperform, the honest gate outcome is to record
that finding, keep the engine with conservative defaults, and let the optimizer refuse
parallelization — not to claim the gate passed.

**MVP ships with:** parallel-team mode, fixed conservative concurrency, communication
disabled, hierarchical mode absent.

## 3.17 Capabilities accelerated after completion

- **Every subsequent stage's delivery velocity.** 2B–2K are large, subsystem-decomposable
  programs — exactly 2A's target work class. From here Phase 2 builds itself with teams.
- **Parallel subsystem review** cuts review latency on the large candidates 2C, 2E, and
  2K produce.
- **2B** inherits budget, concurrency, and integration control, so multi-project scale
  does not become uncontrolled fan-out (R-7).
- **2E** gets the parallelization KPI block as first-class input.
- **2F** gets team memory: pairings, structures, coordination overhead, conflict history.
- **2G** extends the broker instead of building a second messaging path.
- **2K** runs gate packs as review packets inside organizations.

---

# 4. Stage 2B — Multi-Project Scaling

*Roadmap authority: §10 (2B), §3, §17, Appendix A.*

## 4.1 Purpose

Manage many repositories and products through **one governed organization** with hard
isolation: project-specific roadmaps, budgets, memory, quality gates, and health; a
shared agent organization with project-aware routing; and coordinated cross-project
dependencies, portfolio planning, multi-repository changes, and releases.

2B is second because it establishes the **scoping key** that every later record needs.
Knowledge (2C), metrics (2E), and agent memory (2F) are all scope-isolated by project and
repository; creating those records before the scope model exists is the most expensive
retrofit in Phase 2 (R-3).

## 4.2 Entry criteria

- Gate 2A signed.
- ADR §2.7 #7 (project isolation and scoping key model) approved; D-2B-1 (canonical scope
  tuple; tenancy now or Phase 4) and D-2B-3 (cross-project grant policy) recorded.
- D-2B-2: at least two real projects designated, with budget allocation. Dev HQ itself is
  project one; a second real project is required — isolation cannot be demonstrated
  against a single project.
- Repository Intelligence (1H) can maintain models for more than one repository.
- The current single-project assumptions are inventoried: `store.ts` seeds
  `projectId: "proj-dev-hq"`; `constants.ts` fixes one founder-request workflow id and one
  executive orchestrator agent id. These are the concrete places single-project
  assumptions are baked in today.

## 4.3 Dependencies

| Depends on | For |
|---|---|
| 2A (all) | Organizations and packets become project-scoped; budgets nest project under global |
| Work Management Layer (1A) | `Project` domain model already exists (`types/domain/project.ts`) and is the anchor |
| Agent Registry (1D) | Shared agent organization with project-aware capability and availability |
| Repository Intelligence (1H) | Per-repository models, change detection, invalidation |
| Credential broker (§17) | Project-scoped credentials; a project's agents never hold another project's secrets |
| Policy engine (§17) | Per-project policy resolution with organization-level inheritance |

## 4.4 Required systems

| System | Responsibility |
|---|---|
| **Project Registry & Profile Service** | Project identity, repositories, environments, owners, lifecycle, activation state |
| **Scope Enforcement Layer** | Deny-by-default scope filtering at the persistence and API boundary — not in application code, where it is forgettable |
| **Project Policy Resolver** | Resolve effective policy for a work item: organization defaults ← project overrides ← work-item constraints; record the resolution |
| **Project Budget Service** | Per-project ceilings nested inside global; arbitration when projects compete for capacity |
| **Project-Aware Router** | Extend routing to consider project familiarity, repository experience, and project-specific policy — without leaking cross-project state |
| **Cross-Project Dependency Service** | Declarative dependency records, blocking semantics, cycle and deadlock detection |
| **Portfolio Planner** | Cross-project prioritization, sequencing, and capacity allocation proposals |
| **Multi-Repository Change Coordinator** | One logical change spanning repositories: per-repo candidates, ordering, interface contracts, all-or-nothing semantics where required |
| **Coordinated Release Manager** | Multi-repository release plans, ordering, per-repo rollback, partial-failure abort |
| **Project Health Service** | Per-project health snapshot feeding 2D/2E |
| **Cross-Project Grant Service** | Explicit, recorded, expiring grants for the rare legitimate cross-project read |

## 4.5 Required data models

| Model | Key fields |
|---|---|
| `ScopeKey` (value type, used everywhere) | `organizationId`, `tenantId?`, `projectId`, `repositoryId?`, `environmentId?` |
| `ProjectProfile` | `id`, `name`, `status`, `ownerActorId`, `repositoryBindingIds[]`, `roadmapRef?`, `createdAt`, `archivedAt?` |
| `RepositoryBinding` | `id`, `projectId`, `repositoryIdentity` (host/owner/name), `defaultBranch`, `intelligenceModelId?`, `writeAuthorityPolicyRef` |
| `ProjectPolicySet` | `id`, `projectId`, `version`, `reviewRequirements`, `gateBindings[]`, `modelConstraints`, `dataAccessRules`, `retentionRules`, `inheritedFrom` |
| `ProjectBudget` | `id`, `projectId`, `period`, `tokenCeiling`, `costCeiling`, `concurrencyCeiling`, `consumed`, `arbitrationPriority` |
| `CrossProjectDependency` | `id`, `fromProjectId`, `fromWorkItemId`, `toProjectId`, `toWorkItemId`, `kind: blocks | interface | data`, `state`, `resolvedAt?` |
| `PortfolioPlan` | `id`, `version`, `horizon`, `projectPriorities[]`, `capacityAllocations[]`, `assumptions`, `provenance`, `status` |
| `MultiRepoChangeSet` | `id`, `objective`, `projectIds[]`, `repositoryCandidates[]` (repo → candidateId), `interfaceContracts[]`, `mergeOrder[]`, `atomicity: all_or_nothing | ordered_best_effort`, `state` |
| `CoordinatedRelease` | `id`, `changeSetId`, `releasePlan[]`, `perRepoRollbackPlans[]`, `gateResults[]`, `state`, `abortReason?` |
| `ProjectHealthSnapshot` | `id`, `projectId`, `capturedAt`, `qualityScore`, `flowScore`, `architectureScore`, `contextScore`, `costScore`, `inputs`, `provenance` |
| `CrossProjectGrant` | `id`, `fromProjectId`, `toProjectId`, `scope`, `purpose`, `grantedByActorId`, `expiresAt`, `revokedAt?` |
| `ScopeViolationRecord` | `id`, `attemptedScope`, `actorId`, `workItemId`, `deniedAt`, `enforcementPoint` |

**Migration:** every existing record type gains its `ScopeKey` fields. Because the store
is seeded with one project, backfill is deterministic — which is precisely why this must
happen at 2B and not after 2C/2E/2F have created unscoped corpora (R-3).

## 4.6 Required interfaces

**Ports:** `ProjectRegistry` (extends the existing `ProjectRepository`), `ScopeEnforcer`,
`ProjectPolicyResolver`, `ProjectBudgetService`, `CrossProjectDependencyStore`,
`PortfolioPlanner`, `MultiRepoChangeCoordinator`, `ReleaseCoordinator`,
`CrossProjectGrantStore`.

**HTTP:** project selector context on every existing route (scope resolved from the
authenticated actor + explicit project parameter, never inferred); `GET/POST /projects`,
`/projects/[id]/policy`, `/budget`, `/health`; `/portfolio/plan`; `/change-sets`,
`/change-sets/[id]/release`; `/grants`.

**Workflow:** `multi-repo-integration-runner`, `coordinated-release-runner`,
`cross-project-dependency-sweeper`.

**UI:** project switcher; portfolio view; per-project health; cross-project dependency
board; multi-repo change-set and release views.

## 4.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Deny by default** | Cross-project reads and writes are denied unless a `CrossProjectGrant` covers them. Enforced at the persistence boundary, so a forgotten filter in application code fails closed. |
| **Credential isolation** | Project-scoped credentials only. No actor holds credentials for a project it is not assigned to (§17 least privilege). |
| **Context Router isolation** | The router must not assemble context across projects without a grant. This is the most likely leakage path and needs a dedicated test. |
| **Routing without leakage** | Project-aware routing may use *capability* across projects; it may not expose one project's work content, evidence, or knowledge to another. |
| **Policy inheritance is one-way** | Projects may narrow organization policy, never widen it. A project cannot grant itself a weaker review requirement than the organization floor. |
| **Budget arbitration is governed** | Reallocating capacity between projects is a recorded decision with authority, not an implicit side effect of scheduling. |
| **Multi-repo authority** | A change set's authority is the intersection of its per-project grants; deployment remains L4 per environment. |

## 4.8 Observability

**Events:** `project.registered|activated|archived`, `policy.resolved`,
`budget.allocated|arbitrated|ceiling_hit`, `scope.violation_denied`,
`crossproject.dependency_declared|blocked|resolved|cycle_detected`,
`grant.issued|used|expired|revoked`, `changeset.created|repo_converged|aborted`,
`release.coordinated_started|repo_deployed|repo_rolled_back|aborted|completed`.

**Metrics:** per-project cycle time, throughput, cost, quality, budget utilization,
arbitration frequency; cross-project dependency blocking time; multi-repo change success
rate; coordinated release success and abort rate; **scope-violation attempt count** (a
security KPI — nonzero deserves investigation).

## 4.9 Failure and recovery behavior

- **Partial multi-repo failure:** per-repository rollback plans execute in reverse merge
  order. For `all_or_nothing` change sets, any repo failure aborts and rolls back all;
  for `ordered_best_effort`, the change set halts, records converged repos, and escalates.
- **Coordinated release abort:** any gate failure or health-check failure aborts remaining
  deployments and triggers per-repo rollback; the release record retains the exact abort
  point.
- **Cross-project deadlock:** cycle detection on dependency declaration (reject at
  creation) plus periodic sweep for cycles formed by separate declarations; a detected
  cycle escalates rather than blocking silently.
- **Budget starvation:** a project starved beyond a threshold raises an arbitration
  escalation to the Founder rather than waiting indefinitely.
- **Scope-key backfill failure:** migration is a rehearsed, reversible schema change with
  a verified row-count and provenance check (2K-3 pattern applied early).
- **Grant expiry mid-work:** in-flight work holding an expiring grant is paused at the
  next safe boundary, not killed mid-mutation.

## 4.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| B1 | Two projects operate concurrently | Independent budgets, policies, gates, and health; no shared mutable state beyond the agent organization |
| B2 | Isolation proven, not asserted | Adversarial tests attempt cross-project read via API, repository, Context Router, and routing; every attempt is denied and recorded |
| B3 | Policy resolution is correct and recorded | Effective policy = organization ← project ← work item, with the resolution chain stored on the transition |
| B4 | Policy cannot widen | A project attempting to weaken an organization-floor review requirement is rejected |
| B5 | Budgets hold under concurrency | Two projects competing produce arbitration, not overrun |
| B6 | Project-aware routing works without leakage | Routing uses cross-project capability; a leakage probe finds no cross-project content |
| B7 | Cross-project dependency blocks correctly | Downstream work does not start until upstream resolves; cycles are rejected or escalated |
| B8 | Multi-repo change converges | One logical change across ≥2 repositories reaches a verified state with interface contracts honored |
| B9 | Coordinated release with rollback | A deliberately failed release aborts and rolls back every deployed repo, with evidence |
| B10 | Scope migration is clean | Every pre-existing record carries a correct scope key; verified by count and provenance |
| B11 | Grants are auditable | Every cross-project access resolves to an unexpired grant with purpose and authority |

## 4.11 Required evidence

Deterministic gates green; isolation adversarial-test report (B2 — this is the security
centerpiece); policy resolution traces; budget arbitration transcript; multi-repo
convergence evidence with per-repo candidate identities; **executed** rollback evidence
for B9; migration rehearsal + execution report with row counts; independent code review;
architecture review; **security review with explicit isolation verdict** (blocking);
database review of the scope-key schema and constraints.

## 4.12 Reviewers

`security-engineer` (**blocking — isolation is the stage's core risk**),
`architecture-reviewer` (**blocking**), `independent-code-reviewer` (**blocking**),
`database-architect` (**blocking** — scope keys, constraints, migration),
`devops-engineer` (coordinated release, rollback), `reliability-engineer` (partial
failure, deadlock), `qa-engineer`, `claude-design` (portfolio UX, advisory),
**Founder** (reserved: scope tuple, grant policy, project set, budgets).

## 4.13 Founder decisions

D-2B-1 (canonical scope tuple; tenancy now vs. Phase 4), D-2B-2 (which projects; budget
allocation), D-2B-3 (cross-project grant policy), plus budget-arbitration priority rules.

## 4.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2B-1 | `ScopeKey` model, scope enforcement at the persistence/API boundary, migration of existing records, scope-violation recording | L |
| 2B-2 | Project registry/profile, policy resolver with inheritance, project budgets and arbitration, project-aware routing | L |
| 2B-3 | Cross-project dependencies with cycle detection; portfolio planner; cross-project grants | M |
| 2B-4 | Multi-repository change sets; coordinated release manager with per-repo rollback | L |
| 2B-5 | Multi-project acceptance demonstration (B1–B11) | S |

## 4.15 Explicit out-of-scope

- **Multi-organization / multi-tenant isolation** — Phase 4 (4A). 2B carries an optional
  `tenantId` in the scope key only if D-2B-1 chooses to reserve it.
- **Per-project model contracts and routing policies** — 2H (2B carries the binding point,
  not the policy engine).
- **Per-project agent memory scoping enforcement** — 2F (2B provides the key; 2F enforces
  memory-specific boundaries).
- **Per-project knowledge ACLs** — 2C.
- **Portfolio *forecasting*** — 2D/2E. 2B does prioritization and allocation proposals only.
- **Marketplace-installed per-project workflows** — Phase 4 (4B).
- **Savrio as a project** — Phase 3 decides when Savrio enters.

## 4.16 Completion gate

**Gate 2B signed when:** B1–B11 pass; the isolation adversarial report shows zero
successful cross-project accesses without a grant; the scope migration is verified;
blocking reviewers approve one stable candidate; the Founder accepts the scope tuple and
grant policy as implemented.

## 4.17 Capabilities accelerated after completion

- **2C, 2E, 2F become buildable correctly the first time** — every knowledge record,
  metric sample, and experience record is born scoped (removes R-3 entirely).
- **2K** gets per-project gate bindings and multi-repo release, its two hardest inputs.
- **2D** gets per-project health and portfolio inputs for the Founder Dashboard.
- **Phase 3** gets the mechanism by which Savrio becomes a project alongside Dev HQ
  without re-architecture.
- **2A organizations** can span repositories, unlocking cross-repository programs.

---

# 5. Stage 2C — Company Knowledge Platform

*Roadmap authority: §10 (2C), §11 (full section), §3 (Three Knowledge Classes), Appendix D.*

## 5.1 Purpose

Give the organization **durable institutional knowledge and a living human-readable
brain**: a canonical knowledge service with metadata, provenance, versioning, and
supersession; an Obsidian vault as the primary human browsing and editing interface;
Context Router retrieval before work and automatic documentation after approved
completion; and a Knowledge Curator that validates, links, supersedes, archives, and
measures.

The governing constraint (§11): *"Obsidian is the primary human-readable interface to
institutional knowledge, **not the sole brain or source of operational truth**."* And
§3: institutional knowledge *"never overrides repository truth, approved ADRs, policy, or
authorized decisions."*

## 5.2 Entry criteria

- Gate 2B signed — knowledge records are born project- and repository-scoped.
- ADRs §2.7 #9 (service authority vs. vault) and #10 (proposal/promotion governance)
  approved; D-2C-1 (vault hosting, sync mechanism, agent write access) and D-2C-2
  (which classes need Founder approval to publish organization-wide) recorded.
- 1H's *"foundation hooks for later Company Knowledge Platform retrieval"* are present and
  documented — 2C attaches to them rather than building a parallel retrieval path.
- The canonical vault structure (§11) is scaffolded and empty.
- Existing repository documentation is inventoried: `docs/company/*` (constitution,
  governance, organization, values), `standards/*` (17 standards), `handbooks/*`,
  `docs/workflows/*`, `templates/*`, `docs/decisions/*` (ADR-0001/0002), `AGENTS.md`.
  These are the initial corpus and the first migration decision.

## 5.3 Dependencies

| Depends on | For |
|---|---|
| 2B scope keys | Project/repository/authority scoping of every knowledge record |
| Context Router (1H) | The retrieval integration point; 2C supplies a knowledge source, the router still enforces minimum-complete-context and least privilege |
| Repository Intelligence (1H) | Contradiction detection against current code, APIs, schemas |
| Smart Work Packets (1G) | Retrieved knowledge lands in packets ("Future work packets retrieve the lesson only when relevant" §11) |
| Review + escalation (1E) | Reviewer findings and incidents are the raw material for proposals |
| 2A organizations | Large knowledge migrations and audits run as temporary organizations |
| Credential broker (§17) | Secret scanning before publication; no secrets into the vault |

## 5.4 Required systems

| System | Responsibility |
|---|---|
| **Knowledge Service** | Canonical authority for knowledge records: create, version, publish, supersede, archive. Owns the Appendix D schema. |
| **Metadata & Index Service** | Tags, relationships, semantic index, access controls, retrieval conditions |
| **Vault Sync Service** | Service→vault publication and vault→service intake. MVP: one-way publish + manual proposal intake. Mature: bidirectional with conflict resolution. |
| **Retrieval Service** | Scope-, freshness-, and authority-filtered retrieval returning confidence, provenance, and supersession status (§11 "During retrieval") |
| **Proposal Pipeline** | Findings, incidents, and patterns become `KnowledgeProposal`s — never direct publications (§11 "Automatic Organizational Learning") |
| **Knowledge Curator (agent role)** | Validate proposals, merge duplicates, connect notes, maintain indexes, preserve lineage, mark preferred/deprecated/rejected/superseded/experimental, detect conflicts with code/ADRs/policy, archive without erasing audit history, measure effectiveness (§11) |
| **Freshness Engine** | Stale thresholds, next-review scheduling, dead-link detection |
| **Contradiction Engine** | Detect conflicts between knowledge and current code, ADRs, policy, repository models |
| **Supersession Engine** | Lineage-preserving replacement; retrieval never returns superseded guidance as current |
| **Automatic Documentation Agent** | After approved completion, update feature docs, architecture, APIs, schemas, runbooks, examples, changelog, diagrams, onboarding where affected (§11 "After approved implementation") |
| **Effectiveness Measurement** | Whether retrieved knowledge improved outcomes or caused confusion (§11, §21 Knowledge Health) |
| **Secret & Sensitivity Scanner** | Blocking pre-publication gate (§17) |

## 5.5 Required data models

Appendix D is the authoritative field list. Structural decomposition:

| Model | Key fields |
|---|---|
| `KnowledgeRecord` | `id`, `title`, `type`, `classification`, `scopeKey`, `ownerActorId`, `version`, `status: draft \| published \| deprecated \| superseded \| archived \| rejected \| experimental`, `guidance`, `rationale`, `examples`, `constraints`, `antiPatterns`, `applicability`, `exclusions` |
| `KnowledgeVersion` | `id`, `knowledgeId`, `version`, `diffRef`, `authorActorId`, `modelIdentity?`, `approvedByActorId?`, `publishedAt` |
| `KnowledgeAuthority` | `knowledgeId`, `mayPropose[]`, `mayValidate[]`, `mayApprove[]`, `mayPublish[]`, `maySupersede[]`, `mayArchive[]`, `mayDelete[]` |
| `KnowledgeProvenance` | `knowledgeId`, `sourceWorkItemIds[]`, `candidateIds[]`, `evidenceIds[]`, `reviewIds[]`, `incidentIds[]`, `decisionIds[]`, `authorActorIds[]`, `modelIdentities[]`, `toolRefs[]` |
| `KnowledgeFreshness` | `knowledgeId`, `createdAt`, `lastReviewedAt`, `nextReviewAt`, `staleThreshold`, `repositoryCompatibilityState`, `adrCompatibilityState` |
| `KnowledgeConfidence` | `knowledgeId`, `evidenceStrength`, `uncertainty`, `contradictionState`, `challengeState`, `sampleBasis?` |
| `KnowledgeRelation` | `id`, `fromKnowledgeId`, `toKnowledgeId \| externalRef`, `kind: relates \| supersedes \| superseded_by \| contradicts \| derived_from \| implements_adr \| documents_file` |
| `KnowledgeProposal` | `id`, `proposedByActorId`, `sourceKind: review_finding \| incident \| pattern \| research \| session \| migration`, `sourceRefs[]`, `draftRecord`, `generalizationRationale`, `proposedScope`, `state: submitted \| validating \| needs_evidence \| approved \| published \| rejected`, `curatorNotes`, `approvalRefs[]` |
| `RetrievalEvent` | `id`, `workItemId`, `packetId?`, `knowledgeIds[]`, `queryContext`, `scopeKey`, `confidenceReturned`, `freshnessReturned`, `omittedForScope[]`, `retrievedAt` |
| `KnowledgeEffectivenessSample` | `id`, `retrievalEventId`, `downstreamOutcome`, `reviewImpact`, `confusionReported`, `attributedBy` |
| `VaultSyncState` | `id`, `knowledgeId`, `vaultPath`, `serviceVersion`, `vaultChecksum`, `lastSyncedAt`, `syncDirection`, `state: in_sync \| service_ahead \| vault_ahead \| conflicted` |
| `VaultConflict` | `id`, `knowledgeId`, `serviceVersion`, `vaultChecksum`, `conflictedFields[]`, `resolution?`, `resolvedByActorId?` |
| `CurationAudit` | `id`, `curatorActorId`, `action`, `targetKnowledgeIds[]`, `rationale`, `evidenceRefs[]`, `performedAt` |

## 5.6 Required interfaces

**Ports:** `KnowledgeStore`, `KnowledgeRetriever` (registered as a Context Router source),
`ProposalPipeline`, `VaultSyncAdapter`, `CurationEngine`, `FreshnessEngine`,
`ContradictionEngine`, `EffectivenessRecorder`, `SensitivityScanner`.

**HTTP:** `GET /knowledge` (scoped search), `/knowledge/[id]` (+ `/versions`,
`/provenance`, `/relations`); `POST /knowledge/proposals`,
`/knowledge/proposals/[id]/validate|approve|reject`; `POST /knowledge/[id]/supersede|archive`;
`GET /knowledge/health`; `POST /internal/knowledge/retrieve` (Context Router path);
`POST /internal/knowledge/effectiveness`.

**Workflow:** `knowledge-curation-sweep` (scheduled: freshness, dead links, duplicates,
contradictions, missing ownership), `vault-sync-runner`, `auto-documentation-runner`
(triggered on approved completion), `knowledge-effectiveness-attribution`.

**Vault interface:** Markdown with YAML frontmatter carrying the governed fields
(`knowledgeId`, `version`, `status`, `scope`, `freshness`, `provenance` refs). Body is
human-editable; frontmatter governed fields are service-owned. The vault directory
structure is roadmap §11's canonical list.

**UI:** knowledge browser in Mission Control (read + search), proposal queue, curation
dashboard, knowledge health panel, per-work-item "knowledge used" panel.

## 5.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Knowledge is never authority** | Retrieved knowledge cannot override repository truth, ADRs, policy, or authorized decisions (§3, §22). Retrieval results are labeled as guidance with confidence and freshness. |
| **The vault is an interface, not the brain** | Governed fields are service-owned. A vault edit to a governed field becomes a proposal or a conflict, never a silent state change. |
| **No auto-promotion** | A reviewer finding or incident creates a **proposal**, validated, generalized, approved at scope, published with provenance (§11). §22 prohibits *"Publishing unvalidated chat summaries as institutional knowledge."* |
| **Scope-filtered retrieval** | Retrieval respects 2B scope keys and knowledge ACLs. Cross-project retrieval requires a `CrossProjectGrant`. |
| **Secrets never enter knowledge** | Blocking sensitivity scan before publication and before vault write (§17). |
| **Organization-wide scope needs approval** | Per D-2C-2, promoting a lesson from project scope to organization scope is an approval, and for named classes a Founder approval. |
| **Curator authority is bounded** | The Curator validates and organizes knowledge. It does **not** own repository truth, policy authority, or automatic organization-wide doctrine (§19). |
| **Archival preserves audit history** | Archive without erasing (§11). Deletion is a separate, governed, rare action. |

## 5.8 Observability

**Events:** `knowledge.proposed|validated|approved|published|superseded|deprecated|archived|rejected`,
`knowledge.retrieved`, `knowledge.contradiction_detected`, `knowledge.stale_detected`,
`knowledge.deadlink_detected`, `knowledge.duplicate_merged`,
`vault.published|intake_received|conflicted|conflict_resolved`,
`documentation.auto_updated`, `sensitivity.scan_blocked`.

**Metrics** (§21 Knowledge Health): retrieval precision, stale-note rate, contradiction
rate, documentation freshness, knowledge effectiveness, usage distribution, confusion
reports, supersession lag, proposal approval rate, proposal cycle time, orphaned-note
count, vault conflict rate.

## 5.9 Failure and recovery behavior

- **Vault/service conflict:** a `VaultConflict` record is created; governed fields resolve
  service-ahead; human-editable body requires curator resolution. Nothing is silently
  overwritten in either direction.
- **Retrieval unavailable:** work proceeds with an explicitly recorded omission
  (`omittedForScope` / retrieval failure noted in the packet's context plan), never with a
  silent empty result. A silent empty retrieval that looks like "no relevant knowledge" is
  the dangerous failure mode.
- **Index corruption/staleness:** index rebuild from canonical records; canonical records
  are the recovery source, so index loss is never data loss.
- **Contradiction detected against current code:** the record is flagged
  `repositoryCompatibilityState: conflicting` and retrieval either withholds it or returns
  it with an explicit conflict warning (D-2C-2 chooses); a curation task is created.
- **Sync loop / thrash:** checksum + version comparison with an idempotent sync record;
  repeated conflict on the same record escalates rather than retrying forever.
- **Auto-documentation failure:** documentation gaps become tracked work items; a
  completion is **not** silently marked documented. (Roadmap §22: completion claims may
  not replace evidence.)
- **Mass-migration failure:** initial corpus migration runs as a 2A organization with
  per-packet rollback; partial migration is recorded, not left ambiguous.

## 5.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| C1 | Appendix D schema complete | Every required field present and populated on a real record set |
| C2 | Versioning and lineage | Supersession preserves lineage; retrieval never returns superseded guidance as current |
| C3 | Scoped retrieval | Retrieval respects project/repository/authority scope; cross-project retrieval without a grant returns nothing and records the omission |
| C4 | Context Router integration | Knowledge arrives in work packets through the 1H router, with provenance, confidence, and freshness attached |
| C5 | Proposal governance | No path exists by which a finding, incident, or chat summary becomes published knowledge without validation and scope-appropriate approval |
| C6 | Curator effectiveness | Duplicates merged, contradictions detected against real code/ADRs, stale notes flagged, missing ownership surfaced — demonstrated on the real corpus |
| C7 | Vault round trip | Service→vault publication renders correctly in Obsidian; a vault body edit becomes a proposal; a governed-field edit becomes a conflict |
| C8 | Secrets blocked | A planted secret in a proposal is blocked before publication and before vault write |
| C9 | Automatic documentation | An approved completion updates affected feature docs, APIs, schemas, runbooks, changelog, and onboarding; unaffected docs untouched |
| C10 | Effectiveness loop closes | At least one retrieval traced to a downstream outcome with an attribution record |
| C11 | The §11 worked example | Reproduce it end to end: repeated race-condition findings → fix → "Race Conditions" lesson with causes/detection/tests/safe patterns/examples/links → retrieved by a later relevant packet and **not** by an irrelevant one |
| C12 | Knowledge is not authority | A knowledge record contradicting current code does not change behavior; the contradiction is surfaced and the code wins |

## 5.11 Required evidence

Deterministic gates green; C11's end-to-end trace as the headline evidence artifact;
retrieval precision measurement on a labeled query set; scope-isolation test report;
secret-scan blocking transcript; vault round-trip transcript with screenshots; conflict
resolution transcript; auto-documentation diff for a real completion; curation sweep
report on the real corpus; independent code review; architecture review (authority
boundary: service vs. vault vs. repository truth); security review (ACLs, secret
scanning, cross-project retrieval).

## 5.12 Reviewers

`architecture-reviewer` (**blocking** — the "vault is not the brain" boundary is the
central architectural risk), `independent-code-reviewer` (**blocking**),
`security-engineer` (**blocking** — ACLs, secrets, cross-project retrieval),
`Knowledge Curator` role (**blocking** on corpus quality and curation semantics),
`data-engineer` (index, retrieval, effectiveness attribution),
`database-architect` (schema, versioning, lineage), `claude-design` (knowledge browsing
and proposal UX), `qa-engineer`, **Founder** (reserved: vault hosting/write access,
organization-wide publication authority, retention).

## 5.13 Founder decisions

D-2C-1 (vault hosting, sync mechanism, whether agents may ever write the vault directly —
recommendation: **no**, agents propose, the service publishes), D-2C-2 (which knowledge
classes require Founder approval for organization-wide scope), D-2C-3 (retention and
archival policy), plus: whether the existing `standards/*`, `handbooks/*`, and
`docs/workflows/*` corpus migrates into the knowledge service, is mirrored, or stays
repository-native (recommendation: **mirrored with the repository as source of truth for
standards**, since standards are enforced by review and belong to repository truth).

## 5.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2C-1 | Knowledge service, Appendix D schema, versioning, provenance, supersession, authority model | L |
| 2C-2 | Vault sync (publish + intake), frontmatter contract, conflict model, sensitivity scanner | L |
| 2C-3 | Retrieval service + Context Router integration + retrieval event recording | M |
| 2C-4 | Proposal pipeline, Knowledge Curator, freshness/contradiction/duplicate engines, curation sweep | L |
| 2C-5 | Automatic documentation after approved completion | M |
| 2C-6 | Knowledge acceptance demonstration incl. C11 | S |

## 5.15 Explicit out-of-scope

- **Agent experience memory** — 2F. 2C holds *institutional knowledge*, the fourth memory
  class in §12A. The distinction is load-bearing and must not blur.
- **Analytics dashboards over knowledge health** — 2D/2E consume the metrics; 2C emits them.
- **Research generation** — 2I produces research; 2C stores and supersedes it.
- **Semantic retrieval quality optimization** — mature version; MVP uses scoped keyword +
  metadata retrieval with measured precision as the baseline to improve on.
- **Full bidirectional vault sync with automatic merge** — mature version.
- **Knowledge marketplace / installable knowledge packs** — Phase 4 (4B).
- **Product and customer knowledge** — Phase 3.

## 5.16 Completion gate

**Gate 2C signed when:** C1–C12 pass; C11 is demonstrated end to end on real findings;
retrieval precision is measured (establishing the baseline, not a target); zero paths
exist from unvalidated content to published knowledge; blocking reviewers approve one
stable candidate; the Founder accepts vault authority boundaries and publication authority
as implemented.

## 5.17 Capabilities accelerated after completion

- **Every later stage's work packets** carry relevant lessons, standards, playbooks, and
  anti-patterns — the compounding effect the roadmap is built around.
- **2F** gets its institutional-promotion path and its Curator validator (removes R-5).
- **2I** gets a durable home with supersession, so research stops being write-only
  (removes R-10).
- **2E's** Review Learning has somewhere to publish validated lessons.
- **2K** gate findings become durable anti-patterns instead of repeated discoveries.
- **Onboarding of new roles and models** becomes a retrieval problem rather than a
  re-explanation problem — directly supporting §0.4 replaceability, since a new model
  inherits institutional context instead of accumulating it privately.

---

# 6. Stage 2D — Executive Intelligence and Advanced Founder Interface

*Roadmap authority: §10 (2D), §7 (Stage 2 Founder Dashboard, Stage 3 Executive Dashboard),
§2 (delegated authority), §21 (scores).*

## 6.1 Purpose

Develop the Orchestrator into a **higher-level engineering leader** and upgrade Founder
visibility: strategic planning, prioritization, scheduling, staffing, capacity,
forecasting, scenarios, budget optimization, and bottleneck detection; the Founder
Dashboard (§7 Stage 2, *"how healthy is the organization"*) and Executive Dashboard (§7
Stage 3, *"why it is happening and what should change"*), both with traceable
recommendations; and risk-aware delegated acceptance plus authority recommendations.

## 6.2 Entry criteria

- Gate 2C signed.
- ADR §2.7 #11 (metric read contract and recommendation provenance) approved — **this is
  the R-2 mitigation and it must be approved before 2D-1 is written.**
- D-2D-1 (dashboard metric set; what may be shown as a prediction) recorded.
- 1F Mission Control Lite is complete and is the surface 2D extends — 2D adds Stage 2 and
  Stage 3, it does not rebuild Stage 1.
- The authoritative event stream and the P-6 timeline read-model exist, so the thin metric
  projection has real inputs.

## 6.3 Dependencies

| Depends on | For |
|---|---|
| Mission Control Lite (1F) | The surface being extended; navigation, auth, PWA, notifications already exist |
| 2A organization records | Parallelization, capacity, and bottleneck inputs |
| 2B project/portfolio records | Per-project health, budget, portfolio prioritization |
| 2C knowledge health | A Knowledge Health score input (§21) |
| **2E (inverted edge — see R-2)** | 2E *implements* the metric read port 2D defines. 2D-1 ships the port plus a thin projection; 2E-2 replaces the implementation. |
| Policy engine (§17) | Delegated acceptance rules expressed as versioned policy, not code |
| Authority model (§2) | L0–L5 grants; authority recommendations are proposals against this model |

## 6.4 Required systems

| System | Responsibility |
|---|---|
| **Metric Read Port + Thin Projection** | The `MetricQuery` / `MetricSnapshot` contract; MVP implementation projects over authoritative events and 2A/2B records. Deliberately minimal — it exists to be replaced by 2E. |
| **Strategic Planner** | Translate Founder priorities into milestone and sequencing proposals across the portfolio |
| **Prioritization Engine** | Rank work by value, risk, dependency unblocking, cost, and deadline; show the ranking inputs |
| **Scheduler & Capacity Forecaster** | Project capacity from measured throughput and concurrency ceilings; identify when a deadline is not achievable |
| **Scenario Simulator** | "What if we add capacity / cut scope / change the gate policy" — with stated assumptions and confidence |
| **Budget Optimizer** | Propose allocation across projects and task classes for quality-adjusted value |
| **Bottleneck Detector** | Identify queue time, review latency, escalation waits, capacity starvation, and gate stalls as ranked bottlenecks with evidence |
| **Recommendation Service** | Every recommendation carries provenance: inputs, metric versions, confidence, assumptions, alternatives considered, and the authority required to act |
| **Founder Dashboard (Stage 2)** | Quality, velocity, risk, cost, architecture, context, autonomous readiness |
| **Executive Dashboard (Stage 3)** | Forecasts, scenarios, bottlenecks, staffing, routing, recommendations |
| **Delegated Acceptance Evaluator** | Risk-aware evaluation of whether a completed item may be auto-accepted within authority (§2 Automatic Acceptance Rule) |
| **Authority Recommendation Engine** | Propose authority expansions/contractions backed by Autonomous Readiness evidence — proposals only, never self-grants |

## 6.5 Required data models

| Model | Key fields |
|---|---|
| `MetricDefinitionRef` | `key`, `version`, `unit`, `semantics`, `sourceContract` — the vocabulary 2D consumes and 2E later owns |
| `MetricSnapshot` | `id`, `metricKey`, `metricVersion`, `scopeKey`, `window`, `value`, `sampleSize`, `computedAt`, `sourceEventRange`, `isProjection: boolean` |
| `HealthScoreSnapshot` | `id`, `scoreKind` (Organization / Autonomous Readiness / Architecture / Release Confidence / Context / Knowledge — §21), `scopeKey`, `value`, `inputs[]`, `weightsVersion`, `computedAt`, `provenance` |
| `Forecast` | `id`, `subject`, `horizon`, `predictedValue`, `confidenceInterval`, `assumptions[]`, `method`, `inputMetricRefs[]`, `createdAt`, `outcomeValue?`, `calibrationError?` |
| `Scenario` | `id`, `baselineRef`, `perturbations[]`, `predictedOutcomes[]`, `assumptions[]`, `confidence`, `createdByActorId` |
| `Recommendation` | `id`, `kind: prioritization \| staffing \| capacity \| budget \| routing \| policy \| authority \| remediation`, `subjectRefs[]`, `statement`, `rationale`, `inputMetricRefs[]`, `knowledgeRefs[]`, `confidence`, `alternativesConsidered[]`, `requiredAuthorityLevel`, `state: proposed \| accepted \| rejected \| superseded`, `decidedByActorId?`, `outcomeRef?` |
| `CapacityPlan` | `id`, `scopeKey`, `period`, `availableConcurrency`, `measuredThroughput`, `committedWork[]`, `projectedCompletion`, `riskFlags[]` |
| `BottleneckFinding` | `id`, `scopeKey`, `stage`, `metricEvidence[]`, `impactEstimate`, `rankedPosition`, `proposedRemediationRef?` |
| `DelegatedAcceptanceRule` | `id`, `version`, `taskClass`, `riskCeiling`, `requiredReviewers[]`, `requiredEvidence[]`, `blastRadiusLimit`, `enabled`, `approvedByActorId` |
| `AcceptanceDecisionRecord` | `id`, `workItemId`, `candidateId`, `ruleVersion`, `evaluatedInputs`, `decision: auto_accepted \| escalated`, `reason`, `decidedAt` |
| `AuthorityChangeProposal` | `id`, `currentLevel`, `proposedLevel`, `scope`, `evidenceRefs[]`, `readinessScoreRef`, `risks[]`, `rollbackPlan`, `state`, `founderDecisionRef?` |

## 6.6 Required interfaces

**Ports:** `MetricReader` (the R-2 seam), `HealthScoreReader`, `Forecaster`,
`ScenarioSimulator`, `PrioritizationEngine`, `CapacityPlanner`, `BottleneckDetector`,
`RecommendationStore`, `DelegatedAcceptanceEvaluator`, `AuthorityProposalStore`.

**HTTP:** `GET /intelligence/metrics`, `/health-scores`, `/forecasts`, `/bottlenecks`,
`/recommendations`; `POST /scenarios`; `POST /recommendations/[id]/accept|reject`;
`GET/POST /acceptance-rules`; `POST /authority-proposals/[id]/decide` (Founder only).

**UI:** Founder Dashboard (Stage 2) and Executive Dashboard (Stage 3) as new Mission
Control surfaces; recommendation detail with full provenance drill-down; scenario builder;
delegated-acceptance rule editor; authority proposal inbox in the existing Founder Decision
Inbox. Phone-first behavior and accessibility carried over from 1F.

## 6.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Recommendations never mutate state** | The Recommendation Service has no write path to work items, policy, routing, or authority. A recommendation becomes action only through a decision by a role with the required authority. |
| **Predictions are labeled — using Design's vocabulary, not a new one** | §3: Mission Control *"displays authoritative state and labels predictions clearly."* **Reconciled at integration:** 2D **adopts the claim-class axis** the Mission Control UX specification defines (§2.2): **Recorded · Derived · Projection `≈` · Recommendation `▸` · Unknown `—`**, together with its hard rules — a Projection may **not** be counted in a headline metric, may **not** trigger a notification, may **not** gate an action, may **not** be coloured with a state colour, may **not** be the sole content of a card; Unknown renders `—` and **never `0`**; and the class must appear in the accessible name, not only in styling. 2D does **not** define a competing truth model. `isProjection` on `MetricSnapshot` is the persistence-side encoding of the same axis. If governance promotes UX §2 to a standard (their GV-3, which we support), 2D complies with the standard. |
| **Confidence never replaces evidence** | §2 Automatic Acceptance Rule: *"Confidence scores may inform the decision but may never replace evidence or policy."* The acceptance evaluator requires reviewer approval on the exact candidate, current evidence, and policy permission — the score is an additional filter, never a substitute. |
| **Authority expansion is L5** | HQ may *propose*; only the Founder grants. An authority proposal cannot self-approve, and the proposal engine has no write access to grants (§2 Reserved Founder Authority). |
| **Scope isolation in dashboards** | Every metric and score is scope-filtered; a project-scoped viewer never sees another project's numbers. |
| **Score weightings are governed** | D-2E-2 sets weightings; they are versioned policy, because weightings determine prioritization and therefore behavior. |
| **Model neutrality** | Routing recommendations reference roles and capability profiles; any model reference resolves through the 2H registry (§0.4). |

## 6.8 Observability

**Events:** `metric.projected`, `healthscore.computed`, `forecast.created|resolved`,
`scenario.simulated`, `recommendation.created|accepted|rejected|superseded`,
`bottleneck.detected|resolved`, `acceptance.auto_accepted|escalated`,
`authority.proposal_created|decided`.

**Metrics** (§21 Founder-experience block): Founder intervention rate, automation
percentage, approval latency, reserved-decision frequency; **recommendation acceptance
rate** and **recommendation outcome accuracy** (did accepted recommendations improve the
metric they targeted?); forecast calibration error; dashboard load latency; bottleneck
detection precision.

**Meta-observability:** 2D must measure *itself* — a dashboard that reports health while
its own forecasts are miscalibrated is worse than no dashboard. Forecast calibration is a
first-class, visible metric.

## 6.9 Failure and recovery behavior

- **Metric source unavailable:** the dashboard shows an explicit "unavailable" state with
  last-known value and its age. It never renders a stale number as current or a zero as a
  measurement.
- **Insufficient sample size:** metrics and forecasts below a minimum sample threshold
  render as "insufficient data," not as a low value. This is the most common way analytics
  mislead.
- **Forecast miscalibration:** when calibration error exceeds a threshold, forecasting for
  that subject is suspended and flagged rather than continuing to publish.
- **Recommendation staleness:** a recommendation whose input metrics have materially moved
  is auto-superseded rather than remaining actionable.
- **Delegated acceptance uncertainty:** any ambiguity — missing reviewer approval, stale
  evidence, unresolved reserved decision, unclassifiable risk — escalates. The evaluator
  fails closed, always.
- **Projection→2E migration:** when 2E-2 replaces the projection, historical snapshots are
  recomputed or explicitly marked as projection-era, so a discontinuity in a chart is
  labeled rather than mysterious.
- **Dashboard write attempt:** structurally impossible (read-only ports); attempted writes
  are logged as a defect signal.

## 6.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| D1 | Metric read port is the only metric path | 2D contains no metric computation outside the port implementation; enforced at architecture review |
| D2 | Founder Dashboard (Stage 2) complete | Quality, velocity, risk, cost, architecture, context, autonomous readiness — each with source, freshness, sample size |
| D3 | Executive Dashboard (Stage 3) complete | Forecasts, scenarios, bottlenecks, staffing, routing, recommendations |
| D4 | Every recommendation is traceable | Drill-down from any recommendation to its input metrics, events, knowledge, confidence, assumptions, and alternatives |
| D5 | Predictions are unmistakably labeled | Visual and structural separation; a user test confirms a reader distinguishes measured from predicted |
| D6 | Read-only enforcement | No write path from intelligence to state; verified by test and review |
| D7 | Insufficient-data honesty | Below-threshold metrics render as insufficient data, never as a value |
| D8 | Forecast calibration measured | At least one forecast horizon resolved and calibration error reported |
| D9 | Delegated acceptance fails closed | Adversarial cases (missing approval, stale evidence, reserved decision pending, unknown risk) all escalate |
| D10 | Authority proposals cannot self-grant | Attempted self-grant is impossible by construction; proposal reaches the Founder inbox with §Escalation-Standards content |
| D11 | Scope isolation in dashboards | A project-scoped viewer sees no other project's metrics |
| D12 | Phone parity | Stage 2 dashboard and the decision inbox are usable and accessible on a phone (1F standard maintained) |
| D13 | Bottleneck detection is evidence-backed | Each finding cites metric evidence; a synthetic bottleneck is detected and ranked |

## 6.11 Required evidence

Deterministic gates green; a provenance walk-through for one recommendation from statement
to raw events; adversarial delegated-acceptance test report (D9 — the highest-risk item);
forecast calibration report; accessibility audit of both dashboards (`ACCESSIBILITY_STANDARD.md`);
scope-isolation test; screenshots/recordings of both dashboards on desktop and phone;
independent code review; architecture review (read-only boundary, R-2 seam compliance);
security review (authority proposal path, scope filtering).

## 6.12 Reviewers

`architecture-reviewer` (**blocking** — the read-only boundary and the R-2 metric seam),
`independent-code-reviewer` (**blocking**), `claude-design` (**blocking** — this is the
Founder's primary instrument; prediction labeling and information hierarchy are a
correctness concern, not polish), `security-engineer` (**blocking** — authority proposals,
scope filtering), `observability-engineer` (metric semantics forward-compatible with 2E-1),
`qa-engineer` (adversarial acceptance cases), `product-owner` (does the dashboard answer
the questions §7 says each stage answers), **Founder** (**blocking, reserved** — D-2D-1,
D-2D-2, D-2D-3).

## 6.13 Founder decisions

D-2D-1 (dashboard metric set; what may appear as a prediction), D-2D-2 (**which
delegated-acceptance rules to grant, and their risk ceilings** — the most consequential
autonomy decision in Phase 2), D-2D-3 (whether HQ may propose its own authority expansion
and what evidence is required), D-2E-2 (health-score weightings — needed by 2D, owned by
2E).

## 6.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2D-1 | `MetricQuery`/`MetricSnapshot` read port + thin projection + Founder Dashboard (Stage 2) | M |
| 2D-2 | Strategic planner, prioritization, capacity forecasting, scenarios, budget optimizer, bottleneck detector | L |
| 2D-3 | Executive Dashboard (Stage 3) + recommendation provenance drill-down | L |
| 2D-4 | Risk-aware delegated acceptance evaluator + authority recommendation engine | M |
| 2D-5 | Executive intelligence acceptance demonstration | S |

## 6.15 Explicit out-of-scope

- **The metric platform itself** — 2E. 2D defines and consumes the contract; it must not
  grow its own metric computation (D1 is the enforcement).
- **Memory-informed staffing recommendations** — 2F.
- **Model economics and routing policy** — 2H. 2D may *recommend* a routing change; 2H owns
  the policy.
- **Business Outcome Intelligence** (customer, revenue, adoption) — Phase 3 (§14).
- **Enterprise Operations Center** (multi-organization portfolios, compliance, tenancy,
  billing) — Phase 4 (§7 Stage 4).
- **Automatic action on recommendations** — permanently out of scope. Recommendations are
  proposals by design (§6.7).

## 6.16 Completion gate

**Gate 2D signed when:** D1–D13 pass; the Founder confirms both dashboards answer the
questions §7 assigns to Stage 2 and Stage 3; the delegated-acceptance rule set is
explicitly granted (or explicitly withheld) by the Founder rather than defaulted on; and
blocking reviewers approve one stable candidate.

**Note on honest gating:** if the Founder chooses to grant **no** delegated-acceptance
rules yet, 2D still passes — the capability exists and is governed. Autonomy level is the
Founder's decision, not a gate criterion.

## 6.17 Capabilities accelerated after completion

- **2E ships into a defined consumer** — the read port, dashboards, and provenance
  requirements already exist, so 2E delivers measurement rather than also delivering
  presentation.
- **Bottleneck detection immediately retargets the rest of Phase 2** — the program can
  reprioritize 2F/2G/2H/2K work against measured constraints instead of assumption.
- **Delegated acceptance reduces Founder queue latency** on routine completions, which is
  the §21 automation-percentage metric moving.
- **Authority proposals give autonomy growth an evidence-backed path**, which is the
  mechanism §4 uses to move from level 4 toward level 5.
- **Capacity forecasting makes the rest of this plan dateable** — after 2D/2E, sizing can
  become scheduling honestly (see §16 item 2).

---

# 7. Stage 2E — Engineering Intelligence Platform

*Roadmap authority: §10 (2E), §12 (full section), §21, Appendix A.*

## 7.1 Purpose

Unify measurement, learning, architecture health, context quality, review analytics,
routing intelligence, and organizational health behind **one common event and metric
model**, with health scores, trends, anomalies, root causes, forecasts, and recommendation
provenance — plus the Review Learning Engine and Continuous Architecture Management.

The governing constraints (§12): *"Metrics trace to authoritative events and candidate
identities; predictions include confidence and assumptions"* and *"Learning proposals
require validation before changing prompts, routing, thresholds, review depth, or policy."*

## 7.2 Entry criteria

- Gate 2D signed (the metric read contract exists and has a consumer).
- ADRs §2.7 #12 (canonical event/metric model) and #13 (architecture graph and drift)
  approved. **#12 should be approved before 2A-1 emits its first event** — see §2.7's
  blocking list; otherwise 2A/2B/2C/2D events need re-vocabularization here.
- D-2E-1 (retention/rollup), D-2E-2 (score weightings), D-2E-3 (whether any learning
  proposal may auto-apply — recommendation: none) recorded.
- The 1E event logger, 1E evidence store, P-6 timeline, and 2A/2B/2C event streams exist
  and are inventoried as ingestion sources.

## 7.3 Dependencies

| Depends on | For |
|---|---|
| 1E events/evidence/reviews | The authoritative source records all metrics must trace to |
| P-6 timeline read-model | Chronological substrate for flow metrics |
| 2A organization/packet events | Parallelization and coordination KPI block (§21) |
| 2B scope keys | Every metric series is scoped; unscoped series are unattributable (R-3) |
| 2C knowledge records | Knowledge Health inputs; validated lessons are Review Learning's publication target |
| 2D metric read port | The contract 2E-2 implements (R-2) |
| 1H Repository Intelligence | Architecture graph derivation: modules, dependencies, APIs, ownership, tests, risk |
| Context Lifecycle Manager | Context quality metrics (§6 context analytics) |

## 7.4 Required systems

| System | Responsibility |
|---|---|
| **Canonical Event Model** | One versioned event vocabulary with a schema registry; every subsystem emits into it. Includes required correlation fields: goal, work item, execution, actor, authority grant, candidate, policy decision (§3 invariant). |
| **Ingestion Pipeline** | Idempotent, ordered-enough ingestion with deduplication and late-arrival handling; rejects events failing schema or correlation requirements |
| **Metric Store & Rollups** | Time-series storage with definitions, versions, windows, and rollup granularity |
| **Health Score Engine** | The six §21 scores, computed deterministically from recorded inputs and a versioned weighting set |
| **Trend & Anomaly Engine** | Change detection with stated method and sensitivity |
| **Root-Cause Analyzer** | Hypotheses linking anomalies to candidate causes with supporting evidence — labeled as hypotheses |
| **Forecast Service** | Predictions with confidence intervals, assumptions, and post-hoc calibration (implements 2D's `Forecaster`) |
| **Review Learning Engine** | Track findings, validity, remediation cost, re-review outcome, false positives/negatives, escaped defects, incidents; identify recurring weaknesses, hotspots, missing tests, weak packet instructions, ineffective gates (§12) |
| **Continuous Architecture Management** | Architecture graphs, boundaries, ownership, data flows, APIs, dependencies, ADR relationships; detect cycles, layer violations, drift, coupling, boundary erosion, package growth, debt; produce scorecards and remediation proposals (§12) |
| **Learning Proposal Pipeline** | Recurring patterns become proposals that require validation; never auto-apply to prompts, routing, thresholds, review depth, or policy |
| **Statistical Validation Service** | Validate statistical claims and routing impact — the §12A gate 2F depends on: sample size, effect size, confounders, significance, and an explicit "insufficient evidence" verdict |

## 7.5 Required data models

| Model | Key fields |
|---|---|
| `CanonicalEvent` | `id`, `type`, `schemaVersion`, `scopeKey`, `occurredAt`, `ingestedAt`, `actorId`, `roleId`, `modelIdentity?`, `goalId?`, `workItemId?`, `executionId?`, `packetId?`, `organizationId?`, `candidateId?`, `authorityGrantId?`, `policyDecisionId?`, `payload`, `dedupeKey` |
| `EventSchemaRegistryEntry` | `type`, `version`, `schema`, `requiredCorrelationFields[]`, `deprecatedAt?`, `successorType?` |
| `MetricDefinition` | `key`, `version`, `unit`, `semantics`, `computation`, `sourceEventTypes[]`, `minimumSampleSize`, `owner` |
| `MetricSeries` | `id`, `metricKey`, `metricVersion`, `scopeKey`, `granularity`, `points[]` (`window`, `value`, `sampleSize`, `sourceEventRange`) |
| `HealthScoreDefinition` | `scoreKind`, `weightsVersion`, `inputMetricKeys[]`, `weights`, `approvedByActorId` |
| `Anomaly` | `id`, `metricKey`, `scopeKey`, `window`, `method`, `severity`, `baseline`, `observed`, `detectedAt`, `state` |
| `RootCauseHypothesis` | `id`, `anomalyId`, `hypothesis`, `supportingEvidenceRefs[]`, `contradictingEvidenceRefs[]`, `confidence`, `isHypothesis: true` |
| `ForecastRecord` | as 2D `Forecast`, plus `modelMethod`, `trainingWindow`, `calibrationHistory[]` |
| `ReviewOutcomeRecord` | `id`, `reviewId`, `candidateId`, `reviewerRoleId`, `lens`, `findingCount`, `blockingCount`, `remediationCost`, `reReviewOutcome`, `verdictChanged`, `latency` |
| `FindingValidity` | `id`, `findingId`, `validity: valid \| false_positive \| reclassified \| disputed`, `determinedBy`, `evidenceRefs[]` |
| `EscapedDefect` | `id`, `discoveredInStage`, `originCandidateId`, `missedByReviewIds[]`, `missedByGateIds[]`, `severity`, `rootCauseHypothesisId?` |
| `ReviewWeakness` | `id`, `pattern`, `hotspotRefs[]`, `missingTestRefs[]`, `weakPacketInstructionRefs[]`, `ineffectiveGateRefs[]`, `evidenceRefs[]`, `sampleSize` |
| `ArchitectureGraphSnapshot` | `id`, `scopeKey`, `capturedAt`, `nodes[]` (module/service/api/data), `edges[]` (depends/calls/reads/writes), `ownership[]`, `adrLinks[]`, `derivedFromCommit` |
| `ArchitectureViolation` | `id`, `snapshotId`, `kind: cycle \| layer_violation \| boundary_erosion \| coupling \| package_growth \| adr_noncompliance`, `participants[]`, `severity`, `firstSeenAt`, `state`, `acceptedByActorId?`, `acceptanceExpiresAt?` |
| `ArchitectureScorecard` | `id`, `scopeKey`, `capturedAt`, `boundaryIntegrity`, `coupling`, `cycles`, `growth`, `debt`, `adrCompliance`, `changeRisk`, `remediationProposalIds[]` |
| `LearningProposal` | `id`, `kind: prompt \| routing \| threshold \| review_depth \| policy \| test \| packet_instruction`, `pattern`, `evidenceRefs[]`, `sampleSize`, `proposedChange`, `expectedEffect`, `validationResultId?`, `state`, `approvedByActorId?`, `appliedAt?`, `rollbackRef?` |
| `ValidationResult` | `id`, `subjectRef`, `method`, `sampleSize`, `effectSize`, `confidence`, `confounders[]`, `verdict: supported \| unsupported \| insufficient_evidence`, `validatedAt` |

## 7.6 Required interfaces

**Ports:** `EventIngestor`, `EventSchemaRegistry`, `MetricStore`, `MetricReader`
(**implements 2D's port**), `HealthScoreEngine`, `AnomalyDetector`, `RootCauseAnalyzer`,
`Forecaster` (**implements 2D's port**), `ReviewLearningStore`, `ArchitectureGraphService`,
`ArchitectureViolationStore`, `LearningProposalPipeline`, `StatisticalValidator`.

**HTTP:** `POST /internal/events` (canonical ingestion), `GET /intelligence/metrics`,
`/series`, `/anomalies`, `/root-causes`, `/review-learning`, `/architecture/graph`,
`/architecture/scorecard`, `/architecture/violations`, `/learning-proposals`;
`POST /learning-proposals/[id]/validate|approve|reject|rollback`;
`POST /architecture/violations/[id]/accept` (authority-gated).

**Workflow:** `event-ingestion-runner`, `metric-rollup-scheduler`,
`health-score-scheduler`, `anomaly-sweep`, `architecture-graph-refresh` (on commit /
repository model invalidation), `review-learning-aggregation`, `forecast-calibration-sweep`.

**UI:** metric explorer; anomaly feed; review-learning panel (hotspots, weak gates,
escaped defects); architecture graph viewer with violations; scorecard; learning-proposal
queue with validation verdicts.

## 7.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Analytics never override truth** | §22: metrics, scores, and recommendations may not override repository truth, ADRs, policy, or authorized decisions. |
| **Learning proposals cannot auto-apply** | §12: validation is required before changing prompts, routing, thresholds, review depth, or policy. Recommended (D-2E-3): **no auto-apply at all in Phase 2.** Every applied proposal carries an approving authority and a rollback reference. |
| **Mandatory gates cannot be weakened** | §12: *"Propose improvements without weakening mandatory architecture, security, policy, or Founder gates."* A proposal that would lower a mandatory gate is rejected by the pipeline itself, not left to reviewer vigilance. |
| **Architecture debt acceptance is authority-gated** | Accepting a violation is a governed decision with an owner and an expiry (D-2E-4), not a suppression. |
| **Ingestion is not a write path to state** | Events describe what happened; ingesting an event never changes workflow state. |
| **Scope isolation** | Series, graphs, and scorecards are scope-keyed; cross-project aggregation requires a grant or is limited to non-identifying aggregates. |
| **Statistical honesty** | `insufficient_evidence` is a first-class verdict and must be selectable by the validator. A validator that can only say supported/unsupported will manufacture support. |
| **Model neutrality** | Per-model metrics are recorded (§13 requires binding execution to model identity) and inform 2H; they never authorize weakening review (§22). |

## 7.8 Observability

2E is the observability system, so its self-observability matters:

**Events:** `event.ingested|rejected|deduplicated|late_arrival`, `metric.computed|rolled_up`,
`healthscore.computed`, `anomaly.detected|resolved|false_positive`,
`rootcause.hypothesized`, `forecast.created|calibrated|suspended`,
`reviewlearning.weakness_identified`, `architecture.graph_refreshed|violation_detected|violation_accepted|violation_resolved`,
`learningproposal.created|validated|approved|rejected|applied|rolled_back`.

**Self-metrics:** ingestion lag and rejection rate; metric freshness; score computation
determinism (same inputs → same output, tested); anomaly precision and false-positive
rate; forecast calibration error by subject; **review-learning attribution accuracy**;
architecture graph staleness; learning-proposal approval and rollback rates.

## 7.9 Failure and recovery behavior

- **Malformed or uncorrelated events:** rejected with a recorded reason, never silently
  dropped and never partially ingested. A rejection rate above threshold is an alert.
- **Duplicate events:** `dedupeKey` makes ingestion idempotent, matching the 1E callback
  idempotency pattern.
- **Late arrival:** windows are re-computable; affected rollups are recomputed and marked
  as revised so a changed historical chart is explainable.
- **Schema evolution:** additive versions with a registry; a consumer requesting an
  unknown version gets an explicit error, not a coerced payload.
- **Metric computation failure:** the series records a gap, not a zero. Zero-instead-of-gap
  is the classic way analytics lie.
- **Anomaly storm:** rate-limited detection with grouping, so one incident does not produce
  a thousand anomalies.
- **Architecture graph derivation failure:** the previous snapshot is retained and marked
  stale; violations are not silently cleared because derivation broke (a cleared violation
  list is indistinguishable from a fixed codebase otherwise).
- **Learning proposal rollback:** every applied proposal has a recorded prior state and a
  tested rollback path; rollback is exercised in acceptance, not assumed.
- **Forecast divergence:** calibration error over threshold suspends the forecast subject
  and raises a learning proposal about the method.

## 7.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| E1 | One event vocabulary | Every subsystem (1E, 2A, 2B, 2C, 2D) emits canonical events; no second ingestion path exists |
| E2 | Full traceability | Every metric point resolves to its source events and, where applicable, candidate identity (§12) |
| E3 | Idempotent ingestion | Duplicate and replayed events produce identical series |
| E4 | Deterministic scores | Same inputs and weights version → identical score; property-tested |
| E5 | 2D port implemented | 2D's dashboards run unchanged on 2E's implementation; the projection is retired and historical discontinuity is labeled |
| E6 | Gaps are gaps | Missing data renders as a gap or insufficient-data, never as zero |
| E7 | Predictions carry confidence and assumptions | Every forecast; verified by schema and review |
| E8 | Review Learning identifies real weaknesses | On the real review history: hotspots, false-positive rates, missing tests, weak packet instructions, ineffective gates — each evidence-backed |
| E9 | Escaped-defect attribution | At least one real escaped defect traced to the reviews and gates that missed it |
| E10 | Architecture violations detected | Injected cycle, layer violation, and coupling increase are each detected; ADR non-compliance detected against ADR-0001/0002 |
| E11 | Violation acceptance is governed | Accepting a violation requires authority and an expiry; expiry re-raises it |
| E12 | Learning proposals cannot auto-apply | No code path applies a proposal without validation and approval; a proposal that would weaken a mandatory gate is rejected by the pipeline |
| E13 | Statistical validator can refuse | On deliberately thin data the verdict is `insufficient_evidence` |
| E14 | Rollback exercised | An applied learning proposal is rolled back with verified restoration |
| E15 | Scope isolation | No cross-project metric leakage without a grant |

## 7.11 Required evidence

Deterministic gates green; determinism property tests for scores (E4); ingestion
idempotency and replay report (E3); the 2D-projection→2E migration report with labeled
discontinuity (E5); Review Learning report on **real** review history (E8/E9) — this is
the evidence that Phase 1's accumulated reviews were worth keeping; architecture violation
injection report (E10); governed-acceptance and expiry transcript (E11); learning-proposal
rejection transcript for a gate-weakening proposal (E12); statistical validator refusal
transcript (E13); rollback execution evidence (E14); independent code review; architecture
review; security review (scope isolation, no write path); database review (time-series
schema, retention, rollups).

## 7.12 Reviewers

`observability-engineer` (**blocking** — canonical model and metric semantics are the
stage's core artifact), `architecture-reviewer` (**blocking** — including reviewing 2E's
own architecture-management output against ADR-0001/0002),
`independent-code-reviewer` (**blocking**), `data-engineer` (**blocking** — ingestion,
time series, rollups, attribution), `database-architect` (schema, retention),
`reliability-engineer` (idempotency, replay, late arrival, anomaly storms),
`security-engineer` (scope isolation, no write path), `qa-engineer`,
**Founder** (reserved: D-2E-2 weightings, D-2E-3 auto-apply, D-2E-4 debt acceptance).

## 7.13 Founder decisions

D-2E-1 (retention windows and rollup granularity), D-2E-2 (**health-score weightings** —
these drive prioritization, so they are a strategy decision), D-2E-3 (**whether any
learning proposal may auto-apply; recommendation: none in Phase 2**), D-2E-4 (architecture
debt acceptance authority and thresholds).

## 7.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2E-1 | Canonical event model + schema registry + idempotent ingestion + metric store + rollups; retrofit 1E/2A/2B/2C/2D emitters | L |
| 2E-2 | Health scores, trends, anomalies, root-cause hypotheses, forecasts; implement 2D's ports and retire the projection | L |
| 2E-3 | Review Learning Engine | M |
| 2E-4 | Continuous Architecture Management (graph, violations, scorecards, remediation proposals) | L |
| 2E-5 | Learning proposal pipeline + statistical validation service | M |
| 2E-6 | Engineering intelligence acceptance demonstration | S |

2E-3 and 2E-4 are mutually parallel-safe (§2.3 P2-20).

## 7.15 Explicit out-of-scope

- **Agent-level experience records and reputation** — 2F. 2E measures *outcomes*; 2F
  attributes *capability*. Blurring these is how unvalidated reputation gets created (R-4).
- **Model benchmarking and eval harnesses** — 2H. 2E provides the measurement substrate.
- **Business and product outcome intelligence** — Phase 3 (§14).
- **Automatic remediation of architecture violations** — proposals only; remediation is
  normal governed work.
- **Enterprise/organization-level intelligence across tenants** — Phase 4 (4H).
- **Automatic prompt tuning** — explicitly out; §12 requires validation, and D-2E-3
  recommends no auto-apply.

## 7.16 Completion gate

**Gate 2E signed when:** E1–E15 pass; the Review Learning report on real history produces
at least one actionable, evidence-backed weakness; architecture management detects real
violations in the actual repository (including any in Phase 1/2A–2D code — a finding here
is a success for 2E, not a failure of the earlier stage); 2D runs entirely on 2E's
implementation; blocking reviewers approve; the Founder accepts the weightings and the
auto-apply policy.

## 7.17 Capabilities accelerated after completion

- **2F becomes safe to build** — statistical validation exists, so experience claims can be
  validated rather than asserted (removes R-4, the most insidious risk in Phase 2).
- **2H becomes measurable** — benchmarks, A/B tests, and canaries have a measurement
  substrate and baselines (removes R-8).
- **2K gates become tunable** — effectiveness, false-positive rate, and escaped-defect
  attribution make gate decisions evidential rather than anecdotal (removes R-9).
- **2D becomes real** — forecasts, scenarios, and bottlenecks stop being projections.
- **The program becomes dateable** — capacity and throughput are measured, so §16.2's
  limitation is lifted.
- **Autonomous Readiness becomes computable**, which is the evidence path for authority
  expansion (§21) and eventually for Phase 3.
- **Architecture drift is caught continuously**, protecting every later stage from the
  coupling that large parallel programs naturally produce.

---

# 8. Stage 2F — Agent Memory and Organizational Learning System

*Roadmap authority: §10 (2F), §12A (full section), §21 (memory KPI block), §22
(memory prohibitions), Appendix K.*

## 8.1 Purpose

Give HQ **durable, evidence-backed memory of agent experience and organizational execution
outcomes** so routing and team formation improve over time **without turning historical
reputation into authority** (§10, 2F).

This stage is defined as much by its prohibitions as its capabilities. §12A and §22
together require that memory never replaces current repository evidence, tests, policy,
candidate-specific review, or required independent approval; that no single success,
failure, reviewer opinion, or model-generated summary becomes a durable expertise claim;
that reviewer independence survives a memory prediction that a familiar pairing works
well; and that no hidden personality profile or unsupported qualitative reputation
controls work allocation.

## 8.2 Entry criteria

- Gate 2E signed — the Statistical Validation Service exists. **2F must not start before
  it** (R-4).
- Gate 2C signed — the Knowledge Curator exists to validate organization-wide lessons
  (R-5).
- Gate 2A signed — temporary organizations exist, so team memory has subjects.
- Gate 2B signed — scope keys exist, so memory is isolated from birth (R-3).
- ADRs §2.7 #14 (memory classes, decay, authority boundaries), #15 (routing with
  exploration, reversibility, kill switch), #16 (privacy, retention, deletion) approved.
- D-2F-1 (whether memory-informed routing is enabled at all, and on which task classes
  first), D-2F-3 (retention/correction/export/deletion policy), D-2F-4 (cross-project
  experience transfer) recorded.
- Model identity is recorded on every execution (§13) — otherwise per-model experience is
  unattributable.

## 8.3 Dependencies

| Depends on | For |
|---|---|
| 2E statistical validation | Validating expertise and routing-impact claims before promotion (§12A) |
| 2E canonical events | The raw outcome stream memory is derived from |
| 2C Knowledge Curator | Validating organization-wide lessons; the promotion path out of memory into doctrine |
| 2A organizations | Team memory: pairings, structures, communication patterns, integration outcomes, coordination overhead, conflict history |
| 2B scope keys | Isolation by organization, tenant, project, repository, authority scope |
| Agent Capability Registry (1D) | The pre-memory baseline for routing; memory augments, never replaces it |
| Review subsystem (1E) | Reviewer feedback, revision history, findings — memory's evidence |
| P-4 / 2H model identity | Per-model, per-provider, per-version experience |

## 8.4 Required systems

| System | Responsibility |
|---|---|
| **Memory Class Separation** | Four distinct record families per §12A: execution memory, agent experience memory, team memory, institutional knowledge (the last owned by 2C). Ephemeral session context is explicitly *not* memory. |
| **Execution Memory Recorder** | Candidate-specific work history: actions, evidence, reviews, revisions, failures, recoveries, outcomes. Authoritative **only for the recorded execution**; never general doctrine automatically. |
| **Agent Experience Service** | Evidence-backed performance and expertise by task class, domain, repository, tool, model/provider, collaboration mode, review outcome. Holds the §12A three-part record: identity, evidence, assessment, plus explicit usage and **prohibited uses**. |
| **Team Memory Service** | Pairings, temporary-organization structures, communication patterns, integration outcomes, coordination overhead, conflict history, and the conditions under which a team performed well or poorly. |
| **Freshness & Decay Engine** | Decay schedules per claim; staleness marks; a stale claim is not retrieved as current. |
| **Contradiction & Supersession Engine** | Conflicting evidence freezes a claim rather than averaging it; supersession preserves lineage. |
| **Promotion Gate** | Evidence-backed promotion only: a single success, failure, reviewer opinion, or model-generated summary may **not** become a durable expertise claim. Requires 2E validation and minimum sample size. |
| **Challenge & Correction Workflow** | Agents may inspect and challenge material memory claims about their performance; corrections and supersession preserve lineage (§12A). |
| **Memory Retrieval Service** | Scope-, freshness-, authority-, and privacy-filtered retrieval returning confidence, sample size, and uncertainty. |
| **Routing & Team-Formation Advisor** | Advisory input to the Orchestrator and to 2A's builder: prefer demonstrated relevant performance while accounting for uncertainty, recency, independence, capacity, cost, and exploration needs. |
| **Exploration Controller** | Occasionally test alternative qualified agents to prevent permanent lock-in, hidden specialization errors, and self-reinforcing rankings (§12A). |
| **Independence Guard** | Reviewer assignment preserves independence even when memory predicts a familiar pairing performs well. |
| **Decision Trace Recorder** | Every memory-informed decision records which memories were used, their confidence and freshness, the alternative considered, and the resulting outcome (§12A). |
| **Harmful-Memory Detector** | Detect and quarantine memory whose use correlates with worse outcomes; §21 tracks harmful-memory incidents as a KPI. |
| **Kill Switch** | One action disables memory-informed routing globally or per task class, reverting to registry-only selection, with the change recorded. |
| **Privacy, Retention & Deletion Service** | Isolation, minimization, access control, retention, correction, export, archival, deletion — governed by policy and audit requirements. |

## 8.5 Required data models

| Model | Key fields |
|---|---|
| `ExecutionMemoryRecord` | `id`, `scopeKey`, `executionId`, `candidateId`, `actorId`, `roleId`, `modelIdentity`, `actions[]`, `evidenceIds[]`, `reviewIds[]`, `revisionCount`, `failures[]`, `recoveries[]`, `outcome`, `costs`, `timing`, `authoritativeFor: "this_execution_only"` |
| `AgentExperienceRecord` | `id`, `scopeKey`, **identity**: `actorId? \| roleId`, `modelIdentity?`, `taskClass`, `domainScope`, `repositoryScope`, `timeWindow`; **evidence**: `workItemIds[]`, `candidateIds[]`, `testRefs[]`, `reviewIds[]`, `findingIds[]`, `revisionRefs[]`, `incidentIds[]`, `costs`, `timing`, `collaborationRecordIds[]`, `outcomes[]`; **assessment**: `demonstratedStrengths[]`, `knownWeaknesses[]`, `confidence`, `sampleSize`, `uncertainty`, `freshness`, `contradictionState`, `decayScheduleId`; **usage**: `eligibleUses[]`, `prohibitedUses[]` |
| `ExpertiseClaim` | `id`, `experienceRecordId`, `claim`, `taskClass`, `evidenceRefs[]`, `sampleSize`, `validationResultId` (2E), `state: proposed \| validated \| rejected \| stale \| superseded \| frozen \| quarantined`, `promotedAt?`, `promotedByActorId?` |
| `RecurringMistakeRecord` | `id`, `experienceRecordId`, `pattern`, `occurrenceRefs[]`, `contextFactors[]`, `remediationRefs[]`, `knowledgeProposalId?` |
| `TeamMemoryRecord` | `id`, `scopeKey`, `organizationType`, `structure`, `memberRoleIds[]`, `pairings[]`, `communicationPattern`, `integrationOutcome`, `coordinationOverhead`, `conflictHistory[]`, `performedWellConditions[]`, `performedPoorlyConditions[]`, `evidenceRefs[]`, `sampleSize` |
| `PairingOutcome` | `id`, `actorAId`, `actorBId`, `roleRelationship`, `taskClass`, `outcomeQuality`, `reworkCount`, `coordinationCost`, `evidenceRefs[]` |
| `ConfidenceCalibration` | `id`, `subjectRef`, `taskClass`, `predictedSuccessRate`, `observedSuccessRate`, `sampleSize`, `calibrationError`, `window` |
| `DecaySchedule` | `id`, `claimKind`, `halfLife`, `staleThreshold`, `minimumSampleForRetention`, `rationale` |
| `ContradictionRecord` | `id`, `subjectClaimId`, `conflictingEvidenceRefs[]`, `state: open \| frozen \| resolved`, `resolution?`, `resolvedByActorId?` |
| `MemoryChallenge` | `id`, `challengedClaimId`, `challengerActorId`, `grounds`, `counterEvidenceRefs[]`, `state`, `outcome`, `reviewedByActorId?` |
| `MemoryCorrection` | `id`, `claimId`, `priorValue`, `correctedValue`, `rationale`, `evidenceRefs[]`, `correctedByActorId`, `supersededClaimId`, `correctedAt` |
| `AttributionContext` | `id`, `outcomeRef`, `taskDifficulty`, `packetQuality`, `modelIdentity`, `toolReliability`, `dependencyState`, `environmentState`, `reviewerQuality`, `rationale` — §12A: *"Negative outcomes remain attributable to context"* |
| `RoutingDecisionMemoryTrace` | `id`, `decisionRef`, `memoriesUsed[]` (`claimId`, `confidence`, `freshness`), `alternativesConsidered[]`, `explorationFlag`, `independenceCheckResult`, `resultingOutcomeRef?`, `regret?` |
| `ExplorationPolicy` | `id`, `taskClass`, `explorationRate`, `minimumAlternativeQualification`, `approvedByActorId`, `version` |
| `HarmfulMemoryIncident` | `id`, `claimId`, `harmObserved`, `evidenceRefs[]`, `detectedAt`, `quarantinedAt`, `resolution` |
| `MemoryAccessGrant` | `id`, `fromScope`, `toScope`, `purpose`, `grantedByActorId`, `expiresAt`, `revokedAt?` |
| `MemoryRetentionPolicy` | `id`, `memoryClass`, `retentionWindow`, `correctionRights`, `exportRights`, `deletionRules`, `auditRetention`, `approvedByActorId` |
| `MemoryKillSwitchState` | `id`, `scope: global \| task_class`, `enabled`, `changedByActorId`, `reason`, `changedAt` |

## 8.6 Required interfaces

**Ports:** `ExecutionMemoryRecorder`, `AgentExperienceStore`, `TeamMemoryStore`,
`MemoryRetriever`, `PromotionGate`, `DecayEngine`, `ContradictionEngine`,
`ChallengeWorkflow`, `RoutingAdvisor`, `ExplorationController`, `IndependenceGuard`,
`MemoryAuditService`, `MemoryKillSwitch`.

**HTTP:** `GET /memory/experience` (scoped), `/memory/experience/[id]`,
`/memory/team`, `/memory/traces`; `POST /memory/challenges`,
`/memory/challenges/[id]/resolve`; `POST /memory/claims/[id]/correct|quarantine`;
`GET/POST /memory/retention-policy`; `POST /memory/export`, `/memory/delete` (governed);
`POST /memory/kill-switch` (authority-gated); `GET /memory/health`.

**Integration points:** the Orchestrator's agent selection and 2A's Temporary Organization
Builder consume `RoutingAdvisor` **as an advisory input alongside** the Agent Capability
Registry, never as a replacement. The Review dispatch path consults `IndependenceGuard`
before honoring any memory preference.

**Workflow:** `memory-derivation-runner` (events → execution memory → candidate experience
updates), `decay-sweep`, `contradiction-sweep`, `calibration-sweep`,
`harmful-memory-detection-sweep`, `retention-enforcement-sweep`.

**UI:** agent experience viewer (with prohibited uses shown, not hidden); memory trace on
every routing decision; challenge queue; calibration panel; quarantine list; kill-switch
control in Mission Control with prominent state.

## 8.7 Security and authority boundaries

This section is the stage's core deliverable, not an addendum.

| Boundary | Rule | Source |
|---|---|---|
| **Memory is advisory, never authority** | Memory scores may not replace current repository evidence, tests, policy, candidate-specific review, or required independent approval. | §12A, §22 |
| **No promotion from thin evidence** | A single success, failure, reviewer opinion, or model-generated summary may not become a durable expertise claim or organizational rule. Promotion requires verified candidate identity, verified evidence, minimum sample size, and a 2E `ValidationResult` of `supported`. | §12A |
| **Patterns do not change the system** | Repeated patterns may create a *learning proposal*; they do not directly alter prompts, policy, architecture, authority, or institutional knowledge. | §12A |
| **Two validators, two jurisdictions** | The Knowledge Curator validates organization-wide lessons; Engineering Intelligence validates statistical claims and routing impact. Neither substitutes for the other. | §12A |
| **Blame requires context** | Negative outcomes are attributed only after considering task difficulty, packet quality, model, tools, dependencies, environment, and reviewer quality. `AttributionContext` is mandatory on any negative claim. | §12A |
| **Agents may challenge** | Material memory claims about an agent's performance are inspectable and challengeable; corrections and supersession preserve lineage. | §12A |
| **Independence is absolute** | Reviewer assignment preserves independence even when memory predicts a familiar pairing performs well. The `IndependenceGuard` runs after the advisor and can only remove candidates, never add them. | §12A, §19 |
| **Exploration is mandatory** | HQ must occasionally test alternative qualified agents to prevent permanent lock-in, hidden specialization errors, and self-reinforcing rankings. Exploration rate is policy (D-2F-2), and a zero rate requires explicit Founder approval. | §12A |
| **Every memory-informed decision is traced** | Which memories, their confidence and freshness, the alternative considered, the outcome. Untraced use of memory is a defect. | §12A |
| **Scope isolation** | Memory is isolated by organization, tenant, project, repository, and authority scope; cross-scope use requires a `MemoryAccessGrant` (D-2F-4). | §12A |
| **No hidden reputation** | No hidden personality profile or unsupported qualitative reputation may control work allocation. Every allocation-affecting claim is inspectable, evidenced, and attributable. | §12A |
| **Historical performance never weakens review** | Weakening mandatory review because an agent or model performed well historically is prohibited. The review-policy resolver must not accept memory as an input. | §22 |
| **Model neutrality** | Per-model experience informs 2H routing policy. It never creates a permanent binding, and a model swap does not inherit the prior model's expertise claims — claims are keyed to `modelIdentity`. | §0.4, §13 |

## 8.8 Observability

**Events:** `memory.execution_recorded`, `memory.experience_updated`,
`memory.claim_proposed|validated|rejected|promoted|stale|superseded|frozen|quarantined`,
`memory.contradiction_opened|resolved`, `memory.challenged|corrected`,
`memory.retrieved`, `routing.memory_informed|exploration_selected|independence_blocked`,
`memory.harmful_incident_detected`, `memory.killswitch_changed`,
`memory.retention_enforced|exported|deleted`.

**Metrics** (§21 memory block, verbatim): agent-memory precision, expertise-confidence
calibration, freshness/decay accuracy, memory-informed routing lift, pairing value,
challenge/correction rate, harmful-memory incidents.

**Plus:** exploration rate (actual vs. policy), independence-block frequency, routing
regret, claim promotion and rejection rates, quarantine count, trace completeness (target:
100% — an untraced memory-informed decision is a defect).

## 8.9 Failure and recovery behavior

- **Cold start:** with no memory, routing falls back to the Agent Capability Registry with
  no degradation. Memory is strictly additive; the system must work with memory empty.
- **Stale claim:** decay marks it; retrieval excludes it as current; routing reverts toward
  registry baseline. No silent use of expired confidence.
- **Contradiction:** the claim freezes rather than averaging conflicting evidence.
  Averaging is the failure mode that produces confident nonsense.
- **Harmful memory:** detection quarantines the claim, records a
  `HarmfulMemoryIncident`, and re-runs affected routing decisions' regret analysis.
- **Kill switch:** one action reverts to registry-only routing, globally or per task class.
  Must be exercised in acceptance (F-criteria), not merely implemented.
- **Miscalibration:** when calibration error exceeds threshold for a task class, memory
  influence for that class is automatically reduced or suspended and a learning proposal is
  raised.
- **Lock-in detection:** if one actor wins a task class beyond a threshold share without
  exploration, the exploration controller forces alternatives and raises an alert.
- **Challenge upheld:** correction supersedes the claim with lineage, and every routing
  decision that cited the corrected claim is marked for regret analysis — not silently left
  standing.
- **Deletion vs. audit conflict:** deletion honors policy while preserving the audit record
  of the deletion itself; the conflict is resolved by policy (D-2F-3), not ad hoc.
- **Memory derivation lag or failure:** routing proceeds on registry baseline; a derivation
  gap is recorded so later analysis knows the window was memory-blind.

## 8.10 Acceptance criteria

The roadmap's bar (§10, 2F): *"demonstrate that memory-informed routing and team formation
improve quality-adjusted outcomes on repeated task classes while remaining explainable,
reversible, privacy-safe, and resistant to stale or misleading history."*

| # | Criterion | Pass condition |
|---|---|---|
| F1 | Four memory classes are structurally distinct | Execution / experience / team / institutional are separate records with separate authority; session context is not persisted as memory |
| F2 | Execution memory is not doctrine | No path promotes an execution record to general guidance without the promotion gate |
| F3 | Promotion requires evidence | Single success, single failure, reviewer opinion, and model-generated summary are each **rejected** as promotion inputs; verified by four negative tests |
| F4 | Sample size and validation enforced | Promotion requires a 2E `ValidationResult` of `supported`; `insufficient_evidence` blocks it |
| F5 | Attribution context mandatory on negative claims | A negative claim without `AttributionContext` cannot be created |
| F6 | Challenge and correction work | An agent challenges a claim; the challenge is adjudicated; correction supersedes with lineage; citing decisions are marked for regret analysis |
| F7 | Decay and staleness | A claim past its stale threshold is excluded from retrieval as current; freshness accuracy measured |
| F8 | Contradiction freezes | Conflicting evidence freezes rather than averages |
| F9 | Independence preserved | Memory predicting a favorable reviewer pairing does **not** override independence; the guard blocks and records it |
| F10 | Exploration prevents lock-in | Measured exploration rate matches policy; a lock-in scenario triggers forced alternatives |
| F11 | Full traceability | 100% of memory-informed decisions carry a complete trace (memories, confidence, freshness, alternative, outcome) |
| F12 | Reversibility | The kill switch is exercised: memory influence off → registry-only routing → system continues correctly; state change recorded |
| F13 | Scope isolation | Experience from project A does not influence project B routing without a `MemoryAccessGrant`; adversarial probe confirms |
| F14 | No hidden reputation | Every allocation-affecting claim is inspectable in the UI with evidence and prohibited uses; no unexposed scoring exists |
| F15 | Review depth unaffected by reputation | The review-policy resolver has no memory input; a high-reputation agent still gets the policy-required review |
| F16 | Quality-adjusted improvement demonstrated | On a repeated task class, memory-informed routing improves quality-adjusted outcomes vs. the registry baseline, with 2E validation and stated confidence |
| F17 | Resistance to misleading history | Injected misleading history (a lucky streak, a stale specialization, a biased reviewer's opinions) does not produce a promoted claim |
| F18 | Privacy, retention, export, deletion | Each is exercised end to end and preserves audit history |
| F19 | Cold start | With memory emptied, the system routes correctly on the registry alone |

**Honest-gate note on F16:** if memory-informed routing does **not** improve
quality-adjusted outcomes, the correct gate outcome is to record that finding and ship with
memory-informed routing **disabled** (advisory recording only). The capability, its
governance, and its measurement would still be complete. Claiming improvement that the data
does not support would violate §22's prohibition on treating remembered success as proof.

## 8.11 Required evidence

Deterministic gates green; the four negative promotion tests (F3) as a named suite; the
misleading-history injection report (F17) — this is the stage's most important adversarial
evidence; the F16 comparison with 2E validation output attached, including the
`insufficient_evidence` case if that is the honest verdict; trace-completeness audit
(target 100%); kill-switch execution transcript (F12); independence-guard block transcript
(F9); exploration-rate measurement against policy (F10); cross-scope isolation probe (F13);
privacy/retention/export/deletion transcripts (F18); cold-start transcript (F19);
independent code review; architecture review; **security and privacy review (blocking)**;
statistical review of the F16 methodology by 2E.

## 8.12 Reviewers

`security-engineer` (**blocking** — privacy, isolation, deletion, no hidden profile),
`architecture-reviewer` (**blocking** — memory-as-advisory boundary, no authority path,
independence guard placement), `independent-code-reviewer` (**blocking**),
`observability-engineer` / 2E owner (**blocking** — statistical methodology for F16 and
calibration), `reliability-engineer` (kill switch, cold start, decay sweeps),
`data-engineer` (derivation pipeline, attribution), `Knowledge Curator` (the 2C promotion
boundary), `qa-engineer` (adversarial suites F3/F17), `product-owner` (is the experience
viewer honest and legible), **Founder** (**blocking, reserved** — D-2F-1 through D-2F-4).

## 8.13 Founder decisions

D-2F-1 (**whether memory-informed routing is enabled at all, and on which task classes
first** — recommendation: ship recording-only, enable influence on one low-risk task class
after F16), D-2F-2 (exploration rate), D-2F-3 (retention, correction, export, deletion
policy), D-2F-4 (whether experience transfers across projects and under what grant —
recommendation: **no by default**, explicit grant only).

## 8.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2F-1 | Memory class separation + execution memory recorder + derivation pipeline from canonical events | L |
| 2F-2 | Agent/role experience records, decay/freshness, contradiction/supersession, retrieval with scope filtering | L |
| 2F-3 | Team memory + pairing outcomes + coordination attribution | M |
| 2F-4 | Promotion gate (with 2E validation), attribution context, challenge and correction workflow | M |
| 2F-5 | Routing/team-formation advisor + exploration controller + independence guard + decision traces + kill switch | L |
| 2F-6 | Privacy, retention, correction, export, deletion, audit; harmful-memory detection and quarantine | M |
| 2F-7 | Memory acceptance demonstration incl. F16 and F17 | M |

2F-5 must ship the advisor, exploration controller, independence guard, traces, and kill
switch **in one change** (§2.5 #8) — an advisor without its controls is not shippable.

## 8.15 Explicit out-of-scope

- **Institutional knowledge promotion** — 2C owns it. 2F raises proposals; the Curator
  validates and publishes.
- **Model benchmarking** — 2H. 2F records per-model *experience in real work*; 2H runs
  controlled *benchmarks*. Both feed routing; neither replaces the other.
- **Human performance evaluation** — explicitly out of scope for Phase 2, and any future
  extension is a Founder decision with employment and privacy implications far beyond this
  plan.
- **Cross-project reputation transfer by default** — requires a grant (D-2F-4).
- **Automatic prompt or packet rewriting from memory** — proposals only.
- **Learned team-formation models** — mature version, after sufficient team memory exists.
- **Memory-driven authority changes** — never. Authority is §2 reserved.
- **Enterprise/tenant-wide reputation** — Phase 4.

## 8.16 Completion gate

**Gate 2F signed when:** F1–F19 pass; the misleading-history and negative-promotion suites
pass; trace completeness is 100%; the kill switch is demonstrated; F16 has an honest
verdict (improvement demonstrated **or** recorded as unsupported with memory influence
shipped disabled); privacy and security reviews approve; and the Founder explicitly decides
D-2F-1 rather than inheriting a default.

## 8.17 Capabilities accelerated after completion

- **2A team formation gets evidence** — pairings, structures, and coordination overhead
  inform the builder instead of heuristics alone.
- **2H routing policy gets real-world signal** to complement controlled benchmarks, and
  because claims are keyed to `modelIdentity`, a model swap is measurable rather than
  disruptive — which is what makes §0.4 replaceability practical rather than nominal.
- **2G collaboration** gets pairing value and mentoring signal.
- **Smart Work Packets improve** — known pitfalls and recurring mistakes for the specific
  actor and task class land in the packet.
- **Reviewer assignment improves** without weakening independence.
- **Escalation improves** — the system knows which classes of work it historically handles
  poorly and can escalate earlier rather than after exhausting retries.
- **Autonomous Readiness gains a real input** — calibrated self-knowledge is what
  distinguishes autonomy level 4 from level 3.

---

# 9. Stage 2G — Advanced Collaboration

*Roadmap authority: §10 (2G), §4A (Controlled Agent Communication), §13 (Human
Collaboration), §13A (Communication and Decision Discipline), §19.*

## 9.1 Purpose

Allow agents and humans to cooperate **when collaboration improves quality or speed**,
without letting conversation become a source of authority: structured cross-packet
questions, dependency notices, evidence broadcasts, conflict escalation, and decision
requests; temporary direct collaboration sessions with a named lead, time and budget box,
transcript, decision capture, and mandatory Work Management write-back; independent
execution, pair sessions, temporary groups, threads, mentions, and shared evidence — with
independent review preserved wherever policy requires it.

## 9.2 Entry criteria

- **D-P4 satisfied: the ADR-0001/0002 governed-communication amendment is approved** (§1.3).
  Without it, 2G is blocked in its entirety, not merely delayed (R-6).
- Gate 2F signed.
- 2A-6 Communication Broker delivered (it is gated on the same ADR); 2G extends it.
- ADR §2.7 #17 (collaboration session authority and independence guard) approved.
- D-2G-1 (session budget/duration ceilings; who may open a session), D-2G-2 (which reviewer
  roles are barred from sessions on candidates they will review), D-2G-3 (whether human
  participants are in Phase 2 scope) recorded.

## 9.3 Dependencies

| Depends on | For |
|---|---|
| 2A-6 Communication Broker | Message transport, attribution, budgeting, write-back enforcement |
| 2A organizations | Sessions and channels are scoped to an organization and its packets |
| 2F memory | Pairing value, mentoring signal, collaboration-mode outcomes |
| 2E events | Collaboration value measurement |
| Review subsystem (1E) | The independence constraints the guard enforces |
| Policy engine (§17) | Session authority as versioned policy |
| Mission Control (1F) | Threads, mentions, notifications surface |

## 9.4 Required systems

| System | Responsibility |
|---|---|
| **Structured Channel Service** | Four message kinds — question, dependency notice, evidence broadcast, decision request — each with impact, urgency, and required response (§4A) |
| **Dependency Notice Service** | Cross-packet dependency signals that create durable dependency records, not just messages |
| **Evidence Broadcast Service** | Share evidence across packets by reference, so evidence is never duplicated or re-derived |
| **Decision Request Service** | Route a decision to the role with authority; unresolved requests block rather than default |
| **Conflict Escalation Service** | Reviewer and packet disagreement escalates with evidence to the proper authority (§4A: *"Unresolved reviewer disagreement blocks approval or escalates"*) |
| **Collaboration Session Manager** | Temporary direct sessions with purpose, participants, named lead, authority, duration, budget, exit criteria, transcript, and decision summary (§4A, §13) |
| **Write-Back Enforcer** | Material decisions become decision records; useful findings become evidence or knowledge proposals. Missing write-back blocks session and organization closeout. |
| **Independence Guard (collaboration scope)** | Prevent a required independent reviewer from participating in a session that would compromise independence (D-2G-2) |
| **Thread & Mention Service** | Threads on work items, candidates, findings, and decisions; mentions with notification routing |
| **Human Actor Integration** | Humans and agents share the same work items, evidence, permissions, decisions, and audit model (§13) |
| **Collaboration Value Measurement** | Did the collaboration improve quality or speed, and at what coordination cost |

## 9.5 Required data models

| Model | Key fields |
|---|---|
| `CollaborationSession` | `id`, `scopeKey`, `organizationId?`, `purpose`, `leadActorId`, `participantIds[]`, `authorityGrantId`, `startedAt`, `durationCeiling`, `budgetCeiling`, `exitCriteria`, `state`, `closedAt?`, `closeoutVerdict` |
| `SessionParticipant` | `sessionId`, `actorId`, `actorKind: agent \| human`, `roleId`, `grantedAuthority`, `independenceRestrictions[]`, `joinedAt`, `leftAt?` |
| `SessionTranscript` | `id`, `sessionId`, `entries[]` (`actorId`, `modelIdentity?`, `content`, `at`), `checksum`, `retentionPolicyRef` |
| `SessionDecision` | `id`, `sessionId`, `statement`, `rationale`, `evidenceRefs[]`, `decidedByActorId`, `authorityLevel`, `decisionRecordId` (Work Management), `at` |
| `StructuredMessage` | (extends 2A) `+ threadId?`, `respondedAt?`, `responseRef?`, `slaBreach?` |
| `DependencyNotice` | `id`, `fromPacketId`, `toPacketId`, `assertion`, `impact`, `createdDependencyRecordId`, `acknowledgedAt?` |
| `EvidenceBroadcast` | `id`, `evidenceId`, `fromPacketId`, `toPacketIds[]`, `rationale`, `consumedBy[]` |
| `DecisionRequest` | `id`, `requestedByActorId`, `subjectRef`, `question`, `options[]`, `recommendation?`, `requiredAuthorityLevel`, `state`, `resolvedByActorId?`, `resolutionRef?`, `blockedWorkItemIds[]` |
| `ConflictEscalation` | `id`, `subjectCandidateId`, `conflictingFindingIds[]`, `positions[]`, `evidenceRefs[]`, `escalatedToActorId`, `resolution?`, `resolutionAuthority` |
| `Thread` / `Message` / `Mention` | standard: `id`, `subjectRef`, `participants[]`, `messages[]`; `mention` → `actorId`, `notificationState` |
| `WriteBackRecord` | `id`, `sourceKind: session \| message \| thread`, `sourceId`, `outcomeKind: decision \| evidence \| knowledge_proposal \| dependency \| none_required`, `outcomeRef?`, `verifiedAt`, `verifiedByActorId` |
| `HumanActor` | `id`, `identityRef`, `roleIds[]`, `authorityGrants[]`, `notificationPreferences`, `status` |
| `CollaborationValueSample` | `id`, `sessionId \| threadId`, `qualityDelta`, `speedDelta`, `coordinationCost`, `attributedBy`, `evidenceRefs[]` |

## 9.6 Required interfaces

**Ports:** `ChannelService`, `SessionManager`, `WriteBackEnforcer`,
`CollaborationIndependenceGuard`, `ThreadStore`, `MentionRouter`, `DecisionRequestStore`,
`ConflictEscalationStore`, `HumanActorDirectory`, `CollaborationValueRecorder`.

**HTTP:** `POST /collaboration/sessions` (+ `/close`), `GET /collaboration/sessions/[id]`
(+ `/transcript`, `/decisions`); `POST /collaboration/messages`, `/notices`,
`/broadcasts`, `/decision-requests` (+ `/resolve`), `/conflicts` (+ `/resolve`);
`GET/POST /threads`, `/threads/[id]/messages`; `GET /collaboration/writebacks`.

**UI:** session view with live transcript and box countdown; decision request inbox
(routed by authority); conflict escalation view with both positions and evidence; threads
on work items/candidates/findings; mention notifications (reusing 1F push); write-back
status on session closeout.

## 9.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Conversation is never authority** | §13A: *"Chat or session output alone never changes scope, authority, candidate identity, or approval status."* The session runtime has no write path to those fields. |
| **Session authority = intersection** | A session's authority is the intersection of its participants' grants, further bounded by the session's own grant. A session can never do what its participants individually could not. |
| **No silent cross-packet mutation** | §4A: *"Agents cannot silently change another packet's scope, interface, candidate, or authority."* Cross-packet change requires a dependency record or decision record, produced through the owning packet. |
| **Mandatory write-back** | Missing write-back blocks session closeout and organization dissolution. This is the mechanism that prevents §22's *"ungoverned collaboration, hidden manual steps, untracked decisions."* |
| **Independence preserved** | Per D-2G-2, a required independent reviewer may not participate in an implementation session for the candidate it will review. Enforced by the guard at join time, not by convention. |
| **Boxed** | Every session has a duration and budget ceiling; expiry closes the session with whatever write-back exists and records the truncation. |
| **Transcript retention and sensitivity** | Transcripts are durable evidence and subject to retention policy and secret scanning. Secrets must not enter transcripts (§17). |
| **Humans get no exemption** | §19: a human engineer/reviewer *"must not substitute for automatic exemption from evidence and authority rules."* Human participation follows the same evidence, authority, and audit model. |
| **Model neutrality** | Every session entry records the participating model identity; a session is not bound to a model, and models may change between sessions. |

## 9.8 Observability

**Events:** `session.opened|joined|left|extended|expired|closed`,
`session.decision_recorded`, `message.sent|responded|unanswered_sla_breach`,
`notice.raised|acknowledged`, `broadcast.shared|consumed`,
`decisionrequest.created|resolved|blocking`, `conflict.escalated|resolved`,
`writeback.recorded|missing|closeout_blocked`, `independence.join_blocked`,
`thread.created`, `mention.sent|read`.

**Metrics:** collaboration value (quality delta, speed delta, coordination cost), session
count and duration distribution, budget consumption, write-back completeness (target 100%),
unanswered-message rate, decision-request latency, conflict escalation frequency and
resolution time, independence-block frequency, session-to-decision conversion rate.

## 9.9 Failure and recovery behavior

- **Session expiry mid-discussion:** the session closes, the transcript is preserved, and an
  explicit "unresolved at expiry" record is created. Nothing is inferred as decided.
- **Missing write-back:** closeout is blocked; an escalation is raised naming the missing
  outcome. Organizations cannot dissolve with outstanding write-back.
- **Unanswered message:** SLA breach event; the requesting packet is not silently blocked
  forever — it escalates.
- **Unresolved conflict:** blocks approval and escalates to the proper authority (§4A). It
  never resolves by majority, seniority, or timeout.
- **Participant loss (crash, context exhaustion):** the session continues if the lead
  remains; if the lead is lost, the session pauses and reassigns the lead or closes with
  partial write-back. CLM rollover applies to session participants.
- **Budget exhaustion:** session closes at the ceiling; truncation is recorded.
- **Independence violation attempt:** join is denied and recorded as a policy event, not a
  silent filter.
- **Transcript integrity failure:** checksum mismatch invalidates the transcript as evidence
  and raises an integrity escalation.

## 9.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| G1 | Four message kinds work end to end | Question, dependency notice, evidence broadcast, decision request — each durable, attributable, budgeted |
| G2 | Conversation cannot change state | Adversarial attempts to change scope, interface, candidate identity, authority, or approval via session/message all fail |
| G3 | Session contract complete | Every session records purpose, roles, lead, duration, budget, authority, exit criteria, and write-back (§13) |
| G4 | Write-back enforced | A session with material decisions and no write-back cannot close; the organization cannot dissolve |
| G5 | Independence guard blocks | A required reviewer attempting to join a disallowed session is denied and recorded |
| G6 | Cross-packet safety | No packet can change another packet's scope/interface/candidate/authority; attempted change routes through the owning packet |
| G7 | Conflict escalation | Contradictory reviewer positions escalate with both positions and evidence; no automatic resolution |
| G8 | Decision requests block correctly | Unresolved requests block dependent work rather than defaulting |
| G9 | Boxing enforced | Duration and budget ceilings close sessions and record truncation |
| G10 | Human participation (if in scope per D-2G-3) | A human participates with the same work items, evidence, permissions, decisions, and audit model; no exemptions |
| G11 | Collaboration value measured | At least one session with a recorded quality/speed delta and coordination cost |
| G12 | Transcript integrity | Checksums verified; a tampered transcript is rejected as evidence |
| G13 | Secrets excluded | A planted secret in a session is caught by scanning and does not persist in the transcript or knowledge |

## 9.11 Required evidence

Deterministic gates green; the G2 adversarial suite (the stage's central proof — that
conversation has no authority path); write-back blocking transcript (G4);
independence-block transcript (G5); conflict escalation transcript (G7); boxing/truncation
transcript (G9); collaboration value sample with attribution (G11); transcript-tamper
rejection (G12); secret-scan transcript (G13); independent code review; architecture review
(**explicitly against the amended ADR from D-P4**); security review (session authority
intersection, transcript sensitivity, human authority).

## 9.12 Reviewers

`architecture-reviewer` (**blocking** — this stage exists only because an ADR invariant was
amended; compliance with the amendment is the gate), `security-engineer` (**blocking** —
authority intersection, transcripts, human actors), `independent-code-reviewer`
(**blocking**), `reliability-engineer` (participant loss, expiry, rollover),
`claude-design` (session, thread, decision-inbox UX; notification behavior),
`qa-engineer` (G2 adversarial suite), `product-owner` (does collaboration measurably help),
**Founder** (reserved: D-2G-1, D-2G-2, D-2G-3).

## 9.13 Founder decisions

D-P4 (the communication ADR — **prerequisite**), D-2G-1 (session budget/duration ceilings;
who may open sessions), D-2G-2 (which reviewer roles are barred from which sessions),
D-2G-3 (whether human participants are in Phase 2 scope or deferred to Phase 4 workspaces).

## 9.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2G-1 | Structured channels (4 kinds), dependency notices, evidence broadcasts, decision requests, conflict escalation | L |
| 2G-2 | Collaboration Session Manager, transcripts, decision capture, write-back enforcer, boxing | L |
| 2G-3 | Human actor integration, threads, mentions, independence guard, collaboration value measurement | M |
| 2G-4 | Collaboration acceptance demonstration incl. the G2 adversarial suite | M |

## 9.15 Explicit out-of-scope

- **Interactive pair engineering surface** — 2J (a specialization of sessions).
- **Enterprise Human-AI workspaces** — Phase 4 (4D).
- **Real-time voice/video, external chat integrations (Slack, etc.)** — Phase 4 (4F
  integration fabric).
- **Cross-organization collaboration** — Phase 4.
- **Unbounded free-form agent chat** — permanently out of scope; §22 prohibits ungoverned
  collaboration, and boxing plus write-back is the boundary.
- **Consensus-based decision making** — out of scope by design; §4A requires *one*
  authoritative final decision, not a vote.

## 9.16 Completion gate

**Gate 2G signed when:** G1–G13 pass (G10 per D-2G-3 scope); the G2 adversarial suite shows
zero successful state changes via conversation; write-back completeness is 100%; the
architecture reviewer confirms compliance with the amended communication ADR; the Founder
accepts the session authority model.

## 9.17 Capabilities accelerated after completion

- **2A organizations get cheaper coordination** — cross-packet questions and dependency
  discovery stop routing through the Founder or through re-derivation.
- **2J becomes a thin specialization** rather than a new subsystem.
- **2I research** gains structured decision requests for the architecture questions research
  surfaces.
- **2F memory** gains collaboration-mode outcomes and mentoring signal.
- **Conflict resolution latency drops**, which is a §21 flow metric and a common
  large-review bottleneck.
- **Human engineers can enter the loop** without a separate process, which is the bridge to
  Phase 3's mixed delivery and Phase 4's workspaces.

---

# 10. Stage 2H — Model Management Platform

*Roadmap authority: §10 (2H), §13 (Model Management Platform), §4, §17, §22, §0.4 of this
plan.*

## 10.1 Purpose

Manage the **lifecycle of models and providers**: benchmarks, latency, cost, reliability,
context behavior, tools, safety, and structured-output quality; versioned routing, A/B
tests, shadow evaluation, safe upgrades, rollback, deprecation, and model cards; and
binding of every model-assisted execution and decision to exact identity and configuration.

**This stage is the enforcement mechanism for §0.4.** Provider portability is a
non-negotiable principle (§Principles: *"Roles are not permanently bound to providers.
Routing uses measured capability, context, cost, latency, reliability, policy, and
independence."*). 2H is where that stops being a principle and becomes a mechanism: a
registry, an expiring revocable binding record, a versioned policy, a benchmark, a canary,
and a rollback path.

## 10.2 Entry criteria

- Gate 2G signed.
- Gate 2E signed — benchmarks and canaries need a measurement substrate and baselines
  (R-8).
- Gate 2F signed — real-world per-model experience complements controlled benchmarks.
- ADRs §2.7 #18 (registry, versioned routing, binding revocability) and #19 (promotion,
  rollback, deprecation, data policy) approved.
- D-2H-1 (approved provider list, data-policy requirements, spend ceilings), D-2H-2
  (promotion authority and canary criteria), D-2H-3 (**maximum binding lifetime before
  mandatory re-evaluation**), D-2H-4 (benchmark suite and per-role quality bar) recorded.
- P-4's model resolution indirection is in place and **no hardcoded model reference exists
  anywhere in orchestration, routing, or policy code** — verified by a repository-wide check
  that becomes a permanent lint/test.

## 10.3 Dependencies

| Depends on | For |
|---|---|
| P-4 model indirection | The port 2H implements; without it, 2H is a rewrite of every stage |
| 2E metrics and validation | Benchmark scoring, canary comparison, promotion evidence, rollback triggers |
| 2F experience memory | Real-work per-model signal by task class (soft dependency) |
| 2B project scope | Per-project routing policy and provider constraints |
| Credential broker (§17) | Provider credentials, rotation, revocation, environment separation |
| Policy engine (§17) | Routing policy as versioned policy with recorded decisions |
| 2A organizations | Per-packet model selection |

## 10.4 Required systems

| System | Responsibility |
|---|---|
| **Provider & Model Registry** | Provider, model, version, context window, tools, structured output, data policy, safety, cost, latency, reliability, approved use cases (§13) |
| **Model Card Service** | Human-readable card per model version: capabilities, limits, data policy, approved and prohibited uses, benchmark results, known failure modes |
| **Binding Registry** | **The §0.4 enforcement point.** Role↔model bindings as versioned records with an approving authority, an **expiry**, a revocation path, and a rollback target. No permanent bindings exist by construction. |
| **Capability Profile Service** | Measured capability by role dimension: planning, coding, review, architecture, research, restoration, tool use (§13) |
| **Benchmark Harness** | Reproducible suites per role dimension with fixed inputs, recorded outputs, and scoring; versioned so results are comparable over time |
| **Eval Runner** | Structured-output quality, tool-call correctness, context-behavior probes, refusal/safety behavior, latency and cost measurement |
| **Routing Policy Service** | Versioned policies resolving role + task class + project + risk → model binding, with the resolution recorded on every execution |
| **A/B Test Service** | Controlled experiments between bindings with pre-registered hypotheses and stopping rules |
| **Shadow Evaluation Service** | Run a candidate model alongside production without acting on its output; compare offline |
| **Canary & Promotion Service** | Staged rollout with pre-declared success criteria and automatic rollback triggers |
| **Rollback Service** | Restore the prior binding immediately, with evidence of the regression that triggered it |
| **Deprecation Manager** | Deprecation notices, migration windows, forced re-binding before end-of-life |
| **Usage & Economics Telemetry** | Per-binding cost, latency, reliability, token consumption, cache effectiveness, error taxonomy |
| **Data Policy Enforcement** | Per-model data-handling constraints enforced at the call boundary, not by convention |

## 10.5 Required data models

| Model | Key fields |
|---|---|
| `Provider` | `id`, `name`, `status`, `credentialRef`, `rateLimits`, `dataPolicyRef`, `approvedByActorId`, `spendCeiling` |
| `ModelVersion` | `id`, `providerId`, `modelKey`, `version`, `contextWindow`, `toolSupport`, `structuredOutputSupport`, `safetyProfile`, `costProfile`, `latencyProfile`, `reliabilityProfile`, `status: candidate \| approved \| deprecated \| retired`, `approvedUseCases[]`, `prohibitedUseCases[]` |
| `ModelCard` | `id`, `modelVersionId`, `summary`, `capabilities`, `limits`, `dataPolicy`, `knownFailureModes[]`, `benchmarkRunIds[]`, `publishedAt`, `version` |
| `RoutingPolicy` | `id`, `version`, `scopeKey`, `rules[]` (`roleId`, `taskClass`, `riskLevel`, `requiredCapabilities[]`, `preferredBindingId`, `fallbackBindingIds[]`), `approvedByActorId`, `effectiveFrom`, `supersededBy?` |
| **`RoutingPolicyBinding`** | `id`, `policyVersion`, `roleId`, `modelVersionId`, `scopeKey`, `rationale`, `evidenceRefs[]` (benchmarks, experience, canary), `approvedByActorId`, `effectiveFrom`, **`expiresAt` (required, non-null)**, `revokedAt?`, `revokedByActorId?`, `rollbackTargetBindingId`, `state` |
| `CapabilityProfile` | `id`, `modelVersionId`, `dimension`, `score`, `sampleSize`, `benchmarkRunIds[]`, `measuredAt`, `confidence` |
| `BenchmarkSuite` | `id`, `version`, `dimension`, `cases[]`, `scoringMethod`, `passThreshold`, `approvedByActorId` |
| `BenchmarkRun` | `id`, `suiteId`, `suiteVersion`, `modelVersionId`, `startedAt`, `results[]`, `aggregateScore`, `cost`, `latencyStats`, `reproducibilitySeed`, `evidenceRefs[]` |
| `EvalResult` | `id`, `benchmarkRunId`, `caseId`, `expected`, `actual`, `verdict`, `failureCategory?`, `artifactRefs[]` |
| `ExperimentDefinition` | `id`, `kind: ab \| shadow \| canary`, `controlBindingId`, `treatmentBindingId`, `hypothesis`, `metrics[]`, `minimumSampleSize`, `stoppingRule`, `guardrails[]`, `approvedByActorId`, `state` |
| `ExperimentObservation` | `id`, `experimentId`, `executionId`, `arm`, `metricValues`, `outcomeRef` |
| `ShadowEvaluation` | `id`, `modelVersionId`, `sourceExecutionIds[]`, `comparisons[]`, `divergenceSummary`, `actedUpon: false` |
| `PromotionRecord` | `id`, `fromBindingId`, `toBindingId`, `canaryEvidenceRefs[]`, `successCriteria`, `criteriaMet`, `approvedByActorId`, `authorityLevel`, `promotedAt` |
| `RollbackRecord` | `id`, `fromBindingId`, `toBindingId`, `trigger: automatic \| manual`, `regressionEvidenceRefs[]`, `executedAt`, `verifiedAt` |
| `DeprecationNotice` | `id`, `modelVersionId`, `reason`, `announcedAt`, `migrationDeadline`, `affectedBindingIds[]`, `migrationState` |
| `ModelUsageRecord` | `id`, `executionId \| decisionId`, `modelVersionId`, `bindingId`, `policyVersion`, `configuration`, `promptRef`, `tokensIn`, `tokensOut`, `cacheHitRatio`, `latency`, `cost`, `outcomeRef` |
| `DataPolicyRecord` | `id`, `providerId \| modelVersionId`, `retentionBehavior`, `trainingUse`, `residency`, `prohibitedDataClasses[]`, `enforcementPoints[]`, `approvedByActorId` |

## 10.6 Required interfaces

**Ports:** `ModelRegistry`, `ModelCardStore`, `BindingRegistry`, `ModelResolver`
(**implements the P-4 port**), `CapabilityProfileStore`, `BenchmarkRunner`, `EvalRunner`,
`RoutingPolicyService`, `ExperimentService`, `ShadowEvaluator`, `PromotionService`,
`RollbackService`, `DeprecationManager`, `ModelUsageRecorder`, `DataPolicyEnforcer`.

**HTTP:** `GET /models`, `/models/[id]/card`, `/providers`; `GET/POST /routing-policies`
(+ `/versions`); `GET/POST /bindings` (+ `/[id]/revoke`, `/[id]/renew`);
`POST /benchmarks/runs`; `GET /benchmarks/runs/[id]`; `POST /experiments` (+ `/stop`);
`POST /promotions`, `/rollbacks`; `GET/POST /deprecations`; `GET /models/usage`.

**Workflow:** `benchmark-runner` (durable, resumable, per-suite),
`shadow-evaluation-runner`, `canary-monitor` (evaluates success criteria and fires
automatic rollback), `binding-expiry-sweep` (**the mechanism that makes non-permanence
real** — bindings approaching expiry raise a re-evaluation task; expired bindings fall back
to the prior approved binding rather than continuing silently), `deprecation-migration-sweep`.

**UI:** model catalog with cards; capability comparison matrix; binding list with
**expiry countdown** and revoke action; routing policy editor with version diff; experiment
dashboard; canary status with live success criteria; rollback button with evidence
requirement; deprecation timeline; per-binding cost and reliability panel.

## 10.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **No permanent binding** | `RoutingPolicyBinding.expiresAt` is non-nullable. A binding with no expiry cannot be created. D-2H-3 sets the maximum lifetime. This is the schema-level enforcement of §0.4 — not documentation, a constraint. |
| **No hardcoded model references** | Enforced by a permanent repository check in CI: model identifiers may appear only in registry data and migrations, never in orchestration, routing, policy, or agent code. §22 prohibits hardcoding providers into generic orchestration. |
| **Promotion is authority-gated** | D-2H-2 sets L4 or L5. Promotion requires canary evidence and pre-declared criteria that were actually met — not a judgment call after the fact. |
| **Rollback is always available** | Every binding records a `rollbackTargetBindingId`. A binding whose rollback target is unavailable cannot be promoted. |
| **Provider credentials are brokered** | Short-lived, narrowly scoped, rotatable, revocable, environment-separated (§17). No raw provider keys in prompts, logs, checkpoints, or artifacts. |
| **Data policy enforced at the call boundary** | Prohibited data classes cannot reach a model whose policy forbids them; enforcement is in the resolver/caller path, not in reviewer vigilance. |
| **Every execution binds to exact identity** | §13: *"Bind every model-assisted execution and decision to exact identity and configuration."* Missing model identity makes an execution unattributable and should fail validation. |
| **Benchmarks are not authority over review** | A high benchmark score never reduces required review depth (§22). The review-policy resolver takes no model input. |
| **Spend ceilings** | Per-provider and per-project ceilings (D-2H-1) enforced before dispatch, composing with 2A/2B budgets. |
| **Independence in routing** | Where policy requires independence, the router must be able to select a *different* model for the reviewer than the implementer, and this must be expressible in policy. |

## 10.8 Observability

**Events:** `model.registered|approved|deprecated|retired`, `modelcard.published`,
`binding.created|renewed|expiring|expired|revoked`, `routingpolicy.published|superseded`,
`routing.resolved`, `benchmark.run_started|completed|failed`,
`experiment.started|observation_recorded|stopped|concluded`, `shadow.divergence_detected`,
`canary.started|criteria_met|criteria_failed|auto_rollback_fired`,
`promotion.approved|executed`, `rollback.executed|verified`,
`deprecation.announced|migration_completed|deadline_breached`,
`datapolicy.violation_blocked`, `spend.ceiling_hit`.

**Metrics:** per-binding success rate, rework rate, review findings per execution, cost per
completed work item, latency percentiles, reliability/error taxonomy, cache effectiveness,
structured-output validity rate, tool-call correctness, routing regret, canary
success/failure ratio, rollback frequency and MTTR, **binding age distribution** (a
distribution skewed toward the maximum lifetime is a §0.4 warning sign), deprecation
compliance.

## 10.9 Failure and recovery behavior

- **Provider outage or rate limiting:** routing falls back through `fallbackBindingIds` in
  policy order; fallback use is recorded, and sustained fallback raises a routing review.
- **Binding expiry with no re-evaluation:** the sweep reverts to the prior approved binding
  and raises an escalation. Expiry never silently extends. This is the anti-lock-in
  mechanism working as intended.
- **Canary regression:** automatic rollback fires on pre-declared criteria; the rollback
  record carries the regression evidence.
- **Rollback failure:** hard escalation with the affected work paused; a binding whose
  rollback cannot execute is a production incident, not a routing preference.
- **Benchmark nondeterminism:** repeated runs with recorded variance; a suite whose variance
  exceeds its discrimination threshold is flagged as non-discriminating rather than
  reported as a score.
- **Shadow divergence:** recorded and reviewed; shadow output is never acted upon
  (`actedUpon: false` is structural).
- **Data policy violation attempt:** blocked at the call boundary and recorded as a security
  event.
- **Deprecation deadline breach:** affected bindings are force-migrated to an approved
  successor or the work is blocked — never silently continued on a retired model.
- **Model output schema failure:** counted in structured-output validity, retried per policy,
  and if persistent, treated as a capability regression for that binding.
- **Missing model identity on an execution:** the execution fails validation rather than
  completing unattributably.

## 10.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| H1 | Registry complete | Provider, model version, context, tools, structured output, data policy, safety, cost, latency, reliability, approved uses all recorded for every model in use |
| H2 | Model cards published | Every approved model version has a card with limits, data policy, and known failure modes |
| H3 | **No permanent bindings** | Schema rejects a binding without `expiresAt`; every existing binding has an expiry and a rollback target |
| H4 | **No hardcoded model references** | Repository-wide check passes and is wired into CI as a permanent gate |
| H5 | Binding expiry works | An expiring binding raises re-evaluation; an expired binding reverts to the prior approved binding and escalates |
| H6 | Revocation works | Revoking a binding immediately stops new dispatches on it; in-flight work completes or is reassigned per policy |
| H7 | Benchmarks are reproducible | Same suite version + same model version → comparable scores with recorded variance; a non-discriminating suite is flagged |
| H8 | All seven role dimensions benchmarked | Planning, coding, review, architecture, research, restoration, tool use (§13) |
| H9 | Versioned routing resolves and records | Every execution records the policy version, binding, model identity, and configuration used |
| H10 | A/B test with pre-registration | Hypothesis, metrics, minimum sample, and stopping rule declared before the test; conclusion respects the stopping rule |
| H11 | Shadow evaluation never acts | Structurally impossible to act on shadow output; verified by test |
| H12 | Canary promotion with criteria | Promotion occurs only when pre-declared criteria are met, with evidence |
| H13 | **Rollback exercised** | A real rollback executed and verified — not simulated. This is the criterion that proves replaceability. |
| H14 | Deprecation lifecycle | A model is deprecated, bindings migrate within the window, and a deadline breach blocks rather than silently continues |
| H15 | Data policy enforced | Prohibited data class cannot reach a forbidding model; attempt blocked and recorded |
| H16 | Benchmarks do not weaken review | Review policy resolution takes no model input; a top-scoring model still receives policy-required review |
| H17 | Spend ceilings hold | Provider and project ceilings enforced before dispatch under concurrency |
| H18 | Reviewer/implementer model independence expressible | Policy can require a different model for the independent reviewer, and it is honored |
| H19 | **Role replaceability demonstrated** | A role's binding is swapped to a different model version end to end: benchmark → policy → shadow → canary → promotion → measured outcome → rollback. Performed for at least one substantive role. |

## 10.11 Required evidence

Deterministic gates green; the H4 CI check output; benchmark reports for all seven
dimensions with variance (H7/H8); the H19 **full replaceability transcript** — this is the
headline evidence that §0.4 is real; H13 executed rollback evidence; A/B pre-registration
document and conclusion (H10); shadow divergence report; canary criteria and evidence;
deprecation migration transcript; data-policy block transcript; binding expiry and
revocation transcripts (H5/H6); spend ceiling test under concurrency; independent code
review; architecture review (**explicit verdict on the no-hardcoded-model and
no-permanent-binding invariants**); security review (credentials, data policy, spend).

## 10.12 Reviewers

`ai-llm-engineer` (**blocking** — benchmark design, eval validity, capability dimensions),
`architecture-reviewer` (**blocking** — the §0.4 invariants; resolver placement; policy vs.
code boundary), `security-engineer` (**blocking** — credentials, data policy, residency,
spend), `independent-code-reviewer` (**blocking**),
`observability-engineer` / 2E owner (experiment methodology, metric validity),
`prompt-engineering-specialist` (prompt/configuration versioning within bindings),
`reliability-engineer` (fallback, outage, rollback, expiry sweeps),
`devops-engineer` (credential rotation, environment separation), `qa-engineer`,
**Founder** (**blocking, reserved** — D-2H-1 through D-2H-4).

## 10.13 Founder decisions

D-2H-1 (approved providers, data-policy requirements, spend ceilings), D-2H-2 (promotion
authority L4/L5; canary criteria), D-2H-3 (**maximum binding lifetime before mandatory
re-evaluation** — the concrete number that makes non-permanence enforceable), D-2H-4
(benchmark suite contents and per-role quality bar). Plus: whether any role requires model
diversity (implementer and reviewer on different providers) as policy.

## 10.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2H-1 | Provider/model registry, model cards, **binding registry with mandatory expiry**, `ModelResolver` implementing the P-4 port, model usage recording, the H4 CI check | L |
| 2H-2 | Benchmark harness + eval runner + capability profiles across all seven dimensions | L |
| 2H-3 | Versioned routing policy service, A/B experiments, shadow evaluation | L |
| 2H-4 | Canary promotion, automatic rollback, deprecation manager, expiry sweep, data policy enforcement, spend ceilings | L |
| 2H-5 | Model management acceptance demonstration incl. H19 replaceability and H13 rollback | M |

## 10.15 Explicit out-of-scope

- **Model training, fine-tuning, or hosting** — Dev HQ consumes models; it does not build
  them.
- **Multi-tenant model policy and per-tenant provider isolation** — Phase 4 (4A/4E).
- **Marketplace-distributed model packs** — Phase 4 (4B).
- **Prompt content optimization** — 2E learning proposals and the prompt-engineering role;
  2H versions the *configuration*, not the craft.
- **Automatic promotion without approval** — permanently out of scope per D-2H-2.
- **Binding a role to a model permanently** — permanently out of scope; the schema forbids
  it (§0.4, H3).
- **Product-facing model selection for Savrio** — Phase 3.

## 10.16 Completion gate

**Gate 2H signed when:** H1–H19 pass; H19 demonstrates a real role↔model swap through the
full lifecycle including rollback; H3 and H4 are enforced structurally (schema constraint +
CI check), not by documentation; the binding age distribution shows active re-evaluation;
blocking reviewers approve; and the Founder accepts the provider list, promotion authority,
and maximum binding lifetime.

**This gate is where the plan's model-neutrality promise becomes verifiable.** Before 2H,
neutrality is a discipline. After 2H, it is a mechanism with an expiry sweep, a CI check, a
schema constraint, and an exercised rollback.

## 10.17 Capabilities accelerated after completion

- **Every stage's cost and quality becomes tunable** — the largest single lever on Phase 3
  economics is model selection per task class, and it becomes governed rather than habitual.
- **2I research** selects models deliberately and enforces data policy on external sources.
- **2J pair sessions** bind to a recorded model version, making sessions reproducible.
- **2F memory** becomes model-aware in a useful way: claims keyed to `modelIdentity` mean a
  model change is a measurable event rather than a silent behavior shift.
- **Provider risk drops sharply** — outage, price change, deprecation, or policy change
  becomes a routing decision with a rehearsed rollback, not a crisis.
- **Phase 3 and Phase 4 inherit provider portability** as an operating property, which is
  what makes a multi-organization platform viable.

---

# 11. Stage 2I — Autonomous Research and Architecture Discovery

*Roadmap authority: §10 (2I), §13 (Autonomous Research), §11 (research knowledge), §19
(research agent), Appendix D.*

## 11.1 Purpose

Perform **rigorous, evidence-backed pre-implementation research**: formulate a decision
question and research plan before implementation; prioritize official docs, standards,
RFCs, prior art, repository constraints, and reproducible experiments; and record
citations, freshness, uncertainty, assumptions, contradictions, alternatives, tradeoffs,
recommendation, confidence, and a proof plan — producing ADR proposals rather than
decisions.

§19 bounds the role precisely: the research agent owns *"source-grounded research,
alternatives, tradeoffs, experiments, ADR proposals"* and **must not substitute for**
*"final architecture or business decision."*

## 11.2 Entry criteria

- Gate 2H signed.
- Gate 2C signed — research has a governed home with supersession (R-10).
- ADR §2.7 #20 (research sandbox, network egress, citation integrity) approved.
- D-2I-1 (**network egress policy and allowed source domains**) and D-2I-2 (experiment
  sandbox budget; whether experiments may touch any real environment) recorded.
- Repository Intelligence (1H) can supply repository constraints as structured input.

## 11.3 Dependencies

| Depends on | For |
|---|---|
| 2C knowledge platform | Storage, supersession, retrieval, and effectiveness of research output |
| 2H model management | Deliberate model selection for research; data-policy enforcement on external content |
| 2E architecture graph | Repository constraints and impact analysis as research input |
| 1H Repository Intelligence | Current models of architecture, dependencies, APIs, conventions |
| 2A organizations | Research teams as a temporary organization type (§10 lists research teams among templates) |
| 2G decision requests | Routing the architecture questions research surfaces to the right authority |
| Credential broker / egress policy | Controlled outbound access |

## 11.4 Required systems

| System | Responsibility |
|---|---|
| **Question Formulation Service** | Convert a goal or uncertainty into a **decision question**: what decision does this research serve, what would change the answer, what is out of scope |
| **Research Plan Service** | Sources to consult, methods, experiments, budget, time box, exit criteria, required confidence |
| **Source Acquisition & Egress Broker** | Controlled outbound fetching restricted to allowed domains, with content archival, checksum, and access timestamp |
| **Citation Integrity Service** | Every claim links to a specific source location with retrieval date and freshness; a claim without a citation is marked as inference, not fact |
| **Repository Constraint Extractor** | Pull current constraints from 1H/2E: existing patterns, ADR commitments, dependency limits, performance envelopes |
| **Alternative & Tradeoff Analyzer** | Enumerate alternatives with tradeoffs, risks, and applicability conditions — including the "do nothing" alternative |
| **Uncertainty & Contradiction Tracker** | Record what is unknown, what sources disagree on, and what would resolve it |
| **Experiment Runner (sandboxed)** | Reproducible spikes in isolated environments with recorded inputs, outputs, variance, and teardown |
| **ADR Proposal Generator** | Produce a TMP-003-conformant ADR proposal: context, problem, options, decision recommendation, consequences, evidence, proof plan |
| **Proof Plan Service** | Define how the recommendation will be validated during implementation — becomes acceptance criteria for the implementing work item |
| **Research Review Gate** | Independent review of research quality before any implementation depends on it |

## 11.5 Required data models

| Model | Key fields |
|---|---|
| `ResearchQuestion` | `id`, `scopeKey`, `decisionServed`, `question`, `whatWouldChangeTheAnswer`, `outOfScope`, `requestedByActorId`, `requiredConfidence`, `deadline`, `state` |
| `ResearchPlan` | `id`, `questionId`, `sourceStrategy`, `methods[]`, `plannedExperiments[]`, `budget`, `timeBox`, `exitCriteria`, `approvedByActorId?` |
| `Source` | `id`, `kind: official_docs \| standard \| rfc \| prior_art \| repository \| vendor \| community`, `uri`, `title`, `publisher`, `publishedAt?`, `retrievedAt`, `contentChecksum`, `archiveRef`, `accessLimitations`, `licenseNote` |
| `Citation` | `id`, `sourceId`, `locator` (section/line/anchor), `quotedExtract`, `retrievedAt` |
| `Claim` | `id`, `researchId`, `statement`, `kind: source_supported \| inference \| assumption \| unknown`, `citationIds[]`, `confidence`, `contradictedByClaimIds[]` |
| `Alternative` | `id`, `researchId`, `name`, `description`, `applicabilityConditions`, `prerequisites[]`, `claimIds[]` |
| `Tradeoff` | `id`, `alternativeId`, `dimension` (correctness/complexity/cost/latency/risk/operability/reversibility), `assessment`, `evidenceRefs[]` |
| `Experiment` | `id`, `researchId`, `hypothesis`, `method`, `environmentRef`, `inputs`, `budget`, `repetitions`, `state` |
| `ExperimentResult` | `id`, `experimentId`, `run`, `output`, `metrics`, `variance`, `artifactRefs[]`, `conclusion`, `reproducible: boolean` |
| `ResearchFinding` | `id`, `researchId`, `finding`, `supportingClaimIds[]`, `significance`, `affectedDecisions[]` |
| `ResearchReport` | `id`, `questionId`, `summary`, `claimIds[]`, `alternativeIds[]`, `recommendation`, `confidence`, `uncertainties[]`, `contradictions[]`, `assumptions[]`, `limitations[]`, `proofPlanId`, `knowledgeRecordId?`, `reviewIds[]`, `state` |
| `AdrProposal` | `id`, `researchReportId`, `title`, `context`, `problemStatement`, `options[]`, `recommendedOption`, `consequences`, `risks`, `evidenceRefs[]`, `requiredAuthorityLevel`, `state`, `founderDecisionRef?`, `resultingAdrRef?` |
| `ProofPlan` | `id`, `researchReportId`, `validationSteps[]`, `acceptanceCriteria[]`, `instrumentation[]`, `failureSignals[]` |
| `EgressAuditRecord` | `id`, `actorId`, `researchId`, `requestedUri`, `allowed`, `policyVersion`, `at`, `bytesRetrieved`, `blockedReason?` |

## 11.6 Required interfaces

**Ports:** `ResearchQuestionStore`, `ResearchPlanner`, `EgressBroker`, `SourceArchive`,
`CitationService`, `ClaimStore`, `ExperimentRunner`, `AdrProposalStore`, `ProofPlanStore`,
`ResearchReviewGate`.

**HTTP:** `POST /research/questions` (+ `/plan`), `GET /research/[id]`,
`/research/[id]/claims`, `/sources`, `/experiments`; `POST /research/[id]/report`;
`POST /research/[id]/adr-proposal`; `POST /adr-proposals/[id]/decide` (Founder);
`GET /research/egress-audit`.

**Workflow:** `research-runner` (durable, resumable, budget-boxed — research is long-running
and must survive session boundaries via CLM), `source-acquisition-runner`,
`experiment-runner` (isolated environment provisioning and teardown),
`source-freshness-sweep` (re-check cited sources; mark research stale when sources change).

**UI:** research question board; report viewer with claim→citation drill-down and claim-kind
badges (source-supported vs. inference vs. assumption); alternatives comparison matrix;
experiment results with variance; ADR proposal review surface routed into the Founder
Decision Inbox; egress audit log.

## 11.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Research decides nothing** | §19: the research agent must not substitute for final architecture or business decisions. Output is a *proposal* with a required authority level. |
| **Egress is allow-listed** | D-2I-1 sets allowed domains. Outbound requests outside the list are blocked and audited. |
| **No secrets in queries** | Outbound content is scanned before egress; repository content, credentials, and private data must not leak into external queries (§17). |
| **Experiments are isolated** | Sandbox environments only; per D-2I-2, whether any real environment may be touched is a Founder decision, and the default is no. |
| **Research cannot commit** | No write authority to project repositories. Experiment artifacts live in sandbox or evidence storage. |
| **Citation honesty** | §Research-and-Evidence: *"Do not fabricate citations, documentation, test output, or source findings."* A claim without a citation is structurally typed as inference or assumption — the schema makes fabrication visible rather than easy. |
| **License and terms compliance** | Sources record license notes; content that may not be redistributed is archived by reference, not copied into knowledge. |
| **Freshness is tracked** | §Research: *"Verify time-sensitive information."* Sources carry retrieval dates; a source that changed invalidates dependent claims. |
| **Model neutrality** | Research model selection resolves through 2H, and the model identity is recorded on every claim so a claim's provenance includes which model produced the inference. |

## 11.8 Observability

**Events:** `research.question_created|plan_approved|started|completed|abandoned`,
`source.acquired|blocked|archived|changed|unavailable`, `claim.recorded|contradicted`,
`experiment.started|completed|failed|nonreproducible`,
`report.submitted|reviewed|published`, `adrproposal.created|decided`,
`egress.allowed|blocked`, `research.stale_detected`.

**Metrics:** research cycle time and cost; source mix (share from official/standard/RFC vs.
community — a research report leaning on community sources is weaker and should be visible);
citation density; claim kind distribution (**share of source-supported vs. inference** is
the honesty metric); contradiction rate; experiment reproducibility rate; ADR proposal
acceptance rate; **research-to-outcome accuracy** (did the recommendation hold in
implementation?); duplicate-research rate (should fall as 2C retention works); egress block
rate.

## 11.9 Failure and recovery behavior

- **Source unavailable or paywalled:** recorded as an `accessLimitation` on the report, not
  silently omitted. The report's confidence must reflect it.
- **Contradictory sources:** recorded as a contradiction with both citations; if it is
  material to the recommendation, escalate rather than choosing silently.
- **Source changed after citation:** freshness sweep marks dependent claims stale and the
  research report as requiring re-verification.
- **Experiment nondeterminism:** repeat, record variance, and mark `reproducible: false`. A
  non-reproducible experiment may not support a claim.
- **Experiment environment failure:** teardown is guaranteed (leaked sandbox resources are a
  cost and security issue); the experiment is retried or abandoned with a record.
- **Budget or time box exhausted:** the report is delivered with reduced confidence and
  explicit unanswered questions. Truncated research is delivered honestly, not padded.
- **Egress blocked:** recorded; if the blocked source is essential, escalate for a policy
  decision rather than working around it.
- **Insufficient evidence for a recommendation:** a valid, expected outcome — the report
  recommends further research or a reversible experiment, and says so.
- **Session exhaustion mid-research:** CLM checkpoint and rollover; the continuation packet
  carries claims, sources, rejected directions, and the exact next step.

## 11.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| I1 | Decision question first | No research proceeds without a recorded decision question and what would change the answer |
| I2 | Plan before sources | A research plan with methods, budget, time box, and exit criteria exists before acquisition |
| I3 | Source hierarchy honored | Official docs, standards, RFCs, and repository evidence are prioritized; source mix is reported |
| I4 | Every claim typed and cited | Source-supported claims carry citations with locators and retrieval dates; inferences and assumptions are labeled as such |
| I5 | Fabrication is structurally visible | A claim asserted without a citation cannot be typed `source_supported`; verified by test |
| I6 | Alternatives include "do nothing" | Every report enumerates alternatives with tradeoffs and applicability conditions |
| I7 | Uncertainty recorded | Unknowns, contradictions, assumptions, and limitations are explicit |
| I8 | Experiments reproducible or marked | Repetition and variance recorded; non-reproducible experiments cannot support a claim |
| I9 | Sandbox isolation and teardown | Experiments cannot touch real environments (per D-2I-2); teardown verified; no leaked resources |
| I10 | Egress control | Non-allow-listed requests blocked and audited; a secret planted in a query is blocked before egress |
| I11 | ADR proposals conform | TMP-003 structure with context, problem, options, recommendation, consequences, evidence, proof plan |
| I12 | Research decides nothing | No path exists from a research report to an architecture change without an authorized decision |
| I13 | Proof plan becomes acceptance criteria | A research recommendation's proof plan is carried into the implementing work item |
| I14 | Retention and supersession | Reports land in 2C with provenance; a superseded report is not retrieved as current |
| I15 | Honest insufficiency | A deliberately under-resourced research task produces a truncated report with explicit unanswered questions and reduced confidence — not a confident answer |

## 11.11 Required evidence

Deterministic gates green; one **complete real research report** end to end on a genuine
Phase 3 or 2K architecture question, with claim→citation drill-down; the I5 fabrication-
resistance test; egress block and secret-block transcripts (I10); sandbox isolation and
teardown verification (I9); a reproducibility report with variance (I8); the I15 truncated-
research artifact (deliberately under-resourced, honestly reported); an ADR proposal that
reached a Founder decision (I11/I12); a proof plan carried into an implementing work item
(I13); independent code review; architecture review; security review (**egress, secret
leakage, sandbox isolation — blocking**).

## 11.12 Reviewers

`research-analyst` (**blocking** — research methodology, source hierarchy, citation
integrity), `security-engineer` (**blocking** — egress, secret leakage, sandbox),
`architecture-reviewer` (**blocking** — ADR proposal quality and the research-decides-nothing
boundary), `independent-code-reviewer` (**blocking**), `Knowledge Curator` (retention,
supersession, generalization), `ai-llm-engineer` (model selection for research; inference
labeling), `devops-engineer` (sandbox provisioning and teardown), `qa-engineer`,
**Founder** (reserved: D-2I-1 egress policy, D-2I-2 experiment scope; and the decision on
any ADR proposal produced).

## 11.13 Founder decisions

D-2I-1 (**network egress policy and allowed source domains** — a security decision with
real blast radius), D-2I-2 (experiment sandbox budget; whether experiments may touch any
real environment — recommendation: **no**), plus: whether research may be commissioned
autonomously by the Orchestrator or requires a Founder-initiated question (recommendation:
autonomous within a budget ceiling, since §20 already places research in the autonomous
lifecycle).

## 11.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2I-1 | Question formulation, research plan, egress broker with allow-list, source acquisition and archival, citation integrity, claim typing | M |
| 2I-2 | Alternatives, tradeoffs, uncertainty and contradiction tracking, repository constraint extraction | M |
| 2I-3 | Sandboxed experiment runner with provisioning, repetition, variance, and guaranteed teardown | L |
| 2I-4 | ADR proposal generator, proof plan service, research review gate, 2C publication | M |
| 2I-5 | Research acceptance demonstration on a real question | M |

2I-1 and 2I-2 are parallel-safe with each other (§2.3 P2-31).

## 11.15 Explicit out-of-scope

- **Implementing the researched change** — research produces proposals; implementation is
  normal governed work with its own gates.
- **Production experiments** — out of scope per D-2I-2's recommended default.
- **Product, market, pricing, and customer research** — Phase 3 (§14 business outcome
  intelligence).
- **Competitive intelligence and vendor negotiation** — out of scope.
- **Automatic ADR acceptance** — permanently out of scope; ADRs are §2 reserved when they
  change architecture baselines.
- **Training data collection or model evaluation research** — 2H owns model evaluation.
- **Unrestricted web browsing** — permanently out of scope; egress is allow-listed.

## 11.16 Completion gate

**Gate 2I signed when:** I1–I15 pass; one real research question is answered end to end
with an ADR proposal that reached a Founder decision; the fabrication-resistance and
egress/secret tests pass; the I15 honest-insufficiency artifact exists (a research system
that cannot say "not enough evidence" is not trustworthy); blocking reviewers approve; and
the Founder accepts the egress policy as implemented.

## 11.17 Capabilities accelerated after completion

- **Every subsequent architecture decision gets cheaper and better-grounded** — 2K's gate
  design, Phase 3's Savrio architecture, and Phase 4's platform decisions all start from
  evidence rather than assumption.
- **ADR throughput rises** — the ~23 ADRs this plan identifies are exactly 2I's work class,
  and future phases will need more.
- **2C knowledge deepens** with a research corpus that supersedes properly.
- **Novelty stops being a bottleneck** — §4's "Large" and "Critical" workflow classes both
  begin with research, so 2I directly accelerates the heaviest work classes.
- **Phase 3 de-risking** — Savrio's product and AI architecture questions can be researched
  before commitment.

---

# 12. Stage 2J — Interactive AI Pair Engineering

*Roadmap authority: §10 (2J), §4A (collaboration modes), §13 (Human Collaboration), §22.*

## 12.1 Purpose

Support **high-quality interactive work alongside autonomous execution**: open, explain,
trace, refactor, test, compare approaches, checkpoint edits, and promote useful exploration
into governed work.

2J exists because some engineering work is genuinely exploratory, and the honest answer is
to support it under governance rather than to pretend it does not happen. The whole design
question is: how does exploration produce value without producing ungoverned change?
Answer: exploration writes to a **scratch candidate**, and value leaves the session only
through **promotion into normal governed work**.

## 12.2 Entry criteria

- Gate 2I signed.
- Gate 2G signed — 2J is a specialization of collaboration sessions and must not build a
  second session runtime (R-11).
- ADR §2.7 #21 (scratch candidates and promotion) approved.
- D-2J-1 (whether pair sessions may run against project repositories or only scratch
  clones) and D-2J-2 (promotion authority) recorded.
- 2H binding registry exists so a session records its exact model version.

## 12.3 Dependencies

| Depends on | For |
|---|---|
| 2G session manager | Lead, participants, authority, box, transcript, write-back — 2J adds a code-editing surface, not a new session concept |
| 2H bindings | Recording exact model identity per session for reproducibility |
| 2E events + P-6 timeline | The trace/explain surface |
| 1H Repository Intelligence | Explain and navigate: architecture, dependencies, ownership, conventions |
| 2C knowledge | Explain with institutional context, not just code |
| 2A packets | Promotion target: a session becomes a work item and, if large, a packet graph |
| CLM | Sessions are long and interactive; checkpoints and rollover apply |

## 12.4 Required systems

| System | Responsibility |
|---|---|
| **Pair Session Runtime** | Interactive turn loop over a bounded workspace, extending the 2G session model with editing capability |
| **Scratch Candidate Service** | An isolated, identifiable candidate (branch/worktree/clone per D-2J-1) that accumulates edits and is **never** a commit to a project branch |
| **Checkpointed Edit Buffer** | Edits accumulate as reversible checkpoints; any checkpoint can be inspected, reverted, or promoted |
| **Explain Service** | Explain code, architecture, decisions, and history using 1H, 2C, and the ADR corpus — with citations to files, ADRs, and knowledge records |
| **Trace Service** | Trace an execution, review, escalation, or decision through 2E events and the timeline |
| **Refactor & Test Assist** | Bounded refactors and test authoring within the scratch candidate |
| **Approach Comparison** | Produce and compare N approaches with tradeoffs, cost, and risk — reusing 2I's tradeoff model rather than a parallel one |
| **Promotion Service** | Convert session output into a governed work item: objective, scope, acceptance criteria, evidence from the session, and the required normal gates |
| **Session Authority Guard** | Session authority is bounded and never includes commit, merge, deploy, or approval |

## 12.5 Required data models

| Model | Key fields |
|---|---|
| `PairSession` | extends `CollaborationSession` with `workspaceRef`, `scratchCandidateId`, `modelBindingId`, `repositoryScope`, `editAuthority: scratch_only`, `promotionState` |
| `PairTurn` | `id`, `sessionId`, `actorId`, `modelIdentity`, `intent: explain \| trace \| edit \| refactor \| test \| compare`, `input`, `output`, `tokensUsed`, `at` |
| `ScratchCandidate` | `id`, `sessionId`, `baseCandidateId`, `location`, `identity` (branch/worktree/clone), `isCommittable: false`, `createdAt`, `discardedAt?`, `promotedToWorkItemId?` |
| `EditCheckpoint` | `id`, `scratchCandidateId`, `sequence`, `diffRef`, `rationale`, `testResultRefs[]`, `revertedFrom?`, `at` |
| `EditProposal` | `id`, `scratchCandidateId`, `checkpointIds[]`, `summary`, `filesTouched[]`, `risks[]`, `suggestedReviewers[]` |
| `ApproachComparison` | `id`, `sessionId`, `question`, `approaches[]` (`name`, `checkpointIds[]`, `tradeoffs[]`, `cost`, `risk`), `recommendation`, `rationale` |
| `SessionPromotionRecord` | `id`, `sessionId`, `editProposalId?`, `createdWorkItemId`, `carriedEvidenceIds[]`, `transcriptRef`, `requiredGates[]`, `promotedByActorId`, `authorityLevel`, `at` |
| `SessionAuthorityGrant` | `id`, `sessionId`, `allowedActions[]` (never includes `commit \| merge \| deploy \| approve`), `repositoryScope`, `expiresAt` |
| `SessionBudget` | `id`, `sessionId`, `tokenCeiling`, `costCeiling`, `durationCeiling`, `consumed` |

## 12.6 Required interfaces

**Ports:** `PairSessionRuntime`, `ScratchCandidateService`, `EditCheckpointStore`,
`ExplainService`, `TraceService`, `ApproachComparator`, `PromotionService`,
`SessionAuthorityGuard`.

**HTTP:** `POST /pair/sessions` (+ `/turns`, `/close`); `GET /pair/sessions/[id]`
(+ `/checkpoints`, `/diff`); `POST /pair/sessions/[id]/checkpoints/[n]/revert`;
`POST /pair/sessions/[id]/compare`; `POST /pair/sessions/[id]/promote`;
`GET /pair/sessions/[id]/transcript`.

**UI:** pair surface with transcript, diff view per checkpoint, revert controls, test run
output, approach comparison side-by-side, explicit **"scratch — not committed"** state
indicator, promote action showing which gates the promoted work will require, and live
budget/box countdown.

## 12.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Scratch only** | `editAuthority: scratch_only` is structural. A pair session holds no commit, merge, deploy, or approval authority. `ScratchCandidate.isCommittable` is `false` by type. |
| **Promotion is the only exit** | Value leaves a session by creating a governed work item that carries normal gates. There is no path from session to merged change (§22: no hidden manual steps, no untracked decisions). |
| **Independent review still required** | Promoted work receives the review its class requires. Session exploration is *evidence*, never *approval*. |
| **Session authority ≤ participant authority** | Inherited from 2G: intersection of grants, further bounded by the session grant. |
| **Boxed** | Token, cost, and duration ceilings; expiry closes the session and preserves the scratch candidate for a retention window. |
| **Repository scope** | Per D-2J-1, sessions run against a scratch clone by default. If project-repository access is granted, it is read + scratch-branch-write only, never to a protected branch. |
| **Transcript is evidence** | Retained, checksummed, secret-scanned, and carried into promotion. |
| **Model identity recorded** | Every turn records the model version, so a session is reproducible and comparable across model changes (§0.4, §13). |
| **No authority escalation via conversation** | Inherited from 2G/§13A: session output alone never changes scope, authority, candidate identity, or approval status. |

## 12.8 Observability

**Events:** `pairsession.opened|turn_recorded|checkpoint_created|checkpoint_reverted|
compared|promoted|discarded|expired|closed`, `scratchcandidate.created|discarded|retained`,
`promotion.workitem_created`, `authority.scratch_violation_blocked`.

**Metrics:** session count, duration, token and cost per session; **promotion rate** (what
fraction of exploration became governed work — a very low rate suggests the surface is
producing little value; a very high rate suggests work is being routed here that belongs in
the autonomous loop); post-promotion first-pass approval rate (did exploration improve
quality?); checkpoint revert rate; explain/trace usage mix; scratch candidate retention and
cleanup; session budget overrun frequency.

## 12.9 Failure and recovery behavior

- **Session expiry or budget exhaustion:** the session closes; the scratch candidate is
  retained for a policy window so work is not lost; truncation is recorded.
- **Discard:** scratch candidate and workspace are cleaned up; the transcript is retained as
  a record that exploration happened and was discarded (negative results are information).
- **Crash / context exhaustion:** CLM checkpoint and rollover; the successor session
  verifies workspace identity, base candidate, and checkpoint sequence before resuming
  edits — resumed sessions must not mutate before restoration verification (§22).
- **Base candidate moved:** if the base candidate advances during the session, the scratch
  candidate is marked divergent; promotion requires an explicit rebase decision with a
  recorded conflict resolution.
- **Attempted commit/merge/deploy:** blocked by the authority guard and recorded as a policy
  event.
- **Test failure inside the session:** normal and expected; recorded on the checkpoint. A
  session may be promoted with failing tests only if the promoted work item records them as
  known-failing work to complete — never as passing.
- **Promotion rejected downstream:** the work item is rejected through normal gates; the
  session record retains the linkage so the exploration is not silently re-attempted.
- **Workspace leak:** scheduled cleanup sweep for orphaned scratch workspaces (cost and
  security).

## 12.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| J1 | Session runtime reuses 2G | No second session concept; authority, boxing, transcript, and write-back come from 2G |
| J2 | Scratch is structurally non-committable | Attempted commit, merge, deploy, or approval from a session is blocked; verified adversarially |
| J3 | Checkpoints are reversible | Any checkpoint inspectable and revertible; sequence integrity maintained |
| J4 | Explain is grounded | Explanations cite files, ADRs, and knowledge records rather than asserting |
| J5 | Trace works | An execution, review, escalation, and decision are each traceable through 2E events |
| J6 | Approach comparison | ≥2 approaches produced with tradeoffs, cost, and risk, reusing 2I's tradeoff model |
| J7 | Promotion creates governed work | A promoted session yields a work item with objective, scope, acceptance criteria, session evidence, and the correct required gates |
| J8 | Promoted work is reviewed normally | Independent review occurs on the promoted candidate; session exploration is evidence, not approval |
| J9 | Boxing enforced | Token, cost, and duration ceilings close sessions and record truncation |
| J10 | Model identity recorded per turn | Every turn attributable to an exact model version and binding |
| J11 | Rollover safe | A session interrupted and resumed verifies workspace, base candidate, and checkpoints before mutating |
| J12 | Divergence handled | A moved base candidate marks divergence and forces an explicit rebase decision at promotion |
| J13 | Cleanup verified | Discarded and expired sessions leave no orphaned workspaces; transcripts retained |
| J14 | Secrets excluded | Planted secrets in a session are caught and do not persist in transcript, checkpoint, or promotion |

## 12.11 Required evidence

Deterministic gates green; the J2 adversarial suite (attempted commit/merge/deploy/approve
from a session — the stage's central proof); a real pair session promoted into governed work
that passed normal review (J7/J8); explain and trace transcripts with citations (J4/J5); an
approach comparison artifact (J6); rollover-and-resume transcript (J11); divergence and
rebase transcript (J12); cleanup sweep report (J13); secret-scan transcript (J14);
independent code review; architecture review (session authority, scratch boundary, no
second session runtime); security review (repository scope, workspace isolation,
transcripts).

## 12.12 Reviewers

`architecture-reviewer` (**blocking** — scratch boundary, reuse of 2G, no bypass path),
`security-engineer` (**blocking** — repository scope, workspace isolation, secrets),
`independent-code-reviewer` (**blocking**), `claude-design` (**blocking** — the surface must
make "this is scratch, not committed" unmistakable; ambiguity here is a correctness risk,
not a polish issue), `lead-software-engineer` (is the surface actually useful for real
engineering work), `reliability-engineer` (rollover, divergence, cleanup), `qa-engineer`,
**Founder** (reserved: D-2J-1, D-2J-2).

## 12.13 Founder decisions

D-2J-1 (whether pair sessions may run against project repositories or only scratch clones —
recommendation: **scratch clones by default**, project read access grantable), D-2J-2
(promotion authority: may a session's output enter governed work without Founder review —
recommendation: **yes within L1/L2 classes**, since promoted work still passes normal
gates), plus session retention window for scratch candidates and transcripts.

## 12.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2J-1 | Pair session runtime on 2G, scratch candidate service, checkpointed edit buffer, authority guard, budgets | L |
| 2J-2 | Explain, trace, refactor/test assist, approach comparison | L |
| 2J-3 | Promotion service into governed work; divergence and rebase handling; cleanup sweep | M |
| 2J-4 | Pair engineering acceptance demonstration incl. the J2 adversarial suite | M |

2J-1 and 2J-2 are parallel-safe with each other (§2.3 P2-33).

## 12.15 Explicit out-of-scope

- **A full IDE** — 2J is a governed exploration surface, not an editor product.
- **Direct commits from a session** — permanently out of scope (J2).
- **Bypassing review for promoted work** — permanently out of scope (J8).
- **Multi-human pair programming at scale, shared workspaces** — Phase 4 (4D).
- **External IDE integrations (VS Code, JetBrains plugins)** — Phase 4 (4F).
- **Onboarding curricula and training material generation** — 2C owns onboarding knowledge.
- **Long-lived personal branches** — out of scope; scratch candidates are session-scoped
  with a retention window.

## 12.16 Completion gate

**Gate 2J signed when:** J1–J14 pass; the J2 adversarial suite shows zero successful
commit/merge/deploy/approve attempts from a session; at least one real session promoted into
governed work that passed normal review; the design reviewer confirms the scratch state is
unmistakable in the UI; blocking reviewers approve; and the Founder accepts the repository
scope and promotion authority.

## 12.17 Capabilities accelerated after completion

- **Novel and ambiguous work gets a safe front door** — exploration that used to happen
  outside governance now produces evidence inside it.
- **Debugging and incident investigation get a trace surface**, which shortens 2E root-cause
  work and Phase 3 incident response.
- **Approach comparison feeds 2I and ADRs** with concrete, executed alternatives rather than
  described ones.
- **Human engineers gain a governed entry point** (with 2G human actors), which is the
  practical bridge to Phase 3 mixed delivery.
- **2F memory** gains data on which task classes benefit from interactive vs. autonomous
  execution — a collaboration-mode signal that improves routing.

---

# 13. Stage 2K — Enterprise Production Platform

*Roadmap authority: §10 (2K), §16, §17, §18, §21 (Release Confidence), Appendix B.*

## 13.1 Purpose

Create **reusable production-readiness infrastructure and organization-wide quality gates**:
accessibility, security, secret scanning, dependency scanning, privacy, performance, SEO,
deployment, migration, rollback, observability, and release readiness — plus reusable
environment, CI/CD, infrastructure, and operational capability packs.

2K is last because it consumes almost everything: 2A runs gates as packets, 2B binds gates
per project and coordinates multi-repo release, 2E measures gate effectiveness, and 2H
governs the models that some gates use. It is also the stage that makes Phase 3 possible —
Savrio cannot be operated in production without it.

## 13.2 Entry criteria

- Gates 2A–2J signed.
- Gate 2E signed — gates without effectiveness measurement become gate theater (R-9).
- ADRs §2.7 #22 (gate pack versioning and policy floor) and #23 (migration and rollback
  safety) approved.
- D-2K-1 (**the policy floor — the minimum gate set no project may drop below**), D-2K-2
  (break-glass procedure and authority), D-2K-3 (deployment and migration approval authority
  per environment) recorded.
- The existing standards corpus is mapped to gates: `ACCESSIBILITY_STANDARD.md`,
  `SECURITY_STANDARD.md`, `PERFORMANCE_STANDARD.md`, `TESTING_STANDARD.md`,
  `DATABASE_STANDARD.md`, `DEPLOYMENT_STANDARD.md`, `OBSERVABILITY_STANDARD.md`,
  `API_STANDARD.md`, plus `RELEASE_PROCESS.md` and `docs/workflows/RELEASE_WORKFLOW.md`.
  2K makes these executable rather than aspirational.

## 13.3 Dependencies

| Depends on | For |
|---|---|
| 2A organizations | Gate runs as verification packets; parallel gate execution with reconciliation |
| 2B project scoping and multi-repo release | Per-project gate bindings; coordinated release with per-repo rollback |
| 2E metrics and review learning | Gate effectiveness, false-positive rate, escaped-defect attribution, Release Confidence inputs |
| 2C knowledge | Gate findings become durable anti-patterns and playbooks; runbooks are knowledge records |
| 2H model management | Model-assisted gates (e.g. some accessibility or documentation checks) bind to governed models |
| Credential broker (§17) | Deployment credentials, short-lived and scoped |
| Policy engine (§17) | Gate requirements, environment promotion, and reserved approvals as versioned policy |
| Review subsystem (1E) | Gate findings use the canonical finding schema (§8) |

## 13.4 Required systems

| System | Responsibility |
|---|---|
| **Gate Pack Framework** | Versioned, composable gate definitions with declared inputs, evidence outputs, severity mapping, and pass/fail semantics. Gates do not own their own enable/disable logic — the framework does. |
| **Policy Floor Enforcement** | The minimum gate set no project may drop below (D-2K-1); projects may add gates, never remove floor gates. Break-glass requires D-2K-2 authority and produces an audit record with an expiry. |
| **Gate Bindings** | Per-project, per-repository, per-environment gate composition with versions pinned |
| **Individual Gates** | Accessibility, security, secret scanning, dependency scanning, privacy, performance, SEO, documentation, database/migration, deployment readiness |
| **Gate Runner** | Executes gate packs as packets inside a 2A organization; parallel where independent; reconciled into one release verdict |
| **Deployment Readiness Service** | Artifact identity, gates, configuration, secrets, dependencies, capacity, migrations, health checks, observability, release notes, runbooks, rollback evidence (§18) |
| **Migration Safety Service** | Forward/backward compatibility analysis, rehearsal in a non-production environment, observability during migration, failure handling, rollback-or-roll-forward decision, data validation (§18) |
| **Rollback Orchestration** | Executable rollback plans with verified execution, not documents |
| **Observability Packs** | Standard instrumentation, dashboards, alerts, and SLOs bound per project |
| **Release Readiness Scorer** | The §21 Release Confidence score from candidate evidence, reviews, tests, deployment readiness, rollback, observability, and unresolved risk |
| **Capability Pack Registry** | Reusable environment, CI/CD, infrastructure, and operational packs with versions, install records, and pinning |
| **Incident Feedback Loop** | Incidents become durable work with evidence, classification, timeline, impact, recovery, and post-incident learning; production evidence may trigger knowledge, architecture, routing, model, or policy proposals (§18) |

## 13.5 Required data models

| Model | Key fields |
|---|---|
| `QualityGateDefinition` | `id`, `key`, `version`, `lens`, `inputs[]`, `checks[]`, `severityMapping`, `evidenceOutputs[]`, `passSemantics`, `isFloorGate`, `owner`, `approvedByActorId` |
| `GatePack` | `id`, `name`, `version`, `gateVersionRefs[]`, `applicability`, `approvedByActorId` |
| `GateBinding` | `id`, `scopeKey`, `packVersionRef`, `additionalGateRefs[]`, `waivers[]`, `effectiveFrom`, `approvedByActorId` |
| `GateWaiver` | `id`, `gateKey`, `scopeKey`, `justification`, `evidenceRefs[]`, `approvedByActorId`, `authorityLevel`, `expiresAt`, `floorViolation: boolean` |
| `GateRun` | `id`, `candidateId`, `scopeKey`, `packVersionRef`, `organizationId?`, `startedAt`, `completedAt?`, `verdict`, `findingIds[]`, `evidenceIds[]`, `durationMs`, `cost` |
| `GateFinding` | canonical §8 finding schema + `gateKey`, `gateVersion`, `automated: boolean`, `falsePositiveState` |
| `ReleaseCandidate` | `id`, `scopeKey`, `artifactIdentity`, `sourceCandidateId`, `gateRunIds[]`, `reviewIds[]`, `migrationPlanId?`, `rollbackPlanId`, `observabilityBindingId`, `releaseNotesRef`, `runbookRefs[]`, `state` |
| `ReleaseReadinessScore` | `id`, `releaseCandidateId`, `value`, `inputs[]`, `unresolvedRisks[]`, `weightsVersion`, `computedAt` |
| `DeploymentRecord` | `id`, `releaseCandidateId`, `environmentId`, `approvedByActorId`, `authorityLevel`, `startedAt`, `completedAt?`, `healthCheckResults[]`, `state`, `rollbackRecordId?` |
| `MigrationPlan` | `id`, `scopeKey`, `changes[]`, `forwardCompatible`, `backwardCompatible`, `rehearsalRequired`, `dataValidationChecks[]`, `rollbackStrategy: rollback \| roll_forward`, `approvedByActorId` |
| `MigrationRehearsal` | `id`, `migrationPlanId`, `environmentId`, `executedAt`, `duration`, `rowCounts`, `validationResults[]`, `issues[]`, `verdict` |
| `RollbackPlan` | `id`, `subjectRef`, `steps[]`, `verificationChecks[]`, `dataImplications`, `maxAcceptableDataLoss`, `testedAt?` |
| `RollbackExecution` | `id`, `rollbackPlanId`, `trigger`, `executedAt`, `stepResults[]`, `verificationResults[]`, `verdict`, `residualImpact` |
| `ObservabilityBinding` | `id`, `scopeKey`, `packVersionRef`, `dashboards[]`, `alerts[]`, `slos[]`, `effectiveFrom` |
| `CapabilityPack` | `id`, `kind: environment \| cicd \| infrastructure \| operations \| observability`, `name`, `versions[]`, `dependencies[]`, `owner` |
| `PackInstallRecord` | `id`, `packVersionRef`, `scopeKey`, `installedByActorId`, `installedAt`, `pinnedVersion`, `driftState` |
| `BreakGlassRecord` | `id`, `subjectRef`, `bypassedGateKeys[]`, `justification`, `invokedByActorId`, `authorityLevel`, `at`, `expiresAt`, `remediationWorkItemId` |

## 13.6 Required interfaces

**Ports:** `GateDefinitionRegistry`, `GatePackRegistry`, `GateBindingResolver`,
`GateRunner`, `PolicyFloorEnforcer`, `WaiverStore`, `DeploymentReadinessService`,
`MigrationSafetyService`, `RollbackOrchestrator`, `ObservabilityBindingService`,
`ReleaseReadinessScorer`, `CapabilityPackRegistry`, `BreakGlassService`.

**HTTP:** `GET/POST /gates`, `/gate-packs`, `/gate-bindings`, `/waivers`;
`POST /gate-runs`; `GET /gate-runs/[id]`; `GET/POST /release-candidates`
(+ `/readiness`, `/approve`); `POST /deployments` (+ `/rollback`);
`GET/POST /migration-plans` (+ `/rehearse`); `GET/POST /capability-packs`,
`/pack-installs`; `POST /break-glass` (authority-gated).

**Workflow:** `gate-run-organization` (forms a 2A organization, runs gates as parallel
packets, reconciles into one verdict), `migration-rehearsal-runner`,
`deployment-runner` (with health checks and automatic rollback triggers),
`rollback-runner`, `pack-drift-sweep`, `waiver-expiry-sweep`,
`incident-intake-runner`.

**UI:** gate catalog with versions and floor markers; per-project binding editor showing
what may not be removed; gate run results with reconciled verdict; release candidate view
with readiness score and unresolved risks; migration rehearsal report; rollback plan with
"last tested" status; deployment history; capability pack registry with drift; break-glass
log with prominent outstanding-remediation display.

## 13.7 Security and authority boundaries

| Boundary | Rule |
|---|---|
| **Policy floor is inviolable** | Projects add gates; they cannot remove floor gates. Removal requires break-glass with D-2K-2 authority, an expiry, and a remediation work item. |
| **Secret scanning is blocking** | A detected secret blocks the candidate and triggers rotation guidance. Never advisory (§17). |
| **Deployment is L4** | Deployments, migrations, credentials, and irreversible actions require explicit policy gates, rollback proof, and designated approval (§2). |
| **Rollback proof required before deploy** | A release candidate without a rollback plan — and, for schema change, without a rehearsal — cannot deploy. |
| **Gates cannot approve their own findings** | A gate reports; verdicts on gate findings follow normal review authority. Automated pass is evidence, not approval, where policy requires human or independent judgment. |
| **Break-glass is auditable and expiring** | Every invocation records who, why, what was bypassed, and the remediation item; an expired break-glass without remediation escalates. |
| **Credentials are brokered and short-lived** | Deployment credentials scoped per environment, rotatable, revocable, with emergency disablement (§17). |
| **Environment separation** | Configuration lives outside source code; artifacts are identifiable and promoted, not rebuilt per environment (§18). |
| **Gate results are scope-isolated** | 2B scoping applies; one project's gate findings are not visible to another without a grant. |
| **Model neutrality** | Model-assisted gates resolve their model through 2H, are versioned, and record model identity on findings — so a model change to a gate is a governed, measurable change. |

## 13.8 Observability

**Events:** `gate.defined|version_published|bound|waived|waiver_expired`,
`gaterun.started|completed|failed|reconciled`, `gatefinding.raised|resolved|false_positive`,
`releasecandidate.created|readiness_computed|approved|rejected`,
`deployment.started|health_check_passed|health_check_failed|completed|auto_rollback_fired`,
`migration.plan_created|rehearsed|executed|validated|rolled_back`,
`rollback.plan_tested|executed|verified|failed`,
`pack.installed|drift_detected|upgraded`, `breakglass.invoked|expired|remediated`,
`incident.opened|classified|resolved|learning_proposed`.

**Metrics:** gate pass/fail rate by gate; **gate false-positive rate** (a gate above
threshold gets fixed, not disabled — R-9's countermeasure); mean gate runtime and cost;
escaped defects by gate (which gate should have caught it); deployment frequency; change
failure rate; **rollback success rate and MTTR**; migration rehearsal coverage; release
readiness score distribution vs. actual outcomes (calibration); break-glass frequency and
outstanding remediation count; pack drift; incident count, MTTR, and recurrence.

## 13.9 Failure and recovery behavior

- **Gate infrastructure failure:** the gate returns `UNABLE TO VERIFY` (§8 verdict), which
  **blocks**, never passes. An unavailable gate must never be a silent pass — this is the
  single most important failure semantic in the stage.
- **Gate timeout:** recorded as unable-to-verify with the partial evidence retained.
- **Flaky gate:** false-positive tracking flags it; the remedy is a fix or a scoped, expiring
  waiver with a remediation item — not disabling it.
- **Deployment health check failure:** automatic rollback per plan; the deployment record
  retains the failure evidence.
- **Rollback failure:** hard incident — escalate immediately, freeze further deployments to
  that environment, and open an incident work item. A failed rollback is the worst outcome
  in the system and is treated as such.
- **Migration failure mid-execution:** the plan's declared strategy (rollback or
  roll-forward) executes; data validation runs either way; partial migration state is
  recorded explicitly.
- **Rehearsal/production divergence:** a rehearsal that does not match production shape
  invalidates itself; the migration cannot proceed on a stale rehearsal.
- **Break-glass expiry without remediation:** escalates and blocks further waivers in that
  scope.
- **Pack drift:** detected and reported; drift on an infrastructure pack becomes a work item
  rather than an accepted reality.
- **Multi-repo release partial failure:** inherited from 2B — abort remaining, roll back
  deployed, retain the exact abort point.
- **Incident:** becomes durable work with evidence, classification, timeline, impact,
  recovery, and post-incident learning (§18), and may generate knowledge, architecture,
  routing, model, or policy proposals.

## 13.10 Acceptance criteria

| # | Criterion | Pass condition |
|---|---|---|
| K1 | Gate framework versioned and composable | Gates carry versions; packs compose them; bindings pin versions; a gate cannot self-disable |
| K2 | Policy floor enforced | A project attempting to remove a floor gate is rejected; only break-glass with authority succeeds, producing an audit record with expiry and remediation |
| K3 | Unavailable gate blocks | Gate infrastructure failure yields `UNABLE TO VERIFY` and blocks; verified by fault injection |
| K4 | Blocking gates implemented | Secret scanning, dependency scanning, security, and accessibility operational and blocking on real candidates |
| K5 | Gates run as reconciled packets | Independent gates run in parallel inside a 2A organization; one reconciled release verdict is produced |
| K6 | Gate findings use the canonical schema | §8 fields present, with remediation guidance sufficient to fix without translation |
| K7 | Deployment readiness complete | Artifact identity, gates, configuration, secrets, dependencies, capacity, migrations, health checks, observability, release notes, runbooks, rollback evidence — all present before deploy is permitted |
| K8 | Migration rehearsal required and effective | A schema change cannot deploy without rehearsal; a rehearsal that diverges from production blocks |
| K9 | **Rollback executed and verified** | A real rollback is executed on a real deployment with verification — not documented, not simulated |
| K10 | Observability bound before deploy | Dashboards, alerts, and SLOs exist for the deployed change |
| K11 | Release Confidence calibrated | The score is computed from §21 inputs, and at least one score is compared against actual post-release outcome |
| K12 | Capability packs reusable | An environment/CI-CD/infrastructure/observability pack installs into a second project with pinned versions and drift detection |
| K13 | Break-glass fully governed | Invocation requires authority, records everything, expires, and its remediation is tracked to closure |
| K14 | False positives tracked, not tolerated | Per-gate false-positive rate measured; a high-rate gate produces a remediation item, not a disablement |
| K15 | Deployment authority enforced | Deploy without designated approval is impossible; per-environment authority honored |
| K16 | Incidents close the loop | An incident becomes durable work and generates at least one proposal (knowledge, architecture, routing, model, or policy) |
| K17 | Scope isolation | Gate results and packs respect 2B scoping |

## 13.11 Required evidence

Deterministic gates green; gate fault-injection report (K3 — the unavailable-gate-blocks
proof); policy floor rejection transcript (K2); a real gate run on a real candidate with
reconciled verdict (K5); **an executed and verified rollback on a real deployment (K9)** —
the headline evidence; migration rehearsal report with row counts and validation, plus a
divergence-block transcript (K8); deployment readiness checklist for a real release (K7);
Release Confidence vs. actual outcome comparison (K11); a pack installed into a second
project with drift detection (K12); break-glass lifecycle transcript through remediation
closure (K13); per-gate false-positive report (K14); an incident record with its generated
proposal (K16); independent code review; architecture review; **security review (blocking —
secret scanning, credentials, deployment authority, break-glass)**; database review
(migration safety).

## 13.12 Reviewers

`devops-engineer` (**blocking** — deployment, environments, CI/CD, packs),
`security-engineer` (**blocking** — secret scanning, dependency scanning, credentials,
break-glass, deployment authority), `database-architect` (**blocking** — migration safety,
rehearsal, rollback, data validation), `architecture-reviewer` (**blocking** — gate
framework boundaries, policy floor enforcement, reuse of 2A),
`independent-code-reviewer` (**blocking**), `reliability-engineer` (**blocking** — rollback,
health checks, failure semantics, incident loop),
`qa-engineer` (**blocking** — gate coverage and false-positive methodology),
`claude-design` + accessibility lens (accessibility gate correctness),
`observability-engineer` (observability packs, SLOs, Release Confidence inputs),
`growth-engineer` (SEO gate, advisory), **Founder** (**blocking, reserved** — D-2K-1
policy floor, D-2K-2 break-glass, D-2K-3 deployment/migration authority).

## 13.13 Founder decisions

D-2K-1 (**the policy floor** — the single most consequential quality decision in Phase 2:
it defines what Dev HQ will never ship without), D-2K-2 (break-glass procedure and who may
invoke it), D-2K-3 (deployment and migration approval authority per environment), plus:
Release Confidence weightings, and whether any gate may be model-assisted rather than
deterministic (recommendation: deterministic gates in the floor; model-assisted gates
permitted above the floor with recorded model identity).

## 13.14 Likely work-item sequence

| ID | Work item | Size |
|---|---|---|
| 2K-1 | Gate pack framework, versioning, bindings, policy floor enforcement, waivers, break-glass, gate runner on 2A | L |
| 2K-2 | Gate implementations: secret scanning, dependency scanning, security, accessibility, privacy, performance, SEO, documentation | XL |
| 2K-3 | Deployment readiness, migration safety with rehearsal, rollback orchestration | L |
| 2K-4 | Observability packs, Release Readiness scorer, incident feedback loop | M |
| 2K-5 | Capability pack registry, per-project bindings, drift detection | M |
| 2K-6 | Phase 2 exit demonstration (§15) | L |

2K-2 is the largest single work item in Phase 2 and should itself be decomposed by 2A into
one packet per gate, executed in parallel with a reconciled review — a fitting final
self-hosting proof.

## 13.15 Explicit out-of-scope

- **Marketplace distribution of packs** — Phase 4 (4B). 2K builds the registry; Phase 4
  makes it a marketplace with trust and installation governance.
- **Multi-organization policy inheritance and delegated administration** — Phase 4 (4C).
- **Savrio-specific production operations** — Phase 3. 2K builds reusable infrastructure;
  Phase 3 applies it to Savrio.
- **Compliance certification, legal holds, data residency programs** — Phase 4 (4C).
- **Platform economics, metering, billing, service tiers** — Phase 4 (4E).
- **Third-party integration fabric (external CI, cloud, security vendors)** — Phase 4 (4F).
- **Disabling a floor gate for convenience** — permanently out of scope; break-glass is for
  emergencies with remediation, not for schedule pressure (§22: sacrificing safety for
  schedule targets is prohibited).

## 13.16 Completion gate

**Gate 2K signed when:** K1–K17 pass; the policy floor is Founder-approved and structurally
enforced; a real rollback has been executed and verified; migration rehearsal is required
and demonstrated; unavailable gates block rather than pass; a capability pack is reused in a
second project; blocking reviewers approve; and the Founder accepts the floor, break-glass
procedure, and deployment authority.

**Gate 2K is immediately followed by the Phase 2 exit demonstration (§15), which is a
separate gate.**

## 13.17 Capabilities accelerated after completion

- **Phase 3 becomes possible.** Savrio cannot be built, deployed, operated, or measured in
  production without gates, deployment readiness, migration safety, rollback, and
  observability. 2K is the precondition for the entire next phase.
- **Every project gets production quality by default** rather than by remembering — which is
  the §Principles "Production quality first" commitment made mechanical.
- **New projects onboard in a fraction of the time** via capability packs.
- **Release decisions become evidence-based** through Release Confidence.
- **Incident learning compounds** — incidents feed 2C knowledge, 2E architecture and review
  learning, 2F memory, and 2H model policy.
- **Phase 4's marketplace has something to distribute** — versioned, proven gate packs and
  capability packs are exactly the marketplace's inventory.

---


---

# 14. Open Founder decisions — consolidated register

Decisions are grouped by the latest point at which they can be made without blocking
work. **Reserved** decisions are L5 per roadmap §2.

> **Decisions recorded since v1.0.0 *(added v1.1.0)*.** Four entries in this register are
> now **closed**, and they are listed here as answers rather than deleted, so the register
> stays a complete record of what was asked and what came back:
>
> | Was | Founder decision, 2026-07-26 | Recorded at |
> |---|---|---|
> | **NEW-4 / C-2** ADR numbering | **ADR numbers are assigned centrally. Specialists may propose ADR subjects but must not reserve or claim numbers independently.** This plan's ADR-0004 claim is withdrawn; §2.7 now proposes subjects with plan-local handles. | §2.7, §17.5 C-2, §18.5 |
> | Review sequence | **Independent Code Review → Architecture Review → Founder Approval → Protected Baseline**, permanently. | §0.6 |
> | Independent Code Review verdicts | **PASS · PASS WITH NON-BLOCKING FINDINGS · FAIL** | §0.6 |
> | Severity ladder | **BLOCKER · MAJOR · MINOR · OBSERVATION**, shared across all reviews and gates | §0.6 |
>
> **One decision was refused rather than granted,** and the refusal is the operative
> record: the Founder **declined a general self-certification exception** for reviewers
> certifying candidates they helped author, and **commissioned a fresh third reviewer
> instead** — route (a) of `GOV-PLAN-001` §4.1a, not route (b). See §17.5 C-6 and §18.6
> NEW-5. A refused exception is a stronger constraint than an unasked question, and this
> plan treats it as binding on Phase 2 staffing.

| ID | Decision | Latest point | Authority |
|---|---|---|---|
| **D-P1** | Approve the durable persistence backend and merge path for Sprint 1C-B | Before P2-00 | Reserved (dependency/spend) |
| **D-P7** *(added v1.1.0)* | **Assign the Context Lifecycle Manager's sprint** — a distinct deliverable sequenced between 1G and 1H (the `SPEC-CLM-001` §14.1 recommendation, which this plan endorses as a recommendation only), or folded into 1G/1H. Two specialist documents raised this and **both declined to resolve it** because sprint assignment is roadmap authority. | Before the CLM is scheduled; **not** a Phase 2 blocker | **Reserved — roadmap authority** |
| **D-P2** | Accept or reject Phase 1 exit; authorize Phase 2 execution | Before P2-01 | Reserved |
| **D-P3** | Accept residual risk on the ten unverified Sprint 1E behavioral categories, or require a validation harness first | Before P2-01 | Reserved |
| **D-P4** | Approve the ADR-0001/0002 governed-communication amendment (§1.3) | Before P2-06 / P2-26 | **Reserved — blocking** |
| **D-P5** | Approve the six blocking ADR subjects (§2.7 P2-A01, P2-A02, P2-A03, P2-A07, P2-A12, P2-A14) **and assign their numbers centrally** *(corrected v1.1.0)* | Before P2-01 | Reserved |
| **D-P6** | Approve or reject stage-overlap authorizations beyond the §2.3 *Parallel-safe* set | As requested | Reserved |
| **D-2A-1** | Global and per-project concurrency ceilings; default organization size caps | 2A-3 | Reserved (budget/capacity) |
| **D-2A-2** | Which organization types are authorized in the MVP; whether adversarial review is permitted | 2A-3 | Reserved |
| **D-2A-3** | Emergency serialization triggers and who may invoke them | 2A-3 | Delegable to Operations |
| **D-2A-4** | Whether a team lead may also be the integration owner; whether a lead reviewer may reconcile a candidate a teammate implemented | 2A-4 | Reserved (independence) |
| **D-2A-5** | Speedup/quality threshold below which HQ must refuse to parallelize | 2A-7 | Delegable after 2E |
| **D-2B-1** | The canonical scope tuple and whether tenancy is included now or deferred to Phase 4 | 2B-1 | Reserved |
| **D-2B-2** | Which projects enter multi-project operation, and their budget allocation | 2B-2 | Reserved |
| **D-2B-3** | Cross-project grant policy: default-deny with explicit grants, or role-based | 2B-1 | Reserved (security) |
| **D-2C-1** | Vault hosting, sync mechanism, and whether the vault is ever writable by agents | 2C-2 | Reserved |
| **D-2C-2** | Which knowledge classes require Founder approval to publish organization-wide | 2C-4 | Reserved |
| **D-2C-3** | Knowledge retention and archival policy | 2C-4 | Delegable to Operations |
| **D-2D-1** | Founder Dashboard metric set and what may be shown as a prediction | 2D-1 | Reserved (it is the Founder's instrument) |
| **D-2D-2** | Which delegated-acceptance rules the Founder is willing to grant, and their risk ceilings | 2D-4 | **Reserved** |
| **D-2D-3** | Whether HQ may propose its own authority expansion, and what evidence is required | 2D-4 | **Reserved** |
| **D-2E-1** | Metric retention windows and rollup granularity | 2E-1 | Delegable |
| **D-2E-2** | Health-score weightings for the six scores | 2E-2 | Reserved (they drive prioritization) |
| **D-2E-3** | Which learning proposals may auto-apply, if any (recommendation: none) | 2E-5 | **Reserved** |
| **D-2E-4** | Architecture-debt acceptance authority and thresholds | 2E-4 | Reserved |
| **D-2F-1** | Whether memory-informed routing is enabled at all, and on which task classes first | 2F-5 | **Reserved** |
| **D-2F-2** | Exploration rate (how often HQ must test a non-preferred qualified agent) | 2F-5 | Reserved |
| **D-2F-3** | Memory retention, correction, export, and deletion policy | 2F-6 | Reserved (privacy) |
| **D-2F-4** | Whether experience earned in one project may inform routing in another, and under what grant | 2F-6 | **Reserved** |
| **D-2G-1** | Session budget and duration ceilings; who may open a session | 2G-2 | Reserved |
| **D-2G-2** | Which reviewer roles are barred from collaboration sessions on candidates they will review | 2G-3 | **Reserved (independence)** |
| **D-2G-3** | Whether human participants are in Phase 2 scope or deferred | 2G-3 | Reserved |
| **D-2H-1** | Approved provider list, data-policy requirements, and spend ceilings per provider | 2H-1 | **Reserved** |
| **D-2H-2** | Model promotion authority (L4 vs. L5) and canary criteria | 2H-4 | **Reserved** |
| **D-2H-3** | Maximum binding lifetime before mandatory re-evaluation (enforces §0.4 non-permanence) | 2H-1 | **Reserved** |
| **D-2H-4** | Benchmark suite contents and the quality bar a model must clear per role | 2H-2 | Reserved |
| **D-2I-1** | Network egress policy for research agents; allowed source domains | 2I-1 | **Reserved (security)** |
| **D-2I-2** | Experiment sandbox budget and whether experiments may touch any real environment | 2I-3 | Reserved |
| **D-2J-1** | Whether pair sessions may run against project repositories or only scratch clones | 2J-1 | Reserved |
| **D-2J-2** | Promotion authority: may a pair session's output enter governed work without Founder review | 2J-3 | Reserved |
| **D-2K-1** | The policy floor: the minimum gate set no project may drop below | 2K-1 | **Reserved** |
| **D-2K-2** | Break-glass procedure and who may invoke it | 2K-1 | **Reserved** |
| **D-2K-3** | Deployment and migration approval authority per environment | 2K-3 | **Reserved** |
| **D-EXIT** | Accept Phase 2 exit; authorize Phase 3 | After P2-38 | Reserved |

---

# 15. Phase 2 exit gate

Per roadmap Appendix B, Phase 2 exit requires:

> *Multi-project operation, company knowledge, curation, executive and engineering
> intelligence, model lifecycle, collaboration, research, pair engineering, and
> self-improvement under policy, evidence-backed agent memory with freshness and
> challenge controls, and self-improvement under policy.*

Assembled from stage gates, the exit evidence package is:

1. **All eleven stage gates signed**, in order, each with its own evidence package.
2. **Multi-project operation demonstrated:** ≥2 projects run concurrently under isolated
   budgets, policies, and quality gates, with at least one coordinated cross-project
   change and one proven isolation test.
3. **Knowledge compounding demonstrated:** a reviewer finding or incident traced end to
   end — finding → proposal → curator validation → published lesson → retrieval into a
   later work packet → measured effect on the later outcome.
4. **Intelligence demonstrated:** health scores, trends, and at least one forecast with
   stated confidence, each traceable to authoritative events and candidate identities.
5. **Memory demonstrated:** measurable quality-adjusted improvement on a repeated task
   class, with every memory-informed decision explainable, an exercised challenge and
   correction, a proven kill switch, and zero harmful-memory incidents outstanding.
6. **Model lifecycle demonstrated:** a full benchmark → policy → shadow → canary →
   promotion → **rollback** cycle, with **no role permanently bound to any model** and
   every binding carrying an expiry and a revocation path (§0.4).
7. **Collaboration and pair engineering demonstrated:** governed sessions with complete
   write-back, preserved review independence, and a pair session promoted into governed
   work through normal gates.
8. **Research demonstrated:** an ADR proposal produced from primary sources with
   citations, uncertainty, alternatives, and a proof plan — subsequently implemented.
9. **Production platform demonstrated:** gate packs enforced at the policy floor, a
   rehearsed migration with an executed rollback, and a release-readiness decision made
   on evidence.
10. **Self-improvement under policy demonstrated:** the majority of Phase 2's own
    engineering work performed by Dev HQ, with Founder intervention rate, automation
    percentage, and reserved-decision frequency measured and reported (§21).
11. **No prohibited shortcut taken** (§22), with the register of §22 items and how each
    was honored.
12. **Founder acceptance** of the complete evidence package.

---

# 16. Plan-level limitations and honesty statement

Recorded per AGENT-001 (Validation Standards, Communication Standards):

1. **This plan is unvalidated direction, not evidence.** No Phase 2 code exists. Every
   acceptance criterion in this document is a target, not a result.
2. **Sizing is relative, not estimated.** There is no measured Phase 2 velocity, so no
   date or duration in this plan would be honest. Dates become derivable after 2E-2
   delivers forecasting with confidence intervals.
3. **The work-item counts are a plan, not a commitment.** 62 work items across 11 stages
   reflects current understanding of the roadmap text; stage-level technical plans will
   revise them, and 2I research may materially change 2C, 2E, 2F, and 2H designs.
4. **Three roadmap tensions are recorded, not resolved:** the ADR communication invariant
   (§1.3), the 2D-before-2E measurement ordering (R-2), and hierarchical team placement
   (R-12). Each names a Founder decision.
5. **The persistence precondition (P-1) is a Phase 1 gap this plan surfaces but does not
   own.** If the Founder chooses to begin Phase 2 without it, stages 2C, 2E, 2F, and 2H
   cannot meet their acceptance gates, and this plan cannot be executed as written. That
   consequence is stated so the choice is informed, not to pre-empt it.
6. **Data models, interfaces, and observability specifications in the stage sections are
   design proposals at plan altitude.** They are specific enough to review and to size,
   not final. Each requires its stage ADR and technical plan.
7. **No capability was moved between phases.** Phase 1 preconditions are cited as
   existing Phase 1 scope; Phase 3 and Phase 4 items encountered while planning (business
   outcome intelligence, multi-organization tenancy, marketplace, enterprise workspaces)
   are recorded in stage out-of-scope sections and left in their approved phases.

---

```
==================================================
COLLABORATION HANDOFF
==================================================
```

**Workstream:** Phase 2 implementation planning (PLAN-P2-001)
**Status:** COMPLETE SPECIALIST DRAFT — awaiting integration review. Planning only. Not
approved. No implementation authorized.
**Baseline inspected:** branch `validation/sprint-1e-overnight-2026-07-26` @ **`88b0d65`**,
working tree including four untracked artifacts (this document plus three owned by other
workstreams). Repository claims re-verified at this HEAD; see §17.11.
**Parallel workstreams identified:** Sprint 1F implementation planning · Mission Control
Lite UX design · research backlog · persistence/deployment · Sprint 1E remediation
specification · validation-workflow diagnosis.

## 17.1 Decisions made

Decisions this workstream made **within its own authority** (plan structure, sequencing
proposals, and design proposals at plan altitude). None is an architecture decision; none
binds another workstream; each is reversible by integration review.

| # | Decision | Rationale | Reversible by |
|---|---|---|---|
| DM-1 | Preserve the approved 2A→2K order as **gate sign-off order**, and permit implementation overlap only where the later stage consumes nothing undelivered | Honors the constraint literally while remaining executable; inverting a §2.1.1 hard edge is what produces the R-3/R-4 retrofits | Founder (D-P6) |
| DM-2 | Treat every roadmap tension found as **recorded, not resolved** — three are surfaced (§1.3, R-2, R-12) with named Founder decisions | Roadmap Appendix G reserves roadmap change to the Founder; AGENT-001 forbids choosing an unauthorized interpretation | — |
| DM-3 | Resolve the 2D-before-2E measurement inversion with a **read-port seam** (2D-1 defines `MetricQuery`/`MetricSnapshot` + thin projection; 2E-2 implements behind it) rather than reordering stages | Keeps the approved order intact and prevents two sources of numeric truth in the Founder's dashboard | Integration review / architecture ADR |
| DM-4 | Enforce model neutrality **structurally**: non-nullable `RoutingPolicyBinding.expiresAt`, a CI ban on model identifiers outside registry data, an expiry sweep, and gate criterion H19 (a demonstrated role↔model swap incl. rollback) | Roadmap §22 prohibits hardcoding providers into orchestration; a documented policy without a mechanism decays | Architecture review |
| DM-5 | Size in **relative units (S/M/L/XL), never dates** | No measured Phase 2 velocity exists; any date would be fabricated (AGENT-001 §Communication Standards) | After 2E-2 ships forecasting |
| DM-6 | Write three gates so a **negative result passes** (2A A11/A12, 2F F16, 2I I15) | §22 prohibits treating remembered success as proof; a gate that can only be passed by a positive result manufactures positive results | Founder |
| DM-7 | Recommend **no auto-apply** for any 2E learning proposal and **no cross-project memory transfer** by default in 2F | §12/§12A require validation before change; default-deny is the reversible choice | Founder (D-2E-3, D-2F-4) |
| DM-8 | Place **hierarchical team formation** in 2A's mature version, not its MVP | Roadmap §4A stages it to *late* Phase 2 explicitly | Founder (D-2A-2) |
| DM-9 | Ship 2A with the **Communication Broker disabled** pending the P-7 ADR | Building it enabled would act under an invariant two approved ADRs forbid | Founder (D-P4) |
| DM-10 | *(added on HEAD re-check)* Place the **simulated→real agent transition as P-8, the first work inside Phase 2** (sprint P2-00), not before Phase 2 | ADR-0001 D4 assigns real agents to Phase 2; moving them earlier would relocate Phase 2 scope into Phase 1 | Founder |

## 17.2 Assumptions

Each is a planning assumption, not a fact. If it is wrong, the named scope changes.

| ID | Assumption | If wrong |
|---|---|---|
| A-1 | Phase 1 completes before Phase 2 begins, including 1F–1I and the Context Lifecycle Manager | P-5 is unmet; 2A cannot generalize a static decomposition that does not exist; 2C has no Context Router to attach to |
| A-2 | Durable persistence (P-1) lands before any Phase 2 record is created | 2C/2E/2F/2H gates become unprovable; §2.6 R-1 (catastrophic) materializes |
| A-3 | The durable backend supports transactional compare-and-set with the semantics ADR-0001 D7 specifies | 2A's packet claim, concurrency governor, and budget reservation designs need rework |
| A-4 | Two real projects will exist for 2B (Dev HQ + one other) | Isolation (B2) cannot be demonstrated; 2B's gate is unprovable against a single project |
| A-5 | Obsidian vault sync can be one-way (service→vault) in 2C's MVP with manual proposal intake | 2C-2 grows to full bidirectional merge, moving from M to L |
| A-6 | The Founder wants delegated acceptance eventually, even if not at 2D | 2D-4 is deferrable, and 2D still passes its gate with no rules granted |
| A-7 | Phase 1's accumulated review history is large enough for 2E-3 Review Learning to find real weaknesses | E8/E9 produce "insufficient evidence"; the gate passes on capability, not on findings |
| A-8 | Memory-informed routing will show measurable lift on at least one repeated task class | F16 records "unsupported" and 2F ships with influence disabled — an acceptable gate outcome by DM-6 |
| A-9 | Approved providers will offer ≥2 substitutable models per role dimension | 2H's H19 replaceability demonstration has no substitute to swap to, and neutrality stays nominal |
| A-10 | Research egress can be allow-listed without blocking legitimate primary sources | 2I-1 needs a broader policy or a manual-fetch fallback |
| A-11 | Gate packs can run as 2A review packets rather than needing separate infrastructure | 2K-1 grows significantly |
| A-12 | *(added)* Real-agent provider adapters fit behind the existing `AgentProvider` contract without contract change | P-8 becomes a contract migration touching every adapter and the composition root |
| A-13 | *(added)* `WorkItem` (ADR-0002 E8) can be promoted **before** 2A-1, or 2A's records can attach to `Task` and be re-parented later | If neither holds, 2A-1's identity model is blocked on an E8 decision — see §17.5 C-4 |

## 17.3 Interfaces with other workstreams

| Workstream | Owner | Interface | This workstream's position |
|---|---|---|---|
| **Sprint 1F implementation planning** (`docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md`) | Lead Software Engineer | 1F Mission Control Lite is the surface 2D extends (Stage 2 Founder Dashboard, Stage 3 Executive Dashboard). 1F is precondition P-5. Its §20 Q-1 persistence question **is** our P-1. | **We defer to 1F on all Stage 1 Mission Control scope.** 2D adds Stages 2–3 and must not restate or rebuild Stage 1. Their ADR-0003 claim supersedes our numbering (§2.7). **→ SUPERSEDED at v1.1.0: neither workstream numbers its own ADRs. Numbers are assigned centrally (§19.1); 1F is being corrected for its ADR-0003 claim as this plan is for its ADR-0004 claim.** |
| **Mission Control Lite UX design** (`agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md`) | claude-design | Information architecture, navigation, phone-first behavior, accessibility that 2D's dashboards inherit | **Design is authoritative on UX** per AGENT-001 §Department Boundaries. 2D §6.6/§6.12 name `claude-design` as a blocking reviewer; our dashboard descriptions are engineering sizing inputs, not UX decisions. |
| **Persistence / deployment** | referenced by 1F §20 Q-1; owner not yet visible to us | P-1 and assumption A-3 (transactional CAS semantics). Every Phase 2 data model in §3–§13 lands in their schema. | We state the **requirement** (durability, scope keys, CAS, retention, time series); they own the **backend decision**. Our §4.5 `ScopeKey` and §7.5 metric schemas are the largest downstream consumers and should be reviewed by them before 2B-1/2E-1. |
| **Sprint 1E remediation specification** (`ISSUE_MATRIX.md`) | AR-1E / ENG-SPEC | Precondition P-3. Adds two event types and changes five service files. Carries an approved-pattern policy: *"Throw only when the caller could not have been right. Absorb when the caller was right and the world moved."* | **2A §3.9's failure policy and 2E-1's event vocabulary must conform to that rule, not invent a parallel one.** We adopt it as a constraint. Their matrix is *awaiting Founder approval*; we assume approval and will re-check. |
| **Validation-workflow diagnosis** (`WORKFLOW_DIAGNOSIS.md`) | validation coordinator | Its §6 standing corrections constrain how every Phase 2 sprint is staffed and reviewed | **We adopt all five**, notably "designer and reviewer must be different agents" (which our 2A §3.7 independence rules already require) and "an unresponsive specialist is a workflow failure, never agreement." See §17.5 C-6. |
| **Research backlog** (`docs/research/RESEARCH_BACKLOG.md`, RESEARCH-001) | Lead Software Engineer, research-planning capacity | Its **Rank D = "Needed before Phase 2"** overlaps our §14 decision register and our stage 2I | Two ID spaces describe overlapping questions (their R-nn, our D-nn). **Needs a single reconciled register** — see §17.6 Q-1. Their document is the right home for *questions requiring research*; ours for *decisions requiring authority*. |
| **Founder / Operations** | Founder | §14's 44 decisions, of which 6 blocking ADRs and D-P1…D-P4 gate the program start | Delivered as a consolidated register with latest-decision-point and authority level. |

## 17.4 Dependencies

**Inbound — this plan cannot execute without:**

1. **P-1 durable persistence** (external workstream + Founder). Hard blocker for 2C/2E/2F/2H.
2. **P-2 Phase 1 exit gate** (Founder). Roadmap §22 prohibits starting before it.
3. **P-3 Sprint 1E behavioral closure** (reliability + Founder), now with a named remediation
   set in `ISSUE_MATRIX.md` awaiting Founder approval.
4. **P-4 model resolution indirection** (engineering) — cheap now, expensive later.
5. **P-5 1F/1G/1H/CLM/1I complete** (engineering; 1F planning in flight elsewhere).
6. **P-6 1E-8/1E-9 timeline and read-model** (engineering, deferred into 1F).
7. **P-7 governed-communication ADR** (**Founder, reserved**). Blocks 2A-6 and all of 2G.
8. **P-8 simulated→real agent transition** (engineering + Founder). Must precede Gate 2A.
9. **P-9 ADR-deferral triage** (engineering + Founder): D6, D8, O3, E8 assigned to stages.
10. **Six blocking ADRs** (§2.7 #1, #2, #3, #7, #12, #14) approved before 2A-1, **plus** the
    two added on re-check (real-agent adapters; `WorkItem`).

**Outbound — other workstreams depend on this plan for:**

1. **The 1F/2D boundary.** What 1F must *not* build because 2D owns it (advanced analytics,
   forecasts, scenarios, recommendations) and what 1F must expose for 2D to consume.
2. **The scope-key contract** (§4.5). Persistence and 1F both need to know the canonical
   scope tuple before schema work — this is the highest-leverage cross-workstream artifact
   in the plan.
3. **The canonical event vocabulary** (§7.5). Every subsystem emitting events before 2E-1
   should emit into it, or pay a retrofit.
4. **The ADR candidate list and numbering discipline** (§2.7).
5. **The Phase 2 exit evidence package** (§15), which is what Phase 3 planning inherits.

**Internal critical path:** unchanged from §2.2, with P-8 inserted before Gate 2A.

## 17.5 Potential conflicts

| ID | Conflict | Severity | Our position |
|---|---|---|---|
| **C-1** | **Governed agent communication vs. ADR-0001/ADR-0002.** Both ADRs preserve "no direct agent-to-agent communication"; roadmap §4A/§13A/2A/2G require brokered communication. | **Blocking** | Founder-reserved (D-P4). 2A ships communication disabled until resolved. We do not interpret it ourselves. |
| **C-2** | **ADR number collision.** 1F claims ADR-0003 for persistence/deployment; our list assumed numbering from ADR-0003. | Low, but confusing in permanent history | We yield: Phase 2 numbers from **ADR-0004**. Recommend the Founder assign numbers centrally. **→ CLOSED by Founder decision 2026-07-26; the ADR-0004 claim is withdrawn. See §19.1.** |
| **C-3** | **Scorecards are assigned to two different places by two approved ADRs.** ADR-0001 **D8**: *"Scorecards: deferred to Phase 2."* ADR-0002 Future Considerations: *"Scorecards and analytics (Sprint 1F)."* Roadmap §7 puts the Founder Dashboard in *early Phase 2* and §5 says 1F defers advanced analytics to Phase 2. | **Material** — it is exactly the 1F/2D boundary | Three sources, two answers. **Founder decision required.** Our position: scorecards/analytics belong to **2D/2E** (consistent with ADR-0001 D8 and roadmap §7), and 1F ships Stage 1 operational views only. But ADR-0002 says otherwise and we will not overrule it. |
| **C-4** | **`WorkItem` promotion (ADR-0002 E8) is unassigned.** Our 2A/2B records attach to `Task`/`Execution`; E8's target hierarchy is Project → WorkItem → Task → Execution → AgentAssignment, deferred to Phase 2. | **Material** | Whoever promotes `WorkItem` changes where organization and packet records attach. Either E8 lands **before 2A-1**, or 2A-1 attaches to `Task` with an explicit re-parenting plan. Recommend the former. Assumption A-13. |
| **C-5** | **The 1F workstream's deconfliction against this plan is stale.** It read `PHASE_2_PROGRAM_PLAN.md` at **641 lines**; the final document is **~3,480**. Its comparison was against a partial mid-write draft that contained the program-level analysis but **none of the eleven stage sections**. | **Material for review integrity** | Their §20.4 divergence list must be re-derived against this final version before either plan is approved. Not their error — a concurrency artifact of parallel authoring. |
| **C-6** *(revised at `357f03b`)* | **Implementation-specification delivery is failing across agent types, and the plan's review-independence model depends on it.** `WORKFLOW_DIAGNOSIS.md` §4c withdraws the agent-type-specific conclusion: **4 consecutive freshly-spawned agents across 2 types**, all asked to produce exact patch text, delivered nothing; 2 long-lived reviewer agents delivered nine. Root cause **UNKNOWN**. The diagnosis escalates it as *"a real structural blocker"* for Phase 2 because designer ≠ reviewer separation *"cannot currently be satisfied as specified."* | **Blocking for execution — the most serious operational finding in this handoff** | This plan is written in **roles**, so its *content* survives. Its *executability* does not: every stage requires an implementation owner distinct from its reviewers (2A §3.7, 2G §9.7, and the §12.12/§13.12 reviewer tables all assume it). We do **not** propose the workaround the diagnosis rightly refuses — a coordinator writing the work and describing the review as independent. **Escalated, unresolved.** Candidate mitigations for the Founder to weigh: (a) staff implementation from long-lived resumed agents rather than fresh spawns, since that is the one variable correlating with all nine successes; (b) decompose specification tasks into review-shaped deliverables, since every "review and report" task succeeded; (c) accept human implementation for Phase 2 with AI review. None is validated; the root cause is unknown and this plan will not guess. **→ SUPERSEDED: the central claim was falsified by demonstration, and the problem then moved rather than resolving. See §19.2.** |
| **C-7** | **Event vocabulary churn.** `ISSUE_MATRIX.md` adds `execution.assignment_deferred` and `execution.claim_lost`; our 2E-1 canonical model must absorb them, and our 2A event list was written before them. | Low | 2E-1's retrofit list must include the post-remediation 1E event set. Sequence P-3 before 2E-1 (already true). |
| **C-8** | **R-2 (2D before 2E)** remains a live design tension even with the read-port mitigation. | Medium | Mitigated by DM-3, not eliminated. If integration review prefers reordering, see §17.9 RC-2. |
| **C-9** | **Per-agent capacity.** ADR-0001 **D6** fixes capacity at 1 per agent and defers `maxConcurrency > 1`. 2A's parallel-team mode needs many concurrent workers. | Medium | Parallelism comes from *many agents*, not from per-agent concurrency, so 2A's MVP works under D6. Lifting D6 is a 2A-3 option, not a requirement. Recommend lifting it only when the optimizer shows it pays. |
| **C-10** | **Capability taxonomy.** ADR-0001 **O3** freezes ten capabilities for Phase 1 and defers a department-mapped taxonomy to Phase 2. 2A staffing and 2F task classes both need the fuller taxonomy. | Medium | Assign O3's expansion to 2A-3 (staffing) with 2F-2 consuming it as task classes. Needs an owner; currently unassigned. |

## 17.6 Questions for other specialists

| ID | To | Question | Why it matters to us | Needed by |
|---|---|---|---|---|
| **Q-1** | Research-backlog owner | Can we reconcile your Rank-D ("needed before Phase 2") items with our §14 register into **one** decision list with one ID space? Which of your R-nn items are the same question as our D-nn items? | Two overlapping registers means the Founder answers some questions twice and others never | Before P2-00 |
| **Q-2** | Persistence workstream | What are the transactional guarantees of the chosen backend — compare-and-set, row-level scoping, and time-series/rollup support? Does row-level security exist for 2B isolation, or must isolation be enforced in the repository layer? | Assumption A-3; 2A packet claim, 2B `ScopeKey` enforcement point, and 2E metric store all depend on the answer | Before 2A-1 and 2B-1 |
| **Q-3** | Sprint 1F planning owner | Do you agree that scorecards/analytics belong to 2D/2E rather than 1F (conflict C-3), and can you re-derive your §20.4 divergence list against this final document rather than the 641-line draft you read (C-5)? | The 1F/2D boundary is unresolvable without your position; and your deconfliction is currently against a partial draft | Before either plan is approved |
| **Q-4** | claude-design | Does your Mission Control IA extend cleanly to Stage 2 and Stage 3 dashboards, or does adding forecasts, scenarios, and recommendations require an IA change you would rather make in 1F? | Cheaper to make the IA decision once in 1F than to restructure in 2D | Before 1F-11 (their numbering) |
| **Q-5** | 1E remediation owner (AR-1E / ENG-SPEC) | Is the "throw only when the caller could not have been right" rule intended to bind **all future** Work Management operations, including 2A's packet claim, budget reservation, and concurrency acquisition? | We want to conform to it rather than invent a parallel failure taxonomy | Before 2A-1 |
| **Q-6** | architecture-reviewer | Do you read brokered, durable, non-authoritative agent messaging as *compatible with* ADR-0001/0002's "no direct agent-to-agent communication," or as a **material deviation** requiring a superseding ADR? Our plan assumes the latter and blocks accordingly. | If it is compatible, 2A-6 and 2G unblock without a Founder decision | Before P2-06 |
| **Q-7** | Whoever owns ADR-0002 E8 | Will `WorkItem` be promoted before 2A-1, or should 2A attach organization/packet records to `Task` with a re-parenting plan? | C-4; determines 2A-1's identity model | Before 2A-1 |
| **Q-8** *(revised)* | Validation-workflow owner + Founder | Given §4c's withdrawal — the failure spans two agent types and four fresh spawns, and correlates only with fresh-spawn-plus-patch-authoring — **can any Phase 2 stage be staffed with an implementation owner independent of its reviewers today?** Is the long-lived-vs-freshly-spawned hypothesis (§4c candidate 3, "consistent with the data, but untested") worth testing before P2-00, since it is the only variable consistent with all nine successes and all four failures? | C-6. This determines whether Phase 2 is executable as planned at all, not merely how it is staffed | **Before P2-00 — this is now the second hard blocker alongside P-1** *(→ SUPERSEDED: partially answered by demonstration; the residual question changed shape. See §19.2)* |
| **Q-9** | reliability-engineer | Are the ten unverified 1E behavioral categories getting a runnable harness (P-3), or will the Founder accept residual risk? 2A's acceptance suite would extend that harness rather than build a new one. | Avoids two parallel test harnesses | Before 2A-9 |

## 17.7 Founder decisions required

The full register is §14 (44 decisions). **Required before Phase 2 can start:**

| ID | Decision | Why it blocks |
|---|---|---|
| **D-P1** | Approve the durable persistence backend and merge path | P-1; without it 2C/2E/2F/2H gates are unprovable |
| **D-P2** | Accept Phase 1 exit; authorize Phase 2 | Roadmap §9/§22 |
| **D-P3** | Accept residual risk on the ten unverified 1E categories, or require a harness — and approve or reject `ISSUE_MATRIX.md` | P-3; the matrix is explicitly awaiting you |
| **D-P4** | **Approve the governed-communication ADR amendment** (§1.3) | Blocks 2A-6 and all of 2G |
| **D-P5** | Approve the blocking ADRs (§2.7 #1, #2, #3, #7, #12, #14, plus real-agent adapters and `WorkItem`) | 2A-1, 2B-1, 2E-1, 2F-1 identity and vocabulary models |
| **D-P6** | Approve any stage overlap beyond the *Parallel-safe* set | Preserves the approved dependency order |
| **NEW-1** | **Resolve C-3: do scorecards/analytics belong to Sprint 1F or to 2D/2E?** Two approved ADRs disagree. | The 1F/2D boundary; affects both plans |
| **NEW-2** | **Resolve C-4/Q-7: `WorkItem` promotion before 2A-1, or `Task` attachment with re-parenting?** | 2A-1's identity model |
| **NEW-3** | **Approve providers and spend for the real-agent transition (P-8)**, and decide whether real agents phase in per role or all at once | Gate 2A's A11/A12 is not evaluable on simulations |
| **NEW-4** | Assign ADR numbers centrally (C-2) | Prevents collisions in permanent history. **→ DECIDED 2026-07-26; see §19.1** |
| **NEW-5** | **Decide how Phase 2 is staffed given C-6.** Four freshly-spawned agents across two types produced no implementation specification; designer ≠ reviewer separation is currently unsatisfiable. Already escalated to you by `WORKFLOW_DIAGNOSIS.md` §4c. | Every stage in this plan assumes an implementation owner independent of its reviewers. Without a resolution, Phase 2 is not executable as planned — regardless of how good the plan is. **→ SUPERSEDED; the premise was falsified and the question changed shape. See §19.2** |

**Highest-leverage decisions later in the program:** D-2D-2 (which delegated-acceptance
rules to grant), D-2F-1 (whether memory-informed routing is enabled at all), D-2H-3
(maximum binding lifetime — the number that makes model non-permanence enforceable),
D-2K-1 (the policy floor — what Dev HQ will never ship without).

## 17.8 Items intentionally left unresolved

| # | Item | Why left open | Who should close it |
|---|---|---|---|
| 1 | The three roadmap tensions: communication invariant (§1.3), 2D↔2E ordering (R-2), hierarchical-team placement (R-12) | Roadmap Appendix G reserves roadmap change to the Founder; AGENT-001 forbids choosing an unauthorized interpretation | Founder |
| 2 | Whether the existing `standards/*`, `handbooks/*`, `docs/workflows/*` corpus migrates into the 2C knowledge service, is mirrored, or stays repository-native | It determines whether standards are repository truth or institutional knowledge — a governance question, not an engineering one. Our recommendation is recorded (§5.13); the decision is not ours | Founder + Knowledge Curator |
| 3 | Health-score weightings (D-2E-2) | Weightings drive prioritization, therefore behavior. Choosing them silently would let this plan set organizational priorities | Founder |
| 4 | The 2K policy floor (D-2K-1) | It defines what the company will never ship without. Not a specialist's call | Founder |
| 5 | Whether human participants are in Phase 2 scope (D-2G-3) | Depends on Founder intent for Phase 3/4 sequencing, not on engineering feasibility | Founder |
| 6 | Exact sprint durations and dates | No measured velocity exists; DM-5. Deliberately left as relative sizes | Derivable after 2E-2 |
| 7 | Owner assignment for ADR-0001 O3's capability-taxonomy expansion (C-10) | Sits between 2A staffing and 2F task classes; needs a cross-stage owner | Integration review |
| 8 | Whether any 2K gate may be model-assisted rather than deterministic | Recommendation recorded (deterministic in the floor); decision is the Founder's | Founder |
| 9 | Which second project enters 2B (D-2B-2) | A portfolio decision, and A-4 depends on it | Founder |
| 10 | Whether `tsc`, `eslint`, and `next build` still pass at `88b0d65` | Only `vitest` was re-run this pass (317/317). The three intervening commits are documentation-only, so unchanged results are a sound inference — but inference is not evidence, and this plan does not present it as such | Whoever next runs the full gate suite |

## 17.9 Recommended changes if another specialist disagrees

Pre-agreed fallbacks, so disagreement produces a decision rather than a stall.

| ID | If a specialist disagrees that… | Recommended change |
|---|---|---|
| **RC-1** | …P-1 must precede all Phase 2 work | Re-sequence to 2A + 2B + 2D **only** (organization, project, dashboard records tolerate rebuild), and explicitly defer 2C/2E/2F/2H until persistence lands. Do **not** proceed with 2C/2E/2F/2H on memory; instead record in §16 that their gates are unprovable and remove them from the Phase 2 exit package until persistence exists. |
| **RC-2** | …the R-2 read-port seam is the right fix for 2D-before-2E | Two alternatives, in order of preference: (a) split 2E-1 (canonical event model + ingestion only) to land **before** 2D, keeping every later gate in the approved order — the smallest change that removes the tension; (b) descope 2D's MVP to Stage 2 health display only, deferring forecasts/scenarios/recommendations to a 2D' pass after 2E. Either requires Founder sign-off as a sequencing change. |
| **RC-3** | …brokered communication requires a superseding ADR (Q-6) | If architecture review rules it compatible, delete P-7, restore 2A-6 to the normal 2A sequence, and unblock 2G — no other change. The plan is written so this is a one-line unblock. |
| **RC-4** | …scorecards belong to 2D/2E (C-3) | Move scorecard *computation* into 1F as ADR-0002 states, and reduce 2D-1 to consuming it via the same `MetricQuery` port. 2D's gate criteria are unaffected; only the implementation owner changes. |
| **RC-5** | …`WorkItem` should land before 2A-1 (C-4) | 2A-1 attaches `organizationId`/`packetId` to `Task` as designed, plus a documented re-parenting migration in the 2A-1 ADR. Cost: one additive migration in 2B or later. |
| **RC-6** | …memory-informed routing should ship enabled | Ship 2F recording-only with influence disabled and F16 measured in shadow. This is already DM-7's recommendation and needs no plan change — only a Founder decision (D-2F-1). |
| **RC-7** | …hierarchical teams should be in 2A's MVP (R-12) | Add 2A-10 (hierarchical mode) **after** 2A-7's optimizer produces coordination-overhead data, so the decision is evidence-based. Do not fold it into 2A-3. |
| **RC-8** | …11 stage gates are too many | Merge the demonstration gates of adjacent low-risk stages (2I+2J are the only defensible pair), but keep 2A, 2B, 2C, 2E, 2F, 2H, 2K gates separate. R-13 explains why collapsing them makes failure attribution impossible. |
| **RC-9** | …relative sizing is insufficient for planning | Provide a **capacity-conditional** schedule: dates expressed as functions of measured throughput, published after 2E-2, with confidence intervals. Do not convert relative sizes into dates by assumption. |
| **RC-10** | …the plan is too large to review | Review order: §1 preconditions → §2.6 risks → §2.7 ADRs → §17 this handoff → then stage sections in dependency order. §2.8 (MVP vs. mature) is the scope-cutting instrument if the program must shrink. |

## 17.10 Short executive summary

Phase 2 turns Dev HQ into a self-improving, multi-project engineering organization across
eleven stages (2A→2K), in the approved dependency order, expanded here into 62 work items,
39 sprints, ~25 ADR candidates, and 11 stage gates plus a Phase 2 exit gate.

**The order matters more than the content.** 2A comes first because it is the mechanism by
which the other ten stages get built; 2B second because it establishes the scope key that
every knowledge record, metric sample, and memory claim needs at birth — creating those
records unscoped is the most expensive retrofit in the program. Thirteen wrong-order risks
are analyzed; the four severe ones (no persistence, unscoped records, memory before
statistical validation, communication before its ADR) are each avoidable by sequencing
alone.

**Three things block the start, and none of them is code.** Durable persistence is a Phase 1
gap: the store is in-memory by its own header, so four Phase 2 stages cannot prove their
gates. Real AI agents are Phase 2 scope per ADR-0001 D4 and must land before Gate 2A,
because "adaptive teams outperform single-owner execution" is not evaluable against a
deterministic simulation. And governed agent communication contradicts an invariant two
approved ADRs preserve — a Founder decision, not an engineering interpretation.

**Model neutrality is built as a mechanism, not a promise.** No role is bound to any model
anywhere in the plan. Bindings carry a non-nullable expiry, a CI check bans model
identifiers outside registry data, an expiry sweep reverts un-re-evaluated bindings, and
Gate 2H requires demonstrating a real role↔model swap through benchmark, shadow, canary,
promotion, and rollback. Hermes is treated exactly as every other model.

**Three gates are written so a negative result passes.** If adaptive teams do not outperform
single owners, if memory does not improve outcomes, or if research cannot reach a
conclusion, the honest gate outcome is a recorded finding — not a claim the evidence does
not support.

**One blocker is not about Phase 2 at all.** The validation-workflow diagnosis records four
freshly-spawned agents across two types producing no implementation specification, against
nine deliverables from two long-lived reviewer agents, root cause unknown. Every stage here
assumes an implementation owner independent of its reviewers. Until that is resolved, the
constraint is on execution, not on the plan — and the plan should not be read as evidence
that Phase 2 can be staffed today.

**Status:** complete specialist draft, ready for integration review. Ten decisions made
within scope, thirteen assumptions declared, ten conflicts identified, nine questions posed
to other specialists, **eleven** Founder decisions required (five newly surfaced by the HEAD
re-checks), ten items deliberately left unresolved, and ten pre-agreed fallbacks so
disagreement produces a decision rather than a stall.

## 17.11 Findings that changed after re-checking HEAD

HEAD moved `057e12c` → `88b0d65` during authoring (three documentation-only commits;
**no source file changed**). Six claims changed; four were confirmed unchanged.

**Changed:**

| # | Original claim | Corrected finding | Impact |
|---|---|---|---|
| **1** | *"Sprints 1F–1I are not started; `docs/plans/` contains 1D and 1E only."* | **False.** 1F *planning* has started: `SPRINT_1F_MISSION_CONTROL_LITE.md` and `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` both exist (untracked specialist drafts). 1F *implementation* has not started. | §1.1 corrected; P-5 now references the existing 1F plan; three new interfaces in §17.3 |
| **2** | Not stated at all | **ADR-0001 D4: Phase 1 agents are deterministic simulations; "Real AI agents begin in Phase 2."** The plan never accounted for this transition. Gate 2A's A11/A12 is **not evaluable** against ADR-0001 O4's simulated agent, whose outcome derives deterministically from its input. | **New precondition P-8**, added to sprint P2-00, sequenced before Gate 2A; new ADR candidate; new Founder decision NEW-3. This is the most material gap the re-check found. |
| **3** | ADR numbering "continues from ADR-0002" | The 1F workstream already claims **ADR-0003** for persistence/deployment. | Phase 2 ADRs renumber from **ADR-0004**; §2.7 caution added; Founder decision NEW-4. **→ WITHDRAWN at v1.1.0: no workstream claims numbers. See §19.1.** |
| **4** | Not stated | **Six items are already recorded as deferred to Phase 2** in approved documents: ADR-0001 D4, D6 (per-agent concurrency), D8 (scorecards), O3 (capability taxonomy); ADR-0002 E8 (`WorkItem` promotion); and CR-11/P-2 (`review-service.ts:485-492`), which `SPRINT_1E_COMPLETION_NOTES.md` §7 item 12 explicitly labels a *"Phase 2 gate."* The plan inventoried none of them. | **New precondition P-9**; conflicts C-4, C-9, C-10; Founder decision NEW-2 |
| **5** | Not stated | **ADR-0001 D8 and ADR-0002 Future Considerations disagree on where scorecards live** — "deferred to Phase 2" vs. "Sprint 1F." Roadmap §7 supports Phase 2. | **New conflict C-3**, directly on the 1F/2D boundary; Founder decision NEW-1; Q-3 to the 1F owner |
| **6** | `ISSUE_MATRIX.md` was untracked background | Now committed at `feace4d`, **awaiting Founder approval**, and it will **add two event types** (`execution.assignment_deferred`, `execution.claim_lost`) plus an approved failure-classification rule our 2A §3.9 must conform to. | §1.1 row added; conflicts C-7; Q-5 |
| **7** | Not stated | **HEAD moved a second time during this handoff** (`88b0d65` → `357f03b`, again documentation-only). `WORKFLOW_DIAGNOSIS.md` §4c **withdraws** the agent-type-specific conclusion: the delivery failure spans **two agent types and four freshly-spawned agents**, all asked to author exact patch text, against **nine** deliverables from two long-lived reviewer agents. Root cause **UNKNOWN**. The diagnosis escalates a *"real structural blocker"* for Phase 2: designer ≠ reviewer separation *"cannot currently be satisfied as specified."* | **Conflict C-6 rewritten from "one unreliable role" to "Phase 2 may not be executable as staffed."** Q-8 rewritten and escalated. This is now the second hard blocker alongside P-1. I recorded the superseded version minutes earlier and corrected it on re-check — a demonstration of why the re-check was worth doing. |

**Confirmed unchanged (re-verified at `88b0d65`):**

1. **Persistence is still in-memory only.** `lib/dev-hq/store.ts:1-2` verbatim: *"Development-only
   centralized in-memory store. Single Next.js process, non-durable, not for production."* No
   Supabase code exists outside two mock/placeholder data files. ADR-0001 **D7** confirms this is
   the approved Phase 1 position — so **P-1 is now backed by ADR authority, not just by
   observation.**
2. **Only ADR-0001 and ADR-0002 exist.** `docs/decisions/` unchanged.
3. **12 contracts in `types/contracts/`** (13 files including `index.ts`); no 1G/1H/CLM artifacts
   in `lib/dev-hq/` — P-5 holds.
4. **Deterministic gates: `npx vitest run` re-run at `88b0d65` → 22 files, 317 tests passed**,
   matching validation report §2 exactly. `tsc`/`eslint`/`next build` were **not** re-run; see
   §17.8 item 10.

**Nothing in the eleven stage sections (§3–§13) changed as a result of the re-check**, other
than the additions recorded above. The stage designs are unaffected because no source code
moved.

> **§17 above is preserved as written.** It is the record of this workstream's specialist
> draft at the point of first handoff. §18 below supersedes it where they differ, and every
> difference is enumerated in §18.1 rather than edited into §17 silently.

---

# 18. FINAL INTEGRATION HANDOFF

**Consistency pass performed against:** HEAD `357f03b`, branch
`validation/sprint-1e-overnight-2026-07-26`, working tree including all untracked specialist
outputs. Eleven stage sections **not redesigned**. Approved **2A→2K gate order unchanged** —
no authoritative source required a change.

**Specialist outputs read in full or in the decision-bearing sections:**

| Artifact | Lines **as read at this pass** | Lines **as re-keyed at v1.1.0** | Read |
|---|---|---|---|
| `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | 1,466 | **1,793** (still growing) | Framing, cross-workstream boundaries, §20 in full (Q-1…Q-9, risks, Founder decisions, §20.4 interfaces/conflicts/convergences) |
| `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` | 3,701 | **4,707** — DESIGN-001 **v1.2.0**, source-inventory correction applied. *(Re-verified twice: 4,609 at v1.1.0, then 4,707 at v1.2.0 while this correction pass was being written. The drift is the point, not a defect — see below.)* | §0–§2 (framing, thirteen questions, truth model, claim classes, freshness), view/component/vocabulary inventories, §14 COLLABORATION HANDOFF in full |
| `docs/research/RESEARCH_BACKLOG.md` | 2,620 | **3,149** | §1 boundaries, §3 ranking scheme, §4 full backlog index (R-01…R-24 with plan anchors) |
| `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` | — | **1,168** — complete specification, **committed** | Header, independence statement, commit plan |
| `docs/validation/.../ISSUE_MATRIX.md`, `WORKFLOW_DIAGNOSIS.md` | 235 / 302 | 235 / 302 | In full (previous pass + §4c) |
| `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` | **recorded as DOES NOT EXIST** | **3,013 — SPEC-CLM-001 v1.1.0. It exists.** | §14.0–§14.1 (sprint identities and the ownership conflict) at v1.1.0; earlier passes read the reconciliation sections |
| `docs/plans/GOVERNANCE_UPDATE_PLAN.md` | **recorded as DOES NOT EXIST** | **784 — GOV-PLAN-001 v0.3.0** (§18.9 recorded v0.2.0; **v0.3.0 supersedes it**) | §4.1a in full at v0.3.0 |

**Re-keyed at v1.1.0.** The two "DOES NOT EXIST" rows were true when §18 was written and are
false now; §18.9 recorded their appearance, and this table now carries the current state
directly rather than only by cross-reference. **Every line count in the middle column is
stale by construction** — five workstreams wrote concurrently, and three of these documents
grew while §18 was reconciling against them. The right column is the state at
`GOV-PLAN-001` v0.3.0 / `SPEC-CLM-001` v1.1.0 / `DESIGN-001` v1.1.0. The **UX
specification's 3,701-line figure in particular was wrong by roughly 900 lines** by the time
§18 was signed. **The figure moved again during this correction pass**: 4,609 at DESIGN-001
v1.1.0 when I first measured it, **4,707 at v1.2.0** when I re-verified before reporting. The
current figure is **4,707 / v1.2.0**, and it will drift again.

I was asked to read five specialist outputs. At the time §18 was written, **three existed
and two did not.** I did not substitute `docs/company/GOVERNANCE.md` (a governing document,
not a workstream output) for the governance plan, and I did not infer a CLM specification
from the requirements other workstreams state about it — the correct behavior then, and the
reason the later appearance of both is recordable as a change rather than a retraction.
**All five now exist.**

## 18.1 Changes since the previous handoff

| # | Change | Source | Effect on the plan |
|---|---|---|---|
| **1** | **P-1 is materially harder than stated.** Verified: 1C-B carries **7** Supabase adapters and is missing **5** — `evidence-store`, `review-store`, `escalation-store`, `execution-runner`, `agent-provider`. Those five are exactly what 2E measures, 2F remembers, and 2K gates on. The branch predates 1D/1E; `git diff --stat` vs. baseline reports **118 files, +3,227/−18,687**. | Own inspection, corroborating 1F §20.1 Q-1 | P-1 rewritten. **P-1 is not satisfiable by merging 1C-B.** |
| **2** | **P-1 ownership settled.** 1F explicitly declines it: *"1F should not own that decision, and this plan does not claim it."* Their revised recommendation routes it to its own workstream and cites our P-1/D-P1 by name. | 1F §20.1 Q-1 | P-1 owner changed from "Engineering + Founder" to "Persistence workstream + Founder." **The persistence ADR is currently unowned.** |
| **3** | **ADR numbering resolved more precisely.** ADR-0003 covers 1F's **deployment and transport**, not persistence. Phase 2 numbers from **ADR-0004**; a **separate persistence ADR is unowned**. | 1F §20.1 Q-1, Q-7, Q-8 | §2.7 caution rewritten; three added ADRs now named (persistence, real agents, `WorkItem`). **→ SUPERSEDED at v1.1.0.** The three added *subjects* stand; the ADR-0004 numbering conclusion is **withdrawn** — numbers are assigned centrally and no workstream claims them (§19.1). |
| **4** | **P-6 has an owner who accepts it.** *"1F-1 and 1F-2 are that resolution."* | 1F §20.4 I-7 | P-6 reclassified **mitigatable**, owner 1F. New constraint recorded: `store.events` capped at 200, so 2E-1 must not be designed against that window. |
| **5** | **2D adopts Design's claim-class vocabulary rather than defining its own.** Recorded · Derived · Projection `≈` · Recommendation `▸` · Unknown `—`, with the hard rules (a projection may not be counted in a headline metric, notified on, used to gate an action, coloured with a state colour, or stand alone; Unknown is `—` never `0`; the class appears in the accessible name). | UX §2.2–§2.3, D2–D4 | 2D §6.7 and criterion D5 reconciled. **This is a convergence, not a concession** — both workstreams reached the same requirement independently. |
| **6** | **Two dependencies of 2A/2E are verified inert today.** `listDependencies()` returns `[]` unconditionally (`dev-task-repository.ts:94`) — `TaskDependency` is declared but does nothing. `usage` is written `null` unconditionally (`agent-execution-service.ts:81`) — the single point blocking cost, token accounting, and model attribution. | UX §14.6 I2, I3; verified | **2A-2's decomposition planner has no working dependency primitive**, and **2E/2D/2H cost and context metrics have no source**. Added to P-5. |
| **7** | **The C-6 structural blocker is partially resolved.** `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` exists — a **COMPLETE SPECIFICATION** produced by `independent-code-reviewer` (a reviewer-type, long-lived agent), with an explicit independence statement: *"CR-1E never saw AR-1E's policy before this assignment, so these patches are not AR-1E reviewing its own design."* Four commits, expected end state 22 files / 320 tests. | New untracked artifact | Designer ≠ reviewer separation **was** achieved once, by routing specification to a reviewer-type agent. This is consistent with the diagnosis's untested candidate 3 (long-lived vs. freshly-spawned). **The blocker is narrowed, not closed** — one success is not a mechanism, and §22 forbids treating it as proof. |
| **8** | **My previous Q-1 (research reconciliation) is answered — by them.** The research backlog declares itself *"subordinate to both plans"*, cites our P-1…P-7 and candidate ADRs #7/#9/#12/#15/#17/#18/#20/#23 by number, maps all 24 items to plan anchors, and re-ranked three items because of our plan. | Research backlog §3, §4 | Q-1 **closed**. Full R-nn → stage mapping in §18.3 R-contracts. |
| **9** | **The scorecard conflict is real but mis-cited by 1F.** Their Q-6 states *"ADR-0001 D8 and ADR-0002 D-E6/E9 both place scorecards in Sprint 1F."* **ADR-0001 D8 is titled "Scorecards: deferred to Phase 2."** The conflict is ADR-0001 (Phase 2) **vs** ADR-0002 (Sprint 1F), not both-say-1F. | ADR-0001 D8 read directly | **Both plans nonetheless resolve it identically: out of 1F.** Our C-3 position is unchanged and now has independent agreement. The mis-citation is flagged for their correction; I did not edit their file. |
| **10** | **No Sprint, Roadmap, or Release domain entity exists**, and both other workstreams verified it independently. Design renders sprint membership as `⚠ preview` from planning documents; 1F withdrew its own Q-3 recommendation in favour of that approach. | 1F Q-3; UX §0.4 | **2B-2's "project-specific roadmaps" has no entity to scope.** Added to §18.7 stage-entry criteria for 2B. |
| **11** | **Cost/spend instrumentation ownership is unassigned** across all workstreams. | UX §14.3 RB-1, §14.7 item 5 | Affects 2A-3 budgets, 2B project budgets, 2D cost dashboards, 2E cost metrics, 2H economics — five stages depend on an unowned capability. New Founder decision NEW-6. |
| **12** | **A production deployment of the current code cannot execute anything.** `actions.ts:43` returns `ok: false` when `NODE_ENV === "production"`, citing ADR-0001 D4/D7; internal routes 403 in production. | Verified directly | Strengthens P-8: the real-agent transition is not only a provider-adapter task but also a production-execution-path task. |
| **13** | **The research backlog is calibrated against the pre-P-8/P-9 version of this plan** ("seven preconditions P-1…P-7", "23 candidate ADRs"). | Research backlog §3 | Minor staleness, same class as C-5 but benign. Their ranks are unaffected; only the counts are stale. |
| **14** | **A possible second UX workstream exists** ("Founder Interface UX design"), and the Design specialist flags the mandate overlap as its **highest** conflict risk with no owner designated. | UX §14.3 FI-1, §14.5 C1 | 2D extends whichever shell wins. **2D cannot be safely detailed until one owner is designated.** New Founder decision NEW-7. |

## 18.2 Hard blockers

Only items with **no** stated mitigation. Full nine-precondition classification is §1.5.

| # | Hard blocker | Why nothing works around it | Owner |
|---|---|---|---|
| **HB-1** | **P-2 — Phase 1 exit gate not accepted** | A governance boundary, not an engineering one. Roadmap §22 prohibits starting self-improvement before Phase 1 continuity, restoration, review, and recovery gates pass. | **Founder** |
| **HB-2** | **P-1 for stages 2C/2E/2F/2H** — and it now requires forward-porting 1C-B past 1D/1E **plus five new adapters** | Durability is a property of records at write time. A knowledge corpus, metric series, or experience record that was never persisted cannot be retroactively made durable. Their gates are unprovable by construction. | Persistence workstream + Founder (D-P1) |
| **HB-3** | **P-8 for Gate 2A** | ADR-0001 O4's simulated agent derives its outcome deterministically from its input instructions. A11/A12 ("adaptive teams outperform single-owner execution") therefore measures the input, not the organization. Compounded by `usage = null` and the production dispatch guard. | Engineering + Founder (NEW-3) |
| **HB-4** | **C-6 — no repeatable independent implementation-owner capability** | Four freshly-spawned agents across two types produced nothing; one reviewer-type agent then produced a complete specification. **One success does not establish a mechanism**, and every stage here requires an implementation owner distinct from its reviewers. Root cause remains unknown. | **Founder (NEW-5)** — already escalated by the diagnosis workstream |
| **HB-5** | **P-7 for 2A-6 and 2G only** | Two approved ADRs preserve "no direct agent-to-agent communication"; the roadmap requires brokered communication. An implementation agent must not reconcile approved ADRs. | **Founder (D-P4)** |

**HB-5 is scoped, not global** — nine of eleven stages proceed without it. HB-1 through HB-4
are unscoped: they gate the program, its four measurement-dependent stages, its first gate,
and its staffing respectively.

## 18.3 Mitigations

| Blocker / gap | Mitigation | Cost | Preserves gate order? |
|---|---|---|---|
| HB-2 (P-1) | **RC-1:** execute **2A + 2B + 2D only**; remove 2C/2E/2F/2H from the Phase 2 exit package until persistence lands. Do not run them on memory and sign the gates. | Phase 2 delivers 3 of 11 stages; exit gate deferred | **Yes** — 2A→2B→2D is the approved prefix |
| HB-3 (P-8) | Build **2A-1…2A-8 against simulations**, then stop. Sign Gate 2A only on real-agent evidence. | 2A's gate slips to the real-agent date; no rework | Yes |
| HB-4 (C-6) | Three candidates, **none validated**: (a) staff implementation from long-lived resumed agents — the only variable consistent with all 10 deliverables and all 4 failures, and now with the CR-1E success; (b) shape specification tasks as review-and-report deliverables, since every such task succeeded; (c) human implementation with AI review. **Test (a) before P2-00** — it is cheap and the diagnosis lists it as untested. | (a) ~free to test; (c) changes the program's premise | Yes |
| HB-5 (P-7) | Already the plan's default: 2A ships communication **disabled**; 2G deferred until the ADR. | 2A loses coordination efficiency; 2G slips | Yes |
| P-3 | Founder approves `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` (4 commits, 22 files / 320 tests) **or** accepts residual risk in writing; 2A-9 builds the concurrency/replay harness 1E lacked. | 2A carries reliability debt it did not create | Yes |
| P-4 | Ship the thin `ModelResolver` port in P2-00. | Hours now vs. a 2A–2G refactor at 2H (~1:20) | Yes |
| P-5 CLM gap (X-1) | 2E context metrics render **honestly dark** per Design D5 — an unanswered question with a stated data contract, not a fabricated verdict. 2A long-running organizations use bounded packets with checkpoint-at-boundary until CLM lands. | 2E ships with a known-empty metric family | Yes |
| P-5 inert `TaskDependency` | Either 1G/1H instruments it, or 2A-2 instruments it as declared scope. **Must be assigned** — 2A-2 cannot graph dependencies that are hardcoded to `[]`. | One small work item, wherever it lands | Yes |
| P-9 E8 (`WorkItem`) | **RC-5:** 2A-1 attaches to `Task` plus a documented re-parenting migration in its ADR. | One additive migration later | Yes |
| Cost instrumentation unowned | Assign it, or five stages render cost as `Unknown —` per the claim-class rules. Honest, but 2D budget optimization and 2H economics become non-functional rather than merely empty. | 2D-2 and 2H telemetry descope | Yes |
| 200-event cap | 2E-1 designed against a durable event store, never against the in-memory window. Blocks on P-1. | None if sequenced | Yes |

**No mitigation exists for HB-1.** It is the Founder's decision by construction.

## 18.4 Cross-workstream contracts

**Contracts this plan provides** (obligations I accept):

| ID | To | Contract |
|---|---|---|
| **CP-1** | 1F, Design, persistence | The **`ScopeKey` tuple** (§4.5: `organizationId`, `tenantId?`, `projectId`, `repositoryId?`, `environmentId?`) is the canonical scope contract. Needed before persistence schema work and before 2B-1. Feeds research **R-04**, candidate ADR **#7 (Blocking)**. |
| **CP-2** | 1F, Design, observability, CLM | The **canonical event vocabulary** (§7.5 `CanonicalEvent`, with required correlation fields: goal, work item, execution, actor, authority grant, candidate, policy decision). Three inbound contributors must land in it, not beside it: the 1E remediation's two new types (`execution.assignment_deferred`, `execution.claim_lost`), CLM compaction events (UX CX-3 asks for exactly this), and research **R-02**. Candidate ADR **#12 (Blocking)**. |
| **CP-3** | 1F (their I-8) | 2D extends 1F's shell, route tree, and decision-header without rewrite. **Accepted.** 2D adds Stage 2 and Stage 3 only; it does not restate Stage 1. |
| **CP-4** | Design | 2D **adopts** UX §2.2 claim classes and §7 status vocabulary as product-wide invariants. We support their **GV-3** recommendation that §2, §7.10, and §11 be promoted to governed standards, and 2D will comply with the standard rather than a local convention. |
| **CP-5** | All | ~~The **roadmap location.**~~ **DISCHARGED 2026-07-26** — the Master Roadmap is now under governance control at **`docs/roadmap/MASTER_ROADMAP.md`**, registered from the Founder-supplied `Savrio_Dev_HQ_Master_Roadmap_v8.0_Canonical.docx` (source SHA-256 `52a79925…`). *Original text, preserved:* "1F §20.4 I-6 records the Master Roadmap as *'Not present in this repository'* and states their plan was written without it. It is at `C:\Users\evanj\Downloads\Savrio_Dev_HQ_Master_Roadmap_v7.1_Canonical.docx` — the source this plan was built from (§10, §11, §12, §12A, §13, §13A, Appendices A–K). **Recommend the Founder place it under governance control**, because three workstreams are planning against an authority that is not in the repository." **Note the version change: this plan was built from v7.1; the registered roadmap is v8.0.** See ACR-001 **X-17**. |
| **CP-6** | Founder / integration review | The **Phase 2 exit evidence package** (§15) and the precondition severity classification (§1.5). |

**Contracts this plan requires** (obligations others must accept or decline):

| ID | From | Requirement | If declined |
|---|---|---|---|
| **CR-1** | Persistence workstream | A durable backend whose adapters cover the **five missing**: `evidence-store`, `review-store`, `escalation-store`, `execution-runner`, `agent-provider`. Plus transactional compare-and-set per ADR-0001 D7, row-level or repository-level scoping for `ScopeKey`, and time-series/rollup support for 2E. | 2C/2E/2F/2H drop from Phase 2 (RC-1) |
| **CR-2** | CLM workstream **(~~does not exist — X-1~~ — EXISTS; `SPEC-CLM-001` v1.1.0, re-keyed v1.1.0)** | Context signals, safety-band vocabulary and thresholds, compaction events in the canonical vocabulary, a context-attributed failure flag, sampling interval, partial-measurement semantics. Identical to Design's CX-1…CX-6 — **two workstreams now require the same unowned contract.** | 2E context metrics stay dark; 2A has no rollover for long organizations |
| **CR-3** | Governance workstream **(~~does not exist — X-2~~ — EXISTS; `GOV-PLAN-001` v0.3.0, re-keyed v1.1.0)** | ADR numbering authority (NEW-4); promotion of UX §2/§7.10/§11 to standards (GV-3); the ADR-0002 amendment if scorecards are confirmed out of 1F; a home and ID series for cross-cutting specifications. | Numbering collisions persist; honesty rules bind one document instead of the product |
| **CR-4** | 1F workstream | Confirm CP-3; correct the ADR-0001 D8 citation in their Q-6; re-derive their §20.4 divergence list against this final document rather than the 641-line partial draft. | The 1F/2D boundary stays ambiguous |
| **CR-5** | Design + Founder | Designate **one owner** for the shell, status vocabulary, and truth model (their FI-1/C1/Q1). | 2D cannot be detailed against an undetermined shell |
| **CR-6** | Validation-workflow workstream | Test the long-lived-vs-freshly-spawned hypothesis before P2-00 (HB-4 mitigation (a)). | Phase 2 staffing remains unresolved |
| **CR-7** | 1G/1H workstream | Instrument `TaskDependency`, or explicitly hand it to 2A-2. | 2A-2 graphs nothing |

**Unowned gaps (X-items) — no workstream holds these:**

| ID | Gap | Blocks |
|---|---|---|
| **X-1** ~~gap~~ **CLOSED at v1.1.0 — the specification exists (SPEC-CLM-001 v1.1.0, 3,013 lines); CR-2 satisfied. What remains is the *implementation*, which P-5 requires, and the *sprint assignment*, which is D-P7. Original row preserved:** | **Context Lifecycle Manager specification** — required as an interface by 1F (I-5) and Design (CX-1…CX-6); named in the coordinated planning effort by both; **not produced** | 1F-5 context-health rendering; 2E context metrics; 2A long-organization rollover; roadmap §6 CLM is a Phase 1 promise |
| **X-2** ~~gap~~ **CLOSED at v1.1.0 — the plan exists (GOV-PLAN-001 v0.3.0, 784 lines); CR-3 satisfied, and NEW-4 is now decided (§19.1). Original row preserved:** | **Governance plan** — named by both other workstreams; **not produced** | ADR numbering, standards promotion, document IDs, the ADR-0002 scorecard amendment |
| **X-3** | **Persistence ADR and workstream output** — 1F routed it out, Phase 2 requires it, nobody has produced it | P-1, i.e. HB-2 |
| **X-4** | **Cost/spend instrumentation ownership** | 2A-3, 2B budgets, 2D-2, 2E cost metrics, 2H economics |

**Research contracts (R-nn → stage), reconciled from their §4 index.** They did the mapping;
I verify it here as consistent with this plan and add no new anchors:

`R-04`→2B-1 (ADR #7) · `R-09`→P-4/2H-1/2H-3 (ADR #18) · `R-06`→2H-2/2E-5 ·
`R-10`/`R-11`/`R-12`/`R-15`→2H-1 registry and model cards · `R-16`→2F-5/2G-3 (ADRs #15/#17) ·
`R-20`→2C-1/2C-4 (ADRs #9/#10) · `R-23`→2C-2 (ADR #9) · `R-21`→2I-1/2I-3 (ADR #20) ·
`R-02`→2E-1 (ADR #12) · `R-01`→2H/2E provenance (ADRs #12/#18) · `R-17`→2A-3/2B budgets/2H
telemetry · `R-05`→CR-11 Phase 2 gate/2H structured-output scoring · `R-19`→2C-3 semantic
retrieval · `R-13`→CLM/2E context metrics · `R-08`→P-1/2K-3 (ADR #23) · `R-22`→2K-2 gates ·
`R-24` **Hermes — rank E, exploratory, anchored to 2H-1 and §0.4 item 2**, which is exactly
correct: Hermes is a research question and a candidate registry entry, **never a binding**.

## 18.5 Required ADRs

**Corrected v1.1.0.** This section previously read *"Renumbered from **ADR-0004** (ADR-0003
is 1F's deployment/transport ADR)."* That heading is **withdrawn**: under the Founder's
2026-07-26 decision, ADR numbers are assigned centrally and no workstream — including this
one — reserves them. What follows is a list of **required ADR subjects with their owners**,
in dependency order. The `P2-Ann` handles are plan-local cross-references to §2.7, **not
ADR numbers** (§19.1).

**Must have an approved ADR before P2-00 closes:**

| Handle | Subject | Owner | Note |
|---|---|---|---|
| **P2-A00** | The P-1 decision: backend, migration path, forward-port of 1C-B, the five missing adapters, CAS semantics, scoping enforcement point | **UNOWNED (X-3)** | Blocks HB-2. Feeds R-08. |
| **P2-A01** | Governed agent communication; ADR-0001/0002 invariant amendment | Founder | Blocks 2A-6, 2G (HB-5) |
| **P2-A02** | Temporary organization and work-packet model | Engineering | 2A-1 |
| **P2-A03** | Packet concurrency, leasing, backpressure, emergency serialization | Engineering | 2A-3; composes with ADR-0001 D6 |
| **P2-A07** | Project isolation and the `ScopeKey` model | Engineering | 2B-1; feeds R-04; **CP-1** |
| **P2-A12** | Canonical event and metric model | Observability | 2E-1; feeds R-02; **CP-2** |
| **P2-A14** | Agent memory classes, decay, authority boundaries | Engineering | 2F-1/2F-2 |
| **NEW-A** | **Real AI agent provider adapters and the simulated→real transition** (incl. the production execution path and CR-11/P-2 resolution) | Engineering | P-8; blocks Gate 2A (HB-3) |
| **NEW-B** | **`WorkItem` promotion** (ADR-0002 E8) or a recorded deferral with a re-parenting plan | Engineering | P-9; determines 2A-1 attachment |

**Remaining proposed subjects** (P2-A04, P2-A05, P2-A06, P2-A08, P2-A09, P2-A10, P2-A11,
P2-A13, P2-A15, P2-A16, P2-A17, P2-A18, P2-A19, P2-A20, P2-A21, P2-A22, P2-A23) are
unchanged from §2.7 and are needed at their stage, not at program start.

## 18.6 Founder decisions

**Gating Phase 2 start** — the previous eleven, plus two new:

D-P1 persistence backend and merge path (**now including: forward-port 1C-B and fund five new
adapters**) · D-P2 Phase 1 exit · D-P3 1E remediation disposition (**a complete patch
specification now awaits you**) · D-P4 communication ADR · D-P5 blocking ADRs · D-P6 stage
overlap · NEW-1 scorecard ownership (**both plans agree: out of 1F; ADR-0002 needs the
amendment**) · NEW-2 `WorkItem` before 2A-1 · NEW-3 providers and spend for real agents ·
~~NEW-4 central ADR numbering~~ (**DECIDED 2026-07-26 — §19.1**) · NEW-5 Phase 2 staffing
given HB-4 (**partially discharged — §19.2**)

**Added at v1.1.0:** **D-P7** — assign the Context Lifecycle Manager's sprint (§19.3). Not a
Phase 2 blocker, but two specialist documents have now declined to resolve it and it should
not sit unowned.

**Recorded at v1.1.0, not open:** the permanent review order, the Independent Code Review
verdict vocabulary, and the shared severity ladder (§0.6); central ADR numbering (§19.1); and
the Founder's **refusal** of a general self-certification exception in favor of a fresh third
reviewer (§19.2).

| New at this pass | Decision | Why it is yours |
|---|---|---|
| **NEW-6** | **Assign cost/spend instrumentation ownership** (X-4), and approve the rate-source convention | Five stages depend on it; no workstream claims it; it implies spend visibility policy |
| **NEW-7** | **Designate one owner** for the founder-facing shell, status vocabulary, and truth model (Design FI-1/C1) | Two UX mandates may exist; 2D extends whichever wins |
| **NEW-8** | **Commission the two missing workstreams** — Context Lifecycle Manager specification (X-1) and governance plan (X-2) — or reassign their contracts | Three workstreams require contracts from workstreams that produced nothing |
| **NEW-9** | ~~**Place the Master Roadmap v7.1 under governance control in the repository** (CP-5)~~ **DISCHARGED 2026-07-26** — Master Roadmap **v8.0** is registered at `docs/roadmap/MASTER_ROADMAP.md`. *Original rationale, preserved:* "Three workstreams are planning against an authority not present in the repo; 1F wrote its plan without it." **Two questions remain open and are not discharged with it:** the roadmap's `AGENTS.md` authority tier (ACR-001 **X-8**) and whether v7.1-derived conclusions carry forward to v8.0 (**X-17**) | Superseded — see the right-hand cell |

**Not resolved here, by design:** every ADR-level and Founder-reserved conflict above. This
pass reconciled interfaces and ownership; it decided nothing reserved. Specifically left
open: the communication invariant, scorecard ownership, `WorkItem`, the shell owner, staffing,
persistence backend, health-score weightings, memory enablement, the policy floor.

## 18.7 Stage-entry criteria

Consolidated gate conditions. **Order unchanged.** Each stage additionally requires its own
predecessor's gate signed.

| Stage | Entry criteria (beyond predecessor gate) |
|---|---|
| **P2-00** | D-P1, D-P2 decided · P-4 shipped · P-9 triaged · **P-8 started** · approved ADRs for P2-A00 (persistence) + P2-A01 + P2-A02 + P2-A03 + P2-A07 + P2-A12 + P2-A14 + NEW-A + NEW-B, **numbered centrally** · **HB-4 staffing resolved (NEW-5)** · `TaskDependency` instrumentation assigned (CR-7) |
| **2A** | P-1 … P-6 met · P-9 E8 decided (or RC-5 accepted) · D-2A-1/2/3/4 recorded · **1I static decomposition exercised** · dependency primitive working · **Gate 2A additionally requires P-8 complete (HB-3)** |
| **2B** | Gate 2A · ADR #7 · D-2B-1/2/3 · **two real projects designated** · **note: no Sprint/Roadmap/Release entity exists** — 2B-2's per-project roadmaps must use Design's `⚠ preview`-from-documents approach or define an entity (Founder, via 1F Q-3) |
| **2C** | Gate 2B · ADRs #9, #10 · D-2C-1/2/3 · 1H retrieval hooks present · vault scaffolded · **R-20, R-23 answered** |
| **2D** | Gate 2C · ADR #11 · D-2D-1 · **1F Mission Control Lite complete** · **NEW-7 shell owner designated (CR-5)** · claim-class vocabulary adopted (CP-4) |
| **2E** | Gate 2D · ADRs #12, #13 · D-2E-1/2/3/4 · **durable event store (not the 200-event window)** · `usage` instrumented or cost metrics declared dark · **R-02 answered** |
| **2F** | Gate 2E · ADRs #14, #15, #16 · D-2F-1/2/3/4 · **2E statistical validation operational** · 2C Curator operational · model identity recorded on every execution · **R-16 answered** |
| **2G** | Gate 2F · **D-P4 approved (HB-5)** · 2A-6 broker delivered · ADR #17 · D-2G-1/2/3 |
| **2H** | Gate 2G · ADRs #18, #19 · D-2H-1/2/3/4 · **zero hardcoded model references (CI-enforced)** · **R-09, R-06, R-10/11/12/15 answered** |
| **2I** | Gate 2H · Gate 2C · ADR #20 · D-2I-1/2 · **R-21 answered** |
| **2J** | Gate 2I · Gate 2G · ADR #21 · D-2J-1/2 · 2H bindings recording model identity per session |
| **2K** | Gates 2A–2J · ADRs #22, #23 · D-2K-1/2/3 · **2E gate-effectiveness measurement live** · **R-08, R-22 answered** |

## 18.8 Verification of the twelve required points

| # | Point | Verdict |
|---|---|---|
| 1 | **Persistence as precondition P-1** | **VERIFIED and strengthened.** Memory-only confirmed (`store.ts:1-2`), backed by ADR-0001 D7. 1C-B has 7 adapters, missing 5 Phase-2-critical ones, predates 1D/1E. **HB-2.** Owner: persistence workstream (1F declined). |
| 2 | **Real-agent transition from ADR-0001 D4** | **VERIFIED.** D4 verbatim: *"Real AI agents begin in Phase 2."* Reinforced by O4 (deterministic outcome from input), `actions.ts:43` (production dispatch disabled), `usage = null`. **P-8, HB-3**, blocks Gate 2A. ADR **NEW-A** required. |
| 3 | **Independent implementation-owner vs. reviewer separation** | **VERIFIED as an open blocker, narrowed.** 4 fresh agents / 2 types → 0 deliverables; 1 reviewer-type agent → 1 complete independent patch specification with an explicit independence statement. Root cause unknown. **HB-4**, Founder decision NEW-5, mitigation (a) testable and untested. |
| 4 | **Communication disabled pending ADR reconciliation** | **VERIFIED and unchanged.** 2A ships with the broker disabled; 2G deferred; ADR #1 required; **HB-5**, scoped to 2 of 11 stages. Not reconciled by me. |
| 5 | **Scorecard ownership conflict** | **VERIFIED, and both plans independently resolve it out of 1F.** ADR-0001 D8 (Phase 2) vs ADR-0002 (Sprint 1F). 1F's Q-6 mis-cites D8; flagged to them, not edited. **Founder decision NEW-1 + an ADR-0002 amendment.** |
| 6 | **`WorkItem` promotion ownership** | **VERIFIED as unowned.** ADR-0002 E8 defers it to Phase 2; no workstream claims it; it determines 2A-1 attachment. ADR **NEW-B**, Founder decision NEW-2, fallback RC-5. |
| 7 | **Canonical event vocabulary** | **VERIFIED with three inbound contributors** that must land *in* it: the 1E remediation's two new types, CLM compaction events (Design CX-3 asks for exactly this), and R-02. **CP-2**, ADR #12 (Blocking). Constraint: must be designed against a durable store, not the 200-event cap. |
| 8 | **Scope-key contract** | **VERIFIED as the highest-leverage cross-workstream artifact.** §4.5 tuple published as **CP-1**; needed before persistence schema work and 2B-1; feeds R-04 and ADR #7 (Blocking). |
| 9 | **ADR numbering after the 1F persistence ADR** | **SUPERSEDED at v1.1.0 — the question is now closed by decision rather than by investigation.** What stands: ADR-0003 is 1F's **deployment/transport** ADR, not persistence, and the persistence ADR is separate and **unowned (X-3)**. What is **withdrawn**: *"Phase 2 numbers from ADR-0004."* Founder decision NEW-4 was made on 2026-07-26 — **numbers are assigned centrally; specialists propose subjects and reserve nothing** — so this plan's numbering conclusion is void along with the collision it was avoiding. §2.7 and §18.5 now carry subjects with plan-local handles. See §19.1. |
| 10 | **2D-before-2E read-port seam** | **VERIFIED and unchanged.** 2D-1 defines `MetricQuery`/`MetricSnapshot` + thin projection; 2E-2 implements behind it; 2D computes no metric it owns (criterion D1). Approved order preserved; RC-2 records two fallbacks if integration review prefers otherwise. |
| 11 | **Model-neutral routing and expiring bindings** | **VERIFIED and independently corroborated.** Non-nullable `RoutingPolicyBinding.expiresAt`, CI ban on model identifiers outside registry data, expiry sweep, gate H19 (swap incl. rollback). The research backlog places **Hermes (R-24) at rank E, exploratory, anchored to 2H-1 and §0.4** — a research question and candidate registry entry, **never a binding**. R-16 (reviewer independence under shared providers) reinforces H18. |
| 12 | **Negative-result acceptance gates** | **VERIFIED and unchanged.** 2A A11/A12, 2F F16, 2I I15 each pass on a recorded negative finding. Independently converged with Design's honesty model (Unknown renders `—`, never `0`) and with the research backlog's refusal to answer model questions from memory. |

## 18.9 Late-arriving specialist outputs — two blockers dissolved, one weakened

**HEAD moved a third time during this pass** (`357f03b` → `6301c06`, documentation-only), and
**all three previously-read specialist files grew while §18 was being written** (UX 318→354 KB,
1F 104→132 KB, research 171→189 KB). Two artifacts recorded above as non-existent then
appeared. §18.1–§18.8 were written before them; this section supersedes those parts, and the
superseded text is left in place so the reasoning is auditable rather than rewritten.

| Change | Effect |
|---|---|
| **X-1 RESOLVED.** `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0, ~149 KB) now exists, **explicitly reconciled against this plan** — it cites P-1/P-4/P-5, §0.4 model neutrality, and stages 2A/2E/2I/2J by name. | **CR-2 is satisfied.** It answers Design's CX-1…CX-6, defines the safety-band vocabulary the UX spec refused to invent, assigns *"aggregation, trend, and anomaly detection over emitted scores"* to **stage 2E** (consistent with §7.4), confirms this plan's §3.9 restoration requirement *"satisfied by INV-1"*, adds a **G12-PACKET** restoration gate for 2A packets, and adopts forward-compatible correlation fields for ADR #12 (**CP-2 accepted**). It also deconflicts naming: its `ContextCheckpoint` and this plan's 2J `EditCheckpoint` are unrelated records. |
| **X-2 RESOLVED.** `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (GOV-PLAN-001 ~~v0.2.0~~ **now v0.3.0, 784 lines — re-keyed v1.1.0**) now exists, also reconciled against this plan (§0.3–§0.4, §1.3, §2.7, §14, §17). **v0.3.0 supersedes the v0.2.0 read recorded here**, and it changed two of its own most serious findings on re-check; the §4.1a position quoted in §19.2 below is the v0.3.0 one. | **CR-3 is satisfied.** It confirms the ADR-0003 collision as **three-way with two claimants** and accepts that Phase 2 numbers from 0004 (their G-6, B-5); routes my Q-5 (does the negative-outcome rule bind all future Work Management operations?) to the Founder on architecture-review advice (their P-6); and raises a requirement this plan missed — see the next row. |
| **NEW REQUIREMENT: ORG-001 needs a conforming amendment for model neutrality.** GOV-PLAN-001 §2.2 P-5: *"Phase 2 §0.4 decided the principle; ORG-001 still says otherwise."* | §0.4 is binding at program level, but **ORG-001 currently contradicts it.** Until amended, the model-neutrality rule rests on this plan rather than on governance. Added as Founder decision **NEW-10**. This is the one substantive gap in §0.4's enforcement chain that neither I nor 2H could have closed alone. |
| **HB-4 — see §19.2, which supersedes this row.** The assessment below was correct on the evidence available at this pass and is **incomplete**: it records the falsification but not what replaced it. **HB-4 MATERIALLY WEAKENED.** The 149 KB CLM specification was authored by **`lead-software-engineer`** — the exact role `WORKFLOW_DIAGNOSIS.md` §4b recommended *"be treated as unavailable for this project."* Combined with `independent-code-reviewer` delivering the complete patch specification, **both agent types named in the failure record have now produced substantial reconciled deliverables.** | The blanket "role unavailable" conclusion is **falsified by evidence**. What remains established is narrower and still unexplained: four *freshly-spawned* agents asked to author *exact patch text* produced nothing, while long-lived resumed agents produced everything. That is consistent with the diagnosis's untested candidate 3. **HB-4 is downgraded from hard blocker to a managed risk** with a concrete staffing rule: prefer long-lived resumed agents for specification work. Root cause is still unknown, so this is a mitigation, not a fix. |
| **X-3 persistence: STILL UNOWNED.** Independently confirmed by GOV-PLAN-001's dependency table: *"Persistence / deployment decision — persistence workstream — not visible to any present workstream."* | HB-2 stands unchanged. This is now the **only** unowned contract in the program. |

**Net: of the four reasons for the previous NOT READY verdict, two dissolved, one was
materially weakened, and one (Founder-reserved conflicts) is properly integration review's
input rather than a bar to it.** All five specialist outputs named in the assignment now
exist and are mutually reconciled — three of them citing this plan by section number.

## 18.10 Recommendation

> **Read §19 after this section.** The verdict below was recorded at v1.0.0 and **stands**;
> §19 records the corrections applied at v1.1.0 and the three statements in this section that
> they change. Nothing in §19 reverses the verdict.

# READY FOR INTEGRATION

**Conditional on the Founder decisions below, which integration review exists to resolve.**

**Basis for the verdict.** The plan is complete and internally consistent: eleven stages with
all seventeen required elements each, the approved 2A→2K gate order intact, all twelve
verification points passing, and every cross-workstream contract now either accepted by its
counterparty or reduced to a single named gap. Four of five reconciling documents cite this
plan by section, and none of them contradicts its stage designs.

> **Corrected at v1.1.0.** This paragraph previously read that the internal inconsistency
> another specialist found — the CLM's sprint attribution (SPEC-CLM-001 §14.1) — *"is
> corrected against roadmap §6 in §3.3."* That overstated what happened and understated what
> remains. **§3.3 and §1.2 P-5 were made consistent with each other; the sprint assignment
> itself was not decided and could not be**, because it is roadmap authority. Roadmap §6
> constrains the answer without supplying it. The question is open at §1.2 **P-0** and §14
> **D-P7**. See **§19.3**. "Internally consistent" above should be read as it is meant — the
> document no longer contradicts itself — and not as a claim that the questions it carries
> have been answered.

**I am changing the verdict from the NOT READY recorded in §18.9's predecessor, and the reason
is evidence, not pressure.** Two workstreams I recorded as having produced nothing produced
substantial, reconciled specifications during this pass, and the staffing blocker's central
claim was falsified by the same event. Had those artifacts not appeared, the verdict would
have stood.

**Ready for integration does not mean ready to implement.** Phase 2 still cannot start, and
the remaining gates are all Founder-reserved:

| Must be resolved before P2-00 | Class |
|---|---|
| **D-P1 / X-3** — assign the persistence workstream and its ADR, scoped to the verified gap: forward-port 1C-B past 1D/1E **plus five new adapters** (`evidence-store`, `review-store`, `escalation-store`, `execution-runner`, `agent-provider`) | **HB-2 — the only unowned contract left, and the hardest** |
| **D-P2** — accept Phase 1 exit | **HB-1 — no mitigation exists** |
| **NEW-3** — approve providers and spend for the real-agent transition | **HB-3 — gates Gate 2A, not 2A's build** |
| **D-P4** — the governed-communication ADR | HB-5 — scoped to 2A-6 and 2G only |
| **NEW-5** — Phase 2 staffing rule. *(corrected v1.1.0)* Partially discharged: the Founder **refused a general self-certification exception** and **commissioned a fresh third reviewer** instead. What remains is whether that becomes the standing Phase 2 rule or was scoped to the 1E remediation. Standing recommendation: prefer long-lived resumed agents for specification work, **and staff each gate with a reviewer that contributed nothing to the specification**. See §19.2 | Managed risk, downgraded from HB-4 |
| **D-P7** *(added v1.1.0)* — the Context Lifecycle Manager's sprint assignment | Roadmap authority. **Not a Phase 2 blocker** — no stage design depends on it (§19.3) |
| **NEW-1 / NEW-2 / NEW-7** — scorecard ownership, `WorkItem`, founder-interface shell owner | ADR- and mandate-level |
| **NEW-10** — ORG-001 conforming amendment for model neutrality | Governance; §0.4 rests on this plan until it lands |
| **NEW-4 / NEW-6 / NEW-8 / NEW-9** — ADR numbering, cost instrumentation ownership, workstream commissioning (now largely discharged), roadmap under governance control | Administrative but blocking |

**The executable path today, preserving the approved order.** If persistence remains unowned,
run **2A + 2B + 2D** and hold 2A's gate until real agents land (RC-1 + the HB-3 mitigation).
That is three of eleven stages, honestly scoped, with 2C/2E/2F/2H removed from the exit package
rather than run on a store that cannot prove their gates. If persistence is assigned, all
eleven stages execute as planned.

**One standing caveat.** Five workstreams wrote concurrently against a moving HEAD, and three
of the documents I reconciled against changed while I reconciled them. My cross-references are
accurate as of `6301c06`; they will drift. Integration review should treat mutual citations
between these five documents as needing one final verification pass at whatever commit the
Founder freezes for the decision — the same discipline this plan asks of every candidate it
describes.

---

# 19. v1.1.0 CORRECTION RECORD

**Scope of this section.** Corrections applied on **2026-07-26** after a source-inventory
refresh at HEAD `6301c06`. **Documentation only.** No stage was redesigned, no acceptance
criterion changed, the approved 2A→2K order is untouched, no code was written, and no
Founder-reserved decision was resolved. §17 remains preserved as the record of the first
handoff; where this section supersedes a §17 or §18 statement, the original is left standing
with a pointer rather than rewritten, per the discipline §17.11 established.

## 19.1 C-2 RESOLVED — ADR numbering

**Founder decision, 2026-07-26:**

> **ADR numbers are assigned centrally. Specialists may propose ADR subjects but must NOT
> reserve or claim numbers independently.**

**What this plan claimed, and why the claim is void.** §2.7 of v1.0.0 observed the Sprint 1F
workstream's ADR-0003 claim and yielded to it, concluding *"Phase 2 ADRs number from
ADR-0004."* The **instinct** was right — yield rather than collide, and recommend central
assignment, which this plan did as NEW-4. The **conclusion** was still a numbering claim,
and under this decision no workstream makes one. Yielding to another workstream's
reservation and making your own are the same act from opposite ends: both treat a number as
something a specialist can settle. It cannot be. **The ADR-0004 claim is withdrawn without
reservation, and this plan asserts no starting number, no ordering against any other
workstream's ADRs, and no reservation of any kind.**

**What changed in this document:**

| Location | Change |
|---|---|
| **§2.7** | Numbering blockquote replaced with this decision. Column relabeled *Handle → Proposed ADR subject*. Rows re-keyed `#1…#23` → **`P2-A01…P2-A23`**, plus **`P2-A00`** for the persistence subject. Dependency ordering, Blocking/High/Medium priorities, and the approve-first analysis are **unchanged** — none of them ever depended on a number |
| **§2.7 closing paragraph** | "ADRs that must be approved" restated by subject and handle |
| **§14 D-P5** | Restated as "approve the six blocking ADR **subjects** and assign their numbers centrally" |
| **§17.5 C-2** | Marked CLOSED with a pointer here (row text preserved) |
| **§17.11 item 3**, **§18.1 item 3**, **§18.8 item 9** | Marked withdrawn/superseded with pointers here |
| **§18.5** | *"Renumbered from ADR-0004"* heading withdrawn; table re-keyed to handles; remaining subjects listed by handle |
| **§18.7 P2-00 row** | ADR list restated by handle with "**numbered centrally**" |

**What a `P2-Ann` handle is and is not.** It is a **plan-local cross-reference** so §3–§18
can point at a §2.7 row. It is **not** an ADR identifier, carries no ordering claim against
any other workstream, and is replaced by the centrally assigned number at approval. Roughly
thirty in-text references of the form "ADR #7" survive in the stage sections; §2.7 carries
an explicit mapping note (`#n` → `P2-A0n`) rather than this pass rewriting thirty stage-body
sentences, because a mechanical sweep of that size across a 4,000-line document carries more
risk of introducing an error than the ambiguity it removes.

**Sprint 1F is being corrected the same way** for its ADR-0003 claim. That is their
correction to make; this plan neither depends on it nor comments further on it, and — this
matters — **this plan's correction is not conditional on theirs.** It would stand even if
ADR-0003 were never reassigned.

## 19.2 C-6 / NEW-5 / Q-8 — the blocker was falsified, and then it moved

**What C-6 claimed.** That **no actor could produce an implementation specification**: four
consecutive freshly-spawned agents across two types, each given an explicit deliverable
contract and each asked for exact patch text, produced **zero** deliverables, while two
long-lived reviewer agents produced nine. This plan escalated it as *"the most serious
operational finding in this handoff"* and stated that designer ≠ reviewer separation
*"cannot currently be satisfied as specified."*

**That claim is falsified by demonstration.**
`agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` is a
**1,168-line complete specification** — four-commit plan, exact FIND/REPLACE blocks re-read
from the tree rather than reconstructed, grep-verified blast radius, an expected end state of
22 files / 320 tests, per-commit gate commands — and it is **committed**. An implementation
specification was produced. The claim that none could be is not weakened; it is **wrong**,
and this plan records it as wrong rather than as "narrowed."

**But the problem moved rather than resolved, and the new form is sharper.** Per
`GOV-PLAN-001` §4.1a (v0.3.0), the arrangement that produced the specification **consumed
the independence of both gates**:

| Actor | What it contributed | What it can no longer do |
|---|---|---|
| **AR-1E** | Authored the negative-outcome policy (`ISSUE_MATRIX` Part 1), then issued rulings on four flagged deviations whose amendments *"supersede the blocks above"* | Architecture-review a candidate it **directed** — GOV-001:227 covers *produced, planned, **or directed*** |
| **CR-1E** | Authored the complete patch specification | Code-review the implementation it specified — GOV-001:227, and :233 *"does not rewrite the implementation it reviews"* |
| Coordinator | Applies verbatim; pre-verified all 16 anchors | Review its own application (already excluded) |

**Neither reviewer is clean for its own gate on this candidate.** The workaround that
unblocked delivery bought the specification at the price of both gates' independence. That
is a real cost, and it was not visible when §18.1 item 7 recorded the same event as a
partial resolution.

**The Founder's disposition — a refusal, and it is the operative record.** Of the three
routes `GOV-PLAN-001` §4.1a offers — (a) a third reviewer instance uninvolved in
specification, (b) a Founder-recorded Exception with disclosure, (c) human review — the
Founder **REFUSED a general self-certification exception (route b) and commissioned a fresh
third reviewer (route a) instead.** This plan records the refusal as the substantive fact.
A refused exception constrains Phase 2 staffing more tightly than an open question would:
the separation rule is not merely intact, it has been **tested and upheld under pressure**,
at cost, when waiving it would have been faster.

**What remains unknown, stated without softening.** **The four earlier fresh-spawn failures
remain unexplained. Root cause is UNKNOWN.** The CR-1E success is simultaneously consistent
with mitigation (a) — long-lived resumed agent — and mitigation (b) — review-shaped
deliverable — and therefore **identifies neither as the mechanism**. One success is not a
mechanism, and §22 forbids treating it as proof. The `lead-software-engineer` role also
produced `SPEC-CLM-001` (3,013 lines), which falsifies `WORKFLOW_DIAGNOSIS` §4b's blanket
*"treat as unavailable for this project"* conclusion for that role. So: **both agent types
named in the failure record have now delivered substantial reconciled specifications, and
nobody knows why the four fresh spawns did not.**

**Corrected disposition:**

| Item | v1.0.0 | v1.1.0 |
|---|---|---|
| **C-6** | *"Blocking for execution — designer ≠ reviewer separation cannot currently be satisfied as specified"* | **Central claim falsified.** Specifications are producible. The residual risk is **gate independence consumption**, not delivery capability |
| **HB-4** | Hard blocker | **Not a hard blocker.** A managed risk with a concrete rule: prefer long-lived resumed agents for specification work, and **staff a reviewer who contributed nothing to the specification** for each gate |
| **Q-8** | *"Can any Phase 2 stage be staffed with an implementation owner independent of its reviewers today?"* | **Answered: yes — but not for free.** The answer costs one additional uninvolved reviewer per candidate whose specification a reviewer authored. Budget it |
| **NEW-5** | *"Decide how Phase 2 is staffed given C-6"* | **Partially discharged by the Founder's route-(a) choice.** What remains for the Founder: whether that choice becomes the **standing Phase 2 staffing rule** or was scoped to the 1E remediation |
| **Root cause** | UNKNOWN | **UNKNOWN — unchanged.** No candidate explanation is established, and this plan does not guess |

**What this does not license.** It does not license a coordinator writing work and describing
the review as independent — this plan refused that workaround in v1.0.0 and still refuses it.
It does not license treating one success as a repeatable capability. And it does not license
signing any gate as independent without recording which of its inputs the reviewer authored,
which `GOV-PLAN-001` §4.1a states is *"still not permitted under any route."*

## 19.3 Context Lifecycle Manager ownership — how the contradiction was handled

**The contradiction was real.** §1.2 P-5 listed the CLM as a **distinct Phase 1 deliverable**
coordinate with 1F/1G/1H/1I; §3.3's 2A dependency table attributed it to a sprint —
*"Context Lifecycle Manager **(1G/1H)**"*. Both cannot be operative. `SPEC-CLM-001` §14.1
identified it correctly.

**How it was handled: made consistent, and escalated — not decided.** §3.3's `(1G/1H)`
attribution is **withdrawn**, and that row now states exactly what §1.2 P-5 states. The two
statements no longer contradict each other. **The underlying question is untouched and open**
at §1.2 **P-0**, §14 **D-P7**, and §18.6.

**Why this plan did not simply pick one.** Sprint assignment is roadmap authority. Roadmap
§6's wording — the CLM is *"introduced across the 1G/1H boundary and completed before 1I is
approved for long-running autonomous operation"* — constrains the answer without supplying
it, and reading it as an answer would be exactly the unauthorized interpretation AGENT-001
forbids. `SPEC-CLM-001` reached the same conclusion from the other side and declined for the
same reason, recording only a **recommendation** (distinct deliverable, sequenced between 1G
and 1H). **This plan endorses that recommendation as a recommendation and adopts no sprint
assignment.** Two specialist documents have now independently declined to resolve it; that
convergence is itself evidence the decision is correctly reserved.

**Why nothing downstream turns on it.** Every Phase 2 dependency on the CLM — 2A rollover,
2E context metrics, 2I long research sessions, 2J pair sessions — is a dependency on the
**capability**, not on its sprint label. No stage design, acceptance criterion, or gate in
§3–§13 changes whichever way the Founder decides. That is why P-0 is classified **disclosure,
not blocker** in §1.5.

**One warning about this correction.** §1.2 and §3.3 now agree. **That agreement is
editorial, not substantive** — it means this document stopped contradicting itself, not that
the question was settled. Do not read the internal consistency as the decision having been
made.

## 19.4 Re-keying against documents that post-date v1.0.0

This plan is the **oldest document in the reconciled set** and was written before two of the
five existed. Corrections applied:

| Item | v1.0.0 state | Corrected |
|---|---|---|
| `CONTEXT_LIFECYCLE_MANAGER_SPEC.md` | §18 read-table: **"DOES NOT EXIST"**; §18.4 CR-2 and X-1 recorded as unowned gaps | **Exists — SPEC-CLM-001 v1.1.0, 3,013 lines.** §18.9 recorded its appearance; the §18 read-table now carries it directly. **CR-2 satisfied.** §1.2 P-5's "no CLM specification exists" claim corrected. **A specification is not an implementation — P-5 is still unmet** |
| `GOVERNANCE_UPDATE_PLAN.md` | §18 read-table: **"DOES NOT EXIST"**; §18.9 later recorded **v0.2.0** | **Exists — GOV-PLAN-001 v0.3.0, 784 lines.** v0.3.0 supersedes the v0.2.0 read, and changed two of its own most serious findings on re-check. §19.2 quotes the v0.3.0 §4.1a position |
| `PHASE_1_MISSION_CONTROL_LITE_UX.md` | §18 read-table: **3,701 lines** | **4,707 lines — DESIGN-001 v1.2.0.** The 3,701 figure was already wrong by ~900 lines when §18 was signed. **Measured twice during this pass alone**: 4,609 (v1.1.0), then 4,707 (v1.2.0) on re-verification hours later — a live demonstration of the standing caveat below |
| `SPRINT_1F_MISSION_CONTROL_LITE.md` | 1,466 lines | **1,793 lines** |
| `RESEARCH_BACKLOG.md` | 2,620 lines | **3,149 lines** |
| `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` | line count not recorded | **1,168 lines, committed** |

**The standing caveat in §18.10 is confirmed by this pass rather than retired.** Every line
count above will drift again; a v1.2.0 of the UX specification is already in flight. Mutual
citations among these six documents need one final verification pass at whatever commit the
Founder freezes for the decision.

## 19.5 What this revision did not do

Recorded so the boundary is auditable:

- **No Phase 2 implementation.** No code was written, read for modification, or planned
  beyond what v1.0.0 already contained. This remains planning documentation with no
  implementation authorized.
- **No other file was modified.** Not the roadmap, not an ADR, not `GOV-PLAN-001`, not
  `SPEC-CLM-001`, not the 1F plan, not the UX specification. Corrections owed by other
  workstreams are named, not applied.
- **No Founder-reserved decision was resolved.** Specifically preserved as open: **P-7 /
  D-P4 governed communication** — this plan's refusal to interpret the ADR-0001/0002
  invariant **stands unchanged and is not revisited**; the CLM sprint assignment (D-P7);
  persistence (D-P1); Phase 1 exit (D-P2); scorecard ownership (NEW-1); `WorkItem` (NEW-2);
  provider spend (NEW-3); the shell owner (NEW-7); ORG-001's model-neutrality amendment
  (NEW-10).
- **No stage redesign.** §3–§13 are unchanged except for §3.3's CLM row and §3.16's verdict
  vocabulary, both corrections rather than design changes.
- **No commit, no staging, no deletion.**
