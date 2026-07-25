// Development-only centralized in-memory store.
// Single Next.js process, non-durable, not for production.

import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import { FOUNDER_REQUEST_WORKFLOW_ID } from "@/lib/dev-hq/constants";
import type { DevHqState, DevHqStoreData } from "@/lib/dev-hq/types";
import { nowIso } from "@/lib/dev-hq/id";
import type {
  Agent,
  AgentAssignment,
  Approval,
  Event,
  Execution,
  Project,
  Task,
  Workflow,
  WorkflowRunRecord,
} from "@/types/domain";

const STORE_KEY = Symbol.for("savrio.dev-hq.store");

function createSeedWorkflow(): Workflow {
  const createdAt = nowIso();
  return {
    id: FOUNDER_REQUEST_WORKFLOW_ID,
    projectId: "proj-dev-hq",
    name: "Founder Request",
    version: "1.0.0",
    status: "active",
    stages: [
      {
        id: "stage-founder-request",
        name: "Founder Request",
        order: 1,
        requiresApproval: false,
      },
      {
        id: "stage-executive-review",
        name: "Executive Review",
        order: 2,
        requiresApproval: false,
      },
      {
        id: "stage-founder-approval",
        name: "Founder Approval Required",
        order: 3,
        requiresApproval: true,
      },
      {
        id: "stage-decision",
        name: "Approved or Rejected",
        order: 4,
        requiresApproval: false,
      },
      {
        id: "stage-completed",
        name: "Completed",
        order: 5,
        requiresApproval: false,
      },
    ],
    createdAt,
    updatedAt: createdAt,
  };
}

/**
 * Seeds the canonical Agent Registry from the placeholder roster (ADR-0001 D5),
 * so Mission Control and the execution engine read one shared set of agents.
 * Insertion order is preserved to keep the roster display identical.
 */
function createSeedAgents(): Map<string, Agent> {
  const agents = new Map<string, Agent>();
  for (const agent of MISSION_CONTROL_PLACEHOLDERS.agents) {
    agents.set(agent.id, { ...agent, capabilities: [...agent.capabilities] });
  }
  return agents;
}

function createEmptyStore(): DevHqStoreData {
  const workflows = new Map<string, Workflow>();
  workflows.set(FOUNDER_REQUEST_WORKFLOW_ID, createSeedWorkflow());
  return {
    projects: new Map(),
    tasks: new Map(),
    approvals: new Map(),
    events: [],
    workflows,
    executions: new Map(),
    workflowRuns: new Map(),
    agents: createSeedAgents(),
    agentAssignments: new Map(),
  };
}

/** Centralized in-memory development store (single Next.js process, non-durable). */
export function getDevHqStore(): DevHqStoreData {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: DevHqStoreData;
  };
  if (!globalStore[STORE_KEY]) {
    globalStore[STORE_KEY] = createEmptyStore();
  }
  return globalStore[STORE_KEY];
}

export function resetDevHqStore(): void {
  const globalStore = globalThis as typeof globalThis & {
    [STORE_KEY]?: DevHqStoreData;
  };
  globalStore[STORE_KEY] = createEmptyStore();
}

function sortByUpdated<T extends { updatedAt?: string; createdAt?: string }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    const aTs = a.updatedAt ?? a.createdAt ?? "";
    const bTs = b.updatedAt ?? b.createdAt ?? "";
    return bTs.localeCompare(aTs);
  });
}

export function buildDevHqState(store: DevHqStoreData = getDevHqStore()): DevHqState {
  const projects = sortByUpdated([...store.projects.values()]);
  const tasks = sortByUpdated([...store.tasks.values()]);
  const approvals = [...store.approvals.values()].sort((a, b) =>
    b.requestedAt.localeCompare(a.requestedAt),
  );
  const events = [...store.events].sort((a, b) =>
    b.timestamp.localeCompare(a.timestamp),
  );
  const workflows = [...store.workflows.values()];
  const executions = [...store.executions.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const workflowRuns = [...store.workflowRuns.values()].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );
  // Preserve registry seed order so the roster renders identically to the
  // placeholder source it is seeded from.
  const agents = [...store.agents.values()];

  const pendingApprovals = approvals.filter((a) => a.status === "pending").length;
  const activeTasks = tasks.filter(
    (t) => t.status === "active" || t.status === "blocked" || t.status === "paused",
  ).length;
  const runningExecutions = executions.filter((e) => e.status === "running").length;

  return {
    projects,
    tasks,
    approvals,
    events,
    workflows,
    executions,
    workflowRuns,
    agents,
    overview: {
      activeProjects: projects.filter((p) => p.status === "active").length,
      activeTasks,
      pendingApprovals,
      connectedServices: MISSION_CONTROL_PLACEHOLDERS.overview.connectedServices,
      runningExecutions,
    },
  };
}

export function upsertWorkflowRun(run: WorkflowRunRecord): WorkflowRunRecord {
  const store = getDevHqStore();
  store.workflowRuns.set(run.executionId, run);
  return run;
}

export function getWorkflowRun(executionId: string): WorkflowRunRecord | null {
  return getDevHqStore().workflowRuns.get(executionId) ?? null;
}

export function appendEvent(event: Event): Event {
  const store = getDevHqStore();
  store.events.unshift(event);
  store.events = store.events.slice(0, 200);
  return event;
}

export function saveProject(project: Project): Project {
  getDevHqStore().projects.set(project.id, project);
  return project;
}

export function saveTask(task: Task): Task {
  getDevHqStore().tasks.set(task.id, task);
  return task;
}

export function saveApproval(approval: Approval): Approval {
  getDevHqStore().approvals.set(approval.id, approval);
  return approval;
}

export function saveExecution(execution: Execution): Execution {
  getDevHqStore().executions.set(execution.id, execution);
  return execution;
}

export function saveAgent(agent: Agent): Agent {
  getDevHqStore().agents.set(agent.id, agent);
  return agent;
}

export function getAgent(agentId: string): Agent | null {
  return getDevHqStore().agents.get(agentId) ?? null;
}

export function saveAssignment(assignment: AgentAssignment): AgentAssignment {
  getDevHqStore().agentAssignments.set(assignment.id, assignment);
  return assignment;
}

export function getAssignment(assignmentId: string): AgentAssignment | null {
  return getDevHqStore().agentAssignments.get(assignmentId) ?? null;
}
