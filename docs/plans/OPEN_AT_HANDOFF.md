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

## 3. FOUNDER DECISIONS — authorization recorded; execution split by batch

The Founder’s instruction on this handoff was **“do these, all of them.”** That
ratifies the eight decisions as work to execute, without turning one batch into
approval of another batch’s architecture. The rows below record their current
disposition.

| ID | Decision |
|---|---|
| **OBL-36** | **RATIFIED / CLOSED IN BATCH 1.** ADR-0003 records that `accept`, `abandon`, and `revise` first end a linked queued/running execution; tests cover all verbs, both non-terminal states, same-resolution replay, and newer-decision precedence. |
| **OBL-34** | `environment: production-release` does not exist (`gh api .../environments` → `total_count: 0`). No human release approval or self-review prevention is enforced, so publishing can proceed without that approval. The P0-11 post-approval revalidation logic is correct but has no approval wait to operate across until the protected environment is configured. |
| **X-29** | **RATIFIED / CLOSED IN BATCH 1.** ADR-0003 supersedes ADR-0001 O6 and extends ADR-0002 E2 without editing either immutable ADR. It records the 120-second O5-class deadline, `queue_stalled`, and resolution of linked non-terminal work. |
| **ARCH-02** | **RATIFIED / CLOSED IN BATCH 1.** A machine-raised escalation retains its escalation, evidence, and refusal record but does not reopen a `completed` or `rejected` task. Because task provenance is not modeled, ADR-0003 explicitly protects terminal status generically rather than claiming every terminal status was Founder-produced. |
| **OBL-30** | **PARTIAL CANDIDATE.** `lint.yml` now runs the real verifier against the triggering raw base SHA and then runs its matrix/null/approval harness against that same SHA. The checked manifest has separate records for the actual pull-request base, push-before base, and manual-dispatch installation base. Intentional changes bind the resolved base commit/tree, candidate workflow-tree digest, changed-file set, typed canonical diff (including empty-container identities), and rationale; stale, mismatched, and tampered records fail. SHA-256 makes the record tamper-evident, not human-approved or signed. Requiring the ordinary `Lint / GitHub Actions` job name is insufficient: a candidate can keep that name green while hollowing or removing the invocation, verifier, harness, or manifest. Closure requires a trust anchor external to candidate-controlled files: either a supported and verified repository/organization required workflow or ruleset whose implementation is protected, or independently enforced path ownership/review for `lint.yml`, the verifier, harness, and manifest. It also requires an observed mutation proving implementation/invocation hollowing cannot preserve the required green check. No such capability or enforcement is asserted to exist yet. |
| **OBL-37** | **RATIFIED / CLOSED IN BATCH 1.** `claimTask` is removed from `TaskRepository` and the development adapter; ADR-0003 requires any future replacement to use coordinated lifecycle preconditions. |
| **OBL-38** | **RATIFIED / CLOSED IN BATCH 1.** `reviewPolicy: none` completes on success; `basic`/`full` complete only after a passed review; changes-requested/escalated and stale older results do not complete. |
| **§6** | **PARTIAL.** ADR-0004 closes the `proxy.ts` `NODE_ENV` conflation with an explicit default-deny local mode and corrects ARCH-07's 200-event audit loss. ARCH-10, ARCH-03, ARCH-06, SVC-05, and SVC-06 remain open: no coordinated durable backend or Founder authentication system is selected/provisioned, and retaining every event increases unbounded memory plus repeated O(n log n) reads. |

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
