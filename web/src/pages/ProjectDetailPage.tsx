import axios from 'axios';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ProgressBar } from '../components/ProgressBar';
import { ProjectFormModal } from '../components/ProjectFormModal';
import { TaskBoard } from '../components/TaskBoard';
import { ProjectStatusBadge } from '../components/ui/Badge';
import { Button, buttonClass } from '../components/ui/Button';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/States';
import { useDeleteProject, useProject } from '../hooks/queries';
import { getErrorMessage } from '../services/api';
import { formatDate } from '../utils/dates';

export function ProjectDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { data: project, isLoading, isError, error, refetch } = useProject(id);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const del = useDeleteProject();

  const notFound = axios.isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 400);

  return (
    <>
      <Link to="/projects" className="mb-5 inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
        <ArrowLeft className="size-4" /> Projects
      </Link>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-9 w-2/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : notFound ? (
        <EmptyState
          title="Project not found"
          description="It may have been deleted, or it belongs to another account."
          action={
            <Link to="/projects" className={buttonClass('secondary')}>
              Back to projects
            </Link>
          }
        />
      ) : isError ? (
        <ErrorState message={getErrorMessage(error)} onRetry={() => refetch()} />
      ) : project ? (
        <>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-semibold tracking-tight break-words sm:text-[28px]">{project.name}</h1>
                <ProjectStatusBadge status={project.status} />
              </div>
              <p className="mt-2 max-w-2xl text-[15px] leading-relaxed whitespace-pre-line text-ink-soft">
                {project.description || 'No description'}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="secondary" onClick={() => setEditOpen(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmDelete(true)}
                className="hover:border-danger hover:text-danger"
              >
                <Trash2 className="size-4" /> Delete
              </Button>
            </div>
          </div>

          <dl className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-box)] border border-line bg-line md:grid-cols-4">
            <div className="bg-surface px-5 py-4">
              <dt className="text-[13px] text-ink-soft">Start date</dt>
              <dd className="mt-1 font-medium">{formatDate(project.startDate)}</dd>
            </div>
            <div className="bg-surface px-5 py-4">
              <dt className="text-[13px] text-ink-soft">End date</dt>
              <dd className="mt-1 font-medium">{formatDate(project.endDate, 'Not set')}</dd>
            </div>
            <div className="bg-surface px-5 py-4">
              <dt className="text-[13px] text-ink-soft">Created</dt>
              <dd className="mt-1 font-medium">{formatDate(project.createdAt)}</dd>
            </div>
            <div className="bg-surface px-5 py-4">
              <dt className="text-[13px] text-ink-soft">Progress</dt>
              <dd className="mt-1 flex items-center gap-3">
                <span className="font-medium">{project.progress}%</span>
                <ProgressBar value={project.progress} className="flex-1" />
              </dd>
              <dd className="mt-1 text-xs text-ink-mute">
                {project.completedTaskCount} of {project.taskCount} tasks completed
              </dd>
            </div>
          </dl>

          <TaskBoard projectId={project.id} />

          <ProjectFormModal open={editOpen} project={project} onClose={() => setEditOpen(false)} />
          <ConfirmDialog
            open={confirmDelete}
            title="Delete project?"
            message={`“${project.name}” and its ${project.taskCount} ${project.taskCount === 1 ? 'task' : 'tasks'} will be permanently deleted. This can’t be undone.`}
            confirmLabel="Delete project"
            loading={del.isPending}
            onClose={() => setConfirmDelete(false)}
            onConfirm={() =>
              del.mutate(project.id, {
                onSuccess: () => navigate('/projects', { replace: true }),
              })
            }
          />
        </>
      ) : null}
    </>
  );
}
