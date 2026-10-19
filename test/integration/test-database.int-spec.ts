import { afterEach, describe, expect, it } from 'vitest';
import { assertTestDatabase, workerDatabaseUrl } from '../support/setup/test-database.mjs';

const BASE_URL = 'postgresql://postgres:postgres@localhost:5433/url_shortener_test';

describe('guarda do banco de testes', () => {
  const nodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = nodeEnv;
  });

  it('monta a URL do banco de cada worker', () => {
    expect(workerDatabaseUrl(BASE_URL, 3)).toBe(
      'postgresql://postgres:postgres@localhost:5433/url_shortener_test_3',
    );
  });

  it('aceita bancos terminados em _test ou _test_N', () => {
    expect(() => assertTestDatabase(BASE_URL)).not.toThrow();
    expect(() => assertTestDatabase(workerDatabaseUrl(BASE_URL, 1))).not.toThrow();
  });

  it('recusa o banco de desenvolvimento', () => {
    expect(() =>
      assertTestDatabase('postgresql://postgres:postgres@localhost:5432/url_shortener'),
    ).toThrow(/Recusando usar o banco "url_shortener"/);
  });

  it('recusa quando NODE_ENV não é test', () => {
    process.env.NODE_ENV = 'development';

    expect(() => assertTestDatabase(BASE_URL)).toThrow(/NODE_ENV precisa ser "test"/);
  });

  it('recusa quando DATABASE_URL não está definida', () => {
    expect(() => assertTestDatabase(undefined)).toThrow(/DATABASE_URL não está definida/);
  });
});
