"use client";

// Simulation Lab control: manually dispatch a task to an agent through the
// Execution Manager. The dispatch runs via a Server Action (dispatchAgentExecution
// Action), so the internal callback token stays server-side and is never sent to
// the browser. Deterministic simulated outcomes only — include "fail" or "timeout"
// in the instructions to exercise those paths (ADR-0001 O1/O4).

import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { useDevHqState } from "@/lib/mission-control/useDevHqState";
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
        "No available agent matched. Every capable agent is busy, or none has the required capabilities.",
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
  const [instructions, setInstructions] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of state?.agents ?? []) map.set(agent.id, agent.name);
    return map;
  }, [state?.agents]);

  const tasks = state?.tasks ?? [];
  const availableAgents = (state?.agents ?? []).filter(
    (agent) => agent.availability === "available",
  );

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!taskId) return;
    setSubmitting(true);
    setFeedback(null);

    const requiredCapabilities = capabilities
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    try {
      const outcome = await dispatchAgentExecutionAction({
        taskId,
        requiredCapabilities:
          requiredCapabilities.length > 0 ? requiredCapabilities : undefined,
        instructions: instructions.trim() || undefined,
      });
      setFeedback(toFeedback(outcome, agentNameById));
    } catch {
      setFeedback({
        kind: "error",
        message: "Dispatch failed unexpectedly. Please try again.",
      });
    } finally {
      setSubmitting(false);
      void refresh();
    }
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
    </Panel>
  );
}
