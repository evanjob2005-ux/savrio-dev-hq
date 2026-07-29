// P2-39. These cards are produced by the mock workflow engine, and they sit
// directly under a header badged "LIVE STATE · DEV MODE" — close enough that the
// badge reads as covering them. Nothing on the rail said otherwise, so a Founder
// looking at "Claude · Implementing" had no way to tell whether an agent was
// really working. Provenance is a required prop rather than a hardcoded label so
// a caller wiring this to real agent state has to declare which it is passing,
// and it is carried in the accessible name too, since a screen-reader user
// reaching the rail as a single tab stop never sees the badge.

import type { AgentId } from "@/types/workflow";
import { AGENT_ORDER, AGENTS } from "@/lib/workflow/config";
import type { AgentRuntimeStatus } from "@/lib/workflow/machine";
import { Avatar, ScrollRegion, StatusDot } from "@/components/ui/primitives";
import { DataSourceBadge } from "@/components/mission-control/DataSourceBadge";
import { COLORS } from "@/lib/theme";

const TONE_COLOR: Record<AgentRuntimeStatus["tone"], string> = {
  active: COLORS.run,
  waiting: COLORS.wait,
  done: COLORS.ok,
  idle: COLORS.idle,
};

const PROVENANCE = {
  simulated: {
    heading: "Simulated agent status",
    source: "preview" as const,
    note: "Produced by the mock workflow engine. No agent is running.",
  },
  live: {
    heading: "Agent status",
    source: "live" as const,
    note: "Read from the Dev HQ agent registry.",
  },
};

export function AgentStatusRail({
  statuses,
  provenance,
}: {
  statuses: Record<AgentId, AgentRuntimeStatus>;
  /** Where these statuses came from. Required: an unmarked rail is a claim. */
  provenance: keyof typeof PROVENANCE;
}) {
  const meta = PROVENANCE[provenance];
  return (
    <section
      className="border-b border-[var(--border)] bg-[var(--surface-1)]/40"
      aria-label={meta.heading}
    >
      <div className="flex items-center gap-2 px-5 pt-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
          {meta.heading}
        </h2>
        <DataSourceBadge source={meta.source} />
        <p className="truncate text-[10.5px] text-[var(--text-faint)]">{meta.note}</p>
      </div>
      <ScrollRegion
        label={`${meta.heading} cards, scroll horizontally`}
        className="flex gap-2 overflow-x-auto px-5 pb-3 pt-2"
      >
        {AGENT_ORDER.map((id) => {
          const agent = AGENTS[id];
          const status = statuses[id];
          const tone = TONE_COLOR[status.tone];
          const isActive = status.active;
          return (
            <div
              key={id}
              className="flex min-w-[188px] items-center gap-2.5 rounded-lg border px-3 py-2 transition-colors"
              style={{
                borderColor: isActive ? `${agent.accent}66` : "var(--border)",
                background: isActive ? `${agent.accent}12` : "var(--surface-2)",
              }}
            >
              <Avatar initials={agent.initials} accent={agent.accent} active={isActive} />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="truncate text-[12.5px] font-medium text-[var(--text)]">
                  {agent.name}
                </div>
                <div className="flex items-center gap-1.5">
                  <StatusDot color={tone} pulse={isActive} size={6} />
                  <span className="truncate text-[11px] text-[var(--text-dim)]">
                    {status.label}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </ScrollRegion>
    </section>
  );
}
