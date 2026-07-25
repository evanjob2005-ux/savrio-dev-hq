import type {
  CreateProjectInput,
  ProjectRepository,
} from "@/types/contracts";
import type { Project } from "@/types/domain";
import { getDevHqStore, saveProject } from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

/** Development-only in-memory ProjectRepository adapter. */
export class DevProjectRepository implements ProjectRepository {
  async listProjects(): Promise<Project[]> {
    return [...getDevHqStore().projects.values()].sort((a, b) =>
      b.updatedAt.localeCompare(a.updatedAt),
    );
  }

  async getProject(id: string): Promise<Project | null> {
    return getDevHqStore().projects.get(id) ?? null;
  }

  async createProject(input: CreateProjectInput): Promise<Project> {
    const timestamp = input.at ?? nowIso();
    const project: Project = {
      id: nextId("proj"),
      name: input.name,
      slug: input.slug,
      description: input.description,
      repository: input.repository,
      defaultBranch: input.defaultBranch,
      status: input.status,
      ownerId: input.ownerId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    return saveProject(project);
  }
}

export function createDevProjectRepository(): DevProjectRepository {
  return new DevProjectRepository();
}
