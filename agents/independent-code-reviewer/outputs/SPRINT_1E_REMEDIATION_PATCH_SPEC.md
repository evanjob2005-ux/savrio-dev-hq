# CR-1E — Sprint 1E Remediation Patch Specification

**Status:** COMPLETE SPECIFICATION. Awaiting Founder approval. **Not applied.**
**Specifier:** CR-1E (read-only). **Applier:** coordinator. **Architecture review:** AR-1E.
**Independence:** CR-1E never saw AR-1E's policy before this assignment, so these
patches are not AR-1E reviewing its own design.

All "existing text" blocks were re-read from the working tree during specification;
none reconstructed from memory. Blast radius grep-verified, not assumed.

---

## Commit plan

| Commit | Contents |
|---|---|
| C1 | AR2-1 / X1 deferral events + X3 + X4 + X2 test rewrite + X3/X4 regression |
| C2 | F1 claim-race absorption + signature widening + X2b + D1 test fix |
| C3 | F4 heartbeat absorption + D2 test fix + F4 regression |
| C4 | AR2-4 review-on-re-entry + regression |

Apply C1 → C2 → C3 → C4. Each independently green. After **each**: `npx tsc --noEmit`,
`npx eslint .`, `npx vitest run`. After C4 only: `npx next build`.

**Expected end state: 22 files, 320 tests** (317 + 3 added; X2 and X2b are rewrites).

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

### 1.5 Site 3 + X3 + X4 — reclaim loop (996-1020)

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

⚠️ **CR-1E marked UNCERTAIN:** `getAgent` is imported (line 19) but the enclosing
`describe` was not checked for a narrower scope conflict. If shadowed, use
`getDevHqStore().agents.get("agent-supervisor")!`. `tsc` surfaces it either way.

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

INSERT after the 1.2 block:
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

### 2.6 `handleExecutionRunning` absorbs (737-744)

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

### 2.8 X2b — `agent-execution-service.test.ts:1474-1476`

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
Remainder of that test (1478-1506) unchanged — still asserts claim-deadline recovery.

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

Add `saveExecution` to the store import block (16-24), and after line 24 add:
```ts
import { MAX_EXECUTION_ATTEMPTS } from "@/lib/dev-hq/constants";
```

INSERT after the test closing at line 175:
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

### 4.1 `agent-execution-service.ts` (856-857)

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

INSERT after the test closing at line 1506:
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
- Untouched by design: `execution-manager.ts:172-186`, `reconcileQueuedDispatches:499`, `internal-guard.ts`, all routes, `store.ts`.

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
