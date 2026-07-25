// Labels the provenance of every panel so operational truth is never confused
// with scaffolding. Server-safe.

import { COLORS } from "@/lib/theme";
import type { DataSource } from "@/lib/mission-control/status";

const META: Record<DataSource, { label: string; color: string; help: string }> = {
  live: {
    label: "Live",
    color: COLORS.ok,
    help: "Read directly from the Dev HQ state API.",
  },
  derived: {
    label: "Derived",
    color: COLORS.run,
    help: "Computed in the browser from live Dev HQ state.",
  },
  preview: {
    label: "Preview",
    color: COLORS.warn,
    help: "Static placeholder. Not live operational data.",
  },
  unavailable: {
    label: "Not implemented",
    color: COLORS.idle,
    help: "No backend capability records this yet.",
  },
};

export function DataSourceBadge({ source }: { source: DataSource }) {
  const meta = META[source];
  return (
    <span
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.06em]"
      style={{
        color: meta.color,
        background: `${meta.color}14`,
        border: `1px solid ${meta.color}33`,
      }}
      title={meta.help}
    >
      <span
        className="inline-block h-1.5 w-1.5 rounded-full"
        style={{ background: meta.color }}
        aria-hidden
      />
      {meta.label}
    </span>
  );
}

/**
 * Explains, in prose, why a section has no real data. Used instead of inventing
 * values for capabilities the backend does not implement.
 */
export function NotImplementedNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border border-dashed border-[var(--border-strong)] bg-[var(--surface-2)]/60 px-3 py-2 text-[11.5px] leading-relaxed text-[var(--text-dim)]">
      {children}
    </p>
  );
}
