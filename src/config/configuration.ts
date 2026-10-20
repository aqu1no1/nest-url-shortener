import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_SECONDS,
} from '@/common/constants/throttle.constants';
import type { AppConfig } from '@/common/interfaces/app-config.interface';
import type { NodeEnvironment } from '@/common/interfaces/environment-variables.interface';

export default (): AppConfig => ({
  app: {
    nodeEnv: (process.env.NODE_ENV as NodeEnvironment) ?? 'development',
    port: Number(process.env.PORT ?? 3000),
  },
  database: {
    url: process.env.DATABASE_URL ?? '',
  },
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
  },
  throttle: {
    ttl: Number(process.env.THROTTLE_TTL ?? DEFAULT_THROTTLE_TTL_SECONDS) * 1000,
    limit: Number(process.env.THROTTLE_LIMIT ?? DEFAULT_THROTTLE_LIMIT),
  },
});
