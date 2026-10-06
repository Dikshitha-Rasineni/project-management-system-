import { z, type ZodTypeAny } from 'zod';
import { AppError, type FieldError } from '../utils/AppError';

export const PROJECT_STATUSES = ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'] as const;
export const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED'] as const;
export const TASK_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH'] as const;

/** A required, trimmed, non-blank string. "   " is rejected, not stored. */
export const requiredText = (label: string, max: number) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be text` })
    .trim()
    .min(1, `${label} cannot be empty`)
    .max(max, `${label} must be at most ${max} characters`);

/**
 * Optional free text. Blank strings and null are normalised to null
 * (clear the field); an omitted field stays undefined (leave unchanged).
 */
export const optionalText = (label: string, max: number) =>
  z
    .string({ invalid_type_error: `${label} must be text` })
    .trim()
    .max(max, `${label} must be at most ${max} characters`)
    .nullish()
    .transform((v) => (v === undefined ? undefined : v || null));

/**
 * A calendar date in strict ISO "YYYY-MM-DD" form that actually exists
 * (2026-02-30 is rejected), within a sane range.
 */
export const dateOnly = (label: string) =>
  z
    .string({ required_error: `${label} is required`, invalid_type_error: `${label} must be a date string` })
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, `${label} must be a valid date in YYYY-MM-DD format`)
    .refine((value) => {
      const d = new Date(`${value}T00:00:00.000Z`);
      return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
    }, `${label} is not a valid calendar date`)
    .refine((value) => {
      const year = Number(value.slice(0, 4));
      return year >= 1900 && year <= 2200;
    }, `${label} must be between the years 1900 and 2200`);

export const enumField = <T extends readonly [string, ...string[]]>(label: string, values: T) =>
  z.enum(values, {
    errorMap: () => ({ message: `${label} must be one of: ${values.join(', ')}` }),
  });

export const uuidParam = z.string().uuid('Invalid ID format');

export const paginationQuery = {
  page: z.coerce.number().int().min(1, 'page must be >= 1').default(1),
  limit: z.coerce.number().int().min(1, 'limit must be >= 1').max(100, 'limit must be <= 100').default(20),
  order: z.enum(['asc', 'desc'], { errorMap: () => ({ message: 'order must be asc or desc' }) }).default('desc'),
  search: z.string().trim().max(100, 'search must be at most 100 characters').optional(),
};

function toFieldErrors(error: z.ZodError): FieldError[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'body',
    message: issue.message,
  }));
}

/** Validates a JSON request body. Failures => 422 with per-field messages. */
export function parseBody<S extends ZodTypeAny>(schema: S, body: unknown): z.output<S> {
  if (body === undefined || body === null || typeof body !== 'object' || Array.isArray(body)) {
    throw AppError.badRequest('Request body must be a JSON object');
  }
  const result = schema.safeParse(body);
  if (!result.success) throw AppError.validation(toFieldErrors(result.error));
  return result.data;
}

/** Validates query-string parameters. Failures => 400 (malformed request). */
export function parseQuery<S extends ZodTypeAny>(schema: S, query: unknown): z.output<S> {
  const result = schema.safeParse(query ?? {});
  if (!result.success) {
    throw AppError.badRequest('Invalid query parameters', toFieldErrors(result.error));
  }
  return result.data;
}

/** Validates a route :id. A malformed id is a 400, not a database error. */
export function parseId(value: unknown, label = 'ID'): string {
  const result = uuidParam.safeParse(value);
  if (!result.success) throw AppError.badRequest(`Invalid ${label} format`);
  return result.data;
}
