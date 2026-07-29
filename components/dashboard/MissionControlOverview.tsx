"use client";

// Mission Control command center.
//
// Composes the founder-facing operational view over the live Dev HQ state feed:
// command chain, Executive Orchestrator, projects and their work, approval
// gates, the audit trail, activity, and system health. All rendering is driven by
// GET /api/dev-hq/state; sections the backend does not implement are labelled
// rather than filled with invented values.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import type { DevHqState } from "@/lib/dev-hq/types";
import { useDevHqState } from "@/lib/mission-control/useDevHqState";
import { buildCommandCenterModel } from "@/lib/mission-control/view-model";
import { MissionControlStatusBar } from "@/components/mission-control/MissionControlStatusBar";
import { HierarchyRail } from "@/components/mission-control/HierarchyRail";
import { ExecutiveOrchestratorPanel } from "@/components/mission-control/ExecutiveOrchestratorPanel";
import { ApprovalQueuePanel } from "@/components/mission-control/ApprovalQueuePanel";
import { ProjectHierarchyPanel } from "@/components/mission-control/ProjectHierarchyPanel";
import { WorkBoardPanel } from "@/components/mission-control/WorkBoardPanel";
import { AuditTrailPanel } from "@/components/mission-control/AuditTrailPanel";
import { ActivityStreamPanel } from "@/components/mission-control/ActivityStreamPanel";
import { AgentRosterPanel } from "@/components/mission-control/AgentRosterPanel";
import { SystemHealthPanel } from "@/components/mission-control/SystemHealthPanel";
import { FounderRequestForm } from "@/components/dashboard/FounderRequestForm";

export function MissionControlOverview() {
  const feed = useDevHqState();
  const { state, status, error, updatedAt, refresh, applySnapshot } = feed;

  const [busyApprovalId, setBusyApprovalId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const approvalsRegionRef = useRef<HTMLDivElement>(null);
  const lastAnnouncedEventIdRef = useRef<string | null>(null);

  // P2-35. Set only when a decision failed, and only to the control the founder
  // was on when they pressed it. See `handleApprovalAction`.
  const restoreFocusToRef = useRef<HTMLElement | null>(null);

  const model = useMemo(
    () => (state ? buildCommandCenterModel(state) : null),
    [state],
  );

  // Announce new operational events, but never the initial backlog.
  const latestEvent = state?.events[0] ?? null;
  useEffect(() => {
    if (!latestEvent) return;
    if (lastAnnouncedEventIdRef.current === null) {
      lastAnnouncedEventIdRef.current = latestEvent.id;
      return;
    }
    if (lastAnnouncedEventIdRef.current !== latestEvent.id) {
      lastAnnouncedEventIdRef.current = latestEvent.id;
      setAnnouncement(`${latestEvent.actorLabel}: ${latestEvent.message}`);
    }
  }, [latestEvent]);

  // P2-35. Runs after the commit that clears `busyApprovalId`, so the button is
  // enabled again by the time focus is put back on it. A `requestAnimationFrame`
  // would not guarantee that ordering, and `focus()` on a still-disabled button
  // is silently a no-op — the user would be left wherever the blur dropped them.
  useEffect(() => {
    const target = restoreFocusToRef.current;
    if (!target) return;
    restoreFocusToRef.current = null;
    if (target.isConnected) target.focus();
  });

  const handleApprovalAction = useCallback(
    async (approvalId: string, action: "approve" | "reject") => {
      // Captured before the request, because the failure path has to put the
      // founder back on the control they pressed and by then focus may have been
      // dropped by the button going disabled.
      const pressed =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setBusyApprovalId(approvalId);
      setActionError(null);
      try {
        const response = await fetch(`/api/dev-hq/approvals/${approvalId}/${action}`, {
          method: "POST",
        });
        const data: { state?: DevHqState; error?: string } = await response.json();
        if (!response.ok) {
          throw new Error(data.error ?? `Failed to ${action} request.`);
        }
        if (data.state) {
          applySnapshot(data.state);
        }
        setAnnouncement(
          action === "approve"
            ? `Approval ${approvalId} approved. Workflow resumed.`
            : `Approval ${approvalId} rejected. Workflow resumed.`,
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : `Failed to ${action} request.`;
        setActionError(message);
        setAnnouncement(message);
        // P2-35. Nothing was decided, so the button is still rendered and still
        // the control the founder needs. Moving focus to the wrapper here took
        // them off it and made retrying a hunt: the wrapper is a `tabIndex={-1}`
        // container, so recovering means tabbing forward through the panel
        // heading and every meta row to get back to a button that never moved.
        // Only a decision that actually landed removes the buttons.
        restoreFocusToRef.current = pressed;
      } finally {
        setBusyApprovalId(null);
        if (!restoreFocusToRef.current) {
          // The action buttons are removed once decided, so move focus to the
          // approvals region instead of dropping the user to the document start.
          requestAnimationFrame(() => approvalsRegionRef.current?.focus());
        }
        void refresh();
      }
    },
    [applySnapshot, refresh],
  );

  if (!model || !state) {
    return (
      <section aria-label="Mission Control" className="flex flex-col gap-3">
        <div
          className="rounded-xl border border-[var(--border)] bg-[var(--surface-1)] px-4 py-6"
          role="status"
          aria-live="polite"
        >
          <p className="text-[12.5px] font-medium text-[var(--text-dim)]">
            {status === "initial"
              ? "Connecting to the Dev HQ state feed…"
              : "Waiting for a state snapshot…"}
          </p>
          <p className="mt-1 text-[11px] text-[var(--text-faint)]">
            Loading projects, orchestrator status, tasks, approvals, and activity.
          </p>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-5" aria-hidden>
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-20 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]"
              />
            ))}
          </div>
        </div>
        {error ? (
          <div
            className="rounded-lg border border-[var(--err)]/40 bg-[var(--err)]/10 px-3 py-2.5"
            role="alert"
          >
            <p className="text-[12px] leading-relaxed text-[var(--err)]">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-2 rounded-md border border-[var(--border-strong)] bg-[var(--surface-2)] px-3 py-1.5 text-[12px] font-medium text-[var(--text)] outline-none hover:bg-[var(--surface-3)] focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
            >
              Retry now
            </button>
          </div>
        ) : null}
      </section>
    );
  }

  return (
    <section aria-label="Mission Control" className="flex flex-col gap-4">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {announcement}
      </div>

      <MissionControlStatusBar
        feedStatus={status}
        updatedAt={updatedAt}
        error={actionError ?? error}
        pendingApprovals={model.counts.pendingApprovals}
        attentionCount={model.attentionCount}
      />

      <HierarchyRail model={model} />

      {/* Founder-facing controls: intake, decisions, and orchestrator status. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <FounderRequestForm onSubmitted={() => void refresh()} />
        </div>
        <div
          ref={approvalsRegionRef}
          tabIndex={-1}
          aria-label="Founder approval gates"
          className="rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] lg:col-span-4"
        >
          <ApprovalQueuePanel
            approvals={model.approvals}
            onApprove={(id) => void handleApprovalAction(id, "approve")}
            onReject={(id) => void handleApprovalAction(id, "reject")}
            busyApprovalId={busyApprovalId}
          />
        </div>
        <div className="lg:col-span-4">
          <ExecutiveOrchestratorPanel executive={model.executive} />
        </div>
      </div>

      <ProjectHierarchyPanel projects={model.projects} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="xl:col-span-7">
          <WorkBoardPanel buckets={model.buckets} projects={state.projects} />
        </div>
        <div className="xl:col-span-5">
          <AuditTrailPanel records={model.auditRecords} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-12">
        <div className="xl:col-span-4">
          <ActivityStreamPanel events={state.events} />
        </div>
        <div className="xl:col-span-4">
          <AgentRosterPanel
            participants={model.participants}
            roster={state.agents}
          />
        </div>
        <div className="lg:col-span-2 xl:col-span-4">
          <SystemHealthPanel
            feedStatus={status}
            updatedAt={updatedAt}
            executions={state.executions}
            executive={model.executive}
            services={MISSION_CONTROL_PLACEHOLDERS.connectedServices}
          />
        </div>
      </div>
    </section>
  );
}
