import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from '@test/support/helpers/create-test-app';

const LIMIT = 2;

describe('Rate limit (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ throttle: { ttl: 60_000, limit: LIMIT } });
  });

  afterAll(async () => {
    await app.close();
  });

  it(`responde 429 em Problem Details depois de ${LIMIT} requisições`, async () => {
    for (let i = 0; i < LIMIT; i++) {
      await request(app.getHttpServer()).get('/shorten/abc123').expect(404);
    }

    const response = await request(app.getHttpServer())
      .get('/shorten/abc123')
      .expect(429)
      .expect('content-type', /application\/problem\+json/)
      .expect('retry-after', /^\d+$/);

    expect(response.body).toEqual({
      type: 'about:blank',
      title: 'Muitas requisições',
      status: 429,
      detail: 'Muitas requisições. Tente novamente em instantes.',
      instance: '/shorten/abc123',
    });
  });

  it('traduz o 429 com ?lang=en', async () => {
    const response = await request(app.getHttpServer()).get('/shorten/abc123?lang=en').expect(429);

    expect(response.body).toMatchObject({
      title: 'Too Many Requests',
      detail: 'Too many requests. Try again shortly.',
    });
  });

  it('não limita o /health', async () => {
    const statuses: number[] = [];

    for (let i = 0; i <= LIMIT; i++) {
      const { status } = await request(app.getHttpServer()).get('/health');
      statuses.push(status);
    }

    expect(statuses).toEqual(Array(LIMIT + 1).fill(200));
  });
});
