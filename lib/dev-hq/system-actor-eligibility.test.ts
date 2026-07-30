// P0-4. The Executive Orchestrator could be dispatched as a worker.
//
// It is a system actor: it RAISES escalations and is persisted as
// `raisedByAgentId`, `createdByAgentId` and `actorId`. Commit e5aac96 registered
// it so those records join to a real identity, and seeded it with no
// capabilities on the reasoning that an empty set makes it unselectable.
//
// That reasoning does not hold. `hasCapabilities` is `required.every(...)` and
// `[].every(...)` is `true` by definition, so an agent holding NO capabilities
// matches a dispatch requiring NO capabilities — and `requiredCapabilities` is
// optional on `dispatchAgentExecution`, the shipped entry point. The empty seed
// made the orchestrator unselectable only for as long as every caller happened
// to name its capabilities: an unenforced assumption about callers, not a
// property of the registry. Once the roster's real workers are busy, selection
// reaches the orchestrator and gives it the job.
//
// Falsifiable claim under test: no dispatch, under any request, can result in
// `agent-executive-orchestrator` being selected, assigned, or dispatched work.
//
// Null arm (STD-CTRL-001 rule 2): from an identical starting state — the same
// task, the same request, the same busy roster — a real worker that IS eligible
// must still be selected and dispatched. Otherwise the claim above is equally
// satisfied by a registry that selects nobody.

import { beforeEach, describe, expect, it, vi } from "vitest";

const { triggerMock } = vi.hoisted(() => ({
  triggerMock: vi.fn(async () => ({ id: "run-system-actor-1" })),
}));

vi.mock("@trigger.dev/sdk", () => ({
  tasks: { trigger: triggerMock },
}));

import { dispatchAgentExecution } from "@/lib/dev-hq/agent-execution-service";
import { findEligibleAgents, selectAgent } from "@/lib/dev-hq/agent-registry";
import { EXECUTIVE_ORCHESTRATOR_AGENT_ID } from "@/lib/dev-hq/constants";
import {
  getDevHqStore,
  resetDevHqStore,
  saveAgent,
  saveTask,
} from "@/lib/dev-hq/store";
import type { AgentAssignment, Task } from "@/types/domain";

const TS = "2026-07-29T09:00:00.000Z";
const TASK_ID = "task-system-actor";

function seedTask(): Task {
  return saveTask({
    id: TASK_ID,
    projectId: "proj-x",
    workflowId: null,
    title: "Unqualified work",
    description: "Do the work.",
    status: "active",
    priority: "High",
    assigneeAgentId: null,
    claimedAt: null,
    createdAt: TS,
    updatedAt: TS,
    dueAt: null,
  });
}

/**
 * Occupy the shipped roster, leaving only the named agents available.
 *
 * This is the condition the defect needs and nothing more: the orchestrator is
 * ordered behind the real workers by `compareByIdleThenId`, so it only ever wins
 * a selection once they are all taken. Everyday operation, not a contrivance —
 * capacity is one execution per agent (ADR-0001 D6), so a five-agent roster is
 * fully occupied by five concurrent executions.
 */
function occupyRosterExcept(...available: string[]): void {
  for (const agent of [...getDevHqStore().agents.values()]) {
    if (agent.id === EXECUTIVE_ORCHESTRATOR_AGENT_ID) continue;
    saveAgent({
      ...agent,
      availability: available.includes(agent.id) ? "available" : "busy",
    });
  }
}

function assignments(): AgentAssignment[] {
  return [...getDevHqStore().agentAssignments.values()];
}

describe("system actors are structurally ineligible for dispatch (P0-4)", () => {
  beforeEach(() => {
    resetDevHqStore();
    triggerMock.mockClear();
    seedTask();
  });

  // --- null arm (rule 2) -----------------------------------------------------

  // These are deliberately insensitive to the mutation: they pass both with the
  // exclusion in place and with it removed. That is what makes them a control.
  // An arm that goes red when the fix is reverted is measuring the defect, not
  // the legitimate path, and belongs in the section below.
  describe("null arm: eligible workers are unaffected", () => {
    it("still dispatches a capability-constrained request from a busy roster", async () => {
      // The same starting state as the defect arm — one free agent on an
      // otherwise fully occupied roster — for a request only a real worker can
      // satisfy. Excluding the system actor must not cost this dispatch.
      occupyRosterExcept("agent-supervisor");

      const result = await dispatchAgentExecution({
        taskId: TASK_ID,
        requiredCapabilities: ["validation"],
        idempotencyKey: "null-arm-capability",
      });

      expect(
        result.agentId,
        "excluding the system actor also stopped an eligible worker from " +
          "being selected; the filter must be about identity, not about " +
          "narrowing the roster",
      ).toBe("agent-supervisor");
      expect(result.assigned).toBe(true);
      expect(triggerMock).toHaveBeenCalledTimes(1);
    });

    it("honours an explicit preference for a real worker", async () => {
      const result = await dispatchAgentExecution({
        taskId: TASK_ID,
        preferredAgentId: "agent-codex",
        requiredCapabilities: ["review"],
        idempotencyKey: "null-arm-preferred",
      });

      expect(result.assigned).toBe(true);
      expect(result.agentId).toBe("agent-codex");
    });

    it("leaves every real worker eligible when nothing is required", () => {
      const eligible = findEligibleAgents().map((agent) => agent.id);

      for (const worker of [
        "agent-orchestrator",
        "agent-claude",
        "agent-codex",
        "agent-gemini",
        "agent-supervisor",
      ]) {
        expect(
          eligible,
          `the exclusion removed the real worker ${worker} from the eligible set`,
        ).toContain(worker);
      }
    });
  });

  // --- the defect (rule 1) ---------------------------------------------------

  describe("the executive orchestrator is never given work", () => {
    it("is not selected for a dispatch that names no capabilities", async () => {
      // Every real worker is occupied. The orchestrator is the only agent left
      // `available`, and `[].every(...)` is true, so it matches.
      occupyRosterExcept();

      const result = await dispatchAgentExecution({
        taskId: TASK_ID,
        idempotencyKey: "no-capabilities",
      });

      expect(
        result.agentId,
        "the Executive Orchestrator was DISPATCHED WORK. It is a system actor " +
          "that raises escalations, not a worker: it was seeded with no " +
          "capabilities precisely so it could never win a dispatch, but " +
          "`required.every(...)` over an empty requirement matches an empty " +
          "capability set, so a request naming no capabilities selected it as " +
          "soon as the real roster was busy (P0-4)",
      ).not.toBe(EXECUTIVE_ORCHESTRATOR_AGENT_ID);
      expect(result.assigned).toBe(false);
      expect(result.reason).toBe("no_agent_available");

      expect(
        assignments().map((assignment) => assignment.agentId),
        "an AgentAssignment was created against the Executive Orchestrator (P0-4)",
      ).not.toContain(EXECUTIVE_ORCHESTRATOR_AGENT_ID);
      expect(
        triggerMock,
        "a durable agent-execution run was triggered for the Executive " +
          "Orchestrator (P0-4)",
      ).not.toHaveBeenCalled();
    });

    it("does not outrank a free real worker for unconstrained work", async () => {
      // Worse than a last-resort match. Selection prefers the least recently
      // active agent, and a system actor never works, so its `lastActiveAt`
      // stays null forever — which `compareByIdleThenId` treats as the longest
      // idle. It therefore beats a genuinely free worker, and the more of the
      // roster is busy the more certain that becomes.
      occupyRosterExcept("agent-supervisor");

      const result = await dispatchAgentExecution({
        taskId: TASK_ID,
        idempotencyKey: "outranks-worker",
      });

      expect(
        result.agentId,
        "the Executive Orchestrator took an unconstrained job AHEAD of an " +
          "available real worker: it never works, so its null lastActiveAt " +
          "makes it permanently the most idle candidate (P0-4)",
      ).toBe("agent-supervisor");
    });

    it("is not selected when a caller explicitly prefers it", async () => {
      // `preferredAgentId` is honoured only among the eligible, so pinning the
      // system actor by name must not promote it into eligibility.
      const result = await dispatchAgentExecution({
        taskId: TASK_ID,
        preferredAgentId: EXECUTIVE_ORCHESTRATOR_AGENT_ID,
        idempotencyKey: "preferred",
      });

      expect(
        result.agentId,
        "naming the Executive Orchestrator as the preferred agent handed it " +
          "the job (P0-4)",
      ).not.toBe(EXECUTIVE_ORCHESTRATOR_AGENT_ID);
    });

    it("is never returned by selection, even as the only available agent", () => {
      occupyRosterExcept();

      expect(
        selectAgent()?.id,
        "selection returned the Executive Orchestrator when it was the only " +
          "agent available (P0-4)",
      ).not.toBe(EXECUTIVE_ORCHESTRATOR_AGENT_ID);
      expect(
        selectAgent({ requiredCapabilities: [] }),
        "an explicitly empty capability requirement selected the system actor (P0-4)",
      ).toBeNull();
      expect(
        findEligibleAgents().map((agent) => agent.id),
        "the system actor appeared in the eligible set (P0-4)",
      ).not.toContain(EXECUTIVE_ORCHESTRATOR_AGENT_ID);
    });

    it("stays ineligible even if it is given a capability", () => {
      // The structural half of the claim. Eligibility must not be a
      // consequence of what this actor happens to hold, or the hole reopens
      // the moment someone adds a capability to make its records read better.
      const orchestrator = getDevHqStore().agents.get(
        EXECUTIVE_ORCHESTRATOR_AGENT_ID,
      )!;
      saveAgent({ ...orchestrator, capabilities: ["escalation", "routing"] });
      occupyRosterExcept();

      expect(
        selectAgent({ requiredCapabilities: ["routing"] }),
        "giving the system actor a capability made it dispatchable again; " +
          "ineligibility must come from its identity, not from an empty " +
          "capability list (P0-4)",
      ).toBeNull();
    });
  });
});
