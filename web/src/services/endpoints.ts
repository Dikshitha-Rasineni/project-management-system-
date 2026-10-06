import { api } from './api';
import type {
  DashboardStats,
  Paginated,
  Pagination,
  Project,
  ProjectFilters,
  ProjectInput,
  Session,
  Task,
  TaskFilters,
  TaskInput,
  User,
} from '../types';

interface Envelope<T> {
  success: boolean;
  message?: string;
  data: T;
  pagination?: Pagination;
}

/** Drops empty filter values so URLs stay clean (?status= is never sent). */
function clean(params: object) {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== ''));
}

export const authApi = {
  register: async (body: { fullName: string; email: string; password: string }) =>
    (await api.post<Envelope<Session>>('/auth/register', body)).data.data,
  login: async (body: { email: string; password: string }) => (await api.post<Envelope<Session>>('/auth/login', body)).data.data,
  logout: async () => {
    await api.post('/auth/logout');
  },
  me: async () => (await api.get<Envelope<{ user: User }>>('/auth/me')).data.data.user,
};

export const projectApi = {
  list: async (filters: ProjectFilters = {}): Promise<Paginated<Project>> => {
    const res = await api.get<Envelope<Project[]>>('/projects', { params: clean(filters) });
    return { items: res.data.data, pagination: res.data.pagination! };
  },
  get: async (id: string) => (await api.get<Envelope<Project>>(`/projects/${id}`)).data.data,
  create: async (body: ProjectInput) => (await api.post<Envelope<Project>>('/projects', body)).data.data,
  update: async (id: string, body: Partial<ProjectInput>) =>
    (await api.put<Envelope<Project>>(`/projects/${id}`, body)).data.data,
  remove: async (id: string) => {
    await api.delete(`/projects/${id}`);
  },
};

export const taskApi = {
  list: async (filters: TaskFilters = {}): Promise<Paginated<Task>> => {
    const res = await api.get<Envelope<Task[]>>('/tasks', { params: clean(filters) });
    return { items: res.data.data, pagination: res.data.pagination! };
  },
  get: async (id: string) => (await api.get<Envelope<Task>>(`/tasks/${id}`)).data.data,
  create: async (body: TaskInput) => (await api.post<Envelope<Task>>('/tasks', body)).data.data,
  update: async (id: string, body: Partial<TaskInput>) => (await api.put<Envelope<Task>>(`/tasks/${id}`, body)).data.data,
  remove: async (id: string) => {
    await api.delete(`/tasks/${id}`);
  },
};

export const dashboardApi = {
  get: async () => (await api.get<Envelope<DashboardStats>>('/dashboard')).data.data,
};
