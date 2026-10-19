import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { OPENAPI_JSON_PATH, SWAGGER_PATH } from '@/common/constants/swagger.constants';
import { createTestApp } from '@test/support/helpers/create-test-app';

describe('Swagger (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp({ swagger: true });
  });

  afterAll(async () => {
    await app.close();
  });

  it(`GET /${SWAGGER_PATH} serve a Swagger UI`, async () => {
    const response = await request(app.getHttpServer())
      .get(`/${SWAGGER_PATH}`)
      .redirects(1)
      .expect(200);

    expect(response.text).toContain('swagger-ui');
  });

  it(`GET /${OPENAPI_JSON_PATH} documenta os cinco endpoints sem envelope`, async () => {
    const { body } = await request(app.getHttpServer()).get(`/${OPENAPI_JSON_PATH}`).expect(200);

    expect(body).not.toHaveProperty('data');
    expect(body.openapi).toMatch(/^3\./);
    expect(Object.keys(body.paths)).toEqual(
      expect.arrayContaining(['/shorten', '/shorten/{code}', '/shorten/{code}/stats', '/health']),
    );
    expect(Object.keys(body.paths['/shorten/{code}'])).toEqual(
      expect.arrayContaining(['get', 'put', 'delete']),
    );
  });

  it('documenta o envelope { data } e o Problem Details', async () => {
    const { body } = await request(app.getHttpServer()).get(`/${OPENAPI_JSON_PATH}`).expect(200);
    const post = body.paths['/shorten'].post.responses;

    expect(post['201'].content['application/json'].schema).toEqual({
      type: 'object',
      required: ['data'],
      properties: { data: { $ref: '#/components/schemas/UrlResponse' } },
    });
    expect(post['400'].content).toHaveProperty(['application/problem+json']);
    expect(body.paths['/shorten/{code}'].delete.responses['204']).toBeDefined();
  });
});
