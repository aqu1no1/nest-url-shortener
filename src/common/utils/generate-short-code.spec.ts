import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SHORT_CODE_LENGTH,
  generateShortCode,
  MAX_SHORT_CODE_LENGTH,
} from '@/common/utils/generate-short-code';

describe('generateShortCode', () => {
  it(`gera ${DEFAULT_SHORT_CODE_LENGTH} caracteres por padrão`, () => {
    expect(generateShortCode()).toHaveLength(DEFAULT_SHORT_CODE_LENGTH);
  });

  it('usa apenas caracteres base62', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateShortCode()).toMatch(/^[0-9A-Za-z]+$/);
    }
  });

  it('respeita o tamanho informado', () => {
    expect(generateShortCode(1)).toHaveLength(1);
    expect(generateShortCode(MAX_SHORT_CODE_LENGTH)).toHaveLength(MAX_SHORT_CODE_LENGTH);
  });

  it.each([0, -1, 1.5, MAX_SHORT_CODE_LENGTH + 1])('recusa tamanho %s', (length) => {
    expect(() => generateShortCode(length)).toThrow(RangeError);
  });

  it('gera códigos diferentes', () => {
    const codes = new Set(Array.from({ length: 1000 }, () => generateShortCode()));

    expect(codes.size).toBeGreaterThan(990);
  });
});
