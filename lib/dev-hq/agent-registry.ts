// Agent Registry: capability, availability, and deterministic selection queries
// over the canonical in-memory agent set (ADR-0001 D5, Task 1D-2).
//
// This module is read-only. It never mutates agent availability or creates
// executions/assignments — claiming and dispatch belong to the Execution Manager
// (Task 1D-3). `selectAgent` chooses a candidate; it does not reserve it.

import type { AgentSelectionPolicy } from "@/types/contracts";
import type { Agent, AgentHealth, IsoTimestamp } from "@/types/domain";
import {
  AGENT_HEALTH_STALE_AFTER_MS,
  SYSTEM_ACTOR_AGENT_IDS,
} from "@/lib/dev-hq/constants";
import { getDevHqStore } from "@/lib/dev-hq/store";

export function listAgents(): Agent[] {
  return [...getDevHqStore().agents.values()];
}

export function getAgent(id: string): Agent | null {
  return getDevHqStore().agents.get(id) ?? null;
}

/** True when the agent's capabilities are a superset of every required one. */
export function hasCapabilities(agent: Agent, required: string[]): boolean {
  return required.every((capability) => agent.capabilities.includes(capability));
}

/** Phase 1 capacity is one execution per agent, so only `available` is eligible. */
export function isAvailable(agent: Agent): boolean {
  return agent.availability === "available";
}

/**
 * True for an actor that exists to be *referenced* by records rather than to
 * perform work (P0-4). A system actor is never eligible for selection, whatever
 * its capabilities, availability or health say.
 *
 * This is the structural half of the guarantee that commit e5aac96 tried to get
 * from data alone. Seeding the executive orchestrator with no capabilities made
 * it unselectable only while every dispatch named its capabilities, because
 * `hasCapabilities` is `required.every(...)` and `[].every(...)` is `true` — so
 * a dispatch requiring nothing matched the one agent that must never match. The
 * roster's real workers being busy is then all it takes for selection to reach
 * it. Identity, not capability, decides eligibility, so nobody can re-open the
 * hole by giving this actor a capability later.
 */
export function isSystemActor(agent: Agent): boolean {
  return SYSTEM_ACTOR_AGENT_IDS.includes(agent.id);
}

/**
 * Agents that may be given work at all, ignoring availability and capability.
 * The permanent half of eligibility: `findEligibleAgents` applies it before the
 * transient filters, and satisfiability checks ask it whether a capability set
 * has any possible answer.
 */
export function listDispatchableAgents(): Agent[] {
  return listAgents().filter((agent) => !isSystemActor(agent));
}

/**
 * Deterministic agent health from heartbeat freshness (Task 1E-4). Read-only —
 * it never mutates availability or assignments.
 *   - `offline` availability → "unavailable" (regardless of freshness)
 *   - no recorded activity (`lastActiveAt` null) → "stale" (liveness unconfirmed)
 *   - last activity older than `staleAfterMs` → "stale"
 *   - otherwise → "healthy"
 * The threshold boundary is inclusive: an age exactly equal to `staleAfterMs` is
 * still "healthy"; strictly greater is "stale".
 */
export function evaluateAgentHealth(
  agent: Agent,
  now: IsoTimestamp,
  staleAfterMs: number = AGENT_HEALTH_STALE_AFTER_MS,
): AgentHealth {
  if (agent.availability === "offline") {
    return "unavailable";
  }
  // Approved fallback policy (ADR-0002): no recorded heartbeat evaluates as
  // "stale" because liveness is unconfirmed until the first heartbeat is
  // observed. This is an architectural invariant and should remain stable unless
  // ADR-0002 is superseded.
  if (!agent.lastActiveAt) {
    return "stale";
  }
  const ageMs =
    new Date(now).getTime() - new Date(agent.lastActiveAt).getTime();
  return ageMs > staleAfterMs ? "stale" : "healthy";
}

/**
 * Available agents that satisfy the policy's required capabilities and, when the
 * policy pins one, its required provider. The provider pin is a hard filter
 * applied before ordering, so a same-provider agent is still found when it is not
 * the most idle candidate overall.
 *
 * System actors are excluded first and unconditionally (P0-4). Every other
 * filter here is a statement about the *work* — the wrong capabilities, the
 * wrong provider, no free capacity right now — and each of them can be satisfied
 * by some request. "Must never be dispatched" is a statement about the *actor*,
 * so it cannot be left to the request to enforce.
 */
export function findEligibleAgents(policy?: AgentSelectionPolicy): Agent[] {
  const required = policy?.requiredCapabilities ?? [];
  const provider = policy?.requiredProvider;
  return listDispatchableAgents().filter(
    (agent) =>
      isAvailable(agent) &&
      hasCapabilities(agent, required) &&
      (!provider || agent.provider === provider),
  );
}

/**
 * Deterministically pick an eligible agent, or null when none qualifies.
 *
 * Order of preference:
 *   1. `preferredAgentId`, when that agent is itself eligible.
 *   2. The least-recently-active eligible agent (a null `lastActiveAt` counts as
 *      the longest idle), with agent id as a stable final tie-break.
 *
 * Read-only: selecting an agent does not claim it. The Execution Manager performs
 * the atomic availability transition in Task 1D-3.
 */
export function selectAgent(policy?: AgentSelectionPolicy): Agent | null {
  const eligible = findEligibleAgents(policy);
  if (eligible.length === 0) {
    return null;
  }

  if (policy?.preferredAgentId) {
    const preferred = eligible.find(
      (agent) => agent.id === policy.preferredAgentId,
    );
    if (preferred) {
      return preferred;
    }
  }

  return [...eligible].sort(compareByIdleThenId)[0];
}

/**
 * Least-recently-active first. `lastActiveAt` is an ISO timestamp, so string
 * comparison orders it chronologically; a null (never active) becomes "" and
 * sorts ahead of any real timestamp, i.e. treated as the longest idle. Agent id
 * breaks exact ties so ordering is fully deterministic.
 */
function compareByIdleThenId(a: Agent, b: Agent): number {
  const aKey = a.lastActiveAt ?? "";
  const bKey = b.lastActiveAt ?? "";
  if (aKey !== bKey) {
    return aKey.localeCompare(bKey);
  }
  return a.id.localeCompare(b.id);
}
