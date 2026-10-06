import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getErrorMessage } from '../services/api';
import { dashboardApi, projectApi, taskApi } from '../services/endpoints';
import type { ProjectFilters, ProjectInput, TaskFilters, TaskInput } from '../types';

export const keys = {
  dashboard: ['dashboard'] as const,
  projects: (f?: ProjectFilters) => ['projects', f ?? {}] as const,
  project: (id: string) => ['project', id] as const,
  tasks: (f?: TaskFilters) => ['tasks', f ?? {}] as const,
};

/** Any project/task change can affect lists, details and the dashboard. */
function useInvalidateAll() {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: ['dashboard'] }),
      qc.invalidateQueries({ queryKey: ['projects'] }),
      qc.invalidateQueries({ queryKey: ['project'] }),
      qc.invalidateQueries({ queryKey: ['tasks'] }),
    ]);
}

export const useDashboard = () => useQuery({ queryKey: keys.dashboard, queryFn: dashboardApi.get });

export const useProjects = (filters: ProjectFilters, enabled = true) =>
  useQuery({
    queryKey: keys.projects(filters),
    queryFn: () => projectApi.list(filters),
    placeholderData: keepPreviousData,
    enabled,
  });

export const useProject = (id: string) =>
  useQuery({ queryKey: keys.project(id), queryFn: () => projectApi.get(id), enabled: Boolean(id) });

export const useTasks = (filters: TaskFilters, enabled = true) =>
  useQuery({
    queryKey: keys.tasks(filters),
    queryFn: () => taskApi.list(filters),
    placeholderData: keepPreviousData,
    enabled,
  });

export function useSaveProject() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: ProjectInput }) =>
      id ? projectApi.update(id, data) : projectApi.create(data),
    onSuccess: (_p, vars) => {
      toast.success(vars.id ? 'Project saved' : 'Project created');
      return invalidate();
    },
  });
}

export function useDeleteProject() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => projectApi.remove(id),
    onSuccess: () => {
      toast.success('Project deleted');
      return invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useSaveTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TaskInput }) => (id ? taskApi.update(id, data) : taskApi.create(data)),
    onSuccess: (_t, vars) => {
      toast.success(vars.id ? 'Task saved' : 'Task created');
      return invalidate();
    },
  });
}

/** Quick inline edits (status, priority, complete checkbox). */
export function useUpdateTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskInput> }) => taskApi.update(id, data),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onSuccess: () => {
      toast.success('Task deleted');
      return invalidate();
    },
    onError: (e) => toast.error(getErrorMessage(e)),
  });
}
