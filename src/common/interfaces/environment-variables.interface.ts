import type { NODE_ENVIRONMENTS } from '@/common/constants/environment.constants';

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DATABASE_URL: string;
  SWAGGER_ENABLED: boolean;
}
