"use client";

import { useState } from "react";
import type { Priority } from "@/types/domain";
import { Panel } from "@/components/ui/primitives";

const PRIORITIES: Priority[] = ["Critical", "High", "Medium", "Low"];

export function FounderRequestForm({ onSubmitted }: { onSubmitted: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/dev-hq/founder-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, priority }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error ?? "Failed to submit founder request.");
      }
      setSuccess(`Request submitted as ${data.task.id}. Workflow started.`);
      setTitle("");
      setDescription("");
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit founder request.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Panel title="Submit Founder Request" subtitle="Starts the real Dev HQ workflow">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">Title</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
            placeholder="Feature or initiative title"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">Description</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            minLength={10}
            rows={3}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
            placeholder="Objective, scope, and acceptance criteria"
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-medium text-[var(--text-dim)]">Priority</span>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-[13px] text-[var(--text)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/60"
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        {error ? (
          <p className="text-[12px] text-[var(--err)]" role="alert">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="text-[12px] text-[var(--ok)]" role="status">
            {success}
          </p>
        ) : null}
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg px-4 py-2 text-[13px] font-medium text-[var(--bg)] disabled:opacity-60"
          style={{ background: "var(--accent)" }}
        >
          {submitting ? "Submitting…" : "Submit Founder Request"}
        </button>
      </form>
    </Panel>
  );
}
