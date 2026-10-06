import pino from 'pino';
import { env } from './env';

/**
 * Structured JSON logger. Pretty-printed in development, JSON in production
 * (so log platforms can index fields). Credentials are redacted.
 */
export const logger = pino({
  level: env.isTest ? 'silent' : env.LOG_LEVEL,
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'password',
      '*.password',
      '*.passwordHash',
      'token',
      '*.token',
    ],
    censor: '[REDACTED]',
  },
  ...(env.isProduction || env.isTest
    ? {}
    : {
        transport: {
          target: 'pino-pretty',
          options: { colorize: true, translateTime: 'HH:MM:ss', ignore: 'pid,hostname' },
        },
      }),
});
