# Sprint 1F Package C — Candidate 1 Byte-Preservation Reconciliation

**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.
**Date:** 2026-07-27
**Candidate:** `candidate-1f-pkgc-1` → `a8a430addef13ba9b5279f39a5934d12e8b53d44`
**Purpose:** resolve `PKGC-ICR-001` without altering the candidate.

**Everything in this file is coordinator-verified first-hand.** Unlike
`PKGC_REVIEW_RECORD.md`, which relays Founder-transmitted review results, this
reconciliation rests only on commands the coordinator executed and on repository state
any reviewer can reproduce.

---

# 1. The dispute

The Independent Code Review returned `UNABLE TO VERIFY` with `PKGC-ICR-001`, a
blocker, on the ground that only truncated eight-character pre-staging SHA-256
prefixes and file sizes were available. Without complete values, byte-for-byte
preservation could not be confirmed.

**The premise was mistaken, and the mistake was the coordinator's fault.** Complete
64-character values existed and were recorded in the candidate-freeze report, but they
were rendered inside a Markdown table and line-wrapped in transmission, arriving
truncated.

**The candidate was never at issue.** No defect in `a8a430ad` was alleged, and none
was found.

---

# 2. Provenance of the pre-staging values

| Question | Answer |
|---|---|
| Source | Contemporaneous shell output |
| When | Second command of the Package C session, before any copy, before any `git add`, before the implementation worktree existed |
| Where | The coordinator worktree — the checkout holding the untracked source copies |
| Commands | `sha256sum`, `git hash-object`, `wc -c`, `git ls-files --error-unmatch` |
| Tracked status at measurement | `git ls-files --error-unmatch` returned "did not match any file(s) known to git" for all four — untracked, confirmed at the moment of measurement |
| Relationship to the freeze report | The freeze report was written **from** that output |
| Post-commit reconstruction? | **No** |

---

# 3. The four documents — complete evidence

| Document | Pre-staging SHA-256 | Candidate-blob SHA-256 | Bytes | Blob ID |
|---|---|---|---|---|
| `SPRINT_1F_MISSION_CONTROL_LITE.md` | see §3.1 | identical | 174700 | `e8356093854b42616299f8e6be4c920ea33e73f6` |
| `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` | see §3.1 | identical | 19371 | `f43385434ec38f16ae9679533936422b0dd47d40` |
| `SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md` | see §3.1 | identical | 49709 | `be3c4deaccdfdc4bcea83cdf03d70b7526f31059` |
| `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md` | see §3.1 | identical | 26115 | `3111ff11bf43e1a0265df21989cf5621a27ee175` |

## 3.1 Complete SHA-256 values

Recorded in a fenced block, one full-width value per line, so no renderer can wrap or
truncate them. This format is now the standard for transmitting cryptographic evidence
in this repository.

```text
230f0f707cfc77fe63ed693d3e2e1879178f59bbc8c39acc96301705b6dbcae4  SPRINT_1F_MISSION_CONTROL_LITE.md
9d31f97f72995eba28d50935d2158964aa7a66962d34da0ed5d10724d667a697  SPRINT_1F_TRACK_B_DECISION_PACKAGE.md
7ae7928094767897bb4ada918ca63ce2e5f7321648c9aaf34ef748c4d3ad923c  SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md
49abdd25a7887796674417363415798ba4bcc254df7d6a5d0a9f5acda4dfbc4d  SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md
```

**These are simultaneously the pre-staging values and the candidate-blob values.** All
four match exactly, on both content hash and size. 4 of 4.

## 3.2 Reproduction commands

Any reviewer can re-derive both sides:

```text
sha256sum docs/plans/<name>.md

git cat-file blob $(git rev-parse 7557124f88465451592151c7f377baf0f5d65ff8:docs/plans/<name>.md) | sha256sum
git cat-file -s $(git rev-parse 7557124f88465451592151c7f377baf0f5d65ff8:docs/plans/<name>.md)
```

---

# 4. Why filters could not have altered the content

`core.autocrlf=true` on the authoring machine, and `.gitattributes` declares
`* text=auto eol=lf` with `*.md text`. A clean filter could in principle have rewritten
line endings during `git add`.

**It did not, and this is proven rather than asserted.** The comparison in §3.2 is
deliberately filter-sensitive: it compares the raw bytes on disk against the raw bytes
stored in the object database, retrieved with `git cat-file blob`. Equality on all
four files means no filter transformed anything.

Independently corroborating: all four documents are pure LF with zero CRLF and zero
lone CR, and carry no BOM, so the `eol=lf` and `text` attributes had nothing to
convert.

---

# 5. The surviving source copies

The four original untracked files still exist in the coordinator worktree at
`docs/plans/`, and were re-hashed during reconciliation to the same values.

| Document | Source mtime |
|---|---|
| `SPRINT_1F_MISSION_CONTROL_LITE.md` | 2026-07-26 12:27:12 -0400 |
| `SPRINT_1F_TRACK_B_DECISION_PACKAGE.md` | 2026-07-26 15:27:42 -0400 |
| `SPRINT_1F_TRACK_B_DESIGN_ADVISORY.md` | 2026-07-26 15:30:04 -0400 |
| `SPRINT_1F_TRACK_B_RECONCILED_DECISION_RECORD.md` | 2026-07-26 15:38:22 -0400 |

Candidate commit time: **2026-07-27 12:20:23 -0400.**

Every source file was last written roughly 21 hours **before** the commit. None was
written during Package C: the process read them and copied one-way into the
implementation worktree, and no step wrote back. Being untracked, they were never
written by a checkout, merge, or reset either.

This is the evidence a reviewer can reproduce **without trusting any coordinator
record** — hash the surviving files, hash the blobs, compare.

## 5.1 Stated limitation

Modification times and an unlocked worktree are **not tamper-proof**. This is strong,
reproducible evidence; it is not cryptographic attestation of a chain of custody.

No pre-commit working-tree file in this repository can carry the latter, and this
record does not claim it does.

**What is fully proven is the property that matters: the commit process altered no
byte.** Whether the pre-commit files were themselves authentic rests on the surviving
copies, their timestamps, the contemporaneous measurement, and their mutual agreement.

---

# 6. Outcome

| Item | Result |
|---|---|
| `PKGC-ICR-001` | **RESOLVED** |
| Replacement candidate required | **No** |
| Candidate modified | **No** — `a8a430ad` unchanged throughout |
| Byte-for-byte preservation | **Confirmed, 4 of 4** |
| Independently re-verified by the Independent Code Reviewer | **Yes** — final verdict `APPROVE WITH NON-BLOCKING FINDINGS` |

---

# 7. Coordinator corrections arising from this reconciliation

Recorded because a package that only reports the reviewer's errors is not an honest
record.

1. **Evidence transmission.** Cryptographic values were transmitted inside a wrapping
   Markdown table and reached the reviewer truncated, costing a full review cycle.
   Full-width hashes now go in a fenced block, one per line, with the derivation
   command supplied — as in §3.1 and §3.2 above.

2. **Incomplete disclosure of stale custody statements.** The candidate-freeze report
   disclosed **two** self-descriptive custody statements falsified by the commit. The
   verified count is **six**. The freeze report inspected closing custody paragraphs
   and failed to sweep the status headers. Corrected in
   `docs/plans/SPRINT_1F_TRACK_B_CUSTODY_NOTE.md` §3. `PKGC-ICR-002` is upheld against
   the coordinator.

Neither error affected the candidate, and neither was found by the coordinator without
a reviewer first raising it.
