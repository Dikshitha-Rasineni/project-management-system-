import request from 'supertest';
import { createApp } from '../src/app';

export const app = createApp();

let counter = 0;

export interface TestUser {
  token: string;
  user: { id: string; fullName: string; email: string };
  email: string;
  password: string;
}

/** Registers a fresh user and returns its token. */
export async function registerUser(overrides: Partial<{ fullName: string; email: string; password: string }> = {}): Promise<TestUser> {
  counter += 1;
  const body = {
    fullName: overrides.fullName ?? `Test User ${counter}`,
    email: overrides.email ?? `user${counter}-${Date.now()}@example.com`,
    password: overrides.password ?? 'Passw0rd!',
  };
  const res = await request(app).post('/api/auth/register').send(body);
  if (res.status !== 201) throw new Error(`register failed: ${res.status} ${JSON.stringify(res.body)}`);
  return { token: res.body.data.token, user: res.body.data.user, email: body.email, password: body.password };
}

export const auth = (token: string) => ({ Authorization: `Bearer ${token}` });

export async function createProject(token: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/projects')
    .set(auth(token))
    .send({ name: 'Website Redesign', startDate: '2026-01-10', endDate: '2026-03-31', ...overrides });
  if (res.status !== 201) throw new Error(`createProject failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: string; name: string; status: string };
}

export async function createTask(token: string, projectId: string, overrides: Record<string, unknown> = {}) {
  const res = await request(app)
    .post('/api/tasks')
    .set(auth(token))
    .send({ name: 'Implement login', projectId, ...overrides });
  if (res.status !== 201) throw new Error(`createTask failed: ${res.status} ${JSON.stringify(res.body)}`);
  return res.body.data as { id: string; name: string; status: string; priority: string };
}
