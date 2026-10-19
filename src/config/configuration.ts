import type { NodeEnvironment } from './env.validation';

export interface AppConfig {
  app: {
    nodeEnv: NodeEnvironment;
    port: number;
  };
  database: {
    url: string;
  };
  swagger: {
    enabled: boolean;
  };
}

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
