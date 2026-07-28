# Savrio Dev HQ — Prioritized Research Backlog

**Document ID:** RESEARCH-001

**Version:** 1.2.0 — reconciled against the Sprint 1F, Phase 2, and UX plan set

**Status:** Draft — awaiting Founder review of the ranking (§4), the decision crosswalk (§4.1),
and the seven escalations (§6)

**Date:** 2026-07-26

**Authority:** CONST-001, GOV-001, ORG-001, AGENT-001, ADR-0001, ADR-0002

**Prepared by:** Lead Software Engineer (AGENT-006), acting in a research-planning
capacity

---

# 1. Purpose and Boundaries

This document is a **research backlog**. It records the open questions that must be
answered before Savrio Dev HQ can responsibly add the capabilities named in §4, and it
ranks them by when the answer is needed.

## What this document is

- A list of **decision questions**, each with the evidence required to answer it, the
  alternatives that must be compared, and the authority that owns the answer.
- A ranking of those questions against the roadmap.

## What this document is explicitly not

- **It makes no architecture decisions.** Nothing here is an ADR, and nothing here may
  be cited as one. Where a research item names alternatives, the list is the comparison
  set, not a recommendation between them.
- **It implements nothing and authorizes nothing.** No dependency is proposed for
  installation, no service for purchase, no schema for migration.
- **It answers no model or provider question from memory.** Every item that depends on
  provider capability, pricing, limits, or availability requires the current primary
  source to be fetched at research time. Facts about models change faster than this
  document will; anything stated from recollection is an unverified claim under
  AGENTS.md §Research and Evidence, and this document deliberately states none.
- **It is not a commitment to build any of it.** Ranking an item "needed before Phase 2"
  means *if that capability is pursued, the answer is needed by then* — not that the
  capability is approved.

Under GOV-001 §Scope Enforcement at Review, discovery does not equal approval. Every
item here is a discovery.

---

# 2. Governing Constraint — Provider Neutrality

**No research item in this backlog may conclude by permanently assigning one provider to
one role.** Model and provider choice must remain a governed, revisable routing decision
evaluated against:

| Dimension | Question it answers |
| --- | --- |
| **Capability** | Can the model actually do this class of work at the required quality? |
| **Context** | Does the working set fit, and at what degradation curve? |
| **Cost** | What does a representative unit of work cost, including retries and review iterations? |
| **Latency** | Does the response time fit the loop it sits in (interactive, batch, or durable)? |
| **Reliability** | Availability, rate limits, error and refusal behavior, degradation under load. |
| **Policy** | Data handling, retention, region, and what the Constitution and standards permit. |
| **Independence** | Does using this provider here compromise the independence of a review, verification, or judgment step elsewhere? |

## The existing tension this constraint has to resolve

This is a real conflict inside the repository today, and every routing-related research
item inherits it:

- **`docs/company/ORGANIZATION.md` assigns specific AI tools to specific roles.** Claude
  Code to Lead Software Engineer, Codex to Independent Code Reviewer, Gemini to QA
  Engineer, GitHub Copilot to Associate Software Engineer, v0 to Visual UI Designer,
  ChatGPT to Director of Operations.
- **`AGENTS.md` §Role and Tool Separation states the opposite principle:** *"Role
  definitions remain stable even when the assigned AI tool changes,"* and employees must
  act *"according to their assigned role, not according to assumptions based on the name
  or general capabilities of the underlying AI tool."*
- **`types/domain/agent.ts:8` models `provider` as an unconstrained `string`**, and the
  seeded roster in `data/placeholders/mission-control.ts:208,219,230,241` already carries
  four distinct values (`internal`, `anthropic`, `openai`, `google`) with no routing logic
  behind any of them.

ORG-001's assignments are best read as the **current default routing table**, not as a
permanent binding. Whether that reading is correct is itself a Founder decision, and it
is raised as an escalation in §6.

**Consequence for this backlog.** Items R-10 (Claude), R-11 (OpenAI), R-12 (Gemini),
R-15 (local), and R-24 (Hermes) are deliberately written as *capability-envelope studies*
that produce comparable evidence for one routing engine (R-09). None of them is written
as "should X own role Y," and none may be answered that way.

---

# 3. Ranking Scheme, and the Assumption Underneath It

## Ranks

| Rank | Meaning |
| --- | --- |
| **A — Needed before Sprint 1F** | The answer is required before **1F-0 closes**. 1F-0 is the plan's own decision item (*"decisions, ADR-0003, amendments"*), and every rank-A item feeds a Q- or D- entry that 1F-0 must resolve. |
| **B — Needed during Sprint 1F** | 1F can start without it; required before 1F's validation gate (1F-21). |
| **C — Needed before 1G/1H** | Required before Sprint 1G (Smart Work Packets) or 1H (Repository Intelligence + Context Router) begins. Rank-C items are all 1H-anchored. |
| **D — Needed before Phase 2** | Required before Phase 2 implementation starts, per precondition P-2 (Phase 1 exit gate) or because a **Blocking** candidate ADR in PLAN-P2-001 §2.7 depends on it. |
| **E — Exploratory only** | No roadmap date. A trigger condition is stated in the item; until it is met, the item should not consume research capacity. |

## What the ranking is calibrated against

Two plan documents were added to `docs/plans/` on 2026-07-26, after this backlog was first
drafted. **They replace what was previously an inference with a documented roadmap, and
every rank below has been re-checked against them:**

| Source | What it fixes |
| --- | --- |
| `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` (Sprint 1F technical plan, 1,466 lines) | 1F scope, work items 1F-0…1F-21, nine open questions **Q-1…Q-9**, nine external dependencies **D-1…D-9**, thirteen risks, and interfaces **I-1…I-10** |
| `docs/plans/PHASE_2_PROGRAM_PLAN.md` (PLAN-P2-001, 3,749 lines) | Phase 2 as eleven stages 2A–2K, preconditions **P-1…P-9**, sprint breakdown P2-00…P2-38, **23 candidate ADRs**, a **44-decision Founder register (§14)**, thirteen ordering risks, and a collaboration handoff (§17) that names this backlog directly |
| `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` (3,701 lines) | Sixteen founder-facing views, the truth/provenance model, and handoff obligations **RB-1…RB-5**, **CX-1…CX-5**, **BC-1…BC-4** — several addressed to this backlog by name |
| `docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md` | §4c's undercut finding and §6's five **standing workflow corrections**, which bear directly on R-16 and on whether this backlog is executable by agents |
| `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` | The 1E remediation set and the two new event types (`execution.assignment_deferred`, `execution.claim_lost`) — still **awaiting Founder approval** |

| `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (CLM v1.1.0) | The context-health signal set, the deterministic scoring model, the safety-band vocabulary, the **CLM-S9 threshold-ownership split**, and **CLM-D16 `ProviderContextProfile`** — the contract **R-13** must populate |
| `docs/plans/GOVERNANCE_UPDATE_PLAN.md` (governance and documentation plan) | 32 consolidated governance items ranked B-1…B-9 / P-1…P-7 / L-1…L-8 / O-1…O-3, ten explicit reconciliations, and a contradictions register |

**All five documents named for this pass now exist.** Two of them — the CLM specification and
the governance plan — **landed while this reconciliation was in progress**, which is the third
time in this session that the source set changed mid-pass. Both were read and incorporated
rather than deferred. Consequences recorded honestly:

- **E-5 is withdrawn** (§6). It escalated the CLM specification's absence; the specification
  exists, is v1.1.0, and R-13 has been rewritten against it rather than around it.
- **The governance plan read this backlog before this backlog read it.** Its §2.2 **P-4** adopts
  **R-16** verbatim as a Founder-decision item, and its **O-3** independently reaches the same
  conclusion as §4.1 below — that the three decision registers need a naming rule, not a merge.
  Convergence reached without coordination is the strongest evidence either document offers.
- **One document named by the UX specification still does not exist:** the *Founder Interface UX
  design* workstream (UX §14.5 **C1**, §14.4 **Q1**). The governance plan records the same
  absence and notes that the UX specification's highest-severity conflict *"cannot be reconciled
  here — one of its two parties is absent."* No item in this backlog depends on it.

No absence was treated as permission to decide in another workstream's place.

From those, the roadmap this backlog is ranked against is:

```
1F Mission Control Lite → 1G Smart Work Packets → 1H Repository Intelligence +
Context Router → 1I Autonomous Engineering Loop → [Phase 1 exit gate, P-2]
  → Phase 2: 2A Adaptive Organization · 2B Multi-Project Scaling ·
    2C Company Knowledge Platform · 2D Executive Intelligence · 2E Engineering
    Intelligence · 2F Agent Memory · 2G Advanced Collaboration ·
    2H Model Management · 2I Autonomous Research · 2J Pair Engineering ·
    2K Enterprise Production
```

**Consequence: this backlog is subordinate to both plans and must not duplicate them.**
Where a plan already registers a decision (a Q-, D-, P-, or candidate-ADR number), the
research item here **feeds** that decision and cites it in its Plan cross-reference field.
It does not restate it, and it never overrides it. Under `AGENTS.md` §Documentation
Standards — *"Do not create duplicate sources of truth"* — the plans own the decisions; this
document owns only the research needed to answer them.

**Three re-ranking changes worth naming**, because the first draft had them wrong:

- **R-08 (deployment/persistence) moved up to rank A.** Sprint 1F Q-1 makes it *"the
  sprint's central architectural question"* and the highest-priority Founder decision, and
  it is Phase 2 precondition P-1 as well.
- **R-14 (mobile PWA notifications) moved up to rank A.** It is not speculative: 1F §2.5
  puts an installable push-capable PWA in scope, and D-7 already names hosting and HTTPS as
  a Founder dependency.
- **R-23 (Obsidian) moved up from exploratory to rank D.** It is not speculative either:
  Phase 2 stage **2C-2** is vault sync, and candidate **ADR #9** — *"Knowledge service
  authority vs. Obsidian vault"* — is marked **Blocking**.

---

# 4. Backlog Index

Sorted by rank, then by dependency order within the rank. The **Plan anchor** column is the
decision this research feeds; it is where the answer lands, and it is owned by that plan,
not by this document.

| ID | Research item | Rank | Primary area | Plan anchor |
| --- | --- | --- | --- | --- |
| R-08 | Deployment, persistence, transport, and rollback | **A** | Deployment and rollback | 1F **Q-1** (highest priority) · ADR-0003 · D-2, D-7 · P2 **P-1** / D-P1 · cand. ADR #23 |
| R-03 | Authentication boundary model | **A** | Authentication | 1F **1F-6**, §10, **Q-5**, D-6 |
| R-01 | Model-run attribution and provenance record shape | **A** | Model and provider routing | 1F **1F-4**, §2.4, **Q-4**, D-5 · cand. ADR #12, #18 |
| R-02 | Observability backbone and event vocabulary | **A** | Observability | 1F **D-1** (`execution.assignment_deferred`) · 2E-1 · cand. ADR #12 (**Blocking**) |
| R-14 | Mobile PWA and Web Push notification path | **A** | Mobile PWA notifications | 1F **1F-9, 1F-10**, §2.5, D-6, D-7 |
| R-07 | Secrets and credential brokering | **B** | Secrets and credential brokering | 1F **1F-10** (VAPID), **1F-6** (session secret), D-6 |
| R-17 | Cost and budget: visibility, then enforcement | **B** | Cost and budget enforcement | 1F **1F-4, 1F-17**, §2.4, **Q-4** · 2A-3 budgets · 2H telemetry |
| R-05 | Structured output reliability and payload validation | **B** | Structured output reliability | CR-6 · CR-11 (recorded Phase 2 gate) · 2H-5 structured-output scoring |
| R-22 | Browser automation and UI test capability | **B** | Browser automation | 1F **1F-19** (no `.tsx` collection today), **1F-20** a11y · 2K-2 gates |
| R-18 | Repository indexing | **C** | Repository indexing | **Sprint 1H** Repository Intelligence (P-5) |
| R-13 | Context caching strategy | **C** | Context caching | **Sprint 1H** Context Router + Context Lifecycle Manager (P-5) |
| R-19 | Vector search | **C** | Vector search | **Sprint 1H** retrieval hooks (P-5) · 2C-3 semantic retrieval |
| R-04 | Multi-project isolation model | **D** | Multi-project isolation | **2B-1** · cand. ADR #7 (**Blocking**) · risk R-3 |
| R-09 | Provider routing policy engine | **D** | Model and provider routing | **P-4** ModelResolver · 2H-1, 2H-3 · cand. ADR #18 (**Blocking**) |
| R-06 | AI evaluation methodology and the golden set | **D** | AI evaluation | **2H-2** benchmark/eval harness · 2E-5 statistical validation |
| R-10 | Claude capability and operational envelope | **D** | Claude | 2H-1 model cards/registry |
| R-11 | OpenAI capability and operational envelope | **D** | OpenAI models | 2H-1 model cards/registry |
| R-12 | Gemini capability and operational envelope | **D** | Gemini | 2H-1 model cards/registry |
| R-15 | Local model hosting viability | **D** | Local models | 2H-1 registry · P2 §0.4 |
| R-16 | Reviewer independence under shared providers | **D** | Model and provider routing | **2F-5**, **2G-3** independence guard · cand. ADR #15, #17 |
| R-20 | Knowledge store architecture | **D** | Knowledge stores | **2C-1, 2C-4** · cand. ADR #9, #10 |
| R-23 | Obsidian synchronization | **D** | Obsidian synchronization | **2C-2** vault sync · cand. ADR #9 (**Blocking**) |
| R-21 | Research agent capability | **D** | Research agents | **2I-1, 2I-3** · cand. ADR #20 |
| R-24 | Hermes open-weight model family | **E** | Hermes | 2H-1 · P2 §0.4 item 2 (names Hermes explicitly) |

**Ranked execution order.**

- **A (5):** R-08 → R-03 → R-01 → R-02 → R-14
- **B (4):** R-07 → R-17 → R-05 → R-22
- **C (3):** R-18 → R-13 → R-19
- **D (11):** R-04 → R-09 → R-06 → R-10 / R-11 / R-12 / R-15 (parallel) → R-16 → R-20 → R-23 → R-21
- **E (1):** R-24

**Note on rank E.** After alignment with the two plans, **only one** of the twenty-two
requested research areas remains genuinely exploratory. Every other area now maps to a
named sprint item or Phase 2 stage. That is a change in the evidence, not a change in
judgment: areas that looked speculative on 2026-07-26 morning — Obsidian sync, mobile
notifications, repository indexing — are all explicitly planned capability.

---

## 4.1 Crosswalk — answering PLAN-P2-001 §17.6 Q-1

PLAN-P2-001 §17.6 puts a question to this workstream by name:

> **Q-1** | Research-backlog owner | *"Can we reconcile your Rank-D ('needed before Phase 2') items
> with our §14 register into **one** decision list with one ID space? Which of your R-nn items are
> the same question as our D-nn items?"* | Needed by: **Before P2-00**

**Answer: they should not merge into one ID space, and the plan's own §17.3 already states why** —
*"Their document is the right home for questions requiring research; ours for decisions requiring
authority."* Merging would put questions that need evidence into a register the Founder is expected
to answer from authority, which is precisely the confusion that produces decisions made without the
evidence to support them. **What is needed is not one list but one mapping, maintained here**, so no
question is answered twice and none is dropped between the two.

**The governance workstream reached the same answer independently**, which is worth more than either
document's reasoning alone. `GOVERNANCE_UPDATE_PLAN.md` consolidates the same ask as **G-7** — *"Three
ID spaces now exist (1E findings, research `R-nn`, Phase 2 `D-nn`). **Needs a naming rule, not a
merge**"* — and ranks the merge itself as **O-3, optional**, on the grounds that *"a naming rule
achieves most of the benefit at far lower cost than a merge."* Three workstreams, one conclusion, no
coordination. **Recommended: adopt the naming rule as governance G-7 and treat the table below as the
standing mapping.**

**No R-nn item is the same question as a D-nn item.** In every pair below, the R-item produces the
evidence and the D-item is the Founder's exercise of authority over it. The relation is
*feeds*, not *duplicates*.

| R-nn (research: gathers evidence) | Feeds D-nn / plan decision (authority: decides) | Latest point |
| --- | --- | --- |
| R-01 attribution shape | 1F **Q-4**, **D-5**; UX **RB-1** ownership; cand. ADR #12 | 1F-0 |
| R-02 observability/event vocabulary | 1F **D-1**, **Q-8**; **D-2E-1**; cand. ADR #12 (**Blocking**) | 1F-0 / before 2E-1 |
| R-03 authentication | 1F **Q-5**, **D-6**; ADR-0003 | 1F-0 |
| R-04 multi-project isolation | **D-2B-1**, **D-2B-3**, **D-2F-4**; cand. ADR #7 (**Blocking**) | 2B-1 |
| R-05 structured output | cand. ADR #12 adjacency; 2H-5 scoring; CR-6/CR-11 | 1F-21 / P-8 |
| R-06 evaluation harness | **D-2H-4**, **D-2E-2**, **D-2E-3**; **NEW-1/Q-6** (scorecard placement) | 2H-2 |
| R-07 secrets/credentials | 1F **Q-9**/**D-6**; **D-2H-1**; **D-2I-1** | 1F-21 |
| R-08 persistence/deployment | **D-P1**, 1F **Q-1**/**D-2**/**D-7**; §17.6 **Q-2**; cand. ADR #23 | **before P2-00** |
| R-09 routing policy | **D-2H-1**, **D-2H-2**, **D-2H-3**, **NEW-3**; **P-4**; cand. ADR #18 (**Blocking**) | 2H-1 / P-4 earlier |
| R-10 / R-11 / R-12 / R-15 envelopes | **D-2H-1**, **D-2H-4**, **NEW-3** (P-8 transition) | 2H-1 |
| R-13 context caching | CLM contract (**unowned**); UX **Q4**, **CX-1…CX-5**; 1F **I-5** | before 1H |
| R-14 mobile PWA/push | UX **Q8**; 1F **D-6**, **D-7**; UX **RB-5** *(already decided by Design)* | 1F-0 |
| R-16 reviewer independence | **D-2A-4**, **D-2G-2**, **D-2F-1**, **D-2F-4**, **NEW-5**/§17.6 **Q-8** | 2F-5 / 2G-3 |
| R-17 cost and budget | UX **RB-1** (ownership), 1F **Q-4**; **D-2H-1**, **D-2A-1**, **D-2B-2** | 1F-21 |
| R-18 repository indexing | 1H plan (unwritten); **C-10** taxonomy owner unassigned | before 1H |
| R-19 vector search | **D-2C-2**; 2C-3; gated by ADR-0002 **E9** persistence approval | before 1H / 2C-3 |
| R-20 knowledge stores | **D-2C-2**, **D-2C-3**; cand. ADR #9, #10 | 2C-1 |
| R-21 research agents | **D-2I-1**, **D-2I-2**; cand. ADR #20 | 2I-1 |
| R-22 browser/component testing | 1F **Q-9**/**D-6** (`jsdom`); **D-2K-1** policy floor | 1F-19 |
| R-23 Obsidian/vault | **D-2C-1** (incl. *"whether the vault is ever writable by agents"*), **D-2C-2** | 2C-2 |
| R-24 Hermes | **D-2H-1**, **D-2H-3** | gated on R-15 |

**Three plan decisions have no research item behind them and should get one, or be answered from
authority alone with that stated:** **D-P4** (governed-communication ADR — a governance
interpretation, not a research question; correctly Founder-reserved), **NEW-2/Q-7** (`WorkItem`
promotion before 2A-1), and **NEW-5** (Phase 2 staffing given C-6). Only the third is
research-shaped, and R-21 now carries it as a caveat rather than as scope.

**Three UX handoff obligations name this backlog but are not research questions**, and are recorded
here so they are not lost: **RB-3** (light theme, required by STANDARD-011 — a design/standards item
for Director of Operations), **RB-4** (usability validation with the Founder — design research owned
by claude-design, and the only way to test the UX specification's core premise), and **RB-2** (durable
event history, which R-02 and R-08 jointly cover). **RB-3 and RB-4 have no owner in this document and
none is claimed.**

---

# 5. The Backlog

---

Items are grouped by theme below. **The ranked view is §4** — read it first, and treat it as
authoritative wherever a reader wants execution order. Each item restates its own rank and
plan anchor in its *When the answer is needed* field.

## Group 1 — Record, signal, identity, and scope foundations

*Contains R-01 (rank A), R-02 (A), R-03 (A), R-04 (D).*

---

### R-01 — Model-run attribution and provenance record shape

**Decision question.** What must be recorded about every unit of agent work — provider,
model identifier, model version, prompt version, input and output token counts, cached
token counts, cost, latency, finish reason, retry cause, and routing rationale — and on
which record does each field live: `Execution`, `AgentAssignment`, `Evidence`, or a new
model-run record?

**Why the decision matters.** Five later capabilities all read from this one shape: routing
(R-09) cannot select on cost or latency it never recorded; evaluation (R-06) cannot compare
two providers on a task it cannot attribute; budget enforcement (R-17) cannot meter spend
it cannot see; the timeline (ADR-0002 E5) cannot explain a decision whose rationale was
never written down; and context caching (R-13) cannot be shown to have paid for itself
without a cached-token count. Getting the shape wrong is not a local defect — it silently
caps what every downstream surface can ever report, and the records are append-only and
immutable by ADR-0002 E4, so a field omitted now cannot be backfilled for work already
done.

**The plans sharpen this in two ways the first draft missed, and one of them inverts an
argument it made.**

- *Corrected.* The draft argued the shape must be settled because **1F builds scorecards over
  it**. It does not. 1F §3.1 excludes scorecards, and whether they belong to 1F at all is an
  **unresolved three-way conflict** — ADR-0001 D8 says Phase 2, ADR-0002 D-E6 says Sprint 1F,
  the 1F plan says out of 1F — registered as 1F **Q-6** and PLAN-P2-001 **C-3 / NEW-1**.
  Scorecards are removed from the argument here; the timeline (1F-1, Phase 2 precondition
  **P-6**) and the 1F-4/1F-17 cost and model surfaces carry it instead.
- *Added, and it is the sharper point.* **Phase 1 cannot populate these fields at all.** 1F
  **Q-4** states it plainly: Phase 1 agents are deterministic simulations (ADR-0001 D4) that
  *"consume no tokens, have no context window, and produce no checkpoints,"* therefore *"any
  cost, context-health, or checkpoint value shown in 1F would be either zero or fabricated,
  unless real providers land first."* The UX specification independently verified the same
  floor — `usage.model` is never populated, so *"not even a rate could be applied"* (View 13
  §13.4) — and its Q-4 option (c), a seeded simulated cost model, is **rejected outright** as
  fabricated evidence. **So this item designs a record that stays honestly empty until P-8
  (the simulated→real agent transition) fills it.** That is the recommended path — Q-4 option
  (a), *"build the plumbing, render honest absence"* — and it makes the shape decision
  cheaper to get right and more expensive to get wrong, since nothing will exercise it for a
  whole phase.

**Roadmap capability affected.** Sprint 1F **1F-4** (cost/model domain work) and **1F-17**
(the surfaces over it), the execution timeline read-model (1F-1, = Phase 2 precondition
**P-6**), and every Phase 2 capability that measures, compares, or bills agent work — 2E-1's
canonical event model, 2F's experience records, 2H's per-binding telemetry. **Not** scorecards,
pending Q-6/NEW-1.

**When the answer is needed. Rank A — before 1F-0 closes.** Plan anchor: **1F-4**
(cost/model domain work) and 1F §2.4, which the plan marks *"VERIFIED — all four have no
backing data"*: `AgentUsageMetadata` exists at `types/domain/agent-execution.ts:44-50` but
`lib/dev-hq/agent-execution-service.ts:81` writes `usage: null`, and there is no cost,
context-health, or checkpoint field anywhere in `types/domain/`. 1F **Q-4** and **D-5** make
this a blocking Founder decision. Downstream: candidate ADR **#12** (canonical event/metric
model) and **#18** (model registry) both build on the shape chosen here. Note the plan's own
scope correction: 1F renders these fields or renders **honest absence** — it does not build
scorecards (§3.1, Q-6).

**Primary sources required.**
- Anthropic API documentation — Messages API response shape, usage object and its cached
  token fields, model identifier and version conventions.
- OpenAI API documentation — response and usage object shapes, model versioning.
- Google Gemini API documentation — response, usage metadata, and model versioning.
- Trigger.dev v4 documentation — run metadata, `metadata.set`, and what the platform
  already records per run, so Dev HQ does not duplicate a field the platform owns.
- OpenTelemetry semantic conventions for generative AI spans — the emerging standard
  attribute names, so a Dev HQ-invented vocabulary does not diverge from it needlessly.

**Repository facts required.**
- `types/domain/execution.ts`, `types/domain/agent-assignment.ts`, `types/domain/evidence.ts`
  — the current record shapes and which already carry cost-adjacent fields.
- ADR-0002 E4 — Evidence is *"append-only, immutable"* and *"never drives control flow"*,
  which constrains whether cost may live there if cost is ever to gate anything.
- ADR-0002 E5 — the timeline merges *"events, evidence, `AgentAssignment` transitions,
  reviews/findings, and escalations"*; a new record type would have to be added to that
  merge.
- `lib/dev-hq/store.ts` — `store.events` is capped at 200 while `eventKeys` and
  `evidenceUris` are never trimmed (`SPRINT_1E_COMPLETION_NOTES.md` §7 item 11); any
  attribution stored on events inherits that cap.
- `types/domain/agent.ts:8` — `provider` is an unconstrained `string` with no validation.
- ADR-0001 D3 — lease, heartbeat, ownership, and attempt bookkeeping already live on
  `AgentAssignment`, which is the natural home for per-attempt attribution.

**Alternatives to compare.**
1. Extend `Execution` with attribution fields.
2. Extend `AgentAssignment` (one record per attempt — matches the natural granularity of a
   model call).
3. A new `ModelRun` record joined to the assignment.
4. `Evidence(kind:"log")` records with a structured payload.
5. Delegate to Trigger.dev run metadata and read it back through the platform API.

**Evaluation criteria.** Whether the shape survives the addition of a second provider
without change; whether per-attempt granularity is preserved when an execution retries;
whether it is expressible in a future Supabase adapter without a migration for each new
field; whether it keeps cost out of control flow per E4; whether it composes with the
timeline merge without special-casing; growth characteristics against the existing
event cap.

**Experiment or prototype needed.** A **paper schema exercise, not code**: take three real
records already produced by the 1E baseline (a successful execution, a 3-attempt
exhaustion, and a review-driven revision), and hand-populate each candidate shape with the
fields a real provider call would have returned. The shape that expresses all three without
a null-heavy record or a special case wins. Then check each candidate against a mock
scorecard query ("cost per completed task by provider, last 30 days") and a mock timeline
row.

**Risks.** Over-modeling before a single real model call has ever been made — the fields
are guessed from provider docs, not from observed responses. Under-modeling and losing
data permanently, since these records are immutable. Coupling Dev HQ's vocabulary to one
provider's usage object. Adding a record type to a store whose only backend is in-memory
and non-durable (`lib/dev-hq/store.ts` header comment).

**Expected output.** A research note comparing the five shapes against the criteria, with
a populated worked example per candidate, and an explicit statement of which fields cannot
be obtained from which provider. It must also **satisfy the UX specification's consumer-side
contract** (View 13 §13.6, handoff ref **RB-1**): persisted usage, a rate source, a budget
entity, attribution, and a currency convention — with the design constraint that *"the UI
will not hardcode prices."* Feeds a Lead Software Engineer ADR proposal under **ADR-0003**;
**this note is not that ADR**.

**Decision authority.** Lead Software Engineer owns the record-shape decision as a
Technical Decision under GOV-001 §Decision Classes. Architecture Reviewer review is
**mandatory** — GOV-001 §When Architecture Review Is Mandatory covers work that *"adds or
changes a contract, port, adapter, or service boundary"* and *"changes what a public or
browser-readable read model exposes."*

**Founder decisions this feeds:** 1F **Q-4** (cost/context/checkpoint data availability;
recommendation (a), build plumbing and render honest absence) and **D-5**. **Ownership of
cost instrumentation is itself unassigned** — the UX specification records it as open
(**RB-1**, and its Q5: *"Who owns cost instrumentation, and in which phase?"*, routed to
Founder / Director of Operations) and names this backlog as a candidate owner. **That
ownership question should be answered before the research starts, not by it.**

---

### R-02 — Observability backbone for the Work Management Layer

**Decision question.** What is the observability boundary for Dev HQ — which signals are
domain `Event` records (product data, on the timeline), which are operational telemetry
(logs, metrics, traces), and where does telemetry go once the system runs anywhere other
than one developer's machine?

**Why the decision matters.** Dev HQ currently conflates the two. The only signal channel
is the domain `EventLogger`, whose output is capped at 200 entries in memory and is also
the audit record ADR-0002 E5 requires to be complete. The Sprint 1F "normal negative
outcome" workstream must decide, at five decline sites, whether an absorbed outcome emits
an event — and `ISSUE_MATRIX.md` Part 1 already frames the rule as *"Emit when the absorbed
outcome means work is not progressing and nothing else records why."* **"Nothing else
records why" is only decidable once something else exists to record it.** Answering the
observability question after 1F means the 1F decisions were made against a channel
inventory of one.

**Roadmap capability affected.** Sprint 1F "normal negative outcome" workstream, the
timeline read-model, scorecards; all later production operation.

**When the answer is needed. Rank A — before 1F-0 closes.** Plan anchor: 1F **D-1**, which
states the dependency precisely — the ISSUE_MATRIX's `execution.assignment_deferred` event
is *"the only record that would explain a queued-but-unassigned execution,"* and without it
the queue view (S-11) and the status-reason decision field *"have nothing honest to render
for the most common stall."* D-1 blocks 1F-3, 1F-12, and 1F-15, and its decision owner is the
Founder. Downstream: candidate ADR **#12** (canonical event and metric model, 2E-1) is marked
**Blocking** for Phase 2, and PLAN-P2-001 risk **R-1**/§2.5 chain 5 warns that every sprint
emitting non-canonical events before 2E-1 adds migration cost — so the vocabulary decided
here should anticipate #12 rather than be superseded by it.

**Primary sources required.**
- OpenTelemetry specification — signals, semantic conventions, and the JavaScript SDK's
  Next.js and serverless guidance.
- Next.js 16 documentation — `instrumentation.ts`, OpenTelemetry support, and what is and
  is not available in the runtime the app targets.
- Trigger.dev v4 documentation — built-in run tracing and log retention, so Dev HQ does not
  rebuild telemetry the platform already provides for durable work.
- Vendor documentation for any candidate backend evaluated (self-hosted and hosted), read
  for retention, ingest limits, and pricing.

**Repository facts required.**
- `standards/OBSERVABILITY_STANDARD.md` — the standard already in force; the research must
  comply with it or propose an amendment under GOV-001 §Exceptions.
- `types/contracts/event-logger.ts` and `lib/dev-hq/adapters/dev-event-logger.ts` — the
  only signal port that exists.
- `lib/dev-hq/constants.ts` — `EXECUTION_EVENT_TYPE`, `REVIEW_EVENT_TYPE`,
  `ESCALATION_EVENT_TYPE`: the complete current event vocabulary.
- ADR-0002 E3 — *"One event per meaningful transition; no event per heartbeat"* — the
  granularity rule any telemetry proposal must not violate.
- `SPRINT_1E_COMPLETION_NOTES.md` §7 item 11 — the 200-event cap against unbounded
  `eventKeys`/`evidenceUris` growth.
- `docs/validation/.../VALIDATION_REPORT.md` §3 (AR2-1) — a declined dispatch currently
  logs **no event at all**: the concrete failure this item exists to prevent recurring.
- `docs/validation/.../ISSUE_MATRIX.md` Part 1, second clause — the emit/stay-silent rule
  as currently drafted.

**Alternatives to compare.**
1. Domain events only, uncapped — telemetry and audit stay one channel.
2. Two explicit channels: `EventLogger` for audit, a separate telemetry port for
   operational signal.
3. OpenTelemetry as the single substrate, with domain events derived from spans.
4. Rely on Trigger.dev's built-in run observability for anything inside a durable run, and
   instrument only the Next.js side.

**Evaluation criteria.** Whether the audit record stays complete and append-only under
ADR-0002 E4/E5; whether operational volume can be dropped or sampled without dropping audit
records; local-development cost (the store is memory-only and tests must run with no
infrastructure — ADR-0001 §Decision Drivers cites *"memory-first, no infra to run tests"*);
vendor lock-in; whether it can answer the five 1F decline-site questions.

**Experiment or prototype needed.** A **signal inventory**, not an integration: enumerate
every current and planned signal in the WML, and classify each as audit, operational, or
both. Then take the five decline sites named in `ISSUE_MATRIX.md` and show what each
alternative would produce at each site. A throwaway `instrumentation.ts` spike against the
existing dev server is optional and must not be committed.

**Risks.** Building an observability layer before the system has a production deployment
(R-08) or any real load. Choosing a paid backend, which triggers mandatory Founder approval
under GOV-001. Fragmenting the audit trail across two systems, which would undermine the
single-timeline property ADR-0002 E5 was designed to guarantee.

**Expected output.** A signal-classification table covering every event type in
`constants.ts` plus the five decline sites, an alternatives comparison, and an explicit
statement of what 1F must decide versus what can wait for a production deployment.

**Decision authority.** Reliability Engineer produces the recommendation (ORG-001
§Reliability). Lead Software Engineer owns the implementation-boundary decision. Director
of Operations owns any change to `OBSERVABILITY_STANDARD.md`. **Founder approval is
mandatory** if a paid service is proposed — GOV-001 §When Founder Approval Is Mandatory.
**D-2E-1** (metric retention windows and rollup granularity) is delegable; **D-1**, the
Sprint 1E remediation disposition that decides whether `execution.assignment_deferred` lands,
is the Founder's and is the near-term blocker.

**Three constraints the plans add, all of which narrow this item usefully.**

- **The event vocabulary is already churning.** PLAN-P2-001 **C-7** records that
  `ISSUE_MATRIX.md` adds `execution.assignment_deferred` and `execution.claim_lost`, and that
  2E-1's canonical model must absorb them. Sequence P-3 before 2E-1.
- **A separate stream is probably required, and for a reason this item should adopt rather than
  re-litigate.** 1F **Q-8** recommends it because notification delivery receipts written into
  the 200-capped audit `Event` stream *"would evict execution history."* UX handoff **RB-2**
  independently asks for durable event history *"required for the digest and for a
  non-truncating timeline."*
- **The 200-cap is now a rated 1F risk, not just a note.** 1F **R-5**: timeline truncation
  *"silently produces an incomplete audit history — the exact opposite of what ADR-0002 E5
  requires,"* likelihood *"High at any real volume."* Whatever this item recommends must make
  truncation visible rather than silent.

---

### R-03 — Authentication boundary model

**Decision question.** What authentication and authorization model does Dev HQ adopt —
who are the principals (founder, agent worker, external service), where does the boundary
sit (edge proxy, route handler, service layer), and how does it distinguish a founder
action from a worker callback from an anonymous request?

**Why the decision matters.** **There is no authentication anywhere in the application
today, and the entire API is therefore switched off in production.** `proxy.ts` states it
plainly: *"Nothing under /api/dev-hq/* authenticates the caller yet — including the founder
approve/reject endpoints — so the whole surface fails closed in production until a real
authentication boundary exists."* Sprint 1F builds founder-facing surfaces — the escalation
queue, review surfaces, the timeline panel — every one of which is a decision surface that
must know who is deciding. AR-1E has already reclassified AR2-1 as *"must land before this
subsystem is used by anyone other than the developer who wrote it."* Authentication is the
gate in front of that entire sentence, and it also blocks R-08 (deployment) and R-14
(mobile notifications), neither of which can proceed without it.

**Roadmap capability affected.** Every Sprint 1F founder-facing surface; deployment
(R-08); mobile notifications (R-14); multi-project isolation (R-04); any non-developer use
of the system at all.

**When the answer is needed. Rank A — before 1F-0 closes.** Plan anchor: **1F-6**, 1F §10,
**Q-5**, and **D-6** (a new auth dependency needs Founder approval; 1D and 1E added zero
dependencies by design). The 1F plan states the stakes more sharply than this item first
did, and its wording should govern: *"Shipping 1F without authentication would publish the
Founder's approval authority to the internet"* — and it is on 1F's **critical path**
(`1F-0 → 1F-6 → 1F-11 → 1F-12 → 1F-13`). The plan also fixes the scope this research should
assume: **one principal, the Founder**, plus the existing server-to-server internal token;
role-based access control is Phase 2 (1F §3.2).

**Primary sources required.**
- Next.js 16 documentation — authentication guidance, `proxy.ts` / middleware semantics,
  Server Action security model, and what runs at the edge versus the node runtime.
- OWASP Application Security Verification Standard — the authentication and session
  management chapters, as the neutral requirements baseline.
- Documentation for each candidate mechanism actually considered (session cookie, OIDC
  provider, platform-native auth, signed capability token), read for threat model and
  operational requirements rather than for marketing claims.
- Supabase Auth documentation **only if** the Supabase path is under consideration — noting
  ADR-0002 E9 gates the dependency itself on explicit Founder approval.

**Repository facts required.**
- `proxy.ts` — the current production kill switch, its matcher `/api/dev-hq/:path*`, and its
  stated reason.
- `lib/dev-hq/internal-guard.ts` — the existing worker-callback guard: 403 in production,
  503 without `DEV_HQ_INTERNAL_TOKEN`, 401 on mismatch. This is authentication for *one*
  principal (the worker) and is the only one that exists.
- `app/api/dev-hq/escalations/[id]/{revise,abandon,accept}/route.ts` and
  `app/api/dev-hq/approvals/[id]/{approve,reject}/route.ts` — founder decision routes with
  no caller authentication.
- `.env.local.example` — exactly two variables (`TRIGGER_SECRET_KEY`,
  `DEV_HQ_INTERNAL_TOKEN`); no identity provider, no session secret.
- `SPRINT_1E_COMPLETION_NOTES.md` §7 item 1 (CR-1) — the review callback token is
  `rvt-<epoch-millis>-<counter>` from `nextId("rvt")` (`review-service.ts:354`,
  `id.ts:3-6`), non-blocking *only* because the production guard sits in front of it. Any
  proposal that opens the surface in production removes that mitigation.
- `docs/validation/.../VALIDATION_REPORT.md` §4 (F3 closure) — the production kill switch
  was independently verified to cover all three escalation routes via
  `functions-config-manifest.json`. That verification is what the change would invalidate.
- `standards/SECURITY_STANDARD.md`, `SECURITY.md`.

**Alternatives to compare.**
1. Keep the production kill switch; Dev HQ remains a local-only tool indefinitely.
2. Single-founder shared-secret or signed-cookie session — smallest change that permits
   non-local use.
3. Third-party identity provider with OIDC, single user today, multi-user capable.
4. Platform-native authentication tied to whichever deployment target R-08 selects.
5. Per-principal capability tokens extending the `internal-guard` pattern to founder
   actions.

**Evaluation criteria.** Whether founder, worker, and anonymous principals are genuinely
distinguishable; whether it removes the need for the blanket production 403 or merely
narrows it; blast radius if a credential leaks; whether it composes with per-project
authorization (R-04); whether local development and the test suite still run with no
external dependency; operational cost; whether it satisfies `SECURITY_STANDARD.md` without
an exception.

**Experiment or prototype needed.** A **written threat model first** — principals, assets,
trust boundaries, and abuse cases for the escalation-resolution routes specifically, since
those mutate task state on a single unauthenticated POST. Then a throwaway spike proving
that the chosen mechanism can gate a Server Action *and* a route handler *and* coexist with
the worker-token guard, without disabling the test suite. Not committed.

**Risks.** Removing or narrowing the production 403 before the mechanism is proven would
expose the founder decision routes and re-arm CR-1's predictable token — this is the single
highest-consequence sequencing risk in the backlog. Choosing an identity provider is a new
paid dependency requiring Founder approval. Under-scoping to single-user and having to
redo it when multi-project (R-04) or a second human arrives.

**Expected output.** A threat model, an alternatives comparison against the criteria, and
an explicit **sequencing statement**: what must be true before `proxy.ts`'s production
block may be narrowed, and in what order. Feeds a Security Engineer review and a Lead
Software Engineer ADR proposal.

**Decision authority.** Security Engineer produces the threat model and findings (ORG-001
§Security). Lead Software Engineer owns the technical mechanism. **Founder approval is
mandatory** — GOV-001 lists both *"carries an unresolved security, privacy, legal, or
production risk"* and *"introduces a new paid service or major dependency."* Architecture
Reviewer review is mandatory: it changes a service boundary and what a browser-readable
surface exposes.

**Two plan facts that change how this research should be run.**

1. **Decide it jointly with R-08, not after it.** 1F **Q-5**'s revised recommendation is
   explicit: the same unmerged 1C-B branch is titled *"…and auth infrastructure"* and adds
   `lib/supabase/middleware.ts` and `lib/supabase/server.ts`, so *"adopting the 1C-B branch
   would likely settle both at once, and adopting a different auth mechanism while later
   merging Supabase auth would mean building authentication twice."* What that middleware
   actually enforces, and whether it covers the 1D/1E routes authored after it, is marked
   **TO BE VERIFIED** and has not been.
2. **The acceptance bar is already written and does not move.** 1F states *"SEC-1…SEC-14 are
   the acceptance bar and do not change"* regardless of mechanism, with **AC-8** applied
   per-route rather than sampled. This research chooses a mechanism against a fixed bar; it
   does not get to propose the bar. Its recommendation — *"a one-principal system does not need
   an identity provider"*, favouring a passkey or single strong credential with a proper
   session — should be tested, not assumed.

**Founder decision Q-5 carries a second clause worth surfacing:** adding authentication changes
the behavior of existing public routes, which every prior sprint's plan forbade. It is *"a
deliberate, required deviation"* from additive-only and needs to be approved as such.

---

### R-04 — Multi-project isolation model

**Decision question.** At what layer are projects isolated — namespace within one store,
separate store instances, row-level scoping in a future persistence layer, or separate
deployments — and what exactly is shared across projects: the agent registry, capability
vocabulary, escalation queue, scorecards, evidence, and the audit timeline?

**Why the decision matters.** The domain already promises multi-project. `Project` carries
`repository` and `defaultBranch` (`types/domain/project.ts`), and the placeholder roster
defines two (`savrio-platform` and `dev-hq`,
`data/placeholders/mission-control.ts:41-60`). **But nothing below `Project` is scoped to
one.** Executions, reviews, escalations, evidence, and the agent registry all live in one
flat global store keyed by `Symbol.for("savrio.dev-hq.store")`. Sprint 1F builds the
escalation queue, the timeline panel, and scorecards — three surfaces that are meaningless
if they cannot say *which project*. ADR-0002 E8 also fixes `Project → WorkItem → Task →
Execution → AgentAssignment` as the target hierarchy while deferring `WorkItem` to Phase 2,
so 1F would be inserting surfaces into a hierarchy whose top level is currently decorative.

**Roadmap capability affected.** Sprint 1F escalation queue, timeline panel, scorecards;
ADR-0002 E8's `WorkItem` promotion in Phase 2; the persistence abstraction whenever it
lands; authorization scoping (R-03).

**When the answer is needed. Rank D — before Phase 2 implementation starts.** *Re-ranked
down from A.* Plan anchor: **2B-1** (scoping keys and isolation enforcement) and candidate
ADR **#7**, marked **Blocking** and listed among the six ADRs that *"must be approved before
Phase 2 implementation starts."* 1F does not need it: 1F §3.1 puts cross-project rollups and
portfolio views out of scope, and §3.2 puts multi-user out.

**But the deadline is harder than "before 2B."** PLAN-P2-001 risk **R-3** rates unscoped
records *"the single most expensive retrofit in Phase 2"*: *"you cannot retroactively
determine which project a knowledge note or metric sample belonged to,"* and *"the honest
remedy is deleting the unscoped corpus."* §2.5 chain 4 makes 2B-1 strictly prior to 2C, 2E,
and 2F record creation. **Practical consequence for 1F–1I: any new record type introduced
before ADR #7 is approved should carry a project scope key, even though nothing reads it
yet.** That is cheap now and unrecoverable later.

**Primary sources required.** Minimal external dependency — this is primarily an internal
architecture question. Where the answer implies persistence: PostgreSQL row-level security
documentation and Supabase RLS documentation, read for what the isolation model would
actually cost to enforce. Multi-tenancy isolation patterns from a recognized architecture
reference (for the namespace / schema / database comparison), cited rather than
paraphrased.

**Repository facts required.**
- `lib/dev-hq/store.ts` — one global store, `Symbol.for("savrio.dev-hq.store")`, seeded with
  a single workflow at `projectId: "proj-dev-hq"` (line 31).
- `data/placeholders/mission-control.ts:41-60` — two projects defined, both placeholder.
- `types/domain/project.ts` — `repository`, `defaultBranch`, `ownerId` already modeled.
- `lib/dev-hq/types.ts` — the `DevHqState` shape and which collections carry a `projectId`
  at all.
- `types/contracts/*` — which store contracts have project-scoped query methods and which
  do not. This is the concrete gap the research must enumerate.
- ADR-0002 E8 — the target hierarchy and the explicit Phase 2 deferral of `WorkItem`.
- ADR-0001 D5 — *one* canonical agent registry shared by UI and execution, which is a
  direct constraint on whether agents may be project-scoped.
- `lib/mission-control/view-model.ts` — whether the current view-model assumes one project.

**Alternatives to compare.**
1. Single global store, `projectId` filter applied at the query and view-model layer.
2. Store partitioned per project (a store instance per project).
3. Deferred entirely — 1F ships explicitly single-project, isolation revisited with the
   persistence abstraction.
4. Row-level scoping designed now as a documentation artifact, in the way ADR-0001 D7
   already specifies compare-and-set semantics for a future Supabase adapter before that
   adapter exists.

**Evaluation criteria.** Whether cross-project leakage is prevented by construction or by
discipline; whether ADR-0001 D5's single shared registry survives; whether the escalation
queue and scorecards are unambiguously scoped; migration cost from the chosen model to the
eventual persistence layer; whether it composes with R-03's authorization model; whether it
forces changes to contracts already reviewed and committed.

**Experiment or prototype needed.** A **contract audit**: enumerate every method in
`types/contracts/*` and mark whether it can express a project scope. Then trace the three
1F surfaces (escalation queue, timeline, scorecard) and show, for each alternative, what
query each surface would issue. No code.

**Risks.** Designing isolation for a system that may only ever serve one founder and two
projects — over-engineering against ADR-0001's *"smallest complete solution"* driver.
Conversely, shipping three 1F surfaces that silently mix projects, which is a correctness
defect in a governance product. Any contract change requires mandatory architecture review
and re-review of already-approved boundaries.

**Expected output.** A contract-by-contract scoping gap table, an alternatives comparison,
and a clear statement of the minimum 1F must adopt versus what may be deferred to the
persistence abstraction.

**Decision authority.** Lead Software Engineer (Technical Decision). Architecture Reviewer
review **mandatory** — contract and boundary change under GOV-001. Database Architect
consulted for the persistence-facing alternatives.

**Three Reserved Founder decisions depend on this**, and the first is the one everything else
keys on: **D-2B-1** — *"The canonical scope tuple and whether tenancy is included now or
deferred to Phase 4"*; **D-2B-3** — *"Cross-project grant policy: default-deny with explicit
grants, or role-based"* (Reserved, security); and **D-2F-4** — *"Whether experience earned in
one project may inform routing in another, and under what grant,"* which is this item crossed
with R-16's independence rule. Candidate ADR **#7** is among the six PLAN-P2-001 requires
approved **before Phase 2 implementation starts** (**D-P5**).

**The scope tuple is the highest-leverage cross-workstream artifact in the program** — §17.4
names it exactly that, because persistence and 1F both need it before schema work, and its
enforcement point is unresolved pending §17.6 **Q-2** (row-level security versus repository-layer
enforcement). That question is addressed to the persistence workstream and is shared with R-08.

---

## Group 2 — Output reliability, measurement, credentials, and delivery

*Contains R-05 (rank B), R-06 (D), R-07 (B), R-08 (A).*

---

### R-05 — Structured output reliability and payload validation

**Decision question.** How does Dev HQ obtain, validate, and recover structured output from
a non-deterministic model — native structured-output or tool-use modes versus prompt-level
JSON instruction versus grammar-constrained decoding — and what does the system do with a
payload that fails validation: reject, repair, retry, or escalate?

**Why the decision matters.** Two forces converge on this in 1F. First, the review callback
route already has a known defect: CR-6 records that
`app/api/dev-hq/internal/review/complete/route.ts:15-39` **silently drops malformed
findings** rather than rejecting them. Second, `SPRINT_1E_COMPLETION_NOTES.md` §7 item 12
designates CR-11 an explicit **Phase 2 gate**: the `recordFindings` ordering defect is
*"unreachable under the deterministic simulated reviewer; reachable the moment a
non-deterministic Phase 2 reviewer lands."* Both are about the same route accepting the
same payload. Fixing CR-6 in 1F without deciding the validation contract means fixing it
twice. `STANDARD-014` §Structured Outputs and §Validation already mandate schema validation
and *"Applications should never blindly trust AI output"* — the standard exists; the
mechanism does not.

**Roadmap capability affected.** The Sprint 1F CR-6 remediation and the CR-11 Phase 2 gate;
every Phase 2 agent or reviewer that returns anything other than free text; research agents
(R-21) and evaluation harnesses (R-06), both of which consume structured results.

**When the answer is needed. Rank B — during Sprint 1F**, before CR-6 is remediated, so the
fix implements the contract rather than preceding it. Plan anchor: CR-6 and the recorded
Phase 2 gate CR-11; downstream, **2H-5** lists *"structured-output quality scoring"* as
mature-version scope. Note that 1F §3.3 explicitly leaves the CR/NB follow-ups where they
are recorded except the two 1F depends on (§19 D-1, item 1F-7 = CR-1 and NB-1) — **CR-6 is
not among them**, so remediating it inside 1F would need a scope decision, while the
*research* here does not.

**Primary sources required.**
- Anthropic API documentation — tool use / structured output, schema support, and stated
  reliability characteristics and failure modes.
- OpenAI API documentation — structured outputs, strict schema adherence, and its documented
  limitations.
- Google Gemini API documentation — response schema / controlled generation support.
- Documentation for whichever runtime validation library is evaluated, read for TypeScript
  inference behavior and error reporting shape.
- For local and open-weight paths: grammar-constrained decoding documentation from the
  serving runtime under consideration (see R-15).

**Repository facts required.**
- `app/api/dev-hq/internal/review/complete/route.ts:15-39` — the current parse-and-drop
  behavior (CR-6).
- `SPRINT_1E_COMPLETION_NOTES.md` §7 item 12 and §5 — CR-11 / P-2, the recorded Phase 2
  gate, and both reviewers' concurrence that it is unreachable only under determinism.
- `types/domain/review.ts` — `ReviewFinding`, `severity`, `category`: the schema that must
  actually be satisfied.
- ADR-0002 E1 / D-E4 — the deterministic reviewer's keyword contract (`/block/i`,
  `/revise/i`, else pass) that a real reviewer would replace, and therefore the behavior
  that must be preserved or explicitly superseded.
- `standards/AI_ENGINEERING_STANDARD.md` §Structured Outputs, §Validation, §Error Handling.
- `package.json` — **no validation library is installed**; the project has four runtime
  dependencies and none is a schema validator. Adding one is a dependency decision.

**Alternatives to compare.**
1. Provider-native structured output / tool use with a JSON Schema.
2. Prompt-instructed JSON plus a runtime schema validator at the boundary.
3. Grammar-constrained decoding (viable only for locally served models).
4. Two-stage: free-form generation followed by a separate extraction call.
5. Accept-and-repair: validate, and on failure issue a bounded correction request.

And separately, the failure-policy alternatives: reject with 4xx; retry with a bounded
budget; escalate to the founder; degrade to an advisory finding.

**Evaluation criteria.** Measured validation-failure rate per approach on a fixed task set;
whether the approach is portable across all providers under consideration (a
provider-specific mechanism constrains R-09's routing freedom); whether the failure policy
composes with the existing bounded loops without inventing a third counter — ADR-0002 E6
deliberately keeps the retry and review counters *"independent"* and *"never conflate[d]"*;
whether it satisfies STANDARD-014 without an exception; added dependency weight.

**Experiment or prototype needed.** A **payload conformance harness**: a fixed set of
review-finding requests, each provider asked for the same `ReviewFinding[]` shape, N
repetitions, measuring schema-conformance rate, failure modes, and repair success. Must be
run against real endpoints to be meaningful — which means it depends on R-07 (credential
handling) and carries real cost. Run as a throwaway harness on the pattern the overnight
validation already established: *"assertions FAIL if the defect is real,"* run, then
deleted uncommitted (`VALIDATION_REPORT.md` §3).

**Risks.** Measuring conformance on today's model versions and treating the numbers as
durable — they are a snapshot and must be dated. Choosing a provider-native mechanism that
quietly pins the router to one provider, violating §2. Adding a validation dependency ahead
of a decision on whether one is wanted. Building the harness before R-07 exists and handling
API keys badly in the process.

**Expected output.** A dated conformance comparison, a recommended validation-boundary
placement, a recommended failure policy expressed against the existing bounded loops, and
an explicit statement of what CR-6's fix should implement. Feeds the 1F CR-6 remediation and
the CR-11 gate resolution.

**Decision authority.** Lead Software Engineer (Technical Decision). Independent Code
Reviewer verifies the CR-6 remediation against it. Architecture Reviewer **mandatory** —
CR-11 is a recorded lifecycle-ordering gate. Founder approval if a new dependency is
proposed.

---

### R-06 — AI evaluation methodology and the golden set

**Decision question.** How is agent and reviewer output quality measured — what is the
golden set, who authors it, what scoring method is used (deterministic assertion, rubric,
model-as-judge, human review), and what score gates a model or provider from being routed
to a role?

**Why the decision matters.** *The first draft's premise — "Sprint 1F builds the scorecard
domain and aggregation (ADR-0002 D-E6)" — is no longer safe to assert, and the correction
matters because it was this item's whole justification for landing in 1F.*

**Where scorecards live is an open three-way conflict between governing documents.**
ADR-0001 **D8**: *"Scorecards: deferred to Phase 2."* ADR-0002 **D-E6** and Future
Considerations: *"Scorecards and analytics (Sprint 1F)."* The Sprint 1F plan resolves it as
**out of 1F** (§3.1) because scorecards are executive analytics, and registers the conflict as
**Q-6** pending an ADR-0002 amendment. PLAN-P2-001 registers the same conflict independently
as **C-3** — rated **Material**, *"exactly the 1F/2D boundary"* — takes the position that
scorecards belong to **2D/2E**, and explicitly declines to overrule ADR-0002. It surfaces as
Founder decision **NEW-1**. **Two workstreams reached the same reading without coordinating,
and neither claims authority to settle it.** This item must not settle it either.

**What survives the correction is the stronger argument, and it is unaffected by where
scorecards land.** A scorecard — or a benchmark, or a routing decision — is an *answer* to a
measurement question nobody has asked yet. Whoever builds it first will use whatever metrics
the records happen to support (R-01) rather than what actually distinguishes good work from
bad. And this is the gate on the entire provider-neutrality principle in §2: routing on
"capability" is unfalsifiable without a measurement. PLAN-P2-001 risk **R-8** states the
consequence in its own words — without measured baselines *"the platform drifts toward
whichever model was bound first. This is the exact mechanism by which a model becomes
permanently bound to a role in practice while remaining nominally replaceable."*
`STANDARD-014` §Evaluation already requires evaluation for *"Accuracy, Consistency,
Hallucination rate, Prompt quality, User satisfaction, Cost efficiency"* and that it be
*"documented and repeatable."* **No harness exists.**

There is also a warning already in the record. `VALIDATION_REPORT.md` §4 (X2) found tests
that **pass over a broken invariant** — *"a test that passes over a broken invariant will
keep certifying it after the fix lands."* AR-1E ranked that pattern higher than the defect
it concealed. An evaluation harness with the same property would be worse than none, because
it would certify a provider choice.

**Roadmap capability affected.** **2H-2** (benchmark and evaluation harness) and **2E-5**
(statistical validation, which 2F-4's promotion gate consumes); the routing engine (R-09) and
every provider envelope study (R-10 through R-12, R-15, R-24), all of which must produce
comparable numbers; reviewer independence (R-16); **P-8**, the simulated→real agent transition,
whose Gate 2A acceptance criteria PLAN-P2-001 notes are *"not evaluable on simulations."*
Scorecards **if and where** Q-6/NEW-1 places them — this item serves them either way and does
not depend on the answer.

**When the answer is needed. Rank D — before Phase 2.** *Re-ranked down from B.* The
original reasoning — "before 1F's scorecard aggregation freezes its dimensions" — no longer
holds: **the 1F plan excludes scorecards** (§3.1) and registers the governing-document
conflict with ADR-0001 D8 and ADR-0002 D-E6/E9 as **Q-6**, pending an
ADR-0002 amendment. Plan anchor is instead **2H-2** (*"benchmark + eval harness"* over
planning, coding, review, architecture, research, restoration, and tool use) with **2E-5**
statistical validation. PLAN-P2-001 risk **R-8** states why it must precede binding
decisions: without measured baselines *"the platform drifts toward whichever model was bound
first. This is the exact mechanism by which a model becomes permanently bound to a role in
practice while remaining nominally replaceable."* That is this backlog's §2 constraint,
stated as a program risk.

**Primary sources required.**
- Published LLM evaluation methodology from a recognized source — evaluation-harness
  documentation and the model-as-judge literature, read for known biases (position bias,
  verbosity bias, self-preference) rather than cited as endorsement.
- Provider evaluation guidance: Anthropic, OpenAI, and Google each publish evaluation
  documentation; read all three, because each is written to favor its own surface.
- Documentation for any evaluation tooling actually considered, read for what it locks in.
- Statistical guidance on sample size and confidence for pass-rate comparison — enough to
  state whether an observed difference between two providers is real.

**Repository facts required.**
- ADR-0002 D-E6 and `SPRINT_1E_COMPLETION_NOTES.md` §6.2 — scorecards deferred to 1F with no
  domain, aggregation, or UI yet built. This is a clean slate, which is the opportunity.
- `standards/AI_ENGINEERING_STANDARD.md` §Evaluation, §Validation, §Testing Expectations.
- `docs/validation/.../VALIDATION_REPORT.md` §4 (X2) and §8 — the assurance-gap pattern, and
  the recorded evidence that the multi-reviewer structure produced findings no single
  reviewer could.
- `agents/independent-code-reviewer/outputs/SPRINT_1E_CODE_REVIEW.md` and
  `agents/architecture-reviewer/outputs/SPRINT_1E_ARCHITECTURE_REVIEW.md` — **real review
  output from two different providers on the same work.** This is the most valuable
  golden-set seed the repository contains, and it already includes recorded disagreements
  (AR2-4 severity; the AR2-2 narrowing) that a scoring method must handle.
- `docs/company/GOVERNANCE.md` §Evidence and Audit Requirements — findings must cite exact
  paths and line numbers and be labeled confirmed defect or plausible risk. That is already
  a scoring rubric in prose form.
- ADR-0001 D4 and O4 — the deterministic simulated agent, which is the control condition any
  evaluation should measure against.

**Alternatives to compare.**
1. Deterministic assertion suites over fixed tasks with known-correct outputs.
2. Rubric scoring by a human (the Founder), the highest-fidelity and lowest-throughput
   option.
3. Model-as-judge with an explicit independence rule (see R-16).
4. Replay evaluation: re-run past sprints' review tasks and score against the recorded
   findings and their verified dispositions.
5. Production shadow evaluation once real agents run.

**Evaluation criteria.** Does the method detect a *known-bad* output — the X2 test, applied
to the harness itself; reproducibility across runs; cost per evaluation cycle; whether it
generalizes across providers without favoring one; whether it can score the recorded
disagreements between CR-1E and AR-1E correctly; whether it satisfies STANDARD-014's
"documented and repeatable."

**Experiment or prototype needed.** Build a **small golden set from the repository's own
history** — the reproduced defects AR2-1, X1, AR2-4, F1, plus the refuted candidate F3 and
the downgraded F9, each with its verified disposition. A correct reviewer finds the four,
refutes F3, and downgrades F9. Then run each candidate scoring method against that set and
check it distinguishes a correct review from a plausible-sounding wrong one. **Validate the
harness by feeding it a deliberately wrong review and confirming it fails** — the X2 lesson,
applied.

**Risks.** A golden set drawn from one codebase measures fit to that codebase, not general
capability. Model-as-judge introduces the independence problem R-16 exists to address, and
must not be adopted before it. Six items measure themselves against this harness, so a
biased harness biases the whole backlog. Evaluation runs against real providers cost money
and need R-07 and R-17.

**Expected output.** A documented, repeatable evaluation methodology; the initial golden set
with dispositions; a scoring rubric traceable to GOV-001's evidence requirements; and the
harness's own validation result. Feeds the 1F scorecard design and every envelope study.

**Decision authority.** Lead Software Engineer and QA Engineer jointly produce it (ORG-001
§Quality Assurance: *"acceptance-criteria validation"*). Director of Operations owns whether
it amends `AI_ENGINEERING_STANDARD.md`.

**Founder decisions this feeds, all Reserved:** **D-2H-4** (*"Benchmark suite contents and the
quality bar a model must clear per role"* — this is precisely the pass/fail threshold, and
PLAN-P2-001 already assigns it to the Founder); **D-2E-2** (health-score weightings, *"Reserved
(they drive prioritization)"*); **D-2E-3** (which learning proposals may auto-apply —
*"recommendation: none"*); and **NEW-1 / Q-6**, the scorecard placement conflict. A quality bar
per role is a Product Decision under GOV-001, not a technical one, and it must be set **without**
becoming a permanent role↔model binding — D-2H-3 caps binding lifetime precisely so a passing
score does not silently become tenure.

---

### R-07 — Secrets and credential brokering

**Decision question.** How are provider credentials stored, injected, rotated, scoped, and
audited across the three runtimes Dev HQ spans — the Next.js server, the Trigger.dev worker,
and (later) local model hosts — and does an agent ever hold a credential directly, or does a
broker mint short-lived scoped grants?

**Why the decision matters.** The moment any item in this backlog makes a real provider call,
a long-lived API key enters the system. Today there are exactly two secrets
(`TRIGGER_SECRET_KEY`, `DEV_HQ_INTERNAL_TOKEN`) in a single `.env.local`, and the repository
already demonstrates the failure mode at small scale: CR-1 found the review callback
capability minted as `rvt-<epoch-millis>-<counter>`, *"a search space of a few thousand
candidates"*, non-blocking **only** because the production guard sits in front of it. That is
what ad-hoc credential minting produces. `STANDARD-014` §Security requires protecting API
keys and *"Never expose provider secrets to client applications"*; the mechanism to do that
across three runtimes does not exist.

**Roadmap capability affected.** Every real provider call (R-05's harness, R-06's evaluation
runs, R-10 through R-12, R-15, R-24); browser automation credentials (R-22); repository and
knowledge-store access (R-18, R-20); mobile push credentials (R-14).

**When the answer is needed. Rank B — during Sprint 1F.** Two independent deadlines now
apply. First, 1F itself introduces secrets: **1F-10** Web Push requires VAPID keys (1F §2.5
records *"no VAPID configuration"* today) and **1F-6** requires a session secret, both under
**D-6**, which needs Founder approval for the new dependencies. Second, and unchanged: this
must land before the first experiment in this backlog makes a billed call, or an API key
gets improvised into `.env.local` and inherited as permanent practice.

**Primary sources required.**
- Trigger.dev v4 documentation — environment variable handling, secret scoping per
  environment, and what a worker run can and cannot read.
- Next.js 16 documentation — the server/client environment variable boundary and what is
  inlined into the browser bundle.
- Provider key-management documentation from each candidate — key scoping, per-key limits,
  rotation, and revocation semantics differ meaningfully between them.
- OWASP Secrets Management Cheat Sheet as the neutral requirements baseline.
- Documentation for any secret manager actually evaluated, read for cost and operational
  burden.

**Repository facts required.**
- `.env.local.example` — the entire current secret inventory: two variables, with a comment
  noting the Trigger.dev dev CLI loads `.env.local` too *"so both processes see the value."*
  That sharing mechanism is the current design and must be evaluated, not assumed forward.
- `lib/dev-hq/internal-guard.ts` and `lib/dev-hq/internal-headers.ts` — the existing shared
  secret pattern and where the header is applied.
- `SPRINT_1E_COMPLETION_NOTES.md` §7 item 1 (CR-1) — the predictable-token finding and its
  stated remediation (`crypto.randomUUID()`), which is also 1F sequencing item 4 in
  `VALIDATION_REPORT.md` §9.
- `SPRINT_1E_COMPLETION_NOTES.md` §5 (P-3) — *neither review could establish Trigger.dev's
  dashboard retention semantics for the callback token in run payloads.* Any credential
  passed through a Trigger payload inherits that unresolved question.
- `.gitignore` — what is currently excluded from version control.
- `standards/SECURITY_STANDARD.md`, `SECURITY.md`, `AGENTS.md` §Universal Prohibitions
  (*"Expose credentials, secrets, private data, or protected information"*).

**Alternatives to compare.**
1. Environment variables per runtime — the status quo, extended.
2. A hosted secret manager with runtime fetch.
3. A Dev HQ credential-broker service: agents never hold provider keys; the WML makes the
   provider call on their behalf.
4. Short-lived scoped tokens minted per execution, extending the `internal-guard` pattern
   properly (with a CSPRNG, per CR-1).
5. Deployment-platform-native secret storage, coupled to R-08.

**Evaluation criteria.** Whether a credential can ever reach the browser; whether a
credential can appear in a Trigger.dev run payload given P-3's unresolved retention
question; rotation cost and blast radius on compromise; whether per-agent or per-project
scoping is expressible (needed by R-04 and R-16); whether local development still works
with no external dependency; auditability — can the timeline say which credential was used
for which run; cost.

**Experiment or prototype needed.** A **credential-flow trace**: for one hypothetical real
provider call, diagram every hop the credential takes across the three runtimes under each
alternative, and mark every point at which it is at rest, in a payload, or in a log. Then
resolve P-3 by direct inquiry to Trigger.dev documentation or support — that is a real
outstanding question both prior reviews left open, and it is answerable.

**Risks.** Deferring this and letting the first experiment set the precedent. A secret
manager is a new paid service requiring Founder approval. Over-building a broker for a
single-founder system. Note that the broker alternative (3) is the one that composes best
with R-17 budget enforcement and R-16 independence — that coupling should be evaluated, not
assumed.

**Expected output.** A credential-flow comparison across the three runtimes, a resolved
answer on Trigger.dev payload retention (P-3), a recommended handling model, and a rotation
and revocation procedure. Feeds a Security Engineer review.

**Decision authority.** Security Engineer produces the findings (ORG-001 §Security). Lead
Software Engineer owns the mechanism. **Founder approval mandatory** for any paid service and
for accepting any residual credential-exposure risk. Director of Operations records the
procedure.

---

### R-08 — Deployment and rollback model

**Decision question.** Where does the Dev HQ application run when it runs outside a
developer machine, and what is the rollback unit — given that the durable state lives in
three places that do not roll back together: the Next.js process, the Trigger.dev
deployment, and the in-memory store?

**Why the decision matters. The application has never been deployed and has no deployment
target.** Verified: no `vercel.json`, no `Dockerfile`, no container or platform
configuration anywhere in the tree. The `release.yml` workflow releases *"the repository
itself, not the Savrio application."* CI runs only on `main`, while all current work is on
feature branches. Meanwhile the state store is explicitly *"Single Next.js process,
non-durable, not for production"* (`lib/dev-hq/store.ts` header). This means the rollback
question is genuinely unusual here: **rolling back the application discards all state**,
because state is process memory. Anything 1F builds that a founder is expected to rely on
inherits that property. `standards/DEPLOYMENT_STANDARD.md` exists and is unexercised.

**Roadmap capability affected.** Any non-local use at all — which gates R-03's value, R-14
(mobile notifications), and the "first non-developer use" threshold AR-1E applied to AR2-1.

**When the answer is needed. Rank A — before 1F-0 closes. This is the highest-priority item
in the backlog.** *Re-ranked up from B.* Plan anchor: 1F **Q-1**, which the plan titles
*"Where does this run, and on what persistence?"* and marks *(highest priority)*, feeding
**ADR-0003** and dependencies **D-2** and **D-7**; and Phase 2 precondition **P-1**, which
PLAN-P2-001 calls *"the single hardest Phase 2 blocker"* and *"the true program bottleneck…
the highest-value thing to start on today."* Candidate ADR **#23** covers migration and
rollback safety at 2K-3.

**Two plan facts supersede parts of this item as first drafted.**

1. **Persistence is not unbuilt.** 1F Q-1 records, VERIFIED, that
   `feature/sprint-1c-b-supabase-persistence` exists locally and unmerged at tip `3d1665f`,
   28 files against `sprint-1e-baseline`, including
   `supabase/migrations/0001_dev_hq_schema.sql` and seven Supabase adapters — **but covering
   only** approval-manager, event-logger, project-repository, state-reader, task-repository,
   workflow-engine, and workflow-run-repository. There is **no** adapter for evidence-store,
   review-store, escalation-store, execution-runner, or agent-provider: *"precisely the
   Sprint 1D/1E entities the 1F timeline, queue, review, and escalation surfaces read. The
   branch predates 1D and 1E."* Assessing that branch is now part of this item's scope.
2. **1F does not own the persistence decision.** The plan routes it to its own workstream
   under P-1 / **D-P1**, and states plainly: *"1F should not own that decision, and this plan
   does not claim it."* What 1F needs from that workstream is an interface (1F §20.4 I-1).

Also verified by the plan and material here: `lib/dev-hq/actions.ts:43` disables agent
dispatch when `NODE_ENV === "production"`, so **a production deployment of the current code
cannot dispatch or execute anything** — which bounds what any early deployment can
demonstrate.

**Primary sources required.**
- Next.js 16 deployment documentation — self-hosting versus platform hosting, and the
  runtime requirements of the features in use.
- Trigger.dev v4 deployment documentation — how worker deploys version and roll back, and how
  a worker version relates to the application version it calls back into. **This coupling is
  the core of the question.**
- Documentation for each candidate host actually evaluated, read for rollback primitives,
  environment isolation, and pricing.
- GitHub Actions deployment and environment-protection documentation, since `release.yml`
  already establishes a protected-environment pattern.

**Repository facts required.**
- Absence of any deployment configuration — the verified starting point.
- `.github/workflows/` — `ci.yml`, `dependencies.yml`, `lint.yml`, `pr.yml`, `release.yml`,
  `security.yml`; `ci.yml` triggers only on `main` push and PRs to `main`.
- `.github/workflows/release.yml` — the existing validate → verify → publish gate model and
  its `production-release` protected environment with required human reviewers.
- `RELEASE_PROCESS.md`, `VERSIONING_POLICY.md`, `standards/DEPLOYMENT_STANDARD.md`.
- `lib/dev-hq/store.ts` header — non-durable single-process state.
- `proxy.ts` — the production 403 that any deployment initially inherits (and which R-03
  gates).
- `trigger.config.ts` — `project: "proj_bzcbfojhugcnklltuknc"`, `maxDuration: 3600`, and the
  retry policy that a worker rollback would change.
- `SPRINT_1E_COMPLETION_NOTES.md` §5 — *"Trigger.dev worker semantics unverified"*; both
  reviews examined the durable tasks only as source and through mocks. Deployment is where
  that gap stops being theoretical.

**Alternatives to compare.** *The 1F plan has already narrowed these and made a recommendation
this research should test rather than re-derive.*

1. **Single long-lived process on a trusted network (VPN/tunnel), memory store, accepting
   restart data loss** — **the 1F plan's revised recommendation for 1F specifically**, with the
   persistence decision routed to its own workstream. Note what it costs: 1F §13 F-6 and risk
   **R-6** stand, and a server restart empties all state.
2. **Adopt the unmerged `feature/sprint-1c-b-supabase-persistence` branch.** Interface **I-1**
   states the acceptance condition exactly: a durable backend *"whose adapters cover
   `evidence-store`, `review-store`, `escalation-store`, `execution-runner`, `agent-provider`
   — the five the 1C-B branch does not implement."* Assessing merge cost after 1D and 1E is
   part of this item.
3. **Build and validate locally; defer deployment entirely.**
4. Managed platform hosting for Next.js with Trigger.dev cloud workers.
5. Self-hosted container for both.
6. Preview-environment-per-branch, aligned with Trigger.dev preview branches.

**A serverless or multi-instance target is effectively disqualified for the current code, not
merely disfavored** — 1F Q-1 records that it *"breaks it outright — each instance would hold a
different store, and the Founder would see different state on each request."*

And for the rollback unit: application-only; application plus worker version pinned
together; forward-fix only with no rollback.

**Evaluation criteria.** Whether application and worker versions can be rolled back as a
coherent pair — a worker calling back into an older route contract is the concrete failure
mode; what happens to in-flight durable runs during a deploy; whether state loss on
redeploy is acceptable, and if not, whether this item is actually blocked on the persistence
abstraction (ADR-0002 E9); cost; whether it satisfies `DEPLOYMENT_STANDARD.md`; whether the
`release.yml` human-approval gate extends to it.

**Experiment or prototype needed.** A **failure-mode walkthrough** rather than a deploy: for
each alternative, trace what happens to (a) an in-flight `agent-execution` run, (b) a pending
review awaiting a callback, and (c) an open escalation, when the application is redeployed
and when it is rolled back. The sweeper (`EXECUTION_SWEEP_CRON = "* * * * *"`) and the
reclaim path are the recovery mechanisms in play, and this walkthrough is the first real test
of the recovery design 1E built.

**Risks.** Deploying before R-03 exists would either expose an unauthenticated API or deploy
a surface that returns 403 to everything — the second is safe but of limited value, and the
first is unacceptable. Choosing a host is a new paid service requiring Founder approval.
Discovering mid-item that meaningful deployment is blocked on the deferred persistence
abstraction — this is a plausible outcome and the item should be allowed to conclude that.

**Expected output.** A deployment-target comparison, an explicit rollback-unit
recommendation covering the application/worker coupling, the state-loss walkthrough, and a
clear statement of the dependency chain (R-03 → R-08 → R-14) and of whether persistence
blocks it. Two additional deliverables the plans now require of it:

- **An assessment of the 1C-B branch against interface I-1** — do its adapters satisfy the
  current contracts, what does `lib/supabase/middleware.ts` actually enforce, does it cover
  `/api/dev-hq/*`, and what merge cost does it carry after 1D and 1E. The 1F plan marks all of
  this *"TO BE VERIFIED AFTER SPRINT 1E"*; it has not been done.
- **An answer to PLAN-P2-001 §17.6 Q-2**, addressed to whoever owns persistence: the
  transactional guarantees of the chosen backend — compare-and-set, row-level scoping, and
  time-series/rollup support — and *"Does row-level security exist for 2B isolation, or must
  isolation be enforced in the repository layer?"* 2A packet claim, 2B `ScopeKey` enforcement,
  and 2E's metric store all depend on that answer, and so does R-04.

**Decision authority.** DevOps and Reliability perspectives produce the recommendation.
Lead Software Engineer owns the technical approach under **ADR-0003**, which the 1F plan
claims for deployment, persistence, transport, and auth — note **C-2**, the recorded numbering
collision: Phase 2 yields and numbers from ADR-0004, and PLAN-P2-001 recommends the Founder
assign ADR numbers centrally (**NEW-4**).

**Founder approval mandatory**, and this is the most heavily gated item in the backlog: a
hosting platform is a new paid service; Release Decisions are the CEO's under GOV-001 §Decision
Classes; **D-P1** (*"Approve the durable persistence backend and merge path for Sprint 1C-B"*)
is Reserved and due **before P2-00**; and 1F **Q-1** plus **D-2**/**D-7** gate Phases B–E of 1F.
Director of Operations owns alignment with `RELEASE_PROCESS.md`. **Ownership of the persistence
workstream itself is not yet visible** — PLAN-P2-001 §17.3 lists its owner as *"not yet visible
to us."* That gap should be closed before the research starts.

---

## Group 3 — Model selection, provider envelopes, context, and the founder's phone

*Contains R-09 (rank D), R-10 (D), R-11 (D), R-12 (D), R-13 (C), R-14 (A).*

---

### R-09 — Provider routing policy engine

**Decision question.** What routing policy selects a provider and model for a unit of work
— static configuration, capability-declaration matching, measured-score routing, cost-aware
tiering, or runtime fallback chains — and where does the decision live: in the Agent
Registry, the Execution Manager, a new routing service, or a provider adapter behind
`AgentProvider`?

**Why the decision matters.** This is the item §2's constraint exists to protect. The
principle that provider choice stays governed by capability, context, cost, latency,
reliability, policy, and independence is only real if something implements it; otherwise it
degrades into whatever ORG-001's table happens to say. Structurally, ADR-0001 pre-cut the
seam — the `AgentProvider` port is vendor-neutral by design, and
`lib/dev-hq/adapters/dev-agent-provider.ts:32-35` deliberately leaves `execute` unimplemented
because *"agent dispatch is owned by"* the execution path. That unimplemented method is
where routing will land, and how it lands determines whether provider choice is a
first-class governed decision or a hardcoded constant.

**Roadmap capability affected.** Phase 2 real agents (ADR-0001 D4); the capability taxonomy
ADR-0001 O3 defers to Phase 2; per-agent concurrency (D6); cost enforcement (R-17); reviewer
independence (R-16).

**When the answer is needed. Rank D — before Phase 2, with one part due much earlier.**
*Re-ranked from C.* Plan anchor: **2H-1** (model/provider/binding registry) and **2H-3**
(versioned routing policy), with candidate ADR **#18** — *"Model registry, versioned routing
policy, and binding revocability"* — marked **Blocking**.

**The earlier part is precondition P-4**, which requires a thin `ModelResolver` port,
registry-backed, *"no hardcoded model names in orchestration,"* **in place before Phase 2
starts** and before 2A. PLAN-P2-001 §0.4 item 5 is explicit: *"Before 2H exists, bindings
still must not be hardcoded… A stage that ships a hardcoded model reference fails its
architecture gate."* So the *port shape* is a P-4 deliverable; the *policy* is 2H.

PLAN-P2-001 §0.4 also settles several questions this item had listed as open, and they should
be treated as decided rather than re-researched: every role↔model binding is a **first-class,
versioned, expiring, revocable record** (`RoutingPolicyBinding`) with an approving authority
and a rollback target; no binding is permanent; binding changes are governed transitions
carrying policy version, inputs, decision, explanation, and override authority; and
*"historical model performance is never authority."* This item's remaining job is the
*mechanism*, not the principle.

**Primary sources required.**
- Anthropic, OpenAI, and Google API documentation — model families, current identifiers,
  versioning and deprecation policy, rate limits, and regional/policy constraints. **All
  three must be fetched at research time; none may be answered from memory.**
- Documentation for any routing or gateway library evaluated, read for what it constrains.
- Each provider's stated data-handling, retention, and training-use policy — the "policy"
  dimension in §2 is a documented fact per provider, not a judgment.
- Published status-page history for each provider, for the reliability dimension.

**Repository facts required.**
- `types/contracts/agent-provider.ts` — the vendor-neutral contract:
  `listAgents`, `getAgent`, `execute`, `healthCheck`. Whether routing fits behind `execute`
  or needs a new port is the structural question.
- `lib/dev-hq/adapters/dev-agent-provider.ts:32-35` — `execute` throws by design.
- `lib/dev-hq/agent-registry.ts` and `lib/dev-hq/constants.ts` — `AGENT_CAPABILITIES`, the
  frozen ten-term vocabulary, and ADR-0001 O3's note that *"a fuller department-mapped
  taxonomy is deferred to Phase 2."*
- ADR-0001 D5 (one canonical registry), D6 (capacity 1 per agent), O5 (selection tie-break =
  least-recently-active) — the selection logic that exists today.
- `types/domain/agent.ts:8` — `provider: string`, unconstrained.
- `docs/company/ORGANIZATION.md` — the current role/tool table, read as the default routing
  configuration per §2.
- `AGENTS.md` §Role and Tool Separation — the governing principle the engine must satisfy.
- ADR-0002 E7 — no direct agent-to-agent communication; all coordination through the WML.
  Routing must not become a back channel.
- R-01's output — routing cannot select on dimensions the records do not carry.

**Alternatives to compare.**
1. Static configuration file mapping role → provider, versioned and reviewable (the honest
   formalization of today's ORG-001 table).
2. Capability-declaration matching: agents declare capabilities, work declares requirements,
   the registry matches — an extension of the existing selection logic.
3. Score-driven routing using R-06's measurements.
4. Cost-tiered routing: cheapest model meeting a quality floor, escalating on failure.
5. Fallback chains for availability, with the primary chosen by one of the above.
6. Founder-in-the-loop routing for high-consequence work.

**Evaluation criteria.** Whether all seven §2 dimensions are actually expressible in the
policy — a policy that cannot express "independence" fails the constraint; whether a
provider can be swapped without code change; whether routing decisions are recorded on the
timeline and auditable (depends on R-01); whether it composes with capacity-1 agents (D6)
and the least-recently-active tie-break (O5); whether it degrades safely when the preferred
provider is unavailable; whether ORG-001's current assignments are reproducible as a
configuration, so adopting the engine changes nothing until someone changes the config.

**Experiment or prototype needed.** A **policy-expression exercise**: write out five
concrete routing scenarios — including "the reviewer must not share a provider with the
implementer" (R-16) and "this task exceeds the remaining budget" (R-17) — and show whether
each alternative can express them. Then a paper trace of one dispatch through
`agent-execution-service` under each alternative, marking every place the current code would
change.

**Risks.** Building a routing engine before any real provider adapter exists — the abstraction
would be validated against nothing. Encoding today's ORG-001 assignments as defaults and
having the default silently become permanent, which is precisely what §2 forbids. Routing
complexity obscuring why a given agent was chosen, which would degrade the audit trail
ADR-0002 E5 exists to guarantee. Provider model identifiers change; a policy pinned to
specific model strings needs a maintenance path.

**Expected output.** A comparison of routing policies against the seven §2 dimensions and the
five scenarios; a recommended placement relative to the `AgentProvider` port; and an explicit
statement of what must be recorded (feeding back into R-01) for a routing decision to be
auditable. Feeds a Lead Software Engineer ADR proposal.

**Decision authority.** Lead Software Engineer owns the mechanism (Technical Decision).
Architecture Reviewer **mandatory** — port and boundary change. **Founder owns the policy
itself**: which dimensions may override which, and whether ORG-001's table is a default or a
binding, is a Product/Strategic Decision. Director of Operations owns the resulting ORG-001
amendment.

**Four Reserved Founder decisions, and one of them is the number that makes §2 enforceable.**
**D-2H-1** — approved provider list, data-policy requirements, and spend ceilings per provider.
**D-2H-3** — *"Maximum binding lifetime before mandatory re-evaluation (enforces §0.4
non-permanence)"*, which PLAN-P2-001 §17.7 singles out as one of the four highest-leverage
decisions in the program: *"the number that makes model non-permanence enforceable."* **D-2H-2**
— promotion authority (L4 vs L5) and canary criteria. **NEW-3** — approve providers and spend
for the **P-8** simulated→real transition, and decide whether real agents phase in per role or
all at once. Candidate ADR **#18** is **Blocking**.

**Two existing ADR constraints bound the mechanism and should not be quietly lifted.**
**C-9**: ADR-0001 **D6** fixes agent capacity at 1 and defers `maxConcurrency > 1`; PLAN-P2-001's
position is that parallelism comes from many agents rather than per-agent concurrency, so 2A's
MVP works under D6, and lifting it is *"a 2A-3 option, not a requirement… only when the optimizer
shows it pays."* **C-10**: ADR-0001 **O3**'s ten-capability vocabulary needs a department-mapped
successor for 2A staffing and 2F task classes, and that expansion is **currently unassigned** —
a routing engine cannot select on capabilities nobody owns.

**Non-negotiable outcome constraint.** Phase 2 exit criterion 6 requires demonstrating a full
benchmark → policy → shadow → canary → promotion → **rollback** cycle *"with **no role permanently
bound to any model** and every binding carrying an expiry and a revocation path."* This backlog's
§2 constraint and the program's exit gate now say the same thing; this item may not produce a
design that fails that test.

---

### R-10 — Claude capability and operational envelope

**Decision question.** What is the current, verified operational envelope of the Claude model
family for the specific work classes Dev HQ performs — implementation, code review,
architecture review, planning, design, and structured extraction — measured on comparable
terms with R-11, R-12, R-15, and R-24?

**Why the decision matters.** Routing on "capability" (§2) requires an envelope per candidate,
produced the same way for each. Without it, provider choice reverts to habit and to the names
already written into ORG-001. Claude is currently assigned to the Lead Software Engineer role
and, per `SPRINT_1E_COMPLETION_NOTES.md`, produced the Sprint 1D and 1E implementations —
so there is more accumulated evidence here than for any other provider, and correspondingly
more risk of confusing familiarity with measured superiority.

**Roadmap capability affected.** R-09's routing inputs; the Phase 2 transition off simulated
agents.

**When the answer is needed. Rank D — before Phase 2**, with R-09. *Re-ranked from C: Phase 1
runs deterministic simulated agents (ADR-0001 D4), so no envelope study is needed to start 1G
or 1H.* Plan anchor: **2H-1**, whose MVP scope is a *"provider/model/version registry with
model cards and data-policy fields"* — this study produces the evidence a model card records.

**Primary sources required.** Anthropic's official documentation, fetched at research time —
models overview and current identifiers, pricing, context window and long-context behavior,
prompt caching, tool use and structured output, batch processing, rate limits and tiers, and
the data-usage and retention policy. Anthropic's published model cards and evaluation
reports, read as vendor-authored evidence. **This document deliberately states no Claude
model name, price, or limit; every such fact must come from the live source.**

**Repository facts required.**
- `data/placeholders/mission-control.ts:219` — `provider: "anthropic"` already present in the
  seeded roster.
- `docs/company/ORGANIZATION.md` §Engineering — the current Lead Software Engineer assignment.
- `agents/architecture-reviewer/outputs/SPRINT_1E_ARCHITECTURE_REVIEW.md` and the Sprint 1D/1E
  implementation history — real work product available for retrospective quality assessment
  under R-06.
- `AGENTS.md` §Role and Tool Separation — the neutrality principle that governs how this study's
  conclusions may be used.
- `.claude/agents/*` and `agents/*/AGENT.md` — the operating definitions currently in use, which
  are part of the envelope: a model's measured behavior is inseparable from the prompt and tool
  grant it runs under. `VALIDATION_REPORT.md` §7 is the proof — the LSE role *"never
  functioned"* because its tool grant lacked `Write`, a harness failure with nothing to do with
  model capability.

**Alternatives to compare.** Within the family: the current tiers against each other on the same
tasks, and against the deterministic simulated agent (ADR-0001 O4) as the control. Access paths:
direct API versus any cloud-provider-hosted route, compared on price, region, policy, and
feature parity (prompt caching and structured output support are not always identical across
access paths — this must be verified, not assumed).

**Evaluation criteria.** R-06's golden-set scores; cost per completed task including review
iterations; latency at the p50 and p95 the durable loop actually needs; long-context
degradation on realistic repository payloads; structured-output conformance from R-05; rate
limits against expected concurrency (noting ADR-0001 D6's capacity-1 constraint bounds this
today); policy fit; **and independence** — where Claude is already used, using it again
elsewhere costs independence, which is a routing cost, not a capability judgment.

**Experiment or prototype needed. One harness, shared by R-10, R-11, R-12, R-15, and R-24.**
Same tasks, same prompts modulo required format differences, same scoring, same reporting.
Anything else produces incomparable numbers. Include the tool-grant dimension: run at least
one task under a deliberately restricted grant, to measure how much of the envelope is harness
rather than model.

**Risks.** Familiarity bias — the most-used provider has the most anecdote and the least
controlled comparison. Results dating quickly; every number needs a date and a model version.
Cost of running the harness (needs R-07 and R-17). Treating a vendor-published benchmark as
independent evidence.

**Expected output.** A dated envelope report on the shared template, with model versions,
measured scores, costs, latencies, limits, and policy facts each cited to its source. Feeds
R-09.

**Decision authority.** Research Analyst produces it (ORG-001 §Research). Lead Software
Engineer and QA Engineer review the method. **No routing decision is made by this item** — it
produces evidence for R-09, and per §2 it may not conclude with a role assignment.

---

### R-11 — OpenAI capability and operational envelope

**Decision question.** What is the current, verified operational envelope of the OpenAI model
family for Dev HQ's work classes, on the same measurement basis as R-10, R-12, R-15, and R-24?

**Why the decision matters.** Same as R-10: comparability is the whole point. OpenAI is
additionally the provider behind the Independent Code Reviewer role in ORG-001 (Codex), which
makes it the incumbent on the *review* side of the review/implementation independence pair —
directly relevant to R-16. `SPRINT_1E_COMPLETION_NOTES.md` §3 and the overnight validation
record substantial real review output from that role, including two independently reached
findings and a self-correction against interest (`VALIDATION_REPORT.md` §8).

**Roadmap capability affected.** R-09's routing inputs; R-16's independence analysis; the Phase
2 transition.

**When the answer is needed. Rank D — before Phase 2**, with R-09 and R-10, on the shared
harness. *Re-ranked from C, same reason.* Plan anchor: **2H-1** model cards and registry.

**Primary sources required.** OpenAI's official documentation, fetched at research time —
models and current identifiers, pricing, context windows, structured outputs and strict schema
adherence, prompt caching, batch processing, rate limits and tiers, reasoning-model behavior
and its cost characteristics, and the data-usage and retention policy. OpenAI's published model
and system cards. **No model name, price, or limit is stated in this document.**

**Repository facts required.**
- `data/placeholders/mission-control.ts:230` — `provider: "openai"` in the seeded roster.
- `docs/company/ORGANIZATION.md` §Code Quality — Codex as Independent Code Reviewer, and
  GOV-001 §Role Boundaries: *"Codex should not approve its own unreviewed implementation when
  independent review is required."* That sentence is a provider-independence rule already in
  force, expressed in provider terms.
- `agents/independent-code-reviewer/outputs/SPRINT_1E_CODE_REVIEW.md` — real review output for
  retrospective assessment.
- `SPRINT_1E_COMPLETION_NOTES.md` §7 item 6 — `handbooks/INDEPENDENT_CODE_REVIEWER.md` **does
  not exist** despite being named by `agents/independent-code-reviewer/AGENT.md:7`. Part of the
  operating envelope is missing from the repository, which bounds what any retrospective
  assessment can claim.

**Alternatives to compare.** Within the family: general-purpose against reasoning-optimized
tiers on the same tasks, plus the simulated-agent control. Access paths: direct API versus any
hosted route, compared on parity, price, region, and policy.

**Evaluation criteria.** Identical to R-10, deliberately: golden-set scores, cost per completed
task, p50/p95 latency, long-context degradation, structured-output conformance, rate limits,
policy fit, and independence cost given existing usage.

**Experiment or prototype needed.** The shared harness from R-10. Where OpenAI's strict
structured-output mode differs materially from the others' mechanisms, record it as a
capability difference *and* as a portability constraint on R-09 — a router cannot depend on a
feature only one provider has without pinning itself.

**Risks.** Same as R-10, plus: reasoning-model pricing and latency profiles differ enough from
standard completion that a single "cost per task" number can mislead. Report the distribution,
not just the mean.

**Expected output.** A dated envelope report on the shared template. Feeds R-09 and R-16.

**Decision authority.** Research Analyst produces it. Lead Software Engineer and QA Engineer
review the method. **No routing decision is made here.**

---

### R-12 — Gemini capability and operational envelope

**Decision question.** What is the current, verified operational envelope of the Gemini model
family for Dev HQ's work classes, on the same measurement basis as R-10, R-11, R-15, and R-24
— including the multimodal and long-context characteristics the QA role would actually exercise?

**Why the decision matters.** Same comparability argument. Gemini carries additional specific
weight because ORG-001 assigns it the QA Engineer role, whose responsibilities include *"visual
inspection"* and *"browser behavior review"* — work classes the other envelope studies do not
naturally cover, and which connect directly to R-22 (browser automation). Whether the QA role's
actual requirements are multimodal, and whether that is a routing-relevant capability
difference, is an open question this study should answer rather than assume.

**Roadmap capability affected.** R-09's routing inputs; R-22 browser automation; the Phase 2
transition.

**When the answer is needed. Rank D — before Phase 2**, with R-09, R-10, and R-11 on the
shared harness. *Re-ranked from C, same reason.* Plan anchor: **2H-1** model cards and
registry. The QA/multimodal half additionally feeds **2K-2** (accessibility as a blocking
gate) and depends on R-22 having established any browser capability at all.

**Primary sources required.** Google's official Gemini API documentation, fetched at research
time — models and current identifiers, pricing, context window and long-context behavior,
context caching, controlled generation / response schemas, multimodal input support, rate
limits, and the data-usage and retention policy, including any differences between the
consumer-facing API and the enterprise/Vertex path. Google's published model cards. **No model
name, price, or limit is stated in this document.**

**Repository facts required.**
- `data/placeholders/mission-control.ts:241` — `provider: "google"` in the seeded roster.
- `docs/company/ORGANIZATION.md` §Quality Assurance — Gemini as QA Engineer, and the
  responsibility list including visual inspection and browser behavior review.
- GOV-001 §Role Boundaries — *"QA reports observed behavior and does not silently rewrite
  product requirements."*
- `agents/qa-engineer/AGENT.md` and `templates/QA_REPORT.md` — the actual expected output
  format, which is what any evaluation must score against.
- `package.json` — `@playwright/test` is installed as a dev dependency; **no Playwright
  configuration and no test file exists anywhere in the tree.** The QA role's browser capability
  is currently unexercised, which bounds what can be measured (see R-22).

**Alternatives to compare.** Within the family: the current tiers against each other, plus the
simulated control. Access paths: the direct API versus the enterprise/Vertex path, compared on
parity, price, region, and policy — these differ more between paths for this provider than the
comparison naturally assumes, and the difference must be verified.

**Evaluation criteria.** Identical to R-10 and R-11, plus a multimodal dimension: whether visual
inspection of a rendered UI produces findings a text-only reviewer cannot, measured against
`ACCESSIBILITY_STANDARD.md` and the QA report template rather than by impression.

**Experiment or prototype needed.** The shared harness, plus one additional task class: score a
rendered Mission Control view against the QA report template, once from a screenshot and once
from the DOM text. If the two are indistinguishable in finding quality, multimodality is not a
routing-relevant capability here and R-22 gets simpler.

**Risks.** Same as R-10 and R-11. Additionally: the QA-specific tasks are not comparable to the
other envelope studies' tasks, so they must be reported as a separate section rather than folded
into a single score. Measuring a multimodal capability against a UI that is largely placeholder
data would overstate or understate it — use the live surfaces only.

**Expected output.** A dated envelope report on the shared template, plus a separate QA/multimodal
section. Feeds R-09 and R-22.

**Decision authority.** Research Analyst produces it. QA Engineer reviews the QA-task design.
**No routing decision is made here.**

---

### R-13 — Context caching strategy

**Decision question.** What context is stable enough across agent invocations to be cached —
the governance corpus, standards, ADRs, role handbooks, repository structure — how is it
segmented and versioned, and does each provider's caching mechanism actually pay for itself at
Dev HQ's invocation pattern?

**Why the decision matters.** Dev HQ is unusually well suited to caching and unusually exposed to
its absence. `AGENTS.md` §Required Startup Procedure obliges **every** AI employee, before
beginning work, to read this file, the Constitution, the governance and organization documents,
the assigned role handbook, and all applicable project instructions. That is a large, nearly
identical prefix on every single invocation — measured in the repository as `AGENTS.md` at ~13.6 KB
plus four company documents, seventeen standards, and a role handbook, some of which
(`ARCHITECTURE_REVIEWER.md`) exceed 29 KB on their own. Without caching, Phase 2 pays for that
corpus on every call. But caching mechanisms, minimum cacheable sizes, TTLs, and pricing differ by
provider, and a caching strategy that only works on one provider constrains R-09.

**Roadmap capability affected.** Cost enforcement (R-17); the routing engine's cost dimension
(R-09); every Phase 2 agent invocation; knowledge stores (R-20), which determine what the cached
prefix even contains.

**When the answer is needed. Rank C — before Sprint 1H.** Plan anchor: 1H is
**Repository Intelligence + Context Router**, and the **Context Lifecycle Manager** is named
alongside it in Phase 2 precondition **P-5**. Caching strategy and the Context Router's
retrieval strategy are two answers to one question and 1H owns both, so this must be settled
before 1H starts rather than merely before the first real-agent workload. 1F also touches the
adjacent surface: §2.4 puts **context health** — per-execution context-window utilization and
degradation risk — in scope as 1F-5, so the vocabulary for measuring context should be agreed
before 1H consumes it.

**Primary sources required.** Each provider's caching documentation, fetched at research time —
Anthropic prompt caching, OpenAI prompt caching, Google context caching. For each: minimum
cacheable size, TTL, write and read pricing relative to base tokens, invalidation semantics, and
interaction with tool definitions and system prompts. These mechanisms are **not equivalent** and
the differences are the substance of this item.

**Repository facts required.**
- `AGENTS.md` §Required Startup Procedure — the nine-step mandatory reading list.
- Measured sizes of the actual corpus: `AGENTS.md` (~13.6 KB), `docs/company/*` (four documents),
  `standards/*` (seventeen documents, ~4–5 KB each), `handbooks/*` (ten, ranging to ~29 KB), the
  ADRs, and the relevant `agents/*/AGENT.md`.
- Which documents change and how often — `git log` on `standards/` and `docs/company/` gives the
  real invalidation rate, and that rate determines whether caching is viable at all.
- `standards/AI_ENGINEERING_STANDARD.md` §Context Management — *"Provide only the context required
  to complete the task"* — which is in tension with a large cached prefix and must be reconciled
  explicitly, not ignored.
- R-01's output — cached-token counts must be recorded or the saving cannot be demonstrated.

**Alternatives to compare.**
1. No caching; minimize context per §Context Management instead.
2. Provider-native caching of a large stable prefix.
3. Retrieval instead of caching: fetch only relevant governance sections per task (couples to R-19
   and R-20).
4. Hybrid: a small always-cached core (Constitution, AGENTS.md, role handbook) plus retrieval for
   standards and ADRs.
5. Pre-compiled role-specific context bundles, cached per role.

**Evaluation criteria.** Measured cost reduction per invocation against a realistic task mix;
whether the strategy is expressible on every provider under consideration, or pins the router;
invalidation correctness — a stale cached Constitution is a governance failure, not a performance
issue; whether it satisfies §Context Management or requires an amendment; latency effect; the
break-even invocation count.

**Experiment or prototype needed.** A **corpus and churn analysis first**, entirely offline:
measure the mandatory reading list, and compute the actual change rate per document from git
history. That alone may settle it. Then, per provider, a small measured comparison of the same
task with and without caching, reporting cost and latency deltas — dependent on R-07 and carrying
real cost.

**Risks.** Optimizing cost before any real invocation exists to optimize. Cached governance going
stale and an agent operating under a superseded Constitution — the highest-consequence risk here
and it is a correctness risk, not a cost one. Provider caching semantics changing. Designing
around one provider's minimum cacheable size.

**Expected output.** A corpus-and-churn analysis, a per-provider caching-mechanism comparison, a
recommended segmentation with an explicit invalidation rule, and a break-even calculation. Feeds
R-09 and R-17.

**Decision authority.** Lead Software Engineer (Technical Decision). Director of Operations owns
any reconciliation with `AGENTS.md` §Required Startup Procedure or with STANDARD-014 §Context
Management — **changing what an agent is required to read is a governance decision, not an
optimization.** Founder approval if the mandatory reading list changes.

**Coordination — the Context Lifecycle Manager specification now exists and it has already
defined this item's output shape.** `CONTEXT_LIFECYCLE_MANAGER_SPEC.md` v1.1.0 cites **R-13 by
name and by rank**, agrees with its premise — prompt-caching mechanisms, minimum cacheable sizes,
TTLs, tokenizer boundaries, and invalidation semantics *"are not equivalent across providers"* —
and resolves the resulting lock-in tension normatively. **This substantially de-risks R-13 and
narrows it from an open design question to a population exercise.**

**CLM-D16 (profile-as-data)** is the constraint and the deliverable. Provider-specific
optimization enters the CLM *"**only** as a `ProviderContextProfile` **data record**, resolved at
runtime through the P-4 `ModelResolver` port,"* with *"zero provider names, model names, or
provider conditionals in code, tests, or policy records."* The record already declares the fields
this research must fill per provider — `contextLimitTokens`, `reservedOutputTokens`,
`tokenizerFingerprint`, and a `caching` block carrying `supported`, `minCacheableTokens`, `ttlMs`,
`invalidatesOnPrefixChange`, plus `cachedTokensOccupyWindow` and `costPerCachedInputTokenBp`.

**Three consequences.**

1. **R-13's deliverable is now concrete: one populated `ProviderContextProfile` per candidate
   provider, sourced and dated.** That is a better-specified output than the first draft's
   "segmentation recommendation", and it is inherently provider-neutral because the record is
   opaque by construction — `profileId` is *"opaque; NOT a provider name."*
2. **Do not design context measurement here.** The CLM owns the signal set, dimension set, band
   names and semantics, scoring function shape, and floor conditions (**CLM-S9**). 1F **I-5**
   accordingly reduces 1F-5 to rendering.
3. **Do not set the numbers.** Per **CLM-S9/S10** and governance **P-7**, weights, thresholds,
   floor values, budgets, and sampling interval are Founder/Governance policy; the CLM ships them
   `provisional: true`. R-13 recommends and evidences; it does not decide. See **E-5**.

The formerly-unowned UX **Q4** is answered for the vocabulary and **still open for the numbers**,
now tracked as CLM **OQ-C2** and governance **P-7**.

---

### R-14 — Mobile PWA notification path

**Decision question.** How does the Founder receive and act on an escalation away from a desktop
— installable PWA with Web Push, a native push service, email or messaging integration, or polling
— and what is the minimum trustworthy action surface on a phone: notify only, or notify and
resolve?

**Why the decision matters.** Escalations exist precisely because automation is exhausted and a
human decision is required (ADR-0002 E2). The resolution verbs are `revise`, `abandon`, and
`accept`, and until one is chosen the task sits in `needs_revision` and the work stops. **Founder
response latency is therefore a direct throughput constraint on the entire system**, and it is
currently unbounded because there is no notification path of any kind. Nothing in the repository
notifies anyone of anything. The counterweight: these three verbs mutate task state irreversibly,
and today they are unauthenticated POST routes. A phone-based resolution surface is a decision
surface, and it inherits every requirement from R-03.

**Roadmap capability affected.** Escalation response latency; the Sprint 1F escalation queue's
practical value; any use of Dev HQ away from the development machine.

**When the answer is needed. Rank A — before 1F-0 closes.** *Re-ranked up from C, and the
first draft's reasoning — "after 1F has built the escalation queue" — was simply wrong.* Plan
anchor: 1F §2.5 puts an **installable, push-capable PWA** in scope as **1F-9** (shell) and
**1F-10** (Web Push), with **D-6** (web-push dependency) and **D-7** (hosting plus HTTPS,
which Web Push requires) as Founder dependencies. The plan's primary user journey **J-1** is
*"Overnight decision, from a notification"* — notification is not an add-on to 1F, it is 1F's
headline journey.

Two plan constraints narrow this item's alternatives: 1F §3.3 puts **email, SMS, and Slack
out of scope — Web Push only**, which removes alternatives 3 and 4 as first drafted; and 1F is
**offline-readable, not offline-actionable** (§13), so queued-approval-sync is out. The
notify-only versus notify-and-resolve question remains live and is exactly what §2.5's *"fast
Founder approval flows… with an explicit confirmation step for irreversible actions"* is
trading against.

**Primary sources required.** W3C Push API and Notifications API specifications; MDN's PWA and
Web Push documentation, read for current cross-platform support — **iOS Safari's Web Push support
and its installation requirements are the decisive constraint and must be verified against current
documentation, not recalled.** Next.js 16 PWA and manifest documentation. Documentation for any
push service actually evaluated. `WCAG` guidance on notification and interruption patterns.

**Repository facts required.**
- **No PWA scaffolding exists.** `public/` contains five SVGs (`file`, `globe`, `next`, `vercel`,
  `window`) — no manifest, no icons, no service worker. `app/layout.tsx` metadata carries only
  `title` and `description`.
- `app/api/dev-hq/escalations/[id]/{revise,abandon,accept}/route.ts` — the three resolution routes,
  currently unauthenticated.
- ADR-0002 E2 / D-E1 — resolution semantics: `revise` resets the review counter to zero and grants
  a fresh 3-attempt budget; `abandon` rejects the task; `accept` completes it. **All three are
  consequential and none is reversible by re-POSTing.**
- `SPRINT_1E_COMPLETION_NOTES.md` §4 (NB-1) — a **replayed** `accept`/`abandon` already overwrites
  newer task state, and is listed as needing to land before non-developer use. Mobile networks
  produce exactly the duplicate-submission conditions NB-1 describes; this item must not proceed
  before NB-1 is fixed.
- ADR-0002 E2 §PE-3 — the recorded recommendation to render `Review.escalationReason` alongside
  `origin`, because the queue would otherwise conflate *"the reviewer kept rejecting the work"*
  with *"the reviewer never answered."* A notification that conflates them is worse than the queue
  doing so.
- `standards/ACCESSIBILITY_STANDARD.md`; `lib/mission-control/pending-dispatch.ts` — an existing
  session-storage pattern for carrying intent across failures, directly relevant to unreliable
  mobile networks.

**Alternatives to compare.** *Substantially narrowed by the plans — three of the five original
alternatives are now closed, and the research should not reopen them.*

- ~~Email notification with deep links~~ and ~~messaging-platform integration~~ — **closed.**
  1F §3.3 puts email, SMS, and Slack out of scope: **Web Push only.**
- ~~Installable PWA with Web Push, **notify and resolve from the notification**~~ — **closed by
  design.** UX handoff **RB-5** sets a hard constraint: push payloads *"carry subject + record id
  and deep-link only; **no actionable push buttons**, because a notification action bypasses
  confirmation and the freshness check."* The UX specification owns this under ORG-001
  §Department Boundaries, so it is a design decision already made, not an open trade-off.

What remains genuinely open:

1. **Notify → deep-link → resolve in-app on the phone** (the RB-5-compliant form of the original
   alternative 1). This is the live default and what journey J-1 describes.
2. **Notify → deep-link → resolve on desktop only**, with the phone read-only for consequential
   verbs. UX **Q8** asks the Founder exactly this: *"Is the mobile quick-action set acceptable, or
   should escalation resolution be desktop-only?"*
3. **No push; the Founder checks the queue** — the honest baseline, and the fallback if platform
   support fails.
4. **Notification policy scope**: which transitions notify at all. 1F risk **R-11** narrows the
   recommendation to *"Founder-actionable transitions (new escalation, new actionable approval)"*
   with everything else in-app only, Founder-configurable.

**Evaluation criteria.** Cross-platform support on the Founder's actual device — iOS Safari Web
Push and its installation requirement remains the decisive constraint and must be verified against
current documentation; delivery reliability and latency; **whether a resolution can be issued
safely from a phone given NB-1**, which 1F risk **R-10** rates *high likelihood* once fast flows
ship (*"Duplicate POSTs are likely, not rare, and the defect re-applies superseded decisions"*) —
this is why 1F-7 is sequenced before 1F-13; whether the notification carries enough context to
decide — origin *and* `escalationReason` per PE-3 — or merely prompts a context switch;
**notification fatigue** (1F **R-11**: notifying on everything *"trains the Founder to ignore the
channel that J-1 depends on"*); authentication inherited from R-03; accessibility; operational
cost. Note that a **separate event stream** is likely required — 1F **Q-8** recommends it, because
delivery receipts written into the 200-capped audit `Event` stream would evict execution history.

**Experiment or prototype needed.** Confirm current Web Push support on the Founder's actual
device and OS version from primary documentation. Then a **notification content design exercise**:
draft the exact payload for each of the four escalation origins the system can raise
(`retry_exhausted`, `review_exhausted`, and the `reviewer_unresponsive` case PE-3 identifies as
misrepresented by `origin` alone) and check each is decidable from the notification alone. A
throwaway service-worker spike only after R-03 and R-08 resolve.

**Risks.** Building a mobile action surface over unauthenticated routes — unacceptable, and the
reason this is ranked after R-03. Enabling one-tap irreversible decisions before NB-1 is fixed.
Notification fatigue turning escalations into noise, which would defeat the purpose. iOS Web Push
constraints may rule out alternative 1 entirely; the item must be allowed to conclude that.

**Expected output.** A platform-support finding for the Founder's actual device, an alternatives
comparison, notification payload drafts per escalation origin, and an explicit prerequisite list
(R-03, R-08, NB-1) with the reasoning for each.

**Decision authority.** **Founder** owns the product decision, now with a specific open question
waiting on them: UX **Q8** — mobile quick-action set acceptable, or escalation resolution
desktop-only? Only the Founder can weigh convenience against the irreversibility of
revise/abandon/accept. **Claude Design owns the interaction and notification design and has
already exercised that authority** (RB-5's no-actionable-buttons rule, and the §9.6 payload
shape) — under ORG-001 §Product and Experience and AGENT-001 §Department Boundaries that is
Design's call, and this research must treat it as a given, not a variable. Lead Software Engineer
owns the mechanism (1F-9, 1F-10) and the transport question (1F **Q-7**, SSE with polling
fallback). Security Engineer reviews the mobile action surface. **Founder approval is separately
required** for the web-push dependency (1F **Q-9** / **D-6**) and for hosting plus HTTPS
(**D-7**), neither of which exists today.

---

## Group 4 — Hosting economics, independence, retrieval, knowledge, and agent tooling

*Contains R-15 (rank D), R-16 (D), R-17 (B), R-18 (C), R-19 (C), R-20 (D), R-21 (D), R-22 (B).*

---

### R-15 — Local model hosting viability

**Decision question.** Can locally hosted open-weight models perform any Dev HQ work class at
acceptable quality, and if so which classes — and what does hosting cost in hardware, operational
burden, and latency compared with the API providers?

**Why the decision matters.** Local hosting is the strongest available lever on three of §2's
dimensions simultaneously: cost (marginal cost approaches zero), policy (no data leaves the
machine), and independence (a genuinely different lineage from all three API providers). It is also
the only path that removes the per-token budget pressure that R-17 exists to manage. Against that:
it introduces hardware, operational, and quality risk, and Dev HQ currently runs on a single
developer machine that also runs the Next.js server, the Trigger.dev worker, and the test suite.
Whether the capability floor is high enough for *any* Dev HQ work class is an open empirical
question, not a matter of principle.

**Roadmap capability affected.** R-09 routing options; R-17 cost enforcement; R-24 (Hermes, which
depends on this being viable); the policy dimension for any sensitive work class.

**When the answer is needed. Rank D — before Phase 2.** Plan anchor: **2H-1**, the
provider/model/version registry. It must be a candidate there, or it is excluded by default
rather than by evidence — and PLAN-P2-001 §0.4 is explicit that binding records apply *"to
Hermes and to every other model, current or future, without exception,"* which presumes
open-weight models are candidates at all.

**Primary sources required.** Documentation for each serving runtime evaluated — model support,
quantization, concurrency, OpenAI-compatible API surface, and grammar-constrained decoding (which
bears directly on R-05). Model cards and licenses for each open-weight family considered —
**license terms are a hard constraint and vary materially.** Published hardware requirement guidance
per model size and quantization level. Independent benchmark results, read with the same skepticism
applied to vendor benchmarks in R-10 through R-12.

**Repository facts required.**
- Actual available hardware — this must be established as a fact before any model size is
  considered; it is the binding constraint and it is not recorded anywhere in the repository.
- `lib/dev-hq/store.ts` — single-process memory store, and `AGENTS.md` / ADR-0001 §Decision Drivers'
  *"memory-first, no infra to run tests"* principle, which a local model host would strain.
- `trigger.config.ts` — `maxDuration: 3600`; whether a slower local model still fits the durable
  run budget.
- `types/contracts/agent-provider.ts` — the vendor-neutral port a local adapter would implement,
  unchanged.
- `data/placeholders/mission-control.ts:208,252` — `provider: "internal"` already appears twice in
  the roster; what "internal" is intended to mean is currently undefined and this item should
  define it or explicitly decline to.
- `standards/SECURITY_STANDARD.md` — the policy advantage must be stated against actual
  requirements, not assumed.

**Alternatives to compare.**
1. No local hosting; API providers only.
2. Local hosting for a narrow class only — structured extraction, summarization, classification.
3. Local hosting as a fallback tier when API providers are unavailable or over budget.
4. Local hosting for policy-sensitive work only.
5. Self-hosted open-weight models on rented infrastructure rather than local hardware — a distinct
   option with a different cost and policy profile.

**Evaluation criteria.** R-06 golden-set scores against the API providers on identical tasks — the
comparison is the point; tokens per second and total task latency on the actual hardware;
concurrency achievable while the dev server and test suite run; hardware and, for alternative 5,
rental cost amortized against measured API spend; license compatibility; operational burden
including model updates; whether the quality floor clears the bar for *any* class, which is the
gating question.

**Experiment or prototype needed.** Establish the hardware fact first. Then run the **shared R-10
harness** on locally served models — same tasks, same scoring — so the numbers are directly
comparable to R-10 through R-12. Report per work class, because the answer is very likely "yes for
extraction, no for architecture review," and a single verdict would discard that.

**Risks.** Substantial time investment for a possible "not viable" — which is a legitimate and
valuable outcome, and the item should be scoped to reach it quickly. Hardware purchase would be a
Founder spending decision. Quality shortfall being masked by measuring on easy tasks — use the same
golden set, including the hard cases. Operational burden landing on a single-developer team.

**Expected output.** A per-work-class viability report with measured comparisons on the shared
harness, a hardware and cost analysis, license findings, and a clear statement of which classes (if
any) clear the bar. Feeds R-09, R-17, and R-24.

**Decision authority.** Lead Software Engineer owns the technical assessment. **Founder owns any
hardware or infrastructure spending decision** (Strategic Decision, GOV-001). Security Engineer
assesses the policy claim.

---

### R-16 — Reviewer independence under shared providers

**Decision question.** What does "independent review" require when the implementer and the reviewer
may be the same model, the same provider, or the same lineage — and what independence rule must
the routing engine (R-09) enforce?

**Why the decision matters.** GOV-001 is emphatic that independence is structural: *"Implementation
ownership and review authority may never rest with the same agent for the same work"* and *"A review
produced by the agent that produced the work is not a review, and does not satisfy the commit
gate."* It also contains a rule already stated in **provider** terms: *"Codex should not approve its
own unreviewed implementation when independent review is required."* But "same agent" is currently
defined by role identity, not by model identity. If routing (R-09) is free to select any provider
per role, it could route implementer and reviewer to the same model and satisfy every written rule
while producing a review with correlated blind spots. **The commit gate would still pass. That is
the failure mode.**

The repository also holds unusually good evidence on the value of genuine independence.
`VALIDATION_REPORT.md` §8 records that the multi-reviewer structure produced *"results neither
reviewer could have alone"*: independent convergence on two findings reached with no visibility into
each other's work, bidirectional correction of each other's severity and scope, and a finding (X1)
that *"exists only because of the structure."* That is measured evidence, not principle.

**Roadmap capability affected.** R-09's routing policy — this produces one of its hard constraints;
R-06's model-as-judge option; the integrity of the GOV-001 commit gate under Phase 2 real agents.

**When the answer is needed. Rank D — before Phase 2**, and before R-09 freezes its policy
language. Under simulated deterministic agents (ADR-0001 D4) the question is dormant; the
moment real models fill both roles it is live.

**The plans confirm this is a live, named obligation rather than an inference.** Candidate ADR
**#15** (2F-5) requires *"independence preservation in reviewer assignment"* and is marked
**Blocking**; candidate ADR **#17** (2G-2/3) covers *"the independence guard"* and *"when a
required reviewer may not participate"*; and 2G's MVP scope includes an *"independence guard
blocking policy-prohibited participation."* PLAN-P2-001 §2.5 chain 8 adds the mechanism
constraint this item should respect: the kill switch and exploration controller *"must exist
in the same change as the advisor, or the first bad memory is unrollbackable in practice."*
Risk **R-4** describes the self-reinforcing failure directly: *"the agent chosen because of a
lucky sample accumulates more samples… the system reports improving confidence while
calibration degrades."*

**Primary sources required.** Published research on correlated failure and self-preference bias in
model-as-judge evaluation — the phenomenon must be characterized from literature, not asserted.
Each provider's model-lineage documentation, to the extent published, for reasoning about what
"different lineage" actually means. Assurance and audit-independence standards from outside
software (financial audit independence frameworks are the mature analogue) for the definitional
framing.

**Repository facts required.**
- `docs/company/GOVERNANCE.md` §Separation of Implementation and Review — the full rule set,
  including the read-only Architecture Reviewer constraint and the prohibition on a reviewer editing
  the work under review.
- GOV-001 §Role Boundaries — the Codex sentence, the existing provider-level independence rule.
- GOV-001 §Separation of Code Review and Architecture Review — *"A pass from one is not a pass from
  the other"*; the two-reviewer structure whose value this item quantifies.
- `docs/validation/.../VALIDATION_REPORT.md` §8 — the recorded evidence of what independence
  produced, including the specific convergences (F9 = AR2-3, F10 = the `eventKeys` observation) and
  corrections.
- `SPRINT_1E_COMPLETION_NOTES.md` §5 §"No contradictions" — the two reviews agreed on every
  overlapping point, which is the *other* datum: independence that produces agreement is evidence of
  correctness, and this item must be able to distinguish that from correlated error.
- `docs/company/ORGANIZATION.md` — the current role/provider assignments, which happen to give
  implementer and reviewer different providers today. **That is currently a coincidence of the table,
  not an enforced rule.**
- ADR-0001 D4 — why the question is dormant today.

**Alternatives to compare.**
1. No independence rule; rely on role separation alone (the status quo, made explicit).
2. Different provider required between implementer and reviewer for the same work.
3. Different model family required, same provider permitted.
4. Different lineage required — stricter, and harder to define precisely.
5. Human review required at the gate where independence cannot be established.
6. N-of-M agreement across deliberately diverse reviewers, extending the structure that already
   produced results in the overnight validation.

**Evaluation criteria.** Whether the rule is **mechanically checkable by the router** — an
independence rule the engine cannot evaluate is not a control; whether it detects correlated
findings in the historical record; cost, since diversity means using more than the cheapest
provider; whether it survives a provider becoming unavailable (does the gate block, or degrade?);
whether it is expressible in GOV-001's existing vocabulary or requires an amendment.

**Experiment or prototype needed.** A **retrospective correlation study** on the Sprint 1E record:
take the findings from CR-1E and AR-1E, and characterize which were reached independently, which
converged, and which each missed. Then re-run a subset of the same review tasks with implementer and
reviewer on the *same* model, and compare finding overlap and miss rate against the cross-provider
baseline. This is one of the few experiments in this backlog with a ready-made control group.

**Risks.** Over-constraining routing to the point where the cheapest or most capable provider is
unusable for review work, which is a real cost the Founder must weigh. Under-constraining and
producing a commit gate that passes on correlated blind spots — the more dangerous error, because it
is silent. Defining "lineage" so loosely the rule is unenforceable, or so strictly it is unsatisfiable.

**And one risk the plans discovered that this item did not anticipate: the separation may not be
satisfiable *at all* right now, for reasons that have nothing to do with providers.**
`WORKFLOW_DIAGNOSIS.md` §4c records that **four consecutive freshly-spawned agents across two
types**, each asked to author an implementation specification, delivered nothing, while two
long-lived reviewer agents delivered nine. Root cause **UNKNOWN**. PLAN-P2-001 escalates it as
**C-6** — *"the most serious operational finding in this handoff"* — because *"every stage requires
an implementation owner distinct from its reviewers"* and designer ≠ reviewer separation
*"cannot currently be satisfied as specified."* It reaches the Founder as **NEW-5** and as **Q-8**,
which asks bluntly whether *any* Phase 2 stage can be staffed with an implementation owner
independent of its reviewers today.

**This bears directly on R-16 and enlarges it.** This item was scoped to provider-level
independence — do not route implementer and reviewer to the same model. The diagnosis exposes a
second, more immediate independence failure mode: **a separation that exists on paper and collapses
in execution**, where the coordinator ends up authoring the work and the review is described as
independent anyway. The diagnosis §6 item 2 and PLAN-P2-001 both refuse that workaround explicitly,
and this research must not propose it either. Any independence rule this item produces should be
checkable against *what actually happened*, not against *how the roles were assigned* — which is
also the strongest argument for the retrospective correlation study below.

**Expected output.** A definition of independence that a router can mechanically evaluate; the
retrospective correlation study; a recommended rule with its cost; and a proposed GOV-001 amendment
if the existing vocabulary cannot express it. It should also state **how independence is verified
after the fact**, not only assigned in advance — the C-6 finding is that assignment alone does not
establish it. Feeds R-09 as a hard constraint.

**Decision authority.** **Director of Operations owns the governance rule** (GOV-001 is an
Operations document) with **Founder approval**, since it constrains product and spending. Lead
Software Engineer owns enforceability in the router. Architecture Reviewer and Independent Code
Reviewer should both be consulted — the rule governs their own roles, though neither may set it.

**The governance workstream has adopted this item as a Founder-decision item in its own register.**
`GOVERNANCE_UPDATE_PLAN.md` §2.2 lists **P-4 — "Reviewer independence under shared providers
(R-16)"**, required before Phase 2, authority **Founder**, with a one-line statement of the failure
mode that is sharper than this item's own: ***"Role-identity independence passes while model identity
collapses."*** Its **G-1** consolidation records four independent sources for the surrounding
question — this item, `WORKFLOW_DIAGNOSIS` §4c/§6, Phase 2 C-6/NEW-5/Q-8, and its own CC-08/15/16 —
and notes that **B-1** is now the live near-term form of it: *"Decide who reviews a candidate both
reviewers helped author — a third reviewer instance, or a recorded Exception with disclosure,"*
required **before Sprint 1F implementation**, because *"the patch exists and is apply-ready; the only
thing between it and the commit gate is who may certify it."*

**Five Founder decisions in PLAN-P2-001 §14 turn on this item's output**, four of them flagged
Reserved specifically for independence: **D-2A-4** (may a team lead also be the integration owner;
may a lead reviewer reconcile a candidate a teammate implemented); **D-2G-2** (*"Which reviewer
roles are barred from collaboration sessions on candidates they will review"* — Reserved
(independence)); **D-2F-1** (whether memory-informed routing is enabled at all); **D-2F-4**
(whether experience earned in one project may inform routing in another — which is the
independence question crossed with R-04's isolation boundary); and **NEW-5** (how Phase 2 is
staffed given C-6). `WORKFLOW_DIAGNOSIS.md` §6 item 4 — *"Designer and reviewer must be different
agents"* — is already a **standing workflow correction** that PLAN-P2-001 §17.3 records itself as
adopting, so the principle is settled; what is unsettled is whether it can be honored in practice
and how a router proves it was.

---

### R-17 — Cost and budget enforcement

**Decision question.** Where is the spending ceiling enforced — per execution, per task, per
project, per sprint, or globally — what happens when it is reached (block, degrade to a cheaper
model, escalate to the Founder, or warn only), and who may raise it?

**Why the decision matters.** Every bounded loop in the system is bounded by *attempts*, not by
*cost*. ADR-0002 E6 caps execution retries at 3 and review iterations at 3, and the two compose: a
review-driven revision creates a new execution with a **fresh 3-attempt budget**. Under simulated
agents that composition is free. Under real models, the worst case is 3 review iterations × 3
execution attempts = **9 model invocations for one task**, plus the review calls themselves, before
anything escalates. The system was deliberately designed so that *"Both loops are hard-capped and
terminate in founder escalation after exhaustion rather than looping indefinitely"* — the same
discipline now needs a currency denomination. `STANDARD-014` requires cost monitoring and
cost-awareness in review; it defines no enforcement mechanism.

**Roadmap capability affected.** Phase 2 real agents; R-09's cost-tiered routing; R-13's caching
justification; the practical viability of R-06 and R-21, both of which consume tokens at volume.

**When the answer is needed. Rank B — during Sprint 1F for the record and visibility half;
before Phase 2 for enforcement.** *Re-ranked up from D, because 1F surfaces cost.* Plan
anchor: 1F §2.4 puts **cost and budget visibility** — *"spend per execution/task/project,
against a budget, with a threshold state"* — in scope as **1F-4**/**1F-17** under **Q-4** and
**D-5**, and the plan records VERIFIED that *"there is no cost field, no budget entity"*
anywhere in `types/domain/`. A budget entity introduced in 1F fixes what enforcement can later
key on, so the enforcement design should be understood before the 1F record shape is frozen —
even though enforcement itself lands later, at **2A-3** (organization budgets and the
concurrency governor) and **2H** (cost/latency/reliability telemetry per binding).

The offline worst-case cost model described below needs no credentials and should be produced
**first**, since it is what tells the Founder whether the exposure justifies any machinery at
all.

**Primary sources required.** Each provider's billing, usage-limit, and spend-cap documentation —
organization-level caps, per-key limits, and usage-alert mechanisms differ, and a provider-side cap
is a materially different control from an application-side one. Trigger.dev's usage and concurrency
limit documentation. Each provider's current pricing, fetched at research time.

**Repository facts required.**
- `lib/dev-hq/constants.ts` — `MAX_EXECUTION_ATTEMPTS = 3`, `MAX_REVIEW_ITERATIONS = 3`,
  `MAX_REVIEW_DISPATCH_ATTEMPTS = 3`: the three existing budgets, all denominated in attempts.
- ADR-0002 E6 — the composition rule granting a fresh retry budget per revision, and the resulting
  worst case.
- ADR-0002 E2 — the escalation mechanism that already exists and could carry a budget-exhaustion
  origin, which would be additive rather than a new concept.
- `types/domain/escalation.ts` — the `origin` union (`retry_exhausted | review_exhausted`) that a
  budget origin would extend.
- R-01's output — enforcement requires recorded per-run cost; this item is blocked without it.
- ADR-0002 E4 — **Evidence *"never drives control flow"***, so if cost lives on evidence records it
  cannot gate anything. This is a real constraint on R-01's answer and must be resolved jointly.
- `trigger.config.ts` — `maxDuration: 3600` and `maxAttempts: 3`, the platform-side bounds already
  in place.
- `SPRINT_1E_COMPLETION_NOTES.md` §7 item 10 — the sweep already risks exceeding its 50-second TTL
  at scale, *"after which recovery silently stops running."* A cost control that fails silently would
  repeat that pattern; this item should explicitly avoid it.

**Alternatives to compare.**
1. Provider-side spend caps only.
2. Application-side pre-flight estimation with a hard block.
3. Post-hoc accounting with alerting, no block.
4. Budget as a first-class bounded loop alongside retries and review iterations, terminating in an
   escalation with a new `origin` — the option most consistent with the existing architecture.
5. Tiered degradation: fall back to a cheaper model when the budget nears exhaustion (couples to
   R-09).

**Evaluation criteria.** Whether the control can fail *loudly* — silence is the failure mode the
repository has already recorded twice (the sweep TTL, and AR2-1's missing event); whether it composes
with the existing bounded loops without conflating counters, which ADR-0002 E6 explicitly forbids;
whether it works when the cost of a call is only known after the call; granularity of attribution
(per project, per role, per task); whether a budget escalation is actionable by the Founder or merely
informational; enforcement latency.

**Experiment or prototype needed.** A **worst-case cost model, entirely offline**: take three real
task shapes from the Sprint 1E record — a clean pass, a 3-attempt exhaustion, and a full 3-iteration
review loop with revisions — and compute the token and cost envelope of each under each provider's
current pricing. That establishes whether the exposure is measured in cents or in hundreds of dollars,
which determines how much enforcement machinery is warranted. **Do this before designing any
mechanism.**

**Risks.** Building enforcement machinery for an exposure that turns out to be trivial — the cost
model exists to prevent that. Conversely, discovering the exposure only after an incident. A hard
block that strands work in a non-terminal state, which is the exact defect class X1 already
documented. Cost estimates going stale as pricing changes.

**Expected output.** A worst-case cost model per task shape and provider; an alternatives comparison;
a recommended enforcement point and failure behavior; and, if alternative 4 is favored, a proposed
escalation origin. Feeds R-09 and a Lead Software Engineer ADR proposal.

**Decision authority.** **Founder owns the budget itself** — spending is a Strategic Decision under
GOV-001, and the ceiling value is not a technical parameter. Lead Software Engineer owns the
enforcement mechanism. Architecture Reviewer **mandatory** if a new bounded loop or escalation origin
is introduced (lifecycle and terminal-state change).

**Ownership of cost instrumentation is unassigned, and that must be fixed before the work starts.**
The UX specification records it as an open question — **RB-1**, *"Cost/spend instrumentation
ownership is unassigned"*, and Q5: *"Who owns cost instrumentation, and in which phase?"*, routed to
Founder / Director of Operations — while naming this backlog as a candidate owner. Downstream
Founder decisions: 1F **Q-4** (build plumbing, render honest absence), **D-2H-1** (spend ceilings per
provider), **D-2A-1** (global and per-project concurrency ceilings, *"Reserved (budget/capacity)"*),
and **D-2B-2** (per-project budget allocation).

**Two design constraints already fixed elsewhere.** The UX specification prohibits the UI hardcoding
prices (§13.6) and requires burn rate and projected spend to render as **projections** — dashed,
italic, `≈`, never coloured, *"never in the headline tile, never used to trigger a notification."*
And 1F **AC-19** makes a plausible-looking placeholder a **failure**, which rules out the seeded
simulated cost model outright. The most founder-relevant number the UX names is one this item should
adopt as a first-class output: **cost of repetition** — *"how much was spent on attempts and review
iterations that were later superseded… the number that makes a retry budget a business decision
instead of a technical constant"* — plus per-decision sunk cost shown on the Revise/Accept/Abandon
surface, since *"revise" authorizes new spend.*

---

### R-18 — Repository indexing

**Decision question.** How does an agent locate relevant code and documentation in a repository too
large to read entirely — grep-style search, a symbol index, an embedding index, a language-server
index, or a curated map — and is the index maintained, rebuilt on demand, or unnecessary at Savrio's
current scale?

**Why the decision matters.** This repository is currently ~146 TypeScript source files and 20
documentation files under `docs/`, plus 17 standards and 10 handbooks. That is small enough that
search may genuinely be sufficient, and an index would be unwarranted complexity. But `Project`
already carries `repository` and `defaultBranch`, and the placeholder roster names
`savrio/platform` — a repository Dev HQ does not contain and whose size is unknown. Phase 2 agents
performing implementation and review on that codebase face a different problem than agents working
on Dev HQ itself. **The honest form of this question is "at what size does search stop working," not
"which index should we build."**

**Roadmap capability affected.** Phase 2 implementation and review agents; vector search (R-19) and
knowledge stores (R-20), which share infrastructure with any answer here; context caching (R-13),
whose retrieval alternative depends on it.

**When the answer is needed. Rank C — before Sprint 1H.** *Re-ranked up from D.* Plan anchor:
**Sprint 1H is Repository Intelligence + Context Router**, listed in Phase 2 precondition
**P-5**, which also requires it to ship *"foundation hooks for later Company Knowledge Platform
retrieval."* This item is therefore not speculative groundwork for Phase 2 — it is the research
that defines a named Phase 1 sprint. The threshold question below ("at what repository size does
search stop working?") should be answered before 1H is planned, because it determines whether 1H
builds an index or a map.

**Primary sources required.** Documentation for each indexing approach evaluated — language server
protocol and index formats, tree-sitter-based symbol extraction, and any code-search tooling
considered. Published guidance on retrieval for code, read for the specific finding that code
retrieval behaves differently from prose retrieval. Each provider's context-window documentation
(R-10 through R-12), since a large-enough window changes the answer materially.

**Repository facts required.**
- Actual repository size: 146 `.ts`/`.tsx` files across `lib`, `types`, `app`, `trigger`,
  `components`; 20 Markdown files under `docs/`; 17 standards; 10 handbooks; 20 agent directories.
- `types/domain/project.ts` — `repository` and `defaultBranch` fields, and
  `data/placeholders/mission-control.ts:41-60` — `savrio/platform`, the external repository whose
  scale is the real unknown.
- `AGENTS.md` §Repository Conduct — *"Inspect existing conventions before editing"* — a stated
  obligation that presumes the agent can find those conventions.
- `AGENTS.md` §Required Startup Procedure step 7 — *"Inspect relevant existing work before proposing
  or making changes"* — the same obligation, and the functional requirement this item serves.
- ADR-0002 E8 — `Project` sits at the top of the target hierarchy, so per-project indexing composes
  with R-04.
- `.gitignore` and `.gitattributes` — what is excluded, which bounds what any index would cover.

**Alternatives to compare.**
1. No index; rely on search and directory conventions (the status quo — and possibly correct).
2. Symbol index built from the TypeScript compiler or tree-sitter.
3. Embedding index over code chunks (couples to R-19).
4. Curated repository map maintained as documentation — cheap, human-readable, and it degrades
   gracefully.
5. Hybrid: curated map plus search, with an index only above a measured size threshold.

**Evaluation criteria.** Measured retrieval quality on real tasks — can the agent find the code it
needed for the Sprint 1E findings; index freshness and rebuild cost against commit frequency;
whether it works on `savrio/platform` without Dev HQ containing it; token cost of the retrieved
context; maintenance burden; **and the threshold question: at what repository size does the status
quo actually fail?**

**Experiment or prototype needed.** A **retrieval-quality test built from the record**: take fifteen
findings from CR-001, AR-001, CR-1E, and AR-1E, each of which cites an exact file and line. For each,
give an agent only the finding's description and measure whether it locates the cited location under
each alternative. The correct answers are already recorded — this is a ready-made benchmark and
should be used rather than a synthetic one.

**Risks.** Building an index for a repository small enough not to need one; the threshold question
guards against this and should be answered first. Index staleness producing confidently wrong
retrieval. Underestimating `savrio/platform` because it is not in front of us. Coupling to R-19 before
R-19 has established that embeddings are warranted.

**Expected output.** A measured retrieval-quality comparison on the fifteen-finding benchmark, a
size-threshold finding, and a recommendation that is explicitly permitted to be "no index needed at
current scale, revisit at N files."

**Decision authority.** Lead Software Engineer (Technical Decision). Founder approval if it requires
a new paid service or major dependency. Sprint 1H is the owning sprint and has no plan yet, so this
research is an input to writing that plan rather than to executing it.

**One adjacent gap this item should flag rather than absorb.** PLAN-P2-001 **C-10** records that
ADR-0001 **O3** freezes ten capabilities for Phase 1 and defers a department-mapped taxonomy to
Phase 2, that 2A staffing and 2F task classes both need the fuller taxonomy, and that its expansion
*"needs an owner; currently unassigned."* Repository indexing and capability taxonomy are different
questions, but both are about how work is described well enough to be routed and retrieved, and an
unowned taxonomy will surface here first.

---

### R-19 — Vector search

**Decision question.** Does Dev HQ need semantic vector search at all — and if so, over what corpus
(code, governance documents, execution history, evidence records), with what embedding model, in
what store, and how is the index kept consistent with append-only source records?

**Why the decision matters.** Vector search is the default reflex for "agent needs to find things,"
and it is frequently the wrong answer at small scale, where it adds an embedding dependency, an
index to maintain, and a new consistency problem in exchange for retrieval that grep already
provides. But there is one corpus here where semantic retrieval has a genuine advantage: the
governance corpus. Finding *"the rule that governs whether a deferred item may be reported as a
defect"* is a semantic query, and the answer (GOV-001 §Scope Enforcement at Review) is not reachable
by keyword unless the querier already knows the words. Whether that advantage justifies the
machinery is the actual question.

There is also a hard constraint from the existing architecture: ADR-0002 E4 makes evidence
**append-only and immutable**, and E5 makes the timeline immutable. An index over immutable records
is the easy case — no invalidation. An index over the governance corpus, which changes, is not.

**Roadmap capability affected.** Knowledge stores (R-20); repository indexing (R-18); research agents
(R-21); the retrieval alternative in R-13.

**When the answer is needed. Rank C — before Sprint 1H**, and only if R-18 or R-20 establishes
a retrieval need that lexical search cannot meet. **This item may legitimately conclude "not
needed."** Plan anchor: 1H must ship *"foundation hooks for later Company Knowledge Platform
retrieval"* (**P-5**), and **2C-3** later wires retrieval into the Context Router, with
*"semantic retrieval with measured precision"* named as 2C mature scope. The hooks are the
1H-dated part; whether anything semantic sits behind them is the 2C-dated part. Deciding the
hook shape without deciding the mechanism is legitimate and is probably the right outcome.

**Primary sources required.** Documentation for each vector store evaluated — including
`pgvector`, given that Supabase is already the deferred persistence direction under ADR-0002 E9, so
adopting a separate vector store would add a second data system. Embedding model documentation and
pricing from each provider under consideration. Published guidance on hybrid (lexical + semantic)
retrieval, read for the specific finding that hybrid usually beats pure semantic on technical corpora.

**Repository facts required.**
- ADR-0002 E9 / D-E5 — persistence is deferred and **gated on explicit Founder approval to install
  `@supabase/supabase-js` and apply migrations.** A vector store is a persistence decision and
  inherits that gate.
- `lib/dev-hq/store.ts` — memory-only, non-durable; there is nowhere to put an index today.
- ADR-0002 E4 and E5 — immutability of evidence and timeline, which makes those corpora index-friendly.
- The governance corpus inventory from R-13 — the same documents, here as a retrieval target rather
  than a cached prefix. **R-13 and R-19 are two answers to one question and must be evaluated
  together, not separately.**
- R-18's threshold finding — if search suffices for code, the case narrows to governance and history.
- `package.json` — no vector, embedding, or database dependency is installed.

**Alternatives to compare.**
1. No vector search; lexical search plus structure (the status quo).
2. `pgvector` inside the eventual Supabase persistence layer — one data system, not two.
3. A dedicated vector database.
4. In-memory embeddings computed at startup over a small corpus — viable precisely because the
   governance corpus is small and this needs no new infrastructure.
5. Hybrid lexical + semantic.

**Evaluation criteria.** Measured retrieval quality against lexical search on a real query set —
if it does not beat grep, it fails; whether it adds a data system beyond the already-deferred
Supabase decision; index consistency cost against corpus churn (from R-13's git-history analysis);
embedding cost and whether embeddings must be recomputed on model change; whether the corpus is
small enough for alternative 4 to be sufficient.

**Experiment or prototype needed.** A **governance query set**: twenty questions of the form an agent
would actually ask during the `AGENTS.md` §Required Startup Procedure — "which document governs X,"
"what is the rule for Y" — with the correct source section recorded for each, drawn from the ADRs,
GOV-001, and the standards. Then measure lexical search against each alternative. **Build the query
set before choosing any technology**; it is the only thing that can produce a falsifiable answer.

**Risks.** Adopting vector search because it is expected rather than because it measured better —
this is the primary risk and the query set exists to counter it. Adding a second data system ahead of
the deferred persistence decision, which would pre-empt a Founder-gated choice. Embedding the
governance corpus and serving stale rules after an amendment — a correctness risk, as in R-13.

**Expected output.** A measured comparison on the twenty-question governance query set, an explicit
verdict on whether semantic retrieval beats lexical for this corpus, and — if yes — a recommendation
that respects the ADR-0002 E9 persistence gate. **"Not needed" is an acceptable and likely outcome.**

**Decision authority.** Lead Software Engineer (Technical Decision). Database Architect consulted on
any store choice. **Founder approval mandatory** for a new paid service or for anything touching the
E9 persistence gate.

---

### R-20 — Knowledge store architecture

**Decision question.** What does an agent need to know that is not in the repository, where does that
knowledge live, and how does it stay accurate — specifically: decisions made in conversation,
Founder preferences, cross-sprint context, and the reasoning behind rejected alternatives?

**Why the decision matters.** The repository is already a deliberately excellent knowledge store for
governance: the Constitution, GOV-001, ORG-001, the ADRs, the standards, the handbooks, and the
completion notes. What it does not capture is everything decided outside a document. The Sprint 1E
record shows exactly this gap being caught and closed by hand: *"Before this sprint's closing work,
the Independent Code Review verdict existed only as conversation text and in no file or commit"*
(`SPRINT_1E_COMPLETION_NOTES.md` §8), and PE-4 found three agent definitions untracked such that *"the
operating definitions under which the work was produced and under which CR-001 was performed are not
reproducible from the repository."* Both were fixed manually, and both would recur. `AGENTS.md`
§Documentation Standards already requires accuracy, currency, and **"Do not create duplicate sources
of truth."** A knowledge store that duplicates the repository would violate the very standard it
serves.

**Roadmap capability affected.** Every Phase 2 agent's startup context; context caching (R-13);
vector search (R-19); Obsidian synchronization (R-23), which is one candidate answer to this question.

**When the answer is needed. Rank D — before Phase 2.** Plan anchor: **2C-1** (knowledge
service, record schema, versioning) and **2C-4** (proposal pipeline and Knowledge Curator),
with candidate ADRs **#9** (**Blocking**) and **#10**. The plans also supply most of the
schema this item was going to have to invent: 2C's MVP is *"canonical knowledge service with
the Appendix D record schema, versioning, provenance, and supersession"*, and §2.5 chain 7
fixes the ordering — the Curator must exist before 2F promotes anything, because otherwise
*"2F would promote doctrine unreviewed — explicitly prohibited."* The gap inventory below is
still the right first exercise; it now scopes an approved stage rather than testing whether
the stage is warranted.

**Primary sources required.** Largely internal. Where external: documentation for any knowledge-store
technology evaluated, and published guidance on agent memory architectures, read critically — this is
an area with more enthusiasm than evidence, and the repository's own documented practice is stronger
evidence than most of the literature.

**Repository facts required.**
- `AGENTS.md` §Documentation Standards — accuracy, currency, no duplicate sources of truth; and
  §Handoff Standards, which already specifies what a complete handoff must carry.
- `docs/company/GOVERNANCE.md` §Records — the enumerated durable record locations: product
  requirements, ADRs, task specifications, review reports, QA reports, release approvals,
  constitutional precedents, retrospectives. **This is already a knowledge-store schema.**
- `SPRINT_1E_COMPLETION_NOTES.md` §8 §"Findings durability" and §4 PE-4 — the two recorded instances
  of knowledge existing outside the repository and being retrieved by hand.
- GOV-001 §Evidence and Audit Requirements — *"Review reports are Records under this document and must
  be retained with the work they gate."*
- `templates/` — the existing templates, which encode what each record type must contain.
- ADR-0002 E4/E5 — evidence and timeline as the execution-history knowledge store that already exists.
- `agents/*/outputs/` — the existing convention for durable agent output.

**Alternatives to compare.**
1. Repository-only; every durable fact becomes a committed document (the status quo, enforced harder).
2. Repository plus a structured decision log for conversational decisions.
3. An external knowledge base synchronized with the repository (couples to R-23).
4. A queryable store over execution history and evidence, distinct from the document corpus.
5. Per-agent persistent memory files.

**Evaluation criteria.** Whether it creates a duplicate source of truth — a disqualifying criterion
under `AGENTS.md`, not a trade-off; whether it is auditable and reviewable in the way GOV-001 requires
of Records; whether it stays synchronized with the repository without manual effort, since manual
effort is what already failed twice; whether an agent can find what it needs during the mandatory
startup procedure; whether it survives the agent that wrote it being replaced by a different model
(a §2 concern — memory that only one provider can use is a routing constraint).

**Experiment or prototype needed.** A **gap inventory**: go through the Sprint 1D and 1E record and
list every fact that mattered and was *not* in a committed document at the moment it mattered. PE-4
and the CR-001 verdict are two known entries; the exercise is to find the rest. The size and nature of
that list determines whether anything beyond alternative 1 is warranted. **This is the whole item —
if the list is short, the answer is "commit more, build nothing."**

**Risks.** Building a memory system to solve a discipline problem. Creating a second source of truth
that drifts from the repository — the specific failure `AGENTS.md` prohibits. Agent memory containing
stale decisions that contradict current governance, which is the R-13 staleness risk in a more
dangerous form, since memory is trusted implicitly. Provider-specific memory formats constraining
routing.

**Expected output.** The gap inventory, an alternatives comparison against the criteria, and a
recommendation explicitly permitted to be "no new system; extend the existing record conventions."

**Decision authority.** **Director of Operations owns this** — records, handoffs, and documentation
standards are Operations' under GOV-001 and ORG-001. Lead Software Engineer owns any technical
mechanism. Founder approval for a new paid service.

---

### R-21 — Research agent capability

**Decision question.** How does a Dev HQ agent perform research requiring information outside the
repository — what tools (web search, documentation fetch, provider-native search), what source-quality
rules, what citation and verification requirements, and how is a research finding recorded as evidence?

**Why the decision matters.** The Research Analyst role exists in ORG-001, and this very backlog
depends on it: **most items here require primary sources to be fetched and verified at research time,
and this document explicitly declines to answer them from memory.** So R-21 is partly self-referential
— it is the capability that would execute this backlog. `AGENTS.md` §Research and Evidence already
sets the rules: use authoritative sources, verify time-sensitive information, distinguish
source-supported facts from inference, record limitations, *"Avoid relying on unsupported memory when
accuracy matters,"* and *"Do not fabricate citations, documentation, test output, or source findings."*
Those are strong requirements with no mechanism behind them and no way to verify compliance after the
fact.

**Roadmap capability affected.** Execution of this backlog; Phase 2 research and competitive analysis;
any agent that must check a fact against a live source (which includes every model-facing item here,
because provider facts change).

**When the answer is needed. Rank D — before Phase 2** — or earlier if the Founder wants this
backlog executed by agents rather than by hand. Plan anchor: **2I-1** (research question and
plan records, primary-source acquisition with captured citations and freshness) and **2I-3**
(sandboxed experiments), with candidate ADR **#20** — *"Research sandbox, network egress, and
citation integrity"* — which also names *"secret-leakage prevention in queries"* and *"source
licensing,"* both of which belong in this item's risk set.

**One plan note makes this immediately actionable.** PLAN-P2-001 §2.4 lists *"Research (2I
content, not 2I system)"* as parallel planning work that depends on **nothing** and is owned by
the research-analyst role. So the *content* of this backlog can be researched today by the
existing role; only the governed 2I *system* waits for Phase 2. Risk **R-10** states the cost of
inverting that: without 2C, *"the same question is researched repeatedly; contradictory findings
coexist with no supersession; citations rot."*

**Primary sources required.** Documentation for each research tool evaluated — web search APIs,
provider-native search and fetch tools, and documentation-retrieval mechanisms. Each provider's
documentation on web access and its citation behavior. Published guidance on source verification for
automated research.

**Repository facts required.**
- `AGENTS.md` §Research and Evidence — the complete rule set, quoted above; this is the specification.
- `agents/research-analyst/AGENT.md` — the role definition as it stands.
- ORG-001 §Research — responsibilities: technical research, product research, competitive analysis,
  source evaluation, evidence summaries, risk and uncertainty reporting.
- GOV-001 §Evidence and Audit Requirements — findings must cite exactly and quote the text being
  applied; *"A constraint may not be paraphrased into existence."* A research agent's citations are
  subject to this.
- ADR-0002 E4 — `Evidence` kinds are `validation | artifact | review | approval | log`. **There is no
  research kind.** Whether one is needed is a concrete sub-question with a concrete answer.
- `SPRINT_1E_COMPLETION_NOTES.md` §5 (P-3) — the Trigger.dev payload-retention question **neither
  review could resolve.** That is a live, well-specified research task with a verifiable answer, and it
  makes an ideal first test.

**Alternatives to compare.**
1. No autonomous research; the Founder or a human supplies external facts.
2. Provider-native web search within an agent turn.
3. Explicit fetch tools with a source allowlist.
4. A dedicated research agent producing a reviewed artifact, following the existing
   `agents/*/outputs/` convention.
5. Cached documentation snapshots, refreshed on a schedule — the option that best resists
   time-sensitivity problems.

**Evaluation criteria.** Citation accuracy — measured by checking cited sources actually say what is
claimed, which is the single most important criterion and the one most often skipped; source quality
discrimination (primary versus secondary versus marketing); whether time-sensitive facts are dated;
whether findings are recorded durably as evidence; **hallucinated-citation rate, measured, not
assumed**; cost per research task; whether the output satisfies GOV-001's quoting requirement.

**Experiment or prototype needed. Use P-3 as the first test.** Assign the Trigger.dev payload-retention
question, which two independent reviewers left open, and check whether the answer is correct, cited to
a real primary source, and dated. Then a broader **citation-verification harness**: assign ten research
questions whose answers are independently checkable, and verify every citation the agent produces
actually exists and supports the claim.

**Risks.** Fabricated citations, which `AGENTS.md` explicitly prohibits and which are the characteristic
failure mode of this capability — the entire evaluation should center on it. Stale information presented
as current. Research cost at volume. Prompt injection through fetched content, which is a security
concern and should route to the Security Engineer, not be treated as a quality issue. Over-trusting a
research output because it is well formatted.

**Expected output.** A measured citation-accuracy comparison, a recommended tool set with source-quality
rules, a decision on whether `Evidence` needs a research kind, and the P-3 answer as a by-product. Feeds
the execution of this backlog.

**Decision authority.** Lead Software Engineer owns the mechanism. **Director of Operations owns the
source-quality and citation rules**, as an extension of `AGENTS.md` §Research and Evidence. Security
Engineer reviews the injection surface. Founder approval for a paid search service, plus two Reserved
decisions: **D-2I-1** — *"Network egress policy for research agents; allowed source domains"*
(Reserved, security) — and **D-2I-2** — experiment sandbox budget and whether experiments may touch
any real environment. Candidate ADR **#20** covers egress, secret-leakage prevention in queries,
source licensing, and citation freshness.

**A caveat that bears on whether this backlog can be executed by agents at all.**
`WORKFLOW_DIAGNOSIS.md` §4c records four freshly-spawned agents across two types failing to deliver
an authored specification, with root cause unknown, and its §6 standing corrections require that
*"every delegated task carries an explicit terminal deliverable contract in the prompt… with silence
defined as failure"* and that *"an unresponsive specialist is recorded as a workflow failure, never
as agreement."* PLAN-P2-001 **C-6/NEW-5** escalates the same finding. Since every rank-C and rank-D
item here depends on someone actually performing research and returning it, **that delivery-reliability
question is upstream of this item's value**, and the diagnosis's one untested hypothesis — long-lived
resumed agents rather than fresh spawns — is worth testing on a low-stakes research task before
committing the backlog to agent execution.

---

### R-22 — Browser automation

**Decision question.** What browser automation capability does Dev HQ need — for QA verification of its
own UI, for agents operating web interfaces, or for both — and what is the trust boundary around an
agent driving a browser?

**Why the decision matters.** There is an unexercised capability sitting in the repository right now:
**`@playwright/test` is installed as a dev dependency, and there is no Playwright configuration and no
test file anywhere in the tree.** Meanwhile ORG-001 assigns the QA Engineer *"visual inspection"* and
*"browser behavior review,"* and `standards/ACCESSIBILITY_STANDARD.md` sets requirements — keyboard
access, screen-reader behavior, focus handling, contrast — that **cannot be verified from source code
alone**. The `AGENTS.md` §Validation Standards list includes browser testing and accessibility checks as
validation types. So the capability is required by the standards, staffed by a role, half-installed as a
dependency, and entirely unused. Additionally, `VALIDATION_REPORT.md` §2 recorded ten behavioral
categories as **unverified** for want of a runnable harness — browser-level verification is one way some
of those become checkable.

**Roadmap capability affected.** QA validation of Sprint 1F's new UI surfaces; accessibility compliance;
any Phase 2 agent that must operate a web interface; the multimodal question in R-12.

**When the answer is needed. Rank B — during Sprint 1F.** *Re-ranked up from D; the first
draft hedged here and the plan removes the need to.* Plan anchor: **1F-19** is frontend test
infrastructure, and 1F §2.6 records it as enabling work *"1F cannot avoid,"* with the binding
constraint stated VERIFIED: `vitest.config.ts` sets `environment: "node"` and
`include: ["**/*.test.ts"]`, so **`.tsx` files are not collected and no component test can run
today**; `@playwright/test` is present with no config and no e2e directory. The plan's
conclusion is blunt — *"A UI sprint with no UI test capability cannot be validated"* — and
§15.1 names this *"the binding constraint."* **1F-20** covers accessibility, and `jsdom` is one
of the three new dependencies under **D-6**.

The agent-driven halves of this item (alternatives 2 and 3) remain later and more speculative:
they attach to **2K-2** blocking gates and to 2I's egress policy under candidate ADR #20.

**Primary sources required.** Playwright documentation — test runner, accessibility testing integration,
CI execution, and trace/artifact capture. Automated accessibility engine documentation, and its own
published statement of what proportion of WCAG criteria it can detect automatically (the honest figure is
a minority, and the research must state it rather than imply full coverage). WCAG 2.2 success criteria.
Provider documentation for any computer-use or browser-control model capability evaluated, read
specifically for its security guidance.

**Repository facts required.**
- `package.json` — `@playwright/test` `^1.61.1` in `devDependencies`; **no `playwright.config.*` and no
  test file exists** — verified by repository-wide search.
- `standards/ACCESSIBILITY_STANDARD.md` and `AGENTS.md` §Accessibility and User Experience —
  *"Accessibility must not be treated as optional polish when it is applicable to the product."*
- `AGENTS.md` §Validation Standards — browser testing and accessibility checks listed as validation types.
- ORG-001 §Quality Assurance — the QA role's browser and visual responsibilities.
- `components/mission-control/*` and `components/dashboard/*` — 20+ components, none browser-tested.
- `docs/validation/.../VALIDATION_REPORT.md` §2 — the ten unverified behavioral categories and the
  explicit reason: *"These have no runnable harness."*
- `.github/workflows/ci.yml` — the existing CI job structure any browser suite would join, and its
  `main`-only trigger.
- `proxy.ts` — the app is local-only, which bounds where a browser suite can run today.

**Alternatives to compare.**
1. Playwright test suite, human-authored, agent-run — the smallest step from the dependency already
   installed.
2. Playwright driven by an agent that writes its own scenarios.
3. Model-native computer-use or browser-control capability.
4. Manual QA only.
5. Static accessibility linting with no browser at all — cheaper, and it catches a real subset.

**Evaluation criteria.** Defects found per unit of effort on the actual Mission Control surfaces;
accessibility coverage against `ACCESSIBILITY_STANDARD.md`, stated honestly as a proportion of criteria
automatable; flakiness — a flaky suite is the X2 failure mode again, certifying what it does not check;
CI cost and runtime; **security of the trust boundary** for alternatives 2 and 3, where an agent drives a
browser with real credentials; whether it makes any of the ten unverified categories checkable.

**Experiment or prototype needed.** Start with the cheapest real test: **configure Playwright and write
one accessibility check against one existing Mission Control panel.** That single exercise reveals the
setup cost, the CI cost, and whether the app is even testable in its current state — far more usefully
than a comparison document. Then evaluate agent-driven alternatives only if the manual baseline proves
worth extending.

**Risks.** Building a browser suite for a UI that Sprint 1F is about to change substantially — sequence
after 1F's surfaces stabilize, or target only stable panels. Flaky tests eroding trust in the suite,
which is worse than no suite. Agent-driven browser control with real credentials is a genuine security
surface and must not be adopted casually. Automated accessibility checking creating false confidence
about WCAG conformance.

**Expected output.** A working single-check baseline with measured setup and CI cost, an alternatives
comparison, an honest statement of automatable accessibility coverage, and a security assessment of
agent-driven browser control.

**Decision authority.** QA Engineer owns the testing approach (ORG-001 §Quality Assurance). Lead Software
Engineer owns the harness integration. Security Engineer **required** for alternatives 2 and 3. Director
of Operations owns any `ACCESSIBILITY_STANDARD.md` or CI-policy change.

**Founder decisions:** the `jsdom` DOM test environment is one of the three new dependencies needing
approval under 1F **Q-9** / **D-6**. Later, **D-2K-1** — *"The policy floor: the minimum gate set no
project may drop below"* (Reserved) — decides whether accessibility and browser checks are blocking
gates; PLAN-P2-001 lists accessibility among 2K's MVP blocking gates, so the capability researched here
is what that floor would rest on.

**Sequencing note from the 1F plan.** Risk **R-8** rates untestable UI *high impact* and its mitigation
is *"Pull 1F-19 to the front of Phase D"*; risk **R-13** warns that reviewing twelve screens at the end
*"compresses G-1/G-3/G-5 into a rubber stamp."* Both argue for answering this early in the sprint rather
than at its validation gate.

---

## Group 5 — Vault synchronization and a specific open-weight family

*Contains R-23 (rank D — raised from exploratory; see §3), R-24 (rank E — the only remaining
exploratory item).*

---

### R-23 — Obsidian synchronization

**Decision question.** Is there a durable reason to synchronize Dev HQ content with an Obsidian vault —
and if so, in which direction, over which subset, and how is the repository preserved as the single
source of truth?

**Why the decision matters.** *An earlier draft of this item said Obsidian synchronization was "not
currently justified by anything in the repository" and recommended closing it unless the Founder
confirmed a workflow. That was true of the code and of `docs/` — there is still no `.obsidian`
directory, no vault, and no wikilink convention — but it is wrong as a statement about approved
direction, and the correction runs the other way: **the vault is planned capability.***
`PHASE_2_PROGRAM_PLAN.md` makes **2C-2** *"vault sync + conflict model"* (sprint P2-11), gives it a
**Blocking** candidate ADR (**#9**), and assigns a *"Knowledge vault structure"* planning track — a
scaffold per roadmap §11 — that depends on nothing and can start now.

What makes it consequential is the shape the plan has already chosen. Dev HQ is a documentation-first
product with 50+ interlinked Markdown documents (four company documents, 17 standards, 10 handbooks,
20 agent definitions, ADRs, plans, workflows), and a vault over that corpus is genuinely useful for
graph navigation, backlinks, and mobile reading. But a vault is also the most natural way to create a
**second place where governance lives**, which `AGENTS.md` §Documentation Standards prohibits
outright (*"Do not create duplicate sources of truth"*) and which GOV-001 §Records cuts against by
naming the authoritative locations. ADR #9's own framing — *"why the vault is an interface and not
the brain"* — is the plan pre-committing against that failure. **The research question is therefore
not "should we?" but "what exactly does interface-not-brain mean field by field, and what happens when
the two disagree?"**

**Roadmap capability affected.** Phase 2 stage **2C** (Company Knowledge Platform), specifically 2C-2
vault sync and 2C-4's proposal pipeline, which is the intake path for vault-authored changes. Adjacent
to R-20, of which this is now one committed component rather than a candidate answer.

**When the answer is needed. Rank D — before Phase 2. The trigger condition stated in the first
draft is already met; there is no longer a question of whether this is wanted.** Plan anchor:
**2C-2** is *"vault sync + conflict model"* (sprint P2-11), and candidate ADR **#9** —
*"Knowledge service authority vs. Obsidian vault: which fields are service-owned vs.
human-editable; bidirectional sync conflict resolution; **why the vault is an interface and not
the brain**"* — is marked **Blocking**. PLAN-P2-001 §2.4 additionally assigns a *"Knowledge vault
structure"* planning track (vault directory scaffold per roadmap §11, empty) to the Knowledge
Curator role, dependent on nothing.

**This resolves the first draft's central doubt in the opposite direction, and the disqualifying
criterion it proposed is confirmed as the governing one.** The plan states the answer to
"single source of truth?" as a design principle — the vault is an interface, not the brain — and
2C's MVP is deliberately asymmetric: *"one-way service→vault publication plus manual
vault→service proposal intake,"* with full bidirectional sync held back to the mature version.
That is alternative 3 below, not alternative 4, and the research should start from it.

**Primary sources required.** Obsidian documentation — vault format, sync mechanisms and their pricing,
plugin API, and the wikilink versus standard-Markdown-link distinction (which determines whether one
corpus can serve both without transformation). Git-based sync plugin documentation if that route is
considered.

**Repository facts required.**
- **No Obsidian artifact exists anywhere in the repository** — verified.
- The documentation corpus inventory and its current link style — whether existing cross-document
  references are already vault-compatible is the concrete compatibility question.
- `AGENTS.md` §Documentation Standards — the duplicate-source-of-truth prohibition.
- `docs/company/GOVERNANCE.md` §Records — the authoritative record locations.
- `.gitignore` — whether a vault directory would be tracked, and `.gitattributes` for line-ending
  handling, which matters for a cross-device sync.
- `standards/DOCUMENTATION_STANDARD.md`.

**Alternatives to compare.**
1. No synchronization (the status quo).
2. Repository as the vault — point Obsidian at the existing `docs/` tree; **no synchronization at all,
   which is the option most consistent with the single-source rule.**
3. One-way export, repository → vault, read-only.
4. Two-way sync with conflict resolution.
5. Read-only published view for mobile reading, which addresses the likely underlying need without a
   vault.

**Evaluation criteria.** Whether a single source of truth is preserved — alternatives 4 and possibly 3
struggle here; whether the governance corpus stays reviewable through the normal Git and PR process
required by GOV-001; conflict behavior; cost; whether it actually improves the Founder's workflow, which
only the Founder can judge; whether it survives the repository being edited by agents concurrently.

**Experiment or prototype needed.** **Ask the Founder first** whether an Obsidian workflow exists. If yes,
the cheapest real test is alternative 2 — open the existing `docs/` tree as a vault and see what breaks.
That takes minutes and probably answers the whole item.

**Risks.** Solving a problem nobody has. Creating a second source of truth for governance, which is a
governance failure, not a tooling inconvenience. Sync conflicts corrupting a document mid-review. A paid
sync service requiring Founder approval.

**Expected output.** Either a closure note recording that no need exists, or — if the Founder confirms
one — a compatibility finding from opening the existing tree as a vault, plus a recommendation that
preserves the repository as sole source of truth.

**Decision authority.** **Founder**, via **D-2C-1** — *"Vault hosting, sync mechanism, and **whether the
vault is ever writable by agents**"* (Reserved, due at 2C-2). That third clause is the sharpest form of
the interface-not-brain question and is the one this research must equip the Founder to answer.
**D-2C-2** (*"Which knowledge classes require Founder approval to publish organization-wide"*) and
**D-2C-3** (retention and archival, delegable to Operations) follow from it.

*This is no longer "a personal workflow question" as the first draft framed it.* The Founder's own
authoring preference still matters for prioritization, but the vault's existence is committed program
scope, and Director of Operations owns the documentation-governance implication — specifically whether
the vault can ever hold a Record under GOV-001 §Records, or only a published view of one.

---

### R-24 — Hermes open-weight model family

**Decision question.** Do the Hermes open-weight models offer a capability, cost, policy, or independence
advantage for any Dev HQ work class that the API providers and other open-weight families do not?

**Why the decision matters — and an assumption that must be corrected if wrong.** **"Hermes" is
ambiguous and appears nowhere in this repository.** This item assumes it refers to the Nous Research
Hermes family of open-weight, instruction-tuned models — the reading that fits its position alongside
Claude, OpenAI, Gemini, and local models in the requested research areas. **The alternative reading is
the Hermes JavaScript engine used by React Native**, which would be a mobile-runtime question rather
than a model question. That reading is judged less likely, because the mobile direction in this backlog
is a PWA (R-14), not React Native. **If the model reading is wrong, this item should be discarded and
rewritten.** The assumption is recorded here rather than silently applied.

Under the model reading: Hermes is a *specific* candidate within the general open-weight question that
R-15 covers. It earns a separate item only if it has a distinguishing property — its tool-calling and
structured-output tuning would be the plausible one, which connects to R-05. It is ranked exploratory
because it is strictly downstream of R-15: if local hosting is not viable at all, the model family is
moot.

**Roadmap capability affected.** Potentially R-09's routing options and R-16's independence dimension,
via lineage diversity. Nothing currently.

**When the answer is needed. Rank E — exploratory only. The only remaining rank-E item.**
Trigger condition: R-15 concludes that local or self-hosted open-weight serving is viable for at
least one work class. It then becomes rank D alongside R-15 and R-10 through R-12, on the shared
harness, anchored to **2H-1**.

**The identity assumption below is now confirmed, and the item is correspondingly narrower.**
PLAN-P2-001 §0.4 item 2 names Hermes in a model context — every role↔model binding is versioned,
expiring, and revocable, *"This applies to Hermes and to every other model, current or future,
without exception"* — which settles that Hermes means a model family and not the React Native
JavaScript engine. What the plan does **not** do is establish Hermes as a selected candidate: it
appears once, as an example of a binding that must not become permanent. So the rank stays E.

**Primary sources required.** Nous Research's published model cards and documentation for the current
Hermes generation — training approach, tool-calling and structured-output support, context window, and
**license terms, which are a hard constraint**. Independent benchmark results, read with the skepticism
applied to all vendor benchmarks here. Serving-runtime documentation for the specific model format.
Documentation for any hosted inference provider offering the family, since hosted access would decouple
this item from R-15's hardware question entirely — that decoupling should be checked first, because it
may make the item cheap to answer.

**Repository facts required.**
- **No reference to Hermes exists in the repository** — verified; recorded so the assumption above is
  visible.
- R-15's viability findings and hardware facts — the gating input.
- R-05's structured-output conformance results — the dimension on which this family would have to
  distinguish itself.
- `types/contracts/agent-provider.ts` — the same vendor-neutral port; no contract change is implied.
- `data/placeholders/mission-control.ts:208,252` — `provider: "internal"`, the undefined roster value
  R-15 is asked to define.

**Alternatives to compare.** Hermes against the other open-weight families R-15 evaluates, on the shared
harness; and hosted access against local hosting, which are materially different on cost, policy, and
operational burden.

**Evaluation criteria.** Identical to R-15 — R-06 golden-set scores, cost, latency, license — plus the
one dimension that would justify a separate item: **measured structured-output and tool-calling
conformance under R-05's harness**, compared against both the API providers and other open-weight
families. If it does not distinguish itself there, fold it back into R-15 and close this item.

**Experiment or prototype needed.** None until the trigger condition is met. When triggered: run the
shared R-10 harness plus R-05's conformance harness, and compare against the other open-weight
candidates rather than against the API providers alone.

**Risks.** Researching a specific model family before establishing that the category is viable. Model
families move quickly, so any finding dates fast — more so here than for the API providers. **The
identity assumption above being wrong**, which would waste the entire item; confirm it before starting.

**Expected output.** Either a closure note (if R-15 rules out the category, or if the identity assumption
is corrected), or a dated envelope report on the shared template with a specific verdict on whether it
distinguishes itself on structured output.

**Decision authority.** Lead Software Engineer, as part of R-15's assessment. **Founder confirms the
identity assumption before any work begins.** No routing decision is made here.

---

# 6. Escalations and Open Questions

Under `AGENTS.md` §Escalation Standards and GOV-001 §Conflict Resolution. Each states the blocker, the
facts, the impact, the options, a recommendation, and the required decision owner.

## E-1 — WITHDRAWN

*The first draft escalated that no roadmap existed for 1G, 1H, or Phase 2. That was true of the
repository when the draft was written and is no longer true.
`docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` and `docs/plans/PHASE_2_PROGRAM_PLAN.md` were added
the same day, and every rank has been re-checked against them (§3, §4). Withdrawn rather than
deleted, because the ranks moved as a result and a reader comparing versions should see why.*

## E-1a — The Master Roadmap is cited as governing authority but is not in the repository

**Blocker.** Both new plans derive their authority from a document that cannot be read from the
repository, so no claim traced to it can be independently verified here.

**Facts.** `PHASE_2_PROGRAM_PLAN.md` lists its authority as *"Master Roadmap v7.1 §10 / §11 / §12 /
§12A / §13 / §13A"* and cites it throughout — §2 authority levels L0–L5, §4A staging, §9 Phase 2
entry, §17 governed transitions, §21 KPI blocks, §22 prohibited shortcuts, and Appendices B, C, D,
G, H, I, J. **Verified by repository-wide search: the string "Master Roadmap" appears only inside
the two new plan files, and no roadmap document exists anywhere in the tree.** The same applies to
the *"Permanent Operating Handbook"* and *"Current Progress Update"* named in the plan's authority
ordering (§0.3).

**Impact.** Several of this backlog's plan cross-references resolve to roadmap sections rather than
to repository facts — for example, ADR candidate #7's *"canonical scope tuple"* and §21's KPI
blocks. A research item cannot check its own premise against a source it cannot open, which
conflicts with GOV-001 §Evidence and Audit Requirements: *"An asserted ADR, standard, or contract
violation quotes the text being applied."*

**Options.** (a) Commit the Master Roadmap (and the Operating Handbook) to the repository, matching
the precedent `8310bbb` set for agent definitions and the reasoning behind PE-4's resolution in
Sprint 1E. (b) Record explicitly that the roadmap is an external governance artifact, with a stated
location and version, so its absence is a known condition rather than a gap. (c) Leave as is.

**Corroborated independently.** The Sprint 1F plan reached the same finding without coordination and
records it as interface **I-6**: *"**Not present in this repository** (`find` returns no roadmap
file). The Phase 2 plan cites it as governing authority for §4A, §9, §10, §11, §12, §12A, §13, §13A,
§22. **This plan was written without it** and may conflict with it in ways this workstream cannot
see."* Three documents now depend on a fourth that none of them can read.

**Recommendation.** (a). Sprint 1E resolved the identical problem the identical way — PE-4 committed
three untracked agent definitions precisely so that *"the operating definitions under which the work
was produced… are reproducible from the repository."* A governing roadmap has a stronger claim to
that standard than an agent definition does.

**Decision owner.** Director of Operations, with the Founder for the authority record.

## E-2 — ORG-001's role/tool table still conflicts with the model-neutrality rule

**Narrowed, not withdrawn.** `PHASE_2_PROGRAM_PLAN.md` §0.4 resolves the *principle* decisively and
in the same direction this backlog's §2 argues: *"No role in this plan is bound to a model… The model
executing a role is an assignment, not an identity,"* with bindings required to be versioned,
expiring, and revocable. **What it does not do is amend ORG-001.**

**Facts.** `docs/company/ORGANIZATION.md` still assigns named AI tools to named roles (Claude Code,
Codex, Gemini, Copilot, v0, ChatGPT). GOV-001 §Role Boundaries still states a rule in provider terms
(*"Codex should not approve its own unreviewed implementation…"*). `types/domain/agent.ts:8` still
models `provider` as an unconstrained string. So a governing organization document and a governing
program plan now say different things about whether a role is bound to a tool.

**Impact.** Smaller than before, and better defined: R-09's `RoutingPolicy` work and R-16's
independence rule both need to know whether ORG-001's current provider spread is a **guarantee they
may rely on** or **a coincidence they must enforce for themselves**. Today it reads as a coincidence,
and nothing prevents a future routing decision from collapsing implementer and reviewer onto one
provider while every written rule still passes.

**Options.** (a) Amend ORG-001 to present its assignments as the current default routing
configuration, explicitly revisable under the §0.4 binding regime. (b) Confirm them as bindings,
which would contradict §0.4 and require reconciling the two documents. (c) Defer to ADR #18.

**Recommendation.** (a), and it is now cheap: §0.4 has already made the decision at program level, so
this is a conforming amendment rather than a new policy. Note this is the *second* ADR-versus-plan
reconciliation the Phase 2 plan identifies — its own §1.3 raises the agent-to-agent communication
invariant as **P-7** — and both are governance edits of the same kind.

**Decision owner.** Founder, with the Director of Operations owning the ORG-001 amendment.

## E-3 — Sequencing risk: R-03 gates several items and must not be bypassed

**Blocker.** Not a decision request — a recorded risk, stated once per GOV-001 §Review Authority.

**Facts.** `proxy.ts` disables the entire `/api/dev-hq/*` surface in production because nothing
authenticates the caller, *"including the founder approve/reject endpoints."* CR-1 (the predictable review
callback token) is non-blocking **only** because that guard sits in front of it. NB-1 (a replayed
`accept`/`abandon` overwriting newer task state) is unfixed.

**Impact.** R-08 (deployment) and R-14 (mobile PWA/push) both imply narrowing or removing that guard.
Doing so before R-03 lands, and before CR-1 and NB-1 are fixed, would expose unauthenticated
state-mutating routes protected by a token with a search space of a few thousand candidates.

**The Sprint 1F plan independently reaches the same sequence, which strengthens rather than
duplicates this.** Its critical path is `1F-0 → 1F-6 (auth) → 1F-11 → 1F-12 → 1F-13`; its internal
dependency graph routes `1F-6 → 1F-9 (PWA shell) → 1F-10 (push)`; and **1F-7 is exactly CR-1 and
NB-1** — the only two of the sixteen carried Sprint 1E follow-ups that 1F takes on (§3.3, §19 D-1),
with 1F-13 (approval/escalation detail) marked as needing 1F-7. **Two independently authored
documents converging on the same ordering is the useful signal here.**

**Recommendation.** Treat R-03 → (CR-1, NB-1 fixed) → R-08 → R-14 as a hard sequence — equivalently,
1F-6 → 1F-7 → 1F-9 → 1F-10 in the plan's numbering — and record any deviation as a Founder decision
accepting the risk. One addition the plan supplies: `lib/dev-hq/actions.ts:43` disables dispatch in
production, so a deployment that narrows the guard still cannot execute work until that is addressed
too.

**Decision owner.** Lead Software Engineer enforces the sequence; the Founder owns any exception under
GOV-001 §Exceptions.

## E-4 — Several experiments in this backlog cost real money and require R-07 first

**Blocker.** R-05, R-06, R-10, R-11, R-12, R-13, R-15, R-21, and R-24 all require real provider calls.

**Facts.** No provider credential exists in the repository (`.env.local.example` has two variables,
neither of them a provider key). No credential-handling model exists (R-07). No budget mechanism exists
(R-17). GOV-001 makes Founder approval mandatory before introducing a new paid service. Sprint 1F **D-6**
sharpens the precedent this would set: *"Sprints 1D and 1E added **zero** dependencies by design; 1F
cannot,"* and it routes even the auth, web-push, and `jsdom` additions to the Founder for explicit
approval. A provider API key introduced informally for an experiment would bypass a gate that 1F is
observing for a `jsdom` dev dependency.

**Impact.** Nine items cannot begin their experiments until credentials exist and are handled properly.
Running them ad hoc would set the credential-handling precedent by accident — which is exactly how the CR-1
token pattern came about.

**Recommendation.** Complete R-07 before any billed experiment, and set an initial experiment budget with
the Founder. R-17's offline worst-case cost model can and should be produced first, since it needs no
credentials and would inform the budget.

**Decision owner.** Founder approves the experiment budget and any provider account. Security Engineer
reviews credential handling before the first call. Note that **NEW-3** already puts provider approval
and spend for the **P-8** real-agent transition on the Founder's register — the experiment budget
should be decided with it, not separately.

## E-5 — WITHDRAWN, and replaced by the question the CLM specification raised in its place

*This escalated the absence of a Context Lifecycle Manager specification. **The specification
exists** — `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md`, v1.1.0 — and
arrived during this reconciliation pass. R-13 is rewritten against it. Withdrawn rather than deleted,
so a reader comparing versions sees why R-13 changed shape twice in one day.*

**What replaces it is narrower and better posed: who owns a number that stops work?**

The CLM declines threshold ownership on governance grounds, and says so normatively.
**CLM-S9** accepts the UX specification's **CX-2** assignment *"for the vocabulary and declined for
the numbers, and the reason is governance, not modesty"*: a threshold *"decides when work is
stopped… an organizational risk posture — how much degradation Dev HQ tolerates before halting an
employee — and AGENT-001 places that class of decision with the Founder, not with an engineering
subsystem."* **CLM-S10** then makes every numeric constant a provisional default carrying
`provisional: true`, propagated to every band derived from it, *"so no consumer can present an
unapproved threshold as a governed verdict."*

**Three workstreams reached this split independently**, which the governance plan consolidates as
**G-11** and calls *"the cleanest cross-workstream convergence in the set"*: CLM §4.8, UX **CX-2**
/ OQ-7, and Phase 2 **D-2E-2** (health-score weightings, Reserved) and **D-2H-3** (binding
lifetime). Governance ranks it **P-7**, required before Phase 2 — *"Must land before the CLM
implements, and before 2E-2 weightings and 2H-3 binding lifetimes; until then every band is
provisional by construction."*

**Why this backlog records it.** The same split applies to numbers **this document's items will
produce**: R-06's pass/fail quality bar per role (**D-2H-4**), R-17's budget ceiling and threshold
states, R-09's maximum binding lifetime (**D-2H-3**), and R-16's independence rule if it is
expressed as a tolerance rather than a boolean. **Every one of those is a risk posture, not an
engineering constant.** Research items may recommend values and must show the evidence behind them;
they may not set them. Items should adopt the CLM's `provisional: true` pattern so an
un-approved recommendation cannot be mistaken for policy.

**Decision owner.** Founder / Director of Operations, as governance **P-7** and **CLM OQ-C2**
(*"Are CLM band thresholds Founder policy (§4.8) or CLM-owned (UX CX-2 as written)?"*).

## E-6 — Designer ≠ reviewer separation may not be satisfiable, which affects this backlog's own execution

**Blocker.** Not a new finding — it is `WORKFLOW_DIAGNOSIS.md` §4c and PLAN-P2-001 **C-6/NEW-5**,
already escalated to the Founder by both. Recorded here once, per GOV-001 §Review Authority, because
it constrains **R-16** and because it determines whether this backlog can be executed by agents.

**Facts.** Four consecutive freshly-spawned agents across two types, each asked to author an
implementation specification, delivered nothing; two long-lived reviewer agents delivered nine
artifacts. Root cause **UNKNOWN**. PLAN-P2-001 calls it *"the most serious operational finding in this
handoff"* and states that designer ≠ reviewer separation *"cannot currently be satisfied as
specified."* §17.6 **Q-8** asks whether *any* Phase 2 stage can be staffed with an implementation owner
independent of its reviewers today.

**Impact on this document specifically.** Every rank-C and rank-D item assumes someone performs
research and returns it. The one variable correlating with all nine successes and all four failures is
long-lived versus freshly-spawned — untested. If the backlog is handed to fresh agents at scale, the
plausible outcome is silence, which §6 item 5 of the diagnosis requires be recorded as *"a workflow
failure, never as agreement."*

**Recommendation.** Before committing the backlog to agent execution, test the long-lived-agent
hypothesis on one low-stakes item — R-18's threshold question or R-13's corpus-and-churn analysis are
good candidates: both are offline, both have a checkable deliverable. This is cheap and it is the only
untested explanation.

**Decision owner.** Founder (**NEW-5**), with the validation-workflow owner.

## E-7 — Scorecard placement is contested by three governing documents and blocks nothing until it does

**Blocker.** Two workstreams independently reached the same reading and neither will overrule the ADR.

**Facts.** ADR-0001 **D8**: scorecards deferred to Phase 2. ADR-0002 **D-E6**: scorecards in Sprint 1F.
The 1F plan: out of 1F (§3.1), registered as **Q-6**. PLAN-P2-001: belongs to 2D/2E, registered as
**C-3** (*Material*) and **NEW-1**, with the explicit note *"ADR-0002 says otherwise and we will not
overrule it."*

**Impact.** R-06's rank depends on it — this pass moved R-06 from B to D on the 1F plan's reading, and
that move reverses if the Founder confirms ADR-0002 instead. It is the only rank in this document
contingent on an unresolved conflict, and it is flagged in R-06's own body.

**Recommendation.** Resolve **NEW-1** and amend whichever ADR loses, so the record does not carry the
contradiction forward. Both plans recommend the same outcome (scorecards to 2D/2E); this backlog
concurs but has no authority here and states the dependency rather than the preference.

**Decision owner.** Founder, with the Lead Software Engineer authoring the ADR-0002 amendment.

---

# 7. How to Use This Backlog

1. **Read §4 for order and §4.1 for who decides what.** §5 is grouped by theme so related items sit
   together; §4 carries the ranks and the execution order; §4.1 maps every research item to the
   Founder decision or candidate ADR it feeds. Where §4 and §5 appear to disagree, §4 governs.
2. **The five rank-A items are inputs to 1F-0, not additions to 1F's scope.** 1F-0 is the plan's own
   decision item, and each rank-A item feeds a Q- or D- entry it must close: R-08→Q-1/D-2/D-7,
   R-03→Q-5/D-6, R-01→Q-4/D-5, R-02→D-1, R-14→D-6/D-7. Treating them as sprint work would be the scope
   expansion `AGENTS.md` §Scope Discipline prohibits.
3. **Start with R-08.** It is Sprint 1F's own highest-priority question (Q-1) and Phase 2's *"true program
   bottleneck"* (P-1), and it now has a concrete first task rather than an open-ended one: assess
   `feature/sprint-1c-b-supabase-persistence` against the current contracts, since the plan verified that
   branch covers seven adapters and **none** of the 1D/1E entities the 1F surfaces read.
4. **Do the unfunded work first.** R-01, R-02, R-04, R-13's corpus-and-churn analysis, R-17's offline cost
   model, R-18's threshold question, R-19's query set, and R-20's gap inventory need no credentials, no
   spending, and no new dependency. Several may close their items outright, and R-17's cost model is what
   tells the Founder how large the E-4 experiment budget needs to be.
5. **Build the shared harness once.** R-10, R-11, R-12, R-15, and R-24 are comparable only if they run the
   same tasks with the same scoring. That harness is R-06's output — and R-06 is now anchored to **2H-2**,
   which asks for exactly this: a benchmark harness over planning, coding, review, architecture, research,
   restoration, and tool use.
6. **Let items conclude "not needed."** R-18, R-19, and R-24 have a legitimate negative outcome and each
   says so. A closure note with reasoning is a successful research outcome. R-20 and R-23 no longer do —
   the plans have committed to those capabilities, so their scope is open but their existence is not.
7. **Do not let this document become a second decision register.** Every item's answer lands in the plan
   anchor named in §4 — a 1F Q-/D- entry, a Phase 2 precondition, or one of the 23 candidate ADRs in
   PLAN-P2-001 §2.7. This backlog holds the research; it holds no decisions.
8. **No item here authorizes implementation.** Each produces evidence for a decision owned by someone named
   in its Decision Authority field. Where that decision changes architecture it goes through an ADR and the
   GOV-001 review order.

---

# 8. Record

**Status:** Draft, reconciled against the plan set on 2026-07-26. Awaiting Founder review of the
ranking in §4, the crosswalk in §4.1, and the seven escalations in §6 (E-1a, E-2, E-3, E-4, E-5,
E-6, E-7). E-1 is withdrawn.

**Version 1.2.0 — reconciliation pass.** All 24 item bodies were re-read against
`SPRINT_1F_MISSION_CONTROL_LITE.md`, `PHASE_2_PROGRAM_PLAN.md`,
`PHASE_1_MISSION_CONTROL_LITE_UX.md`, `WORKFLOW_DIAGNOSIS.md`, and `ISSUE_MATRIX.md`. The
outstanding body/field contradiction recorded in v1.1.0 is **closed**. Where a body argument was
falsified by a plan, it is marked as corrected in place rather than deleted, so the reasoning is
auditable. §4.1 answers PLAN-P2-001 §17.6 **Q-1**.

**Verification note.** Every repository fact cited in this document was read from the working tree at
`validation/sprint-1e-overnight-2026-07-26` @ `057e12c` on 2026-07-26. The absence claims — no AI provider
SDK, no Playwright configuration or test file, no PWA manifest or service worker, no deployment
configuration, no Obsidian artifact in the tree, no roadmap document — were each established by
repository-wide search, not assumed.

**Two absence claims from the first draft are withdrawn as facts about the repository**, because the
repository changed while this document was being written: *"the strings 1G and 1H appear nowhere"* and
*"no reference to Hermes exists."* Both were true at `057e12c` and both were falsified by
`SPRINT_1F_MISSION_CONTROL_LITE.md` and `PHASE_2_PROGRAM_PLAN.md`, which are untracked in that snapshot.

**Four body arguments were falsified by the plans and are corrected in place**, each marked where it
appears so the change is auditable rather than silent:

| Item | Draft claim | Corrected to |
| --- | --- | --- |
| R-01 | "1F builds scorecards over this record shape" | 1F excludes scorecards (Q-6); the timeline and 1F-4/1F-17 carry the argument. Added: Phase 1 simulations cannot populate these fields at all (Q-4) |
| R-06 | "Sprint 1F builds the scorecard domain (ADR-0002 D-E6)" | Contested three ways (D8 / D-E6 / 1F §3.1); registered as Q-6, C-3, NEW-1 and unresolved. Rank moved B→D on that basis, and the move is contingent — see E-7 |
| R-14 | "notify and resolve" was an open alternative | Closed by UX **RB-5**: deep-link only, no actionable push buttons. Email/SMS/Slack closed by 1F §3.3 |
| R-23 | "not currently justified by anything in the repository… close the item unless the Founder confirms" | 2C-2 is committed scope; candidate ADR #9 is Blocking; **D-2C-1** is a Reserved Founder decision |

**Relationship to the plans.** This backlog is subordinate to `SPRINT_1F_MISSION_CONTROL_LITE.md`,
`PHASE_2_PROGRAM_PLAN.md`, `PHASE_1_MISSION_CONTROL_LITE_UX.md`, and the ADRs. Where a plan or the
design specification has already decided something, this document records the decision and works
inside it — it does not re-open it. It holds research questions and the evidence needed to answer
them. **It records no decision, and it may not be cited as one.**

**No external source was fetched in the preparation of this document, and no model, provider, pricing,
or capability fact is asserted anywhere in it.** Every such fact is listed as a source to be obtained at
research time. This is deliberate, per `AGENTS.md` §Research and Evidence: *"Avoid relying on unsupported
memory when accuracy matters."*

**Prepared by:** Lead Software Engineer (AGENT-006)

**Version:** 1.0.0
