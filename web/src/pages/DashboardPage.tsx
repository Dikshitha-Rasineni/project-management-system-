import clsx from 'clsx';
import { AlertTriangle, CalendarClock, FolderPlus, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { TaskFormModal } from '../components/TaskFormModal';
import { PriorityBadge, ProjectStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../hooks/queries';
import { PageHeader } from '../layouts/AppLayout';
import { getErrorMessage } from '../services/api';
import type { DashboardStats } from '../types';
import { dueLabel } from '../utils/dates';

function greeting() {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
}

/** The five required statistics in one divided strip. */
function StatStrip({ d }: { d: DashboardStats }) {
  const stats = [
    { label: 'Total projects', value: d.totalProjects, to: '/projects' },
    { label: 'Projects in progress', value: d.projectsInProgress, to: '/projects?status=IN_PROGRESS' },
    { label: 'Total tasks', value: d.totalTasks, to: '/tasks' },
    { label: 'Completed tasks', value: d.completedTasks, to: '/tasks?status=COMPLETED' },
    { label: 'Pending tasks', value: d.pendingTasks, to: '/tasks?status=PENDING' },
  ];
  return (
    <dl className="grid grid-cols-2 overflow-hidden rounded-[var(--radius-box)] border border-line bg-line gap-px sm:grid-cols-3 lg:grid-cols-5">
      {stats.map((s) => (
        <Link
          key={s.label}
          to={s.to}
          className="group bg-surface px-5 py-4 transition-colors hover:bg-paper last:col-span-2 sm:last:col-span-1"
        >
          <dt className="text-[13px] text-ink-soft group-hover:text-ink">{s.label}</dt>
          <dd className="mt-1 text-[30px] leading-none font-semibold tracking-tight">{s.value}</dd>
        </Link>
      ))}
    </dl>
  );
}

/** Signature element: how all tasks split across states, as one bar. */
function WorkBar({ d }: { d: DashboardStats }) {
  const segments = [
    { key: 'done', label: 'Completed', value: d.completedTasks, bar: 'bg-done-bar' },
    { key: 'progress', label: 'In progress', value: d.inProgressTasks, bar: 'bg-progress-bar' },
    { key: 'pending', label: 'Pending', value: d.pendingTasks, bar: 'bg-pending/55' },
  ];
  const total = d.totalTasks || 1;
  return (
    <section aria-labelledby="workbar-title" className="rounded-[var(--radius-box)] border border-line bg-surface p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="workbar-title" className="text-base font-semibold">
          Task progress
        </h2>
        <p className="text-sm text-ink-soft">
          <span className="text-[22px] font-semibold text-ink">{d.completionRate}%</span> of all tasks completed
        </p>
      </div>
      <div className="mt-4 flex h-4 gap-[3px] overflow-hidden rounded-full bg-paper" aria-hidden="true">
        {d.totalTasks === 0 ? (
          <span className="w-full rounded-full bg-line" />
        ) : (
          segments
            .filter((s) => s.value > 0)
            .map((s, i) => (
              <span
                key={s.key}
                className={clsx('animate-grow-x', s.bar)}
                style={{ width: `${(s.value / total) * 100}%`, animationDelay: `${i * 90}ms` }}
              />
            ))
        )}
      </div>
      <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2 text-ink-soft">
            <span className={clsx('size-2.5 rounded-sm', s.bar)} aria-hidden="true" />
            {s.label} <span className="font-semibold text-ink">{s.value}</span>
          </li>
        ))}
        {d.overdueTasks > 0 && (
          <li className="flex items-center gap-1.5 font-medium text-danger">
            <AlertTriangle className="size-4" aria-hidden="true" />
            {d.overdueTasks} overdue
          </li>
        )}
      </ul>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true" aria-label="Loading dashboard">
      <Skeleton className="h-[88px] w-full" />
      <Skeleton className="h-36 w-full" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const { data, isLoading, isError, error, refetch } = useDashboard();
  const [projectOpen, setProjectOpen] = useState(false);
  const [taskOpen, setTaskOpen] = useState(false);
  const firstName = user?.fullName.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName}`}
        subtitle="Here’s where your projects and tasks stand today."
        actions={
          data && data.totalProjects > 0 ? (
            <>
              <Button variant="secondary" onClick={() => setTaskOpen(true)}>
                <Plus className="size-4" /> New task
              </Button>
              <Button onClick={() => setProjectOpen(true)}>
                <FolderPlus className="size-4" /> New project
              </Button>
            </>
          ) : undefined
        }
      />

      {isLoading ? (
        <DashboardSkeleton />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : data && data.totalProjects === 0 ? (
        <EmptyState
          icon={<FolderPlus className="size-8" />}
          title="Create your first project"
          description="Projects hold your tasks. Once you add one, your progress shows up here."
          action={
            <Button onClick={() => setProjectOpen(true)}>
              <FolderPlus className="size-4" /> New project
            </Button>
          }
        />
      ) : data ? (
        <div className="space-y-6">
          <StatStrip d={data} />
          <WorkBar d={data} />

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
            <section aria-labelledby="upcoming-title" className="rounded-[var(--radius-box)] border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 id="upcoming-title" className="text-base font-semibold">
                  Upcoming deadlines
                </h2>
                <Link to="/tasks?sortBy=dueDate" className="text-sm font-medium text-action hover:underline">
                  View all tasks
                </Link>
              </div>
              {data.upcomingTasks.length === 0 ? (
                <p className="flex items-center gap-2 px-5 py-8 text-sm text-ink-mute">
                  <CalendarClock className="size-4" aria-hidden="true" /> No open tasks with a due date.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {data.upcomingTasks.map((t) => {
                    const due = dueLabel(t.dueDate, false);
                    return (
                      <li key={t.id}>
                        <Link to={`/projects/${t.projectId}`} className="flex items-center gap-4 px-5 py-3 hover:bg-paper">
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">{t.name}</p>
                            <p className="truncate text-[13px] text-ink-mute">{t.project?.name}</p>
                          </div>
                          <PriorityBadge priority={t.priority} hideLabel />
                          <span
                            className={clsx(
                              'w-24 shrink-0 text-right text-[13px]',
                              due.tone === 'late'
                                ? 'font-medium text-danger'
                                : due.tone === 'warn'
                                  ? 'text-progress'
                                  : 'text-ink-soft',
                            )}
                          >
                            {due.text}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            <section aria-labelledby="recent-title" className="rounded-[var(--radius-box)] border border-line bg-surface">
              <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                <h2 id="recent-title" className="text-base font-semibold">
                  Recently updated projects
                </h2>
                <Link to="/projects" className="text-sm font-medium text-action hover:underline">
                  All projects
                </Link>
              </div>
              <ul className="divide-y divide-line">
                {data.recentProjects.map((p) => (
                  <li key={p.id}>
                    <Link to={`/projects/${p.id}`} className="block px-5 py-3.5 hover:bg-paper">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <ProjectStatusBadge status={p.status} />
                      </div>
                      <div className="mt-2.5 flex items-center gap-3">
                        <ProgressBar value={p.progress} className="flex-1" />
                        <span className="w-20 shrink-0 text-right text-xs text-ink-mute">
                          {p.completedTaskCount}/{p.taskCount} tasks
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-x-5 gap-y-1 border-t border-line px-5 py-3 text-[13px] text-ink-soft">
                <span>Open tasks by priority:</span>
                <span>
                  High <strong className="text-ink">{data.openTasksByPriority.HIGH}</strong>
                </span>
                <span>
                  Medium <strong className="text-ink">{data.openTasksByPriority.MEDIUM}</strong>
                </span>
                <span>
                  Low <strong className="text-ink">{data.openTasksByPriority.LOW}</strong>
                </span>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <ProjectFormModal open={projectOpen} onClose={() => setProjectOpen(false)} />
      <TaskFormModal open={taskOpen} onClose={() => setTaskOpen(false)} />
    </>
  );
}
