import { config } from 'dotenv';

export const MAX_TEST_WORKERS = 4;

const TEST_DATABASE_NAME = /_test(_[1-9]\d*)?$/;

export function loadTestEnv() {
  config({ path: '.env.test', quiet: true });
}

export function databaseName(url) {
  return decodeURIComponent(new URL(url).pathname.slice(1));
}

export function assertTestDatabase(url) {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error(
      `NODE_ENV precisa ser "test" para usar o banco de testes (atual: ${process.env.NODE_ENV ?? 'indefinido'}).`,
    );
  }

  if (!url) {
    throw new Error(
      'DATABASE_URL não está definida para os testes. Copie .env.test.example para .env.test.',
    );
  }

  const name = databaseName(url);
  if (!TEST_DATABASE_NAME.test(name)) {
    throw new Error(
      `Recusando usar o banco "${name}": bancos de teste precisam terminar em "_test".`,
    );
  }
}

export function workerDatabaseUrl(baseUrl, workerId) {
  const url = new URL(baseUrl);
  url.pathname = `/${databaseName(baseUrl)}_${workerId}`;
  return url.toString();
}
