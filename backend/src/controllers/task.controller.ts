import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/authenticate';
import * as taskService from '../services/task.service';
import { sendSuccess } from '../utils/response';
import { parseBody, parseId, parseQuery } from '../validators/common';
import { createTaskSchema, listTasksQuerySchema, updateTaskSchema } from '../validators/task.validators';

export async function list(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const query = parseQuery(listTasksQuerySchema, req.query);
  const { items, pagination } = await taskService.listTasks(userId, query);
  sendSuccess(res, items, { pagination });
}

export async function getById(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const id = parseId(req.params.id, 'task ID');
  sendSuccess(res, await taskService.getTask(userId, id));
}

export async function create(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const input = parseBody(createTaskSchema, req.body);
  const task = await taskService.createTask(userId, input);
  sendSuccess(res, task, { status: 201, message: 'Task created' });
}

export async function update(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const id = parseId(req.params.id, 'task ID');
  const input = parseBody(updateTaskSchema, req.body);
  const task = await taskService.updateTask(userId, id, input);
  sendSuccess(res, task, { message: 'Task updated' });
}

export async function remove(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const id = parseId(req.params.id, 'task ID');
  await taskService.deleteTask(userId, id);
  sendSuccess(res, null, { message: 'Task deleted' });
}
