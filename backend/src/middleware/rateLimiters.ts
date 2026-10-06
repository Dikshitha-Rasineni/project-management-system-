import rateLimit from 'express-rate-limit';

const FIFTEEN_MINUTES = 15 * 60 * 1000;

const rateLimitedBody = (message: string) => ({ success: false, message, code: 'RATE_LIMITED' });

/**
 * Login: counts only FAILED attempts per IP, so a brute-force run is blocked
 * while a user who logs in successfully is never locked out.
 */
export function createLoginLimiter(max: number) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: max,
    skipSuccessfulRequests: true,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: rateLimitedBody('Too many login attempts. Please try again in 15 minutes.'),
  });
}

/** Registration: counts every attempt per IP to slow down mass account creation. */
export function createRegisterLimiter(max: number) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: rateLimitedBody('Too many registration attempts. Please try again later.'),
  });
}

/** A generous global ceiling for every API route to blunt abuse/scraping. */
export function createApiLimiter(max = 1000) {
  return rateLimit({
    windowMs: FIFTEEN_MINUTES,
    limit: max,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: rateLimitedBody('Too many requests. Please slow down.'),
  });
}
