import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { app, auth, createProject, createTask, registerUser } from './helpers';

describe('Projects CRUD', () => {
  it('creates a project with defaults and returns 201', async () => {
    const u = await registerUser();
    const res = await request(app)
      .post('/api/projects')
      .set(auth(u.token))
      .send({ name: '  Website Redesign  ', description: '', startDate: '2026-01-10' });

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({
      name: 'Website Redesign',
      description: null,
      status: 'NOT_STARTED',
      startDate: '2026-01-10',
      endDate: null,
      taskCount: 0,
      progress: 0,
    });
    expect(res.body.data).not.toHaveProperty('ownerId');
  });

  it('lists only the caller’s projects with pagination metadata', async () => {
    const a = await registerUser();
    const b = await registerUser();
    await createProject(a.token, { name: 'A1' });
    await createProject(a.token, { name: 'A2' });
    await createProject(b.token, { name: 'B1' });

    const res = await request(app).get('/api/projects').set(auth(a.token));
    expect(res.status).toBe(200);
    expect(res.body.data.map((p: { name: string }) => p.name).sort()).toEqual(['A1', 'A2']);
    expect(res.body.pagination).toEqual({ page: 1, limit: 20, total: 2, totalPages: 1 });
  });

  it('reads a single project with task progress', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    await createTask(u.token, p.id, { status: 'COMPLETED' });
    await createTask(u.token, p.id);

    const res = await request(app).get(`/api/projects/${p.id}`).set(auth(u.token));
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: p.id, taskCount: 2, completedTaskCount: 1, progress: 50 });
  });

  it('updates a project (partial update) and keeps other fields', async () => {
    const u = await registerUser();
    const p = await createProject(u.token, { description: 'Keep me' });
    const res = await request(app)
      .put(`/api/projects/${p.id}`)
      .set(auth(u.token))
      .send({ status: 'IN_PROGRESS' });
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ status: 'IN_PROGRESS', description: 'Keep me', name: 'Website Redesign' });
  });

  it('deletes a project and cascades its tasks', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    const t = await createTask(u.token, p.id);

    const del = await request(app).delete(`/api/projects/${p.id}`).set(auth(u.token));
    expect(del.status).toBe(200);
    expect((await request(app).get(`/api/projects/${p.id}`).set(auth(u.token))).status).toBe(404);
    expect((await request(app).get(`/api/tasks/${t.id}`).set(auth(u.token))).status).toBe(404);
  });
});

describe('Projects authorization (IDOR protection)', () => {
  it('returns 404 when reading, updating or deleting another user’s project', async () => {
    const owner = await registerUser();
    const intruder = await registerUser();
    const p = await createProject(owner.token);

    const read = await request(app).get(`/api/projects/${p.id}`).set(auth(intruder.token));
    const update = await request(app).put(`/api/projects/${p.id}`).set(auth(intruder.token)).send({ name: 'Hacked' });
    const del = await request(app).delete(`/api/projects/${p.id}`).set(auth(intruder.token));

    expect([read.status, update.status, del.status]).toEqual([404, 404, 404]);
    const still = await request(app).get(`/api/projects/${p.id}`).set(auth(owner.token));
    expect(still.body.data.name).toBe('Website Redesign');
  });

  it('ignores an ownerId supplied in the body (mass-assignment)', async () => {
    const a = await registerUser();
    const b = await registerUser();
    const res = await request(app)
      .post('/api/projects')
      .set(auth(a.token))
      .send({ name: 'Mine', startDate: '2026-01-01', ownerId: b.user.id });
    expect(res.status).toBe(201);
    const bList = await request(app).get('/api/projects').set(auth(b.token));
    expect(bList.body.data).toHaveLength(0);
  });

  it('requires authentication', async () => {
    expect((await request(app).get('/api/projects')).status).toBe(401);
    expect((await request(app).post('/api/projects').send({ name: 'x' })).status).toBe(401);
  });
});

describe('Projects search, filter, sort', () => {
  it('searches by name (case-insensitive) and filters by status', async () => {
    const u = await registerUser();
    await createProject(u.token, { name: 'Company Website', status: 'IN_PROGRESS' });
    await createProject(u.token, { name: 'Website Audit', status: 'COMPLETED' });
    await createProject(u.token, { name: 'Mobile App', status: 'IN_PROGRESS' });

    const search = await request(app).get('/api/projects?search=WEBSITE').set(auth(u.token));
    expect(search.body.data).toHaveLength(2);

    const both = await request(app).get('/api/projects?search=website&status=IN_PROGRESS').set(auth(u.token));
    expect(both.body.data.map((p: { name: string }) => p.name)).toEqual(['Company Website']);

    const sorted = await request(app).get('/api/projects?sortBy=name&order=asc').set(auth(u.token));
    expect(sorted.body.data.map((p: { name: string }) => p.name)).toEqual(['Company Website', 'Mobile App', 'Website Audit']);
  });

  it('paginates', async () => {
    const u = await registerUser();
    for (let i = 1; i <= 3; i += 1) await createProject(u.token, { name: `P${i}` });
    const res = await request(app).get('/api/projects?page=2&limit=2&sortBy=name&order=asc').set(auth(u.token));
    expect(res.body.data.map((p: { name: string }) => p.name)).toEqual(['P3']);
    expect(res.body.pagination).toEqual({ page: 2, limit: 2, total: 3, totalPages: 2 });
  });

  it('rejects an invalid status filter with 400', async () => {
    const u = await registerUser();
    const res = await request(app).get('/api/projects?status=DONE').set(auth(u.token));
    expect(res.status).toBe(400);
  });
});

describe('Projects validation', () => {
  it('rejects missing name and start date', async () => {
    const u = await registerUser();
    const res = await request(app).post('/api/projects').set(auth(u.token)).send({});
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['name', 'startDate']));
  });

  it('rejects an invalid status enum', async () => {
    const u = await registerUser();
    const res = await request(app)
      .post('/api/projects')
      .set(auth(u.token))
      .send({ name: 'X', startDate: '2026-01-01', status: 'FINISHED' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0]).toMatchObject({ field: 'status' });
  });

  it('rejects invalid and impossible dates', async () => {
    const u = await registerUser();
    const bad = await request(app).post('/api/projects').set(auth(u.token)).send({ name: 'X', startDate: 'tomorrow' });
    const impossible = await request(app).post('/api/projects').set(auth(u.token)).send({ name: 'X', startDate: '2026-02-30' });
    expect(bad.status).toBe(422);
    expect(impossible.status).toBe(422);
  });

  it('rejects an end date before the start date (also on partial update)', async () => {
    const u = await registerUser();
    const res = await request(app)
      .post('/api/projects')
      .set(auth(u.token))
      .send({ name: 'X', startDate: '2026-05-10', endDate: '2026-05-01' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('endDate');

    const p = await createProject(u.token, { startDate: '2026-05-10', endDate: '2026-06-01' });
    const upd = await request(app).put(`/api/projects/${p.id}`).set(auth(u.token)).send({ endDate: '2026-05-01' });
    expect(upd.status).toBe(422);
  });

  it('rejects an empty update and a malformed id', async () => {
    const u = await registerUser();
    const p = await createProject(u.token);
    expect((await request(app).put(`/api/projects/${p.id}`).set(auth(u.token)).send({})).status).toBe(422);
    expect((await request(app).get('/api/projects/not-a-uuid').set(auth(u.token))).status).toBe(400);
  });
});
