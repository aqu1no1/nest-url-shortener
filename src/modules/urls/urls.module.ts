import { Module } from '@nestjs/common';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { UrlsController } from '@/modules/urls/urls.controller';
import { UrlsService } from '@/modules/urls/urls.service';

@Module({
  imports: [PrismaModule],
  controllers: [UrlsController],
  providers: [UrlsService],
})
export class UrlsModule {}
