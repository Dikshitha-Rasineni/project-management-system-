import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Tasks CRUD', () => {
  it('creates a task with defaults under an owned project', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    const res = await request(app)
      .post('/api/tasks')
      .set(auth(u.token))
      .send({ name: 'Implement login', projectId: p.id, dueDate: '2026-02-01' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'Implement login',
      priority: 'MEDIUM',
      status: 'PENDING',
      dueDate: '2026-02-01',
      completedAt: null,
      projectId: p.id,
      project: { id: p.id, name: 'Website Redesign' },
    });
  });

  it('reads a task and lists tasks of a project', async () => {
    const u = await registerUser();
    const p1 = await createProject(u.token, { name: 'P1' });
    const p2 = await createProject(u.token, { name: 'P2' });
    const t = await createTask(u.token, p1.id);
    await createTask(u.token, p2.id, { name: 'Other' });

    const one = await request(app).get(`/api/tasks/${t.id}`).set(auth(u.token));
    expect(one.status).toBe(200);
    expect(one.body.data.id).toBe(t.id);

    const list = await request(app).get(`/api/tasks?projectId=${p1.id}`).set(auth(u.token));
    expect(list.body.data.map((x: { id: string }) => x.id)).toEqual([t.id]);
  });

  it('updates status/priority and tracks completedAt when marked completed', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    const t = await createTask(u.token, p.id, { description: 'keep' });

    const done = await request(app).put(`/api/tasks/${t.id}`).set(auth(u.token)).send({ status: 'COMPLETED', priority: 'HIGH' });
    expect(done.status).toBe(200);
    expect(done.body.data).toMatchObject({ status: 'COMPLETED', priority: 'HIGH', description: 'keep' });
    expect(done.body.data.completedAt).toEqual(expect.any(String));

    const reopened = await request(app).put(`/api/tasks/${t.id}`).set(auth(u.token)).send({ status: 'IN_PROGRESS' });
    expect(reopened.body.data.completedAt).toBeNull();
  });

  it('can clear the description and due date', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    const t = await createTask(u.token, p.id, { description: 'x', dueDate: '2026-03-01' });
    const res = await request(app).put(`/api/tasks/${t.id}`).set(auth(u.token)).send({ description: '', dueDate: null });
    expect(res.body.data).toMatchObject({ description: null, dueDate: null });
  });

  it('deletes a task', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    const t = await createTask(u.token, p.id);
    expect((await request(app).delete(`/api/tasks/${t.id}`).set(auth(u.token))).status).toBe(200);
    expect((await request(app).get(`/api/tasks/${t.id}`).set(auth(u.token))).status).toBe(404);
    expect((await request(app).delete(`/api/tasks/${t.id}`).set(auth(u.token))).status).toBe(404);
  });
});

describe('Tasks authorization (IDOR protection)', () => {
  it('cannot read, update or delete another user’s task', async () => {
    const owner = await registerUser();
    const intruder = await registerUser();
    const p = await createProject(owner.token);
    const t = await createTask(owner.token, p.id);

    const read = await request(app).get(`/api/tasks/${t.id}`).set(auth(intruder.token));
    const upd = await request(app).put(`/api/tasks/${t.id}`).set(auth(intruder.token)).send({ status: 'COMPLETED' });
    const del = await request(app).delete(`/api/tasks/${t.id}`).set(auth(intruder.token));
    expect([read.status, upd.status, del.status]).toEqual([404, 404, 404]);

    const list = await request(app).get('/api/tasks').set(auth(intruder.token));
    expect(list.body.data).toHaveLength(0);
    const filtered = await request(app).get(`/api/tasks?projectId=${p.id}`).set(auth(intruder.token));
    expect(filtered.body.data).toHaveLength(0);
  });

  it('cannot create a task in another user’s project', async () => {
    const owner = await registerUser();
    const intruder = await registerUser();
    const p = await createProject(owner.token);
    const res = await request(app).post('/api/tasks').set(auth(intruder.token)).send({ name: 'Sneaky', projectId: p.id });
    expect(res.status).toBe(404);
    expect(res.body.message).toBe('Project not found');
  });

  it('cannot move an own task into another user’s project', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const pa = await createProject(a.token);
    const pb = await createProject(b.token);
    const t = await createTask(a.token, pa.id);
    const res = await request(app).put(`/api/tasks/${t.id}`).set(auth(a.token)).send({ projectId: pb.id });
    expect(res.status).toBe(404);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/tasks')).status).toBe(401);
  });
});

describe('Tasks validation', () => {
  it('rejects a non-existent project', async () => {
    const u = await registerUser();
    const res = await request(app).post('/api/tasks').set(auth(u.token)).send({ name: 'X', projectId: randomUUID() });
    expect(res.status).toBe(404);
  });

  it('rejects a missing/malformed projectId and a blank name', async () => {
    const u = await registerUser();
    const res = await request(app).post('/api/tasks').set(auth(u.token)).send({ name: '   ', projectId: 'abc' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'projectId']));
  });

  it('rejects invalid priority/status enums and an invalid due date', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    const res = await request(app)
      .post('/api/tasks')
      .set(auth(u.token))
      .send({ name: 'X', projectId: p.id, priority: 'URGENT', status: 'DONE', dueDate: '31/12/2026' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['priority', 'status', 'dueDate']));
  });
});

describe('Tasks search and filters', () => {
  it('searches by name and filters by status and priority', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    await createTask(u.token, p.id, { name: 'Fix login bug', status: 'PENDING', priority: 'HIGH' });
    await createTask(u.token, p.id, { name: 'Login page styling', status: 'COMPLETED', priority: 'LOW' });
    await createTask(u.token, p.id, { name: 'Write docs', status: 'PENDING', priority: 'HIGH' });

    const q = (s: string) => request(app).get(`/api/tasks?${s}`).set(auth(u.token));
    expect((await q('search=login')).body.data).toHaveLength(2);
    expect((await q('status=PENDING')).body.data).toHaveLength(2);
    expect((await q('priority=LOW')).body.data).toHaveLength(1);
    const combined = await q('search=login&status=PENDING&priority=HIGH');
    expect(combined.body.data.map((t: { name: string }) => t.name)).toEqual(['Fix login bug']);

    const byPriority = await q('sortBy=priority&order=desc');
    expect(byPriority.body.data[2].priority).toBe('LOW');
  });

  it('rejects an invalid priority filter with 400', async () => {
    const u = await registerUser();
    expect((await request(app).get('/api/tasks?priority=CRITICAL').set(auth(u.token))).status).toBe(400);
  });
});
