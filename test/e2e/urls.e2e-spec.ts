import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { truncateAllTables } from '@test/support/database/cleanup';
import { createTestApp } from '@test/support/helpers/create-test-app';

const PROBLEM_JSON = /application\/problem\+json/;

describe('URLs (HTTP)', () => {
  let app: INestApplication<App>;

  beforeAll(async () => {
    app = await createTestApp();
  });

  beforeEach(async () => {
    await truncateAllTables(app.get(PrismaService));
  });

  afterAll(async () => {
    await app.close();
  });

  const create = (url = 'https://www.example.com/some/long/url') =>
    request(app.getHttpServer()).post('/shorten').send({ url });

  it('POST /shorten responde 201 com { data }', async () => {
    const response = await create().expect(201);

    expect(response.body).toEqual({
      data: {
        id: '1',
        url: 'https://www.example.com/some/long/url',
        shortCode: expect.stringMatching(/^[0-9A-Za-z]{6}$/),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      },
    });
  });

  it('GET /shorten/:code conta acesso e /stats não conta', async () => {
    const { shortCode } = (await create()).body.data;

    await request(app.getHttpServer()).get(`/shorten/${shortCode}`).expect(200);
    await request(app.getHttpServer()).get(`/shorten/${shortCode}`).expect(200);
    const stats = await request(app.getHttpServer()).get(`/shorten/${shortCode}/stats`).expect(200);
    await request(app.getHttpServer()).get(`/shorten/${shortCode}/stats`).expect(200);

    expect(stats.body.data).toMatchObject({ shortCode, accessCount: 2 });
  });

  it('PUT /shorten/:code atualiza a URL', async () => {
    const { shortCode } = (await create()).body.data;

    const response = await request(app.getHttpServer())
      .put(`/shorten/${shortCode}`)
      .send({ url: 'https://www.example.com/updated' })
      .expect(200);

    expect(response.body.data).toMatchObject({ shortCode, url: 'https://www.example.com/updated' });
  });

  it('DELETE /shorten/:code responde 204 sem corpo', async () => {
    const { shortCode } = (await create()).body.data;

    const response = await request(app.getHttpServer()).delete(`/shorten/${shortCode}`).expect(204);

    expect(response.text).toBe('');
    await request(app.getHttpServer()).get(`/shorten/${shortCode}`).expect(404);
  });

  describe('Problem Details (RFC 9457) e i18n', () => {
    it('404 em pt-BR por padrão', async () => {
      const response = await request(app.getHttpServer())
        .get('/shorten/nao-existe')
        .expect(404)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Não encontrado',
        status: 404,
        detail: 'Não foi possível encontrar a URL.',
        instance: '/shorten/nao-existe',
      });
    });

    it('404 em inglês com Accept-Language: en', async () => {
      const response = await request(app.getHttpServer())
        .get('/shorten/nao-existe')
        .set('Accept-Language', 'en-US,en;q=0.9')
        .expect(404);

      expect(response.body).toMatchObject({
        title: 'Not Found',
        detail: 'Could not find the URL.',
      });
    });

    it('400 com erros por campo, traduzido via ?lang=en', async () => {
      const response = await request(app.getHttpServer())
        .post('/shorten?lang=en')
        .send({ url: 'nao-e-url', extra: true })
        .expect(400)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Bad Request',
        status: 400,
        detail: 'The request contains invalid fields.',
        instance: '/shorten?lang=en',
        errors: [
          { field: 'extra', messages: ['The property extra is not allowed.'] },
          { field: 'url', messages: ['url must be a valid http or https URL.'] },
        ],
      });
    });

    it('400 em pt-BR quando falta a url', async () => {
      const response = await request(app.getHttpServer()).post('/shorten').send({}).expect(400);

      expect(response.body.errors).toEqual([
        {
          field: 'url',
          messages: expect.arrayContaining(['url é obrigatória.', 'url deve ser um texto.']),
        },
      ]);
    });

    it('rota inexistente também vira Problem Details', async () => {
      const response = await request(app.getHttpServer())
        .get('/nada')
        .expect(404)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toMatchObject({ detail: 'A rota GET /nada não existe.' });
    });
  });
});
