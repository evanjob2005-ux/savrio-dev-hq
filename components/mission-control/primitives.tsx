// Presentational building blocks specific to the command-center layout.
// Server-safe (no client hooks). Shared app-wide primitives stay in
// components/ui/primitives.tsx.

import type { ReactNode } from "react";
import { StatusDot } from "@/components/ui/primitives";
import type { StatusToken } from "@/lib/mission-control/status";

/**
 * Status shown as a dot plus its label, so the state is always readable without
 * relying on color perception.
 */
export function StatusPill({
  status,
  pulse = false,
  className = "",
}: {
  status: StatusToken;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${className}`}
      style={{
        color: status.color,
        background: `${status.color}14`,
        borderColor: `${status.color}33`,
      }}
    >
      <StatusDot color={status.color} pulse={pulse} size={6} />
      {status.label}
    </span>
  );
}

/** A labelled count. `emphasis` highlights values that need founder attention. */
export function MetricStat({
  label,
  value,
  color,
  hint,
  emphasis = false,
}: {
  label: string;
  value: number | string;
  color: string;
  hint?: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className="rounded-lg border bg-[var(--surface-2)] px-3 py-2.5"
      style={{
        borderColor: emphasis ? `${color}55` : "var(--border)",
        background: emphasis ? `${color}0f` : undefined,
      }}
    >
      <p className="text-[10.5px] font-medium uppercase tracking-[0.06em] text-[var(--text-faint)]">
        {label}
      </p>
      <p
        className="mt-0.5 text-[20px] font-semibold leading-tight tabular-nums tracking-tight"
        style={{ color }}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-0.5 text-[10.5px] leading-snug text-[var(--text-faint)]">{hint}</p>
      ) : null}
    </div>
  );
}

/**
 * Monospace key/value row for identifiers and audit fields. Values truncate by
 * default to keep dense panels aligned; set `wrap` for prose that must stay
 * fully readable in a narrow column.
 */
export function MetaRow({
  label,
  value,
  mono = true,
  wrap = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  wrap?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-0.5">
      <dt className="shrink-0 text-[10.5px] uppercase tracking-[0.05em] text-[var(--text-faint)]">
        {label}
      </dt>
      <dd
        className={`min-w-0 text-right text-[11px] text-[var(--text-dim)] ${
          wrap ? "text-balance" : "truncate"
        } ${mono ? "font-mono" : ""}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Consistent empty state so panels never render as blank boxes. */
export function EmptyState({
  title,
  detail,
}: {
  title: string;
  detail?: string;
}) {
  return (
    <div className="px-4 py-6 text-center">
      <p className="text-[12px] font-medium text-[var(--text-dim)]">{title}</p>
      {detail ? (
        <p className="mx-auto mt-1 max-w-[46ch] text-[11px] leading-relaxed text-[var(--text-faint)]">
          {detail}
        </p>
      ) : null}
    </div>
  );
}

/** Section divider matching the existing Mission Control language. */
export function SectionDivider({
  label,
  right,
}: {
  label: string;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--text-dim)]">
        {label}
      </span>
      <div className="h-px flex-1 bg-[var(--border)]" aria-hidden />
      {right}
    </div>
  );
}
