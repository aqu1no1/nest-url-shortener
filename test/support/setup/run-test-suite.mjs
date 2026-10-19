import { spawn } from 'node:child_process';
import { copyFileSync, existsSync } from 'node:fs';
import { MAX_TEST_WORKERS } from './test-database.mjs';

const SUITES = {
  all: ['--project', 'integration', '--project', 'e2e'],
  integration: ['--project', 'integration'],
  e2e: ['--project', 'e2e', '--passWithNoTests'],
};

const [suite = 'all', workersArg, ...vitestArgs] = process.argv.slice(2);

if (!(suite in SUITES)) {
  console.error(`Suíte inválida: "${suite}". Use: ${Object.keys(SUITES).join(', ')}.`);
  process.exit(1);
}

const workers = Number(workersArg ?? MAX_TEST_WORKERS);
if (!Number.isInteger(workers) || workers < 1 || workers > MAX_TEST_WORKERS) {
  console.error(`Quantidade de workers inválida: "${workersArg}". Use de 1 a ${MAX_TEST_WORKERS}.`);
  process.exit(1);
}

if (!existsSync('.env.test')) {
  copyFileSync('.env.test.example', '.env.test');
  console.log('.env.test criado a partir do .env.test.example.');
}

const env = { ...process.env, NODE_ENV: 'test' };
const compose = ['compose', '-f', 'docker-compose.test.yml', '--env-file', '.env.test'];

let current;

function run(command, args) {
  return new Promise((resolve) => {
    current = spawn(command, args, { env, stdio: 'inherit' });
    current.on('error', (error) => {
      console.error(error.message);
      resolve(1);
    });
    current.on('close', (code, signal) => {
      current = undefined;
      resolve(code ?? (signal ? 1 : 0));
    });
  });
}

let tearingDown;

function teardown() {
  tearingDown ??= run('docker', [...compose, 'down', '-v', '--remove-orphans']);
  return tearingDown;
}

for (const [signal, code] of [
  ['SIGINT', 130],
  ['SIGTERM', 143],
]) {
  process.on(signal, async () => {
    console.error(`\n${signal} recebido; encerrando o banco de testes.`);
    current?.kill(signal);
    await teardown();
    process.exit(code);
  });
}

let exitCode = 1;

try {
  exitCode = await run('docker', [...compose, 'up', '-d', '--wait']);

  if (exitCode === 0) {
    exitCode = await run('node', ['test/support/setup/prepare-test-dbs.mjs', String(workers)]);
  }

  if (exitCode === 0) {
    exitCode = await run('pnpm', [
      'exec',
      'vitest',
      'run',
      ...SUITES[suite],
      '--maxWorkers',
      String(workers),
      ...vitestArgs,
    ]);
  }
} finally {
  const teardownCode = await teardown();
  if (exitCode === 0 && teardownCode !== 0) {
    exitCode = teardownCode;
  }
}

process.exit(exitCode);
