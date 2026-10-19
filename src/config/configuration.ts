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
});
