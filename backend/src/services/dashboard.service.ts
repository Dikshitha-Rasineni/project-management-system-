import { prisma } from '../config/prisma';
import { todayUtc } from '../utils/dates';
import { serializeProject, serializeTask } from '../utils/serializers';

/**
 * All statistics are computed live from the database for the authenticated
 * user only, so the dashboard always reflects the latest changes made from
 * either client.
 *
 * Definitions:
 *   pendingTasks     = tasks with status PENDING (not started)
 *   inProgressTasks  = tasks with status IN_PROGRESS
 *   completedTasks   = tasks with status COMPLETED
 *   totalTasks       = pending + inProgress + completed
 *   overdueTasks     = not completed and due before today
 */
export async function getDashboard(userId: string) {
  const taskScope = { project: { ownerId: userId } };
  const today = todayUtc();

  const [projectGroups, taskStatusGroups, openPriorityGroups, overdueTasks, upcoming, recentProjects] =
    await Promise.all([
      prisma.project.groupBy({ by: ['status'], where: { ownerId: userId }, _count: { _all: true } }),
      prisma.task.groupBy({ by: ['status'], where: taskScope, _count: { _all: true } }),
      prisma.task.groupBy({
        by: ['priority'],
        where: { ...taskScope, status: { not: 'COMPLETED' } },
        _count: { _all: true },
      }),
      prisma.task.count({
        where: { ...taskScope, status: { not: 'COMPLETED' }, dueDate: { lt: today } },
      }),
      prisma.task.findMany({
        where: { ...taskScope, status: { not: 'COMPLETED' }, dueDate: { not: null } },
        orderBy: [{ dueDate: 'asc' }, { priority: 'desc' }],
        take: 6,
        include: { project: { select: { id: true, name: true } } },
      }),
      prisma.project.findMany({
        where: { ownerId: userId },
        orderBy: { updatedAt: 'desc' },
        take: 5,
      }),
    ]);

  const projectsBy = Object.fromEntries(projectGroups.map((g) => [g.status, g._count._all]));
  const tasksBy = Object.fromEntries(taskStatusGroups.map((g) => [g.status, g._count._all]));
  const priorityBy = Object.fromEntries(openPriorityGroups.map((g) => [g.priority, g._count._all]));

  const completedTasks = tasksBy.COMPLETED ?? 0;
  const pendingTasks = tasksBy.PENDING ?? 0;
  const inProgressTasks = tasksBy.IN_PROGRESS ?? 0;
  const totalTasks = completedTasks + pendingTasks + inProgressTasks;
  const totalProjects = Object.values(projectsBy).reduce((sum, n) => sum + n, 0);

  // Progress for the "recent projects" widget.
  const recentIds = recentProjects.map((p) => p.id);
  const recentCounts = recentIds.length
    ? await prisma.task.groupBy({
        by: ['projectId', 'status'],
        where: { projectId: { in: recentIds } },
        _count: { _all: true },
      })
    : [];
  const countsFor = (id: string) => {
    const rows = recentCounts.filter((r) => r.projectId === id);
    return {
      total: rows.reduce((s, r) => s + r._count._all, 0),
      completed: rows.filter((r) => r.status === 'COMPLETED').reduce((s, r) => s + r._count._all, 0),
    };
  };

  return {
    totalProjects,
    totalTasks,
    completedTasks,
    pendingTasks,
    inProgressTasks,
    projectsInProgress: projectsBy.IN_PROGRESS ?? 0,
    projectsNotStarted: projectsBy.NOT_STARTED ?? 0,
    projectsCompleted: projectsBy.COMPLETED ?? 0,
    overdueTasks,
    completionRate: totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100),
    openTasksByPriority: {
      HIGH: priorityBy.HIGH ?? 0,
      MEDIUM: priorityBy.MEDIUM ?? 0,
      LOW: priorityBy.LOW ?? 0,
    },
    upcomingTasks: upcoming.map(serializeTask),
    recentProjects: recentProjects.map((p) => serializeProject(p, countsFor(p.id))),
  };
}
