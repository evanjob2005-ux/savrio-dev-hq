import type { Event } from "@/types/domain";
import { Panel, Avatar } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";
import { clockFromIso, shortStampFromIso } from "@/lib/format";

function actorAccent(label: string): string {
  if (label === "Evan") return COLORS.wait;
  if (label === "System") return COLORS.textDim;
  if (label === "Supervisor") return "#a78bfa";
  if (label === "Claude") return "#e8956b";
  return COLORS.run;
}

export function RecentActivityPanel({ events }: { events: Event[] }) {
  return (
    <Panel title="Recent Activity" subtitle="System-wide · placeholder" bodyClassName="p-0">
      <ul
        className="savrio-scroll max-h-[280px] divide-y divide-[var(--border)] overflow-y-auto"
        role="list"
      >
        {events.map((event, i) => {
          const accent = actorAccent(event.actorLabel);
          return (
            <li
              key={event.id}
              className="flex gap-3 px-4 py-2.5"
              style={i === 0 ? { background: `${accent}0d` } : undefined}
            >
              <Avatar
                initials={event.actorLabel.slice(0, 2).toUpperCase()}
                accent={accent}
                size={22}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[11.5px] font-medium" style={{ color: accent }}>
                    {event.actorLabel}
                  </span>
                  <time
                    className="shrink-0 font-mono text-[10px] text-[var(--text-faint)]"
                    title={shortStampFromIso(event.timestamp)}
                  >
                    {clockFromIso(event.timestamp)}
                  </time>
                </div>
                <p className="mt-0.5 text-[12px] leading-snug text-[var(--text-dim)]">
                  {event.message}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
