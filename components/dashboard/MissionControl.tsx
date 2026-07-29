"use client";

// Client root for the mock workflow engine. Owns nothing itself — all state
// and transitions live in useWorkflowEngine; this component only composes the
// layout and wires actions to UI.

import { useCallback, useRef } from "react";
import { useWorkflowEngine } from "@/lib/workflow/useWorkflowEngine";
import { STAGES } from "@/lib/workflow/config";
import { TopBar } from "@/components/dashboard/TopBar";
import { AgentStatusRail } from "@/components/dashboard/AgentStatusRail";
import { TaskQueue } from "@/components/workflow/TaskQueue";
import { TaskSummary } from "@/components/workflow/TaskSummary";
import { TaskSpecs } from "@/components/workflow/TaskSpecs";
import { WorkflowControls } from "@/components/workflow/WorkflowControls";
import { WorkflowTimeline } from "@/components/workflow/WorkflowTimeline";
import { ApprovalPanel } from "@/components/workflow/ApprovalPanel";
import { ValidationResults } from "@/components/workflow/ValidationResults";
import { ActivityFeed } from "@/components/workflow/ActivityFeed";
import { MissionControlOverview } from "@/components/dashboard/MissionControlOverview";
import { DispatchAgentPanel } from "@/components/dashboard/DispatchAgentPanel";

export function MissionControl() {
  const engine = useWorkflowEngine();
  const {
    tasks,
    selectedTask,
    selectedId,
    runningId,
    paused,
    agentStatuses,
  } = engine;

  const runningTask = runningId ? tasks.find((t) => t.id === runningId) ?? null : null;
  const isWaitingForEvan = selectedTask.currentStage === "WAITING_FOR_EVAN";
  const anotherRunning = runningId !== null && runningId !== selectedTask.id;

  // After an approval action the approval buttons are removed from the DOM;
  // move focus to the task heading so keyboard and screen-reader users are not
  // dropped to the top of the document.
  const titleRef = useRef<HTMLHeadingElement>(null);
  const focusTitle = useCallback(() => {
    requestAnimationFrame(() => titleRef.current?.focus());
  }, []);
  const handleApprove = useCallback(
    (id: string) => {
      engine.approve(id);
      focusTitle();
    },
    [engine, focusTitle],
  );
  const handleRequestChanges = useCallback(
    (id: string) => {
      engine.requestChanges(id);
      focusTitle();
    },
    [engine, focusTitle],
  );

  // Announce automatic workflow updates for the active workflow (the running
  // task if any, otherwise the selection) via a polite live region.
  const announceTask = runningTask ?? selectedTask;
  const latestActivity = announceTask.activity[0];
  const liveAnnouncement = latestActivity
    ? `${announceTask.id}, ${STAGES[announceTask.currentStage].label}. ${latestActivity.message}`
    : "";

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {liveAnnouncement}
      </div>
      <TopBar
        runningId={runningId}
        paused={paused}
        runningTitle={runningTask ? runningTask.title : null}
      />
      {/* `agentStatuses` comes from useWorkflowEngine, the mock engine. */}
      <AgentStatusRail statuses={agentStatuses} provenance="simulated" />

      <main className="mx-auto w-full max-w-[1440px] flex-1 px-4 py-4 sm:px-5">
        <MissionControlOverview />

        <div className="my-5 flex items-center gap-3">
          <div className="h-px flex-1 bg-[var(--border)]" aria-hidden />
          <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-[var(--text-faint)]">
            Simulation Lab
          </span>
          <div className="h-px flex-1 bg-[var(--border)]" aria-hidden />
        </div>

        <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <DispatchAgentPanel />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Left — task queue */}
          <div className="lg:col-span-3">
            <div className="lg:sticky lg:top-4">
              <TaskQueue
                tasks={tasks}
                selectedId={selectedId}
                runningId={runningId}
                paused={paused}
                onSelect={engine.select}
              />
              <p className="mt-3 px-1 text-[11px] leading-relaxed text-[var(--text-faint)]">
                Simulated automation for validating the Savrio AI workflow.
                No real agents, APIs, commits, or deployments run in this phase.
              </p>
            </div>
          </div>

          {/* Center — selected task, controls, approval, timeline */}
          <div className="flex flex-col gap-4 lg:col-span-6">
            <TaskSummary task={selectedTask} titleRef={titleRef} />
            <WorkflowControls
              task={selectedTask}
              runningId={runningId}
              paused={paused}
              onRun={engine.run}
              onPause={engine.pause}
              onResume={engine.resume}
            />
            {isWaitingForEvan && (
              <ApprovalPanel
                task={selectedTask}
                onApprove={handleApprove}
                onRequestChanges={handleRequestChanges}
                blockedByOtherRun={anotherRunning}
              />
            )}
            <WorkflowTimeline task={selectedTask} />
          </div>

          {/* Right — validation, specs, activity */}
          <div className="flex flex-col gap-4 lg:col-span-3">
            <ValidationResults checks={selectedTask.requiredValidation} />
            <ActivityFeed activity={selectedTask.activity} />
            <TaskSpecs task={selectedTask} />
          </div>
        </div>
      </main>
    </div>
  );
}
