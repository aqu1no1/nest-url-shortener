import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { describe, expect, it } from 'vitest';
import { CreateUrlDto, MAX_URL_LENGTH } from '@/modules/urls/dto/create-url.dto';
import { UpdateUrlDto } from '@/modules/urls/dto/update-url.dto';

const errorKeysFor = async (dto: typeof CreateUrlDto, body: object) => {
  const errors = await validate(plainToInstance(dto, body));
  return errors.flatMap((error) =>
    Object.values(error.constraints ?? {}).map((message) => message.split('|')[0]),
  );
};

describe.each([
  ['CreateUrlDto', CreateUrlDto],
  ['UpdateUrlDto', UpdateUrlDto],
])('%s', (_name, dto) => {
  it.each(['https://www.example.com/some/long/url', 'http://example.com'])(
    'aceita %s',
    async (url) => {
      await expect(errorKeysFor(dto, { url })).resolves.toEqual([]);
    },
  );

  it('exige url', async () => {
    await expect(errorKeysFor(dto, {})).resolves.toContain('validation.URL_REQUIRED');
  });

  it.each(['example.com', 'ftp://example.com/file', 'não é url'])('recusa %s', async (url) => {
    await expect(errorKeysFor(dto, { url })).resolves.toContain('validation.URL_INVALID');
  });

  it(`aceita url com ${MAX_URL_LENGTH} caracteres`, async () => {
    const url = `https://example.com/${'a'.repeat(MAX_URL_LENGTH - 'https://example.com/'.length)}`;

    await expect(errorKeysFor(dto, { url })).resolves.toEqual([]);
  });

  it(`recusa url com mais de ${MAX_URL_LENGTH} caracteres`, async () => {
    const url = `https://example.com/${'a'.repeat(MAX_URL_LENGTH)}`;

    await expect(errorKeysFor(dto, { url })).resolves.toContain('validation.URL_TOO_LONG');
  });

  it.each(['https://example.com/\u0000', 'https://example.com/a\tb', 'https://example.com/\u007f'])(
    'recusa caracteres de controle em %j',
    async (url) => {
      await expect(errorKeysFor(dto, { url })).resolves.toContain('validation.URL_INVALID');
    },
  );

  it('recusa url que não é texto', async () => {
    await expect(errorKeysFor(dto, { url: 123 })).resolves.toContain('validation.URL_STRING');
  });
});
