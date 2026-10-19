import { randomInt } from 'node:crypto';
import {
  DEFAULT_SHORT_CODE_LENGTH,
  MAX_SHORT_CODE_LENGTH,
  SHORT_CODE_ALPHABET,
} from '@/common/constants/short-code.constants';

export function generateShortCode(length = DEFAULT_SHORT_CODE_LENGTH): string {
  if (!Number.isInteger(length) || length < 1 || length > MAX_SHORT_CODE_LENGTH) {
    throw new RangeError(
      `O tamanho do código deve ser um inteiro entre 1 e ${MAX_SHORT_CODE_LENGTH}.`,
    );
  }

  let code = '';
  for (let i = 0; i < length; i++) {
    code += SHORT_CODE_ALPHABET[randomInt(SHORT_CODE_ALPHABET.length)];
  }

  return code;
}
