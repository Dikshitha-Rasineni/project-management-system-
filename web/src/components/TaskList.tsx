import clsx from 'clsx';
import { Check, Pencil, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useUpdateTask } from '../hooks/queries';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '../utils/constants';
import { dueLabel } from '../utils/dates';
import { PriorityBadge, TaskStatusBadge } from './ui/Badge';
import { IconButton } from './ui/Button';

interface Props {
  tasks: Task[];
  showProject?: boolean;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}

const statusDot: Record<TaskStatus, string> = {
  PENDING: 'bg-pending',
  IN_PROGRESS: 'bg-progress-bar',
  COMPLETED: 'bg-done-bar',
};

const inlineSelect =
  'h-8 cursor-pointer rounded-[6px] border border-transparent bg-transparent px-1.5 text-[13px] text-ink-soft hover:border-line-strong focus:border-action focus:outline-none disabled:opacity-50';

/**
 * Task rows with inline controls: tick to complete, change status and
 * priority in place, edit or delete. Collapses to stacked rows on phones.
 */
export function TaskList({ tasks, showProject, onEdit, onDelete }: Props) {
  const update = useUpdateTask();
  const pendingId = update.isPending ? update.variables?.id : undefined;

  const setStatus = (task: Task, status: TaskStatus) => update.mutate({ id: task.id, data: { status } });
  const setPriority = (task: Task, priority: TaskPriority) => update.mutate({ id: task.id, data: { priority } });

  return (
    <ul className="divide-y divide-line overflow-hidden rounded-[var(--radius-box)] border border-line bg-surface">
      <li className="hidden grid-cols-[28px_minmax(0,1fr)_150px_120px_120px_72px] items-center gap-3 bg-paper px-4 py-2 text-xs font-medium text-ink-mute md:grid">
        <span aria-hidden="true" />
        <span>Task</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Due</span>
        <span aria-hidden="true" />
      </li>
      {tasks.map((task) => {
        const done = task.status === 'COMPLETED';
        const due = dueLabel(task.dueDate, done);
        const busy = pendingId === task.id;
        return (
          <li
            key={task.id}
            className={clsx(
              'grid grid-cols-[28px_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-2 px-4 py-3 transition-opacity md:grid-cols-[28px_minmax(0,1fr)_150px_120px_120px_72px] md:items-center',
              busy && 'opacity-60',
            )}
          >
            <button
              type="button"
              role="checkbox"
              aria-checked={done}
              aria-label={done ? `Mark “${task.name}” as not completed` : `Mark “${task.name}” as completed`}
              disabled={busy}
              onClick={() => setStatus(task, done ? 'PENDING' : 'COMPLETED')}
              className={clsx(
                'mt-0.5 flex size-5 items-center justify-center rounded-[5px] border transition-colors md:mt-0',
                done ? 'border-done-bar bg-done-bar text-white' : 'border-line-strong bg-surface hover:border-done-bar',
              )}
            >
              {done && <Check className="size-3.5" strokeWidth={3} />}
            </button>

            <div className="min-w-0">
              <button
                type="button"
                onClick={() => onEdit(task)}
                className={clsx(
                  'block max-w-full truncate text-left text-sm font-medium hover:text-action',
                  done && 'text-ink-mute line-through',
                )}
              >
                {task.name}
              </button>
              {(task.description || (showProject && task.project)) && (
                <p className="mt-0.5 truncate text-[13px] text-ink-mute">
                  {showProject && task.project && (
                    <Link to={`/projects/${task.project.id}`} className="font-medium text-ink-soft hover:text-action">
                      {task.project.name}
                    </Link>
                  )}
                  {showProject && task.project && task.description && <span aria-hidden="true"> / </span>}
                  {task.description}
                </p>
              )}
              {/* Compact badges on phones; full inline controls on md+ */}
              <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
                <TaskStatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <span
                  className={clsx(
                    'text-xs',
                    due.tone === 'late' ? 'font-medium text-danger' : due.tone === 'warn' ? 'text-progress' : 'text-ink-mute',
                  )}
                >
                  {due.text}
                </span>
              </div>
            </div>

            <div className="hidden md:flex md:items-center md:gap-1">
              <span className={clsx('size-2 shrink-0 rounded-full', statusDot[task.status])} aria-hidden="true" />
              <select
                aria-label={`Status of ${task.name}`}
                value={task.status}
                disabled={busy}
                onChange={(e) => setStatus(task, e.target.value as TaskStatus)}
                className={inlineSelect}
              >
                {TASK_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {TASK_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
            <div className="hidden md:flex md:items-center md:gap-0.5">
              <PriorityBadge priority={task.priority} hideLabel />
              <select
                aria-label={`Priority of ${task.name}`}
                value={task.priority}
                disabled={busy}
                onChange={(e) => setPriority(task, e.target.value as TaskPriority)}
                className={inlineSelect}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABEL[p]}
                  </option>
                ))}
              </select>
            </div>
            <span
              className={clsx(
                'hidden text-[13px] md:block',
                due.tone === 'late' ? 'font-medium text-danger' : due.tone === 'warn' ? 'text-progress' : 'text-ink-soft',
              )}
            >
              {due.text}
            </span>

            <div className="flex justify-end gap-0.5">
              <IconButton label={`Edit ${task.name}`} onClick={() => onEdit(task)}>
                <Pencil className="size-4" />
              </IconButton>
              <IconButton label={`Delete ${task.name}`} tone="danger" onClick={() => onDelete(task)}>
                <Trash2 className="size-4" />
              </IconButton>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
