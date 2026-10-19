import {
  assertTestDatabase,
  loadTestEnv,
  workerDatabaseUrl,
} from '@test/support/setup/test-database.mjs';

loadTestEnv();

process.env.TEST_DATABASE_BASE_URL ??= process.env.DATABASE_URL;

const baseUrl = process.env.TEST_DATABASE_BASE_URL;
assertTestDatabase(baseUrl);

const url = workerDatabaseUrl(baseUrl, process.env.VITEST_POOL_ID ?? '1');
assertTestDatabase(url);

process.env.DATABASE_URL = url;
