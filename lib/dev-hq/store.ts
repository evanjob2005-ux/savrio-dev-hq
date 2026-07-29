// Development-only centralized in-memory store.
// Single Next.js process, non-durable, not for production.

import { MISSION_CONTROL_PLACEHOLDERS } from "@/data/placeholders/mission-control";
import {
  EXECUTIVE_ORCHESTRATOR_AGENT_ID,
  FOUNDER_REQUEST_WORKFLOW_ID,
} from "@/lib/dev-hq/constants";
import type {
  DevHqState,
  DevHqStoreData,
  ProcessStartMarker,
} from "@/lib/dev-hq/types";
import { toPublicReviews } from "@/lib/dev-hq/review-projection";
import { nextId, nowIso } from "@/lib/dev-hq/id";
import type {
  Agent,
  AgentAssignment,
  Approval,
  Escalation,
  Event,
  Evidence,
  Execution,
  Project,
  Review,
  ReviewFinding,
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
    agents.set(agent.id, {
      ...agent,
      // Seed the concurrency primitive UNLOCKED, whatever the roster displays.
      //
      // ADR-0001 D6 makes availability the compare-and-set primitive: claiming
      // requires "available", and only releasing an execution writes it back.
      // The placeholder roster carries "busy"/"waiting" as cosmetic UI status,
      // and copying that through seeded three agents into a lock nobody holds
      // and nothing can release -- not-available, so never selected, so never
      // claimed, so never released. Terminal.
      //
      // That stranded five of the ten capabilities frozen by ADR-0001 O3
      // (implementation, review, corrections, qa, accessibility): dispatch
      // found no eligible agent, the execution sat queued forever, and because
      // no attempt was consumed no escalation was ever raised. Work that
      // neither completes nor fails.
      //
      // Display status is a view-model concern and belongs in Mission Control.
      availability: "available",
      capabilities: [...agent.capabilities],
    });
  }

  // ADR-0001 D5 requires the seed to reuse ids already hard-referenced
  // elsewhere, naming this one explicitly. It was referenced but never seeded:
  // escalation-service and founder-request-service persist it as
  // raisedByAgentId, createdByAgentId and actorId, and getAgent() returned null
  // for every one of them -- so an escalation's "raised by" joined to nothing.
  // The events looked right only because a hardcoded label string masked it.
  if (!agents.has(EXECUTIVE_ORCHESTRATOR_AGENT_ID)) {
    agents.set(EXECUTIVE_ORCHESTRATOR_AGENT_ID, {
      id: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
      name: "Executive Orchestrator",
      provider: "internal",
      role: "Executive Orchestrator",
      // Deliberately no capabilities. This is a system actor, not a worker: it
      // exists so escalation and founder-request records join to a real
      // identity, and it must never win a dispatch. Every production
      // selectAgent call specifies requiredCapabilities, so an empty set makes
      // it unselectable without needing a special case in the registry.
      capabilities: [],
      availability: "available",
      accentColor: "#c9a227",
      initials: "EO",
      lastActiveAt: null,
    });
  }

  return agents;
}

/**
 * Stamps a fresh store instance with its identity.
 *
 * Produced here, on the server, at the moment the instance is created — the only
 * place that can observe a lifetime beginning. Nothing a caller or a request
 * supplies reaches this value.
 *
 * `nextId` carries a process-local sequence, so two instances created in the
 * same millisecond — a reset, in practice — are still distinct. Across a real
 * process restart the sequence begins again but the clock has moved, and a
 * restart does not complete inside one millisecond.
 */
function createProcessStartMarker(): ProcessStartMarker {
  return { id: nextId("process"), startedAt: nowIso() };
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
    evidence: new Map(),
    evidenceUris: new Map(),
    escalations: new Map(),
    reviews: new Map(),
    reviewFindings: new Map(),
    eventKeys: new Map(),
    processStart: createProcessStartMarker(),
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
  const evidence = [...store.evidence.values()].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );
  const escalations = [...store.escalations.values()].sort((a, b) =>
    b.raisedAt.localeCompare(a.raisedAt),
  );
  // Projected, never raw: this state is served to the browser, and a Review
  // carries the internal capability that resolves it.
  const reviews = toPublicReviews(
    [...store.reviews.values()].sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt),
    ),
  );
  const reviewFindings = [...store.reviewFindings.values()].sort((a, b) =>
    b.recordedAt.localeCompare(a.recordedAt),
  );

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
    evidence,
    escalations,
    reviews,
    reviewFindings,
    overview: {
      activeProjects: projects.filter((p) => p.status === "active").length,
      activeTasks,
      pendingApprovals,
      connectedServices: MISSION_CONTROL_PLACEHOLDERS.overview.connectedServices,
      runningExecutions,
    },
    // Copied rather than shared, like every other field here, so a reader cannot
    // edit the store's own record of which lifetime it is.
    processStart: { ...store.processStart },
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

/**
 * Append an event, optionally at most once per `dedupeKey`.
 *
 * The keyed check and the insert are synchronous with no await between them, so
 * concurrent writers cannot both append — which is what makes "one event per
 * transition" hold under reconciliation, without anyone matching on message text.
 * The already-recorded event is returned so callers see what is on the timeline.
 */
export function appendEvent(event: Event, dedupeKey?: string): Event {
  const store = getDevHqStore();
  if (dedupeKey) {
    const existing = store.eventKeys.get(dedupeKey);
    if (existing) return existing;
    store.eventKeys.set(dedupeKey, event);
  }
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

export function saveEvidence(evidence: Evidence): Evidence {
  const store = getDevHqStore();
  store.evidence.set(evidence.id, evidence);
  // Register the uri if nothing holds it yet. The append-only path stays
  // append-only — a second row with the same uri is still stored — but the index
  // remembers the *first* row, so a later keyed write converges on whatever is
  // already on the timeline rather than adding a twin beside it. That is what
  // lets recovery reuse evidence an interrupted attempt had already made durable.
  if (evidence.uri && !store.evidenceUris.has(evidence.uri)) {
    store.evidenceUris.set(evidence.uri, evidence);
  }
  return evidence;
}

/**
 * Create the evidence row for `uri`, or return the one already recorded there.
 *
 * The keyed check and the insert are synchronous with no await between them, so
 * concurrent writers cannot both create — the same argument that makes
 * `appendEvent`'s dedupe key and the keyed ReviewFinding hold. This is why
 * uniqueness is a property of the write: a service-level read-then-write check
 * cannot provide it, because both callers pass the read before either writes.
 *
 * Append-only is preserved: nothing is ever mutated or removed, and the losing
 * caller is handed the winner's row so evidence identity is stable across
 * replays, sweeps, and races.
 */
export function ensureEvidenceByUri(
  uri: string,
  create: () => Evidence,
): Evidence {
  const existing = getDevHqStore().evidenceUris.get(uri);
  if (existing) return existing;
  return saveEvidence(create());
}

export function getEvidence(evidenceId: string): Evidence | null {
  return getDevHqStore().evidence.get(evidenceId) ?? null;
}

export function saveReview(review: Review): Review {
  getDevHqStore().reviews.set(review.id, review);
  return review;
}

export function getReview(reviewId: string): Review | null {
  return getDevHqStore().reviews.get(reviewId) ?? null;
}

export function saveReviewFinding(finding: ReviewFinding): ReviewFinding {
  getDevHqStore().reviewFindings.set(finding.id, finding);
  return finding;
}

export function saveEscalation(escalation: Escalation): Escalation {
  getDevHqStore().escalations.set(escalation.id, escalation);
  return escalation;
}

export function getEscalation(escalationId: string): Escalation | null {
  return getDevHqStore().escalations.get(escalationId) ?? null;
}
