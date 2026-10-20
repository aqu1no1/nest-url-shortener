import { join } from 'node:path';
import { Module, ValidationPipe } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AcceptLanguageResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { DEFAULT_LANGUAGE } from '@/common/constants/i18n.constants';
import { ProblemDetailsFilter } from '@/common/filters/problem-details.filter';
import { RequestValidationException } from '@/common/filters/request-validation.exception';
import { ResponseEnvelopeInterceptor } from '@/common/interceptors/response-envelope.interceptor';
import type { AppConfig } from '@/common/interfaces/app-config.interface';
import configuration from '@/config/configuration';
import { envValidationSchema } from '@/config/env.validation';
import { throttlerOptions } from '@/config/throttler';
import { HealthModule } from '@/modules/health/health.module';
import { PrismaModule } from '@/modules/prisma/prisma.module';
import { UrlsModule } from '@/modules/urls/urls.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      load: [configuration],
      validationSchema: envValidationSchema,
    }),
    I18nModule.forRoot({
      fallbackLanguage: DEFAULT_LANGUAGE,
      fallbacks: { 'en-*': 'en', 'pt-*': DEFAULT_LANGUAGE, pt: DEFAULT_LANGUAGE },
      loaderOptions: { path: join(__dirname, 'i18n'), watch: false },
      resolvers: [{ use: QueryResolver, options: ['lang'] }, AcceptLanguageResolver],
      logging: false,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<AppConfig, true>) =>
        throttlerOptions(config.get('throttle', { infer: true })),
    }),
    PrismaModule,
    HealthModule,
    UrlsModule,
  ],
  providers: [
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        exceptionFactory: (errors) => new RequestValidationException(errors),
      }),
    },
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: ResponseEnvelopeInterceptor },
    { provide: APP_FILTER, useClass: ProblemDetailsFilter },
  ],
})
export class AppModule {}
