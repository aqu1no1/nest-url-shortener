import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { Prisma, type PrismaClient } from '@/generated/prisma/client';
import { truncateAllTables } from '@test/support/database/cleanup';
import { createTestPrismaClient } from '@test/support/database/client';

describe('migrations', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
  });

  beforeEach(async () => {
    await truncateAllTables(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('usa o banco do próprio worker', async () => {
    const [{ name }] = await prisma.$queryRaw<
      { name: string }[]
    >`SELECT current_database() AS name`;

    expect(name).toMatch(/^url_shortener_test_[1-4]$/);
  });

  it('aplicou a migration create_urls_table', async () => {
    const migrations = await prisma.$queryRaw<{ migration_name: string; finished: boolean }[]>`
      SELECT migration_name, finished_at IS NOT NULL AS finished FROM _prisma_migrations
    `;

    expect(migrations).toContainEqual(
      expect.objectContaining({
        migration_name: expect.stringMatching(/_create_urls_table$/),
        finished: true,
      }),
    );
  });

  it('cria a tabela urls com colunas snake_case', async () => {
    const columns = await prisma.$queryRaw<{ column_name: string; data_type: string }[]>`
      SELECT column_name, data_type FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'urls'
      ORDER BY ordinal_position
    `;

    expect(columns).toEqual([
      { column_name: 'id', data_type: 'integer' },
      { column_name: 'url', data_type: 'text' },
      { column_name: 'short_code', data_type: 'character varying' },
      { column_name: 'access_count', data_type: 'integer' },
      { column_name: 'created_at', data_type: 'timestamp with time zone' },
      { column_name: 'updated_at', data_type: 'timestamp with time zone' },
    ]);
  });

  it('aplica os valores padrão ao criar uma URL', async () => {
    const created = await prisma.url.create({
      data: { url: 'https://example.com', shortCode: 'abc123' },
    });

    expect(created).toMatchObject({ id: 1, accessCount: 0 });
    expect(created.createdAt).toBeInstanceOf(Date);
    expect(created.updatedAt).toBeInstanceOf(Date);
  });

  it('impede shortCode duplicado', async () => {
    await prisma.url.create({ data: { url: 'https://example.com/a', shortCode: 'dup123' } });

    const duplicate = prisma.url.create({
      data: { url: 'https://example.com/b', shortCode: 'dup123' },
    });

    await expect(duplicate).rejects.toBeInstanceOf(Prisma.PrismaClientKnownRequestError);
    await expect(duplicate).rejects.toMatchObject({ code: 'P2002' });
  });

  it('limpa os dados entre os testes', async () => {
    await expect(prisma.url.count()).resolves.toBe(0);
  });
});
