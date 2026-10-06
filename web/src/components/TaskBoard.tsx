import { ListPlus, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDeleteTask, useTasks } from '../hooks/queries';
import { useDebounce } from '../hooks/useDebounce';
import { useUrlState } from '../hooks/useUrlState';
import { getErrorMessage } from '../services/api';
import type { Task, TaskPriority, TaskStatus } from '../types';
import { PRIORITIES, PRIORITY_LABEL, TASK_STATUSES, TASK_STATUS_LABEL } from '../utils/constants';
import { TaskFormModal } from './TaskFormModal';
import { TaskList } from './TaskList';
import { Button } from './ui/Button';
import { ConfirmDialog } from './ui/ConfirmDialog';
import { Select } from './ui/Field';
import { EmptyState, ErrorState, Skeleton, Spinner } from './ui/States';
import { FilterBar, Pagination, SearchInput, SegmentedFilter } from './ui/Toolbar';

const SORTS = [
  { value: 'createdAt:desc', label: 'Newest first' },
  { value: 'dueDate:asc', label: 'Due date' },
  { value: 'priority:desc', label: 'Priority' },
  { value: 'name:asc', label: 'Name A–Z' },
];

interface Props {
  /** When set, the board is scoped to one project (project details page). */
  projectId?: string;
  pageSize?: number;
}

/**
 * Search + status/priority filters + sortable, paginated task list, with
 * create/edit/delete. Filters live in the URL. Used on the project details
 * page and on the "All tasks" page.
 */
export function TaskBoard({ projectId, pageSize = 25 }: Props) {
  const [url, setUrl] = useUrlState(['search', 'status', 'priority', 'sortBy', 'page'] as const);
  const [searchText, setSearchText] = useState(url.search);
  const search = useDebounce(searchText.trim(), 300);
  const status = (TASK_STATUSES as string[]).includes(url.status) ? (url.status as TaskStatus) : '';
  const priority = (PRIORITIES as string[]).includes(url.priority) ? (url.priority as TaskPriority) : '';
  const sortValue = SORTS.some((s) => s.value === url.sortBy)
    ? url.sortBy
    : url.sortBy === 'dueDate'
      ? 'dueDate:asc'
      : SORTS[0]!.value;
  const [sortBy, order] = sortValue.split(':') as [string, 'asc' | 'desc'];
  const page = Math.max(1, Number(url.page) || 1);

  const [editing, setEditing] = useState<Task | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const del = useDeleteTask();

  useEffect(() => {
    if (search !== url.search) setUrl({ search });
  }, [search, url.search, setUrl]);

  const { data, isLoading, isError, error, refetch, isFetching } = useTasks({
    projectId,
    search,
    status,
    priority,
    sortBy,
    order,
    page,
    limit: pageSize,
  });

  const filtered = Boolean(search || status || priority);

  return (
    <section aria-label="Tasks">
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">
            Tasks {data && <span className="font-normal text-ink-mute">({data.pagination.total})</span>}
          </h2>
          <Button size="sm" onClick={() => setCreating(true)}>
            <ListPlus className="size-4" /> Add task
          </Button>
        </div>
        <FilterBar>
          <SearchInput label="Search tasks" value={searchText} onChange={setSearchText} placeholder="Search tasks by name" />
          <div className="overflow-x-auto">
            <SegmentedFilter
              label="Filter by status"
              value={status}
              onChange={(v) => setUrl({ status: v })}
              options={TASK_STATUSES.map((s) => ({ value: s, label: TASK_STATUS_LABEL[s] }))}
            />
          </div>
          <div className="flex gap-3">
            <Select
              aria-label="Filter by priority"
              value={priority}
              onChange={(e) => setUrl({ priority: e.target.value })}
              className="w-40"
            >
              <option value="">Any priority</option>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {PRIORITY_LABEL[p]} priority
                </option>
              ))}
            </Select>
            <Select
              aria-label="Sort tasks"
              value={sortValue}
              onChange={(e) => setUrl({ sortBy: e.target.value })}
              className="w-40"
            >
              {SORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
          {isFetching && !isLoading && <Spinner className="size-4 text-ink-mute" />}
        </FilterBar>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : data && data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            compact
            icon={<SearchX className="size-7" />}
            title="No tasks match"
            description="Try a different name, status or priority."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchText('');
                  setUrl({ search: '', status: '', priority: '' });
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            compact
            icon={<ListPlus className="size-7" />}
            title="No tasks yet"
            description={
              projectId ? 'Break this project into tasks to track its progress.' : 'Tasks you add to any project show up here.'
            }
            action={
              <Button onClick={() => setCreating(true)}>
                <ListPlus className="size-4" /> Add task
              </Button>
            }
          />
        )
      ) : data ? (
        <>
          <TaskList tasks={data.items} showProject={!projectId} onEdit={setEditing} onDelete={setDeleting} />
          <div className="mt-3">
            <Pagination meta={data.pagination} onPage={(n) => setUrl({ page: String(n) }, false)} />
          </div>
        </>
      ) : null}

      <TaskFormModal open={creating} projectId={projectId} onClose={() => setCreating(false)} />
      <TaskFormModal open={Boolean(editing)} task={editing} projectId={projectId} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete task?"
        message={`“${deleting?.name ?? ''}” will be permanently deleted. This can’t be undone.`}
        confirmLabel="Delete task"
        loading={del.isPending}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && del.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </section>
  );
}
