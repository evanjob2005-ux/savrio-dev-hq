# Batch 1 (CTL-01..03) — deferred package after three loops

**Document ID:** DEFER-001
**Version:** 1.0.0
**Status:** Open. Not a release approval, and NOT an approval of the candidate.
**Batch:** Batch 1 of `docs/plans/HANDOFF_2026-07-30.md` — CTL-01, CTL-02, CTL-03
**Branch:** `impl/ctl-01-03`
**Final candidate:** `31ca6abca2eb9abf73082a7101495c8c276c6ae0`
**Baseline tag:** `claims-baseline-1` → `bab6613b1c9d99494f2e159cd8ee076550ade19d` — **local only, NOT pushed**
**Prepared by:** the implementing agent, from two independent reviews per loop

---

## 1. Why this document exists

`docs/plans/HANDOFF_2026-07-30.md` §8 allows a batch at most three
implementation/review loops, and says that after three unsuccessful cycles the
work stops, the remaining defects and evidence are recorded, and the batch is
deferred as an isolated package. Three loops ran. Every loop received an
Independent Code Review and an Architecture Review from reviewers who were not
the implementation author, and every loop returned a non-approving verdict:

| Loop | Candidate | Independent Code Review | Architecture Review |
|---|---|---|---|
| 1 | `2afc475` | FAIL — 5 blockers | REJECT — 2 blockers |
| 2 | `9b1cf65` | FAIL — 3 blockers | REJECT — 2 blockers |
| 3 | `c4d5030` | FAIL — 2 blockers | REJECT — 2 blockers |

The loop count is spent. This document is the required record.

**Nothing here is approved.** The candidate is not proposed for merge.

---

## 2. What the batch actually achieved

Stated plainly, because the verdicts above are the headline and would otherwise
read as "nothing worked".

Every defect named in the handoff for CTL-01, CTL-02 and CTL-03 was reproduced
before any edit, and each is now closed with a negative control that fails
without its fix:

- **CTL-01.** A retention cap written without the searched-for identifier, a
  predictable token generator with `randomUUID()` surviving in a comment, an
  unrelated `toHaveLength(205)` satisfying the retention guard, and a
  lightweight tag satisfying a claim that names an annotation — all four passed
  the control at `5064526` and all four now fail it.
- **CTL-02.** Deleting a manifest entry took coverage from 15 claims to 14 and
  exited 0. Deletion, replacement-at-equal-count, and in-place redefinition of a
  claim's probe or args now each fail and name the id.
- **CTL-03.** The negative-control harness ran in no workflow. It now runs in
  `ci.yml`'s `structured-data` job.

Beyond the handoff's list, review found and this batch closed: comment-blind
matching in four distinct forms, unknown manifest arguments silently falling
back to permissive defaults, a proximity probe satisfiable by an unused decoy,
and an amendment record that exempted a claim permanently rather than
authorizing one specific change.

Measured at the final candidate:

| Validation | Result |
|---|---|
| `scripts/verify-record-claims.py` | 19/19 hold, exit 0; coverage 19 present / 19 required |
| `scripts/test-verify-record-claims.py` | **242 passed, 0 failed** (matrix 91, null audit 91, live discrimination) — was 112 at `5064526` |
| Every reviewer exploit from loops 1 and 2 | re-run at the final candidate; each exits non-zero naming its claim |
| `ruff check scripts/` | clean |
| Workflow-structure approval gate | exit 0 at both comparison bases |
| `docs/claims.json` document paths | all 19 resolve |

The harness is the durable asset. It grew from 112 cases to 242, no case was
ever removed, and every bypass any reviewer demonstrated across three loops is
in it as a regression.

---

## 3. Open blockers — the reason this is deferred, not proposed

Both loop-3 reviews confirmed these by construction. Each is a live false green
or a red gate; none is speculative.

### D-1 — Coverage exits 2 permanently after a squash merge — BLOCKER

The baseline pin is checked with `git merge-base --is-ancestor`. An annotated
tag survives a squash merge as a readable object but not as an ancestor, so
after this branch is squash-merged — the method `standards/GIT_STANDARD.md`
prefers — the pinned commit is not an ancestor of the merged commit, the guard
raises, and the `structured-data` job exits 2 on every default-branch run.

Architecture Review reproduced this by simulating the squash merge: the
resulting tree was byte-identical to the candidate and coverage still died.

Fail-closed, never a false green — but a red gate. The false comment that caused
it has been corrected and a re-anchor procedure is now recorded at
`docs/claims.json` `required_claims_baseline._why`. **The design question is
open:** the suggested fix is a monotonic `claims-baseline-N` tag series checked
for non-regression, which blocks a backward pin move without depending on the
commit graph. Until then, re-anchoring is a required merge step.

**Owner:** Engineering, with Founder sign-off on the pin-move policy.

### D-2 — `_strip_comments` misparses regex literals after keywords — BLOCKER

`_starts_regex` inspects the previous non-space character only, so a regex
literal following `return`, `typeof`, `case`, `new`, `void` and similar keywords
is not recognised. Independent Code Review reproduced three exit-0 false greens
from this: a hidden retention cap, a reinstated predictable capability token,
and a comment satisfying a claim about a live constant. There is also no
unterminated-*template* guard to match the unterminated-block guard.

**Fix direction, already scoped by the reviewer:** keyword-aware regex-start
detection, `\` escape handling in the main scan loop, and an unterminated
template literal at EOF raising `CannotEvaluate`. All three reproductions become
regression cases.

**Owner:** Engineering.

### D-3 — `no-truncation` still enumerates operations — BLOCKER

Four evasions reproduced at exit 0: `store.events.length--` (the forms list
covers `=` and `-=` but not `--`), bracket notation `store["events"]`, optional
chaining `store?.events`, and `Array.prototype.splice.call(...)`. The first is
the serious one — `while (…) arr.length--` is an ordinary way a maintainer
reintroduces a cap, no adversary required — and the probe's docstring claims it
searches for the operation rather than the name, which is not true of `--`.

**Fix direction:** add `--`/`++`, a bracket-notation subject alternative, and
`?.` tolerance in the joiner.

**Owner:** Engineering.

### D-4 — The CSPRNG claim is defeatable by a decoy return plus padding — MAJOR

`capability-token-uses-node-crypto` binds *a* line beginning with `return`, not
*the* returned expression. Architecture Review defeated it with an unreachable
decoy return inside an `if`, plus padding to push `return nextId(prefix)`
outside the paired absent-window. The exploit cost rose across three loops but
the property was never closed, and three texts still present this pair as the
strongest available binding.

**Fix direction:** a `function-body-absent` probe that brace-matches from the
anchor, rather than a fourth iteration of the same regex.

**Owner:** Engineering.

### D-5 — The executed arm for SEC-6 is pinned by nothing — MAJOR

`lib/dev-hq/capability-token.test.ts` exists and proves the CSPRNG property with
null arms — by inspection it kills D-4's exploit outright. No claim references
it. Deleting or narrowing it leaves all 19 claims green.

This is the batch's clearest structural lesson. The append-only property has a
four-link chain — workflow step, project include, and two claims pinning the
test's text. The higher-severity SEC-6 property has two static claims and no
executed arm at all. **Where an executed arm exists, the static probe's job is
to pin it, not to re-derive the property with regexes.** Three loops were spent
re-deriving.

**Owner:** Engineering. Smallest useful next step in this whole package.

---

## 4. Also deferred

| # | Item | Severity |
|---|---|---|
| D-6 | Nothing validates that a claim's `document` resolves. All 19 do today, but this class already recurred once inside this batch and was reported fixed when it was not. A two-line check in `load_manifest` closes it. | MAJOR |
| D-7 | Advancing the pin structurally forces deletion of the authorization records for anything it passes, because a record naming a no-longer-required id raises. The audit trail is discarded exactly when it becomes historically interesting. Suggested: an append-only `history` array that coverage ignores. | MAJOR |
| D-8 | `statement`, `document` and `red_means` are outside the coverage body, so a claim's prose can be broadened to assert what its probe does not decide. Both reviewers agreed folding them into `claim_body` would conflate "what it measures moved" with "what it says moved"; it needs its own design. | MAJOR |
| D-9 | `_strip_hash_comments` is wrong for three declared extensions: `.py` triple-quoted strings are untracked, `.ini`/`.cfg` also use `;`, and YAML treats `#` as a comment only after whitespace. No current claim is affected; the next hash-family claim inherits it. | MINOR |
| D-10 | `store.events.slice(0, limit)` — the natural paging read for `/api/dev-hq/events` — would be reported as a retention cap. Errs safe, but the control's own comment warns that crying wolf teaches readers to ignore it. | MINOR |
| D-11 | `required_count` subtracts retirement records without checking the id is genuinely absent from `claims`. Latent; both lists are empty. | MINOR |
| D-12 | The baseline tag's annotation can be discarded by replacing it with a lightweight ref at the same commit; only claim tags are checked for annotation. | MINOR |

---

## 5. Pre-existing, not introduced by this batch

- **`claims-baseline-1` is not pushed to origin.** Creating it was in scope;
  pushing a tag is an outward-facing change and is the Founder's or repository
  owner's call. Until it is pushed the check exits 2 wherever the tag is absent,
  **including CI** — there is no silent commit fallback, and the earlier claim
  that there was one was wrong. Interacts with D-1: pushing is necessary and not
  sufficient.
- **`scripts/test-verify-workflow-structure.py` cannot run end to end.** A
  fixture references a `ci.yml` step (`Pin npm to the version that produced the
  lockfile`) that an earlier commit on this branch renamed. Confirmed identical
  at `5064526` and `0dd1684`, so it predates this batch, and it was deliberately
  not repaired as out of scope. Consequence worth recording: `lint.yml`'s
  "Mutation-test the workflow structure verifier" step is therefore dead, so the
  two `fetch-*` cases this batch corrected are verified by nothing automated.
  Both were driven manually through the harness's real fixture path at both
  comparison bases (null arm 0, mutated 1, four combinations).
- **OBL-30 is open.** The control, its manifest, its harness and the approval
  record are all candidate-editable, and `authorized_by` on a retirement or
  amendment record is self-asserted. Closure needs a trust anchor outside these
  files. Disclosed on every green run.

---

## 6. Governance notes

- The two `scripts/workflow-structure-approval.json` records touched by this
  batch are **candidate-written and NOT Founder-authorized**, and say so. The
  aggregate record's rationale is a union: the `c98dcf1` and `5064526` texts are
  both reproduced in full with provenance stated, after an earlier pass in this
  batch replaced rather than appended and dropped the credential-scanner line
  numbers. That loss originated in the `5064526` re-record, not in this batch,
  and is attributed rather than quietly reconciled.
- Twelve amendment records declaring this batch's own claim rewiring existed at
  loop 2 and were removed when the pin advanced, because they became inert.
  Their content survives in `git show 9b1cf65:docs/claims.json` and in the
  approval rationale. A reader of `docs/claims.json` at the final candidate will
  **not** see that twelve of the nineteen claim bodies were rewritten under
  candidate authority; that is D-7's consequence and is recorded here instead.

---

## 7. Recommended next action

Do **not** merge this candidate as frozen. Two options, both the Founder's call:

1. **Continue the batch in a fresh package.** Take D-2, D-3 and D-5 first —
   together they are the difference between a control that reports the SEC-6 and
   append-only properties and one that decides them. D-5 is the cheapest and
   changes the shape of the rest.
2. **Escalate the design question before spending another loop.** Three loops
   have now each closed a scanner bypass and each surfaced another. The
   structural answer, which both reviewers converged on independently, is to
   stop re-deriving properties statically wherever an executed test can carry
   them, and reduce the static probes to pinning those tests. That is a change
   in approach, not another patch, and it deserves a decision rather than a
   fourth loop.

Either way, D-1 and the tag push must be settled before anything from this
branch reaches the default branch, because both determine whether CI is green
after the merge.

---

## Addendum A — corrections to this record

**Status:** Appended 2026-07-30, not applied retroactively. Everything above is
preserved as written on the date it was written, including its severity labels,
which remain valid as the chronology of what was known at each loop.

**A-1. Final severity of D-4 and D-5.** This record labels D-4 and D-5 MAJOR,
following the loop-3 Architecture Review's "MAJOR FU-2" and "MAJOR FU-3".
**Under the final independent audit both are BLOCKERS.** The blocking set is
**D-1, D-2, D-3, D-4 and D-5** — all five.

The earlier MAJOR classifications are retained above as **historical chronology
only**: they record what each loop concluded with the evidence it had, and they
are not the current severity. The reclassification follows from evidence that
arrived after loop 3, and was confirmed by execution: applying D-4.1 and D-5.1
together leaves every capability token as `rvt-<epoch-ms>-<counter>` — the form
brute-forced in roughly 250k guesses — while all claims hold, SEC-6 reads
Closed, and the full node suite passes green.

- **D-4** is not a hardening opportunity. With D-5 open there is no executed
  authority for the CSPRNG property, so the defeated static pair was the only
  thing standing behind it, and its defeat reinstates SEC-6 with the control
  green.
- **D-5** is not a gap in coverage. The test it names does not decide the
  property (A-2), so the property is unproven by any mechanism, not merely
  unpinned by a claim.

**A-2. The CSPRNG assessment was unsupported when written, and was subsequently
refuted.** Section 3, D-5 states:

> "`lib/dev-hq/capability-token.test.ts` exists and proves the CSPRNG property
> with null arms — by inspection it kills D-4's exploit outright."

That assertion was **unsupported at the time it was written**: it rested on
inspection, the loop-3 Architecture Review had explicitly labelled its own
version of it "a traced inference from the assertions, not an observed test
run", and the implementer adopted it without independent verification.

**Later independent execution refuted it.** The file's assertions are satisfied
by a deterministic 32-hex counter — the shape check `^[0-9a-f]{32}$`, the
10,000-mint uniqueness check, the clock-prefix check and the decimal-increment
check all pass against a generator with no entropy at all. The file therefore
establishes "not `nextId`" and **not** "drawn from a CSPRNG".

One part of the original assertion did survive execution: the file does fail
against D-4's specific exploit, because that exploit delegates to `nextId`. What
was wrong is the general claim that it "proves the CSPRNG property".

The corrected statement is: *`capability-token.test.ts` is a well-built
negative-control suite against `nextId` that does **not** prove CSPRNG
derivation. It would become authority for that property only after a derivation
test and mutation validation are added.*

**A-3. Scope of "each is now closed".** Section 2 states that every defect named
in the handoff for CTL-01/02/03 "was reproduced before any edit, and each is now
closed with a negative control that fails without its fix". That is accurate for
each **named instance**, and each negative control exists. It is not accurate
against CTL-01's stated **acceptance criterion** — "preserve matching text while
breaking the property; every mutation must fail and name its claim" — which D-2
and D-3 show is not met, since further mutations preserving matching text still
exit 0. Section 2 should be read as "every named instance is closed; the
acceptance criterion is not met".

**A-4. `claims-baseline-1` must never be published.** Section 5 records the tag
as created locally and unpushed, and treats pushing it as a pending Founder
action. That is superseded: the tag belongs to a candidate line that was
rejected by independent audit at every loop, and publishing it would make the
genesis of an intended-immutable chain a link minted against rejected content.
It has since been deleted locally, with its object sha and annotation recorded
in `docs/governance/CTL-CLAIM-DISPOSITION-001.md`.

**A-5. Disposition of this batch.** The candidate described above was not
merged. It is preserved unmerged at `origin/evidence/ctl-01-03-rejected`
(`f304d32`). A separate, smaller change — recorded in
`docs/governance/CTL-CLAIM-DISPOSITION-001.md` — retired one unsupported claim
and restated five others so that the manifest asserts only what its probes
decide. That change does **not** close CTL-01, CTL-02 or CTL-03.

**A-6. Section 2's CTL-03 sentence is false at the commit that lands this
record.** Section 2 states "It now runs in `ci.yml`'s `structured-data` job" of
the negative-control harness. That was true of the rejected candidate. At the
commit landing this document, `scripts/test-verify-record-claims.py` runs in no
workflow — only `scripts/verify-record-claims.py` is wired, at
`.github/workflows/ci.yml`. CTL-03 is open. Corrected here rather than in
Section 2, so the original record stands as written.

**A-7. Known, unfixed, and deliberately carried forward.** Independent review
raised these against the stabilization change; none is fixed and each is
recorded here so it has a home rather than living only in a review:

- **Claim ids still assert properties nothing decides.** A green run prints ids
  and verdicts, not statements, so a reader of CI output sees
  `event-store-has-no-retention-cap ... holds` and no word of the corrective
  text. The `LIMITATION` block partly offsets this by naming the gaps in the
  same transcript. Fixing it properly means printing statements on green, or
  renaming ids — the latter is not free, because
  `scripts/test-verify-record-claims.py` keys its violation fixtures on them.
- **The verifier's "confirmed false-green paths" list is incomplete.** Three
  paths demonstrated during this work — the `exact: true` comment satisfying the
  smoke claim, the shared-list match satisfying the vitest claim, and a second
  `testMatch` entry satisfying the playwright claim — are recorded in
  `docs/governance/CTL-CLAIM-DISPOSITION-001.md` but were only partly reflected
  in the executable output.
- **`event-buffer-size-is-a-page-limit` cannot detect a value change**, because
  its pattern is unanchored. Tightening it to `` would be a probe change and
  was held out of a text-only stabilization.

**What is not corrected.** The validation table in Section 2, the loop/verdict
table in Section 1, and Sections 4 through 6 were re-checked against the reviews
and stand as written, with the single exception noted in A-6.
