import type { NodeEnvironment } from '@/common/interfaces/environment-variables.interface';

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
  throttle: {
    ttl: number;
    limit: number;
  };
}
