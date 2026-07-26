# CR-1E — Sprint 1E Remediation Patch Specification

~~**Status:** COMPLETE SPECIFICATION. **C1 applied** to the working tree (uncommitted).
C2, C3, C4 **not applied**.~~

**Status (Amendment 6, 2026-07-26):** **C1, C2, C3, C4 and the authorized follow-up are all
applied** to the working tree (uncommitted, 10 files). The follow-up added a sixth deferral
emission site plus two tests — specified in **Amendment 6 §5**. Source-comment corrections
(Amendment 6 items 9-10) were applied after the last freeze, so
`lib/dev-hq/agent-execution-service.ts` and the full-candidate diff hash have both moved past
`CANDIDATE_FINAL_FREEZE.md`; **see Amendment 6 item 7 before trusting any recorded hash.**
**Specifier:** CR-1E (read-only). **Applier:** coordinator. **Architecture review:** AR-1E.
**Independence:** CR-1E never saw AR-1E's policy before this assignment, so these
patches are not AR-1E reviewing its own design.

All "existing text" blocks were re-read from the working tree during specification;
none reconstructed from memory. Blast radius grep-verified, not assumed.

> **⟶ Amendment 4 (SPEC-AMEND-1E, Founder decision D-2, 2026-07-26).** Every line
> number in this document below was derived against commit `6301c06` — the tree
> *before* C1 was applied. C1 is now in the working tree, which shifted
> `agent-execution-service.ts` by +48/+49 and `agent-execution-service.test.ts` by
> +37 at the C2/C4 anchor points. **Sections §2.6, §2.8, §3.3, §4.1 and §4.2 carry
> corrected anchors; read the `⟶ Amendment 4` annotation on each before applying.**
> The full audit of every C2/C3/C4 anchor is in **[Amendment 4 — post-C1
> re-anchoring](#amendment-4-spec-amend-1e--post-c1-re-anchoring)** at the end of
> this document. Line numbers in the C1 sections (§1.1–§1.9) and in the analysis
> sections are historical record as-of `6301c06` and are **not** apply targets.

---

## Commit plan

| Commit | Contents |
|---|---|
| C1 | AR2-1 / X1 deferral events + X3 + X4 + X2 test rewrite + X3/X4 regression **(X1 coverage INCOMPLETE — see Amendment 6, item 6)** |
| C2 | F1 claim-race absorption + signature widening + X2b + D1 test fix |
| C3 | F4 heartbeat absorption + D2 test fix + F4 regression |
| C4 | AR2-4 review-on-re-entry + regression |

Apply C1 → C2 → C3 → C4. Each independently green. After **each**: `npx tsc --noEmit`,
`npx eslint .`, `npx vitest run`. After C4 only: `npx next build`.

~~**Expected end state: 22 files, 320 tests** (317 + 3 added; X2 and X2b are rewrites).~~

> **⟶ Amendment 6 (item 1) — corrected. Expected end state: 22 files, 322 tests**
> (317 + 5 added; X2 and D1 are rewrites, not additions). The `320`/`317 + 3` figures
> predate the authorized follow-up, which added **two** tests, not one. Counted against
> the tree, not assumed: `6301c06` carries **317** `it(...)` across 22 test files and the
> candidate carries **322** (`agent-execution-service.test.ts` +4,
> `execution-manager.test.ts` +1). No `it.skip`/`it.only`/`it.each`/`it.todo` exists in
> the repository, so the count is exact. See Amendment 6 §A6.1 for the per-test
> derivation.

---

## COMMIT 1 — deferral events (AR2-1/X1), X3, X4

### 1.1 `lib/dev-hq/constants.ts`

FIND (62-75):
```ts
/**
 * Typed execution lifecycle event names emitted from the service layer
 * (ADR-0002 E3). No event is emitted per heartbeat. `reclaimed` is emitted by the
 * Sprint 1E-3 lease sweeper when it recovers an expired-lease attempt.
 */
export const EXECUTION_EVENT_TYPE = {
  assigned: "execution.assigned",
  claimed: "execution.claimed",
  succeeded: "execution.succeeded",
  retried: "execution.retried",
  exhausted: "execution.exhausted",
  cancelled: "execution.cancelled",
  reclaimed: "execution.reclaimed",
} as const;
```

REPLACE:
```ts
/**
 * Typed execution lifecycle event names emitted from the service layer
 * (ADR-0002 E3). No event is emitted per heartbeat. `reclaimed` is emitted by the
 * Sprint 1E-3 lease sweeper when it recovers an expired-lease attempt.
 *
 * `assignmentDeferred` records that an execution could not be given an agent and
 * stays queued. The queued execution is the approved outcome (ADR-0001 O6); what
 * was missing was any record that it happened, which made a declined dispatch
 * indistinguishable from one that was never requested.
 *
 * `claimLost` records that a dispatched worker lost the compare-and-set for its
 * agent and stood down. Both are outcomes of the lifecycle, not errors in it.
 */
export const EXECUTION_EVENT_TYPE = {
  assigned: "execution.assigned",
  assignmentDeferred: "execution.assignment_deferred",
  claimed: "execution.claimed",
  claimLost: "execution.claim_lost",
  succeeded: "execution.succeeded",
  retried: "execution.retried",
  exhausted: "execution.exhausted",
  cancelled: "execution.cancelled",
  reclaimed: "execution.reclaimed",
} as const;
```

### 1.2 `agent-execution-service.ts` — new exported emitter

INSERT after the closing `}` of `ensureAssignmentEvent` (line 191), before the `/**` at 193:

```ts

/**
 * Ensure the timeline records that an execution could not be given an agent and
 * remains queued (ADR-0001 O6). This changes no outcome — the queued execution is
 * the approved behaviour — it supplies the record that was missing, which is what
 * made a declined dispatch indistinguishable from one never requested.
 *
 * Keyed per (execution, attempt): reconciliation retries a stranded execution on
 * every sweep, and one deferral per attempt is the honest count. A genuinely new
 * attempt still records its own.
 *
 * Only a capacity decline is a deferral. `execution_not_queued` means the
 * execution already left the queue, and recording that as "stays queued" would put
 * an untruth on an append-only timeline — the same defect X4 fixes. The filter
 * lives here rather than at the five call sites so they cannot drift apart.
 */
export async function ensureAssignmentDeferredEvent(
  execution: Execution,
  reason: AssignmentDecision["reason"],
): Promise<void> {
  if (reason !== "no_agent_available") return;
  const attempt = execution.attempt ?? 1;
  await getDevHqAdapters().eventLogger.log({
    type: EXECUTION_EVENT_TYPE.assignmentDeferred,
    entityType: "execution",
    entityId: execution.id,
    message: `Execution ${execution.id} could not be assigned an agent for task ${execution.taskId}; it stays queued at attempt ${attempt} for reconciliation to retry.`,
    actorId: null,
    actorLabel: "System",
    dedupeKey: `${EXECUTION_EVENT_TYPE.assignmentDeferred}:${execution.id}:${attempt}`,
  });
}
```

No import changes required — `AssignmentDecision` (7), `Execution` (11),
`EXECUTION_EVENT_TYPE` (38), `getDevHqAdapters` (33) all already imported.

### 1.3 Site 1 — dispatch decline (`agent-execution-service.ts` 681-690)

FIND:
```ts
  const { decision, created } = await ensureAssignment(execution.id, policy);
  if (!decision.assigned || !decision.assignment) {
    return {
      assigned: false,
      reason: decision.reason,
      executionId: execution.id,
      agentId: null,
      triggerRunId: null,
    };
  }
```
REPLACE:
```ts
  const { decision, created } = await ensureAssignment(execution.id, policy);
  if (!decision.assigned || !decision.assignment) {
    // ADR-0001 O6: a declined dispatch is a lifecycle outcome and must reach the
    // timeline. The execution stays queued — that is the approved behaviour — but
    // it is no longer silent.
    await ensureAssignmentDeferredEvent(execution, decision.reason);
    return {
      assigned: false,
      reason: decision.reason,
      executionId: execution.id,
      agentId: null,
      triggerRunId: null,
    };
  }
```

### 1.4 Site 2 — retry with no capacity (823-825)

FIND:
```ts
      if (!execution.agentId || !execution.assignmentId) {
        return { execution, retried: false };
      }
```
REPLACE:
```ts
      if (!execution.agentId || !execution.assignmentId) {
        await ensureAssignmentDeferredEvent(execution, "no_agent_available");
        return { execution, retried: false };
      }
```

### 1.5 ~~Site 3~~ **Site 6** + X3 + X4 — reclaim loop (996-1020)

> **⟶ Amendment 6 (item 11) — this heading used the abandoned numbering scheme.** The
> reclaim loop is **Site 6** under the canonical scheme. `Site 3` now means
> `reconcileQueuedDispatches`' decline (Amendment 6 §5). See the mapping table in
> Amendment 6 §A6.2 — the collision on `3` has already cost this package twice.

FIND:
```ts
    await logExecutionEvent(
      EXECUTION_EVENT_TYPE.reclaimed,
      execution.id,
      execution.agentId,
      execution.status === "queued"
        ? `Execution ${execution.id} lease expired; reclaimed and retrying as attempt ${execution.attempt}.`
        : `Execution ${execution.id} lease expired; reclaimed and marked ${execution.status} (retry budget spent).`,
    );

    if (execution.status === "queued" && execution.agentId) {
      await ensureDispatchForAssignment(
        execution.assignmentId!,
        recoveryInstructions(execution),
      );
    } else if (execution.status === "failed") {
      // A reclaim that spent the last of the retry budget runs the shared terminal
      // finalization: it emits the deduped execution.exhausted lifecycle event and
      // reconciles the escalation. reconcileUnescalatedFailures below is the
      // self-healing backstop if that escalation step is interrupted.
      await finalizeTerminalExecution(
        execution,
        execution.attempt ?? MAX_EXECUTION_ATTEMPTS,
        execution.agentId,
      );
    }
```
REPLACE:
```ts
    // Three outcomes, not two. A reclaim can requeue an attempt that no agent was
    // free to take: it is neither dispatchable nor terminal, so the original
    // two-branch shape skipped it entirely (X3) while the message still announced
    // a retry that nothing was running (X4).
    const requeuedWithAgent =
      execution.status === "queued" && Boolean(execution.agentId);
    const requeuedWithoutAgent =
      execution.status === "queued" && !execution.agentId;

    await logExecutionEvent(
      EXECUTION_EVENT_TYPE.reclaimed,
      execution.id,
      execution.agentId,
      requeuedWithAgent
        ? `Execution ${execution.id} lease expired; reclaimed and retrying as attempt ${execution.attempt}.`
        : requeuedWithoutAgent
          ? `Execution ${execution.id} lease expired; reclaimed as attempt ${execution.attempt}, which is waiting for an available agent.`
          : `Execution ${execution.id} lease expired; reclaimed and marked ${execution.status} (retry budget spent).`,
    );

    if (requeuedWithAgent) {
      await ensureDispatchForAssignment(
        execution.assignmentId!,
        recoveryInstructions(execution),
      );
    } else if (requeuedWithoutAgent) {
      await ensureAssignmentDeferredEvent(execution, "no_agent_available");
    } else if (execution.status === "failed") {
      // A reclaim that spent the last of the retry budget runs the shared terminal
      // finalization: it emits the deduped execution.exhausted lifecycle event and
      // reconciles the escalation. reconcileUnescalatedFailures below is the
      // self-healing backstop if that escalation step is interrupted.
      await finalizeTerminalExecution(
        execution,
        execution.attempt ?? MAX_EXECUTION_ATTEMPTS,
        execution.agentId,
      );
    }
```

### 1.6 Site 4 — `review-service.ts` (625-631)

FIND:
```ts
  const { decision } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // No capacity right now, or the revision already left the queue. The
    // execution keeps its routing and is picked up by queued-dispatch
    // reconciliation; nothing here needs unwinding.
    return executionId;
  }
```
REPLACE:
```ts
  const { decision } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // No capacity right now, or the revision already left the queue. The
    // execution keeps its routing and is picked up by queued-dispatch
    // reconciliation; nothing here needs unwinding — but a capacity decline is a
    // lifecycle outcome and must reach the timeline (ADR-0001 O6). Imported
    // dynamically for the same reason as the dispatch helpers below.
    const { ensureAssignmentDeferredEvent } = await import(
      "@/lib/dev-hq/agent-execution-service"
    );
    await ensureAssignmentDeferredEvent(execution, decision.reason);
    return executionId;
  }
```

### 1.7 Site 5 — `escalation-service.ts` (284-290)

FIND:
```ts
  const { decision, created } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // Not dispatchable right now (no agent free) or no longer dispatchable at
    // all (the revision already terminated). Either way, report the canonical
    // execution's authoritative state so the caller can decide about the task.
    return getExecution(executionId);
  }
```
REPLACE:
```ts
  const { decision, created } = await ensureAssignment(execution.id);
  if (!decision.assigned || !decision.assignment) {
    // Not dispatchable right now (no agent free) or no longer dispatchable at
    // all (the revision already terminated). Either way, report the canonical
    // execution's authoritative state so the caller can decide about the task —
    // and record the decline, which is a lifecycle outcome (ADR-0001 O6).
    const { ensureAssignmentDeferredEvent } = await import(
      "@/lib/dev-hq/agent-execution-service"
    );
    await ensureAssignmentDeferredEvent(execution, decision.reason);
    return getExecution(executionId);
  }
```

### 1.8 X2 — rewrite `agent-execution-service.test.ts` 110-119

FIND:
```ts
  it("does not dispatch when no eligible agent is available", async () => {
    const task = seedTask();
    const result = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["qa"], // gemini has qa but is only "waiting"
    });
    expect(result.assigned).toBe(false);
    expect(result.reason).toBe("no_agent_available");
    expect(triggerMock).not.toHaveBeenCalled();
  });
```
REPLACE:
```ts
  it("records a deferral when no eligible agent is available", async () => {
    const task = seedTask();
    // The no-capacity condition is constructed here, not inherited from the seed
    // roster. The previous fixture relied on `gemini` shipping as "waiting"; a
    // later seeding change would have silently stopped exercising this path while
    // the test kept passing — the same false assurance this remediation exists to
    // remove.
    for (const agent of getDevHqStore().agents.values()) {
      saveAgent({ ...agent, availability: "busy" });
    }

    const result = await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "deferral-key-1",
    });
    expect(result.assigned).toBe(false);
    expect(result.reason).toBe("no_agent_available");
    expect(triggerMock).not.toHaveBeenCalled();

    // ADR-0001 O6: the decline is a lifecycle outcome and must be on the timeline.
    const events = await getDevHqAdapters().eventLogger.listRecent({
      entityType: "execution",
      limit: 200,
    });
    const deferred = events.filter(
      (e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred,
    );
    expect(deferred).toHaveLength(1);
    expect(deferred[0]?.entityId).toBe(result.executionId);

    // Keyed per (execution, attempt), so a replay adds no second entry — and the
    // execution stays queued, which is the ADR-approved outcome and unchanged.
    await dispatchAgentExecution({
      taskId: task.id,
      requiredCapabilities: ["validation"],
      idempotencyKey: "deferral-key-1",
    });
    const after = await getDevHqAdapters().eventLogger.listRecent({
      entityType: "execution",
      limit: 200,
    });
    expect(
      after.filter((e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred),
    ).toHaveLength(1);
    expect((await getExecution(result.executionId!))!.status).toBe("queued");
  });
```

### 1.9 New regression — X3 + X4

INSERT after the test closing at line 1506, same `describe`:

```ts
    it("records a reclaimed attempt that no agent could take", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: "reclaim-nocap-1",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);

      // Construct the no-capacity condition explicitly rather than leaning on the
      // roster. Reclaim frees the claimed agent, so occupying everyone is not
      // enough on its own: the freed agent must also stop satisfying the
      // execution's persisted provider pin, which models the agent leaving or
      // changing provider (the case releaseAssignmentForReassignment documents).
      for (const agent of getDevHqStore().agents.values()) {
        saveAgent({ ...agent, availability: "busy" });
      }
      const claimedAgent = getAgent("agent-supervisor")!;
      saveAgent({ ...claimedAgent, provider: "provider-withdrawn" });

      triggerMock.mockClear();
      await handleExecutionReclaim(FAR_FUTURE);

      const requeued = (await getExecution(executionId))!;
      expect(requeued.status).toBe("queued");
      expect(requeued.agentId).toBeNull();
      expect(requeued.attempt).toBe(2);
      expect(triggerMock).not.toHaveBeenCalled();

      const events = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      // X3: this attempt is neither dispatchable nor terminal, so both original
      // branches skipped it and it recorded nothing at all.
      expect(
        events.filter((e) => e.type === EXECUTION_EVENT_TYPE.assignmentDeferred),
      ).toHaveLength(1);
      // X4: the reclaim event must not assert a retry that nothing is running.
      const reclaimed = events.filter(
        (e) => e.type === EXECUTION_EVENT_TYPE.reclaimed,
      );
      expect(reclaimed).toHaveLength(1);
      expect(reclaimed[0]?.message).toContain("waiting for an available agent");
      expect(reclaimed[0]?.message).not.toContain("retrying as attempt");
    });
```

⚠️ ~~**CR-1E marked UNCERTAIN:** `getAgent` is imported (line 19) but the enclosing
`describe` was not checked for a narrower scope conflict. If shadowed, use
`getDevHqStore().agents.get("agent-supervisor")!`. `tsc` surfaces it either way.~~

> **⟶ Amendment 4 — RESOLVED, not a defect.** Checked directly against the applied
> tree: `getAgent` is imported at `agent-execution-service.test.ts:19`, and a grep
> for `const getAgent|let getAgent|function getAgent` in that file returns no match,
> so no shadowing declaration exists at any scope. `npx tsc --noEmit` passes clean on
> the applied C1. The fallback is not needed. **§1.9 is applied and correct** — it now
> occupies `agent-execution-service.test.ts:1545-1593`.

---

## COMMIT 2 — F1 claim-race absorption

### 2.1 `execution-manager.ts` `claimExecution` (495-503 doc, 525-529 body)

FIND:
```ts
/**
 * Atomically take ownership of a queued execution for its assigned agent. This is
 * the compare-and-set on availability: it succeeds only while the agent is still
 * available, so two claims on the same agent cannot both win.
 */
export async function claimExecution(
  executionId: string,
  agentId: string,
): Promise<Execution> {
```
REPLACE:
```ts
/**
 * Atomically take ownership of a queued execution for its assigned agent. This is
 * the compare-and-set on availability: it succeeds only while the agent is still
 * available, so two claims on the same agent cannot both win.
 *
 * Returns `null` when the compare-and-set loses — the agent was reserved by
 * another attempt between selection and this call. That is an anticipated
 * concurrent outcome, not a caller error: this caller was right when it was
 * dispatched and the world moved. Every other precondition still throws, because
 * no correct caller could have produced it.
 */
export async function claimExecution(
  executionId: string,
  agentId: string,
): Promise<Execution | null> {
```

FIND:
```ts
  if (agent.availability !== "available") {
    throw new Error(
      `Agent ${agentId} is not available to claim (status ${agent.availability}).`,
    );
  }
```
REPLACE:
```ts
  // The compare-and-set lost. Absorbed rather than thrown: a throw becomes a 500
  // at the callback route, which the worker's postJson turns into an exception
  // before it can read the answer — so the stand-down path it documents could
  // never run. Do NOT hoist this check into a caller: it and the reservation
  // below must stay adjacent and synchronous or the race it closes reopens.
  if (agent.availability !== "available") {
    return null;
  }
```

### 2.2 `execution-manager.ts` `runExecution` (748-758)

FIND:
```ts
/** Start an already-assigned execution by claiming it for its assigned agent. */
export async function runExecution(executionId: string): Promise<Execution> {
```
REPLACE:
```ts
/**
 * Start an already-assigned execution by claiming it for its assigned agent.
 * Propagates `claimExecution`'s `null` when the compare-and-set loses.
 */
export async function runExecution(
  executionId: string,
): Promise<Execution | null> {
```
(body unchanged)

### 2.3 `types/contracts/execution-runner.ts` (57-58, 68)

FIND:
```ts
  /** Atomically take ownership of an execution for an available agent. */
  claimExecution(executionId: string, agentId: string): Promise<Execution>;
```
REPLACE:
```ts
  /**
   * Atomically take ownership of an execution for an available agent. Resolves
   * `null` when the compare-and-set loses to a concurrent claim.
   */
  claimExecution(
    executionId: string,
    agentId: string,
  ): Promise<Execution | null>;
```

FIND: `  runExecution(executionId: string): Promise<Execution>;`
REPLACE: `  runExecution(executionId: string): Promise<Execution | null>;`

### 2.4 `adapters/dev-execution-runner.ts` (26-28, 46-48)

FIND:
```ts
  claimExecution(executionId: string, agentId: string): Promise<Execution> {
    return manager.claimExecution(executionId, agentId);
  }
```
REPLACE:
```ts
  claimExecution(
    executionId: string,
    agentId: string,
  ): Promise<Execution | null> {
    return manager.claimExecution(executionId, agentId);
  }
```

FIND:
```ts
  runExecution(executionId: string): Promise<Execution> {
    return manager.runExecution(executionId);
  }
```
REPLACE:
```ts
  runExecution(executionId: string): Promise<Execution | null> {
    return manager.runExecution(executionId);
  }
```

### 2.5 `agent-execution-service.ts` — claim-lost emitter

~~INSERT after the 1.2 block:~~

> **⟶ Amendment 4 — anchor made explicit (was descriptive but unstated).** §1.2 is
> applied. **INSERT at module top level, immediately after the closing `}` of
> `ensureAssignmentDeferredEvent` — the function §1.2 added — and immediately before
> the `/**` that opens the doc comment of `ensureRetryEvents`.** In the applied tree
> that closing `}` is `agent-execution-service.ts:235` and the `/**` is `:237`, but
> apply by structure, not by number. The insertion point is module scope, not inside
> any function body. `getAgent` (used by the payload) is already imported at `:27`.
```ts

/**
 * Ensure the timeline records that a dispatched worker lost the compare-and-set
 * for its agent and stood down. Keyed on the assignment: an assignment can lose
 * the claim once, and that run is over.
 *
 * Deliberately not exported. Only this module absorbs a lost claim; the review and
 * escalation services never claim, so widening the surface would suggest otherwise.
 */
async function ensureClaimLostEvent(
  execution: Execution,
  assignmentId: string,
  agentId: string | null,
): Promise<void> {
  const agent = agentId ? getAgent(agentId) : null;
  await getDevHqAdapters().eventLogger.log({
    type: EXECUTION_EVENT_TYPE.claimLost,
    entityType: "execution",
    entityId: execution.id,
    message: `Execution ${execution.id} could not claim ${
      agent?.name ?? "its assigned agent"
    } for assignment ${assignmentId}; another attempt held the agent, so this run stood down.`,
    actorId: agentId,
    actorLabel: agent?.name ?? "System",
    dedupeKey: `${EXECUTION_EVENT_TYPE.claimLost}:${assignmentId}`,
  });
}
```

### 2.6 `handleExecutionRunning` absorbs ~~(737-744)~~

> **⟶ Amendment 4 — anchor corrected. `737-744` was true at `6301c06`; it is now
> `785-792`** (C1 inserted 44 lines at `:193` and 4 at `:727`). Apply by text, not by
> number: the FIND block below is **unique** — `const execution = await
> runExecution(executionId);` occurs exactly once in `agent-execution-service.ts`, and
> `Execution ${execution.id} claimed and running.` likewise. It sits inside
> `export async function handleExecutionRunning(...)`, whose signature is at `:768`,
> after the `existing.status !== "queued"` replay guard. The FIND text is unchanged by
> C1 and matches the applied tree verbatim.

FIND:
```ts
  const execution = await runExecution(executionId);
  await logExecutionEvent(
    EXECUTION_EVENT_TYPE.claimed,
    execution.id,
    execution.agentId,
    `Execution ${execution.id} claimed and running.`,
  );
  return execution;
```
REPLACE:
```ts
  const execution = await runExecution(executionId);
  if (!execution) {
    // The compare-and-set lost: another attempt holds the agent. This is a 200
    // with the unchanged execution, so the worker reads a non-running status and
    // stands down cleanly; the claim deadline then recovers this assignment. The
    // guard avoids a non-null assertion — runExecution cannot return null with a
    // null assignmentId, but the type does not say so.
    if (existing.assignmentId) {
      await ensureClaimLostEvent(
        existing,
        existing.assignmentId,
        existing.agentId,
      );
    }
    return existing;
  }
  await logExecutionEvent(
    EXECUTION_EVENT_TYPE.claimed,
    execution.id,
    execution.agentId,
    `Execution ${execution.id} claimed and running.`,
  );
  return execution;
```

### 2.7 Forced test updates

**(a)** `execution-manager.test.ts:109` —
FIND `    const running = await claimExecution(execution!.id, "agent-supervisor");`
REPLACE `    const running = (await claimExecution(execution!.id, "agent-supervisor"))!;`

**(b) D1 — `execution-manager.test.ts:120,133-136`** *(not in the original policy)* —
FIND `  it("rejects a second claim on the same agent (compare-and-set)", async () => {`
REPLACE `  it("refuses a second claim on the same agent (compare-and-set)", async () => {`

FIND:
```ts
    await claimExecution(a.execution!.id, "agent-supervisor");
    await expect(
      claimExecution(b.execution!.id, "agent-supervisor"),
    ).rejects.toThrow(/not available to claim/);
```
REPLACE:
```ts
    await claimExecution(a.execution!.id, "agent-supervisor");
    // Still exactly one winner; the loser now reports that by returning null
    // instead of throwing. The reservation itself is unchanged.
    expect(await claimExecution(b.execution!.id, "agent-supervisor")).toBeNull();
    expect((await getExecution(b.execution!.id))!.status).toBe("queued");
    expect(getAgent("agent-supervisor")?.availability).toBe("busy");
```

**(c)** `execution-manager.test.ts:325` —
FIND `    const running = await runExecution(execution!.id);`
REPLACE `    const running = (await runExecution(execution!.id))!;`

**(d)** `dev-execution-runner.test.ts:58-59` —
FIND:
```ts
    const claimed = await runner.claimExecution(executionId, "agent-supervisor");
    expect(claimed.status).toBe("running");
```
REPLACE:
```ts
    const claimed = await runner.claimExecution(executionId, "agent-supervisor");
    expect(claimed?.status).toBe("running");
```

**No change needed:** `execution-manager.test.ts` 145-155, 230, 247, 276, 290, 302,
479, 577, 595, 616; `dev-agent-provider.test.ts:126`.

### 2.8 X2b — `agent-execution-service.test.ts` ~~`:1474-1476`~~

> **⟶ Amendment 4 — anchor corrected. `1474-1476` was true at `6301c06`; it is now
> `1511-1513`** (C1 inserted 37 lines earlier in the file). Apply by text, not by
> number: the FIND block is **unique** — `/not available to claim/` occurs exactly
> once in `agent-execution-service.test.ts`. It sits inside
> `it("recovers the loser of a pre-claim race for a capacity-one agent", ...)`, which
> lives in `describe("queued execution recovery", ...)`. The FIND text is unchanged by
> C1 and matches the applied tree verbatim.

FIND:
```ts
      await expect(
        handleExecutionRunning(second.executionId!, loserAssignment),
      ).rejects.toThrow(/not available to claim/);
```
REPLACE:
```ts
      // The loser absorbs the lost compare-and-set and returns 200 with the
      // unchanged execution, so the worker's holdsClaim check reads a non-running
      // status and stands down. It must NOT throw: a throw becomes a 500, which
      // postJson raises before the worker can read the answer — and with
      // retries.enabledInDev false that kills the durable run outright.
      const lost = await handleExecutionRunning(
        second.executionId!,
        loserAssignment,
      );
      expect(lost.status).toBe("queued");
      expect(lost.assignmentId).toBe(loserAssignment);
      const lostEvents = await getDevHqAdapters().eventLogger.listRecent({
        entityType: "execution",
        limit: 200,
      });
      expect(
        lostEvents.filter((e) => e.type === EXECUTION_EVENT_TYPE.claimLost),
      ).toHaveLength(1);
```
Remainder of that test ~~(1478-1506)~~ unchanged — still asserts claim-deadline recovery.

> **⟶ Amendment 4 — reference corrected.** That remainder is now
> `agent-execution-service.test.ts:1515-1543`, running from the
> `// The loser is now the stranding case:` comment through the test's closing
> `    });`. Nothing in it is edited; the reference is recorded so a reviewer can
> confirm the FIND landed in the right test.

---

## COMMIT 3 — F4 heartbeat absorption

### 3.1 `execution-manager.ts` (548-555 doc, 564-576 body)

FIND (doc):
```ts
/**
 * Extend the lease of a running execution and record the heartbeat.
 *
 * A heartbeat is only meaningful from the worker that holds the current attempt.
 * When the caller names an assignment that is no longer the execution's current
 * one, the beat is a stale worker's and is a **no-op**: honouring it would let an
 * abandoned run keep a successor attempt's lease alive and mask its failure.
 */
```
REPLACE:
```ts
/**
 * Extend the lease of a running execution and record the heartbeat.
 *
 * A heartbeat is only meaningful from the worker that holds the current attempt.
 * When the caller names an assignment that is no longer the execution's current
 * one, the beat is a stale worker's and is a **no-op**: honouring it would let an
 * abandoned run keep a successor attempt's lease alive and mask its failure.
 *
 * A beat that arrives after its own attempt already ended — reclaimed, completed,
 * or cancelled underneath it — is absorbed for the same reason: the caller was the
 * right worker and the world moved. There is no lease left to extend, so absorbing
 * costs nothing, and throwing would fail an otherwise healthy durable run over a
 * benign race. No event is emitted on any heartbeat path (ADR-0002 E3).
 */
```

FIND (body):
```ts
  if (execution.status !== "running") {
    throw new Error(
      `Execution is not running; cannot heartbeat: ${executionId}`,
    );
  }
  if (!execution.assignmentId) {
    throw new Error(`Execution has no assignment: ${executionId}`);
  }

  const assignment = requireAssignment(execution.assignmentId);
  if (assignment.status === "released") {
    throw new Error(`Assignment already released: ${assignment.id}`);
  }
```
REPLACE:
```ts
  // The attempt already ended while this beat was in flight.
  if (execution.status !== "running") {
    return execution;
  }
  // A running execution with no assignment is not a state any caller could have
  // produced. That is a broken invariant and stays loud.
  if (!execution.assignmentId) {
    throw new Error(`Execution has no assignment: ${executionId}`);
  }

  const assignment = requireAssignment(execution.assignmentId);
  // Same reasoning as the terminal case: released underneath a beat that was
  // legitimate when it was sent.
  if (assignment.status === "released") {
    return execution;
  }
```

### 3.2 D2 — `execution-manager.test.ts:172-174` *(not in the original policy)*

FIND:
```ts
    // Cannot heartbeat a non-running execution.
    await releaseExecution(execution!.id, makeResult("succeeded"));
    await expect(heartbeat(execution!.id)).rejects.toThrow(/not running/);
```
REPLACE:
```ts
    // A beat that lands after the attempt already finished is absorbed, not an
    // error, and extends nothing.
    await releaseExecution(execution!.id, makeResult("succeeded"));
    const late = await heartbeat(execution!.id);
    expect(late.status).toBe("succeeded");
    expect(getAssignment(execution!.assignmentId!)?.leaseExpiresAt).toBeNull();
```

### 3.3 New regression — F4

Add `saveExecution` to the store import block (16-24), and immediately after the closing
`} from "@/lib/dev-hq/store";` of that import block, add:
```ts
import { MAX_EXECUTION_ATTEMPTS } from "@/lib/dev-hq/constants";
```

> **⟶ Amendment 5 — import instruction corrected (MAJOR-A). Supersedes Amendment 4's
> verdict on this instruction, which wrongly cleared it as "verified correct."**
> `execution-manager.test.ts` is untouched by C1, and neither `saveExecution` nor
> `MAX_EXECUTION_ATTEMPTS` is currently imported in it. The `(16-24)` above is
> corroboration only — anchor on the text.
>
> **Placement.** Insert the specifier `saveExecution,` **inside** the
> `@/lib/dev-hq/store` import block, between the existing `saveAssignment,` and
> `saveTask,` specifiers, matching the block's alphabetical ordering.
>
> **The two halves are now order-independent — this is the defect Amendment 4 left
> open.** Amendment 4 said *"after line 24"* while simultaneously directing
> `saveExecution` between lines `22` and `23`. Adding that specifier shifts
> `} from "@/lib/dev-hq/store";` from `:24` to `:25`, so *"after line 24"* would then
> land the `MAX_EXECUTION_ATTEMPTS` import **between `saveTask,` and the closing
> brace** — inside the braces. That is a syntax error, it fails `tsc`, and it blocks
> C3. Both halves are now named by text rather than by position: the first targets a
> point between two named specifiers *inside* the braces; the second targets the line
> *after* the block's closing `} from "@/lib/dev-hq/store";` statement. Neither edit
> can move the other's target, so applying them in either order yields the same file.

~~INSERT after the test closing at line 175:~~

> **⟶ Amendment 4 — anchor corrected; it was stale *within its own commit*.**
> `175` is the correct closing `});` at the start of C3, but §3.2 (as replaced by
> Amendment 2) swaps 3 lines for 28 inside that same test, and the import edit above
> adds 2 more lines above it — so by the time this instruction runs, the true target
> is ~`202`, not `175`. **Do not use a line number.**
>
> **INSERT at `describe("execution manager", ...)` body level (2-space indent),
> immediately after the closing `  });` of
> `it("heartbeats a running execution and keeps the lease", async () => {` — the test
> §3.2 has just rewritten — and immediately before
> `it("releases a succeeded execution and frees the agent", async () => {`.** Both
> `it(...)` titles are unique in the file. The insertion point is between two sibling
> tests, outside every test body.
```ts
  it("absorbs a heartbeat for an attempt reclaimed underneath it", async () => {
    const task = seedTask();
    const { execution } = await assignExecution(task.id, {
      requiredCapabilities: ["validation"],
    });
    const claimed = (await claimExecution(execution!.id, "agent-supervisor"))!;
    const assignmentId = claimed.assignmentId!;

    // Spend the retry budget so the reclaim is terminal rather than a requeue.
    // That is the shape that used to throw: the execution goes to `failed` while
    // KEEPING this assignment id, so the stale-worker guard does not catch the
    // beat and the terminal check used to raise.
    saveExecution({ ...claimed, attempt: MAX_EXECUTION_ATTEMPTS });
    await reclaimStale(FAR_FUTURE);

    const reclaimed = (await getExecution(execution!.id))!;
    expect(reclaimed.status).toBe("failed");
    expect(reclaimed.assignmentId).toBe(assignmentId);

    const late = await heartbeat(execution!.id, assignmentId);
    expect(late.status).toBe("failed");
    expect(getAssignment(assignmentId)?.status).toBe("released");
    expect(getAssignment(assignmentId)?.leaseExpiresAt).toBeNull();
  });
```

---

## COMMIT 4 — AR2-4 review on re-entry

### 4.1 `agent-execution-service.ts` ~~(856-857)~~

> **⟶ Amendment 4 — anchor corrected. `856-857` was true at `6301c06`; it is now
> `905-906`.** Apply by text, not by number: `await reconcileRecordsFor(current);`
> occurs exactly once in `agent-execution-service.ts`, and the two-line FIND block is
> unique. It is the tail of the re-entry branch in
> `export async function handleExecutionComplete(...)`, immediately below the
> `// Re-entry after the current attempt already left \`running\`.` comment. The FIND
> text is unchanged by C1 and matches the applied tree verbatim.

FIND:
```ts
  await reconcileRecordsFor(current);
  return { execution: current, retried: false };
```
REPLACE:
```ts
  await reconcileRecordsFor(current);
  // The review request is a consequence of *succeeding*, not a descriptive record,
  // so it stays out of reconcileRecordsFor — that function must remain free of
  // anything reaching another subsystem. But a crash between the terminal
  // transition and the fresh path's request leaves the review unrequested, and
  // only the sweep would ever notice. Asking here closes the gap on the very next
  // callback. Idempotent: the canonical review id makes a repeat a no-op.
  await requestReviewIfSucceeded(current);
  return { execution: current, retried: false };
```

### 4.2 New regression — AR2-4

~~INSERT after the test closing at line 1506:~~

> **⟶ Amendment 4 — ANCHOR WAS UNSAFE. DO NOT APPLY THE STRUCK LINE.**
>
> `1506` was the closing `      });` of
> `it("recovers the loser of a pre-claim race for a capacity-one agent", ...)` at
> `6301c06`. §1.9 consumed that same anchor when C1 was applied, and C1's +37-line
> shift moved the file underneath it. In the applied tree,
> `agent-execution-service.test.ts:1506` is
> `      // The first worker wins the claim; the second cannot start.` — **mid-body of
> that test.** Inserting here would nest a complete `it(...)` inside another `it(...)`
> callback.
>
> That failure is **not caught by two of the three gate checks**: a nested `it(...)`
> is valid JavaScript and valid TypeScript, so `npx tsc --noEmit` and `npx eslint .`
> both pass. Only `npx vitest run` detects it. Two false greens.
>
> **Corrected instruction — append as the final test in the `describe` block:**
>
> **INSERT inside `describe("queued execution recovery", ...)` at its body level
> (4-space indent), immediately after the closing `    });` of
> `it("does not sweep founder-request executions", async () => {` — the last test in
> that block — and immediately before the `  });` that closes the
> `describe("queued execution recovery", ...)` block itself.**
>
> Both the `describe` title and the `it` title are unique in the file. This anchor is
> deliberately structural: C2's §2.8 edits this same file *earlier* than this point
> (it replaces 3 lines at `:1511-1513` with ~42), so any line number stated here would
> be stale again by the time C4 runs. The insertion point is between a test's closing
> `});` and its `describe`'s closing `});` — outside every test body.
>
> Identifiers the payload needs are already imported: `handleExecutionComplete` (12),
> `saveExecution` (25), `getDevHqAdapters` (28), `getExecution` (30), plus the
> file-local `TS` (33) and `seedTask` (37).
```ts
    it("requests the review on a re-entered completion callback", async () => {
      const task = seedTask();
      const dispatched = await dispatchAgentExecution({
        taskId: task.id,
        requiredCapabilities: ["validation"],
        instructions: "do the work",
        idempotencyKey: "reentry-review-1",
      });
      const executionId = dispatched.executionId!;
      const assignmentId = (await getExecution(executionId))!.assignmentId!;
      await handleExecutionRunning(executionId, assignmentId);

      // Model a crash between the terminal transition and the review request:
      // the execution is succeeded, but no review was ever asked for.
      const running = (await getExecution(executionId))!;
      saveExecution({ ...running, status: "succeeded", completedAt: TS });
      expect(
        await getDevHqAdapters().reviewStore.findByExecution(executionId),
      ).toBeNull();

      // The re-entry path must close that on the next callback, without waiting
      // for the sweep.
      await handleExecutionComplete({
        executionId,
        assignmentId,
        status: "succeeded",
        instructions: "do the work",
      });

      const review =
        await getDevHqAdapters().reviewStore.findByExecution(executionId);
      expect(review).not.toBeNull();
      expect(review?.executionId).toBe(executionId);
    });
```

---

## AMENDMENTS (CR-1E, after AR-1E's rulings) — these supersede the blocks above

Three amended blocks. Everything else in the specification stands unchanged. Expected
end state remains ~~**320 tests**~~ **322 tests** *(Amendment 6, item 1)* — these strengthen
existing rewrites and add no cases.

> **⟶ Amendment 4 (SPEC-AMEND-1E, 2026-07-26)** is a separate, later ruling and lives in
> its own section at the end of this document. It re-anchors C2/C3/C4 after C1 was
> applied and changes no payload. Amendments 1-3 below are unaffected by it.

### Amendment 1 (D3) — §1.2 comment

> **⟶ PARTIALLY SUPERSEDED by the source-comment corrections (items 9–10 of Amendment 6),
> Founder-approved 2026-07-26. Do not apply the payload below literally.**
>
> The comment text in this block says *"the **five** call sites"* and enumerates
> *"sites 2 and 6 cannot"*. Both are now **stale**: the authorized X1 follow-up added a sixth
> emitting site, so the shipped comment reads *"the **six** call sites"* and
> *"sites 2, **3** and 6 cannot"*, plus a paragraph classifying Site 3 as
> `reconcileQueuedDispatches`' decline path. **An applier working the amendments in order and
> applying this block verbatim would write `five` and diverge from the tree.**
>
> The governing text is items 9–10, not this block. Everything else in Amendment 1 —
> the signature, the body, the guard, and the X4 rationale — **still stands unchanged and is
> still load-bearing**; only the two counts moved. Marker added in place because every other
> superseded block in this document carries one, and this one did not.

Signature and body unchanged (`reason: AssignmentDecision["reason"]` already satisfied
AR-1E's first refinement). The doc comment through the guard line becomes:

```ts
/**
 * Ensure the timeline records that an execution could not be given an agent and
 * remains queued (ADR-0001 O6). This changes no outcome — the queued execution is
 * the approved behaviour — it supplies the record that was missing, which is what
 * made a declined dispatch indistinguishable from one never requested.
 *
 * Keyed per (execution, attempt): reconciliation retries a stranded execution on
 * every sweep, and one deferral per attempt is the honest count. A genuinely new
 * attempt still records its own.
 *
 * **Only a capacity decline is a deferral, and the guard below is load-bearing.**
 * `execution_not_queued` means the execution is running, succeeded, failed or
 * cancelled — states the timeline already carries via `execution.claimed`,
 * `execution.succeeded` and `execution.exhausted`. Emitting here would be a late,
 * redundant signal about state already recorded, and its message would assert
 * "stays queued" about an execution that had left the queue: an untruth on an
 * append-only timeline, which is the exact defect class X4 removes from the
 * reclaim message.
 *
 * **Deleting the guard therefore reintroduces X4.** It is stated at this length
 * because a guard that makes a helper do nothing for some inputs reads like dead
 * weight to a later simplification pass. It is not: it is the condition the five
 * call sites share, held in one place so they cannot drift apart.
 */
export async function ensureAssignmentDeferredEvent(
  execution: Execution,
  reason: AssignmentDecision["reason"],
): Promise<void> {
  // Do not remove: see the X4 note above. Sites 1, 4 and 5 can reach here with
  // `execution_not_queued`; sites 2 and 6 cannot, being enclosed by a queued
  // check. The guard is what keeps all six uniform at the call site.
  if (reason !== "no_agent_available") return;
```

Remainder from `const attempt = execution.attempt ?? 1;` unchanged.

### Amendment 2 (D2) — §3.2 replaced

**CR-1E identified a flaw in AR-1E's own requirement.** Asserting `lastHeartbeatAt`
equals its prior value is **not sound alone**: `nowIso()` is millisecond-resolution, so
a wrongly-written stamp inside the same millisecond compares equal and passes vacuously.
A sentinel is pinned first, making any write detectable regardless of clock resolution.

FIND (`execution-manager.test.ts` 172-174):
```ts
    // Cannot heartbeat a non-running execution.
    await releaseExecution(execution!.id, makeResult("succeeded"));
    await expect(heartbeat(execution!.id)).rejects.toThrow(/not running/);
```
REPLACE:
```ts
    // A beat that lands after the attempt already finished is absorbed, not an
    // error — and it must be a *silent* no-op: no lease extended, no heartbeat
    // recorded, no status moved. Asserting only that it resolves would swap one
    // weak test for another, which is the X2 failure mode.
    await releaseExecution(execution!.id, makeResult("succeeded"));

    // Pin a recognisable stamp on the released assignment first. Comparing
    // `lastHeartbeatAt` against its previous value would not be sound on its own:
    // nowIso() is millisecond-resolution, so a wrongly-written stamp inside the
    // same millisecond would compare equal and pass vacuously. A sentinel makes
    // any write detectable regardless of clock resolution.
    const releasedAssignment = getAssignment(execution!.assignmentId!)!;
    saveAssignment({
      ...releasedAssignment,
      lastHeartbeatAt: "2026-07-24T20:00:00.000Z",
    });

    const late = await heartbeat(execution!.id);
    expect(late.status).toBe("succeeded");

    const afterLate = getAssignment(execution!.assignmentId!);
    // The two assertions a real write could not survive: heartbeat() sets status
    // to "running" and stamps a fresh lease.
    expect(afterLate?.status).toBe("released");
    expect(afterLate?.leaseExpiresAt).toBeNull();
    // And the field itself, unchanged.
    expect(afterLate?.lastHeartbeatAt).toBe("2026-07-24T20:00:00.000Z");
```
Existing imports only: `getAssignment` (18), `saveAssignment` (22), `releaseExecution`
(13), `makeResult` (local, 48).

### Amendment 3 (D1) — `stood_down` reachability lives in §2.8

**CR-1E's judgement call, stated for override.** `stood_down` is a return value of
`trigger/agent-execution.ts`, which the Execution Manager cannot observe and which no
unit test in this repo exercises. A manager-level assertion would be asserting something
the manager cannot see. What the manager test *can* prove is the precondition — the
compare-and-set returns null and leaves state claimable — and it does.

**3a — pointer comment appended in §2.7(b):**
```ts
    //
    // This is the capacity-1 claim race at the manager boundary, and it proves
    // only the precondition. That the losing *worker* can now reach its
    // stood_down branch is a property of the callback chain and is pinned in
    // agent-execution-service.test.ts, "recovers the loser of a pre-claim race
    // for a capacity-one agent".
```

**3b — insert in §2.8** after `expect(lost.assignmentId).toBe(loserAssignment);`, before
`const lostEvents = ...`:
```ts
      // The worker's own predicate, transcribed from trigger/agent-execution.ts
      // (`claimed.execution?.status === "running" && claimed.execution
      // ?.assignmentId === payload.assignmentId`) and evaluated against what this
      // callback actually returns — the route serialises exactly this object as
      // `{ execution }`.
      //
      // `false` here is the whole behavioural win of F1: the stood_down branch
      // guarded by this predicate was unreachable while the callback threw,
      // because postJson raised on the resulting 500 before the worker could
      // evaluate it. With retries.enabledInDev false the run then died outright.
      const holdsClaim =
        lost.status === "running" && lost.assignmentId === loserAssignment;
      expect(holdsClaim).toBe(false);
```

⚠️ **Limitation recorded by CR-1E, not smoothed over.** This *transcribes* the worker's
predicate; it does not execute the worker. If `trigger/agent-execution.ts:66-68` later
changes, this test keeps passing while the real stand-down breaks. Closing it properly
requires driving the Trigger task against the route — scaffolding that exists for no
task in this repo. **CR-1E recommends a Sprint 1F follow-up rather than growing this
package.** Founder decision.

---

## AR-1E rulings on the flagged deviations

All four items routed to AR-1E as policy owner. **CR-1E upheld on every one.**

### D3 — narrowing ACCEPTED, and the framing corrected in CR-1E's favour

AR-1E verified `execution-manager.ts:439-441` independently and traced which sites can
actually carry `execution_not_queued`:

| Site | Carries it? | Why |
|---|---|---|
| 1 — `agent-execution-service.ts:682-690` | **yes** | replayed dispatch after the canonical execution moved on |
| 2 — `:823-825` | no | enclosed by `if (execution.status === "queued")` at `:817` — provably queued |
| 4 — `review-service.ts:626-631` | **yes** | its own comment says *"or the revision already left the queue"* |
| 5 — `escalation-service.ts:285-290` | **yes** | its own comment says *"or no longer dispatchable at all"* |
| 6 — `:1005-1020` | no | reached only when `status === "queued"` — provably queued |

**AR-1E's correction to the coordinator's framing:** this was **not** CR-1E deviating
from the policy. AR-1E's clause 2 already reads *"stay silent when the outcome is a
redundant or late signal about state already recorded."* `execution_not_queued` means
the execution is running, succeeded, failed or cancelled — states already carried by
`execution.claimed`, `execution.succeeded`, `execution.exhausted`. **The rule already
dictated the narrowing; AR-1E specified five *sites* where it should have specified a
*condition*, and the site list silently dropped the clause it was implementing.** CR-1E
restored it.

AR-1E asked that this be recorded precisely, because *"the reviewer's policy was
contradictory"* and *"the reviewer's shorthand lost his own rule"* have different
implications for how far the rest of its specification should be trusted. **It is the
second.**

Reason-dependent message **rejected** — AR-1E: a single event type whose meaning depends
on a field the reader must separately fetch is the same defect as PE-3, and adding a
second instance inside the patch that fixes audit truthfulness would be self-defeating.
Helper placement upheld: it makes the rule structural rather than a conditional five
callers must each keep getting right.

**Amendments required:** parameter already typed `AssignmentDecision["reason"]` ✅; the
filter comment must state that **removing the guard reintroduces the X4 class of
untruth** (a guard that makes a helper do nothing for some inputs is what a later
"simplification" deletes).

### D1 / D2 — ACCEPTED; AR-1E's guidance was incomplete

AR-1E: *"I named only the service-layer test for F1 and no test at all for F4. That was
a gap in my specification."*

**D1 is sharper than first conveyed.** The comment above
`execution-manager.test.ts:133-137` reads *"Both proposed the only available validation
agent."* It is not an incidental precondition test — **it is the capacity-1 claim race
itself, with the throw pinned as the expected outcome.** The most direct possible
statement that the defect is correct behaviour.

**Requirement on both rewrites:** each must assert the **absorption's post-state**, not
merely that nothing throws. Rewriting to `.resolves` without post-state assertions swaps
one weak test for another — the X2 failure mode. D2 must additionally assert
`lastHeartbeatAt` is untouched. D1's rewrite should carry the assertion that the
**`stood_down` path is now reachable**, the real behavioural win of F1.

### Export asymmetry — UPHELD, do not respecify

AR-1E declined to override CR-1E: *"an export surface should mirror actual
participation, not aesthetic symmetry."* It framed a gratuitous export as AR2-6 running
in reverse — a contract that **overstates** a capability rather than understating one.
Both mislead the next implementer. `ensureClaimLostEvent` stays unexported.

### `assignmentId` guard — SHIP AS SPECIFIED

AR-1E confirms CR-1E's type reading: `handleExecutionRunning`'s `assignmentId` is
optional, so when absent the equality check at `:729-731` is skipped and reaching the
absorption point does **not** establish non-nullness. A non-null assertion would be
unsound.

**Contract widening deferred to AR2-6.** Making `assignmentId` required on the three
callback handlers is the clean fix — the worker always sends it
(`trigger/agent-execution.ts:63,84,90`) — but it is a breaking contract change outside
approved scope, and belongs with `claimExecution`'s return type and `heartbeat`'s
missing parameter as **one port revision, not three**. Recorded onto AR2-6.

---

## Coordinator pre-verification of apply-safety

Every FIND anchor was checked against the working tree before approval. **15 of 16 are
uniquely matched.** One requires care:

⚠️ **`if (execution.status !== "running") {` appears TWICE in `execution-manager.ts`.**

| Line | Function | Error text | Disposition |
|---|---|---|---|
| **564** | `heartbeat` | `cannot heartbeat` | **← patch 3.1 target: absorb** |
| **603** | `releaseExecution` | `cannot release` | **MUST KEEP THROWING — do not touch** |

Line 603 is a different function and a different category: releasing a non-running
execution is caller fault, which the shared policy says stays loud. CR-1E's FIND block
includes the full `cannot heartbeat` message text, so it disambiguates correctly and is
safe to apply verbatim. Recorded because a shortened or re-derived anchor would silently
hit the wrong function and quietly convert a caller-fault throw into an absorption —
exactly the overreach the "only one precondition moves" precision exists to prevent.

## Blast radius (grep-verified by CR-1E)

- `claimExecution` non-test callers: `execution-manager.ts:757`, `dev-execution-runner.ts:27` — only these.
- `runExecution` non-test callers: `agent-execution-service.ts:737`, `dev-execution-runner.ts:47` — only these.
- `ExecutionRunner` implementors: `DevExecutionRunner` only.
- `EXECUTION_EVENT_TYPE` consumers: all member reads. `TERMINAL_EVENT_TYPE` (`:258-262`) is keyed by `Execution["status"]`, **not** event type, so adding two members breaks no exhaustive map. No UI consumer.
- Tests touched: `execution-manager.test.ts`, `agent-execution-service.test.ts`, `dev-execution-runner.test.ts`.
- Untouched by design: `execution-manager.ts:172-186`, ~~`reconcileQueuedDispatches:499`~~ *(removed — Amendment 6, item 2)*, `internal-guard.ts`, all routes, `store.ts`.

> **⟶ Amendment 6 (item 2) — `reconcileQueuedDispatches` is no longer untouched.** The
> authorized follow-up added a deferral emission at its decline site, so it can no longer
> be listed as untouched by design. It is now **Site 3** of six and is specified in
> **Amendment 6 §5**. `execution-manager.ts:172-186`, `internal-guard.ts`, the routes and
> `store.ts` remain untouched.

> **⟶ Amendment 4 — two references in this list have moved; none is an apply target.**
> `agent-execution-service.ts:737` (the `runExecution` call site) is now `:785`, and
> `TERMINAL_EVENT_TYPE (:258-262)` is now `:302-306`. Still exact:
> `execution-manager.ts:757`, `dev-execution-runner.ts:27`, `dev-execution-runner.ts:47`,
> `execution-manager.ts:172-186`.

> **⟶ Amendment 5 (MAJOR-B) — a false claim about `reconcileQueuedDispatches:499` stood
> here and has been removed.** Amendment 4 asserted that `:499` "does not match
> `6301c06`" and that the entry showed a blast-radius number derived from a different
> tree. **That was false, and it was raised outside authorized scope.**
> `reconcileQueuedDispatches:499` names the **decline site** inside that function —
> `if (!decision.assigned || !decision.assignment) continue;` — which sits at `:499` at
> `6301c06`, exactly as `ISSUE_MATRIX.md:94` records it. The `:455` figure is the
> function *declaration*, a different thing. **The original specification was correct
> and this list needs no correction.** (Post-C1 the decline site is at `:543` and the
> declaration at `:499` — the numeric coincidence that produced the false claim.)

> **⟶ Amendment 6 (item 3) — the defence above is SUPERSEDED, not corrected. It was
> right when written.** Read the distinction carefully, because the two readings have
> different consequences and only one is true here — the same distinction AR-1E insisted
> on in the D3 ruling above.
>
> Amendment 5's refutation of Amendment 4's provenance claim **remains valid on its own
> terms and is not withdrawn**: `:499` did name the decline site at `6301c06`,
> `ISSUE_MATRIX.md:94` did record it that way, `:455` was the declaration, and Amendment
> 4's "derived from a different tree" inference was wrong. Every factual statement in
> that block still holds.
>
> What changed is the **design**, not the facts. Amendment 5 concluded *"this list needs
> no correction"* because, under the design then approved, `reconcileQueuedDispatches`
> was deliberately silent — `ISSUE_MATRIX.md:88-95` marks that row **`NO` emit**. A later
> **Founder decision** authorized emitting there. That decision supersedes the
> conclusion; it does not falsify the reasoning that reached it.
>
> **Recording this as an error would retroactively discredit a sound amendment and cast
> doubt on its other rulings — including MAJOR-A, which is load-bearing for C3.** The
> block stands as written, superseded on its conclusion only.

## Risks (CR-1E)

1. Signature widening is the only wide change; any missed call site is a `tsc` failure, not a silent defect.
2. `heartbeat` absorption is unconditional (not gated on a supplied `assignmentId`), per the policy text. Only the test at 3.2 exercises the no-`assignmentId` path.
3. Deferral events add two permanently retained keys per stranded execution to the unbounded `eventKeys` map (CR-1E's F10) — real but unchanged in kind.
4. The 1.9 fixture depends on the provider pin recorded at `execution-manager.ts:485`/`:259`. If a future change stops pinning, `expect(requeued.agentId).toBeNull()` guards against vacuous green.

## Disagreements with the policy's application

**D1** — `execution-manager.test.ts:133-136` also pins the F1 throw; the policy named
only X2b. Commit 2 fails without 2.7(b). Fix specified.

**D2** — `execution-manager.test.ts:172-174` pins the F4 throw; the policy named no
test. Commit 3 fails without 3.2. Fix specified.

**D3 — the one place CR-1E did not apply the instruction literally.** It narrowed the
deferral emission to `reason === "no_agent_available"` *inside the helper*. Several of
the six sites can also produce `"execution_not_queued"` (reachable at
`execution-manager.ts:439-441`); emitting there would put *"it stays queued at attempt
N"* on the timeline for an execution that had **left** the queue — the exact untruth X4
exists to remove. CR-1E judged that literal application contradicts the policy's own
X4 requirement and resolved it in the single place all five sites share. **Flagged, not
absorbed.** Alternative if literal emission is preferred: a reason-dependent message.
CR-1E does not recommend it.

**Judgement call, recorded:** `ensureClaimLostEvent` is not exported, unlike
`ensureAssignmentDeferredEvent` — only this module absorbs a lost claim. Export it if
AR-1E prefers symmetry.

---

## Amendment 4 (SPEC-AMEND-1E) — post-C1 re-anchoring

**Authority:** Founder decision D-2, 2026-07-26. **Author:** SPEC-AMEND-1E, standing in
for CR-1E (unreachable). **Scope: anchors and their descriptions only.** No FIND payload,
no REPLACE payload, no commit plan and no remediation behaviour was changed. Expected end
state remains ~~**22 files, 320 tests**~~ **22 files, 322 tests** *(Amendment 6, item 1)*.

**Method.** Every anchor in C2, C3 and C4 was re-derived independently against the applied
working tree by reading the file and grepping the FIND text — not transcribed from the
report that prompted this amendment. C1's applied hunks were read from `git diff -U0` and
the pre-C1 positions confirmed against `git show 6301c06:<path>`.

**Why this was needed.** The specification's line numbers were all derived at `6301c06`.
C1 is now applied (uncommitted, 5 files, +177/−7), which inserted 44 lines at
`agent-execution-service.ts:193` and 37 lines before the C2/C4 test anchors in
`agent-execution-service.test.ts`. Files C1 did not touch — `execution-manager.ts`,
`execution-manager.test.ts`, `types/contracts/execution-runner.ts`,
`adapters/dev-execution-runner.ts`, `adapters/dev-execution-runner.test.ts` — kept every
one of their anchors exactly.

### Full anchor audit

| § | File | Spec anchor | Verified position | Verdict |
|---|---|---|---|---|
| 2.1 doc | `execution-manager.ts` | 495-503 | 495-503 | ✅ correct |
| 2.1 body | `execution-manager.ts` | 525-529 | 525-529 | ✅ correct |
| 2.2 | `execution-manager.ts` | 748-758 | 748-758 (FIND = 748-749) | ✅ correct |
| 2.3 | `types/contracts/execution-runner.ts` | 57-58, 68 | 57-58, 68 | ✅ correct |
| 2.4 | `adapters/dev-execution-runner.ts` | 26-28, 46-48 | 26-28, 46-48 | ✅ correct |
| 2.5 | `agent-execution-service.ts` | "after the 1.2 block" | after `:235`, before `:237` | ⚠️ made explicit |
| **2.6** | `agent-execution-service.ts` | **737-744** | **785-792** | **🔧 corrected** |
| 2.7(a) | `execution-manager.test.ts` | 109 | 109 | ✅ correct |
| 2.7(b) | `execution-manager.test.ts` | 120, 133-136 | 120, 133-136 | ✅ correct |
| 2.7(c) | `execution-manager.test.ts` | 325 | 325 | ✅ correct |
| 2.7(d) | `adapters/dev-execution-runner.test.ts` | 58-59 | 58-59 | ✅ correct |
| **2.8** | `agent-execution-service.test.ts` | **1474-1476** | **1511-1513** | **🔧 corrected** |
| 2.8 tail | `agent-execution-service.test.ts` | 1478-1506 | 1515-1543 | 🔧 corrected |
| 3.1 doc | `execution-manager.ts` | 548-555 | 548-555 | ✅ correct |
| 3.1 body | `execution-manager.ts` | 564-576 | 564-576 | ✅ correct |
| 3.2 / Am. 2 | `execution-manager.test.ts` | 172-174 | 172-174 | ✅ correct |
| 3.3 imports | `execution-manager.test.ts` | block 16-24, after 24 | 16-24, 24 | ✅ correct |
| **3.3 insert** | `execution-manager.test.ts` | **after 175** | **~202 after §3.2 + imports** | **🔧 corrected → descriptive** |
| **4.1** | `agent-execution-service.ts` | **856-857** | **905-906** | **🔧 corrected** |
| **4.2 insert** | `agent-execution-service.test.ts` | **after 1506** | **1506 is mid-test-body** | **🔧 corrected → descriptive (UNSAFE as written)** |

Amendments 3a and 3b are anchored descriptively inside §2.7(b) and §2.8 respectively and
required no change. The "Coordinator pre-verification" table is **still exact**:
`if (execution.status !== "running") {` is at `execution-manager.ts:564` (`heartbeat`,
absorb) and `:603` (`releaseExecution`, must keep throwing).

### Uniqueness of every FIND target

Confirmed by grep against the applied tree. Each occurs exactly once in its file:

- §2.1 body — `agent.availability !== "available"` → `execution-manager.ts:525` only.
- §2.2 — `/** Start an already-assigned execution ... */` → `:748` only.
- §2.6 — `const execution = await runExecution(executionId);` →
  `agent-execution-service.ts:785` only.
- §2.7(a) — `const running = await claimExecution(execution!.id, "agent-supervisor");`
  (with the `const running =` prefix) → `execution-manager.test.ts:109` only. The bare
  `await claimExecution(...)` form at 133, 152, 163, 182, 198, 206, 230, 247, 276, 290,
  302, 577, 595, 616 discards its result and is not matched.
- §2.7(c) — `const running = await runExecution(execution!.id);` → `:325` only.
- §2.8 — `/not available to claim/` → `agent-execution-service.test.ts:1513` only.
- §3.1 body — disambiguated by the full `cannot heartbeat` message text, per the
  coordinator's pre-verification note. `:564` only.
- §3.2 — `await expect(heartbeat(execution!.id)).rejects.toThrow(/not running/);` →
  `execution-manager.test.ts:174` only.
- §4.1 — `await reconcileRecordsFor(current);` → `agent-execution-service.ts:905` only.
- §2.3, §2.4, §2.7(d) — single-occurrence signatures in 61-82-line files.

### Newly-found items, not in the brief that prompted this amendment

1. **§2.5's anchor was descriptive but unstated** ("after the 1.2 block"). It resolves
   correctly *because* C1 is applied, but a reader applying C2 against an unapplied tree
   would have had nothing to match. Now stated structurally.
2. **§2.8's "Remainder of that test (1478-1506)"** is a fourth stale reference, beyond the
   three named. Corrected to `1515-1543`.
3. ~~**Blast radius `reconcileQueuedDispatches:499`** does not match `6301c06` (it was
   `:455` there; `:499` is its post-C1 position). Non-load-bearing; recorded above.~~
   **WITHDRAWN by Amendment 5 (MAJOR-B) — the claim was false and was raised outside
   authorized scope.** `:499` correctly names the decline site at `6301c06`, as
   `ISSUE_MATRIX.md:94` records; `:455` is the function declaration. The original
   specification was right.
4. **§2.7's "No change needed" list is incomplete, not wrong.** It omits
   `execution-manager.test.ts` 163, 182, 198 and 206, which also call `claimExecution`
   and also need no change. Every line it *does* name was verified to exist and to
   discard its result. No action required.
5. ~~**Cosmetic, out of scope:** C1 left a double blank line at
   `agent-execution-service.test.ts:35-36`. Flagged, not fixed — this amendment touches
   no source file.~~
   **CORRECTED by Amendment 5 (MINOR-A) — the attribution to C1 was false, and the item
   was raised outside authorized scope.** The double blank line is **pre-existing at
   `6301c06`**: lines `35-36` are already blank there, between
   `const FAR_FUTURE = …` and `function seedTask(…)`. **C1 did not create it.** No
   source file was touched then or now.

### The five apply-safety criteria

1. **Every FIND target is unique in its file** — grep-confirmed above.
2. **Every insertion point is outside existing test bodies** — §2.5 is module scope;
   §3.3 sits between two sibling `it(...)` calls; §4.2 sits between a test's closing
   `});` and its `describe`'s closing `});`. §4.2 did **not** satisfy this before.
3. **Surrounding context matches the current tree** — every quoted FIND block was
   re-read from the applied working tree during this amendment.
4. **No line-number-only target remains** — §3.3's and §4.2's insertions are now
   structural; §2.5's is structural; every other anchor carries matchable FIND text and
   the line number is corroboration only.
5. **Literal application modifies only the intended region** — follows from 1 and 2.

### Applier's note

**Prefer the FIND text over every line number in this document.** The numbers are
corroboration; the text and the structural descriptions are the contract. C2 shifts
`agent-execution-service.test.ts` again (§2.8 replaces 3 lines with ~42) before C4 reads
it, so any number restated for C4 would be stale a third time by the time it is used.

### Not verified

- This amendment did **not** run `npx tsc --noEmit`, `npx eslint .` or `npx vitest run`,
  and made **zero source-code changes**. The gate checks remain the applier's step after
  each commit.
- Whether the C2/C3/C4 *payloads* are behaviourally correct was out of scope and was not
  re-reviewed. Only where they attach was examined.
- The Amendment 3b limitation stands unchanged: it transcribes
  `trigger/agent-execution.ts:66-68` rather than executing the worker. Those lines were
  re-read and **still match the transcription verbatim**, as do the payload's `:63`,
  `:84` and `:90` references.

---

## Amendment 5 (SPEC-AMEND-1E) — authorized corrections to Amendment 4

**Authority:** Founder, 2026-07-26, following D-2. **Author:** SPEC-AMEND-1E.
**Scope: exactly three corrections. No other specification content changed.**

Amendment 4 introduced one blocking defect and two false statements. All three are
corrected here. **Amendment 5 supersedes Amendment 4 wherever they disagree** — in
particular, Amendment 4's audit table row marking §3.3's import anchors *"✅ correct"* is
**superseded and wrong**; see MAJOR-A. That table is left as the dated record of what
Amendment 4 concluded, not as current guidance.

| ID | Defect | Section | Status |
|---|---|---|---|
| **MAJOR-A** | §3.3's import instruction was line-number-dependent and self-conflicting; it produced invalid TypeScript and blocked C3 | §3.3 | **Corrected** |
| **MAJOR-B** | False provenance claim about `reconcileQueuedDispatches:499`, raised outside authorized scope | Blast radius; Amendment 4 item 3 | **Removed** |
| **MINOR-A** | False attribution of a pre-existing double blank line to C1, raised outside authorized scope | Amendment 4 item 5 | **Corrected** |

**Deliberately NOT resolved:** MINOR-2, the untested `released` heartbeat branch
(Risk 2 above). It stays open by Founder decision. No other finding was resolved, and
~~remediation scope was not broadened.~~

> **⟶ Amendment 6 (item 4) — superseded.** Remediation scope **was** broadened after
> Amendment 5, **by Founder authorization**: a sixth deferral emission site was added at
> `reconcileQueuedDispatches`' decline, with two accompanying tests. That was an
> authorized scope change, not an unauthorized one, and Amendment 5's statement was true
> when written. It is superseded rather than corrected. The broadening is specified in
> **Amendment 6 §5**.

### MAJOR-A — why the old instruction was unsafe, and proof the new one is not

The two halves of §3.3's import edit could invalidate each other. Amendment 4 directed
`saveExecution` between lines `22` and `23` **and** the constants import *"after line
24"*. The first edit shifts `} from "@/lib/dev-hq/store";` from `:24` to `:25`, so the
second then lands **inside the braces**, between `saveTask,` and the closing brace.

Both halves are now anchored on text, not position: one targets a point between two named
specifiers inside the braces, the other the line after the block's closing
`} from "@/lib/dev-hq/store";` statement. Neither can move the other's target.

**Verified by construction, not by argument.** Both halves were applied to a scratchpad
copy of `execution-manager.test.ts` in each order and the results compared, then all three
files were parsed with the project's own TypeScript 5.9.3
(`node_modules/typescript/bin/tsc`):

| File | Order applied | Result |
|---|---|---|
| `orderA.ts` | placement → insertion | **No syntax errors.** 5 diagnostics, all `TS2307` module-not-found (expected: `@/` path mapping is unavailable to a standalone file) |
| `orderB.ts` | insertion → placement | **Byte-identical to `orderA.ts`** (SHA-256 `0853CBEC…`). Same 5 `TS2307`, no syntax errors |
| `oldInstruction.ts` *(control — Amendment 4's text)* | placement → "after line 24" | **`TS1003` Identifier expected; `TS1005` ',' expected; `TS1005` ';' expected; `TS1128` Declaration or statement expected; `TS1434` Unexpected keyword or identifier** — all at `:25-26` |

The control confirms the defect was real and would have failed `npx tsc --noEmit`. The
corrected instruction is order-independent and parses clean. Resulting import region:

```ts
import {
  getAgent,
  getAssignment,
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveAssignment,
  saveExecution,
  saveTask,
} from "@/lib/dev-hq/store";
import { MAX_EXECUTION_ATTEMPTS } from "@/lib/dev-hq/constants";
```

No source or test file was modified: the scratchpad copies live outside the repository
and were used only to parse.

### Standing correction to Amendment 4's method

MAJOR-B and MINOR-A share one failure mode, recorded so it is legible rather than buried:
**both inferred a cause from the post-C1 tree without checking the base at `6301c06`.**
MAJOR-B is the sharper case — post-C1 the `reconcileQueuedDispatches` *declaration* moved
to `:499`, the very number the specification cited for the *decline site*, so a grep for
the declaration returned an apparent confirmation of a discrepancy that did not exist.
A numeric coincidence produced by the same shift that was being audited.

Neither item was within Amendment 4's authorized scope. Both are withdrawn.

---

## Amendment 6 (SPEC-AMEND-1E) — restore reproducibility of the shipped candidate

**Authority:** Founder decision, 2026-07-26 ~11:55 local. **Scoped by:** CR-FULL-1E.
**Applier of the specification change:** SPEC-AMEND-1E. **Applier of the code:** coordinator.
**Scope:** 12 items. No source or test file is modified by this amendment.

### Item 8 — authority and sequencing, recorded because the record is confusing without it

The follow-up **landed during an active independent review.** That is load-bearing, not
colour. A future auditor reading CR-FULL-1E's report will find it citing frozen hashes that
match no artifact in the tree, and — absent this note — could reasonably conclude the review
was fabricated. It was not. The sequence was:

1. C1→C4 applied and frozen.
2. Independent review opened against that freeze.
3. **Mid-review**, the Founder authorized a sixth deferral emission site
   (`reconcileQueuedDispatches`) plus two tests. Applied by the coordinator.
4. Re-frozen as `CANDIDATE_FINAL_FREEZE.md`.
5. **After that freeze**, the Founder separately authorized the source-comment corrections
   (Amendment 6 items 9-10), applied by the coordinator — which moved
   `agent-execution-service.ts` again. See item 7.

Each hash in the record is therefore correct **for the moment it was taken**. None was
fabricated; they are simply not all hashes of the same tree.

### Item 7 — freeze on the record, and the divergence that must not be papered over

`CANDIDATE_FINAL_FREEZE.md` records the post-follow-up candidate as:

| Artifact | Recorded hash |
|---|---|
| Full-candidate diff (`CANDIDATE_FINAL_FREEZE.md:17`) | `ffc805f60c404d8f8daafa9afb47cada263623e5e82b3d3dd378af4b6d4549b5` |
| `lib/dev-hq/agent-execution-service.ts` (`:120`) | `51ebbc2e0f9eaa9674825de894703791d82626035f806e12e5243c0586bf4af7` |
| `lib/dev-hq/agent-execution-service.test.ts` | `0dca1f03d5e91660f1efc97d87da43397554b20973d052627684e9e545fa1b5c` |

**Two of those three no longer match the working tree**, because items 9-10 were applied
after the freeze was taken:

| Artifact | Frozen | Current | Status |
|---|---|---|---|
| Full-candidate diff | `ffc805f6…` | **`f6bfbc5876965f62ed1f81d15db5735d09502a4942606042afee1817e3e4fd66`** | **diverged** |
| `agent-execution-service.ts` | `51ebbc2e…` | **`8ae02cdae14d…`** | **diverged** (items 9-10) |
| `agent-execution-service.test.ts` | `0dca1f03…` | **`89d5dd7b7c92…`** | **diverged** (§5(a) rewrite) |

**Affirmative statement, verified file-by-file against the freeze table:** the **other eight**
files are **byte-identical** to `CANDIDATE_FINAL_FREEZE.md` — `constants.ts` `7c10c0a7…`,
`escalation-service.ts` `6231cbab…`, `review-service.ts` `284b97d2…`, `execution-manager.ts`
`f5857d41…`, `execution-manager.test.ts` `77cac31b…`,
`types/contracts/execution-runner.ts` `765a7ea1…`, `adapters/dev-execution-runner.ts`
`bc7eab76…`, `adapters/dev-execution-runner.test.ts` `d9418f68…`. **Only the two
`agent-execution-service` files moved.** That is the cheapest available proof that the
follow-up and the subsequent corrections altered no unrelated behaviour.

> **⚠️ The tree moved twice *during* this amendment, and may move again.** When Amendment 6
> began, `agent-execution-service.test.ts` matched the freeze at `0dca1f03…` and the
> full-candidate diff was `160d7af4…`. Mid-amendment, §5(a)'s test was renamed and rewritten
> — from *"attributes the requeue deferral to the reclaim loop, not the sweep"* to
> *"emits the requeue deferral from the reclaim loop, before the sweep runs"*, replacing a
> routing-strip discriminator with an append-order one — moving the test file to
> `89d5dd7b7c92…` and the diff to `f6bfbc58…`. **The test count did not change: 322 before
> and after**, so item 1's figure is unaffected.
>
> **Every hash in this section is a reading taken at one instant of a tree under active
> concurrent edit.** Verify against the tree at read time rather than trusting these values.
> This is the same hazard item 8 documents, occurring again while the amendment recording it
> was being written.

> **Not verified, stated rather than glossed:** the brief scoping this amendment asked for an
> affirmation that *"the other eight per-file hashes are unchanged **from the C1–C4
> freeze**."* **No C1–C4 per-file hash table exists in the repository** —
> `CANDIDATE_C1_FREEZE.md` carries only a passing reference to `51ebbc2e…` at `:80`, not a
> table. The nine-file affirmation above is therefore made against
> `CANDIDATE_FINAL_FREEZE.md`, which is what can actually be checked. **A re-freeze is
> required** to bring the recorded diff hash back into agreement with the tree; that is a
> coordinator action, not a specification change.

### Item 5 — §5, the sixth emission site *(the load-bearing item)*

Before this block, the shipped code had **no specifying entry anywhere in the contract**, so
the specification could not re-derive the tree. §5 closes that.

**Anchored structurally, per this document's own applier's note: text and structure are the
contract; line numbers are corroboration.**

**Target:** inside `async function reconcileQueuedDispatches(now?: string)` — declared at
`agent-execution-service.ts:531` in the current tree, `:455` at `6301c06` — at the
`ensureAssignment` decline immediately following the `if (!execution.routing) continue;`
guard, inside the `if (!assignmentId || !agentId) {` branch.

FIND:
```ts
      if (!decision.assigned || !decision.assignment) continue;
```
REPLACE:
```ts
      if (!decision.assigned || !decision.assignment) {
        // X1's surviving path. Without this the sweep re-observes a stranded
        // execution every cycle and records nothing, leaving it queued with a
        // null agent, an unchanged attempt, and an empty timeline — the exact
        // state that made a declined dispatch indistinguishable from one never
        // requested. Outcome is unchanged: it still stays queued and this still
        // continues. Only the missing record is supplied.
        //
        // Idempotency is the emitter's existing per-(execution, attempt) dedupe
        // key, so repeat sweeps no-op rather than appending one entry per cycle.
        await ensureAssignmentDeferredEvent(execution, decision.reason);
        continue;
      }
```

No import change: `ensureAssignmentDeferredEvent` is declared in this same module (§1.2).

**Site classification — verified, and it settles the coordinator's open finding.** This site
**cannot** carry `execution_not_queued`, so it belongs with Sites 2 and 6, not with 1/4/5.
Two independent structural facts establish it:

1. The enclosing `for` loop opens with `if (execution.status !== "queued") continue;`, so the
   execution is provably queued on entry.
2. Nothing between that guard and the decline can move it out of `queued`. The only mutation
   on the path is `releaseAssignmentForReassignment`, which itself **throws** unless the
   execution is queued and preserves `status` — it nulls `agentId`, `assignmentId` and
   `triggerRunId` only (`execution-manager.ts:711-740`).

**Two accompanying tests**, both in `describe("queued execution recovery", …)` of
`agent-execution-service.test.ts`, anchored structurally:

**§5(a)** — INSERT immediately after the closing `});` of
`it("records a reclaimed attempt that no agent could take", …)` and immediately before
`it("leaves a dispatched assignment alone inside its claim deadline", …)`:

```ts
    it("emits the requeue deferral from the reclaim loop, before the sweep runs", async () => {
```
…which discriminates the reclaim loop from the sweep **by append order, not by capacity.**
Both sites decline for the same reason in the same sweep and share a dedupe key, so a
`toHaveLength(1)` assertion is satisfied by either and cannot detect deletion of the reclaim
loop's emission. The test strands **two** executions on different capabilities, withdraws all
capacity and the pinned provider, then asserts
`Math.min(...deferralIdx) < Math.max(...reclaimedIdx)` over the reversed event log: the
reclaim loop emits each deferral immediately after that execution's own `reclaimed` event, so
the deferrals **interleave**. If the reclaim loop's call is deleted, both deferrals are
written later by `reconcileQueuedDispatches` — after every `reclaimed` event — and the
assertion inverts. Full payload as shipped; see the tree.

**§5(b)** — INSERT immediately after the closing `});` of
`it("leaves a dispatched assignment alone inside its claim deadline", …)` and immediately
before `it("does not sweep founder-request executions", …)`:

```ts
    it("records the deferral when a claim-deadline release finds no agent", async () => {
```
…driving a dispatched-but-never-claimed execution past its claim deadline with every agent
busy, asserting one deferral, then sweeping twice more to prove the per-(execution, attempt)
dedupe key holds the count at one and leaves `attempt` untouched.

### Item 12 — the five apply-safety criteria applied to §5

1. **FIND uniqueness — satisfied at the re-derivation baseline, and moot in the current
   tree.** `if (!decision.assigned || !decision.assignment) continue;` occurs **exactly
   once** across `lib/` and `types/` at `6301c06` (`agent-execution-service.ts:499`), so the
   patch re-derives unambiguously. In the current tree the anchor is **already consumed** —
   the two surviving occurrences of the predicate (`:575`, `:770`) are both the braced form —
   so uniqueness is moot for a re-apply and load-bearing only for re-derivation.
2. **Insertion point outside existing test bodies** — both tests sit between sibling `it(...)`
   calls inside `describe("queued execution recovery", …)`.
3. **Surrounding context matches the tree** — FIND and both anchor titles re-read from the
   working tree during this amendment.
4. **No line-number-only target** — the source anchor is named by enclosing function, guard
   and predicate; both tests by neighbouring test titles.
5. **Literal application modifies only the intended region** — follows from 1 and 2.

### Item 6 — C1's X1 coverage was incomplete

The commit-plan table assigns *"AR2-1 / X1 deferral events"* to C1. **C1 did not fully close
X1.** It supplied five emission sites and left the `reconcileQueuedDispatches` decline
silent, which is the path a stranded execution actually re-enters on every sweep — so the
timeline stayed empty in exactly the case X1 was raised about. The shipped test at §5(b)
names that gap in its own comment: *"X1's surviving path: the timeline used to be empty here,
so this was indistinguishable from a dispatch that was never requested."* **The follow-up
completes X1; C1 alone did not.** (`CANDIDATE_C1_FREEZE.md:52` was corrected separately by the
coordinator; the specification carried the claim independently and is corrected here.)

### Items 9-10 — source comment corrections, applied by the coordinator, recorded for consistency

Not applied by this amendment; noted so Amendment 6 does not contradict them. Both are
**already present in the tree** and both are consistent with §5's classification above:

- `agent-execution-service.ts:214` now reads *"the **six** call sites"* (was *"five"*).
- `:221-228` now enumerates *"Sites 1, 4 and 5 can reach here with `execution_not_queued`;
  sites 2, 3 and 6 cannot"*, and adds a paragraph placing Site 3 explicitly.

**The coordinator's open finding is CONFIRMED by independent verification** — see the two
structural facts under Item 5. The new site belongs with Sites 2 and 6. The applied comment
already states exactly that, so no further correction is required.

### A6.1 — test-count derivation (item 1)

Counted, not assumed. `it(` at line start across all 22 `*.test.ts` files, no
`it.skip`/`it.only`/`it.each`/`it.todo` anywhere in the repository:

| Tree | Files | Tests |
|---|---|---|
| `6301c06` (baseline) | 22 | **317** |
| Candidate | 22 | **322** |

Delta **+5**: `agent-execution-service.test.ts` 53→57, `execution-manager.test.ts` 36→37.

| # | Test | Origin |
|---|---|---|
| 1 | `records a reclaimed attempt that no agent could take` | C1 §1.9 |
| 2 | `absorbs a heartbeat for an attempt reclaimed underneath it` | C3 §3.3 |
| 3 | `requests the review on a re-entered completion callback` | C4 §4.2 |
| 4 | `emits the requeue deferral from the reclaim loop, before the sweep runs` | **follow-up §5(a)** |
| 5 | `records the deferral when a claim-deadline release finds no agent` | **follow-up §5(b)** |

`records a deferral when no eligible agent is available` (X2) and `refuses a second claim on
the same agent (compare-and-set)` (D1) are **rewrites of existing tests, not additions** — the
original `320 = 317 + 3` accounting was right about that and it is unchanged.

> **The follow-up added TWO tests, not one.** The scoping brief for this amendment specified
> `321` / `317 + 4`. That is off by one against the tree. Item 1's own rationale — *"partial
> fixing reproduces the original defect"* — applies to itself: writing `321` would leave the
> specification unable to reproduce the candidate, which is the defect item 1 exists to close.
> **`322` is what the tree contains.**

### A6.2 — site numbering, reconciled (item 11)

Two schemes were live in one document and collided on `3`. **The canonical scheme is
AR-1E's, which is also what the shipped source comment uses.** The schemes agree on 1, 2, 4
and 5 and differed only on the reclaim loop.

| Canonical site | Location | Carries `execution_not_queued`? | Legacy §1.x label |
|---|---|---|---|
| 1 | `agent-execution-service.ts` dispatch decline | **yes** | Site 1 (§1.3) |
| 2 | `agent-execution-service.ts` retry, no capacity | no — enclosed by a queued check | Site 2 (§1.4) |
| **3** | **`reconcileQueuedDispatches` decline** | **no — enclosed by a queued check** | **none (new; §5)** |
| 4 | `review-service.ts` | **yes** | Site 4 (§1.6) |
| 5 | `escalation-service.ts` | **yes** | Site 5 (§1.7) |
| 6 | `agent-execution-service.ts` reclaim loop | no — enclosed by a queued check | ~~Site 3~~ (§1.5) |

**Only §1.5 was mislabelled**, and it is annotated in place. The new site occupies the gap
AR-1E's ruling table left between 2 and 4 — which is why `3` was free in one scheme and taken
in the other. **Do not conflate this six-site list with `ISSUE_MATRIX.md:88-95`**, which is a
six-**row candidate** table whose row 3 (`execution-manager.ts:172-186`) is marked **`NO`
emit** for Execution Manager purity. Different lists, same cardinality — a trap that has
already caught two readers.
