import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { PrismaService } from '@/modules/prisma/prisma.service';
import { MAX_URL_LENGTH } from '@/modules/urls/dto/create-url.dto';
import { truncateAllTables } from '@test/support/database/cleanup';
import { createTestApp } from '@test/support/helpers/create-test-app';
import { UUID_V7_PATTERN } from '@test/support/helpers/uuid';

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
        id: expect.stringMatching(UUID_V7_PATTERN),
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

  describe('timestamps', () => {
    it('createdAt e updatedAt saem em ISO 8601 e começam iguais', async () => {
      const { createdAt, updatedAt } = (await create()).body.data;

      expect(new Date(createdAt).toISOString()).toBe(createdAt);
      expect(updatedAt).toBe(createdAt);
    });

    it('GET e /stats não alteram updatedAt', async () => {
      const { shortCode, updatedAt } = (await create()).body.data;

      await request(app.getHttpServer()).get(`/shorten/${shortCode}`).expect(200);
      const stats = await request(app.getHttpServer())
        .get(`/shorten/${shortCode}/stats`)
        .expect(200);

      expect(stats.body.data.updatedAt).toBe(updatedAt);
    });

    it('PUT avança updatedAt e mantém createdAt', async () => {
      const created = (await create()).body.data;

      const updated = (
        await request(app.getHttpServer())
          .put(`/shorten/${created.shortCode}`)
          .send({ url: 'https://www.example.com/updated' })
          .expect(200)
      ).body.data;

      expect(updated.createdAt).toBe(created.createdAt);
      expect(new Date(updated.updatedAt).getTime()).toBeGreaterThan(
        new Date(created.updatedAt).getTime(),
      );
    });
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
        .get('/shorten/naoexiste')
        .expect(404)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Não encontrado',
        status: 404,
        detail: 'Não foi possível encontrar a URL.',
        instance: '/shorten/naoexiste',
      });
    });

    it('404 em inglês com Accept-Language: en', async () => {
      const response = await request(app.getHttpServer())
        .get('/shorten/naoexiste')
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

    it.each([
      ['put', '/shorten/naoexiste'],
      ['delete', '/shorten/naoexiste'],
      ['get', '/shorten/naoexiste/stats'],
    ] as const)('%s %s responde 404 para código inexistente', async (method, path) => {
      const server = request(app.getHttpServer());
      const response = await server[method](path)
        .send({ url: 'https://example.com' })
        .expect(404)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toMatchObject({ detail: 'Não foi possível encontrar a URL.' });
    });

    it('PUT /shorten/:code responde 400 para url inválida sem alterar o registro', async () => {
      const { shortCode, url } = (await create()).body.data;

      const response = await request(app.getHttpServer())
        .put(`/shorten/${shortCode}`)
        .send({ url: 'ftp://example.com' })
        .expect(400)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body.errors).toEqual([
        { field: 'url', messages: ['url deve ser uma URL válida com http ou https.'] },
      ]);
      const stats = await request(app.getHttpServer()).get(`/shorten/${shortCode}/stats`);
      expect(stats.body.data.url).toBe(url);
    });

    it('rota inexistente também vira Problem Details', async () => {
      const response = await request(app.getHttpServer())
        .get('/nada')
        .expect(404)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toMatchObject({ detail: 'A rota GET /nada não existe.' });
    });
  });

  describe('limites e entradas malformadas', () => {
    it.each([
      ['get', '/shorten/%00'],
      ['get', '/shorten/%00/stats'],
      ['delete', '/shorten/%00'],
      ['put', '/shorten/%00'],
      ['get', `/shorten/${'a'.repeat(13)}`],
      ['get', '/shorten/abc-12'],
    ] as const)('%s %s responde 404 para código fora do formato', async (method, path) => {
      const server = request(app.getHttpServer());
      const response = await server[method](path)
        .send({ url: 'https://example.com' })
        .expect(404)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toMatchObject({ detail: 'Não foi possível encontrar a URL.' });
    });

    it('400 para url com caractere de controle', async () => {
      const response = await create('https://example.com/\u0000').expect(400);

      expect(response.body.errors).toEqual([
        { field: 'url', messages: ['url deve ser uma URL válida com http ou https.'] },
      ]);
    });

    it(`400 para url com mais de ${MAX_URL_LENGTH} caracteres, traduzido via ?lang=en`, async () => {
      const response = await request(app.getHttpServer())
        .post('/shorten?lang=en')
        .send({ url: `https://example.com/${'a'.repeat(MAX_URL_LENGTH)}` })
        .expect(400);

      expect(response.body.errors).toEqual([
        {
          field: 'url',
          messages: expect.arrayContaining([`url must have at most ${MAX_URL_LENGTH} characters.`]),
        },
      ]);
    });

    it('413 em Problem Details para corpo acima do limite do Express', async () => {
      const response = await request(app.getHttpServer())
        .post('/shorten')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ url: `https://example.com/${'a'.repeat(200_000)}` }))
        .expect(413)
        .expect('content-type', PROBLEM_JSON);

      expect(response.body).toEqual({
        type: 'about:blank',
        title: 'Conteúdo muito grande',
        status: 413,
        detail: 'O corpo da requisição excede o tamanho máximo permitido.',
        instance: '/shorten',
      });
    });

    it('informa o rate limit nos headers', async () => {
      const response = await create().expect(201);

      expect(response.headers).toHaveProperty('x-ratelimit-limit');
      expect(response.headers).toHaveProperty('x-ratelimit-remaining');
    });
  });
});
