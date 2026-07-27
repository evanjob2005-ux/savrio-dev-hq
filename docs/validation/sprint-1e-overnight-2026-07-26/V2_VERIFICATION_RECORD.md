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
