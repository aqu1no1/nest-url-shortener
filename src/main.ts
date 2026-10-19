import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '@/app.module';
import type { AppConfig } from '@/config/configuration';
import { SWAGGER_PATH, setupSwagger } from '@/config/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger('Bootstrap');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableShutdownHooks();

  const swaggerEnabled = config.get('swagger.enabled', { infer: true });
  if (swaggerEnabled) {
    setupSwagger(app);
  }

  const port = config.get('app.port', { infer: true });
  await app.listen(port);

  logger.log(`Aplicação rodando em http://localhost:${port}`);
  if (swaggerEnabled) {
    logger.log(`Swagger UI em http://localhost:${port}/${SWAGGER_PATH}`);
  }
}

void bootstrap();
