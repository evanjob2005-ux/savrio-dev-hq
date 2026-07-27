# Sprint 1F Track B — Custody Note and Forward Corrections

**Document ID:** PKGC-OBLIGATION-A
**Status:** CUSTODY CLARIFICATION. Additive and forward-only.
**Authority:** Sprint 1F Package C, Founder-authorized. CONST-001, GOV-001, AGENT-001.
**Date:** 2026-07-27
**Applies to commit:** `a8a430addef13ba9b5279f39a5934d12e8b53d44`
**Candidate tag:** `candidate-1f-pkgc-1`
**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.

---

# 0. What this note is

Sprint 1F Package C committed four Track B planning documents byte-for-byte,
deliberately unedited:

- `docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md`
- `docs/plans/SPRINT_1F_TRACK_B_DECISION_PACKAGE.md`
- `docs/plans/SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md`
- `docs/plans/SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md`

They are historical planning records. They state what was believed on 2026-07-26,
and that is their value. Several statements inside them were already false when
committed, and others have been overtaken by work delivered since.

This note corrects the record **forward**. It edits nothing. Where this note and a
preserved document conflict, **this note governs**, and the preserved text stands as
the historical position.

**Custody is not approval. Committing these documents authorizes nothing.**

This note settles nothing that belongs to another authority. It does not resolve the
eight Founder decisions and it does not choose a timeline ordering contract. Where an
open question exists, it is recorded as open and routed, not decided here.

---

# 1. Superseded by delivered work

## 1.1 AR2-6 is closed

`SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md` Output 4 and Output 7
(Authorization Request A) treat the AR2-6 `ExecutionRunner` seam repair as unbuilt
and awaiting Founder authorization.

**It was implemented, reviewed, and approved before this commit:**

| Item | Value |
|---|---|
| Commit | `8c2eb9a738fafb22ed9ab896ce23cb3e7a9ecd1c` |
| Approval tag | `sprint-1f-ar2-6-approved` |
| Candidate tag | `candidate-1f-ar2-6-1` |
| Relationship to this commit | ancestor of `a8a430ad` |

**Authorization Request A is discharged, not pending.** Anyone reading Output 7
should treat Request A as a closed historical request.

## 1.2 The `claimExecution` outcome contract is resolved

Output 4 §4.2 and prerequisite A-P1 pose as an open Founder question whether the
`claimExecution` outcome union has three members or four, and record the coordinator's
recommendation to keep three.

**Resolved and shipped as three** — the recommended option.
`types/contracts/execution-runner.ts` defines:

```text
ClaimExecutionResult =
  | { outcome: "claimed"; execution: Execution }
  | { outcome: "lost_to_concurrent_claim" }
  | { outcome: "agent_unavailable" }
```

The same contract carries `heartbeat(executionId: string, assignmentId: string)`, so
the assignment-identity requirement Output 4 §4.3 and acceptance criterion A2 called
for is present on the port rather than dropped at the adapter.

**A-P1 is closed.** Output 4's open question should not be re-asked.

## 1.3 Frontend test infrastructure was delivered

`SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` §7 (FD-6), the Design Advisory, and
`SPRINT_1F_MISSION_CONTROL_LITE.md` §15.1 describe component and end-to-end test
capability as absent — no `.tsx` collection, no Playwright configuration, and in
FD-6's table `jsdom (0)`.

**Superseded by Sprint 1F PKG-2 and PKG-3**, both ancestors of this commit:

| Capability | Evidence in this tree |
|---|---|
| `jsdom` | `package.json` devDependency `jsdom` |
| DOM-capable Vitest project | `vitest.config.ts` project `dom`, `environment: "jsdom"` |
| DOM setup file | `test/setup-dom.ts` |
| Component testing library | `package.json` devDependency `@testing-library/react` |
| Playwright configuration | `playwright.config.ts` |
| E2E smoke test | `e2e/smoke.spec.ts` |
| CI enforcement | `.github/workflows/frontend-tests.yml` jobs `Unit and Static Validation` and `End-to-End Smoke` |

Both CI jobs are required status checks on the active line under repository ruleset
`Sprint 1F active line protection`.

**FD-6's testing rationale is historical.** Its authentication-dependency and
`web-push` components are unaffected by this correction and remain open.

---

# 2. Founder-decision status — the tracked entry package governs

`SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md` Output 1 records eight decisions as
**ACCEPTED**: FD-1, FD-3, FD-4, FD-5, FD-6, FD-7, FD-26, and ACR-001 X-8.

The tracked `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` records the same eight under
**Remaining UX blockers**, records Track B as **BLOCKED**, and records itself as
**OPEN and NOT FINALIZED**.

**Until a separate durable Founder decision record exists in the repository, the
tracked entry package governs and all eight remain OPEN for implementation purposes.**

No such record exists as of this commit. The reconciled record is the only source
asserting acceptance, and a document cannot ratify itself.

**This is a documentation gap, not a finding that any decision was wrongly made or
that the Founder did not decide.** This note takes no position on what was decided in
conversation. It records only what the repository can currently evidence, and that no
implementation may proceed on the strength of the reconciled record alone.

---

# 3. Custody-state statements that this commit falsified

Six statements describe these documents as uncommitted or untracked. All were true
when written. All are false as of `a8a430ad`. All are preserved unedited by design —
correcting them in place would destroy the byte-for-byte custody the package exists to
establish.

| # | Location | Statement |
|---|---|---|
| 1 | `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md:3` | "planning only. **Uncommitted.**" |
| 2 | `SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md:353` | "One file was created: this one … new, **untracked**." |
| 3 | `SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md:355` | "**Nothing was staged, committed, tagged, or pushed.**" |
| 4 | `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md:3` | "PLANNING ONLY. **Uncommitted.**" |
| 5 | `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md:408` | "**Not staged, not committed.**" |
| 6 | `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md:39` | "the file is **untracked**" — of the Design Advisory, now tracked |

Items 1–5 are the set the Independent Code Review raised as `PKGC-ICR-002`. Item 6 is
cross-referential — one preserved document describing another — and was added during
coordinator reconciliation. The Package C candidate-freeze report originally disclosed
only two of the six; that undercount is corrected here and in
`docs/validation/sprint-1e-overnight-2026-07-26/RECONCILIATION_1F_PKGC_CANDIDATE_1.md`.

---

# 4. Stale repository anchors

`fb6f4a3` and `fb6f4a3f` appear as current HEAD or protected state at:

| Location | Text |
|---|---|
| `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md:5` | "Protected state: HEAD `fb6f4a3`" |
| `SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md:15` | "Repository state inspected: … HEAD `fb6f4a3`" |
| `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md:5` | "Track A: CLOSED at `fb6f4a3f`" |

The active line is `feature/dev-hq-operating-system`. Its tip at this commit's parent
is `9f73e873ddd9423bdf6410a07a3c2bd4a84fbc66`.

**Read every `fb6f4a3` reference as a 2026-07-26 anchor, never as current state.**

The Track A checkpoint identities those documents cite —
`sprint-1f-tracka-approved` = `candidate-1f-tracka-1` = `d1c86e9` — remain correct
and are not affected by this correction.

---

# 5. The Mission Control plan's VERIFIED anchors do not establish current truth

`SPRINT_1F_MISSION_CONTROL_LITE.md` marks claims **VERIFIED** against `057e12c`,
re-stated to `357f03b` and then `6301c06`, and states plainly at its header that
nothing was re-run to produce those restatements.

Those anchors predate Sprint 1E ratification, Sprint 1F Track A, AR2-6, PKG-2, and
PKG-3.

**A VERIFIED label in that document attests to a 2026-07-26 reading of a superseded
tree. It does not attest to the current tree.** At least one such claim is now false:
§15.1's `vitest.config.ts` "`environment: "node"`, no `.tsx` collected" is superseded
by the `dom` project described in §1.3 above.

**Re-verify against the current tree before relying on any VERIFIED claim in that
document.** The same caution applies to its line-referenced source citations, which
were taken against `057e12c`.

---

# 6. Timeline ordering — an unresolved contradiction inside this commit

Two preserved documents specify incompatible tie-breaks, and both are in this commit:

| Document | Position |
|---|---|
| `SPRINT_1F_MISSION_CONTROL_LITE.md:681` | "Ties must have a deterministic secondary sort (**record kind, then id**)." |
| `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md:272-273` | "**Raw ID lexicographic ordering must not be used as a tie-break.**" Ordering is `(timestamp, sequence)` with a server-assigned monotonic sequence. |

A related contradiction concerns **where** ordering happens:

| Document | Position |
|---|---|
| `SPRINT_1F_MISSION_CONTROL_LITE.md:679` | The timeline orders by ISO timestamp string comparison in the client `view-model.ts` |
| `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md` Output 5 | Assembly and ordering move server-side |

**Neither position is authoritative and this note does not choose between them.**

ADR-0002 §E5 is **unamended** at this commit and remains the governing text: it still
reads "assembled in the Mission Control view-model layer". The proposed amendment in
Output 5 is a **draft for Architecture Reviewer refinement and Founder ratification**,
not an approved ADR change.

**The tie-break and assembly-location contracts are open architecture items** owed
under AA-1 and must be settled through the proper architecture process — Architecture
Reviewer drafts, Founder ratifies the ADR amendment — before any timeline read-model
is built. **Implementers must not resolve this by preference or by picking the
document they read last.**

---

# 7. Tracked and untracked corrections

`SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md:72` describes the Sprint 1F Entry Package as
untracked.

**That is false. It is tracked:** `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md`.

For contrast, and recorded so this correction is not over-applied:
`SPRINT_1F_MISSION_CONTROL_LITE.md:50` describes its five named peer artifacts —
DESIGN-001, `docs/plans/PHASE_2_PROGRAM_PLAN.md`, `docs/research/RESEARCH_BACKLOG.md`,
the Context Lifecycle Manager specification, and
`docs/plans/GOVERNANCE_UPDATE_PLAN.md` — as untracked working-tree files. **That
remains accurate** as of this commit and is not corrected here.

---

# 8. Recorded and intentionally not fixed

`SPRINT_1F_MISSION_CONTROL_LITE.md:287` skips a Markdown heading level: `# 4. User
journeys` at line 282 is followed by `### J-1 …` at line 287, level 1 to level 3. It
is the only heading-level skip in the four preserved documents.

**Recorded, not fixed.** Raised by the Independent Code Review as `PKGC-ICR-003`,
severity NOTE. Fixing it would edit a preserved document for a cosmetic gain and break
byte-for-byte custody. Repository policy makes it non-blocking: `lint.yml` runs
Markdown style linters in advisory mode by design, and the blocking Markdown gate in
`pr.yml` validates fence balance only, which all four documents pass.

---

# 9. What custody does not do

This commit, this note, and the Package C closure:

- do **not** authorize Track B implementation — **Track B remains BLOCKED and
  unauthorized**;
- do **not** amend ADR-0001 or ADR-0002 — both are byte-unchanged, and ADR-0002 §E5
  retains its original "assembled in the Mission Control view-model layer" clause;
- do **not** create, number, or approve ADR-0003 — `docs/decisions/` contains
  ADR-0001 and ADR-0002 only;
- do **not** ratify the ADR-0002 E5 amendment drafted in Output 5;
- do **not** complete, discharge, or partially satisfy the FD-5 exhaustive
  mutating-route audit specified in Output 3;
- do **not** approve DESIGN-001 or author any DESIGN-001 addendum;
- do **not** resolve hosting, deployment target, or authentication;
- do **not** repair `.github/CODEOWNERS` or the Security workflow;
- do **not** promote the Permanent Operating Handbook out of draft or track the
  Master Roadmap;
- do **not** resolve NB-1 or authorize any mobile Family B surface;
- do **not** authorize any source-code implementation of any kind.

Each remains a separate unresolved item requiring its own authorization.

**Preservation is custody, not approval.**

---

# 10. How to read the corpus after this note

1. Treat all four documents as **dated planning inputs**, not current state.
2. Treat every commit SHA, HEAD anchor, VERIFIED label, and custody statement in them
   as **historical**, and re-verify before relying on it.
3. Where they conflict with each other, consult §6 and the proper owning authority —
   do not resolve the conflict yourself.
4. Where they conflict with this note, **this note governs**.
5. Where they appear to authorize work, they do not. Authorization comes from a
   Founder decision record, not from a preserved plan.
