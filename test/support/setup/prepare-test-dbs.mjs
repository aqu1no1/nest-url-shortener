import { execFileSync } from 'node:child_process';
import { Client, escapeIdentifier } from 'pg';
import {
  MAX_TEST_WORKERS,
  assertTestDatabase,
  databaseName,
  loadTestEnv,
  workerDatabaseUrl,
} from './test-database.mjs';

loadTestEnv();

const workers = Number(process.argv[2] ?? MAX_TEST_WORKERS);
if (!Number.isInteger(workers) || workers < 1 || workers > MAX_TEST_WORKERS) {
  console.error(
    `Quantidade de workers inválida: "${process.argv[2]}". Use de 1 a ${MAX_TEST_WORKERS}.`,
  );
  process.exit(1);
}

const baseUrl = process.env.DATABASE_URL;
assertTestDatabase(baseUrl);

const adminUrl = new URL(baseUrl);
adminUrl.pathname = '/postgres';

const admin = new Client({ connectionString: adminUrl.toString() });
await admin.connect();

const urls = [];
try {
  for (let worker = 1; worker <= workers; worker++) {
    const url = workerDatabaseUrl(baseUrl, worker);
    assertTestDatabase(url);
    const name = escapeIdentifier(databaseName(url));

    await admin.query(`DROP DATABASE IF EXISTS ${name} WITH (FORCE)`);
    await admin.query(`CREATE DATABASE ${name}`);
    urls.push(url);
  }
} finally {
  await admin.end();
}

for (const url of urls) {
  console.log(`Aplicando migrations em ${databaseName(url)}`);
  execFileSync('pnpm', ['exec', 'prisma', 'migrate', 'deploy'], {
    env: { ...process.env, DATABASE_URL: url, PRISMA_HIDE_UPDATE_MESSAGE: '1' },
    stdio: ['ignore', 'ignore', 'inherit'],
  });
}

console.log(`${workers} banco(s) de teste prontos.`);
