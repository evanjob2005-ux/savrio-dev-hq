# Sprint 1F Entry Package

**Status:** READINESS PACKAGE — **planning only. No implementation authorized. Uncommitted.**
**Date:** 2026-07-26
**Prepared by:** Coordinating session, at Sprint 1E closure.

**Protected baseline (immutable):** `sprint-1e-remediated` → `d922f3794a6c57f02039ab969e0b98477f4c4c29`
**Pre-remediation baseline:** `sprint-1e-baseline` → `62f629128e5092f593ff494cd729fe516694bbde`
**Sprint 1E closure commits:** `4619210c…`, `9069c12e…`

**Sprint 1E is permanently closed. Nothing in this package reopens it.**

---

## 1. Sprint objective

Deliver **Mission Control Lite** — a Founder-facing operational surface over the Sprint 1E
execution substrate — **and** discharge the four Sprint 1E follow-up obligations carried
into this sprint.

Two distinguishable tracks:

| Track | Content | Source of authority |
|---|---|---|
| **A — Carried obligations** | 1E-F4, 1E-F5, AR2-6 (+ RAT-5 triage) | Founder direction; committed follow-up register |
| **B — Mission Control Lite** | The ten views, seven decision fields, enabling work | `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` |

**This package is authoritative for Track A only.** Track B's scope is owned by the Mission
Control Lite plan; this package reconciles against it and records conflicts (§19) rather
than restating or overriding it.

---

## 2. Approved scope

### Track A — carried obligations (this package's deliverables)

| ID | Deliverable |
|---|---|
| **1E-F4** | Regression test pinning the X4-class guard — **see §19 Conflict 1: the target must be settled before implementation** |
| **1E-F5** | Tests pinning three uncovered `execution.assignment_deferred` emission sites, to the MAJOR-2 negative-control standard, **founder-facing escalation/revise path first** |
| **AR2-6** | `ExecutionRunner` port revision as **one coherent workstream** |
| **RAT-5** | **Triage only** — classify severity, ownership, proposed sprint, acceptance criteria. **Do not implement.** |

### Track B — Mission Control Lite

Per `SPRINT_1F_MISSION_CONTROL_LITE.md` §2. Not restated here.

---

## 3. Explicit out-of-scope

- **Any reopening of Sprint 1E.** The baseline is protected and ratified with 0 unresolved blockers.
- **Roadmap Phase 2 implementation** — explicitly excluded by standing Founder direction.
- **Implementing RAT-5** — triage only.
- **Modifying `store.ts`** — it is untouched by the Sprint 1E remediation and out of Track A scope.
- **ADRs, tags, protected commits** — no modification.
- Track B out-of-scope items per the Mission Control Lite plan §3.

---

## 4. Required deliverables

### 1E-F4 — pin the X4-class guard

**Obligation as stated by the Founder:** a regression test that fails if the implementation
reverts to status-only branching and falsely reports an attempt is retrying when no agent
is assigned.

⚠️ **That behaviour is already pinned.** `agent-execution-service.test.ts:1619-1620`:
```ts
expect(reclaimed[0]?.message).toContain("waiting for an available agent");
expect(reclaimed[0]?.message).not.toContain("retrying as attempt");
```
**See §19 Conflict 1.** The genuinely unpinned guard is a *different* line. Founder decision
required before implementation.

**Acceptance (whichever target is chosen):** the test fails under the mutation that removes
the guard, and passes on the current implementation.

### 1E-F5 — pin three uncovered emission sites

Three of six `execution.assignment_deferred` sites can be deleted with all four gates green
(mutations M11/M13/M14):

| Priority | Site | Why |
|---|---|---|
| **1** | `escalation-service.ts:293` | **Founder-facing.** The Founder has just made an explicit `revise` decision; the task reads `active` with nothing running and no explanation |
| 2 | `review-service.ts:635` | Review loop stalls silently |
| 3 | `agent-execution-service.ts:926` | Retry requeued with no capacity |

Sites 1 and 2 are reached via `await import(...)`, which `tsc` resolves statically but **no
test executes** — a path-alias or module-boundary change breaks them at runtime with a green
suite.

**Acceptance — the MAJOR-2 negative-control standard, all three required:**
1. Prove the intended site is responsible for the emission.
2. Deleting or disabling that site makes the test **fail**.
3. **No count-only assertion** that another deduplicated path could satisfy.

Requirement 3 is not stylistic. MAJOR-2 existed because `toHaveLength(1)` was satisfied by
either of two emission paths sharing a dedupe key, so the test had stopped detecting the
defect it was written to pin.

### AR2-6 — `ExecutionRunner` port revision (one workstream)

| Element | Change |
|---|---|
| `claimExecution` | Return contract |
| `heartbeat` | Add `assignmentId` |
| Three callback handlers | Optional → required `assignmentId` |
| **Production consumption** | Actually consume the injected port |

**Architecture-review acceptance criterion (Founder-specified):**
- Substitute a **stub `ExecutionRunner`** through the composition root.
- Prove `handleExecutionRunning` **observes the injected port**.
- **The test must fail before the seam is properly consumed.**

That last clause is the substance: the port is currently wired but inert, so a test that
passes today would prove nothing.

### RAT-5 — triage classification (deliverable is the classification, not a fix)

| Field | Value |
|---|---|
| **Condition** | Event ring caps at 200 (`store.ts:224`); `store.eventKeys` never trimmed on eviction |
| **Consequence** | An evicted deduplicated event is **permanently blocked from re-append** |
| **Severity** | **MINOR** — correctness consequence for the timeline, no data corruption, not reachable at current volume |
| **Ownership** | Lead Software Engineer (implementation) · Architecture Reviewer (E5 timeline-integrity impact) |
| **Proposed sprint** | **Sprint 1G or Phase 2** — *not* 1F. See §19 Conflict 4 |
| **Acceptance if implemented** | Trim `eventKeys` in lockstep with ring eviction; a test proving an evicted-then-re-emitted event re-appends |
| **Scope guard** | Pre-existing · `store.ts` not among the 10 remediated files · **must not reopen Sprint 1E** |

---

## 5. Dependencies

| Dependency | Status | Blocks |
|---|---|---|
| Sprint 1E ratified baseline | ✅ **Satisfied** — `d922f379`, 0 blockers | Everything |
| **D-1** Sprint 1E remediation disposition | ✅ **DISCHARGED** — the plan lists this as `AWAITING FOUNDER APPROVAL`; it is now ratified and committed | 1F-3, 1F-12, 1F-15 |
| **D-2 / Q-1** deployment, persistence, transport, auth ADR | ❌ **OPEN** | All Track B phases B–E |
| **D-6** new dependencies (auth, web-push, jsdom) | ❌ **OPEN** | 1F-6, 1F-10, 1F-19 |
| **D-8** missing handbooks and standards | ❌ **OPEN** | **G-2 completeness** |
| **D-9** ADR-0002 E5 amendment; Sprint 1E PE-1 amendment | ❌ **OPEN** | 1F-0 closure |
| Frontend test infrastructure | ❌ **ABSENT** — `vitest.config.ts` is `environment: "node"`, `include: ["**/*.test.ts"]`; no `.tsx` collected, no Playwright config | All Track B UI validation |

**Track A has no open dependencies.** It can proceed while Track B's decisions are pending.

---

## 6. Architecture and ADR constraints

- **ADR-0001 O6** — a capability-unmatched execution stays `queued` **with a logged event**. Six emission sites now satisfy this; 1E-F5 pins three of them.
- **ADR-0001 D7** — `ExecutionRunner` is the concurrency contract a future durable adapter must meet. **AR2-6 amends a port, not an internal interface.**
- **ADR-0002 E3** — one event per meaningful transition; **no event per heartbeat**; events emitted from the service layer, **never** from the Execution Manager.
- **Execution Manager purity** — verified structurally against its import list. No emission may be added inside `execution-manager.ts`.
- **The negative-outcome policy** — *"Throw only when the caller could not have been right. Absorb when the caller was right and the world moved."* Governs every throw-versus-absorb decision in the execution layer. ⚠️ **It lives only in a review artifact** (1E-F1 in the plan's register).
- **ADR-0003** (deployment/persistence/transport/auth) — **required, not yet authored.** Number assigned centrally.

---

## 7. Design authority references

| Artifact | Authority |
|---|---|
| `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md` | Track B technical plan (specialist draft) |
| `agents/claude-design/outputs/PHASE_1_MISSION_CONTROL_LITE_UX.md` | Approved Mission Control UX |
| `docs/decisions/ADR-0001…`, `ADR-0002…` | Architecture |
| `docs/validation/sprint-1e-overnight-2026-07-26/SPRINT_1F_FOLLOWUP_REGISTER.md` | **Committed** Track A obligations |
| `docs/validation/sprint-1e-overnight-2026-07-26/RATIFICATION_1E_D922F379.md` | Binding Sprint 1E verdict |
| `.../FRESH_CR_1E_FINAL_CANDIDATE_REVIEW.md`, `.../FRESH_CR_1E_3DAF_FINAL_REVIEW.md` | Superseded FAILs, retained |
| `agents/independent-code-reviewer/outputs/SPRINT_1E_REMEDIATION_PATCH_SPEC.md` | Patch spec, amendments, AR rulings |

---

## 8. Files likely to change (Track A)

| File | Track A change |
|---|---|
| `lib/dev-hq/agent-execution-service.test.ts` | 1E-F4 + 1E-F5 tests |
| `lib/dev-hq/execution-manager.ts` | AR2-6 — `claimExecution`, `heartbeat` signatures |
| `lib/dev-hq/execution-manager.test.ts` | AR2-6 tests |
| `types/contracts/execution-runner.ts` | **AR2-6 — port contract** |
| `lib/dev-hq/adapters/dev-execution-runner.ts` | AR2-6 conformance |
| `lib/dev-hq/adapters/index.ts` | AR2-6 — composition root, stub substitution |
| `lib/dev-hq/agent-execution-service.ts` | AR2-6 — consume the injected port |

**Not changing in Track A:** `store.ts` (RAT-5 is triage-only), ADRs, `constants.ts`.

---

## 9. Implementation sequence

**Track A, strictly ordered — each gated before the next:**

1. **1E-F4** — smallest, one test, no production change. Proves the freeze/review machinery end to end at low cost.
2. **1E-F5** — three tests, no production change. Highest-value coverage; founder-facing site first.
3. **AR2-6** — **only production-behaviour change in Track A.** Port revision plus composition-root consumption. Requires Architecture Review against the stub-substitution criterion.
4. **RAT-5 triage** — document only; no code.

**Rationale:** items 1–2 are test-only, so a defect there cannot corrupt the baseline. AR2-6 is deliberately last because it is the only one that can.

---

## 10. Acceptance criteria

| ID | Criterion |
|---|---|
| **AC-1** | 1E-F4 test fails under the guard-removal mutation, passes on current implementation |
| **AC-2** | All three 1E-F5 tests fail under deletion of their specific site, **no count-only assertions** |
| **AC-3** | AR2-6 stub substituted via composition root; `handleExecutionRunning` **provably observes it**; test fails before the seam is consumed |
| **AC-4** | All five gates green: `tsc` · `eslint` · targeted · full suite · `next build` |
| **AC-5** | Test count increases by exactly the number of tests added; no existing test weakened |
| **AC-6** | Zero change to `store.ts`, ADRs, or either protected tag |
| **AC-7** | RAT-5 triage recorded with severity, ownership, proposed sprint, acceptance criteria |
| **AC-8** | Candidate freeze enforced by the §13 mechanism, **not prose** |
| **AC-9** | G-2 then G-3, both from separate clean sessions, both returning explicit terminal verdicts and written artifacts |

---

## 11. Required regression tests

| # | Test | Negative control |
|---|---|---|
| 1 | 1E-F4 guard | Remove guard → test fails |
| 2 | 1E-F5 escalation/revise site (`escalation-service.ts:293`) | Delete site → test fails |
| 3 | 1E-F5 review site (`review-service.ts:635`) | Delete site → test fails |
| 4 | 1E-F5 retry site (`agent-execution-service.ts:926`) | Delete site → test fails |
| 5 | AR2-6 port observation | Stub not observed → test fails |

**Every one must demonstrate its negative control by execution and record the result.** This
is the standard MAJOR-2 established after a test that appeared to pin a defect had silently
stopped doing so.

---

## 12. Validation commands

Recorded as literal command strings, per finding RAT-4:

```
npx tsc --noEmit
npx eslint .
npx vitest run lib/dev-hq/agent-execution-service.test.ts lib/dev-hq/execution-manager.test.ts lib/dev-hq/adapters/dev-execution-runner.test.ts
npx vitest run
npx next build
```

Baseline at entry: **tsc 0 · eslint 0 · targeted 97 · full 322 · build 0.**

---

## 13. Candidate-freeze procedure — ENFORCEABLE, not prose

**Chosen method: temporary immutable candidate tag + verified snapshot artifact.**

Rationale for choosing this over a worktree: the Sprint 1E failure mode was *concurrent
sessions sharing one working tree*. A worktree isolates the reviewer but does not make the
candidate **identifiable**; a tag pins exact bytes in the object database, where no session
can silently mutate them. Finding RAT-7: *"a freeze declared only in prose is not
enforceable."*

**Procedure:**

1. Commit the candidate to a **freeze branch** (`freeze/1f-<item>-<n>`) — the candidate becomes an immutable object, not a mutable working tree.
2. Tag it: `git tag candidate-1f-<item>-<n>`. **Tags are the freeze.**
3. Record: tag name, commit SHA, tree SHA, full-candidate diff hash, per-file SHA-256, diffstat, all five gate results **with literal commands**.
4. Reviewers review **`git show <tag>`** — never the working tree.
5. Re-verify the tag resolves to the same commit **immediately before** and **immediately after** each review.
6. **Stop conditions:** tag moves · commit differs · any candidate file differs from its recorded hash.
7. Delete the freeze tag only after Founder Approval; the reviewed bytes remain reachable via the review artifacts.

**Why this prevents the Sprint 1E failure:** the `3daf0790…` candidate mutated mid-review
because it existed only as working-tree state. A tagged commit cannot be altered by another
session writing files.

---

## 14. Independent Code Review procedure (G-2)

- **Runs from a separate clean Claude Code session.** Not negotiable: **seven consecutive in-session fresh spawns produced zero deliverables**; externally-commissioned reviews succeeded and one found MAJOR-1 by running its own probe.
- Reviews **`git show <candidate-tag>`**, never the working tree.
- **No shared working-tree writes while the review is active** — including documentation and evidence.
- **Must write a report artifact to disk** at `agents/independent-code-reviewer/outputs/`.
- **Must return exactly one terminal verdict:** `PASS` · `PASS WITH NON-BLOCKING FINDINGS` · `FAIL`.
- Findings at the four-level ladder: `BLOCKER` · `MAJOR` · `MINOR` · `OBSERVATION`.
- **Must inspect each negative control directly** and confirm it fails under mutation rather than accepting the implementer's recorded result.
- A reviewer that authored the specification **may not review it**.

---

## 15. Architecture Review procedure (G-3)

- **Runs only after G-2 closes** with a verdict. Founder-fixed permanent order.
- Separate clean session; reviews the tag; writes to `agents/architecture-reviewer/outputs/`.
- Terminal verdict required.
- **Scope:** ADR-0001 O6/D7 compliance · ADR-0002 E3 · Execution Manager purity · service/repository boundaries · timeline append-only property · **the AR2-6 stub-substitution criterion** · scope enforcement.
- **Disclosure requirement:** if AR-1E performs this review, its prior authorship of the negative-outcome policy and its AR2-6 ruling **must be disclosed in the artifact**, since it would be reviewing consequences of its own design decisions.

---

## 16. Founder decision points

**Blocking Track A:**

| # | Decision | Why it blocks |
|---|---|---|
| **F-A1** | **1E-F4 target** — the already-pinned X4 message branch, or the genuinely unpinned deferral guard? (§19 Conflict 1) | Determines whether the deliverable adds coverage or duplicates it |
| **F-A2** | **RAT-5 disposition** — record-only (your direction) or in-scope as the plan's AC-4? (§19 Conflict 4) | The two documents disagree |
| **F-A3** | **1E-F1 and 1E-F2** — the plan's register carries two items this package's register omits. In or out? (§19 Conflict 3) | Scope completeness |

**Blocking Track B (already open in the plan):** D-2/Q-1 (ADR-0003) · D-6 (dependencies) · D-7 (hosting) · D-8 (handbooks/standards) · D-9 (ADR-0002 E5 + PE-1 amendments) · Q-3, Q-4, Q-6, Q-7, Q-8.

---

## 17. Rollback and recovery plan

| Scenario | Recovery |
|---|---|
| Track A change fails review | Delete the freeze branch/tag. `sprint-1e-remediated` is untouched; nothing entered the protected baseline |
| Candidate mutates mid-review | Freeze tag detects it immediately (§13 step 5). Re-freeze, re-review. **No verdict is transferred across a mutation** — the Sprint 1E precedent |
| AR2-6 destabilises the execution path | AR2-6 is sequenced **last** and is the only production change in Track A. Revert its commit; items 1–2 are test-only and unaffected |
| Baseline needs restoration | `git checkout sprint-1e-remediated` — ratified, 0 blockers, all five gates green |
| Reviewer unobtainable | Do **not** relabel a weaker review. Halt and escalate — the Sprint 1E standard |

---

## 18. Unresolved research and ownership gaps

| Gap | Owner | Status |
|---|---|---|
| **In-session agent delivery failure** | Unknown | **UNRESOLVED.** 7 consecutive failures; 3 hypotheses proposed and all 3 eliminated by test. Mitigation (external sessions) works; **cause does not**. Will recur |
| Missing handbooks and standards | Director of Operations | OPEN — `INDEPENDENT_CODE_REVIEWER.md` absent though referenced; no `NAMING`/`LOGGING`/`ERROR_HANDLING` standards |
| Negative-outcome policy lives only in a review artifact | Lead Software Engineer | OPEN — plan's 1E-F1 |
| ADR-0003 not authored | Founder + LSE | OPEN — blocks Track B |
| Frontend test infrastructure absent | Lead Software Engineer | OPEN — no `.tsx` collection, no Playwright config |
| Trigger.dev idempotency semantics unverified | Lead Software Engineer | OPEN — several Sprint 1E correctness arguments depend on it, taken as stated |

---

## 19. Conflicts — recorded, not silently resolved

### Conflict 1 — `1E-F4` names different code in the two documents ⚠️ **MOST MATERIAL**

| Source | 1E-F4 target |
|---|---|
| **Founder direction + this package's register** | The **X4 truthful-message branch** — "falsely reports that an attempt is retrying when no agent is assigned" |
| **Mission Control Lite plan, Appendix B.1** | The **deferral-helper guard** `if (reason !== "no_agent_available") return;` — mutation M2 (`void reason;`) leaves all gates green |

**Evidence, verified in the ratified baseline:**
- The **truthful-message branch is already pinned** — `agent-execution-service.test.ts:1619-1620` asserts both `toContain("waiting for an available agent")` and `not.toContain("retrying as attempt")`.
- The **deferral guard is genuinely unpinned** — no test invokes `ensureAssignmentDeferredEvent` directly; the two `execution_not_queued` occurrences assert a *decision reason*, not the helper's silence.

**Recommendation: adopt the plan's target — the deferral-helper guard.** Implementing the
Founder's literal wording would duplicate existing coverage while leaving the real gap open.
The specification spends 24 lines arguing that guard must never be deleted, anticipating it
*"reads like dead weight to a later simplification pass"* — **and the comment is its entire
defence.**

*Optional:* keep the existing message assertions and add a mutation-verified negative control
for them, closing both readings. Low cost.

### Conflict 2 — `AR2-6` vs `1E-F3`: same item, two labels

The plan calls the `ExecutionRunner` port revision **1E-F3**; the Founder and this package
call it **AR2-6**. Identical scope.
**Recommendation:** adopt **AR2-6** (the Founder's term, and AR-1E's original finding ID);
record `1E-F3` as an alias. **Do not create two work items.**

### Conflict 3 — this package's register omits two items the plan carries

The plan's Appendix B.1 lists five: **1E-F1** (author `ERROR_HANDLING_STANDARD.md`),
**1E-F2** (`claimLost` message wording — *demonstrated false by probe* with an offline agent),
1E-F3, 1E-F4, 1E-F5. The committed register carries three plus RAT-5.
**Recommendation:** adopt all five. 1E-F1 is the higher value — the negative-outcome policy
governs four commits, two reviewers' verdicts and a Phase 2 constraint, yet exists only in a
review artifact. **Founder decision required (F-A3).**

### Conflict 4 — RAT-5 disposition

| Source | Disposition |
|---|---|
| **Founder direction** | **Record-only.** Triage; do not implement |
| **Plan Appendix B** | Same condition (§7 item 11) mapped to **§7.4 / AC-4** — an *acceptance criterion*, i.e. in scope |

**Recommendation: Founder direction governs — record-only.** The plan's AC-4 predates the
ratification and the explicit record-only instruction. **Requires F-A2** to settle, and the
plan's §7.4/AC-4 should be amended by its owner if record-only is confirmed.

### Conflict 5 — D-1 is stale

The plan lists **D-1** as *"Sprint 1E remediation disposition… `AWAITING FOUNDER APPROVAL`"*,
blocking 1F-3/1F-12/1F-15. It is now **ratified and committed** (`d922f379`).
**Recommendation:** mark **D-1 DISCHARGED**; unblock those items. Documentation-only, but the
plan currently understates 1F's readiness.

### Conflict 6 — the plan has no candidate-freeze or clean-session policy

§16 fixes the gate order and verdict vocabulary but contains **no** freeze mechanism and no
session-isolation rule — the two process failures that actually cost Sprint 1E time.
**Recommendation:** adopt §13–§15 of this package as the process addendum.

---

## 20. Phase 2 confirmation

**Roadmap Phase 2 implementation has NOT been started.** No Phase 2 code, scaffolding,
dependency, or schema exists in the working tree. `docs/plans/PHASE_2_PROGRAM_PLAN.md`
remains an untracked planning artifact, explicitly marked *"planning only, no implementation
authorized."* This package neither begins nor authorizes Phase 2 work.

---

## 21. Readiness verdict

**READY TO IMPLEMENT TRACK A — conditional on three Founder decisions (F-A1, F-A2, F-A3).**

**NOT READY for Track B** — blocked on D-2/Q-1 (ADR-0003), D-6, D-7, and absent frontend
test infrastructure.

**Unresolved blockers to Track A: 0 technical, 3 decision.** No technical blocker exists;
the baseline is ratified, all five gates are green, and the work is well-specified. What is
missing is a settled answer to *which* code 1E-F4 pins, and whether RAT-5 and 1E-F1/F2 are
in scope.

---
---

# ADDENDUM A — Coordinator reconciliation pass (2026-07-26)

**Status: NOT FINALIZED.** Two parallel read-only audits (Mission Control UX/roadmap
consistency; repository implementation/dependency) are pending. Per Founder instruction this
package is not final until they are incorporated or recorded unavailable.

## A.1 AUTHORITATIVE SOURCE AVAILABILITY — four of six are ABSENT

Verified by repository-wide search. **These were named as controlling authorities; they
cannot be reconciled against because they do not exist as readable artifacts.**

| # | Named source | Status | Evidence |
|---|---|---|---|
| 1 | Repository + verified command output | **AVAILABLE** | Used throughout |
| 2 | Approved ADRs and recorded decisions | **AVAILABLE** | `docs/decisions/ADR-0001…`, `ADR-0002…` |
| 3 | **Permanent Operating Handbook** | **ABSENT** | No file. `GOVERNANCE_UPDATE_PLAN.md:46` records it *"Confirmed absent by the research backlog's own repository-wide search (E-1a) and independently by 1F I-6"* |
| 4 | **Current Progress Update** | **ABSENT** | Same finding, same line |
| 5 | **Master Roadmap v8.0** | **ABSENT — and a version conflict** | No file. **Every reference in the repository cites v7.1** (13 occurrences). **v8.0 is referenced nowhere.** v7.1 is itself recorded absent by the same governance finding |
| 6 | **Sprint 1F Preparation Handoff** | **ABSENT — no trace** | No file, and **no document references it**, unlike 3–5 which are at least cited |

**Consequence.** The instruction to reconcile against sources 3–6 **cannot be executed**. This
is recorded rather than worked around. No content has been inferred, reconstructed, or
invented for any absent source.

**Escalation — a governance finding, not a coordination inconvenience.** Three documents are
treated as controlling authority across the planning corpus while not existing in the
repository. Any claim of the form *"per the Master Roadmap"* is currently unverifiable.
Founder decision **F-A4**.

## A.2 Evaluation of the required 15-step implementation order

Verified against repository state, ADRs, and the Mission Control Lite plan. **The order is
sound in dependency terms.** Four corrections.

| Step | Verdict | Evidence / correction |
|---|---|---|
| 1 — architecture-reviewer artifact registered, committed separately | **ALREADY SATISFIED** | `handbooks/ARCHITECTURE_REVIEWER.md` (29,106 B) committed in **`f6caf4c`** *"docs(dev-hq): add architecture reviewer handbook"*, separate from any implementation commit. `.claude/agents/architecture-reviewer.md` and `agents/architecture-reviewer/AGENT.md` also committed. **Verification-only; no work required** |
| 2 — 1E-F4 | **BLOCKED ON F-A1** | Target disputed. The behaviour the Founder describes is **already pinned** at `agent-execution-service.test.ts:1619-1620`. See §19 Conflict 1 |
| 3 — 1E-F5 | Correct | Founder-facing `escalation-service.ts:293` first, per `ISSUE_MATRIX.md:89` |
| 4 — AR2-6 + production consumption | Correct, **and correctly placed before step 5** | Only Track A production change; read models over an inert port would rest on an unproven seam |
| 5 — server-side read models, safe UI projections | **CORRECTION** | Depends on **D-2/Q-1 (ADR-0003)** — persistence and transport undecided. Cannot start until approved |
| 6 — Mission Control shell and navigation | **CORRECTION** | Depends on **G-1 Design review** (plan §16.1), which must run *before* implementation of any surface. Absent from the stated order |
| 7 — core operational views + honest unavailable states | Correct | Aligns with plan §5, §13 |
| 8 — PWA, reconnect, accessibility, notifications | **CORRECTION** | Depends on **D-6** (web-push dependency) and **D-7** (HTTPS hosting); gated by **G-4 Security review** |
| 9 — RAT-5 only if approved | Correct | Matches record-only status; see F-A2 |
| 10 — full validation | **CORRECTION** | **Track B cannot be validated today.** `vitest.config.ts` is `environment: "node"` with `include: ["**/*.test.ts"]` — **no `.tsx` collected**; `@playwright/test` present but **no config, no e2e directory**. Frontend test infrastructure (plan 1F-18) must precede step 10 |
| 11 — freeze in dedicated worktree + tag | **Correct and endorsed** | Directly answers RAT-7 |
| 12 — Independent Code Review | Correct | Must be a **separate clean session** |
| 13 — Architecture Review after ICR closes | Correct | Founder-fixed permanent order; plan §16.1 |
| 14 — Founder approval | Correct | |
| 15 — commit + protected checkpoint | Correct | |

**Net:** the dependency logic is correct. It **understates four prerequisites** — G-1 before
step 6, ADR-0003 before step 5, frontend test infrastructure before step 10, and D-6/D-7/G-4
before step 8.

## A.3 Workstream boundaries

| Workstream | Owns | Must not touch |
|---|---|---|
| **Track A** | 1E-F4, 1E-F5, AR2-6, RAT-5 triage; files in §8 | Any UI surface; `store.ts`; ADRs; protected tags |
| **Track B** | Views, shell, IA, PWA, read models | `lib/dev-hq/` execution internals beyond read-model additions; Execution Manager purity |
| **Governance** | Handbooks, standards, ADR numbering | Source, tests, sprint scope |
| **Coordinating session** | Planning, freeze, evidence, routing | **All implementation files** |

**Hard rule from Sprint 1E:** no shared working-tree writes while either review gate is
active — including documentation and evidence.

## A.4 Candidate-freeze commands and ownership

**Owner: coordinating session.** No other session may create, move, or delete a candidate tag.

```
git worktree add ../savrio-review-1f <freeze-branch>
git switch -c freeze/1f-<item>-<n>
git add <explicit paths only>
git commit -m "freeze(1f): <item> candidate <n>"
git tag candidate-1f-<item>-<n>
git rev-parse candidate-1f-<item>-<n>
git rev-parse candidate-1f-<item>-<n>^{tree}
git show candidate-1f-<item>-<n> | sha256sum
```

Record tag, commit SHA, tree SHA, candidate hash, per-file SHA-256, diffstat, and all five
gate results with literal commands. Re-verify the tag immediately before **and** after each
review. **Never `git add -A`.**

**Stop conditions:** tag moves · commit differs · any file hash differs · worktree mutated.

## A.5 Independent Code Review contract (G-2)

| Clause | Requirement |
|---|---|
| Session | **Separate clean Claude Code session** — seven consecutive in-session spawns produced zero deliverables |
| Target | `git show candidate-1f-<item>-<n>` — **never** the working tree |
| Artifact | **Must write to** `agents/independent-code-reviewer/outputs/` |
| Verdict | **Exactly one:** `PASS` · `PASS WITH NON-BLOCKING FINDINGS` · `FAIL` |
| Severity | `BLOCKER` · `MAJOR` · `MINOR` · `OBSERVATION` |
| Negative controls | **Must verify each independently by mutation**, not accept the implementer's result |
| Independence | A reviewer that authored the specification may not review it |
| Concurrency | No shared working-tree writes while active |

## A.6 Architecture Review contract (G-3)

Same session, artifact, verdict and concurrency clauses, writing to
`agents/architecture-reviewer/outputs/`. **Runs only after G-2 returns a verdict.**

**Scope:** ADR-0001 O6/D7 · ADR-0002 E3 · Execution Manager purity · service/repository
boundaries · timeline append-only property · **the AR2-6 stub-substitution criterion** ·
scope enforcement.

**Disclosure:** if AR-1E performs this review, its authorship of the negative-outcome policy
and its AR2-6 ruling **must be disclosed in the artifact**.

## A.7 Founder decisions — with recommendations

| # | Decision | Recommendation |
|---|---|---|
| **F-A1** | 1E-F4 target | **Adopt the plan's target** — the deferral-helper guard. The Founder's literal wording is already pinned at `test:1619-1620`; implementing it duplicates coverage and leaves the real gap open |
| **F-A2** | RAT-5 in or out | **DEFER — record-only.** Pre-existing; `store.ts` untouched by the remediation. Note the Mission Control plan maps the same condition into **AC-4**, i.e. in scope — that conflict needs settling either way |
| **F-A3** | 1E-F1 / 1E-F2 in or out | **Adopt 1E-F1** — the negative-outcome policy governs four commits, two reviewers' verdicts and a Phase 2 constraint yet exists only in a review artifact. **1E-F2** is cheap; adopt if capacity allows |
| **F-A4** | Absent authorities (§A.1) | **Resolve before Track B.** Either produce them or strike them from the authority chain. **Track A does not depend on them** |
| **F-A5** | Is AR2-6 a prerequisite to Mission Control? | **YES.** It is the only Track A production change and makes the injected port actually consumed. Read models over an inert seam rest on an unproven contract that ADR-0001 D7 designates as what a durable adapter must meet |
| **F-A6** | Sprint 1F = Mission Control Lite, not Phase 2 analytics? | **CONFIRM.** `PHASE_2_PROGRAM_PLAN.md` is untracked and planning-only; no Phase 2 code exists. Scorecards recommended **out** by the plan's own Q-6 |
| **F-A7** | Worktree + immutable tag as permanent freeze policy | **ADOPT PERMANENTLY.** RAT-7: *"a freeze declared only in prose is not enforceable."* The `3daf0790…` candidate mutated mid-review, costing a full cycle and a FAIL verdict |
| **F-A8** | Safe projections before persistence | **Only what `DevHqState` exposes today** — tasks, executions, assignments, events (200-cap), evidence, escalations, projected reviews, reviewFindings. Anything requiring durable history renders `unavailable`, **not empty or zero** |
| **F-A9** | States that must render unavailable | Timeline beyond the 200-event ring (RAT-5 makes it lossy) · cost/context/checkpoint data (**D-5/Q-4 source unknown**) · scorecards (out of scope) · roadmap/sprint/release entities (**D-3/Q-3 undefined**) |
| **F-A10** | Does any Rank-A research item block implementation? | **UNDETERMINED — cannot answer honestly.** `docs/research/RESEARCH_BACKLOG.md` is untracked and was not read this pass; the pending repository/dependency audit should classify it. Recorded unavailable rather than guessed |

## A.8 Agent status table

| Agent | Role | Status | Next gate |
|---|---|---|---|
| Coordinating session | Main Coordinator | **ACTIVE** — planning only | Incorporate the two audits |
| Implementation engineer | Track A / Track B | **IDLE** — not authorized | Step 2, after F-A1 |
| Independent Code Reviewer | G-2 | **IDLE** | Step 12, separate clean session |
| Architecture Reviewer | G-3 | **IDLE** | Step 13, after G-2 closes |
| Claude Design Engineer | G-1 | **IDLE** | Before step 6 |
| Security owner | G-4 | **IDLE** | Before step 8 hosted deployment |
| UX / roadmap audit | Read-only | **PENDING** | Not yet received |
| Repository / dependency audit | Read-only | **PENDING** | Not yet received |

## A.9 Phase 2 confirmation — re-verified this pass

**Roadmap Phase 2 implementation has NOT started.** `git status` shows zero modifications to
`lib/`, `types/`, `app/`, `components/`, `trigger/`, or `docs/decisions/`.
`PHASE_2_PROGRAM_PLAN.md` remains untracked and marked planning-only. No Phase 2 code,
scaffolding, dependency, or schema exists.

---
---

# ADDENDUM B — Status update (Founder-recorded, 2026-07-26)

**The entry package remains OPEN and NOT FINALIZED.** Four active-stream outputs are still
awaited.

## B.1 Track A obligation status

| ID | Status | Notes |
|---|---|---|
| **1E-F4** | ✅ **COMPLETE and ACCEPTED** | Founder-accepted. Closes decision F-A1 |
| **1E-F5** | 🟢 **AUTHORIZED and ACTIVE** | Implementation in progress. Founder-facing `escalation-service.ts:293` first, per `ISSUE_MATRIX.md:89` |
| **AR2-6** | ⬜ Not started | Sequenced after 1E-F5; the only Track A production change |
| **RAT-5** | ⬜ Record-only | Pending **F-A2**; not authorized into scope |

**Full Track A validation: PENDING** — cannot run until 1E-F5 completes. The five-gate
sequence in §12 is not yet applicable to a complete Track A candidate.

## B.2 Candidate freeze — NOT AUTHORIZED

The §13 / §A.4 freeze procedure (dedicated review worktree + immutable candidate tag) is
**specified but not authorized to execute.** No freeze branch, candidate tag, or review
worktree may be created until the Founder authorizes it.

Consequently **G-2 and G-3 have no valid target**, and both reviewers remain idle.

## B.3 ⚠️ Baseline-tag identity discrepancy — ESCALATED, NOT VERIFIED

**A discrepancy has been identified in baseline-tag identity and escalated to the Governance
Baseline Agent.** It is unresolved.

> **Standing instruction, effective immediately: do NOT claim that both tags are verified.**

**Correction to this package's own prior statements.** Earlier sections of this document, and
the coordinating session's prior reports, repeatedly asserted that both `sprint-1e-baseline`
and `sprint-1e-remediated` were verified and unmoved. **Those assertions are withdrawn as
unverified pending the Governance Baseline Agent's determination.** They were made in good
faith from `git rev-parse` output, but that check confirms only what a tag *currently
resolves to* — it does not establish that the tag is the *correct* identity for the artifact
it names, which is what is now in question.

Until the escalation closes:

- Tag state may be **reported as observed** (`git rev-parse` output, quoted as an observation).
- Tag state may **not be characterized as verified, confirmed, or intact.**
- No protected-baseline claim may rest on tag identity alone.
- **Owner:** Governance Baseline Agent. Not the coordinating session; not resolvable here.

## B.4 Governance follow-up — agent delivery and authority mismatch

| Item | Detail |
|---|---|
| **LSE delivery failures 8 and 9** | Two further `lead-software-engineer` non-deliveries, bringing the recorded total to **nine**. Consistent with the unresolved pattern in `WORKFLOW_DIAGNOSIS.md` §4d–4e; root cause still **UNKNOWN** after three eliminated hypotheses |
| **Read-only authority mismatch** | A mismatch between an agent's declared read-only authority and its observed behaviour. **Governance follow-up; owner is the governance workstream, not this session** |

Both are recorded here for the entry package's completeness and are **not** Track A or Track
B deliverables.

## B.5 Blocked and unauthorized — unchanged

| Item | Status |
|---|---|
| **Track B** | **BLOCKED** — ADR-0003 (D-2/Q-1), D-6, D-7, absent frontend test infrastructure |
| **Mission Control implementation** | **NOT AUTHORIZED** |
| **Roadmap Phase 2** | **NOT STARTED** — re-confirmed; no code, scaffolding, dependency, or schema |
| **Candidate freeze** | **NOT AUTHORIZED** (§B.2) |
| **G-2 / G-3 reviews** | **IDLE** — no valid target exists |

## B.6 Awaiting — four active-stream outputs

The package cannot be finalized until all four are incorporated or explicitly recorded
unavailable:

1. Mission Control UX and roadmap consistency audit — **PENDING**
2. Repository implementation and dependency audit — **PENDING**
3. 1E-F5 implementation completion — **ACTIVE**
4. Governance Baseline Agent determination on tag identity — **ESCALATED**

## B.7 Updated agent status

| Agent | Role | Status |
|---|---|---|
| Coordinating session | Main Coordinator | **ACTIVE** — planning and recording only |
| Implementation engineer | Track A | **ACTIVE on 1E-F5** |
| Independent Code Reviewer | G-2 | **IDLE** — no authorized candidate |
| Architecture Reviewer | G-3 | **IDLE** — blocked behind G-2 |
| Claude Design Engineer | G-1 | **IDLE** |
| Security owner | G-4 | **IDLE** |
| **Governance Baseline Agent** | Tag identity | **ACTIVE — escalation open** |
| UX / roadmap audit | Read-only | **PENDING** |
| Repository / dependency audit | Read-only | **PENDING** |

---
---

# ADDENDUM C — Four workstream results incorporated (2026-07-26)

**Package remains OPEN and NOT FINALIZED.** Awaiting the final Track A validation report.

## C.0 ⚠️ CORRECTION — §A.1's roadmap-absence finding is WITHDRAWN as stale

**§A.1 recorded Master Roadmap v8.0, the Permanent Operating Handbook, the Current Progress
Update and the Sprint 1F Preparation Handoff as ABSENT.** That finding was accurate when
made and is **now stale for five of the six rows.** Verified present this pass:

| Artifact | Size | Tracked |
|---|---|---|
| `docs/roadmap/MASTER_ROADMAP.md` — **v8.0, with provenance** | 128,931 B | untracked |
| `docs/governance/PERMANENT_OPERATING_HANDBOOK.md` | 32,093 B | untracked |
| `docs/governance/CURRENT_PROGRESS_UPDATE.md` | 39,350 B | untracked |
| `docs/governance/AUTHORITY_AND_CONTRADICTION_REGISTER.md` | 40,149 B | untracked |
| `docs/governance/GOVERNANCE_BASELINE_REVIEW_PACKET.md` | 22,299 B | untracked |
| `docs/plans/SPRINT_1F_PREPARATION_HANDOFF_INTAKE.md` | 6,580 B | untracked |

Roadmap v8.0 carries a registration record naming a Founder-supplied source document.
**Roadmap conformance has now been performed. The absence finding is withdrawn.**

**Still absent:** the *original* Sprint 1F Preparation Handoff. The file above is an
**intake**, not the original.

## C.1 ⚠️ CORRECTION — Track A authorization was in force; audits observed stale state

The Repository Audit and the Governance report observed Track A while their local decision
state was stale. **Decisions already in force at that time:**

| Decision | State |
|---|---|
| **F-A1** | **APPROVED — the stronger 1E-F4 truthful-message regression target** |
| **F-A2** | **RAT-5 deferred, record-only** |
| **F-A3** | **1E-F1 selected** |
| 1E-F4 | **ACCEPTED** |
| 1E-F5 | **EXPLICITLY AUTHORIZED** |

> **The Track A test changes must NOT be classified as unauthorized** on the grounds that an
> audit reported those decisions unsettled. The audits were reading stale state, not
> observing a governance breach.

**The shared-working-tree concurrency finding remains VALID** and is unaffected by this
correction. It is the same condition RAT-7 recorded and §13/§A.4 exist to remedy.

**Note on F-A1:** the Founder approved the *stronger* target — the truthful-message
regression. This supersedes the coordinator's §19 Conflict 1 recommendation, which had
argued for the deferral-guard target on coverage grounds. **Founder ruling governs.**

## C.2 Workstream results

| # | Workstream | Result |
|---|---|---|
| 1 | **DESIGN-002** | **COMPLETE** |
| 2 | **DESIGN-003** | **COMPLETE.** Roadmap conformance performed. **UX verdict remains UX BLOCKED, substantially narrowed** |
| 3 | **Repository Implementation Audit** | **COMPLETE.** Track A **engineering-ready**; Track B **not ready** |
| 4 | **Governance Baseline** | **PACKAGED, CONDITIONALLY READY, NOT APPROVED** |
| 5 | **Track A** | 1E-F4 complete · 1E-F5 implementation **appears complete** · **final full validation report PENDING** · **no candidate freeze authorized** |

## C.3 Design reconciliation — recorded

- Roadmap-absence finding **withdrawn as stale**; roadmap conformance **complete**.
- **FD-2 retired**; its remaining authority-tier issue **consolidated into ACR-001 X-8**.
- **FD-11 closed** — Evidence Viewer is roadmap-required.
- **M-7 through M-12** have Design-owned remediation directions.
- **Mission Control Lite vs Phase 2: CONFIRMED** (closes F-A6).
- **Design agent is IDLE**; no further Design pass needed yet.

### Remaining UX blockers

| ID | Blocker |
|---|---|
| **FD-1** | Approve DESIGN-001 as the Sprint 1F design baseline, with required addenda |
| **FD-3** | Amend ADR-0002 E5 so authoritative timeline assembly is **not performed in the browser** |
| **FD-4** | Settle deployment expectations vs non-durable persistence |
| **FD-5** | Choose the authentication mechanism |
| **FD-6** | Approve required dependencies |
| **FD-7** | Resolve NB-1 / mobile Family B scope |
| **FD-26** | Resolve roadmap-required phone actions not represented in the domain |
| **ACR-001 X-8** | Establish roadmap and handbook authority tier |

### Required Design addenda

View 21 sign-in surface · unauthenticated shell · expired-session and re-authentication flow ·
permission/refusal behaviour · **six-way distinction** among *disconnected, unavailable,
unauthenticated, expired, refused, server failure* · **session expiry during a decision must
become `UNCONFIRMED`, not `FAILED`** · **no fabricated role hierarchy** · additions must
preserve DESIGN-001 structure and vocabulary.

> The `UNCONFIRMED`-not-`FAILED` rule is the same class of correctness the Sprint 1E
> remediation enforced: a record must not assert something the system does not know. A
> decision whose session expired mid-flight has an *unknown* outcome, and reporting it as
> failed would be an untruth of the X4 class.

## C.4 Repository audit — Track B prerequisites

1. Authentication and authorization for Founder-authority routes
2. Persistence, transport and authentication architecture decision (ADR-0003)
3. React/component test capability
4. Playwright or equivalent browser testing
5. **AR2-6 seam design and adapter-substitution acceptance test**
6. Safe authoritative server projections
7. Explicit unavailable-state contracts
8. **The 200-event cap must NOT be confused with RAT-5 event-key retention** — two distinct
   conditions: the ring caps *events*; RAT-5 concerns *keys* never trimmed on eviction

**RAT-5 remains DEFERRED.**

## C.5 Governance results — recorded

- **Roadmap v8.0 present with provenance.**
- **Permanent Operating Handbook remains a DRAFT.**
- **The original Sprint 1F Preparation Handoff remains UNAVAILABLE** (an intake exists; it is
  not the original).
- **The governance package is NOT APPROVED.**
- **Contradiction-register identifiers were affected by concurrent writers and require
  reconciliation.**
- **Do not claim all authority precedence is settled.**

> Concurrent writers corrupting identifiers in the *contradiction register* is the
> shared-working-tree failure reaching the governance layer — the same root condition as the
> `3daf0790…` mid-review mutation.

## C.6 Current posture

| Item | Status |
|---|---|
| Repository writers | **HALT REQUESTED.** This session is read-only and has written no implementation file. **It cannot halt other sessions** |
| **Three Track A test files** | **PRESERVED, untouched** — `agent-execution-service.test.ts`, `escalation-service.test.ts`, `review-service.test.ts` (matching the three 1E-F5 emission sites) |
| Final Track A validation report | **AWAITED** |
| Candidate freeze | **NOT AUTHORIZED** |
| Independent Code Review | **NOT LAUNCHED** |
| Track B | **NOT AUTHORIZED** |
| Mission Control implementation | **NOT AUTHORIZED** |
| Phase 2 | **NOT STARTED** |
| Baseline-tag identity | **ESCALATED — not claimed verified** (§B.3 stands) |

## C.7 Queued — isolated candidate-freeze procedure

**Not prepared yet; queued behind the final Track A validation report,** per instruction.
On arrival it will specify: one dedicated implementation worktree · one narrow Track A
candidate commit · one immutable **annotated** candidate tag · one detached clean review
worktree · **proof the reviewer is inspecting the exact candidate**.

---
---

# ADDENDUM D — Governance follow-up results (2026-07-26)

**Package remains OPEN and NOT FINALIZED.** Awaiting the final Track A validation report.

## D.1 TAG IDENTITY — RESOLVED. The reported mismatch did not exist.

**Determination: verification-method error.** Not stale documentation, not tag mutation, not
a naming conflict, not repository corruption.

Both `sprint-1e-baseline` and `sprint-1e-remediated` are **annotated tags**. An annotated tag
resolves to a *tag object*, which must be **peeled** with `^{commit}` to reach the commit.
**The earlier report compared tag-object SHAs against peeled commit SHAs** — two different
kinds of identifier — and read the difference as a mismatch.

**Verified identities:**

| Command | Result |
|---|---|
| `git rev-parse sprint-1e-baseline^{commit}` | `62f629128e…` |
| `git rev-parse sprint-1e-remediated^{commit}` | `d922f3794a…` |

Remote tag evidence agrees.

**Impact:** Sprint 1E baseline provenance **intact** · Sprint 1E remediation integrity
**intact** · Track A **unaffected** · **no tag repair or movement required**.

**Escalation closure:** the prior tag-integrity escalation closes **when the proper authority
records this determination.** This entry records the result; it does not itself constitute
closure.

**§B.3 is superseded on the factual question.** The standing instruction *"do not claim both
tags are verified"* was correct while the escalation was open and is now discharged by this
determination. The coordinating session's own observations used the peeled form
(`^{commit}`) throughout and are consistent with the verified identities above.

**X-19 remains OPEN — as a future-policy issue only:**

> No approved standard currently requires peeled-tag verification, and none prevents future
> tag movement.

That is a genuine gap. The mismatch here was a false alarm, but nothing in the standards
would have prevented a *real* one, nor mandated the peeling discipline that would have
avoided the false alarm in the first place.

## D.2 X-25 — AGENT CONFIGURATION FINDING — recorded as VALID

| Element | Finding |
|---|---|
| Charter | The `lead-software-engineer` charter **requires feature implementation** |
| Actual definition | `.claude/agents/lead-software-engineer.md` grants `Read, Glob, Grep, Bash, WebFetch, Skill` — **no `Write`, no `Edit`** |
| Consequence | **The role cannot serve as implementation owner as currently configured** |

**Explicitly NOT claimed:** that this caused delivery failures 8 and 9. **Root cause of the
delivery failures remains UNKNOWN.** X-25 is a configuration/charter contradiction that
stands on its own evidence; the delivery-failure investigation eliminated the tool-boundary
hypothesis in `WORKFLOW_DIAGNOSIS.md` §4b and it has not been revived. Conflating the two
would repeat the error that section exists to prevent.

**Founder decision required (F-A11):**

1. **Expand** the agent's tool authority to match the implementation charter; or
2. **Narrow** the charter and treat the agent as advisory / read-only.

**The agent definition must NOT be modified yet.**

## D.3 CONCURRENT WRITER FINDING — recorded

Multiple sessions again edited the same shared working tree and **collided on governance
register identifiers.**

This is the third recorded instance of the same root condition: the `3daf0790…` candidate
mutating mid-review (RAT-7), the seven-file planning churn during Sprint 1E freeze windows,
and now identifier collision in the contradiction register. **It has now reached the
governance layer.**

**Confirms the required controls:**

- **One writer per worktree**
- **Isolated implementation worktrees**
- **Immutable candidate tags**
- **Detached review worktrees**
- **No shared mutable candidate during review**

These are exactly §13 / §A.4 / §C.7, and they strengthen the case for **F-A7** — adopting the
worktree-plus-immutable-tag freeze as *permanent* policy rather than a per-sprint measure.

## D.4 Current status

| Item | Status |
|---|---|
| Governance documents | **Updated** |
| Committed | **Nothing** |
| Tags | **Unchanged** — and now determined intact (D.1) |
| Three Track A test files | **Preserved** |
| Track B | **BLOCKED** |
| Mission Control implementation | **NOT AUTHORIZED** |
| Independent Code Review | **NOT LAUNCHED** |
| Candidate freeze | **NOT AUTHORIZED** |
| Phase 2 | **NOT STARTED** |
| This session | **READ-ONLY**, awaiting the final Track A validation report |

---
---

# ADDENDUM E — Founder rulings (2026-07-26)

**Package remains OPEN and NOT FINALIZED.** Awaiting the final Track A validation report.

## E.1 F-A3 — RESOLVED and CLOSED

**Ruling: 1E-F1 selected.** Author `ERROR_HANDLING_STANDARD.md`, promoting the
negative-outcome policy out of a review artifact and into `standards/`.

**1E-F2** (the `claimLost` message wording, demonstrated false by probe) is **outside Track A
and remains deferred** unless separately authorized later.

**F-A3 is removed from the open Founder-decision list.**

## E.2 F-A7 — APPROVED. Permanent candidate-freeze policy adopted.

**Worktree plus immutable annotated tag is now permanent policy**, not a per-sprint measure.

### Permanent rules

1. **One writer per implementation worktree.**
2. **Reviewers inspect a detached clean worktree at the immutable candidate tag.**
3. **No shared mutable candidate checkout.**
4. **Any candidate change invalidates the affected approval.**
5. **A changed candidate receives a new commit and a new candidate tag** — never a moved tag.
6. **Protected baseline tags never move.**

### Why this is the right shape, recorded for future readers

Rules 4 and 5 are the ones the Sprint 1E history actually paid for. The `3daf0790…`
candidate mutated while a review was in flight; because the freeze existed only in prose,
there was no mechanism to invalidate the in-flight verdict, and the review returned `FAIL` on
candidate identity after the work was already committed. Rule 4 makes invalidation automatic
rather than a judgement call. Rule 5 removes the temptation that causes the damage — moving a
tag to "re-point" at corrected work destroys the evidence that the reviewed bytes ever
existed.

Rule 3 addresses the condition recorded three times in this package: the mid-review mutation
(RAT-7), planning-artifact churn during freeze windows, and identifier collision in the
contradiction register (§D.3).

**This policy supersedes §13 and §A.4 as the governing procedure.** Those sections remain as
the derivation; where they differ in detail, the six rules above govern.

## E.3 F-A11 — REMAINS OPEN, deferred past Track A

**The `lead-software-engineer` agent definition must NOT be modified during Track A.**

**After Track A is frozen**, present two options:

1. **Expand** `Write`/`Edit` authority to match the implementation charter; or
2. **Narrow** the charter and formally classify the role as **advisory / read-only**.

**Standing constraint, restated:** do **not** claim the authority mismatch caused delivery
failures 8 and 9. **Root cause remains UNKNOWN.** The tool-boundary hypothesis was tested and
eliminated (`WORKFLOW_DIAGNOSIS.md` §4b); X-25 stands on its own evidence as a
charter/configuration contradiction and must not be retrofitted as an explanation for the
delivery failures.

## E.4 Open Founder decisions — updated

| # | Decision | Status |
|---|---|---|
| ~~F-A1~~ | 1E-F4 target | **CLOSED** — stronger truthful-message target approved |
| **F-A2** | RAT-5 scope | **DEFERRED, record-only** (standing) |
| ~~F-A3~~ | 1E-F1 / 1E-F2 | **CLOSED** — 1E-F1 selected; 1E-F2 deferred |
| **F-A4** | Absent authorities | Largely discharged by §C.0; the *original* Handoff remains unavailable |
| ~~F-A5~~ | AR2-6 prerequisite | Recommendation stands; sequenced in Track A |
| ~~F-A6~~ | Mission Control Lite vs Phase 2 | **CLOSED** — confirmed (§C.3) |
| ~~F-A7~~ | Permanent freeze policy | **CLOSED — APPROVED** (§E.2) |
| **F-A8 / F-A9** | Safe projections; unavailable states | Open — Track B |
| **F-A10** | Rank-A research blocking | Open — undetermined |
| **F-A11** | LSE tool authority vs charter | **OPEN — deferred past Track A freeze** |
| **UX** | FD-1, FD-3, FD-4, FD-5, FD-6, FD-7, FD-26, ACR-001 X-8 | Open |
| **Governance** | Package approval · Handbook draft → approved · register identifier reconciliation | Open |

## E.5 Next gate

**Wait for the final Track A validation report.** On arrival, prepare the isolated candidate
freeze under the E.2 permanent policy.

**Not authorized:** Independent Code Review · Track B · Mission Control implementation ·
Phase 2.

---
---

# ADDENDUM F — Track A freeze executed; Independent Code Review PASSED (2026-07-26)

## F.1 Candidate — frozen under the F-A7 permanent policy

| Item | Value |
|---|---|
| **Tag** | `candidate-1f-tracka-1` — **annotated**, immutable |
| **Commit** | `d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7` |
| **Tree** | `d9eef724baba10932f0cb3c4c6be6658993610a6` |
| **Review worktree** | `C:\Users\evanj\Documents\Projects\savrio-review-1f-tracka-1` — detached, clean |
| Content | 3 test files · **330 insertions · 0 deletions** · 5 pure-insertion hunks · **no production source** |

Files: `agent-execution-service.test.ts` (196) · `escalation-service.test.ts` (60) ·
`review-service.test.ts` (74). Staged by explicit path only; all planning, governance,
validation, research, roadmap and agent-output files excluded and left untracked.

## F.2 Independent Code Review — **PASS WITH NON-BLOCKING FINDINGS**

| Field | Value |
|---|---|
| **Verdict** | **`PASS WITH NON-BLOCKING FINDINGS`** |
| Candidate | `candidate-1f-tracka-1` / `d1c86e95…` / tree `d9eef724…` |
| **BLOCKER** | **0** |
| **MAJOR** | **0** |
| Validation | Independently re-run and passed |
| Negative controls | **All required controls verified independently by the reviewer** |

**Founder ruling: do NOT modify or refreeze the candidate for MINOR-1 or MINOR-2.** The
candidate stands as reviewed. Under F-A7 rule 4, any change would invalidate this approval
and require a new commit and a new tag; the minors do not justify that cost.

## F.3 Candidate integrity across the review window — VERIFIED

The first end-to-end exercise of the F-A7 policy. Checked after the review closed:

| Check | Result |
|---|---|
| `candidate-1f-tracka-1^{commit}` | `d1c86e95…` — **unchanged** |
| `candidate-1f-tracka-1^{tree}` | `d9eef724…` — **unchanged** |
| Review worktree HEAD | `d1c86e95…` — matches the tag |
| Review worktree detached | **YES** |
| Review worktree dirty entries | **0** — negative-control mutations fully reverted |
| Protected baseline tags (peeled) | `62f629128e…` / `d922f3794a…` — unmoved |

**The Sprint 1E failure mode did not recur.** The `3daf0790…` candidate mutated mid-review
because the freeze existed only in prose; this one was pinned by an annotated tag and a
detached worktree, and the verdict is bound to bytes that provably did not move. **The policy
worked as designed on its first use.**

## F.4 Architecture Review — AUTHORIZED

Against **the same detached, clean review worktree** at `candidate-1f-tracka-1`. Runs now
that G-2 has closed, per the Founder-fixed permanent order.

### Flagged for Architecture Review

| # | Item |
|---|---|
| 1 | **`execution.assignment_deferred` dedupe-key residual risk** |
| 2 | **Site-numbering drift** |
| 3 | **Shared-message coupling** |
| 4 | **F5-C ordering dependency** |

**Coordinator note on why these four belong at the architecture gate rather than the code
gate.** Each is a property of the *relationship between* emission sites rather than of any
single site's implementation — which is precisely the class of defect that produced MAJOR-2:
two sites sharing a dedupe key made a single-site assertion satisfiable from the wrong
source. Items 1 and 3 are that same coupling seen from two directions; item 4 makes a test's
validity depend on emission order, which is a design property, not a test property; item 2 is
the numbering collision already recorded in `ISSUE_MATRIX.md` (the six-row candidate table
versus AR-1E's emitting-site scheme, which *"has already caught two readers"*).

**Disclosure requirement stands:** if AR-1E performs this review, its authorship of the
negative-outcome policy and its AR2-6 ruling must be disclosed in the artifact.

## F.5 Status

| Item | Status |
|---|---|
| Track A candidate | **FROZEN, ICR PASSED** |
| Architecture Review | **AUTHORIZED — awaiting verdict** |
| Founder Approval | Pending AR |
| AR2-6 | Not started |
| Track B | **NOT AUTHORIZED** |
| Mission Control implementation | **NOT AUTHORIZED** |
| Phase 2 | **NOT STARTED** |
| This session | **READ-ONLY**, awaiting the Architecture Review verdict |

---
---

# ADDENDUM G — Both gates closed; Founder approval requested (2026-07-26)

## G.1 Final gate status

| Gate | Verdict |
|---|---|
| **Independent Code Review** | **`PASS WITH NON-BLOCKING FINDINGS`** |
| **Architecture Review** | **`APPROVE WITH FINDINGS`** |

| Check | Result |
|---|---|
| Candidate identity | **Verified** |
| Candidate unchanged across **both** gates | **Verified** — tag→commit `d1c86e95…`, tag→tree `d9eef724…` |
| Content | 3 test files · 330 insertions · 0 deletions · **no production source** |
| TypeScript · ESLint · `next build` · `git diff --check` | **PASS** |
| Full Vitest | **326 / 326 across 22 files** |
| BLOCKER · MAJOR | **0 · 0** |
| Architecture change required before approval | **None** |
| **Residual risk** | **LOW** |

**Both gates reviewed byte-identical bytes.** The F-A7 freeze policy held through two
sequential independent reviews — the failure mode that produced the Sprint 1E `FAIL` on
candidate identity did not recur.

## G.2 ⚠️ REVIEW-ARTIFACT LOCATION DISCREPANCY — preservation at risk

**The Architecture Review report is NOT at the path recorded by the Founder.**

| Expected | `agents/architecture-reviewer/outputs/AR_1F_TRACKA_CANDIDATE_1_REVIEW.md` — **ABSENT** |
|---|---|
| **Actual** | `../savrio-review-1f-tracka-1/agents/architecture-reviewer/outputs/AR_1F_TRACKA_CANDIDATE_1_REVIEW.md` |
| Size | **45,143 bytes**, written 15:00 |
| State | **Untracked, inside the detached review worktree** |

**This is architecture follow-up #5 manifesting concretely** — the review-agent
artifact-writing / tool-authority mismatch. The reviewer wrote its report where it had write
access: the review worktree.

### The risk, stated plainly

> **`git worktree remove ../savrio-review-1f-tracka-1` would silently and permanently destroy
> the Architecture Review report.**

It is untracked, so nothing in git protects it. Post-approval step 1 is *"preserve both review
reports"* — and one of the two currently exists **only** inside a worktree whose entire purpose
is to be disposable.

**Coordinator recommendation, not executed (this session remains read-only):** copy the report
into the main worktree at the expected path **before** any worktree cleanup, and commit it with
the Independent Code Review report as part of the integration step.

**Does this affect approval integrity?** **No.** The candidate is tracked; the report is
untracked. `candidate-1f-tracka-1` still peels to commit `d1c86e95…` and tree `d9eef724…`,
byte-identical to what both reviewers inspected. The worktree's single dirty entry **is** this
report — not a candidate mutation.

## G.3 Architecture follow-ups — recorded, candidate NOT modified

| # | Follow-up |
|---|---|
| 1 | **Event ordering** relies on millisecond timestamps, stable sort behaviour, and insertion order. A future persistence adapter needs an **explicit sequence or tie-break contract** |
| 2 | **Planning records should identify emission sites by function and semantic identity**, not fragile line numbers or inconsistent site numbering |
| 3 | **The execution-attempt dedupe key is intentional** and must not be changed to include emitter provenance **without ADR-level review** |
| 4 | **Shared assignment-deferred wording is appropriate** — there is one canonical emitter |
| 5 | **Review-agent artifact-writing / tool-authority mismatch** — separate governance follow-up. See §G.2, where it has now produced a live preservation risk |

Follow-up 3 is notable: it **closes** the dedupe-key question rather than leaving it open. The
key is ruled intentional, and changing it is now gated behind an ADR — which converts the
residual risk flagged into G-3 into a governed constraint.

## G.4 Founder approval recommendation

> ### APPROVE Sprint 1F Track A candidate 1 **unchanged**.

**Approval scope — exactly this and nothing more:**

- 1E-F4 truthful reclaim-message regression coverage
- 1E-F5 coverage for the three previously unpinned assignment-deferral call sites
- **Candidate commit `d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7` only**

**Explicitly NOT in this approval:** AR2-6 · Track B · Mission Control · governance artifacts ·
Phase 2.

### Post-approval sequence

1. **Preserve both review reports** — ⚠️ see §G.2; the AR report must be recovered from the
   review worktree **before** cleanup
2. Advance the candidate commit through the approved integration procedure
3. Create or update the protected Track A checkpoint
4. Verify the integrated commit and tags
5. Update Current Progress and this entry package
6. **Do not start AR2-6** until separate authorization

**This session remains READ-ONLY until Founder approval is recorded.**

---
---

# ADDENDUM H — TRACK A CLOSED (Founder approval recorded, 2026-07-26)

## H.1 Verified closure

| Item | Value |
|---|---|
| **1E-F4** | **COMPLETE** |
| **1E-F5** | **COMPLETE** |
| Candidate | `candidate-1f-tracka-1` |
| **Approved commit** | `d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7` |
| **Approved tree** | `d9eef724baba10932f0cb3c4c6be6658993610a6` |
| Independent Code Review | **PASS WITH NON-BLOCKING FINDINGS** |
| Architecture Review | **APPROVE WITH FINDINGS** |
| **Founder approval** | **RECORDED** |
| **Protected checkpoint** | **`sprint-1f-tracka-approved`** → same commit and tree |
| Review evidence commit | `926e3e01` |
| Review worktree | **REMOVED after byte-identical evidence preservation** |
| Blocking findings | **0** |
| Residual risk | **LOW** |
| **Candidate changed after approval** | **NO** |

3 test files · 330 insertions · 0 deletions · no production source. 326/326 tests across 22
files; `tsc`, `eslint`, `next build`, `git diff --check` pass.

**Non-blocking findings are recorded as follow-ups and were NOT used to modify the frozen
candidate**, per Founder direction.

## H.2 Governance resolutions

| Item | Resolution |
|---|---|
| **Tag identity** | **RESOLVED** — annotated-tag-object versus peeled-commit confusion. A verification-method error, not mutation or corruption. **Supersedes §B.3's standing instruction**, which was correct while the escalation was open and is now discharged |
| **F-A3** | **RESOLVED** — 1E-F1 selected; 1E-F2 out of scope |
| **F-A7** | **APPROVED — permanent policy**, and now proven: both gates reviewed byte-identical bytes and the Sprint 1E identity-FAIL mode did not recur |
| **F-A11** | **OPEN** — X-25 charter/tool-authority mismatch. **Not claimed as the cause of delivery failures 8 and 9; root cause UNKNOWN** |

## H.3 Remaining state

**Track B: BLOCKED.** **Not started and not authorized:** AR2-6 · Mission Control
implementation · frontend testing · authentication · Phase 2.

**Superseded within this package:** §19 Conflict 1 (F-A1 ruled for the stronger target) ·
§B.3 (tag instruction discharged) · §E.4 rows for F-A3 and F-A7 (both closed) · §13 and §A.4
(superseded by the E.2 permanent policy).

---
---

# ADDENDUM B — Supersession note on §A.1 (governance documentation pass, 2026-07-26)

**Appended, not rewritten.** §A.1 above is left exactly as authored. It was accurate when
written and is retained as the finding that caused the governance baseline to be built.
This note records what changed afterwards. Precedent: commit `9069c12`, which superseded
`CANDIDATE_3DAF_FREEZE.md` by appending rather than editing.

**§A.1 rows 3–6 are now partly superseded.**

| # | §A.1 said | Now |
|---|---|---|
| 3 | **Permanent Operating Handbook — ABSENT** | **DRAFTED** at `docs/governance/PERMANENT_OPERATING_HANDBOOK.md` (POH-001 v0.1.0). **Consolidation only, and still unapproved** — 15 rules, every one cited to an existing authority, 4 marked `PROPOSED` and therefore non-binding. No rule was invented and none was promoted from a recommendation |
| 4 | **Current Progress Update — ABSENT** | **CREATED** at `docs/governance/CURRENT_PROGRESS_UPDATE.md` (CPU-001), grounded only in verified repository state at HEAD `9069c12` |
| 5 | **Master Roadmap v8.0 — ABSENT, and a version conflict** | **RESOLVED.** The Founder-supplied `Savrio_Dev_HQ_Master_Roadmap_v8.0_Canonical.docx` was located and registered at `docs/roadmap/MASTER_ROADMAP.md` (source SHA-256 `52a79925…`). §A.1's observation that *"every reference in the repository cites v7.1"* was correct; those references have been re-pointed where the cited section was confirmed present in v8.0. **The version question it raised is not closed** — whether v7.1-derived conclusions carry forward is ACR-001 **X-17** |
| 6 | **Sprint 1F Preparation Handoff — ABSENT, no trace** | **STILL ABSENT.** Re-searched this pass across the repository and the user profile's `Downloads`, `Documents`, `Desktop`, and `OneDrive` trees. Not found. **Nothing was reconstructed for it.** Whether this package *is* it under another name is a Founder identity ruling — ACR-001 **X-20** |

**What §A.1's escalation F-A4 asked for is now partly answered.** Three of the four
authorities exist; two of the three are drafts awaiting approval; one is still missing. The
escalation itself is **not discharged** — the underlying question F-A4 raised, *what authority
these documents carry*, is unresolved and is ACR-001 **X-8**.

**Two further corrections to this package, recorded not applied:**

1. **§19 Conflict 1 and §A.2 step 2 remain live.** F-A1 is unanswered.
2. **§A.8's agent status vocabulary** (`ACTIVE` / `IDLE` / `PENDING`) differs from Master
   Roadmap v8.0 Appendix F, which has no `PENDING`. Recorded as ACR-001 **X-18**; this
   package is not edited to conform, because neither vocabulary is approved.

**Also superseded elsewhere, verified this pass:** §19's reliance on the governance
workstream's **X-2** (gate order inverted) is stale — the 1F plan owner corrected §16.1, and
X-2 is discharged. **X-1b** (the ADR-0001 D8 misquote) was likewise corrected in the 1F plan's
§3.1 and Q-6.

**Nothing in this addendum authorizes work.** Track A still awaits F-A1/F-A2/F-A3; Track B is
still blocked; Phase 2 has still not started.
