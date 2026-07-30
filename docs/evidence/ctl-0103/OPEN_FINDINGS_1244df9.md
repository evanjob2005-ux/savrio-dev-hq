# Open review findings against PR #11 @ `1244df9` — UNFIXED

**Document ID:** FIND-001
**Status:** OPEN. These findings are **not fixed**. The commit they are against is
pushed and is the live head of PR #11.
**Date:** 2026-07-30
**Subject commit:** `1244df9bd91ff0d20de1384dd4db945f677ed74d`
(tree `ce5a177e33d1c36997cda77c0f7bfee66dd20e96`), head of open PR #11,
base `feature/dev-hq-operating-system`, 19/19 checks green, MERGEABLE.
**Base for the diff:** `5064526bd32007575303e94c7bfab522b3308734`
**Verdict:** **FAIL** — three blocking findings, none corrected.

---

## Why this document exists

The change at `1244df9` is a governance record whose entire legitimacy rests on
being accurate: it deletes a claim from a control that says deleting a claim is
never correct, and substitutes a written record for a machine check it does not
have. Two independent reviews and one direct re-execution found that the record
misstates the reason for the deletion and under-reports what the deletion cost.

That finding exists nowhere else. The commit is pushed and green; CI cannot see
any of this. Without this file the next reader has a green PR, a confident
record, and no way to know either is wrong.

**Nothing here was fixed.** The corrections are text-only and are listed with
each finding, but they were not applied, on instruction.

---

## BLOCKING

### B-1a — the verifier prints a false fact on every green run

`scripts/verify-record-claims.py:444-446` states that the retired claim
`capability-token-uses-node-crypto` was retired because

> "its whole-file grep was satisfied by a comment and decided nothing about the
> generator."

**Refuted.** `randomUUID()` occurs **exactly once** in `lib/dev-hq/id.ts`, at
line 24 — the executable call in `nextCapabilityToken`:

```
$ grep -n randomUUID lib/dev-hq/id.ts
1:import { randomUUID } from "node:crypto";
24:  return `${prefix}-${randomUUID().replace(/-/g, "")}`;
$ grep -c 'randomUUID()' lib/dev-hq/id.ts
1
```

The grep matched the **real call site**. A comment *could* have satisfied it —
that is a latent evasion — but none did.

The distinction is load-bearing in this very record, which flags
`smoke-heading-match-is-exact` as "**not latent**" precisely because a comment
genuinely does win there (`e2e/smoke.spec.ts:11` comment vs `:19` assertion).
The verifier text collapses the one distinction the document is careful about
everywhere else, and it converts a conditional in
`CTL-CLAIM-DISPOSITION-001.md:46-48` ("A comment satisfies it") into a
historical assertion.

**Correction:** "…matched the real call site but could equally be satisfied by a
comment, so it decided nothing about the generator."

### B-1b — the record under-reports the detection the retirement gave up

`docs/governance/CTL-CLAIM-DISPOSITION-001.md` §4a, "Detection lost by the
retirement", names exactly one transition — deleting `lib/dev-hq/id.ts` was
`exit 2`, now `exit 0` — and rests the retirement on:

> "lib/dev-hq/id.ts is imported throughout and its deletion fails the build and
> every test long before this control is consulted."

That reasoning is sound for **deletion**. It does not hold for **in-place
replacement**, which §4a never names.

**Executed, both commits, identical mutation** — exports, API and return shape
unchanged, so it compiles and the suite still runs:

```ts
let tokenCounter = 0;                    // was: import { randomUUID } from "node:crypto";
return `${prefix}-${(tokenCounter += 1).toString(16).padStart(32, "0")}`;
```

| commit | exit | result |
|---|---|---|
| base `5064526` (15 claims) | **1** | `capability-token-uses-node-crypto *** NO LONGER TRUE ***` |
| head `1244df9` (14 claims) | **0** | `14 documented claim(s) reported CONSISTENT` |

Reproduce:

```bash
git clone --local <repo> /tmp/verify-b1 && cd /tmp/verify-b1
# apply the two-line mutation above to lib/dev-hq/id.ts
git checkout 5064526 && python scripts/verify-record-claims.py; echo $?   # -> 1
git checkout 1244df9 && python scripts/verify-record-claims.py; echo $?   # -> 0
```

**Consequence.** A maintainer replacing `randomUUID()` with a counter inside
`id.ts` reinstates predictable `rvt-<epoch>-<counter>` capability tokens — the
class an independent reviewer brute-forced in roughly 250k guesses. At the base
the gate went red and named the claim. At the head it exits 0 and prints
"CONSISTENT". The retired claim's own `red_means` described this exact coverage:
*"The CSPRNG behind every capability token was replaced… only its implementation
was hollowed — which is why this is a separate claim."*

The real loss is **exit 1 → exit 0 on the SEC-6 regression class**, not merely
exit 2 → exit 0 on file deletion.

`CTL-CLAIM-DISPOSITION-001.md:21-23` makes naming "what is now unguarded as a
result" the record's whole licence to exist. On its own stated test, it falls
short.

**Correction:** add the second transition to §4a and narrow the justification's
reach to the deletion case only.

### B-1c — a control byte is committed into a governance record

`docs/plans/CTL-01-03_DEFERRED.md` contains a raw `0x08` (backspace) at byte
offset **19749**, inside Addendum A-7:

> "Tightening it to `‹0x08›` would be a probe change and was held out of a
> text-only stabilization."

The one actionable detail — the anchored pattern `EVENT_BUFFER_SIZE\s*=\s*200\b`
— is destroyed. Introduced by this commit. No CI check catches it, which is why
19/19 are green; green is not evidence against this finding.

```bash
python -c "import pathlib;b=pathlib.Path('docs/plans/CTL-01-03_DEFERRED.md').read_bytes();print([(i,hex(c)) for i,c in enumerate(b) if c<9 or 13<c<32])"
```

---

## NON-BLOCKING, recorded so they are not lost

- **Stale historical sentences.** `CTL-01-03_DEFERRED.md:44-48` and `:49-51`
  assert CTL-01 and CTL-02 detections "now fail" that still pass at this commit.
  Addendum A-6 corrects only the third parallel sentence (`:52-53`). The section
  is scoped as preserved-as-written and six explicit denials of closure sit
  elsewhere, so both reviewers judged it non-blocking. Fix: extend A-6.
- **Five surviving `claims-baseline-1` refs**, left in place deliberately by a
  reviewer so they could be confirmed, and confirmed:
  `…/scratchpad/candclone`, `…/scratchpad/mainclone`, `…/scratchpad/rev008/base`,
  `…/scratchpad/squashsim`, `…/scratchpad/x1`. Four peel to the recorded object
  `416a655b…` → `bab6613b…`. **`mainclone`'s `origin` is the working
  repository**, so a stray `git push --tags` from it restores a rejected
  chain-genesis tag there. Absent from origin, the working repo, and all clones
  under `C:/tmp`. Should be removed.
- **The standing constraint is invisible where it applies.** §5's rule — no
  `required_claims_baseline` pin until a chain mechanism and genesis anchor pass
  review — lives only in the governance record. `docs/claims.json` `_readme` and
  the verifier docstring, the two files an implementer would actually open, say
  nothing about it.
- **The retirement precedent is left open, and the change omits its own best
  defence:** base was already green (15/15, exit 0), so this deletion was
  green → green and demonstrably **not** a deletion to restore green. That is
  the structural distinction from the forbidden move and it is unstated.
- **`CTL-CLAIM-DISPOSITION-001.md:46`** says "the eleven characters
  `randomUUID()`". It is twelve.
- **A-7 item (b) is stale on arrival** — it says the three demonstrated
  false-green paths "were only partly reflected in the executable output"; this
  same commit adds all three to the limitation block. The paths genuinely still
  missing are the unanchored `EVENT_BUFFER_SIZE` prefix match, `tag-at-commit`
  force-move, computed `output`, `nextId` via a variable, and the
  `icr-handbook-present` consequent.

---

## What passed, so the failure is not read as wholesale

- **All fourteen restated claims are factually accurate.** An independent
  reviewer constructed and executed thirteen mutations; every disclaimer held,
  and no fifteenth overclaim was found.
- **The retirement is authorized and recoverable** — recorded with what, why and
  authority; the full prior definition is at `5064526:docs/claims.json` and on
  `evidence/ctl-01-03-rejected`. It is the record's *accuracy* that fails, not
  its authorization.
- **The rejected evidence is clearly labelled** across five in-repo references
  as rejected, unmerged, and must-not-be-merged.
- **Nothing asserts CTL-01, CTL-02 or CTL-03 are closed** — five explicit
  denials plus the runtime limitation block.
- **Nothing is silently treated as protected.** The candidate volunteers the
  disclaimers: "no ruleset covers these tags", "the manifest is not itself
  protected", "this is not durable". Verified against live state: 1 ruleset,
  `target=branch`, **zero tag rulesets**, base branch requiring zero approving
  reviews.
- **No regression.** Verifier 14/14 exit 0; harness 109/109 with `@case`
  unchanged at 33; ruff clean; all document paths resolve; no workflow touched,
  so no approval record needs regenerating.

---

## State at the time of writing

- PR #11 open, MERGEABLE, 19/19 green, head `1244df9`. **Not merged.**
- `origin/evidence/ctl-01-03-rejected` → `f304d32`, the rejected three-loop CTL
  candidate. Evidence only; must not be merged.
- `claims-baseline-1`: absent from origin, from the working repository and from
  every clone under `C:/tmp`; five copies survive in agent scratchpads above.
- CTL-01, CTL-02, CTL-03: **open**. OBL-30: **open**. No claim decides the
  CSPRNG property.
