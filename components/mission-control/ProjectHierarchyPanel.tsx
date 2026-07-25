// Every project with its orchestration, workflow position, tasks, and owners.
// Projects that need founder attention are surfaced first.

import { Panel } from "@/components/ui/primitives";
import { DataSourceBadge, NotImplementedNote } from "@/components/mission-control/DataSourceBadge";
import { EmptyState } from "@/components/mission-control/primitives";
import { ProjectOrchestratorCard } from "@/components/mission-control/ProjectOrchestratorCard";
import type { ProjectNode } from "@/lib/mission-control/view-model";

export function ProjectHierarchyPanel({ projects }: { projects: ProjectNode[] }) {
  const ordered = [...projects].sort((a, b) => {
    if (a.needsAttention !== b.needsAttention) return a.needsAttention ? -1 : 1;
    return b.project.updatedAt.localeCompare(a.project.updatedAt);
  });

  const attention = ordered.filter((p) => p.needsAttention).length;

  return (
    <Panel
      title="Projects & Orchestrators"
      subtitle={
        projects.length === 0
          ? "No projects yet"
          : `${projects.length} project${projects.length === 1 ? "" : "s"} · ${attention} needing attention`
      }
      right={<DataSourceBadge source="live" />}
    >
      {ordered.length === 0 ? (
        <EmptyState
          title="No projects yet"
          detail="Submitting a founder request creates a project, a task, and a workflow run. They will appear here as soon as one exists."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {/* Two-up at xl; the page shell caps content at 1440px, so a 2xl rule
              would never apply. */}
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            {ordered.map((node) => (
              <ProjectOrchestratorCard key={node.project.id} node={node} />
            ))}
          </div>
          <NotImplementedNote>
            Task dependencies, agent claims, and per-project orchestrators are not recorded by
            the current backend, so they are shown as absent rather than estimated. The
            founder-request workflow validates and gates a request; it does not yet dispatch
            work to an implementation agent.
          </NotImplementedNote>
        </div>
      )}
    </Panel>
  );
}
