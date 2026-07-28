# FINAL INTEGRATION HANDOFF — Context Lifecycle Manager

**Document ID:** CLM-HANDOFF-001
**Companion to:** `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` (SPEC-CLM-001 v1.1.0)
**Owner:** Lead Software Engineer (Claude Code)
**Authority:** CONST-001, AGENT-001, GOV-001, ADR-0001, ADR-0002
**Date:** 2026-07-26
**Repository baseline:** `357f03b`, branch `validation/sprint-1e-overnight-2026-07-26`
**Status:** Reconciliation complete. **Not approved. Not implemented. Not committed.**

---

# 0. What this document is

The CLM specification's cross-workstream contract surface, produced by a reconciliation pass
against the four planning documents now present in the working tree. It states what the CLM
owns, what it consumes, what it refuses to own, what it changed as a result of reading the
other plans, and what remains for the Founder.

**Scope discipline applied.** Instruction: *do not absorb unrelated Sprint 1F or Phase 2
responsibilities.* Explicitly declined in this pass: Mission Control rendering, cost and
budget instrumentation, timeline read-model construction, packet content generation (1G),
context assembly and retrieval (1H), decomposition planning (1I/2A), and analytics
aggregation (2E). Each is recorded below as a **negative-scope** entry rather than left to
inference.

**Baseline note — HEAD advanced during this pass**, `357f03b` → `6301c06` (five commits, all
from the Sprint 1E remediation workstream). **Re-checked: no CLM finding is affected.** Those
commits add `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` and
amend the 1E issue matrix; they touch **no** source file. The three source facts this handoff
depends on are unchanged at `6301c06`: `usage: null` (`agent-execution-service.ts:81`), the
200-entry `store.events` cap (`store.ts:226`), and the `EventEntityType` / `EscalationOrigin`
unions. The patch spec does add `execution.assignment_deferred` to `EXECUTION_EVENT_TYPE` —
additive extension of the event vocabulary, the same mechanism requested in E-1/E-2 below, which
is mild corroboration that the pattern is accepted.

**Files changed in this pass:** two, both mine, both untracked.

| File | Change |
| --- | --- |
| `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md` | v1.0.0 → v1.1.0 |
| `agents/lead-software-engineer/outputs/CLM_COLLABORATION_HANDOFF.md` | New (this file) |

No code, ADR, roadmap, plan, or other specialist's file was modified. Nothing was committed.

---

# 1. Boundary decisions

## 1.1 The nine reconciliations required

| # | Question | Decision | Authority basis |
| --- | --- | --- | --- |
| **B-1** | Who owns context-health calculation? | **CLM owns it entirely**: the probe, the snapshot, the deterministic scorer, the dimensions, the floors, the band. 1F renders. 2E aggregates. The **executing agent owns none of it** | 1F I-5; UX C2/OQ-7; spec §3–§4 |
| **B-2** | Who owns thresholds and safety bands? | **Split.** CLM owns the *vocabulary* (band names, semantics, function shape, floor conditions). **Founder owns the numbers** as versioned policy. Every unapproved value emits `provisional: true` | Phase 2 §7.1 (*"thresholds… or policy"* require validation); D-2E-2 precedent; AGENT-001 decision boundaries; spec §4.7–4.8 |
| **B-3** | What may Mission Control display? | A **`PublicContextHealth` projection only** — never a raw checkpoint, packet, snapshot, span set, or removal ledger. Seven-item forbidden list, incl. consumer-computed bands and fleet verdicts averaging unmeasured sessions | `PublicReview` precedent (1E); UX §12.15; spec §11.5 |
| **B-4** | Persistence requirements | **Hard floor**: durable, append-only, **no capacity eviction**, read-after-write, linearizable CAS. The CLM **cannot ship in enforcing mode on the memory store**. Shadow mode can | Spec CLM-C11; UX finding I1 (`store.events` capped at 200); 1F Q-1/ADR-0003; Phase 2 P-1 |
| **B-5** | Context event vocabulary | 22 `clm.*` events in the existing 1E `Event` shape, **carrying Phase 2 §7.4 correlation fields from day one** to avoid the re-vocabularization Phase 2 §7.2 warns about. Requires additive `EventEntityType: "session"` | Phase 2 §7.2/§7.4; ADR-0002 E3; spec §11.2 |
| **B-6** | Checkpoint and continuation record ownership | **CLM owns both**, creation through integrity through lifecycle. Canonical name **`ContextCheckpoint`** to disambiguate from 2J's `EditCheckpoint`. Continuation packet is **not** a 1G work packet | Spec CLM-K7, CLM-G5; Phase 2 §12.5 |
| **B-7** | Repository Intelligence / Context Router boundary | **Router admits; CLM governs tenure and eviction.** Router relevance is retrieval ranking; CLM relevance is a deterministic retention class. **No re-assembly on restoration.** Repository Intelligence is *not* a CLM dependency | Phase 2 §3.3; spec CLM-G6, §14.4 |
| **B-8** | Restoration gates | **G1–G10 are a mandatory floor**, never skipped or subsetted. Consumers **add** G11+ (2J pair-session, 2A packet, 1I loop budget). An unrunnable gate is a **hard failure**, not a skip | Spec CLM-R12/R13; Phase 2 §3.9, 2J J11 |
| **B-9** | Provider optimization without lock-in | Provider specifics enter **only as a `ProviderContextProfile` data record** through the P-4 `ModelResolver` port. **Zero provider names in CLM code.** Occupancy ≠ cost; tokenizer counts never translated | Phase 2 §0.4 (binding); R-13; spec §5.9 |

## 1.2 Negative scope — explicitly declined

Recorded so no downstream plan assumes the CLM covers it:

| Declined | Belongs to | Note |
| --- | --- | --- |
| Rendering context health | 1F / Design | CLM supplies the projection and the band; the UI supplies the pixels |
| Cost and budget instrumentation | **Unowned** (UX RB-1, 1F Q-4 cost half, Q5) | CLM *consumes* `usage` if it lands. It does not own spend. **This gap has no owner and needs one** |
| Timeline read-model | 1F-1 (I-7) | CLM emits into it; it does not build one |
| Work packet content | 1G | Distinct record (CLM-G5) |
| Context assembly, retrieval, ranking, caching policy | 1H | CLM-G6; R-13 |
| Decomposition planning | 1I / 2A | CLM emits a capacity signal; recommends disabling its own `SPLIT` rules once 1I exists |
| Trends, forecasts, anomalies, cross-session rollups | 2E | CLM is an ingestion source |
| Model quality ranking / binding decisions | 2H | CLM emits `SwitchRequirement` only |
| Multi-participant custody | Unmodeled (OQ-C4) | Out of scope for v1.1; INV-2 assumes one participant per work unit |
| Organizational policy of any kind | Founder / Governance | §4.8 |

---

# 2. Interfaces

## 2.1 Consumed by Mission Control (1F + UX View 12)

Every item the UX workstream requested in §12.6 / CX-1…CX-6 is answered. Two are answered
**differently than requested**, and both are flagged.

| Ref | Requested | CLM response | Status |
| --- | --- | --- | --- |
| **CX-1** | Usage figure + limit, or explicit "limit unknown" | `tokensUsed` / `contextLimitTokens`, both nullable; `measured: boolean` | ✅ Accepted as requested |
| **CX-2** | Band vocabulary **and thresholds**, defined by CLM | Vocabulary: ✅ delivered (7 bands, §4.7). Thresholds: ⚠️ **declined as CLM-owned** — routed to Founder as versioned policy (§4.8) | ⚠️ **Partial — amends CX-2** |
| **CX-3** | Compaction events with timestamps, in the existing event vocabulary | `clm.compaction_applied` in the 1E `Event` shape; timeline-placeable | ✅ Accepted as requested |
| **CX-4** | Context-attributed failure flag | `ContextFailureAttribution`, six values, defaulting to `not_context_attributed` | ✅ Accepted, with a stricter default |
| **CX-5** | Sampling interval | `sampleIntervalMs` on every emission; `stale` band | ✅ Accepted as requested |
| **CX-6** | Partial-measurement semantics | `measured: false`; excluded from counts; **CLM emits no aggregate at all** (CLM-S7) | ✅ Accepted, strengthened |
| **OQ-7 / Q4** | Signals, band vocabulary, thresholds | Signals ✅, vocabulary ✅, thresholds → **Founder** | ⚠️ **Ownership amended** |
| **C2** | *"View 12 could be read as specifying the CLM"* | It does not, and the CLM owner confirms it. §12.6 is correctly a consumer request | ✅ Conflict closed |

**Two items the UX workstream must know:**

1. **CX-2 is amended, not rejected.** The UX doc was right to refuse to invent thresholds. It
   assigned them to the CLM owner; the CLM owner is routing the *numbers* to the Founder and
   keeping the *vocabulary*. View 12 must therefore render `bandPolicyVersion` and, while
   unapproved, mark bands `provisional`. This is a small addition to a view already designed
   to cite its source.
2. **The CLM does not light up View 12.** It makes the dark state data-driven, which is
   strictly better than hardcoded. Non-zero measurement needs real providers (P-8) and
   populated `usage` (`agent-execution-service.ts:81`). View 12's dark state is correct and
   should ship as designed.

## 2.2 Consumed by Sprint 1F (plan-level)

| # | Interface | Contract |
| --- | --- | --- |
| CLM→1F-1 | `PublicContextHealth` per execution | §11.5 |
| CLM→1F-2 | Band vocabulary (7 bands incl. `not_measured`, `stale`) | §4.7 |
| CLM→1F-3 | Compaction events | 1E `Event` shape |
| CLM→1F-4 | Context-attributed failure flag | Recorded, never inferred |
| CLM→1F-5 | Sampling interval | Per emission |
| CLM→1F-6 | Partial-measurement semantics | No aggregate emitted |
| CLM→1F-7 | Checkpoint projection | Existence, seal time, verification, sequence — **never contents** |
| CLM→1F-8 | Restoration outcome + failing gate id | For timeline and status reason |

**Answering 1F I-5's explicit ask** (*"1F needs the record shape and its availability date"*):
record shape is §8, §9.1, §11.5 — available now. Availability date is **conditional, not a
date**: shape now; measured values after P-8 + `usage`; enforcement after ADR-0003 persistence.
**1F should plan 1F-5 as a rendering item shipping the honest-absence path first.**

## 2.3 Consumed by Phase 2

| Stage | Interface | Contract |
| --- | --- | --- |
| **2A** | Restoration verification before packet mutation | INV-1 — **already satisfied**; §3.9 needs no change. Requires **G12-PACKET** |
| **2A** | Uncertain-state alignment | CLM `QUARANTINED` ↔ 1E uncertain — **vocabulary unreconciled (OQ-C3)** |
| **2E** | Context quality metrics as an ingestion source | §11.3 series, with §7.4 correlation fields |
| **2E** | Canonical event model compatibility | CLM-T4 |
| **2H** | `SwitchRequirement` (capabilities + limits, no names) | §5.7, CLM-D19 |
| **2I** | Checkpoint/rollover for long research sessions | Standard consumer, no new gate |
| **2J** | `ContextCheckpoint` ≠ `EditCheckpoint`; **G11-PAIR** gate | CLM-K7, CLM-R12 |
| **2F/2G** | Multi-participant rollover | ❌ **Not modeled (OQ-C4)** |

## 2.4 Required by the CLM

| From | Interface | Blocking? |
| --- | --- | --- |
| 1F-1 | Execution timeline read-model | For event placement — not for core function |
| ADR-0003 / P-1 | Durable store meeting CLM-C11 | **Blocks enforcing mode** |
| P-8 | Real providers behind `AgentProvider` | **Blocks any non-zero measurement** |
| 1F D-D | `usage` actually populated | **Blocks token occupancy** |
| P-4 | `ModelResolver` port | Blocks `ProviderContextProfile` |
| ADR-0002 amendment | `EventEntityType: "session"`; new `EscalationOrigin` members | **Blocks emission** |
| 1G | Stable packet id + version; declared negative-scope fields | Second item: degrades INV-3 from structural to best-effort |
| 1H | Router working-set manifest (ids + version) | Blocks replay proof |
| Session runtime | Span enumeration (A-1) | Degrades compaction quality; untestable until P-8 |

---

# 3. Data contracts

| Contract | Owner | Consumers | Notes |
| --- | --- | --- | --- |
| `ContextHealthSnapshot` | CLM | CLM only | **Internal.** Never exposed; archived for replay (INV-8) |
| `HealthScore` | CLM | CLM, 2E | Deterministic, versioned |
| `LifecycleDecision` | CLM | CLM, 2E, 1F (`ruleId` only) | `ruleId` is the auditability handle |
| **`ContextCheckpoint`** | **CLM** | 1F (projection), 2A, 2I, 2J | Immutable, hash-chained. **Renamed** from `Checkpoint` (CLM-K7) |
| **`ContinuationPacket`** | **CLM** | Successor sessions | Derived, never authored. **Not** a 1G work packet |
| `RestorationReport` | CLM | 1F, 2A, 2J | Written for every attempt, pass or fail |
| `WorkCustody` | CLM | CLM | **Internal.** Relationship to `AgentAssignment` open (OQ-C5) |
| **`PublicContextHealth`** | **CLM** | **1F / Mission Control** | **The only browser-readable CLM record** |
| `CompactionPlan` + removal ledger | CLM | CLM, evidence | Digest in checkpoint; contents never displayed |
| `ProviderContextProfile` | **2H registry** (CLM consumes) | CLM | Data, not code. Opaque `profileId` — no provider names |
| `SplitPlan` | CLM (proposes) | Founder / 1I / 2A | Proposal + escalation, never unilateral |
| `SwitchRequirement` | CLM (emits) | Agent Registry / 2H | Capabilities and limits only |
| Threshold policy record | **Founder / Governance** | CLM | Versioned; `provisional: true` until approved |

**Cross-cutting rule (INV-7 / Phase 2 §17):** no secret, credential, or env **value** in any
CLM record. Env keys are stored as name + presence boolean. Pre-seal scanner; planted-secret
test (AC-16, ADV-18). Phase 2's *"no raw provider keys in… checkpoints"* is already satisfied.

---

# 4. Events required

22 events, `clm.*`, in the existing 1E `Event` shape, one per accepted transition, none for
no-ops (ADR-0002 rule).

`session_started` · `decision_made` · `checkpoint_sealed` · `checkpoint_corrupt` ·
`packet_generated` · `compaction_applied` · `compaction_reverted` · `compaction_ineffective` ·
`split_proposed` · `switch_required` · `rollover_started` · `custody_reserved` ·
`custody_transferred` · `restoration_started` · `restoration_verified` · `restoration_failed` ·
`fallback_selected` · `quarantined` · `blocked` · `reserve_raised` · `session_retired` ·
`session_abandoned`

**Three requirements on the event layer:**

| # | Requirement | Why |
| --- | --- | --- |
| **E-1** | Additive `EventEntityType: "session"` | No existing member fits. **ADR-0002 amendment** |
| **E-2** | Additive `EscalationOrigin` members: `context_blocked`, `restoration_failed`, `custody_conflict`, `split_proposed`, `no_capable_provider` | CLM escalations must not be forced into `retry_exhausted` / `review_exhausted`, which would falsify the audit record. **ADR-0002 amendment** |
| **E-3** | Correlation fields (Phase 2 §7.4) on every event from day one | Phase 2 §7.2: events emitted before canonical-model ADR #12 *"need re-vocabularization"*. Paying now is cheap; migrating later is not |

**E-4 — capacity warning.** `store.events` is capped at **200** and is memory-only (UX finding
I1). CLM events would be evicted, and eviction of an integrity-chain event is indistinguishable
from tampering at verification time. This must be resolved with the persistence decision.

`clm.decision_made` is emitted for `CONTINUE` as well — a decision to do nothing is still a
decision, and an audit trail with only the exceptional cases cannot prove the normal ones.

---

# 5. Persistence requirements

**NORMATIVE floor (CLM-C11).** Four properties, all required:

| # | Property | Failure mode if absent |
| --- | --- | --- |
| **P-A** | Durability across process death | A checkpoint that dies with its session cannot serve rollover — its only purpose |
| **P-B** | Append-only, **no capacity eviction** | The 200-entry cap silently truncates the chain; `chainHash` verification then fails in a way indistinguishable from tampering |
| **P-C** | Read-after-write consistency | Restoration must read what sealing wrote |
| **P-D** | **Linearizable compare-and-set** on custody | Without it **INV-2 is unenforceable** and rollover is unsafe by construction |

**Consequence, stated without hedging:** the CLM **cannot ship in enforcing mode on the current
memory-only store**. Shadow mode (§16.6) can, because it takes no action and grants no token.

This makes the Sprint 1F persistence decision (**Q-1 / ADR-0003**) and Phase 2 **P-1** hard
prerequisites for CLM enforcement. It is also a **constraint on that decision**: whichever
backend is chosen must supply P-D. A store providing durability without linearizable CAS
satisfies 1F and still leaves the CLM unable to guarantee single ownership.

---

# 6. Conflicts resolved

| # | Conflict | Resolution | Residual |
| --- | --- | --- | --- |
| **CR-1** | **1F internal**: I-5 says CLM owns context health; D-G/D-H make it 1F domain work | **I-5 governs.** D-G/D-H reclassified from domain design to rendering + projection wiring. Prevents two sources of truth | Needs 1F workstream confirmation (action 4) |
| **CR-2** | **UX CX-2 vs governance**: UX assigns thresholds to the CLM owner; AGENT-001 and Phase 2 make thresholds policy | **Split**: CLM owns vocabulary, Founder owns numbers. **Independently corroborated** — the governance workstream reached the identical split as **G-11** without coordination, and created precondition **P-7** to carry it | OQ-C2 — Founder approval, now via P-7 |
| **CR-3** | **Naming collision**: CLM `Checkpoint` vs 2J `EditCheckpoint` vs 1F D-H "Checkpoint entity" | Canonical **`ContextCheckpoint`**; 2J's stays `EditCheckpoint`; 1F D-H **is** `ContextCheckpoint` | Closed |
| **CR-4** | **1F D-G mechanism**: *"Requires the executing agent to report context utilization"* | **Corrected**: the *runtime probe* supplies a **measured** figure. An agent self-report is forbidden input (CLM-I1). A self-report is an assessment; only a measurement can carry a halting floor | Closed — 1F should note the correction |
| **CR-5** | **Continuation packet vs 1G work packet** | Distinct records, distinct lifetimes; CLM references by id + version, never inlines | Closed (CLM-G5) |
| **CR-6** | **Router vs CLM relevance** | Router = retrieval ranking (may be non-deterministic); CLM = retention class (deterministic). **Must not be unified** — a non-deterministic retention input destroys INV-8 | Closed (CLM-G6, §14.4) |
| **CR-7** | **Provider optimization vs §0.4 lock-in ban** | Profile-as-data through P-4; zero provider names in code; occupancy ≠ cost; no tokenizer translation | Closed (§5.9); caching deferred to R-13 |
| **CR-8** | **Restoration gates vs 2J J11 / 2A §3.9** | G1–G10 mandatory floor; consumers add G11+; unrunnable gate = hard failure | Closed (CLM-R12/R13) |
| **CR-9** | **CLM event vocabulary vs 2E canonical model** | Correlation fields carried from day one | Closed (CLM-T4) |
| **CR-10** | **Raw records vs Mission Control display** | `PublicContextHealth` projection only, `PublicReview` precedent | Closed (CLM-T3) |
| **CR-11** | **Phase 2 §3.9 depends on an unrecorded invariant** | Confirmed satisfied by INV-1; recorded so it is not re-litigated. **Also a reason an ADR is required** | Closed, escalated to ADR ground 3 |

---

# 7. Unresolved ownership questions

| # | Question | Owner | Blocks | Recommendation |
| --- | --- | --- | --- | --- |
| **OQ-C1** | Which sprint owns the CLM? Phase 2 **P-5** lists it standalone; Phase 2 **§3.3** says "(1G/1H)". Contradictory | **Founder** | Sequencing; architecture gate | Distinct deliverable between 1G and 1H. Folding an ADR-grade ownership model into a feature sprint buries it |
| **OQ-C2** | Are band thresholds Founder policy (§4.8) or CLM-owned (UX CX-2 as written)? | **Founder / Dir. Operations** | Whether any band renders non-provisional | Founder policy. A threshold decides when work halts |
| **OQ-C3** | Is CLM `QUARANTINED` the same state as 1E/2A "uncertain"? | Lead Engineer + Architecture Reviewer | Status vocabulary (UX FI-3) | One vocabulary. Two names for one state is the defect UX FI-3 warns about |
| **OQ-C4** | Multi-participant sessions (2F/2G) — multiple concurrent participants under one custody? | **Founder** | Whether INV-2 needs a multi-holder model | Out of scope for v1.1; model it before 2F/2G |
| **OQ-C5** | Custody: extend `AgentAssignment` or stand alone? | Architecture Reviewer | Domain design | Stand alone — different subject and lifetime |
| **OQ-C6** | When 1I lands, does the CLM stop proposing splits? | **Founder** at 1I planning | Decomposition authority | Yes. Two decomposition authorities is a defect waiting to happen |
| **OQ-C7** | **Who owns cost instrumentation?** | **Founder / Dir. Operations** | §11 cost metrics; 1F Q-4 cost half; UX View 13 | **Not a CLM claim.** Flagged because it is genuinely unowned across three documents |
| **OQ-C8** | Who assigns ADR numbers centrally? | **Founder** | This ADR and every concurrent one | Three workstreams are producing ADR-grade decisions with no central numbering authority operating. **Now also registered by governance** as G-6 / B-5 / X-5, which records **two claimants on ADR-0003** (1F and the governance plan's own 0.1.0 draft, since yielded) |

## 7.1 One correction owed to the governance workstream

`GOVERNANCE_UPDATE_PLAN.md` §3 (*"Governance items whose owner is another workstream"*) still
lists **"Context-health signal vocabulary and thresholds | CLM owner | No document exists.
Blocks UX View 12 and 1F-5."** That line is stale: the document exists, and §4.11 of the same
plan reconciles against it. The plan's own §1 correction register already notes the v0.2.0→v0.3.0
correction, so this appears to be one table that was not swept.

**Not corrected here** — instruction 10 forbids modifying another specialist's file. Routed to
the governance workstream as a one-line fix. Flagged because a stale "no document exists" entry
in a governance blocker table is exactly the kind of record that gets actioned later by someone
who did not read §4.11.

---

# 8. ADR candidates

## 8.1 Required before implementation — **YES**

**Candidate: Context Lifecycle Manager — ownership, continuity, and restoration architecture.**
Number **not claimed here** (see §8.2).

Four independent grounds:

| # | Ground |
| --- | --- |
| 1 | New ownership primitive (custody + linearizable CAS + epoch) that ADR-0001's `AgentAssignment` does not cover |
| 2 | Requires additive amendments to accepted **ADR-0002** (`EscalationOrigin`, `EventEntityType`) |
| 3 | **Phase 2 §3.9 already depends in writing on INV-1** — a downstream plan built on an unrecorded architectural guarantee |
| 4 | Imposes a persistence precondition (CLM-C11 P-D) that constrains the in-flight ADR-0003 decision |

**Recommended ADR scope:** ownership/custody model · checkpoint immutability and integrity
chain · restoration gate floor · determinism and replayability · the §4.8 threshold-ownership
split. **Excluded:** the numeric thresholds themselves, which should live in a separately
versioned policy record the ADR points to — so tuning does not require an architecture
decision every time.

## 8.2 Numbering caution (a finding in its own right)

**ADR-0003 is already claimed** by the Sprint 1F persistence/deployment decision. Phase 2 asks
that its ADRs be numbered **from ADR-0004**, with *"the Founder… assign the numbers centrally
to prevent two workstreams claiming one number."* A Phase 1 CLM ADR falls outside both
reservations and **needs explicit central assignment**. This handoff deliberately claims no
number.

## 8.3 Related ADR work this pass touches

| Item | Type | Owner |
| --- | --- | --- |
| ADR-0002 amendment: `EscalationOrigin` + `EventEntityType` additive members | Amendment | Founder |
| ADR-0002 E5 parenthetical amendment (carried from Sprint 1E) | Pre-existing, unrelated | Founder |
| ADR-0003 persistence — **must supply linearizable CAS** for CLM enforcement | Constraint on an in-flight ADR | Founder + Engineering |
| Phase 2 ADR #12 canonical event model | Consumed; CLM pre-conforms | Founder |

---

# 9. Founder decisions required

| # | Decision | Why it is the Founder's | Blocks |
| --- | --- | --- | --- |
| **F-1** | **Approve the §4.8 threshold-ownership split** — now routed through governance precondition **P-7** (G-11) | A threshold decides when an AI employee is halted. Organizational risk posture. Three workstreams have independently reached the same split | Every band; whether any renders non-provisional |
| **F-2** | **Approve the §14A provisional defaults**, or direct calibration first | 22 constants, none approved. Recommendation: **shadow mode first**, approve from measured data | CLM enforcing mode |
| **F-3** | **Resolve OQ-C1** — CLM sprint ownership (P-5 vs §3.3 contradiction) | Roadmap authority | Sequencing, architecture gate |
| **F-4** | **Commission the CLM ADR and assign its number centrally** | Governance; three workstreams are producing ADRs concurrently | Implementation |
| **F-5** | **Approve the additive ADR-0002 amendments** (E-1, E-2) | Amends an accepted ADR | Event and escalation emission |
| **F-6** | **Confirm CLM-C11 as a constraint on the ADR-0003 persistence decision** | Cross-decision constraint | CLM enforcing mode |
| **F-7** | **Assign cost-instrumentation ownership (OQ-C7)** | Unowned across 1F, UX, and this spec | 1F View 13; CLM cost metrics |
| **F-8** | **Confirm the §14.2 reclassification of 1F D-G/D-H** | Scope change to an approved plan; not mine to make | 1F-5 sizing |
| **F-9** | **Decide OQ-C4** — multi-participant custody, now or before 2F/2G | Scope | Phase 2 2F/2G |
| **F-10** | **Set `CONTEXT_SAMPLE_INTERVAL_MS`** | Currently **unset**; no band may be emitted without it | Any band emission |

---

# 10. Preserved guarantees

Confirmed intact after reconciliation. Each was checked against the new documents for
contradiction; none was weakened, and three were strengthened.

| Guarantee | Status | Reconciliation note |
| --- | --- | --- |
| **Deterministic decisions** | ✅ Intact | **Strengthened**: threshold policy is now versioned and externally owned, making the decision's inputs auditable rather than embedded |
| **Replayability (INV-8)** | ✅ Intact | **Strengthened**: CR-6 prevents non-deterministic Router relevance from entering retention |
| **CAS ownership (INV-2)** | ✅ Intact | Now backed by an explicit persistence requirement (P-D) instead of an assumption |
| **Negative-scope preservation (INV-3)** | ✅ Intact | **Strengthened**: 1G must declare negative-scope fields so classification is structural, not prose-parsed |
| **Checkpoint integrity (INV-6)** | ✅ Intact | Event-cap eviction identified as a concrete threat (E-4) and made a persistence requirement |
| **Restoration verification (INV-1, INV-4)** | ✅ Intact | **Externally corroborated**: Phase 2 §3.9 independently requires it. Gate floor made extensible without weakening |
| **Explicit failure states** | ✅ Intact | Failure taxonomy unchanged; `uncertain` and `blocked` promoted to first-class **bands** so a halted session can never render `safe` |
| **No secrets in records (INV-7)** | ✅ Intact | Matches Phase 2 §17 verbatim |
| **Inherited-evidence honesty (INV-9)** | ✅ Intact | Unchanged |

---

# 11. Recommendation

## **NOT READY FOR INTEGRATION**

The specification is **complete and internally consistent**, and every interface the consuming
workstreams asked for is defined. It is **not ready to integrate** because integration would
mean other plans binding to contracts that four unresolved conditions could still change.

**This is a readiness verdict on the decisions, not a defect verdict on the document.**

### Blocking conditions

| # | Condition | Owner | Why blocking |
| --- | --- | --- | --- |
| **BL-1** | **Threshold ownership decided in principle, not yet approved (F-1 / OQ-C2)** | Founder | **Downgraded during this pass.** Governance G-11 independently converged on the same split and precondition **P-7** now carries it; what remains is Founder approval of the policy record, not an ownership dispute. Still blocking: until P-7 lands, every band is `provisional` by construction and View 12 cannot render a governed verdict |
| **BL-2** | **Sprint ownership contradicted (F-3 / OQ-C1)** | Founder | Phase 2 states it two ways. Sequencing, the architecture gate, and whether R-13 blocks CLM start all follow from it |
| **BL-3** | **Persistence floor unconfirmed (F-6 / CLM-C11)** | Founder + Engineering | If ADR-0003 lands without linearizable CAS, **INV-2 is unenforceable** and rollover is unsafe. This must constrain that decision *before* it is made, not after |
| **BL-4** | **ADR not commissioned or numbered (F-4)** | Founder | Phase 2 already depends on INV-1 in writing. Implementing against an unrecorded invariant is the situation ADRs exist to prevent |

### What is ready now, and should proceed in parallel

| Ready | Consumer |
| --- | --- |
| The full data contract (§3) — record shapes are stable | 1F, Design |
| CX-1…CX-6 responses (§2.1) | Design workstream, immediately |
| Band **vocabulary** (numbers pending) | Design workstream |
| The §11.5 projection — enough to build 1F-5's honest-absence path | 1F |
| Negative-scope declarations (§1.2) | All workstreams |
| CR-1…CR-11 conflict resolutions | 1F, Design, Phase 2 |

### Path to READY

1. Founder resolves **F-1, F-3, F-4, F-6** (BL-1…BL-4).
2. Architecture Reviewer reviews custody vs `AgentAssignment` (OQ-C5) and the gate floor.
3. 1F workstream confirms the D-G/D-H reclassification (F-8).
4. Design workstream accepts the amended CX-2.
5. **Then** the ADR is written, and shadow mode becomes the first shippable increment.

**Estimated distance to READY: four Founder decisions and one architecture review.** No
further specification work is required, and none should be done until those land — additional
detail written against unresolved ownership is rework waiting to happen.

### Why this is a close NOT READY, not a distant one

Three of the four blockers are **decisions awaiting a signature, not open problems**. BL-1 has
converged across three independent workstreams. BL-2 is a contradiction inside one document
that a single Founder ruling settles. BL-4 needs a number assigned. Only BL-3 carries technical
risk, and it is risk to a decision **not yet made** — which is precisely when raising it is
cheap. Had this reconciliation happened after ADR-0003 landed without linearizable CAS, the
finding would have been a rework order instead of a constraint.

---

# 12. Honest limitations of this reconciliation

1. **Master Roadmap v7.1 is not in this repository.** Sprint 1F I-6 records the same absence.
   Phase 2 cites it as governing authority for nine sections. This reconciliation may conflict
   with it in ways I cannot see.
2. **I read four planning documents, not their authors' intent.** Where I disagreed with one
   (CR-1, CR-2, CR-4) I stated the disagreement and routed it, rather than assuming I was
   right. Each needs that workstream's confirmation.
3. **No validation was run.** This is a planning artifact. Repository facts were read at
   `357f03b`; behavioral claims about the CLM are specifications, not observations.
4. **The `usage: null` finding is inherited, not independently re-verified** in this pass. It
   is consistently reported by the UX workstream (I2), Sprint 1F (§2.4, D-D), and the research
   backlog, all citing `agent-execution-service.ts:81`.
5. **Phase 1's simulated agents have no context window at all.** Nothing in this specification
   can be behaviorally validated until real providers land (P-8). Shadow mode will produce no
   meaningful data before then — which sharpens F-2: the constants cannot be calibrated on
   simulations, so approving them is a decision under genuine uncertainty, not a deferrable one.
