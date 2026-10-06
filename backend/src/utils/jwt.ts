import { randomUUID } from 'node:crypto';
import jwt, { type JwtPayload, type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from './AppError';

const ISSUER = 'pms-api';
const AUDIENCE = 'pms-clients';
const ALGORITHM = 'HS256' as const;

export interface AccessTokenClaims {
  sub: string;
  jti: string;
  exp: number;
  iat: number;
}

export function signAccessToken(userId: string) {
  const jti = randomUUID();
  const token = jwt.sign({}, env.JWT_SECRET, {
    subject: userId,
    jwtid: jti,
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: ALGORITHM,
    expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
  });
  const decoded = jwt.decode(token) as JwtPayload;
  return { token, jti, expiresAt: new Date((decoded.exp as number) * 1000) };
}

/**
 * Verifies signature, algorithm, issuer, audience and expiry.
 * Distinguishes "expired" from "invalid" so clients can show
 * "Your session has expired" instead of a generic error.
 */
export function verifyAccessToken(token: string): AccessTokenClaims {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET, {
      algorithms: [ALGORITHM],
      issuer: ISSUER,
      audience: AUDIENCE,
    }) as JwtPayload;

    if (!payload.sub || !payload.jti || !payload.exp || !payload.iat) {
      throw AppError.unauthorized('Invalid authentication token', 'TOKEN_INVALID');
    }
    return { sub: payload.sub, jti: payload.jti, exp: payload.exp, iat: payload.iat };
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw AppError.unauthorized('Your session has expired. Please log in again.', 'TOKEN_EXPIRED');
    }
    throw AppError.unauthorized('Invalid authentication token', 'TOKEN_INVALID');
  }
}
