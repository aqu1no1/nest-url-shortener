import { type CallHandler, type ExecutionContext, StreamableFile } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { ResponseEnvelopeInterceptor } from '@/common/interceptors/response-envelope.interceptor';

const run = async (body: unknown, { skip = false, type = 'http' } = {}) => {
  const reflector = new Reflector();
  vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(skip);
  const context = {
    getHandler: () => () => undefined,
    getClass: () => Object,
    getType: () => type,
  } as unknown as ExecutionContext;
  const next: CallHandler = { handle: () => of(body) };

  return firstValueFrom(new ResponseEnvelopeInterceptor(reflector).intercept(context, next));
};

describe('ResponseEnvelopeInterceptor', () => {
  it('envolve o recurso em { data }', async () => {
    await expect(run({ id: '1' })).resolves.toEqual({ data: { id: '1' } });
  });

  it('envolve listas e null', async () => {
    await expect(run([1, 2])).resolves.toEqual({ data: [1, 2] });
    await expect(run(null)).resolves.toEqual({ data: null });
  });

  it('não cria corpo para respostas sem conteúdo', async () => {
    await expect(run(undefined)).resolves.toBeUndefined();
  });

  it('não envolve de novo uma resposta { data, meta }', async () => {
    const body = { data: [1], meta: { total: 1 } };

    await expect(run(body)).resolves.toBe(body);
  });

  it('envolve objetos que têm data junto com outras chaves', async () => {
    await expect(run({ data: 1, other: 2 })).resolves.toEqual({ data: { data: 1, other: 2 } });
  });

  it('respeita @SkipResponseEnvelope()', async () => {
    await expect(run({ status: 'ok' }, { skip: true })).resolves.toEqual({ status: 'ok' });
  });

  it('não altera StreamableFile nem contextos que não são HTTP', async () => {
    const file = new StreamableFile(Buffer.from('x'));

    await expect(run(file)).resolves.toBe(file);
    await expect(run({ id: 1 }, { type: 'rpc' })).resolves.toEqual({ id: 1 });
  });
});
