# Governance and Documentation Update Plan — Reconciled Against All Present Specialist Drafts

**Document ID:** GOV-PLAN-001
**Version:** 0.3.0 (supersedes 0.2.0 and the 0.1.0 scratchpad draft)
**Status:** SPECIALIST DRAFT — planning only. **Nothing here is approved policy.** No governance
document was edited. Untracked and uncommitted.
**Workstream:** Governance and documentation planning
**Owner:** Director of Operations (proposals); Founder (all reserved decisions)
**Authority:** CONST-001, GOV-001, ORG-001, AGENT-001 (`AGENTS.md`), ADR-0001, ADR-0002
**Baseline inspected:** `validation/sprint-1e-overnight-2026-07-26` @ `6301c06`, working tree
including five untracked specialist drafts

> **v0.3.0 revision note.** v0.2.0 was written against `357f03b`. The tree moved during
> authoring: the **Context Lifecycle Manager specification appeared** (v1.1.0, untracked) and
> **five remediation commits landed**, including CR-1E's complete patch specification. Two of
> this plan's most serious findings changed as a result — **X-4 is closed by demonstration** and
> **X-3 has moved rather than resolved**. Both are corrected in place below rather than
> silently revised, per GOV-001:359-360.

---

# 0. What this pass did, and what it could not do

## 0.1 Inputs actually read

| Input | Path | State |
|---|---|---|
| Sprint 1F plan | `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | present, untracked, read in full structure + §2.6, §16, §18, §20 |
| Mission Control UX specification | `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` | present, untracked, read §12 + §14 in full |
| Phase 2 program plan | `docs/plans/PHASE_2_PROGRAM_PLAN.md` | present, untracked, read §0.3–§0.4, §1.3, §2.7, §14, §17 |
| Research backlog | `docs/research/RESEARCH_BACKLOG.md` | present, untracked, read §6 escalations, R-16, §7 |
| **Context Lifecycle Manager spec** | `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` | **v1.1.0, present, untracked** — appeared during this pass. Read §0, §4.7–§4.8, §13.3, §14.0–§14.1, §14.8–§14.9 |
| Sprint 1E remediation records | `ISSUE_MATRIX.md` (+Part 2b), `WORKFLOW_DIAGNOSIS.md`, `VALIDATION_REPORT.md`, `RUN_LEDGER.md` | committed at `6301c06` |
| **Sprint 1E patch specification** | `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` | **committed at `d4a798e`…`6301c06`** — appeared during this pass. 1,168 lines, four-commit plan, AR-1E rulings, CR-1E amendments |
| Sprint 1E completion record | `docs/plans/SPRINT_1E_COMPLETION_NOTES.md` | committed |
| Current ADRs | `ADR-0001`, `ADR-0002` | committed |

## 0.2 Inputs named in the assignment that do NOT exist in the tree

Stated plainly rather than inferred, per `AGENTS.md` §Research and Evidence.

| Missing input | Evidence of absence | Consequence for this pass |
|---|---|---|
| ~~**Context Lifecycle Manager specification**~~ | **CORRECTED at v0.3.0 — it exists.** v0.2.0 recorded it absent, which was true at `357f03b`. It is now present and has been read and reconciled (§4.11). | None remaining. The correction is retained rather than deleted so a reader comparing versions sees why §4.11 appeared. |
| **Founder Interface UX design** | Named by the UX spec as a parallel workstream (§14.5 C1, §14.4 Q1). No such document in the tree. | The UX spec's highest-severity conflict (C1, mandate overlap) **cannot be reconciled here** — one of its two parties is absent. |
| **Master Roadmap v7.1**, Permanent Operating Handbook, Current Progress Update | Confirmed absent by the research backlog's own repository-wide search (E-1a) and independently by 1F I-6. | See §4.6. This is itself a governance finding. |

## 0.3 What this document is not

- Not approved policy. Every row is a proposal.
- Not a resolution of any Founder-reserved decision. §7 lists them; none is answered.
- Not an edit to any ADR, agent definition, handbook, standard, or another specialist's document.
- Not a commit.

---

# 1. Consolidation — duplicate governance proposals merged

Five workstreams independently raised overlapping governance asks. Merged below so the Founder
answers each question once. The **left column is the surviving item**; the right column lists every
source that raised it. `CC-nn` refers to the 0.1.0 draft of this plan.

| Merged item | Raised independently by | Consolidation note |
|---|---|---|
| **G-1 Patch author ≠ reviewer, and how remediation is staffed** | CC-08, CC-15, CC-16 · `WORKFLOW_DIAGNOSIS` §4c/§6.2/§6.4 · Phase 2 C-6 / NEW-5 / Q-8 · Research R-16 | Four sources, one question. **CC-15's rationale is now partly falsified** — see §4.1. |
| **G-2 Reviewer verdict vocabulary** | CC-12, CC-19, CC-20, CC-21 · 1F §16.1–§16.2 | 1F uses the AR vocabulary correctly and names no CR vocabulary. Confirms the gap rather than adding one. |
| **G-3 Both gates before commit, in GOV-001 order** | CC-35 · 1F §16.2 · `SPRINT_1E_COMPLETION_NOTES` §8 | 1F re-derives the 1E corrective action independently. **But 1F §16.1 inverts the order** — §4.4. |
| **G-4 Candidate identity + evidence retention** | CC-06, CC-07, CC-10 · 1F §16.2 (reports committed with the work), §17 | Converges. 1F supplies the enforcement precedent (`agents/*/outputs/`). |
| **G-5 Missing handbooks and standards** | CC-30 · 1F §16.3 · UX I11 · `SPRINT_1E_COMPLETION_NOTES` §7 item 6 (still OPEN) | 1F adds the sharpest framing: *"A review gate whose own standard is missing cannot certify against it."* Scope grows from 2 handbooks to 2 handbooks + 3 standards (`NAMING`, `LOGGING`, `ERROR_HANDLING`). |
| **G-6 ADR numbering ownership** | CC-02 (claimed ADR-0003) · 1F Authority line (claims ADR-0003) · Phase 2 C-2 / NEW-4 (yields, numbers from 0004) | **Three-way collision, two claimants on 0003** — §4.7. |
| **G-7 One decision register per kind** | CC-26 · Research §7 item 7 · Phase 2 Q-1 | Three ID spaces now exist (1E findings, research `R-nn`, Phase 2 `D-nn`). Needs a naming rule, not a merge. |
| **G-8 Governed document home and versioning** | CC-40 · UX OQ-4 / Q10 / GV-1 | UX asks where approved design specs live. Same question as governance-doc versioning. One answer. |
| **G-9 ORG-001 role/tool bindings** | CC-23 · Research E-2 · Phase 2 §0.4 | Phase 2 §0.4 already decides the *principle* at program level. The ORG-001 amendment becomes conforming, not novel. |
| **G-10 Negative-outcome rule as a binding constraint** | CC-02 · Phase 2 §17.3 (adopts it), C-7, Q-5 | Phase 2 asks whether the rule binds **all future** Work Management operations. That elevates it from a remediation patch note to an architectural constraint. |
| **G-11 Threshold and weighting values are versioned policy, not engineering constants** *(added v0.3.0)* | CLM §4.8 / CLM-S9 / CLM-S10 · UX OQ-7, CX-2 · Phase 2 D-2E-2, D-2H-3 | Three workstreams independently reach the same split: **the vocabulary is engineering, the numbers are governance.** The CLM declines threshold ownership on governance grounds and ships every value as `provisional: true` until approved. This is the cleanest cross-workstream convergence in the set. |

**Net effect:** the 0.1.0 draft's 45 rows collapse to **32 distinct governance items**. Eleven were
duplicates of another workstream's ask; three were superseded by better framings; one (CC-15) is
partly falsified; one (G-11) is new and was raised by three workstreams before this one saw it.

---

# 2. Ranked governance backlog

Rank is by **latest point at which the decision can be made without blocking work**, matching the
convention Phase 2 §14 uses.

## 2.1 Required before Sprint 1F implementation

These gate `1F-0` (the plan's own governance gate) or the remediation loop that precedes it.

| # | Item | Why it blocks | Authority | Source |
|---|---|---|---|---|
| **B-1** *(revised v0.3.0)* | Decide who reviews a candidate both reviewers helped author — a third reviewer instance, or a recorded Exception with disclosure | The patch exists and is apply-ready; **the only thing between it and the commit gate is who may certify it** | **Founder** | G-1, §4.1a |
| **B-2** | Fix the CR verdict vocabulary (four conflicting definitions) | Both 1E remediation and 1F G-3 require a CR verdict the documents define four ways | **Founder** | G-2 |
| **B-3** | Confirm the GOV-001 review order and resolve 1F §16.1's inversion | 1F's own gate table contradicts GOV-001's mandated order | **Founder** / Operations | G-3, §4.4 |
| **B-4** | Adopt candidate identity + evidence retention rules | Two reviewers must demonstrably review one artifact; 1E's repro evidence is in an ephemeral scratchpad | **Founder** | G-4 |
| **B-5** | Assign ADR numbers centrally; resolve the 0003 collision | Two workstreams claim ADR-0003 | **Founder** | G-6, §4.7 |
| **B-6** | Resolve the scorecard ownership conflict between ADR-0001 D8 and ADR-0002 D-E6/E9 | Determines 1F scope; two approved ADRs disagree | **Founder** | §4.8 |
| **B-7** | Approve or reject `ISSUE_MATRIX.md`, and commit it | 1F §19 D-1 depends on it; it is untracked and gates 1F-3/1F-12/1F-15 | **Founder** | 1F D-1, Phase 2 D-P3 |
| **B-8** | Close G-5 (missing handbooks + three standards) or record them as accepted absences | 1F §16.3: a gate cannot certify against a missing standard | Operations | G-5 |
| **B-9** | Declare the authority status of the Master Roadmap and the two other external documents | Phase 2 derives authority from documents no reviewer can read | **Founder** | §4.6 |

## 2.2 Required before Phase 2

| # | Item | Why | Authority |
|---|---|---|---|
| **P-1** | Governed agent communication ADR (ADR-0001/0002 invariant) | Blocks 2A-6 and all of 2G; 2A ships communication disabled until resolved | **Founder** |
| **P-2** | `WorkItem` promotion ownership (ADR-0002 E8) | Determines where 2A organization/packet records attach | **Founder** |
| **P-3** | Delegated acceptance authority framework | No governance construct exists for machine-executed Founder authority | **Founder** |
| **P-4** | Reviewer independence under shared providers (R-16) | Role-identity independence passes while model identity collapses | **Founder** |
| **P-5** | ORG-001 conforming amendment (model neutrality) | Phase 2 §0.4 decided the principle; ORG-001 still says otherwise | Founder / Operations |
| **P-6** | Whether the negative-outcome rule binds all future WML operations | Phase 2 Q-5; prevents a parallel failure taxonomy in 2A/2E | Founder, on AR advice |
| **P-7** *(added v0.3.0)* | **Governance-owned numerics as versioned policy** (G-11): thresholds, weightings, binding lifetimes, risk ceilings, attempt bounds — with the CLM's `provisional: true` propagation as the general pattern | Must land before the CLM implements, and before 2E-2 weightings and 2H-3 binding lifetimes; until then every band is provisional by construction | **Founder** / Operations |

## 2.3 Required later (within Phase 1, not gating 1F)

| # | Item |
|---|---|
| **L-1** | `CODE_REVIEW_STANDARD` realignment to the two-gate commit model |
| **L-2** | `TESTING_STANDARD`: assertion strength + diagnostic harness protocol |
| **L-3** | `GIT_STANDARD`: baseline immutability, tree restoration, rejected-patch cleanup |
| **L-4** | `BUG_FIX_WORKFLOW` (WF-002) rewrite; new commit-gate review workflow |
| **L-5** | Templates: CR report fields, new AR report template, run-ledger template |
| **L-6** | `README` directory-map drift (nine documented directories do not exist) |
| **L-7** | `VERSIONING_POLICY`: governance-document class |
| **L-8** | Bounded repair attempts + restoration codified in GOV-001 |

## 2.4 Optional

| # | Item | Why optional |
|---|---|---|
| **O-1** | Promote UX §2 / §7.10 / §11 to governed standards (UX Q6, C5, GV-3) | Genuine value, but declining is coherent: the rules then bind only those views, which the UX spec states and accepts |
| **O-2** | Record the operating model as a CONST-001 Art. XIII operational precedent | Only if the GOV-001 amendments do not already discharge it |
| **O-3** | Merge the three decision registers into one ID space | A naming rule (G-7) achieves most of the benefit at far lower cost than a merge |

---

# 3. Governance items whose owner is another workstream

Recorded so they are not lost, and explicitly **not** taken over by this workstream.

| Item | Owner | Status |
|---|---|---|
| Context-health signal **vocabulary** | CLM owner | **RESOLVED — corrected v0.3.0.** The spec exists and supplies it (CLM §4.7, CLM-S5). The v0.2.0 "no document exists" entry was stale and was flagged back to this workstream by the CLM handoff §7.1 |
| Context-health **thresholds** | **Founder / Operations**, not the CLM | Reassigned by CLM §4.8 on governance grounds; carried as **G-11 / P-7 / F-19**. Until approved, every band renders `provisional` and View 12 cannot show a governed verdict |
| Custody model — extend `AgentAssignment` or stand alone | Architecture Reviewer | CLM OQ-C5. Domain design, not governance |
| Shell / vocabulary / truth-model ownership | Founder or Director of Operations | UX C1; the counterpart workstream is absent |
| Cost instrumentation ownership | Unassigned | UX OQ-6, View 13 has no owner |
| Capability-taxonomy expansion (ADR-0001 O3) | Unassigned | Phase 2 C-10, §17.8 item 7 |
| Persistence / deployment decision | Persistence workstream | 1F Q-1 = Phase 2 P-1; not visible to any present workstream |

---

# 4. The ten explicit reconciliations

## 4.1 Patch author versus reviewer separation

**Governing text.** GOV-001:222-238 — *"Implementation ownership and review authority may never rest
with the same agent for the same work"*; *"A reviewer must not review work it produced, planned, or
directed"*; *"Remediation returns to the responsible owner, never to the reviewer who raised the
finding."* `handbooks/ARCHITECTURE_REVIEWER.md:517` adds: never *"redesign the work rather than
reviewing it."*

**The facts now on the table.**

1. **AR-1E authored the remediation design.** `ISSUE_MATRIX.md` Part 1 is AR-1E's specification —
   the throw/absorb rule, the single moving precondition, two event types with dedupe keys, six
   emitting sites, and the emitter location. If AR-1E then reviews the patch, it reviews work it
   planned and directed.
2. **`WORKFLOW_DIAGNOSIS` §6.4 already states the rule**: *"Designer and reviewer must be different
   agents. Patches derived from AR-1E's design are specified independently by ENG-SPEC; AR-1E
   reviews the result but does not review its own design rendered as patches."*
3. **That mitigation has failed in practice.** §4c: ENG-SPEC (a `general-purpose` agent) produced
   nothing. Four consecutive freshly-spawned agents across two types, all asked to produce exact
   patch text, delivered zero; two long-lived reviewer agents delivered nine. **Root cause UNKNOWN.**
4. **Phase 2 C-6 escalates the same finding** as *"the most serious operational finding in this
   handoff"* and explicitly refuses the workaround — a coordinator writing the work and describing
   the review as independent.

**Correction to this plan's own 0.1.0 draft.** CC-15 recommended granting the Lead Software Engineer
`Write`/`Edit` on the reasoning that it *"removes an entire class of impossible assignments."* That
reasoning is now **partly falsified**: `WORKFLOW_DIAGNOSIS` §4b/§4c eliminate the tool boundary as
the general cause of non-delivery. The grant mismatch was real for LSE-1E's first assignment and
remains a genuine documentation defect, but **it is not the delivery fix and must not be presented
as one.** CC-15 is retained at reduced strength: align the grant to the role for coherence, expect
no delivery improvement.

## 4.1a v0.3.0 UPDATE — the blocker resolved itself, and the conflict moved

**A specification was delivered.** `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md`
is a 1,168-line `COMPLETE SPECIFICATION` from **CR-1E**: a four-commit plan, exact FIND/REPLACE
blocks re-read from the tree rather than reconstructed, grep-verified blast radius, an expected end
state of 22 files / 320 tests, and per-commit gate commands.

**Consequence for X-4.** The claim that no actor can produce an implementation specification is
**falsified by demonstration.** CR-1E is simultaneously a *long-lived resumed agent* (Phase 2 C-6
mitigation (a)) and was given a *review-shaped deliverable* (mitigation (b)), so the success is
consistent with both hypotheses and **identifies neither as the mechanism.** The four earlier
failures remain unexplained. What changed is the blocker, not the diagnosis.

**Consequence for X-3 — the separation problem moved; it did not resolve.** The patch spec opens
with its own independence claim: *"CR-1E never saw AR-1E's policy before this assignment, so these
patches are not AR-1E reviewing its own design."* That is correct and it discharges the original
concern. But the arrangement that produced it creates a new one:

| Actor | What it contributed | What it can no longer do |
|---|---|---|
| **AR-1E** | Authored the negative-outcome policy (`ISSUE_MATRIX` Part 1); then issued **rulings on four flagged deviations** whose amendments *"supersede the blocks above"* | Architecture-review a candidate it **directed** — GOV-001:227 covers *produced, planned, **or directed*** |
| **CR-1E** | Authored the complete patch specification | Code-review the implementation it specified — GOV-001:227, and :233 *"does not rewrite the implementation it reviews"* |
| Coordinator | Applies verbatim; pre-verified all 16 anchors | Review its own application (already excluded) |

**Neither reviewer is now clean for its own gate on this candidate.** This is a sharper statement
than v0.2.0's, and a less comfortable one: the workaround that unblocked delivery consumed the
independence of both gates.

**Reconciled position (revised).** The rule stays intact; the routes narrow to three:

| Route | Assessment |
|---|---|
| (a) A third reviewer instance, uninvolved in specification, performs one or both gates | Cleanest. Costs one more agent, and the run has shown fresh reviewer-shaped tasks can succeed |
| (b) Founder-recorded Exception with disclosure (§8 E-A) | Available now. The run is **already practising the compensating controls** — see below |
| (c) Human review of the patch before application | Always available; slowest |

**What is already true and should be credited.** The compensating controls E-A proposes are largely
in place: independence reasoning disclosed in the spec header; AR-1E asking that the framing of its
own error be recorded precisely (*"the reviewer's shorthand lost his own rule"*, not *"the reviewer's
policy was contradictory"*, because the two *"have different implications for how far the rest of its
specification should be trusted"*); the coordinator pre-verifying every anchor and flagging the one
duplicate FIND (`execution-manager.ts:564` vs `:603`) that would have silently converted a
caller-fault throw into an absorption. This is disclosure discipline of the kind an exception
requires, applied before anyone asked for it.

**Still not permitted under any route:** presenting either gate as independent without recording
which of its inputs the reviewer authored.

## 4.2 Temporary independence exceptions

**No new mechanism is needed.** GOV-001:474-488 already defines an Exception: standard waived,
reason, scope, risks, compensating controls, **expiration or review date**, approver. CONST-001
Art. XIII adds that exceptions may not silently become permanent, and GOV-001:488 that recurring
exceptions trigger review of the underlying standard.

**Reconciled position.** If the Founder chooses to proceed with remediation before the separation in
§4.1 is satisfiable, that is an **Exception to GOV-001 §Separation of Implementation and Review**,
not a reinterpretation of it. It must carry:

- the exact clause waived (GOV-001:227 and/or :234-235);
- the compensating control — at minimum, the reviewer that authored the design is barred from being
  the *sole* approver, and the second reviewer must be one that did not contribute to the design;
- an expiration tied to a named event (root cause identified, or Phase 1 exit), not a date;
- the Founder as approver, recorded in the remediation record.

**This plan proposes the vehicle. It does not grant the exception.**

**Phase 2 forward-look.** R-16 shows the same rule fails differently once real models fill both
roles: independence defined by *role identity* passes while *model identity* collapses. The Exception
mechanism does not cover that; ADR #15/#17 do (P-4).

## 4.3 Reviewer verdict vocabulary

Four definitions of the Independent Code Reviewer's verdict now coexist:

| Source | Vocabulary |
|---|---|
| GOV-001:247 | "Approve or reject" |
| GOV-001:124-145 (Approval States) | Approved / Approved with **Limitations** / Changes Required / Rejected / Escalated |
| EMP-QA-001:174-212 | Approved / Approved with **Recommendations** / Changes Required / Rejected / Escalated |
| AGENT-008 + `.claude/agents/independent-code-reviewer.md:3` | "explicit approve/reject decision" |

Plus two severity ladders: EMP-QA-001:119-171 (*Informational*) versus
`handbooks/ARCHITECTURE_REVIEWER.md:129` (*OBSERVATION*).

**The Architecture Reviewer has no such problem.** GOV-001:284-302 fixes exactly three strings and
forbids any other; the handbook (`:414-431`) restates them identically; 1F §16 uses them correctly.

**Recommended authoritative vocabulary** — see §9. **Founder decision (B-2).**

## 4.4 Architecture-review authority

Three distinct questions, three different answers.

**(a) Order.** GOV-001:174-179 places Independent Code Review at step 4 and Architecture Review at
step 6, and :185-189 states the reason: *"Code review precedes architecture review deliberately …
Running the two concurrently is permitted only when Operations records the decision."*
**`SPRINT_1F_MISSION_CONTROL_LITE.md` §16.1 lists G-2 Architecture review before G-3 Independent code
review.** §16.2 fixes only that both run before commit, and is silent on their relative order.
Recorded as contradiction X-2. **The 1F owner must correct or justify it; this workstream will not
edit their document.**

**(b) Scope of authority.** GOV-001:214-220 gives the AR the architectural commit-gate verdict and
explicitly withholds product, scope, and priority decisions. 1F §16.1's G-2 description is consistent
with this. No conflict.

**(c) The interpretation request.** Phase 2 Q-6 asks the AR whether brokered messaging is *compatible
with* ADR-0001/0002's invariant or a **material deviation**. This is within the AR's authority to
**answer** — `handbooks/ARCHITECTURE_REVIEWER.md:207` requires exactly this distinction, between a
violation of a decision and a gap the ADR never addressed. It is **outside** its authority to
**authorize**. Reconciled: the AR issues a compliance opinion; only the Founder may approve a
deviation; the vehicle is an ADR (P-1). Phase 2's own position (§1.3, DM-9) already matches this.

## 4.5 Communication-broker conflict with ADR-0001/0002

**The conflict is real and correctly escalated.** ADR-0001 Problem Statement: *"Agents do not
primarily communicate directly with each other."* ADR-0002 Problem Statement, E7: *"no direct
agent-to-agent communication."* Phase 2 stages 2A-6 and 2G require brokered exchange.

**This plan does not rewrite either ADR** and was not instructed to. Its governance position:

1. The reconciliation Phase 2 §1.3 proposes — *governed, brokered, non-authoritative* traffic through
   the Work Management Layer — is plausible but **is an interpretation of an approved ADR**, which
   `AGENTS.md` §Governing Authority forbids an agent from selecting unilaterally.
2. Phase 2's chosen conduct is correct: record, block 2A-6 and 2G, ship 2A with communication
   disabled (DM-9), decide nothing.
3. What governance must add is only the **route**: AR compliance opinion (§4.4c) → Founder decision
   D-P4 → superseding or amending ADR → unblock. No governance document needs to change to permit
   this; GOV-001 §Reviewer Escalation and §Exceptions already carry it.

**Ranked P-1. Not required before Sprint 1F** — no 1F surface depends on it.

## 4.6 Roadmap authority when the canonical roadmap is outside the repository

**Facts.** `PHASE_2_PROGRAM_PLAN.md` §0.3 establishes an authority ordering that includes three
documents — Master Roadmap, Permanent Operating Handbook, Current Progress Update — and places the
roadmap above the plan for *"long-term capability direction."* §1.3 states that roadmap §2 reserves
ADR deviation to the Founder. **None of the three exists in the repository**, established by
repository-wide search in the research backlog (E-1a) and independently by 1F I-6.

**Two governance problems, not one.**

1. **Verifiability.** GOV-001:369-371 requires that an asserted ADR, standard, or contract violation
   *"quotes the text being applied. A constraint may not be paraphrased into existence."* Claims
   traced to the roadmap cannot satisfy this from the repository. A reviewer cannot certify against
   a source it cannot open.
2. **Authority tier.** `AGENTS.md` §Governing Authority enumerates eight tiers — Constitution, CEO
   decisions, governance, standards, requirements, department handbooks, workflow instructions, task
   instructions. **A roadmap tier does not appear in it.** §0.3 therefore asserts an authority
   ordering that the universal handbook does not recognize. Whether the roadmap is (i) a Founder
   decision record, (ii) an approved requirements document, or (iii) something outside the model
   entirely changes where it sits and what may cite it.

**Reconciled position.** The research backlog's recommendation — commit it, following precedent
`8310bbb` — resolves (1) but not (2). Both need answering. Recommended: commit or formally register
the roadmap **and** state which `AGENTS.md` tier it occupies. Until then, every roadmap-derived claim
in the Phase 2 plan is an **unverifiable premise**, which the plan should mark as such.

**Founder decision (B-9), with Operations owning the registration.**

## 4.7 ADR numbering ownership

**Three-way collision.**

| Claimant | Number | Subject |
|---|---|---|
| `SPRINT_1F_MISSION_CONTROL_LITE.md` Authority line | **ADR-0003** | persistence / deployment / transport / auth (§20 Q-1) |
| This plan, 0.1.0 draft CC-02 | **ADR-0003** | negative-outcome representation |
| `PHASE_2_PROGRAM_PLAN.md` §2.7 / C-2 | yields; numbers from **ADR-0004** | 23 candidates |

**This workstream yields.** The 1F claim is earlier, is load-bearing for Phase 2 precondition P-1,
and Phase 2 has already deferred to it. **CC-02's negative-outcome ADR is renumbered to whatever the
Founder assigns; this plan no longer claims a number.**

**Reconciled rule (proposal):** ADR numbers are assigned by the Founder, or by the Director of
Operations under a recorded delegation, at the moment an ADR is *authorized* — never claimed by a
drafting workstream. `templates/ARCHITECTURE_DECISION_RECORD.md` and `VERSIONING_POLICY.md`
§ADRs are the enforcement surfaces. **Founder decision (B-5)**, matching Phase 2 NEW-4.

## 4.8 Scorecard ownership conflict

**Two approved ADRs give opposite answers.**

| Source | Text | Placement |
|---|---|---|
| ADR-0001 **D8** (`:146-148`) | *"Scorecards: deferred to Phase 2 … out of Phase 1 scope unless they become required for Phase 1 acceptance"* | **Phase 2** |
| ADR-0002 **D-E6 / E9** (`:215-217`, `:230`) | *"Scorecards and analytics are deferred to **Sprint 1F**"* | **Sprint 1F (Phase 1)** |

**A third position exists.** `PHASE_1_MISSION_CONTROL_LITE_UX.md` A4 assumes 1F's approved scope
includes *"the scorecard domain."*

**A factual error must be recorded.** `SPRINT_1F_MISSION_CONTROL_LITE.md` §20 Q-6 states: *"ADR-0001
D8 and ADR-0002 D-E6/E9 **both** place scorecards in Sprint 1F."* **ADR-0001 D8 does the opposite.**
`PHASE_2_PROGRAM_PLAN.md` C-3 reads both correctly. The 1F plan's *conclusion* (scorecards out of
1F) is the one this workstream would also recommend — but its stated basis is wrong, and a conclusion
resting on a misquoted ADR cannot be approved as-is under GOV-001:369-371. **Correction belongs to
the 1F owner.**

**Reconciled position.** Three documents, two answers, one misquote. **Founder decision (B-6).** If
scorecards land in Phase 2, ADR-0002 D-E6/E9 requires an amendment so permanent history does not
carry a contradiction — which 1F Q-6 itself anticipates.

## 4.9 WorkItem promotion ownership

**Facts.** ADR-0002 **E8** defers the `Project → WorkItem → Task → Execution → AgentAssignment`
hierarchy. Phase 2 C-4 states its 2A/2B records attach to `Task`/`Execution` and that *"whoever
promotes `WorkItem` changes where organization and packet records attach"*; Q-7 asks who owns it;
A-13 assumes it can be promoted before 2A-1 or re-parented later. **1F touches the same seam from the
other side:** §20 Q-3 option (a) — building roadmap/sprint/release as domain entities — would require
*"an ADR-0002 E8 hierarchy amendment."*

**Reconciled position.** E8 has **no owner in any present document**, and two workstreams now depend
on it from opposite ends. This is not an architecture decision this workstream may make. What
governance can state:

- E8's owner is the ADR-0002 owner of record; ADR-0002 lists no maintaining owner, which is itself a
  gap worth closing when ADR ownership is formalized (§4.7).
- The decision has a **cheaper interim**: 1F's Q-3 has converged on Design's fourth option (render
  sprint membership as `⚠ preview` from planning documents, no entity), which avoids touching E8 in
  Phase 1 entirely. If the Founder takes that route, E8 becomes a pure Phase 2 question.

**Ranked P-2. Founder decision**, matching Phase 2 NEW-2.

## 4.10 Delegated acceptance authority

**Facts.** Phase 2 2D-4 builds a *"risk-aware delegated acceptance evaluator"*; D-2D-2 (*which
delegated-acceptance rules the Founder is willing to grant, and their risk ceilings*) and D-2D-3
(*whether HQ may propose its own authority expansion*) are marked **Reserved**. Gate D9 requires
delegated acceptance to **fail closed**. Assumption A-6 notes 2D still passes its gate with no rules
granted. The UX spec §11.2 independently specifies *"Decisions reserved for the Founder."*

**The governance gap.** CONST-001 Art. III and GOV-001:270-280 define what requires Founder approval.
**Neither defines how Founder authority may be delegated to a mechanism.** GOV-001 offers only two
adjacent constructs — Exceptions (waive a standard, time-boxed, human-approved) and CEO override —
and neither is a standing grant executed by software.

**Reconciled position.** Delegated acceptance is not an engineering feature with a governance
footnote; it is **a change to who exercises Founder authority**, and it needs a governance construct
before it needs an evaluator. Minimum shape, proposed not adopted:

1. A delegation is a **record**, not a configuration: scope, risk ceiling, evidence preconditions,
   expiry, revocation, and approver.
2. **Fail closed** — Phase 2's D9 is correct and should be a governance rule, not only a gate.
3. **No self-expansion.** D-2D-3 should default to *no*: a system proposing its own authority
   expansion inverts CONST-001 Art. III. Recorded as a recommendation.
4. Every delegated acceptance produces the same evidence a Founder decision would.

**Ranked P-3. Founder-reserved; not answered here.**

## 4.11 Context Lifecycle Manager — reconciled *(added v0.3.0)*

The CLM specification (SPEC-CLM-001 v1.1.0) is present and has **already reconciled itself against
this workstream** — its reconciliation basis names `GOVERNANCE.md` and `AGENTS.md` explicitly. Three
governance consequences.

**(a) It answers UX OQ-7 by splitting the question, and the split is correct.** UX CX-2 assigned
*"signal vocabulary **and** thresholds"* to the CLM owner. CLM §4.8 accepts the vocabulary and
**declines the numbers, on governance grounds rather than modesty**: *"A threshold decides when work
is stopped … a numeric threshold on context health is an organizational risk posture — how much
degradation Dev HQ tolerates before halting an employee — and AGENT-001 places that class of
decision with the Founder, not with an engineering subsystem."* This workstream endorses the split
without reservation and generalizes it as **G-11**.

**(b) CLM-S10 is a governance mechanism, not a UI convention.** Every constant ships
`provisional: true`, propagates that flag into every derived band, and carries a `policyVersion`
identifying the approving authority, *"so no consumer can present an unapproved threshold as a
governed verdict."* This is the same property GOV-001:373-375 requires of validation claims,
implemented in data. **Recommend adopting it as the general pattern** for any future
governance-owned numeric: weightings (Phase 2 D-2E-2), binding lifetimes (D-2H-3), delegated-
acceptance risk ceilings (§4.10), and repair-attempt bounds.

**(c) It surfaces a contradiction inside the Phase 2 plan.** CLM §14.1 records that Phase 2 states
CLM ownership two ways — **P-5** lists it as a distinct deliverable coordinate with 1F/1G/1H/1I,
while **§3.3** attributes it to *"(1G/1H)"*. The CLM correctly declines to resolve it (sprint
assignment is roadmap authority) and recommends a distinct deliverable sequenced between 1G and 1H.
Recorded here as **X-16**; **Founder decision (F-18)**, and it is downstream of the roadmap-authority
question (§4.6) because sprint assignment is exactly the kind of claim the absent roadmap governs.

**Not reconciled:** OQ-C3 (is the CLM's `QUARANTINED` the same state as 1E's / 2A's "uncertain"?) is
a status-vocabulary question routed to the Lead Engineer and Architecture Reviewer. It is adjacent to
§4.3's verdict-vocabulary problem — **the same failure mode, one layer down: two subsystems naming
one state differently.** Recommend it be answered under whatever vocabulary discipline F-4 sets,
rather than separately.

---

# 5. Contradictions register

Every entry was verified against the cited text during this pass.

| # | Contradiction | Between | Severity | Owner |
|---|---|---|---|---|
| **X-1** | **Scorecards: Phase 2 vs Sprint 1F** | ADR-0001 D8 ↔ ADR-0002 D-E6/E9 (+ UX A4 as a third reading) | **Material** | Founder |
| **X-1b** | **1F Q-6 misquotes ADR-0001 D8**, stating it places scorecards in 1F | `SPRINT_1F…` §20 Q-6 ↔ ADR-0001:146-148 | Material (evidence integrity) | 1F owner |
| **X-2** | **Review order inverted** — architecture gate listed before code review | `SPRINT_1F…` §16.1 ↔ GOV-001:174-179, :185-189 | Material | 1F owner / Operations |
| **X-3** *(restated v0.3.0)* | **Both reviewers have contributed to the candidate.** CR-1E authored the patch specification; AR-1E authored the policy **and** ruled on four deviations whose amendments supersede parts of the spec. Neither is clean for its own gate | `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` ↔ GOV-001:227, :233; AR handbook `:517` | **Blocking** | Founder |
| **X-4** *(closed v0.3.0)* | ~~Independence unstaffable~~ — **falsified by demonstration.** CR-1E delivered a complete 1,168-line specification. Consistent with both Phase 2 C-6 mitigations (a) and (b); **identifies neither as the mechanism**, and the four earlier failures remain unexplained | `SPRINT_1E_REMEDIATION_PATCH_SPEC.md` ↔ `WORKFLOW_DIAGNOSIS` §4c | Closed as a blocker; **root cause still unknown** | — |
| **X-15** *(added v0.3.0)* | **The remediation amends a port, not only internals.** `claimExecution` widens to `Promise<Execution \| null>`, touching `types/contracts/execution-runner.ts:58,68` — which ADR-0001 D7 designates as the concurrency contract a future durable adapter must meet | `ISSUE_MATRIX` Part 2b ↔ ADR-0001 D7 | Material — **not a conflict**; both reviewers support it | Founder (informed approval) |
| **X-16** *(added v0.3.0)* | **CLM sprint ownership stated two ways inside one plan** — Phase 2 **P-5** (distinct deliverable) vs **§3.3** (*"1G/1H"*) | `PHASE_2_PROGRAM_PLAN` P-5 ↔ §3.3, per CLM §14.1 | Material | Founder |
| **X-5** | **ADR-0003 claimed twice** | 1F Authority line ↔ this plan's 0.1.0 CC-02 | Low, permanent-history impact | Founder (yielded by this plan) |
| **X-6** | **Agent communication invariant** | ADR-0001 / ADR-0002 ↔ Phase 2 2A-6 / 2G | **Blocking for Phase 2** | Founder |
| **X-7** | **CR verdict vocabulary defined four ways**; severity ladder twice | GOV-001:247 ↔ GOV-001:124-145 ↔ EMP-QA-001:174-212 ↔ AGENT-008 | Material | Founder |
| **X-8** | **Roadmap authority tier not in `AGENTS.md`**, and the document is absent | Phase 2 §0.3 ↔ `AGENTS.md` §Governing Authority; GOV-001:369-371 | Material | Founder |
| **X-9** | **ORG-001 binds roles to named tools** | ORG-001:95-131, GOV-001:150 ↔ Phase 2 §0.4 | Material | Founder |
| **X-10** | **`WorkItem` (E8) has no owner**, and two workstreams depend on it | ADR-0002 E8 ↔ Phase 2 C-4, 1F Q-3(a) | Material | Founder |
| **X-11** | **Stale cross-workstream deconfliction** — 1F compared against a 641-line Phase 2 draft (final ≈3,749) and a "367-line" UX draft (final 3,701) | `SPRINT_1F…` Cross-workstream table ↔ Phase 2 C-5 | **Material for review integrity** | 1F owner |
| **X-12** | **Gates without standards** — `handbooks/INDEPENDENT_CODE_REVIEWER.md`, `NAMING_`, `LOGGING_`, `ERROR_HANDLING_STANDARD.md` absent | 1F §16.3, UX I11, 1E notes §7.6 ↔ AGENT-008:7 | Material | Operations |
| **X-13** | **Delegated acceptance has no governance construct** | Phase 2 2D-4 / D-2D-2 ↔ CONST-001 Art. III, GOV-001 | Material (Phase 2) | Founder |
| **X-14** | **Mandate overlap** between this UX spec and an absent Founder Interface UX workstream | UX C1 ↔ (counterpart not in tree) | **High, unreconcilable here** | Founder / Operations |

**At v0.2.0 the two that stopped work were X-3 and X-4. At v0.3.0 only X-3 does** — and in a
narrower, more tractable form: a specification now exists, but both gates that must certify it were
partly authored by the reviewers who would sit them. Everything else can be sequenced.

---

# 6. Required ADRs

Consolidated across workstreams. **Numbers are not claimed** — see §4.7.

## 6.1 Required before or during Sprint 1F

| ADR | Subject | Raised by | Status |
|---|---|---|---|
| **A** | Persistence, deployment, transport, authentication | 1F §20 Q-1; Phase 2 P-1 | Claims ADR-0003; required before 1F Phases B–E. **Two constraints must reach it before it is decided:** the amended `ExecutionRunner` port (below) and the CLM's linearizable-CAS floor (CLM-C11 / BL-3) — *"if ADR-0003 lands without linearizable CAS, INV-2 is unenforceable and rollover is unsafe"* |
| **C** *(added v0.3.0)* | Context Lifecycle Manager — custody, checkpoint immutability, restoration gate floor, determinism, and the §4.8 threshold split | CLM handoff §8.1 | **Number not claimed by anyone**; falls outside both the 1F and Phase 2 reservations. Phase 2 §3.9 already depends in writing on CLM INV-1, so an unrecorded invariant is already load-bearing. Numeric thresholds excluded from the ADR by design, so tuning does not require an architecture decision |
| **B** | Negative-outcome representation (throw/absorb, two event types, six emitting sites) | `ISSUE_MATRIX` Part 1; this plan; Phase 2 Q-5/C-7 | Number withdrawn; still required, because the rule spans four services and currently lives in an untracked file |

**ADR A inherits an amended port** *(added v0.3.0)*. `ISSUE_MATRIX` Part 2b discloses that the
remediation widens `claimExecution` to `Promise<Execution | null>` in
`types/contracts/execution-runner.ts` — the very contract ADR-0001 D7 designates for a future durable
adapter. **No ADR-0001 change is proposed**: both reviewers support the widening, it makes the
contract more honest rather than less, and D7's text is not contradicted. What follows is a
dependency: **ADR A must specify its adapter against the amended signature**, and AR-1E's deferred
**AR2-6 port revision** (`claimExecution` return type + `heartbeat`'s missing `assignmentId` + the
handlers' optional parameter, *"one coherent port revision, not three"*) needs a home in the
open-findings register (G-7). Under GOV-001:256-257 this change makes architecture review mandatory,
which is precisely why X-3's gate question must be settled first.

## 6.2 Amendments to existing ADRs (recorded, not drafted here)

| Target | Change | Raised by |
|---|---|---|
| ADR-0002 **E5** | parenthetical → *"read-model and panel in Sprint 1F"* | Pre-existing approved follow-up, 1E notes `:278-279`; 1F §16.3 |
| ADR-0002 **D-E6/E9** | only if the Founder places scorecards in Phase 2 (X-1) | 1F Q-6; Phase 2 C-3 |
| ADR-0001 / ADR-0002 | governed-communication invariant | Phase 2 §1.3 — **Founder-reserved; not drafted** |

## 6.3 Required before Phase 2

Phase 2 §2.7 names six blocking candidates (#1, #2, #3, #7, #12, #14) plus two it added on re-check
(real-agent provider adapters; `WorkItem` promotion). This workstream adds **no new ADR** to that
list and endorses one emphasis: **#15/#17 (independence preservation and the independence guard) are
the Phase 2 successors to §4.1–§4.2** and should not be separated from them.

---

# 7. Founder decisions — recorded, not resolved

Per instruction, none is answered. Grouped by the gate they block.

## 7.1 Before the Sprint 1E remediation loop runs

| # | Decision | Source |
|---|---|---|
| F-1 *(revised)* | Who certifies a candidate both reviewers helped author — third reviewer instance, Exception, or human review (§4.1a) | `SPRINT_1E_REMEDIATION_PATCH_SPEC.md`; Phase 2 NEW-5 |
| F-2 | Whether to grant a temporary Exception to GOV-001 §Separation, and on what expiry | §4.2 |
| F-3 | Approve or reject `ISSUE_MATRIX.md`, incl. Q1 (F4), Q2 (X3/X4), Q3 (seeding) | `ISSUE_MATRIX` Part 3 |
| F-20 *(added)* | **Informed approval of the port amendment** — the remediation changes ADR-0001 D7's designated concurrency contract | `ISSUE_MATRIX` Part 2b |

## 7.2 Before Sprint 1F implementation

| # | Decision | Source |
|---|---|---|
| F-4 | Canonical CR verdict vocabulary and severity ladder | §4.3 |
| F-5 | Confirm GOV-001 review order; resolve 1F §16.1's inversion | §4.4a |
| F-6 | Scorecards: Phase 2 or Sprint 1F | §4.8 |
| F-7 | Central ADR-number assignment | §4.7 |
| F-8 | Authority status and registration of the Master Roadmap | §4.6 |
| F-9 | Candidate identity and evidence-retention rules | G-4 |
| F-10 | Close or accept the missing handbooks and three standards | G-5 |
| F-11 | 1F's own ten consolidated decisions (§20.3) and the UX spec's thirteen (§14.9) | 1F, UX |

## 7.3 Before Phase 2

| # | Decision | Source |
|---|---|---|
| F-12 | Governed-communication ADR (D-P4) | Phase 2 §1.3 |
| F-13 | `WorkItem` promotion ownership (NEW-2) | Phase 2 C-4 |
| F-14 | Delegated acceptance framework and whether HQ may propose its own authority expansion | §4.10 |
| F-15 | Reviewer independence under shared providers | R-16 |
| F-16 | ORG-001 conforming amendment | E-2 |
| F-17 | Whether the negative-outcome rule binds all future WML operations | Phase 2 Q-5 |
| F-18 *(added)* | **Which sprint owns the CLM** — Phase 2 P-5 (distinct deliverable) vs §3.3 ("1G/1H") | CLM §14.1 / OQ-C1; X-16 |
| F-19 *(added)* | **Are governance-owned numerics versioned policy** (G-11 / P-7), and does the `provisional: true` propagation pattern become general? | CLM §4.8 / CLM-S10; UX OQ-7; Phase 2 D-2E-2 |

---

# 8. Temporary process exceptions

Proposed shape only. **Each requires Founder approval under GOV-001 §Exceptions; none is granted
here.** Every one carries the seven required fields: standard waived, reason, scope, risks,
compensating controls, expiration, approver.

| # | Exception | Waives | Compensating control | Expires when |
|---|---|---|---|---|
| **E-A** *(revised v0.3.0)* | Remediation may proceed with **both** reviewers certifying a candidate they helped author — AR-1E ruling on its own policy's application, CR-1E code-reviewing its own specification | GOV-001:227 and :233 | Each report names exactly which inputs its author wrote; neither reviewer certifies the gate covering its own contribution without disclosing it; the coordinator's anchor pre-verification is retained as an independent check. **Most of this is already being practised** — see §4.1a | A reviewer instance uninvolved in specification is available, or Phase 1 exit — whichever is first |
| **E-B** | The coordinator applies patches specified by a read-only specialist | GOV-001:234-235 (remediation returns to the responsible owner) | Verbatim application; the applier never reviews its own application; both reviewers independent of it | A tool-capable implementation actor exists |
| **E-C** | Reviews performed retrospectively where already committed | GOV-001:174-181 order | Disclosed in the record, as Sprint 1E did (`SPRINT_1E_COMPLETION_NOTES` §8) | Immediately — this is a disclosure rule, not a standing permission |
| **E-D** | Phase 2 planning cites an unverifiable external roadmap | GOV-001:369-371 | Every roadmap-derived claim marked as an unverifiable premise | The roadmap is committed or formally registered (F-8) |

**E-C is included because it already happened.** Sprint 1E's reviews were retrospective and recorded
as such. It is listed so the precedent is governed rather than repeated silently — 1F §16.2 already
states no exception is pre-authorized, which this workstream endorses.

---

# 9. Recommended authoritative verdict vocabulary

A recommendation to the Founder (F-4). Not adopted.

**Principle:** the Architecture Reviewer's treatment in GOV-001:284-302 is correct and proven in use
across two sprints. Mirror it for the Independent Code Reviewer rather than inventing a new scheme.

## 9.1 Architecture Reviewer — unchanged

`PASS` · `PASS WITH NON-BLOCKING FOLLOW-UPS` · `FAIL`

Exactly one, no other string valid, no qualification, `FAIL` requires ≥1 unresolved blocker.

## 9.2 Independent Code Reviewer — recommended

`PASS` · `PASS WITH NON-BLOCKING FINDINGS` · `FAIL`

Same rules, same shape, one deliberate difference in the middle term: *findings*, not *follow-ups*,
because the CR's non-blocking output is line-level and belongs to the work, whereas the AR's is
architectural and belongs to the roadmap.

- Exactly one verdict string; no other is valid.
- Every verdict states an explicit **unresolved blocker count**. `FAIL` requires ≥1; `PASS` requires 0.
- Every verdict names the **candidate identity** it was issued against.
- A verdict is void if the candidate changes (GOV-001:333-334, already stated for both roles).

## 9.3 Single severity ladder — both reviewers

`BLOCKER` · `MAJOR` · `MINOR` · `OBSERVATION`

Replaces EMP-QA-001's *Critical/Major/Minor/Informational* and reconciles it with the AR handbook's
*CRITICAL/MAJOR/MINOR/OBSERVATION* (`:129`). `BLOCKER` is the only severity that forces `FAIL`, which
makes the ladder and the verdict mechanically consistent — today "Critical" and "blocker" are
related only by convention.

## 9.4 Mapping to GOV-001 Approval States — unchanged

`PASS` → *Approved* · `PASS WITH NON-BLOCKING …` → *Approved with Limitations* · `FAIL` → *Changes
Required*. A reviewer lacking authority or information issues *Escalated* rather than any of the
three. **GOV-001 §Approval States stays canonical for Operations-level decisions**; the three-string
vocabularies are the reviewer-level surface that maps onto it.

## 9.5 What this retires

EMP-QA-001:174-212's five-state list and AGENT-008's "approve/reject" phrasing become
non-authoritative and must be replaced, not left alongside. Four vocabularies became four because
each new document added one without retiring the last.

---

# 10. COLLABORATION HANDOFF

**Status: specialist draft. Governance and documentation workstream. Not approved policy.**

## 10.1 Decisions made within this workstream's authority

| # | Decision | Basis |
|---|---|---|
| GD-1 | **Yield the ADR-0003 claim** to the Sprint 1F workstream | Earlier claim, load-bearing for P-1, and Phase 2 already deferred to it |
| GD-2 | **Use GOV-001 §Exceptions as the vehicle** for temporary independence relief rather than proposing a new mechanism | The construct exists and already requires expiry and compensating controls |
| GD-3 | **Consolidate 45 proposals to 31**, merging eleven duplicates | Five workstreams raised overlapping asks; the Founder should answer each once |
| GD-4 | **Withdraw CC-15's delivery rationale** | `WORKFLOW_DIAGNOSIS` §4b/§4c falsified it; retained only as a coherence fix |
| GD-5 | **Rank by latest-safe-decision-point**, matching Phase 2 §14's convention | Two registers using one convention are easier to merge later |
| GD-6 | **Record X-1b and X-2 rather than correct them** | They are in another specialist's document; GOV-001:234-235 and the instruction both forbid editing it |
| GD-7 | Recommend `PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL` for the CR | Mirrors the AR treatment that has worked across two sprints |

## 10.2 Assumptions

| # | Assumption | If wrong |
|---|---|---|
| GA-1 | The four untracked specialist drafts are the current versions | Every cross-reference here needs re-derivation, as X-11 shows already happened once |
| GA-2 | The Context Lifecycle Manager specification will exist before 1F-5 | Its governance items stay open and 1F-5 has no contract |
| GA-3 | The Founder wants the operating model codified rather than re-derived per run | §2.3 is unnecessary and only §2.1 matters |
| GA-4 | `ISSUE_MATRIX.md` will be approved substantially as written | ADR **B** changes shape and Phase 2 C-7 needs re-derivation |
| GA-5 | No governance document has been edited by another workstream since `357f03b` | Line citations may drift |

## 10.3 Interfaces with other workstreams

| Workstream | This workstream provides | This workstream needs |
|---|---|---|
| **Sprint 1F** | Verdict vocabulary (F-4), review order resolution (F-5), candidate identity (F-9), missing-standards closure (F-10) — all inputs to `1F-0` and to §16.3 | Correction of X-1b and X-2; re-derivation of §20.4 against final drafts (X-11) |
| **Mission Control UX** | Answer to OQ-4 / Q10 / GV-1 (document home + versioning); routing of Q6 / C5 (whether §2/§7.10/§11 become standards) | Nothing blocking |
| **Phase 2** | ADR-numbering rule (F-7), delegated-acceptance construct (F-14), independence framework (F-15), roadmap authority (F-8) | Confirmation that §17.3's adoption of the negative-outcome rule survives whatever the Founder approves in `ISSUE_MATRIX` |
| **Research backlog** | Register-naming rule (G-7); position on E-1a and E-2, both of which this plan endorses | Nothing blocking |
| **CLM (absent)** | — | Existence. Its governance items cannot be ranked until it exists |
| **Founder Interface UX (absent)** | — | Existence, or a Founder ruling on UX C1 |

## 10.4 Questions for other specialists

| # | To | Question |
|---|---|---|
| GQ-1 | 1F owner | Will you correct §20 Q-6's characterization of ADR-0001 D8 (X-1b), and reconcile §16.1's gate order with GOV-001 (X-2)? |
| GQ-2 | 1F owner | Will you re-derive §20.4 against the final Phase 2 and UX documents (X-11)? |
| GQ-3 | Phase 2 owner | Does yielding ADR-0003 to 1F and renumbering this plan's negative-outcome ADR conflict with anything in your §2.7 sequence? |
| GQ-4 | architecture-reviewer | Given that you authored `ISSUE_MATRIX` Part 1, do you consider yourself eligible to review its implementation, and under what compensating control? |
| GQ-5 | Research owner | Do you accept G-7 (one register per kind, named home) as the answer to your §7 item 7 and Phase 2 Q-1? |
| GQ-6 | Whoever owns CLM | Does a specification exist outside this repository, and when does it land? |

## 10.5 Potential conflicts this workstream may create

| # | Conflict | Nature |
|---|---|---|
| GC-1 | **Retiring EMP-QA-001's five-state vocabulary** invalidates any in-flight review written against it | Recommend a stated effective point rather than a silent swap |
| GC-2 | **Exception E-A could be read as weakening independence** | It does not: it narrows participation and sets an expiry. But it is the kind of exception CONST-001 warns may become permanent, which is why E-A expires on an event rather than a date |
| GC-3 | **This document proposes where design specs live** (UX OQ-4), which touches Design's own output location | Routed as a recommendation to the Director of Operations, per UX's own routing |
| GC-4 | **Ranking Phase 2 items** could read as scheduling another workstream | It does not reschedule anything; it only says which governance artifacts must exist first |

## 10.6 Items deliberately left unresolved

1. Every Founder-reserved decision in §7 — all seventeen.
2. The staffing route in §4.1. Three options presented, none chosen.
3. Whether UX §2/§7.10/§11 become governed standards (O-1).
4. `WorkItem` promotion (§4.9) and the ADR-0002 owner-of-record gap.
5. The CLM's governance surface — no document to reconcile against.
6. UX C1's mandate overlap — the counterpart workstream is absent.
7. Whether the roadmap is a Founder decision record, a requirements document, or outside the
   `AGENTS.md` authority model (§4.6 problem 2).

## 10.7 Recommended changes if another specialist disagrees

| If … | Then |
|---|---|
| …the 1F owner keeps §16.1's gate order | It requires an Operations record under GOV-001:187-189 (concurrent review permitted only when recorded), or a GOV-001 amendment. It cannot simply stand |
| …the Founder places scorecards in 1F | ADR-0001 D8 needs the amendment instead of ADR-0002, and 1F §3.1's exclusion is reversed |
| …the Founder declines every §4.1 route | Remediation stops. It does not proceed under an unrecorded exception; that is the outcome the whole diagnosis exists to prevent |
| …`PASS WITH NON-BLOCKING FINDINGS` is judged confusingly close to the AR term | Use `PASS WITH RECORDED FINDINGS`. The middle term's wording is the least important part; the three-string discipline is the point |
| …governance is judged too heavy for Phase 1 | Take §2.1 only (nine items). §2.3 and §2.4 defer without breaking anything in §2.1 |

## 10.8 Handoff summary

> **GOV-PLAN-001 v0.2.0 — governance and documentation planning, reconciled against four present
> specialist drafts. Planning only; nothing approved; no governance document edited; not committed.**
>
> **Consolidated** 45 proposals to 31 by merging eleven duplicates across five workstreams, and
> withdrew one of its own (CC-15's rationale) as falsified by `WORKFLOW_DIAGNOSIS` §4c.
>
> **Sixteen contradictions** recorded (§5). **One stops work: X-3** — CR-1E authored the patch
> specification and AR-1E authored the policy and ruled on its deviations, so neither reviewer is
> clean for its own gate. **X-4 closed**: a complete specification was delivered, falsifying the
> "no implementation actor" blocker while leaving its root cause unexplained. Two more are
> evidence-integrity defects in another specialist's document — **X-1b** (ADR-0001 D8 misquoted) and
> **X-2** (gate order inverted against GOV-001) — recorded, not corrected, because editing another
> workstream's document is prohibited.
>
> **Yielded** the ADR-0003 claim to Sprint 1F and stopped claiming numbers at all.
>
> **Recommends** `PASS / PASS WITH NON-BLOCKING FINDINGS / FAIL` for the Independent Code Reviewer
> with a single `BLOCKER/MAJOR/MINOR/OBSERVATION` ladder, mirroring the Architecture Reviewer's
> proven treatment and retiring three competing vocabularies.
>
> **Proposes four temporary exceptions** under the existing GOV-001 §Exceptions construct, each with
> an event-based expiry. None is granted.
>
> **Reconciled against the CLM specification** (§4.11), which resolves UX OQ-7 by splitting
> vocabulary from numbers and declines threshold ownership on governance grounds — generalized here
> as **G-11 / P-7**, with its `provisional: true` propagation recommended as the pattern for every
> governance-owned numeric.
>
> **Could not compare against** the Founder Interface UX design, which does not exist in the tree,
> or the Master Roadmap, cited as governing authority by the Phase 2 plan and absent from the
> repository.
>
> **Twenty Founder decisions** recorded and none resolved.

---

# 11. Record

- **Authored by:** governance and documentation planning workstream, acting within Operations
  proposal authority only. No decision authority was exercised.
- **Verified against:** working tree at `6301c06`, branch `validation/sprint-1e-overnight-2026-07-26`.
  v0.2.0 was verified at `357f03b`; the tree advanced during authoring and every affected finding was
  re-checked and corrected in place rather than left stale. The corrections are marked *(v0.3.0)*.
- **Volatility warning:** five commits and one new specialist document landed inside a single
  authoring pass. Any reader should re-check `git log` before treating §5 as current — this document
  has already been overtaken once.
- **No code, ADR, agent definition, handbook, standard, workflow, template, or other specialist's
  document was modified.** No commit was made.
- **Supersedes** the 0.1.0 draft held in the session scratchpad. That draft's `CC-nn` identifiers are
  preserved in §1 for traceability.
