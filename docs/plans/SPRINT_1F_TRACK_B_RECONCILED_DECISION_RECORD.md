# Sprint 1F Track B — Reconciled Decision Record and Authorization Requests

**Status:** PLANNING ONLY. Uncommitted. Nothing implemented. No formal Architecture Review occurred.
**Date:** 2026-07-26 · **Coordinator:** sole writer this pass
**Protected state:** HEAD `fb6f4a3` · `sprint-1e-baseline` `62f6291` · `sprint-1e-remediated` `d922f379` · `sprint-1f-tracka-approved` = `candidate-1f-tracka-1` = `d1c86e95`

---

# 0. Record corrections and advisory provenance

## 0.1 CORRECTION — Architecture advisory coverage WAS obtained

A prior record in `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` Part 10 stated that all three
advisers returned nothing and that architecture advisory coverage was **not obtained**.
**That is corrected: the Architecture Track B Advisory was returned and is a completed
advisory input.**

**It is an advisory input only. No formal Architecture Review occurred, and none is claimed.**

## 0.2 Provenance limitation — stated rather than glossed

**The coordinator could not locate the Architecture Advisory artifact.** It is not in the
session scratchpad and not findable under `Projects/`. The Architecture Adviser wrote outside
the repository — correct behaviour, and it preserved repository read-only state — but also
outside coordinator visibility.

**Every architecture finding in this record is therefore reconciled from the Founder's
transmitted summary of that advisory, not from the document itself.** Where this record states
an architecture position, the provenance is *Founder-transmitted AR advisory*, not
*coordinator-read AR advisory*. Anyone auditing this record should obtain the original.

## 0.3 Design Adviser file-write violation — recorded separately

| Field | Detail |
|---|---|
| Agent | `design-recon-1f` (Claude Design Engineer, read-only adviser) |
| Instruction given | Explicit, bolded: holds `Write`/`Edit`, **forbidden to use them**; return recommendations as message text only |
| Actual behaviour | Wrote `docs/plans/SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md`, 49,709 bytes, at 15:30:04 |
| Tracked-state impact | **None** — the file is untracked; 0 tracked modifications resulted |
| Coordinator error alongside it | The coordinator reported *"read-only constraint held"* on the basis of zero **tracked** modifications. An untracked file **was** created. Those are different claims and were wrongly collapsed |
| Second coordinator error | The coordinator reported Design advisory coverage as **not obtained**. It was obtained; the file simply post-dated the check |

**Contrast — the Architecture Adviser handled this correctly** by writing outside the
repository, preserving repository read-only state exactly as intended.

**Lead for the delivery-failure investigation, recorded as a lead and not a conclusion:**
at least one of the ten "non-delivering" agents was working the whole time and delivered
through a channel the coordinator was not checking. This does **not** explain agents lacking
`Write` tools, and three hypotheses remain eliminated in `WORKFLOW_DIAGNOSIS.md`. Root cause
remains **UNKNOWN**.

## 0.4 Scratchpad is not durable project evidence

Session-scratchpad artifacts (`CANDIDATE_*.diff`, hunks, hashes, logs) are **not** durable
project evidence and are not cited as such. Copying any of them into the repository requires
separate authorization and has not been performed.

---

# OUTPUT 1 — Final Founder Decision Record

All eight decisions **ACCEPTED** as recommended, with the Founder's stated conditions binding.

| # | Decision | Resolution | Binding conditions |
|---|---|---|---|
| **ACR-001 X-8** | Authority tier | **ACCEPTED** — Roadmap = strategic direction, **subordinate to ADRs on architecture**; Handbook = operating procedure | Roadmap **tracked** as authoritative planning artifact where appropriate. Handbook **remains DRAFT** — promotion requires separate governance review and explicit Founder approval, **not combined with Track B authorization** |
| **FD-3** | ADR-0002 E5 amendment | **ACCEPTED** — server-side timeline assembly | **Subject to Architecture Reviewer confirmation before implementation** that the projection has an explicit deterministic ordering and tie-break contract |
| **FD-4** | Persistence posture | **ACCEPTED** — non-durable operational view | Sprint 1F must describe current state precisely as **single-process and ephemeral across process restart**. **Must not be represented as durable production truth** |
| **FD-5** | Authentication | **ACCEPTED conditionally** — single-user credential + signed server-enforced session | **NOT implementation-ready** until the exhaustive clean-session route audit completes. Coupled with FD-4 |
| **FD-6** | Dependencies / test infra | **ACCEPTED** — auth + DOM-capable component testing + Playwright config; `web-push` deferred | Must include real component, browser/E2E, accessibility, mobile-viewport, auth-state, reconnect, and failure-state coverage. **Playwright already installed — needs configuration, scripts, tests** |
| **FD-7** | NB-1 / mobile Family B | **ACCEPTED** — fix NB-1 before phone-reachable escalation actions | Separately authorized remediation. Until it passes deterministic tests: mobile escalation resolution **read-only** |
| **FD-26** | Unsupported phone actions | **ACCEPTED** — expose only Founder actions backed by authoritative domain commands | Unsupported actions **absent, disabled with truthful explanation, or view-only**. See §1.1 — the Design Adviser materially narrows this |
| **FD-1** | DESIGN-001 baseline | **ACCEPTED** — conditional on addenda | Addenda authored before implementation of any surface |
| **Item 9** | FD-5 route audit | **YES** — commission exhaustive clean-session read-only audit | Must **enumerate every reachable mutating route**, not sample structure. No fixes during audit |
| **Item 10** | Governance | Roadmap **tracked**; Handbook **stays draft** | Not combined with Track B authorization |

## 1.1 Design Adviser correction to FD-26 — adopted

The Design Adviser **disagrees with the package's FD-26 option C** ("ship UI affordances that
are visibly unavailable") on a narrow, correct ground:

> **"A disabled control still asserts that the capability exists"** and is merely blocked right
> now. FD-1's six-way state contract governs **data** states and does **not** license rendering
> a control for a capability for which the domain has no command.

**Adopted.** For `pause`, `resume`, and `request-change` the correct rendering is **no control
at all**, plus one sentence naming what is not recorded. Authority cited: DESIGN-001 §19.12
rule 2 (no control that does not take effect), §11.12 rule 5, AC-19.

**Package option C is struck as written and re-scoped to data states only.** This is consistent
with the Founder's own condition that unsupported actions remain "absent, disabled with truthful
explanation, or view-only" — the adviser sharpens *which* of those three applies to a capability
the domain cannot express at all.

## 1.2 Founder action scope — Sprint 1F

| Action | Disposition |
|---|---|
| Approve / reject | **Supported** after auth, provenance, CSRF, idempotency |
| Escalation accept / revise / abandon | **Supported** after NB-1 and route hardening |
| Request-change | **Deferred** |
| Pause | **Deferred** |
| Resume | **Deferred** |
| Priority | **Read-only** |

**No unsupported action may appear as a working control. All four missing actions are recorded
as APPROVED-ABSENT for Sprint 1F, not silently omitted.**

---

# OUTPUT 2 — Advisory Reconciliation Matrix

| Topic | Decision Package (coordinator) | Design Advisory | AR Advisory (Founder-transmitted) | Repository Audit | **Reconciled position** |
|---|---|---|---|---|---|
| **FD-26 unsupported actions** | Option C permitted showing disabled controls | **Disagrees** — a disabled control asserts capability exists; render **no control** | — | — | **Design wins.** No control for domain-absent capabilities |
| **Timeline assembly** | Amend E5 to server-side | Agrees; adds that only the assembling layer knows truncation, so a browser truncation marker is a **false claim** | Agrees; adds full projection contract | **Timeline read model does not exist in code** | **Server-side. Must be built, not moved** |
| **Ordering** | Flagged as needing a contract | — | **Monotonic append sequence; order by `(timestamp, sequence)`; sequence = pagination cursor; no raw-ID lexicographic tie-break** | — | **AR position adopted** |
| **Retention** | Noted 200-cap and RAT-5 as distinct | Truncation marker must not render before full assembly | **200-event behaviour is destructive retention, not a read limit**; evicted keyed events permanently blocked from reappearing | — | **Requires a fresh Founder decision — see §2.1** |
| **Snapshot races** | Not identified | — | **Add monotonic read-model version; client refuses older snapshots** — POST responses and the 3s poll can race and roll the UI backward | `useDevHqState.ts` polls every 3000 ms | **Adopted. This is a defect the package missed** |
| **AR2-6 shape** | `Promise<Execution \| null>` | — | **Discriminated outcome, not `\| null`**; port must accept `assignmentId` | Port omits `assignmentId`; adapter drops it | **AR position adopted — see Output 4** |
| **UNCONFIRMED** | Correctness requirement in UX clothing | **One entry path, one exit. Only control is `Sign in and check`. No retry at any breakpoint** — *"a 'Try again' button after an unconfirmed accept/abandon is the thing that fires NB-1"* | Ambiguous outcome → UNCONFIRMED, never FAILED; no automatic retry | — | **Design + AR agree; adopted verbatim** |
| **Six-way states** | Required, unspecified | Specifies copy and **accessible-name prefixes**: `Not signed in:` `Session expired:` `Refused:` `Server error:` `Not connected:` `Not instrumented:`; **401/403 must not increment `consecutiveFailures`** | Typed transport failure discriminant; auth responses must not masquerade as network failures | Six states not representable through current feed | **Adopted. Requires a typed discriminant — new work** |
| **NB-1** | Confirmed defect; fix first | Mobile: approvals resolvable, escalations notify-and-read | **Revise path already uses the guarded pattern; the primitive exists; fix is likely narrow** | — | **Separately authorized narrow remediation** |
| **CR-1** | Not in package | — | **Predictable review-callback IDs; require CSPRNG before phone-reachable** | — | **Added to FD-7 scope** |
| **Playwright** | "approve Playwright config" | — | — | **Already installed, unconfigured** | **Narrowed: configure, don't add** |
| **Component testing** | `jsdom` | — | Separate DOM-capable project; **must not alter the node project** and risk the 1E baseline | `vitest.config.ts` `environment: "node"` | **Separate Vitest project — do not modify the existing one** |

---

# OUTPUT 3 — Exhaustive FD-5 Mutating-Route Audit Specification

**Commissioned from a separate clean read-only session. Not performed by this coordinator.**

## Why exhaustive, not sampled

The existing `SPRINT_1F_REPOSITORY_IMPLEMENTATION_AUDIT.md` samples route structure. FD-5
requires an **inventory**. The precedent is specific: during Sprint 1E the coordinator refuted a
finding by searching for `middleware.ts`, finding none, and concluding no production boundary
existed — **while `proxy.ts` provided exactly that boundary.** An absence-claim from a
name-search is how that error happened, and FD-5's evidence currently has the same shape.

## Required method

Enumerate from the **filesystem**, not from documentation or memory: every `route.ts` under
`app/api/**`, plus every `"use server"` action. For each, read the file and record what is
present — never infer from naming.

## Required output — one row per reachable mutating route

| Column | Content |
|---|---|
| Stable route path | e.g. `POST /api/dev-hq/escalations/[id]/abandon` |
| File:line | Handler location |
| Mutates? | What state changes |
| Founder authority? | Does it carry an approval-class decision |
| Identity protection | Present / absent, with the exact mechanism and line |
| Authorization behaviour | Distinct from authentication; what is checked |
| Provenance behaviour | What actor is recorded; **flag any hardcoded/fabricated Founder attribution** |
| Idempotency | Key present? Replay-safe? |
| CSRF / cross-origin posture | Any protection |
| `proxy.ts` coverage | Does the production matcher cover it |
| Required remediation | Precise, per route |

## Constraints

Read-only. **No fixes during the audit.** No file writes inside the repository — return findings
as the session's message output, or write outside the repository. Do not modify tags, Sprint 1E,
or Track A state.

## Completion criterion

The audit is complete only when it can state: *"Every `route.ts` under `app/api/**` and every
`"use server"` action was opened and read; N mutate state; M of those carry Founder authority;
K have no identity check."* **A statement that cannot be made in that form is a sample, not an
inventory.**

---

# OUTPUT 4 — Final AR2-6 Seam Contract and Acceptance Criteria

**Status: carried-forward backend architecture prerequisite. NOT ordinary cleanup.**

## 4.1 Why the seam must be repaired before it is consumed

The current `ExecutionRunner` port is **weaker than the manager it fronts**:

| Layer | `heartbeat` signature | Consequence |
|---|---|---|
| Manager | accepts `assignmentId` | Assignment identity is the **stale-worker guard** |
| **Port** | **does not accept it** | The guard is inexpressible through the contract |
| Adapter | **drops it** | A conforming adapter silently loses the guard |

Consuming the seam as-is would wire production to a contract that cannot express its own
safety property. **Repair precedes consumption.**

## 4.2 `claimExecution` outcome contract — Founder decision required

Replace `Promise<Execution | null>` with a **discriminated outcome**. `null` conflates
distinct conditions and cannot be exhaustively checked by the compiler.

**Proposed outcomes — three:**

| Outcome | Meaning |
|---|---|
| `claimed` | Compare-and-set succeeded; carries the `Execution` |
| `lost_to_concurrent_claim` | Another attempt won the race — the F1 stand-down path |
| `agent_unavailable` | The agent was not available for a reason other than a concurrent claim |

**Open question the Founder must resolve:** are these three exhaustive, or is a fourth
explicit outcome required? Candidate fourth: **`execution_not_claimable`** — the execution left
`queued` before the claim was attempted. Today that condition throws (caller fault under the
negative-outcome policy) and is guarded by the caller. **Coordinator recommendation: keep three.**
Adding a fourth would migrate a caller-fault condition into the anticipated-outcome union and
weaken the policy that Sprint 1E established. If the Architecture Reviewer disagrees, its
position should govern — this is architecture, not coordination.

## 4.3 Atomic scope — all of it or none

1. **Port** — discriminated `claimExecution` outcome; `heartbeat(executionId, assignmentId)`; required assignment identity on relevant callback handlers
2. **Adapter** — conform; stop dropping `assignmentId`
3. **Composition root** — enable stub substitution
4. **Service consumption** — production actually consumes the injected port
5. **Tests** — including the substitution proof

**Explicitly excluded:** no new event emission inside Execution Manager (ADR-0002 E3, purity) ·
**no changes to `store.ts`** · no authentication · no timeline · no Mission Control components ·
no frontend infrastructure · no NB-1 remediation · no Phase 2.

## 4.4 Acceptance criteria

| # | Criterion |
|---|---|
| **A1** | Discriminated outcome replaces `\| null`; every call site handles each variant; no non-exhaustive check |
| **A2** | `heartbeat(executionId, assignmentId)` on port and adapter; assignment identity preserved end-to-end |
| **A3** | Required assignment identity on the relevant callback handlers |
| **A4** | Substituting a **stub runner through the composition root changes observable behaviour** — proving production consumes the injected seam |
| **A5** | **Negative control: the substitution test FAILS on the pre-AR2-6 tree.** Demonstrated by execution and recorded |
| **A6** | No emission added inside `execution-manager.ts`; purity preserved |
| **A7** | `store.ts` byte-unchanged |
| **A8** | All five gates green; test count rises by exactly the tests added; no existing test weakened |
| **A9** | Frozen under the F-A7 policy: one implementation worktree, narrow commit, immutable annotated tag, detached clean review worktree |

**A5 is the load-bearing one.** The port is currently wired but inert, so a test that passes
today proves nothing. A criterion that cannot fail before the fix is not a criterion — the exact
lesson MAJOR-2 taught in Track A.

---

# OUTPUT 5 — ADR-0002 E5 Amendment Draft

**Draft for Architecture Reviewer refinement and Founder ratification. Not an approved ADR change.**

## Current text (`ADR-0002…md:151-154`, verbatim)

> The **execution timeline** is a derived read-model, not a new store. It merges — by
> timestamp, per execution/task — events, evidence, `AgentAssignment` transitions,
> reviews/findings, and escalations into one ordered stream (timestamp, kind, actor, summary,
> refs), **assembled in the Mission Control view-model layer**.

## Proposed amendment

> The **execution timeline** is a derived read-model, not a new store. It merges — by
> `(timestamp, sequence)`, per execution/task — events, evidence, `AgentAssignment`
> transitions, reviews/findings, and escalations into one ordered stream, **assembled
> server-side and served as an explicit projection**.
>
> **Assembly authority.** The server assembles the authoritative timeline. The frontend
> **renders and paginates only**: it does not merge record types and does not choose causal
> ordering. Audit history the server cannot attest to is not audit history.
>
> **Deterministic ordering.** Each appended record receives a **monotonic sequence assigned
> server-side**. Ordering is `(timestamp, sequence)`. **Raw ID lexicographic ordering must not
> be used as a tie-break.** The sequence is the pagination cursor.
>
> **Truncation is explicit.** The projection carries truncation metadata — `hasMore`,
> `truncated`, `earliestRetained`. Only the assembling layer knows whether a retention boundary
> was reached; a client-rendered truncation marker is a false claim.
>
> **Projection boundary.** `AgentAssignment` receives a deliberate public projection. Internal
> fields — including `waitTokenId` — **must not cross the public DTO boundary**. Server-derived
> fields — `currentOwner`, `nextGate`, `blockers` — remain server-owned and are never computed
> client-side.

## 5.1 ⚠️ New Founder decision required — RAT-5 and destructive retention

The AR advisory establishes something the earlier RAT-5 framing understated:

> **The 200-event behaviour is destructive retention, not merely a read limit.** Old events are
> evicted; keyed-event records are retained in the dedupe index; **an evicted keyed event can
> then be permanently blocked from reappearing.**

RAT-5 was deferred as record-only when the timeline was a browser concern. **It is now load-bearing
for an authoritative server-side audit projection.** A timeline that is the foundation of audit
history cannot rest on a store that silently and irreversibly drops records.

**This does not reopen Track A.** It is a new question about Track B's timeline.

**Decision required:** does RAT-5 remain deferred, or does it enter scope as a prerequisite for
the authoritative timeline? **Coordinator recommendation: it must be resolved before the timeline
is built** — not necessarily fixed, but explicitly decided, with the retention limit disclosed in
the projection if it is not fixed.

---

# OUTPUT 6 — Mission Control Architecture and Design Addenda Requirements

## 6.1 Architecture addenda (Architecture Reviewer owns; Founder ratifies)

| # | Addendum |
|---|---|
| **AA-1** | ADR-0002 E5 amendment (Output 5), including the ordering and tie-break contract FD-3 is conditional on |
| **AA-2** | Monotonic read-model version; **client refuses to apply a snapshot older than the one it holds**. Required because POST responses and the 3s poll race and can roll the UI backward |
| **AA-3** | Typed transport failure discriminant distinguishing all six states. **Authentication responses must not increment or masquerade as network failures** |
| **AA-4** | Authentication and authorization contract (§6.3) |
| **AA-5** | Idempotency contract for every mutating Founder route |
| **AA-6** | Retention/truncation contract, contingent on the RAT-5 decision (§5.1) |

## 6.2 Design addenda (Design owns; Founder accepts)

Per the Design Advisory §C. **~85% is mechanism-independent and approvable now**; four items
are contingent on FD-5.

| # | Addendum | Blocked by |
|---|---|---|
| **DA-1** | View 21 sign-in surface + unauthenticated shell | — |
| **DA-2** | Re-authentication sheet; destination preservation | — |
| **DA-3** | Six-way failure taxonomy with copy and **accessible-name prefixes** — `Not signed in:` `Session expired:` `Refused:` `Server error:` `Not connected:` `Not instrumented:` | — |
| **DA-4** | **Expiry-during-decision → `UNCONFIRMED`.** One entry path, one exit. **Only control: `Sign in and check`. No retry at any breakpoint** | — |
| **DA-5** | `SessionStatus` / `RefusalReason` tokens; four `ActionabilityNotice` states; six forbidden strings | — |
| **DA-6** | Snapshot retention across 401/403; **401/403 must not increment `consecutiveFailures`** | — |
| **DA-7** | Capability-absent rendering: **no control**, plus one sentence naming what is not recorded. `Not recorded` (field exists, no value) must **not** be reused for capability-absent (no field) | — |
| **DA-8** | No fabricated role hierarchy; no cause a response does not support | — |
| **DA-C1–C4** | Credential control; inline-vs-redirect re-auth; whether an `expiring` state renders; whether sign-in failure may name a cause | **FD-5** |

**DA-4's "no retry" is a safety control, not a UX preference.** The Design Adviser's reasoning:
*a "Try again" button after an unconfirmed accept/abandon is the thing that fires NB-1.*

## 6.3 Authentication and authorization contract — required content

Authenticated principal establishment · **authorization distinct from authentication** ·
authenticated actor provenance · **removal of fabricated hardcoded Founder attribution** ·
session behaviour · **CSRF or equivalent cross-origin mutation protection** · typed transport
outcomes · **idempotency for every mutating Founder route** · ambiguous submission outcomes ·
process-restart disclosure · durability posture · deployment mode.

**The `proxy.ts` production block must not be removed or relaxed before authentication and
authorization exist.** It is currently the only control standing between the approval routes
and the internet.

## 6.4 Frontend test infrastructure — narrowed

| Item | Correct scope |
|---|---|
| Playwright | **Already installed.** Needs configuration, scripts, tests — not a new dependency |
| Component testing | **Separate DOM-capable Vitest project** + Testing Library or equivalent. **Must not alter the existing node project** and risk the Sprint 1E regression baseline |
| Accessibility | Automation **and** manual validation |
| Required coverage | Session-expiry-mid-decision · reconnect · duplicate submission · mobile viewports · all six failure-state distinctions |

---

# OUTPUT 7 — Implementation Authorization Requests

## AUTHORIZATION REQUEST A — AR2-6 only

**Requested scope:** the atomic AR2-6 change in Output 4 §4.3 — port, adapter, composition
root, service consumption, tests — as one commit under the F-A7 freeze policy.

**Explicitly NOT included:** authentication · timeline implementation · Mission Control
components · frontend infrastructure · NB-1 remediation · Phase 2.

**Prerequisites the Founder must resolve first:**

| # | Prerequisite | Status |
|---|---|---|
| A-P1 | `claimExecution` outcome contract — three outcomes, or is a fourth required? | **OPEN — Founder** (coordinator recommends three; defer to AR if it disagrees) |
| A-P2 | Atomic scope confirmed as Output 4 §4.3 | **Ready to confirm** |
| A-P3 | Applicable error-handling authority | **OPEN** — the negative-outcome policy still lives only in a review artifact (1E-F1 selected but not authored) |
| A-P4 | Exact implementation owner under F-A11 / X-25 | **OPEN** — the `lead-software-engineer` charter requires implementation; its definition grants no `Write`/`Edit` |
| A-P5 | Acceptance criteria | **Ready** — Output 4 §4.4 |
| A-P6 | One-writer worktree and review plan | **Ready** — F-A7 policy, proven in Track A |

**Three of six are open. A-P4 is the sharpest:** there is currently no agent configured to
perform implementation. That must be resolved before an implementer can be named.

## AUTHORIZATION REQUEST B — Track B / Mission Control

**BLOCKED.** Remains blocked until **all** of:

1. FD-3 architecture finalized (AA-1, including the ordering contract)
2. Timeline ordering **and retention** contracts finalized — **requires the RAT-5 decision (§5.1)**
3. FD-4 and FD-5 finalized **together**
4. **Exhaustive route audit complete** (Output 3)
5. Failure discriminant designed (AA-3)
6. NB-1 disposition authorized
7. FD-6 finalized
8. FD-26 finalized
9. Required Design addenda ready

**Not requested at this time.**

---

# 8. Standing state

**Not started, not authorized:** AR2-6 · Mission Control · authentication · frontend
infrastructure · NB-1 remediation · Phase 2.
**Not modified:** Sprint 1E · Track A · any protected tag · `store.ts` · any ADR.
**Not staged, not committed.** All advisory artifacts preserved.
