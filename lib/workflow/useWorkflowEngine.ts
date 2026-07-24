"use client";

// The one place that owns workflow state, transitions, and timers.
// Components read derived values and call the returned actions — they never
// mutate tasks or schedule their own timers. This keeps stage-transition
// logic centralized and guarantees a single timer per running task.

import { useEffect, useMemo, useReducer } from "react";
import type { AgentId, Task } from "@/types/workflow";
import { STAGES } from "./config";
import {
  deriveAgentStatuses,
  makeActivity,
  nextStage,
  transition,
  type AgentRuntimeStatus,
} from "./machine";
import { MOCK_TASKS } from "@/data/mock-tasks";

interface EngineState {
  tasks: Record<string, Task>;
  order: string[];
  selectedId: string;
  /** The task currently auto-simulating, if any. Only one at a time. */
  runningId: string | null;
  paused: boolean;
  /** Monotonic counter for generating unique activity ids. */
  seq: number;
}

type Action =
  | { type: "SELECT"; id: string }
  | { type: "RUN"; id: string }
  | { type: "ADVANCE"; id: string }
  | { type: "PAUSE"; id: string }
  | { type: "RESUME"; id: string }
  | { type: "APPROVE"; id: string }
  | { type: "REQUEST_CHANGES"; id: string };

function nowIso(): string {
  return new Date().toISOString();
}

function initState(): EngineState {
  const tasks: Record<string, Task> = {};
  const order: string[] = [];
  for (const task of MOCK_TASKS) {
    // Deep-ish clone so the exported mock array is never mutated.
    tasks[task.id] = {
      ...task,
      acceptanceCriteria: [...task.acceptanceCriteria],
      expectedFiles: [...task.expectedFiles],
      protectedFiles: [...task.protectedFiles],
      requiredValidation: task.requiredValidation.map((v) => ({ ...v })),
      approvalsRequired: [...task.approvalsRequired],
      activity: task.activity.map((a) => ({ ...a })),
      stageHistory: task.stageHistory.map((h) => ({ ...h })),
      blockers: [...task.blockers],
      knownRisks: [...task.knownRisks],
    };
    order.push(task.id);
  }
  return {
    tasks,
    order,
    selectedId: order[0] ?? "",
    runningId: null,
    paused: false,
    seq: 1000,
  };
}

/** A task can be started/resumed when it is not terminal, not awaiting Evan. */
export function isRunnable(task: Task): boolean {
  return (
    task.currentStage !== "COMPLETE" && task.currentStage !== "WAITING_FOR_EVAN"
  );
}

function reducer(state: EngineState, action: Action): EngineState {
  switch (action.type) {
    case "SELECT":
      return state.tasks[action.id]
        ? { ...state, selectedId: action.id }
        : state;

    case "RUN": {
      const task = state.tasks[action.id];
      if (!task || !isRunnable(task)) return state;
      // Only one workflow simulates at a time.
      if (state.runningId && state.runningId !== action.id) return state;

      let seq = state.seq;
      const mkId = () => `a${seq++}`;
      const ts = nowIso();

      let updated: Task;
      if (task.currentStage === "PLANNING" || task.currentStage === "READY") {
        const withStart: Task = {
          ...task,
          activity: [
            makeActivity(mkId(), ts, "Evan", "Task started (simulated).", "system"),
            ...task.activity,
          ],
        };
        updated = transition(withStart, "CLAUDE_BUILD", { timestamp: ts, mkId, addDone: false });
      } else {
        // Resume simulation from wherever the task currently sits. Clearing
        // blockers here means a correction shows as "blocked" only while it
        // waits at CLAUDE_BUILD, then reads as active once work restarts.
        updated = {
          ...task,
          blockers: [],
          activity: [
            makeActivity(mkId(), ts, "System", "Workflow simulation resumed.", "system"),
            ...task.activity,
          ],
        };
      }
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: updated },
        runningId: action.id,
        paused: false,
        seq,
      };
    }

    case "ADVANCE": {
      // Guard against a stale timer firing for a task that is no longer the
      // running one (prevents double advancement).
      if (state.runningId !== action.id) return state;
      const task = state.tasks[action.id];
      if (!task) return state;
      const to = nextStage(task.currentStage);
      if (!to) return state;

      let seq = state.seq;
      const mkId = () => `a${seq++}`;
      const ts = nowIso();
      const updated = transition(task, to, { timestamp: ts, mkId, addDone: true });

      const stop = to === "WAITING_FOR_EVAN" || to === "COMPLETE";
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: updated },
        runningId: stop ? null : state.runningId,
        paused: stop ? false : state.paused,
        seq,
      };
    }

    case "PAUSE": {
      if (state.runningId !== action.id) return state;
      const task = state.tasks[action.id];
      if (!task) return state;
      const updated: Task = {
        ...task,
        activity: [
          makeActivity(`a${state.seq}`, nowIso(), "System", "Workflow paused.", "system"),
          ...task.activity,
        ],
      };
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: updated },
        paused: true,
        seq: state.seq + 1,
      };
    }

    case "RESUME": {
      if (state.runningId !== action.id) return state;
      const task = state.tasks[action.id];
      if (!task) return state;
      const updated: Task = {
        ...task,
        activity: [
          makeActivity(`a${state.seq}`, nowIso(), "System", "Workflow resumed.", "system"),
          ...task.activity,
        ],
      };
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: updated },
        paused: false,
        seq: state.seq + 1,
      };
    }

    case "APPROVE": {
      const task = state.tasks[action.id];
      if (!task || task.currentStage !== "WAITING_FOR_EVAN") return state;
      // Never interrupt a different task that is actively simulating.
      if (state.runningId && state.runningId !== action.id) return state;
      let seq = state.seq;
      const mkId = () => `a${seq++}`;
      const ts = nowIso();
      const updated = transition(task, "APPROVED", { timestamp: ts, mkId, addDone: false });
      // APPROVED auto-advances to COMPLETE via the timer effect.
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: updated },
        runningId: action.id,
        paused: false,
        seq,
      };
    }

    case "REQUEST_CHANGES": {
      const task = state.tasks[action.id];
      if (!task || task.currentStage !== "WAITING_FOR_EVAN") return state;
      // Never interrupt a different task that is actively simulating.
      if (state.runningId && state.runningId !== action.id) return state;
      let seq = state.seq;
      const mkId = () => `a${seq++}`;
      const ts = nowIso();
      const retryCount = task.retryCount + 1;
      const warned: Task = {
        ...task,
        retryCount,
        blockers: [`Correction requested by Evan (retry ${retryCount}).`],
        activity: [
          makeActivity(mkId(), ts, "Evan", `Evan requested changes (retry ${retryCount}).`, "warning"),
          ...task.activity,
        ],
      };
      const updated = transition(warned, "CLAUDE_BUILD", {
        timestamp: ts,
        mkId,
        addDone: false,
        enterMessageOverride: "Claude began corrections after requested changes.",
      });
      // Stop the simulation so Evan can see the task routed back; the user
      // resumes it explicitly.
      return {
        ...state,
        tasks: { ...state.tasks, [action.id]: updated },
        runningId: null,
        paused: false,
        seq,
      };
    }

    default:
      return state;
  }
}

export interface WorkflowEngine {
  tasks: Task[];
  selectedTask: Task;
  selectedId: string;
  runningId: string | null;
  paused: boolean;
  /** True when the selected task is the one actively simulating right now. */
  selectedIsLive: boolean;
  agentStatuses: Record<AgentId, AgentRuntimeStatus>;
  select: (id: string) => void;
  run: (id: string) => void;
  pause: (id: string) => void;
  resume: (id: string) => void;
  approve: (id: string) => void;
  requestChanges: (id: string) => void;
}

export function useWorkflowEngine(): WorkflowEngine {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  // Single source of auto-advance timing. Exactly one timer can be pending:
  // React runs the cleanup before re-running the effect and on unmount, so a
  // stage change (or pause) clears the previous timer before scheduling a new
  // one. Non-auto stages (PLANNING, READY, WAITING_FOR_EVAN, COMPLETE) never
  // schedule anything.
  useEffect(() => {
    if (!state.runningId || state.paused) return;
    const task = state.tasks[state.runningId];
    if (!task) return;
    const meta = STAGES[task.currentStage];
    if (!meta.auto) return;

    const runningId = state.runningId;
    const timer = setTimeout(() => {
      dispatch({ type: "ADVANCE", id: runningId });
    }, meta.durationMs);
    return () => clearTimeout(timer);
  }, [state.runningId, state.paused, state.tasks]);

  const tasks = useMemo(
    () => state.order.map((id) => state.tasks[id]),
    [state.order, state.tasks],
  );
  const selectedTask = state.tasks[state.selectedId] ?? tasks[0];
  const selectedIsLive =
    state.runningId === selectedTask.id && !state.paused;

  // The agent-status rail must reflect the ACTIVE workflow. If a task is
  // running, it drives the rail regardless of which task is merely selected;
  // only when nothing is running does the rail fall back to the selection.
  const runningTask = state.runningId ? state.tasks[state.runningId] : null;
  const railTask = runningTask ?? selectedTask;
  const railIsLive = runningTask ? !state.paused : false;

  const agentStatuses = useMemo(
    () => deriveAgentStatuses(railTask, railIsLive),
    [railTask, railIsLive],
  );

  return {
    tasks,
    selectedTask,
    selectedId: state.selectedId,
    runningId: state.runningId,
    paused: state.paused,
    selectedIsLive,
    agentStatuses,
    select: (id) => dispatch({ type: "SELECT", id }),
    run: (id) => dispatch({ type: "RUN", id }),
    pause: (id) => dispatch({ type: "PAUSE", id }),
    resume: (id) => dispatch({ type: "RESUME", id }),
    approve: (id) => dispatch({ type: "APPROVE", id }),
    requestChanges: (id) => dispatch({ type: "REQUEST_CHANGES", id }),
  };
}
