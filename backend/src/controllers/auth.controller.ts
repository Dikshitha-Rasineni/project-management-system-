import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/authenticate';
import * as authService from '../services/auth.service';
import { sendSuccess } from '../utils/response';
import { loginSchema, registerSchema } from '../validators/auth.validators';
import { parseBody } from '../validators/common';

export async function register(req: Request, res: Response) {
  const input = parseBody(registerSchema, req.body);
  const session = await authService.register(input);
  sendSuccess(res, session, { status: 201, message: 'Account created successfully' });
}

export async function login(req: Request, res: Response) {
  const input = parseBody(loginSchema, req.body);
  const session = await authService.login(input);
  sendSuccess(res, session, { message: 'Logged in successfully' });
}

export async function logout(req: Request, res: Response) {
  const { jti, exp } = requireAuth(req);
  await authService.logout(jti, exp);
  sendSuccess(res, null, { message: 'Logged out successfully' });
}

export async function me(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const user = await authService.getCurrentUser(userId);
  sendSuccess(res, { user });
}
