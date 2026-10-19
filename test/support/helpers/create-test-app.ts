import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { setupSwagger } from '@/config/swagger';

export async function createTestApp({ swagger = false } = {}): Promise<INestApplication> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication({ logger: false });

  if (swagger) {
    setupSwagger(app);
  }

  await app.init();

  return app;
}
