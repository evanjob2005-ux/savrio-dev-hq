import type { Project } from "@/types/domain";
import { Panel, Badge, StatusDot } from "@/components/ui/primitives";
import { COLORS } from "@/lib/theme";

const STATUS_COLOR: Record<Project["status"], string> = {
  draft: COLORS.idle,
  active: COLORS.ok,
  paused: COLORS.warn,
  blocked: COLORS.err,
  completed: COLORS.ok,
  archived: COLORS.idle,
};

export function ProjectsPanel({ projects }: { projects: Project[] }) {
  return (
    <Panel title="Projects" subtitle={`${projects.length} registered`} bodyClassName="p-0">
      <ul className="divide-y divide-[var(--border)]" role="list">
        {projects.map((project) => (
          <li key={project.id} className="px-4 py-3">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <h3 className="truncate text-[13px] font-medium text-[var(--text)]">
                  {project.name}
                </h3>
                <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug text-[var(--text-dim)]">
                  {project.description}
                </p>
              </div>
              <Badge color={STATUS_COLOR[project.status]}>{project.status}</Badge>
            </div>
            <div className="mt-2 flex items-center gap-2 font-mono text-[10.5px] text-[var(--text-faint)]">
              <StatusDot color={STATUS_COLOR[project.status]} size={6} />
              <span className="truncate">{project.repository}</span>
              <span className="text-[var(--border-strong)]">/</span>
              <span>{project.defaultBranch}</span>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
