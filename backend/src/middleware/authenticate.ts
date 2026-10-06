import type { NextFunction, Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { AppError } from '../utils/AppError';
import { verifyAccessToken } from '../utils/jwt';

export interface AuthContext {
  userId: string;
  jti: string;
  exp: number;
}

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

/**
 * Requires `Authorization: Bearer <jwt>`. Verifies the token, rejects tokens
 * revoked by logout and tokens whose user no longer exists, then attaches
 * `req.auth`. Every route behind this middleware is scoped to req.auth.userId.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw AppError.unauthorized('Authentication required. Please log in.', 'AUTH_REQUIRED');
  }

  const token = header.slice('Bearer '.length).trim();
  if (!token) throw AppError.unauthorized('Authentication required. Please log in.', 'AUTH_REQUIRED');

  const claims = verifyAccessToken(token);

  const [revoked, user] = await Promise.all([
    prisma.revokedToken.findUnique({ where: { jti: claims.jti }, select: { jti: true } }),
    prisma.user.findUnique({ where: { id: claims.sub }, select: { id: true } }),
  ]);

  if (revoked) {
    throw AppError.unauthorized('Your session has ended. Please log in again.', 'TOKEN_INVALID');
  }
  if (!user) throw AppError.unauthorized('Account no longer exists', 'TOKEN_INVALID');

  req.auth = { userId: claims.sub, jti: claims.jti, exp: claims.exp };
  next();
}

/** Narrowing helper for controllers that run behind `authenticate`. */
export function requireAuth(req: Request): AuthContext {
  if (!req.auth) throw AppError.unauthorized();
  return req.auth;
}
