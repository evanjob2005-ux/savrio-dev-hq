import type { IsoTimestamp, Project } from "@/types/domain";

export interface CreateProjectInput {
  name: string;
  slug: string;
  description: string;
  repository: string;
  defaultBranch: string;
  status: Project["status"];
  ownerId: string;
  /**
   * Stamped as both createdAt and updatedAt. Callers that create several
   * records as one logical operation pass a shared value so the records agree.
   */
  at?: IsoTimestamp;
}

export interface ProjectRepository {
  listProjects(): Promise<Project[]>;
  getProject(id: string): Promise<Project | null>;
  createProject(input: CreateProjectInput): Promise<Project>;
}
