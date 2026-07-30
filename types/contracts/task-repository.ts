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
  /**
   * Set a task's status only while `precondition` still holds. The precondition
   * is evaluated and the write applied in **one synchronous step** — no await
   * between them — so a concurrent transition cannot land in the gap and then be
   * silently overwritten by a decision made from a stale reading. Implementations
   * must not await inside this operation, and callers must keep the precondition
   * synchronous for the same reason.
   *
   * Returns the task when the write was applied (or already held the status), or
   * null when the task is missing or the precondition refused the write.
   */
  updateTaskStatusIf(
    id: string,
    status: Task["status"],
    precondition: (current: Task) => boolean,
  ): Promise<Task | null>;
  listDependencies(taskId: string): Promise<TaskDependency[]>;
}
