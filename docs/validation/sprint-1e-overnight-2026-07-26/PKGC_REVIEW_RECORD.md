# Sprint 1F Package C — Independent Review Record

**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.
**Date:** 2026-07-27
**Candidate under review:** `candidate-1f-pkgc-1`
**Status:** Both required gates closed. Both approved with non-blocking findings.

---

# 0. Provenance limitation — read this before the verdicts

**The coordinator does not hold the reviewers' original documents.** Both reviews ran
in separate sessions. Their verdicts, severity counts, and finding texts reached the
coordinator as **Founder-transmitted summaries**, not as artifacts the coordinator
read directly.

This record therefore states, for every reviewer claim, that the provenance is
*Founder-transmitted review result*, not *coordinator-read review document*.

**Nothing in this record is a reconstruction of a reviewer's wording.** Finding
identifiers, verdicts, and severity counts are reproduced as transmitted. Where this
record adds analysis, the analysis is labelled as the coordinator's and is separated
from the transmitted result.

This is the same class of limitation the preserved reconciled decision record
discloses at its §0.2 about the Architecture Advisory. It is recorded here rather than
glossed, for the same reason: an auditor should be able to obtain the originals and
should know that this file is not one of them.

**What the coordinator did verify first-hand** is every repository fact the reviews
turned on. That verification is in
`RECONCILIATION_1F_PKGC_CANDIDATE_1.md` and is independent of the transmitted texts.

---

# 1. Candidate identity — verified first-hand, unchanged throughout

| Item | Value |
|---|---|
| Annotated tag | `candidate-1f-pkgc-1` |
| Tag object | `12412bb755bf5f6fdee27139ac78966085a0c2e2` |
| Object type | `tag` |
| Peeled commit | `a8a430addef13ba9b5279f39a5934d12e8b53d44` |
| Tree | `7557124f88465451592151c7f377baf0f5d65ff8` |
| Parent | `9f73e873ddd9423bdf6410a07a3c2bd4a84fbc66` |
| Parent tree | `1d3908b2a1a65bf005fe097c71a494b5dbe83275` |
| Commits after parent | exactly 1 |
| Diff against parent | 4 files changed, 3153 insertions(+), 0 deletions |

**The candidate was never modified, replaced, re-frozen, amended, rebased, or
cherry-picked at any point across both gates, the evidence dispute, or the
re-review.** Every review — including Codex's first pass, Codex's evidence re-review,
and the Architecture Review — ran against this exact object.

The four added files, and nothing else:

```text
A  docs/plans/SPRINT_1F_MISSION_CONTROL_LITE.md
A  docs/plans/SPRINT_1F_TRACK_B_DECISION_PACKAGE.md
A  docs/plans/SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md
A  docs/plans/SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md
```

---

# 2. Codex Independent Code Review

## 2.1 First pass — the original result, recorded in full

**Verdict as transmitted: `UNABLE TO VERIFY`.**

**`PKGC-ICR-001` — BLOCKER, unavailable evidence.**

Codex verified candidate identity, the exact four-file scope, document integrity, the
authorization posture, and the sensitive-content posture. It **declined approval**
because it believed only truncated eight-character pre-staging SHA-256 prefixes and
file sizes were available, which would have prevented a full comparison of the
original untracked source files against the candidate blobs.

**This original result is preserved deliberately and is not concealed.**

**Root cause: an evidence-transmission failure by the coordinator, not a defect in
the candidate.** The candidate-freeze report did contain the complete 64-character
SHA-256 values, but they were rendered inside a Markdown table and line-wrapped in
transmission, reaching the reviewer truncated. The reviewer's refusal to approve on
incomplete evidence was **correct behaviour** and is recorded as such.

The corrective lesson, recorded for future packages: **cryptographic evidence must not
be transmitted inside a wrapping table cell.** Full-width hashes belong in a fenced
block or on their own line, and a review brief should name the command the reviewer
can run to derive them independently rather than relying on transcription.

## 2.2 Evidence re-review — final result

**Final verdict as transmitted: `APPROVE WITH NON-BLOCKING FINDINGS`.**

| Finding | Severity | Disposition |
|---|---|---|
| `PKGC-ICR-001` | was BLOCKER | **RESOLVED** |
| `PKGC-ICR-002` | MINOR | Accepted; carried by the custody note |
| `PKGC-ICR-003` | NOTE | Accepted; recorded, intentionally not fixed |

**No unresolved blocker.**

Codex independently verified exact byte preservation across all four source files,
the surviving untracked source copies, the complete pre-staging SHA-256 values, the
candidate blob hashes, the file sizes, and the blob identities.

**The candidate was not changed to resolve the blocker.** Only the evidence available
to the reviewer changed.

## 2.3 `PKGC-ICR-002` — MINOR, upheld against the coordinator

Codex found that the candidate metadata claimed **two** stale custody-state statements
while **at least five** exist.

**Upheld. The coordinator's freeze report was wrong.** Verified count is five direct
self-descriptive statements, plus a sixth cross-referential one the coordinator
identified during reconciliation. All six are enumerated in
`docs/plans/SPRINT_1F_TRACK_B_CUSTODY_NOTE.md` §3.

The coordinator's error was scope, not substance: the freeze report inspected the two
documents' closing custody paragraphs and did not sweep the status headers. The
disclosure was incomplete and is corrected in the custody note.

## 2.4 `PKGC-ICR-003` — NOTE, confirmed

Heading hierarchy skips from level one to level three in the Mission Control Lite plan.

**Confirmed by coordinator re-derivation:** exactly one skip exists across all four
documents, at `SPRINT_1F_MISSION_CONTROL_LITE.md:287` — `# 4. User journeys` (line
282, level 1) followed by `### J-1 …` (line 287, level 3). Fence-aware scan; no other
skip anywhere in the corpus.

**Recorded, intentionally not fixed.** Rationale in the custody note §8.

---

# 3. Claude Architecture Review

**Final verdict as transmitted: `APPROVE WITH NON-BLOCKING FINDINGS`.**

| Severity | Count |
|---|---|
| BLOCKER | 0 |
| MAJOR | 3 |
| MINOR | 6 |
| NOTE | 2 |

The Architecture Review approved **preserving and advancing the exact candidate
unchanged**, with stale and contradictory planning-state claims handled through an
**additive, forward-only custody clarification** rather than edits to the four
preserved documents.

## 3.1 The three MAJOR findings, and their first-hand verification

Each was verified by the coordinator directly against the candidate tree. The
verification is the coordinator's own and does not depend on the transmitted text.

| Finding as transmitted | Coordinator verification | Result |
|---|---|---|
| The reconciled record says eight Founder decisions were accepted while the tracked entry package still records them as open | `SPRINT_1F_ENTRY_PACKAGE.md` lists all eight under "Remaining UX blockers", records Track B as BLOCKED, and records itself as OPEN and NOT FINALIZED | **CONFIRMED** |
| The corpus says AR2-6 is unimplemented even though it was completed and approved at `8c2eb9a` / `sprint-1f-ar2-6-approved` | `git merge-base --is-ancestor 8c2eb9a a8a430ad` returns true; `sprint-1f-ar2-6-approved` peels to `8c2eb9a738fafb22ed9ab896ce23cb3e7a9ecd1c`; the shipped `ClaimExecutionResult` is the three-outcome union and `heartbeat` carries `assignmentId` | **CONFIRMED** |
| The corpus says frontend test infrastructure is absent even though PKG-2 delivered jsdom, the DOM test project, Playwright configuration, and smoke testing | `jsdom` and `@testing-library/react` in `package.json`; `vitest.config.ts` project `dom` with `environment: "jsdom"`; `test/setup-dom.ts`; `playwright.config.ts`; `e2e/smoke.spec.ts`; CI enforcement in `frontend-tests.yml` | **CONFIRMED** |

## 3.2 Additional findings, verified

| Finding | Verification | Result |
|---|---|---|
| Stale custody, HEAD-anchor, verification-anchor, tie-break, and tracked/untracked statements | Enumerated in the custody note §§3–7 | **CONFIRMED** |
| Timeline tie-break contradiction | `SPRINT_1F_MISSION_CONTROL_LITE.md:681` requires "record kind, then id"; `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md:272-273` forbids raw-ID lexicographic tie-break | **CONFIRMED** |
| Client-versus-server ordering | `SPRINT_1F_MISSION_CONTROL_LITE.md:679` orders in the client `view-model.ts`; Output 5 moves assembly server-side; ADR-0002 §E5 unamended | **CONFIRMED** |
| Entry package described as untracked | `SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md:72` says untracked; `docs/plans/SPRINT_1F_ENTRY_PACKAGE.md` is tracked | **CONFIRMED** |
| Stale `fb6f4a3` anchors | Three occurrences; active-line tip is `9f73e873` | **CONFIRMED** |
| Mission Control `VERIFIED` anchor | Anchored to `057e12c` / `6301c06`; at least one VERIFIED claim now false | **CONFIRMED** |

**One coordinator observation, not a reviewer finding.** The staleness is not confined
to the preserved corpus: the **tracked** `SPRINT_1F_ENTRY_PACKAGE.md` also records
"Frontend test infrastructure absent" as OPEN. That is a pre-existing tracked defect,
outside Package C's authorized scope, and is logged in
`SPRINT_1F_FOLLOWUP_REGISTER.md` rather than corrected here.

---

# 4. Accepted non-blocking findings

All findings from both gates are accepted as non-blocking and are discharged by the
additive custody note at `docs/plans/SPRINT_1F_TRACK_B_CUSTODY_NOTE.md`. **None is
discharged by editing a preserved document**, and none required a new candidate.

| Source | Finding | Discharge |
|---|---|---|
| ICR | `PKGC-ICR-002` six stale custody statements | Custody note §3 |
| ICR | `PKGC-ICR-003` heading-level skip | Custody note §8 — recorded, not fixed |
| AR | AR2-6 described as unbuilt | Custody note §1.1 |
| AR | Three-outcome contract posed as open | Custody note §1.2 |
| AR | Test infrastructure described as absent | Custody note §1.3 |
| AR | Eight decisions accepted vs open | Custody note §2 |
| AR | Stale `fb6f4a3` anchors | Custody note §4 |
| AR | Stale VERIFIED anchors | Custody note §5 |
| AR | Timeline tie-break and ordering contradiction | Custody note §6 — routed, **not decided** |
| AR | Entry package described as untracked | Custody note §7 |

**Two items were deliberately routed rather than resolved.** The eight Founder
decisions (custody note §2) and the timeline ordering contract (custody note §6) are
not settled by this package. Settling either would exceed the coordinator's authority:
the first belongs to the Founder, the second to the Architecture Reviewer with Founder
ratification of the ADR amendment.

---

# 5. Continuing prohibition

**Track B implementation remains BLOCKED and unauthorized.**

Package C is documentation custody only. Neither review, this record, the custody
note, nor the advancement of the active line authorizes any Track B work.

Separately unresolved and each requiring its own authorization: ADR-0003 · the FD-5
exhaustive mutating-route audit · DESIGN-001 approval and addenda · hosting and
deployment target · authentication · NB-1 remediation and mobile Family B ·
handbook promotion and roadmap tracking · `.github/CODEOWNERS` · Security workflow
repair.
