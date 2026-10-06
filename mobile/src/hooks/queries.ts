import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dashboardApi, projectApi, taskApi } from '../services/endpoints';
import type { ProjectFilters, TaskFilters, TaskInput } from '../types';

export const useDashboard = () => useQuery({ queryKey: ['dashboard'], queryFn: dashboardApi.get });

export const useProjects = (f: ProjectFilters = {}) =>
  useQuery({ queryKey: ['projects', f], queryFn: () => projectApi.list(f) });

export const useProject = (id: string) =>
  useQuery({ queryKey: ['project', id], queryFn: () => projectApi.get(id), enabled: Boolean(id) });

export const useTasks = (f: TaskFilters) => useQuery({ queryKey: ['tasks', f], queryFn: () => taskApi.list(f) });

export const useTask = (id?: string) =>
  useQuery({ queryKey: ['task', id], queryFn: () => taskApi.get(id!), enabled: Boolean(id) });

/** Every task change can affect lists, project progress and the dashboard. */
function useInvalidate() {
  const qc = useQueryClient();
  return () =>
    Promise.all(['dashboard', 'projects', 'project', 'tasks', 'task'].map((k) => qc.invalidateQueries({ queryKey: [k] })));
}

export function useSaveTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: TaskInput }) => (id ? taskApi.update(id, data) : taskApi.create(data)),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TaskInput> }) => taskApi.update(id, data),
    onSuccess: () => invalidate(),
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => taskApi.remove(id),
    onSuccess: () => invalidate(),
  });
}
