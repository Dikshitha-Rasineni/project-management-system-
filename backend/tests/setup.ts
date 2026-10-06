import { afterAll, beforeEach } from 'vitest';
import { prisma } from '../src/config/prisma';

beforeEach(async () => {
  // Children first; TRUNCATE ... CASCADE keeps it to a single statement.
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "tasks", "projects", "users", "revoked_tokens" RESTART IDENTITY CASCADE',
  );
});

afterAll(async () => {
  await prisma.$disconnect();
});
