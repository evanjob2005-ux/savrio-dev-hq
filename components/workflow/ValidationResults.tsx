import type { ValidationCheck, ValidationStatus } from "@/types/workflow";
import { Panel } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

const STATUS_META: Record<ValidationStatus, { label: string; color: string }> = {
  pending: { label: "Pending", color: COLORS.idle },
  running: { label: "Running", color: COLORS.run },
  passed: { label: "Passed", color: COLORS.ok },
  failed: { label: "Failed", color: COLORS.err },
};

function StatusPill({ status }: { status: ValidationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10.5px] font-medium ${status === "running" ? "savrio-pulse" : ""}`}
      style={{ color: meta.color, background: `${meta.color}18`, border: `1px solid ${meta.color}33` }}
    >
      {status === "running" && (
        <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.color }} />
      )}
      {meta.label}
    </span>
  );
}

export function ValidationResults({ checks }: { checks: ValidationCheck[] }) {
  return (
    <Panel title="Validation" subtitle="Simulated — no commands are executed">
      <ul className="flex flex-col gap-2" role="list">
        {checks.map((check) => (
          <li
            key={check.id}
            className="flex items-center justify-between gap-3 rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2"
          >
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-[var(--text)]">{check.label}</span>
                {check.optional && (
                  <span className="text-[9.5px] uppercase tracking-wide text-[var(--text-faint)]">
                    optional
                  </span>
                )}
              </div>
              <code className="block truncate font-mono text-[10.5px] text-[var(--text-faint)]">
                {check.command}
              </code>
            </div>
            <StatusPill status={check.status} />
          </li>
        ))}
      </ul>
    </Panel>
  );
}
