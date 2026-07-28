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

---

# 9. SUPPLEMENT — V-2 Step 1 Path B attempt, 2026-07-27

Appended after the second V-2 attempt. Sections 0 through 8 stand unchanged. A further
supplement is expected after the corrected Step 1B rerun.

## 9.1 Second verdict

```text
UNABLE TO VERIFY
```

**Accepted without correction.** The attempt executed zero of four required test groups
and zero of four required negative controls. No disposable run, waitpoint, or token was
created.

**Not reinterpreted as partial success:** source inspection, successful `npm ci`,
successful probe compilation and registration at worker version `20260727.1`, CLI
startup, and the incidental sweeper runs are **not** Path B execution. **Path B remains
unexecuted, not failed.**

## 9.2 Exact stop condition

Starting the normal Development CLI **automatically registered and executed the real,
non-disposable `execution-sweeper` task**, which the authorization forbade. The stop
condition was written by the Main Coordinator and fired exactly as intended.

## 9.3 Incidental non-disposable runs created

Three real `execution-sweeper` runs executed in Development, all on worker version
`20260727.1`:

```text
run_06fqap9djhp1c3glmnib4mp001   failed    2026-07-27 21:05:00 UTC   13ms
run_06fqapfldjul56am8evlskdh01   failed    2026-07-27 21:05:51 UTC   13ms
run_06fqapl8prd27d5remgimp8n01   crashed   2026-07-27 21:06:43 UTC
```

The third was in flight when the CLI was force-terminated during shutdown.

**No Dev HQ state was mutated.** Next.js was never started, so the sweeper's single
`fetch` to `/api/dev-hq/internal/execution/reclaim` failed at the transport layer with
`TypeError: fetch failed` before any route was reached. Confirmed against
`trigger/execution-sweeper.ts:20-23`, whose only action is that fetch.

These run IDs are **cloud-side and were not independently re-derived by the Main
Coordinator.** They are recorded because Development run history may be pruned.

## 9.4 Findings V2S1-F1 through V2S1-F6

### V2S1-F1 — Normal CLI startup registers and runs the real sweeper

1. **Status: CONFIRMED.**
2. **Independently verified by the Coordinator:** `trigger.config.ts:5` sets
   `dirs: ["./trigger"]`; `trigger/execution-sweeper.ts:13-17` registers a real
   `schedules.task` with `cron: EXECUTION_SWEEP_CRON` and `ttl: "50s"`; and the complete
   `trigger dev` option surface in the pinned 4.5.7 CLI contains **no task-filter or
   task-exclusion flag** — the options are `--config`, `--project-ref`, `--branch`,
   `--env-file`, `--max-concurrent-runs`, `--debug-otel`, `--skip-update-check`,
   `--keep-tmp-files`, `--analyze`, `--skip-mcp-install`, `--skip-rules-install`,
   `--disable-warnings`, `--skip-platform-notifications`.
3. **Severity: High for testing. NOT an H-AQ defect** — a test-harness authorization gap.
4. **Blocks Step 1 and Path A** in their unisolated form.
5. **One genuine H-AQ operational fact it surfaces:** under H-AQ the Development worker
   runs permanently, so the every-minute sweeper would call the Dev HQ reclaim route
   continuously. That is by design, but it interacts with V2-F5's no-retry posture.

### V2S1-F2 — Suspended runs remain in the watchdog's cancellation payload

1. **Status: CONFIRMED at the Trigger.dev 4.5.7 client layer. Server behaviour UNKNOWN.**
2. **This is NOT a confirmed cancellation defect and must not be described as one.**
3. **Independently verified by the Coordinator in the installed package:**
   - `devWatchdog.js:1-19` — a detached process that "cancels in-flight runs when the dev
     CLI exits", spawned `detached: true, stdio: "ignore", unref()`.
   - `devWatchdog.js:23` — `POLL_INTERVAL_MS = 1000`.
   - `devWatchdog.js:114-122` — `readActiveRuns()` returns `data.runFriendlyIds ?? []`.
   - `devWatchdog.js:123-136` — `callDisconnect()` POSTs to
     `{apiUrl}/engine/v1/dev/disconnect` with `{ runFriendlyIds }`, 10s timeout.
   - `devSupervisor.js:231` — `runFriendlyIds: Array.from(this.runControllers.keys())`.
   - `devSupervisor.js:415-428` — controllers removed **only** in the `onFinished`
     callback.
   - `dev-run-controller.js:273-290` — the `EXECUTING_WITH_WAITPOINTS` branch cleans up
     the task run process and **returns**, with the source comment "no snapshots in DEV,
     so we just return."
   - Coordinator's additional check: every `runFinished()` and `onFinished()` call site
     was enumerated — lines 240, 363, 400, 425, 434, 531, 541, 550, 562, 567, 594, 614,
     632. **None is in the waitpoint branch.**
4. **Therefore, at the client layer:** a Development run suspended at `wait.forToken`
   retains its `DevRunController`, its friendly ID remains in `active-runs.json`, and the
   watchdog would include that suspended run in the disconnect payload on abrupt CLI
   death.
5. **Unknown:** whether the server acts on that ID.
   `POST /engine/v1/dev/disconnect` is not in the local package and cannot be inspected.
   The server may filter by execution status. **Inference in both directions.**
6. **Blocks H-AQ ratification pending empirical resolution.** H-AQ's central premise is
   that a 7-day `wait.forToken` survives worker restarts. This makes the risk posture
   **worse** than Step 0 suggested — Step 0 left open the possibility that suspended runs
   were outside cancellation scope, and the 4.5.7 client source shows the opposite.
   **This is now the highest-value unknown in the V-2 workstream.**

### V2S1-F3 — Graceful and abrupt CLI exit differ materially

1. **Status: CONFIRMED at source.**
2. **Independently verified:** `devSupervisor.js:106-112` registers `#handleSigterm` for
   SIGTERM/SIGINT; `devSupervisor.js:113-125` — `shutdown()` stops all run controllers,
   then calls `#killWatchdog()`, with the verbatim comment **"Kill watchdog on clean
   shutdown — no disconnect needed since runs are stopped locally."**
   `devWatchdog.js:186-193` — the watchdog's signal handler calls `cleanup()` and exits
   **without** calling `callDisconnect()`. `dev-run-controller.js:646-661` — `stop()`
   performs no server-side cancel.
3. **Abrupt termination bypasses all of this**, leaving the detached watchdog to detect
   parent death within about one second and fire the disconnect.
4. **Windows constraint:** `Stop-Process -Force` delivers no catchable signal and
   exercises only the abrupt path. A true graceful test requires a console Ctrl+C event
   delivered to the CLI. The engineer's own shutdown used the force path and is therefore
   **not evidence about graceful semantics** — correctly disclosed.
5. **Severity: Medium, load-bearing for H-AQ.** If confirmed, H-AQ's "stop-then-start
   deployments only" ceases to be operational hygiene and becomes the safety property the
   architecture rests on, which could not be left to convention.
6. **That architecture decision is NOT authorized and is not made here.**

### V2S1-F4 — The 24-hour lifetime bounds the watchdog, not the CLI session

1. **Status: CONFIRMED.** `devWatchdog.js:24-26` verbatim: *"Safety timeout: if the
   watchdog has been running for 24 hours, exit regardless. Prevents zombie watchdogs
   from PID reuse scenarios."*
2. **Severity: Low as a blocker.** No 24-hour cap exists on a `trigger dev` session.
3. **Consequence:** after 24 hours the watchdog self-terminates, so a long-lived CLI
   session loses its abrupt-death cancellation net. Behaviour differs before and after
   that mark.
4. **H-AQ must not be designed to depend on this.** It is a zombie-prevention timer, not
   a guarantee, and it favours H-AQ only incidentally.
5. Source reading only; no 24-hour session was observed.

### V2S1-F5 — `retries.enabledInDev: false` confirmed for application failures

1. **Status: CONFIRMED for the application-error path.** The CLI emitted
   `Error (retrying skipped)` and the run went terminal on the first attempt, consistent
   with `trigger.config.ts:8` which the Coordinator verified.
2. **Severity: Low, confirmatory. Blocks nothing.**
3. **Critical limitation preserved:** this establishes nothing about whether
   **infrastructure recovery** after worker disconnection is separate from task retry
   policy. **The V2-F5 unknown is untouched.**

### V2S1-F6 — CLI and watchdog survive parent-process termination

1. **Status: PARTIALLY CONFIRMED.** The design is confirmed at source —
   `devSupervisor.js:161-175` spawns the watchdog `detached: true`, `stdio: "ignore"`,
   `unref()`. The runtime observation of surviving process IDs is the engineer's
   evidence, **not re-derived by the Coordinator.**
2. **Severity: Informational, operationally important.**
3. **Concrete requirement already earned:** any future H-AQ runbook must target the actual
   CLI process directly and stop the detached watchdog deliberately. **Stopping the npm
   wrapper is insufficient** and would leave orphaned processes with unpredictable
   cancellation behaviour.

## 9.5 Repository preservation — verified

The Step 1 attempt changed nothing tracked. Independently re-derived after the attempt:

```text
branch            feature/dev-hq-operating-system
commit            df72699316cdde04c08206b24e9697cb58d5f35c
tree              67fb8962004b55107cb9f114428c54369d46f5e6
status            (zero porcelain lines)
package.json      2f4d485ca84ee7d01a5527d38b3f83ccc31a63fb   unchanged
package-lock.json 3a74684e30d93c8046ef1379439289d9003d514a   unchanged
trigger/          exactly the five original tracked files
```

The disposable probe was deleted. `node_modules` and `.trigger/tmp` remain and are both
gitignored. Production barriers unmodified.

## 9.6 Report-integrity defects — recorded, not repaired

The Step 1 return arrived with structural defects. **No silent repair was performed.**

1. **Section 9 is missing entirely** — the report jumps from Section 8 to Section 10.
   Section 9 would have been the graceful-restart test.
2. **Section 14 has a heading but no body** — "Stale-token control" is followed directly
   by Section 15.
3. **Section 5 truncated mid-sentence**, losing the Section 6 heading.
4. **Section 6.2 truncated** on a module path.
5. **Section 21 item 2 truncated.**

Because every test was `NOT EXECUTED`, none of these changes a conclusion. Every finding
retained its identifier, severity, evidence citation, and conclusion.

**This is the fifth transmission-integrity failure in this project.** `V2-CORRECTION-1`
was followed, and section numbering is precisely what made the missing Section 9 and the
empty Section 14 detectable. **The rule worked.** The residual problem is truncation
within sections, not detection of omission.

## 9.7 V2-CORRECTION-2 — binding on future reports

1. **No required numbered section may be omitted or left empty.**
2. Where a section has no result, it must explicitly state `NOT EXECUTED`.
3. Joins `PKGC-CORRECTION-1`, `PKGD-CORRECTION-1`, `PKGE-CORRECTION-1`, and
   `V2-CORRECTION-1` as a standing rule.

## 9.8 Corrected rerun method — Option E, Founder-authorized 2026-07-27

Authorized: an untracked alternate Trigger.dev config plus an isolated untracked probe
directory, gated by a mandatory 150-second isolation check before any disposable run.

**Options A, B, C, and D are explicitly NOT authorized**, including as fallbacks. If the
isolation gate fails, the engineer stops and returns to the Founder.

Recorded for the audit trail: **Option A — disabling the Development schedule — was the
Founder's initial preference and does not survive verification.** The Trigger.dev MCP
tool surface available to this project contains no schedule-management capability, so
Option A would require dashboard action outside authorized agent tooling.

**One Option E conflict identified by the Coordinator and carried into the Step 1B
authorization:** neither `trigger-v2-probe/` nor `trigger.v2probe.config.ts` is covered
by `.gitignore`, so both will appear as untracked entries in `git status --porcelain`
during the test window. That is expected and is **not** a stop condition — the stop
condition is a *tracked* modification. The zero-line requirement applies only after
cleanup.

## 9.9 What this supplement does not do

1. Ratifies nothing. Changes no architecture. Grants no implementation authority.
2. Does not authorize Path A, multi-day testing, or any Option other than E.
3. Does not decide H-AQ, E-1, E-2, or E-12.
4. Does not weaken, remove, bypass, or consolidate any production barrier.
5. Does not call V2S1-F2 a confirmed defect.

**Preservation is custody, not approval.**

---

# 10. SUPPLEMENT — V-2 Step 1B, isolated probe. PATH B FAILED

Appended after the Step 1B rerun. Sections 0 through 9 stand unchanged.

**This is the decisive V-2 result.** The isolation method worked, the test executed, and
it produced a disqualifying answer.

## 10.1 Verdict

```text
PATH B FAILED
```

**Accepted by the Main Coordinator without correction.** The Path B question was whether
a Development-environment waitpoint survives abrupt loss of the Development CLI. The test
exercised that question directly and answered it.

**The verdict is not downgraded** for n = 1, for graceful shutdown being untested, for
production being untested, or for the negative controls being unexecuted. Those bound the
result's *scope*; they do not weaken the result *within* its scope. The disqualification
rule in the authorization required stopping once the central premise failed, and stopping
was correct.

## 10.2 Isolation gate — PASSED

1. Baseline captured at T0 = 2026-07-27T21:36:04Z: 13 Development runs over 7 days, most
   recent `execution-sweeper` at 21:06:43.
2. CLI started with the alternate config only. Registered inventory: worker
   `20260727.2` with exactly three tasks, all in `trigger-v2-probe/probe.ts` —
   `v2-probe-waiter`, `v2-probe-completer`, `v2-probe-inspector`. **No task from
   `trigger/` appeared.**
3. Observed 165 seconds, to 21:40:09. Run list re-queried from T0: **0 runs.**
4. Zero new `execution-sweeper`, `founder-request-workflow`, `agent-execution`,
   `agent-review`, `hello-world`, or other non-disposable runs.

**This also resolves the residual uncertainty the Coordinator flagged in §9.8:** the
declarative sweeper schedule registered by worker version `20260727.1` did **not**
continue firing once version `20260727.2` omitted it. At a one-minute cadence, the
165-second window offered two to three firing opportunities and produced none.

## 10.3 The decisive sequence

1. Disposable run `run_06fqb1d5pj0kidda7902lo7501`, task `v2-probe-waiter`, version
   `20260727.2`, attempt 1, created 21:40:27 UTC.
2. Waitpoint `waitpoint_cms3r3ijz17nd0jok8p36mzxm`. `wait.createToken()` span COMPLETED;
   `wait.forToken()` span IN PROGRESS.
3. `.trigger/active-runs.json` read
   `{"parentPid":11988,"runFriendlyIds":["run_06fqb1d5pj0kidda7902lo7501"]}` — **direct
   runtime confirmation that the suspended run remained in the active set.**
4. Process identities: wrapper shell 38680; **actual CLI 11988**; detached watchdog 30860.
5. Only PID 11988 terminated, via `Stop-Process -Force` (no catchable signal), at
   approximately 21:41:33 UTC. **The watchdog was deliberately left alive.**
6. Within about 1.5 seconds the watchdog exited on its own, removing both
   `active-runs.json` and `watchdog.pid` — a clean `cleanup()` on the `onParentDied()`
   path, not a tree kill, which would have left both files.
7. **Original run status: `canceled`.** Finished 21:41:33 UTC, roughly one second after
   the kill. Platform error: `Error: Dev session ended (CLI exited)`. Task span
   CANCELLED, Attempt 1 CANCELLED.
8. CLI restarted with the same alternate config. No new task version — content unchanged,
   still `20260727.2`.
9. **Token completion was ACCEPTED:**
   `{"attempted":"waitpoint_cms3r3ijz17nd0jok8p36mzxm","accepted":true,"response":{"success":true}}`
10. **The original run did not resume.** Still `canceled`, finished 21:41:33, no second
    attempt, no new snapshot, no continuation, no replacement run, no duplicate effect.

## 10.4 Findings V2S1B-F1 through V2S1B-F6

### V2S1B-F1 — Abrupt CLI loss cancels the suspended Development run

1. **Status: CONFIRMED. Severity: CRITICAL.**
2. **Local source chain, independently re-derived by the Coordinator across Step 1 and
   Step 1B:** `dev-run-controller.js:273-290` retains the `DevRunController` during
   `EXECUTING_WITH_WAITPOINTS` and returns without calling `runFinished()`;
   `devSupervisor.js:231` writes `Array.from(this.runControllers.keys())` to
   `active-runs.json`; `devSupervisor.js:415-428` removes controllers only in
   `onFinished`; `devWatchdog.js` survives abrupt parent death, polls at 1000 ms, and
   POSTs the run IDs to `/engine/v1/dev/disconnect`.
3. **Cloud-side confirmation, separate from the source chain and NOT locally
   re-derivable by the Coordinator:** the server actually cancelled the run, with status
   `canceled` and error `Dev session ended (CLI exited)`.
4. **Scope, binding:** Development environment only; abrupt CLI termination only. The
   machinery involved — `devSupervisor`, `devWatchdog`, `/engine/v1/dev/disconnect` —
   exists only in the dev execution path. **This must not be generalized to staging or
   production.**
5. **It falsifies H-AQ's durable-suspension premise as H-AQ is currently defined**,
   because H-AQ places a long-lived Founder approval wait in exactly this environment.

### V2S1B-F2 — Token completion returns success against a cancelled run, with no continuation

1. **Status: CONFIRMED as a Trigger.dev primitive behaviour. Severity: CRITICAL.**
   **This is the most consequential finding in the V-2 workstream.**
2. **Confirmed primitive behaviour (Step 1B runtime):** `wait.completeToken` against the
   token of an already-cancelled run returned `{success: true}` and produced no
   continuation. The caller received a success-shaped result for an action that could no
   longer affect the workflow. **This is a false-success semantic.**
3. **Code-derived application consequence — traced by the Coordinator, NOT executed
   end-to-end.** `lib/dev-hq/founder-request-service.ts:486-489` carries this comment
   verbatim:

```text
  // Complete the token before recording the decision. If this throws, the
  // approval stays pending and the founder can retry; recording first would
  // leave a decided approval whose run never resumes.
```

   **The entire correctness argument of the real approve route rests on
   `wait.completeToken` throwing when the run cannot resume.** Step 1B proved it returns
   success instead. By code trace, `approveFounderRequest` would therefore proceed past
   line 489 to `approvalManager.approve()` at `:493`, record the approval as approved
   with hardcoded Founder identity, log `Evan approved …` at `:502`, and return state —
   while the workflow run stays cancelled and never resumes. **This is precisely the
   outcome the comment was written to prevent.** The guard is real, well-intentioned, and
   rests on a precondition that does not hold.
4. **Untested end-to-end:** the real route was never exercised. The consequence above is
   a code trace, not an observation. **It must not be described as observed
   user-visible behaviour.**
5. **Founder-facing integrity risk: yes, on the code-derived path.** A Founder would see
   an approval marked approved, with a durable timeline event asserting it, while the
   downstream workflow is dead and no finalize occurs. **A silently-accepted approval
   that never continues is worse than an outright failure, because nothing surfaces the
   loss.**
6. **Blocking effect: blocks all approval-UX implementation built on the current
   workflow shape**, pending a replacement design.
7. **Additional tracing required before stating the exact real-route consequence as
   fact:** an end-to-end execution of `POST /api/dev-hq/approvals/[id]/approve` against a
   cancelled run, plus verification of whether the accepted completion actually marked
   the waitpoint completed or was a silent no-op. The Step 1B probe included a
   `v2-probe-inspector` task for that second question, but running it would have been a
   negative control and was correctly forbidden.

### V2S1B-F3 — Client mechanism fully confirmed

1. **Status: CONFIRMED at both source and runtime. No longer inference.** Severity: HIGH.
2. Source: `EXECUTING_WITH_WAITPOINTS` never calls `runFinished()`, so the controller is
   never removed. Runtime: `active-runs.json` contained the suspended run's ID.
3. **This supersedes the Step 1 qualification recorded at §9.4 V2S1-F2**, which held that
   the finding must not be called a confirmed cancellation defect because server
   behaviour was unknown. **Server-side cancellation is now confirmed for the Development
   environment.** No claim is made beyond Development.

### V2S1B-F4 — Suspended Development runs report `executing`, not `WAITING`

1. **Status: CONFIRMED. Severity: LOW — an implementation note, not a Medium defect.**
2. A `status=WAITING` query returned 0 runs while the probe was suspended.
3. **Coordinator's independent check:** no Savrio Dev HQ code filters on Trigger.dev run
   status `WAITING`. A repository-wide search found only `AgentAvailability` values
   (`"available" | "busy" | "offline" | "waiting"` in `types/domain/common.ts:30`) and UI
   tone labels — **a different domain concept entirely, unrelated to Trigger.dev run
   status.**
4. **No current remediation required.** It matters only for future monitoring or
   dashboard logic that might key on Trigger.dev run status, and for whichever
   replacement design is selected.

### V2S1B-F5 — Alternate-config isolation works

1. **Status: CONFIRMED. Severity: favourable finding, recorded as a verified testing
   technique.**
2. Directory-scoped isolation via an untracked alternate config successfully prevented
   every real task and schedule from registering or firing.
3. **This must not be confused with H-AQ viability.** A successful test harness is not a
   successful architecture. The harness worked; the architecture failed.

### V2S1B-F6 — `.trigger` residue after forced watchdog cleanup

1. **Status: CONFIRMED. Severity: LOW / informational.**
2. Forced cleanup left stale `.trigger/active-runs.json` and `.trigger/watchdog.pid`.
   `.trigger` is gitignored; **no repository impact and no reproducibility risk.**

## 10.5 Complete run inventory

Exactly two Development runs were created, **both disposable**:

```text
run_06fqb1d5pj0kidda7902lo7501   v2-probe-waiter      canceled    21:41:33 UTC   v20260727.2
run_06fqb236vqq04csntd3lftrn01   v2-probe-completer   completed   21:43:28 UTC   v20260727.2
```

Waitpoint: `waitpoint_cms3r3ijz17nd0jok8p36mzxm`.

**No non-disposable run executed at any point.** No run was created in Production or
staging. These identifiers are cloud-side and were **not** independently re-derived by
the Coordinator.

## 10.6 Not executed

Under the authorized disqualification rule, the following were correctly **NOT
EXECUTED**: graceful CLI shutdown; version-lock behaviour; TTL-on-resume; and all four
negative controls — wrong token, duplicate completion, stale token, and conflicting
completion.

Recorded incidentally, with no inference drawn: both disposable runs carried a TTL of
10 minutes.

## 10.7 Repository preservation — independently re-derived

```text
branch            feature/dev-hq-operating-system
commit            7f4b5ad31fa6dae48dc704fbc2e7099f55c6b58c
tree              a2d2d2624c2fd0404df758fdf81f632b5a3d2580
parent            df72699316cdde04c08206b24e9697cb58d5f35c
tag               candidate-1f-v2-2 -> 3e17a74a93c0541ec5da4cb852d119ff3c1ebb8f (tag)
package.json      2f4d485ca84ee7d01a5527d38b3f83ccc31a63fb
package-lock.json 3a74684e30d93c8046ef1379439289d9003d514a
status            (zero porcelain lines)
trigger/          exactly the five original tracked files
probe paths       trigger-v2-probe/ ABSENT; trigger.v2probe.config.ts ABSENT
barriers          proxy.ts 728 · internal-guard.ts 1201 · actions.ts 3322
```

**Residual platform state, disclosed rather than concealed:** Development worker version
`20260727.2` still exists on the Trigger.dev platform with the three disposable probe
tasks registered, and is still reported as current. Platform worker versions are
immutable and removing one would require account mutation, which was forbidden. **No dev
worker is connected, so nothing can execute.** The next real `npm run trigger:dev` will
register a superseding version containing the five genuine tasks. No schedule, project,
branch, or environment was created, modified, enabled, or disabled.

## 10.8 Step 0 and Step 1B reconciliation

The Step 0 documented-limits research was completed and delivered to the Founder, with
the determination **`DOCUMENTATION DOES NOT SETTLE H-AQ`**. Reconciled as follows:

1. **Step 0 was correct** that documentation did not settle the question.
2. **Step 0's favourable source inference was provisional** — it suggested runs suspended
   at `wait.forToken` *might* fall outside CLI exit-cancellation scope.
3. **Step 1 source inspection showed the opposite at the client layer:** the suspended
   run remains in the cancellation payload.
4. **Step 1B runtime evidence confirmed server-side cancellation.**
5. **Empirical evidence supersedes the earlier favourable inference.** The provisional
   inference is withdrawn.

This is recorded as the research working correctly: Step 0 declined to settle a question
documentation could not answer, and flagged its own inference as provisional. That is why
the empirical step existed.

## 10.9 H-AQ disposition — Main Coordinator classification

```text
H-AQ: HELD FOR REDESIGN
```

1. H-AQ's central durable-suspension premise **fails** in the Trigger.dev Development
   environment, which is the environment the founder-request approval loop currently runs
   in.
2. The standing risk rule applies: **a critical workflow must not depend solely on
   graceful shutdown if an abrupt host loss, crash, power loss, OS update, or forced
   termination can silently destroy the workflow.** Abrupt loss is exactly what was
   tested, and it destroyed the workflow silently.
3. `STILL VIABLE WITH GRACEFUL-SHUTDOWN QUALIFICATION` is **not** selected. Graceful-only
   operation may not be treated as sufficient durability unless the Architecture Reviewer
   independently supports it **and** the Founder explicitly accepts the residual risk.
   Neither has occurred.
4. `REJECTED AS WRITTEN` is **not** selected either, because the deployed-environment
   question is genuinely untested and a replacement may retain parts of H-AQ's shape.
5. **This classification is the Main Coordinator's, not an architecture decision.** It
   records that revision is required and routes the question to Architecture Review. It
   ratifies nothing and selects no replacement.

## 10.10 Transmission-integrity assessment of the Step 1B report

**Materially clean — the best-transmitted report in this workstream.** All 25 required
sections present, none omitted, none empty. `NOT EXECUTED` correctly used for sections 11
through 17. `V2-CORRECTION-2` was followed.

One duplication defect, non-substantive: §23 repeats three preservation lines
(`git rev-parse 'HEAD^{tree}'`, `HEAD:package.json`, `HEAD:package-lock.json`). The
repeated values are identical and correct, and the Coordinator independently re-derived
all of them. **No conclusion is affected. Not silently repaired.**

## 10.11 What this supplement does not do

1. Ratifies nothing. Selects no replacement architecture.
2. Does not draft or ratify ADR-0003 beyond recording that revision is required.
3. Does not decide E-1, E-2, or E-12.
4. Does not authorize Path A, further Path B tests, or multi-day testing.
5. Does not extend any finding to staging or production.
6. Does not weaken, remove, bypass, or consolidate any production barrier.
7. **Path A remains BLOCKED.**

**Preservation is custody, not approval.**

---

# 11. H-AQ REPLACEMENT ARCHITECTURE REVIEW AND FOUNDER DECISIONS, 2026-07-27

Sections 0 through 10 stand unchanged.

**This section contains three distinct classes of content and the distinction is
binding.** §11.2 is **Architecture Reviewer advisory recommendation** — it ratifies
nothing. §11.3 is **Main Coordinator reconciliation** — verification and correction, also
not ratification. §11.4 is **Founder-ratified decisions A1, B1, C1, and D1** — these and
only these are decided. §11.7 lists what remains unauthorized.

## 11.1 Provenance and integrity

The Architecture Review was produced in a separate tab by an independent Claude
Architecture Reviewer, read-only and advisory, at anchor commit
`1469467a8d6fb75ce5a16febb2785dd067417b28`, tree
`8725a0fc2655cb03049c0c8b64bb6a20563e50f2`. It made no repository change.

**Transmission defects — the sixth occurrence in this project. Recorded, not repaired.**

1. The report arrived **duplicated**: sections 1 through 3 appear twice, once as a
   truncated leading fragment and once in full. The full rendering was reconciled.
2. **A block of the Coordinator's own dispatch prompt was spliced into the middle of the
   transmission** between the fragments — transmission bleed, not reviewer content.
3. Mid-word truncations in the leading fragment, including the CSPRNG reference and the
   ancestry check.
4. Truncations inside the full rendering: §12.1, §14, §16's opening line, §18 items 3-4,
   §20's consequence list items 2 and 3, §22's opening, §23's heading, §25 items 4 and 15.
5. §16 lost its heading text.

**No defect changed a conclusion.** All 26 sections were present, none empty, every
verdict and evidence citation survived, and no contradiction was found between sections.

**The reviewer remained within read-only advisory authority** — no `Write` or `Edit`, no
worktree, anchor read via `git show`, no ADR authored or numbered, no implementation
authorized, no barrier change proposed, no Founder-reserved question decided. It
disclosed its own working-directory deviation unprompted, and it **explicitly declined**
to provide the support that would have been a precondition for reauthorizing the
graceful-shutdown test as a route to rescuing H-AQ.

## 11.2 Architecture Reviewer recommendations — ADVISORY, not ratified

1. **Preferred: R3** — eliminate long-lived Trigger.dev token suspension by splitting the
   Founder-request workflow at the approval boundary.
2. **Runner-up: R2** — durable database-backed approval state with resumable
   orchestration. The expected later durability destination.
3. **R1** — deployed worker with a secure callback plane. Not the immediate replacement;
   may later form part of the hosting solution after E-1, E-6, and E-12.
4. **R4** — managed durable queue or workflow engine. Not reached; disproportionate at
   this scale.
5. **R5** — graceful-only Development operation. **Rejected.** The reviewer declined to
   support it, on the grounds that the failure it asks the Founder to accept is
   undetectable by the Founder, that its favourable half is untested, and that its safety
   property changes at an undocumented 24-hour watchdog boundary.
6. **Core analysis:** the defect is **misplaced continuation authority**, not durability.
   The waitpoint holds all continuation authority; the approval record holds all
   Founder-facing meaning; neither can repair the other.
7. **Package decomposition:** P-1 characterization, P-2 split-run redesign, P-3
   process-start marker, P-4 continuation reconciliation, P-5 provenance repair.
8. **E-3 disposition:** remains valid, should be narrowed, must not be superseded.
9. **Sprint 1F:** may continue around this work with a boundary.

## 11.3 Main Coordinator reconciliation — verification and corrections, not ratification

**Every locally verifiable claim in the Architecture Review was independently re-derived
and checked out. No error was found.** Verified: the anchor; production barriers at 728,
1201, and 3322 bytes (22, 40, and 87 lines — the reviewer's byte-versus-line
clarification is correct, and earlier records carry byte counts unlabelled); the
five-site `wait.*` inventory; the single nullable `triggerRunId` at
`types/domain/founder-request-workflow.ts:30` written twice per execution; `WorkflowRunPatch`
permitting `triggerRunId` overwrite; the `tasks.trigger` pattern at `:128-134`; the
`ApprovalManager` contract; `decidePendingApproval`'s documented convergence semantics;
the absent process-start marker; 13 contract files; and the existence of
`lib/dev-hq/review-scope.test.ts`.

**Five Coordinator corrections and additions to the advisory:**

1. **`attachWaitToken` becomes dead contract surface under R3.** Its only purpose is
   binding a waitpoint to an approval. The review did not enumerate this contract
   deletion; it belongs in P-2's scope.
2. **`decidePendingApproval` points the wrong way for R3.** It converges *approval →
   workflow already advanced*. R3 needs the inverse. The primitive is reusable in shape,
   but its semantics and source comment must be re-derived, not carried forward.
3. **The E-3 change is an AMENDMENT, not a narrowing.** See §11.4.2.
4. **The three-state false-success contract is insufficient — but a fourth state is the
   wrong fix.** See §11.4.3.
5. **P-3 may run in parallel with P-2**, correcting the review's sequencing. The marker is
   a process-lifetime identifier on the state snapshot; its content does not depend on
   R3. **And P-5 must be split** — see §11.4.4.

## 11.4 FOUNDER-RATIFIED DECISIONS — 2026-07-27

### 11.4.1 Decision A1 — RATIFIED. Replacement direction

**R3 is the selected replacement direction:** eliminate the long-lived Trigger.dev token
suspension by splitting the Founder-request workflow at the approval boundary.

**This establishes direction only.** It does not authorize P-2 implementation, ADR
drafting, deployment, persistence, authentication work, or hosting changes.

Recorded alongside it:

1. R3 is the selected replacement direction.
2. R2 is the expected later durability destination.
3. R1 remains a later hosting option after E-1, E-6, and E-12 are resolved.
4. R4 and R5 are **not selected**.
5. **H-AQ remains HELD FOR REDESIGN and is not ratified.**

### 11.4.2 Decision B1 — RATIFIED. E-3 amendment

E-3 (P-A) **remains in force unchanged as to persistence posture:**

1. Sprint 1F Dev HQ state remains explicitly non-durable and in-memory.
2. Mission Control is not a durable system of record.
3. Audit and idempotency guarantees are bounded by the current process lifetime.
4. A mandatory server-supplied process-start marker must distinguish restart-cleared
   state from genuinely empty state.

**The following continuation-authority constraint is ADDED:**

> P-A governs process-lifetime operational state and read-model guarantees.
>
> No workflow may place its sole continuation authority in P-A state, and no workflow may
> leave durable external work suspended in a condition that only P-A state can resolve.
>
> A workflow must instead either **own its continuation authority durably**, or **hold no
> resumable durable obligation while awaiting P-A state**.

**This is an AMENDMENT — not a clarification and not a supersession.** It adds a
constraint on workflow design that E-3 did not previously contain. Classifying it as a
clarification would let a genuinely new constraint enter the corpus without a
ratification event.

**Rationale:** the current Founder-request workflow violates the added constraint. It
suspends a durable Trigger.dev run whose only resumption path runs through an approval
record held in non-durable P-A state. Losing that state strands a live durable obligation
P-A cannot discharge.

**It selects no specific implementation and grants no implementation authority beyond
Decision D1.**

### 11.4.3 The two-field decision and continuation contract

Ratified as part of the direction. The three-state proposal conflated two orthogonal
dimensions; **approval state and continuation state are separate fields.**

```text
Principle: "success" means the workflow advanced. It never means a provider
call returned without throwing.

FIELD 1 — decision (what the Founder decided)
  pending | approved | rejected | escalated

FIELD 2 — continuation (whether the workflow advanced)
  not_attempted   no decision recorded; nothing was started
  confirmed       continuation run confirmed started
  unconfirmed     decision recorded; continuation not confirmed.
                  Visible, retryable, reconcilable.
                  MUST NOT render as a completed approval.
  failed          continuation attempt returned a typed failure.
                  Distinct from unconfirmed: we know, rather than not knowing.

ONLY decision != pending AND continuation == confirmed may render as a
completed approval.

Ordering: record the decision in the current process-lifetime authority
first, then attempt the continuation, then record the continuation outcome.

Silence is prohibited. A decision that could not take effect must surface to
the Founder without the Founder going looking.

Provider success shapes are unconfirmed until independently observed.
```

**Phrasing constraint, binding:** the contract says **"recorded in the current
process-lifetime authority"**, never "durably recorded". Under P-A nothing is durable,
and asserting otherwise would claim a property the ratified posture explicitly denies.

### 11.4.4 Package decomposition as ratified in direction

1. **P-1** — characterization and negative-control tests. **Authorized by D1.**
2. **P-2** — split-run approval-continuation redesign. One package; **do not split**,
   because the contract changes are genuinely coupled. **Must include the `unconfirmed`
   state and its visibility** — shipping P-2 without it would ship a state nothing
   surfaces. **Must include the timeline-truthfulness fix** (see below).
3. **P-3** — E-3 process-start marker. **May run in PARALLEL with P-2.**
   **Correctness-critical under R3, not merely disclosure:** R3 makes store loss the
   correct and total failure mode for pending approvals, so without the marker the UI
   cannot distinguish "no approvals pending" from "your approval queue was destroyed."
   Belongs to the **Dev HQ state contract**, not to Mission Control read models.
   Discharges the unassigned E-3 obligation recorded at V2-F8.
4. **P-4** — continuation reconciliation. Separate package, depends on **P-2 only**. The
   `unconfirmed` **state** belongs in P-2; **P-4 adds the sweep that resolves it.**
5. **P-5 — SPLIT.** The single-package framing is corrected:
   - **P-5a, timeline truthfulness — MOVED INTO P-2.** The message strings at
     `founder-request-service.ts:502` and `:541` assert a completed effect. P-2 creates a
     state where that assertion can be false. **P-2 must change what the event asserts.**
   - **P-5b, identity remediation — REMAINS BLOCKED on E-6.** Hardcoded `decidedByUserId`
     (`:495`, `:534`) and hardcoded `actorId` / `actorLabel` (`:503-504`, `:542-543`).
   - The distinction: **"who acted" is blocked because there is no way to know. "What
     happened" is not blocked — we know, and we can stop asserting otherwise.** A
     misleading timeline string does not survive because a different defect is blocked.

### 11.4.5 Decision C1 — RATIFIED. Sprint 1F sequencing

Sprint 1F **continues around** the approval redesign, with the boundary in §11.5. **The
Main Coordinator must enforce this boundary before dispatching any package.**

### 11.4.6 Decision D1 — RATIFIED. First implementation authorization

**P-1 only.** Test-only characterization and negative-control package.

**P-1 may:** add a failing characterization test for the current false-success path; pin
the current five-site wait-token inventory; pin the current approve-path ordering; pin
the current single-field `triggerRunId` lineage limitation; add type-level
duplicate-decision and lineage characterization.

**P-1 may not:** change production behaviour; modify workflow or domain contracts; remove
wait-token code; add continuation tasks; implement R3; modify routes; change barriers,
authentication, or persistence; or begin P-2 through P-5.

**If any source change is required merely to make the characterization observable, P-1
stops and returns for reauthorization.** Codex independent review is not required for P-1
while it remains test-only.

## 11.5 Ratified Sprint 1F continuation boundary

**MUST PAUSE:**

1. Approval UX built on the current suspended-token workflow.
2. Any panel, contract, or view model assuming token completion means continuation.
3. Work encoding the current approve-then-record ordering at
   `founder-request-service.ts:486-496`.
4. Approval-outcome portions of DESIGN-001 that P-2 would rewrite — **DA-4's
   `UNCONFIRMED` treatment and DA-7's capability-absent rendering cross this line.**
5. **Group 3's approve, reject, and escalation idempotency items** — they touch exactly
   the routes P-2 rewrites. They must fold into P-2 or defer. Group 3's `approval-gate`
   binding and dispatch-boundary `idempotencyKey` items do **not** cross.
6. Any work whose correctness depends on the current wait-token architecture.

**MAY CONTINUE:** test infrastructure and the deferred PKG-2 findings M-1 through M-4; CI
enforcement; governance, custody, and documentation; unrelated Mission Control panels;
Sprint 1E carried obligations not touching approval continuation; Package D and E
follow-ups independent of P-2; **CR-1 and SEC-6 on their separate track when otherwise
authorized** — verified as not crossing, and still a pre-deployment blocker in its own
right.

**FD-26's phone-action inventory is approval-adjacent** and should be reviewed against
the §11.4.3 contract before it is finalised.

## 11.6 Evidence limitations carried forward

1. Deployed-environment durability is **untested**. Every Step 1B finding is
   Development-only and must not be generalized.
2. Whether the accepted completion actually marked the waitpoint completed or was a
   silent no-op is **unknown**, and is the one open item that could change a design
   decision if any token wait is retained.
3. Whether `tasks.trigger` accepts an idempotency key with the semantics R3 needs is
   **unverified** — the call site at `:128-132` passes no options.
4. Whether infrastructure recovery is separate from task retry policy (V2-F5) remains
   **open**.
5. `SEC-1` through `SEC-14` were **not read** by the Architecture Reviewer. No
   recommendation is reconciled against them, and no ADR may claim otherwise on this
   review's account.
6. Trigger.dev SDK internals under `node_modules` were **reproduced, not re-derived**, by
   both the reviewer and the Coordinator.
7. `execution-sweeper` has **never been observed to execute** in this project (V2-F9), so
   the pattern P-4 would reuse is proven in design only.
8. The R3 structural claim is sound; **the claim that the resulting system behaves
   correctly end-to-end is a prediction.** P-1's negative control exists to make that
   prediction falsifiable before it is trusted.

## 11.7 What remains unauthorized

P-2, P-3, P-4, and P-5 implementation · ADR drafting or ratification beyond the E-3
amendment ratified above · Path A · further Path B tests · multi-day testing ·
authentication implementation · durable persistence · deployment · public ingress ·
production-barrier changes · ruleset changes · Trigger.dev provider contact · and
decisions E-1, E-2, E-6 through E-10, and E-12.

**Production barriers unchanged and verified:** `proxy.ts`, `lib/dev-hq/internal-guard.ts`,
`lib/dev-hq/actions.ts`.

**Advisory recommendations in §11.2 are not ratified except where §11.4 explicitly
ratifies them.**

---

# 12. PACKAGE P-1 — APPROVAL CHARACTERIZATION TESTS. COMPLETE

Sections 0 through 11 stand unchanged. **P-1 is the first implementation package
executed under the E-11 package-scoped authority model and Founder Decision D1.**

## 12.1 Status

```text
P-1 COMPLETE
```

Test-only. **No production behaviour changed, no contract changed, no barrier touched.**
Delivered in two passes: an initial delivery, then one narrowly scoped correction to the
failing-test representation.

## 12.2 The six additions

```text
lib/dev-hq/founder-request-terminal-run.test.ts        D-1  negative control + characterization
lib/dev-hq/wait-token-inventory.test.ts                D-2  structural wait inventory
lib/dev-hq/approve-path-ordering.test.ts               D-3  approve-path ordering
lib/dev-hq/trigger-run-lineage.test.ts                 D-4  triggerRunId lineage limitation
lib/dev-hq/duplicate-decision-lineage.types.test.ts    D-5  type-level characterization
test/fixtures/trigger-platform.ts                      test-only platform fixture
```

**Six additions. No seventh file.**

## 12.3 The executed false-success behaviour

**This is the first execution of a code trace that had only ever been argued by reading.**
It confirms the trace. Recorded by the passing characterization test in D-1, against the
real service path with real adapters and a real store:

1. `wait.completeToken` is called once against a run whose status at call time is
   `cancelled`, and returns `{ success: true }` — **the false-success semantic**.
2. **No continuation is produced.** The run remains `cancelled`.
3. The approval nonetheless reads `approved`, with non-null `decidedAt` and
   non-null `decidedByUserId`.
4. A timeline event asserts a completed approval: type `approval.approved`, message
   exactly `` `Evan approved ${approval.title}.` ``, actor label `Evan`.
5. **No finalization occurs.** Run stage remains `founder_approval_required`, run
   `decision` is null, the execution is still running with a null `completedAt`, and
   neither `workflow.completed` nor `founder_request.approved` events exist.

## 12.4 The future-correct P2_TARGET invariant

Test name: `P2_TARGET: renders no completed approval while the workflow has not advanced`.

It establishes its premise **before** drawing its conclusion — first that the workflow did
not advance (`platform.continuations` empty, run still `cancelled`), then that nothing
renders as a completed approval: approval status not `approved`, `decidedAt` null,
`decidedByUserId` null, no `approval.approved` event, run `decision` not `approved`, run
`stage` not `completed`.

**Design-neutral by construction.** It calls
`await approveFounderRequest(approval.id).catch(() => undefined)`, so it does not
presuppose whether P-2 refuses by throwing or by returning a non-success state. **P-1
asserts the invariant and leaves the mechanism to P-2.**

Before the correction, the target failed with
`AssertionError: expected 'approved' not to be 'approved'` on the rendering invariant, not
on the setup — independently confirmed by the Coordinator by execution.

## 12.5 The `it.fails` representation, and why T3 was selected

The target is marked `it.fails(...)`. The wrapper is the **only** change made in the
correction pass; every assertion, its order, and the design-neutral `.catch` are
byte-identical to the original delivery.

**The rule this creates:** a `.fails` test that fails is reported as an *expected fail* and
the suite stays green. **A `.fails` test that unexpectedly PASSES throws
`Error: Expect test to fail` and turns the suite RED.** The Coordinator verified both
halves directly against the installed Vitest 4.1.10 with a throwaway probe, then deleted
it.

**Consequence, and the reason this representation was chosen:** when P-2 lands correctly,
this test will pass, the suite will go red, and the conversion from `it.fails` back to
`it` becomes a **forced, deliberate, reviewed step** rather than something that can be
forgotten.

Why the alternatives were rejected:

1. **T1, commit an actively failing test — rejected.** The required check
   `Unit and Static Validation` runs `npx vitest run --project node`,
   `npx vitest run --project dom`, **and** `npm test`, all unconditionally. A red default
   suite would turn a required check red on the protected branch until P-2 landed, and
   once red is normal a real regression becomes invisible.
2. **T2, `skip` or `todo` — rejected.** Keeps the branch green and the target named, but
   **the test does not execute**, so an early unexpected pass would be invisible.
3. **T4, a separate characterization project or command — rejected.** Would require
   changes to `vitest.config.ts` or `package.json` scripts. **Both are production
   configuration and outside P-1's test-only authority.**
4. **T3, `it.fails` — selected.** The test executes; the suite stays green; an unexpected
   pass is loud; no production file, config, or script changes.

**The gap that made the correction necessary was in the Coordinator's P-1 prompt**, which
asked for a test that "MUST FAIL at this commit" without specifying how to represent that
without breaking CI. The engineer delivered what was asked and flagged the problem itself.

## 12.6 Final validation

```text
npx tsc --noEmit                exit 0
npx eslint .                    exit 0
npx vitest run --project node   exit 0   27 files | 354 passed | 1 expected fail (355)
npx vitest run --project dom    exit 0    1 file  |   3 passed (3)
npm test                        exit 0   28 files | 357 passed | 1 expected fail (358)
npx next build                  exit 0
npx playwright test             exit 0    1 passed
```

Baseline before P-1 was 23 files / 339 tests. **19 tests added across 5 files** — D-1: 2,
D-2: 6, D-3: 4, D-4: 3, D-5: 4. **Zero ordinary failures. Exactly one expected fail. No
pre-existing test changed status.** Independently re-run by the Coordinator: `npm test`
exits 0 with `357 passed | 1 expected fail (358)`.

## 12.7 The five-site wait inventory, pinned

D-2 pins exactly three `wait.completeToken` sites (all in
`lib/dev-hq/founder-request-service.ts`), one `wait.createToken`, and one `wait.forToken`
(both in `trigger/founder-request-workflow.ts`), and asserts the total is five and the
method set is exactly those three — so **a newly introduced wait primitive also fails the
test**.

**It cannot pass vacuously:** an anti-vacuity test asserts the scan reached more than ten
files and includes both wait-bearing files, and that no scanned path is a test file.
`.test.ts(x)` and `.d.ts` are excluded, so **the inventory cannot count its own literals**.

**Line-location snapshots are kept in a separate test from the count invariants**, so a
benign line shift is diagnosable as distinct from an added or removed call site. **P-2
must update the snapshot and must not weaken the count invariants to avoid doing so.**

## 12.8 Approve-path ordering

D-3 pins that `wait.completeToken` is called **before** `approvalManager.approve`, both
behaviourally by call log and by source pin over `founder-request-service.ts:486-496`
including the rationale comment.

Two further tests make the **boundary of that comment's correctness argument executable**:
when completion throws, the approval correctly stays pending; **when completion returns a
non-throwing `{ success: true }`, the approval is recorded regardless.** The ordering
protects only against a throw, and the platform does not throw.

## 12.9 The two-record `triggerRunId` limitation — corrected wording

**Binding wording, correcting an earlier imprecise Coordinator phrasing:**

> The id is written onto **two separate single-valued fields on two different records** —
> `Execution.triggerRunId` via `markExecutionRunning`, and `WorkflowRunRecord.triggerRunId`
> via `updateRun`. It is **not** written twice onto one field.

Both are `string | null`. `WorkflowRunPatch = Partial<Omit<WorkflowRunRecord,
"executionId" | "updatedAt">>` permits `triggerRunId`, so a later write **succeeds
silently and the prior id is unrecoverable**. No timeline event mentions either run id, so
the Founder cannot observe that an earlier run existed.

**A lineage model must address both records, not just `WorkflowRunRecord`.**

## 12.10 Type-level limitations, and what they are not

D-5 establishes, with assertions proven non-vacuous by a deliberate-false probe
(`TS2344`) and a deliberate-unnecessary `@ts-expect-error` (`TS2578`), both since deleted:

1. **Duplicate decisions are type-indistinguishable** — both `approveFounderRequest` and
   `rejectFounderRequest` resolve to exactly `DevHqState`, the whole read model, saying
   nothing about what the call did.
2. **No outcome discriminant exists** — `Extract<ApproveResult, { kind: unknown }>` is
   `never`.
3. **No ordered lineage exists** — `triggerRunId` is exactly `string | null`; there is no
   `runLineage` or `runAttempts` key.
4. **No replay representation exists** — `Approval` has no `decisionCount`,
   `appliedToRunId`, or `idempotencyKey`.

**The test-local types `DecisionApplication`, `RunAttempt`, `RunLineage`, and
`LineageBearingRun` are CHARACTERIZATION ONLY.** They are declared inside the test file,
exported to nothing, and exist solely to prove what today's types cannot express. **They
are not an approved P-2 design and must not be treated as one.**

## 12.11 Findings assigned to later packages

Recorded by the engineer, disposition set by the Coordinator. **None was added to P-1** —
characterizing a second instance of an already-characterized defect buys nothing.

1. **`rejectFounderRequest` (`:528`) — ABSORB INTO P-2.** Structurally identical to the
   approve path: same ordering, same rationale comment, same false-success exposure.
2. **`replayDecisionToken` (`:463-468`) — ABSORB INTO P-2.** A third `completeToken` site,
   reached when an approval is already decided, returning the read model unconditionally.
3. **All three `completeToken` return values are discarded — ABSORB INTO P-2.** Nothing in
   the current code inspects `success`, so **even a truthful platform signal would be
   dropped.** This directly informs the `confirmed` versus `unconfirmed` distinction.
4. **Inverse convergence — PRESERVE FOR P-2, EXECUTE IN P-4.** The comment at `:349-352`
   anticipates *token completed, decision not recorded*. The defect is the mirror case —
   *decision recorded, token completed, run never resumed* — which that convergence
   **cannot reach because it never runs.** P-2 inverts the direction; P-4's sweep executes
   it.
5. **Both `Execution` and `WorkflowRunRecord` need lineage — ABSORB INTO P-2.**
6. **`registerApprovalGate` (`:292-294`) silently retains the first token when a different
   one arrives — ABSORB INTO P-2.** Under R3 its premise disappears with
   `attachWaitToken`.
7. **The D-2 line-location snapshot will need updating when P-2 edits either file —
   ABSORB INTO P-2**, with the count invariants preserved.

## 12.12 Procedural disclosures — recorded, not concealed

1. **Accidental external write, original P-1 pass.** An errant tool call wrote a
   one-line placeholder into the user's Documents folder, **outside the repository**. The
   engineer **disclosed it unprompted**, deleted it, and confirmed absence. **No
   repository effect**; it appears in no preservation proof. The Coordinator accepts the
   disclosure and records that it could not independently re-verify deletion without
   reading a directory outside scope. **Classified: procedural, disclosed, corrected.**
2. **Worktree clarification, correction pass.** The engineer's primary session directory
   was `savrio-dev-hq` at `fbe4eb6d` on the validation branch, which does **not** contain
   the P-1 additions. The engineer enumerated `git worktree list` and **identified the
   correct worktree by matching all four content anchors rather than by name**, then ran
   every command in `savrio-advance-1f`. **This is a disclosed environment detail handled
   correctly, not a procedural defect.** The engineer's suggestion is adopted: **future
   prompts state the worktree path explicitly**, since eleven worktrees are currently
   registered.
3. **Two unprompted self-corrections during the original pass:** the engineer removed an
   eslint warning it had introduced rather than leaving it, and **proved its own type
   assertions were non-vacuous** before relying on them.

## 12.13 Transmission-integrity defects — seventh and eighth occurrences

**Original P-1 return:** duplicated sections 1 through 3; tool-transcript bleed spliced
between the fragments; §3 truncated; §5's heading missing; truncations in §5, §7, §11,
§14, and §17.

**Correction return:** duplicated sections 1 through 2; tool-transcript bleed; truncations
in §1, §2, §5, §8, and §9; §4's heading missing.

**No defect changed a conclusion in either return.** Every deliverable, count, verdict, and
disclosure survived and was independently confirmed against the repository. **Not
repaired.**

## 12.14 What P-1 does not do

1. Changes **no** production behaviour, source, contract, route, workflow, config,
   dependency, script, or ruleset.
2. Does **not** implement, design, or presuppose R3.
3. Does **not** authorize P-2, P-3, P-4, or P-5.
4. Does **not** decide E-1, E-2, E-6 through E-10, or E-12.
5. Does **not** weaken, remove, bypass, or consolidate any production barrier.

**Independent Codex review was not required and was not sought**, because P-1 remained
test-only throughout and its scope never expanded.

# 13. PACKAGE P-2 — APPROVAL CONTINUATION REDESIGN. INTEGRATED

Sections 0 through 12 stand unchanged. **P-2 is the first implementation package to pass
through a full reject-remediate-re-review-integrate cycle under the E-11 package-scoped
authority model.**

This record carries the fourteen requirements defined by the Founder-accepted integration
authorization packet. **Requirements 1 through 12 record evidence that already existed
against immutable objects before integration. Requirements 13 and 14 record execution-time
evidence, written only from exact observed output.** The three evidence categories —
pre-integration candidate review, post-integration local validation, and remote CI — are
kept separate throughout and are never blended.

## 13.1 Requirement 1 — the rejected candidate and the confirmed MEDIUM finding

`candidate-1f-p2-1` was independently reviewed by Codex and **REJECTED**.

Rejected candidate identity, recorded in full:

- Annotated tag: `candidate-1f-p2-1`
- Tag object: `e2508d4ab5a8e24778ce97d81666c60ce83f66ee`
- Commit: `b68211e49ba6c8b8c6cefc18b1870783e411cd5a`
- Tree: `566c1016af5e2d645db601181d518385b838f5a3`
- Parent: `f210fb7c5ccfbbc76b664360900cccdc4ab2a965`

**This candidate and its annotated tag are permanent review evidence. They must never be
moved, deleted, amended, recreated, or retagged.**

The confirmed MEDIUM finding, stated in full: a continuation that started successfully and
later exhausted its retries left a stale, misleading, and unrecoverable approval. The
observed end state was approval status `pending`, approval decision `approved`, approval
continuation `confirmed`, workflow stage `failed`, and a second same-decision approve call
starting no new continuation. The Founder queue listed the approval, rendered it
non-actionable, and displayed guidance falsely stating that the workflow had never opened
the approval gate.

The five affected paths:

1. `trigger/founder-request-continuation.ts:45-52`
2. `lib/dev-hq/founder-request-service.ts:488-512`
3. `lib/dev-hq/founder-request-service.ts:668-673`
4. `lib/mission-control/view-model.ts:483-494`
5. `components/mission-control/ApprovalQueuePanel.tsx:118-119`

## 13.2 Requirement 2 — Coordinator independent confirmation

The Main Coordinator independently read all five paths in the immutable candidate and
confirmed each one. **The Coordinator additionally established a fact the review had
understated: `failWorkflowExecution` did not merely omit the Founder's recorded decision —
it ACTIVELY OVERWROTE it with `null`.** The audit record was therefore contradicted, not
merely incomplete: the run asserted that no decision had been made while the timeline
asserted that the Founder had decided.

## 13.3 Requirement 3 — remediation candidate identity

- Annotated tag: `candidate-1f-p2-2`
- Tag object: `697c0f9b9a0542851c9c09a49ba0d75b57010bd4`
- Commit: `55c6db79778e5c4c1d2a627828de136e43bac4fd`
- Tree: `030eab3157b08a3de0ea0bc64142c2ac829bca78`
- Parent: `b68211e49ba6c8b8c6cefc18b1870783e411cd5a`
- Branch: `impl/p2-approval-continuation`

This was the candidate identity as frozen and reviewed. Its integration is recorded
separately, under Requirement 13, from exact observed output.

## 13.4 Requirement 4 — remediation diff and full anchor diff

Remediation diff relative to `candidate-1f-p2-1`: **7 files changed, 579 insertions,
38 deletions**, with the per-file counts —

1. `app/api/dev-hq/internal/fail/route.ts` — 13 insertions, 0 deletions
2. `components/mission-control/ApprovalQueuePanel.tsx` — 74 insertions, 23 deletions
3. `lib/dev-hq/continuation-terminal-failure.test.ts` — 378 insertions, 0 deletions, added
4. `lib/dev-hq/founder-request-service.ts` — 105 insertions, 13 deletions
5. `lib/mission-control/view-model.ts` — 6 insertions, 1 deletion
6. `trigger/founder-request-continuation.ts` — 2 insertions, 0 deletions
7. `types/domain/founder-request-workflow.ts` — 1 insertion, 1 deletion, documentation
   comment only

Full diff from the anchor `f210fb7c5ccfbbc76b664360900cccdc4ab2a965`: **28 files changed,
2366 insertions, 501 deletions.**

## 13.5 Requirement 5 — how the finding was closed, and the authoritative retry rule

The finding was closed at each of the five paths:

1. `trigger/founder-request-continuation.ts` — the real Trigger.dev `onFailure` hook now
   supplies the approval id and the decision. **This two-line change is what made the
   entire service-side correction reachable.**
2. `lib/dev-hq/founder-request-service.ts` — the terminal-failure path preserves the
   Founder's recorded decision instead of overwriting it with `null`, and records a
   truthful continuation detail stating that the continuation started, exhausted its
   retries, failed, and may be retried with the same decision.
3. `lib/dev-hq/founder-request-service.ts` — the retry-eligibility branch permits a
   same-decision retry once the run stage is `failed`, and refuses a conflicting decision
   before reaching it.
4. `lib/mission-control/view-model.ts` — a decided, started, later-failed approval is
   actionable, so the false branch is unreachable.
5. `components/mission-control/ApprovalQueuePanel.tsx` — the approval renders as "Retry
   required" with an explicit explanation, and the false "the workflow has not opened the
   approval gate" message is unreachable for that state.

**The correction stayed inside the ratified contract.** The four continuation values remain
exactly `not_attempted`, `confirmed`, `unconfirmed`, and `failed`.

**The authoritative retry behavior is UNBOUNDED SAME-DECISION RETRY:** one new idempotency
generation opens after each observed terminal failure, no duplicate dispatch occurs while a
retry is confirmed active, and conflicting decisions remain prohibited at every generation.

**The implementation report described this as "one same-decision retry." That description
is WRONG and must not be repeated.** The independent reviewer established the actual rule
by reading the implementation and testing it.

## 13.6 Requirement 6 — custody disclosure. CLOSED

Roughly 199 insertions and 38 deletions in `candidate-1f-p2-2` were inherited from a prior
P-2 session whose report was never received. The replacement engineer **disclosed this
unprompted**, identified three defects in the inherited work — the real Trigger.dev
failure hook did not pass the approval id or the decision, there was no
finalization-after-retry coverage, and the test harness routed all callbacks to the failure
route — and corrected them.

The whole candidate was subsequently reviewed as unattributed work by an independent
reviewer that was instructed not to assume any line was backed by engineer reasoning.
**THIS ITEM IS CLOSED by that review.**

## 13.7 Requirement 7 — independent re-review verdict and validation counts

Verdict: **APPROVE WITH FINDINGS.**

The reviewer explicitly stated that it did not author the candidate and was not the
implementation session. It used a clean detached worktree for review and a **separate
non-worktree extracted copy** for mutation probes, so no ref-sharing worktree was mutated.

Its validation counts: 31 test files and 383 tests passing with 0 failures; lint 0 errors
and 0 warnings; typecheck with the incremental-false form reporting 0 type errors;
production build compiling successfully with 18 static pages generated; 1 Chromium
end-to-end test passing.

**This is pre-integration candidate-review evidence, produced against the unchanged exact
candidate `55c6db79778e5c4c1d2a627828de136e43bac4fd`.** It is distinct from the
post-integration local validation evidence recorded in Requirement 14, and from remote CI,
which was not rerun because no push was authorized.

## 13.8 Requirement 8 — empirical retry-generation evidence

The reviewer executed two consecutive terminal failure-and-retry cycles against the
unchanged exact candidate and observed these three idempotency keys:

```
founder-continuation-exec-1785200752594-3
founder-continuation-exec-1785200752594-3-retry-1
founder-continuation-exec-1785200752594-3-retry-2
```

Three distinct continuation run identities were produced and all three were retained in
lineage in order.

**This evidence disproves the risk that a second retry would collapse onto the dead first
retry and reconstruct a false success.** The generation derived from workflow-run lineage
advanced correctly across both cycles. This is candidate-review evidence.

## 13.9 Requirement 9 — structural mutation probes

Both structural mutation probes bit and recovered during the independent re-review. An
injected prohibited store import and an injected wait-token call each caused explicit
assertion failures, the latter naming `trigger/founder-request-continuation.ts:57`, and
each guard returned to passing after the mutation was restored.

**This establishes that the structural guards are not vacuous.** This is candidate-review
evidence.

## 13.10 Requirement 10 — the three deferred SMALL findings

1. **Lifecycle-stage vocabulary imprecision** — `lib/dev-hq/founder-request-service.ts`
   line 781. SMALL. Owner: Product and Architecture. Disposition: future
   lifecycle-vocabulary or hardening package.
2. **Retry-button focus restoration** —
   `components/mission-control/ApprovalQueuePanel.tsx` lines 143 through 175. SMALL.
   Owner: Design and Frontend accessibility. Disposition: future accessibility hardening
   package.
3. **Side-effect-only import detection** —
   `lib/dev-hq/continuation-import-boundary.test.ts` lines 35 through 36. SMALL.
   Owner: Code Quality and Engineering. Disposition: structural-test hardening.

**The side-effect-only import blind spot must be hardened BEFORE any future package adds or
modifies files under `trigger/`**, because that test is the sole enforcement of
PKGE-HAZARD-1 and its failure mode is silent.

## 13.11 Requirement 11 — architecture review considered and NOT required

Architecture review was considered and not required. The reasons: no contract shape entered
the candidate; the sole change beneath the `types` directory is one documentation comment
line replacing one documentation comment line in
`types/domain/founder-request-workflow.ts`; and the retryable failed-continuation
representation was already permitted by the approved remediation brief.

**The independent reviewer examined the two closest calls — the backwards stage transition
and the derived retry-generation rule — and declined to escalate either.**

## 13.12 Requirement 12 — authentication and authorization remain open

**FD5-01, FD5-03, FD5-06, and E-6 remain OPEN.** Authentication and authorization remain
separate analyses.

**On authentication:** `lib/dev-hq/internal-guard.ts` is byte-identical to the anchor.
Internal authentication remains possession of the shared internal worker token. That shared
worker secret is not a Founder principal. The public approve and reject routes remain
unauthenticated. Founder identity fields remain hardcoded.

**On authorization:** the failure route now accepts a decision from a shared-token holder,
extending FD5-03's surface. The mitigation is complete against decision injection and
reversal, because the service verifies that the approval exists, that it belongs to the
supplied execution, and that the supplied decision exactly equals the already-recorded
decision. **But this establishes record coherence and NOT caller identity.**

**P-2 receives no authentication credit, receives no caller-identity authorization credit,
and IS NOT DEPLOYMENT-READY.**

## 13.13 Requirement 13 — execution-time integration evidence

All values below are exact observed output.

**Pre-integration verification, all nine requirements, each PASS:**

1. Coordinator integration worktree confirmed as the `savrio-advance-1f` worktree.
2. Branch `feature/dev-hq-operating-system`.
3. HEAD `f210fb7c5ccfbbc76b664360900cccdc4ab2a965`.
4. Tree `97f4421ec893da117a80fe220c671fd830cfc54c`.
5. The porcelain status command with all untracked files returned **zero lines**.
6. `candidate-1f-p2-2` type `tag`, object `697c0f9b9a0542851c9c09a49ba0d75b57010bd4`,
   peeling to commit `55c6db79778e5c4c1d2a627828de136e43bac4fd`, tree
   `030eab3157b08a3de0ea0bc64142c2ac829bca78`, parent
   `b68211e49ba6c8b8c6cefc18b1870783e411cd5a`.
7. `candidate-1f-p2-1` type `tag`, object `e2508d4ab5a8e24778ce97d81666c60ce83f66ee`,
   peeling to commit `b68211e49ba6c8b8c6cefc18b1870783e411cd5a`, tree
   `566c1016af5e2d645db601181d518385b838f5a3`.
8. Ancestry proven in both directions: `b68211e4` is an ancestor of `55c6db79`, proving the
   rejected base was not amended, squashed, or rebased; and `f210fb7c` is an ancestor of
   `55c6db79`, proving a true two-commit fast-forward.
9. P-3 verified frozen by reference lookup only: `candidate-1f-p3-1` type `tag`, object
   `79d5186e555cb781fdebc0ed280adb56e62659d4`, commit
   `021cbf61fe9ac6cb948c3ad7ecf9ebb9a2b5450c`, tree
   `a5310c454cd7a65a6636a57f24f6308722cf0385`; branch `impl/p3-process-start-marker` at the
   same commit. **Its worktree was not entered and its files were not inspected.**

**The exact command invoked**, run in the Coordinator integration worktree
`savrio-advance-1f`:

```
git merge --ff-only 55c6db79778e5c4c1d2a627828de136e43bac4fd
```

Exit code: **0**. Standard error was empty. Complete standard output:

```
Updating f210fb7..55c6db7
Fast-forward
 app/api/dev-hq/internal/approval-gate/route.ts     |   6 +-
 app/api/dev-hq/internal/fail/route.ts              |  13 +
 components/mission-control/ApprovalQueuePanel.tsx  | 108 +++--
 components/mission-control/AuditTrailPanel.tsx     |  21 +-
 data/placeholders/mission-control.ts               |   4 +
 lib/dev-hq/adapters/dev-approval-manager.ts        |  30 +-
 lib/dev-hq/adapters/dev-workflow-engine.ts         |   5 +-
 lib/dev-hq/adapters/dev-workflow-run-repository.ts |  62 ++-
 lib/dev-hq/approval-continuation.test.ts           | 442 +++++++++++++++++++++
 lib/dev-hq/approve-path-ordering.test.ts           | 166 +++++---
 lib/dev-hq/continuation-import-boundary.test.ts    | 153 +++++++
 lib/dev-hq/continuation-terminal-failure.test.ts   | 378 ++++++++++++++++++
 .../duplicate-decision-lineage.types.test.ts       | 142 ++++---
 lib/dev-hq/founder-request-service.test.ts         |  78 ++--
 lib/dev-hq/founder-request-service.ts              | 439 ++++++++++++++++----
 lib/dev-hq/founder-request-terminal-run.test.ts    | 165 ++++----
 lib/dev-hq/trigger-run-lineage.test.ts             | 129 ++++--
 lib/dev-hq/wait-token-inventory.test.ts            |  60 +--
 lib/mission-control/view-model.ts                  |  29 +-
 test/fixtures/trigger-platform.ts                  | 156 +++++---
 trigger/founder-request-continuation.ts            |  76 ++++
 trigger/founder-request-workflow.ts                |  49 +--
 types/contracts/approval-manager.ts                |  34 +-
 types/contracts/index.ts                           |   2 +
 types/contracts/workflow-run-repository.ts         |  35 +-
 types/domain/approval.ts                           |  20 +-
 types/domain/founder-request-workflow.ts           |  61 ++-
 types/domain/index.ts                              |   4 +
 28 files changed, 2366 insertions(+), 501 deletions(-)
 create mode 100644 lib/dev-hq/approval-continuation.test.ts
 create mode 100644 lib/dev-hq/continuation-import-boundary.test.ts
 create mode 100644 lib/dev-hq/continuation-terminal-failure.test.ts
 create mode 100644 trigger/founder-request-continuation.ts
```

**Observed post-integration branch identity**, matching the expected values exactly:

- Branch `feature/dev-hq-operating-system`
- Commit `55c6db79778e5c4c1d2a627828de136e43bac4fd`
- Tree `030eab3157b08a3de0ea0bc64142c2ac829bca78`

**No merge commit was created.** The parent listing for the new head returned exactly one
parent, `b68211e49ba6c8b8c6cefc18b1870783e411cd5a`, so the fast-forward advanced the branch
reference only and produced no new object.

**Ancestry after integration:** `55c6db79778e5c4c1d2a627828de136e43bac4fd` retains its
single parent `b68211e49ba6c8b8c6cefc18b1870783e411cd5a`, which retains its single parent
`f210fb7c5ccfbbc76b664360900cccdc4ab2a965`. Both P-2 commits were confirmed individually
reachable from the branch tip.

**Tag integrity after integration:** `candidate-1f-p2-1` still resolves through tag object
`e2508d4ab5a8e24778ce97d81666c60ce83f66ee` to commit
`b68211e49ba6c8b8c6cefc18b1870783e411cd5a` with tree
`566c1016af5e2d645db601181d518385b838f5a3`, and remains permanent review evidence.
`candidate-1f-p2-2` still resolves through tag object
`697c0f9b9a0542851c9c09a49ba0d75b57010bd4` to commit
`55c6db79778e5c4c1d2a627828de136e43bac4fd`.

**P-3 was untouched.** Branch `impl/p3-process-start-marker` at
`021cbf61fe9ac6cb948c3ad7ecf9ebb9a2b5450c`; annotated tag `candidate-1f-p3-1` at tag object
`79d5186e555cb781fdebc0ed280adb56e62659d4`; tree
`a5310c454cd7a65a6636a57f24f6308722cf0385`. Its worktree was not entered and its files were
not inspected.

**Protected production barriers unchanged**, verified by blob hash at the integrated commit
and identical to the anchor:

```
1a28e2ad367f802864c86ee31ef8959d38acc2fb  proxy.ts
5e3c2a3b987e065b5bd3b2c74f2d145def0dfb15  lib/dev-hq/internal-guard.ts
94840e0aa7d2ed8e49665547346025b597c47cba  lib/dev-hq/actions.ts
414b567bbbe1a82596d5f4106eff9a8b07dd3889  trigger.config.ts
2f4d485ca84ee7d01a5527d38b3f83ccc31a63fb  package.json
3a74684e30d93c8046ef1379439289d9003d514a  package-lock.json
```

## 13.14 Requirement 14 — execution-time validation and disclosure evidence

**Clean dependency install.** The clean-install command was run in the integration
worktree, exit code **0**, installing from the integrated lockfile. **No shared or
junctioned dependency directory was reused.** The install reported 42 inherited dependency
vulnerabilities; `package.json` and `package-lock.json` are byte-identical to the anchor,
so these are inherited, not introduced, and belong to a separate dependency-security
package.

**Validation commands, exit codes, and result counts:**

1. Clean install — exit 0, from the integrated lockfile.
2. Unit suite — exit 0. **31 test files passed of 31. 383 tests passed of 383. 0
   failures.**
3. Lint — exit 0. **0 errors, 0 warnings.**
4. Typecheck, incremental-false form — exit 0. **0 type errors.** The plain no-emit
   invocation was not needed; the authoritative incremental-false form was used directly
   and succeeded, so no environmental failure occurred.
5. Production build — exit 0. **Compiled successfully. Generating static pages 18 of 18.**
6. Chromium end-to-end — exit 0. **1 test passed, 0 failures.**
7. Porcelain status with all untracked files — **zero lines**, both immediately after the
   fast-forward and after all validation completed.

**Every observed count matched the review-baseline figures exactly. No mismatch occurred.
No expected figure was adjusted, and no source file was modified to make a validation
pass.**

**All post-integration validation evidence applies to integrated commit
`55c6db79778e5c4c1d2a627828de136e43bac4fd`.** Evidence gathered against any other commit is
not evidence for this integration.

**The three evidence categories, stated separately and never blended:**

1. **Pre-integration candidate-review evidence** — produced by the independent reviewer
   against `candidate-1f-p2-2`, recorded in 13.7 through 13.9.
2. **Post-integration local validation evidence** — produced by the Coordinator in the
   integration worktree, recorded immediately above.
3. **Remote CI not rerun, because no push was authorized.** The required checks under the
   active branch ruleset, `Unit and Static Validation` and `End-to-End Smoke`, **did not
   run.** Remote CI must not be described as passing without exact current run evidence for
   the integrated commit. **No such evidence exists.**

**Founder authorization boundary.** This integration was authorized as a local fast-forward
and the creation of this durable record only. **No push, no pull request, no CI trigger,
and no deployment was authorized.** Any later push or CI execution requires separate
explicit Founder authorization. **P-3 remains frozen, unrebased, and awaiting separate
Founder authorization to rebase.**

## 13.15 Disclosed hygiene decision — absolute paths

The packet's Requirement 13 names the Coordinator worktree by absolute path, while its
Hygiene Requirement 1 forbids machine-specific absolute paths in this record, and the
governing authorization directs compliance with the stricter control where the two overlap.

**This record therefore identifies the integration worktree by name, `savrio-advance-1f`,
rather than by absolute path.** All substantive evidence Requirement 13 asks for — the exact
command, its exit code, and its complete output — is recorded in full. **This deviation is
disclosed rather than silent**, and it follows the precedent of two earlier occasions in
this project when machine-specific paths were removed from durable records before commit.

## 13.16 What P-2 integration does not do

1. Does **not** authorize a push, a pull request, a CI run, or a deployment.
2. Does **not** authorize P-3 rebase, P-3 revalidation, P-4, or P-5.
3. Does **not** establish Founder authentication and does **not** resolve FD5-01.
4. Does **not** establish caller-identity authorization and does **not** resolve FD5-03 or
   FD5-06.
5. Does **not** implement E-6, persistence, or any of the three deferred SMALL findings.
6. Does **not** weaken, remove, bypass, or consolidate any production barrier.
7. Does **not** make P-2 deployment-ready.
