import type { ThrottlerModuleOptions } from '@nestjs/throttler';
import type { AppConfig } from '@/common/interfaces/app-config.interface';

export function throttlerOptions(throttle: AppConfig['throttle']): ThrottlerModuleOptions {
  return {
    throttlers: [throttle],
    errorMessage: 'common.TOO_MANY_REQUESTS',
  };
}
