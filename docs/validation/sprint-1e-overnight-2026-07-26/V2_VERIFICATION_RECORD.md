# Sprint 1F V-2 — Trigger.dev Development-Environment Viability — Verification Record

**Author:** Main Coordinator. Documentation only; this file changes no executable behaviour.
**Date:** 2026-07-27
**Anchor:** commit `5354384d886627f6b9692a4651db7a5839fd76fb`, tree `5f47c736b17e39b352ce3f38337fb68e9e108c6f`
**Verdict preserved:** `UNABLE TO VERIFY`
**Status:** First V-2 attempt did not execute. A staged rerun is authorized. Nothing is ratified.

**Formatting rule.** No load-bearing content is preserved only inside a wide Markdown
table. Substantive content is in numbered lists. This follows `PKGE-CORRECTION-1`.

---

# 0. What this record is

V-2 was commissioned to answer, empirically, whether a co-located Trigger.dev
**Development** worker can reliably support the Dev HQ founder-request workflow across
restarts and long-lived operation. That question gates ratification of the provisional
hosting option **H-AQ**.

**The first attempt did not execute.** This record preserves why, what was nonetheless
learned, the findings raised, and the staged rerun plan.

**This record ratifies nothing.** It grants no implementation, hosting, deployment, or
barrier-change authority. It does not decide E-1, E-2, or E-12, does not ratify H-AQ,
and does not draft or advance ADR-0003.

---

# 1. First V-2 attempt — verdict and cause

## 1.1 Verdict

```text
UNABLE TO VERIFY
```

**Accepted by the Main Coordinator without correction.** The verification engineer
stopped correctly, disclosed precisely, and changed nothing.

## 1.2 Why it did not execute

Each cause independently re-derived by the Main Coordinator at the anchor:

1. **The supplied working directory was not the anchor.** The Main Coordinator session's
   primary directory is on `validation/sprint-1e-overnight-2026-07-26`, an ancestor of
   the anchor. The anchor lives in the pre-existing worktree
   `savrio-advance-1f`, where the engineer located and verified it exactly.
   **Root cause: the V-2 brief named an anchor commit without naming the worktree holding
   it. That was a Main Coordinator defect, not engineer error.**
2. **The anchor worktree has no `node_modules`.** Verified absent. Neither
   `npm run dev` nor `npm run trigger:dev` could start.
3. **The anchor worktree has no `.env.local`.** Verified — only `.env.local.example`
   exists.
4. **`TRIGGER_SECRET_KEY` is genuinely required.**
   `lib/dev-hq/founder-request-service.ts:128` calls `tasks.trigger`; lines 465, 489, and
   528 call `wait.completeToken`. All run inside the Next.js process and require SDK
   credentials.
5. **`DEV_HQ_INTERNAL_TOKEN` is genuinely required.**
   `lib/dev-hq/internal-guard.ts:20-29` returns HTTP 503 when it is unset, and every one
   of the nine internal callbacks passes through that guard.
6. **Every workaround was prohibited by the authorization.** Dependency installation,
   environment-file creation, secret acquisition, and tracked test-fixture creation were
   all outside V-2's granted authority. Reading the Founder's `.env.local` would have
   breached the secret-exposure stop condition, and the environment refused it
   independently.

## 1.3 What was explicitly not treated as success

Repository inspection is not empirical verification. Historical Trigger.dev runs are not
restart evidence. **All six V-2 questions remain UNKNOWN, and none of the four required
token negative controls was executed.**

---

# 2. Repository and candidate identity

Verified by the engineer and independently re-derived by the Main Coordinator:

```text
worktree  savrio-advance-1f   (sibling worktree of the primary checkout)
branch    feature/dev-hq-operating-system
commit    5354384d886627f6b9692a4651db7a5839fd76fb
tree      5f47c736b17e39b352ce3f38337fb68e9e108c6f
parent    0ab3ce1bf39c6bfacc72a3ee4d99181abcce366c
status    clean (zero porcelain lines)
tag       candidate-1f-pkge-1
tag object ed00a661e482322dc85a41c3023ad885ac058a53  (type: tag)
```

Production barriers, byte sizes independently confirmed:

```text
proxy.ts                       728
lib/dev-hq/internal-guard.ts  1201
lib/dev-hq/actions.ts         3322
```

Provisioning state at the anchor worktree:

```text
node_modules   ABSENT
.env.local     ABSENT  (only .env.local.example present)
```

**The first V-2 attempt changed nothing.** Branch, commit, tree, parent, candidate tag,
annotated tag object, worktree cleanliness, and all three barriers are identical before
and after.

---

# 3. Corrected wait inventory

## 3.1 The correction

```text
One long-lived suspension exists at wait.forToken in
trigger/founder-request-workflow.ts:83.

It is preceded by wait.createToken at trigger/founder-request-workflow.ts:69-74.

The timeout: "7d" expression on line 70 is a property of wait.createToken and is
not a second wait.
```

## 3.2 The prior incorrect wording, preserved openly rather than replaced

The original V-2 prompt, written by the Main Coordinator, stated:

> `wait.forToken({ timeout: "7d" })` at `trigger/founder-request-workflow.ts:70` and `:83`

That conflates two distinct constructs into one and implies two long-lived waits exist
where there is one. **The error was the Main Coordinator's.** It is preserved here rather
than silently corrected, because a record that quietly deletes its own mistakes cannot be
audited.

## 3.3 Verified evidence

Exactly five `wait.*` call sites exist repository-wide at the anchor:

```text
lib/dev-hq/founder-request-service.ts:465   wait.completeToken   (replay path)
lib/dev-hq/founder-request-service.ts:489   wait.completeToken   (approve path)
lib/dev-hq/founder-request-service.ts:528   wait.completeToken   (reject path)
trigger/founder-request-workflow.ts:69      wait.createToken
trigger/founder-request-workflow.ts:83      wait.forToken
```

Verified structure at `trigger/founder-request-workflow.ts:69-74`:

```text
    const token = await wait.createToken({
      timeout: "7d",
      idempotencyKey: `founder-approval-${payload.executionId}`,
      idempotencyKeyTTL: "7d",
      tags: [`execution-${payload.executionId}`],
    });
```

**Binding on all future prompts and records.** The single suspension point is a simpler
and more favourable verification subject than the original brief implied — the correction
runs in the project's favour, which is not a reason to record it any less plainly.

---

# 4. Findings V2-F1 through V2-F9 — reconciled

## V2-F1 — Anchor is not the supplied working directory and is not provisioned to run

1. **Status:** CONFIRMED.
2. **Severity:** High for V-2 execution. **Not a product defect.**
3. **Blocks:** the V-2 rerun only.
4. **Evidence:** anchor located clean in `savrio-advance-1f`; `node_modules` absent;
   `.env.local` absent.
5. **Next action:** Founder authorizes the exact worktree and `npm ci` there. **Granted
   in the 2026-07-27 authorization.**
6. **Owner:** Founder, via Main Coordinator.

## V2-F2 — Required credentials unavailable

1. **Status:** CONFIRMED.
2. **Severity:** High for V-2 execution. Not a product defect.
3. **Blocks:** the V-2 rerun only.
4. **Evidence:** `tasks.trigger` at `founder-request-service.ts:128`; `wait.completeToken`
   at `:465`, `:489`, `:528`; `internal-guard.ts:20-29` returns 503 when the internal
   token is unset.
5. **Next action:** Development credential supplied directly to the test shell, never
   written or echoed. **Granted for Path B; `DEV_HQ_INTERNAL_TOKEN` is not needed for
   Path B and was not granted for it.**
6. **Owner:** Founder.

## V2-F3 — Brief's wait inventory did not match the repository

1. **Status:** CONFIRMED. See §3.
2. **Severity:** Medium — evidence integrity.
3. **Blocks:** nothing. Corrective only.
4. **Evidence:** the five-site inventory and lines 69-74 in §3.3.
5. **Next action:** corrected wording adopted; preserved openly.
6. **Owner:** Main Coordinator. **The error was the Main Coordinator's.**

## V2-F4 — Suspend-and-resume demonstrated, but only at second-scale and never across an interruption

1. **Status:** PARTIALLY CONFIRMED. The reasoning is confirmed; **the run data is
   cloud-side and was not independently re-derived by the Main Coordinator.**
2. **Severity:** Medium — positive but insufficient evidence.
3. **Blocks:** nothing. **Supports nothing either.**
4. **Evidence:** two Development runs suspended at `wait.forToken` for 6.7s and 41.7s,
   resumed, and completed on Attempt 1 with no duplicate or replacement run. Both
   suspensions occurred inside single uninterrupted CLI sessions.
5. **Constraint:** four orders of magnitude short of the 7-day timeout, and containing no
   interruption of any kind. **Must not be cited as restart-survival evidence.**
6. **Owner:** Main Coordinator, for accurate downstream citation.

## V2-F5 — Retries disabled in the environment H-AQ would inhabit permanently

1. **Status:** CONFIRMED on configuration. The consequence correctly remains **UNKNOWN**.
2. **Severity:** **High risk, unresolved.**
3. **Blocks:** H-AQ ratification pending empirical resolution. Does not block ADR-0003
   drafting on other topics.
4. **Verified evidence:** `trigger.config.ts` line 8 sets `enabledInDev: false`; lines
   9-15 define the default policy `maxAttempts: 3` with exponential backoff. In the
   Development environment a failed attempt is not retried, so the configured retry
   budget would never apply to any H-AQ workload.
5. **Correctly preserved as UNKNOWN:** whether Trigger.dev **infrastructure recovery**
   after a worker disconnection is separate from **task retry policy**. If it is not
   separate, H-AQ's operating model would be materially less resilient than the
   configured policy implies. This distinction is exactly what the rerun must settle.
6. **Compounding factor:** `trigger/founder-request-workflow.ts:24-27` throws on any
   non-2xx callback response, so a single transient failure during H-AQ's mandated
   stop-then-start window would fail the attempt with no retry.
7. **Next action:** graceful and abrupt worker-termination trials, plus a deliberate
   callback-failure trial. **Do not change the configuration on this finding alone.**
8. **Owner:** Founder for E-1; Architecture Reviewer for the retry-posture implication.

## V2-F6 — A Next.js restart strands in-flight runs, and H-AQ makes that restart routine

1. **Status:** CONFIRMED on structure. **The runtime consequence chain is CODE-DERIVED
   INFERENCE and has never been observed.**
2. **Severity:** High risk, unverified consequence.
3. **Blocks:** does not block H-AQ ratification by itself, but is a **material input to
   E-1** and must be explicit in whatever record ratifies a hosting target.
4. **Verified structural facts:**
   - `lib/dev-hq/store.ts:107-116` — the store is created lazily on `globalThis` under a
     `Symbol.for` key, with no lifetime identifier.
   - `lib/dev-hq/founder-request-service.ts:470-475` — `approveFounderRequest` throws
     `Approval not found` when the approval is missing; `rejectFounderRequest` mirrors it.
   - `lib/dev-hq/founder-request-service.ts:425-428` — `failWorkflowExecution` throws
     `Workflow run not found`.
   - `lib/dev-hq/founder-request-service.ts:330-333` — `finalizeWorkflowOutcome` throws
     `Workflow run not found`.
   - `trigger/founder-request-workflow.ts:24-27` — `postJson` throws on any non-2xx.
   - `lib/dev-hq/founder-request-service.ts:292-294` — `registerApprovalGate` returns the
     existing approval unchanged when a differing `waitTokenId` is already attached — a
     stale-token rejection at the Dev HQ layer.
   - `lib/dev-hq/founder-request-service.ts:463-468` — `replayDecisionToken` relies on
     completion being a no-op and always replays the **recorded** decision.
5. **Inferred, not verified:** after a Next.js restart with a suspended run outstanding,
   the approval record is gone, so no Founder action through the application can complete
   the token; the run stays suspended for the remainder of its 7-day timeout; at timeout
   `.unwrap()` throws, `onFailure` posts to `/fail`, and `failWorkflowExecution` throws,
   so the failure hook itself fails. **Every traced path fails explicitly rather than
   falsely succeeding. No false-success path was found; none was disproven.**
6. **Why it matters for H-AQ:** H-AQ mandates stop-then-start deployment, making a
   Next.js restart a *routine, intended* operation. Under P-A every routine deployment
   strands every in-flight Founder request. This is **not a defect in E-3** — the
   non-durable posture was ratified deliberately — but the *interaction* between ratified
   E-3 and proposed H-AQ is a decision input that must be visible before E-1.
7. **Requires:** empirical confirmation before H-AQ ratification, and an explicit Founder
   acceptance condition in whatever record ratifies a hosting target.
8. **Owner:** Founder for E-1; Architecture Reviewer for the state-ownership implication.

## V2-F7 — An uninstalled CLI resolves off the pinned version

1. **Status:** PARTIALLY CONFIRMED. The pin is verified; the `npx` resolution to `4.5.8`
   is engineer tool output, **not re-derived by the Main Coordinator**.
2. **Severity:** Low — hardening.
3. **Blocks:** nothing.
4. **Next action:** any eventual H-AQ runbook must invoke `npm run trigger:dev`, never a
   network-resolving `npx`.
5. **Owner:** Lead Software Engineer, under a separately authorized package.

## V2-F8 — The E-3 mandatory process-start marker is absent

1. **Status:** CONFIRMED, by a search broader than the engineer's.
2. **Severity:** **Medium — unassigned obligation.**
3. **Blocks:** not H-AQ directly. Degrades V2-4 testability: without it a test cannot
   cleanly distinguish recovery from fresh execution.
4. **Evidence:** searches for `process-start`, `processStart`, `process_start`, `boot`,
   `processId`, `bootId`, `instanceId`, and `startedAt` return only execution-level domain
   fields on `Execution` and `AgentAssignment` records. No process-lifetime or instance
   identifier exists. `lib/dev-hq/store.ts:107-116` creates the store with no marker.
5. **Is the absence expected?** Yes. E-3 was ratified 2026-07-27; the marker is a forward
   obligation, not a regression. No implementation package has been authorized since.
6. **Which package owns it?** **None. No defined package currently carries this
   obligation** — at E-3 ratification A-P4 was still unresolved, so no implementation
   package could be defined. **Recorded as an unassigned Medium obligation.**
7. **Recommended assignment:** whichever package first implements Mission Control read
   models or the persistence-posture disclosure surface, because the marker is a
   consumer-contract field on the state snapshot.
8. **Owner:** Main Coordinator to assign; implementation requires a separately authorized
   package.

## V2-F9 — The scheduled sweeper has never executed in this project

1. **Status:** **UNABLE TO VERIFY** — cloud-side, not re-derivable by the Main
   Coordinator. The supporting configuration is CONFIRMED.
2. **Severity:** Low to Medium — evidence gap.
3. **Blocks:** leaves V2-5 wholly unanswered. Blocks nothing else.
4. **Verified configuration:** `trigger/execution-sweeper.ts` sets
   `cron: EXECUTION_SWEEP_CRON` (`"* * * * *"` at `lib/dev-hq/constants.ts:92`) and
   `ttl: "50s"`, with the source comment stating the TTL exists to expire a queued sweep
   "rather than stacking stale runs."
5. **Unverified hypothesis:** a sweep queued during an outage would expire under the TTL
   rather than run late, producing an uncovered gap with no backfill.
6. **Next action:** establish an uninterrupted baseline before testing interruption
   behaviour.
7. **Owner:** Founder to authorize the test window.

---

# 5. Evidence classification

## 5.1 Verified by the Main Coordinator, independently re-derived at the anchor

1. Anchor identity, tree, parent, tag, and worktree cleanliness.
2. Production barrier presence and byte sizes.
3. Absence of `node_modules` and `.env.local`.
4. `trigger.config.ts` retry configuration in full.
5. The five-site wait inventory and the `createToken` structure at lines 69-74.
6. Every V2-F6 code path and throw site.
7. Absence of any process-lifetime marker.
8. Sweeper cron and TTL.
9. `postJson` non-2xx failure semantics.

## 5.2 Cloud-side — NOT independently re-derived by the Main Coordinator

1. The ten Trigger.dev Development-environment run records and their two trace IDs.
2. Billed-compute versus wall-clock figures.
3. Zero `execution-sweeper` runs across the 365-day window.
4. `npx` resolving `trigger.dev@4.5.8` against the `4.5.7` pin.
5. MCP profile and account identity; dev-server log-buffer state.

**These rest on the verification engineer's tool output and are recorded as such.**

## 5.3 Code-derived inference — never observed at runtime

1. The entire V2-F6 restart consequence chain.
2. The "no false-success path found" conclusion.
3. The sweeper TTL coverage-gap hypothesis.

## 5.4 Vendor documentation — unverified by execution

1. Server-side waitpoint checkpointing.
2. The completion endpoint being a no-op on an already-completed token.
3. Waitpoint status semantics.

## 5.5 Unknowns

**All six V-2 questions. All four token negative controls. Every multi-day property.**
Also unknown: whether the Development environment carries any undocumented sub-7-day
inactivity, session, or retention limit.

---

# 6. Authorized staged rerun plan

Authorized by the Founder on 2026-07-27.

## 6.1 Step 0 — documented-limits research

1. Separate read-only research tab, `V-2 Step 0 — Trigger.dev Limits Research`.
2. Determines whether Trigger.dev's Development environment carries any documented or
   provider-confirmed limit on worker-session duration, idle disconnection, worker or run
   or waitpoint retention, seven-day-or-shorter waits, CLI authentication expiry,
   reauthentication, host or worker reconnect, or unattended long-lived operation.
3. **Sequenced first because it is the cheapest possible resolution.** A documented
   sub-7-day limit would settle H-AQ immediately and make every subsequent test
   unnecessary.
4. Ratifies nothing. Grants no implementation, hosting, or deployment authority.

## 6.2 Step 1 — Path B minimal disposable probe

1. Separate engineering tab, `V-2 Step 1 — Trigger.dev Token Probe`.
2. Answers V2-1, V2-2, V2-3, and all four negative controls.
3. **Materially cheaper than Path A:** no Next.js process, no `DEV_HQ_INTERNAL_TOKEN`, no
   Dev HQ callback path. A probe task creates and completes its own waitpoint using the
   worker's own credentials.
4. Authorized scope: `npm ci` only; one temporary untracked file at
   `trigger/v2-disposable-token-probe.ts`, deleted before completion; a Development
   credential supplied directly to the shell and never written, echoed, or reported.
5. **Acknowledged side effect:** `trigger.config.ts` includes `dirs: ["./trigger"]`, so
   the probe file changes the registered task set for the Development environment during
   the test window. It is untracked and disposable, but it is not inert.

## 6.3 Step 2 — Path A, NOT AUTHORIZED

**Path A remains blocked until Path B is complete and reconciled.** Only Path A can
exercise the real callback, approval, finalize, and sweeper paths and the P-A interaction
in V2-F6. **A synthetic probe must not substitute for it.** Path B proves Trigger.dev
token semantics; it proves nothing about Dev HQ's behaviour when its store is empty.

## 6.4 Step 3 — multi-day observation, NOT AUTHORIZED

Only warranted if Steps 1 and 2 pass. Running a multi-day window before establishing
basic restart survival would spend days to learn what an hour-long test surfaces.

---

# 7. V2-CORRECTION-1 — transmission integrity

The first V-2 return arrived with **section 1 duplicated verbatim**, roughly eight
commands duplicated in the command history, dozens of mid-word truncations, two malformed
paths, and one truncated finding body. The corruption was cosmetic and structural, not
substantive: every finding retained its identifier, severity, evidence citation, and
conclusion, and no conclusion was unsupported. **No silent repair was performed.**

This is the **fourth** transmission-integrity failure in this project:

1. `PKGC-CORRECTION-1` — cryptographic evidence lost to a wrapping Markdown table.
2. `PKGD-CORRECTION-1` — a read-only audit leaves no artifact in the tree.
3. `PKGE-CORRECTION-1` — load-bearing content lost to wide Markdown tables.
4. `V2-CORRECTION-1` — long prose reports arriving duplicated and truncated.

`PKGE-CORRECTION-1` was followed by the V-2 report, so wide tables were not the cause.

**`V2-CORRECTION-1`, binding on future long reports:** deliver long reports in numbered,
independently parseable sections, so a duplicated or truncated span is detectable rather
than silently absorbed by a reader.

---

# 8. What this record does not do

1. It does **not** ratify H-AQ or any hosting target.
2. It does **not** decide E-1, E-2, or E-12.
3. It does **not** draft, number, advance, or ratify ADR-0003.
4. It does **not** authorize Path A, a multi-day test, Package F, authentication
   implementation, CR-1 remediation, Track B, Group 3, DESIGN-001, deployment, public
   ingress, ruleset changes, or durable-persistence implementation.
5. It does **not** weaken, remove, bypass, consolidate, or replace `proxy.ts`,
   `lib/dev-hq/internal-guard.ts`, or `lib/dev-hq/actions.ts`.
6. It introduces **no new architecture recommendation.** It records only findings already
   produced and reconciled.
7. It grants **no implementation authority** beyond the scoped, package-bounded E-11
   model already ratified.

**Preservation is custody, not approval.**
