# Sprint 1F — Mission Control UX Contract Reconciliation (Roadmap Pass)

**Document ID:** DESIGN-003

**Version:** 1.0.0

**Status:** READ-ONLY RECONCILIATION ADDENDUM to DESIGN-002. Planning input. Not a design approval, not an implementation authorization, not an amendment to DESIGN-001.

**Date:** 2026-07-26

**Author role:** Claude Design Engineer (AGENT-004 / ROLE-014)

**Amends:** `docs/plans/SPRINT_1F_MISSION_CONTROL_UX_CONTRACT_AUDIT.md` (DESIGN-002 v1.0.0). DESIGN-002 is **not edited**; every superseded finding is named here with its original status preserved.

**Authority:** CONST-001, GOV-001, AGENT-001, ADR-0001, ADR-0002, STANDARD-011, Master Roadmap v8.0 (**subject to ACR-001 X-8 — see §2.4**)

**Repository state inspected:** branch `validation/sprint-1e-overnight-2026-07-26`, HEAD `9069c12`. Filesystem re-verified immediately before writing.

---

# 0. Why this pass exists, and the one procedural lesson in it

DESIGN-002 recorded that no Master Roadmap existed in the repository. **That finding was accurate when the search ran and is now stale.** `docs/roadmap/MASTER_ROADMAP.md` was registered by an authorized governance session at 13:40:55, approximately 26 seconds before DESIGN-002 was written. I did not create it and did not modify it.

**The procedural lesson, recorded because it recurred twice in one session.** While preparing this pass I globbed `**/*AUTHORITY*`, got no result, and was one sentence away from asserting that `AUTHORITY_AND_CONTRADICTION_REGISTER.md` (ACR-001) did not exist. A second, differently-shaped glob found it immediately. **ACR-001 exists and is substantial.** In a repository being authored concurrently by several sessions, a negative finding decays in seconds and a single search shape is not sufficient evidence of absence. Every absence claim in this document was therefore established by **at least two differently-shaped searches, re-run immediately before writing**, and is stated with its check time. This is the same failure mode DESIGN-001 §16.9.1 confesses; it is not a safe one to learn twice and not record.

---

# 1. Roadmap provenance and evidentiary weight

## 1.1 What was verified

| Field | Value | How established |
| --- | --- | --- |
| Path | `docs/roadmap/MASTER_ROADMAP.md` | Glob, twice |
| Title | *Savrio Dev HQ Master Roadmap v8.0 — Canonical Engineering Organization Blueprint* | Registration record `:16`; document body `:90-94` |
| Version | **8.0** | `:17`, `:92` |
| Length | 1,886+ lines; all 23 sections, 4 phase blocks, and Appendices A–K present | Heading scan |
| Source | `Savrio_Dev_HQ_Master_Roadmap_v8.0_Canonical.docx`, SHA-256 `52a7992574e3f82fd21e6b0ddb21e1c28684f0126f2f4f071e1b829ae9a6fa1e`, 90,959 bytes, mtime 2026-07-26 11:22 | Registration record `:22-24` |
| Registered by | *"Governance documentation coordination pass (Operations proposal authority only)"* | `:21` |
| Converted-body SHA-256 | `34ab4373c2cf16935f5bdd4a9b524492ec59707db9e03d10efb9d755fb50c609` | `:42-43` |

## 1.2 Evidentiary weight — what the registration record does and does not establish

The registration block is **explicitly fenced as provenance metadata, not roadmap content**, by an HTML comment at `:1-8` and a restatement at `:12`. That fencing is correct practice and I treat everything above `END REGISTRATION RECORD` (`:87`) as carrying **no roadmap authority**.

Three limitations bear directly on how much weight the roadmap can carry in this pass:

1. **The conversion is not line-by-line verified.** `:45-47`: *"If any discrepancy is found between this file and the `.docx`, the `.docx` governs and this file must be re-registered. The conversion has not been independently verified line-by-line; that verification is a gate item in the governance-baseline review packet."* **Consequence:** every roadmap quotation in this document is a quotation of the *converted Markdown*, not of the Founder-supplied source. For the structural comparison I am performing — section presence, sprint bullets, view lists, gate lists — a mechanical DOCX→Markdown conversion is reliable enough, and the risk of a section being invented or dropped is low. I would not rest a **single-word** contractual reading on it without the source check.
2. **Registration is Operations proposal authority, not Founder approval.** `:21`. The file being in the repository does not mean the Founder has ruled that it governs.
3. **The roadmap disclaims implementation evidence in its own voice.** `:63-69`, quoting §Document Authority: *"A capability appearing here is planned or approved direction; it is not proof that the capability has been implemented, reviewed, committed, deployed, or made operational."* **Consequence:** the roadmap can create a Sprint 1F requirement. It can never be cited as evidence that a Sprint 1F surface exists.

## 1.3 Is it complete enough to perform the Sprint 1F comparison?

**Yes, and without qualification for this purpose.** The comparison needs five things and all five are present and specific:

- **§5 Sprint 1F — Mission Control Lite and Founder Interface** (`:512-526`), six requirement bullets plus an explicit deferral.
- **§7 Mission Control Lite and Progressive Founder Experience** (`:609-636`), a four-stage model plus **eight Phase 1 Operational View** requirements.
- **§9 Mission Control gate** (`:717-722`), the Phase 1 exit criteria.
- **§10 2D — Executive Intelligence and Advanced Founder Interface** (`:788-796`), the Phase 2 boundary.
- **Appendix A** (`:1668`, `:1683`) and **Appendix B** (`:1738`), which key *Mission Control Lite Desktop + Mobile* to Phase 1 and *Advanced Founder Interface* to Phase 2.

This is materially **more specific** than the Sprint 1F canonical scope that the engineering plan and DESIGN-001 worked from, and it produces real findings — see §3.2.

## 1.4 Does it match the authority assumptions used by `SPRINT_1F_ENTRY_PACKAGE.md`?

**Partly, and one mismatch is already registered by someone else.**

| Entry Package assumption | Roadmap position | Assessment |
| --- | --- | --- |
| Phase 2 implementation excluded from 1F by *"standing Founder direction"* (§3) | §9 `:731`: Phase 2 begins only after every Phase 1 gate is verified and the Founder authorizes it. §10 2D places the advanced interface in Phase 2 | **Consistent** |
| `PHASE_1_MISSION_CONTROL_LITE_UX.md` is *"Approved Mission Control UX"* (§7) | Roadmap is silent on design-artifact approval; §Authority Rule assigns architecture/policy to **approved ADRs and recorded decisions** | **Roadmap does not support the "approved" label.** DESIGN-002 **X-1** stands unchanged |
| The package is the Sprint 1F handoff | — | **Independently corroborated as unresolved.** `CURRENT_PROGRESS_UPDATE.md` §5.3 (`:238-243`): *"A Founder-supplied document by this name was not located… must not be treated as the Founder-supplied handoff without a Founder identity ruling."* Registered as **ACR-001 X-20 / F-G4** |

## 1.5 The authority-tier question — surfaced, not assumed

The team lead was right to flag this, and it is **already the root open item in the governance register**.

- `AGENTS.md` § Governing Authority enumerates **eight tiers and contains no roadmap tier**. Verified directly.
- The roadmap asserts a position for itself at `:107-109`: *"Repository and verified tool output control implementation truth. Approved ADRs and recorded decisions control architecture and policy. The Permanent Operating Handbook controls stable operating behavior. The latest verified Current Progress Update controls live execution state. **This roadmap controls long-term capability direction.**"*
- `ACR-001` carries this as **X-8 — "The roadmap and handbook occupy no tier in `AGENTS.md`" — state `[V] BLOCKING`**, and describes it as *"the register's root item: several other entries cannot be weighed until it is answered."*
- `CPU-001` §1.3 supplies the operating rule in the meantime: *"a claim resting only on the roadmap or only on POH-001 is an **unverifiable-tier premise** and must be labelled as such."*

**Applied consistently in this document.** Every conformance finding below is tagged **[TIER-OK]** where the requirement is corroborated by a source that *does* occupy an `AGENTS.md` tier (an ADR, a standard, a recorded Founder decision, or repository truth), and **[TIER-UNVERIFIED]** where it rests on the roadmap alone. **Registration alone does not confer authority, and I do not treat it as doing so.**

---

# 2. Task 1 — Roadmap conformance

## 2.1 What the roadmap requires of Sprint 1F

Two sources, and they are not identical — which is itself useful.

**§5 Sprint 1F** (`:512-526`) — *"the minimum complete operational command center without delaying autonomy for advanced analytics"*:

| # | Requirement |
| --- | --- |
| R1 | Founder conversation and command surface |
| R2 | Project, roadmap, sprint, task, execution, agent, queue, review, approval, and release views |
| R3 | Live execution timeline, current owner, status reason, next gate, blockers, and evidence |
| R4 | Phone-optimized responsive PWA, push-capable notifications, and fast approval flows |
| R5 | Context health, checkpoints, model/provider, cost, and budget visibility |
| R6 | *"Advanced executive analytics are intentionally deferred to Phase 2"* |

**§7 Phase 1 Operational Views** (`:620-636`) — eight bullets, **materially richer than R1–R6**:

| # | Requirement |
| --- | --- |
| V1 | **Portfolio**, project, roadmap, **milestone**, sprint, and task status |
| V2 | Live execution timeline with owner, **active action**, elapsed time, waiting reason, retries, review state, and next gate |
| V3 | Agent and human queues, capability, availability, assignment, **collaboration mode**, and context health |
| V4 | **Evidence viewer** for tests, logs, screenshots, diffs, artifacts, metrics, reviews, and deployments |
| V5 | Review center with **candidate identity**, findings, severity, **remediation guidance**, re-review state, and **commit recommendation** |
| V6 | Approval center and Founder Decision Inbox **limited to reserved decisions** |
| V7 | Phone-first approval, reject, **request-change, pause, resume, and priority actions** |
| V8 | Installable PWA, **secure authentication**, reconnect behavior, low-bandwidth support, and accessibility |

**R3 names six decision fields, not seven.** The engineering plan's "seven decision fields" folds operational visibility (R5) into the same list. Not a conflict; a labelling difference worth noting so a reviewer counting fields does not report a phantom gap.

## 2.2 Roadmap-required surfaces FULLY represented in DESIGN-001

| Roadmap req | DESIGN-001 coverage | Tier |
| --- | --- | --- |
| R1 conversation and command surface | **View 17 Ask** (`/ask`), specified for the hybrid, with stated fallbacks for all four Q-2 readings | [TIER-OK] — also canonical 1F scope |
| R2 project · task · execution · agent · queue · review · approval views | Views 2, 18, 5, 6, 4, 7, 9 | [TIER-OK] |
| R2 roadmap · sprint · release views | Views 3 and 15, `preview`-badged from planning documents, no entity invented | [TIER-OK] |
| R3 timeline · current owner · status reason · next gate · blockers · evidence | View 5 + the six-field `DecisionHeader` on every entity surface — **exact match, field for field, in the roadmap's own order** | [TIER-OK] |
| R4 PWA · push · fast approval flows | §9 mobile plan, §8.6.1 push policy and payload, §16 quick-action flow | [TIER-OK] |
| R5 context health · cost · budget visibility | Views 12 and 13 as first-class **dark** surfaces with data contracts | [TIER-OK] |
| R5 checkpoints · model/provider | §15.8 — timeline entries and View 12 fields, `Not recorded` in Phase 1; routing-constraint vs attestation kept as separate claim classes | [TIER-OK] |
| R6 analytics deferred | §16.3, and View 3's hard prohibition on burndown, velocity, and projected dates | [TIER-OK] |
| V4 **Evidence viewer** | **View 8** | [TIER-UNVERIFIED] — see §2.4 **FD-11**, which this closes |
| V6 Approval center + Decision Inbox limited to reserved decisions | Views 9 and 10; §10.3 membership rule is *exactly* "pending approvals + open escalations" | [TIER-OK] — and the roadmap's *"limited to reserved decisions"* independently ratifies §10.3 |
| V8 installable PWA · reconnect · low-bandwidth · accessibility | §9.3, §9.6, §9.8, §10 | [TIER-OK] |

**Nine of the fourteen roadmap requirement lines are fully and precisely represented.** The R3↔`DecisionHeader` match is exact, which is notable: DESIGN-001 adopted that header from the engineering plan without either document having read the roadmap.

## 2.3 Roadmap-required surfaces INCOMPLETE or ABSENT in DESIGN-001

Six findings. Two are additive gaps; **two are direct conflicts with deliberate DESIGN-001 refusals**; two are field-level.

### RC-1 — Portfolio and milestone status are absent, and the engineering plan puts one of them out of scope. **CONFLICT.**

**V1** requires *"**Portfolio**, project, roadmap, **milestone**, sprint, and task status."*

- DESIGN-001 has no Portfolio view and no Milestone view. Its Context Spine is `Project ▸ Sprint ▸ Task ▸ Execution ▸ Attempt` — no portfolio or milestone segment.
- `SPRINT_1F_MISSION_CONTROL_LITE.md` §3.1 places *"Cross-project rollups, **portfolio views**, and comparative agent performance ranking"* **explicitly out of 1F scope**.
- **Repository truth:** no portfolio or milestone entity exists in `types/domain/`. One project is seeded.

**Sources:** Master Roadmap §7 V1 · SPRINT-1F-PLAN §3.1 · DESIGN-001 §3.3, §4.1 · repository.
**Governing authority:** roadmap controls capability direction **[TIER-UNVERIFIED, pending X-8]**; the plan's out-of-scope list is engineering scope, which does not outrank direction.
**Decision owner: Founder.**
**JUDGMENT:** with one project and no milestone entity, a Portfolio view in 1F would render a list of one and a Milestone view would render nothing — both would be honest and useless. The cheapest honest reading is that V1's portfolio/milestone terms describe the Phase-1-complete end state rather than Sprint 1F's first cut. **I am not entitled to choose that reading.** Recommended resolution: Founder confirms portfolio/milestone are satisfied by the existing project/sprint/task surfaces for 1F, or DESIGN-001 adds two dark surfaces naming the absent entities.

### RC-2 — Phone-first `request-change`, `pause`, `resume`, and `priority` actions are required by the roadmap and **deliberately refused** by DESIGN-001. **CONFLICT — the most material in this pass.**

**V7** requires *"Phone-first approval, reject, **request-change, pause, resume, and priority actions**."*

DESIGN-001 permits exactly two decision shapes on a phone (§16.4) and refuses the rest **on principle, with stated reasons**:

- **§6.4:** *"Deliberately absent: no pause/resume agent, no reassign, no manual capability edit. Agent selection is owned by the Execution Manager's routing policy… a founder-side reassignment control would break that guarantee."*
- **§4.4:** *"Deliberately absent: no bulk actions, no 'retry all', no 'cancel'… a founder-triggered retry button would let a human bypass the retry budget and the escalation path that ADR-0001/0002 exist to guarantee."*
- **§7.4:** no founder-facing review pass/fail control — reviews resolve through the token-guarded callback. *"Request-change"* on a review has no founder-facing path at all.
- **§10.4:** `Task.priority` is displayed as a recorded chip and as a user-selected sort, but **is not editable**; §18.4 states *"No status editing, no reassignment, no priority editing."*

**Sources:** Master Roadmap §7 V7 · DESIGN-001 §4.4, §6.4, §7.4, §16.4, §18.4, D10 · ADR-0001 D1/O2 (retry budget owned by the Work Management Layer) · ADR-0002 E6 (bounded review loop).
**Governing authority:** **split, and this is why it cannot be resolved here.** The roadmap controls capability direction **[TIER-UNVERIFIED]**. **ADR-0001 and ADR-0002 control architecture and policy — and the roadmap itself says so** (`:109`). DESIGN-001's refusals are derived from those ADRs, not from design preference.
**Decision owner: Founder**, and it may require an ADR amendment rather than a design change.
**Precise statement of the conflict:** the roadmap asks for four founder actions; three of them (`pause`, `resume`, `request-change`) have **no recorded semantics in the current domain** — there is no pause/resume transition on `Execution` or `AgentAssignment`, and no founder-facing review verdict path. `priority` has a recorded field and is the only one implementable today without new domain work. **Offering a control with no recorded semantics is prohibited by DESIGN-001 §11.12 rule 5 and by AC-19.** So this is not "Design declined a feature"; it is "the roadmap names four capabilities, three of which the Phase 1 domain cannot record."

### RC-3 — Review Center is missing three roadmap-required fields.

**V5** requires a review center with *"**candidate identity**, findings, severity, **remediation guidance**, re-review state, and **commit recommendation**."* §8 `:644` additionally requires every finding's Identity field to carry *"model/provider where applicable, and **candidate identity**."*

DESIGN-001 View 7 renders review id, reviewed execution, task, project, iteration N of 3, policy, reviewer, dispatch attempts, findings by severity, revision chain, and `escalationReason`. It does **not** specify:

| Missing field | Roadmap source | Repository truth |
| --- | --- | --- |
| **Candidate identity** — the exact reviewed bytes (commit SHA, tree SHA, freeze tag) | §7 V5, §8 `:644`, §8 `:650` (*"Re-review: required reviewer, candidate identity…"*) | **No candidate identity is recorded on `Review`.** Sprint 1E's own process pinned candidates by git tag (`SPRINT_1F_ENTRY_PACKAGE.md` §13), i.e. **in process, not in the domain** |
| **Remediation guidance** | §7 V5, §8 `:648` (*"Safest remediation"*) | `ReviewFinding` carries category and summary; no remediation field verified |
| **Commit recommendation** | §7 V5 | No such field |

**Sources:** Master Roadmap §7 V5 and §8 · DESIGN-001 View 7 · `types/domain/review.ts`.
**Governing authority:** roadmap **[TIER-UNVERIFIED]**; but note the *process* requirement is [TIER-OK] — the Entry Package §13–§15 makes candidate identity a hard review-procedure rule after the `3daf0790` mid-review mutation.
**Decision owner: Founder** (scope), with **Engineering** (whether `Review` gains a candidate-identity field).
**JUDGMENT:** candidate identity is the highest-value of the three. Sprint 1E's central process failure was a candidate that mutated mid-review; a Review Center that cannot show *which bytes were reviewed* cannot surface a recurrence. **Recommendation, labelled as one:** render it as `Candidate not recorded` until the field exists — which is the honest state and makes the gap visible to the Founder — rather than omitting the row.

### RC-4 — "Active action" is not a specified field.

**V2** requires the live execution timeline to carry *"owner, **active action**, elapsed time, waiting reason, retries, review state, and next gate."*

DESIGN-001's six-field header is *Status · Current owner · Status reason · Next gate · Blockers · Evidence*. **Current owner is specified; current *action* is not.** View 5's header carries status, attempt, policy, owner, and revision provenance — the *state*, not what the actor is doing right now.

**Repository truth:** nothing records an in-flight action description. `Execution` has a status and an immutable `ExecutionRequest`; there is no progress or current-step field. **VERIFIED** — and DESIGN-001 §1.12 rule 3 already prohibits inventing one (*"`Execution` records no progress fraction, so any percentage would be invented"*).

**Governing authority:** roadmap **[TIER-UNVERIFIED]** vs DESIGN-001's honesty rules **[TIER-OK]** (§2.6, AC-19).
**Decision owner: Founder** on scope; **Engineering** if an action field is to be recorded.
**Cleanest honest resolution available today:** the six-field header gains a seventh field **`Current action`** rendering `Not recorded` in Phase 1, with the reason. That satisfies the roadmap's field list visibly and honestly, costs no fabrication, and matches how Views 12/13 already treat uninstrumented capabilities. **Specified as an option, not adopted** — adding a field to the `DecisionHeader` changes a cross-cutting component and is a Design decision I should take in an authorized DESIGN-001 revision, not in an addendum.

### RC-5 — "Collaboration mode" is absent from the Agent & Human Queue.

**V3** requires agent and human queues with *"capability, availability, assignment, **collaboration mode**, and context health."*

DESIGN-001 View 6 renders name, role, provider, availability, health, `lastActiveAt`, capabilities, held executions, reviews credited, completed count — no collaboration mode.

**Roadmap context:** collaboration modes belong to §4A *Adaptive Organization Formation*, and **Appendix A places every adaptive-organization capability in Phase 2** (`:1708-1715`). ADR-0001 D6 fixes Phase 1 capacity at one execution per agent, and ADR-0002 E7 forbids direct agent-to-agent communication.
**Assessment:** **[TIER-OK] resolution available.** This is a **Phase 2 field appearing in a Phase 1 view list**, not a Design gap. The roadmap's own Appendix A settles it. **Recorded as reconciled, with the Founder free to disagree.**

### RC-6 — Context health per agent/queue is required by V3 but designed only per execution.

**V3** ends *"…and context health"* in the agent/queue context; DESIGN-001 View 12 is per-execution with a fleet roll-up, and View 6 has no context-health column.

**Assessment:** immaterial in Phase 1 — context health is dark everywhere (ADR-0001 D4: simulated agents have no context window), and CLM-S7 forbids fleet verdicts that average unmeasured sessions. **Recorded for the instrumented state**, so View 6 gains the column when the CLM lands. **No 1F action.**

## 2.4 Does the roadmap change any prior DESIGN-002 finding? — Delta table

Unchanged items are **not** restated. Only changed / closed / added appear.

### Conflicts X-1…X-10

| Item | Prior state | New state | Basis |
| --- | --- | --- | --- |
| **X-1** DESIGN-001 approval status | Open, blocking | **UNCHANGED — still open, still blocking** | The roadmap is silent on design-artifact approval. Registration is Operations proposal authority (`:21`), not Founder approval |
| **X-2** Roadmap absent | Open, blocking | **SPLIT AND PARTLY CLOSED.** (a) *"absent from the repository"* — **WITHDRAWN as stale**; accurate at search time, superseded. (b) *"conformance not performed"* — **CLOSED by this pass** (§2.2–§2.3). (c) *"`AGENTS.md` has no roadmap tier"* — **STANDS, and is now known to be someone else's blocking item**: ACR-001 **X-8**, *"the register's root item"* | Roadmap `:76-83`; ACR-001 X-8; CPU-001 §1.3 |
| **X-3** ADR-0002 E5 timeline placement | Open, blocking | **UNCHANGED, and now reinforced.** The roadmap explicitly assigns architecture to ADRs (`:109`), so it does not override E5. Independently corroborated as open: CPU-001 §5.2 lists **D-9** (E5 amendment) as an **OPEN Track B blocker** | Roadmap §Authority Rule; CPU-001 §5.2 |
| **X-4** Scorecards, ADR-0001 D8 vs ADR-0002 D-E6 | Open | **UNCHANGED — a third data point, no resolution.** Appendix A `:1673` places *"Agent Performance Registry **Foundation**"* in **Phase 1** and *"Agent Memory and Organizational Learning"* in Phase 2 (`:1686`). The roadmap **names no sprint and does not use the word "scorecard"**, so it does not adjudicate D8 vs D-E6. **View 6's slot copy must still assert neither** | Roadmap Appendix A |
| **X-5** Shipped inline-approval flow vs approved UX | Open | **UNCHANGED, and now roadmap-supported.** §7 V6 requires the Decision Inbox be *"limited to reserved decisions"*, and §2 Reserved Founder Authority (`:251-271`) defines the reserved set — which independently ratifies DESIGN-001 §10.3 | Roadmap §7 V6, §2 |
| **X-6** SPRINT-1F-PLAN §20.4.H keyed to DESIGN-001 v1.0.0 | Open | **UNCHANGED** | — |
| **X-7** GOVERNANCE X-14 phantom workstream | Open | **UNCHANGED, and confirmed still carried.** ACR-001 X-14 (`:286-290`) retains it as *"High, unreconcilable here"*. My recommendation to close it as void stands and is now routable to a register that exists | ACR-001 X-14 |
| **X-8** Light theme vs STANDARD-011 | Open | **UNCHANGED.** Roadmap §7 V8 requires *"accessibility"* without naming themes; STANDARD-011 `:129` remains the governing text | — |
| **X-9** Transport vocabulary is polling-only | Open | **STRENGTHENED.** Roadmap §7 V8 makes *"reconnect behavior"* and *"**low-bandwidth support**"* named Phase 1 Operational View requirements, so the gap DESIGN-002 M-5 identified is now roadmap-backed, not merely plan-backed | Roadmap §7 V8 |
| **X-10** Design/Engineering/Founder boundary table | — | **UNCHANGED** | — |
| **X-11** *(added)* **Reviewer verdict vocabulary** | — | **ADDED, then immediately reclassified as ALREADY-REGISTERED.** Roadmap §8 `:652-664` fixes **six** verdicts (`APPROVE` / `APPROVE WITH NON-BLOCKING FINDINGS` / `CHANGES REQUIRED` / `REJECT CANDIDATE` / `ESCALATE` / `UNABLE TO VERIFY`); the Founder decision of 2026-07-26 fixes **three** (`PASS` / `PASS WITH NON-BLOCKING FINDINGS` / `FAIL`). **This is ACR-001 X-7, `[V] BLOCKING`, described there as *"five incompatible sets in force… it grew rather than shrank when the roadmap was registered."*** Owner: **Founder** (F-G3). **UX consequence, which is mine:** View 7's status lanes and finding severity chips render a vocabulary that is not settled. DESIGN-001 §7.5 uses the *domain* `ReviewStatus`, not the *reviewer verdict* set, so **no DESIGN-001 change is required today** — but a Review Center showing reviewer verdicts must not ship before X-7 closes | Roadmap §8; ACR-001 X-7 |
| **X-12** *(added)* **Roadmap requires four founder actions the domain cannot record** | — | **ADDED — see RC-2.** Material. Owner: **Founder** | Roadmap §7 V7 |
| **X-13** *(added)* **Portfolio/milestone: roadmap requires, plan excludes** | — | **ADDED — see RC-1.** Owner: **Founder** | Roadmap §7 V1 vs SPRINT-1F-PLAN §3.1 |

### Missing items M-1…M-29

| Item | Prior state | New state | Basis |
| --- | --- | --- | --- |
| **M-1** No sign-in / re-auth UX | Open, blocking | **UNCHANGED, and now roadmap-required rather than merely plan-required.** §7 V8 names *"**secure authentication**"* as a Phase 1 Operational View. Remediation specified in §3 below | Roadmap §7 V8 |
| **M-2** No permission-denied state | Open, blocking | **UNCHANGED.** Remediation specified in §3 | — |
| **M-3** PWA cold-offline state · **M-4** recovery/wake · **M-5** transport vocabulary | Open | **ALL THREE STRENGTHENED** — §7 V8 makes reconnect behaviour and low-bandwidth support roadmap requirements. Remediation for M-3 and M-4 specified in §3 | Roadmap §7 V8 |
| **M-6** Context Spine sprint fallback | Open | **UNCHANGED** | — |
| **M-7 … M-12** DESIGN-001 internal defects | Open | **ALL SIX RESOLVED IN SPECIFICATION — see §4.** Application to DESIGN-001 requires an authorized revision pass | This document |
| **M-13 … M-21** Data assumptions | Various | **UNCHANGED** | — |
| **M-22 … M-29** Browser-derivation risks | Open | **UNCHANGED** | — |
| **M-30** *(added)* **Review Center lacks candidate identity, remediation guidance, commit recommendation** | — | **ADDED — RC-3** | Roadmap §7 V5, §8 |
| **M-31** *(added)* **No "current action" field** | — | **ADDED — RC-4** | Roadmap §7 V2 |
| **M-32** *(added)* **No portfolio / milestone surface** | — | **ADDED — RC-1** | Roadmap §7 V1 |

### Founder decisions FD-1…FD-24

| Item | Prior state | New state |
| --- | --- | --- |
| **FD-1** Approve/reject DESIGN-001 | Blocking | **UNCHANGED.** Evaluated against the proposed ruling in §5 |
| **FD-2** Roadmap authority | Blocking | **PARTLY RESOLVED — see §2.5** |
| **FD-3** ADR-0002 E5 amendment | Blocking | **UNCHANGED, and corroborated as an open Track B blocker (D-9) by CPU-001 §5.2** |
| **FD-4** Q-1 deployment/persistence · **FD-5** Q-5 auth · **FD-6** Q-9 dependencies | Blocking | **ALL UNCHANGED, all corroborated as OPEN Track B blockers by CPU-001 §5.2** (D-2/Q-1, D-6, D-7) |
| **FD-7** NB-1 | Blocking | **UNCHANGED** |
| **FD-11** Is the Evidence Viewer in 1F? | Open | **CLOSED — RESOLVED BY THE ROADMAP.** §7 V4 requires an *"Evidence viewer for tests, logs, screenshots, diffs, artifacts, metrics, reviews, and deployments"* as a Phase 1 Operational View. **View 8 is roadmap-required, not a design preference.** DESIGN-001 §15.13 offered it as a recommendation; it is now a requirement. **[TIER-UNVERIFIED]** — if X-8 resolves against the roadmap this reverts to open |
| **FD-15** Light-theme scope | Open | **UNCHANGED** |
| **FD-25** *(added)* Portfolio/milestone scope (RC-1) · **FD-26** *(added)* the four V7 actions (RC-2) · **FD-27** *(added)* Review Center candidate identity and two other fields (RC-3) · **FD-28** *(added)* "current action" field (RC-4) | — | **FOUR NEW FOUNDER DECISIONS, all scope-level, all roadmap-derived** |
| **FD-2b** *(added)* Adopt or reject the six-verdict roadmap vocabulary vs the three-string Founder decision | — | **ADDED, then routed:** this is **ACR-001 X-7 / F-G3**, already owned by the Founder. **Not a new decision — a new UX consumer of an existing one** |

**Net:** 1 closed (FD-11), 1 partly resolved (FD-2), 5 new Founder decisions (FD-25…FD-28, plus the already-owned X-7 consumer), 3 new conflicts (X-11…X-13), 3 new missing items (M-30…M-32), 6 resolved in specification (M-7…M-12). **No prior blocker was removed by the roadmap's arrival.**

## 2.5 Can FD-2 be closed?

**Partly. Two of its three parts are discharged; the third is blocking and belongs to someone else.**

| Part | State |
| --- | --- |
| *"The roadmap is absent from the repository"* | **WITHDRAWN as stale.** Accurate at search time, superseded. Master Roadmap v8.0 is registered at `docs/roadmap/MASTER_ROADMAP.md` |
| *"Roadmap conformance was not performed"* | **CLOSED.** Performed in §2.2–§2.3: nine requirement lines fully represented, six findings raised, four new Founder decisions produced |
| *"`AGENTS.md`'s eight tiers contain no roadmap tier, so its authority level is unestablished"* | **OPEN AND BLOCKING — and it is not mine to close.** It is **ACR-001 X-8**, state `[V] BLOCKING`, described there as *"the register's root item: several other entries cannot be weighed until it is answered."* Owner: **Founder** |

**So: FD-2 cannot be closed, but it should be *rewritten and reassigned*.** It is no longer *"declare the roadmap's authority status or accept that plans were written without it."* It is now exactly **ACR-001 X-8**, and DESIGN-002's FD-2 should be **retired as a duplicate** and redirected there. Carrying the same blocking question in two registers under two IDs is how one of them gets answered and the other does not.

**This matters practically for four of my own new findings.** RC-1, RC-2, RC-4, and FD-11 all rest on the roadmap alone and are tagged **[TIER-UNVERIFIED]**. Under CPU-001 §1.3 they are *"unverifiable-tier premises"* until X-8 resolves. **X-8 is therefore upstream of my own conformance conclusions**, and I have labelled every one of them rather than quietly treating registration as authority.

## 2.6 Is the Mission Control Lite boundary consistent across all sources?

**Yes — and this is the strongest alignment in the whole comparison.** Five independent sources draw the same line in the same place.

| Source | Stage 1 / Phase 1 | Stage 2–3 / Phase 2 |
| --- | --- | --- |
| Roadmap §7 stage table (`:613-618`) | *"Mission Control Lite — **what is happening now**: work, owners, queues, reviews, evidence, approvals, blockers, context, budgets, releases"* | Founder Dashboard (*"how healthy"*) early Phase 2; Executive Dashboard (*"why, and what should change": forecasts, scenarios, bottlenecks, staffing, routing, recommendations*) mid/late Phase 2 |
| Roadmap §5 R6 | — | *"Advanced executive analytics are intentionally deferred to Phase 2"* |
| Roadmap §10 2D (`:788-796`) | — | Forecasting, scenarios, bottleneck detection, Founder + Executive Dashboards |
| Roadmap Appendix A | *Mission Control Lite Desktop + Mobile* — Phase 1 (`:1668`) | *Advanced Founder Interface*, *Executive Intelligence* — Phase 2 (`:1683-1684`) |
| SPRINT-1F-PLAN §1 | *"1F makes the current state legible and actionable"* | *"it does not interpret history"* |
| DESIGN-001 | Twenty views of current state | §16.3 defers analytics; View 3 hard-prohibits burndown/velocity/projected dates |

**The boundary rule all five agree on: Stage 1 reports what is; Stage 2+ interprets what it means.** DESIGN-001's claim-class axis — Recorded / Derived / **Projection** / **Recommendation** / Unknown, with projections barred from headline metrics, colours, notifications, and action gating — is precisely the mechanism that keeps Stage 2 material out of a Stage 1 surface. It is also directly ratified by roadmap §3 (`:284`): *"Mission Control — Operational command center… **Displays authoritative state and labels predictions clearly**."*

**One boundary nuance worth stating so it is not misread as a conflict.** Roadmap §9's **Mission Control gate** (`:717-722`) requires that *"context health, budgets, and notifications are **operational**."* DESIGN-001 ships context health and budget **dark** in 1F. These do not conflict: §9 is the **Phase 1 exit gate**, and Phase 1 runs through 1G, 1H, and 1I. The roadmap places the Context Lifecycle Manager *"across the 1G/1H boundary"* (§6 `:573`), and ADR-0001 D4's simulated agents have no context to measure. **1F ships the surface; the gate is satisfied when the instrumentation lands later in Phase 1.** DESIGN-001's dark states are the correct 1F rendering and the correct precondition for that gate. **[TIER-OK]** — corroborated by ADR-0001 D4.

## 2.7 One dangling citation, reported

The roadmap registration record `:73-74` routes X-8 and X-17 to `docs/governance/AUTHORITY_AND_CONTRADICTION_REGISTER.md`. **That file exists** (re-verified twice immediately before writing) and carries both. **No defect.** Recorded only because DESIGN-002's method requires absence and presence claims to be stated with their check, and because I nearly published the opposite (§0).

---

# 3. Task 2 — Design-owned remediation: authentication, authorization, and state differentiation

**Scope discipline.** Everything below is an **addition** that slots into DESIGN-001's existing inventory, taxonomy, vocabulary, and copy conventions. **No view is renumbered, no state is renamed, no existing rule is relaxed, and no structure is reorganised.** This is a specification for an authorized DESIGN-001 revision, not an edit to it.

## 3.1 What is added, and where it slots

| Addition | Slots into | Kind |
| --- | --- | --- |
| **View 21 — Sign-in** (`/signin`) | §4.1 primary views, as view 21; §3.4 URL scheme | New view |
| **Unauthenticated Shell** | §3.1 structure, as a second shell alongside the authenticated one | New shell |
| **Re-authentication Sheet** | §4.2 secondary surfaces | New secondary surface |
| Four failure rows: *Unauthenticated · Session expired · Authorization refused · Server failure* | §4.4 failure taxonomy (currently six rows) | Additive rows |
| One shared state: **Offline (shell only)** | §4.3 shared view states (currently six) | Additive state |
| **Session freshness rule** and **recovery announcement** | §2.4 freshness and staleness model | Additive rules |
| `SessionStatus` and `RefusalReason` tokens | §7 status vocabulary, as §7.11 and §7.12 | Additive tokens |
| Four new `ActionabilityNotice` states | §6.5 decision components | Additive component states |
| Six new forbidden strings | §7.10 forbidden vocabulary | Additive |

## 3.2 View 21 — Sign-in

**Purpose.** Establish the Founder's session, and be the only surface in the product that renders before an authenticated identity exists.

**Primary user question.** *Am I signed in, and if not, how do I get back to what I was doing?*

**Provenance.** Not applicable — this surface reads no Dev HQ state. **It must therefore carry no `DataSourceBadge` and no `as of` stamp.** Rendering a freshness stamp on a surface with no snapshot would be the first lie the product tells.

**Information shown.** Product identity (`Savrio Dev HQ`) · a one-line purpose statement · the credential control (mechanism-contingent, §3.7) · the destination being preserved, when one exists · the error region · nothing else. **No counts, no status, no posture banner, no nav rail, no attention dock.**

**States.** `idle` · `submitting` · `failed` · `rate-limited` · `unsupported-mechanism` · `already-signed-in`.

**Actions.** Sign in. That is the complete list. No password reset, no account creation, no "remember me" — none has a backing mechanism and §19.12 rule 2 already forbids a control that does not take effect.

**Empty / loading / failure / stale.** Empty does not apply. Loading: the credential control renders **disabled** until the mechanism is known, per §19.7's rule that a control must not render in a default position before its value is known. Stale does not apply — there is no snapshot.

**Mobile.** Single column, credential control ≥ 56 px tall, safe-area insets honoured, no horizontal scroll at 320 px.

**Accessibility.** `<main>` with `<h1>Sign in to Savrio Dev HQ</h1>` · the credential control has a visible `<label>` · errors are text, adjacent, and programmatically associated via `aria-describedby` · **the failure message is announced in an assertive region** — this is the second and last legitimate assertive case in the product, alongside a failed founder decision (§10.5), because an unannounced sign-in failure leaves a screen-reader user with no indication anything happened · focus starts on the `<h1>`, not on the credential control.

**Prohibited misleading behavior.**
1. **Must not render any Dev HQ state, count, or status** — the surface has no authenticated read.
2. **Must not render a provenance badge or an `as of` stamp.**
3. **Must not distinguish "unknown account" from "wrong credential"** in user-facing copy. One string for both.
4. **Must not silently drop the destination.** If one was preserved, it is named on screen.
5. **Must not auto-submit or auto-retry.**

## 3.3 The five-way differentiation — the core deliverable

These five conditions look similar to a naive client and mean opposite things. **VERIFIED problem:** `lib/mission-control/useDevHqState.ts:64-69` maps every non-`ok` response into one error string and increments `consecutiveFailures`, so today a 401, a 403, and a 500 all render as *"Not connected to Dev HQ"* — a false statement about the network that also disables every decision control for the wrong reason.

**Copy below is Design-owned per DESIGN-002 §13.2 rule 2. An engineer may not substitute, shorten, or soften it.**

| Condition | Observable signal | Feed status | Headline | Body | Decision controls | Accessible-name prefix |
| --- | --- | --- | --- | --- | --- | --- |
| **Disconnected** | Network failure or timeout, ≥3 consecutive | `disconnected` | **Not connected to Dev HQ** | `Everything below is a snapshot from 14:32:07 and may be wrong.` | Disabled — `Not connected to Dev HQ — decisions are disabled.` | `Not connected:` |
| **Unavailable (dark)** | Server reachable, capability not instrumented | unchanged | **\<Capability\> is not measured.** | `Dev HQ records no <signal>.` + what would light it up | Not applicable — no control exists | `Not instrumented:` |
| **Unauthenticated** | 401, no prior session | unchanged — **not a feed failure** | **You are not signed in.** | `Dev HQ cannot show you anything until you sign in. Your place has been kept.` | Not rendered — the shell is unauthenticated | `Not signed in:` |
| **Session expired** | 401, prior session existed | unchanged — **not a feed failure** | **Your session has expired.** | `You were signed in at 12:04. Sign in again to continue. Nothing you have already decided is affected.` | Disabled — `Your session has expired — sign in again to decide.` | `Session expired:` |
| **Authorization refused** | 403 | unchanged | **Dev HQ refused this action.** | The server's recorded reason, verbatim, plus: `This is a refusal by Dev HQ, not a connection problem.` | Disabled — `Refused: <reason>` | `Refused:` |
| **Server failure** | 5xx | `degraded` → `disconnected` on repeat | **Dev HQ returned an error.** | `The server reached is reporting a fault. This is not a connection problem and not a refusal.` + verbatim server message | Disabled — `Dev HQ is reporting a fault — decisions are disabled.` | `Server error:` |

**Four rules that make the table work, and without which it does not:**

1. **An authentication or authorization outcome is never a feed status.** A 401 and a 403 mean the server was reached and answered. They **must not** increment `consecutiveFailures` and **must not** move the feed to `degraded` or `disconnected`. Merging them is the current defect.
2. **The last good snapshot is retained across a 401 and a 403, and is still labelled with its age.** The Founder's context is not destroyed by an expired session.
3. **Every one of the six is distinguishable non-visually**, by the accessible-name prefixes above (§10.9's honesty-accessibility rule).
4. **Never state a cause the response does not support.** If the client cannot tell a 401 from a transport failure, the honest string is `Dev HQ could not be reached, or refused the request. Refresh to find out.` — not a guess. This requires the server contract at §3.6.

## 3.4 Session expiry during a decision — the case that matters most

DESIGN-001 §11.4 already routes an unresolved submission to `UNCONFIRMED`, whose only action is refresh. Session expiry is a **new entry point into that same state**, and it must not acquire a second, weaker path.

**Rule.** If a decision submission returns 401:

1. The decision enters **`UNCONFIRMED`**, not `FAILED`. The Founder does not know whether the decision landed before the session lapsed. Treating it as a clean failure would invite a resubmission — and per §11.7, a blind resubmit of `accept`/`abandon` is exactly what NB-1 turns into a corrupted task state.
2. The confirmation dialog stays open and shows: **`Your session expired while this decision was being sent. We could not confirm it. Sign in, refresh, and check before deciding again. Do not resubmit.`**
3. The only control is `Sign in and check`. **No retry, at any breakpoint.**
4. After re-authentication the Founder returns to the **record**, not to Home, with the refreshed authoritative state applied.

**This is the single most consequential addition in §3**, because it is the intersection of the two defects the product already knows about: NB-1's replay hazard and the absence of an expiry state.

## 3.5 "Insufficient role or authority" — specified honestly for a one-principal system

DESIGN-001 assumption **A2** is that the Founder is the only user; the roadmap's §2 Delegated Authority Levels (L0–L5) and §17 fine-grained authority describe an **agent** authority model, and multi-user/RBAC is Phase 2 (SPRINT-1F-PLAN §3.2).

**Design position, stated as one:** in Phase 1 there is one principal and that principal holds L5. **A 403 therefore does not mean "your role is insufficient" and must never say so** — inventing a role hierarchy the system does not have is exactly the class of fabrication §2 forbids. A 403 in Phase 1 means one of three things, and the copy names which:

| Refusal reason | Copy |
| --- | --- |
| `not_permitted_for_principal` | **Dev HQ refused this action for this account.** `Dev HQ records one principal, so this indicates a configuration problem rather than a permission you lack. The recorded reason is below.` |
| `action_not_available_in_state` | **This action is not available for this record right now.** `<verbatim recorded reason>` |
| `refusal_reason_not_recorded` | **Dev HQ refused this action and did not record a reason.** `This is a defect. The request id is below.` |

**When multi-user arrives in Phase 2**, `not_permitted_for_principal` gains a role-bearing variant. The token exists now so the surface does not need restructuring then.

## 3.6 Server contract required to make §3.3 renderable

Restates **DESIGN-002 P-9** with the field-level detail the copy above needs. **Consumer requirement, not a backend design.**

| # | Requirement |
| --- | --- |
| P-9a | 401 and 403 are **structurally distinguishable from a transport failure** in what the client observes — a parsed body, not an inferred status |
| P-9b | 401 carries whether a prior session existed, so *unauthenticated* and *session expired* render differently |
| P-9c | 403 carries a machine-readable `refusalReason` from the §3.5 vocabulary, plus a human-readable string rendered **verbatim** |
| P-9d | Every refusal carries a request id, so `refusal_reason_not_recorded` is reportable |
| P-9e | The destination is preserved across re-authentication and returned to the client, satisfying SPRINT-1F-PLAN **F-10** |
| P-9f | 5xx is distinguishable from a network failure at the client |

## 3.7 FD-5 interaction — settled now versus mechanism-contingent

FD-5 (auth mechanism: passkey / single strong credential / hosted IdP) is unresolved, and it changes screen shape. **It does not block most of this specification.**

**Settled now, mechanism-independent — approvable today:**

- View 21's existence, route, placement, states, prohibitions, and accessibility.
- The unauthenticated shell and its exclusion of all Dev HQ state.
- All four §4.4 failure rows and every copy string in §3.3 and §3.5.
- The §3.4 expiry-during-decision rule — **the highest-value item here, and entirely mechanism-independent.**
- Snapshot retention across 401/403; the rule that auth outcomes are not feed statuses.
- Destination preservation as a requirement.
- The `SessionStatus` and `RefusalReason` tokens; the `ActionabilityNotice` states; the forbidden strings.
- Every accessibility requirement.

**Mechanism-contingent — cannot be settled until FD-5:**

| Contingent item | Why |
| --- | --- |
| The credential control itself | A passkey is one button; a shared credential is a labelled field; an IdP is a redirect with a return leg and an interstitial |
| Whether re-authentication can happen **inline** in a sheet or requires a **full-page** redirect | Passkey and credential support inline; most IdP flows do not. Inline preserves the decision context; redirect must reconstruct it — which is why P-9e is stated as a requirement now |
| Session-expiry warning lead time and whether an `expiring` state renders at all | Depends on whether the mechanism exposes remaining lifetime |
| Whether sign-in failure can name a cause | Security-dependent. §3.2 prohibition 3 is the safe default and stands until a mechanism justifies relaxing it |

**Recommendation, labelled as one:** approve the mechanism-independent set now. It is roughly 85% of the surface and it unblocks G-1 design review for the authentication work. Hold the four contingent items until FD-5.

## 3.8 Additions to the state and vocabulary tables

**§4.3 — one new shared state.**

| State | Definition | Rule |
| --- | --- | --- |
| **Offline (shell only)** | App shell served from cache; no snapshot; no network | Renders the shell chrome with **`Dev HQ has not been reached since this app was opened. Nothing below is current state.`** **Never renders skeletons** — an indefinite skeleton reads as a hung app, not an offline one. All controls disabled. Satisfies AC-10 and RES-10 |

**§7.11 — `SessionStatus`.** `Signed in` · `Session expiring` (mechanism-contingent) · `Session expired` · `Signed out`.

**§7.12 — `RefusalReason`.** The three values in §3.5.

**§7.10 — six additions to the forbidden vocabulary.**

| Forbidden | Why | Say instead |
| --- | --- | --- |
| "Access denied" | Implies a permission model that does not exist | "Dev HQ refused this action" |
| "You do not have permission" | Same, and false for a single L5 principal | The §3.5 reason |
| "Insufficient privileges" / "Unauthorized" (as user-facing copy) | Protocol vocabulary presented as product meaning | The §3.5 reason |
| "Please log in again" (after an unexplained failure) | Presents a guess as a diagnosis | "Your session has expired" — **only** when a 401 with a prior session was observed |
| "Connection lost" (for a 401/403/5xx) | The connection was not lost. This is the current defect | The matching §3.3 headline |
| "Something went wrong" | Names nothing and is unactionable | The verbatim server message plus the matching headline |

**§6.5 — four new `ActionabilityNotice` states:** `unauthenticated` · `session-expired` · `authorization-refused` · `server-error`. Each renders its §3.3 disabled-control string and is bound to its control via `aria-describedby`, per the existing pattern.

**§2.4 — two additive rules.**

1. **Recovery.** Recovery is a transition, not a persistent state. On the first successful poll after `degraded` or `disconnected`, a transient chip reads **`Reconnected — showing state as of 14:36:11.`** for five seconds, announced **politely** and rate-limited under the existing ≤1/30 s rule. Satisfies SPRINT-1F-PLAN **F-3**. Closes **M-4**.
2. **Wake from background.** On `visibilitychange` → visible, the snapshot is immediately marked **`Verifying — this state was loaded 14 minutes ago.`** and **all mutating controls disable** until a fresh poll returns. Satisfies **F-4**. Closes the second half of **M-4**. Rationale: a phone resumed after hours shows a snapshot that looks live and is not, and that is precisely the moment a founder acts fastest.

---

# 4. Resolution of the six DESIGN-001 internal defects (M-7…M-12)

Design-owned, resolved here in specification. **Application requires an authorized DESIGN-001 revision pass; this addendum does not edit that file.**

| # | Defect | Resolution |
| --- | --- | --- |
| **M-7** | §4.1 route column contradicts §3.4 for three views | **§3.4 governs — it is the reconciled scheme and the one the 1F plan aligned to.** §4.1's route column corrects to `/executions/<id>` (View 5), `/cost` (View 13), `/releases` (View 15). §4.1 is a summary index; §3.4 is the definition, and where a summary and a definition disagree the definition wins |
| **M-8** | View 6 scorecard copy contradicts its own v1.1.0 correction in three places | **§6.3's required wording governs and propagates verbatim** to §6.6, §6.12 rule 7, and the §6.13 wireframe: *"Agent performance scorecards are not implemented. Whether they belong to Sprint 1F is an open conflict between ADR-0001 D8 / ADR-0002 D-E6 and the approved 1F scope; the Founder has not ruled."* §6.12 rule 7 is **replaced**, not edited: *"Must not present the scorecard slot as deferred, as in scope, or as a defect. Two governing documents conflict and the Founder has not ruled."* Reinforced by §2.4 X-4: the roadmap adds a data point and settles nothing |
| **M-9** | View 14 delivery prohibitions contradict the rewritten §8.6 | **§8.6's three-part recordable-delivery rule governs**; View 14 becomes conditional on the same trigger §8.6 already uses. §14.3 gains a leading clause: *"Until 1F-10 lands, notifications are derived in the browser and nothing is delivered anywhere. After 1F-10 lands, delivery is stated only from a delivery record."* §14.14 rule 1 is **replaced**: *"Must not state or imply delivery except from a `D-J` delivery record, and must not present 'dispatched' as 'delivered'."* |
| **M-10** | Mobile tab bar is four tabs in §16.5 and §1.14, five in §9.3 | **§9.3's five tabs govern** — `Home · Decide · Work · Ask · More` — because it is the reconciled position and `Ask` is a canonical scope item. The §16.5 and §1.14 wireframes are re-cut to five. **The Q-2 fallback is preserved and made explicit in both wireframes:** if the conversation surface is deferred, the fifth tab is `Proof`, never an empty `Ask` |
| **M-11** | §14.10 handoff summary stale — "16-view inventory", "4 mobile tabs" | Corrected to **twenty views and five tabs**, with the four v1.1.0 additions named (Views 17–20). §14.10 is a handoff summary whose entire purpose is to be read alone; a stale one is worse than none |
| **M-12** | §2.5 anchored to `057e12c`, superseded by `d922f379` | **Re-anchor to `d922f379` and re-verify every row.** One row is already known to have changed: `execution.assignment_deferred` and `execution.claim_lost` now exist (`lib/dev-hq/constants.ts:77,79`), so the *"a declined dispatch emits zero events"* basis in §2.5 and §15.5 is superseded and wait reason **W4** is now event-backed. **The remaining rows are re-verified in that pass, not assumed** — DESIGN-001 §16.9's own recommended sequence already requires this before integration |

**M-7 through M-11 are editorial and carry no decision.** **M-12 requires a verification pass, not a judgment.** None of the six needs a Founder decision, and none should be allowed to hold up FD-1.

---

# 5. Task 3 — Does the proposed ruling advance the verdict?

**The ruling under consideration:** *"Approve DESIGN-001 as the Sprint 1F design baseline, subject to a required Design addendum for authentication, authorization, permission-denied states, and internal defects."*

## 5.1 What the ruling resolves

| DESIGN-002 blocker | Effect of the ruling |
| --- | --- |
| **1 — DESIGN-001 not approved (X-1)** | **RESOLVED OUTRIGHT.** This is the ruling's whole substance. It also fixes the Entry Package §7 mislabel by making it true |
| **2 — Missing auth / permission UX (M-1, M-2)** | **RESOLVED CONDITIONALLY, on a credible path.** §3 is the required addendum. ~85% is mechanism-independent and approvable today; four items are FD-5-contingent and are isolated so they do not block the baseline |
| **Internal defects (M-7…M-12)** | **RESOLVED IN SPECIFICATION** (§4). Editorial; no decision needed |
| **4 — Roadmap (partly)** | **Conformance half discharged** by §2 — independently of the ruling |

**That is real progress: one blocker eliminated, one on a path, six defects specified, one closed decision (FD-11).**

## 5.2 What the ruling does not resolve — and I will not soften this

**FD-3 (ADR-0002 E5 timeline placement) remains independently blocking.** ADR-0002 E5 places the timeline merge *"in the Mission Control view-model layer"* — the browser — while SPRINT-1F-PLAN §8.3 specifies a server endpoint and the standing principle requires server projection. **A design approval cannot amend an ADR.** The roadmap says so in its own voice (`:109`: *"Approved ADRs and recorded decisions control architecture and policy"*), and `CURRENT_PROGRESS_UPDATE.md` §5.2 lists the E5 amendment as **D-9, OPEN, a Track B blocker**. Approving DESIGN-001 changes none of that. It blocks work items **1F-1** and **1F-14** specifically — the timeline read-model and panel — which are the centrepiece of roadmap requirements R3 and V2.

**FD-4 (Q-1) and FD-5 (Q-5) remain independently blocking**, and not on my say-so. `CURRENT_PROGRESS_UPDATE.md` §5.2 — the document the roadmap itself designates authoritative for *"current sprint, candidate, owners, reviews, blockers, next gate"* — states plainly: **"Track B — Mission Control Lite. Authorization: NOT AUTHORIZED. BLOCKED. Must not begin."** with D-2/Q-1, D-6, D-7, D-8, D-9 all OPEN and frontend test infrastructure **ABSENT — verified**. FD-5 additionally shapes part of the very addendum the ruling requires (§3.7), so the addendum would be accepted knowingly incomplete.

**Four new roadmap-derived scope decisions are now open that were not open before** — FD-25 (portfolio/milestone, RC-1), FD-26 (the four V7 actions, RC-2), FD-27 (Review Center candidate identity, RC-3), FD-28 (current action, RC-4). **These are scope, not polish.** RC-2 is the sharpest: the roadmap names four founder actions, three of which the Phase 1 domain **cannot record**, and DESIGN-001 refuses them on ADR grounds. A design baseline approved without ruling on RC-2 is a baseline that visibly does not satisfy roadmap §7 V7.

**ACR-001 X-8 remains `[V] BLOCKING` and is upstream of my own conformance work.** Four of my findings are **[TIER-UNVERIFIED]** — they rest on the roadmap alone, and under CPU-001 §1.3 that makes them *"unverifiable-tier premises."* Approving a design baseline against requirements whose authority tier is unestablished is exactly the ambiguity the ruling is trying to close.

**X-7 (reviewer verdict vocabulary) is `[V] BLOCKING` with five incompatible sets in force.** No DESIGN-001 change is needed today, but the Review Center cannot ship reviewer verdicts until it closes.

## 5.3 Honest answer

**The ruling advances the verdict materially. It does not reach UX READY WITH DECISIONS.**

**Revised verdict: UX BLOCKED — substantially narrowed.**

The character of the block has changed, and that is worth stating precisely. Before this pass, Sprint 1F was blocked partly because **the design authority was unsettled and two required surfaces did not exist**. After the ruling plus this addendum, it would be blocked because **decisions that are not Design's are unmade** — an ADR amendment, a deployment target, an auth mechanism, an authority tier, and four roadmap scope questions. **That is a better place to be blocked, and it is a shorter list.** But it is still blocked, and the shortest honest description is: *the design would be approved and the sprint still could not start.*

## 5.4 Every decision that would still block implementation after the ruling

| # | Decision | Owner | Blocks | Independently blocking? |
| --- | --- | --- | --- | --- |
| **FD-3** | Amend ADR-0002 E5 — timeline in the browser view-model or a server projection | Founder + Architecture Reviewer | 1F-1, 1F-14; roadmap R3 / V2 | **YES.** A design approval cannot amend an ADR |
| **FD-4** | Q-1 deployment target and persistence | Founder | Track B phases B–E | **YES.** CPU-001 §5.2 |
| **FD-5** | Q-5 authentication mechanism | Founder | 1F-6 (critical path), and 4 items of the required addendum | **YES**, and it partially blocks the addendum the ruling demands |
| **FD-6** | Q-9 dependencies — auth, web-push, jsdom | Founder | 1F-6, 1F-10, 1F-19a → all UI validation | **YES.** No component test can run today |
| **FD-7** | NB-1 disposition and the mobile Family B gate | Founder | Mobile escalation resolution; §3.4's expiry rule assumes it | **YES.** Confirmed defect |
| **FD-26** | RC-2 — the four V7 actions the roadmap requires and the domain cannot record | Founder, possibly via ADR | Roadmap §7 V7 conformance | **YES** |
| **FD-25** | RC-1 — portfolio and milestone status | Founder | Roadmap §7 V1 conformance | Material, not implementation-blocking |
| **FD-27 / FD-28** | RC-3 candidate identity + 2 fields; RC-4 current action | Founder + Engineering | View 7, the `DecisionHeader` | Material, not implementation-blocking |
| **X-8** *(ACR-001)* | Roadmap and handbook authority tier | Founder | Adjudication of FD-25…FD-28 and four `[TIER-UNVERIFIED]` findings | **YES, indirectly** — it gates the ability to settle the others |
| **X-7** *(ACR-001)* | Reviewer verdict vocabulary — five sets in force | Founder | Review Center verdict rendering | Blocks that surface only |
| **FD-8** | Q-6 scorecards + ADR-0002 amendment | Founder | View 6 slot copy | Blocks copy only |
| **FD-15** | Light-theme scope vs STANDARD-011 | Founder / Product Owner | AC-15, STANDARD-011 conformance claims | Blocks the conformance claim |
| **D-8** *(CPU-001)* | Missing handbooks and standards | Director of Operations | G-2 completeness — *"a gate cannot certify against a standard that does not exist"* | **YES**, for the review gates |

**Seven items are independently blocking after the proposed ruling.** Five of them (FD-3…FD-7) were already blocking and are untouched by it.

## 5.5 What would reach UX READY WITH DECISIONS

**JUDGMENT, offered as a recommendation.** Extend the proposed ruling with three clauses:

1. **Rule on RC-2 (FD-26)** — either accept that `pause`, `resume`, and `request-change` are deferred until the domain can record them (with the roadmap §7 V7 gap recorded as approved-absent, in the manner Sprint 1E established for deferrals), or authorize the domain work. Confirm `priority` as read-only for 1F.
2. **Settle FD-3** — the ADR-0002 E5 amendment. It is the one blocker that is purely a documentation act with no dependency on anything else, and it unblocks the sprint's centrepiece.
3. **Route FD-2 to ACR-001 X-8 and retire it as a duplicate**, so one register owns the authority-tier question.

With those three plus the proposed ruling, the remaining blockers are **FD-4, FD-5, FD-6, FD-7** — all deployment and dependency decisions, none of them UX, all of them already tracked as Track B blockers by CPU-001. **At that point the honest verdict is UX READY WITH DECISIONS**, because nothing Design owns would be unresolved.

---

# 6. Confirmation and handoff

**Files created by this pass: exactly one** — `docs/plans/SPRINT_1F_MISSION_CONTROL_UX_CONTRACT_RECONCILIATION.md`.

**Files modified: none.** DESIGN-002 is not edited; DESIGN-001 is not edited; `MASTER_ROADMAP.md`, ACR-001, CPU-001, POH-001, the Entry Package, the plan, the ADRs, and every standard and handbook were **read only**.

**No implementation code was changed.** Nothing under `app/`, `components/`, `lib/`, `types/`, `data/`, `public/`, or `trigger/` was touched. **Nothing was committed, staged, tagged, or pushed.** No validation command was executed and no claim here rests on test output. **No Phase 2 work was started** — §2.6 and RC-5 identify Phase 2 material only to keep it out of Sprint 1F.

**No cross-authority conflict was resolved.** RC-1…RC-4, X-11…X-13, and FD-25…FD-28 are recorded with sources, governing authority, and decision owner. Where I hold a view I have labelled it **JUDGMENT** or **recommendation**.

**Task name:** Sprint 1F Mission Control UX contract reconciliation — roadmap pass.
**Responsible role:** Claude Design Engineer (AGENT-004 / ROLE-014).
**Status:** Complete. Verdict **UX BLOCKED — substantially narrowed**.
**Intended next owner:** Sprint 1F coordinator, then **Founder** for FD-3, FD-26, and the extended ruling in §5.5.

**Validation performed:** documentary and static inspection only. Roadmap read at §§2, 3, 5, 6, 7, 8, 9, 10, 17, 21 and Appendices A–C, plus the full registration record and heading scan. ACR-001, CPU-001, and POH-001 read in the sections bearing on authority, verdicts, and Sprint 1F state. Every absence claim established by at least two differently-shaped searches re-run immediately before writing.

**Not validated:** the DOCX→Markdown conversion (`:45-47` discloses it is unverified line-by-line; a governance-baseline gate item). ACR-001 and POH-001 read in part, not in full. No usability, contrast, performance, or screen-reader validation — none is possible in a documentary pass and none is claimed.

**Recommended next action:** accept §3 as the required Design addendum for the mechanism-independent set; apply §4 to DESIGN-001 in an authorized revision pass; route FD-2 into ACR-001 X-8; and put FD-3 and FD-26 in front of the Founder, in that order.
