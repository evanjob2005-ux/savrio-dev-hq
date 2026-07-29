<!--
  REPOSITORY REGISTRATION RECORD — NOT PART OF THE ROADMAP.
  Everything from the "Registration record" heading down to the horizontal rule marked
  "END REGISTRATION RECORD" was added by the repository registration of this document.
  It is provenance metadata. It is not roadmap content and carries no roadmap authority.
  The roadmap text itself begins after that rule and is a verbatim conversion of the
  Founder-supplied source. See Appendix G — Roadmap Change Control.
-->

# Registration record — Master Roadmap v10.4

**This section is provenance metadata added by repository registration. It is not part of the roadmap and has no roadmap authority.**

| Field | Value |
|---|---|
| **Document title** | Viybd HQ Master Roadmap v10.4 — Canonical Engineering Organization Blueprint |
| **Version** | **10.4** |
| **Status** | Founder-supplied canonical source, registered into the repository |
| **Canonical repository path** | `docs/roadmap/MASTER_ROADMAP.md` |
| **Registered** | 2026-07-28 |
| **Registered by** | Founder-directed replacement of the registered v8.0 roadmap |
| **Founder-supplied source** | `C:\Users\evanj\Downloads\Viybd_HQ_Master_Roadmap_v10.4_Binding_Operating_Kernel.docx` |
| **Source SHA-256** | `e2623d63d93ee9b618339d4d9f969636f2c4a67247a42214c23ed2c6773e8f98` |
| **Source size** | 101,227 bytes · file mtime 2026-07-28 14:17 |
| **DOCX `dc:title`** | *Viybd HQ Master Roadmap v10.3 - Canonical Engineering Organization Blueprint* — **stale, see below** |
| **DOCX `dc:description`** | *v10.3 integrates the binding Viybd HQ Chat Operating Instructions into Sections 23 and 24.* — **stale, see below** |
| **Supersedes** | Master Roadmap v8.0 (registered at this path 2026-07-26; v8.1–v10.3 never present in this repository) |

## Conversion disclosure

This file is a **format conversion** of the source `.docx`, plus **one Founder-supplied
insertion recorded below**. The conversion was mechanical: Word paragraphs became
paragraphs, Word `Heading N` and `Title` styles became Markdown headings, Word tables became
Markdown tables, and bold/italic runs became `**`/`_`.

- **No sentence was rewritten, reordered, summarised, or removed.** One block was added; see
  *Founder-supplied insertion* below.
- Word's rendering of typographic quotes and dashes is preserved as authored.
- Current SHA-256 (roadmap body only, excluding this registration record), including the
  kernel preamble insertion and amendments A-1 through A-7:
  `1a9ae310590eda46cae3a9c9280304e53939f835acdfaa628f0d589b151b63dc`
- SHA-256 after the kernel preamble insertion, before the amendments:
  `d7893199946724d07c58d3b66343d37808890cc595093afde0143bfd32b0bf41`
- SHA-256 of the body **as mechanically converted**, before any change:
  `1720060d1d8534ce874cf89ce12bcd0634b6cf3762c873353fbb0c0186892b46`

### Founder-supplied insertion — Section 23 kernel preamble

On 2026-07-28 the Founder supplied the authoritative text of the VIYBD HQ — BINDING
OPERATING KERNEL directly and directed that Section 23 match it. Comparison found the
section identical **except** for a missing seven-line preamble between the kernel heading
and the `READ THIS ENTIRE BLOCK…` mandate:

> Best correct path, executed as fast as safely possible. / One exact next action. /
> Smallest safe number of agents. / Parallel work when independence allows it. / No
> redundant verification, reconstruction, prompts, or handoffs. / No extra steps unless they
> materially reduce risk or prevent rework. / I make routine coordination decisions instead
> of making you sort them out.

Those 54 words were verified absent from the source `.docx` itself — in the document body
and in all headers and footers — so this was a gap in the source, **not** a conversion loss.
They were inserted verbatim. After insertion, Section 23 matches the Founder-supplied kernel
**word-for-word, 1,486 words on both sides**, with no other difference of any kind.

### Founder-directed amendments — 2026-07-28

The Founder directed that the roadmap be edited to flow more cleanly toward the intended end
state, on the explicit basis that **the roadmap's timing was a guess** and that **models will
converge in capability, so roles must go to whichever performs best.** Seven amendments were
made. Each is an edit to Founder-supplied text and is listed here in full so the delta from the
`.docx` is never in doubt.

| # | Location | Change |
|---|---|---|
| A-1 | §Document Authority and Canonical Use | Added a paragraph stating the roadmap sequences by dependency, not date; carries no schedule commitment; and that where a schedule and a gate conflict, the gate governs. |
| A-2 | §23 kernel, rule 4 | Replaced the vendor-named reviewer roles — *"Codex independent code review, Claude architecture review"* — with *"independent code review, architecture review"*, plus a sentence establishing that these are roles rather than tools and that occupants are recorded under Section 19. |
| A-3 | §9 Phase 1 Exit Gates | Added a lead-in defining how a gate is passed, and a **Proof** line to each of the six gates naming an executable check. A document asserting a gate was met is explicitly not a proof. |
| A-4 | §19 Agent Organization | Added *Role Assignment and Model Promotion*: roles are capability contracts, any model may hold any role it can pass, promotion is by measured evidence on a versioned evaluation set, and independence is a property of instance and context rather than vendor. |
| A-5 | §19 role table, §Agent status template | Renamed the `claude-design` role to `design-engineer`. A role named after a vendor is a role assigned to that vendor by default, which is exactly the binding A-4 exists to remove. Renamed repository-wide alongside `v0-engineer` → `ui-prototyping-engineer`. Historical evidence records still carry the former names and were deliberately left unedited. |
| A-6 | §9 Phase 1 Exit Gates | Added three requirements to *How a gate is passed*: a proof must be demonstrated capable of failing; a proof asserting that something causes failure requires a null arm; and controls are tested from the baseline they will run against, not the builder's working state. |
| A-7 | §8 Review, Verification, and Autonomous Revision Loops | Added *Reviewing Work That Enforces*: review of a control requires re-derivation rather than re-reading, the author does not write its only negative controls, acceptance evidence is the failing transcript, and a green result is more suspect when the thing under test is itself a check. |

A-6 and A-7 were added after three separate controls built in a single day were each found
hollow by independent review: an audit exception list keyed on package rather than advisory,
a workflow verifier that reported success when it had compared nothing, and the mutation
harness written to prevent exactly that, whose cases passed for free because they ran against
an already-modified tree. Each was caught by a reviewer re-deriving and missed by every check
the author ran. The amendments record the mechanism rather than the incidents.

A-2 edits text the Founder supplied verbatim earlier the same day. It was made deliberately:
the kernel is read before every response, so a vendor name inside it would harden into a fixed
assignment and defeat the stated goal. **The rule's meaning is unchanged** — the separation of
implementation from independent review is preserved exactly; only the binding of those roles to
named products is removed.

**Consequence for provenance:** the repository file and the source `.docx` now differ by the
kernel preamble insertion and amendments A-1 through A-7, and by nothing else. Until the
Founder re-saves the `.docx`, the general rule below — that the `.docx` governs — is suspended
for those eight deltas, where this file governs. Everything else in this document remains a
verbatim conversion of the source.

### Conversion verification — performed for this registration

Unlike the v8.0 registration, this conversion **was** mechanically verified. Every text run
in `word/document.xml` was extracted and compared token-by-token against the converted
Markdown — as converted, before the insertion recorded above — with Markdown scaffolding
removed:

- **18,953 source words vs 18,953 converted words — exact word-for-word match.**
- The only text the converter *adds* is the 29 ordered-list numbers that Word renders from
  `numbering.xml` rather than storing as text; these were excluded from the comparison and
  are the sole non-source-text tokens in the file.
- 36 tables and 504 bulleted items were carried across.

This verifies **text fidelity**, not editorial or governance correctness. If any discrepancy
is still found between this file and the `.docx` — **other than** the Founder-supplied
insertion recorded above — the `.docx` governs and this file must be re-registered.

### Heading-level mapping — changed from the v8.0 registration

The source uses `Title` for numbered top-level sections (`1.`, `2.`, `4A.`, `13B.` …) and
`Heading 1` for subsections beneath them. The v8.0 conversion rendered **both** as `#`,
flattening that distinction. This conversion preserves it:

| Source style | Markdown |
|---|---|
| `Title` | `#` |
| `Heading 1` | `##` |
| `Heading 2` | `###` |

Where the source itself skips a level — Sections 6 and 9 style their subsections `Heading 2`
with no intervening `Heading 1` — that skip is reproduced faithfully rather than corrected,
so the roadmap's own section numbering remains the reliable index.

### Stale DOCX metadata

The source file's `dc:title` and `dc:description` still read **v10.3**. The document body
declares **v10.4** consistently — in its title block, its `v10.4 Change Summary` section, its
authority table, and its Section 24 startup instruction — and the filename agrees. The
metadata was not refreshed when the file was last saved (by LibreOffice 25.2.3.2, per
`docProps/app.xml`). **The body governs; the metadata is a known defect in the source.**
Worth correcting at the next Founder save so provenance checks do not flag it again.

## Version naming

The file is named `MASTER_ROADMAP.md` without a version suffix, and carries `Version: 10.4`
in this record and in the document's own text. This follows the convention every other
governed document in this repository uses (`CONST-001 v1.0.0`, `GOV-001 v1.0.0`,
`ADR-0001`), and it means an approved v10.5 updates this path rather than creating a second
roadmap file that a reader could mistake for a competing authority. Appendix G's versioning
requirement is satisfied by the version field, not by the filename.

## What this document proves, and what it does not

Recorded here because it is the roadmap's own rule, and because it is the most likely way
this file will be misread:

> *"A capability appearing here is planned or approved direction; it is not proof that the
> capability has been implemented, reviewed, committed, deployed, or made operational."*
> — Master Roadmap v10.4, §Document Authority and Canonical Use

Live implementation state is carried by `docs/governance/CURRENT_PROGRESS_UPDATE.md` and,
above that, by the repository and verified command output. **Nothing in the roadmap may be
cited as evidence that any sprint, gate, view, or capability exists in code.**

## Open governance questions attached to this registration

None is answered here. All should be recorded in
`docs/governance/AUTHORITY_AND_CONTRADICTION_REGISTER.md`.

1. **Organization rename — Savrio → Viybd.** v10.4 contains **zero** occurrences of "Savrio"
   and 15 of "Viybd". `AGENTS.md`, the repository name `savrio-dev-hq`, and every registered
   governance document still say "Savrio Dev HQ". Whether this is a company rename requiring
   a coordinated documentation pass, or a roadmap-only naming change, is a Founder decision.
   **This registration changed no other document.**
2. **Authority tier.** `AGENTS.md` §Governing Authority enumerates eight authority tiers and
   **contains no roadmap tier**. This roadmap's §Authority Rule asserts one. Which
   `AGENTS.md` tier the roadmap occupies is a Founder decision (register item **X-8**,
   carried forward unresolved from the v8.0 registration).
3. **New in v10.4 — the Binding Operating Kernel.** §Authority Rule now asserts that the
   *"VIYBD HQ — BINDING OPERATING KERNEL in Section 23 controls mandatory coordination,
   prompting, review, remediation, evidence, authority, handoff, and Founder-facing output
   behavior"* for **every** Viybd HQ response. This is a behavioural mandate on agent conduct,
   a domain `AGENTS.md` also governs. Whether the kernel supplements or overrides `AGENTS.md`
   where the two differ is a Founder decision and is **not** resolved by this registration.
4. **v8.0 → v10.4 supersession.** Versions v8.1 through v10.3 were never present in this
   repository. v10.4 states it "preserves the long-term capability roadmap" and removes or
   weakens no capability. Whether prior v8.0-derived planning claims may be treated as
   carried forward without re-derivation is a Founder decision (extends register item
   **X-17**).

---

<!-- END REGISTRATION RECORD — the Founder-supplied roadmap text begins below, verbatim. -->

---
**VIYBD HQ**

MASTER ROADMAP v10.4

_Canonical Engineering Organization Blueprint_

| **MISSION** <br> Build the first founder-supervised autonomous engineering organization. Use it to improve itself. Use Viybd as a polished reference implementation and portfolio showcase. Then use the proven system to discover, build, launch, and operate validated ventures before evolving into an enterprise AI engineering platform. |
|---|

**Founder-supervised • Verification-first • Context-resilient • Knowledge-compounding • Governed • Measurable • Durable by design**

Production quality before short-term speed. The lightest safe workflow for every task.

## Document Authority and Canonical Use

This document is the authoritative long-term capability roadmap for Viybd HQ. It defines the target organization, dependency order, phase promises, system boundaries, acceptance gates, autonomy model, institutional knowledge strategy, and end-state. A capability appearing here is planned or approved direction; it is not proof that the capability has been implemented, reviewed, committed, deployed, or made operational.

**This roadmap sequences work by dependency, not by date.** It contains no schedule commitment and no duration estimate. Any date, duration, or velocity figure associated with this roadmap in a planning document, status report, or conversation is an estimate for coordination only — never an approved deadline, never an acceptance criterion, and never grounds for reducing verification. Sprints complete when their gates pass. If a schedule and a gate ever conflict, the gate governs.

## Authority Rule

Repository and verified tool output control implementation truth. Approved ADRs and recorded decisions control architecture and policy. The VIYBD HQ — BINDING OPERATING KERNEL in Section 23 controls mandatory coordination, prompting, review, remediation, evidence, authority, handoff, and Founder-facing output behavior. The latest verified Current Progress Update controls live execution state. This roadmap controls long-term capability direction.

## v10.4 Change Summary

This edition preserves the long-term capability roadmap and replaces the prior Section 23 operating-rule text with the Founder-supplied VIYBD HQ — BINDING OPERATING KERNEL verbatim. The kernel is the mandatory coordination, prompting, review, remediation, evidence, authority, handoff, and Founder-facing output standard for every Viybd HQ response. Section 24 and the reusable startup instruction are updated only to point new sessions to that exact kernel. No Phase 1, Phase 2, Phase 2.5, Phase 2.6, governance, reliability, compliance, commercial-control, or enterprise-platform capability is removed or weakened.

| **Source** | **Authority** |
|---|---|
| Repository + verified output | What exists and passes now. |
| Current Progress Update | Current sprint, candidate, owners, reviews, blockers, next gate. |
| Approved ADRs / decisions | Architecture, security, policy, and governance constraints. |
| Section 23 Binding Operating Kernel | Mandatory coordination, prompt, review, remediation, evidence, authority, handoff, and Founder-facing output rules. |
| Master Roadmap v10.4 | Long-term capability direction, dependencies, phase promises, and completion gates. |

## Document Map

- 1. Vision, mission, principles, and end-state
- 2. Founder operating model and delegated authority
- 3. Canonical architecture and sources of truth
- 4. Adaptive orchestration and autonomy maturity
- 4A. Adaptive organization formation and parallel execution
- 5. Phase 1 — Build the First Autonomous Dev HQ
- 6. Phase 1 Context Lifecycle Manager
- 7. Mission Control Lite and mobile Founder experience
- 8. Review, verification, and autonomous revision loops
- 9. Phase 1 exit gates
- 10. Phase 2 — Use Dev HQ to Build Dev HQ
- Phase 2 uses the completed Phase 1 organization to perform the majority of engineering work required to improve, scale, govern, measure, and optimize Dev HQ itself. The sequence first creates an Adaptive Organization Engine so later multi-project, knowledge, intelligence, collaboration, model, research, and production systems can scale through deliberate temporary teams rather than ad-hoc swarms.
- 12. Engineering Intelligence, review learning, and architecture management
- 12A. Agent memory and organizational learning
- 13. Model management, research, and collaboration
- 13A. Adaptive Organization Engine, review teams, and reconciliation
- 13B. Commercial Legal and Compliance Platform
- 13C. Venture Discovery and Validation
- 13D. Customer Reality System
- 13E. Growth and Distribution Operating System
- 13F. Financial and Treasury Control System
- 13G. Trust, Reputation, and Brand Safety System
- 13H. Business Continuity and Platform-Risk System
- 13I. External Expert Escalation Network
- 13J. Business Simulation and Safe-Action Sandbox
- 14. Phase 3 — Reference Product Demonstration and Venture Launch
- 14A. Autonomous Business Operations
- 14B. Venture Portfolio Manager and Capital Allocation
- 15. Phase 4 — Enterprise AI Engineering Platform
- 16. Cross-cutting capabilities
- 17. Governance, security, secrets, trust, and provenance
- 18. Environment, deployment, infrastructure, and operations
- 19. Agent organization and routing
- 20. Autonomous operating lifecycle
- 21. Metrics, health scores, and progressive Founder experience
- 22. Acceleration strategy and prohibited shortcuts
- 23. Prompt generation and agent instruction standard
- 24. New-chat startup context
- Appendices — capability matrix, gates, schemas, templates, glossary, change control

# 1. Vision, Mission, Principles, and End-State

Viybd HQ is an AI-first software engineering organization, not a collection of disconnected coding chats. It converts Founder direction into durable plans, scoped work, implementation, independent review, evidence, releases, operations, learning, and measurable outcomes without requiring the Founder to manually coordinate every agent interaction.

| **Phase** | **Primary outcome** | **Founder relationship** |
|---|---|---|
| Phase 1 — First Autonomous Dev HQ | Reliable, context-resilient, verification-first organization capable of end-to-end software work under supervision. | Founder sets goals and reserved decisions; HQ performs most routine engineering. |
| Phase 2 — Dev HQ Builds Dev HQ | Self-improving, knowledge-compounding, multi-project organization with deeper intelligence, model management, research, and collaboration. | Founder directs organizational priorities; HQ performs most engineering required to improve itself. |
| Phase 2.6 — Commercial Intelligence and Operational Resilience | A customer-grounded, distribution-capable, financially controlled, trust-preserving, resilient commercial organization prepared for supervised business operation. | Founder sets growth, cash, risk, brand, platform-dependence, expert-escalation, and simulation authority; HQ manages bounded evidence-driven preparation and recommendations. |
| Phase 3 — Reference Product Demonstration and Venture Launch | Dev HQ proves its complete product-delivery capability through Viybd as a polished reference implementation, then applies the same system to validated commercial ventures. | Founder leads product and business strategy; HQ runs engineering delivery and product learning. |
| Phase 4 — Enterprise Platform | Multi-organization, extensible, policy-driven platform for human and AI engineering teams. | Leaders govern organizations; platform delivers enterprise-scale engineering operations. |
| Phase 2.5 — Commercial Readiness and Venture Validation | Jurisdiction-aware compliance controls and a governed system for discovering and validating commercially promising opportunities before major build commitments. | Founder sets permitted markets, risk limits, experiment budgets, public-contact authority, and commercialization gates. |
| Phase 3A — Autonomous Business Operations | Founder-supervised operation of validated software ventures across product, growth, sales, support, finance operations, compliance, and customer outcomes. | Founder retains strategy, capital allocation, legal risk, brand, pricing, and material commercial authority while HQ manages bounded operations. |
| Phase 3B — Venture Portfolio Management | Evidence-based allocation of capital, compute, talent, and attention across multiple governed ventures. | Founder approves portfolio strategy and material capital decisions; HQ recommends, monitors, pauses, expands, or retires ventures within policy. |

## Non-Negotiable Principles

| **Principle** | **Operational meaning** |
|---|---|
| Founder-supervised autonomy | Routine work is delegated; strategy, material risk, budgets, authority expansion, irreversible actions, and major architecture remain governed. |
| Durable work over chat state | Tasks, decisions, reviews, artifacts, checkpoints, model identities, context packages, and outcomes survive session boundaries. |
| Verification before completion | No work is complete because an agent says so. Tests, reviews, evidence, approvals, and candidate identity must prove it. |
| Reliability before authority | Greater autonomy follows deterministic execution, idempotency, replay convergence, crash recovery, restoration verification, and auditability. |
| Adaptive orchestration | Use the lightest workflow that completely manages the task’s risk, complexity, dependencies, and authority. Small work must not trigger unnecessary ceremony. |
| Independent review | Implementation and approval remain separate wherever policy requires independence. |
| Minimum complete context | Each actor receives only the context required for correctness, security, scope, and authority. |
| Knowledge compounds | Validated institutional knowledge is captured, curated, retrieved, challenged, and superseded rather than lost in chat history. |
| Provider portability | Roles are not permanently bound to providers. Routing uses measured capability, context, cost, latency, reliability, policy, and independence. |
| Production quality first | Maintainability, extensibility, accessibility, security, privacy, reliability, operability, and polish outrank fragile speed. |
| Governed self-improvement | Dev HQ improves itself through the same durable, reviewed, approved, and measurable process it applies to other software. |
| Business outcome awareness | Engineering output is ultimately evaluated against user value, product outcomes, operational health, strategic goals, and sustainable economics. |
| Adaptive organization formation | Form the smallest temporary organization that can safely complete the work. Parallelize only independent or interface-bounded work; preserve integration ownership, review independence, budget control, and one authoritative final decision. |
| Validate demand before scale | Research and forecasts create hypotheses, not market truth. HQ commits major build or operating resources only after proportionate evidence such as qualified interviews, pre-sales, paid pilots, usage, retention, or other approved demand signals. |
| Compliance by design, not disclaimer | Applicable legal, privacy, accessibility, cookie/tracking, marketing, payment, consumer-protection, data, and contractual obligations become versioned controls, tests, evidence, and approval gates. Automation assists compliance but does not claim universal legal certainty. |
| Profit is measured, never promised | HQ optimizes expected risk-adjusted value and sustainable economics, but may not represent forecasts as guaranteed revenue or claim that any venture is the highest-profit opportunity without real comparative evidence. |
| Customer reality over internal confidence | Support, interviews, sales objections, usage, retention, refunds, complaints, and churn evidence continuously challenge product and market assumptions. |
| Distribution is a first-class system | HQ treats customer acquisition, channel economics, positioning, partnerships, content, and conversion as governed operating capabilities rather than post-build promotion. |
| Cash control before autonomous scale | Verified cash availability, reserves, reconciliation, liabilities, taxes, and spend authority constrain growth. Forecast revenue never substitutes for available funds. |
| Trust and continuity before concentration | Short-term profit may not override brand safety, customer welfare, platform resilience, supplier redundancy, recoverability, or long-term reputation. |
| Expert judgment and safe rehearsal | HQ escalates questions requiring qualified human judgment and simulates high-impact actions when simulation can reveal material failure modes without replacing real-world proof. |

# 2. Founder Operating Model and Delegated Authority

The roadmap moves the Founder from manual agent coordinator to strategic leader. Dev HQ receives authority in bounded layers and must escalate only decisions outside its grant.

| **Maturity** | **Founder role** | **Dev HQ role** |
|---|---|---|
| Current build stage | Set roadmap, coordinate current agents, approve architecture, inspect evidence, close milestones. | Execute scoped work while progressively automating coordination. |
| End of Phase 1 | Set goals, priorities, budgets, risk appetite, and reserved approvals. | Plan, assign, implement, review, revise, test, recover, verify, continue across sessions, and report. |
| Phase 2 | Direct organizational improvement priorities. | Build, govern, measure, and improve Dev HQ itself. |
| Phase 2.6 | Set customer-research boundaries, growth channels, cash reserves, brand policy, platform-risk tolerance, expert budgets, and simulation/approval thresholds. | Continuously ingest customer evidence, operate bounded growth tests, reconcile finances, monitor trust and dependencies, prepare expert escalations, and rehearse high-impact actions. |
| Phase 3 | Set the reference-product scope, portfolio priorities, venture strategy, and material risk. | Build Viybd as a portfolio-quality reference product, prove the end-to-end operating system, and launch validated ventures. |
| Phase 4 | Govern organization strategy, policy, and economics. | Operate multi-organization engineering workflows and platform services. |
| Phase 2.5 | Set market boundaries, experiment budgets, prohibited sectors, brand/contact permissions, compliance posture, and commercialization gates. | Research opportunities, maintain compliance obligations, design validation experiments, and present evidence-backed build/kill/pivot recommendations. |
| Phase 3A | Set venture strategy, capital limits, customer commitments, pricing authority, and material legal/financial risk. | Operate validated ventures through bounded product, growth, sales, support, billing, reporting, compliance, and continuous-improvement workflows. |
| Phase 3B | Approve portfolio strategy and material capital allocation. | Compare ventures, allocate constrained resources, stop weak initiatives, scale proven ones, and report portfolio risk and economics. |

## Delegated Authority Levels

| **Level** | **Typical authority** | **Examples** |
|---|---|---|
| L0 — Observe | Read-only visibility and analysis. | Inspect repository, logs, evidence, roadmap, and dashboards. |
| L1 — Routine engineering | Create branches, edit scoped files, run tests, update local docs, request review. | Small bug fixes, tests, documentation, safe refactors within approved design. |
| L2 — Workflow completion | Accept reviewer-approved routine work and advance ordinary gates. | Close low-risk work items, merge when policy and evidence allow, schedule next dependency. |
| L3 — Material engineering | Changes with architecture, data, security, or cross-service impact. | Requires architecture or specialist review and may require Founder approval. |
| L4 — Production / irreversible | Deployments, migrations, credentials, material spend, irreversible actions. | Explicit policy gates, rollback proof, and designated approval. |
| L5 — Founder reserved | Strategy, authority expansion, major architecture, policy, budget, legal, brand, or product direction. | Founder decision required. |

| **AUTOMATIC ACCEPTANCE RULE** <br> The Executive Orchestrator may accept and advance work only when the action is within delegated authority, every required reviewer has approved the exact candidate, evidence is current, policy permits the transition, and no reserved decision remains. Confidence scores may inform the decision but may never replace evidence or policy. |
|---|

## Reserved Founder Authority

- Material deviation from approved ADRs or architecture baselines.
- Roadmap changes that alter phase promises, dependency order, or milestone definitions.
- New or expanded agent, model, credential, production, marketplace, policy, or irreversible authority.
- Material security, privacy, compliance, legal, budget, or migration decisions.
- Production release or phase approval where policy requires Founder acceptance.
- Material business, pricing, customer, brand, or product-strategy decisions.
- Entering a new jurisdiction, regulated industry, prohibited or high-risk market, or materially changing the organization’s legal or compliance posture.
- Public launch, customer commitments, contract acceptance, material advertising spend, pricing changes, refunds outside policy, debt, equity, acquisition, or external capital decisions.
- Authorization to use the Founder’s identity, voice, likeness, brand, accounts, payment instruments, or external communication channels.
- Material changes to cash reserves, treasury policy, tax posture, payment destinations, borrowing, investment, or automatic reinvestment authority.
- Use of a new acquisition channel, mass communication strategy, public claim category, creator/affiliate program, or brand positioning with material reputation risk.
- Acceptance of concentrated dependence on a platform, supplier, payment processor, model provider, logistics provider, or other single point of commercial failure.
- Engagement of external legal, accounting, tax, security, medical, regulated-domain, or other qualified experts beyond approved scope or budget.
- Execution of a simulated recommendation when the real action is material, irreversible, public, contractual, financial, or safety-sensitive.
- Reviewer conflicts that cannot be resolved through evidence and existing authority.

| **PHASE 1 COMPLETION PROMISE** <br> When Phase 1 is complete, Dev HQ performs the majority of engineering work required to build Phase 2. The Founder primarily sets goals, approves major decisions, and reviews milestones while HQ handles routine planning, routing, implementation, review, revision, testing, recovery, context continuity, verification, and iteration. |
|---|

# 3. Canonical Architecture and Sources of Truth

The Founder Interface is the official command and interpretation layer. The Work Management Layer is the durable execution authority. Repository evidence controls implementation truth. Institutional knowledge informs work but cannot override code, tests, ADRs, policy, or current authorized decisions.

| **Layer** | **Primary responsibilities** | **Critical boundary** |
|---|---|---|
| Founder | Vision, priorities, risk appetite, budgets, reserved approvals. | Does not manually orchestrate routine work once policy supports delegation. |
| Founder Interface / Executive Orchestrator | Interpret goals, classify complexity, choose workflow, plan, route, monitor, forecast, accept within authority, escalate. | Must not become a competing source of durable truth or approve its own implementation. |
| Mission Control | Operational command center for work, agents, reviews, evidence, approvals, context, budgets, releases. | Displays authoritative state and labels predictions clearly. |
| Intelligence and Planning | Roadmap state, Repository Intelligence, Context Router, Smart Work Packets, research, registries, knowledge retrieval. | Produces plans and recommendations, not unauthorized state transitions. |
| Context Lifecycle Manager | Health scoring, checkpoints, compaction, continuation, rollover, restoration verification. | Durability belongs to verified work state, not one conversation. |
| Governance / Work Management | Tasks, executions, assignments, reviews, evidence, decisions, policy, permissions, budgets, approvals. | Only owner of durable workflow state and valid transitions. |
| Agents and humans | Research, design, architecture, implementation, QA, security, documentation, DevOps, product. | Act only within explicit scope, identity, and authority. |
| Delivery systems | Repository changes, CI, tests, environments, deployment, observability, incidents. | Write results and evidence back to durable records. |
| Company Knowledge Platform | Human-readable institutional and project knowledge, ADRs, standards, playbooks, lessons. | Obsidian is an interface and synchronized knowledge surface, not the sole authoritative database. |
| Commercial Compliance and Venture Operations | Jurisdiction profiles, obligation registry, compliance packs, market opportunities, experiments, customer evidence, commercial workflows, financial operations, and portfolio recommendations. | Cannot override law, contracts, qualified professional advice, policy, repository truth, customer consent, or Founder-reserved commercial authority. |
| Commercial Intelligence and Operational Resilience | Customer evidence, growth channels, financial/treasury records, brand and trust controls, platform dependencies, expert escalations, simulations, and continuity plans. | Produces governed recommendations and bounded operations; cannot create cash, customer demand, professional judgment, or authority by assertion. |

## Three Knowledge Classes

| **Knowledge class** | **Examples** | **Primary home** | **Rule** |
|---|---|---|---|
| Operational memory | Current tasks, executions, reviews, active context, retries, queues. | Work Management + Context Lifecycle Manager | Fast-changing and authoritative for current operations; not stored as permanent notes by default. |
| Institutional knowledge | Standards, ADR explanations, playbooks, lessons learned, architecture guidance, onboarding. | Governed Knowledge Platform, browsable through Obsidian | Validated, versioned, provenance-rich, curated, and slowly changing. |
| Repository truth | Code, tests, schemas, configuration, build artifacts, current behavior. | Repositories and verified delivery systems | Controls implementation truth; knowledge notes must be corrected when they conflict. |

## Core Architectural Invariants

- The Work Management Layer is the only authoritative owner of durable workflow state.
- Every mutable action is attributable to a goal, work item, execution, actor, authority grant, candidate, and policy decision.
- Implementation agents do not approve their own work when independence is required.
- Context packages, prompts, model choices, reviews, and approvals have provenance.
- Session rollover cannot create duplicate active ownership.
- Knowledge, analytics, scores, and recommendations never override repository truth, approved ADRs, policy, or authorized decisions.
- Customer feedback, growth metrics, financial records, trust signals, dependency health, expert advice, and simulation outputs retain source, scope, freshness, and uncertainty.
- No vanity metric, forecast, simulated result, or model confidence may override verified cash, customer harm, legal obligations, platform constraints, or Founder-reserved authority.
- External experts advise or decide only within recorded scope; their conclusions and limitations are written back without granting them hidden workflow authority.
- Tenant, project, repository, credential, and memory boundaries are enforced by design.

# 4. Adaptive Orchestration and Progressive Autonomy

The Executive Orchestrator is an AI agent role running on an approved model, not a special proprietary model. Its job is to choose and govern the workflow; it does not need to write the implementation itself. Model selection may change over time through the Model Management Platform.

## Adaptive Workflow Selection

| **Class** | **Typical path** | **Examples** |
|---|---|---|
| Tiny / low risk | One implementation owner → targeted checks → lightweight independent review when policy requires → accept. | Typo, narrow documentation fix, isolated test correction. |
| Small | Engineer → tests → independent reviewer → bounded revision loop → accept. | Contained bug fix, small UI behavior, local refactor. |
| Medium | Plan → Smart Work Packet → engineer → full validation → reviewer → revision → verification. | Feature within approved architecture. |
| Large | Research / architecture plan → decomposition → parallel owners → integration → code + architecture review → QA → Founder gate if reserved. | New subsystem or multi-service change. |
| Critical / production-sensitive | Pre-approved architecture and policy → constrained execution → specialist reviews → release evidence → designated approval → monitored rollout / rollback. | Security, payments, migrations, production infrastructure. |

| **LIGHTEST SAFE WORKFLOW** <br> The Orchestrator must minimize unnecessary agents, meetings, reviews, and artifacts while still satisfying risk, evidence, independence, and authority requirements. A one-line change must not be treated like a platform migration. |
|---|

## Orchestrator Decision Factors

- Task size, ambiguity, novelty, dependency count, blast radius, persistence impact, production exposure, and reversibility.
- Required capabilities, repository familiarity, language/framework fit, tools, availability, and recent performance.
- Independent versus collaborative execution, pair engineering, temporary working groups, parallel work, or sequential handoff.
- Review depth, specialist lenses, evidence requirements, budget, deadline, and expected outcome value.
- Provider/model capability, context window, cache behavior, latency, cost, reliability, data policy, and independence.
- Whether automatic acceptance is permitted or Founder authority is required.

# 4A. Adaptive Organization Formation and Parallel Execution

Dev HQ must scale work by forming temporary, purpose-built organizations rather than blindly spawning agents. The Orchestrator decides whether one expert, a small team, or a hierarchy of leads and specialists will produce the best quality-adjusted result within authority, budget, and time constraints.

## Core Operating Rule

Parallel investigation, explicit interfaces, centralized synthesis, and durable write-back. Partial outputs never become final approval merely because every packet completed.

## Organization Formation Decision

Before creating multiple assignments, the Orchestrator must determine whether the work is actually decomposable and whether expected speed or quality improvement exceeds coordination, integration, context, and token overhead.

- Estimate task size, risk, ambiguity, dependency density, repository topology, change coupling, review lenses, expected runtime, and deadline.
- Identify indivisible critical-path work that requires one coherent owner.
- Identify independent or interface-bounded workstreams suitable for parallel execution.
- Select team size, hierarchy, agent capabilities, models, tools, communication mode, budget, and stop conditions.
- Prefer the smallest team that meets the completion target; do not parallelize merely because capacity exists.

## Dependency-Aware Work Decomposition

Work packets are grouped by subsystem, responsibility, interface, review lens, or evidence domain—not by equal file count alone. File count is an input, never the decomposition rule.

- Preserve cohesive ownership of tightly coupled files and behavior.
- Declare packet boundaries, shared interfaces, upstream assumptions, downstream consumers, and integration order.
- Create cross-packet dependency records and block unsafe concurrent mutation.
- Reserve an integration owner for changes that must converge into one candidate.

## Dynamic Workforce Scaling

Workers are temporary execution capacity. HQ may create, pause, reuse, or retire assignments according to workload, provider limits, project budgets, and measured value. Permanent role definitions remain stable even when temporary worker instances scale up or down.

- Single-owner mode — one agent owns the work and full context.
- Small-team mode — two to five bounded owners with one lead or integrator.
- Parallel-team mode — multiple subsystem or specialist packets executed concurrently.
- Hierarchical mode — chief lead, subsystem leads, and specialists for unusually large or multi-repository work.

## Controlled Agent Communication

Agents may communicate when coordination improves correctness or speed, but communication is scoped, attributable, logged, budgeted, and written back to the Work Management Layer.

- Structured messages include question, dependency, evidence, decision request, impact, urgency, and required response.
- Direct sessions are temporary and have a purpose, participants, lead, authority, duration, exit criteria, and transcript or decision summary.
- Agents cannot silently change another packet’s scope, interface, candidate, or authority.
- Material decisions become durable decision records; useful findings become evidence or knowledge proposals.

## Parallel Review Organizations

Large reviews may be decomposed into subsystem packets or specialist lenses. Each reviewer returns a standardized report tied to the same stable candidate. A designated lead reviewer performs cross-cutting analysis and issues the only consolidated review recommendation.

Example: a fifty-file change may be divided into execution, persistence, retry/replay, governance, evidence, interfaces, and test/integration packets rather than seven arbitrary groups of files.

## Lead Reviewer Reconciliation

The lead reviewer must deduplicate findings, resolve contradictory conclusions, inspect cross-packet interactions, verify evidence, identify uncovered scope, and determine whether the complete candidate is architecturally coherent.

- Packet approval is not candidate approval.
- Unresolved reviewer disagreement blocks approval or escalates to the proper authority.
- Material edits after packet review invalidate affected packet approvals.
- The lead may request targeted re-review rather than rerunning every packet when candidate identity and impact analysis support it.

## Integration and Convergence

Parallel implementation must converge through explicit integration ownership, deterministic merge order, interface verification, conflict handling, end-to-end tests, and a final stable candidate. HQ must be able to cancel, retry, or serialize packets when concurrency no longer remains safe.

## Efficiency and Safety Metrics

Measure wall-clock speedup, total token and compute cost, coordination overhead, duplicated work, merge conflicts, defect yield, review coverage, rework, integration failures, and quality-adjusted value. A larger team is justified only when measured outcomes support it.

## Progressive Introduction

Late Phase 1 establishes bounded static decomposition, packet identity, parallel assignment safety, standardized returns, and single-lead reconciliation. Early Phase 2 adds dynamic decomposition and temporary organization formation. Mid Phase 2 adds controlled communication and learning. Late Phase 2 adds hierarchical teams and portfolio-scale workforce optimization.

| **Level** | **Name** | **Meaning** | **Minimum proof** |
|---|---|---|---|
| 0 | Manual | Founder coordinates work and reviews. | Durable task tracking exists. |
| 1 | Assisted | HQ helps plan, draft packets, and surface state. | Reliable read models and evidence links. |
| 2 | Orchestrated | HQ routes scoped work and manages retries, reviews, and handoffs. | Deterministic lifecycle and policy gates. |
| 3 | Founder-supervised autonomous | HQ completes routine end-to-end work and escalates only reserved decisions. | Phase 1 exit gates. |
| 4 | Self-improving | HQ builds and improves itself using governed knowledge and intelligence. | Phase 2 exit gates. |
| 5 | Business-aware organization | HQ proves end-to-end product delivery through Viybd, then builds and operates validated ventures while measuring product and business outcomes. | Phase 3 exit gates. |
| 6 | Enterprise platform | Multiple organizations run governed human-agent engineering. | Phase 4 maturity gates. |

# 5. Phase 1 — Build the First Autonomous Dev HQ

Phase 1 replaces ad-hoc prompting with a production-grade engineering system that can reliably build software, manage its own context, expose live progress on desktop and phone, and complete governed work under Founder supervision.

## Sprint 1A — Core Foundation

**Purpose.** Build the operating system of HQ.

- Work Management Layer and durable work-item model.
- Projects, milestones, sprints, tasks, dependencies, priorities, ownership, and status.
- State machines and permitted transitions.
- Event, evidence, artifact, decision, approval, budget, and outcome records.
- Queues, repository identity, candidate identity, ADR linkage, and audit trail.

## Sprint 1B — Agent Framework and Engineering Organization

**Purpose.** Create specialized roles with explicit responsibilities, authority, and review boundaries.

- Executive / Project Orchestrator foundation.
- Design, architecture, backend, frontend, QA, security, documentation, DevOps, research, and product roles.
- Capability declarations, tool permissions, authority limits, status, handoff, and expected-return conventions.
- Implementation-owner versus independent-reviewer separation.

## Sprint 1C — Execution Pipeline

**Purpose.** Create a repeatable end-to-end engineering lifecycle.

- Founder request intake and clarification.
- Planning, architecture, decomposition, scheduling, assignment, dispatch, and attempt handling.
- Implementation, review, revision, testing, approval, commit, integration, and completion recording.
- Evidence linkage and candidate identity across gates.

## Sprint 1D — Reviews and Engineering Quality

**Purpose.** Make independent review and quality enforcement mandatory where required.

- Independent correctness and architecture review.
- Security, QA, documentation, accessibility, performance, data, and deployment review foundations.
- Reusable quality gates, candidate freezing, conflict resolution, revision and re-review loops.

## Sprint 1E — Reliability and Deterministic Execution

**Purpose.** Make orchestration trustworthy under retries, concurrency, partial failure, replay, and interruption.

- Idempotent commands, transitions, dispatches, events, evidence, and recovery.
- Canonical identity reservation and duplicate prevention.
- Race-condition, stale-read, stale-write, and lost-update protection.
- Deterministic retries, reconciliation, crash recovery, bounded revision, and escalation.
- Automatic failure classification, uncertain-outcome handling, interruption, replay, restart, and invariant tests.

## Sprint 1F — Mission Control Lite and Founder Interface

**Purpose.** Deliver the minimum complete operational command center without delaying autonomy for advanced analytics.

- Founder conversation and command surface.
- Project, roadmap, sprint, task, execution, agent, queue, review, approval, and release views.
- Live execution timeline, current owner, status reason, next gate, blockers, and evidence.
- Phone-optimized responsive PWA, push-capable notifications, and fast approval flows.
- Context health, checkpoints, model/provider, cost, and budget visibility.
- Advanced executive analytics are intentionally deferred to Phase 2.

## Sprint 1G — Smart Work Packet Generation

**Purpose.** Automatically produce complete, role-specific engineering work orders.

- Objective, success definition, architecture, ADRs, dependencies, constraints, scope, out of scope, authority, and budgets.
- Implementation, error handling, concurrency, persistence, security, observability, documentation, testing, evidence, and reviewer requirements.
- Context plan, provider plan, checkpoint plan, known pitfalls, repository hotspots, integration risks, and expected reviewer focus.

## Sprint 1H — Repository Intelligence and Context Systems

**Purpose.** Give HQ a durable current model of each codebase and precise context assembly.

- Architecture, dependency, module, API, data, runtime, test, ownership, and risk models.
- Patterns, conventions, recent changes, technical debt, documentation, and ADR linkage.
- Change detection, stale-model invalidation, semantic retrieval, impact analysis, and least-privilege Context Router.
- Foundation hooks for later Company Knowledge Platform retrieval.

## Sprint 1I — Autonomous Engineering Loop

**Purpose.** Connect all Phase 1 systems into an end-to-end governed workflow.

- Founder intake, intent resolution, complexity classification, authority checks, planning, packet generation, routing, and scheduling.
- Independent or controlled collaborative implementation.
- Bounded static decomposition for large work: subsystem packets, explicit interfaces, one integration owner, and conservative concurrency limits.
- Automatic engineer↔reviewer revision loop bounded by policy, attempts, budget, and escalation.
- Large reviews may use a small fixed set of parallel review packets, but one designated lead reviewer must reconcile findings and issue the final recommendation.
- Testing, failure classification, retries, reconciliation, recovery, evidence, verification, and approvals.
- Context monitoring, checkpoints, rollover, restoration, commit, integration, reporting, performance updates, and next-roadmap progression.

| **APPROVED 1E → 1F TRANSITION** <br> Complete approved 1E work; run independent correctness and required architecture review against a stable candidate; resolve blockers; verify the full reliability suite and invariants; obtain Founder approval; commit the protected Sprint 1E baseline; then create/register the architecture-reviewer and commit governance changes separately before meaningful 1F work. |
|---|

# 6. Phase 1 Context Lifecycle Manager

The former Token Keepalive concept is a full Context Lifecycle Manager introduced across the 1G/1H boundary and completed before 1I is approved for long-running autonomous operation. It does not force one endless conversation; it preserves durable state across clean successor sessions.

### Context health and decisioning

- Normalize token usage, context limits, cache usage, estimated remaining capacity, tool-state constraints, and provider behavior.
- Compute deterministic health scores from pressure, relevance density, duplication, stale context, unresolved work, contradictions, and remaining effort.
- Choose continue, compact, checkpoint, split, switch model/provider, or roll to a fresh session.

### Automatic checkpoints

- Create immutable structured checkpoints at lifecycle boundaries, thresholds, before risky operations, before rollover, and after meaningful decisions or reviews.
- Record identity, objective, scope, authority, candidate, files, plan, completed/open work, decisions, evidence, tests, reviews, risks, next gate, provenance, and checksum.

### Continuation packets

- Generate self-contained, role-specific packets preserving constraints, rejected approaches, open findings, authority limits, tools, commit authority, restoration checks, and exact next action.

### Compaction and relevance

- Deduplicate stale logs and superseded summaries while preserving architecture constraints, active requirements, negative scope, findings, and evidence references.

### Automatic rollover and restoration

- Roll before exhaustion at natural boundaries. Prevent duplicate ownership. Verify work identity, repository, branch, HEAD, diff, tests, reviews, authority, dependencies, and environment before mutable work resumes.

### Failed-restoration recovery

- Retry bounded context assembly, fall back to an earlier verified checkpoint, create explicit recovery or uncertain states, and block unsafe work.

### Context analytics

- Measure continuation success, restoration success, missing/unused context, retrieval precision, staleness, compaction loss, cache effectiveness, cost, and post-rollover review outcomes.

# 7. Mission Control Lite and Progressive Founder Experience

Phase 1 delivers a complete operational command center, not the final executive analytics suite. This preserves visibility and phone access while preventing advanced dashboard work from delaying autonomy.

| **Stage** | **Timing** | **Primary purpose** |
|---|---|---|
| Stage 1 — Mission Control Lite | Phase 1 | What is happening now: work, owners, queues, reviews, evidence, approvals, blockers, context, budgets, releases. |
| Stage 2 — Founder Dashboard | Early Phase 2 | How healthy is the organization: quality, velocity, risk, cost, architecture, context, and autonomous readiness. |
| Stage 3 — Executive Dashboard | Mid/Late Phase 2 | Why it is happening and what should change: forecasts, scenarios, bottlenecks, staffing, routing, and recommendations. |
| Stage 4 — Enterprise Operations Center | Phase 4 | Multi-organization portfolios, policy, economics, compliance, tenancy, integrations, and service operations. |

## Phase 1 Operational Views

- Portfolio, project, roadmap, milestone, sprint, and task status.
- Live execution timeline with owner, active action, elapsed time, waiting reason, retries, review state, and next gate.
- Agent and human queues, capability, availability, assignment, collaboration mode, and context health.
- Evidence viewer for tests, logs, screenshots, diffs, artifacts, metrics, reviews, and deployments.
- Review center with candidate identity, findings, severity, remediation guidance, re-review state, and commit recommendation.
- Approval center and Founder Decision Inbox limited to reserved decisions.
- Phone-first approval, reject, request-change, pause, resume, and priority actions.
- Installable PWA, secure authentication, reconnect behavior, low-bandwidth support, and accessibility.

# 8. Review, Verification, and Autonomous Revision Loops

Quality is a workflow property. Reviews are tied to a named stable candidate and must provide enough evidence and remediation direction for implementation agents to fix findings without Founder translation.

| **Finding field** | **Required content** |
|---|---|
| Identity | Stable finding ID, reviewer, lens, model/provider where applicable, and candidate identity. |
| Problem + evidence | What is wrong and exact files, lines, commands, tests, traces, screenshots, metrics, or policy evidence. |
| Why it matters | Correctness, architecture, security, privacy, accessibility, performance, reliability, operations, or business consequence. |
| Constraint violated | ADR, requirement, invariant, policy, standard, acceptance criterion, or documented expectation. |
| Safest remediation | Correction direction, affected scope, behavior that must remain unchanged, and likely blast radius. |
| Required proof | Regression, concurrency, replay, migration, security, performance, accessibility, or operational evidence. |
| Re-review | Required reviewer, candidate identity, exact evidence, approval invalidation, residual risk, and confidence. |

## Standard Verdicts

- APPROVE — no blocking findings; evidence sufficient for next gate.
- APPROVE WITH NON-BLOCKING FINDINGS — safe to proceed with tracked follow-up.
- CHANGES REQUIRED — blockers must be remediated and re-reviewed.
- REJECT CANDIDATE — unsafe or materially outside authorized scope.
- ESCALATE — reserved architecture, policy, risk, or Founder decision required.
- UNABLE TO VERIFY — evidence or candidate identity is insufficient; no approval may be inferred.

| **AUTONOMOUS ENGINEER ↔ REVIEWER LOOP** <br> Engineer implements and validates → independent reviewer inspects the exact candidate → if CHANGES REQUIRED, findings are routed directly back to the implementation owner → engineer fixes and supplies required proof → the same required reviewer re-reviews the new candidate → repeat until APPROVE, bounded attempt/budget limit, or escalation. The Founder is not used as a copy-and-paste relay. |
|---|

## Verification-First Completion

- Scope, out of scope, assumptions, and acceptance criteria are explicit and satisfied.
- Implementation follows approved architecture and authority boundaries.
- Tests cover real risk, including failure, concurrency, replay, migration, restoration, and rollback where applicable.
- Required code, architecture, security, accessibility, performance, data, documentation, and deployment reviews are complete.
- Every blocker is fixed, disproven by evidence, reclassified by an authorized reviewer, or resolved by proper decision authority.
- Evidence is tied to the final candidate; later edits invalidate affected evidence and approvals.
- Documentation, ADRs, runbooks, migration guidance, and Current Progress Update are correct.
- The correct commit, merge, deployment, and durable completion record exist.

## Reviewing Work That Enforces

Review of a control — a gate, a scanner, a rule, a verifier, anything whose purpose is to fail
when something is wrong — carries a requirement ordinary review does not.

**The reviewer re-derives; the reviewer does not re-read.** Reading a control and finding its
logic sound establishes almost nothing, because the defect in a hollow control is never visible
in its logic. It is in what the logic is applied to, what it silently skips, and what it treats
as absence of evidence. The reviewer must construct inputs the control claims to catch and run
them: write mutations, inject a finding, delete the reference the check compares against, and
observe what the control actually reports.

Every control this organization has found hollow was approved by a reader and exposed by a
re-deriver. That is a property of the failure mode, not of any individual reviewer's care.

**The author of a control does not write its only negative controls.** An author's mutations
test the failure modes the author already imagined, which are by construction the ones the
control already handles. This is the single most load-bearing rule here, because it is the only
one that still works when the author is confident and wrong.

**Acceptance evidence for a control is the failing transcript, not the passing one.** Ask to see
it go red on a known-bad input before accepting that it goes green on a good one. A control that
cannot be shown failing has not been shown to work.

**Treat a green result with more suspicion when the thing under test is itself a check.** For
ordinary code, green means the code did what was asked. For a control, green is also exactly
what a control that does nothing produces. The two are indistinguishable without the evidence
above.

# 9. Phase 1 Autonomous-Readiness and Exit Gates

**How a gate is passed.** Every gate below carries a **Proof** line. A gate is passed when its
proof runs and succeeds — a command that exits zero, an automated test, or a stored record a
query can return. A gate is **not** passed by a document asserting that it was met. Written
reports may summarise a proof, cite it, and record its result, but they are never the proof
itself, because a document cannot fail when the system behind it regresses. If a gate has no
executable proof, the gate is not ready to be claimed; define the proof first.

**A proof must be demonstrated capable of failing.** An executable check that cannot go red is
indistinguishable from no check, and looks identical to a working one, because both report
success. So a green result is not evidence that a proof works — it is evidence only that the
proof ran. Before a proof is accepted, it must be shown failing on a known-bad input, and that
failing transcript is part of the gate's evidence alongside the passing one.

**Where a proof asserts that something causes failure, it requires a null arm.** A suite that
claims "this fails when X is present" must also assert "this passes when X is absent," from an
identical starting state. Without that control, a failure attributed to X may have been caused
by the starting state, and the suite will report success while measuring nothing. Every
control this organization has built and later found hollow failed exactly here — the check was
run, it was green or red as expected, and nothing established that the expected result was
caused by the thing under test.

**Controls are tested from the baseline they will run against**, not from the working state of
whoever is building them. A check that will run against the default branch in continuous
integration is verified against the default branch. Measuring from a state that already
differs is how a null result and a real result become impossible to tell apart.

### Engineering execution gate

- Decompose a Founder goal into milestones, dependencies, work items, acceptance criteria, review plans, and context plans.
- Generate complete Smart Work Packets and choose appropriate agents, models, providers, budgets, and collaboration modes.
- Execute implementation, testing, review, revision, recovery, integration, and completion through durable records.

**Proof.** A Founder goal is decomposed and executed end to end, and the resulting work item,
its packets, and its state transitions are replayable from stored records alone. The
orchestration log for that run contains no manual agent-by-agent step.

### Agent and model efficiency gate

- Track capability, quality, rework, speed, cost, context efficiency, tool reliability, and routing outcomes.
- Avoid redundant agents and unnecessary collaboration.

**Proof.** A query returns per-role, per-model metrics across a stated minimum number of runs,
sufficient to rank candidates for each role. Ranking a role's occupants must be possible from
the data without human recollection.

### Context continuity gate

- Automatic checkpointing, compaction, continuation, rollover, restoration, and verification are operational.
- Complete a multi-session milestone without manual context reconstruction.

**Proof.** An automated test forces a rollover mid-milestone and asserts that the restored
state matches the pre-rollover state. A milestone spanning more than one session completes
with no manual context reconstruction recorded in its event log.

### Quality and governance gate

- Independent code and architecture review run according to risk and policy.
- Verification-first completion prevents unsupported claims.
- Authority, credentials, budgets, approvals, events, evidence, models, prompts, and decisions are auditable.

**Proof.** Continuous integration is green on the candidate, including the required test step,
which is not skippable. For a sampled completed work item, a query returns its unbroken chain
of authority, review, evidence, and approval records. Machine-enforceable policy is enforced
by a failing build rather than by a reviewer noticing.

### Mission Control gate

- Founder can view live authoritative progress on desktop and phone.
- Approvals, blockers, findings, evidence, context health, budgets, and notifications are operational.

**Proof.** An end-to-end browser test suite passes against the running application at both a
desktop and a mobile viewport, exercising live progress, approval, and blocker paths. A
screenshot is not a proof; the test is.

### Demonstration gate

- Complete several consecutive end-to-end roadmap tasks with no manual agent-by-agent orchestration.
- Recover from interruption, duplicate callback, context rollover, blocked review, and exhausted retry path.
- Produce an evidence-backed milestone report and correct next-roadmap plan.

**Proof.** Consecutive end-to-end runs complete with stored records and no manual
orchestration. Each listed failure mode — interruption, duplicate callback, context rollover,
blocked review, exhausted retry — is injected deliberately by an automated recovery test that
asserts convergence to the correct final state.

| **PHASE 1 RELEASE DECISION** <br> Only after every Phase 1 gate is verified should the Founder authorize Dev HQ to execute Phase 2 as a largely autonomous self-improvement program. |
|---|

# 10. Phase 2 — Use Dev HQ to Build Dev HQ

Phase 2 uses the completed Phase 1 organization to perform the majority of engineering work required to improve, scale, govern, measure, and optimize Dev HQ itself. The sequence places company knowledge early, then adds evidence-backed agent memory after Engineering Intelligence so later collaboration, routing, model, research, and production systems benefit from accumulated institutional context and measured experience.

## 2A — Adaptive Organization Engine

Purpose. Convert adaptive orchestration into a governed organization-forming capability that can safely decompose, staff, coordinate, reconcile, and retire temporary teams.

- Work Decomposition Planner: dependency graphing, subsystem clustering, interface extraction, critical-path detection, packet sizing, and non-parallelizable work identification.
- Temporary Organization Builder: select one owner, small team, parallel team, or hierarchy based on risk, complexity, capability, cost, latency, and deadline.
- Dynamic Workforce Controller: create, queue, pause, resume, rebalance, and retire worker assignments within project and global budgets.
- Review Packet Generator: create subsystem- or lens-specific review packets tied to one stable candidate, with explicit reviewed and unreviewed scope.
- Lead Reconciliation Engine: merge findings, remove duplicates, resolve conflicts, detect cross-packet risks, validate coverage, and issue one final recommendation.
- Integration Manager: manage shared interfaces, merge order, candidate convergence, conflict resolution, end-to-end proof, and rollback of failed parallel work.
- Parallelization Optimizer: predict and measure speedup, token cost, coordination overhead, duplicated work, risk, and diminishing returns.
- Communication Broker: structured questions, dependency notices, evidence sharing, decision requests, and bounded direct sessions with complete write-back.
- Organization templates for implementation teams, review teams, research teams, incident teams, migration teams, and cross-repository programs.
- Conservative default limits, provider-aware concurrency, cancellation, backpressure, fairness, starvation prevention, and emergency serialization.
- Acceptance gate: demonstrate that adaptive teams outperform single-owner execution on selected large tasks without reducing quality, auditability, deterministic convergence, or review independence.

## 2B — Multi-Project Scaling

**Purpose.** Manage many repositories and products through one governed organization.

- Project isolation, project-specific roadmaps, budgets, memory, quality gates, and health.
- Shared agent organization with project-aware routing.
- Cross-project dependencies, portfolio planning, multi-repository changes, and coordinated releases.

## 2C — Company Knowledge Platform

**Purpose.** Give the organization durable institutional knowledge and a living human-readable brain.

- Obsidian vault as the primary human browsing/editing interface.
- Canonical knowledge service and metadata store behind the vault.
- Architecture, ADRs, standards, playbooks, features, research, incidents, lessons learned, changelogs, and onboarding.
- Context Router retrieval before work and automatic documentation updates after approved completion.
- Knowledge Curator agent, freshness, contradiction, provenance, supersession, retention, and effectiveness measurement.

## 2D — Executive Intelligence and Advanced Founder Interface

**Purpose.** Develop the Orchestrator into a higher-level engineering leader and upgrade Founder visibility.

- Strategic planning, prioritization, scheduling, staffing, capacity, forecasting, scenarios, budget optimization, and bottleneck detection.
- Founder Dashboard and Executive Dashboard with traceable recommendations.
- Risk-aware delegated acceptance and authority recommendations.

## 2E — Engineering Intelligence Platform

**Purpose.** Unify measurement, learning, architecture health, context quality, review analytics, routing intelligence, and organizational health.

- Common event and metric model.
- Health scores, trends, anomalies, root causes, forecasts, and recommendation provenance.

## 2F — Agent Memory and Organizational Learning System

Purpose. Give HQ durable, evidence-backed memory of agent experience and organizational execution outcomes so routing and team formation improve over time without turning historical reputation into authority.

- Maintain per-agent and per-role experience records tied to exact work items, candidates, models, tools, reviews, outcomes, and provenance.
- Track demonstrated domain expertise, successful implementation patterns, recurring mistakes, reviewer feedback, revision history, collaboration outcomes, preferred team pairings, and confidence by task type.
- Separate ephemeral session context, project-specific experience, organization-wide capability evidence, and validated institutional knowledge.
- Apply freshness, decay, contradiction, supersession, privacy, tenant, project, and authority boundaries so stale or unauthorized experience is not retrieved or used.
- Use memory to improve agent selection, reviewer assignment, temporary-team composition, Smart Work Packets, mentoring, escalation, and learning proposals.
- Require evidence-backed promotion: a single success, failure, reviewer opinion, or model-generated summary may not become a durable expertise claim or organizational rule.
- Prevent memory scores from replacing current repository evidence, tests, policy, candidate-specific review, or required independent approval.
- Acceptance gate: demonstrate that memory-informed routing and team formation improve quality-adjusted outcomes on repeated task classes while remaining explainable, reversible, privacy-safe, and resistant to stale or misleading history.

## 2G — Advanced Collaboration

**Purpose.** Allow agents and humans to cooperate when collaboration improves quality or speed.

- Structured cross-packet questions, dependency notices, evidence broadcasts, conflict escalation, and decision requests.
- Temporary direct collaboration sessions with a named lead, time/budget box, transcript, decision capture, and mandatory Work Management write-back.
- Independent execution, pair sessions, direct controlled sessions, temporary groups, threads, mentions, shared evidence, and explicit write-back.
- Preserve independent review where required.

## 2H — Model Management Platform

**Purpose.** Manage the lifecycle of models and providers.

- Benchmarks, latency, cost, reliability, context behavior, tools, safety, and structured-output quality.
- Versioned routing, A/B tests, shadow evaluation, safe upgrades, rollback, deprecation, and model cards.

## 2I — Autonomous Research and Architecture Discovery

**Purpose.** Perform rigorous evidence-backed pre-implementation research.

- Official docs, standards, RFCs, prior art, repository constraints, alternatives, tradeoffs, risks, experiments, and ADR proposals.

## 2J — Interactive AI Pair Engineering

**Purpose.** Support high-quality interactive work alongside autonomous execution.

- Open, explain, trace, refactor, test, compare approaches, checkpoint edits, and promote useful exploration into governed work.

## 2K — Enterprise Production Platform

**Purpose.** Create reusable production-readiness infrastructure and organization-wide quality gates.

- Accessibility, security, secret scanning, dependency scanning, privacy, performance, SEO, deployment, migration, rollback, observability, and release readiness.
- Reusable environment, CI/CD, infrastructure, and operational capability packs.

| **PHASE 2 COMPLETION PROMISE** <br> At the end of Phase 2, Dev HQ is a multi-project, enterprise-ready, self-improving engineering organization that compounds knowledge, learns from outcomes, manages models deliberately, chooses agents and collaboration modes intelligently, performs autonomous research, supports human engineers, and provides executive-level planning and oversight. |
|---|

# 11. Company Knowledge Platform and Obsidian Interface

Obsidian is the primary human-readable interface to institutional knowledge, not the sole brain or source of operational truth. Dev HQ maintains synchronized, versioned Markdown knowledge with structured metadata, provenance, validation state, links to repository evidence, and access controls.

## Canonical Vault Structure

- Vision
- Product
- Roadmaps
- Architecture
- ADRs
- Engineering Standards
- Backend
- Frontend
- Database
- Infrastructure
- AI Systems
- Agents
- APIs
- Security
- Testing
- Deployments
- Playbooks
- Incident Reports
- Lessons Learned
- Changelogs
- Features
- Research
- Onboarding
- Deprecated / Superseded

## Agent Behavior

| **Moment** | **Required behavior** |
|---|---|
| Before work | Context Router searches relevant institutional knowledge, repository truth, ADRs, policies, recent incidents, and similar past work. |
| During planning | Research or architecture agents create design docs and ADR proposals when novelty or risk warrants them. |
| After approved implementation | Documentation agent updates feature docs, architecture, APIs, schemas, runbooks, examples, changelog, diagrams, and onboarding where affected. |
| After review or incident | Create knowledge proposals for recurring failure patterns, detection methods, tests, safe patterns, and anti-patterns. |
| During retrieval | Return only current, relevant, authorized knowledge with confidence, freshness, provenance, and supersession status. |
| During curation | Detect duplicates, contradictions, stale guidance, dead links, low-value notes, sensitive content, and missing ownership. |

## Knowledge Curator Agent

- Validate proposals before publication and route organization-wide changes for approval.
- Merge duplicates, connect related notes, maintain indexes, and preserve lineage.
- Mark preferred, deprecated, rejected, superseded, or experimental guidance.
- Detect conflicts with current code, ADRs, policies, and repository models.
- Archive obsolete knowledge without erasing audit history.
- Measure whether retrieved knowledge improved outcomes or caused confusion.
- Prevent chat summaries and temporary execution state from silently becoming permanent company doctrine.

## Automatic Organizational Learning

A reviewer finding or production incident is not automatically promoted into institutional knowledge. It creates a proposal. The proposal is validated against evidence, generalized carefully, approved at the appropriate scope, published with provenance, and later challenged by new outcomes.

| **EXAMPLE** <br> A reviewer finds repeated race conditions. HQ fixes the candidate, then proposes a “Race Conditions” lesson covering common causes, detection, tests, safe patterns, examples, and links to the exact findings. Future work packets retrieve the lesson only when relevant. |
|---|

# 12. Engineering Intelligence, Review Learning, and Continuous Architecture Management

## Engineering Intelligence Platform

- Agent/provider performance, review effectiveness, escaped defects, architecture health, context quality, workflow throughput, cost, operations, business outcomes, and autonomous readiness.
- Metrics trace to authoritative events and candidate identities; predictions include confidence and assumptions.
- Learning proposals require validation before changing prompts, routing, thresholds, review depth, or policy.

## Review Learning Engine

- Track findings, validity, remediation cost, re-review outcome, false positives/negatives, escaped defects, and incidents.
- Identify recurring weaknesses, hotspots, missing tests, weak packet instructions, and ineffective gates.
- Propose improvements without weakening mandatory architecture, security, policy, or Founder gates.

## Continuous Architecture Management

- Maintain architecture graphs, boundaries, ownership, data flows, APIs, dependencies, and ADR relationships.
- Detect cycles, layer violations, drift, coupling, boundary erosion, package growth, and architecture debt.
- Produce scorecards and evidence-backed remediation proposals requiring proper authority.

# 12A. Agent Memory and Organizational Learning System

## Memory classes

- Execution memory: candidate-specific work history, actions, evidence, reviews, revisions, failures, recoveries, and outcomes. It is authoritative only for the recorded execution and does not become general doctrine automatically.
- Agent experience memory: evidence-backed performance and expertise by task class, domain, repository, tool, model/provider, collaboration mode, and review outcome.
- Team memory: pairings, temporary-organization structures, communication patterns, integration outcomes, coordination overhead, conflict history, and conditions under which a team performed well or poorly.
- Institutional knowledge: generalized standards, playbooks, lessons, and anti-patterns promoted through the governed Company Knowledge Platform and Knowledge Curator process.

## Agent experience record

- Identity: agent or role identity, model/provider/version where applicable, project and tenant scope, task class, repository/domain scope, and time window.
- Evidence: work items, candidates, tests, reviews, findings, revisions, incidents, costs, timing, collaboration records, and final outcomes.
- Assessment: demonstrated strengths, known weaknesses, confidence, sample size, uncertainty, freshness, contradiction state, and decay schedule.
- Usage: eligible routing decisions, reviewer selection, team composition, work-packet guidance, mentoring, or learning proposals; prohibited uses are recorded explicitly.

## Learning and promotion rules

- Raw outcomes update experience records only after candidate identity and evidence are verified.
- Repeated patterns may create a learning proposal; they do not directly alter prompts, policy, architecture, authority, or institutional knowledge.
- The Knowledge Curator validates organization-wide lessons, while Engineering Intelligence validates statistical claims and routing impact.
- Negative outcomes remain attributable to context: task difficulty, packet quality, model, tools, dependencies, environment, and reviewer quality must be considered before assigning blame.
- Agents may inspect and challenge material memory claims about their performance; corrections and supersession preserve lineage.

## Routing and team formation

- The Orchestrator may prefer agents with demonstrated relevant performance, but must account for uncertainty, recency, independence, capacity, cost, and exploration needs.
- HQ should occasionally test alternative qualified agents to prevent permanent lock-in, hidden specialization errors, and self-reinforcing rankings.
- Reviewer assignment must preserve independence even when memory predicts that a familiar pairing performs well.
- Memory-informed decisions must record which memories were used, their confidence and freshness, the alternative considered, and the resulting outcome.

## Privacy, boundaries, and deletion

- Memory is isolated by organization, tenant, project, repository, and authority scope; sensitive content is minimized and access controlled.
- Retention, correction, export, archival, and deletion behavior are governed by policy and audit requirements.
- No hidden personality profile or unsupported qualitative reputation may control work allocation.

# 13. Model Management, Research, and Human-Agent Collaboration

## Model Management Platform

- Track provider, model, version, context, tools, structured output, data policy, safety, cost, latency, reliability, and approved use cases.
- Benchmark planning, coding, review, architecture, research, restoration, and tool use.
- Use versioned routing policies, controlled A/B tests, shadow evaluations, canaries, safe promotion, rollback, and deprecation.
- Bind every model-assisted execution and decision to exact identity and configuration.

## Autonomous Research

- Formulate a decision question and research plan before implementation.
- Prioritize primary sources, official documentation, standards, repository evidence, and reproducible experiments.
- Record citations, freshness, uncertainty, assumptions, contradictions, alternatives, tradeoffs, recommendation, confidence, and proof plan.

## Human Collaboration

- Humans and agents use the same work items, evidence, permissions, decisions, and audit model.
- Support assignments, comments, threads, mentions, reviews, approvals, workspaces, notifications, pair sessions, and mixed teams.
- Every collaboration has purpose, roles, lead, duration, budget, authority, exit criteria, and write-back.

# 13A. Adaptive Organization Engine, Review Teams, and Reconciliation

The Adaptive Organization Engine is the reusable mechanism through which Dev HQ forms temporary organizations for implementation, review, research, incidents, migrations, documentation, and operations. It is a governed layer above individual agents and below the Executive Orchestrator’s strategic decisions.

## Team Formation Contract

Every temporary organization records objective, lead, members, roles, packet graph, interfaces, authority, context, models, tools, budget, deadline, communication mode, integration owner, review requirements, stop conditions, and dissolution criteria.

## Review Team Modes

- Single reviewer — narrow, low-risk, cohesive changes.
- Lead plus specialists — medium or cross-cutting changes requiring multiple lenses.
- Parallel subsystem review — large changes partitioned by coherent architecture domains.
- Hierarchical review — multi-repository or enterprise-scale changes with subsystem leads and a chief reviewer.
- Adversarial review — critical work receives independent competing analyses followed by evidence-based reconciliation.

## Communication and Decision Discipline

Communication may accelerate discovery, but only durable decisions, evidence, findings, and interface changes influence authoritative workflow state. Chat or session output alone never changes scope, authority, candidate identity, or approval status.

## Reconciliation Requirements

A reconciliation result includes coverage map, packet verdicts, duplicate and conflict resolution, cross-packet risks, missing scope, integration evidence, final findings, residual risk, confidence, and exact next gate.

## Failure Handling

If one packet fails, stalls, exceeds budget, loses context, or produces unverifiable output, HQ may retry, reassign, shrink scope, serialize dependencies, replace the worker, or fail the organization. Completed sibling packets remain reusable only when candidate identity and impact analysis prove they are still valid.

## Economic Control

HQ optimizes quality-adjusted completion—not maximum concurrency. It accounts for provider rate limits, context duplication, coordination messages, lead synthesis, integration, re-review, and opportunity cost. Global and per-project budgets prevent twenty active initiatives from simultaneously exhausting the organization’s capacity.

# 13B. Commercial Legal and Compliance Platform

Purpose. Convert accessibility, privacy, security, governance, and production-readiness foundations into a jurisdiction-aware compliance operating system for every product and venture. The platform reduces preventable risk and proves controlled behavior; it does not claim that software alone can guarantee compliance with every law or replace qualified counsel, accountants, auditors, or regulators.

## Applicability and Obligation Registry

- Maintain a versioned profile for each organization, product, jurisdiction, customer class, user age range, industry, data category, marketing channel, payment flow, accessibility exposure, contractual obligation, and regulated activity.
- Determine which compliance packs apply, record the source, effective date, interpretation status, confidence, owner, review date, and escalation requirement.
- Treat uncertain applicability as an explicit legal question; do not silently assume that a requirement applies or does not apply.

## Versioned Compliance Packs

- Web Accessibility Pack: chosen technical baseline, automated checks, keyboard testing, screen-reader testing, zoom/reflow, contrast, focus, forms, errors, captions, authentication, payment flows, and manual specialist review.
- Privacy and Data Protection Packs: notice mapping, collection limitation, purpose, legal basis or opt-out treatment, access, correction, deletion, portability, retention, processor/vendor controls, cross-border considerations, and incident response.
- Cookie, Tracking, and Preference Pack: live inventory of cookies, pixels, SDKs, local storage, fingerprinting, analytics, advertising, session replay, purposes, recipients, duration, consent state, withdrawal, regional behavior, and preference signals.
- Commercial Communications Pack: email, text, advertising, endorsements, claims substantiation, unsubscribe, suppression lists, contact permissions, platform terms, and brand approval.
- Payments, Billing, Subscription, Refund, and Consumer Protection Pack: pricing disclosure, recurring billing, cancellation, refund rules, receipts, taxes/invoicing interfaces, dispute handling, and financial reconciliation.
- Sector packs where authorized: children, health, finance, employment, education, regulated data, AI disclosures, marketplace rules, and other domain-specific obligations.

## Compliance Research and Change Management

- Monitor primary legal and regulatory sources, standards bodies, regulator guidance, court or enforcement developments where appropriate, and material platform-policy changes.
- Create a sourced change proposal that identifies affected products, uncertainty, required legal interpretation, implementation impact, deadlines, tests, communication obligations, and rollback or mitigation plan.
- Require qualified legal or specialist review for ambiguity, regulated activity, international expansion, material contracts, significant incidents, or high-impact risk acceptance.

## Compliance Release Record

- Bind every release to the exact candidate, jurisdiction profile, applicable packs, accessibility evidence, tracker inventory, consent behavior, privacy/data-flow mapping, retention rules, security evidence, unresolved questions, reviews, approvals, and residual risk.
- Block launch when required evidence, specialist review, notices, controls, consent behavior, or Founder approval is missing.
- Continuously test production behavior because configuration, third-party scripts, SDKs, marketing tools, and product changes can invalidate prior compliance evidence.

## Acceptance Gate

Demonstrate on representative products that the platform correctly selects applicable packs, detects an unauthorized tracker and a material accessibility failure, blocks release, routes uncertain legal interpretation to the correct authority, records evidence and provenance, and verifies remediation against the final candidate without representing the result as universal legal certification.

# 13C. Venture Discovery and Validation

Purpose. Use Phase 2 research, temporary organizations, knowledge, memory, intelligence, and production capabilities to discover commercially promising software opportunities and validate real demand before significant product investment. The system optimizes expected risk-adjusted value; it cannot guarantee profitability or know the absolute highest-profit venture in advance.

## Continuous Opportunity Discovery

- Form temporary market-research organizations to study approved industries, customer workflows, complaints, support forums, review sites, search behavior, job postings, procurement patterns, regulatory changes, technology shifts, pricing changes, and competitor activity.
- Maintain a versioned Opportunity Registry containing customer segment, problem, frequency, severity, current alternatives, willingness-to-pay evidence, competition, distribution channels, market constraints, technical feasibility, compliance burden, margins, support burden, defensibility, timing, and uncertainty.
- Separate sourced facts, customer statements, measurements, estimates, assumptions, model-generated hypotheses, and unknowns.

## Opportunity Scoring and Selection

- Score opportunities using expected customer value, urgency, reachability, willingness to pay, acquisition difficulty, retention potential, implementation cost, operating cost, legal/compliance risk, competitive intensity, strategic fit, reuse potential, and downside.
- Record assumptions, confidence intervals, sensitivity analysis, alternative opportunities considered, and reasons for selection or rejection.
- Do not rank an opportunity as highest profit from speculative market size alone; require comparative evidence and update rankings as real results arrive.

## Validation Experiment Engine

- Choose the cheapest ethical experiment capable of disproving or strengthening the hypothesis: interviews, problem surveys, manual concierge service, prototype demo, landing page, waitlist, outreach, letter of intent, pre-sale, deposit, paid pilot, usage test, or retention test.
- Define hypothesis, target segment, channel, message, sample, budget, duration, success threshold, guardrails, stop conditions, data handling, consent, compliance requirements, and exact decision rule before launch.
- Use approved identities, domains, accounts, claims, contact lists, advertising budgets, payment flows, and brand assets only within explicit authority.
- Reject deceptive demand tests, fake scarcity, fabricated testimonials, unsupported claims, unauthorized scraping, dark patterns, spam, or experiments that collect unnecessary personal data.

## Evidence and Venture Decision

- Capture responses, qualified conversations, conversion, acquisition cost, deposits, paid pilots, activation, engagement, retention, churn reasons, support burden, gross margin assumptions, and experiment integrity.
- Issue one of: KILL, RESEARCH FURTHER, PIVOT, REPEAT VALIDATION, AUTHORIZE LIMITED BUILD, or PROPOSE VENTURE LAUNCH.
- Require Founder approval before material public launch, substantial spend, major customer commitment, regulated-market entry, or expansion of commercial authority.
- Write validated lessons and failed assumptions into governed knowledge without turning one experiment into permanent doctrine.

## Acceptance Gate

Run several opportunities through the complete loop, prove that weak ideas are stopped without unnecessary full builds, produce at least one decision supported by real customer or payment evidence, preserve legal and brand controls, and show that independent reviewers can reproduce the recommendation from the recorded evidence.

| PHASE 2.5 COMPLETION PROMISE<br>Dev HQ can continuously discover opportunities, maintain current compliance obligations, run bounded validation experiments, compare evidence, and recommend kill, pivot, limited build, or launch decisions. The Founder retains material legal, brand, pricing, capital, customer-commitment, and public-launch authority. |
|---|

# 13D. Customer Reality System

Purpose. Create a continuous, governed connection between what customers actually experience and what Dev HQ believes about a product, market, or venture. The system prevents internal plans, model-generated narratives, and vanity metrics from drifting away from real customer value.

## Customer Evidence Intake

- Ingest authorized support tickets, reviews, interviews, surveys, sales calls, objections, refunds, cancellations, usage events, search behavior, feature requests, complaints, and account-health signals.
- Normalize identity, consent, source, segment, product version, channel, date, severity, confidence, and privacy scope while minimizing unnecessary personal data.
- Separate direct customer statements, observed behavior, inferred intent, operational facts, and model-generated interpretation.

## Customer Insight and Decision Loop

- Cluster recurring jobs, pain points, objections, unmet needs, confusion, trust failures, adoption barriers, churn causes, and high-value outcomes.
- Link insights to product hypotheses, experiments, roadmap items, support playbooks, pricing assumptions, and venture decisions.
- Require representative sampling, contradiction tracking, confidence, minority-impact review, and evidence of whether changes improved the targeted outcome.

## Acceptance Gate

- Demonstrate that customer evidence changes at least one product or venture decision, that conflicting signals are preserved rather than averaged away, that privacy and consent boundaries are enforced, and that a reviewer can trace each insight to its underlying evidence.

# 13E. Growth and Distribution Operating System

Purpose. Make distribution a measurable, governed capability that can acquire and retain customers without deceptive claims, uncontrolled spend, platform abuse, or dependence on a single channel.

## Channel and Campaign Management

- Manage approved SEO, content, email, partnerships, affiliates, creators, referrals, communities, marketplaces, app stores, outbound sales, and paid advertising through channel-specific authority and compliance packs.
- Maintain positioning, audience, offer, creative, landing page, attribution, budget, frequency, platform policy, claims evidence, and stop conditions for every campaign.
- Use controlled experiments to compare acquisition cost, conversion quality, activation, retention, margin, support burden, and brand impact—not clicks or views alone.

## Distribution Learning and Portfolio

- Track channel saturation, creative fatigue, incrementality, cannibalization, attribution uncertainty, affiliate quality, creator performance, and dependence risk.
- Promote reusable successful patterns only after validation across sufficient samples and preserve exploration to avoid permanent channel lock-in.
- Pause campaigns automatically when spend, complaint, compliance, margin, fraud, or reputation thresholds are exceeded.

## Acceptance Gate

- Run multiple bounded acquisition experiments, prove accurate spend and outcome attribution within stated uncertainty, stop at least one weak channel, scale one validated channel within policy, and demonstrate that growth actions cannot exceed approved claims, identities, contact permissions, or budgets.

# 13F. Financial and Treasury Control System

Purpose. Give HQ an authoritative, reconciled view of cash, obligations, profitability, reserves, and spending authority so autonomous operations cannot outrun real financial capacity.

## Financial Records and Reconciliation

- Integrate approved banking, payment, billing, marketplace, payroll/vendor, tax, accounting, advertising, refund, and chargeback records through least-privilege connections.
- Maintain reconciled cash balances, receivables, payables, deferred obligations, refunds, taxes payable, reserves, runway, revenue, cost of goods, operating expense, gross margin, contribution margin, and cash-flow forecasts.
- Treat accounting classifications and tax positions as governed records subject to qualified review, not autonomous model judgment.

## Treasury Policy and Controls

- Enforce spend ceilings, category budgets, reserves, approval thresholds, dual control, vendor allowlists, payment-destination verification, anomaly detection, and emergency freezes.
- Prevent spending against forecast revenue, undisclosed liabilities, unreconciled balances, or funds reserved for taxes, refunds, payroll, incidents, or core HQ operations.
- Require Founder or designated professional approval for transfers, new financial accounts, debt, investment, equity, acquisitions, tax elections, and material reinvestment policy.

## Acceptance Gate

- Demonstrate end-to-end reconciliation across representative revenue, fees, refunds, taxes, vendor costs, and advertising spend; detect a payment anomaly; block an over-budget action; preserve dual control; and produce a reproducible cash and profitability report reviewed by the designated financial authority.

# 13G. Trust, Reputation, and Brand Safety System

Purpose. Protect customers, the Founder, and every venture from short-term tactics that create misinformation, unsafe content, policy violations, reputational damage, or long-term trust loss.

## Brand and Content Controls

- Maintain approved brand identities, tone, claims, disclosures, audience restrictions, prohibited themes, sensitive topics, creator standards, product-safety rules, and escalation paths.
- Review public content, listings, advertisements, support responses, AI-generated media, children-directed content, endorsements, testimonials, and partner behavior against evidence, policy, age appropriateness, and platform rules.
- Detect copied or infringing material, misleading before/after claims, fabricated social proof, impersonation, hidden sponsorship, manipulative design, harmful stereotypes, and unsafe recommendations.

## Reputation Monitoring and Response

- Monitor reviews, complaints, sentiment, press, platform warnings, creator/supplier incidents, fraud reports, customer harm, and brand confusion with source and confidence.
- Use preapproved response playbooks for routine issues and escalate legal threats, safety events, coordinated abuse, public crises, or material misinformation.
- Measure trust, complaint resolution, repeat harm, review authenticity, policy strikes, and long-term customer value alongside revenue.

## Acceptance Gate

- Detect and block representative unsafe or misleading content, route a simulated reputation incident correctly, preserve evidence and communications provenance, and show that a profitable campaign is paused when trust or safety thresholds are violated.

# 13H. Business Continuity and Platform-Risk System

Purpose. Ensure that ventures can survive supplier failure, marketplace suspension, payment interruption, provider changes, account loss, traffic shocks, data loss, or other external dependency failures.

## Dependency and Concentration Mapping

- Maintain an inventory of marketplaces, social platforms, payment processors, banks, suppliers, manufacturers, logistics providers, cloud services, models, domains, communication channels, and critical contractors.
- Record ownership, credentials, contracts, data portability, switching cost, concentration, service limits, failure history, recovery objectives, alternative providers, and exit procedures.
- Continuously score single points of failure and correlated dependencies across ventures.

## Continuity Planning and Recovery

- Maintain tested exports, backups, alternate channels, supplier substitutions, account-recovery procedures, customer-communication plans, degraded modes, emergency budgets, and shutdown/migration runbooks.
- Run scheduled continuity exercises for account suspension, payment outage, supplier failure, viral demand spike, model/provider loss, data corruption, and credential compromise.
- Do not represent redundancy as proven until restoration, failover, or migration has been exercised with current systems and evidence.

## Acceptance Gate

- Successfully execute representative continuity exercises, recover critical records, switch or degrade a dependency without uncontrolled customer harm, prove emergency authority boundaries, and update plans from observed failures.

# 13I. External Expert Escalation Network

Purpose. Connect Dev HQ to qualified human judgment when legal, tax, accounting, security, medical, regulatory, manufacturing, employment, or other domain decisions exceed model authority or internal competence.

## Expert Registry and Engagement

- Maintain verified expertise, jurisdiction, credentials where applicable, conflicts, engagement terms, confidentiality, availability, cost, authorized scope, and prior outcomes.
- Select experts based on the exact question, jurisdiction, independence, urgency, and evidence—not reputation alone.
- Prepare a concise escalation packet containing facts, sources, uncertainty, alternatives, decisions required, deadlines, affected systems, and requested deliverable.

## Advice Integration and Governance

- Record expert advice, assumptions, limitations, conflicts, approval status, implementation implications, and expiration or review conditions.
- Distinguish advice, formal opinion, approval, audit result, and Founder risk acceptance; none silently changes policy or workflow state.
- Measure whether escalations were timely, useful, correctly scoped, and cost-effective while preserving professional independence.

## Acceptance Gate

- Complete at least one representative expert escalation from detection through scoped engagement, advice capture, authorized decision, implementation follow-up, and closure while proving confidentiality, budget, conflict, and authority controls.

# 13J. Business Simulation and Safe-Action Sandbox

Purpose. Rehearse material commercial and operational decisions in a controlled environment to expose failure modes before public, financial, contractual, customer-facing, or irreversible execution. Simulation informs decisions; it does not create real-world proof.

## Simulation Environment and Models

- Model pricing changes, advertising campaigns, launches, demand spikes, refund waves, supplier failures, account suspensions, cost increases, cash shortages, staffing constraints, incidents, and shutdowns using explicit assumptions and scenario ranges.
- Use isolated test accounts, synthetic or properly anonymized data, capped budgets, mock integrations, reversible environments, and no unauthorized public communication or financial movement.
- Compare base, upside, downside, adversarial, and stress scenarios and identify sensitivity to uncertain assumptions.

## Promotion to Real Action

- Require a simulation record containing inputs, model/version, assumptions, omitted factors, outputs, confidence, failure modes, mitigations, reviewer findings, and exact authority needed for execution.
- Never use simulation alone as proof of customer demand, legal compliance, profitability, safety, or operational readiness.
- After real execution, compare actual outcomes with predictions and recalibrate or retire misleading models.

## Acceptance Gate

- Run representative financial, growth, continuity, and customer-impact scenarios; surface at least one material failure mode before execution; prove sandbox isolation and authority boundaries; and demonstrate post-action calibration against real results.

| **PHASE 2.6 COMPLETION PROMISE** <br> Dev HQ continuously learns from real customers, acquires demand through governed channels, protects cash and reserves, preserves trust and brand safety, survives critical dependency failures, escalates material judgment to qualified experts, and rehearses high-impact actions before execution. These systems prepare HQ for supervised business operation without granting unrestricted commercial, financial, legal, or public authority. |
|---|

# 14. Phase 3 — Reference Product Demonstration and Venture Launch

Dev HQ uses Viybd as its flagship reference implementation and portfolio showcase. The objective is to prove, with a polished deployed product and complete evidence, that HQ can translate a product concept into research, architecture, design, implementation, independent review, testing, release, observability, documentation, and measured improvement. Viybd is not required to become the organization's primary commercial business. Once the reference-product gate passes, the same reusable delivery system is applied to validated ventures selected through the commercial discovery and validation phases.

## Founder role

- Set the reference-product vision, demonstration scope, portfolio priorities, and venture strategy.
- Approve major architecture, policy, budget, security, privacy, compliance, production, branding, and release decisions.
- Review milestone evidence, portfolio quality, operational health, and strategic tradeoffs rather than coordinating individual agents.

## Dev HQ role

- Translate the reference-product goal and validated venture goals into roadmaps, research, architecture, experiments, engineering plans, estimates, and delivery confidence.
- Route product, design, frontend, backend, AI, data, infrastructure, QA, security, documentation, and operations work.
- Implement, review, test, verify, integrate, deploy, observe, recover, document, and improve the reference product and authorized ventures.
- Produce a reproducible case study showing decisions, architecture, evidence, quality, cost, timing, failures, recoveries, and lessons that can accelerate later products.

## Reference-product delivery streams

- Portfolio-quality Viybd experience with a clear product narrative, premium design, responsive behavior, and demonstrable user value.
- Viybd AI features with server-side model integration, evaluation, safety, observability, and explainable product behavior.
- Authentication, user data, storage, permissions, accounts, and only the billing or subscription capabilities needed to demonstrate production readiness.
- Design system, mobile experience, accessibility, analytics, deployment, observability, support readiness, infrastructure, security, privacy, and release management.
- Reference Product Evidence Pack: architecture record, ADRs, automated tests, independent reviews, deployment proof, runbooks, screenshots, performance evidence, security/accessibility results, and a public portfolio case study.
- Reusable Product Launch Pack: templates, modules, workflows, acceptance gates, and lessons that can be applied to later SaaS, game, media, automation, or commerce ventures.

## Business Outcome Intelligence

| **Stage** | **Required record** |
|---|---|
| Business objective | Strategic goal, customer problem, target segment, desired outcome, owner, and time horizon. |
| Product hypothesis | Expected behavior change, assumptions, risks, and falsifiable prediction. |
| Engineering work | Milestones, work items, architecture, cost, dependencies, release plan, and quality gates. |
| Measurement plan | Metrics, instrumentation, baseline, guardrails, experiment design, and decision threshold. |
| Outcome | Adoption, engagement, retention, conversion, revenue, cost, support, quality, or operational impact. |
| Decision | Continue, expand, revise, rollback, retire, or research further, with evidence and authority. |

# 14A. Autonomous Business Operations

Purpose. Extend Dev HQ from building and operating software into founder-supervised operation of validated software ventures. This capability begins with one narrow venture and expands only after evidence proves reliable customer, financial, compliance, and operational control.

## Commercial Operating Functions

- Product and engineering: roadmap, experiments, delivery, reliability, security, privacy, accessibility, deployment, observability, support tooling, and continuous improvement.
- Growth and marketing: approved positioning, campaigns, content, search, partnerships, lifecycle messaging, attribution, experimentation, claims review, spend limits, and channel policy.
- Sales and customer success: lead qualification, CRM, demonstrations, proposals, onboarding, account health, renewals, churn prevention, escalation, and documented customer commitments.
- Customer support: intake, classification, knowledge-grounded responses, service levels, refunds within policy, incident communication, abuse handling, and human escalation.
- Revenue operations: pricing experiments within authority, checkout, subscriptions, invoices, collections, refunds, disputes, revenue recognition interfaces, tax/accounting exports, and reconciliation.
- Vendor and platform operations: accounts, contracts, service dependencies, rate limits, costs, renewals, credentials, continuity plans, and replacement risk.

## Commercial Authority and Safety

- Maintain explicit authority for public statements, customer promises, contract terms, pricing ranges, discounts, refunds, ad spend, vendor spend, data access, account changes, and payment actions.
- Use dual control or designated approval for material transfers, new payment destinations, contractual commitments, legal notices, data incidents, mass communications, and irreversible account actions.
- Never impersonate the Founder or a human employee without approved identity and disclosure policy; preserve communication provenance and customer-visible accountability.
- Route legal, tax, accounting, employment, regulated-industry, security, privacy, and material financial judgments to qualified professionals or the Founder as policy requires.

## Business Operations Command Center

- Display pipeline, acquisition, activation, engagement, retention, churn, revenue, gross margin, cash usage, support load, reliability, compliance, customer commitments, experiments, incidents, and pending Founder decisions.
- Trace every recommendation to source data, assumptions, confidence, model/provider, policy, and alternative considered.
- Provide pause, spending freeze, communication freeze, credential revoke, rollback, incident mode, and venture shutdown controls.

## Progressive Autonomy

- Stage 1 — Assist: HQ prepares research, campaigns, responses, reports, and operating plans; humans execute external actions.
- Stage 2 — Execute with approval: HQ performs bounded external actions after item-level approval.
- Stage 3 — Policy-bounded operation: HQ performs routine approved actions and escalates exceptions.
- Stage 4 — Multi-function autonomy: HQ coordinates product, growth, support, and revenue operations with continuous audit and designated human oversight.

## Acceptance Gate

Operate one validated venture through a sustained supervised period with reconciled customer, product, financial, compliance, and operational records; demonstrate controlled communications, accurate billing and refunds, incident handling, customer escalation, policy enforcement, evidence-backed decisions, and safe pause or shutdown.

# 14B. Venture Portfolio Manager and Capital Allocation

Purpose. Manage multiple experiments and ventures as a constrained portfolio rather than maximizing the number of active projects. The system allocates compute, models, workers, cash budgets, advertising spend, and Founder attention according to evidence, strategic fit, risk, and capacity.

## Portfolio Records and Comparison

- Maintain venture thesis, stage, owner, target segment, evidence quality, economics, cash usage, runway, opportunity cost, compliance posture, operational health, strategic fit, dependencies, and next decision gate.
- Normalize comparisons without hiding uncertainty or forcing unlike ventures into one misleading score.
- Track shared infrastructure, cross-venture dependencies, reusable assets, correlated risks, concentration, cannibalization, and brand spillover.

## Capital and Capacity Allocation

- Recommend experiment budgets, compute/token budgets, staffing, marketing spend, infrastructure, and Founder-review capacity.
- Use staged funding: discovery, validation, limited build, launch, growth, maintenance, harvest, pause, or shutdown.
- Enforce global and venture-level ceilings, reserve capacity for incidents and core HQ work, and prevent one venture from exhausting the organization.
- Automatic reinvestment is permitted only under explicit policy, verified cash availability, accounting controls, and Founder-approved limits.

## Portfolio Decisions

- Recommend CONTINUE, INCREASE, HOLD, REDUCE, PIVOT, PAUSE, SELL/TRANSFER, or SHUT DOWN with evidence, alternatives, expected value, downside, reversibility, and required authority.
- Do not continue a weak venture merely because prior resources were spent; track sunk-cost bias and escalation of commitment.
- Preserve a small controlled exploration budget so early rankings do not permanently lock the organization into familiar markets.

## Acceptance Gate

Demonstrate disciplined management of multiple concurrent ventures or simulations, including constrained resource allocation, one stopped initiative, one expanded initiative, accurate portfolio reporting, correlated-risk detection, and Founder-controlled material capital decisions.

| PHASE 3 COMMERCIAL COMPLETION PROMISE<br>Dev HQ can discover, validate, build, launch, and operate approved software ventures under bounded authority, while maintaining compliance evidence, customer and financial controls, safe escalation, and portfolio discipline. Profitability remains an empirical outcome rather than a guaranteed system claim. |
|---|

# 15. Phase 4 — Enterprise AI Engineering Platform

## 4A — Multi-Organization and Enterprise Tenancy

Organizations, departments, teams, projects, repositories, environments, policies, budgets, standards, memory, and AI teams with strict isolation.

## 4B — Workflow Marketplace and Extensibility

Trusted installation of versioned workflows, agent packs, review packs, quality gates, templates, integrations, and domain solutions.

## 4C — Enterprise Governance and Compliance

Delegated administration, policy inheritance, exceptions, approvals, compliance mappings, legal holds, retention, and data residency.

## 4D — Human-AI Engineering Workspaces

Collaborative planning, reviews, discussion, pair engineering, knowledge sharing, and mixed human-agent delivery.

## 4E — Platform Economics and Operations

Usage metering, budgets, quotas, cost allocation, service tiers, platform SLOs, tenant operations, billing, and support.

## 4F — Enterprise Integration Fabric

Identity providers, source control, issue tracking, CI/CD, cloud, observability, security, data, and communication tools.

## 4G — Domain Workflow Ecosystem

Installable workflows for SaaS, mobile, games, AI, data, infrastructure, open source, regulated systems, and other domains.

## 4H — Organization Intelligence

Portfolio, workforce, model, quality, architecture, cost, risk, and business intelligence across the enterprise.

| **PHASE 4 COMPLETION PROMISE** <br> Dev HQ is a world-class enterprise AI engineering platform supporting multiple organizations, human and agent teams, installable workflows, strong governance, model lifecycle management, measurable outcomes, and secure integration with the broader software-delivery ecosystem. |
|---|

# 16. Cross-Cutting Platform Capabilities

| **Capability** | **What it does** |
|---|---|
| Context Router | Assembles minimum complete context with provenance and least privilege. |
| Context Lifecycle Manager | Scores health, checkpoints, compacts, rolls sessions, restores, verifies, and recovers. |
| Smart Work Packets | Creates complete role-specific work orders with history, risks, and reviewer focus. |
| Repository Intelligence | Maintains architecture, dependency, ownership, test, API, data, and risk models. |
| Verification-First Completion | Requires acceptance criteria, tests, reviews, evidence, approvals, and candidate identity. |
| Automatic Failure Classification | Applies category-specific recovery instead of blind retries. |
| Agent Capability Registry | Tracks capability, quality, cost, speed, reliability, context efficiency, and domain performance. |
| Adaptive Orchestration | Selects the lightest safe workflow, collaboration mode, review depth, and authority path. |
| Company Knowledge Platform | Stores and serves governed institutional knowledge through structured services and Obsidian. |
| Knowledge Curator | Validates, reconciles, links, supersedes, archives, and measures organizational knowledge. |
| Model Management Platform | Benchmarks, routes, upgrades, rolls back, and governs models and providers. |
| Engineering Intelligence | Measures flow, quality, architecture, context, reviews, models, cost, risk, and outcomes. |
| Agent Memory and Organizational Learning | Records evidence-backed agent and team experience, applies freshness and scope, and improves routing, team formation, packets, reviews, and learning proposals. |
| Review Learning | Improves review routing, packets, tests, and policies from validated outcomes. |
| Continuous Architecture | Detects drift, debt, coupling, boundary violations, and structural risk. |
| Governance, Security, Trust | Provides authority, policy, secret brokering, provenance, budget control, and audit. |
| Environment and Deployment | Standardizes environments, infrastructure, migration, promotion, rollback, and observability. |
| Business Outcome Intelligence | Connects engineering work to customer, product, operational, and economic outcomes. |
| Workflow Marketplace | Distributes trusted reusable engineering capabilities. |
| Multi-Organization Platform | Provides isolated organizations, teams, policies, budgets, memory, and workspaces. |
| Adaptive Organization Engine | Decomposes large work, forms temporary teams, scales workers, governs communication, and retires organizations. |
| Review Packet Generator | Creates coherent subsystem or specialist review assignments tied to one candidate. |
| Lead Reconciliation | Combines distributed findings into one evidence-backed decision with cross-packet analysis. |
| Integration Manager | Converges parallel implementation into one verified candidate through explicit interfaces and deterministic integration. |
| Parallelization Optimizer | Balances wall-clock speed, quality, token cost, coordination overhead, capacity, and diminishing returns. |
| Commercial Legal and Compliance Platform | Maps jurisdictions and obligations into versioned compliance packs, tests, release evidence, change monitoring, specialist review, and escalation. |
| Venture Discovery and Validation | Continuously discovers opportunities, ranks them with uncertainty, runs cheap ethical demand tests, and recommends kill, pivot, limited build, or launch. |
| Opportunity Registry | Stores sourced market facts, customer evidence, assumptions, scores, experiments, alternatives, confidence, and decision history. |
| Validation Experiment Engine | Defines falsifiable commercial hypotheses, controlled tests, budgets, guardrails, stop conditions, evidence, and decision thresholds. |
| Autonomous Business Operations | Coordinates approved product, growth, sales, support, billing, vendor, compliance, and customer-success workflows. |
| Venture Portfolio Manager | Allocates constrained capital, compute, workers, and Founder attention across ventures while tracking risk, economics, and opportunity cost. |
| Customer Reality System | Turns authorized support, sales, usage, review, refund, complaint, and churn evidence into traceable product and venture decisions. |
| Growth and Distribution Operating System | Runs governed acquisition channels, campaigns, attribution, conversion experiments, and channel learning under claims, spend, and contact controls. |
| Financial and Treasury Control System | Reconciles cash, revenue, obligations, reserves, taxes, spend, margins, and authority while preventing autonomous overextension. |
| Trust, Reputation, and Brand Safety System | Reviews public content and operations for customer harm, misleading claims, unsafe output, policy risk, and long-term reputation impact. |
| Business Continuity and Platform-Risk System | Maps external dependencies, concentration, failover, portability, recovery, and migration plans across ventures. |
| External Expert Escalation Network | Routes questions beyond AI authority to verified qualified experts through scoped, recorded, budgeted engagements. |
| Business Simulation and Safe-Action Sandbox | Rehearses high-impact commercial decisions in isolated scenarios and calibrates predictions against real outcomes. |

# 17. Governance, Security, Secrets, Trust, and Provenance

## Fine-grained authority

- Separate read, edit, test, research, review, commit, merge, deploy, credential, approval, policy-change, model-promotion, and marketplace-install authority.
- Grant minimum scope for a specific work item, repository, environment, organization, duration, and purpose.
- Prevent actors and packages from expanding their own authority.

## Policy engine

- Express review requirements, gates, budgets, model/provider rules, credentials, environment promotion, data access, retention, and reserved approvals as versioned policy.
- Record policy version, inputs, decision, explanation, and override authority for every material transition.

## Secret and credential broker

- Provide short-lived, narrowly scoped credentials or references rather than permanent raw secrets.
- Prevent secrets from entering prompts, knowledge, logs, artifacts, checkpoints, screenshots, or analytics unless explicitly required and protected.
- Support rotation, revocation, environment separation, emergency disablement, and break-glass procedures.

## Full provenance

- Every artifact and decision identifies creator, model/provider/version, prompt, tools, context, repository candidate, policy, evidence, reviews, approvals, authority, changes, and supersession.

# 18. Environment, Deployment, Infrastructure, and Operations

## Environment model

- Local, test, preview, QA, staging, production, feature, and temporary research environments where applicable.
- Environment-specific configuration outside source code and controlled promotion of identifiable artifacts.

## Infrastructure management

- Desired-state definitions, drift detection, approvals, state history, dependency graphs, capacity, cost, and disaster recovery.
- Infrastructure changes follow the same work, review, evidence, and rollback model as application changes.

## Database and migration safety

- Forward/backward compatibility, rehearsal, observability, failure handling, rollback or roll-forward, and data validation.

## Deployment readiness

- Artifact identity, gates, configuration, secrets, dependencies, capacity, migrations, health checks, observability, release notes, runbooks, and rollback evidence.

## Operational feedback

- Incidents become durable work with evidence, classification, timeline, impact, recovery, and post-incident learning.
- Production evidence may challenge planning or review assumptions and trigger knowledge, architecture, routing, model, or policy proposals.

# 19. Agent Organization, Routing, and Collaboration

| **Role** | **Primary authority** | **Must not substitute for** |
|---|---|---|
| Executive / Project Orchestrator | Classify, plan, route, sequence, monitor, choose workflow/collaboration, forecast, accept within authority, communicate. | Implementation approval where independence is required or source-of-truth ownership. |
| design-engineer / Design Agent | UX strategy, flows, information architecture, accessibility, visual design. | Backend implementation or architecture approval. |
| lead-software-engineer | Implementation ownership, tests, documentation, and revision work. | Independent approval of its own work. |
| independent-code-reviewer | Correctness, regressions, maintainability, tests, edge cases, scope. | Implementation ownership or final architecture authority. |
| architecture-reviewer | ADR compliance, boundaries, concurrency, replay, recovery, persistence, coupling, architecture gate. | Implementation or Founder approval. |
| Knowledge Curator | Validate, organize, link, supersede, archive, and measure institutional knowledge. | Repository truth, policy authority, or automatic organization-wide doctrine. |
| research agent | Source-grounded research, alternatives, tradeoffs, experiments, ADR proposals. | Final architecture or business decision. |
| specialist reviewers | Security, accessibility, performance, privacy, data, deployment, documentation, model, domain lenses. | Core correctness and architecture unless policy allows. |
| human engineer / reviewer | Authorized implementation, review, decision, or operations. | Automatic exemption from evidence and authority rules. |
| team lead / integration owner | Own packet graph, interfaces, coordination, convergence, end-to-end proof, and organization closeout. | Independent approval when the lead implemented the candidate. |
| lead reviewer / chief reviewer | Define review coverage, coordinate packet reviewers, reconcile findings, inspect cross-packet risk, and issue final recommendation. | Implementation ownership or automatic Founder-level approval. |
| temporary specialist worker | Execute one bounded packet and return standardized evidence, findings, risks, and dependencies. | Scope expansion, unlogged decisions, or final candidate approval. |
| compliance-research agent | Monitor authoritative legal/regulatory sources, map changes, maintain citations, and create obligation-change proposals. | Qualified legal judgment, final applicability decisions, or Founder risk acceptance. |
| accessibility / privacy specialist reviewer | Inspect candidate-specific accessibility, tracking, consent, privacy, and data behavior and require evidence-backed remediation. | Universal legal certification or core correctness/architecture review. |
| venture-research lead | Form market-research teams, maintain opportunity evidence, compare alternatives, and design validation programs. | Claiming demand, profit, or market leadership without real evidence. |
| validation experiment owner | Run one approved commercial experiment within message, identity, channel, data, budget, and stop-condition limits. | Expanding public, spending, customer, or legal authority. |
| business-operations lead | Coordinate product, growth, sales, support, billing, vendor, compliance, and reporting workflows for one venture. | Material strategy, capital allocation, legal acceptance, or independent review. |
| portfolio manager agent | Compare ventures, model constrained allocation, detect concentration and opportunity cost, and recommend stage changes. | Transfer of funds, investment authority, debt/equity decisions, or Founder portfolio approval. |
| customer-insights lead | Govern customer-evidence intake, segmentation, insight synthesis, contradiction handling, and decision traceability. | Treat anecdotes or model inference as representative customer truth. |
| growth-operations lead | Coordinate approved acquisition channels, campaigns, attribution, creative testing, and channel economics. | Exceed claims, contact, platform, identity, or spending authority. |
| financial-controller agent | Reconcile operational financial records, monitor reserves and budgets, detect anomalies, and prepare reports. | Make tax, accounting-policy, transfer, debt, investment, or capital decisions. |
| brand-safety reviewer | Independently review public content, claims, audience safety, partner conduct, and reputation risk. | Replace legal review, product correctness review, or Founder brand authority. |
| continuity and platform-risk lead | Maintain dependency maps, continuity plans, recovery exercises, alternate providers, and concentration reporting. | Accept material single-point-of-failure risk or change contracts without authority. |
| expert-escalation coordinator | Select qualified experts, prepare evidence packets, manage scope/conflicts/budget, and record advice. | Provide the expert judgment itself or silently convert advice into policy. |
| simulation and stress-test lead | Build isolated scenarios, document assumptions, run stress tests, and compare predictions with actual outcomes. | Treat simulated outcomes as real demand, compliance, safety, or profitability proof. |

## Role Assignment and Model Promotion

Every role above is a **capability contract**, not a product name. A contract states the role's
required inputs, required outputs, authority, exclusions, and the evaluation set that
determines whether a candidate can hold it. Nothing in this roadmap binds a role to a vendor,
a model family, or a specific coding agent.

**Any model or agent may hold any role** for which it satisfies the contract and passes that
role's evaluation set. Assignments are recorded, versioned, and dated, so that the occupant of
a role on any past candidate is recoverable. Changing an assignment is a configuration change,
not a roadmap change.

**Promotion and demotion are decided by measured evidence**, not preference, familiarity, or
vendor relationship. Each role maintains a fixed evaluation set of representative tasks with
known-good outcomes. Candidates are scored on the dimensions that role actually needs —
correctness, rework rate, escaped-defect rate, cost, latency, context efficiency, instruction
adherence, and calibration of stated confidence. The highest-scoring candidate holds the role
until another demonstrably beats it on the same set. A model may hold several roles, or none.

**Independence survives reassignment.** Separation of duties is a property of the *instance and
its context*, never of the vendor. Even where one model is strongest at both implementation and
review, the instance that produced a candidate may not review that candidate. Independent
review requires a separate instance that did not participate in producing the work and does not
inherit its context. If a single model ever holds both roles, independence must be enforced by
isolating context and history — otherwise the review is self-approval wearing a second name.

**Evaluation sets are versioned and quarantined.** When a role's evaluation set changes, prior
scores are not comparable and the role's ranking must be re-derived. Evaluation tasks must not
leak into the working corpus agents can learn from, or the set stops measuring capability and
starts measuring exposure.

# 20. Autonomous Operating Lifecycle

1. Founder or authorized leader provides a high-level goal.
2. Evaluate intent, ambiguity, complexity, risk, authority, policy, budget, and required approvals.
3. Assemble current roadmap, progress, ADRs, repository intelligence, relevant institutional knowledge, policies, evidence, and business objective.
4. Perform research when uncertainty, novelty, or material architecture decisions justify it.
5. Create context, provider/model, cache, checkpoint, and rollover plans.
6. Propose milestone and architecture plans for approval where required.
7. Create work items, dependencies, acceptance criteria, review plans, Smart Work Packets, and measurement plans.
8. Select agents, humans, models, tools, budgets, and collaboration modes using the lightest safe workflow.

When decomposition is justified, create a temporary organization, packet graph, interfaces, lead, integration owner, communication plan, concurrency limit, and dissolution criteria.

1. Execute while recording events, evidence, decisions, artifacts, cost, model identity, and context state.
2. Checkpoint, compact, continue, or roll sessions at thresholds and natural boundaries.
3. Required reviewers inspect a named stable candidate and return standardized findings with remediation guidance.

For decomposed reviews, packet reviewers inspect bounded scope in parallel and a designated lead reviewer reconciles coverage, conflicts, cross-packet risks, and final recommendation.

1. Route findings directly to implementation; revise, test, and re-review until approval, bounded escalation, or rejection.
2. Successor sessions verify restoration before mutable work resumes.
3. Verification and quality gates prove completion.
4. Automatically accept and advance only within delegated authority; route reserved decisions to the Founder.
5. Commit, merge, migrate, deploy, observe, and roll back through governed delivery systems.
6. Update approved documentation, knowledge proposals, performance data, review learning, architecture health, and model outcomes.
7. Measure product/business outcomes where applicable.
8. Begin the next dependency-satisfied roadmap work automatically within authority.

20. Continuously ingest authorized customer, growth, financial, trust, platform-dependency, and operational evidence; challenge active assumptions and create governed proposals when reality diverges from plans.

21. Before material commercial action, verify cash and reserve constraints, brand and compliance controls, platform dependencies, expert-escalation requirements, and whether a safe simulation is warranted.

22. Execute bounded growth, customer, financial, continuity, and business operations only within explicit authority; reconcile outcomes and trigger pause, freeze, failover, or escalation when thresholds are crossed.

23. Compare actual outcomes with forecasts and simulations, update confidence and models, preserve failed assumptions, and route validated learning into the Knowledge Platform without overriding current evidence.

# 21. Metrics, Health Scores, and Progressive Founder Experience

## Core KPIs

- Lead time, cycle time, throughput, queue time, active time, review latency, deployment frequency, and change failure rate.
- First-pass approval, revision count, escaped defects, false positives, defect yield, regression rate, and review ROI.
- Retry rate, reconciliation rate, interruption recovery, duplicate convergence, escalation frequency, and failure categories.
- Agent/model success, tool reliability, routing regret, collaboration value, and utilization.
- Agent-memory precision, expertise-confidence calibration, freshness/decay accuracy, memory-informed routing lift, pairing value, challenge/correction rate, and harmful-memory incidents.
- Parallelization speedup, coordination overhead, duplicated work, merge conflict rate, packet failure rate, reconciliation latency, integration rework, and quality-adjusted team value.
- Token use, context efficiency, missing/unused context, cache effectiveness, rollover success, and restoration success.
- Knowledge retrieval precision, stale-note rate, contradiction rate, documentation freshness, and knowledge effectiveness.
- Cost by organization, project, feature, work item, model, provider, workflow, outcome, and quality-adjusted value.
- Founder intervention rate, automation percentage, approval latency, and reserved-decision frequency.
- Opportunity quality, validation cost, time to disconfirm, paid-signal rate, pre-sale conversion, experiment integrity, false-positive opportunity rate, and build-before-validation regret.
- Acquisition cost, activation, retention, churn, expansion, revenue, gross margin, support burden, refund/dispute rate, cash usage, runway, and unit-economics confidence.
- Compliance coverage, obligation freshness, accessibility defect rate, tracker-inventory drift, consent failures, privacy-request performance, unresolved legal questions, and harmful-compliance incidents.
- Portfolio concentration, exploration allocation, capital efficiency, venture shutdown latency, reinvestment accuracy, correlated risk, and Founder attention load.
- Customer-evidence coverage, segment representativeness, insight-to-decision rate, unresolved contradiction rate, churn-cause confidence, support-to-product feedback latency, and harmful-insight incidents.
- Channel acquisition cost, incrementality, qualified conversion, activation, retention by source, creative fatigue, attribution uncertainty, contact complaint rate, and channel concentration.
- Reconciliation accuracy, available cash, reserve coverage, runway, tax/refund liability coverage, spend variance, payment anomalies, margin confidence, and unauthorized-financial-action attempts.
- Trust and brand health, misleading-content blocks, customer-harm events, review authenticity, platform strikes, complaint-resolution time, partner incidents, and reputation recovery.
- Critical dependency concentration, failover readiness, backup freshness, recovery time, recovery point, portability proof, continuity exercise success, and platform-loss exposure.
- Expert escalation accuracy, time to qualified judgment, cost, conflict rate, advice adoption, expired-advice exposure, and expert-outcome usefulness.
- Simulation coverage, assumption sensitivity, sandbox containment, forecast error, material failure modes discovered before action, and post-action calibration.
- Architecture drift, debt trend, dependency health, boundary violations, and remediation velocity.

| **Score** | **Inputs** | **Use** |
|---|---|---|
| Organization Health | Quality, reliability, flow, architecture, context, security, operations, cost, knowledge, collaboration. | Executive visibility and prioritization; never replaces evidence. |
| Autonomous Readiness | Manual interventions, routing accuracy, recovery, reviews, context continuity, governance, consecutive milestones. | Determines whether greater autonomy may be proposed. |
| Architecture Health | Boundary integrity, coupling, cycles, growth, debt, ADR compliance, change risk. | Triggers architecture attention and remediation proposals. |
| Release Confidence | Candidate evidence, reviews, tests, deployment readiness, rollback, observability, unresolved risk. | Supports release decisions. |
| Context Health | Capacity, relevance, duplication, staleness, contradictions, unresolved work, remaining effort. | Drives checkpoint, compaction, and rollover. |
| Knowledge Health | Freshness, provenance, contradiction, duplication, usage, confidence, supersession, outcome impact. | Drives curation, review, archival, and retrieval tuning. |
| Commercial Readiness | Customer truth, distribution, cash control, trust, continuity, expert access, simulation quality, compliance, and operational evidence. | Determines whether broader supervised business authority may be proposed; never guarantees profitability. |
| Platform Resilience | Dependency concentration, portability, backups, failover, recovery objectives, exercise results, and correlated external risk. | Drives continuity investment, channel/supplier diversification, and emergency planning. |

# 22. Acceleration Strategy and Prohibited Shortcuts

## Acceleration Without Quality Loss

- Parallelize independent workstreams with explicit interfaces, ownership, dependencies, and integration gates.
- Use temporary organizations only when predicted and measured quality-adjusted value exceeds coordination and synthesis overhead.
- Adopt each stable HQ capability as soon as it can safely accelerate the next capability.
- Automate tests, evidence collection, reviews, static analysis, security checks, context management, documentation, deployment checks, and routine gates.
- Deliver minimum complete capabilities first and deepen them without violating architecture.
- Reuse frameworks, workflow packs, templates, platform services, cached stable context, and validated knowledge.
- Measure bottlenecks, review cycles, failure causes, model performance, context efficiency, knowledge effectiveness, cost, quality, and business impact.

## Prohibited Shortcuts

- Skipping or weakening Sprint 1E reliability requirements.
- Starting autonomous self-improvement before Phase 1 continuity, restoration, review, and recovery gates pass.
- Treating context management as token counting or one endless conversation.
- Allowing completion claims to replace tests, evidence, review, or candidate identity.
- Overcomplicating small tasks with unnecessary agents, reviews, or artifacts.
- Splitting work by file count without respecting subsystem cohesion, interfaces, dependencies, or integration ownership.
- Treating packet completion or packet approval as automatic approval of the whole candidate.
- Allowing direct agent communication to create unrecorded scope, architecture, authority, or candidate changes.
- Maximizing worker count without cost, capacity, diminishing-return, or integration analysis.
- Hardcoding provider, project, tenant, or quality behavior into generic orchestration.
- Allowing ungoverned collaboration, unrestricted credentials, hidden manual steps, or untracked decisions.
- Sending entire repositories or histories when targeted context is sufficient.
- Allowing restored sessions to modify code before verification.
- Letting Obsidian notes, memory, analytics, scores, or recommendations override repository truth, ADRs, policy, or authorized decisions.
- Publishing unvalidated chat summaries as institutional knowledge.
- Treating agent reputation, remembered success, or collaboration history as authority, current proof, or a substitute for independent candidate-specific review.
- Weakening mandatory review because an agent or model performed well historically.
- Sacrificing maintainability, accessibility, security, privacy, deployment safety, observability, or supportability for schedule targets.
- Calling market research, model confidence, waitlist signups, or traffic proof of willingness to pay when stronger evidence is feasible.
- Building a full product before a proportionate validation test unless the Founder explicitly accepts the cost and strategic reason.
- Claiming guaranteed profitability, guaranteed compliance, or absolute highest-profit opportunity.
- Using deceptive experiments, fake customers, fabricated reviews, unsupported marketing claims, dark patterns, unauthorized scraping, spam, or undisclosed impersonation.
- Launching into a jurisdiction or regulated activity without an applicability profile, required compliance packs, evidence, and designated approval.
- Treating automated accessibility, privacy, cookie, security, or legal checks as a substitute for required manual specialist or qualified professional review.
- Allowing autonomous commercial agents to exceed approved pricing, spending, refund, communication, contract, payment, brand, or customer-commitment authority.
- Reinvesting revenue, moving funds, opening financial accounts, taking debt/equity, or acquiring businesses without explicit policy and Founder authority.
- Treating views, followers, clicks, signups, positive comments, or model sentiment as customer value without appropriate activation, retention, payment, margin, or outcome evidence.
- Launching a product and postponing distribution strategy, channel economics, customer support, or retention measurement until after the build.
- Spending forecast revenue, tax reserves, refund reserves, incident reserves, or unreconciled funds; allowing one agent to change payment destinations or approve its own material transfer.
- Scaling content, listings, ads, outreach, or children-directed media without brand-safety, audience, claims, intellectual-property, platform-policy, and human-escalation controls.
- Depending materially on one platform, supplier, payment processor, provider, account, domain, or logistics path without a documented and tested continuity decision.
- Using an AI model as a substitute for required legal, tax, accounting, medical, security, or regulated-domain professional judgment.
- Treating simulations as proof, hiding assumptions or omitted variables, or promoting a sandbox result to real execution without the required candidate, evidence, review, and authority.
- Running more ventures than the organization can safely support, or allowing speculative experiments to starve core HQ reliability, reference-product obligations, or approved operating ventures.

# 23. Prompt Generation and Agent Instruction Standard

## VIYBD HQ — BINDING OPERATING KERNEL

Best correct path, executed as fast as safely possible.

One exact next action.

Smallest safe number of agents.

Parallel work when independence allows it.

No redundant verification, reconstruction, prompts, or handoffs.

No extra steps unless they materially reduce risk or prevent rework.

I make routine coordination decisions instead of making you sort them out.

**READ THIS ENTIRE BLOCK BEFORE EVERY VIYBD HQ RESPONSE. CHECK EVERY PROMPT AND ACTION AGAINST IT BEFORE SENDING. THESE RULES ARE MANDATORY.**

## 1. Optimize the Work

Be direct and honest. Choose the most effective and efficient path that produces correct, secure, maintainable, verified work.

Do not add agents, research, planning, reviews, documentation, or workflow stages unless they materially improve the result, reduce meaningful risk, or prevent likely rework.

Use the smallest safe active organization. Avoid scope collisions, reviewer contamination, integration ambiguity, wasted tokens, and unnecessary coordination.

## 2. Direct the Founder

Make routine coordination decisions for me. Escalate only genuine Founder-reserved choices involving strategy, risk acceptance, material scope, architecture, credentials, spending, production, policy, or commercial authority.

Give one exact next action unless a real Founder decision is required.

For every action, state:

exact destination tab, agent, session, or terminal;

exact paste label;

exact material to include;

exact paste order;

complete copy-and-paste prompt.

When transferring a report, identify the exact numbered sections required. Never make me reconstruct context.

## 3. Use the Shortest Complete Prompt

Classify work as tiny, small, medium, large, or critical. Match prompt length, evidence, testing, negative controls, and reviewer involvement to actual risk.

Every actionable prompt must still include:

active role and excluded roles;

objective and success condition;

current verified repository or candidate identity when relevant;

authorized and excluded scope;

explicit prohibitions;

acceptance and validation requirements;

required return structure;

exact stop condition;

next review or reconciliation path.

Remove stale history, resolved findings, superseded identities, irrelevant restrictions, and repetition. Preserve complete hashes, branches, paths, tags, run IDs, ADRs, active findings, blockers, and constraints when relevant.

## 4. Preserve Roles and Authority

Keep implementation, independent code review, architecture review, read-only audits, research, specialist review, and Founder authority separate. These are **roles, not tools.** Which model or agent currently holds each role is an assignment recorded under Section 19, and it changes when the evidence changes. Separation of roles is permanent; the occupant of a role is not.

Independent reviewers and auditors must derive conclusions from repository evidence. They must not edit, remediate, approve their own work, commit, push, deploy, or advance the package.

The Main Coordinator must receive reports, reconcile disagreements, preserve candidate identity, record dispositions, and route the next authorized step.

Advisory work and reviews authorize nothing unless explicit authority has been granted.

## 5. Continuous Remediation

Any write-authorized agent must fix every safe, relevant issue discovered within the active objective, including new issues revealed during remediation.

It must not stop merely to report an issue it is authorized and able to fix.

After each remediation batch, it must:

Reinspect the changed and affected areas.

Run targeted tests, regressions, and applicable negative controls.

Fix every failure or newly discovered in-scope issue.

Repeat until the affected scope passes.

Run the broader required validation suite before handoff.

This does not authorize unrelated refactoring, uncontrolled scope expansion, protected-boundary changes, or Founder-reserved decisions.

## 6. Reconcile Every Finding

Before claiming remediation complete, recheck every:

reported defect;

failed test or command;

reviewer finding;

acceptance-criteria violation;

issue discovered during remediation.

Classify each as:

VERIFIED RESOLVED, with evidence;

APPROVED LOW-RISK HARDENING, under the triage policy; or

ESCALATED BLOCKER, with the exact reason.

No reported problem may disappear without a documented disposition.

## 7. Verify Identity, Freshness, and Evidence

Before substantive repository work, verify the relevant:

repository path;

branch;

complete commit SHA;

complete tree SHA;

candidate or tag;

worktree and preservation state.

If identity fails, stop without mutation unless explicitly authorized otherwise.

Before reusing evidence, verify that it still applies to the current candidate, scope, policy, ADRs, environment, and authority grant.

Claims must be supported by exact paths, lines, commands, tests, logs, diffs, counts, negative controls, and candidate identity where applicable. Label unsupported claims as inference, recommendation, limitation, or unverified.

## 8. Resolve Conflicts by Precedence

Use this order:

Repository state and verified tool output.

Approved Founder decisions and authority grants.

Approved ADRs and versioned policy.

Binding operating instructions.

Latest verified progress record.

Approved package or work instruction.

Agent reports.

Inferences and unverified claims.

A lower source cannot override a higher one. Conflicts at the same level must be preserved and routed to the proper reconciliation authority.

## Make Every Finding Implementation-Ready

Every reviewer, auditor, or agent reporting a mistake must provide enough information for the authorized implementation owner to fix it without Founder interpretation.

For every finding, state:

stable finding ID and severity;

exactly what is wrong;

exact file path, line range, symbol, route, component, command, test, or control path;

exact evidence proving the problem;

why it matters and which requirement, ADR, invariant, policy, or acceptance criterion it violates;

the safest recommended remediation direction;

affected scope, likely blast radius, and behavior that must remain unchanged;

tests, negative controls, or other evidence required to prove resolution;

required reviewer and re-review conditions.

Do not report vague findings such as “improve error handling” or “there may be a race condition.” Identify the actual defective behavior and its location.

When the agent is uncertain about the correct fix, it must state the uncertainty, identify what the implementation owner should inspect, and avoid presenting an unverified solution as fact.

## Consolidated Remediation and Fast Handoff

Use one consolidated finding batch.

Reviewers must finish the authorized review and return all findings together. Do not send findings one at a time unless an immediately dangerous issue requires the work to stop.

Fix the complete batch in one remediation cycle.

The write-authorized implementation owner must remediate every safe, relevant finding in the batch, plus any related in-scope defects discovered while fixing them, before returning the candidate for re-review.

Maintain a finding ledger.

Every finding must keep the same stable ID through review, remediation, and re-review. The final remediation report must list each ID with:

exact correction made;

files changed;

verification evidence;

final disposition;

remaining risk, if any.

No agent should have to rediscover which findings remain open.

Use impact-based re-review.

After remediation, the Main Coordinator must determine from the actual diff and affected behavior whether targeted or full independent re-review is required. Do not automatically repeat unaffected reviews, but never reuse approval for materially changed or affected scope.

Continue without unnecessary permission stops.

A write-authorized agent must continue through inspection, implementation, in-scope remediation, targeted verification, broader validation, finding reconciliation, and final reporting without stopping for routine approval. Stop only for:

repository identity failure;

missing authority or credentials;

a Founder-reserved decision;

a protected-boundary or material architecture change;

a genuine blocker that cannot be safely resolved and verified.

Return only decision-useful information.

Agent reports must prioritize:

what changed;

what remains broken;

exact evidence;

exact candidate identity;

required next action.

Do not repeat project history or unchanged instructions unless needed to prevent an error.

## 9. Protect the Candidate and Production Boundaries

After independent review begins, any material edit creates a new candidate identity, invalidates affected evidence and approvals, and requires the appropriate re-review.

Do not weaken or bypass authentication, authorization, repository protections, production barriers, or protected files, including:

proxy.ts

lib/dev-hq/internal-guard.ts

lib/dev-hq/actions.ts

Treat authentication and authorization as separate analyses.

## 10. Triage and Retry Correctly

Critical and high-risk issues block progress.

Medium issues must be fixed before they spread or create costly rework.

Low-risk issues may be recorded for later hardening.

Cosmetic issues do not block unless they mislead agents or invalidate evidence.

Investigate unknowns only enough to classify them. For major work, inspect the highest-impact unverified assumption or blind spot.

Do not repeat a failed attempt without new evidence or a changed approach. Classify the failure, correct its cause, use a bounded retry count, and escalate when authority or evidence is insufficient.

## 11. Control Agent Outputs

Evaluate every agent-generated prompt, handoff, or next-step instruction before giving it to me.

If it is incomplete, stale, ambiguous, unsafe, or weaker than what you would create:

preserve its accurate facts and evidence;

correct mistakes openly;

replace it yourself;

tell me to use only the replacement.

Do not waste time sending it back merely for rewriting.

## 12. Distinguish Completion States

Work performed, validation passed, review approved, candidate accepted, integrated, deployed, operationally verified, and package closed are separate states.

Never claim a later state without its specific evidence.

## 13. Required Founder-Facing Output

Immediately after every complete agent prompt, provide outside the prompt:

Exactly one concise sentence explaining what it will make the agent do.

Active agents after this prompt, listing each relevant agent as ACTIVE, WAITING, or IDLE, its assignment, and its next activation condition.

One concise estimated progress line using a consistent denominator.

## FINAL GATE

Before sending any prompt or action, verify:

destination and paste order are exact;

objective is singular;

identity and context are current;

scope and authority are explicit;

verification is proportional but sufficient;

reviewer independence is preserved;

completion can be determined without guessing;

the stop condition and next route are unmistakable;

no shorter safe and complete version exists.

If any check fails, fix the response before showing it to me.

# 24. New-Chat Startup Context and Reusable Instruction

| REUSABLE STARTUP INSTRUCTION<br>Read Section 23, VIYBD HQ — BINDING OPERATING KERNEL, in full and apply it exactly as written before every Viybd HQ response. Then read the attached Viybd HQ Master Roadmap v10.4, latest verified Current Progress Update, relevant approved ADRs and decisions, repository evidence, and applicable policy artifacts. Distinguish long-term direction from current verified execution state. Identify the current phase, sprint, work item, active owner, candidate, review state, blockers, and exact next gate, then give the Founder the one exact next action required by the binding kernel. |
|---|

The roadmap must be paired with the latest verified Current Progress Update, relevant ADRs, approved decisions, repository evidence, and any separately binding handbook or policy artifacts. New sessions must distinguish long-term direction from live state and must not infer implementation status from roadmap text.

## Required Startup Behavior

Read Section 23, VIYBD HQ — BINDING OPERATING KERNEL, in full before every Viybd HQ response and apply it exactly as written.

Read the roadmap, latest verified progress record, relevant ADRs, approved decisions, repository evidence, and applicable policy before directing work.

Identify the current phase, sprint, work item, active owner, candidate, review state, blocker, and exact next gate from current verified evidence.

Do not infer implementation, validation, review, acceptance, integration, deployment, operational-verification, or closure state from roadmap text.

Use Section 23 as the complete mandatory operating standard for every Founder-facing prompt, action, handoff, review route, remediation route, and status update.

# Appendix A — Complete Capability Matrix

| **Phase** | **Capability** | **Priority** | **Completion standard** |
|---|---|---|---|
| Phase 1 | Durable Work Management | Required | Evidence-backed completion gate |
| Phase 1 | Specialized Agent Organization | Required | Evidence-backed completion gate |
| Phase 1 | Execution Pipeline | Required | Evidence-backed completion gate |
| Phase 1 | Independent Review | Required | Evidence-backed completion gate |
| Phase 1 | Deterministic Reliability | Required | Evidence-backed completion gate |
| Phase 1 | Mission Control Lite Desktop + Mobile | Required | Evidence-backed completion gate |
| Phase 1 | Smart Work Packets | Required | Evidence-backed completion gate |
| Phase 1 | Repository Intelligence | Required | Evidence-backed completion gate |
| Phase 1 | Context Router | Required | Evidence-backed completion gate |
| Phase 1 | Context Lifecycle Manager | Required | Evidence-backed completion gate |
| Phase 1 | Agent Performance Registry Foundation | Required | Evidence-backed completion gate |
| Phase 1 | Verification-First Completion | Required | Evidence-backed completion gate |
| Phase 1 | Adaptive Orchestration Foundation | Required | Evidence-backed completion gate |
| Phase 1 | Autonomous Engineering Loop | Required | Evidence-backed completion gate |
| Phase 2 | Multi-Project Scaling | Required | Evidence-backed completion gate |
| Phase 2 | Company Knowledge Platform | Required | Evidence-backed completion gate |
| Phase 2 | Obsidian Interface | Required | Evidence-backed completion gate |
| Phase 2 | Knowledge Curator | Required | Evidence-backed completion gate |
| Phase 2 | Automatic Documentation | Required | Evidence-backed completion gate |
| Phase 2 | Organizational Learning | Required | Evidence-backed completion gate |
| Phase 2 | Advanced Founder Interface | Required | Evidence-backed completion gate |
| Phase 2 | Executive Intelligence | Required | Evidence-backed completion gate |
| Phase 2 | Engineering Intelligence Platform | Required | Evidence-backed completion gate |
| Phase 2 | Agent Memory and Organizational Learning | Required | Evidence-backed completion gate |
| Phase 2 | Review Learning | Required | Evidence-backed completion gate |
| Phase 2 | Continuous Architecture Management | Required | Evidence-backed completion gate |
| Phase 2 | Advanced Collaboration | Required | Evidence-backed completion gate |
| Phase 2 | Model Management | Required | Evidence-backed completion gate |
| Phase 2 | Autonomous Research | Required | Evidence-backed completion gate |
| Phase 2 | Interactive Pair Engineering | Required | Evidence-backed completion gate |
| Phase 2 | Enterprise Production Platform | Required | Evidence-backed completion gate |
| Phase 2.6 | Customer Reality System | Required | Evidence-backed completion gate |
| Phase 2.6 | Growth and Distribution Operating System | Required | Evidence-backed completion gate |
| Phase 2.6 | Financial and Treasury Control System | Required | Evidence-backed completion gate |
| Phase 2.6 | Trust, Reputation, and Brand Safety System | Required | Evidence-backed completion gate |
| Phase 2.6 | Business Continuity and Platform-Risk System | Required | Evidence-backed completion gate |
| Phase 2.6 | External Expert Escalation Network | Required | Evidence-backed completion gate |
| Phase 2.6 | Business Simulation and Safe-Action Sandbox | Required | Evidence-backed completion gate |
| Phase 3 | Reference Product Delivery | Required | Evidence-backed completion gate |
| Phase 3 | Reference AI Product Delivery | Required | Evidence-backed completion gate |
| Phase 3 | Production Operations | Required | Evidence-backed completion gate |
| Phase 3 | Business Outcome Intelligence | Required | Evidence-backed completion gate |
| Phase 3 | Continuous Product Learning | Required | Evidence-backed completion gate |
| Phase 3 | Company-Scale Engineering | Required | Evidence-backed completion gate |
| Phase 4 | Multi-Organization Tenancy | Required | Evidence-backed completion gate |
| Phase 4 | Workflow Marketplace | Required | Evidence-backed completion gate |
| Phase 4 | Enterprise Governance and Compliance | Required | Evidence-backed completion gate |
| Phase 4 | Human-AI Workspaces | Required | Evidence-backed completion gate |
| Phase 4 | Platform Economics | Required | Evidence-backed completion gate |
| Phase 4 | Enterprise Integration Fabric | Required | Evidence-backed completion gate |
| Phase 4 | Domain Workflow Ecosystem | Required | Evidence-backed completion gate |
| Phase 4 | Organization Intelligence | Required | Evidence-backed completion gate |
| Phase 2 | Adaptive Organization Engine | Required | Evidence-backed completion gate |
| Phase 2 | Dependency-Aware Work Decomposition | Required | Evidence-backed completion gate |
| Phase 2 | Dynamic Workforce Scaling | Required | Evidence-backed completion gate |
| Phase 2 | Parallel Review Teams | Required | Evidence-backed completion gate |
| Phase 2 | Lead Reviewer Reconciliation | Required | Evidence-backed completion gate |
| Phase 2 | Integration Management | Required | Evidence-backed completion gate |
| Phase 2 | Parallelization Optimization | Required | Evidence-backed completion gate |
| Phase 2 | Hierarchical Team Formation | Required | Evidence-backed completion gate |
| Phase 2.5 | Commercial Legal and Compliance Platform | Required | Evidence-backed completion gate |
| Phase 2.5 | Jurisdiction and Obligation Registry | Required | Evidence-backed completion gate |
| Phase 2.5 | Accessibility Compliance Pack | Required | Evidence-backed completion gate |
| Phase 2.5 | Privacy, Cookie, and Tracking Controls | Required | Evidence-backed completion gate |
| Phase 2.5 | Compliance Change Monitoring | Required | Evidence-backed completion gate |
| Phase 2.5 | Venture Discovery and Validation | Required | Evidence-backed completion gate |
| Phase 2.5 | Opportunity Registry and Scoring | Required | Evidence-backed completion gate |
| Phase 2.5 | Validation Experiment Engine | Required | Evidence-backed completion gate |
| Phase 2.5 | Paid-Pilot and Pre-Sale Evidence | Required | Evidence-backed completion gate |
| Phase 3A | Autonomous Business Operations | Required | Evidence-backed completion gate |
| Phase 3A | Growth, Sales, Support, and Customer Success Operations | Required | Evidence-backed completion gate |
| Phase 3A | Billing, Refund, and Revenue Operations | Required | Evidence-backed completion gate |
| Phase 3A | Commercial Authority and Emergency Controls | Required | Evidence-backed completion gate |
| Phase 3B | Venture Portfolio Manager | Required | Evidence-backed completion gate |
| Phase 3B | Capital and Capacity Allocation | Required | Evidence-backed completion gate |

# Appendix B — Phase Gate Summary

| **Gate** | **Minimum proof** |
|---|---|
| Sprint 1E exit | Reliability invariants, independent review, architecture review where required, full validation, Founder approval, and committed protected baseline. |
| Context lifecycle readiness | Health scoring, checkpointing, compaction, continuation, rollover, restoration verification, failed-restoration recovery, and quality measurement. |
| Phase 1 exit | Consecutive autonomous tasks, multi-session continuity, adaptive routing, phone visibility, review/revision loops, deterministic recovery, evidence, and Founder acceptance. |
| Phase 2 exit | Multi-project operation, company knowledge, curation, executive and engineering intelligence, model lifecycle, collaboration, research, pair engineering, and self-improvement under policy, evidence-backed agent memory with freshness and challenge controls, and self-improvement under policy. |
| Phase 3 exit | Viybd is delivered as a polished, deployed, portfolio-quality reference implementation, and Dev HQ demonstrates that the same governed product, production, business-outcome, and learning loops can be reused for validated ventures. |
| Phase 4 maturity | Multiple organizations operate securely through an extensible platform with enterprise governance, marketplace workflows, integrations, collaboration, and measurable economics. |
| Phase 2.5 compliance readiness | Applicable obligations and compliance packs are versioned; accessibility, privacy, cookie/tracking, marketing, payment, and release controls are tested; uncertainty routes to designated professional or Founder authority. |
| Phase 2.5 venture-validation readiness | Several opportunities complete the discovery-to-decision loop; weak ideas are stopped; at least one recommendation uses real customer or payment evidence; identity, brand, spend, data, and contact controls are proven. |
| Phase 2.6 commercial-intelligence and resilience readiness | Customer evidence changes decisions; governed acquisition channels demonstrate measurable quality; finances reconcile with reserves and controls; trust and brand-safety gates block harmful actions; continuity exercises prove recovery; expert escalation is operational; simulations reveal material risks without being treated as real-world proof. |
| Phase 3A business-operations readiness | One validated venture is operated through product, growth, sales, support, billing, compliance, incident, and reconciliation workflows with bounded authority and safe pause/shutdown. |
| Phase 3B portfolio readiness | Multiple ventures or simulations demonstrate constrained allocation, accurate portfolio reporting, correlated-risk controls, one stop decision, one expansion decision, and Founder-controlled material capital authority. |

# Appendix C — Context Lifecycle Checkpoint Schema

| **Category** | **Required content** |
|---|---|
| Identity | Organization, project, milestone, sprint, work item, execution, assignment, actor, role, predecessor session, model/provider, candidate. |
| Objective | Goal, business objective, success definition, scope, out of scope, assumptions, authority, budgets, deadlines. |
| State | Lifecycle state, completed/pending transitions, next gate, ownership, collaboration mode. |
| Repository | Path, branch, HEAD, diff/artifact identity, modified files, modules, dependencies, environment. |
| Decisions | Approved decisions, rejected options, ADRs, policies, open questions, required Founder decisions. |
| Evidence | Tests, commands, logs, screenshots, artifacts, metrics, citations, quality-gate results. |
| Reviews | Reviewers, lenses, candidate, verdicts, findings, remediation, fixes, re-review, residual risk. |
| Context | Package IDs, sources, omissions, knowledge references, cache blocks, freshness, token state, quality metrics. |
| Continuation | Exact next action, receiving role, complete instruction, tools, commit authority, restoration checks. |
| Integrity | Timestamp, version, provenance, checksum, supersession, tenant boundary. |

# Appendix D — Institutional Knowledge Record Schema

| **Field** | **Required content** |
|---|---|
| Identity | Knowledge ID, title, type, scope, owner, version, status. |
| Classification | Standard, ADR explanation, playbook, feature doc, lesson, incident, research, onboarding, deprecated guidance. |
| Authority | Who may propose, validate, approve, publish, supersede, archive, or delete. |
| Provenance | Source work items, repository candidates, evidence, reviews, incidents, decisions, authors, models, tools. |
| Content | Guidance, rationale, examples, constraints, anti-patterns, applicability, exclusions. |
| Freshness | Created, reviewed, next review, stale threshold, current repository/ADR compatibility. |
| Confidence | Evidence strength, uncertainty, contradictions, challenge status. |
| Relationships | Related ADRs, files, services, APIs, tests, incidents, lessons, superseded and successor records. |
| Retrieval | Tags, semantic index, access controls, projects, roles, and relevance conditions. |
| Effectiveness | Usage, downstream outcomes, confusion reports, review impact, update history. |

# Appendix E — Standard Review Output

1. Review identity: reviewer, lens, date, model/provider/version if applicable.
2. Candidate identity: branch, commit, diff, artifact, configuration, and environment.
3. Scope reviewed and not reviewed.
4. Validation performed and evidence inspected.
5. Verdict.
6. Findings using the canonical schema.
7. Cross-finding risks or systemic patterns.
8. Required next action and exact re-review condition.
9. Commit, merge, deploy, or release recommendation.
10. Residual risk and confidence.

# Appendix F — Agent Status and Handoff Template

| **Agent / role** | **Status** | **Current assignment** | **Next condition** |
|---|---|---|---|
| Executive / Orchestrator | ACTIVE / WAITING | Coordination state | Next routing or gate |
| design-engineer | IDLE / ACTIVE / WAITING | Task or none | Next condition |
| lead-software-engineer | IDLE / ACTIVE / REVISION | Task or none | Next condition |
| independent-code-reviewer | IDLE / REVIEWING / COMPLETE | Candidate or none | Next condition |
| architecture-reviewer | IDLE / REVIEWING / COMPLETE | Candidate or none | Next condition |
| Knowledge Curator | IDLE / CURATING / COMPLETE | Knowledge proposal or audit | Validation / publication gate |
| research agent | IDLE / RESEARCHING / COMPLETE | Question or none | Next condition |
| specialist reviewer(s) | IDLE / REVIEWING / COMPLETE | Lens or none | Next condition |
| Founder | WAITING / DECISION | Decision or none | Next approval point |
| compliance-research agent | IDLE / MONITORING / REVIEWING | Obligation or change proposal | Specialist/legal/Founder gate |
| venture-research lead | IDLE / RESEARCHING / COMPLETE | Opportunity portfolio or market question | Validation authorization |
| validation experiment owner | IDLE / RUNNING / PAUSED / COMPLETE | Approved experiment | Kill/pivot/build decision |
| business-operations lead | IDLE / OPERATING / INCIDENT | Venture operations | Operational or Founder gate |
| portfolio manager agent | IDLE / ANALYZING / COMPLETE | Portfolio allocation review | Founder capital decision |
| customer-insights lead | IDLE / ANALYZING / COMPLETE | Customer evidence or insight review | Product/venture decision gate |
| growth-operations lead | IDLE / RUNNING / PAUSED / COMPLETE | Channel or campaign | Scale/stop/review gate |
| financial-controller agent | IDLE / RECONCILING / ALERT | Financial period or anomaly | Financial/Founder gate |
| brand-safety reviewer | IDLE / REVIEWING / INCIDENT | Content, campaign, or reputation issue | Approve/block/escalate |
| continuity and platform-risk lead | IDLE / TESTING / INCIDENT | Dependency or recovery exercise | Resilience/Founder gate |
| expert-escalation coordinator | IDLE / PREPARING / ENGAGED | Expert question or engagement | Advice/decision closeout |
| simulation and stress-test lead | IDLE / SIMULATING / COMPLETE | Scenario or action rehearsal | Real-action authorization |

# Appendix G — Roadmap Change Control

- This roadmap is a permanent governance artifact and must not be silently changed by ordinary implementation work.
- A proposed change identifies the exact section, rationale, benefits, risks, dependencies, migration impact, and Founder decision.
- Version the roadmap when capability structure, dependency order, phase promises, autonomy levels, or milestone definitions materially change.
- Keep roadmap, handbook, ADRs, Current Progress Update, and knowledge records distinct: direction, operating rules, architecture decisions, live state, and institutional guidance serve different purposes.
- Preserve superseded decisions and rejected approaches when they remain important to preventing regression.
- After an approved change, update startup instructions, gates, capability matrix, work packets, policies, and ADR references.

# Appendix H — Temporary Organization Record Schema

## Identity

Organization ID, organization type, objective, parent goal, project, repositories, candidate, lead, integration owner, creator, policy, and lifecycle state.

## Structure

Members, roles, hierarchy, packet graph, dependencies, interfaces, shared resources, concurrency groups, critical path, and unassigned scope.

## Authority and Economics

Permissions, credentials, model/provider constraints, per-packet budgets, global budget, deadline, rate limits, capacity reservation, and stop conditions.

## Coordination

Communication mode, structured channels, direct-session rules, escalation path, decision ownership, expected-return schema, and write-back requirements.

## Convergence

Integration order, conflict policy, candidate-freeze rules, end-to-end tests, review plan, reconciliation owner, rollback, cancellation, and dissolution criteria.

## Outcomes

Wall-clock duration, total cost, speedup, coordination overhead, duplicate work, failures, reassignments, merge conflicts, defects, quality, residual risk, and lessons proposed.

# Appendix I — Review Packet and Reconciliation Schema

## Review Packet

Packet ID; candidate identity; subsystem or lens; reviewed and excluded scope; files, interfaces, ADRs, policies, risks, required evidence, dependencies, communication rules, budget, deadline, verdict options, and exact return format.

## Reconciliation Record

Lead reviewer; candidate; packet coverage map; packet verdicts; unresolved scope; duplicate findings; conflicting findings; cross-packet interactions; systemic patterns; integration evidence; final findings; final verdict; residual risk; confidence; re-review impact map; and exact next gate.

# Appendix J — Adaptive Organization Acceptance Tests

## Correctness and convergence

- Demonstrate deterministic packet identity, no duplicate active ownership, safe cancellation, bounded retry, candidate convergence, stale-result rejection, and restoration after interruption.

## Review integrity

- Demonstrate that packet approvals cannot bypass lead reconciliation, cross-packet defects are detected, and affected approvals invalidate after candidate mutation.

## Efficiency

- Compare single-owner and team execution on representative large work; measure wall-clock speed, total cost, quality, rework, coordination overhead, and diminishing returns.

## Governance

- Prove authority isolation, budget enforcement, provider limits, credential scope, complete provenance, communication write-back, and Founder escalation.

# Appendix K — Glossary

| **Term** | **Meaning** |
|---|---|
| Executive / Project Orchestrator | AI agent role responsible for complexity classification, workflow selection, planning, routing, monitoring, acceptance within authority, forecasting, and communication. |
| Work Management Layer | Authoritative durable source of truth for workflow state, evidence, decisions, policies, approvals, and outcomes. |
| Adaptive Orchestration | Selection of the lightest safe workflow based on complexity, risk, evidence, authority, and measured performance. |
| Smart Work Packet | Complete role-specific engineering work order. |
| Repository Intelligence | Maintained model of architecture, dependencies, APIs, ownership, tests, conventions, changes, and risks. |
| Context Router | System that assembles minimum complete context for a work item. |
| Context Lifecycle Manager | System responsible for context health, checkpoints, compaction, continuation, rollover, restoration, verification, and recovery. |
| Company Knowledge Platform | Governed institutional knowledge service synchronized to human-readable interfaces such as Obsidian. |
| Institutional Knowledge | Validated, governed, retrievable knowledge with provenance, scope, confidence, and supersession. |
| Knowledge Curator | Agent responsible for validation, organization, contradiction detection, linking, supersession, archival, and effectiveness review. |
| Engineering Intelligence Platform | Measurement and learning layer for quality, architecture, context, review, model, cost, risk, flow, and outcomes. |
| Verification-First Completion | Rule that completion requires evidence, tests, reviews, approvals, and gates rather than assertion. |
| Autonomous Readiness | Evidence-backed measure of how safely and independently HQ can operate. |
| Adaptive Organization Engine | System that decomposes work, forms temporary teams, scales assignments, governs communication, manages integration, and retires organizations. |
| Temporary Organization | A bounded, purpose-built team with a lead, packet graph, authority, budget, communication rules, stop conditions, and dissolution criteria. |
| Review Packet | A candidate-bound, subsystem- or lens-specific review assignment with explicit included and excluded scope. |
| Lead Reconciliation | Evidence-based synthesis of packet coverage, findings, conflicts, cross-packet risks, and final recommendation. |
| Integration Owner | Actor accountable for interface coherence, merge order, candidate convergence, end-to-end validation, and closeout of parallel work. |
| Parallelization Regret | Measured cost or quality loss from using more concurrency than the work justified. |
| Agent Memory and Organizational Learning System | Governed system for recording evidence-backed agent and team experience, expertise, recurring mistakes, collaboration outcomes, confidence, freshness, and scope so future routing and organizational decisions improve without replacing current evidence or authority. |
| Commercial Legal and Compliance Platform | Jurisdiction-aware system that maps obligations into versioned compliance packs, controls, tests, evidence, monitoring, specialist review, and release gates without claiming universal legal certainty. |
| Compliance Pack | Versioned set of applicability conditions, requirements, tests, notices, evidence, owners, sources, effective dates, and approval rules for a legal, regulatory, contractual, accessibility, privacy, or commercial domain. |
| Opportunity Registry | Governed record of market problems, customer segments, evidence, alternatives, competition, distribution, economics, compliance burden, uncertainty, experiments, and decisions. |
| Venture Discovery and Validation | System that discovers opportunities, compares expected risk-adjusted value, runs cheap ethical experiments, and requires proportionate real-world evidence before major build or launch commitments. |
| Validation Experiment | Predeclared commercial test with hypothesis, target, channel, budget, guardrails, compliance, success threshold, stop conditions, evidence, and decision rule. |
| Autonomous Business Operations | Founder-supervised coordination of product, growth, sales, support, billing, vendor, compliance, customer-success, and reporting work within explicit commercial authority. |
| Venture Portfolio Manager | System that compares ventures and allocates constrained capital, compute, workers, and Founder attention while tracking risk, economics, capacity, and opportunity cost. |
| Commercial Authority Grant | Explicit permission defining approved identities, channels, claims, pricing, spend, contracts, refunds, customer commitments, data access, accounts, payments, duration, and escalation rules. |
| Customer Reality System | Governed system that converts authorized customer statements and observed behavior into traceable, privacy-bounded product and venture decisions. |
| Growth and Distribution Operating System | System for operating and learning across approved acquisition channels, campaigns, content, partnerships, attribution, conversion, and channel economics. |
| Financial and Treasury Control System | Authoritative commercial finance layer for reconciliation, cash, obligations, reserves, budgets, margins, anomalies, approvals, and emergency freezes. |
| Trust, Reputation, and Brand Safety System | Independent controls that protect customers and ventures from misleading claims, unsafe content, policy violations, partner misconduct, and long-term reputation harm. |
| Business Continuity and Platform-Risk System | System that maps external dependencies, concentration, portability, recovery objectives, alternatives, exercises, and migration or shutdown plans. |
| External Expert Escalation Network | Governed registry and workflow for obtaining scoped judgment from qualified human professionals when a decision exceeds AI or internal authority. |
| Business Simulation and Safe-Action Sandbox | Isolated environment for rehearsing high-impact commercial scenarios with explicit assumptions and no claim that simulated outcomes are real-world proof. |
| Customer Evidence Record | Source-linked record of a customer statement, behavior, support event, transaction, complaint, outcome, or other authorized signal with segment, time, provenance, privacy scope, and confidence. |
| Treasury Authority Grant | Explicit permission defining balances, accounts, payment actions, budgets, reserves, approvers, destinations, duration, ceilings, and emergency controls. |
| Platform Concentration Risk | Exposure created when a venture materially depends on one marketplace, supplier, processor, provider, account, channel, or other external service whose failure can interrupt operations. |

**END-STATE DEFINITION**

**Viybd HQ is an autonomous, measurable, governed, knowledge-compounding software engineering organization and enterprise platform.**

The Founder provides vision and strategic direction. Dev HQ researches, plans, forms temporary organizations, decomposes and parallelizes work, coordinates, communicates, reconciles, integrates, implements, reviews, revises, tests, verifies, continues across sessions, manages models, curates institutional knowledge, deploys, operates, measures outcomes, remembers evidence-backed agent and team experience, learns, improves itself, and uses Viybd as a polished reference implementation proving end-to-end product delivery. It then applies those reusable systems to validated ventures, collaborates with humans, maintains jurisdiction-aware compliance controls, discovers and validates opportunities, continuously learns from real customers, operates governed growth and distribution channels, reconciles finances and protects treasury reserves, preserves trust and brand safety, survives platform and supplier failures, escalates material judgment to qualified experts, rehearses high-impact actions in safe simulations, operates approved businesses within bounded commercial authority, allocates resources across a governed venture portfolio, and ultimately supports multiple organizations through a secure and extensible engineering platform.
