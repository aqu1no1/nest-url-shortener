import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from '@/app.module';
import { SWAGGER_PATH } from '@/common/constants/swagger.constants';
import type { AppConfig } from '@/common/interfaces/app-config.interface';
import { setupSwagger } from '@/config/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService<AppConfig, true>>(ConfigService);
  const logger = new Logger('Bootstrap');

  app.disable('x-powered-by');
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
