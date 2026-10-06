import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '../generated/prisma/client';
import { ZodError } from 'zod';
import { logger } from '../config/logger';
import { AppError } from '../utils/AppError';

/** 404 for any route that is not defined. */
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(AppError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

/**
 * Centralised error handler. Expected errors become clean JSON responses;
 * unexpected errors are logged in full but only a generic message is
 * returned, so stack traces and SQL never reach a client.
 */
// Express identifies error handlers by their 4-argument signature.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  let appError: AppError;

  if (err instanceof AppError) {
    appError = err;
  } else if (err instanceof ZodError) {
    appError = AppError.validation(
      err.issues.map((i) => ({ field: i.path.join('.') || 'body', message: i.message })),
    );
  } else if (isBodyParserError(err)) {
    appError =
      err.type === 'entity.too.large'
        ? new AppError(413, 'Request body is too large', 'PAYLOAD_TOO_LARGE')
        : AppError.badRequest('Malformed JSON in request body');
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    appError = mapPrismaError(err);
  } else {
    appError = new AppError(500, 'Something went wrong. Please try again later.', 'INTERNAL_ERROR');
  }

  if (appError.statusCode >= 500) {
    logger.error({ err, reqId: req.id, path: req.originalUrl }, 'Unhandled error');
  } else {
    logger.debug({ reqId: req.id, status: appError.statusCode, msg: appError.message }, 'Request failed');
  }

  res.status(appError.statusCode).json({
    success: false,
    message: appError.message,
    code: appError.code,
    ...(appError.errors?.length ? { errors: appError.errors } : {}),
  });
}

function isBodyParserError(err: unknown): err is { type: string; status: number } {
  return (
    typeof err === 'object' &&
    err !== null &&
    'type' in err &&
    typeof (err as { type: unknown }).type === 'string' &&
    ((err as { type: string }).type === 'entity.parse.failed' ||
      (err as { type: string }).type === 'entity.too.large')
  );
}

function mapPrismaError(err: Prisma.PrismaClientKnownRequestError): AppError {
  switch (err.code) {
    case 'P2002':
      return AppError.conflict('A record with this value already exists');
    case 'P2003':
      return AppError.validation([{ field: 'body', message: 'Referenced record does not exist' }]);
    case 'P2025':
      return AppError.notFound('Resource not found');
    default:
      return new AppError(500, 'Something went wrong. Please try again later.', 'INTERNAL_ERROR');
  }
}
