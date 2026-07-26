# Architecture Review — Sprint 1F Track A, Candidate 1

**Verdict: APPROVE WITH FINDINGS**

---

## 1. Review identity

| Field | Value |
|---|---|
| Review | Final Architecture Review, Sprint 1F Track A, Candidate 1 |
| Role | Independent Architecture Reviewer (project-level `architecture-reviewer`) |
| Date | 2026-07-26 |
| Review worktree | `C:\Users\evanj\Documents\Projects\savrio-review-1f-tracka-1` |
| Main worktree | Not inspected, not modified |
| Authority | CONST-001, GOV-001, AGENT-001; ADR-0001, ADR-0002 |
| Preceding gate | Independent Code Review — PASS WITH NON-BLOCKING FINDINGS |
| Relationship to preceding gate | Independent. The code review was **not** treated as architecture approval. |

**Execution note.** This review was first delegated to a spawned `architecture-reviewer` subagent, which idled three times and produced no analysis and no artifact. The Founder then directed that the review be performed directly in a clean session as a fresh, final attempt, with no further subagent spawned. That instruction was followed. All findings below derive from first-hand inspection of the review worktree recorded in this document.

---

## 2. Candidate identity

Identity gate executed in the review worktree **before** any analysis.

```
git rev-parse HEAD              -> d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7
git rev-parse HEAD^{tree}       -> d9eef724baba10932f0cb3c4c6be6658993610a6
git rev-parse candidate-1f-tracka-1^{commit}
                                -> d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7
git status --porcelain --untracked-files=all
                                -> (empty)
git show --stat --oneline HEAD  -> d1c86e9 test(dev-hq): Sprint 1F Track A — 1E-F4 and 1E-F5 regression coverage
                                    lib/dev-hq/agent-execution-service.test.ts | 196 +++
                                    lib/dev-hq/escalation-service.test.ts      |  60 +++
                                    lib/dev-hq/review-service.test.ts          |  74 +++
                                    3 files changed, 330 insertions(+)
```

| Check | Required | Observed | Result |
|---|---|---|---|
| HEAD | `d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7` | identical | **PASS** |
| Tree | `d9eef724baba10932f0cb3c4c6be6658993610a6` | identical | **PASS** |
| Tag peel | `candidate-1f-tracka-1` → HEAD | identical | **PASS** |
| Working tree | empty status, untracked included | empty | **PASS** |
| Content | 3 test files, 330 insertions, 0 deletions | 3 test files, 330 insertions, 0 deletions | **PASS** |

**Candidate identity gate: PASSED.** Review proceeded.

---

## 3. Sources inspected

All paths relative to the review worktree.

**Candidate diff**
- `lib/dev-hq/escalation-service.test.ts` (+60)
- `lib/dev-hq/review-service.test.ts` (+74)
- `lib/dev-hq/agent-execution-service.test.ts` (+196)

**Production source (read-only, for invariant verification)**
- `lib/dev-hq/agent-execution-service.ts` — `ensureAssignmentDeferredEvent` (217-240), `ensureAssignmentEvent` (171-191), `reconcileQueuedDispatches` decline (585), `dispatchAgentExecution` decline (774), `handleExecutionComplete` requeue (924-933), `handleExecutionReclaim` (1109-1165)
- `lib/dev-hq/escalation-service.ts` — `ensureReviseDispatch` decline (286-296)
- `lib/dev-hq/review-service.ts` — `ensureReviewRevision` decline (626-638)
- `lib/dev-hq/execution-manager.ts` — `reclaimStale` (≈665-694), `applyFailedAttempt` (≈158-206), `releaseAssignmentForReassignment` (711-720)
- `lib/dev-hq/store.ts` — `buildDevHqState` event ordering (141-143), `appendEvent` (218-228)
- `lib/dev-hq/adapters/dev-event-logger.ts` — full file
- `lib/dev-hq/constants.ts` — `EXECUTION_EVENT_TYPE` (67-77)

**Governance and decision records**
- `docs/decisions/ADR-0001-execution-manager-and-agent-registry.md` — D4, D6, D7, D8, O2, O6, Work Management Layer ownership
- `docs/decisions/ADR-0002-review-escalation-and-work-management.md` — E3, E4, E5, E6, E9, D-E3, D-E5
- `docs/validation/sprint-1e-overnight-2026-07-26/ISSUE_MATRIX.md` — six-site table (82-93)
- `docs/validation/sprint-1e-overnight-2026-07-26/CANDIDATE_C1_FREEZE.md` — AR2-1 row

**Source NOT available — disclosed limitation**
- `agents/independent-code-reviewer/outputs/CR_1F_TRACKA_CANDIDATE_1_REVIEW.md` does **not** exist in the review worktree. It is untracked in the main worktree, which this review was instructed not to inspect. The Independent Code Review's findings were therefore taken from the review brief's summary (MINOR-1, MINOR-2, dedupe residual, validation results), not read first-hand. All architectural conclusions in this report were reached independently from the sources listed above; none depends on the code review's text.

---

## 4. Scope reviewed and not reviewed

**Reviewed**
- ADR-0001 / ADR-0002 compliance of the candidate.
- Architectural value of the 1E-F4 reclaim-message test.
- Architectural value of each of the three 1E-F5 deferral-site tests.
- Deduplication residual risk on `execution.assignment_deferred`.
- Site-numbering and documentation drift.
- Shared-message coupling (CR MINOR-1).
- Ordering dependency (CR MINOR-2).
- Scope, orchestration ownership, and review independence.
- Re-execution of the four automated gates.

**Not reviewed**
- The main worktree (out of scope by instruction).
- Line-level style and test-authoring quality — owned by the Independent Code Review gate.
- Negative-control mutations. The brief permitted skipping these; the code review executed them independently. See §6 for why the F4 mutation outcome is nonetheless determinable by inspection, and §14 for the residual this leaves.
- Supabase persistence behaviour. Not implemented (ADR-0001 D7; ADR-0002 E9/D-E5). Finding AR-1F-M1 is a forward-looking statement about that future adapter, not an observation of shipped behaviour.
- AR2-6, Track B, Mission Control, Phase 2 — all out of scope and confirmed absent.

---

## 5. ADR and architecture analysis

### 5.1 The emission topology, established first

The single most important architectural fact for this review is not stated in the brief and materially reframes questions 3 and 4.

`execution.assignment_deferred` has **one emitter**, not six:

```
lib/dev-hq/agent-execution-service.ts:217  export async function ensureAssignmentDeferredEvent(...)
```

It has **six call sites**:

| # (this report) | Location | Function | Reached by |
|---|---|---|---|
| 1 | `agent-execution-service.ts:774` | `dispatchAgentExecution` | founder entry point |
| 2 | `agent-execution-service.ts:931` | `handleExecutionComplete` | completion callback requeue — **F5-C** |
| 3 | `agent-execution-service.ts:585` | `reconcileQueuedDispatches` | sweep |
| 4 | `agent-execution-service.ts:1153` | `handleExecutionReclaim` | reclaim loop |
| 5 | `escalation-service.ts:293` | `ensureReviseDispatch` | founder revise — **F5-A** |
| 6 | `review-service.ts:635` | `ensureReviewRevision` | review revision — **F5-B** |

The message string and the dedupe key are both constructed inside the single emitter (235, 238). No call site composes either.

### 5.2 ADR-0002 E3 — event architecture

E3 requires events be emitted "through the existing `EventLogger` contract **from the service layer**, never from the pure Execution Manager — keeping the manager a side-effect-free state machine and avoiding an adapter↔manager import cycle." Named emitters include `agent-execution-service`, `review-service`, and "the escalation path."

- All six call sites are in the service layer. `execution-manager.ts` emits nothing; ISSUE_MATRIX records that site as deliberately non-emitting for purity, and inspection confirms it. **Compliant.**
- `escalation-service` and `review-service` do not emit their own execution-domain event; they delegate to the execution service's emitter via `await import(...)`. This is **stricter** than E3 requires and is the correct choice: it keeps one owner of the execution event taxonomy.
- E3's "append-only; never mutated" holds — `appendEvent` only ever `unshift`es (store.ts:225) and the dedupe path returns the existing row rather than replacing it (221-223).

**No conflict.**

### 5.3 ADR-0001 O6 / O2 — no-agent-available

O6 folds into O2: "no available capability match leaves the execution `queued` **with a logged event**." Both halves are normative.

Before this candidate the *queued* half was covered and the *logged event* half was, at three of six sites, deletable outright with tsc, eslint, vitest and next build all green. The F5 tests close that gap at the three named sites. This is the candidate's principal architectural contribution: it converts an ADR-0001 O6 obligation from asserted-in-prose to enforced-in-suite. **Strengthens compliance.**

### 5.4 ADR-0002 E6 / D-E3 — two independent bounded loops

E6 requires the execution retry loop and the review iteration loop to have "distinct ownership and counters" that "never conflate," with each revision creating a new `Execution` carrying a fresh 3-attempt budget.

F5-A and F5-B jointly pin exactly this:

- F5-A asserts the founder-revise revision lives in `exec-revision-<escalationId>` and is at `attempt === 1`.
- F5-B asserts the review revision lives in `exec-review-revision-<reviewId>`, is at `attempt === 1`, and carries `revisionOfReviewId === reviewId`.
- F5-B's comment records — and the namespaces enforce — that the escalation path deliberately leaves `revisionOfReviewId` unset so a founder revise starts a fresh iteration count.

The two tests together make the counter-separation invariant executable rather than documentary. **Strengthens compliance.**

### 5.5 ADR-0001 D6 / D7 — capacity and compare-and-set

D6 fixes agent capacity at 1 with availability as the concurrency primitive and claiming as a compare-and-set. D7 specifies CAS semantics now so a future Supabase adapter has a contract to meet.

The tests induce capacity declines by three different means — deleting agents from the registry (F5-A), setting `availability: "busy"` (F5-B), and withdrawing an agent's provider so routing no longer matches (F4) — and never by manipulating claim state directly. No CAS path is bypassed, weakened, or asserted against. **No conflict.**

### 5.6 ADR-0001 D4 / O4 — deterministic execution

Phase 1 agents are deterministic simulations with no randomness. Every assertion in the candidate is an exact-value assertion, which is only sound under that guarantee, and the suite is green. The candidate depends on determinism and does not erode it. **No conflict.**

### 5.7 ADR-0002 E5 — execution timeline

E5 makes the timeline a derived, immutable, append-only read-model merged "by timestamp." The candidate adds no source of truth and mutates nothing. It does, however, take a dependency on the timestamp ordering's *tie-break* behaviour, which E5 does not specify. See §11 and finding AR-1F-M1.

### 5.8 Event provenance, replay, reconciliation, review independence, candidate identity

- **Provenance.** `actorId: null` / `actorLabel: "System"` is asserted at all three F5 sites. Correct: a capacity decline has no actor. Provenance is preserved, not weakened.
- **Replay / reconciliation.** The candidate changes no dedupe key and no reconciliation path. F5-C additionally asserts the emission is compatible with reconciliation by pinning `retried === false` with `status === "queued"` at `attempt === 2` — the state reconciliation is designed to pick up.
- **Review independence.** Nothing in the candidate touches review gating, callback tokens, or approval flow. Not weakened.
- **Candidate identity.** Verified in §2 and re-verified after validation in §17.
- **Concurrency.** No test introduces a shared-state assumption that a concurrent path could violate; each fixture withdraws capacity after the executions it does not intend to affect have already reached a terminal or non-queued state.

**Conclusion for §5: no ADR conflict identified. The candidate strengthens ADR-0001 O6 and ADR-0002 E6 enforcement and is neutral-to-positive on every other clause examined.**

---

## 6. Analysis of 1E-F4 — truthful reclaim message

### 6.1 The invariant

`handleExecutionReclaim` selects the reclaim message from three mutually exclusive arms (`agent-execution-service.ts:1121-1134`):

```
requeuedWithAgent    = status === "queued" && Boolean(agentId)
requeuedWithoutAgent = status === "queued" && !agentId
(else)               = terminal
```

The invariant is: **an execution may only be described as "retrying" when an agent actually holds the new attempt.** The discriminator is assigned-agent state, not status.

### 6.2 Is assigned-agent state the correct source of truth?

Yes, and I verified the supporting invariant rather than assuming it. `applyFailedAttempt` (`execution-manager.ts:178-206`) sets `agentId` and `assignmentId` **atomically** — either both `null` (178-181) or both populated (192-206). Consequently:

- Testing `agentId` alone is sufficient on the reclaim path; it cannot diverge from `assignmentId`.
- The non-null assertion `execution.assignmentId!` at line 1139, inside the `requeuedWithAgent` arm, is sound rather than a latent crash. I checked this specifically because the completion-callback site at line 930 guards on **both** fields (`!execution.agentId || !execution.assignmentId`), and that asymmetry warranted verification. It resolves benignly: the manager's atomic pairing makes the two guards equivalent on their respective paths. **No defect.**

Under ADR-0001 D6 (capacity 1, CAS on availability), holding an agent is precisely what distinguishes a running retry from a queued one. The discriminator is architecturally correct.

### 6.3 Does the test protect the invariant, or pin copy?

It protects the invariant. The distinction is structural, not rhetorical:

- The **pre-existing** test asserted `reclaimed[0]?.message).not.toContain("retrying as attempt")` over a fixture holding one execution, selected positionally. That assertion is equally satisfied by the branch having been replaced with a constant, because nothing in it names the execution or the arm.
- The **new** test reclaims two executions in a single sweep, one down each requeue arm, and asserts each execution's own reclaim message — selected by `entityId`, compared by exact whole-string equality:
  - `withoutAgentId` → `"...reclaimed as attempt 2, which is waiting for an available agent."`
  - `withAgentId` → `"...reclaimed and retrying as attempt 2."`

Collapsing the ternary to status-only branching makes both executions take the same arm, so the two messages become identical and at least one exact-equality assertion necessarily fails. The assertion is therefore **mutation-detecting by construction**, not positional. This is determinable by inspection with certainty; the arms are mutually exclusive over a boolean and the two fixtures land on opposite sides of it. I did not re-run the mutation (see §14 for the residual that leaves).

The test additionally pins the behavioural consequence, not just the wording: `triggerMock` is asserted to have been called for `withAgentId` and only `withAgentId` — as a *set* of dispatched execution ids rather than a call count, correctly avoiding the idempotency-key collapse that a count would have been vulnerable to — and the deferral is asserted present for the unassigned execution and absent for the assigned one. Wording and behaviour are pinned together, which is what makes this an invariant test rather than a copy test.

### 6.4 Is the wording assertion appropriately coupled?

Yes. Under ADR-0002 E5 the timeline is the audit history from which "exactly what happened" is reconstructed. The truthfulness of the sentence *is* the invariant X4 removed; there is no separate machine-readable field carrying it. Asserting the message entire is therefore asserting behaviour, not decoration.

### 6.5 Future localization / message-refactor friction

Real but low, and partly desirable. A wording change breaks 2 assertions here and 3 in F5 — five total. There is no i18n layer in the system and audit messages are generated server-side in English. If localization or a structured reason code is introduced later, these tests become the point at which the change must be made deliberately, which for an audit trail is a feature rather than an obstacle. Recommended future migration is recorded in §10, not as a change to this candidate.

**Assessment: 1E-F4 protects a real architectural invariant. Approved.**

---

## 7. Analysis of each 1E-F5 site

Common architectural note: because all three sites funnel into one emitter (§5.1), these tests pin **call-site reachability and the state each site presents to the emitter**, not three independent emitters. That is the correct thing to pin — the emitter itself was already covered; what was deletable with green gates was each *call*.

### 7.1 Site A — `escalation-service.ts:290-293`, `ensureReviseDispatch`

**Boundary pinned.** The founder-decision path. `resolveEscalation(id, "revise")` reopens the task, creates the canonical revision execution, and — when nothing can take it — must record why. Reached through the founder decision itself, not through a sweep, dispatch, or reclaim.

**Attribution and lineage.** Pinned via `revisionExecutionIdFor(escalation.id)` → the `exec-revision-<escalationId>` namespace, which no dispatch, retry, reclaim, or reconciliation path can synthesize. The escalation record's `revisionExecutionId` is asserted to point at it, closing the lineage link in both directions.

**Reliance on another emitter — excluded.** Three independent exclusions: the exhausted original is terminal and asserted not to appear in the deferral population; nothing was dispatched, so site 1 never ran; no sweep ran, so sites 3 and 4 were unreachable — asserted positively via zero `reclaimed` events and `triggerMock` not called.

**Founder-facing behaviour.** This is the highest-priority site in ISSUE_MATRIX (row 5, "**highest priority**"), and correctly covered first. Without the emission a founder-authorized revision that cannot be staffed leaves the Founder with a reopened task, nothing running, and no timeline entry explaining it.

**Replay/dedup.** The assertion is on the deferral *population by `entityId`* (`toEqual([revisionId])`), not a count — so a second path sharing the dedupe key cannot satisfy it. Correct given §8.

**Ownership.** Reveals rather than conceals: the test makes visible that escalation delegates emission to the execution service and owns only the revision identity.

**Assessment: sound.**

### 7.2 Site B — `review-service.ts:632-635`, `ensureReviewRevision`

**Boundary pinned.** The review loop's single authorized revision. Without the emission the review loop stalls silently.

**Attribution and lineage.** Pinned two ways: the `exec-review-revision-<reviewId>` namespace, and `revision.revisionOfReviewId === reviewId` — the review loop's chain link, which only this site sets. Together these make the creating site unambiguous. This is also the assertion that enforces ADR-0002 E6 counter separation (§5.4).

**Reliance on another emitter — excluded.** The reviewed execution succeeded and is asserted absent from the deferral population; the revision was never assigned, asserted via zero `execution.assigned` events for `revisionId`; no reclaim swept.

**Runtime coverage of the dynamic import.** Sites A and B are reached through `await import("@/lib/dev-hq/agent-execution-service")` (escalation 290-292, review 632-634), a module-cycle workaround. `tsc` resolves these statically, so before this candidate a path-alias or module-boundary regression could have broken both at runtime with all four gates green. These are the first tests to execute those specifiers. This is a genuine and non-obvious coverage gain — recorded as finding AR-1F-A2.

**Assessment: sound.**

### 7.3 Site C — `agent-execution-service.ts:930-932`, `handleExecutionComplete`

**Boundary pinned.** The completion callback's requeue path: the attempt reported failure, retry budget remained, nothing was free to take the next attempt.

**Discriminator — the strongest of the three.** `attempt === 2`. The deferral message is asserted to read "at attempt 2," and a deferral from the dispatch-decline site (site 1) could only ever read attempt 1, because it fires before any attempt is consumed. Combined with the return-value assertions — `retried === false`, `status === "queued"`, `agentId === null` — which no other site produces because no other site is this function, the site attribution is airtight.

**Lineage and ordering.** Asserts the `retried` event precedes the `assignmentDeferred` event, reflecting that the callback records the retry it consumed before deferring. This is the assertion carrying the ordering dependency analysed in §11.

**Reliance on another emitter — excluded.** Zero `reclaimed` events; exactly one `assigned` event (attempt 1's), proving site 1 never declined; and a store-wide check that the only deferral entity is this execution.

**Replay/dedup.** Message-population assertion, not a count.

**Assessment: sound.**

### 7.4 Duplicated orchestration ownership — revealed or concealed?

**Revealed, and correctly so.** The candidate does not introduce a second orchestration owner. All three sites delegate to one emitter owned by `agent-execution-service`; escalation and review own only their revision identity and chain metadata.

One structural observation, non-defective: the shape `if (!decision.assigned || !decision.assignment) { defer; return }` is repeated across three services. This is duplication of orchestration *shape*, not of *ownership* — the emission itself is centralized, and the branch necessarily differs in what each service returns to its own caller. No consolidation is warranted and none is recommended.

---

## 8. Deduplication residual-risk analysis

The dedupe key is constructed at `agent-execution-service.ts:238`:

```
`${EXECUTION_EVENT_TYPE.assignmentDeferred}:${execution.id}:${attempt}`
```

### 8.1 Does the risk exist architecturally?

**The collapse exists, but it is designed, not accidental — and this materially changes the recommended remedy.**

The source states the intent explicitly at `agent-execution-service.ts:1143-1152`, on the reclaim-loop call site:

> "Deliberately redundant with site 3 (`reconcileQueuedDispatches`), which runs later in this same sweep and would emit for the same (execution, attempt). Both are kept, and the dedupe key collapses them to one entry. The reason to keep this one is timeline fidelity (ADR-0002 E5) … Do not remove it as a duplicate."

And the emitter's own contract at 199-201:

> "Keyed per (execution, attempt): reconciliation retries a stranded execution on every sweep, and one deferral per attempt is the honest count."

So two reachable emissions for the same `(execution, attempt)` **already exist today** and are intentionally collapsed. "One deferral per attempt" is the stated invariant.

### 8.2 Should event identity eventually include emitter/site provenance?

**Not in the dedupe key — no.** This is a point of disagreement with the remedy the brief attributes to the Independent Code Review, and it is worth stating precisely because the suggestion is intuitive:

Adding emitter/site provenance to the key would cause sites 3 and 4 to stop collapsing. A single capacity decline during one sweep would then produce **two** entries on an append-only, never-mutated audit timeline — breaking the documented "one deferral per attempt is the honest count" invariant, contradicting the explicit design note at 1143-1152, and degrading exactly the ADR-0002 E5 audit fidelity the redundancy exists to protect. The change would be a regression, not a hardening.

If site attribution is ever genuinely wanted, it belongs as a **non-keyed payload attribute** on the event, leaving the identity key untouched. That is an event-schema change (`Event` currently carries `type`, `entityType`, `entityId`, `message`, `actorId`, `actorLabel`, `timestamp` — no site field), and is a Phase 2 concern. Its value today is low: the message already varies by execution and attempt, and the candidate demonstrates that per-site discrimination is achievable without it.

### 8.3 What the genuine residual actually is

The real residual is a **test-integrity** risk, not a production-correctness risk: because the key collapses, a *count-only* assertion at one site can be satisfied by a different site's emission, which could mask deletion of the site under test.

The candidate mitigates this correctly and deliberately. Every F5 assertion is either a deferral-population-by-`entityId` assertion or an exact-message assertion, each paired with explicit negative controls proving the other sites were unreachable in that fixture (§7.1-7.3). There is no count-only assertion in the candidate. The commit message states this as the MAJOR-2 standard and inspection confirms it holds.

Residual after mitigation: if a future change made a second site reachable for the same `(execution, attempt)` *within one of these fixtures*, the collapse could still mask a deletion. The per-site discriminators — namespace identity for A and B, attempt-2 for C — reduce this substantially but do not eliminate it in principle.

### 8.4 Acceptability and routing

- **Acceptable for this test-only candidate: yes.** The candidate neither introduces nor worsens the collapse; it is the first work to defend against it.
- **Would changing the key conflict with existing idempotency/replay guarantees: yes** — see §8.2. This is the operative reason not to act.
- **Routing: follow-up register only.** Not Sprint 1F Track B, not AR2-6. There is no defect to fix. The register entry should record the *disagreement* — that provenance-in-key is contraindicated — so the suggestion is not re-raised and acted on later without this context.

Recorded as finding **AR-1F-L1**.

---

## 9. Site-numbering and documentation drift analysis

The candidate's observation is confirmed, and the drift is broader than one line.

**Every line reference in `ISSUE_MATRIX.md:86-93` is now stale:**

| Matrix # | Semantic identity | Recorded | Actual | Drift |
|---|---|---|---|---|
| 1 | `dispatchAgentExecution` decline | `agent-execution-service.ts:682-690` | `:774` | ~+90 |
| 2 | `handleExecutionComplete` requeue | `agent-execution-service.ts:823-825` | `:930-932` | ~+107 |
| 3 | `execution-manager` — **no emit** (purity) | `execution-manager.ts:172-186` | n/a | — |
| 4 | `ensureReviewRevision` | `review-service.ts:626-631` | `:632-635` | +6 |
| 5 | `ensureReviseDispatch` | `escalation-service.ts:285-290` | `:290-293` | +5 |
| 6 | `handleExecutionReclaim` | `agent-execution-service.ts:1005-1020` | `:1153` | ~+148 |
| — | `reconcileQueuedDispatches` decline | `:499` | `:585` | ~+86 |

**A second and more consequential problem: two incompatible numbering schemes now coexist.**

`agent-execution-service.ts:221-228` reasons about the sites by number in prose that is load-bearing for a guard's survival:

> "Sites 1, 4 and 5 can reach here with `execution_not_queued`; sites 2, 3 and 6 cannot… Site 3 is `reconcileQueuedDispatches`' decline path."

But in ISSUE_MATRIX, **site 3 is the execution-manager row that deliberately emits nothing.** The same ordinal denotes two different things in the source comments and in the governance record. A reader reconciling the guard comment against the matrix would conclude the guard protects a site that by design never emits.

**Assessments requested by the brief:**

- **Harmless line drift?** The line numbers alone: yes, degrading but not dangerous. The numbering-scheme collision: no — that is a genuine documentation defect, though a documentation-only one.
- **Should artifacts identify sites semantically?** Yes. Sites should be keyed as `file#function` (e.g. `escalation-service.ts#ensureReviseDispatch`), with line numbers marked explicitly non-normative. Ordinals should be dropped entirely or defined once in a single authoritative table that the source comments reference by name rather than number.
- **Is any acceptance criterion or governance record materially misleading?** **No, not materially.** ISSUE_MATRIX's "Note" column carries the semantic identity of every row ("founder entry point," "retry requeued, no capacity," "review loop stalls silently," "highest priority"), and every row remains unambiguously resolvable to a real site by that column. No acceptance criterion is keyed on a line number. The candidate's own test comments use accurate current references and unambiguous A/B/C lettering, so the candidate is not a source of drift and does not inherit it.

Recorded as finding **AR-1F-M2**. Documentation follow-up; does not block.

---

## 10. Shared-message coupling analysis (CR MINOR-1)

**Finding: architecturally appropriate as written. No change recommended now.**

The observation is that three F5 tests pin one shared message string. Given §5.1 this is not incidental — it is structurally *required*. There is one emitter, therefore one message template. Three tests asserting the same template against three different `entityId`s and attempt numbers is precisely what proves each call site reaches that emitter carrying the right execution in the right state. Asserting three *different* strings would mean three emitters, which is the architecture the design deliberately avoids.

- **Do they over-couple tests to presentation text?** Not harmfully. Under ADR-0002 E5 the message is the Founder-visible audit artifact from which history is reconstructed. Its content is behaviour, not presentation. The system has no view layer interposed between this string and the timeline.
- **Is a structured reason/provenance field preferable later?** Possibly, and independently of the dedupe question in §8. A machine-readable `reason` or `code` on the event would let tests discriminate on the code and keep exactly one message-text test per arm, reducing the wording-change blast radius from five assertions to two. This is an event-schema evolution, appropriate to consider alongside any Mission Control timeline work that needs to render deferrals distinctly. It is not needed now and nothing is blocked on it.
- **Is it acceptable now because the message is part of the Founder-visible audit trail?** Yes — and more strongly, because it is the *only* carrier of the distinction. Until a structured field exists, the string is the contract.

Recorded as finding **AR-1F-L2**. No action for this candidate.

---

## 11. Ordering-dependency analysis (CR MINOR-2)

**Finding: this is not merely a test-readability issue. It exposes a real, currently undocumented architectural ordering contract.** This is the most substantive finding in the review.

### 11.1 The mechanism, traced

- `appendEvent` (`store.ts:225`) inserts with `unshift` — newest at index 0.
- `buildDevHqState` (`store.ts:141-143`) returns `[...store.events].sort((a, b) => b.timestamp.localeCompare(a.timestamp))` — descending by timestamp.
- `DevEventLogger.listRecent` (`dev-event-logger.ts:27-34`) filters that array and slices by limit; it applies no ordering of its own.
- Timestamps come from `nowIso()` — millisecond resolution.

Events emitted within the same millisecond therefore **tie** under the comparator. `Array.prototype.sort` is required to be stable (ES2019+), so ties preserve the input order, which `unshift` has made newest-first. F5-C's `events.slice().reverse()` consequently yields true insertion order, and the assertion `indexOf(retried) < indexOf(assignmentDeferred)` holds deterministically.

The test is correct. The dependency it rests on is the concern.

### 11.2 Is event order authoritative or incidental?

**Authoritative — the codebase already treats it as a contract.** `agent-execution-service.ts:1143-1152` keeps a deliberately redundant emission *for no reason other than ordering*:

> "…emitting here places the deferral *adjacent to this execution's own `reclaimed` event*, so the audit history reads in true causal order rather than batching every deferral after every reclaim. That adjacency is the contract pinned by 'emits the requeue deferral from the reclaim loop, before the sweep runs' — deleting this call inverts the ordering and fails that test."

So causal ordering is a deliberate design property, defended by an existing test, and cited to ADR-0002 E5. It is not incidental.

### 11.3 The gap

ADR-0002 E5 specifies the timeline is merged "by timestamp." It specifies **no tie-break**. At millisecond resolution, same-tick events tie routinely — and in these very fixtures they do. The causal order that E5's audit guarantee depends on is therefore carried, today, entirely by an implementation detail of the in-memory adapter: `unshift` insertion order surviving a stable sort.

The forward risk is concrete. ADR-0001 D7 and ADR-0002 E9/D-E5 defer Supabase persistence but commit to a future adapter. A SQL adapter naturally implements `listRecent` as `ORDER BY timestamp DESC LIMIT n`, and SQL gives **no** ordering guarantee among equal keys. Such an adapter would satisfy E5 as written, pass a naive contract test, and yet:

- break F5-C's ordering assertion,
- break the existing MAJOR-2 reclaim-adjacency test,
- and, materially, **break the ADR-0002 E5 "true causal order" audit property in production**, which is the actual harm.

### 11.4 Assessments requested by the brief

- **Merely test readability?** No.
- **Does it expose an implicit architectural ordering contract?** Yes — that is the finding.
- **Is event order authoritative or incidental?** Authoritative, per §11.2, but under-specified in the ADR.
- **Should the test eventually assert explicit sequence metadata?** Yes — but the test is the symptom, not the cause. The correct remedy is to give `Event` a monotonic sequence number (or a strictly monotonic high-resolution timestamp) assigned at append, make it the documented tie-break in ADR-0002 E5, and require it of any persistence adapter as part of the D7 concurrency contract. Tests then assert the sequence rather than relying on stable-sort behaviour.

**This is pre-existing and not introduced by the candidate** — the MAJOR-2 test already depended on it before Track A. The candidate adds one more dependent assertion. It does not block, and the right time to act is when the persistence adapter is designed.

Recorded as finding **AR-1F-M1**. Routing: **persistence-adapter work** — not Track B, not AR2-6.

---

## 12. Findings with severity

No blocking architecture defect was identified.

| ID | Severity | Blocking | Summary |
|---|---|---|---|
| **AR-1F-M1** | MEDIUM | No | **Implicit ordering contract.** Causal event order relies on `unshift` insertion order surviving a stable sort over ms-resolution timestamps (`store.ts:141-143`, `:225`). ADR-0002 E5 specifies "by timestamp" with no tie-break. Load-bearing today (`agent-execution-service.ts:1143-1152`) and defended by an existing test. A future SQL adapter ordering by timestamp column would satisfy E5 as written and still break the audit-order property. **Pre-existing; not introduced by this candidate.** |
| **AR-1F-M2** | LOW-MEDIUM | No | **Site-numbering drift and scheme collision.** All line references in `ISSUE_MATRIX.md:86-93` are stale (drift +5 to ~+148). More seriously, the source comments at `agent-execution-service.ts:221-228` number the sites differently, so "site 3" denotes `reconcileQueuedDispatches` in source and the non-emitting execution-manager row in the matrix. Documentation only. Candidate is not the source and does not inherit it. |
| **AR-1F-L1** | LOW | No | **Dedupe residual — remedy contraindicated.** The `(execution, attempt)` collapse is a documented design property, not an accident; sites 3 and 4 rely on it. Adding emitter/site provenance **to the key** would break the intended collapse and double-log a single decline on an append-only timeline. The genuine residual is test-integrity, and the candidate already mitigates it by using population and exact-message assertions rather than counts. Register the disagreement so the suggestion is not acted on later without context. |
| **AR-1F-L2** | LOW | No | **Shared-message coupling.** One emitter implies one message; three tests asserting it against three entity ids is the correct proof of per-site reachability. Residual cost is a five-assertion blast radius on any wording change. A structured `reason`/`code` field would reduce this later. No action now. |
| **AR-1F-A1** | POSITIVE | — | Single emitter, six call sites. No second orchestration owner introduced or revealed. Stricter than ADR-0002 E3 requires. |
| **AR-1F-A2** | POSITIVE | — | F5-A and F5-B are the first tests to execute the `await import(...)` module-cycle workarounds at runtime, closing a static-only (`tsc`) guarantee gap. |
| **AR-1F-A3** | POSITIVE | — | F5-A and F5-B jointly make ADR-0002 E6 / D-E3 counter separation executable (distinct namespaces, `revisionOfReviewId` set only by the review path, both at attempt 1). |
| **AR-1F-A4** | POSITIVE | — | F5 converts ADR-0001 O6's "with a logged event" half from prose to enforced at three previously-deletable sites. |
| **AR-1F-A5** | POSITIVE | — | 1E-F4 protects a real invariant. Two arms exercised in one sweep with exact messages bound by `entityId` make it mutation-detecting by construction, materially stronger than the positional substring assertion it supplements. Discriminator verified sound against `applyFailedAttempt`'s atomic `agentId`/`assignmentId` pairing. |

---

## 13. Required follow-ups

None are required before Founder approval. All are register entries.

| # | Item | Owner | Routing | Priority |
|---|---|---|---|---|
| 1 | Specify a tie-break for ADR-0002 E5 timeline ordering; add a monotonic sequence number to `Event` at append; make it part of the ADR-0001 D7 persistence-adapter contract; migrate ordering assertions to it. | Lead Software Engineer + Architecture | **Persistence-adapter work.** Not Track B, not AR2-6. | Medium — before any persistence adapter is designed |
| 2 | Re-key `ISSUE_MATRIX.md` deferral sites to `file#function` with line numbers marked non-normative; reconcile the two conflicting site-numbering schemes between the matrix and `agent-execution-service.ts:221-228`. | Operations / Governance | Follow-up register | Low-Medium |
| 3 | Record in the follow-up register that emitter/site provenance must **not** be added to the `assignment_deferred` dedupe key, with the §8.2 rationale, so the suggestion is not re-raised and acted on. If site attribution is wanted, add a non-keyed payload field. | Architecture | Follow-up register | Low |
| 4 | Consider a structured `reason`/`code` field on `execution.assignment_deferred` when Mission Control timeline rendering needs to distinguish deferrals; migrate discrimination to the code and keep one message-text test per arm. | Product + Architecture | Phase 2 / Mission Control | Low |

---

## 14. Residual risk

**Overall residual risk: LOW.** The candidate is test-only, adds no production behaviour, and every finding is non-blocking.

Specific residuals, stated honestly:

1. **Ordering contract (AR-1F-M1).** Unmitigated by design. It cannot be mitigated by a test-only candidate. The exposure is future, not current: no persistence adapter exists. Risk of proceeding: none for this candidate; deferring past persistence design would be the actual mistake.
2. **Dedupe masking (AR-1F-L1).** Substantially mitigated but not eliminated. If a future change makes a second site reachable for the same `(execution, attempt)` inside one of these fixtures, the collapse could mask a deletion. Reduced by the namespace and attempt-number discriminators.
3. **Negative controls not re-executed by this review.** Permitted by the brief; the Independent Code Review executed them independently. I established the F4 mutation outcome by inspection (§6.3) — the arms are mutually exclusive over a boolean and the two fixtures land on opposite sides, so a status-only collapse necessarily fails at least one exact-equality assertion. The three F5 mutation outcomes I assessed by reading the assertions and confirming each carries a site-unique discriminator, which is strong but is inference rather than execution. **Residual: I did not independently reproduce any mutation failure.** If the Founder wants execution-level rather than inspection-level confidence on the F5 controls, that is the one gap this review leaves.
4. **Independent Code Review report not read first-hand.** It is untracked in the main worktree and therefore outside the authorized scope of this review (§3). Conclusions here are independent of it, so this does not weaken the verdict, but it means the two reports were not reconciled line by line — and §8.2 records a substantive disagreement with a remedy attributed to it via the brief.
5. **In-memory store only.** All behaviour verified against the dev adapters. Persistence is deferred by ADR-0001 D7 and ADR-0002 E9/D-E5, so this is expected, not a gap in the candidate.

---

## 15. Exact next gate

**Founder approval of Sprint 1F Track A, Candidate 1.**

Both independent gates are now complete:

| Gate | Owner | Verdict |
|---|---|---|
| Independent Code Review | AGENT-008 | PASS WITH NON-BLOCKING FINDINGS |
| Architecture Review | This review | **APPROVE WITH FINDINGS** |

Nothing further is required of Engineering, Code Quality, or Architecture before the Founder decides. The candidate may advance **unchanged**.

Not authorized and not started: AR2-6, Sprint 1F Track B, Mission Control implementation, Phase 2.

---

## 16. Commit / checkpoint recommendation

**Advance the existing commit unchanged. Do not amend, do not rebase, do not re-tag.**

- `d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7` is already committed on `validation/sprint-1e-overnight-2026-07-26` and frozen under the immutable annotated tag `candidate-1f-tracka-1` per Founder decision F-A7.
- No finding in this review requires a change to the candidate. Per the brief's standing instruction, the candidate was not modified for theoretical concerns absent a blocking defect, and none was found.
- All four findings route to the follow-up register (§13). None is a code change to Track A.
- The tag was neither moved nor recreated.
- This review produces exactly one artifact: this report. It is written to the review worktree and is **untracked**. Recommendation: commit it separately as a `docs(validation):` commit, or copy it to the main worktree alongside the Independent Code Review report — the Founder's choice. This review did not commit it, per the no-commit constraint.

---

## 17. Worktree state confirmation

**Candidate tree: unmodified. Identity re-verified after all validation.**

Validation was executed in the review worktree and all five gates were reproduced green:

| Gate | Command | Result |
|---|---|---|
| TypeScript | `npx tsc --noEmit` | **PASS** |
| Lint | `npx eslint .` | **PASS** |
| Tests | `npx vitest run` | **PASS** — 326 tests, 22 files, 0 failed |
| Build | `npx next build` | **PASS** |
| Whitespace | `git diff --check` | **PASS** |

Post-validation identity re-check:

```
git status --porcelain --untracked-files=all   -> (empty)
git rev-parse HEAD                             -> d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7
git rev-parse HEAD^{tree}                      -> d9eef724baba10932f0cb3c4c6be6658993610a6
```

HEAD and tree are byte-identical to the values recorded at the identity gate in §2.

**Precise dirty-state disclosure.** After this report is written, the review worktree contains exactly one untracked file:

```
?? agents/architecture-reviewer/outputs/AR_1F_TRACKA_CANDIDATE_1_REVIEW.md
```

That file is this report. It is the sole intended artifact of this review.

**Confirmed:**
- No candidate source file was created, edited, or deleted.
- No temporary mutation was applied at any point, so no restoration was necessary.
- No commit was created, amended, or reverted.
- No tag was created, moved, deleted, or recreated.
- The main worktree at `C:\Users\evanj\Documents\Projects\savrio-dev-hq` was never read from or written to during this review.
- `next build` wrote only to gitignored build output; `git status` remained empty after it ran.

---

## Verdict

**APPROVE WITH FINDINGS**

Sprint 1F Track A, Candidate 1 (`d1c86e95ba43ea6f925fbf8ec9abe8b5850fbcb7`, tree `d9eef724baba10932f0cb3c4c6be6658993610a6`, tag `candidate-1f-tracka-1`) is architecturally sound. It is test-only, introduces no production behaviour, conflicts with no ADR-0001 or ADR-0002 requirement, and strengthens enforcement of ADR-0001 O6 and ADR-0002 E6. Four non-blocking findings are recorded for the follow-up register; none requires a change to the candidate.

**The candidate may advance unchanged to Founder approval.**

---

*Independent Architecture Reviewer · Savrio Dev HQ · 2026-07-26*
