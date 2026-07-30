# CTL-01..03 — replacement design (design only, nothing implemented)

**Document ID:** DESIGN-002
**Status:** Proposal. Not implemented, not approved, no repository change made.
**Evidence base:** frozen candidate `f304d326bb4ff448224365fbaed25a1154038da8`
(tree `880f1f3e...`), and the loop-3 Independent Code Review (FAIL, 2 blockers)
and Architecture Review (REJECT, 2 blockers) taken against `c4d5030`, whose
findings survive unchanged at `f304d32` except the two documentation defects
corrected in `31ca6ab`.
**Supersedes as a plan:** the remediation approach in
`docs/plans/CTL-01-03_DEFERRED.md` §7 option 1. It does **not** supersede that
document's record; see §11.

**Nothing in this document was applied.** No file was edited, no tag created, no
GitHub setting changed. Every path below is a proposal for a future reviewed
package.

---

## 0. The finding this design is built on

Three loops each closed a specific static bypass and each surfaced another. The
loop-3 reviews converged, independently, on the same structural cause:

> Where an executed test can decide a property, a static probe that re-derives
> the property with regexes will keep losing, and its failures are silent.

The evidence for that is concrete at `f304d32`:

- `capability-token-uses-node-crypto` was rewritten three times — whole-file
  grep, then scoped-to-generator, then bound to the return line — and
  Architecture Review defeated the third form with a conditional decoy return
  plus padding, at exit 0, with every capability token predictable.
- `lib/dev-hq/capability-token.test.ts` is the natural home for that property
  and **no claim references it** — deleting it leaves all 19 claims green. But it
  does not decide the property either: a deterministic 32-hex counter satisfies
  every assertion in it (§5.1). So at `f304d32` the CSPRNG property has no
  authority at all, static or executed, which is why D-4 and D-5 are blockers
  under the final audit rather than the MAJORs each loop took them for.

So the replacement is not a fourth regex. It inverts the relationship: the
executed test decides the property, and the static claims exist only to prove
that the test is present, collected, executed, and not weakened.

**Read §5.0 before citing that test as evidence.** It does not yet prove
CSPRNG derivation — a deterministic 32-hex counter satisfies every assertion in
it — and it becomes the appropriate authority only after the strengthening in
§5 and the mutation validation in §6.2 have both landed.

The four probes stay in the verifier because the harness that guards them is the
batch's most valuable output; what changes is which claims are allowed to carry
a runtime property.

---

## 1. Immutable annotated-tag baseline chain, squash-merge compatible

### The defect being replaced

`missing_required_claims` guards a backward pin move with
`git merge-base --is-ancestor`. A squash merge produces a commit carrying the
branch's tree and none of its history, so after merge the pinned commit is not
an ancestor of the merged commit, the guard raises, and the job exits 2 on every
default-branch run. Architecture Review reproduced this by simulating the squash
(resulting tree byte-identical to the candidate; coverage still died).

Ancestry was only ever a proxy for one property: *the pin must not move
backward past a claim's introduction.* That property is enforced below without
the commit graph.

### Design: a monotonic, self-chaining, append-only tag series

Baseline tags are `claims-baseline-N`, N a positive integer, strictly
increasing, **created only at merge (§2), never moved, never deleted**. Each is
annotated with a machine-readable header:

```
chain: claims-baseline
seq: 7
parent-tag: claims-baseline-6
parent-tag-object: 9f2c1ab4e5...     # sha of the TAG OBJECT, not the commit
manifest-digest: sha256:...          # digest over the sorted claim bodies
claim-count: 21
merge-commit: <sha>                  # the default-branch commit this anchors
approved-by: ICR <ref> / AR <ref>    # the review that approved this claim set
withdraws: <tag or none>             # append-only withdrawal, see §2.5
withdraws-reason: <text or none>
```

`parent-tag-object` names the previous **tag object's** sha, not its commit. A
tag object's sha covers its target, name, tagger and message, so a chain of
tag-object shas is append-only in the same way a commit chain is: link N-1
cannot be altered without invalidating every link above it.

### What the verifier checks, replacing `_is_ancestor`

Let `H` be the highest-seq link in `refs/tags` that is not withdrawn by any
higher link (§2.5), and `M` the seq the manifest names.

1. The manifest declares `chain`, `seq: M`, `commit: <sha>`, `path`.
2. `claims-baseline-M` exists, is an annotated tag object, and peels to the
   declared commit. *(Already implemented at `f304d32`; keep unchanged — it is
   what keeps a force-move visible in a diff.)*
3. **`M` is `H` or `H - 1`.** Leading the chain is impossible; lagging by more
   than one link is exit 2. The one-link tolerance is what removes the red
   interval between a merge creating link `H` and the advance PR bumping the
   manifest to it (§2.4). It is a bounded, disclosed weakening, not an
   accident: within that single window a claim introduced at `H` is not yet
   required.
4. If `M > genesis`, the annotation's `parent-tag-object` equals the actual
   object sha of `claims-baseline-(M-1)`. A broken link is `CannotEvaluate`.
5. **The claim-id set at `M` is a superset of the set at `M-1`**, except for ids
   covered by a `retired_claims` record. This is the real anti-tamper property
   and it never touches the commit graph. It is also what bounds rule 3: even
   inside the one-link lag, no claim can be *dropped*, only not-yet-required.
6. No gap in the series below `H` (`claims-baseline-K` must exist for every
   `genesis <= K <= H`). A gap means a link was deleted; that is
   `CannotEvaluate`, never green.

### Why this survives a squash merge

Nothing in 1-6 requires the pinned commit to be reachable from `HEAD`. It
requires the tag objects to exist and to chain. A squash merge does not delete
tags, and a tag keeps its target commit alive, so `git show <tag>:docs/claims.json`
continues to resolve indefinitely.

### Genesis of the chain

`claims-baseline-1` exists **locally only**, at `bab6613`, on the rejected
candidate. It is not the genesis of this chain and must never become it — see
§2.6. The chain begins at `claims-baseline-2`, created at the first *approved*
merge, carrying:

```
parent-tag: none
genesis: true
genesis-reason: claims-baseline-1 was created locally on candidate f304d32,
  which was rejected by independent audit, and was never published. It is not
  part of this chain and is not chained to.
```

Rule 4 is therefore evaluated only for `M > 2`.

### Residual weaknesses, stated rather than papered over

- Tag immutability is enforced by §3, not by this design. Without §3 the chain
  is tamper-**evident**, not tamper-**proof**.
- The one-link lag in rule 3 is a real, if narrow, window.
- The chain proves continuity, not correctness: `approved-by` is prose and
  cannot be machine-checked. That is OBL-30 residue and is unchanged.

---

## 2. Tag lifecycle, with no red-CI interval at any point

The red interval at `f304d32` has two causes: the tag is unpushed, and a
declared-but-unresolvable tag raises before the commit is tried. The lifecycle
below removes both by **never letting a candidate create a baseline at all**.

### 2.1 The governing rule

> A `claims-baseline-*` tag is created **only at merge to the default branch,
> only by the authorized principal (§3), and only against an approved
> candidate.** No feature branch, no PR, and no rejected candidate ever
> produces one.

This single rule is what makes rejected candidates cost nothing (§2.5) and what
makes immutability affordable: a tag that is only ever minted against approved,
merged content never needs to be withdrawn for being unreviewed.

### 2.2 Before PR validation — no tag action, and no red interval

A feature PR **does not touch** `required_claims_baseline`. Coverage during PR
validation resolves the last merged baseline `claims-baseline-N`, which is
already on origin and already protected. Nothing is created, pushed, or
predicted.

Consequence, stated because it is a real limitation rather than a free lunch:
**claims a PR adds are not required during that PR.** They become required when
the next baseline is minted, and from that moment the superset rule (§1 rule 5)
locks them. A claim added and then deleted inside a single unmerged PR is not
caught by coverage — it is caught by review, which is the appropriate authority
for content that has never been approved.

### 2.3 At merge — the only moment a link is minted

After the merge commit lands on the default branch:

```
git tag -a claims-baseline-<N+1> <merge-commit> -F <annotation-file>
git push origin refs/tags/claims-baseline-<N+1>
```

Performed by the authorized principal (§3). The annotation records
`merge-commit`, `parent-tag-object` of link `N`, `manifest-digest`, and the
`approved-by` review reference for the claim set being anchored.

At this instant the manifest still names `N` while the chain's head is `N+1`.
That is exactly the `H - 1` case permitted by §1 rule 3, so **CI is green
throughout**. No re-anchor is urgent and none is required for correctness.

### 2.4 Advancing the manifest — a small, ordinary PR

A follow-up PR bumps `required_claims_baseline` to `seq: N+1` and the matching
`commit`. It carries no other change, so it is trivially reviewable, and it
closes the one-link lag. If it is never merged, CI stays green at the lag
boundary; if a *second* merge mints `N+2` while the manifest still names `N`,
rule 3 fails and the gate reds — which is the correct pressure: the lag is
tolerated once, not indefinitely.

### 2.5 Rejected candidates and failed live CI

**Rejected candidate.** No baseline tag was ever created for it (§2.1), so:

- nothing is orphaned, nothing must be deleted, and no `seq` is burned;
- the chain is unchanged and the manifest still names the last merged link;
- the rejected work is recorded by review verdicts and by the deferred package,
  not by a ref.

This is the direct answer to the failure mode `claims-baseline-1` represents: a
tag minted for a candidate that was subsequently rejected. Under this design
that state is unreachable.

**Failed live CI after a merge, or a merge later found bad.** The link is
already minted and is immutable, so it cannot be deleted or re-pointed. The
recovery is append-only:

1. Land the revert or fix on the default branch as normal.
2. Mint `claims-baseline-(N+2)` at that commit, with:
   ```
   withdraws: claims-baseline-<N+1>
   withdraws-reason: <what failed, and the reference to the failure record>
   ```
3. The verifier computes `H` (§1) **skipping any link withdrawn by a higher
   link**, so `N+1` stops being the head the moment `N+2` exists. `N+1` remains
   in the chain permanently as the record that it happened.

Withdrawal is therefore expressed only by a *later* link, never by mutating or
deleting an earlier one. A withdrawn link's claim set is still used for the
superset check at its own position, so withdrawal cannot be used to drop a
claim.

**Bounded interval.** Between the bad merge and `N+2`, the head is a withdrawn-
to-be link and CI is green against it. That window is the same one any bad merge
opens on any gate, and it is closed by the fix, not by tag surgery.

### 2.6 `claims-baseline-1` — never push it

The tag `claims-baseline-1` exists in the local worktree at `bab6613`. It was
created during the rejected candidate line that ends at `f304d32`, which
received a non-approving verdict from both independent reviewers at every loop.

> **It must never be pushed to origin.** Publishing it would make the genesis of
> an immutable, protection-backed chain a link minted against content that was
> independently rejected, and immutability would then preserve that error
> permanently rather than the approval it is supposed to attest.

Required disposition: delete it locally, or leave it local and never publish it.
Either way it is **not** chained to; `claims-baseline-2` is the genesis link and
records why (§1). If it has already been pushed by the time this design is
executed, it must be treated as a withdrawn link under §2.5 — withdrawn by the
genesis link — rather than deleted, because §3 will refuse the deletion.

---

## 3. Required GitHub protection for `claims-baseline-*`

**Founder/owner action. Escalated, not assumed.** This is a repository settings
change and is outside implementation authority.

### 3.1 The authorized tag-creation principal

"Creations allowed" for every writer is insufficient: a chain anyone with push
access can extend is not an anchor, because an attacker or a careless script can
mint a link at content of their choosing and become the head. Creation must be
delegated to exactly one identity.

**Required principal.** A single, named, non-interactive identity that is not a
normal contributor account:

- **Preferred:** a dedicated GitHub App (for example `savrio-governance`) with
  no interactive login, installed with `contents: write` scoped to this
  repository only, whose private key is held by the Founder. App tokens are
  short-lived and per-installation, which limits the blast radius of a leak far
  more than a PAT does.
- **Acceptable interim:** the Founder's own account, with the explicit
  understanding that this couples the anchor to a human credential and to
  whatever else that credential can do.
- **Not acceptable:** the default `GITHUB_TOKEN`, any shared bot, or "all users
  with write access". `GITHUB_TOKEN` in particular is available to every
  workflow run, including on branches a contributor controls, which would make
  the principal effectively "anyone who can open a PR".

The principal must be recorded by name in the obligation register, not only in
the ruleset UI, so that a later reader can tell whether the anchor is still held
where it was approved.

### 3.2 Required ruleset

A **tag ruleset** targeting the fnmatch pattern `claims-baseline-*`:

- **Restrict creations — on**, bypass list: **exactly the §3.1 principal**.
  The chain must grow, but only from the one identity authorized to attest an
  approved merge.
- **Restrict updates — on**, bypass list: **empty**. A baseline tag must never
  move. This is the control.
- **Restrict deletions — on**, bypass list: **empty**. A deleted link breaks the
  chain and erases the evidence it carries. §2.5's append-only withdrawal exists
  so that deletion is never needed.

Enforcement status **Active**, not Evaluate. The update and deletion bypass
lists must be empty *including* organization and repository admins; an
admin-shaped bypass makes the tag exactly as trustworthy as the account that can
bypass it.

Note the deliberate asymmetry: **creation is delegated to one principal;
mutation is delegated to nobody, including that principal.**

### 3.3 Verification that the protection is real

A settings screenshot is not evidence. The protection is proved by executed
negative controls, run once by the owner and recorded with their remote output:

```
# as the authorized principal
git push origin refs/tags/claims-baseline-<N>          # MUST succeed (creation)
git push --force origin refs/tags/claims-baseline-<N>  # MUST be rejected
git push --delete origin refs/tags/claims-baseline-<N> # MUST be rejected

# as an ordinary write-access contributor
git push origin refs/tags/claims-baseline-<N+1>        # MUST be rejected
```

The fourth is the one that proves §3.1 rather than §3.2, and it is the one most
likely to be skipped.

### 3.4 What this does and does not close

It closes tag creation, mutation and deletion — the one part of this control's
trust surface that can be moved outside candidate reach. It does **not** close
OBL-30: the verifier, the manifest, the harness and the approval record all
remain candidate-editable, so a candidate can still change what the control
checks. §3 makes the *baseline chain* externally anchored; it does not make the
*control* externally anchored.

---

## 4. Replacing regex-derived runtime assertions with executed tests

### The rule

A claim may assert a **runtime property** only if an executed test decides it.
Static probes may then assert only these four structural facts, none of which is
the property itself:

1. the test file exists (`file-present`);
2. the test is collected by a named Vitest project (`grep-scoped` on
   `vitest.config.ts`);
3. the test is executed in CI **by explicit path** (`grep-scoped` on the
   workflow — see §6);
4. optionally, that a specific adversarial arm is present.

Fact 4 is the one that must be used sparingly: pinning a test's *text* is what
`timeline-retention-guarded-by-test` and `timeline-retention-test-appends-205`
do today, and it is brittle in exactly the way that produced three loops of
churn. §6 replaces it with mutation-testing, which measures the same thing by
executing it.

### The chain, stated once

```
executed test  ->  collected by project  ->  executed by explicit path in CI
      |                    |                              |
 decides the         grep-scoped on              grep-scoped on the
   property         vitest.config.ts            workflow step, by path
      |
 mutation-tested in CI: delete it, weaken it, or unwire it -> CI red
```

Every link is required. Two links were present for the append-only property at
`f304d32` and zero for SEC-6.

---

## 5. Strengthening `lib/dev-hq/capability-token.test.ts`

### 5.0 Status of the current file — it is not yet the authority

> **`lib/dev-hq/capability-token.test.ts` as it stands does not prove CSPRNG
> derivation.** Every assertion in it is satisfied by a deterministic 32-hex
> counter, so it establishes "not `nextId`" and nothing stronger. It must not be
> cited as evidence for the CSPRNG property, and no claim, record or review may
> rest on it in its current form.
>
> It becomes the appropriate authority for that property **only after** both of
> the following land together: the strengthening in §5.1-5.2, and the mutation
> validation in §6.2 demonstrating that deleting the file, weakening its
> assertions, or unwiring it from CI each turn CI red. Until both are done, the
> CSPRNG property has no executed authority in this repository.

This supersedes the assessment recorded in `CTL-01-03_DEFERRED.md` §3 D-5; see
§11 Addendum A-2.

### 5.1 Why the current assertions are insufficient

The file is well built — frozen clock with a recorded rationale, null arms
against `nextId`, the reviewer's increment attack reproduced. Its gap is that
every assertion is about the *shape and distribution* of the output:

- `^[0-9a-f]{32}$` — **passed** by a counter: `"0".repeat(31) + "1"`.
- unique across 10,000 mints — **passed**: a counter never repeats.
- does not contain the clock prefix — **passed**: a counter has no clock in it.
- not sequential under the `-(\d+)$` increment — **passed**: that transform is
  decimal, and the counter is hex.

So a generator with no entropy at all passes the whole file.

### 5.2 Derivation: prove the token is built from *controlled* `randomUUID()` output

Mock `node:crypto` so `randomUUID` returns a known sequence, then assert the
token equals the transformation of the injected value. This is a data-flow
assertion, which is what no regex could make.

```ts
// Sketch, not final code.
vi.mock("node:crypto", async (importOriginal) => ({
  ...(await importOriginal<typeof import("node:crypto")>()),
  randomUUID: vi.fn(),
}));

const INJECTED = [
  "00000000-0000-4000-8000-000000000001",
  "ffffffff-ffff-4fff-bfff-ffffffffffff",
  "3f2a1b0c-9d8e-4f7a-b6c5-d4e3f2a1b0c9",
] as const;

it("returns exactly the injected CSPRNG draw, transformed", () => {
  const mocked = vi.mocked(randomUUID);
  for (const uuid of INJECTED) {
    mocked.mockReturnValueOnce(uuid);
    expect(nextCapabilityToken("rvt")).toBe(`rvt-${uuid.replace(/-/g, "")}`);
  }
  expect(mocked).toHaveBeenCalledTimes(INJECTED.length);  // one draw per mint
});
```

An implementation that ignores `randomUUID` — including the decoy-return-plus-
padding exploit and including any counter — returns a value unequal to the
injected transform and fails on the first iteration. The call-count assertion
additionally rejects an implementation that draws entropy and discards it, which
was the exact shape of the decoy.

### 5.3 Rejection: an explicit deterministic 32-hex counter adversary

The entropy bar must be one reusable predicate applied to two mints — the real
one, which must pass, and a counter, which must fail. Without the second arm the
predicate is unfalsified.

```ts
// Sketch, not final code.
function assertDrawnFromCsprng(mint: (prefix: string) => string): void {
  const mocked = vi.mocked(randomUUID);
  const uuid = "3f2a1b0c-9d8e-4f7a-b6c5-d4e3f2a1b0c9";
  mocked.mockReturnValueOnce(uuid);
  expect(mint("rvt")).toBe(`rvt-${uuid.replace(/-/g, "")}`);
}

let counter = 0n;
const deterministic32Hex = (prefix: string) =>
  `${prefix}-${(counter += 1n).toString(16).padStart(32, "0")}`;

it("the entropy bar rejects a deterministic 32-hex counter", () => {
  // Shape-only assertions do NOT distinguish these — which is the point.
  expect(deterministic32Hex("rvt").slice(4)).toMatch(/^[0-9a-f]{32}$/);
  expect(new Set(Array.from({ length: 1000 }, () => deterministic32Hex("rvt"))).size)
    .toBe(1000);

  expect(() => assertDrawnFromCsprng(deterministic32Hex)).toThrow();
  expect(() => assertDrawnFromCsprng(nextCapabilityToken)).not.toThrow();
});
```

`assertDrawnFromCsprng` is exported to the §6.2 mutation harness, which
substitutes the counter into the real generator and requires CI to fail.

### 5.4 Retained unchanged

The frozen clock and its recorded rationale, the `nextId` clock-leak null arm,
the increment-attack reproduction, the 10,000-mint uniqueness case, and the
prefix case. None is redundant; §5.2-5.3 add a dimension the file does not
currently measure.

### 5.5 The same treatment for the review-callback mint

A new `lib/dev-hq/review-callback-token.test.ts` asserts, with `randomUUID`
mocked as above, that the token reserved by `reserveCallbackToken` equals the
injected transform — proving the mint site draws from the CSPRNG, rather than
that the call text appears near a line. It carries the same §5.0 status: it is
not authority until it exists and is mutation-validated.

---

## 6. Pinning critical test paths in CI, and mutation-testing the wiring

### 6.1 Explicit-path execution

`npx vitest run --project node` passes if a test file is deleted — there is
simply one less test. A dedicated step naming the critical paths does not:

```yaml
      - name: Critical security and audit tests
        # Named by PATH so deleting one of these files fails the step rather
        # than silently shrinking the suite. --passWithNoTests=false is the
        # default and is stated explicitly because this step depends on it.
        run: |
          npx vitest run --project node --passWithNoTests=false \
            lib/dev-hq/capability-token.test.ts \
            lib/dev-hq/review-callback-token.test.ts \
            lib/dev-hq/audit-timeline.test.ts
```

Critical set = the tests that decide a property some governance record asserts.
It is deliberately short; every addition is a reviewed decision.

### 6.2 Mutation-testing the wiring

A new `scripts/test-critical-tests-wired.py`, following the existing harness
conventions (hermetic fixture, null arm per case, exit 2 for cannot-evaluate).
It runs in CI and proves three mutations turn CI red:

- **Delete a critical test file** — the critical-tests step fails on the missing
  path, **and** its `file-present` claim goes red.
- **Weaken a critical test** (remove the derivation assertion; substitute the
  32-hex counter for the generator) — the test fails.
- **Remove the critical-tests step from the workflow** — the workflow-structure
  approval gate fails, **and** the step-binding claim goes red.
- **Narrow the Vitest project include** so a critical test is not collected —
  the collection claim goes red.

The weakening arm is the one that cannot be faked structurally, and it is the
reason §5.2's counter adversary is written as a reusable predicate: the mutation
harness substitutes the counter and requires the suite to fail.

**Cost note.** This harness executes Vitest, so it cannot live in the Python-only
`structured-data` job. It belongs in `frontend-tests.yml`, which already has the
Node toolchain. That is a workflow change and therefore an §9 integration item.

---

## 7. Disposition of the 19 existing claims

### Retire — the property moves to an executed test

- **`capability-token-uses-node-crypto`** (grep-scoped) — replaced by the §5.2
  derivation test plus the §4 chain. Defeated at `f304d32` by a decoy return
  with padding.
- **`capability-token-not-from-nextid`** (grep-scoped-absent) — same
  replacement; the pair was the thing defeated.
- **`timeline-retention-guarded-by-test`** (grep-scoped) — pins a test's
  assertion text; replaced by §6 mutation-testing.
- **`timeline-retention-test-appends-205`** (grep-scoped) — pins a test's loop
  bound; same replacement.

### Demote — keep the probe, restate the claim to what it actually decides

- **`event-store-has-no-retention-cap`** (no-truncation) — keep as cheap early
  warning, restated to *no syntactically apparent truncation of `store.events`
  appears in `store.ts`*, with the property moved to the executed retention
  test. `red_means` must list the known evasions: `--`, bracket notation, `?.`,
  aliasing, cross-file.
- **`sec6-review-token-from-csprng`** (grep-scoped) — retained as call-site
  documentation; the property moves to §5.5's executed test.

### Retain as structural

- **`sec6-review-token-not-nextid`** (grep-absent) — absent claim over raw text,
  no `code_only`, low false-green surface, genuine defence in depth.
- **`event-buffer-size-is-a-page-limit`** (grep-present) — declaration
  existence.
- **`retention-test-executes-in-ci`** (grep-scoped) — becomes link 3 of the §4
  chain.
- **`retention-test-collected-by-node-project`** (grep-scoped) — link 2.
- **`next-config-not-standalone`** (grep-absent) — config absence.
- **`smoke-heading-match-is-exact`** (grep-present) — Playwright behaviour is
  not otherwise cheaply pinnable.
- **`playwright-spec-collection-widened`** (grep-present) — config.
- **`vitest-projects-exclude-e2e`** (grep-present) — config.
- **`pkg3-approval-tag-exists`** (tag-annotated) — decided by git refs, no text
  matching.
- **`pkg3-approval-tag-target`** (tag-at-commit).
- **`pkg3-candidate-freeze-unmoved`** (tag-at-commit).
- **`pkg2-approval-tag-target`** (tag-at-commit).
- **`icr-handbook-present`** (file-present).

**New claims added:** `capability-token-test-present`,
`review-callback-token-test-present`, `critical-tests-executed-by-path`,
`critical-tests-collected-by-node-project` (or one claim per test, if per-test
red attribution is wanted).

Net: 4 retired, 2 demoted, 13 retained, ~4 added → 19 → 19 (±1 depending on
granularity). Each retirement needs a `retired_claims` record with reason and
authority, and each demotion an `amended_claims` record pinning the new body —
the mechanisms already exist and are exercised by the harness.

**Retiring a claim is not deleting a property.** Each retirement record must
name the executed test that assumes the property, so the trail from claim to
replacement is readable in the manifest itself.

---

## 8. Preserving the 242-case harness

The harness tests the **verifier**, not the claims, so retiring claims does not
invalidate probe-level cases. Explicit rules:

- **Do not delete a probe because no seeded claim uses it.** After §7,
  `grep-scoped-absent` may have no live claim; its fixture cases stay. The probe
  and its negative controls are the asset.
- **Every `CTL-01/*`, `REVIEW/*` and `REVIEW2/*` case is preserved verbatim.**
  These are the executed record of every bypass three loops of review found —
  the regex-literal block-comment case, the multi-line template literal, the
  YAML `#` case, the split and spaced caps, the trailing-comment case, the
  proximity decoy, the body-swap, the amendment-does-not-exempt case. They
  guard the verifier and are independent of which claims are seeded.
- **All fail-closed cases preserved** (manifest, git, file, args, precedence),
  including the full null audit. The null audit is what makes every other case
  mean anything.
- **Mechanically affected:** `SCOPED_VIOLATIONS` and `SCOPED_ABSENT_VIOLATIONS`
  are keyed by claim id, so entries for retired claims are removed with them.
  That is expected and is not a case deletion.
- **Case count is a ratchet.** It may not decrease except by an explicitly
  recorded case retirement carrying a reason — the same discipline the manifest
  imposes on claims. At `f304d32` the count is 91 matrix cases / 242 total
  assertions; the replacement package must report both before and after.
- **New cases required** by this design: the §1 chain rules (seq monotonicity,
  parent-object mismatch, superset violation, gap in the series), the §2
  lifecycle (a squash-merged descendant must pass — the case that fails at
  `f304d32`), and the §6 wiring mutations.

---

## 9. Integration changes, separately identified

These are **not** part of the control redesign and must land as their own
commits with their own evidence, so neither hides inside the other.

### INT-1 — Stale workflow-structure fixture (pre-existing)

`scripts/test-verify-workflow-structure.py` asserts on fixture text
`- name: Pin npm to the version that produced the lockfile`, retired from
`ci.yml` by `5bb0a42`. The harness dies on its second case at every commit
tested (`0dd1684`, `5064526`, `f304d32`), so `lint.yml`'s "Mutation-test the
workflow structure verifier" step is dead and the two `fetch-*` cases corrected
during this batch are verified by nothing automated.

- **Change:** repoint the fixture to an `if:`-guarded step that exists at BASE.
- **Acceptance:** the harness runs end to end; case count reported; the two
  `fetch-*` cases pass at both comparison bases (they do today when driven
  individually, so a regression here means the repair is wrong).
- **Scope note:** touches only that harness. It is a prerequisite for trusting
  any workflow-structure evidence in the main package, which is why it goes
  first.

### INT-2 — Approval-record regeneration

Adding the §6.1 critical-tests step and the §6.2 harness step changes
`frontend-tests.yml`, so `scripts/workflow-structure-approval.json` must be
regenerated for both comparison bases.

- **Change:** `--write-approval` at each base with a rationale that **appends
  to** the existing text and never replaces it. The union already carries the
  `c98dcf1` and `5064526` texts with provenance; the new item is appended after
  them.
- **Acceptance:** the `c98dcf1` text remains a verbatim substring; the
  credential-scanner line numbers survive; the gate exits 0 at both bases.
- **Governance:** the record is candidate-written and must say so unless the
  Founder authorizes it. This is the third pass over this record; the provenance
  header exists precisely so the next pass does not lose what the last one
  carried.

---

## 10. Migration, acceptance, red mutations, rollback

### 10.1 Sequence

- **M0 — INT-1, stale fixture repair.** Depends on nothing. No Founder action.
- **M1 — §5 strengthen `capability-token.test.ts`, add
  `review-callback-token.test.ts`.** Depends on M0. No Founder action.
- **M2 — §6.1 critical-tests-by-path step, §6.2 wiring harness, INT-2 approval
  regeneration.** Depends on M1. Needs **approval-record authority**.
- **M3 — §1 chain verification replacing `_is_ancestor`, plus its harness
  cases.** Depends on M0. No Founder action.
- **M4 — §7 claim retire/demote/add, with retirement and amendment records.**
  Depends on M1, M2, M3. No Founder action.
- **M5 — §3.1 principal named and provisioned, §3.2 ruleset, §3.3 four rejection
  proofs.** Depends on nothing. Needs **settings authority and the principal**.
- **M6 — §2.3 mint `claims-baseline-2` at the first approved merge.** Depends on
  M4, M5. **The principal mints it.**

M1 and M2 are a single unit for authority purposes: until both land, §5.0 holds
and the CSPRNG property has no executed authority. M1 alone strengthens the file
but does not make it load-bearing.

M5 precedes M6 deliberately: minting the genesis link before the ruleset exists
would leave the chain's first and most important link unprotected during the
window when nobody is yet watching it.

### 10.2 Complete acceptance matrix

Every row is a bypass **reproduced against `f304d32`** by the final independent
audit, or a chain/lifecycle property this design introduces. "Now" is the
behaviour at `f304d32`. Each row must fail before its fix and pass after.

Each entry gives: the source that reproduced it, the mutation, the behaviour
**now** at `f304d32`, what is **required** after the fix, and the control that
must catch it.

**D-1 — baseline chain and tag protection**

- **D-1.1** (Architecture Review) — squash-merge the candidate, then run
  coverage on the merged commit. Now: **exit 2**. Required: **exit 0** with full
  coverage. Caught by §1 rules 3-6, ancestry removed.
- **D-1.2** (design) — manifest names `seq` lower than `H - 1`. Now: n/a.
  Required: exit 2. Caught by §1 rule 3.
- **D-1.3** (design) — manifest names `seq` higher than `H`. Now: n/a.
  Required: exit 2. Caught by §1 rule 3.
- **D-1.4** (design) — `parent-tag-object` does not match link `M-1`'s object
  sha. Now: n/a. Required: exit 2. Caught by §1 rule 4.
- **D-1.5** (design) — a link is missing from the series below `H`. Now: n/a.
  Required: exit 2. Caught by §1 rule 6.
- **D-1.6** (design) — a claim present at `M-1` is absent at `M` with no
  retirement record. Now: n/a. Required: exit 1 naming the id. Caught by §1
  rule 5.
- **D-1.7** (design) — the head link is withdrawn by a higher link. Now: n/a.
  Required: the head skips it and the run exits 0. Caught by §2.5.
- **D-1.8** (design) — force-move a baseline tag. Now: n/a. Required: **push
  rejected**. Caught by §3.2.
- **D-1.9** (design) — delete a baseline tag. Now: n/a. Required: **push
  rejected**. Caught by §3.2.
- **D-1.10** (design) — a non-principal creates `claims-baseline-*`. Now: n/a.
  Required: **push rejected**. Caught by §3.1 with §3.2.

**D-2 — comment-scanner misparse**

- **D-2.1** (Independent Code Review) — `return /[/*]/.test(v)` in `store.ts`,
  then a live 200-event cap. Now: **exit 0**. Required: **CI red**. Caught by
  the executed retention test via the §4 chain.
- **D-2.2** (ICR) — `return /x\//.test(prefix)` in `id.ts`, then
  `return nextId(prefix)`. Now: **exit 0**. Required: **CI red**. Caught by the
  §5.2 derivation test.
- **D-2.3** (ICR) — `` return /[`]/.test(v) `` in `constants.ts`, the
  declaration commented out and the value changed to 500. Now: **exit 0**.
  Required: **CI red**. Not caught by any static probe in this design; answered
  by the §7 demotion, so no static claim asserts a runtime property here.
- **D-2.4** (design) — an unterminated template literal at end of file. Now:
  blanks the rest of the file. Required: exit 2. Caught by scanner guard
  symmetry.

**D-3 — `no-truncation` enumeration gaps**

- **D-3.1** (ICR) — `while (store.events.length > 200) store.events.length--;`.
  Now: **exit 0**. Required: **CI red**. Caught by the executed retention test.
- **D-3.2** (ICR) — `store["events"].length = 200;`. Now: **exit 0**. Required:
  **CI red**. Caught by the executed retention test.
- **D-3.3** (ICR) — `store?.events.splice(200);`. Now: **exit 0**. Required:
  **CI red**. Caught by the executed retention test.
- **D-3.4** (ICR) — `Array.prototype.splice.call(store.events, 200);`. Now:
  **exit 0**. Required: **CI red**. Caught by the executed retention test.

**D-4 — CSPRNG derivation**

- **D-4.1** (Architecture Review) — a conditional decoy `return` carrying
  `randomUUID()`, padding, then `return nextId(prefix)`. Now: **exit 0**.
  Required: **CI red**. Caught by the §5.2 derivation assertion and its
  call-count check.
- **D-4.2** (final independent audit) — `nextCapabilityToken` returns a
  deterministic 32-hex counter. Now: **passes the whole current test file**.
  Required: **CI red**. Caught by the §5.3 counter adversary. This is the row
  that refutes the earlier assessment of the capability test (§11 A-2).

**D-5 — executed arm unpinned**

- **D-5.1** (ICR and AR) — delete `capability-token.test.ts`. Now: **19/19
  green**. Required: **CI red**. Caught by the §6.1 explicit path and its
  `file-present` claim.
- **D-5.2** (design) — remove the derivation assertion from a critical test.
  Now: n/a. Required: **CI red**. Caught by the §6.2 weakening arm.
- **D-5.3** (design) — remove the critical-tests step from the workflow. Now:
  n/a. Required: **approval gate red and the step-binding claim red**.
- **D-5.4** (design) — narrow the Vitest include so a critical test is not
  collected. Now: n/a. Required: **claim red**. Caught by the collection claim.
- **D-5.5** (design) — delete `audit-timeline.test.ts`. Now: n/a. Required:
  **CI red**. Caught by the §6.1 explicit path.
- **D-5.6** (design) — delete `review-callback-token.test.ts`. Now: n/a.
  Required: **CI red**. Caught by the §6.1 explicit path.

Rows D-2.1 through D-5.1 are the ones that currently exit 0. **The acceptance
bar for the package is every row above, not a selected subset** — the four
highlighted in the previous revision of this document were an arbitrary sample
and understated what must hold.

Two rows deserve their status called out. **D-2.3** is not fixed by any static
probe in this design; it is answered by §7 demoting
`event-buffer-size-is-a-page-limit` to a structural claim whose statement no
longer asserts a runtime property, so a blinded scanner can no longer produce a
false assurance about one. **D-4.2** originates from the final independent audit
rather than from a loop-3 review, and is the row that refutes the earlier
assessment of the capability test (§11 A-2).

### 10.3 Rollback behaviour

- **M0-M4** are ordinary commits and revert cleanly.
- **M5** is settings; rollback is disabling the ruleset. Nothing in the
  repository depends on it for correctness, only for trust. Record either way.
- **M6 mints an immutable link.** There is no rollback by deletion — §3.2
  forbids it and §2.5 is the designed path: land the fix, mint the next link
  with `withdraws:` naming the bad one.
- **If §1 proves unworkable**, the fallback is to keep the tag-peel check, drop
  `_is_ancestor`, and accept that a backward pointer is caught only by the
  superset rule. Weaker in one respect, stronger in another (no red-gate
  certainty), and it must be disclosed on every green run rather than assumed.
- **Standing rule.** No rollback may leave the verifier reporting green with a
  weaker check than the run before it. If a package is reverted, its claims and
  its limitation text revert with it, in the same commit.

### 10.4 Founder decisions required

1. **Name and provision the §3.1 creation principal** — GitHub App preferred,
   Founder account acceptable, `GITHUB_TOKEN` and "all writers" excluded.
2. **Create the §3.2 ruleset** with empty update/delete bypass lists, and run
   all four §3.3 proofs including the non-principal rejection.
3. **Confirm `claims-baseline-1` is never pushed** and authorize its local
   deletion (§2.6).
4. **Merge method for the current branch.** §1 removes the squash-merge
   conflict, but until M3 lands the `_is_ancestor` behaviour applies, so a
   squash merge of anything at `f304d32` produces a permanently red gate.
5. **Authority for the approval-record rationale** (INT-2) — candidate-written
   or Founder-authorized.
6. **Sequencing of M1+M2.** They are one authority unit; landing M1 alone leaves
   §5.0 in force and must not be reported as closing the CSPRNG gap.

---

## 11. Review addendum to `docs/plans/CTL-01-03_DEFERRED.md`

**Not applied.** The deferred package is a historical record of what was known
when three loops closed, and it is not edited. The correction below is specified
as an **appended addendum section**, added verbatim beneath the existing text
with its own heading, leaving every original line intact and quoting each
statement it corrects.

> ### Addendum A — corrections to this record
>
> **Status:** Appended, not applied retroactively. Everything above is preserved
> as written on the date it was written, including its severity labels, which
> remain valid as the chronology of what was known at each loop.
>
> **A-1. Final severity of D-4 and D-5.** This record labels D-4 and D-5 MAJOR,
> following the loop-3 Architecture Review's "MAJOR FU-2" and "MAJOR FU-3".
> **Under the final independent audit both are BLOCKERS.** The blocking set is
> **D-1, D-2, D-3, D-4 and D-5** — all five.
>
> The earlier MAJOR classifications are retained above as **historical
> chronology only**: they record what each loop concluded with the evidence it
> had, and they are not the current severity. The reclassification follows from
> evidence that arrived after loop 3:
>
> - **D-4** is not a hardening opportunity. With D-5 open there is no executed
>   authority for the CSPRNG property, so the defeated static pair was the only
>   thing standing behind it, and its defeat is a live reinstatement of SEC-6 —
>   a HIGH pre-deployment blocker — with the control green.
> - **D-5** is not a gap in coverage. The test it names does not decide the
>   property (A-2), so the property is unproven by any mechanism, not merely
>   unpinned by a claim.
>
> Together they mean the CSPRNG property has **no** authority in this
> repository: not static, not executed. That is a blocking condition, and §3 of
> this record should be read with D-4 and D-5 promoted into its blocking list.
>
> **A-2. The CSPRNG assessment was unsupported when written, and was
> subsequently refuted.** §3 D-5 states:
>
> > "`lib/dev-hq/capability-token.test.ts` exists and proves the CSPRNG property
> > with null arms — by inspection it kills D-4's exploit outright."
>
> That assertion was **unsupported at the time it was written**: it rested on
> inspection, the loop-3 Architecture Review had explicitly labelled its own
> version of it "a traced inference from the assertions, not an observed test
> run", and the implementer adopted it without independent verification.
>
> **Later independent execution refuted it.** The file's assertions are
> satisfied by a deterministic 32-hex counter — the shape check
> `^[0-9a-f]{32}$`, the 10,000-mint uniqueness check, the clock-prefix check and
> the decimal-increment check all pass against a generator with no entropy at
> all. The file therefore establishes "not `nextId`" and **not** "drawn from a
> CSPRNG", and it would not have killed D-4's exploit on the derivation
> question.
>
> The corrected statement is: *`capability-token.test.ts` is a well-built
> negative-control suite against `nextId` that does **not** prove CSPRNG
> derivation. It becomes the appropriate authority for that property only after
> the strengthening and mutation validation specified in DESIGN-002 §5.0.*
>
> **A-3. Scope of "each is now closed".** §2 states that every defect named in
> the handoff for CTL-01/02/03 "was reproduced before any edit, and each is now
> closed with a negative control that fails without its fix". That is accurate
> for each **named instance**, and each negative control exists. It is not
> accurate against CTL-01's stated **acceptance criterion** — *"preserve
> matching text while breaking the property; every mutation must fail and name
> its claim"* — which D-2 and D-3 show is not met, since further mutations
> preserving matching text still exit 0. §2 should be read as "every named
> instance is closed; the acceptance criterion is not met".
>
> **A-4. `claims-baseline-1` must never be published.** §5 records the tag as
> created locally and unpushed, and treats pushing it as a pending Founder
> action. That is superseded: the tag belongs to a candidate line that was
> rejected by independent audit at every loop, and publishing it would make the
> genesis of an immutable, protection-backed chain a link minted against
> rejected content. It must never be pushed. See DESIGN-002 §2.6.
>
> **What is not corrected.** The validation table in §2, the loop/verdict table
> in §1, and §§4-6 were re-checked against the reviews and stand as written.

---

## 12. What this design does not solve

- **OBL-30 is untouched.** §3 anchors the baseline chain outside candidate
  reach; the verifier, harness, manifest and approval record remain
  candidate-editable. A candidate can still change what is checked.
- **`authorized_by` remains self-asserted** on retirement and amendment records.
- **Static probes remain heuristics.** §7 keeps thirteen. Their known evasions
  (D-9, D-10, D-11, D-12 in the deferred package) are unfixed by this design and
  are only made *safe* by the rule that no runtime property may rest on one.
- **The `document` field is still unvalidated** (deferred D-6). A two-line check
  in `load_manifest` closes it and should ride with M4; it is listed here so it
  is not lost again — it was reported fixed once already when it was not.
- **`statement` drift** (deferred D-8) is unaddressed and still deserves its own
  package.
