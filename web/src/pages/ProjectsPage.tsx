import { CalendarDays, FolderPlus, SearchX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { ProjectStatusBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { EmptyState, ErrorState, Skeleton, Spinner } from '../components/ui/States';
import { FilterBar, Pagination, SearchInput, SegmentedFilter } from '../components/ui/Toolbar';
import { useProjects } from '../hooks/queries';
import { useDebounce } from '../hooks/useDebounce';
import { useUrlState } from '../hooks/useUrlState';
import { PageHeader } from '../layouts/AppLayout';
import { getErrorMessage } from '../services/api';
import type { ProjectStatus } from '../types';
import { PROJECT_STATUSES, PROJECT_STATUS_LABEL } from '../utils/constants';
import { formatShortDate } from '../utils/dates';

const PAGE_SIZE = 12;

export function ProjectsPage() {
  const [url, setUrl] = useUrlState(['search', 'status', 'page'] as const);
  const [searchText, setSearchText] = useState(url.search);
  const search = useDebounce(searchText.trim(), 300);
  const status = (PROJECT_STATUSES as string[]).includes(url.status) ? (url.status as ProjectStatus) : '';
  const page = Math.max(1, Number(url.page) || 1);
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    if (search !== url.search) setUrl({ search });
  }, [search, url.search, setUrl]);

  const { data, isLoading, isError, error, refetch, isFetching } = useProjects({
    search,
    status,
    page,
    limit: PAGE_SIZE,
    sortBy: 'createdAt',
    order: 'desc',
  });

  const filtered = Boolean(search || status);

  return (
    <>
      <PageHeader
        title="Projects"
        subtitle={
          data
            ? `${data.pagination.total} ${data.pagination.total === 1 ? 'project' : 'projects'}${filtered ? ' match your filters' : ''}`
            : undefined
        }
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <FolderPlus className="size-4" /> New project
          </Button>
        }
      />

      <div className="mb-5">
        <FilterBar>
          <SearchInput
            label="Search projects"
            value={searchText}
            onChange={setSearchText}
            placeholder="Search projects by name"
          />
          <div className="overflow-x-auto">
            <SegmentedFilter
              label="Filter by status"
              value={status}
              onChange={(v) => setUrl({ status: v })}
              options={PROJECT_STATUSES.map((s) => ({ value: s, label: PROJECT_STATUS_LABEL[s] }))}
            />
          </div>
          {isFetching && !isLoading && <Spinner className="size-4 text-ink-mute" />}
        </FilterBar>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-44" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : data && data.items.length === 0 ? (
        filtered ? (
          <EmptyState
            icon={<SearchX className="size-8" />}
            title="No projects match"
            description="Try a different name or status."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearchText('');
                  setUrl({ search: '', status: '' });
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<FolderPlus className="size-8" />}
            title="No projects yet"
            description="Create a project to start organising your tasks."
            action={
              <Button onClick={() => setCreateOpen(true)}>
                <FolderPlus className="size-4" /> New project
              </Button>
            }
          />
        )
      ) : data ? (
        <>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.items.map((p) => (
              <li key={p.id}>
                <Link
                  to={`/projects/${p.id}`}
                  className="flex h-full flex-col rounded-[var(--radius-box)] border border-line bg-surface p-5 transition-colors hover:border-ink-mute"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="line-clamp-2 text-[15px] leading-snug font-semibold">{p.name}</h2>
                    <ProjectStatusBadge status={p.status} />
                  </div>
                  <p className="mt-2 line-clamp-2 min-h-10 text-sm text-ink-soft">{p.description || 'No description'}</p>
                  <div className="mt-auto pt-5">
                    <div className="mb-2 flex justify-between text-xs text-ink-mute">
                      <span>
                        {p.completedTaskCount} of {p.taskCount} tasks done
                      </span>
                      <span className="font-medium text-ink-soft">{p.progress}%</span>
                    </div>
                    <ProgressBar value={p.progress} />
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-mute">
                      <CalendarDays className="size-3.5" aria-hidden="true" />
                      {formatShortDate(p.startDate)} – {p.endDate ? formatShortDate(p.endDate) : 'No end date'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4">
            <Pagination meta={data.pagination} onPage={(n) => setUrl({ page: String(n) }, false)} />
          </div>
        </>
      ) : null}

      <ProjectFormModal open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
