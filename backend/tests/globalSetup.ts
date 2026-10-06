import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';

/** Applies all migrations to the test database once before the suite runs. */
export default function setup() {
  const fileEnv = parse(fs.readFileSync(path.resolve(__dirname, '..', '.env.test')));
  const databaseUrl = process.env.DATABASE_URL ?? fileEnv.DATABASE_URL;
  if (!databaseUrl || !/test/i.test(databaseUrl)) {
    throw new Error(`Refusing to run tests against a non-test database: ${databaseUrl}`);
  }
  execSync('npx prisma migrate deploy', {
    cwd: path.resolve(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'inherit',
  });
}
