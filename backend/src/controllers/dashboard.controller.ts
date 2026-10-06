import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/authenticate';
import { getDashboard } from '../services/dashboard.service';
import { sendSuccess } from '../utils/response';

export async function show(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  sendSuccess(res, await getDashboard(userId));
}
