import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getOptionsToken } from '@nestjs/throttler';
import { AppModule } from '@/app.module';
import type { AppConfig } from '@/common/interfaces/app-config.interface';
import { setupSwagger } from '@/config/swagger';
import { throttlerOptions } from '@/config/throttler';

interface TestAppOptions {
  swagger?: boolean;
  throttle?: AppConfig['throttle'];
}

export async function createTestApp({
  swagger = false,
  throttle,
}: TestAppOptions = {}): Promise<INestApplication> {
  const builder = Test.createTestingModule({ imports: [AppModule] });

  if (throttle) {
    builder.overrideProvider(getOptionsToken()).useValue(throttlerOptions(throttle));
  }

  const moduleRef = await builder.compile();
  const app = moduleRef.createNestApplication({ logger: false });

  if (swagger) {
    setupSwagger(app);
  }

  await app.init();

  return app;
}
