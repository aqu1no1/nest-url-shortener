import { describe, expect, it } from 'vitest';
import type { Url } from '@/generated/prisma/client';
import { UrlStatsResponse } from '@/modules/urls/responses/url-stats.response';
import { UrlResponse } from '@/modules/urls/responses/url.response';

const entity: Url = {
  id: '019a01b2-3c4d-7e5f-8a9b-0c1d2e3f4a5b',
  url: 'https://www.example.com/some/long/url',
  shortCode: 'abc123',
  accessCount: 10,
  createdAt: new Date('2026-10-19T12:00:00.000Z'),
  updatedAt: new Date('2026-10-19T12:30:00.000Z'),
};

describe('UrlResponse', () => {
  it('expõe o id e omite accessCount', () => {
    const response = UrlResponse.fromEntity(entity);

    expect(response).toBeInstanceOf(UrlResponse);
    expect(response).toEqual({
      id: entity.id,
      url: entity.url,
      shortCode: 'abc123',
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
  });

  it('serializa as datas em ISO 8601', () => {
    expect(JSON.parse(JSON.stringify(UrlResponse.fromEntity(entity)))).toMatchObject({
      createdAt: '2026-10-19T12:00:00.000Z',
      updatedAt: '2026-10-19T12:30:00.000Z',
    });
  });
});

describe('UrlStatsResponse', () => {
  it('inclui accessCount', () => {
    const response = UrlStatsResponse.fromEntity(entity);

    expect(response).toBeInstanceOf(UrlStatsResponse);
    expect(response).toMatchObject({ id: entity.id, shortCode: 'abc123', accessCount: 10 });
  });
});
