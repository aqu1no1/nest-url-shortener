import { SetMetadata } from '@nestjs/common';
import { SKIP_RESPONSE_ENVELOPE } from '@/common/constants/http.constants';

export const SkipResponseEnvelope = () => SetMetadata(SKIP_RESPONSE_ENVELOPE, true);
