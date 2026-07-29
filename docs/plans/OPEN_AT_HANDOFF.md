# Open at handoff — 2026-07-29

**Document ID:** HANDOFF-002
**Branch:** `chore/close-open-obligations` @ `86df84d`
**Status:** Tree clean, all validation green. Nothing in flight.

Companion to `REVIEW_FINDINGS_HANDOFF.md` (HANDOFF-001), which carries the
original findings. This file is only what is **still open** and who owns it.

---

## State at handoff — measured, not asserted

| Check | Result |
|---|---|
| `npx vitest run` | 771 passed / 63 files |
| `npx tsc --noEmit` | clean |
| `npx eslint` | clean |
| `npm run build` | succeeds |
| `npx playwright test` | 8/8 |
| `scripts/test-verify-workflow-structure.py` | 50 passed, 0 failed |
| `scripts/test-release-controls.py` | 81/81 (+1 opt-in live-CLI probe) |
| Semgrep 1.145.0, real tree | 0 findings |
| actionlint 1.7.7 | exit 0 |
| Roadmap registered hash | PASS |

Twenty commits landed this session, `0d83525..86df84d`. Test count 417 → 771.

---

## 0. STATUS — all three third-round blockers are CLOSED

Superseded. This section previously flagged uncommitted scanner work; it landed
and verified after that was written.

| finding | closed by |
|---|---|
| MAJOR-1 · third path to two live executions | `2872d21` |
| MAJOR-5 · focus test that passed without its fix | `5e1cc1e` |
| MAJOR-2 / MAJOR-3 / MAJOR-4 · scanner regression, fourth bypass, unverified roots | `9326534` |

Sections 1 and 2 below are kept as the original finding text, because the
finding is worth reading next to what was done about it. **Everything in them is
now closed.** Section 3 — the Founder decisions — is what is actually left.

One thing §1 got wrong is worth keeping visible: the MAJOR-3 evidence table in
this document originally spelled literal secret-shaped assignments, which turned
the credential scanner red on the document describing the scanner. It is now
written as shapes rather than literals.

---

## 1. Third-round blockers — CLOSED, original finding text retained

Three agents were mid-work on these when the session ended. No partial work
survives; the tree is byte-identical to `86df84d`.

### MAJOR-1 · A third path to two live executions on one task
`lib/dev-hq/review-service.ts:668-687`. `ensureReviewRevision` creates a routed
execution via `ensureExecution:678` and never calls
`assertNoLiveExecutionForTask`.

`ensureExecution` has three non-manager call sites: `agent-execution-service.ts:952`
(guarded), `escalation-service.ts:531` (OBL-36, a Founder decision), and this
one. **Unlike OBL-36 this carries no policy ambiguity.**

Reproduced by the reviewer against the real services: dispatch E1 under a review
policy → E1 succeeds, review R1 opens → task holds no *live* execution so a
re-dispatch E2 is correctly permitted → the reviewer reports **late** on R1 with
a blocking finding → the revision execution is created on the same task.

```
LIVE EXECUTIONS ON ONE TASK:
  exec-dispatch-icr-k2:queued
  exec-review-revision-rvw-exec-dispatch-icr-k1:queued
```

A late reviewer callback is a designed-for condition — the loop has
`REVIEW_RESPONSE_DEADLINE_MS` precisely because reviewers go silent.

**Open question for whoever fixes it:** refusing must not strand the review
loop. The review has already been decided; something has to record the refusal,
and `reconcileReviews` must not re-attempt forever with no progress — that is
the "neither completes nor fails" shape this system keeps producing.

### MAJOR-3 · A security REGRESSION introduced by `b7b6d4b`
`.github/workflows/security.yml:560-570`. `looks_like_version_range` was added
to suppress a lockfile false positive (a semver range under a package name) but
is applied to the value in **every file**, in both `GENERIC_SECRET` and
`UNQUOTED_SECRET`. Measured against both scanners, with an opaque 18-character
token assigned to a name meaning "api token" — described rather than reproduced
here, because spelling these literally turns the credential scanner red on this
very document:

| value shape assigned to an api-token name | 65bdf2a | 786eb34 |
|---|---|---|
| leading digit then hyphen then the token | CAUGHT | MISS |
| a semver core, hyphen, then the token | CAUGHT | MISS |
| twenty digits, no letters | CAUGHT | MISS |
| the bare opaque token (control) | CAUGHT | CAUGHT |

The justification — "a dependency specifier is not a credential" — holds only in
a manifest or lockfile. Scope it to those file kinds, or require the enclosing
name to look like a package name. **Keep the lockfile fix; close the regression.**

---

## 2. Should fix — control quality, not data corruption

### MAJOR-2 · The FOURTH consecutive bypass of `has_sensitive_name`
`.github/workflows/security.yml:621-637`. Four shapes:

- **One digit adjacent to the word disables the rule.** `PASSWORD1`, `API_KEY2`,
  `SECRET2`, `token2` all MISS while `PASSWORD` and `API_KEY_2` are caught. Key
  rotation is a routine reason to write exactly this. Same shape as the `_HEADER`
  bypass — now one *character*.
- **Coverage depends on the author's separator habit.** `apiToken`/`API_TOKEN`
  caught; `apitoken`, `authtoken`, `accesstoken`, `secretkey`, `privatekey` MISS.
  `APIKEY` is caught only because `apikey` is hard-coded into `ALWAYS_SENSITIVE`
  — direct evidence the word list is patched by example rather than by rule.
  Real instance: **ngrok's config file uses an unseparated auth-token key**, so a
  committed `ngrok.yml` is invisible end to end. (Named indirectly here: an
  inline-code span ending in a colon, followed by a long value, is itself read as
  an assignment by the scanner.)
- A quoted property name starting with a digit or containing a space yields zero
  matches: `{"2fa_secret": "..."}` MISS.
- `sshKey`, `DEPLOY_KEY`, `hostKey`, `passphrase`, `SENTRY_DSN` MISS.

**The structural finding:** `ENV_ASSIGNMENT` (`:724-728`) already treats `AUTH`,
`DSN`, `SALT`, `PRIVATE`, `ACCESS`, `REFRESH`, `SK` as sensitive. One scanner,
**two word lists that disagree**. Reconcile them deliberately rather than adding
another word — that is what has failed four times.

### MAJOR-4 · Semgrep include roots and one whole rule are unverified
The TOKEN rule declares four include roots
(`.semgrep/dev-hq-boundaries.yml:143-146`) but all three `token-*` fixtures sit
in `lib/dev-hq/`. Reviewer demonstrated that deleting `- "/trigger/**"` silently
exempts the worker directory — where a second token-verification site is most
likely — and the positive control stays GREEN.

`dev-hq-dangerously-set-inner-html` (`:183-195`) has **no known-bad fixture and
no null arm**; deleting the rule outright leaves the control green. Under rule 1
it has no acceptance evidence — the same deficiency `b7b6d4b` fixed for the
credential job, sitting untouched in the job beside it.

### MAJOR-5 · The P2-35 focus test is not evidence for its fix
`components/dashboard/MissionControlOverview.test.tsx:245-271`. Deleting the fix
at `MissionControlOverview.tsx:66-70` leaves all five tests passing. The
behaviour the fix exists for — disabling the focused button drops focus — is not
reproduced by jsdom, so `activeElement` never leaves the button.

`e27043c` did strengthen this test after finding it green under a *different*
mutation, and that claim is accurate. The strengthening did not make it able to
observe the defect it is named for.

**Note:** an agent was mid-mutation on this file when the session ended; the
probe was found and reverted, and the tree is byte-identical to HEAD. Verify
`MissionControlOverview.tsx:70` reads `if (target.isConnected) target.focus();`
before starting.

### Minor, recorded
- `security.yml:364-370` claims a crashed scanner and a violation "must never
  share an exit status". Python exits **1** on an uncaught exception, so the
  `rc not in (0, 1)` check cannot fire for the likeliest crash mode. It fails
  closed anyway; the comment states a property the code lacks.
- `components/dashboard/MissionControl.tsx:79` — `provenance="simulated"` is
  unpinned. Changing that one word to `"live"` restores mock statuses under a
  LIVE STATE badge with all 771 tests green.
- `scripts/test-release-controls.py` runs in **no workflow**, and its
  `--gh-probe` arm is off by default. The CLI-contract claim that `gh` prints
  `release not found` — which all three hardened sites depend on — is never
  checked by CI. Same shape as OBL-30.
- `agent-execution-service.ts:1352-1356` still says the anchor holds "of both
  release sites"; there are four. OBL-35 records the correction, the comment
  does not.

---

## 3. FOUNDER DECISIONS — recorded, none ratified here

Some rows describe provisional implementation that already exists. That code is
evidence and a candidate policy, not a substitute for the Founder decision the
row requires. This section records no new ratification.

| ID | Decision |
|---|---|
| **OBL-36** | What a Founder resolution means for a non-terminal escalated execution. `7979950` provisionally ends the existing non-terminal execution for all three verbs, but that implementation is not Founder ratification. **Scope correction recorded in `OPEN_OBLIGATIONS.md`:** the decision and closure evidence must cover `accept`, `abandon`, and `revise`, including queued and running executions and replay convergence. The policy decision itself remains open. |
| **OBL-34** | `environment: production-release` does not exist (`gh api .../environments` → `total_count: 0`). No human release approval or self-review prevention is enforced, so publishing can proceed without that approval. The P0-11 post-approval revalidation logic is correct but has no approval wait to operate across until the protected environment is configured. |
| **X-29** | A **new superseding ADR** for the delegated stall-deadline decision. Not an amendment — `VERSIONING_POLICY.md:222-232` makes ADRs immutable. It must state: O6's resting→terminating change, the third `EscalationOrigin` member, the O5-class deadline value, and (per the architecture review) what resolution does to a non-terminal execution. |
| **ARCH-02** | Whether a machine-raised escalation may reopen a founder-terminal task. An agent proved there is **no point on the write path** where a terminal guard can live without contradicting ARCH-02's convergence rule — both `updateTaskStatusIf` and `ensureEscalatedTaskStatus` break asserted contracts. Governance, not implementation. |
| **OBL-30** | Wiring `verify-workflow-structure.py` into CI. Still runs nowhere. |
| **OBL-37** | Removing `claimTask` from a published port. |
| **OBL-38** | Nothing marks an agent task `completed` on success — it stays `active` forever. Sprint 1F's execution board reads exactly that field. |
| **§6** | ARCH-10, `proxy.ts` NODE_ENV, ARCH-03, ARCH-06, ARCH-07, SVC-05, SVC-06 — all verified untouched by both architecture reviews. |

---

## 4. The pattern, for whoever picks this up

`standards/CONTROL_VERIFICATION_STANDARD.md` rule 4 — *the author does not write
the control's only negative controls* — earned its place repeatedly today:

- Six defects fixed this session were in code committed **earlier the same
  session**, including a guard whose commit message claimed it closed a hole it
  could never fire on.
- `has_sensitive_name` has now been fixed four times by four agents and found
  broken four times by four reviewers.
- **Five existing tests were found asserting defects as intended behaviour** —
  one pinning "two live executions on one task" as the contract.
- Two harnesses were found producing greens while measuring nothing: one where
  Windows `CreateProcess` resolved past an extensionless stub, one where a
  Docker env var retargeted the scan away from the fixture tree.
- One review **retracted its own finding** after establishing it was that
  reviewer's own contamination.

In every case the author's own validation passed. In no case did it catch the
defect.
