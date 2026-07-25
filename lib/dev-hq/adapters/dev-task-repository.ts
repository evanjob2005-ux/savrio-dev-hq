import type {
  CreateTaskInput,
  TaskFilter,
  TaskRepository,
  UpdateTaskInput,
} from "@/types/contracts";
import type { Task, TaskDependency } from "@/types/domain";
import { getDevHqStore, saveTask } from "@/lib/dev-hq/store";
import { nextId, nowIso } from "@/lib/dev-hq/id";

/** Development-only in-memory TaskRepository adapter. */
export class DevTaskRepository implements TaskRepository {
  async listTasks(filter?: TaskFilter): Promise<Task[]> {
    let tasks = [...getDevHqStore().tasks.values()];
    if (filter?.projectId) {
      tasks = tasks.filter((t) => t.projectId === filter.projectId);
    }
    if (filter?.status) {
      tasks = tasks.filter((t) => t.status === filter.status);
    }
    if (filter?.assigneeAgentId) {
      tasks = tasks.filter((t) => t.assigneeAgentId === filter.assigneeAgentId);
    }
    return tasks.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }

  async getTask(id: string): Promise<Task | null> {
    return getDevHqStore().tasks.get(id) ?? null;
  }

  async createTask(input: CreateTaskInput): Promise<Task> {
    const timestamp = nowIso();
    const task: Task = {
      id: nextId("task"),
      projectId: input.projectId,
      workflowId: input.workflowId ?? null,
      title: input.title,
      description: input.description,
      status: "draft",
      priority: input.priority,
      assigneeAgentId: null,
      claimedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
      dueAt: input.dueAt ?? null,
    };
    return saveTask(task);
  }

  async updateTask(id: string, input: UpdateTaskInput): Promise<Task> {
    const existing = await this.getTask(id);
    if (!existing) {
      throw new Error(`Task not found: ${id}`);
    }
    const { occurredAt, ...fields } = input;
    const updated: Task = {
      ...existing,
      ...fields,
      updatedAt: occurredAt ?? nowIso(),
    };
    return saveTask(updated);
  }

  async claimTask(id: string, agentId: string): Promise<Task> {
    return this.updateTask(id, {
      assigneeAgentId: agentId,
      status: "active",
    });
  }

  async listDependencies(taskId: string): Promise<TaskDependency[]> {
    void taskId;
    return [];
  }
}

export function createDevTaskRepository(): DevTaskRepository {
  return new DevTaskRepository();
}
