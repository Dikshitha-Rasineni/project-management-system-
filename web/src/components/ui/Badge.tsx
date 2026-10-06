import clsx from 'clsx';
import type { ProjectStatus, TaskPriority, TaskStatus } from '../../types';
import { PRIORITY_LABEL, PROJECT_STATUS_LABEL, TASK_STATUS_LABEL } from '../../utils/constants';

const statusTone = {
  pending: 'bg-pending-tint text-pending',
  progress: 'bg-progress-tint text-progress',
  done: 'bg-done-tint text-done',
} as const;

const dotTone = {
  pending: 'bg-pending',
  progress: 'bg-progress-bar',
  done: 'bg-done-bar',
} as const;

type Tone = keyof typeof statusTone;

function Pill({ tone, children }: { tone: Tone; children: string }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full py-0.5 pr-2.5 pl-2 text-xs font-medium whitespace-nowrap',
        statusTone[tone],
      )}
    >
      <span className={clsx('size-1.5 rounded-full', dotTone[tone])} aria-hidden="true" />
      {children}
    </span>
  );
}

const projectTone: Record<ProjectStatus, Tone> = { NOT_STARTED: 'pending', IN_PROGRESS: 'progress', COMPLETED: 'done' };
const taskTone: Record<TaskStatus, Tone> = { PENDING: 'pending', IN_PROGRESS: 'progress', COMPLETED: 'done' };

export function ProjectStatusBadge({ status }: { status: ProjectStatus }) {
  return <Pill tone={projectTone[status]}>{PROJECT_STATUS_LABEL[status]}</Pill>;
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <Pill tone={taskTone[status]}>{TASK_STATUS_LABEL[status]}</Pill>;
}

/**
 * Priority is shown as a 3-step signal (filled bars), so it reads at a glance
 * and stays distinguishable from status colours and for colour-blind users.
 */
export function PriorityBadge({ priority, hideLabel }: { priority: TaskPriority; hideLabel?: boolean }) {
  const level = priority === 'HIGH' ? 3 : priority === 'MEDIUM' ? 2 : 1;
  const color = priority === 'HIGH' ? 'bg-danger' : priority === 'MEDIUM' ? 'bg-progress-bar' : 'bg-pending';
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-soft whitespace-nowrap">
      <span className="flex items-end gap-[2px]" aria-hidden="true">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className={clsx(
              'w-[3px] rounded-sm',
              n <= level ? color : 'bg-line',
              n === 1 ? 'h-1.5' : n === 2 ? 'h-2.5' : 'h-3.5',
            )}
          />
        ))}
      </span>
      {hideLabel ? <span className="sr-only">{PRIORITY_LABEL[priority]}</span> : PRIORITY_LABEL[priority]}
    </span>
  );
}

export const statusBarColor: Record<TaskStatus, string> = {
  PENDING: 'bg-pending/70',
  IN_PROGRESS: 'bg-progress-bar',
  COMPLETED: 'bg-done-bar',
};
