import { NotFoundException } from '@nestjs/common';
import type { I18nService } from 'nestjs-i18n';
import { describe, expect, it, vi } from 'vitest';
import { ShortCodePipe } from '@/common/pipes/short-code.pipe';
import { MAX_SHORT_CODE_LENGTH } from '@/common/utils/generate-short-code';

const i18n = {
  t: vi.fn<(key: string) => string>((key) =>
    key === 'errors.NOT_FOUND' ? 'Não foi possível encontrar a URL.' : 'a URL',
  ),
} as unknown as I18nService;

describe('ShortCodePipe', () => {
  const pipe = new ShortCodePipe(i18n);

  it.each(['abc123', 'A', 'Z9'.repeat(MAX_SHORT_CODE_LENGTH / 2)])('aceita %s', (code) => {
    expect(pipe.transform(code)).toBe(code);
  });

  it.each([
    ['vazio', ''],
    ['byte nulo', 'abc\u0000'],
    ['fora do base62', 'abc-12'],
    ['acentuado', 'ação'],
    ['longo demais', 'a'.repeat(MAX_SHORT_CODE_LENGTH + 1)],
  ])('responde 404 para código %s', (_case, code) => {
    const transform = () => pipe.transform(code);

    expect(transform).toThrow(NotFoundException);
    expect(transform).toThrow('Não foi possível encontrar a URL.');
  });
});
