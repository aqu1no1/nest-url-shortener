import { Module } from '@nestjs/common';
import { HealthController } from '@/modules/health/health.controller';
import { PrismaModule } from '@/modules/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [HealthController],
})
export class HealthModule {}
