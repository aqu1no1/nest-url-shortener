import { ConfigService } from '@nestjs/config';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { AppConfig } from '@/common/interfaces/app-config.interface';
import { PrismaService } from '@/modules/prisma/prisma.service';

const createService = () => {
  const config = {
    get: vi
      .fn<() => string>()
      .mockReturnValue('postgresql://postgres:postgres@localhost:5432/url_shortener'),
  } as unknown as ConfigService<AppConfig, true>;

  return { service: new PrismaService(config), config };
};

describe('PrismaService', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('lê a DATABASE_URL do ConfigService', () => {
    const { config } = createService();

    expect(config.get).toHaveBeenCalledWith('database.url', { infer: true });
  });

  it('conecta e valida a conexão ao iniciar o módulo', async () => {
    const { service } = createService();
    const connect = vi.spyOn(service, '$connect').mockResolvedValue();
    const query = vi.spyOn(service, '$queryRaw').mockResolvedValue([{ '?column?': 1 }] as never);

    await service.onModuleInit();

    expect(connect).toHaveBeenCalledOnce();
    expect(query).toHaveBeenCalledOnce();
  });

  it('propaga o erro quando o banco não está acessível', async () => {
    const { service } = createService();
    vi.spyOn(service, '$connect').mockResolvedValue();
    vi.spyOn(service, '$queryRaw').mockRejectedValue(new Error('ECONNREFUSED'));

    await expect(service.onModuleInit()).rejects.toThrow('ECONNREFUSED');
  });

  it('desconecta ao destruir o módulo', async () => {
    const { service } = createService();
    const disconnect = vi.spyOn(service, '$disconnect').mockResolvedValue();

    await service.onModuleDestroy();

    expect(disconnect).toHaveBeenCalledOnce();
  });
});
