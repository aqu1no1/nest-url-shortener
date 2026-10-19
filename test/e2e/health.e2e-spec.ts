import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createTestApp } from '@test/support/helpers/create-test-app';

describe('Health (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health responde 200 sem envelope', async () => {
    const response = await request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect('content-type', /application\/json/);

    expect(response.body).toEqual({ status: 'ok', database: 'up', timestamp: expect.any(String) });
    expect(new Date(response.body.timestamp).toISOString()).toBe(response.body.timestamp);
  });
});
