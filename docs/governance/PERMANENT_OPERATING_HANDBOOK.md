# Permanent Operating Handbook

**Document ID:** POH-001
**Version:** 0.1.0
**Status:** **DRAFT — NOT YET APPROVED.** Consolidation only. This document creates no new
policy and grants no authority. Every rule below is either (a) already controlling under a
cited approved authority, or (b) explicitly marked **PROPOSED** and therefore not binding.
**Authority:** CONST-001, GOV-001, ORG-001, AGENT-001 (`AGENTS.md`), ADR-0001, ADR-0002,
Master Roadmap v8.0, recorded Founder decisions
**Owner:** Director of Operations (consolidation); Founder (approval)
**Baseline:** branch `validation/sprint-1e-overnight-2026-07-26`, HEAD `9069c12`

---

# 0. What this document is

The Master Roadmap, the Phase 2 program plan, and the Sprint 1F planning corpus all cite a
*Permanent Operating Handbook* as a controlling authority. No such document existed in this
repository. This is the first draft of it.

It is built by **consolidation, not authorship**. Its method:

1. Take only rules that are already stable and already approved somewhere.
2. Restate each rule and **cite the exact authority it comes from**.
3. Where two approved sources disagree, **record the disagreement and choose neither**.
4. Where a rule is widely practised but never approved, **mark it PROPOSED**.

## 0.1 What this document is not

- It is **not** approved policy. Its own status is DRAFT until the Founder approves it.
- It is **not** a new source of authority. Every controlling rule here already binds through
  its cited source; deleting this file would not un-bind any of them.
- It is **not** a resolution of any open question. Contradictions are carried to
  `AUTHORITY_AND_CONTRADICTION_REGISTER.md` (ACR-001) unresolved.
- It does **not** promote any recommendation, specialist draft, or observation into a rule.

## 0.2 How to read a rule

Each rule carries a status:

| Status | Meaning |
|---|---|
| **CONTROLLING** | Already binding through the cited approved authority. Restated here, not created here. |
| **CONTROLLING (PARTIAL)** | The core duty is approved; a named part of it is not. The unapproved part is marked inline. |
| **PROPOSED** | **Not binding.** Practised, recommended, or roadmap-stated, but not approved as an operating rule. Listed so it can be approved or rejected deliberately rather than drifting into force. |

A rule marked PROPOSED may not be cited to block work, fail a review, or justify a gate.

---

# 1. Document authority and precedence

**This section is reproduced identically in POH-001, CPU-001, ACR-001, and the
governance-baseline review packet.** If the four copies ever diverge, that divergence is
itself a governance defect and must be reported, not reconciled locally.

Dev HQ uses **two precedence axes**. They answer different questions and neither replaces
the other.

## 1.1 Axis A — governing-document precedence (which document wins)

Source: **CONST-001 Article IX** and **AGENT-001 (`AGENTS.md`) §Governing Authority**, which
state the same eight tiers.

1. Company Constitution (CONST-001)
2. CEO/Founder-approved decisions
3. Company governance documents (GOV-001, ORG-001)
4. Company standards (`standards/`)
5. Approved product requirements
6. Department handbooks (`handbooks/`)
7. Workflow instructions (`docs/workflows/`)
8. Individual task instructions

> CONST-001:329 — *"Standards may provide more detailed requirements than this Constitution,
> but no standard may contradict it."*

## 1.2 Axis B — source-of-truth precedence (which artifact is right about a fact)

Source: **Master Roadmap v8.0, §Authority Rule** and its accompanying table.

| Source | Authoritative for |
|---|---|
| Repository + verified command output | What exists and passes **now** |
| Current Progress Update (CPU-001) | Current sprint, candidate, owners, reviews, blockers, next gate |
| Approved ADRs and recorded decisions | Architecture, security, policy, governance constraints |
| Permanent Operating Handbook (this document) | Stable operating rules, authority boundaries, review behaviour, prompt standards |
| Master Roadmap v8.0 | Long-term capability direction, dependencies, phase promises, completion gates |

## 1.3 The unresolved seam between the two axes

**Axis A contains no roadmap tier and no handbook tier.** CONST-001 Art. IX and `AGENTS.md`
§Governing Authority list eight tiers; neither the Master Roadmap nor this handbook appears
in them. Axis B asserts a position for both.

**This handbook does not resolve that.** It is carried as register item **X-8** and is a
Founder decision. Until it is answered:

- Where Axis A and Axis B are both silent on a conflict, **escalate** rather than choose.
- Where a claim rests only on the roadmap or only on this handbook, it is an
  **unverifiable-tier premise** and must be labelled as such, not asserted as governed.

## 1.4 The rule that governs all of the above

> **The repository and verified command output control implementation truth.**
> — Master Roadmap v8.0 §Authority Rule; GOV-001:373-375; AGENT-001 §Validation Standards

No document in either axis — including this one and including the roadmap — may be cited as
evidence that code exists, a test passes, a review happened, or a gate closed.

---

# 2. Controlling rules

## R1 — Source-of-truth precedence

**Status: CONTROLLING (PARTIAL).**

Both precedence axes in §1 apply. Repository and verified command output outrank every
document on questions of implementation truth. Approved ADRs and recorded Founder decisions
outrank plans. Plans outrank drafts. Drafts bind nothing.

**Sources:** CONST-001 Art. IX (`docs/company/COMPANY_CONSTITUTION.md:331-341`) ·
AGENT-001 §Governing Authority (`AGENTS.md`) · Master Roadmap v8.0 §Authority Rule ·
GOV-001 §Evidence and Audit Requirements (`docs/company/GOVERNANCE.md:364-378`).

**Not approved:** the *position of the roadmap and of this handbook within Axis A*. See
§1.3 and register **X-8**.

---

## R2 — Work Management Layer authority

**Status: CONTROLLING.**

All work flows through the centralized Work Management Layer, which owns task queues, state,
dependencies, priorities, evidence, logs, retries, approvals, and scorecards. It is the only
owner of durable workflow state and of valid state transitions. There is no direct
agent-to-agent communication that creates durable state.

**Sources, quoted:**

> *"All work flows through the centralized Work Management Layer, which owns task queues,
> state, dependencies, priorities, evidence, logs, retries, approvals, and scorecards."*
> — ADR-0001 Problem Statement, `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md:73-75`

> *"Preserved invariants: the founder-request workflow, current public API behavior, the
> centralized Work Management Layer, **no direct agent-to-agent communication**, and
> Trigger.dev as durable infrastructure rather than the product layer."*
> — ADR-0002 Problem Statement, `docs/decisions/ADR-0002-review-escalation-and-work-management.md:63-65`

> Governance / Work Management — *"Only owner of durable workflow state and valid
> transitions."* — Master Roadmap v8.0 §3, Canonical Architecture table

**Open conflict, not resolved here:** the Phase 2 plan's stages 2A-6 and 2G require brokered
agent communication, and the roadmap §4A specifies "Controlled Agent Communication". Whether
governed brokered traffic is compatible with the ADR invariant or is a material deviation is
register item **X-6** and a Founder decision. **Until it is answered, the invariant above
stands as written.**

---

## R3 — Candidate identity

**Status: CONTROLLING** for the rule. **PROPOSED** for the enforcement mechanism (see R4).

A review is issued against one named, stable candidate. The candidate identity is recorded
with the verdict. Material change to the work after a verdict invalidates that verdict, and
the review must be redone. A completion claim may not substitute for candidate identity.

**Sources, quoted:**

> *"Material change to the work after a verdict invalidates that verdict. The review must be
> redone."* — GOV-001 §Blocker Resolution and Re-Review, `docs/company/GOVERNANCE.md:333-334`

> *"Reviews are tied to a named stable candidate…"* — Master Roadmap v8.0 §8

> *"Candidate identity: branch, commit, diff, artifact, configuration, and environment."*
> — Master Roadmap v8.0, Appendix E — Standard Review Output

> Prohibited shortcut: *"Allowing completion claims to replace tests, evidence, review, or
> candidate identity."* — Master Roadmap v8.0 §22

> *"Evidence is tied to the final candidate; later edits invalidate affected evidence and
> approvals."* — Master Roadmap v8.0 §8, Verification-First Completion

**Demonstrated in practice, and why the rule exists.** Sprint 1E's `3daf0790…` candidate
mutated mid-review, producing a `FAIL` on candidate identity rather than on code quality
(`docs/validation/sprint-1e-overnight-2026-07-26/FRESH_CR_1E_3DAF_FINAL_REVIEW.md`). That
`FAIL` was closed only by binding a fresh verdict to the committed bytes
(`RATIFICATION_1E_D922F379.md`, finding **RAT-2**).

---

## R4 — Freeze and review-session isolation

**Status: PROPOSED. NOT BINDING.**

Recorded here because it is repeatedly relied on in Sprint 1F planning and has **no approved
source**. `standards/GIT_STANDARD.md` protects only `main` and `develop` (`:44-47`) and says
nothing about candidate freezes, sprint baseline tags, worktree isolation, or concurrent
session writes.

The proposed rule, as practised and recommended:

1. A candidate is frozen as an immutable git object (freeze branch + tag), not as
   working-tree state.
2. Reviewers review `git show <candidate-tag>`, never the working tree.
3. The tag is re-verified immediately before and immediately after each review.
4. No shared working-tree writes — **including documentation and evidence** — while a review
   gate is active.
5. Reviews run from a separate clean session.

**Sources — all observations, diagnoses, or planning drafts; none approved:**

- **RAT-7**, an `OBSERVATION` in the committed ratification: *"The `3daf0790…` freeze mutated
  mid-review because concurrent sessions shared one working tree; a freeze declared only in
  prose is not enforceable."* — `RATIFICATION_1E_D922F379.md:174`; carried as a logged
  process item in the committed `SPRINT_1F_FOLLOWUP_REGISTER.md:81`.
- **RAT-4**, `OBSERVATION`: freeze records document gates by result rather than by literal
  command string — `RATIFICATION_1E_D922F379.md:171`.
- `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` §13–§15 and §A.4–§A.6 — **untracked,
  planning-only, explicitly not authorized.**
- `docs/validation/sprint-1e-overnight-2026-07-26/WORKFLOW_DIAGNOSIS.md` — the separate-clean-session
  finding. **Root cause of the in-session delivery failure remains UNKNOWN.**

**A logged observation is not an approved standard.** Founder decision required — register
item **F-A7 / D-3**.

---

## R5 — Implementation and reviewer independence

**Status: CONTROLLING.**

Implementation ownership and review authority may never rest with the same agent for the
same work.

**Source, quoted verbatim** — GOV-001 §Separation of Implementation and Review,
`docs/company/GOVERNANCE.md:222-238`:

> *"Implementation ownership and review authority may never rest with the same agent for the
> same work.*
> - *A reviewer must not review work it produced, planned, or directed.*
> - *A reviewer must not edit, implement, or apply a fix to the work under review. Reviewers
>   recommend; the responsible owner implements.*
> - *The Architecture Reviewer is read-only. Its git access is inspection only: `status`,
>   `diff`, `log`, and `show`.*
> - *The Independent Code Reviewer is independent from implementation and does not rewrite
>   the implementation it reviews.*
> - *Remediation returns to the responsible owner, never to the reviewer who raised the
>   finding.*
>
> *A review produced by the agent that produced the work is not a review, and does not
> satisfy the commit gate."*

**Corroborating:** ORG-001:156-160 (*"The Architecture Reviewer is read-only and never
implements"*) · Master Roadmap v8.0 §3 — the Executive Orchestrator *"must not become a
competing source of durable truth or approve its own implementation."*

**Open conflict, not resolved here:** during Sprint 1E remediation both reviewers
contributed to the candidate — CR-1E authored the patch specification, AR-1E authored the
negative-outcome policy and ruled on four deviations. Neither was clean for its own gate.
Register item **X-3**. The three available routes (third reviewer instance, recorded
Exception under GOV-001 §Exceptions, human review) are listed in
`docs/plans/GOVERNANCE_UPDATE_PLAN.md` §4.1a; **none is chosen here.**

---

## R6 — Review ordering

**Status: CONTROLLING.**

Every candidate passes, in this sequence:

```
Independent Code Review → Architecture Review → Founder Approval → Protected Baseline
```

Nothing enters a protected baseline that has not cleared all three preceding steps in that
order.

**Sources:**

> *"4. Independent Code Reviewer review. 5. Remediation of unresolved code-review blockers…
> 6. Architecture Reviewer review. 7. Remediation of unresolved architecture blockers…
> 8. Founder approval, where mandatory… 9. Commit."*
> — GOV-001 §Official Review and Approval Order, `docs/company/GOVERNANCE.md:174-181`

> *"Code review precedes architecture review deliberately. Architecture review is the more
> expensive judgment, and it should be spent on work whose line-level defects are already
> resolved. Running the two concurrently is permitted only when Operations records the
> decision and both verdicts are obtained before the commit gate."*
> — GOV-001:185-189

> **Recorded Founder decision, 2026-07-26** — *"Permanent review order… Nothing enters the
> protected baseline that has not cleared all three preceding steps in that order."*
> — recorded at `docs/plans/PHASE_2_PROGRAM_PLAN.md:120-124`

**Recorded contradiction, not corrected here:** `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md`
§16.1 lists the architecture gate (G-2) **before** independent code review (G-3), inverting
this order. Register item **X-2**. Correction belongs to that document's owner.

**Specialist lenses** (security, reliability, database, devops, QA, design) report *into* the
two review steps. They are not additional gates and neither substitutes for either review —
recorded Founder decision, `PHASE_2_PROGRAM_PLAN.md:135-138`.

---

## R7 — Evidence-first completion

**Status: CONTROLLING.**

Work is complete only when it is proven complete. Generation is not completion.

**Sources, quoted:**

> *"Code existing in the repository does not by itself mean the work is done. Unverified,
> partially implemented, or known-broken work must be labeled accordingly."*
> — CONST-001 Art. VII, `docs/company/COMPANY_CONSTITUTION.md:264-266`

> *"Do not claim success based only on code generation."* — CONST-001 Art. V, item 14

> *"Validation may not be claimed unless it was performed and its output can be shown. Work
> not validated must be disclosed."* — GOV-001:374-375

> *"Prior approvals and review reports are context, never proof."* — GOV-001:376

> *"Each finding is labeled a **confirmed defect** (the failing path was traced) or a
> **plausible risk** (it could not be fully verified), and never both."* — GOV-001:372-373

> *"An asserted ADR, standard, or contract violation quotes the text being applied. A
> constraint may not be paraphrased into existence."* — GOV-001:369-371

> Verification-First Completion — *"Every blocker is fixed, disproven by evidence,
> reclassified by an authorized reviewer, or resolved by proper decision authority. Evidence
> is tied to the final candidate…"* — Master Roadmap v8.0 §8

**Commit-gate consequence** — GOV-001:314-320: *"Work carrying an unresolved blocker cannot
pass the commit gate. There is no score, threshold, or majority: one unresolved blocker is
sufficient to stop the commit."* And: `PASS WITH NON-BLOCKING FOLLOW-UPS` permits commit
**only** when the follow-ups are recorded durably — *"An unrecorded follow-up has not been
accepted; it has been lost, and the verdict does not authorize commit."*

---

## R8 — Authority and escalation

**Status: CONTROLLING** for the duty. **Tier-unresolved** for the L0–L5 grid.

An employee decides within its role, scope, and documented authority, and **escalates rather
than choosing an unauthorized interpretation.** Escalation states the blocker, the facts, the
impact, the options, the recommended option, and the required decision owner.

A Founder decision cannot be overridden or relitigated. An agent that identifies risk in a
Founder decision records that risk **once**, then proceeds — the single exception being a
decision requiring an unauthorized or prohibited action, which must be escalated rather than
performed. (GOV-001:193-198.)

**Sources:** CONST-001 Art. III and Art. VIII · GOV-001 §Review Authority (:191-220),
§Reviewer Escalation (:380-388), §Conflict Resolution (:458-470) · AGENT-001 §Escalation
Standards, §Decision Boundaries · Master Roadmap v8.0 §2 Reserved Founder Authority.

**Roadmap-sourced, tier unresolved (X-8):** the **L0–L5 Delegated Authority Levels** grid and
the **Automatic Acceptance Rule** (Master Roadmap v8.0 §2) are a finer-grained authority model
than CONST-001 Art. III carries. They are recorded, and **not** cited here as controlling,
pending X-8. GOV-PLAN-001 §4.10 independently records that *no governance construct exists
for machine-executed Founder authority* — register item **X-13**.

---

## R9 — No silent success

**Status: CONTROLLING.**

Work may not be reported as complete, validated, reviewed, or committed unless it was.
Uncertainty, defects, limitations, and known risks are disclosed, not omitted.

**Sources, quoted:**

> AI employees must not: *"Claim that validation was performed when it was not… Hide
> uncertainty, defects, limitations, or known risks… Mark work complete solely because code
> or documentation was generated… Avoid claiming a commit, push, deployment, or merge
> occurred unless it was verified."*
> — AGENT-001 §Universal Prohibitions and §Repository Conduct (`AGENTS.md`)

> *"When uncertainty exists: 1. State what is known. 2. State what is unknown. 3. Explain why
> it matters. 4. Identify the risk of proceeding. 5. Recommend the next action. Never hide
> uncertainty to make an answer appear more complete."* — AGENT-001 §Communication Standards

> Prohibited shortcut: *"Allowing completion claims to replace tests, evidence, review, or
> candidate identity."* — Master Roadmap v8.0 §22

> *"Honest limitations are better than false confidence."* — CONST-001 Art. XI

---

## R10 — No fabricated evidence

**Status: CONTROLLING.**

Requirements, facts, test results, approvals, citations, and evidence may not be invented. A
recorded verdict may not be discarded.

**Sources, quoted:**

> AI employees must not *"Invent requirements, facts, test results, approvals, or evidence"*
> or *"Present speculation as confirmed fact."* — AGENT-001 §Universal Prohibitions

> *"Do not fabricate citations, documentation, test output, or source findings."*
> — AGENT-001 §Research and Evidence

> *"Every invocation and its verdict must be recorded, including superseded ones. Discarding
> a verdict is falsification of the record."* — GOV-001:359-360

> *"Agents must not hide disagreement or invent approval."* — GOV-001:470

**Applied to this document.** No content in POH-001, CPU-001, or ACR-001 was reconstructed
from an absent source, and no reconstructed content is presented as previously authoritative.
Where a source was missing, that is stated rather than filled.

---

## R11 — Context-restoration verification

**Status: PROPOSED. NOT BINDING. No implementation exists.**

The proposed rule: a successor session must verify work identity, repository, branch, HEAD,
diff, tests, reviews, authority, dependencies, and environment **before mutable work
resumes**; a failed restoration falls back to an earlier verified checkpoint or creates an
explicit recovery/uncertain state and blocks unsafe work.

**Sources:**

> *"Roll before exhaustion at natural boundaries. Prevent duplicate ownership. Verify work
> identity, repository, branch, HEAD, diff, tests, reviews, authority, dependencies, and
> environment before mutable work resumes."* — Master Roadmap v8.0 §6, Automatic rollover and restoration

> Prohibited shortcut: *"Allowing restored sessions to modify code before verification."*
> — Master Roadmap v8.0 §22

> *"Successor sessions verify restoration before mutable work resumes."* — Master Roadmap v8.0 §20

**Why PROPOSED and not CONTROLLING:**

1. Its authority is roadmap-tier, and the roadmap's tier is unresolved (**X-8**).
2. The only specification is `agents/lead-software-engineer/outputs/CONTEXT_LIFECYCLE_MANAGER_SPEC.md`
   (SPEC-CLM-001 v1.1.0), which is **untracked and unapproved**, ships every threshold as
   `provisional: true`, and explicitly declines threshold ownership on governance grounds.
3. **No Context Lifecycle Manager exists in code.** The roadmap places it across the 1G/1H
   boundary; Phase 1 is at Sprint 1F.
4. Which sprint owns it is itself contested — register item **X-16**.

---

## R12 — Agent status vocabulary

**Status: PROPOSED. NOT BINDING.**

The roadmap supplies a vocabulary; **no approved handbook, standard, or governance document
carries one.** A search of `handbooks/` returns no status-vocabulary definition.

Roadmap-supplied set (Master Roadmap v8.0, **Appendix F — Agent Status and Handoff
Template**), per role:

| Role | Status values |
|---|---|
| Executive / Orchestrator | `ACTIVE` / `WAITING` |
| design-engineer | `IDLE` / `ACTIVE` / `WAITING` |
| lead-software-engineer | `IDLE` / `ACTIVE` / `REVISION` |
| independent-code-reviewer | `IDLE` / `REVIEWING` / `COMPLETE` |
| architecture-reviewer | `IDLE` / `REVIEWING` / `COMPLETE` |
| research agent | `IDLE` / `RESEARCHING` / `COMPLETE` |
| specialist reviewer(s) | `IDLE` / `REVIEWING` / `COMPLETE` |
| Founder | `WAITING` / `DECISION` |

Each row also carries **Current assignment** and **Next condition**.

**Recorded contradiction:** `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` §A.8 uses a different,
informal set — `ACTIVE` / `IDLE` / `PENDING` — with `PENDING` absent from Appendix F.
Register item **X-18**. `CURRENT_PROGRESS_UPDATE.md` §6 uses the Appendix F vocabulary and
marks the choice as provisional.

---

## R13 — Handoff and prompt requirements

**Status: CONTROLLING** for handoffs. **PROPOSED** for prompt and session coordination.

### R13a — Handoff content (CONTROLLING)

Every major handoff includes: identification (task, role, status, next owner); objective;
scope, including what was intentionally excluded; work completed and important decisions;
validation — commands performed, results, and **anything not tested or verified**; risks and
limitations; and the required next action and reviewer.

> *"The next department should not need to guess what happened, what was validated, or what
> remains unresolved."* — AGENT-001 §Handoff Standards

**Sources:** AGENT-001 §Handoff Standards and §Validation Standards (`AGENTS.md`) ·
CONST-001 Art. VI steps 10–12 · GOV-001 §Operations Review (:438-454).

### R13b — Prompt and session coordination (PROPOSED)

> *"When coordinating agents, provide exact agent, exact place to paste, complete prompt,
> expected return, and commit authority."* — Master Roadmap v8.0 §23, Expected Assistant Behavior

> *"Prefer one exact next action over multiple competing options unless a genuine Founder
> decision is required."* — Master Roadmap v8.0 §23

Roadmap-tier (**X-8**), and no approved standard carries it. The related requirement that
reviews run from a **separate clean session** rests on `WORKFLOW_DIAGNOSIS.md` — where seven
consecutive in-session spawns produced zero deliverables and **the root cause is recorded as
UNKNOWN**. A mitigation that works for unknown reasons is not yet a rule; see R4.

---

## R14 — Repository and tag protection

**Status: MIXED — see each clause.**

### R14a — Branch and history protection (CONTROLLING)

Protected branches are `main` and `develop`. Force-pushing protected branches is to be
avoided. Feature work occurs on dedicated branches.
**Source:** `standards/GIT_STANDARD.md:44-47`, `:49`, `:253`.

### R14b — Repository conduct (CONTROLLING)

Preserve unrelated working behaviour; avoid destructive changes without authorization; keep
changes scoped and reviewable; never commit secrets; review version-control status before
handoff; report unrelated pre-existing changes rather than silently modifying them; never
claim a commit, push, deployment, or merge occurred unless verified.
**Source:** AGENT-001 §Repository Conduct (`AGENTS.md`).

### R14c — Protected Sprint 1E baselines (CONTROLLING — by recorded decision, not by standard)

The following are immutable and must not be moved, deleted, or rewritten:

| Tag | **Tag object** | Commit | Meaning |
|---|---|---|---|
| `sprint-1e-baseline` | `cda7aa1b15e0009e17dfd7f194570b2f013f6bf7` | `62f629128e5092f593ff494cd729fe516694bbde` | Pre-remediation baseline |
| `sprint-1e-remediated` | `690e22685cfb092f1e1e281a64b02059336c13ac` | `d922f3794a6c57f02039ab969e0b98477f4c4c29` | Ratified Sprint 1E baseline, 0 unresolved blockers |

**Both tags are annotated. Verify by peeling, never by bare `rev-parse`:**

```
git rev-parse sprint-1e-baseline^{commit}     # → 62f629128e…   ✅ correct check
git rev-parse sprint-1e-baseline              # → cda7aa1b…     ⚠️ the TAG OBJECT, not the commit
```

**A bare `git rev-parse <annotated-tag>` returns the tag object and does not verify tag
identity.** On 2026-07-26 a Sprint 1F Track A report used the unpeeled form and concluded that
`sprint-1e-baseline` had been moved to `690e2268…` — which is in fact the tag object of
`sprint-1e-remediated`. **The tag had not moved.** Both identities above were re-verified
against the local repository *and* `git ls-remote --tags origin`. Register item **X-24**; the
tag-object column exists to stop this recurring.

**Source:** Founder ratification recorded in the **committed**
`docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md:4-6, 98-99`
and `RATIFICATION_1E_D922F379.md` §6. This binds as a tier-2 recorded decision.

**Standard gap, recorded not filled:** `standards/GIT_STANDARD.md` §Tags (`:202-214`)
addresses only *"annotated tags for production releases"* and contains **no rule on sprint
baseline immutability or candidate freeze tags.** The decision binds; the standard does not
yet reflect it. Register item **X-19**.

### R14d — ADR immutability (CONTROLLING)

> *"Architecture Decision Records are immutable historical documents. Do not modify the
> original decision after approval. Instead: Create a new ADR, Reference the previous ADR,
> Explain why the decision changed."* — `VERSIONING_POLICY.md:222-233`

---

## R15 — Roadmap change control

**Status: CONTROLLING** (roadmap-sourced; tier subject to **X-8**).

**Source — Master Roadmap v8.0, Appendix G, quoted:**

> *"This roadmap is a permanent governance artifact and must not be silently changed by
> ordinary implementation work.*
>
> *A proposed change identifies the exact section, rationale, benefits, risks, dependencies,
> migration impact, and Founder decision.*
>
> *Version the roadmap when capability structure, dependency order, phase promises, autonomy
> levels, or milestone definitions materially change.*
>
> *Keep roadmap, handbook, ADRs, Current Progress Update, and knowledge records distinct:
> direction, operating rules, architecture decisions, live state, and institutional guidance
> serve different purposes.*
>
> *Preserve superseded decisions and rejected approaches when they remain important to
> preventing regression.*
>
> *After an approved change, update startup instructions, gates, capability matrix, work
> packets, policies, and ADR references."*

**Corroborating:** *"Roadmap changes that alter phase promises, dependency order, or milestone
definitions"* are Reserved Founder Authority — Master Roadmap v8.0 §2.

### R15a — The roadmap does not prove implementation status (CONTROLLING)

> *"A capability appearing here is planned or approved direction; it is not proof that the
> capability has been implemented, reviewed, committed, deployed, or made operational."*
> — Master Roadmap v8.0, §Document Authority and Canonical Use

> *"New sessions must distinguish permanent direction from live state and must not infer
> implementation status from roadmap text."* — Master Roadmap v8.0 §23

Consequently: a sprint appearing in roadmap §5 is **not** evidence that the sprint ran; a
view listed in §7 is **not** evidence that the view exists; a gate in §9 is **not** evidence
that the gate passed. Implementation status comes only from the repository, verified command
output, and CPU-001.

---

# 3. Rules deliberately excluded from this handbook

Each was considered and left out, with the reason. Exclusion is not rejection — it means the
rule is not yet consolidatable.

| Candidate rule | Why excluded |
|---|---|
| **Reviewer verdict vocabulary** | **Five incompatible vocabularies are in force at once.** Choosing one would be authorship, not consolidation. Register item **X-7**, expanded in ACR-001 §3. |
| **Severity ladder** | A Founder decision fixes `BLOCKER · MAJOR · MINOR · OBSERVATION` (`PHASE_2_PROGRAM_PLAN.md:151-163`), but two approved documents still carry different ladders (EMP-QA-001, `handbooks/ARCHITECTURE_REVIEWER.md:129`). The decision binds; the retirement of the others has not been recorded. Register item **X-7b**. |
| **Negative-outcome policy** (throw/absorb) | Governs four services and two reviewers' verdicts but *"lives only in a review artifact"* — 1E-F1, open. Not yet a governed rule. |
| **ADR numbering ownership** | Recorded as resolved by Founder decision in `PHASE_2_PROGRAM_PLAN.md` §0.6 context, but the assignment authority itself is unwritten. Register item **X-5**. |
| **Delegated acceptance / machine-executed Founder authority** | No governance construct exists. Register item **X-13**. |
| **Bounded repair attempts** | Recommended in GOV-PLAN-001 §2.3 L-8; never approved. |
| **Missing standards** (`NAMING`, `LOGGING`, `ERROR_HANDLING`) and `handbooks/INDEPENDENT_CODE_REVIEWER.md` | Absent from the repository. *"A review gate whose own standard is missing cannot certify against it."* Register item **X-12**. |

---

# 4. Compliance and amendment

- This handbook is amended by the same route as the rules it consolidates: a rule changes
  when **its cited source changes**, not when this file is edited.
- A rule may move from **PROPOSED** to **CONTROLLING** only by a recorded Founder decision or
  an approved amendment to an Axis A document. Editing this file does not promote it.
- If this handbook and a cited source ever disagree, **the cited source governs** and the
  disagreement is a defect in this handbook.
- Version this document under `VERSIONING_POLICY.md` §Documentation Versioning and
  §Handbook Versioning.

---

# 5. Record

- **Consolidated by:** governance documentation coordination pass, acting within Operations
  proposal authority only. No decision authority was exercised.
- **Verified against:** branch `validation/sprint-1e-overnight-2026-07-26`, HEAD `9069c12`,
  working tree clean for tracked files.
- **Rules imported:** 15 (10 CONTROLLING or CONTROLLING-PARTIAL, 3 PROPOSED, 2 MIXED).
- **Rules invented:** 0.
- **Contradictions resolved:** 0 — all carried to ACR-001.
- **No ADR, standard, handbook, agent definition, workflow, test, or source file was
  modified by the creation of this document. No commit was made.**
