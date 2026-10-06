import type { Project, Task, User } from '../generated/prisma/client';
import { toDateOnly } from './dates';

/**
 * Serializers are the ONLY way entities leave the API. They whitelist fields,
 * so internal columns (passwordHash, ownerId, ...) can never leak by accident.
 */

export function serializeUser(user: Pick<User, 'id' | 'fullName' | 'email' | 'createdAt'>) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    createdAt: user.createdAt.toISOString(),
  };
}

export interface TaskCounts {
  total: number;
  completed: number;
}

export function serializeProject(project: Project, counts?: TaskCounts) {
  return {
    id: project.id,
    name: project.name,
    description: project.description,
    status: project.status,
    startDate: toDateOnly(project.startDate),
    endDate: toDateOnly(project.endDate),
    createdAt: project.createdAt.toISOString(),
    updatedAt: project.updatedAt.toISOString(),
    ...(counts
      ? {
          taskCount: counts.total,
          completedTaskCount: counts.completed,
          progress: counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100),
        }
      : {}),
  };
}

export function serializeTask(task: Task & { project?: { id: string; name: string } }) {
  return {
    id: task.id,
    name: task.name,
    description: task.description,
    priority: task.priority,
    status: task.status,
    dueDate: toDateOnly(task.dueDate),
    completedAt: task.completedAt ? task.completedAt.toISOString() : null,
    projectId: task.projectId,
    ...(task.project ? { project: { id: task.project.id, name: task.project.name } } : {}),
    createdAt: task.createdAt.toISOString(),
    updatedAt: task.updatedAt.toISOString(),
  };
}
