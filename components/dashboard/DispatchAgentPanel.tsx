"use client";

// Simulation Lab control: manually dispatch a task to an agent through the
// Execution Manager. The dispatch runs via a Server Action (dispatchAgentExecution
// Action), so the internal callback token stays server-side and is never sent to
// the browser. Simulated agents produce deterministic outcomes — include "fail" or
// "timeout" in the instructions to exercise those paths (ADR-0001 O1/O4).
//
// A dispatch request carries a durable identity so an ambiguous response, a
// reload, or a retry from another tab recovers the same execution instead of
// creating a second one. The execution and its evidence surface here from
// GET /api/dev-hq/state.

import { useEffect, useMemo, useState } from "react";
import { Panel, StatusDot } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import {
  AVAILABILITY_STATUS,
  EXECUTION_STATUS,
} from "@/lib/mission-control/status";
import { useDevHqState } from "@/lib/mission-control/useDevHqState";
import {
  clearPendingDispatch,
  dispatchKeyFor,
  readPendingDispatches,
  writePendingDispatch,
  type PendingDispatch,
} from "@/lib/mission-control/pending-dispatch";
import {
  dispatchAgentExecutionAction,
  type DispatchActionResult,
} from "@/lib/dev-hq/actions";

type Feedback =
  | { kind: "success"; message: string }
  | { kind: "no-agent"; message: string }
  | { kind: "error"; message: string };

function toFeedback(
  outcome: DispatchActionResult,
  agentNameById: Map<string, string>,
): Feedback {
  if (!outcome.ok) {
    return { kind: "error", message: outcome.error };
  }
  const { result } = outcome;
  if (!result.assigned) {
    return {
      kind: "no-agent",
      message:
        result.reason === "execution_not_queued"
          ? `This dispatch has already run. Execution ${result.executionId} is no longer queued.`
          : "No available agent matched. Every capable agent is busy, none has the required capabilities, or the routed provider is unavailable.",
    };
  }
  const agentName = result.agentId
    ? (agentNameById.get(result.agentId) ?? result.agentId)
    : "an agent";
  return {
    kind: "success",
    message: `Dispatched to ${agentName}. Execution ${result.executionId} · Trigger run ${result.triggerRunId}.`,
  };
}

export function DispatchAgentPanel() {
  const feed = useDevHqState();
  const { state, refresh } = feed;

  const [taskId, setTaskId] = useState("");
  const [capabilities, setCapabilities] = useState("");
  const [preferredAgentId, setPreferredAgentId] = useState("");
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [dispatchedExecutionId, setDispatchedExecutionId] = useState<string | null>(
    null,
  );
  /**
   * Every dispatch request the server has not confirmed resolved, one per task.
   * Held in durable browser storage, not just in memory, so identities survive an
   * ambiguous response, a reload, a closed tab, or a retry from another tab — and
   * so starting a request for one task never discards another task's. Re-sending
   * an identity converges on the same execution; an entry is dropped only when the
   * server resolves it or the founder explicitly discards it.
   */
  const [pending, setPending] = useState<PendingDispatch[]>([]);

  // Subscribe to the stored request identity: restore it after a reload and keep
  // it in step when another tab resolves or starts one. Reading it here rather
  // than during render keeps the server-rendered markup and the first client
  // render identical.
  useEffect(() => {
    const sync = () => {
      const restored = readPendingDispatches();
      setPending(restored);
      if (restored.length > 0) {
        setTaskId((current) => current || restored[0].taskId);
      }
    };
    sync();
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  function rememberPending(next: PendingDispatch): void {
    writePendingDispatch(next);
    setPending(readPendingDispatches());
  }

  function resolvePending(taskId: string): void {
    clearPendingDispatch(taskId);
    setPending(readPendingDispatches());
  }

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of state?.agents ?? []) map.set(agent.id, agent.name);
    return map;
  }, [state?.agents]);

  const tasks = state?.tasks ?? [];
  const roster = state?.agents ?? [];
  const availableAgents = roster.filter(
    (agent) => agent.availability === "available",
  );

  const heldForTask = pending.find((entry) => entry.taskId === taskId) ?? null;
  const otherHeld = pending.filter((entry) => entry.taskId !== taskId);

  // The dispatched execution and its evidence, straight from the live state feed.
  const dispatchedExecution = dispatchedExecutionId
    ? (state?.executions ?? []).find((e) => e.id === dispatchedExecutionId) ?? null
    : null;
  const dispatchedEvidence = dispatchedExecutionId
    ? (state?.evidence ?? []).filter((e) => e.executionId === dispatchedExecutionId)
    : [];

  /**
   * Issue a dispatch under a specific request identity. Used for both the first
   * submission and a recovery: re-sending the same key cannot duplicate work, so
   * recovery is simply the same call again.
   */
  async function runDispatch(request: PendingDispatch): Promise<void> {
    setSubmitting(true);
    setFeedback(null);

    const requiredCapabilities = capabilities
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    // Persist the identity *before* the request leaves, so a failure that never
    // returns still leaves something to recover with.
    rememberPending(request);

    try {
      const outcome = await dispatchAgentExecutionAction({
        taskId: request.taskId,
        requiredCapabilities:
          requiredCapabilities.length > 0 ? requiredCapabilities : undefined,
        preferredAgentId: preferredAgentId || undefined,
        instructions: instructions.trim() || undefined,
        idempotencyKey: request.key,
      });
      // Only a *resolved* answer retires the identity. A service failure after
      // the canonical execution was created is ambiguous, so the identity is
      // kept and the founder can resume onto the very same execution.
      if (outcome.resolved) resolvePending(request.taskId);
      setFeedback(toFeedback(outcome, agentNameById));
      setDispatchedExecutionId(
        outcome.ok ? outcome.result.executionId : outcome.executionId,
      );
    } catch {
      // The action itself never returned. Identical treatment: keep the identity
      // so a resume — even after a reload or in another tab — converges on it.
      setFeedback({
        kind: "error",
        message:
          "Dispatch did not return a result. The request was kept, so resuming it recovers the same execution instead of creating a second one.",
      });
    } finally {
      setSubmitting(false);
      void refresh();
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!taskId) return;
    // Reuse the unresolved identity for this task; otherwise start a new one.
    await runDispatch(dispatchKeyFor(taskId, pending, () => crypto.randomUUID()));
  }

  const feedbackColor =
    feedback?.kind === "success"
      ? "var(--ok)"
      : feedback?.kind === "no-agent"
        ? "var(--warn)"
        : "var(--err)";

  return (
    <Panel
      title="Dispatch to Agent"
      subtitle="Triggers a real durable agent-execution run (simulated agent)"
      right={<DataSourceBadge source="live" />}
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">Task</span>
          <select
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            required
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
          >
            <option value="">Select a task…</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>
                {task.title} ({task.id})
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">
            Required capabilities <span className="text-[var(--text-faint)]">(optional, comma-separated)</span>
          </span>
          <input
            value={capabilities}
            onChange={(e) => setCapabilities(e.target.value)}
            list="dispatch-capabilities"
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
            placeholder="e.g. validation, review"
          />
          {/*
            ADR-0001 O3's frozen Phase 1 capability vocabulary, mirrored here
            because importing lib/dev-hq/constants would pull next/server into the
            client bundle. `dispatch-capabilities.test.ts` asserts this list stays
            identical to AGENT_CAPABILITIES, so the UI can never offer a capability
            no seeded agent can satisfy.
          */}
          <datalist id="dispatch-capabilities">
            {["routing", "sequencing", "escalation", "implementation", "review", "corrections", "qa", "accessibility", "gates", "validation"].map(
              (capability) => (
                <option key={capability} value={capability} />
              ),
            )}
          </datalist>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">
            Preferred agent <span className="text-[var(--text-faint)]">(optional)</span>
          </span>
          <select
            value={preferredAgentId}
            onChange={(e) => setPreferredAgentId(e.target.value)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
          >
            <option value="">Least recently active eligible agent</option>
            {roster.map((agent) => (
              <option
                key={agent.id}
                value={agent.id}
                disabled={agent.availability !== "available"}
              >
                {agent.name} — {AVAILABILITY_STATUS[agent.availability].label}
              </option>
            ))}
          </select>
          <span className="text-[10.5px] leading-relaxed text-[var(--text-faint)]">
            Used only when that agent is available and matches the required
            capabilities; otherwise normal selection applies. The choice is
            persisted as the routing policy, so retries reproduce it.
          </span>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">
            Instructions <span className="text-[var(--text-faint)]">(optional)</span>
          </span>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={2}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
            placeholder="Defaults to the task description. Include 'fail' or 'timeout' to simulate those outcomes."
          />
        </label>

        <p className="text-[10.5px] leading-relaxed text-[var(--text-faint)]">
          {availableAgents.length} agent{availableAgents.length === 1 ? "" : "s"} available now.
          Simulated outcome is derived from the instructions: “fail” → failed, “timeout” → timeout, otherwise succeeded.
        </p>

        {heldForTask && !submitting ? (
          <div
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
            role="status"
          >
            <p className="text-[11.5px] leading-relaxed text-[var(--text-dim)]">
              An unresolved dispatch request for{" "}
              <span className="font-mono text-[10.5px]">{heldForTask.taskId}</span>{" "}
              is being held. Resuming re-sends the same request, so it recovers that
              execution instead of creating a second one.
              {otherHeld.length > 0
                ? ` ${otherHeld.length} other unresolved request${
                    otherHeld.length === 1 ? "" : "s"
                  } (${otherHeld
                    .map((entry) => entry.taskId)
                    .join(", ")}) are held separately.`
                : ""}
            </p>
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => void runDispatch(heldForTask)}
                className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-[12px] text-[var(--text)]"
              >
                Resume request
              </button>
              <button
                type="button"
                onClick={() => resolvePending(heldForTask.taskId)}
                className="rounded-lg px-3 py-1.5 text-[12px] text-[var(--text-faint)]"
              >
                Discard and start new
              </button>
            </div>
          </div>
        ) : null}

        {feedback ? (
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: feedbackColor }}
            role={feedback.kind === "error" ? "alert" : "status"}
          >
            {feedback.message}
          </p>
        ) : null}

        <button
          type="submit"
          disabled={submitting || !taskId || tasks.length === 0}
          className="rounded-lg px-4 py-2 text-[13px] font-medium text-[var(--bg)] disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Dispatching…" : "Dispatch to Agent"}
        </button>

        {tasks.length === 0 ? (
          <p className="text-[11px] text-[var(--text-faint)]">
            No tasks yet. Submit a founder request above to create one.
          </p>
        ) : null}
      </form>

      {dispatchedExecution ? (
        <div className="mt-3 border-t border-[var(--border)] pt-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.06em] text-[var(--text-faint)]">
              Last dispatch
            </h3>
            <DataSourceBadge source="live" />
          </div>
          <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-[var(--text-dim)]">
            <StatusDot
              color={EXECUTION_STATUS[dispatchedExecution.status].color}
              size={5}
            />
            {EXECUTION_STATUS[dispatchedExecution.status].label} · attempt{" "}
            {dispatchedExecution.attempt ?? 1}
            <span className="font-mono text-[10px] text-[var(--text-faint)]">
              {dispatchedExecution.id}
            </span>
          </p>
          {dispatchedEvidence.length === 0 ? (
            <p className="mt-1.5 text-[10.5px] text-[var(--text-faint)]">
              No evidence recorded yet. Outcome and agent output appear here once the
              run reports back.
            </p>
          ) : (
            <ul className="savrio-scroll mt-1.5 flex max-h-[220px] flex-col gap-1.5 overflow-y-auto" role="list">
              {dispatchedEvidence.map((evidence) => (
                <li
                  key={evidence.id}
                  className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
                >
                  <span className="block text-[11.5px] font-medium text-[var(--text)]">
                    {evidence.label}
                  </span>
                  <p className="mt-0.5 whitespace-pre-wrap break-words text-[10.5px] leading-snug text-[var(--text-dim)]">
                    {evidence.summary}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </Panel>
  );
}
