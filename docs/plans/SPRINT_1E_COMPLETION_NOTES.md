# Sprint 1E Completion Notes — Reliability, Evidence, Review Loops & Audit

**Document ID:** SPRINT-1E-COMPLETION

**Version:** 1.0.0

**Status:** Approved — trusted Sprint 1E baseline

**Date:** 2026-07-26

**Branch:** `feature/sprint-1d-execution-manager`

**Baseline HEAD:** `e67adda`

**Authority:** ADR-0002, GOV-001

## Authoritative Sources

| Source | Location |
| --- | --- |
| Approved technical plan | `docs/plans/SPRINT_1E_REVIEW_AND_RELIABILITY.md` (TMP-002) |
| Independent Code Review | `agents/independent-code-reviewer/outputs/SPRINT_1E_CODE_REVIEW.md` (CR-001) |
| Architecture Commit-Gate Review | `agents/architecture-reviewer/outputs/SPRINT_1E_ARCHITECTURE_REVIEW.md` (AR-001) |

---

# 1. Sprint Summary

## Original Sprint Objective

Quoted verbatim from the approved plan:

> Make execution trustworthy and auditable, quality-check completed work within
> hard bounds, and escalate to the founder when automation is exhausted — all
> additively, with the founder-request workflow and public API shapes preserved,
> memory as the only backend, and simulated deterministic agents/reviewers only.

## Implementation Scope Completed

Status against the plan's approved ten-task decomposition. See §6 and Escalation
PE-1 for why the plan's numbering and the Founder scope decision disagree.

| Task | Plan title | Status |
| --- | --- | --- |
| 1E-1 | Events + Evidence | **Complete** |
| 1E-2 | Callback idempotency | **Complete** |
| 1E-3 | Scheduled lease sweeper | **Complete** |
| 1E-4 | Agent health freshness | **Complete** |
| 1E-5 | Escalations | **Complete** |
| 1E-6 | Review domain and store | **Complete** |
| 1E-7 | Review and revision loop | **Complete** — the loop is fully implemented. The plan's own 1E-7 bullet also requires "dispatch route + server action accept an override"; that override is **deferred by Founder decision** and verified genuinely absent |
| 1E-8 | Execution timeline and audit history | **Deferred to Sprint 1F** by Founder decision (PE-2) |
| 1E-9 | Mission Control data exposure | **Partial, remainder deferred to Sprint 1F** (PE-2) — `DevHqState` additively carries `evidence`, `escalations`, `reviews` (projected), `reviewFindings`; the timeline read-model and view-model extension are deferred |
| 1E-10 | Validation and completion notes | **Complete** — full validation green including production build; this document is the completion record |

Delivered capabilities:

- Lifecycle event emission and a durable `EvidenceStore` (1E-1)
- Execution callback idempotency keyed on `assignmentId` (1E-2)
- Scheduled stale-lease sweeper and reclaim route (1E-3)
- Agent health derived from heartbeat freshness (1E-4)
- First-class `Escalation` domain, store, raise/resolve logic and founder routes
  (1E-5)
- Durable `ReviewStore` and adapter; `review-service` with the bounded revision
  loop; the `agent-review` durable Trigger task; the token-guarded
  `/api/dev-hq/internal/review/complete` callback; review-liveness recovery with
  bounded re-dispatch and `reviewer_unresponsive` escalation; revision-chain
  iteration tracking; policy-neutral persistence of `reviewPolicy` and
  `revisionOfReviewId` on the Execution Manager
- `PublicReview` read-model projection removing the callback capability from every
  browser-readable surface
- URI-keyed atomic evidence creation (`ensureEvidence`)

## Implementation Commits

| Commit | Subject |
| --- | --- |
| `94aad7a` | feat(dev-hq): emit execution events and evidence (Task 1E-1) |
| `854e354` | feat(dev-hq): make execution callbacks idempotent (Task 1E-2) |
| `152e547` | feat(dev-hq): add scheduled lease sweeper (Task 1E-3) |
| `e43383a` | feat(dev-hq): derive agent health from heartbeat freshness (Task 1E-4) |
| `395e778` | feat(dev-hq): complete Sprint 1E review and reliability |
| `a7fb068` | fix(dev-hq): enforce durable execution lifecycle deduplication |
| `0e9b08a` | feat(dev-hq): complete durable review reliability |

Documentation and agent-governance commits on the same branch, **not**
implementation and not reviewed as such: `8310bbb`, `f6caf4c`, `2c76612`,
`d8b169d`, `e67adda`.

---

# 2. Validation

Both reviews independently ran the test suite, TypeScript, and ESLint, and
observed the output. Results agree.

| Check | Command | Result | Verified by |
| --- | --- | --- | --- |
| Tests | `npx vitest run` | **22 files, 317 tests passed** | CR-001 and AR-001 independently |
| TypeScript | `npx tsc --noEmit` | exit 0, no diagnostics | CR-001 and AR-001 independently |
| ESLint | `npx eslint .` | exit 0, no diagnostics | CR-001 and AR-001 independently |
| Production build | `npx next build` | **exit 0, all 22 routes built** | Lead Software Engineer, post-review |

## Build verification — status

**Neither review ran the production build.** Both recorded this explicitly as
unverified:

- CR-001 §"What Was Not Verified" item 3
- AR-001 §9 item 1

The gap was closed after both reviews. `npx next build` was run against the
baseline tree at `e67adda` and **passed, exit 0**, building all 22 routes, with
the full suite re-confirmed green at the same point (22 files / 317 tests, `tsc`
clean, `eslint` clean) and no build artifact entering the tracked tree.

This satisfies the plan's Definition of Done — *"Production build succeeds when
appropriate (`npm run build`)"* — and ADR-0002's Validation requirement of *"Full
suite green (tsc, lint, tests, production build)"*. The attestation is the Lead
Software Engineer's, not a reviewer's; both review reports remain accurate as
written, since neither ran it within its own review.

## Additional verification performed by CR-001

The `PublicReview` compile-time guard was verified empirically rather than
accepted from its code comment. The type construct was reproduced in isolation
and compiled with the project's own `tsc --strict`:

```
guard.ts(14,7): error TS2322: Type 'Review' is not assignable to type 'PublicReview'.
guard.ts(17,7): error TS2322: Type 'Review[]' is not assignable to type 'PublicReview[]'.
guard.ts(20,7): error TS2322: Type '{ id: string; callbackToken: string | null; ... }' is not assignable to type 'PublicReview'.
```

A control case using a bare `Omit<Review, ReviewSecretField>` compiled cleanly,
confirming the `?: never` restatement is load-bearing.

---

# 3. Independent Code Review

**Review ID:** CR-001
**Reviewer:** Independent Code Reviewer (AGENT-008)
**Artifact:** `agents/independent-code-reviewer/outputs/SPRINT_1E_CODE_REVIEW.md`
**Committed:** `e67adda`

## Verdict

**PASS WITH NON-BLOCKING FOLLOW-UPS**

- Blockers: **none**
- Confirmed defects: 4
- Plausible risks: 5
- Non-blocking follow-ups: **12**

## Summary

All three run validations pass. Both blockers from the prior review round —
`callbackToken` published to the browser, and duplicate evidence under concurrent
callbacks — are verified fixed, each re-verified independently rather than
accepted from the earlier report. The bounded loops are correct on the paths
traced. Ownership boundaries hold and are pinned by an executable scope test. Test
quality is high; a specific search for vacuous or wrongly-directed assertions
found none.

No finding blocks. The highest-priority item is the predictable callback token
(#1), which fails the blocking bar only because the token is a second gate behind
a guard that returns 403 in production, and ADR-0002 designates that guard — not
the token — as the required control for the surface.

## All 12 Non-Blocking Follow-Ups

| # | Item | Location | Priority |
| --- | --- | --- | --- |
| CR-1 | Replace `nextId("rvt")` with a CSPRNG for the callback token | `review-service.ts:354`, `id.ts:3-6` | **Highest** |
| CR-2 | Remove or wire the dead `reviewPolicy` parameter on `assignExecution` | `execution-manager.ts:226, 260` | Low |
| CR-3 | Correct the terminal-guard comment for the `reviewer_unresponsive` case | `review-service.ts:459-462` | Low |
| CR-4 | Count `reconcileReviews` results from actual outcomes | `review-service.ts:723-732, 743-754` | Low |
| CR-5 | Emit a lifecycle event on review re-dispatch | `review-service.ts:375-380` | Medium |
| CR-6 | Reject malformed findings instead of silently dropping them | `complete/route.ts:15-39` | Medium |
| CR-7 | Reduce the sweep's `O(executions × reviews)` scan | `review-service.ts:692-699` | Low |
| CR-8 | Give `EscalationStore.findByExecution` an origin filter | `dev-escalation-store.ts:39-45` | Low |
| CR-9 | Remove or use `ReviewStore.listPending()` | `review-store.ts:79` | Low |
| CR-10 | Key `dispatchesInFlight` on force | `review-service.ts:329-330` | Low |
| CR-11 | Order `recordFindings` after the guarded transition before Phase 2 | `review-service.ts:485-492` | Phase 2 gate |
| CR-12 | Branch name no longer describes its contents | `feature/sprint-1d-execution-manager` | Low |

Full detail — why each matters, the constraint applied, and the remediation — is
in CR-001 §"Non-Blocking Follow-Ups". Not restated here.

---

# 4. Architecture Review

**Review ID:** AR-001
**Reviewer:** Architecture Reviewer (AGENT-019 / ROLE-022)
**Artifact:** `agents/architecture-reviewer/outputs/SPRINT_1E_ARCHITECTURE_REVIEW.md`
**Status:** Uncommitted at the time of writing

## Verdict

**PASS WITH NON-BLOCKING FOLLOW-UPS**

- Blockers: **none**
- Non-blocking follow-ups: **4** (three confirmed defects, one plausible risk)
- Process escalations: **4**

> **Count discrepancy, recorded for accuracy.** The request that produced this
> document anticipated 11 architecture follow-ups and 3 process escalations. The
> review actually produced **4** and **4**. The actual counts are recorded here.
> No finding was added, removed, split, or merged to reach any expected number.

## Summary

No blockers. The architecture is, in the areas traced end to end, unusually
disciplined: idempotency is structural rather than conditional; the Execution
Manager's mandated purity holds against the actual writes rather than against its
comments; and both bounded loops terminate. Every dimension was covered with a
result or an explicit not-applicable. Deferred Sprint 1E-7 scope was confirmed
genuinely absent at each of the three surfaces the deferral named.

The four follow-ups are the places where the sprint's own discipline is applied
unevenly. Several candidate findings were refuted and discarded rather than
reported.

## All 4 Non-Blocking Follow-Ups

| # | Item | Location | Classification |
| --- | --- | --- | --- |
| NB-1 | A replayed `accept`/`abandon` escalation resolution overwrites newer task state | `escalation-service.ts:505-515, 86-95` | Confirmed defect |
| NB-2 | `execution.claimed` and `execution.reclaimed` audit records are unkeyed and unreconciled | `agent-execution-service.ts:91-106, 737-743, 968, 996-1003` | Confirmed defect |
| NB-3 | New contracts record the single-process mechanism, not the atomicity obligation a durable adapter must meet | `types/contracts/review-store.ts:82-88` and others | Confirmed defect |
| NB-4 | The reconciliation sweep has no per-item isolation | `reclaim/route.ts:15-16`, `review-service.ts:692-699` | Plausible risk |

Full detail is in AR-001 §4. Not restated here.

## All 4 Process Escalations

These require a decision owner other than the reviewer. They are not findings
against the code.

**PE-1 — The approved plan's task numbering conflicts with the Founder scope
decision.** Under the plan's numbering, 1E-7 (the review and revision loop) is
fully implemented, and the plan's own 1E-7 bullet includes the dispatch-route and
server-action override the Founder deferred. Two governing documents describe the
same sprint with incompatible labels, leaving the commit-gate record ambiguous in
permanent history. Recommended: issue a superseding scope note mapping the
Founder's labels onto the plan's, then amend the plan at the start of 1F.
**Decision owner: Founder**, with the Lead Software Engineer as plan owner and the
Director of Operations for the governance record.

> **RESOLVED — Founder decision, 2026-07-26.** Issue a superseding scope note in
> these completion notes; leave the approved plan intact as an artifact of its
> time. Amend the plan itself at the start of Sprint 1F. The scope note is §6.1
> below and is authoritative where it and the plan disagree.

**PE-2 — ADR-0002 E5's execution-timeline read-model is not implemented, and its
absence cannot be classified.** E5 states *"(Data/read-model in 1E; the panel is
Sprint 1F.)"*. The plan's 1E-8 and 1E-9 implement it; neither exists. The reviewer
could not determine whether this is approved-deferred (in which case reporting it
would violate the prohibition on treating deferred work as a defect) or
outstanding 1E work (in which case a "Sprint 1E complete" record would be
inaccurate). Recommended: confirm 1E-8/1E-9/1E-10 deferred to Sprint 1F,
consistent with E5's own "the panel is Sprint 1F", and record that decision here.
**Decision owner: Founder.**

> **RESOLVED — Founder decision, 2026-07-26.** Tasks 1E-8, 1E-9, and 1E-10's
> remaining data-exposure work are **deferred to Sprint 1F** as approved scope,
> consistent with ADR-0002 E5's own *"the panel is Sprint 1F"* and with 1E-9's
> *"No new UI panels"*. Their absence is therefore the approved state and is not
> a defect.
>
> Basis: the execution timeline is purely derived and owns no source of truth, so
> deferring the derivation costs nothing structurally — the delivered baseline
> already produces every record the timeline merges, and the read-model can be
> added later without a migration.
>
> Follow-up carried to Sprint 1F: amend ADR-0002 E5 so its parenthetical reads
> "read-model and panel in Sprint 1F", so the ADR and this record agree. Recorded
> in §7 as an outstanding documentation item, not a blocker.

**PE-3 — Risk statement on the approved `reviewer_unresponsive` mechanism.**
Stated once as a recommendation, proceeding under the Founder decision, and not a
request to revisit it. An escalation recorded as `origin: "review_exhausted"` at
iteration 1 is accurate only to a reader who also inspects
`Review.escalationReason` on a different record. The Sprint 1F escalation queue
and scorecards will naturally group by `origin` and would conflate "the reviewer
kept rejecting the work" with "the reviewer never answered" — operationally
different causes demanding different founder responses. Recommended: render
`Review.escalationReason` alongside `origin` when the 1F surface is designed.
**Decision owner: Founder**, with the Lead Software Engineer at 1F design time.

**PE-4 — Three Claude subagent definitions are untracked, including those of the
two roles this gate depends on.** `.claude/agents/lead-software-engineer.md`
(AGENT-006, which owns the architecture under review),
`.claude/agents/independent-code-reviewer.md` (AGENT-008, whose CR-001 is a
governance input to this gate), and `.claude/agents/claude-design.md` are
untracked, while `architecture-reviewer.md` in the same directory was committed in
`8310bbb`. The operating definitions under which the work was produced and under
which CR-001 was performed are not reproducible from the repository. Recommended:
commit all three, matching the precedent `8310bbb` set for this exact directory.
**Decision owner: Director of Operations**, with the Founder for the authority
record.

> **RESOLVED — Founder decision, 2026-07-26.** Commit all three
> (`lead-software-engineer.md`, `independent-code-reviewer.md`,
> `claude-design.md`) alongside the already-tracked `architecture-reviewer.md`,
> matching the precedent `8310bbb` established for this directory. Done as part
> of the commit that carries this document, so the definitions under which the
> work was produced and reviewed are reproducible from the repository.

---

# 5. Combined Findings

Cross-referenced rather than duplicated. Full detail lives in the source reports.

## Findings both reviews reached independently

| Topic | CR-001 | AR-001 | Note |
| --- | --- | --- | --- |
| Divergent-findings interleaving in `handleReviewComplete` | P-2 / #11 | §9 item 4 | Both conclude it is unreachable under ADR-0001 D4's deterministic reviewer and becomes reachable at Phase 2. AR-001 additionally verified that no reviewable execution can lack a `request` and that no route mutates `task.description`. **Concurring.** |
| Sweep query shape, `O(executions × reviews)` | #7 | §7 | AR-001 adds the interaction CR-001 did not: the sweep's failure point is the 50-second sweeper TTL, after which recovery silently stops. |
| `EscalationStore.findByExecution` lacks an origin filter | #8 | §Closing (refuted as a defect) | AR-001 attempted to turn this into a duplicate-escalation path and refuted it — the origins cannot collide — but agrees the invariant is held by argument rather than by the API. **Concurring, non-blocking.** |
| `ReviewStore.listPending()` unused | #9 | §5 Boundaries observation | Same finding, same conclusion: pre-existing convention, not a regression. |
| Production build not run | §Not verified item 3 | §9 item 1 | Both explicitly record it as unverified. Escalated to §7. |
| Trigger.dev worker semantics unverified | §Not verified item 1 | §9 item 2 | Both reviewed the durable tasks as source and through mocks only. |
| Trigger.dev payload visibility for the callback token | P-3 | §9 item 3 | AR-001 defers to CR-001 and the platform owner; neither could establish Trigger.dev's dashboard retention semantics. |
| Single-process atomicity is not general | §Not verified item 4 | §7, NB-3 | CR-001 records it as a limit of its own analysis; AR-001 converts it into an actionable follow-up with a per-operation mechanism table. |

## Findings unique to CR-001

Line-level and implementation-quality: CR-1 (predictable token), CR-2 (dead
parameter), CR-3 (inaccurate comment), CR-4 (over-reported counters), CR-5
(missing re-dispatch event), CR-6 (malformed findings dropped), CR-10
(`dispatchesInFlight` ignores force), CR-12 (branch name).

## Findings unique to AR-001

Structural and lifecycle: NB-1 (replayed resolution overwrites newer task state),
NB-2 (unkeyed claim/reclaim audit records), NB-4 (no per-item sweep isolation),
and the recorded lifecycle gap that nothing marks a task `completed` when its
execution succeeds and its review passes — the only path is escalation `accept`,
and neither ADR states a transition there.

## No contradictions

The two reviews agree on every point where their scopes overlap. Neither
contradicts the other on any finding, verdict, or classification. Where AR-001
examined a CR-001 finding more deeply it either concurred or refuted the stronger
form while agreeing with the weaker — never the reverse.

---

# 6. Deferred Work

## 6.1 Superseding Scope Note (resolves PE-1)

**Issued by Founder decision, 2026-07-26. Authoritative where it and
`docs/plans/SPRINT_1E_REVIEW_AND_RELIABILITY.md` disagree on task labels.** The
approved plan is left intact as an artifact of its time; it is amended at the
start of Sprint 1F.

The plan and the Founder scope decision use the same labels for different work.
This table is the reconciliation:

| Plan label | Plan title | Founder scope-decision label | Delivered? |
| --- | --- | --- | --- |
| 1E-6 | Review domain and store | part of "1E-6 reliability completion" | Yes |
| 1E-7 | Review and revision loop | part of "1E-6 reliability completion" | **Yes** — the loop is fully implemented |
| 1E-7 (bullet: *"dispatch route + server action accept an override"*) | operator-facing `reviewPolicy` override | "Sprint 1E-7", deferred | **No** — deferred, verified genuinely absent |
| 1E-8 | Execution timeline and audit history | not referenced | No — deferred to 1F (PE-2) |
| 1E-9 | Mission Control data exposure | not referenced | Partial — records exposed; timeline and view-model deferred to 1F (PE-2) |
| 1E-10 | Validation and completion notes | not referenced | Yes — this document |

**Reading rule.** "Sprint 1E-6 reliability completion" in the Founder scope
decision covers the plan's 1E-6 **and** the implemented portion of the plan's
1E-7. "Sprint 1E-7 deferred" refers **only** to the operator-facing
`reviewPolicy` override named in the plan's 1E-7 bullet, not to the review and
revision loop, which was delivered.

Both review verdicts (CR-001 and AR-001) were rendered against the delivered
surface described by this table.

## 6.2 Deferred Items

Recorded exactly as documented in the governing sources.

## Deferred by explicit Founder scope decision

**Sprint 1E-7 operator-facing `reviewPolicy` override.** The internal dispatch
route, the server action, and the Simulation Lab do not accept a `reviewPolicy`
override. Both reviews independently verified this is **genuinely absent, not
partially present**, at each of the three named surfaces:

- `app/api/dev-hq/internal/execution/dispatch/route.ts` — the request body
  destructure enumerates `taskId`, `requiredCapabilities`, `preferredAgentId`,
  `instructions`, `idempotencyKey`; a client supplying `reviewPolicy` is silently
  ignored
- `lib/dev-hq/actions.ts` — no `reviewPolicy` anywhere in the file
- Repo-wide grep across `*.ts`/`*.tsx` excluding tests returns twelve hits, all in
  four `lib/dev-hq/*` service files and `types/domain/execution.ts`; no component,
  no route, no action

The service-level `DispatchAgentExecutionInput.reviewPolicy` is dormant with no
production caller, defaulting to `DEFAULT_REVIEW_POLICY` (`basic`) — which is
ADR-0002 D-E2's *"new agent executions default to basic"*. **The absence is the
approved state and is not a defect.**

## Deferred by ADR-0002 and the plan

- **Supabase persistence and the persistence abstraction** — ADR-0002 E9 / D-E5.
  No dependency, no migration; memory-only.
- **`WorkItem` entity** — the plan's Open Questions: *"`WorkItem` is explicitly
  not implemented in Sprint 1E."*
- **Scorecard domain and aggregation** — D-E6, deferred to Sprint 1F.
- **UI surfaces** — the plan's 1E-9: *"**No new UI panels** (the Evidence/Audit,
  Escalations queue, and review surfaces are Sprint 1F)."*

## Deferred to Sprint 1F by Founder decision (resolves PE-2)

- **1E-8 Execution timeline and audit history** — no timeline read-model exists.
- **1E-9 Mission Control data exposure** — partial. `DevHqState` additively
  carries `evidence`, `escalations`, `reviews` (projected), and `reviewFindings`;
  the merged timeline stream and the view-model extension do not exist.

ADR-0002 E5 places the read-model in 1E: *"(Data/read-model in 1E; the panel is
Sprint 1F.)"* AR-001 escalated rather than classified this (PE-2).

**Founder decision, 2026-07-26: deferred to Sprint 1F as approved scope.** The
absence is therefore the approved state and is not a defect. The timeline is
purely derived and owns no source of truth, so the deferral costs nothing
structurally — the delivered baseline already produces every record the timeline
merges, and the read-model can be added later without a migration.

Carried to Sprint 1F: amend ADR-0002 E5's parenthetical to place the read-model
with the panel, so the ADR and this record agree.

---

# 7. Remaining Issues Before Production

Consolidated from both reviews. Items marked **must** are stated as such in a
source report.

## Must be completed before this subsystem runs outside a developer machine

**1. Predictable callback token (CR-1).** `lib/dev-hq/review-service.ts:354` mints
the review callback capability via `nextId("rvt")` →
`rvt-<epoch-millis>-<counter>`. The code documents this value as defeating a
*fabricated* callback from an otherwise-authenticated worker; a timestamp plus a
small monotonic counter is a search space of a few thousand candidates and cannot.
Non-blocking only because the token is a second gate behind
`rejectInternalDevRequest`, which returns 403 unconditionally in production.

CR-001: *"must land before this subsystem runs anywhere other than a developer
machine."* AR-001 §8 concurs and pairs it with NB-1. Remediation:
`token: crypto.randomUUID()` — one line, one file, no behavioural change.

**2. Replayed escalation resolution overwrites newer task state (NB-1).** A
duplicate `accept`/`abandon` POST re-applies a task-status write derived from a
superseded decision, leaving a task `completed` while a newer escalation on it is
still `open` and awaiting the founder. AR-001 §8 lists it alongside CR-1 as
needing to land before non-developer use.

## Governance and documentation gaps

**3. ~~Untracked agent definitions (PE-4).~~ RESOLVED 2026-07-26** — all three
committed alongside `architecture-reviewer.md`. The definitions under which the
work was produced and reviewed are now reproducible from the repository.

**4. ~~Plan / Founder-decision numbering conflict (PE-1).~~ RESOLVED
2026-07-26** — superseding scope note issued at §6.1. Plan amendment carried to
Sprint 1F.

**5. ~~ADR-0002 E5 timeline classification (PE-2).~~ RESOLVED 2026-07-26** —
1E-8/1E-9 deferred to Sprint 1F as approved scope. **Carried forward:** amend
ADR-0002 E5's parenthetical so the ADR and this record agree. Documentation-only;
not a blocker.

**6. Missing role handbooks and standards. OPEN.** CR-001 §"What Was Not
Verified" item 5 records that `handbooks/INDEPENDENT_CODE_REVIEWER.md` does not
exist despite being named by `agents/independent-code-reviewer/AGENT.md:7`, and
that eight other agent directories have no handbook. That AGENT.md also requires
`NAMING_STANDARD.md`, `LOGGING_STANDARD.md`, and `ERROR_HANDLING_STANDARD.md`,
none of which exist in `standards/`. CR-001: *"material to review completeness and
belongs with the Director of Operations."* Decision owner: Director of
Operations.

**7. ~~Production build not verified against the current baseline.~~ RESOLVED
2026-07-26** — `npx next build` run against the baseline tree, exit 0, all 22
routes. See §2.

## Persistence work

**8. Contracts do not state the durable-adapter atomicity obligation (NB-3).**
Only `evidence-store.ts:52-55` states it. Every other keyed create-or-get, guarded
transition, and reserve-once field documents the single-process *mechanism*
instead. An adapter author implementing `createReview` from the literal reading of
"the check and the insert are synchronous" reproduces the exact two-caller defect
the in-memory version avoids. ADR-0001 D7 already requires the contract. AR-001
§8: *"should land before the persistence abstraction is designed, because that is
the moment its absence stops being documentation and starts being a defect in an
adapter."*

**9. Every invariant listed in AR-001 §7 needs a named durable mechanism** —
unique key plus insert-on-conflict for the keyed creates, single-statement
conditional `UPDATE` for the guarded transitions, `UPDATE … WHERE field IS NULL`
for the reserve-once fields, compare-and-set for `claimExecution`.

## Scalability work

**10. Sweep cost and the sweeper TTL (CR-7, AR-001 §7).** Every sixty seconds the
sweep performs four full scans of `executions` plus a full scan of `reviews`, with
`findByExecution` — itself linear — called inside a loop over executions. What
breaks first is the sweep exceeding the 50-second sweeper TTL at order 10³–10⁴
executions, **after which recovery silently stops running**. Free at current
scale; the failure mode is silent, which is what makes it worth recording.

**11. Unbounded growth of `store.eventKeys` and `store.evidenceUris`** (AR-001
§7). Never trimmed, while `store.events` is capped at 200. Correct for dedupe
durability, but it means `DevHqState.events` will lose entries the ADR-0002 E5
timeline is meant to merge.

## Phase 2 gate

**12. `recordFindings` ordering (CR-11 / P-2, AR-001 §9 item 4).** Unreachable
under the deterministic simulated reviewer; reachable the moment a
non-deterministic Phase 2 reviewer lands. Both reviews concur. Must be resolved
before the ADR-0002 "real AI reviewers" work begins.

---

# 8. Final Sprint Status

## Implementation

**Sprint 1E implementation is complete as scoped.**

Delivered: the plan's tasks 1E-1 through 1E-7 — the full review and revision
loop included — plus 1E-10. Deferred by explicit Founder decision and verified
genuinely absent rather than partially present: the operator-facing
`reviewPolicy` override (plan 1E-7 bullet), and tasks 1E-8 and 1E-9 (PE-2).

The word "complete" here means complete against the approved scope as reconciled
by the superseding scope note at §6.1, not against the plan's original ten-task
list read literally. Deferred work is approved-absent, not missing.

## Review outcomes

| Gate | Verdict | Blockers |
| --- | --- | --- |
| Independent Code Review (CR-001, AGENT-008) | **PASS WITH NON-BLOCKING FOLLOW-UPS** | None |
| Architecture Commit-Gate Review (AR-001, AGENT-019) | **PASS WITH NON-BLOCKING FOLLOW-UPS** | None |

**No unresolved blockers exist in either review.**

## Review sequencing

**Both reviews were performed retrospectively, after the implementation
commits.** GOV-001's Official Review and Approval Order places Independent Code
Review at step 4 and Architecture Review at step 6, both before commit at step 9.
The plan's Definition of Done is more explicit still, requiring for every task:
*"Implementation work is **not** committed until review approval"* and *"Stop for
review after completing the task."*

Neither held. The work was committed first and reviewed afterwards. Recorded
plainly so the audit trail does not imply a sequencing that did not occur.

The verdicts are unaffected by the ordering — neither review found a blocker, so
no commit would have been held. Both source reports carry the same disclosure in
their own Record Notes.

## Findings durability

**Findings are now durably recorded.** Before this sprint's closing work, the
Independent Code Review verdict existed only as conversation text and in no file
or commit. Both reviews are now repository artifacts:

- CR-001 — `agents/independent-code-reviewer/outputs/SPRINT_1E_CODE_REVIEW.md`,
  committed in `e67adda`
- AR-001 —
  `agents/architecture-reviewer/outputs/SPRINT_1E_ARCHITECTURE_REVIEW.md`,
  uncommitted at the time of writing

This satisfies GOV-001's Evidence and Audit Requirements — *"Review reports are
Records under this document and must be retained with the work they gate"* — and
its Commit-Gate Rule that `PASS WITH NON-BLOCKING FOLLOW-UPS` authorizes commit
only when the follow-ups are explicitly recorded in a durable location. All 12
CR-001 follow-ups, all 4 AR-001 follow-ups, and all 4 process escalations are
recorded in §3, §4, and §7.

## Founder approval

**Granted 2026-07-26.** The trusted Sprint 1E baseline is established.

| # | Decision | Resolution |
| --- | --- | --- |
| 1 | Accept both review verdicts and the recorded follow-ups (§3, §4, §7) | **Accepted.** 12 CR-001 follow-ups, 4 AR-001 follow-ups, and 4 process escalations recorded; carried to Sprint 1F |
| 2 | PE-2 — classification of 1E-8/1E-9 | **Deferred to Sprint 1F** as approved scope. ADR-0002 E5 amendment carried forward |
| 3 | PE-1 — task-numbering conflict | **Superseding scope note** issued at §6.1; plan amended at the start of 1F |
| 4 | Retrospective review sequencing | **Accepted as a recorded exception** to the plan's Definition of Done. See below |
| 5 | PE-3 and PE-4 routing | PE-4 **resolved** — all three agent definitions committed. PE-3 **routed to Sprint 1F design time**, per the reviewer's own recommendation |
| 6 | Production build verification | **Run and passed** against the baseline tree, exit 0, all 22 routes (§2) |

**On decision 4.** Both reviews were performed after the implementation commits,
contrary to GOV-001's Official Review and Approval Order and to the plan's
Definition of Done. This is accepted as a recorded exception rather than
corrected, because the ordering cannot be undone and neither review found a
blocker, so no commit would have been held. The exception is recorded here, in
both review artifacts' Record Notes, and in the baseline tag, so the audit trail
states it plainly rather than implying a sequencing that did not occur.

Corrective action for Sprint 1F: run both gates before commit, in the GOV-001
order. No further exception should be needed.

## Trusted baseline

Tagged **`sprint-1e-baseline`**. A descriptive tag rather than a
`VERSIONING_POLICY` `vX.Y.Z` release tag, because this is a trusted development
baseline and not a release — no release workflow, QA gate, or release approval has
been run against it.

---

# Approval

**Prepared by:** Lead Software Engineer (AGENT-006)

**Date:** 2026-07-26

**Baseline:** `feature/sprint-1d-execution-manager` @ `e67adda`

**Status:** Approved — trusted Sprint 1E baseline, tagged `sprint-1e-baseline`

**Founder decision:** Approved 2026-07-26. See §8.
