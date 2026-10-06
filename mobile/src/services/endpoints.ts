import { request } from './api';
import type { DashboardStats, Project, ProjectFilters, Session, Task, TaskFilters, TaskInput, User } from '../types';

/** The same REST endpoints the web app uses — there is no mobile-only backend. */

export const authApi = {
  login: async (email: string, password: string) =>
    (await request<Session>('/auth/login', { method: 'POST', body: { email, password } })).data,
  register: async (fullName: string, email: string, password: string) =>
    (await request<Session>('/auth/register', { method: 'POST', body: { fullName, email, password } })).data,
  logout: async () => {
    await request<null>('/auth/logout', { method: 'POST', timeoutMs: 5_000 });
  },
  me: async () => (await request<{ user: User }>('/auth/me')).data.user,
};

export const dashboardApi = {
  get: async () => (await request<DashboardStats>('/dashboard')).data,
};

export const projectApi = {
  list: async (f: ProjectFilters = {}) =>
    (await request<Project[]>('/projects', { query: { ...f, limit: 100, sortBy: 'updatedAt', order: 'desc' } })).data,
  get: async (id: string) => (await request<Project>(`/projects/${id}`)).data,
};

export const taskApi = {
  list: async (f: TaskFilters = {}) =>
    (await request<Task[]>('/tasks', { query: { ...f, limit: 100, sortBy: 'createdAt', order: 'desc' } })).data,
  get: async (id: string) => (await request<Task>(`/tasks/${id}`)).data,
  create: async (body: TaskInput) => (await request<Task>('/tasks', { method: 'POST', body })).data,
  update: async (id: string, body: Partial<TaskInput>) => (await request<Task>(`/tasks/${id}`, { method: 'PUT', body })).data,
  remove: async (id: string) => {
    await request<null>(`/tasks/${id}`, { method: 'DELETE' });
  },
};
