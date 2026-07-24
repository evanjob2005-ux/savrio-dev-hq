import type { ReactNode } from "react";
import type { Task } from "@/types/workflow";
import { Panel } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

function Group({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div>
      <h3 className="text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--text-faint)]">
        {label}
      </h3>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function Bullets({ items, color }: { items: string[]; color?: string }) {
  if (items.length === 0) {
    return <p className="text-[12px] text-[var(--text-faint)]">None.</p>;
  }
  return (
    <ul className="space-y-1" role="list">
      {items.map((item) => (
        <li key={item} className="flex gap-2 text-[12px] leading-snug text-[var(--text-dim)]">
          <span
            className="mt-1.5 h-1 w-1 shrink-0 rounded-full"
            style={{ background: color ?? COLORS.textFaint }}
            aria-hidden
          />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function FileChips({ files, tone }: { files: string[]; tone: string }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {files.map((f) => (
        <code
          key={f}
          className="rounded-md px-1.5 py-0.5 font-mono text-[10.5px]"
          style={{ color: tone, background: `${tone}14`, border: `1px solid ${tone}2a` }}
        >
          {f}
        </code>
      ))}
    </div>
  );
}

export function TaskSpecs({ task }: { task: Task }) {
  return (
    <Panel title="Task Detail" subtitle="Scope & requirements">
      <div className="flex flex-col gap-4">
        <Group label="Acceptance criteria">
          <Bullets items={task.acceptanceCriteria} color={COLORS.ok} />
        </Group>

        <Group label="Expected files">
          <FileChips files={task.expectedFiles} tone={COLORS.run} />
        </Group>

        <Group label="Protected files">
          <FileChips files={task.protectedFiles} tone={COLORS.err} />
        </Group>

        <Group label="Required approvals">
          <Bullets items={task.approvalsRequired} color={COLORS.wait} />
        </Group>

        <Group label="Blockers">
          <Bullets items={task.blockers} color={COLORS.err} />
        </Group>

        <Group label="Known risks">
          <Bullets items={task.knownRisks} color={COLORS.warn} />
        </Group>
      </div>
    </Panel>
  );
}
