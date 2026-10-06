import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('GET /api/dashboard', () => {
  it('returns zeros for a new user', async () => {
    const u = await registerUser();
    const res = await request(app).get('/api/dashboard').set(auth(u.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      totalProjects: 0,
      totalTasks: 0,
      completedTasks: 0,
      pendingTasks: 0,
      projectsInProgress: 0,
      completionRate: 0,
    });
  });

  it('counts only the authenticated user’s data and updates after changes', async () => {
    const u = await registerUser();
    const other = await registerUser();

    const p1 = await createProject(u.token, { status: 'IN_PROGRESS' });
    const p2 = await createProject(u.token, { status: 'IN_PROGRESS' });
    await createProject(u.token, { status: 'COMPLETED' });
    await createTask(u.token, p1.id, { status: 'COMPLETED' });
    await createTask(u.token, p1.id, { status: 'PENDING', priority: 'HIGH' });
    const t3 = await createTask(u.token, p2.id, { status: 'IN_PROGRESS', dueDate: '2000-01-01' });

    // Noise from another user must not be counted.
    const op = await createProject(other.token, { status: 'IN_PROGRESS' });
    await createTask(other.token, op.id);

    const res = await request(app).get('/api/dashboard').set(auth(u.token));
    expect(res.body.data).toMatchObject({
      totalProjects: 3,
      totalTasks: 3,
      completedTasks: 1,
      pendingTasks: 1,
      inProgressTasks: 1,
      projectsInProgress: 2,
      projectsCompleted: 1,
      overdueTasks: 1,
      completionRate: 33,
      openTasksByPriority: { HIGH: 1, MEDIUM: 1, LOW: 0 },
    });

    // Complete a task — the dashboard reflects it immediately.
    await request(app).put(`/api/tasks/${t3.id}`).set(auth(u.token)).send({ status: 'COMPLETED' });
    const after = await request(app).get('/api/dashboard').set(auth(u.token));
    expect(after.body.data).toMatchObject({ completedTasks: 2, inProgressTasks: 0, overdueTasks: 0 });
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/dashboard')).status).toBe(401);
  });
});

describe('Platform basics', () => {
  it('returns JSON 404 for unknown routes', async () => {
    const res = await request(app).get('/api/nope');
    expect(res.status).toBe(404);
    expect(res.body).toMatchObject({ success: false });
  });

  it('sets security headers and allows only configured CORS origins', async () => {
    const allowed = await request(app).get('/api/health').set('Origin', 'http://localhost:5173');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(allowed.headers['x-content-type-options']).toBe('nosniff');

    const blocked = await request(app).get('/api/health').set('Origin', 'https://evil.example.com');
    expect(blocked.headers['access-control-allow-origin']).toBeUndefined();
  });
});
