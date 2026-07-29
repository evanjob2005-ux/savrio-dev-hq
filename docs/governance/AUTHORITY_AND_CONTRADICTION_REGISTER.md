# Authority and Contradiction Register

**Document ID:** ACR-001
**Version:** 1.0.0
**Status:** **ACTIVE REGISTER.** Open items and closed/discharged history are both
retained. This document records decisions made by the authorized owner; it does
not create decision authority.
**As of:** 2026-07-26 · verified at HEAD `9069c12`, branch `validation/sprint-1e-overnight-2026-07-26`
**Owner:** Director of Operations (maintenance); Founder (every decision below)
**Authority:** CONST-001, GOV-001, ORG-001, AGENT-001, ADR-0001, ADR-0002, Master Roadmap
(registered **v10.4** at `docs/roadmap/MASTER_ROADMAP.md`)

---

# 0. Purpose and rules of this register

This register exists so that a contradiction between governing documents is **recorded and
routed** rather than silently resolved by whichever agent notices it last.

**Rules:**

1. Recording an open item is not deciding it. A closed item must cite the
   authorized decision and remains retained as history.
2. Every entry names **both sides with an exact citation**, per GOV-001:369-371 — *"An
   asserted ADR, standard, or contract violation quotes the text being applied. A constraint
   may not be paraphrased into existence."*
3. Every entry names the **owner** with authority to decide it.
4. An entry is closed only when a **decision is recorded**, not when a workstream forms a
   view. Two workstreams agreeing is evidence, not authority.
5. **Discharged entries are retained, not deleted** — Master Roadmap v8.0 Appendix G:
   *"Preserve superseded decisions and rejected approaches when they remain important to
   preventing regression."*

## 0.1 Provenance marking

| Mark | Meaning |
|---|---|
| **[V]** | Both sides verified by direct reading at HEAD `9069c12` during this pass |
| **[C]** | Carried forward from `docs/plans/GOVERNANCE_UPDATE_PLAN.md` §5 (GOV-PLAN-001 v0.3.0); **not independently re-verified this pass** |
| **[N]** | New this pass |

---

# 1. Document authority and precedence

**This section is reproduced identically in POH-001, CPU-001, ACR-001, and the
governance-baseline review packet.** If the four copies ever diverge, that divergence is
itself a governance defect and must be reported, not reconciled locally.

Dev HQ uses **two precedence axes**. They answer different questions and neither replaces
the other.

## 1.1 Axis A — governing-document precedence (which document wins)

Source: **CONST-001 Article IX** and **AGENT-001 (`AGENTS.md`) §Governing Authority**.

1. Company Constitution (CONST-001)
2. CEO/Founder-approved decisions
3. Company governance documents (GOV-001, ORG-001)
4. Company standards (`standards/`)
5. Approved product requirements
6. Department handbooks (`handbooks/`)
7. Workflow instructions (`docs/workflows/`)
8. Individual task instructions

## 1.2 Axis B — source-of-truth precedence (which artifact is right about a fact)

Source: **Master Roadmap §Authority Rule** — registered **v10.4**,
`docs/roadmap/MASTER_ROADMAP.md:230`.

| Source | Authoritative for |
|---|---|
| Repository + verified command output | What exists and passes **now** |
| Current Progress Update (CPU-001) | Current sprint, candidate, owners, reviews, blockers, next gate |
| Approved ADRs and recorded decisions | Architecture, security, policy, governance constraints |
| Permanent Operating Handbook (POH-001) | Stable operating rules, authority boundaries, review behaviour, prompt standards |
| Master Roadmap (registered v10.4) | Long-term capability direction, dependencies, phase promises, completion gates |

**Citation corrected 2026-07-29.** Both rows above previously read *"Master Roadmap v8.0."*
**No document named v8.0 exists at any path in this repository** — `docs/roadmap/MASTER_ROADMAP.md`
is v10.4, and v8.1 through v10.3 were never present. The version was re-pointed to the
registered file; the table's content is unchanged.

**Two known gaps, neither closed here:**

1. **v10.4's own table carries a fifth row this one does not** — *Section 23 Binding Operating
   Kernel: mandatory coordination, prompt, review, remediation, evidence, authority, handoff,
   and Founder-facing output rules.* It is **deliberately not adopted into Axis B**, because
   whether the kernel supplements or overrides `AGENT-001` is an open Founder decision
   (**X-8**, and `OBL-15`).
2. **This section is reproduced in four documents and they now diverge.** POH-001 and the
   governance-baseline packet carry the correction; **CPU-001 does not** — it is classified as
   a dated evidence record and `OBL-14` requires it be left unedited until CPU-001 is next
   revised. The divergence is recorded here rather than resolved by editing a snapshot.

## 1.3 The unresolved seam between the two axes

Axis A contains **no roadmap tier and no handbook tier**. Axis B asserts a position for both.
This is **X-8** below, and it is the register's root item: several other entries cannot be
weighed until it is answered, because they turn on whether a roadmap statement outranks,
underranks, or sits outside the eight-tier model.

## 1.4 The rule that governs all of the above

**The repository and verified command output control implementation truth.** No document —
including the roadmap, POH-001, CPU-001, and this one — is evidence that code exists, a test
passes, a review happened, or a gate closed.

---

# 2. Register summary

| State | Count |
|---|---|
| **Open — blocking** | 4 (X-3, X-6, X-7, X-8) |
| **Open — material** | 19 |
| **Open — low** | 2 (X-18, X-22) |
| **Closed, retained** | 1 (X-29) |
| **Discharged, retained** | 3 (X-1b, X-2, X-4) |
| **Total** | 29 |

**+3 material on 2026-07-29:** X-26, X-27, X-28. All three are governance questions the
roadmap registration record routed to this register
(`docs/roadmap/MASTER_ROADMAP.md:166-206`) and that never arrived. Two were tracked in
`docs/plans/OPEN_OBLIGATIONS.md` as obligations to *record a decision here* (`OBL-15`,
`OBL-16`) without the contradiction itself ever being recorded; the fourth question,
**v8.0 → v10.4 supersession**, was tracked in no document at all. **Recording is not
deciding** — none of the three is answered.

**X-29 history.** It was added as one material item on 2026-07-29 from the
remediation range `0d83525..638e45c` at HEAD `638e45c`, when only an implementing
author's attestation of delegation existed and the superseding ADR was missing.
The later Founder instruction **“do these, all of them”** and ADR-0003 closed it.
It is counted once under **Closed, retained**, not among the 19 open material
items.

**Two ID spaces collided during this pass.** Two concurrent writers each appended an entry
numbered **X-23**; the tag-identity entry was renumbered **X-24** and the agent-authority entry
**X-25** on discovery. This is a live instance of **X-22** (no register-naming rule) occurring
alongside **X-23** (shared-working-tree writes), and is recorded rather than silently corrected.

---

# 3. Contradictions register

## X-7 — Reviewer verdict vocabulary: five incompatible sets in force **[V] BLOCKING**

The sharpest item in the register, and it grew rather than shrank when the roadmap was
registered.

| # | Source | Vocabulary | Status of that source |
|---|---|---|---|
| 1 | **GOV-001:284-302** (Architecture Reviewer) | `PASS` · `PASS WITH NON-BLOCKING FOLLOW-UPS` · `FAIL` — *"No other verdict string is valid."* | **Approved governance** |
| 2 | **Founder decision, 2026-07-26** (Independent Code Reviewer) | `PASS` · `PASS WITH NON-BLOCKING FINDINGS` · `FAIL` | **Tier-2 recorded decision**, held at `PHASE_2_PROGRAM_PLAN.md:140-149` — see **X-21** |
| 3 | **Master Roadmap v8.0 §8, Standard Verdicts** | `APPROVE` · `APPROVE WITH NON-BLOCKING FINDINGS` · `CHANGES REQUIRED` · `REJECT CANDIDATE` · `ESCALATE` · `UNABLE TO VERIFY` | **Founder-supplied canonical roadmap** |
| 4 | **GOV-001:122-145**, Approval States | Approved · Approved with **Limitations** · Changes Required · Rejected · Escalated | **Approved governance** |
| 5 | **EMP-QA-001** | Approved · Approved with **Recommendations** · Changes Required · Rejected · Escalated | Approved employee document |
| 6 | **AGENT-008** / `.claude/agents/independent-code-reviewer.md` | *"explicit approve/reject decision"* | Approved agent definition |

**Why this is blocking rather than cosmetic.** GOV-001:293-294 states *"No other verdict
string is valid. A verdict may not be qualified, hedged, or combined."* Under that rule, a
reviewer following the roadmap and a reviewer following GOV-001 both issue invalid verdicts
in the other's frame. `REJECT CANDIDATE` and `UNABLE TO VERIFY` in particular have **no
mapping at all** into GOV-001's Approval States — `UNABLE TO VERIFY` is a genuinely new state
that the approved vocabulary cannot express, and it is exactly the state Sprint 1E's
candidate-identity `FAIL` was really in.

**Not resolved here.** A recommendation exists (`GOVERNANCE_UPDATE_PLAN.md` §9) and is
**not adopted**. **Owner: Founder.**

### X-7b — Severity ladder: one decided, two still standing **[V] Material**

A Founder decision fixes `BLOCKER · MAJOR · MINOR · OBSERVATION`
(`PHASE_2_PROGRAM_PLAN.md:151-163`). Two approved documents still carry different ladders:
EMP-QA-001 (*Critical/Major/Minor/Informational*) and `handbooks/ARCHITECTURE_REVIEWER.md:129`
(*CRITICAL/MAJOR/MINOR/OBSERVATION*). The decision binds; **the retirement of the other two
has not been recorded.** Leaving them alongside is how four vocabularies became four.
**Owner: Founder / Director of Operations.**

---

## X-8 — The roadmap and handbook occupy no tier in `AGENTS.md` **[V] BLOCKING**

| Side | Text |
|---|---|
| **AGENT-001 §Governing Authority** (`AGENTS.md`), and identically **CONST-001:331-341** | Eight tiers: Constitution · CEO-approved decisions · governance documents · standards · approved product requirements · department handbooks · workflow instructions · task instructions. **Neither a roadmap tier nor a handbook tier appears.** |
| **Master Roadmap v8.0 §Authority Rule** | *"The Permanent Operating Handbook controls stable operating behavior… This roadmap controls long-term capability direction."* |

Three readings are available and they are not equivalent: the roadmap is (i) a **recorded
Founder decision** (tier 2), (ii) an **approved product-requirements document** (tier 5), or
(iii) **outside the eight-tier model**, governing a different axis. Under (i) it outranks
GOV-001; under (ii) it does not; under (iii) the question of which wins is malformed.

**Consequence while open:** any claim resting only on the roadmap or only on POH-001 is an
**unverifiable-tier premise** and must be labelled as such rather than asserted as governed.
This is not hypothetical — POH-001 marks four rules PROPOSED for exactly this reason (R11,
R12, R13b, and the L0–L5 grid in R8).

**Owner: Founder.** This is the register's root item.

---

## X-3 — Both Sprint 1E reviewers contributed to the candidate they would certify **[C] BLOCKING**

| Actor | Contributed | Consequently barred from |
|---|---|---|
| **AR-1E** | Authored the negative-outcome policy (`ISSUE_MATRIX` Part 1); issued rulings on four flagged deviations whose amendments supersede parts of the specification | Architecture-reviewing a candidate it **directed** — GOV-001:227 covers *produced, planned, **or directed*** |
| **CR-1E** | Authored the complete patch specification | Code-reviewing the implementation it specified — GOV-001:227 and :233 |

**Governing text** — GOV-001:227: *"A reviewer must not review work it produced, planned, or
directed."* GOV-001:237-238: *"A review produced by the agent that produced the work is not a
review, and does not satisfy the commit gate."*

**Status.** The Sprint 1E candidate was closed by a **post-commit ratification** bound to the
committed bytes, with 0 unresolved blockers. That closes Sprint 1E. **It does not decide the
route for the next candidate**, and the next candidate is Track A's.

**Three routes, none chosen** (`GOVERNANCE_UPDATE_PLAN.md` §4.1a): a third reviewer instance
uninvolved in specification; a Founder-recorded Exception under GOV-001 §Exceptions with
compensating controls and an event-based expiry; or human review of the patch before
application. **Owner: Founder** — CPU-001 **F-G6**.

---

## X-6 — Agent communication invariant vs. brokered collaboration **[V] BLOCKING for Phase 2**

| Side | Text |
|---|---|
| **ADR-0001** Problem Statement | *"Agents do not primarily communicate directly with each other."* |
| **ADR-0002** Problem Statement (`:64`) | Preserved invariant: *"**no direct agent-to-agent communication**"* |
| **Master Roadmap v8.0 §4A** | *"Controlled Agent Communication"* — a required Phase 2 capability |
| **Phase 2 plan** stages 2A-6, 2G | Require brokered exchange |

A reconciliation is proposed — *governed, brokered, non-authoritative* traffic through the
Work Management Layer — but it is **an interpretation of an approved ADR**, which AGENT-001
§Governing Authority forbids an agent from selecting unilaterally. The Phase 2 plan's conduct
is correct: record it, block 2A-6 and 2G, ship 2A with communication disabled, decide nothing.

**Route:** Architecture Reviewer compliance opinion → Founder decision → superseding or
amending ADR. The Architecture Reviewer may **answer** whether this is a deviation; it may
not **authorize** one. **Owner: Founder.** Not required before Sprint 1F.

---

## X-1 — Scorecards: two approved ADRs disagree **[V] Material**

| Side | Text | Placement |
|---|---|---|
| **ADR-0001 D8** (`:146-148`) | *"Scorecards: deferred to Phase 2 — Scorecards remain a Work Management Layer responsibility but are out of Phase 1 scope unless they become required for Phase 1 acceptance."* | **Phase 2** |
| **ADR-0002 D-E6** (`:215-217`, `:230`) | *"Scorecards and analytics are deferred to **Sprint 1F**."* | **Sprint 1F** |

ADR-0002 is the later ADR and cites ADR-0001 as authority, but **does not state that it
supersedes D8**, so precedence is genuinely ambiguous rather than merely unread. A third
reading exists in the UX specification (A4).

**Two workstreams independently concluded scorecards belong to Phase 2. That is concurrence,
not authority.** Whichever way it goes, one ADR needs an amendment so permanent history does
not carry a contradiction — and `VERSIONING_POLICY.md:222-233` requires a **new** ADR rather
than an edit to the old one. **Owner: Founder.**

---

## X-9 — ORG-001 binds roles to named tools **[V] Material**

| Side | Text |
|---|---|
| **ORG-001:95-131** and throughout | *"Lead Software Engineer — **Assigned to:** Claude Code"*; *"Independent Code Reviewer — **Assigned to:** Codex"*; and similar for six further roles |
| **Phase 2 plan §0.4**, sourced to roadmap §4 and §22 | *"**No role in this plan is bound to a model.**… The model executing a role is an assignment, not an identity."* Prohibited shortcut: *"Hardcoding provider, project, tenant, or quality behavior into generic orchestration."* |

AGENT-001 §Role and Tool Separation already states the principle — *"Role definitions remain
stable even when the assigned AI tool changes"* — so ORG-001's tables are arguably current
assignments rather than bindings. **That reading has not been recorded as a decision.**
A conforming ORG-001 amendment is the proposed vehicle. **Owner: Founder / Operations.**

---

## X-10 — `WorkItem` promotion (ADR-0002 E8) has no owner **[C] Material**

ADR-0002 **E8** defers the `Project → WorkItem → Task → Execution → AgentAssignment`
hierarchy. Two workstreams depend on it from opposite ends: Phase 2 C-4 (*"whoever promotes
`WorkItem` changes where organization and packet records attach"*) and Sprint 1F Q-3 option
(a) (*"would require an ADR-0002 E8 hierarchy amendment"*).

**ADR-0002 lists no maintaining owner of record.** That gap is itself worth closing when ADR
ownership is formalized. A cheaper interim exists — 1F rendering sprint membership as a
preview from planning documents, touching no entity — which would make E8 a pure Phase 2
question. **Owner: Founder.**

---

## X-12 — Review gates whose own standards are absent **[V] Material**

Verified absent at HEAD by directory listing:

| Missing | Referenced by |
|---|---|
| `handbooks/INDEPENDENT_CODE_REVIEWER.md` | AGENT-008; `handbooks/` contains ten handbooks and not this one |
| `standards/NAMING_STANDARD.md` | 1F §16.3 |
| `standards/LOGGING_STANDARD.md` | 1F §16.3 |
| `standards/ERROR_HANDLING_STANDARD.md` | 1F §16.3; also Sprint 1E follow-up **1E-F1** |

> *"A review gate whose own standard is missing cannot certify against it."*
> — `SPRINT_1F_MISSION_CONTROL_LITE.md` §16.3

Either author them or **record them as accepted absences with the consequence stated**.
Leaving them referenced-but-absent is the state that produces unfounded gate claims.
**Owner: Director of Operations**, with Founder ruling on acceptance.

---

## X-13 — Delegated acceptance has no governance construct **[C] Material (Phase 2)**

The roadmap specifies an **Automatic Acceptance Rule** and a six-level delegated authority
grid (§2); Phase 2 2D-4 builds a *"risk-aware delegated acceptance evaluator."*

**CONST-001 Art. III and GOV-001:270-280 define what requires Founder approval. Neither
defines how Founder authority may be delegated to a mechanism.** GOV-001 offers two adjacent
constructs — Exceptions (waive a standard, time-boxed, human-approved) and CEO override —
and neither is a standing grant executed by software.

Recommended shape, **proposed not adopted**: a delegation is a **record** (scope, risk
ceiling, evidence preconditions, expiry, revocation, approver), not a configuration; it
**fails closed**; and **no self-expansion** — a system proposing its own authority expansion
inverts CONST-001 Art. III. **Owner: Founder.**

---

## X-14 — Mandate overlap with an absent Founder Interface UX workstream **[C] High, unreconcilable here**

The Mission Control UX specification records a mandate overlap (its C1) with a parallel
Founder Interface UX workstream. **No such document exists in the tree.** One of the two
parties to the conflict is absent, so it cannot be reconciled — only recorded.
**Owner: Founder / Director of Operations.**

---

## X-15 — The Sprint 1E remediation amended a port, not only internals **[C] Material — not a conflict**

`claimExecution` widened to `Promise<Execution | null>`, touching
`types/contracts/execution-runner.ts` — the contract **ADR-0001 D7** designates as what a
future durable adapter must meet.

**No ADR-0001 change is proposed.** Both reviewers support the widening and D7's text is not
contradicted. What follows is a dependency: the deployment/persistence ADR must specify its
adapter against the **amended** signature, and AR2-6's remaining port revision must be one
coherent workstream. Recorded for **informed Founder approval**, not as a defect.

---

## X-16 — Which sprint owns the Context Lifecycle Manager **[C] Material**

The Phase 2 plan states CLM ownership two ways inside one document: **P-5** lists it as a
distinct deliverable coordinate with 1F/1G/1H/1I, while **§3.3** attributes it to *"(1G/1H)"*.
Master Roadmap v8.0 §6 places it *"across the 1G/1H boundary… completed before 1I is approved
for long-running autonomous operation."*

Sprint assignment is roadmap authority, so this is downstream of **X-8**. **Owner: Founder.**

---

## X-17 — v7.1 → v8.0 supersession: may prior claims be carried forward? **[N] Material**

**Facts.** Master Roadmap **v7.1** was cited as governing authority by several planning
documents and was **never present in this repository**. Master Roadmap **v8.0** is now
registered at `docs/roadmap/MASTER_ROADMAP.md`. v8.0 states:

> *"This edition preserves every capability, dependency, boundary, operating rule, and
> acceptance gate from v7.1 while adding a governed commercial expansion path."*
> — Master Roadmap v8.0, §v8.0 Change Summary

**The question.** Planning documents contain conclusions derived from v7.1 sections that no
reviewer in this repository could open. v8.0's preservation statement is **the roadmap's own
assertion about a document nobody here has read.** Under GOV-001:369-371 that is not the same
as verification.

**Two readings:**

| Reading | Consequence |
|---|---|
| (a) v8.0's preservation statement is sufficient | v7.1-derived conclusions carry forward; citations are re-pointed to v8.0 sections and re-verified section-by-section |
| (b) It is not sufficient | Every v7.1-derived conclusion is re-derived against v8.0 before it may gate work |

**What this pass did.** Live v7.1 citations were re-pointed to v8.0 **only where the cited
section was confirmed to exist in v8.0 by direct reading** (§5). No conclusion was carried
forward on the strength of the preservation statement alone. **Owner: Founder.**

---

## X-18 — Agent status vocabulary: two sets, neither approved **[V] Low**

| Side | Values |
|---|---|
| **Master Roadmap v8.0, Appendix F** | Per role: `ACTIVE` / `WAITING` / `IDLE` / `REVISION` / `REVIEWING` / `COMPLETE` / `DECISION`, plus **Current assignment** and **Next condition** |
| **`SPRINT_1F_ENTRY_PACKAGE.md` §A.8** | `ACTIVE` / `IDLE` / `PENDING` — **`PENDING` does not appear in Appendix F** |

**No approved handbook or standard carries a status vocabulary at all** — verified by search
of `handbooks/`. CPU-001 §6.2 uses the Appendix F set and marks the choice provisional.
**Owner: Director of Operations**, subject to **X-8**.

---

## X-19 — Baseline tag immutability binds by decision but not by standard **[V] Material**

| Side | Text |
|---|---|
| **Recorded Founder decision**, committed at `SPRINT_1F_FOLLOWUP_REGISTER.md:98-99` | *"Protected baselines — `sprint-1e-baseline` → `62f6291` (pre-remediation), `sprint-1e-remediated` → `d922f379` (ratified)."* |
| **`standards/GIT_STANDARD.md` §Tags** (`:202-214`) | *"Use annotated tags for production releases… Tags should correspond to documented releases."* **No rule on baseline immutability or candidate freeze tags.** |
| **`standards/GIT_STANDARD.md` §Branch Strategy** (`:42-68`) | Names the two long-lived branches — `feature/dev-hq-operating-system` and `main` — and explicitly declines to widen the protected set |

The decision binds as tier 2. The standard does not reflect it, so a reader consulting only
the standard would not know the tags are protected — and `validation/…`, the branch holding
the entire Sprint 1E record, is not a protected branch under any rule.
**Owner: Director of Operations** (standard amendment), **Founder** (approval).

**Amended 2026-07-29 — the contradiction is unchanged, one side of it was factually wrong.**
This row previously quoted the standard as protecting *"`main` and `develop` only."* `develop`
has never existed in this repository (`git rev-parse develop` and `origin/develop` both fail),
and `feature/dev-hq-operating-system` — the branch `origin/HEAD` points at — was named nowhere
in the standard. The §Branch Strategy text was corrected to the two branches that exist. **No
decision was taken and the protected set was not widened**; whether baseline tags and
`validation/…` belong in it is still this entry's open question.

---

## X-20 — Identity of the Sprint 1F Preparation Handoff **[N] Material**

**A Founder-supplied document by this name was not located.** Searched: the repository (all
tracked and untracked paths), and `Downloads`, `Documents`, `Desktop`, and `OneDrive` to depth
3 for `.docx`, `.md`, `.pdf`, `.doc`, and `.txt` matching *handoff*, *preparation*,
*progress*, *handbook*, *roadmap*, or *operating*. The only match was the roadmap `.docx`
itself.

`docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` covers similar ground but is **not** it: it is a
coordinating-session product, untracked, marked `NOT FINALIZED`, and records the Preparation
Handoff as *"ABSENT — no trace"* in its own §A.1 — *"No file, and **no document references
it**."*

**Three readings, one decision:** (a) it exists and was not supplied to this pass; (b) the
Entry Package **is** it under a different name; (c) it does not exist and the requirement
should be discharged or restated. **Nothing was reconstructed for it.** **Owner: Founder** —
CPU-001 **F-G4**.

---

## X-21 — Tier-2 Founder decisions held only in an untracked file **[V] Material**

Three binding Founder decisions of 2026-07-26 — **permanent review order**, **ICR verdict
vocabulary**, and the **shared severity ladder** — exist in this repository only at
`docs/plans/PHASE_2_PROGRAM_PLAN.md:114-165`, which is **untracked**.

The same exposure applies to `RATIFICATION_1E_D922F379.md`, the untracked record that closes
Sprint 1E with 0 unresolved blockers.

> *"Review reports are Records under this document and must be retained with the work they
> gate."* — GOV-001:377-378

An Axis-A tier-2 decision stored in an uncommitted file is one `git clean` from
unrecoverable. **Owner: Director of Operations** (commit them), **Founder** (approve the
commit) — CPU-001 **F-G5**.

---

## X-23 — RAT-7 recurred during this pass, and the rule that would prevent it is not approved **[N] Material**

**Observed, not inferred.** Three changes landed in the shared working tree between 13:41 and
13:51 on 2026-07-26, while this governance pass was running: two audit documents and a
**118-line modification to `lib/dev-hq/agent-execution-service.test.ts`**. Full timeline in
CPU-001 §0a.

| Side | Text |
|---|---|
| **RAT-7**, `OBSERVATION` in the committed ratification | *"The `3daf0790…` freeze mutated mid-review because concurrent sessions shared one working tree; a freeze declared only in prose is not enforceable."* |
| **Sprint 1F Entry Package** §A.3, untracked planning draft | *"Hard rule from Sprint 1E: no shared working-tree writes while either review gate is active — including documentation and evidence."* |
| **`standards/GIT_STANDARD.md`** | **Silent.** No rule on working-tree isolation, concurrent sessions, or candidate freezes |

**The contradiction is between what the organization has learned and what it has approved.**
The failure mode is documented, named, and cost Sprint 1E a full review cycle and a `FAIL`
verdict — and the mitigation is carried in an **untracked planning draft** and as an
`OBSERVATION`, neither of which binds. POH-001 **R4** therefore marks it `PROPOSED`, which
means it could not have been cited to prevent what happened today.

**This entry is evidence for F-G2.** The question *"should R4 become controlling?"* now has a
second data point taken during the very pass that raised it. **Owner: Founder** (approve R4)
and **Director of Operations** (X-19's `GIT_STANDARD.md` amendment is the natural vehicle).

**Not asserted here:** that the working-tree writes were unauthorized. Their author is
unidentified — CPU-001 blocker **B-7** — and this pass took no position on the merits of the
test that appeared.

---

## X-22 — Missing register-naming rule across four ID spaces **[C] Low**

Four independent identifier spaces now exist — Sprint 1E findings (`RAT-n`, `AR2-n`, `1E-Fn`),
research (`R-nn`), Phase 2 (`D-nn`, `C-n`, `NEW-n`), and governance (`X-n`, `F-n`, `G-n`) —
with no rule about which register owns which kind of item. A naming rule achieves most of the
benefit of a merge at far lower cost. **Owner: Director of Operations.**

---

## X-24 — Sprint 1E baseline-tag identity: escalated as a mutation, refuted by evidence **[N] Material — evidence complete, ratification pending**

**Raised** by the Sprint 1F Track A implementation owner as an unresolved governance integrity
conflict: that `sprint-1e-baseline` no longer resolves to its documented identity.

| Side | Text |
|---|---|
| **Reported by the Track A owner** | Docs state `sprint-1e-baseline` → `62f62912…`; the repository *"currently resolves"* `sprint-1e-baseline` → `690e2268…`; `sprint-1e-remediated` → `d922f379…` *"still resolves correctly"* |
| **Recorded Founder decision** — `SPRINT_1F_FOLLOWUP_REGISTER.md:98-99` (committed) | *"Protected baselines — `sprint-1e-baseline` → `62f6291` (pre-remediation), `sprint-1e-remediated` → `d922f379` (ratified)."* |
| **CPU-001 §3** — `CURRENT_PROGRESS_UPDATE.md:210-216` | Tag object `cda7aa1b…` → target commit **`62f629128e…`**; tag object `690e2268…` → target commit **`d922f3794a…`**. *"Both are annotated tags; both resolve as recorded."* |
| **`CANDIDATE_FINAL_FREEZE.md:232`** | *"`sprint-1e-baseline` — **unmoved**. Annotated tag: object `cda7aa1b…`, commit `62f629128e…`. Both values appear in prior records and refer to different objects of the same unmoved tag; neither is an error."* |

### Command evidence, captured 2026-07-26 at HEAD `9069c12`

```
$ git rev-parse sprint-1e-baseline
cda7aa1b15e0009e17dfd7f194570b2f013f6bf7
$ git rev-parse sprint-1e-baseline^{commit}
62f629128e5092f593ff494cd729fe516694bbde
$ git rev-parse sprint-1e-remediated
690e22685cfb092f1e1e281a64b02059336c13ac
$ git rev-parse sprint-1e-remediated^{commit}
d922f3794a6c57f02039ab969e0b98477f4c4c29

$ git cat-file -t cda7aa1b   → tag        $ git cat-file -t 62f62912  → commit
$ git cat-file -t 690e2268   → tag        $ git cat-file -t d922f379  → commit

$ git show-ref --tags
cda7aa1b15e0009e17dfd7f194570b2f013f6bf7 refs/tags/sprint-1e-baseline
690e22685cfb092f1e1e281a64b02059336c13ac refs/tags/sprint-1e-remediated

$ cat .git/packed-refs                      # peel lines
cda7aa1b… refs/tags/sprint-1e-baseline
^62f629128e5092f593ff494cd729fe516694bbde
690e2268… refs/tags/sprint-1e-remediated
^d922f3794a6c57f02039ab969e0b98477f4c4c29

$ git ls-remote --tags origin               # independent third-party copy
cda7aa1b15e0009e17dfd7f194570b2f013f6bf7 refs/tags/sprint-1e-baseline
62f629128e5092f593ff494cd729fe516694bbde refs/tags/sprint-1e-baseline^{}

$ git reflog show --all --date=iso | grep refs/tags
(no output — git keeps no reflog for tags by default; .git/logs/refs/tags/ does not exist)

$ git worktree list        → single worktree; no divergent checkout
$ find . -maxdepth 3 -name .git  → ./.git only; no second clone
```

**Both tags are annotated.** `git rev-parse <annotated-tag>` returns the **tag object** SHA;
the commit requires `^{commit}` or `show-ref -d`. `690e2268…` is the **tag object of
`sprint-1e-remediated`** — it is not, and has never been, any identity of
`sprint-1e-baseline`.

### Determination against the five offered readings

| Reading | Verdict |
|---|---|
| Stale documentation | **No.** CPU-001 §3 already records both tag-object *and* peeled-commit SHAs correctly |
| Intentionally moved tag | **No.** The `sprint-1e-remediated` tag message states *"sprint-1e-baseline is PRESERVED at `62f6291`"* |
| Accidental tag mutation | **No.** Local peel, `packed-refs`, and the **remote** all agree on `62f629128e…` |
| Historical naming conflict | **No.** One tag name, one tag object, one target commit |
| Presently indeterminate | **No.** Resolved by direct command output under §1.4 |

**Sixth reading, which is the established one: a verification-method error in the report.**
The two tags were resolved by **different methods** — `sprint-1e-remediated` was reported at
its peeled commit `d922f379`, `sprint-1e-baseline` at an unpeeled tag object — and the tag
object quoted for the baseline belongs to the *other* tag. This exact confusion was already
identified and closed at `CANDIDATE_FINAL_FREEZE.md:232`; the escalation re-raised it.

### What is *not* established

Git keeps no reflog for tags, so tag immutability across the full interval **cannot be proven
from reflog evidence.** It rests on three converging indirect proofs: the remote copy agrees;
the tagger timestamp (`04:19:33 −0400`) is 18 s after commit `62f6291` (`04:19:15 −0400`); and
the later `sprint-1e-remediated` tag message asserts the preservation independently. This is
strong but not reflog-grade. **X-19 remains open** — no standard yet binds baseline-tag
immutability, so nothing *prevents* a future move.

**Owner: Director of Operations** to ratify this determination and lift the standing
instruction at `SPRINT_1F_ENTRY_PACKAGE.md` §B.3; **Founder** to close the §B.3 escalation
routed to the Governance Baseline Agent. **Recorded, not self-closed** — register rule 4.
**Recommended companion action:** discharge X-19 by amending `standards/GIT_STANDARD.md` to
require `git rev-parse <tag>^{commit}` (or `show-ref -d`) whenever a tag identity is asserted.

---

## X-25 — `lead-software-engineer` is chartered to implement but granted no write authority **[N] Material**

| Side | Text |
|---|---|
| **Canonical role charter** — `agents/lead-software-engineer/AGENT.md:17, 25-28, 57-62, 121-125` | *"You own technical implementation across the application…"* · *"Lead technical implementation"* · *"Implement business logic"* · Outputs: *"Feature implementations"* · Required Deliverables: *"1. Feature implementation"* |
| **Executable agent definition** — `.claude/agents/lead-software-engineer.md:4` (frontmatter) | `tools: Read, Glob, Grep, Bash, WebFetch, Skill` — **no `Write`, no `Edit`** |
| **Same file, `description`** | *"Delegate here for architectural **ownership questions**, implementation **feasibility**, and **design-level review**"* — an advisory framing, not an implementing one |
| **ORG-001:95-97** (via CPU-001 §6.1) | Lead Software Engineer is a role owner of record, assigned tool Claude Code |

**The charter and the executable definition disagree about what the role is.** The charter
makes feature implementation a *required deliverable*; the tool grant makes it *impossible*.
The `description` field sides with the tool grant. There is no reading under which the agent
can discharge implementation-owner duties as presently configured.

**Observed consequence, Sprint 1F Track A:** two further non-deliveries, recorded as
occurrences **8 and 9** at `SPRINT_1F_ENTRY_PACKAGE.md:633`, against a total of nine.

**This does not resolve the standing delivery-failure risk (CPU-001 §8.4).** Hypothesis 1,
*"tool boundary — assigned work the role could not perform"*, was already **eliminated** at
`WORKFLOW_DIAGNOSIS.md:262` by LSE-2 and LSE-3, which were *"tool-compatible, still failed."*
X-24 is therefore a **separate, independently real configuration defect** — not the root
cause, and it must not be reported as one. Occurrences 8 and 9 remain **root cause UNKNOWN**.

**Classification:** authority/definition mismatch. **The tool grant is wrong if the charter
controls; the charter is wrong if the advisory framing controls.** Which one yields is a
role-definition question, not an engineering one — and it is **Founder-reserved**, because
ORG-001 and the charter are Axis-A tier-3 documents (**F-G8**, §5).

**Owner: Director of Operations** (draft the conforming amendment), **Founder** (approve).
Intersects **X-9** (ORG-001 binds roles to named tools). **No agent definition was changed by
this entry.**

---

## X-26 — v8.0 → v10.4 supersession: may prior claims be carried forward? **[N] Material**

**Recorded 2026-07-29.** The roadmap registration record routes four open governance
questions to this register (`docs/roadmap/MASTER_ROADMAP.md:166-206`). This was the fourth,
and **it was tracked in no document at all** — not here, not in `OPEN_OBLIGATIONS.md`.

| Side | Text |
|---|---|
| **Master Roadmap v10.4, §v10.4 Change Summary** (`MASTER_ROADMAP.md:236`) | *"This edition preserves the long-term capability roadmap… No Phase 1, Phase 2, Phase 2.5, Phase 2.6, governance, reliability, compliance, commercial-control, or enterprise-platform capability is removed or weakened."* |
| **Repository** | Versions v8.1 through v10.3 were never present. **Neither was v8.0** — `git log --diff-filter=A -- docs/roadmap/MASTER_ROADMAP.md` returns one commit, `639be4f`, which registered v10.4 directly |

**The question.** This is **X-17 one step further out, and worse.** X-17 asked whether
v7.1-derived conclusions carry forward on v8.0's own preservation statement. But v8.0 was
never in this repository either, so the planning documents, POH-001 rules R2/R3/R7/R8/R11/
R12/R13b/R15, and Axis B that cite *"Master Roadmap v8.0"* rest on a document **no reviewer
here has ever been able to open**, and are now two undocumented version steps behind the
registered file.

**Two readings**, exactly parallel to X-17:

| Reading | Consequence |
|---|---|
| (a) v10.4's preservation statement is sufficient | v8.0-derived conclusions carry forward; citations are re-pointed to v10.4 sections and re-verified section-by-section |
| (b) It is not sufficient | Every v8.0-derived conclusion is re-derived against v10.4 before it may gate work |

**What the 2026-07-29 pass did.** Live *authority* citations only — the `Authority:` headers
and the Axis B table in ACR-001, POH-001 and the governance-baseline packet — were re-pointed
from "v8.0" to the registered v10.4 file. **No conclusion was carried forward, no section-by-
section re-derivation was performed, and every historical and evidentiary v8.0 citation was
left exactly as written.** Reading (a) was not adopted; it was not available to adopt.

**Owner: Founder.** Extends **X-17**; blocks the same three plans.

---

## X-27 — Does the Section 23 Binding Operating Kernel supplement or override `AGENTS.md`? **[N] Material**

**Recorded 2026-07-29**, discharging the roadmap's third routed question
(`MASTER_ROADMAP.md:194-199`). Previously tracked only as half of `OBL-15`, which records the
*obligation to decide*; the contradiction itself was recorded nowhere.

| Side | Text |
|---|---|
| **Master Roadmap v10.4 §Authority Rule** (`MASTER_ROADMAP.md:232`) | *"The VIYBD HQ — BINDING OPERATING KERNEL in Section 23 controls mandatory coordination, prompting, review, remediation, evidence, authority, handoff, and Founder-facing output behavior"* — for **every** response |
| **AGENT-001 (`AGENTS.md`)** | Governs the same domain: universal responsibilities, prohibitions, decision boundaries, communication standards, validation, handoff, escalation |

Both claim the whole of agent conduct. Where they differ, nothing says which yields. This is
**downstream of X-8** — under reading (i) of X-8 the roadmap is a tier-2 Founder decision and
the kernel outranks `AGENTS.md`; under reading (ii) it does not.

**Consequence while open:** v10.4's Axis B table carries a **Section 23 Binding Operating
Kernel** row that §1.2 of this register deliberately does not, precisely because adopting it
would answer this question by implication. **Owner: Founder.** Tracked as `OBL-15`.

---

## X-28 — Organization rename: Savrio → Viybd **[N] Material**

**Recorded 2026-07-29**, discharging the roadmap's first routed question
(`MASTER_ROADMAP.md:185-189`). Previously tracked only as `OBL-16`.

| Side | Text |
|---|---|
| **Master Roadmap v10.4** | **Zero** occurrences of "Savrio" in the Founder-supplied body, against **24** of "Viybd" (17 `Viybd` + 7 `VIYBD`). Titled *"VIYBD HQ"* |
| **Everything else** | `AGENTS.md`, CONST-001, GOV-001, ORG-001, the repository name `savrio-dev-hq`, the Mission Control UI, and every other registered governance document say **Savrio** |

Counted over the roadmap body only — everything after the `END REGISTRATION RECORD` marker at
`MASTER_ROADMAP.md:208`. The registration record above that marker is repository-added and
says "Savrio" 4 times itself, so a whole-file count answers a different question.
**Minor correction:** the registration record states *"15 of Viybd"* (`:185-186`); the body
carries 17 case-sensitive `Viybd` and 24 including `VIYBD`. The zero-Savrio half is exact.

Whether this is a company rename requiring a coordinated pass, or a roadmap-only naming
change, is a **Founder decision**. It is recorded here rather than resolved because a
unilateral pass either way would rewrite governing documents on an assumption.
**Owner: Founder.** Tracked as `OBL-16`.

---

## X-29 — The queue-stall deadline amends two approved ADRs **[CLOSED 2026-07-29]**

**Recorded 2026-07-29. Verified at HEAD `638e45c`, branch `chore/close-open-obligations`** — a
different HEAD from the `[V]` marks in §0.1, which were taken at `9069c12`.

This entry originally recorded a **delegation and an outstanding action**, not a
contradiction awaiting a Founder answer. It is retained because shipped
behaviour temporarily bound differently from two approved ADRs before ADR-0003
closed the record gap.

| Side | Text |
|---|---|
| **ADR-0001 O6** (`docs/decisions/ADR-0001-execution-manager-and-agent-registry.md:201-204`) | *"Folded into O2: no available capability match leaves the execution `queued` with a logged event; budget exhaustion escalates via approval. **No separate decision needed.**"* |
| **ADR-0002 E2** (`docs/decisions/ADR-0002-review-escalation-and-work-management.md:107`) | *"`Escalation` (id, origin `retry_exhausted \| review_exhausted`, taskId, …)"* — a **two-member** `EscalationOrigin` domain |
| **Shipped in `3471658`** | `types/domain/escalation.ts:15-18` declares `EscalationOrigin = "retry_exhausted" \| "review_exhausted" \| "queue_stalled"`, and `isQueueStalled` (`lib/dev-hq/agent-execution-service.ts:1387`) makes `queued` terminating once `EXECUTION_QUEUE_STALL_DEADLINE_MS` elapses |

**What changed, precisely.** O6 makes `queued` a **resting** state: an execution with no
capability match waits, with a logged event, and O6 states in terms that no separate decision is
needed. A stall deadline makes `queued` **terminating** — past the deadline the execution raises
a founder escalation. That is an amendment to O6, not an implementation of it. Separately,
`queue_stalled` adds a **third member** to E2's `EscalationOrigin` domain, deliberately distinct
rather than a reuse of `retry_exhausted`: escalations dedupe per `(execution, origin)`, so
sharing the origin would swallow a later genuine exhaustion — the founder would be told once
that the work was waiting and never told that it then failed three times.

**The decision, and the evidence for it.** `3471658`'s commit message records that both
amendments *"were escalated to the Founder, who delegated the decision on 2026-07-29."*
**At the time this entry was written, that message was the whole of the evidence
available in this repository.** There was no Founder-signed record, no entry in
any decision document, and nothing in `git log` beyond the
assertion carried by the commit that made the change. Under §1.4 and register rule 3 that is
worth stating rather than smoothing: the delegation is **attested by the implementing author**,
not independently recorded. The later closure paragraph records the independent
Founder authorization that resolved this evidence gap.

**The alternative that was weighed and rejected**, recorded under Appendix G so a later reader
does not mistake it for an option nobody considered: leave O6 alone and fix only the silence, by
re-firing the assignment-deferral event on a bounded cadence. It needs **no ADR amendment at
all**, because `queued` stays a resting state. It was rejected on the ground that it makes
stranding **noisy without ever producing a founder decision** — the work still neither completes
nor fails, and the founder receives a repeating notice rather than something to act on.

**Historical gap.** Neither original ADR was amended. `git log -- docs/decisions/` shows the
two files last touched by `df9eb3d` and `4255635`, both far outside the remediation range
`0d83525..638e45c`, and ADR-0002 E2 still publishes a two-member origin domain that the shipped
type contradicts. `VERSIONING_POLICY.md:222-232` forbids closing this by editing them —
*"Architecture Decision Records are immutable historical documents. Do not modify the original
decision after approval. Instead: create a new ADR, reference the previous ADR, explain why the
decision changed."* The required action was therefore a **new ADR** superseding ADR-0001 O6
and ADR-0002 E2's origin domain, not a patch to either. ADR numbers are assigned centrally
(§7 rule 4), which is why none was proposed in the original entry.

**Closure, 2026-07-29.** The Founder authorized all eight decisions in
`docs/plans/OPEN_AT_HANDOFF.md` section 3 with **“do these, all of them.”**
`docs/decisions/ADR-0003-stalled-execution-and-task-terminal-lifecycle.md` now
supersedes ADR-0001 O6 and extends ADR-0002 E2 without editing either historical
record. It names the 120-second O5-class deadline, `queue_stalled`, and the
resolution semantics for linked queued/running work. X-29 is therefore closed;
the original discrepancy remains here as retained history.

---

# 4. Discharged — retained under Appendix G

| # | Item | How discharged | Verified |
|---|---|---|---|
| **X-1b** | 1F plan claimed ADR-0001 D8 and ADR-0002 D-E6/E9 *both* place scorecards in Sprint 1F. **ADR-0001 D8 says the opposite.** | **Corrected by the 1F owner** in §3.1 and Q-6; the conclusion is unchanged and its basis is now accurate | **[V]** — `SPRINT_1F_MISSION_CONTROL_LITE.md:238-241, 1313-1315` read at HEAD |
| **X-2** | 1F plan §16.1 listed the architecture gate **before** independent code review, inverting GOV-001:174-189 | **Corrected by the 1F owner.** §16.1 now reads *"G-2 Independent code review… Runs first of the two commit gates"* and *"G-3 Architecture review… Runs after G-2"* | **[V]** — `SPRINT_1F_MISSION_CONTROL_LITE.md:901-919` read at HEAD |
| **X-4** | *"No actor can produce an implementation specification"* | **Falsified by demonstration** — CR-1E delivered a 1,168-line complete specification. **Consistent with two competing hypotheses and identifies neither.** The four earlier failures remain unexplained | **[C]** |

**X-4's discharge is narrow and must not be overstated.** The blocker moved; the diagnosis did
not. The underlying operational risk — seven consecutive in-session agents delivering nothing,
three hypotheses eliminated by test, **root cause UNKNOWN** — is open and is recorded as a
standing risk in CPU-001 §8.4, not as a discharged contradiction.

---

# 5. Missing decisions

Every item is Founder-reserved unless stated. **None is answered.** Cross-referenced to
CPU-001 §9.

| # | Decision | Blocks | Register item |
|---|---|---|---|
| **F-G1** | Which `AGENTS.md` tier the roadmap and the handbook occupy | POH-001 approval; four PROPOSED rules; X-16, X-18 | X-8 |
| **F-G2** | Approve POH-001; rule on each PROPOSED rule (R4, R11, R12, R13b, R8's L0–L5 grid) | The governance baseline | §6 |
| **F-G3** | Canonical reviewer verdict vocabulary, and which sources are retired | Every future review gate | X-7, X-7b |
| **F-G4** | Identity of the Sprint 1F Preparation Handoff | Baseline completeness | X-20 |
| **F-G5** | Commit the untracked ratification record and the three untracked Founder decisions | Record integrity | X-21 |
| **F-G6** | Reviewer independence route for the next candidate | Track A's commit gate | X-3 |
| **F-G7** | May v7.1-derived conclusions carry forward on v8.0's preservation statement? | Re-verification workload across three plans | X-17 |
| **F-G9** | May v8.0-derived conclusions carry forward on v10.4's preservation statement — given v8.0 was never in this repository either? | The same three plans, plus POH-001 R2/R3/R7/R8/R11/R12/R13b/R15 and Axis B | X-26 |
| **F-G10** | Does the Section 23 Binding Operating Kernel supplement or override `AGENTS.md`? | Whether Axis B gains a kernel row; agent conduct rules | X-27, `OBL-15` |
| **F-G11** | Savrio → Viybd: company rename, or roadmap-only naming? | A coordinated pass across every governed document | X-28, `OBL-16` |
| **F-A1** | 1E-F4 target — already-pinned message branch, or unpinned deferral guard | Track A start | CPU-001 §8.1 |
| **F-A2** | RAT-5 disposition — record-only or in scope | Track A scope | CPU-001 §8.1 |
| **F-A3** | 1E-F1 and 1E-F2 — in or out | Track A scope | CPU-001 §8.1 |
| **F-11** | Scorecards: Phase 2 or Sprint 1F, and which ADR is amended | 1F scope | X-1 |
| **F-12** | Governed-communication ADR | Phase 2 2A-6, 2G | X-6 |
| **F-13** | `WorkItem` promotion ownership; ADR-0002 owner of record | Phase 2 2A/2B, 1F Q-3(a) | X-10 |
| **F-14** | Delegated acceptance framework; whether HQ may propose its own authority expansion | Phase 2 2D | X-13 |
| **F-16** | ORG-001 conforming amendment on model neutrality | Phase 2 | X-9 |
| **F-18** | Which sprint owns the Context Lifecycle Manager | 1G/1H/1I sequencing | X-16 |
| **F-G8** | **Does the `lead-software-engineer` charter or its advisory tool grant control?** Then amend the losing document — either grant `Write`/`Edit`, or strike implementation from its Required Deliverables | Any Track A delegation to that agent | X-25 |
| **X-12 owner ruling** | Author the missing handbook and three standards, or record accepted absences | Gate completeness | X-12 |
| **X-19 owner ruling** | Amend `GIT_STANDARD.md` for baseline and freeze-tag protection **and require `^{commit}` peeling whenever a tag identity is asserted** | Tag safety | X-19, X-24 |
| **X-24 owner ratification** | Ratify that `sprint-1e-baseline` is **unmoved** at `62f629128e…` and lift the §B.3 standing instruction | Sprint 1F tag-identity escalation | X-24 |

---

# 6. PROPOSED rules awaiting ruling

Carried from POH-001. **None is binding.** A PROPOSED rule may not be cited to block work,
fail a review, or justify a gate.

| Rule | Subject | Why not controlling |
|---|---|---|
| **POH R4** | Candidate freeze and review-session isolation | Rests on `OBSERVATION`-severity findings (RAT-4, RAT-7) and untracked planning drafts. `GIT_STANDARD.md` has no freeze rule. A logged observation is not an approved standard |
| **POH R11** | Context-restoration verification | Roadmap-tier (**X-8**); only specification is untracked and unapproved and ships every threshold `provisional: true`; **no implementation exists** |
| **POH R12** | Agent status vocabulary | Roadmap-tier (**X-8**); contradicted by the Entry Package (**X-18**); no approved source |
| **POH R13b** | Prompt and session-coordination requirements | Roadmap-tier (**X-8**); the separate-clean-session basis has an **UNKNOWN root cause** |
| **POH R8** (part) | L0–L5 Delegated Authority Levels and the Automatic Acceptance Rule | Roadmap-tier (**X-8**); finer-grained than CONST-001 Art. III; intersects **X-13** |

---

# 7. Rules deliberately not chosen

Recorded so that a later reader does not mistake omission for oversight.

1. **A verdict vocabulary was not selected** (X-7). A recommendation exists in
   `GOVERNANCE_UPDATE_PLAN.md` §9 and is not adopted here. Selecting one would be authorship.
2. **An authority tier for the roadmap was not assigned** (X-8). All three readings are
   coherent; choosing among them is Founder-reserved.
3. **The reviewer-independence route was not chosen** (X-3). Three routes are listed; none is
   recommended over the others by this pass.
4. **No ADR was drafted, numbered, or amended.** ADR numbers are assigned centrally by
   recorded Founder decision.
5. **The Sprint 1F Preparation Handoff was not reconstructed** (X-20). Nothing was written to
   fill an absent source.
6. **`RAT-5`, `1E-F1`, and `1E-F2` scope questions were not answered** — they are Track A
   decisions, and this is a governance pass.

---

# 8. Record

- **Compiled by:** governance documentation coordination pass, Operations proposal authority
  only. No decision authority was exercised.
- **Verified at:** HEAD `9069c12`, branch `validation/sprint-1e-overnight-2026-07-26`.
- **Items verified this pass [V]:** X-1, X-2, X-7, X-7b, X-8, X-9, X-12, X-18, X-19, X-21,
  X-1b.
- **Items carried forward unverified [C]:** X-3, X-6, X-10, X-13, X-14, X-15, X-16, X-22, X-4.
  A reviewer should re-verify these against their cited sources before relying on them.
- **Items new this pass [N]:** X-17, X-20, X-23 (governance compiler); **X-24, X-25 (appended
  by a second, concurrent writer — NOT verified by the governance compiler).** A reviewer must
  re-derive both from their cited sources rather than relying on this register for them.
- **Working-tree volatility.** Three changes by another actor landed in the shared tree during
  this pass (X-23), and a second writer appended a colliding `X-23` while this section was
  being written. Re-verify every `[V]` mark against `git status` before relying on it.
- **Originally appended 2026-07-29 at HEAD `638e45c`, branch `chore/close-open-obligations`:** **X-29**, by a
  recording pass over the remediation range `0d83525..638e45c`. Both sides were read directly at
  that HEAD — the two ADR texts, `types/domain/escalation.ts`, and `git log -- docs/decisions/`
  establishing that neither ADR had been touched. At that time the Founder
  delegation could not be independently verified; the only evidence was
  `3471658`'s commit message, and no ADR was drafted, numbered, or amended.
- **Closed 2026-07-29:** X-29, after the Founder instructed **“do these, all of
  them”** for the eight decisions in `OPEN_AT_HANDOFF.md` section 3 and ADR-0003
  recorded the superseding decision. This closure update changes no other
  register item.
- **Contradictions resolved: 1 (X-29).** **X-24 is an exception in kind
  and not in status:** its *factual* question is settled by command output under §1.4, but the
  entry is **not closed** — under register rule 4 the Director of Operations must record the
  determination. This pass forms a view; it does not decide.
- **Tag-identity method note.** Every tag assertion in this register was taken from
  `git rev-parse <tag>^{commit}` and cross-checked against `git ls-remote --tags origin`.
  Bare `git rev-parse <tag>` on an annotated tag returns the **tag object**, not the commit;
  that distinction is the whole of X-24.
- **No ADR, standard, handbook, agent definition, workflow, test, source file, protected
  evidence file, or tag was modified by the creation of this document. No commit was made.**
