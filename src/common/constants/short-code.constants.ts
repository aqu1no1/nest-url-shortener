import { MAX_SHORT_CODE_LENGTH } from '@/common/utils/generate-short-code';

export const SHORT_CODE_PATTERN = new RegExp(`^[0-9A-Za-z]{1,${MAX_SHORT_CODE_LENGTH}}$`);
