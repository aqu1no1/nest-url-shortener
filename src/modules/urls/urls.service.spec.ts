import { NotFoundException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_SHORT_CODE_ATTEMPTS } from '@/common/constants/short-code.constants';
import type { Url } from '@/generated/prisma/client';
import type { PrismaService } from '@/modules/prisma/prisma.service';
import { UrlsService } from '@/modules/urls/urls.service';

const entity: Url = {
  id: 1,
  url: 'https://www.example.com/some/long/url',
  shortCode: 'abc123',
  accessCount: 3,
  createdAt: new Date('2026-10-19T12:00:00.000Z'),
  updatedAt: new Date('2026-10-19T12:00:00.000Z'),
};

const i18n = {
  t: vi.fn<(key: string, options?: { args?: { entity?: string } }) => string>((key, options) =>
    key === 'errors.NOT_FOUND' ? `Não foi possível encontrar ${options?.args?.entity}.` : 'a URL',
  ),
} as unknown as I18nService;

const createPrismaMock = () => ({
  url: {
    createManyAndReturn: vi.fn<(args: unknown) => Promise<Url[]>>(),
    updateManyAndReturn: vi.fn<(args: unknown) => Promise<Url[]>>(),
    deleteMany: vi.fn<(args: unknown) => Promise<{ count: number }>>(),
    findUnique: vi.fn<(args: unknown) => Promise<Url | null>>(),
  },
  $queryRaw: vi.fn<(...args: unknown[]) => Promise<Url[]>>(),
});

const shortCodeOf = (args: unknown) => (args as { data: { shortCode: string } }).data.shortCode;

describe('UrlsService', () => {
  let prisma: ReturnType<typeof createPrismaMock>;
  let service: UrlsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    service = new UrlsService(prisma as unknown as PrismaService, i18n);
  });

  describe('create', () => {
    it('cria com um código gerado e devolve a representação pública', async () => {
      prisma.url.createManyAndReturn.mockResolvedValue([entity]);

      const response = await service.create({ dto: { url: entity.url } });

      expect(prisma.url.createManyAndReturn).toHaveBeenCalledWith({
        data: { url: entity.url, shortCode: expect.stringMatching(/^[0-9A-Za-z]{6}$/) },
        skipDuplicates: true,
      });
      expect(response).toMatchObject({ id: '1', shortCode: 'abc123' });
      expect(response).not.toHaveProperty('accessCount');
    });

    it('tenta outro código quando há colisão', async () => {
      prisma.url.createManyAndReturn.mockResolvedValueOnce([]).mockResolvedValueOnce([entity]);

      await service.create({ dto: { url: entity.url } });

      const [first, second] = prisma.url.createManyAndReturn.mock.calls.map(([args]) =>
        shortCodeOf(args),
      );
      expect(prisma.url.createManyAndReturn).toHaveBeenCalledTimes(2);
      expect(first).not.toBe(second);
    });

    it(`desiste após ${MAX_SHORT_CODE_ATTEMPTS} colisões`, async () => {
      prisma.url.createManyAndReturn.mockResolvedValue([]);

      await expect(service.create({ dto: { url: entity.url } })).rejects.toThrow(
        'Não foi possível gerar um código curto único.',
      );
      expect(prisma.url.createManyAndReturn).toHaveBeenCalledTimes(MAX_SHORT_CODE_ATTEMPTS);
    });
  });

  describe('findByCode', () => {
    it('incrementa o acesso e devolve a URL', async () => {
      prisma.$queryRaw.mockResolvedValue([entity]);

      await expect(service.findByCode({ shortCode: 'abc123' })).resolves.toMatchObject({
        shortCode: 'abc123',
      });
      expect(prisma.$queryRaw).toHaveBeenCalledOnce();
    });

    it('lança 404 traduzido quando não existe', async () => {
      prisma.$queryRaw.mockResolvedValue([]);

      const error = service.findByCode({ shortCode: 'nope' });

      await expect(error).rejects.toBeInstanceOf(NotFoundException);
      await expect(error).rejects.toThrow('Não foi possível encontrar a URL.');
    });
  });

  describe('update', () => {
    it('atualiza a URL pelo código', async () => {
      prisma.url.updateManyAndReturn.mockResolvedValue([
        { ...entity, url: 'https://novo.example.com' },
      ]);

      await expect(
        service.update({ shortCode: 'abc123', dto: { url: 'https://novo.example.com' } }),
      ).resolves.toMatchObject({ url: 'https://novo.example.com', shortCode: 'abc123' });
      expect(prisma.url.updateManyAndReturn).toHaveBeenCalledWith({
        where: { shortCode: 'abc123' },
        data: { url: 'https://novo.example.com' },
      });
    });

    it('lança 404 quando não existe', async () => {
      prisma.url.updateManyAndReturn.mockResolvedValue([]);

      await expect(
        service.update({ shortCode: 'nope', dto: { url: entity.url } }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('exclui pelo código', async () => {
      prisma.url.deleteMany.mockResolvedValue({ count: 1 });

      await expect(service.remove({ shortCode: 'abc123' })).resolves.toBeUndefined();
      expect(prisma.url.deleteMany).toHaveBeenCalledWith({ where: { shortCode: 'abc123' } });
    });

    it('lança 404 quando não existe', async () => {
      prisma.url.deleteMany.mockResolvedValue({ count: 0 });

      await expect(service.remove({ shortCode: 'nope' })).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('devolve accessCount sem incrementar', async () => {
      prisma.url.findUnique.mockResolvedValue(entity);

      await expect(service.getStats({ shortCode: 'abc123' })).resolves.toMatchObject({
        accessCount: 3,
      });
      expect(prisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('lança 404 quando não existe', async () => {
      prisma.url.findUnique.mockResolvedValue(null);

      await expect(service.getStats({ shortCode: 'nope' })).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });
});
