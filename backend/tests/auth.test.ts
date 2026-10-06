import jwt from 'jsonwebtoken';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createApp } from '../src/app';
import { prisma } from '../src/config/prisma';
import { app, auth, registerUser } from './helpers';

describe('POST /api/auth/register', () => {
  it('creates an account, returns a token, and never returns the password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jane Tester', email: 'Jane.Tester@Example.com', password: 'Secret123' });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toEqual(expect.any(String));
    expect(res.body.data.expiresAt).toEqual(expect.any(String));
    expect(res.body.data.user).toMatchObject({ fullName: 'Jane Tester', email: 'jane.tester@example.com' });
    expect(JSON.stringify(res.body)).not.toMatch(/password|Secret123/i);
  });

  it('stores a bcrypt hash, not the plain-text password', async () => {
    await registerUser({ email: 'hash@example.com', password: 'Secret123' });
    const row = await prisma.user.findUniqueOrThrow({ where: { email: 'hash@example.com' } });
    expect(row.passwordHash).not.toBe('Secret123');
    expect(row.passwordHash).toMatch(/^\$2[aby]\$\d{2}\$/);
  });

  it('rejects a duplicate email (case-insensitive) with 409', async () => {
    await registerUser({ email: 'dupe@example.com' });
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Someone Else', email: 'DUPE@example.com', password: 'Secret123' });
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, message: 'An account with this email already exists' });
  });

  it('rejects an invalid email with 422 and a field error', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jane', email: 'not-an-email', password: 'Secret123' });
    expect(res.status).toBe(422);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'email' })]));
  });

  it('rejects missing fields and blank strings', async () => {
    const res = await request(app).post('/api/auth/register').send({ fullName: '   ' });
    expect(res.status).toBe(422);
    const fields = res.body.errors.map((e: { field: string }) => e.field);
    expect(fields).toEqual(expect.arrayContaining(['fullName', 'email', 'password']));
  });

  it('enforces the password policy', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ fullName: 'Jane', email: 'weak@example.com', password: 'short' });
    expect(res.status).toBe(422);
    expect(res.body.errors[0].field).toBe('password');
  });

  it('returns 400 for malformed JSON', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .set('Content-Type', 'application/json')
      .send('{"fullName": ');
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  it('logs in with valid credentials (email is case-insensitive)', async () => {
    const u = await registerUser({ email: 'login@example.com', password: 'Secret123' });
    const res = await request(app).post('/api/auth/login').send({ email: 'LOGIN@example.com', password: 'Secret123' });
    expect(res.status).toBe(200);
    expect(res.body.data.user.id).toBe(u.user.id);
    expect(res.body.data.token).toEqual(expect.any(String));
  });

  it('returns the same 401 for a wrong password and an unknown email', async () => {
    await registerUser({ email: 'known@example.com', password: 'Secret123' });
    const wrongPw = await request(app).post('/api/auth/login').send({ email: 'known@example.com', password: 'Wrong1234' });
    const noUser = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'Wrong1234' });
    expect(wrongPw.status).toBe(401);
    expect(noUser.status).toBe(401);
    expect(wrongPw.body.message).toBe('Invalid email or password');
    expect(noUser.body.message).toBe(wrongPw.body.message);
  });

  it('rate-limits repeated failed attempts from the same IP with 429', async () => {
    const limitedApp = createApp({ authRateLimitMax: 3 });
    for (let i = 0; i < 3; i += 1) {
      const r = await request(limitedApp).post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });
      expect(r.status).toBe(401);
    }
    const blocked = await request(limitedApp).post('/api/auth/login').send({ email: 'x@example.com', password: 'Wrong1234' });
    expect(blocked.status).toBe(429);
    expect(blocked.body.success).toBe(false);
  });
});

describe('protected routes, /me and logout', () => {
  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('AUTH_REQUIRED');
  });

  it('returns 401 for a tampered token', async () => {
    const u = await registerUser();
    const res = await request(app).get('/api/projects').set(auth(`${u.token}x`));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_INVALID');
  });

  it('returns 401 TOKEN_EXPIRED for an expired token', async () => {
    const u = await registerUser();
    const expired = jwt.sign({}, process.env.JWT_SECRET as string, {
      subject: u.user.id,
      jwtid: 'expired-jti',
      issuer: 'pms-api',
      audience: 'pms-clients',
      expiresIn: -10,
    });
    const res = await request(app).get('/api/auth/me').set(auth(expired));
    expect(res.status).toBe(401);
    expect(res.body.code).toBe('TOKEN_EXPIRED');
    expect(res.body.message).toMatch(/expired/i);
  });

  it('returns the current user from /me', async () => {
    const u = await registerUser({ fullName: 'Me Myself' });
    const res = await request(app).get('/api/auth/me').set(auth(u.token));
    expect(res.status).toBe(200);
    expect(res.body.data.user).toEqual({
      id: u.user.id,
      fullName: 'Me Myself',
      email: u.email,
      createdAt: expect.any(String),
    });
  });

  it('revokes the token on logout so it cannot be reused', async () => {
    const u = await registerUser();
    const out = await request(app).post('/api/auth/logout').set(auth(u.token));
    expect(out.status).toBe(200);
    const after = await request(app).get('/api/auth/me').set(auth(u.token));
    expect(after.status).toBe(401);
  });

  it('works across clients: a token from one login does not affect another session', async () => {
    const u = await registerUser({ email: 'multi@example.com', password: 'Secret123' });
    const mobile = await request(app).post('/api/auth/login').send({ email: 'multi@example.com', password: 'Secret123' });
    await request(app).post('/api/auth/logout').set(auth(u.token)); // "web" logs out
    const res = await request(app).get('/api/auth/me').set(auth(mobile.body.data.token)); // "mobile" still in
    expect(res.status).toBe(200);
  });
});
