import { NotFoundException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { generateShortCode } from '@/common/utils/generate-short-code';
import type { PrismaClient } from '@/generated/prisma/client';
import type { PrismaService } from '@/modules/prisma/prisma.service';
import { UrlsService } from '@/modules/urls/urls.service';
import { truncateAllTables } from '@test/support/database/cleanup';
import { createTestPrismaClient } from '@test/support/database/client';

vi.mock('@/common/utils/generate-short-code', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/common/utils/generate-short-code')>();
  return {
    ...actual,
    generateShortCode: vi.fn<typeof actual.generateShortCode>(actual.generateShortCode),
  };
});

describe('UrlsService (PostgreSQL)', () => {
  let prisma: PrismaClient;
  let service: UrlsService;

  beforeAll(async () => {
    prisma = createTestPrismaClient();
    await prisma.$connect();
    service = new UrlsService(
      prisma as unknown as PrismaService,
      {
        t: (key: string) => key,
      } as unknown as I18nService,
    );
  });

  beforeEach(async () => {
    await truncateAllTables(prisma);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('cria e persiste a URL com accessCount 0', async () => {
    const created = await service.create({ dto: { url: 'https://example.com/a' } });

    expect(created).toMatchObject({ id: '1', url: 'https://example.com/a' });
    await expect(
      prisma.url.findUnique({ where: { shortCode: created.shortCode } }),
    ).resolves.toMatchObject({ accessCount: 0 });
  });

  it('gera outro código quando o sorteado já existe', async () => {
    await prisma.url.create({
      data: { url: 'https://example.com/existente', shortCode: 'dup123' },
    });
    vi.mocked(generateShortCode).mockReturnValueOnce('dup123').mockReturnValueOnce('new123');

    const created = await service.create({ dto: { url: 'https://example.com/nova' } });

    expect(created.shortCode).toBe('new123');
    await expect(prisma.url.count()).resolves.toBe(2);
  });

  it('recupera pelo código e conta um acesso por chamada, sem alterar updatedAt', async () => {
    const { shortCode, updatedAt } = await service.create({
      dto: { url: 'https://example.com/a' },
    });

    const found = await service.findByCode({ shortCode });
    await service.findByCode({ shortCode });

    expect(found).toMatchObject({ shortCode, url: 'https://example.com/a' });
    expect(found.createdAt).toBeInstanceOf(Date);
    const stats = await service.getStats({ shortCode });
    expect(stats.accessCount).toBe(2);
    expect(stats.updatedAt).toEqual(updatedAt);
  });

  it('conta acessos concorrentes de forma atômica', async () => {
    const { shortCode } = await service.create({ dto: { url: 'https://example.com/a' } });

    await Promise.all(Array.from({ length: 25 }, () => service.findByCode({ shortCode })));

    await expect(service.getStats({ shortCode })).resolves.toMatchObject({ accessCount: 25 });
  });

  it('não conta acesso ao consultar stats', async () => {
    const { shortCode } = await service.create({ dto: { url: 'https://example.com/a' } });

    await service.getStats({ shortCode });

    await expect(service.getStats({ shortCode })).resolves.toMatchObject({ accessCount: 0 });
  });

  it('atualiza a URL mantendo o código e avançando updatedAt', async () => {
    const created = await service.create({ dto: { url: 'https://example.com/a' } });

    const updated = await service.update({
      shortCode: created.shortCode,
      dto: { url: 'https://example.com/b' },
    });

    expect(updated).toMatchObject({
      id: created.id,
      shortCode: created.shortCode,
      url: 'https://example.com/b',
    });
    expect(updated.updatedAt.getTime()).toBeGreaterThan(created.updatedAt.getTime());
  });

  it('exclui a URL', async () => {
    const { shortCode } = await service.create({ dto: { url: 'https://example.com/a' } });

    await service.remove({ shortCode });

    await expect(prisma.url.count()).resolves.toBe(0);
  });

  it.each([
    ['findByCode', (s: UrlsService) => s.findByCode({ shortCode: 'nao-existe' })],
    [
      'update',
      (s: UrlsService) =>
        s.update({ shortCode: 'nao-existe', dto: { url: 'https://example.com' } }),
    ],
    ['remove', (s: UrlsService) => s.remove({ shortCode: 'nao-existe' })],
    ['getStats', (s: UrlsService) => s.getStats({ shortCode: 'nao-existe' })],
  ])('%s lança 404 para código inexistente', async (_name, call) => {
    await expect(call(service)).rejects.toBeInstanceOf(NotFoundException);
  });
});
