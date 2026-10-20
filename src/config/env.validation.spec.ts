import { describe, expect, it } from 'vitest';
import { envValidationSchema } from '@/config/env.validation';

const validEnv = {
  NODE_ENV: 'development',
  PORT: '3000',
  DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/url_shortener',
  SWAGGER_ENABLED: 'true',
};

describe('envValidationSchema', () => {
  it('aceita variáveis válidas e converte os tipos', () => {
    const { error, value } = envValidationSchema.validate(validEnv);

    expect(error).toBeUndefined();
    expect(value).toMatchObject({ PORT: 3000, SWAGGER_ENABLED: true });
  });

  it('aplica valores padrão quando opcionais não são informados', () => {
    const { error, value } = envValidationSchema.validate({
      DATABASE_URL: validEnv.DATABASE_URL,
    });

    expect(error).toBeUndefined();
    expect(value).toMatchObject({
      NODE_ENV: 'development',
      PORT: 3000,
      SWAGGER_ENABLED: true,
      THROTTLE_TTL: 60,
      THROTTLE_LIMIT: 100,
    });
  });

  it('exige DATABASE_URL', () => {
    const { error } = envValidationSchema.validate({ ...validEnv, DATABASE_URL: undefined });

    expect(error?.message).toContain('"DATABASE_URL" is required');
  });

  it('rejeita DATABASE_URL que não seja PostgreSQL', () => {
    const { error } = envValidationSchema.validate({
      ...validEnv,
      DATABASE_URL: 'mysql://root@localhost:3306/db',
    });

    expect(error).toBeDefined();
  });

  it('rejeita NODE_ENV desconhecido', () => {
    const { error } = envValidationSchema.validate({ ...validEnv, NODE_ENV: 'staging' });

    expect(error).toBeDefined();
  });

  it.each(['THROTTLE_TTL', 'THROTTLE_LIMIT'])('rejeita %s menor que 1', (name) => {
    const { error } = envValidationSchema.validate({ ...validEnv, [name]: '0' });

    expect(error?.message).toContain(name);
  });
});
