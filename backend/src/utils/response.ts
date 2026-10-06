import type { Response } from 'express';

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Every successful response has the shape
 *   { success: true, data, message?, pagination? }
 * and every error has the shape
 *   { success: false, message, errors? }
 * so both clients can handle responses uniformly.
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  options: { status?: number; message?: string; pagination?: PaginationMeta } = {},
) {
  const { status = 200, message, pagination } = options;
  return res.status(status).json({
    success: true,
    ...(message ? { message } : {}),
    data,
    ...(pagination ? { pagination } : {}),
  });
}

export function buildPagination(page: number, limit: number, total: number): PaginationMeta {
  return { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) };
}
