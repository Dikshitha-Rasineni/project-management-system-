import type { Prisma } from '../generated/prisma/client';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { parseDateOnly, toDateOnly } from '../utils/dates';
import { buildPagination } from '../utils/response';
import { serializeProject, type TaskCounts } from '../utils/serializers';
import type {
  CreateProjectInput,
  ListProjectsQuery,
  UpdateProjectInput,
} from '../validators/project.validators';

/**
 * Authorization rule: every query below includes `ownerId: userId` in its
 * WHERE clause. A project belonging to someone else is indistinguishable from
 * a project that does not exist (404), so IDs cannot be probed (no IDOR).
 */

async function getTaskCounts(projectIds: string[]): Promise<Map<string, TaskCounts>> {
  const counts = new Map<string, TaskCounts>(projectIds.map((id) => [id, { total: 0, completed: 0 }]));
  if (projectIds.length === 0) return counts;

  const grouped = await prisma.task.groupBy({
    by: ['projectId', 'status'],
    where: { projectId: { in: projectIds } },
    _count: { _all: true },
  });

  for (const row of grouped) {
    const entry = counts.get(row.projectId)!;
    entry.total += row._count._all;
    if (row.status === 'COMPLETED') entry.completed += row._count._all;
  }
  return counts;
}

export async function listProjects(userId: string, query: ListProjectsQuery) {
  const where: Prisma.ProjectWhereInput = {
    ownerId: userId,
    ...(query.status ? { status: query.status } : {}),
    ...(query.search ? { name: { contains: query.search, mode: 'insensitive' } } : {}),
  };

  const [total, projects] = await prisma.$transaction([
    prisma.project.count({ where }),
    prisma.project.findMany({
      where,
      // Secondary sort on id keeps pagination stable when values tie.
      orderBy: [{ [query.sortBy]: query.order }, { id: 'asc' }],
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  const counts = await getTaskCounts(projects.map((p) => p.id));
  return {
    items: projects.map((p) => serializeProject(p, counts.get(p.id))),
    pagination: buildPagination(query.page, query.limit, total),
  };
}

/** Loads a project only if it belongs to the user; otherwise 404. */
export async function findOwnedProject(userId: string, projectId: string) {
  const project = await prisma.project.findFirst({ where: { id: projectId, ownerId: userId } });
  if (!project) throw AppError.notFound('Project not found');
  return project;
}

export async function getProject(userId: string, projectId: string) {
  const project = await findOwnedProject(userId, projectId);
  const counts = await getTaskCounts([project.id]);
  return serializeProject(project, counts.get(project.id));
}

export async function createProject(userId: string, input: CreateProjectInput) {
  const project = await prisma.project.create({
    data: {
      name: input.name,
      description: input.description ?? null,
      status: input.status,
      startDate: parseDateOnly(input.startDate),
      endDate: input.endDate ? parseDateOnly(input.endDate) : null,
      ownerId: userId,
    },
  });
  return serializeProject(project, { total: 0, completed: 0 });
}

export async function updateProject(userId: string, projectId: string, input: UpdateProjectInput) {
  const existing = await findOwnedProject(userId, projectId);

  // Cross-field rule must hold for the merged result, not just the payload.
  const nextStart = input.startDate ?? toDateOnly(existing.startDate);
  const nextEnd = input.endDate === undefined ? toDateOnly(existing.endDate) : input.endDate;
  if (nextStart && nextEnd && nextEnd < nextStart) {
    throw AppError.validation([{ field: 'endDate', message: 'End date cannot be before start date' }]);
  }

  const data: Prisma.ProjectUpdateInput = {};
  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.startDate !== undefined) data.startDate = parseDateOnly(input.startDate);
  if (input.endDate !== undefined) data.endDate = input.endDate ? parseDateOnly(input.endDate) : null;

  const updated = await prisma.project.update({ where: { id: existing.id }, data });
  const counts = await getTaskCounts([updated.id]);
  return serializeProject(updated, counts.get(updated.id));
}

export async function deleteProject(userId: string, projectId: string) {
  // Ownership is part of the DELETE's WHERE clause: atomic, no race window.
  // Tasks are removed by the ON DELETE CASCADE foreign key.
  const result = await prisma.project.deleteMany({ where: { id: projectId, ownerId: userId } });
  if (result.count === 0) throw AppError.notFound('Project not found');
}
