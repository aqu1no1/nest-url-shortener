import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import configuration from '@/config/configuration';
import { envValidationSchema } from '@/config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
  ],
})
export class AppModule {}
