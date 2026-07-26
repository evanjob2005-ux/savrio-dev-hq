# AR2-6 — Independent Code Review Findings and Backlog Register

**Status:** RECORD ONLY. Uncommitted. **The AR2-6 candidate is NOT modified and NOT respun.**
**Date:** 2026-07-26

## Candidate under review — unchanged

| Field | Value |
|---|---|
| Tag | `candidate-1f-ar2-6-1` (annotated, object `7428f57d297f0bb4ac075440c9de7b768a4d2c40`) |
| Commit | `8c2eb9a738fafb22ed9ab896ce23cb3e7a9ecd1c` |
| Tree | `f9d6ea759b1920bcdda470abc17d2941288dbb64` |
| Baseline | `fb6f4a3fcb502a82030b6e307a17cbb0aad5b2b7` |
| Scope | 9 authorized files, +627/−78 |

## Independent Code Review verdict

**`PASS WITH NON-BLOCKING FINDINGS`** — BLOCKER **0** · MAJOR **0** · MINOR **3** · NOTE **4** ·
**Remediation required: NO**

ICR conclusion: exact scope verified · all validation green · negative control independently
reproduced · candidate unchanged · no remediation required.

---

# MINOR findings — backlog items

## MINOR-1 — Durable-adapter claim outcome constraint

**Finding.** The three-outcome `claimExecution` union has no explicit outcome for an execution
that is **no longer queued** between the preceding read and the claim. The in-memory manager
throws when the execution is not queued. A **durable adapter performing a conditional update
may need to distinguish a lost update or no-longer-claimable state without a second diagnostic
read.**

**Classification.** Pre-existing structural constraint. **Not an AR2-6 regression.**

**Backlog destination:** durable `ExecutionRunner` adapter contract · compare-and-set outcome
semantics · future persistence adapter design.

> **Coordinator note — this is the Founder's excluded fourth outcome, arriving from the other
> direction.** The Founder ruled exactly three outcomes and explicitly excluded
> `execution_not_claimable`, on the sound ground that a caller-fault condition must not be
> weakened into an ordinary negative outcome. MINOR-1 does not contest that for the in-memory
> manager. It observes that a **durable** adapter cannot always distinguish the two without a
> second read, because a conditional update returns "no rows affected" for both. **The ruling
> stands for AR2-6; the question genuinely reopens when the durable adapter is designed** —
> and it should be decided there with ADR-level review, per the standing constraint that the
> dedupe/outcome contract is not changed casually.

## MINOR-2 — `getExecution` seam consumption not pinned

**Finding.** Tests prove `claimExecution` and `heartbeat` use the injected `ExecutionRunner`,
but **do not independently prove `getExecution` is consumed through the port.** The stub
delegates `getExecution` to the real manager and does not record the call, so **a future
accidental direct-manager import for `getExecution` would pass the current suite.**

**Backlog destination:** AR2-6 seam test hardening · record or distinguish `getExecution` calls
through the injected runner.

> **Coordinator note — this is the false-assurance pattern, one method short.** It is the same
> shape as MAJOR-2 in Track A: a test that appears to pin a seam but is satisfiable without it.
> The candidate genuinely proves consumption for two of three methods; the third is unpinned.
> Cheap to close, and worth closing before anyone relies on "the seam is consumed" as a blanket
> statement.

## MINOR-3 — Broken invariant became a silent no-op

**Finding.** Before AR2-6, a heartbeat on a **running execution with no assignment** threw a
broken-invariant error. The candidate's unconditional assignment-identity comparison now causes
that state to **return silently**, because no string assignment ID can equal a `null` current
assignment.

**Classification.** Low-likelihood **observability reduction**. Not a correctness blocker.

**Backlog destination:** `ExecutionRunner` invariant observability · decide whether
running-without-assignment must remain loud.

> **Coordinator note.** This is a genuine trade the candidate made: strengthening the
> stale-worker comparison converted a loud broken-invariant signal into silence. Under the
> negative-outcome policy, a broken invariant is caller-fault and *should* stay loud — so the
> backlog decision is whether to restore the explicit throw for the null-assignment case while
> keeping the identity comparison for the stale-worker case.

---

# NOTE findings — recorded

## NOTE-1 — `agent_unavailable` is inferred

Inferred from the agent availability field. The `waiting` state appears **unreachable in
production today**, so the outcome is effectively associated with an offline agent. **This
mapping must be restated when a durable adapter can no longer inspect and update agent
availability atomically.**

## NOTE-2 — Anonymous heartbeat limitation

The stale-worker guarantee depends on the worker supplying its assignment ID. The real Trigger
worker supplies it, but **an omitted assignment ID is resolved to the execution's current
assignment**, so a hypothetical anonymous stale heartbeat could still extend the current lease.
**Pre-existing; not an AR2-6 regression.**

## NOTE-3 — Extra heartbeat read

The heartbeat route now reads the execution before calling `heartbeat` to resolve an omitted
assignment ID. Cheap in memory; **would add a network round trip under a durable adapter.**
Making assignment ID **required at the route** would remove the cost — and would also close
NOTE-2.

## NOTE-4 — Negative-control count wording

**This concerns the coordinator's own freeze record. Reconciled below rather than merely
accepted.**

| Source | Count | Scope run |
|---|---|---|
| Coordinator freeze record and tag message | **6 tests** | `agent-execution-service.test.ts` **+** `adapters/index.test.ts` (2 files) |
| Independent reviewer | **5 failures** | `agent-execution-service.test.ts` **alone** |
| Independent reviewer | **13 failures** | **all four** authorized test files |

**All three figures are consistent and scope-dependent.** The coordinator's 6 = 5 from the
service file + 1 from `index.test.ts` (*"serves an execution runner carrying the three-outcome
claim contract"*), which is exactly the two-file scope actually run.

**The defect is in the coordinator's wording, not the count.** The freeze record and the
annotated tag message state *"six tests fail"* **without naming the scope that produces six**,
which makes the figure unreproducible by anyone who runs a different file set. A count without
its scope is not a verifiable claim.

**The tag is immutable and will not be altered.** This register is the correction of record.
**Substantive result confirmed by the reviewer:** all five seam-substitution tests failed
because **the injected runner received zero calls** on the pre-AR2-6 tree.

**Backlog destination:** evidence-recording practice — negative-control results must always
record the exact command and file set, alongside the RAT-4 finding that gate results should be
recorded by literal command rather than by outcome.

---

# Disposition

**None of these is an AR2-6 blocker.** Remediation is **not** required and the candidate is
**not** respun. MINOR-1, NOTE-1, NOTE-2 and NOTE-3 converge on the same future work — the
durable `ExecutionRunner` adapter — and should be carried as one cluster rather than four
independent tickets, consistent with AR-1E's ruling that port revisions be made coherently
rather than piecemeal.
