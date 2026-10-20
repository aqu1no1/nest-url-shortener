import Joi from 'joi';
import { NODE_ENVIRONMENTS } from '@/common/constants/environment.constants';
import {
  DEFAULT_THROTTLE_LIMIT,
  DEFAULT_THROTTLE_TTL_SECONDS,
} from '@/common/constants/throttle.constants';
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
  THROTTLE_TTL: Joi.number().integer().min(1).default(DEFAULT_THROTTLE_TTL_SECONDS),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(DEFAULT_THROTTLE_LIMIT),
}).prefs({ abortEarly: false });
