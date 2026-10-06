import type { Request, Response } from 'express';
import { requireAuth } from '../middleware/authenticate';
import * as projectService from '../services/project.service';
import { sendSuccess } from '../utils/response';
import { parseBody, parseId, parseQuery } from '../validators/common';
import {
  createProjectSchema,
  listProjectsQuerySchema,
  updateProjectSchema,
} from '../validators/project.validators';

export async function list(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const query = parseQuery(listProjectsQuerySchema, req.query);
  const { items, pagination } = await projectService.listProjects(userId, query);
  sendSuccess(res, items, { pagination });
}

export async function getById(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const id = parseId(req.params.id, 'project ID');
  sendSuccess(res, await projectService.getProject(userId, id));
}

export async function create(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const input = parseBody(createProjectSchema, req.body);
  const project = await projectService.createProject(userId, input);
  sendSuccess(res, project, { status: 201, message: 'Project created' });
}

export async function update(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const id = parseId(req.params.id, 'project ID');
  const input = parseBody(updateProjectSchema, req.body);
  const project = await projectService.updateProject(userId, id, input);
  sendSuccess(res, project, { message: 'Project updated' });
}

export async function remove(req: Request, res: Response) {
  const { userId } = requireAuth(req);
  const id = parseId(req.params.id, 'project ID');
  await projectService.deleteProject(userId, id);
  sendSuccess(res, null, { message: 'Project deleted' });
}
