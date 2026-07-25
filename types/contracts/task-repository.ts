import type { IsoTimestamp, Task, TaskDependency } from "@/types/domain";

export interface TaskFilter {
  projectId?: string;
  status?: Task["status"];
  assigneeAgentId?: string;
}

export interface CreateTaskInput {
  projectId: string;
  workflowId?: string | null;
  title: string;
  description: string;
  priority: Task["priority"];
  dueAt?: string | null;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: Task["status"];
  priority?: Task["priority"];
  assigneeAgentId?: string | null;
  dueAt?: string | null;
  /**
   * Stamped as updatedAt rather than the time of the call, so a task updated
   * as part of a larger operation shares that operation's timestamp. Not
   * persisted as a field of its own.
   */
  occurredAt?: IsoTimestamp;
}

export interface TaskRepository {
  listTasks(filter?: TaskFilter): Promise<Task[]>;
  getTask(id: string): Promise<Task | null>;
  createTask(input: CreateTaskInput): Promise<Task>;
  updateTask(id: string, input: UpdateTaskInput): Promise<Task>;
  claimTask(id: string, agentId: string): Promise<Task>;
  listDependencies(taskId: string): Promise<TaskDependency[]>;
}
