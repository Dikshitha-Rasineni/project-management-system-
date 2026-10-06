import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'dotenv';
import { defineConfig } from 'vitest/config';

// Test env comes from .env.test; values already in process.env (e.g. a CI
// service's DATABASE_URL) take precedence.
const fileEnv = parse(fs.readFileSync(path.resolve(__dirname, '.env.test')));
const testEnv = Object.fromEntries(
  Object.entries(fileEnv).map(([k, v]) => [k, k === 'NODE_ENV' ? v : (process.env[k] ?? v)]),
);

export default defineConfig({
  test: {
    environment: 'node',
    env: testEnv,
    globalSetup: ['./tests/globalSetup.ts'],
    setupFiles: ['./tests/setup.ts'],
    // All suites share one test database, so run files one at a time.
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
