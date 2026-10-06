export interface FieldError {
  field: string;
  message: string;
}

/** Machine-readable codes that clients can branch on (e.g. to redirect to login). */
export type ErrorCode =
  | 'BAD_REQUEST'
  | 'AUTH_REQUIRED'
  | 'TOKEN_EXPIRED'
  | 'TOKEN_INVALID'
  | 'INVALID_CREDENTIALS'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'PAYLOAD_TOO_LARGE'
  | 'INTERNAL_ERROR';

/**
 * An expected, client-facing error. Anything thrown that is NOT an AppError
 * is treated as an unexpected 500 and its details are never sent to clients.
 */
export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
    public readonly code: ErrorCode,
    public readonly errors?: FieldError[],
  ) {
    super(message);
    this.name = 'AppError';
  }

  static badRequest(message = 'Bad request', errors?: FieldError[]) {
    return new AppError(400, message, 'BAD_REQUEST', errors);
  }

  static unauthorized(message = 'Authentication required', code: ErrorCode = 'AUTH_REQUIRED') {
    return new AppError(401, message, code);
  }

  static forbidden(message = 'You do not have permission to perform this action') {
    return new AppError(403, message, 'FORBIDDEN');
  }

  static notFound(message = 'Resource not found') {
    return new AppError(404, message, 'NOT_FOUND');
  }

  static conflict(message: string) {
    return new AppError(409, message, 'CONFLICT');
  }

  static validation(errors: FieldError[], message = 'Validation failed') {
    return new AppError(422, message, 'VALIDATION_ERROR', errors);
  }
}
