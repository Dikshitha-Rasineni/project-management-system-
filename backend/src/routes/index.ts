import { Router, type RequestHandler } from 'express';
import * as auth from '../controllers/auth.controller';
import * as dashboard from '../controllers/dashboard.controller';
import * as projects from '../controllers/project.controller';
import * as tasks from '../controllers/task.controller';
import { prisma } from '../config/prisma';
import { authenticate } from '../middleware/authenticate';

export interface RouteOptions {
  loginLimiter: RequestHandler;
  registerLimiter: RequestHandler;
}

export function buildApiRouter({ loginLimiter, registerLimiter }: RouteOptions) {
  const api = Router();

  // ---- Public -------------------------------------------------------------
  api.get('/health', async (_req, res) => {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ success: true, data: { status: 'ok', time: new Date().toISOString() } });
  });

  api.post('/auth/register', registerLimiter, auth.register);
  api.post('/auth/login', loginLimiter, auth.login);

  // ---- Protected (everything below requires a valid JWT) -------------------
  api.post('/auth/logout', authenticate, auth.logout);
  api.get('/auth/me', authenticate, auth.me);

  const projectRouter = Router();
  projectRouter.use(authenticate);
  projectRouter.get('/', projects.list);
  projectRouter.post('/', projects.create);
  projectRouter.get('/:id', projects.getById);
  projectRouter.put('/:id', projects.update);
  projectRouter.delete('/:id', projects.remove);
  api.use('/projects', projectRouter);

  const taskRouter = Router();
  taskRouter.use(authenticate);
  taskRouter.get('/', tasks.list);
  taskRouter.post('/', tasks.create);
  taskRouter.get('/:id', tasks.getById);
  taskRouter.put('/:id', tasks.update);
  taskRouter.delete('/:id', tasks.remove);
  api.use('/tasks', taskRouter);

  api.get('/dashboard', authenticate, dashboard.show);

  return api;
}
