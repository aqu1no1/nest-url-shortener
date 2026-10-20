import { readFileSync } from 'node:fs';
import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { SHORT_CODE_PATTERN } from '@/common/constants/short-code.constants';
import { SWAGGER_PATH } from '@/common/constants/swagger.constants';
import { OPENAPI_JSON_PATH } from '@/config/swagger';
import { MAX_URL_LENGTH } from '@/modules/urls/dto/create-url.dto';
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
      properties: { data: { $ref: '#/components/schemas/UrlResponseDto' } },
    });
    expect(post['400'].content).toHaveProperty(['application/problem+json']);
    expect(body.paths['/shorten/{code}'].delete.responses['204']).toBeDefined();
  });

  it('usa a versão do package.json', async () => {
    const { body } = await request(app.getHttpServer()).get(`/${OPENAPI_JSON_PATH}`).expect(200);

    const { version } = JSON.parse(readFileSync('package.json', 'utf8')) as { version: string };

    expect(body.info.version).toBe(version);
  });

  it('documenta limites: 413, 429, formato do código e tamanho da url', async () => {
    const { body } = await request(app.getHttpServer()).get(`/${OPENAPI_JSON_PATH}`).expect(200);
    const byCode = body.paths['/shorten/{code}'];

    expect(Object.keys(body.paths['/shorten'].post.responses)).toEqual(
      expect.arrayContaining(['413', '429']),
    );
    expect(Object.keys(byCode.put.responses)).toEqual(expect.arrayContaining(['413', '429']));
    expect(byCode.get.parameters).toContainEqual(
      expect.objectContaining({
        name: 'code',
        schema: expect.objectContaining({ pattern: SHORT_CODE_PATTERN.source, example: 'abc123' }),
      }),
    );
    expect(body.components.schemas.CreateUrlDto.properties.url.maxLength).toBe(MAX_URL_LENGTH);
  });
});
