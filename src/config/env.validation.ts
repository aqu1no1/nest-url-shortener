import Joi from 'joi';
import { NODE_ENVIRONMENTS } from '@/common/constants/environment.constants';
import type { EnvironmentVariables } from '@/common/interfaces/environment-variables.interface';

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
