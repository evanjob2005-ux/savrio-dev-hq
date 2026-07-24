"use client";

import { useCallback, useEffect, useState } from "react";
import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import type { DevHqState } from "@/lib/dev-hq/types";
import { SystemOverviewPanel } from "@/components/dashboard/SystemOverviewPanel";
import { ProjectsPanel } from "@/components/dashboard/ProjectsPanel";
import { ActiveTasksPanel } from "@/components/dashboard/ActiveTasksPanel";
import { FounderApprovalQueuePanel } from "@/components/dashboard/FounderApprovalQueuePanel";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";
import { AgentStatusOverviewPanel } from "@/components/dashboard/AgentStatusOverviewPanel";
import { ConnectedServicesPanel } from "@/components/dashboard/ConnectedServicesPanel";
import { FounderRequestForm } from "@/components/dashboard/FounderRequestForm";
import { WorkflowStatusPanel } from "@/components/dashboard/WorkflowStatusPanel";

async function fetchState(): Promise<DevHqState> {
  const response = await fetch("/api/dev-hq/state", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load Dev HQ state.");
  }
  return response.json();
}

/** Sprint 1B overview — real dev store where available, placeholders elsewhere. */
export function MissionControlOverview() {
  const [state, setState] = useState<DevHqState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const next = await fetchState();
      setState(next);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load state.");
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const next = await fetchState();
        if (!cancelled) {
          setState(next);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to load state.");
        }
      }
    }

    void load();
    const timer = setInterval(() => {
      void load();
    }, 3000);

    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, []);

  const handleApprovalAction = useCallback(
    async (approvalId: string, action: "approve" | "reject") => {
      setBusyApprovalId(approvalId);
      try {
        const response = await fetch(`/api/dev-hq/approvals/${approvalId}/${action}`, {
          method: "POST",
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? `Failed to ${action} request.`);
        }
        setState(data.state);
      } catch (err) {
        setError(err instanceof Error ? err.message : `Failed to ${action} request.`);
      } finally {
        setBusyApprovalId(null);
        void refresh();
      }
    },
    [refresh],
  );

  if (!state) {
    return (
      <section aria-label="Mission Control overview" className="flex flex-col gap-4">
        <p className="text-[12px] text-[var(--text-faint)]">Loading Dev HQ state…</p>
        {error ? (
          <p className="text-[12px] text-[var(--err)]" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <section aria-label="Mission Control overview" className="flex flex-col gap-4">
      <p
        className="rounded-lg border border-[var(--warn)]/35 bg-[var(--warn)]/10 px-3 py-2 text-[12px] leading-relaxed text-[var(--text-dim)]"
        role="note"
      >
        Development mode: workflow state is stored in a single-process in-memory dev
        adapter. Data is not durable and will reset when the Next.js process restarts.
        Not for production use.
      </p>
      {error ? (
        <p className="rounded-lg border border-[var(--err)]/40 bg-[var(--err)]/10 px-3 py-2 text-[12px] text-[var(--err)]" role="alert">
          {error}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FounderRequestForm onSubmitted={refresh} />
        <WorkflowStatusPanel workflowRuns={state.workflowRuns} />
      </div>

      <SystemOverviewPanel metrics={state.overview} />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ProjectsPanel projects={state.projects} />
        <ActiveTasksPanel tasks={state.tasks} />
        <FounderApprovalQueuePanel
          approvals={state.approvals}
          onApprove={(id) => void handleApprovalAction(id, "approve")}
          onReject={(id) => void handleApprovalAction(id, "reject")}
          busyApprovalId={busyApprovalId}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
        <RecentActivityPanel events={state.events} />
        <AgentStatusOverviewPanel agents={MISSION_CONTROL_PLACEHOLDERS.agents} />
        <ConnectedServicesPanel services={MISSION_CONTROL_PLACEHOLDERS.connectedServices} />
      </div>
    </section>
  );
}
