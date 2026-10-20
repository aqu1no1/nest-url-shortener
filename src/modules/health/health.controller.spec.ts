import { ServiceUnavailableException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DATABASE_CHECK_TIMEOUT_MS, HealthController } from '@/modules/health/health.controller';
import type { PrismaService } from '@/modules/prisma/prisma.service';

const i18n = {
  t: vi.fn<(key: string) => string>(() => 'O banco de dados está indisponível.'),
} as unknown as I18nService;

const createController = (queryRaw: () => Promise<unknown>) =>
  new HealthController(
    { $queryRaw: vi.fn<() => Promise<unknown>>(queryRaw) } as unknown as PrismaService,
    i18n,
  );

describe('HealthController', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('responde ok quando o banco responde', async () => {
    const controller = createController(async () => [{ '?column?': 1 }]);

    await expect(controller.check()).resolves.toEqual({
      status: 'ok',
      database: 'up',
      timestamp: expect.any(String),
    });
  });

  it('responde 503 traduzido quando o banco falha', async () => {
    const controller = createController(async () => {
      throw new Error('ECONNREFUSED');
    });

    const result = controller.check();

    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
    await expect(result).rejects.toThrow('O banco de dados está indisponível.');
  });

  it(`responde 503 quando o banco não responde em ${DATABASE_CHECK_TIMEOUT_MS} ms`, async () => {
    vi.useFakeTimers();
    const controller = createController(() => new Promise(() => undefined));

    const result = controller.check();
    vi.advanceTimersByTime(DATABASE_CHECK_TIMEOUT_MS);

    await expect(result).rejects.toBeInstanceOf(ServiceUnavailableException);
  });
});
