import type { AgentId } from "@/types/workflow";
import { AGENT_ORDER, AGENTS } from "@/lib/workflow/config";
import type { AgentRuntimeStatus } from "@/lib/workflow/machine";
import { Avatar, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

const TONE_COLOR: Record<AgentRuntimeStatus["tone"], string> = {
  active: COLORS.run,
  waiting: COLORS.wait,
  done: COLORS.ok,
  idle: COLORS.idle,
};

export function AgentStatusRail({
  statuses,
}: {
  statuses: Record<AgentId, AgentRuntimeStatus>;
}) {
  return (
    <section
      className="border-b border-[var(--border)] bg-[var(--surface-1)]/40"
      aria-label="Agent status"
    >
      <div className="savrio-scroll flex gap-2 overflow-x-auto px-5 py-3">
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
      </div>
    </section>
  );
}
