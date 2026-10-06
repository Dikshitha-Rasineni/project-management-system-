import { z } from 'zod';
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  dateOnly,
  enumField,
  optionalText,
  paginationQuery,
  requiredText,
  uuidParam,
} from './common';

const projectId = z
  .string({ required_error: 'Project is required', invalid_type_error: 'Project ID must be text' })
  .uuid('Project ID must be a valid ID');

export const createTaskSchema = z.object({
  name: requiredText('Task name', 160),
  description: optionalText('Description', 2000),
  priority: enumField('Priority', TASK_PRIORITIES).default('MEDIUM'),
  status: enumField('Status', TASK_STATUSES).default('PENDING'),
  dueDate: dateOnly('Due date').nullish(),
  projectId,
});

/** Partial update — e.g. `{ "status": "COMPLETED" }` marks a task done. */
export const updateTaskSchema = z
  .object({
    name: requiredText('Task name', 160).optional(),
    description: optionalText('Description', 2000).optional(),
    priority: enumField('Priority', TASK_PRIORITIES).optional(),
    status: enumField('Status', TASK_STATUSES).optional(),
    dueDate: dateOnly('Due date').nullish(),
    projectId: projectId.optional(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
    path: ['body'],
  });

export const listTasksQuerySchema = z.object({
  ...paginationQuery,
  status: enumField('status', TASK_STATUSES).optional(),
  priority: enumField('priority', TASK_PRIORITIES).optional(),
  projectId: uuidParam.optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'dueDate', 'priority', 'status'], {
      errorMap: () => ({
        message: 'sortBy must be one of: createdAt, updatedAt, name, dueDate, priority, status',
      }),
    })
    .default('createdAt'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
