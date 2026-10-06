import { z } from 'zod';
import {
  PROJECT_STATUSES,
  dateOnly,
  enumField,
  optionalText,
  paginationQuery,
  requiredText,
} from './common';

const endAfterStart = (data: { startDate?: string | null; endDate?: string | null }) =>
  !data.startDate || !data.endDate || data.endDate >= data.startDate;

const endDateIssue = { message: 'End date cannot be before start date', path: ['endDate'] };

export const createProjectSchema = z
  .object({
    name: requiredText('Project name', 120),
    description: optionalText('Description', 2000),
    status: enumField('Status', PROJECT_STATUSES).default('NOT_STARTED'),
    startDate: dateOnly('Start date'),
    endDate: dateOnly('End date').nullish(),
  })
  .refine(endAfterStart, endDateIssue);

/**
 * PUT accepts any subset of fields (all optional) so clients can update a
 * single attribute such as status. At least one field must be supplied.
 */
export const updateProjectSchema = z
  .object({
    name: requiredText('Project name', 120).optional(),
    description: optionalText('Description', 2000).optional(),
    status: enumField('Status', PROJECT_STATUSES).optional(),
    startDate: dateOnly('Start date').optional(),
    endDate: dateOnly('End date').nullish(),
  })
  .refine((d) => Object.values(d).some((v) => v !== undefined), {
    message: 'Provide at least one field to update',
    path: ['body'],
  })
  .refine(endAfterStart, endDateIssue);

export const listProjectsQuerySchema = z.object({
  ...paginationQuery,
  status: enumField('status', PROJECT_STATUSES).optional(),
  sortBy: z
    .enum(['createdAt', 'updatedAt', 'name', 'startDate', 'endDate', 'status'], {
      errorMap: () => ({
        message: 'sortBy must be one of: createdAt, updatedAt, name, startDate, endDate, status',
      }),
    })
    .default('createdAt'),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
