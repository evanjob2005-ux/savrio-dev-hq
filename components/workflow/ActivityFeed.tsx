import type { ActivityEntry, ActivityKind } from "@/types/workflow";
import { AGENTS } from "@/lib/workflow/config";
import { Panel, Avatar, ScrollRegion } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import { clockFromIso } from "@/lib/format";

const KIND_COLOR: Record<ActivityKind, string> = {
  system: COLORS.idle,
  build: COLORS.run,
  gate: "#a78bfa",
  qa: "#8b7bf7",
  approval: COLORS.wait,
  warning: COLORS.warn,
};

function actorVisual(actor: ActivityEntry["actor"]) {
  if (actor === "System") {
    // "System" is an actor label, not a run status, so it takes the text ramp
    // (textDim) rather than the idle status color. Originally introduced as a
    // contrast fix when COLORS.idle failed AA; that has since been fixed at the
    // constant, but the token choice stands on its own semantics.
    return { name: "System", accent: COLORS.textDim, initials: "··" };
  }
  const agent = AGENTS[actor];
  return { name: agent.name, accent: agent.accent, initials: agent.initials };
}

export function ActivityFeed({ activity }: { activity: ActivityEntry[] }) {
  const entries = activity.slice(0, 40);
  return (
    <Panel
      title="Activity Feed"
      subtitle="Newest first"
      bodyClassName="p-0"
    >
      {entries.length === 0 ? (
        <p className="px-4 py-6 text-center text-[12px] text-[var(--text-faint)]">
          No activity yet.
        </p>
      ) : (
        <ScrollRegion
          label={`Activity feed, ${entries.length} entr${
            entries.length === 1 ? "y" : "ies"
          }, newest first`}
          className="max-h-[420px] overflow-y-auto"
        >
          <ul className="divide-y divide-[var(--border)]" role="list">
            {entries.map((entry, i) => {
              const v = actorVisual(entry.actor);
              const kindColor = KIND_COLOR[entry.kind];
              return (
                <li
                  key={entry.id}
                  className="flex gap-3 px-4 py-2.5"
                  style={i === 0 ? { background: `${kindColor}0d` } : undefined}
                >
                  <div className="flex flex-col items-center pt-0.5">
                    <Avatar initials={v.initials} accent={v.accent} size={22} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[11.5px] font-medium" style={{ color: v.accent }}>
                        {v.name}
                      </span>
                      <time className="shrink-0 font-mono text-[10px] text-[var(--text-faint)]">
                        {clockFromIso(entry.timestamp)}
                      </time>
                    </div>
                    <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-dim)]">
                      {entry.message}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </ScrollRegion>
      )}
    </Panel>
  );
}
