import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/client';
import { env } from './env';

/**
 * Single shared Prisma client using the `pg` driver adapter (Prisma 7).
 * Prisma only issues parameterized queries, which is the application's
 * primary defence against SQL injection — no SQL is ever built by
 * concatenating user input anywhere in the codebase.
 */
const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });

export const prisma = new PrismaClient({
  adapter,
  log: env.isProduction ? ['error'] : ['warn', 'error'],
});
