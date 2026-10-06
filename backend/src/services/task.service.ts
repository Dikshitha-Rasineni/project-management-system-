import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { parseDateOnly } from '../utils/dates';
import { buildPagination } from '../utils/response';
import { serializeTask } from '../utils/serializers';
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from '../validators/task.validators';
import { findOwnedProject } from './project.service';

/**
 * Tasks have no owner column of their own (that would duplicate data);
 * ownership is enforced through the parent project: every query filters on
 * `project.ownerId = userId`.
 */
const ownedBy = (userId: string): Prisma.TaskWhereInput => ({ project: { ownerId: userId } });

const projectSummary = { project: { select: { id: true, name: true } } } as const;

export async function listTasks(userId: string, query: ListTasksQuery) {
  const where: Prisma.TaskWhereInput = {
    ...ownedBy(userId),
    ...(query.projectId ? { projectId: query.projectId } : {}),
    ...(query.status ? { status: query.status } : {}),
    ...(query.priority ? { priority: query.priority } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
  };

  // Tasks without a due date sort last when ordering by due date.
  const primaryOrder: Prisma.TaskOrderByWithRelationInput =
    query.sortBy === 'dueDate'
      ? { dueDate: { sort: query.order, nulls: 'last' } }
      : { [query.sortBy]: query.order };

  const [total, tasks] = await prisma.$transaction([
    prisma.task.count({ where }),
    prisma.task.findMany({
      where,
      include: projectSummary,
      orderBy: [primaryOrder, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    items: tasks.map(serializeTask),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

async function findOwnedTask(userId: string, taskId: string) {
  const task = await prisma.task.findFirst({
    where: { id: taskId, ...ownedBy(userId) },
    include: projectSummary,
  });
  if (!task) throw AppError.notFound('Task not found');
  return task;
}

export async function getTask(userId: string, taskId: string) {
  return serializeTask(await findOwnedTask(userId, taskId));
}

export async function createTask(userId: string, input: CreateTaskInput) {
  // The target project must exist AND belong to the caller.
  await findOwnedProject(userId, input.projectId);

  const task = await prisma.task.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      priority: input.priority,
      status: input.status,
      dueDate: input.dueDate ? parseDateOnly(input.dueDate) : null,
      completedAt: input.status === 'COMPLETED' ? new Date() : null,
      projectId: input.projectId,
    },
    include: projectSummary,
  });
  return serializeTask(task);
}

export async function updateTask(userId: string, taskId: string, input: UpdateTaskInput) {
  const existing = await findOwnedTask(userId, taskId);

  // Moving a task is allowed only into another project the caller owns.
  if (input.projectId && input.projectId !== existing.projectId) {
    await findOwnedProject(userId, input.projectId);
  }

  const data: Prisma.TaskUncheckedUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate ? parseDateOnly(input.dueDate) : null;
  if (input.projectId !== undefined) data.projectId = input.projectId;
  if (input.status !== undefined && input.status !== existing.status) {
    data.status = input.status;
    data.completedAt = input.status === 'COMPLETED' ? new Date() : null;
  }

  const task = await prisma.task.update({
    where: { id: existing.id },
    data,
    include: projectSummary,
  });
  return serializeTask(task);
}

export async function deleteTask(userId: string, taskId: string) {
  const result = await prisma.task.deleteMany({ where: { id: taskId, ...ownedBy(userId) } });
  if (result.count === 0) throw AppError.notFound('Task not found');
}
