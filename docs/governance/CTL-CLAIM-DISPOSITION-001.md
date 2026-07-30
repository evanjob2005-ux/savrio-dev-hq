# Record-claim disposition — one retirement, fourteen restatements

**Document ID:** CTL-DISP-001
**Version:** 1.0.0
**Status:** Active record. Not a release approval and not a closure of CTL-01, CTL-02 or CTL-03.
**Date:** 2026-07-30
**Authority:** Founder-directed stabilization ("Option A"), acting on the final independent audit of the CTL-01..03 batch.
**Applies to:** `docs/claims.json`, `scripts/verify-record-claims.py`

---

## 1. Why this record exists

`scripts/verify-record-claims.py` states, in its own header, that deleting a
claim to restore green is the one response that is never correct. At this commit
the verifier has **no machine-enforced retirement mechanism** — no
`retired_claims`, no baseline, no coverage check. A deletion from
`docs/claims.json` is therefore indistinguishable, to the control, from the
forbidden move.

This record is what makes the difference. It names what was removed, why, on
whose authority, and — most importantly — **what is now unguarded as a result**.
Without it the retirement below would be exactly the act the control forbids.

## 2. What was found

An independent audit of the claims control reproduced, at commit `f304d32` and
against these same probes, a set of mutations that break a claimed property
while the control reports the claim holds. The mutations and their transcripts
are preserved on the branch named in §6.

The relevant finding for this record: several claim **statements assert more
than their probes decide**. A reader of `docs/claims.json` would reasonably
conclude that a property is checked when only adjacent text is matched. That is
the same defect class the control was built to catch, occurring in the control's
own manifest.

## 3. Retired

### `capability-token-uses-node-crypto`

- **Probe:** `grep-present`, pattern `randomUUID\(\)`, over the whole of
  `lib/dev-hq/id.ts`.
- **Asserted:** "lib/dev-hq/id.ts implements nextCapabilityToken over
  randomUUID() from node:crypto."
- **Actually decided:** that the eleven characters `randomUUID()` occur
  somewhere in that file. A comment satisfies it. The generator can return a
  predictable counter with the claim green.
- **Reason for retirement rather than restatement:** an honest restatement would
  read "the identifier occurs somewhere in this file", which decides nothing
  about the property and occupies a slot that reads as coverage of it. Removing
  it is the more truthful act.
- **Authority:** Founder-directed stabilization, 2026-07-30.

**What is now unguarded, stated plainly:** no claim in this manifest decides
that capability tokens are drawn from a CSPRNG.
`lib/dev-hq/capability-token.test.ts` exists and executes in the Vitest node
project. It is genuine evidence against the *previous* predictable generator —
it fails if `nextCapabilityToken` delegates to `nextId` — but it does **not**
prove CSPRNG derivation: a deterministic 32-hex counter satisfies every
assertion in it. And no claim pins that test, so deleting it turns nothing red
here. Closing this needs an executed derivation test plus a claim that pins it;
both are deferred (§5).

## 4. Restated — probe unchanged, statement narrowed to what it decides

No probe, pattern, path or argument was altered. Only `statement` text changed.

- **`pkg3-approval-tag-exists`** — dropped "and is annotated". `tag-present` is
  satisfied by a lightweight ref.
- **`sec6-review-token-from-csprng`** — was "the review callback token is minted
  by `nextCapabilityToken("rvt")`"; a whole-file grep over ~945 lines decides
  only that the text occurs. Restated as occurrence evidence, explicitly not
  proof of the mint site.
- **`event-store-has-no-retention-cap`** — was "no slice, splice, shift, or cap
  **of any kind**". The probe decides only that five named identifiers are
  absent; a cap written by assigning to `.length`, by rebinding the array, or in
  another file passes it. Restated to the identifiers, with the evasions named.
- **`event-buffer-size-is-a-page-limit`** — dropped "where it now bounds only
  the limit parameter", which the probe does not decide. That account rests on
  ADR-0004 Section 2, and the statement now says so.
- **`timeline-retention-guarded-by-test`** — was "the append-only timeline is
  guarded by [the test], which asserts 205 distinct events are retained"; the
  probe decides only that the literal `toHaveLength(205)` occurs. Restated, and
  the executed guard identified as the test itself.

These five were restated rather than retired because each still fails closed
when its file goes missing, which is real signal. In particular
`timeline-retention-guarded-by-test` is currently the only thing in this
manifest that detects deletion of `lib/dev-hq/audit-timeline.test.ts`.

## 4a. Found by independent review, after the first draft

Three retained claims still asserted more than their probes decide after the
first pass. Each was demonstrated by execution, not argument, and each is now
restated:

- **`smoke-heading-match-is-exact`** — and this one was **not latent**. The
  pattern `exact:\s*true` matches first at the file's own explanatory COMMENT
  about `exact: true`, not at the executable assertion. Deleting the real
  assertion leaves the claim green. The statement now says so.
- **`vitest-projects-exclude-e2e`** — asserted the exclusion applies to "both
  projects"; the pattern matches the shared list once. Removing `exclude` from
  the `dom` project entirely left the claim green.
- **`playwright-spec-collection-widened`** — asserted `.test.*` files are not
  permitted; adding a second `testMatch` entry admitting them left the claim
  green.

Five further statements were restated in the same pass, after auditing all
fourteen rather than only the five the first draft addressed:
`pkg3-approval-tag-target` and `pkg3-candidate-freeze-unmoved` (a
`tag-at-commit` probe decides where a tag points *now*, not how it got there,
and not that it was never recreated), `pkg2-approval-tag-target` (neither the
Founder approval nor the checkpoint being "protected" is decided — no ruleset
covers these tags), `sec6-review-token-not-nextid` (a literal text match, evaded
by minting through a variable), and `next-config-not-standalone` (a computed
value assigned to `output` would not be seen).

### Detection lost by the retirement, named because Section 4 makes it the test

Section 4 retains five claims on the ground that "each still fails closed when
its file goes missing, which is real signal." That criterion applies to the
retired claim too, and the retirement gives it up:
`capability-token-uses-node-crypto` was the manifest's **only** reference to
`lib/dev-hq/id.ts`. Deleting that file was `exit 2` before this change and is
`exit 0` after it.

The retirement still stands, on the practical ground that `lib/dev-hq/id.ts` is
imported throughout and its deletion fails the build and every test long before
this control is consulted. But the loss is real, and Section 4's own reasoning
required it to be named here rather than left for a reader to find.

## 4b. Found by independent review, after the second draft

The second draft restated thirteen of fourteen and asserted completeness again.
One survivor remained, and it is the only statement the first two passes never
touched:

- **`icr-handbook-present`** — the `file-present` probe decides that
  `handbooks/INDEPENDENT_CODE_REVIEWER.md` is a regular file. The statement's
  clause "so the reference at `agents/independent-code-reviewer/AGENT.md:7` is no
  longer dangling" is an unchecked consequent about a **different file at a
  specific line**, which the probe never opens. Demonstrated twice: repointing
  that reference to a nonexistent handbook, and shifting it off line 7, each
  left the claim green while the statement became false.

  Consequence is near zero — `scripts/verify-agent-references.py` does check the
  reference and reddens on the first mutation — but the statement asserted what
  the probe does not decide, which is the standard this record applies to
  everything else. Now restated.

Also corrected in the same pass, all found by that review:

- `pkg3-candidate-freeze-unmoved` said the probe decides "the last of" four
  conditions; it decides the **first** — that the tag has not been moved.
  Re-creating it lightweight at the same commit passes.
- `event-buffer-size-is-a-page-limit` has an **unanchored** pattern, so
  `EVENT_BUFFER_SIZE = 2000` satisfies it as a prefix match. Its `red_means`
  claimed a changed value would be caught. Both now say otherwise.
- `sec6-review-token-not-nextid` called itself "the only remaining guard";
  `sec6-review-token-from-csprng` is a complementary co-guard against the same
  regression.

## 5. Deferred — the external-trust control

Not attempted here, and explicitly deferred to production remediation:

- **OBL-30 external trust anchor.** The control, its manifest and its harness
  remain candidate-editable. Nothing in this change alters that.
- **CTL-01 is not closed.** The retained probes still match text, not
  properties. This change stops the statements claiming otherwise.
- **CTL-02 is not closed.** Nothing protects the manifest. Deleting a claim
  still lowers the count and exits 0 — which is why this record exists.
- **CTL-03 is not closed.** `scripts/test-verify-record-claims.py` runs in no
  workflow at this commit.

**Standing constraint adopted with this record:** no package may introduce a
`required_claims_baseline` pin, or any check requiring the pinned commit to be
an ancestor of `HEAD`, until a chain mechanism and its genesis anchor both exist
and have passed independent review. A design that did so was frozen and failed
audit; the pin would otherwise turn the default-branch gate permanently red
after a squash merge.

## 6. Evidence

The rejected CTL-01..03 candidate line is preserved, unmerged, at:

- `origin/evidence/ctl-01-03-rejected` → `f304d326bb4ff448224365fbaed25a1154038da8`

It carries the reproductions, the expanded negative-control harness (91 cases /
242 assertions, against 33 cases / 109 assertions here — 112 at the parent
commit, the delta being exactly the retired claim's three live-discrimination
arms and no case), `docs/plans/CTL-01-03_DEFERRED.md`, and
the review verdicts. It is **evidence, not a candidate**, and must not be
merged. The expanded harness cannot be cherry-picked to this commit because its
cases exercise probes that do not exist here.

### Disposal of `claims-baseline-1`

A local annotated tag `claims-baseline-1` was created during the rejected line.
It was **never pushed to origin**, and must never be. Recorded here so the
record survives the disposal:

- tag object: `416a655b6d23433808ee046ae735f8b90f202e46`
- target commit: `bab6613b1c9d99494f2e159cd8ee076550ade19d` (reachable via the
  evidence branch above)
- its annotation instructed "MUST BE PUSHED to origin before this branch
  merges" — that instruction is **superseded and wrong**. The tag anchored a
  candidate that independent audit rejected; publishing it would have made the
  genesis of an intended-immutable chain a link minted against rejected content.

**Disposal history, recorded because the first attempt did not hold.** The tag
was deleted from the working repository on 2026-07-30 and the deletion was
verified at the time. An earlier draft of this record stated flatly that it had
been deleted. That statement was **false when written**: independent review
found the tag live again in the working repository.

The cause is structural and is the part worth recording. This machine holds a
number of local clones whose `origin` is the working repository itself, so a
`git push --tags` from any review sandbox restores the tag into it.

The deletion was repeated across every location found to hold a copy: the
working repository — which covers its 34 linked worktrees, since they share its
ref store — and the 9 independent clones under `C:/tmp`.

**Scope of the sweep, stated because an unqualified "none remains" is what went
wrong the first time.** The sweep covered the working repository and its
worktrees, every clone under `C:/tmp`, `C:/Users/evanj/Documents/Projects`, and
the agent scratchpad tree, searching both loose `refs/tags` entries and
`packed-refs`. Independent review found one survivor outside the first sweep's
scope — a ref in a reviewer's own sandbox, pointing at a different object than
the recorded tag — and left it in place so it could be confirmed. It was
confirmed and removed, and a re-sweep of the same scope found none. Anything
outside that scope, including clones on other machines, was not searched and is
not claimed.

**This is not durable, and must not be recorded as though it were.** Nothing
prevents the tag being recreated, or pushed back by a clone, at any time. The
one property that has held throughout is that it never reached `origin`. The
durable control — a tag ruleset restricting creation, update and deletion — is
deferred with the rest of the external-trust work (Section 5).

## 7. What this change does not claim

It does not close CTL-01, CTL-02 or CTL-03, and it must not be reported as
doing so.

What it does claim, precisely: **all fourteen retained statements were audited
against their own `args`, and all fourteen were restated.** One claim was
retired. The audit is reproducible — read each `statement` against its `args` in
`docs/claims.json`.

It took three passes and two independent reviews to get there, and the record of
that is deliberately left in place rather than tidied away:

- the first draft restated five and then asserted the manifest's statements were
  true of what its probes decide. Independent review refuted that by
  demonstrating three further survivors, one already active (Section 4a).
- the second draft restated eight more — thirteen of fourteen — and made the
  same universal assertion. Independent review refuted it again with a
  fourteenth, `icr-handbook-present`, whose `file-present` probe never opens the
  file the statement's "so ..." clause is about.

The claim above is therefore made only now, and only because the fourteenth was
restated too. A reviewer should still look for a fifteenth; the two preceding
versions of this sentence were both false when written.
