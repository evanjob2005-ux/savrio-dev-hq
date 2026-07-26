# Architecture Review — Sprint 1F AR2-6 Candidate 1

**Preservation note.** This review was **delivered inline only** — the reviewer returned it in
its session tab and wrote no file. It existed nowhere on disk until preserved here by the Main
Coordinator under Founder authorization, **without modifying the approved candidate**. The
handoff block below is reproduced verbatim as received; the coordinator's own verification
follows it, clearly separated.

**Custody before preservation:** inline only — no artifact existed.
**Custody after preservation:** this path.

---

## Handoff block — verbatim as received

```
=== AR2-6 CANDIDATE 1 — ARCHITECTURE REVIEW HANDOFF ===

Candidate:        candidate-1f-ar2-6-1
Commit:           8c2eb9a738fafb22ed9ab896ce23cb3e7a9ecd1c
Tree:             f9d6ea759b1920bcdda470abc17d2941288dbb64
Baseline:         fb6f4a3fcb502a82030b6e307a17cbb0aad5b2b7
Reviewer:         Independent Architecture Reviewer (read-only)
Date:             2026-07-26

VERDICT:          APPROVE WITH FINDINGS

Counts:           BLOCKER 0 | MAJOR 0 | MINOR 5 | NOTE 5
Remediation:      NO

Identity:         VERIFIED (annotated tag; peels exact; tree exact;
                  worktree detached and clean; no tracked/staged/untracked changes)
Scope:            VERIFIED (9 files, +627/-78, all modifications,
                  no forbidden-path changes; ADRs/store.ts/docs/agents/configs untouched)

Validation (independently re-run, not inherited):
  Negative control ..... relied on ICR for reproduction;
                         architectural meaning independently verified

ADR compliance:   ADR-0001 COMPLIANT | ADR-0002 COMPLIANT
                  Execution Manager purity preserved (type-only contract import)
                  Service-layer event ownership preserved (E3)
                  No event per heartbeat (E3)
                  Single orchestration owner; no second lifecycle state machine
                  CAS atomic section intact — no await between check and write
                  Dedupe keys and event taxonomy unchanged

Key improvements: 1. ExecutionRunner converted from inert declaration to
                     consumed seam (negative control discriminates the two)
                  2. DEFECT FIXED — adapter dropped heartbeat assignment identity,
                     making the manager's stale-worker guard unreachable across
                     the port; an abandoned run could extend a successor's lease
                  3. Timeline no longer asserts a false cause for a declined claim

ICR finding disposition:
  MINOR-1 (no not-queued outcome) ....... CONFIRMED MINOR, not elevated (gated)
  MINOR-2 (getExecution not pinned) ..... CONFIRMED MINOR, not elevated (widened into AR-M1)
  MINOR-3 (running-w/o-assignment no-op)  CONFIRMED MINOR, not elevated (state unreachable)
  NOTE-1/2/3/4 .......................... all confirmed; NOTE-2 carried at MINOR (AR-M2)
  >>> NONE warrants elevation to BLOCKER or MAJOR

Follow-up register (conditions on FUTURE authorizations, not this candidate):
  GATE-1  Before any second/durable ExecutionRunner is registered: convert or
          explicitly authorize the remaining direct manager bypasses in
          agent-execution-service.ts (releaseExecution, reclaimStale, getExecution
          at L935), and add a "no longer queued" claim outcome. Attach the five
          portable CAS obligations from the report.
  GATE-2  Once no legacy worker can exist, reject an omitted assignmentId at the
          internal heartbeat route instead of resolving it at the edge.

FOUNDER RECOMMENDATION:
  APPROVE UNCHANGED. Promote 8c2eb9a7 to a protected AR2-6 checkpoint.
  Do NOT re-cut the candidate for these findings.

Report path:      inline only (returned in the reviewer tab)

CANDIDATE UNCHANGED: CONFIRMED — no edits, no staging, no commits, no tag
  operations, no worktree modification. HEAD, tree, clean status, and diff
  shortstat all re-verified identical AFTER validation completed.
```

---

## Coordinator note — the defect this review names

The reviewer records as **Key improvement 2** a defect fixed rather than merely a contract
tidied:

> **The adapter dropped heartbeat assignment identity, making the manager's stale-worker guard
> unreachable across the port; an abandoned run could extend a successor's lease.**

This is worth stating plainly in the closure record. AR2-6 was carried as a *contract* item —
"the port understates an invariant." The architecture review establishes that the understatement
had a **reachable consequence**: any consumer going through the port lost the stale-worker
guard entirely, so an abandoned worker could keep a successor attempt's lease alive and mask
its failure. The port was inert, so nothing exercised it — but the moment it was consumed, that
gap would have become live. AR2-6 closed it in the same change that made the seam consumable.

## Scope of this review — recorded honestly

The reviewer states it **relied on the ICR for negative-control reproduction** and independently
verified the architectural meaning rather than re-running the mutation itself. Both gates
therefore rest on **one** execution of the negative control, performed by the ICR and separately
by the coordinator during implementation verification. No third independent reproduction exists.

## Cross-gate agreement

| ICR finding | Architecture disposition |
|---|---|
| MINOR-1 no not-queued outcome | Confirmed MINOR, **gated** — not elevated |
| MINOR-2 `getExecution` not pinned | Confirmed MINOR, **widened into AR-M1** |
| MINOR-3 running-without-assignment no-op | Confirmed MINOR, state unreachable |
| NOTE-1 / 2 / 3 / 4 | All confirmed; **NOTE-2 carried at MINOR as AR-M2** |

**No ICR finding was elevated.** The two gates agree on severity throughout, reached
independently.

## Architecture follow-up gates — future authorizations, NOT AR2-6 remediation

### GATE-1 — before any second or durable `ExecutionRunner` is registered

- Convert or explicitly authorize the remaining **direct manager bypasses** in
  `agent-execution-service.ts` — `releaseExecution`, `reclaimStale`, and `getExecution` at L935
- Add a **"no longer queued" claim outcome**
- Carry forward the **five portable CAS obligations** from the reviewer's full report

> This is where the Founder's excluded fourth `claimExecution` outcome legitimately returns.
> The three-outcome ruling stands for AR2-6 and for the in-memory manager; a durable adapter's
> conditional update cannot always distinguish *not-queued* from *lost update* without a second
> read. **The question reopens at durable-adapter design, with ADR-level review — not before.**

### GATE-2 — once no legacy worker can exist

- **Require `assignmentId` at the internal heartbeat route**
- **Reject omission** rather than resolving it to the execution's current assignment

> This closes ICR NOTE-2 (anonymous stale heartbeat could still extend the current lease) and
> ICR NOTE-3 (the extra read exists only to resolve an omitted id) in one change.

**Neither gate is AR2-6 remediation. Neither conditions this checkpoint.**
