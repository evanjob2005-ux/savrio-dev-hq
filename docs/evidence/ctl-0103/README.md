# CTL-01..03 evidence bundle

**This branch is EVIDENCE. It must never be merged.**

It sits on top of `f304d32`, the rejected three-loop CTL-01..03 candidate, and
adds the design and review artefacts that otherwise existed only on one machine
or in one agent session.

## Contents

- `CTL-01-03_REPLACEMENT_DESIGN.md` — the frozen replacement design (DESIGN-002).
  Reviewed and **failed** audit: 11 blocking findings, including that the
  proposed baseline chain permits a backward pin move, that its `_is_ancestor`
  removal leaves genesis unauthenticated, and that its single-ruleset tag
  protection is not implementable because GitHub bypass actors are per-ruleset.
  Frozen at sha256 `ad4bf5bc…80c9`; do not edit, supersede instead.
- `OPEN_FINDINGS_1244df9.md` — **UNFIXED** blocking findings against the live
  head of PR #11. The most important file here: it exists nowhere else, and CI
  cannot see any of it (that commit is 19/19 green).
- `reproductions/` — executable reproductions used across the three loops. Each
  mutates a working tree, asserts an exit code, and restores. Read the header of
  each before running; they expect a specific worktree path.
- `transformations/` — the asserted text-transformation scripts that produced
  each manifest revision, kept because they document exactly what changed and
  refuse to run if their anchors have moved.
- `SHA256SUMS.txt` — digests of everything above except itself.

## What is NOT here

The rejected candidate's own code and harness are in the parent commit
`f304d32`, not duplicated. The 91-case negative-control harness lives at
`scripts/test-verify-record-claims.py` on that commit and **cannot be
cherry-picked** to the PR line, because its cases exercise probes that do not
exist there.

## Status at the time of writing

- PR #11 open at `1244df9`, MERGEABLE, 19/19 green, **not merged**, and carrying
  the three unfixed blocking findings recorded here.
- CTL-01, CTL-02, CTL-03: **open**. OBL-30: **open**.
- No claim decides that capability tokens are drawn from a CSPRNG.
- `claims-baseline-1` is absent from origin and from every repository under
  `C:/tmp`; five copies survived in agent scratchpads and are listed in the
  findings document.
