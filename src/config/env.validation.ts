import Joi from 'joi';

export const NODE_ENVIRONMENTS = ['development', 'test', 'production'] as const;

export type NodeEnvironment = (typeof NODE_ENVIRONMENTS)[number];

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DATABASE_URL: string;
  SWAGGER_ENABLED: boolean;
}

export const envValidationSchema = Joi.object<EnvironmentVariables>({
  NODE_ENV: Joi.string()
    .valid(...NODE_ENVIRONMENTS)
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgres', 'postgresql'] })
    .required(),
  SWAGGER_ENABLED: Joi.boolean().default(true),
}).prefs({ abortEarly: false });
